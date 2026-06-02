package com.mpcnajib.intact.service;

import com.mpcnajib.intact.util.MapsUtil;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

/** Anomalies, forecast, receipts, scores, leaks, hidden insights, policy copilot. */
@Service
public class InsightExtrasService {
  private final DatasetService datasets;
  private final AnalyticsService analytics;
  private final IntelligenceService intelligence;
  private final PolicyService policy;
  private final DataAvailabilityService availability;

  public InsightExtrasService(
      DatasetService datasets,
      AnalyticsService analytics,
      IntelligenceService intelligence,
      PolicyService policy,
      DataAvailabilityService availability
  ) {
    this.datasets = datasets;
    this.analytics = analytics;
    this.intelligence = intelligence;
    this.policy = policy;
    this.availability = availability;
  }

  public Map<String, Object> anomalies() {
    var intel = intelligence.analyze();
    @SuppressWarnings("unchecked")
    var top = (List<Map<String, Object>>) intel.get("top_risky");
    var signals = new ArrayList<Map<String, Object>>();
    for (var t : top.stream().limit(30).toList()) {
      var sig = new java.util.LinkedHashMap<String, Object>();
      sig.put("signal_id", "sig_" + t.get("transaction_id"));
      sig.put("signal_type", "STATISTICAL_OUTLIER");
      sig.put("severity", t.get("severity"));
      sig.put("transaction_id", t.get("transaction_id"));
      sig.put("employee_name", t.get("cardholder_label"));
      sig.put("cardholder_label", t.get("cardholder_label"));
      sig.put("transaction_code", t.get("transaction_code"));
      sig.put("date", t.get("date"));
      sig.put("merchant_name", t.get("merchant_name"));
      sig.put("amount", t.get("amount"));
      sig.put("message", t.get("explanation"));
      sig.put("recommended_action", t.get("recommended_action"));
      signals.add(sig);
    }
    return Map.of(
        "summary", Map.of(
            "total_signals", signals.size(),
            "high", signals.stream().filter(s -> "high".equals(s.get("severity"))).count(),
            "medium", signals.size(),
            "low", 0,
            "flagged_amount", ((Map<?, ?>) intel.get("summary")).get("flagged_amount"),
            "by_type", Map.of("STATISTICAL_OUTLIER", signals.size())
        ),
        "signals", signals
    );
  }

  public Map<String, Object> forecast() {
    var budgets = analytics.budgetStatus();
    return Map.of(
        "departments", budgets,
        "alerts", List.of(),
        "category_trends", List.of(),
        "data_months", List.of(),
        "budget_note", "Run-rate from uploaded Excel only."
    );
  }

  public Map<String, Object> receipts() {
    var avail = availability.get();
    boolean hasCol = Boolean.TRUE.equals(avail.get("has_receipt_column"));
    double threshold = 50;
    var txns = datasets.require().transactions;
    var missing = txns.stream().filter(t -> t.amount > threshold && (!hasCol || !t.hasReceipt)).toList();
    return Map.of(
        "data_available", hasCol,
        "summary", Map.of(
            "transactions_over_threshold", missing.size(),
            "receipts_matched", hasCol ? txns.size() - missing.size() : 0,
            "receipts_missing", missing.size(),
            "compliance_rate_pct", txns.isEmpty() ? 100 : MapsUtil.round(
                (txns.size() - missing.size()) * 100.0 / txns.size()),
            "missing_amount", MapsUtil.round(missing.stream().mapToDouble(t -> t.amount).sum())
        ),
        "unmatched", missing.stream().limit(20).map(t -> Map.of(
            "transaction_id", t.transactionId,
            "date", t.date,
            "employee_name", t.cardholderLabel,
            "merchant_name", t.merchantName,
            "amount", t.amount
        )).toList(),
        "recent_matches", List.of(),
        "by_department", List.of(),
        "note", hasCol ? "" : "Receipt column not present in upload."
    );
  }

  public Map<String, Object> scores() {
    var intel = intelligence.analyze();
    @SuppressWarnings("unchecked")
    var summary = (Map<String, Object>) intel.get("summary");
    return Map.of(
        "transaction_risk", Map.of(
            "score", summary.get("avg_risk_score"),
            "level", "Medium",
            "label", "Risk",
            "detail", summary.get("high_risk_count") + " high-risk transactions",
            "drilldown", "/insights"
        ),
        "policy_compliance", Map.of("score", 0, "level", "-", "label", "Rules", "detail", "", "drilldown", "/compliance"),
        "vendor_optimization", Map.of("score", 0, "level", "-", "label", "Vendors", "detail", "", "drilldown", "/insights"),
        "methodology", "Deterministic scoring from uploaded Excel."
    );
  }

  public Map<String, Object> leaks() {
    var vendors = analytics.vendorConsolidation();
    var leaks = vendors.stream().limit(3).map(v -> Map.of(
        "leak_type", "Vendor concentration",
        "merchant_name", v.get("merchant_name"),
        "evidence", "High spend concentration",
        "total_impact", v.get("total_spend"),
        "severity", "medium"
    )).toList();
    return Map.of("leaks", leaks, "summary", Map.of("count", leaks.size()));
  }

  public Map<String, Object> hiddenInsights() {
    var ov = analytics.overview();
    return Map.of(
        "insights", List.of(Map.of(
            "id", "monthly_trend",
            "title", "Monthly spend pattern",
            "detail", "Average monthly spend about $" + ov.get("monthly_avg"),
            "surprise_factor", "low",
            "link", "/insights",
            "category", "growth"
        ))
    );
  }

  public Map<String, Object> policyCopilot(int limit) {
    @SuppressWarnings("unchecked")
    var violations = (List<Map<String, Object>>) policy.scan().get("violations");
    return Map.of(
        "violations", violations.stream().limit(limit).toList(),
        "summary", policy.scan().get("summary")
    );
  }
}
