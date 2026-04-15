import VCF from 'vcf';
import type { Api } from '../api/index.js';
import type { Guard, MaybeArray } from '../helpers/types.js';
import type { Update } from '../network/api/index.js';

type ContactAttachment = {
  type: 'contact';
  payload: {
    vcf_info?: string;
    [key: string]: unknown;
  };
};

type LocationAttachment = {
  type: 'location';
  latitude: number;
  longitude: number;
};

type StickerAttachmentPayload = {
  url: string;
  code: string;
};

type StickerAttachment = {
  type: 'sticker';
  width: number;
  height: number;
  payload: StickerAttachmentPayload;
};

type MessageLike = {
  sender?: unknown;
  recipient?: {
    chat_id: number;
  };
  body: {
    mid?: string;
    text?: string;
    attachments?: unknown[];
    markup?: Array<{ type?: string; from?: number; user_id?: number; length?: number }>;
  };
};

type CallbackLike = {
  callback_id: string;
  payload?: string;
  user?: unknown;
};

type ChatLike = {
  chat_id: number;
  [key: string]: unknown;
};

type BotInfoLike = {
  user_id?: number;
  [key: string]: unknown;
};

type UpdateWithShape = Update & {
  timestamp?: string | number;
  payload?: string | null;
  user?: unknown;
  chat_id?: number;
  chat?: ChatLike;
  message?: MessageLike;
  message_id?: string;
  callback?: CallbackLike;
};

export type FilteredContext<Ctx extends Context, _Filter> = Ctx;

export class Context<U extends Update = Update> {
  match?: RegExpExecArray;
  private _contactInfo?: { tel?: string; fullName?: string };
  private _location?: { latitude: number; longitude: number };
  private _sticker?: { width: number; height: number; url: string; code: string };

  constructor(
    public readonly update: U,
    public readonly api: Api,
    public readonly botInfo?: BotInfoLike,
  ) {}

  has(filters: MaybeArray<Guard<U> | string>): boolean {
    for (const filter of Array.isArray(filters) ? filters : [filters]) {
      if (typeof filter === 'function' ? filter(this.update) : filter === this.update.update_type) {
        return true;
      }
    }

    return false;
  }

  assert<T>(value: T | undefined, method: string): asserts value is T {
    if (value === undefined) {
      throw new TypeError(`Max: "${method}" isn't available for "${this.updateType}"`);
    }
  }

  get updateType() {
    return this.update.update_type;
  }

  get myId(): number | undefined {
    return this.botInfo?.user_id;
  }

  get startPayload(): string | null | undefined {
    return getStartPayload(this.update);
  }

  get chat(): ChatLike | undefined {
    return getChat(this.update);
  }

  get chatId(): number | undefined {
    return getChatId(this.update);
  }

  get message(): MessageLike | undefined {
    return getMessage(this.update);
  }

  get messageId(): string | undefined {
    return getMessageId(this.update);
  }

  get callback(): CallbackLike | undefined {
    return getCallback(this.update);
  }

  get user(): unknown {
    return getUser(this.update);
  }

  get contactInfo() {
    return this._contactInfo ?? (this._contactInfo = getContactInfo(this.update));
  }

  get location() {
    return this._location ?? (this._location = getLocation(this.update));
  }

  get sticker() {
    return this._sticker ?? (this._sticker = getSticker(this.update));
  }

  async reply(text: string, extra?: Record<string, unknown>) {
    this.assert(this.chatId, 'reply');
    return this.api.sendMessageToChat(this.chatId, text, extra);
  }

  async getAllChats(extra?: Record<string, unknown>) {
    return this.api.getAllChats(extra);
  }

  async getChat(chatId?: number) {
    if (chatId !== undefined) {
      return this.api.getChat(chatId);
    }

    this.assert(this.chatId, 'getChat');
    return this.api.getChat(this.chatId);
  }

  async getChatByLink(link: string) {
    return this.api.getChatByLink(link);
  }

  async editChatInfo(extra: Record<string, unknown>) {
    this.assert(this.chatId, 'editChatInfo');
    return this.api.editChatInfo(this.chatId, extra);
  }

  async getMessage(id: string) {
    return this.api.getMessage(id);
  }

  async getMessages(extra?: Record<string, unknown>) {
    this.assert(this.chatId, 'getMessages');
    return this.api.getMessages(this.chatId, extra);
  }

  async getPinnedMessage() {
    this.assert(this.chatId, 'getPinnedMessage');
    return this.api.getPinnedMessage(this.chatId);
  }

  async editMessage(extra: Record<string, unknown>) {
    this.assert(this.messageId, 'editMessage');
    return this.api.editMessage(this.messageId, extra);
  }

  async deleteMessage(messageId?: string) {
    if (messageId !== undefined) {
      return this.api.deleteMessage(messageId);
    }

    this.assert(this.messageId, 'deleteMessage');
    return this.api.deleteMessage(this.messageId);
  }

