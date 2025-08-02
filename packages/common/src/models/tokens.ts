export interface TezosNativeToken {
  readonly type: 'native';
  readonly symbol: string;
  readonly decimals: number;
}

export interface TezosFa12Token {
  readonly type: 'fa1.2';
  readonly address: string;
  readonly symbol: string;
  readonly decimals: number;
}

export interface TezosFa2Token {
  readonly type: 'fa2';
  readonly address: string;
  readonly symbol: string;
  readonly decimals: number;
  readonly tokenId: string;
}

export type TezosFaToken = TezosFa12Token | TezosFa2Token;
export type TezosToken = TezosNativeToken | TezosFaToken;

export interface NativeEvmToken {
  readonly type: 'native';
  readonly symbol: string;
  readonly decimals: number;
}

export interface Erc20Token {
  readonly type: 'erc-20';
  readonly address: string;
  readonly symbol: string;
  readonly decimals: number;
}

export type EvmToken = NativeEvmToken | Erc20Token;
