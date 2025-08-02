import { Contract, formatUnits, JsonRpcProvider } from 'ethers';

import { EvmToken } from '../models/tokens.js';
import { BalanceProvider } from './balanceProvider.js';
import ERC20 from '../../../../contracts/evm/compiled/IERC20.sol/IERC20.json' with { type: 'json' };

export class EvmBalanceProvider extends BalanceProvider<EvmToken> {
  constructor(private readonly rpcProvider: JsonRpcProvider) {
    super();
  }

  protected getBalancesInternal(address: string, tokens: readonly EvmToken[], rawFormat: boolean): Promise<(string | bigint)[]> {
    const balancePromises = tokens
      .map(async token => {
        let rawBalance: bigint;
        if (token.type === 'native') {
          rawBalance = await this.rpcProvider.getBalance(address);
        }
        else {
          const tokenContract = new Contract(token.address.toString(), ERC20.abi, this.rpcProvider);
          rawBalance = await tokenContract.balanceOf!(address);
        }

        return rawFormat ? rawBalance : formatUnits(rawBalance, token.decimals);
      });

    return Promise.all(balancePromises);
  }
}
