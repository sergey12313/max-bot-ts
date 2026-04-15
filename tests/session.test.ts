import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionMiddleware, MemorySessionStorage, SessionManager } from '../src/session.js';

test('SessionManager persists values in storage', async () => {
  const manager = new SessionManager(new MemorySessionStorage<{ step: string }>());

  await manager.set('chat:1', { step: 'start' });
  assert.deepEqual(await manager.get('chat:1'), { step: 'start' });

  await manager.delete('chat:1');
  assert.equal(await manager.get('chat:1'), null);
});

test('Session middleware hydrates and writes back session state', async () => {
  const storage = new MemorySessionStorage<{ count: number }>();
  const middleware = createSessionMiddleware({
    storage,
    getSessionKey: () => 'user:1',
    initial: () => ({ count: 0 }),
  });

  const ctx = {} as { session: { count: number } | null };
  await middleware(ctx, async () => {
    assert.deepEqual(ctx.session, { count: 0 });
    ctx.session = { count: 1 };
  });

  assert.deepEqual(await storage.get('user:1'), { count: 1 });
});
