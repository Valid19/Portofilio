import VolumeBlocks from './VolumeBlocks';

function formatPrice(price) {
  if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${price.toPrecision(4)}`;
}

function formatVolume(volume) {
  if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
  if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
  if (volume >= 1e3) return `$${(volume / 1e3).toFixed(1)}K`;
  return `$${volume.toFixed(0)}`;
}

export default function CryptoCard({
  coin,
  analysis,
  isInWatchlist,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  onAnalyze,
  analyzing,
}) {
  const phase = analysis?.analysis?.phase;
  const canAdd = phase === 'green' || phase === 'red';
  const priceChange = coin.price_change_percentage_24h || 0;
  const isPositive = priceChange >= 0;

  return (
    <div className={`crypto-card ${phase ? `crypto-card--${phase}` : ''}`}>
      <div className="crypto-card-header">
        <div className="crypto-info">
          <img
            src={coin.image}
            alt={coin.name}
            className="crypto-icon"
            width="32"
            height="32"
          />
          <div>
            <h3 className="crypto-name">{coin.name}</h3>
            <span className="crypto-symbol">{coin.symbol?.toUpperCase()}</span>
          </div>
        </div>
        <div className="crypto-price-info">
          <span className="crypto-price">{formatPrice(coin.current_price)}</span>
          <span className={`crypto-change ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="crypto-stats">
        <div className="stat">
          <span className="stat-label">Market Cap</span>
          <span className="stat-value">{formatVolume(coin.market_cap)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">24h Volume</span>
          <span className="stat-value">{formatVolume(coin.total_volume)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Rank</span>
          <span className="stat-value">#{coin.market_cap_rank}</span>
        </div>
      </div>

      {analysis && analysis.analysis && phase !== 'error' && (
        <div className="analysis-section">
          <VolumeBlocks
            blocks={analysis.analysis.blocks}
            phase={phase}
          />
          <p className="analysis-desc">{analysis.analysis.description}</p>
        </div>
      )}

      {analysis?.analysis?.phase === 'error' && (
        <div className="analysis-error">
          <p>{analysis.analysis.description}</p>
        </div>
      )}

      <div className="crypto-card-actions">
        {!analysis && (
          <button
            className="btn btn-analyze"
            onClick={() => onAnalyze(coin.id)}
            disabled={analyzing}
          >
            {analyzing ? 'Analyzing...' : 'Analyze 3-Block Volume'}
          </button>
        )}

        {canAdd && !isInWatchlist && (
          <button
            className="btn btn-add"
            onClick={() => onAddToWatchlist({
              id: coin.id,
              name: coin.name,
              symbol: coin.symbol,
              image: coin.image,
              phase,
              price: coin.current_price,
              priceChange,
              volumeTrend: analysis.analysis.volumeTrend,
            })}
          >
            + Add to Watchlist ({phase === 'green' ? 'Bullish' : 'Bearish'} Signal)
          </button>
        )}

        {isInWatchlist && (
          <button
            className="btn btn-remove"
            onClick={() => onRemoveFromWatchlist(coin.id)}
          >
            Remove from Watchlist
          </button>
        )}

        {analysis && !canAdd && phase !== 'error' && (
          <div className="no-signal">
            No 3-Block Volume signal detected
          </div>
        )}
      </div>
    </div>
  );
}
