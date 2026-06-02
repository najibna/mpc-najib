package com.mpcnajib.intact.web;

import com.mpcnajib.intact.service.AnalyticsService;
import com.mpcnajib.intact.service.ApprovalsService;
import com.mpcnajib.intact.service.CacheCoordinator;
import com.mpcnajib.intact.service.ComplianceService;
import com.mpcnajib.intact.service.DatasetService;
import com.mpcnajib.intact.service.DemoInsightsService;
import com.mpcnajib.intact.service.HomeService;
import com.mpcnajib.intact.service.InsightExtrasService;
import com.mpcnajib.intact.service.IntelligenceService;
import com.mpcnajib.intact.service.LlmService;
import com.mpcnajib.intact.service.NlqService;
import com.mpcnajib.intact.service.PolicyService;
import com.mpcnajib.intact.service.ReportsService;
import com.mpcnajib.intact.store.SessionStore;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/smb")
public class SmbController {
  private final DatasetService datasets;
  private final HomeService home;
  private final AnalyticsService analytics;
  private final ComplianceService compliance;
  private final PolicyService policy;
  private final DemoInsightsService demoInsights;
  private final InsightExtrasService extras;
  private final IntelligenceService intelligence;
  private final NlqService nlq;
  private final LlmService llm;
  private final ApprovalsService approvals;
  private final ReportsService reports;
  private final SessionStore store;

  public SmbController(
      DatasetService datasets,
      HomeService home,
      AnalyticsService analytics,
      ComplianceService compliance,
      PolicyService policy,
      DemoInsightsService demoInsights,
      InsightExtrasService extras,
      IntelligenceService intelligence,
      NlqService nlq,
      LlmService llm,
      ApprovalsService approvals,
      ReportsService reports,
      SessionStore store
  ) {
    this.datasets = datasets;
    this.home = home;
    this.analytics = analytics;
    this.compliance = compliance;
    this.policy = policy;
    this.demoInsights = demoInsights;
    this.extras = extras;
    this.intelligence = intelligence;
    this.nlq = nlq;
    this.llm = llm;
    this.approvals = approvals;
    this.reports = reports;
    this.store = store;
  }

  private void requireDataset() {
    datasets.require();
  }

  @GetMapping("/home")
  public Map<String, Object> home() {
    requireDataset();
    return home.buildHome();
  }

  @GetMapping("/meta")
  public Map<String, Object> meta() {
    return home.buildMeta();
  }

