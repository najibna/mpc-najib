import { useCallback, useEffect, useMemo, useState } from "react";
import {
  bulkDecideApprovals,
  createApprovalRequest,
  decideApproval,
  getApproval,
  getApprovals,
  getEmployees,
  undoApproval,
} from "../api/smb";
import AvailableFieldsPanel from "../components/AvailableFieldsPanel";
import PageHeader, { cardholderLabel, fmtCurrency, Spinner } from "../components/ui/PageHeader";
import { DEMO_BUNDLE } from "../data/demoBundle";
import { PAGES } from "../copy";
import { formatCardNumber, L } from "../labels";
import type { ApprovalRequest } from "../types/smb";

type SortKey = "risk" | "amount" | "date";

export default function ApprovalsPage() {
  const [all, setAll] = useState<ApprovalRequest[]>(() =>
    DEMO_BUNDLE.approvals.filter((a) => a.status === "pending"),
  );
  const [idx, setIdx] = useState(0);
  const [detail, setDetail] = useState<ApprovalRequest | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [history, setHistory] = useState<{ id: string; decision: string }[]>([]);
  const [loaded, setLoaded] = useState(true);
  const [deptFilter, setDeptFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("risk");
  const [showWhy, setShowWhy] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [cardCodes, setCardCodes] = useState<string[]>(() =>
    DEMO_BUNDLE.employees
      .map((e) => e.transaction_code || e.employee_id)
      .filter(Boolean)
      .slice(0, 30),
  );
  const [form, setForm] = useState({
    requester_name: "",
    card_code: "",
    department: "",
    amount: "",
    merchant: "",
    category: "general",
    business_purpose: "",
    date: "",
    notes: "",
  });
  const [formSuccess, setFormSuccess] = useState("");

  function reload() {
    getApprovals().then((items) => {
      setAll(items.filter((a) => a.status === "pending"));
      setLoaded(true);
    });
  }
  useEffect(() => reload(), []);
  useEffect(() => {
    getEmployees().then((emps) => {
      setCardCodes(
        emps
          .map((e) => e.transaction_code || e.employee_id)
          .filter(Boolean)
          .slice(0, 30),
      );
    });
  }, []);

  async function submitPreApproval(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      setFormError("Enter a valid amount.");
      return;
    }
    setFormBusy(true);
    setFormError("");
    try {
      const created = await createApprovalRequest({
        requester_name: form.requester_name,
        card_code: form.card_code,
        department: form.department || undefined,
        amount,
        merchant: form.merchant,
        category: form.category,
        business_purpose: form.business_purpose,
        date: form.date || undefined,
        notes: form.notes,
      });
      setFormSuccess(`Request ${created.request_id} added to the review queue.`);
      setForm({
        requester_name: "",
        card_code: form.card_code,
        department: "",
        amount: "",
        merchant: "",
        category: "general",
        business_purpose: "",
        date: "",
        notes: "",
      });
      setShowForm(false);
      reload();
    } catch {
      setFormError("Could not create request. Check the backend is running.");
    } finally {
      setFormBusy(false);
    }
  }

  const departments = useMemo(
    () => Array.from(new Set(all.map((a) => a.department).filter(Boolean))).sort(),
    [all],
  );
  const showDeptFilter = departments.length > 0;

  const queue = useMemo(() => {
    let items = [...all];
    if (deptFilter) items = items.filter((a) => a.department === deptFilter);
    items.sort((a, b) => {
      if (sortBy === "amount") return b.amount - a.amount;
      if (sortBy === "date") return String(b.date).localeCompare(String(a.date));
      const ra = a.recommendation?.risk_score ?? 0;
      const rb = b.recommendation?.risk_score ?? 0;
      return rb - ra;
    });
    return items;
  }, [all, deptFilter, sortBy]);

  const current = queue[idx];

  useEffect(() => {
    setIdx(0);
  }, [deptFilter, sortBy]);

  useEffect(() => {
    if (!current) {
      setDetail(null);
      return;
    }
    setLoadingDetail(true);
    getApproval(current.request_id)
      .then(setDetail)
      .finally(() => setLoadingDetail(false));
  }, [current]);

  const decide = useCallback(
    async (decision: "approve" | "deny" | "needs_info", note = "") => {
      if (!current) return;
      await decideApproval(current.request_id, decision, note);
      setHistory((h) => [...h, { id: current.request_id, decision }]);
      setAll((q) => q.filter((a) => a.request_id !== current.request_id));
      setIdx((i) => Math.min(i, Math.max(0, queue.length - 2)));
    },
    [current, queue.length],
  );

  const skip = useCallback(() => {
    if (queue.length <= 1) return;
    setIdx((i) => (i + 1) % queue.length);
  }, [queue.length]);

  const undo = useCallback(async () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    try {
      await undoApproval(last.id);
      setHistory((h) => h.slice(0, -1));
      reload();
    } catch {
      /* server rejected undo */
    }
  }, [history]);

  async function bulkApproveLowRisk() {
    const low = queue.filter(
      (a) => (a.recommendation?.risk_score ?? 100) < 35 && a.recommendation?.decision === "approve",
    );
    if (!low.length) return;
    await bulkDecideApprovals(
      low.map((a) => a.request_id),
      "approve",
      "Bulk approved (low risk)",
    );
    setAll((q) => q.filter((a) => !low.find((l) => l.request_id === a.request_id)));
  }

  async function bulkDenyHighRisk() {
    const high = queue.filter((a) => (a.recommendation?.risk_score ?? 0) >= 60);
    if (!high.length) return;
    await bulkDecideApprovals(
      high.map((a) => a.request_id),
      "deny",
      "Bulk denied (high risk)",
    );
    setAll((q) => q.filter((a) => !high.find((h) => h.request_id === a.request_id)));
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
        return;
      const k = e.key.toLowerCase();
      if (k === "a") decide("approve");
      else if (k === "d") decide("deny");
      else if (k === "u") undo();
      else if (k === "s" || e.key === "ArrowRight") skip();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide, skip, undo]);

  if (!loaded) return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6"><Spinner /></div>;

  const reviewed = history.length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <PageHeader
        title={PAGES.approvals.title}
        subtitle={PAGES.approvals.subtitle}
        actions={
          <div className="hidden items-center gap-2 text-xs text-mist-400 sm:flex">
            <Kbd>A</Kbd> approve <Kbd>D</Kbd> deny <Kbd>S</Kbd> skip <Kbd>U</Kbd> undo
          </div>
        }
      />

      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-mist-200">
        <span className="font-medium text-amber-900">Post-transaction review — </span>
        This Excel contains historical card transactions, not pre-spend requests. This queue reviews flagged spend after it happened.
      </div>

      {formSuccess && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {formSuccess}
          <button type="button" onClick={() => setFormSuccess("")} className="ml-3 text-xs text-mist-500 hover:text-mist-300">
            Dismiss
          </button>
        </div>
      )}

      <AvailableFieldsPanel className="mb-4" />

      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="btn-secondary text-sm"
        >
          {showForm ? L.approve.hideForm : `+ ${L.approve.newRequest}`}
        </button>
        {showForm && (
          <form onSubmit={submitPreApproval} className="card mt-3 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
            <label className="text-sm text-mist-300">
              {L.approve.requester}
              <input
                value={form.requester_name}
                onChange={(e) => setForm((f) => ({ ...f, requester_name: e.target.value }))}
                className="input mt-1 w-full"
                placeholder="Optional"
              />
            </label>
            <label className="text-sm text-mist-300">
              {L.approve.card}
              <select
                value={form.card_code}
                onChange={(e) => setForm((f) => ({ ...f, card_code: e.target.value }))}
                className="input mt-1 w-full"
              >
                <option value="">{L.approve.pickCard}</option>
                {cardCodes.map((c) => {
                  const code = c.replace(/^Code\s+/i, "");
                  return (
                    <option key={c} value={code}>
                      {formatCardNumber(code)}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="text-sm text-mist-300">
              {L.approve.team} <span className="text-mist-500">(optional)</span>
              <input
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                className="input mt-1 w-full"
                placeholder="Not in uploaded Excel"
              />
            </label>
            <label className="text-sm text-mist-300">
              {L.approve.amount}
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="input mt-1 w-full"
              />
            </label>
            <label className="text-sm text-mist-300">
              {L.approve.store}
              <input
                value={form.merchant}
                onChange={(e) => setForm((f) => ({ ...f, merchant: e.target.value }))}
                className="input mt-1 w-full"
              />
            </label>
            <label className="text-sm text-mist-300">
              {L.approve.spendType}
              <input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="input mt-1 w-full"
              />
            </label>
            <label className="text-sm text-mist-300">
              {L.approve.date}
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="input mt-1 w-full"
              />
            </label>
            <label className="text-sm text-mist-300 sm:col-span-2">
              {L.approve.why}
              <input
                value={form.business_purpose}
                onChange={(e) => setForm((f) => ({ ...f, business_purpose: e.target.value }))}
                className="input mt-1 w-full"
              />
            </label>
            <label className="text-sm text-mist-300 sm:col-span-2">
              {L.approve.notes}
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="input mt-1 w-full"
                rows={2}
              />
            </label>
            {formError && <p className="sm:col-span-2 text-sm text-intact">{formError}</p>}
            <div className="sm:col-span-2">
              <button type="submit" disabled={formBusy} className="btn-primary">
                {formBusy ? "Submitting…" : L.approve.submit}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        {showDeptFilter && (
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="input">
            <option value="">{L.compliance.allTeams}</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        )}
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className="input">
          <option value="risk">{L.approve.sortRisk}</option>
          <option value="amount">{L.approve.sortAmount}</option>
          <option value="date">{L.approve.sortDate}</option>
        </select>
        <button onClick={bulkApproveLowRisk} className="btn-secondary text-xs">{L.approve.bulkOk}</button>
        <button onClick={bulkDenyHighRisk} className="btn-secondary text-xs">{L.approve.bulkNo}</button>
        <span className="ml-auto text-sm text-mist-400">
          {queue.length} {L.approve.pending} · {reviewed} {L.approve.reviewed}
        </span>
        {history.length > 0 && (
          <button onClick={undo} className="btn-secondary text-xs">Undo last</button>
        )}
      </div>

      {queue.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          {queue.map((q, i) => (
            <button
              key={q.request_id}
              onClick={() => setIdx(i)}
              className={`shrink-0 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                i === idx
                  ? "border-intact/60 bg-intact-muted text-charcoal"
                  : "border-[color:var(--border)] bg-cream-100 text-mist-300 hover:text-charcoal"
              }`}
            >
              <p className="font-medium">{cardholderLabel(q)}</p>
              <p className="text-mist-400">{fmtCurrency(q.amount)}</p>
            </button>
          ))}
        </div>
      )}

      {!current ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-intact-gradient text-2xl text-white shadow-glow-sm">✓</div>
          <p className="text-lg font-semibold text-charcoal">{L.approve.allDone}</p>
          <p className="mt-1 text-sm text-mist-300">{L.approve.allDoneHelp}</p>
        </div>
      ) : loadingDetail || !detail ? (
        <Spinner label="Loading request…" />
      ) : (
        <RequestCard
          req={detail}
          showWhy={showWhy}
          onToggleWhy={() => setShowWhy((s) => !s)}
          onApprove={() => decide("approve")}
          onDeny={() => decide("deny")}
          onNeedsInfo={() => decide("needs_info", "Please provide receipt and business purpose")}
          onSkip={skip}
        />
      )}
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-[color:var(--border)] bg-cream-100 px-1.5 py-0.5 font-mono text-[11px] text-mist-200">
      {children}
    </kbd>
  );
}

function riskColor(score?: number): string {
  if (!score) return "text-mist-300";
  if (score >= 75) return "text-intact";
  if (score >= 50) return "text-amber-800";
  return "text-emerald-700";
}

function RequestCard({
  req,
  showWhy,
  onToggleWhy,
  onApprove,
  onDeny,
  onNeedsInfo,
  onSkip,
}: {
  req: ApprovalRequest;
  showWhy: boolean;
  onToggleWhy: () => void;
  onApprove: () => void;
  onDeny: () => void;
  onNeedsInfo: () => void;
  onSkip: () => void;
}) {
  const rec = req.recommendation;
  const ctx = rec?.context;
  const recApprove = rec?.decision === "approve";

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[color:var(--border)] p-6">
        <div>
          <p className="text-sm text-mist-400">{req.date}</p>
          <h2 className="text-xl font-bold text-charcoal">{cardholderLabel(req)}</h2>
          {req.request_type === "pre_spend" && (
            <span className="mt-1 inline-block rounded-full bg-intact-muted px-2 py-0.5 text-[10px] text-intact">
              {L.approve.preSpend}
            </span>
          )}
          {req.request_type === "post_transaction" && (
            <span className="mt-1 inline-block rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-800">
              {L.approve.afterSpend}
            </span>
          )}
          <p className="mt-1 text-sm text-mist-300">
            Wants to spend{" "}
            <span className="font-semibold text-charcoal">{fmtCurrency(req.amount)}</span> at{" "}
            {req.merchant_name} ({req.category})
          </p>
          <p className="mt-1 text-xs text-mist-400">{L.approve.why}: {req.business_purpose}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {rec && (
            <div
              className={`rounded-xl px-4 py-3 text-right ${
                recApprove
                  ? "bg-emerald-500/10 ring-1 ring-emerald-500/40"
                  : "bg-intact-muted ring-1 ring-red-500/40"
              }`}
            >
              <p className="text-xs uppercase tracking-wide text-mist-400">{L.approve.aiSays}</p>
              <p className={`text-lg font-bold ${recApprove ? "text-emerald-700" : "text-intact"}`}>
                {recApprove ? L.approve.approve : L.approve.deny}
              </p>
              <p className="text-xs text-mist-400">
                {rec.confidence} sure
              </p>
            </div>
          )}
          {rec?.risk_score !== undefined && (
            <div className="rounded-lg border border-[color:var(--border)] bg-cream-100 px-3 py-2 text-right">
              <p className="text-xs text-mist-400">{L.approve.risk}</p>
              <p className={`text-lg font-bold ${riskColor(rec.risk_score)}`}>
                {rec.risk_score} · {rec.risk_level}
              </p>
            </div>
          )}
        </div>
      </div>

      {rec && (
        <div className="border-b border-[color:var(--border)] px-6 py-4">
          <p className="text-sm leading-relaxed text-mist-100">{rec.reasoning}</p>
          <button onClick={onToggleWhy} className="mt-2 text-xs text-intact hover:text-intact">
            {showWhy ? L.approve.hideWhy : L.approve.showWhy} ▾
          </button>
        </div>
      )}

      {showWhy && rec?.why && (
        <div className="grid grid-cols-1 gap-px border-b border-[color:var(--border)] bg-[color:var(--border)] sm:grid-cols-2">
          <WhyPanel title={L.approve.policyFacts} items={rec.why.policy_facts} />
          <WhyPanel title={L.approve.budgetFacts} items={rec.why.budget_facts} />
          <WhyPanel title={L.approve.historyFacts} items={rec.why.historical_facts} />
          <WhyPanel title={L.approve.riskFacts} items={rec.why.risk_facts} />
        </div>
      )}

      {ctx && (
        <div className="grid grid-cols-2 gap-px bg-[color:var(--border)] sm:grid-cols-4">
          {ctx.department_monthly_budget > 0 && (
            <>
              <Ctx label={L.approve.teamBudget} value={fmtCurrency(ctx.department_monthly_budget) + "/mo"} />
              <Ctx
                label={L.approve.teamBudgetStatus}
                value={ctx.department_status}
                accent={
                  ctx.department_status === "Over budget"
                    ? "text-intact"
                    : ctx.department_status === "At risk"
                      ? "text-amber-800"
                      : "text-emerald-700"
                }
              />
            </>
          )}
          <Ctx label={L.approve.spendingPace} value={fmtCurrency(ctx.department_run_rate) + "/mo"} />
          <Ctx label={L.card.vsOthers} value={`${ctx.employee_vs_peer_pct}%`} />
          <Ctx label={L.approve.cardCharges} value={String(ctx.employee_transaction_count)} />
          <Ctx label={L.approve.avgCharge} value={fmtCurrency(ctx.employee_avg_transaction)} />
          <Ctx
            label={`Past ${req.category}`}
            value={`${ctx.similar_category_count} · ${fmtCurrency(ctx.similar_category_total)}`}
          />
          <Ctx label={L.approve.totalOnCard} value={fmtCurrency(ctx.employee_total_spend)} />
        </div>
      )}

      <div className="flex flex-wrap gap-3 p-6">
        <button onClick={onApprove} className="btn-primary flex-1">
          {L.approve.approve} <span className="ml-1 opacity-70">(A)</span>
        </button>
        <button onClick={onDeny} className="btn flex-1 bg-red-500/90 text-charcoal hover:bg-red-500">
          {L.approve.deny} <span className="ml-1 opacity-70">(D)</span>
        </button>
        <button onClick={onNeedsInfo} className="btn-secondary flex-1">
          Request info
        </button>
        <button onClick={onSkip} className="btn-secondary">
          Skip <span className="ml-1 opacity-70">(S)</span>
        </button>
      </div>
      <p className="border-t border-[color:var(--border)] px-6 py-3 text-center text-xs text-mist-500">
        AI did not make the final decision. Your action is logged in the audit trail.
      </p>
    </div>
  );
}

function WhyPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase text-intact">{title}</p>
      <ul className="mt-2 space-y-1 text-sm text-mist-200">
        {items.map((item, i) => (
          <li key={i}>· {item}</li>
        ))}
      </ul>
    </div>
  );
}

function Ctx({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-white px-4 py-3">
      <p className="text-xs text-mist-400">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${accent ?? "text-charcoal"}`}>{value}</p>
    </div>
  );
}
