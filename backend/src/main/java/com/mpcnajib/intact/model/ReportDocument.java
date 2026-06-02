package com.mpcnajib.intact.model;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "reports")
public class ReportDocument {
  @Id
  private String id;

  private String reportId;
  private String title;
  private String status;
  private int transactionCount;
  private double totalAmount;
  private Map<String, Object> summary = new LinkedHashMap<>();
  private Instant generatedAt = Instant.now();

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getReportId() { return reportId; }
  public void setReportId(String reportId) { this.reportId = reportId; }
  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public int getTransactionCount() { return transactionCount; }
  public void setTransactionCount(int transactionCount) { this.transactionCount = transactionCount; }
  public double getTotalAmount() { return totalAmount; }
  public void setTotalAmount(double totalAmount) { this.totalAmount = totalAmount; }
  public Map<String, Object> getSummary() { return summary; }
  public void setSummary(Map<String, Object> summary) { this.summary = summary; }
  public Instant getGeneratedAt() { return generatedAt; }
  public void setGeneratedAt(Instant generatedAt) { this.generatedAt = generatedAt; }
}
