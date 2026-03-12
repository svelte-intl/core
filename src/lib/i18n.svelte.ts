import { getContext } from 'svelte';

export type ExtractMessageParams<T extends string> =
	T extends `${string}{${infer Param}}${infer Rest}`
		? { [K in Param]: string | number } & ExtractMessageParams<Rest>
		: {};

export type Simplify<T> = { [K in keyof T]: T[K] } & {};

export type OptionalParams<Value, Key = never> = Value extends string
	? keyof Simplify<ExtractMessageParams<Value>> extends never
		? Key extends string
			? keyof Simplify<ExtractMessageParams<Key>> extends never
				? []
				: [params: Simplify<ExtractMessageParams<Key>>]
			: []
		: [params: Simplify<ExtractMessageParams<Value>>]
	: never;

export type CreateI18nOptions<
	Locales extends string,
	Messages extends Record<Locales, Record<string, string>>,
	Locale extends Locales = Locales
> = {
	locales: Locales[];
	locale: Locale;
	messages: Messages;
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
export const createI18n = <
	Locales extends string,
	Messages extends Record<Locales, Record<string, string>>,
	Locale extends Locales = Locales
>(
	options: CreateI18nOptions<Locales, Messages, Locale>
) => {
	let locales = $state(options.locales);
	let locale = $state(options.locale);
	let messages = $state(options.messages);

	const t = <Key extends keyof Messages[Locale]>(
		key: Key,
		...args: OptionalParams<Messages[Locale][Key], Key>
	) => {
		// @ts-expect-error key mapping
		let message: string | number = messages[locale][key] || key;
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
		messages,
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
