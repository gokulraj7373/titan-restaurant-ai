import { ChangedOverlapReviewPanel } from "@/app/upload/sales/changed-overlap-review-panel";

type UploadClassification =
  | "exact_duplicate"
  | "append_only"
  | "gap_fill"
  | "overlap_unchanged"
  | "overlap_with_changes"
  | "manual_review_needed"
  | "rejected_unknown_format";

type SuspiciousOrderReason =
  | "duplicate_in_incoming_file"
  | "changed_existing_order"
  | "unclear_key_state";

type ChangeReasonTag =
  | "status_changed"
  | "cancelled_flag_changed"
  | "payment_changed"
  | "amount_changed"
  | "charge_breakup_changed"
  | "customer_changed"
  | "order_meta_changed"
  | "unclear_change";

type OrderListingDiagnosticItem = {
  orderNo: string;
  reason: SuspiciousOrderReason;
};

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

type OrderListingTypeCounts = {
  regularOrderMainCount: number;
  advanceOrderMainCount: number;
  paymentSplitChildCount: number;
  memoSpecialCount: number;
  salesReturnCount: number;
  complimentaryCount: number;
  unknownSpecialCount: number;
  cancelledRowsCount: number;
};

export type OrderListingDiagnostics = {
  detectedFormat: "petpooja_order_listing";
  finalClassification: UploadClassification;
  totalParsedRows: number;
  incomingDistinctOrderCount: number;
  duplicateIncomingOrderCount: number;
  newOrderCount: number;
  unchangedExistingOrderCount: number;
  changedExistingOrderCount: number;
  minBillDate: string | null;
  maxBillDate: string | null;
  hasOverlappingExistingOrderValues: boolean;
  finalDecisionReason: string;
  suspiciousOrders: OrderListingDiagnosticItem[];
  typeCounts: OrderListingTypeCounts;
  changedOverlapSummary: ChangedOverlapSummaryCounts;
  changedOverlapReviews: ChangedOverlapReviewItem[];
};

type Props = {
  diagnostics: OrderListingDiagnostics;
};

function getClassificationOutcome(classification: UploadClassification) {
  if (classification === "append_only") {
    return {
      badgeLabel: "Allowed",
      badgeClasses: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
      title: "Titan found only new safe order rows in this file.",
      nextStep: "Titan can insert the new safe rows from this upload.",
    };
  }

  if (classification === "gap_fill") {
    return {
      badgeLabel: "Allowed",
      badgeClasses: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
      title: "Titan found safe missing order rows inside an already covered date range.",
      nextStep: "Titan can insert only the missing safe rows from this upload.",
    };
  }

  if (classification === "exact_duplicate") {
    return {
      badgeLabel: "Blocked",
      badgeClasses: "border-white/10 bg-white/5 text-gray-200",
      title: "This file already matches a previously imported Order Listing file.",
      nextStep: "No new rows will be inserted from this file.",
    };
  }

  if (classification === "overlap_unchanged") {
    return {
      badgeLabel: "Blocked",
      badgeClasses: "border-white/10 bg-white/5 text-gray-200",
      title: "The overlapping order rows already match existing data.",
      nextStep: "No new rows will be inserted because Titan did not find any changed or missing rows.",
    };
  }

  if (classification === "overlap_with_changes") {
    return {
      badgeLabel: "Blocked For Review",
      badgeClasses: "border-amber-500/30 bg-amber-500/10 text-amber-100",
      title: "Some comparable order rows changed against existing data.",
      nextStep: "Review the changed-overlap details below. Titan did not overwrite older rows.",
    };
  }

  if (classification === "manual_review_needed") {
    return {
      badgeLabel: "Blocked For Safety",
      badgeClasses: "border-amber-500/30 bg-amber-500/10 text-amber-100",
      title: "Titan could not classify this Order Listing file safely.",
      nextStep: "Review the suspicious-order clues below before trying another upload.",
    };
  }

  return {
    badgeLabel: "Unsupported",
    badgeClasses: "border-white/10 bg-white/5 text-gray-200",
    title: "This file could not be used for Order Listing import.",
    nextStep: "No rows will be inserted until Titan can classify the file safely.",
  };
}

