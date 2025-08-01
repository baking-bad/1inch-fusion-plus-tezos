import path from 'path';
import { fileURLToPath } from 'url';

import { config as loadEnv } from 'dotenv';

const workingDirectory = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(workingDirectory, '../.env');

loadEnv({ path: envPath });

interface EvmChainConfig {
  readonly userPrivateKey: string;
  readonly rpcUrl: string;
  readonly escrowFactoryAddress: string;
  readonly resolverAddress: string;
}

interface TezosChainConfig {
  readonly userPrivateKey: string;
  readonly rpcUrl: string;
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

  return {
    userPrivateKey,
    rpcUrl,
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

  return {
    userPrivateKey,
    rpcUrl,
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
