"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import {
  OrderListingDiagnosticsPanel,
  type OrderListingDiagnostics,
} from "@/app/upload/sales/order-listing-diagnostics-panel";
import { supabase } from "@/lib/supabase";

type WorkbookRows = (string | number | boolean | Date | null)[][];

type SalesFormat = "petpooja_order_listing" | "petpooja_item_wise_report";
type OrderTransactionFamily =
  | "regular_order_main"
  | "advance_order_main"
  | "payment_split_child"
  | "memo_special"
  | "sales_return"
  | "complimentary"
  | "unknown_special";
type ComparisonKeyType = "numeric_order_key" | "non_comparable_special" | "payment_split_child";
type UploadClassification =
  | "exact_duplicate"
  | "append_only"
  | "gap_fill"
  | "overlap_unchanged"
  | "overlap_with_changes"
  | "manual_review_needed"
  | "rejected_unknown_format";

type OrderRowComparisonStatus =
  | "new_order"
  | "unchanged_existing_order"
  | "changed_existing_order";

type ItemRowComparisonStatus =
  | "new_item_row"
  | "unchanged_existing_item_row"
  | "changed_existing_item_row";

type DetectionResult =
  | {
      detectedFormat: SalesFormat;
      headerRowIndex: number;
      targetTable: "sales_order_imports" | "sales_item_imports";
    }
  | {
      detectedFormat: "unknown_sales_spreadsheet";
      headerRowIndex: null;
      targetTable: null;
      reason: string;
    };

type OrderListingImportRow = {
  order_no: string;
  client_order_id: string | null;
  order_type: string | null;
  sub_order_type: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  gstin: string | null;
  customer_address: string | null;
  delivery_boy: string | null;
  delivery_boy_number: string | null;
  items_text: string | null;
  item_count_estimate: number;
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
  status: string | null;
  created_text: string | null;
  order_created_at: string | null;
  bill_date: string | null;
  source_row_number: number;
  is_payment_split_row: boolean;
  parse_note: string | null;
  upload_log_id: number;
};

type ParsedOrderListingRow = OrderListingImportRow & {
  __transactionFamily: OrderTransactionFamily;
  __comparisonKeyType: ComparisonKeyType;
  __isCancelled: boolean;
  __isAdvanceOrder: boolean;
};

type ItemWiseImportRow = {
  invoice_no: string;
  item_date: string | null;
  item_timestamp_text: string | null;
  item_timestamp: string | null;
  item_name: string;
  price: number | null;
  qty: number | null;
  sub_total: number | null;
  discount: number | null;
  tax: number | null;
  final_total: number | null;
  table_no: string | null;
  server_name: string | null;
  covers: number | null;
  variation: string | null;
  category: string | null;
  hsn: string | null;
  source_row_number: number;
  parse_note: string | null;
  upload_log_id: number;
};

type ParseResult<T> = {
  rows: T[];
  parsedRowCount: number;
  insertedRowCount: number;
  rejectedRowCount: number;
};

type ExistingOrderListingRow = Pick<
  OrderListingImportRow,
  | "order_no"
  | "bill_date"
  | "client_order_id"
  | "order_type"
  | "sub_order_type"
  | "customer_name"
  | "customer_phone"
  | "gstin"
  | "customer_address"
  | "delivery_boy"
  | "delivery_boy_number"
  | "items_text"
  | "item_count_estimate"
  | "my_amount"
  | "total_discount"
  | "delivery_charge"
  | "container_charge"
  | "total_tax"
  | "round_off"
  | "grand_total"
  | "effective_total"
  | "payment_type"
  | "payment_description"
  | "status"
  | "created_text"
  | "order_created_at"
  | "is_payment_split_row"
> & {
  id: number;
};

type ExistingItemWiseRow = Pick<
  ItemWiseImportRow,
  | "invoice_no"
  | "item_date"
  | "item_timestamp_text"
  | "item_timestamp"
  | "item_name"
  | "price"
  | "qty"
  | "sub_total"
  | "discount"
  | "tax"
  | "final_total"
  | "table_no"
  | "server_name"
  | "covers"
  | "variation"
  | "category"
  | "hsn"
> & {
  id: number;
};

type DateOnlyRow = {
  id: number;
  bill_date?: string | null;
  item_date?: string | null;
};

type ClassificationResult<T> = {
  classification: UploadClassification;
  insertableRows: T[];
  insertedRowCount: number;
  rejectedRowCount: number;
  message: string;
  orderListingDiagnostics?: OrderListingDiagnostics;
};

type ChangeReasonTag =
  | "status_changed"
  | "cancelled_flag_changed"
  | "payment_changed"
  | "amount_changed"
  | "charge_breakup_changed"
  | "customer_changed"
  | "order_meta_changed"
  | "unclear_change";

type ChangedOverlapFieldDiff = {
  fieldName: string;
  existingValue: string;
  incomingValue: string;
};

type ChangedOverlapReviewItem = {
  orderNo: string;
  incomingBillDate: string | null;
  existingBillDate: string | null;
  changedFieldNames: string[];
  reasonTags: ChangeReasonTag[];
  fieldDiffs: ChangedOverlapFieldDiff[];
};

type ChangedOverlapSummaryCounts = {
  changedStatusRows: number;
  changedPaymentRows: number;
  changedAmountRows: number;
  changedCancellationRows: number;
  changedCustomerMetaRows: number;
};

const ORDER_LISTING_REQUIRED_HEADERS = ["orderno", "items", "created"];
const ITEM_WISE_REQUIRED_HEADERS = ["invoiceno", "itemname", "qty", "finaltotal"];
const BATCH_SIZE = 1000;

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function toCellText(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value).trim();
}

function isNonEmptyRow(row: unknown[]) {
  return row.some((cell) => toCellText(cell) !== "");
}

function safeParseNumber(value: unknown) {
  const text = String(value ?? "")
    .replace(/,/g, "")
    .replace(/[^0-9.\-]/g, "")
    .trim();

  if (!text) {
    return null;
  }

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function countItemsFromText(itemsText: string) {
  if (!itemsText.trim()) {
    return 0;
  }

  return itemsText
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean).length;
}

function extractTotalFromPaymentText(paymentDescription: string) {
  const match = paymentDescription.match(/total\s*:\s*([0-9.,]+)/i);

  if (!match) {
    return null;
  }

  return safeParseNumber(match[1]);
}

function isNumericOrderNo(orderNo: string) {
  return /^\d+$/.test(orderNo.trim());
}

function isCancelledStatus(status: string | null) {
  return normalizeComparableText(status).includes("cancel");
}

function isMemoOrderNo(orderNo: string) {
  return normalizeComparableText(orderNo) === "memo";
}

function isSalesReturnOrderNo(orderNo: string) {
  return /^sr/i.test(orderNo.trim());
}

function isComplimentaryOrderNo(orderNo: string) {
  return /^c/i.test(orderNo.trim());
}

function normalizeComparableText(value: unknown) {
  const text = toCellText(value);
  return text ? text.toLowerCase() : "";
}

function normalizeComparableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Number(parsed.toFixed(2));
}

function chunkArray<T>(items: T[], chunkSize: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

async function fetchAllRows<T>(
  loadBatch: (from: number, to: number) => Promise<{ data: T[] | null; error: unknown | null }>
) {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const to = from + BATCH_SIZE - 1;
    const { data, error } = await loadBatch(from, to);

    if (error) {
      throw error;
    }

    const batchRows = data ?? [];
    rows.push(...batchRows);

    if (batchRows.length < BATCH_SIZE) {
      break;
    }

    from += BATCH_SIZE;
  }

  return rows;
}

