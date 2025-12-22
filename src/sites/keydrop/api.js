/**
 * KeyDrop API Service
 * Handles API calls to KeyDrop
 *
 * API endpoint: https://keydrop.com/{lang}/apiData/skins/Cases/getCaseData/{slug}
 * Token endpoint: https://keydrop.com/{lang}/token
 */

const KeyDropAPI = {
    /**
     * Get the language code from URL
     * @returns {string} - Language code (e.g., 'en', 'pl')
     */
    getLang() {
        const match = window.location.pathname.match(/^\/([a-z]{2})\//);
        return match ? match[1] : 'en';
    },

    /**
     * Fetch authorization token
     * @returns {Promise<string|null>} - JWT token or null on error
     */
    async fetchToken() {
        try {
            const lang = this.getLang();
            const response = await fetch(`/${lang}/token?t=${Date.now()}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const token = await response.text();
            return token;
        } catch (error) {
            console.error('[KeyDrop API] Error fetching token:', error);
            return null;
        }
    },

    /**
     * Fetch case data from API
     * @param {string} caseSlug - Case slug (e.g., "crocodilo")
     * @returns {Promise<Object|null>} - Case data or null on error
     */
    async fetchCaseData(caseSlug) {
        try {
            const token = await this.fetchToken();
            if (!token) {
                throw new Error('Failed to get authorization token');
            }

            const lang = this.getLang();
            const response = await fetch(`/${lang}/apiData/skins/Cases/getCaseData/${caseSlug}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-currency': 'USD'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const json = await response.json();
            return json.data || null;
        } catch (error) {
            console.error('[KeyDrop API] Error fetching case data:', error);
            return null;
        }
    }
};

// Make available globally for content scripts
window.KeyDropAPI = KeyDropAPI;
