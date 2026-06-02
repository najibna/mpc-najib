package com.mpcnajib.intact.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "policy_violations")
public class PolicyViolationDocument {
  @Id
  private String id;

  @Indexed(unique = true)
  private String violationId;

  @Indexed
  private String transactionId;

  private String employeeId;
  private String merchantName;
  private double amount;
  private String severity;
  private int riskScore;
  private String riskLevel;
  private List<String> ruleIds = new ArrayList<>();
  private List<String> reasons = new ArrayList<>();
  private String recommendedAction;
  private String workflowStatus = "open";
  private Instant detectedAt = Instant.now();

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getViolationId() { return violationId; }
  public void setViolationId(String violationId) { this.violationId = violationId; }
  public String getTransactionId() { return transactionId; }
  public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
  public String getEmployeeId() { return employeeId; }
  public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
  public String getMerchantName() { return merchantName; }
  public void setMerchantName(String merchantName) { this.merchantName = merchantName; }
  public double getAmount() { return amount; }
  public void setAmount(double amount) { this.amount = amount; }
  public String getSeverity() { return severity; }
  public void setSeverity(String severity) { this.severity = severity; }
  public int getRiskScore() { return riskScore; }
  public void setRiskScore(int riskScore) { this.riskScore = riskScore; }
  public String getRiskLevel() { return riskLevel; }
  public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
  public List<String> getRuleIds() { return ruleIds; }
  public void setRuleIds(List<String> ruleIds) { this.ruleIds = ruleIds; }
  public List<String> getReasons() { return reasons; }
  public void setReasons(List<String> reasons) { this.reasons = reasons; }
  public String getRecommendedAction() { return recommendedAction; }
  public void setRecommendedAction(String recommendedAction) { this.recommendedAction = recommendedAction; }
  public String getWorkflowStatus() { return workflowStatus; }
  public void setWorkflowStatus(String workflowStatus) { this.workflowStatus = workflowStatus; }
  public Instant getDetectedAt() { return detectedAt; }
  public void setDetectedAt(Instant detectedAt) { this.detectedAt = detectedAt; }
}
