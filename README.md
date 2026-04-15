# `max-bot-ts`

TypeScript-фреймворк и SDK для разработки ботов на платформе MAX.

`max-bot-ts` дает практичный runtime для MAX с:

- `Bot` и `Context` на основе middleware
- long polling и webhook-обработчиком для Node.js
- сессиями и легковесными сценами/FSM
- типизированной API-оберткой и экспортируемыми моделями `update`/`message`/`chat`
- хелперами для клавиатур, кнопок и вложений

## Установка

```bash
npm install max-bot-ts
```

Требования:

- Node.js `18+`
- валидный токен бота MAX

По умолчанию клиент использует `https://platform-api.max.ru`.

## Быстрый старт

```ts
import { Bot, Keyboard } from 'max-bot-ts';

const bot = new Bot(process.env.BOT_TOKEN!);

bot.command('start', async (ctx) => {
  await ctx.reply('Привет из MAX', {
    attachments: [
      Keyboard.inlineKeyboard([
        [Keyboard.button.callback('Пинг', 'ping')],
      ]),
    ],
  });
});

bot.action('ping', async (ctx) => {
  await ctx.answerOnCallback({
    message: {
      text: 'pong',
    },
  });
});

await bot.start();
```

## Polling

`bot.start()` запускает long polling и продолжает принимать обновления, пока не будет вызван `bot.stop()`.

```ts
import { Bot } from 'max-bot-ts';

const bot = new Bot(process.env.BOT_TOKEN!);

bot.command('start', async (ctx) => {
  await ctx.reply('Бот запущен');
});

await bot.start({
  allowedUpdates: ['message_created', 'message_callback'],
});
```

## Webhook

`max-bot-ts` поставляется с простым HTTP-обработчиком для Node.js, поэтому его можно встроить в свой сервер без дополнительного фреймворка.

```ts
import { createServer } from 'node:http';
import { Bot } from 'max-bot-ts';

const bot = new Bot(process.env.BOT_TOKEN!);
const webhook = bot.nodeWebhookHandler({
  secretToken: process.env.WEBHOOK_SECRET,
});

createServer(async (req, res) => {
  if (req.url !== '/a') {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }

  await webhook(req, res);
}).listen(4000);
```

Также можно создать callback, не привязанный к конкретному транспорту:

```ts
import { createWebhookCallback } from 'max-bot-ts/webhook';

const callback = createWebhookCallback(bot);
await callback(update);
```

## Сессии

Используйте `createSessionMiddleware`, если нужен per-user или per-chat state.

```ts
import { Bot } from 'max-bot-ts';
import { createSessionMiddleware, MemorySessionStorage } from 'max-bot-ts/session';

type SessionData = {
  step?: 'idle' | 'waiting_phone';
};

const bot = new Bot(process.env.BOT_TOKEN!);

bot.use(createSessionMiddleware({
  storage: new MemorySessionStorage<SessionData>(),
  getSessionKey: (ctx) => ctx.chatId?.toString(),
  initial: () => ({ step: 'idle' }),
}));
```

## Сцены

Для простых многошаговых сценариев используйте `FSM` и `SceneManager`.

```ts
import { Bot } from 'max-bot-ts';
import { FSM, SceneManager, type Scene } from 'max-bot-ts/scenes';

const bot = new Bot(process.env.BOT_TOKEN!);
const scenes = new SceneManager(new FSM());

const profileScene: Scene = {
  name: 'profile',
  async onEnter(ctx, fsm) {
    fsm.next('name');
    await ctx.reply('Отправьте ваше имя');
  },
  async onMessage(ctx, fsm) {
    if (fsm.state?.step === 'name') {
      fsm.leave();
      await ctx.reply(`Сохранено: ${ctx.message?.body.text ?? 'unknown'}`);
    }
  },
};

scenes.register(profileScene);
```

## Экспорты пакета

- `max-bot-ts` - основной API: `Bot`, `Context`, `Composer`, `Api`, `Keyboard`, вложения и re-export webhook/session/scenes
- `max-bot-ts/api` - high-level API-клиент
- `max-bot-ts/core` - примитивы бота и middleware-типы
- `max-bot-ts/helpers` - хелперы клавиатур, кнопок, вложений и загрузки файлов
- `max-bot-ts/network/api` - низкоуровневые API-модули и класс ошибки
- `max-bot-ts/polling` - polling transport
- `max-bot-ts/webhook` - webhook-хелперы
- `max-bot-ts/session` - middleware и storage для сессий
- `max-bot-ts/scenes` - FSM и менеджер сцен
- `max-bot-ts/types` - экспортируемые типы `Update`, `Message`, `Chat`, `BotInfo` и связанных сущностей

## Настройка клиента

Переопределить настройки клиента можно через конфиг `Bot`:

```ts
import { Bot } from 'max-bot-ts';

const bot = new Bot(process.env.BOT_TOKEN!, {
  clientOptions: {
    baseUrl: 'https://platform-api.max.ru',
  },
});
```

Значения по умолчанию:

- `baseUrl`: `https://platform-api.max.ru`

## Обработка ошибок

```ts
import { Bot } from 'max-bot-ts';

const bot = new Bot(process.env.BOT_TOKEN!);

bot.catch(async (error, ctx) => {
  console.error('Не удалось обработать update', ctx.update, error);
});
```

Ошибки API доступны как `MaxError`.

## Разработка

```bash
npm run check --workspace max-bot-ts
npm run test --workspace max-bot-ts
npm run build --workspace max-bot-ts
```

## Документация

Более подробные примечания по использованию находятся в [docs/USAGE.md](./docs/USAGE.md).
