/**
 * Skin.Club API Service
 * Handles API calls to Skin.Club (used as fallback when SSR data unavailable)
 *
 * Note: Primary data access is via Nuxt SSR payload in the adapter.
 * This API service is mainly used for user data fallback.
 */

const SkinClubAPI = {
    BASE_URL: 'https://gate.skin.club',

    /**
     * Fetch case data from API
     * Used as fallback when SSR payload is not available (SPA navigation)
     * @param {string} caseSlug - Case slug (e.g., "knife", "ak-47")
     * @returns {Promise<Object|null>} - Case data or null on error
     */
    async fetchCaseData(caseSlug) {
        try {
            const response = await fetch(`${this.BASE_URL}/apiv2/cases/${caseSlug}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const json = await response.json();
            return json.data || null;
        } catch (error) {
            console.error('[SkinClub API] Error fetching case data:', error);
            return null;
        }
    },

    /**
     * Fetch user data including currency settings
     * Endpoint: /apiv2/user or similar
     * @returns {Promise<Object|null>} - User data or null on error
     */
    async fetchUserData() {
        try {
            const response = await fetch(`${this.BASE_URL}/apiv2/user`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                // User might not be logged in - this is not an error
                if (response.status === 401 || response.status === 403) {
                    return null;
                }
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            // Silently fail for user data - will use default currency
            console.debug('[SkinClub API] Could not fetch user data:', error.message);
            return null;
        }
    }
};

// Make available globally for content scripts
window.SkinClubAPI = SkinClubAPI;
