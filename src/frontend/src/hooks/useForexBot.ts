import { useCallback, useEffect, useRef, useState } from "react";
import { backend } from "../backendSingleton";
import type { AllIndicators, Candle } from "../utils/indicators";
import { calcAllIndicators } from "../utils/indicators";
import type { SignalResult } from "../utils/signals";
import { generateSignal } from "../utils/signals";

export const REAL_PAIRS = [
  "EUR/USD",
  "GBP/USD",
  "GBP/JPY",
  "USD/JPY",
  "AUD/USD",
  "EUR/GBP",
  "USD/CAD",
  "NZD/USD",
];

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
  currentPrice: number | null;
  candles: Candle[];
  indicators: AllIndicators | null;
  signalResult: SignalResult | null;
  activeSignal: ActiveSignal | null;
  analysisLog: string[];
  isLoading: boolean;
  loadError: string | null;
  apiConnected: boolean;
  analysisStrength: number;
}

interface TwelveDataCandle {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

interface TwelveDataResponse {
  values?: TwelveDataCandle[];
  code?: number;
  message?: string;
  status?: string;
}

function parseTwelveDataResponse(raw: string): {
  candles: Candle[];
  error: string | null;
} {
  let parsed: TwelveDataResponse;
  try {
    parsed = JSON.parse(raw) as TwelveDataResponse;
  } catch {
    return { candles: [], error: "JSON parse xətası" };
  }

  // Check for API error response
  if (parsed.code !== undefined && parsed.code !== 200) {
    return {
      candles: [],
      error: parsed.message ?? `API xətası: kod ${parsed.code}`,
    };
  }
  if (parsed.status === "error") {
    return { candles: [], error: parsed.message ?? "API xətası" };
  }

  if (!parsed.values || parsed.values.length === 0) {
    return { candles: [], error: "Məlumat boşdur" };
  }

  // Twelve Data returns newest-first, reverse for chronological order
  const reversed = [...parsed.values].reverse();

  const candles: Candle[] = reversed.map((v) => ({
    open: Number.parseFloat(v.open),
    high: Number.parseFloat(v.high),
    low: Number.parseFloat(v.low),
    close: Number.parseFloat(v.close),
    volume: Number.parseFloat(v.volume) || 0,
    timestamp: new Date(v.datetime).getTime(),
  }));

  return { candles, error: null };
}

export function useForexBot(onSignalComplete?: () => void) {
  const onSignalCompleteRef = useRef(onSignalComplete);
  onSignalCompleteRef.current = onSignalComplete;

  const [state, setState] = useState<BotState>({
    currentPair: "EUR/USD",
    currentPrice: null,
    candles: [],
    indicators: null,
    signalResult: null,
    activeSignal: null,
    analysisLog: ["[Başladı] Real M1 məlumatları yüklənir..."],
    isLoading: true,
    loadError: null,
    apiConnected: false,
    analysisStrength: 0,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const lastCandleDatetimeRef = useRef<string | null>(null);
  const fetchingRef = useRef(false);

  const addLog = useCallback((msg: string) => {
    setState((prev) => ({
      ...prev,
      analysisLog: [
        `[${new Date().toLocaleTimeString("az-AZ")}] ${msg}`,
        ...prev.analysisLog,
      ].slice(0, 100),
    }));
  }, []);

  // Fetch candles from backend and update state
  const fetchCandles = useCallback(
    async (pair: string, isInitial: boolean) => {
      if (fetchingRef.current && !isInitial) return;
      fetchingRef.current = true;

      try {
        addLog(
          isInitial
            ? `📡 ${pair} üçün M1 məlumatları yüklənir...`
            : `🔄 ${pair} yenilənir...`,
        );

        const raw = await backend.getForexCandles(pair, "1min");
        const { candles, error } = parseTwelveDataResponse(raw);

        if (error) {
          addLog(`❌ API xətası: ${error}`);
          if (isInitial) {
            setState((prev) => ({
              ...prev,
              isLoading: false,
              loadError: error,
              apiConnected: false,
            }));
          }
          return;
        }

        if (candles.length === 0) {
          if (isInitial) {
            setState((prev) => ({
              ...prev,
              isLoading: false,
              loadError: "Heç bir məlumat gəlmədi",
              apiConnected: false,
            }));
          }
          return;
        }

        // Check if we have new candles (for periodic refresh)
        const newestDatetime = new Date(
          candles[candles.length - 1].timestamp,
        ).toISOString();
        if (!isInitial && lastCandleDatetimeRef.current === newestDatetime) {
          // No new candle yet, still update the current price from last close
          addLog("⏳ Yeni mum gözlənilir...");
          fetchingRef.current = false;
          return;
        }

        lastCandleDatetimeRef.current = newestDatetime;

        const closes = candles.map((c) => c.close);
        const currentPrice = closes[closes.length - 1];
        const ind = calcAllIndicators(closes, candles);

        setState((prev) => ({
          ...prev,
          currentPrice,
          candles,
          indicators: ind,
          isLoading: false,
          loadError: null,
          apiConnected: true,
        }));

        addLog(
          `✅ ${pair} yükləndi: ${currentPrice.toFixed(5)} (${candles.length} mum)`,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Bilinməyən xəta";
        addLog(`❌ Şəbəkə xətası: ${msg}`);
        if (isInitial) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            loadError: msg,
            apiConnected: false,
          }));
        }
      } finally {
        fetchingRef.current = false;
      }
    },
    [addLog],
  );

