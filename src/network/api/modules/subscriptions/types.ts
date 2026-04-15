import type { GetUpdatesResponse } from '../../types/index.js';

export interface GetUpdatesDTO {
  marker?: string;
  types?: string;
  [key: string]: unknown;
}

export type GetUpdatesResult = GetUpdatesResponse;
