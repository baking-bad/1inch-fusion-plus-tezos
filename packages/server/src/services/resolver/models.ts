import type { Immutables, SignedCrossChainOrder } from '@baking-bad/1inch-fusion-plus-common';

export interface Transaction {
  hash: string;
  block: string;
  timestamp: bigint;
}

export interface OrderContext {
  order: SignedCrossChainOrder;
  srcImmutables: Immutables;
  dstImmutables: Immutables;
  srcEscrowDeploymentTx: Transaction;
  srcEscrowAddress: string;
  dstEscrowDeploymentTx: Transaction;
  dstEscrowAddress: string;
}

export interface StartSwapResult {
  srcEscrowDeploymentTx: Transaction;
  srcEscrowAddress: string;
  dstEscrowDeploymentTx: Transaction;
  dstEscrowAddress: string;
}

export interface FinalizeSwapResult {
  srcWithdrawalTx: Transaction;
  dstWithdrawalTx: Transaction;
}

export interface CancelSwapResult {
  srcCancellationTx: Transaction;
  dstCancellationTx: Transaction;
}
