import {
  BaseApi,
  BotsApi,
  ChatsApi,
  MessagesApi,
  SubscriptionsApi,
  UploadsApi,
} from './modules/index.js';
import type { Client, ReqOptions } from './client.js';

export class RawApi extends BaseApi {
  private _chats?: ChatsApi;
  private _bots?: BotsApi;
  private _messages?: MessagesApi;
  private _subscriptions?: SubscriptionsApi;
  private _uploads?: UploadsApi;

  get = <T = unknown>(method: string, options?: ReqOptions): Promise<T> => this._get<T>(method, options);
  post = <T = unknown>(method: string, options?: ReqOptions): Promise<T> => this._post<T>(method, options);
  patch = <T = unknown>(method: string, options?: ReqOptions): Promise<T> => this._patch<T>(method, options);

  constructor(private readonly client: Client) {
    super(client);
  }

  get chats(): ChatsApi {
    return this._chats ?? (this._chats = new ChatsApi(this.client));
  }

  get bots(): BotsApi {
    return this._bots ?? (this._bots = new BotsApi(this.client));
  }

  get messages(): MessagesApi {
    return this._messages ?? (this._messages = new MessagesApi(this.client));
  }

  get subscriptions(): SubscriptionsApi {
    return this._subscriptions ?? (this._subscriptions = new SubscriptionsApi(this.client));
  }

  get uploads(): UploadsApi {
    return this._uploads ?? (this._uploads = new UploadsApi(this.client));
  }
}
