package com.mpcnajib.intact.model;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "review_decisions")
public class ReviewDecisionDocument {
  @Id
  private String id;

  @Indexed
  private String violationId;

  private String transactionId;
  private String decision;
  private String decidedBy;
  private String note;
  private Instant decidedAt = Instant.now();

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getViolationId() { return violationId; }
  public void setViolationId(String violationId) { this.violationId = violationId; }
  public String getTransactionId() { return transactionId; }
  public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
  public String getDecision() { return decision; }
  public void setDecision(String decision) { this.decision = decision; }
  public String getDecidedBy() { return decidedBy; }
  public void setDecidedBy(String decidedBy) { this.decidedBy = decidedBy; }
  public String getNote() { return note; }
  public void setNote(String note) { this.note = note; }
  public Instant getDecidedAt() { return decidedAt; }
  public void setDecidedAt(Instant decidedAt) { this.decidedAt = decidedAt; }
}
