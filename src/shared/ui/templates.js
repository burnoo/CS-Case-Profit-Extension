/**
 * HTML Templates for the Probability Box UI
 */

const Templates = {
    /**
     * Main probability box HTML
     * @returns {string}
     */
    mainBox() {
        return `
            <div class="csp-header">
                <div class="csp-title">CS Case Profit Extension</div>
            </div>
            <div class="csp-stats" id="csp-stats">
                <div class="csp-stat-card">
                    <div class="csp-stat-label">Profitability</div>
                    <div class="csp-stat-value" id="csp-profitability">-</div>
                </div>
                <div class="csp-stat-card">
                    <div class="csp-stat-label">Expected Value</div>
                    <div class="csp-stat-value white" id="csp-expected-value">-</div>
                </div>
                <div class="csp-stat-card">
                    <div class="csp-stat-label">Profit Chance</div>
                    <div class="csp-stat-value white" id="csp-profit-chance">-</div>
                </div>
                <div class="csp-stat-card">
                    <div class="csp-stat-label">Max Profit</div>
                    <div class="csp-stat-value" id="csp-max-profit">-</div>
                </div>
                <div class="csp-stat-card">
                    <div class="csp-stat-label">Max Loss</div>
                    <div class="csp-stat-value negative" id="csp-max-loss">-</div>
                </div>
            </div>
            <button class="csp-toggle-btn" id="csp-toggle">
                <span class="csp-toggle-arrow">▼</span>
                <span class="csp-toggle-text">Show Items</span>
            </button>
            <div class="csp-items-container" id="csp-items-container">
                <div class="csp-loading">Loading data...</div>
            </div>
            <div class="csp-test-section">
                <button class="csp-test-btn" id="csp-test-btn">Test Case Opening</button>
                <div class="csp-test-result" id="csp-test-result">
                    <button class="csp-test-result-close" id="csp-test-result-close">✕</button>
                    <img class="csp-test-result-image" id="csp-test-result-image" src="" alt="Item">
                    <div class="csp-test-result-name" id="csp-test-result-name"></div>
                    <div class="csp-test-result-stats" id="csp-test-result-stats">
                        <div class="csp-test-result-stat">
                            <div class="csp-test-result-stat-value" id="csp-test-result-price"></div>
                            <div class="csp-test-result-stat-label">Item Value</div>
                        </div>
                        <div class="csp-test-result-stat">
                            <div class="csp-test-result-stat-value" id="csp-test-result-profit"></div>
                            <div class="csp-test-result-stat-label">Profit</div>
                        </div>
                        <div class="csp-test-result-stat">
                            <div class="csp-test-result-multiplier" id="csp-test-result-multiplier"></div>
                            <div class="csp-test-result-stat-label">Multiplier</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Items table header
     * @returns {string}
     */
    tableHeader() {
        return `
            <table class="csp-items-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Item</th>
                        <th>Price</th>
                        <th class="csp-tooltip" data-tooltip="CSGOTrader pricing">Real Price</th>
                        <th>Profit</th>
                        <th class="csp-tooltip" data-tooltip="Based on CSGOTrader prices">Real Profit</th>
                        <th>Chance</th>
                    </tr>
                </thead>
                <tbody>
        `;
    },

    /**
     * Items table row
     * @param {Object} params - Row parameters
     * @returns {string}
     */
    tableRow({ index, itemName, price, realPrice, profit, realProfit, odds, profitClass, realProfitClass, rowClass }) {
        return `
            <tr class="${rowClass}">
                <td>${index}</td>
                <td class="csp-item-name">${itemName}</td>
                <td>${price}</td>
                <td>${realPrice}</td>
                <td class="${profitClass}">${profit}</td>
                <td class="${realProfitClass}">${realProfit}</td>
                <td>${odds}</td>
            </tr>
        `;
    },

    /**
     * Items table footer
     * @returns {string}
     */
    tableFooter() {
        return `
                </tbody>
            </table>
        `;
    },

    /**
     * Build item name HTML with StatTrak, wear, and phase styling
     * @param {Object} item - Item data
     * @returns {string}
     */
    itemName(item) {
        const stPrefix = item.isStattrak ? '<span class="csp-stattrak">StatTrak™</span> ' : '';
        const wearClass = item.wear ? `csp-wear-${item.wear.toLowerCase()}` : '';
        const wearPart = item.wearFull ? ` <span class="${wearClass}">(${item.wearFull})</span>` : '';
        const phasePart = item.phase ? ` <span class="csp-phase">${Helpers.escapeHtml(item.phase)}</span>` : '';
        // Handle vanilla items (no skin name)
        const namePart = item.skinName
            ? `${Helpers.escapeHtml(item.weaponName)} | ${Helpers.escapeHtml(item.skinName)}`
            : Helpers.escapeHtml(item.weaponName);
        return `${stPrefix}${namePart}${wearPart}${phasePart}`;
    },

    /**
     * Tooltip sub-value HTML
     * @param {string} value - Value to display
     * @param {string} tooltip - Tooltip text
     * @returns {string}
     */
    tooltipSub(value, tooltip = 'Real price calculation based on CSGOTrader data') {
        return `<div class="csp-real-price-sub">(<span class="csp-tooltip" data-tooltip="${tooltip}">${value}</span>)</div>`;
    },

    /**
     * Loading message
     * @param {string} message - Message to display
     * @returns {string}
     */
    loading(message = 'Loading data...') {
        return `<div class="csp-loading">${message}</div>`;
    },

    /**
     * Error message
     * @param {string} message - Error message
     * @returns {string}
     */
    error(message = 'Error loading data') {
        return `<div class="csp-error">${message}</div>`;
    }
};

// Make available globally for content scripts
window.Templates = Templates;
