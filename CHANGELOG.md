# @svelte-i18n/core

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
