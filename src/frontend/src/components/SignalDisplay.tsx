import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { ActiveSignal } from "../hooks/useForexBot";
import type { SignalResult } from "../utils/signals";

interface SignalDisplayProps {
  activeSignal: ActiveSignal | null;
  signalResult: SignalResult | null;
  analysisStrength: number;
  currentPrice: number | null;
}

function CountdownTimer({ validUntil }: { validUntil: number }) {
  const [remaining, setRemaining] = useState(
    Math.max(0, validUntil - Date.now()),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.max(0, validUntil - Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [validUntil]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const isUrgent = remaining < 60000;

  return (
    <span
      style={{
        color: isUrgent ? "#ff1744" : "#ffd700",
        fontFamily: "'JetBrains Mono', monospace",
      }}
      className="text-2xl font-bold tabular-nums"
    >
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </span>
  );
}

export default function SignalDisplay({
  activeSignal,
  signalResult,
  analysisStrength,
  currentPrice,
}: SignalDisplayProps) {
  const isBuy = activeSignal?.direction === "BUY";
  const isSell = activeSignal?.direction === "SELL";

  const signalColor = isBuy ? "#00ff88" : isSell ? "#ff1744" : "#ffd700";
  const glowAnimation = isBuy
    ? "pulse-green 2s ease-in-out infinite"
    : isSell
      ? "pulse-red 2s ease-in-out infinite"
      : "none";

  const signalLabel = isBuy ? "1 dəq AL" : isSell ? "1 dəq SAT" : "";

  // Volume confirmation from current signal result
  const vc = signalResult?.volumeConfirmation;
  const vcColor =
    vc?.status === "CONFIRMS"
      ? "#00ff88"
      : vc?.status === "CONTRADICTS"
        ? "#ff1744"
        : vc?.status === "WEAK"
          ? "#ffd700"
          : "#8b92a8";

  return (
    <div className="w-full" data-ocid="signal.panel">
      <AnimatePresence mode="wait">
        {activeSignal ? (
          <motion.div
            key="active-signal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl p-6"
            style={{
              background: isBuy
                ? "linear-gradient(135deg, rgba(0,255,136,0.08) 0%, rgba(0,20,10,0) 100%)"
                : "linear-gradient(135deg, rgba(255,23,68,0.08) 0%, rgba(20,0,0,0) 100%)",
              border: `1px solid ${signalColor}33`,
              animation: glowAnimation,
            }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col items-center md:items-start gap-2">
                <div className="flex items-center gap-3">
                  <span
                    className="text-5xl font-black tracking-tight"
                    style={{
                      color: signalColor,
                      textShadow: `0 0 30px ${signalColor}66`,
                    }}
                  >
                    &#x25cf;
                  </span>
                  <span
                    className="text-4xl font-black tracking-wider"
                    style={{
                      color: signalColor,
                      textShadow: `0 0 30px ${signalColor}66`,
                    }}
                    data-ocid={`signal.${activeSignal.direction.toLowerCase()}_button`}
                  >
                    {signalLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: "#8b92a8" }}>
                    Cüt:
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{
                      color: "#c8d0e0",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {activeSignal.pair}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: "rgba(0,212,255,0.15)",
                      color: "#00d4ff",
                      border: "1px solid #00d4ff33",
                    }}
                  >
                    REAL M1
                  </span>
                </div>

                {/* Volume confirmation badge */}
                {vc && (
                  <div
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md"
                    style={{
                      backgroundColor: `${vcColor}15`,
                      border: `1px solid ${vcColor}44`,
                    }}
                  >
                    <span
                      style={{ color: vcColor, fontSize: 10, fontWeight: 700 }}
                    >
                      {vc.status === "CONFIRMS"
                        ? "\u2714"
                        : vc.status === "CONTRADICTS"
                          ? "\u26a0"
                          : "\u25cb"}
                    </span>
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: vcColor }}
                    >
                      {vc.label}
                    </span>
                    {vc.isHigh && (
                      <span
                        className="text-[8px] font-bold px-1 rounded"
                        style={{
                          color: "#ffd700",
                          backgroundColor: "rgba(255,215,0,0.15)",
                        }}
                      >
                        YÜKSƎK
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-2">
                <span
                  className="text-xs uppercase tracking-widest"
                  style={{ color: "#8b92a8" }}
                >
                  Siqnal Gücü
                </span>
                <div className="relative w-32 h-32">
                  <svg
                    viewBox="0 0 120 120"
                    className="w-full h-full -rotate-90"
                    role="img"
                    aria-label="Signal strength gauge"
                  >
                    <title>Signal Strength Gauge</title>
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke={signalColor}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(activeSignal.strength / 100) * 314} 314`}
                      style={{ filter: `drop-shadow(0 0 6px ${signalColor})` }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                      className="text-2xl font-black"
                      style={{ color: signalColor }}
                    >
                      {activeSignal.strength.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <span
                    className="text-xs uppercase tracking-widest"
                    style={{ color: "#8b92a8" }}
                  >
                    Vaxt
                  </span>
                  <CountdownTimer validUntil={activeSignal.validUntil} />
                  <span className="text-xs" style={{ color: "#6b7280" }}>
                    {activeSignal.validity} dəqiqə
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span
                    className="text-xs uppercase tracking-widest"
                    style={{ color: "#8b92a8" }}
                  >
                    Giriş Qiyməti
                  </span>
                  <span
                    className="text-lg font-bold"
                    style={{
                      color: "#e2e8f0",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {activeSignal.entryPrice.toFixed(5)}
                  </span>
                  {currentPrice !== null && (
                    <span
                      className="text-xs"
                      style={{
                        color:
                          (isBuy && currentPrice > activeSignal.entryPrice) ||
                          (isSell && currentPrice < activeSignal.entryPrice)
                            ? "#00ff88"
                            : "#ff1744",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      Cari: {currentPrice.toFixed(5)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div
                className="w-full h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: signalColor,
                    boxShadow: `0 0 8px ${signalColor}`,
                  }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${activeSignal.strength}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: "#8b92a8",
                  animation: "pulse 2s ease-in-out infinite",
                }}
              />
              <div className="flex flex-col">
                {analysisStrength >= 60 ? (
                  <>
                    <span
                      className="text-2xl font-black"
                      style={{ color: "#ffd700" }}
                    >
                      GÜCLƎNİR...
                    </span>
                    <span className="text-sm" style={{ color: "#8b92a8" }}>
                      Analiz: {analysisStrength.toFixed(0)}% — 75% haddini
                      gözləyir
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      className="text-2xl font-black"
                      style={{ color: "#8b92a8" }}
                    >
                      &#x25cf; ANALİZ EDİR...
                    </span>
                    <span className="text-sm" style={{ color: "#6b7280" }}>
                      Bütün indikatorlar hesablanır
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              {signalResult && (
                <div className="flex gap-6 text-center">
                  <div className="flex flex-col gap-1">
                    <span
                      className="text-xs uppercase tracking-widest"
                      style={{ color: "#8b92a8" }}
                    >
                      AL
                    </span>
                    <span
                      className="text-xl font-bold"
                      style={{
                        color: "#00ff88",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {signalResult.buyScore}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span
                      className="text-xs uppercase tracking-widest"
                      style={{ color: "#8b92a8" }}
                    >
                      SAT
                    </span>
                    <span
                      className="text-xl font-bold"
                      style={{
                        color: "#ff1744",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {signalResult.sellScore}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span
                      className="text-xs uppercase tracking-widest"
                      style={{ color: "#8b92a8" }}
                    >
                      GÜC
                    </span>
                    <span
                      className="text-xl font-bold"
                      style={{
                        color: analysisStrength >= 60 ? "#ffd700" : "#8b92a8",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {analysisStrength.toFixed(0)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Volume confirmation in waiting state */}
              {vc && (
                <div
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md"
                  style={{
                    backgroundColor: `${vcColor}15`,
                    border: `1px solid ${vcColor}44`,
                  }}
                >
                  <span
                    style={{ color: vcColor, fontSize: 10, fontWeight: 700 }}
                  >
                    {vc.status === "CONFIRMS"
                      ? "\u2714"
                      : vc.status === "CONTRADICTS"
                        ? "\u26a0"
                        : "\u25cb"}
                  </span>
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: vcColor }}
                  >
                    {vc.label}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
