---
'@svelte-i18n/core': patch
---

Use `esm-env` instead of `$app/environment` to detect the browser, so the package works with both SvelteKit 2 and SvelteKit 3.
