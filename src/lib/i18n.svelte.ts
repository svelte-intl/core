import { BROWSER as browser } from 'esm-env';
import type {
	DictionaryResolver,
	ExtendDictionaries,
	InferDict,
	OptionalParams,
	UnwrapResolver
} from './types.js';
import { getLocale } from './locale.ts';

type ExtensionLayers<Locales extends string> = Partial<
	Record<Locales, DictionaryResolver<Record<string, string>>[]>
>;

const appendExtensions = <Locales extends string>(
	current: ExtensionLayers<Locales> | undefined,
	incoming: ExtendDictionaries<Locales>
): ExtensionLayers<Locales> => {
	const merged: ExtensionLayers<Locales> = { ...current };

	for (const key of Object.keys(incoming) as Locales[]) {
		const value = incoming[key];
		if (value === undefined) continue;
		merged[key] = [...(merged[key] ?? []), value];
	}

	return merged;
};

const resolveExtensions = async <Locales extends string>(
	locale: Locales,
	extensions?: ExtensionLayers<Locales>
) => {
	let merged: Record<string, string> = {};

	for (const entry of extensions?.[locale] ?? []) {
		const chunk = typeof entry === 'function' ? await entry() : entry;
		merged = { ...merged, ...chunk };
	}

	return merged;
};

export type CreateI18nOptions<
	Locales extends string,
	Locale extends Locales = Locales,
	Dicts extends Record<Locales, DictionaryResolver<Record<string, string>>> =
		Record<Locales, DictionaryResolver<Record<string, string>>>,
	Strict extends boolean = false
> = {
	locales: Locales[];
	locale: Locale | (string & {});
	dictionaries: Dicts;
	fallbackLocale?: Locale;
	/** Cookie name used when persisting the locale via `setLocale`. Defaults to `lang`. */
	cookieName?: string;
	/**
	 * When `true`, `t` only accepts keys that exist in the dictionaries, so typos
	 * are type errors. Keys added with `extend` are not known to the type system,
	 * so include them in your dictionary type when using strict mode.
	 * Defaults to `false`.
	 */
	strict?: Strict;
};

export type I18nInstance<
	Dictionary extends Record<string, string> = Record<string, string>,
	Locales extends string = string,
	Locale extends Locales = Locales
> = Awaited<ReturnType<typeof createI18n<Dictionary, Locales, Locale>>>;

/**
 * Loads the dictionary for the specified locale.
 *
 * If the dictionary is a function, it will be called to load the dictionary (which can be asynchronous).
 * If it's an object, it will be returned directly.
 *
 * @param locale - The locale for which to load the dictionary
 * @param dictionaries - The record of dictionaries for all locales
 *
 * @returns The loaded dictionary for the specified locale
 */
const loadDictionary = async <
	Dictionary extends Record<string, string>,
	Locales extends string
>(
	locale: Locales,
	dictionaries: Record<Locales, DictionaryResolver<Dictionary>>,
	dictionariesExtensions?: ExtensionLayers<Locales>
) => {
	const extendedMessages = await resolveExtensions(
		locale,
		dictionariesExtensions
	);

	if (typeof dictionaries[locale] === 'function') {
		return { ...(await dictionaries[locale]()), ...extendedMessages };
	}

	return { ...dictionaries[locale], ...extendedMessages };
};

/**
 * The context key used to store the i18n instance in Svelte's context.
 * This is a unique symbol to avoid collisions with other context keys.
 *
 * You can use this to set the context manually if you need to,
 * but it's generally recommended to use the `I18nContext` provider component
 * to make the i18n instance available in your component tree.
 *
 * @internal
 * @example
 * import { setContext } from 'svelte';
 * import { I18N_CONTEXT_KEY } from '#lib/i18n';
 * import { i18n } from '#lib/i18n';
 *
 * setContext(I18N_CONTEXT_KEY, i18n);
 */
/** Matches `{name}` placeholders. Mirrors `ExtractMessageParams` in types.d.ts. */
const PLACEHOLDER = /\{([^{}]+)\}/g;

/** Own-property check, so keys like `toString` never resolve to prototype members. */
const hasOwn = (object: object, key: PropertyKey) =>
	Object.prototype.hasOwnProperty.call(object, key);

