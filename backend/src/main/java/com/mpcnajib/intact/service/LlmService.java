package com.mpcnajib.intact.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mpcnajib.intact.config.AppProperties;
import java.net.URI;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class LlmService {
  private final AppProperties props;
  private final RestTemplate http = new RestTemplate();
  private final ObjectMapper json = new ObjectMapper();

  public LlmService(AppProperties props) {
    this.props = props;
  }

  public boolean enabled() {
    return props.llmEnabled();
  }

  public String chat(List<Map<String, String>> messages, double temperature, int maxTokens) {
    if (!enabled()) return null;
    try {
      var headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);
      headers.setBearerAuth(props.openrouterApiKey());
      headers.set("HTTP-Referer", "https://mpc-najib.onrender.com");
      headers.set("X-Title", "Intact Receipt Manager");

      var body = Map.of(
          "model", props.openrouterModel(),
          "messages", messages,
          "temperature", temperature,
          "max_tokens", maxTokens
      );
      var resp = http.postForEntity(
          URI.create(props.openrouterBaseUrl()),
          new HttpEntity<>(body, headers),
          JsonNode.class
      );
      JsonNode content = resp.getBody().path("choices").path(0).path("message").path("content");
      if (content.isMissingNode() || content.asText().isBlank()) return null;
      return content.asText().trim();
    } catch (Exception e) {
      return null;
    }
  }

  public String chatFast(List<Map<String, String>> messages) {
    return chat(messages, 0.1, 400);
  }
}
