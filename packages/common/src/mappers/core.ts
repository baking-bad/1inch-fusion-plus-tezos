import type * as Models from '../models/core.js';
import type * as Dtos from '../dtos/core.js';

// ======= Model to DTO mappers ======= //

export function mapAuctionPointToDto(model: Models.AuctionPoint): Dtos.AuctionPointDto {
  return {
    delay: model.delay,
    coefficient: model.coefficient,
  };
}

export function mapAuctionGasCostInfoToDto(model: Models.AuctionGasCostInfo): Dtos.AuctionGasCostInfoDto {
  return {
    gasBumpEstimate: model.gasBumpEstimate.toString(),
    gasPriceEstimate: model.gasPriceEstimate.toString(),
  };
}

export function mapAuctionDetailsToDto(model: Models.AuctionDetails): Dtos.AuctionDetailsDto {
  return {
    startTime: model.startTime.toString(),
    initialRateBump: model.initialRateBump,
    duration: model.duration.toString(),
    points: model.points.map(mapAuctionPointToDto),
    gasCost: model.gasCost ? mapAuctionGasCostInfoToDto(model.gasCost) : undefined,
  };
}

export function mapIntegratorFeeToDto(model: Models.IntegratorFee): Dtos.IntegratorFeeDto {
  return {
    ratio: model.ratio.toString(),
    receiver: model.receiver,
  };
}

export function mapAuctionWhitelistItemToDto(model: Models.AuctionWhitelistItem): Dtos.AuctionWhitelistItemDto {
  return {
    address: model.address,
    allowFrom: model.allowFrom.toString(),
  };
}

export function mapDetailsToDto(model: Models.Details): Dtos.DetailsDto {
  return {
    auction: mapAuctionDetailsToDto(model.auction),
    fees: model.fees
      ? {
        integratorFee: model.fees.integratorFee ? mapIntegratorFeeToDto(model.fees.integratorFee) : undefined,
        bankFee: model.fees.bankFee?.toString(),
      }
      : undefined,
    whitelist: model.whitelist.map(mapAuctionWhitelistItemToDto),
    resolvingStartTime: model.resolvingStartTime?.toString(),
  };
}

export function mapTimeLocksToDto(model: Models.TimeLocks): Dtos.TimeLocksDto {
  return {
    srcWithdrawal: model.srcWithdrawal.toString(),
    srcPublicWithdrawal: model.srcPublicWithdrawal.toString(),
    srcCancellation: model.srcCancellation.toString(),
    srcPublicCancellation: model.srcPublicCancellation.toString(),
    dstWithdrawal: model.dstWithdrawal.toString(),
    dstPublicWithdrawal: model.dstPublicWithdrawal.toString(),
    dstCancellation: model.dstCancellation.toString(),
  };
}

export function mapCrossChainOrderInfoToDto(model: Models.CrossChainOrderInfo): Dtos.CrossChainOrderInfoDto {
  return {
    makerAsset: { ...model.makerAsset },
    takerAsset: { ...model.takerAsset },
    makingAmount: model.makingAmount.toString(),
    takingAmount: model.takingAmount.toString(),
    maker: model.maker,
    salt: model.salt?.toString(),
    receiver: model.receiver,
  };
}

export function mapEscrowParamsToDto(model: Models.EscrowParams): Dtos.EscrowParamsDto {
  return {
    hashLock: model.hashLock,
    srcChainId: model.srcChainId,
    dstChainId: model.dstChainId,
    srcSafetyDeposit: model.srcSafetyDeposit.toString(),
    dstSafetyDeposit: model.dstSafetyDeposit.toString(),
    timeLocks: mapTimeLocksToDto(model.timeLocks),
  };
}

export function mapCrossChainOrderExtraToDto(model: Models.CrossChainOrderExtra): Dtos.CrossChainOrderExtraDto {
  return {
    nonce: model.nonce?.toString(),
    permit: model.permit,
    orderExpirationDelay: model.orderExpirationDelay?.toString(),
    enablePermit2: model.enablePermit2,
    source: model.source,
    allowMultipleFills: model.allowMultipleFills,
    allowPartialFills: model.allowPartialFills,
  };
}

export function mapCrossChainOrderToDto(model: Models.CrossChainOrder): Dtos.CrossChainOrderDto {
  return {
    escrowFactory: model.escrowFactory,
    orderInfo: mapCrossChainOrderInfoToDto(model.orderInfo),
    escrowParams: mapEscrowParamsToDto(model.escrowParams),
    details: mapDetailsToDto(model.details),
    extra: mapCrossChainOrderExtraToDto(model.extra),
  };
}

export function mapSignedCrossChainOrderToDto(model: Models.SignedCrossChainOrder): Dtos.SignedCrossChainOrderDto {
  return {
    order: mapCrossChainOrderToDto(model.order),
    signature: model.signature,
    orderHash: model.orderHash,
  };
}

export function mapImmutablesToDto(model: Models.Immutables): Dtos.ImmutablesDto {
  return {
    orderHash: model.orderHash,
    hashLock: model.hashLock,
    maker: model.maker,
    taker: model.taker,
    token: model.token,
    amount: model.amount.toString(),
    safetyDeposit: model.safetyDeposit.toString(),
    timeLocks: mapTimeLocksToDto(model.timeLocks),
  };
}

// ======= DTO to Model mappers ======= //

export function mapAuctionPointDtoToModel(dto: Dtos.AuctionPointDto): Models.AuctionPoint {
  return {
    delay: dto.delay,
    coefficient: dto.coefficient,
  };
}

