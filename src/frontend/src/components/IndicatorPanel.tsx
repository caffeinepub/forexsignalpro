import type { AllIndicators } from "../utils/indicators";
import type { VoteDetail } from "../utils/signals";

interface IndicatorCardProps {
  name: string;
  value: string;
  vote: "BUY" | "SELL" | "NEUTRAL" | null;
  sub?: string;
}

function IndicatorCard({ name, value, vote, sub }: IndicatorCardProps) {
  const voteColor =
    vote === "BUY" ? "#00ff88" : vote === "SELL" ? "#ff1744" : "#8b92a8";
  const borderColor =
    vote === "BUY"
      ? "rgba(0,255,136,0.5)"
      : vote === "SELL"
        ? "rgba(255,23,68,0.5)"
        : "rgba(255,255,255,0.06)";
  const bgColor =
    vote === "BUY"
      ? "rgba(0,255,136,0.04)"
      : vote === "SELL"
        ? "rgba(255,23,68,0.04)"
        : "transparent";

  return (
    <div
      className="rounded-md p-2 flex flex-col gap-0.5 relative overflow-hidden"
      style={{
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderBottom: `2px solid ${voteColor}`,
      }}
    >
      <span
        className="text-[9px] uppercase tracking-widest"
        style={{ color: "#8b92a8" }}
      >
        {name}
      </span>
      <span
        className="text-sm font-bold leading-tight"
        style={{ color: "#e2e8f0", fontFamily: "'JetBrains Mono', monospace" }}
      >
        {value}
      </span>
      {sub && (
        <span
          className="text-[9px]"
          style={{
            color: "#6b7280",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {sub}
        </span>
      )}
      {vote && vote !== "NEUTRAL" && (
        <span
          className="absolute top-1.5 right-1.5 text-[8px] font-bold px-1 py-0.5 rounded"
          style={{ color: voteColor, backgroundColor: `${voteColor}22` }}
        >
          {vote}
        </span>
      )}
    </div>
  );
}

interface IndicatorPanelProps {
  indicators: AllIndicators | null;
  votes: VoteDetail[];
}

export default function IndicatorPanel({
  indicators: ind,
  votes,
}: IndicatorPanelProps) {
  const getVote = (name: string): "BUY" | "SELL" | "NEUTRAL" | null => {
    const found = votes.find((v) => v.indicator === name);
    return found ? found.vote : null;
  };

  const fmt = (v: number | null | undefined, decimals = 5) =>
    v === null || v === undefined ? "--" : v.toFixed(decimals);

  return (
    <div className="w-full" data-ocid="indicator_panel.panel">
      <div className="grid grid-cols-3 gap-1.5">
        <IndicatorCard
          name="RSI (14)"
          value={fmt(ind?.rsi14, 1)}
          vote={getVote("RSI(14)")}
          sub={
            ind?.rsi14
              ? ind.rsi14 < 30
                ? "Oversold"
                : ind.rsi14 > 70
                  ? "Overbought"
                  : "Neutral"
              : undefined
          }
        />
        <IndicatorCard
          name="RSI (21)"
          value={fmt(ind?.rsi21, 1)}
          vote={getVote("RSI(21)")}
        />
        <IndicatorCard
          name="MACD"
          value={ind?.macd ? ind.macd.macd.toFixed(5) : "--"}
          vote={getVote("MACD")}
          sub={ind?.macd ? `H: ${ind.macd.histogram.toFixed(5)}` : undefined}
        />
        <IndicatorCard
          name="EMA (9)"
          value={fmt(ind?.ema9)}
          vote={getVote("EMA(9/21)")}
        />
        <IndicatorCard
          name="EMA (21)"
          value={fmt(ind?.ema21)}
          vote={getVote("EMA(9/21)")}
        />
        <IndicatorCard name="EMA (50)" value={fmt(ind?.ema50)} vote={null} />
        <IndicatorCard
          name="SMA (50)"
          value={fmt(ind?.sma50)}
          vote={getVote("SMA(50/200)")}
        />
        <IndicatorCard
          name="SMA (200)"
          value={fmt(ind?.sma200)}
          vote={getVote("SMA(50/200)")}
        />
        <IndicatorCard
          name="BB Upper"
          value={fmt(ind?.bb?.upper)}
          vote={getVote("BB Bands")}
        />
        <IndicatorCard
          name="BB Lower"
          value={fmt(ind?.bb?.lower)}
          vote={getVote("BB Bands")}
        />
        <IndicatorCard
          name="Stoch K"
          value={ind?.stoch ? ind.stoch.k.toFixed(1) : "--"}
          vote={getVote("Stochastic")}
          sub={
            ind?.stoch
              ? ind.stoch.k < 20
                ? "Oversold"
                : ind.stoch.k > 80
                  ? "Overbought"
                  : "Neutral"
              : undefined
          }
        />
        <IndicatorCard name="ATR" value={fmt(ind?.atr)} vote={getVote("ATR")} />
        <IndicatorCard
          name="Williams %R"
          value={fmt(ind?.williamsR, 1)}
          vote={getVote("Williams %R")}
        />
        <IndicatorCard
          name="CCI"
          value={fmt(ind?.cci, 1)}
          vote={getVote("CCI")}
        />
        <IndicatorCard
          name="ADX"
          value={fmt(ind?.adx, 1)}
          vote={getVote("ADX")}
          sub={
            ind?.adx !== null && ind?.adx !== undefined
              ? ind.adx > 25
                ? "Strong"
                : "Weak"
              : undefined
          }
        />
        <IndicatorCard
          name="Momentum"
          value={
            ind?.momentum !== null && ind?.momentum !== undefined
              ? `${ind.momentum >= 0 ? "+" : ""}${ind.momentum.toFixed(5)}`
              : "--"
          }
          vote={getVote("Momentum")}
        />
        <IndicatorCard
          name="Volume"
          value={ind?.volume ? `${ind.volume.ratio.toFixed(2)}x` : "--"}
          vote={getVote("Volume")}
          sub={
            ind?.volume
              ? ind.volume.trend === "up"
                ? "Bullish"
                : ind.volume.trend === "down"
                  ? "Bearish"
                  : "Normal"
              : undefined
          }
        />
        <IndicatorCard
          name="Trend"
          value={
            ind?.trendStrength !== undefined
              ? ind.trendStrength.toFixed(1)
              : "--"
          }
          vote={getVote("Trend")}
          sub={
            ind?.trendStrength !== undefined
              ? ind.trendStrength > 50
                ? "Strong"
                : ind.trendStrength > 30
                  ? "Medium"
                  : "Weak"
              : undefined
          }
        />
      </div>
    </div>
  );
}
