import type { Plugin, ViteDevServer } from 'vite';
import { parseAst } from 'rollup/parseAst';
import { execFile } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import type {
	CallExpression,
	Identifier,
	ImportExpression,
	MemberExpression,
	ObjectExpression,
	Property,
	ArrowFunctionExpression,
	FunctionExpression,
	Literal
} from 'estree';

/** Stable path for the merged dictionary written before each CLI run. */
const MERGED_TMP = join(tmpdir(), 'i18n-merged.json');

/**
 * Walks an ESTree AST and calls `visitor` for every node.
 */
function walk(node: object, visitor: (node: object) => void) {
	visitor(node);
	for (const value of Object.values(node)) {
		if (value && typeof value === 'object') {
			if (Array.isArray(value)) {
				for (const child of value) {
					if (child && typeof child === 'object') walk(child, visitor);
				}
			} else if ('type' in value) {
				walk(value, visitor);
			}
		}
	}
}

/** Shape returned by both extractor functions. */
type ExtractedSources = {
	/** Locale key → list of fetch() URL strings */
	fetchUrls: Record<string, string[]>;
	/** Locale key → list of import() path strings */
	importPaths: Record<string, string[]>;
};

/**
 * Given the ObjectExpression passed to `.extend({...})`, extract every
 * static string passed to `fetch(url)` or `import(path)` inside each locale function.
 */
function extractSources(obj: ObjectExpression): ExtractedSources {
	const fetchUrls: Record<string, string[]> = {};
	const importPaths: Record<string, string[]> = {};

	for (const prop of obj.properties) {
		if (prop.type !== 'Property') continue;
		const property = prop as Property;

		const key =
			property.key.type === 'Identifier'
				? property.key.name
				: property.key.type === 'Literal'
					? String((property.key as Literal).value)
					: null;
		if (!key) continue;

		const fn = property.value as ArrowFunctionExpression | FunctionExpression;
		if (
			fn.type !== 'ArrowFunctionExpression' &&
			fn.type !== 'FunctionExpression'
		)
			continue;

		walk(fn, (node) => {
			if (!('type' in node)) return;

			// fetch('...')
			if (node.type === 'CallExpression') {
				const call = node as unknown as CallExpression;
				const arg = call.arguments[0];
				if (
					call.callee.type === 'Identifier' &&
					call.callee.name === 'fetch' &&
					arg?.type === 'Literal' &&
					typeof (arg as Literal).value === 'string'
				) {
					(fetchUrls[key] ??= []).push((arg as Literal).value as string);
				}
			}

			// import('...')
			if (node.type === 'ImportExpression') {
				const imp = node as unknown as ImportExpression;
				if (
					imp.source.type === 'Literal' &&
					typeof (imp.source as Literal).value === 'string'
				) {
					(importPaths[key] ??= []).push(
						(imp.source as Literal).value as string
					);
				}
			}
		});
	}

	return { fetchUrls, importPaths };
}

/**
 * Returns true if the value is a flat Record<string, string> —
 * the shape expected for a locale dictionary.
 */
function isLocaleDictionary(value: unknown): value is Record<string, string> {
	return (
		typeof value === 'object' &&
		value !== null &&
		!Array.isArray(value) &&
		Object.values(value as object).every((v) => typeof v === 'string')
	);
}

/**
 * Applies the result of extractSources — reading import() paths from disk and
 * queuing fetch() URLs against the dev server.
 * Shared by both the .extend() and createI18n() handlers.
 *
 * `resolveId` is `this.resolve` from the transform hook — it honours Vite aliases.
 */
async function processSources(
	{ fetchUrls, importPaths }: ExtractedSources,
	id: string,
	fetchPromises: Promise<void>[],
	devServer: ViteDevServer | null,
	mergeAndSchedule: (dict: Record<string, string>) => void,
	isLocaleDictionary: (v: unknown) => v is Record<string, string>,
	resolveId: (id: string, importer: string) => Promise<{ id: string } | null>
) {
	for (const paths of Object.values(importPaths)) {
		for (const p of paths) {
			try {
				// Use Vite's resolver so aliases like $test/* are expanded correctly.
				const resolved = await resolveId(p, id);
				const absPath = resolved?.id ?? resolve(dirname(id), p);
				const json = JSON.parse(readFileSync(absPath, 'utf-8'));
				if (isLocaleDictionary(json)) mergeAndSchedule(json);
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : String(err);
				console.warn(`[i18n] could not read import path ${p}:`, msg);
			}
		}
	}

	if (!devServer || !Object.keys(fetchUrls).length) return;

	const address = devServer.httpServer?.address();
	const port = typeof address === 'object' && address ? address.port : 5173;

	for (const urls of Object.values(fetchUrls)) {
		for (const url of urls) {
			const input = /^https?:\/\//.test(url)
				? url
				: `http://localhost:${port}${url}`;

			fetchPromises.push(
				fetch(input)
					.then((r) => r.json())
					.then((json) => {
						if (isLocaleDictionary(json)) mergeAndSchedule(json);
					})
					.catch((err: unknown) => {
						const msg = err instanceof Error ? err.message : String(err);
						console.warn(`[i18n] could not fetch ${input}:`, msg);
					})
			);
		}
	}
}

