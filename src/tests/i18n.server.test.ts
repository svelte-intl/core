import { describe, it, expect, vi } from 'vitest';
import { createI18n } from '../lib/i18n.svelte.ts';

// Simulates SSR: no browser globals.
vi.mock('esm-env', () => ({ BROWSER: false }));

const en = { hello: 'Hello' };
const nl = { hello: 'Hallo' };

describe('createI18n on the server', () => {
	it('is not loading once createI18n has resolved (matches the client)', async () => {
		const i18n = await createI18n({
			locales: ['en', 'nl'],
			locale: 'nl',
			dictionaries: { en, nl: async () => nl }
		});

		expect(i18n.getLoading()).toBe(false);
		expect(i18n.loading.current).toBe(false);
	});

	it('setLocale loads the dictionary without touching document', async () => {
		const i18n = await createI18n({
			locales: ['en', 'nl'],
			locale: 'en',
			dictionaries: { en, nl: async () => nl }
		});

		await i18n.setLocale('nl');
		expect(i18n.getLocale()).toBe('nl');
		expect(i18n.t('hello')).toBe('Hallo');
	});
});
