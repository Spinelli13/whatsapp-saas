import { useState, useEffect } from 'react';

interface CachedData {
  timestamp: number;
  data: unknown;
  ttl: number;
}

export const offlineStorage = {
  set(key: string, data: unknown, ttlMinutes = 60): void {
    const item: CachedData = {
      timestamp: Date.now(),
      data,
      ttl: ttlMinutes * 60 * 1000,
    };
    try {
      localStorage.setItem(`offline:${key}`, JSON.stringify(item));
    } catch {
      // quota exceeded or private mode
    }
  },

  get(key: string): unknown | null {
    try {
      const raw = localStorage.getItem(`offline:${key}`);
      if (!raw) return null;
      const cached: CachedData = JSON.parse(raw);
      if (Date.now() - cached.timestamp > cached.ttl) {
        localStorage.removeItem(`offline:${key}`);
        return null;
      }
      return cached.data;
    } catch {
      return null;
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(`offline:${key}`);
    } catch {
      // silent
    }
  },

  clear(): void {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('offline:'))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // silent
    }
  },
};

export function useOfflineData<T>(key: string, fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(() => offlineStorage.get(key) as T | null);
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const result = await fetcher();
        if (!cancelled) {
          setData(result);
          offlineStorage.set(key, result, 60);
        }
      } catch {
        const cached = offlineStorage.get(key) as T | null;
        if (!cancelled && cached) setData(cached);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading };
}
