<script lang="ts">
	import type { PageData } from './$types.d.ts';
	import { page } from '$app/state';
	import { useI18n } from '$test/i18n.js';

	const { t } = useI18n();
</script>

<h1>{t('Documentation')}</h1>
<p>{t('Here you can find the documentation for ...')}</p>
