package com.mpcnajib.intact.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.mpcnajib.intact.service.DatasetService;
import com.mpcnajib.intact.service.TransactionQueryService;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class TransactionControllerTest {
  private MockMvc mockMvc;
  private StubQueryService queries;

  @BeforeEach
  void setUp() {
    queries = new StubQueryService();
    var datasets = new DatasetService(
        new com.mpcnajib.intact.service.ExcelLoaderService(),
        new com.mpcnajib.intact.store.SessionStore(),
        noPersistence()
    );
    mockMvc = MockMvcBuilders.standaloneSetup(new TransactionController(queries, datasets)).build();
  }

  @Test
  void listTransactions() throws Exception {
    queries.all = List.of(Map.of("transaction_id", "tx_1", "amount", 50.0));
    mockMvc.perform(get("/api/transactions"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.count").value(1));
  }

  @Test
  void listRiskyTransactions() throws Exception {
    queries.risky = List.of(Map.of("transaction_id", "tx_9", "risk_score", 80));
    mockMvc.perform(get("/api/transactions/risky"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.transactions[0].risk_score").value(80));
  }

  private static ObjectProvider<com.mpcnajib.intact.service.TransactionPersistenceService> noPersistence() {
    return new ObjectProvider<>() {
      @Override public com.mpcnajib.intact.service.TransactionPersistenceService getObject() { return null; }
      @Override public com.mpcnajib.intact.service.TransactionPersistenceService getObject(Object... args) { return null; }
      @Override public com.mpcnajib.intact.service.TransactionPersistenceService getIfAvailable() { return null; }
      @Override public com.mpcnajib.intact.service.TransactionPersistenceService getIfUnique() { return null; }
    };
  }

  static class StubQueryService extends TransactionQueryService {
    List<Map<String, Object>> all = List.of();
    List<Map<String, Object>> risky = List.of();

    StubQueryService() {
      super(null, null);
    }

    @Override
    public List<Map<String, Object>> listAll(int limit) {
      return all.stream().limit(limit).toList();
    }

    @Override
    public List<Map<String, Object>> listRisky(int limit) {
      return risky.stream().limit(limit).toList();
    }
  }
}
