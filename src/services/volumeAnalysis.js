/**
 * 3-Block Volume Analysis Engine
 *
 * Analyzes consecutive candlestick periods ("blocks") to detect volume patterns.
 *
 * A "block" is a single candlestick period with open, high, low, close, and volume data.
 *
 * GREEN 3-Block Volume Phase:
 *   3 consecutive blocks where close > open (green/bullish candles)
 *   with each block showing meaningful volume activity.
 *   This signals sustained buying pressure.
 *
 * RED 3-Block Volume Phase:
 *   3 consecutive blocks where close < open (red/bearish candles)
 *   with each block showing meaningful volume activity.
 *   This signals sustained selling pressure.
 *
 * When either phase is detected, the crypto qualifies for the watchlist.
 */

/**
 * Combines OHLC data with volume data into unified block objects.
 * OHLC format from CoinGecko: [timestamp, open, high, low, close]
 * Volume format: [timestamp, volume]
 */
export function buildBlocks(ohlcData, volumeData) {
  if (!ohlcData || !volumeData || ohlcData.length === 0) return [];

  const blocks = ohlcData.map(([timestamp, open, high, low, close]) => {
    // Find closest volume data point
    const closestVolume = findClosestVolume(timestamp, volumeData);
    return {
      timestamp,
      open,
      high,
      low,
      close,
      volume: closestVolume,
      isGreen: close >= open,
      isRed: close < open,
      changePercent: open !== 0 ? ((close - open) / open) * 100 : 0,
    };
  });

  return blocks;
}

function findClosestVolume(timestamp, volumeData) {
  if (!volumeData || volumeData.length === 0) return 0;

  let closest = volumeData[0];
  let minDiff = Math.abs(timestamp - volumeData[0][0]);

  for (let i = 1; i < volumeData.length; i++) {
    const diff = Math.abs(timestamp - volumeData[i][0]);
    if (diff < minDiff) {
      minDiff = diff;
      closest = volumeData[i];
    }
  }

  return closest[1];
}

/**
 * Detects 3-Block Volume phases in block data.
 * Returns the analysis result including the phase type and the 3 blocks.
 */
export function detect3BlockPhase(blocks) {
  if (!blocks || blocks.length < 3) {
    return { phase: 'none', blocks: [], description: 'Insufficient data' };
  }

  // Analyze the last 3 blocks
  const lastThree = blocks.slice(-3);

  const allGreen = lastThree.every((b) => b.isGreen);
  const allRed = lastThree.every((b) => b.isRed);

  // Check if all 3 blocks have meaningful volume (non-zero)
  const hasVolume = lastThree.every((b) => b.volume > 0);

  // Calculate volume trend (is volume increasing across the 3 blocks?)
  const volumeTrend = getVolumeTrend(lastThree);

  if (allGreen && hasVolume) {
    return {
      phase: 'green',
      blocks: lastThree,
      volumeTrend,
      description: 'GREEN 3-Block Volume: 3 consecutive bullish candles with active volume. Sustained buying pressure detected.',
      signal: 'bullish',
    };
  }

  if (allRed && hasVolume) {
    return {
      phase: 'red',
      blocks: lastThree,
      volumeTrend,
      description: 'RED 3-Block Volume: 3 consecutive bearish candles with active volume. Sustained selling pressure detected.',
      signal: 'bearish',
    };
  }

  return {
    phase: 'none',
    blocks: lastThree,
    volumeTrend,
    description: 'No 3-Block Volume phase detected. Mixed candle pattern.',
    signal: 'neutral',
  };
}

/**
 * Scan the entire block history for all 3-block phases.
 * Returns an array of all detected phases with their positions.
 */
export function scanAll3BlockPhases(blocks) {
  if (!blocks || blocks.length < 3) return [];

  const phases = [];

  for (let i = 0; i <= blocks.length - 3; i++) {
    const window = blocks.slice(i, i + 3);
    const allGreen = window.every((b) => b.isGreen);
    const allRed = window.every((b) => b.isRed);
    const hasVolume = window.every((b) => b.volume > 0);

    if ((allGreen || allRed) && hasVolume) {
      phases.push({
        startIndex: i,
        endIndex: i + 2,
        phase: allGreen ? 'green' : 'red',
        blocks: window,
        volumeTrend: getVolumeTrend(window),
      });
    }
  }

  return phases;
}

function getVolumeTrend(threeBlocks) {
  if (threeBlocks.length < 3) return 'unknown';
  const [a, b, c] = threeBlocks.map((bl) => bl.volume);
  if (a < b && b < c) return 'increasing';
  if (a > b && b > c) return 'decreasing';
  return 'mixed';
}

/**
 * Calculate summary statistics for a set of blocks.
 */
export function getBlockSummary(blocks) {
  if (!blocks || blocks.length === 0) return null;

  const totalVolume = blocks.reduce((sum, b) => sum + b.volume, 0);
  const avgVolume = totalVolume / blocks.length;
  const greenCount = blocks.filter((b) => b.isGreen).length;
  const redCount = blocks.filter((b) => b.isRed).length;
  const priceChange = blocks.length > 0
    ? ((blocks[blocks.length - 1].close - blocks[0].open) / blocks[0].open) * 100
    : 0;

  return {
    totalBlocks: blocks.length,
    greenCount,
    redCount,
    totalVolume,
    avgVolume,
    priceChange,
  };
}

/**
 * Determine if a crypto should be added to watchlist based on 3-block analysis.
 */
export function shouldAddToWatchlist(analysis) {
  return analysis.phase === 'green' || analysis.phase === 'red';
}
