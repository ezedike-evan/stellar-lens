import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RpcRouter } from '../../src/rpc/RpcRouter';
import { RpcNetworkError, RpcTimeoutError, RpcResponseError } from '../../src/rpc/errors';

// ─── helpers ────────────────────────────────────────────────────────────────

const EP1 = 'https://soroban-testnet.stellar.org';
const EP2 = 'https://rpc.ankr.com/stellar_testnet';
const EP3 = 'https://stellar-testnet.blockdaemon.com/soroban/rpc';

function okResponse(result: unknown) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result }),
  };
}

function rpcErrorResponse(code: number, message: string) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, error: { code, message, data: null } }),
  };
}

// ─── setup / teardown ───────────────────────────────────────────────────────

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// ─── constructor ────────────────────────────────────────────────────────────

describe('constructor', () => {
  it('throws TypeError when endpoints is an empty array', () => {
    expect(() => new RpcRouter({ endpoints: [] })).toThrow(TypeError);
  });

  it('throws TypeError when endpoints is not an array', () => {
    // @ts-expect-error intentional
    expect(() => new RpcRouter({ endpoints: EP1 })).toThrow(TypeError);
  });

  it('throws TypeError when an endpoint entry is an empty string', () => {
    expect(() => new RpcRouter({ endpoints: [EP1, ''] })).toThrow(TypeError);
  });

  it('constructs successfully with valid endpoints', () => {
    expect(() => new RpcRouter({ endpoints: [EP1] })).not.toThrow();
  });
});

// ─── getActiveUrl() ─────────────────────────────────────────────────────────

describe('getActiveUrl()', () => {
  it('returns the first endpoint URL immediately after construction', () => {
    const router = new RpcRouter({ endpoints: [EP1, EP2] });
    expect(router.getActiveUrl()).toBe(EP1);
  });
});

// ─── getState() ─────────────────────────────────────────────────────────────

describe('getState()', () => {
  it('returns a snapshot with the correct endpoint count', () => {
    const router = new RpcRouter({ endpoints: [EP1, EP2] });
    const state = router.getState();
    expect(state.endpoints).toHaveLength(2);
    expect(state.activeIndex).toBe(0);
  });

  it('returns a frozen object — top-level mutations are ignored', () => {
    const router = new RpcRouter({ endpoints: [EP1] });
    const state = router.getState();
    expect(Object.isFrozen(state)).toBe(true);
  });

  it('mutations on the snapshot do not affect the internal state', () => {
    const router = new RpcRouter({ endpoints: [EP1] });
    const state = router.getState();
    try {
      // @ts-expect-error intentional mutation
      state.activeIndex = 99;
    } catch {
      // frozen — expected in strict mode
    }
    expect(router.getState().activeIndex).toBe(0);
  });
});

// ─── getHealthySummary() ────────────────────────────────────────────────────

describe('getHealthySummary()', () => {
  it('returns all endpoints on fresh construction (all start healthy)', () => {
    const router = new RpcRouter({ endpoints: [EP1, EP2] });
    expect(router.getHealthySummary()).toHaveLength(2);
  });
});

// ─── call() ─────────────────────────────────────────────────────────────────

describe('call()', () => {
  it('returns the result from the active endpoint on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({ sequence: 100 })));
    const router = new RpcRouter({ endpoints: [EP1] });
    const result = await router.call<{ sequence: number }>('getLatestLedger');
    expect(result).toEqual({ sequence: 100 });
  });

  it('falls back to the next endpoint on RpcNetworkError', async () => {
    const fetchSpy = vi
      .fn()
      .mockRejectedValueOnce(new RpcNetworkError('down', EP1))
      .mockResolvedValue(okResponse({ sequence: 1 }));
    vi.stubGlobal('fetch', fetchSpy);

    const result = await new RpcRouter({ endpoints: [EP1, EP2], maxRetries: 3 }).call<{
      sequence: number;
    }>('getLatestLedger');
    expect(result).toEqual({ sequence: 1 });
  });

  it('falls back to the next endpoint on RpcTimeoutError', async () => {
    const fetchSpy = vi
      .fn()
      .mockRejectedValueOnce(new RpcTimeoutError('slow', EP1, 5_000))
      .mockResolvedValue(okResponse({ sequence: 2 }));
    vi.stubGlobal('fetch', fetchSpy);

    const result = await new RpcRouter({ endpoints: [EP1, EP2], maxRetries: 3 }).call<{
      sequence: number;
    }>('getLatestLedger');
    expect(result).toEqual({ sequence: 2 });
  });

  it('throws RpcResponseError immediately — no fallback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(rpcErrorResponse(-32601, 'Method not found')));
    await expect(
      new RpcRouter({ endpoints: [EP1, EP2], maxRetries: 3 }).call('getLatestLedger'),
    ).rejects.toBeInstanceOf(RpcResponseError);
  });

  it('throws after maxRetries are exhausted', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new RpcNetworkError('down', EP1)));
    await expect(
      new RpcRouter({ endpoints: [EP1, EP2, EP3], maxRetries: 3 }).call('getLatestLedger'),
    ).rejects.toBeInstanceOf(RpcNetworkError);
  });

  it('advances activeIndex on each network failure and wraps around', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new RpcNetworkError('down', EP1)));
    const router = new RpcRouter({ endpoints: [EP1, EP2, EP3], maxRetries: 3 });
    await router.call('getLatestLedger').catch(() => undefined);
    expect(router.getState().activeIndex).toBe(0); // wraps back after 3 tries across 3 endpoints
  });
});