function toComparableDateTimestamp(value: string | null | undefined) {
  const parsedDate = parseBestEffortDate(value);

  if (!parsedDate) {
    return null;
  }

  const timestamp = new Date(parsedDate).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function getDateRange(values: Array<string | null | undefined>) {
  const timestamps = values
    .map((value) => toComparableDateTimestamp(value))
    .filter((value): value is number => value !== null);

  if (timestamps.length === 0) {
    return null;
  }

  return {
    min: Math.min(...timestamps),
    max: Math.max(...timestamps),
  };
}

function doDateRangesOverlap(
  firstRange: { min: number; max: number } | null,
  secondRange: { min: number; max: number } | null
) {
  if (!firstRange || !secondRange) {
    return false;
  }

  return firstRange.min <= secondRange.max && secondRange.min <= firstRange.max;
}

function buildOrderRowKey(row: Pick<OrderListingImportRow, "order_no">) {
  return normalizeComparableText(row.order_no);
}

function buildItemRowKey(row: Pick<ItemWiseImportRow, "invoice_no" | "item_name">) {
  return `${normalizeComparableText(row.invoice_no)}::${normalizeComparableText(row.item_name)}`;
}

function buildOrderRowSignature(
  row: Pick<
    OrderListingImportRow,
    | "order_no"
    | "client_order_id"
    | "order_type"
    | "sub_order_type"
    | "customer_name"
    | "customer_phone"
    | "gstin"
    | "customer_address"
    | "delivery_boy"
    | "delivery_boy_number"
    | "items_text"
    | "item_count_estimate"
    | "my_amount"
    | "total_discount"
    | "delivery_charge"
    | "container_charge"
    | "total_tax"
    | "round_off"
    | "grand_total"
    | "effective_total"
    | "payment_type"
    | "payment_description"
    | "status"
    | "created_text"
    | "order_created_at"
    | "bill_date"
  >
) {
  return JSON.stringify({
    order_no: normalizeComparableText(row.order_no),
    client_order_id: normalizeComparableText(row.client_order_id),
    order_type: normalizeComparableText(row.order_type),
    sub_order_type: normalizeComparableText(row.sub_order_type),
    customer_name: normalizeComparableText(row.customer_name),
    customer_phone: normalizeComparableText(row.customer_phone),
    gstin: normalizeComparableText(row.gstin),
    customer_address: normalizeComparableText(row.customer_address),
    delivery_boy: normalizeComparableText(row.delivery_boy),
    delivery_boy_number: normalizeComparableText(row.delivery_boy_number),
    items_text: normalizeComparableText(row.items_text),
    item_count_estimate: normalizeComparableNumber(row.item_count_estimate),
    my_amount: normalizeComparableNumber(row.my_amount),
    total_discount: normalizeComparableNumber(row.total_discount),
    delivery_charge: normalizeComparableNumber(row.delivery_charge),
    container_charge: normalizeComparableNumber(row.container_charge),
    total_tax: normalizeComparableNumber(row.total_tax),
    round_off: normalizeComparableNumber(row.round_off),
    grand_total: normalizeComparableNumber(row.grand_total),
    effective_total: normalizeComparableNumber(row.effective_total),
    payment_type: normalizeComparableText(row.payment_type),
    payment_description: normalizeComparableText(row.payment_description),
    status: normalizeComparableText(row.status),
    created_text: normalizeComparableText(row.created_text),
    order_created_at: normalizeComparableText(row.order_created_at),
    bill_date: normalizeComparableText(row.bill_date),
  });
}

function buildItemRowSignature(
  row: Pick<
    ItemWiseImportRow,
    | "invoice_no"
    | "item_date"
    | "item_timestamp_text"
    | "item_timestamp"
    | "item_name"
    | "price"
    | "qty"
    | "sub_total"
    | "discount"
    | "tax"
    | "final_total"
    | "table_no"
    | "server_name"
    | "covers"
    | "variation"
    | "category"
    | "hsn"
  >
) {
  return JSON.stringify({
    invoice_no: normalizeComparableText(row.invoice_no),
    item_date: normalizeComparableText(row.item_date),
    item_timestamp_text: normalizeComparableText(row.item_timestamp_text),
    item_timestamp: normalizeComparableText(row.item_timestamp),
    item_name: normalizeComparableText(row.item_name),
    price: normalizeComparableNumber(row.price),
    qty: normalizeComparableNumber(row.qty),
    sub_total: normalizeComparableNumber(row.sub_total),
    discount: normalizeComparableNumber(row.discount),
    tax: normalizeComparableNumber(row.tax),
    final_total: normalizeComparableNumber(row.final_total),
    table_no: normalizeComparableText(row.table_no),
    server_name: normalizeComparableText(row.server_name),
    covers: normalizeComparableNumber(row.covers),
    variation: normalizeComparableText(row.variation),
    category: normalizeComparableText(row.category),
    hsn: normalizeComparableText(row.hsn),
  });
}

function hasDuplicateKeys(keys: string[]) {
  const seen = new Set<string>();

  for (const key of keys) {
    if (!key) {
      return true;
    }

    if (seen.has(key)) {
      return true;
    }

    seen.add(key);
  }

  return false;
}

function getSortedBillDates(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value)).sort();
}

function buildOrderListingDiagnostics(input: {
  finalClassification: UploadClassification;
  totalParsedRows: number;
  incomingDistinctOrderCount: number;
  duplicateIncomingOrderCount: number;
  newOrderCount: number;
  unchangedExistingOrderCount: number;
  changedExistingOrderCount: number;
  hasOverlappingExistingOrderValues: boolean;
  billDates: Array<string | null | undefined>;
  finalDecisionReason: string;
  suspiciousOrders?: OrderListingDiagnosticItem[];
  typeCounts: OrderListingTypeCounts;
  changedOverlapSummary?: ChangedOverlapSummaryCounts;
  changedOverlapReviews?: ChangedOverlapReviewItem[];
}): OrderListingDiagnostics {
  const sortedBillDates = getSortedBillDates(input.billDates);

  return {
    detectedFormat: "petpooja_order_listing",
    finalClassification: input.finalClassification,
    totalParsedRows: input.totalParsedRows,
    incomingDistinctOrderCount: input.incomingDistinctOrderCount,
    duplicateIncomingOrderCount: input.duplicateIncomingOrderCount,
    newOrderCount: input.newOrderCount,
    unchangedExistingOrderCount: input.unchangedExistingOrderCount,
    changedExistingOrderCount: input.changedExistingOrderCount,
    minBillDate: sortedBillDates[0] ?? null,
    maxBillDate: sortedBillDates[sortedBillDates.length - 1] ?? null,
    hasOverlappingExistingOrderValues: input.hasOverlappingExistingOrderValues,
    finalDecisionReason: input.finalDecisionReason,
    suspiciousOrders: input.suspiciousOrders ?? [],
    typeCounts: input.typeCounts,
    changedOverlapSummary: input.changedOverlapSummary ?? getEmptyChangedOverlapSummaryCounts(),
    changedOverlapReviews: input.changedOverlapReviews ?? [],
  };
}

function getEmptyOrderListingTypeCounts(): OrderListingTypeCounts {
  return {
    regularOrderMainCount: 0,
    advanceOrderMainCount: 0,
    paymentSplitChildCount: 0,
    memoSpecialCount: 0,
    salesReturnCount: 0,
    complimentaryCount: 0,
    unknownSpecialCount: 0,
    cancelledRowsCount: 0,
  };
}

function getEmptyChangedOverlapSummaryCounts(): ChangedOverlapSummaryCounts {
  return {
    changedStatusRows: 0,
    changedPaymentRows: 0,
    changedAmountRows: 0,
    changedCancellationRows: 0,
    changedCustomerMetaRows: 0,
  };
}

function formatDiagnosticValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "number") {
    return String(Number(value.toFixed(2)));
  }

  return toCellText(value);
}

