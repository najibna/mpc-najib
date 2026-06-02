package com.mpcnajib.intact.repository;

import com.mpcnajib.intact.model.TransactionDocument;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface TransactionRepository extends MongoRepository<TransactionDocument, String> {
  List<TransactionDocument> findByRiskScoreGreaterThanEqualOrderByRiskScoreDesc(int minScore);
}
