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
