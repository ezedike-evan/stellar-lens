import { describe, it, expect } from 'vitest';
import { base64ToBytes, bytesToBase64 } from '../../src/xdr/base64';

/** Independent reference encoder (via `btoa`) to validate our own. */
function refBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

describe('base64', () => {
  it('round-trips byte sequences of every length-mod-3', () => {
    for (let len = 0; len < 20; len++) {
      const bytes = Uint8Array.from({ length: len }, (_, i) => (i * 37 + 11) & 0xff);
      const encoded = bytesToBase64(bytes);
      expect(encoded).toBe(refBase64(bytes));
      expect(Array.from(base64ToBytes(encoded))).toEqual(Array.from(bytes));
    }
  });

  it('decodes unpadded input and ignores surrounding whitespace', () => {
    expect(Array.from(base64ToBytes(' AAAA\n'))).toEqual([0, 0, 0]);
    expect(Array.from(base64ToBytes('Zg'))).toEqual([0x66]); // unpadded "f"
  });

  it('throws on invalid characters and lengths', () => {
    expect(() => base64ToBytes('@@@@')).toThrow(TypeError);
    expect(() => base64ToBytes('A')).toThrow(/invalid base64 length/);
  });
});
