"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buildSalesTruthReviewDerivedData } from "@/lib/sales-truth-review/engine";
import { createEmptySummaryCounts } from "@/lib/sales-truth-review/policy";
import { supabase } from "@/lib/supabase";
import type {
  LatestImportBreakdownRow,
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

function getPanelClass(state: "needs-review" | "clean" | "neutral") {
  if (state === "needs-review") {
    return "rounded-2xl border border-amber-400/30 bg-amber-400/[0.05] p-5";
  }

  if (state === "clean") {
    return "rounded-2xl border border-white/10 bg-white/[0.04] p-5";
  }

  return "rounded-2xl border border-white/15 bg-white/[0.02] p-5";
}

export default function SalesTruthProtocolHandoffPage() {
  const [summaryCounts, setSummaryCounts] = useState<SummaryCounts>(createEmptySummaryCounts());
  const [salesPolicyBreakdownRows, setSalesPolicyBreakdownRows] = useState<VerificationBreakdownRow[]>([]);
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

        const derivedData = buildSalesTruthReviewDerivedData({
          rows: allRows,
          latestUploadLogs,
          uploadFileNameById: new Map<number, string | null>(),
          formatCurrency,
        });

        setSummaryCounts(derivedData.summaryCounts);
        setSalesPolicyBreakdownRows(derivedData.salesPolicyBreakdownRows);
        setLatestImportBreakdownRows(derivedData.latestImportBreakdownRows);
        setMonthlyPolicyReconciliationRows(derivedData.monthlyPolicyReconciliationRows);
        setLoadError(false);
      } catch {
        setSummaryCounts(createEmptySummaryCounts());
        setSalesPolicyBreakdownRows([]);
        setLatestImportBreakdownRows([]);
        setMonthlyPolicyReconciliationRows([]);
        setLoadError(true);
      }

      setLoading(false);
    };

    loadReviewData();
  }, []);

  const monthReconciliationHealthy =
    monthlyPolicyReconciliationRows.length > 0 &&
    monthlyPolicyReconciliationRows.every((row) => row.reconciled);
  const uploadReconciliationHealthy =
    latestImportBreakdownRows.length > 0 &&
    latestImportBreakdownRows.every((row) => row.reconciled);
  const salesPolicyPostureVisible = salesPolicyBreakdownRows.length > 0;
  const transactionFamilyPostureVisible =
    summaryCounts.regularOrderMainCount +
      summaryCounts.partPaymentRowsCount +
      summaryCounts.memoSpecialCount +
      summaryCounts.complimentaryCount +
      summaryCounts.salesReturnCount +
      summaryCounts.cancelledRowsCount +
      summaryCounts.grandTotalZeroCount >
    0;
  const settlementStillLimited =
    summaryCounts.unavailablePaymentSplitRowsCount > 0 ||
    summaryCounts.ambiguousPaymentTextRowsCount > 0;
  const unresolvedEvidenceCount =
    (summaryCounts.memoUnresolvedRowsCount > 0 ? 1 : 0) +
    (summaryCounts.unresolvedOtherRowsCount > 0 ? 1 : 0) +
    (settlementStillLimited ? 1 : 0);
  const strongEvidenceCount =
    (monthReconciliationHealthy ? 1 : 0) +
    (uploadReconciliationHealthy ? 1 : 0) +
    (salesPolicyPostureVisible ? 1 : 0) +
    (transactionFamilyPostureVisible ? 1 : 0);
  const handoffDraftReady =
    monthReconciliationHealthy &&
    uploadReconciliationHealthy &&
    salesPolicyPostureVisible &&
    transactionFamilyPostureVisible;

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-gray-500">Read-Only Protocol Handoff</p>
            <h1 className="mb-2 text-3xl font-bold">Protocol Handoff Draft</h1>
            <p className="max-w-3xl text-sm text-gray-300">
              This separate page packages the current review posture into the smallest calm handoff draft
              for any later explicit promotion discussion. It stays read-only, keeps memo unresolved,
              and does not approve or implement live promotion.
            </p>
          </div>

          <Link
            href="/sales-truth-review"
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
          >
            Back to Sales Truth Review
          </Link>
        </div>

        {loadError && (
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-300">Could not load the protocol handoff draft right now.</p>
          </div>
        )}

        {!loadError && loading && (
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-300">Loading protocol handoff draft...</p>
          </div>
        )}

        {!loadError && !loading && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/20 bg-white/[0.02] p-6">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-gray-500">What This Page Is For</p>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className={getPanelClass("neutral")}>
                  <h2 className="mb-2 text-lg font-semibold text-white">Keep The Main Page For Working Review</h2>
                  <p className="text-sm text-gray-300">
                    Use <span className="text-white">/sales-truth-review</span> for row-level inspection,
                    family scan paths, reconciliation details, memo investigation, and day-to-day review work.
                  </p>
                </div>
                <div className={getPanelClass("neutral")}>
                  <h2 className="mb-2 text-lg font-semibold text-white">Use This Page For Later Handoff Posture</h2>
                  <p className="text-sm text-gray-300">
                    This page keeps only the smallest handoff-ready structure: what already looks strong,
                    what remains unresolved, what still blocks live promotion, and what still needs later
                    explicit approval.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
                Strong Evidence: {strongEvidenceCount}
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
                Unresolved Evidence: {unresolvedEvidenceCount}
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
                Handoff Draft: {handoffDraftReady ? "Clearer" : "Still Early"}
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
                Read-Only
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Link
                href="/sales-truth-review#reconciliation-closure-snapshot"
                className={`${getPanelClass(handoffDraftReady ? "clean" : "neutral")} block transition hover:bg-white/[0.07]`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-white">Evidence Already Strong</h2>
                  <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-gray-200">
                    Review Foundation
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-300">
                  <p>- Month-wise reconciliation: {monthReconciliationHealthy ? "closing cleanly" : "still needs review"}</p>
                  <p>- Upload-wise reconciliation: {uploadReconciliationHealthy ? "closing cleanly" : "still needs review"}</p>
                  <p>- Sales-policy bucket posture: {salesPolicyPostureVisible ? "visible and internally readable" : "not yet visible"}</p>
                  <p>- Transaction-family posture: {transactionFamilyPostureVisible ? "visible enough for later discussion" : "not yet visible"}</p>
                </div>
                <p className="mt-3 text-sm text-gray-400">
                  Open the main review page to inspect the detailed evidence behind these items.
                </p>
              </Link>

              <Link
                href="/sales-truth-review#memo-unresolved-rows"
                className={`${getPanelClass(
                  summaryCounts.memoUnresolvedRowsCount > 0 ||
                    summaryCounts.unresolvedOtherRowsCount > 0 ||
                    settlementStillLimited
                    ? "needs-review"
                    : "clean"
                )} block transition hover:bg-white/[0.07]`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-white">Still Unresolved Evidence</h2>
                  <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-gray-200">
                    Needs Reading
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-300">
                  <p>- Memo unresolved rows: {summaryCounts.memoUnresolvedRowsCount}</p>
                  <p>- Unresolved-other rows: {summaryCounts.unresolvedOtherRowsCount}</p>
                  <p>- Settlement detail still limited: {settlementStillLimited ? "yes" : "currently quiet"}</p>
                  <p>- Part Payment settlement truth still stays separate from sales truth.</p>
                </div>
              </Link>

              <div className={getPanelClass("needs-review")}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-white">Current Blockers To Live Promotion</h2>
                  <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-gray-200">
                    Still Blocked
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-300">
                  <p>- Memo remains unresolved and excluded from live sales truth.</p>
                  <p>- Settlement-breakup truth is still limited and separate from sales truth.</p>
                  <p>- No explicit owner or business approval exists to move this review layer into live dashboard or profit logic.</p>
                </div>
              </div>

              <div className={getPanelClass(handoffDraftReady ? "clean" : "neutral")}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-white">Later Explicit Approval Still Required</h2>
                  <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-gray-200">
                    Decision Later
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-300">
                  <p>- Approve whether the current read-only policy posture should ever become live business truth.</p>
                  <p>- Approve final memo treatment before any live promotion.</p>
                  <p>- Approve any later relationship between payment-settlement logic and sales truth.</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-6">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-amber-200/80">Read-Only Boundary</p>
              <p className="text-sm text-white">
                This handoff draft is only a structured summary of the current review evidence.
              </p>
              <div className="mt-3 space-y-2 text-sm text-gray-300">
                <p>- It does not approve promotion.</p>
                <p>- It does not change dashboard or profit truth.</p>
                <p>- It does not settle memo.</p>
                <p>- It does not make payment-settlement certainty stronger than the export currently supports.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
