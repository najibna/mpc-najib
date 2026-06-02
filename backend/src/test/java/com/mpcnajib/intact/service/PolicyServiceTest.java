package com.mpcnajib.intact.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.mpcnajib.intact.domain.Transaction;
import com.mpcnajib.intact.store.SessionStore;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;

class PolicyServiceTest {
  private SessionStore store;
  private DatasetService datasets;
  private PolicyService policy;

  private static ObjectProvider<TransactionPersistenceService> noPersistence() {
    return new ObjectProvider<>() {
      @Override public TransactionPersistenceService getObject() { return null; }
      @Override public TransactionPersistenceService getObject(Object... args) { return null; }
      @Override public TransactionPersistenceService getIfAvailable() { return null; }
      @Override public TransactionPersistenceService getIfUnique() { return null; }
    };
  }

  @BeforeEach
  void setUp() {
    store = new SessionStore();
    datasets = new DatasetService(new ExcelLoaderService(), store, noPersistence());
    policy = new PolicyService(datasets, store, new RiskService(), new DataAvailabilityService(datasets));
  }

  @Test
  void flagsMissingReceiptWhenAmountOverThreshold() {
    datasets.loadTestSnapshot(List.of(baseTxn("tx_1", 120.0, false, true)));

    @SuppressWarnings("unchecked")
    var violations = (List<Map<String, Object>>) policy.scan().get("violations");

    assertEquals(1, violations.size());
    assertTrue(violations.getFirst().get("reasons").toString().toLowerCase().contains("receipt"));
  }

  @Test
  void flagsPersonalExpenseKeywords() {
    var txn = baseTxn("tx_2", 40.0, true, true);
    txn.merchantName = "Netflix subscription";
    txn.businessPurpose = "personal streaming";
    datasets.loadTestSnapshot(List.of(txn));

    @SuppressWarnings("unchecked")
    var violations = (List<Map<String, Object>>) policy.scan().get("violations");

    assertEquals(1, violations.size());
    assertEquals("high", violations.getFirst().get("severity"));
  }

  private static Transaction baseTxn(String id, double amount, boolean receipt, boolean approval) {
    var t = new Transaction();
    t.transactionId = id;
    t.employeeId = "3001";
    t.employeeName = "Test User";
    t.cardholderLabel = "Card #3001";
    t.merchantName = "Office Supply Co";
    t.category = "supplies";
    t.date = "2025-01-15";
    t.amount = amount;
    t.hasReceipt = receipt;
    t.hasApproval = approval;
    t.businessPurpose = "Team supplies";
    t.merchantCountry = "CA";
    return t;
  }
}
