import { ApiClient } from './internal/api-client.js';
import { AssetMapper } from './internal/asset-mapping.js';
import { TokenListProvider } from './tokens/list.js';
import { filterTokens } from './tokens/filter.js';
import { getQuote } from './quotes/get-quote.js';
import { calculateFee, DEFAULT_FEE_TIERS, DEFAULT_MIN_FEE_BPS } from './quotes/fees.js';
import type { FeeTier } from './quotes/fees.js';
import { createTransfer } from './transfers/create.js';
import { getTransferStatus } from './transfers/status.js';
import { validateAddress } from './validation/address.js';
import { getAllChains } from './chains/config.js';
import type { ChainId, ChainConfig } from './chains/types.js';
import type { Token, TokenFilterOptions } from './tokens/types.js';
import type { QuoteRequest, QuoteResponse, FeeInfo } from './quotes/types.js';
import type { TransferRequest, TransferResponse, TransferStatus } from './transfers/types.js';

/** Configuration options for the GoBlink client */
export interface GoBlinkOptions {
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
export class GoBlink {
  private readonly apiClient: ApiClient;
  private readonly mapper: AssetMapper;
  private readonly tokenList: TokenListProvider;
  private readonly feeTiers: FeeTier[];
  private readonly minFeeBps: number;
  private readonly feeRecipient: string;

  constructor(options: GoBlinkOptions = {}) {
    this.apiClient = new ApiClient({
      baseUrl: options.baseUrl,
      timeout: options.timeout,
    });
    this.mapper = new AssetMapper();
    this.tokenList = new TokenListProvider(
      this.apiClient,
      this.mapper,
      options.cacheTtl,
    );
    this.feeTiers = options.fees ?? DEFAULT_FEE_TIERS;
    this.minFeeBps = options.minFee ?? DEFAULT_MIN_FEE_BPS;
    this.feeRecipient = options.feeRecipient ?? 'goblink.near';
  }

  /**
   * Get all supported tokens, optionally filtered by chain or search query.
   * Results are cached for the configured TTL.
   *
   * @param options - Filter options
   * @returns Array of supported tokens
   */
  async getTokens(options?: TokenFilterOptions): Promise<Token[]> {
    const tokens = await this.tokenList.getTokens();
    return options ? filterTokens(tokens, options) : tokens;
  }

  /**
   * Get a quote for a cross-chain transfer.
   * This is a dry run — no funds are committed.
   *
   * @param request - Quote request parameters
   * @returns Quote with deposit address, amounts, fee, and estimated time
   */
  async getQuote(request: QuoteRequest): Promise<QuoteResponse> {
    await this.tokenList.ensureInitialized();
    return getQuote(request, this.apiClient, this.mapper, {
      feeRecipient: this.feeRecipient,
      feeTiers: this.feeTiers,
      minFeeBps: this.minFeeBps,
    });
  }

  /**
   * Create a real cross-chain transfer.
   * After calling this, send the exact deposit amount to the returned deposit address.
   *
   * @param request - Transfer request parameters
   * @returns Transfer details including deposit address
   */
  async createTransfer(request: TransferRequest): Promise<TransferResponse> {
    await this.tokenList.ensureInitialized();
    return createTransfer(request, this.apiClient, this.mapper, {
      feeRecipient: this.feeRecipient,
      feeTiers: this.feeTiers,
      minFeeBps: this.minFeeBps,
    });
  }

  /**
   * Check the status of a transfer by its deposit address.
   *
   * @param depositAddress - The deposit address returned from createTransfer
   * @returns Current transfer status
   */
  async getTransferStatus(depositAddress: string): Promise<TransferStatus> {
    return getTransferStatus(depositAddress, this.apiClient);
  }

  /**
   * Validate an address for a specific chain.
   *
   * @param chain - Chain identifier
   * @param address - Address to validate
   * @returns true if the address is valid
   */
  validateAddress(chain: ChainId, address: string): boolean {
    return validateAddress(chain, address);
  }

  /**
   * Get all supported chains with their configurations.
   *
   * @returns Array of chain configurations
   */
  getChains(): ChainConfig[] {
    return getAllChains();
  }

  /**
   * Calculate the fee for a given USD amount.
   *
   * @param amountUsd - Transaction amount in USD
   * @returns Fee information including BPS, percentage, and tier
   */
  calculateFee(amountUsd: number): FeeInfo {
    return calculateFee(amountUsd, this.feeTiers, this.minFeeBps);
  }

  /**
   * Clear the cached token list, forcing a fresh fetch on next call.
   */
  clearCache(): void {
    this.tokenList.clearCache();
  }
}
