export interface BotCommand {
  name: string;
  description?: string;
  [key: string]: unknown;
}

export interface BotInfo {
  user_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  commands?: BotCommand[];
  [key: string]: unknown;
}
