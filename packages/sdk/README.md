# stellar-lens

[![npm version](https://img.shields.io/npm/v/stellar-lens.svg)](https://www.npmjs.com/package/stellar-lens)
[![CI](https://github.com/ezedike-evan/stellar-lens/actions/workflows/ci.yml/badge.svg)](https://github.com/ezedike-evan/stellar-lens/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TypeScript SDK for Soroban — smart RPC routing with latency-ranked automatic fallback, transaction pre-flight simulation, and human-readable XDR error decoding on the Stellar network.

---

## Features

- **`RpcClient`** — Thin, typed JSON-RPC 2.0 client with configurable timeouts and structured error classes
- **`RpcRouter`** — Pool of RPC endpoints ranked by latency; automatically falls back to the next healthy endpoint on failure and self-heals on a configurable interval
- **TypeScript-native** — Full type declarations included; no `@types/*` packages required
- **Zero heavy dependencies** — No Stellar SDK required to get started; bring only what you need

---

## Installation

```sh
npm install stellar-lens
```

```sh
pnpm add stellar-lens
```

```sh
yarn add stellar-lens
```

---

## Quick Start

### Smart routing across multiple endpoints

```ts
import { RpcRouter } from 'stellar-lens';

const router = new RpcRouter({
  endpoints: [
    'https://soroban-testnet.stellar.org',
    'https://rpc.ankr.com/stellar_testnet',
  ],
  timeout: 10_000,
});

// Pings all endpoints, ranks by latency, starts the health-check timer.
router.start();

interface LatestLedgerResult {
  id: string;
  sequence: number;
  protocolVersion: number;
}

// Always routed to the fastest available endpoint.
const ledger = await router.call<LatestLedgerResult>('getLatestLedger');
console.log(`Latest ledger: ${ledger.sequence}`);

router.stop();
```

Use `await using` if your environment supports the [TC39 Explicit Resource Management](https://github.com/tc39/proposal-explicit-resource-management) proposal — `stop()` is called automatically when the block exits:

```ts
await using router = new RpcRouter({
  endpoints: ['https://soroban-testnet.stellar.org'],
});

router.start();
const ledger = await router.call<LatestLedgerResult>('getLatestLedger');
```

### Single endpoint

```ts
import { RpcClient } from 'stellar-lens';

const client = new RpcClient({
  url: 'https://soroban-testnet.stellar.org',
  timeout: 10_000,
});

const ledger = await client.call<LatestLedgerResult>('getLatestLedger');
console.log(`Protocol version: ${ledger.protocolVersion}`);
```

---

## Error Handling

All errors thrown by `stellar-lens` are typed. Import the classes to handle specific failure cases:

```ts
import {
  RpcClient,
  RpcTimeoutError,
  RpcNetworkError,
  RpcResponseError,
  RpcParseError,
} from 'stellar-lens';

const client = new RpcClient({ url: 'https://soroban-testnet.stellar.org' });

try {
  const result = await client.call('getLatestLedger');
} catch (err) {
  if (err instanceof RpcTimeoutError) {
    console.error(`Timed out after ${err.timeoutMs}ms on ${err.url}`);
  } else if (err instanceof RpcNetworkError) {
    console.error(`Network failure on ${err.url}: ${err.message}`);
  } else if (err instanceof RpcResponseError) {
    console.error(`RPC error ${err.code}: ${err.message}`, err.data);
  } else if (err instanceof RpcParseError) {
    console.error(`Invalid JSON response: ${err.message}`);
  }
}
```

| Class | Properties | Thrown when |
|---|---|---|
| `RpcTimeoutError` | `url`, `timeoutMs` | Request exceeded the configured timeout |
| `RpcNetworkError` | `url` | Fetch failed or server returned a non-2xx status |
| `RpcResponseError` | `code`, `data` | Server returned a JSON-RPC error object |
| `RpcParseError` | — | Response body could not be parsed as JSON |

> `RpcRouter` retries on `RpcNetworkError` and `RpcTimeoutError` before giving up. `RpcResponseError` and `RpcParseError` are thrown immediately — the endpoint responded, so routing is not the issue.

---

## API

Full documentation for each module:

- [RpcClient](https://github.com/ezedike-evan/stellar-lens/blob/main/docs/rpc-client.md) — single-endpoint JSON-RPC client
- [RpcRouter](https://github.com/ezedike-evan/stellar-lens/blob/main/docs/rpc-router.md) — multi-endpoint router with health checking and fallback

---

## License

[MIT](./LICENSE)
