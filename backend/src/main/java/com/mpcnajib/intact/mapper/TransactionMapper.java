package com.mpcnajib.intact.mapper;

import com.mpcnajib.intact.domain.Transaction;
import com.mpcnajib.intact.model.TransactionDocument;
import java.util.LinkedHashMap;
import java.util.Map;

public final class TransactionMapper {
  private TransactionMapper() {}

  public static TransactionDocument toDocument(Transaction t, String batchId, int riskScore, String riskLevel) {
    var doc = new TransactionDocument();
    doc.setTransactionId(t.transactionId);
    doc.setEmployeeId(t.employeeId);
    doc.setEmployeeName(t.employeeName);
    doc.setCardholderLabel(t.cardholderLabel);
    doc.setMerchantName(t.merchantName);
    doc.setCategory(t.category);
    doc.setDate(t.date);
    doc.setAmount(t.amount);
    doc.setHasReceipt(t.hasReceipt);
    doc.setHasApproval(t.hasApproval);
    doc.setBusinessPurpose(t.businessPurpose);
    doc.setDepartment(t.department);
    doc.setRiskScore(riskScore);
    doc.setRiskLevel(riskLevel);
    doc.setUploadBatchId(batchId);
    return doc;
  }

  public static Map<String, Object> toDto(TransactionDocument doc) {
    var m = new LinkedHashMap<String, Object>();
    m.put("transaction_id", doc.getTransactionId());
    m.put("employee_id", doc.getEmployeeId());
    m.put("employee_name", doc.getEmployeeName());
    m.put("cardholder_label", doc.getCardholderLabel());
    m.put("merchant_name", doc.getMerchantName());
    m.put("category", doc.getCategory());
    m.put("date", doc.getDate());
    m.put("amount", doc.getAmount());
    m.put("has_receipt", doc.isHasReceipt());
    m.put("has_approval", doc.isHasApproval());
    m.put("risk_score", doc.getRiskScore());
    m.put("risk_level", doc.getRiskLevel());
    return m;
  }

  public static Map<String, Object> toDto(Transaction t) {
    return t.toMap();
  }
}
