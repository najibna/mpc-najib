package com.mpcnajib.intact.service;

import com.mpcnajib.intact.domain.DatasetSnapshot;
import com.mpcnajib.intact.domain.Transaction;
import com.mpcnajib.intact.store.SessionStore;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

@Service
public class DatasetService {
  private final ExcelLoaderService excelLoader;
  private final SessionStore store;
  private volatile DatasetSnapshot dataset;

  public DatasetService(ExcelLoaderService excelLoader, SessionStore store) {
    this.excelLoader = excelLoader;
    this.store = store;
  }

  public boolean isLoaded() {
    return dataset != null;
  }

  public DatasetSnapshot require() {
    if (dataset == null) {
      throw new DatasetNotLoadedException("No Excel file loaded. Upload a file via POST /api/smb/import to begin.");
    }
    return dataset;
  }

  public DatasetSnapshot getOrNull() {
    return dataset;
  }

  public void loadFromBytes(byte[] content, String filename) throws IOException {
    var loaded = excelLoader.loadFromBytes(content);
    setDataset(loaded.transactions(), loaded.enrichment(), "upload", filename);
  }

  public void loadDemo(Resource resource) throws IOException {
    try (InputStream in = resource.getInputStream()) {
      var loaded = excelLoader.loadFromStream(in);
      setDataset(loaded.transactions(), loaded.enrichment(), "demo", resource.getFilename());
    }
  }

  private void setDataset(
      List<Transaction> txns, Map<String, Object> enrichment, String source, String filename
  ) {
    normalize(txns);
    this.dataset = new DatasetSnapshot(txns, source, enrichment);
    var meta = new java.util.LinkedHashMap<String, Object>();
    meta.put("ok", true);
    meta.put("filename", filename == null ? "upload.xlsx" : filename);
    meta.put("rows_imported", txns.size());
    meta.put("invalid_rows", 0);
    meta.put("duplicate_rows", 0);
    meta.put("date_range", dateRangeMap(txns));
    meta.put("departments", List.of());
    meta.put("employees", (int) txns.stream().map(t -> t.transactionCode).distinct().count());
    meta.put("merchants", (int) txns.stream().map(t -> t.merchantName).distinct().count());
    meta.put("categories", dataset.categories());
    meta.put("total_spend", com.mpcnajib.intact.util.MapsUtil.round(txns.stream().mapToDouble(t -> t.amount).sum()));
    meta.put("errors", List.of());
    meta.put("enrichment", enrichment);
    meta.put("spend_source", "excel_raw");
    meta.put("derived_fields", enrichment.getOrDefault("derived_columns", List.of()));
    meta.put("provided_fields", enrichment.getOrDefault("provided_columns", List.of()));
    store.importMeta = meta;
    store.logAudit("data.imported", "Finance Admin", filename, Map.of("rows", txns.size()));
    CacheCoordinator.invalidateAll();
  }

  private static Map<String, String> dateRangeMap(List<Transaction> txns) {
    var ds = new DatasetSnapshot(txns, "upload", Map.of());
    return ds.dateRange();
  }

  private void normalize(List<Transaction> txns) {
    for (var t : txns) {
      if (t.month == null || t.month.isBlank()) {
        t.month = t.date != null && t.date.length() >= 7 ? t.date.substring(0, 7) : "";
      }
      if (t.cardholderLabel == null || t.cardholderLabel.isBlank()) {
        t.cardholderLabel = ExcelLoaderService.cardholderLabel(t.employeeName, t.transactionCode, t.employeeId);
      }
    }
  }

  public static class DatasetNotLoadedException extends RuntimeException {
    public DatasetNotLoadedException(String message) {
      super(message);
    }
  }
}
