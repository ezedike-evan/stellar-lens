import { describe, it, expect } from 'vitest';
import {
  RpcClient,
  RpcRouter,
  RpcNetworkError,
  RpcResponseError,
  RpcTimeoutError,
  RpcParseError,
} from '../src/index';
import type {
  RpcRequest,
  RpcResponse,
  RpcClientConfig,
  RouterConfig,
  RouterState,
  EndpointHealth,
  EndpointStatus,
} from '../src/index';

describe('index exports', () => {
  it('exports RpcClient as a constructor', () => {
    expect(typeof RpcClient).toBe('function');
  });

  it('exports RpcRouter as a constructor', () => {
    expect(typeof RpcRouter).toBe('function');
  });

  it('exports RpcNetworkError as a constructor', () => {
    expect(typeof RpcNetworkError).toBe('function');
  });

  it('exports RpcResponseError as a constructor', () => {
    expect(typeof RpcResponseError).toBe('function');
  });

  it('exports RpcTimeoutError as a constructor', () => {
    expect(typeof RpcTimeoutError).toBe('function');
  });

  it('exports RpcParseError as a constructor', () => {
    expect(typeof RpcParseError).toBe('function');
  });

  it('RpcClient instances are created correctly', () => {
    const client = new RpcClient({ url: 'https://soroban-testnet.stellar.org' });
    expect(client.getUrl()).toBe('https://soroban-testnet.stellar.org');
  });

  it('RpcRouter instances are created correctly', () => {
    const router = new RpcRouter({
      endpoints: ['https://soroban-testnet.stellar.org'],
    });
    expect(router.getActiveUrl()).toBe('https://soroban-testnet.stellar.org');
  });

  it('error classes extend Error', () => {
    expect(new RpcNetworkError('msg', 'https://x.com')).toBeInstanceOf(Error);
    expect(new RpcResponseError('msg', -32600, undefined)).toBeInstanceOf(Error);
    expect(new RpcTimeoutError('msg', 'https://x.com', 5000)).toBeInstanceOf(Error);
    expect(new RpcParseError('msg')).toBeInstanceOf(Error);
  });

  it('error classes carry the right name', () => {
    expect(new RpcNetworkError('', 'u').name).toBe('RpcNetworkError');
    expect(new RpcResponseError('', 0, null).name).toBe('RpcResponseError');
    expect(new RpcTimeoutError('', 'u', 0).name).toBe('RpcTimeoutError');
    expect(new RpcParseError('').name).toBe('RpcParseError');
  });

  // Type-level checks: these only fail at compile time, not runtime.
  // If this file typechecks, all type exports are present and correct.
  it('type exports are valid (compile-time verification)', () => {
    const _req: RpcRequest = { jsonrpc: '2.0', id: 1, method: 'getLatestLedger' };
    const _res: RpcResponse<unknown> = { jsonrpc: '2.0', id: 1, result: {} };
    const _cfg: RpcClientConfig = { url: 'https://soroban-testnet.stellar.org' };
    const _rcfg: RouterConfig = { endpoints: ['https://soroban-testnet.stellar.org'] };
    const _health: EndpointHealth = {
      url: 'https://soroban-testnet.stellar.org',
      status: 'healthy',
      latencyMs: 42,
      lastChecked: new Date(),
      consecutiveFailures: 0,
    };
    const _status: EndpointStatus = 'healthy';
    const _state: RouterState = { endpoints: [_health], activeIndex: 0 };

    expect(_req.method).toBe('getLatestLedger');
    expect(_res.jsonrpc).toBe('2.0');
    expect(_cfg.url).toBeDefined();
    expect(_rcfg.endpoints).toHaveLength(1);
    expect(_health.status).toBe('healthy');
    expect(_status).toBe('healthy');
    expect(_state.activeIndex).toBe(0);
  });
});
