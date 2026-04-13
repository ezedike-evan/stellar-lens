# RpcRouter

`RpcRouter` manages a pool of Soroban RPC endpoints and automatically routes calls to the fastest, healthiest one. On startup it pings every endpoint to measure latency, ranks them fastest-first, and re-checks the pool on a configurable interval. When a call fails due to a network or timeout error, the router advances to the next endpoint and retries — all transparently to the caller.

`RpcRouter` builds on top of [`RpcClient`](./rpc-client.md). Every higher-level SDK module that needs resilient RPC access — `TransactionSimulator`, `FeeEstimator` — uses a router rather than a bare client.

---

## Supported Providers

The following public Soroban RPC endpoints are known to work with `RpcRouter`:

| Provider | Testnet URL | Mainnet URL |
|---|---|---|
| SDF (Stellar Development Foundation) | `https://soroban-testnet.stellar.org` | `https://mainnet.stellar.validationcloud.io/v1/<key>` |
| Ankr | `https://rpc.ankr.com/stellar_testnet` | `https://rpc.ankr.com/stellar` |
| Blockdaemon | `https://stellar-testnet.blockdaemon.com/soroban/rpc` | `https://stellar.blockdaemon.com/soroban/rpc` |
| Validation Cloud | `https://testnet.stellar.validationcloud.io/v1/<key>` | `https://mainnet.stellar.validationcloud.io/v1/<key>` |

Pass multiple endpoints to maximise resilience — the router will prefer whichever responds fastest.

---

## Configuration

Pass a `RouterConfig` object to the constructor.

| Option | Type | Required | Default | Description |
|---|---|---|---|---|
| `endpoints` | `readonly string[]` | Yes | — | One or more Soroban RPC endpoint URLs |
| `healthCheckIntervalMs` | `number` | No | `30000` | How often (ms) to re-ping all endpoints |
| `maxRetries` | `number` | No | `3` | Maximum call attempts before throwing |
| `fallbackOnFailure` | `boolean` | No | `true` | Whether to advance to the next endpoint on failure |
| `timeout` | `number` | No | `30000` | Per-request timeout in milliseconds |

```ts
const router = new RpcRouter({
  endpoints: [
    'https://soroban-testnet.stellar.org',
    'https://rpc.ankr.com/stellar_testnet',
  ],
  healthCheckIntervalMs: 60_000,
  maxRetries: 3,
  timeout: 10_000,
});
```

If `endpoints` is missing, empty, or contains a non-string value, the constructor throws a `TypeError` immediately.

---

## Usage

### Basic example

```ts
import { RpcRouter } from 'stellar-lens';

const router = new RpcRouter({
  endpoints: [
    'https://soroban-testnet.stellar.org',
    'https://rpc.ankr.com/stellar_testnet',
  ],
});

// Ping all endpoints and start the periodic health-check timer.
router.start();

interface LatestLedgerResult {
  id: string;
  sequence: number;
  protocolVersion: number;
}

// Routes to the fastest available endpoint automatically.
const ledger = await router.call<LatestLedgerResult>('getLatestLedger');
console.log(ledger.sequence);

// Stop the timer when you're done.
router.stop();
```

### Using `await using` (automatic cleanup)

`RpcRouter` implements `Symbol.asyncDispose`, so it integrates with the TC39 Explicit Resource Management proposal:

```ts
await using router = new RpcRouter({
  endpoints: ['https://soroban-testnet.stellar.org'],
});

router.start();
const ledger = await router.call<LatestLedgerResult>('getLatestLedger');
// router.stop() is called automatically when the block exits.
```

### Inspecting endpoint health

```ts
router.start();

// Active endpoint URL right now.
console.log(router.getActiveUrl());
// → 'https://soroban-testnet.stellar.org'

// Only the endpoints currently passing health checks.
const healthy = router.getHealthySummary();
healthy.forEach((e) => {
  console.log(`${e.url} — ${e.latencyMs}ms`);
});

// Full state snapshot including degraded/unreachable endpoints.
const state = router.getState();
console.log(state.activeIndex, state.endpoints);
```

