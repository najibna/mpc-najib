export type NameValue = { name: string; value: number };

export type EnrichmentMeta = {
  spend_source?: string;
  transparency_note?: string;
  raw_source_fields?: string[];
  derived_demo_fields?: string[];
  derived_columns?: string[];
  provided_columns?: string[];
  field_sources?: Record<string, string>;
  card_codes_mapped?: number;
  raw_total_spend?: number;
  has_receipt_column?: boolean;
  has_approval_column?: boolean;
  has_employee_names?: boolean;
  has_departments?: boolean;
};

export type DataAvailability = {
  has_employee_names: boolean;
  has_departments: boolean;
  has_receipt_column: boolean;
  has_approval_column: boolean;
  has_business_purpose_column: boolean;
  has_meal_context: boolean;
  has_tip_column?: boolean;
  identity_label: string;
  group_label: string;
  missing_fields: string[];
  data_honesty_note: string;
  provided_columns: string[];
  department_analysis_note?: string;
  features_enabled?: string[];
  features_unavailable?: string[];
};

export type Meta = {
  loaded?: boolean;
  departments?: string[];
  categories: string[];
  date_range: { start: string; end: string };
  employee_count: number;
  card_code_count?: number;
  has_departments?: boolean;
  has_employee_names?: boolean;
  transaction_count: number;
  data_source?: string;
  data_source_label?: string;
  total_spend?: number;
  spend_source?: string;
  derived_demo_fields?: string[];
  provided_fields?: string[];
  transparency_note?: string;
  enrichment?: EnrichmentMeta;
  import_meta?: Record<string, unknown>;
  data_availability?: DataAvailability;
  policy_thresholds?: { approval_cap: number; receipt_threshold: number };
  llm_enabled: boolean;
  llm_model?: string;
};

export type Overview = {
  total_spend: number;
  transaction_count: number;
  employee_count: number;
  merchant_count?: number;
  department_count: number;
  avg_transaction: number;
  monthly_avg: number;
  date_range: { start: string; end: string };
  grouping?: string;
  by_department: NameValue[];
  by_category: NameValue[];
  by_country?: NameValue[];
  by_state?: NameValue[];
  by_month: NameValue[];
  top_merchants: NameValue[];
};

export type Budget = {
  department: string;
  monthly_budget: number;
  latest_month: string;
  latest_spend: number;
  utilization_pct: number;
  run_rate: number;
  projected_overrun: number;
  status: string;
  has_budget?: boolean;
};

export type VendorGroup = {
  category: string;
  mcc?: string;
  vendor_count: number;
  total_spend: number;
  top_vendor: string;
  top_vendor_spend: number;
  non_top_spend: number;
  concentration_pct?: number;
  recommendation?: string;
  vendors: NameValue[];
};

export type ScoreItem = {
  score: number;
  level: string;
  label: string;
  detail: string;
  drilldown: string;
};

export type PlatformScores = {
  transaction_risk: ScoreItem;
  policy_compliance: ScoreItem;
  vendor_optimization: ScoreItem;
  methodology: string;
};

export type IntelligenceFlag = {
  id: string;
  message: string;
  why_it_matters: string;
  points: number;
};

export type RiskyTransaction = {
  transaction_id: string;
  date: string;
  amount: number;
  merchant_name: string;
  category_label: string;
  country: string;
  cardholder_label: string;
  risk_score: number;
  risk_level: string;
  severity: string;
  flags: IntelligenceFlag[];
  explanation: string;
  why_it_matters: string;
  recommended_action: string;
  confidence: number;
};

export type IntelligenceResult = {
  summary: {
    transactions_scored: number;
    high_risk_count: number;
    avg_risk_score: number;
    flagged_amount: number;
  };
  top_risky: RiskyTransaction[];
  charts: {
    by_merchant: NameValue[];
    by_category: NameValue[];
    by_month: NameValue[];
    by_country: NameValue[];
  };
};

export type SpendLeak = {
  leak_type: string;
  merchant_name: string;
  monthly_impact: number;
  total_impact: number;
  transaction_count: number;
  suggested_action: string;
  severity: string;
  evidence: string;
};

export type LeaksResult = {
  summary: { leak_count: number; total_observed_impact: number; top_monthly_impact: number };
  leaks: SpendLeak[];
};

export type HiddenInsight = {
  id: string;
  title: string;
  detail: string;
  surprise_factor: string;
  category: string;
  link: string;
};

export type HiddenInsightsResult = {
  title: string;
  subtitle: string;
  insights: HiddenInsight[];
};

