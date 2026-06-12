import {
  SimulationError,
  type RpcCaller,
  type RawSimulateResponse,
  type SimulateTransactionParams,
  type SimulationResult,
} from './types';

/** Options accepted when simulating a transaction. */
export interface SimulateOptions {
  /**
   * Extra CPU-instruction headroom the node should add to the metered cost,
   * guarding against small differences between simulation and execution.
   */
  instructionLeeway?: number;
}

/**
 * Pre-flight simulator for Soroban transactions.
 *
 * Wraps the `simulateTransaction` JSON-RPC method on any {@link RpcCaller}
 * (both `RpcClient` and `RpcRouter` qualify), returning a typed
 * {@link SimulationResult} with the resource fee, metered cost, ledger
 * footprint, required authorizations, and return value — or a human-readable
 * error if the transaction would fail.
 *
 * @example
 * const sim = new TransactionSimulator(client);
 * const result = await sim.simulate(transactionEnvelopeXdr);
 * if (!result.success) throw new Error(result.error ?? 'simulation failed');
 * console.log('resource fee:', result.minResourceFee);
 */
export class TransactionSimulator {
  constructor(private readonly caller: RpcCaller) {}

  /**
   * Simulates a transaction without submitting it.
   *
   * @param transactionXdr - Base64-encoded `TransactionEnvelope` XDR.
   * @throws {TypeError} If `transactionXdr` is not a non-empty string.
   */
  async simulate(transactionXdr: string, options?: SimulateOptions): Promise<SimulationResult> {
    if (!transactionXdr || typeof transactionXdr !== 'string') {
      throw new TypeError(
        'TransactionSimulator.simulate: transactionXdr must be a non-empty base64 string. ' +
          `Received: ${JSON.stringify(transactionXdr)}`,
      );
    }

    const params: SimulateTransactionParams =
      options?.instructionLeeway !== undefined
        ? { transaction: transactionXdr, resourceConfig: { instructionLeeway: options.instructionLeeway } }
        : { transaction: transactionXdr };

    const raw = await this.caller.call<RawSimulateResponse>('simulateTransaction', [params]);
    return toSimulationResult(raw);
  }

  /**
   * Simulates the transaction and returns the minimum resource fee in stroops.
   *
   * @throws {SimulationError} If the simulation fails or returns no fee.
   */
  async estimateFee(transactionXdr: string, options?: SimulateOptions): Promise<bigint> {
    const result = await this.simulate(transactionXdr, options);
    if (!result.success) {
      throw new SimulationError(result.error ?? 'Transaction simulation failed.', result);
    }
    if (result.minResourceFee === null) {
      throw new SimulationError('Simulation did not return a resource fee.', result);
    }
    return result.minResourceFee;
  }
}

/** Parses a decimal string into a bigint, returning `null` for missing/invalid values. */
function toBigInt(value: string | undefined): bigint | null {
  if (value === undefined) return null;
  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

/** Maps a raw `simulateTransaction` response into a friendly {@link SimulationResult}. */
export function toSimulationResult(raw: RawSimulateResponse): SimulationResult {
  const firstResult = raw.results?.[0];
  const restorePreamble =
    raw.restorePreamble !== undefined
      ? {
          minResourceFee: toBigInt(raw.restorePreamble.minResourceFee) ?? 0n,
          transactionDataXdr: raw.restorePreamble.transactionData,
        }
      : null;

  return {
    success: raw.error === undefined,
    error: raw.error ?? null,
    latestLedger: raw.latestLedger,
    minResourceFee: toBigInt(raw.minResourceFee),
    cost:
      raw.cost !== undefined
        ? {
            cpuInstructions: toBigInt(raw.cost.cpuInsns) ?? 0n,
            memoryBytes: toBigInt(raw.cost.memBytes) ?? 0n,
          }
        : null,
    returnValueXdr: firstResult?.xdr ?? null,
    transactionDataXdr: raw.transactionData ?? null,
    auth: firstResult?.auth ?? [],
    events: raw.events ?? [],
    restorePreamble,
    needsRestore: restorePreamble !== null,
  };
}
