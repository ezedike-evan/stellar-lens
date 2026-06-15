---
title: TransactionSimulator
description: Class TransactionSimulator — stellar-lens API reference.
generated: true
---

Defined in: [packages/sdk/src/simulation/TransactionSimulator.ts:33](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/TransactionSimulator.ts#L33)

Pre-flight simulator for Soroban transactions.

Wraps the `simulateTransaction` JSON-RPC method on any [RpcCaller](/docs/reference/rpccaller)
(both `RpcClient` and `RpcRouter` qualify), returning a typed
[SimulationResult](/docs/reference/simulationresult) with the resource fee, metered cost, ledger
footprint, required authorizations, and return value — or a human-readable
error if the transaction would fail.

## Example

```ts
const sim = new TransactionSimulator(client);
const result = await sim.simulate(transactionEnvelopeXdr);
if (!result.success) throw new Error(result.error ?? 'simulation failed');
console.log('resource fee:', result.minResourceFee);
```

## Constructors

### Constructor

> **new TransactionSimulator**(`caller`): `TransactionSimulator`

Defined in: [packages/sdk/src/simulation/TransactionSimulator.ts:34](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/TransactionSimulator.ts#L34)

#### Parameters

##### caller

[`RpcCaller`](/docs/reference/rpccaller)

#### Returns

`TransactionSimulator`

## Methods

### estimateFee()

> **estimateFee**(`transactionXdr`, `options?`): `Promise`\<`bigint`\>

Defined in: [packages/sdk/src/simulation/TransactionSimulator.ts:67](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/TransactionSimulator.ts#L67)

Simulates the transaction and returns the minimum resource fee in stroops.

#### Parameters

##### transactionXdr

`string`

##### options?

[`SimulateOptions`](/docs/reference/simulateoptions)

#### Returns

`Promise`\<`bigint`\>

#### Throws

If the simulation fails or returns no fee.

***

### simulate()

> **simulate**(`transactionXdr`, `options?`): `Promise`\<[`SimulationResult`](/docs/reference/simulationresult)\>

Defined in: [packages/sdk/src/simulation/TransactionSimulator.ts:42](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/TransactionSimulator.ts#L42)

Simulates a transaction without submitting it.

#### Parameters

##### transactionXdr

`string`

Base64-encoded `TransactionEnvelope` XDR.

##### options?

[`SimulateOptions`](/docs/reference/simulateoptions)

#### Returns

`Promise`\<[`SimulationResult`](/docs/reference/simulationresult)\>

#### Throws

If `transactionXdr` is not a non-empty string.
