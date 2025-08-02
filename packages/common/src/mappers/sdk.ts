import Sdk from '@1inch/cross-chain-sdk';

import { ChainIds, Immutables, type CrossChainOrder } from '../models/index.js';
import * as tezosChainHelpers from '../tezosChainHelpers.js';

export const mapOrderToSdkCrossChainOrder = (order: CrossChainOrder): Sdk.CrossChainOrder => {
  return Sdk.CrossChainOrder.new(
    new Sdk.Address(order.escrowFactory),
    {
      salt: order.orderInfo.salt,
      maker: new Sdk.Address(order.orderInfo.maker),
      makingAmount: order.orderInfo.makingAmount,
      takingAmount: order.orderInfo.takingAmount,
      makerAsset: order.escrowParams.srcChainId === ChainIds.Ethereum
        ? new Sdk.Address(order.orderInfo.makerAsset.address)
        : new Sdk.Address(tezosChainHelpers.mapTezosTokenAddressToEvmAddress(order.orderInfo.makerAsset.address, order.orderInfo.makerAsset.tokenId)),
      takerAsset: order.escrowParams.dstChainId === ChainIds.Ethereum
        ? new Sdk.Address(order.orderInfo.takerAsset.address)
        : new Sdk.Address(tezosChainHelpers.mapTezosTokenAddressToEvmAddress(order.orderInfo.takerAsset.address, order.orderInfo.takerAsset.tokenId)),
    },
    {
      hashLock: Sdk.HashLock.fromString(order.escrowParams.hashLock),
      srcChainId: order.escrowParams.srcChainId === ChainIds.Ethereum ? Sdk.NetworkEnum.ETHEREUM : (ChainIds.TezosGhostnetSdkChainId as any as Sdk.SupportedChain),
      dstChainId: order.escrowParams.dstChainId === ChainIds.Ethereum ? Sdk.NetworkEnum.ETHEREUM : (ChainIds.TezosGhostnetSdkChainId as any as Sdk.SupportedChain),
      srcSafetyDeposit: order.escrowParams.srcSafetyDeposit,
      dstSafetyDeposit: order.escrowParams.dstSafetyDeposit,
      timeLocks: Sdk.TimeLocks.new({
        srcWithdrawal: order.escrowParams.timeLocks.srcWithdrawal,
        srcPublicWithdrawal: order.escrowParams.timeLocks.srcPublicWithdrawal,
        srcCancellation: order.escrowParams.timeLocks.srcCancellation,
        srcPublicCancellation: order.escrowParams.timeLocks.srcPublicCancellation,
        dstWithdrawal: order.escrowParams.timeLocks.dstWithdrawal,
        dstPublicWithdrawal: order.escrowParams.timeLocks.dstPublicWithdrawal,
        dstCancellation: order.escrowParams.timeLocks.dstCancellation,
      }),
    },
    {
      auction: new Sdk.AuctionDetails(order.details.auction),
      whitelist: order.details.whitelist.map(item => ({
        address: new Sdk.Address(item.address),
        allowFrom: item.allowFrom,
      })),
      resolvingStartTime: order.details.resolvingStartTime,
    },
    {
      nonce: order.extra.nonce,
      allowPartialFills: order.extra.allowPartialFills,
      allowMultipleFills: order.extra.allowMultipleFills,
    }
  );
};

export const mapSdkImmutablesToImmutables = (immutables: Sdk.Immutables): Immutables => {
  return {
    orderHash: immutables.orderHash,
    hashLock: immutables.hashLock.toString(),
    maker: immutables.maker.toString(),
    taker: immutables.taker.toString(),
    token: immutables.token.toString(),
    amount: immutables.amount,
    safetyDeposit: immutables.safetyDeposit,
    timeLocks: {
      srcWithdrawal: (immutables.timeLocks as any)._srcWithdrawal,
      srcPublicWithdrawal: (immutables.timeLocks as any)._srcPublicWithdrawal,
      srcCancellation: (immutables.timeLocks as any)._srcCancellation,
      srcPublicCancellation: (immutables.timeLocks as any)._srcPublicCancellation,
      dstWithdrawal: (immutables.timeLocks as any)._dstWithdrawal,
      dstPublicWithdrawal: (immutables.timeLocks as any)._dstPublicWithdrawal,
      dstCancellation: (immutables.timeLocks as any)._dstCancellation,
      deployedAt: (immutables.timeLocks as any)._deployedAt,
    },
  };
};

export const mapImmutablesToSdkImmutables = (immutables: Immutables): Sdk.Immutables => {
  let sdkImmutables = Sdk.Immutables.new({
    orderHash: immutables.orderHash,
    hashLock: Sdk.HashLock.fromString(immutables.hashLock),
    maker: new Sdk.Address(immutables.maker),
    taker: new Sdk.Address(immutables.taker),
    token: new Sdk.Address(immutables.token),
    amount: immutables.amount,
    safetyDeposit: immutables.safetyDeposit,
    timeLocks: Sdk.TimeLocks.new({
      srcWithdrawal: immutables.timeLocks.srcWithdrawal,
      srcPublicWithdrawal: immutables.timeLocks.srcPublicWithdrawal,
      srcCancellation: immutables.timeLocks.srcCancellation,
      srcPublicCancellation: immutables.timeLocks.srcPublicCancellation,
      dstWithdrawal: immutables.timeLocks.dstWithdrawal,
      dstPublicWithdrawal: immutables.timeLocks.dstPublicWithdrawal,
      dstCancellation: immutables.timeLocks.dstCancellation,
    }),
  });

  if (immutables.timeLocks.deployedAt !== undefined) {
    sdkImmutables = sdkImmutables.withDeployedAt(immutables.timeLocks.deployedAt);
  }

  return sdkImmutables;
};
