import type { AllIndicators } from "../utils/indicators";
import type { SignalResult, VoteDetail } from "../utils/signals";

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

interface VolumePressureBlockProps {
  volumeConfirmation: SignalResult["volumeConfirmation"] | null;
  buyPct: number;
  sellPct: number;
  isHigh: boolean;
}

function VolumePressureBlock({
  volumeConfirmation,
  buyPct,
  sellPct,
  isHigh,
}: VolumePressureBlockProps) {
  const status = volumeConfirmation?.status ?? "NEUTRAL";
  const statusColor =
    status === "CONFIRMS"
      ? "#00ff88"
      : status === "CONTRADICTS"
        ? "#ff1744"
        : status === "WEAK"
          ? "#ffd700"
          : "#8b92a8";
  const statusBg =
    status === "CONFIRMS"
      ? "rgba(0,255,136,0.06)"
      : status === "CONTRADICTS"
        ? "rgba(255,23,68,0.06)"
        : "rgba(255,255,255,0.02)";
  const label = volumeConfirmation?.label ?? "Volume: neytral";

  return (
    <div
      className="col-span-3 rounded-lg p-3 mt-1"
      style={{
        background: statusBg,
        border: `1px solid ${statusColor}33`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[9px] uppercase tracking-widest font-bold"
          style={{ color: "#8b92a8" }}
        >
          Volume Baskı Analızı
        </span>
        {isHigh && (
          <span
            className="text-[8px] font-bold px-1.5 py-0.5 rounded"
            style={{
              color: "#ffd700",
              backgroundColor: "rgba(255,215,0,0.15)",
              border: "1px solid rgba(255,215,0,0.3)",
            }}
          >
            YÜKSƎK VOLUME
          </span>
        )}
      </div>

      {/* Buy/Sell pressure bar */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-[9px] w-8 text-right"
          style={{ color: "#00ff88" }}
        >
          {buyPct}%
        </span>
        <div
          className="flex-1 h-3 rounded-full overflow-hidden flex"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${buyPct}%`,
              background: "linear-gradient(90deg, #00ff88, #00cc6a)",
              borderRadius: buyPct < 100 ? "9999px 0 0 9999px" : "9999px",
              boxShadow: buyPct >= 55 ? "0 0 6px rgba(0,255,136,0.5)" : "none",
            }}
          />
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${sellPct}%`,
              background: "linear-gradient(90deg, #cc1133, #ff1744)",
              borderRadius: sellPct < 100 ? "0 9999px 9999px 0" : "9999px",
              boxShadow: sellPct >= 55 ? "0 0 6px rgba(255,23,68,0.5)" : "none",
            }}
          />
        </div>
        <span className="text-[9px] w-8" style={{ color: "#ff1744" }}>
          {sellPct}%
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[9px]" style={{ color: "#8b92a8" }}>
            Alış baskısı:
          </span>
          <span
            className="text-[10px] font-bold"
            style={{
              color: "#00ff88",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {buyPct}%
          </span>
          <span className="text-[9px]" style={{ color: "#8b92a8" }}>
            Satış baskısı:
          </span>
          <span
            className="text-[10px] font-bold"
            style={{
              color: "#ff1744",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {sellPct}%
          </span>
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded"
          style={{
            color: statusColor,
            backgroundColor: `${statusColor}22`,
            border: `1px solid ${statusColor}44`,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

interface IndicatorPanelProps {
  indicators: AllIndicators | null;
  votes: VoteDetail[];
  signalResult: SignalResult | null;
}

export default function IndicatorPanel({
  indicators: ind,
  votes,
  signalResult,
}: IndicatorPanelProps) {
  const getVote = (name: string): "BUY" | "SELL" | "NEUTRAL" | null => {
    const found = votes.find((v) => v.indicator === name);
    return found ? found.vote : null;
  };

  const fmt = (v: number | null | undefined, decimals = 5) =>
    v === null || v === undefined ? "--" : v.toFixed(decimals);

  const vp = ind?.volumePressure;
  const buyPct = vp ? Math.round(vp.buyRatio * 100) : 50;
  const sellPct = vp ? Math.round(vp.sellRatio * 100) : 50;

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
        <IndicatorCard
          name="Vol Pressure"
          value={vp ? `${Math.round(vp.dominanceStrength)}%` : "--"}
          vote={getVote("Vol Pressure")}
          sub={
            vp
              ? vp.dominance === "BUY"
                ? "Alış hökmüran"
                : vp.dominance === "SELL"
                  ? "Satış hökmüran"
                  : "Neytral"
              : undefined
          }
        />

        {/* Volume Pressure detail block spanning full 3 columns */}
        <VolumePressureBlock
          volumeConfirmation={signalResult?.volumeConfirmation ?? null}
          buyPct={buyPct}
          sellPct={sellPct}
          isHigh={vp?.volumeIsHigh ?? false}
        />
      </div>
    </div>
  );
}
