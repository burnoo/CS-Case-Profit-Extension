/**
 * CSGO-Skins.com Site Adapter
 * Implements the site adapter interface for csgo-skins.com
 *
 * URL patterns:
 * - /case/{slug}
 *
 * Data source: DOM scraping (no API available)
 */

class CSGOSkinsAdapter {
    /**
     * Check if this adapter handles the given URL
     * @param {string} url - Current URL
     * @returns {boolean}
     */
    static matches(url) {
        return url.includes('csgo-skins.com');
    }

    /**
     * Get unique site identifier
     * @returns {string}
     */
    static getSiteId() {
        return 'csgoskins';
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
        // Wait for the control section to appear
        await this.waitForElement('.section--control', 5000);

        // Find the control section (contains buy/open button)
        const controlSection = document.querySelector('.section--control');
        if (controlSection) {
            return controlSection;
        }

        // Fallback: find the open button container
        const openButton = Array.from(document.querySelectorAll('button'))
            .find(b => b.innerText.includes('Open for'));
        if (openButton) {
            const section = openButton.closest('section, .AppPage_section');
            if (section) return section;
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

        // Wait for items to load
        await this.waitForElement('.ContainerGroupedItem', 5000);

        try {
            const rawData = CSGOSkinsAPI.scrapePageData();
            if (rawData) {
                return CSGOSkinsParser.transform(rawData);
            }
            return null;
        } catch (error) {
            console.error('[CSGO-Skins Adapter] Error fetching case data:', error);
            return null;
        }
    }

    /**
     * Fetch user's currency preference
     * csgo-skins.com prices are in USD
     * @returns {Promise<Object>} - Currency object
     */
    async fetchUserCurrency() {
        return CurrencyService.defaultCurrency;
    }
}

// Make available globally for content scripts
window.CSGOSkinsAdapter = CSGOSkinsAdapter;
