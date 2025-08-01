import express, { type Express, type Router, type Request, type Response, type NextFunction } from 'express';

import config from './config.js';
import { getIndexRouter } from './routes/index.js';
import { Resolver, TaquitoContractTezosBridgeBlockchainService } from './services/resolver/index.js';
import { ChainIds } from '../../common/src/models/chain.js';

interface AppServices {
  resolver: Resolver;
}

export class App {
  readonly services: AppServices;
  readonly indexRouter: Router;
  readonly express: Express;

  constructor() {
    this.services = this.createServices();
    this.indexRouter = getIndexRouter(this);
    this.express = this.createExpressApp(this.indexRouter);
  }

  async start() {
    console.log('Starting...');

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
    const resolver = new Resolver(new Map([
      new TaquitoContractTezosBridgeBlockchainService(ChainIds.TezosGhostnet),
    ].map(service => [service.chainId, service])));

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
