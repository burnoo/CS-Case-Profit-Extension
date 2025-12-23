/**
 * CSGO.net Data Parser
 * Transforms scraped DOM data to unified CaseData format
 *
 * Note: csgo.net doesn't provide:
 * - Individual item odds (calculated based on rarity)
 * - Wear/exterior info (not displayed)
 */

const CSGONetParser = {
    // Approximate odds by rarity (based on typical CS case distributions)
    rarityOdds: {
        'covert': 0.26,        // ~0.26% per covert item (red)
        'classified': 3.2,     // ~3.2% per classified item (pink)
        'restricted': 15.98,   // ~15.98% per restricted item (purple)
        'milspec': 79.92,      // ~79.92% per milspec item (blue)
        'industrial': 79.92,
        'consumer': 79.92,
        'contraband': 0.26,
        'extraordinary': 0.26,
        'unknown': 10
    },

    /**
     * Transform scraped data to unified format
     * @param {Object} rawData - Raw scraped data
     * @returns {Object|null} - Unified CaseData object
     */
    transform(rawData) {
        if (!rawData || !rawData.items || rawData.items.length === 0) {
            return null;
        }

        // Count items per rarity to calculate individual odds
        const rarityCounts = {};
        rawData.items.forEach(item => {
            rarityCounts[item.rarity] = (rarityCounts[item.rarity] || 0) + 1;
        });

        const items = rawData.items.map(item => this.parseItem(item, rarityCounts));

        return {
            caseId: this.getCaseSlug() || 'unknown',
            caseName: rawData.name || 'Unknown Case',
            casePrice: rawData.price || 0,
            items: items
        };
    },

    /**
     * Parse a single item
     * @param {Object} item - Raw item from scraper
     * @param {Object} rarityCounts - Count of items per rarity
     * @returns {Object} - Parsed item
     */
    parseItem(item, rarityCounts) {
        // Calculate odds based on rarity
        const totalRarityOdds = this.rarityOdds[item.rarity] || 10;
        const itemsInRarity = rarityCounts[item.rarity] || 1;
        const odds = totalRarityOdds / itemsInRarity;

        // Build market hash name for price lookup
        const marketHashName = this.buildMarketHashName(item.weapon, item.skinName);

        return {
            id: item.id,
            weaponName: item.weapon,
            skinName: item.skinName,
            wear: '',           // Not available on csgo.net
            wearFull: '',       // Not available on csgo.net
            isStattrak: false,  // Would need to check name for "StatTrak"
            isSouvenir: false,
            price: item.price,
            odds: odds,
            image: item.image || '',
            marketHashName: marketHashName,
            phase: null
        };
    },

    /**
     * Build market hash name for price lookup
     * @param {string} weapon - Weapon name
     * @param {string} skinName - Skin name
     * @returns {string} - Market hash name
     */
    buildMarketHashName(weapon, skinName) {
        if (!weapon) return '';
        if (!skinName) return weapon;
        return `${weapon} | ${skinName}`;
    },

    /**
     * Get case slug from URL
     * @returns {string|null}
     */
    getCaseSlug() {
        const match = window.location.pathname.match(/\/case\/([^/]+)/);
        return match ? match[1] : null;
    }
};

// Make available globally for content scripts
window.CSGONetParser = CSGONetParser;
