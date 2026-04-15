import { BaseApi } from '../../base-api.js';

type ChatIdInput = { chat_id: number };
type ChatLinkInput = { chat_link: string };
type QueryInput = Record<string, string | number | boolean | null | undefined>;
type BodyInput = Record<string, unknown>;
type ChatBodyInput = ChatIdInput & BodyInput;

export class ChatsApi extends BaseApi {
  async getAll({ ...query }: QueryInput): Promise<unknown> {
    return this._get('chats', {
      query,
    });
  }

  async getById({ chat_id }: ChatIdInput): Promise<unknown> {
    return this._get('chats/{chat_id}', {
      path: { chat_id },
    });
  }

  async getByLink({ chat_link }: ChatLinkInput): Promise<unknown> {
    return this._get('chats/{chat_link}', {
      path: { chat_link },
    });
  }

  async edit({ chat_id, ...body }: ChatBodyInput): Promise<unknown> {
    return this._patch('chats/{chat_id}', {
      path: { chat_id },
      body,
    });
  }

  async getChatMembership({ chat_id }: ChatIdInput): Promise<unknown> {
    return this._get('chats/{chat_id}/members/me', {
      path: { chat_id },
    });
  }

  async getChatAdmins({ chat_id }: ChatIdInput): Promise<unknown> {
    return this._get('chats/{chat_id}/members/admins', {
      path: { chat_id },
    });
  }

  async addChatMembers({ chat_id, ...body }: ChatBodyInput): Promise<unknown> {
    return this._post('chats/{chat_id}/members', {
      path: { chat_id },
      body,
    });
  }

  async getChatMembers({ chat_id, ...query }: ChatIdInput & QueryInput): Promise<unknown> {
    return this._get('chats/{chat_id}/members', {
      path: { chat_id },
      query,
    });
  }

  async removeChatMember({ chat_id, ...body }: ChatBodyInput): Promise<unknown> {
    return this._delete('chats/{chat_id}/members', {
      path: { chat_id },
      body,
    });
  }

  async getPinnedMessage({ chat_id }: ChatIdInput): Promise<unknown> {
    return this._get('chats/{chat_id}/pin', {
      path: { chat_id },
    });
  }

  async pinMessage({ chat_id, ...body }: ChatBodyInput): Promise<unknown> {
    return this._put('chats/{chat_id}/pin', {
      path: { chat_id },
      body,
    });
  }

  async unpinMessage({ chat_id }: ChatIdInput): Promise<unknown> {
    return this._delete('chats/{chat_id}/pin', {
      path: { chat_id },
    });
  }

  async sendAction({ chat_id, ...body }: ChatBodyInput): Promise<unknown> {
    return this._post('chats/{chat_id}/actions', {
      path: { chat_id },
      body,
    });
  }

  async leaveChat({ chat_id }: ChatIdInput): Promise<unknown> {
    return this._delete('chats/{chat_id}/members/me', {
      path: { chat_id },
    });
  }
}
