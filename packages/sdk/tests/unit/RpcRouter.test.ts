import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RpcRouter } from '../../src/rpc/RpcRouter';
import { RpcClient } from '../../src/rpc/RpcClient';
import type { EndpointHealth, RouterState } from '../../src/rpc/types';
import { RpcNetworkError, RpcTimeoutError, RpcResponseError } from '../../src/rpc/errors';

// Mock the entire RpcClient module so RpcRouter is tested in complete isolation.
// Every `new RpcClient()` call inside RpcRouter returns a controlled mock instance.
vi.mock('../../src/rpc/RpcClient');

// ─── constants ───────────────────────────────────────────────────────────────

const EP1 = 'https://soroban-testnet.stellar.org';
const EP2 = 'https://rpc.ankr.com/stellar_testnet';
const EP3 = 'https://stellar-testnet.blockdaemon.com/soroban/rpc';

// ─── shared mock handles ─────────────────────────────────────────────────────

let mockCall: ReturnType<typeof vi.fn>;
let mockHealthCheck: ReturnType<typeof vi.fn>;

// ─── setup / teardown ───────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();

  mockCall = vi.fn().mockResolvedValue({ sequence: 100 });
  mockHealthCheck = vi.fn().mockResolvedValue(true);

  vi.mocked(RpcClient).mockImplementation(function (config) {
    return {
      call: mockCall,
      healthCheck: mockHealthCheck,
      getUrl: vi.fn().mockReturnValue(config.url),
    } as unknown as RpcClient;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// ─── constructor ────────────────────────────────────────────────────────────

describe('constructor', () => {
  it('throws TypeError for an empty endpoints array', () => {
    expect(() => new RpcRouter({ endpoints: [] })).toThrow(TypeError);
  });

  it('throws TypeError for a non-string endpoint', () => {
    // @ts-expect-error intentional
    expect(() => new RpcRouter({ endpoints: [42] })).toThrow(TypeError);
  });

  it('throws TypeError for an empty string endpoint', () => {
    expect(() => new RpcRouter({ endpoints: [''] })).toThrow(TypeError);
  });

  it('constructs without throwing for valid endpoints', () => {
    expect(() => new RpcRouter({ endpoints: [EP1, EP2] })).not.toThrow();
  });

  it('creates exactly one RpcClient per endpoint', () => {
    new RpcRouter({ endpoints: [EP1, EP2, EP3] });
    expect(vi.mocked(RpcClient)).toHaveBeenCalledTimes(3);
  });

  it('passes each endpoint URL to the corresponding RpcClient', () => {
    new RpcRouter({ endpoints: [EP1, EP2] });
    const calls = vi.mocked(RpcClient).mock.calls;
    expect(calls[0]?.[0].url).toBe(EP1);
    expect(calls[1]?.[0].url).toBe(EP2);
  });
});

// ─── getState() ─────────────────────────────────────────────────────────────

describe('getState()', () => {
  it('returns initial state with all configured endpoints listed', () => {
    const router = new RpcRouter({ endpoints: [EP1, EP2] });
    const { endpoints, activeIndex } = router.getState();
    expect(endpoints).toHaveLength(2);
    expect(activeIndex).toBe(0);
  });

  it('initial latencyMs is null before the first ping', () => {
    const router = new RpcRouter({ endpoints: [EP1, EP2] });
    for (const ep of router.getState().endpoints) {
      expect(ep.latencyMs).toBeNull();
    }
  });

  it('initial consecutiveFailures is 0 for all endpoints', () => {
    const router = new RpcRouter({ endpoints: [EP1, EP2] });
    for (const ep of router.getState().endpoints) {
      expect(ep.consecutiveFailures).toBe(0);
    }
  });

  it('returns a frozen snapshot — mutations have no effect on router state', () => {
    const router = new RpcRouter({ endpoints: [EP1] });
    const state = router.getState() as RouterState;
    expect(Object.isFrozen(state)).toBe(true);
    try {
      state.activeIndex = 99;
    } catch {
      /* frozen */
    }
    expect(router.getState().activeIndex).toBe(0);
  });
});

// ─── pingAll() ──────────────────────────────────────────────────────────────

describe('pingAll()', () => {
  it('updates latencyMs to a number after a successful ping', async () => {
    mockHealthCheck.mockResolvedValue(true);
    const router = new RpcRouter({ endpoints: [EP1] });
    await router.pingAll();
    const [ep] = router.getState().endpoints;
    expect(typeof ep?.latencyMs).toBe('number');
    expect(ep?.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('sets status to "degraded" after 1 consecutive failure', async () => {
    mockHealthCheck.mockResolvedValue(false);
    const router = new RpcRouter({ endpoints: [EP1] });
    await router.pingAll();
    expect(router.getState().endpoints[0]?.status).toBe('degraded');
    expect(router.getState().endpoints[0]?.consecutiveFailures).toBe(1);
  });

  it('sets status to "unreachable" after 3 consecutive failures', async () => {
    mockHealthCheck.mockResolvedValue(false);
    const router = new RpcRouter({ endpoints: [EP1] });
    await router.pingAll();
    await router.pingAll();
    await router.pingAll();
    expect(router.getState().endpoints[0]?.status).toBe('unreachable');
    expect(router.getState().endpoints[0]?.consecutiveFailures).toBe(3);
  });

  it('resets consecutiveFailures to 0 on recovery', async () => {
    mockHealthCheck
      .mockResolvedValueOnce(false) // first ping fails
      .mockResolvedValue(true); // all subsequent succeed

    const router = new RpcRouter({ endpoints: [EP1] });
    await router.pingAll();
    expect(router.getState().endpoints[0]?.consecutiveFailures).toBe(1);
    await router.pingAll();
    expect(router.getState().endpoints[0]?.consecutiveFailures).toBe(0);
    expect(router.getState().endpoints[0]?.status).toBe('healthy');
  });

  it('sorts endpoints by latencyMs ascending — fastest first', async () => {
    // EP1 will appear "slower" because Date.now() advances between its start
    // and end measurement; EP2 will appear "faster".
    let nowCall = 0;
    // Date.now() call order inside pingAll (concurrent):
    //   call 1 → EP1 start, call 2 → EP2 start,
    //   call 3 → EP1 end, call 4 → EP2 end
    const nowValues = [0, 0, 200, 50]; // EP1: 200ms, EP2: 50ms
    vi.spyOn(Date, 'now').mockImplementation(() => nowValues[nowCall++] ?? 0);

    mockHealthCheck.mockResolvedValue(true);
    const router = new RpcRouter({ endpoints: [EP1, EP2] });
    await router.pingAll();

    const [first, second] = router.getState().endpoints;
    // Verify sorted: first latency ≤ second latency
    if (first?.latencyMs !== null && second?.latencyMs !== null) {
      expect(first!.latencyMs!).toBeLessThanOrEqual(second!.latencyMs!);
    }
  });

  it('sorts unreachable endpoints to the end of the list', async () => {
    // EP1 fails → latencyMs null; EP2 succeeds → latencyMs is a number
    mockHealthCheck
      .mockResolvedValueOnce(false) // EP1 ping fails
      .mockResolvedValueOnce(true); // EP2 ping succeeds

    const router = new RpcRouter({ endpoints: [EP1, EP2] });
    await router.pingAll();

    const endpoints = router.getState().endpoints;
    const lastEp = endpoints[endpoints.length - 1];
    expect(lastEp?.latencyMs).toBeNull();
  });

  it('resets activeIndex to 0 after every ping cycle', async () => {
    const router = new RpcRouter({ endpoints: [EP1, EP2] });
    await router.pingAll();
    expect(router.getState().activeIndex).toBe(0);
  });
});

// ─── call() ─────────────────────────────────────────────────────────────────

describe('call()', () => {
  it('routes to the active (lowest-latency) endpoint and returns the result', async () => {
    mockCall.mockResolvedValue({ sequence: 42 });
    const router = new RpcRouter({ endpoints: [EP1] });
    expect(await router.call<{ sequence: number }>('getLatestLedger')).toEqual({ sequence: 42 });
  });

  it('falls back to the next endpoint on RpcNetworkError', async () => {
    mockCall
      .mockRejectedValueOnce(new RpcNetworkError('down', EP1))
      .mockResolvedValueOnce({ sequence: 1 });

    const result = await new RpcRouter({ endpoints: [EP1, EP2], maxRetries: 3 }).call<{
      sequence: number;
    }>('getLatestLedger');
    expect(result).toEqual({ sequence: 1 });
  });

  it('falls back to the next endpoint on RpcTimeoutError', async () => {
    mockCall
      .mockRejectedValueOnce(new RpcTimeoutError('slow', EP1, 5_000))
      .mockResolvedValueOnce({ sequence: 2 });

    const result = await new RpcRouter({ endpoints: [EP1, EP2], maxRetries: 3 }).call<{
      sequence: number;
    }>('getLatestLedger');
    expect(result).toEqual({ sequence: 2 });
  });

  it('does NOT fall back on RpcResponseError — throws immediately', async () => {
    mockCall.mockRejectedValue(new RpcResponseError('bad method', -32601, null));
    await expect(
      new RpcRouter({ endpoints: [EP1, EP2], maxRetries: 3 }).call('getLatestLedger'),
    ).rejects.toBeInstanceOf(RpcResponseError);
    // Only one attempt — no fallback
    expect(mockCall).toHaveBeenCalledTimes(1);
  });

  it('throws the last error after exhausting all retries', async () => {
    mockCall.mockRejectedValue(new RpcNetworkError('all down', EP1));
    await expect(
      new RpcRouter({ endpoints: [EP1, EP2, EP3], maxRetries: 3 }).call('getLatestLedger'),
    ).rejects.toBeInstanceOf(RpcNetworkError);
    expect(mockCall).toHaveBeenCalledTimes(3);
  });

  it('returns the result on the first successful attempt', async () => {
    mockCall.mockResolvedValue({ sequence: 99 });
    const router = new RpcRouter({ endpoints: [EP1] });
    const result = await router.call<{ sequence: number }>('getLatestLedger');
    expect(result).toEqual({ sequence: 99 });
    expect(mockCall).toHaveBeenCalledTimes(1);
  });
});

// ─── start() ────────────────────────────────────────────────────────────────

describe('start()', () => {
  it('calls pingAll immediately on invocation', () => {
    const router = new RpcRouter({ endpoints: [EP1] });
    const pingAllSpy = vi.spyOn(router, 'pingAll').mockResolvedValue(undefined);
    router.start();
    expect(pingAllSpy).toHaveBeenCalledOnce();
    router.stop();
  });

  it('sets up a periodic health-check interval', () => {
    const router = new RpcRouter({ endpoints: [EP1], healthCheckIntervalMs: 5_000 });
    const pingAllSpy = vi.spyOn(router, 'pingAll').mockResolvedValue(undefined);
    router.start();
    expect(pingAllSpy).toHaveBeenCalledTimes(1); // immediate

    vi.advanceTimersByTime(5_000);
    expect(pingAllSpy).toHaveBeenCalledTimes(2); // first interval

    vi.advanceTimersByTime(5_000);
    expect(pingAllSpy).toHaveBeenCalledTimes(3); // second interval
    router.stop();
  });
});

// ─── stop() ─────────────────────────────────────────────────────────────────

describe('stop()', () => {
  it('clears the health-check interval', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearInterval');
    const router = new RpcRouter({ endpoints: [EP1] });
    vi.spyOn(router, 'pingAll').mockResolvedValue(undefined);
    router.start();
    router.stop();
    expect(clearSpy).toHaveBeenCalledOnce();
  });

  it('is safe to call multiple times without throwing', () => {
    const router = new RpcRouter({ endpoints: [EP1] });
    vi.spyOn(router, 'pingAll').mockResolvedValue(undefined);
    router.start();
    expect(() => {
      router.stop();
      router.stop();
    }).not.toThrow();
  });
});

// ─── getHealthySummary() ────────────────────────────────────────────────────

describe('getHealthySummary()', () => {
  it('returns all endpoints when all are healthy (initial state)', () => {
    const router = new RpcRouter({ endpoints: [EP1, EP2] });
    expect(router.getHealthySummary()).toHaveLength(2);
  });

  it('returns only healthy endpoints after a ping cycle with failures', async () => {
    mockHealthCheck
      .mockResolvedValueOnce(true) // EP1 healthy
      .mockResolvedValueOnce(false); // EP2 degraded

    const router = new RpcRouter({ endpoints: [EP1, EP2] });
    await router.pingAll();

    const healthy = router.getHealthySummary();
    expect(healthy).toHaveLength(1);
    expect(healthy.every((e: EndpointHealth) => e.status === 'healthy')).toBe(true);
  });

  it('returns an empty array when all endpoints are degraded', async () => {
    mockHealthCheck.mockResolvedValue(false);
    const router = new RpcRouter({ endpoints: [EP1, EP2] });
    await router.pingAll();
    expect(router.getHealthySummary()).toHaveLength(0);
  });
});

// ─── getActiveUrl() ─────────────────────────────────────────────────────────

describe('getActiveUrl()', () => {
  it('returns the URL of the current active endpoint on construction', () => {
    const router = new RpcRouter({ endpoints: [EP1, EP2] });
    expect(router.getActiveUrl()).toBe(EP1);
  });

  it('returns the next endpoint URL after a fallback increments activeIndex', async () => {
    mockCall
      .mockRejectedValueOnce(new RpcNetworkError('down', EP1))
      .mockResolvedValue({ sequence: 1 });

    const router = new RpcRouter({ endpoints: [EP1, EP2], maxRetries: 2 });
    await router.call('getLatestLedger');
    expect(router.getActiveUrl()).toBe(EP2);
  });
});

// ─── Uncovered Line Tests ───────────────────────────────────────────────────

describe('Edge cases and internal methods', () => {
  it('pingEndpoint throws if no client is registered (line 81)', async () => {
    const router = new RpcRouter({ endpoints: [EP1] });
    // pingEndpoint is private, so we access it via 'any'
    await expect((router as any).pingEndpoint('http://unregistered')).rejects.toThrow(
      'RpcRouter: no client registered for URL: http://unregistered'
    );
  });

  it('call() breaks if endpoint is undefined (line 188)', async () => {
    const router = new RpcRouter({ endpoints: [EP1] });
    // Force endpoint to be undefined by emptying the state endpoints array
    (router as any).state.endpoints = [];
    await expect(router.call('getLatestLedger')).rejects.toBeUndefined();
  });

  it('call() breaks if client is undefined (line 194)', async () => {
    const router = new RpcRouter({ endpoints: [EP1] });
    // Mutate state to include a URL that has no registered client
    (router as any).state.endpoints[0].url = 'http://unregistered';
    await expect(router.call('getLatestLedger')).rejects.toBeUndefined();
  });

  it('[Symbol.asyncDispose] stops the router (lines 245-246)', async () => {
    const router = new RpcRouter({ endpoints: [EP1] });
    const stopSpy = vi.spyOn(router, 'stop');
    await router[Symbol.asyncDispose]();
    expect(stopSpy).toHaveBeenCalledOnce();
  });
});
