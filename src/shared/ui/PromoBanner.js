/**
 * Promo Banner Component
 * Displays affiliate code banner on deposit pages
 *
 * Shows banner with:
 * - Message asking user to support the extension
 * - Apply button that auto-fills and applies the promo code
 */

const PromoBanner = {
    AFFILIATE_CODE: 'CSCASEPROFIT',
    BANNER_ID: 'cscaseprofit-promo-banner',

    // Site handler set by site-specific code
    siteHandler: null,

    /**
     * Register a site-specific handler
     * @param {Object} handler - Site handler with depositDetector, getPromoInput, getApplyButton, getInsertionPoint
     */
    registerSiteHandler(handler) {
        this.siteHandler = handler;
        console.log('[PromoBanner] Site handler registered');
    },

    /**
     * Check if current page is a deposit page
     * @returns {boolean}
     */
    isDepositPage() {
        if (!this.siteHandler || !this.siteHandler.depositDetector) return false;

        try {
            return this.siteHandler.depositDetector();
        } catch (e) {
            console.error('[PromoBanner] Error detecting deposit page:', e);
            return false;
        }
    },

    /**
     * Create the promo banner HTML element
     * @returns {HTMLElement}
     */
    createBanner() {
        const banner = document.createElement('div');
        banner.id = this.BANNER_ID;
        banner.innerHTML = `
            <div class="cscaseprofit-promo-content">
                <div class="cscaseprofit-promo-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5"/>
                        <path d="M2 12l10 5 10-5"/>
                    </svg>
                </div>
                <div class="cscaseprofit-promo-text">
                    <span class="cscaseprofit-promo-message">Do you enjoy <span class="cscaseprofit-promo-name">CS Case Profit Extension</span>? Support us by using our affiliate code.</span>
                    <span class="cscaseprofit-promo-thanks"><span class="cscaseprofit-emoji">🥺</span> Thanks! <span class="cscaseprofit-emoji">🥺</span></span>
                </div>
                <div class="cscaseprofit-promo-code">
                    <span class="cscaseprofit-code-label">Code:</span>
                    <span class="cscaseprofit-code-value">${this.AFFILIATE_CODE}</span>
                </div>
                <button class="cscaseprofit-promo-apply-btn" type="button">
                    Apply Code
                </button>
                <button class="cscaseprofit-promo-close" type="button" aria-label="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
        `;

        // Add event listeners
        const applyBtn = banner.querySelector('.cscaseprofit-promo-apply-btn');
        const closeBtn = banner.querySelector('.cscaseprofit-promo-close');

        applyBtn.addEventListener('click', () => this.applyCode());
        closeBtn.addEventListener('click', () => this.hideBanner());

        return banner;
    },

    /**
     * Apply the promo code to the site's input field
     */
    async applyCode() {
        if (!this.siteHandler) {
            console.error('[PromoBanner] No site handler registered');
            return;
        }

        try {
            // Get the promo input field
            const input = this.siteHandler.getPromoInput();
            if (!input) {
                console.warn('[PromoBanner] Could not find promo code input');
                this.showFeedback('Could not find promo code field', 'error');
                return;
            }

            // Clear and fill the input
            input.value = '';
            input.focus();

            // Simulate typing for React/Vue compatibility
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            nativeInputValueSetter.call(input, this.AFFILIATE_CODE);

            // Dispatch input events
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

            // Wait a moment for the UI to update
            await new Promise(resolve => setTimeout(resolve, 300));

            // Try to click the apply button
            const applyBtn = this.siteHandler.getApplyButton();
            if (applyBtn && !applyBtn.disabled) {
                applyBtn.click();
                this.showFeedback('Code applied!', 'success');
            } else {
                this.showFeedback('Code entered - click Apply to activate', 'info');
            }

        } catch (e) {
            console.error('[PromoBanner] Error applying code:', e);
            this.showFeedback('Error applying code', 'error');
        }
    },

    /**
     * Show feedback message on the banner
     * @param {string} message
     * @param {string} type - 'success', 'error', or 'info'
     */
    showFeedback(message, type) {
        const banner = document.getElementById(this.BANNER_ID);
        if (!banner) return;

        const applyBtn = banner.querySelector('.cscaseprofit-promo-apply-btn');
        if (!applyBtn) return;

        const originalText = applyBtn.textContent;
        applyBtn.textContent = message;
        applyBtn.classList.add(`feedback-${type}`);

        setTimeout(() => {
            applyBtn.textContent = originalText;
            applyBtn.classList.remove(`feedback-${type}`);
        }, 3000);
    },

    /**
     * Check if banner is dismissed and still within the 14-day hide period
     * @returns {boolean}
     */
    isBannerDismissed() {
        const dismissedAt = localStorage.getItem('cscaseprofit-banner-dismissed');
        if (!dismissedAt) return false;

        const dismissedTime = parseInt(dismissedAt, 10);
        const now = Date.now();
        const fourteenDays = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds

        // If 14 days have passed, clear the dismissal and show banner again
        if (now - dismissedTime > fourteenDays) {
            localStorage.removeItem('cscaseprofit-banner-dismissed');
            return false;
        }

        return true;
    },

    /**
     * Show the promo banner
     */
    showBanner() {
        // Check if banner already exists
        if (document.getElementById(this.BANNER_ID)) {
            return;
        }

        // Check if user dismissed the banner within the last 14 days
        if (this.isBannerDismissed()) {
            return;
        }

        if (!this.siteHandler) return;

        // Check if promo code is already active on the site
        if (this.siteHandler.isPromoActive && this.siteHandler.isPromoActive()) {
            console.log('[PromoBanner] Promo code already active, not showing banner');
            return;
        }

        const banner = this.createBanner();

        // Try to insert at specific location
        const insertionPoint = this.siteHandler.getInsertionPoint ? this.siteHandler.getInsertionPoint() : null;
        if (insertionPoint) {
            const { element, position } = insertionPoint;
            if (position === 'before') {
                element.parentNode.insertBefore(banner, element);
            } else {
                // Insert after the element
                if (element.nextSibling) {
                    element.parentNode.insertBefore(banner, element.nextSibling);
                } else {
                    element.parentNode.appendChild(banner);
                }
            }
        } else {
            // Fallback: insert at top of body as fixed banner
            banner.classList.add('cscaseprofit-promo-fixed');
            document.body.appendChild(banner);
        }

        console.log('[PromoBanner] Banner shown');
    },

    /**
     * Hide the promo banner
     */
    hideBanner() {
        const banner = document.getElementById(this.BANNER_ID);
        if (banner) {
            banner.remove();
            // Remember dismissal for 14 days
            localStorage.setItem('cscaseprofit-banner-dismissed', Date.now().toString());
        }
    },

    /**
     * Initialize the promo banner system
     * Sets up mutation observer to detect deposit page changes
     */
    init() {
        if (!this.siteHandler) {
            console.log('[PromoBanner] No site handler registered, skipping init');
            return;
        }

        console.log('[PromoBanner] Initializing');

        // Check immediately
        if (this.isDepositPage()) {
            this.showBanner();
        }

        // Set up observer for SPA navigation and modal changes
        const observer = new MutationObserver(() => {
            if (this.isDepositPage()) {
                // Hide banner if promo code got activated
                if (this.siteHandler.isPromoActive && this.siteHandler.isPromoActive()) {
                    const banner = document.getElementById(this.BANNER_ID);
                    if (banner) {
                        banner.remove();
                        console.log('[PromoBanner] Promo code activated, hiding banner');
                    }
                    return;
                }
                this.showBanner();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Also check on URL changes (for SPAs)
        let lastUrl = window.location.href;
        setInterval(() => {
            if (window.location.href !== lastUrl) {
                lastUrl = window.location.href;
                if (this.isDepositPage()) {
                    this.showBanner();
                }
            }
        }, 1000);
    }
};

// Make available globally
window.PromoBanner = PromoBanner;
