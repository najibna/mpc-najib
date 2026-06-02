package com.mpcnajib.intact.messaging;

import com.mpcnajib.intact.service.AsyncPolicyProcessor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.messaging-enabled", havingValue = "true", matchIfMissing = true)
public class PolicyCheckListener {
  private final AsyncPolicyProcessor processor;

  public PolicyCheckListener(AsyncPolicyProcessor processor) {
    this.processor = processor;
  }

  @RabbitListener(queues = EventTypes.QUEUE_POLICY_CHECK)
  public void onTransactionsUploaded(AppEvent event) {
    String batchId = event.payload() == null ? null : String.valueOf(event.payload().get("batch_id"));
    processor.processPolicyChecks(batchId);
  }
}
