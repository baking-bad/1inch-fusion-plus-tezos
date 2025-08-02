import type { Erc20Token, EvmToken, NativeEvmToken, TezosFa12Token, TezosNativeToken, TezosToken } from './models/index.js';

export const ethereumTokens = {
  eth: {
    type: 'native',
    symbol: 'ETH',
    decimals: 18,
  } as const satisfies NativeEvmToken,
  usdc: {
    type: 'erc-20',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    decimals: 6,
  } as const satisfies Erc20Token,
} as const satisfies Record<string, EvmToken>;

export const ethereumTokenDonors = {
  [ethereumTokens.eth.symbol.toLowerCase()]: '0xf977814e90da44bfa03b6295a0616a897441acec',
  [ethereumTokens.usdc.symbol.toLowerCase()]: '0xd54F23BE482D9A58676590fCa79c8E43087f92fB',
} as const;

export const tezosTokens = {
  xtz: {
    type: 'native',
    symbol: 'XTZ',
    decimals: 6,
  } as const satisfies TezosNativeToken,
  usdt: {
    type: 'fa1.2',
    address: 'KT1Hrnr3Tn5HDCS8UU5KkDBDu4D6rjXMfkwh',
    symbol: 'USDT',
    decimals: 6,
  } as const satisfies TezosFa12Token,
} as const satisfies Record<string, TezosToken>;
