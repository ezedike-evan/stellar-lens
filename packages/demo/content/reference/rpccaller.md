---
title: RpcCaller
description: Interface RpcCaller — stellar-lens API reference.
generated: true
---

Defined in: [packages/sdk/src/simulation/types.ts:12](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L12)

Minimal interface satisfied by both `RpcClient` and `RpcRouter`.

## Methods

### call()

> **call**\<`T`\>(`method`, `params?`): `Promise`\<`T`\>

Defined in: [packages/sdk/src/simulation/types.ts:13](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L13)

#### Type Parameters

##### T

`T`

#### Parameters

##### method

`string`

##### params?

`unknown`[]

#### Returns

`Promise`\<`T`\>
