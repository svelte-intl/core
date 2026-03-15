import { describe, it, expect, vi } from 'vitest';
import { createI18n } from '../lib/i18n.svelte.ts';

vi.mock('$app/environment', () => ({ browser: true }));

const en = {
	hello: 'Hello',
	greeting: 'Hello, {name}!',
	farewell: 'Goodbye, {name}! You have {count} messages.'
};

const nl = {
	hello: 'Hallo',
	greeting: 'Hallo, {name}!',
	farewell: 'Dag, {name}! Je hebt {count} berichten.'
};

const makeDictionaries = () => ({ en, nl });

describe('createI18n', () => {
	describe('initialization', () => {
		it('returns an instance with expected methods and properties', async () => {
			const i18n = await createI18n({
				locales: ['en', 'nl'],
				locale: 'en',
				dictionaries: makeDictionaries()
			});

			expect(i18n).toHaveProperty('t');
			expect(i18n).toHaveProperty('_');
			expect(i18n).toHaveProperty('setLocale');
			expect(i18n).toHaveProperty('getLocale');
			expect(i18n).toHaveProperty('getLocales');
			expect(i18n).toHaveProperty('getLoading');
			expect(i18n).toHaveProperty('getFallbackLocale');
			expect(i18n).toHaveProperty('locales');
			expect(i18n).toHaveProperty('dictionaries');
			expect(i18n).toHaveProperty('dictionary');
		});

		it('sets the correct locale on initialization', async () => {
			const i18n = await createI18n({
				locales: ['en', 'nl'],
				locale: 'nl',
				dictionaries: makeDictionaries()
			});
			expect(i18n.getLocale()).toBe('nl');
		});

		it('loads the correct dictionary for the initial locale', async () => {
			const i18n = await createI18n({
				locales: ['en', 'nl'],
				locale: 'en',
				dictionaries: makeDictionaries()
			});
			expect(i18n.dictionary).toEqual(en);
		});

		it('exposes the locales array', async () => {
			const i18n = await createI18n({
				locales: ['en', 'nl'],
				locale: 'en',
				dictionaries: makeDictionaries()
			});
			expect(i18n.locales).toEqual(['en', 'nl']);
		});

		it('exposes the dictionaries object', async () => {
			const dicts = makeDictionaries();
			const i18n = await createI18n({
				locales: ['en', 'nl'],
				locale: 'en',
				dictionaries: dicts
			});
			expect(i18n.dictionaries).toEqual(dicts);
		});
	});

	describe('locale resolution', () => {
		it('resolves a full locale tag ("en-US") to its base language ("en")', async () => {
			const i18n = await createI18n({
				locales: ['en', 'nl'],
				locale: 'en-US',
				dictionaries: makeDictionaries()
			});
			expect(i18n.getLocale()).toBe('en');
		});

		it('resolves a full locale tag ("nl-BE") to its base language ("nl")', async () => {
			const i18n = await createI18n({
				locales: ['en', 'nl'],
				locale: 'nl-BE',
				dictionaries: makeDictionaries()
			});
			expect(i18n.getLocale()).toBe('nl');
		});

		it('falls back to fallbackLocale when locale is unsupported', async () => {
			const i18n = await createI18n({
				locales: ['en', 'nl'],
				locale: 'fr',
				fallbackLocale: 'nl',
				dictionaries: makeDictionaries()
			});
			expect(i18n.getLocale()).toBe('nl');
		});

		it('falls back to the first locale when locale is unsupported and no fallbackLocale is set', async () => {
			const i18n = await createI18n({
				locales: ['en', 'nl'],
				locale: 'fr',
				dictionaries: makeDictionaries()
			});
			expect(i18n.getLocale()).toBe('en');
		});

		it('uses an exact locale match when available', async () => {
			const fr = {
				hello: 'Bonjour',
				greeting: 'Bonjour, {name}!',
				farewell: 'Au revoir, {name}! Vous avez {count} messages.'
			};
			const i18n = await createI18n({
				locales: ['en', 'nl', 'fr'],
				locale: 'fr',
				dictionaries: { en, nl, fr }
			});
			expect(i18n.getLocale()).toBe('fr');
		});
	});

	describe('dictionary loading', () => {
		it('supports async loader functions', async () => {
			const lazyEn = vi.fn().mockResolvedValue(en);
			const i18n = await createI18n({
				locales: ['en', 'nl'],
				locale: 'en',
				dictionaries: { en: lazyEn, nl }
			});
			expect(lazyEn).toHaveBeenCalled();
			expect(i18n.dictionary).toEqual(en);
		});

		it('supports synchronous loader functions', async () => {
			const syncLoader = vi.fn().mockReturnValue(en);
			const i18n = await createI18n({
				locales: ['en', 'nl'],
				locale: 'en',
				dictionaries: { en: syncLoader, nl }
			});
			expect(syncLoader).toHaveBeenCalled();
			expect(i18n.dictionary).toEqual(en);
		});
	});

	describe('getFallbackLocale', () => {
		it('returns the fallback locale when set', async () => {
			const i18n = await createI18n({
				locales: ['en', 'nl'],
				locale: 'en',
				fallbackLocale: 'en',
				dictionaries: makeDictionaries()
			});
			expect(i18n.getFallbackLocale()).toBe('en');
		});

		it('returns undefined when no fallback locale is set', async () => {
			const i18n = await createI18n({
				locales: ['en', 'nl'],
				locale: 'en',
				dictionaries: makeDictionaries()
			});
			expect(i18n.getFallbackLocale()).toBeUndefined();
		});
	});

	describe('getLocales', () => {
		it('returns the list of supported locales', async () => {
			const i18n = await createI18n({
				locales: ['en', 'nl'],
				locale: 'en',
				dictionaries: makeDictionaries()
			});
			expect(i18n.getLocales()).toEqual(['en', 'nl']);
		});

		it('getLocales() and locales getter return the same value', async () => {
			const i18n = await createI18n({
				locales: ['en', 'nl'],
				locale: 'en',
				dictionaries: makeDictionaries()
			});
			expect(i18n.getLocales()).toEqual(i18n.locales);
		});
	});

	describe('getLoading', () => {
		it('returns a boolean', async () => {
			const i18n = await createI18n({
				locales: ['en', 'nl'],
				locale: 'en',
				dictionaries: makeDictionaries()
			});
			expect(typeof i18n.getLoading()).toBe('boolean');
		});

		it('loading getter exposes a .current boolean', async () => {
			const i18n = await createI18n({
				locales: ['en', 'nl'],
				locale: 'en',
				dictionaries: makeDictionaries()
			});
			expect(typeof i18n.loading.current).toBe('boolean');
		});
	});

	describe('t (translation function)', () => {
		it('returns the translated string for a known key', async () => {
			const i18n = await createI18n({
				locales: ['en', 'nl'],
				locale: 'en',
				dictionaries: makeDictionaries()
			});
			expect(i18n.t('hello')).toBe('Hello');
		});

		it('returns the key itself when no translation is found', async () => {
			const i18n = await createI18n({
				locales: ['en', 'nl'],
				locale: 'en',
				dictionaries: makeDictionaries()
			});
			// @ts-expect-error intentionally testing a missing key
			expect(i18n.t('missing_key')).toBe('missing_key');
		});

		it('substitutes a single parameter', async () => {
			const i18n = await createI18n({
				locales: ['en', 'nl'],
				locale: 'en',
				dictionaries: makeDictionaries()
			});
			expect(i18n.t('greeting', { name: 'Alice' })).toBe('Hello, Alice!');
		});

		it('substitutes multiple parameters', async () => {
			const i18n = await createI18n({
				locales: ['en', 'nl'],
				locale: 'en',
				dictionaries: makeDictionaries()
			});
			expect(i18n.t('farewell', { name: 'Bob', count: 5 })).toBe(
				'Goodbye, Bob! You have 5 messages.'
			);
		});

		it('substitutes a numeric 0 parameter correctly', async () => {
			const i18n = await createI18n({
				locales: ['en', 'nl'],
				locale: 'en',
				dictionaries: makeDictionaries()
			});
			expect(i18n.t('farewell', { name: 'Carol', count: 0 })).toBe(
				'Goodbye, Carol! You have 0 messages.'
			);
		});

		it('translates correctly for the nl locale', async () => {
			const i18n = await createI18n({
				locales: ['en', 'nl'],
				locale: 'nl',
				dictionaries: makeDictionaries()
			});
			expect(i18n.t('greeting', { name: 'Jan' })).toBe('Hallo, Jan!');
		});
	});

	describe('_ (alias for t)', () => {
		it('_ is the same reference as t', async () => {
			const i18n = await createI18n({
				locales: ['en', 'nl'],
				locale: 'en',
				dictionaries: makeDictionaries()
			});
			expect(i18n._).toBe(i18n.t);
		});

		it('_ translates keys correctly', async () => {
			const i18n = await createI18n({
				locales: ['en', 'nl'],
				locale: 'en',
				dictionaries: makeDictionaries()
			});
			expect(i18n._('greeting', { name: 'Alice' })).toBe('Hello, Alice!');
		});
	});

	describe('setLocale', () => {
		it('updates getLocale() after setLocale()', async () => {
			const i18n = await createI18n({
				locales: ['en', 'nl'],
				locale: 'en',
				dictionaries: makeDictionaries()
			});
			i18n.setLocale('nl');
			expect(i18n.getLocale()).toBe('nl');
		});

		it('can switch locale back and forth', async () => {
			const i18n = await createI18n({
				locales: ['en', 'nl'],
				locale: 'en',
				dictionaries: makeDictionaries()
			});
			i18n.setLocale('nl');
			expect(i18n.getLocale()).toBe('nl');
			i18n.setLocale('en');
			expect(i18n.getLocale()).toBe('en');
		});
	});
});
