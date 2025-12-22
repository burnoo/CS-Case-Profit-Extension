/**
 * KeyDrop Data Parser
 * Transforms KeyDrop case data to unified CaseData format
 *
 * Data structure from window.__case:
 * - id, title, slug, price
 * - items: array of { id, fullTitle, title, subtitle, icon, color, pfPercent, pf: [...] }
 * - pf: array of { rarity (wear), price, odds }
 */

const KeyDropParser = {
    /**
     * Transform KeyDrop case data to unified format
     * @param {Object} rawData - Raw case data from window.__case
     * @returns {Object} - Unified CaseData object
     */
    transform(rawData) {
        if (!rawData) {
            return null;
        }

        const items = [];
        const rawItems = rawData.items || [];

        // Iterate through items and expand wear conditions
        rawItems.forEach(item => {
            if (!item || !item.pf) return;

            // Each item can have multiple wear conditions in the pf array
            item.pf.forEach(wearData => {
                const wear = this.normalizeWear(wearData.rarity || '');
                const wearFull = this.getFullWear(wearData.rarity || '');

                // Build market hash name
                const marketHashName = this.buildMarketHashName(item.fullTitle, wearFull);

                items.push({
                    id: `${item.id}_${wearData.rarity}`,
                    weaponName: (item.title || '').trim(),
                    skinName: (item.subtitle || '').trim(),
                    wear: wear,
                    wearFull: wearFull,
                    isStattrak: (item.fullTitle || '').includes('StatTrak'),
                    price: wearData.price || 0,
                    odds: wearData.odds || 0,
                    image: item.icon || '',
                    rarity: this.mapColorToRarity(item.color || ''),
                    marketHashName: marketHashName
                });
            });
        });

        return {
            caseId: rawData.id || rawData.slug,
            caseName: rawData.title || 'Unknown Case',
            casePrice: rawData.price || 0,
            items: items
        };
    },

    /**
     * Build market hash name from full title and wear
     * @param {string} fullTitle - Full item title like "M4A1-S | Printstream"
     * @param {string} wearFull - Full wear condition
     * @returns {string} - Market hash name
     */
    buildMarketHashName(fullTitle, wearFull) {
        if (!fullTitle) return '';
        if (!wearFull) return fullTitle.trim();
        return `${fullTitle.trim()} (${wearFull})`;
    },

    /**
     * Normalize wear condition to short format
     * @param {string} wear - Wear string (FN, MW, FT, WW, BS)
     * @returns {string} - Short wear format
     */
    normalizeWear(wear) {
        if (!wear) return '';

        const wearUpper = wear.toUpperCase();

        if (wearUpper === 'FN' || wearUpper.includes('FACTORY NEW')) return 'FN';
        if (wearUpper === 'MW' || wearUpper.includes('MINIMAL WEAR')) return 'MW';
        if (wearUpper === 'FT' || wearUpper.includes('FIELD-TESTED') || wearUpper.includes('FIELD TESTED')) return 'FT';
        if (wearUpper === 'WW' || wearUpper.includes('WELL-WORN') || wearUpper.includes('WELL WORN')) return 'WW';
        if (wearUpper === 'BS' || wearUpper.includes('BATTLE-SCARRED') || wearUpper.includes('BATTLE SCARRED')) return 'BS';

        return wear;
    },

    /**
     * Get full wear condition name
     * @param {string} wear - Short wear string
     * @returns {string} - Full wear name
     */
    getFullWear(wear) {
        if (!wear) return '';

        const wearMap = {
            'FN': 'Factory New',
            'MW': 'Minimal Wear',
            'FT': 'Field-Tested',
            'WW': 'Well-Worn',
            'BS': 'Battle-Scarred'
        };

        return wearMap[wear.toUpperCase()] || wear;
    },

    /**
     * Map KeyDrop color to rarity name
     * @param {string} color - Color from KeyDrop (gold, red, pink, violet, blue, light-blue)
     * @returns {string} - Rarity name
     */
    mapColorToRarity(color) {
        const colorMap = {
            'gold': 'Covert (Gold)',
            'red': 'Covert',
            'pink': 'Classified',
            'violet': 'Restricted',
            'purple': 'Restricted',
            'blue': 'Mil-Spec',
            'light-blue': 'Industrial Grade',
            'gray': 'Consumer Grade',
            'grey': 'Consumer Grade'
        };

        return colorMap[color.toLowerCase()] || color;
    }
};

// Make available globally for content scripts
window.KeyDropParser = KeyDropParser;
