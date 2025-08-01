import { mappers, RemoteService, type SignedCrossChainOrder } from '@baking-bad/1inch-fusion-plus-common';

export interface SwapResult {
  srcEscrowTx: string;
  srcEscrowAddress: string;
  dstEscrowTx: string;
  dstEscrowAddress: string;
}

export class ResolverService extends RemoteService {
  async placeOrder(order: SignedCrossChainOrder) {
    const orderDto = mappers.core.mapSignedCrossChainOrderToDto(order);
    const result = await this.fetch<SwapResult>('/resolver/order', {
      method: 'POST',
      body: JSON.stringify(orderDto),
    });

    return result;
  }
}
