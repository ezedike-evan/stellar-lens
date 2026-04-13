# RpcClient

`RpcClient` is the lowest-level network primitive in the StellarLens SDK. It sends JSON-RPC 2.0 requests to a Soroban RPC endpoint over HTTP, handles timeouts, classifies network and protocol errors into typed classes, and returns the decoded result. Every higher-level SDK module — `RpcRouter`, `TransactionSimulator`, `FeeEstimator` — builds on top of `RpcClient`.

---

## Installation

`RpcClient` is exported from the `stellar-lens` package:

```ts
import { RpcClient } from 'stellar-lens';
```

---

## Configuration

Pass a `RpcClientConfig` object to the constructor.

| Option | Type | Required | Default | Description |
|---|---|---|---|---|
| `url` | `string` | Yes | — | The full URL of the Soroban RPC endpoint |
| `timeout` | `number` | No | `30000` | Request timeout in milliseconds |

```ts
const client = new RpcClient({
  url: 'https://soroban-testnet.stellar.org',
  timeout: 10_000, // 10 seconds
});
```

If `url` is missing or not a string, the constructor throws a `TypeError` immediately.

---

## Usage

### Call a Soroban RPC method

```ts
import { RpcClient } from 'stellar-lens';

const client = new RpcClient({
  url: 'https://soroban-testnet.stellar.org',
});

interface LatestLedgerResult {
  id: string;
  sequence: number;
  protocolVersion: number;
}

const ledger = await client.call<LatestLedgerResult>('getLatestLedger');

console.log(ledger.sequence);        // e.g. 1234567
console.log(ledger.protocolVersion); // e.g. 21
```

### Check endpoint health

```ts
const healthy = await client.healthCheck();

if (!healthy) {
  console.warn('Endpoint is not responding');
}
```

---

## Error Handling

All errors thrown by `RpcClient` are typed. Import them to handle specific failure cases:

```ts
import {
  RpcClient,
  RpcTimeoutError,
  RpcNetworkError,
  RpcResponseError,
  RpcParseError,
} from 'stellar-lens';

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

### Error classes

| Class | Properties | Cause |
|---|---|---|
| `RpcTimeoutError` | `url`, `timeoutMs` | Request exceeded the configured timeout |
| `RpcNetworkError` | `url` | Fetch failed (connection refused, DNS failure) or server returned a non-2xx HTTP status |
| `RpcResponseError` | `code`, `data` | Server returned a valid JSON-RPC error object |
| `RpcParseError` | — | Response body could not be parsed as JSON |

---

## API Reference

### `new RpcClient(config)`

Creates a new client instance.

**Parameters**

| Name | Type | Description |
|---|---|---|
| `config.url` | `string` | Soroban RPC endpoint URL |
| `config.timeout` | `number?` | Request timeout in ms (default: `30000`) |

**Throws**

- `TypeError` — if `config.url` is missing or not a string

---

### `call<T>(method, params?)`

Executes a JSON-RPC 2.0 method call and returns the typed result.

**Parameters**

| Name | Type | Description |
|---|---|---|
| `method` | `string` | RPC method name (e.g. `'getLatestLedger'`) |
| `params` | `unknown[]?` | Positional parameters (omit if the method takes none) |

**Returns** `Promise<T>`

**Throws**

| Error | When |
|---|---|
| `RpcTimeoutError` | Request exceeds `config.timeout` |
| `RpcNetworkError` | Fetch fails or HTTP status is not 2xx |
| `RpcParseError` | Response body is not valid JSON |
| `RpcResponseError` | Server returns a JSON-RPC error object |

---

### `getUrl()`

Returns the configured endpoint URL.

**Returns** `string`

---

### `healthCheck()`

Calls `getLatestLedger` to verify the endpoint is reachable and responding correctly.

**Returns** `Promise<boolean>` — `true` if the endpoint responds successfully, `false` if any error is thrown.

> `healthCheck` never throws. All errors are caught internally and returned as `false`.
