package com.mpcnajib.intact.service;

import com.mpcnajib.intact.domain.Transaction;
import com.mpcnajib.intact.util.MapsUtil;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class ComplianceService {
  private final PolicyService policy;
  private final AnalyticsService analytics;
  private final DatasetService datasets;
  private final RiskService risk;
  private Map<String, Object> complianceCache;

  public ComplianceService(
      PolicyService policy, AnalyticsService analytics, DatasetService datasets, RiskService risk
  ) {
    this.policy = policy;
    this.analytics = analytics;
    this.datasets = datasets;
    this.risk = risk;
    CacheCoordinator.register(this::invalidate);
  }

  public void invalidate() {
    complianceCache = null;
  }

  public Map<String, Object> buildCompliance() {
    if (complianceCache != null) return new LinkedHashMap<>(complianceCache);
    var scan = policy.scan();
    var out = new LinkedHashMap<>(scan);
    out.put("trends", violationTrends());
    out.put("department_risk", List.of());
    out.put("amount_by_rule", ((Map<?, ?>) scan.get("summary")).get("by_rule"));
    complianceCache = out;
    return new LinkedHashMap<>(out);
  }

  public List<Map<String, Object>> violationTrends() {
    @SuppressWarnings("unchecked")
    var violations = (List<Map<String, Object>>) policy.scan().get("violations");
    var byMonth = new HashMap<String, Integer>();
    for (var v : violations) {
      String d = (String) v.get("date");
      if (d != null && d.length() >= 7) {
        byMonth.merge(d.substring(0, 7), 1, Integer::sum);
      }
    }
    return byMonth.entrySet().stream().sorted(Map.Entry.comparingByKey())
        .map(e -> MapsUtil.chartPair(e.getKey(), e.getValue()))
        .toList();
  }

  public List<Map<String, Object>> employeeRiskList() {
    var ds = datasets.require();
    var scan = policy.scan();
    @SuppressWarnings("unchecked")
    var violations = (List<Map<String, Object>>) scan.get("violations");
    var byEmp = violations.stream().collect(Collectors.groupingBy(v -> (String) v.get("employee_id")));

    var out = new ArrayList<Map<String, Object>>();
    var grouped = ds.transactions.stream().collect(Collectors.groupingBy(t -> t.employeeId));
    for (var e : grouped.entrySet()) {
      var txns = e.getValue();
      var first = txns.getFirst();
      double total = txns.stream().mapToDouble(t -> t.amount).sum();
      var empViolations = byEmp.getOrDefault(e.getKey(), List.of());
      double flagged = empViolations.stream().mapToDouble(v -> ((Number) v.get("amount")).doubleValue()).sum();
      long missingReceipts = txns.stream().filter(t -> !t.hasReceipt && t.amount > 50).count();
      int vCount = empViolations.size();
      int riskScore = Math.min(100, vCount * 8 + (int) (flagged / Math.max(1, total) * 30));
      var row = new LinkedHashMap<String, Object>();
      row.put("employee_id", first.employeeId);
      row.put("employee_name", first.employeeName);
      row.put("cardholder_label", first.cardholderLabel);
      row.put("transaction_code", first.transactionCode);
      row.put("department", first.department);
      row.put("total_spend", MapsUtil.round(total));
      row.put("transaction_count", txns.size());
      row.put("risk_score", riskScore);
      row.put("risk_level", risk.level(riskScore));
      row.put("violation_count", vCount);
      row.put("flagged_amount", MapsUtil.round(flagged));
      row.put("missing_receipts", missingReceipts);
      row.put("badges", vCount > 0 ? List.of("policy") : List.of());
      out.add(row);
    }
    out.sort(Comparator.comparingInt((Map<String, Object> m) -> (Integer) m.get("risk_score")).reversed());
    return out;
  }

  public List<Map<String, Object>> actionItems() {
    var scan = policy.scan();
    @SuppressWarnings("unchecked")
    var summary = (Map<String, Object>) scan.get("summary");
    var items = new ArrayList<Map<String, Object>>();
    int high = ((Number) summary.getOrDefault("high", 0)).intValue();
    if (high > 0) {
      items.add(Map.of(
          "id", "policy_high",
          "severity", "high",
          "title", high + " high-severity policy violations",
          "detail", "Review flagged charges in Rule checks.",
          "link", "/compliance"
      ));
    }
    return items.stream().limit(8).toList();
  }

  public Map<String, Object> policyRuleTrends() {
    @SuppressWarnings("unchecked")
    var summary = (Map<String, Object>) policy.scan().get("summary");
    return Map.of(
        "by_rule_count", summary.getOrDefault("by_rule", Map.of()),
        "by_rule_amount", Map.of(),
        "monthly_trends", violationTrends()
    );
  }
}
