import { describe, it, expect } from 'vitest';
import { calculateFee, DEFAULT_FEE_TIERS, DEFAULT_MIN_FEE_BPS } from '../src/quotes/fees.js';

describe('Fee Calculation', () => {
  describe('default tiers', () => {
    it('applies Standard tier (35 bps) for amounts under $5,000', () => {
      const fee = calculateFee(100);
      expect(fee.bps).toBe(35);
      expect(fee.percent).toBe('0.35');
      expect(fee.tier).toBe('Standard');
    });

    it('applies Standard tier at $4,999', () => {
      const fee = calculateFee(4999);
      expect(fee.bps).toBe(35);
      expect(fee.tier).toBe('Standard');
    });

    it('applies Pro tier (10 bps) for amounts $5,000–$49,999', () => {
      const fee = calculateFee(5000);
      expect(fee.bps).toBe(10);
      expect(fee.percent).toBe('0.10');
      expect(fee.tier).toBe('Pro');
    });

    it('applies Pro tier at $49,999', () => {
      const fee = calculateFee(49999);
      expect(fee.bps).toBe(10);
      expect(fee.tier).toBe('Pro');
    });

    it('applies Whale tier (5 bps) for amounts $50,000+', () => {
      const fee = calculateFee(50000);
      expect(fee.bps).toBe(5);
      expect(fee.percent).toBe('0.05');
      expect(fee.tier).toBe('Whale');
    });

    it('applies Whale tier for very large amounts', () => {
      const fee = calculateFee(10_000_000);
      expect(fee.bps).toBe(5);
      expect(fee.tier).toBe('Whale');
    });
  });

  describe('edge cases', () => {
    it('handles zero amount', () => {
      const fee = calculateFee(0);
      expect(fee.bps).toBe(35);
      expect(fee.tier).toBe('Standard');
    });

    it('handles negative amount', () => {
      const fee = calculateFee(-100);
      expect(fee.bps).toBe(35);
    });

    it('handles fractional amounts', () => {
      const fee = calculateFee(0.01);
      expect(fee.bps).toBe(35);
    });
  });

  describe('minimum floor', () => {
    it('enforces minimum bps floor', () => {
      const customTiers = [{ maxAmountUsd: null, bps: 2 }];
      const fee = calculateFee(100, customTiers, 5);
      expect(fee.bps).toBe(5);
    });

    it('does not apply floor when tier bps exceeds minimum', () => {
      const fee = calculateFee(100, DEFAULT_FEE_TIERS, DEFAULT_MIN_FEE_BPS);
      expect(fee.bps).toBe(35);
    });

    it('respects custom min floor', () => {
      const customTiers = [{ maxAmountUsd: null, bps: 3 }];
      const fee = calculateFee(100, customTiers, 10);
      expect(fee.bps).toBe(10);
    });
  });

  describe('custom tiers', () => {
    it('works with custom fee tiers', () => {
      const tiers = [
        { maxAmountUsd: 1000, bps: 50 },
        { maxAmountUsd: null, bps: 20 },
      ];
      expect(calculateFee(500, tiers).bps).toBe(50);
      expect(calculateFee(5000, tiers).bps).toBe(20);
    });

    it('labels custom tiers correctly', () => {
      const tiers = [{ maxAmountUsd: null, bps: 25 }];
      const fee = calculateFee(100, tiers);
      expect(fee.tier).toBe('Custom');
    });
  });
});
