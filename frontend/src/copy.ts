/** Simple UI text — plain words, easy to read. */

export const PAGE_TITLE = "Intact Receipt Manager";
export const PRODUCT_TAGLINE = "Upload receipts and card charges. See totals, problems, and answers in one app.";

export const NAV = [
  { label: "Home", to: "/", end: true },
  { label: "Ask AI", to: "/ask" },
  { label: "Rule checks", to: "/compliance" },
  { label: "Approve", to: "/approvals" },
  { label: "Reports", to: "/reports" },
  { label: "Trends", to: "/insights" },
  { label: "Cards", to: "/employees" },
  { label: "Activity", to: "/audit" },
  { label: "Architecture", to: "/architecture" },
] as const;

export const PAGES = {
  home: {
    title: "Insurance receipt manager",
    subtitle: "Upload your Excel file. See how much was spent, what broke the rules, and ask AI questions in plain English.",
    ctaAsk: "Ask AI",
    ctaRules: "Broken rules",
    stats: {
      totalSpend: "Total spent",
      monthlyAvg: "Average per month",
      ruleBreaks: "Broken rules",
      cards: "Company cards",
    },
    chartTitle: "Spending each month",
    links: {
      review: "Approve flagged charges →",
      reports: "View reports →",
      trends: "View spending trends →",
    },
    upload: {
      title: "Upload your Excel file",
      help: "Sample data is already loaded. Upload your own file to replace it.",
      button: "Choose Excel file",
      uploading: "Uploading…",
      error: "Upload failed. Please use an Excel file (.xlsx).",
      success: (rows: number) => `Done. ${rows.toLocaleString()} rows loaded.`,
    },
  },
  ask: {
    title: "Ask AI",
    subtitle: "Ask anything about your receipts and card charges. Type like you would in a chat.",
    hint: "Tap a suggested question below the chat, or type your own.",
    suggestedLabel: "Suggested questions",
    starters: [
      "Which charges have no receipt?",
      "Who spent the most?",
      "Show broken rules",
      "Which stores cost the most?",
      "How much did we spend this month?",
    ],
    placeholder: "Type your question here…",
    submit: "Send",
    thinking: "AI is thinking…",
    error: "Could not get an answer. Make sure the app server is running, then try again.",
    sampleNote: (count: number) => `Using sample data (${count.toLocaleString()} charges).`,
  },
  compliance: {
    title: "Rule checks",
    subtitle: "Charges that broke your company rules (missing receipt, over limit, and more).",
  },
  approvals: {
    title: "Approve charges",
    subtitle: "Review charges that need a yes or no. You decide — AI only suggests.",
  },
  reports: {
    title: "Reports",
    subtitle: "Charges grouped by trip, project, or pattern so you can review them together.",
  },
  insights: {
    title: "Spending trends",
    subtitle: "Charts and notes about where money goes and what looks unusual.",
  },
  employees: {
    title: "Company cards",
    subtitle: "See spending for each card. Cards show as Card #200 when your file has numbers, not names.",
  },
  audit: {
    title: "Activity log",
    subtitle: "A list of actions people took in this app (approvals, uploads, and more).",
  },
} as const;

export const FOOTER =
  "Upload receipts and card charges. See totals, broken rules, and get plain-English answers from Ask AI.";
