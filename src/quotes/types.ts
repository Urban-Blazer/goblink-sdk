import type { ChainId } from '../chains/types.js';

/** Asset reference used in quote/transfer requests */
export interface AssetReference {
  /** Chain identifier */
  chain: ChainId;
  /** Token symbol (e.g., "USDC", "ETH") */
  token: string;
}

/** Request parameters for getting a quote */
export interface QuoteRequest {
  /** Source asset */
  from: AssetReference;
  /** Destination asset */
  to: AssetReference;
  /** Human-readable amount to send (e.g., "100.5") */
  amount: string;
  /** Recipient address on the destination chain */
  recipient: string;
  /** Refund address on the source chain */
  refundAddress: string;
  /** Slippage tolerance in basis points (default: 100 = 1%) */
  slippage?: number;
}

/** Quote response returned to the user */
export interface QuoteResponse {
  /** Unique quote identifier */
  quoteId: string;
  /** Address to deposit funds to */
  depositAddress: string;
  /** Amount the user needs to send (human-readable) */
  amountIn: string;
  /** Amount the recipient will receive (human-readable) */
  amountOut: string;
  /** Fee applied */
  fee: FeeInfo;
  /** Exchange rate (destination per source) */
  rate: string;
  /** Estimated processing time in seconds */
  estimatedTime: number;
  /** Quote expiration time */
  expiresAt: string;
}

/** Fee information included in quotes */
export interface FeeInfo {
  /** Fee in basis points */
  bps: number;
  /** Fee as percentage string (e.g., "0.35") */
  percent: string;
  /** Fee tier label */
  tier: string;
}
