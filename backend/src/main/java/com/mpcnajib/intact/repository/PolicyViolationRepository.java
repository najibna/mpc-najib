package com.mpcnajib.intact.repository;

import com.mpcnajib.intact.model.PolicyViolationDocument;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PolicyViolationRepository extends MongoRepository<PolicyViolationDocument, String> {
  Optional<PolicyViolationDocument> findByViolationId(String violationId);
}
