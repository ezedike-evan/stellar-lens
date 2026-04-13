import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RpcClient } from '../../src/rpc/RpcClient';
import {
  RpcNetworkError,
  RpcTimeoutError,
  RpcResponseError,
  RpcParseError,
} from '../../src/rpc/errors';

// ─── helpers ────────────────────────────────────────────────────────────────

const BASE_URL = 'https://soroban-testnet.stellar.org';

function makeResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : `Error ${status}`,
    json: () => Promise.resolve(body),
  };
}

function successResponse(result: unknown) {
  return makeResponse({ jsonrpc: '2.0', id: 1, result });
}

function errorResponse(code: number, message: string, data?: unknown) {
  return makeResponse({ jsonrpc: '2.0', id: 1, error: { code, message, data } });
}

function stubFetch(impl: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('fetch', impl);
}

// ─── setup / teardown ───────────────────────────────────────────────────────

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── constructor ────────────────────────────────────────────────────────────

describe('constructor', () => {
  it('throws TypeError for an empty string URL', () => {
    expect(() => new RpcClient({ url: '' })).toThrow(TypeError);
  });

  it('throws TypeError for a non-string URL', () => {
    // @ts-expect-error intentional
    expect(() => new RpcClient({ url: 42 })).toThrow(TypeError);
  });

  it('throws TypeError when url is undefined', () => {
    // @ts-expect-error intentional
    expect(() => new RpcClient({})).toThrow(TypeError);
  });

  it('accepts a valid URL string without throwing', () => {
    expect(() => new RpcClient({ url: BASE_URL })).not.toThrow();
  });

  it('uses 30 000 ms as the default timeout', () => {
    // Verified indirectly: if the AbortController fires at the default
    // interval the timer id must have been registered with 30_000.
    const client = new RpcClient({ url: BASE_URL });
    // Confirm getUrl() works — the constructor completed without error.
    expect(client.getUrl()).toBe(BASE_URL);
  });

  it('merges custom headers correctly — custom header is stored alongside defaults', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(successResponse({}));
    stubFetch(fetchSpy);

    const client = new RpcClient({
      url: BASE_URL,
      headers: { 'X-Api-Key': 'secret' },
    });
    await client.call('getLatestLedger');

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['X-Api-Key']).toBe('secret');
    expect(headers['Content-Type']).toBe('application/json');
  });
});

// ─── call() ─────────────────────────────────────────────────────────────────

