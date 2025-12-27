/**
 * DaddySkins Site Adapter
 * Implements the site adapter interface for daddyskins.com
 *
 * URL patterns:
 * - /en/case/{slug}
 * - /{locale}/case/{slug}
 *
 * Data source: GraphQL API
 */

class DaddySkinsAdapter {
    /**
     * Check if this adapter handles the given URL
     * @param {string} url - Current URL
     * @returns {boolean}
     */
    static matches(url) {
        return url.includes('daddyskins.com');
    }

    /**
     * Get unique site identifier
     * @returns {string}
     */
    static getSiteId() {
        return 'daddyskins';
    }

    /**
     * Check if current page is a case page
     * @returns {boolean}
     */
    isCasePage() {
        const path = window.location.pathname;
        // Match /{locale}/case/{slug} pattern
        return /^\/[a-z]{2}\/case\/[^/]+/.test(path);
    }

    /**
     * Get case slug from URL
     * @returns {string|null}
     */
    getCaseSlug() {
        const match = window.location.pathname.match(/^\/[a-z]{2}\/case\/([^/]+)/);
        return match ? match[1] : null;
    }

    /**
     * Get locale from URL
     * @returns {string}
     */
    getLocale() {
        const match = window.location.pathname.match(/^\/([a-z]{2})\/case\//);
        return match ? match[1] : 'en';
    }

    /**
     * Find DOM element to insert box after
     * @returns {Promise<Element|null>}
     */
    async getInsertionPoint() {
        // Wait for the case page to load
        await this.waitForElement('.single-case-actions-utils', 5000);

        // Try to find the actions utils section (contains the buy/open button)
        const actionsSection = document.querySelector('.single-case-actions-utils');
        if (actionsSection) {
            return actionsSection;
        }

        // Fallback: look for single-case section
        const singleCaseSection = document.querySelector('section.single-case');
        if (singleCaseSection) {
            return singleCaseSection;
        }

        // Fallback: look for case-container
        const caseContainer = document.querySelector('.case-container');
        if (caseContainer) {
            return caseContainer;
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
     * Fetch case data from GraphQL API
     * @returns {Promise<Object|null>} - Unified CaseData object
     */
    async fetchCaseData() {
        if (!this.isCasePage()) return null;

        const caseSlug = this.getCaseSlug();
        const locale = this.getLocale();

        if (!caseSlug) return null;

        try {
            const rawData = await DaddySkinsAPI.fetchCaseData(caseSlug, locale);
            if (rawData) {
                return DaddySkinsParser.transform(rawData);
            }
            return null;
        } catch (error) {
            console.error('[DaddySkins Adapter] Error fetching case data:', error);
            return null;
        }
    }

    /**
     * Fetch user's currency preference
     * DaddySkins prices are in USD (from API)
     * @returns {Promise<Object>} - Currency object
     */
    async fetchUserCurrency() {
        return CurrencyService.defaultCurrency;
    }
}

// Make available globally for content scripts
window.DaddySkinsAdapter = DaddySkinsAdapter;
