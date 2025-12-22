/**
 * ProbabilityBox - Main UI Component
 * Site-agnostic probability info box that works with any site adapter
 */

class ProbabilityBox {
    /**
     * Create a new ProbabilityBox
     * @param {Object} adapter - Site adapter instance
     */
    constructor(adapter) {
        this.adapter = adapter;
        this.box = null;
        this.caseData = null;
        this.userCurrency = CurrencyService.defaultCurrency;
        this.isExpanded = false;
        this.items = []; // Processed items with real prices
    }

    /**
     * Initialize the probability box
     */
    async init() {
        this.observePageChanges();
        await this.tryInsertBox();
    }

    /**
     * Observe page changes for SPA navigation
     */
    observePageChanges() {
        let lastPath = window.location.pathname;
        const observer = new MutationObserver(() => {
            if (window.location.pathname !== lastPath) {
                lastPath = window.location.pathname;
                this.removeBox();
                this.tryInsertBox();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Remove existing box
     */
    removeBox() {
        const oldBox = document.getElementById('csp-probability-box');
        if (oldBox) oldBox.remove();
        this.box = null;
    }

    /**
     * Try to insert the box on the page
     */
    async tryInsertBox() {
        if (!this.adapter.isCasePage()) return;

        const checkInterval = setInterval(async () => {
            const insertionPoint = await this.adapter.getInsertionPoint();
            if (insertionPoint) {
                clearInterval(checkInterval);
                this.insertBox(insertionPoint);
                this.loadData();
            }
        }, 500);

        // Timeout after 15 seconds
        setTimeout(() => clearInterval(checkInterval), 15000);
    }

    /**
     * Insert the box into the DOM
     * @param {Element} referenceElement - Element to insert after
     */
    insertBox(referenceElement) {
        if (document.getElementById('csp-probability-box')) return;

        this.box = document.createElement('div');
        this.box.id = 'csp-probability-box';
        this.box.innerHTML = Templates.mainBox();

        referenceElement.insertAdjacentElement('afterend', this.box);

        // Attach event listeners
        document.getElementById('csp-toggle').addEventListener('click', () => this.toggleItems());
        document.getElementById('csp-test-btn').addEventListener('click', () => this.simulateOpening());
        document.getElementById('csp-test-result-close').addEventListener('click', () => this.hideTestResult());
    }

    /**
     * Toggle items list visibility
     */
    toggleItems() {
        const container = document.getElementById('csp-items-container');
        const arrow = document.querySelector('.csp-toggle-arrow');
        const text = document.querySelector('.csp-toggle-text');

        this.isExpanded = !this.isExpanded;

        if (this.isExpanded) {
            container.classList.add('expanded');
            arrow.classList.add('expanded');
            text.textContent = 'Hide Items';
        } else {
            container.classList.remove('expanded');
            arrow.classList.remove('expanded');
            text.textContent = 'Show Items';
        }
    }

    /**
     * Load all data (case data, prices, currency)
     */
    async loadData() {
        const container = document.getElementById('csp-items-container');
        container.innerHTML = Templates.loading('Loading data from API...');

        try {
            // Fetch all data in parallel
            const [caseData, prices, currency] = await Promise.all([
                this.adapter.fetchCaseData(),
                PricingService.fetchPrices(),
                this.adapter.fetchUserCurrency()
            ]);

            if (!caseData) {
                container.innerHTML = Templates.error('Error loading case data');
                return;
            }

            this.caseData = caseData;
            this.userCurrency = currency || CurrencyService.defaultCurrency;

            // Process items with real prices
            this.processItems();

            // Render the data
            this.render();
        } catch (error) {
            console.error('[CSP] Error loading data:', error);
            container.innerHTML = Templates.error('Error loading data. Try refreshing.');
        }
    }

    /**
     * Process items and add real prices
     */
    processItems() {
        this.items = this.caseData.items.map(item => {
            const realPrice = PricingService.getRealPrice(
                item.weaponName,
                item.skinName,
                item.wearFull,
                item.isStattrak,
                item.marketHashName
            );
            return { ...item, realPrice };
        });
    }

    /**
     * Render all data
     */
    render() {
        if (!this.caseData || !this.items.length) {
            document.getElementById('csp-items-container').innerHTML = Templates.error('No item data found');
            return;
        }

        const casePrice = this.caseData.casePrice || 0;

        // Calculate stats
        const stats = this.calculateStats(casePrice);

        // Update stat cards
        this.renderStats(stats, casePrice);

        // Render items table
        this.renderTable(casePrice);
    }

    /**
     * Calculate statistics from items
     * @param {number} casePrice - Case price
     * @returns {Object} - Statistics object
     */
    calculateStats(casePrice) {
        const items = this.items;

        // Site prices
        const expectedValue = items.reduce((sum, v) => sum + (v.price * v.odds / 100), 0);
        const profitability = casePrice > 0 ? (expectedValue / casePrice * 100) : 0;
        const profitChance = items.filter(v => v.price > casePrice).reduce((sum, v) => sum + v.odds, 0);
        const maxPrice = Math.max(...items.map(v => v.price));
        const minPrice = Math.min(...items.map(v => v.price));
        const maxProfit = casePrice > 0 ? maxPrice - casePrice : maxPrice;
        const maxLoss = casePrice > 0 ? casePrice - minPrice : minPrice;

        // Real prices
        const hasRealPrices = items.some(v => v.realPrice !== null);
        let realStats = {};

        if (hasRealPrices) {
            const realExpectedValue = items.reduce((sum, v) => {
                const price = v.realPrice !== null ? v.realPrice : v.price;
                return sum + (price * v.odds / 100);
            }, 0);
            const realProfitability = casePrice > 0 ? (realExpectedValue / casePrice * 100) : 0;
            const realProfitChance = items
                .filter(v => (v.realPrice !== null ? v.realPrice : v.price) > casePrice)
                .reduce((sum, v) => sum + v.odds, 0);
            const realPrices = items.map(v => v.realPrice !== null ? v.realPrice : v.price);
            const realMaxPrice = Math.max(...realPrices);
            const realMinPrice = Math.min(...realPrices);

            realStats = {
                expectedValue: realExpectedValue,
                profitability: realProfitability,
                profitChance: realProfitChance,
                maxProfit: casePrice > 0 ? realMaxPrice - casePrice : realMaxPrice,
                maxLoss: casePrice > 0 ? casePrice - realMinPrice : realMinPrice
            };
        }

        return {
            expectedValue,
            profitability,
            profitChance,
            maxProfit,
            maxLoss,
            hasRealPrices,
            real: realStats
        };
    }

    /**
     * Render stat cards
     * @param {Object} stats - Statistics object
     * @param {number} casePrice - Case price
     */
    renderStats(stats, casePrice) {
        const { profitability, expectedValue, profitChance, maxProfit, maxLoss, hasRealPrices, real } = stats;

        // Profitability
        const profitEl = document.getElementById('csp-profitability');
        let profitColorClass = '';
        if (profitability < 86) profitColorClass = 'negative';
        else if (profitability <= 90) profitColorClass = 'white';
        profitEl.className = 'csp-stat-value ' + profitColorClass;
        profitEl.innerHTML = casePrice > 0 ? `${profitability.toFixed(1)}%` : 'N/A';
        this.addRealSub(profitEl, hasRealPrices && casePrice > 0, `${real.profitability?.toFixed(1)}%`);

        // Expected Value
        const evEl = document.getElementById('csp-expected-value');
        evEl.textContent = CurrencyService.formatPrice(expectedValue, this.userCurrency);
        this.addRealSub(evEl, hasRealPrices, CurrencyService.formatPrice(real.expectedValue, this.userCurrency));

        // Profit Chance
        const pcEl = document.getElementById('csp-profit-chance');
        pcEl.textContent = `${profitChance.toFixed(2)}%`;
        this.addRealSub(pcEl, hasRealPrices, `${real.profitChance?.toFixed(2)}%`);

        // Max Profit
        const mpEl = document.getElementById('csp-max-profit');
        mpEl.textContent = CurrencyService.formatProfit(maxProfit, this.userCurrency);
        this.addRealSub(mpEl, hasRealPrices && casePrice > 0, CurrencyService.formatProfit(real.maxProfit, this.userCurrency));

        // Max Loss
        const mlEl = document.getElementById('csp-max-loss');
        mlEl.textContent = CurrencyService.formatProfit(-maxLoss, this.userCurrency);
        this.addRealSub(mlEl, hasRealPrices && casePrice > 0, CurrencyService.formatProfit(-real.maxLoss, this.userCurrency));
    }

    /**
     * Add real price sub-value to a stat element
     * @param {Element} el - Parent element
     * @param {boolean} show - Whether to show
     * @param {string} value - Value to display
     */
    addRealSub(el, show, value) {
        const card = el.parentElement;
        const existing = card.querySelector('.csp-real-price-sub');
        if (existing) existing.remove();
        if (show && value) {
            el.insertAdjacentHTML('afterend', Templates.tooltipSub(value));
        }
    }

    /**
     * Render items table
     * @param {number} casePrice - Case price
     */
    renderTable(casePrice) {
        // Sort by price descending
        const sortedItems = [...this.items].sort((a, b) => b.price - a.price);

        let tableHTML = Templates.tableHeader();

        sortedItems.forEach((item, idx) => {
            const profit = item.price - casePrice;
            const profitClass = profit >= 0 ? 'csp-profit' : 'csp-loss';
            const rowClass = profit >= 0 ? 'csp-profit-row' : 'csp-loss-row';

            const realPriceDisplay = item.realPrice !== null
                ? CurrencyService.formatPrice(item.realPrice, this.userCurrency)
                : '-';

            let realProfitDisplay = '-';
            let realProfitClass = '';
            if (item.realPrice !== null && casePrice > 0) {
                const realProfit = item.realPrice - casePrice;
                realProfitClass = realProfit >= 0 ? 'csp-profit' : 'csp-loss';
                realProfitDisplay = CurrencyService.formatProfit(realProfit, this.userCurrency);
            }

            tableHTML += Templates.tableRow({
                index: idx + 1,
                itemName: Templates.itemName(item),
                price: CurrencyService.formatPrice(item.price, this.userCurrency),
                realPrice: realPriceDisplay,
                profit: casePrice > 0 ? CurrencyService.formatProfit(profit, this.userCurrency) : '-',
                realProfit: realProfitDisplay,
                odds: `${item.odds.toFixed(3)}%`,
                profitClass,
                realProfitClass,
                rowClass
            });
        });

        tableHTML += Templates.tableFooter();
        document.getElementById('csp-items-container').innerHTML = tableHTML;
    }

    /**
     * Simulate case opening with weighted random
     */
    simulateOpening() {
        if (!this.items || this.items.length === 0) return;

        const selectedItem = Helpers.weightedRandom(this.items);
        if (!selectedItem) return;

        const casePrice = this.caseData.casePrice || 0;
        const profit = selectedItem.price - casePrice;
        const multiplier = casePrice > 0 ? selectedItem.price / casePrice : 0;

        // Build item name
        const stPrefix = selectedItem.isStattrak ? 'StatTrak™ ' : '';
        const wearPart = selectedItem.wearFull ? ` (${selectedItem.wearFull})` : '';
        const itemName = `${stPrefix}${selectedItem.weaponName} | ${selectedItem.skinName}${wearPart}`;

        // Update UI
        const resultContainer = document.getElementById('csp-test-result');
        const imageEl = document.getElementById('csp-test-result-image');
        const nameEl = document.getElementById('csp-test-result-name');
        const priceEl = document.getElementById('csp-test-result-price');
        const profitEl = document.getElementById('csp-test-result-profit');
        const multiplierEl = document.getElementById('csp-test-result-multiplier');
        const statsEl = document.getElementById('csp-test-result-stats');

        resultContainer.classList.add('visible');

        // Animate image, name and stats
        imageEl.classList.remove('csp-animate');
        nameEl.classList.remove('csp-animate');
        statsEl.classList.remove('csp-animate');
        void imageEl.offsetWidth; // Force reflow
        imageEl.classList.add('csp-animate');
        nameEl.classList.add('csp-animate');
        statsEl.classList.add('csp-animate');
        imageEl.src = selectedItem.image;
        nameEl.textContent = itemName;
        priceEl.textContent = CurrencyService.formatPrice(selectedItem.price, this.userCurrency);
        priceEl.className = 'csp-test-result-stat-value';

        profitEl.textContent = CurrencyService.formatProfit(profit, this.userCurrency);
        profitEl.className = `csp-test-result-stat-value ${profit >= 0 ? 'csp-profit' : 'csp-loss'}`;

        multiplierEl.textContent = `x${multiplier.toFixed(2)}`;
        multiplierEl.className = `csp-test-result-multiplier ${profit >= 0 ? 'csp-profit' : 'csp-loss'}`;
    }

    /**
     * Hide test result
     */
    hideTestResult() {
        const resultContainer = document.getElementById('csp-test-result');
        resultContainer.classList.remove('visible');
    }
}

// Make available globally for content scripts
window.ProbabilityBox = ProbabilityBox;
