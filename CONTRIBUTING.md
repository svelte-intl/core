# Contributing to @svelte-i18n/core

Thank you for your interest in contributing! This guide covers everything you need to get started.

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [pnpm](https://pnpm.io/)
- [Svelte 5](https://svelte.dev/)

## Getting started

```bash
git clone https://github.com/svelte-intl/core.git
cd core
pnpm install
```

## Development

```bash
pnpm dev       # start the dev server
pnpm check     # run svelte-check + TypeScript
pnpm lint      # check formatting and linting
pnpm format    # auto-fix formatting with Prettier
pnpm build     # build the package
```

## Project structure

```
src/
  lib/          # library source (exported package)
  routes/       # demo/test app
  test/         # test fixtures and locale files
```

## Making changes

- Keep changes focused — one concern per PR.
- This library is intentionally minimal. Avoid adding features that belong in heavier solutions like Paraglide.js or Wuchale.
- All source files use TypeScript. Svelte components use Svelte 5 runes (`$state`, `$derived`, `$props`), not stores.
- Flat key→value dictionaries only — no deep nesting.

## Code style

Formatting is enforced by **Prettier** and linting by **ESLint** (with `typescript-eslint` and `eslint-plugin-svelte`). Before submitting, run:

```bash
pnpm format && pnpm lint
```

PRs that fail `pnpm lint` or `pnpm check` will not be merged.

## Releasing (maintainers)

This project uses [Changesets](https://github.com/changesets/changesets) for versioning.

1. Add a changeset describing your change:
   ```bash
   pnpm changesets
   ```
2. Commit the generated `.changeset` file alongside your changes.
3. When ready to release, a maintainer runs:
   ```bash
   pnpm changesets:version   # bumps versions + updates CHANGELOG
   pnpm changesets:publish   # builds + publishes to npm
   ```

## Submitting a pull request

1. Fork the repository and create a branch from `main`.
2. Make your changes and add a changeset (`pnpm changesets`) if your change affects the published package.
3. Push your branch and open a PR against `main`.
4. Ensure `pnpm lint` and `pnpm check` pass.

## Reporting issues

Open an issue on [GitHub](https://github.com/svelte-intl/core/issues) with a clear description and a minimal reproduction if possible.
