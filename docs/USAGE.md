# Руководство по `max-bot-ts`

Этот документ описывает структуру пакета и рекомендуемый способ построения бота на `max-bot-ts`.

## Модель пакета

Пакет разделен на несколько слоев:

- `max-bot-ts` - основной entrypoint с runtime, который нужен в большинстве случаев
- `max-bot-ts/core` - `Bot`, `Composer`, `Context`, middleware-типы
- `max-bot-ts/api` - high-level API facade поверх MAX endpoints
- `max-bot-ts/network/api` - низкоуровневый request layer и `MaxError`
- `max-bot-ts/session` - session storage и middleware
- `max-bot-ts/scenes` - `FSM` и `SceneManager`
- `max-bot-ts/types` - экспортируемые типы API-моделей и update-событий

Используйте корневой entrypoint, если не строите инфраструктурный код вокруг библиотеки.

## Жизненный цикл бота

Создание бота по токену:

```ts
import { Bot } from 'max-bot-ts';

const bot = new Bot(process.env.BOT_TOKEN!);
```

Опциональная конфигурация:

```ts
const bot = new Bot(process.env.BOT_TOKEN!, {
  clientOptions: {
    baseUrl: 'https://platform-api.max.ru',
  },
});
```

Запуск polling:

```ts
await bot.start();
```

Остановка polling:

```ts
bot.stop();
```

Ограничение типов обновлений:

```ts
await bot.start({
  allowedUpdates: ['message_created', 'message_callback'],
});
```

## Middleware и маршрутизация

`Bot` расширяет `Composer`, поэтому маршрутизация строится на middleware.

Основные строительные блоки:

- `bot.use(...)`
- `bot.on(updateType, ...)`
- `bot.command(name, ...)`
- `bot.hears(trigger, ...)`
- `bot.action(trigger, ...)`

Пример:

```ts
bot.command('start', async (ctx) => {
  await ctx.reply('Готово');
});

bot.hears(/help/i, async (ctx) => {
  await ctx.reply('Чем помочь?');
});

bot.action('ping', async (ctx) => {
  await ctx.answerOnCallback({
    message: { text: 'pong' },
  });
});
```

## API контекста

`Context` дает удобный доступ к данным update:

- `ctx.updateType`
- `ctx.chat`
- `ctx.chatId`
- `ctx.message`
- `ctx.messageId`
- `ctx.callback`
- `ctx.user`
- `ctx.startPayload`
- `ctx.contactInfo`
- `ctx.location`
- `ctx.sticker`

Полезные методы:

- `ctx.reply(text, extra?)`
- `ctx.getChat(chatId?)`
- `ctx.getMessages(extra?)`
- `ctx.editMessage(extra)`
- `ctx.deleteMessage(messageId?)`
- `ctx.answerOnCallback(extra)`
- `ctx.sendAction(action)`

## API-слой

Если нужен прямой доступ к endpoint-ам, используйте `bot.api` или `Api` напрямую.

Типичные методы:

- `getMyInfo()`
- `editMyInfo(dto)`
- `sendMessageToChat(chatId, text, extra?)`
- `sendMessageToUser(userId, text, extra?)`
- `getMessages(chatId, query?)`
- `getUpdates(types?, query?)`
- `getAllChats(query?)`
- `getChat(chatId)`
- `getChatMembers(chatId, query?)`

Фасад возвращает типизированные модели из `max-bot-ts/types`.

## Webhook-режим

Библиотека не навязывает Express, Fastify или другой HTTP-фреймворк.

Пример на Node.js:

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

Параметры обработчика:

- `secretToken` - проверяет `x-max-bot-secret`
- `secretHeader` - имя кастомного заголовка с секретом
- `maxBodySize` - лимит размера тела запроса в байтах
- `onError` - пользовательский hook для обработки ошибок

## Сессии

`createSessionMiddleware` добавляет `ctx.session` и сохраняет состояние через backend-хранилище.

```ts
import { createSessionMiddleware, MemorySessionStorage } from 'max-bot-ts/session';

type SessionData = {
  count: number;
};

bot.use(createSessionMiddleware({
  storage: new MemorySessionStorage<SessionData>(),
  getSessionKey: (ctx) => ctx.chatId?.toString(),
  initial: () => ({ count: 0 }),
}));

bot.command('count', async (ctx) => {
  if (!ctx.session) return;
  ctx.session.count += 1;
  await ctx.reply(`Count: ${ctx.session.count}`);
});
```

Для production лучше заменить `MemorySessionStorage` на собственную persistent-реализацию.

## Сцены и FSM

Используйте сцены, когда команда запускает многошаговый диалог.

```ts
import { FSM, SceneManager, type Scene } from 'max-bot-ts/scenes';

const fsm = new FSM();
const scenes = new SceneManager(fsm);

const wizard: Scene = {
  name: 'wizard',
  async onEnter(ctx, fsmCtx) {
    fsmCtx.next('step1');
    await ctx.reply('Шаг 1');
  },
  async onMessage(ctx, fsmCtx) {
    if (fsmCtx.state?.step === 'step1') {
      fsmCtx.next('step2', { firstAnswer: ctx.message?.body.text });
      await ctx.reply('Шаг 2');
      return;
    }

    fsmCtx.leave();
    await ctx.reply('Готово');
  },
};

scenes.register(wizard);
```

## Хелперы

Хелпер для клавиатур:

```ts
import { Keyboard } from 'max-bot-ts';

const keyboard = Keyboard.inlineKeyboard([
  [Keyboard.button.callback('Пинг', 'ping')],
  [Keyboard.button.link('Документация', 'https://example.com')],
]);
```

Хелперы вложений:

- `ImageAttachment`
- `VideoAttachment`
- `AudioAttachment`
- `FileAttachment`
- `StickerAttachment`
- `LocationAttachment`
- `ShareAttachment`

Хелперы загрузки файлов доступны через `bot.api.uploadImage`, `uploadVideo`, `uploadAudio` и `uploadFile`.

## Обработка ошибок

Ошибки middleware/runtime:

```ts
bot.catch(async (error, ctx) => {
  console.error('Необработанная ошибка middleware', error, ctx.update);
});
```

Ошибки HTTP/API:

```ts
import { MaxError } from 'max-bot-ts';

try {
  await bot.api.getChat(1);
} catch (error) {
  if (error instanceof MaxError) {
    console.error(error.code, error.message);
  }
}
```

## Рекомендуемая production-конфигурация

- храните `BOT_TOKEN` вне исходного кода
- используйте webhook-режим за публичной HTTPS-точкой
- замените in-memory session storage на persistent storage
- оборачивайте `bot.catch(...)` в структурированное логирование
- фиксируйте `allowedUpdates`, если боту не нужен полный поток событий
