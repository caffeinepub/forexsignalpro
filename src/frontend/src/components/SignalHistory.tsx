import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import type { ForexSignal } from "../backend";
import { backend } from "../backendSingleton";

export default function SignalHistory() {
  const [signals, setSignals] = useState<ForexSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await backend.getAllSignals();
      setSignals([...data].sort((a, b) => Number(b.timestamp - a.timestamp)));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  const handleClear = async () => {
    setClearing(true);
    try {
      await backend.clearHistory();
      setSignals([]);
    } catch {
      // ignore
    } finally {
      setClearing(false);
    }
  };

  const formatTime = (ts: bigint) =>
    new Date(Number(ts)).toLocaleString("az-AZ", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });

  return (
    <div className="w-full flex flex-col gap-4" data-ocid="history.panel">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold" style={{ color: "#c8d0e0" }}>
          Siqnal Tarixçəsi
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSignals}
            disabled={loading}
            data-ocid="history.secondary_button"
            style={{
              borderColor: "rgba(255,255,255,0.1)",
              color: "#8b92a8",
              backgroundColor: "transparent",
            }}
          >
            <RefreshCw
              className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`}
            />
            Yenilə
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={clearing || signals.length === 0}
            data-ocid="history.delete_button"
            style={{
              borderColor: "rgba(255,23,68,0.3)",
              color: "#ff1744",
              backgroundColor: "transparent",
            }}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Təmizlə
          </Button>
        </div>
      </div>

      {loading ? (
        <div
          className="flex items-center justify-center py-12"
          data-ocid="history.loading_state"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{ borderColor: "#00d4ff", borderTopColor: "transparent" }}
            />
            <span style={{ color: "#8b92a8" }}>Yüklənir...</span>
          </div>
        </div>
      ) : signals.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16"
          data-ocid="history.empty_state"
          style={{ color: "#8b92a8" }}
        >
          <span className="text-4xl mb-3">📊</span>
          <span className="text-sm">Hələ heç bir siqnal yoxdur</span>
          <span className="text-xs mt-1" style={{ color: "#6b7280" }}>
            Canlı analizdən siqnal gəldikdə burada görünəcək
          </span>
        </div>
      ) : (
        <ScrollArea
          className="w-full"
          style={{ maxHeight: "calc(100vh - 320px)" }}
        >
          <div className="w-full overflow-x-auto" data-ocid="history.table">
            <table
              className="w-full text-sm"
              style={{ borderCollapse: "separate", borderSpacing: "0 2px" }}
            >
              <thead>
                <tr>
                  {[
                    "Vaxt",
                    "Cüt",
                    "Bazar",
                    "İstiqamət",
                    "Güc",
                    "Giriş",
                    "Çıxış",
                    "Nəticə",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-3 py-2 text-[10px] uppercase tracking-widest"
                      style={{
                        color: "#6b7280",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {signals.map((sig, idx) => {
                  const isWin = sig.success === true;
                  const isLoss = sig.success === false;
                  const rowBg = isWin
                    ? "rgba(0,255,136,0.04)"
                    : isLoss
                      ? "rgba(255,23,68,0.04)"
                      : "rgba(255,255,255,0.01)";

                  return (
                    <motion.tr
                      key={String(sig.id)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      data-ocid={`history.item.${idx + 1}`}
                      style={{ backgroundColor: rowBg }}
                    >
                      <td
                        className="px-3 py-2 text-xs"
                        style={{
                          color: "#8b92a8",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {formatTime(sig.timestamp)}
                      </td>
                      <td
                        className="px-3 py-2 text-xs font-bold"
                        style={{
                          color: "#c8d0e0",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {sig.pair.replace("_OTC", "")}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                          style={{
                            backgroundColor:
                              sig.market === "real"
                                ? "rgba(0,212,255,0.12)"
                                : "rgba(255,215,0,0.12)",
                            color:
                              sig.market === "real" ? "#00d4ff" : "#ffd700",
                          }}
                        >
                          {sig.market.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className="text-xs font-black px-2 py-0.5 rounded"
                          style={{
                            backgroundColor:
                              sig.direction === "BUY"
                                ? "rgba(0,255,136,0.12)"
                                : "rgba(255,23,68,0.12)",
                            color:
                              sig.direction === "BUY" ? "#00ff88" : "#ff1744",
                          }}
                        >
                          {sig.direction}
                        </span>
                      </td>
                      <td
                        className="px-3 py-2 text-xs font-bold"
                        style={{
                          color: "#e2e8f0",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {sig.strength.toFixed(0)}%
                      </td>
                      <td
                        className="px-3 py-2 text-xs"
                        style={{
                          color: "#c8d0e0",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {sig.entryPrice.toFixed(5)}
                      </td>
                      <td
                        className="px-3 py-2 text-xs"
                        style={{
                          color: "#c8d0e0",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {sig.exitPrice ? sig.exitPrice.toFixed(5) : "--"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {sig.success === undefined || sig.success === null ? (
                          <span
                            className="text-xs"
                            style={{ color: "#8b92a8" }}
                          >
                            ⏳
                          </span>
                        ) : sig.success ? (
                          <span className="text-sm">✅</span>
                        ) : sig.reversed ? (
                          <span className="text-sm">⚠️</span>
                        ) : (
                          <span className="text-sm">❌</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
