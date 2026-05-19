---
title: Installation
description: Add stellar-lens to your TypeScript or JavaScript project.
---

## Requirements

- Node.js 18 or later
- TypeScript 5.0+ (optional but recommended)

## Install

```bash
# npm
npm install stellar-lens

# pnpm
pnpm add stellar-lens

# yarn
yarn add stellar-lens
```

## Imports

All public classes, types, and error classes are exported from the top-level package:

```ts
import {
  RpcClient,
  RpcRouter,
  RpcTimeoutError,
  RpcNetworkError,
  RpcResponseError,
  RpcParseError,
} from 'stellar-lens'
```

## TypeScript configuration

StellarLens is written in TypeScript and ships with full type declarations. No extra `@types/*` packages are needed.

Your `tsconfig.json` should target at least ES2017 with `strict` mode enabled:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "strict": true,
    "moduleResolution": "bundler"
  }
}
```

## Next steps

Head to [Quick Start](/docs/getting-started/quick-start) to make your first Soroban RPC call.
