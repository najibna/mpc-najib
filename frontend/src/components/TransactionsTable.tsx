import { Fragment, useState } from "react";
import type { AnalyzedTransaction } from "../types/transaction";
import { formatCurrency, riskBadgeClasses } from "../utils";
import TransactionDetails from "./TransactionDetails";

type Props = {
  transactions: AnalyzedTransaction[];
  loading: boolean;
};

export default function TransactionsTable({ transactions, loading }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="table-container overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-[color:var(--border)] bg-cream-100 text-xs uppercase tracking-wide text-mist-400">
          <tr>
            <th className="px-4 py-3 font-semibold">Row</th>
            <th className="px-4 py-3 font-semibold">Date</th>
            <th className="px-4 py-3 font-semibold">Merchant</th>
            <th className="px-4 py-3 text-right font-semibold">Amount</th>
            <th className="px-4 py-3 font-semibold">Country</th>
            <th className="px-4 py-3 font-semibold">MCC</th>
            <th className="px-4 py-3 text-right font-semibold">Score</th>
            <th className="px-4 py-3 font-semibold">Risk</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:var(--border)]">
          {loading && (
            <tr>
              <td colSpan={9} className="px-4 py-10 text-center text-mist-400">
                Loading…
              </td>
            </tr>
          )}
          {!loading && transactions.length === 0 && (
            <tr>
              <td colSpan={9} className="px-4 py-10 text-center text-mist-400">
                No transactions match the current filters.
              </td>
            </tr>
          )}
          {!loading &&
            transactions.map((t) => (
              <Fragment key={t.row_number}>
                <tr
                  className="cursor-pointer transition-colors hover:bg-intact/5"
                  onClick={() =>
                    setExpanded(expanded === t.row_number ? null : t.row_number)
                  }
                >
                  <td className="px-4 py-3 text-mist-400">{t.row_number}</td>
                  <td className="px-4 py-3 text-mist-300">
                    {t.transaction_date || "-"}
                  </td>
                  <td className="px-4 py-3 font-medium text-charcoal">
                    {t.merchant_name || "-"}
                    {t.debit_or_credit.toLowerCase() === "credit" && (
                      <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700 ring-1 ring-emerald-500/30">
                        CREDIT
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-mist-300">
                    {formatCurrency(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-mist-300">
                    {t.merchant_country || "-"}
                  </td>
                  <td className="px-4 py-3 text-mist-400">{t.mcc || "-"}</td>
                  <td className="px-4 py-3 text-right font-bold text-charcoal">
                    {t.risk_score}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${riskBadgeClasses(
                        t.risk_category,
                      )}`}
                    >
                      {t.risk_category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-mist-400">
                    {expanded === t.row_number ? "▲" : "▼"}
                  </td>
                </tr>
                {expanded === t.row_number && (
                  <tr>
                    <td colSpan={9} className="p-0">
                      <TransactionDetails txn={t} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
        </tbody>
      </table>
    </div>
  );
}
