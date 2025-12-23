/**
 * CSGO.net Data Scraper
 * Extracts case data from DOM (no API available - Meteor.js app)
 *
 * DOM Structure:
 * - .layout-case contains the case page
 * - .layout-case__title - case name
 * - .layout-case__actions - contains price text like "0.99 / YOU NEED 0.99"
 * - .layout-case__skins .skin - item elements with rarity classes
 */

const CSGONetAPI = {
    /**
     * Scrape case data from the DOM
     * @returns {Object|null} - Case data or null on error
     */
    scrapePageData() {
        try {
            const caseContainer = document.querySelector('.layout-case');
            if (!caseContainer) {
                console.error('[CSGO.net API] Case container not found');
                return null;
            }

            // Extract case name (strip "COME BACK" prefix if present)
            const titleEl = document.querySelector('.layout-case__title');
            const caseName = titleEl?.innerText?.replace(/COME BACK\s*/i, '').trim() || 'Unknown Case';

            // Extract case price from actions section
            const actionsEl = document.querySelector('.layout-case__actions');
            const actionsText = actionsEl?.innerText || '';
            const priceMatch = actionsText.match(/([\d.]+)\s*\/\s*YOU NEED/i) ||
                              actionsText.match(/([\d.]+)\s*\$/);
            const casePrice = priceMatch ? parseFloat(priceMatch[1]) : 0;

            // Extract items from skins section
            const skinElements = document.querySelectorAll('.layout-case__skins .skin');
            const items = [];

            skinElements.forEach((el, idx) => {
                // Skip sub-elements (like .skin__image, .skin__name, etc.)
                if (el.className.includes('skin__')) return;

                const itemData = this.extractItemData(el, idx);
                if (itemData) {
                    items.push(itemData);
                }
            });

            if (items.length === 0) {
                console.error('[CSGO.net API] No items found');
                return null;
            }

            return {
                name: caseName,
                price: casePrice,
                items: items
            };
        } catch (error) {
            console.error('[CSGO.net API] Error scraping page:', error);
            return null;
        }
    },

    /**
     * Extract data from a single item element
     * @param {Element} el - Item DOM element
     * @param {number} idx - Item index
     * @returns {Object|null} - Item data or null
     */
    extractItemData(el, idx) {
        try {
            // Get all text lines from the element
            const allText = el.innerText?.split('\n').filter(t => t.trim()) || [];

            if (allText.length < 2) return null;

            // Extract price (first line, may have $ symbol)
            const priceText = allText[0]?.replace(/[$,]/g, '').trim();
            const price = parseFloat(priceText) || 0;

            // Extract weapon name and skin name
            const weapon = allText[1]?.trim() || '';
            const skinName = allText[2]?.trim() || '';

            // Extract rarity from CSS class
            const rarityClasses = ['covert', 'classified', 'restricted', 'milspec', 'industrial', 'consumer', 'contraband', 'extraordinary'];
            const rarity = el.className.split(' ').find(c => rarityClasses.includes(c)) || 'unknown';

            // Try to find image
            const imgEl = el.querySelector('img');
            const image = imgEl?.src || '';

            return {
                id: `csgonet-${idx}`,
                weapon: weapon,
                skinName: skinName,
                price: price,
                rarity: rarity,
                image: image
            };
        } catch (error) {
            console.error('[CSGO.net API] Error extracting item:', error);
            return null;
        }
    }
};

// Make available globally for content scripts
window.CSGONetAPI = CSGONetAPI;
