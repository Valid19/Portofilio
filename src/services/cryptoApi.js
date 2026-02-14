const BASE_URL = 'https://api.coingecko.com/api/v3';

// Throttle requests to avoid rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1500;

async function throttledFetch(url) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise((r) => setTimeout(r, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();

  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limited. Please wait a moment and try again.');
    }
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch top cryptocurrencies by market cap.
 */
export async function fetchTopCryptos(page = 1, perPage = 50) {
  const url = `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false`;
  return throttledFetch(url);
}

/**
 * Fetch OHLC (Open/High/Low/Close) data for a coin.
 * Days: 1, 7, 14, 30, 90, 180, 365
 * This gives us candlestick data we can use for block volume analysis.
 */
export async function fetchOHLC(coinId, days = 7) {
  const url = `${BASE_URL}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
  return throttledFetch(url);
}

/**
 * Fetch market chart data including volume.
 * Returns prices, market_caps, total_volumes arrays.
 */
export async function fetchMarketChart(coinId, days = 7) {
  const url = `${BASE_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
  return throttledFetch(url);
}

/**
 * Search for cryptocurrencies by query.
 */
export async function searchCryptos(query) {
  const url = `${BASE_URL}/search?query=${encodeURIComponent(query)}`;
  const data = await throttledFetch(url);
  return data.coins || [];
}
