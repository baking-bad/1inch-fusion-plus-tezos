import { Router } from 'express';

import type { App } from '../app.js';

import { getResolverRouter } from './resolver/index.js';

export const getIndexRouter = (app: App): Router => {
  const indexRouter = Router();

  indexRouter.get('/', (_req, res) => {
    res.send('Welcome to the 1inch Fusion Plus Server!');
  });

  indexRouter.get('/resolver', getResolverRouter(app));

  return indexRouter;
};