function buildItemsSummary(itemsText: string | null | undefined) {
  const text = toCellText(itemsText);

  if (!text) {
    return "-";
  }

  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

function addReasonTag(tags: ChangeReasonTag[], tag: ChangeReasonTag) {
  if (!tags.includes(tag)) {
    tags.push(tag);
  }
}

function buildChangedOverlapReview(
  incomingRow: ParsedOrderListingRow,
  existingRow: ExistingOrderListingRow
): ChangedOverlapReviewItem {
  const fieldDiffs: ChangedOverlapFieldDiff[] = [];
  const reasonTags: ChangeReasonTag[] = [];

  const addFieldDiff = (
    fieldName: string,
    existingValue: unknown,
    incomingValue: unknown,
    reasonTag: ChangeReasonTag
  ) => {
    const normalizedExisting =
      typeof existingValue === "number"
        ? normalizeComparableNumber(existingValue)
        : normalizeComparableText(existingValue);
    const normalizedIncoming =
      typeof incomingValue === "number"
        ? normalizeComparableNumber(incomingValue)
        : normalizeComparableText(incomingValue);

    if (normalizedExisting === normalizedIncoming) {
      return;
    }

    fieldDiffs.push({
      fieldName,
      existingValue: formatDiagnosticValue(existingValue),
      incomingValue: formatDiagnosticValue(incomingValue),
    });
    addReasonTag(reasonTags, reasonTag);
  };

  addFieldDiff("status", existingRow.status, incomingRow.status, "status_changed");
  addFieldDiff("payment_type", existingRow.payment_type, incomingRow.payment_type, "payment_changed");
  addFieldDiff(
    "payment_description",
    existingRow.payment_description,
    incomingRow.payment_description,
    "payment_changed"
  );
  addFieldDiff("grand_total", existingRow.grand_total, incomingRow.grand_total, "amount_changed");
  addFieldDiff(
    "effective_total",
    existingRow.effective_total,
    incomingRow.effective_total,
    "amount_changed"
  );
  addFieldDiff("my_amount", existingRow.my_amount, incomingRow.my_amount, "amount_changed");
  addFieldDiff(
    "total_discount",
    existingRow.total_discount,
    incomingRow.total_discount,
    "charge_breakup_changed"
  );
  addFieldDiff(
    "delivery_charge",
    existingRow.delivery_charge,
    incomingRow.delivery_charge,
    "charge_breakup_changed"
  );
  addFieldDiff(
    "container_charge",
    existingRow.container_charge,
    incomingRow.container_charge,
    "charge_breakup_changed"
  );
  addFieldDiff("total_tax", existingRow.total_tax, incomingRow.total_tax, "charge_breakup_changed");
  addFieldDiff("round_off", existingRow.round_off, incomingRow.round_off, "charge_breakup_changed");
  addFieldDiff(
    "customer_name",
    existingRow.customer_name,
    incomingRow.customer_name,
    "customer_changed"
  );
  addFieldDiff(
    "customer_phone",
    existingRow.customer_phone,
    incomingRow.customer_phone,
    "customer_changed"
  );
  addFieldDiff("order_type", existingRow.order_type, incomingRow.order_type, "order_meta_changed");
  addFieldDiff(
    "sub_order_type",
    existingRow.sub_order_type,
    incomingRow.sub_order_type,
    "order_meta_changed"
  );
  addFieldDiff(
    "items_summary",
    buildItemsSummary(existingRow.items_text),
    buildItemsSummary(incomingRow.items_text),
    "order_meta_changed"
  );

  if (isCancelledStatus(existingRow.status) !== incomingRow.__isCancelled) {
    fieldDiffs.push({
      fieldName: "cancelled_flag",
      existingValue: isCancelledStatus(existingRow.status) ? "yes" : "no",
      incomingValue: incomingRow.__isCancelled ? "yes" : "no",
    });
    addReasonTag(reasonTags, "cancelled_flag_changed");
  }

  if (reasonTags.length === 0) {
    addReasonTag(reasonTags, "unclear_change");
  }

  return {
    orderNo: incomingRow.order_no,
    incomingBillDate: incomingRow.bill_date,
    existingBillDate: existingRow.bill_date ?? null,
    changedFieldNames: fieldDiffs.map((field) => field.fieldName),
    reasonTags,
    fieldDiffs,
  };
}

function buildChangedOverlapSummaryCounts(reviews: ChangedOverlapReviewItem[]) {
  const summary = getEmptyChangedOverlapSummaryCounts();

  reviews.forEach((review) => {
    if (review.reasonTags.includes("status_changed")) {
      summary.changedStatusRows += 1;
    }

    if (review.reasonTags.includes("payment_changed")) {
      summary.changedPaymentRows += 1;
    }

    if (review.reasonTags.includes("amount_changed") || review.reasonTags.includes("charge_breakup_changed")) {
      summary.changedAmountRows += 1;
    }

    if (review.reasonTags.includes("cancelled_flag_changed")) {
      summary.changedCancellationRows += 1;
    }

    if (
      review.reasonTags.includes("customer_changed") ||
      review.reasonTags.includes("order_meta_changed") ||
      review.reasonTags.includes("unclear_change")
    ) {
      summary.changedCustomerMetaRows += 1;
    }
  });

  return summary;
}

function classifyParsedOrderListingRow(
  row: Pick<
    OrderListingImportRow,
    | "order_no"
    | "order_type"
    | "sub_order_type"
    | "customer_name"
    | "customer_phone"
    | "customer_address"
    | "delivery_boy"
    | "status"
    | "items_text"
    | "created_text"
    | "grand_total"
    | "payment_type"
    | "payment_description"
  >
) {
  const orderNo = row.order_no.trim();
  const isCancelled = isCancelledStatus(row.status);
  const hasMainDetails = Boolean(
    normalizeComparableText(row.items_text) ||
      normalizeComparableText(row.created_text) ||
      normalizeComparableText(row.order_type) ||
      normalizeComparableText(row.sub_order_type) ||
      normalizeComparableText(row.customer_name) ||
      normalizeComparableText(row.customer_phone) ||
      normalizeComparableText(row.customer_address) ||
      normalizeComparableText(row.delivery_boy) ||
      normalizeComparableText(row.status)
  );
  const paymentDescription = normalizeComparableText(row.payment_description);
  const paymentType = normalizeComparableText(row.payment_type);
  const isPaymentSplitChild = !hasMainDetails;
  const hasAdvanceSignals =
    paymentDescription.includes("advance") ||
    paymentDescription.includes("due") ||
    paymentType.includes("advance") ||
    paymentType.includes("due") ||
    ((row.grand_total ?? 0) === 0 && extractTotalFromPaymentText(row.payment_description ?? "") !== null);

  let transactionFamily: OrderTransactionFamily;
  let comparisonKeyType: ComparisonKeyType;

  if (isPaymentSplitChild) {
    transactionFamily = "payment_split_child";
    comparisonKeyType = "payment_split_child";
  } else if (isMemoOrderNo(orderNo)) {
    transactionFamily = "memo_special";
    comparisonKeyType = "non_comparable_special";
  } else if (isSalesReturnOrderNo(orderNo)) {
    transactionFamily = "sales_return";
    comparisonKeyType = "non_comparable_special";
  } else if (isComplimentaryOrderNo(orderNo)) {
    transactionFamily = "complimentary";
    comparisonKeyType = "non_comparable_special";
  } else if (isNumericOrderNo(orderNo)) {
    transactionFamily = hasAdvanceSignals ? "advance_order_main" : "regular_order_main";
    comparisonKeyType = "numeric_order_key";
  } else {
    transactionFamily = "unknown_special";
    comparisonKeyType = "non_comparable_special";
  }

  return {
    transactionFamily,
    comparisonKeyType,
    isCancelled,
    isAdvanceOrder: transactionFamily === "advance_order_main",
  };
}

function incrementOrderListingTypeCounts(
  counts: OrderListingTypeCounts,
  transactionFamily: OrderTransactionFamily,
  isCancelled: boolean
) {
  if (transactionFamily === "regular_order_main") {
    counts.regularOrderMainCount += 1;
  } else if (transactionFamily === "advance_order_main") {
    counts.advanceOrderMainCount += 1;
  } else if (transactionFamily === "payment_split_child") {
    counts.paymentSplitChildCount += 1;
  } else if (transactionFamily === "memo_special") {
    counts.memoSpecialCount += 1;
  } else if (transactionFamily === "sales_return") {
    counts.salesReturnCount += 1;
  } else if (transactionFamily === "complimentary") {
    counts.complimentaryCount += 1;
  } else {
    counts.unknownSpecialCount += 1;
  }

  if (isCancelled) {
    counts.cancelledRowsCount += 1;
  }
}

function buildOrderParseNote(input: {
  transactionFamily: OrderTransactionFamily;
  comparisonKeyType: ComparisonKeyType;
  isCancelled: boolean;
  isAdvanceOrder: boolean;
}) {
  return [
    `transaction_family=${input.transactionFamily}`,
    `comparison_key_type=${input.comparisonKeyType}`,
    `is_cancelled=${input.isCancelled ? "yes" : "no"}`,
    `is_advance_order=${input.isAdvanceOrder ? "yes" : "no"}`,
  ].join(" | ");
}

function isComparableOrderListingRow(row: ParsedOrderListingRow) {
  return row.__comparisonKeyType === "numeric_order_key";
}

function stripOrderListingRowForInsert(row: ParsedOrderListingRow): OrderListingImportRow {
  return {
    order_no: row.order_no,
    client_order_id: row.client_order_id,
    order_type: row.order_type,
    sub_order_type: row.sub_order_type,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    gstin: row.gstin,
    customer_address: row.customer_address,
    delivery_boy: row.delivery_boy,
    delivery_boy_number: row.delivery_boy_number,
    items_text: row.items_text,
    item_count_estimate: row.item_count_estimate,
    my_amount: row.my_amount,
    total_discount: row.total_discount,
    delivery_charge: row.delivery_charge,
    container_charge: row.container_charge,
    total_tax: row.total_tax,
    round_off: row.round_off,
    grand_total: row.grand_total,
    effective_total: row.effective_total,
    payment_type: row.payment_type,
    payment_description: row.payment_description,
    status: row.status,
    created_text: row.created_text,
    order_created_at: row.order_created_at,
    bill_date: row.bill_date,
    source_row_number: row.source_row_number,
    is_payment_split_row: row.is_payment_split_row,
    parse_note: row.parse_note,
    upload_log_id: row.upload_log_id,
  };
}

async function hasImportedUploadWithSameHash(
  contentHash: string | null,
  detectedFormat: SalesFormat,
  targetTable: "sales_order_imports" | "sales_item_imports",
  currentUploadLogId: number
) {
  if (!contentHash) {
    return false;
  }

  const { data, error } = await supabase
    .from("uploads_log")
    .select("id")
    .eq("kind", "sales")
    .eq("detected_format", detectedFormat)
    .eq("target_table", targetTable)
    .eq("content_hash", contentHash)
    .eq("ingest_status", "imported")
    .neq("id", currentUploadLogId)
    .limit(1);

  if (error) {
    throw error;
  }

  return (data ?? []).length > 0;
}

async function fetchExistingOrderRows(orderNos: string[]) {
  const rows: ExistingOrderListingRow[] = [];

  for (const batch of chunkArray(orderNos, 200)) {
    const { data, error } = await supabase
      .schema("public")
      .from("sales_order_imports")
      .select(
        "id, order_no, bill_date, client_order_id, order_type, sub_order_type, customer_name, customer_phone, gstin, customer_address, delivery_boy, delivery_boy_number, items_text, item_count_estimate, my_amount, total_discount, delivery_charge, container_charge, total_tax, round_off, grand_total, effective_total, payment_type, payment_description, status, created_text, order_created_at, is_payment_split_row"
      )
      .in("order_no", batch);

    if (error) {
      throw error;
    }

    rows.push(...((data ?? []) as ExistingOrderListingRow[]));
  }

  return rows;
}

async function fetchExistingItemRows(invoiceNos: string[]) {
  const rows: ExistingItemWiseRow[] = [];

  for (const batch of chunkArray(invoiceNos, 200)) {
    const { data, error } = await supabase
      .schema("public")
      .from("sales_item_imports")
      .select(
        "id, invoice_no, item_date, item_timestamp_text, item_timestamp, item_name, price, qty, sub_total, discount, tax, final_total, table_no, server_name, covers, variation, category, hsn"
      )
      .in("invoice_no", batch);

    if (error) {
      throw error;
    }

    rows.push(...((data ?? []) as ExistingItemWiseRow[]));
  }

  return rows;
}

async function fetchExistingOrderDateRange() {
  const rows = await fetchAllRows<DateOnlyRow>(async (from, to) => {
    return supabase
      .schema("public")
      .from("sales_order_imports")
      .select("id, bill_date")
      .eq("is_payment_split_row", false)
      .order("id", { ascending: true })
      .range(from, to);
  });

  return getDateRange(rows.map((row) => row.bill_date ?? null));
}

async function fetchExistingItemDateRange() {
  const rows = await fetchAllRows<DateOnlyRow>(async (from, to) => {
    return supabase
      .schema("public")
      .from("sales_item_imports")
      .select("id, item_date")
      .order("id", { ascending: true })
      .range(from, to);
  });

  return getDateRange(rows.map((row) => row.item_date ?? null));
}

async function classifyOrderListingUpload(
  rows: ParsedOrderListingRow[],
  contentHash: string | null,
  currentUploadLogId: number
): Promise<ClassificationResult<ParsedOrderListingRow>> {
  const comparableRows = rows.filter(isComparableOrderListingRow);
  const typeCounts = rows.reduce((counts, row) => {
    incrementOrderListingTypeCounts(counts, row.__transactionFamily, row.__isCancelled);
    return counts;
  }, getEmptyOrderListingTypeCounts());
  const incomingKeys = comparableRows.map((row) => buildOrderRowKey(row));
  const incomingKeyCounts = new Map<string, number>();
  const firstOrderNoByKey = new Map<string, string>();

  incomingKeys.forEach((key, index) => {
    incomingKeyCounts.set(key, (incomingKeyCounts.get(key) ?? 0) + 1);

    if (!firstOrderNoByKey.has(key)) {
      firstOrderNoByKey.set(key, comparableRows[index].order_no);
    }
  });

  const duplicateIncomingKeys = Array.from(incomingKeyCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([key]) => key);
  const baseDiagnostics = {
    totalParsedRows: rows.length,
    incomingDistinctOrderCount: new Set(rows.map((row) => normalizeComparableText(row.order_no))).size,
    duplicateIncomingOrderCount: duplicateIncomingKeys.length,
    billDates: rows.map((row) => row.bill_date),
    typeCounts,
  };

  if (rows.length === 0) {
    const finalDecisionReason =
      "Blocked because no parsed order rows were available for overlap classification.";

    return {
      classification: "manual_review_needed",
      insertableRows: [],
      insertedRowCount: 0,
      rejectedRowCount: 0,
      message: finalDecisionReason,
      orderListingDiagnostics: buildOrderListingDiagnostics({
        ...baseDiagnostics,
        finalClassification: "manual_review_needed",
        newOrderCount: 0,
        unchangedExistingOrderCount: 0,
        changedExistingOrderCount: 0,
        hasOverlappingExistingOrderValues: false,
        finalDecisionReason,
        typeCounts,
      }),
    };
  }

  if (
    await hasImportedUploadWithSameHash(
      contentHash,
      "petpooja_order_listing",
      "sales_order_imports",
      currentUploadLogId
    )
  ) {
    const finalDecisionReason =
      "Blocked because this Order Listing file already matches a previously imported file.";

    return {
      classification: "exact_duplicate",
      insertableRows: [],
      insertedRowCount: 0,
      rejectedRowCount: rows.length,
      message: `Classification: exact_duplicate. ${finalDecisionReason}`,
      orderListingDiagnostics: buildOrderListingDiagnostics({
        ...baseDiagnostics,
        finalClassification: "exact_duplicate",
        newOrderCount: 0,
        unchangedExistingOrderCount: comparableRows.length,
        changedExistingOrderCount: 0,
        hasOverlappingExistingOrderValues: comparableRows.length > 0,
        finalDecisionReason,
        typeCounts,
      }),
    };
  }

  if (hasDuplicateKeys(incomingKeys)) {
    const suspiciousOrders = duplicateIncomingKeys.slice(0, 20).map((key) => ({
      orderNo: firstOrderNoByKey.get(key) ?? key,
      reason: "duplicate_in_incoming_file" as const,
    }));
    const finalDecisionReason = `Blocked because the incoming file contains ${duplicateIncomingKeys.length} duplicate order_no value(s) inside the file.`;

    return {
      classification: "manual_review_needed",
      insertableRows: [],
      insertedRowCount: 0,
      rejectedRowCount: rows.length,
      message: `Classification: manual_review_needed. ${finalDecisionReason}`,
      orderListingDiagnostics: buildOrderListingDiagnostics({
        ...baseDiagnostics,
        finalClassification: "manual_review_needed",
        newOrderCount: 0,
        unchangedExistingOrderCount: 0,
        changedExistingOrderCount: 0,
        hasOverlappingExistingOrderValues: false,
        finalDecisionReason,
        suspiciousOrders,
        typeCounts,
      }),
    };
  }

  if (comparableRows.length === 0) {
    const finalDecisionReason =
      "Allowed because this file contains only special or non-comparable Order Listing transactions, so Titan will record them without normal numeric-key overlap comparison.";

    return {
      classification: "append_only",
      insertableRows: rows,
      insertedRowCount: rows.length,
      rejectedRowCount: 0,
      message: `Classification: append_only. ${finalDecisionReason}`,
      orderListingDiagnostics: buildOrderListingDiagnostics({
        ...baseDiagnostics,
        finalClassification: "append_only",
        newOrderCount: 0,
        unchangedExistingOrderCount: 0,
        changedExistingOrderCount: 0,
        hasOverlappingExistingOrderValues: false,
        finalDecisionReason,
        typeCounts,
      }),
    };
  }

  const existingRows = await fetchExistingOrderRows(comparableRows.map((row) => row.order_no));
  const existingRowMap = new Map<string, ExistingOrderListingRow>();
  const duplicateExistingKeys = new Set<string>();

  for (const existingRow of existingRows) {
    if (existingRow.is_payment_split_row) {
      continue;
    }

    const key = buildOrderRowKey(existingRow);

    if (existingRowMap.has(key)) {
      duplicateExistingKeys.add(key);
      continue;
    }

    existingRowMap.set(key, existingRow);
  }

  if (duplicateExistingKeys.size > 0) {
    const suspiciousOrders = Array.from(duplicateExistingKeys)
      .slice(0, 20)
      .map((key) => ({
        orderNo: existingRowMap.get(key)?.order_no ?? key,
        reason: "unclear_key_state" as const,
      }));
    const finalDecisionReason = `Blocked because existing order-level data already contains duplicate order_no values for ${duplicateExistingKeys.size} overlapping order key(s).`;

    return {
      classification: "manual_review_needed",
      insertableRows: [],
      insertedRowCount: 0,
      rejectedRowCount: rows.length,
      message: `Classification: manual_review_needed. ${finalDecisionReason}`,
      orderListingDiagnostics: buildOrderListingDiagnostics({
        ...baseDiagnostics,
        finalClassification: "manual_review_needed",
        newOrderCount: 0,
        unchangedExistingOrderCount: 0,
        changedExistingOrderCount: 0,
        hasOverlappingExistingOrderValues: true,
        finalDecisionReason,
        suspiciousOrders,
        typeCounts,
      }),
    };
  }

  let newCount = 0;
  let unchangedCount = 0;
  let changedCount = 0;
  const insertableRows: ParsedOrderListingRow[] = rows.filter(
    (row) => row.__comparisonKeyType === "non_comparable_special"
  );

  comparableRows.forEach((row) => {
    const key = buildOrderRowKey(row);
    const existingRow = existingRowMap.get(key);
    let rowStatus: OrderRowComparisonStatus;

    if (!existingRow) {
      rowStatus = "new_order";
    } else if (buildOrderRowSignature(row) === buildOrderRowSignature(existingRow)) {
      rowStatus = "unchanged_existing_order";
    } else {
      rowStatus = "changed_existing_order";
    }

    if (rowStatus === "new_order") {
      newCount += 1;
      insertableRows.push(row);
    } else if (rowStatus === "unchanged_existing_order") {
      unchangedCount += 1;
    } else {
      changedCount += 1;
    }
  });

  if (changedCount > 0) {
    const changedRows = comparableRows.filter((row) => {
      const key = buildOrderRowKey(row);
      const existingRow = existingRowMap.get(key);
      return Boolean(existingRow && buildOrderRowSignature(row) !== buildOrderRowSignature(existingRow));
    });
    const suspiciousOrders = changedRows.slice(0, 20).map((row) => ({
      orderNo: row.order_no,
      reason: "changed_existing_order" as const,
    }));
    const changedOverlapReviews = changedRows.slice(0, 50).flatMap((row) => {
      const existingRow = existingRowMap.get(buildOrderRowKey(row));

      if (!existingRow) {
        return [];
      }

      return [buildChangedOverlapReview(row, existingRow)];
    });
    const changedOverlapSummary = buildChangedOverlapSummaryCounts(changedOverlapReviews);
    const topReasonTags = Array.from(
      new Set(changedOverlapReviews.flatMap((review) => review.reasonTags))
    ).slice(0, 3);
    const reasonTagText = topReasonTags.length > 0 ? ` (${topReasonTags.join(", ")})` : "";
    const finalDecisionReason = `Blocked because ${changedCount} overlapping comparable order(s) changed${reasonTagText}.`;

    return {
      classification: "overlap_with_changes",
      insertableRows: [],
      insertedRowCount: 0,
      rejectedRowCount: rows.length,
      message: `Classification: overlap_with_changes. ${finalDecisionReason}`,
      orderListingDiagnostics: buildOrderListingDiagnostics({
        ...baseDiagnostics,
        finalClassification: "overlap_with_changes",
        newOrderCount: newCount,
        unchangedExistingOrderCount: unchangedCount,
        changedExistingOrderCount: changedCount,
        hasOverlappingExistingOrderValues: unchangedCount + changedCount > 0,
        finalDecisionReason,
        suspiciousOrders,
        typeCounts,
        changedOverlapSummary,
        changedOverlapReviews,
      }),
    };
  }

  if (newCount === 0 && unchangedCount > 0) {
    const finalDecisionReason =
      "Blocked because all incoming orders already exist unchanged, so there is nothing new to insert.";

    return {
      classification: "overlap_unchanged",
      insertableRows: [],
      insertedRowCount: 0,
      rejectedRowCount: rows.length,
      message: `Classification: overlap_unchanged. ${finalDecisionReason}`,
      orderListingDiagnostics: buildOrderListingDiagnostics({
        ...baseDiagnostics,
        finalClassification: "overlap_unchanged",
        newOrderCount: 0,
        unchangedExistingOrderCount: unchangedCount,
        changedExistingOrderCount: 0,
        hasOverlappingExistingOrderValues: true,
        finalDecisionReason,
        typeCounts,
      }),
    };
  }

  const incomingDateRange = getDateRange(rows.map((row) => row.bill_date));
  const existingDateRange = await fetchExistingOrderDateRange();

  if (newCount > 0 && unchangedCount === 0) {
    const classification =
      existingDateRange && incomingDateRange && doDateRangesOverlap(incomingDateRange, existingDateRange)
        ? "gap_fill"
        : "append_only";
    const finalDecisionReason =
      classification === "gap_fill"
        ? `Allowed because Titan found ${insertableRows.length} safe missing order row(s) inside an already covered date range and no changed overlapping orders.`
        : `Allowed because Titan found ${insertableRows.length} new safe order row(s) and no changed overlapping orders.`;

    return {
      classification,
      insertableRows,
      insertedRowCount: insertableRows.length,
      rejectedRowCount: rows.length - insertableRows.length,
      message:
        classification === "gap_fill"
          ? `Classification: gap_fill. ${finalDecisionReason}`
          : `Classification: append_only. ${finalDecisionReason}`,
      orderListingDiagnostics: buildOrderListingDiagnostics({
        ...baseDiagnostics,
        finalClassification: classification,
        newOrderCount: newCount,
        unchangedExistingOrderCount: 0,
        changedExistingOrderCount: 0,
        hasOverlappingExistingOrderValues: false,
        finalDecisionReason,
        typeCounts,
      }),
    };
  }

  if (newCount > 0 && unchangedCount > 0) {
    const classification =
      existingDateRange && incomingDateRange && doDateRangesOverlap(incomingDateRange, existingDateRange)
        ? "gap_fill"
        : "append_only";
    const finalDecisionReason =
      classification === "gap_fill"
        ? `Allowed because the file contains ${unchangedCount} existing unchanged orders and ${insertableRows.length} new safe orders that fill missing rows inside an already covered date range.`
        : `Allowed because the file contains ${unchangedCount} existing unchanged orders and ${insertableRows.length} new safe orders. Only the new rows will be inserted.`;

    return {
      classification,
      insertableRows,
      insertedRowCount: insertableRows.length,
      rejectedRowCount: rows.length - insertableRows.length,
      message:
        classification === "gap_fill"
          ? `Classification: gap_fill. ${finalDecisionReason}`
          : `Classification: append_only. ${finalDecisionReason}`,
      orderListingDiagnostics: buildOrderListingDiagnostics({
        ...baseDiagnostics,
        finalClassification: classification,
        newOrderCount: newCount,
        unchangedExistingOrderCount: unchangedCount,
        changedExistingOrderCount: 0,
        hasOverlappingExistingOrderValues: true,
        finalDecisionReason,
        typeCounts,
      }),
    };
  }

  const finalDecisionReason =
    "Blocked because the Order Listing classification remained unclear after overlap comparison.";

  return {
    classification: "manual_review_needed",
    insertableRows: [],
    insertedRowCount: 0,
    rejectedRowCount: rows.length,
    message: `Classification: manual_review_needed. ${finalDecisionReason}`,
    orderListingDiagnostics: buildOrderListingDiagnostics({
      ...baseDiagnostics,
      finalClassification: "manual_review_needed",
      newOrderCount: newCount,
      unchangedExistingOrderCount: unchangedCount,
      changedExistingOrderCount: changedCount,
      hasOverlappingExistingOrderValues: unchangedCount + changedCount > 0,
      finalDecisionReason,
      suspiciousOrders: rows.slice(0, 20).map((row) => ({
        orderNo: row.order_no,
        reason: "unclear_key_state" as const,
      })),
      typeCounts,
    }),
  };
}

async function classifyItemWiseUpload(
  rows: ItemWiseImportRow[],
  contentHash: string | null,
  currentUploadLogId: number
): Promise<ClassificationResult<ItemWiseImportRow>> {
  if (rows.length === 0) {
    return {
      classification: "manual_review_needed",
      insertableRows: [],
      insertedRowCount: 0,
      rejectedRowCount: 0,
      message: "No parsed item rows were available for overlap classification.",
    };
  }

  if (
    await hasImportedUploadWithSameHash(
      contentHash,
      "petpooja_item_wise_report",
      "sales_item_imports",
      currentUploadLogId
    )
  ) {
    return {
      classification: "exact_duplicate",
      insertableRows: [],
      insertedRowCount: 0,
      rejectedRowCount: rows.length,
      message: "Classification: exact_duplicate. This Item Wise file already matches a previously imported file, so no new rows were inserted.",
    };
  }

  const incomingKeys = rows.map((row) => buildItemRowKey(row));

  if (hasDuplicateKeys(incomingKeys)) {
    return {
      classification: "manual_review_needed",
      insertableRows: [],
      insertedRowCount: 0,
      rejectedRowCount: rows.length,
      message: "Classification: manual_review_needed. The incoming Item Wise file contains duplicate or unclear business keys, so Titan blocked the import for safety.",
    };
  }

  const existingRows = await fetchExistingItemRows(
    Array.from(new Set(rows.map((row) => row.invoice_no)))
  );
  const existingRowMap = new Map<string, ExistingItemWiseRow>();
  const duplicateExistingKeys = new Set<string>();

  for (const existingRow of existingRows) {
    const key = buildItemRowKey(existingRow);

    if (existingRowMap.has(key)) {
      duplicateExistingKeys.add(key);
      continue;
    }

    existingRowMap.set(key, existingRow);
  }

  if (duplicateExistingKeys.size > 0) {
    return {
      classification: "manual_review_needed",
      insertableRows: [],
      insertedRowCount: 0,
      rejectedRowCount: rows.length,
      message: "Classification: manual_review_needed. Existing item-level rows already contain duplicate business keys, so Titan blocked this upload for manual review.",
    };
  }

  let newCount = 0;
  let unchangedCount = 0;
  let changedCount = 0;
  const insertableRows: ItemWiseImportRow[] = [];

  rows.forEach((row) => {
    const key = buildItemRowKey(row);
    const existingRow = existingRowMap.get(key);
    let rowStatus: ItemRowComparisonStatus;

    if (!existingRow) {
      rowStatus = "new_item_row";
    } else if (buildItemRowSignature(row) === buildItemRowSignature(existingRow)) {
      rowStatus = "unchanged_existing_item_row";
    } else {
      rowStatus = "changed_existing_item_row";
    }

    if (rowStatus === "new_item_row") {
      newCount += 1;
      insertableRows.push(row);
    } else if (rowStatus === "unchanged_existing_item_row") {
      unchangedCount += 1;
    } else {
      changedCount += 1;
    }
  });

  if (changedCount > 0) {
    return {
      classification: "overlap_with_changes",
      insertableRows: [],
      insertedRowCount: 0,
      rejectedRowCount: rows.length,
      message: `Classification: overlap_with_changes. ${changedCount} overlapping item rows differ from existing item-level data, so Titan blocked the import for manual review.`,
    };
  }

  if (newCount === 0 && unchangedCount > 0) {
    return {
      classification: "overlap_unchanged",
      insertableRows: [],
      insertedRowCount: 0,
      rejectedRowCount: rows.length,
      message: "Classification: overlap_unchanged. These item rows are already present with the same values, so no new rows were inserted.",
    };
  }

  const incomingDateRange = getDateRange(rows.map((row) => row.item_date));
  const existingDateRange = await fetchExistingItemDateRange();

  if (newCount > 0 && unchangedCount === 0) {
    const classification =
      existingDateRange && incomingDateRange && doDateRangesOverlap(incomingDateRange, existingDateRange)
        ? "gap_fill"
        : "append_only";

    return {
      classification,
      insertableRows,
      insertedRowCount: insertableRows.length,
      rejectedRowCount: rows.length - insertableRows.length,
      message:
        classification === "gap_fill"
          ? `Classification: gap_fill. Titan found only safe missing item rows within an existing date range and will insert ${insertableRows.length} new item rows.`
          : `Classification: append_only. Titan found ${insertableRows.length} new non-conflicting item rows and will insert them.`,
    };
  }

  if (newCount > 0 && unchangedCount > 0) {
    if (!incomingDateRange || !existingDateRange || !doDateRangesOverlap(incomingDateRange, existingDateRange)) {
      return {
        classification: "manual_review_needed",
        insertableRows: [],
        insertedRowCount: 0,
        rejectedRowCount: rows.length,
        message: "Classification: manual_review_needed. Titan found a mixed Item Wise overlap that could not be confirmed safely.",
      };
    }

    return {
      classification: "gap_fill",
      insertableRows,
      insertedRowCount: insertableRows.length,
      rejectedRowCount: rows.length - insertableRows.length,
      message: `Classification: gap_fill. Titan found ${insertableRows.length} safe missing item rows while ${unchangedCount} item rows were already present, so only the missing rows will be inserted.`,
    };
  }

  return {
    classification: "manual_review_needed",
    insertableRows: [],
    insertedRowCount: 0,
    rejectedRowCount: rows.length,
    message: "Classification: manual_review_needed. Titan could not classify this Item Wise file safely.",
  };
}

function hasOrderListingMainOrderDetails(row: unknown[], headerMap: Map<string, number>) {
  const mainOrderSignals = [
    "Items",
    "Created",
    "Order Type",
    "Sub Order Type",
    "Customer Name",
    "Customer Phone",
    "Customer Mobile",
    "Customer Address",
    "Delivery Boy",
    "Status",
  ];

  return mainOrderSignals.some((header) => toCellText(getValueByAliases(row, headerMap, [header])) !== "");
}

function parseBestEffortDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  const text = toCellText(value);

  if (!text) {
    return null;
  }

  const directDate = new Date(text);

  if (!Number.isNaN(directDate.getTime())) {
    return directDate.toISOString();
  }

  const dateTimeMatch = text.match(
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?/i
  );

  if (!dateTimeMatch) {
    return null;
  }

  const day = Number(dateTimeMatch[1]);
  const month = Number(dateTimeMatch[2]) - 1;
  const rawYear = Number(dateTimeMatch[3]);
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;
  let hours = Number(dateTimeMatch[4] ?? 0);
  const minutes = Number(dateTimeMatch[5] ?? 0);
  const seconds = Number(dateTimeMatch[6] ?? 0);
  const meridiem = (dateTimeMatch[7] ?? "").toUpperCase();

  if (meridiem === "PM" && hours < 12) {
    hours += 12;
  }

  if (meridiem === "AM" && hours === 12) {
    hours = 0;
  }

  const parsedDate = new Date(year, month, day, hours, minutes, seconds);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString();
}

