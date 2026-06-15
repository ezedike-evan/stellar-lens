---
title: SimulateOptions
description: Interface SimulateOptions — stellar-lens API reference.
generated: true
---

Defined in: [packages/sdk/src/simulation/TransactionSimulator.ts:10](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/TransactionSimulator.ts#L10)

Options accepted when simulating a transaction.

## Properties

### instructionLeeway?

> `optional` **instructionLeeway?**: `number`

Defined in: [packages/sdk/src/simulation/TransactionSimulator.ts:15](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/TransactionSimulator.ts#L15)

Extra CPU-instruction headroom the node should add to the metered cost,
guarding against small differences between simulation and execution.
