/**
 * KeyDrop Site Adapter
 * Implements the site adapter interface for KeyDrop
 *
 * URL pattern: https://keydrop.com/{lang}/skins/category/{slug}
 * Data source: window.__case global variable
 */

class KeyDropAdapter {
    /**
     * Check if this adapter handles the given URL
     * @param {string} url - Current URL
     * @returns {boolean}
     */
    static matches(url) {
        return url.includes('key-drop.com') || url.includes('keydrop.com');
    }

    /**
     * Get unique site identifier
     * @returns {string}
     */
    static getSiteId() {
        return 'keydrop';
    }

    /**
     * Check if current page is a case page
     * @returns {boolean}
     */
    isCasePage() {
        // KeyDrop case pages have /skins/category/ in the URL
        return window.location.pathname.includes('/skins/category/');
    }

    /**
     * Get case identifier from URL
     * URL pattern: /{lang}/skins/category/{slug}
     * @returns {string|null}
     */
    getCaseId() {
        const match = window.location.pathname.match(/\/skins\/category\/([^\/]+)/);
        return match ? match[1] : null;
    }

    /**
     * Find DOM element to insert box after
     * @returns {Promise<Element|null>}
     */
    async getInsertionPoint() {
        // Wait for page to load
        await this.waitForElement('main', 2000);

        // Try to find the case info section (contains case title, price, open button)
        // Look for the section with the "Open Case" or similar button
        const openButton = document.querySelector('button[class*="openCase"], button[class*="open-case"]');
        if (openButton) {
            // Go up to find a suitable parent container
            let el = openButton;
            while (el.parentElement) {
                el = el.parentElement;
                if (el.tagName === 'SECTION' || el.tagName === 'DIV' && el.className.includes('case')) {
                    return el;
                }
            }
        }

        // Alternative: find the section containing case price/info
        const priceSection = document.querySelector('[class*="casePrice"], [class*="case-price"]');
        if (priceSection) {
            let el = priceSection;
            while (el.parentElement) {
                el = el.parentElement;
                if (el.tagName === 'SECTION') {
                    return el;
                }
            }
        }

        // Fallback: look for main content area
        const main = document.querySelector('main');
        if (main) {
            // Find first significant section
            const sections = main.querySelectorAll('section');
            if (sections.length > 0) {
                return sections[0];
            }
            return main.firstElementChild;
        }

        return null;
    }

    /**
     * Wait for an element to appear in the DOM
     * @param {string} selector - CSS selector
     * @param {number} timeout - Maximum time to wait
     * @returns {Promise<Element|null>}
     */
    waitForElement(selector, timeout = 2000) {
        return new Promise((resolve) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver((mutations, obs) => {
                const el = document.querySelector(selector);
                if (el) {
                    obs.disconnect();
                    resolve(el);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }, timeout);
        });
    }

    /**
     * Fetch case data
     * @returns {Promise<Object|null>} - Unified CaseData object
     */
    async fetchCaseData() {
        if (!this.isCasePage()) return null;

        const caseSlug = this.getCaseId();
        if (!caseSlug) return null;

        try {
            // Get currency and exchange rate
            const currencyMatch = document.cookie.match(/currency=(\w+)/);
            const currencyCode = currencyMatch ? currencyMatch[1] : 'USD';

            let exchangeRate = 1;
            if (currencyCode !== 'USD') {
                const currencyData = await KeyDropAPI.fetchExchangeRates();
                exchangeRate = currencyData?.exchangeRate?.[currencyCode] || 1;
            }

            const rawData = await KeyDropAPI.fetchCaseData(caseSlug);
            if (rawData) {
                // Pass exchange rate to parser to normalize prices to USD
                return KeyDropParser.transform(rawData, exchangeRate);
            }
            return null;
        } catch (error) {
            console.error('[KeyDrop Adapter] Error fetching case data:', error);
            return null;
        }
    }

    /**
     * Fetch user's currency preference from cookie
     * @returns {Promise<Object>} - Currency object {name, rate, symbol}
     */
    async fetchUserCurrency() {
        // Get currency from cookie
        const currencyMatch = document.cookie.match(/currency=(\w+)/);
        const currencyCode = currencyMatch ? currencyMatch[1] : 'USD';

        // If already USD, rate is 1
        if (currencyCode === 'USD') {
            return CurrencyService.create(currencyCode, 1);
        }

        // Fetch exchange rate from KeyDrop API
        try {
            const currencyData = await KeyDropAPI.fetchExchangeRates();
            if (currencyData?.exchangeRate?.[currencyCode]) {
                const rate = currencyData.exchangeRate[currencyCode];
                return CurrencyService.create(currencyCode, rate);
            }
        } catch (error) {
            console.error('[KeyDrop Adapter] Error fetching exchange rate:', error);
        }

        // Fallback: return rate of 1 (prices won't be converted)
        return CurrencyService.create(currencyCode, 1);
    }
}

// Make available globally for content scripts
window.KeyDropAdapter = KeyDropAdapter;
