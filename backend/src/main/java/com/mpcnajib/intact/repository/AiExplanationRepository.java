package com.mpcnajib.intact.repository;

import com.mpcnajib.intact.model.AiExplanationDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AiExplanationRepository extends MongoRepository<AiExplanationDocument, String> {}
