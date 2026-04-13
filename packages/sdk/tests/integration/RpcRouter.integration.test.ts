// Integration tests — these hit live Soroban testnet endpoints over the network.
// Run with: pnpm --filter stellar-lens test:integration
// Do NOT include in the regular unit-test suite (CI runs them separately).

import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { RpcRouter } from '../../src/rpc/RpcRouter';

// ─── constants ───────────────────────────────────────────────────────────────

const TESTNET_ENDPOINTS = [
  'https://soroban-testnet.stellar.org',
  'https://rpc.ankr.com/stellar_testnet',
];

const UNREACHABLE_URL = 'https://localhost:1';
const TIMEOUT_MS = 30_000;

interface LatestLedgerResult {
  id: string;
  sequence: number;
  protocolVersion: number;
}

// ─── shared router ───────────────────────────────────────────────────────────

let router: RpcRouter;

afterEach(() => {
  router?.stop();
});

// ─── tests ───────────────────────────────────────────────────────────────────

describe('RpcRouter — live testnet', () => {
  beforeAll(async () => {
    // Warm up DNS + TLS before the first test runs.
    const warmup = new RpcRouter({ endpoints: TESTNET_ENDPOINTS, timeout: TIMEOUT_MS });
    await warmup.pingAll();
    warmup.stop();
  }, TIMEOUT_MS);

  it(
    'initialises and pings all real providers without throwing',
    async () => {
      router = new RpcRouter({ endpoints: TESTNET_ENDPOINTS, timeout: TIMEOUT_MS });
      await expect(router.pingAll()).resolves.not.toThrow();
    },
    TIMEOUT_MS,
  );

  it(
    'call("getLatestLedger") succeeds through the router',
    async () => {
      router = new RpcRouter({ endpoints: TESTNET_ENDPOINTS, timeout: TIMEOUT_MS });
      await router.pingAll();
      const result = await router.call<LatestLedgerResult>('getLatestLedger');
      expect(result).toHaveProperty('sequence');
      expect(Number.isInteger(result.sequence)).toBe(true);
      expect(result.sequence).toBeGreaterThan(0);
    },
    TIMEOUT_MS,
  );

  it(
    'getState() shows real latency values after pingAll',
    async () => {
      router = new RpcRouter({ endpoints: TESTNET_ENDPOINTS, timeout: TIMEOUT_MS });
      await router.pingAll();

      const { endpoints } = router.getState();
      const healthyEndpoints = endpoints.filter((e) => e.status === 'healthy');

      // At least one endpoint must have responded with a real latency.
      expect(healthyEndpoints.length).toBeGreaterThan(0);
      for (const ep of healthyEndpoints) {
        expect(ep.latencyMs).not.toBeNull();
        expect(ep.latencyMs!).toBeGreaterThanOrEqual(0);
        expect(ep.lastChecked).toBeInstanceOf(Date);
      }
    },
    TIMEOUT_MS,
  );

  it(
    'the fastest endpoint is ranked at index 0 after pingAll',
    async () => {
      router = new RpcRouter({ endpoints: TESTNET_ENDPOINTS, timeout: TIMEOUT_MS });
      await router.pingAll();

      const { endpoints } = router.getState();
      // Endpoints with a real latency reading must be sorted ascending.
      const withLatency = endpoints.filter((e) => e.latencyMs !== null);
      for (let i = 1; i < withLatency.length; i++) {
        expect(withLatency[i - 1]!.latencyMs!).toBeLessThanOrEqual(withLatency[i]!.latencyMs!);
      }
      // The active index is always reset to 0 after a ping cycle.
      expect(router.getState().activeIndex).toBe(0);
    },
    TIMEOUT_MS,
  );

  it(
    'returns a valid result even when one endpoint is unreachable',
    async () => {
      // Mix one real endpoint with one that will never respond.
      router = new RpcRouter({
        endpoints: [UNREACHABLE_URL, TESTNET_ENDPOINTS[0]!],
        maxRetries: 3,
        timeout: 5_000,
      });
      await router.pingAll();

      // The router should fall back to the healthy endpoint automatically.
      const result = await router.call<LatestLedgerResult>('getLatestLedger');
      expect(result.sequence).toBeGreaterThan(0);
    },
    TIMEOUT_MS,
  );
});
