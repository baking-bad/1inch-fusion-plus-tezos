import type { CrossChainOrder, Immutables } from '../../models/core.js';

import { ResolverChainService } from './resolverChainService.js';

export class TaquitoContractTezosBridgeBlockchainService extends ResolverChainService {
  canSendTokens(order: CrossChainOrder): boolean {
    throw new Error('Method not implemented.');
  }

  canReceiveTokens(order: CrossChainOrder): boolean {
    throw new Error('Method not implemented.');
  }

  deploySrc(order: CrossChainOrder, signature: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  deployDst(immutables: Immutables): Promise<any> {
    throw new Error('Method not implemented.');
  }

  withdraw(escrowAddress: string, secret: string, immutables: Immutables): Promise<any> {
    throw new Error('Method not implemented.');
  }

  cancel(escrowAddress: string, immutables: Immutables): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
