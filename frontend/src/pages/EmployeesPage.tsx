import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getEmployee, getEmployees, getMeta } from "../api/smb";
import AvailableFieldsPanel from "../components/AvailableFieldsPanel";
import ChartView from "../components/ChartView";
import { Panel } from "../components/ui/Card";
import PageHeader, { cardholderLabel, fmtCurrency, Spinner } from "../components/ui/PageHeader";
import { DEMO_BUNDLE } from "../data/demoBundle";
import { PAGES } from "../copy";
import { L } from "../labels";
import { useDataVersion } from "../hooks/useDataVersion";
import type { EmployeeProfile, EmployeeSummary } from "../types/smb";

function badgeClass(badge: string): string {
  if (badge.includes("Repeat") || badge.includes("Watchlist") || badge.includes("High Risk"))
    return "bg-intact-muted text-intact ring-1 ring-red-500/30";
  if (badge.includes("Missing")) return "bg-amber-500/15 text-amber-800 ring-1 ring-amber-500/30";
  if (badge.includes("High Spend")) return "bg-intact-muted text-intact ring-1 ring-intact/30";
  return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30";
}

export default function EmployeesPage() {
  const dataVersion = useDataVersion();
  const [list, setList] = useState<EmployeeSummary[]>(DEMO_BUNDLE.employees);
  const [selected, setSelected] = useState<EmployeeProfile | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [honestyNote, setHonestyNote] = useState("");

  useEffect(() => {
    getMeta().then((m) => {
      const avail = m.data_availability;
      if (avail && !avail.has_employee_names) {
        setHonestyNote(L.card.noNamesNote);
      }
    });
  }, [dataVersion]);

  useEffect(() => {
    setLoading(list.length === 0);
    getEmployees().then((e) => {
      setList(e);
      setLoading(false);
    });
  }, [dataVersion]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return list;
    return list.filter(
      (e) =>
        cardholderLabel(e).toLowerCase().includes(q) ||
        (e.transaction_code ?? "").toLowerCase().includes(q),
    );
  }, [list, query]);

  function openProfile(id: string) {
    setDetailLoading(true);
    getEmployee(id)
      .then(setSelected)
      .finally(() => setDetailLoading(false));
  }

  if (loading && list.length === 0) return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><Spinner /></div>;

  if (selected) {
    const p = selected;
    const peerColor = p.vs_peer_pct > 15 ? "text-intact" : p.vs_peer_pct < -10 ? "text-emerald-700" : "text-mist-200";
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <button onClick={() => setSelected(null)} className="btn-secondary mb-4">{L.card.back}</button>
        {detailLoading ? (
          <Spinner />
        ) : (
          <>
            <div className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-charcoal">{cardholderLabel(p)}</h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {p.badges?.map((b) => (
                      <span key={b} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass(b)}`}>{b}</span>
                    ))}
                  </div>
                </div>
                {p.risk_score !== undefined && (
                  <div className="rounded-xl border border-[color:var(--border)] bg-cream-100 px-4 py-3 text-right">
                    <p className="text-xs text-mist-400">{L.card.riskScore}</p>
                    <p className={`text-2xl font-bold ${p.risk_score >= 50 ? "text-intact" : "text-emerald-700"}`}>
                      {p.risk_score} · {p.risk_level}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                <MiniStat label={L.card.totalSpent} value={fmtCurrency(p.total_spend)} />
                <MiniStat label={L.card.charges} value={String(p.transaction_count)} />
                <MiniStat label={L.card.avgCharge} value={fmtCurrency(p.avg_transaction)} />
                <MiniStat label={L.card.vsOthers} value={`${p.vs_peer_pct}%`} accent={peerColor} />
                <MiniStat label={L.card.brokenRules} value={String(p.violation_count ?? 0)} accent="text-amber-800" />
                <MiniStat label={L.card.missingReceipts} value={String(p.missing_receipts ?? 0)} accent="text-intact" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Panel title={L.card.spendType}>
                <ChartView chart="pie" data={p.by_category} height={220} />
              </Panel>
              <Panel title={L.card.monthly}>
                <ChartView chart="line" data={p.by_month} height={220} />
              </Panel>
              <Panel title={L.card.topStores} className="lg:col-span-2">
                <ChartView chart="bar" data={p.top_merchants} height={200} />
              </Panel>
            </div>
            <div className="mt-4 flex gap-3">
              <Link to="/compliance" className="btn-secondary text-sm">{L.card.viewRules}</Link>
              <Link to="/approvals" className="btn-secondary text-sm">{L.card.viewApprove}</Link>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        title={PAGES.employees.title}
        subtitle={`${list.length} company cards in your file.`}
      />
      {honestyNote && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-mist-300">
          {honestyNote}
        </div>
      )}
      <AvailableFieldsPanel className="mb-4" />
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={L.card.search}
          className="input max-w-md"
        />
        <span className="self-center text-sm text-mist-400">{filtered.length} shown</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((e) => (
          <button
            key={e.employee_id}
            onClick={() => openProfile(e.employee_id)}
            className="card p-4 text-left transition-all hover:border-intact hover:shadow-glow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-charcoal">{cardholderLabel(e)}</p>
              </div>
              {e.risk_score !== undefined && (
                <span className={`text-sm font-bold ${e.risk_score >= 50 ? "text-intact" : "text-emerald-700"}`}>
                  {e.risk_score}
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {e.badges?.slice(0, 3).map((b) => (
                <span key={b} className={`rounded-full px-2 py-0.5 text-[10px] ${badgeClass(b)}`}>{b}</span>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-mist-400">
              <span>{fmtCurrency(e.total_spend ?? 0)} spend</span>
              <span>{e.violation_count ?? 0} {L.card.violations}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent = "text-charcoal" }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <p className="text-xs text-mist-400">{label}</p>
      <p className={`text-lg font-bold ${accent}`}>{value}</p>
    </div>
  );
}
