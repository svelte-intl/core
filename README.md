<img src="./static/logo-dark.png" alt="svelte-i18n logo">

### Why another i18n library?

- **Svelte 5** ✅
- **Runes and not stores** ✅
- **Easy to use** ✅
- **SSR ready** ✅
- **No external dependencies** ✅

---

## Getting Started

### 1. Install the package

```bash
npm install @svelte-i18n/core
# or
pnpm add @svelte-i18n/core
```

### 2. `src/routes/+layout.ts`

Edit the `+layout.ts` file or create it if it doesn't exist.

```ts
import { createI18n } from '@svelte-i18n/core';

export const load = async ({ data }) => {
	const i18n = await createI18n({
		locales: ['en', 'nl'],
		locale: 'en',
		fallbackLocale: 'en',
		dictionaries: {
			// You can also import them at the top level
			// instead of a dynamic import
			en: async () => {
				return (await import('$lib/locales/en.json')).default;
			},
			nl: async () => {
				return (await import('$lib/locales/nl.json')).default;
			}
		}
	});

	return {
		i18n
	};
};
```

### 3. `src/routes/+layout.svelte`

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

### 4. `src/lib/i18n.ts`

Create a new file called `i18n.ts` inside `src/lib`. This sets up and exports the context so it can be reused across the app with full type safety.

```ts
import type { I18nContext } from '../routes/+layout.svelte';
import { createContext } from 'svelte';

const [getContext, setContext] = createContext<I18nContext>();

export const useI18n = getContext;
export const createI18n = (i18n: () => I18nContext) => setContext(i18n());
```

### 5. Register the context in `+layout.svelte`

```svelte
<script lang="ts" module>
	export type I18nContext = LayoutProps['data']['i18n'];
</script>

<script lang="ts">
	import type { LayoutProps } from './$types.d.ts';
	import { createI18n } from '$lib/i18n';

	let { children, data }: LayoutProps = $props();
	createI18n(() => data.i18n);
</script>

{@render children?.()}
```

### 6. Use it in any component

```svelte
<script lang="ts">
	import { useI18n } from '$lib/i18n';

	let user = $state('John Doe');
	let { t, getLocale } = useI18n();
</script>

{t('Current language: {locale}', { locale: getLocale() })}
{t('Welcome, {user}', { user })}
```

---

Full documentation: **https://svelte-i18n.com**
