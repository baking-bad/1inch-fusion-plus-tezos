import readline, { Interface as ReadlineInterface } from 'node:readline';

import { parseUnits, formatUnits } from 'ethers';

import { utils, EvmChainAccount, TezosChainAccount } from '@baking-bad/1inch-fusion-plus-common';

import config from './config.js';
import { SwapManager } from './swapManager.js';

type Command = [aliases: readonly string[], handler: (inputCommand: string, ...args: any) => (void | Promise<void>), description?: string];

export class App {
  protected readonly rl: ReadlineInterface;
  protected readonly commands: Command[] = [];
  protected readonly evmAccount: EvmChainAccount;
  protected readonly tezosAccount: TezosChainAccount;
  protected readonly swapManager: SwapManager;

  constructor() {
    this.commands = [
      [['h', 'help'], this.helpCommandHandler, 'Help'],
      [['q', 'exit'], this.exitCommandHandler, 'Exiting the program'],
      [['t', 'topup'], this.topUpCommandHandler, 'Top up EVM account from donor'],
      [['b', 'balance'], this.getTokenBalanceHandler, 'Get token balance'],
      [['s', 'swap'], this.swapCommandHandler, 'Swap tokens'],
    ];

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    this.evmAccount = new EvmChainAccount({
      userPrivateKey: config.evmChain.userPrivateKey,
      rpcUrl: config.evmChain.rpcUrl,
      chainId: config.evmChain.chainId,
      tokens: config.evmChain.tokens,
      donorTokenAddresses: config.evmChain.donorTokenAddresses,
    });
    this.tezosAccount = new TezosChainAccount({
      userPrivateKey: config.tezosChain.userPrivateKey,
      rpcUrl: config.tezosChain.rpcUrl,
      tokens: config.tezosChain.tokens,
    });
    this.swapManager = new SwapManager(this.evmAccount, this.tezosAccount);
  }

  async start() {
    console.log('Starting...');

    await this.evmAccount.start();
    await this.tezosAccount.start();

    console.log('Ethereum account:', await this.evmAccount.getAddress());
    console.log('Tezos account:', await this.tezosAccount.getAddress());
    console.log('Type "help" for available commands.');
    console.log('');
    this.waitForNewCommand();
  }

  async stop() {
    try {
      console.log('Stopping...');

      await this.tezosAccount.stop();
      await this.evmAccount.stop();

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
        console.error(error instanceof Error ? error.message : error);
      }
    }
    else
      console.error('Unknown command');

    this.waitForNewCommand();
  }

  protected isEvmChain(chainName: string): boolean {
    switch (chainName.toLowerCase()) {
      case 'evm':
      case 'ethereum':
      case 'eth':
        return true;
      case 'tezos':
      case 'xtz':
      case 'tez':
        return false;
      default:
        throw new Error(`Unknown chain: ${chainName}`);
    }
  }

  protected parseChainAndToken(rawChainAndToken: string | undefined | null): [string, string] {
    if (!rawChainAndToken)
      throw new Error('Chain and token must be specified in the format <chain>:<tokenSymbol>');

    const [chainName, tokenSymbol] = rawChainAndToken.split(':', 2);
    if (!chainName || !tokenSymbol)
      throw new Error(`Invalid chain and token format: ${rawChainAndToken}`);

    return [chainName, tokenSymbol];
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

    const [srcChain, srcToken] = this.parseChainAndToken(rawSrcChainAndToken);

    const outputAmount = Number(rawOutputAmount);
    if (!utils.validation.isNonNegativeNumber(outputAmount)) {
      console.error('Invalid output amount:', rawOutputAmount);
      return;
    }

    const [dstChain, dstToken] = this.parseChainAndToken(rawDstChainAndToken);

    if (excessArgs.length > 0) {
      console.warn('Excess arguments provided:', excessArgs.join(', '));
      console.warn('These will be ignored.');
    }

    console.log(`Swapping ${inputAmount} ${srcToken} [${srcChain}] to ${outputAmount} ${dstToken} [${dstChain}]...`);

    if (this.isEvmChain(srcChain)) {
      const srcErc20Token = this.evmAccount.getToken(srcToken);
      if (!srcErc20Token) {
        console.error(`Token ${srcToken} not found on EVM chain`);
        return;
      }

      const dstTezosToken = this.tezosAccount.getToken(dstToken);
      if (!dstTezosToken) {
        console.error(`Token ${dstToken} not found on Tezos chain`);
        return;
      }

      const result = await this.swapManager.createEvmOrder(inputAmount, srcErc20Token, outputAmount, dstTezosToken);
      console.log('Swap order created successfully:');
      console.log('Order:', result.order);
      console.log('Signature:', result.signature);
      console.log('Order Hash:', result.orderHash);
    }
  };

  private topUpCommandHandler = async (inputCommand: string, ...args: string[]) => {
    const [rawChainAndToken, rawAmount] = args;

    if (args.length < 2) {
      console.error(`Usage: ${inputCommand} <chain>:<tokenSymbol> <amount>`);
      return;
    }

    const amount = Number(rawAmount);
    if (!utils.validation.isNonNegativeNumber(amount)) {
      console.error('Invalid amount:', rawAmount);
      return;
    }

    const [chainName, tokenName] = this.parseChainAndToken(rawChainAndToken);

    if (this.isEvmChain(chainName)) {
      const token = this.evmAccount.getToken(tokenName);
      if (!token) {
        console.error(`Token ${tokenName} not found on EVM chain`);
        return;
      }

      await this.evmAccount.topUpFromDonor(token.address, parseUnits(amount.toString(), token.decimals));
      console.log(`Successfully topped up ${amount} from donor for token ${token.address}`);
    }
    else {
      console.warn('Top up for Tezos chain is not implemented yet');
    }
  };

  private getTokenBalanceHandler = async (inputCommand: string, ...args: string[]) => {
    const [rawChainAndToken] = args;
    if (args.length < 1) {
      console.error(`Usage: ${inputCommand} <chain>:<tokenSymbol>`);
      return;
    }

    const [chainName, tokenSymbol] = this.parseChainAndToken(rawChainAndToken);

    if (this.isEvmChain(chainName)) {
      const token = this.evmAccount.getToken(tokenSymbol);
      if (!token) {
        console.error(`Token ${tokenSymbol} not found on EVM chain`);
        return;
      }

      const balance = await this.evmAccount.getTokenBalance(token.address);
      console.log(`Balance of ${token.symbol} on EVM chain: ${formatUnits(balance, token.decimals)}`);
    }
    else {
      console.warn('Getting balance for Tezos chain is not implemented yet');
    }
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
