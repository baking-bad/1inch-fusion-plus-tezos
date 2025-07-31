import readline, { Interface as ReadlineInterface } from 'node:readline';

type Command = [aliases: readonly string[], handler: (...args: any) => (void | Promise<void>), description?: string];

export class App {
  protected readonly rl: ReadlineInterface;
  protected readonly commands: Command[] = [];

  constructor() {
    this.commands = [
      [['h', 'help'], this.helpCommandHandler, 'Help'],
      [['q', 'exit'], this.exitCommandHandler, 'Exiting the program'],
    ];

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
  }

  async start() {
    console.log('Starting...');

    this.waitForNewCommand();
  }

  async stop() {
    try {
      console.log('Stopping...');

      //

      console.log('App stopped successfully');
      return true;
    }
    catch (error) {
      console.error('Error during shutdown:', error);
      return false;
    }
  }

  protected waitForNewCommand() {
    this.rl.question('cmd > ', input => this.readCommand(input));
  }

  protected async readCommand(input: string) {
    const [inputCommand, ...args] = input.trim().split(' ') as [string, ...string[]];
    const command = this.commands.find(([commandAliases]) => commandAliases.includes(inputCommand));

    if (command) {
      try {
        await command[1](...args);
      }
      catch (error) {
        console.error(error);
      }
    }
    else
      console.error('Unknown command');

    this.waitForNewCommand();
  }

  private helpCommandHandler = () => {
    console.log('\nAvailable commands:');
    this.commands.forEach(([commandAliases, _, commandDescription]) => {
      console.log(' *', commandAliases.join(', ').padEnd(20), commandDescription ? commandDescription : '');
    });
    console.log('');
  };

  private exitCommandHandler = async () => {
    const isSuccess = await this.stop();
    process.exit(isSuccess ? 0 : 1);
  };
}
