function formatPrice(price) {
  if (!price) return '$0.00';
  if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${price.toPrecision(4)}`;
}

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Watchlist({ watchlist, onRemove, onClear }) {
  if (watchlist.length === 0) {
    return (
      <div className="watchlist-empty">
        <div className="watchlist-empty-icon">&#9734;</div>
        <h3>Watchlist is empty</h3>
        <p>
          Scan cryptocurrencies for 3-Block Volume patterns.
          Coins with <span className="text-green">green</span> or{' '}
          <span className="text-red">red</span> 3-block phases will be eligible
          to add to your watchlist.
        </p>
      </div>
    );
  }

  const greenItems = watchlist.filter((item) => item.phase === 'green');
  const redItems = watchlist.filter((item) => item.phase === 'red');

  return (
    <div className="watchlist">
      <div className="watchlist-header">
        <h2>
          Watchlist <span className="watchlist-count">({watchlist.length})</span>
        </h2>
        <button className="btn btn-clear" onClick={onClear}>
          Clear All
        </button>
      </div>

      {greenItems.length > 0 && (
        <div className="watchlist-section">
          <h3 className="section-title text-green">
            &#9650; Green 3-Block Volume ({greenItems.length})
          </h3>
          <p className="section-subtitle">Bullish momentum — 3 consecutive green candles with volume</p>
          <div className="watchlist-items">
            {greenItems.map((item) => (
              <WatchlistItem key={item.id} item={item} onRemove={onRemove} />
            ))}
          </div>
        </div>
      )}

      {redItems.length > 0 && (
        <div className="watchlist-section">
          <h3 className="section-title text-red">
            &#9660; Red 3-Block Volume ({redItems.length})
          </h3>
          <p className="section-subtitle">Bearish momentum — 3 consecutive red candles with volume</p>
          <div className="watchlist-items">
            {redItems.map((item) => (
              <WatchlistItem key={item.id} item={item} onRemove={onRemove} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WatchlistItem({ item, onRemove }) {
  const isPositive = (item.priceChange || 0) >= 0;

  return (
    <div className={`watchlist-item watchlist-item--${item.phase}`}>
      <div className="watchlist-item-left">
        <img
          src={item.image}
          alt={item.name}
          className="crypto-icon-sm"
          width="24"
          height="24"
        />
        <div>
          <span className="watchlist-item-name">{item.name}</span>
          <span className="watchlist-item-symbol">{item.symbol?.toUpperCase()}</span>
        </div>
      </div>
      <div className="watchlist-item-center">
        <span className="watchlist-item-price">{formatPrice(item.price)}</span>
        <span className={`watchlist-item-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '+' : ''}{(item.priceChange || 0).toFixed(2)}%
        </span>
      </div>
      <div className="watchlist-item-right">
        <span className={`phase-tag phase-tag--${item.phase}`}>
          {item.phase === 'green' ? 'BULLISH' : 'BEARISH'}
        </span>
        <span className="watchlist-item-time">{timeAgo(item.addedAt)}</span>
      </div>
      <button
        className="btn-icon btn-remove-sm"
        onClick={() => onRemove(item.id)}
        title="Remove from watchlist"
      >
        &#10005;
      </button>
    </div>
  );
}
