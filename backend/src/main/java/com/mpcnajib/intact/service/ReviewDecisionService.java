package com.mpcnajib.intact.service;

import com.mpcnajib.intact.messaging.EventPublisher;
import com.mpcnajib.intact.model.ReviewDecisionDocument;
import com.mpcnajib.intact.repository.PolicyViolationRepository;
import com.mpcnajib.intact.repository.ReviewDecisionRepository;
import com.mpcnajib.intact.store.SessionStore;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

@Service
public class ReviewDecisionService {
  private final ReviewDecisionRepository decisions;
  private final PolicyViolationRepository violations;
  private final SessionStore store;
  private final ObjectProvider<EventPublisher> events;

  public ReviewDecisionService(
      ReviewDecisionRepository decisions,
      PolicyViolationRepository violations,
      SessionStore store,
      ObjectProvider<EventPublisher> events
  ) {
    this.decisions = decisions;
    this.violations = violations;
    this.store = store;
    this.events = events;
  }

  public Map<String, Object> approve(String violationId, String decidedBy, String note) {
    return decide(violationId, "approved", decidedBy, note, true);
  }

  public Map<String, Object> deny(String violationId, String decidedBy, String note) {
    return decide(violationId, "denied", decidedBy, note, false);
  }

  private Map<String, Object> decide(
      String violationId, String decision, String decidedBy, String note, boolean approved
  ) {
    var violation = violations.findByViolationId(violationId).orElseThrow(
        () -> new IllegalArgumentException("Violation not found: " + violationId)
    );
    var doc = new ReviewDecisionDocument();
    doc.setViolationId(violationId);
    doc.setTransactionId(violation.getTransactionId());
    doc.setDecision(decision);
    doc.setDecidedBy(decidedBy == null || decidedBy.isBlank() ? "Reviewer" : decidedBy);
    doc.setNote(note);
    decisions.save(doc);

    violation.setWorkflowStatus(decision);
    violations.save(violation);

    var state = new LinkedHashMap<String, Object>();
    state.put("status", decision);
    state.put("decided_by", doc.getDecidedBy());
    state.put("note", note);
    store.violationStatus.put(violationId, state);
    store.logAudit(approved ? "review.approved" : "review.denied", doc.getDecidedBy(), violationId, state);

    if (approved) {
      events.ifAvailable(p -> p.reviewApproved(violationId, doc.getDecidedBy()));
    } else {
      events.ifAvailable(p -> p.reviewDenied(violationId, doc.getDecidedBy()));
    }

    return Map.of(
        "ok", true,
        "violation_id", violationId,
        "decision", decision,
        "decided_by", doc.getDecidedBy()
    );
  }
}
