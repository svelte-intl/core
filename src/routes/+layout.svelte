<script lang="ts">
	import { I18N_CONTEXT_KEY } from '$lib/index.js';
	import { setContext } from 'svelte';
	import { i18n } from '../test/i18n.ts';

	import './layout.css';

	let { children } = $props();
	setContext(I18N_CONTEXT_KEY, i18n);
</script>

{@render children?.()}
