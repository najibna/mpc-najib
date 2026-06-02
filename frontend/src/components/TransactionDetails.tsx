import type { AnalyzedTransaction } from "../types/transaction";

type Props = { txn: AnalyzedTransaction };

export default function TransactionDetails({ txn }: Props) {
  return (
    <div className="border-t border-[color:var(--border)] bg-white px-6 py-5 text-sm">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-2 font-semibold text-charcoal">Why this was flagged</h4>
          <p className="leading-relaxed text-mist-300">{txn.human_explanation}</p>
          <h4 className="mb-2 mt-4 font-semibold text-charcoal">
            Recommended action
          </h4>
          <p className="leading-relaxed text-mist-300">
            {txn.recommended_action}
          </p>
          <p className="mt-3 text-xs text-mist-400">
            Explanation source: {txn.explanation_source}
            {txn.explanation_source === "llm"
              ? ` · confidence: ${txn.confidence}`
              : ""}
          </p>
        </div>
        <div>
          <h4 className="mb-2 font-semibold text-charcoal">Rules triggered</h4>
          <ul className="space-y-2">
            {txn.rules_triggered.map((r) => (
              <li
                key={r.rule_id}
                className="rounded-xl border border-[color:var(--border)] bg-cream-100 px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-intact">
                    {r.rule_id}
                  </span>
                  <span className="text-xs font-semibold text-amber-800">
                    +{r.score}
                  </span>
                </div>
                <p className="mt-1 text-xs text-mist-400">{r.message}</p>
              </li>
            ))}
            {txn.rules_triggered.length === 0 && (
              <li className="text-xs text-mist-400">No rules triggered.</li>
            )}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-mist-400">
            <span>MCC: {txn.mcc || "-"}</span>
            <span>Country: {txn.merchant_country || "-"}</span>
            <span>City: {txn.merchant_city || "-"}</span>
            <span>State: {txn.merchant_state || "-"}</span>
            <span>Posting: {txn.posting_date || "-"}</span>
            <span>FX rate: {txn.conversion_rate || "-"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
