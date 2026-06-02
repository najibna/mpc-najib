import { useEffect, useRef, useState } from "react";
import { ask, askThinkMs, demoTransactionCount, ensureAskReady } from "../api/smb";
import { seedDemoHome } from "../data/demoHome";
import ChartView from "../components/ChartView";
import PageHeader, { cardholderLabel } from "../components/ui/PageHeader";
import { PAGES } from "../copy";
import { L } from "../labels";
import type { AskResponse } from "../types/smb";

type Turn = {
  role: "user" | "assistant";
  content: string;
  result?: AskResponse;
};

export default function AskPage() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [priorPlan, setPriorPlan] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txnCount] = useState(demoTransactionCount);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, busy]);

  useEffect(() => {
    seedDemoHome();
    ensureAskReady().catch(() => undefined);
  }, []);

  async function submit(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setBusy(true);
    setInput("");
    const history = turns.map((t) => ({ role: t.role, content: t.content }));
    setTurns((prev) => [...prev, { role: "user", content: q }]);
    setError(null);

    const started = Date.now();
    try {
      const result = await ask(q, history, priorPlan);
      const waitMs = Math.max(0, askThinkMs - (Date.now() - started));
      if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
      if (result.plan && typeof result.plan === "object") {
        setPriorPlan(result.plan as Record<string, unknown>);
      }
      setTurns((prev) => [...prev, { role: "assistant", content: result.answer, result }]);
    } catch {
      setError(PAGES.ask.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col px-4 py-8 sm:px-6">
      <PageHeader title={PAGES.ask.title} subtitle={PAGES.ask.subtitle} />

      {error && (
        <div className="mb-4 rounded-lg border border-intact/25 bg-intact-muted px-4 py-3 text-sm text-intact">
          {error}
        </div>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto">
        {turns.length === 0 && (
          <div className="card p-5">
            <p className="text-sm text-charcoal-muted">{PAGES.ask.hint}</p>
          </div>
        )}

        {turns.map((t, i) =>
          t.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-intact rounded-br-md bg-intact px-4 py-3 text-sm text-white shadow-intact-sm">
                {t.content}
              </div>
            </div>
          ) : (
            <div key={i} className="card px-4 py-3">
              <p className="text-sm leading-relaxed text-charcoal">{t.content}</p>
              {t.result && t.result.data.length > 0 && (
                <div className="mt-4">
                  <ChartView chart={t.result.chart} data={t.result.data} metric={t.result.metric} />
                </div>
              )}
              {t.result?.supporting_rows && t.result.supporting_rows.length > 0 && (
                <div className="mt-4 overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="text-charcoal-muted">
                      <tr>
                        <th className="py-1 pr-2">{L.table.date}</th>
                        <th className="py-1 pr-2">{L.table.who}</th>
                        <th className="py-1 pr-2">{L.table.store}</th>
                        <th className="py-1 text-right">{L.table.amount}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {t.result.supporting_rows.map((r, j) => (
                        <tr key={j} className="border-t border-[color:var(--border)]">
                          <td className="py-1">{r.date}</td>
                          <td className="py-1">{cardholderLabel(r)}</td>
                          <td className="py-1">{r.merchant_name}</td>
                          <td className="py-1 text-right">${r.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ),
        )}

        {busy && (
          <p className="text-sm text-charcoal-muted">{PAGES.ask.thinking}</p>
        )}
        <div ref={endRef} />
      </div>

      <div className="mt-4 shrink-0 border-t border-[color:var(--border)] pt-3">
        <p className="mb-2 text-xs font-medium text-charcoal-muted">{PAGES.ask.suggestedLabel}</p>
        <div className="flex flex-wrap gap-2">
          {PAGES.ask.starters.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => submit(s)}
              disabled={busy}
              className="rounded-full border border-[color:var(--border)] bg-cream-50 px-3 py-1.5 text-sm text-charcoal hover:border-intact disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <form
        className="mt-3 flex gap-2 shrink-0"
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={PAGES.ask.placeholder}
          className="input flex-1"
          disabled={busy}
        />
        <button type="submit" className="btn-primary" disabled={busy || !input.trim()}>
          {PAGES.ask.submit}
        </button>
      </form>
      <p className="mt-2 text-center text-xs text-charcoal-light">
        {PAGES.ask.sampleNote(txnCount)}
      </p>
    </div>
  );
}
