import { Router } from 'express';

import type { App } from '../../../app.js';
import { mappers } from '@baking-bad/1inch-fusion-plus-common';

export const getPlaceOrderResolverRouter = (app: App): Router => {
  const router = Router();

  router.post('/', async (req, res) => {
    const order = mappers.core.mapSignedCrossChainOrderDtoToModel(req.body);
    const result = await app.services.resolver.startSwap(order);

    return res.status(200).json(result);
  });

  return router;
};
