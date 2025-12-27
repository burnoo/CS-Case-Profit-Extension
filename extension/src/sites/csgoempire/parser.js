/**
 * CSGOEmpire Data Parser
 * Transforms API response to unified CaseData format
 *
 * API response format:
 * - case_name: string
 * - total_price: number (cents)
 * - slug: string
 * - items: array of {
 *     price: number (cents),
 *     chance: number (percentage, e.g., 0.01 = 0.01%),
 *     item_type: string (weapon name),
 *     item_name: string (skin name, includes phase for Dopplers),
 *     item_wear: string (full wear name),
 *     is_stattrak: boolean,
 *     has_star: boolean,
 *     image_url: string (Steam image hash)
 *   }
 */

const CSGOEmpireParser = {
    STEAM_IMAGE_BASE: 'https://community.cloudflare.steamstatic.com/economy/image/',

    /**
     * Transform API response to unified format
     * @param {Object} rawData - Raw API response data
     * @param {number} coinToUsd - Conversion rate from empire coins to USD (default: 0.5408 = €0.52 * 1.04)
     * @returns {Object|null} - Unified CaseData object
     */
    transform(rawData, coinToUsd = 0.5408) {
        if (!rawData || !rawData.items) {
            return null;
        }

        const items = rawData.items.map((item, idx) => {
            // Check if this is a vanilla knife/glove (no wear = vanilla)
            const isVanilla = item.has_star && !item.item_wear;

            // For vanilla items, item_name is the knife name (e.g., "Butterfly Knife")
            // For regular items, item_type is weapon and item_name is skin
            let weaponName, skinName;

            if (isVanilla) {
                // Vanilla: "★ Butterfly Knife" - item_name is the full knife name
                weaponName = `★ ${item.item_name.trim()}`;
                skinName = ''; // No skin for vanilla
            } else {
                // Regular: "★ Karambit | Doppler"
                weaponName = item.has_star ? `★ ${item.item_type}` : item.item_type;
                skinName = this.cleanSkinName(item.item_name);
            }

            // Extract phase from skin name for Doppler skins
            const phase = this.extractPhase(item.item_name);

            // Convert price from empire coins to USD
            // API returns price in coins (e.g., 15000 = 15000 coins)
            // 100 coins = €52, so 1 coin = €0.52, then convert to USD
            const price = (item.price / 100) * coinToUsd;

            // Odds are already in percentage format
            const odds = item.chance;

            // Normalize wear to short format
            const wear = this.normalizeWear(item.item_wear);

            // Build market hash name for price lookup
            const marketHashName = isVanilla
                ? weaponName  // Vanilla: just "★ Butterfly Knife"
                : this.buildMarketHashName(weaponName, skinName, item.item_wear, item.is_stattrak, phase);

            // Build full image URL
            const image = item.image_url.startsWith('http')
                ? item.image_url
                : `${this.STEAM_IMAGE_BASE}${item.image_url}/480x480`;

            return {
                id: item.item_id || `csgoempire-${idx}`,
                weaponName: weaponName,
                skinName: skinName,
                wear: wear,
                wearFull: item.item_wear,
                isStattrak: item.is_stattrak || false,
                price: price,
                odds: odds,
                image: image,
                marketHashName: marketHashName,
                phase: phase
            };
        });

        return {
            caseId: rawData.slug || 'unknown',
            caseName: rawData.case_name || 'Unknown Case',
            casePrice: ((rawData.total_price || 0) / 100) * coinToUsd,
            items: items
        };
    },

    /**
     * Extract Doppler phase from skin name
     * @param {string} skinName - e.g., "Gamma Doppler - Emerald"
     * @returns {string|null} - Phase name or null
     */
    extractPhase(skinName) {
        if (!skinName || !skinName.includes('Doppler')) return null;

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
     * @param {string} skinName - e.g., "Gamma Doppler - Emerald"
     * @returns {string} - Clean skin name e.g., "Gamma Doppler"
     */
    cleanSkinName(skinName) {
        if (!skinName) return '';

        // Remove phase suffixes like " - Emerald", " - Phase 2"
        return skinName
            .replace(/\s*-\s*(Phase \d|Ruby|Sapphire|Emerald|Black Pearl)$/i, '')
            .trim();
    },

    /**
     * Normalize wear to short format
     * @param {string} wear - Full wear string
     * @returns {string} - Short wear (FN, MW, FT, WW, BS)
     */
    normalizeWear(wear) {
        if (!wear) return '';

        const wearLower = wear.toLowerCase();

        if (wearLower.includes('factory new')) return 'FN';
        if (wearLower.includes('minimal wear')) return 'MW';
        if (wearLower.includes('field-tested') || wearLower.includes('field tested')) return 'FT';
        if (wearLower.includes('well-worn') || wearLower.includes('well worn')) return 'WW';
        if (wearLower.includes('battle-scarred') || wearLower.includes('battle scarred')) return 'BS';

        return wear;
    },

    /**
     * Build market hash name for price lookup
     * @param {string} weaponName - Weapon name (may include ★)
     * @param {string} skinName - Skin name
     * @param {string} exterior - Full exterior name
     * @param {boolean} isStattrak - Whether StatTrak
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
window.CSGOEmpireParser = CSGOEmpireParser;
