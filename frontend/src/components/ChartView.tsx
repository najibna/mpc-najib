import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartType, NameValue } from "../types/smb";

const INTACT = "#E4002B";
const PALETTE = [
  "#E4002B",
  "#C40024",
  "#8A8A8A",
  "#6B6B6B",
  "#4A4A4A",
  "#FF3355",
  "#D8D2C8",
  "#B8B0A6",
];

const TOOLTIP_PROPS = {
  contentStyle: {
    background: "#ffffff",
    border: "1px solid #e5dfd6",
    borderRadius: 8,
    boxShadow: "0 4px 16px rgba(30,30,30,0.08)",
  },
  itemStyle: { color: "#1e1e1e" },
  labelStyle: { color: "#4a4a4a", fontWeight: 600 },
};

function fmt(v: number): string {
  if (Math.abs(v) >= 1000)
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(v);
  return new Intl.NumberFormat("en-CA").format(v);
}

function fmtCompact(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000) return `$${(v / 1_000).toFixed(0)}K`;
  return fmt(v);
}

function pct(part: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-[color:var(--border-strong)] bg-cream-50 text-sm text-charcoal-light">
      {message}
    </div>
  );
}

function SideLegend({ data, total }: { data: NameValue[]; total: number }) {
  return (
    <ul className="flex min-w-0 flex-1 flex-col gap-3">
      {data.map((d, i) => (
        <li key={d.name} className="flex items-start gap-2.5 text-xs leading-snug">
          <span
            className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-sm"
            style={{ background: PALETTE[i % PALETTE.length] }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-charcoal">{d.name}</p>
            <p className="mt-0.5 text-charcoal-light">
              {fmt(d.value)} · {pct(d.value, total)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

type Props = {
  chart: ChartType;
  data: NameValue[];
  metric?: string;
  height?: number;
  subtitle?: string;
  includeZero?: boolean;
};

export default function ChartView({ chart, data, metric, height = 280, subtitle, includeZero = false }: Props) {
  const isCurrency = metric !== "count";
  const formatVal = (v: number) => (isCurrency ? fmt(v) : v.toLocaleString());
  const safeData = includeZero ? data.filter((d) => d.value >= 0) : data.filter((d) => d.value > 0);

  if (!safeData.length) {
    return <EmptyChart message="No data for this period" />;
  }

  if (chart === "kpi") {
    const v = safeData[0]?.value ?? 0;
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="font-serif text-4xl font-semibold text-charcoal sm:text-5xl">{formatVal(v)}</div>
        <div className="mt-2 text-sm text-charcoal-muted">{safeData[0]?.name ?? ""}</div>
      </div>
    );
  }

  if (chart === "table") {
    return (
      <div className="table-container max-h-80 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 border-b border-[color:var(--border)] bg-cream-50 text-xs font-semibold uppercase text-charcoal-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3 text-right">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--border)]">
            {safeData.map((d) => (
              <tr key={d.name} className="transition-colors hover:bg-cream-50">
                <td className="px-4 py-2.5 text-charcoal">{d.name}</td>
                <td className="px-4 py-2.5 text-right font-medium text-charcoal">{formatVal(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (chart === "pie") {
    const total = safeData.reduce((s, d) => s + d.value, 0);
    return (
      <div>
        {subtitle && <p className="mb-3 text-xs text-charcoal-light">{subtitle}</p>}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="relative mx-auto shrink-0 sm:mx-0" style={{ width: 220, height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={safeData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={68}
                  outerRadius={96}
                  paddingAngle={safeData.length > 1 ? 3 : 0}
                  stroke="#ffffff"
                  strokeWidth={2}
                  cx="50%"
                  cy="50%"
                >
                  {safeData.map((_d, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatVal(v)} {...TOOLTIP_PROPS} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <span className="text-[10px] font-medium uppercase tracking-wider text-charcoal-light">Total</span>
              <span className="mt-1 font-serif text-base font-semibold leading-none text-charcoal sm:text-lg">
                {fmtCompact(total)}
              </span>
            </div>
          </div>
          <SideLegend data={safeData} total={total} />
        </div>
      </div>
    );
  }

  if (chart === "line") {
    return (
      <div style={{ height }}>
        <ResponsiveContainer>
          <AreaChart data={safeData} margin={{ top: 12, right: 12, bottom: 4, left: 0 }}>
            <defs>
              <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={INTACT} stopOpacity={0.2} />
                <stop offset="100%" stopColor={INTACT} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e5dfd6" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#6b6b6b", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fill: "#6b6b6b", fontSize: 11 }}
              width={68}
              tickFormatter={(v) => fmt(v)}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip formatter={(v: number) => formatVal(v)} {...TOOLTIP_PROPS} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={INTACT}
              strokeWidth={2.5}
              fill="url(#spendGradient)"
              dot={{ fill: INTACT, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#C40024" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chart === "hbar") {
    const barHeight = Math.max(height, safeData.length * 44 + 32);
    return (
      <div style={{ height: barHeight }}>
        <ResponsiveContainer>
          <BarChart data={safeData} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
            <CartesianGrid stroke="#efebe4" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: "#6b6b6b", fontSize: 11 }}
              tickFormatter={(v) => fmt(v)}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={108}
              tick={{ fill: "#4a4a4a", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(v: number) => formatVal(v)}
              cursor={{ fill: "rgba(228,0,43,0.06)" }}
              {...TOOLTIP_PROPS}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
              {safeData.map((_d, i) => (
                <Cell key={i} fill={i === 0 ? INTACT : PALETTE[(i + 1) % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const labelsAreLong = safeData.some((d) => d.name.length > 8);
  const bottomMargin = labelsAreLong ? 72 : 36;
  const maxVal = Math.max(...safeData.map((d) => d.value), 1);
  return (
    <div style={{ height: labelsAreLong ? height + 24 : height }}>
      <ResponsiveContainer>
        <BarChart data={safeData} margin={{ top: 8, right: 12, bottom: bottomMargin, left: 0 }}>
          <CartesianGrid stroke="#e5dfd6" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#6b6b6b", fontSize: 10 }}
            interval={0}
            angle={labelsAreLong ? -35 : 0}
            textAnchor={labelsAreLong ? "end" : "middle"}
            height={bottomMargin}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: "#6b6b6b", fontSize: 11 }}
            width={68}
            tickFormatter={(v) => fmt(v)}
            tickLine={false}
            axisLine={false}
            domain={[0, maxVal]}
          />
          <Tooltip
            formatter={(v: number) => formatVal(v)}
            cursor={{ fill: "rgba(228,0,43,0.08)" }}
            {...TOOLTIP_PROPS}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48} minPointSize={includeZero ? 4 : 0}>
            {safeData.map((_d, i) => (
              <Cell key={i} fill={i === 0 ? INTACT : PALETTE[(i + 1) % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export { fmt as formatValue };
