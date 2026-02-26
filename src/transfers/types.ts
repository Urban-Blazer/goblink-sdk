import type { AssetReference } from '../quotes/types.js';

/** Request parameters for creating a transfer */
export interface TransferRequest {
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

/** Transfer creation response */
export interface TransferResponse {
  /** Transfer identifier */
  id: string;
  /** Address to deposit funds to */
  depositAddress: string;
  /** Exact amount to deposit (human-readable) */
  depositAmount: string;
  /** Transfer expiration time */
  expiresAt: string;
}

/** Transfer status values */
export type TransferStatusValue =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'EXPIRED'
  | 'REFUNDED';

/** Transfer status response */
export interface TransferStatus {
  /** Current status of the transfer */
  status: TransferStatusValue;
  /** Transaction hash on the destination chain (if available) */
  txHash?: string;
  /** Block explorer URL for the transaction (if available) */
  explorerUrl?: string;
}
