package com.mpcnajib.intact.service;

import com.mpcnajib.intact.util.MapsUtil;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class DemoInsightsService {
  private final AnalyticsService analytics;
  private final ComplianceService compliance;
  private final PolicyService policy;
  private final IntelligenceService intelligence;

  public DemoInsightsService(
      AnalyticsService analytics, ComplianceService compliance,
      PolicyService policy, IntelligenceService intelligence
  ) {
    this.analytics = analytics;
    this.compliance = compliance;
    this.policy = policy;
    this.intelligence = intelligence;
  }

  public Map<String, Object> autoInsights() {
    var items = new ArrayList<Map<String, Object>>();
    var intel = intelligence.analyze();
    @SuppressWarnings("unchecked")
    var topRisky = (List<Map<String, Object>>) intel.get("top_risky");
    if (!topRisky.isEmpty()) {
      var t = topRisky.getFirst();
      items.add(Map.of(
          "id", "top_risk",
          "rank", 1,
          "title", "Highest-risk transaction: $" + t.get("amount") + " at " + t.get("merchant_name"),
          "detail", t.getOrDefault("explanation", "Review this charge."),
          "severity", t.getOrDefault("severity", "high"),
          "action_label", "Investigate",
          "link", "/insights?tab=intelligence",
          "evidence", Map.of("transaction_id", t.get("transaction_id"))
      ));
    }
    @SuppressWarnings("unchecked")
    var summary = (Map<String, Object>) policy.scan().get("summary");
    if (((Number) summary.getOrDefault("high", 0)).intValue() > 0) {
      items.add(Map.of(
          "id", "policy_high",
          "rank", items.size() + 1,
          "title", summary.get("high") + " high-severity policy violations",
          "detail", "$" + summary.get("flagged_amount") + " flagged · review charges.",
          "severity", "high",
          "action_label", "Open Rule checks",
          "link", "/compliance",
          "evidence", Map.of()
      ));
    }
    var ov = analytics.overview();
    items.add(Map.of(
        "id", "spend_overview",
        "rank", items.size() + 1,
        "title", "$" + ov.get("total_spend") + " total spend across " + ov.get("transaction_count") + " transactions",
        "detail", "Ask AI for follow-up questions.",
        "severity", "low",
        "action_label", "Ask AI",
        "link", "/ask",
        "evidence", Map.of()
    ));
    return Map.of(
        "headline", "AI found these insights in your uploaded data",
        "subheadline", "Rules detect · AI explains · Humans decide",
        "insights", items.stream().limit(5).toList(),
        "demo_steps", List.of(
            "Upload Excel", "AI analyzes transactions", "Review insights",
            "Ask follow-up questions", "Approve or deny flagged items"
        )
    );
  }

  public Map<String, Object> commandCenter() {
    var ov = analytics.overview();
    var scan = policy.scan();
    @SuppressWarnings("unchecked")
    var summary = (Map<String, Object>) scan.get("summary");
    var intel = intelligence.analyze();
    var cc = new LinkedHashMap<String, Object>();
    cc.put("cfo_summary", null);
    cc.put("scores", Map.of(
        "transaction_risk", Map.of("score", 0, "level", "-", "label", "Risk", "detail", "", "drilldown", "/insights"),
        "policy_compliance", Map.of("score", 0, "level", "-", "label", "Rules", "detail", "", "drilldown", "/compliance"),
        "vendor_optimization", Map.of("score", 0, "level", "-", "label", "Vendors", "detail", "", "drilldown", "/insights"),
        "methodology", ""
    ));
    cc.put("overview", ov);
    cc.put("violation_count", summary.get("total_violations"));
    cc.put("anomaly_count", ((Map<?, ?>) intel.get("summary")).get("high_risk_count"));
    cc.put("fragmented_vendor_spend", 0);
    cc.put("projected_burn", ov.get("monthly_avg"));
    cc.put("debit_vs_credit", List.of());
    cc.put("budget_disclaimer", null);
    return cc;
  }

  public Map<String, Object> generateCfoSummary() {
    var ov = analytics.overview();
    String summary = String.format(
        "Total spend $%,.0f across %,d transactions.",
        ((Number) ov.get("total_spend")).doubleValue(),
        ((Number) ov.get("transaction_count")).intValue()
    );
    return Map.of("summary", summary, "ai_generated", false);
  }
}
