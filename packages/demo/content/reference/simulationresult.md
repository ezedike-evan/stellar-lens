---
title: SimulationResult
description: Interface SimulationResult — stellar-lens API reference.
generated: true
---

Defined in: [packages/sdk/src/simulation/types.ts:56](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L56)

Friendly, typed result of a transaction simulation.

## Properties

### auth

> **auth**: `string`[]

Defined in: [packages/sdk/src/simulation/types.ts:72](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L72)

Base64 `SorobanAuthorizationEntry` entries the transaction requires.

***

### cost

> **cost**: [`SimulationCost`](/docs/reference/simulationcost) \| `null`

Defined in: [packages/sdk/src/simulation/types.ts:66](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L66)

Metered CPU/memory cost, or `null` when not reported.

***

### error

> **error**: `string` \| `null`

Defined in: [packages/sdk/src/simulation/types.ts:60](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L60)

Human-readable error message when `success` is `false`, otherwise `null`.

***

### events

> **events**: `string`[]

Defined in: [packages/sdk/src/simulation/types.ts:74](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L74)

Raw base64 `DiagnosticEvent` entries (decode with the decoding helpers).

***

### latestLedger

> **latestLedger**: `number`

Defined in: [packages/sdk/src/simulation/types.ts:62](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L62)

Ledger the simulation ran against.

***

### minResourceFee

> **minResourceFee**: `bigint` \| `null`

Defined in: [packages/sdk/src/simulation/types.ts:64](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L64)

Minimum resource fee in stroops (add this to the base fee), or `null`.

***

### needsRestore

> **needsRestore**: `boolean`

Defined in: [packages/sdk/src/simulation/types.ts:78](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L78)

`true` when archived entries must be restored before submitting.

***

### restorePreamble

> **restorePreamble**: [`RestorePreamble`](/docs/reference/restorepreamble) \| `null`

Defined in: [packages/sdk/src/simulation/types.ts:76](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L76)

Restoration preamble when `needsRestore` is `true`, otherwise `null`.

***

### returnValueXdr

> **returnValueXdr**: `string` \| `null`

Defined in: [packages/sdk/src/simulation/types.ts:68](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L68)

Base64 `ScVal` return value of the invocation, or `null`.

***

### success

> **success**: `boolean`

Defined in: [packages/sdk/src/simulation/types.ts:58](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L58)

Whether the transaction would succeed if submitted as-is.

***

### transactionDataXdr

> **transactionDataXdr**: `string` \| `null`

Defined in: [packages/sdk/src/simulation/types.ts:70](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L70)

Base64 `SorobanTransactionData` to attach to the transaction, or `null`.
