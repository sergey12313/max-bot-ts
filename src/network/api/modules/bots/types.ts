import type { BotCommand, BotInfo } from '../../types/index.js';

export interface EditMyInfoDTO {
  name?: string;
  description?: string;
  commands?: BotCommand[];
  [key: string]: unknown;
}

export type GetMyInfoResponse = BotInfo;
export type EditMyInfoResponse = BotInfo;
