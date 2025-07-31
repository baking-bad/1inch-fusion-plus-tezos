import { Router } from 'express';

import type { App } from '../../../app.js';

export const getPlaceOrderResolverRouter = (app: App): Router => {
  const router = Router();

  router.post('/', (_req, res) => {
    // TODO: Implement the place order logic
    // app.services.resolver.deploySrc()
  });

  return router;
};
