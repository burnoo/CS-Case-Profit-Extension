/**
 * Hellcase API Service
 * Handles all API calls to Hellcase
 */

const HellcaseAPI = {
    BASE_URL: 'https://api.hellcase.com',

    /**
     * Fetch case data from Hellcase API
     * @param {string} caseSlug - Case slug/identifier
     * @returns {Promise<Object|null>} - Raw API response or null on error
     */
    async fetchCaseData(caseSlug) {
        try {
            const response = await fetch(`${this.BASE_URL}/open/${caseSlug}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('[Hellcase API] Error fetching case data:', error);
            return null;
        }
    },

    /**
     * Fetch user data including currency settings
     * @returns {Promise<Object|null>} - User data or null on error
     */
    async fetchUserData() {
        try {
            const response = await fetch(`${this.BASE_URL}/root`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('[Hellcase API] Error fetching user data:', error);
            return null;
        }
    }
};

// Make available globally for content scripts
window.HellcaseAPI = HellcaseAPI;
