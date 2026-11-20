---
"@svelte-i18n/core": minor
---

Fix locale switching, interpolation and loading state; add an opt-in `strict` mode.

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
