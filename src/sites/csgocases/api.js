/**
 * CSGOCases API Service
 * Handles API calls to CSGOCases
 *
 * API endpoint: GET https://csgocases.com/api.php/case/{slug}
 */

const CSGOCasesAPI = {
    BASE_URL: 'https://csgocases.com/api.php',

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
