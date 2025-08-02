import Sdk from '@1inch/cross-chain-sdk';

import { ChainIds, mappers, tezosChainHelpers, type EvmChainAccount, type SignedCrossChainOrder, type TezosChainAccount } from '@baking-bad/1inch-fusion-plus-common';

import type { FinalizeSwapResult, OrderContext, StartSwapResult } from './models.js';
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

      const srcEscrowDeploymentTx = await this.evmResolverChainService.deploySrc(
        order.order.escrowParams.srcChainId,
        sdkOrder,
        order.signature,
        Sdk.TakerTraits.default()
          .setExtension(sdkOrder.extension)
          .setAmountMode(Sdk.AmountMode.maker)
          .setAmountThreshold(sdkOrder.takingAmount),
        order.order.orderInfo.makingAmount
      );

      console.log('Ethereum escrow deployed:', srcEscrowDeploymentTx);

      const srcEscrowEvent = await this.evmEscrowFactory.getSrcDeployEvent(srcEscrowDeploymentTx.block);
      const sdkSrcImmutables = srcEscrowEvent[0];
      const srcImmutables = mappers.sdk.mapSdkImmutablesToImmutables(sdkSrcImmutables);

      const tezosResolverOwnerAddressEvmStyle = tezosChainHelpers.mapTezosAddressToEvmAddress(tezosResolverOwnerAddress);
      console.debug('Tezos resolver owner address (EVM style):', tezosResolverOwnerAddress, ' -> ', tezosResolverOwnerAddressEvmStyle);
      const sdkDstImmutables = sdkSrcImmutables
        .withComplement(srcEscrowEvent[1])
        .withTaker(new Sdk.Address(tezosResolverOwnerAddressEvmStyle));
      const dstImmutables = mappers.sdk.mapSdkImmutablesToImmutables(sdkDstImmutables);
      const [dstEscrowDeploymentTx, dstEscrowAddress] = await this.tezosResolverChainService.deployDst(dstImmutables);
      console.log('Tezos escrow deployed:', dstEscrowDeploymentTx);

      console.debug('Src Immutables:', srcImmutables);
      console.dir(sdkSrcImmutables, { depth: null });
      console.debug('Dst Immutables:', dstImmutables);
      console.dir(sdkDstImmutables, { depth: null });

      const srcEscrowImplementationAddress = await this.evmEscrowFactory.getSourceImpl();
      const srcEscrowAddress = new Sdk.EscrowFactory(new Sdk.Address(this.evmEscrowFactory.address)).getSrcEscrowAddress(
        srcEscrowEvent[0],
        srcEscrowImplementationAddress
      ).toString();

      const orderContext: OrderContext = {
        order,
        srcImmutables: srcImmutables,
        dstImmutables: dstImmutables,
        srcEscrowDeploymentTx,
        dstEscrowDeploymentTx,
        srcEscrowAddress,
        dstEscrowAddress,
      };

      this.orders.set(order.orderHash, orderContext);

      return {
        srcEscrowDeploymentTx: srcEscrowDeploymentTx,
        srcEscrowAddress,
        dstEscrowAddress,
        dstEscrowDeploymentTx: dstEscrowDeploymentTx,
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

      const dstWithdrawalResult = await this.tezosResolverChainService.withdraw(
        orderContext.dstEscrowAddress,
        secret,
        orderContext.dstImmutables
      );
      console.log('Tezos withdrawal completed:', dstWithdrawalResult);

      const srcWithdrawalResult = await this.evmResolverChainService.withdraw(
        orderContext.srcEscrowAddress,
        secret,
        sdkSrcImmutables
      );
      console.log('Ethereum withdrawal completed:', srcWithdrawalResult);

      return {
        srcWithdrawalTx: srcWithdrawalResult,
        dstWithdrawalTx: dstWithdrawalResult,
      };
    }
    else if (orderContext.order.order.escrowParams.srcChainId === ChainIds.TezosGhostnet && orderContext.order.order.escrowParams.dstChainId === ChainIds.Ethereum) {
      throw new Error('Tezos to Ethereum swap is not supported yet');
    }

    throw new Error(`Unsupported chain combination: ${orderContext.order.order.escrowParams.srcChainId} to ${orderContext.order.order.escrowParams.dstChainId}`);
  }

  async cancelSwap(orderHash: SignedCrossChainOrder['orderHash']): Promise<void> {
    throw new Error('Cancel swap is not implemented yet');
  }
}
