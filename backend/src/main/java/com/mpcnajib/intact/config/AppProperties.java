package com.mpcnajib.intact.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
    String openrouterApiKey,
    String openrouterModel,
    String openrouterBaseUrl,
    String frontendOrigins,
    String sampleDataPath,
    boolean messagingEnabled
) {
  public boolean llmEnabled() {
    return openrouterApiKey != null && !openrouterApiKey.isBlank();
  }
}
