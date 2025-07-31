import { TezosToolkit } from '@taquito/taquito';
import { InMemorySigner } from '@taquito/signer';

import type { TezosToken } from '../models/tokens.js';

interface TezosChainAccountOptions {
  userPrivateKey: string;
  rpcUrl: string;
  tokens: ReadonlyMap<string, TezosToken>;
}

export class TezosChainAccount {
  protected readonly tezosToolkit: TezosToolkit;
  protected readonly tokens: ReadonlyMap<string, TezosToken>;

  constructor(options: TezosChainAccountOptions) {
    this.tokens = options.tokens;

    this.tezosToolkit = new TezosToolkit(options.rpcUrl);
    this.tezosToolkit.setProvider({
      signer: new InMemorySigner(options.userPrivateKey),
    });
  }

  async start() {
  }

  async stop() {
  }

  getAddress(): Promise<string> {
    return this.tezosToolkit.signer.publicKeyHash();
  }
}
