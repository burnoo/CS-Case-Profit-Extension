/**
 * CSGO500 Data Parser
 * Transforms API response to unified CaseData format
 *
 * API response format:
 * - case: { name, price (cents), items: [...] }
 * - caseItems: [{
 *     details: { weapon, skinName, exterior, shortExterior, quality, fullName },
 *     price (cents), odds, image, name, type
 *   }]
 */

const CSGO500Parser = {
    /**
     * Transform API response to unified format
     * @param {Object} rawData - Raw API response { case, caseItems }
     * @returns {Object|null} - Unified CaseData object
     */
    transform(rawData) {
        if (!rawData || !rawData.case) {
            return null;
        }

        const caseData = rawData.case;
        const caseItems = rawData.caseItems || [];

        // Use caseItems for detailed item info, fallback to case.items
        const items = caseItems.length > 0
            ? this.parseDetailedItems(caseItems)
            : this.parseBasicItems(caseData.items || []);

        return {
            caseId: caseData._id || 'unknown',
            caseName: caseData.name || 'Unknown Case',
            casePrice: (caseData.price || 0) / 100,
            items: items
        };
    },

    /**
     * Parse detailed items from caseItems array
     * @param {Array} caseItems - Detailed item array
     * @returns {Array} - Parsed items
     */
    parseDetailedItems(caseItems) {
        return caseItems.map((item, idx) => {
            const details = item.details || {};

            // Build weapon name with star prefix if needed
            const weaponName = details.quality === '★'
                ? `★ ${details.weapon}`
                : details.weapon || item.type || '';

            // Get skin name
            const skinName = details.skinName || item.name || '';

            // Extract phase from skin name for Doppler
            const phase = this.extractPhase(skinName);

            // Clean skin name
            const cleanSkinName = this.cleanSkinName(skinName);

            // Get wear info
            const wear = (details.shortExterior || '').toUpperCase();
            const wearFull = details.exterior || '';

            // Market hash name - use fullName if available
            const marketHashName = details.fullName || this.buildMarketHashName(
                weaponName,
                cleanSkinName,
                wearFull,
                false, // No StatTrak info in basic response
                phase
            );

            return {
                id: item._id || `csgo500-${idx}`,
                weaponName: weaponName,
                skinName: cleanSkinName,
                wear: wear,
                wearFull: wearFull,
                isStattrak: marketHashName.includes('StatTrak'),
                price: (item.price || 0) / 100,
                odds: item.odds || 0,
                image: item.image || details.imageUrl || '',
                marketHashName: marketHashName,
                phase: phase
            };
        });
    },

    /**
     * Parse basic items from case.items array (fallback)
     * @param {Array} items - Basic item array
     * @returns {Array} - Parsed items
     */
    parseBasicItems(items) {
        return items.map((item, idx) => {
            const meta = item.meta || {};

            // Build weapon name
            const weaponName = meta.type || 'Unknown';

            // Get skin name
            const skinName = meta.name || '';

            // Extract phase
            const phase = this.extractPhase(skinName);

            return {
                id: item.itemId || `csgo500-${idx}`,
                weaponName: weaponName,
                skinName: this.cleanSkinName(skinName),
                wear: '',
                wearFull: '',
                isStattrak: false,
                price: (item.price || 0) / 100,
                odds: item.odds || 0,
                image: meta.image || '',
                marketHashName: `${weaponName} | ${skinName}`,
                phase: phase
            };
        });
    },

    /**
     * Extract Doppler phase from skin name
     * @param {string} skinName - Skin name
     * @returns {string|null} - Phase or null
     */
    extractPhase(skinName) {
        if (!skinName || !skinName.toLowerCase().includes('doppler')) return null;

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
            if (pattern.test(skinName)) {
                return name;
            }
        }

        return null;
    },

    /**
     * Clean skin name by removing phase suffix
     * @param {string} skinName - Skin name
     * @returns {string} - Cleaned name
     */
    cleanSkinName(skinName) {
        if (!skinName) return '';

        return skinName
            .replace(/\s*-\s*(Phase \d|Ruby|Sapphire|Emerald|Black Pearl)$/i, '')
            .trim();
    },

    /**
     * Build market hash name
     * @param {string} weaponName - Weapon name
     * @param {string} skinName - Skin name
     * @param {string} exterior - Wear condition
     * @param {boolean} isStattrak - Is StatTrak
     * @param {string|null} phase - Doppler phase
     * @returns {string}
     */
    buildMarketHashName(weaponName, skinName, exterior, isStattrak, phase) {
        const prefix = isStattrak ? 'StatTrak™ ' : '';

        // Handle vanilla items (no skin name)
        if (!skinName) {
            return `${prefix}${weaponName}`;
        }

        let hashName = `${prefix}${weaponName} | ${skinName}`;

        if (exterior) {
            hashName = `${hashName} (${exterior})`;
        }

        if (phase) {
            hashName = `${hashName} ${phase}`;
        }

        return hashName;
    }
};

// Make available globally for content scripts
window.CSGO500Parser = CSGO500Parser;
