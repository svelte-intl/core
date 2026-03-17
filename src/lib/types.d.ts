declare const _inferDict: unique symbol;
type InferDict = typeof _inferDict;
type UnwrapResolver<R> = R extends () => MaybePromise<
	infer D extends Record<string, string>
>
	? D
	: R extends Record<string, string>
		? R
		: Record<string, string>;

export type DictionaryResolver<Dictionary extends Record<string, string>> =
	| Dictionary
	| (() => MaybePromise<Dictionary>);
export type ExtendDictionaries<Locales extends string> = {
	[K in Locales]?: DictionaryResolver<Record<string, string>>;
};

export type UnwrapDictionary<
	T extends Record<string, string>,
	D extends DictionaryResolver<T>
> = D extends () => MaybePromise<infer R> ? R : D;

export type ExtractMessageParams<T extends string> =
	T extends `${string}{${infer Param}}${infer Rest}`
		? { [K in Param]: string | number } & ExtractMessageParams<Rest>
		: {};
export type Simplify<T> = { [K in keyof T]: T[K] } & {};

export type OptionalParams<Value, Key = never> = Value extends string
	? keyof Simplify<ExtractMessageParams<Value>> extends never
		? Key extends string
			? keyof Simplify<ExtractMessageParams<Key>> extends never
				? [params?: Record<string, string | number>]
				: [params: Simplify<ExtractMessageParams<Key>>]
			: [params?: Record<string, string | number>]
		: [params: Simplify<ExtractMessageParams<Value>>]
	: never;

export type MaybePromise<T> = T | Promise<T>;
