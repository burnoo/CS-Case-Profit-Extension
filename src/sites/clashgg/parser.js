/**
 * Clash.gg Data Parser
 * Transforms API response to unified CaseData format
 *
 * API response format:
 * - name: case name
 * - price: case price (in cents)
 * - items: [{
 *     name: full item name (market hash name format),
 *     price: item price (in cents),
 *     ticketsStart, ticketsEnd: for odds calculation,
 *     image: image URL
 *   }]
 */

const ClashGGParser = {
    /**
     * Transform API response to unified format
     * @param {Object} rawData - Raw API response
     * @returns {Object|null} - Unified CaseData object
     */
    transform(rawData) {
        if (!rawData || !rawData.items) {
            return null;
        }

        // Calculate total tickets for odds
        const maxTicket = Math.max(...rawData.items.map(i => i.ticketsEnd));
        const totalTickets = maxTicket + 1;

        const items = rawData.items.map((item, idx) => this.parseItem(item, idx, totalTickets));

        return {
            caseId: rawData.id?.toString() || rawData.slug || 'unknown',
            caseName: rawData.name || 'Unknown Case',
            casePrice: (rawData.price || 0) / 100,
            items: items
        };
    },

    /**
     * Parse a single item
     * @param {Object} item - Raw item from API
     * @param {number} idx - Item index
     * @param {number} totalTickets - Total tickets for odds calculation
     * @returns {Object} - Parsed item
     */
    parseItem(item, idx, totalTickets) {
        const fullName = item.name || '';

        // Parse the full name to extract components
        const parsed = this.parseItemName(fullName);

        // Calculate odds as percentage
        const ticketCount = item.ticketsEnd - item.ticketsStart + 1;
        const odds = (ticketCount / totalTickets) * 100;

        return {
            id: `clashgg-${idx}`,
            weaponName: parsed.weaponName,
            skinName: parsed.skinName,
            wear: parsed.wearShort,
            wearFull: parsed.wearFull,
            isStattrak: parsed.isStattrak,
            isSouvenir: parsed.isSouvenir,
            price: (item.price || 0) / 100,
            odds: odds,
            image: item.image || '',
            marketHashName: fullName,
            phase: parsed.phase
        };
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

        // Handle stickers (no weapon/skin split)
        if (name.startsWith('Sticker |')) {
            weaponName = 'Sticker';
            skinName = name.replace('Sticker | ', '');
        }
        // Handle knives/gloves (star prefix)
        else if (name.startsWith('★ ')) {
            const parts = name.substring(2).split(' | ');
            weaponName = '★ ' + (parts[0] || '');
            skinName = parts[1] || '';

            // Check for vanilla (no skin name)
            if (!skinName) {
                skinName = '';
            }
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
    }
};

// Make available globally for content scripts
window.ClashGGParser = ClashGGParser;
