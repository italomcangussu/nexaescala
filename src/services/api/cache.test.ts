import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { fetchWithCache, invalidateCache, invalidateCacheExact, clearAllCache } from './cache';

describe('Cache Module', () => {
    const CACHE_PREFIX = 'nexaescala_cache_';

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        // Reset navigator.onLine to true
        vi.stubGlobal('navigator', { onLine: true });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('fetchWithCache', () => {
        it('fetches and caches data on first call', async () => {
            const mockData = { id: 1, name: 'Test' };
            const fetcher = vi.fn().mockResolvedValue(mockData);

            const result = await fetchWithCache('test-key', fetcher);

            expect(result).toEqual(mockData);
            expect(fetcher).toHaveBeenCalledTimes(1);
            expect(localStorage.getItem(CACHE_PREFIX + 'test-key')).toBeTruthy();
        });

        it('returns cached data on subsequent calls within TTL', async () => {
            const mockData = { id: 1, name: 'Test' };
            const fetcher = vi.fn().mockResolvedValue(mockData);

            // First call
            await fetchWithCache('test-key', fetcher);
            // Second call
            const result = await fetchWithCache('test-key', fetcher);

            expect(result).toEqual(mockData);
            expect(fetcher).toHaveBeenCalledTimes(1); // Should only be called once
        });

        it('bypasses cache when forceRefresh is true', async () => {
            const mockData = { id: 1, name: 'Test' };
            const fetcher = vi.fn().mockResolvedValue(mockData);

            // First call
            await fetchWithCache('test-key', fetcher);
            // Second call with forceRefresh
            await fetchWithCache('test-key', fetcher, true);

            expect(fetcher).toHaveBeenCalledTimes(2);
        });

        it('returns cached data when offline', async () => {
            const mockData = { id: 1, name: 'Test' };
            const fetcher = vi.fn().mockResolvedValue(mockData);

            // First call while online
            await fetchWithCache('test-key', fetcher);

            // Go offline
            vi.stubGlobal('navigator', { onLine: false });

            // Second call while offline (should use cache even if expired)
            const result = await fetchWithCache('test-key', fetcher);

            expect(result).toEqual(mockData);
            expect(fetcher).toHaveBeenCalledTimes(1);
        });

        it('uses cache as fallback when fetch fails', async () => {
            const mockData = { id: 1, name: 'Test' };
            const fetcher = vi.fn()
                .mockResolvedValueOnce(mockData)
                .mockRejectedValueOnce(new Error('Network error'));

            // First call succeeds
            await fetchWithCache('test-key', fetcher, true);

            // Second call fails, should return cached data
            const result = await fetchWithCache('test-key', fetcher, true);

            expect(result).toEqual(mockData);
        });

        it('throws error when fetch fails and no cache exists', async () => {
            const fetcher = vi.fn().mockRejectedValue(new Error('Network error'));

            await expect(fetchWithCache('test-key', fetcher)).rejects.toThrow('Network error');
        });

        it('handles invalid cache data gracefully', async () => {
            const mockData = { id: 1, name: 'Test' };
            const fetcher = vi.fn().mockResolvedValue(mockData);

            // Set invalid cache
            localStorage.setItem(CACHE_PREFIX + 'test-key', 'invalid-json');

            const result = await fetchWithCache('test-key', fetcher);

            expect(result).toEqual(mockData);
            expect(fetcher).toHaveBeenCalledTimes(1);
        });
    });

    describe('invalidateCache', () => {
        it('removes cache entries matching pattern', () => {
            localStorage.setItem(CACHE_PREFIX + 'groups_123', JSON.stringify({ data: 1 }));
            localStorage.setItem(CACHE_PREFIX + 'groups_456', JSON.stringify({ data: 2 }));
            localStorage.setItem(CACHE_PREFIX + 'shifts_123', JSON.stringify({ data: 3 }));

            invalidateCache('groups');

            expect(localStorage.getItem(CACHE_PREFIX + 'groups_123')).toBeNull();
            expect(localStorage.getItem(CACHE_PREFIX + 'groups_456')).toBeNull();
            expect(localStorage.getItem(CACHE_PREFIX + 'shifts_123')).toBeTruthy();
        });

        it('does not remove non-cache items', () => {
            localStorage.setItem('other_key', 'value');
            localStorage.setItem(CACHE_PREFIX + 'test', JSON.stringify({ data: 1 }));

            invalidateCache('test');

            expect(localStorage.getItem('other_key')).toBe('value');
        });
    });

    describe('invalidateCacheExact', () => {
        it('removes only the exact cache key', () => {
            localStorage.setItem(CACHE_PREFIX + 'test-key', JSON.stringify({ data: 1 }));
            localStorage.setItem(CACHE_PREFIX + 'test-key-2', JSON.stringify({ data: 2 }));

            invalidateCacheExact('test-key');

            expect(localStorage.getItem(CACHE_PREFIX + 'test-key')).toBeNull();
            expect(localStorage.getItem(CACHE_PREFIX + 'test-key-2')).toBeTruthy();
        });
    });

    describe('clearAllCache', () => {
        it('removes all cache entries', () => {
            localStorage.setItem(CACHE_PREFIX + 'key1', JSON.stringify({ data: 1 }));
            localStorage.setItem(CACHE_PREFIX + 'key2', JSON.stringify({ data: 2 }));
            localStorage.setItem('other_key', 'value');

            clearAllCache();

            expect(localStorage.getItem(CACHE_PREFIX + 'key1')).toBeNull();
            expect(localStorage.getItem(CACHE_PREFIX + 'key2')).toBeNull();
            expect(localStorage.getItem('other_key')).toBe('value');
        });
    });
});
