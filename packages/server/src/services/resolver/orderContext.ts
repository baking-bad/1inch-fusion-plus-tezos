import type { Immutables, SignedCrossChainOrder } from '@baking-bad/1inch-fusion-plus-common';

export interface OrderContext {
  order: SignedCrossChainOrder;
  srcImmutables: Immutables;
  dstImmutables: Immutables;
  srcEscrowDeployedTimestamp: bigint;
  dstEscrowDeployedTimestamp: bigint;
  srcEscrowAddress: string;
  dstEscrowAddress: string;
}
