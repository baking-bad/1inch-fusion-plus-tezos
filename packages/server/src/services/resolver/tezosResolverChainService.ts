import { Immutables, TezosChainAccount, utils } from '@baking-bad/1inch-fusion-plus-common';

import type { Transaction } from './models.js';

const oneWeekInSeconds = 7n * 24n * 60n * 60n; // 7 days in seconds

export class TezosResolverChainService {
  constructor(
    private readonly tezosChainAccount: TezosChainAccount,
    private readonly escrowFactoryAddress: string
  ) { }

  getResolverAddress(): Promise<string> {
    return this.tezosChainAccount.getAddress();
  }

  async deploySrc(immutables: Immutables, signature: string): Promise<readonly [tx: Transaction, escrowAddress: string]> {
    const escrowFactoryContract = await this.getEscrowFactoryContract();
    const params = {
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

    const operation = escrowFactoryContract.methodsObject.deploy_src!(params);
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

  async deployDst(immutables: Immutables): Promise<readonly [tx: Transaction, escrowAddress: string]> {
    await utils.wait(1000);

    return [
      {
        hash: 'o1-dst',
        block: 'b1-dst',
        timestamp: this.getCurrentOperationTimestamp(),
      },
      'tz1-dst-escrow-address',
    ];
  }

  async withdraw(escrowAddress: string, secret: string, immutables: Immutables): Promise<Transaction> {
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

  async cancel(escrowAddress: string, immutables: Immutables): Promise<Transaction> {
    await utils.wait(1000);

    return {
      hash: 'o1-cancel',
      block: 'b1-cancel',
      timestamp: this.getCurrentOperationTimestamp(),
    };
  }

  private getEscrowFactoryContract() {
    return this.tezosChainAccount.tezosToolkit.contract.at(this.escrowFactoryAddress);
  }

  protected getCurrentOperationTimestamp() {
    return BigInt(Math.floor(Date.now() / 1000));
  }

  private prepareTimeLockValue(value: bigint, deployedAt: bigint): string {
    return ((deployedAt + (value || oneWeekInSeconds)) * 1000n).toString();
  }

  private prepareTimeLocks(timeLocks: Immutables['timeLocks']) {
    const deployedAt = timeLocks.deployedAt ? timeLocks.deployedAt : this.getCurrentOperationTimestamp();

    return {
      src_withdrawal: this.prepareTimeLockValue(timeLocks.srcWithdrawal, deployedAt),
      src_public_withdrawal: this.prepareTimeLockValue(timeLocks.srcPublicWithdrawal, deployedAt),
      src_cancellation: this.prepareTimeLockValue(timeLocks.srcCancellation, deployedAt),
      src_public_cancellation: this.prepareTimeLockValue(timeLocks.srcPublicCancellation, deployedAt),
      dst_withdrawal: this.prepareTimeLockValue(timeLocks.dstWithdrawal, deployedAt),
      dst_public_withdrawal: this.prepareTimeLockValue(timeLocks.dstPublicWithdrawal, deployedAt),
      dst_cancellation: this.prepareTimeLockValue(timeLocks.dstCancellation, deployedAt),
      // deployed_at: deployedAt.toString(),
    };
  }
}
