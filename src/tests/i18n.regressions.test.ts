import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createI18n } from '../lib/i18n.svelte.ts';

vi.mock('esm-env', () => ({ BROWSER: true }));

const doc = { cookie: '', documentElement: { lang: 'en' } };
vi.stubGlobal('document', doc);
vi.stubGlobal('location', { protocol: 'http:' });

beforeEach(() => {
	doc.cookie = '';
	doc.documentElement.lang = 'en';
});

const en = { hello: 'Hello', greeting: 'Hello, {name}!' };
const nl = { hello: 'Hallo', greeting: 'Hallo, {name}!' };

const delay = <T>(ms: number, value: T) =>
	new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

/** Lets pending timers (e.g. a deferred `loading = true`) fire. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 10));

describe('setLocale', () => {
	it('switches locale and dictionary together, after loading', async () => {
		const i18n = await createI18n({
			locales: ['en', 'nl'],
			locale: 'en',
			dictionaries: { en, nl: () => delay(20, nl) }
		});

		const pending = i18n.setLocale('nl');
		expect(i18n.getLocale()).toBe('en');
		expect(i18n.t('hello')).toBe('Hello');
		expect(i18n.getLoading()).toBe(true);

		await pending;
		expect(i18n.getLocale()).toBe('nl');
		expect(i18n.t('hello')).toBe('Hallo');
	});

	it('resets loading to false after a fast (sync) dictionary load', async () => {
		const i18n = await createI18n({
			locales: ['en', 'nl'],
			locale: 'en',
			dictionaries: { en, nl }
		});

		await i18n.setLocale('nl');
		await flush();
		expect(i18n.getLoading()).toBe(false);
		expect(i18n.loading.current).toBe(false);
	});

	it('keeps the previous locale, dictionary and cookie when loading fails', async () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => {});
		const i18n = await createI18n({
			locales: ['en', 'nl'],
			locale: 'en',
			dictionaries: {
				en,
				nl: async (): Promise<typeof nl> => {
					throw new Error('network down');
				}
			}
		});

		await expect(i18n.setLocale('nl')).rejects.toThrow('network down');
		await flush();

		expect(i18n.getLocale()).toBe('en');
		expect(i18n.t('hello')).toBe('Hello');
		expect(i18n.getLoading()).toBe(false);
		expect(doc.cookie).toBe('');
		expect(doc.documentElement.lang).toBe('en');
		error.mockRestore();
	});

	it('ignores unsupported locales without touching the cookie or <html lang>', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const i18n = await createI18n({
			locales: ['en', 'nl'],
			locale: 'nl',
			fallbackLocale: 'en',
			dictionaries: { en, nl }
		});

		// @ts-expect-error unsupported locale
		await i18n.setLocale('"><script>');
		await flush();

		expect(warn).toHaveBeenCalled();
		expect(i18n.getLocale()).toBe('nl');
		expect(doc.cookie).toBe('');
		expect(doc.documentElement.lang).toBe('en');
		expect(i18n.getLoading()).toBe(false);
		warn.mockRestore();
	});

	it('writes the cookie and <html lang> after a successful switch', async () => {
		const i18n = await createI18n({
			locales: ['en', 'nl'],
			locale: 'en',
			cookieName: 'locale',
			dictionaries: { en, nl }
		});

		await i18n.setLocale('nl');
		expect(doc.cookie).toBe(
			'locale=nl; path=/; max-age=31536000; SameSite=Lax'
		);
		expect(doc.documentElement.lang).toBe('nl');
	});

	it('adds Secure to the cookie on https', async () => {
		vi.stubGlobal('location', { protocol: 'https:' });
		const i18n = await createI18n({
			locales: ['en', 'nl'],
			locale: 'en',
			dictionaries: { en, nl }
		});

		await i18n.setLocale('nl');
		expect(doc.cookie).toBe(
			'lang=nl; path=/; max-age=31536000; SameSite=Lax; Secure'
		);
		vi.stubGlobal('location', { protocol: 'http:' });
	});

	it('ends on the last requested locale when switches overlap', async () => {
		const i18n = await createI18n({
			locales: ['en', 'nl', 'de'],
			locale: 'en',
			dictionaries: {
				en,
				nl: () => delay(30, nl),
				de: () =>
					delay(5, { hello: 'Hallo (de)', greeting: 'Hallo, {name}! (de)' })
			}
		});

		const a = i18n.setLocale('nl');
		const b = i18n.setLocale('de');
		await Promise.all([a, b]);

		expect(i18n.getLocale()).toBe('de');
		expect(i18n.t('hello')).toBe('Hallo (de)');
		expect(doc.cookie).toContain('lang=de');
		expect(i18n.getLoading()).toBe(false);
	});

	it('applies extend() called while a locale switch is in flight', async () => {
		const i18n = await createI18n({
			locales: ['en', 'nl'],
			locale: 'en',
			dictionaries: { en, nl: () => delay(20, nl) }
		});

		const switching = i18n.setLocale('nl');
		await i18n.extend({ en: { extra: 'Extra' }, nl: { extra: 'Extra (nl)' } });
		await switching;

		expect(i18n.getLocale()).toBe('nl');
		expect(i18n.t('extra')).toBe('Extra (nl)');
		expect(i18n.t('hello')).toBe('Hallo');
	});
});

describe('t interpolation', () => {
	const make = (dictionary: Record<string, string>) =>
		createI18n({
			locales: ['en'],
			locale: 'en',
			dictionaries: { en: dictionary }
		});

	it('replaces every occurrence of a placeholder', async () => {
		const i18n = await make({ twice: '{n} and {n}' });
		expect(i18n.t('twice', { n: 1 })).toBe('1 and 1');
	});

	it('inserts values literally, without replacement patterns', async () => {
		const i18n = await make({ price: 'Price: {amount}' });
		expect(i18n.t('price', { amount: '$&' })).toBe('Price: $&');
		expect(i18n.t('price', { amount: "$'$`$$" })).toBe("Price: $'$`$$");
	});

	it('does not substitute inside inserted values', async () => {
		const i18n = await make({ pair: '{a} {b}' });
		expect(i18n.t('pair', { a: '{b}', b: 'X' })).toBe('{b} X');
	});

	it('leaves placeholders without a value untouched', async () => {
		const i18n = await make({ pair: '{a} {b}' });
		expect(i18n.t('pair', { a: 'A' })).toBe('A {b}');
	});

	it('supports placeholder names with spaces and dashes', async () => {
		const i18n = await make({ x: 'Hi {first name} {last-name}' });
		expect(i18n.t('x', { 'first name': 'Ada', 'last-name': 'Lovelace' })).toBe(
			'Hi Ada Lovelace'
		);
	});

	it('never returns inherited Object.prototype members', async () => {
		const i18n = await make({});
		expect(i18n.t('toString')).toBe('toString');
		expect(i18n.t('constructor')).toBe('constructor');
		expect(i18n.t('__proto__')).toBe('__proto__');
	});

	it('treats an empty translation as missing and returns the key', async () => {
		const i18n = await make({ untranslated: '' });
		expect(i18n.t('untranslated')).toBe('untranslated');
	});

	it('interpolates params into the key when the key is missing', async () => {
		const i18n = await make({});
		expect(i18n.t('Hello, {name}!', { name: 'Ada' })).toBe('Hello, Ada!');
	});
});
