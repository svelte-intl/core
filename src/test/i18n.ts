import type { I18nContext } from '../routes/+layout.svelte';
import { createContext } from 'svelte';

const [getContext, setContext] = createContext<I18nContext>();

export const useI18n = getContext;
export const createI18n = (i18n: () => I18nContext) => setContext(i18n());