export type PolicyAssessment = {
  transaction_id: string;
  date: string;
  amount: number;
  merchant_name: string;
  cardholder_label: string;
  status: "compliant" | "needs_review" | "violation";
  policy_clause: string;
  missing_evidence: string[];
  recommended_next_step: string;
  confidence: number;
  explanation: string;
  false_positive_warning?: string | null;
};

export type PolicyCopilotResult = {
  policy_source: string;
  summary: Record<string, number>;
  assessments: PolicyAssessment[];
  transparency: string;
};

export type DemoInsightItem = {
  id: string;
  rank: number;
  title: string;
  detail: string;
  severity: string;
  action_label: string;
  link: string;
  evidence?: Record<string, unknown>;
};

export type DemoInsights = {
  headline: string;
  subheadline: string;
  insights: DemoInsightItem[];
  demo_steps?: string[];
};

export type CommandCenter = {
  cfo_summary?: string | null;
  scores: PlatformScores;
  overview: Overview;
  violation_count: number;
  anomaly_count: number;
  fragmented_vendor_spend: number;
  projected_burn: number;
  debit_vs_credit: NameValue[];
  budget_disclaimer?: string | null;
};

export type HomePayload = {
  meta: Meta;
  overview: Overview;
  command_center: CommandCenter;
  budgets: Budget[];
  action_items: ActionItem[];
  demo_insights: DemoInsights;
};

export type ChartType = "bar" | "hbar" | "line" | "pie" | "table" | "kpi";

export type AskResponse = {
  answer: string;
  chart: ChartType;
  data: NameValue[];
  metric?: string;
  group_by?: string;
  title?: string;
  row_count?: number;
  plan?: unknown;
  llm: boolean;
  merged_from_prior?: boolean;
  ai_generated?: boolean;
  confidence?: "high" | "medium" | "low";
  supporting_rows?: SupportingRow[];
  follow_ups?: string[];
  needs_clarification?: string | null;
  reasoning?: string;
};

export type SupportingRow = {
  date: string;
  employee_name: string;
  department: string;
  merchant_name: string;
  category: string;
  amount: number;
};

export type ActionItem = {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  link: string;
};

export type AuditEntry = {
  timestamp: string;
  action: string;
  actor: string;
  target: string;
  detail: Record<string, unknown>;
};

export type ImportResult = {
  ok: boolean;
  filename?: string;
  rows_imported: number;
  invalid_rows: number;
  duplicate_rows: number;
  employees: number;
  merchants: number;
  total_spend: number;
  date_range?: { start: string; end: string };
  departments?: string[];
  categories?: string[];
  spend_source?: string;
  derived_demo_fields?: string[];
  provided_fields?: string[];
  enrichment?: EnrichmentMeta;
  errors?: string[];
};

export type RuleHit = {
  rule_id: string;
  severity: "high" | "medium" | "low";
  message: string;
  action: string;
};

export type Violation = {
  violation_id: string;
  transaction_id: string;
  date: string;
  employee_id: string;
  employee_name: string;
  cardholder_label?: string;
  transaction_code?: string;
  department: string;
  merchant_name: string;
  category: string;
  amount: number;
  channel: string;
  has_receipt: boolean;
  severity: "high" | "medium" | "low";
  risk_score?: number;
  risk_level?: string;
  workflow_status?: string;
  deterministic?: boolean;
  rules: RuleHit[];
  reasons: string[];
  recommended_action: string;
};

export type DepartmentRisk = {
  department: string;
  violation_count: number;
  violation_rate_per_100: number;
  flagged_amount: number;
  top_category: string;
  top_rules: Record<string, number>;
  risk_score: number;
  budget_status: string;
};

export type ComplianceResult = {
  summary: {
    total_violations: number;
    high: number;
    medium: number;
    low: number;
    flagged_amount: number;
    by_rule: Record<string, number>;
  };
  repeat_offenders: RepeatOffender[];
  violations: Violation[];
  violations_total?: number;
  violations_limit?: number;
  violations_offset?: number;
  trends?: NameValue[];
  department_risk?: DepartmentRisk[];
  amount_by_rule?: Record<string, number>;
};

export type RepeatOffender = {
  employee_id: string;
  employee_name: string;
  department: string;
  violation_count: number;
  flagged_amount: number;
  max_severity_score: number;
};

export type PolicyConfig = {
  receipt_threshold: number;
  approval_cap: number;
  rules: Record<string, boolean>;
  department_caps: Record<string, number>;
};

export type ApprovalContext = {
  employee_total_spend: number;
  employee_transaction_count: number;
  employee_avg_transaction: number;
  employee_vs_peer_pct: number;
  similar_category_count: number;
  similar_category_total: number;
  department_monthly_budget: number;
  department_latest_spend: number;
  department_run_rate: number;
  department_status: string;
};

