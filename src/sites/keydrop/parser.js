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
     * @param {number} exchangeRate - Exchange rate to normalize prices to USD (e.g., 1371 for ARS)
     * @returns {Object} - Unified CaseData object
     */
    transform(rawData, exchangeRate = 1) {
        if (!rawData) {
            return null;
        }

        // Normalize prices to USD by dividing by exchange rate
        // This ensures consistency with other sites and proper currency formatting
        const rate = exchangeRate > 0 ? exchangeRate : 1;

        const items = [];
        const rawItems = rawData.items || [];

        // Iterate through items and expand wear conditions
        rawItems.forEach(item => {
            if (!item || !item.pf) return;

            // Each item can have multiple wear conditions in the pf array
            item.pf.forEach(wearData => {
                const wear = this.normalizeWear(wearData.rarity || '');
                const wearFull = this.getFullWear(wearData.rarity || '');

                // Extract phase from fullTitle if it's a Doppler
                const phase = this.extractPhase(item.fullTitle);

                // Build market hash name (including phase if present)
                const marketHashName = this.buildMarketHashName(item.fullTitle, wearFull, phase);

                // Normalize price to USD
                const priceInLocalCurrency = wearData.price || 0;
                const priceInUsd = priceInLocalCurrency / rate;

                items.push({
                    id: `${item.id}_${wearData.rarity}`,
                    weaponName: (item.title || '').trim(),
                    skinName: (item.subtitle || '').trim(),
                    wear: wear,
                    wearFull: wearFull,
                    isStattrak: (item.fullTitle || '').includes('StatTrak'),
                    price: priceInUsd,
                    odds: wearData.odds || 0,
                    image: item.icon || '',
                    rarity: this.mapColorToRarity(item.color || ''),
                    marketHashName: marketHashName,
                    phase: phase
                });
            });
        });

        // Normalize case price to USD
        const casePriceInLocalCurrency = rawData.price || 0;
        const casePriceInUsd = casePriceInLocalCurrency / rate;

        return {
            caseId: rawData.id || rawData.slug,
            caseName: rawData.title || 'Unknown Case',
            casePrice: casePriceInUsd,
            items: items
        };
    },

    /**
     * Build market hash name from full title, wear, and phase
     * @param {string} fullTitle - Full item title like "M4A1-S | Printstream"
     * @param {string} wearFull - Full wear condition
     * @param {string|null} phase - Doppler phase if applicable
     * @returns {string} - Market hash name
     */
    buildMarketHashName(fullTitle, wearFull, phase) {
        if (!fullTitle) return '';

        let hashName = fullTitle.trim();

        // Strip phase from title if present (KeyDrop includes it as " - Phase 1" or similar)
        if (phase) {
            hashName = hashName
                .replace(/\s*-\s*Phase\s*\d/i, '')
                .replace(/\s*-\s*Ruby/i, '')
                .replace(/\s*-\s*Sapphire/i, '')
                .replace(/\s*-\s*Emerald/i, '')
                .replace(/\s*-\s*Black Pearl/i, '')
                .trim();
        }

        if (wearFull) {
            hashName = `${hashName} (${wearFull})`;
        }

        return hashName;
    },

    /**
     * Extract Doppler phase from full title
     * @param {string} fullTitle - Full item title
     * @returns {string|null} - Phase name or null
     */
    extractPhase(fullTitle) {
        if (!fullTitle) return null;

        // Check if it's a Doppler or Gamma Doppler
        if (!fullTitle.includes('Doppler')) return null;

        // Phase patterns to look for in the title
        const phasePatterns = [
            { pattern: /Phase 1/i, name: 'Phase 1' },
            { pattern: /Phase 2/i, name: 'Phase 2' },
            { pattern: /Phase 3/i, name: 'Phase 3' },
            { pattern: /Phase 4/i, name: 'Phase 4' },
            { pattern: /Ruby/i, name: 'Ruby' },
            { pattern: /Sapphire/i, name: 'Sapphire' },
            { pattern: /Emerald/i, name: 'Emerald' },
            { pattern: /Black Pearl/i, name: 'Black Pearl' }
        ];

        for (const { pattern, name } of phasePatterns) {
            if (pattern.test(fullTitle)) {
                return name;
            }
        }

        return null;
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
