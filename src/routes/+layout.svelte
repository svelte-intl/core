<script lang="ts">
	import type { LayoutProps } from './$types.d.ts';
	import { I18N_CONTEXT_KEY, loadI18n } from '$lib/index.js';
	import { setContext } from 'svelte';

	import './layout.css';

	let { children, data }: LayoutProps = $props();
	loadI18n(() => data.i18n);
</script>

{@render children?.()}
