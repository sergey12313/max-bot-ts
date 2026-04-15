import type { ActionResponse } from '../../types/common.js';
import type { GetUpdatesResponse, Message } from '../../types/index.js';

export interface SendMessageExtra {
  attachments?: unknown[];
  [key: string]: unknown;
}

export interface EditMessageExtra {
  text?: string;
  attachments?: unknown[];
  [key: string]: unknown;
}

export interface DeleteMessageExtra {
  [key: string]: unknown;
}

export interface AnswerOnCallbackExtra {
  notification?: string;
  message?: {
    text?: string;
    attachments?: unknown[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface GetMessagesExtra {
  message_ids?: Array<string | number>;
  [key: string]: unknown;
}

export interface GetMessagesResponse {
  messages?: Message[];
  [key: string]: unknown;
}

export interface SendMessageResponse {
  message: Message;
  [key: string]: unknown;
}

export type EditMessageResponse = ActionResponse;
export type DeleteMessageResponse = ActionResponse;
export type AnswerOnCallbackResponse = ActionResponse;
export type UpdatesResponse = GetUpdatesResponse;