function toBillDate(dateValue: string | null) {
  if (!dateValue) {
    return null;
  }

  return dateValue.slice(0, 10);
}

function buildHeaderMap(headerRow: unknown[]) {
  const headerMap = new Map<string, number>();

  headerRow.forEach((value, index) => {
    const normalized = normalizeHeader(value);

    if (normalized && !headerMap.has(normalized)) {
      headerMap.set(normalized, index);
    }
  });

  return headerMap;
}

function getValueByAliases(row: unknown[], headerMap: Map<string, number>, aliases: string[]) {
  for (const alias of aliases) {
    const index = headerMap.get(normalizeHeader(alias));

    if (index !== undefined) {
      return row[index];
    }
  }

  return null;
}

function findHeaderRowIndex(rows: WorkbookRows, requiredHeaders: string[]) {
  for (let rowIndex = 0; rowIndex < Math.min(rows.length, 40); rowIndex += 1) {
    const normalizedRow = rows[rowIndex].map((cell) => normalizeHeader(cell));

    if (requiredHeaders.every((header) => normalizedRow.includes(header))) {
      return rowIndex;
    }
  }

  return null;
}

function detectSalesFormat(rows: WorkbookRows): DetectionResult {
  const orderListingHeaderRowIndex = findHeaderRowIndex(rows, ORDER_LISTING_REQUIRED_HEADERS);

  if (orderListingHeaderRowIndex !== null) {
    return {
      detectedFormat: "petpooja_order_listing",
      headerRowIndex: orderListingHeaderRowIndex,
      targetTable: "sales_order_imports",
    };
  }

  const itemWiseHeaderRowIndex = findHeaderRowIndex(rows, ITEM_WISE_REQUIRED_HEADERS);

  if (itemWiseHeaderRowIndex !== null) {
    return {
      detectedFormat: "petpooja_item_wise_report",
      headerRowIndex: itemWiseHeaderRowIndex,
      targetTable: "sales_item_imports",
    };
  }

  return {
    detectedFormat: "unknown_sales_spreadsheet",
    headerRowIndex: null,
    targetTable: null,
    reason:
      "This spreadsheet does not match the supported Petpooja Order Listing or Item Wise Report format.",
  };
}

