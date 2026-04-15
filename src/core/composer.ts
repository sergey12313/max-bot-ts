import { createdMessageBodyHas } from './filters.js';
import type { Guard, MaybeArray } from '../helpers/types.js';
import type { Middleware, MiddlewareFn, MiddlewareObj, NextFn } from './middleware.js';
import { Context, type FilteredContext } from './context.js';

type Triggers = string | RegExp | Array<string | RegExp>;
type TriggerMatcher = (value?: string) => RegExpExecArray | null;
type UpdateFilter<Ctx extends Context> = string | Guard<Ctx['update']>;
type MessageTextShape = {
  body: {
    text?: string;
    markup?: Array<{ type?: string; from?: number; user_id?: number; length?: number }>;
  };
};
type CallbackUpdateShape = {
  callback: {
    payload?: string;
  };
};

export class Composer<Ctx extends Context = Context> implements MiddlewareObj<Ctx> {
  private handler: MiddlewareFn<Ctx>;

  constructor(...middlewares: Array<Middleware<Ctx>>) {
    this.handler = Composer.compose(middlewares);
  }

  middleware(): MiddlewareFn<Ctx> {
    return this.handler;
  }

  use(...middlewares: Array<Middleware<Ctx>>): this {
    this.handler = Composer.compose([this.handler, ...middlewares]);
    return this;
  }

  on<Filter extends UpdateFilter<Ctx>>(filters: MaybeArray<Filter>, ...middlewares: Array<Middleware<FilteredContext<Ctx, Filter>>>): this {
    return this.use(this.filter(filters, ...middlewares));
  }

  command(command: Triggers, ...middlewares: Array<Middleware<Ctx>>): this {
    const normalizedTriggers = normalizeTriggers(command);
    const filter = createdMessageBodyHas('text');
    const handler = Composer.compose(middlewares);

    return this.use(this.filter(filter, (ctx, next) => {
      if (!ctx.message) {
        return next();
      }

      const text = extractTextFromMessage(ctx.message, ctx.myId);
      if (!text) {
        return next();
      }

      const cmd = text.slice(1);

      for (const trigger of normalizedTriggers) {
        const match = trigger(cmd);
        if (match) {
          ctx.match = match;
          return handler(ctx, next);
        }
      }

      return next();
    }));
  }

  hears(triggers: Triggers, ...middlewares: Array<Middleware<Ctx>>): this {
    const normalizedTriggers = normalizeTriggers(triggers);
    const filter = createdMessageBodyHas('text');
    const handler = Composer.compose(middlewares);

    return this.use(this.filter(filter, (ctx, next) => {
      if (!ctx.message) {
        return next();
      }

      const text = extractTextFromMessage(ctx.message, ctx.myId);
      if (!text) {
        return next();
      }

      for (const trigger of normalizedTriggers) {
        const match = trigger(text);
        if (match) {
          ctx.match = match;
          return handler(ctx, next);
        }
      }

      return next();
    }));
  }

  action(triggers: Triggers, ...middlewares: Array<Middleware<Ctx>>): this {
    const normalizedTriggers = normalizeTriggers(triggers);
    const handler = Composer.compose(middlewares);

    return this.use(this.filter('message_callback', (ctx, next) => {
      const callback = (ctx.update as CallbackUpdateShape).callback;
      const { payload } = callback;
      if (!payload) return next();

      for (const trigger of normalizedTriggers) {
        const match = trigger(payload);
        if (match) {
          ctx.match = match;
          return handler(ctx, next);
        }
      }

      return next();
    }));
  }

  filter<Filter extends UpdateFilter<Ctx>>(filters: MaybeArray<Filter>, ...middlewares: Array<Middleware<FilteredContext<Ctx, Filter>>>): MiddlewareFn<Ctx> {
    const handler = Composer.compose(middlewares);
    return (ctx, next) => ctx.has(filters) ? handler(ctx, next) : next();
  }

  static flatten<C extends Context>(mw: Middleware<C>): MiddlewareFn<C> {
    return typeof mw === 'function'
      ? mw
      : (ctx, next) => mw.middleware()(ctx, next);
  }

  static concat<C extends Context>(first: MiddlewareFn<C>, andThen: MiddlewareFn<C>): MiddlewareFn<C> {
    return async (ctx, next) => {
      let nextCalled = false;

      await first(ctx, async () => {
        if (nextCalled) {
          throw new Error('`next` already called before!');
        }

        nextCalled = true;
        await andThen(ctx, next);
      });
    };
  }

  static pass<C extends Context>(_ctx: C, next: NextFn): Promise<void> {
    return next();
  }

  static compose<C extends Context>(middlewares: Array<Middleware<C>>): MiddlewareFn<C> {
    if (!Array.isArray(middlewares)) {
      throw new Error('Middlewares must be an array');
    }

    if (middlewares.length === 0) {
      return Composer.pass;
    }

    return middlewares.map(Composer.flatten).reduce(Composer.concat);
  }
}

const normalizeTriggers = (triggers: Triggers): TriggerMatcher[] => {
  return (Array.isArray(triggers) ? triggers : [triggers]).map((trigger) => {
    if (trigger instanceof RegExp) {
      return (value = '') => {
        trigger.lastIndex = 0;
        return trigger.exec(value.trim());
      };
    }

    const regex = new RegExp(`^${trigger}$`);
    return (value?: string) => regex.exec(value?.trim() ?? '');
  });
};

const extractTextFromMessage = (message: MessageTextShape, myId?: number): string | undefined => {
  const { text } = message.body;
  const mention = message.body.markup?.find((m) => m.type === 'user_mention');

  if (mention && mention.from === 0 && mention.user_id === myId && typeof mention.length === 'number') {
    return text?.slice(mention.length).trim();
  }

  return text;
};
