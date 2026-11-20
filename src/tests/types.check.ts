/**
 * Type-level tests, checked by `pnpm check` (svelte-check).
 * Every `@ts-expect-error` must be needed, or the check fails.
 */
import { createI18n } from '../lib/i18n.svelte.ts';

const en = { 'Hello, {name}!': 'Hello, {name}!', Subscribe: 'Subscribe' };
const nl = { 'Hello, {name}!': 'Hallo, {name}!', Subscribe: 'Abonneren' };

export async function loose() {
	const i18n = await createI18n({
		locales: ['en', 'nl'],
		locale: 'en',
		dictionaries: { en, nl }
	});

	i18n.t('Subscribe');
	i18n.t('Hello, {name}!', { name: 'Ada' });
	i18n.t('not a key'); // unknown keys are allowed by default
	const dynamic: string = 'x';
	i18n.t(dynamic);

	// @ts-expect-error missing params
	i18n.t('Hello, {name}!');
	// @ts-expect-error wrong param name
	i18n.t('Hello, {name}!', { nam: 'Ada' });
	// @ts-expect-error unsupported locale
	await i18n.setLocale('fr');

	const done: Promise<void> = i18n.setLocale('nl');
	await done;
}

export async function strict() {
	const i18n = await createI18n({
		locales: ['en', 'nl'],
		locale: 'en',
		strict: true,
		dictionaries: { en, nl }
	});

	i18n.t('Subscribe');
	i18n.t('Hello, {name}!', { name: 'Ada' });

	// @ts-expect-error typo is an error in strict mode
	i18n.t('Subscibe');
	const dynamic: string = 'x';
	// @ts-expect-error arbitrary strings are rejected in strict mode
	i18n.t(dynamic);
	// @ts-expect-error missing params
	i18n.t('Hello, {name}!');
	// @ts-expect-error unsupported locale
	await i18n.setLocale('fr');
}

// createI18nHandle must be assignable to SvelteKit's Handle, alone and in sequence().
import type { Handle } from '@sveltejs/kit/hooks';
import { sequence } from '@sveltejs/kit/hooks';
import { createI18nHandle } from '../lib/server.ts';

export const handle: Handle = createI18nHandle({
	locales: ['en', 'nl'] as const
});
export const sequenced: Handle = sequence(
	createI18nHandle({
		locales: ['en', 'nl'],
		locale: ({ cookies, request }) =>
			cookies.get('lang') ?? request.headers.get('accept-language')
	}),
	({ event, resolve }) => resolve(event)
);
