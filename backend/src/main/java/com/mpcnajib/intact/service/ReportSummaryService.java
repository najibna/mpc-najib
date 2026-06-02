package com.mpcnajib.intact.service;

import com.mpcnajib.intact.messaging.EventPublisher;
import com.mpcnajib.intact.model.ReportDocument;
import com.mpcnajib.intact.repository.PolicyViolationRepository;
import com.mpcnajib.intact.repository.ReportRepository;
import com.mpcnajib.intact.repository.TransactionRepository;
import com.mpcnajib.intact.util.MapsUtil;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

@Service
public class ReportSummaryService {
  private final ReportRepository reports;
  private final TransactionRepository transactions;
  private final PolicyViolationRepository violations;
  private final DatasetService datasets;
  private final ObjectProvider<EventPublisher> events;

  public ReportSummaryService(
      ReportRepository reports,
      TransactionRepository transactions,
      PolicyViolationRepository violations,
      DatasetService datasets,
      ObjectProvider<EventPublisher> events
  ) {
    this.reports = reports;
    this.transactions = transactions;
    this.violations = violations;
    this.datasets = datasets;
    this.events = events;
  }

  public Map<String, Object> getSummary() {
    return reports.findTopByOrderByGeneratedAtDesc()
        .map(this::toDto)
        .orElseGet(this::buildLiveSummary);
  }

  public ReportDocument generateAndPersist(String batchId) {
    long txnCount = transactions.count();
    long violationCount = violations.count();
    double total = transactions.findAll().stream().mapToDouble(t -> t.getAmount()).sum();
    var doc = new ReportDocument();
    doc.setReportId("rpt_" + UUID.randomUUID().toString().substring(0, 8));
    doc.setTitle("Expense summary report");
    doc.setStatus("generated");
    doc.setTransactionCount((int) txnCount);
    doc.setTotalAmount(MapsUtil.round(total));
    var summary = new LinkedHashMap<String, Object>();
    summary.put("batch_id", batchId);
    summary.put("violations", violationCount);
    summary.put("transactions", txnCount);
    summary.put("total_spend", MapsUtil.round(total));
    summary.put("high_risk_count", violations.findAll().stream()
        .filter(v -> "high".equals(v.getSeverity())).count());
    doc.setSummary(summary);
    reports.save(doc);
    events.ifAvailable(p -> p.reportGenerated(doc.getReportId(), (int) txnCount));
    return doc;
  }

  private Map<String, Object> buildLiveSummary() {
    var summary = new LinkedHashMap<String, Object>();
    if (datasets.isLoaded()) {
      var ds = datasets.require();
      summary.put("transactions", ds.transactions.size());
      summary.put("total_spend", MapsUtil.round(ds.transactions.stream().mapToDouble(t -> t.amount).sum()));
    } else {
      summary.put("transactions", 0);
      summary.put("total_spend", 0);
    }
    summary.put("violations", violations.count());
    summary.put("source", "live");
    return Map.of("report_id", "live", "title", "Live summary", "status", "ready", "summary", summary);
  }

  private Map<String, Object> toDto(ReportDocument doc) {
    return Map.of(
        "report_id", doc.getReportId(),
        "title", doc.getTitle(),
        "status", doc.getStatus(),
        "transaction_count", doc.getTransactionCount(),
        "total_amount", doc.getTotalAmount(),
        "summary", doc.getSummary(),
        "generated_at", doc.getGeneratedAt().toString()
    );
  }
}