  @PostMapping("/import")
  public Map<String, Object> importExcel(@RequestParam("file") MultipartFile file) throws Exception {
    String name = file.getOriginalFilename();
    if (name == null || !(name.endsWith(".xlsx") || name.endsWith(".xls"))) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please upload an Excel file (.xlsx).");
    }
    datasets.loadFromBytes(file.getBytes(), name);
    CacheCoordinator.invalidateAll();
    home.buildHome();
    return store.importMeta;
  }

  @GetMapping("/action-items")
  public List<Map<String, Object>> actionItems() {
    requireDataset();
    return compliance.actionItems();
  }

  @GetMapping("/overview")
  public Map<String, Object> overview() {
    requireDataset();
    return analytics.overview();
  }

  @GetMapping("/budgets")
  public List<Map<String, Object>> budgets() {
    requireDataset();
    return analytics.budgetStatus();
  }

  @GetMapping("/vendors")
  public List<Map<String, Object>> vendors() {
    requireDataset();
    return analytics.vendorConsolidation();
  }

  @GetMapping("/scores")
  public Map<String, Object> scores() {
    requireDataset();
    return extras.scores();
  }

  @GetMapping("/intelligence")
  public Map<String, Object> intelligence() {
    requireDataset();
    return intelligence.analyze();
  }

  @GetMapping("/leaks")
  public Map<String, Object> leaks() {
    requireDataset();
    return extras.leaks();
  }

  @GetMapping("/hidden-insights")
  public Map<String, Object> hiddenInsights() {
    requireDataset();
    return extras.hiddenInsights();
  }

  @GetMapping("/policy-copilot")
  public Map<String, Object> policyCopilot(@RequestParam(defaultValue = "50") int limit) {
    requireDataset();
    return extras.policyCopilot(Math.min(limit, 100));
  }

  @GetMapping("/demo-insights")
  public Map<String, Object> demoInsights() {
    requireDataset();
    return demoInsights.autoInsights();
  }

  @GetMapping("/command-center")
  public Map<String, Object> commandCenter() {
    requireDataset();
    return demoInsights.commandCenter();
  }

  @PostMapping("/command-center/cfo-summary")
  public Map<String, Object> cfoSummary() {
    requireDataset();
    return demoInsights.generateCfoSummary();
  }

  @GetMapping("/anomalies")
  public Map<String, Object> anomalies() {
    requireDataset();
    return extras.anomalies();
  }

  @GetMapping("/forecast")
  public Map<String, Object> forecast() {
    requireDataset();
    return extras.forecast();
  }

  @GetMapping("/receipts")
  public Map<String, Object> receipts() {
    requireDataset();
    return extras.receipts();
  }

  @GetMapping("/employee-risk")
  public List<Map<String, Object>> employeeRisk() {
    requireDataset();
    return compliance.employeeRiskList();
  }

  @GetMapping("/policy-trends")
  public Map<String, Object> policyTrends() {
    requireDataset();
    return compliance.policyRuleTrends();
  }

  @GetMapping("/employees")
  public List<Map<String, Object>> employees() {
    requireDataset();
    return compliance.employeeRiskList();
  }

  @GetMapping("/employees/{employeeId}")
  public Map<String, Object> employee(@PathVariable String employeeId) {
    requireDataset();
    var profile = analytics.employeeProfile(employeeId);
    if (profile == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found.");
    }
    return profile;
  }

  @PostMapping("/ask")
  public Map<String, Object> ask(@RequestBody AskBody body) {
    requireDataset();
    if (body.question == null || body.question.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question is required.");
    }
    return nlq.answer(body.question.trim(), body.history, body.priorPlan);
  }

  @GetMapping("/policy")
  public Map<String, Object> getPolicy() {
    return store.policyConfig();
  }

  @PutMapping("/policy")
  public Map<String, Object> updatePolicy(@RequestBody Map<String, Object> body) {
    var cfg = store.policyConfig();
    if (body.get("receipt_threshold") != null) {
      cfg.put("receipt_threshold", body.get("receipt_threshold"));
    }
    if (body.get("approval_cap") != null) {
      cfg.put("approval_cap", body.get("approval_cap"));
    }
    CacheCoordinator.invalidateAll();
    return cfg;
  }

  @PostMapping("/policy/reset")
  public Map<String, Object> resetPolicy() {
    store.resetPolicy();
    CacheCoordinator.invalidateAll();
    return store.policyConfig();
  }

  @GetMapping("/compliance")
  public Map<String, Object> compliance(
      @RequestParam(defaultValue = "200") int limit,
      @RequestParam(defaultValue = "0") int offset
  ) {
    requireDataset();
    var base = compliance.buildCompliance();
    @SuppressWarnings("unchecked")
    var all = (List<Map<String, Object>>) base.get("violations");
    int lim = Math.max(1, Math.min(limit, 500));
    int off = Math.max(0, offset);
    var page = all.subList(Math.min(off, all.size()), Math.min(off + lim, all.size()));
    var out = new LinkedHashMap<>(base);
    out.put("violations", page);
    out.put("violations_total", all.size());
    out.put("violations_limit", lim);
    out.put("violations_offset", off);
    return out;
  }

  @PostMapping("/compliance/status")
  public Map<String, Object> violationStatus(@RequestBody Map<String, Object> body) {
    String id = (String) body.get("violation_id");
    store.violationStatus.put(id, Map.of(
        "status", body.get("status"),
        "note", body.getOrDefault("note", ""),
        "reviewer", body.getOrDefault("reviewer", "Reviewer"),
        "updated_at", store.nowIso()
    ));
    CacheCoordinator.invalidateAll();
    return store.violationState(id);
  }

  @PostMapping("/compliance/explain")
  public Map<String, Object> explainViolation(@RequestBody Map<String, String> body) {
    requireDataset();
    var scan = policy.scan();
    @SuppressWarnings("unchecked")
    var violations = (List<Map<String, Object>>) scan.get("violations");
    var v = violations.stream()
        .filter(x -> body.get("violation_id").equals(x.get("violation_id")))
        .findFirst()
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Violation not found."));
    String explanation = llm.chat(
        List.of(
            Map.of("role", "system", "content", "Explain this policy violation in 2 sentences."),
            Map.of("role", "user", "content", String.valueOf(v.get("reasons")))
        ),
        0.3,
        250
    );
    if (explanation == null) {
      @SuppressWarnings("unchecked")
      var reasons = (List<String>) v.get("reasons");
      explanation = reasons.isEmpty() ? "Policy violation flagged." : reasons.getFirst();
    }
    return Map.of(
        "violation_id", body.get("violation_id"),
        "explanation", explanation,
        "ai_generated", llm.enabled()
    );
  }

  @PostMapping("/compliance/dismiss")
  public Map<String, Object> dismiss(@RequestBody Map<String, String> body) {
    store.dismissedViolations.add(body.get("violation_id"));
    CacheCoordinator.invalidateAll();
    return Map.of("dismissed", body.get("violation_id"));
  }

  @PostMapping("/compliance/restore")
  public Map<String, Object> restore(@RequestBody Map<String, String> body) {
    store.dismissedViolations.remove(body.get("violation_id"));
    CacheCoordinator.invalidateAll();
    return Map.of("restored", body.get("violation_id"));
  }

  @GetMapping("/approvals")
  public List<Map<String, Object>> listApprovals(@RequestParam(required = false) String status) {
    requireDataset();
    return approvals.list(status);
  }

  @PostMapping("/approvals/create")
  public Map<String, Object> createApproval(@RequestBody Map<String, Object> body) {
    requireDataset();
    return approvals.create(body);
  }

  @GetMapping("/approvals/{requestId}")
  public Map<String, Object> approvalDetail(@PathVariable String requestId) {
    requireDataset();
    var req = approvals.get(requestId);
    if (req == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Approval request not found.");
    }
    return req;
  }

  @PostMapping("/approvals/bulk")
  public Map<String, Object> bulkApprovals(@RequestBody Map<String, Object> body) {
    @SuppressWarnings("unchecked")
    var ids = (List<String>) body.get("request_ids");
    String decision = (String) body.get("decision");
    var results = ids.stream()
        .map(id -> approvals.decide(id, decision, (String) body.getOrDefault("approver", "Finance Approver"), ""))
        .filter(r -> r != null)
        .toList();
    return Map.of("processed", results.size(), "results", results);
  }

  @PostMapping("/approvals/{requestId}/decide")
  public Map<String, Object> decideApproval(@PathVariable String requestId, @RequestBody Map<String, String> body) {
    var req = approvals.decide(requestId, body.get("decision"), body.getOrDefault("approver", "Finance Approver"), body.getOrDefault("note", ""));
    if (req == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Approval request not found.");
    }
    return req;
  }

  @PostMapping("/approvals/{requestId}/undo")
  public Map<String, Object> undoApproval(@PathVariable String requestId, @RequestBody(required = false) Map<String, String> body) {
    String approver = body == null ? "Finance Approver" : body.getOrDefault("approver", "Finance Approver");
    var req = approvals.undo(requestId, approver);
    if (req == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nothing to undo for this review item.");
    }
    return req;
  }

  @GetMapping("/reports")
  public List<Map<String, Object>> listReports() {
    requireDataset();
    return reports.list();
  }

  @GetMapping("/reports/{reportId}")
  public Map<String, Object> reportDetail(@PathVariable String reportId) {
    requireDataset();
    var rep = reports.get(reportId, true);
    if (rep == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found.");
    }
    return rep;
  }

  @GetMapping("/reports/{reportId}/export")
  public Map<String, Object> exportReport(@PathVariable String reportId, @RequestParam(defaultValue = "json") String format) {
    requireDataset();
    var rep = reports.get(reportId, true);
    if (rep == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found.");
    }
    if ("csv".equals(format)) {
      return Map.of("format", "csv", "filename", reportId + ".csv", "content", "report_id,total\n" + reportId + "," + rep.get("total"));
    }
    return Map.of("format", "json", "content", rep);
  }

  @PostMapping("/reports/{reportId}/decide")
  public Map<String, Object> decideReport(@PathVariable String reportId, @RequestBody Map<String, String> body) {
    requireDataset();
    var rep = reports.decide(reportId, body.get("decision"), body.getOrDefault("approver", "CFO"), body.getOrDefault("note", ""));
    if (rep == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found.");
    }
    return rep;
  }

  @GetMapping("/audit")
  public List<Map<String, Object>> audit() {
    return store.auditLog.reversed();
  }

  @GetMapping("/audit/export")
  public Map<String, Object> auditExport(@RequestParam(defaultValue = "json") String format) {
    var entries = store.auditLog.reversed();
    if ("csv".equals(format)) {
      return Map.of("format", "csv", "filename", "audit_log.csv", "content", "timestamp,action,actor,target\n");
    }
    return Map.of("format", "json", "filename", "audit_log.json", "content", entries);
  }

  public static class AskBody {
    public String question;
    public List<Map<String, Object>> history;
    public Map<String, Object> priorPlan;
  }
}
