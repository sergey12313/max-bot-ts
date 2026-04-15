import type { ActionResponse } from '../../types/common.js';
import type { Chat, ChatMember, Message, User } from '../../types/index.js';

export interface GetAllChatsExtra {
  [key: string]: unknown;
}

export interface EditChatExtra {
  title?: string;
  icon?: string;
  [key: string]: unknown;
}

export interface GetChatMembersExtra {
  user_ids?: Array<string | number>;
  [key: string]: unknown;
}

export interface PinMessageExtra {
  [key: string]: unknown;
}

export type SenderAction = string;

export interface GetAllChatsResponse {
  chats?: Chat[];
  [key: string]: unknown;
}

export type GetChatResponse = Chat;
export type EditChatResponse = Chat;
export type GetPinnedMessageResponse = Message;

export interface GetChatAdminsResponse {
  members?: Array<ChatMember | User>;
  [key: string]: unknown;
}

export interface GetChatMembersResponse {
  members?: Array<ChatMember | User>;
  [key: string]: unknown;
}

export type ChatMembershipResponse = ChatMember;
export type AddChatMembersResponse = ActionResponse;
export type RemoveChatMemberResponse = ActionResponse;
export type PinMessageResponse = ActionResponse;
export type UnpinMessageResponse = ActionResponse;
export type SendActionResponse = ActionResponse;
export type LeaveChatResponse = ActionResponse;
