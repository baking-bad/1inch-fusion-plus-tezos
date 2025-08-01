import { randomBytes } from 'node:crypto';

import Sdk from '@1inch/cross-chain-sdk';
import { uint8ArrayToHex, UINT_40_MAX } from '@1inch/byte-utils';
import { parseEther, parseUnits } from 'ethers';

import {
  ChainIds,
  type EvmChainAccount,
  type TezosChainAccount,
  type TezosToken,
  type Erc20Token,
  type CrossChainOrder,
  type ChainId,
  tezosChainHelpers,
  SignedCrossChainOrder
} from '@baking-bad/1inch-fusion-plus-common';

import config from './config.js';

export class SwapManager {
  constructor(private readonly evmChainAccount: EvmChainAccount, private readonly tezosChainAccount: TezosChainAccount) { }

  async createOrder(srcAmount: number, srcChainId: ChainId, srcTokenSymbol: string, dstAmount: number, dstChainId: ChainId, dstTokenSymbol: string): Promise<SignedCrossChainOrder> {
    if (srcChainId !== ChainIds.Ethereum)
      throw new Error(`Unsupported source chain ID: ${srcChainId}`);
    if (dstChainId !== ChainIds.TezosGhostnet)
      throw new Error(`Unsupported destination chain ID: ${dstChainId}`);

    if (srcChainId === ChainIds.Ethereum) {
      const srcToken = this.evmChainAccount.getToken(srcTokenSymbol);
      if (!srcToken) {
        throw new Error(`Source token ${srcTokenSymbol} not found`);
      }

      const dstToken = this.tezosChainAccount.getToken(dstTokenSymbol);
      if (!dstToken) {
        throw new Error(`Destination token ${dstTokenSymbol} not found`);
      }

      return this.createOrderFromEvm(srcAmount, srcToken, dstAmount, dstToken);
    }
    else {
      const srcToken = this.tezosChainAccount.getToken(srcTokenSymbol);
      if (!srcToken) {
        throw new Error(`Source token ${srcTokenSymbol} not found`);
      }

      const dstToken = this.evmChainAccount.getToken(dstTokenSymbol);
      if (!dstToken) {
        throw new Error(`Destination token ${dstTokenSymbol} not found`);
      }

      throw new Error(`Cross-chain swaps from Tezos to EVM are not supported yet.`);
    }
  }

  protected async createOrderFromEvm(inputAmount: number, srcToken: Erc20Token, outputAmount: number, dstToken: TezosToken): Promise<SignedCrossChainOrder> {
    const secret = this.createSecret();
    const hashLock = Sdk.HashLock.forSingleFill(secret);
    const makerAddress = await this.evmChainAccount.getAddress();
    const srcChainId = ChainIds.Ethereum;
    const dstChainId = ChainIds.TezosGhostnet;

    const order: CrossChainOrder = {
      escrowFactory: config.evmChain.escrowFactoryAddress,
      orderInfo: {
        salt: Sdk.randBigInt(1000n),
        maker: makerAddress,
        makingAmount: parseUnits(inputAmount.toString(), srcToken.decimals),
        takingAmount: parseUnits(outputAmount.toString(), dstToken.decimals),
        makerAsset: {
          address: srcToken.address,
        },
        takerAsset: {
          address: dstToken.address,
          tokenId: dstToken.tokenId,
        },
      },
      escrowParams: {
        hashLock: hashLock.toString(),
        srcChainId,
        dstChainId,
        srcSafetyDeposit: parseEther('0.001'),
        dstSafetyDeposit: parseUnits('0.001', 6),
        timeLocks: {
          srcWithdrawal: 0n, // no finality lock for test
          srcPublicWithdrawal: 120n, // 2m for private withdrawal
          srcCancellation: 121n, // 1sec public withdrawal
          srcPublicCancellation: 122n, // 1sec private cancellation
          dstWithdrawal: 0n, // no finality lock for test
          dstPublicWithdrawal: 100n, // 100sec private withdrawal
          dstCancellation: 101n, // 1sec public withdrawal
        },
      },
      extra: {
        nonce: Sdk.randBigInt(UINT_40_MAX),
        allowPartialFills: false,
        allowMultipleFills: false,
      },
    };
    const sdkOrder = this.createSdkCrossChainOrder(order);
    const signature = await this.signOrderFromEvm(sdkOrder);
    const orderHash = sdkOrder.getOrderHash(srcChainId);

    return {
      order,
      signature,
      orderHash,
    };
  }

  protected createSecret(): string {
    return uint8ArrayToHex(randomBytes(32));
  }

  private createSdkCrossChainOrder(order: CrossChainOrder): Sdk.CrossChainOrder {
    return Sdk.CrossChainOrder.new(
      new Sdk.Address(order.escrowFactory),
      {
        salt: order.orderInfo.salt,
        maker: new Sdk.Address(order.orderInfo.maker),
        makingAmount: order.orderInfo.makingAmount,
        takingAmount: order.orderInfo.takingAmount,
        makerAsset: new Sdk.Address(order.orderInfo.makerAsset.address),
        takerAsset: new Sdk.Address(tezosChainHelpers.mapTezosTokenAddressToEvmAddress(order.orderInfo.takerAsset.address, order.orderInfo.takerAsset.tokenId)),
      },
      {
        hashLock: Sdk.HashLock.fromString(order.escrowParams.hashLock),
        srcChainId: order.escrowParams.srcChainId === ChainIds.Ethereum ? Sdk.NetworkEnum.ETHEREUM : Sdk.NetworkEnum.SONIC,
        dstChainId: order.escrowParams.dstChainId === ChainIds.Ethereum ? Sdk.NetworkEnum.ETHEREUM : Sdk.NetworkEnum.SONIC,
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
        auction: new Sdk.AuctionDetails({
          initialRateBump: 0,
          points: [],
          duration: 120n,
          startTime: BigInt(Math.floor(Date.now() / 1000)),
        }),
        whitelist: [
          {
            address: new Sdk.Address(config.evmChain.resolverAddress),
            allowFrom: 0n,
          },
        ],
        resolvingStartTime: 0n,
      }
    );
  }

  private signOrderFromEvm(order: Sdk.CrossChainOrder): Promise<string> {
    const typedData = order.getTypedData(ChainIds.Ethereum);

    return this.evmChainAccount.signer.signTypedData(
      typedData.domain,
      { Order: typedData.types[typedData.primaryType]! },
      typedData.message
    );
  }
}
