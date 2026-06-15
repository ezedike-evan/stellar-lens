---
title: Simulating & Submitting Transactions
description: The full Soroban flow — build and sign with the Stellar SDK, then simulate, submit, and confirm with StellarLens.
---

This is the end-to-end path for invoking a Soroban contract. StellarLens does not build or sign
transactions — you use [`@stellar/stellar-sdk`](https://github.com/stellar/js-stellar-sdk) for
that — but it handles **simulation, submission, and confirmation** over a resilient connection.

> [!TIP]
> Always simulate before submitting. Simulation tells you the resource fee and footprint a
> Soroban transaction needs; submitting without them will fail.

## 1. Build the transaction (Stellar SDK)

```ts
import {
  TransactionBuilder,
  Networks,
  Operation,
  Account,
} from '@stellar/stellar-sdk';

const account = new Account(publicKey, sequence);
const tx = new TransactionBuilder(account, {
  fee: '100',
  networkPassphrase: Networks.TESTNET,
})
  .addOperation(Operation.invokeContractFunction({ contract, function: 'hello', args }))
  .setTimeout(30)
  .build();
```

## 2. Simulate (StellarLens)

```ts
import { RpcClient, TransactionSimulator } from 'stellar-lens';

const client = new RpcClient({ url: 'https://soroban-testnet.stellar.org' });
const simulator = new TransactionSimulator(client);

const sim = await simulator.simulate(tx.toXDR());
if (!sim.success) {
  throw new Error(sim.error ?? 'Simulation failed');
}

console.log('resource fee (stroops):', sim.minResourceFee);
console.log('footprint XDR:', sim.transactionDataXdr);
```

Apply the simulation results to the transaction (Soroban data + resource fee) using the Stellar
SDK's `assembleTransaction`, then sign:

```ts
import { assembleTransaction, Keypair } from '@stellar/stellar-sdk';

const prepared = assembleTransaction(tx, sim).build();
prepared.sign(Keypair.fromSecret(secret));
```

## 3. Submit (StellarLens)

```ts
const res = await client.call<{ status: string; hash: string }>(
  'sendTransaction',
  [prepared.toXDR()],
);
```

## 4. Confirm

Poll `getTransaction` until the ledger includes it:

```ts
let result = await client.call<{ status: string }>('getTransaction', [res.hash]);
while (result.status === 'NOT_FOUND') {
  await new Promise((r) => setTimeout(r, 1000));
  result = await client.call('getTransaction', [res.hash]);
}
```

If anything fails along the way, decode it — see
[Handling Failed Transactions](/docs/guides/handling-errors).

## Estimating fees only

If you just want the resource fee (e.g. to display a cost estimate), skip the ceremony:

```ts
const fee = await simulator.estimateFee(tx.toXDR());
// throws SimulationError if the transaction would fail
```

## Next steps

- [Transaction Simulation reference](/docs/api/transaction-simulation)
- [Handling Failed Transactions](/docs/guides/handling-errors)
