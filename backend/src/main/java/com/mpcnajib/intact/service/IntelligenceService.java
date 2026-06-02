package com.mpcnajib.intact.service;

import com.mpcnajib.intact.domain.Transaction;
import com.mpcnajib.intact.util.MapsUtil;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class IntelligenceService {
  private static final Set<String> DOMESTIC = Set.of("USA", "US", "CAN", "CA", "NAN", "NONE", "—", "");

  private final DatasetService datasets;
  private Map<String, Object> cache;

  public IntelligenceService(DatasetService datasets) {
    this.datasets = datasets;
    CacheCoordinator.register(this::invalidate);
  }

  public void invalidate() {
    cache = null;
  }

  public Map<String, Object> analyze() {
    if (cache != null) return new LinkedHashMap<>(cache);
    var txns = datasets.require().transactions;
    var scored = new ArrayList<Map<String, Object>>();
    for (var t : txns) {
      int score = 0;
      var flags = new ArrayList<String>();
      if (t.amount >= 500) {
        score += 25;
        flags.add("large_amount");
      }
      if (t.amount == 50 || t.amount == 100 || t.amount == 500) {
        score += 15;
        flags.add("round_amount");
      }
      if (!isDomestic(t.merchantCountry)) {
        score += 20;
        flags.add("foreign");
      }
      if (!t.hasReceipt && t.amount > 50) {
        score += 12;
        flags.add("missing_receipt");
      }
      score = Math.min(100, score);
      if (score < 15) continue;
      var row = new LinkedHashMap<String, Object>();
      row.put("transaction_id", t.transactionId);
      row.put("date", t.date);
      row.put("amount", MapsUtil.round(t.amount));
      row.put("merchant_name", t.merchantName);
      row.put("mcc", t.mcc);
      row.put("category_label", t.category);
      row.put("country", t.merchantCountry);
      row.put("is_foreign", !isDomestic(t.merchantCountry));
      row.put("cardholder_label", t.cardholderLabel);
      row.put("transaction_code", t.transactionCode);
      row.put("risk_score", score);
      row.put("risk_level", score >= 50 ? "High" : "Medium");
      row.put("severity", score >= 75 ? "critical" : score >= 50 ? "high" : "medium");
      row.put("flags", flags);
      row.put("factors", flags);
      row.put("explanation", "Risk score " + score + " based on amount, location, and receipt signals.");
      row.put("why_it_matters", "High-risk charges should be reviewed before reimbursement.");
      row.put("recommended_action", "Open transaction details and verify receipt.");
      row.put("confidence", "high");
      scored.add(row);
    }
    scored.sort(Comparator.comparingInt((Map<String, Object> m) -> (Integer) m.get("risk_score")).reversed());
    var top = scored.stream().limit(25).toList();
    int highCount = (int) scored.stream().filter(m -> (Integer) m.get("risk_score") >= 50).count();
    var result = new LinkedHashMap<String, Object>();
    result.put("summary", Map.of(
        "transactions_scored", scored.size(),
        "high_risk_count", highCount,
        "foreign_high_risk_count", scored.stream().filter(m -> Boolean.TRUE.equals(m.get("is_foreign"))).count(),
        "avg_risk_score", scored.isEmpty() ? 0 : scored.stream().mapToInt(m -> (Integer) m.get("risk_score")).average().orElse(0),
        "flagged_amount", MapsUtil.round(scored.stream().mapToDouble(m -> ((Number) m.get("amount")).doubleValue()).sum())
    ));
    result.put("top_risky", top);
    result.put("foreign_high_risk", top.stream().filter(m -> Boolean.TRUE.equals(m.get("is_foreign"))).limit(10).toList());
    result.put("charts", Map.of(
        "by_merchant", List.of(),
        "by_category", List.of(),
        "by_month", List.of(),
        "by_country", List.of()
    ));
    cache = result;
    return new LinkedHashMap<>(result);
  }

  private static boolean isDomestic(String country) {
    if (country == null) return true;
    return DOMESTIC.contains(country.toUpperCase().trim());
  }
}
