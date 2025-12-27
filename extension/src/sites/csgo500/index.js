/**
 * CSGO500 Site Adapter
 * Implements the site adapter interface for CSGO500
 *
 * URL patterns:
 * - /cases/user-cases/solo/{caseId}
 * - /cases/official/{caseId}
 * - /cases/{category}/{caseId}
 *
 * Data source: /api/case/{caseId}?active=1
 */

class CSGO500Adapter {
    /**
     * Check if this adapter handles the given URL
     * @param {string} url - Current URL
     * @returns {boolean}
     */
    static matches(url) {
        return url.includes('csgo500.com');
    }

    /**
     * Get unique site identifier
     * @returns {string}
     */
    static getSiteId() {
        return 'csgo500';
    }

    /**
     * Check if current page is a case page
     * @returns {boolean}
     */
    isCasePage() {
        // CSGO500 case pages have /cases/ in the URL followed by a MongoDB ObjectId
        const path = window.location.pathname;
        // Match patterns like /cases/user-cases/solo/{id} or /cases/official/{id}
        return /\/cases\/.*\/[a-f0-9]{24}$/i.test(path);
    }

    /**
     * Get case identifier from URL (MongoDB ObjectId)
     * @returns {string|null}
     */
    getCaseId() {
        const match = window.location.pathname.match(/\/([a-f0-9]{24})$/i);
        return match ? match[1] : null;
    }

    /**
     * Find DOM element to insert box after
     * @returns {Promise<Element|null>}
     */
    async getInsertionPoint() {
        // Wait for the actions section to load (contains Open button)
        await this.waitForElement('.case-opening-actions', 5000);

        // Insert after the actions section, before the items section
        const actionsSection = document.querySelector('.case-opening-actions');
        if (actionsSection) {
            return actionsSection;
        }

        // Fallback: insert before items section
        const itemsSection = document.querySelector('.case-opening-items');
        if (itemsSection && itemsSection.parentElement) {
            // Return the element before items, or the spinner section
            const spinners = document.querySelector('.case-opening-spinners');
            if (spinners) {
                return spinners;
            }
        }

        // Last fallback: main content area
        const caseOpening = document.querySelector('.case-opening');
        if (caseOpening) {
            return caseOpening.firstElementChild || caseOpening;
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

        const caseId = this.getCaseId();
        if (!caseId) return null;

        try {
            const rawData = await CSGO500API.fetchCaseData(caseId);
            if (rawData) {
                return CSGO500Parser.transform(rawData);
            }
            return null;
        } catch (error) {
            console.error('[CSGO500 Adapter] Error fetching case data:', error);
            return null;
        }
    }

    /**
     * Fetch user's currency preference
     * CSGO500 uses coins (1 coin = $0.01)
     * @returns {Promise<Object>} - Currency object
     */
    async fetchUserCurrency() {
        // CSGO500 prices are in cents, convert to USD
        return CurrencyService.defaultCurrency;
    }
}

// Make available globally for content scripts
window.CSGO500Adapter = CSGO500Adapter;
