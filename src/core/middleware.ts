import { Context } from './context.js';

export type MaybePromise<T> = T | Promise<T>;
export type NextFn = () => Promise<void>;
export type MiddlewareFn<Ctx extends Context = Context> = (ctx: Ctx, next: NextFn) => MaybePromise<unknown>;

export interface MiddlewareObj<Ctx extends Context = Context> {
  middleware: () => MiddlewareFn<Ctx>;
}

export type Middleware<Ctx extends Context = Context> = MiddlewareFn<Ctx> | MiddlewareObj<Ctx>;
