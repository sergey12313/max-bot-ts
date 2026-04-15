import { BaseApi } from '../../base-api.js';

type UploadQueryInput = Record<string, string | number | boolean | null | undefined>;

export class UploadsApi extends BaseApi {
  getUploadUrl = async ({ ...query }: UploadQueryInput): Promise<unknown> => {
    return this._post('uploads', { query });
  };
}
