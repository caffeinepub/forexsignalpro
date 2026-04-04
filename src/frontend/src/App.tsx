import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import AnalysisLog from "./components/AnalysisLog";
import CandlestickChart from "./components/CandlestickChart";
import IndicatorPanel from "./components/IndicatorPanel";
import PairSelector from "./components/PairSelector";
import SignalDisplay from "./components/SignalDisplay";
import SignalHistory from "./components/SignalHistory";
import StatsPanel from "./components/StatsPanel";
import { useForexBot } from "./hooks/useForexBot";

export default function App() {
  const handleSignalComplete = useCallback(() => {
    setStatsRefresh((p) => p + 1);
  }, []);

  const { state, selectPair } = useForexBot(handleSignalComplete);
  const [statsRefresh, setStatsRefresh] = useState(0);
  const [activeTab, setActiveTab] = useState("live");

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "history") setStatsRefresh((p) => p + 1);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#0a0e1a" }}
    >
      {/* Header */}
      <header
        className="w-full px-4 py-3 flex items-center justify-between"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backgroundColor: "rgba(0,0,0,0.4)",
        }}
      >
        <div className="flex flex-col">
          <h1
            className="text-xl font-black tracking-widest uppercase"
            style={{
              background: "linear-gradient(90deg, #00d4ff, #00ff88, #ffd700)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "gradient-flow 4s linear infinite",
            }}
          >
            FOREX SIGNAL PRO
          </h1>
          <span
            className="text-[10px] uppercase tracking-widest"
            style={{ color: "#8b92a8" }}
          >
            Real M1 · AI-Powered Technical Analysis
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* API Connection status */}
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: state.apiConnected ? "#00ff88" : "#ff1744",
                boxShadow: state.apiConnected
                  ? "0 0 6px #00ff88"
                  : "0 0 6px #ff1744",
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
            <span
              className="text-[10px] uppercase tracking-widest"
              style={{ color: state.apiConnected ? "#00ff88" : "#ff1744" }}
            >
              {state.isLoading
                ? "YÜKLƏNİR"
                : state.apiConnected
                  ? "CANLI"
                  : "XƎTa"}
            </span>
          </div>

          {/* REAL badge */}
          <span
            className="text-[10px] px-2 py-1 rounded font-bold uppercase tracking-widest"
            style={{
              backgroundColor: "rgba(0,212,255,0.12)",
              color: "#00d4ff",
              border: "1px solid #00d4ff33",
            }}
          >
            REAL M1
          </span>

          {/* Live price display */}
          {state.currentPrice !== null && (
            <div
              className="flex items-center gap-1 px-3 py-1 rounded"
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span
                className="text-[10px] uppercase"
                style={{ color: "#8b92a8" }}
              >
                {state.currentPair}
              </span>
              <span
                className="text-sm font-bold"
                style={{
                  color: "#e2e8f0",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {state.currentPrice.toFixed(5)}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList
            className="mb-4 gap-1"
            style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <TabsTrigger
              value="live"
              data-ocid="app.live.tab"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                letterSpacing: "0.1em",
              }}
            >
              ⚡ CANLI
            </TabsTrigger>
            <TabsTrigger
              value="history"
              data-ocid="app.history.tab"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                letterSpacing: "0.1em",
              }}
            >
              📈 TARİXÇƎ
            </TabsTrigger>
          </TabsList>

          {/* LIVE TAB */}
          <TabsContent value="live" className="mt-0">
            <AnimatePresence mode="wait">
              <motion.div
                key="live"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-4"
              >
                {/* Main Content Grid */}
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: "minmax(0,1fr) minmax(0,1.3fr)",
                  }}
                >
                  {/* LEFT COLUMN */}
                  <div className="flex flex-col gap-3">
                    <PairSelector
                      currentPair={state.currentPair}
                      currentPrice={state.currentPrice}
                      onSelect={selectPair}
                    />

                    {/* Price display / loading / error */}
                    {state.isLoading ? (
                      <div
                        className="rounded-lg flex items-center justify-center py-4"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                        data-ocid="price.loading_state"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border-2 animate-spin"
                            style={{
                              borderColor: "#00d4ff",
                              borderTopColor: "transparent",
                            }}
                          />
                          <span
                            style={{ color: "#8b92a8" }}
                            className="text-sm"
                          >
                            Real M1 məlumatları yüklənir...
                          </span>
                        </div>
                      </div>
                    ) : state.loadError ? (
                      <div
                        className="rounded-lg flex flex-col items-center justify-center py-4 gap-2"
                        style={{
                          backgroundColor: "rgba(255,23,68,0.06)",
                          border: "1px solid rgba(255,23,68,0.2)",
                        }}
                        data-ocid="price.error_state"
                      >
                        <span
                          className="text-sm font-bold"
                          style={{ color: "#ff1744" }}
                        >
                          ❌ API Xətası
                        </span>
                        <span
                          className="text-xs text-center px-4"
                          style={{ color: "#ff1744", opacity: 0.8 }}
                        >
                          {state.loadError}
                        </span>
                        <span
                          className="text-[10px]"
                          style={{ color: "#8b92a8" }}
                        >
                          Twelve Data limiti keçmiş ola bilər — 1 dəqiqə
                          gözləyin
                        </span>
                      </div>
                    ) : (
                      <div
                        className="rounded-lg px-4 py-3 flex items-center justify-between"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <span
                          className="text-xs uppercase tracking-widest"
                          style={{ color: "#8b92a8" }}
                        >
                          {state.currentPair} · M1
                        </span>
                        <span
                          className="text-2xl font-black"
                          style={{
                            color: "#e2e8f0",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {state.currentPrice?.toFixed(5) ?? "--"}
                        </span>
                      </div>
                    )}

                    <CandlestickChart
                      candles={state.candles}
                      currentPrice={state.currentPrice}
                    />
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="flex flex-col gap-3">
                    <IndicatorPanel
                      indicators={state.indicators}
                      votes={state.signalResult?.votes ?? []}
                    />
                    <AnalysisLog logs={state.analysisLog} />
                  </div>
                </div>

                {/* Bottom: Signal + Stats */}
                <div className="flex flex-col gap-3">
                  <SignalDisplay
                    activeSignal={state.activeSignal}
                    signalResult={state.signalResult}
                    analysisStrength={state.analysisStrength}
                    currentPrice={state.currentPrice}
                  />
                  <StatsPanel refreshTrigger={statsRefresh} />
                </div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history" className="mt-0">
            <AnimatePresence mode="wait">
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-4"
              >
                <div
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <h3
                    className="text-xs uppercase tracking-widest mb-3"
                    style={{ color: "#8b92a8" }}
                  >
                    Ümumi Statistika
                  </h3>
                  <StatsPanel refreshTrigger={statsRefresh} />
                </div>

                <div
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <SignalHistory />
                </div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer
        className="w-full px-4 py-3 text-center text-[10px]"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          color: "#6b7280",
        }}
      >
        &copy; {new Date().getFullYear()} ForexSignalPro.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#8b92a8" }}
        >
          Built with ❤️ using caffeine.ai
        </a>
      </footer>

      <Toaster />
    </div>
  );
}
