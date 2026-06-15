---
title: SimulateTransactionParams
description: Interface SimulateTransactionParams — stellar-lens API reference.
generated: true
---

Defined in: [packages/sdk/src/simulation/types.ts:17](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L17)

Parameters accepted by the `simulateTransaction` JSON-RPC method.

## Properties

### resourceConfig?

> `optional` **resourceConfig?**: `object`

Defined in: [packages/sdk/src/simulation/types.ts:20](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L20)

#### instructionLeeway

> **instructionLeeway**: `number`

***

### transaction

> **transaction**: `string`

Defined in: [packages/sdk/src/simulation/types.ts:19](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L19)

Base64-encoded `TransactionEnvelope` XDR to simulate.
