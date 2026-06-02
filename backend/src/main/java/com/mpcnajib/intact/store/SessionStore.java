package com.mpcnajib.intact.store;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class SessionStore {
  public static final double RECEIPT_THRESHOLD = 50.0;
  public static final double APPROVAL_CAP = 50.0;

  private final Map<String, Object> policyConfig = defaultPolicy();
  public final Map<String, Map<String, Object>> approvals = new ConcurrentHashMap<>();
  public final Map<String, Map<String, Object>> reports = new ConcurrentHashMap<>();
  public final List<Map<String, Object>> auditLog = new ArrayList<>();
  public final Set<String> dismissedViolations = ConcurrentHashMap.newKeySet();
  public final Map<String, Map<String, Object>> violationStatus = new ConcurrentHashMap<>();
  public Map<String, Object> importMeta = new LinkedHashMap<>();

  @SuppressWarnings("unchecked")
  public Map<String, Object> policyConfig() {
    return policyConfig;
  }

  public static Map<String, Object> defaultPolicy() {
    var rules = new LinkedHashMap<String, Object>();
    rules.put("receipt_required", true);
    rules.put("approval_required", true);
    rules.put("split_evasion", true);
    rules.put("alcohol", true);
    rules.put("personal_expense", true);
    rules.put("ticket_fine", true);
    rules.put("duplicate", true);
    rules.put("meal_context", true);
    rules.put("missing_purpose", true);
    rules.put("travel_context", true);
    rules.put("excessive_tip", true);
    rules.put("round_number", true);
    rules.put("foreign_fx", true);

    var cfg = new LinkedHashMap<String, Object>();
    cfg.put("receipt_threshold", RECEIPT_THRESHOLD);
    cfg.put("approval_cap", APPROVAL_CAP);
    cfg.put("rules", rules);
    cfg.put("restricted_merchants", List.of("netflix", "spotify", "gift card", "apple gift"));
    cfg.put("restricted_categories", List.of("entertainment"));
    var severity = new LinkedHashMap<String, Object>();
    severity.put("TICKET_FINE", "high");
    severity.put("PERSONAL_EXPENSE", "high");
    severity.put("SPLIT_EVASION", "high");
    severity.put("ALCOHOL", "high");
    severity.put("OVER_CAP", "high");
    severity.put("DUPLICATE", "medium");
    severity.put("MISSING_RECEIPT", "medium");
    severity.put("APPROVAL_REQUIRED", "medium");
    severity.put("MISSING_PURPOSE", "medium");
    severity.put("SOLO_MEAL_HIGH", "medium");
    severity.put("OVER_THRESHOLD", "medium");
    severity.put("ROUND_NUMBER", "low");
    severity.put("FOREIGN_FX", "medium");
    severity.put("EXCESSIVE_TIP", "medium");
    cfg.put("severity_map", severity);
    cfg.put("department_caps", new LinkedHashMap<String, Object>());
    return cfg;
  }

  public void resetPolicy() {
    policyConfig.clear();
    policyConfig.putAll(defaultPolicy());
  }

  public Map<String, Object> violationState(String violationId) {
    return violationStatus.getOrDefault(
        violationId,
        Map.of("status", "New", "note", "", "reviewer", "")
    );
  }

  public String nowIso() {
    return Instant.now().toString();
  }

  public void logAudit(String action, String actor, String target, Map<String, Object> detail) {
    var entry = new LinkedHashMap<String, Object>();
    entry.put("timestamp", nowIso());
    entry.put("action", action);
    entry.put("actor", actor);
    entry.put("target", target);
    entry.put("detail", detail == null ? Map.of() : detail);
    auditLog.add(entry);
  }
}