function parseOrderListingRows(
  rows: WorkbookRows,
  headerRowIndex: number,
  uploadLogId: number
): ParseResult<ParsedOrderListingRow> {
  const headerMap = buildHeaderMap(rows[headerRowIndex] ?? []);
  const parsedRows: ParsedOrderListingRow[] = [];
  let parsedRowCount = 0;
  let rejectedRowCount = 0;

  for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] ?? [];

    if (!isNonEmptyRow(row)) {
      continue;
    }

    parsedRowCount += 1;

    const orderNo = toCellText(getValueByAliases(row, headerMap, ["Order No.", "Order No"]));

    if (!orderNo) {
      rejectedRowCount += 1;
      continue;
    }

    const itemsText = toCellText(getValueByAliases(row, headerMap, ["Items"]));
    const createdText = toCellText(getValueByAliases(row, headerMap, ["Created"]));

    const paymentDescription = toCellText(
      getValueByAliases(row, headerMap, ["Payment Description", "Payment", "Payment Details"])
    );
    const grandTotal = safeParseNumber(getValueByAliases(row, headerMap, ["Grand Total", "Total"]));
    const extractedPaymentTotal = extractTotalFromPaymentText(paymentDescription);
    const orderCreatedAt = parseBestEffortDate(createdText);
    const effectiveTotal =
      (grandTotal ?? 0) > 0 ? grandTotal : extractedPaymentTotal ?? grandTotal ?? null;
    const classification = classifyParsedOrderListingRow({
      order_no: orderNo,
      order_type: toCellText(getValueByAliases(row, headerMap, ["Order Type"])) || null,
      sub_order_type: toCellText(getValueByAliases(row, headerMap, ["Sub Order Type"])) || null,
      customer_name: toCellText(getValueByAliases(row, headerMap, ["Customer Name"])) || null,
      customer_phone:
        toCellText(
          getValueByAliases(row, headerMap, ["Customer Phone", "Customer Mobile", "Phone"])
        ) || null,
      customer_address: toCellText(getValueByAliases(row, headerMap, ["Customer Address"])) || null,
      delivery_boy:
        toCellText(getValueByAliases(row, headerMap, ["Delivery Boy", "Delivery Boy Name"])) || null,
      status: toCellText(getValueByAliases(row, headerMap, ["Status"])) || null,
      items_text: itemsText || null,
      created_text: createdText || null,
      grand_total: grandTotal,
      payment_type: toCellText(getValueByAliases(row, headerMap, ["Payment Type"])) || null,
      payment_description: paymentDescription || null,
    });

    if (classification.transactionFamily === "payment_split_child") {
      rejectedRowCount += 1;
      continue;
    }

    parsedRows.push({
      order_no: orderNo,
      client_order_id: toCellText(
        getValueByAliases(row, headerMap, ["Client Order Id", "Client Order ID"])
      ) || null,
      order_type: toCellText(getValueByAliases(row, headerMap, ["Order Type"])) || null,
      sub_order_type: toCellText(getValueByAliases(row, headerMap, ["Sub Order Type"])) || null,
      customer_name: toCellText(getValueByAliases(row, headerMap, ["Customer Name"])) || null,
      customer_phone:
        toCellText(
          getValueByAliases(row, headerMap, ["Customer Phone", "Customer Mobile", "Phone"])
        ) || null,
      gstin: toCellText(getValueByAliases(row, headerMap, ["GSTIN"])) || null,
      customer_address: toCellText(getValueByAliases(row, headerMap, ["Customer Address"])) || null,
      delivery_boy:
        toCellText(getValueByAliases(row, headerMap, ["Delivery Boy", "Delivery Boy Name"])) || null,
      delivery_boy_number:
        toCellText(
          getValueByAliases(row, headerMap, ["Delivery Boy Number", "Delivery Boy Mobile"])
        ) || null,
      items_text: itemsText || null,
      item_count_estimate: countItemsFromText(itemsText),
      my_amount: safeParseNumber(getValueByAliases(row, headerMap, ["My Amount"])),
      total_discount: safeParseNumber(getValueByAliases(row, headerMap, ["Total Discount", "Discount"])),
      delivery_charge: safeParseNumber(getValueByAliases(row, headerMap, ["Delivery Charge"])),
      container_charge: safeParseNumber(getValueByAliases(row, headerMap, ["Container Charge"])),
      total_tax: safeParseNumber(getValueByAliases(row, headerMap, ["Total Tax", "Tax"])),
      round_off: safeParseNumber(getValueByAliases(row, headerMap, ["Round Off", "RoundOff"])),
      grand_total: grandTotal,
      effective_total: effectiveTotal,
      payment_type: toCellText(getValueByAliases(row, headerMap, ["Payment Type"])) || null,
      payment_description: paymentDescription || null,
      status: toCellText(getValueByAliases(row, headerMap, ["Status"])) || null,
      created_text: createdText || null,
      order_created_at: orderCreatedAt,
      bill_date: toBillDate(orderCreatedAt),
      source_row_number: rowIndex + 1,
      is_payment_split_row: false,
      parse_note: buildOrderParseNote(classification),
      upload_log_id: uploadLogId,
      __transactionFamily: classification.transactionFamily,
      __comparisonKeyType: classification.comparisonKeyType,
      __isCancelled: classification.isCancelled,
      __isAdvanceOrder: classification.isAdvanceOrder,
    });
  }

  return {
    rows: parsedRows,
    parsedRowCount,
    insertedRowCount: parsedRows.length,
    rejectedRowCount,
  };
}

