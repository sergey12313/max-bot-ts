import type { Context, MiddlewareFn } from './core/index.js';

export interface SessionStorage<T> {
  get(key: string): T | Promise<T | null | undefined> | null | undefined;
  set(key: string, value: T): void | Promise<void>;
  delete(key: string): void | Promise<void>;
}

export class MemorySessionStorage<T> implements SessionStorage<T> {
  private readonly storage = new Map<string, T>();

  get(key: string): T | null {
    return this.storage.get(key) ?? null;
  }

  set(key: string, value: T): void {
    this.storage.set(key, value);
  }

  delete(key: string): void {
    this.storage.delete(key);
  }
}

export interface SessionFlavor<T> {
  session: T | null;
}

export interface SessionMiddlewareOptions<Ctx extends Context, T> {
  storage: SessionStorage<T>;
  getSessionKey: (ctx: Ctx) => string | null | undefined;
  initial?: (ctx: Ctx) => T | null;
}

export class SessionManager<T> {
  constructor(private readonly storage: SessionStorage<T> = new MemorySessionStorage<T>()) {}

  async get(key: string): Promise<T | null> {
    return (await this.storage.get(key)) ?? null;
  }

  async set(key: string, value: T): Promise<void> {
    await this.storage.set(key, value);
  }

  async delete(key: string): Promise<void> {
    await this.storage.delete(key);
  }
}

export const createSessionMiddleware = <Ctx extends Context, T>(
  options: SessionMiddlewareOptions<Ctx, T>
): MiddlewareFn<Ctx & SessionFlavor<T>> => {
  return async (ctx: Ctx & SessionFlavor<T>, next) => {
    const key = options.getSessionKey(ctx);
    const initial = options.initial?.(ctx) ?? null;
    const session = key ? ((await options.storage.get(key)) ?? initial) : initial;

    Object.defineProperty(ctx, 'session', {
      value: session,
      writable: true,
      configurable: true,
      enumerable: true,
    });

    await next();

    if (!key) return;

    if (ctx.session == null) {
      await options.storage.delete(key);
      return;
    }

    await options.storage.set(key, ctx.session);
  };
};
