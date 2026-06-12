# Transaction Simulation

`TransactionSimulator` runs a Soroban transaction through the `simulateTransaction` JSON-RPC
method **without submitting it**, so you can learn — before paying any fee — whether it would
succeed, how much it will cost, what ledger footprint and authorizations it needs, and what
the contract returns.

---

## Installation

```ts
import { TransactionSimulator } from 'stellar-lens';
```

`TransactionSimulator` works with any caller that exposes a JSON-RPC `call` method — both
`RpcClient` and `RpcRouter` qualify, so you get latency-ranked fallback for free by passing a
router.

```ts
import { RpcClient, TransactionSimulator } from 'stellar-lens';

const client = new RpcClient({ url: 'https://soroban-testnet.stellar.org' });
const simulator = new TransactionSimulator(client);
```

---

## Usage

### Simulate a transaction

```ts
const result = await simulator.simulate(transactionEnvelopeXdr);

if (!result.success) {
  throw new Error(result.error ?? 'Simulation failed');
}

console.log('resource fee (stroops):', result.minResourceFee);
console.log('cpu instructions:', result.cost?.cpuInstructions);
console.log('footprint XDR:', result.transactionDataXdr);
```

`simulate` accepts an optional `instructionLeeway` to add CPU-instruction headroom, guarding
against small differences between simulation and on-chain execution:

```ts
await simulator.simulate(transactionEnvelopeXdr, { instructionLeeway: 50_000 });
```

### Estimate the resource fee

```ts
const fee = await simulator.estimateFee(transactionEnvelopeXdr);
// throws SimulationError if the transaction would fail
```

---

## `SimulationResult`

```ts
interface SimulationResult {
  success: boolean;
  error: string | null; // human-readable when success === false
  latestLedger: number;
  minResourceFee: bigint | null; // stroops; add to the base fee
  cost: { cpuInstructions: bigint; memoryBytes: bigint } | null;
  returnValueXdr: string | null; // base64 ScVal returned by the invocation
  transactionDataXdr: string | null; // base64 SorobanTransactionData (footprint)
  auth: string[]; // base64 SorobanAuthorizationEntry entries
  events: string[]; // base64 DiagnosticEvent entries
  restorePreamble: { minResourceFee: bigint; transactionDataXdr: string } | null;
  needsRestore: boolean; // archived entries must be restored first
}
```

### Archived entries

If the transaction touches archived ledger entries, `needsRestore` is `true` and
`restorePreamble` carries the fee and footprint for the restore operation you must submit
first.

---

## Error handling

`simulate` returns failures in `result.error` rather than throwing, so a failed simulation is
a normal result you can inspect. The convenience helper `estimateFee` throws a
`SimulationError` (carrying the full `result`) when the transaction would fail:

```ts
import { SimulationError } from 'stellar-lens';

try {
  const fee = await simulator.estimateFee(transactionEnvelopeXdr);
} catch (err) {
  if (err instanceof SimulationError) {
    console.error('Cannot submit:', err.message);
    console.error('Diagnostic events:', err.result.events);
  }
}
```

For decoding the diagnostic events or a failed submission's result XDR into plain English, see
[Error Decoding](./error-decoding.md).
