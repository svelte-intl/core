<script lang="ts">
	import { I18nContext, i18n } from '../test/i18n.ts';

	import './layout.css';

	let { children } = $props();
</script>

<I18nContext {i18n}>
	{@render children?.()}
</I18nContext>
