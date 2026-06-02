package com.mpcnajib.intact.messaging;

import java.time.Instant;
import java.util.Map;

public record AppEvent(
    String type,
    Instant timestamp,
    Map<String, Object> payload
) {
  public static AppEvent of(String type, Map<String, Object> payload) {
    return new AppEvent(type, Instant.now(), payload);
  }
}
