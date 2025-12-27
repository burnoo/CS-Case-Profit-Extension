/**
 * CSGOCases API Service
 * Handles API calls to CSGOCases
 *
 * API endpoint: GET https://csgocases.com/api.php/case/{slug}
 */

const CSGOCasesAPI = {
    BASE_URL: 'https://csgocases.com/api.php',

    /**
     * Get displayed currency from page (the currency selector button)
     * @returns {string|null} - Currency code or null
     */
    getCurrencyFromPage() {
        const currencyCodes = ['EUR', 'USD', 'PLN', 'RUB', 'GBP', 'UAH', 'BRL', 'TRY', 'CNY', 'JPY'];
        const buttons = document.querySelectorAll('button, [role="button"]');

        for (const btn of buttons) {
            const text = btn.innerText.trim();
            if (currencyCodes.includes(text)) {
                return text;
            }
        }
        return null;
    },

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
     * Uses DOM selector instead of text matching for language independence
     * @returns {number} - Case price in user currency
     */
    getCasePriceFromPage() {
        // Get price from the lottery/open button - works for any language
        const lotteryStart = document.querySelector('#lotteryStart');
        const priceSpan = lotteryStart?.querySelector('span');
        const text = priceSpan?.innerText || '';

        // Extract numeric value with currency symbol (language-independent)
        const match = text.match(/([\d\s,.]+)\s*(?:zł|PLN|\$|€|£|₽|RUB|UAH|₴)/i);
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
