import { TezosChainAccount, utils } from '@baking-bad/1inch-fusion-plus-common';
import type { Immutables } from '../../models/core.js';

export class TezosResolverChainService {
  constructor(private readonly tezosChainAccount: TezosChainAccount) { }

  async deploySrc(immutables: Immutables, signature: string): Promise<any> {
    await utils.wait(1000);
  }

  async deployDst(immutables: Immutables): Promise<any> {
    await utils.wait(1000);

    return 'o0';
  }

  async withdraw(escrowAddress: string, secret: string, immutables: Immutables): Promise<any> {
    await utils.wait(1000);
  }

  async cancel(escrowAddress: string, immutables: Immutables): Promise<any> {
    await utils.wait(1000);
  }
}
