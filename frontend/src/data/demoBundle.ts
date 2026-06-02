import raw from "./demoBundle.json";
import { seedCacheEntry } from "../api/cache";
import type {
  ApprovalRequest,
  AuditEntry,
  ComplianceResult,
  EmployeeProfile,
  EmployeeSummary,
  ExpenseReport,
  PolicyConfig,
  PolicyTrends,
} from "../types/smb";
import type {
  AnomalyScan,
  ForecastResult,
  HiddenInsightsResult,
  IntelligenceResult,
  LeaksResult,
  PolicyCopilotResult,
  ReceiptStatus,
  VendorGroup,
} from "../types/smb";

type DemoBundle = {
  compliance: ComplianceResult;
  approvals: ApprovalRequest[];
  employees: EmployeeSummary[];
  employee_profiles: Record<string, EmployeeProfile>;
  policy: PolicyConfig;
  audit: AuditEntry[];
  reports: ExpenseReport[];
  report_details: Record<string, ExpenseReport>;
  intelligence: IntelligenceResult;
  leaks: LeaksResult;
  hidden_insights: HiddenInsightsResult;
  policy_copilot: PolicyCopilotResult;
  anomalies: AnomalyScan;
  forecast: ForecastResult;
  receipts: ReceiptStatus;
  vendors: VendorGroup[];
  employee_risk: EmployeeSummary[];
  policy_trends: PolicyTrends;
};

export const DEMO_BUNDLE = raw as unknown as DemoBundle;

export function seedDemoBundle(): void {
  const b = DEMO_BUNDLE;
  seedCacheEntry("compliance:200", b.compliance);
  seedCacheEntry("policy", b.policy);
  seedCacheEntry("approvals:all", b.approvals);
  seedCacheEntry("approvals:pending", b.approvals.filter((a) => a.status === "pending"));
  seedCacheEntry("employees", b.employees);
  seedCacheEntry("audit", b.audit);
  seedCacheEntry("reports", b.reports);
  seedCacheEntry("intelligence", b.intelligence);
  seedCacheEntry("leaks", b.leaks);
  seedCacheEntry("hidden-insights", b.hidden_insights);
  seedCacheEntry("policy-copilot", b.policy_copilot);
  seedCacheEntry("anomalies", b.anomalies);
  seedCacheEntry("forecast", b.forecast);
  seedCacheEntry("receipts", b.receipts);
  seedCacheEntry("vendors", b.vendors);
  seedCacheEntry("employee-risk", b.employee_risk);
  seedCacheEntry("policy-trends", b.policy_trends);
  for (const [id, profile] of Object.entries(b.employee_profiles)) {
    seedCacheEntry(`employee:${id}`, profile);
  }
  for (const [id, report] of Object.entries(b.report_details)) {
    seedCacheEntry(`report:${id}`, report);
  }
  for (const a of b.approvals) {
    seedCacheEntry(`approval:${a.request_id}`, a);
  }
}

export function demoApproval(id: string): ApprovalRequest | undefined {
  return DEMO_BUNDLE.approvals.find((a) => a.request_id === id);
}

export function demoReport(id: string): ExpenseReport | undefined {
  return DEMO_BUNDLE.report_details[id] ?? DEMO_BUNDLE.reports.find((r) => r.report_id === id);
}

export function demoEmployeeProfile(id: string): EmployeeProfile | undefined {
  return DEMO_BUNDLE.employee_profiles[id];
}
