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
     * @param {string} weaponName - Weapon name (e.g., "AK-47" or "★ Karambit")
     * @param {string} skinName - Skin name (e.g., "Bloodsport")
     * @param {string} exterior - Exterior/wear (e.g., "Factory New")
     * @param {boolean} isStattrak - Whether item is StatTrak
     * @returns {string} - Market hash name
     */
    getMarketHashName(weaponName, skinName, exterior, isStattrak) {
        // Handle ★ prefix for knives/gloves - must come before StatTrak™
        // Correct format: "★ StatTrak™ Weapon | Skin (Wear)"
        let starPrefix = '';
        let cleanWeaponName = weaponName || '';

        // Check for various star characters (U+2605 ★, U+2606 ☆, etc.)
        const starMatch = cleanWeaponName.match(/^(\u2605|\u2606|\u22C6|\*)\s*/);
        if (starMatch) {
            starPrefix = '★ ';
            cleanWeaponName = cleanWeaponName.substring(starMatch[0].length);
        }

        const stattrakPrefix = isStattrak ? 'StatTrak™ ' : '';

        // Don't include wear for items without it (stickers, etc.)
        if (!exterior || exterior === '') {
            return `${starPrefix}${stattrakPrefix}${cleanWeaponName} | ${skinName}`;
        }
        return `${starPrefix}${stattrakPrefix}${cleanWeaponName} | ${skinName} (${exterior})`;
    },

    /**
     * Get real price for an item
     * @param {string} weaponName - Weapon name
     * @param {string} skinName - Skin name
     * @param {string} exterior - Exterior/wear
     * @param {boolean} isStattrak - Whether item is StatTrak
     * @param {string} [marketHashName] - Optional direct market hash name (used for stickers, etc.)
     * @param {string} [phase] - Doppler phase (e.g., "Phase 1", "Ruby", "Sapphire", "Emerald", "Black Pearl")
     * @returns {number|null} - Price in USD or null if not found
     */
    getRealPrice(weaponName, skinName, exterior, isStattrak, marketHashName, phase) {
        if (!this.prices) return null;

        // Use provided market hash name directly, or build from parts
        let hashName = marketHashName || this.getMarketHashName(weaponName, skinName, exterior, isStattrak);

        // If phase is provided, strip it from the hash name for lookup
        // Market hash names from sites may include phase like "★ Gut Knife | Doppler (Factory New) Phase 2"
        // But csgotrader uses "★ Gut Knife | Doppler (Factory New)" with a nested doppler object
        if (phase) {
            hashName = this.stripPhaseFromHashName(hashName);
        }

        const item = this.prices[hashName];
        if (!item) return null;

        // Check if this is a Doppler with phase pricing
        if (item.doppler && phase) {
            const dopplerPrice = item.doppler[phase];
            if (dopplerPrice !== null && dopplerPrice !== undefined) {
                return dopplerPrice;
            }
            return null;
        }

        // Regular price lookup
        if (item.price === null || item.price === undefined) return null;
        return item.price;
    },

    /**
     * Strip phase suffix from market hash name
     * @param {string} hashName - Market hash name possibly containing phase
     * @returns {string} - Market hash name without phase suffix
     */
    stripPhaseFromHashName(hashName) {
        // Remove phase suffixes like " Phase 1", " Phase 2", " Ruby", " Sapphire", " Emerald", " Black Pearl"
        const phasePatterns = [
            / Phase \d$/,
            / Ruby$/,
            / Sapphire$/,
            / Emerald$/,
            / Black Pearl$/
        ];

        for (const pattern of phasePatterns) {
            if (pattern.test(hashName)) {
                return hashName.replace(pattern, '');
            }
        }

        return hashName;
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
