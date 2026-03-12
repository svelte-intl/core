<script lang="ts">
	import { useI18n } from '../test/i18n.ts';

	const { t, setLocale, getLocale, locales } = useI18n();
	console.log(useI18n());
</script>

<div class="mx-auto mt-12 max-w-150">
	<h1 class="mb-6 text-3xl font-bold">{t('Hello, {username}', { username: 'John' })}</h1>

	<p>
		Hello, welcome to the Svelte Intl package! This package provides internationalization (i18n)
		support for Svelte applications, allowing you to easily manage translations and locale-specific
		formatting. Below is an overview of the key features and how to get started with Svelte Intl.
	</p>

	<h5 class="font-xl mt-4 mb-2 font-bold">{t('Change locale')} ({getLocale()})</h5>
	<div class="flex items-start">
		{#each locales as locale}
			<button
				class="mr-2 mb-2 cursor-pointer rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
				onclick={() => setLocale(locale)}
			>
				{locale}
			</button>
		{/each}
	</div>
</div>
