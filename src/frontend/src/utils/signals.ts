import type { AllIndicators, Candle } from "./indicators";

export interface VoteDetail {
  indicator: string;
  vote: "BUY" | "SELL" | "NEUTRAL";
  weight: number;
  points: number;
  reason: string;
}

export interface SignalResult {
  direction: "BUY" | "SELL" | "WAIT";
  strength: number;
  reasons: string[];
  votes: VoteDetail[];
  buyScore: number;
  sellScore: number;
}

const MAX_SCORE = 175;

export function generateSignal(
  ind: AllIndicators,
  price: number,
  _candles: Candle[],
): SignalResult {
  const votes: VoteDetail[] = [];
  let buyScore = 0;
  let sellScore = 0;

  if (ind.rsi14 !== null) {
    if (ind.rsi14 < 25) {
      const pts = ind.rsi14 < 20 ? 25 : 20;
      votes.push({
        indicator: "RSI(14)",
        vote: "BUY",
        weight: 20,
        points: pts,
        reason: `RSI ${ind.rsi14.toFixed(1)} oversold`,
      });
      buyScore += pts;
    } else if (ind.rsi14 > 75) {
      const pts = ind.rsi14 > 80 ? 25 : 20;
      votes.push({
        indicator: "RSI(14)",
        vote: "SELL",
        weight: 20,
        points: pts,
        reason: `RSI ${ind.rsi14.toFixed(1)} overbought`,
      });
      sellScore += pts;
    } else {
      votes.push({
        indicator: "RSI(14)",
        vote: "NEUTRAL",
        weight: 20,
        points: 0,
        reason: `RSI ${ind.rsi14.toFixed(1)} neutral`,
      });
    }
  }

  if (ind.rsi21 !== null) {
    if (ind.rsi21 < 30) {
      votes.push({
        indicator: "RSI(21)",
        vote: "BUY",
        weight: 10,
        points: 10,
        reason: `RSI21 ${ind.rsi21.toFixed(1)} oversold`,
      });
      buyScore += 10;
    } else if (ind.rsi21 > 70) {
      votes.push({
        indicator: "RSI(21)",
        vote: "SELL",
        weight: 10,
        points: 10,
        reason: `RSI21 ${ind.rsi21.toFixed(1)} overbought`,
      });
      sellScore += 10;
    } else {
      votes.push({
        indicator: "RSI(21)",
        vote: "NEUTRAL",
        weight: 10,
        points: 0,
        reason: `RSI21 ${ind.rsi21.toFixed(1)} neutral`,
      });
    }
  }

  if (ind.macd !== null) {
    if (ind.macd.macd > 0 && ind.macd.histogram > 0) {
      votes.push({
        indicator: "MACD",
        vote: "BUY",
        weight: 20,
        points: 20,
        reason: `MACD bullish hist ${ind.macd.histogram.toFixed(5)}`,
      });
      buyScore += 20;
    } else if (ind.macd.macd < 0 && ind.macd.histogram < 0) {
      votes.push({
        indicator: "MACD",
        vote: "SELL",
        weight: 20,
        points: 20,
        reason: `MACD bearish hist ${ind.macd.histogram.toFixed(5)}`,
      });
      sellScore += 20;
    } else {
      votes.push({
        indicator: "MACD",
        vote: "NEUTRAL",
        weight: 20,
        points: 0,
        reason: "MACD crossing",
      });
    }
  }

  if (ind.bb !== null) {
    if (price < ind.bb.lower) {
      votes.push({
        indicator: "BB Bands",
        vote: "BUY",
        weight: 15,
        points: 15,
        reason: "Price below lower band",
      });
      buyScore += 15;
    } else if (price > ind.bb.upper) {
      votes.push({
        indicator: "BB Bands",
        vote: "SELL",
        weight: 15,
        points: 15,
        reason: "Price above upper band",
      });
      sellScore += 15;
    } else {
      votes.push({
        indicator: "BB Bands",
        vote: "NEUTRAL",
        weight: 15,
        points: 0,
        reason: "Price inside bands",
      });
    }
  }

  if (ind.stoch !== null) {
    if (ind.stoch.k < 20) {
      votes.push({
        indicator: "Stochastic",
        vote: "BUY",
        weight: 15,
        points: 15,
        reason: `Stoch K ${ind.stoch.k.toFixed(1)} oversold`,
      });
      buyScore += 15;
    } else if (ind.stoch.k > 80) {
      votes.push({
        indicator: "Stochastic",
        vote: "SELL",
        weight: 15,
        points: 15,
        reason: `Stoch K ${ind.stoch.k.toFixed(1)} overbought`,
      });
      sellScore += 15;
    } else {
      votes.push({
        indicator: "Stochastic",
        vote: "NEUTRAL",
        weight: 15,
        points: 0,
        reason: `Stoch K ${ind.stoch.k.toFixed(1)} neutral`,
      });
    }
  }

  if (ind.ema9 !== null && ind.ema21 !== null) {
    if (ind.ema9 > ind.ema21) {
      votes.push({
        indicator: "EMA(9/21)",
        vote: "BUY",
        weight: 15,
        points: 15,
        reason: "EMA9 above EMA21",
      });
      buyScore += 15;
    } else {
      votes.push({
        indicator: "EMA(9/21)",
        vote: "SELL",
        weight: 15,
        points: 15,
        reason: "EMA9 below EMA21",
      });
      sellScore += 15;
    }
  }

  if (ind.sma50 !== null && ind.sma200 !== null) {
    if (ind.sma50 > ind.sma200) {
      votes.push({
        indicator: "SMA(50/200)",
        vote: "BUY",
        weight: 15,
        points: 15,
        reason: "Golden cross",
      });
      buyScore += 15;
    } else {
      votes.push({
        indicator: "SMA(50/200)",
        vote: "SELL",
        weight: 15,
        points: 15,
        reason: "Death cross",
      });
      sellScore += 15;
    }
  }

  if (ind.williamsR !== null) {
    if (ind.williamsR < -80) {
      votes.push({
        indicator: "Williams %R",
        vote: "BUY",
        weight: 10,
        points: 10,
        reason: `W%R ${ind.williamsR.toFixed(1)} oversold`,
      });
      buyScore += 10;
    } else if (ind.williamsR > -20) {
      votes.push({
        indicator: "Williams %R",
        vote: "SELL",
        weight: 10,
        points: 10,
        reason: `W%R ${ind.williamsR.toFixed(1)} overbought`,
      });
      sellScore += 10;
    } else {
      votes.push({
        indicator: "Williams %R",
        vote: "NEUTRAL",
        weight: 10,
        points: 0,
        reason: `W%R ${ind.williamsR.toFixed(1)} neutral`,
      });
    }
  }

  if (ind.cci !== null) {
    if (ind.cci < -100) {
      votes.push({
        indicator: "CCI",
        vote: "BUY",
        weight: 10,
        points: 10,
        reason: `CCI ${ind.cci.toFixed(1)} oversold`,
      });
      buyScore += 10;
    } else if (ind.cci > 100) {
      votes.push({
        indicator: "CCI",
        vote: "SELL",
        weight: 10,
        points: 10,
        reason: `CCI ${ind.cci.toFixed(1)} overbought`,
      });
      sellScore += 10;
    } else {
      votes.push({
        indicator: "CCI",
        vote: "NEUTRAL",
        weight: 10,
        points: 0,
        reason: `CCI ${ind.cci.toFixed(1)} neutral`,
      });
    }
  }

  if (ind.adx !== null && ind.adx > 25) {
    const trendDir = buyScore > sellScore ? "BUY" : "SELL";
    votes.push({
      indicator: "ADX",
      vote: trendDir,
      weight: 10,
      points: 10,
      reason: `ADX ${ind.adx.toFixed(1)} strong trend`,
    });
    if (trendDir === "BUY") buyScore += 10;
    else sellScore += 10;
  } else if (ind.adx !== null) {
    votes.push({
      indicator: "ADX",
      vote: "NEUTRAL",
      weight: 10,
      points: 0,
      reason: `ADX ${ind.adx.toFixed(1)} weak trend`,
    });
  }

  if (ind.momentum !== null) {
    if (ind.momentum > 0) {
      votes.push({
        indicator: "Momentum",
        vote: "BUY",
        weight: 10,
        points: 10,
        reason: `Momentum +${ind.momentum.toFixed(5)}`,
      });
      buyScore += 10;
    } else if (ind.momentum < 0) {
      votes.push({
        indicator: "Momentum",
        vote: "SELL",
        weight: 10,
        points: 10,
        reason: `Momentum ${ind.momentum.toFixed(5)}`,
      });
      sellScore += 10;
    } else {
      votes.push({
        indicator: "Momentum",
        vote: "NEUTRAL",
        weight: 10,
        points: 0,
        reason: "Momentum neutral",
      });
    }
  }

  if (ind.volume.trend === "up") {
    votes.push({
      indicator: "Volume",
      vote: "BUY",
      weight: 5,
      points: 5,
      reason: `Volume surge bullish ${ind.volume.ratio.toFixed(2)}x`,
    });
    buyScore += 5;
  } else if (ind.volume.trend === "down") {
    votes.push({
      indicator: "Volume",
      vote: "SELL",
      weight: 5,
      points: 5,
      reason: `Volume surge bearish ${ind.volume.ratio.toFixed(2)}x`,
    });
    sellScore += 5;
  } else {
    votes.push({
      indicator: "Volume",
      vote: "NEUTRAL",
      weight: 5,
      points: 0,
      reason: "Volume normal",
    });
  }

  if (ind.trendStrength > 30) {
    const trendDir = buyScore > sellScore ? "BUY" : "SELL";
    votes.push({
      indicator: "Trend",
      vote: trendDir,
      weight: 10,
      points: 10,
      reason: `Trend strength ${ind.trendStrength.toFixed(1)}`,
    });
    if (trendDir === "BUY") buyScore += 10;
    else sellScore += 10;
  } else {
    votes.push({
      indicator: "Trend",
      vote: "NEUTRAL",
      weight: 10,
      points: 0,
      reason: `Trend weak ${ind.trendStrength.toFixed(1)}`,
    });
  }

  if (ind.sr !== null) {
    const distToSupport = Math.abs(price - ind.sr.support) / price;
    const distToResistance = Math.abs(price - ind.sr.resistance) / price;
    if (distToSupport < 0.002) {
      votes.push({
        indicator: "S/R Zones",
        vote: "BUY",
        weight: 10,
        points: 10,
        reason: `Near support ${ind.sr.support.toFixed(5)}`,
      });
      buyScore += 10;
    } else if (distToResistance < 0.002) {
      votes.push({
        indicator: "S/R Zones",
        vote: "SELL",
        weight: 10,
        points: 10,
        reason: `Near resistance ${ind.sr.resistance.toFixed(5)}`,
      });
      sellScore += 10;
    } else {
      votes.push({
        indicator: "S/R Zones",
        vote: "NEUTRAL",
        weight: 10,
        points: 0,
        reason: "Between S/R levels",
      });
    }
  }

  if (ind.atr !== null) {
    const atrPercent = (ind.atr / price) * 100;
    if (atrPercent > 0.05) {
      const trendDir = buyScore > sellScore ? "BUY" : "SELL";
      votes.push({
        indicator: "ATR",
        vote: trendDir,
        weight: 5,
        points: 5,
        reason: `High volatility ${atrPercent.toFixed(3)}%`,
      });
      if (trendDir === "BUY") buyScore += 5;
      else sellScore += 5;
    } else {
      votes.push({
        indicator: "ATR",
        vote: "NEUTRAL",
        weight: 5,
        points: 0,
        reason: "Low volatility",
      });
    }
  }

  const maxScore = Math.max(buyScore, sellScore);
  const strength = Math.min(98, (maxScore / MAX_SCORE) * 100);
  const direction: "BUY" | "SELL" = buyScore > sellScore ? "BUY" : "SELL";

  const rsiConfirms =
    ind.rsi14 !== null &&
    ((direction === "BUY" && ind.rsi14 < 50) ||
      (direction === "SELL" && ind.rsi14 > 50));
  const macdConfirms =
    ind.macd !== null &&
    ((direction === "BUY" && ind.macd.macd > 0) ||
      (direction === "SELL" && ind.macd.macd < 0));

  const reasons = votes
    .filter((v) => v.vote !== "NEUTRAL")
    .map((v) => v.reason);

  if (strength >= 80 && rsiConfirms && macdConfirms) {
    return { direction, strength, reasons, votes, buyScore, sellScore };
  }

  return { direction: "WAIT", strength, reasons, votes, buyScore, sellScore };
}
