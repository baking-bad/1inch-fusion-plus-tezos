import Sdk from '@1inch/cross-chain-sdk';

export type ChainId = number | string;

export const enum ChainIds {
  Ethereum = 1,
  TezosGhostnet = 'tezos:ghostnet',

  TezosGhostnetSdkChainId = Sdk.NetworkEnum.BINANCE
}
