import {
  analyzePaymentBreakup,
  buildMemoMatchCandidates,
  createEmptySummaryCounts,
  detectTransactionFamily,
  deriveMemoReviewLabel,
  getBillMonth,
  getDisplayAmount,
  getEffectiveTotalForVerification,
  getSalesPolicyBucket,
  getSourceFamilyLabel,
  hasEffectiveVsGrandTotalDifference,
  hasPartPayment,
  isCancelledRow,
  isGrandTotalZeroRow,
  sortLatestRows,
} from "./policy.ts";
import type {
  MonthlyPolicyReconciliationRow,
  SalesTruthReviewDerivedData,
  SalesTruthReviewRow,
  UploadLogRow,
  VerificationBreakdownRow,
} from "./types.ts";

function addBreakdown(
  breakdownMap: Map<string, VerificationBreakdownRow>,
  key: string,
  amount: number
) {
  const existing = breakdownMap.get(key);

  if (existing) {
    existing.rowCount += 1;
    existing.amount += amount;
    return;
  }

  breakdownMap.set(key, {
    key,
    rowCount: 1,
    amount,
  });
}

function createMonthPolicyRow(billMonth: string): MonthlyPolicyReconciliationRow {
  return {
    billMonth,
    totalAmount: 0,
    netSaleCandidateAmount: 0,
    excludedCancelledAmount: 0,
    excludedComplimentaryAmount: 0,
    excludedSalesReturnAmount: 0,
    unresolvedMemoAmount: 0,
    unresolvedOtherAmount: 0,
    reconciled: true,
    differenceAmount: 0,
  };
}

function getOrCreateMonthPolicyRow(
  monthPolicyMap: Map<string, MonthlyPolicyReconciliationRow>,
  billMonth: string
) {
  const existing = monthPolicyMap.get(billMonth);

  if (existing) {
    return existing;
  }

  const created = createMonthPolicyRow(billMonth);
  monthPolicyMap.set(billMonth, created);
  return created;
}

function buildLatestImportBreakdownRows({
  latestUploadLogs,
  rowsByUploadLogId,
  formatCurrency,
}: {
  latestUploadLogs: UploadLogRow[];
  rowsByUploadLogId: Map<number, SalesTruthReviewRow[]>;
  formatCurrency: (value: number | null) => string;
}) {
  return latestUploadLogs.map((uploadLog) => {
    const matchedRows = rowsByUploadLogId.get(uploadLog.id) ?? [];
    const billDates = matchedRows
      .map((row) => row.bill_date)
      .filter((value): value is string => Boolean(value))
      .sort();
    const exactAmount = matchedRows.reduce(
      (sum, row) => sum + getEffectiveTotalForVerification(row),
      0
    );
    let netSaleCandidateAmount = 0;
    let excludedCancelledAmount = 0;
    let excludedComplimentaryAmount = 0;
    let excludedSalesReturnAmount = 0;
    let unresolvedMemoAmount = 0;
    let unresolvedOtherAmount = 0;

    matchedRows.forEach((row) => {
      const transactionFamily = detectTransactionFamily(row);
      const salesPolicyBucket = getSalesPolicyBucket(row, transactionFamily);
      const effectiveTotal = getEffectiveTotalForVerification(row);

      if (salesPolicyBucket === "net_sale_candidate") {
        netSaleCandidateAmount += effectiveTotal;
      } else if (salesPolicyBucket === "excluded_cancelled") {
        excludedCancelledAmount += effectiveTotal;
      } else if (salesPolicyBucket === "excluded_complimentary") {
        excludedComplimentaryAmount += effectiveTotal;
      } else if (salesPolicyBucket === "excluded_sales_return") {
        excludedSalesReturnAmount += effectiveTotal;
      } else if (salesPolicyBucket === "unresolved_memo") {
        unresolvedMemoAmount += effectiveTotal;
      } else {
        unresolvedOtherAmount += effectiveTotal;
      }
    });

    const bucketTotal =
      netSaleCandidateAmount +
      excludedCancelledAmount +
      excludedComplimentaryAmount +
      excludedSalesReturnAmount +
      unresolvedMemoAmount +
      unresolvedOtherAmount;
    const differenceAmount = Number((exactAmount - bucketTotal).toFixed(2));
    const dateCoverageText =
      billDates.length > 0
        ? billDates[0] === billDates[billDates.length - 1]
          ? billDates[0]
          : `${billDates[0]} to ${billDates[billDates.length - 1]}`
        : "No bill date found";

    return {
      uploadLogId: uploadLog.id,
      originalFileName: uploadLog.original_file_name,
      createdAt: uploadLog.created_at,
      insertedRowCount: uploadLog.inserted_row_count,
      rejectedRowCount: uploadLog.rejected_row_count,
      dateCoverageText,
      exactAmountText: formatCurrency(exactAmount),
      exactRowCount: matchedRows.length,
      netSaleCandidateAmount,
      excludedCancelledAmount,
      excludedComplimentaryAmount,
      excludedSalesReturnAmount,
      unresolvedMemoAmount,
      unresolvedOtherAmount,
      reconciled: Math.abs(differenceAmount) <= 0.01,
      differenceAmount,
    };
  });
}

