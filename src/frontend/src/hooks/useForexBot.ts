import { useCallback, useEffect, useRef, useState } from "react";
import { backend } from "../backendSingleton";
import type { AllIndicators, Candle } from "../utils/indicators";
import { calcAllIndicators } from "../utils/indicators";
import type { SignalResult } from "../utils/signals";
import { generateSignal } from "../utils/signals";

const TWELVE_DATA_API_KEY = "44c2051d28f84197a0b07bdb85c38a85";

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

export function useForexBot() {
  const [state, setState] = useState<BotState>({
    currentPair: "EUR/USD",
    currentMarket: "real",
    currentPrice: null,
    priceHistory: [],
    candles: [],
    indicators: null,
    signalResult: null,
    activeSignal: null,
    analysisLog: [],
    isLoading: true,
    apiConnected: false,
    analysisStrength: 0,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const candleRef = useRef<CandleBuffer | null>(null);

  const addLog = useCallback((msg: string) => {
    setState((prev) => ({
      ...prev,
      analysisLog: [
        `[${new Date().toLocaleTimeString("az-AZ")}] ${msg}`,
        ...prev.analysisLog,
      ].slice(0, 30),
    }));
  }, []);

  // Directly fetch price from Twelve Data API (bypasses slow ICP outcalls)
  const fetchPrice = useCallback(async (pair: string, market: string) => {
    const cleanPair = pair.replace("/", "").replace("_OTC", "");
    let price: number | null = null;

    try {
      const resp = await fetch(
        `https://api.twelvedata.com/price?symbol=${cleanPair}&apikey=${TWELVE_DATA_API_KEY}`,
        { signal: AbortSignal.timeout(8000) },
      );
      const data = (await resp.json()) as { price?: string; code?: number };
      if (data.price) {
        price = Number.parseFloat(data.price);
      }
    } catch {
      // Fallback: small random walk from last known price
      const last = stateRef.current.currentPrice;
      if (last) {
        price = last + (Math.random() - 0.5) * 0.0002;
      }
    }

    if (price === null) return;

    if (market === "otc") {
      price = price + Math.sin(Date.now() / 10000) * 0.0003;
    }

    setState((prev) => {
      const newHistory = [...prev.priceHistory, price!].slice(-300);
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
          open: price!,
          high: price!,
          low: price!,
          close: price!,
          volume: Math.random() * 1000 + 500,
          timestamp: minuteStart,
          startTime: minuteStart,
        };
      } else {
        candleRef.current.high = Math.max(candleRef.current.high, price!);
        candleRef.current.low = Math.min(candleRef.current.low, price!);
        candleRef.current.close = price!;
        candleRef.current.volume += Math.random() * 50;
      }

      return {
        ...prev,
        currentPrice: price!,
        priceHistory: newHistory,
        candles: newCandles,
        apiConnected: true,
        isLoading: false,
      };
    });
  }, []);

  const analyzeMarket = useCallback(() => {
    const {
      priceHistory,
      candles,
      activeSignal,
      currentPair,
      currentMarket,
      currentPrice,
    } = stateRef.current;
    if (priceHistory.length < 50 || currentPrice === null) return;

    const effectiveCandles: Candle[] =
      candles.length >= 14
        ? candles
        : Array.from({ length: 20 }, (_, i) => ({
            open: priceHistory[priceHistory.length - 20 + i] || currentPrice,
            high:
              (priceHistory[priceHistory.length - 20 + i] || currentPrice) +
              0.0005,
            low:
              (priceHistory[priceHistory.length - 20 + i] || currentPrice) -
              0.0005,
            close: priceHistory[priceHistory.length - 20 + i] || currentPrice,
            volume: 1000,
            timestamp: Date.now() - (20 - i) * 60000,
          }));

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
        `${success ? "✅" : "❌"} Siqnal tamamlandı: ${state.activeSignal!.direction}`,
      );
    }
  }, [state.activeSignal, state.currentPrice, addLog]);

  // Fetch price immediately on mount/pair change, then every 5s
  useEffect(() => {
    setState((prev) => ({ ...prev, isLoading: true, currentPrice: null }));
    fetchPrice(state.currentPair, state.currentMarket);
    const interval = setInterval(() => {
      fetchPrice(state.currentPair, state.currentMarket);
    }, 5000);
    return () => clearInterval(interval);
  }, [state.currentPair, state.currentMarket, fetchPrice]);

  useEffect(() => {
    const interval = setInterval(analyzeMarket, 5000);
    return () => clearInterval(interval);
  }, [analyzeMarket]);

  const selectPair = useCallback(
    (pair: string, market: "real" | "otc") => {
      candleRef.current = null;
      setState((prev) => ({
        ...prev,
        currentPair: pair,
        currentMarket: market,
        currentPrice: null,
        priceHistory: [],
        candles: [],
        indicators: null,
        signalResult: null,
        activeSignal: null,
        isLoading: true,
        analysisStrength: 0,
      }));
      addLog(`📊 Cüt dəyişdi: ${pair} (${market.toUpperCase()})`);
    },
    [addLog],
  );

  return { state, selectPair };
}
