package com.mpcnajib.intact.service;

import com.mpcnajib.intact.domain.Transaction;
import com.mpcnajib.intact.mapper.TransactionMapper;
import com.mpcnajib.intact.messaging.EventPublisher;
import com.mpcnajib.intact.model.TransactionDocument;
import com.mpcnajib.intact.repository.TransactionRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import com.mpcnajib.intact.config.AppProperties;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

@Service
public class TransactionPersistenceService {
  private final TransactionRepository transactions;
  private final RiskService risk;
  private final AppProperties app;
  private final ObjectProvider<EventPublisher> events;
  private final ObjectProvider<AsyncPolicyProcessor> asyncProcessor;

  public TransactionPersistenceService(
      TransactionRepository transactions,
      RiskService risk,
      AppProperties app,
      ObjectProvider<EventPublisher> events,
      ObjectProvider<AsyncPolicyProcessor> asyncProcessor
  ) {
    this.transactions = transactions;
    this.risk = risk;
    this.app = app;
    this.events = events;
    this.asyncProcessor = asyncProcessor;
  }

  public String replaceAll(List<Transaction> txns) {
    transactions.deleteAll();
    String batchId = UUID.randomUUID().toString();
    var docs = new ArrayList<TransactionDocument>();
    for (var t : txns) {
      var score = risk.scoreTransaction(
          t.amount, t.hasReceipt, !t.businessPurpose.isBlank(), t.hasApproval,
          List.of(), 50, 50, true, true, true
      );
      int riskScore = ((Number) score.get("score")).intValue();
      String riskLevel = String.valueOf(score.get("level"));
      docs.add(TransactionMapper.toDocument(t, batchId, riskScore, riskLevel));
    }
    transactions.saveAll(docs);
    if (app.messagingEnabled()) {
      events.ifAvailable(publisher -> publisher.transactionsUploaded(batchId, txns.size()));
    } else {
      asyncProcessor.ifAvailable(p -> p.processPolicyChecks(batchId));
    }
    return batchId;
  }
}
