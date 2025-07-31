import path from 'path';
import { fileURLToPath } from 'url';

import { config as loadEnv } from 'dotenv';

import type { TezosToken, Erc20Token } from './models/tokens.js';

const workingDirectory = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(workingDirectory, '../.env');

loadEnv({ path: envPath });

interface EvmChainConfig {
  readonly userPrivateKey: string;
  readonly rpcUrl: string;
  readonly chainId: number;
  readonly limitOrderProtocolContractAddress: string;
  readonly wrappedNativeTokenAddress: string;
  readonly tokens: ReadonlyMap<string, Erc20Token>;
  readonly donorTokenAddresses: ReadonlyMap<string, string>;
  readonly escrowFactoryAddress: string;
  readonly resolverAddress: string;
}

interface TezosChainConfig {
  readonly userPrivateKey: string;
  readonly rpcUrl: string;
  readonly tokens: ReadonlyMap<string, TezosToken>;
  readonly escrowFactoryAddress: string;
  readonly resolverAddress: string;
}

export interface Config {
  readonly workingDirectory: string;
  readonly evmChain: EvmChainConfig;
  readonly tezosChain: TezosChainConfig;
}

const createEvmChainConfig = (): EvmChainConfig => {
  const userPrivateKey = process.env.EVM_CHAIN__USER_PRIVATE_KEY;
  if (!userPrivateKey)
    throw new Error('The EVM_CHAIN__USER_PRIVATE_KEY is not specified');

  const rpcUrl = process.env.EVM_CHAIN__RPC_URL;
  if (!rpcUrl)
    throw new Error('The EVM_CHAIN__RPC_URL is not specified');

  const escrowFactoryAddress = process.env.EVM_CHAIN__ESCROW_FACTORY_ADDRESS;
  if (!escrowFactoryAddress)
    throw new Error('The EVM_CHAIN__ESCROW_FACTORY_ADDRESS is not specified');

  const resolverAddress = process.env.EVM_CHAIN__RESOLVER_ADDRESS;
  if (!resolverAddress)
    throw new Error('The EVM_CHAIN__RESOLVER_ADDRESS is not specified');

  const ethereumTokens = new Map<string, Erc20Token>([
    {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      decimals: 6,
    },
  ].map(token => [token.symbol.toLowerCase(), token]));

  const donorTokenAddresses = new Map<string, string>([
    ['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', '0xd54F23BE482D9A58676590fCa79c8E43087f92fB'],
  ]);

  return {
    userPrivateKey,
    rpcUrl,
    chainId: 1,
    limitOrderProtocolContractAddress: '0x111111125421ca6dc452d289314280a0f8842a65',
    wrappedNativeTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    tokens: ethereumTokens,
    donorTokenAddresses,
    escrowFactoryAddress,
    resolverAddress,
  };
};

const createTezosChainConfig = (): TezosChainConfig => {
  const userPrivateKey = process.env.TEZOS_CHAIN__USER_PRIVATE_KEY;
  if (!userPrivateKey)
    throw new Error('The TEZOS_CHAIN__USER_PRIVATE_KEY is not specified');

  const rpcUrl = process.env.TEZOS_CHAIN__RPC_URL;
  if (!rpcUrl)
    throw new Error('The TEZOS_CHAIN__RPC_URL is not specified');

  const escrowFactoryAddress = process.env.TEZOS_CHAIN__ESCROW_FACTORY_ADDRESS;
  if (!escrowFactoryAddress)
    throw new Error('The TEZOS_CHAIN__ESCROW_FACTORY_ADDRESS is not specified');

  const resolverAddress = process.env.TEZOS_CHAIN__RESOLVER_ADDRESS;
  if (!resolverAddress)
    throw new Error('The TEZOS_CHAIN__RESOLVER_ADDRESS is not specified');

  const tezosTokens = new Map<string, TezosToken>(([
    {
      address: 'KT1V2ak1MfNd3w4oyKD64ehYU7K4CrpUcDGR',
      type: 'FA2',
      symbol: 'USDT',
      decimals: 6,
    },
  ] satisfies TezosToken[]).map(token => [token.symbol.toLowerCase(), token]));

  return {
    userPrivateKey,
    rpcUrl,
    tokens: tezosTokens,
    escrowFactoryAddress,
    resolverAddress,
  };
};

const evmChainConfig = createEvmChainConfig();
const tezosChainConfig = createTezosChainConfig();

export default {
  workingDirectory,
  evmChain: evmChainConfig,
  tezosChain: tezosChainConfig,
} satisfies Config;
