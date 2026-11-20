# @svelte-i18n/core

## 3.1.0

### Minor Changes

- 2938a2b: Fix locale switching, interpolation and loading state; add an opt-in `strict` mode.

  **`setLocale`**
  - Now returns a `Promise<void>`. The dictionary is loaded first. The locale, translations, cookie and `<html lang>` are only updated after loading succeeded, so they never disagree.
  - If loading fails, nothing changes and the promise rejects. Before, the locale and cookie switched while the old translations stayed, and the error was an unhandled rejection.
  - An unsupported locale is ignored with a warning. Before, it was written to the cookie and `<html lang>` first.
  - Overlapping calls end on the last requested locale.
  - The cookie value is URL-encoded and gets `Secure` on https.

  Code that reads `getLocale()` right after calling `setLocale()` must now `await setLocale(...)` first.

  **Loading state**
  - `getLoading()` no longer gets stuck at `true` after a locale switch.
  - `getLoading()` is now `false` after `createI18n` resolves on the server too, which fixes a hydration mismatch.

  **`extend`**
  - Runs in order with locale switches, so an `extend` during a switch is no longer lost.
  - A failing extension is not kept.

  **`t`**
  - Replaces every occurrence of a placeholder (`'{n} and {n}'`).
  - Inserts values literally: `$&` and `$'` in a value are no longer replacement patterns, and values are not re-scanned for placeholders.
  - Never returns `Object.prototype` members such as `toString`.

  **`strict` option**
  - New opt-in `strict: true` option makes unknown keys a type error in `t`.

  **Types**
  - The `i18n` prop of `I18nContext` is now typed correctly.

  **Vite plugin: `@svelte-i18n/core/vite`**
  - The type-generation plugin is now exported as `import { i18n } from '@svelte-i18n/core/vite'`. Before, it was shipped but could not be imported.
  - Tested with Vite 7 (Rollup) and Vite 8 (Rolldown). It no longer imports `rollup`, which is missing in Vite 8.
  - Types are generated in-process. Before, the plugin spawned `npx @svelte-i18n/cli`.
  - It writes `src/lib/i18n-types.d.ts` by default. Change this with the `output` option.
  - The file is only written when its content changes.
  - Keys are tracked per module, so removed keys disappear from the types. Edits to JSON dictionaries are picked up in dev.
  - It no longer inspects every JSON response of the dev server.
  - It no longer shares a temp file between projects, which could leak keys from one project into another.

  **Package metadata**
  - Added `description`, `license`, `keywords` and `bugs` to `package.json`.
  - Declared `vite` as an optional peer dependency.
  - The README logo now uses an absolute URL, so it shows on npm.

- 2938a2b: Add `createI18nHandle` from `@svelte-i18n/core/server`: a ready-made SvelteKit `handle` hook that writes the locale into `<html lang="%lang%">` during SSR.

  ```ts
  // src/hooks.server.ts
  import { createI18nHandle } from '@svelte-i18n/core/server';

  export const handle = createI18nHandle({
  	locales: ['en', 'nl'],
  	fallbackLocale: 'en'
  });
  ```

  - Reads the `lang` cookie by default. Set `cookieName` to read another cookie, or pass `locale: (event) => ...` for your own detection, such as the `Accept-Language` header.
  - The result is matched against `locales` like `createI18n` does (`nl-BE` → `nl`, unknown → `fallbackLocale`), so only a supported locale ends up in the HTML.
  - Works with `sequence()` and with SvelteKit 2 and 3. It does not import `@sveltejs/kit`.

## 3.0.2

### Patch Changes

- cb5eacd: Use `esm-env` instead of `$app/environment` to detect the browser, so the package works with both SvelteKit 2 and SvelteKit 3.

## 3.0.1

### Patch Changes

- c221add: remove empty changeset

## 3.0.0

### Major Changes

- 2d42957: feat; new extend functionality to use fine grained translations

### Minor Changes

- ed8f36d: feat [#12]; save locale in cookie and update HTML lang attr on locale change

## 2.0.1

### Patch Changes

- c37b420: Add thumbnail
- 1dd1b58: Update README.md
- 550bfd6: Update readme.md
- 9849b4f: Update README.md
- 434f9c2: Update README.md

## 2.0.0

### Major Changes

- 84a3484: simplify setup and better SSR integration

### Patch Changes

- 2e3a8f2: Remove console.log

## 1.3.0

### Minor Changes

- 0b2299b: Fix bug locales not switching

## 1.2.0

### Minor Changes

- adfcf94: Fix some bug regarding the fallback locale

### Patch Changes

- aedac1b: Converted exposed properties to getters, to keep reactivity
- 08b65a1: Fixed a potential reace condition
- 2b31dc8: Fixed another issue regarding fallback locale

## 1.1.0

### Minor Changes

- 877d079: Expose new loading property, that can be used to prevent for various cases
- e1b05d8: Add support for fallback locale and correctly fallback to locale if locale does not exist
- f97fe91: Load only the dictionary of the active locale instead of loading all dictionaries

### Patch Changes

- 0d036a5: Add guidelines and license

## 1.0.8

### Patch Changes

- 9f9b824: Revert token name
- 0745d82: Update release file to also release to gh

## 1.0.7

### Patch Changes

- 6efe4bd: Explain what this library is not to prevent confusion

## 1.0.6

### Patch Changes

- 58a649c: Update readme to explain both context methods

## 1.0.5

### Patch Changes

- c6e1f01: Remove deprecated warning to allow to set the context manually

## 1.0.4

### Patch Changes

- Add repository

## 1.0.3

### Patch Changes

- Add homepage

## 1.0.2

### Patch Changes

- Update readme

## 1.0.1

### Patch Changes

- Make second argument of `t` and `_` loosly typed if typescript cannot find params in the key

## 1.0.0

### Major Changes

- Renamed `messages` to `dictionaries` and allow an async callback to load dictionaries (breaking)
- Dictionaries now support a callback to load dictionaries from async. For example, you can fetch dictionaries from the database or URL
