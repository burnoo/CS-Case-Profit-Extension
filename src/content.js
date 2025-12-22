/**
 * CS Case Profit Extension - Content Script Entry Point
 * Detects the current site and initializes the appropriate adapter
 */

(function() {
    'use strict';

    // Registry of all site adapters
    const siteAdapters = [
        window.HellcaseAdapter,
        window.SkinClubAdapter,
        window.DatDropAdapter
    ].filter(Boolean);

    /**
     * Find the appropriate adapter for the current site
     * @returns {Object|null} - Adapter class or null
     */
    function findAdapter() {
        const currentUrl = window.location.href;
        for (const Adapter of siteAdapters) {
            if (Adapter.matches(currentUrl)) {
                return Adapter;
            }
        }
        return null;
    }

    /**
     * Initialize the extension
     */
    function init() {
        const AdapterClass = findAdapter();
        if (!AdapterClass) {
            console.log('[CSP] No adapter found for this site');
            return;
        }

        console.log(`[CSP] Using adapter: ${AdapterClass.getSiteId()}`);

        // Create adapter instance and probability box
        const adapter = new AdapterClass();
        const box = new ProbabilityBox(adapter);

        // Initialize
        box.init();
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
