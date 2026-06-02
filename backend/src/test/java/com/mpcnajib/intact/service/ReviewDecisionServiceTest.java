package com.mpcnajib.intact.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mpcnajib.intact.model.PolicyViolationDocument;
import com.mpcnajib.intact.repository.PolicyViolationRepository;
import com.mpcnajib.intact.repository.ReviewDecisionRepository;
import com.mpcnajib.intact.store.SessionStore;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;

class ReviewDecisionServiceTest {
  @Test
  void approvePersistsDecision() {
    var decisions = mock(ReviewDecisionRepository.class);
    var violations = mock(PolicyViolationRepository.class);
    @SuppressWarnings("unchecked")
    ObjectProvider<com.mpcnajib.intact.messaging.EventPublisher> events = mock(ObjectProvider.class);

    var store = new SessionStore();
    var violation = new PolicyViolationDocument();
    violation.setViolationId("v_tx_1");
    violation.setTransactionId("tx_1");
    when(violations.findByViolationId("v_tx_1")).thenReturn(Optional.of(violation));

    var service = new ReviewDecisionService(decisions, violations, store, events);
    var result = service.approve("v_tx_1", "Manager", "Looks valid");

    assertEquals("approved", result.get("decision"));
    verify(decisions).save(any());
    verify(violations).save(any());
  }
}
