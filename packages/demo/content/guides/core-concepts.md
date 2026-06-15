---
title: Core Concepts
description: The mental model behind StellarLens — what it does, what it deliberately does not, and how the pieces fit together.
---

StellarLens is a **thin, resilient access layer** between your application and the Soroban RPC
network. It deliberately does a few things well rather than wrapping the entire Stellar
protocol.

## What StellarLens does

| Concern | Module |
| --- | --- |
| Talk to a single RPC endpoint with typed errors + timeouts | [`RpcClient`](/docs/api/rpc-client) |
| Pool many endpoints, rank by latency, fail over automatically | [`RpcRouter`](/docs/api/rpc-router) |
| Pre-flight a transaction: fee, cost, footprint, auth, return value | [`TransactionSimulator`](/docs/api/transaction-simulation) |
| Turn opaque XDR errors into plain English | [`explainTransactionError`](/docs/api/error-decoding) |

## What StellarLens does *not* do

This is just as important. StellarLens has **zero heavy dependencies** and does not pull in the
Stellar SDK. That means it does **not**:

- build or sign transactions — use [`@stellar/stellar-sdk`](https://github.com/stellar/js-stellar-sdk)
  for that, then hand the signed XDR to StellarLens;
- manage keys or accounts;
- index or stream ledger data.

Think of it as the **network + diagnostics layer**, not a full protocol SDK. A typical app pairs
the Stellar SDK (build & sign) with StellarLens (route, simulate, submit, decode).

## The primitive stack

```
your code
    │
    ▼
RpcRouter          ← endpoint pool: ranks by latency, retries on failure, self-heals
    │
    ▼
RpcClient          ← one endpoint: JSON-RPC 2.0, timeouts, typed error classes
    │
    ▼
Soroban RPC endpoint (SDF / Ankr / Blockdaemon / Validation Cloud / …)
```

Every higher-level module accepts an [`RpcCaller`](/docs/reference/rpccaller) — an object with a
`call()` method. Both `RpcClient` and `RpcRouter` satisfy it, so you can hand either to a
`TransactionSimulator` and get the same behaviour, with or without fallback.

```ts
import { RpcClient, RpcRouter, TransactionSimulator } from 'stellar-lens';

// Single endpoint
const simulator = new TransactionSimulator(new RpcClient({ url }));

// Or pooled with automatic fallback — same simulator API
const simulatorHA = new TransactionSimulator(new RpcRouter({ endpoints }));
```

## Errors are values *and* types

Network and protocol failures are surfaced as **typed error classes**
([`RpcTimeoutError`](/docs/reference/rpctimeouterror),
[`RpcNetworkError`](/docs/reference/rpcnetworkerror),
[`RpcResponseError`](/docs/reference/rpcresponseerror),
[`RpcParseError`](/docs/reference/rpcparseerror)) so you can branch on the *kind* of failure.
Transaction-level failures (which are protocol successes — the node answered) are returned as
data you decode. See [Handling Failed Transactions](/docs/guides/handling-errors).

## Next steps

- [Resilient RPC Routing](/docs/guides/resilient-routing)
- [Simulating & Submitting Transactions](/docs/guides/simulating-transactions)
- [Handling Failed Transactions](/docs/guides/handling-errors)
