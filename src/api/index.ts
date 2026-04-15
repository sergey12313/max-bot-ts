import {
  AudioAttachment,
  FileAttachment,
  ImageAttachment,
  VideoAttachment,
} from '../helpers/attachments.js';
import { Upload } from '../helpers/upload.js';
import { RawApi } from '../network/api/index.js';
import type { Client } from '../network/api/client.js';
import type {
  EditMyInfoDTO,
  EditMyInfoResponse,
  GetMyInfoResponse,
} from '../network/api/modules/bots/types.js';
import type {
  AddChatMembersResponse,
  ChatMembershipResponse,
  EditChatExtra,
  EditChatResponse,
  GetAllChatsExtra,
  GetAllChatsResponse,
  GetChatAdminsResponse,
  GetChatMembersExtra,
  GetChatMembersResponse,
  GetChatResponse,
  GetPinnedMessageResponse,
  LeaveChatResponse,
  PinMessageExtra,
  PinMessageResponse,
  RemoveChatMemberResponse,
  SenderAction,
  SendActionResponse,
  UnpinMessageResponse,
} from '../network/api/modules/chats/types.js';
import type {
  AnswerOnCallbackExtra,
  AnswerOnCallbackResponse,
  DeleteMessageExtra,
  DeleteMessageResponse,
  EditMessageExtra,
  EditMessageResponse,
  GetMessagesExtra,
  GetMessagesResponse,
  SendMessageExtra,
  SendMessageResponse,
  UpdatesResponse,
} from '../network/api/modules/messages/types.js';
import type { GetUpdatesDTO } from '../network/api/modules/subscriptions/types.js';
import type { UploadEndpointResponse } from '../network/api/types/uploads.js';
import type { BotCommand, Message } from '../network/api/types/index.js';

type MessageQuery = Omit<GetMessagesExtra, 'message_ids'> & {
  message_ids?: Array<string | number>;
};

type SendMessageQuery = {
  chat_id: number | undefined;
  user_id: number | undefined;
  disable_link_preview: boolean | undefined;
};

type SendMessagePayload = SendMessageExtra & {
  text: string;
};

type ChatMembersQuery = Omit<GetChatMembersExtra, 'user_ids'> & {
  user_ids?: Array<string | number>;
};

type UploadImageOptions = {
  source?: unknown;
  url?: string;
  timeout: number | undefined;
  [key: string]: unknown;
};

type UploadBinaryOptions = {
  source: unknown;
  timeout?: number;
  [key: string]: unknown;
};

export class Api {
  raw: RawApi;
  upload: Upload;

  constructor(client: Client) {
    this.raw = new RawApi(client);
    this.upload = new Upload(this);
  }

  getMyInfo = async (): Promise<GetMyInfoResponse> => {
    return this.raw.bots.getMyInfo() as Promise<GetMyInfoResponse>;
  };

  editMyInfo = async (extra: EditMyInfoDTO): Promise<EditMyInfoResponse> => {
    return this.raw.bots.editMyInfo(extra) as Promise<EditMyInfoResponse>;
  };

  setMyCommands = async (commands: BotCommand[]): Promise<EditMyInfoResponse> => {
    return this.editMyInfo({ commands });
  };

  deleteMyCommands = async (): Promise<EditMyInfoResponse> => {
    return this.editMyInfo({ commands: [] });
  };

  getAllChats = async (extra: GetAllChatsExtra = {}): Promise<GetAllChatsResponse> => {
    return this.raw.chats.getAll(
      extra as Record<string, string | number | boolean | null | undefined>,
    ) as Promise<GetAllChatsResponse>;
  };

  getChat = async (id: number): Promise<GetChatResponse> => {
    return this.raw.chats.getById({ chat_id: id }) as Promise<GetChatResponse>;
  };

  getChatByLink = async (link: string): Promise<GetChatResponse> => {
    return this.raw.chats.getByLink({ chat_link: link }) as Promise<GetChatResponse>;
  };

  editChatInfo = async (chatId: number, extra: EditChatExtra): Promise<EditChatResponse> => {
    return this.raw.chats.edit({ chat_id: chatId, ...extra }) as Promise<EditChatResponse>;
  };

  sendMessageToChat = async (
    chatId: number,
    text: string,
    extra?: SendMessageExtra,
  ): Promise<Message> => {
    const { message } = await this.raw.messages.send({
      chat_id: chatId,
      user_id: undefined,
      disable_link_preview: undefined,
      ...({ text, ...extra } satisfies SendMessagePayload),
    } as SendMessageQuery & SendMessagePayload) as SendMessageResponse;
    return message;
  };

  sendMessageToUser = async (
    userId: number,
    text: string,
    extra?: SendMessageExtra,
  ): Promise<Message> => {
    const { message } = await this.raw.messages.send({
      chat_id: undefined,
      user_id: userId,
      disable_link_preview: undefined,
      ...({ text, ...extra } satisfies SendMessagePayload),
    } as SendMessageQuery & SendMessagePayload) as SendMessageResponse;
    return message;
  };

