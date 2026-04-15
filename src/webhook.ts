import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Update } from './network/api/types/index.js';

export interface WebhookCapableBot {
  handleUpdate(update: Update): Promise<void>;
}

export interface WebhookCallbackOptions {
  onError?: (error: unknown, update: Update) => Promise<void> | void;
}

export interface NodeWebhookHandlerOptions extends WebhookCallbackOptions {
  secretToken?: string;
  secretHeader?: string;
  maxBodySize?: number;
}

const DEFAULT_SECRET_HEADER = 'x-max-bot-secret';
const DEFAULT_MAX_BODY_SIZE = 1024 * 1024;

export const createWebhookCallback = <TBot extends WebhookCapableBot>(
  bot: TBot,
  options: WebhookCallbackOptions = {}
) => {
  return async (update: Update): Promise<void> => {
    try {
      await bot.handleUpdate(update);
    } catch (error) {
      await options.onError?.(error, update);
      throw error;
    }
  };
};

export const createNodeWebhookHandler = <TBot extends WebhookCapableBot>(
  bot: TBot,
  options: NodeWebhookHandlerOptions = {}
) => {
  const callback = createWebhookCallback(bot, options);
  const secretHeader = options.secretHeader?.toLowerCase() ?? DEFAULT_SECRET_HEADER;
  const maxBodySize = options.maxBodySize ?? DEFAULT_MAX_BODY_SIZE;

  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    if (req.method !== 'POST') {
      respondJson(res, 405, { error: 'Method Not Allowed' });
      return;
    }

    if (options.secretToken) {
      const actualToken = req.headers[secretHeader];
      const token = Array.isArray(actualToken) ? actualToken[0] : actualToken;

      if (token !== options.secretToken) {
        respondJson(res, 401, { error: 'Unauthorized' });
        return;
      }
    }

    let body: string;
    try {
      body = await readRequestBody(req, maxBodySize);
    } catch (error) {
      respondJson(res, 413, { error: error instanceof Error ? error.message : 'Payload Too Large' });
      return;
    }

    let update: Update;
    try {
      update = JSON.parse(body) as Update;
    } catch {
      respondJson(res, 400, { error: 'Invalid JSON body' });
      return;
    }

    try {
      await callback(update);
      respondJson(res, 200, { ok: true });
    } catch {
      respondJson(res, 500, { error: 'Failed to process update' });
    }
  };
};

const readRequestBody = async (req: IncomingMessage, maxBodySize: number): Promise<string> => {
  const chunks: Buffer[] = [];
  let totalSize = 0;

  for await (const chunk of req) {
    const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalSize += bufferChunk.length;

    if (totalSize > maxBodySize) {
      throw new Error(`Request body exceeds ${maxBodySize} bytes`);
    }

    chunks.push(bufferChunk);
  }

  return Buffer.concat(chunks).toString('utf8');
};

const respondJson = (
  res: ServerResponse,
  statusCode: number,
  payload: Record<string, unknown>
): void => {
  if (res.headersSent) return;

  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};
