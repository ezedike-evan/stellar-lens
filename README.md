# StellarLens

[![npm version](https://img.shields.io/npm/v/stellar-lens)](https://www.npmjs.com/package/stellar-lens)
[![CI](https://github.com/ezedike-evan/stellar-lens/actions/workflows/ci.yml/badge.svg)](https://github.com/ezedike-evan/stellar-lens/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

TypeScript SDK for the Stellar network — smart RPC routing with latency-ranked automatic fallback, Soroban transaction pre-flight simulation, and human-readable XDR error decoding.

---

## Packages

| Package | Version | Description |
|---|---|---|
| [`stellar-lens`](./packages/sdk) | [![npm](https://img.shields.io/npm/v/stellar-lens)](https://www.npmjs.com/package/stellar-lens) | Core TypeScript SDK |

---

## Features

- **Smart RPC routing** — pool multiple Soroban endpoints, rank by latency, fall back automatically on failure
- **Typed JSON-RPC 2.0 client** — structured error classes, configurable timeouts, custom headers
- **TypeScript-native** — full `.d.ts` declarations, no `@types/*` packages required
- **Dual ESM + CJS build** — works in Node.js, bundlers, and edge runtimes
- **Zero heavy dependencies** — no Stellar SDK required to get started

---

## Installation

```sh
npm install stellar-lens
```

```sh
pnpm add stellar-lens
```

---

## Quick Start

### Route calls across multiple endpoints

```ts
import { RpcRouter } from 'stellar-lens';

const router = new RpcRouter({
  endpoints: [
    'https://soroban-testnet.stellar.org',
    'https://rpc.ankr.com/stellar_testnet',
  ],
  timeout: 10_000,
});

router.start(); // pings all endpoints, ranks by latency, starts health-check timer

const ledger = await router.call<{ sequence: number }>('getLatestLedger');
console.log(ledger.sequence);

router.stop();
```

### Single endpoint

```ts
import { RpcClient } from 'stellar-lens';

const client = new RpcClient({ url: 'https://soroban-testnet.stellar.org' });
const ledger = await client.call<{ sequence: number }>('getLatestLedger');
```

### Typed error handling

```ts
import { RpcTimeoutError, RpcNetworkError, RpcResponseError, RpcParseError } from 'stellar-lens';

try {
  const result = await client.call('getLatestLedger');
} catch (err) {
  if (err instanceof RpcTimeoutError)   console.error(`Timed out after ${err.timeoutMs}ms`);
  if (err instanceof RpcNetworkError)   console.error(`Network failure: ${err.message}`);
  if (err instanceof RpcResponseError)  console.error(`RPC error ${err.code}: ${err.message}`);
  if (err instanceof RpcParseError)     console.error(`Bad JSON response`);
}
```

---

## Documentation

- [RpcClient](./docs/rpc-client.md) — single-endpoint JSON-RPC client
- [RpcRouter](./docs/rpc-router.md) — multi-endpoint router with health checking and fallback

---

## Repository Layout

```
stellarlens/
├── packages/
│   └── sdk/          # stellar-lens npm package (TypeScript)
├── docs/             # Full API documentation
├── .github/
│   └── workflows/    # CI, release, Dependabot, security scanning
└── ...
```

Planned packages: Python SDK, Go SDK, Rust/WASM port, web demo, VS Code extension.

---

## Development

**Prerequisites:** Node.js ≥ 18, pnpm ≥ 10

```sh
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run unit tests
pnpm test

# Run integration tests (requires network access)
pnpm --filter stellar-lens test:integration

# Typecheck
pnpm --filter stellar-lens typecheck

# Lint
pnpm lint
```

---

## Contributing

1. Fork the repository and create a branch from `main`
2. Make your changes and add tests — the 80% coverage threshold is enforced in CI
3. Run `pnpm lint` and `pnpm test` locally before pushing
4. Open a pull request — the CI suite (typecheck → lint → test → build) must pass
5. A maintainer will review and merge

Bug reports and feature requests are welcome via [GitHub Issues](https://github.com/ezedike-evan/stellar-lens/issues).

---

## License

[MIT](./LICENSE)
