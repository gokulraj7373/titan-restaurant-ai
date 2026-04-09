"use client";

import { useEffect, useState } from "react";
import { buildSalesTruthReviewDerivedData } from "@/lib/sales-truth-review/engine";
import {
  analyzePaymentBreakup,
  createEmptySummaryCounts,
  detectTransactionFamily,
  getDisplayAmount,
  getMemoCandidateExplanationText,
  getMemoReviewLabelText,
  getMemoResolutionReviewNotes,
  getPartPaymentDerivedNote,
  getSalesPolicyBucket,
  getSalesPolicyBucketText,
  getSuggestedInterpretation,
  getSuggestedInterpretationText,
  sortLatestRows,
} from "@/lib/sales-truth-review/policy";
import { supabase } from "@/lib/supabase";
import type {
  LatestImportBreakdownRow,
  MemoReviewRow,
  MonthlyPolicyReconciliationRow,
  SalesTruthReviewRow,
  SummaryCounts,
  UploadLogRow,
  VerificationBreakdownRow,
} from "@/lib/sales-truth-review/types";

const BATCH_SIZE = 1000;

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

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) {
    return "-";
  }

  return `Rs ${Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatBillDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString(undefined, {
    dateStyle: "medium",
  });
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getItemsSummary(itemsText: string | null | undefined) {
  const text = String(itemsText ?? "").trim();

  if (!text) {
    return "-";
  }

  return text.length > 100 ? `${text.slice(0, 97)}...` : text;
}

function getSectionShellClass(sectionState: "needs-review" | "clean" | "neutral") {
  if (sectionState === "needs-review") {
    return "rounded-2xl border border-amber-400/30 bg-amber-400/[0.04] p-6 scroll-mt-6";
  }

  if (sectionState === "clean") {
    return "rounded-2xl border border-white/10 bg-white/[0.02] p-6 scroll-mt-6 opacity-90";
  }

  return "rounded-2xl border border-white/20 p-6 scroll-mt-6";
}

function getSnapshotCardClass(sectionState: "needs-review" | "clean" | "neutral") {
  if (sectionState === "needs-review") {
    return "rounded-2xl border border-amber-400/30 bg-amber-400/[0.05] p-4";
  }

  if (sectionState === "clean") {
    return "rounded-2xl border border-white/10 bg-white/[0.04] p-4";
  }

  return "rounded-2xl border border-white/15 bg-white/[0.02] p-4";
}

export default function SalesTruthReviewPage() {
  const [summaryCounts, setSummaryCounts] = useState<SummaryCounts>(createEmptySummaryCounts());
  const [regularOrders, setRegularOrders] = useState<SalesTruthReviewRow[]>([]);
  const [advanceOrders, setAdvanceOrders] = useState<SalesTruthReviewRow[]>([]);
  const [memoOrders, setMemoOrders] = useState<SalesTruthReviewRow[]>([]);
  const [complimentaryOrders, setComplimentaryOrders] = useState<SalesTruthReviewRow[]>([]);
  const [salesReturnOrders, setSalesReturnOrders] = useState<SalesTruthReviewRow[]>([]);
  const [cancelledOrders, setCancelledOrders] = useState<SalesTruthReviewRow[]>([]);
  const [paymentSplitChildRows, setPaymentSplitChildRows] = useState<SalesTruthReviewRow[]>([]);
  const [partPaymentRows, setPartPaymentRows] = useState<SalesTruthReviewRow[]>([]);
  const [netSaleCandidateRows, setNetSaleCandidateRows] = useState<SalesTruthReviewRow[]>([]);
  const [memoUnresolvedRows, setMemoUnresolvedRows] = useState<SalesTruthReviewRow[]>([]);
  const [memoReviewRows, setMemoReviewRows] = useState<MemoReviewRow[]>([]);
  const [grandTotalZeroRows, setGrandTotalZeroRows] = useState<SalesTruthReviewRow[]>([]);
  const [differentTotalRows, setDifferentTotalRows] = useState<SalesTruthReviewRow[]>([]);
  const [monthBreakdownRows, setMonthBreakdownRows] = useState<VerificationBreakdownRow[]>([]);
  const [sourceFamilyBreakdownRows, setSourceFamilyBreakdownRows] = useState<VerificationBreakdownRow[]>([]);
  const [salesPolicyBreakdownRows, setSalesPolicyBreakdownRows] = useState<VerificationBreakdownRow[]>([]);
  const [netSalesByMonthRows, setNetSalesByMonthRows] = useState<VerificationBreakdownRow[]>([]);
  const [latestImportBreakdownRows, setLatestImportBreakdownRows] = useState<LatestImportBreakdownRow[]>([]);
  const [monthlyPolicyReconciliationRows, setMonthlyPolicyReconciliationRows] = useState<
    MonthlyPolicyReconciliationRow[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const loadReviewData = async () => {
      try {
        const [allRows, latestUploadLogs] = await Promise.all([
          fetchAllRows<SalesTruthReviewRow>(async (from, to) => {
            return supabase
              .schema("public")
              .from("sales_order_imports")
              .select(
                "id, upload_log_id, order_no, bill_date, customer_name, customer_phone, order_type, sub_order_type, status, my_amount, total_discount, delivery_charge, container_charge, total_tax, round_off, grand_total, effective_total, payment_type, payment_description, parse_note, is_payment_split_row"
              )
              .order("id", { ascending: true })
              .range(from, to);
          }),
          (async () => {
            const { data, error } = await supabase
              .from("uploads_log")
              .select("id, original_file_name, created_at, inserted_row_count, rejected_row_count")
              .eq("kind", "sales")
              .eq("target_table", "sales_order_imports")
              .eq("ingest_status", "imported")
              .order("created_at", { ascending: false })
              .limit(10);

            if (error) {
              throw error;
            }

            return (data ?? []) as UploadLogRow[];
          })(),
        ]);

        const allUploadIds = new Set<number>();

        allRows.forEach((row) => {
          if (row.upload_log_id !== null && row.upload_log_id !== undefined) {
            allUploadIds.add(row.upload_log_id);
          }
        });

        const uploadFileNameById = new Map<number, string | null>();

        for (const uploadIdChunk of Array.from(allUploadIds).reduce<number[][]>((chunks, uploadId, index) => {
          const chunkIndex = Math.floor(index / 200);

          if (!chunks[chunkIndex]) {
            chunks[chunkIndex] = [];
          }

          chunks[chunkIndex].push(uploadId);
          return chunks;
        }, [])) {
          const { data, error } = await supabase
            .from("uploads_log")
            .select("id, original_file_name")
            .in("id", uploadIdChunk);

          if (error) {
            throw error;
          }

          (data ?? []).forEach((row) => {
            uploadFileNameById.set(row.id, row.original_file_name ?? null);
          });
        }
        const derivedData = buildSalesTruthReviewDerivedData({
          rows: allRows,
          latestUploadLogs,
          uploadFileNameById,
          formatCurrency,
        });

        setSummaryCounts(derivedData.summaryCounts);
        setRegularOrders(derivedData.regularOrders);
        setAdvanceOrders(derivedData.advanceOrders);
        setMemoOrders(derivedData.memoOrders);
        setComplimentaryOrders(derivedData.complimentaryOrders);
        setSalesReturnOrders(derivedData.salesReturnOrders);
        setCancelledOrders(derivedData.cancelledOrders);
        setPaymentSplitChildRows(derivedData.paymentSplitChildRows);
        setPartPaymentRows(derivedData.partPaymentRows);
        setNetSaleCandidateRows(derivedData.netSaleCandidateRows);
        setMemoUnresolvedRows(derivedData.memoUnresolvedRows);
        setMemoReviewRows(derivedData.memoReviewRows);
        setGrandTotalZeroRows(derivedData.grandTotalZeroRows);
        setDifferentTotalRows(derivedData.differentTotalRows);
        setMonthBreakdownRows(derivedData.monthBreakdownRows);
        setSourceFamilyBreakdownRows(derivedData.sourceFamilyBreakdownRows);
        setSalesPolicyBreakdownRows(derivedData.salesPolicyBreakdownRows);
        setNetSalesByMonthRows(derivedData.netSalesByMonthRows);
        setLatestImportBreakdownRows(derivedData.latestImportBreakdownRows);
        setMonthlyPolicyReconciliationRows(derivedData.monthlyPolicyReconciliationRows);
        setLoadError(false);
      } catch {
        setSummaryCounts(createEmptySummaryCounts());
        setRegularOrders([]);
        setAdvanceOrders([]);
        setMemoOrders([]);
        setComplimentaryOrders([]);
        setSalesReturnOrders([]);
        setCancelledOrders([]);
        setPaymentSplitChildRows([]);
        setPartPaymentRows([]);
        setNetSaleCandidateRows([]);
        setMemoUnresolvedRows([]);
        setMemoReviewRows([]);
        setGrandTotalZeroRows([]);
        setDifferentTotalRows([]);
        setMonthBreakdownRows([]);
        setSourceFamilyBreakdownRows([]);
        setSalesPolicyBreakdownRows([]);
        setNetSalesByMonthRows([]);
        setLatestImportBreakdownRows([]);
        setMonthlyPolicyReconciliationRows([]);
        setLoadError(true);
      }

      setLoading(false);
    };

    loadReviewData();
  }, []);

  const renderRowsSection = (
    title: string,
    description: string,
    rows: SalesTruthReviewRow[],
    emptyMessage: string,
    helperNote?: string,
    sectionId?: string,
    headerChips?: string[],
    sectionState: "needs-review" | "clean" | "neutral" = "neutral"
  ) => {
    return (
      <div id={sectionId} className={getSectionShellClass(sectionState)}>
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-sm text-gray-400 mb-4">{description}</p>
        {headerChips && headerChips.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {headerChips.map((chip) => (
              <div
                key={`${title}-${chip}`}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200"
              >
                {chip}
              </div>
            ))}
          </div>
        )}
        {helperNote && <p className="text-sm text-gray-400 mb-4">{helperNote}</p>}

        {loadError ? (
          <p className="text-sm text-gray-300">Could not load review rows</p>
        ) : loading ? (
          <p className="text-sm text-gray-300">Loading review rows...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-300">{emptyMessage}</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => {
              const transactionFamily = detectTransactionFamily(row);
              const suggestedInterpretation = getSuggestedInterpretation(row, transactionFamily);
              const salesPolicyBucket = getSalesPolicyBucket(row, transactionFamily);
              const isAmbiguousSettlementSection = sectionId === "ambiguous-settlement-review";

              return (
                <div
                  key={row.id}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="mb-3">
                    <p className="text-xs text-gray-400">Read-Only Review Classification</p>
                    <p className="mt-1 inline-block rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white">
                      {getSuggestedInterpretationText(suggestedInterpretation)}
                    </p>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-gray-400">Sales Policy Bucket</p>
                    <p className="mt-1 inline-block rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white">
                      {getSalesPolicyBucketText(salesPolicyBucket)}
                    </p>
                  </div>

                  {isAmbiguousSettlementSection && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-gray-200">
                        Order: {row.order_no || "-"}
                      </div>
                      <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-gray-200">
                        Bill Date: {formatBillDate(row.bill_date)}
                      </div>
                      <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-gray-200">
                        Status: {row.status || "-"}
                      </div>
                      <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-gray-200">
                        Grand Total: {formatCurrency(row.grand_total)}
                      </div>
                      <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-gray-200">
                        Effective Total: {formatCurrency(row.effective_total)}
                      </div>
                      <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-gray-200">
                        Payment Type: {row.payment_type || "-"}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
                    <div>
                      <p className="text-xs text-gray-400">Order No</p>
                      <p className="mt-1 text-sm text-white break-words">{row.order_no || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Bill Date</p>
                      <p className="mt-1 text-sm text-white">{formatBillDate(row.bill_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Customer Name</p>
                      <p className="mt-1 text-sm text-white break-words">{row.customer_name || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Customer Phone</p>
                      <p className="mt-1 text-sm text-white break-words">{row.customer_phone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Order Type</p>
                      <p className="mt-1 text-sm text-white break-words">{row.order_type || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Sub Order Type</p>
                      <p className="mt-1 text-sm text-white break-words">{row.sub_order_type || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Status</p>
                      <p className="mt-1 text-sm text-white break-words">{row.status || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">My Amount</p>
                      <p className="mt-1 text-sm text-white">{formatCurrency(row.my_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total Discount</p>
                      <p className="mt-1 text-sm text-white">{formatCurrency(row.total_discount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Delivery Charge</p>
                      <p className="mt-1 text-sm text-white">{formatCurrency(row.delivery_charge)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Container Charge</p>
                      <p className="mt-1 text-sm text-white">{formatCurrency(row.container_charge)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total Tax</p>
                      <p className="mt-1 text-sm text-white">{formatCurrency(row.total_tax)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Round Off</p>
                      <p className="mt-1 text-sm text-white">{formatCurrency(row.round_off)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Grand Total</p>
                      <p className="mt-1 text-sm text-white">{formatCurrency(row.grand_total)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Effective Total</p>
                      <p className="mt-1 text-sm text-white">{formatCurrency(row.effective_total)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Payment Type</p>
                      <p className="mt-1 text-sm text-white break-words">{row.payment_type || "-"}</p>
                    </div>
                    <div className="xl:col-span-2">
                      <p className="text-xs text-gray-400">Payment Description</p>
                      <p className="mt-1 text-sm text-white break-words">
                        {row.payment_description || "-"}
                      </p>
                    </div>
                    <div className="xl:col-span-2">
                      <p className="text-xs text-gray-400">Parse Note</p>
                      <p className="mt-1 text-sm text-white break-words">{row.parse_note || "-"}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderPartPaymentRowsSection = (
    title: string,
    description: string,
    rows: SalesTruthReviewRow[],
    emptyMessage: string,
    helperNote?: string,
    sectionId?: string,
    headerChips?: string[],
    sectionState: "needs-review" | "clean" | "neutral" = "neutral"
  ) => {
    return (
      <div id={sectionId} className={getSectionShellClass(sectionState)}>
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-sm text-gray-400 mb-4">{description}</p>
        {headerChips && headerChips.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {headerChips.map((chip) => (
              <div
                key={`${title}-${chip}`}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200"
              >
                {chip}
              </div>
            ))}
          </div>
        )}
        {helperNote && <p className="text-sm text-gray-400 mb-4">{helperNote}</p>}

        {loadError ? (
          <p className="text-sm text-gray-300">Could not load payment review rows</p>
        ) : loading ? (
          <p className="text-sm text-gray-300">Loading payment review rows...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-300">{emptyMessage}</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => {
              const paymentBreakupAnalysis = analyzePaymentBreakup(row);
              const salesPolicyBucket = getSalesPolicyBucket(row, detectTransactionFamily(row));

              return (
                <div
                  key={row.id}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-400">Read-Only Review Classification</p>
                      <p className="mt-1 inline-block rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white">
                        {getSuggestedInterpretationText("normal_sale_candidate")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Sales Policy Bucket</p>
                      <p className="mt-1 inline-block rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white">
                        {getSalesPolicyBucketText(salesPolicyBucket)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Payment Breakup Extract Status</p>
                      <p className="mt-1 inline-block rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white break-words">
                        {paymentBreakupAnalysis.status}
                      </p>
                    </div>
                    <div className="xl:col-span-2">
                      <p className="text-xs text-gray-400">Derived Note</p>
                      <p className="mt-1 text-sm text-white break-words">
                        {getPartPaymentDerivedNote(paymentBreakupAnalysis.status)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
                    <div>
                      <p className="text-xs text-gray-400">Order No</p>
                      <p className="mt-1 text-sm text-white break-words">{row.order_no || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Bill Date</p>
                      <p className="mt-1 text-sm text-white">{formatBillDate(row.bill_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Status</p>
                      <p className="mt-1 text-sm text-white break-words">{row.status || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Customer Name</p>
                      <p className="mt-1 text-sm text-white break-words">{row.customer_name || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Order Type</p>
                      <p className="mt-1 text-sm text-white break-words">{row.order_type || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Sub Order Type</p>
                      <p className="mt-1 text-sm text-white break-words">{row.sub_order_type || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Payment Type</p>
                      <p className="mt-1 text-sm text-white break-words">{row.payment_type || "-"}</p>
                    </div>
                    <div className="xl:col-span-2">
                      <p className="text-xs text-gray-400">Payment Description</p>
                      <p className="mt-1 text-sm text-white break-words">
                        {row.payment_description || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Grand Total</p>
                      <p className="mt-1 text-sm text-white">{formatCurrency(row.grand_total)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Effective Total</p>
                      <p className="mt-1 text-sm text-white">{formatCurrency(row.effective_total)}</p>
                    </div>
                    <div className="xl:col-span-2">
                      <p className="text-xs text-gray-400">Parse Note</p>
                      <p className="mt-1 text-sm text-white break-words">{row.parse_note || "-"}</p>
                    </div>
                    <div className="xl:col-span-2">
                      <p className="text-xs text-gray-400">Detected Payment Components</p>
                      <p className="mt-1 text-sm text-white break-words">
                        {paymentBreakupAnalysis.components.length > 0
                          ? paymentBreakupAnalysis.components
                              .map(
                                (component) =>
                                  `${component.method}: Rs ${component.amount.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}`
                              )
                              .join(" | ")
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderBreakdownSection = (
    title: string,
    description: string,
    rows: VerificationBreakdownRow[],
    keyLabel: string,
    emptyMessage: string,
    helperNote?: string,
    sectionId?: string
  ) => {
    return (
      <div id={sectionId} className="rounded-2xl border border-white/20 p-6 scroll-mt-6">
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-sm text-gray-400 mb-4">{description}</p>
        {helperNote && <p className="text-sm text-gray-400 mb-4">{helperNote}</p>}

        {loadError ? (
          <p className="text-sm text-gray-300">Could not load verification breakdown</p>
        ) : loading ? (
          <p className="text-sm text-gray-300">Loading verification breakdown...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-300">{emptyMessage}</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.key}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 grid grid-cols-1 gap-3 md:grid-cols-3"
              >
                <div>
                  <p className="text-xs text-gray-400">{keyLabel}</p>
                  <p className="mt-1 text-sm text-white break-words">{row.key}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Row Count</p>
                  <p className="mt-1 text-sm text-white">{row.rowCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Amount</p>
                  <p className="mt-1 text-sm text-white">{formatCurrency(row.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderLatestImportsSection = () => {
    return (
      <div className="rounded-2xl border border-white/20 p-6">
        <h2 className="text-xl font-semibold mb-2">Latest Imports Breakdown</h2>
        <p className="text-sm text-gray-400 mb-4">
          This uses the stored `upload_log_id` link in `sales_order_imports`, so per-upload amount and row
          attribution is exact with the current schema.
        </p>

        {loadError ? (
          <p className="text-sm text-gray-300">Could not load latest import breakdown</p>
        ) : loading ? (
          <p className="text-sm text-gray-300">Loading latest import breakdown...</p>
        ) : latestImportBreakdownRows.length === 0 ? (
          <p className="text-sm text-gray-300">No sales order imports found</p>
        ) : (
          <div className="space-y-3">
            {latestImportBreakdownRows.map((row) => (
              <div
                key={row.uploadLogId}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6"
              >
                <div className="xl:col-span-2">
                  <p className="text-xs text-gray-400">Original File Name</p>
                  <p className="mt-1 text-sm text-white break-words">{row.originalFileName || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Uploaded At</p>
                  <p className="mt-1 text-sm text-white">{formatDateTime(row.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Inserted Row Count</p>
                  <p className="mt-1 text-sm text-white">{row.insertedRowCount ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Rejected Row Count</p>
                  <p className="mt-1 text-sm text-white">{row.rejectedRowCount ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Attributed Row Count</p>
                  <p className="mt-1 text-sm text-white">{row.exactRowCount}</p>
                </div>
                <div className="xl:col-span-2">
                  <p className="text-xs text-gray-400">Bill Date Coverage</p>
                  <p className="mt-1 text-sm text-white break-words">{row.dateCoverageText}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Attributed Amount</p>
                  <p className="mt-1 text-sm text-white">{row.exactAmountText}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderMonthlyPolicyReconciliationSection = () => {
    const monthReconciliationHealthy =
      monthlyPolicyReconciliationRows.length > 0 &&
      monthlyPolicyReconciliationRows.every((row) => row.reconciled);

    return (
      <div
        id="monthly-policy-reconciliation"
        className={getSectionShellClass(
          monthlyPolicyReconciliationRows.length > 0 && monthReconciliationHealthy ? "clean" : "needs-review"
        )}
      >
        <h2 className="text-xl font-semibold mb-2">Monthly Policy Reconciliation</h2>
        <p className="text-sm text-gray-400 mb-4">
          For each month, this checks whether the full month total equals the sum of all current
          policy buckets.
        </p>
        <p className="text-sm text-gray-400 mb-4">
          Simple reading guide: if a month is marked reconciled, the current review buckets close cleanly
          for that month. This is still a read-only check, not live dashboard truth.
        </p>

        {loadError ? (
          <p className="text-sm text-gray-300">Could not load monthly policy reconciliation</p>
        ) : loading ? (
          <p className="text-sm text-gray-300">Loading monthly policy reconciliation...</p>
        ) : monthlyPolicyReconciliationRows.length === 0 ? (
          <p className="text-sm text-gray-300">No monthly reconciliation rows found</p>
        ) : (
          <div className="space-y-3">
            {monthlyPolicyReconciliationRows.map((row) => (
              <div
                key={row.billMonth}
                className={`rounded-xl border px-4 py-3 ${
                  row.reconciled ? "border-white/10 bg-white/5" : "border-red-500/40 bg-red-500/10"
                }`}
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
                  <div>
                    <p className="text-xs text-gray-400">Bill Month</p>
                    <p className="mt-1 text-sm text-white">{row.billMonth}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Full Month Total</p>
                    <p className="mt-1 text-sm text-white">{formatCurrency(row.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Net Sale Candidate</p>
                    <p className="mt-1 text-sm text-white">{formatCurrency(row.netSaleCandidateAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Excluded Cancelled</p>
                    <p className="mt-1 text-sm text-white">{formatCurrency(row.excludedCancelledAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Excluded Complimentary</p>
                    <p className="mt-1 text-sm text-white">
                      {formatCurrency(row.excludedComplimentaryAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Excluded Sales Return</p>
                    <p className="mt-1 text-sm text-white">
                      {formatCurrency(row.excludedSalesReturnAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Unresolved Memo</p>
                    <p className="mt-1 text-sm text-white">{formatCurrency(row.unresolvedMemoAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Unresolved Other</p>
                    <p className="mt-1 text-sm text-white">{formatCurrency(row.unresolvedOtherAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Month Check</p>
                    <p className="mt-1 text-sm text-white">{row.reconciled ? "Reconciled" : "Mismatch"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Difference</p>
                    <p className="mt-1 text-sm text-white">{formatCurrency(row.differenceAmount)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderUploadAttributionPolicyCheckSection = () => {
    const uploadReconciliationHealthy =
      latestImportBreakdownRows.length > 0 &&
      latestImportBreakdownRows.every((row) => row.reconciled);

    return (
      <div
        id="upload-attribution-check"
        className={getSectionShellClass(
          latestImportBreakdownRows.length > 0 && uploadReconciliationHealthy ? "clean" : "needs-review"
        )}
      >
        <h2 className="text-xl font-semibold mb-2">Upload Attribution vs Policy Attribution Check</h2>
        <p className="text-sm text-gray-400 mb-2">
          Upload attribution shows what the file inserted. Policy attribution shows how Titan currently
          classifies those inserted rows. These are different concepts and can differ.
        </p>
        <p className="text-sm text-gray-400 mb-4">
          With the current schema, this attribution is exact because `sales_order_imports` stores
          `upload_log_id`.
        </p>
        <p className="text-sm text-gray-400 mb-4">
          Simple reading guide: a reconciled upload means the current review buckets add back to that
          upload&apos;s attributed amount. This does not promote anything into live truth.
        </p>

        {loadError ? (
          <p className="text-sm text-gray-300">Could not load upload attribution policy check</p>
        ) : loading ? (
          <p className="text-sm text-gray-300">Loading upload attribution policy check...</p>
        ) : latestImportBreakdownRows.length === 0 ? (
          <p className="text-sm text-gray-300">No imported sales-order uploads found</p>
        ) : (
          <div className="space-y-3">
            {latestImportBreakdownRows.map((row) => (
              <div
                key={row.uploadLogId}
                className={`rounded-xl border px-4 py-3 ${
                  row.reconciled ? "border-white/10 bg-white/5" : "border-red-500/40 bg-red-500/10"
                }`}
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
                  <div className="xl:col-span-2">
                    <p className="text-xs text-gray-400">Original File Name</p>
                    <p className="mt-1 text-sm text-white break-words">{row.originalFileName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Bill Date Coverage</p>
                    <p className="mt-1 text-sm text-white break-words">{row.dateCoverageText}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Attributed Amount</p>
                    <p className="mt-1 text-sm text-white">{row.exactAmountText}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Net Sale Candidate</p>
                    <p className="mt-1 text-sm text-white">{formatCurrency(row.netSaleCandidateAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Excluded Cancelled</p>
                    <p className="mt-1 text-sm text-white">{formatCurrency(row.excludedCancelledAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Excluded Complimentary</p>
                    <p className="mt-1 text-sm text-white">
                      {formatCurrency(row.excludedComplimentaryAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Excluded Sales Return</p>
                    <p className="mt-1 text-sm text-white">
                      {formatCurrency(row.excludedSalesReturnAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Unresolved Memo</p>
                    <p className="mt-1 text-sm text-white">{formatCurrency(row.unresolvedMemoAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Unresolved Other</p>
                    <p className="mt-1 text-sm text-white">{formatCurrency(row.unresolvedOtherAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Check</p>
                    <p className="mt-1 text-sm text-white">{row.reconciled ? "Reconciled" : "Mismatch"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Difference</p>
                    <p className="mt-1 text-sm text-white">{formatCurrency(row.differenceAmount)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderMemoResolutionReviewSection = () => {
    const cancelledMemoRowsCount = memoReviewRows.filter(
      (reviewRow) => reviewRow.memoReviewLabel === "cancelled_signal_review_only"
    ).length;
    const cancelledMemoAmount = memoReviewRows
      .filter((reviewRow) => reviewRow.memoReviewLabel === "cancelled_signal_review_only")
      .reduce((sum, reviewRow) => sum + getDisplayAmount(reviewRow.row), 0);
    const possibleLaterCandidateCount = memoReviewRows.filter(
      (reviewRow) => reviewRow.matchCandidates.length > 0
    ).length;
    const noCandidateHintCount = memoReviewRows.filter(
      (reviewRow) => reviewRow.matchCandidates.length === 0
    ).length;

    return (
      <div id="memo-resolution-review" className={getSectionShellClass(memoReviewRows.length > 0 ? "needs-review" : "clean")}>
        <h2 className="text-xl font-semibold mb-2">Memo Resolution Review</h2>
        <p className="text-sm text-gray-400 mb-4">
          Read-only review only. Memo rows remain unresolved, stay excluded from live sales truth, and
          are not linked into current business totals.
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
            Memo Rows: {memoReviewRows.length}
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
            Has Hint Candidates: {possibleLaterCandidateCount}
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
            No Hint Candidates: {noCandidateHintCount}
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
            Memo Still Excluded From Live Truth
          </div>
        </div>
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 mb-6">
          <div className="space-y-2 text-sm text-gray-300">
            {getMemoResolutionReviewNotes().map((note) => (
              <p key={note}>- {note}</p>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-gray-400 mb-2">Total Memo Rows</p>
            <h3 className="text-2xl font-bold">{memoReviewRows.length}</h3>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-gray-400 mb-2">Total Memo Amount</p>
            <h3 className="text-2xl font-bold">{formatCurrency(summaryCounts.memoUnresolvedAmount)}</h3>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-gray-400 mb-2">Cancelled Memo Rows</p>
            <h3 className="text-2xl font-bold">{cancelledMemoRowsCount}</h3>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-gray-400 mb-2">Cancelled Memo Amount</p>
            <h3 className="text-2xl font-bold">{formatCurrency(cancelledMemoAmount)}</h3>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-gray-400 mb-2">Memo Rows With Heuristic Later Numeric Candidates</p>
            <h3 className="text-2xl font-bold">{possibleLaterCandidateCount}</h3>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-gray-400 mb-2">Memo Rows With No Candidate Hints</p>
            <h3 className="text-2xl font-bold">{noCandidateHintCount}</h3>
          </div>
        </div>

        {loadError ? (
          <p className="text-sm text-gray-300">Could not load memo review rows</p>
        ) : loading ? (
          <p className="text-sm text-gray-300">Loading memo review rows...</p>
        ) : memoReviewRows.length === 0 ? (
          <p className="text-sm text-gray-300">No memo rows found</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Higher hint confidence still does not mean an approved link, a candidate does not mean a
              finalized sale, and the reasons shown here are only investigation clues.
            </p>
            {memoReviewRows.map((reviewRow, index) => (
              <div
                key={`${reviewRow.row.id}-${index}`}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-400">Memo Review Label</p>
                    <p className="mt-1 inline-block rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white">
                      {getMemoReviewLabelText(reviewRow.memoReviewLabel)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Upload Log ID</p>
                    <p className="mt-1 text-sm text-white">{reviewRow.row.upload_log_id ?? "-"}</p>
                  </div>
                  <div className="xl:col-span-2">
                    <p className="text-xs text-gray-400">File Reference</p>
                    <p className="mt-1 text-sm text-white break-words">{reviewRow.uploadFileName || "-"}</p>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-gray-200">
                    Bill Date: {formatBillDate(reviewRow.row.bill_date)}
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-gray-200">
                    Status: {reviewRow.row.status || "-"}
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-gray-200">
                    Effective Total: {formatCurrency(reviewRow.row.effective_total)}
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-gray-200">
                    Payment Type: {reviewRow.row.payment_type || "-"}
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-gray-200">
                    Hint Candidates: {reviewRow.matchCandidates.length}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6 mb-4">
                  <div>
                    <p className="text-xs text-gray-400">Bill Date</p>
                    <p className="mt-1 text-sm text-white">{formatBillDate(reviewRow.row.bill_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Status</p>
                    <p className="mt-1 text-sm text-white break-words">{reviewRow.row.status || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Customer Name</p>
                    <p className="mt-1 text-sm text-white break-words">{reviewRow.row.customer_name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Customer Phone</p>
                    <p className="mt-1 text-sm text-white break-words">{reviewRow.row.customer_phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Order Type</p>
                    <p className="mt-1 text-sm text-white break-words">{reviewRow.row.order_type || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Sub Order Type</p>
                    <p className="mt-1 text-sm text-white break-words">{reviewRow.row.sub_order_type || "-"}</p>
                  </div>
                  <div className="xl:col-span-2">
                    <p className="text-xs text-gray-400">Items Summary</p>
                    <p className="mt-1 text-sm text-white break-words">
                      {getItemsSummary(reviewRow.row.items_text)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Payment Type</p>
                    <p className="mt-1 text-sm text-white break-words">{reviewRow.row.payment_type || "-"}</p>
                  </div>
                  <div className="xl:col-span-2">
                    <p className="text-xs text-gray-400">Payment Description</p>
                    <p className="mt-1 text-sm text-white break-words">
                      {reviewRow.row.payment_description || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Grand Total</p>
                    <p className="mt-1 text-sm text-white">{formatCurrency(reviewRow.row.grand_total)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Effective Total</p>
                    <p className="mt-1 text-sm text-white">{formatCurrency(reviewRow.row.effective_total)}</p>
                  </div>
                  <div className="xl:col-span-3">
                    <p className="text-xs text-gray-400">Parse Note</p>
                    <p className="mt-1 text-sm text-white break-words">{reviewRow.row.parse_note || "-"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-2">
                    Heuristic Later Numeric Candidates (Investigative Hints Only)
                  </p>
                  {reviewRow.matchCandidates.length === 0 ? (
                    <p className="text-sm text-gray-300">No heuristic later numeric candidates found</p>
                  ) : (
                    <div className="space-y-2">
                      {reviewRow.matchCandidates.map((candidate, candidateIndex) => (
                        <div
                          key={`${candidate.orderNo}-${candidateIndex}`}
                          className="rounded-lg border border-white/10 px-3 py-2"
                        >
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
                            <div>
                              <p className="text-xs text-gray-400">Order No</p>
                              <p className="mt-1 text-sm text-white break-words">{candidate.orderNo}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Hint Confidence</p>
                              <p className="mt-1 inline-block rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white">
                                {candidate.confidence}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Bill Date</p>
                              <p className="mt-1 text-sm text-white">{formatBillDate(candidate.billDate)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Effective Total</p>
                              <p className="mt-1 text-sm text-white">{formatCurrency(candidate.effectiveTotal)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Customer Name</p>
                              <p className="mt-1 text-sm text-white break-words">{candidate.customerName || "-"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Customer Phone</p>
                              <p className="mt-1 text-sm text-white break-words">{candidate.customerPhone || "-"}</p>
                            </div>
                            <div className="xl:col-span-2">
                              <p className="text-xs text-gray-400">Items Summary</p>
                              <p className="mt-1 text-sm text-white break-words">{candidate.itemsSummary}</p>
                            </div>
                            <div className="xl:col-span-4">
                              <p className="text-xs text-gray-400">Why This Hint Appeared</p>
                              <p className="mt-1 text-sm text-white break-words">
                                {getMemoCandidateExplanationText(candidate)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCurrentReviewSnapshotSection = () => {
    const monthReconciliationHealthy =
      monthlyPolicyReconciliationRows.length > 0 &&
      monthlyPolicyReconciliationRows.every((row) => row.reconciled);
    const uploadReconciliationHealthy =
      latestImportBreakdownRows.length > 0 &&
      latestImportBreakdownRows.every((row) => row.reconciled);
    const ambiguousSettlementReviewPresent =
      partPaymentRows.length > 0 || grandTotalZeroRows.length > 0 || differentTotalRows.length > 0;
    const promotionReadinessReasons: string[] = [];

    if (!monthReconciliationHealthy) {
      promotionReadinessReasons.push("month-wise review checks are not fully clean yet");
    }

    if (!uploadReconciliationHealthy) {
      promotionReadinessReasons.push("upload-wise review checks are not fully clean yet");
    }

    if (summaryCounts.memoUnresolvedRowsCount > 0) {
      promotionReadinessReasons.push(
        `memo remains unresolved in ${summaryCounts.memoUnresolvedRowsCount} row${summaryCounts.memoUnresolvedRowsCount === 1 ? "" : "s"}`
      );
    }

    if (ambiguousSettlementReviewPresent) {
      promotionReadinessReasons.push("ambiguous settlement review still has rows to read");
    }

    const notReadyForPromotion = promotionReadinessReasons.length > 0;

    return (
      <div id="current-review-snapshot" className="rounded-2xl border border-white/20 bg-white/[0.02] p-6 mb-4 scroll-mt-6">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">Top Review Context</p>
          <h2 className="text-xl font-semibold mb-2">Current Review Snapshot</h2>
        </div>
        <p className="text-sm text-gray-400 mb-3">
          Read-only summary of the current review position. This is for checking the review state only,
          not for live dashboard or final business truth.
        </p>
        <p className="text-sm text-amber-200/90 mb-4">
          Review only reminder: these numbers help explain the current review position, but they are not
          live dashboard truth or a promoted final sales policy.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
            Net Sale Candidate Total: {formatCurrency(summaryCounts.netSaleCandidateAmount)}
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
            Memo Unresolved: {summaryCounts.memoUnresolvedRowsCount} rows / {formatCurrency(summaryCounts.memoUnresolvedAmount)}
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
            Months: {monthlyPolicyReconciliationRows.length > 0 && monthReconciliationHealthy ? "Reconciled" : "Needs Check"}
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
            Uploads: {latestImportBreakdownRows.length > 0 && uploadReconciliationHealthy ? "Reconciled" : "Needs Check"}
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
            Memo Excluded From Live Truth
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 mb-4">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500 mb-3">Needs Attention First</p>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
              Months: {monthlyPolicyReconciliationRows.length === 0 ? "No Review Rows Yet" : monthReconciliationHealthy ? "Clean" : "Needs Check"}
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
              Uploads: {latestImportBreakdownRows.length === 0 ? "No Review Rows Yet" : uploadReconciliationHealthy ? "Clean" : "Needs Check"}
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
              Memo Unresolved: {summaryCounts.memoUnresolvedRowsCount} rows
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
              Ambiguous Settlement Review: {ambiguousSettlementReviewPresent ? "Present" : "None"}
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
              Memo: Still Excluded From Live Truth
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-4 mb-4">
          <p className="text-xs uppercase tracking-[0.18em] text-amber-200/80 mb-3">
            Promotion Readiness Snapshot
          </p>
          <p className="text-sm text-white mb-2">
            {notReadyForPromotion
              ? "Not ready for live promotion yet"
              : "Closer to promotion readiness, but still review-only for now"}
          </p>
          <p className="text-sm text-gray-300 mb-3">
            Read-only guidance only. This does not promote anything into live dashboard truth.
          </p>
          <div className="space-y-2 text-sm text-gray-300">
            {notReadyForPromotion ? (
              <>
                <p>Why not ready yet:</p>
                {promotionReadinessReasons.map((reason) => (
                  <p key={reason}>- {reason}</p>
                ))}
                <p>- memo still remains excluded from live sales truth while review continues</p>
              </>
            ) : (
              <>
                <p>- month-wise review checks are currently clean</p>
                <p>- upload-wise review checks are currently clean</p>
                <p>- memo is still handled as excluded review-only context, not live sales truth</p>
              </>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-300 mb-4">
          <p>
            - Current proposed net sale candidate total:{" "}
            <span className="text-white">{formatCurrency(summaryCounts.netSaleCandidateAmount)}</span>
          </p>
          <p>
            - Memo rows still unresolved:{" "}
            <span className="text-white">{summaryCounts.memoUnresolvedRowsCount}</span>
          </p>
          <p>
            - Memo unresolved amount:{" "}
            <span className="text-white">{formatCurrency(summaryCounts.memoUnresolvedAmount)}</span>
          </p>
          <p>
            - Month-wise reconciliation check:{" "}
            <span className="text-white">
              {monthlyPolicyReconciliationRows.length === 0
                ? "No month review rows loaded yet"
                : monthReconciliationHealthy
                  ? "All current review months are closing cleanly"
                  : "Some current review months still need checking"}
            </span>
          </p>
          <p>
            - Upload-wise reconciliation check:{" "}
            <span className="text-white">
              {latestImportBreakdownRows.length === 0
                ? "No upload review rows loaded yet"
                : uploadReconciliationHealthy
                  ? "All current review uploads are closing cleanly"
                  : "Some current review uploads still need checking"}
            </span>
          </p>
          <p>
            - Memo status:{" "}
            <span className="text-white">
              still unresolved and excluded from live sales truth; memo hints remain read-only
              investigative hints only
            </span>
          </p>
        </div>
      </div>
    );
  };

  const renderKeyRowFamilySnapshotSection = () => {
    const familyCards = [
      {
        title: "Regular",
        href: "#regular-orders",
        countLabel: `${summaryCounts.regularOrderMainCount} regular main rows`,
        detail:
          "Use this family to scan the normal numeric order rows before later policy decisions.",
        cue: "Current Main Family",
        sectionState: "neutral" as const,
      },
      {
        title: "Memo",
        href: "#memo-unresolved-rows",
        countLabel: `${summaryCounts.memoUnresolvedRowsCount} unresolved memo rows`,
        detail:
          "Memo remains excluded from live truth. Hints stay investigative only while review continues.",
        cue:
          summaryCounts.memoUnresolvedRowsCount > 0 ? "Needs Review" : "None Open",
        sectionState:
          summaryCounts.memoUnresolvedRowsCount > 0 ? ("needs-review" as const) : ("clean" as const),
      },
      {
        title: "Complimentary",
        href: "#complimentary-orders",
        countLabel: `${summaryCounts.complimentaryExcludedRowsCount} excluded complimentary rows`,
        detail:
          "Tracked separately so complimentary activity stays out of the current proposed sales total.",
        cue:
          summaryCounts.complimentaryExcludedRowsCount > 0 ? "Excluded Family" : "None Flagged",
        sectionState: "clean" as const,
      },
      {
        title: "Sales Return",
        href: "#sales-return-orders",
        countLabel: `${summaryCounts.salesReturnExcludedRowsCount} excluded sales return rows`,
        detail:
          "Use this family to confirm return activity stays separate from the current proposed sales total.",
        cue:
          summaryCounts.salesReturnExcludedRowsCount > 0 ? "Excluded Family" : "None Flagged",
        sectionState: "clean" as const,
      },
      {
        title: "Cancelled",
        href: "#cancelled-orders",
        countLabel: `${summaryCounts.cancelledExcludedRowsCount} excluded cancelled rows`,
        detail:
          "Use this family to confirm cancellation signals before any future business rule decision.",
        cue:
          summaryCounts.cancelledExcludedRowsCount > 0 ? "Excluded Family" : "None Flagged",
        sectionState: "clean" as const,
      },
      {
        title: "Part Payment",
        href: "#part-payment-sale-review",
        countLabel: `${summaryCounts.partPaymentRowsCount} Part Payment rows`,
        detail:
          "These rows stay in current sale review, but settlement detail may still be extractable, unavailable, or ambiguous.",
        cue:
          summaryCounts.partPaymentRowsCount > 0 ? "Settlement Review" : "None Flagged",
        sectionState:
          summaryCounts.partPaymentRowsCount > 0 ? ("needs-review" as const) : ("clean" as const),
      },
      {
        title: "Fallback-Total Attention",
        href: "#fallback-total-attention-rows",
        countLabel: `${summaryCounts.grandTotalZeroCount} fallback-total attention rows`,
        detail:
          "These are the rows where grand_total is zero or empty, so effective_total may be carrying the usable amount.",
        cue:
          summaryCounts.grandTotalZeroCount > 0 ? "Needs Review" : "None Flagged",
        sectionState:
          summaryCounts.grandTotalZeroCount > 0 ? ("needs-review" as const) : ("clean" as const),
      },
    ];

    return (
      <div id="key-row-family-snapshot" className="rounded-2xl border border-white/20 bg-white/[0.02] p-6 mb-4 scroll-mt-6">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">Key Row Family Scan</p>
          <h2 className="text-xl font-semibold mb-2">Key Row Family Snapshot</h2>
          <p className="text-sm text-gray-400">
            Use this as the fastest read across the row families that most often affect review posture:
            regular, memo, complimentary, sales return, cancelled, Part Payment, and fallback-total
            attention rows.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {familyCards.map((card) => (
            <a
              key={card.title}
              href={card.href}
              className={`${getSnapshotCardClass(card.sectionState)} block transition hover:bg-white/[0.07]`}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">{card.title}</h3>
                <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-gray-200">
                  {card.cue}
                </span>
              </div>
              <p className="text-base font-semibold text-white mb-2">{card.countLabel}</p>
              <p className="text-sm text-gray-300">{card.detail}</p>
            </a>
          ))}
        </div>
      </div>
    );
  };

  const renderReviewStatusLegendSection = () => {
    return (
      <div id="review-status-legend" className="rounded-2xl border border-white/20 bg-white/[0.02] p-6 mb-6 scroll-mt-6">
        <h2 className="text-xl font-semibold mb-2">Review Status Legend</h2>
        <p className="text-sm text-gray-400 mb-4">
          Read-only guide for what the current review states mean on this page. This helps explain the
          review position only and does not change live business truth.
        </p>

        <div className="space-y-3 text-sm text-gray-300">
          <p>
            - <span className="text-white">Net sale candidate:</span> a row currently included in the
            read-only proposed sales review, but not automatically promoted into live dashboard truth.
          </p>
          <p>
            - <span className="text-white">Unresolved memo:</span> a memo row still under review. It
            remains unresolved and excluded from live sales truth.
          </p>
          <p>
            - <span className="text-white">Excluded cancelled:</span> a row currently treated as
            cancelled and kept out of the read-only proposed sales total.
          </p>
          <p>
            - <span className="text-white">Excluded complimentary:</span> a complimentary row currently
            kept out of the read-only proposed sales total.
          </p>
          <p>
            - <span className="text-white">Excluded sales return:</span> a sales return row currently
            kept out of the read-only proposed sales total.
          </p>
        </div>
      </div>
    );
  };

  const renderHowToUseThisPageSection = () => {
    return (
      <div className="rounded-2xl border border-white/20 bg-white/[0.02] p-6 mb-4">
        <h2 className="text-xl font-semibold mb-2">How To Use This Page</h2>
        <div className="space-y-2 text-sm text-gray-300">
          <p>- Start with Current Review Snapshot for the quickest read of the current review position.</p>
          <p>- Use Key Row Family Snapshot next for the fastest scan across regular, memo, complimentary, sales return, cancelled, Part Payment, and fallback-total attention rows.</p>
          <p>- Use Review Status Legend to understand what each review bucket means.</p>
          <p>- Use Memo Resolution Review only for investigation. Memo hints remain investigative hints only.</p>
          <p>- Keep this page as read-only review context, not live dashboard truth.</p>
        </div>
      </div>
    );
  };

  const renderSectionJumpBar = () => {
    const monthReconciliationHealthy =
      monthlyPolicyReconciliationRows.length > 0 &&
      monthlyPolicyReconciliationRows.every((row) => row.reconciled);
    const uploadReconciliationHealthy =
      latestImportBreakdownRows.length > 0 &&
      latestImportBreakdownRows.every((row) => row.reconciled);
    const ambiguousSettlementReviewPresent =
      partPaymentRows.length > 0 || grandTotalZeroRows.length > 0 || differentTotalRows.length > 0;

    const sectionLinks = [
      { href: "#current-review-snapshot", label: "Current Review Snapshot", cue: "Start Here" },
      { href: "#review-status-legend", label: "Review Status Legend", cue: "Reference" },
      {
        href: "#memo-resolution-review",
        label: "Memo Resolution Review",
        cue: memoReviewRows.length > 0 ? "Has Hints To Review" : "No Memo Rows",
      },
      {
        href: "#monthly-policy-reconciliation",
        label: "Monthly Policy Reconciliation",
        cue:
          monthlyPolicyReconciliationRows.length === 0
            ? "No Review Rows Yet"
            : monthReconciliationHealthy
              ? "Clean"
              : "Needs Review",
      },
      {
        href: "#upload-attribution-check",
        label: "Upload Attribution Check",
        cue:
          latestImportBreakdownRows.length === 0
            ? "No Review Rows Yet"
            : uploadReconciliationHealthy
              ? "Clean"
              : "Needs Review",
      },
      { href: "#net-sales-candidate-rows", label: "Net Sales Candidate Rows", cue: "Review Detail" },
      {
        href: "#memo-unresolved-rows",
        label: "Memo Unresolved Rows",
        cue: memoUnresolvedRows.length > 0 ? "Needs Review" : "None Open",
      },
      {
        href: "#ambiguous-settlement-review",
        label: "Ambiguous Settlement Review",
        cue: ambiguousSettlementReviewPresent ? "Needs Review" : "None Flagged",
      },
    ];

    return (
      <div className="rounded-2xl border border-white/20 bg-white/[0.02] p-4 mb-4">
        <p className="text-sm text-gray-400 mb-3">Jump to a review section:</p>
        <div className="flex flex-wrap gap-2">
          {sectionLinks.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200 hover:bg-white/10"
            >
              <span>{section.label}</span>
              <span className="ml-2 rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-gray-300">
                {section.cue}
              </span>
            </a>
          ))}
        </div>
      </div>
    );
  };

  const ambiguousSettlementRows = sortLatestRows(
    [...partPaymentRows, ...grandTotalZeroRows, ...differentTotalRows].filter(
      (row, index, array) => array.findIndex((candidate) => candidate.id === row.id) === index
    )
  ).slice(0, 50);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Sales Truth Review</h1>
        <p className="text-gray-300 mb-8">
          Read-only review page for understanding how imported Order Listing transactions may fit later
          business sales rules.
        </p>

        {!loadError && !loading && renderCurrentReviewSnapshotSection()}
        {!loadError && !loading && renderKeyRowFamilySnapshotSection()}
        {!loadError && !loading && renderHowToUseThisPageSection()}
        {!loadError && !loading && renderSectionJumpBar()}
        {!loadError && !loading && renderReviewStatusLegendSection()}

        <div className="rounded-2xl border border-white/20 p-6 mb-6">
          <p className="text-sm text-gray-300">
            Current review policy view:
          </p>
          <div className="space-y-2 text-sm text-gray-300 mt-3">
            <p>- numeric Part Payment rows are included as sales</p>
            <p>- cancelled rows are excluded</p>
            <p>- complimentary rows are excluded</p>
            <p>- sales return rows are excluded</p>
            <p>- memo rows remain unresolved and excluded from live sales truth until a future approved rule exists</p>
          </div>
          <p className="text-sm text-gray-300 mt-3">
            Titan still does not assume it fully knows the cash, card, due, or other split settlement
            details unless they are clearly visible in the export text.
          </p>
          <p className="text-sm text-gray-300 mt-3">
            Bucket priority rule:
            `unresolved_memo` → `excluded_complimentary` → `excluded_sales_return` →
            `excluded_cancelled` → `net_sale_candidate` → `unresolved_other`
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Total Rows In sales_order_imports</p>
            <h2 className="text-2xl font-bold">{summaryCounts.totalRows}</h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Total Effective Total Across All Rows</p>
            <h2 className="text-2xl font-bold">
              {formatCurrency(summaryCounts.totalEffectiveTotalAllRows)}
            </h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Total Effective Total For Net Sale Candidate</p>
            <h2 className="text-2xl font-bold">{formatCurrency(summaryCounts.netSaleCandidateAmount)}</h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Total Effective Total For Excluded Cancelled</p>
            <h2 className="text-2xl font-bold">{formatCurrency(summaryCounts.cancelledExcludedAmount)}</h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Total Effective Total For Excluded Complimentary</p>
            <h2 className="text-2xl font-bold">
              {formatCurrency(summaryCounts.complimentaryExcludedAmount)}
            </h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Total Effective Total For Excluded Sales Return</p>
            <h2 className="text-2xl font-bold">
              {formatCurrency(summaryCounts.salesReturnExcludedAmount)}
            </h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Total Effective Total For Unresolved Memo</p>
            <h2 className="text-2xl font-bold">{formatCurrency(summaryCounts.memoUnresolvedAmount)}</h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Total Effective Total For Unresolved Other</p>
            <h2 className="text-2xl font-bold">
              {formatCurrency(summaryCounts.unresolvedOtherAmount)}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-6">
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Net Sale Candidate Rows Count</p>
            <h2 className="text-2xl font-bold">{summaryCounts.netSaleCandidateRowsCount}</h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Net Sales Candidate Amount</p>
            <h2 className="text-2xl font-bold">{formatCurrency(summaryCounts.netSaleCandidateAmount)}</h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Cancelled Excluded Rows Count</p>
            <h2 className="text-2xl font-bold">{summaryCounts.cancelledExcludedRowsCount}</h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Cancelled Excluded Amount</p>
            <h2 className="text-2xl font-bold">{formatCurrency(summaryCounts.cancelledExcludedAmount)}</h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Complimentary Excluded Rows Count</p>
            <h2 className="text-2xl font-bold">{summaryCounts.complimentaryExcludedRowsCount}</h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Complimentary Excluded Amount</p>
            <h2 className="text-2xl font-bold">
              {formatCurrency(summaryCounts.complimentaryExcludedAmount)}
            </h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Sales Return Excluded Rows Count</p>
            <h2 className="text-2xl font-bold">{summaryCounts.salesReturnExcludedRowsCount}</h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Sales Return Excluded Amount</p>
            <h2 className="text-2xl font-bold">
              {formatCurrency(summaryCounts.salesReturnExcludedAmount)}
            </h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Memo Unresolved Rows Count</p>
            <h2 className="text-2xl font-bold">{summaryCounts.memoUnresolvedRowsCount}</h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Memo Unresolved Amount</p>
            <h2 className="text-2xl font-bold">{formatCurrency(summaryCounts.memoUnresolvedAmount)}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-6">
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Total Rows</p>
            <h2 className="text-2xl font-bold">{summaryCounts.totalRows}</h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Regular Order Main Count</p>
            <h2 className="text-2xl font-bold">{summaryCounts.regularOrderMainCount}</h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Advance Order Main Count</p>
            <h2 className="text-2xl font-bold">{summaryCounts.advanceOrderMainCount}</h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Memo Special Count</p>
            <h2 className="text-2xl font-bold">{summaryCounts.memoSpecialCount}</h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Complimentary Count</p>
            <h2 className="text-2xl font-bold">{summaryCounts.complimentaryCount}</h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Sales Return Count</p>
            <h2 className="text-2xl font-bold">{summaryCounts.salesReturnCount}</h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Cancelled Rows Count</p>
            <h2 className="text-2xl font-bold">{summaryCounts.cancelledRowsCount}</h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Payment Split Child Count</p>
            <h2 className="text-2xl font-bold">{summaryCounts.paymentSplitChildCount}</h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Part Payment Rows Count</p>
            <h2 className="text-2xl font-bold">{summaryCounts.partPaymentRowsCount}</h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Part Payment Valid Sale Rows Count</p>
            <h2 className="text-2xl font-bold">{summaryCounts.partPaymentValidSaleRowsCount}</h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Rows With Grand Total = 0</p>
            <h2 className="text-2xl font-bold">{summaryCounts.grandTotalZeroCount}</h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Rows Where Effective Total Differs</p>
            <h2 className="text-2xl font-bold">
              {summaryCounts.effectiveVsGrandTotalDifferenceCount}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Part Payment Rows Count</p>
            <h2 className="text-2xl font-bold">{summaryCounts.partPaymentRowsCount}</h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Extractable Payment Split Rows Count</p>
            <h2 className="text-2xl font-bold">{summaryCounts.extractablePaymentSplitRowsCount}</h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Unavailable Payment Split Rows Count</p>
            <h2 className="text-2xl font-bold">{summaryCounts.unavailablePaymentSplitRowsCount}</h2>
          </div>
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Ambiguous Payment Text Rows Count</p>
            <h2 className="text-2xl font-bold">{summaryCounts.ambiguousPaymentTextRowsCount}</h2>
          </div>
        </div>

        {loadError && (
          <div className="rounded-2xl border border-white/20 p-6 mb-6">
            <p className="text-sm text-gray-300">Could not load sales truth review data right now.</p>
          </div>
        )}

        {!loadError && loading && (
          <div className="rounded-2xl border border-white/20 p-6 mb-6">
            <p className="text-sm text-gray-300">Loading sales truth review data...</p>
          </div>
        )}

        <div className="space-y-6">
          {renderMemoResolutionReviewSection()}
          {renderMonthlyPolicyReconciliationSection()}
          {renderUploadAttributionPolicyCheckSection()}
          {renderBreakdownSection(
            "Net Sales Candidate Amount By Month",
            "This shows where the current proposed net sales amount is coming from month by month.",
            netSalesByMonthRows,
            "Bill Month",
            "No net sales month breakdown found"
          )}
          {renderBreakdownSection(
            "Verification Breakdown By Bill Month",
            "Read-only verification breakdown across all imported order rows by bill month.",
            monthBreakdownRows,
            "Bill Month",
            "No bill month breakdown found"
          )}
          {renderBreakdownSection(
            "Verification Breakdown By Source Family",
            "Read-only verification breakdown using transaction family from parse_note when available.",
            sourceFamilyBreakdownRows,
            "Source Family",
            "No source family breakdown found"
          )}
          {renderBreakdownSection(
            "Verification Breakdown By Sales Policy Bucket",
            "Read-only verification breakdown by the current proposed sales-policy bucket.",
            salesPolicyBreakdownRows,
            "Sales Policy Bucket",
            "No sales policy breakdown found",
            "Use this to see how imported rows are currently grouped in review. It explains the review mix only and is not live dashboard truth."
          )}
          {renderLatestImportsSection()}

          {renderRowsSection(
            "Net Sales Candidate Rows",
            "Latest 50 rows currently proposed for net sales inclusion under the read-only sales policy review.",
            netSaleCandidateRows,
            "No net sale candidate rows found",
            "Read these as the rows currently landing in the review total. This is still review-only and not a live promoted sales figure.",
            "net-sales-candidate-rows",
            [
              `Rows: ${summaryCounts.netSaleCandidateRowsCount}`,
              `Amount: ${formatCurrency(summaryCounts.netSaleCandidateAmount)}`,
              "Review Only",
            ],
            "clean"
          )}
          {renderRowsSection(
            "Regular Orders",
            "Latest 50 rows currently interpreted as regular main order rows.",
            regularOrders,
            "No regular order rows found",
            "Use this family as the main numeric order baseline before later inclusion or settlement questions are finalized.",
            "regular-orders",
            [
              `Rows: ${summaryCounts.regularOrderMainCount}`,
              regularOrders.length > 0 ? `Showing latest ${regularOrders.length}` : "No rows loaded",
              "Main Numeric Family",
            ]
          )}
          {renderRowsSection(
            "Advance Orders",
            "Latest 50 rows currently interpreted as advance-order style main rows.",
            advanceOrders,
            "No advance order rows found"
          )}
          {renderRowsSection(
            "Memo Orders",
            "Latest 50 rows where Order No shows a Memo-style transaction for read-only review. These rows are not approved live sales truth.",
            memoOrders,
            "No memo rows found"
          )}
          {renderRowsSection(
            "Memo Unresolved Rows",
            "Latest 50 memo rows that remain unresolved and excluded from live sales truth unless a future approved memo rule is defined.",
            memoUnresolvedRows,
            "No unresolved memo rows found",
            "Read these as memo rows still left open in review. They remain excluded from live sales truth, and memo hints stay investigative only.",
            "memo-unresolved-rows",
            [
              `Rows: ${summaryCounts.memoUnresolvedRowsCount}`,
              `Amount: ${formatCurrency(summaryCounts.memoUnresolvedAmount)}`,
              "Excluded From Live Truth",
            ],
            memoUnresolvedRows.length > 0 ? "needs-review" : "clean"
          )}
          {renderRowsSection(
            "Complimentary Orders",
            "Latest 50 rows where Order No suggests a complimentary transaction.",
            complimentaryOrders,
            "No complimentary rows found",
            "These rows are tracked separately so complimentary activity stays outside the current proposed sales total.",
            "complimentary-orders",
            [
              `Rows: ${summaryCounts.complimentaryExcludedRowsCount}`,
              `Amount: ${formatCurrency(summaryCounts.complimentaryExcludedAmount)}`,
              "Excluded In Review",
            ],
            "clean"
          )}
          {renderRowsSection(
            "Sales Return Orders",
            "Latest 50 rows where Order No suggests a sales return transaction.",
            salesReturnOrders,
            "No sales return rows found",
            "These rows are tracked separately so sales return activity stays outside the current proposed sales total.",
            "sales-return-orders",
            [
              `Rows: ${summaryCounts.salesReturnExcludedRowsCount}`,
              `Amount: ${formatCurrency(summaryCounts.salesReturnExcludedAmount)}`,
              "Excluded In Review",
            ],
            "clean"
          )}
          {renderRowsSection(
            "Cancelled Orders",
            "Latest 50 rows currently flagged as cancelled by status or stored parse note.",
            cancelledOrders,
            "No cancelled rows found",
            "Use this section to confirm which rows are currently staying out of the proposed sales total because Titan sees a cancellation signal.",
            "cancelled-orders",
            [
              `Rows: ${summaryCounts.cancelledExcludedRowsCount}`,
              `Amount: ${formatCurrency(summaryCounts.cancelledExcludedAmount)}`,
              "Excluded In Review",
            ],
            "clean"
          )}
          {renderRowsSection(
            "Payment Split Child Rows",
            "Latest 50 rows marked as payment split child rows. These are for trust review only.",
            paymentSplitChildRows,
            "No payment split child rows found"
          )}
          {renderPartPaymentRowsSection(
            "Part Payment Sale Review",
            "Latest 50 numeric sale rows where payment_type contains Part Payment. These remain valid sale candidates, but Titan is only checking whether payment split detail is clearly extractable from text.",
            partPaymentRows,
            "No Part Payment rows found",
            "Read this section as settlement-detail review only. These rows stay in the current sale review unless a later approved rule changes that.",
            "part-payment-sale-review",
            [
              `Rows: ${summaryCounts.partPaymentRowsCount}`,
              `Extractable: ${summaryCounts.extractablePaymentSplitRowsCount}`,
              `Unavailable: ${summaryCounts.unavailablePaymentSplitRowsCount}`,
              `Ambiguous: ${summaryCounts.ambiguousPaymentTextRowsCount}`,
            ],
            partPaymentRows.length > 0 ? "needs-review" : "clean"
          )}
          {renderRowsSection(
            "Fallback-Total Attention Rows",
            "Latest 50 rows where Grand Total is zero or empty, so fallback-style reading may be needed to understand the usable total.",
            grandTotalZeroRows,
            "No fallback-total attention rows found",
            "Use this section when effective_total may be carrying the usable order value instead of grand_total. This is a trust-check only and does not change the current review totals by itself.",
            "fallback-total-attention-rows",
            [
              `Rows: ${summaryCounts.grandTotalZeroCount}`,
              grandTotalZeroRows.length > 0 ? `Showing latest ${grandTotalZeroRows.length}` : "No rows loaded",
              grandTotalZeroRows.length > 0 ? "Needs Closer Reading" : "None Flagged",
            ],
            grandTotalZeroRows.length > 0 ? "needs-review" : "clean"
          )}
          {renderRowsSection(
            "Effective vs Grand Total Difference Rows",
            "Latest 50 rows where Effective Total differs from Grand Total by more than 1.",
            differentTotalRows,
            "No large total-difference rows found"
          )}
          {renderRowsSection(
            "Ambiguous Settlement Review",
            "Latest 50 rows where payment_type contains Part Payment, or Grand Total is zero or empty, or Effective Total differs from Grand Total by more than 1.",
            ambiguousSettlementRows,
            "No ambiguous settlement rows found",
            "Use this section to spot rows that may need closer reading. It is a trust-check view only and does not change current review totals by itself.",
            "ambiguous-settlement-review",
            [
              `Rows Shown: ${ambiguousSettlementRows.length}`,
              `Part Payment Rows: ${partPaymentRows.length}`,
              ambiguousSettlementRows.length > 0 ? "Needs Closer Reading" : "None Flagged",
            ],
            ambiguousSettlementRows.length > 0 ? "needs-review" : "clean"
          )}

          <div className="rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-semibold mb-2">Questions To Finalize</h2>
            <p className="text-sm text-gray-400 mb-4">
              Use this checklist to decide the final business-sales rules later.
            </p>

            <div className="space-y-2 text-sm text-gray-300">
              <p>- Decide whether cancelled orders should count in business sales or be excluded.</p>
              <p>- Decide whether memo rows should stay excluded or whether a future approved memo rule is needed.</p>
              <p>
                - Decide whether complimentary rows should count as revenue, count only as transactions,
                or stay excluded from sales totals.
              </p>
              <p>- Decide how sales return rows should reduce or adjust business totals.</p>
              <p>
                - Decide whether `effective_total` or `grand_total` should be primary for each
                transaction type.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
