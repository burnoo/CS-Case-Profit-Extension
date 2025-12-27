/**
 * Skin.Club Data Parser
 * Transforms Skin.Club Nuxt payload data to unified CaseData format
 *
 * Data structure from Nuxt payload:
 * - Case: { id, name, title, price, last_successful_generation: { contents: [...] } }
 * - Item: { chance_percent, chance, item: { market_hash_name, name, finish, price, exterior, phase, file } }
 */

const SkinClubParser = {
    /**
     * Transform Skin.Club Nuxt payload to unified format
     * @param {Object} rawData - Raw case data from Nuxt payload
     * @returns {Object} - Unified CaseData object
     */
    transform(rawData) {
        if (!rawData) {
            return null;
        }

        const items = [];

        // Items are in last_successful_generation.contents
        const itemList = rawData.last_successful_generation?.contents || [];

        itemList.forEach(content => {
            const item = content.item;
            if (!item) return;

            // Check for StatTrak in market_hash_name
            const isStattrak = item.market_hash_name?.includes('StatTrak™') || false;

            // Build image URL from file path
            const imagePath = item.file?.path || '';
            const imageUrl = imagePath ? `https://cfdn.skin.club/${imagePath}` : '';

            items.push({
                id: item.id,
                weaponName: item.name || '',           // e.g., "★ Shadow Daggers"
                skinName: item.finish || '',           // e.g., "Urban Masked"
                wear: this.normalizeWear(item.exterior || ''),
                wearFull: item.exterior || '',         // e.g., "Minimal Wear"
                isStattrak: isStattrak,
                price: this.convertPrice(item.price),  // Convert from cents to dollars
                odds: this.convertOdds(content.chance, content.chance_percent),
                image: imageUrl,
                // Additional fields for display
                phase: item.phase || null,             // e.g., "Phase 3", "Ruby", "Sapphire"
                rarity: item.rarity_site || item.rarity || '',
                quality: item.quality || '',
                marketHashName: item.market_hash_name || ''
            });
        });

        return {
            caseId: rawData.id || rawData.name,
            caseName: rawData.title || rawData.name || 'Unknown Case',
            casePrice: this.convertPrice(rawData.price),  // Convert from cents to dollars
            items: items
        };
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
     * Convert odds to percentage (0-100)
     * Skin.Club uses chance out of 1,000,000 or chance_percent as string
     * @param {number} chance - Chance value (out of 1,000,000)
     * @param {string} chancePercent - Chance as percentage string (e.g., "5.000")
     * @returns {number} - Odds as percentage (0-100)
     */
    convertOdds(chance, chancePercent) {
        // Prefer chance_percent if available (more precise)
        if (chancePercent) {
            const percent = parseFloat(chancePercent);
            if (!isNaN(percent)) {
                return percent;
            }
        }

        // Fallback to calculating from chance (out of 1,000,000)
        if (chance && typeof chance === 'number') {
            return (chance / 1000000) * 100;
        }

        return 0;
    },

    /**
     * Normalize wear condition to short format
     * @param {string} wear - Wear string in any format
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
window.SkinClubParser = SkinClubParser;
