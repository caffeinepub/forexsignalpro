import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";

interface AnalysisLogProps {
  logs: string[];
}

function getLogColor(msg: string): string {
  if (msg.includes("🎯") || msg.includes("SİQNAL")) return "#00ff88";
  if (msg.includes("⚠️") || msg.includes("REVERSAL") || msg.includes("GÜCLƌNİR"))
    return "#ffd700";
  if (msg.includes("❌") || msg.includes("məğlub")) return "#ff1744";
  if (msg.includes("✅") || msg.includes("tamamlandı")) return "#00ff88";
  if (msg.includes("📊") || msg.includes("Cüt")) return "#00d4ff";
  return "#8b92a8";
}

export default function AnalysisLog({ logs }: AnalysisLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: logs.length is the reactive signal we need
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  return (
    <div
      className="rounded-lg flex flex-col overflow-hidden"
      style={{
        backgroundColor: "rgba(0,0,0,0.3)",
        border: "1px solid rgba(255,255,255,0.06)",
        height: "300px",
        minHeight: "300px",
        maxHeight: "300px",
      }}
      data-ocid="analysis_log.panel"
    >
      <div
        className="px-3 py-2 flex items-center gap-2 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: "#00ff88",
            animation: "pulse 2s ease-in-out infinite",
            boxShadow: "0 0 6px #00ff88",
          }}
        />
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: "#8b92a8" }}
        >
          Canlı Jurnal
        </span>
      </div>
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full w-full px-3 py-2">
          {logs.length === 0 ? (
            <p className="text-xs" style={{ color: "#6b7280" }}>
              Analiz başlayanda log görünəcək...
            </p>
          ) : (
            <div className="flex flex-col-reverse gap-0.5">
              {logs.slice(0, 20).map((log) => (
                <div
                  key={log.slice(0, 30)}
                  className="text-xs leading-relaxed break-words"
                  style={{
                    color: getLogColor(log),
                    fontFamily: "'JetBrains Mono', monospace",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  }}
                >
                  {log}
                </div>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </ScrollArea>
      </div>
    </div>
  );
}
