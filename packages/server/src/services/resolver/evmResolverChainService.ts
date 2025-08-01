import { Interface, Signature, TransactionRequest } from 'ethers';
import Sdk from '@1inch/cross-chain-sdk';

import { EvmChainAccount } from '@baking-bad/1inch-fusion-plus-common';

import Contract from '../../../../../contracts/evm/compiled/Resolver.sol/Resolver.json' with { type: 'json' };

export class EvmResolverChainService {
  private readonly iface = new Interface(Contract.abi);

  constructor(
    private readonly evmChainAccount: EvmChainAccount,
    public readonly resolverContractAddress: string
  ) { }

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
    escrow: Sdk.Address,
    secret: string,
    immutables: Sdk.Immutables
  ) {
    return this.send({
      to: this.resolverContractAddress,
      data: this.iface.encodeFunctionData('withdraw', [escrow.toString(), secret, immutables.build()]),
    });
  }

  public cancel(escrow: Sdk.Address, immutables: Sdk.Immutables) {
    return this.send({
      to: this.resolverContractAddress,
      data: this.iface.encodeFunctionData('cancel', [escrow.toString(), immutables.build()]),
    });
  }

  protected async send(param: TransactionRequest): Promise<{ txHash: string; blockTimestamp: bigint; blockHash: string }> {
    const res = await this.evmChainAccount.signer.sendTransaction({ ...param, gasLimit: 10_000_000, from: this.evmChainAccount.getAddress() });
    const receipt = await res.wait(1);

    if (receipt && receipt.status) {
      return {
        txHash: receipt.hash,
        blockTimestamp: BigInt((await res.getBlock())!.timestamp),
        blockHash: res.blockHash as string,
      };
    }

    throw new Error((await receipt?.getResult()) || 'unknown error');
  }
}