export function buildSalesTruthReviewDerivedData({
  rows,
  latestUploadLogs,
  uploadFileNameById,
  formatCurrency,
}: {
  rows: SalesTruthReviewRow[];
  latestUploadLogs: UploadLogRow[];
  uploadFileNameById: Map<number, string | null>;
  formatCurrency: (value: number | null) => string;
}): SalesTruthReviewDerivedData {
  const summaryCounts = createEmptySummaryCounts();
  const regularOrders: SalesTruthReviewRow[] = [];
  const advanceOrders: SalesTruthReviewRow[] = [];
  const memoOrders: SalesTruthReviewRow[] = [];
  const complimentaryOrders: SalesTruthReviewRow[] = [];
  const salesReturnOrders: SalesTruthReviewRow[] = [];
  const cancelledOrders: SalesTruthReviewRow[] = [];
  const paymentSplitChildRows: SalesTruthReviewRow[] = [];
  const partPaymentRows: SalesTruthReviewRow[] = [];
  const netSaleCandidateRows: SalesTruthReviewRow[] = [];
  const memoUnresolvedRows: SalesTruthReviewRow[] = [];
  const grandTotalZeroRows: SalesTruthReviewRow[] = [];
  const differentTotalRows: SalesTruthReviewRow[] = [];
  const monthBreakdownMap = new Map<string, VerificationBreakdownRow>();
  const sourceFamilyBreakdownMap = new Map<string, VerificationBreakdownRow>();
  const salesPolicyBreakdownMap = new Map<string, VerificationBreakdownRow>();
  const netSalesByMonthMap = new Map<string, VerificationBreakdownRow>();
  const rowsByUploadLogId = new Map<number, SalesTruthReviewRow[]>();
  const monthPolicyMap = new Map<string, MonthlyPolicyReconciliationRow>();

  rows.forEach((row) => {
    summaryCounts.totalRows += 1;
    summaryCounts.totalEffectiveTotalAllRows += getEffectiveTotalForVerification(row);

    const transactionFamily = detectTransactionFamily(row);
    const isCancelled = isCancelledRow(row);
    const salesPolicyBucket = getSalesPolicyBucket(row, transactionFamily);
    const displayAmount = getDisplayAmount(row);
    const effectiveTotalForVerification = getEffectiveTotalForVerification(row);
    const billMonth = getBillMonth(row.bill_date);
    const monthPolicyRow = getOrCreateMonthPolicyRow(monthPolicyMap, billMonth);

    addBreakdown(monthBreakdownMap, billMonth, effectiveTotalForVerification);
    addBreakdown(sourceFamilyBreakdownMap, getSourceFamilyLabel(row), effectiveTotalForVerification);
    addBreakdown(salesPolicyBreakdownMap, salesPolicyBucket, effectiveTotalForVerification);
    monthPolicyRow.totalAmount += effectiveTotalForVerification;

    if (row.upload_log_id !== null && row.upload_log_id !== undefined) {
      const existingRows = rowsByUploadLogId.get(row.upload_log_id) ?? [];
      existingRows.push(row);
      rowsByUploadLogId.set(row.upload_log_id, existingRows);
    }

    if (transactionFamily === "regular_order_main") {
      summaryCounts.regularOrderMainCount += 1;
      regularOrders.push(row);
    } else if (transactionFamily === "advance_order_main") {
      summaryCounts.advanceOrderMainCount += 1;
      advanceOrders.push(row);
    } else if (transactionFamily === "memo_special") {
      summaryCounts.memoSpecialCount += 1;
      memoOrders.push(row);
    } else if (transactionFamily === "complimentary") {
      summaryCounts.complimentaryCount += 1;
      complimentaryOrders.push(row);
    } else if (transactionFamily === "sales_return") {
      summaryCounts.salesReturnCount += 1;
      salesReturnOrders.push(row);
    } else if (transactionFamily === "payment_split_child") {
      summaryCounts.paymentSplitChildCount += 1;
      paymentSplitChildRows.push(row);
    }

    if (isCancelled) {
      summaryCounts.cancelledRowsCount += 1;
      cancelledOrders.push(row);
    }

    if (isGrandTotalZeroRow(row)) {
      summaryCounts.grandTotalZeroCount += 1;
      grandTotalZeroRows.push(row);
    }

    if (hasEffectiveVsGrandTotalDifference(row)) {
      summaryCounts.effectiveVsGrandTotalDifferenceCount += 1;
      differentTotalRows.push(row);
    }

    if (hasPartPayment(row)) {
      summaryCounts.partPaymentRowsCount += 1;
      partPaymentRows.push(row);

      const paymentBreakupAnalysis = analyzePaymentBreakup(row);

      if (paymentBreakupAnalysis.status === "extractable_from_text") {
        summaryCounts.extractablePaymentSplitRowsCount += 1;
      } else if (paymentBreakupAnalysis.status === "unavailable_from_current_export") {
        summaryCounts.unavailablePaymentSplitRowsCount += 1;
      } else if (paymentBreakupAnalysis.status === "ambiguous_text") {
        summaryCounts.ambiguousPaymentTextRowsCount += 1;
      }
    }

    if (salesPolicyBucket === "net_sale_candidate") {
      summaryCounts.netSaleCandidateRowsCount += 1;
      summaryCounts.netSaleCandidateAmount += displayAmount;
      netSaleCandidateRows.push(row);
      addBreakdown(netSalesByMonthMap, billMonth, effectiveTotalForVerification);
      monthPolicyRow.netSaleCandidateAmount += effectiveTotalForVerification;

      if (hasPartPayment(row)) {
        summaryCounts.partPaymentValidSaleRowsCount += 1;
      }
    } else if (salesPolicyBucket === "excluded_cancelled") {
      summaryCounts.cancelledExcludedRowsCount += 1;
      summaryCounts.cancelledExcludedAmount += displayAmount;
      monthPolicyRow.excludedCancelledAmount += effectiveTotalForVerification;
    } else if (salesPolicyBucket === "excluded_complimentary") {
      summaryCounts.complimentaryExcludedRowsCount += 1;
      summaryCounts.complimentaryExcludedAmount += displayAmount;
      monthPolicyRow.excludedComplimentaryAmount += effectiveTotalForVerification;
    } else if (salesPolicyBucket === "excluded_sales_return") {
      summaryCounts.salesReturnExcludedRowsCount += 1;
      summaryCounts.salesReturnExcludedAmount += displayAmount;
      monthPolicyRow.excludedSalesReturnAmount += effectiveTotalForVerification;
    } else if (salesPolicyBucket === "unresolved_memo") {
      summaryCounts.memoUnresolvedRowsCount += 1;
      summaryCounts.memoUnresolvedAmount += displayAmount;
      memoUnresolvedRows.push(row);
      monthPolicyRow.unresolvedMemoAmount += effectiveTotalForVerification;
    } else {
      summaryCounts.unresolvedOtherRowsCount += 1;
      summaryCounts.unresolvedOtherAmount += displayAmount;
      monthPolicyRow.unresolvedOtherAmount += effectiveTotalForVerification;
    }
  });

  const latestImportBreakdownRows = buildLatestImportBreakdownRows({
    latestUploadLogs,
    rowsByUploadLogId,
    formatCurrency,
  });
  const monthlyPolicyReconciliationRows = Array.from(monthPolicyMap.values())
    .map((row) => {
      const bucketTotal =
        row.netSaleCandidateAmount +
        row.excludedCancelledAmount +
        row.excludedComplimentaryAmount +
        row.excludedSalesReturnAmount +
        row.unresolvedMemoAmount +
        row.unresolvedOtherAmount;
      const differenceAmount = Number((row.totalAmount - bucketTotal).toFixed(2));

      return {
        ...row,
        reconciled: Math.abs(differenceAmount) <= 0.01,
        differenceAmount,
      };
    })
    .sort((first, second) => second.billMonth.localeCompare(first.billMonth));
  const numericRowsForMemoMatching = rows.filter((row) => {
    const orderNo = String(row.order_no ?? "").trim();
    return /^\d+$/.test(orderNo) && !row.is_payment_split_row;
  });
  const memoReviewRows = sortLatestRows(memoUnresolvedRows).map((row) => ({
    row,
    memoReviewLabel: deriveMemoReviewLabel(row),
    uploadFileName:
      row.upload_log_id !== null && row.upload_log_id !== undefined
        ? uploadFileNameById.get(row.upload_log_id) ?? null
        : null,
    matchCandidates: buildMemoMatchCandidates(row, numericRowsForMemoMatching),
  }));

  return {
    summaryCounts,
    regularOrders: sortLatestRows(regularOrders).slice(0, 50),
    advanceOrders: sortLatestRows(advanceOrders).slice(0, 50),
    memoOrders: sortLatestRows(memoOrders).slice(0, 50),
    complimentaryOrders: sortLatestRows(complimentaryOrders).slice(0, 50),
    salesReturnOrders: sortLatestRows(salesReturnOrders).slice(0, 50),
    cancelledOrders: sortLatestRows(cancelledOrders).slice(0, 50),
    paymentSplitChildRows: sortLatestRows(paymentSplitChildRows).slice(0, 50),
    partPaymentRows: sortLatestRows(partPaymentRows).slice(0, 50),
    netSaleCandidateRows: sortLatestRows(netSaleCandidateRows).slice(0, 50),
    memoUnresolvedRows: sortLatestRows(memoUnresolvedRows).slice(0, 50),
    memoReviewRows,
    grandTotalZeroRows: sortLatestRows(grandTotalZeroRows).slice(0, 50),
    differentTotalRows: sortLatestRows(differentTotalRows).slice(0, 50),
    monthBreakdownRows: Array.from(monthBreakdownMap.values()).sort((first, second) =>
      second.key.localeCompare(first.key)
    ),
    sourceFamilyBreakdownRows: Array.from(sourceFamilyBreakdownMap.values()).sort(
      (first, second) => second.amount - first.amount
    ),
    salesPolicyBreakdownRows: Array.from(salesPolicyBreakdownMap.values()).sort(
      (first, second) => second.amount - first.amount
    ),
    netSalesByMonthRows: Array.from(netSalesByMonthMap.values()).sort((first, second) =>
      second.key.localeCompare(first.key)
    ),
    latestImportBreakdownRows,
    monthlyPolicyReconciliationRows,
  };
}