function parseItemWiseRows(
  rows: WorkbookRows,
  headerRowIndex: number,
  uploadLogId: number
): ParseResult<ItemWiseImportRow> {
  const headerMap = buildHeaderMap(rows[headerRowIndex] ?? []);
  const parsedRows: ItemWiseImportRow[] = [];
  let parsedRowCount = 0;
  let rejectedRowCount = 0;

  for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] ?? [];

    if (!isNonEmptyRow(row)) {
      continue;
    }

    parsedRowCount += 1;

    const invoiceNo = toCellText(getValueByAliases(row, headerMap, ["Invoice No.", "Invoice No"]));
    const itemName = toCellText(getValueByAliases(row, headerMap, ["Item Name"]));

    if (!invoiceNo || !itemName) {
      rejectedRowCount += 1;
      continue;
    }

    const itemDateText = toCellText(getValueByAliases(row, headerMap, ["Date", "Bill Date"]));
    const itemTimestampText = toCellText(
      getValueByAliases(row, headerMap, ["Timestamp", "Time", "Date Time", "Created"])
    );
    const combinedTimestampText = [itemDateText, itemTimestampText].filter(Boolean).join(" ").trim();

    parsedRows.push({
      invoice_no: invoiceNo,
      item_date: itemDateText || toBillDate(parseBestEffortDate(combinedTimestampText)),
      item_timestamp_text: itemTimestampText || null,
      item_timestamp: parseBestEffortDate(combinedTimestampText || itemTimestampText),
      item_name: itemName,
      price: safeParseNumber(getValueByAliases(row, headerMap, ["Price", "Rate"])),
      qty: safeParseNumber(getValueByAliases(row, headerMap, ["Qty.", "Qty", "Quantity"])),
      sub_total: safeParseNumber(getValueByAliases(row, headerMap, ["Sub Total", "Subtotal"])),
      discount: safeParseNumber(getValueByAliases(row, headerMap, ["Discount"])),
      tax: safeParseNumber(getValueByAliases(row, headerMap, ["Tax"])),
      final_total: safeParseNumber(getValueByAliases(row, headerMap, ["Final Total"])),
      table_no: toCellText(getValueByAliases(row, headerMap, ["Table No.", "Table No"])) || null,
      server_name: toCellText(getValueByAliases(row, headerMap, ["Server Name", "Captain"])) || null,
      covers: safeParseNumber(getValueByAliases(row, headerMap, ["Covers"])),
      variation: toCellText(getValueByAliases(row, headerMap, ["Variation"])) || null,
      category: toCellText(getValueByAliases(row, headerMap, ["Category"])) || null,
      hsn: toCellText(getValueByAliases(row, headerMap, ["HSN"])) || null,
      source_row_number: rowIndex + 1,
      parse_note: null,
      upload_log_id: uploadLogId,
    });
  }

  return {
    rows: parsedRows,
    parsedRowCount,
    insertedRowCount: parsedRows.length,
    rejectedRowCount,
  };
}

