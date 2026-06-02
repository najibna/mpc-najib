package com.mpcnajib.intact.service;

import com.mpcnajib.intact.domain.Transaction;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

@Service
public class ExcelLoaderService {
  public record LoadResult(List<Transaction> transactions, Map<String, Object> enrichment) {}

  private static final Map<String, List<String>> OPTIONAL_ALIASES = Map.of(
      "employee_id", List.of("employee_id", "Employee ID", "Cardholder ID", "Card ID"),
      "employee_name", List.of("employee_name", "Employee Name", "Cardholder Name", "Cardholder"),
      "department", List.of("department", "Department", "Cost Center", "Dept"),
      "role", List.of("role", "Role", "Job Title", "Title"),
      "card_last4", List.of("card_last4", "Card Last 4", "Card Last Four", "Last4"),
      "has_receipt", List.of("has_receipt", "Has Receipt", "Receipt", "Receipt Attached"),
      "has_approval", List.of("has_approval", "Has Approval", "Pre-Approved", "Approved"),
      "business_purpose", List.of("business_purpose", "Business Purpose", "Purpose", "Notes", "Memo"),
      "manager_name", List.of("manager_name", "Manager", "Manager Name", "Approver")
  );

  private static final Map<String, String> MCC_LABELS = Map.of(
      "5541", "Fuel & Gas", "5812", "Restaurants", "5813", "Bars & Dining",
      "5814", "Fast Food", "7011", "Hotels & Lodging", "4121", "Taxi & Rideshare"
  );

  public LoadResult loadFromBytes(byte[] bytes) throws IOException {
    try (var wb = new XSSFWorkbook(new java.io.ByteArrayInputStream(bytes))) {
      return loadWorkbook(wb);
    }
  }

  public LoadResult loadFromStream(InputStream in) throws IOException {
    try (var wb = new XSSFWorkbook(in)) {
      return loadWorkbook(wb);
    }
  }

  private LoadResult loadWorkbook(Workbook wb) {
    Sheet sheet = wb.getSheetAt(0);
    Row header = sheet.getRow(0);
    if (header == null) {
      return new LoadResult(List.of(), enrichmentMeta(List.of(), List.of()));
    }
    Map<String, Integer> colIndex = headerIndex(header);
    Map<String, String> optionalCols = detectOptional(colIndex);

    List<Transaction> rows = new ArrayList<>();
    for (int r = 1; r <= sheet.getLastRowNum(); r++) {
      Row row = sheet.getRow(r);
      if (row == null) continue;
      Transaction t = mapRow(row, colIndex, optionalCols, rows.size() + 1);
      if (t != null && t.amount > 0) {
        String dc = t.debitOrCredit == null ? "" : t.debitOrCredit.toLowerCase(Locale.ROOT);
        if (!"credit".equals(dc)) {
          rows.add(t);
        }
      }
    }

    List<String> provided = optionalCols.entrySet().stream()
        .filter(e -> e.getValue() != null)
        .map(Map.Entry::getKey)
        .toList();
    return new LoadResult(rows, enrichmentMeta(rows, provided));
  }

