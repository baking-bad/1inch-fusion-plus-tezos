import Sdk from '@1inch/cross-chain-sdk';

import { ChainIds, mappers, tezosChainHelpers, type EvmChainAccount, type SignedCrossChainOrder, type TezosChainAccount } from '@baking-bad/1inch-fusion-plus-common';

import type { OrderContext } from './orderContext.js';
import { EvmResolverChainService } from './evmResolverChainService.js';
import { TezosResolverChainService } from './tezosResolverChainService.js';
import { EvmEscrowFactory } from './evmEscrowFactory.js';

export interface ResolverOptions {
  evmEscrowFactoryAddress: string;
  evmResolverContractAddress: string;
  tezosEscrowFactoryAddress: string;
  evmChainAccount: EvmChainAccount;
  tezosChainAccount: TezosChainAccount;
}

interface StartSwapResult {
  srcEscrowTx: string;
  srcEscrowAddress: string;
  dstEscrowTx: string;
  dstEscrowAddress: string;
}

interface FinalizeSwapResult {
  srcWithdrawalTx: string;
  dstWithdrawalTx: string;
}

export class Resolver {
  protected readonly orders: Map<string, OrderContext> = new Map();
  protected readonly evmEscrowFactory: EvmEscrowFactory;
  protected readonly evmChainAccount: EvmChainAccount;
  protected readonly tezosChainAccount: TezosChainAccount;
  protected readonly evmResolverChainService: EvmResolverChainService;
  protected readonly tezosResolverChainService: TezosResolverChainService;

  constructor(options: ResolverOptions) {
    this.evmChainAccount = options.evmChainAccount;
    this.tezosChainAccount = options.tezosChainAccount;
    this.evmEscrowFactory = new EvmEscrowFactory(options.evmChainAccount.provider, options.evmEscrowFactoryAddress);
    this.evmResolverChainService = new EvmResolverChainService(options.evmChainAccount, options.evmResolverContractAddress);
    this.tezosResolverChainService = new TezosResolverChainService(options.tezosChainAccount);
  }

  canSwap(_order: SignedCrossChainOrder): boolean {
    // TODO: Check user balances and other conditions
    return true;
  }

