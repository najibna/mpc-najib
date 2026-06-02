package com.mpcnajib.intact.config;

import com.mpcnajib.intact.messaging.EventTypes;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "app.messaging-enabled", havingValue = "true", matchIfMissing = true)
public class RabbitMqConfig {

  @Bean
  TopicExchange intactExchange() {
    return new TopicExchange(EventTypes.EXCHANGE);
  }

  @Bean
  Queue policyCheckQueue() {
    return new Queue(EventTypes.QUEUE_POLICY_CHECK, true);
  }

  @Bean
  Binding policyCheckBinding(Queue policyCheckQueue, TopicExchange intactExchange) {
    return BindingBuilder.bind(policyCheckQueue)
        .to(intactExchange)
        .with(EventTypes.ROUTING_TRANSACTIONS_UPLOADED);
  }

  @Bean
  MessageConverter jsonMessageConverter() {
    return new Jackson2JsonMessageConverter();
  }
}
