import { useState, useEffect } from 'react';
import Header from './components/Header';
import CryptoCard from './components/CryptoCard';
import Watchlist from './components/Watchlist';
import ScanProgress from './components/ScanProgress';
import InfoPanel from './components/InfoPanel';
import { useWatchlist } from './hooks/useWatchlist';
import { useCryptoData } from './hooks/useCryptoData';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('scanner');
  const [analyzingId, setAnalyzingId] = useState(null);

  const {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    clearWatchlist,
  } = useWatchlist();

  const {
    cryptos,
    loading,
    scanning,
    error,
    analysisResults,
    scanProgress,
    loadTopCryptos,
    analyzeCoin,
    scanAllCryptos,
  } = useCryptoData();

  useEffect(() => {
    loadTopCryptos();
  }, [loadTopCryptos]);

  const handleAnalyze = async (coinId) => {
    setAnalyzingId(coinId);
    await analyzeCoin(coinId);
    setAnalyzingId(null);
  };

  const handleScanTop = async () => {
    const toScan = cryptos.slice(0, 20);
    await scanAllCryptos(toScan);
  };

  // Filter cryptos that have a detected 3-block phase
  const detectedCryptos = cryptos.filter((coin) => {
    const result = analysisResults[coin.id];
    return result?.analysis?.phase === 'green' || result?.analysis?.phase === 'red';
  });

  return (
    <div className="app">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        watchlistCount={watchlist.length}
      />

      <main className="app-main">
        {activeTab === 'scanner' && (
          <div className="scanner-view">
            <InfoPanel />

            <div className="scanner-controls">
              <h2>Market Scanner</h2>
              <div className="controls-row">
                <button
                  className="btn btn-primary"
                  onClick={handleScanTop}
                  disabled={scanning || loading}
                >
                  {scanning ? 'Scanning...' : 'Scan Top 20 for 3-Block Patterns'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => loadTopCryptos()}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Refresh Market Data'}
                </button>
              </div>
            </div>

            {scanning && (
              <ScanProgress
                current={scanProgress.current}
                total={scanProgress.total}
              />
            )}

            {error && (
              <div className="error-banner">
                <p>{error}</p>
                <button className="btn btn-secondary" onClick={() => loadTopCryptos()}>
                  Retry
                </button>
              </div>
            )}

            {detectedCryptos.length > 0 && (
              <div className="detected-section">
                <h3 className="section-heading">
                  Detected 3-Block Volume Signals ({detectedCryptos.length})
                </h3>
                <div className="crypto-grid">
                  {detectedCryptos.map((coin) => (
                    <CryptoCard
                      key={coin.id}
                      coin={coin}
                      analysis={analysisResults[coin.id]}
                      isInWatchlist={isInWatchlist(coin.id)}
                      onAddToWatchlist={addToWatchlist}
                      onRemoveFromWatchlist={removeFromWatchlist}
                      onAnalyze={handleAnalyze}
                      analyzing={analyzingId === coin.id}
                    />
                  ))}
                </div>
              </div>
            )}

            <h3 className="section-heading">
              Top Cryptocurrencies by Market Cap
            </h3>
            <div className="crypto-grid">
              {cryptos.map((coin) => (
                <CryptoCard
                  key={coin.id}
                  coin={coin}
                  analysis={analysisResults[coin.id]}
                  isInWatchlist={isInWatchlist(coin.id)}
                  onAddToWatchlist={addToWatchlist}
                  onRemoveFromWatchlist={removeFromWatchlist}
                  onAnalyze={handleAnalyze}
                  analyzing={analyzingId === coin.id}
                />
              ))}
            </div>

            {cryptos.length === 0 && !loading && !error && (
              <div className="empty-state">
                <p>No market data loaded. Click &quot;Refresh Market Data&quot; to start.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'watchlist' && (
          <div className="watchlist-view">
            <Watchlist
              watchlist={watchlist}
              onRemove={removeFromWatchlist}
              onClear={clearWatchlist}
            />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          CryptoWatch 3-Block Volume Analyzer &mdash; Data from CoinGecko API
        </p>
        <p className="footer-disclaimer">
          For informational purposes only. Not financial advice.
        </p>
      </footer>
    </div>
  );
}
