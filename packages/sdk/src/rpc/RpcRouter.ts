import { RpcClient } from './RpcClient';
import type {
  RouterConfig,
  RouterState,
  EndpointHealth,
} from './types';
import { RpcNetworkError, RpcTimeoutError } from './errors';

/**
 * Smart RPC router for Soroban endpoints.
 *
 * Maintains a pool of `RpcClient` instances, one per configured endpoint.
 * On initialisation, all endpoints are pinged to measure latency and ranked
 * from fastest to slowest. The router automatically falls back to the next
 * healthiest endpoint on failure and re-checks all endpoints on a configurable
 * interval.
 *
 * @example
 * const router = new RpcRouter({
 *   endpoints: [
 *     'https://soroban-testnet.stellar.org',
 *     'https://rpc.ankr.com/stellar_testnet',
 *   ],
 * });
 * await router.start();
 * const ledger = await router.call('getLatestLedger');
 */
export class RpcRouter {
  private readonly clients: Map<string, RpcClient>;
  private state: RouterState;
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null;
  private readonly config: Required<RouterConfig>;

  private static readonly DEFAULT_INTERVAL = 30_000;
  private static readonly DEFAULT_MAX_RETRIES = 3;

  constructor(config: RouterConfig) {
    if (!Array.isArray(config.endpoints) || config.endpoints.length === 0) {
      throw new TypeError(
        'RpcRouter: config.endpoints must be a non-empty array of URL strings.',
      );
    }

    for (const endpoint of config.endpoints) {
      if (!endpoint || typeof endpoint !== 'string') {
        throw new TypeError(
          `RpcRouter: every endpoint must be a non-empty string. Received: ${JSON.stringify(endpoint)}`,
        );
      }
    }

    this.config = {
      healthCheckIntervalMs: RpcRouter.DEFAULT_INTERVAL,
      maxRetries: RpcRouter.DEFAULT_MAX_RETRIES,
      fallbackOnFailure: true,
      timeout: 30_000,
      ...config,
      endpoints: config.endpoints,
    };

    this.clients = new Map(
      this.config.endpoints.map((url) => [
        url,
        new RpcClient({ url, timeout: this.config.timeout }),
      ]),
    );

    this.state = {
      activeIndex: 0,
      endpoints: this.config.endpoints.map(
        (url): EndpointHealth => ({
          url,
          status: 'healthy',
          latencyMs: null,
          lastChecked: null,
          consecutiveFailures: 0,
        }),
      ),
    };
  }

  private async pingEndpoint(url: string): Promise<EndpointHealth> {
    const start = Date.now();
    const client = this.clients.get(url);

    if (client === undefined) {
      throw new Error(`RpcRouter: no client registered for URL: ${url}`);
    }

    const current = this.state.endpoints.find((e) => e.url === url) ?? {
      url,
      status: 'healthy' as const,
      latencyMs: null,
      lastChecked: null,
      consecutiveFailures: 0,
    };

    try {
      await client.healthCheck();
      const latencyMs = Date.now() - start;

      return {
        url,
        status: 'healthy',
        latencyMs,
        lastChecked: new Date(),
        consecutiveFailures: 0,
      };
    } catch {
      const consecutiveFailures = current.consecutiveFailures + 1;

      return {
        url,
        status: consecutiveFailures >= 3 ? 'unreachable' : 'degraded',
        latencyMs: null,
        lastChecked: new Date(),
        consecutiveFailures,
      };
    }
  }

  async pingAll(): Promise<void> {
    const results = await Promise.allSettled(
      this.state.endpoints.map((e) => this.pingEndpoint(e.url)),
    );

    this.state.endpoints = results.map((result, i) =>
      result.status === 'fulfilled'
        ? result.value
        : this.state.endpoints[i] ?? {
            url: this.config.endpoints[i] ?? '',
            status: 'unreachable' as const,
            latencyMs: null,
            lastChecked: new Date(),
            consecutiveFailures: ((this.state.endpoints[i] as EndpointHealth | undefined)?.consecutiveFailures ?? 0) + 1,
          },
    );

    this.state.endpoints.sort((a, b) => {
      if (a.latencyMs === null && b.latencyMs === null) return 0;
      if (a.latencyMs === null) return 1;
      if (b.latencyMs === null) return -1;
      return a.latencyMs - b.latencyMs;
    });

    this.state.activeIndex = 0;
  }

  /**
   * Pings all endpoints immediately, then starts a periodic health check
   * on the configured interval.
   */
  start(): void {
    void this.pingAll();
    this.healthCheckTimer = setInterval(() => {
      void this.pingAll();
    }, this.config.healthCheckIntervalMs);
  }

  /**
   * Stops the periodic health check timer.
   * Call this when the router is no longer needed to avoid resource leaks.
   */
  stop(): void {
    if (this.healthCheckTimer !== null) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * Executes a JSON-RPC 2.0 method call against the currently active endpoint,
   * falling back to the next healthy endpoint on network or timeout failures.
   *
   * @param method - The RPC method name (e.g. `'getLatestLedger'`).
   * @param params - Optional positional parameters to pass to the method.
   * @returns The typed result returned by the RPC server.
   * @throws {RpcNetworkError} If all retries are exhausted due to network failures.
   * @throws {RpcTimeoutError} If all retries are exhausted due to timeout failures.
   * @throws {RpcResponseError} Immediately — the server responded, so routing is fine.
   * @throws {RpcParseError} Immediately — malformed response is not a routing issue.
   */
  async call<T>(method: string, params?: unknown[]): Promise<T> {
    const total = this.state.endpoints.length;
    let lastError: unknown;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      const endpoint = this.state.endpoints[this.state.activeIndex];

      if (endpoint === undefined) {
        break;
      }

      const client = this.clients.get(endpoint.url);

      if (client === undefined) {
        break;
      }

      try {
        return await client.call<T>(method, params);
      } catch (err) {
        if (err instanceof RpcNetworkError || err instanceof RpcTimeoutError) {
          lastError = err;
          this.state.activeIndex = (this.state.activeIndex + 1) % total;
        } else {
          throw err;
        }
      }
    }

    throw lastError;
  }

  /**
   * Returns a frozen snapshot of the current router state.
   *
   * @returns A read-only copy of the current {@link RouterState}.
   */
  getState(): Readonly<RouterState> {
    return Object.freeze({ ...this.state, endpoints: [...this.state.endpoints] });
  }

  /**
   * Returns all endpoints currently reporting a `'healthy'` status.
   *
   * @returns A read-only array of {@link EndpointHealth} records.
   */
  getHealthySummary(): readonly EndpointHealth[] {
    return this.state.endpoints.filter((e) => e.status === 'healthy');
  }

  /**
   * Returns the URL of the currently active endpoint.
   *
   * @returns The URL string at the active index.
   */
  getActiveUrl(): string {
    const endpoint = this.state.endpoints[this.state.activeIndex];
    return endpoint?.url ?? '';
  }

  /**
   * Stops the health-check timer and releases all resources.
   * Enables use in `await using` blocks (TC39 Explicit Resource Management).
   */
  async [Symbol.asyncDispose](): Promise<void> {
    this.stop();
  }
}

export default RpcRouter;
