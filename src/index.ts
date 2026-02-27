// Public API — @goblink/sdk

export { GoBlink } from './client.js';
export type { GoBlinkOptions } from './client.js';

// Token types
export type { Token, AssetId, TokenFilterOptions } from './tokens/types.js';

// Quote types
export type { QuoteRequest, QuoteResponse, FeeInfo, AssetReference } from './quotes/types.js';

// Fee types
export type { FeeTier } from './quotes/fees.js';

// Transfer types
export type {
  TransferRequest,
  TransferResponse,
  TransferStatus,
  TransferStatusValue,
} from './transfers/types.js';

// Chain types
export type { ChainId, ChainType, ChainConfig } from './chains/types.js';

// Error types
export {
  GoBlinkError,
  GoBlinkApiError,
  GoBlinkNetworkError,
  GoBlinkValidationError,
  GoBlinkAssetNotFoundError,
} from './errors.js';

// Utility functions
export { validateAddress } from './validation/address.js';
export { formatUsd, truncateAddress, toAtomicAmount, fromAtomicAmount } from './utils/format.js';

// Link helpers
export { createPaymentLink, createBadge } from './links/payment-link.js';
export type { PaymentLinkOptions, BadgeOptions, ShortenOptions, ShortenResponse } from './links/types.js';

// Status polling
export type { WaitForCompletionOptions } from './transfers/wait.js';

// Widget (browser environments — import '@goblink/sdk/widget' for full widget API)
export type { WidgetOptions, WidgetEvent, GoBlinkWidgetProps } from './widget/types.js';
