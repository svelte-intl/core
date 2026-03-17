import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { i18nPlugin } from './src/lib/vite-plugin-i18n.js';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), i18nPlugin()]
});