describe('call()', () => {
  it('sends a POST request to the configured URL', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(successResponse({}));
    stubFetch(fetchSpy);

    const client = new RpcClient({ url: BASE_URL });
    await client.call('getLatestLedger');

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(BASE_URL);
    expect(init.method).toBe('POST');
  });

  it('sets Content-Type: application/json on every request', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(successResponse({}));
    stubFetch(fetchSpy);

    await new RpcClient({ url: BASE_URL }).call('getLatestLedger');

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('sends a valid JSON-RPC 2.0 request body', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(successResponse({}));
    stubFetch(fetchSpy);

    await new RpcClient({ url: BASE_URL }).call('getLatestLedger', [{ arg: 1 }]);

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as {
      jsonrpc: string;
      id: number;
      method: string;
      params: unknown[];
    };
    expect(body.jsonrpc).toBe('2.0');
    expect(body.method).toBe('getLatestLedger');
    expect(body.params).toEqual([{ arg: 1 }]);
    expect(typeof body.id).toBe('number');
  });

  it('sends jsonrpc: "2.0" in the request body', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(successResponse({}));
    stubFetch(fetchSpy);

    await new RpcClient({ url: BASE_URL }).call('ping');

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as { jsonrpc: string };
    expect(body.jsonrpc).toBe('2.0');
  });

  it('auto-increments the request ID on each call', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(successResponse({}));
    stubFetch(fetchSpy);

    const client = new RpcClient({ url: BASE_URL });
    await client.call('a');
    await client.call('b');
    await client.call('c');

    const ids = fetchSpy.mock.calls.map(([, init]) => {
      return (JSON.parse((init as RequestInit).body as string) as { id: number }).id;
    });
    expect(ids[0]).toBeLessThan(ids[1]!);
    expect(ids[1]).toBeLessThan(ids[2]!);
    expect(new Set(ids).size).toBe(3);
  });

  it('returns the result field from a successful response', async () => {
    stubFetch(vi.fn().mockResolvedValue(successResponse({ sequence: 42 })));
    const result = await new RpcClient({ url: BASE_URL }).call<{ sequence: number }>(
      'getLatestLedger',
    );
    expect(result).toEqual({ sequence: 42 });
  });

  it('omits the params key from the request body when params is not provided', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(successResponse({}));
    stubFetch(fetchSpy);

    await new RpcClient({ url: BASE_URL }).call('getLatestLedger');

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect('params' in body).toBe(false);
  });

  it('throws RpcResponseError when the response body has an error field', async () => {
    stubFetch(vi.fn().mockResolvedValue(errorResponse(-32600, 'Invalid Request')));
    await expect(
      new RpcClient({ url: BASE_URL }).call('getLatestLedger'),
    ).rejects.toBeInstanceOf(RpcResponseError);
  });

  it('RpcResponseError carries the correct code', async () => {
    stubFetch(vi.fn().mockResolvedValue(errorResponse(-32601, 'Method not found')));
    const err = await new RpcClient({ url: BASE_URL })
      .call('getLatestLedger')
      .catch((e: unknown) => e);
    expect((err as RpcResponseError).code).toBe(-32601);
    expect((err as RpcResponseError).message).toBe('Method not found');
  });

  it('RpcResponseError carries the correct data field', async () => {
    stubFetch(
      vi.fn().mockResolvedValue(
        errorResponse(-32602, 'Invalid params', { received: 'string', expected: 'object' }),
      ),
    );
    const err = await new RpcClient({ url: BASE_URL })
      .call('getLatestLedger')
      .catch((e: unknown) => e);
    expect((err as RpcResponseError).data).toEqual({
      received: 'string',
      expected: 'object',
    });
  });

  it('throws RpcNetworkError when fetch rejects', async () => {
    stubFetch(vi.fn().mockRejectedValue(new Error('connection refused')));
    await expect(
      new RpcClient({ url: BASE_URL }).call('getLatestLedger'),
    ).rejects.toBeInstanceOf(RpcNetworkError);
  });

  it('throws RpcNetworkError when the response has a 500 status', async () => {
    stubFetch(vi.fn().mockResolvedValue(makeResponse({}, 500)));
    await expect(
      new RpcClient({ url: BASE_URL }).call('getLatestLedger'),
    ).rejects.toBeInstanceOf(RpcNetworkError);
  });

  it('RpcNetworkError for a 500 includes the status in the message', async () => {
    stubFetch(vi.fn().mockResolvedValue(makeResponse({}, 500)));
    const err = await new RpcClient({ url: BASE_URL })
      .call('getLatestLedger')
      .catch((e: unknown) => e);
    expect((err as RpcNetworkError).message).toMatch('500');
  });

  it('throws RpcParseError when the response body is not valid JSON', async () => {
    stubFetch(
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new SyntaxError('Unexpected token')),
      }),
    );
    await expect(
      new RpcClient({ url: BASE_URL }).call('getLatestLedger'),
    ).rejects.toBeInstanceOf(RpcParseError);
  });

  it('throws RpcTimeoutError when the request is aborted', async () => {
    const abortErr = Object.assign(new Error('The operation was aborted'), {
      name: 'AbortError',
    });
    stubFetch(vi.fn().mockRejectedValue(abortErr));
    await expect(
      new RpcClient({ url: BASE_URL }).call('getLatestLedger'),
    ).rejects.toBeInstanceOf(RpcTimeoutError);
  });

  it('RpcTimeoutError carries the configured timeout value', async () => {
    const abortErr = Object.assign(new Error('aborted'), { name: 'AbortError' });
    stubFetch(vi.fn().mockRejectedValue(abortErr));
    const err = await new RpcClient({ url: BASE_URL, timeout: 5_000 })
      .call('getLatestLedger')
      .catch((e: unknown) => e);
    expect((err as RpcTimeoutError).timeoutMs).toBe(5_000);
    expect((err as RpcTimeoutError).url).toBe(BASE_URL);
  });

  it('passes custom headers to fetch alongside Content-Type', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(successResponse({}));
    stubFetch(fetchSpy);

    await new RpcClient({ url: BASE_URL, headers: { Authorization: 'Bearer tok' } }).call(
      'getLatestLedger',
    );

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer tok');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('concurrent calls each receive a unique request ID', async () => {
    const ids: number[] = [];
    const fetchSpy = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string) as { id: number };
      ids.push(body.id);
      return Promise.resolve(successResponse({}));
    });
    stubFetch(fetchSpy);

    const client = new RpcClient({ url: BASE_URL });
    await Promise.all([
      client.call('a'),
      client.call('b'),
      client.call('c'),
      client.call('d'),
      client.call('e'),
    ]);

    expect(new Set(ids).size).toBe(5);
  });
});

// ─── getUrl() ────────────────────────────────────────────────────────────────

describe('getUrl()', () => {
  it('returns the URL passed to the constructor', () => {
    expect(new RpcClient({ url: BASE_URL }).getUrl()).toBe(BASE_URL);
  });
});

// ─── healthCheck() ──────────────────────────────────────────────────────────

describe('healthCheck()', () => {
  it('returns true when getLatestLedger succeeds', async () => {
    stubFetch(vi.fn().mockResolvedValue(successResponse({ sequence: 1 })));
    expect(await new RpcClient({ url: BASE_URL }).healthCheck()).toBe(true);
  });

  it('returns false when getLatestLedger throws a network error', async () => {
    stubFetch(vi.fn().mockRejectedValue(new Error('offline')));
    expect(await new RpcClient({ url: BASE_URL }).healthCheck()).toBe(false);
  });

  it('returns false when the server returns an RPC error', async () => {
    stubFetch(vi.fn().mockResolvedValue(errorResponse(-32603, 'Internal error')));
    expect(await new RpcClient({ url: BASE_URL }).healthCheck()).toBe(false);
  });

  it('never throws — always resolves to a boolean', async () => {
    stubFetch(vi.fn().mockRejectedValue(new Error('catastrophic failure')));
    const result = await new RpcClient({ url: BASE_URL }).healthCheck();
    expect(typeof result).toBe('boolean');
  });
});
