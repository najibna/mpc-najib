package com.mpcnajib.intact.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class RiskService {
  private static final Set<String> HIGH_RULES = Set.of(
      "PERSONAL_EXPENSE", "SPLIT_EVASION", "TICKET_FINE", "ALCOHOL", "OVER_CAP"
  );
  private static final Set<String> MED_RULES = Set.of(
      "MISSING_RECEIPT", "APPROVAL_REQUIRED", "MISSING_PURPOSE", "DUPLICATE",
      "SOLO_MEAL_HIGH", "EXCESSIVE_TIP", "OVER_THRESHOLD", "FOREIGN_FX"
  );

  public String level(int score) {
    if (score >= 75) return "Critical";
    if (score >= 50) return "High";
    if (score >= 25) return "Medium";
    return "Low";
  }

  public Map<String, Object> scoreTransaction(
      double amount,
      boolean hasReceipt,
      boolean hasPurpose,
      boolean hasApproval,
      List<String> ruleIds,
      double receiptThreshold,
      double approvalCap,
      boolean receiptDataAvailable,
      boolean approvalDataAvailable,
      boolean purposeDataAvailable
  ) {
    int s = 0;
    var factors = new ArrayList<String>();
    for (String rid : ruleIds) {
      if (HIGH_RULES.contains(rid)) {
        s += 22;
        factors.add(rid);
      } else if (MED_RULES.contains(rid)) {
        s += 12;
        factors.add(rid);
      } else {
        s += 6;
        factors.add(rid);
      }
    }
    if (approvalDataAvailable && amount > approvalCap && !hasApproval) {
      s += 15;
      factors.add("over_cap_no_approval");
    }
    if (receiptDataAvailable && amount > receiptThreshold && !hasReceipt) {
      s += 10;
      factors.add("missing_receipt");
    }
    if (purposeDataAvailable && !hasPurpose && amount > 100) {
      s += 8;
      factors.add("missing_purpose");
    }
    int score = Math.min(100, s);
    return Map.of("score", score, "level", level(score), "factors", factors);
  }
}