  private Transaction mapRow(
      Row row, Map<String, Integer> cols, Map<String, String> opt, int seq
  ) {
    String debitCredit = str(row, cols.get("Debit or Credit"));
    double amount = num(row, cols.get("Transaction Amount"));
    if (amount <= 0) return null;

    String txnCode = str(row, cols.get("Transaction Code"));
    String merchant = str(row, cols.get("Merchant Info DBA Name"));
    String mcc = mccClean(str(row, cols.get("Merchant Category Code")));
    String dateStr = dateStr(row, cols.get("Transaction Date"), cols.get("Posting date of transaction"));

    String empId = optVal(row, cols, opt.get("employee_id"));
    if (empId.isBlank()) empId = txnCode;
    String empName = optVal(row, cols, opt.get("employee_name"));
    String dept = optVal(row, cols, opt.get("department"));
    Boolean receipt = optBool(row, cols, opt.get("has_receipt"));
    Boolean approval = optBool(row, cols, opt.get("has_approval"));

    var t = new Transaction();
    t.transactionId = "tx_%06d".formatted(seq);
    t.transactionCode = txnCode;
    t.transactionDescription = str(row, cols.get("Transaction Description"));
    t.transactionCategory = str(row, cols.get("Transaction Category"));
    t.postingDate = dateStr;
    t.transactionDate = dateStr;
    t.merchantName = merchant.length() > 120 ? merchant.substring(0, 120) : merchant;
    t.amount = Math.round(amount * 100.0) / 100.0;
    t.debitOrCredit = debitCredit.isBlank() ? "Debit" : debitCredit;
    t.mcc = mcc;
    t.merchantCity = str(row, cols.get("Merchant City"));
    t.merchantCountry = str(row, cols.get("Merchant Country"));
    t.merchantState = str(row, cols.get("Merchant State/Province"));
    t.merchantPostal = str(row, cols.get("Merchant Postal Code"));
    t.conversionRate = num(row, cols.get("Conversion Rate"));
    if (t.conversionRate <= 0) t.conversionRate = 1.0;
    t.channel = merchant.toLowerCase(Locale.ROOT).matches(".*(www|\\.com|online).*")
        ? "online" : "in_person";
    t.date = dateStr;
    t.timestamp = dateStr.isBlank() ? "" : dateStr + "T12:00:00";
    t.month = dateStr.length() >= 7 ? dateStr.substring(0, 7) : "";
    t.category = !t.transactionCategory.isBlank() ? t.transactionCategory
        : (!mcc.isBlank() ? mcc : "uncategorized");
    t.city = t.merchantCity;
    t.country = t.merchantCountry;
    t.employeeId = empId;
    t.employeeName = empName;
    t.cardholderLabel = cardholderLabel(empName, txnCode, empId);
    t.department = dept;
    t.role = optVal(row, cols, opt.get("role"));
    t.cardLast4 = optVal(row, cols, opt.get("card_last4"));
    t.hasReceipt = receipt != null && receipt;
    t.hasApproval = approval != null && approval;
    t.businessPurpose = optVal(row, cols, opt.get("business_purpose"));
    t.managerName = optVal(row, cols, opt.get("manager_name"));
    t.ruleCategory = ruleCategory(mcc, merchant);
    t.mealType = "";
    t.attendeeCount = 0;
    t.estimatedPerPerson = 0;
    t.source = "excel";
    return t;
  }

  public static String cardholderLabel(String employeeName, String transactionCode, String employeeId) {
    if (employeeName != null && !employeeName.isBlank()) return employeeName.trim();
    String code = transactionCode != null && !transactionCode.isBlank() ? transactionCode : employeeId;
    return code == null || code.isBlank() ? "Unknown card" : "Card #" + code;
  }

  private static String ruleCategory(String mcc, String merchant) {
    String m = merchant.toLowerCase(Locale.ROOT);
    if (m.matches(".*(bar|pub|brewery|liquor).*")) return "entertainment";
    if (m.matches(".*(love'?s|petro|shell|fuel|gas).*")) return "fuel";
    if (m.matches(".*(fedex|ups|shipping).*")) return "shipping";
    return "general";
  }

  private Map<String, Object> enrichmentMeta(List<Transaction> rows, List<String> provided) {
    var meta = new LinkedHashMap<String, Object>();
    meta.put("spend_source", "excel_raw");
    meta.put("provided_columns", provided);
    meta.put("derived_columns", List.of());
    meta.put("has_employee_names", provided.contains("employee_name"));
    meta.put("has_departments", provided.contains("department"));
    meta.put("has_receipt_column", provided.contains("has_receipt"));
    meta.put("has_approval_column", provided.contains("has_approval"));
    meta.put("has_business_purpose_column", provided.contains("business_purpose"));
    meta.put("has_meal_context", false);
    meta.put("debit_rows_imported", rows.size());
    meta.put(
        "raw_total_spend",
        com.mpcnajib.intact.util.MapsUtil.round(rows.stream().mapToDouble(t -> t.amount).sum())
    );
    return meta;
  }

