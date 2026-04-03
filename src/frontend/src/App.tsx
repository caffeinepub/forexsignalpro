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
            AI-Powered Technical Analysis
          </span>
        </div>

        <div className="flex items-center gap-3">
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
              {state.apiConnected ? "CANLI" : "BAĞLANİR"}
            </span>
          </div>

          <span
            className="text-[10px] px-2 py-1 rounded font-bold uppercase tracking-widest"
            style={{
              backgroundColor:
                state.currentMarket === "real"
                  ? "rgba(0,212,255,0.12)"
                  : "rgba(255,215,0,0.12)",
              color: state.currentMarket === "real" ? "#00d4ff" : "#ffd700",
              border: `1px solid ${state.currentMarket === "real" ? "#00d4ff33" : "#ffd70033"}`,
            }}
          >
            {state.currentMarket === "real" ? "REAL" : "OTC"}
          </span>

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
                {state.currentPair.replace("_OTC", "")}
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
                {/* Market Toggle */}
                <div className="flex gap-2" data-ocid="market.toggle">
                  <button
                    type="button"
                    onClick={() =>
                      selectPair(state.currentPair.replace("_OTC", ""), "real")
                    }
                    data-ocid="market.real.button"
                    className="flex-1 py-2 rounded-lg font-bold text-sm tracking-widest uppercase transition-all duration-200 cursor-pointer"
                    style={{
                      backgroundColor:
                        state.currentMarket === "real"
                          ? "rgba(0,212,255,0.15)"
                          : "rgba(255,255,255,0.03)",
                      border: `1px solid ${
                        state.currentMarket === "real"
                          ? "#00d4ff"
                          : "rgba(255,255,255,0.08)"
                      }`,
                      color:
                        state.currentMarket === "real" ? "#00d4ff" : "#8b92a8",
                      boxShadow:
                        state.currentMarket === "real"
                          ? "0 0 20px rgba(0,212,255,0.2)"
                          : "none",
                    }}
                  >
                    🌐 REAL BAZAR
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const base = state.currentPair.replace("_OTC", "");
                      selectPair(`${base}_OTC`, "otc");
                    }}
                    data-ocid="market.otc.button"
                    className="flex-1 py-2 rounded-lg font-bold text-sm tracking-widest uppercase transition-all duration-200 cursor-pointer"
                    style={{
                      backgroundColor:
                        state.currentMarket === "otc"
                          ? "rgba(255,215,0,0.15)"
                          : "rgba(255,255,255,0.03)",
                      border: `1px solid ${
                        state.currentMarket === "otc"
                          ? "#ffd700"
                          : "rgba(255,255,255,0.08)"
                      }`,
                      color:
                        state.currentMarket === "otc" ? "#ffd700" : "#8b92a8",
                      boxShadow:
                        state.currentMarket === "otc"
                          ? "0 0 20px rgba(255,215,0,0.2)"
                          : "none",
                    }}
                  >
                    🔵 OTC BAZAR
                  </button>
                </div>

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
                      currentMarket={state.currentMarket}
                      currentPrice={state.currentPrice}
                      onSelect={selectPair}
                    />

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
                            Qiymət yüklənir...
                          </span>
                        </div>
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
                          {state.currentPair.replace("_OTC", "")}{" "}
                          {state.currentMarket === "otc" ? "(OTC)" : ""}
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
