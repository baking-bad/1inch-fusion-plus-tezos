import type { ChainId } from './chain.js';

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
  makingAmount: bigint;
  /**
   * Destination chain min amount
   */
  takingAmount: bigint;
  maker: string;
  salt?: bigint;
  /**
   * Destination chain receiver address
   */
  receiver: string;
};

export interface EscrowParams {
  hashLock: string;
  srcChainId: ChainId;
  dstChainId: ChainId;
  srcSafetyDeposit: bigint;
  dstSafetyDeposit: bigint;
  timeLocks: TimeLocks;
}

export interface AuctionPoint {
  delay: number;
  coefficient: number;
};
export interface AuctionGasCostInfo {
  gasBumpEstimate: bigint;
  gasPriceEstimate: bigint;
};

export interface AuctionDetails {
  startTime: bigint;
  initialRateBump: number;
  duration: bigint;
  points: AuctionPoint[];
  gasCost?: AuctionGasCostInfo;
}

export interface IntegratorFee {
  ratio: bigint;
  receiver: string;
};

export interface AuctionWhitelistItem {
  address: string;
  allowFrom: bigint;
};

export interface Details {
  auction: AuctionDetails;
  fees?: {
    integratorFee?: IntegratorFee;
    bankFee?: bigint;
  };
  whitelist: AuctionWhitelistItem[];
  /**
   * Time from which order can be executed
   */
  resolvingStartTime?: bigint;
};

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
  details: Details;
  extra: CrossChainOrderExtra;
}

export interface SignedCrossChainOrder {
  order: CrossChainOrder;
  signature: string;
  orderHash: string;
}

export interface Immutables {
  orderHash: string;
  hashLock: string;
  maker: string;
  taker: string;
  token: string;
  tokenId?: string;
  amount: bigint;
  safetyDeposit: bigint;
  timeLocks: TimeLocks & {
    deployedAt?: bigint;
  };
}
