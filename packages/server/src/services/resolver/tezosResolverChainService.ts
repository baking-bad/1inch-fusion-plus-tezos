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
    const escrowFactoryContract = await this.getEscrowFactoryContract();

    const params = {
      order_hash: immutables.orderHash.replace('0x', ''), // Remove 0x prefix for bytes
      hashlock: immutables.hashLock.replace('0x', ''), // Remove 0x prefix for bytes
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
      timelocks: {
        src_withdrawal: immutables.timeLocks.srcWithdrawal.toString(),
        src_public_withdrawal: immutables.timeLocks.srcPublicWithdrawal.toString(),
        src_cancellation: immutables.timeLocks.srcCancellation.toString(),
        src_public_cancellation: immutables.timeLocks.srcPublicCancellation.toString(),
        dst_withdrawal: immutables.timeLocks.dstWithdrawal.toString(),
        dst_public_withdrawal: immutables.timeLocks.dstPublicWithdrawal.toString(),
        dst_cancellation: immutables.timeLocks.dstCancellation.toString(),
        // deployed_at: immutables.timeLocks.deployedAt?.toString(),
      },
    } as const;

    const operation = escrowFactoryContract.methodsObject.deploy_src!(params);
    const tx = await operation.send({
      amount: Number(immutables.safetyDeposit.toString()) / 1_000_000,
    });
    await tx.confirmation(1);

    console.dir(tx, { depth: null });

    return [
      {
        hash: tx.hash,
        block: tx.includedInBlock.toString(),
        timestamp: this.getCurrentOperationTimestamp(),
      },
      'tz1-src-escrow-address',
    ];
  }

  async deployDst(immutables: Immutables): Promise<readonly [tx: Transaction, escrowAddress: string]> {
    await utils.wait(1000);

    return [
      {
        hash: 'o1-dst',
        block: 'b1-dst',
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
      },
      'tz1-dst-escrow-address',
    ];
  }

  async withdraw(escrowAddress: string, secret: string, immutables: Immutables): Promise<Transaction> {
    await utils.wait(1000);

    return {
      hash: 'o1-withdraw',
      block: 'b1-withdraw',
      timestamp: BigInt(Math.floor(Date.now() / 1000)),
    };
  }

  async cancel(escrowAddress: string, immutables: Immutables): Promise<Transaction> {
    await utils.wait(1000);

    return {
      hash: 'o1-cancel',
      block: 'b1-cancel',
      timestamp: BigInt(Math.floor(Date.now() / 1000)),
    };
  }

  private getEscrowFactoryContract() {
    return this.tezosChainAccount.tezosToolkit.contract.at(this.escrowFactoryAddress);
  }

  protected getCurrentOperationTimestamp() {
    return BigInt(Math.floor(Date.now() / 1000));
  }
}
