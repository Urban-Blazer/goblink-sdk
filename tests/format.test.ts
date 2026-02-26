import { describe, it, expect } from 'vitest';
import { toAtomicAmount, fromAtomicAmount, truncateAddress, formatUsd } from '../src/utils/format.js';

describe('Amount Formatting', () => {
  describe('toAtomicAmount', () => {
    it('converts whole numbers', () => {
      expect(toAtomicAmount('100', 6)).toBe('100000000');
      expect(toAtomicAmount('1', 18)).toBe('1000000000000000000');
    });

    it('converts decimal amounts', () => {
      expect(toAtomicAmount('1.5', 6)).toBe('1500000');
      expect(toAtomicAmount('0.000001', 6)).toBe('1');
    });

    it('handles zero', () => {
      expect(toAtomicAmount('0', 6)).toBe('0');
      expect(toAtomicAmount('0.0', 6)).toBe('0');
    });

    it('truncates excess decimals', () => {
      expect(toAtomicAmount('1.1234567', 6)).toBe('1123456');
    });

    it('handles amounts with no whole part', () => {
      expect(toAtomicAmount('0.5', 6)).toBe('500000');
    });

    it('handles zero decimals', () => {
      expect(toAtomicAmount('100', 0)).toBe('100');
    });
  });

  describe('fromAtomicAmount', () => {
    it('converts atomic to human-readable', () => {
      expect(fromAtomicAmount('100000000', 6)).toBe('100');
      expect(fromAtomicAmount('1500000', 6)).toBe('1.5');
    });

    it('handles small amounts', () => {
      expect(fromAtomicAmount('1', 6)).toBe('0.000001');
    });

    it('handles zero', () => {
      expect(fromAtomicAmount('0', 6)).toBe('0');
    });

    it('handles large amounts', () => {
      expect(fromAtomicAmount('1000000000000000000', 18)).toBe('1');
    });

    it('handles zero decimals', () => {
      expect(fromAtomicAmount('100', 0)).toBe('100');
    });

    it('strips trailing zeros', () => {
      expect(fromAtomicAmount('1000000', 6)).toBe('1');
      expect(fromAtomicAmount('1100000', 6)).toBe('1.1');
    });
  });

  describe('truncateAddress', () => {
    it('truncates long addresses', () => {
      expect(truncateAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe('0x1234...5678');
    });

    it('does not truncate short strings', () => {
      expect(truncateAddress('0x1234')).toBe('0x1234');
    });

    it('supports custom lengths', () => {
      expect(truncateAddress('0x1234567890abcdef1234567890abcdef12345678', 10, 6)).toBe(
        '0x12345678...345678',
      );
    });
  });

  describe('formatUsd', () => {
    it('formats USD amounts', () => {
      expect(formatUsd(1234.56)).toBe('$1,234.56');
      expect(formatUsd(0)).toBe('$0.00');
      expect(formatUsd(1000000)).toBe('$1,000,000.00');
    });
  });
});
