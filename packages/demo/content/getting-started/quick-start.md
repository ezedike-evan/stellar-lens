---
title: Quick Start
description: Make your first resilient Soroban RPC call in under 5 minutes.
---

## Single endpoint (RpcClient)

If you control a dedicated RPC endpoint and just need typed errors and timeouts, use `RpcClient` directly:

```ts
import { RpcClient } from 'stellar-lens'

const client = new RpcClient({
  url: 'https://soroban-testnet.stellar.org',
  timeout: 10_000,
})

interface LatestLedgerResult {
  id: string
  sequence: number
  protocolVersion: number
}

const ledger = await client.call<LatestLedgerResult>('getLatestLedger')
console.log(ledger.sequence) // e.g. 1234567
```

## Multiple endpoints (RpcRouter)

For production use, point `RpcRouter` at multiple public providers. It will ping them all, pick the fastest, and automatically retry on failure:

```ts
import { RpcRouter } from 'stellar-lens'

const router = new RpcRouter({
  endpoints: [
    'https://soroban-testnet.stellar.org',
    'https://rpc.ankr.com/stellar_testnet',
    'https://stellar-testnet.blockdaemon.com/soroban/rpc',
  ],
  healthCheckIntervalMs: 60_000,
  maxRetries: 3,
})

// Ping all endpoints and start the health-check timer
router.start()

const ledger = await router.call<LatestLedgerResult>('getLatestLedger')
console.log(router.getActiveUrl()) // whichever endpoint won the ping race

// Clean up when done
router.stop()
```

## Automatic cleanup with `await using`

`RpcRouter` implements `Symbol.asyncDispose`, so you can use the TC39 Explicit Resource Management syntax to automatically call `stop()`:

```ts
await using router = new RpcRouter({
  endpoints: ['https://soroban-testnet.stellar.org'],
})

router.start()
const ledger = await router.call<LatestLedgerResult>('getLatestLedger')
// router.stop() is called automatically when the block exits
```

## Error handling

```ts
import { RpcClient, RpcTimeoutError, RpcNetworkError, RpcResponseError } from 'stellar-lens'

try {
  const result = await client.call('getLatestLedger')
} catch (err) {
  if (err instanceof RpcTimeoutError) {
    console.error(`Timed out after ${err.timeoutMs}ms`)
  } else if (err instanceof RpcNetworkError) {
    console.error(`Network error: ${err.message}`)
  } else if (err instanceof RpcResponseError) {
    console.error(`RPC error ${err.code}: ${err.message}`)
  }
}
```

## Next steps

- [RpcClient reference](/docs/api/rpc-client) — all options, methods, and error classes
- [RpcRouter reference](/docs/api/rpc-router) — routing, fallback behaviour, and health checks
