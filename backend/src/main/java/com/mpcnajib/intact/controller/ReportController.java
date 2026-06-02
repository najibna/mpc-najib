package com.mpcnajib.intact.controller;

import com.mpcnajib.intact.service.ReportSummaryService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
  private final ReportSummaryService reports;

  public ReportController(ReportSummaryService reports) {
    this.reports = reports;
  }

  @GetMapping("/summary")
  public Map<String, Object> summary() {
    return reports.getSummary();
  }
}
