/**
 * Types for Soroban transaction pre-flight simulation.
 *
 * `simulateTransaction` runs a transaction against a node without submitting it,
 * returning the resource fee, CPU/memory cost, the required ledger footprint,
 * the authorizations the transaction will need, and the contract's return value
 * — or a human-readable error if it would fail. These shapes turn that raw
 * JSON-RPC payload into a friendly, typed result.
 */

/** Minimal interface satisfied by both `RpcClient` and `RpcRouter`. */
export interface RpcCaller {
  call<T>(method: string, params?: unknown[]): Promise<T>;
}

/** Parameters accepted by the `simulateTransaction` JSON-RPC method. */
export interface SimulateTransactionParams {
  /** Base64-encoded `TransactionEnvelope` XDR to simulate. */
  transaction: string;
  resourceConfig?: { instructionLeeway: number };
}

/** Raw `simulateTransaction` JSON-RPC response (numbers arrive as strings). */
export interface RawSimulateResponse {
  latestLedger: number;
  /** Present only when the simulation failed. */
  error?: string;
  /** Base64 `SorobanTransactionData` (the ledger footprint + resources). */
  transactionData?: string;
  /** Minimum resource fee in stroops, as a decimal string. */
  minResourceFee?: string;
  /** Base64 `DiagnosticEvent` entries emitted during simulation. */
  events?: string[];
  /** Invocation results — at most one for a Soroban operation. */
  results?: Array<{ xdr: string; auth?: string[] }>;
  /** CPU/memory metering (string-encoded integers). */
  cost?: { cpuInsns: string; memBytes: string };
  /** Present when archived ledger entries must be restored before submitting. */
  restorePreamble?: { minResourceFee: string; transactionData: string };
  stateChanges?: unknown[];
}

/** Metered execution cost of a simulation. */
export interface SimulationCost {
  cpuInstructions: bigint;
  memoryBytes: bigint;
}

/** Footprint restoration required before the transaction can be submitted. */
export interface RestorePreamble {
  minResourceFee: bigint;
  transactionDataXdr: string;
}

/** Friendly, typed result of a transaction simulation. */
export interface SimulationResult {
  /** Whether the transaction would succeed if submitted as-is. */
  success: boolean;
  /** Human-readable error message when `success` is `false`, otherwise `null`. */
  error: string | null;
  /** Ledger the simulation ran against. */
  latestLedger: number;
  /** Minimum resource fee in stroops (add this to the base fee), or `null`. */
  minResourceFee: bigint | null;
  /** Metered CPU/memory cost, or `null` when not reported. */
  cost: SimulationCost | null;
  /** Base64 `ScVal` return value of the invocation, or `null`. */
  returnValueXdr: string | null;
  /** Base64 `SorobanTransactionData` to attach to the transaction, or `null`. */
  transactionDataXdr: string | null;
  /** Base64 `SorobanAuthorizationEntry` entries the transaction requires. */
  auth: string[];
  /** Raw base64 `DiagnosticEvent` entries (decode with the decoding helpers). */
  events: string[];
  /** Restoration preamble when `needsRestore` is `true`, otherwise `null`. */
  restorePreamble: RestorePreamble | null;
  /** `true` when archived entries must be restored before submitting. */
  needsRestore: boolean;
}

/** Thrown by convenience helpers (e.g. `estimateFee`) when a simulation fails. */
export class SimulationError extends Error {
  /** The full simulation result that produced this error. */
  readonly result: SimulationResult;

  constructor(message: string, result: SimulationResult) {
    super(message);
    this.name = 'SimulationError';
    this.result = result;
  }
}
