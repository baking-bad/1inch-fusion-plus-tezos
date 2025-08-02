import { Router } from 'express';

import type { App } from '../../app.js';

import { mappers } from '@baking-bad/1inch-fusion-plus-common';

export const getResolverRouter = (app: App): Router => {
  const resolverRouter = Router();

  resolverRouter.post('/order', async (req, res) => {
    const order = mappers.core.mapSignedCrossChainOrderDtoToModel(req.body);
    const result = await app.services.resolver.startSwap(order);

    return res.status(200).json(result);
  });

  resolverRouter.post('/order/:orderHash/withdraw', async (req, res) => {
    const orderHash = req.params.orderHash;
    const secret = req.body.secret;
    const result = await app.services.resolver.finalizeSwap(orderHash, secret);

    return res.status(200).json(result);
  });

  resolverRouter.post('/order/:orderHash/cancel', async (req, res) => {
    const orderHash = req.params.orderHash;
    const result = await app.services.resolver.cancelSwap(orderHash);

    return res.status(200).json(result);
  });

  return resolverRouter;
};
