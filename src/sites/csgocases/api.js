/**
 * CSGOCases API Service
 * Handles API calls to CSGOCases
 *
 * API endpoint: GET https://csgocases.com/api.php/case/{slug}
 */

const CSGOCasesAPI = {
    BASE_URL: 'https://csgocases.com/api.php',

    /**
     * Fetch user auth data including currency preference
     * @returns {Promise<Object|null>} - User data or null
     */
    async fetchUserAuth() {
        try {
            const response = await fetch(`${this.BASE_URL}/auth`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) return null;
            const json = await response.json();
            return json.user || null;
        } catch (error) {
            console.error('[CSGOCases API] Error fetching auth:', error);
            return null;
        }
    },

    /**
     * Get case price from page (already in user currency)
     * @returns {number} - Case price in user currency
     */
    getCasePriceFromPage() {
        const pageText = document.body.innerText;
        const match = pageText.match(/Open\s+([\d\s,.]+)\s*(?:zł|PLN|\$|€|£)/i);
        if (match) {
            // Handle European number format (1 234,56 or 1.234,56)
            const priceStr = match[1].replace(/\s/g, '').replace(',', '.');
            return parseFloat(priceStr) || 0;
        }
        return 0;
    },

    /**
     * Fetch case data from API
     * @param {string} caseSlug - Case slug (e.g., "mysterious")
     * @returns {Promise<Object|null>} - Case data or null on error
     */
    async fetchCaseData(caseSlug) {
        try {
            const response = await fetch(`${this.BASE_URL}/case/${caseSlug}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const json = await response.json();
            return json || null;
        } catch (error) {
            console.error('[CSGOCases API] Error fetching case data:', error);
            return null;
        }
    }
};

// Make available globally for content scripts
window.CSGOCasesAPI = CSGOCasesAPI;
