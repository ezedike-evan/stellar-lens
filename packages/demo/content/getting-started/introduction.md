---
title: Introduction
description: StellarLens is a TypeScript SDK for building resilient Soroban RPC integrations on the Stellar network.
---

## What is StellarLens?

StellarLens is a developer SDK for the Stellar network. It provides smart RPC routing with automatic latency-ranked fallback, Soroban transaction pre-flight simulation, and human-readable XDR error decoding.

Every module is built on a small, composable primitive stack:

- **`RpcClient`** — a low-level JSON-RPC 2.0 client with typed errors and configurable timeouts
- **`RpcRouter`** — a connection pool that pings multiple endpoints, ranks them by latency, and retries on failure
- **`TransactionSimulator`** — pre-flight a Soroban transaction for fee, cost, footprint, auth, and return value
- **Error decoding** — turn opaque XDR error blobs into plain-English explanations

For the full mental model — and what StellarLens deliberately does *not* do — see
[Core Concepts](/docs/guides/core-concepts).

## Why StellarLens?

Public Soroban RPC endpoints are operated by multiple providers (SDF, Ankr, Blockdaemon, Validation Cloud). Any single endpoint can go down or become slow. Without a routing layer, your app silently degrades or throws uncaught network errors.

StellarLens solves this by:

1. **Measuring latency** across all configured endpoints on startup
2. **Always routing** to the fastest healthy endpoint
3. **Automatically retrying** on network or timeout failures by advancing to the next candidate
4. **Self-healing** via a background health-check timer that re-ranks endpoints as they recover

## Architecture overview

```
your code
    │
    ▼
RpcRouter          ← manages endpoint pool, ranks by latency, retries on failure
    │
    ▼
RpcClient          ← sends JSON-RPC 2.0 requests, classifies errors into typed classes
    │
    ▼
Soroban RPC endpoint (SDF / Ankr / Blockdaemon / Validation Cloud / …)
```

## Next steps

- [Installation](/docs/getting-started/installation) — add `stellar-lens` to your project
- [Quick Start](/docs/getting-started/quick-start) — make your first RPC call in under 5 minutes
- [Core Concepts](/docs/guides/core-concepts) — the mental model and architecture
- [Simulating & Submitting Transactions](/docs/guides/simulating-transactions) — the end-to-end flow
