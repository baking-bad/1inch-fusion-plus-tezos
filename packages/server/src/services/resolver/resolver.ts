import type { ChainId } from '../../../../common/src/models/chain.js';
import type { CrossChainOrder, Immutables } from '../../models/core.js';

import { ResolverChainService } from './resolverChainService.js';

export class Resolver {
  servicesMap: Map<ChainId, ResolverChainService>;

  constructor(servicesMap: Map<ChainId, ResolverChainService>) {
    this.servicesMap = servicesMap;
  }

  deploySrc(order: CrossChainOrder, signature: string): Promise<string> {
    const srcService = this.servicesMap.get(order.escrowParams.srcChainId);
    if (!srcService)
      throw new Error(`Source chain not supported: ${order.escrowParams.srcChainId}`);

    const dstService = this.servicesMap.get(order.escrowParams.dstChainId);
    if (!dstService)
      throw new Error(`Destination chain not supported: ${order.escrowParams.dstChainId}`);

    if (!srcService.canReceiveTokens(order))
      throw new Error(`Cannot receive tokens on source chain: ${order.escrowParams.srcChainId}`);

    if (!dstService.canSendTokens(order))
      throw new Error(`Cannot send tokens on destination chain: ${order.escrowParams.dstChainId}`);

    return srcService.deploySrc(order, signature);
  }

  deployDst(dstImmutables: Immutables): Promise<string> {
    const dstService = this.servicesMap.get(dstImmutables.chainId);
    if (!dstService)
      throw new Error(`Destination chain not supported: ${dstImmutables.chainId}`);

    return dstService.deployDst(dstImmutables);
  }

  withdraw(escrowAddress: string, secret: string, immutables: Immutables): Promise<string> {
    const service = this.servicesMap.get(immutables.chainId);
    if (!service)
      throw new Error(`Chain not supported: ${immutables.chainId}`);

    return service.withdraw(escrowAddress, secret, immutables);
  }

  cancel(escrowAddress: string, immutables: Immutables): Promise<string> {
    const service = this.servicesMap.get(immutables.chainId);
    if (!service)
      throw new Error(`Chain not supported: ${immutables.chainId}`);

    return service.cancel(escrowAddress, immutables);
  }
}
