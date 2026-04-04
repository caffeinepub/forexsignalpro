import { REAL_PAIRS } from "../hooks/useForexBot";

interface PairSelectorProps {
  currentPair: string;
  currentPrice: number | null;
  onSelect: (pair: string) => void;
}

export default function PairSelector({
  currentPair,
  currentPrice,
  onSelect,
}: PairSelectorProps) {
  return (
    <div className="w-full" data-ocid="pair_selector.panel">
      <div className="grid grid-cols-4 gap-1.5">
        {REAL_PAIRS.map((pair, idx) => {
          const isActive = currentPair === pair;
          return (
            <button
              key={pair}
              type="button"
              data-ocid={`pair_selector.button.${idx + 1}`}
              onClick={() => onSelect(pair)}
              style={{
                backgroundColor: isActive
                  ? "rgba(0,212,255,0.15)"
                  : "rgba(255,255,255,0.04)",
                borderColor: isActive ? "#00d4ff" : "rgba(255,255,255,0.08)",
                boxShadow: isActive ? "0 0 12px rgba(0,212,255,0.3)" : "none",
              }}
              className="relative flex flex-col items-center justify-center px-1 py-2 rounded-md border text-center transition-all duration-200 hover:border-blue-400/50 cursor-pointer"
            >
              <span
                className="text-xs font-bold tracking-tight"
                style={{
                  color: isActive ? "#00d4ff" : "#c8d0e0",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {pair}
              </span>
              {isActive && currentPrice !== null && (
                <span
                  className="text-[9px] mt-0.5"
                  style={{
                    color: "#8b92a8",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {currentPrice.toFixed(5)}
                </span>
              )}
              {isActive && (
                <span
                  className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: "#00d4ff",
                    boxShadow: "0 0 4px #00d4ff",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
