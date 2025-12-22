/**
 * DatDrop Site Adapter
 * Implements the site adapter interface for DatDrop
 *
 * URL pattern: https://datdrop.com/case/{slug}
 * API: https://api.datdrop.com/api/dropcase/{slug}
 */

class DatDropAdapter {
    /**
     * Check if this adapter handles the given URL
     * @param {string} url - Current URL
     * @returns {boolean}
     */
    static matches(url) {
        return url.includes('datdrop.com');
    }

    /**
     * Get unique site identifier
     * @returns {string}
     */
    static getSiteId() {
        return 'datdrop';
    }

    /**
     * Check if current page is a case page
     * @returns {boolean}
     */
    isCasePage() {
        return !!this.getCaseId();
    }

    /**
     * Get case identifier from URL
     * URL pattern: /case/{slug}
     * @returns {string|null}
     */
    getCaseId() {
        const match = window.location.pathname.match(/\/case\/([^\/]+)/);
        return match ? match[1] : null;
    }

    /**
     * Find DOM element to insert box after
     * @returns {Promise<Element|null>}
     */
    async getInsertionPoint() {
        // Find the section containing the "Sign in with Steam" / buy button
        // It has class containing "dropCasePicker"
        const pickerSection = document.querySelector('section[class*="dropCasePicker"]');
        if (pickerSection) {
            return pickerSection;
        }

        // Alternative: find the button and go up to its section parent
        const signInBtn = Array.from(document.querySelectorAll('button')).find(b =>
            b.textContent.trim().toLowerCase().includes('sign in with steam') ||
            b.textContent.trim().toLowerCase().includes('open case')
        );

        if (signInBtn) {
            // Go up to find section parent
            let el = signInBtn;
            while (el.parentElement) {
                el = el.parentElement;
                if (el.tagName === 'SECTION') {
                    return el;
                }
            }
        }

        // Fallback: find main content area
        const main = document.querySelector('main');
        if (main?.firstElementChild) {
            return main.firstElementChild;
        }

        return null;
    }

    /**
     * Fetch case data from API
     * @returns {Promise<Object|null>} - Unified CaseData object
     */
    async fetchCaseData() {
        const caseSlug = this.getCaseId();
        if (!caseSlug) return null;

        try {
            const rawData = await DatDropAPI.fetchCaseData(caseSlug);
            if (rawData) {
                return DatDropParser.transform(rawData);
            }
            return null;
        } catch (error) {
            console.error('[DatDrop Adapter] Error fetching case data:', error);
            return null;
        }
    }

    /**
     * Fetch user's currency preference
     * DatDrop uses USD by default
     * @returns {Promise<Object>} - Currency object {name, rate, symbol}
     */
    async fetchUserCurrency() {
        // DatDrop prices are in cents (USD)
        return CurrencyService.defaultCurrency;
    }
}

// Make available globally for content scripts
window.DatDropAdapter = DatDropAdapter;
