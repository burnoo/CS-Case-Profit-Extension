/**
 * DaddySkins Data Parser
 * Transforms GraphQL API data to unified CaseData format
 *
 * API response structure:
 * - name: Weapon name (e.g., "AK-47")
 * - short_description: Skin name (e.g., "B the Monster")
 * - class: Rarity (covert, classified, etc.)
 * - quality: Wear condition (Factory New, etc.)
 * - price: Price in cents
 * - chance: Odds as percentage (e.g., 0.1)
 * - stattrak: null or true
 */

const DaddySkinsParser = {
    /**
     * Transform API data to unified format
     * @param {Object} rawData - Raw API response
     * @returns {Object|null} - Unified CaseData object
     */
    transform(rawData) {
        if (!rawData || !rawData.products || rawData.products.length === 0) {
            return null;
        }

        const items = rawData.products.map(item => this.parseItem(item));

        return {
            caseId: rawData.slug || 'unknown',
            caseName: rawData.name || 'Unknown Case',
            casePrice: rawData.price || 0, // Price is already in dollars
            items: items
        };
    },

    /**
     * Parse a single item
     * @param {Object} item - Raw item from API
     * @returns {Object} - Parsed item
     */
    parseItem(item) {
        const weaponName = item.name || '';
        const skinName = item.short_description || '';
        const isStattrak = item.stattrak === true;
        const wearFull = item.quality || '';
        const wearShort = this.getWearShort(wearFull);

        // Extract phase from skin name if Doppler
        const phase = this.extractPhase(skinName);

        // Build market hash name
        // Handle ★ prefix for knives/gloves - it must come before StatTrak™
        // Correct format: "★ StatTrak™ Weapon | Skin (Wear) Phase"
        let starPrefix = '';
        let cleanWeaponName = weaponName;

        if (weaponName.startsWith('★ ')) {
            starPrefix = '★ ';
            cleanWeaponName = weaponName.substring(2);
        }

        const stattrakPrefix = isStattrak ? 'StatTrak\u2122 ' : '';
        let marketHashName = `${starPrefix}${stattrakPrefix}${cleanWeaponName} | ${skinName}`;

        if (wearFull) {
            marketHashName += ` (${wearFull})`;
        }
        if (phase) {
            marketHashName += ` ${phase}`;
        }

        return {
            id: item.id || `daddyskins-${Math.random()}`,
            weaponName: weaponName,
            skinName: skinName,
            wear: wearShort,
            wearFull: wearFull,
            isStattrak: isStattrak,
            isSouvenir: false,
            price: (item.price || 0) / 100, // Convert cents to dollars
            odds: item.chance || 0,
            image: item.image || '',
            marketHashName: marketHashName,
            phase: phase,
            rarity: item.class || ''
        };
    },

    /**
     * Get short wear code
     * @param {string} wearFull - Full wear name
     * @returns {string} - Short wear code
     */
    getWearShort(wearFull) {
        const wearMap = {
            'Factory New': 'FN',
            'Minimal Wear': 'MW',
            'Field-Tested': 'FT',
            'Well-Worn': 'WW',
            'Battle-Scarred': 'BS'
        };
        return wearMap[wearFull] || '';
    },

    /**
     * Extract Doppler phase from skin name
     * @param {string} skinName - Skin name
     * @returns {string|null} - Phase or null
     */
    extractPhase(skinName) {
        if (!skinName.toLowerCase().includes('doppler')) return null;

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
window.DaddySkinsParser = DaddySkinsParser;