export const I18N_CONTEXT_KEY = Symbol('i18n');
export const createI18n = async <
	Dictionary extends Record<string, string> | InferDict = InferDict,
	Locales extends string = string,
	Locale extends Locales = Locales,
	Dicts extends Record<Locales, DictionaryResolver<Record<string, string>>> =
		Record<Locales, DictionaryResolver<Record<string, string>>>,
	Strict extends boolean = false
>(
	options: CreateI18nOptions<Locales, Locale, Dicts, Strict>
) => {
	type EffectiveDictionary = [Dictionary] extends [InferDict]
		? UnwrapResolver<Dicts[Locales]> extends Record<string, string>
			? UnwrapResolver<Dicts[Locales]>
			: Record<string, string>
		: Dictionary extends Record<string, string>
			? Dictionary
			: Record<string, string>;

	/** In strict mode only known keys are accepted by `t`. */
	type AllowedKey = [Strict] extends [true] ? never : string & {};

	let locales = $state(options.locales);
	const initialLocale = getLocale(
		options.locale as Locales,
		options.locales,
		options.fallbackLocale
	);
	let locale = $state.raw(initialLocale);

	let dictionariesExtensions: ExtensionLayers<Locales> | undefined =
		$state.raw();
	let dictionaries = $state.raw(options.dictionaries);
	const cookieName = options.cookieName ?? 'lang';

	// The initial dictionary is loaded before createI18n resolves, so the
	// instance starts in a settled state on both server and client.
	let dictionary = $state.raw(
		await loadDictionary(
			initialLocale as Locales,
			options.dictionaries,
			undefined
		)
	);

	/**
	 * Locale switches and `extend` calls run one at a time, in call order.
	 * Each task commits its result only after loading succeeded, so `locale`,
	 * `dictionary`, the cookie and `<html lang>` never disagree.
	 */
	let pending = $state(0);
	let queue: Promise<unknown> = Promise.resolve();
	const enqueue = <T>(task: () => Promise<T>): Promise<T> => {
		pending++;
		const run = queue.then(task).finally(() => {
			pending--;
		});
		queue = run.catch(() => {});
		return run;
	};

	/** Incremented on every setLocale call, so superseded switches are skipped. */
	let localeRequest = 0;

	const persistLocale = (value: string) => {
		const secure =
			typeof location !== 'undefined' && location.protocol === 'https:'
				? '; Secure'
				: '';
		document.cookie = `${encodeURIComponent(cookieName)}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax${secure}`;
		document.documentElement.lang = value;
	};

	const t = <Key extends keyof EffectiveDictionary | AllowedKey>(
		key: Key,
		...args: Key extends keyof EffectiveDictionary
			? OptionalParams<EffectiveDictionary[Key], Key>
			: [params?: Record<string, string | number>]
	): string => {
		const value = hasOwn(dictionary, key)
			? (dictionary as Record<string, unknown>)[key as string]
			: undefined;
		// A missing or empty translation falls back to the key itself.
		const message =
			typeof value === 'string' && value !== '' ? value : String(key);
		const params = (args as unknown[])[0] as
			| Record<string, string | number>
			| undefined;

		if (!params) return message;

		// Single pass: every occurrence is replaced, values are inserted
		// literally and never re-scanned for placeholders.
		return message.replace(PLACEHOLDER, (match, name: string) =>
			hasOwn(params, name) ? String(params[name]) : match
		);
	};

	const i18n = {
		/**
		 * The currently active locale. This is a reactive prop,
		 * so you can update it at runtime if needed (e.g. to allow the user to switch languages).
		 *
		 * @readonly
		 */
		get locale() {
			return locale;
		},
		/**
		 * The list of supported locales. This can be used to, for example, render a language switcher in your application.
		 * This is a reactive prop, so you can update it at runtime if needed (e.g. to fetch additional locales from an API).
		 *
		 * If you destructure the i18n instance and want to access the list of supported locales without
		 * having to reference the original `locales` prop directly, you can use the `getLocales` method instead.
		 *
		 * @readonly
		 * @example
		 * import { useI18n } from '#lib/i18n';
		 *
		 * const { locales, setLocale } = useI18n();
		 *
		 * {#each locales as locale}
		 *   <button onclick={() => setLocale(locale)}>
		 *     {locale}
		 *   </button>
		 * {/each}
		 */
		get locales() {
			return locales;
		},
		/**
		 * The messages for each locale. This is a reactive prop,
		 * so you can update it at runtime if needed (e.g. to fetch additional messages from an API).
		 *
		 * @readonly
		 */
		get dictionaries() {
			return dictionaries;
		},
		/**
		 * The currently active dictionary for the selected locale.
		 * This is a derived store that automatically updates whenever the `locale` or `dictionaries` change.
		 *
		 * @readonly
		 */
		get dictionary() {
			return dictionary;
		},
		/**
		 * A boolean indicating whether the i18n instance is currently loading the dictionary for the active locale.
		 * This can be useful for showing a loading indicator while the dictionary is being loaded.
		 *
		 * If you destructure the i18n instance and want to access the loading state without having to
		 * reference the original `loading` prop directly, you can use the `getLoading` method instead.
		 *
		 * @readonly
		 */
		get loading() {
			return { current: pending > 0 };
		},
		/**
		 * Switches to another locale. The dictionary is loaded first; the locale, the
		 * translations and (in the browser) the cookie and `document.documentElement.lang`
		 * are only updated once loading succeeded.
		 *
		 * - An unsupported locale is ignored with a console warning.
		 * - If loading fails, nothing changes and the returned promise rejects.
		 * - When called several times in a row, the last call wins.
		 *
		 * @param newLocale - One of the locales passed to `createI18n`.
		 * @returns A promise that resolves when the switch is done.
		 * @example
		 * import { useI18n } from '#lib/i18n';
		 *
		 * const { setLocale } = useI18n();
		 *
		 * <button onclick={() => setLocale('en')}>Switch to English</button>
		 * <button onclick={() => setLocale('nl')}>Switch to Dutch</button>
		 */
		async setLocale(newLocale: Locales): Promise<void> {
			if (!locales.includes(newLocale)) {
				console.warn(
					`[@svelte-i18n/core] Locale "${newLocale}" is not supported. Supported locales: ${locales.join(', ')}.`
				);
				return;
			}

			const request = ++localeRequest;

			await enqueue(async () => {
				// A newer setLocale call was made while this one was waiting.
				if (request !== localeRequest) return;

				let loaded: Record<string, string>;
				try {
					loaded = await loadDictionary(
						newLocale,
						options.dictionaries,
						dictionariesExtensions
					);
				} catch (error) {
					console.error(
						`[@svelte-i18n/core] Failed to load dictionary for locale "${newLocale}":`,
						error
					);
					throw error;
				}

				// Superseded while loading: don't flash an intermediate locale.
				if (request !== localeRequest) return;

				dictionary = loaded as typeof dictionary;
				locale = newLocale;

				if (browser) persistLocale(newLocale);
			});
		},
		/**
		 * Gets the currently active locale.
		 *
		 * This can be useful for conditionally rendering content based on the active locale,
		 * or for displaying the current language in a UI element.
		 *
		 * @returns The currently active locale.
		 * @example
		 * import { useI18n } from '#lib/i18n';
		 *
		 * const { getLocale } = useI18n();
		 *
		 * <p>Current locale: {getLocale()}</p>
		 */
		getLocale() {
			return locale;
		},
		/**
		 * Gets the list of supported locales.
		 *
		 * This is handy when you destructure the i18n instance and want to access the list of
		 * supported locales without having to reference the original `locales` prop directly.
		 *
		 * This can be useful for rendering a language switcher in your application,
		 * or for validating user input when setting the locale.
		 *
		 * @returns An array of supported locales.
		 * @example
		 * import { useI18n } from '#lib/i18n';
		 * const { getLocales } = useI18n();
		 *
		 * <p>Supported locales: {getLocales().join(', ')}</p>
		 */
		getLocales() {
			return locales;
		},
		/**
		 * Gets the loading state of the i18n instance.
		 * This can be useful for showing a loading indicator while the dictionary is being loaded.
		 *
		 * @returns A boolean indicating whether the i18n instance is currently loading the dictionary.
		 * @example
		 * import { useI18n } from '#lib/i18n';
		 * const { getLoading } = useI18n();
		 *
		 * {#if getLoading()}
		 *   <p>Loading translations...</p>
		 * {:else}
		 *   <p>Translations loaded!</p>
		 * {/if}
		 */
		getLoading() {
			return pending > 0;
		},
		/**
		 * The translation function. This function takes a message key and an optional object of parameters,
		 * and returns the translated message for the currently active locale.
		 *
		 * @param key - The message key to translate. This should correspond to a key in the messages object for the currently active locale.
		 * @param params - An optional object of parameters to replace in the message. The keys in this object should correspond to the placeholders in the message string (e.g. `{name}`), and the values will be substituted into the message.
		 * @returns The translated message with parameters substituted, or the key itself if no translation is found.
		 * @example
		 * import { useI18n } from '#lib/i18n';
		 *
		 * const { t } = useI18n();
		 *
		 * <p>{t('greeting', { name: 'John' })}</p>
		 * // If the messages for the current locale include "greeting": "Hello, {name}!", this will render as "Hello, John!"
		 */
		t,
		/**
		 * Gets the fallback locale defined in the i18n options. It is used when the
		 * requested locale is not supported. It is not used for missing keys:
		 * `t` returns the key itself when a translation is missing.
		 *
		 * This can be useful for conditionally rendering content based on the fallback locale,
		 * or for displaying the fallback language in a UI element.
		 *
		 * @returns The fallback locale defined in the i18n options, or undefined if no fallback locale is set.
		 * @example
		 * import { useI18n } from '#lib/i18n';
		 * const { getFallbackLocale } = useI18n();
		 *
		 * <p>Fallback locale: {getFallbackLocale() ?? 'None'}</p>
		 */
		getFallbackLocale() {
			return options.fallbackLocale;
		},
		/**
		 * Alias for the `t` function, provided for convenience. You can use either `t` or `_` to translate messages in your components.
		 *
		 * @see t
		 */
		_: t,
		/**
		 * Extends the existing dictionaries with additional messages for one or more locales.
		 *
		 * This is useful for cases where you want to add translations dynamically at runtime,
		 * such as when loading additional messages from an API or when allowing users to contribute translations.
		 *
		 * The `dictionaries` parameter should be an object where the keys are locale identifiers (e.g. "en", "nl") and the values are either:
		 * - An object containing the additional messages for that locale, or
		 * - A function that returns a promise which resolves to the additional messages for that locale (e.g. an async function that fetches translations from an API).
		 *
		 * When you call this method, it will merge the provided additional messages with the existing dictionary for each specified locale.
		 * If the same message key exists in both the existing dictionary and the additional messages, the value from the additional messages will take precedence.
		 * Multiple calls to `extend` are accumulated; later values override earlier ones for the same key.
		 * If loading the active locale's extension fails, the extension is not added and the promise rejects.
		 *
		 * @returns A promise that resolves to the i18n instance. Await each call; the promise itself has no `extend` method.
		 * @example
		 * import { useI18n } from '#lib/i18n';
		 *
		 * const { extend } = useI18n();
		 *
		 * // Extend the dictionaries with additional messages for English and Dutch
		 * await extend({
		 *   en: {
		 *     welcome: "Welcome to our application!"
		 *   },
		 *   nl: async () => {
		 *     const response = await fetch('/api/translations/nl');
		 *     const data = await response.json();
		 *     return data;
		 *   }
		 * });
		 */
		async extend<D extends ExtendDictionaries<Locales>>(dictionaries: D) {
			await enqueue(async () => {
				const layers = appendExtensions(dictionariesExtensions, dictionaries);
				let loaded: Record<string, string>;
				try {
					loaded = await loadDictionary(
						locale as Locales,
						options.dictionaries,
						layers
					);
				} catch (error) {
					console.error(
						`[@svelte-i18n/core] Failed to load extended dictionary for locale "${locale}":`,
						error
					);
					throw error;
				}

				// Commit only after a successful load.
				dictionariesExtensions = layers;
				dictionary = loaded as typeof dictionary;
			});
			return i18n;
		}
	};

	return i18n;
};
