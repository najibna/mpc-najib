package com.mpcnajib.intact.messaging;

public final class EventTypes {
  public static final String EXCHANGE = "intact.events";
  public static final String QUEUE_POLICY_CHECK = "intact.policy.check";
  public static final String ROUTING_TRANSACTIONS_UPLOADED = "transactions.uploaded";
  public static final String ROUTING_POLICY_VIOLATION = "policy.violation.detected";
  public static final String ROUTING_REVIEW_APPROVED = "review.approved";
  public static final String ROUTING_REVIEW_DENIED = "review.denied";
  public static final String ROUTING_REPORT_GENERATED = "report.generated";

  private EventTypes() {}
}
