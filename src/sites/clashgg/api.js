/**
 * Clash.gg API Service
 * Fetches case data from Clash.gg API
 *
 * API endpoint: /api/cases/{slug}
 * No special headers required
 */

const ClashGGAPI = {
    /**
     * Fetch case data from API
     * @param {string} caseSlug - Case slug from URL
     * @returns {Promise<Object|null>} - Case data or null on error
     */
    async fetchCaseData(caseSlug) {
        try {
            const response = await fetch(`/api/cases/${caseSlug}`, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                console.error('[Clash.gg API] HTTP error:', response.status);
                return null;
            }

            const json = await response.json();

            if (!json.name || !json.items) {
                console.error('[Clash.gg API] Invalid response: missing case data');
                return null;
            }

            return json;
        } catch (error) {
            console.error('[Clash.gg API] Error fetching case data:', error);
            return null;
        }
    }
};

// Make available globally for content scripts
window.ClashGGAPI = ClashGGAPI;
