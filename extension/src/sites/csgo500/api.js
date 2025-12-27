/**
 * CSGO500 API Service
 * Fetches case data from CSGO500 API
 *
 * API endpoint: /api/case/{caseId}?active=1
 * No special headers required
 */

const CSGO500API = {
    /**
     * Fetch case data from API
     * @param {string} caseId - Case ID (MongoDB ObjectId)
     * @returns {Promise<Object|null>} - Case data or null on error
     */
    async fetchCaseData(caseId) {
        try {
            const response = await fetch(`/api/case/${caseId}?active=1`, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                console.error('[CSGO500 API] HTTP error:', response.status);
                return null;
            }

            const json = await response.json();

            if (!json.case) {
                console.error('[CSGO500 API] Invalid response: no case data');
                return null;
            }

            return {
                case: json.case,
                caseItems: json.caseItems || []
            };
        } catch (error) {
            console.error('[CSGO500 API] Error fetching case data:', error);
            return null;
        }
    }
};

// Make available globally for content scripts
window.CSGO500API = CSGO500API;
