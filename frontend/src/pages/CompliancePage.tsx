import { Fragment, useEffect, useMemo, useState } from "react";
import {
  dismissViolation,
  explainViolation,
  getCompliance,
  getMeta,
  getPolicy,
  updatePolicy,
  updateViolationStatus,
} from "../api/smb";
import ChartView from "../components/ChartView";
import WorkflowStatusPicker, { type WorkflowStatus } from "../components/WorkflowStatusPicker";
import { Panel } from "../components/ui/Card";
import PageHeader, {
  cardholderLabel,
  fmtCurrency,
  humanGroupLabel,
  humanRuleId,
  humanSeverity,
  severityBadge,
  Spinner,
} from "../components/ui/PageHeader";
import { useDataVersion } from "../hooks/useDataVersion";
import { DEMO_BUNDLE } from "../data/demoBundle";
import { PAGES } from "../copy";
import { L, RULE_NAMES } from "../labels";
import type { ComplianceResult, DataAvailability, PolicyConfig, Violation } from "../types/smb";

function violationStatus(v: Violation, overrides: Record<string, string>): string {
  return overrides[v.violation_id] ?? v.workflow_status ?? "New";
}

function riskColor(score?: number): string {
  if (!score) return "text-mist-300";
  if (score >= 75) return "text-intact";
  if (score >= 50) return "text-amber-800";
  if (score >= 25) return "text-amber-700";
  return "text-emerald-700";
}

