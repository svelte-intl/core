import { browser } from '$app/environment';

export const load = async ({ parent }) => {
	const data = await parent();

	const i18n = data.i18n.extend({
		en: async () => (await import(`./locales/en.json`)).default,
		nl: async () => (await import(`./locales/nl.json`)).default
	});

	return {
		extendedI18n: i18n
	};
};
