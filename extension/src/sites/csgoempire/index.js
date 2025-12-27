/**
 * CSGOEmpire Site Adapter
 * Implements the site adapter interface for CSGOEmpire
 *
 * URL pattern: https://csgoempire.com/cases/open/{slug}
 * Data source: API
 *
 * Currency: CSGOEmpire uses "empire coins" internally
 * - 100 empire coins = €52 (1 coin = €0.52 EUR)
 * - Users can select display currency (EUR, USD, coins, etc.)
 * - We convert to USD for internal calculations
 */

class CSGOEmpireAdapter {
    // Default empire coin to EUR conversion rate (100 coins = €52)
    static DEFAULT_COIN_TO_EUR = 0.52;
    // Default exchange rates to USD (fallback if API fails)
    static DEFAULT_EUR_TO_USD = 1.04;
    static DEFAULT_GBP_TO_USD = 1.27;

    // Cached exchange rates from API
    _exchangeRates = null;
    /**
     * Check if this adapter handles the given URL
     * @param {string} url - Current URL
     * @returns {boolean}
     */
    static matches(url) {
        return url.includes('csgoempire.com');
    }

    /**
     * Get unique site identifier
     * @returns {string}
     */
    static getSiteId() {
        return 'csgoempire';
    }

    /**
     * Check if current page is a case page
     * @returns {boolean}
     */
    isCasePage() {
        // CSGOEmpire case pages have /cases/open/ in the URL
        return window.location.pathname.includes('/cases/open/');
    }

    /**
     * Get case identifier from URL
     * URL pattern: /cases/open/{slug}
     * @returns {string|null}
     */
    getCaseId() {
        const match = window.location.pathname.match(/\/cases\/open\/([^\/]+)/);
        return match ? match[1] : null;
    }

    /**
     * Find DOM element to insert box after
     * Insert below Open button area and above "Case contains" section
     * Uses stable selectors (classes/structure) instead of text matching for language independence
     * @returns {Promise<Element|null>}
     */
    async getInsertionPoint() {
        // Wait for the case items grid to load (indicates page is ready)
        await this.waitForElement('.case-items-grid', 5000);

        // Find the main content container (has w-full and p-lg classes)
        const mainContainer = document.querySelector('.w-full.p-lg');
        if (!mainContainer) return null;

        // Strategy 1: Find the H3 element (case contains header) and insert before it
        // H3 is language-independent - there's typically only one H3 in the case page
        const h3 = mainContainer.querySelector('h3');
        if (h3 && h3.previousElementSibling) {
            return h3.previousElementSibling;
        }

        // Strategy 2: Find the case-items-grid and insert before it
        const itemsGrid = mainContainer.querySelector('.case-items-grid');
        if (itemsGrid) {
            // The H3 is the previous sibling of the grid
            const gridParent = itemsGrid.previousElementSibling;
            if (gridParent && gridParent.previousElementSibling) {
                return gridParent.previousElementSibling;
            }
        }

        // Strategy 3: Find direct children and look for the spinner/open area
        // The open button area contains tabs (1,2,3,4) - look for element with role="tablist"
        const tablist = mainContainer.querySelector('[role="tablist"]');
        if (tablist) {
            let el = tablist;
            while (el && el.parentElement !== mainContainer) {
                el = el.parentElement;
            }
            if (el) return el;
        }

        return null;
    }

    /**
     * Wait for an element to appear in the DOM
     * @param {string} selector - CSS selector
     * @param {number} timeout - Maximum time to wait
     * @returns {Promise<Element|null>}
     */
    waitForElement(selector, timeout = 3000) {
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
     * Get exchange rates (using defaults since metadata API is protected)
     * @returns {Object} - Exchange rates object
     */
    getExchangeRates() {
        if (!this._exchangeRates) {
            this._exchangeRates = {
                coinToEur: CSGOEmpireAdapter.DEFAULT_COIN_TO_EUR,
                eurToUsd: CSGOEmpireAdapter.DEFAULT_EUR_TO_USD,
                gbpToUsd: CSGOEmpireAdapter.DEFAULT_GBP_TO_USD
            };
        }
        return this._exchangeRates;
    }

    /**
     * Fetch case data from API
     * @returns {Promise<Object|null>} - Unified CaseData object
     */
    async fetchCaseData() {
        if (!this.isCasePage()) return null;

        const caseSlug = this.getCaseId();
        if (!caseSlug) return null;

        try {
            const rawData = await CSGOEmpireAPI.fetchCaseData(caseSlug);
            if (rawData) {
                // Get exchange rates
                const rates = this.getExchangeRates();

                // Convert empire coin prices to USD
                // 1 coin = €0.52, then convert EUR to USD
                const coinToUsd = rates.coinToEur * rates.eurToUsd;
                return CSGOEmpireParser.transform(rawData, coinToUsd);
            }
            return null;
        } catch (error) {
            console.error('[CSGOEmpire Adapter] Error fetching case data:', error);
            return null;
        }
    }

    /**
     * Detect user's selected currency from the page
     * @returns {string|null} - Currency code or null
     */
    detectUserCurrency() {
        // CSGOEmpire stores currency directly in localStorage as "currency" key
        try {
            const currency = localStorage.getItem('currency');
            if (currency) {
                return currency.toUpperCase();
            }
        } catch (e) {
            console.error('[CSGOEmpire] Error reading currency from localStorage:', e);
        }

        return null;
    }

    /**
     * Fetch user's currency preference
     * CSGOEmpire uses empire coins internally, users can select display currency
     * @returns {Promise<Object>} - Currency object {name, rate, symbol}
     */
    async fetchUserCurrency() {
        const detectedCurrency = this.detectUserCurrency();

        // If empire coins or no currency detected, use USD
        if (!detectedCurrency || detectedCurrency === 'COINS' || detectedCurrency === 'COIN') {
            return CurrencyService.defaultCurrency; // USD
        }

        // Get exchange rates
        const rates = this.getExchangeRates();

        // The rate here is for DISPLAY purposes (USD to display currency)
        // Prices are already converted to USD internally
        switch (detectedCurrency) {
            case 'EUR':
                return CurrencyService.create('EUR', 1 / rates.eurToUsd);
            case 'GBP':
                return CurrencyService.create('GBP', 1 / rates.gbpToUsd);
            default:
                return CurrencyService.defaultCurrency;
        }
    }
}

// Make available globally for content scripts
window.CSGOEmpireAdapter = CSGOEmpireAdapter;
