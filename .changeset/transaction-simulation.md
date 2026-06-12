---
'stellar-lens': minor
---

Add Soroban transaction pre-flight simulation. The new `TransactionSimulator` wraps the
`simulateTransaction` JSON-RPC method on any `RpcClient` or `RpcRouter` and returns a typed
`SimulationResult` with the minimum resource fee, metered CPU/memory cost, ledger footprint,
required authorizations, return value, and restore preamble — or a human-readable error.
Includes an `estimateFee` convenience that throws `SimulationError` on failure.
