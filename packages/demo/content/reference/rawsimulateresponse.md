---
title: RawSimulateResponse
description: Interface RawSimulateResponse — stellar-lens API reference.
generated: true
---

Defined in: [packages/sdk/src/simulation/types.ts:24](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L24)

Raw `simulateTransaction` JSON-RPC response (numbers arrive as strings).

## Properties

### cost?

> `optional` **cost?**: `object`

Defined in: [packages/sdk/src/simulation/types.ts:37](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L37)

CPU/memory metering (string-encoded integers).

#### cpuInsns

> **cpuInsns**: `string`

#### memBytes

> **memBytes**: `string`

***

### error?

> `optional` **error?**: `string`

Defined in: [packages/sdk/src/simulation/types.ts:27](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L27)

Present only when the simulation failed.

***

### events?

> `optional` **events?**: `string`[]

Defined in: [packages/sdk/src/simulation/types.ts:33](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L33)

Base64 `DiagnosticEvent` entries emitted during simulation.

***

### latestLedger

> **latestLedger**: `number`

Defined in: [packages/sdk/src/simulation/types.ts:25](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L25)

***

### minResourceFee?

> `optional` **minResourceFee?**: `string`

Defined in: [packages/sdk/src/simulation/types.ts:31](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L31)

Minimum resource fee in stroops, as a decimal string.

***

### restorePreamble?

> `optional` **restorePreamble?**: `object`

Defined in: [packages/sdk/src/simulation/types.ts:39](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L39)

Present when archived ledger entries must be restored before submitting.

#### minResourceFee

> **minResourceFee**: `string`

#### transactionData

> **transactionData**: `string`

***

### results?

> `optional` **results?**: `object`[]

Defined in: [packages/sdk/src/simulation/types.ts:35](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L35)

Invocation results — at most one for a Soroban operation.

#### auth?

> `optional` **auth?**: `string`[]

#### xdr

> **xdr**: `string`

***

### stateChanges?

> `optional` **stateChanges?**: `unknown`[]

Defined in: [packages/sdk/src/simulation/types.ts:40](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L40)

***

### transactionData?

> `optional` **transactionData?**: `string`

Defined in: [packages/sdk/src/simulation/types.ts:29](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L29)

Base64 `SorobanTransactionData` (the ledger footprint + resources).
