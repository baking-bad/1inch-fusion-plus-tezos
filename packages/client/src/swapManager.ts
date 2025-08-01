import { randomBytes } from 'node:crypto';

import Sdk from '@1inch/cross-chain-sdk';
import { uint8ArrayToHex, UINT_40_MAX } from '@1inch/byte-utils';
import { keccak256, parseEther, parseUnits } from 'ethers';

import type { EvmChainAccount, TezosChainAccount, TezosToken, Erc20Token } from '@baking-bad/1inch-fusion-plus-common';

import config from './config.js';

export class SwapManager {
  constructor(private readonly evmChainAccount: EvmChainAccount, private readonly tezosChainAccount: TezosChainAccount) { }

  async createEvmOrder(inputAmount: number, srcToken: Erc20Token, outputAmount: number, dstToken: TezosToken) {
    const secret = uint8ArrayToHex(randomBytes(32));
    const hashLock = Sdk.HashLock.forSingleFill(secret);
    const makerAddress = await this.evmChainAccount.getAddress();

    const order = Sdk.CrossChainOrder.new(
      new Sdk.Address(config.evmChain.escrowFactoryAddress),
      {
        salt: Sdk.randBigInt(1000n),
        maker: new Sdk.Address(makerAddress),
        makingAmount: parseUnits(inputAmount.toString(), srcToken.decimals),
        takingAmount: parseUnits(outputAmount.toString(), dstToken.decimals),
        makerAsset: new Sdk.Address(srcToken.address),
        takerAsset: new Sdk.Address(this.tezosAddressToEvmAddress(dstToken.address)),
      },
      {
        hashLock,
        timeLocks: Sdk.TimeLocks.new({
          srcWithdrawal: 0n, // no finality lock for test
          srcPublicWithdrawal: 120n, // 2m for private withdrawal
          srcCancellation: 121n, // 1sec public withdrawal
          srcPublicCancellation: 122n, // 1sec private cancellation
          dstWithdrawal: 0n, // no finality lock for test
          dstPublicWithdrawal: 100n, // 100sec private withdrawal
          dstCancellation: 101n, // 1sec public withdrawal
        }),
        srcChainId: config.evmChain.chainId,
        // TODO: tezos does not have chainId, use random supported chainId
        dstChainId: 146,
        srcSafetyDeposit: parseEther('0.001'),
        dstSafetyDeposit: parseUnits('0.001', 6),
      },
      {
        auction: new Sdk.AuctionDetails({
          initialRateBump: 0,
          points: [],
          duration: 120n,
          startTime: BigInt((await this.evmChainAccount.provider.getBlock('latest'))!.timestamp),
        }),
        whitelist: [
          {
            address: new Sdk.Address(this.tezosAddressToEvmAddress(config.tezosChain.resolverAddress)),
            allowFrom: 0n,
          },
        ],
        resolvingStartTime: 0n,
      },
      {
        nonce: Sdk.randBigInt(UINT_40_MAX),
        allowPartialFills: false,
        allowMultipleFills: false,
      }
    );

    const signature = await this.signEvmOrder(order);
    const orderHash = order.getOrderHash(this.evmChainAccount.chainId);

    return {
      order,
      signature,
      orderHash,
    };
  }

  private signEvmOrder(order: Sdk.CrossChainOrder): Promise<string> {
    const typedData = order.getTypedData(this.evmChainAccount.chainId);

    return this.evmChainAccount.signer.signTypedData(
      typedData.domain,
      { Order: typedData.types[typedData.primaryType]! },
      typedData.message
    );
  }

  private tezosAddressToEvmAddress(tezosAddress: string): string {
    const hash = keccak256(Buffer.from(tezosAddress));
    return '0x' + hash.slice(-40);
  }
}
