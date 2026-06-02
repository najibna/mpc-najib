import axios from "axios";
import { cached, invalidateCache, seedFromHome } from "./cache";
import { askFromDemoBundle } from "../data/demoAsk";
import { DEMO_BUNDLE, demoApproval, demoEmployeeProfile, demoReport, seedDemoBundle } from "../data/demoBundle";
import { DEMO_HOME, seedDemoHome } from "../data/demoHome";
import type {
  ActionItem,
  AnomalyScan,
  ApprovalRequest,
  AskResponse,
  AuditEntry,
  Budget,
  CommandCenter,
  ComplianceResult,
  DemoInsights,
  EmployeeProfile,
  EmployeeSummary,
  ExpenseReport,
  ForecastResult,
  HiddenInsightsResult,
  ImportResult,
  IntelligenceResult,
  LeaksResult,
  Meta,
  Overview,
  PlatformScores,
  PolicyConfig,
  PolicyCopilotResult,
  ReceiptStatus,
  Recommendation,
  PolicyTrends,
  VendorGroup,
  HomePayload,
} from "../types/smb";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8010";
const api = axios.create({ baseURL, timeout: 60_000 });
const LIVE_ASK_MS = 1500;
const ASK_API_MS = 45_000;
const ASK_THINK_MS = 1000;
const PROBE_MS = 1200;

let apiLive = false;
let probeStarted = false;

export function isApiLive(): boolean {
  return apiLive;
}

/** Quick check — does the hosted API have the demo Excel loaded? */
export async function probeApiLive(): Promise<boolean> {
  try {
    const r = await api.get<{ dataset_loaded?: boolean; status?: string }>("/api/health", {
      timeout: PROBE_MS,
    });
    apiLive = Boolean(r.data.dataset_loaded);
    return apiLive;
  } catch {
    apiLive = false;
    return false;
  }
}

function startApiProbe(): void {
  if (probeStarted) return;
  probeStarted = true;
  probeApiLive().catch(() => undefined);
}

export { invalidateCache };

