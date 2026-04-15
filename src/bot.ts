import {
  Bot as BaseBot,
} from './core/bot.js';
import type { Context } from './core/context.js';
import type { Update } from './network/api/types/index.js';
import {
  createNodeWebhookHandler,
  createWebhookCallback,
  type NodeWebhookHandlerOptions,
  type WebhookCallbackOptions,
} from './webhook.js';

// Upstream keeps `handleUpdate` private in typings, although it exists on the runtime instance.
// We widen it here to expose webhook handling without reimplementing the whole bot class.
// @ts-ignore Upstream private member is intentionally made public in the fork.
export interface Bot<Ctx extends Context = Context> {
  handleUpdate(update: Update): Promise<void>;
}

// @ts-ignore Upstream private member is intentionally made public in the fork.
export class Bot<Ctx extends Context = Context> extends BaseBot<Ctx> {
  webhookCallback(options?: WebhookCallbackOptions) {
    return createWebhookCallback(this, options);
  }

  nodeWebhookHandler(options?: NodeWebhookHandlerOptions) {
    return createNodeWebhookHandler(this, options);
  }
}
