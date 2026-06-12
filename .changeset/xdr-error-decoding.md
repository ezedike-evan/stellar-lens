---
'stellar-lens': minor
---

Add zero-dependency XDR error decoding. New exports `decodeTransactionResult`,
`decodeScError`, and `explainTransactionError` turn the opaque base64 XDR blobs Soroban RPC
returns on failure (`errorResultXdr`, `resultXdr`, and `SCV_ERROR` values) into structured,
human-readable explanations — including application-defined contract error codes — without
requiring the Stellar SDK. Throws `XdrDecodeError` on malformed input.
