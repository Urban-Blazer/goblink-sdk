import { ApiClient } from '../internal/api-client.js';
import { AssetMapper } from '../internal/asset-mapping.js';
import { TTLCache } from '../utils/cache.js';
import type { Token } from './types.js';

/** Fetches and caches the token list from the upstream API */
export class TokenListProvider {
  private readonly apiClient: ApiClient;
  private readonly mapper: AssetMapper;
  private readonly cache: TTLCache<Token[]>;
  private initialized = false;

  constructor(apiClient: ApiClient, mapper: AssetMapper, cacheTtlMs?: number) {
    this.apiClient = apiClient;
    this.mapper = mapper;
    this.cache = new TTLCache<Token[]>(cacheTtlMs);
  }

  /** Get all tokens, fetching from API if not cached */
  async getTokens(): Promise<Token[]> {
    const cached = this.cache.get('tokens');
    if (cached) return cached;

    const protocolTokens = await this.apiClient.getTokens();
    this.mapper.buildFromProtocolTokens(protocolTokens);
    const tokens = this.mapper.getAllTokens();
    this.cache.set('tokens', tokens);
    this.initialized = true;
    return tokens;
  }

  /** Ensure the token list has been loaded at least once */
  async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.getTokens();
    }
  }

  /** Clear the cached token list */
  clearCache(): void {
    this.cache.clear();
    this.initialized = false;
  }
}
