---
title: RpcClient
description: Class RpcClient — stellar-lens API reference.
generated: true
---

Defined in: [packages/sdk/src/rpc/RpcClient.ts:15](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/rpc/RpcClient.ts#L15)

Low-level JSON-RPC 2.0 client for Soroban RPC endpoints.

Handles request construction, timeout management, error classification,
and response parsing. All higher-level SDK modules depend on this client.

## Example

```ts
const client = new RpcClient({ url: 'https://soroban-testnet.stellar.org' });
const ledger = await client.call('getLatestLedger');
```

## Constructors

### Constructor

> **new RpcClient**(`config`): `RpcClient`

Defined in: [packages/sdk/src/rpc/RpcClient.ts:20](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/rpc/RpcClient.ts#L20)

#### Parameters

##### config

[`RpcClientConfig`](/docs/reference/rpcclientconfig)

#### Returns

`RpcClient`

## Methods

### call()

> **call**\<`T`\>(`method`, `params?`): `Promise`\<`T`\>

Defined in: [packages/sdk/src/rpc/RpcClient.ts:51](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/rpc/RpcClient.ts#L51)

Executes a JSON-RPC 2.0 method call against the configured endpoint.

#### Type Parameters

##### T

`T`

#### Parameters

##### method

`string`

The RPC method name (e.g. `'getLatestLedger'`)

##### params?

`unknown`[]

Optional positional parameters to pass to the method

#### Returns

`Promise`\<`T`\>

The `result` field of the RPC response, typed as `T`

#### Throws

If the request exceeds `config.timeout` milliseconds

#### Throws

If the fetch fails or the server returns a non-2xx status

#### Throws

If the response body cannot be parsed as JSON

#### Throws

If the server returns a JSON-RPC error object

***

### getUrl()

> **getUrl**(): `string`

Defined in: [packages/sdk/src/rpc/RpcClient.ts:117](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/rpc/RpcClient.ts#L117)

Returns the configured RPC endpoint URL.

#### Returns

`string`

***

### healthCheck()

> **healthCheck**(): `Promise`\<`boolean`\>

Defined in: [packages/sdk/src/rpc/RpcClient.ts:126](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/rpc/RpcClient.ts#L126)

Pings the endpoint using `getLatestLedger` to verify connectivity.

#### Returns

`Promise`\<`boolean`\>

`true` if the endpoint responds successfully, `false` otherwise
