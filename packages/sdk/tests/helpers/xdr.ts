/**
 * Tiny XDR fixture builders for unit tests.
 *
 * These construct raw big-endian bytes by hand (per the XDR spec) and base64
 * them via the runtime's `btoa` — deliberately NOT via the SDK's own base64
 * encoder — so the decoder tests validate the reader against independently-built
 * input.
 */

/** Encodes a signed/unsigned 32-bit integer as 4 big-endian bytes. */
export function i32(n: number): number[] {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
}

/** Encodes a 64-bit integer (bigint) as 8 big-endian bytes. */
export function i64(n: bigint): number[] {
  let v = BigInt.asUintN(64, n);
  const out: number[] = [];
  for (let i = 0; i < 8; i++) {
    out.unshift(Number(v & 0xffn));
    v >>= 8n;
  }
  return out;
}

/** Concatenates byte groups into one array. */
export function concat(...groups: number[][]): number[] {
  return groups.flat();
}

/** Base64-encodes a byte array via `btoa` (independent of the SDK's encoder). */
export function toBase64(bytes: number[]): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}
