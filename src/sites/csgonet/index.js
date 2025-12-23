/**
 * CSGO.net Site Adapter
 * Implements the site adapter interface for csgo.net
 *
 * URL patterns:
 * - /case/{slug}
 *
 * Data source: DOM scraping (no API available)
 */

class CSGONetAdapter {
    /**
     * Check if this adapter handles the given URL
     * @param {string} url - Current URL
     * @returns {boolean}
     */
    static matches(url) {
        return url.includes('csgo.net');
    }

    /**
     * Get unique site identifier
     * @returns {string}
     */
    static getSiteId() {
        return 'csgonet';
    }

    /**
     * Check if current page is a case page
     * @returns {boolean}
     */
    isCasePage() {
        const path = window.location.pathname;
        // Match /case/{slug} pattern
        return /^\/case\/[^/]+$/.test(path);
    }

    /**
     * Get case slug from URL
     * @returns {string|null}
     */
    getCaseSlug() {
        const match = window.location.pathname.match(/^\/case\/([^/]+)$/);
        return match ? match[1] : null;
    }

    /**
     * Find DOM element to insert box after
     * @returns {Promise<Element|null>}
     */
    async getInsertionPoint() {
        // Wait for the case layout to appear
        await this.waitForElement('.layout-case', 5000);

        // Find the actions section (contains the buy/open button)
        const actionsSection = document.querySelector('.layout-case__actions');
        if (actionsSection) {
            return actionsSection;
        }

        // Fallback: find the title section
        const titleSection = document.querySelector('.layout-case__title');
        if (titleSection) {
            return titleSection;
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
     * Fetch case data (actually scrapes from DOM)
     * @returns {Promise<Object|null>} - Unified CaseData object
     */
    async fetchCaseData() {
        if (!this.isCasePage()) return null;

        // Wait for the skins to load
        await this.waitForElement('.layout-case__skins .skin', 5000);

        try {
            const rawData = CSGONetAPI.scrapePageData();
            if (rawData) {
                return CSGONetParser.transform(rawData);
            }
            return null;
        } catch (error) {
            console.error('[CSGO.net Adapter] Error fetching case data:', error);
            return null;
        }
    }

    /**
     * Fetch user's currency preference
     * csgo.net prices appear to be in USD
     * @returns {Promise<Object>} - Currency object
     */
    async fetchUserCurrency() {
        return CurrencyService.defaultCurrency;
    }
}

// Make available globally for content scripts
window.CSGONetAdapter = CSGONetAdapter;
