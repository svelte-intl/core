<img src="https://raw.githubusercontent.com/svelte-intl/core/main/static/logo-dark.png" alt="svelte-i18n logo">

# @svelte-i18n/core

Tiny, type-safe i18n for **Svelte 5** and **SvelteKit**. Runes instead of stores, flat JSON dictionaries, autocompleted translation keys, SSR-safe.

📖 **Documentation: [svelte-i18n.com](https://svelte-i18n.com)**

> Not to be confused with the older, store-based [`svelte-i18n`](https://github.com/kaisermann/svelte-i18n) package. This library has no `$_` store: you call `t()` from `useI18n()`.

### Why another i18n library?

- **Svelte 5** ✅
- **Runes and not stores** ✅
- **Type-safe keys and parameters** ✅
- **Easy to use** ✅
- **SSR ready** ✅
- **Tiny**, with a single 1 kB dependency ([`esm-env`](https://github.com/benmccann/esm-env)) ✅

---

## What this is not

svelte-i18n is not intended to replace feature-rich libraries like Wuchale, inlang or Paraglide.js.
Those solutions offer advanced capabilities for complex translation needs,
such as deeply nested keys or managing large volumes of strings. Instead, svelte-i18n is
designed for projects that require straightforward, key-value translations without extensive configuration or overhead.

## Getting Started

### 1. Install the package

```bash
npm install @svelte-i18n/core
# or
pnpm add @svelte-i18n/core
```

### 2. `src/routes/+layout.server.ts`

Read the locale cookie on the server so the user's language preference survives a page refresh.

```ts
export const load = async ({ cookies }) => {
	const locale = cookies.get('lang');

	return {
		locale: locale ?? 'en'
	};
};
```

### 3. `src/routes/+layout.ts`

Edit the `+layout.ts` file or create it if it doesn't exist.

```ts
import { createI18n } from '@svelte-i18n/core';

export const load = async ({ data }) => {
	const i18n = await createI18n({
		locales: ['en', 'nl'],
		locale: data.locale,
		fallbackLocale: 'en',
		dictionaries: {
			// You can also import them at the top level
			// instead of a dynamic import
			en: async () => {
				return (await import('#lib/locales/en.json')).default;
			},
			nl: async () => {
				return (await import('#lib/locales/nl.json')).default;
			}
		}
	});

	return {
		i18n
	};
};
```

`setLocale` stores the active locale in a cookie named `lang` by default. Override the name with `cookieName`:

```ts
const i18n = await createI18n({
	// ...
	cookieName: 'locale'
});
```

### 4. `src/app.html` and `src/hooks.server.ts`

Set the HTML `lang` attribute for SSR:

```html
<!-- src/app.html -->
<html lang="%lang%">
```

```ts
// src/hooks.server.ts
import { createI18nHandle } from '@svelte-i18n/core/server';

export const handle = createI18nHandle({
	locales: ['en', 'nl'],
	fallbackLocale: 'en'
});
```

The handle reads the `lang` cookie (change it with `cookieName`) and replaces `%lang%` with a supported locale. To combine it with your own hooks, use `sequence(createI18nHandle({ ... }), yourHandle)` from SvelteKit.

On the client, `setLocale` also updates `document.documentElement.lang` when the user switches language.

### 5. `src/routes/+layout.svelte`

Export `I18nContext` so the i18n context type can be shared across the app.

```svelte
<script lang="ts" module>
	export type I18nContext = LayoutProps['data']['i18n'];
</script>

<script lang="ts">
	import type { LayoutProps } from './$types.d.ts';

	let { children, data }: LayoutProps = $props();
</script>

{@render children?.()}
```

### 6. `src/lib/i18n.ts`

Create a new file called `i18n.ts` inside `src/lib`. This sets up and exports the context so it can be reused across the app with full type safety.

```ts
import type { I18nContext } from '../routes/+layout.svelte';
import { createContext } from 'svelte';

const [getContext, setContext] = createContext<I18nContext>();

export const useI18n = getContext;
export const createI18n = (i18n: () => I18nContext) => setContext(i18n());
```

### 7. Register the context in `+layout.svelte`

```svelte
<script lang="ts" module>
	export type I18nContext = LayoutProps['data']['i18n'];
</script>

<script lang="ts">
	import type { LayoutProps } from './$types.d.ts';
	import { createI18n } from '#lib/i18n';

	let { children, data }: LayoutProps = $props();
	createI18n(() => data.i18n);
</script>

{@render children?.()}
```

### 8. Use it in any component

```svelte
<script lang="ts">
	import { useI18n } from '#lib/i18n';

	let user = $state('John Doe');
	let { t, getLocale } = useI18n();
</script>

{t('Current language: {locale}', { locale: getLocale() })}
{t('Welcome, {user}', { user })}
```

---

Full documentation: **https://svelte-i18n.com**
