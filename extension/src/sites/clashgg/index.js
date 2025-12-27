/**
 * Clash.gg Site Adapter
 * Implements the site adapter interface for Clash.gg
 *
 * URL patterns:
 * - /casescs2/{slug}
 *
 * Data source: /api/cases/{slug}
 */

class ClashGGAdapter {
    /**
     * Check if this adapter handles the given URL
     * @param {string} url - Current URL
     * @returns {boolean}
     */
    static matches(url) {
        return url.includes('clash.gg');
    }

    /**
     * Get unique site identifier
     * @returns {string}
     */
    static getSiteId() {
        return 'clashgg';
    }

    /**
     * Check if current page is a case page
     * @returns {boolean}
     */
    isCasePage() {
        const path = window.location.pathname;
        // Match /casescs2/{slug} pattern
        return /^\/casescs2\/[^/]+$/.test(path);
    }

    /**
     * Get case slug from URL
     * @returns {string|null}
     */
    getCaseSlug() {
        const match = window.location.pathname.match(/^\/casescs2\/([^/]+)$/);
        return match ? match[1] : null;
    }

    /**
     * Find DOM element to insert box after
     * @returns {Promise<Element|null>}
     */
    async getInsertionPoint() {
        // Wait for the Potential Drops section to appear
        await this.waitForElement('main', 5000);

        // Find the main container structure
        const main = document.querySelector('main');
        if (!main || !main.firstElementChild) return null;

        const container = main.firstElementChild;
        const children = Array.from(container.children);

        // Find the "Potential Drops" section and insert before it
        // The case info section (with Open button) is right before Potential Drops
        for (let i = 0; i < children.length; i++) {
            if (children[i].textContent?.includes('Potential Drops')) {
                // Return the element BEFORE Potential Drops (the case info section)
                if (i > 0) {
                    return children[i - 1];
                }
            }
        }

        // Fallback: find the Open button and traverse up
        const openBtn = Array.from(document.querySelectorAll('button')).find(b =>
            b.textContent?.includes('Open for')
        );

        if (openBtn) {
            // Traverse up to find the case info container
            let el = openBtn;
            while (el && el.parentElement !== container) {
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
            const rawData = await ClashGGAPI.fetchCaseData(caseSlug);
            if (rawData) {
                return ClashGGParser.transform(rawData);
            }
            return null;
        } catch (error) {
            console.error('[Clash.gg Adapter] Error fetching case data:', error);
            return null;
        }
    }

    /**
     * Fetch user's currency preference
     * Clash.gg prices are in cents, convert to USD
     * @returns {Promise<Object>} - Currency object
     */
    async fetchUserCurrency() {
        return CurrencyService.defaultCurrency;
    }
}

// Make available globally for content scripts
window.ClashGGAdapter = ClashGGAdapter;
