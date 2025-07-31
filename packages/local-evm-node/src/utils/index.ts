import * as validation from './validation.js';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default {
  validation,
  wait,
} as const;