export class NoDataError extends Error {
  constructor() {
    super("NO_DATA");
    this.name = "NoDataError";
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function liveOrDemo<T>(live: () => Promise<T>, demo: T): Promise<T> {
  try {
    const result = await Promise.race([
      live(),
      sleep(LIVE_ASK_MS).then(() => Promise.reject(new Error("timeout"))),
    ]);
    apiLive = true;
    return result;
  } catch {
    return demo;
  }
}

async function waitForLoadedMeta(force: boolean, attempts = 10): Promise<Meta> {
  for (let i = 0; i < attempts; i++) {
    const meta = await getMeta(force || i > 0);
    if (meta.loaded) return meta;
    await sleep(Math.min(4000, 800 + i * 600));
  }
  throw new NoDataError();
}

async function fetchHomeBundle(force: boolean): Promise<HomePayload> {
  try {
    const r = await api.get<HomePayload>("/api/smb/home");
    seedFromHome(r.data as unknown as Record<string, unknown>);
    apiLive = true;
    return r.data;
  } catch (err) {
    if (!axios.isAxiosError(err)) throw err;
    const status = err.response?.status;
    if (status !== 404 && status !== 503) throw err;
  }

  try {
    const meta = await waitForLoadedMeta(force);
    const [overview, command_center, budgets, action_items, demo_insights] = await Promise.all([
      getOverview(force),
      getCommandCenter(force),
      getBudgets(force),
      getActionItems(force),
      getDemoInsights(force),
    ]);
    const home: HomePayload = { meta, overview, command_center, budgets, action_items, demo_insights };
    seedFromHome(home as unknown as Record<string, unknown>);
    return home;
  } catch {
    seedFromHome(DEMO_HOME as unknown as Record<string, unknown>);
    return DEMO_HOME as HomePayload;
  }
}

/** Load overview first, then heavier analytics — keeps the dashboard responsive. */
export async function loadHomeProgressive(
  force: boolean,
  onPartial: (overview: Overview) => void,
): Promise<HomePayload> {
  try {
    const r = await api.get<HomePayload>("/api/smb/home");
    const home = r.data;
    seedFromHome(home as unknown as Record<string, unknown>);
    onPartial(home.overview);
    return home;
  } catch (err) {
    if (!axios.isAxiosError(err)) throw err;
    const status = err.response?.status;
    if (status !== 404 && status !== 503) throw err;
  }

  try {
    const meta = await waitForLoadedMeta(force);
    const overview = await getOverview(force);
    onPartial(overview);
    const [command_center, budgets, action_items, demo_insights] = await Promise.all([
      getCommandCenter(force),
      getBudgets(force),
      getActionItems(force),
      getDemoInsights(force),
    ]);
    const home: HomePayload = { meta, overview, command_center, budgets, action_items, demo_insights };
    seedFromHome(home as unknown as Record<string, unknown>);
    return home;
  } catch {
    onPartial(DEMO_HOME.overview);
    seedFromHome(DEMO_HOME as unknown as Record<string, unknown>);
    return DEMO_HOME as HomePayload;
  }
}

export const getMeta = (force = false) =>
  cached(
    "meta",
    () => liveOrDemo(() => api.get<Meta>("/api/smb/meta").then((r) => r.data), DEMO_HOME.meta as Meta),
    force,
  );

/** Seed all bundled demo caches — call on app startup for instant pages. */
export function seedAllDemoData(): void {
  seedDemoHome();
  seedDemoBundle();
  seedFromHome(DEMO_HOME as unknown as Record<string, unknown>);
}

/** Background warm — never blocks UI. */
export async function ensureAskReady(): Promise<Meta> {
  startApiProbe();
  try {
    const meta = await api.get<Meta>("/api/smb/meta", { timeout: PROBE_MS }).then((r) => r.data);
    if (meta.loaded) {
      apiLive = true;
      return meta;
    }
  } catch {
    /* use bundled demo */
  }
  return { loaded: false } as Meta;
}

export function demoTransactionCount(): number {
  return DEMO_HOME.overview.transaction_count;
}

export const getHome = (force = false) =>
  cached("home", () => fetchHomeBundle(force), force);

export const importExcel = (file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post<ImportResult>("/api/smb/import", fd).then((r) => {
    invalidateCache();
    return r.data;
  });
};

export const getActionItems = (force = false) =>
  cached(
    "action-items",
    () => liveOrDemo(() => api.get<ActionItem[]>("/api/smb/action-items").then((r) => r.data), DEMO_HOME.action_items),
    force,
  );

export const getAuditLog = (force = false) =>
  cached(
    "audit",
    () => liveOrDemo(() => api.get<AuditEntry[]>("/api/smb/audit").then((r) => r.data), DEMO_BUNDLE.audit),
    force,
  );

export const updateViolationStatus = (
  violation_id: string,
  status: string,
  note = "",
  options?: { skipCache?: boolean },
) =>
  api.post("/api/smb/compliance/status", { violation_id, status, note }).then((r) => {
    if (!options?.skipCache) invalidateCache();
    return r.data;
  });

export const bulkDecideApprovals = (request_ids: string[], decision: "approve" | "deny", note = "") =>
  api.post("/api/smb/approvals/bulk", { request_ids, decision, note }).then((r) => {
    invalidateCache();
    return r.data;
  });

export const exportReport = (id: string, format: "json" | "csv" = "json") =>
  api.get(`/api/smb/reports/${id}/export`, { params: { format } }).then((r) => r.data);

export const getOverview = (force = false) =>
  cached(
    "overview",
    () => liveOrDemo(() => api.get<Overview>("/api/smb/overview").then((r) => r.data), DEMO_HOME.overview),
    force,
  );

export const getBudgets = (force = false) =>
  cached(
    "budgets",
    () => liveOrDemo(() => api.get<Budget[]>("/api/smb/budgets").then((r) => r.data), DEMO_HOME.budgets),
    force,
  );

export const getVendors = (force = false) =>
  cached(
    "vendors",
    () => liveOrDemo(() => api.get<VendorGroup[]>("/api/smb/vendors").then((r) => r.data), DEMO_BUNDLE.vendors),
    force,
  );

export const getScores = (force = false) =>
  cached("scores", () => api.get<PlatformScores>("/api/smb/scores").then((r) => r.data), force);

export const getIntelligence = (force = false) =>
  cached(
    "intelligence",
    () => liveOrDemo(() => api.get<IntelligenceResult>("/api/smb/intelligence").then((r) => r.data), DEMO_BUNDLE.intelligence),
    force,
  );

export const getLeaks = (force = false) =>
  cached(
    "leaks",
    () => liveOrDemo(() => api.get<LeaksResult>("/api/smb/leaks").then((r) => r.data), DEMO_BUNDLE.leaks),
    force,
  );

export const getHiddenInsights = (force = false) =>
  cached(
    "hidden-insights",
    () =>
      liveOrDemo(
        () => api.get<HiddenInsightsResult>("/api/smb/hidden-insights").then((r) => r.data),
        DEMO_BUNDLE.hidden_insights,
      ),
    force,
  );

export const getPolicyCopilot = (force = false) =>
  cached(
    "policy-copilot",
    () =>
      liveOrDemo(
        () => api.get<PolicyCopilotResult>("/api/smb/policy-copilot").then((r) => r.data),
        DEMO_BUNDLE.policy_copilot,
      ),
    force,
  );

export const getDemoInsights = (force = false) =>
  cached(
    "demo-insights",
    () => liveOrDemo(() => api.get<DemoInsights>("/api/smb/demo-insights").then((r) => r.data), DEMO_HOME.demo_insights),
    force,
  );

export const getCommandCenter = (force = false) =>
  cached(
    "command-center",
    () =>
      liveOrDemo(
        () => api.get<CommandCenter>("/api/smb/command-center").then((r) => r.data),
        DEMO_HOME.command_center,
      ),
    force,
  );


export const getAnomalies = (force = false) =>
  cached(
    "anomalies",
    () => liveOrDemo(() => api.get<AnomalyScan>("/api/smb/anomalies").then((r) => r.data), DEMO_BUNDLE.anomalies),
    force,
  );

export const getForecast = (force = false) =>
  cached(
    "forecast",
    () => liveOrDemo(() => api.get<ForecastResult>("/api/smb/forecast").then((r) => r.data), DEMO_BUNDLE.forecast),
    force,
  );

export const getReceipts = (force = false) =>
  cached(
    "receipts",
    () => liveOrDemo(() => api.get<ReceiptStatus>("/api/smb/receipts").then((r) => r.data), DEMO_BUNDLE.receipts),
    force,
  );

export const getEmployees = (force = false) =>
  cached(
    "employees",
    () => liveOrDemo(() => api.get<EmployeeSummary[]>("/api/smb/employees").then((r) => r.data), DEMO_BUNDLE.employees),
    force,
  );

export const getEmployee = (id: string, force = false) =>
  cached(
    `employee:${id}`,
    () =>
      liveOrDemo(
        () => api.get<EmployeeProfile>(`/api/smb/employees/${id}`).then((r) => r.data),
        demoEmployeeProfile(id) ?? (DEMO_BUNDLE.employees[0] as unknown as EmployeeProfile),
      ),
    force,
  );

export const explainViolation = (violation_id: string) =>
  api.post<{ explanation: string; ai_generated: boolean }>("/api/smb/compliance/explain", { violation_id }).then((r) => r.data);

async function askLive(
  question: string,
  history: { role: string; content: string }[],
  priorPlan?: Record<string, unknown> | null,
): Promise<AskResponse | null> {
  const body = { question, history, prior_plan: priorPlan ?? null };
  try {
    const r = await api.post<AskResponse>("/api/smb/ask", body, { timeout: ASK_API_MS });
    apiLive = true;
    return r.data;
  } catch {
    return null;
  }
}

/** Bundled router could not map the question to a specific answer. */
function isGenericDemoFallback(r: AskResponse): boolean {
  return /could not match that question/i.test(r.answer || "");
}

/** Old API / planner fallback — total spend KPI instead of answering the question. */
export function isWeakAskResponse(r: AskResponse): boolean {
  const a = (r.answer || "").toLowerCase();
  if (/sample file has|high-risk flags\. try|try ['"]which merchants look suspicious/i.test(a)) {
    return true;
  }
  if (/across [\d,]+ transactions and [\d,]+ high-risk flags/i.test(a)) {
    return true;
  }
  if (r.chart === "kpi" && Array.isArray(r.data) && r.data.length === 1) {
    const name = String(r.data[0]?.name ?? "").toLowerCase();
    if (name.includes("total spend") || name.includes("sample")) {
      return true;
    }
  }
  return false;
}

/** Prefer live Gemini when the API has data; otherwise use the bundled question router. */
export async function ask(
  question: string,
  history: { role: string; content: string }[],
  priorPlan?: Record<string, unknown> | null,
): Promise<AskResponse> {
  startApiProbe();
  const hasDataset = await probeApiLive();
  const demo = askFromDemoBundle(question);

  if (!hasDataset) {
    return demo;
  }

  if (!isGenericDemoFallback(demo)) {
    const live = await askLive(question, history, priorPlan);
    if (live && !isWeakAskResponse(live)) {
      return live;
    }
    return demo;
  }

  const live = await askLive(question, history, priorPlan);
  if (live && !isWeakAskResponse(live)) {
    return live;
  }
  return demo;
}

export const askThinkMs = ASK_THINK_MS;

export const createApprovalRequest = (body: {
  requester_name?: string;
  card_code?: string;
  department?: string;
  amount: number;
  merchant?: string;
  category?: string;
  business_purpose?: string;
  date?: string;
  notes?: string;
}) =>
  api.post<ApprovalRequest>("/api/smb/approvals/create", body).then((r) => {
    invalidateCache();
    return r.data;
  });

export const exportAuditLog = (format: "json" | "csv" = "json") =>
  api.get<{ format: string; filename: string; content: unknown }>("/api/smb/audit/export", {
    params: { format },
  }).then((r) => r.data);

export const getCompliance = (force = false, limit = 200) =>
  cached(
    `compliance:${limit}`,
    () =>
      liveOrDemo(
        () => api.get<ComplianceResult>("/api/smb/compliance", { params: { limit } }).then((r) => r.data),
        DEMO_BUNDLE.compliance,
      ),
    force,
  );

export const dismissViolation = (violation_id: string, note = "") =>
  api.post("/api/smb/compliance/dismiss", { violation_id, note }).then((r) => {
    invalidateCache();
    return r.data;
  });

export const restoreViolation = (violation_id: string) =>
  api.post("/api/smb/compliance/restore", { violation_id }).then((r) => {
    invalidateCache();
    return r.data;
  });

export const getPolicy = (force = false) =>
  cached(
    "policy",
    () => liveOrDemo(() => api.get<PolicyConfig>("/api/smb/policy").then((r) => r.data), DEMO_BUNDLE.policy),
    force,
  );

export const updatePolicy = (patch: Partial<PolicyConfig>) =>
  api.put<PolicyConfig>("/api/smb/policy", patch).then((r) => {
    invalidateCache();
    return r.data;
  });

export const getApprovals = (status?: string, force = false) =>
  cached(
    `approvals:${status ?? "all"}`,
    () =>
      liveOrDemo(
        () => api.get<ApprovalRequest[]>("/api/smb/approvals", { params: { status } }).then((r) => r.data),
        status === "pending"
          ? DEMO_BUNDLE.approvals.filter((a) => a.status === "pending")
          : DEMO_BUNDLE.approvals,
      ),
    force,
  );

export const getApproval = (id: string, force = false) =>
  cached(
    `approval:${id}`,
    () =>
      liveOrDemo(
        () => api.get<ApprovalRequest>(`/api/smb/approvals/${id}`).then((r) => r.data),
        demoApproval(id) ?? DEMO_BUNDLE.approvals[0],
      ),
    force,
  );

export const decideApproval = (
  id: string,
  decision: "approve" | "deny" | "needs_info",
  note = "",
) =>
  api
    .post<ApprovalRequest>(`/api/smb/approvals/${id}/decide`, { decision, note })
    .then((r) => {
      invalidateCache();
      return r.data;
    });

export const undoApproval = (id: string, approver = "Finance Approver") =>
  api
    .post<ApprovalRequest>(`/api/smb/approvals/${id}/undo`, { approver })
    .then((r) => {
      invalidateCache();
      return r.data;
    });

export const getEmployeeRisk = (force = false) =>
  cached(
    "employee-risk",
    () =>
      liveOrDemo(
        () => api.get<EmployeeSummary[]>("/api/smb/employee-risk").then((r) => r.data),
        DEMO_BUNDLE.employee_risk,
      ),
    force,
  );

export const getPolicyTrends = (force = false) =>
  cached(
    "policy-trends",
    () =>
      liveOrDemo(
        () => api.get<PolicyTrends>("/api/smb/policy-trends").then((r) => r.data),
        DEMO_BUNDLE.policy_trends,
      ),
    force,
  );

export const getReports = (force = false) =>
  cached(
    "reports",
    () => liveOrDemo(() => api.get<ExpenseReport[]>("/api/smb/reports").then((r) => r.data), DEMO_BUNDLE.reports),
    force,
  );

export const getReport = (id: string, force = false) =>
  cached(
    `report:${id}`,
    () =>
      liveOrDemo(
        () => api.get<ExpenseReport>(`/api/smb/reports/${id}`).then((r) => r.data),
        demoReport(id) ?? DEMO_BUNDLE.reports[0],
      ),
    force,
  );

export const decideReport = (
  id: string,
  decision: "approve" | "deny",
  note = "",
) =>
  api
    .post<ExpenseReport>(`/api/smb/reports/${id}/decide`, { decision, note })
    .then((r) => {
      invalidateCache();
      return r.data;
    });

export type { Recommendation };
