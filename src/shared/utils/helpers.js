/**
 * Utility Helper Functions
 */

const Helpers = {
    /**
     * Escape HTML special characters
     * @param {string} text - Text to escape
     * @returns {string} - Escaped HTML string
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    },

    /**
     * Generate a unique ID
     * @param {string} prefix - Optional prefix
     * @returns {string} - Unique ID
     */
    generateId(prefix = 'csp') {
        return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Debounce a function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} - Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Wait for an element to appear in DOM
     * @param {string} selector - CSS selector
     * @param {number} timeout - Timeout in ms
     * @returns {Promise<Element|null>}
     */
    waitForElement(selector, timeout = 10000) {
        return new Promise((resolve) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver(() => {
                const el = document.querySelector(selector);
                if (el) {
                    observer.disconnect();
                    resolve(el);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                resolve(null);
            }, timeout);
        });
    },

    /**
     * Weighted random selection from array
     * @param {Array<{odds: number}>} items - Items with odds property
     * @returns {*} - Selected item
     */
    weightedRandom(items) {
        if (!items || items.length === 0) return null;

        const totalOdds = items.reduce((sum, item) => sum + (item.odds || 0), 0);
        let random = Math.random() * totalOdds;

        for (const item of items) {
            random -= item.odds || 0;
            if (random <= 0) {
                return item;
            }
        }
        return items[0];
    }
};

// Make available globally for content scripts
window.Helpers = Helpers;
