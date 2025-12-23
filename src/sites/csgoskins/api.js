/**
 * CSGO-Skins.com Data Scraper
 * Extracts case data from DOM (no API available)
 *
 * DOM Structure:
 * - h1: case name
 * - button with "Open for $X.XX": case price
 * - .ContainerGroupedItem: item elements with odds in innerText
 * - section.section--control: buy case section
 * - section.section--items: items section
 */

const CSGOSkinsAPI = {
    /**
     * Scrape case data from the DOM
     * @returns {Object|null} - Case data or null on error
     */
    scrapePageData() {
        try {
            // Extract case name from h1
            const caseName = document.querySelector('h1')?.innerText?.trim() || 'Unknown Case';

            // Extract case price from open button
            const openButton = Array.from(document.querySelectorAll('button'))
                .find(b => b.innerText.includes('Open for'));
            const priceMatch = openButton?.innerText.match(/\$([\d.]+)/);
            const casePrice = priceMatch ? parseFloat(priceMatch[1]) : 0;

            // Extract items from ContainerGroupedItem elements
            const itemContainers = document.querySelectorAll('.ContainerGroupedItem');
            const items = [];

            itemContainers.forEach((container, idx) => {
                const itemData = this.extractItemData(container, idx);
                if (itemData) {
                    // extractItemData returns an array of variations
                    items.push(...itemData);
                }
            });

            if (items.length === 0) {
                console.error('[CSGO-Skins API] No items found');
                return null;
            }

            return {
                name: caseName,
                price: casePrice,
                items: items
            };
        } catch (error) {
            console.error('[CSGO-Skins API] Error scraping page:', error);
            return null;
        }
    },

    /**
     * Extract data from a single item container
     * @param {Element} container - Item DOM element
     * @param {number} idx - Item index
     * @returns {Array|null} - Array of item variations or null
     */
    extractItemData(container, idx) {
        try {
            // Get item name from h3
            const name = container.querySelector('h3')?.innerText?.trim();
            if (!name) return null;

            // Get color style for rarity indication
            const styleAttr = container.getAttribute('style') || '';
            const colorMatch = styleAttr.match(/--item-quality-color:\s*([\d,]+)/);
            const colorRGB = colorMatch ? colorMatch[1] : '';

            // Try to find image
            const imgEl = container.querySelector('img');
            const image = imgEl?.src || '';

            // Extract data from chances_table
            const chancesTable = container.querySelector('.chances_table');
            const variations = [];

            if (chancesTable) {
                const rows = chancesTable.querySelectorAll('tbody tr');
                rows.forEach((row, rowIdx) => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 4) {
                        // Use textContent instead of innerText (table may be hidden)
                        const wear = cells[0]?.textContent?.trim() || '';
                        const priceText = cells[1]?.textContent?.trim() || '';
                        const priceMatch = priceText.match(/\$([\d,.]+)/);
                        const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : 0;
                        const oddsText = cells[3]?.textContent?.trim() || '';
                        const oddsMatch = oddsText.match(/([\d.]+)%/);
                        const odds = oddsMatch ? parseFloat(oddsMatch[1]) : 0;

                        variations.push({
                            id: `csgoskins-${idx}-${rowIdx}`,
                            name: name,
                            wear: wear,
                            price: price,
                            odds: odds,
                            colorRGB: colorRGB,
                            image: image
                        });
                    }
                });
            }

            // If no chances_table, fall back to basic extraction
            if (variations.length === 0) {
                const allText = container.innerText;
                const oddsMatch = allText.match(/([\d.]+)%/);
                const odds = oddsMatch ? parseFloat(oddsMatch[1]) : 0;

                return [{
                    id: `csgoskins-${idx}`,
                    name: name,
                    wear: '',
                    price: 0,
                    odds: odds,
                    colorRGB: colorRGB,
                    image: image
                }];
            }

            return variations;
        } catch (error) {
            console.error('[CSGO-Skins API] Error extracting item:', error);
            return null;
        }
    }
};

// Make available globally for content scripts
window.CSGOSkinsAPI = CSGOSkinsAPI;
