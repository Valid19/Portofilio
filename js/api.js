/**
 * Crypto API Integration
 * Uses Binance public API for OHLCV (kline) data.
 * No authentication required.
 */

class CryptoAPI {
  constructor() {
    this.baseUrl = 'https://api.binance.com';
    this.allSymbols = [];
    this.symbolsLoaded = false;
  }

  /**
   * Fetch all available SPOT trading pairs from Binance exchange info.
   * Filters for TRADING status only.
   * @param {string} quoteAsset - Filter by quote asset (e.g. 'USDT', 'BTC', 'ETH', or 'ALL')
   * @returns {Promise<Array>} Array of { symbol, baseAsset, quoteAsset }
   */
  async fetchAllSymbols(quoteAsset = 'USDT') {
    if (this.allSymbols.length === 0) {
      const url = `${this.baseUrl}/api/v3/exchangeInfo`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();

      this.allSymbols = data.symbols
        .filter(s => s.status === 'TRADING' && s.isSpotTradingAllowed)
        .map(s => ({
          symbol: s.symbol,
          baseAsset: s.baseAsset,
          quoteAsset: s.quoteAsset,
        }));
      this.symbolsLoaded = true;
    }

    if (quoteAsset === 'ALL') {
      return [...this.allSymbols];
    }
    return this.allSymbols.filter(s => s.quoteAsset === quoteAsset);
  }

  /**
   * Search symbols by keyword.
   * @param {string} query - Search term (e.g. 'BTC', 'SOL', 'DOGE')
   * @param {string} quoteAsset - Quote asset filter
   * @returns {Promise<Array>}
   */
  async searchSymbols(query, quoteAsset = 'USDT') {
    const symbols = await this.fetchAllSymbols(quoteAsset);
    if (!query) return symbols;

    const q = query.toUpperCase();
    return symbols.filter(s =>
      s.baseAsset.includes(q) || s.symbol.includes(q)
    );
  }

  /**
   * Fetch kline (candlestick) data for a symbol.
   * @param {string} symbol - e.g. 'BTCUSDT'
   * @param {string} interval - e.g. '15m', '1h', '4h', '1d'
   * @param {number} limit - number of candles (max 1000)
   * @returns {Promise<Array>} Array of candle objects
   */
  async getKlines(symbol, interval = '15m', limit = 100) {
    const url = `${this.baseUrl}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return data.map(k => ({
      time: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
      closeTime: k[6],
      quoteVolume: parseFloat(k[7]),
      trades: k[8],
    }));
  }

  /**
   * Format symbol for display (e.g. BTCUSDT -> BTC/USDT)
   * @param {string} symbol
   * @param {string} quoteAsset
   * @returns {string}
   */
  formatSymbol(symbol, quoteAsset) {
    if (quoteAsset && symbol.endsWith(quoteAsset)) {
      return symbol.replace(quoteAsset, '/' + quoteAsset);
    }
    // Try common quote assets
    for (const q of ['USDT', 'BUSD', 'BTC', 'ETH', 'BNB']) {
      if (symbol.endsWith(q)) {
        return symbol.replace(q, '/' + q);
      }
    }
    return symbol;
  }

  /**
   * Get base asset from symbol (e.g. BTCUSDT -> BTC)
   * @param {string} symbol
   * @param {string} quoteAsset
   * @returns {string}
   */
  getBaseAsset(symbol, quoteAsset) {
    if (quoteAsset && symbol.endsWith(quoteAsset)) {
      return symbol.replace(quoteAsset, '');
    }
    for (const q of ['USDT', 'BUSD', 'BTC', 'ETH', 'BNB']) {
      if (symbol.endsWith(q)) {
        return symbol.replace(q, '');
      }
    }
    return symbol;
  }
}

window.CryptoAPI = CryptoAPI;
