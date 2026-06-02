import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getAnomalies,
  getEmployeeRisk,
  getForecast,
  getHiddenInsights,
  getIntelligence,
  getLeaks,
  getPolicyCopilot,
  getPolicyTrends,
  getReceipts,
  getVendors,
  getMeta,
} from "../api/smb";
import ChartView from "../components/ChartView";
import AvailableFieldsPanel, { DataEmptyState } from "../components/AvailableFieldsPanel";
import { Panel } from "../components/ui/Card";
import PageHeader, { cardholderLabel, fmtCurrency, humanGroupLabel, severityBadge, Spinner } from "../components/ui/PageHeader";
import { DEMO_BUNDLE } from "../data/demoBundle";
import { PAGES } from "../copy";
import { L } from "../labels";
import { useDataVersion } from "../hooks/useDataVersion";
import type {
  AnomalyScan,
  DataAvailability,
  EmployeeSummary,
  ForecastResult,
  HiddenInsightsResult,
  IntelligenceResult,
  LeaksResult,
  PolicyCopilotResult,
  PolicyTrends,
  ReceiptStatus,
  RiskyTransaction,
  VendorGroup,
} from "../types/smb";

type Tab =
  | "intelligence"
  | "leaks"
  | "hidden"
  | "policy_copilot"
  | "anomalies"
  | "forecast"
  | "receipts"
  | "vendors"
  | "employee_risk"
  | "policy_trends";

const TAB_FETCHERS: Record<Tab, (force?: boolean) => Promise<unknown>> = {
  intelligence: getIntelligence,
  leaks: getLeaks,
  hidden: getHiddenInsights,
  policy_copilot: getPolicyCopilot,
  anomalies: getAnomalies,
  forecast: getForecast,
  receipts: getReceipts,
  vendors: getVendors,
  employee_risk: getEmployeeRisk,
  policy_trends: getPolicyTrends,
};

const VALID_TABS = new Set<string>(Object.keys(TAB_FETCHERS));

