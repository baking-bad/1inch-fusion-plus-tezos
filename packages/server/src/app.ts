import express, { type Express, type Router, type Request, type Response, type NextFunction } from 'express';

import { parseUnits, parseEther } from 'ethers';

import config from './config.js';
import { getIndexRouter } from './routes/index.js';
import { Resolver } from './services/resolver/index.js';
import { ChainIds } from '../../common/src/models/chain.js';
import { ethereumTokenDonors, ethereumTokens, EvmChainAccount, TezosChainAccount, tezosTokens } from '@baking-bad/1inch-fusion-plus-common';

interface AppServices {
  resolver: Resolver;
}

export class App {
  readonly evmAccount: EvmChainAccount;
  readonly tezosAccount: TezosChainAccount;
  readonly services: AppServices;
  readonly indexRouter: Router;
  readonly express: Express;

  constructor() {
    this.evmAccount = new EvmChainAccount({
      chainId: ChainIds.Ethereum,
      rpcUrl: config.evmChainConfig.rpcUrl,
      privateKeyOrSigner: config.evmChainConfig.resolverOwnerPrivateKey,
      tokens: ethereumTokens,
      tokenDonors: ethereumTokenDonors,
    });
    this.tezosAccount = new TezosChainAccount({
      rpcUrl: config.tezosChainConfig.rpcUrl,
      userPrivateKey: config.tezosChainConfig.resolverOwnerPrivateKey,
      tokens: tezosTokens,
    });

    this.services = this.createServices();
    this.indexRouter = getIndexRouter(this);
    this.express = this.createExpressApp(this.indexRouter);
  }

  async start() {
    console.log('Starting...');

    await this.evmAccount.start();
    await this.tezosAccount.start();

    console.log('Ethereum resolver owner:', await this.evmAccount.getAddress());
    console.log('Tezos resolver owner:', await this.tezosAccount.getAddress());

    await this.evmAccount.topUpFromDonor(parseEther('10'));

    await this.evmAccount.provider.send('anvil_impersonateAccount', [config.evmChainConfig.resolverAddress]);
    const resolverContractSigner = await this.evmAccount.provider.getSigner(config.evmChainConfig.resolverAddress);
    const evmResolverContractAccount = new EvmChainAccount({
      chainId: ChainIds.Ethereum,
      rpcUrl: config.evmChainConfig.rpcUrl,
      privateKeyOrSigner: resolverContractSigner,
      tokens: ethereumTokens,
      tokenDonors: ethereumTokenDonors,
    });
    const ethUsdcToken = ethereumTokens.get('usdc')!;
    await evmResolverContractAccount.topUpFromDonor(parseEther('10'));
    await evmResolverContractAccount.topUpFromDonor(ethUsdcToken.address, parseUnits('100000', 6));
    await evmResolverContractAccount.approveUnlimited(ethUsdcToken.address, config.evmChainConfig.escrowFactoryAddress);

    this.express.listen(config.server.port, () => {
      console.log(`Server started on port ${config.server.port}`);
    });
  }

  async stop() {
    try {
      console.log('Stopping...');

      //

      console.log('Server stopped successfully');
      return true;
    }
    catch (error) {
      console.error('Error during shutdown:', error);
      return false;
    }
  }

  protected createServices(): AppServices {
    const resolver = new Resolver({
      evmEscrowFactoryAddress: config.evmChainConfig.escrowFactoryAddress,
      evmResolverContractAddress: config.evmChainConfig.resolverAddress,
      tezosEscrowFactoryAddress: config.tezosChainConfig.escrowFactoryAddress,
      evmChainAccount: this.evmAccount,
      tezosChainAccount: this.tezosAccount,
    });

    return {
      resolver,
    };
  }

  protected createExpressApp(indexRouter: Router) {
    const app = express();
    app.use(express.json());

    app.use('/', indexRouter);

    app.get('/health', (_req: Request, res: Response) => {
      res.json({
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now(),
      });
    });

    app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
      console.error(
        'Server error occurred',
        {
          error,
          url: req.url,
          body: JSON.stringify(req.body),
          params: JSON.stringify(req.params),
          query: JSON.stringify(req.query),
        }
      );

      res.status(500).send({
        error: 'Internal server error',
      });
    });

    app.disable('x-powered-by');

    return app;
  }
}
