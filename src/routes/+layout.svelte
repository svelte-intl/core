<script lang="ts" module>
	export type I18nContext = LayoutProps['data']['i18n'];
</script>

<script lang="ts">
	import type { LayoutProps } from './$types.d.ts';
	import { createI18n } from '$test/i18n.js';

	import './layout.css';

	let { children, data }: LayoutProps = $props();
	let { getLoading } = createI18n(() => data.i18n);
</script>

{#if getLoading()}
	<div class="mt-4 flex flex-col items-center">
		<span class="text-lg font-semibold text-gray-700">Loading...</span>
		<div class="relative mt-2 h-16 w-16">
			<div
				class="absolute inset-0 animate-spin rounded-full border-4 border-t-blue-500 border-r-transparent border-b-blue-300 border-l-transparent"
			></div>
			<div class="absolute inset-2 rounded-full border-2 border-gray-200"></div>
		</div>
	</div>
{:else}
	{@render children?.()}
{/if}
