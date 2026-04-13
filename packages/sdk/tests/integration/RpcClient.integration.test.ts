// Integration tests — these hit the live Soroban testnet over the network.
// Run with: pnpm --filter stellar-lens test:integration
// Do NOT include in the regular unit-test suite (CI runs them separately).

import { describe, it, expect, beforeAll } from 'vitest';
import { RpcClient } from '../../src/rpc/RpcClient';
import { RpcResponseError, RpcNetworkError } from '../../src/rpc/errors';

const TESTNET_URL = 'https://soroban-testnet.stellar.org';
const UNREACHABLE_URL = 'https://localhost:1';
const TIMEOUT_MS = 30_000;

interface LatestLedgerResult {
  id: string;
  sequence: number;
  protocolVersion: number;
}

const client = new RpcClient({ url: TESTNET_URL });

// ─── getLatestLedger ────────────────────────────────────────────────────────

describe('RpcClient — live testnet', () => {
  beforeAll(async () => {
    // Warm up DNS + TLS connection so the first real test does not pay
    // the cold-start penalty and fail on an otherwise healthy endpoint.
    await client.healthCheck();
  }, TIMEOUT_MS);

  it(
    'call("getLatestLedger") returns a response with a sequence field',
    async () => {
      const result = await client.call<LatestLedgerResult>('getLatestLedger');
      expect(result).toHaveProperty('sequence');
    },
    TIMEOUT_MS,
  );

  it(
    'sequence is a positive integer',
    async () => {
      const result = await client.call<LatestLedgerResult>('getLatestLedger');
      expect(typeof result.sequence).toBe('number');
      expect(Number.isInteger(result.sequence)).toBe(true);
      expect(result.sequence).toBeGreaterThan(0);
    },
    TIMEOUT_MS,
  );

  it(
    'the response shape matches the expected Soroban result structure',
    async () => {
      const result = await client.call<LatestLedgerResult>('getLatestLedger');
      // JSON-RPC 2.0: call() unwraps and returns the result field directly.
      // The result itself must include these three fields per the Soroban spec.
      expect(result).toMatchObject({
        id: expect.any(String),
        sequence: expect.any(Number),
        protocolVersion: expect.any(Number),
      });
    },
    TIMEOUT_MS,
  );

  it(
    'calling an invalid method throws RpcResponseError',
    async () => {
      await expect(client.call('nonExistentMethod_xyz')).rejects.toBeInstanceOf(
        RpcResponseError,
      );
    },
    TIMEOUT_MS,
  );

  it(
    'RpcResponseError for an invalid method carries a non-zero error code',
    async () => {
      const err = await client.call('nonExistentMethod_xyz').catch((e: unknown) => e);
      expect((err as RpcResponseError).code).not.toBe(0);
    },
    TIMEOUT_MS,
  );

  it(
    'calling an unreachable URL throws RpcNetworkError',
    async () => {
      const unreachable = new RpcClient({ url: UNREACHABLE_URL, timeout: 5_000 });
      await expect(unreachable.call('getLatestLedger')).rejects.toBeInstanceOf(RpcNetworkError);
    },
    TIMEOUT_MS,
  );

  it(
    'healthCheck returns true against the live testnet',
    async () => {
      expect(await client.healthCheck()).toBe(true);
    },
    TIMEOUT_MS,
  );
});
