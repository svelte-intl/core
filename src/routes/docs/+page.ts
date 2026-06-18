export const load = async ({ parent }) => {
	const data = await parent();

	await data.i18n.extend({
		en: async () => (await import(`./locales/en.json`)).default,
		nl: async () => (await import(`./locales/nl.json`)).default
	});
};
