import { Immutables, TezosChainAccount, utils } from '@baking-bad/1inch-fusion-plus-common';

import type { Transaction } from './models.js';

export class TezosResolverChainService {
  constructor(private readonly tezosChainAccount: TezosChainAccount) { }

  getResolverAddress(): Promise<string> {
    return this.tezosChainAccount.getAddress();
  }

  async deploySrc(immutables: Immutables, signature: string): Promise<readonly [tx: Transaction, escrowAddress: string]> {
    await utils.wait(1000);

    return [
      {
        hash: 'o1-src',
        block: 'b1-src',
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
      },
      'tz1-src-escrow-address',
    ];
  }

  async deployDst(immutables: Immutables): Promise<readonly [tx: Transaction, escrowAddress: string]> {
    await utils.wait(1000);

    return [
      {
        hash: 'o1-dst',
        block: 'b1-dst',
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
      },
      'tz1-dst-escrow-address',
    ];
  }

  async withdraw(escrowAddress: string, secret: string, immutables: Immutables): Promise<Transaction> {
    await utils.wait(1000);

    return {
      hash: 'o1-withdraw',
      block: 'b1-withdraw',
      timestamp: BigInt(Math.floor(Date.now() / 1000)),
    };
  }

  async cancel(escrowAddress: string, immutables: Immutables): Promise<Transaction> {
    await utils.wait(1000);

    return {
      hash: 'o1-cancel',
      block: 'b1-cancel',
      timestamp: BigInt(Math.floor(Date.now() / 1000)),
    };
  }
}
