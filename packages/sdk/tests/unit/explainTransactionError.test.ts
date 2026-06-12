import { describe, it, expect } from 'vitest';
import { explainTransactionError } from '../../src/decode/explain';
import { i32, i64, concat, toBase64 } from '../helpers/xdr';

const TX_FAILED = -1;
const TX_BAD_SEQ = -5;
const OP_INNER = 0;
const OP_TYPE_INVOKE_HOST_FUNCTION = 24;
const INVOKE_TRAPPED = -2;

const FAILED_INVOKE = toBase64(
  concat(
    i64(1000n),
    i32(TX_FAILED),
    i32(1),
    i32(OP_INNER),
    i32(OP_TYPE_INVOKE_HOST_FUNCTION),
    i32(INVOKE_TRAPPED),
  ),
);
const BAD_SEQ = toBase64(concat(i64(100n), i32(TX_BAD_SEQ)));

describe('explainTransactionError', () => {
  it('prefers errorResultXdr and surfaces the failing operation', () => {
    const text = explainTransactionError({ errorResultXdr: FAILED_INVOKE });
    expect(text).toMatch(/txFAILED/);
    expect(text).toMatch(/INVOKE_HOST_FUNCTION/);
    expect(text).toMatch(/op 0/);
  });

  it('falls back to resultXdr when no errorResultXdr is present', () => {
    const text = explainTransactionError({ resultXdr: BAD_SEQ });
    expect(text).toMatch(/txBAD_SEQ/);
  });

  it('reports the status when only a status string is available', () => {
    const text = explainTransactionError({ status: 'PENDING' });
    expect(text).toMatch(/PENDING/);
  });

  it('accepts a bare base64 string', () => {
    expect(explainTransactionError(BAD_SEQ)).toMatch(/txBAD_SEQ/);
  });

  it('handles an empty input object gracefully', () => {
    expect(explainTransactionError({})).toMatch(/No transaction error/i);
  });
});
