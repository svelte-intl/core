import { createI18n } from '$lib/index.js';

export const prerender = true;
export const ssr = false;

export const load = async ({ data }) => {
	const { i18n } = await createI18n({
		locales: ['en', 'nl'],
		locale: data.locale!,
		fallbackLocale: 'en',
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