  getMessages = async (chatId: number, { message_ids, ...extra }: MessageQuery = {}): Promise<GetMessagesResponse> => {
    return this.raw.messages.get({
      chat_id: chatId,
      message_ids: message_ids?.join(','),
      ...extra,
    } as unknown as Record<string, string | number | boolean | null | undefined>) as Promise<GetMessagesResponse>;
  };

  getMessage = async (id: string): Promise<Message> => {
    return this.raw.messages.getById({ message_id: id }) as Promise<Message>;
  };

  editMessage = async (messageId: string, extra?: EditMessageExtra): Promise<EditMessageResponse> => {
    return this.raw.messages.edit({
      message_id: messageId,
      ...extra,
    }) as Promise<EditMessageResponse>;
  };

  deleteMessage = async (messageId: string, extra?: DeleteMessageExtra): Promise<DeleteMessageResponse> => {
    return this.raw.messages.delete({ message_id: messageId, ...extra }) as Promise<DeleteMessageResponse>;
  };

  answerOnCallback = async (
    callbackId: string,
    extra?: AnswerOnCallbackExtra,
  ): Promise<AnswerOnCallbackResponse> => {
    return this.raw.messages.answerOnCallback({
      callback_id: callbackId,
      ...extra,
    }) as Promise<AnswerOnCallbackResponse>;
  };

  getChatMembership = (chatId: number): Promise<ChatMembershipResponse> => {
    return this.raw.chats.getChatMembership({ chat_id: chatId }) as Promise<ChatMembershipResponse>;
  };

  getChatAdmins = (chatId: number): Promise<GetChatAdminsResponse> => {
    return this.raw.chats.getChatAdmins({ chat_id: chatId }) as Promise<GetChatAdminsResponse>;
  };

  addChatMembers = (chatId: number, userIds: number[]): Promise<AddChatMembersResponse> => {
    return this.raw.chats.addChatMembers({
      chat_id: chatId,
      user_ids: userIds,
    }) as Promise<AddChatMembersResponse>;
  };

  getChatMembers = (
    chatId: number,
    { user_ids, ...extra }: ChatMembersQuery = {},
  ): Promise<GetChatMembersResponse> => {
    return this.raw.chats.getChatMembers({
      chat_id: chatId,
      user_ids: user_ids?.join(','),
      ...extra,
    } as unknown as Record<string, string | number | boolean | null | undefined> & { chat_id: number }) as Promise<GetChatMembersResponse>;
  };

  removeChatMember = (chatId: number, userId: number): Promise<RemoveChatMemberResponse> => {
    return this.raw.chats.removeChatMember({
      chat_id: chatId,
      user_id: userId,
    }) as Promise<RemoveChatMemberResponse>;
  };

  getUpdates = async (types: string[] = [], extra: Omit<GetUpdatesDTO, 'types'> = {}): Promise<UpdatesResponse> => {
    return this.raw.subscriptions.getUpdates({
      types: Array.isArray(types) ? types.join(',') : types,
      ...extra,
    }) as Promise<UpdatesResponse>;
  };

  getPinnedMessage = async (chatId: number): Promise<GetPinnedMessageResponse> => {
    return this.raw.chats.getPinnedMessage({ chat_id: chatId }) as Promise<GetPinnedMessageResponse>;
  };

  pinMessage = async (chatId: number, messageId: string, extra?: PinMessageExtra): Promise<PinMessageResponse> => {
    return this.raw.chats.pinMessage({
      chat_id: chatId,
      message_id: messageId,
      ...extra,
    }) as Promise<PinMessageResponse>;
  };

  unpinMessage = async (chatId: number): Promise<UnpinMessageResponse> => {
    return this.raw.chats.unpinMessage({ chat_id: chatId }) as Promise<UnpinMessageResponse>;
  };

  sendAction = async (chatId: number, action: SenderAction): Promise<SendActionResponse> => {
    return this.raw.chats.sendAction({
      chat_id: chatId,
      action,
    }) as Promise<SendActionResponse>;
  };

  leaveChat = async (chatId: number): Promise<LeaveChatResponse> => {
    return this.raw.chats.leaveChat({ chat_id: chatId }) as Promise<LeaveChatResponse>;
  };

  uploadImage = async (options: UploadImageOptions): Promise<ImageAttachment> => {
    const data = await this.upload.image({
      ...options,
      timeout: options.timeout,
    } as UploadImageOptions) as UploadEndpointResponse | { url: string };
    return new ImageAttachment(data);
  };

  uploadVideo = async (options: UploadBinaryOptions): Promise<VideoAttachment> => {
    const data = await this.upload.video(options) as UploadEndpointResponse;
    return new VideoAttachment({ token: data.token });
  };

  uploadAudio = async (options: UploadBinaryOptions): Promise<AudioAttachment> => {
    const data = await this.upload.audio(options) as UploadEndpointResponse;
    return new AudioAttachment({ token: data.token });
  };

  uploadFile = async (options: UploadBinaryOptions): Promise<FileAttachment> => {
    const data = await this.upload.file(options) as UploadEndpointResponse;
    return new FileAttachment({ token: data.token });
  };
}
