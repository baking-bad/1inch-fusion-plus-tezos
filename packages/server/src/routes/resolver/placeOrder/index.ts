import { Router } from 'express';

import type { App } from '../../../app.js';

export const getPlaceOrderResolverRouter = (app: App): Router => {
  const router = Router();

  router.post('/', async (req, res) => {
    const order = req.body;
    const result = await app.services.resolver.startSwap(order);

    return res.status(200).json(result);
  });

  return router;
};
