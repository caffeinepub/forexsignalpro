interface ApiStatusBarProps {
  apiConnected: boolean;
  isLoading: boolean;
  loadError: string | null;
  candleCount: number;
  lastUpdated: number | null;
  analysisStrength: number;
}

export default function ApiStatusBar({
  apiConnected,
  isLoading,
  loadError,
  candleCount,
  lastUpdated,
  analysisStrength,
}: ApiStatusBarProps) {
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("az-AZ", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const statusColor = isLoading
    ? "#ffd700"
    : loadError
      ? "#ff1744"
      : apiConnected
        ? "#00ff88"
        : "#ff1744";

  const statusText = isLoading
    ? "YÜKLƏNİR"
    : loadError
      ? "XƏTƏ"
      : apiConnected
        ? "CANLI"
        : "BAĞLANTISIZ";

  return (
    <div
      className="rounded-lg px-3 py-2 flex flex-wrap items-center gap-x-4 gap-y-1"
      style={{
        backgroundColor: "rgba(0,0,0,0.3)",
        border: `1px solid ${statusColor}33`,
      }}
    >
      {/* Status */}
      <div className="flex items-center gap-1.5">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{
            backgroundColor: statusColor,
            boxShadow: `0 0 6px ${statusColor}`,
            animation:
              isLoading || apiConnected
                ? "pulse 2s ease-in-out infinite"
                : "none",
          }}
        />
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: statusColor }}
        >
          {statusText}
        </span>
      </div>

      {/* Candle count */}
      <div className="flex items-center gap-1">
        <span className="text-[10px]" style={{ color: "#6b7280" }}>
          MUMLAR:
        </span>
        <span
          className="text-[10px] font-mono font-bold"
          style={{ color: candleCount > 0 ? "#00d4ff" : "#ff1744" }}
        >
          {candleCount}
        </span>
      </div>

      {/* Last updated */}
      {lastUpdated && (
        <div className="flex items-center gap-1">
          <span className="text-[10px]" style={{ color: "#6b7280" }}>
            SON YENİLƏNMƏ:
          </span>
          <span className="text-[10px] font-mono" style={{ color: "#8b92a8" }}>
            {formatTime(lastUpdated)}
          </span>
        </div>
      )}

      {/* API source */}
      <div className="flex items-center gap-1">
        <span className="text-[10px]" style={{ color: "#6b7280" }}>
          MƏNBƏ:
        </span>
        <span className="text-[10px] font-mono" style={{ color: "#8b92a8" }}>
          Twelve Data M1
        </span>
      </div>

      {/* Analysis strength */}
      {analysisStrength > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-[10px]" style={{ color: "#6b7280" }}>
            ANALİZ GÜCü:
          </span>
          <span
            className="text-[10px] font-mono font-bold"
            style={{
              color:
                analysisStrength >= 65
                  ? "#00ff88"
                  : analysisStrength >= 50
                    ? "#ffd700"
                    : "#8b92a8",
            }}
          >
            {analysisStrength.toFixed(0)}%
          </span>
        </div>
      )}

      {/* Error message */}
      {loadError && (
        <div className="w-full">
          <span
            className="text-[10px]"
            style={{ color: "#ff1744", opacity: 0.8 }}
          >
            ⚠ {loadError} — Twelve Data limiti olsa 1 dəq gözləyin
          </span>
        </div>
      )}
    </div>
  );
}
