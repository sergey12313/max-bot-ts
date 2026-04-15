export interface Chat {
  chat_id: number;
  title?: string;
  type?: string;
  [key: string]: unknown;
}

export interface ChatMember {
  user_id?: number;
  role?: string;
  [key: string]: unknown;
}