---

## Fallback Behaviour

When `call()` is invoked, the router:

1. Picks the endpoint at `activeIndex` (always the fastest responding after the last health check).
2. Delegates to the underlying `RpcClient.call()`.
3. **On `RpcNetworkError` or `RpcTimeoutError`** — the endpoint is unreachable or too slow. The router increments `activeIndex` to the next candidate and retries.
4. **On `RpcResponseError` or `RpcParseError`** — the endpoint responded; the error is protocol-level, not a routing problem. The error is re-thrown immediately without fallback.
5. Steps 1–3 repeat until either a call succeeds or `maxRetries` attempts are exhausted, at which point the last error is thrown.

The health-check timer runs `pingAll()` in the background on the configured interval. After each ping cycle, endpoints are re-sorted by latency and `activeIndex` is reset to `0` (the fastest). This means the router self-heals: a previously unreachable endpoint will be promoted again once it recovers.

---

## API Reference

### `new RpcRouter(config)`

Creates a new router instance. Does **not** start the health-check timer — call `start()` separately.

**Parameters**

| Name | Type | Description |
|---|---|---|
| `config.endpoints` | `readonly string[]` | Non-empty array of Soroban RPC URLs |
| `config.healthCheckIntervalMs` | `number?` | Health-check interval in ms (default: `30000`) |
| `config.maxRetries` | `number?` | Max call attempts (default: `3`) |
| `config.fallbackOnFailure` | `boolean?` | Advance to next endpoint on failure (default: `true`) |
| `config.timeout` | `number?` | Per-request timeout in ms (default: `30000`) |

**Throws**

- `TypeError` — if `endpoints` is missing, empty, or contains a non-string value

---

### `start()`

Pings all endpoints immediately, then starts the periodic health-check timer.

**Returns** `void`

> Call `stop()` when the router is no longer needed to prevent the timer from keeping the process alive.

---

### `stop()`

Clears the health-check timer. Safe to call multiple times.

**Returns** `void`

---

### `call<T>(method, params?)`

Routes a JSON-RPC 2.0 call to the active endpoint, retrying with fallback on transient failures.

**Parameters**

| Name | Type | Description |
|---|---|---|
| `method` | `string` | RPC method name (e.g. `'getLatestLedger'`) |
| `params` | `unknown[]?` | Positional parameters (omit if the method takes none) |

**Returns** `Promise<T>`

**Throws**

| Error | When |
|---|---|
| `RpcNetworkError` | All retries exhausted due to network failures |
| `RpcTimeoutError` | All retries exhausted due to timeout failures |
| `RpcResponseError` | Server returned a JSON-RPC error — thrown immediately, no fallback |
| `RpcParseError` | Response body was not valid JSON — thrown immediately, no fallback |

---

### `getState()`

Returns a frozen snapshot of the current router state. Mutations to the returned object have no effect on the router.

**Returns** `Readonly<RouterState>`

```ts
interface RouterState {
  endpoints: EndpointHealth[];
  activeIndex: number;
}
```

---

### `getHealthySummary()`

Returns only the endpoints currently reporting a `'healthy'` status.

**Returns** `readonly EndpointHealth[]`

```ts
interface EndpointHealth {
  url: string;
  status: 'healthy' | 'degraded' | 'unreachable';
  latencyMs: number | null;
  lastChecked: Date | null;
  consecutiveFailures: number;
}
```

---

### `getActiveUrl()`

Returns the URL of the endpoint currently selected for outgoing calls.

**Returns** `string` — the URL at `activeIndex`, or `''` if the endpoint list is empty.

---

### `pingAll()`

Pings every endpoint concurrently, updates their health records, re-sorts by latency, and resets `activeIndex` to `0`. Called automatically by the health-check timer; you can also call it manually to force an immediate re-rank.

**Returns** `Promise<void>`

---

### `[Symbol.asyncDispose]()`

Calls `stop()`. Allows the router to be used in `await using` blocks (TC39 Explicit Resource Management).

**Returns** `Promise<void>`
