/**
 * HTML Templates for the Probability Box UI
 * Uses DOM creation methods instead of innerHTML for security
 */

const Templates = {
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
            } else if (key === 'dataset') {
                for (const [dataKey, dataValue] of Object.entries(value)) {
                    el.dataset[dataKey] = dataValue;
                }
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
     * Main probability box DOM element
     * @returns {DocumentFragment}
     */
    mainBox() {
        const fragment = document.createDocumentFragment();
        const c = this.createElement.bind(this);

        // Header
        fragment.appendChild(
            c('div', { className: 'csp-header' }, [
                c('div', { className: 'csp-title' }, 'CS Case Profit Extension')
            ])
        );

        // Stats
        const stats = c('div', { className: 'csp-stats', id: 'csp-stats' });
        const statConfigs = [
            { label: 'Profitability', id: 'csp-profitability', className: 'csp-stat-value' },
            { label: 'Expected Value', id: 'csp-expected-value', className: 'csp-stat-value white' },
            { label: 'Profit Chance', id: 'csp-profit-chance', className: 'csp-stat-value white' },
            { label: 'Max Profit', id: 'csp-max-profit', className: 'csp-stat-value' },
            { label: 'Max Loss', id: 'csp-max-loss', className: 'csp-stat-value negative' }
        ];

        for (const stat of statConfigs) {
            stats.appendChild(
                c('div', { className: 'csp-stat-card' }, [
                    c('div', { className: 'csp-stat-label' }, stat.label),
                    c('div', { className: stat.className, id: stat.id }, '-')
                ])
            );
        }
        fragment.appendChild(stats);

        // Toggle button
        fragment.appendChild(
            c('button', { className: 'csp-toggle-btn', id: 'csp-toggle' }, [
                c('span', { className: 'csp-toggle-arrow' }, '\u25BC'),
                c('span', { className: 'csp-toggle-text' }, 'Show Items')
            ])
        );

        // Items container
        fragment.appendChild(
            c('div', { className: 'csp-items-container', id: 'csp-items-container' }, [
                c('div', { className: 'csp-loading' }, 'Loading data...')
            ])
        );

        // Test section
        const testSection = c('div', { className: 'csp-test-section' });
        testSection.appendChild(c('button', { className: 'csp-test-btn', id: 'csp-test-btn' }, 'Test Case Opening'));

        const testResult = c('div', { className: 'csp-test-result', id: 'csp-test-result' });
        testResult.appendChild(c('button', { className: 'csp-test-result-close', id: 'csp-test-result-close' }, '\u2715'));
        testResult.appendChild(c('img', { className: 'csp-test-result-image', id: 'csp-test-result-image', src: '', alt: 'Item' }));
        testResult.appendChild(c('div', { className: 'csp-test-result-name', id: 'csp-test-result-name' }));

        const testStats = c('div', { className: 'csp-test-result-stats', id: 'csp-test-result-stats' });
        const testStatConfigs = [
            { valueId: 'csp-test-result-price', label: 'Item Value', valueClass: 'csp-test-result-stat-value' },
            { valueId: 'csp-test-result-profit', label: 'Profit', valueClass: 'csp-test-result-stat-value' },
            { valueId: 'csp-test-result-multiplier', label: 'Multiplier', valueClass: 'csp-test-result-multiplier' }
        ];

        for (const stat of testStatConfigs) {
            testStats.appendChild(
                c('div', { className: 'csp-test-result-stat' }, [
                    c('div', { className: stat.valueClass, id: stat.valueId }),
                    c('div', { className: 'csp-test-result-stat-label' }, stat.label)
                ])
            );
        }
        testResult.appendChild(testStats);
        testSection.appendChild(testResult);
        fragment.appendChild(testSection);

        return fragment;
    },

    /**
     * Build items table
     * @param {Array} items - Sorted items array
     * @param {number} casePrice - Case price
     * @param {boolean} hasValidOdds - Whether case has valid odds
     * @param {string} userCurrency - User currency
     * @returns {HTMLElement}
     */
    itemsTable(items, casePrice, hasValidOdds, userCurrency) {
        const c = this.createElement.bind(this);

        const table = c('table', { className: 'csp-items-table' });

        // Header
        const thead = c('thead');
        const headerRow = c('tr');
        const headers = ['#', 'Item', 'Price',
            { text: 'Real Price', tooltip: 'CSGOTrader pricing' },
            'Profit',
            { text: 'Real Profit', tooltip: 'Based on CSGOTrader prices' },
            'Chance'
        ];

        for (const header of headers) {
            if (typeof header === 'string') {
                headerRow.appendChild(c('th', {}, header));
            } else {
                headerRow.appendChild(c('th', { className: 'csp-tooltip', dataset: { tooltip: header.tooltip } }, header.text));
            }
        }
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Body
        const tbody = c('tbody');
        items.forEach((item, idx) => {
            const profit = item.price - casePrice;
            const profitClass = profit >= 0 ? 'csp-profit' : 'csp-loss';
            const rowClass = profit >= 0 ? 'csp-profit-row' : 'csp-loss-row';

            const realPriceDisplay = item.realPrice !== null
                ? CurrencyService.formatPrice(item.realPrice, userCurrency)
                : '-';

            let realProfitDisplay = '-';
            let realProfitClass = '';
            if (item.realPrice !== null && casePrice > 0) {
                const realProfit = item.realPrice - casePrice;
                realProfitClass = realProfit >= 0 ? 'csp-profit' : 'csp-loss';
                realProfitDisplay = CurrencyService.formatProfit(realProfit, userCurrency);
            }

            const oddsDisplay = hasValidOdds ? `${item.odds.toFixed(3)}%` : '?';

            const row = c('tr', { className: rowClass });
            row.appendChild(c('td', {}, String(idx + 1)));
            row.appendChild(this.itemNameCell(item));
            row.appendChild(c('td', {}, CurrencyService.formatPrice(item.price, userCurrency)));
            row.appendChild(c('td', {}, realPriceDisplay));
            row.appendChild(c('td', { className: profitClass }, casePrice > 0 ? CurrencyService.formatProfit(profit, userCurrency) : '-'));
            row.appendChild(c('td', { className: realProfitClass }, realProfitDisplay));
            row.appendChild(c('td', {}, oddsDisplay));
            tbody.appendChild(row);
        });
        table.appendChild(tbody);

        return table;
    },

    /**
     * Build item name table cell with StatTrak, wear, and phase styling
     * @param {Object} item - Item data
     * @returns {HTMLElement}
     */
    itemNameCell(item) {
        const c = this.createElement.bind(this);
        const td = c('td', { className: 'csp-item-name' });

        if (item.isStattrak) {
            td.appendChild(c('span', { className: 'csp-stattrak' }, 'StatTrak\u2122'));
            td.appendChild(document.createTextNode(' '));
        }

        // Handle vanilla items (no skin name)
        const namePart = item.skinName
            ? `${item.weaponName} | ${item.skinName}`
            : item.weaponName;
        td.appendChild(document.createTextNode(namePart));

        if (item.wearFull) {
            td.appendChild(document.createTextNode(' '));
            const wearClass = item.wear ? `csp-wear-${item.wear.toLowerCase()}` : '';
            td.appendChild(c('span', { className: wearClass }, `(${item.wearFull})`));
        }

        if (item.phase) {
            td.appendChild(document.createTextNode(' '));
            td.appendChild(c('span', { className: 'csp-phase' }, item.phase));
        }

        return td;
    },

    /**
     * Tooltip sub-value element
     * @param {string} value - Value to display
     * @param {string} tooltip - Tooltip text
     * @returns {HTMLElement}
     */
    tooltipSub(value, tooltip = 'Real price calculation based on CSGOTrader data') {
        const c = this.createElement.bind(this);
        return c('div', { className: 'csp-real-price-sub' }, [
            '(',
            c('span', { className: 'csp-tooltip', dataset: { tooltip: tooltip } }, value),
            ')'
        ]);
    },

    /**
     * Loading message element
     * @param {string} message - Message to display
     * @returns {HTMLElement}
     */
    loading(message = 'Loading data...') {
        return this.createElement('div', { className: 'csp-loading' }, message);
    },

    /**
     * Error message element
     * @param {string} message - Error message
     * @returns {HTMLElement}
     */
    error(message = 'Error loading data') {
        return this.createElement('div', { className: 'csp-error' }, message);
    }
};

// Make available globally for content scripts
window.Templates = Templates;
