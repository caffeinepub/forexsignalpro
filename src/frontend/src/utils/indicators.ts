export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

export function calcRSI(prices: number[], period = 14): number | null {
  if (prices.length < period + 1) return null;
  const slice = prices.slice(-period - 1);
  let gains = 0;
  let losses = 0;
  for (let i = 1; i < slice.length; i++) {
    const diff = slice[i] - slice[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function calcEMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

export function calcSMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  return prices.slice(-period).reduce((a, b) => a + b, 0) / period;
}

export function calcMACD(
  prices: number[],
): { macd: number; signal: number; histogram: number } | null {
  if (prices.length < 26) return null;
  const ema12 = calcEMA(prices, 12);
  const ema26 = calcEMA(prices, 26);
  if (ema12 === null || ema26 === null) return null;
  const macd = ema12 - ema26;
  const signal = macd * 0.15 + (ema12 - ema26) * 0.85;
  const histogram = macd - signal;
  return { macd, signal, histogram };
}

export function calcBollingerBands(
  prices: number[],
  period = 20,
): { upper: number; middle: number; lower: number } | null {
  const sma = calcSMA(prices, period);
  if (sma === null) return null;
  const slice = prices.slice(-period);
  const variance = slice.reduce((sum, p) => sum + (p - sma) ** 2, 0) / period;
  const stdDev = Math.sqrt(variance);
  return { upper: sma + 2 * stdDev, middle: sma, lower: sma - 2 * stdDev };
}

export function calcStochastic(
  candles: Candle[],
  period = 14,
): { k: number; d: number } | null {
  if (candles.length < period) return null;
  const slice = candles.slice(-period);
  const high = Math.max(...slice.map((c) => c.high));
  const low = Math.min(...slice.map((c) => c.low));
  const current = candles[candles.length - 1].close;
  if (high === low) return { k: 50, d: 50 };
  const k = ((current - low) / (high - low)) * 100;
  return { k, d: k };
}

export function calcATR(candles: Candle[], period = 14): number | null {
  if (candles.length < period + 1) return null;
  const trs: number[] = [];
  for (let i = candles.length - period; i < candles.length; i++) {
    const prev = candles[i - 1].close;
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - prev),
      Math.abs(candles[i].low - prev),
    );
    trs.push(tr);
  }
  return trs.reduce((a, b) => a + b, 0) / period;
}

export function calcWilliamsR(candles: Candle[], period = 14): number | null {
  if (candles.length < period) return null;
  const slice = candles.slice(-period);
  const high = Math.max(...slice.map((c) => c.high));
  const low = Math.min(...slice.map((c) => c.low));
  const current = candles[candles.length - 1].close;
  if (high === low) return -50;
  return ((high - current) / (high - low)) * -100;
}

export function calcCCI(candles: Candle[], period = 20): number | null {
  if (candles.length < period) return null;
  const slice = candles.slice(-period);
  const typicals = slice.map((c) => (c.high + c.low + c.close) / 3);
  const mean = typicals.reduce((a, b) => a + b, 0) / period;
  const meanDev =
    typicals.reduce((sum, t) => sum + Math.abs(t - mean), 0) / period;
  if (meanDev === 0) return 0;
  return (typicals[typicals.length - 1] - mean) / (0.015 * meanDev);
}

export function calcADX(candles: Candle[], period = 14): number | null {
  if (candles.length < period * 2) return null;
  const slice = candles.slice(-period * 2);
  let dmPlus = 0;
  let dmMinus = 0;
  for (let i = 1; i < slice.length; i++) {
    const upMove = slice[i].high - slice[i - 1].high;
    const downMove = slice[i - 1].low - slice[i].low;
    if (upMove > downMove && upMove > 0) dmPlus += upMove;
    if (downMove > upMove && downMove > 0) dmMinus += downMove;
  }
  const total = dmPlus + dmMinus;
  if (total === 0) return 0;
  return Math.abs((dmPlus - dmMinus) / total) * 100;
}

export function calcMomentum(prices: number[], period = 10): number | null {
  if (prices.length < period + 1) return null;
  return prices[prices.length - 1] - prices[prices.length - 1 - period];
}

