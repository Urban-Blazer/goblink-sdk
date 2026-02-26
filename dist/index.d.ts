/** Supported chain identifiers */
type ChainId = 'ethereum' | 'base' | 'arbitrum' | 'bnb' | 'polygon' | 'optimism' | 'avalanche' | 'gnosis' | 'berachain' | 'monad' | 'aurora' | 'xlayer' | 'near' | 'solana' | 'sui' | 'bitcoin' | 'litecoin' | 'dogecoin' | 'bitcoincash' | 'tron' | 'ton' | 'stellar' | 'xrp' | 'starknet' | 'cardano' | 'aptos' | 'aleo';
/** Chain network type */
type ChainType = 'evm' | 'utxo' | 'account' | 'move';
/** Chain configuration */
interface ChainConfig {
    /** Unique chain identifier */
    id: ChainId;
    /** Human-readable chain name */
    name: string;
    /** Network type */
    type: ChainType;
    /** Numeric chain ID (EVM only) */
    chainId?: number;
    /** Block explorer base URL */
    explorer: string;
    /** Transaction path template (use {hash} placeholder) */
    explorerTxPath: string;
    /** Native token symbol */
    nativeToken: string;
}

/** Asset reference used in quote/transfer requests */
interface AssetReference {
    /** Chain identifier */
    chain: ChainId;
    /** Token symbol (e.g., "USDC", "ETH") */
    token: string;
}
/** Request parameters for getting a quote */
interface QuoteRequest {
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
interface QuoteResponse {
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
interface FeeInfo {
    /** Fee in basis points */
    bps: number;
    /** Fee as percentage string (e.g., "0.35") */
    percent: string;
    /** Fee tier label */
    tier: string;
}

/** A fee tier defining the rate for a given amount range */
interface FeeTier {
    /** Maximum USD amount for this tier (null = unlimited) */
    maxAmountUsd: number | null;
    /** Fee in basis points */
    bps: number;
}

/** goBlink asset identifier (e.g., "ethereum:usdc", "solana:native") */
type AssetId = `${ChainId}:${string}`;
/** A supported token */
interface Token {
    /** goBlink asset ID */
    assetId: AssetId;
    /** Token symbol (e.g., "USDC") */
    symbol: string;
    /** Full token name (e.g., "USD Coin") */
    name: string;
    /** Chain this token lives on */
    chain: ChainId;
    /** Number of decimals */
    decimals: number;
    /** Contract address (if applicable) */
    address?: string;
    /** Icon URL */
    icon?: string;
}
/** Options for filtering tokens */
interface TokenFilterOptions {
    /** Filter by chain */
    chain?: ChainId;
    /** Search by symbol or name (case-insensitive) */
    search?: string;
}

/** Request parameters for creating a transfer */
interface TransferRequest {
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
interface TransferResponse {
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
type TransferStatusValue = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'REFUNDED';
/** Transfer status response */
interface TransferStatus {
    /** Current status of the transfer */
    status: TransferStatusValue;
    /** Transaction hash on the destination chain (if available) */
    txHash?: string;
    /** Block explorer URL for the transaction (if available) */
    explorerUrl?: string;
}

/** Configuration options for the GoBlink client */
interface GoBlinkOptions {
    /** Fee tiers (defaults to goBlink standard tiers) */
    fees?: FeeTier[];
    /** Minimum fee floor in basis points (default: 5) */
    minFee?: number;
    /** Fee recipient account (default: "goblink.near") */
    feeRecipient?: string;
    /** API base URL (for internal use / testing) */
    baseUrl?: string;
    /** Request timeout in milliseconds (default: 30000) */
    timeout?: number;
    /** Token list cache TTL in milliseconds (default: 300000 = 5 min) */
    cacheTtl?: number;
}
/**
 * GoBlink SDK — cross-chain token transfers made simple.
 *
 * @example
 * ```typescript
 * const gb = new GoBlink();
 * const tokens = await gb.getTokens();
 * const quote = await gb.getQuote({
 *   from: { chain: 'ethereum', token: 'USDC' },
 *   to: { chain: 'solana', token: 'USDC' },
 *   amount: '100',
 *   recipient: '7xKp...3mNw',
 *   refundAddress: '0xABC...123',
 * });
 * ```
 */
declare class GoBlink {
    private readonly apiClient;
    private readonly mapper;
    private readonly tokenList;
    private readonly feeTiers;
    private readonly minFeeBps;
    private readonly feeRecipient;
    constructor(options?: GoBlinkOptions);
    /**
     * Get all supported tokens, optionally filtered by chain or search query.
     * Results are cached for the configured TTL.
     *
     * @param options - Filter options
     * @returns Array of supported tokens
     */
    getTokens(options?: TokenFilterOptions): Promise<Token[]>;
    /**
     * Get a quote for a cross-chain transfer.
     * This is a dry run — no funds are committed.
     *
     * @param request - Quote request parameters
     * @returns Quote with deposit address, amounts, fee, and estimated time
     */
    getQuote(request: QuoteRequest): Promise<QuoteResponse>;
    /**
     * Create a real cross-chain transfer.
     * After calling this, send the exact deposit amount to the returned deposit address.
     *
     * @param request - Transfer request parameters
     * @returns Transfer details including deposit address
     */
    createTransfer(request: TransferRequest): Promise<TransferResponse>;
    /**
     * Check the status of a transfer by its deposit address.
     *
     * @param depositAddress - The deposit address returned from createTransfer
     * @returns Current transfer status
     */
    getTransferStatus(depositAddress: string): Promise<TransferStatus>;
    /**
     * Validate an address for a specific chain.
     *
     * @param chain - Chain identifier
     * @param address - Address to validate
     * @returns true if the address is valid
     */
    validateAddress(chain: ChainId, address: string): boolean;
    /**
     * Get all supported chains with their configurations.
     *
     * @returns Array of chain configurations
     */
    getChains(): ChainConfig[];
    /**
     * Calculate the fee for a given USD amount.
     *
     * @param amountUsd - Transaction amount in USD
     * @returns Fee information including BPS, percentage, and tier
     */
    calculateFee(amountUsd: number): FeeInfo;
    /**
     * Clear the cached token list, forcing a fresh fetch on next call.
     */
    clearCache(): void;
}

/** Base error class for all goBlink SDK errors */
declare class GoBlinkError extends Error {
    constructor(message: string);
}
/** Error from the upstream API (non-2xx response) */
declare class GoBlinkApiError extends GoBlinkError {
    readonly statusCode: number;
    readonly responseBody: string | undefined;
    readonly url: string;
    constructor(statusCode: number, responseBody: string | undefined, url: string);
}
/** Network-level error (timeout, DNS failure, etc.) */
declare class GoBlinkNetworkError extends GoBlinkError {
    readonly url: string;
    constructor(message: string, url: string);
}
/** Validation error (invalid address, amount, etc.) */
declare class GoBlinkValidationError extends GoBlinkError {
    readonly field: string;
    constructor(message: string, field: string);
}
/** Asset not found error */
declare class GoBlinkAssetNotFoundError extends GoBlinkError {
    readonly assetId: string;
    constructor(assetId: string);
}

/**
 * Validate an address for a specific chain
 * @param chain - Chain identifier
 * @param address - Address to validate
 * @returns true if the address is valid for the given chain
 */
declare function validateAddress(chain: ChainId, address: string): boolean;

/**
 * Convert a human-readable amount to atomic (integer) representation
 * @param amount - Human-readable amount (e.g., "1.5")
 * @param decimals - Number of decimal places for the token
 * @returns Atomic amount as string (e.g., "1500000" for 1.5 with 6 decimals)
 */
declare function toAtomicAmount(amount: string, decimals: number): string;
/**
 * Convert an atomic amount to human-readable representation
 * @param atomicAmount - Atomic amount as string (e.g., "1500000")
 * @param decimals - Number of decimal places for the token
 * @returns Human-readable amount (e.g., "1.5")
 */
declare function fromAtomicAmount(atomicAmount: string, decimals: number): string;
/**
 * Truncate an address for display
 * @param address - Full address string
 * @param startChars - Number of characters to keep at start (default: 6)
 * @param endChars - Number of characters to keep at end (default: 4)
 */
declare function truncateAddress(address: string, startChars?: number, endChars?: number): string;
/**
 * Format a USD amount for display
 * @param amount - Amount in USD
 */
declare function formatUsd(amount: number): string;

export { type AssetId, type AssetReference, type ChainConfig, type ChainId, type ChainType, type FeeInfo, type FeeTier, GoBlink, GoBlinkApiError, GoBlinkAssetNotFoundError, GoBlinkError, GoBlinkNetworkError, type GoBlinkOptions, GoBlinkValidationError, type QuoteRequest, type QuoteResponse, type Token, type TokenFilterOptions, type TransferRequest, type TransferResponse, type TransferStatus, type TransferStatusValue, formatUsd, fromAtomicAmount, toAtomicAmount, truncateAddress, validateAddress };
