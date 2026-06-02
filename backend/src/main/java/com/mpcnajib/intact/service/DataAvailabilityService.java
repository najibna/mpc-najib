package com.mpcnajib.intact.service;

import com.mpcnajib.intact.domain.DatasetSnapshot;
import com.mpcnajib.intact.domain.Transaction;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class DataAvailabilityService {
  private final DatasetService datasets;

  public DataAvailabilityService(DatasetService datasets) {
    this.datasets = datasets;
  }

  public Map<String, Object> get() {
    if (!datasets.isLoaded()) {
      return base(false);
    }
    var ds = datasets.require();
    var e = ds.enrichment;
    boolean hasReceipt = bool(e, "has_receipt_column");
    boolean hasApproval = bool(e, "has_approval_column");
    boolean hasPurpose = bool(e, "has_business_purpose_column");
    boolean hasNames = bool(e, "has_employee_names") || ds.transactions.stream().anyMatch(t -> !blank(t.employeeName));
    boolean hasDept = ds.hasDepartments();
    var missing = new ArrayList<String>();
    if (!hasReceipt) missing.add("receipt status");
    if (!hasApproval) missing.add("approval status");
    if (!hasPurpose) missing.add("business purpose");
    if (!hasNames) missing.add("employee names");
    if (!hasDept) missing.add("departments");

    var m = base(true);
    m.put("has_employee_names", hasNames);
    m.put("has_departments", hasDept);
    m.put("has_receipt_column", hasReceipt);
    m.put("has_approval_column", hasApproval);
    m.put("has_business_purpose_column", hasPurpose);
    m.put("has_meal_context", false);
    m.put("has_tip_column", false);
    m.put("identity_label", hasNames ? "employee" : "card");
    m.put("group_label", hasDept ? "department" : "card code");
    m.put("missing_fields", missing);
    m.put(
        "data_honesty_note",
        missing.isEmpty()
            ? "All key SMB fields are present in your upload."
            : "Some fields are not in your file: " + String.join(", ", missing) + "."
    );
    m.put("provided_columns", e.getOrDefault("provided_columns", List.of()));
    m.put("features_enabled", List.of("spend_overview", "policy_scan", "ask_ai", "anomaly_scan"));
    m.put("features_unavailable", missing.isEmpty() ? List.of() : List.of("receipt_matching"));
    m.put(
        "department_analysis_note",
        hasDept ? "Department breakdown is available." : "Grouping by company card (transaction code)."
    );
    return m;
  }

  private static Map<String, Object> base(boolean loaded) {
    var m = new LinkedHashMap<String, Object>();
    m.put("has_employee_names", false);
    m.put("has_departments", false);
    m.put("has_receipt_column", false);
    m.put("has_approval_column", false);
    m.put("has_business_purpose_column", false);
    m.put("has_meal_context", false);
    m.put("has_tip_column", false);
    m.put("identity_label", "card");
    m.put("group_label", "card code");
    m.put("missing_fields", loaded ? List.of() : List.of("dataset"));
    m.put("data_honesty_note", loaded ? "" : "Upload Excel to begin.");
    m.put("provided_columns", List.of());
    m.put("features_enabled", List.of());
    m.put("features_unavailable", List.of());
    m.put("department_analysis_note", "");
    return m;
  }

  private static boolean bool(Map<String, Object> e, String key) {
    Object v = e.get(key);
    return v instanceof Boolean b && b;
  }

  private static boolean blank(String s) {
    return s == null || s.isBlank();
  }
}
