import type { Token, TokenFilterOptions } from './types.js';

/**
 * Filter and deduplicate a list of tokens
 * @param tokens - Full token list
 * @param options - Filter options
 * @returns Filtered and deduplicated tokens
 */
export function filterTokens(tokens: Token[], options: TokenFilterOptions = {}): Token[] {
  let result = tokens;

  if (options.chain) {
    result = result.filter((t) => t.chain === options.chain);
  }

  if (options.search) {
    const q = options.search.toLowerCase();
    result = result.filter(
      (t) => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q),
    );
  }

  return deduplicateTokens(result);
}

/** Remove duplicate tokens (same chain + symbol), keeping first occurrence */
function deduplicateTokens(tokens: Token[]): Token[] {
  const seen = new Set<string>();
  const unique: Token[] = [];

  for (const token of tokens) {
    const key = `${token.chain}:${token.symbol.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(token);
    }
  }

  return unique;
}
