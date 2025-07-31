import path from 'path';
import { fileURLToPath } from 'url';

import { config as loadEnv } from 'dotenv';

import { ChainIds, type ChainId } from './models/chain.js';
import utils from './utils/index.js';

const workingDirectory = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(workingDirectory, '../.env');

loadEnv({ path: envPath });

function parseIntegerEnvVar(envVarName: string): number | undefined;
function parseIntegerEnvVar(envVarName: string, defaultValue: number): number;
function parseIntegerEnvVar(envVarName: string, defaultValue: ErrorConstructor): number;
function parseIntegerEnvVar(envVarName: string, defaultValue?: number | ErrorConstructor): number | undefined {
  const rawValue = process.env[envVarName];
  if (!rawValue) {
    if (typeof defaultValue === 'function')
      throw new defaultValue(`The ${envVarName} is not specified`);

    return defaultValue;
  }

  const value = Number(rawValue);
  if (!Number.isSafeInteger(value))
    throw new Error(`The ${envVarName} is invalid: ${rawValue} is not a valid integer`);
  return value;
};

interface ServerConfig {
  readonly port: number;
}

export interface Config {
  readonly workingDirectory: string;
  readonly server: ServerConfig;
}

const createServerConfig = (): ServerConfig => {
  const port = parseIntegerEnvVar('SERVER__PORT', 80);
  if (!utils.validation.isValidPort(port))
    throw new Error(`The SERVER__PORT is invalid: ${port} is not a valid port number`);

  return { port };
};

const serverConfig = createServerConfig();

export default {
  workingDirectory,
  server: serverConfig,
} satisfies Config;
