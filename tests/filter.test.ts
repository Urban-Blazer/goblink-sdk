import { describe, it, expect } from 'vitest';
import { filterTokens } from '../src/tokens/filter.js';
import type { Token } from '../src/tokens/types.js';

function makeToken(overrides: Partial<Token> = {}): Token {
  return {
    assetId: 'ethereum:usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    chain: 'ethereum',
    decimals: 6,
    ...overrides,
  };
}

const tokens: Token[] = [
  makeToken({ assetId: 'ethereum:usdc', symbol: 'USDC', name: 'USD Coin', chain: 'ethereum' }),
  makeToken({ assetId: 'ethereum:usdt', symbol: 'USDT', name: 'Tether USD', chain: 'ethereum' }),
  makeToken({ assetId: 'ethereum:eth', symbol: 'ETH', name: 'Ether', chain: 'ethereum' }),
  makeToken({ assetId: 'solana:usdc', symbol: 'USDC', name: 'USD Coin', chain: 'solana' }),
  makeToken({ assetId: 'solana:sol', symbol: 'SOL', name: 'Solana', chain: 'solana' }),
  makeToken({ assetId: 'bitcoin:btc', symbol: 'BTC', name: 'Bitcoin', chain: 'bitcoin' }),
];

describe('Token Filtering', () => {
  it('returns all tokens when no filter is applied', () => {
    const result = filterTokens(tokens);
    expect(result).toHaveLength(6);
  });

  it('filters by chain', () => {
    const result = filterTokens(tokens, { chain: 'ethereum' });
    expect(result).toHaveLength(3);
    expect(result.every((t) => t.chain === 'ethereum')).toBe(true);
  });

  it('filters by chain — solana', () => {
    const result = filterTokens(tokens, { chain: 'solana' });
    expect(result).toHaveLength(2);
  });

  it('returns empty array for chain with no tokens', () => {
    const result = filterTokens(tokens, { chain: 'sui' });
    expect(result).toHaveLength(0);
  });

  it('searches by symbol (case-insensitive)', () => {
    const result = filterTokens(tokens, { search: 'usdc' });
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.symbol === 'USDC')).toBe(true);
  });

  it('searches by name', () => {
    const result = filterTokens(tokens, { search: 'Bitcoin' });
    expect(result).toHaveLength(1);
    expect(result[0]?.symbol).toBe('BTC');
  });

  it('combines chain and search filters', () => {
    const result = filterTokens(tokens, { chain: 'ethereum', search: 'usd' });
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.chain === 'ethereum')).toBe(true);
  });

  it('deduplicates tokens with same chain + symbol', () => {
    const dupes: Token[] = [
      makeToken({ assetId: 'ethereum:usdc', symbol: 'USDC', chain: 'ethereum', address: '0x111' }),
      makeToken({ assetId: 'ethereum:usdc', symbol: 'USDC', chain: 'ethereum', address: '0x222' }),
    ];
    const result = filterTokens(dupes);
    expect(result).toHaveLength(1);
  });
});
