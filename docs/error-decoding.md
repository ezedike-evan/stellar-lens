<!-- Generated from packages/demo/content/api/error-decoding.md by scripts/sync-docs.mjs. Do not edit directly; run `pnpm docs:sync`. -->

# XDR Error Decoding

Soroban RPC reports transaction failures as opaque base64 **XDR** blobs — `errorResultXdr`
from `sendTransaction`, `resultXdr` from `getTransaction`, and `ScError` values inside
diagnostic events. StellarLens decodes these into structured, plain-English explanations
**without any dependency on the Stellar SDK** — a small, self-contained XDR reader handles
exactly the result types developers hit in practice.

---

## Installation

The decoders are exported from the `stellar-lens` package:

```ts
import {
  decodeTransactionResult,
  decodeScError,
  explainTransactionError,
  XdrDecodeError,
} from 'stellar-lens';
```

---

## `explainTransactionError(input)`

The fastest path: hand it an RPC response (or a raw base64 string) and get a one-line message.

```ts
const res = await client.call('sendTransaction', [signedTxXdr]);

if (res.status === 'ERROR') {
  console.error(explainTransactionError(res));
  // → "txFAILED: One or more operations failed; see the operation results.
  //    [op 0 · INVOKE_HOST_FUNCTION: The contract trapped (panicked) during execution.]"
}
```

It accepts either:

| Input                | Behaviour                               |
| -------------------- | --------------------------------------- |
| `{ errorResultXdr }` | Decoded (preferred)                     |
| `{ resultXdr }`      | Decoded when `errorResultXdr` is absent |
| `{ status }`         | Reported as-is when no XDR is available |
| `string`             | Treated as a base64 `TransactionResult` |

---

## `decodeTransactionResult(xdrBase64)`

Returns the full structured result for a base64 `TransactionResult`.

```ts
const result = decodeTransactionResult(res.errorResultXdr);
```

```ts
interface DecodedTransactionResult {
  feeCharged: bigint; // stroops
  code: string; // e.g. "txFAILED", "txBAD_SEQ"
  successful: boolean;
  message: string; // human-readable, transaction-level
  operations: DecodedOperationResult[];
  partial: boolean; // see "Coverage" below
  raw: string; // original base64
}

interface DecodedOperationResult {
  code: string; // OperationResultCode, e.g. "opINNER"
  operationType: string | null; // e.g. "INVOKE_HOST_FUNCTION"
  innerCode: string | null; // e.g. "INVOKE_HOST_FUNCTION_TRAPPED"
  successful: boolean;
  message: string;
}
```

### Coverage

This is a deliberately lightweight, zero-dependency decoder. It fully decodes:

- **All transaction-level codes** (`txBAD_SEQ`, `txINSUFFICIENT_FEE`, `txSOROBAN_INVALID`, …).
- **All operation envelope codes** (`opBAD_AUTH`, `opNO_ACCOUNT`, …).
- The **three Soroban operations** (`INVOKE_HOST_FUNCTION`, `EXTEND_FOOTPRINT_TTL`,
  `RESTORE_FOOTPRINT`) — which is what Soroban transactions almost always contain.

If a classic (non-Soroban) operation with a complex result union is encountered, decoding of
the operation list stops and `partial` is set to `true`. The transaction-level verdict is
always accurate.

---

## `decodeScError(input)`

Decodes a Soroban `ScVal` of type `SCV_ERROR` — the value behind contract panics and host
failures (e.g. in `getTransaction` diagnostic events). Accepts a base64 string or raw bytes.

```ts
const err = decodeScError(scvalBase64);
```

```ts
interface DecodedScError {
  category: 'contract' | 'host';
  type: string; // SCErrorType, e.g. "Contract", "WasmVm", "Budget"
  code: number | string; // contract code (number) or SCErrorCode name
  isContractError: boolean;
  contractCode: number | null; // set for application-defined errors
  message: string;
}
```

The most common case — a contract that returns its own error — surfaces the
application-defined code directly:

```ts
const err = decodeScError(scvalBase64);
if (err.isContractError) {
  console.error(`Contract returned error #${err.contractCode}`);
}
```

---

## Error handling

All three functions throw `XdrDecodeError` on malformed base64, truncated bytes, or an
unexpected value (e.g. passing a non-error `ScVal` to `decodeScError`). The error carries an
`offset` field (the byte position where decoding failed) when available.

```ts
try {
  decodeTransactionResult(suspectXdr);
} catch (err) {
  if (err instanceof XdrDecodeError) {
    console.error(`Could not decode XDR at offset ${err.offset}: ${err.message}`);
  }
}
```
