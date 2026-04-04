# ForexSignalPro

## Current State
- App fetches forex prices from multiple CORS-free APIs (ExchangeRate-API, Frankfurter, GitHub CDN) -- these provide hourly updates only, not real-time
- On launch, 200 synthetic (fake) candle data points are generated to bootstrap indicators
- Volume data is fully simulated -- no real volume from any API
- OTC tab exists but is entirely simulated (noise added to real prices)
- Real and OTC tabs are present; real tab uses actual prices but with fake historical data
- 15 technical indicators, 75% threshold, signals saved to backend
- Live journal in 300px contained window
- Signal history updates in real time
- Backend has `getForexCandles` method using Twelve Data API with user's key

## Requested Changes (Diff)

### Add
- Real M1 (1-minute) candle data fetching from Twelve Data API (free plan, user key: `44c2051d28f84197a0b07bdb85c38a85`)
- Fetch last 200 real M1 candles on startup for each selected pair directly from Twelve Data via frontend (using the backend HTTP outcall proxy to bypass CORS)
- Real volume data from Twelve Data candle response (each candle includes volume)
- Signals labeled as "1 min AL" / "1 min SAT" to match Pocket Option 1-minute trading
- Auto-refresh: fetch new M1 candle every 60 seconds to keep chart current

### Modify
- Replace synthetic historical data generation with real Twelve Data M1 candles fetched through the backend `getForexCandles` proxy
- Replace all 3 CORS-free parallel price fetchers with Twelve Data real-time price (latest close from M1 candle stream)
- Volume indicator now uses real volume from Twelve Data candles instead of simulated values
- Signal direction labels changed from generic BUY/SELL to "1 dəq AL" / "1 dəq SAT"
- Update interval: new candle arrives every 60 seconds; analysis runs on each new candle

### Remove
- OTC tab and all OTC simulation logic
- Synthetic 200-point history generation
- ExchangeRate-API, Frankfurter.app, and GitHub CDN price fetchers
- Fake volume generation

## Implementation Plan
1. Backend `getForexCandles` already exists -- it fetches Twelve Data time_series with interval parameter. Ensure it supports `1min` interval and `outputsize=200`.
2. Frontend `useForexBot` hook:
   - On pair selection, call backend `getForexCandles(pair, '1min')` to get 200 real M1 candles
   - Parse response: extract open, high, low, close, volume arrays
   - Set initial price from the most recent candle close
   - Run all 15 indicators on this real data (with real volume)
   - Every 60 seconds, fetch latest candles again and append new candle if available
3. Remove OTC tab from App.tsx and all related state/logic
4. Update signal display to show "1 dəq AL" / "1 dəq SAT"
5. Keep all other UI: candlestick chart, journal window (300px), signal history, stats panel
6. Handle Twelve Data API rate limits: free plan allows 8 req/min -- we only need 1 req/60s per pair, well within limits
7. Handle API errors gracefully: show last known data if fetch fails
