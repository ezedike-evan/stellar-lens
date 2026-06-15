---
title: Networks
description: Connecting StellarLens to Stellar testnet, mainnet, and local networks — endpoints, passphrases, and provider pools.
---

StellarLens is network-agnostic: you point it at RPC endpoints, and the network is whatever
those endpoints serve. This guide lists the common ones.

> [!WARNING]
> The network passphrase used to **sign** a transaction must match the network of the RPC
> endpoint you submit to. A mismatch produces a `txBAD_AUTH` failure.

## Testnet

Best for development. Funded via Friendbot; reset periodically.

```ts
import { RpcRouter } from 'stellar-lens';

const router = new RpcRouter({
  endpoints: [
    'https://soroban-testnet.stellar.org',
    'https://rpc.ankr.com/stellar_testnet',
  ],
});
```

Passphrase: `Test SDF Network ; September 2015` (`Networks.TESTNET` in the Stellar SDK).

## Mainnet (pubnet)

Production. Use **multiple providers** so you're not dependent on one operator — this is exactly
what `RpcRouter` is for.

```ts
const router = new RpcRouter({
  endpoints: [
    'https://mainnet.sorobanrpc.com',
    // add additional provider URLs (Ankr, Blockdaemon, Validation Cloud, …)
  ],
  timeout: 8_000,
});
```

Passphrase: `Public Global Stellar Network ; September 2015` (`Networks.PUBLIC`).

## Local / standalone

Running [Stellar Quickstart](https://github.com/stellar/quickstart) locally:

```ts
import { RpcClient } from 'stellar-lens';

const client = new RpcClient({ url: 'http://localhost:8000/soroban/rpc' });
```

Passphrase: `Standalone Network ; February 2017` (or whatever your container is configured with).

## Verifying connectivity

```ts
const client = new RpcClient({ url });
const ok = await client.healthCheck(); // true if the endpoint answers getLatestLedger
```

## Next steps

- [Resilient RPC Routing](/docs/guides/resilient-routing)
- [RpcClient reference](/docs/api/rpc-client)