export function mapAuctionGasCostInfoDtoToModel(dto: Dtos.AuctionGasCostInfoDto): Models.AuctionGasCostInfo {
  return {
    gasBumpEstimate: BigInt(dto.gasBumpEstimate),
    gasPriceEstimate: BigInt(dto.gasPriceEstimate),
  };
}

export function mapAuctionDetailsDtoToModel(dto: Dtos.AuctionDetailsDto): Models.AuctionDetails {
  return {
    startTime: BigInt(dto.startTime),
    initialRateBump: dto.initialRateBump,
    duration: BigInt(dto.duration),
    points: dto.points.map(mapAuctionPointDtoToModel),
    gasCost: dto.gasCost ? mapAuctionGasCostInfoDtoToModel(dto.gasCost) : undefined,
  };
}

export function mapIntegratorFeeDtoToModel(dto: Dtos.IntegratorFeeDto): Models.IntegratorFee {
  return {
    ratio: BigInt(dto.ratio),
    receiver: dto.receiver,
  };
}

export function mapAuctionWhitelistItemDtoToModel(dto: Dtos.AuctionWhitelistItemDto): Models.AuctionWhitelistItem {
  return {
    address: dto.address,
    allowFrom: BigInt(dto.allowFrom),
  };
}

export function mapDetailsDtoToModel(dto: Dtos.DetailsDto): Models.Details {
  return {
    auction: mapAuctionDetailsDtoToModel(dto.auction),
    fees: dto.fees
      ? {
        integratorFee: dto.fees.integratorFee ? mapIntegratorFeeDtoToModel(dto.fees.integratorFee) : undefined,
        bankFee: dto.fees.bankFee ? BigInt(dto.fees.bankFee) : undefined,
      }
      : undefined,
    whitelist: dto.whitelist.map(mapAuctionWhitelistItemDtoToModel),
    resolvingStartTime: dto.resolvingStartTime ? BigInt(dto.resolvingStartTime) : undefined,
  };
}

export function mapTimeLocksDtoToModel(dto: Dtos.TimeLocksDto): Models.TimeLocks {
  return {
    srcWithdrawal: BigInt(dto.srcWithdrawal),
    srcPublicWithdrawal: BigInt(dto.srcPublicWithdrawal),
    srcCancellation: BigInt(dto.srcCancellation),
    srcPublicCancellation: BigInt(dto.srcPublicCancellation),
    dstWithdrawal: BigInt(dto.dstWithdrawal),
    dstPublicWithdrawal: BigInt(dto.dstPublicWithdrawal),
    dstCancellation: BigInt(dto.dstCancellation),
  };
}

export function mapCrossChainOrderInfoDtoToModel(dto: Dtos.CrossChainOrderInfoDto): Models.CrossChainOrderInfo {
  return {
    makerAsset: { ...dto.makerAsset },
    takerAsset: { ...dto.takerAsset },
    makingAmount: BigInt(dto.makingAmount),
    takingAmount: BigInt(dto.takingAmount),
    maker: dto.maker,
    salt: dto.salt !== undefined ? BigInt(dto.salt) : undefined,
    receiver: dto.receiver,
  };
}

export function mapEscrowParamsDtoToModel(dto: Dtos.EscrowParamsDto): Models.EscrowParams {
  return {
    hashLock: dto.hashLock,
    srcChainId: dto.srcChainId,
    dstChainId: dto.dstChainId,
    srcSafetyDeposit: BigInt(dto.srcSafetyDeposit),
    dstSafetyDeposit: BigInt(dto.dstSafetyDeposit),
    timeLocks: mapTimeLocksDtoToModel(dto.timeLocks),
  };
}

export function mapCrossChainOrderExtraDtoToModel(dto: Dtos.CrossChainOrderExtraDto): Models.CrossChainOrderExtra {
  return {
    nonce: dto.nonce !== undefined ? BigInt(dto.nonce) : undefined,
    permit: dto.permit,
    orderExpirationDelay: dto.orderExpirationDelay !== undefined ? BigInt(dto.orderExpirationDelay) : undefined,
    enablePermit2: dto.enablePermit2,
    source: dto.source,
    allowMultipleFills: dto.allowMultipleFills,
    allowPartialFills: dto.allowPartialFills,
  };
}

export function mapCrossChainOrderDtoToModel(dto: Dtos.CrossChainOrderDto): Models.CrossChainOrder {
  return {
    escrowFactory: dto.escrowFactory,
    orderInfo: mapCrossChainOrderInfoDtoToModel(dto.orderInfo),
    escrowParams: mapEscrowParamsDtoToModel(dto.escrowParams),
    details: mapDetailsDtoToModel(dto.details),
    extra: mapCrossChainOrderExtraDtoToModel(dto.extra),
  };
}

export function mapSignedCrossChainOrderDtoToModel(dto: Dtos.SignedCrossChainOrderDto): Models.SignedCrossChainOrder {
  return {
    order: mapCrossChainOrderDtoToModel(dto.order),
    signature: dto.signature,
    orderHash: dto.orderHash,
  };
}

export function mapImmutablesDtoToModel(dto: Dtos.ImmutablesDto): Models.Immutables {
  return {
    orderHash: dto.orderHash,
    hashLock: dto.hashLock,
    maker: dto.maker,
    taker: dto.taker,
    token: dto.token,
    amount: BigInt(dto.amount),
    safetyDeposit: BigInt(dto.safetyDeposit),
    timeLocks: mapTimeLocksDtoToModel(dto.timeLocks),
  };
}
