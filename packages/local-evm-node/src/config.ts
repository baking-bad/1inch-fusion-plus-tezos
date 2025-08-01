import path from 'path';
import { fileURLToPath } from 'url';

import { config as loadEnv } from 'dotenv';

import { utils, configHelpers } from '@baking-bad/1inch-fusion-plus-common';

const workingDirectory = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(workingDirectory, '../.env');

loadEnv({ path: envPath });

interface ServerConfig {
  readonly port: number;
}

interface ChainConfig {
  readonly rpcUrl: string;
  readonly chainId: number;
  readonly deployerPrivateKey: string;
  readonly resolverOwnerAddress: string;
}

export interface Config {
  readonly workingDirectory: string;
  readonly server: ServerConfig;
  readonly chain: ChainConfig;
}

const createServerConfig = (): ServerConfig => {
  const port = configHelpers.parseIntegerEnvVar('SERVER__PORT', 80);
  if (!utils.validation.isValidPort(port))
    throw new Error(`The SERVER__PORT is invalid: ${port} is not a valid port number`);

  return { port };
};

const createChainConfig = (): ChainConfig => {
  const rpcUrl = process.env.CHAIN__RPC_URL;
  if (!rpcUrl)
    throw new Error('The CHAIN__RPC_URL is not specified');

  const chainId = configHelpers.parseIntegerEnvVar('CHAIN__CHAIN_ID', Error);
  const deployerPrivateKey = process.env.CHAIN__DEPLOYER_PRIVATE_KEY;
  if (!deployerPrivateKey)
    throw new Error('The CHAIN__DEPLOYER_PRIVATE_KEY is not specified');

  const resolverOwnerAddress = process.env.CHAIN__RESOLVER_OWNER_ADDRESS;
  if (!resolverOwnerAddress)
    throw new Error('The CHAIN__RESOLVER_OWNER_ADDRESS is not specified');

  return {
    rpcUrl,
    chainId,
    deployerPrivateKey,
    resolverOwnerAddress,
  };
};

const serverConfig = createServerConfig();
const chainConfig = createChainConfig();

export default {
  workingDirectory,
  server: serverConfig,
  chain: chainConfig,
} satisfies Config;
