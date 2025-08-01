import * as validation from './validation.js';
export * as textUtils from './textUtils.js';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const utils = {
  validation,
  wait,
} as const;
