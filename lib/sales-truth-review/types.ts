export type OrderTransactionFamily =
  | "regular_order_main"
  | "advance_order_main"
  | "payment_split_child"
  | "memo_special"
  | "sales_return"
  | "complimentary"
  | "unknown_special";

export type SuggestedInterpretation =
  | "normal_sale_candidate"
  | "advance_order_candidate"
  | "non_sale_complimentary"
  | "sales_return_candidate"
  | "cancelled_candidate"
  | "split_payment_child"
  | "unclear_needs_rule";

export type PaymentBreakupExtractStatus =
  | "not_needed"
  | "unavailable_from_current_export"
  | "extractable_from_text"
  | "ambiguous_text";

export type SalesPolicyBucket =
  | "net_sale_candidate"
  | "excluded_cancelled"
  | "excluded_complimentary"
  | "excluded_sales_return"
  | "unresolved_memo"
  | "unresolved_other";

export type SalesTruthReviewRow = {
  id: number;
  upload_log_id: number | null;
  order_no: string | null;
  bill_date: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  order_type: string | null;
  sub_order_type: string | null;
  status: string | null;
  my_amount: number | null;
  total_discount: number | null;
  delivery_charge: number | null;
  container_charge: number | null;
  total_tax: number | null;
  round_off: number | null;
  grand_total: number | null;
  effective_total: number | null;
  payment_type: string | null;
  payment_description: string | null;
  items_text?: string | null;
  parse_note: string | null;
  is_payment_split_row: boolean | null;
};

export type UploadLogRow = {
  id: number;
  original_file_name: string | null;
  created_at: string | null;
  inserted_row_count: number | null;
  rejected_row_count: number | null;
};

export type VerificationBreakdownRow = {
  key: string;
  rowCount: number;
  amount: number;
};

export type LatestImportBreakdownRow = {
  uploadLogId: number;
  originalFileName: string | null;
  createdAt: string | null;
  insertedRowCount: number | null;
  rejectedRowCount: number | null;
  dateCoverageText: string;
  exactAmountText: string;
  exactRowCount: number;
  netSaleCandidateAmount: number;
  excludedCancelledAmount: number;
  excludedComplimentaryAmount: number;
  excludedSalesReturnAmount: number;
  unresolvedMemoAmount: number;
  unresolvedOtherAmount: number;
  reconciled: boolean;
  differenceAmount: number;
};

export type MonthlyPolicyReconciliationRow = {
  billMonth: string;
  totalAmount: number;
  netSaleCandidateAmount: number;
  excludedCancelledAmount: number;
  excludedComplimentaryAmount: number;
  excludedSalesReturnAmount: number;
  unresolvedMemoAmount: number;
  unresolvedOtherAmount: number;
  reconciled: boolean;
  differenceAmount: number;
};

export type MemoReviewLabel =
  | "limited_context_memo"
  | "cancelled_signal_review_only"
  | "possible_advance_receipt"
  | "possible_later_sale_candidates"
  | "unclear_memo";

export type MatchConfidence = "high" | "medium" | "low";

export type MemoMatchCandidate = {
  orderNo: string;
  billDate: string | null;
  customerName: string | null;
  customerPhone: string | null;
  effectiveTotal: number | null;
  itemsSummary: string;
  confidence: MatchConfidence;
  reasons: string[];
};

export type MemoReviewRow = {
  row: SalesTruthReviewRow;
  memoReviewLabel: MemoReviewLabel;
  uploadFileName: string | null;
  matchCandidates: MemoMatchCandidate[];
};

export type SummaryCounts = {
  totalRows: number;
  regularOrderMainCount: number;
  advanceOrderMainCount: number;
  memoSpecialCount: number;
  complimentaryCount: number;
  salesReturnCount: number;
  cancelledRowsCount: number;
  paymentSplitChildCount: number;
  partPaymentRowsCount: number;
  extractablePaymentSplitRowsCount: number;
  unavailablePaymentSplitRowsCount: number;
  ambiguousPaymentTextRowsCount: number;
  grandTotalZeroCount: number;
  effectiveVsGrandTotalDifferenceCount: number;
  netSaleCandidateRowsCount: number;
  cancelledExcludedRowsCount: number;
  complimentaryExcludedRowsCount: number;
  salesReturnExcludedRowsCount: number;
  memoUnresolvedRowsCount: number;
  partPaymentValidSaleRowsCount: number;
  netSaleCandidateAmount: number;
  cancelledExcludedAmount: number;
  complimentaryExcludedAmount: number;
  salesReturnExcludedAmount: number;
  memoUnresolvedAmount: number;
  unresolvedOtherRowsCount: number;
  unresolvedOtherAmount: number;
  totalEffectiveTotalAllRows: number;
};

export type PaymentBreakupAnalysis = {
  status: PaymentBreakupExtractStatus;
  components: Array<{
    method: string;
    amount: number;
  }>;
};

export type SalesTruthReviewDerivedData = {
  summaryCounts: SummaryCounts;
  regularOrders: SalesTruthReviewRow[];
  advanceOrders: SalesTruthReviewRow[];
  memoOrders: SalesTruthReviewRow[];
  complimentaryOrders: SalesTruthReviewRow[];
  salesReturnOrders: SalesTruthReviewRow[];
  cancelledOrders: SalesTruthReviewRow[];
  paymentSplitChildRows: SalesTruthReviewRow[];
  partPaymentRows: SalesTruthReviewRow[];
  netSaleCandidateRows: SalesTruthReviewRow[];
  memoUnresolvedRows: SalesTruthReviewRow[];
  memoReviewRows: MemoReviewRow[];
  grandTotalZeroRows: SalesTruthReviewRow[];
  differentTotalRows: SalesTruthReviewRow[];
  monthBreakdownRows: VerificationBreakdownRow[];
  sourceFamilyBreakdownRows: VerificationBreakdownRow[];
  salesPolicyBreakdownRows: VerificationBreakdownRow[];
  netSalesByMonthRows: VerificationBreakdownRow[];
  latestImportBreakdownRows: LatestImportBreakdownRow[];
  monthlyPolicyReconciliationRows: MonthlyPolicyReconciliationRow[];
};
