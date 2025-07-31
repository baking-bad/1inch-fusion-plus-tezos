import path from 'path';
import { fileURLToPath } from 'url';

import { config as loadEnv } from 'dotenv';

const workingDirectory = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(workingDirectory, '../.env');

loadEnv({ path: envPath });

interface EvmChainConfig {
  readonly rpcUrl: string;
  readonly chainId: number;
  readonly limitOrderProtocolContractAddress: string;
  readonly wrappedNativeTokenAddress: string;
  readonly tokens: {
    [symbol: string]: {
      address: string;
      donorAddress: string;
    };
  };
}

export interface Config {
  readonly workingDirectory: string;
  readonly evmChain: EvmChainConfig;
}

const createEvmChainConfig = (): EvmChainConfig => {
  const rpcUrl = process.env.EVM_CHAIN__RPC_URL;
  if (!rpcUrl)
    throw new Error('The EVM_CHAIN__RPC_URL is not specified');

  return {
    rpcUrl,
    chainId: 1,
    limitOrderProtocolContractAddress: '0x111111125421ca6dc452d289314280a0f8842a65',
    wrappedNativeTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    tokens: {
      USDC: {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        donorAddress: '0xd54F23BE482D9A58676590fCa79c8E43087f92fB',
      },
    },
  };
};

const evmChainConfig = createEvmChainConfig();

export default {
  workingDirectory,
  evmChain: evmChainConfig,
} satisfies Config;
