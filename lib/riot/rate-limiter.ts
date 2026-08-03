import "server-only";

const SHORT_WINDOW_MS = 1_000;
const SHORT_LIMIT = 20;
const LONG_WINDOW_MS = 120_000;
const LONG_LIMIT = 100;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Token bucket doble respetando el límite de una Riot Personal API Key
 * (20 req/1s + 100 req/2min). Serializa las llamadas con una cadena de
 * promesas para que acquire() concurrentes no reserven el mismo slot dos
 * veces. Instancia única por proceso — solo el cron/rutas server llaman
 * a Riot, nunca el cliente, así que no necesita ser distribuido.
 */
class RiotRateLimiter {
  private shortWindow: number[] = [];
  private longWindow: number[] = [];
  private chain: Promise<void> = Promise.resolve();

  acquire(): Promise<void> {
    const next = this.chain.then(() => this.waitForSlot());
    this.chain = next.catch(() => undefined);
    return next;
  }

  private async waitForSlot(): Promise<void> {
    for (;;) {
      const now = Date.now();
      this.shortWindow = this.shortWindow.filter((t) => now - t < SHORT_WINDOW_MS);
      this.longWindow = this.longWindow.filter((t) => now - t < LONG_WINDOW_MS);

      if (this.shortWindow.length < SHORT_LIMIT && this.longWindow.length < LONG_LIMIT) {
        this.shortWindow.push(now);
        this.longWindow.push(now);
        return;
      }

      const waitShort =
        this.shortWindow.length >= SHORT_LIMIT
          ? SHORT_WINDOW_MS - (now - this.shortWindow[0])
          : 0;
      const waitLong =
        this.longWindow.length >= LONG_LIMIT
          ? LONG_WINDOW_MS - (now - this.longWindow[0])
          : 0;

      await sleep(Math.max(waitShort, waitLong, 25));
    }
  }
}

export const riotRateLimiter = new RiotRateLimiter();
