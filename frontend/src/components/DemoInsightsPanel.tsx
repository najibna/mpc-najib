import { Link } from "react-router-dom";
import type { DemoInsights } from "../types/smb";

const SEV: Record<string, string> = {
  critical: "border-intact/30 bg-intact-muted text-intact",
  high: "border-intact/25 bg-intact-muted text-intact",
  medium: "border-amber-200 bg-amber-50 text-amber-900",
  low: "border-[color:var(--border)] bg-cream-100 text-mist-200",
};

export default function DemoInsightsPanel({ data, className = "" }: { data: DemoInsights; className?: string }) {
  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="border-b border-[color:var(--border)] bg-intact-muted px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-intact">AI · Auto-Discovery</p>
        <h3 className="mt-1 text-lg font-bold text-charcoal">{data.headline}</h3>
        <p className="text-sm text-mist-400">{data.subheadline}</p>
      </div>
      <ol className="divide-y divide-[color:var(--border)]">
        {data.insights.map((ins) => (
          <li key={ins.id} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-cream-50 sm:px-5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-intact-muted text-sm font-bold text-intact">
              {ins.rank}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-charcoal">{ins.title}</p>
              <p className="mt-1 text-sm text-mist-400">{ins.detail}</p>
            </div>
            <Link
              to={ins.link}
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:border-intact/50 ${SEV[ins.severity] ?? SEV.low}`}
            >
              {ins.action_label} →
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
