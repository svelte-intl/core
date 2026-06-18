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
