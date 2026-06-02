package com.mpcnajib.intact.service;

import com.mpcnajib.intact.domain.DatasetSnapshot;
import com.mpcnajib.intact.domain.Transaction;
import com.mpcnajib.intact.util.MapsUtil;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class AnalyticsService {
  private final DatasetService datasets;

  public AnalyticsService(DatasetService datasets) {
    this.datasets = datasets;
  }

  public Map<String, Object> overview() {
    var ds = datasets.require();
    var txns = ds.transactions;
    double total = txns.stream().mapToDouble(t -> t.amount).sum();
    long months = txns.stream().map(t -> t.month).filter(m -> m != null && !m.isBlank()).distinct().count();
    if (months < 1) months = 1;

    var byMonth = sumKey(txns, t -> t.month);
    var byMerchant = sumKey(txns, t -> t.merchantName);
    var topMerchants = byMerchant.entrySet().stream()
        .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
        .limit(8)
        .map(e -> MapsUtil.chartPair(truncate(e.getKey(), 28), e.getValue()))
        .toList();

    String groupLabel = ds.hasDepartments() ? "department" : "card_code";
    var byGroup = ds.hasDepartments()
        ? sumKey(txns, t -> t.department)
        : sumKey(txns, t -> t.transactionCode);

    var out = new LinkedHashMap<String, Object>();
    out.put("total_spend", MapsUtil.round(total));
    out.put("transaction_count", txns.size());
    out.put("employee_count", ds.employeeCount());
    out.put("merchant_count", txns.stream().map(t -> t.merchantName).distinct().count());
    out.put("department_count", ds.hasDepartments() ? ds.departments().size() : ds.employeeCount());
    out.put("avg_transaction", MapsUtil.round(total / Math.max(1, txns.size())));
    out.put("monthly_avg", MapsUtil.round(total / months));
    out.put("date_range", ds.dateRange());
    out.put("grouping", groupLabel);
    out.put("by_department", MapsUtil.topPairs(byGroup, 8, k -> ds.hasDepartments() ? k : "Code " + k));
    out.put("by_category", MapsUtil.topPairs(sumKey(txns, t -> t.mcc), 6, k -> k));
    out.put("by_country", MapsUtil.topPairs(sumKey(txns, t -> t.merchantCountry), 6, k -> k));
    out.put("by_state", MapsUtil.topPairs(sumKey(txns, t -> t.merchantState), 6, k -> k));
    out.put(
        "by_transaction_category",
        sumKey(txns, t -> t.transactionCategory).entrySet().stream()
            .map(e -> MapsUtil.chartPair(String.valueOf(e.getKey()), e.getValue()))
            .toList()
    );
    out.put(
        "by_month",
        byMonth.entrySet().stream().sorted(Map.Entry.comparingByKey())
            .map(e -> MapsUtil.chartPair(e.getKey(), e.getValue()))
            .toList()
    );
    out.put("top_merchants", topMerchants);
    return out;
  }

  public List<Map<String, Object>> budgetStatus() {
    var ds = datasets.require();
    var months = ds.transactions.stream().map(t -> t.month).filter(m -> !m.isBlank()).distinct().sorted().toList();
    String latest = months.isEmpty() ? "" : months.getLast();

    List<String> labels = ds.hasDepartments()
        ? ds.departments()
        : ds.transactions.stream().map(t -> t.transactionCode).distinct().sorted().toList();

    var out = new ArrayList<Map<String, Object>>();
    for (String label : labels) {
      var grp = ds.hasDepartments()
          ? ds.transactions.stream().filter(t -> label.equals(t.department)).toList()
          : ds.transactions.stream().filter(t -> label.equals(t.transactionCode)).toList();
      double latestSpend = latest.isBlank() ? 0
          : grp.stream().filter(t -> latest.equals(t.month)).mapToDouble(t -> t.amount).sum();
      var monthly = grp.stream()
          .collect(Collectors.groupingBy(t -> t.month, Collectors.summingDouble(t -> t.amount)));
      var recent = monthly.entrySet().stream().sorted(Map.Entry.comparingByKey())
          .map(Map.Entry::getValue).toList();
      double runRate = recent.isEmpty() ? 0
          : recent.subList(Math.max(0, recent.size() - 3), recent.size()).stream()
              .mapToDouble(Double::doubleValue).average().orElse(0);

      var row = new LinkedHashMap<String, Object>();
      row.put("department", ds.hasDepartments() ? label : "Code " + label);
      row.put("monthly_budget", 0);
      row.put("latest_month", latest);
      row.put("latest_spend", MapsUtil.round(latestSpend));
      row.put("utilization_pct", 0);
      row.put("run_rate", MapsUtil.round(runRate));
      row.put("projected_overrun", 0);
      row.put("total_spend", MapsUtil.round(grp.stream().mapToDouble(t -> t.amount).sum()));
      row.put("status", "");
      row.put("has_budget", false);
      out.add(row);
    }
    out.sort(Comparator.comparingDouble((Map<String, Object> m) -> (Double) m.get("run_rate")).reversed());
    return out;
  }

  public List<Map<String, Object>> vendorConsolidation() {
    var ds = datasets.require();
    var byMerchant = sumKey(ds.transactions, t -> t.merchantName);
    double total = byMerchant.values().stream().mapToDouble(Double::doubleValue).sum();
    var sorted = byMerchant.entrySet().stream()
        .sorted(Map.Entry.<String, Double>comparingByValue().reversed()).toList();
    if (sorted.isEmpty()) return List.of();
    double topSpend = sorted.getFirst().getValue();
    var out = new ArrayList<Map<String, Object>>();
    for (var e : sorted.stream().limit(15).toList()) {
      var row = new LinkedHashMap<String, Object>();
      row.put("merchant_name", truncate(e.getKey(), 40));
      row.put("total_spend", MapsUtil.round(e.getValue()));
      row.put("transaction_count", ds.transactions.stream().filter(t -> e.getKey().equals(t.merchantName)).count());
      row.put("share_pct", total > 0 ? MapsUtil.round(e.getValue() / total * 100) : 0);
      row.put("non_top_spend", MapsUtil.round(total - topSpend));
      out.add(row);
    }
    return out;
  }

  public Map<String, Object> employeeProfile(String employeeId) {
    var ds = datasets.require();
    var emp = ds.transactions.stream()
        .filter(t -> employeeId.equals(t.employeeId) || employeeId.equals(t.transactionCode))
        .toList();
    if (emp.isEmpty()) return null;
    var first = emp.getFirst();
    double total = emp.stream().mapToDouble(t -> t.amount).sum();
    var byMerchant = sumKey(emp, t -> t.merchantName);
    var profile = new LinkedHashMap<String, Object>();
    profile.put("employee_id", first.employeeId);
    profile.put("employee_name", first.employeeName);
    profile.put("cardholder_label", first.cardholderLabel);
    profile.put("transaction_code", first.transactionCode);
    profile.put("department", first.department);
    profile.put("role", first.role);
    profile.put("total_spend", MapsUtil.round(total));
    profile.put("transaction_count", emp.size());
    profile.put("avg_transaction", MapsUtil.round(total / emp.size()));
    profile.put(
        "top_merchants",
        byMerchant.entrySet().stream()
            .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
            .limit(8)
            .map(e -> MapsUtil.chartPair(truncate(e.getKey(), 28), e.getValue()))
            .toList()
    );
    profile.put("recent_transactions", emp.stream().sorted(Comparator.comparing((Transaction t) -> t.date).reversed())
        .limit(20).map(Transaction::toMap).toList());
    return profile;
  }

  private static Map<String, Double> sumKey(List<Transaction> txns, java.util.function.Function<Transaction, String> key) {
    var map = new LinkedHashMap<String, Double>();
    for (var t : txns) {
      String k = key.apply(t);
      if (k == null || k.isBlank()) continue;
      map.merge(k, t.amount, Double::sum);
    }
    return map;
  }

  private static String truncate(String s, int max) {
    if (s == null) return "";
    return s.length() <= max ? s : s.substring(0, max - 1) + "…";
  }
}
