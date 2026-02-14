# CryptoWatch - 3-Block Volume Analyzer

A cryptocurrency watchlist application that uses **3-Block Volume Analysis** to identify bullish and bearish momentum patterns.

## What is 3-Block Volume?

The 3-Block Volume pattern analyzes 3 consecutive candlestick periods (blocks) of OHLC data combined with volume:

- **Green 3-Block Volume (Bullish)**: 3 consecutive periods where close > open (green candles) with active volume. Signals sustained buying pressure.
- **Red 3-Block Volume (Bearish)**: 3 consecutive periods where close < open (red candles) with active volume. Signals sustained selling pressure.

When either pattern is detected, the cryptocurrency qualifies to be added to the watchlist.

## Features

- Fetch top 50 cryptocurrencies by market cap from CoinGecko
- Scan individual coins or batch-scan top 20 for 3-block volume patterns
- Visual 3-block volume indicator showing candle colors and volume bars
- Add coins to watchlist when green or red 3-block phase is detected
- Watchlist persisted in localStorage
- Dark trading-themed UI with responsive design

## Getting Started

```bash
npm install
npm run dev
```

## Tech Stack

- React 19 + Vite
- CoinGecko API (free tier, no key required)
- CSS custom properties for theming
- localStorage for persistence

## Disclaimer

For informational purposes only. Not financial advice.
