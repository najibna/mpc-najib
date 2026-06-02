import { useEffect, useState } from "react";
import { decideReport, exportReport, getReport, getReports } from "../api/smb";
import ChartView from "../components/ChartView";
import AvailableFieldsPanel from "../components/AvailableFieldsPanel";
import { Panel } from "../components/ui/Card";
import PageHeader, { cardholderLabel, fmtCurrency, severityBadge, Spinner } from "../components/ui/PageHeader";
import { DEMO_BUNDLE } from "../data/demoBundle";
import { PAGES } from "../copy";
import { useDataVersion } from "../hooks/useDataVersion";
import type { ExpenseReport } from "../types/smb";

function statusBadge(status: string): string {
  switch (status) {
    case "approved":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/40";
    case "rejected":
      return "bg-intact-muted text-intact ring-1 ring-red-500/40";
    default:
      return "bg-intact-muted text-intact ring-1 ring-intact/40";
  }
}

export default function ReportsPage() {
  const dataVersion = useDataVersion();
  const [reports, setReports] = useState<ExpenseReport[]>(DEMO_BUNDLE.reports);
  const [selected, setSelected] = useState<ExpenseReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  function reload(force = false) {
    setLoading(reports.length === 0);
    getReports(force)
      .then(setReports)
      .finally(() => setLoading(false));
  }
  useEffect(() => { reload(); }, [dataVersion]);

  function open(id: string) {
    setLoadingDetail(true);
    getReport(id)
      .then(setSelected)
      .finally(() => setLoadingDetail(false));
  }

  async function doExport(format: "json" | "csv") {
    if (!selected) return;
    const res = await exportReport(selected.report_id, format);
    const blob = new Blob(
      [format === "csv" ? String(res.content) : JSON.stringify(res.content, null, 2)],
      { type: format === "csv" ? "text/csv" : "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = res.filename ?? `${selected.report_id}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function decide(decision: "approve" | "deny") {
    if (!selected) return;
    const updated = await decideReport(selected.report_id, decision);
    setSelected(updated);
    reload(true);
  }

  if (loading && reports.length === 0)
    return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><Spinner /></div>;

  if (selected) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <button onClick={() => setSelected(null)} className="btn-secondary mb-4">
          ← Back to reports
        </button>
        {loadingDetail ? (
          <Spinner label="Loading report…" />
        ) : (
          <div className="space-y-4">
            <div className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-charcoal">{selected.title}</h2>
                  <p className="mt-1 text-sm text-mist-300">
                    {cardholderLabel(selected)} · {selected.by_category?.[0]?.name ?? "-"} ·{" "}
                    {selected.transaction_count} transactions
                  </p>
                  {selected.grouping_reason && (
                    <p className="mt-2 text-xs leading-relaxed text-mist-400">
                      <span className="font-medium text-mist-300">Why grouped: </span>
                      {selected.grouping_reason}
                      {selected.grouping_type ? ` (${selected.grouping_type.replace(/_/g, " ")})` : ""}
                      {selected.location ? ` · ${selected.location}` : ""}
                    </p>
                  )}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge(selected.status)}`}>
                  {selected.status}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="text-2xl font-bold text-intact">{fmtCurrency(selected.total)}</p>
                {selected.receipt_data_available && selected.missing_receipts !== undefined && selected.missing_receipts > 0 && (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-800">
                    {selected.missing_receipts} missing receipts
                  </span>
                )}
                {selected.receipt_data_available === false && (
                  <span className="rounded-full bg-cream-200 px-2 py-0.5 text-xs text-mist-400">
                    Receipt data unavailable
                  </span>
                )}
                <div className="ml-auto flex gap-2">
                  <button onClick={() => doExport("csv")} className="btn-secondary text-xs">Export CSV</button>
                  <button onClick={() => doExport("json")} className="btn-secondary text-xs">Export JSON</button>
                </div>
              </div>
              {selected.ai_summary && (
                <div className="mt-4 rounded-xl border border-[color:var(--border)] bg-cream-100 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-mist-400">
                    Summary
                  </p>
                  <p className="text-sm leading-relaxed text-mist-100">
                    {selected.ai_summary}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Panel title="Spend by Category">
                <ChartView chart="pie" data={selected.by_category} height={240} />
              </Panel>
              {selected.by_merchant && selected.by_merchant.length > 0 && (
                <Panel title="Spend by Merchant">
                  <ChartView chart="bar" data={selected.by_merchant} height={240} />
                </Panel>
              )}
            </div>

            <Panel title={`Policy Checks (${selected.policy_flag_count})`}>
              {selected.policy_flags.length === 0 ? (
                <p className="text-sm text-emerald-700">No policy issues detected.</p>
              ) : (
                <ul className="space-y-2">
                  {selected.policy_flags.map((f) => (
                    <li
                      key={f.transaction_id}
                      className="rounded-xl border border-[color:var(--border)] bg-cream-100 p-3 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-charcoal">{f.merchant_name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${severityBadge(f.severity)}`}>
                          {fmtCurrency(f.amount)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-mist-400">{f.reasons.join("; ")}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Transactions">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-mist-400">
                    <tr>
                      <th className="py-2">Date</th>
                      <th className="py-2">Merchant</th>
                      <th className="py-2">Category</th>
                      <th className="py-2 text-right">Amount</th>
                      {selected.receipt_data_available !== false && (
                        <th className="py-2">Receipt</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--border)]">
                    {selected.transactions?.map((t) => (
                      <tr key={t.transaction_id}>
                        <td className="py-2 text-mist-300">{t.date}</td>
                        <td className="py-2 text-charcoal">
                          {t.merchant_name}
                          {t.flags.length > 0 && (
                            <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-800">
                              {t.flags.join(",")}
                            </span>
                          )}
                        </td>
                        <td className="py-2 capitalize text-mist-300">{t.category}</td>
                        <td className="py-2 text-right text-mist-200">{fmtCurrency(t.amount)}</td>
                        {selected.receipt_data_available !== false && (
                          <td className="py-2">
                            {t.has_receipt === null ? (
                              <span className="text-mist-400">n/a</span>
                            ) : t.has_receipt ? (
                              <span className="text-emerald-700">✓</span>
                            ) : (
                              <span className="text-intact">missing</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            {selected.status === "draft" || selected.status === "submitted" ? (
              <div className="flex gap-3">
                <button onClick={() => decide("approve")} className="btn-primary flex-1">
                  Approve report
                </button>
                <button
                  onClick={() => decide("deny")}
                  className="btn flex-1 bg-red-500/90 text-charcoal hover:bg-red-500"
                >
                  Reject
                </button>
              </div>
            ) : (
              <p className="text-sm text-mist-400">
                {selected.status === "approved" ? "Approved" : "Rejected"} by{" "}
                {selected.decided_by} on {selected.decided_at?.slice(0, 10)}.
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader title={PAGES.reports.title} subtitle={PAGES.reports.subtitle}
      />

      <AvailableFieldsPanel className="mb-6" />
      {reports.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-semibold text-charcoal">No reports yet</p>
          <p className="mt-2 max-w-md text-sm text-mist-400">
            Reports group related card activity by merchant clusters, category bursts, location, or monthly fallback.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => (
            <button
              key={r.report_id}
              onClick={() => open(r.report_id)}
              className="card p-5 text-left transition-all hover:border-intact hover:shadow-glow-sm"
            >
              <div className="flex items-start justify-between">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge(r.status)}`}>
                  {r.status}
                </span>
                {r.policy_flag_count > 0 && (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-800">
                    {r.policy_flag_count} flags
                  </span>
                )}
              </div>
              <h3 className="mt-3 font-semibold text-charcoal">{r.title}</h3>
              {r.grouping_reason && (
                <p className="mt-1 line-clamp-2 text-xs text-mist-400">{r.grouping_reason}</p>
              )}
              <p className="mt-1 text-sm text-mist-300">
                {cardholderLabel(r)} · {fmtCurrency(r.total)}
              </p>
              <p className="mt-3 text-2xl font-bold text-intact">{fmtCurrency(r.total)}</p>
              <p className="text-xs text-mist-400">{r.transaction_count} transactions</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
