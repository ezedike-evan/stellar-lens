import { describe, it, expect } from 'vitest';
import { decodeTransactionResult } from '../../src/decode/transactionResult';
import { XdrDecodeError } from '../../src/decode/types';
import { i32, i64, concat, toBase64 } from '../helpers/xdr';

// TransactionResultCode
const TX_SUCCESS = 0;
const TX_FAILED = -1;
const TX_BAD_SEQ = -5;
// OperationResultCode.opINNER / OperationType / inner codes
const OP_INNER = 0;
const OP_TYPE_INVOKE_HOST_FUNCTION = 24;
const OP_TYPE_PAYMENT = 1;
const INVOKE_TRAPPED = -2;
const INVOKE_SUCCESS = 0;

describe('decodeTransactionResult', () => {
  it('decodes a transaction-level failure with a void body (txBAD_SEQ)', () => {
    const xdr = toBase64(concat(i64(100n), i32(TX_BAD_SEQ)));
    const result = decodeTransactionResult(xdr);

    expect(result.code).toBe('txBAD_SEQ');
    expect(result.successful).toBe(false);
    expect(result.feeCharged).toBe(100n);
    expect(result.operations).toEqual([]);
    expect(result.partial).toBe(false);
    expect(result.message).toMatch(/sequence number/i);
    expect(result.raw).toBe(xdr);
  });

  it('decodes a failed Soroban operation (INVOKE_HOST_FUNCTION trapped)', () => {
    const xdr = toBase64(
      concat(
        i64(1000n),
        i32(TX_FAILED),
        i32(1), // results<> length
        i32(OP_INNER),
        i32(OP_TYPE_INVOKE_HOST_FUNCTION),
        i32(INVOKE_TRAPPED),
      ),
    );
    const result = decodeTransactionResult(xdr);

    expect(result.code).toBe('txFAILED');
    expect(result.successful).toBe(false);
    expect(result.partial).toBe(false);
    expect(result.operations).toHaveLength(1);

    const op = result.operations[0]!;
    expect(op.code).toBe('opINNER');
    expect(op.operationType).toBe('INVOKE_HOST_FUNCTION');
    expect(op.innerCode).toBe('INVOKE_HOST_FUNCTION_TRAPPED');
    expect(op.successful).toBe(false);
    expect(op.message).toMatch(/trapped/i);
  });

  it('decodes a successful invocation and consumes the success Hash payload', () => {
    const hash = new Array<number>(32).fill(0); // 32-byte Hash, already 4-aligned
    const xdr = toBase64(
      concat(
        i64(500n),
        i32(TX_SUCCESS),
        i32(1),
        i32(OP_INNER),
        i32(OP_TYPE_INVOKE_HOST_FUNCTION),
        i32(INVOKE_SUCCESS),
        hash,
      ),
    );
    const result = decodeTransactionResult(xdr);

    expect(result.code).toBe('txSUCCESS');
    expect(result.successful).toBe(true);
    expect(result.partial).toBe(false);
    expect(result.operations[0]!.successful).toBe(true);
    expect(result.operations[0]!.innerCode).toBe('INVOKE_HOST_FUNCTION_SUCCESS');
  });

  it('marks the result partial for an unmodeled classic operation', () => {
    const xdr = toBase64(
      concat(i64(100n), i32(TX_FAILED), i32(1), i32(OP_INNER), i32(OP_TYPE_PAYMENT)),
    );
    const result = decodeTransactionResult(xdr);

    expect(result.code).toBe('txFAILED');
    expect(result.partial).toBe(true);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]!.operationType).toBe('PAYMENT');
    expect(result.operations[0]!.innerCode).toBeNull();
    expect(result.operations[0]!.message).toMatch(/not decoded/i);
  });

  it('throws XdrDecodeError on truncated input', () => {
    const xdr = toBase64(concat(i64(100n), [0xff, 0xff])); // enum needs 4 bytes, only 2 present
    expect(() => decodeTransactionResult(xdr)).toThrow(XdrDecodeError);
  });

  it('throws XdrDecodeError on invalid base64', () => {
    expect(() => decodeTransactionResult('not*valid*base64')).toThrow(XdrDecodeError);
  });
});
