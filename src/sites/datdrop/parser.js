/**
 * DatDrop Data Parser
 * Transforms DatDrop API data to unified CaseData format
 *
 * Data structure from API:
 * - drop_case: { id, name, slug, price, chances: {...}, items: {...} }
 * - chances: { [itemId]: { steam_skin_item_id, chance } } - chance is out of 100,000
 * - items: { [itemId]: { id, name, cost, exterior, stat_trak, image, rarity } }
 */

const DatDropParser = {
    IMAGE_BASE_URL: 'https://datdrop.com/content/images/skin-items/',

    /**
     * Transform DatDrop API data to unified format
     * @param {Object} rawData - Raw case data from API
     * @returns {Object} - Unified CaseData object
     */
    transform(rawData) {
        if (!rawData) {
            return null;
        }

        const items = [];
        const chances = rawData.chances || {};
        const itemsData = rawData.items || {};

        // Iterate through items and match with chances
        Object.keys(itemsData).forEach(itemId => {
            const item = itemsData[itemId];
            const chanceData = chances[itemId];

            if (!item) return;

            // Parse the item name to extract weapon and skin
            const { weaponName, skinName } = this.parseItemName(item.name, item.exterior);

            // Calculate odds percentage (chance is out of 100,000)
            const odds = chanceData ? (chanceData.chance / 1000) : 0;

            items.push({
                id: item.id,
                weaponName: weaponName,
                skinName: skinName,
                wear: this.normalizeWear(item.exterior || ''),
                wearFull: item.exterior || '',
                isStattrak: item.stat_trak || false,
                price: this.convertPrice(item.cost),
                odds: odds,
                image: this.buildImageUrl(item.image),
                rarity: item.rarity || '',
                marketHashName: item.name || ''
            });
        });

        return {
            caseId: rawData.id || rawData.slug,
            caseName: rawData.name || 'Unknown Case',
            casePrice: this.convertPrice(rawData.price),
            items: items
        };
    },

    /**
     * Parse item name to extract weapon and skin name
     * Format: "USP-S | Whiteout (Minimal Wear)" or "USP-S | Whiteout"
     * @param {string} fullName - Full item name
     * @param {string} exterior - Exterior condition
     * @returns {Object} - { weaponName, skinName }
     */
    parseItemName(fullName, exterior) {
        if (!fullName) return { weaponName: '', skinName: '' };

        // Remove exterior from name if present
        let name = fullName;
        if (exterior) {
            name = name.replace(` (${exterior})`, '');
        }

        // Split by " | " to get weapon and skin
        const parts = name.split(' | ');
        if (parts.length >= 2) {
            return {
                weaponName: parts[0].trim(),
                skinName: parts.slice(1).join(' | ').trim()
            };
        }

        return { weaponName: name, skinName: '' };
    },

    /**
     * Convert price from cents to dollars
     * @param {number} priceInCents - Price in cents
     * @returns {number} - Price in dollars
     */
    convertPrice(priceInCents) {
        if (!priceInCents || typeof priceInCents !== 'number') return 0;
        return priceInCents / 100;
    },

    /**
     * Build full image URL
     * @param {string} imageHash - Image hash/filename
     * @returns {string} - Full image URL
     */
    buildImageUrl(imageHash) {
        if (!imageHash) return '';
        return `${this.IMAGE_BASE_URL}${imageHash}.webp`;
    },

    /**
     * Normalize wear condition to short format
     * @param {string} wear - Wear string
     * @returns {string} - Short wear format (FN, MW, FT, WW, BS)
     */
    normalizeWear(wear) {
        if (!wear) return '';

        const wearLower = wear.toLowerCase();

        if (wearLower.includes('factory new') || wearLower === 'fn') return 'FN';
        if (wearLower.includes('minimal wear') || wearLower === 'mw') return 'MW';
        if (wearLower.includes('field-tested') || wearLower.includes('field tested') || wearLower === 'ft') return 'FT';
        if (wearLower.includes('well-worn') || wearLower.includes('well worn') || wearLower === 'ww') return 'WW';
        if (wearLower.includes('battle-scarred') || wearLower.includes('battle scarred') || wearLower === 'bs') return 'BS';

        return wear;
    }
};

// Make available globally for content scripts
window.DatDropParser = DatDropParser;
