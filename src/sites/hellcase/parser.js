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
                    items.push({
                        id: variant.id || `${item.id}-${variant.steam_short_exterior}`,
                        weaponName: item.weapon_name,
                        skinName: item.skin_name,
                        wear: variant.steam_short_exterior || '',
                        wearFull: variant.steam_exterior || '',
                        isStattrak: variant.is_stattrak || false,
                        price: variant.steam_price_en || 0,
                        odds: variant.odds || 0,
                        image: variant.steam_image || item.steam_image || ''
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
    }
};

// Make available globally for content scripts
window.HellcaseParser = HellcaseParser;
