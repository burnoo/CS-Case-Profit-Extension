/**
 * DaddySkins API Service
 * Handles GraphQL API calls to DaddySkins
 *
 * API endpoint: POST https://api.daddyskins.com/api
 * Uses GraphQL FetchSteamCase query
 */

const DaddySkinsAPI = {
    BASE_URL: 'https://api.daddyskins.com/api',

    /**
     * Fetch case data from GraphQL API
     * @param {string} caseSlug - Case slug (e.g., "overpass")
     * @param {string} locale - Locale (default: "en")
     * @returns {Promise<Object|null>} - Case data or null on error
     */
    async fetchCaseData(caseSlug, locale = 'en') {
        const query = `
            query FetchSteamCase($slug: String!, $locale: String!) {
                case(slug: $slug, locale: $locale) {
                    id
                    name
                    price
                    slug
                    products {
                        id
                        name
                        short_description
                        class
                        price
                        quality
                        stattrak
                        chance
                        image
                    }
                }
            }
        `;

        try {
            const response = await fetch(this.BASE_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic Og=='
                },
                body: JSON.stringify({
                    operationName: 'FetchSteamCase',
                    variables: { slug: caseSlug, locale: locale },
                    query: query
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const json = await response.json();
            return json.data?.case || null;
        } catch (error) {
            console.error('[DaddySkins API] Error fetching case data:', error);
            return null;
        }
    }
};

// Make available globally for content scripts
window.DaddySkinsAPI = DaddySkinsAPI;
