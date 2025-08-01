import path from 'path';
import { fileURLToPath } from 'url';

import { config as loadEnv } from 'dotenv';

import { configHelpers, utils } from '@baking-bad/1inch-fusion-plus-common';

const workingDirectory = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(workingDirectory, '../.env');

loadEnv({ path: envPath });

interface EvmChainConfig {
  readonly rpcUrl: string;
  readonly resolverOwnerPrivateKey: string;
  readonly escrowFactoryAddress: string;
  readonly resolverAddress: string;
}

interface TezosChainConfig {
  readonly rpcUrl: string;
  readonly resolverOwnerPrivateKey: string;
  readonly escrowFactoryAddress: string;
}

interface ServerConfig {
  readonly port: number;
}

export interface Config {
  readonly workingDirectory: string;
  readonly server: ServerConfig;
  readonly evmChainConfig: EvmChainConfig;
  readonly tezosChainConfig: TezosChainConfig;
}

const createEvmChainConfig = (): EvmChainConfig => {
  const rpcUrl = process.env.EVM_CHAIN__RPC_URL;
  if (!rpcUrl)
    throw new Error('The EVM_CHAIN__RPC_URL is not specified');

  const resolverOwnerPrivateKey = process.env.EVM_CHAIN__RESOLVER_OWNER_PRIVATE_KEY;
  if (!resolverOwnerPrivateKey)
    throw new Error('The EVM_CHAIN__RESOLVER_OWNER_PRIVATE_KEY is not specified');

  const resolverAddress = process.env.EVM_CHAIN__RESOLVER_ADDRESS;
  if (!resolverAddress)
    throw new Error('The EVM_CHAIN__RESOLVER_ADDRESS is not specified');

  const escrowFactoryAddress = process.env.EVM_CHAIN__ESCROW_FACTORY_ADDRESS;
  if (!escrowFactoryAddress)
    throw new Error('The EVM_CHAIN__ESCROW_FACTORY_ADDRESS is not specified');

  return {
    rpcUrl,
    resolverOwnerPrivateKey,
    escrowFactoryAddress,
    resolverAddress,
  };
};

const createTezosChainConfig = (): TezosChainConfig => {
  const rpcUrl = process.env.TEZOS_CHAIN__RPC_URL;
  if (!rpcUrl)
    throw new Error('The TEZOS_CHAIN__RPC_URL is not specified');

  const resolverOwnerPrivateKey = process.env.TEZOS_CHAIN__RESOLVER_OWNER_PRIVATE_KEY;
  if (!resolverOwnerPrivateKey)
    throw new Error('The TEZOS_CHAIN__RESOLVER_OWNER_PRIVATE_KEY is not specified');

  const escrowFactoryAddress = process.env.TEZOS_CHAIN__ESCROW_FACTORY_ADDRESS;
  if (!escrowFactoryAddress)
    throw new Error('The TEZOS_CHAIN__ESCROW_FACTORY_ADDRESS is not specified');

  return {
    rpcUrl,
    resolverOwnerPrivateKey,
    escrowFactoryAddress,
  };
};

const createServerConfig = (): ServerConfig => {
  const port = configHelpers.parseIntegerEnvVar('SERVER__PORT', 80);
  if (!utils.validation.isValidPort(port))
    throw new Error(`The SERVER__PORT is invalid: ${port} is not a valid port number`);

  return { port };
};

const serverConfig = createServerConfig();
const evmChainConfig = createEvmChainConfig();
const tezosChainConfig = createTezosChainConfig();

export default {
  workingDirectory,
  server: serverConfig,
  evmChainConfig,
  tezosChainConfig,
} satisfies Config;
