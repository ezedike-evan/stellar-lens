---
title: RpcNetworkError
description: Class RpcNetworkError — stellar-lens API reference.
generated: true
---

Defined in: [packages/sdk/src/rpc/errors.ts:1](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/rpc/errors.ts#L1)

## Extends

- `Error`

## Constructors

### Constructor

> **new RpcNetworkError**(`message`, `url`): `RpcNetworkError`

Defined in: [packages/sdk/src/rpc/errors.ts:4](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/rpc/errors.ts#L4)

#### Parameters

##### message

`string`

##### url

`string`

#### Returns

`RpcNetworkError`

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

### stack?

> `optional` **stack?**: `string`

Defined in: node\_modules/.pnpm/typescript@6.0.2/node\_modules/typescript/lib/lib.es5.d.ts:1076

#### Inherited from

`Error.stack`

***

### url

> `readonly` **url**: `string`

Defined in: [packages/sdk/src/rpc/errors.ts:2](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/rpc/errors.ts#L2)

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
