---
title: RpcTimeoutError
description: Class RpcTimeoutError — stellar-lens API reference.
generated: true
---

Defined in: [packages/sdk/src/rpc/errors.ts:23](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/rpc/errors.ts#L23)

## Extends

- `Error`

## Constructors

### Constructor

> **new RpcTimeoutError**(`message`, `url`, `timeoutMs`): `RpcTimeoutError`

Defined in: [packages/sdk/src/rpc/errors.ts:27](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/rpc/errors.ts#L27)

#### Parameters

##### message

`string`

##### url

`string`

##### timeoutMs

`number`

#### Returns

`RpcTimeoutError`

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

### timeoutMs

> `readonly` **timeoutMs**: `number`

Defined in: [packages/sdk/src/rpc/errors.ts:25](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/rpc/errors.ts#L25)

***

### url

> `readonly` **url**: `string`

Defined in: [packages/sdk/src/rpc/errors.ts:24](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/src/rpc/errors.ts#L24)

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
