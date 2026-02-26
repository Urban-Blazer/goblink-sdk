import type { FeeInfo } from './types.js';

/** A fee tier defining the rate for a given amount range */
export interface FeeTier {
  /** Maximum USD amount for this tier (null = unlimited) */
  maxAmountUsd: number | null;
  /** Fee in basis points */
  bps: number;
}

/** Default goBlink fee tiers */
export const DEFAULT_FEE_TIERS: FeeTier[] = [
  { maxAmountUsd: 5000, bps: 35 },
  { maxAmountUsd: 50000, bps: 10 },
  { maxAmountUsd: null, bps: 5 },
];

/** Default minimum fee floor in basis points */
export const DEFAULT_MIN_FEE_BPS = 5;

/** Fee tier labels based on BPS */
const TIER_LABELS: Record<number, string> = {
  35: 'Standard',
  10: 'Pro',
  5: 'Whale',
};

/**
 * Calculate the fee for a given USD amount
 * @param amountUsd - Transaction amount in USD
 * @param tiers - Fee tiers to use (default: goBlink standard)
 * @param minFeeBps - Minimum fee floor in basis points
 * @returns Fee information
 */
export function calculateFee(
  amountUsd: number,
  tiers: FeeTier[] = DEFAULT_FEE_TIERS,
  minFeeBps: number = DEFAULT_MIN_FEE_BPS,
): FeeInfo {
  let bps = tiers[tiers.length - 1]?.bps ?? minFeeBps;

  for (const tier of tiers) {
    if (tier.maxAmountUsd === null || amountUsd < tier.maxAmountUsd) {
      bps = tier.bps;
      break;
    }
  }

  // Enforce minimum floor
  bps = Math.max(bps, minFeeBps);

  const percent = (bps / 100).toFixed(2);
  const tier = TIER_LABELS[bps] ?? 'Custom';

  return { bps, percent, tier };
}
