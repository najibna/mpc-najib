import { DEMO_BUNDLE } from "./demoBundle";
import { DEMO_HOME } from "./demoHome";
import { cardholderLabel } from "../labels";
import type { AskResponse } from "../types/smb";

const MERCHANT_WORDS = /\b(store|stores|merchant|merchants|vendor|vendors)\b/;
const RANK_WORDS = /\b(most|top|highest|largest|biggest|cost|spent|spend|expensive|much)\b/;

function isTopMerchantsQuestion(q: string): boolean {
  return MERCHANT_WORDS.test(q) && (RANK_WORDS.test(q) || /\b(which|what|list|show)\b/.test(q));
}

function isTopCardsQuestion(q: string): boolean {
  if (MERCHANT_WORDS.test(q)) return false;
  return (
    /\b(who|which card|which person)\b/.test(q) ||
    /spent the most/.test(q) ||
    /spend the most/.test(q) ||
    (/\b(spent|spend)\b/.test(q) && /\b(most|highest|top)\b/.test(q))
  );
}

function isBrokenRulesQuestion(q: string): boolean {
  return /\b(broken rules?|rule breaks?|show rules?|policy|violation|compliance)\b/.test(q);
}

function isMonthlySpendQuestion(q: string): boolean {
  return /\b(how much|total|spend)\b/.test(q) && /\b(month|this month|last month|monthly)\b/.test(q);
}

