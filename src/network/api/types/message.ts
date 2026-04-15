import type { MessageAttachment } from './attachment.js';
import type { Markup } from './markup.js';
import type { User } from './user.js';

export interface MessageBody {
  mid?: string;
  text?: string;
  attachments?: MessageAttachment[];
  markup?: Markup[];
  [key: string]: unknown;
}

export interface MessageRecipient {
  chat_id: number;
  [key: string]: unknown;
}

export interface Message {
  sender?: User;
  recipient?: MessageRecipient;
  body: MessageBody;
  [key: string]: unknown;
}
