import debugFactory from 'debug';
import { MaxError, type Update } from '../network/api/index.js';
import type { Api } from '../api/index.js';

const debug = debugFactory('one-me:polling');
const RETRY_INTERVAL = 5000;

type PollingResponse = {
  updates: Update[];
  marker?: string;
};

export class Polling {
  private readonly abortController = new AbortController();
  private marker?: string;

  constructor(
    private readonly api: Pick<Api, 'getUpdates'>,
    private readonly allowedUpdates: string[] = [],
  ) {}

  async loop(handleUpdate: (update: Update) => Promise<void>): Promise<void> {
    debug('Starting long polling');

    while (!this.abortController.signal.aborted) {
      try {
        const { updates, marker } = await this.api.getUpdates(this.allowedUpdates, {
          marker: this.marker,
        }) as PollingResponse;

        this.marker = marker;
        await Promise.all(updates.map(handleUpdate));
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === 'AbortError') return;

          if (
            err.name === 'FetchError' ||
            (err instanceof MaxError && err.status === 429) ||
            (err instanceof MaxError && err.status >= 500)
          ) {
            debug(`Failed to fetch updates, retrying after ${RETRY_INTERVAL}ms.`, err);
            await new Promise((resolve) => {
              setTimeout(resolve, RETRY_INTERVAL);
            });
            return;
          }
        }

        throw err;
      }
    }

    debug('Long polling is done');
  }

  stop(): void {
    debug('Stopping long polling');
    this.abortController.abort();
  }
}
