import { useCallback, useEffect, useRef, useState } from "react";
import { backend } from "../backendSingleton";
import type { AllIndicators, Candle } from "../utils/indicators";
import { calcAllIndicators } from "../utils/indicators";
import type { SignalResult } from "../utils/signals";
import { generateSignal } from "../utils/signals";

// Seed prices as last-resort fallback (approximate real-world values)
const SEED_PRICES: Record<string, number> = {
  "EUR/USD": 1.084,
  "GBP/USD": 1.265,
  "USD/JPY": 149.5,
  "AUD/USD": 0.652,
  "USD/CAD": 1.368,
  "NZD/USD": 0.598,
  "EUR/GBP": 0.857,
  "EUR/JPY": 162.1,
  "GBP/JPY": 189.3,
  "USD/CHF": 0.896,
};

// Forex pair symbol map for different APIs
const PAIR_SYMBOLS: Record<string, { er: string; frank: string }> = {
  "EUR/USD": { er: "EURUSD", frank: "EUR" },
  "GBP/USD": { er: "GBPUSD", frank: "GBP" },
  "USD/JPY": { er: "USDJPY", frank: "JPY" },
  "AUD/USD": { er: "AUDUSD", frank: "AUD" },
  "USD/CAD": { er: "USDCAD", frank: "CAD" },
  "NZD/USD": { er: "NZDUSD", frank: "NZD" },
  "EUR/GBP": { er: "EURGBP", frank: "EUR" },
  "EUR/JPY": { er: "EURJPY", frank: "EUR" },
  "GBP/JPY": { er: "GBPJPY", frank: "GBP" },
  "USD/CHF": { er: "USDCHF", frank: "CHF" },
};

// Helper: get seed price with tiny random variation
function getSeedPrice(cleanPair: string, lastKnown?: number): number {
  const base = lastKnown ?? SEED_PRICES[cleanPair] ?? 1.0;
  const variation = base * 0.0002 * (Math.random() - 0.5);
  return base + variation;
}

// Generate synthetic price history based on a base price (realistic random walk)
function generatePriceHistory(basePrice: number, length = 200): number[] {
  const prices: number[] = [];
  let price = basePrice * (1 + (Math.random() - 0.5) * 0.005);
  const volatility = basePrice * 0.0003;
  for (let i = 0; i < length; i++) {
    price = price + (Math.random() - 0.5) * volatility;
    price = Math.max(price, basePrice * 0.99);
    prices.push(price);
  }
  return prices;
}

// Generate synthetic candle history from price array
function generateCandleHistory(prices: number[]): Candle[] {
  const candles: Candle[] = [];
  const chunkSize = 5;
  for (let i = 0; i + chunkSize <= prices.length; i += chunkSize) {
    const chunk = prices.slice(i, i + chunkSize);
    const open = chunk[0];
    const close = chunk[chunk.length - 1];
    const high = Math.max(...chunk) + Math.random() * open * 0.0001;
    const low = Math.min(...chunk) - Math.random() * open * 0.0001;
    candles.push({
      open,
      high,
      low,
      close,
      volume: Math.random() * 1000 + 500,
      timestamp: Date.now() - (prices.length - i) * 60000,
    });
  }
  return candles;
}

// Source 1: open.er-api.com — free, CORS-enabled, updates every ~60s
async function fetchFromExchangeRateAPI(pair: string): Promise<number | null> {
  const cleanPair = pair.replace("_OTC", "");
  const symbols = PAIR_SYMBOLS[cleanPair];
  if (!symbols) return null;

  const sym = symbols.er;
  const base = sym.slice(0, 3);
  const quote = sym.slice(3);

  try {
    const resp = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as {
      rates?: Record<string, number>;
      result?: string;
    };
    if (data.result === "success" && data.rates?.[quote]) {
      return data.rates[quote];
    }
    return null;
  } catch {
    return null;
  }
}

// Source 2: exchangerate-api.com v4 — different endpoint, free, CORS-enabled
async function fetchFromExchangeRateV4(pair: string): Promise<number | null> {
  const cleanPair = pair.replace("_OTC", "");
  const symbols = PAIR_SYMBOLS[cleanPair];
  if (!symbols) return null;

  const sym = symbols.er;
  const base = sym.slice(0, 3);
  const quote = sym.slice(3);

  try {
    const resp = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${base}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!resp.ok) return null;
    const data = (await resp.json()) as { rates?: Record<string, number> };
    if (data.rates?.[quote]) {
      return data.rates[quote];
    }
    return null;
  } catch {
    return null;
  }
}

