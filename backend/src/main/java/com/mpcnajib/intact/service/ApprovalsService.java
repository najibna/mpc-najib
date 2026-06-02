package com.mpcnajib.intact.service;

import com.mpcnajib.intact.store.SessionStore;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ApprovalsService {
  private final SessionStore store;

  public ApprovalsService(SessionStore store) {
    this.store = store;
  }

  public List<Map<String, Object>> list(String status) {
    var all = new ArrayList<>(store.approvals.values());
    if (status == null || status.isBlank()) return all;
    return all.stream().filter(a -> status.equals(a.get("status"))).toList();
  }

  public Map<String, Object> create(Map<String, Object> payload) {
    var req = new LinkedHashMap<String, Object>(payload);
    req.put("request_id", "apr_" + UUID.randomUUID().toString().substring(0, 8));
    req.put("status", "pending");
    req.put("recommendation", Map.of("decision", "review", "reasoning", "Pending review", "confidence", "medium"));
    store.approvals.put((String) req.get("request_id"), req);
    store.logAudit("approval.created", "User", (String) req.get("request_id"), Map.of());
    return req;
  }

  public Map<String, Object> get(String id) {
    return store.approvals.get(id);
  }

  public Map<String, Object> decide(String id, String decision, String approver, String note) {
    var req = store.approvals.get(id);
    if (req == null) return null;
    req.put("status", "approve".equals(decision) ? "approved" : "denied");
    req.put("decided_by", approver);
    req.put("decided_at", store.nowIso());
    req.put("decision_note", note);
    store.logAudit("approval." + decision, approver, id, Map.of("note", note));
    return req;
  }

  public Map<String, Object> undo(String id, String approver) {
    var req = store.approvals.get(id);
    if (req == null) return null;
    req.put("status", "pending");
    req.remove("decided_by");
    req.remove("decided_at");
    store.logAudit("approval.undo", approver, id, Map.of());
    return req;
  }
}
