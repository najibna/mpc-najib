package com.mpcnajib.intact.model;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "transactions")
public class TransactionDocument {
  @Id
  private String id;

  @Indexed(unique = true)
  private String transactionId;

  private String employeeId;
  private String employeeName;
  private String cardholderLabel;
  private String merchantName;
  private String category;
  private String date;
  private double amount;
  private boolean hasReceipt;
  private boolean hasApproval;
  private String businessPurpose;
  private String department;
  private int riskScore;
  private String riskLevel;
  private String uploadBatchId;
  private Instant createdAt = Instant.now();

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getTransactionId() { return transactionId; }
  public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
  public String getEmployeeId() { return employeeId; }
  public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
  public String getEmployeeName() { return employeeName; }
  public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
  public String getCardholderLabel() { return cardholderLabel; }
  public void setCardholderLabel(String cardholderLabel) { this.cardholderLabel = cardholderLabel; }
  public String getMerchantName() { return merchantName; }
  public void setMerchantName(String merchantName) { this.merchantName = merchantName; }
  public String getCategory() { return category; }
  public void setCategory(String category) { this.category = category; }
  public String getDate() { return date; }
  public void setDate(String date) { this.date = date; }
  public double getAmount() { return amount; }
  public void setAmount(double amount) { this.amount = amount; }
  public boolean isHasReceipt() { return hasReceipt; }
  public void setHasReceipt(boolean hasReceipt) { this.hasReceipt = hasReceipt; }
  public boolean isHasApproval() { return hasApproval; }
  public void setHasApproval(boolean hasApproval) { this.hasApproval = hasApproval; }
  public String getBusinessPurpose() { return businessPurpose; }
  public void setBusinessPurpose(String businessPurpose) { this.businessPurpose = businessPurpose; }
  public String getDepartment() { return department; }
  public void setDepartment(String department) { this.department = department; }
  public int getRiskScore() { return riskScore; }
  public void setRiskScore(int riskScore) { this.riskScore = riskScore; }
  public String getRiskLevel() { return riskLevel; }
  public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
  public String getUploadBatchId() { return uploadBatchId; }
  public void setUploadBatchId(String uploadBatchId) { this.uploadBatchId = uploadBatchId; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
