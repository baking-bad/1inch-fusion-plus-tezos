import type { Erc20Token, TezosToken } from './models/index.js';

export const ethereumTokens = new Map<string, Erc20Token>(([
  {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    decimals: 6,
  },
] satisfies Erc20Token[]).map(token => [token.symbol.toLowerCase(), token]));

export const ethereumTokenDonors = new Map<string, string>([
  ['native', '0xf977814e90da44bfa03b6295a0616a897441acec'],
  ['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', '0xd54F23BE482D9A58676590fCa79c8E43087f92fB'],
]);

export const tezosTokens = new Map<string, TezosToken>(([
  {
    address: 'KT1V2ak1MfNd3w4oyKD64ehYU7K4CrpUcDGR',
    type: 'FA2',
    symbol: 'USDT',
    tokenId: '0',
    decimals: 6,
  },
] satisfies TezosToken[]).map(token => [token.symbol.toLowerCase(), token]));
