package com.mpcnajib.intact.repository;

import com.mpcnajib.intact.model.ReportDocument;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ReportRepository extends MongoRepository<ReportDocument, String> {
  Optional<ReportDocument> findTopByOrderByGeneratedAtDesc();
}