export default function CompliancePage() {
  const dataVersion = useDataVersion();
  const [data, setData] = useState<ComplianceResult | null>(DEMO_BUNDLE.compliance);
  const [policy, setPolicy] = useState<PolicyConfig | null>(DEMO_BUNDLE.policy);
  const [severity, setSeverity] = useState("");
  const [dept, setDept] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [explaining, setExplaining] = useState<string | null>(null);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const [statusSaving, setStatusSaving] = useState<string | null>(null);
  const [avail, setAvail] = useState<DataAvailability | null>(null);

  function reload(force = false) {
    setFetching(true);
    getCompliance(force).then(setData).finally(() => setFetching(false));
  }
  useEffect(() => {
    if (!policy) getPolicy().then(setPolicy);
    getMeta().then((m) => setAvail(m.data_availability ?? null));
    reload();
  }, [dataVersion]);

  const showDept = avail?.has_departments ?? false;
  const receiptDataAvailable = avail?.has_receipt_column ?? false;
  const tipDataAvailable = avail?.has_tip_column ?? false;

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.violations.filter(
      (v) =>
        (!severity || v.severity === severity) && (!dept || v.department === dept),
    );
  }, [data, severity, dept]);

  const departments = useMemo(
    () =>
      data && showDept
        ? Array.from(new Set(data.violations.map((v) => v.department).filter(Boolean))).sort()
        : [],
    [data, showDept],
  );

  async function onExplain(v: Violation) {
    if (explanations[v.violation_id]) return;
    setExplaining(v.violation_id);
    try {
      const res = await explainViolation(v.violation_id);
      setExplanations((prev) => ({ ...prev, [v.violation_id]: res.explanation }));
    } finally {
      setExplaining(null);
    }
  }

  async function onStatusChange(v: Violation, status: WorkflowStatus) {
    const prev = violationStatus(v, statusOverrides);
    setStatusOverrides((o) => ({ ...o, [v.violation_id]: status }));
    setStatusSaving(v.violation_id);
    try {
      await updateViolationStatus(v.violation_id, status, "", { skipCache: true });
    } catch {
      setStatusOverrides((o) => {
        const next = { ...o };
        if (prev === (v.workflow_status ?? "New")) delete next[v.violation_id];
        else next[v.violation_id] = prev;
        return next;
      });
    } finally {
      setStatusSaving(null);
    }
  }

  async function onDismiss(v: Violation) {
    await dismissViolation(v.violation_id, "Reviewed and accepted");
    reload();
  }

  async function toggleRule(rule: string) {
    if (!policy) return;
    setSavingPolicy(true);
    const next = { ...policy.rules, [rule]: !policy.rules[rule] };
    const updated = await updatePolicy({ rules: next });
    setPolicy(updated);
    setSavingPolicy(false);
    reload();
  }

  async function updateCap(field: "approval_cap" | "receipt_threshold", value: number) {
    if (!policy) return;
    const updated = await updatePolicy({ [field]: value });
    setPolicy(updated);
    reload();
  }

  if (!data && fetching)
    return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><Spinner /></div>;
  if (!data)
    return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><Spinner /></div>;

  const s = data.summary;
  const byRule = Object.entries(s.by_rule).sort((a, b) => b[1] - a[1]);
  const amountByRule = data.amount_by_rule
    ? Object.entries(data.amount_by_rule).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        title={PAGES.compliance.title}
        subtitle={PAGES.compliance.subtitle}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="stat-card">
          <p className="text-xs uppercase tracking-wide text-mist-400">{L.compliance.brokenRules}</p>
          <p className="mt-2 text-3xl font-bold text-charcoal">{s.total_violations}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs uppercase tracking-wide text-mist-400">{L.compliance.serious}</p>
          <p className="mt-2 text-3xl font-bold text-intact">{s.high}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs uppercase tracking-wide text-mist-400">{L.compliance.medium}</p>
          <p className="mt-2 text-3xl font-bold text-amber-800">{s.medium}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs uppercase tracking-wide text-mist-400">{L.compliance.flaggedMoney}</p>
          <p className="mt-2 text-3xl font-bold text-intact">
            {fmtCurrency(s.flagged_amount)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title={L.compliance.byRule} className="lg:col-span-1">
          <div className="space-y-2">
            {byRule.map(([rule, count]) => (
              <div key={rule} className="flex items-center justify-between text-sm">
                <span className="text-mist-200">{humanRuleId(rule)}</span>
                <span className="rounded-full bg-cream-100 px-2 py-0.5 text-mist-300">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        {data.trends && data.trends.length > 0 && (
          <Panel title={L.compliance.trend} className="lg:col-span-1">
            <ChartView chart="line" data={data.trends} height={200} />
          </Panel>
        )}

        {amountByRule.length > 0 && (
          <Panel title={L.compliance.flaggedByRule} className="lg:col-span-1">
            <ChartView chart="bar" data={amountByRule.slice(0, 8)} height={200} />
          </Panel>
        )}
      </div>

      {data.department_risk && data.department_risk.length > 0 && (
        <div className="mt-6">
          <Panel title={showDept ? L.compliance.riskByTeam : L.compliance.riskByCard}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-sm">
                <thead className="text-xs uppercase text-mist-400">
                  <tr>
                    <th className="px-4 py-2">{showDept ? L.table.department : L.card.one}</th>
                    <th className="px-4 py-2 text-right whitespace-nowrap">{L.compliance.brokenRules}</th>
                    <th className="px-4 py-2 text-right whitespace-nowrap">Per 100 charges</th>
                    <th className="px-4 py-2 text-right whitespace-nowrap">{L.compliance.flaggedMoney}</th>
                    <th className="px-4 py-2 whitespace-nowrap">Top spend type</th>
                    <th className="px-4 py-2 text-right whitespace-nowrap">{L.table.risk}</th>
                    {showDept && <th className="px-4 py-2 whitespace-nowrap">Budget</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--border)]">
                  {data.department_risk.map((d) => (
                    <tr key={d.department}>
                      <td className="px-4 py-2.5 font-medium text-charcoal whitespace-nowrap">
                        {humanGroupLabel(d.department)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-amber-800">{d.violation_count}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-mist-300">{d.violation_rate_per_100}%</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-mist-200 whitespace-nowrap">{fmtCurrency(d.flagged_amount)}</td>
                      <td className="px-4 py-2.5 capitalize text-mist-300 whitespace-nowrap">{d.top_category || "-"}</td>
                      <td className={`px-4 py-2.5 text-right tabular-nums font-semibold whitespace-nowrap ${riskColor(d.risk_score)}`}>{d.risk_score}</td>
                      {showDept && <td className="px-4 py-2.5 text-mist-300 whitespace-nowrap">{d.budget_status}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title={showDept ? L.compliance.repeatByTeam : L.compliance.repeat} className="lg:col-span-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-mist-400">
                <tr>
                  <th className="py-2">{L.table.who}</th>
                  {showDept && <th className="py-2">{L.table.department}</th>}
                  <th className="py-2 text-right">{L.compliance.brokenRules}</th>
                  <th className="py-2 text-right">{L.compliance.flaggedMoney}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {data.repeat_offenders.map((o) => (
                  <tr key={o.employee_id}>
                    <td className="py-2 font-medium text-charcoal">{cardholderLabel(o)}</td>
                    {showDept && <td className="py-2 text-mist-300">{o.department}</td>}
                    <td className="py-2 text-right text-amber-800">{o.violation_count}</td>
                    <td className="py-2 text-right text-mist-200">
                      {fmtCurrency(o.flagged_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title={L.compliance.companyRules}>
          {!policy ? (
            <Spinner label="Loading policy…" />
          ) : (
          <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Object.keys(RULE_NAMES).map((rule) => {
              const unavailable =
                (rule === "receipt_required" && !receiptDataAvailable) ||
                (rule === "approval_required" && !avail?.has_approval_column) ||
                (rule === "missing_purpose" && !avail?.has_business_purpose_column) ||
                (rule === "meal_context" && !avail?.has_meal_context) ||
                (rule === "excessive_tip" && !tipDataAvailable);
              return (
              <label
                key={rule}
                className={`flex items-center justify-between rounded-xl border border-[color:var(--border)] px-3 py-2 text-sm ${
                  unavailable ? "bg-cream-50 opacity-70" : "bg-cream-100"
                }`}
                title={
                  rule === "excessive_tip" && !tipDataAvailable
                    ? "Unavailable — tip column missing from Excel"
                    : unavailable
                      ? "Unavailable — required column missing from Excel"
                      : undefined
                }
              >
                <span className="text-mist-200">
                  {RULE_NAMES[rule]}
                  {unavailable && (
                    <span className="ml-1 text-[10px] text-mist-500">{L.compliance.unavailable}</span>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={!!policy.rules[rule]}
                  disabled={savingPolicy || unavailable}
                  onChange={() => toggleRule(rule)}
                  className="h-4 w-4 accent-intact-dark"
                />
              </label>
            );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            <label className="text-sm text-mist-300">
              {L.compliance.approvalCap}
              <input
                type="number"
                defaultValue={policy.approval_cap}
                onBlur={(e) => updateCap("approval_cap", Number(e.target.value))}
                className="input ml-2 w-28"
              />
            </label>
            <label className="text-sm text-mist-300">
              {L.compliance.receiptLimit}
              <input
                type="number"
                defaultValue={policy.receipt_threshold}
                onBlur={(e) => updateCap("receipt_threshold", Number(e.target.value))}
                className="input ml-2 w-28"
              />
            </label>
          </div>
          </>
          )}
        </Panel>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="input">
          <option value="">{L.compliance.allProblems}</option>
          <option value="high">{L.compliance.serious}</option>
          <option value="medium">{L.compliance.medium}</option>
          <option value="low">Small</option>
        </select>
        {showDept && (
          <select value={dept} onChange={(e) => setDept(e.target.value)} className="input">
            <option value="">{L.compliance.allTeams}</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}
        <span className="ml-auto text-sm text-mist-400">
          {filtered.length} shown
          {data.violations_total != null && data.violations_total > filtered.length
            ? ` · ${data.violations_total.toLocaleString()} total`
            : ""}
          {fetching ? " · updating…" : ""}
        </span>
      </div>

      <div className="mt-3 table-container overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-[color:var(--border)] bg-cream-100 text-xs uppercase text-mist-400">
            <tr>
              <th className="px-4 py-3">{L.table.date}</th>
              <th className="px-4 py-3">{L.table.who}</th>
              <th className="px-4 py-3">{L.table.merchant}</th>
              <th className="px-4 py-3 text-right">{L.table.amount}</th>
              <th className="px-4 py-3">{L.table.risk}</th>
              <th className="px-4 py-3">How serious</th>
              <th className="px-4 py-3">{L.table.status}</th>
              <th className="px-4 py-3">{L.table.reasons}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--border)]">
            {filtered.slice(0, 200).map((v) => (
              <Fragment key={v.violation_id}>
                <tr
                  className="cursor-pointer hover:bg-intact/5"
                  onClick={() =>
                    setExpanded(expanded === v.violation_id ? null : v.violation_id)
                  }
                >
                  <td className="px-4 py-3 text-mist-300">{v.date}</td>
                  <td className="px-4 py-3 font-medium text-charcoal">{cardholderLabel(v)}</td>
                  <td className="px-4 py-3 text-mist-200">{v.merchant_name}</td>
                  <td className="px-4 py-3 text-right text-mist-200">{fmtCurrency(v.amount)}</td>
                  <td className={`px-4 py-3 font-semibold ${riskColor(v.risk_score)}`}>
                    {v.risk_score ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${severityBadge(v.severity)}`}>
                      {humanSeverity(v.severity)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <WorkflowStatusPicker
                      status={violationStatus(v, statusOverrides)}
                      disabled={statusSaving === v.violation_id}
                      onChange={(st) => onStatusChange(v, st)}
                    />
                  </td>
                  <td className="px-4 py-3 text-mist-300">
                    {v.rules.map((r) => humanRuleId(r.rule_id)).join(" · ")}
                  </td>
                  <td className="px-4 py-3 text-mist-400">
                    {expanded === v.violation_id ? "▲" : "▼"}
                  </td>
                </tr>
                {expanded === v.violation_id && (
                  <tr>
                    <td colSpan={9} className="bg-white px-6 py-4">
                      <div className="mb-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                        {showDept && (
                          <div><span className="text-mist-400">{L.table.department}</span><p className="text-charcoal">{v.department}</p></div>
                        )}
                        <div><span className="text-mist-400">{L.table.category}</span><p className="capitalize text-charcoal">{v.category}</p></div>
                        {receiptDataAvailable ? (
                          <div><span className="text-mist-400">Receipt</span><p className={v.has_receipt ? "text-emerald-700" : "text-intact"}>{v.has_receipt ? L.compliance.receiptOk : L.compliance.receiptMissing}</p></div>
                        ) : (
                          <div><span className="text-mist-400">Receipt</span><p className="text-mist-400">{L.compliance.receiptNA}</p></div>
                        )}
                        <div><span className="text-mist-400">{L.compliance.howFound}</span><p className="text-intact">{v.deterministic !== false ? L.compliance.ruleCheck : L.compliance.aiHelp}</p></div>
                      </div>
                      <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-mist-200">
                        {v.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                      {v.rules.map((r, i) => (
                        <p key={i} className="mb-1 text-xs text-mist-500">
                          Rule {r.rule_id}: {r.message} · Source: Expense Policy · Action: {r.action}
                        </p>
                      ))}
                      {explanations[v.violation_id] && (
                        <div className="mb-3 rounded-lg border border-intact/25 bg-intact-muted p-3 text-sm text-mist-100">
                          <p className="mb-1 text-xs font-semibold uppercase text-intact">{L.compliance.policyExplain}</p>
                          {explanations[v.violation_id]}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm text-mist-400">
                          {L.compliance.recommended}: {v.recommended_action}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="btn-secondary"
                            disabled={explaining === v.violation_id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onExplain(v);
                            }}
                          >
                            {explaining === v.violation_id ? L.compliance.explaining : L.compliance.aiExplain}
                          </button>
                          <button
                            className="btn-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDismiss(v);
                            }}
                          >
                            {L.compliance.dismiss}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
