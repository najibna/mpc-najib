package com.mpcnajib.intact.service;

import com.mpcnajib.intact.domain.Transaction;
import com.mpcnajib.intact.store.SessionStore;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class ReportsService {
  private final DatasetService datasets;
  private final SessionStore store;

  public ReportsService(DatasetService datasets, SessionStore store) {
    this.datasets = datasets;
    this.store = store;
  }

  public List<Map<String, Object>> list() {
    if (store.reports.isEmpty()) buildFromDataset();
    return store.reports.values().stream()
        .map(this::summary)
        .toList();
  }

  public Map<String, Object> get(String id, boolean withSummary) {
    if (store.reports.isEmpty()) buildFromDataset();
    var rep = store.reports.get(id);
    if (rep == null) return null;
    if (withSummary && !rep.containsKey("ai_summary")) {
      rep.put("ai_summary", "Auto-grouped expense report for " + rep.get("title"));
    }
    return rep;
  }

  public Map<String, Object> decide(String id, String decision, String approver, String note) {
    var rep = store.reports.get(id);
    if (rep == null) return null;
    rep.put("status", "approve".equals(decision) ? "approved" : "denied");
    rep.put("decided_by", approver);
    rep.put("decided_at", store.nowIso());
    store.logAudit("report." + decision, approver, id, Map.of("note", note));
    return rep;
  }

  private void buildFromDataset() {
    var grouped = datasets.require().transactions.stream()
        .collect(Collectors.groupingBy(t -> t.transactionCode));
    for (var e : grouped.entrySet()) {
      var txns = e.getValue();
      if (txns.isEmpty()) continue;
      var first = txns.getFirst();
      var id = "rpt_" + e.getKey().replaceAll("\\W", "");
      var rep = new LinkedHashMap<String, Object>();
      rep.put("report_id", id);
      rep.put("employee_id", first.employeeId);
      rep.put("employee_name", first.employeeName);
      rep.put("cardholder_label", first.cardholderLabel);
      rep.put("transaction_code", first.transactionCode);
      rep.put("department", first.department);
      rep.put("title", "Spend report · " + first.cardholderLabel);
      rep.put("grouping_type", "card");
      rep.put("transaction_count", txns.size());
      rep.put("total", txns.stream().mapToDouble(t -> t.amount).sum());
      rep.put("status", "pending");
      rep.put("transactions", txns.stream().map(Transaction::toMap).toList());
      store.reports.put(id, rep);
    }
  }

  private Map<String, Object> summary(Map<String, Object> full) {
    var s = new LinkedHashMap<>(full);
    s.remove("transactions");
    return s;
  }
}
