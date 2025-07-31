import { Router } from 'express';

import type { App } from '../app.js';

export const getIndexRouter = (_app: App): Router => {
  const indexRouter = Router();

  indexRouter.get('/', (_req, res) => {
    res.send('Welcome to the 1inch Fusion Plus Server!');
  });

  return indexRouter;
};