export function OrderListingDiagnosticsPanel({ diagnostics }: Props) {
  const outcome = getClassificationOutcome(diagnostics.finalClassification);

  return (
    <div className="border border-white/10 rounded-lg p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-white">Order Listing Classification Diagnostics</h2>
        <p className="text-xs text-gray-400 mt-1">
          This is a compact debug view showing how Titan classified this Order Listing upload.
        </p>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">What This Result Means</h3>
            <p className="text-sm text-gray-200 mt-1">{outcome.title}</p>
          </div>
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${outcome.badgeClasses}`}
          >
            {outcome.badgeLabel}
          </span>
        </div>

        <p className="text-sm text-gray-300">{diagnostics.finalDecisionReason}</p>
        <p className="text-xs text-gray-400">{outcome.nextStep}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
        <div>
          <p className="text-gray-400">Detected Format</p>
          <p className="text-white mt-1">{diagnostics.detectedFormat}</p>
        </div>
        <div>
          <p className="text-gray-400">Final Classification</p>
          <p className="text-white mt-1">{diagnostics.finalClassification}</p>
        </div>
        <div>
          <p className="text-gray-400">Total Parsed Rows</p>
          <p className="text-white mt-1">{diagnostics.totalParsedRows}</p>
        </div>
        <div>
          <p className="text-gray-400">Incoming Distinct Order No Count</p>
          <p className="text-white mt-1">{diagnostics.incomingDistinctOrderCount}</p>
        </div>
        <div>
          <p className="text-gray-400">Duplicate Order No Count In Incoming File</p>
          <p className="text-white mt-1">{diagnostics.duplicateIncomingOrderCount}</p>
        </div>
        <div>
          <p className="text-gray-400">New Order Count</p>
          <p className="text-white mt-1">{diagnostics.newOrderCount}</p>
        </div>
        <div>
          <p className="text-gray-400">Unchanged Existing Order Count</p>
          <p className="text-white mt-1">{diagnostics.unchangedExistingOrderCount}</p>
        </div>
        <div>
          <p className="text-gray-400">Changed Existing Order Count</p>
          <p className="text-white mt-1">{diagnostics.changedExistingOrderCount}</p>
        </div>
        <div>
          <p className="text-gray-400">Min Bill Date Found</p>
          <p className="text-white mt-1">{diagnostics.minBillDate ?? "-"}</p>
        </div>
        <div>
          <p className="text-gray-400">Max Bill Date Found</p>
          <p className="text-white mt-1">{diagnostics.maxBillDate ?? "-"}</p>
        </div>
        <div>
          <p className="text-gray-400">Overlapping Existing Order No Values Found</p>
          <p className="text-white mt-1">
            {diagnostics.hasOverlappingExistingOrderValues ? "Yes" : "No"}
          </p>
        </div>
        <div>
          <p className="text-gray-400">Final Decision Reason</p>
          <p className="text-white mt-1">{diagnostics.finalDecisionReason}</p>
        </div>
        <div>
          <p className="text-gray-400">Regular Order Main Count</p>
          <p className="text-white mt-1">{diagnostics.typeCounts.regularOrderMainCount}</p>
        </div>
        <div>
          <p className="text-gray-400">Advance Order Main Count</p>
          <p className="text-white mt-1">{diagnostics.typeCounts.advanceOrderMainCount}</p>
        </div>
        <div>
          <p className="text-gray-400">Payment Split Child Count</p>
          <p className="text-white mt-1">{diagnostics.typeCounts.paymentSplitChildCount}</p>
        </div>
        <div>
          <p className="text-gray-400">Memo Special Count</p>
          <p className="text-white mt-1">{diagnostics.typeCounts.memoSpecialCount}</p>
        </div>
        <div>
          <p className="text-gray-400">Sales Return Count</p>
          <p className="text-white mt-1">{diagnostics.typeCounts.salesReturnCount}</p>
        </div>
        <div>
          <p className="text-gray-400">Complimentary Count</p>
          <p className="text-white mt-1">{diagnostics.typeCounts.complimentaryCount}</p>
        </div>
        <div>
          <p className="text-gray-400">Cancelled Rows Count</p>
          <p className="text-white mt-1">{diagnostics.typeCounts.cancelledRowsCount}</p>
        </div>
      </div>

      {diagnostics.finalClassification === "manual_review_needed" &&
        diagnostics.suspiciousOrders.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white">Suspicious Order Numbers</h3>
            <div className="space-y-2">
              {diagnostics.suspiciousOrders.map((item, index) => (
                <div
                  key={`${item.orderNo}-${item.reason}-${index}`}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm"
                >
                  <p className="text-white break-words">{item.orderNo}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      {diagnostics.finalClassification === "overlap_with_changes" &&
        diagnostics.changedOverlapReviews.length > 0 && (
          <ChangedOverlapReviewPanel
            changedOverlapSummary={diagnostics.changedOverlapSummary}
            changedOverlapReviews={diagnostics.changedOverlapReviews}
          />
        )}
    </div>
  );
}
