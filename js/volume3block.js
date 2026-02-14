/**
 * Volume 3 Candle Block Engine
 * Ported from TradingView Pine Script "Volume 3 Candle Block" indicator
 *
 * Groups every 3 candles into 1 volume block, tracks historical blocks,
 * and determines if the current/latest block is in a green (highest) or red (lowest) phase.
 */

class Volume3BlockEngine {
  constructor(options = {}) {
    this.blocksToTrack = options.blocksToTrack || 20;
  }

  /**
   * Analyze candle data and return volume block analysis.
   * @param {Array} candles - Array of {open, high, low, close, volume, time}
   * @returns {Object} Analysis result with blocks, phases, stats
   */
  analyze(candles) {
    if (!candles || candles.length < 3) {
      return { blocks: [], phase: 'neutral', stats: null };
    }

    const blocks = [];
    let i = 0;

    // Group candles into blocks of 3
    while (i + 2 < candles.length) {
      const blockCandles = candles.slice(i, i + 3);
      const totalVolume = blockCandles.reduce((sum, c) => sum + c.volume, 0);
      const openPrice = blockCandles[0].open;
      const closePrice = blockCandles[2].close;
      const highPrice = Math.max(...blockCandles.map(c => c.high));
      const lowPrice = Math.min(...blockCandles.map(c => c.low));
      const time = blockCandles[0].time;
      const endTime = blockCandles[2].time;

      blocks.push({
        volume: totalVolume,
        open: openPrice,
        close: closePrice,
        high: highPrice,
        low: lowPrice,
        time,
        endTime,
        candles: blockCandles,
        isBullish: closePrice >= openPrice,
      });

      i += 3;
    }

    // Handle remaining candles as a partial (current) block
    let currentBlock = null;
    if (i < candles.length) {
      const remaining = candles.slice(i);
      const totalVolume = remaining.reduce((sum, c) => sum + c.volume, 0);
      currentBlock = {
        volume: totalVolume,
        open: remaining[0].open,
        close: remaining[remaining.length - 1].close,
        high: Math.max(...remaining.map(c => c.high)),
        low: Math.min(...remaining.map(c => c.low)),
        time: remaining[0].time,
        endTime: remaining[remaining.length - 1].time,
        candles: remaining,
        isBullish: remaining[remaining.length - 1].close >= remaining[0].open,
        isPartial: true,
        candleCount: remaining.length,
      };
    }

    // Track the last N completed blocks for comparison
    const trackedBlocks = blocks.slice(-this.blocksToTrack);

    // Calculate stats from tracked blocks
    const stats = this._calculateStats(trackedBlocks, currentBlock);

    // Determine phase for the latest completed block
    const latestBlock = blocks.length > 0 ? blocks[blocks.length - 1] : null;
    let phase = 'neutral';
    let phaseReason = '';

    if (latestBlock && trackedBlocks.length >= 2) {
      const volumes = trackedBlocks.map(b => b.volume);
      const maxVol = Math.max(...volumes);
      const minVol = Math.min(...volumes);

      if (latestBlock.volume === maxVol) {
        phase = 'green';
        phaseReason = 'Highest volume block in tracking period';
      } else if (latestBlock.volume === minVol) {
        phase = 'red';
        phaseReason = 'Lowest volume block in tracking period';
      }
    }

    // Also check current partial block
    let currentPhase = 'neutral';
    if (currentBlock && trackedBlocks.length >= 1) {
      const allVolumes = [...trackedBlocks.map(b => b.volume), currentBlock.volume];
      const maxVol = Math.max(...allVolumes);
      const minVol = Math.min(...allVolumes);

      if (currentBlock.volume === maxVol) {
        currentPhase = 'green';
      } else if (currentBlock.volume === minVol) {
        currentPhase = 'red';
      }
    }

    // Assign phase colors to each tracked block
    if (trackedBlocks.length >= 2) {
      const volumes = trackedBlocks.map(b => b.volume);
      const maxVol = Math.max(...volumes);
      const minVol = Math.min(...volumes);

      for (const block of trackedBlocks) {
        if (block.volume === maxVol) {
          block.phase = 'green';
        } else if (block.volume === minVol) {
          block.phase = 'red';
        } else {
          block.phase = 'neutral';
        }
      }
    }

    return {
      blocks: trackedBlocks,
      allBlocks: blocks,
      currentBlock,
      phase,
      currentPhase,
      phaseReason,
      stats,
    };
  }

  _calculateStats(trackedBlocks, currentBlock) {
    if (trackedBlocks.length === 0) return null;

    const volumes = trackedBlocks.map(b => b.volume);
    const sum = volumes.reduce((a, b) => a + b, 0);
    const average = sum / volumes.length;
    const highest = Math.max(...volumes);
    const lowest = Math.min(...volumes);

    // Percent change from second-to-last to last block
    let percentChange = 0;
    if (trackedBlocks.length >= 2) {
      const prev = trackedBlocks[trackedBlocks.length - 2].volume;
      const last = trackedBlocks[trackedBlocks.length - 1].volume;
      if (prev > 0) {
        percentChange = ((last - prev) / prev) * 100;
      }
    }

    // Current block percent of average
    let currentPercentOfAvg = 0;
    if (currentBlock && average > 0) {
      currentPercentOfAvg = (currentBlock.volume / average) * 100;
    }

    return {
      average,
      highest,
      lowest,
      percentChange,
      blockCount: trackedBlocks.length,
      currentPercentOfAvg,
    };
  }
}

// Export for use in other modules
window.Volume3BlockEngine = Volume3BlockEngine;