async function computeContentHash(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((value) => value.toString(16).padStart(2, "0")).join("");

  return {
    arrayBuffer,
    contentHash: hash,
  };
}

export default function UploadSalesPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("No file selected");
  const [message, setMessage] = useState("");
  const [orderListingDiagnostics, setOrderListingDiagnostics] = useState<OrderListingDiagnostics | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select a sales Excel file before uploading.");
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".xlsx")) {
      setMessage("Only .xlsx sales spreadsheet files are supported right now.");
      return;
    }

    setIsSaving(true);
    setMessage("");
    setOrderListingDiagnostics(null);

    let contentHash: string | null = null;

    try {
      const { arrayBuffer, contentHash: hash } = await computeContentHash(selectedFile);
      contentHash = hash;
      const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        setMessage("This Excel file does not contain any sheets.");
        setIsSaving(false);
        return;
      }

      const firstSheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(firstSheet, {
        header: 1,
        defval: "",
        raw: false,
        blankrows: true,
      }) as WorkbookRows;

      const detectionResult = detectSalesFormat(rows);

      if (detectionResult.detectedFormat === "unknown_sales_spreadsheet") {
        const { error: rejectedLogError } = await supabase.from("uploads_log").insert([
          {
            kind: "sales",
            file_name: selectedFile.name,
            original_file_name: selectedFile.name,
            mime_type: selectedFile.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            file_size_bytes: selectedFile.size,
            detected_format: "unknown_sales_spreadsheet",
            target_table: null,
            ingest_status: "rejected",
            ingest_message: detectionResult.reason,
            content_hash: contentHash,
            parsed_row_count: 0,
            inserted_row_count: 0,
            rejected_row_count: 0,
          },
        ]);

        if (rejectedLogError) {
          setMessage("This spreadsheet format is not supported yet, and the rejection log could not be saved.");
        } else {
          setMessage(detectionResult.reason);
        }

        setIsSaving(false);
        return;
      }

      const filePath = `sales/${Date.now()}-${selectedFile.name}`;

      const { error: storageError } = await supabase.storage
        .from("uploads")
        .upload(filePath, selectedFile);

      if (storageError) {
        setMessage("Could not upload the sales file to Supabase Storage.");
        setIsSaving(false);
        return;
      }

      const { data: uploadLogRow, error: logError } = await supabase
        .from("uploads_log")
        .insert([
          {
            kind: "sales",
            file_name: selectedFile.name,
            original_file_name: selectedFile.name,
            mime_type:
              selectedFile.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            file_size_bytes: selectedFile.size,
            detected_format: detectionResult.detectedFormat,
            target_table: detectionResult.targetTable,
            ingest_status: "processing",
            ingest_message: "File accepted and parsing started",
            content_hash: contentHash,
            storage_path: filePath,
          },
        ])
        .select("id")
        .single();

      if (logError || !uploadLogRow) {
        setMessage("File uploaded, but the sales ingestion log could not be started.");
        setIsSaving(false);
        return;
      }

      try {
        let parseResult: ParseResult<ParsedOrderListingRow | ItemWiseImportRow>;
        let classificationResult: ClassificationResult<ParsedOrderListingRow | ItemWiseImportRow>;
        let insertRowsForDatabase: Array<OrderListingImportRow | ItemWiseImportRow> = [];

        if (detectionResult.detectedFormat === "petpooja_order_listing") {
          const orderParseResult = parseOrderListingRows(rows, detectionResult.headerRowIndex, uploadLogRow.id);
          parseResult = orderParseResult;
          const orderClassificationResult = await classifyOrderListingUpload(
            orderParseResult.rows,
            contentHash,
            uploadLogRow.id
          );
          classificationResult = orderClassificationResult;
          setOrderListingDiagnostics(orderClassificationResult.orderListingDiagnostics ?? null);
          insertRowsForDatabase = orderClassificationResult.insertableRows.map(stripOrderListingRowForInsert);
        } else {
          const itemParseResult = parseItemWiseRows(rows, detectionResult.headerRowIndex, uploadLogRow.id);
          parseResult = itemParseResult;
          const itemClassificationResult = await classifyItemWiseUpload(
            itemParseResult.rows,
            contentHash,
            uploadLogRow.id
          );
          classificationResult = itemClassificationResult;
          setOrderListingDiagnostics(null);
          insertRowsForDatabase = itemClassificationResult.insertableRows;
        }

        if (parseResult.rows.length === 0) {
          await supabase
            .from("uploads_log")
            .update({
              ingest_status: "failed",
              ingest_message: "The file matched a known format, but no valid sales rows were found.",
              parsed_row_count: parseResult.parsedRowCount,
              inserted_row_count: 0,
              rejected_row_count: parseResult.rejectedRowCount,
            })
            .eq("id", uploadLogRow.id);

          setMessage("The file was accepted, but no valid sales rows could be imported.");
          setIsSaving(false);
          return;
        }

        const totalRejectedRowCount =
          parseResult.rejectedRowCount + classificationResult.rejectedRowCount;

        if (
          classificationResult.classification === "exact_duplicate" ||
          classificationResult.classification === "overlap_unchanged" ||
          classificationResult.classification === "overlap_with_changes" ||
          classificationResult.classification === "manual_review_needed"
        ) {
          await supabase
            .from("uploads_log")
            .update({
              ingest_status: "rejected",
              ingest_message: classificationResult.message,
              parsed_row_count: parseResult.parsedRowCount,
              inserted_row_count: 0,
              rejected_row_count: totalRejectedRowCount,
            })
            .eq("id", uploadLogRow.id);

          setMessage(classificationResult.message);
          setIsSaving(false);
          return;
        }

        if (insertRowsForDatabase.length === 0) {
          await supabase
            .from("uploads_log")
            .update({
              ingest_status: "rejected",
              ingest_message: "Titan classified this file safely, but there were no new rows to insert.",
              parsed_row_count: parseResult.parsedRowCount,
              inserted_row_count: 0,
              rejected_row_count: totalRejectedRowCount,
            })
            .eq("id", uploadLogRow.id);

          setMessage("Titan classified this file safely, but there were no new rows to insert.");
          setIsSaving(false);
          return;
        }

        const { error: importError } = await supabase
          .schema("public")
          .from(detectionResult.targetTable)
          .insert(insertRowsForDatabase);

        if (importError) {
          await supabase
            .from("uploads_log")
            .update({
              ingest_status: "failed",
              ingest_message: `The file was accepted, but rows could not be inserted into ${detectionResult.targetTable}.`,
              parsed_row_count: parseResult.parsedRowCount,
              inserted_row_count: 0,
              rejected_row_count: totalRejectedRowCount,
            })
            .eq("id", uploadLogRow.id);

          setMessage("The file was accepted, but the sales rows could not be imported.");
          setIsSaving(false);
          return;
        }

        const successMessage =
          detectionResult.targetTable === "sales_order_imports"
            ? `${classificationResult.message} Order Listing rows were inserted into sales_order_imports.`
            : `${classificationResult.message} Item Wise rows were inserted into sales_item_imports.`;

        await supabase
          .from("uploads_log")
          .update({
            ingest_status: "imported",
            ingest_message: successMessage,
            parsed_row_count: parseResult.parsedRowCount,
            inserted_row_count: classificationResult.insertedRowCount,
            rejected_row_count: totalRejectedRowCount,
          })
          .eq("id", uploadLogRow.id);

        setMessage(successMessage);
      } catch (acceptedFileError) {
        await supabase
          .from("uploads_log")
          .update({
            ingest_status: "failed",
            ingest_message: "The file was accepted, but the sales import could not be completed safely.",
          })
          .eq("id", uploadLogRow.id);

        setMessage(
          acceptedFileError instanceof Error
            ? acceptedFileError.message
            : "The file was accepted, but the sales import could not be completed safely."
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not read this Excel file. Please try a supported .xlsx sales spreadsheet."
      );
    }

    setIsSaving(false);
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Upload Sales</h1>
        <p className="text-gray-300 mb-8">
          Upload your restaurant sales file here.
        </p>

        <div className="rounded-2xl border border-white/20 p-8 space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Select sales file
            </label>
            <input
              type="file"
              className="block w-full rounded-lg border border-white/20 bg-transparent px-4 py-3"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setSelectedFile(file);
                setFileName(file ? file.name : "No file selected");
                setMessage("");
                setOrderListingDiagnostics(null);
              }}
            />
          </div>

          <p className="text-sm text-gray-300">
            Selected file: <span className="font-semibold">{fileName}</span>
          </p>

          <button
            onClick={handleUpload}
            disabled={isSaving}
            className="rounded-lg bg-white text-black px-6 py-3 font-semibold hover:bg-gray-200 disabled:opacity-60"
          >
            {isSaving ? "Uploading..." : "Upload File"}
          </button>

          {message && (
            <p className="text-sm text-gray-300 border border-white/10 rounded-lg p-3">
              {message}
            </p>
          )}

          {orderListingDiagnostics && (
            <OrderListingDiagnosticsPanel diagnostics={orderListingDiagnostics} />
          )}
        </div>
      </div>
    </main>
  );
}
