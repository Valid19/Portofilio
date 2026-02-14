export default function ScanProgress({ current, total }) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="scan-progress">
      <div className="scan-progress-header">
        <span>Scanning for 3-Block Volume patterns...</span>
        <span>{current}/{total}</span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="scan-progress-hint">
        Analyzing OHLC data and volume for each cryptocurrency.
        This uses the CoinGecko API with rate limiting.
      </p>
    </div>
  );
}
