import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import type { ForexStats } from "../backend";
import { backend } from "../backendSingleton";

interface StatCardProps {
  label: string;
  value: string;
  color: string;
  glow?: boolean;
  index: number;
}

function StatCard({ label, value, color, glow, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex-1 rounded-xl p-4 flex flex-col gap-1 min-w-[100px]"
      style={{
        backgroundColor: "rgba(255,255,255,0.03)",
        border: `1px solid ${color}22`,
        boxShadow: glow ? `0 0 20px ${color}18` : "none",
      }}
    >
      <span
        className="text-[10px] uppercase tracking-widest"
        style={{ color: "#8b92a8" }}
      >
        {label}
      </span>
      <span
        className="text-2xl font-black"
        style={{
          color,
          fontFamily: "'JetBrains Mono', monospace",
          textShadow: glow ? `0 0 20px ${color}55` : "none",
        }}
      >
        {value}
      </span>
    </motion.div>
  );
}

interface StatsPanelProps {
  refreshTrigger?: number;
}

export default function StatsPanel({ refreshTrigger }: StatsPanelProps) {
  const [stats, setStats] = useState<ForexStats | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await backend.getOverallStats();
      setStats(data);
    } catch {
      // ignore
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshTrigger prop intentionally re-triggers fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshTrigger]);

  const total = stats ? Number(stats.total) : 0;
  const wins = stats ? Number(stats.wins) : 0;
  const losses = stats ? Number(stats.losses) : 0;
  const winRate = stats ? Number(stats.winRate) : 0;
  const winRateGood = winRate >= 60;

  return (
    <div className="flex flex-wrap gap-2" data-ocid="stats.panel">
      <StatCard
        index={0}
        label="Win Rate"
        value={`${winRate}%`}
        color={winRateGood ? "#00ff88" : winRate >= 40 ? "#ffd700" : "#ff1744"}
        glow={winRateGood}
      />
      <StatCard
        index={1}
        label="Toplam"
        value={String(total)}
        color="#00d4ff"
      />
      <StatCard
        index={2}
        label="Qalibəət"
        value={String(wins)}
        color="#00ff88"
      />
      <StatCard
        index={3}
        label="Məğlubiyyət"
        value={String(losses)}
        color="#ff1744"
      />
    </div>
  );
}
