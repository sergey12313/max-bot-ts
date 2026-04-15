import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createNodeWebhookHandler } from '../src/webhook.js';

class MockResponse {
  statusCode = 200;
  headersSent = false;
  headers = new Map<string, string>();
  body = '';

  setHeader(name: string, value: string) {
    this.headers.set(name.toLowerCase(), value);
  }

  end(body?: string) {
    this.headersSent = true;
    this.body = body ?? '';
  }
}

const createRequest = (body: string, headers: Record<string, string> = {}, method = 'POST') => {
  const req = Readable.from([body]) as Readable & {
    method: string;
    headers: Record<string, string>;
  };
  req.method = method;
  req.headers = headers;
  return req;
};

test('Webhook handler rejects invalid secret', async () => {
  const handler = createNodeWebhookHandler(
    {
      handleUpdate: async () => undefined,
    },
    { secretToken: 'secret' },
  );

  const req = createRequest('{}', { 'x-max-bot-secret': 'wrong' });
  const res = new MockResponse();

  await handler(req as never, res as never);

  assert.equal(res.statusCode, 401);
  assert.match(res.body, /Unauthorized/);
});

test('Webhook handler passes parsed update to bot', async () => {
  let receivedUpdate: unknown;
  const handler = createNodeWebhookHandler({
    handleUpdate: async (update) => {
      receivedUpdate = update;
    },
  });

  const update = { update_type: 'message_created', timestamp: 1 };
  const req = createRequest(JSON.stringify(update));
  const res = new MockResponse();

  await handler(req as never, res as never);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(receivedUpdate, update);
});
