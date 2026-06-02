package com.mpcnajib.intact.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.mpcnajib.intact.repository.PolicyViolationRepository;
import com.mpcnajib.intact.repository.ReportRepository;
import com.mpcnajib.intact.repository.TransactionRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;

class ReportSummaryServiceTest {
  @Test
  void returnsLiveSummaryWhenNoStoredReport() {
    var reports = mock(ReportRepository.class);
    var transactions = mock(TransactionRepository.class);
    var violations = mock(PolicyViolationRepository.class);
    var datasets = mock(DatasetService.class);
    @SuppressWarnings("unchecked")
    ObjectProvider<com.mpcnajib.intact.messaging.EventPublisher> events = mock(ObjectProvider.class);

    when(reports.findTopByOrderByGeneratedAtDesc()).thenReturn(Optional.empty());
    when(datasets.isLoaded()).thenReturn(false);
    when(violations.count()).thenReturn(3L);

    var service = new ReportSummaryService(reports, transactions, violations, datasets, events);
    @SuppressWarnings("unchecked")
    var summary = (java.util.Map<String, Object>) service.getSummary().get("summary");

    assertEquals(3L, summary.get("violations"));
    assertEquals(0, summary.get("transactions"));
  }
}
