import * as validation from './validation.js';
import * as textUtils from './textUtils.js';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const utils = {
  validation,
  textUtils,
  wait,
} as const;
