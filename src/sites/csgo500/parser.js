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
    CDN_BASE_URL: 'https://cdnv1.csgo500.com',

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

        // Build image lookup map from case.items for fallback
        const imageMap = this.buildImageMap(caseData.items || []);

        // Use caseItems for detailed item info, fallback to case.items
        const items = caseItems.length > 0
            ? this.parseDetailedItems(caseItems, imageMap)
            : this.parseBasicItems(caseData.items || []);

        return {
            caseId: caseData._id || 'unknown',
            caseName: caseData.name || 'Unknown Case',
            casePrice: (caseData.price || 0) / 100,
            items: items
        };
    },

    /**
     * Build image lookup map from case.items array
     * Used as fallback for quantifiable items that don't have image in caseItems
     * @param {Array} items - case.items array
     * @returns {Map} - Map of itemId to image URL
     */
    buildImageMap(items) {
        const map = new Map();
        for (const item of items) {
            if (item.itemId && item.meta && item.meta.image) {
                map.set(item.itemId, item.meta.image);
            }
        }
        return map;
    },

    /**
     * Parse detailed items from caseItems array
     * @param {Array} caseItems - Detailed item array
     * @param {Map} imageMap - Fallback image map from case.items
     * @returns {Array} - Parsed items
     */
    parseDetailedItems(caseItems, imageMap = new Map()) {
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

            // Market hash name - use fullName if available (cleaned of garbage suffix)
            const marketHashName = details.fullName
                ? this.cleanFullName(details.fullName)
                : this.buildMarketHashName(
                    weaponName,
                    cleanSkinName,
                    wearFull,
                    false, // No StatTrak info in basic response
                    phase
                );

            // Resolve image URL (handle cdn:// prefix for non-Steam items)
            // Fallback to imageMap for quantifiable items that don't have image in caseItems
            // Note: caseItems uses _id, which matches itemId in case.items
            const rawImage = item.image || details.imageUrl || imageMap.get(item._id) || '';
            const resolvedImage = this.resolveImageUrl(rawImage);

            return {
                id: item._id || `csgo500-${idx}`,
                weaponName: weaponName,
                skinName: cleanSkinName,
                wear: wear,
                wearFull: wearFull,
                isStattrak: marketHashName.includes('StatTrak'),
                price: (item.price || 0) / 100,
                odds: item.odds || 0,
                image: resolvedImage,
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

            // Resolve image URL (handle cdn:// prefix for non-Steam items)
            const rawImage = meta.image || '';
            const resolvedImage = this.resolveImageUrl(rawImage);

            return {
                id: item.itemId || `csgo500-${idx}`,
                weaponName: weaponName,
                skinName: this.cleanSkinName(skinName),
                wear: '',
                wearFull: '',
                isStattrak: false,
                price: (item.price || 0) / 100,
                odds: item.odds || 0,
                image: resolvedImage,
                marketHashName: `${weaponName} | ${skinName}`,
                phase: phase
            };
        });
    },

    /**
     * Resolve image URL - converts cdn:// prefix to actual CDN URL
     * @param {string} imageUrl - Raw image URL from API
     * @returns {string} - Resolved image URL
     */
    resolveImageUrl(imageUrl) {
        if (!imageUrl) return '';

        // Handle cdn:// prefix (non-Steam custom items)
        if (imageUrl.startsWith('cdn://')) {
            return `${this.CDN_BASE_URL}/${imageUrl.substring(6)}`;
        }

        // Return as-is for Steam images and other URLs
        return imageUrl;
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
     * Clean fullName by removing garbage suffix added by CSGO500 API
     * The API appends " StatTrak Stat Trak" to StatTrak item names
     * @param {string} fullName - Full item name from API
     * @returns {string} - Cleaned name
     */
    cleanFullName(fullName) {
        if (!fullName) return '';

        return fullName
            .replace(/\s+StatTrak\s+Stat\s*Trak$/i, '')
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
        // Handle ★ prefix for knives/gloves - it must come before StatTrak™
        // Correct format: "★ StatTrak™ Weapon | Skin (Wear) Phase"
        let starPrefix = '';
        let cleanWeaponName = weaponName;

        if (weaponName.startsWith('★ ')) {
            starPrefix = '★ ';
            cleanWeaponName = weaponName.substring(2);
        }

        const stattrakPrefix = isStattrak ? 'StatTrak™ ' : '';

        // Handle vanilla items (no skin name)
        if (!skinName) {
            return `${starPrefix}${stattrakPrefix}${cleanWeaponName}`;
        }

        let hashName = `${starPrefix}${stattrakPrefix}${cleanWeaponName} | ${skinName}`;

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
