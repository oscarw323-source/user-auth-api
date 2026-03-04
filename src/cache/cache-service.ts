type CacheEntry<T> = {
  data: T;
  expiredAt: number;
};

class CacheService {
  private cache = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T, ttlSecond: number): void {
    this.cache.set(key, {
      data,
      expiredAt: Date.now() + ttlSecond * 1000,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiredAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiredAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }
}

export const cacheService = new CacheService();
