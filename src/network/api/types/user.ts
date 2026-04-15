export interface User {
  user_id: number;
  name?: string;
  username?: string;
  [key: string]: unknown;
}
