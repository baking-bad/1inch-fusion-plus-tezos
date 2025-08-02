import { Interface, Signature, TransactionRequest } from 'ethers';
import Sdk from '@1inch/cross-chain-sdk';

import { EvmChainAccount } from '@baking-bad/1inch-fusion-plus-common';

import Contract from '../../../../../contracts/evm/compiled/Resolver.sol/Resolver.json' with { type: 'json' };
import { Transaction } from './models.js';

export class EvmResolverChainService {
  private readonly iface = new Interface(Contract.abi);

  constructor(
    private readonly evmChainAccount: EvmChainAccount,
    private readonly resolverContractAddress: string
  ) { }

  async getResolverAddress(): Promise<string> {
    return this.resolverContractAddress;
  }

  public deploySrc(
    chainId: number,
    order: Sdk.CrossChainOrder,
    signature: string,
    takerTraits: Sdk.TakerTraits,
    amount: bigint,
    hashLock = order.escrowExtension.hashLockInfo
  ) {
    const { r, yParityAndS: vs } = Signature.from(signature);
    const { args, trait } = takerTraits.encode();
    const immutables = order.toSrcImmutables(chainId, new Sdk.Address(this.resolverContractAddress), amount, hashLock);

    return this.send({
      to: this.resolverContractAddress,
      data: this.iface.encodeFunctionData('deploySrc', [
        immutables.build(),
        order.build(),
        r,
        vs,
        amount,
        trait,
        args,
      ]),
      value: order.escrowExtension.srcSafetyDeposit,
    });
  }

  public deployDst(
    /**
         * Immutables from SrcEscrowCreated event with complement applied
         */
    immutables: Sdk.Immutables
  ) {
    return this.send({
      to: this.resolverContractAddress,
      data: this.iface.encodeFunctionData('deployDst', [
        immutables.build(),
        immutables.timeLocks.toSrcTimeLocks().privateCancellation,
      ]),
      value: immutables.safetyDeposit,
    });
  }

  public withdraw(
    escrow: string,
    secret: string,
    immutables: Sdk.Immutables
  ) {
    return this.send({
      to: this.resolverContractAddress,
      data: this.iface.encodeFunctionData('withdraw', [escrow, secret, immutables.build()]),
    });
  }

  public cancel(escrow: string, immutables: Sdk.Immutables) {
    return this.send({
      to: this.resolverContractAddress,
      data: this.iface.encodeFunctionData('cancel', [escrow, immutables.build()]),
    });
  }

  protected async send(param: TransactionRequest): Promise<Transaction> {
    const res = await this.evmChainAccount.signer.sendTransaction({
      ...param, gasLimit: 10_000_000,
      from: this.evmChainAccount.getAddress(),
    });
    const receipt = await res.wait(1);

    if (receipt && receipt.status) {
      return {
        hash: receipt.hash,
        timestamp: BigInt((await res.getBlock())!.timestamp),
        block: res.blockHash!,
      };
    }

    throw new Error((await receipt?.getResult()) || 'unknown error');
  }
}
