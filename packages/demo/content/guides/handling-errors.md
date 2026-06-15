---
title: Handling Failed Transactions
description: A decision tree for every failure mode — network errors, simulation failures, and on-chain transaction failures — and how to decode each.
---

Failures in a Soroban flow come in three distinct flavours. Treating them the same is the most
common mistake. Here's how to tell them apart and handle each.

## The three failure modes

| Failure | When | How it surfaces | How to handle |
| --- | --- | --- | --- |
| **Transport** | The node is unreachable or slow | A thrown `RpcError` subclass | Catch by type; routing already retried |
| **Simulation** | The tx would fail *before* submission | `result.success === false` | Inspect `result.error` / events |
| **On-chain** | The tx was submitted and failed | XDR error blob in the response | Decode with `explainTransactionError` |

## 1. Transport errors (thrown)

```ts
import {
  RpcTimeoutError,
  RpcNetworkError,
  RpcResponseError,
  RpcParseError,
} from 'stellar-lens';

try {
  await client.call('getLatestLedger');
} catch (err) {
  if (err instanceof RpcTimeoutError) console.error(`Timed out after ${err.timeoutMs}ms`);
  else if (err instanceof RpcNetworkError) console.error(`Network down: ${err.message}`);
  else if (err instanceof RpcResponseError) console.error(`RPC error ${err.code}: ${err.message}`);
  else if (err instanceof RpcParseError) console.error('Malformed response');
}
```

When using an [`RpcRouter`](/docs/api/rpc-router), transport errors are only thrown after every
endpoint has been tried — so catching one means the whole pool failed.

## 2. Simulation failures (returned)

Simulation returns failure as data, not an exception, so you can inspect it:

```ts
const sim = await simulator.simulate(txXdr);
if (!sim.success) {
  console.error('Would fail:', sim.error);
  console.error('Diagnostic events:', sim.events); // base64 DiagnosticEvent entries
}
```

The convenience helper `estimateFee` *does* throw — a `SimulationError` carrying the full
result:

```ts
import { SimulationError } from 'stellar-lens';

try {
  await simulator.estimateFee(txXdr);
} catch (err) {
  if (err instanceof SimulationError) console.error(err.message, err.result.events);
}
```

## 3. On-chain failures (decode the XDR)

A submitted transaction that fails comes back as an opaque base64 XDR blob. Decode it:

```ts
import { explainTransactionError } from 'stellar-lens';

const res = await client.call('sendTransaction', [signedXdr]);
if (res.status === 'ERROR') {
  console.error(explainTransactionError(res));
  // → "txFAILED: One or more operations failed; see the operation results.
  //    [op 0 · INVOKE_HOST_FUNCTION: The contract trapped (panicked) during execution.]"
}
```

For structured access (codes, per-operation results) use `decodeTransactionResult`, and for
contract panics use `decodeScError`. Every code these recognise is listed in the
[Error Reference](/docs/api/error-reference).

```ts
import { decodeTransactionResult, XdrDecodeError } from 'stellar-lens';

try {
  const decoded = decodeTransactionResult(res.errorResultXdr);
  console.log(decoded.code, decoded.successful, decoded.operations);
} catch (err) {
  if (err instanceof XdrDecodeError) console.error(`Bad XDR at offset ${err.offset}`);
}
```

## Next steps

- [XDR Error Decoding reference](/docs/api/error-decoding)
- [Error Reference](/docs/api/error-reference) — every code, with meanings
