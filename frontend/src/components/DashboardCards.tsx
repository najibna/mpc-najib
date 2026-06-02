import type { AnalysisSummary } from "../types/transaction";
import { formatCurrency } from "../utils";

type Props = { summary: AnalysisSummary };

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="stat-card animate-fade-up">
      <p className="text-xs font-medium uppercase tracking-wide text-mist-400">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold sm:text-3xl ${accent}`}>{value}</p>
    </div>
  );
}

export default function DashboardCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      <Stat
        label="Total Transactions"
        value={summary.total_transactions.toLocaleString()}
        accent="text-charcoal"
      />
      <Stat
        label="Flagged"
        value={summary.flagged_transactions.toLocaleString()}
        accent="text-amber-800"
      />
      <Stat
        label="High Risk"
        value={summary.high_risk_transactions.toLocaleString()}
        accent="text-orange-300"
      />
      <Stat
        label="Likely Violations"
        value={summary.likely_policy_violations.toLocaleString()}
        accent="text-intact"
      />
      <Stat
        label="Flagged Amount"
        value={formatCurrency(summary.total_flagged_amount)}
        accent="text-intact"
      />
    </div>
  );
}
