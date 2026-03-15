<script lang="ts" module>
	export type I18nContext = LayoutProps['data']['i18n'];
</script>

<script lang="ts">
	import type { LayoutProps } from './$types.d.ts';
	import { createI18n } from '$test/i18n.js';

	import './layout.css';

	let { children, data }: LayoutProps = $props();
	let { t, getLoading, getLocales, setLocale, getLocale } = createI18n(
		() => data.i18n
	);
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
	<header class="border-b border-gray-200 p-2">
		<div class="container mx-auto flex items-center gap-2">
			<span class="text-sm font-medium text-gray-700">
				{t('Switch language:')}
			</span>
			{#each getLocales() as locale, _ (locale)}
				<button
					class={[
						'cursor-pointer rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700',
						'hover:bg-gray-100 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none',
						locale === getLocale() &&
							'border-indigo-500 bg-indigo-500 text-white hover:bg-indigo-600 focus:ring-indigo-600'
					]}
					onclick={() => setLocale(locale)}
				>
					{locale}
				</button>
			{/each}
		</div>
	</header>
	{@render children?.()}
{/if}
