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
     * Helper to create an element with attributes and children
     * @param {string} tag - Tag name
     * @param {Object} attrs - Attributes object
     * @param {Array|string|Node} children - Child elements or text
     * @returns {HTMLElement}
     */
    createElement(tag, attrs = {}, children = []) {
        const el = document.createElement(tag);

        for (const [key, value] of Object.entries(attrs)) {
            if (key === 'className') {
                el.className = value;
            } else if (key.startsWith('on') && typeof value === 'function') {
                el.addEventListener(key.slice(2).toLowerCase(), value);
            } else {
                el.setAttribute(key, value);
            }
        }

        if (!Array.isArray(children)) {
            children = [children];
        }

        for (const child of children) {
            if (typeof child === 'string') {
                el.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                el.appendChild(child);
            }
        }

        return el;
    },

    /**
     * Create SVG element with paths
     * @param {Object} attrs - SVG attributes
     * @param {Array} paths - Path data strings
     * @returns {SVGElement}
     */
    createSvg(attrs, paths) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        for (const [key, value] of Object.entries(attrs)) {
            svg.setAttribute(key, value);
        }
        for (const pathData of paths) {
            const path = document.createElementNS('http://www.w3.org/2000/svg', pathData.tag || 'path');
            for (const [key, value] of Object.entries(pathData)) {
                if (key !== 'tag') {
                    path.setAttribute(key, value);
                }
            }
            svg.appendChild(path);
        }
        return svg;
    },

    /**
     * Create the promo banner HTML element
     * @returns {HTMLElement}
     */
    createBanner() {
        const c = this.createElement.bind(this);

        const banner = document.createElement('div');
        banner.id = this.BANNER_ID;

        const content = c('div', { className: 'cscaseprofit-promo-content' });

        // Icon
        const iconDiv = c('div', { className: 'cscaseprofit-promo-icon' });
        iconDiv.appendChild(this.createSvg(
            { xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
            [
                { d: 'M12 2L2 7l10 5 10-5-10-5z' },
                { d: 'M2 17l10 5 10-5' },
                { d: 'M2 12l10 5 10-5' }
            ]
        ));
        content.appendChild(iconDiv);

        // Text
        const textDiv = c('div', { className: 'cscaseprofit-promo-text' }, [
            c('span', { className: 'cscaseprofit-promo-message' }, [
                'Do you enjoy ',
                c('span', { className: 'cscaseprofit-promo-name' }, 'CS Case Profit Extension'),
                '? Support us by using our affiliate code.'
            ]),
            c('span', { className: 'cscaseprofit-promo-thanks' }, [
                c('span', { className: 'cscaseprofit-emoji' }, '\uD83E\uDD7A'),
                ' Thanks! ',
                c('span', { className: 'cscaseprofit-emoji' }, '\uD83E\uDD7A')
            ])
        ]);
        content.appendChild(textDiv);

        // Code
        content.appendChild(
            c('div', { className: 'cscaseprofit-promo-code' }, [
                c('span', { className: 'cscaseprofit-code-label' }, 'Code:'),
                c('span', { className: 'cscaseprofit-code-value' }, this.AFFILIATE_CODE)
            ])
        );

        // Apply button
        const applyBtn = c('button', { className: 'cscaseprofit-promo-apply-btn', type: 'button' }, 'Apply Code');
        applyBtn.addEventListener('click', () => this.applyCode());
        content.appendChild(applyBtn);

        // Close button
        const closeBtn = c('button', { className: 'cscaseprofit-promo-close', type: 'button', 'aria-label': 'Close' });
        closeBtn.appendChild(this.createSvg(
            { xmlns: 'http://www.w3.org/2000/svg', width: '16', height: '16', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
            [
                { tag: 'line', x1: '18', y1: '6', x2: '6', y2: '18' },
                { tag: 'line', x1: '6', y1: '6', x2: '18', y2: '18' }
            ]
        ));
        closeBtn.addEventListener('click', () => this.hideBanner());
        content.appendChild(closeBtn);

        banner.appendChild(content);
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
            // Check if site handler has custom applyCode method
            if (this.siteHandler.applyCode) {
                const result = await this.siteHandler.applyCode(this.AFFILIATE_CODE);
                if (result.success) {
                    this.showFeedback(result.message, 'success');
                } else {
                    this.showFeedback(result.message, 'error');
                }
                return;
            }

            // Default implementation
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
            return;
        }

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
