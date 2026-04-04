import type {
  MemoMatchCandidate,
  MemoReviewLabel,
  OrderTransactionFamily,
  PaymentBreakupAnalysis,
  PaymentBreakupExtractStatus,
  SalesPolicyBucket,
  SalesTruthReviewRow,
  SuggestedInterpretation,
  SummaryCounts,
} from "./types.ts";

export function createEmptySummaryCounts(): SummaryCounts {
  return {
    totalRows: 0,
    regularOrderMainCount: 0,
    advanceOrderMainCount: 0,
    memoSpecialCount: 0,
    complimentaryCount: 0,
    salesReturnCount: 0,
    cancelledRowsCount: 0,
    paymentSplitChildCount: 0,
    partPaymentRowsCount: 0,
    extractablePaymentSplitRowsCount: 0,
    unavailablePaymentSplitRowsCount: 0,
    ambiguousPaymentTextRowsCount: 0,
    grandTotalZeroCount: 0,
    effectiveVsGrandTotalDifferenceCount: 0,
    netSaleCandidateRowsCount: 0,
    cancelledExcludedRowsCount: 0,
    complimentaryExcludedRowsCount: 0,
    salesReturnExcludedRowsCount: 0,
    memoUnresolvedRowsCount: 0,
    partPaymentValidSaleRowsCount: 0,
    netSaleCandidateAmount: 0,
    cancelledExcludedAmount: 0,
    complimentaryExcludedAmount: 0,
    salesReturnExcludedAmount: 0,
    memoUnresolvedAmount: 0,
    unresolvedOtherRowsCount: 0,
    unresolvedOtherAmount: 0,
    totalEffectiveTotalAllRows: 0,
  };
}

