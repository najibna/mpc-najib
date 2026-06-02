package com.mpcnajib.intact.domain;

import java.util.LinkedHashMap;
import java.util.Map;

/** One corporate card charge row from the Excel dataset. */
public class Transaction {
  public String transactionId;
  public String transactionCode;
  public String transactionDescription;
  public String transactionCategory;
  public String postingDate;
  public String transactionDate;
  public String merchantName;
  public double amount;
  public String debitOrCredit;
  public String mcc;
  public String merchantCity;
  public String merchantCountry;
  public String merchantState;
  public String merchantPostal;
  public double conversionRate;
  public String channel;
  public String date;
  public String timestamp;
  public String month;
  public String category;
  public String city;
  public String country;
  public String employeeId;
  public String employeeName;
  public String cardholderLabel;
  public String department;
  public String role;
  public String cardLast4;
  public boolean hasReceipt;
  public boolean hasApproval;
  public String businessPurpose;
  public String managerName;
  public String ruleCategory;
  public String mealType;
  public int attendeeCount;
  public double estimatedPerPerson;
  public String source;

  public Map<String, Object> toMap() {
    var m = new LinkedHashMap<String, Object>();
    m.put("transaction_id", transactionId);
    m.put("transaction_code", transactionCode);
    m.put("transaction_description", transactionDescription);
    m.put("transaction_category", transactionCategory);
    m.put("posting_date", postingDate);
    m.put("transaction_date", transactionDate);
    m.put("merchant_name", merchantName);
    m.put("amount", round(amount));
    m.put("debit_or_credit", debitOrCredit);
    m.put("mcc", mcc);
    m.put("merchant_city", merchantCity);
    m.put("merchant_country", merchantCountry);
    m.put("merchant_state", merchantState);
    m.put("merchant_postal", merchantPostal);
    m.put("conversion_rate", conversionRate);
    m.put("channel", channel);
    m.put("date", date);
    m.put("timestamp", timestamp);
    m.put("month", month);
    m.put("category", category);
    m.put("city", city);
    m.put("country", country);
    m.put("employee_id", employeeId);
    m.put("employee_name", employeeName);
    m.put("cardholder_label", cardholderLabel);
    m.put("department", department);
    m.put("role", role);
    m.put("card_last4", cardLast4);
    m.put("has_receipt", hasReceipt);
    m.put("has_approval", hasApproval);
    m.put("business_purpose", businessPurpose);
    m.put("manager_name", managerName);
    m.put("rule_category", ruleCategory);
    m.put("meal_type", mealType);
    m.put("attendee_count", attendeeCount);
    m.put("estimated_per_person", estimatedPerPerson);
    m.put("source", source);
    return m;
  }

  private static double round(double v) {
    return Math.round(v * 100.0) / 100.0;
  }
}
