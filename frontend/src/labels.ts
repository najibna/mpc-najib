/** Plain words for the whole app — no jargon like "Code 200" or "MCC". */

export function formatCardNumber(code?: string | null): string {
  const c = code?.toString().trim();
  if (!c) return "";
  return `Card #${c}`;
}

/** Any label from API or demo data — turns "Code 137" into "Card #137". */
export function humanGroupLabel(label?: string | null): string {
  const t = label?.toString().trim();
  if (!t) return "—";
  const fromCode = t.match(/^Code\s+(.+)$/i);
  if (fromCode) return formatCardNumber(fromCode[1]);
  if (/^\d+$/.test(t)) return formatCardNumber(t);
  return t;
}

type CardholderFields = {
  employee_name?: string;
  cardholder_label?: string;
  transaction_code?: string;
  employee_id?: string;
};

/** Who spent — name if we have it, otherwise "Card #200" not "Code 200". */
export function cardholderLabel(item: CardholderFields): string {
  const name = item.employee_name?.trim();
  if (name) return name;

  const raw = item.cardholder_label?.trim();
  if (raw) {
    const fromCode = raw.match(/^Code\s+(.+)$/i);
    if (fromCode) return formatCardNumber(fromCode[1]);
    return raw;
  }

  const code = item.transaction_code || item.employee_id;
  return code ? formatCardNumber(String(code)) : "Unknown card";
}

export function humanSeverity(severity?: string): string {
  switch (severity?.toLowerCase()) {
    case "high":
      return "Serious";
    case "medium":
      return "Medium";
    case "low":
      return "Small";
    default:
      return severity ?? "—";
  }
}

export const RULE_NAMES: Record<string, string> = {
  receipt_required: "Big charge with no receipt",
  approval_required: "Over the spending limit",
  split_evasion: "Split into small charges to hide cost",
  alcohol: "Alcohol with no work reason",
  personal_expense: "Looks personal (gift card, etc.)",
  ticket_fine: "Parking or traffic ticket",
  duplicate: "Same charge twice",
  missing_purpose: "No reason for the purchase",
  travel_context: "Travel with no trip info",
  excessive_tip: "Tip too high (over 20%)",
  round_number: "Round dollar amount looks odd",
  foreign_fx: "Money spent in another country",
};

export function humanRuleId(ruleId: string): string {
  return RULE_NAMES[ruleId] ?? ruleId.replace(/_/g, " ");
}

export const L = {
  table: {
    date: "Date",
    who: "Who spent",
    store: "Store",
    amount: "Amount",
    merchant: "Store",
    category: "Type of spend",
    department: "Team",
    brokenRules: "Broken rules",
    risk: "Risk level",
    status: "Status",
    reasons: "What went wrong",
  },
  card: {
    one: "Which card",
    pick: "Pick a card",
    search: "Search by name or card number…",
    noNamesNote:
      "Your file has card numbers, not people's names. We show each card as Card #200, Card #201, and so on.",
    back: "← All cards",
    spendType: "Spending by type",
    monthly: "Spending each month",
    topStores: "Top stores",
    viewRules: "See broken rules →",
    viewApprove: "Go to approve charges →",
    totalSpent: "Total spent",
    charges: "Number of charges",
    avgCharge: "Average charge",
    vsOthers: "Compared to other cards",
    brokenRules: "Broken rules",
    missingReceipts: "Missing receipts",
    riskScore: "Risk score",
    violations: "broken rules",
  },
  compliance: {
    brokenRules: "Broken rules",
    serious: "Serious problems",
    medium: "Medium problems",
    flaggedMoney: "Money flagged",
    byRule: "Broken rules (count)",
    trend: "Problems over time",
    flaggedByRule: "Flagged money by rule",
    riskByTeam: "Risk by team",
    riskByCard: "Risk by card",
    repeat: "Cards with many problems",
    repeatByTeam: "Teams with many problems",
    companyRules: "Company rules (on/off)",
    allProblems: "All problem levels",
    allTeams: "All teams",
    approvalCap: "Need approval over ($)",
    receiptLimit: "Need receipt over ($)",
    receiptOk: "Receipt on file",
    receiptMissing: "No receipt",
    receiptNA: "Receipt info not in file",
    howFound: "How we found it",
    ruleCheck: "Checked by rule",
    aiHelp: "AI helped find it",
    aiExplain: "Explain in plain English",
    explaining: "Explaining…",
    dismiss: "Ignore this one",
    recommended: "Suggested action",
    policyExplain: "Plain-English explanation",
    unavailable: "(not in your file)",
  },
  approve: {
    card: "Which card",
    pickCard: "Choose a card",
    requester: "Your name",
    team: "Team (optional)",
    amount: "Amount ($)",
    store: "Store name",
    spendType: "Type of spend",
    date: "Date",
    why: "Why you need this",
    notes: "Notes",
    aiSays: "AI suggests",
    approve: "Yes, allow",
    deny: "No, deny",
    risk: "Risk level",
    showWhy: "Why did AI say that?",
    hideWhy: "Hide explanation",
    pending: "waiting",
    reviewed: "done",
    allDone: "Nothing left to review",
    allDoneHelp: "No charges need your decision right now.",
    preSpend: "Before spending",
    afterSpend: "After a charge was made",
    bulkOk: "Approve all safe ones",
    bulkNo: "Deny all risky ones",
    sortRisk: "Sort by risk",
    sortAmount: "Sort by amount",
    sortDate: "Sort by date",
    teamBudget: "Team budget",
    teamBudgetStatus: "Team budget status",
    spendingPace: "Spending pace",
    cardCharges: "Charges on this card",
    avgCharge: "Average charge",
    totalOnCard: "Total on this card",
    policyFacts: "Rule checks",
    budgetFacts: "Budget",
    historyFacts: "Past spending",
    riskFacts: "What looks risky",
    newRequest: "Request approval before spending",
    hideForm: "Hide form",
    submit: "Submit and get AI advice",
  },
  insights: {
    intro: "Pick a topic below to see charts and notes.",
    leaks: "Wasted spend",
    stores: "Stores",
    tips: "Tips & patterns",
    rulesCheck: "Rule check",
    oddCharges: "Odd charges",
    futureSpend: "Future spending",
    risk: "Risky cards",
    receipts: "Receipts",
    ruleTrends: "Rules over time",
    cardsListed: "Cards in your file",
    who: "Who",
    brokenRules: "Broken rules",
    noDept:
      "Your file has no team names. We grouped by card number instead.",
  },
  fields: {
    title: "What’s in your Excel file",
    show: "Show",
    hide: "Hide",
    inFile: "Columns we found",
    missing: "Not in your file (we won’t guess)",
    works: "Features that work",
    wontWork: "Features that won’t work with this file",
    whoGrouped: "Grouped by",
  },
  common: {
    loading: "Loading…",
    updating: "updating…",
    shown: "shown",
    total: "total",
  },
} as const;
