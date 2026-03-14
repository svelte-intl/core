import { createI18n, I18nContext } from '$lib/index.js';
import { browser } from '$app/environment';

console.time('i18n');
export { I18nContext };
export const { i18n, useI18n } = await createI18n({
	locales: ['en', 'nl'],
	locale: browser ? navigator.language.split('-')[0] : 'en',
	fallbackLocale: 'en',
	dictionaries: {
		en: async () => {
			return (await import('./locales/en.json')).default;
		},
		nl: async () => {
			return (await import('./locales/nl.json')).default;
		}
	}
});
console.timeEnd('i18n');
