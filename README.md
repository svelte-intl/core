# svelte-i18m

Why another i18n library?

- ✅ Easy to use
- ✅ Easiest setup we can come up with
- ✅ Safe to use with SSR by default
- ✅ No external dependencies
- ✅ Very small footprint (8kb)

Most Svelte-specific i18n libraries are outdated and/or rely on Svelte stores instead of runes.
That approach works, but I did not like the $\_('hello') syntax and wanted something more future-proof.

Many libraries also require a complicated setup, and in the case of Wuchale, a lot of configuration.
But what if you just need i18n and nothing more? That is exactly why I created svelte-i18n.
No deep nesting, just a simple key -> value translation dictionary

## Getting started

The following guide will walk you through the process of getting svelte-i18n up and running.

## Configuration

### Install the package

You can install the project via `npm` or `pnpm`.

```bash
npm install @svelte-i18n/core # pnpm add @svelte-i18n/core
```

### Create i18n.ts

Create a new file called `i18n.ts` inside `src/lib` to initialize `svelte-i18n`.

```ts title="src/lib/i18n.ts"
import { createI18n } from '$lib/i18n';
import nl from './locales/nl.json';
import en from './locales/en.json';

// In this example we load the dictionaries using an import
// But its also possible to load the dictionary from a async resource
export const { i18n, useI18n } = await createI18n({
	locales: ['nl', 'en'],
	locale: 'en',
	dictionaries: {
		nl,
		en
	}
});
```

### Edit +layout.svelte

To make svelte-i18n SSR safe we wrap our app with a context provider.
This step is required even if you dont use SSR, since we use the [Context API](https://svelte.dev/docs/svelte/context).

```svelte title="src/routes/+layout.svelte"
<script lang="ts">
    import { I18nContext } from '@svelte-i18n/core';
    import { i18n } from '$lib/i18n';

    let { children } = $props();
</script>

<I18nContext {i18n}>
    {@render children?.()}
</I18nContext>
```

### 🎉 finished, you have setup svelte-i18n

```svelte title="src/routes/+page.svelte"
<script lang="ts">
    import { useI18n } from '$lib/i18n';

    // ...
    let user = $state('Richard');
    let { t } = useI18n();
</script>

{t("Welcome, {user}", { user })}
<!-- Welcome, Richard -->
```
