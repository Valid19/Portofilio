import { useState, useCallback } from 'react';
import { fetchTopCryptos, fetchOHLC, fetchMarketChart } from '../services/cryptoApi';
import { buildBlocks, detect3BlockPhase } from '../services/volumeAnalysis';

export function useCryptoData() {
  const [cryptos, setCryptos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResults, setAnalysisResults] = useState({});
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });

  const loadTopCryptos = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTopCryptos(page, 50);
      setCryptos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeCoin = useCallback(async (coinId) => {
    try {
      const [ohlcData, chartData] = await Promise.all([
        fetchOHLC(coinId, 7),
        fetchMarketChart(coinId, 7),
      ]);

      const blocks = buildBlocks(ohlcData, chartData.total_volumes);
      const analysis = detect3BlockPhase(blocks);

      const result = {
        coinId,
        analysis,
        blocks,
        lastUpdated: Date.now(),
      };

      setAnalysisResults((prev) => ({ ...prev, [coinId]: result }));
      return result;
    } catch (err) {
      const errorResult = {
        coinId,
        analysis: { phase: 'error', description: err.message },
        blocks: [],
        lastUpdated: Date.now(),
      };
      setAnalysisResults((prev) => ({ ...prev, [coinId]: errorResult }));
      return errorResult;
    }
  }, []);

  const scanAllCryptos = useCallback(async (cryptoList) => {
    setScanning(true);
    setScanProgress({ current: 0, total: cryptoList.length });

    const results = {};

    for (let i = 0; i < cryptoList.length; i++) {
      const coin = cryptoList[i];
      try {
        const result = await analyzeCoin(coin.id);
        results[coin.id] = result;
      } catch {
        // Continue scanning even if one fails
      }
      setScanProgress({ current: i + 1, total: cryptoList.length });
      // Small delay to avoid rate limiting
      if (i < cryptoList.length - 1) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    setScanning(false);
    return results;
  }, [analyzeCoin]);

  return {
    cryptos,
    loading,
    scanning,
    error,
    analysisResults,
    scanProgress,
    loadTopCryptos,
    analyzeCoin,
    scanAllCryptos,
  };
}
