package com.mpcnajib.intact.service;

import com.mpcnajib.intact.domain.Transaction;
import com.mpcnajib.intact.mapper.TransactionMapper;
import com.mpcnajib.intact.repository.TransactionRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class TransactionQueryService {
  private static final int RISKY_MIN_SCORE = 50;

  private final TransactionRepository transactions;
  private final DatasetService datasets;

  public TransactionQueryService(TransactionRepository transactions, DatasetService datasets) {
    this.transactions = transactions;
    this.datasets = datasets;
  }

  public List<Map<String, Object>> listAll(int limit) {
    if (transactions.count() > 0) {
      return transactions.findAll().stream()
          .limit(limit)
          .map(TransactionMapper::toDto)
          .toList();
    }
    if (!datasets.isLoaded()) return List.of();
    return datasets.require().transactions.stream()
        .limit(limit)
        .map(TransactionMapper::toDto)
        .toList();
  }

  public List<Map<String, Object>> listRisky(int limit) {
    if (transactions.count() > 0) {
      return transactions.findByRiskScoreGreaterThanEqualOrderByRiskScoreDesc(RISKY_MIN_SCORE).stream()
          .limit(limit)
          .map(TransactionMapper::toDto)
          .toList();
    }
    if (!datasets.isLoaded()) return List.of();
    var risky = new ArrayList<Map<String, Object>>();
    for (Transaction t : datasets.require().transactions) {
      var score = Map.of("score", 0);
      if (risky.size() >= limit) break;
      risky.add(TransactionMapper.toDto(t));
    }
    return risky;
  }
}
