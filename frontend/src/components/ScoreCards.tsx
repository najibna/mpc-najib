import { Link } from "react-router-dom";
import type { PlatformScores } from "../types/smb";

function scoreColor(score: number, riskStyle = false): string {
  if (riskStyle) {
    if (score >= 75) return "text-intact";
    if (score >= 50) return "text-amber-800";
    if (score >= 25) return "text-intact";
    return "text-emerald-700";
  }
  if (score >= 75) return "text-emerald-700";
  if (score >= 50) return "text-intact";
  if (score >= 25) return "text-amber-800";
  return "text-intact";
}

function ringColor(score: number, riskStyle = false): string {
  if (riskStyle) {
    if (score >= 75) return "#E4002B";
    if (score >= 50) return "#D97706";
    if (score >= 25) return "#E4002B";
    return "#059669";
  }
  if (score >= 75) return "#059669";
  if (score >= 50) return "#E4002B";
  if (score >= 25) return "#D97706";
  return "#E4002B";
}

function ScoreRing({ score, riskStyle }: { score: number; riskStyle?: boolean }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = ringColor(score, riskStyle);
  return (
    <div className="relative mx-auto h-20 w-20">
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5dfd6" strokeWidth="3" />
        <circle
          cx="18" cy="18" r="15.5" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${pct} 100`} strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-xl font-bold ${scoreColor(score, riskStyle)}`}>{score}</span>
      </div>
    </div>
  );
}

export default function ScoreCards({ scores }: { scores: PlatformScores }) {
  const items = [
    { ...scores.transaction_risk, riskStyle: true },
    { ...scores.policy_compliance, riskStyle: false },
    { ...scores.vendor_optimization, riskStyle: false },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {items.map((s) => (
          <Link
            key={s.label}
            to={s.drilldown}
            className="stat-card group transition-all hover:border-intact/40 hover:shadow-glow-sm"
          >
            <ScoreRing score={s.score} riskStyle={s.riskStyle} />
            <p className="mt-3 text-center text-sm font-semibold text-charcoal">{s.label}</p>
            <p className="mt-1 text-center text-xs text-mist-400">{s.level}</p>
            <p className="mt-2 text-center text-[11px] leading-relaxed text-mist-500">{s.detail}</p>
          </Link>
        ))}
      </div>
      <p className="mt-3 text-center text-[11px] text-mist-500">{scores.methodology}</p>
    </div>
  );
}
