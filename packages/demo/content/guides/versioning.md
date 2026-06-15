---
title: Stability & Versioning
description: How StellarLens versions its API, what's stable today, and what to expect before 1.0.
---

StellarLens follows [Semantic Versioning](https://semver.org/). Releases are managed with
[Changesets](https://github.com/changesets/changesets), and every published version has an entry
in the [CHANGELOG](https://github.com/ezedike-evan/stellar-lens/blob/main/packages/sdk/CHANGELOG.md).

> [!WARNING]
> StellarLens is pre-1.0 (`0.x`). Under SemVer, **minor** releases may contain breaking changes
> while the API stabilises. Pin a version (`stellar-lens@0.x.y`) in production and review the
> changelog before upgrading.

## API stability

| Area | Status | Notes |
| --- | --- | --- |
| `RpcClient` | Stable | Surface is settled; changes will be additive. |
| `RpcRouter` | Stable | Ranking/fallback behaviour may be tuned, not its API. |
| `TransactionSimulator` | Beta | Shape follows the RPC `simulateTransaction` response. |
| Error decoding | Beta | Coverage expands over time; see below. |
| Typed error classes | Stable | `RpcTimeoutError`, `RpcNetworkError`, etc. |

## Decoder coverage caveat

The XDR decoder is deliberately zero-dependency and covers the result types developers actually
hit: all transaction-level codes, all operation envelope codes, and the three Soroban
operations. A classic operation with a complex result union sets `partial: true` rather than
throwing — the transaction-level verdict is always accurate. See the
[Error Decoding guide](/docs/api/error-decoding#coverage).

## Upgrading

```sh
# check what changed first
npm view stellar-lens versions

# upgrade within the pinned minor
npm install stellar-lens@^0.1
```

## Reporting issues

Found a code the decoder mislabels, or an endpoint behaviour the router mishandles? Open an issue
at [github.com/ezedike-evan/stellar-lens/issues](https://github.com/ezedike-evan/stellar-lens/issues).
