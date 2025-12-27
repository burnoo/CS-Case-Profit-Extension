/**
 * Hellcase Site Adapter
 * Implements the site adapter interface for Hellcase
 */

class HellcaseAdapter {
    /**
     * Check if this adapter handles the given URL
     * @param {string} url - Current URL
     * @returns {boolean}
     */
    static matches(url) {
        return url.includes('hellcase.com');
    }

    /**
     * Get unique site identifier
     * @returns {string}
     */
    static getSiteId() {
        return 'hellcase';
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
     * @returns {string|null}
     */
    getCaseId() {
        const match = window.location.pathname.match(/\/open\/([^\/]+)/);
        return match ? match[1] : null;
    }

    /**
     * Find DOM element to insert box after
     * @returns {Promise<Element|null>}
     */
    async getInsertionPoint() {
        // Try hotkeys section first
        const hotkey = document.querySelector('[class*="hot-key"]');
        if (hotkey) {
            const hotkeysSection = hotkey.closest('[class*="hot-key"]')?.parentElement;
            if (hotkeysSection) return hotkeysSection;
        }

        // Fallback: controls section
        const controls = document.querySelector('[class*="controls"]');
        if (controls?.parentElement) {
            return controls.parentElement;
        }

        // Fallback: items grid
        const itemsGrid = document.querySelector('.items-wrap_grid');
        if (itemsGrid && itemsGrid.children.length > 0) {
            return itemsGrid;
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

        const rawData = await HellcaseAPI.fetchCaseData(caseSlug);
        if (!rawData) return null;

        return HellcaseParser.transform(rawData);
    }

    /**
     * Fetch user's currency preference
     * @returns {Promise<Object>} - Currency object {name, rate, symbol}
     */
    async fetchUserCurrency() {
        const userData = await HellcaseAPI.fetchUserData();

        if (userData?.user?.user_currency) {
            const { name, rate } = userData.user.user_currency;
            return CurrencyService.create(name, rate);
        }

        return CurrencyService.defaultCurrency;
    }
}

// Make available globally for content scripts
window.HellcaseAdapter = HellcaseAdapter;