export function normalizeText(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

export function parseNoteValue(parseNote: string | null | undefined, key: string) {
  const segments = String(parseNote ?? "")
    .split("|")
    .map((segment) => segment.trim());

  for (const segment of segments) {
    const [segmentKey, ...rest] = segment.split("=");

    if (segmentKey?.trim() === key) {
      return rest.join("=").trim() || null;
    }
  }

  return null;
}

export function isCancelledRow(row: SalesTruthReviewRow) {
  const parseNoteValueText = parseNoteValue(row.parse_note, "is_cancelled");

  if (parseNoteValueText === "yes") {
    return true;
  }

  return normalizeText(row.status).includes("cancel");
}

export function hasPartPayment(row: SalesTruthReviewRow) {
  return normalizeText(row.payment_type).includes("part payment");
}

export function hasStrongAdvanceSignal(row: SalesTruthReviewRow) {
  const orderType = normalizeText(row.order_type);
  const subOrderType = normalizeText(row.sub_order_type);
  const paymentDescription = normalizeText(row.payment_description);

  return (
    orderType.includes("advance") ||
    subOrderType.includes("advance") ||
    paymentDescription.includes("advance order") ||
    paymentDescription.includes("advance booking") ||
    paymentDescription.includes("token amount")
  );
}

export function parseAmountText(value: string) {
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

export function analyzePaymentBreakup(row: SalesTruthReviewRow): PaymentBreakupAnalysis {
  if (!hasPartPayment(row)) {
    return {
      status: "not_needed",
      components: [],
    };
  }

  const paymentDescription = String(row.payment_description ?? "").trim();

  if (!paymentDescription) {
    return {
      status: "unavailable_from_current_export",
      components: [],
    };
  }

  const methods = ["cash", "card", "online", "due", "wallet", "bank"];
  const components = new Map<string, number>();

  methods.forEach((method) => {
    const afterMethodPattern = new RegExp(`${method}[^0-9]{0,15}([0-9]+(?:\\.[0-9]+)?)`, "ig");
    const beforeMethodPattern = new RegExp(`([0-9]+(?:\\.[0-9]+)?)[^a-z0-9]{0,10}${method}`, "ig");
    let match: RegExpExecArray | null;

    while ((match = afterMethodPattern.exec(paymentDescription)) !== null) {
      const amount = parseAmountText(match[1]);

      if (amount !== null) {
        components.set(method, amount);
      }
    }

    while ((match = beforeMethodPattern.exec(paymentDescription)) !== null) {
      const amount = parseAmountText(match[1]);

      if (amount !== null) {
        components.set(method, amount);
      }
    }
  });

  const extractedComponents = Array.from(components.entries()).map(([method, amount]) => ({
    method,
    amount,
  }));
  const normalizedDescription = normalizeText(paymentDescription);
  const hasOnlyTotalText =
    normalizedDescription.includes("total") &&
    !methods.some((method) => normalizedDescription.includes(method));

  if (extractedComponents.length >= 2) {
    return {
      status: "extractable_from_text",
      components: extractedComponents,
    };
  }

  if (hasOnlyTotalText) {
    return {
      status: "unavailable_from_current_export",
      components: extractedComponents,
    };
  }

  return {
    status: extractedComponents.length === 0 ? "ambiguous_text" : "extractable_from_text",
    components: extractedComponents,
  };
}

export function getPartPaymentDerivedNote(status: PaymentBreakupExtractStatus) {
  if (status === "extractable_from_text") {
    return "Sale row, split detail extractable from text";
  }

  if (status === "ambiguous_text") {
    return "Sale row, payment text ambiguous";
  }

  if (status === "unavailable_from_current_export") {
    return "Sale row, but split detail unavailable";
  }

  return "Sale row, payment split review not needed";
}

export function detectTransactionFamily(row: SalesTruthReviewRow): OrderTransactionFamily {
  const parseNoteFamily = parseNoteValue(row.parse_note, "transaction_family");

  if (
    parseNoteFamily === "payment_split_child" ||
    parseNoteFamily === "memo_special" ||
    parseNoteFamily === "sales_return" ||
    parseNoteFamily === "complimentary" ||
    parseNoteFamily === "unknown_special"
  ) {
    return parseNoteFamily;
  }

  if (row.is_payment_split_row) {
    return "payment_split_child";
  }

  const orderNo = String(row.order_no ?? "").trim();

  if (normalizeText(orderNo) === "memo") {
    return "memo_special";
  }

  if (/^sr/i.test(orderNo)) {
    return "sales_return";
  }

  if (/^c/i.test(orderNo)) {
    return "complimentary";
  }

  if (/^\d+$/.test(orderNo)) {
    if (hasStrongAdvanceSignal(row)) {
      return "advance_order_main";
    }

    return "regular_order_main";
  }

  return "unknown_special";
}

export function getSuggestedInterpretation(
  row: SalesTruthReviewRow,
  transactionFamily: OrderTransactionFamily
): SuggestedInterpretation {
  if (transactionFamily === "payment_split_child") {
    return "split_payment_child";
  }

  if (isCancelledRow(row)) {
    return "cancelled_candidate";
  }

  if (transactionFamily === "sales_return") {
    return "sales_return_candidate";
  }

  if (transactionFamily === "complimentary") {
    return "non_sale_complimentary";
  }

  if (transactionFamily === "advance_order_main") {
    return "advance_order_candidate";
  }

  if (transactionFamily === "regular_order_main") {
    return "normal_sale_candidate";
  }

  return "unclear_needs_rule";
}

export function isGrandTotalZeroRow(row: SalesTruthReviewRow) {
  return row.grand_total === null || Number(row.grand_total) === 0;
}

export function hasEffectiveVsGrandTotalDifference(row: SalesTruthReviewRow) {
  return Math.abs(Number(row.effective_total ?? 0) - Number(row.grand_total ?? 0)) > 1;
}

export function sortLatestRows(rows: SalesTruthReviewRow[]) {
  return [...rows].sort((firstRow, secondRow) => {
    const firstTime = firstRow.bill_date ? new Date(firstRow.bill_date).getTime() : 0;
    const secondTime = secondRow.bill_date ? new Date(secondRow.bill_date).getTime() : 0;

    if (secondTime !== firstTime) {
      return secondTime - firstTime;
    }

    return secondRow.id - firstRow.id;
  });
}

export function getDisplayAmount(row: SalesTruthReviewRow) {
  if (row.effective_total !== null && row.effective_total !== undefined) {
    return Number(row.effective_total);
  }

  if (row.grand_total !== null && row.grand_total !== undefined) {
    return Number(row.grand_total);
  }

  return 0;
}

export function getEffectiveTotalForVerification(row: SalesTruthReviewRow) {
  return Number(row.effective_total ?? 0);
}

export function getBillMonth(value: string | null) {
  if (!value) {
    return "unknown";
  }

  return value.slice(0, 7);
}

export function getSourceFamilyLabel(row: SalesTruthReviewRow) {
  return parseNoteValue(row.parse_note, "transaction_family") ?? detectTransactionFamily(row);
}

export function getItemsSummary(itemsText: string | null | undefined) {
  const text = String(itemsText ?? "").trim();

  if (!text) {
    return "-";
  }

  return text.length > 100 ? `${text.slice(0, 97)}...` : text;
}

export function normalizeName(value: string | null | undefined) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, " ").trim();
}

