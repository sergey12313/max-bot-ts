import test from 'node:test';
import assert from 'node:assert/strict';
import { FSM, SceneManager } from '../src/fsm.js';

test('FSM context transitions between steps', async () => {
  const fsm = new FSM();
  const ctx = fsm.context('42');

  ctx.enter('wizard', 'start', { value: 1 });
  assert.deepEqual(ctx.state, { scene: 'wizard', step: 'start', data: { value: 1 } });

  ctx.next('confirm', { approved: true });
  assert.deepEqual(ctx.state, { scene: 'wizard', step: 'confirm', data: { value: 1, approved: true } });

  ctx.leave();
  assert.equal(ctx.state, null);
});

test('SceneManager enters and handles active scene', async () => {
  const fsm = new FSM();
  const manager = new SceneManager(fsm);
  const calls: string[] = [];

  manager.register({
    name: 'profile',
    onEnter: async (_ctx, sceneCtx) => {
      calls.push(`enter:${sceneCtx.state?.scene}`);
    },
    onMessage: async (_ctx, sceneCtx) => {
      calls.push(`message:${sceneCtx.state?.step}`);
    },
  });

  const ctx = {} as object;
  const entered = await manager.enter(ctx as never, 1, 'profile', 'start');
  const handled = await manager.handleMessage(ctx as never, 1);

  assert.equal(entered, true);
  assert.equal(handled, true);
  assert.deepEqual(calls, ['enter:profile', 'message:start']);
});
