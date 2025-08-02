import { TezosToolkit } from '@taquito/taquito';
import { formatUnits } from 'ethers';

import { TezosFa2Token, TezosFaToken, TezosToken } from '../models/tokens.js';
import { BalanceProvider } from './balanceProvider.js';
import { utils } from '../utils/index.js';

interface TzktTokenBalanceDto {
  id: number;
  balance?: string | null;
  transfersCount: number;
  firstLevel: number;
  firstTime: string;
  lastLevel: number;
  lastTime: string;
};

export class TezosBalanceProvider extends BalanceProvider<TezosToken> {
  private readonly tzktApiBaseUrl: string;

  constructor(private readonly tezosToolkit: TezosToolkit, tzktApiBaseUrl: string) {
    super();

    this.tzktApiBaseUrl = utils.textUtils.trimSlashes(tzktApiBaseUrl);
  }

  protected getBalancesInternal(address: string, tokens: readonly TezosToken[], rawFormat: boolean): Promise<(string | bigint)[]> {
    const balancePromises = tokens
      .map(async token => {
        let rawBalance: bigint;
        if (token.type === 'native') {
          rawBalance = BigInt((await this.tezosToolkit.tz.getBalance(address)).toFixed());
        }
        else {
          rawBalance = await this.getFa2TokenBalanceUsingTzKT(address, token);
        }

        return rawFormat ? rawBalance : formatUnits(rawBalance, token.decimals);
      });

    return Promise.all(balancePromises);
  }

  private async getFa2TokenBalanceUsingTzKT(address: string, token: TezosFaToken): Promise<bigint> {
    const queryParams = new URLSearchParams({
      'account': address,
      'token.contract': token.address,
      'token.tokenId': (token as TezosFa2Token).tokenId || '0',
    });
    const queryParamsString = decodeURIComponent(queryParams.toString());
    const url = `${this.tzktApiBaseUrl}/v1/tokens/balances?${queryParamsString}`;
    const response = await fetch(
      url,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const content = await response.text();
      throw new Error(`Failed to fetch token balance: ${response.status} - ${content}`);
    }

    const data: TzktTokenBalanceDto[] = await response.json() as any;
    const tokenBalance = data[0]?.balance;

    return tokenBalance ? BigInt(tokenBalance) : 0n;
  }
}
