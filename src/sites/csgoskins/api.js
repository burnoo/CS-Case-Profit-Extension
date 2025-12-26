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
     * Get currency info from cookie and page
     * @returns {{code: string, rate: number}}
     */
    getCurrencyInfo() {
        // Get currency code from cookie
        const currencyMatch = document.cookie.match(/currency=(\w+)/);
        const currencyCode = currencyMatch ? currencyMatch[1] : 'USD';

        // For USD, always use rate of 1 (prices on page are already in USD)
        // The rate in HTML is for converting FROM USD to other currencies
        if (currencyCode === 'USD') {
            return { code: currencyCode, rate: 1 };
        }

        // Try to find exchange rate in page for non-USD currencies
        const html = document.documentElement.innerHTML;
        const rateMatch = html.match(/rate:([\d.]+)/);
        const rate = rateMatch ? parseFloat(rateMatch[1]) : 1;

        return { code: currencyCode, rate: rate };
    },

    /**
     * Extract numeric price from text (handles multiple currency formats)
     * @param {string} text - Price text like "$10.50" or "42.00zł"
     * @returns {number} - Numeric price value
     */
    extractPrice(text) {
        if (!text) return 0;
        // Remove currency symbols and extract number
        const match = text.match(/([\d,.]+)/);
        if (match) {
            return parseFloat(match[1].replace(',', ''));
        }
        return 0;
    },

    /**
     * Scrape case data from the DOM
     * @returns {Object|null} - Case data or null on error
     */
    scrapePageData() {
        try {
            // Get currency info for conversion
            const currency = this.getCurrencyInfo();

            // Extract case name from h1
            const caseName = document.querySelector('h1')?.innerText?.trim() || 'Unknown Case';

            // Extract case price from open button
            // Language-independent: look for button with price pattern or "Open for" text
            let openButton = Array.from(document.querySelectorAll('button'))
                .find(b => b.innerText.includes('Open for'));

            let priceText = '';
            if (openButton) {
                // English: "Open for $2.50"
                priceText = openButton.innerText.match(/Open for\s*(.+)$/)?.[1]?.trim() || '';
            } else {
                // Non-English: find button with price pattern (e.g., "$2.50", "2.50 zł", "₺112.50")
                // Supports: $ € £ zł ₽ ¥ ₺ ₴ R$ (USD, EUR, GBP, PLN, RUB, JPY/CNY, TRY, UAH, BRL)
                openButton = Array.from(document.querySelectorAll('main button, .section--control button'))
                    .find(b => /[\d,.]+\s*[$€£zł₽¥₺₴]|[$€£₽¥₺₴]\s*[\d,.]+|R\$\s*[\d,.]+/.test(b.innerText));
                if (openButton) {
                    priceText = openButton.innerText.trim();
                }
            }
            const casePrice = this.extractPrice(priceText) / currency.rate;

            // Extract items from ContainerGroupedItem elements
            const itemContainers = document.querySelectorAll('.ContainerGroupedItem');
            const items = [];

            itemContainers.forEach((container, idx) => {
                const itemData = this.extractItemData(container, idx, currency.rate);
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
     * @param {number} rate - Currency exchange rate to USD
     * @returns {Array|null} - Array of item variations or null
     */
    extractItemData(container, idx, rate = 1) {
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
                        const wearRaw = cells[0]?.textContent?.trim() || '';
                        const priceText = cells[1]?.textContent?.trim() || '';
                        const price = this.extractPrice(priceText) / rate; // Convert to USD
                        const oddsText = cells[3]?.textContent?.trim() || '';
                        const oddsMatch = oddsText.match(/([\d.]+)%/);
                        const odds = oddsMatch ? parseFloat(oddsMatch[1]) : 0;

                        // Check for StatTrak - wear cell contains "ST FN", "ST MW", etc.
                        // Also can check for cell--is-statTrak class on the cell
                        const isStattrak = wearRaw.startsWith('ST ') ||
                            cells[0]?.classList?.contains('cell--is-statTrak');
                        const wear = isStattrak ? wearRaw.replace('ST ', '') : wearRaw;

                        variations.push({
                            id: `csgoskins-${idx}-${rowIdx}`,
                            name: name,
                            wear: wear,
                            isStattrak: isStattrak,
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
