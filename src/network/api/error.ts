export class MaxError extends Error {
  status: number;
  response: { code?: string; message?: string; [key: string]: unknown };

  constructor(status: number, response: { code?: string; message?: string; [key: string]: unknown }) {
    super(`${status}: ${response.message}`);
    this.status = status;
    this.response = response;
  }

  get code() {
    return this.response.code;
  }

  get description() {
    return this.response.message;
  }
}
