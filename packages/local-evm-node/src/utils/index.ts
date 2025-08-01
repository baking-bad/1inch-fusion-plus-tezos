import * as validation from './validation.js';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const utils = {
  validation,
  wait,
} as const;
