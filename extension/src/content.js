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
        window.DatDropAdapter,
        window.KeyDropAdapter,
        window.CSGOEmpireAdapter,
        window.CSGO500Adapter,
        window.ClashGGAdapter,
        window.CSGOSkinsAdapter,
        window.DaddySkinsAdapter,
        window.CSGOCasesAdapter
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
            return;
        }

        // Create adapter instance and probability box
        const adapter = new AdapterClass();
        const box = new ProbabilityBox(adapter);

        // Initialize probability box
        box.init();

        // Initialize promo banner if available
        if (window.PromoBanner) {
            window.PromoBanner.init();
        }
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
