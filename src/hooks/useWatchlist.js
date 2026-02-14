import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'crypto-watchlist';

function loadWatchlist() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveWatchlist(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Storage full or unavailable
  }
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState(loadWatchlist);

  useEffect(() => {
    saveWatchlist(watchlist);
  }, [watchlist]);

  const addToWatchlist = useCallback((coin) => {
    setWatchlist((prev) => {
      if (prev.some((item) => item.id === coin.id)) return prev;
      return [...prev, {
        ...coin,
        addedAt: Date.now(),
      }];
    });
  }, []);

  const removeFromWatchlist = useCallback((coinId) => {
    setWatchlist((prev) => prev.filter((item) => item.id !== coinId));
  }, []);

  const isInWatchlist = useCallback(
    (coinId) => watchlist.some((item) => item.id === coinId),
    [watchlist]
  );

  const clearWatchlist = useCallback(() => {
    setWatchlist([]);
  }, []);

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    clearWatchlist,
  };
}
