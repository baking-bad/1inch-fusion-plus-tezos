export class App {
  async start() {
    console.log('Starting...');
  }

  async stop() {
    try {
      console.log('Stopping...');

      //

      console.log('App stopped successfully');
    }
    catch (error) {
      console.error('Error during shutdown:', error);
    }
  }
}
