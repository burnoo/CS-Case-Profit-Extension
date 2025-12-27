/**
 * DaddySkins Promo Handler
 * Site-specific logic for detecting deposit pages and applying promo codes
 */

const DaddySkinsPromoHandler = {
    /**
     * Detect if the deposit/balance-refill page is showing promo section
     * @returns {boolean}
     */
    depositDetector() {
        return !!document.querySelector('.promo-code-info');
    },

    /**
     * Check if the promo code is already activated
     * @returns {boolean}
     */
    isPromoActive() {
        // Check the input value
        const input = document.querySelector('.promocode-input input');
        if (input && input.value === 'CSCASEPROFIT') {
            return true;
        }
        // Check if promo code info area mentions our code
        const promoInfo = document.querySelector('.promo-code-info .new-info-title');
        if (promoInfo && promoInfo.textContent.includes('CSCASEPROFIT')) {
            return true;
        }
        return false;
    },

    /**
     * Find the promo code input field
     * @returns {HTMLInputElement|null}
     */
    getPromoInput() {
        return document.querySelector('.promocode-input input');
    },

    /**
     * Find the apply button
     * @returns {HTMLButtonElement|null}
     */
    getApplyButton() {
        return document.querySelector('.apply-code.app-button');
    },

    /**
     * Find the insertion point for the banner
     * @returns {Object|null} - { element, position }
     */
    getInsertionPoint() {
        // Insert after the payment-methods-wrapper__header section
        const headerWrapper = document.querySelector('.payment-methods-wrapper__header');
        if (headerWrapper) {
            return { element: headerWrapper, position: 'after' };
        }
        return null;
    }
};

// Register with PromoBanner when available
if (window.PromoBanner) {
    window.PromoBanner.registerSiteHandler(DaddySkinsPromoHandler);
}

// Make available globally
window.DaddySkinsPromoHandler = DaddySkinsPromoHandler;
