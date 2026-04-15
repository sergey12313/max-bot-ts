import debugFactory from 'debug';
import { Composer } from './composer.js';
import { Context } from './context.js';
import { createClient, type Update } from '../network/api/index.js';
import type { ClientOptions } from '../network/api/client.js';
import { Polling } from '../polling/index.js';
import { Api } from '../api/index.js';

const debug = debugFactory('one-me:main');

type ContextConstructor<Ctx extends Context> = new (update: Update, api: Api, botInfo?: Record<string, unknown>) => Ctx;

export interface BotConfig<Ctx extends Context = Context> {
  clientOptions?: ClientOptions;
  contextType: ContextConstructor<Ctx>;
}

export interface LaunchOptions {
  allowedUpdates?: string[];
}

const defaultConfig: BotConfig = {
  contextType: Context,
};

export class Bot<Ctx extends Context = Context> extends Composer<Ctx> {
  pollingIsStarted = false;
  api: Api;
  botInfo?: { username?: string } & Record<string, unknown>;
  private polling?: Polling;
  config: BotConfig<Ctx>;

  constructor(token: string, config?: Partial<BotConfig<Ctx>>) {
    super();
    this.config = { ...defaultConfig, ...config } as BotConfig<Ctx>;
    this.api = new Api(createClient(token, this.config.clientOptions));
    debug('Created `Bot` instance');
  }

  private handleError: (err: unknown, ctx: Ctx) => Promise<void> | void = (err: unknown, ctx: Ctx) => {
    process.exitCode = 1;
    console.error('Unhandled error while processing', ctx.update);
    throw err;
  };

  catch(handler: (err: unknown, ctx: Ctx) => Promise<void> | void): this {
    this.handleError = handler;
    return this;
  }

  start = async (options?: LaunchOptions): Promise<void> => {
    if (this.pollingIsStarted) {
      debug('Long polling already running');
      return;
    }

    this.pollingIsStarted = true;
    this.botInfo ??= await this.api.getMyInfo() as { username?: string } & Record<string, unknown>;
    this.polling = new Polling(this.api, options?.allowedUpdates);
    debug(`Starting @${this.botInfo?.username ?? 'unknown'}`);
    await this.polling.loop(this.handleUpdate);
  };

  stop = (): void => {
    if (!this.pollingIsStarted) {
      debug('Long polling is not running');
      return;
    }

    this.polling?.stop();
    this.pollingIsStarted = false;
  };

  async handleUpdate(update: Update): Promise<void> {
    const updateId = `${update.update_type}:${update.timestamp}`;
    debug(`Processing update ${updateId}`);
    const UpdateContext = this.config.contextType;
    const ctx = new UpdateContext(update, this.api, this.botInfo);

    try {
      await this.middleware()(ctx, () => Promise.resolve(undefined));
    } catch (err) {
      await this.handleError(err, ctx);
    } finally {
      debug(`Finished processing update ${updateId}`);
    }
  }
}
