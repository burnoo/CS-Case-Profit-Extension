/**
 * DatDrop API Service
 * Handles API calls to DatDrop
 *
 * API endpoint: https://api.datdrop.com/api/dropcase/{slug}
 */

const DatDropAPI = {
    BASE_URL: 'https://api.datdrop.com',

    /**
     * Fetch case data from API
     * @param {string} caseSlug - Case slug (e.g., "snowflake")
     * @returns {Promise<Object|null>} - Case data or null on error
     */
    async fetchCaseData(caseSlug) {
        try {
            const response = await fetch(`${this.BASE_URL}/api/dropcase/${caseSlug}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'x-oauth-client-id': '1',
                    'x-client-version': '11'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const json = await response.json();
            return json.drop_case || null;
        } catch (error) {
            console.error('[DatDrop API] Error fetching case data:', error);
            return null;
        }
    }
};

// Make available globally for content scripts
window.DatDropAPI = DatDropAPI;
