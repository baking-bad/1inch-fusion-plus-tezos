import type { ChainId } from '../models/chain.js';

export interface TimeLocksDto {
  /**
   * Network: Source
   * Delay from `deployedAt` at which ends `finality lock` and starts `private withdrawal` */
  srcWithdrawal: string;
  /**
   * Network: Source
   * Delay from `deployedAt` at which ends `private withdrawal` and starts `public withdrawal` */
  srcPublicWithdrawal: string;
  /**
   * Network: Source
   * Delay from `deployedAt` at which ends `public withdrawal` and starts `private cancellation` */
  srcCancellation: string;
  /**
   * Network: Source
   * Delay from `deployedAt` at which ends `private cancellation` and starts `public cancellation` */
  srcPublicCancellation: string;
  /**
   * Network: Destination
   * Delay from `deployedAt` at which ends `finality lock` and starts `private withdrawal` */
  dstWithdrawal: string;
  /**
   * Network: Destination
   * Delay from `deployedAt` at which ends `private withdrawal` and starts `public withdrawal` */
  dstPublicWithdrawal: string;
  /**
   * Network: Destination
   * Delay from `deployedAt` at which ends `public withdrawal` and starts `private cancellation` */
  dstCancellation: string;
};

export interface CrossChainOrderInfoDto {
  /**
   * Source chain asset
   */
  makerAsset: {
    address: string;
    tokenId?: string;
  };
  /**
   * Destination chain asset
   */
  takerAsset: {
    address: string;
    tokenId?: string;
  };
  /**
   * Source chain amount
   */
  makingAmount: string;
  /**
   * Destination chain min amount
   */
  takingAmount: string;
  maker: string;
  salt?: string;
  /**
   * Destination chain receiver address
   *
   * If not set, then `maker` used
   */
  receiver?: string;
};

export interface EscrowParamsDto {
  hashLock: string;
  srcChainId: ChainId;
  dstChainId: ChainId;
  srcSafetyDeposit: string;
  dstSafetyDeposit: string;
  timeLocks: TimeLocksDto;
}

export interface CrossChainOrderExtraDto {
  /**
   * Max size is 40bit
   */
  nonce?: string;
  permit?: string;
  /**
   * Order will expire in `orderExpirationDelay` after auction ends
   * Default 12s
   */
  orderExpirationDelay?: string;
  enablePermit2?: boolean;
  source?: string;
  allowMultipleFills?: boolean;
  allowPartialFills?: boolean;
}

export interface CrossChainOrderDto {
  escrowFactory: string;
  orderInfo: CrossChainOrderInfoDto;
  escrowParams: EscrowParamsDto;
  // Ignored for demo
  // details: DetailsDto;
  extra: CrossChainOrderExtraDto;
}

export interface SignedCrossChainOrderDto {
  order: CrossChainOrderDto;
  signature: string;
  orderHash: string;
}

export interface ImmutablesDto {
  orderHash: string;
  hashLock: string;
  maker: string;
  taker: string;
  token: string;
  amount: string;
  safetyDeposit: string;
  timeLocks: TimeLocksDto;
}
