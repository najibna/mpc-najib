package com.mpcnajib.intact.controller;

import com.mpcnajib.intact.config.AppProperties;
import com.mpcnajib.intact.service.DatasetService;
import com.mpcnajib.intact.service.LlmService;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
  private final DatasetService datasets;
  private final LlmService llm;
  private final AppProperties app;
  private final ObjectProvider<MongoTemplate> mongo;
  private final ObjectProvider<RabbitTemplate> rabbit;

  public HealthController(
      DatasetService datasets,
      LlmService llm,
      AppProperties app,
      ObjectProvider<MongoTemplate> mongo,
      ObjectProvider<RabbitTemplate> rabbit
  ) {
    this.datasets = datasets;
    this.llm = llm;
    this.app = app;
    this.mongo = mongo;
    this.rabbit = rabbit;
  }

  @GetMapping("/api/health")
  public Map<String, Object> health() {
    var body = new LinkedHashMap<String, Object>();
    body.put("status", "ok");
    body.put("llm_enabled", llm.enabled());
    body.put("dataset_loaded", datasets.isLoaded());
    body.put("mongodb", mongoStatus());
    body.put("rabbitmq", rabbitStatus());
    body.put("messaging_enabled", app.messagingEnabled());
    body.put("stack", "Java 21 · Spring Boot · Maven · MongoDB · RabbitMQ");
    return body;
  }

  private String mongoStatus() {
    var template = mongo.getIfAvailable();
    if (template == null) return "disabled";
    try {
      template.getDb().runCommand(new org.bson.Document("ping", 1));
      return "up";
    } catch (Exception ex) {
      return "down";
    }
  }

  private String rabbitStatus() {
    if (!app.messagingEnabled()) return "disabled";
    var template = rabbit.getIfAvailable();
    if (template == null) return "down";
    try {
      template.getConnectionFactory().createConnection().close();
      return "up";
    } catch (Exception ex) {
      return "down";
    }
  }
}
