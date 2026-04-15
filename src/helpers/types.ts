export type NullableObject<T = unknown> = Record<string, T | null | undefined>;
export type MaybeArray<T> = T | T[];
export type MaybePromise<T> = T | Promise<T>;
export type Guard<T = unknown> = (value: T) => boolean;
export type Guarded<T> = T extends Guard<infer U> ? U : never;
