/**
 * CSGOCases Site Adapter
 * Implements the site adapter interface for csgocases.com
 *
 * URL patterns:
 * - /case/{slug}
 *
 * Data source: REST API
 */

class CSGOCasesAdapter {
    /**
     * Check if this adapter handles the given URL
     * @param {string} url - Current URL
     * @returns {boolean}
     */
    static matches(url) {
        return url.includes('csgocases.com');
    }

    /**
     * Get unique site identifier
     * @returns {string}
     */
    static getSiteId() {
        return 'csgocases';
    }

    /**
     * Check if current page is a case page
     * @returns {boolean}
     */
    isCasePage() {
        const path = window.location.pathname;
        // Match /case/{slug} or /{lang}/case/{slug} pattern (e.g., /pl/case/knife)
        return /^(?:\/[a-z]{2})?\/case\/[^/]+/.test(path);
    }

    /**
     * Get case slug from URL
     * @returns {string|null}
     */
    getCaseSlug() {
        // Match /case/{slug} or /{lang}/case/{slug} pattern
        const match = window.location.pathname.match(/^(?:\/[a-z]{2})?\/case\/([^/]+)/);
        return match ? match[1] : null;
    }

    /**
     * Find DOM element to insert box after
     * @returns {Promise<Element|null>}
     */
    async getInsertionPoint() {
        // Wait for the case panel to load
        await this.waitForElement('#casePanel', 5000);

        // Try to find the case block (contains case info and open button)
        const caseBlock = document.querySelector('.case-block.breadcrumbs-block');
        if (caseBlock) {
            return caseBlock;
        }

        // Fallback: case panel
        const casePanel = document.querySelector('#casePanel');
        if (casePanel) {
            return casePanel;
        }

        // Last fallback: main case container
        const mainContainer = document.querySelector('.main-case-container');
        if (mainContainer) {
            return mainContainer;
        }

        return null;
    }

    /**
     * Wait for an element to appear in the DOM
     * @param {string} selector - CSS selector
     * @param {number} timeout - Maximum time to wait
     * @returns {Promise<Element|null>}
     */
    waitForElement(selector, timeout = 5000) {
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

        const caseSlug = this.getCaseSlug();
        if (!caseSlug) return null;

        try {
            const rawData = await CSGOCasesAPI.fetchCaseData(caseSlug);
            if (rawData) {
                // Get case price from page (already in user currency)
                const casePriceFromPage = CSGOCasesAPI.getCasePriceFromPage();
                return CSGOCasesParser.transform(rawData, casePriceFromPage || null);
            }
            return null;
        } catch (error) {
            console.error('[CSGOCases Adapter] Error fetching case data:', error);
            return null;
        }
    }

    /**
     * Fetch user's currency preference from page display
     * @returns {Promise<Object>} - Currency object
     */
    async fetchUserCurrency() {
        try {
            // Get currency from page display (the currency selector button)
            const currencyCode = CSGOCasesAPI.getCurrencyFromPage() || 'USD';

            // Calculate rate from case price comparison (USD from API vs displayed price)
            const caseSlug = this.getCaseSlug();
            if (caseSlug) {
                const rawData = await CSGOCasesAPI.fetchCaseData(caseSlug);
                const priceUsd = parseFloat(rawData?.case?.price_usd) || 0;
                const priceLocal = CSGOCasesAPI.getCasePriceFromPage();

                if (priceUsd > 0 && priceLocal > 0) {
                    const rate = priceLocal / priceUsd;
                    return CurrencyService.create(currencyCode, rate);
                }
            }

            return CurrencyService.create(currencyCode, 1);
        } catch (error) {
            console.error('[CSGOCases Adapter] Error fetching currency:', error);
            return CurrencyService.defaultCurrency;
        }
    }
}

// Make available globally for content scripts
window.CSGOCasesAdapter = CSGOCasesAdapter;
