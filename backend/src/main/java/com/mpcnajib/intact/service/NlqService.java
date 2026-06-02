package com.mpcnajib.intact.service;

import com.mpcnajib.intact.config.AppProperties;
import com.mpcnajib.intact.domain.Transaction;
import com.mpcnajib.intact.store.SessionStore;
import com.mpcnajib.intact.util.MapsUtil;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class NlqService {
  private final AnalyticsService analytics;
  private final ComplianceService compliance;
  private final PolicyService policy;
  private final DatasetService datasets;
  private final DataAvailabilityService availability;
  private final SessionStore store;
  private final LlmService llm;
  private final AppProperties props;

  public NlqService(
      AnalyticsService analytics,
      ComplianceService compliance,
      PolicyService policy,
      DatasetService datasets,
      DataAvailabilityService availability,
      SessionStore store,
      LlmService llm,
      AppProperties props
  ) {
    this.analytics = analytics;
    this.compliance = compliance;
    this.policy = policy;
    this.datasets = datasets;
    this.availability = availability;
    this.store = store;
    this.llm = llm;
    this.props = props;
  }

  public Map<String, Object> answer(String question, List<Map<String, Object>> history, Map<String, Object> priorPlan) {
    String q = question.toLowerCase(Locale.ROOT).trim();
    var special = specialIntent(question, q);
    if (special != null) {
      if (llm.enabled()) {
        String enhanced = enhanceAnswer(question, special);
        if (enhanced != null) {
          special.put("answer", enhanced);
          special.put("llm", true);
          special.put("ai_generated", true);
          special.put("reasoning", "Gemini answer grounded in uploaded Excel metrics and computed results.");
        }
      }
      return special;
    }
    var ov = analytics.overview();
    @SuppressWarnings("unchecked")
    var merchants = (List<Map<String, Object>>) ov.get("top_merchants");
    String topName = merchants.isEmpty() ? "N/A" : String.valueOf(merchants.getFirst().get("name"));
    double topVal = merchants.isEmpty() ? 0 : ((Number) merchants.getFirst().get("value")).doubleValue();
    var fallback = pack(
        "You asked \"%s\" — here are the top stores in your file. %s is highest at $%,.0f."
            .formatted(question, topName, topVal),
        "bar",
        merchants
    );
    fallback.put("plan", Map.of("intent", "fallback"));
    return fallback;
  }

  private Map<String, Object> specialIntent(String raw, String q) {
    if (isTopSpender(q)) return topSpender();
    if (isTopMerchants(q)) return topMerchants();
    if (isReceipt(q)) return receiptQuestion();
    if (q.contains("broken rule") || q.contains("violation") || q.contains("compliance")) {
      var scan = policy.scan();
      @SuppressWarnings("unchecked")
      var summary = (Map<String, Object>) scan.get("summary");
      return pack(
          "%d policy flags in this file ($%,.0f flagged)."
              .formatted(summary.get("total_violations"), summary.get("flagged_amount")),
          "bar",
          List.of(MapsUtil.chartPair("Violations", ((Number) summary.get("total_violations")).doubleValue()))
      );
    }
    return null;
  }

  private Map<String, Object> topSpender() {
    var ranked = compliance.employeeRiskList().stream()
        .sorted(Comparator.comparingDouble((Map<String, Object> e) -> ((Number) e.get("total_spend")).doubleValue())
            .reversed())
        .toList();
    if (ranked.isEmpty()) return pack("No card spend data found.", "kpi", List.of());
    var top = ranked.getFirst();
    var chart = ranked.stream().limit(8)
        .map(e -> MapsUtil.chartPair(String.valueOf(e.get("cardholder_label")).substring(0, Math.min(24, String.valueOf(e.get("cardholder_label")).length())),
            ((Number) e.get("total_spend")).doubleValue()))
        .toList();
    return pack(
        "%s spent the most at $%,.2f."
            .formatted(top.get("cardholder_label"), top.get("total_spend")),
        "bar",
        chart
    );
  }

  private Map<String, Object> topMerchants() {
    var ov = analytics.overview();
    @SuppressWarnings("unchecked")
    var merchants = (List<Map<String, Object>>) ov.get("top_merchants");
    if (merchants.isEmpty()) return pack("No merchants found.", "kpi", List.of());
    var top = merchants.getFirst();
    return pack(
        "The store that cost the most is %s at $%,.2f."
            .formatted(top.get("name"), top.get("value")),
        "bar",
        merchants
    );
  }

  private Map<String, Object> receiptQuestion() {
    double threshold = ((Number) store.policyConfig().get("receipt_threshold")).doubleValue();
    var avail = availability.get();
    boolean hasCol = Boolean.TRUE.equals(avail.get("has_receipt_column"));
    var missing = datasets.require().transactions.stream()
        .filter(t -> t.amount > threshold && (!hasCol || !t.hasReceipt))
        .sorted(Comparator.comparingDouble((Transaction t) -> t.amount).reversed())
        .toList();
    var rows = missing.stream().limit(8).map(t -> Map.<String, Object>of(
        "date", t.date,
        "employee_name", t.cardholderLabel,
        "department", t.department,
        "merchant_name", t.merchantName,
        "category", t.category,
        "amount", MapsUtil.round(t.amount)
    )).toList();
    double total = missing.stream().mapToDouble(t -> t.amount).sum();
    String answer = missing.isEmpty()
        ? "No charges over $%.0f are missing receipts.".formatted(threshold)
        : "%d charges over $%.0f have no receipt ($%,.2f total)."
            .formatted(missing.size(), threshold, total);
    var chart = rows.stream()
        .map(r -> MapsUtil.chartPair(String.valueOf(r.get("merchant_name")).substring(0, Math.min(28, String.valueOf(r.get("merchant_name")).length())),
            ((Number) r.get("amount")).doubleValue()))
        .toList();
    var result = pack(answer, chart.isEmpty() ? "kpi" : "bar", chart);
    result.put("supporting_rows", rows);
    result.put("row_count", missing.size());
    return result;
  }

  private Map<String, Object> pack(String answer, String chart, List<Map<String, Object>> data) {
    var m = new LinkedHashMap<String, Object>();
    m.put("answer", answer);
    m.put("chart", chart);
    m.put("data", data);
    m.put("plan", Map.of("intent", "special"));
    m.put("llm", false);
    m.put("ai_generated", false);
    m.put("confidence", "high");
    m.put("supporting_rows", List.of());
    m.put("follow_ups", List.of("Which stores cost the most?", "Who spent the most?"));
    m.put("needs_clarification", null);
    m.put("row_count", datasets.require().transactions.size());
    m.put("reasoning", "Computed from uploaded Excel rows via rules engine.");
    return m;
  }

  private String enhanceAnswer(String question, Map<String, Object> base) {
    var messages = List.of(
        Map.of("role", "system", "content",
            "You are a finance analyst. Rewrite the draft answer in plain English (2-4 sentences). "
                + "Use only facts from the draft. Do not invent numbers."),
        Map.of("role", "user", "content", "Question: " + question + "\nDraft: " + base.get("answer"))
    );
    return llm.chatFast(messages);
  }

  private static boolean isTopSpender(String q) {
    if (q.contains("store") || q.contains("merchant") || q.contains("vendor")) return false;
    return q.contains("who spent") || q.contains("spent the most") || q.contains("spend the most")
        || q.contains("top spender");
  }

  private static boolean isTopMerchants(String q) {
    boolean merchant = q.contains("store") || q.contains("merchant") || q.contains("vendor");
    boolean rank = q.contains("most") || q.contains("top") || q.contains("highest") || q.contains("cost");
    return merchant && rank;
  }

  private static boolean isReceipt(String q) {
    if (!q.contains("receipt")) return false;
    return q.contains("no receipt") || q.contains("missing") || q.contains("which") || q.contains("what");
  }
}
