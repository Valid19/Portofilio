/**
 * Watchlist Management
 * Handles adding/removing crypto assets to a watchlist based on
 * Volume 3 Block phase detection. Persists to localStorage.
 */

class WatchlistManager {
  constructor(storageKey = 'crypto_vol3b_watchlist') {
    this.storageKey = storageKey;
    this.watchlist = this._load();
    this.listeners = [];
  }

  /**
   * Get all watchlist entries.
   * @returns {Array}
   */
  getAll() {
    return [...this.watchlist];
  }

  /**
   * Get entries filtered by phase.
   * @param {string} phase - 'green', 'red', or 'all'
   * @returns {Array}
   */
  getByPhase(phase) {
    if (phase === 'all') return this.getAll();
    return this.watchlist.filter(item => item.phase === phase);
  }

  /**
   * Add a crypto to the watchlist.
   * @param {Object} entry - { symbol, phase, volume, price, stats, time }
   * @returns {boolean} true if added, false if already exists with same phase
   */
  add(entry) {
    const existing = this.watchlist.find(
      item => item.symbol === entry.symbol && item.phase === entry.phase
    );

    if (existing) {
      // Update existing entry
      Object.assign(existing, entry, { updatedAt: Date.now() });
    } else {
      // Remove any previous entry for this symbol (different phase)
      this.watchlist = this.watchlist.filter(
        item => item.symbol !== entry.symbol
      );
      this.watchlist.unshift({
        ...entry,
        addedAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    this._save();
    this._notify();
    return true;
  }

  /**
   * Remove a crypto from the watchlist.
   * @param {string} symbol
   */
  remove(symbol) {
    this.watchlist = this.watchlist.filter(item => item.symbol !== symbol);
    this._save();
    this._notify();
  }

  /**
   * Check if a symbol is in the watchlist.
   * @param {string} symbol
   * @returns {Object|null}
   */
  find(symbol) {
    return this.watchlist.find(item => item.symbol === symbol) || null;
  }

  /**
   * Clear the entire watchlist.
   */
  clear() {
    this.watchlist = [];
    this._save();
    this._notify();
  }

  /**
   * Get watchlist count.
   * @returns {number}
   */
  get count() {
    return this.watchlist.length;
  }

  /**
   * Subscribe to watchlist changes.
   * @param {Function} callback
   */
  onChange(callback) {
    this.listeners.push(callback);
  }

  _notify() {
    for (const cb of this.listeners) {
      cb(this.watchlist);
    }
  }

  _load() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  _save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.watchlist));
    } catch {
      // Storage full or unavailable
    }
  }
}

window.WatchlistManager = WatchlistManager;
