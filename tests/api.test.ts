import test from 'node:test';
import assert from 'node:assert/strict';
import { Api } from '../src/api/index.js';
import { MaxError } from '../src/network/api/error.js';
import { RawApi } from '../src/network/api/raw-api.js';
import type { Client } from '../src/network/api/client.js';

type CallRecord = {
  method: string;
  options: Record<string, unknown>;
};

const createMockClient = (
  handler: (input: CallRecord) => Promise<{ status: number; data: unknown }> | { status: number; data: unknown },
): Client => {
  return {
    call: async ({ method, options }) => handler({ method, options: (options ?? {}) as Record<string, unknown> }),
  };
};

test('RawApi uses proper HTTP methods and path params', async () => {
  const calls: CallRecord[] = [];
  const client = createMockClient(async (input) => {
    calls.push(input);
    return { status: 200, data: { ok: true } };
  });
  const raw = new RawApi(client);

  await raw.bots.getMyInfo();
  await raw.chats.getById({ chat_id: 42 });
  await raw.messages.answerOnCallback({ callback_id: 'cb-1', text: 'pong' });

  assert.deepEqual(calls, [
    {
      method: 'me',
      options: { method: 'GET' },
    },
    {
      method: 'chats/{chat_id}',
      options: { path: { chat_id: 42 }, method: 'GET' },
    },
    {
      method: 'answers',
      options: { query: { callback_id: 'cb-1' }, body: { text: 'pong' }, method: 'POST' },
    },
  ]);
});

test('BaseApi-derived methods throw MaxError on non-200 responses', async () => {
  const raw = new RawApi(createMockClient(() => ({
    status: 429,
    data: { code: 'rate.limit', message: 'Too many requests' },
  })));

  await assert.rejects(
    () => raw.subscriptions.getUpdates({ marker: 'm1' }),
    (error: unknown) => {
      assert.ok(error instanceof MaxError);
      assert.equal(error.status, 429);
      assert.equal(error.code, 'rate.limit');
      return true;
    },
  );
});

test('Api sendMessageToChat unwraps message payload', async () => {
  const api = new Api(createMockClient(async () => ({
    status: 200,
    data: { message: { id: 'm1', text: 'hello' } },
  })));

  const message = await api.sendMessageToChat(100, 'hello');

  assert.deepEqual(message, { id: 'm1', text: 'hello' });
});

test('Api getUpdates joins update types into query string', async () => {
  const calls: CallRecord[] = [];
  const api = new Api(createMockClient(async (input) => {
    calls.push(input);
    return { status: 200, data: { updates: [], marker: 'next' } };
  }));

  const result = await api.getUpdates(['message_created', 'message_callback'], { marker: 'prev' });

  assert.deepEqual(result, { updates: [], marker: 'next' });
  assert.deepEqual(calls, [
    {
      method: 'updates',
      options: { query: { types: 'message_created,message_callback', marker: 'prev' }, method: 'GET' },
    },
  ]);
});

test('Api upload wrappers return attachment instances', async () => {
  const api = new Api(createMockClient(async () => ({ status: 200, data: {} })));

  api.upload.image = async () => ({ url: 'https://cdn.example/image.png' });
  api.upload.video = async () => ({ token: 'video-token' });
  api.upload.audio = async () => ({ token: 'audio-token' });
  api.upload.file = async () => ({ token: 'file-token' });

  const image = await api.uploadImage({ timeout: undefined, url: 'https://cdn.example/image.png' });
  const video = await api.uploadVideo({ source: Buffer.from('v') });
  const audio = await api.uploadAudio({ source: Buffer.from('a') });
  const file = await api.uploadFile({ source: Buffer.from('f') });

  assert.deepEqual(image.toJson(), {
    type: 'image',
    payload: { url: 'https://cdn.example/image.png' },
  });
  assert.deepEqual(video.toJson(), {
    type: 'video',
    payload: { token: 'video-token' },
  });
  assert.deepEqual(audio.toJson(), {
    type: 'audio',
    payload: { token: 'audio-token' },
  });
  assert.deepEqual(file.toJson(), {
    type: 'file',
    payload: { token: 'file-token' },
  });
});