export function i18nPlugin(): Plugin {
	let devServer: ViteDevServer | null = null;

	/** Accumulated union of all locale keys seen so far. */
	const mergedDict: Record<string, string> = {};

	/** Debounce handle — we only run the CLI once after all locales settle. */
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	function mergeAndSchedule(dict: Record<string, string>) {
		Object.assign(mergedDict, dict);

		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			writeFileSync(MERGED_TMP, JSON.stringify(mergedDict, null, '\t'));
			execFile(
				'npx',
				['@svelte-i18n/cli', 'generate-types', '--input', MERGED_TMP],
				(err, _stdout, stderr) => {
					if (err) {
						console.error('[i18n] generate-types failed:', stderr);
					} else {
						console.log(
							`[i18n] generated merged types (${Object.keys(mergedDict).length} keys)`
						);
					}
				}
			);
		}, 200);
	}

	return {
		name: 'vite-plugin-i18n',

		// Exclude the generated types file from Vite's file watcher so writing
		// it doesn't trigger an HMR reload.
		config() {
			return {
				server: { watch: { ignored: ['**/i18n-types.d.ts'] } }
			};
		},

		configureServer(server) {
			devServer = server;

			server.middlewares.use((req, res, next) => {
				const chunks: Buffer[] = [];

				const originalWrite = res.write.bind(res);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(res as any).write = (chunk: any, ...args: any[]) => {
					if (chunk)
						chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
					return originalWrite(chunk, ...args);
				};

				const originalEnd = res.end.bind(res);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(res as any).end = (chunk?: any, ...args: any[]) => {
					if (chunk)
						chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));

					const contentType = res.getHeader('content-type');
					if (
						typeof contentType === 'string' &&
						contentType.includes('application/json')
					) {
						try {
							const body = Buffer.concat(chunks).toString('utf-8');
							const json = JSON.parse(body);
							if (isLocaleDictionary(json)) mergeAndSchedule(json);
						} catch {
							// not valid JSON or wrong shape — ignore
						}
					}

					return originalEnd(chunk, ...args);
				};

				next();
			});
		},

		async transform(code, id) {
			if (!/\.[jt]s$/.test(id)) return null;
			if (!code.includes('.extend(') && !code.includes('createI18n('))
				return null;

			const ast = parseAst(code);
			const fetchPromises: Promise<void>[] = [];
			const sourcePromises: Promise<void>[] = [];
			const resolveId = this.resolve.bind(this);

			walk(ast, (node: object) => {
				if (!('type' in node) || node.type !== 'CallExpression') return;

				const call = node as unknown as CallExpression;

				// --- .extend({ en: ..., nl: ... }) ---
				if (
					call.callee.type === 'MemberExpression' &&
					(call.callee as MemberExpression).property.type === 'Identifier' &&
					((call.callee as MemberExpression).property as Identifier).name ===
						'extend'
				) {
					const arg = call.arguments[0];
					if (arg?.type === 'ObjectExpression') {
						sourcePromises.push(
							processSources(
								extractSources(arg as unknown as ObjectExpression),
								id,
								fetchPromises,
								devServer,
								mergeAndSchedule,
								isLocaleDictionary,
								resolveId
							)
						);
					}
					return;
				}

				// --- createI18n({ dictionaries: { en: ..., nl: ... } }) ---
				if (
					call.callee.type === 'Identifier' &&
					(call.callee as Identifier).name === 'createI18n'
				) {
					const arg = call.arguments[0];
					if (arg?.type !== 'ObjectExpression') return;

					const dictProp = (arg as unknown as ObjectExpression).properties.find(
						(p) =>
							p.type === 'Property' &&
							(p as Property).key.type === 'Identifier' &&
							((p as Property).key as Identifier).name === 'dictionaries'
					);
					if (!dictProp || dictProp.type !== 'Property') return;

					const dictValue = (dictProp as Property).value;
					if (dictValue.type !== 'ObjectExpression') return;

					sourcePromises.push(
						processSources(
							extractSources(dictValue as unknown as ObjectExpression),
							id,
							fetchPromises,
							devServer,
							mergeAndSchedule,
							isLocaleDictionary,
							resolveId
						)
					);
					return;
				}
			});

			await Promise.all(sourcePromises);
			await Promise.all(fetchPromises);
			return null;
		}
	};
}