// ─── pingAll() ──────────────────────────────────────────────────────────────

describe('pingAll()', () => {
  it('marks an endpoint healthy and records latency after a successful ping', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({ sequence: 1 })));
    const router = new RpcRouter({ endpoints: [EP1] });
    await router.pingAll();

    const [ep] = router.getState().endpoints;
    expect(ep?.status).toBe('healthy');
    expect(typeof ep?.latencyMs).toBe('number');
    expect(ep?.lastChecked).toBeInstanceOf(Date);
    expect(ep?.consecutiveFailures).toBe(0);
  });

  it('marks an endpoint degraded after one failed ping', async () => {
    const abortErr = Object.assign(new Error('abort'), { name: 'AbortError' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortErr));
    const router = new RpcRouter({ endpoints: [EP1] });
    await router.pingAll();

    const [ep] = router.getState().endpoints;
    expect(ep?.status).toBe('degraded');
    expect(ep?.consecutiveFailures).toBe(1);
  });

  it('marks an endpoint unreachable after 3 consecutive failed pings', async () => {
    const abortErr = Object.assign(new Error('abort'), { name: 'AbortError' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortErr));
    const router = new RpcRouter({ endpoints: [EP1] });
    await router.pingAll();
    await router.pingAll();
    await router.pingAll();

    const [ep] = router.getState().endpoints;
    expect(ep?.status).toBe('unreachable');
    expect(ep?.consecutiveFailures).toBe(3);
  });

  it('resets an endpoint to healthy after it recovers from failure', async () => {
    const abortErr = Object.assign(new Error('abort'), { name: 'AbortError' });
    const fetchSpy = vi
      .fn()
      .mockRejectedValueOnce(abortErr)
      .mockResolvedValue(okResponse({ sequence: 1 }));
    vi.stubGlobal('fetch', fetchSpy);
    const router = new RpcRouter({ endpoints: [EP1] });
    await router.pingAll();
    await router.pingAll();

    const [ep] = router.getState().endpoints;
    expect(ep?.status).toBe('healthy');
    expect(ep?.consecutiveFailures).toBe(0);
  });

  it('resets activeIndex to 0 after every ping cycle', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({ sequence: 1 })));
    const router = new RpcRouter({ endpoints: [EP1, EP2] });
    await router.pingAll();
    expect(router.getState().activeIndex).toBe(0);
  });
});

// ─── start() / stop() ───────────────────────────────────────────────────────

describe('start() / stop()', () => {
  it('start() does not throw', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({})));
    const router = new RpcRouter({ endpoints: [EP1] });
    expect(() => router.start()).not.toThrow();
    router.stop();
  });

  it('stop() clears the health-check timer', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({})));
    const clearSpy = vi.spyOn(globalThis, 'clearInterval');
    const router = new RpcRouter({ endpoints: [EP1] });
    router.start();
    router.stop();
    expect(clearSpy).toHaveBeenCalledOnce();
  });

  it('stop() is idempotent — safe to call multiple times', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({})));
    const router = new RpcRouter({ endpoints: [EP1] });
    router.start();
    expect(() => {
      router.stop();
      router.stop();
    }).not.toThrow();
  });
});

// ─── Symbol.asyncDispose ────────────────────────────────────────────────────

describe('[Symbol.asyncDispose]()', () => {
  it('calls stop() when disposed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({})));
    const router = new RpcRouter({ endpoints: [EP1] });
    router.start();
    const stopSpy = vi.spyOn(router, 'stop');
    await router[Symbol.asyncDispose]();
    expect(stopSpy).toHaveBeenCalledOnce();
  });
});
