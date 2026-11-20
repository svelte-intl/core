import { createI18nHandle } from '#lib/server.js';

export const handle = createI18nHandle({
	locales: ['en', 'nl'],
	fallbackLocale: 'nl'
});
