/**
 * Skin.Club Site Adapter
 * Implements the site adapter interface for Skin.Club
 *
 * Data is fetched from the API: https://gate.skin.club/apiv2/cases/{slug}
 * URL pattern: /en/cases/open/{slug} (with locale prefix)
 */

class SkinClubAdapter {
    /**
     * Check if this adapter handles the given URL
     * @param {string} url - Current URL
     * @returns {boolean}
     */
    static matches(url) {
        return url.includes('skin.club');
    }

    /**
     * Get unique site identifier
     * @returns {string}
     */
    static getSiteId() {
        return 'skinclub';
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
     * URL pattern: /{locale}/cases/open/{slug}
     * @returns {string|null}
     */
    getCaseId() {
        // Match pattern: /en/cases/open/knife or /cases/open/knife
        const match = window.location.pathname.match(/\/cases\/open\/([^\/]+)/);
        return match ? match[1] : null;
    }

    /**
     * Find DOM element to insert box after
     * Insert after buy button area, before "Last top skins" section
     * @returns {Promise<Element|null>}
     */
    async getInsertionPoint() {
        // Primary: Insert after case-buttons parent container
        // This places the box below the buy button and above "Last top skins"
        const caseButtons = document.querySelector('.case-buttons');
        if (caseButtons?.parentElement) {
            return caseButtons.parentElement;
        }

        // Fallback: Insert after the roulette wrapper
        const rouletteWrapper = document.querySelector('.roulette-wrapper');
        if (rouletteWrapper?.parentElement) {
            return rouletteWrapper.parentElement;
        }

        // Fallback: Find "Last top skins" and insert before its container
        const lastTopSkinsH2 = Array.from(document.querySelectorAll('h2')).find(h =>
            h.textContent.toLowerCase().includes('last top skins')
        );
        if (lastTopSkinsH2) {
            // Return the previous sibling of the Last top skins container
            const lastTopContainer = lastTopSkinsH2.closest('div[class*="_Kghq4j7V"]') ||
                                     lastTopSkinsH2.parentElement?.parentElement;
            if (lastTopContainer?.previousElementSibling) {
                return lastTopContainer.previousElementSibling;
            }
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
            const rawData = await SkinClubAPI.fetchCaseData(caseSlug);
            if (rawData) {
                return SkinClubParser.transform(rawData);
            }
            return null;
        } catch (error) {
            console.error('[SkinClub Adapter] Error fetching case data:', error);
            return null;
        }
    }

    /**
     * Fetch user's currency preference
     * @returns {Promise<Object>} - Currency object {name, rate, symbol}
     */
    async fetchUserCurrency() {
        try {
            // Try to get from API
            const userData = await SkinClubAPI.fetchUserData();
            if (userData?.currency) {
                const { name, rate } = userData.currency;
                return CurrencyService.create(name, rate);
            }
        } catch (error) {
            console.error('[SkinClub Adapter] Error fetching user currency:', error);
        }

        // Default to USD
        return CurrencyService.defaultCurrency;
    }
}

// Make available globally for content scripts
window.SkinClubAdapter = SkinClubAdapter;