  async startSwap(order: SignedCrossChainOrder): Promise<StartSwapResult> {
    if (!this.canSwap(order)) {
      throw new Error('Cannot swap: conditions not met');
    }
    const [evmResolverOwnerAddress, tezosResolverOwnerAddress] = await Promise.all([
      this.evmChainAccount.getAddress(),
      this.tezosChainAccount.getAddress(),
    ]);

    if (order.order.escrowParams.srcChainId === ChainIds.Ethereum && order.order.escrowParams.dstChainId === ChainIds.TezosGhostnet) {
      console.log('Starting swap from Ethereum to Tezos...');
      console.log('Order:');
      console.dir(order, { depth: null });

      const sdkOrder = mappers.sdk.mapOrderToSdkCrossChainOrder(order.order);
      const sdkOrderHash = sdkOrder.getOrderHash(ChainIds.Ethereum);
      if (order.orderHash !== sdkOrderHash) {
        throw new Error(`Order hash mismatch: expected ${order.orderHash}, got ${sdkOrderHash}`);
      }

      const ethereumEscrowDeployTxResult = await this.evmResolverChainService.deploySrc(
        order.order.escrowParams.srcChainId,
        sdkOrder,
        order.signature,
        Sdk.TakerTraits.default()
          .setExtension(sdkOrder.extension)
          .setAmountMode(Sdk.AmountMode.maker)
          .setAmountThreshold(sdkOrder.takingAmount),
        order.order.orderInfo.makingAmount
      );

      console.log('Ethereum escrow deployed:', ethereumEscrowDeployTxResult);

      const srcEscrowEvent = await this.evmEscrowFactory.getSrcDeployEvent(ethereumEscrowDeployTxResult.blockHash);
      const sdkSrcImmutables = srcEscrowEvent[0];
      const srcImmutables = mappers.sdk.mapSdkImmutablesToImmutables(sdkSrcImmutables);

      const tezosResolverOwnerAddressEvmStyle = tezosChainHelpers.mapTezosAddressToEvmAddress(tezosResolverOwnerAddress);
      console.log('Tezos resolver owner address (EVM style):', tezosResolverOwnerAddress, ' -> ', tezosResolverOwnerAddressEvmStyle);
      const sdkDstImmutables = sdkSrcImmutables
        .withComplement(srcEscrowEvent[1])
        .withTaker(new Sdk.Address(tezosResolverOwnerAddressEvmStyle));
      const dstImmutables = mappers.sdk.mapSdkImmutablesToImmutables(sdkDstImmutables);
      const tezosEscrowDeployTxResult = await this.tezosResolverChainService.deployDst(dstImmutables);

      console.debug('Src Immutables:', srcImmutables);
      console.dir(sdkSrcImmutables, { depth: null });
      console.debug('Dst Immutables:', dstImmutables);
      console.dir(sdkDstImmutables, { depth: null });

      console.log('Tezos escrow deployed:', tezosEscrowDeployTxResult);

      const srcEscrowImplementationAddress = await this.evmEscrowFactory.getSourceImpl();
      const srcEscrowAddress = new Sdk.EscrowFactory(new Sdk.Address(this.evmEscrowFactory.address)).getSrcEscrowAddress(
        srcEscrowEvent[0],
        srcEscrowImplementationAddress
      ).toString();
      const dstEscrowAddress = 'TODO: Tezos';

      const orderContext: OrderContext = {
        order,
        srcImmutables: srcImmutables,
        dstImmutables: dstImmutables,
        srcEscrowDeployedTimestamp: ethereumEscrowDeployTxResult.blockTimestamp,
        dstEscrowDeployedTimestamp: 0n,
        srcEscrowAddress,
        dstEscrowAddress,
      };

      this.orders.set(order.orderHash, orderContext);

      return {
        srcEscrowTx: ethereumEscrowDeployTxResult.txHash,
        srcEscrowAddress,
        dstEscrowAddress,
        dstEscrowTx: tezosEscrowDeployTxResult,
      };
    }
    else if (order.order.escrowParams.srcChainId === ChainIds.TezosGhostnet && order.order.escrowParams.dstChainId === ChainIds.Ethereum) {
      console.debug('Starting swap from Tezos to Ethereum...');
      console.debug('Order:');
      console.dir(order, { depth: null });

      throw new Error('Tezos to Ethereum swap is not supported yet');
    }

    throw new Error(`Unsupported chain combination: ${order.order.escrowParams.srcChainId} to ${order.order.escrowParams.dstChainId}`);
  }

  async finalizeSwap(orderHash: SignedCrossChainOrder['orderHash'], secret: string): Promise<FinalizeSwapResult> {
    const orderContext = this.orders.get(orderHash);
    if (!orderContext) {
      throw new Error(`Order not found: ${orderHash}`);
    }

    if (orderContext.order.order.escrowParams.srcChainId === ChainIds.Ethereum && orderContext.order.order.escrowParams.dstChainId === ChainIds.TezosGhostnet) {
      console.log('Finalizing swap from Ethereum to Tezos...');

      const sdkSrcImmutables = mappers.sdk.mapImmutablesToSdkImmutables(orderContext.srcImmutables);
      const sdkDstImmutables = mappers.sdk.mapImmutablesToSdkImmutables(orderContext.dstImmutables);
      console.debug('Src Immutables:', orderContext.srcImmutables);
      console.dir(sdkSrcImmutables, { depth: null });
      console.debug('Dst Immutables:', orderContext.dstImmutables);
      console.dir(sdkDstImmutables, { depth: null });

      const srcWithdrawalResult = await this.evmResolverChainService.withdraw(
        orderContext.srcEscrowAddress,
        secret,
        sdkSrcImmutables
      );
      console.log('Ethereum withdrawal completed:', srcWithdrawalResult);

      return {
        srcWithdrawalTx: srcWithdrawalResult.txHash,
        dstWithdrawalTx: 'TODO: Tezos withdrawal',
      };
    }
    else if (orderContext.order.order.escrowParams.srcChainId === ChainIds.TezosGhostnet && orderContext.order.order.escrowParams.dstChainId === ChainIds.Ethereum) {
      throw new Error('Tezos to Ethereum swap is not supported yet');
    }

    throw new Error(`Unsupported chain combination: ${orderContext.order.order.escrowParams.srcChainId} to ${orderContext.order.order.escrowParams.dstChainId}`);
  }

  async cancelSwap(orderHash: SignedCrossChainOrder['orderHash']): Promise<void> {
  }
}
