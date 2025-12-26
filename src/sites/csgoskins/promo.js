/**
 * CSGO-Skins Promo Handler
 * Site-specific logic for detecting deposit pages and applying promo codes
 */

const CSGOSkinsPromoHandler = {
    /**
     * Detect if the deposit modal is open
     * @returns {boolean}
     */
    depositDetector() {
        return !!document.querySelector('.DepositWindowPromoCode');
    },

    /**
     * Check if the promo code is already activated
     * @returns {boolean}
     */
    isPromoActive() {
        // Check the title/header area specifically, not the whole section
        // (since our banner is inserted inside the section)
        const title = document.querySelector('.DepositWindowPromoCode_title');
        if (title && title.textContent.includes('CSCASEPROFIT')) {
            return true;
        }
        // Also check the input value
        const input = document.querySelector('.DepositWindowPromoCode_input');
        if (input && input.value === 'CSCASEPROFIT') {
            return true;
        }
        return false;
    },

    /**
     * Find the promo code input field
     * @returns {HTMLInputElement|null}
     */
    getPromoInput() {
        return document.querySelector('.DepositWindowPromoCode_input');
    },

    /**
     * Find the apply button
     * @returns {HTMLButtonElement|null}
     */
    getApplyButton() {
        return document.querySelector('.DepositWindowPromoCode_button');
    },

    /**
     * Find the insertion point for the banner
     * @returns {Object|null} - { element, position }
     */
    getInsertionPoint() {
        // Insert after the top-bar section (which contains the promo code area)
        // The top-bar's parent uses flex-direction: column, so inserting after it
        // will place the banner below the entire promo section
        const topBar = document.querySelector('.DepositWindow_top-bar');
        if (topBar) {
            return { element: topBar, position: 'after' };
        }
        return null;
    }
};

// Register with PromoBanner when available
if (window.PromoBanner) {
    window.PromoBanner.registerSiteHandler(CSGOSkinsPromoHandler);
}

// Make available globally
window.CSGOSkinsPromoHandler = CSGOSkinsPromoHandler;
