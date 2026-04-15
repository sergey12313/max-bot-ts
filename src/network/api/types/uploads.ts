export interface UploadEndpointResponse {
  url: string;
  token?: string;
  [key: string]: unknown;
}
