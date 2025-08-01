import path from 'path';
import { fileURLToPath } from 'url';

import { config as loadEnv } from 'dotenv';

import { configHelpers, utils } from '@baking-bad/1inch-fusion-plus-common';

const workingDirectory = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(workingDirectory, '../.env');

loadEnv({ path: envPath });

interface ServerConfig {
  readonly port: number;
}

export interface Config {
  readonly workingDirectory: string;
  readonly server: ServerConfig;
}

const createServerConfig = (): ServerConfig => {
  const port = configHelpers.parseIntegerEnvVar('SERVER__PORT', 80);
  if (!utils.validation.isValidPort(port))
    throw new Error(`The SERVER__PORT is invalid: ${port} is not a valid port number`);

  return { port };
};

const serverConfig = createServerConfig();

export default {
  workingDirectory,
  server: serverConfig,
} satisfies Config;
