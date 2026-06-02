package com.mpcnajib.intact.service;

import com.mpcnajib.intact.messaging.EventPublisher;
import com.mpcnajib.intact.model.PolicyViolationDocument;
import com.mpcnajib.intact.repository.PolicyViolationRepository;
import com.mpcnajib.intact.repository.TransactionRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

@Service
public class AsyncPolicyProcessor {
  private final PolicyService policyService;
  private final PolicyViolationRepository violations;
  private final TransactionRepository transactions;
  private final ReportSummaryService reportSummary;
  private final ObjectProvider<EventPublisher> events;

  public AsyncPolicyProcessor(
      PolicyService policyService,
      PolicyViolationRepository violations,
      TransactionRepository transactions,
      ReportSummaryService reportSummary,
      ObjectProvider<EventPublisher> events
  ) {
    this.policyService = policyService;
    this.violations = violations;
    this.transactions = transactions;
    this.reportSummary = reportSummary;
    this.events = events;
  }

  @SuppressWarnings("unchecked")
  public void processPolicyChecks(String batchId) {
    policyService.invalidate();
    var scan = policyService.scan();
    violations.deleteAll();
    var list = (List<Map<String, Object>>) scan.getOrDefault("violations", List.of());
    var docs = new ArrayList<PolicyViolationDocument>();
    for (var v : list) {
      var doc = new PolicyViolationDocument();
      doc.setViolationId(String.valueOf(v.get("violation_id")));
      doc.setTransactionId(String.valueOf(v.get("transaction_id")));
      doc.setEmployeeId(String.valueOf(v.get("employee_id")));
      doc.setMerchantName(String.valueOf(v.get("merchant_name")));
      doc.setAmount(((Number) v.get("amount")).doubleValue());
      doc.setSeverity(String.valueOf(v.get("severity")));
      doc.setRiskScore(((Number) v.get("risk_score")).intValue());
      doc.setRiskLevel(String.valueOf(v.get("risk_level")));
      doc.setWorkflowStatus(String.valueOf(v.get("workflow_status")));
      @SuppressWarnings("unchecked")
      var rules = (List<Map<String, Object>>) v.get("rules");
      doc.setRuleIds(rules.stream().map(r -> String.valueOf(r.get("rule_id"))).toList());
      @SuppressWarnings("unchecked")
      var reasons = (List<String>) v.get("reasons");
      doc.setReasons(reasons);
      doc.setRecommendedAction(String.valueOf(v.get("recommended_action")));
      docs.add(doc);
      String vid = doc.getViolationId();
      events.ifAvailable(p -> p.policyViolationDetected(vid, doc.getTransactionId(), doc.getSeverity()));
      transactions.findAll().stream()
          .filter(t -> t.getTransactionId().equals(doc.getTransactionId()))
          .findFirst()
          .ifPresent(t -> {
            t.setRiskScore(doc.getRiskScore());
            t.setRiskLevel(doc.getRiskLevel());
            transactions.save(t);
          });
    }
    violations.saveAll(docs);
    reportSummary.generateAndPersist(batchId);
  }
}