  private Map<String, Integer> headerIndex(Row header) {
    var map = new LinkedHashMap<String, Integer>();
    for (Cell c : header) {
      if (c == null) continue;
      map.put(cellStr(c).trim(), c.getColumnIndex());
    }
    return map;
  }

  private Map<String, String> detectOptional(Map<String, Integer> cols) {
    var lower = new LinkedHashMap<String, Integer>();
    cols.forEach((k, v) -> lower.put(k.toLowerCase(Locale.ROOT), v));
    var found = new LinkedHashMap<String, String>();
    OPTIONAL_ALIASES.forEach((field, aliases) -> {
      for (String alias : aliases) {
        Integer idx = lower.get(alias.toLowerCase(Locale.ROOT));
        if (idx != null) {
          found.put(field, cols.entrySet().stream()
              .filter(e -> e.getValue().equals(idx))
              .map(Map.Entry::getKey)
              .findFirst()
              .orElse(alias));
          break;
        }
      }
    });
    return found;
  }

  private static String optVal(Row row, Map<String, Integer> cols, String colName) {
    if (colName == null) return "";
    return str(row, cols.get(colName));
  }

  private static Boolean optBool(Row row, Map<String, Integer> cols, String colName) {
    if (colName == null) return null;
    String s = str(row, cols.get(colName)).toLowerCase(Locale.ROOT);
    if (s.isBlank()) return null;
    if (List.of("true", "yes", "y", "1", "matched", "approved", "present").contains(s)) return true;
    if (List.of("false", "no", "n", "0", "missing", "denied", "absent").contains(s)) return false;
    return null;
  }

  private static String str(Row row, Integer idx) {
    if (idx == null) return "";
    Cell c = row.getCell(idx);
    return cellStr(c);
  }

  private static double num(Row row, Integer idx) {
    if (idx == null) return 0;
    Cell c = row.getCell(idx);
    if (c == null || c.getCellType() == CellType.BLANK) return 0;
    if (c.getCellType() == CellType.NUMERIC) return c.getNumericCellValue();
    try {
      return Double.parseDouble(cellStr(c).replace(",", ""));
    } catch (NumberFormatException e) {
      return 0;
    }
  }

  private static String dateStr(Row row, Integer txnCol, Integer postCol) {
    String d = formatDateCell(row, txnCol);
    if (!d.isBlank()) return d;
    return formatDateCell(row, postCol);
  }

  private static String formatDateCell(Row row, Integer idx) {
    if (idx == null) return "";
    Cell c = row.getCell(idx);
    if (c == null) return "";
    if (c.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(c)) {
      LocalDate ld = c.getLocalDateTimeCellValue().toLocalDate();
      return ld.format(DateTimeFormatter.ISO_LOCAL_DATE);
    }
    String s = cellStr(c).trim();
    if (s.length() >= 10) return s.substring(0, 10);
    return s;
  }

  private static String cellStr(Cell c) {
    if (c == null) return "";
    return switch (c.getCellType()) {
      case STRING -> c.getStringCellValue().trim();
      case NUMERIC -> {
        if (DateUtil.isCellDateFormatted(c)) {
          yield c.getLocalDateTimeCellValue().toLocalDate().format(DateTimeFormatter.ISO_LOCAL_DATE);
        }
        double v = c.getNumericCellValue();
        if (v == Math.floor(v)) yield String.valueOf((long) v);
        yield String.valueOf(v);
      }
      case BOOLEAN -> String.valueOf(c.getBooleanCellValue());
      default -> "";
    };
  }

  private static String mccClean(String mcc) {
    if (mcc == null || mcc.isBlank() || "nan".equalsIgnoreCase(mcc)) return "";
    int dot = mcc.indexOf('.');
    return dot > 0 ? mcc.substring(0, dot) : mcc;
  }
}
