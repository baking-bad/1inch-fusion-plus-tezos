import { Immutables, TezosChainAccount, utils } from '@baking-bad/1inch-fusion-plus-common';

import type { Transaction } from './models.js';

export class TezosResolverChainService {
  constructor(
    private readonly tezosChainAccount: TezosChainAccount,
    private readonly escrowFactoryAddress: string
  ) { }

  getResolverAddress(): Promise<string> {
    return this.tezosChainAccount.getAddress();
  }

  async deploySrc(immutables: Immutables, signature: string): Promise<readonly [tx: Transaction, escrowAddress: string]> {
    return this.deploy('src', immutables, signature);
  }

  async deployDst(immutables: Immutables): Promise<readonly [tx: Transaction, escrowAddress: string]> {
    return this.deploy('dst', immutables, '');
  }

  async withdraw(escrowAddress: string, secret: string, _immutables: Immutables): Promise<Transaction> {
    const escrowContract = await this.tezosChainAccount.tezosToolkit.contract.at(escrowAddress);
    const params = secret.replace('0x', '');

    const operation = escrowContract.methodsObject.withdraw!(params);
    const tx = await operation.send();
    await tx.confirmation(1);

    return {
      hash: tx.hash,
      block: tx.includedInBlock.toString(),
      timestamp: this.getCurrentOperationTimestamp(),
    };
  }

  async cancel(escrowAddress: string, _immutables: Immutables): Promise<Transaction> {
    const escrowContract = await this.tezosChainAccount.tezosToolkit.contract.at(escrowAddress);

    const operation = escrowContract.methodsObject.cancel!();
    const tx = await operation.send();
    await tx.confirmation(1);

    return {
      hash: tx.hash,
      block: tx.includedInBlock.toString(),
      timestamp: this.getCurrentOperationTimestamp(),
    };
  }

  protected async deploy(side: 'src' | 'dst', immutables: Immutables, signature?: string): Promise<readonly [tx: Transaction, escrowAddress: string]> {
    const escrowFactoryContract = await this.getEscrowFactoryContract();
    const params = this.getDeployParams(immutables, signature);

    const operation = escrowFactoryContract.methodsObject[side === 'src' ? 'deploy_src' : 'deploy_dst']!(params);
    const tx = await operation.send({
      amount: Number(immutables.safetyDeposit.toString()) / 1_000_000,
    });
    await tx.confirmation(1);

    const escrowAddress = (tx.operationResults[0] as any).metadata.internal_operation_results[0].result.originated_contracts[0];

    return [
      {
        hash: tx.hash,
        block: tx.includedInBlock.toString(),
        timestamp: this.getCurrentOperationTimestamp(),
      },
      escrowAddress,
    ];
  }

  private getEscrowFactoryContract() {
    return this.tezosChainAccount.tezosToolkit.contract.at(this.escrowFactoryAddress);
  }

  private getDeployParams(immutables: Immutables, _signature?: string) {
    return {
      order_hash: immutables.orderHash.replace('0x', ''),
      hashlock: immutables.hashLock.replace('0x', ''),
      maker: immutables.maker,
      taker: immutables.taker,
      token: immutables.tokenId
        ? {
          fA2: {
            0: immutables.token,
            1: immutables.tokenId,
          },
        }
        : immutables.token === 'tez'
          ? {
            tEZ: undefined,
          }
          : {
            fA12: immutables.token,
          },
      amount: immutables.amount.toString(),
      safety_deposit: immutables.safetyDeposit.toString(),
      timelocks: this.prepareTimeLocks(immutables.timeLocks),
    } as const;
  }

  protected getCurrentOperationTimestamp() {
    return BigInt(Math.floor(Date.now() / 1000));
  }

  private prepareTimeLocks(timeLocks: Immutables['timeLocks']) {
    return {
      src_withdrawal: timeLocks.srcWithdrawal,
      src_public_withdrawal: timeLocks.srcPublicWithdrawal,
      src_cancellation: timeLocks.srcCancellation,
      src_public_cancellation: timeLocks.srcPublicCancellation,
      dst_withdrawal: timeLocks.dstWithdrawal,
      dst_public_withdrawal: timeLocks.dstPublicWithdrawal,
      dst_cancellation: timeLocks.dstCancellation,
    };
  }
}
