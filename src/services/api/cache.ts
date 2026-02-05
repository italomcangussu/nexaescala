// --- CACHE HELPER ---
const CACHE_PREFIX = 'nexaescala_cache_';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

interface CacheEntry<T> {
    timestamp: number;
    data: T;
}

export const fetchWithCache = async <T>(
    key: string,
    fetcher: () => Promise<T>,
    forceRefresh = false
): Promise<T> => {
    const cacheKey = CACHE_PREFIX + key;

    // Check cache first (if not forcing refresh and online)
    if (!forceRefresh) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const parsed: CacheEntry<T> = JSON.parse(cached);
                const age = Date.now() - parsed.timestamp;

                // If online and cache is fresh, use it
                if (navigator.onLine && age < CACHE_TTL_MS) {
                    return parsed.data;
                }

                // If offline, use cache regardless of age
                if (!navigator.onLine) {
                    return parsed.data;
                }
            } catch {
                // Invalid cache entry, will refetch
            }
        }
    }

    try {
        // Fetch fresh data
        const data = await fetcher();

        // Save to cache
        try {
            localStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                data
            }));
        } catch {
            // LocalStorage full or unavailable, continue without caching
        }

        return data;
    } catch (error) {
        // If network fails, try cache as fallback
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const parsed: CacheEntry<T> = JSON.parse(cached);
            return parsed.data;
        }
        throw error;
    }
};

// Cache invalidation helpers
export const invalidateCache = (keyPattern: string): void => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX) && key.includes(keyPattern)) {
            localStorage.removeItem(key);
        }
    });
};

export const invalidateCacheExact = (key: string): void => {
    localStorage.removeItem(CACHE_PREFIX + key);
};

export const clearAllCache = (): void => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
            localStorage.removeItem(key);
        }
    });
};
