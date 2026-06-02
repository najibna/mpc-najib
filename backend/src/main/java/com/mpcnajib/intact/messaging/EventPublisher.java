package com.mpcnajib.intact.messaging;

import java.util.Map;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.messaging-enabled", havingValue = "true", matchIfMissing = true)
public class EventPublisher {
  private final RabbitTemplate rabbit;

  public EventPublisher(RabbitTemplate rabbit) {
    this.rabbit = rabbit;
  }

  public void publish(String routingKey, AppEvent event) {
    rabbit.convertAndSend(EventTypes.EXCHANGE, routingKey, event);
  }

  public void transactionsUploaded(String batchId, int count) {
    publish(EventTypes.ROUTING_TRANSACTIONS_UPLOADED, AppEvent.of(
        EventTypes.ROUTING_TRANSACTIONS_UPLOADED,
        Map.of("batch_id", batchId, "transaction_count", count)
    ));
  }

  public void policyViolationDetected(String violationId, String transactionId, String severity) {
    publish(EventTypes.ROUTING_POLICY_VIOLATION, AppEvent.of(
        EventTypes.ROUTING_POLICY_VIOLATION,
        Map.of("violation_id", violationId, "transaction_id", transactionId, "severity", severity)
    ));
  }

  public void reviewApproved(String violationId, String decidedBy) {
    publish(EventTypes.ROUTING_REVIEW_APPROVED, AppEvent.of(
        EventTypes.ROUTING_REVIEW_APPROVED,
        Map.of("violation_id", violationId, "decided_by", decidedBy)
    ));
  }

  public void reviewDenied(String violationId, String decidedBy) {
    publish(EventTypes.ROUTING_REVIEW_DENIED, AppEvent.of(
        EventTypes.ROUTING_REVIEW_DENIED,
        Map.of("violation_id", violationId, "decided_by", decidedBy)
    ));
  }

  public void reportGenerated(String reportId, int transactionCount) {
    publish(EventTypes.ROUTING_REPORT_GENERATED, AppEvent.of(
        EventTypes.ROUTING_REPORT_GENERATED,
        Map.of("report_id", reportId, "transaction_count", transactionCount)
    ));
  }
}
