import { mappers, RemoteService, type SignedCrossChainOrder } from '@baking-bad/1inch-fusion-plus-common';

export interface PlaceOrderResult {
  srcEscrowTx: string;
  srcEscrowAddress: string;
  dstEscrowTx: string;
  dstEscrowAddress: string;
}

export interface WithdrawOrderResult {
  srcWithdrawalTx: string;
  dstWithdrawalTx: string;
}

export class ResolverService extends RemoteService {
  async placeOrder(order: SignedCrossChainOrder) {
    const orderDto = mappers.core.mapSignedCrossChainOrderToDto(order);
    const result = await this.fetch<PlaceOrderResult>('/resolver/order', {
      method: 'POST',
      body: JSON.stringify(orderDto),
    });

    return result;
  }

  async withdraw(orderHash: string, secret: string) {
    const result = await this.fetch<WithdrawOrderResult>(`/resolver/order/${orderHash}/withdraw`, {
      method: 'POST',
      body: JSON.stringify({ secret }),
    });

    return result;
  }
}
