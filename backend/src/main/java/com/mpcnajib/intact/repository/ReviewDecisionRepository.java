package com.mpcnajib.intact.repository;

import com.mpcnajib.intact.model.ReviewDecisionDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ReviewDecisionRepository extends MongoRepository<ReviewDecisionDocument, String> {}
