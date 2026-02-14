/**
 * Main Application - Crypto Watchlist Volume 3 Block Scanner
 *
 * Scans multiple crypto assets, runs the Volume 3 Block analysis on each,
 * and auto-adds assets to the watchlist when they are in a green or red phase.
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════

  const api = new CryptoAPI();
  const engine = new Volume3BlockEngine({ blocksToTrack: 20 });
  const watchlist = new WatchlistManager();

  let scanResults = [];
  let isScanning = false;
  let autoScanInterval = null;
  let currentFilter = 'all';

  // DOM references
  const scanBtn = document.getElementById('scan-btn');
  const autoScanBtn = document.getElementById('auto-scan-btn');
  const intervalSelect = document.getElementById('interval-select');
  const watchlistContainer = document.getElementById('watchlist-container');
  const scannerContainer = document.getElementById('scanner-container');
  const scanStatusText = document.getElementById('scan-status-text');
  const scanProgress = document.getElementById('scan-progress');
  const clearWatchlistBtn = document.getElementById('clear-watchlist');
  const detailModal = document.getElementById('detail-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');

  // ═══════════════════════════════════════════════════════════════
  // EVENT LISTENERS
  // ═══════════════════════════════════════════════════════════════

  scanBtn.addEventListener('click', () => runScan());

  autoScanBtn.addEventListener('click', toggleAutoScan);

  clearWatchlistBtn.addEventListener('click', () => {
    watchlist.clear();
    renderWatchlist();
    showToast('Watchlist cleared', 'blue');
  });

  // Filter tabs
  document.querySelectorAll('.filter-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      renderWatchlist();
    });
  });

  // Modal close
  detailModal.querySelector('.modal-close').addEventListener('click', closeModal);
  detailModal.querySelector('.modal-overlay').addEventListener('click', closeModal);

  // Listen for watchlist changes
  watchlist.onChange(() => renderWatchlist());

  // Initial render
  renderWatchlist();

  // ═══════════════════════════════════════════════════════════════
  // SCANNER
  // ═══════════════════════════════════════════════════════════════

  async function runScan() {
    if (isScanning) return;
    isScanning = true;

    scanBtn.disabled = true;
    scanBtn.textContent = 'Scanning...';
    scanStatusText.textContent = 'Scanning...';
    scanProgress.classList.remove('hidden');
    scannerContainer.innerHTML = createSkeletonCards(5);

    const symbols = api.getDefaultSymbols();
    const interval = intervalSelect.value;
    scanResults = [];

    // We need enough candles to form at least 20 blocks of 3 = 60 candles, plus some extra
    const limit = 80;

    for (let i = 0; i < symbols.length; i++) {
      scanProgress.textContent = `${i + 1}/${symbols.length}`;

      try {
        const candles = await api.getKlines(symbols[i], interval, limit);
        const analysis = engine.analyze(candles);

        // Get current price from last candle
        const lastCandle = candles[candles.length - 1];
        const price = lastCandle.close;

        const result = {
          symbol: symbols[i],
          displaySymbol: api.formatSymbol(symbols[i]),
          baseAsset: api.getBaseAsset(symbols[i]),
          price,
          analysis,
          interval,
          scannedAt: Date.now(),
        };

        scanResults.push(result);

        // Auto-add to watchlist if in green or red phase
        if (analysis.phase === 'green' || analysis.phase === 'red') {
          watchlist.add({
            symbol: symbols[i],
            displaySymbol: result.displaySymbol,
            baseAsset: result.baseAsset,
            phase: analysis.phase,
            volume: analysis.blocks.length > 0
              ? analysis.blocks[analysis.blocks.length - 1].volume
              : 0,
            price,
            stats: analysis.stats,
            interval,
            phaseReason: analysis.phaseReason,
          });

          showToast(
            `${result.displaySymbol} added - ${analysis.phase === 'green' ? 'GREEN' : 'RED'} phase detected`,
            analysis.phase
          );
        }

        // Progressively render results
        renderScannerResults();
      } catch (err) {
        console.warn(`Failed to scan ${symbols[i]}:`, err.message);
        scanResults.push({
          symbol: symbols[i],
          displaySymbol: api.formatSymbol(symbols[i]),
          baseAsset: api.getBaseAsset(symbols[i]),
          error: err.message,
          scannedAt: Date.now(),
        });
        renderScannerResults();
      }

      // Rate limit: small delay between requests
      if (i < symbols.length - 1) {
        await sleep(300);
      }
    }

    isScanning = false;
    scanBtn.disabled = false;
    scanBtn.textContent = 'Scan Now';
    scanStatusText.textContent = `Last scan: ${formatTime(Date.now())}`;
    scanProgress.classList.add('hidden');
  }

  function toggleAutoScan() {
    if (autoScanInterval) {
      clearInterval(autoScanInterval);
      autoScanInterval = null;
      autoScanBtn.textContent = 'Auto Scan: OFF';
      autoScanBtn.classList.remove('active');
    } else {
      autoScanBtn.textContent = 'Auto Scan: ON';
      autoScanBtn.classList.add('active');
      runScan();
      // Re-scan every 3 minutes
      autoScanInterval = setInterval(() => runScan(), 3 * 60 * 1000);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDERING - SCANNER RESULTS
  // ═══════════════════════════════════════════════════════════════

  function renderScannerResults() {
    if (scanResults.length === 0) {
      scannerContainer.innerHTML = '<div class="empty-state"><p>No results yet.</p></div>';
      return;
    }

    // Sort: green/red first, then neutral
    const sorted = [...scanResults].sort((a, b) => {
      if (a.error) return 1;
      if (b.error) return -1;
      const phaseOrder = { green: 0, red: 1, neutral: 2 };
      const aPhase = a.analysis ? (phaseOrder[a.analysis.phase] ?? 2) : 2;
      const bPhase = b.analysis ? (phaseOrder[b.analysis.phase] ?? 2) : 2;
      return aPhase - bPhase;
    });

    scannerContainer.innerHTML = sorted.map(result => {
      if (result.error) {
        return `
          <div class="crypto-card phase-neutral">
            <div class="card-top">
              <span class="card-symbol">${result.displaySymbol}</span>
              <span class="card-price" style="color: var(--red);">Error</span>
            </div>
            <div class="card-middle">
              <span class="phase-badge neutral">Failed: ${result.error}</span>
            </div>
          </div>`;
      }

      const { analysis, price, displaySymbol } = result;
      const phase = analysis.phase;
      const stats = analysis.stats;

      return `
        <div class="crypto-card phase-${phase}" data-symbol="${result.symbol}" onclick="window._openDetail('${result.symbol}')">
          <div class="card-top">
            <span class="card-symbol">${displaySymbol}</span>
            <span class="card-price">$${formatPrice(price)}</span>
          </div>
          <div class="card-middle">
            <span class="phase-badge ${phase}">${phaseLabel(phase)}</span>
            ${stats && stats.percentChange !== 0 ? `
              <span class="change-badge ${stats.percentChange > 0 ? 'positive' : 'negative'}">
                ${stats.percentChange > 0 ? '+' : ''}${stats.percentChange.toFixed(1)}% vol
              </span>` : ''}
          </div>
          ${renderMiniVolumeBars(analysis)}
          <div class="card-stats">
            <div class="stat">
              <span class="stat-label">Avg Vol</span>
              <span class="stat-value">${stats ? formatVolume(stats.average) : '-'}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Highest</span>
              <span class="stat-value">${stats ? formatVolume(stats.highest) : '-'}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Lowest</span>
              <span class="stat-value">${stats ? formatVolume(stats.lowest) : '-'}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Blocks</span>
              <span class="stat-value">${stats ? stats.blockCount : '-'}</span>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  function renderMiniVolumeBars(analysis) {
    const blocks = analysis.blocks;
    if (blocks.length === 0) return '';

    const maxVol = Math.max(...blocks.map(b => b.volume));
    const minVol = Math.min(...blocks.map(b => b.volume));

    // Show last 10 blocks for mini chart
    const displayBlocks = blocks.slice(-10);

    let bars = displayBlocks.map(b => {
      const height = maxVol > 0 ? Math.max(4, (b.volume / maxVol) * 100) : 4;
      let cls = '';
      if (b.volume === maxVol) cls = 'highest';
      else if (b.volume === minVol) cls = 'lowest';

      return `<div class="vol-bar ${cls}" style="height:${height}%"></div>`;
    }).join('');

    // Add current partial block if exists
    if (analysis.currentBlock) {
      const height = maxVol > 0 ? Math.max(4, (analysis.currentBlock.volume / maxVol) * 100) : 4;
      bars += `<div class="vol-bar current" style="height:${height}%" title="Current (${analysis.currentBlock.candleCount}/3)"></div>`;
    }

    return `<div class="volume-bars">${bars}</div>`;
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDERING - WATCHLIST
  // ═══════════════════════════════════════════════════════════════

  function renderWatchlist() {
    const items = watchlist.getByPhase(currentFilter);

    if (items.length === 0) {
      watchlistContainer.innerHTML = `
        <div class="empty-state">
          <p>No assets in watchlist${currentFilter !== 'all' ? ` (${currentFilter} phase)` : ''}.</p>
          <p class="hint">Click "Scan Now" to analyze crypto assets.</p>
        </div>`;
      return;
    }

    watchlistContainer.innerHTML = items.map(item => `
      <div class="crypto-card phase-${item.phase}" data-symbol="${item.symbol}">
        <div class="card-top">
          <span class="card-symbol">${item.displaySymbol}</span>
          <span class="card-price">$${formatPrice(item.price)}</span>
        </div>
        <div class="card-middle">
          <span class="phase-badge ${item.phase}">${phaseLabel(item.phase)}</span>
          <span style="font-size:11px; color:var(--text-muted);">${item.interval} interval</span>
        </div>
        <div class="card-stats">
          <div class="stat">
            <span class="stat-label">Block Vol</span>
            <span class="stat-value">${formatVolume(item.volume)}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Avg Vol</span>
            <span class="stat-value">${item.stats ? formatVolume(item.stats.average) : '-'}</span>
          </div>
          <div class="stat">
            <span class="stat-label">% of Avg</span>
            <span class="stat-value">${item.stats ? item.stats.currentPercentOfAvg.toFixed(0) + '%' : '-'}</span>
          </div>
        </div>
        <div class="card-actions">
          <span class="card-time">Added ${formatTimeAgo(item.addedAt)}</span>
          <button class="btn-remove" onclick="event.stopPropagation(); window._removeFromWatchlist('${item.symbol}')">Remove</button>
        </div>
      </div>`).join('');
  }

  // ═══════════════════════════════════════════════════════════════
  // DETAIL MODAL
  // ═══════════════════════════════════════════════════════════════

  window._openDetail = function (symbol) {
    const result = scanResults.find(r => r.symbol === symbol);
    if (!result || result.error) return;

    const { analysis, displaySymbol, price } = result;
    const stats = analysis.stats;

    modalTitle.textContent = `${displaySymbol} - Volume 3 Block Analysis`;

    let html = '';

    // Stats grid
    html += '<div class="detail-stats">';
    html += `
      <div class="detail-stat">
        <div class="label">Current Price</div>
        <div class="value">$${formatPrice(price)}</div>
      </div>
      <div class="detail-stat">
        <div class="label">Phase</div>
        <div class="value ${analysis.phase}">${phaseLabel(analysis.phase)}</div>
      </div>`;

    if (stats) {
      html += `
        <div class="detail-stat">
          <div class="label">Avg Block Volume</div>
          <div class="value yellow">${formatVolume(stats.average)}</div>
        </div>
        <div class="detail-stat">
          <div class="label">Highest Block</div>
          <div class="value green">${formatVolume(stats.highest)}</div>
        </div>
        <div class="detail-stat">
          <div class="label">Lowest Block</div>
          <div class="value red">${formatVolume(stats.lowest)}</div>
        </div>
        <div class="detail-stat">
          <div class="label">Vol % Change</div>
          <div class="value ${stats.percentChange >= 0 ? 'green' : 'red'}">
            ${stats.percentChange >= 0 ? '+' : ''}${stats.percentChange.toFixed(1)}%
          </div>
        </div>`;
    }
    html += '</div>';

    // Volume block chart
    if (analysis.blocks.length > 0) {
      const blocks = analysis.blocks;
      const maxVol = Math.max(...blocks.map(b => b.volume));
      const minVol = Math.min(...blocks.map(b => b.volume));

      html += '<div class="detail-chart">';
      html += '<h4>Volume Blocks (last ' + blocks.length + ' completed blocks)</h4>';

      // Average line position
      if (stats) {
        const avgPercent = (stats.average / maxVol) * 100;
        html += `
          <div style="position:relative; height:0;">
            <div class="detail-avg-line" style="position:relative; top:${120 - (avgPercent / 100) * 120}px;">
              <span class="detail-avg-label">Avg: ${formatVolume(stats.average)}</span>
            </div>
          </div>`;
      }

      html += '<div class="detail-bars">';
      for (const block of blocks) {
        const height = maxVol > 0 ? Math.max(4, (block.volume / maxVol) * 100) : 4;
        let cls = '';
        if (block.volume === maxVol) cls = 'highest';
        else if (block.volume === minVol) cls = 'lowest';

        const time = new Date(block.time);
        const label = time.getHours().toString().padStart(2, '0') + ':' +
                      time.getMinutes().toString().padStart(2, '0');

        html += `
          <div class="detail-bar-wrapper" title="Vol: ${formatVolume(block.volume)}">
            <div class="detail-bar ${cls}" style="height:${height}%"></div>
            <div class="detail-bar-label">${label}</div>
          </div>`;
      }

      // Current partial block
      if (analysis.currentBlock) {
        const cb = analysis.currentBlock;
        const height = maxVol > 0 ? Math.max(4, (cb.volume / maxVol) * 100) : 4;
        html += `
          <div class="detail-bar-wrapper" title="Current block (${cb.candleCount}/3): ${formatVolume(cb.volume)}">
            <div class="detail-bar current-block" style="height:${height}%"></div>
            <div class="detail-bar-label">${cb.candleCount}/3</div>
          </div>`;
      }

      html += '</div></div>';
    }

    // Phase explanation
    html += `
      <div style="margin-top:20px; padding:12px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm);">
        <div style="font-size:12px; color:var(--text-secondary); line-height:1.6;">
          <strong>How Volume 3 Block works:</strong><br>
          Every 3 candles are grouped into one volume block. The total volume of each block is
          compared against the last ${stats ? stats.blockCount : 20} blocks.<br><br>
          <span style="color:var(--green);">GREEN phase</span> = Block has the highest total volume (potential breakout / strong momentum).<br>
          <span style="color:var(--red);">RED phase</span> = Block has the lowest total volume (potential accumulation / consolidation).<br>
          <span style="color:var(--text-muted);">NEUTRAL</span> = Volume is between the highest and lowest.
        </div>
      </div>`;

    modalBody.innerHTML = html;
    detailModal.classList.remove('hidden');
  };

  window._removeFromWatchlist = function (symbol) {
    watchlist.remove(symbol);
    showToast(`${api.formatSymbol(symbol)} removed from watchlist`, 'blue');
  };

  function closeModal() {
    detailModal.classList.add('hidden');
  }

  // ═══════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════

  function phaseLabel(phase) {
    switch (phase) {
      case 'green': return 'Green Phase (Highest Vol)';
      case 'red': return 'Red Phase (Lowest Vol)';
      default: return 'Neutral';
    }
  }

  function formatPrice(price) {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(4);
    if (price >= 0.01) return price.toFixed(6);
    return price.toFixed(8);
  }

  function formatVolume(vol) {
    if (vol >= 1e9) return (vol / 1e9).toFixed(2) + 'B';
    if (vol >= 1e6) return (vol / 1e6).toFixed(2) + 'M';
    if (vol >= 1e3) return (vol / 1e3).toFixed(2) + 'K';
    return vol.toFixed(2);
  }

  function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  function formatTimeAgo(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function createSkeletonCards(count) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="skeleton-card">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line long"></div>
        </div>`;
    }
    return html;
  }

  function showToast(message, type = 'blue') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
})();
