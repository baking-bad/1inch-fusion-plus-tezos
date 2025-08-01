import type { ChainId } from '../../../common/src/models/chain.js';

export interface TimeLocks {
  /**
   * Network: Source
   * Delay from `deployedAt` at which ends `finality lock` and starts `private withdrawal` */
  srcWithdrawal: bigint;
  /**
   * Network: Source
   * Delay from `deployedAt` at which ends `private withdrawal` and starts `public withdrawal` */
  srcPublicWithdrawal: bigint;
  /**
   * Network: Source
   * Delay from `deployedAt` at which ends `public withdrawal` and starts `private cancellation` */
  srcCancellation: bigint;
  /**
   * Network: Source
   * Delay from `deployedAt` at which ends `private cancellation` and starts `public cancellation` */
  srcPublicCancellation: bigint;
  /**
   * Network: Destination
   * Delay from `deployedAt` at which ends `finality lock` and starts `private withdrawal` */
  dstWithdrawal: bigint;
  /**
   * Network: Destination
   * Delay from `deployedAt` at which ends `private withdrawal` and starts `public withdrawal` */
  dstPublicWithdrawal: bigint;
  /**
   * Network: Destination
   * Delay from `deployedAt` at which ends `public withdrawal` and starts `private cancellation` */
  dstCancellation: bigint;
};

export interface CrossChainOrderInfo {
  /**
   * Source chain asset
   */
  makerAsset: string;
  /**
   * Destination chain asset
   */
  takerAsset: string;
  /**
   * Source chain amount
   */
  makingAmount: bigint;
  /**
   * Destination chain min amount
   */
  takingAmount: bigint;
  maker: string;
  salt?: bigint;
  /**
   * Destination chain receiver address
   *
   * If not set, then `maker` used
   */
  receiver?: string;
};

export interface EscrowParams {
  hashLock: string;
  srcChainId: ChainId;
  dstChainId: ChainId;
  srcSafetyDeposit: bigint;
  dstSafetyDeposit: bigint;
  timeLocks: TimeLocks;
}

export interface CrossChainOrderExtra {
  /**
     * Max size is 40bit
     */
  nonce?: bigint;
  permit?: string;
  /**
 * Order will expire in `orderExpirationDelay` after auction ends
 * Default 12s
 */
  orderExpirationDelay?: bigint;
  enablePermit2?: boolean;
  source?: string;
  allowMultipleFills?: boolean;
  allowPartialFills?: boolean;
}

export interface CrossChainOrder {
  escrowFactory: string;
  orderInfo: CrossChainOrderInfo;
  escrowParams: EscrowParams;
  // Ignored for demo
  // details: Details;
  extra: CrossChainOrderExtra;
}

export interface Immutables {
  orderHash: string;
  hashLock: string;
  maker: string;
  taker: string;
  token: string;
  amount: bigint;
  safetyDeposit: bigint;
  timeLocks: TimeLocks;
}
