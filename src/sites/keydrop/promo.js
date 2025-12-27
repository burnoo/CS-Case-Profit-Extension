/**
 * KeyDrop Promo Handler
 * Site-specific logic for detecting payment modal and applying promo codes
 */

const KeyDropPromoHandler = {
    /**
     * Find the payment modal (not the chat widget)
     * @returns {HTMLElement|null}
     */
    getPaymentModal() {
        const dialogs = document.querySelectorAll('[role="dialog"]');
        for (const dialog of dialogs) {
            // Payment modal contains payment-related text
            const text = dialog.innerText || '';
            if (text.includes('PAYMENT') || text.includes('TOP-UP') || text.includes('Promo Code')) {
                return dialog;
            }
        }
        return null;
    },

    /**
     * Detect if the payment modal is visible
     * @returns {boolean}
     */
    depositDetector() {
        const modal = this.getPaymentModal();
        if (!modal) return false;

        // Check for promo code input
        const promoInput = document.querySelector('input[placeholder*="Promo Code"]');
        if (promoInput) {
            const rect = promoInput.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) return true;
        }

        // Check for "Promocode activated" section (when another code is active)
        const activatedSection = this.getActivatedPromoSection();
        if (activatedSection) return true;

        return false;
    },

    /**
     * Find the "Promocode activated" section if present
     * @returns {HTMLElement|null}
     */
    getActivatedPromoSection() {
        const modal = this.getPaymentModal();
        if (!modal) return null;

        // Look for the smallest bg-navy section containing "PROMOCODE ACTIVATED"
        const bgNavySections = modal.querySelectorAll('div[class*="bg-navy"]');
        let smallestSection = null;
        let smallestLength = Infinity;

        for (const section of bgNavySections) {
            const text = section.innerText?.toUpperCase() || '';
            if (text.includes('PROMOCODE') && text.includes('ACTIVATED')) {
                if (text.length < smallestLength) {
                    smallestLength = text.length;
                    smallestSection = section;
                }
            }
        }
        return smallestSection;
    },

    /**
     * Check if OUR promo code (CSCASEPROFIT) is already activated
     * @returns {boolean}
     */
    isPromoActive() {
        // Check the input value
        const input = document.querySelector('input[placeholder*="Promo Code"]');
        if (input && input.value.toUpperCase() === 'CSCASEPROFIT') {
            return true;
        }

        // Check if "Promocode activated" section shows our code
        const activatedSection = this.getActivatedPromoSection();
        if (activatedSection) {
            const sectionText = activatedSection.textContent?.toUpperCase() || '';
            if (sectionText.includes('CSCASEPROFIT')) {
                return true;
            }
        }

        return false;
    },

    /**
     * Find the promo code input field
     * @returns {HTMLInputElement|null}
     */
    getPromoInput() {
        return document.querySelector('input[placeholder*="Promo Code"]');
    },

    /**
     * Find the apply button (KeyDrop may auto-apply on Enter)
     * @returns {HTMLButtonElement|null}
     */
    getApplyButton() {
        // KeyDrop might not have a dedicated apply button
        // The code might apply automatically or on Enter key
        // Look for any submit-like button near the input
        const promoInput = this.getPromoInput();
        if (!promoInput) return null;

        const promoSection = promoInput.closest('div[class*="bg-navy"]');
        if (promoSection) {
            // Look for any button that's not "Cancel"
            const buttons = promoSection.querySelectorAll('button');
            for (const btn of buttons) {
                const text = btn.textContent?.toLowerCase() || '';
                if (!text.includes('cancel')) {
                    return btn;
                }
            }
        }
        return null;
    },

    /**
     * Find the insertion point for the banner
     * @returns {Object|null} - { element, position }
     */
    getInsertionPoint() {
        // First try: promo code input section
        const promoInput = this.getPromoInput();
        if (promoInput) {
            const promoSection = promoInput.closest('div[class*="bg-navy"]');
            if (promoSection) {
                return { element: promoSection, position: 'after' };
            }
        }

        // Second try: "Promocode activated" section
        const activatedSection = this.getActivatedPromoSection();
        if (activatedSection) {
            return { element: activatedSection, position: 'after' };
        }

        return null;
    },

    /**
     * Custom apply code method that handles KeyDrop's input behavior
     * @param {string} code - The promo code to apply
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async applyCode(code) {
        try {
            let input = this.getPromoInput();

            // If no input visible, check if we need to click edit button on activated section
            if (!input) {
                const activatedSection = this.getActivatedPromoSection();
                if (activatedSection) {
                    // Click the edit button (pencil icon)
                    const editBtn = activatedSection.querySelector('button');
                    if (editBtn) {
                        editBtn.click();
                        await new Promise(resolve => setTimeout(resolve, 500));
                        input = this.getPromoInput();
                    }
                }
            }

            if (!input) {
                return { success: false, message: 'Could not find promo code input' };
            }

            // Clear and fill the input
            input.value = '';
            input.focus();

            // Simulate typing for React compatibility
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype, 'value'
            ).set;
            nativeInputValueSetter.call(input, code);

            // Dispatch input events
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

            // Try pressing Enter to apply the code
            input.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
            }));
            input.dispatchEvent(new KeyboardEvent('keypress', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
            }));
            input.dispatchEvent(new KeyboardEvent('keyup', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
            }));

            // Check if there's an apply button to click
            const applyBtn = this.getApplyButton();
            if (applyBtn && !applyBtn.disabled) {
                applyBtn.click();
            }

            return { success: true, message: 'Code applied!' };

        } catch (e) {
            console.error('[KeyDropPromoHandler] Error applying code:', e);
            return { success: false, message: 'Error applying code' };
        }
    }
};

// Register with PromoBanner when available
if (window.PromoBanner) {
    window.PromoBanner.registerSiteHandler(KeyDropPromoHandler);
}

// Make available globally
window.KeyDropPromoHandler = KeyDropPromoHandler;
