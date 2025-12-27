/**
 * Hellcase Promo Handler
 * Site-specific logic for detecting deposit pages and applying promo codes
 */

const HellcasePromoHandler = {
    /**
     * Detect if the refill/deposit modal is open
     * @returns {boolean}
     */
    depositDetector() {
        // Look for the fill-up-modal promo banner section
        return !!document.querySelector('.fill-up-modal__promo-banner');
    },

    /**
     * Check if the promo code is already activated
     * @returns {boolean}
     */
    isPromoActive() {
        const promoBanner = document.querySelector('.fill-up-modal__promo-banner');
        if (!promoBanner) return false;

        return promoBanner.textContent.includes('CSCASEPROFIT');
    },

    /**
     * Find the promo code input field
     * @returns {HTMLInputElement|null}
     */
    getPromoInput() {
        // Use specific class selector for the promo code input
        const input = document.querySelector('.fill-up-modal__promocode-field input.input');
        if (input) return input;

        // Fallback: find input in the promocode form
        const form = document.querySelector('.fill-up-modal__promocode');
        if (form) {
            return form.querySelector('input[type="text"], input.input');
        }
        return null;
    },

    /**
     * Find the apply button
     * @returns {HTMLButtonElement|null}
     */
    getApplyButton() {
        // Use specific class selector
        return document.querySelector('.fill-up-modal__promocode-button');
    },

    /**
     * Find the insertion point for the banner
     * @returns {Object|null} - { element, position }
     */
    getInsertionPoint() {
        // Insert after the fill-up-modal__promo-banner element
        const promoBanner = document.querySelector('.fill-up-modal__promo-banner');
        if (promoBanner) {
            return { element: promoBanner, position: 'after' };
        }
        return null;
    }
};

// Register with PromoBanner when available
if (window.PromoBanner) {
    window.PromoBanner.registerSiteHandler(HellcasePromoHandler);
}

// Make available globally
window.HellcasePromoHandler = HellcasePromoHandler;
