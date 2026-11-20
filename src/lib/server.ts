import { getLocale } from './locale.ts';

/**
 * The parts of SvelteKit's `RequestEvent` that the handle uses. Typed structurally,
 * so this entry works with SvelteKit 2 and 3 without importing from `@sveltejs/kit`.
 */
export type I18nRequestEvent = {
	cookies: { get(name: string): string | undefined };
	request: Request;
	url: URL;
};

type MaybePromise<T> = T | Promise<T>;

type ResolveOptions = {
	transformPageChunk?: (input: {
		html: string;
		done: boolean;
	}) => MaybePromise<string | undefined>;
};

export type I18nHandleOptions = {
	/** The supported locales, the same list you pass to `createI18n`. */
	locales: readonly string[];
	/** Used when the detected locale is not supported. Defaults to the first locale. */
	fallbackLocale?: string;
	/** Cookie that holds the locale, the same one you pass to `createI18n`. Defaults to `lang`. */
	cookieName?: string;
	/**
	 * Detects the locale for a request. Defaults to reading `cookieName`.
	 * The result is matched against `locales` the same way `createI18n` does,
	 * so `nl-BE` becomes `nl` and unknown values become `fallbackLocale`.
	 */
	locale?: (event: I18nRequestEvent) => string | null | undefined;
	/** The text in `src/app.html` that is replaced with the locale. Defaults to `%lang%`. */
	placeholder?: string;
};

/**
 * Creates a SvelteKit `handle` hook that writes the request's locale into
 * `<html lang="%lang%">`, so the server-rendered HTML has the right language.
 * In the browser, `setLocale` keeps `<html lang>` up to date.
 *
 * @example
 * // src/hooks.server.ts
 * import { createI18nHandle } from '@svelte-i18n/core/server';
 * import { LOCALES, DEFAULT_LOCALE, COOKIE_NAME } from '#lib/i18n.ts';
 *
 * export const handle = createI18nHandle({
 *   locales: LOCALES,
 *   fallbackLocale: DEFAULT_LOCALE,
 *   cookieName: COOKIE_NAME
 * });
 *
 * @example
 * // Combine with your own hooks
 * import { sequence } from '@sveltejs/kit/hooks';
 *
 * export const handle = sequence(createI18nHandle({ locales: LOCALES }), myHandle);
 */
export const createI18nHandle = (options: I18nHandleOptions) => {
	const cookieName = options.cookieName ?? 'lang';
	const placeholder = options.placeholder ?? '%lang%';
	const detect =
		options.locale ??
		((event: I18nRequestEvent) => event.cookies.get(cookieName));

	return <Event extends I18nRequestEvent>({
		event,
		resolve
	}: {
		event: Event;
		resolve: (event: Event, opts?: ResolveOptions) => MaybePromise<Response>;
	}): MaybePromise<Response> => {
		const locale = getLocale(
			detect(event) ?? '',
			options.locales,
			options.fallbackLocale
		);

		// The placeholder sits in the first chunk. Stop replacing after that, so
		// page content that happens to contain the placeholder is left alone.
		let replaced = false;

		return resolve(event, {
			transformPageChunk: ({ html }) => {
				if (replaced || !html.includes(placeholder)) return html;
				replaced = true;
				return html.replace(placeholder, locale);
			}
		});
	};
};
