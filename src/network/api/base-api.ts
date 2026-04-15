import { MaxError } from './error.js';
import type { Client, ReqOptions } from './client.js';

type ApiResult<T = unknown> = {
  status: number;
  data: T;
};

export class BaseApi {
  protected call: Client['call'];

  constructor(client: Client) {
    this.call = client.call;
  }

  protected callApi = async <T = unknown>(method: string, options?: ReqOptions): Promise<T> => {
    const result = await this.call({
      method,
      options: options ?? {},
    }) as ApiResult<T>;

    if (result.status !== 200) {
      throw new MaxError(result.status, result.data as Record<string, unknown>);
    }

    return result.data;
  };

  protected _get = async <T = unknown>(method: string, options?: ReqOptions): Promise<T> => {
    return this.callApi<T>(method, { ...options, method: 'GET' });
  };

  protected _post = async <T = unknown>(method: string, options?: ReqOptions): Promise<T> => {
    return this.callApi<T>(method, { ...options, method: 'POST' });
  };

  protected _patch = async <T = unknown>(method: string, options?: ReqOptions): Promise<T> => {
    return this.callApi<T>(method, { ...options, method: 'PATCH' });
  };

  protected _put = async <T = unknown>(method: string, options?: ReqOptions): Promise<T> => {
    return this.callApi<T>(method, { ...options, method: 'PUT' });
  };

  protected _delete = async <T = unknown>(method: string, options?: ReqOptions): Promise<T> => {
    return this.callApi<T>(method, { ...options, method: 'DELETE' });
  };
}
