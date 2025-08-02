import { EvmToken, TezosToken } from '../models/tokens.js';

export type AccountBalances<Token extends TezosToken | EvmToken> = Record<Token['symbol'], string>;
export type AccountRawBalances<Token extends TezosToken | EvmToken> = Record<Token['symbol'], bigint>;

export abstract class BalanceProvider<Token extends TezosToken | EvmToken> {
  async getBalances(address: string, tokens: readonly Token[], rawFormat: false): Promise<AccountBalances<Token>>;
  async getBalances(address: string, tokens: readonly Token[], rawFormat: true): Promise<AccountRawBalances<Token>>;
  async getBalances(address: string, tokens: readonly Token[], rawFormat: boolean): Promise<AccountBalances<Token> | AccountRawBalances<Token>> {
    const balances = await this.getBalancesInternal(address, tokens, rawFormat);
    const result: Record<string, string | bigint> = {};
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]!;
      const tokenBalance = balances[i]!;

      result[token.symbol.toLowerCase()] = tokenBalance;
    }

    return result as AccountBalances<Token> | AccountRawBalances<Token>;
  }

  protected abstract getBalancesInternal(address: string, tokens: readonly Token[], rawFormat: boolean): Promise<(string | bigint)[]>;
}
