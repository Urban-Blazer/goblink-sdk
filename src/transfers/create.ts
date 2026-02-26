import type { ApiClient } from '../internal/api-client.js';
import type { AssetMapper } from '../internal/asset-mapping.js';
import type { TransferRequest, TransferResponse } from './types.js';
import { executeQuoteRequest } from '../quotes/get-quote.js';
import type { GetQuoteOptions } from '../quotes/get-quote.js';

/**
 * Create a real transfer (non-dry quote) — commits funds
 */
export async function createTransfer(
  request: TransferRequest,
  apiClient: ApiClient,
  mapper: AssetMapper,
  options: GetQuoteOptions,
): Promise<TransferResponse> {
  const quoteResponse = await executeQuoteRequest(
    {
      from: request.from,
      to: request.to,
      amount: request.amount,
      recipient: request.recipient,
      refundAddress: request.refundAddress,
      slippage: request.slippage,
    },
    false, // dry = false → real transfer
    apiClient,
    mapper,
    options,
  );

  return {
    id: quoteResponse.quoteId,
    depositAddress: quoteResponse.depositAddress,
    depositAmount: quoteResponse.amountIn,
    expiresAt: quoteResponse.expiresAt,
  };
}
