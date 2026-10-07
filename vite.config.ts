import adapter from '@sveltejs/adapter-auto';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { i18nPlugin } from './src/lib/vite-plugin-i18n.js';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			// Force runes in our own code only; dependencies (including SvelteKit's
			// own runtime components) pick their mode themselves.
			dynamicCompileOptions: ({ filename }) =>
				filename.includes('node_modules') ? undefined : { runes: true },
			exclude: ['**/test.*'],

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter()
		}),
		i18nPlugin()
	]
});
