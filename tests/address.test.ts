import { describe, it, expect } from 'vitest';
import { validateAddress } from '../src/validation/address.js';

describe('Address Validation', () => {
  describe('EVM chains', () => {
    const evmChains = [
      'ethereum', 'base', 'arbitrum', 'bnb', 'polygon',
      'optimism', 'avalanche', 'gnosis', 'berachain', 'monad', 'aurora', 'xlayer',
    ] as const;

    for (const chain of evmChains) {
      it(`validates ${chain} addresses`, () => {
        expect(validateAddress(chain, '0x1234567890abcdef1234567890abcdef12345678')).toBe(true);
        expect(validateAddress(chain, '0xABCDEF1234567890ABCDEF1234567890ABCDEF12')).toBe(true);
      });

      it(`rejects invalid ${chain} addresses`, () => {
        expect(validateAddress(chain, '1234567890abcdef1234567890abcdef12345678')).toBe(false);
        expect(validateAddress(chain, '0x1234')).toBe(false);
        expect(validateAddress(chain, '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG')).toBe(false);
        expect(validateAddress(chain, '')).toBe(false);
      });
    }
  });

  describe('Solana', () => {
    it('validates valid Solana addresses', () => {
      expect(validateAddress('solana', '7xKpfrBykARtSFm4CPp5xPDt5gTbch3YQFaMGePGgm3N')).toBe(true);
      expect(validateAddress('solana', '11111111111111111111111111111111')).toBe(true);
    });

    it('rejects invalid Solana addresses', () => {
      expect(validateAddress('solana', '0xinvalid')).toBe(false);
      expect(validateAddress('solana', 'short')).toBe(false);
      expect(validateAddress('solana', '')).toBe(false);
    });
  });

  describe('Sui', () => {
    it('validates valid Sui addresses', () => {
      const addr = '0x' + 'a'.repeat(64);
      expect(validateAddress('sui', addr)).toBe(true);
    });

    it('rejects invalid Sui addresses', () => {
      expect(validateAddress('sui', '0x' + 'a'.repeat(40))).toBe(false);
      expect(validateAddress('sui', '0x1234')).toBe(false);
    });
  });

  describe('NEAR', () => {
    it('validates named accounts', () => {
      expect(validateAddress('near', 'alice.near')).toBe(true);
      expect(validateAddress('near', 'goblink.near')).toBe(true);
      expect(validateAddress('near', 'sub.account.near')).toBe(true);
      expect(validateAddress('near', 'ab')).toBe(true); // min 2 chars
    });

    it('validates implicit accounts (64 hex chars)', () => {
      expect(validateAddress('near', 'a'.repeat(64))).toBe(true);
    });

    it('rejects invalid NEAR addresses', () => {
      expect(validateAddress('near', 'A')).toBe(false); // too short
      expect(validateAddress('near', 'UPPERCASE.near')).toBe(false);
      expect(validateAddress('near', '')).toBe(false);
    });
  });

  describe('Bitcoin', () => {
    it('validates valid Bitcoin addresses', () => {
      expect(validateAddress('bitcoin', 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')).toBe(true);
      expect(validateAddress('bitcoin', '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2')).toBe(true);
      expect(validateAddress('bitcoin', '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy')).toBe(true);
    });

    it('rejects invalid Bitcoin addresses', () => {
      expect(validateAddress('bitcoin', '0xinvalid')).toBe(false);
      expect(validateAddress('bitcoin', 'bc')).toBe(false);
      expect(validateAddress('bitcoin', '')).toBe(false);
    });
  });

  describe('Tron', () => {
    it('validates valid Tron addresses', () => {
      expect(validateAddress('tron', 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb')).toBe(true);
    });

    it('rejects invalid Tron addresses', () => {
      expect(validateAddress('tron', '0xinvalid')).toBe(false);
      expect(validateAddress('tron', 'Tshort')).toBe(false);
    });
  });

  describe('TON', () => {
    it('validates valid TON addresses', () => {
      expect(validateAddress('ton', 'EQ' + 'a'.repeat(46))).toBe(true);
      expect(validateAddress('ton', 'UQ' + 'B'.repeat(46))).toBe(true);
    });

    it('rejects invalid TON addresses', () => {
      expect(validateAddress('ton', 'XX' + 'a'.repeat(46))).toBe(false);
      expect(validateAddress('ton', 'EQshort')).toBe(false);
    });
  });

  describe('Stellar', () => {
    it('validates valid Stellar addresses', () => {
      expect(validateAddress('stellar', 'G' + 'A'.repeat(55))).toBe(true);
      expect(validateAddress('stellar', 'G' + 'B2C3D4E5F6'.repeat(5) + 'ABCDE')).toBe(true);
    });

    it('rejects invalid Stellar addresses', () => {
      expect(validateAddress('stellar', 'Gshort')).toBe(false);
      expect(validateAddress('stellar', 'X' + 'A'.repeat(55))).toBe(false);
    });
  });

  describe('XRP', () => {
    it('validates valid XRP addresses', () => {
      expect(validateAddress('xrp', 'rN7n3473SaZBCG4dFL83w7p1W9cgPJKXuR')).toBe(true);
    });

    it('rejects invalid XRP addresses', () => {
      expect(validateAddress('xrp', 'xrp_invalid')).toBe(false);
      expect(validateAddress('xrp', 'r')).toBe(false);
    });
  });

  describe('Starknet', () => {
    it('validates valid Starknet addresses', () => {
      expect(validateAddress('starknet', '0x' + '1'.repeat(64))).toBe(true);
      expect(validateAddress('starknet', '0x1')).toBe(true);
    });

    it('rejects invalid Starknet addresses', () => {
      expect(validateAddress('starknet', 'invalid')).toBe(false);
      expect(validateAddress('starknet', '0x' + 'g'.repeat(64))).toBe(false);
    });
  });

  describe('Aptos', () => {
    it('validates valid Aptos addresses', () => {
      expect(validateAddress('aptos', '0x' + 'a'.repeat(64))).toBe(true);
      expect(validateAddress('aptos', '0x1')).toBe(true);
    });

    it('rejects invalid Aptos addresses', () => {
      expect(validateAddress('aptos', 'invalid')).toBe(false);
    });
  });

  describe('unknown chains', () => {
    it('accepts any address for chains without validation patterns', () => {
      expect(validateAddress('cardano' as any, 'addr1whatever')).toBe(true);
      expect(validateAddress('aleo' as any, 'aleo1xxx')).toBe(true);
    });
  });
});
