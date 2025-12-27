/**
 * DatDrop Promo Handler
 * Site-specific logic for detecting promo section and applying promo codes
 */

const DatDropPromoHandler = {
    /**
     * Get the deposit dialog if open
     * @returns {HTMLElement|null}
     */
    getDialog() {
        return document.querySelector('div[role="dialog"]');
    },

    /**
     * Detect if the promo code section is visible on the page
     * @returns {boolean}
     */
    depositDetector() {
        const dialog = this.getDialog();
        if (!dialog) return false;

        // Check if "Add promocode" button exists inside dialog
        const addPromoBtn = this.getAddPromocodeButton();
        if (addPromoBtn) return true;

        // Check if promo input exists
        const input = dialog.querySelector('input[placeholder="Enter promo code"]');
        if (input) return true;

        // Check if activated promo section exists (div with "Promocode" text)
        const activatedSection = this.getActivatedPromoSection();
        if (activatedSection) return true;

        return false;
    },

    /**
     * Find the activated promo code section (when another code is active)
     * @returns {HTMLElement|null}
     */
    getActivatedPromoSection() {
        const dialog = this.getDialog();
        if (!dialog) return null;

        // Look for div containing exactly "Promocode" text (leaf node, no children with text)
        const divs = dialog.querySelectorAll('div');
        for (let i = 0; i < divs.length && i < 100; i++) {
            const div = divs[i];
            // Check if this div's direct text (innerHTML without tags) is "Promocode"
            if (div.childNodes.length === 1 &&
                div.childNodes[0].nodeType === Node.TEXT_NODE &&
                div.childNodes[0].textContent?.trim() === 'Promocode') {
                // Return the parent container (which has the button with code name)
                return div.parentElement;
            }
        }
        return null;
    },

    /**
     * Check if OUR promo code (CSCASEPROFIT) is already activated
     * @returns {boolean}
     */
    isPromoActive() {
        const dialog = this.getDialog();
        if (!dialog) return false;

        // Check if promo input exists and has our code
        const input = dialog.querySelector('input[placeholder="Enter promo code"]');
        if (input && input.value.toUpperCase() === 'CSCASEPROFIT') {
            return true;
        }

        // Check if activated section shows our code
        const activatedSection = this.getActivatedPromoSection();
        if (activatedSection) {
            const btn = activatedSection.querySelector('button');
            if (btn && btn.textContent?.toUpperCase().includes('CSCASEPROFIT')) {
                return true;
            }
        }

        return false;
    },

    /**
     * Find the promo code input field (may need to open modal first)
     * @returns {HTMLInputElement|null}
     */
    getPromoInput() {
        const dialog = this.getDialog();
        if (!dialog) return null;
        return dialog.querySelector('input[placeholder="Enter promo code"]');
    },

    /**
     * Find the apply button
     * @returns {HTMLButtonElement|null}
     */
    getApplyButton() {
        const dialog = this.getDialog();
        if (!dialog) return null;

        const buttons = dialog.querySelectorAll('button');
        for (const btn of buttons) {
            if (btn.textContent.trim() === 'Apply') {
                const rect = btn.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    return btn;
                }
            }
        }
        return null;
    },

    /**
     * Find the "Add promocode" button that opens the modal
     * @returns {HTMLButtonElement|null}
     */
    getAddPromocodeButton() {
        const dialog = this.getDialog();
        if (!dialog) return null;

        const buttons = dialog.querySelectorAll('button');
        for (const btn of buttons) {
            if (btn.textContent.includes('Add promocode')) {
                return btn;
            }
        }
        return null;
    },

    /**
     * Find the insertion point for the banner
     * @returns {Object|null} - { element, position }
     */
    getInsertionPoint() {
        const dialog = this.getDialog();
        if (!dialog) return null;

        // First try: Find the promo section containing "Add promocode" button
        const addPromoBtn = this.getAddPromocodeButton();
        if (addPromoBtn) {
            const promoSection = addPromoBtn.parentElement?.parentElement;
            if (promoSection) {
                return { element: promoSection, position: 'after' };
            }
        }

        // Second try: use promo input's parent
        const input = dialog.querySelector('input[placeholder="Enter promo code"]');
        if (input) {
            const section = input.parentElement?.parentElement;
            if (section) {
                return { element: section, position: 'after' };
            }
        }

        // Third try: use activated promo section (go up one more level for proper placement)
        const activatedSection = this.getActivatedPromoSection();
        if (activatedSection) {
            const parentContainer = activatedSection.parentElement;
            if (parentContainer) {
                return { element: parentContainer, position: 'after' };
            }
            return { element: activatedSection, position: 'after' };
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
                // Step 2a: Try clicking "Add promocode" button
                const addPromoBtn = this.getAddPromocodeButton();
                if (addPromoBtn) {
                    addPromoBtn.click();
                    await new Promise(resolve => setTimeout(resolve, 500));
                    input = this.getPromoInput();
                }
            }

            if (!input) {
                // Step 2b: Try clicking the button in activated promo section
                const activatedSection = this.getActivatedPromoSection();
                if (activatedSection) {
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