// Source 3: Frankfurter.app — ECB data, CORS-enabled, free
async function fetchFromFrankfurter(pair: string): Promise<number | null> {
  const cleanPair = pair.replace("_OTC", "");
  const [base, quote] = cleanPair.split("/");
  if (!base || !quote) return null;

  // Frankfurter only supports EUR as base, skip non-EUR base pairs
  if (base !== "EUR") return null;

  try {
    const resp = await fetch(
      `https://api.frankfurter.app/latest?from=${base}&to=${quote}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!resp.ok) return null;
    const data = (await resp.json()) as { rates?: Record<string, number> };
    if (data.rates?.[quote]) {
      return data.rates[quote];
    }
    return null;
  } catch {
    return null;
  }
}

// Source 4: fawazahmed0/exchange-api on GitHub CDN
async function fetchFromGitHubCDN(pair: string): Promise<number | null> {
  const cleanPair = pair.replace("_OTC", "");
  const [base, quote] = cleanPair.split("/");
  if (!base || !quote) return null;

  const baseLower = base.toLowerCase();
  const quoteLower = quote.toLowerCase();

  try {
    const resp = await fetch(
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${baseLower}.json`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!resp.ok) return null;
    const data = (await resp.json()) as Record<string, Record<string, number>>;
    const rate = data[baseLower]?.[quoteLower];
    if (rate) return rate;
    return null;
  } catch {
    return null;
  }
}

// Race all 4 sources and return the FIRST successful price
async function fetchRealPrice(pair: string): Promise<number | null> {
  return new Promise((resolve) => {
    let settled = false;
    let pending = 4;

    function tryResolve(val: number | null) {
      pending--;
      if (!settled && val !== null) {
        settled = true;
        resolve(val);
      } else if (pending === 0 && !settled) {
        resolve(null);
      }
    }

    fetchFromExchangeRateAPI(pair)
      .then(tryResolve)
      .catch(() => tryResolve(null));
    fetchFromExchangeRateV4(pair)
      .then(tryResolve)
      .catch(() => tryResolve(null));
    fetchFromFrankfurter(pair)
      .then(tryResolve)
      .catch(() => tryResolve(null));
    fetchFromGitHubCDN(pair)
      .then(tryResolve)
      .catch(() => tryResolve(null));
  });
}

export interface ActiveSignal {
  id?: bigint;
  direction: "BUY" | "SELL";
  strength: number;
  entryPrice: number;
  validUntil: number;
  validity: number;
  pair: string;
  market: string;
  reversed: boolean;
}

export interface BotState {
  currentPair: string;
  currentMarket: "real" | "otc";
  currentPrice: number | null;
  priceHistory: number[];
  candles: Candle[];
  indicators: AllIndicators | null;
  signalResult: SignalResult | null;
  activeSignal: ActiveSignal | null;
  analysisLog: string[];
  isLoading: boolean;
  apiConnected: boolean;
  analysisStrength: number;
}

export const REAL_PAIRS = [
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",
  "AUD/USD",
  "USD/CAD",
  "NZD/USD",
  "EUR/GBP",
  "EUR/JPY",
  "GBP/JPY",
  "USD/CHF",
];

export const OTC_PAIRS = REAL_PAIRS.map((p) => `${p}_OTC`);

interface CandleBuffer {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
  startTime: number;
}

