/**
 * Currency Service - Currency formatting and symbol utilities
 */

const CurrencyService = {
    // Currency symbol map
    symbols: {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'PLN': 'zł', 'BRL': 'R$',
        'RUB': '₽', 'CNY': '¥', 'JPY': '¥', 'KRW': '₩', 'TRY': '₺',
        'INR': '₹', 'RON': 'lei', 'CZK': 'Kč', 'SEK': 'kr', 'NOK': 'kr',
        'DKK': 'kr', 'CHF': 'Fr', 'AUD': 'A$', 'CAD': 'C$', 'MXN': '$',
        'HUF': 'Ft', 'PHP': '₱', 'THB': '฿', 'IDR': 'Rp', 'MYR': 'RM',
        'ARS': 'ARS', 'CLP': 'CLP', 'COP': 'COP', 'PEN': 'S/', 'UAH': '₴'
    },

    // Default currency
    defaultCurrency: { name: 'USD', rate: 1, symbol: '$' },

    /**
     * Get currency symbol for a currency code
     * @param {string} currencyName - Currency code (e.g., 'USD', 'EUR')
     * @returns {string} - Currency symbol
     */
    getSymbol(currencyName) {
        return this.symbols[currencyName] || currencyName;
    },

    /**
     * Create a currency object from name and rate
     * @param {string} name - Currency code
     * @param {number} rate - Exchange rate from USD
     * @returns {{name: string, rate: number, symbol: string}}
     */
    create(name, rate) {
        return {
            name: name || 'USD',
            rate: rate || 1,
            symbol: this.getSymbol(name || 'USD')
        };
    },

    /**
     * Format a USD price in the given currency
     * @param {number} usdPrice - Price in USD
     * @param {{name: string, rate: number, symbol: string}} currency - Currency object
     * @param {boolean} showSymbol - Whether to show currency symbol
     * @returns {string} - Formatted price
     */
    formatPrice(usdPrice, currency, showSymbol = true) {
        const converted = usdPrice * (currency?.rate || 1);
        if (showSymbol) {
            return `${currency?.symbol || '$'}${converted.toFixed(2)}`;
        }
        return converted.toFixed(2);
    },

    /**
     * Format a USD profit/loss in the given currency
     * @param {number} usdProfit - Profit in USD (can be negative)
     * @param {{name: string, rate: number, symbol: string}} currency - Currency object
     * @param {boolean} showSymbol - Whether to show currency symbol
     * @returns {string} - Formatted profit with +/- prefix
     */
    formatProfit(usdProfit, currency, showSymbol = true) {
        const converted = usdProfit * (currency?.rate || 1);
        const prefix = converted >= 0 ? '+' : '-';
        const absValue = Math.abs(converted).toFixed(2);
        if (showSymbol) {
            return `${prefix}${currency?.symbol || '$'}${absValue}`;
        }
        return `${prefix}${absValue}`;
    }
};

// Make available globally for content scripts
window.CurrencyService = CurrencyService;
