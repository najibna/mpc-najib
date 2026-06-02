package com.mpcnajib.intact.util;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public final class MapsUtil {
  private MapsUtil() {}

  public static double round(double v) {
    return Math.round(v * 100.0) / 100.0;
  }

  public static Map<String, Object> chartPair(String name, double value) {
    return Map.of("name", name, "value", round(value));
  }

  public static List<Map<String, Object>> topPairs(
      Map<String, Double> sums, int n, java.util.function.Function<String, String> labelFn
  ) {
    var items = sums.entrySet().stream()
        .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
        .toList();
    var out = new ArrayList<Map<String, Object>>();
    double other = 0;
    for (int i = 0; i < items.size(); i++) {
      var e = items.get(i);
      if (i < n) {
        out.add(chartPair(labelFn.apply(e.getKey()), e.getValue()));
      } else {
        other += e.getValue();
      }
    }
    if (other > 0) {
      out.add(chartPair("Other", other));
    }
    return out;
  }

  public static Map<String, Double> sumBy(List<?> items, java.util.function.Function<Object, String> keyFn, java.util.function.ToDoubleFunction<Object> valFn) {
    var map = new LinkedHashMap<String, Double>();
    for (var item : items) {
      var k = keyFn.apply(item);
      map.merge(k, valFn.applyAsDouble(item), Double::sum);
    }
    return map;
  }
}