export default function InsightsPage() {
  const dataVersion = useDataVersion();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = VALID_TABS.has(searchParams.get("tab") ?? "")
    ? (searchParams.get("tab") as Tab)
    : "intelligence";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [intelligence, setIntelligence] = useState<IntelligenceResult | null>(DEMO_BUNDLE.intelligence);
  const [leaks, setLeaks] = useState<LeaksResult | null>(DEMO_BUNDLE.leaks);
  const [hidden, setHidden] = useState<HiddenInsightsResult | null>(DEMO_BUNDLE.hidden_insights);
  const [policyCopilot, setPolicyCopilot] = useState<PolicyCopilotResult | null>(DEMO_BUNDLE.policy_copilot);
  const [anomalies, setAnomalies] = useState<AnomalyScan | null>(DEMO_BUNDLE.anomalies);
  const [forecast, setForecast] = useState<ForecastResult | null>(DEMO_BUNDLE.forecast);
  const [receipts, setReceipts] = useState<ReceiptStatus | null>(DEMO_BUNDLE.receipts);
  const [vendors, setVendors] = useState<VendorGroup[]>(DEMO_BUNDLE.vendors);
  const [employeeRisk, setEmployeeRisk] = useState<EmployeeSummary[]>(DEMO_BUNDLE.employee_risk);
  const [policyTrends, setPolicyTrends] = useState<PolicyTrends | null>(DEMO_BUNDLE.policy_trends);
  const [tabLoading, setTabLoading] = useState<Partial<Record<Tab, boolean>>>({});
  const [loadedTabs, setLoadedTabs] = useState<Set<Tab>>(() => new Set(Object.keys(TAB_FETCHERS) as Tab[]));
  const [avail, setAvail] = useState<DataAvailability | null>(null);

  useEffect(() => {
    getMeta().then((m) => setAvail(m.data_availability ?? null));
  }, [dataVersion]);

  const applyTabData = useCallback((t: Tab, data: unknown) => {
    if (t === "intelligence") setIntelligence(data as IntelligenceResult);
    if (t === "leaks") setLeaks(data as LeaksResult);
    if (t === "hidden") setHidden(data as HiddenInsightsResult);
    if (t === "policy_copilot") setPolicyCopilot(data as PolicyCopilotResult);
    if (t === "anomalies") setAnomalies(data as AnomalyScan);
    if (t === "forecast") setForecast(data as ForecastResult);
    if (t === "receipts") setReceipts(data as ReceiptStatus);
    if (t === "vendors") setVendors(data as VendorGroup[]);
    if (t === "employee_risk") setEmployeeRisk(data as EmployeeSummary[]);
    if (t === "policy_trends") setPolicyTrends(data as PolicyTrends);
  }, []);

  const loadTab = useCallback(async (t: Tab, force = false) => {
    setTabLoading((s) => ({ ...s, [t]: true }));
    try {
      const data = await TAB_FETCHERS[t](force);
      applyTabData(t, data);
      setLoadedTabs((s) => new Set(s).add(t));
    } finally {
      setTabLoading((s) => ({ ...s, [t]: false }));
    }
  }, [applyTabData]);

  useEffect(() => {
    loadTab(tab, true);
  }, [dataVersion, loadTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loadedTabs.has(tab) && !tabLoading[tab]) loadTab(tab);
  }, [tab, loadedTabs, tabLoading, loadTab]);

  function selectTab(t: Tab) {
    setTab(t);
    setSearchParams({ tab: t }, { replace: true });
  }

  const tabBusy = tabLoading[tab];
  const tabReady = loadedTabs.has(tab);

  const DEMO_TABS = new Set<Tab>(["leaks", "vendors", "hidden", "policy_copilot", "anomalies"]);

  const tabs: { id: Tab; label: string; count?: number; demo?: boolean; unavailable?: boolean }[] = [
    { id: "leaks", label: L.insights.leaks, count: leaks?.summary.leak_count, demo: true },
    { id: "vendors", label: L.insights.stores, count: vendors.length || undefined, demo: true },
    { id: "hidden", label: L.insights.tips, count: hidden?.insights.length, demo: true },
    { id: "policy_copilot", label: L.insights.rulesCheck, count: policyCopilot?.summary.violation, demo: true },
    { id: "anomalies", label: L.insights.oddCharges, count: anomalies?.summary.total_signals, demo: true },
    { id: "intelligence", label: L.insights.risk, count: intelligence?.summary.high_risk_count },
    { id: "forecast", label: L.insights.futureSpend, count: forecast?.alerts.length },
    { id: "employee_risk", label: L.card.one, count: employeeRisk.filter((e) => (e.risk_score ?? 0) >= 50).length || undefined },
    { id: "receipts", label: L.insights.receipts, count: receipts?.data_available ? receipts?.summary.receipts_missing : undefined, unavailable: receipts?.data_available === false },
    { id: "policy_trends", label: L.insights.ruleTrends },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader title={PAGES.insights.title} subtitle={PAGES.insights.subtitle}
      />

      <AvailableFieldsPanel className="mb-4" />

      <p className="mb-3 text-sm text-charcoal-muted">{L.insights.intro}</p>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => selectTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-intact text-white shadow-intact-sm"
                : DEMO_TABS.has(t.id)
                  ? "border border-intact/30 bg-intact-muted text-mist-100 hover:text-charcoal"
                  : t.unavailable
                    ? "border border-[color:var(--border)] bg-cream-50 text-mist-500"
                    : "border border-[color:var(--border)] bg-cream-100 text-mist-300 hover:text-charcoal"
            }`}
          >
            {t.label}
            {t.unavailable && <span className="ml-1 text-[10px] opacity-70">N/A</span>}
            {t.count !== undefined && t.count > 0 && (
              <span className="ml-2 rounded-full bg-white/20 px-1.5 text-xs">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {tabBusy && !tabReady ? (
        <Spinner />
      ) : (
        <>
          {tab === "intelligence" && intelligence && <IntelligenceTab data={intelligence} />}
          {tab === "leaks" && leaks && <LeaksTab data={leaks} />}
          {tab === "hidden" && hidden && <HiddenTab data={hidden} />}
          {tab === "policy_copilot" && policyCopilot && <PolicyCopilotTab data={policyCopilot} />}
          {tab === "anomalies" && anomalies && <AnomaliesTab data={anomalies} />}
          {tab === "forecast" && forecast && <ForecastTab data={forecast} hasDepartments={avail?.has_departments ?? false} />}
          {tab === "receipts" && receipts && <ReceiptsTab data={receipts} />}
          {tab === "vendors" && tabReady && <VendorsTab data={vendors} />}
          {tab === "employee_risk" && tabReady && employeeRisk && <EmployeeRiskTab data={employeeRisk} />}
          {tab === "policy_trends" && policyTrends && <PolicyTrendsTab data={policyTrends} />}
        </>
      )}
    </div>
  );
}

function riskLevelBadge(level: string): string {
  switch (level) {
    case "critical":
      return "bg-red-500/20 text-intact ring-1 ring-red-500/40";
    case "high":
      return "bg-intact-muted text-intact ring-1 ring-red-500/30";
    case "medium":
      return "bg-amber-500/15 text-amber-800 ring-1 ring-amber-500/30";
    default:
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30";
  }
}

function InsightWhy({ text }: { text: string }) {
  return (
    <p className="mb-4 rounded-lg border border-intact/20 bg-intact/5 px-4 py-2.5 text-sm text-mist-300">
      <span className="font-medium text-intact">Why this matters: </span>
      {text}
    </p>
  );
}

function IntelligenceTab({ data }: { data: IntelligenceResult }) {
  const s = data.summary;
  return (
    <>
      <InsightWhy text="Risk scores prioritize which transactions a finance manager should investigate first — ranked by deterministic rules, not gut feel." />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Scored" value={String(s.transactions_scored)} />
        <Stat label="High Risk" value={String(s.high_risk_count)} accent="text-intact" />
        <Stat label="Avg Score" value={String(s.avg_risk_score)} accent="text-amber-800" />
        <Stat label="Flagged $" value={fmtCurrency(s.flagged_amount)} accent="text-intact" />
      </div>
      <div className="mt-6">
        <Panel title="Top 10 Riskiest Transactions">
          <div className="space-y-3">
            {data.top_risky.map((tx) => (
              <RiskyTxnCard key={tx.transaction_id} tx={tx} />
            ))}
          </div>
        </Panel>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Risk by Merchant" className="chart-panel">
          <ChartView chart="hbar" data={data.charts.by_merchant} height={240} />
        </Panel>
        <Panel title="Risk by Category" className="chart-panel">
          <ChartView chart="bar" data={data.charts.by_category} height={240} />
        </Panel>
        <Panel title="Risk by Month" className="chart-panel">
          <ChartView chart="line" data={data.charts.by_month} height={220} />
        </Panel>
        <Panel title="Risk by Country" className="chart-panel">
          <ChartView chart="hbar" data={data.charts.by_country} height={220} />
        </Panel>
      </div>
    </>
  );
}

function RiskyTxnCard({ tx }: { tx: RiskyTransaction }) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-cream-100 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-charcoal">{tx.merchant_name}</p>
          <p className="text-sm text-mist-400">
            {tx.date} · {fmtCurrency(tx.amount)} · {tx.category_label} · {tx.country}
          </p>
          <p className="text-xs text-mist-500">{humanGroupLabel(tx.cardholder_label)}</p>
        </div>
        <div className="text-right">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${riskLevelBadge(tx.severity)}`}>
            {tx.risk_score} · {tx.severity}
          </span>
          <p className="mt-1 text-[10px] text-mist-500">{Math.round(tx.confidence * 100)}% confidence</p>
        </div>
      </div>
      <p className="mt-2 text-sm text-mist-200">{tx.explanation}</p>
      <p className="mt-1 text-xs text-amber-900/80">Why it matters: {tx.why_it_matters}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {tx.flags.map((f) => (
          <span key={f.id} className="rounded-md bg-cream-100 px-2 py-0.5 text-[10px] text-mist-300" title={f.why_it_matters}>
            {f.message} (+{f.points})
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs text-intact">→ {tx.recommended_action}</p>
    </div>
  );
}

function LeaksTab({ data }: { data: LeaksResult }) {
  const s = data.summary;
  return (
    <>
      <InsightWhy text="Recurring charges and rising merchant spend from your uploaded file — totals shown are observed amounts, not annualized projections." />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Stat label="Leaks Found" value={String(s.leak_count)} accent="text-amber-800" />
        <Stat label="Total in File" value={fmtCurrency(s.total_observed_impact)} accent="text-intact" />
        <Stat label="Top Monthly" value={fmtCurrency(s.top_monthly_impact)} accent="text-intact" />
      </div>
      <div className="mt-6 space-y-3">
        {data.leaks.map((leak, i) => (
          <div key={`${leak.leak_type}-${leak.merchant_name}-${i}`} className="rounded-xl border border-[color:var(--border)] bg-cream-100 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${severityBadge(leak.severity)}`}>{leak.leak_type}</span>
                <p className="mt-2 font-medium text-charcoal">{leak.merchant_name}</p>
                <p className="text-xs text-mist-500">{leak.evidence}</p>
              </div>
              <div className="text-right text-sm">
                <p className="text-amber-800">{fmtCurrency(leak.monthly_impact)}/mo</p>
                <p className="text-mist-400">{fmtCurrency(leak.total_impact)} total</p>
                <p className="text-xs text-mist-500">{leak.transaction_count} txns</p>
              </div>
            </div>
            <p className="mt-2 text-sm text-intact">→ {leak.suggested_action}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function HiddenTab({ data }: { data: HiddenInsightsResult }) {
  return (
    <>
      <InsightWhy text="Patterns you would not spot in a spreadsheet — MCC growth spikes, merchant concentration, and cross-border exposure surfaced automatically." />
      <div className="card mb-6 border-intact/20 bg-intact-muted p-5 sm:p-6">
        <h3 className="text-lg font-bold text-charcoal">{data.title}</h3>
        <p className="mt-1 text-sm text-mist-400">{data.subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {data.insights.map((ins) => (
          <div key={ins.id} className="card p-5 transition-colors hover:border-intact/25">
            <span className="rounded-full bg-intact-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-intact">
              {ins.category}
            </span>
            <h4 className="mt-2 font-semibold text-charcoal">{ins.title}</h4>
            <p className="mt-2 text-sm text-mist-300">{ins.detail}</p>
            <p className="mt-2 text-xs italic text-amber-900/70">Surprise: {ins.surprise_factor}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function PolicyCopilotTab({ data }: { data: PolicyCopilotResult }) {
  const statusColor = (s: string) =>
    s === "violation" ? "text-intact" : s === "needs_review" ? "text-amber-800" : "text-emerald-700";

  return (
    <>
      <InsightWhy text="Every transaction gets a compliant / needs review / violation assessment with policy clause citation — receipt and approval checks skip when columns are absent." />
      <p className="mb-4 text-xs text-mist-500">{data.transparency}</p>
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Stat label="Compliant" value={String(data.summary.compliant ?? 0)} accent="text-emerald-700" />
        <Stat label="Needs Review" value={String(data.summary.needs_review ?? 0)} accent="text-amber-800" />
        <Stat label="Violations" value={String(data.summary.violation ?? 0)} accent="text-intact" />
      </div>
      <div className="space-y-3">
        {data.assessments.map((a) => (
          <div key={a.transaction_id} className="rounded-xl border border-[color:var(--border)] bg-cream-100 p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-charcoal">{a.merchant_name}</p>
                <p className="text-mist-400">{a.date} · {fmtCurrency(a.amount)} · {humanGroupLabel(a.cardholder_label)}</p>
              </div>
              <span className={`font-semibold uppercase ${statusColor(a.status)}`}>{a.status.replace("_", " ")}</span>
            </div>
            <p className="mt-2 text-mist-200">{a.explanation}</p>
            <p className="mt-1 text-xs text-mist-500">Policy: {a.policy_clause}</p>
            {a.missing_evidence.length > 0 && (
              <p className="mt-1 text-xs text-amber-800">Missing: {a.missing_evidence.join(", ")}</p>
            )}
            <p className="mt-1 text-xs text-intact">→ {a.recommended_next_step}</p>
            {a.false_positive_warning && (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900">
                ⚠ {a.false_positive_warning}
              </p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function AnomaliesTab({ data }: { data: AnomalyScan }) {
  const s = data.summary;
  return (
    <>
      <InsightWhy text="Statistical and pattern-based signals — duplicate charges, velocity spikes, round amounts, and unusual merchants — complement policy rules." />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Signals" value={String(s.total_signals)} />
        <Stat label="High" value={String(s.high)} accent="text-intact" />
        <Stat label="Medium" value={String(s.medium)} accent="text-amber-800" />
        <Stat label="Flagged $" value={fmtCurrency(s.flagged_amount)} accent="text-intact" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="By signal type" className="lg:col-span-1">
          <div className="space-y-2">
            {Object.entries(s.by_type).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-mist-200">{k.replace(/_/g, " ")}</span>
                <span className="text-mist-400">{v}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Top signals" className="lg:col-span-2">
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {data.signals.slice(0, 25).map((sig) => (
              <div key={sig.signal_id} className="rounded-xl border border-[color:var(--border)] bg-cream-100 p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${severityBadge(sig.severity)}`}>
                    {sig.signal_type.replace(/_/g, " ")}
                  </span>
                  <span className="text-mist-400">{sig.date}</span>
                </div>
                <p className="mt-1 text-mist-100">{sig.message}</p>
                <p className="mt-1 text-xs text-mist-400">{cardholderLabel(sig)} · {sig.recommended_action}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

function ForecastTab({ data, hasDepartments }: { data: ForecastResult; hasDepartments: boolean }) {
  return (
    <>
      {!hasDepartments && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-mist-300">
          {L.insights.noDept}
        </div>
      )}
      {data.alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {data.alerts.map((a) => (
            <div
              key={a.department}
              className={`rounded-xl border px-4 py-3 text-sm ${
                a.severity === "high"
                  ? "border-intact/30 bg-intact-muted text-intact"
                  : "border-amber-500/40 bg-amber-50 text-amber-900"
              }`}
            >
              {a.message}
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {data.departments.map((d) => (
          <Panel key={d.department} title={d.department}>
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className={d.status === "Over budget" ? "text-intact" : d.status === "At risk" ? "text-amber-800" : "text-emerald-700"}>
                {d.status} · {d.utilization_pct}%
              </span>
              {d.weeks_to_overrun !== null && d.weeks_to_overrun <= 8 && (
                <span className="text-xs text-mist-400">
                  {d.weeks_to_overrun === 0 ? "Over now" : `Over by week ${d.weeks_to_overrun}`}
                </span>
              )}
            </div>
            <ChartView chart="line" data={d.history} height={160} />
            <div className="mt-2 flex justify-between text-xs text-mist-400">
              <span>Run-rate {fmtCurrency(d.run_rate)}/mo</span>
              <span>Budget {fmtCurrency(d.monthly_budget)}/mo</span>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}

function ReceiptsTab({ data }: { data: ReceiptStatus }) {
  if (data.data_available === false) {
    return (
      <DataEmptyState
        title="Receipt data is not available in the uploaded Excel."
        body={
          data.note ??
          "This file has no receipt status column. Receipt compliance is not scored or invented."
        }
      />
    );
  }
  const s = data.summary;
  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Compliance" value={`${s.compliance_rate_pct}%`} accent="text-emerald-700" />
        <Stat label="Matched" value={String(s.receipts_matched)} />
        <Stat label="Missing" value={String(s.receipts_missing)} accent="text-amber-800" />
        <Stat label="Missing $" value={fmtCurrency(s.missing_amount)} accent="text-intact" />
      </div>
      <div className="mt-6 table-container overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[color:var(--border)] bg-cream-100 text-xs uppercase text-mist-400">
            <tr>
              <th className="px-4 py-3">{L.table.date}</th>
              <th className="px-4 py-3">{L.table.who}</th>
              <th className="px-4 py-3">{L.table.merchant}</th>
              <th className="px-4 py-3 text-right">{L.table.amount}</th>
              <th className="px-4 py-3">Days without receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--border)]">
            {data.unmatched.slice(0, 30).map((r) => (
              <tr key={r.transaction_id}>
                <td className="px-4 py-3 text-mist-300">{r.date}</td>
                <td className="px-4 py-3 text-charcoal">{cardholderLabel(r)}</td>
                <td className="px-4 py-3 text-mist-200">{r.merchant_name}</td>
                <td className="px-4 py-3 text-right">{fmtCurrency(r.amount)}</td>
                <td className="px-4 py-3 text-amber-800">{r.days_since}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function VendorsTab({ data }: { data: VendorGroup[] }) {
  return (
    <div>
      <InsightWhy text="Vendor fragmentation in your uploaded file — non-top vendor spend is the amount not going to the dominant vendor in each category." />
      <p className="mb-4 text-sm text-mist-400">
        All amounts are from your Excel file. No savings scenarios are modeled.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {data.map((v) => (
          <Panel key={v.category} title={`${v.category} · ${v.vendor_count} vendors`}>
            <p className="mb-1 text-xs text-intact">{v.recommendation}</p>
            <p className="mb-3 text-sm text-mist-300">
              Non-top vendor spend: <span className="font-semibold text-intact">{fmtCurrency(v.non_top_spend)}</span>
            </p>
            <p className="mb-3 text-xs text-mist-500">
              Top: {v.top_vendor} ({fmtCurrency(v.top_vendor_spend)}) · {v.concentration_pct ?? 0}% concentration
            </p>
            <ChartView chart="bar" data={v.vendors} height={180} />
          </Panel>
        ))}
      </div>
    </div>
  );
}

function EmployeeRiskTab({ data }: { data: EmployeeSummary[] }) {
  const high = data.filter((e) => (e.risk_score ?? 0) >= 50);
  const showDept = data.some((e) => e.department?.trim());
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label={L.insights.cardsListed} value={String(data.length)} />
        <Stat label="Needs attention" value={String(high.length)} accent="text-intact" />
        <Stat label="Many broken rules" value={String(data.filter((e) => e.badges?.includes("Repeat Offender")).length)} accent="text-amber-800" />
        <Stat label={L.card.missingReceipts} value={String(data.filter((e) => e.badges?.includes("Missing Receipts")).length)} />
      </div>
      <div className="table-container overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[color:var(--border)] bg-cream-100 text-xs uppercase text-mist-400">
            <tr>
              <th className="px-4 py-3">{L.insights.who}</th>
              {showDept && <th className="px-4 py-3">{L.table.department}</th>}
              <th className="px-4 py-3 text-right">{L.card.totalSpent}</th>
              <th className="px-4 py-3 text-right">{L.insights.brokenRules}</th>
              <th className="px-4 py-3 text-right">{L.table.risk}</th>
              <th className="px-4 py-3">Flags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--border)]">
            {data.slice(0, 30).map((e) => (
              <tr key={e.employee_id}>
                <td className="px-4 py-3 font-medium text-charcoal">{cardholderLabel(e)}</td>
                {showDept && <td className="px-4 py-3 text-mist-300">{e.department}</td>}
                <td className="px-4 py-3 text-right text-mist-200">{fmtCurrency(e.total_spend ?? 0)}</td>
                <td className="px-4 py-3 text-right text-amber-800">{e.violation_count ?? 0}</td>
                <td className={`px-4 py-3 text-right font-semibold ${(e.risk_score ?? 0) >= 50 ? "text-intact" : "text-emerald-700"}`}>
                  {e.risk_score} · {e.risk_level}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {e.badges?.map((b) => (
                      <span key={b} className="rounded-full bg-cream-200 px-2 py-0.5 text-[10px] text-mist-300">{b}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PolicyTrendsTab({ data }: { data: PolicyTrends }) {
  const byRule = Object.entries(data.by_rule_count).map(([name, value]) => ({ name, value }));
  const byAmount = Object.entries(data.by_rule_amount).map(([name, value]) => ({ name, value }));
  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Violations by Rule">
          <ChartView chart="bar" data={byRule.slice(0, 10)} height={240} />
        </Panel>
        <Panel title="Flagged Amount by Rule">
          <ChartView chart="bar" data={byAmount.slice(0, 10)} height={240} />
        </Panel>
      </div>
      <div className="mt-4">
        <Panel title="Monthly Violation Trend">
          <ChartView chart="line" data={data.monthly_trends} height={220} />
        </Panel>
      </div>
    </>
  );
}

function Stat({ label, value, accent = "text-charcoal" }: { label: string; value: string; accent?: string }) {
  return (
    <div className="stat-card">
      <p className="text-xs uppercase tracking-wide text-mist-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}
