import path from 'path';
import { fileURLToPath } from 'url';

import { config as loadEnv } from 'dotenv';

const workingDirectory = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(workingDirectory, '../.env');

loadEnv({ path: envPath });

export interface Config {
  readonly workingDirectory: string;
}

export default {
  workingDirectory,
} satisfies Config;
