import { createI18n, I18nContext } from '$lib/index.js';

export { I18nContext };
export const { i18n, useI18n } = await createI18n({
	locales: ['en', 'nl'],
	locale: 'en',
	dictionaries: {
		en: async () => {
			return (await import('./locales/en.json')).default as Record<string, string>;
		},
		nl: async () => {
			return (await import('./locales/nl.json')).default as Record<string, string>;
		}
	}
});
