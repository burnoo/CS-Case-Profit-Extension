/**
 * Pricing Service - Fetches and caches real prices from CSGOTrader
 */

const PricingService = {
    CACHE_KEY: 'csp_csgotrader_prices',
    CACHE_DURATION: 6 * 60 * 60 * 1000, // 6 hours
    CSGOTRADER_URL: 'https://prices.csgotrader.app/latest/csgotrader.json',

    // Cached prices in memory
    prices: null,

    /**
     * Fetch real prices from CSGOTrader (with caching)
     * @returns {Promise<Object|null>} - Price data or null on error
     */
    async fetchPrices() {
        // Return cached prices if already loaded
        if (this.prices) {
            return this.prices;
        }

        // Check storage cache
        const cached = await CacheService.getWithExpiry(this.CACHE_KEY, this.CACHE_DURATION);
        if (!cached.expired && cached.data) {
            console.log('[CSP Pricing] Using cached CSGOTrader prices');
            this.prices = cached.data;
            return this.prices;
        }

        // Fetch fresh data via background script (avoids CORS issues)
        console.log('[CSP Pricing] Fetching fresh CSGOTrader prices via background...');
        try {
            const result = await chrome.runtime.sendMessage({
                type: 'FETCH_URL',
                url: this.CSGOTRADER_URL
            });

            if (!result.success) {
                throw new Error(result.error || 'Unknown error');
            }

            this.prices = result.data;

            // Cache the data
            await CacheService.setWithExpiry(this.CACHE_KEY, this.prices);
            console.log('[CSP Pricing] CSGOTrader prices cached');

            return this.prices;
        } catch (error) {
            console.error('[CSP Pricing] Error fetching prices:', error);
            return null;
        }
    },

    /**
     * Build market hash name for a CS item
     * @param {string} weaponName - Weapon name (e.g., "AK-47")
     * @param {string} skinName - Skin name (e.g., "Bloodsport")
     * @param {string} exterior - Exterior/wear (e.g., "Factory New")
     * @param {boolean} isStattrak - Whether item is StatTrak
     * @returns {string} - Market hash name
     */
    getMarketHashName(weaponName, skinName, exterior, isStattrak) {
        const prefix = isStattrak ? 'StatTrak™ ' : '';
        // Don't include wear for items without it (stickers, etc.)
        if (!exterior || exterior === '') {
            return `${prefix}${weaponName} | ${skinName}`;
        }
        return `${prefix}${weaponName} | ${skinName} (${exterior})`;
    },

    /**
     * Get real price for an item
     * @param {string} weaponName - Weapon name
     * @param {string} skinName - Skin name
     * @param {string} exterior - Exterior/wear
     * @param {boolean} isStattrak - Whether item is StatTrak
     * @returns {number|null} - Price in USD or null if not found
     */
    getRealPrice(weaponName, skinName, exterior, isStattrak) {
        if (!this.prices) return null;
        const hashName = this.getMarketHashName(weaponName, skinName, exterior, isStattrak);
        const item = this.prices[hashName];
        if (!item || item.price === null || item.price === undefined) return null;
        return item.price;
    },

    /**
     * Clear cached prices
     */
    async clearCache() {
        this.prices = null;
        await CacheService.remove(this.CACHE_KEY);
        await CacheService.remove(`${this.CACHE_KEY}_time`);
    }
};

// Make available globally for content scripts
window.PricingService = PricingService;
