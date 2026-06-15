---
title: RpcRouter
description: Class RpcRouter — stellar-lens API reference.
generated: true
---

Defined in: [packages/sdk/src/rpc/RpcRouter.ts:24](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/rpc/RpcRouter.ts#L24)

Smart RPC router for Soroban endpoints.

Maintains a pool of `RpcClient` instances, one per configured endpoint.
On initialisation, all endpoints are pinged to measure latency and ranked
from fastest to slowest. The router automatically falls back to the next
healthiest endpoint on failure and re-checks all endpoints on a configurable
interval.

## Example

```ts
const router = new RpcRouter({
  endpoints: [
    'https://soroban-testnet.stellar.org',
    'https://rpc.ankr.com/stellar_testnet',
  ],
});
await router.start();
const ledger = await router.call('getLatestLedger');
```

## Constructors

### Constructor

> **new RpcRouter**(`config`): `RpcRouter`

Defined in: [packages/sdk/src/rpc/RpcRouter.ts:33](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/rpc/RpcRouter.ts#L33)

#### Parameters

##### config

[`RouterConfig`](/docs/reference/routerconfig)

#### Returns

`RpcRouter`

## Methods

### \[asyncDispose\]()

> **\[asyncDispose\]**(): `Promise`\<`void`\>

Defined in: [packages/sdk/src/rpc/RpcRouter.ts:253](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/rpc/RpcRouter.ts#L253)

Stops the health-check timer and releases all resources.
Enables use in `await using` blocks (TC39 Explicit Resource Management).

#### Returns

`Promise`\<`void`\>

***

### call()

> **call**\<`T`\>(`method`, `params?`): `Promise`\<`T`\>

Defined in: [packages/sdk/src/rpc/RpcRouter.ts:189](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/rpc/RpcRouter.ts#L189)

Executes a JSON-RPC 2.0 method call against the currently active endpoint,
falling back to the next healthy endpoint on network or timeout failures.

#### Type Parameters

##### T

`T`

#### Parameters

##### method

`string`

The RPC method name (e.g. `'getLatestLedger'`).

##### params?

`unknown`[]

Optional positional parameters to pass to the method.

#### Returns

`Promise`\<`T`\>

The typed result returned by the RPC server.

#### Throws

If all retries are exhausted due to network failures.

#### Throws

If all retries are exhausted due to timeout failures.

#### Throws

Immediately — the server responded, so routing is fine.

#### Throws

Immediately — malformed response is not a routing issue.

***

### getActiveUrl()

> **getActiveUrl**(): `string`

Defined in: [packages/sdk/src/rpc/RpcRouter.ts:244](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/rpc/RpcRouter.ts#L244)

Returns the URL of the currently active endpoint.

#### Returns

`string`

The URL string at the active index.

***

### getHealthySummary()

> **getHealthySummary**(): readonly [`EndpointHealth`](/docs/reference/endpointhealth)[]

Defined in: [packages/sdk/src/rpc/RpcRouter.ts:235](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/rpc/RpcRouter.ts#L235)

Returns all endpoints currently reporting a `'healthy'` status.

#### Returns

readonly [`EndpointHealth`](/docs/reference/endpointhealth)[]

A read-only array of [EndpointHealth](/docs/reference/endpointhealth) records.

***

### getState()

> **getState**(): `Readonly`\<[`RouterState`](/docs/reference/routerstate)\>

Defined in: [packages/sdk/src/rpc/RpcRouter.ts:226](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/rpc/RpcRouter.ts#L226)

Returns a frozen snapshot of the current router state.

#### Returns

`Readonly`\<[`RouterState`](/docs/reference/routerstate)\>

A read-only copy of the current [RouterState](/docs/reference/routerstate).

***

### pingAll()

> **pingAll**(): `Promise`\<`void`\>

Defined in: [packages/sdk/src/rpc/RpcRouter.ts:126](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/rpc/RpcRouter.ts#L126)

Pings all configured endpoints concurrently to measure latency and health.
After all pings complete (successfully or not), it updates the health status
and latency for each endpoint, then re-ranks the endpoints from fastest to slowest.
Unreachable endpoints are moved to the back of the queue. Finally, it resets
the active endpoint index to 0.

#### Returns

`Promise`\<`void`\>

A Promise that resolves when all ping operations and re-ranking are complete.

***

### start()

> **start**(): `void`

Defined in: [packages/sdk/src/rpc/RpcRouter.ts:159](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/rpc/RpcRouter.ts#L159)

Pings all endpoints immediately, then starts a periodic health check
on the configured interval.

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Defined in: [packages/sdk/src/rpc/RpcRouter.ts:170](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/rpc/RpcRouter.ts#L170)

Stops the periodic health check timer.
Call this when the router is no longer needed to avoid resource leaks.

#### Returns

`void`
