import type { UploadEndpointResponse } from '../../types/uploads.js';

export type UploadType = 'image' | 'video' | 'audio' | 'file';

export interface GetUploadUrlDTO {
  type: UploadType;
  [key: string]: unknown;
}

export type GetUploadUrlResponse = UploadEndpointResponse;
