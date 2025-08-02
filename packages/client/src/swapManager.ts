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

import type { ResolverService } from './resolverService.js';
import config from './config.js';

interface SwapManagerOptions {
  evmChainAccount: EvmChainAccount;
  tezosChainAccount: TezosChainAccount;
  resolverService: ResolverService;
}

interface Order {
  order: SignedCrossChainOrder;
  secret: string;
  status: 'created' | 'sent' | 'withdrawn' | 'cancelled' | 'failed';
}

const TezosGhostnetSdkChainId = Sdk.NetworkEnum.BINANCE;

export class SwapManager {
  private readonly _orders: Order[] = [];

  private readonly evmChainAccount: EvmChainAccount;
  private readonly tezosChainAccount: TezosChainAccount;
  private readonly resolverService: ResolverService;

  constructor(options: SwapManagerOptions) {
    this.evmChainAccount = options.evmChainAccount;
    this.tezosChainAccount = options.tezosChainAccount;
    this.resolverService = options.resolverService;
  }

  get orders(): readonly Order[] {
    return this._orders;
  }

  async createOrder(srcAmount: number, srcChainId: ChainId, srcTokenSymbol: string, dstAmount: number, dstChainId: ChainId, dstTokenSymbol: string): Promise<Order> {
    let crossChainOrder: SignedCrossChainOrder;
    let secret: string;

    if (srcChainId !== ChainIds.Ethereum && srcChainId !== ChainIds.TezosGhostnet)
      throw new Error(`Unsupported source chain ID: ${srcChainId}`);
    if (dstChainId !== ChainIds.TezosGhostnet && dstChainId !== ChainIds.Ethereum)
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

      [crossChainOrder, secret] = await this.createCrossChainOrderFromEvm(srcAmount, srcToken, dstAmount, dstToken);
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

      [crossChainOrder, secret] = await this.createCrossChainOrderFromTezos(srcAmount, srcToken, dstAmount, dstToken);
    }

    const order: Order = {
      order: crossChainOrder,
      secret,
      status: 'created',
    };
    this._orders.push(order);

    return order;
  }

  async sendOrder(order: Order) {
    try {
      const result = await this.resolverService.placeOrder(order.order);
      order.status = 'sent';
      return result;
    }
    catch (error) {
      order.status = 'failed';
      throw error;
    }
  }

  async withdrawOrder(order: Order) {
    try {
      const result = await this.resolverService.withdraw(order.order.orderHash, order.secret);
      order.status = 'withdrawn';
      return result;
    }
    catch (error) {
      order.status = 'failed';
      throw error;
    }
  }

  protected async createCrossChainOrderFromEvm(inputAmount: number, srcToken: Erc20Token, outputAmount: number, dstToken: TezosToken): Promise<[order: SignedCrossChainOrder, secret: string]> {
    const secret = this.createSecret();
    const hashLock = Sdk.HashLock.forSingleFill(secret);
    const makerAddress = await this.evmChainAccount.getAddress();
    const srcChainId = ChainIds.Ethereum;
    const dstChainId = ChainIds.TezosGhostnet;
    const orderTimestamp = BigInt((await this.evmChainAccount.provider.getBlock('latest'))!.timestamp);

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
      details: {
        auction: {
          initialRateBump: 0,
          points: [],
          duration: 120n,
          startTime: orderTimestamp,
        },
        whitelist: [
          {
            address: config.evmChain.resolverAddress,
            allowFrom: 0n,
          },
        ],
        resolvingStartTime: 0n,
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

    return [
      {
        order,
        signature,
        orderHash,
      },
      secret,
    ];
  }

  protected async createCrossChainOrderFromTezos(inputAmount: number, srcToken: TezosToken, outputAmount: number, dstToken: Erc20Token): Promise<[order: SignedCrossChainOrder, secret: string]> {
    const secret = this.createSecret();
    const hashLock = Sdk.HashLock.forSingleFill(secret);
    const makerAddress = await this.tezosChainAccount.getAddress();
    const srcChainId = ChainIds.TezosGhostnet;
    const dstChainId = ChainIds.Ethereum;
    const orderTimestamp = BigInt(Math.floor(new Date((await this.tezosChainAccount.tezosToolkit.rpc.getBlock()).header.timestamp).getTime() / 1000));

    const order: CrossChainOrder = {
      escrowFactory: config.tezosChain.escrowFactoryAddress,
      orderInfo: {
        salt: Sdk.randBigInt(1000n),
        maker: makerAddress,
        makingAmount: parseUnits(inputAmount.toString(), srcToken.decimals),
        takingAmount: parseUnits(outputAmount.toString(), dstToken.decimals),
        makerAsset: {
          address: srcToken.address,
          tokenId: srcToken.tokenId,
        },
        takerAsset: {
          address: dstToken.address,
        },
      },
      escrowParams: {
        hashLock: hashLock.toString(),
        srcChainId,
        dstChainId,
        srcSafetyDeposit: parseUnits('0.001', 6),
        dstSafetyDeposit: parseEther('0.001'),
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
      details: {
        auction: {
          initialRateBump: 0,
          points: [],
          duration: 120n,
          startTime: orderTimestamp,
        },
        whitelist: [
          {
            address: config.tezosChain.resolverAddress,
            allowFrom: 0n,
          },
        ],
        resolvingStartTime: 0n,
      },
      extra: {
        nonce: Sdk.randBigInt(UINT_40_MAX),
        allowPartialFills: false,
        allowMultipleFills: false,
      },
    };
    const sdkOrder = this.createSdkCrossChainOrder(order);
    const signature = await this.signOrderFromEvm(sdkOrder);
    const orderHash = sdkOrder.getOrderHash(TezosGhostnetSdkChainId);

    return [
      {
        order,
        signature,
        orderHash,
      },
      secret,
    ];
  }

  protected createSecret(): string {
    return uint8ArrayToHex(randomBytes(32));
  }

  private createSdkCrossChainOrder(order: CrossChainOrder): Sdk.CrossChainOrder {
    return Sdk.CrossChainOrder.new(
      new Sdk.Address(order.escrowFactory),
      {
        salt: order.orderInfo.salt,
        maker: order.escrowParams.srcChainId === ChainIds.Ethereum
          ? new Sdk.Address(order.orderInfo.maker)
          : new Sdk.Address(tezosChainHelpers.mapTezosAddressToEvmAddress(order.orderInfo.maker)),
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
        srcChainId: order.escrowParams.srcChainId === ChainIds.Ethereum ? Sdk.NetworkEnum.ETHEREUM : TezosGhostnetSdkChainId,
        dstChainId: order.escrowParams.dstChainId === ChainIds.Ethereum ? Sdk.NetworkEnum.ETHEREUM : TezosGhostnetSdkChainId,
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
