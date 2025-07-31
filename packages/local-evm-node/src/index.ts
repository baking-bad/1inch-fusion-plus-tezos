import { createServer } from 'prool';
import { anvil } from 'prool/instances';

import config from './config.js';

try {
  console.log('Starting local EVM node...');
  const node = createServer({
    instance: anvil({ forkUrl: config.chain.rpcUrl, chainId: config.chain.chainId }),
    port: config.server.port,
    limit: 1,
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received. Cleaning up...');
    await node.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Cleaning up...');
    await node.stop();
    process.exit(0);
  });

  await node.start();
  console.log(`Local EVM node started on port ${config.server.port}`);
}
catch (error) {
  console.error('The app crashed:', error);
  process.exit(1);
}