/** Instant Ask answers from the bundled sample Excel snapshot (works when API is cold). */
export function askFromDemoBundle(question: string): AskResponse {
  const q = question.toLowerCase().trim();
  const quoted = `"${question.trim()}"`;
  const ov = DEMO_HOME.overview;
  const cc = DEMO_HOME.command_center;
  const insights = DEMO_HOME.demo_insights.insights;
  const txns = ov.transaction_count;
  const topRisk = insights.find((i) => i.id === "top_risk");
  const merchants = ov.top_merchants.slice(0, 10);

  const base = {
    plan: { intent: "demo_bundle" },
    llm: false,
    ai_generated: false,
    confidence: "high" as const,
    supporting_rows: [] as AskResponse["supporting_rows"],
    follow_ups: [
      "Which stores cost the most?",
      "Which charges have no receipt?",
      "Show broken rules",
    ],
    needs_clarification: null,
    row_count: txns,
    reasoning: "Answer computed from bundled sample Excel (offline demo mode).",
  };

  if (isTopMerchantsQuestion(q) && merchants.length > 0) {
    const top = merchants[0];
    const lines = merchants.slice(0, 5).map((m, i) => `${i + 1}. ${m.name} — $${m.value.toLocaleString()}`);
    return {
      ...base,
      answer: `You asked ${quoted} — the store that cost the most is ${top.name} at $${top.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}. Top stores: ${lines.join("; ")}.`,
      chart: "bar",
      data: merchants.map((m) => ({ name: m.name.slice(0, 28), value: m.value })),
      title: "Top stores by spend",
      metric: "sum_amount",
      row_count: merchants.length,
      follow_ups: ["Which charges have no receipt?", "Who spent the most?"],
    };
  }

  if (isTopCardsQuestion(q)) {
    const sorted = [...DEMO_BUNDLE.employees].sort(
      (a, b) => (b.total_spend ?? 0) - (a.total_spend ?? 0),
    );
    const top = sorted[0];
    if (top) {
      return {
        ...base,
        answer: `You asked ${quoted} — ${cardholderLabel(top)} spent the most ($${(top.total_spend ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} in this sample).`,
        chart: "bar",
        data: sorted.slice(0, 6).map((e) => ({
          name: cardholderLabel(e).slice(0, 24),
          value: e.total_spend ?? 0,
        })),
        title: "Spend by card",
        row_count: sorted.length,
      };
    }
  }

  if (
    /\b(receipt|receipts)\b/.test(q) &&
    (/\b(no|missing|without|lack|need)\b/.test(q) ||
      /\b(which|what|list|show|how many)\b/.test(q))
  ) {
    const rcpt = DEMO_BUNDLE.receipts;
    if (rcpt?.data_available && (rcpt.unmatched?.length ?? 0) > 0) {
      const s = rcpt.summary;
      const rows = rcpt.unmatched.slice(0, 8).map((r) => ({
        date: r.date,
        employee_name: cardholderLabel({ employee_name: r.employee_name }),
        department: "",
        merchant_name: r.merchant_name,
        category: "",
        amount: r.amount,
      }));
      return {
        ...base,
        answer: `You asked ${quoted} — ${s.receipts_missing.toLocaleString()} charges have no receipt ($${s.missing_amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} total). Here are the largest ones.`,
        chart: "bar",
        data: rows.map((r) => ({ name: r.merchant_name.slice(0, 28), value: r.amount })),
        title: "Charges missing receipts",
        supporting_rows: rows,
        row_count: s.receipts_missing,
        follow_ups: ["Which stores cost the most?", "Show broken rules"],
      };
    }

    const flagged = DEMO_BUNDLE.compliance.violations.filter((v) => !v.has_receipt);
    const totalAmt = flagged.reduce((sum, v) => sum + v.amount, 0);
    const rows = flagged.slice(0, 8).map((v) => ({
      date: v.date,
      employee_name: cardholderLabel(v),
      department: v.department ?? "",
      merchant_name: v.merchant_name,
      category: v.category ?? "",
      amount: v.amount,
    }));

    return {
      ...base,
      answer: `You asked ${quoted} — ${flagged.length.toLocaleString()} flagged charges in the sample have no receipt ($${totalAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })} shown below).`,
      chart: "bar",
      data: rows.map((r) => ({ name: r.merchant_name.slice(0, 28), value: r.amount })),
      title: "Charges missing receipts",
      supporting_rows: rows,
      row_count: flagged.length,
      follow_ups: ["Which stores cost the most?", "Show broken rules"],
    };
  }

  if (isBrokenRulesQuestion(q)) {
    const byRule = DEMO_BUNDLE.compliance.summary.by_rule
      ? Object.entries(DEMO_BUNDLE.compliance.summary.by_rule)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([name, value]) => ({ name: name.replace(/_/g, " ").slice(0, 24), value }))
      : [];
    return {
      ...base,
      answer: `You asked ${quoted} — there are ${cc.violation_count.toLocaleString()} broken rules in this file ($${DEMO_BUNDLE.compliance.summary.flagged_amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} flagged). Open Rule checks for the full list.`,
      chart: "bar",
      data: byRule.length
        ? byRule
        : [
            { name: "Broken rules", value: cc.violation_count },
            { name: "High-risk", value: cc.anomaly_count },
          ],
      title: "Broken rules",
      row_count: cc.violation_count,
      follow_ups: ["Which stores cost the most?", "Which charges have no receipt?"],
    };
  }

  if (/\b(sus|suspicious|risky|risk|fraud|sketchy)\b/.test(q)) {
    const detail = topRisk?.detail ?? "Review high-risk stores and duplicate same-day charges.";
    return {
      ...base,
      answer: `You asked ${quoted} — ${cc.anomaly_count} charges look high-risk in this sample. ${detail}`,
      chart: "bar",
      data: merchants.slice(0, 8).map((m) => ({ name: m.name.slice(0, 28), value: m.value })),
      title: "Top stores (sample)",
      metric: "sum_amount",
    };
  }

  if (isMonthlySpendQuestion(q)) {
    const latest = ov.by_month[ov.by_month.length - 1];
    return {
      ...base,
      answer: `You asked ${quoted} — latest month ${latest?.name} was $${latest?.value.toLocaleString(undefined, { maximumFractionDigits: 0 })} (average about $${ov.monthly_avg.toLocaleString(undefined, { maximumFractionDigits: 0 })} per month).`,
      chart: "line",
      data: ov.by_month,
      title: "Spending each month",
      metric: "sum_amount",
    };
  }

  if (/\b(split|below \$?50)\b/.test(q)) {
    const split = DEMO_HOME.action_items.find((a) => a.id === "split");
    return {
      ...base,
      answer: `You asked ${quoted} — ${split?.detail ?? "Same-day small charges near the $50 limit."}`,
      chart: "kpi",
      data: [{ name: "Split signals", value: 338 }],
      title: "Split charges",
    };
  }

  if (/\b(forecast|next month|burn|projected)\b/.test(q)) {
    return {
      ...base,
      answer: `You asked ${quoted} — projected spending is about $${cc.projected_burn.toLocaleString(undefined, { maximumFractionDigits: 0 })} per month based on recent months.`,
      chart: "line",
      data: ov.by_month,
      title: "Monthly spend trend",
      metric: "sum_amount",
    };
  }

  if (merchants.length > 0) {
    return {
      ...base,
      answer: `You asked ${quoted} — here are the top stores in your file. ${merchants[0].name} is highest at $${merchants[0].value.toLocaleString(undefined, { maximumFractionDigits: 0 })}.`,
      chart: "bar",
      data: merchants.map((m) => ({ name: m.name.slice(0, 28), value: m.value })),
      title: "Top stores by spend",
      metric: "sum_amount",
    };
  }

  return {
    ...base,
    answer: `You asked ${quoted} — I could not match that question to the sample data. Try: "Which stores cost the most?", "Which charges have no receipt?", or "Who spent the most?"`,
    chart: "kpi",
    data: [{ name: "Total spent (sample)", value: ov.total_spend }],
    title: "Need a clearer question",
  };
}
