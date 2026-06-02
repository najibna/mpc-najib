package com.mpcnajib.intact.service;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Component;

@Component
public class CacheCoordinator {
  private static final List<Runnable> INVALIDATORS = new CopyOnWriteArrayList<>();

  public static void register(Runnable invalidator) {
    INVALIDATORS.add(invalidator);
  }

  public static void invalidateAll() {
    for (Runnable r : INVALIDATORS) {
      try {
        r.run();
      } catch (Exception ignored) {
        // keep invalidating other caches
      }
    }
  }
}
