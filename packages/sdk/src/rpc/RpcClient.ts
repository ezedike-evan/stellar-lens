import type { RpcRequest, RpcResponse, RpcClientConfig } from './types';
import { RpcNetworkError, RpcResponseError, RpcTimeoutError, RpcParseError } from './errors';

/**
 * Low-level JSON-RPC 2.0 client for Soroban RPC endpoints.
 *
 * Handles request construction, timeout management, error classification,
 * and response parsing. All higher-level SDK modules depend on this client.
 *
 * @example
 * const client = new RpcClient({ url: 'https://soroban-testnet.stellar.org' });
 * const ledger = await client.call('getLatestLedger');
 */

export class RpcClient {
  private readonly config: Required<RpcClientConfig>;
  private static readonly DEFAULT_TIMEOUT = 30_000;
  private requestId = 0;

  constructor(config: RpcClientConfig) {
    if (!config.url || typeof config.url !== 'string') {
      throw new TypeError(
        'RpcClient: config.url must be a non-empty string. ' +
          `Received: ${JSON.stringify(config.url)}`,
      );
    }

    this.config = {
      timeout: RpcClient.DEFAULT_TIMEOUT,
      headers: {},
      ...config,
    };
  }

  private nextId(): number {
    return ++this.requestId;
  }

  /**
   * Executes a JSON-RPC 2.0 method call against the configured endpoint.
   *
   * @param method - The RPC method name (e.g. `'getLatestLedger'`)
   * @param params - Optional positional parameters to pass to the method
   * @returns The `result` field of the RPC response, typed as `T`
   *
   * @throws {RpcTimeoutError} If the request exceeds `config.timeout` milliseconds
   * @throws {RpcNetworkError} If the fetch fails or the server returns a non-2xx status
   * @throws {RpcParseError} If the response body cannot be parsed as JSON
   * @throws {RpcResponseError} If the server returns a JSON-RPC error object
   */
  async call<T>(method: string, params?: unknown[]): Promise<T> {
    const request: RpcRequest = {
      jsonrpc: '2.0',
      id: this.nextId(),
      method,
      ...(params !== undefined && { params }),
    };

    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, this.config.timeout);

    let response: Response;

    try {
      try {
        response = await fetch(this.config.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.config.headers,
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        });
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw new RpcTimeoutError(
            `Request to ${this.config.url} timed out after ${this.config.timeout}ms`,
            this.config.url,
            this.config.timeout,
          );
        }
        throw new RpcNetworkError(
          `Network error calling ${this.config.url}: ${err instanceof Error ? err.message : String(err)}`,
          this.config.url,
        );
      }

      if (!response.ok) {
        throw new RpcNetworkError(
          `HTTP ${response.status} ${response.statusText} from ${this.config.url}`,
          this.config.url,
        );
      }

      let body: RpcResponse<T>;

      try {
        body = (await response.json()) as RpcResponse<T>;
      } catch {
        throw new RpcParseError(`Failed to parse JSON response from ${this.config.url}`);
      }

      if (body.error !== undefined) {
        throw new RpcResponseError(body.error.message, body.error.code, body.error.data);
      }

      return body.result as T;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Returns the configured RPC endpoint URL. */
  getUrl(): string {
    return this.config.url;
  }

  /**
   * Pings the endpoint using `getLatestLedger` to verify connectivity.
   *
   * @returns `true` if the endpoint responds successfully, `false` otherwise
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.call('getLatestLedger');
      return true;
    } catch {
      return false;
    }
  }
}

export default RpcClient;
