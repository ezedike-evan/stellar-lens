---
title: RpcResponseError
description: Class RpcResponseError — stellar-lens API reference.
generated: true
---

Defined in: [packages/sdk/src/rpc/errors.ts:11](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/rpc/errors.ts#L11)

## Extends

- `Error`

## Constructors

### Constructor

> **new RpcResponseError**(`message`, `code`, `data`): `RpcResponseError`

Defined in: [packages/sdk/src/rpc/errors.ts:15](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/rpc/errors.ts#L15)

#### Parameters

##### message

`string`

##### code

`number`

##### data

`unknown`

#### Returns

`RpcResponseError`

#### Overrides

`Error.constructor`

## Properties

### cause?

> `optional` **cause?**: `unknown`

Defined in: node\_modules/.pnpm/typescript@6.0.2/node\_modules/typescript/lib/lib.es2022.error.d.ts:24

#### Inherited from

`Error.cause`

***

### code

> `readonly` **code**: `number`

Defined in: [packages/sdk/src/rpc/errors.ts:12](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/rpc/errors.ts#L12)

***

### data

> `readonly` **data**: `unknown`

Defined in: [packages/sdk/src/rpc/errors.ts:13](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/rpc/errors.ts#L13)

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
