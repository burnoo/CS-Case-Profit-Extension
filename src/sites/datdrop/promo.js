/**
 * DatDrop Promo Handler
 * Site-specific logic for detecting promo section and applying promo codes
 */

const DatDropPromoHandler = {
    /**
     * Detect if the promo code section is visible on the page
     * @returns {boolean}
     */
    depositDetector() {
        // Check if "Add promocode" button is visible
        const addPromoBtn = Array.from(document.querySelectorAll('button')).find(b =>
            b.textContent.includes('Add promocode')
        );
        if (addPromoBtn) {
            const rect = addPromoBtn.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
        }
        return false;
    },

    /**
     * Check if the promo code is already activated
     * @returns {boolean}
     */
    isPromoActive() {
        // Check if promo input exists and has our code
        const input = document.querySelector('input[placeholder="Enter promo code"]');
        if (input && input.value.toUpperCase() === 'CSCASEPROFIT') {
            return true;
        }
        // Check page text for activation confirmation
        const pageText = document.body.textContent;
        if (pageText.includes('CSCASEPROFIT') &&
            (pageText.includes('activated') || pageText.includes('applied'))) {
            return true;
        }
        return false;
    },

    /**
     * Find the promo code input field (may need to open modal first)
     * @returns {HTMLInputElement|null}
     */
    getPromoInput() {
        return document.querySelector('input[placeholder="Enter promo code"]');
    },

    /**
     * Find the apply button
     * @returns {HTMLButtonElement|null}
     */
    getApplyButton() {
        // First check if modal is open and has Apply button
        const applyBtn = Array.from(document.querySelectorAll('button')).find(b =>
            b.textContent.trim() === 'Apply'
        );
        if (applyBtn) {
            const rect = applyBtn.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                return applyBtn;
            }
        }
        return null;
    },

    /**
     * Find the "Add promocode" button that opens the modal
     * @returns {HTMLButtonElement|null}
     */
    getAddPromocodeButton() {
        return Array.from(document.querySelectorAll('button')).find(b =>
            b.textContent.includes('Add promocode')
        );
    },

    /**
     * Find the insertion point for the banner
     * @returns {Object|null} - { element, position }
     */
    getInsertionPoint() {
        // Find the promo section containing "Add promocode" button
        const addPromoBtn = this.getAddPromocodeButton();
        if (!addPromoBtn) return null;

        // Get the promo section container
        const promoSection = addPromoBtn.closest('[class*="_BbBdWmTdRIBS5pqH4Wx2"]') ||
                             addPromoBtn.closest('[class*="_X2uW4aXmptZImrDigHSb"]') ||
                             addPromoBtn.parentElement?.parentElement;

        if (promoSection) {
            // Use parent container for lower placement (avoids overlap with close button)
            const parentContainer = promoSection.parentElement;
            if (parentContainer) {
                return { element: parentContainer, position: 'after' };
            }
            return { element: promoSection, position: 'after' };
        }

        return null;
    },

    /**
     * Custom apply code method that handles opening the modal first
     * This overrides the default PromoBanner behavior
     * @param {string} code - The promo code to apply
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async applyCode(code) {
        try {
            // Step 1: Check if modal is already open
            let input = this.getPromoInput();

            if (!input) {
                // Step 2: Click "Add promocode" to open modal
                const addPromoBtn = this.getAddPromocodeButton();
                if (!addPromoBtn) {
                    return { success: false, message: 'Could not find Add promocode button' };
                }

                addPromoBtn.click();

                // Wait for modal to open
                await new Promise(resolve => setTimeout(resolve, 500));

                input = this.getPromoInput();
                if (!input) {
                    return { success: false, message: 'Could not find promo code input' };
                }
            }

            // Step 3: Fill the input
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

            // Wait for UI to update
            await new Promise(resolve => setTimeout(resolve, 300));

            // Step 4: Click Apply button
            const applyBtn = this.getApplyButton();
            if (applyBtn && !applyBtn.disabled) {
                applyBtn.click();
                return { success: true, message: 'Code applied!' };
            } else {
                return { success: true, message: 'Code entered - click Apply to activate' };
            }

        } catch (e) {
            console.error('[DatDropPromoHandler] Error applying code:', e);
            return { success: false, message: 'Error applying code' };
        }
    }
};

// Register with PromoBanner when available
if (window.PromoBanner) {
    window.PromoBanner.registerSiteHandler(DatDropPromoHandler);
}

// Make available globally
window.DatDropPromoHandler = DatDropPromoHandler;
