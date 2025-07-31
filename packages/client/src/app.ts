import readline, { Interface as ReadlineInterface } from 'node:readline';
import utils from './utils/index.js';

type Command = [aliases: readonly string[], handler: (inputCommand: string, ...args: any) => (void | Promise<void>), description?: string];

export class App {
  protected readonly rl: ReadlineInterface;
  protected readonly commands: Command[] = [];

  constructor() {
    this.commands = [
      [['h', 'help'], this.helpCommandHandler, 'Help'],
      [['q', 'exit'], this.exitCommandHandler, 'Exiting the program'],
      [['s', 'swap'], this.swapCommandHandler, 'Swap tokens'],
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
        await command[1](inputCommand, ...args);
      }
      catch (error) {
        console.error(error);
      }
    }
    else
      console.error('Unknown command');

    this.waitForNewCommand();
  }

  private swapCommandHandler = async (inputCommand: string, ...args: string[]) => {
    const [rawInputAmount, rawSrcChainAndToken, rawOutputAmount, rawDstChainAndToken, ...excessArgs] = args;

    if (args.length < 4) {
      console.error(`Usage: ${inputCommand} <inputAmount> <srcChain>:<srcToken> <outputAmount> <dstChain>:dstToken>`);
      return;
    }

    const inputAmount = Number(rawInputAmount);
    if (!utils.validation.isNonNegativeNumber(inputAmount)) {
      console.error('Invalid input amount:', rawInputAmount);
      return;
    }

    const [srcChain, srcToken] = rawSrcChainAndToken!.split(':', 2);
    if (!srcChain || !srcToken) {
      console.error('Invalid source chain and token:', rawSrcChainAndToken);
      return;
    }

    const outputAmount = Number(rawOutputAmount);
    if (!utils.validation.isNonNegativeNumber(outputAmount)) {
      console.error('Invalid output amount:', rawOutputAmount);
      return;
    }

    const [dstChain, dstToken] = rawDstChainAndToken!.split(':', 2);
    if (!dstChain || !dstToken) {
      console.error('Invalid destination chain and token:', rawDstChainAndToken);
      return;
    }

    if (excessArgs.length > 0) {
      console.warn('Excess arguments provided:', excessArgs.join(', '));
      console.warn('These will be ignored.');
    }

    console.log(`Swapping ${inputAmount} ${srcToken} [${srcChain}] to ${outputAmount} ${dstToken} [${dstChain}]...`);
  };

  private helpCommandHandler = (_inputCommand: string) => {
    console.log('\nAvailable commands:');
    this.commands.forEach(([commandAliases, _, commandDescription]) => {
      console.log(' *', commandAliases.join(', ').padEnd(20), commandDescription ? commandDescription : '');
    });
    console.log('');
  };

  private exitCommandHandler = async (_inputCommand: string) => {
    const isSuccess = await this.stop();
    process.exit(isSuccess ? 0 : 1);
  };
}
