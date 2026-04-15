export interface Markup {
  type: string;
  from?: number;
  length?: number;
  user_id?: number;
  [key: string]: unknown;
}