export function buildNameTokens(value: string | null | undefined) {
  return normalizeName(value)
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function hasNameOverlap(firstValue: string | null | undefined, secondValue: string | null | undefined) {
  const firstTokens = buildNameTokens(firstValue);
  const secondTokens = buildNameTokens(secondValue);

  if (firstTokens.length === 0 || secondTokens.length === 0) {
    return false;
  }

  return firstTokens.some((token) => secondTokens.includes(token));
}

export function hasItemsOverlap(firstValue: string | null | undefined, secondValue: string | null | undefined) {
  const firstText = normalizeName(firstValue);
  const secondText = normalizeName(secondValue);

  if (!firstText || !secondText) {
    return false;
  }

  return (
    firstText.includes(secondText.slice(0, Math.min(secondText.length, 12))) ||
    secondText.includes(firstText.slice(0, Math.min(firstText.length, 12)))
  );
}

export function getBillDateTimestamp(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function deriveMemoReviewLabel(row: SalesTruthReviewRow): MemoReviewLabel {
  if (isCancelledRow(row)) {
    return "cancelled_signal_review_only";
  }

  const paymentDescription = normalizeText(row.payment_description);
  const orderType = normalizeText(row.order_type);
  const subOrderType = normalizeText(row.sub_order_type);

  if (
    orderType.includes("advance") ||
    subOrderType.includes("advance") ||
    paymentDescription.includes("advance") ||
    paymentDescription.includes("token")
  ) {
    return "possible_advance_receipt";
  }

  if (Number(row.effective_total ?? 0) > 0 || Number(row.grand_total ?? 0) > 0) {
    return "possible_later_sale_candidates";
  }

  if (!row.customer_name && !row.customer_phone && !row.items_text) {
    return "limited_context_memo";
  }

  return "unclear_memo";
}

export function getMemoReviewLabelText(label: MemoReviewLabel) {
  if (label === "cancelled_signal_review_only") {
    return "cancelled signal, review only";
  }

  if (label === "possible_advance_receipt") {
    return "possible advance receipt";
  }

  if (label === "possible_later_sale_candidates") {
    return "possible later numeric candidates";
  }

  if (label === "limited_context_memo") {
    return "limited memo context";
  }

  return "unclear memo";
}

export function getSuggestedInterpretationText(label: SuggestedInterpretation) {
  if (label === "normal_sale_candidate") {
    return "numeric sale candidate";
  }

  if (label === "advance_order_candidate") {
    return "advance-style review candidate";
  }

  if (label === "non_sale_complimentary") {
    return "complimentary review";
  }

  if (label === "sales_return_candidate") {
    return "sales return review";
  }

  if (label === "cancelled_candidate") {
    return "cancelled signal review";
  }

  if (label === "split_payment_child") {
    return "payment split child review";
  }

  return "unclear review needed";
}

export function getSalesPolicyBucketText(bucket: SalesPolicyBucket) {
  if (bucket === "net_sale_candidate") {
    return "net sale candidate (read-only)";
  }

  if (bucket === "excluded_cancelled") {
    return "excluded cancelled";
  }

  if (bucket === "excluded_complimentary") {
    return "excluded complimentary";
  }

  if (bucket === "excluded_sales_return") {
    return "excluded sales return";
  }

  if (bucket === "unresolved_memo") {
    return "unresolved memo";
  }

  return "unresolved other";
}

export function getMemoResolutionReviewNotes() {
  return [
    "Memo rows remain unresolved in the current business truth.",
    "Memo rows are excluded from live sales truth and from all live dashboard and profit totals.",
    "Later numeric candidates shown here are heuristic investigative hints only.",
    "A candidate hint does not mean the memo became a finalized sale.",
    "No memo-to-sale link is approved in the current business truth.",
    "Amount plus later bill date alone should be treated as weak evidence only.",
  ];
}

export function getMemoCandidateExplanationText(candidate: MemoMatchCandidate) {
  return candidate.reasons.join(", ");
}

export function buildMemoMatchCandidates(
  memoRow: SalesTruthReviewRow,
  numericRows: SalesTruthReviewRow[]
): MemoMatchCandidate[] {
  const memoTimestamp = getBillDateTimestamp(memoRow.bill_date);
  const memoAmount = getDisplayAmount(memoRow);

  return numericRows
    .filter((candidate) => getBillDateTimestamp(candidate.bill_date) >= memoTimestamp)
    .map((candidate) => {
      const reasons: string[] = [];
      let score = 0;
      let hasStrongIdentityEvidence = false;
      let hasMeaningfulCorroboration = false;

      const memoPhone = normalizeText(memoRow.customer_phone);
      const candidatePhone = normalizeText(candidate.customer_phone);
      const memoName = normalizeName(memoRow.customer_name);
      const candidateName = normalizeName(candidate.customer_name);
      const phoneAligned = Boolean(memoPhone && candidatePhone && memoPhone === candidatePhone);
      const phoneConflict = Boolean(memoPhone && candidatePhone && memoPhone !== candidatePhone);
      const nameOverlap = hasNameOverlap(memoRow.customer_name, candidate.customer_name);
      const nameConflict = Boolean(memoName && candidateName && !nameOverlap);
      const itemsOverlap = hasItemsOverlap(memoRow.items_text, candidate.items_text);

      if (phoneAligned) {
        score += 3;
        reasons.push("same customer phone");
        hasStrongIdentityEvidence = true;
        hasMeaningfulCorroboration = true;
      }

      if (nameOverlap) {
        score += 2;
        reasons.push("similar customer name");
        hasStrongIdentityEvidence = true;
        hasMeaningfulCorroboration = true;
      }

      const candidateAmount = getDisplayAmount(candidate);
      const amountDifference = Math.abs(memoAmount - candidateAmount);

      if (memoAmount > 0 && amountDifference <= 1) {
        score += 2;
        reasons.push("similar amount");
      } else if (memoAmount > 0 && amountDifference <= 50) {
        score += 1;
        reasons.push("close amount");
      }

      if (
        memoRow.bill_date &&
        candidate.bill_date &&
        getBillDateTimestamp(candidate.bill_date) > memoTimestamp
      ) {
        score += 1;
        reasons.push("later bill date");
      }

      if (itemsOverlap) {
        score += 2;
        reasons.push("similar item text");
        hasMeaningfulCorroboration = true;
      }

      if (phoneConflict) {
        score -= 2;
        reasons.push("customer phone does not align");
      }

      if (nameConflict) {
        score -= 1;
        reasons.push("customer name does not align");
      }

      let confidence: "high" | "medium" | "low" | null = null;

      if (
        hasStrongIdentityEvidence &&
        hasMeaningfulCorroboration &&
        score >= 6 &&
        !phoneConflict &&
        !nameConflict
      ) {
        confidence = "high";
      } else if (
        score >= 4 &&
        (hasStrongIdentityEvidence || hasMeaningfulCorroboration) &&
        !phoneConflict &&
        !nameConflict
      ) {
        confidence = "medium";
      } else if (score >= 2) {
        confidence = "low";
      }

      if (!confidence) {
        return null;
      }

      return {
        orderNo: candidate.order_no || "-",
        billDate: candidate.bill_date,
        customerName: candidate.customer_name,
        customerPhone: candidate.customer_phone,
        effectiveTotal: candidate.effective_total,
        itemsSummary: getItemsSummary(candidate.items_text),
        confidence,
        reasons,
      };
    })
    .filter((candidate): candidate is MemoMatchCandidate => candidate !== null)
    .sort((first, second) => {
      const confidenceOrder = { high: 3, medium: 2, low: 1 };
      const scoreDifference = confidenceOrder[second.confidence] - confidenceOrder[first.confidence];

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      return getBillDateTimestamp(second.billDate) - getBillDateTimestamp(first.billDate);
    })
    .slice(0, 5);
}

export function getSalesPolicyBucket(
  row: SalesTruthReviewRow,
  transactionFamily: OrderTransactionFamily
): SalesPolicyBucket {
  const orderNo = String(row.order_no ?? "").trim();
  const isNumericOrder = /^\d+$/.test(orderNo);

  if (transactionFamily === "memo_special") {
    return "unresolved_memo";
  }

  if (transactionFamily === "complimentary") {
    return "excluded_complimentary";
  }

  if (transactionFamily === "sales_return") {
    return "excluded_sales_return";
  }

  if (isCancelledRow(row)) {
    return "excluded_cancelled";
  }

  if (isNumericOrder && transactionFamily !== "payment_split_child") {
    return "net_sale_candidate";
  }

  return "unresolved_other";
}
