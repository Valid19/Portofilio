export default function InfoPanel() {
  return (
    <div className="info-panel">
      <h3>How 3-Block Volume Analysis Works</h3>
      <div className="info-grid">
        <div className="info-card info-card--green">
          <div className="info-card-header">
            <span className="info-icon">&#9650;</span>
            <h4>Green 3-Block Volume</h4>
          </div>
          <p>
            Detected when <strong>3 consecutive candlestick periods</strong> all
            close higher than they opened (green candles), each with meaningful
            trading volume. This indicates <strong>sustained buying pressure</strong> and
            bullish momentum.
          </p>
          <div className="info-visual">
            <div className="mini-block mini-block--green" />
            <div className="mini-block mini-block--green" />
            <div className="mini-block mini-block--green" />
          </div>
          <span className="info-action">Added to watchlist as Bullish signal</span>
        </div>
        <div className="info-card info-card--red">
          <div className="info-card-header">
            <span className="info-icon">&#9660;</span>
            <h4>Red 3-Block Volume</h4>
          </div>
          <p>
            Detected when <strong>3 consecutive candlestick periods</strong> all
            close lower than they opened (red candles), each with meaningful
            trading volume. This indicates <strong>sustained selling pressure</strong> and
            bearish momentum.
          </p>
          <div className="info-visual">
            <div className="mini-block mini-block--red" />
            <div className="mini-block mini-block--red" />
            <div className="mini-block mini-block--red" />
          </div>
          <span className="info-action">Added to watchlist as Bearish signal</span>
        </div>
      </div>
    </div>
  );
}
