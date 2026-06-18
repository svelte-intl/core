import { createI18n } from '$lib/index.js';
import type { I18nDictionary } from '../../i18n-types.d.ts';

export const load = async ({ data }) => {
	const i18n = await createI18n<I18nDictionary>({
		locales: ['en', 'nl'],
		locale: data.locale,
		fallbackLocale: 'nl',
		dictionaries: {
			en: async () => {
				return (await import('$test/locales/en.json')).default;
			},
			nl: async () => {
				return (await import('$test/locales/nl.json')).default;
			}
		}
	});

	return {
		i18n
	};
};
