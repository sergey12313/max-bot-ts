import type { Update } from './index.js';

export interface GetUpdatesResponse {
  updates: Update[];
  marker?: string;
  [key: string]: unknown;
}
