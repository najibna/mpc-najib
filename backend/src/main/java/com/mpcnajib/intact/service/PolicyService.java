package com.mpcnajib.intact.service;

import com.mpcnajib.intact.domain.Transaction;
import com.mpcnajib.intact.store.SessionStore;
import com.mpcnajib.intact.util.MapsUtil;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class PolicyService {
  private static final Set<Double> ROUND_AMOUNTS = Set.of(
      50.0, 100.0, 150.0, 200.0, 250.0, 500.0, 1000.0, 1500.0, 2000.0, 5000.0
  );
  private static final Set<String> DOMESTIC = Set.of("USA", "US", "CAN", "CA", "NAN", "NONE", "—", "");
  private static final Map<String, Integer> SEV = Map.of("high", 3, "medium", 2, "low", 1);

  private final DatasetService datasets;
  private final SessionStore store;
  private final RiskService risk;
  private final DataAvailabilityService availability;
  private Map<String, Object> scanCache;

  public PolicyService(
      DatasetService datasets, SessionStore store, RiskService risk, DataAvailabilityService availability
  ) {
    this.datasets = datasets;
    this.store = store;
    this.risk = risk;
    this.availability = availability;
    CacheCoordinator.register(this::invalidate);
  }

  public void invalidate() {
    scanCache = null;
  }

  @SuppressWarnings("unchecked")
  public Map<String, Object> scan() {
    if (scanCache != null) return new LinkedHashMap<>(scanCache);
    var ds = datasets.require();
    var cfg = store.policyConfig();
    var rules = (Map<String, Object>) cfg.get("rules");
    double receiptThreshold = ((Number) cfg.get("receipt_threshold")).doubleValue();
    double approvalCap = ((Number) cfg.get("approval_cap")).doubleValue();
    var avail = availability.get();
    boolean hasReceiptCol = Boolean.TRUE.equals(avail.get("has_receipt_column"));
    boolean hasApprovalCol = Boolean.TRUE.equals(avail.get("has_approval_column"));
    boolean hasPurposeCol = Boolean.TRUE.equals(avail.get("has_business_purpose_column"));

    Set<String> splitIds = detectSplitEvasion(ds.transactions, approvalCap, rules);
    var violations = new ArrayList<Map<String, Object>>();

    for (var t : ds.transactions) {
      var triggered = new ArrayList<Map<String, Object>>();
      String text = (t.merchantName + " " + t.businessPurpose).toLowerCase(Locale.ROOT);
      if (ruleOn(rules, "ticket_fine") && contains(text, List.of("violation", "ticket", "fine", "citation", "penalty"))) {
        triggered.add(rule("TICKET_FINE", "high", "Traffic/parking fine. Never reimbursable per policy.",
            "Mark non-reimbursable; recover from employee."));
      }
      if (ruleOn(rules, "personal_expense") && contains(text, List.of("gift card", "netflix", "spotify", "personal"))) {
        triggered.add(rule("PERSONAL_EXPENSE", "high", "Gift card or personal merchant on a corporate card.",
            "Confirm business purpose; corporate cards are business-only."));
      }
      if (hasApprovalCol && ruleOn(rules, "approval_required") && t.amount > approvalCap && !t.hasApproval) {
        triggered.add(rule("APPROVAL_REQUIRED", "medium",
            "$%.2f exceeds $%.0f and lacks manager pre-authorization.".formatted(t.amount, approvalCap),
            "Require manager approval before reimbursement."));
      }
      if (splitIds.contains(t.transactionId)) {
        triggered.add(rule("SPLIT_EVASION", "high",
            "Possible split charge to stay under the $%.0f approval cap.".formatted(approvalCap),
            "Review same-day charges at this merchant for structuring."));
      }
      if (hasReceiptCol && ruleOn(rules, "receipt_required") && t.amount > receiptThreshold && !t.hasReceipt) {
        triggered.add(rule("MISSING_RECEIPT", "medium",
            "$%.2f is over the $%.0f receipt threshold but has no receipt.".formatted(t.amount, receiptThreshold),
            "Request receipt before reimbursement."));
      } else if (!hasReceiptCol && t.amount > receiptThreshold) {
        triggered.add(rule("MISSING_RECEIPT", "medium",
            "$%.2f exceeds receipt threshold; receipt column not in file.".formatted(t.amount),
            "Request receipt before reimbursement."));
      }
      if (ruleOn(rules, "round_number") && ROUND_AMOUNTS.contains(t.amount) && t.amount >= approvalCap) {
        triggered.add(rule("ROUND_NUMBER", "low",
            "Round amount $%.0f — common fraud/error pattern worth verifying.".formatted(t.amount),
            "Confirm receipt and business purpose."));
      }
      if (ruleOn(rules, "foreign_fx") && isForeign(t) && t.amount >= 100) {
        triggered.add(rule("FOREIGN_FX", "medium",
            "Foreign merchant (%s) $%.2f.".formatted(t.merchantCountry, t.amount),
            "Verify business purpose and FX policy for cross-border spend."));
      }
      if (triggered.isEmpty()) continue;
      String severity = triggered.stream()
          .max(Comparator.comparingInt(r -> SEV.getOrDefault((String) r.get("severity"), 0)))
          .map(r -> (String) r.get("severity"))
          .orElse("low");
      var ruleIds = triggered.stream().map(r -> (String) r.get("rule_id")).toList();
      var riskScore = risk.scoreTransaction(
          t.amount, t.hasReceipt, !t.businessPurpose.isBlank(), t.hasApproval, ruleIds,
          receiptThreshold, approvalCap, hasReceiptCol, hasApprovalCol, hasPurposeCol
      );
      String vid = "v_" + t.transactionId;
      if (store.dismissedViolations.contains(vid)) continue;
      var wf = store.violationState(vid);
      var v = new LinkedHashMap<String, Object>();
      v.put("violation_id", vid);
      v.put("transaction_id", t.transactionId);
      v.put("date", t.date);
      v.put("employee_id", t.employeeId);
      v.put("employee_name", t.employeeName);
      v.put("cardholder_label", t.cardholderLabel);
      v.put("transaction_code", t.transactionCode);
      v.put("department", t.department);
      v.put("merchant_name", t.merchantName);
      v.put("category", t.category);
      v.put("mcc", t.mcc);
      v.put("amount", MapsUtil.round(t.amount));
      v.put("channel", t.channel);
      v.put("has_receipt", t.hasReceipt);
      v.put("severity", severity);
      v.put("risk_score", riskScore.get("score"));
      v.put("risk_level", riskScore.get("level"));
      v.put("workflow_status", wf.get("status"));
      v.put("rules", triggered);
      v.put("reasons", triggered.stream().map(r -> r.get("message")).toList());
      v.put("recommended_action", triggered.getFirst().get("action"));
      v.put("deterministic", true);
      violations.add(v);
    }

    violations.sort(Comparator
        .comparingInt((Map<String, Object> v) -> SEV.getOrDefault((String) v.get("severity"), 0))
        .thenComparingDouble(v -> ((Number) v.get("amount")).doubleValue())
        .reversed());

    var result = new LinkedHashMap<String, Object>();
    result.put("summary", summary(violations));
    result.put("repeat_offenders", repeatOffenders(violations));
    result.put("violations", violations);
    scanCache = result;
    return new LinkedHashMap<>(result);
  }

  private static Set<String> detectSplitEvasion(List<Transaction> txns, double cap, Map<String, Object> rules) {
    var split = new HashSet<String>();
    if (!ruleOn(rules, "split_evasion")) return split;
    var groups = txns.stream().collect(Collectors.groupingBy(t -> t.employeeId + "|" + t.merchantName + "|" + t.date));
    for (var g : groups.values()) {
      var under = g.stream().filter(t -> t.amount < cap).toList();
      if (under.size() >= 2 && under.stream().mapToDouble(t -> t.amount).sum() > cap) {
        under.forEach(t -> split.add(t.transactionId));
      }
    }
    return split;
  }

  private static Map<String, Object> summary(List<Map<String, Object>> violations) {
    int high = 0, med = 0, low = 0;
    double flagged = 0;
    var byRule = new HashMap<String, Integer>();
    for (var v : violations) {
      flagged += ((Number) v.get("amount")).doubleValue();
      switch ((String) v.get("severity")) {
        case "high" -> high++;
        case "medium" -> med++;
        default -> low++;
      }
      @SuppressWarnings("unchecked")
      var rules = (List<Map<String, Object>>) v.get("rules");
      for (var r : rules) {
        byRule.merge((String) r.get("rule_id"), 1, Integer::sum);
      }
    }
    return Map.of(
        "total_violations", violations.size(),
        "high", high,
        "medium", med,
        "low", low,
        "flagged_amount", MapsUtil.round(flagged),
        "by_rule", byRule
    );
  }

  private static List<Map<String, Object>> repeatOffenders(List<Map<String, Object>> violations) {
    var counts = new HashMap<String, Integer>();
    for (var v : violations) {
      counts.merge((String) v.get("employee_id"), 1, Integer::sum);
    }
    return counts.entrySet().stream()
        .filter(e -> e.getValue() >= 3)
        .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
        .limit(10)
        .map(e -> Map.<String, Object>of("employee_id", e.getKey(), "violation_count", e.getValue()))
        .toList();
  }

  private static Map<String, Object> rule(String id, String severity, String message, String action) {
    return Map.of("rule_id", id, "severity", severity, "message", message, "action", action,
        "policy_source", "Brim Expense Policy");
  }

  private static boolean ruleOn(Map<String, Object> rules, String key) {
    Object v = rules.get(key);
    return v == null || Boolean.TRUE.equals(v);
  }

  private static boolean contains(String text, List<String> keywords) {
    for (String kw : keywords) {
      if (text.contains(kw)) return true;
    }
    return false;
  }

  private static boolean isForeign(Transaction t) {
    String c = (t.merchantCountry == null ? t.country : t.merchantCountry);
    if (c == null) return false;
    return !DOMESTIC.contains(c.toUpperCase(Locale.ROOT).trim());
  }
}
