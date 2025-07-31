import { App } from './app.js';

try {
  const app = new App();

  process.on('SIGINT', async () => {
    console.log('SIGINT received. Cleaning up...');
    await app.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Cleaning up...');
    await app.stop();
    process.exit(0);
  });

  await app.start();
}
catch (error) {
  console.error('The server crashed:', error);
  process.exit(1);
}
