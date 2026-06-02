import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalysisSummary, AnalyzedTransaction } from "../types/transaction";
import { formatCurrency, riskChartColor } from "../utils";
import { Panel } from "./ui/Card";

type Props = {
  summary: AnalysisSummary;
  transactions: AnalyzedTransaction[];
};

const TOOLTIP_PROPS = {
  contentStyle: {
    background: "#04181f",
    border: "1px solid rgba(24, 201, 224, 0.3)",
    borderRadius: 12,
  },
  itemStyle: { color: "#ffffff" },
  labelStyle: { color: "#e8f4f6", fontWeight: 600 },
};

type PieLabelProps = {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
};

const RAD = Math.PI / 180;

/** Draws the percentage centered within each slice; hides tiny slivers. */
function renderPercentLabel(props: PieLabelProps) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if (percent < 0.04) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RAD);
  const y = cy + radius * Math.sin(-midAngle * RAD);
  return (
    <text
      x={x}
      y={y}
      fill="#ffffff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={700}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
}

export default function RiskChart({ summary, transactions }: Props) {
  const distribution = [
    { name: "Compliant", value: summary.compliant_transactions },
    { name: "Needs Review", value: summary.needs_review_transactions },
    { name: "High Risk", value: summary.high_risk_transactions },
    { name: "Likely Policy Violation", value: summary.likely_policy_violations },
  ].filter((d) => d.value > 0);

  const byMcc = aggregate(transactions, (t) => t.mcc || "Unknown");
  const byCountry = aggregate(transactions, (t) => t.merchant_country || "Unknown");

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Panel title="Risk Category Distribution">
        <div className="h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={distribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={82}
                paddingAngle={2}
                stroke="#021016"
                strokeWidth={2}
                label={renderPercentLabel}
                labelLine={false}
              >
                {distribution.map((d) => (
                  <Cell key={d.name} fill={riskChartColor(d.name)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value.toLocaleString()} txns`,
                  name,
                ]}
                {...TOOLTIP_PROPS}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value) => (
                  <span className="text-xs text-mist-300">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Flagged Amount by MCC (Top 8)">
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={byMcc} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={70}
                tick={{ fill: "#B8C4D9", fontSize: 12 }}
              />
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                cursor={{ fill: "rgba(24,201,224,0.08)" }}
                {...TOOLTIP_PROPS}
              />
              <Bar dataKey="value" fill="#E4002B" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Flagged Amount by Country (Top 8)">
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={byCountry} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={70}
                tick={{ fill: "#B8C4D9", fontSize: 12 }}
              />
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                cursor={{ fill: "rgba(24,201,224,0.08)" }}
                {...TOOLTIP_PROPS}
              />
              <Bar dataKey="value" fill="#C40024" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}

function aggregate(
  transactions: AnalyzedTransaction[],
  keyFn: (t: AnalyzedTransaction) => string,
): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (t.debit_or_credit.toLowerCase() === "credit") continue;
    map.set(keyFn(t), (map.get(keyFn(t)) ?? 0) + t.amount);
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}
