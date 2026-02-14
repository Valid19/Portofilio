/**
 * Crypto API Integration
 * Uses Binance public API for OHLCV (kline) data.
 * No authentication required.
 */

class CryptoAPI {
  constructor() {
    this.baseUrl = 'https://api.binance.com';
    this.defaultSymbols = [
      'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
      'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'DOTUSDT', 'MATICUSDT',
      'LINKUSDT', 'ATOMUSDT', 'UNIUSDT', 'LTCUSDT', 'ETCUSDT',
      'NEARUSDT', 'APTUSDT', 'ARBUSDT', 'OPUSDT', 'FILUSDT',
    ];
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
   * Fetch 24h ticker data for a symbol (price info).
   * @param {string} symbol
   * @returns {Promise<Object>}
   */
  async getTicker(symbol) {
    const url = `${this.baseUrl}/api/v3/ticker/24hr?symbol=${symbol}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Fetch current price for a symbol.
   * @param {string} symbol
   * @returns {Promise<Object>}
   */
  async getPrice(symbol) {
    const url = `${this.baseUrl}/api/v3/ticker/price?symbol=${symbol}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Get the list of default symbols to scan.
   * @returns {string[]}
   */
  getDefaultSymbols() {
    return [...this.defaultSymbols];
  }

  /**
   * Format symbol for display (e.g. BTCUSDT -> BTC/USDT)
   * @param {string} symbol
   * @returns {string}
   */
  formatSymbol(symbol) {
    if (symbol.endsWith('USDT')) {
      return symbol.replace('USDT', '/USDT');
    }
    return symbol;
  }

  /**
   * Get base asset from symbol (e.g. BTCUSDT -> BTC)
   * @param {string} symbol
   * @returns {string}
   */
  getBaseAsset(symbol) {
    if (symbol.endsWith('USDT')) {
      return symbol.replace('USDT', '');
    }
    return symbol;
  }
}

window.CryptoAPI = CryptoAPI;
