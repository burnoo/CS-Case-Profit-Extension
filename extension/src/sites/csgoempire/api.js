/**
 * CSGOEmpire API Service
 * Fetches case data from CSGOEmpire API
 *
 * Required headers:
 * - x-empire-device-identifier: UUID from localStorage['security:uuid']
 * - x-env-class: from env_class cookie (usually 'green')
 */

const CSGOEmpireAPI = {
    /**
     * Get device identifier from localStorage or generate new one
     * @returns {string}
     */
    getDeviceIdentifier() {
        let deviceId = localStorage.getItem('security:uuid');
        if (!deviceId) {
            // Generate a new UUID if not present
            deviceId = crypto.randomUUID();
            localStorage.setItem('security:uuid', deviceId);
        }
        return deviceId;
    },

    /**
     * Get environment class from cookie
     * @returns {string}
     */
    getEnvClass() {
        const match = document.cookie.match(/env_class=([^;]+)/);
        return match ? match[1] : 'green';
    },

    /**
     * Fetch case data from API
     * @param {string} caseSlug - Case slug (e.g., "ophidian")
     * @returns {Promise<Object|null>} - Case data or null on error
     */
    async fetchCaseData(caseSlug) {
        try {
            const deviceId = this.getDeviceIdentifier();
            const envClass = this.getEnvClass();

            const response = await fetch(`/api/v2/caseopening/case/${caseSlug}`, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'x-empire-device-identifier': deviceId,
                    'x-env-class': envClass
                }
            });

            if (!response.ok) {
                console.error('[CSGOEmpire API] HTTP error:', response.status);
                return null;
            }

            const json = await response.json();

            if (!json.success || !json.data) {
                console.error('[CSGOEmpire API] Invalid response:', json);
                return null;
            }

            return json.data;
        } catch (error) {
            console.error('[CSGOEmpire API] Error fetching case data:', error);
            return null;
        }
    }
};

// Make available globally for content scripts
window.CSGOEmpireAPI = CSGOEmpireAPI;
