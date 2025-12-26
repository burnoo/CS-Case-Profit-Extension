/**
 * CSGOEmpire Site Adapter
 * Implements the site adapter interface for CSGOEmpire
 *
 * URL pattern: https://csgoempire.com/cases/open/{slug}
 * Data source: DOM scraping (API is protected)
 */

class CSGOEmpireAdapter {
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
                return CSGOEmpireParser.transform(rawData);
            }
            return null;
        } catch (error) {
            console.error('[CSGOEmpire Adapter] Error fetching case data:', error);
            return null;
        }
    }

    /**
     * Fetch user's currency preference
     * CSGOEmpire uses its own coin system (1 coin = $1)
     * @returns {Promise<Object>} - Currency object {name, rate, symbol}
     */
    async fetchUserCurrency() {
        // CSGOEmpire uses coins which are equivalent to USD
        return CurrencyService.defaultCurrency;
    }
}

// Make available globally for content scripts
window.CSGOEmpireAdapter = CSGOEmpireAdapter;
