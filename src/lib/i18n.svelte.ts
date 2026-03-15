import { browser } from '$app/environment';
import type { MaybePromise, OptionalParams } from './types.js';

export type Dictionary =
	| Record<string, string>
	| (() => MaybePromise<Record<string, string>>);
export type UnwrapDictionary<D extends Dictionary> =
	D extends () => MaybePromise<infer R> ? R : D;

export type CreateI18nOptions<
	Locales extends string,
	Dictionaries extends Record<Locales, Dictionary>,
	Locale extends Locales = Locales
> = {
	locales: Locales[];
	locale: Locale | (string & {});
	dictionaries: Dictionaries;
	fallbackLocale?: Locale;
};

export type I18nInstance<
	Locales extends string = string,
	Dictionaries extends Record<Locales, Dictionary> = Record<
		Locales,
		Dictionary
	>,
	Locale extends Locales = Locales
> = Awaited<ReturnType<typeof createI18n<Locales, Dictionaries, Locale>>>;

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
const loadDictionary = async <Locales extends string>(
	locale: Locales,
	dictionaries: Record<Locales, Dictionary>
) => {
	if (typeof dictionaries[locale] === 'function') {
		return await dictionaries[locale]();
	}

	return dictionaries[locale];
};

/**
 * Determines the appropriate locale to use based on the provided locale,
 * the list of supported locales, and an optional fallback locale.
 *
 * @param locale - The locale to check (e.g. "en-US")
 * @param supportedLocales - The list of supported locales (e.g. ["en", "nl"])
 * @param fallbackLocale - An optional fallback locale to use if the provided locale is not supported (e.g. "en")
 *
 * @returns The determined locale to use (e.g. "en")
 */
const getLocale = (
	locale: string,
	supportedLocales: string[],
	fallbackLocale?: string
) => {
	if (supportedLocales.includes(locale)) {
		return locale;
	}

	const language = locale.split('-')[0];
	if (supportedLocales.includes(language)) {
		return language;
	}

	if (fallbackLocale) {
		return fallbackLocale;
	}

	return supportedLocales[0];
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
 * import { I18N_CONTEXT_KEY } from '$lib/i18n';
 * import { i18n } from '$lib/i18n';
 *
 * setContext(I18N_CONTEXT_KEY, i18n);
 */
export const I18N_CONTEXT_KEY = Symbol('i18n');
export const createI18n = async <
	Locales extends string,
	Dictionaries extends Record<Locales, Dictionary>,
	Locale extends Locales = Locales
>(
	options: CreateI18nOptions<Locales, Dictionaries, Locale>
) => {
	console.log(options.locale);

	let loading = $state(true);
	let locales = $state(options.locales);
	let locale = $state.raw(
		getLocale(
			options.locale as Locales,
			options.locales,
			options.fallbackLocale
		)
	);
	let dictionaries = $state.raw(options.dictionaries);
	let dictionary = $state.raw(
		await loadDictionary(locale as Locales, options.dictionaries)
	);

	if (browser) {
		loading = false;
	}

	$effect.root(() => {
		$effect(() => {
			// Prevents the loading state from being set to true on the initial load, which can cause a flash of loading indicators in the UI.
			// By deferring the setting of the loading state until after the initial render,
			// we ensure that the loading indicator only appears when the locale is actually being changed by the user,
			// and not during the initial setup of the i18n instance.
			setTimeout(() => {
				loading = true;
			});

			if (!locales.includes(locale as Locales)) {
				console.warn(
					`Locale "${locale}" is not in the list of supported locales: ${locales.join(', ')}.`
				);

				locale = options.fallbackLocale ?? locales[0];
			}

			loadDictionary(locale as Locales, options.dictionaries)
				.then((loadedDictionary) => {
					dictionary = loadedDictionary;
				})
				.catch((error) => {
					console.error(
						`Failed to load dictionary for locale "${locale}":`,
						error
					);
				})
				.finally(() => {
					loading = false;
				});
		});
	});

	const t = <Key extends keyof UnwrapDictionary<Dictionaries[Locales]>>(
		key: Key,
		...args: OptionalParams<UnwrapDictionary<Dictionaries[Locales]>[Key], Key>
	) => {
		// @ts-expect-error key mapping
		let message: string | number = dictionary[key] || key;
		let params = args[0] as Record<string, string | number> | undefined;

		if (params) {
			for (const [paramKey, paramValue] of Object.entries(params)) {
				message = String(message).replace(`{${paramKey}}`, String(paramValue));
			}
		}

		return message as string;
	};

	const i18n = {
		/**
		 * The list of supported locales. This can be used to, for example, render a language switcher in your application.
		 * This is a reactive prop, so you can update it at runtime if needed (e.g. to fetch additional locales from an API).
		 *
		 * If you destructure the i18n instance and want to access the list of supported locales without
		 * having to reference the original `locales` prop directly, you can use the `getLocales` method instead.
		 *
		 * @readonly
		 * @example
		 * import { useI18n } from '$lib/i18n';
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
			return { current: loading };
		},
		/**
		 * Sets the currently active locale. This will cause all components that use the `t` function to re-render with the new locale.
		 *
		 * @param newLocale - The new locale to set. This should be one of the locales defined in the `locales` prop.
		 * @example
		 * import { useI18n } from '$lib/i18n';
		 *
		 * const { setLocale } = useI18n();
		 *
		 * <button onclick={() => setLocale('en')}>Switch to English</button>
		 * <button onclick={() => setLocale('nl')}>Switch to Dutch</button>
		 */
		setLocale(newLocale: Locales) {
			locale = newLocale as Locale;
		},
		/**
		 * Gets the currently active locale.
		 *
		 * This can be useful for conditionally rendering content based on the active locale,
		 * or for displaying the current language in a UI element.
		 *
		 * @returns The currently active locale.
		 * @example
		 * import { useI18n } from '$lib/i18n';
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
		 * import { useI18n } from '$lib/i18n';
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
		 * import { useI18n } from '$lib/i18n';
		 * const { getLoading } = useI18n();
		 *
		 * {#if getLoading()}
		 *   <p>Loading translations...</p>
		 * {:else}
		 *   <p>Translations loaded!</p>
		 * {/if}
		 */
		getLoading() {
			return loading;
		},
		/**
		 * The translation function. This function takes a message key and an optional object of parameters,
		 * and returns the translated message for the currently active locale.
		 *
		 * @param key - The message key to translate. This should correspond to a key in the messages object for the currently active locale.
		 * @param params - An optional object of parameters to replace in the message. The keys in this object should correspond to the placeholders in the message string (e.g. `{name}`), and the values will be substituted into the message.
		 * @returns The translated message with parameters substituted, or the key itself if no translation is found.
		 * @example
		 * import { useI18n } from '$lib/i18n';
		 *
		 * const { t } = useI18n();
		 *
		 * <p>{t('greeting', { name: 'John' })}</p>
		 * // If the messages for the current locale include "greeting": "Hello, {name}!", this will render as "Hello, John!"
		 */
		t,
		/**
		 * Gets the fallback locale defined in the i18n options. This is the locale that will
		 * be used if the active locale is not supported or if a translation is missing.
		 *
		 * This can be useful for conditionally rendering content based on the fallback locale,
		 * or for displaying the fallback language in a UI element.
		 *
		 * @returns The fallback locale defined in the i18n options, or undefined if no fallback locale is set.
		 * @example
		 * import { useI18n } from '$lib/i18n';
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
		_: t
	};

	return i18n;
};
