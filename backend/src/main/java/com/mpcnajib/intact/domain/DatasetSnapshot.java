package com.mpcnajib.intact.domain;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class DatasetSnapshot {
  public final List<Transaction> transactions;
  public final String source;
  public final Map<String, Object> enrichment;

  public DatasetSnapshot(List<Transaction> transactions, String source, Map<String, Object> enrichment) {
    this.transactions = List.copyOf(transactions);
    this.source = source;
    this.enrichment = enrichment == null ? Map.of() : Map.copyOf(enrichment);
  }

  public boolean hasDepartments() {
    return transactions.stream().anyMatch(t -> t.department != null && !t.department.isBlank());
  }

  public List<String> departments() {
    if (!hasDepartments()) {
      return transactions.stream().map(t -> t.transactionCode).distinct().sorted().toList();
    }
    return transactions.stream()
        .map(t -> t.department)
        .filter(d -> d != null && !d.isBlank())
        .distinct()
        .sorted()
        .toList();
  }

  public List<String> categories() {
    return transactions.stream().map(t -> t.category).filter(c -> c != null && !c.isBlank()).distinct().sorted().toList();
  }

  public Map<String, String> dateRange() {
    var dates = transactions.stream().map(t -> t.date).filter(d -> d != null && !d.isBlank()).sorted().toList();
    if (dates.isEmpty()) {
      return Map.of("start", "", "end", "");
    }
    return Map.of("start", dates.getFirst(), "end", dates.getLast());
  }

  public int employeeCount() {
    return (int) transactions.stream().map(t -> t.transactionCode).distinct().count();
  }
}
