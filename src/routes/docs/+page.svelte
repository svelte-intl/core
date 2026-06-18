<script lang="ts">
	import type { PageData } from './$types.d.ts';
	import { page } from '$app/state';
	import { useI18n } from '$test/i18n.js';

	const { t, extend } = useI18n();

	extend({
		en: async () => (await import(`./locales/en.json`)).default,
		nl: async () => (await import(`./locales/nl.json`)).default
	});
</script>

<h1>{t('Documentation')}</h1>
<p>{t('Here you can find the documentation for ...')}</p>
