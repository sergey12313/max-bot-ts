export * from './attachment.js';
export * from './attachment-request.js';
export * from './bot.js';
export * from './chat.js';
export * from './common.js';
export * from './keyboard.js';
export * from './markup.js';
export * from './message.js';
export * from './subcription.js';
export * from './uploads.js';
export * from './user.js';

import type { BotInfo } from './bot.js';
import type { Chat } from './chat.js';
import type { Message } from './message.js';
import type { User } from './user.js';

export type UpdateType =
  | 'message_created'
  | 'message_callback'
  | 'bot_started'
  | 'message_removed'
  | 'message_edited'
  | 'bot_added'
  | 'bot_removed'
  | 'user_added'
  | 'user_removed'
  | 'chat_title_changed'
  | 'message_construction_request'
  | 'message_constructed'
  | 'message_chat_created'
  | string;

export interface BaseUpdate {
  update_type: UpdateType;
  timestamp?: number | string;
  [key: string]: unknown;
}

export interface MessageCreatedUpdate extends BaseUpdate {
  update_type: 'message_created';
  message: Message;
}

export interface MessageCallbackUpdate extends BaseUpdate {
  update_type: 'message_callback';
  callback: {
    callback_id: string;
    payload?: string;
    user?: User;
    [key: string]: unknown;
  };
  message?: Message;
}

export interface BotStartedUpdate extends BaseUpdate {
  update_type: 'bot_started';
  payload?: string | null;
  chat_id?: number;
  user?: User;
}

export interface ChatUpdate extends BaseUpdate {
  chat?: Chat;
}

export interface UserUpdate extends BaseUpdate {
  user?: User;
}

export interface MessageIdUpdate extends BaseUpdate {
  message_id?: string;
}

export interface BotInfoUpdate extends BaseUpdate {
  bot?: BotInfo;
}

export type Update =
  | MessageCreatedUpdate
  | MessageCallbackUpdate
  | BotStartedUpdate
  | (BaseUpdate & ChatUpdate & UserUpdate & MessageIdUpdate & BotInfoUpdate);
