package com.mpcnajib.intact.model;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "ai_explanations")
public class AiExplanationDocument {
  @Id
  private String id;

  @Indexed
  private String violationId;

  private String question;
  private String explanation;
  private String model;
  private Instant createdAt = Instant.now();

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getViolationId() { return violationId; }
  public void setViolationId(String violationId) { this.violationId = violationId; }
  public String getQuestion() { return question; }
  public void setQuestion(String question) { this.question = question; }
  public String getExplanation() { return explanation; }
  public void setExplanation(String explanation) { this.explanation = explanation; }
  public String getModel() { return model; }
  public void setModel(String model) { this.model = model; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
