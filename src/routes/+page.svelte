<script lang="ts">
	import { useI18n } from '$test/i18n.js';

	const { t, getLocales, setLocale, getLocale } = useI18n();
</script>

<div class="mx-auto mt-12 max-w-150">
	<h1 class="mb-6 text-3xl font-bold">
		{t('active_locale', { locale: getLocale() })}
	</h1>

	<p>
		Hello, welcome to the Svelte Intl package! This package provides
		internationalization (i18n) support for Svelte applications, allowing you to
		easily manage translations and locale-specific formatting. Below is an
		overview of the key features and how to get started with Svelte Intl.
	</p>
</div>
