package com.mpcnajib.intact.service;

import com.mpcnajib.intact.config.AppProperties;
import com.mpcnajib.intact.store.SessionStore;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class HomeService {
  private final DatasetService datasets;
  private final AnalyticsService analytics;
  private final ComplianceService compliance;
  private final PolicyService policy;
  private final DemoInsightsService demoInsights;
  private final DataAvailabilityService availability;
  private final AppProperties props;
  private final LlmService llm;
  private final SessionStore store;
  private Map<String, Object> homeCache;

  public HomeService(
      DatasetService datasets,
      AnalyticsService analytics,
      ComplianceService compliance,
      PolicyService policy,
      DemoInsightsService demoInsights,
      DataAvailabilityService availability,
      AppProperties props,
      LlmService llm,
      SessionStore store
  ) {
    this.datasets = datasets;
    this.analytics = analytics;
    this.compliance = compliance;
    this.policy = policy;
    this.demoInsights = demoInsights;
    this.availability = availability;
    this.props = props;
    this.llm = llm;
    this.store = store;
    CacheCoordinator.register(this::invalidate);
  }

  public void invalidate() {
    homeCache = null;
  }

  public Map<String, Object> buildMeta() {
    if (!datasets.isLoaded()) {
      return Map.of(
          "loaded", false,
          "data_source", null,
          "data_source_label", "Loading demo data…",
          "llm_enabled", llm.enabled(),
          "llm_model", props.openrouterModel(),
          "transparency_note", "Demo dataset loads automatically on startup."
      );
    }
    var ds = datasets.require();
    var avail = availability.get();
    var m = new LinkedHashMap<String, Object>();
    m.put("loaded", true);
    m.put("departments", ds.departments());
    m.put("categories", ds.categories());
    m.put("date_range", ds.dateRange());
    m.put("employee_count", ds.employeeCount());
    m.put("card_code_count", ds.employeeCount());
    m.put("has_departments", avail.get("has_departments"));
    m.put("has_employee_names", avail.get("has_employee_names"));
    m.put("transaction_count", ds.transactions.size());
    m.put("data_source", ds.source);
    m.put("total_spend", com.mpcnajib.intact.util.MapsUtil.round(
        ds.transactions.stream().mapToDouble(t -> t.amount).sum()));
    m.put("llm_enabled", llm.enabled());
    m.put("llm_model", props.openrouterModel());
    m.put("import_meta", store.importMeta);
    m.put("enrichment", ds.enrichment);
    m.put("data_availability", avail);
    m.put("spend_source", "excel_raw");
    m.put("derived_fields", ds.enrichment.getOrDefault("derived_columns", List.of()));
    m.put("provided_fields", avail.get("provided_columns"));
    m.put("transparency_note", avail.get("data_honesty_note"));
    m.put("policy_thresholds", Map.of(
        "approval_cap", store.policyConfig().get("approval_cap"),
        "receipt_threshold", store.policyConfig().get("receipt_threshold")
    ));
    m.put("data_source_label", "demo".equals(ds.source)
        ? "Demo data loaded · upload your own Excel anytime"
        : "Live from uploaded Excel");
    return m;
  }

  public Map<String, Object> buildHome() {
    if (homeCache != null) return new LinkedHashMap<>(homeCache);
    policy.scan();
    var home = new LinkedHashMap<String, Object>();
    home.put("meta", buildMeta());
    home.put("overview", analytics.overview());
    home.put("command_center", demoInsights.commandCenter());
    home.put("budgets", analytics.budgetStatus());
    home.put("action_items", compliance.actionItems());
    home.put("demo_insights", demoInsights.autoInsights());
    homeCache = home;
    return new LinkedHashMap<>(home);
  }
}
