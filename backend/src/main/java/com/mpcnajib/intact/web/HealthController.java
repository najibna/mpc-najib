package com.mpcnajib.intact.web;

import com.mpcnajib.intact.service.DatasetService;
import com.mpcnajib.intact.service.LlmService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
  private final DatasetService datasets;
  private final LlmService llm;

  public HealthController(DatasetService datasets, LlmService llm) {
    this.datasets = datasets;
    this.llm = llm;
  }

  @GetMapping("/api/health")
  public Map<String, Object> health() {
    return Map.of(
        "status", "ok",
        "llm_enabled", llm.enabled(),
        "dataset_loaded", datasets.isLoaded()
    );
  }
}
