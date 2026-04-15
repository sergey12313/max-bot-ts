import test from 'node:test';
import assert from 'node:assert/strict';
import { Bot } from '../src/index.js';

test('Bot routes command updates through middleware stack', async () => {
  const bot = new Bot('token');
  const replies: Array<{ chatId: number; text: string }> = [];

  bot.api.sendMessageToChat = async (chatId: number, text: string) => {
    replies.push({ chatId, text });
    return { chat_id: chatId, text };
  };

  bot.command('start', async (ctx) => {
    await ctx.reply('ok');
  });

  await bot.handleUpdate({
    update_type: 'message_created',
    timestamp: Date.now(),
    message: {
      sender: { user_id: 7, name: 'User' },
      recipient: { chat_id: 42 },
      body: {
        mid: 'm1',
        text: '/start',
        attachments: [],
        markup: [],
      },
    },
  });

  assert.deepEqual(replies, [{ chatId: 42, text: 'ok' }]);
});

test('Bot start initializes polling with bot info', async () => {
  const bot = new Bot('token');
  let loopCalled = false;

  bot.api.getMyInfo = async () => ({ username: 'demo-bot' });

  const stop = bot.stop;
  bot.stop = () => {
    stop();
  };

  const originalLoop = Object.getPrototypeOf((bot as unknown as { polling?: { loop: unknown } }).polling ?? {}).loop;
  void originalLoop;

  const PollingModule = await import('../src/polling/index.js');
  const originalPollingLoop = PollingModule.Polling.prototype.loop;
  PollingModule.Polling.prototype.loop = async function loop() {
    loopCalled = true;
  };

  try {
    await bot.start();
  } finally {
    PollingModule.Polling.prototype.loop = originalPollingLoop;
  }

  assert.equal(loopCalled, true);
  assert.equal(bot.botInfo?.username, 'demo-bot');
});
