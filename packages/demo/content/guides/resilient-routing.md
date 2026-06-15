---
title: Resilient RPC Routing
description: Configure RpcRouter for production — endpoint pools, timeouts, retries, health checks, and graceful shutdown.
---

A single public Soroban endpoint is a single point of failure. `RpcRouter` pools several,
routes to the fastest healthy one, and fails over automatically. This guide covers configuring
it for production.

> [!NOTE]
> Routing fails over on **network** and **timeout** errors only. A valid RPC error response
> (e.g. a bad request) is returned immediately — switching endpoints wouldn't help.

## Basic setup

```ts
import { RpcRouter } from 'stellar-lens';

const router = new RpcRouter({
  endpoints: [
    'https://soroban-testnet.stellar.org',
    'https://rpc.ankr.com/stellar_testnet',
  ],
  timeout: 10_000,
});

router.start(); // ping all endpoints, rank by latency, begin health checks

const ledger = await router.call<{ sequence: number }>('getLatestLedger');
```

## Configuration

| Option | Default | Purpose |
| --- | --- | --- |
| `endpoints` | — (required) | The pool of RPC URLs to route across. |
| `timeout` | `30000` | Per-request timeout in ms, applied to every endpoint. |
| `maxRetries` | `3` | How many endpoints to try before giving up on a call. |
| `healthCheckIntervalMs` | `30000` | How often the background timer re-pings and re-ranks. |
| `fallbackOnFailure` | `true` | Whether to advance to the next endpoint on network/timeout errors. |

```ts
const router = new RpcRouter({
  endpoints,
  timeout: 8_000,
  maxRetries: endpoints.length, // try every endpoint once
  healthCheckIntervalMs: 15_000,
});
```

## The lifecycle

`start()` is fire-and-forget: it kicks off the first ranking ping and starts the health-check
timer, but **does not block**. If you need the pool ranked before your first call, await an
explicit ping:

```ts
const router = new RpcRouter({ endpoints });
await router.pingAll(); // ensures latency ranking before the first call
const ledger = await router.call('getLatestLedger');
```

## Inspecting health

```ts
router.getActiveUrl();       // the endpoint currently serving calls
router.getHealthySummary();  // endpoints currently reporting healthy
router.getState();           // full frozen snapshot: latency, status, failures
```

## Graceful shutdown

The health-check timer keeps the process alive. Always stop the router when you're done — in
long-lived servers, on shutdown signals:

```ts
router.stop();
```

`RpcRouter` also implements `Symbol.asyncDispose`, so you can scope it with
`await using` (TC39 Explicit Resource Management):

```ts
await using router = new RpcRouter({ endpoints });
router.start();
const ledger = await router.call('getLatestLedger');
// router.stop() runs automatically at the end of scope
```

## Next steps

- [Networks](/docs/guides/networks) — testnet vs mainnet endpoints
- [RpcRouter reference](/docs/api/rpc-router)
