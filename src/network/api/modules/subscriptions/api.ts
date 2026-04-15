import { BaseApi } from '../../base-api.js';

type UpdatesQueryInput = Record<string, string | number | boolean | null | undefined>;

export class SubscriptionsApi extends BaseApi {
  getUpdates = async ({ ...query }: UpdatesQueryInput): Promise<unknown> => {
    return this._get('updates', { query });
  };
}
