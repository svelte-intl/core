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
export const getLocale = (
	locale: string,
	supportedLocales: readonly string[],
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
