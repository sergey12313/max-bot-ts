export interface ApiErrorPayload {
  code?: string;
  message?: string;
  [key: string]: unknown;
}

export interface ActionResponse {
  success?: boolean;
  [key: string]: unknown;
}

export interface Pagination {
  limit?: number;
  offset?: number;
}
