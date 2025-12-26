/**
 * CSGOCases Data Parser
 * Transforms API data to unified CaseData format
 *
 * API response structure:
 * - name: Full item name (e.g., "★ Bowie Knife | Slaughter")
 * - price_buy_usd: Price in USD (string)
 * - quality: Wear condition (e.g., "Minimal Wear")
 * - chance: Odds as percentage string (e.g., "1.0000", "0.0000")
 * - stattrak: "0" or "1" (string)
 * - steam_image_file: URL-encoded Steam image URL
 * - color: Hex color for rarity
 */

const CSGOCasesParser = {
    // Known knife types that should have ★ prefix
    KNIFE_TYPES: [
        'Karambit', 'M9 Bayonet', 'Bayonet', 'Butterfly Knife', 'Flip Knife',
        'Gut Knife', 'Huntsman Knife', 'Falchion Knife', 'Shadow Daggers',
        'Bowie Knife', 'Navaja Knife', 'Stiletto Knife', 'Talon Knife',
        'Ursus Knife', 'Classic Knife', 'Paracord Knife', 'Survival Knife',
        'Nomad Knife', 'Skeleton Knife', 'Kukri Knife'
    ],

    // Known glove types that should have ★ prefix
    GLOVE_TYPES: [
        'Sport Gloves', 'Driver Gloves', 'Hand Wraps', 'Moto Gloves',
        'Specialist Gloves', 'Hydra Gloves', 'Broken Fang Gloves'
    ],

    /**
     * Transform API data to unified format
     * @param {Object} rawData - Raw API response
     * @param {number} casePriceOverride - Case price in user currency (from page)
     * @returns {Object|null} - Unified CaseData object
     */
    transform(rawData, casePriceOverride = null) {
        if (!rawData || !rawData.case || !rawData.products || rawData.products.length === 0) {
            return null;
        }

        // Use page price (user currency) if provided, fallback to USD price
        const casePrice = casePriceOverride !== null ? casePriceOverride : (parseFloat(rawData.case.price_usd) || 0);

        // Calculate currency conversion rate (local price / USD price)
        // API returns prices in internal base units that need conversion
        const priceUsd = parseFloat(rawData.case.price_usd) || 0;
        const currencyRate = (casePriceOverride !== null && priceUsd > 0)
            ? casePriceOverride / priceUsd
            : 1;

        // Include both skin and boost items, applying currency conversion
        const items = rawData.products.map((item, idx) => this.parseItem(item, idx, currencyRate));

        // Check if this case has valid odds (not all zeros)
        const hasValidOdds = items.some(item => item.odds > 0);

        return {
            caseId: rawData.case.slug || 'unknown',
            caseName: rawData.case.name || 'Unknown Case',
            casePrice: casePrice,
            items: items,
            hasValidOdds: hasValidOdds
        };
    },

    /**
     * Parse a single item
     * @param {Object} item - Raw item from API
     * @param {number} idx - Item index
     * @param {number} currencyRate - Currency conversion rate (local/USD)
     * @returns {Object} - Parsed item
     */
    parseItem(item, idx, currencyRate = 1) {
        const isBoost = item.type === 'boost';
        const itemName = item.name || '';

        // Convert price from internal units to user currency
        const rawPrice = parseFloat(item.user_case_resell_price) || 0;
        const convertedPrice = rawPrice * currencyRate;

        // Handle boost items (like "Free $") differently
        if (isBoost) {
            // Get image from image_file for boost items (they don't have steam_image_file)
            let image = '';
            if (item.image_file) {
                image = `https://csgocases.com/photos/${item.image_file}`;
            }

            return {
                id: `csgocases-${idx}`,
                weaponName: itemName,
                skinName: '',
                wear: '',
                wearFull: '',
                isStattrak: false,
                isSouvenir: false,
                price: convertedPrice,
                odds: parseFloat(item.chance) || 0,
                image: image,
                marketHashName: itemName,
                phase: null,
                rarity: item.color || '',
                isBoost: true
            };
        }

        const parsed = this.parseItemName(itemName);
        const wearFull = item.quality || '';
        const wearShort = this.getWearShort(wearFull);
        const isStattrak = item.stattrak === '1' || parsed.isStattrak;

        // Build market hash name
        // Handle ★ prefix for knives/gloves - it must come before StatTrak™
        // Correct format: "★ StatTrak™ Weapon | Skin (Wear) Phase"
        let starPrefix = '';
        let cleanWeaponName = parsed.weaponName;

        // Check for various star characters (U+2605 ★, or other star-like chars)
        // Strip any existing star prefix first
        const starMatch = cleanWeaponName.match(/^(\u2605|\u2606|\u22C6|\*)\s*/);
        if (starMatch) {
            cleanWeaponName = cleanWeaponName.substring(starMatch[0].length);
        }

        // Add proper ★ prefix for knives/gloves
        if (starMatch || this.isKnifeOrGlove(cleanWeaponName)) {
            starPrefix = '★ ';
        }

        const stattrakPrefix = isStattrak ? 'StatTrak\u2122 ' : '';
        let marketHashName = `${starPrefix}${stattrakPrefix}${cleanWeaponName} | ${parsed.skinName}`;

        if (wearFull) {
            marketHashName += ` (${wearFull})`;
        }
        if (parsed.phase) {
            marketHashName += ` ${parsed.phase}`;
        }

        // Decode steam image URL
        let image = '';
        if (item.steam_image_file) {
            try {
                image = decodeURIComponent(item.steam_image_file);
            } catch (e) {
                image = item.steam_image_file;
            }
        }

        return {
            id: `csgocases-${idx}`,
            weaponName: parsed.weaponName,
            skinName: parsed.skinName,
            wear: wearShort,
            wearFull: wearFull,
            isStattrak: isStattrak,
            isSouvenir: parsed.isSouvenir,
            price: convertedPrice,
            odds: parseFloat(item.chance) || 0,
            image: image,
            marketHashName: marketHashName,
            phase: parsed.phase,
            rarity: item.color || '',
            isBoost: false
        };
    },

    /**
     * Parse item name to extract weapon, skin, etc.
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
            name = name.replace('StatTrak\u2122 ', '').replace('StatTrak ', '');
        }

        // Check for Souvenir
        if (name.includes('Souvenir')) {
            isSouvenir = true;
            name = name.replace('Souvenir ', '');
        }

        // Extract Doppler phase
        phase = this.extractPhase(name);

        // Split weapon and skin name
        let weaponName = '';
        let skinName = '';

        // Handle knives/gloves (star prefix)
        if (name.startsWith('\u2605 ')) {
            const parts = name.substring(2).split(' | ');
            weaponName = '\u2605 ' + (parts[0] || '');
            skinName = parts[1] || '';
        }
        // Handle stickers
        else if (name.startsWith('Sticker |')) {
            weaponName = 'Sticker';
            skinName = name.replace('Sticker | ', '');
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
     * Check if weapon name is a knife or glove type
     * @param {string} weaponName - Weapon name
     * @returns {boolean} - True if knife or glove
     */
    isKnifeOrGlove(weaponName) {
        if (!weaponName) return false;
        const name = weaponName.toLowerCase();
        return this.KNIFE_TYPES.some(k => name.includes(k.toLowerCase())) ||
               this.GLOVE_TYPES.some(g => name.includes(g.toLowerCase()));
    }
};

// Make available globally for content scripts
window.CSGOCasesParser = CSGOCasesParser;