  async answerOnCallback(extra: Record<string, unknown>) {
    this.assert(this.callback, 'answerOnCallback');
    return this.api.answerOnCallback(this.callback.callback_id, extra);
  }

  async getChatMembership() {
    this.assert(this.chatId, 'getChatMembership');
    return this.api.getChatMembership(this.chatId);
  }

  async getChatAdmins() {
    this.assert(this.chatId, 'getChatAdmins');
    return this.api.getChatAdmins(this.chatId);
  }

  async addChatMembers(userIds: number[]) {
    this.assert(this.chatId, 'addChatMembers');
    return this.api.addChatMembers(this.chatId, userIds);
  }

  async getChatMembers(extra?: Record<string, unknown>) {
    this.assert(this.chatId, 'getChatMembers');
    return this.api.getChatMembers(this.chatId, extra);
  }

  async removeChatMember(userId: number) {
    this.assert(this.chatId, 'removeChatMember');
    return this.api.removeChatMember(this.chatId, userId);
  }

  async pinMessage(messageId: string, extra?: Record<string, unknown>) {
    this.assert(this.chatId, 'pinMessage');
    return this.api.pinMessage(this.chatId, messageId, extra);
  }

  async unpinMessage(): Promise<unknown> {
    this.assert(this.chatId, 'unpinMessage');
    return this.api.unpinMessage(this.chatId);
  }

  async sendAction(action: string) {
    this.assert(this.chatId, 'sendAction');
    return this.api.sendAction(this.chatId, action);
  }

  async leaveChat() {
    this.assert(this.chatId, 'leaveChat');
    return this.api.leaveChat(this.chatId);
  }
}

const getChatId = (update: UpdateWithShape): number | undefined => {
  if ('chat_id' in update) {
    return update.chat_id;
  }

  if ('message' in update && update.message?.recipient) {
    return update.message.recipient.chat_id;
  }

  if (update.chat) {
    return update.chat.chat_id;
  }

  return undefined;
};

const getChat = (update: UpdateWithShape): ChatLike | undefined => {
  if ('chat' in update) {
    return update.chat;
  }

  return undefined;
};

const getMessage = (update: UpdateWithShape): MessageLike | undefined => {
  if ('message' in update) {
    return update.message;
  }

  return undefined;
};

const getMessageId = (update: UpdateWithShape): string | undefined => {
  if ('message_id' in update) {
    return update.message_id;
  }

  if ('message' in update) {
    return update.message?.body.mid;
  }

  return undefined;
};

const getCallback = (update: UpdateWithShape): CallbackLike | undefined => {
  if ('callback' in update) {
    return update.callback;
  }

  return undefined;
};

const getContactInfo = (update: UpdateWithShape): { tel?: string; fullName?: string } | undefined => {
  const message = getMessage(update);
  if (!message) return undefined;

  const contact = message.body.attachments?.find(
    (attachment: unknown): attachment is ContactAttachment =>
      typeof attachment === 'object' && attachment !== null && 'type' in attachment && attachment.type === 'contact',
  );
  if (!contact?.payload.vcf_info) return undefined;

  const vcf = new VCF().parse(contact.payload.vcf_info);
  return {
    tel: vcf.get('tel').valueOf(),
    fullName: vcf.get('fn').valueOf(),
  };
};

const getLocation = (update: UpdateWithShape): { latitude: number; longitude: number } | undefined => {
  const message = getMessage(update);
  if (!message) return undefined;

  const location = message.body.attachments?.find(
    (attachment: unknown): attachment is LocationAttachment =>
      typeof attachment === 'object' && attachment !== null && 'type' in attachment && attachment.type === 'location',
  );
  if (!location) return undefined;

  return {
    latitude: location.latitude,
    longitude: location.longitude,
  };
};

const getSticker = (update: UpdateWithShape): { width: number; height: number; url: string; code: string } | undefined => {
  const message = getMessage(update);
  if (!message) return undefined;

  const sticker = message.body.attachments?.find(
    (attachment: unknown): attachment is StickerAttachment =>
      typeof attachment === 'object' && attachment !== null && 'type' in attachment && attachment.type === 'sticker',
  );
  if (!sticker) return undefined;

  return {
    width: sticker.width,
    height: sticker.height,
    url: sticker.payload.url,
    code: sticker.payload.code,
  };
};

const getUser = (update: UpdateWithShape): unknown => {
  if ('user' in update) {
    return update.user;
  }

  if (update.update_type === 'message_callback' && update.callback) {
    return update.callback.user;
  }

  if (update.update_type === 'message_created' && update.message) {
    return update.message.sender || undefined;
  }

  return undefined;
};

const getStartPayload = (update: UpdateWithShape): string | null | undefined => {
  if (update.update_type === 'bot_started') {
    return update.payload;
  }

  return undefined;
};
