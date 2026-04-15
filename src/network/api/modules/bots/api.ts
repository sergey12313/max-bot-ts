import { BaseApi } from '../../base-api.js';

type EditMyInfoInput = Record<string, unknown>;

export class BotsApi extends BaseApi {
  getMyInfo = async (): Promise<unknown> => {
    return this._get('me', {});
  };

  editMyInfo = async ({ ...body }: EditMyInfoInput): Promise<unknown> => {
    return this._patch('me', { body });
  };
}
