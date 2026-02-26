import type { ApiClient } from '../internal/api-client.js';
import type { AssetMapper } from '../internal/asset-mapping.js';
import type { ProtocolQuoteRequest } from '../internal/types.js';
import type { AssetId } from '../tokens/types.js';
import type { QuoteRequest, QuoteResponse } from './types.js';
import { calculateFee } from './fees.js';
import type { FeeTier } from './fees.js';
import { toAtomicAmount, fromAtomicAmount } from '../utils/format.js';
import { GoBlinkAssetNotFoundError, GoBlinkValidationError } from '../errors.js';

export interface GetQuoteOptions {
  feeRecipient: string;
  feeTiers: FeeTier[];
  minFeeBps: number;
}

/**
 * Request a quote from the upstream API (dry run — no funds committed)
 */
export async function getQuote(
  request: QuoteRequest,
  apiClient: ApiClient,
  mapper: AssetMapper,
  options: GetQuoteOptions,
): Promise<QuoteResponse> {
  return executeQuoteRequest(request, true, apiClient, mapper, options);
}

/**
 * Core quote/transfer execution logic shared by getQuote and createTransfer
 */
export async function executeQuoteRequest(
  request: QuoteRequest,
  dry: boolean,
  apiClient: ApiClient,
  mapper: AssetMapper,
  options: GetQuoteOptions,
): Promise<QuoteResponse> {
  // Resolve assets
  const fromAssetId: AssetId = `${request.from.chain}:${request.from.token.toLowerCase()}`;
  const toAssetId: AssetId = `${request.to.chain}:${request.to.token.toLowerCase()}`;

  const fromProtocol = mapper.resolveToProtocol(fromAssetId);
  if (!fromProtocol) {
    throw new GoBlinkAssetNotFoundError(fromAssetId);
  }

  const toProtocol = mapper.resolveToProtocol(toAssetId);
  if (!toProtocol) {
    throw new GoBlinkAssetNotFoundError(toAssetId);
  }

  const fromToken = mapper.findToken(request.from.chain, request.from.token);
  const toToken = mapper.findToken(request.to.chain, request.to.token);

  if (!fromToken) {
    throw new GoBlinkAssetNotFoundError(fromAssetId);
  }
  if (!toToken) {
    throw new GoBlinkAssetNotFoundError(toAssetId);
  }

  if (!request.amount || parseFloat(request.amount) <= 0) {
    throw new GoBlinkValidationError('Amount must be greater than 0', 'amount');
  }

  // Convert human amount to atomic
  const atomicAmount = toAtomicAmount(request.amount, fromToken.decimals);

  // Calculate fee — we use a rough USD estimate (for tier selection we use the raw amount)
  const fee = calculateFee(parseFloat(request.amount), options.feeTiers, options.minFeeBps);

  // Build deadline (15 minutes from now)
  const deadline = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const protocolRequest: ProtocolQuoteRequest = {
    dry,
    originAsset: fromProtocol,
    destinationAsset: toProtocol,
    amount: atomicAmount,
    recipient: request.recipient,
    refundTo: request.refundAddress,
    swapType: 'EXACT_INPUT',
    slippageTolerance: request.slippage ?? 100,
    deadline,
    depositType: 'ORIGIN_CHAIN',
    recipientType: 'DESTINATION_CHAIN',
    refundType: 'ORIGIN_CHAIN',
    appFees: [{ recipient: options.feeRecipient, fee: fee.bps }],
  };

  const protocolResponse = await apiClient.postQuote(protocolRequest);

  const amountIn = fromAtomicAmount(protocolResponse.originAmount, fromToken.decimals);
  const amountOut = fromAtomicAmount(protocolResponse.destinationAmount, toToken.decimals);

  const amountInNum = parseFloat(amountIn);
  const amountOutNum = parseFloat(amountOut);
  const rate = amountInNum > 0 ? (amountOutNum / amountInNum).toFixed(6) : '0';

  const estimatedTime = protocolResponse.estimatedProcessingTimeMs
    ? Math.ceil(protocolResponse.estimatedProcessingTimeMs / 1000)
    : 120;

  return {
    quoteId: protocolResponse.quoteId,
    depositAddress: protocolResponse.depositAddress,
    amountIn,
    amountOut,
    fee,
    rate,
    estimatedTime,
    expiresAt: protocolResponse.deadline,
  };
}
