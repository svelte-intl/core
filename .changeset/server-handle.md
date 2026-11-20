---
"@svelte-i18n/core": minor
---

Add `createI18nHandle` from `@svelte-i18n/core/server`: a ready-made SvelteKit `handle` hook that writes the locale into `<html lang="%lang%">` during SSR.

```ts
// src/hooks.server.ts
import { createI18nHandle } from '@svelte-i18n/core/server';

export const handle = createI18nHandle({ locales: ['en', 'nl'], fallbackLocale: 'en' });
```

- Reads the `lang` cookie by default. Set `cookieName` to read another cookie, or pass `locale: (event) => ...` for your own detection, such as the `Accept-Language` header.
- The result is matched against `locales` like `createI18n` does (`nl-BE` → `nl`, unknown → `fallbackLocale`), so only a supported locale ends up in the HTML.
- Works with `sequence()` and with SvelteKit 2 and 3. It does not import `@sveltejs/kit`.
