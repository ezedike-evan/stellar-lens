import { describe, it, expect, vi } from 'vitest';
import { TransactionSimulator, toSimulationResult } from '../../src/simulation/TransactionSimulator';
import { SimulationError, type RawSimulateResponse, type RpcCaller } from '../../src/simulation/types';

const TX_XDR = 'AAAAEXAMPLEbase64envelope==';

/** Builds a mock RpcCaller that returns a fixed simulateTransaction response. */
function mockCaller(response: RawSimulateResponse): RpcCaller & { call: ReturnType<typeof vi.fn> } {
  return { call: vi.fn().mockResolvedValue(response) };
}

const SUCCESS_RESPONSE: RawSimulateResponse = {
  latestLedger: 1234,
  transactionData: 'AAAAtransactionData',
  minResourceFee: '12345',
  cost: { cpuInsns: '1000000', memBytes: '524288' },
  results: [{ xdr: 'AAAAreturnValue', auth: ['AAAAauthEntry'] }],
  events: ['AAAAdiagEvent'],
};

describe('TransactionSimulator', () => {
  it('calls simulateTransaction with the envelope and maps a successful result', async () => {
    const caller = mockCaller(SUCCESS_RESPONSE);
    const sim = new TransactionSimulator(caller);

    const result = await sim.simulate(TX_XDR);

    expect(caller.call).toHaveBeenCalledWith('simulateTransaction', [{ transaction: TX_XDR }]);
    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
    expect(result.minResourceFee).toBe(12345n);
    expect(result.cost).toEqual({ cpuInstructions: 1000000n, memoryBytes: 524288n });
    expect(result.returnValueXdr).toBe('AAAAreturnValue');
    expect(result.auth).toEqual(['AAAAauthEntry']);
    expect(result.events).toEqual(['AAAAdiagEvent']);
    expect(result.needsRestore).toBe(false);
  });

  it('forwards instructionLeeway via resourceConfig', async () => {
    const caller = mockCaller(SUCCESS_RESPONSE);
    await new TransactionSimulator(caller).simulate(TX_XDR, { instructionLeeway: 50000 });

    expect(caller.call).toHaveBeenCalledWith('simulateTransaction', [
      { transaction: TX_XDR, resourceConfig: { instructionLeeway: 50000 } },
    ]);
  });

  it('maps a failed simulation', async () => {
    const caller = mockCaller({ latestLedger: 9, error: 'HostError: Error(Contract, #3)' });
    const result = await new TransactionSimulator(caller).simulate(TX_XDR);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Contract, #3/);
    expect(result.minResourceFee).toBeNull();
    expect(result.cost).toBeNull();
  });

  it('flags restorePreamble as needsRestore', () => {
    const result = toSimulationResult({
      latestLedger: 7,
      minResourceFee: '100',
      restorePreamble: { minResourceFee: '50', transactionData: 'AAAArestore' },
    });

    expect(result.needsRestore).toBe(true);
    expect(result.restorePreamble).toEqual({
      minResourceFee: 50n,
      transactionDataXdr: 'AAAArestore',
    });
  });

  it('rejects an empty transaction string', async () => {
    const sim = new TransactionSimulator(mockCaller(SUCCESS_RESPONSE));
    await expect(sim.simulate('')).rejects.toThrow(TypeError);
  });

  describe('estimateFee', () => {
    it('returns the minimum resource fee for a successful simulation', async () => {
      const fee = await new TransactionSimulator(mockCaller(SUCCESS_RESPONSE)).estimateFee(TX_XDR);
      expect(fee).toBe(12345n);
    });

    it('throws SimulationError when the simulation fails', async () => {
      const caller = mockCaller({ latestLedger: 1, error: 'insufficient resources' });
      await expect(new TransactionSimulator(caller).estimateFee(TX_XDR)).rejects.toThrow(SimulationError);
    });
  });
});
