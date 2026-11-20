import { describe, it, expect } from 'vitest';
import { createI18nHandle } from '../lib/server.ts';

const HTML = '<!doctype html><html lang="%lang%"><head></head>';

/** Runs the handle with a fake event and returns the transformed chunks. */
async function run(
	handle: ReturnType<typeof createI18nHandle>,
	{
		cookies = {},
		headers = {},
		chunks = [HTML]
	}: {
		cookies?: Record<string, string>;
		headers?: Record<string, string>;
		chunks?: string[];
	} = {}
) {
	const event = {
		cookies: { get: (name: string) => cookies[name] },
		request: new Request('http://localhost/', { headers }),
		url: new URL('http://localhost/')
	};

	const output: (string | undefined)[] = [];
	await handle({
		event,
		resolve: async (_event, opts) => {
			for (const [i, html] of chunks.entries()) {
				output.push(
					await opts?.transformPageChunk?.({
						html,
						done: i === chunks.length - 1
					})
				);
			}
			return new Response(output.join(''));
		}
	});
	return output;
}

describe('createI18nHandle', () => {
	const locales = ['en', 'nl'] as const;

	it('writes the locale from the default `lang` cookie', async () => {
		const [html] = await run(createI18nHandle({ locales }), {
			cookies: { lang: 'nl' }
		});
		expect(html).toBe('<!doctype html><html lang="nl"><head></head>');
	});

	it('uses a custom cookie name', async () => {
		const handle = createI18nHandle({ locales, cookieName: 'locale' });
		const [html] = await run(handle, { cookies: { lang: 'en', locale: 'nl' } });
		expect(html).toContain('lang="nl"');
	});

	it('falls back for a missing or unsupported cookie', async () => {
		const handle = createI18nHandle({ locales, fallbackLocale: 'nl' });
		expect((await run(handle))[0]).toContain('lang="nl"');
		expect((await run(handle, { cookies: { lang: 'fr' } }))[0]).toContain(
			'lang="nl"'
		);
	});

	it('uses the first locale when there is no fallback', async () => {
		const [html] = await run(createI18nHandle({ locales }));
		expect(html).toContain('lang="en"');
	});

	it('matches a region to its language, like createI18n', async () => {
		const [html] = await run(createI18nHandle({ locales }), {
			cookies: { lang: 'nl-BE' }
		});
		expect(html).toContain('lang="nl"');
	});

	it('never writes an unsupported value into the attribute', async () => {
		const handle = createI18nHandle({
			locales,
			locale: () => '"><script>x</script>'
		});
		const [html] = await run(handle);
		expect(html).toContain('lang="en"');
		expect(html).not.toContain('<script>');
	});

	it('accepts a custom locale detector', async () => {
		const handle = createI18nHandle({
			locales,
			locale: ({ request }) =>
				request.headers.get('accept-language')?.split(',')[0]
		});
		const [html] = await run(handle, {
			headers: { 'accept-language': 'nl-NL,en;q=0.8' }
		});
		expect(html).toContain('lang="nl"');
	});

	it('supports a custom placeholder', async () => {
		const handle = createI18nHandle({ locales, placeholder: '__LANG__' });
		const [html] = await run(handle, {
			cookies: { lang: 'nl' },
			chunks: ['<html lang="__LANG__">']
		});
		expect(html).toBe('<html lang="nl">');
	});

	it('only replaces the placeholder once, leaving page content alone', async () => {
		const [head, body] = await run(createI18nHandle({ locales }), {
			cookies: { lang: 'nl' },
			chunks: [HTML, '<p>Use %lang% in app.html</p>']
		});
		expect(head).toContain('lang="nl"');
		expect(body).toBe('<p>Use %lang% in app.html</p>');
	});
});