  const analyzeMarket = useCallback(() => {
    const { candles, activeSignal, currentPair, currentPrice, indicators } =
      stateRef.current;

    if (currentPrice === null || candles.length < 20) return;
    if (!indicators) return;

    const closes = candles.map((c) => c.close);
    const result = generateSignal(indicators, currentPrice, candles);

    // Check active signal for reversal
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

    // Emit new signal if no active signal and strong enough
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
        market: "real",
        reversed: false,
      };

      setState((prev) => ({
        ...prev,
        activeSignal: newSignal,
        signalResult: result,
        analysisStrength: result.strength,
      }));

      addLog(
        `🎯 SİQNAL: ${
          result.direction === "BUY" ? "1 dəq AL" : "1 dəq SAT"
        } @ ${currentPrice.toFixed(5)} - ${result.strength.toFixed(0)}% güc`,
      );
      return;
    }

    const topVote = result.votes.filter((v) => v.vote !== "NEUTRAL").length;
    addLog(
      `📊 Analiz: ${result.direction === "WAIT" ? "GÖZLƏYİR" : result.direction} | Güc: ${result.strength.toFixed(
        0,
      )}% | ${topVote} indikator aktiv`,
    );

    // Re-calc indicators with latest closes in case price changed between fetches
    const freshInd = calcAllIndicators(closes, candles);
    setState((prev) => ({
      ...prev,
      indicators: freshInd,
      signalResult: result,
      analysisStrength: result.strength,
    }));
  }, [addLog]);

  // Watch active signal for expiry
  useEffect(() => {
    if (!state.activeSignal) return;
    const remaining = state.activeSignal.validUntil - Date.now();
    if (remaining <= 0) {
      const price = state.currentPrice ?? state.activeSignal.entryPrice;
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
        } Siqnal tamamlandı: ${state.activeSignal.direction}`,
      );
      onSignalCompleteRef.current?.();
    }
  }, [state.activeSignal, state.currentPrice, addLog]);

  // On pair change: reset state and fetch fresh candles
  useEffect(() => {
    lastCandleDatetimeRef.current = null;
    fetchingRef.current = false;

    setState((prev) => ({
      ...prev,
      isLoading: true,
      loadError: null,
      currentPrice: null,
      candles: [],
      indicators: null,
      signalResult: null,
      activeSignal: null,
      analysisStrength: 0,
      apiConnected: false,
    }));

    fetchCandles(state.currentPair, true);

    // Refresh every 60 seconds (within Twelve Data free plan limit)
    const interval = setInterval(() => {
      fetchCandles(state.currentPair, false);
    }, 60000);

    return () => clearInterval(interval);
  }, [state.currentPair, fetchCandles]);

  // Analyze every 10 seconds (once we have data)
  useEffect(() => {
    const interval = setInterval(analyzeMarket, 10000);
    return () => clearInterval(interval);
  }, [analyzeMarket]);

  const selectPair = useCallback(
    (pair: string) => {
      if (pair === stateRef.current.currentPair) return;
      addLog(`📊 Cüt dəyişdi: ${pair}`);
      setState((prev) => ({ ...prev, currentPair: pair }));
    },
    [addLog],
  );

  return { state, selectPair };
}