export function useForexBot(onSignalComplete?: () => void) {
  const onSignalCompleteRef = useRef(onSignalComplete);
  onSignalCompleteRef.current = onSignalComplete;
  const initialPair = "EUR/USD";
  const initialSeedPrice = getSeedPrice(initialPair);
  const initialHistory = generatePriceHistory(initialSeedPrice, 200);
  const initialCandles = generateCandleHistory(initialHistory);

  const [state, setState] = useState<BotState>(() => ({
    currentPair: initialPair,
    currentMarket: "real",
    currentPrice: initialSeedPrice,
    priceHistory: initialHistory,
    candles: initialCandles,
    indicators: calcAllIndicators(initialHistory, initialCandles),
    signalResult: null,
    activeSignal: null,
    analysisLog: ["[Başladı] Analiz sistemi işə düşdü..."],
    isLoading: true,
    apiConnected: false,
    analysisStrength: 0,
  }));

  const stateRef = useRef(state);
  stateRef.current = state;

  const candleRef = useRef<CandleBuffer | null>(null);
  const basePriceRef = useRef<Record<string, number>>({
    [initialPair]: initialSeedPrice,
  });

  const addLog = useCallback((msg: string) => {
    setState((prev) => ({
      ...prev,
      analysisLog: [
        `[${new Date().toLocaleTimeString("az-AZ")}] ${msg}`,
        ...prev.analysisLog,
      ].slice(0, 50),
    }));
  }, []);

  const applyPrice = useCallback(
    (price: number, apiConnected: boolean, isLoadingDone: boolean) => {
      setState((prev) => {
        const newHistory = [...prev.priceHistory, price].slice(-300);
        const now = Date.now();
        const minuteStart = Math.floor(now / 60000) * 60000;
        let newCandles = [...prev.candles];

        if (!candleRef.current || candleRef.current.startTime !== minuteStart) {
          if (candleRef.current) {
            newCandles = [
              ...newCandles,
              {
                open: candleRef.current.open,
                high: candleRef.current.high,
                low: candleRef.current.low,
                close: candleRef.current.close,
                volume: candleRef.current.volume,
                timestamp: candleRef.current.timestamp,
              },
            ].slice(-60);
          }
          candleRef.current = {
            open: price,
            high: price,
            low: price,
            close: price,
            volume: Math.random() * 1000 + 500,
            timestamp: minuteStart,
            startTime: minuteStart,
          };
        } else {
          candleRef.current.high = Math.max(candleRef.current.high, price);
          candleRef.current.low = Math.min(candleRef.current.low, price);
          candleRef.current.close = price;
          candleRef.current.volume += Math.random() * 50;
        }

        return {
          ...prev,
          currentPrice: price,
          priceHistory: newHistory,
          candles: newCandles,
          apiConnected,
          isLoading: isLoadingDone ? false : prev.isLoading,
        };
      });
    },
    [],
  );

  const fetchPrice = useCallback(
    async (pair: string, market: string) => {
      const cleanPair = pair.replace("_OTC", "");
      let price: number | null = null;
      let fromRealApi = false;

      const realPrice = await fetchRealPrice(cleanPair);

      if (realPrice !== null) {
        basePriceRef.current[cleanPair] = realPrice;
        price = realPrice;
        fromRealApi = true;
      } else {
        const lastKnown = basePriceRef.current[cleanPair];
        price = getSeedPrice(cleanPair, lastKnown);
        basePriceRef.current[cleanPair] = price;
      }

      // For OTC: add small micro-simulation on top of real base price
      if (market === "otc") {
        price =
          price +
          Math.sin(Date.now() / 10000) * 0.0003 +
          (Math.random() - 0.5) * 0.0001;
      } else {
        price = price + (Math.random() - 0.5) * 0.00003;
      }

      applyPrice(price, fromRealApi, true);

      if (!fromRealApi) {
        addLog("⚠️ API əlaqəsi yoxdur — son məlum qiymətdən istifadə edilir");
      } else {
        addLog(
          `✅ Qiymət yeniləndi: ${pair.replace("_OTC", "")} = ${price.toFixed(5)}`,
        );
      }
    },
    [applyPrice, addLog],
  );

  const analyzeMarket = useCallback(() => {
    const {
      priceHistory,
      candles,
      activeSignal,
      currentPair,
      currentMarket,
      currentPrice,
    } = stateRef.current;
    if (currentPrice === null) return;

    // Need at least 14 prices for basic indicators
    if (priceHistory.length < 14) {
      addLog("⏳ Analiz üçün daha çox məlumat toplanır...");
      return;
    }

    // Build effective candle list — ensure we always have enough
    let effectiveCandles: Candle[] = candles;
    if (effectiveCandles.length < 20) {
      // Generate synthetic candles from price history
      const synthCandles = generateCandleHistory(priceHistory);
      effectiveCandles = [...synthCandles, ...effectiveCandles].slice(-60);
    }

    const ind = calcAllIndicators(priceHistory, effectiveCandles);
    const result = generateSignal(ind, currentPrice, effectiveCandles);

    if (activeSignal) {
      const change =
        ((currentPrice - activeSignal.entryPrice) / activeSignal.entryPrice) *
        100;
      if (
        (activeSignal.direction === "BUY" && change < -0.3) ||
        (activeSignal.direction === "SELL" && change > 0.3)
      ) {
        backend
          .saveSignal(
            activeSignal.pair,
            activeSignal.market,
            activeSignal.direction,
            activeSignal.strength,
            activeSignal.entryPrice,
            currentPrice,
            false,
            BigInt(activeSignal.validity),
            true,
          )
          .catch(() => {});
        setState((prev) => ({ ...prev, activeSignal: null }));
        addLog("⚠️ REVERSAL - siqnal ləğv edildi");
        onSignalCompleteRef.current?.();
        return;
      }
    }

    if (!activeSignal && result.direction !== "WAIT") {
      const validity =
        result.strength >= 95
          ? 5
          : result.strength >= 90
            ? 4
            : result.strength >= 85
              ? 3
              : 2;
      const newSignal: ActiveSignal = {
        direction: result.direction as "BUY" | "SELL",
        strength: result.strength,
        entryPrice: currentPrice,
        validUntil: Date.now() + validity * 60 * 1000,
        validity,
        pair: currentPair,
        market: currentMarket,
        reversed: false,
      };
      setState((prev) => ({
        ...prev,
        activeSignal: newSignal,
        indicators: ind,
        signalResult: result,
        analysisStrength: result.strength,
      }));
      addLog(
        `🎯 SİQNAL: ${result.direction} @ ${currentPrice.toFixed(5)} - ${result.strength.toFixed(0)}% güc`,
      );
      return;
    }

    // Log analysis even without signal
    const topVote = result.votes.filter((v) => v.vote !== "NEUTRAL").length;
    addLog(
      `📊 Analiz: ${result.direction === "WAIT" ? "GÖZLƏYİR" : result.direction} | Güc: ${result.strength.toFixed(0)}% | ${topVote} indikator aktiv`,
    );

    setState((prev) => ({
      ...prev,
      indicators: ind,
      signalResult: result,
      analysisStrength: result.strength,
    }));
  }, [addLog]);

  useEffect(() => {
    if (!state.activeSignal) return;
    const remaining = state.activeSignal.validUntil - Date.now();
    if (remaining <= 0) {
      const price = state.currentPrice || state.activeSignal.entryPrice;
      const success =
        state.activeSignal.direction === "BUY"
          ? price > state.activeSignal.entryPrice
          : price < state.activeSignal.entryPrice;
      const sig = state.activeSignal;
      backend
        .saveSignal(
          sig.pair,
          sig.market,
          sig.direction,
          sig.strength,
          sig.entryPrice,
          price,
          success,
          BigInt(sig.validity),
          false,
        )
        .catch(() => {});
      setState((prev) => ({ ...prev, activeSignal: null }));
      addLog(
        `${
          success ? "✅" : "❌"
        } Siqnal tamamlandı: ${state.activeSignal!.direction}`,
      );
      onSignalCompleteRef.current?.();
    }
  }, [state.activeSignal, state.currentPrice, addLog]);

  // On pair/market change: generate synthetic history immediately, then fetch real prices
  useEffect(() => {
    const cleanPair = state.currentPair.replace("_OTC", "");
    const lastKnown = basePriceRef.current[cleanPair];
    const seedPrice = getSeedPrice(cleanPair, lastKnown);
    basePriceRef.current[cleanPair] = seedPrice;

    // Generate synthetic history immediately so indicators can run right away
    const synthHistory = generatePriceHistory(seedPrice, 200);
    const synthCandles = generateCandleHistory(synthHistory);
    const immediateIndicators = calcAllIndicators(synthHistory, synthCandles);

    candleRef.current = null;

    setState((prev) => ({
      ...prev,
      isLoading: true,
      currentPrice: seedPrice,
      priceHistory: synthHistory,
      candles: synthCandles,
      indicators: immediateIndicators,
      signalResult: null,
      activeSignal: null,
      analysisStrength: 0,
    }));

    // Hide loading spinner quickly
    const seedTimer = setTimeout(() => {
      setState((prev) => ({ ...prev, isLoading: false }));
      addLog(
        `📊 ${state.currentPair.replace("_OTC", "")} ${state.currentMarket.toUpperCase()} bazarı yükləndi`,
      );
    }, 400);

    // Kick off real API fetch
    fetchPrice(state.currentPair, state.currentMarket);

    const interval = setInterval(() => {
      fetchPrice(state.currentPair, state.currentMarket);
    }, 10000);

    return () => {
      clearTimeout(seedTimer);
      clearInterval(interval);
    };
  }, [state.currentPair, state.currentMarket, fetchPrice, addLog]);

  // Run analysis every 5 seconds
  useEffect(() => {
    const interval = setInterval(analyzeMarket, 5000);
    return () => clearInterval(interval);
  }, [analyzeMarket]);

  const selectPair = useCallback(
    (pair: string, market: "real" | "otc") => {
      addLog(`📊 Cüt dəyişdi: ${pair} (${market.toUpperCase()})`);
      setState((prev) => ({
        ...prev,
        currentPair: pair,
        currentMarket: market,
      }));
    },
    [addLog],
  );

  return { state, selectPair };
}
