import type { ChainId } from '../chains/types.js';

/** goBlink asset identifier (e.g., "ethereum:usdc", "solana:native") */
export type AssetId = `${ChainId}:${string}`;

/** A supported token */
export interface Token {
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
export interface TokenFilterOptions {
  /** Filter by chain */
  chain?: ChainId;
  /** Search by symbol or name (case-insensitive) */
  search?: string;
}
