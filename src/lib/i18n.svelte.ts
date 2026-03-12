import type { MaybePromise, OptionalParams } from './types.js';
import { getContext } from 'svelte';

export type Dictionary = Record<string, string> | (() => MaybePromise<Record<string, string>>);
export type UnwrapDictionary<D extends Dictionary> = D extends () => MaybePromise<infer R> ? R : D;

export type CreateI18nOptions<
	Locales extends string,
	Dictionaries extends Record<Locales, Dictionary>,
	Locale extends Locales = Locales
> = {
	locales: Locales[];
	locale: Locale;
	dictionaries: Dictionaries;
};

/**
 * Loads the dictionaries for all locales. This function takes the `dictionaries` object from the `createI18n` options,
 * and returns a new object where each dictionary is resolved to its actual messages.
 *
 * If a dictionary is a function, it will be called and awaited; if it's an object, it will be used as-is.
 *
 * @param dictionaries - The object containing the dictionaries for each locale. The values can be either objects or functions that return a promise of an object.
 * @private
 */
const loadLocales = async <Locales extends string>(
	dictionaries: Record<Locales, Dictionary>
): Promise<Record<Locales, Record<string, string>>> => {
	const entries = await Promise.all(
		Object.entries<Dictionary>(dictionaries).map(async ([locale, dictionary]) => [
			locale,
			typeof dictionary === 'function' ? await dictionary() : dictionary
		])
	);

	return Object.fromEntries(entries) as Record<Locales, Record<string, string>>;
};

/**
 * The context key used to store the i18n instance in Svelte's context. This is a unique symbol to avoid collisions with other context keys.
 *
 * @deprecated use useI18n instead to access the i18n instance in your components.
 * The I18N_CONTEXT_KEY is an internal implementation detail and should be avoided in favor of the useI18n hook,
 * which provides a cleaner and more intuitive API for accessing the i18n functionality in your components.
 *
 * @internal
 * @example
 * import { getContext } from 'svelte';
 * import { I18N_CONTEXT_KEY } from '$lib/i18n';
 *
 * const i18n = getContext(I18N_CONTEXT_KEY);
 */
export const I18N_CONTEXT_KEY = Symbol('i18n');
export const createI18n = async <
	Locales extends string,
	Dictionaries extends Record<Locales, Dictionary>,
	Locale extends Locales = Locales
>(
	options: CreateI18nOptions<Locales, Dictionaries, Locale>
) => {
	let locales = $state(options.locales);
	let locale = $state(options.locale);
	let dictionaries = $state(await loadLocales(options.dictionaries));
	let dictionary = $derived(dictionaries[locale]);

	const t = <Key extends keyof UnwrapDictionary<Dictionaries[Locale]>>(
		key: Key,
		...args: OptionalParams<UnwrapDictionary<Dictionaries[Locale]>[Key], Key>
	) => {
		// @ts-expect-error key mapping
		let message: string | number = dictionary[key] || key;
		// @ts-expect-error args bounds
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
		locales,
		/**
		 * The messages for each locale. This is a reactive prop,
		 * so you can update it at runtime if needed (e.g. to fetch additional messages from an API).
		 */
		dictionaries,
		/**
		 * The currently active dictionary for the selected locale.
		 * This is a derived store that automatically updates whenever the `locale` or `dictionaries` change.
		 */
		dictionary,
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
		 * Gets the currently active locale. This can be useful for conditionally rendering content based on the active locale, or for displaying the current language in a UI element.
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
		 * Alias for the `t` function, provided for convenience. You can use either `t` or `_` to translate messages in your components.
		 *
		 * @see t
		 */
		_: t
	};

	const useI18n = () => getContext<typeof i18n>(I18N_CONTEXT_KEY);

	return {
		i18n,
		/**
		 * A Svelte context hook that allows you to access the i18n instance from any component within the provider.
		 * This is the primary way to use the i18n functionality in your components.
		 *
		 * Don't forget to wrap your component tree with the `I18nContext` provider to make the i18n instance available via this hook.
		 *
		 * @example
		 * // my-component.svelte
		 * import { useI18n } from '$lib/i18n';
		 *
		 * const { t, setLocale } = useI18n();
		 */
		useI18n
	};
};
