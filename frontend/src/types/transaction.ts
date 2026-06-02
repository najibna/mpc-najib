export type RiskCategory =
  | "Compliant"
  | "Needs Review"
  | "High Risk"
  | "Likely Policy Violation";

export type RuleTriggered = {
  rule_id: string;
  severity: string;
  score: number;
  message: string;
};

export type AnalyzedTransaction = {
  row_number: number;
  transaction_code: string;
  transaction_description: string;
  transaction_category: string;
  posting_date: string | null;
  transaction_date: string | null;
  merchant_name: string;
  amount: number;
  debit_or_credit: string;
  mcc: string;
  merchant_city: string;
  merchant_country: string;
  merchant_postal_code: string;
  merchant_state: string;
  conversion_rate: number;
  risk_score: number;
  risk_category: RiskCategory;
  rules_triggered: RuleTriggered[];
  human_explanation: string;
  recommended_action: string;
  explanation_source: string;
  confidence: string;
};

export type AnalysisSummary = {
  total_transactions: number;
  flagged_transactions: number;
  high_risk_transactions: number;
  likely_policy_violations: number;
  needs_review_transactions: number;
  compliant_transactions: number;
  total_flagged_amount: number;
};

export type UploadResponse = {
  upload_id: string;
  filename: string;
  rows_detected: number;
  columns_detected: string[];
};

export type AnalyzeResponse = {
  job_id: string;
  summary: AnalysisSummary;
  results: AnalyzedTransaction[];
};
