import type { ChainId } from '../../models/chain.js';
import type { CrossChainOrder, Immutables } from '../../models/core.js';

export abstract class ResolverChainService {
  constructor(readonly chainId: ChainId) {
  }

  abstract canSendTokens(order: CrossChainOrder): boolean;
  abstract canReceiveTokens(order: CrossChainOrder): boolean;

  abstract deploySrc(order: CrossChainOrder, signature: string): Promise<any>;
  abstract deployDst(dstImmutables: Immutables): Promise<any>;
  abstract withdraw(escrowAddress: string, secret: string, immutables: Immutables): Promise<any>;
  abstract cancel(escrowAddress: string, immutables: Immutables): Promise<any>;
}