export function calcVolumeAnalysis(candles: Candle[]): {
  trend: "up" | "down" | "neutral";
  ratio: number;
} {
  if (candles.length < 10) return { trend: "neutral", ratio: 1 };
  const recent = candles.slice(-5);
  const prev = candles.slice(-10, -5);
  const recentAvg = recent.reduce((sum, c) => sum + c.volume, 0) / 5;
  const prevAvg = prev.reduce((sum, c) => sum + c.volume, 0) / 5;
  const ratio = prevAvg > 0 ? recentAvg / prevAvg : 1;
  const recentBullish = recent.filter((c) => c.close > c.open).length;
  const trend = ratio > 1.2 ? (recentBullish >= 3 ? "up" : "down") : "neutral";
  return { trend, ratio };
}

export function calcFibonacciLevels(candles: Candle[]): {
  level236: number;
  level382: number;
  level500: number;
  level618: number;
  level786: number;
} | null {
  if (candles.length < 20) return null;
  const slice = candles.slice(-20);
  const high = Math.max(...slice.map((c) => c.high));
  const low = Math.min(...slice.map((c) => c.low));
  const range = high - low;
  return {
    level236: high - range * 0.236,
    level382: high - range * 0.382,
    level500: high - range * 0.5,
    level618: high - range * 0.618,
    level786: high - range * 0.786,
  };
}

export function calcSupportResistance(candles: Candle[]): {
  support: number;
  resistance: number;
} | null {
  if (candles.length < 20) return null;
  const slice = candles.slice(-20);
  const highs = slice.map((c) => c.high).sort((a, b) => b - a);
  const lows = slice.map((c) => c.low).sort((a, b) => a - b);
  return {
    resistance: highs.slice(0, 3).reduce((a, b) => a + b, 0) / 3,
    support: lows.slice(0, 3).reduce((a, b) => a + b, 0) / 3,
  };
}

export function calcTrendStrength(prices: number[]): number {
  if (prices.length < 20) return 0;
  const slice = prices.slice(-20);
  const first = slice[0];
  const last = slice[slice.length - 1];
  const change = Math.abs((last - first) / first);
  return Math.min(100, change * 10000);
}

export interface AllIndicators {
  rsi14: number | null;
  rsi21: number | null;
  macd: { macd: number; signal: number; histogram: number } | null;
  ema9: number | null;
  ema21: number | null;
  ema50: number | null;
  ema200: number | null;
  sma50: number | null;
  sma200: number | null;
  bb: { upper: number; middle: number; lower: number } | null;
  stoch: { k: number; d: number } | null;
  atr: number | null;
  williamsR: number | null;
  cci: number | null;
  adx: number | null;
  momentum: number | null;
  volume: { trend: "up" | "down" | "neutral"; ratio: number };
  fibonacci: {
    level236: number;
    level382: number;
    level500: number;
    level618: number;
    level786: number;
  } | null;
  sr: { support: number; resistance: number } | null;
  trendStrength: number;
}

export function calcAllIndicators(
  prices: number[],
  candles: Candle[],
): AllIndicators {
  return {
    rsi14: calcRSI(prices, 14),
    rsi21: calcRSI(prices, 21),
    macd: calcMACD(prices),
    ema9: calcEMA(prices, 9),
    ema21: calcEMA(prices, 21),
    ema50: calcEMA(prices, 50),
    ema200: calcEMA(prices, 200),
    sma50: calcSMA(prices, 50),
    sma200: calcSMA(prices, 200),
    bb: calcBollingerBands(prices, 20),
    stoch: calcStochastic(candles, 14),
    atr: calcATR(candles, 14),
    williamsR: calcWilliamsR(candles, 14),
    cci: calcCCI(candles, 20),
    adx: calcADX(candles, 14),
    momentum: calcMomentum(prices, 10),
    volume: calcVolumeAnalysis(candles),
    fibonacci: calcFibonacciLevels(candles),
    sr: calcSupportResistance(candles),
    trendStrength: calcTrendStrength(prices),
  };
}
