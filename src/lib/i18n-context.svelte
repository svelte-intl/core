<script lang="ts">
	import { setContext, type Snippet } from 'svelte';
	import { I18N_CONTEXT_KEY } from './i18n.svelte.ts';

	type Props = {
		children: Snippet;
		i18n: Awaited<ReturnType<typeof import('./i18n.svelte.ts').createI18n>>;
	};

	const { children, i18n }: Props = $props();
	setContext(I18N_CONTEXT_KEY, i18n);
</script>

{@render children()}