export type Recommendation = {
  decision: "approve" | "deny";
  reasoning: string;
  confidence: string;
  source: string;
  context: ApprovalContext;
  risk_score?: number;
  risk_level?: string;
  why?: {
    policy_facts: string[];
    budget_facts: string[];
    historical_facts: string[];
    risk_facts: string[];
  };
};

export type ApprovalRequest = {
  request_id: string;
  request_type?: "pre_spend" | "post_transaction";
  transaction_id: string | null;
  employee_id: string;
  employee_name: string;
  cardholder_label?: string;
  transaction_code?: string;
  department: string;
  merchant_name: string;
  category: string;
  amount: number;
  date: string;
  business_purpose: string;
  status: "pending" | "approved" | "denied" | "needs_info";
  recommendation: Recommendation | null;
  decided_by: string | null;
  decided_at: string | null;
};

export type ReportFlag = {
  transaction_id: string;
  merchant_name: string;
  amount: number;
  reasons: string[];
  severity: string;
};

export type ReportTxn = {
  transaction_id: string;
  date: string;
  merchant_name: string;
  category: string;
  amount: number;
  has_receipt: boolean | null;
  flags: string[];
};

export type ExpenseReport = {
  report_id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  title: string;
  date_start: string;
  date_end: string;
  transaction_count: number;
  total: number;
  by_category: NameValue[];
  by_merchant?: NameValue[];
  missing_receipts?: number;
  receipt_data_available?: boolean;
  policy_flag_count: number;
  policy_flags: ReportFlag[];
  transactions?: ReportTxn[];
  status: "draft" | "submitted" | "approved" | "rejected";
  ai_summary: string | null;
  grouping_type?: string;
  grouping_reason?: string;
  location?: string;
  decided_by: string | null;
  decided_at: string | null;
};

export type AnomalySignal = {
  signal_id: string;
  signal_type: string;
  severity: "high" | "medium" | "low";
  transaction_id?: string;
  employee_id: string;
  employee_name: string;
  department: string;
  date: string;
  merchant_name: string;
  category: string;
  amount: number;
  message: string;
  recommended_action: string;
};

export type AnomalyScan = {
  summary: {
    total_signals: number;
    high: number;
    medium: number;
    low: number;
    flagged_amount: number;
    by_type: Record<string, number>;
  };
  signals: AnomalySignal[];
};

export type ForecastDept = {
  department: string;
  monthly_budget: number;
  latest_month: string;
  latest_spend: number;
  run_rate: number;
  projected_next_month: number;
  utilization_pct: number;
  trend_direction: string;
  weekly_burn: number;
  weeks_to_overrun: number | null;
  status: string;
  history: NameValue[];
};

export type ForecastResult = {
  departments: ForecastDept[];
  alerts: { department: string; severity: string; message: string }[];
  category_trends: { category: string; latest: number; growth: number }[];
  data_months: string[];
};

export type ReceiptStatus = {
  data_available?: boolean;
  note?: string;
  summary: {
    transactions_over_threshold: number;
    receipts_matched: number;
    receipts_missing: number;
    compliance_rate_pct: number | null;
    missing_amount: number;
  };
  unmatched: {
    transaction_id: string;
    date: string;
    employee_name: string;
    department: string;
    merchant_name: string;
    category: string;
    amount: number;
    days_since: number;
    match_status: string;
    recommended_action: string;
  }[];
  by_department: { department: string; missing_count: number; missing_amount: number }[];
};

export type EmployeeSummary = {
  employee_id: string;
  employee_name: string;
  cardholder_label?: string;
  transaction_code?: string;
  department: string;
  role: string;
  card_last4: string;
  total_spend?: number;
  transaction_count?: number;
  risk_score?: number;
  risk_level?: string;
  violation_count?: number;
  flagged_amount?: number;
  missing_receipts?: number;
  badges?: string[];
};

export type PolicyTrends = {
  by_rule_count: Record<string, number>;
  by_rule_amount: Record<string, number>;
  monthly_trends: NameValue[];
};

export type EmployeeProfile = EmployeeSummary & {
  total_spend: number;
  transaction_count: number;
  avg_transaction: number;
  median_transaction: number;
  largest_transaction: number;
  peer_avg_spend: number;
  vs_peer_pct: number;
  by_category: NameValue[];
  by_month: NameValue[];
  top_merchants: NameValue[];
  risk_score?: number;
  risk_level?: string;
  violation_count?: number;
  flagged_amount?: number;
  missing_receipts?: number;
  badges?: string[];
};
