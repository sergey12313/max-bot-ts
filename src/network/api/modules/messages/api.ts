import { setTimeout } from 'node:timers/promises';
import { MaxError } from '../../error.js';
import { BaseApi } from '../../base-api.js';

type MessageIdInput = { message_id: string };
type CallbackIdInput = { callback_id: string };
type MessageQueryInput = Record<string, string | number | boolean | null | undefined>;
type MessageBodyInput = Record<string, unknown>;
type SendMessageInput = {
  chat_id: number | undefined;
  user_id: number | undefined;
  disable_link_preview: boolean | undefined;
  [key: string]: unknown;
};

export class MessagesApi extends BaseApi {
  get = async ({ ...query }: MessageQueryInput): Promise<unknown> => {
    return this._get('messages', {
      query,
    });
  };

  getById = async ({ message_id }: MessageIdInput): Promise<unknown> => {
    return this._get('messages/{message_id}', {
      path: { message_id },
    });
  };

  send = async ({ chat_id, user_id, disable_link_preview, ...body }: SendMessageInput): Promise<unknown> => {
    try {
      return await this._post('messages', {
        body,
        query: { chat_id, user_id, disable_link_preview },
      });
    } catch (err) {
      if (err instanceof MaxError) {
        if (err.code === 'attachment.not.ready') {
          console.log('Attachment not ready');
          await setTimeout(1000);
          return this.send({
            chat_id,
            user_id,
            disable_link_preview,
            ...body,
          } as SendMessageInput);
        }
      }

      throw err;
    }
  };

  edit = async ({ message_id, ...body }: MessageIdInput & MessageBodyInput): Promise<unknown> => {
    return this._put('messages', {
      query: { message_id },
      body,
    });
  };

  delete = async ({ ...query }: MessageQueryInput): Promise<unknown> => {
    return this._delete('messages', {
      query,
    });
  };

  answerOnCallback = async ({ callback_id, ...body }: CallbackIdInput & MessageBodyInput): Promise<unknown> => {
    return this._post('answers', {
      query: { callback_id },
      body,
    });
  };
}
