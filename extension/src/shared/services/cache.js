/**
 * Cache Service - Wrapper around chrome.storage.local
 * Provides get/set with expiration support
 */

const CacheService = {
    /**
     * Get a value from cache
     * @param {string} key - Cache key
     * @param {*} defaultValue - Default value if not found or expired
     * @returns {Promise<*>} - Cached value or default
     */
    async get(key, defaultValue = null) {
        return new Promise((resolve) => {
            chrome.storage.local.get([key], (result) => {
                if (chrome.runtime.lastError) {
                    console.error('[CSP Cache] Error getting:', chrome.runtime.lastError);
                    resolve(defaultValue);
                    return;
                }
                resolve(result[key] !== undefined ? result[key] : defaultValue);
            });
        });
    },

    /**
     * Set a value in cache
     * @param {string} key - Cache key
     * @param {*} value - Value to store
     * @returns {Promise<boolean>} - Success status
     */
    async set(key, value) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [key]: value }, () => {
                if (chrome.runtime.lastError) {
                    console.error('[CSP Cache] Error setting:', chrome.runtime.lastError);
                    resolve(false);
                    return;
                }
                resolve(true);
            });
        });
    },

    /**
     * Remove a value from cache
     * @param {string} key - Cache key
     * @returns {Promise<boolean>} - Success status
     */
    async remove(key) {
        return new Promise((resolve) => {
            chrome.storage.local.remove(key, () => {
                if (chrome.runtime.lastError) {
                    console.error('[CSP Cache] Error removing:', chrome.runtime.lastError);
                    resolve(false);
                    return;
                }
                resolve(true);
            });
        });
    },

    /**
     * Get cached data with expiration check
     * @param {string} key - Cache key
     * @param {number} maxAge - Max age in milliseconds
     * @returns {Promise<{data: *, expired: boolean}>}
     */
    async getWithExpiry(key, maxAge) {
        const timeKey = `${key}_time`;
        const [data, timestamp] = await Promise.all([
            this.get(key),
            this.get(timeKey, 0)
        ]);

        const now = Date.now();
        const expired = !timestamp || (now - timestamp) > maxAge;

        return { data, expired };
    },

    /**
     * Set cached data with timestamp
     * @param {string} key - Cache key
     * @param {*} value - Value to store
     * @returns {Promise<boolean>}
     */
    async setWithExpiry(key, value) {
        const timeKey = `${key}_time`;
        const results = await Promise.all([
            this.set(key, value),
            this.set(timeKey, Date.now())
        ]);
        return results.every(r => r);
    }
};

// Make available globally for content scripts
window.CacheService = CacheService;
