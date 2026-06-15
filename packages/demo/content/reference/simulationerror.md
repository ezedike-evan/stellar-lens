---
title: SimulationError
description: Class SimulationError — stellar-lens API reference.
generated: true
---

Defined in: [packages/sdk/src/simulation/types.ts:82](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L82)

Thrown by convenience helpers (e.g. `estimateFee`) when a simulation fails.

## Extends

- `Error`

## Constructors

### Constructor

> **new SimulationError**(`message`, `result`): `SimulationError`

Defined in: [packages/sdk/src/simulation/types.ts:86](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L86)

#### Parameters

##### message

`string`

##### result

[`SimulationResult`](/docs/reference/simulationresult)

#### Returns

`SimulationError`

#### Overrides

`Error.constructor`

## Properties

### cause?

> `optional` **cause?**: `unknown`

Defined in: node\_modules/.pnpm/typescript@6.0.2/node\_modules/typescript/lib/lib.es2022.error.d.ts:24

#### Inherited from

`Error.cause`

***

### message

> **message**: `string`

Defined in: node\_modules/.pnpm/typescript@6.0.2/node\_modules/typescript/lib/lib.es5.d.ts:1075

#### Inherited from

`Error.message`

***

### name

> **name**: `string`

Defined in: node\_modules/.pnpm/typescript@6.0.2/node\_modules/typescript/lib/lib.es5.d.ts:1074

#### Inherited from

`Error.name`

***

### result

> `readonly` **result**: [`SimulationResult`](/docs/reference/simulationresult)

Defined in: [packages/sdk/src/simulation/types.ts:84](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/simulation/types.ts#L84)

The full simulation result that produced this error.

***

### stack?

> `optional` **stack?**: `string`

Defined in: node\_modules/.pnpm/typescript@6.0.2/node\_modules/typescript/lib/lib.es5.d.ts:1076

#### Inherited from

`Error.stack`

## Methods

### isError()

> `static` **isError**(`error`): `error is Error`

Defined in: node\_modules/.pnpm/typescript@6.0.2/node\_modules/typescript/lib/lib.esnext.error.d.ts:21

Indicates whether the argument provided is a built-in Error instance or not.

#### Parameters

##### error

`unknown`

#### Returns

`error is Error`

#### Inherited from

`Error.isError`
