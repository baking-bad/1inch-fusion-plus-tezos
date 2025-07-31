import type { CrossChainOrder } from '../../../models/core.js';

export interface PlaceOrderParams {
  order: CrossChainOrder;
  signature: string;
}
