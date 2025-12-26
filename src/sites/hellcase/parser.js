/**
 * Hellcase Data Parser
 * Transforms Hellcase API response to unified CaseData format
 */

const HellcaseParser = {
    /**
     * Transform Hellcase API response to unified format
     * @param {Object} rawData - Raw API response
     * @returns {Object} - Unified CaseData object
     */
    transform(rawData) {
        if (!rawData || !rawData.itemlist) {
            return null;
        }

        // Flatten all item variants
        const items = [];
        rawData.itemlist.forEach(item => {
            if (item.items && Array.isArray(item.items)) {
                item.items.forEach(variant => {
                    // Extract phase for Doppler skins
                    const phase = this.extractPhase(item.skin_name);

                    // Build market hash name
                    const marketHashName = this.buildMarketHashName(
                        item.weapon_name,
                        item.skin_name,
                        variant.steam_exterior,
                        variant.is_stattrak,
                        phase
                    );

                    items.push({
                        id: variant.id || `${item.id}-${variant.steam_short_exterior}`,
                        weaponName: item.weapon_name,
                        skinName: item.skin_name,
                        wear: variant.steam_short_exterior || '',
                        wearFull: variant.steam_exterior || '',
                        isStattrak: variant.is_stattrak || false,
                        price: variant.steam_price_en || 0,
                        odds: variant.odds || 0,
                        image: variant.steam_image || item.steam_image || '',
                        marketHashName: marketHashName,
                        phase: phase
                    });
                });
            }
        });

        return {
            caseId: rawData.slug || rawData.id,
            caseName: rawData.title || rawData.name || 'Unknown Case',
            casePrice: rawData.case_price || 0,
            items: items
        };
    },

    /**
     * Build market hash name
     * @param {string} weaponName - Weapon name
     * @param {string} skinName - Skin name
     * @param {string} exterior - Exterior/wear
     * @param {boolean} isStattrak - Whether item is StatTrak
     * @param {string|null} phase - Doppler phase
     * @returns {string} - Market hash name
     */
    buildMarketHashName(weaponName, skinName, exterior, isStattrak, phase) {
        // Handle ★ prefix for knives/gloves - it must come before StatTrak™
        // Correct format: "★ StatTrak™ Weapon | Skin (Wear)"
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
    },

    /**
     * Extract Doppler phase from skin name
     * @param {string} skinName - Skin name
     * @returns {string|null} - Phase name or null
     */
    extractPhase(skinName) {
        if (!skinName) return null;

        // Check if it's a Doppler or Gamma Doppler
        if (!skinName.includes('Doppler')) return null;

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
    }
};

// Make available globally for content scripts
window.HellcaseParser = HellcaseParser;
