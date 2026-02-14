export default function Header({ activeTab, onTabChange, watchlistCount }) {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-brand">
          <div className="logo">
            <span className="logo-icon">&#9670;</span>
            <h1>CryptoWatch</h1>
          </div>
          <p className="tagline">3-Block Volume Analysis</p>
        </div>
        <nav className="header-nav">
          <button
            className={`nav-btn ${activeTab === 'scanner' ? 'active' : ''}`}
            onClick={() => onTabChange('scanner')}
          >
            Scanner
          </button>
          <button
            className={`nav-btn ${activeTab === 'watchlist' ? 'active' : ''}`}
            onClick={() => onTabChange('watchlist')}
          >
            Watchlist
            {watchlistCount > 0 && (
              <span className="nav-badge">{watchlistCount}</span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
