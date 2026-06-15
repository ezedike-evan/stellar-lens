import { describe, it, expect } from 'vitest';
import { decodeScError } from '../../src/decode/scError';
import { XdrDecodeError } from '../../src/decode/types';
import { i32, concat, toBase64 } from '../helpers/xdr';

const SCV_ERROR = 2;
const SCV_U32 = 3;
const SCE_CONTRACT = 0;
const SCE_WASM_VM = 1;
const SCEC_EXCEEDED_LIMIT = 5;

describe('decodeScError', () => {
  it('decodes an application-defined contract error (SCE_CONTRACT)', () => {
    const xdr = toBase64(concat(i32(SCV_ERROR), i32(SCE_CONTRACT), i32(42)));
    const result = decodeScError(xdr);

    expect(result.category).toBe('contract');
    expect(result.type).toBe('Contract');
    expect(result.isContractError).toBe(true);
    expect(result.contractCode).toBe(42);
    expect(result.code).toBe(42);
    expect(result.message).toMatch(/Contract error #42/);
  });

  it('decodes a host error with an SCErrorCode (WasmVm / ExceededLimit)', () => {
    const xdr = toBase64(concat(i32(SCV_ERROR), i32(SCE_WASM_VM), i32(SCEC_EXCEEDED_LIMIT)));
    const result = decodeScError(xdr);

    expect(result.category).toBe('host');
    expect(result.type).toBe('WasmVm');
    expect(result.isContractError).toBe(false);
    expect(result.contractCode).toBeNull();
    expect(result.code).toBe('ExceededLimit');
    expect(result.message).toMatch(/limit was exceeded/i);
  });

  it('accepts raw bytes as well as base64', () => {
    const bytes = Uint8Array.from(concat(i32(SCV_ERROR), i32(SCE_CONTRACT), i32(7)));
    const result = decodeScError(bytes);
    expect(result.contractCode).toBe(7);
  });

  it('throws XdrDecodeError when the value is not SCV_ERROR', () => {
    const xdr = toBase64(concat(i32(SCV_U32), i32(123)));
    expect(() => decodeScError(xdr)).toThrow(XdrDecodeError);
  });
});
