import { Router } from 'express';

import type { App } from '../../app.js';

import { getPlaceOrderResolverRouter } from './placeOrder/index.js';

export const getResolverRouter = (app: App): Router => {
  const resolverRouter = Router();

  resolverRouter.post('/order', getPlaceOrderResolverRouter(app));

  return resolverRouter;
};
