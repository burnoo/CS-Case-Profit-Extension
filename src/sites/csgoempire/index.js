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
     * Insert below Open button and above "Case contains" section
     * @returns {Promise<Element|null>}
     */
    async getInsertionPoint() {
        // Wait for the Open button to load
        await this.waitForElement('button', 3000);

        // Find the Open button
        const openBtn = Array.from(document.querySelectorAll('button')).find(b =>
            b.textContent?.trim() === 'Open'
        );

        if (openBtn) {
            // Go up to find the direct child of the main content container
            // The main container has classes: "w-full p-lg xl:p-xl"
            let el = openBtn;
            while (el && el !== document.body) {
                const parent = el.parentElement;
                // Check if parent is THE main content container (has w-full, p-lg, and xl:p-xl)
                if (parent?.className?.includes('w-full') &&
                    parent?.className?.includes('p-lg') &&
                    parent?.className?.includes('xl:p-xl')) {
                    // el is the direct child - insert after it
                    return el;
                }
                el = parent;
            }
        }

        // Fallback: find "Case contains" h3 and insert before it
        const caseContainsH3 = Array.from(document.querySelectorAll('h3')).find(h =>
            h.textContent?.includes('Case contains')
        );

        if (caseContainsH3 && caseContainsH3.previousElementSibling) {
            return caseContainsH3.previousElementSibling;
        }

        // Last fallback: find the case header section
        const h2 = document.querySelector('h2');
        if (h2) {
            let container = h2.parentElement;
            while (container && container !== document.body) {
                if (container.tagName === 'SECTION' ||
                    (container.tagName === 'DIV' && container.children.length > 2)) {
                    return container;
                }
                container = container.parentElement;
            }
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
