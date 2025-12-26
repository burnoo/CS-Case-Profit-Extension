/**
 * CSGO-Skins.com Data Parser
 * Transforms scraped DOM data to unified CaseData format
 *
 * Item name format: "Weapon | Skin Name" (e.g., "AK-47 | Point Disarray")
 * Odds are provided directly as percentages
 */

const CSGOSkinsParser = {
    /**
     * Transform scraped data to unified format
     * @param {Object} rawData - Raw scraped data
     * @returns {Object|null} - Unified CaseData object
     */
    transform(rawData) {
        if (!rawData || !rawData.items || rawData.items.length === 0) {
            return null;
        }

        const items = rawData.items.map(item => this.parseItem(item));

        return {
            caseId: this.getCaseSlug() || 'unknown',
            caseName: rawData.name || 'Unknown Case',
            casePrice: rawData.price || 0,
            items: items
        };
    },

    /**
     * Parse a single item
     * @param {Object} item - Raw item from scraper
     * @returns {Object} - Parsed item
     */
    parseItem(item) {
        const parsed = this.parseItemName(item.name);

        // Use wear from chances_table if available, otherwise from name parsing
        const wear = item.wear || parsed.wearShort;
        const wearFull = this.getWearFull(wear) || parsed.wearFull;

        // Use isStattrak from scraper (from chances_table) or from name parsing
        const isStattrak = item.isStattrak || parsed.isStattrak;

        // Check if item needs ★ prefix (knives/gloves without it)
        const needsStarPrefix = this.isKnifeOrGloves(item.name) && !item.name.startsWith('★');

        // Build market hash name with proper prefixes
        let baseName = needsStarPrefix ? `★ ${item.name}` : item.name;
        let marketHashName = '';
        if (isStattrak) {
            // Add StatTrak™ prefix
            marketHashName = `StatTrak\u2122 ${baseName}`;
        } else {
            marketHashName = baseName;
        }
        if (wearFull && !marketHashName.includes('(')) {
            marketHashName = `${marketHashName} (${wearFull})`;
        }

        // Update weaponName with star prefix if needed
        const weaponName = needsStarPrefix && !parsed.weaponName.startsWith('★')
            ? `★ ${parsed.weaponName}`
            : parsed.weaponName;

        return {
            id: item.id,
            weaponName: weaponName,
            skinName: parsed.skinName,
            wear: wear,
            wearFull: wearFull,
            isStattrak: isStattrak,
            isSouvenir: parsed.isSouvenir,
            price: item.price || 0, // Use price from chances_table
            odds: item.odds,
            image: item.image || '',
            marketHashName: marketHashName,
            phase: parsed.phase
        };
    },

    /**
     * Check if item is a knife or gloves (needs ★ prefix)
     * @param {string} name - Item name
     * @returns {boolean}
     */
    isKnifeOrGloves(name) {
        if (!name) return false;

        const knifePatterns = [
            'Bayonet', 'Karambit', 'Butterfly Knife', 'Huntsman Knife',
            'Flip Knife', 'Gut Knife', 'Falchion Knife', 'Shadow Daggers',
            'Bowie Knife', 'Navaja Knife', 'Stiletto Knife', 'Talon Knife',
            'Ursus Knife', 'Classic Knife', 'Paracord Knife', 'Survival Knife',
            'Nomad Knife', 'Skeleton Knife', 'Kukri Knife'
        ];

        const glovePatterns = [
            'Hand Wraps', 'Driver Gloves', 'Moto Gloves', 'Specialist Gloves',
            'Sport Gloves', 'Hydra Gloves', 'Broken Fang Gloves', 'Bloodhound Gloves'
        ];

        const allPatterns = [...knifePatterns, ...glovePatterns];
        return allPatterns.some(pattern => name.includes(pattern));
    },

    /**
     * Get full wear name from short code
     * @param {string} wearShort - Short wear code (FN, MW, etc.)
     * @returns {string} - Full wear name
     */
    getWearFull(wearShort) {
        const wearMap = {
            'FN': 'Factory New',
            'MW': 'Minimal Wear',
            'FT': 'Field-Tested',
            'WW': 'Well-Worn',
            'BS': 'Battle-Scarred'
        };
        return wearMap[wearShort] || '';
    },

    /**
     * Parse item name to extract weapon, skin, wear, etc.
     * @param {string} fullName - Full item name
     * @returns {Object} - Parsed components
     */
    parseItemName(fullName) {
        let name = fullName;
        let isStattrak = false;
        let isSouvenir = false;
        let phase = null;

        // Check for StatTrak
        if (name.includes('StatTrak')) {
            isStattrak = true;
            name = name.replace('StatTrak™ ', '').replace('StatTrak ', '');
        }

        // Check for Souvenir
        if (name.includes('Souvenir')) {
            isSouvenir = true;
            name = name.replace('Souvenir ', '');
        }

        // Extract wear condition
        const wearMatch = name.match(/\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/);
        const wearFull = wearMatch ? wearMatch[1] : '';
        const wearShort = this.getWearShort(wearFull);

        if (wearMatch) {
            name = name.replace(wearMatch[0], '').trim();
        }

        // Extract Doppler phase
        phase = this.extractPhase(name);
        if (phase) {
            name = name.replace(new RegExp(`\\s*-?\\s*${phase}$`, 'i'), '').trim();
        }

        // Split weapon and skin name
        let weaponName = '';
        let skinName = '';

        // Handle stickers
        if (name.startsWith('Sticker |')) {
            weaponName = 'Sticker';
            skinName = name.replace('Sticker | ', '');
        }
        // Handle knives/gloves (star prefix)
        else if (name.startsWith('★ ')) {
            const parts = name.substring(2).split(' | ');
            weaponName = '★ ' + (parts[0] || '');
            skinName = parts[1] || '';
        }
        // Regular weapons
        else {
            const parts = name.split(' | ');
            weaponName = parts[0] || '';
            skinName = parts[1] || '';
        }

        return {
            weaponName: weaponName.trim(),
            skinName: skinName.trim(),
            wearFull,
            wearShort,
            isStattrak,
            isSouvenir,
            phase
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
     * Extract Doppler phase from name
     * @param {string} name - Item name
     * @returns {string|null} - Phase or null
     */
    extractPhase(name) {
        if (!name.toLowerCase().includes('doppler')) return null;

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

        for (const { pattern, name: phaseName } of phasePatterns) {
            if (pattern.test(name)) {
                return phaseName;
            }
        }

        return null;
    },

    /**
     * Get case slug from URL
     * @returns {string|null}
     */
    getCaseSlug() {
        const match = window.location.pathname.match(/\/case\/([^/]+)/);
        return match ? match[1] : null;
    }
};

// Make available globally for content scripts
window.CSGOSkinsParser = CSGOSkinsParser;
