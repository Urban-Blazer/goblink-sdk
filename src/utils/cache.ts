interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/** Simple in-memory TTL cache */
export class TTLCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;

  /**
   * Create a new TTL cache
   * @param ttlMs - Time to live in milliseconds (default: 5 minutes)
   */
  constructor(ttlMs = 5 * 60 * 1000) {
    this.ttlMs = ttlMs;
  }

  /** Get a cached value, or undefined if expired/missing */
  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /** Set a value in the cache */
  set(key: string, value: T): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  /** Clear all cached entries */
  clear(): void {
    this.store.clear();
  }
}
