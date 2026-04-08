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

export function OrderListingDiagnosticsPanel({ diagnostics }: Props) {
  return (
    <div className="border border-white/10 rounded-lg p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-white">Order Listing Classification Diagnostics</h2>
        <p className="text-xs text-gray-400 mt-1">
          This is a compact debug view showing how Titan classified this Order Listing upload.
        </p>
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
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Changed Overlap Review</h3>
              <p className="text-xs text-gray-400 mt-1">
                Titan found existing comparable order rows with changed values. Review this before
                any future merge or correction decision.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
              <div>
                <p className="text-gray-400">Changed Status Rows</p>
                <p className="text-white mt-1">{diagnostics.changedOverlapSummary.changedStatusRows}</p>
              </div>
              <div>
                <p className="text-gray-400">Changed Payment Rows</p>
                <p className="text-white mt-1">{diagnostics.changedOverlapSummary.changedPaymentRows}</p>
              </div>
              <div>
                <p className="text-gray-400">Changed Amount Rows</p>
                <p className="text-white mt-1">{diagnostics.changedOverlapSummary.changedAmountRows}</p>
              </div>
              <div>
                <p className="text-gray-400">Changed Cancellation Rows</p>
                <p className="text-white mt-1">{diagnostics.changedOverlapSummary.changedCancellationRows}</p>
              </div>
              <div>
                <p className="text-gray-400">Changed Customer Or Meta Rows</p>
                <p className="text-white mt-1">
                  {diagnostics.changedOverlapSummary.changedCustomerMetaRows}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {diagnostics.changedOverlapReviews.map((review, index) => (
                <div
                  key={`${review.orderNo}-${index}`}
                  className="rounded-md border border-white/10 bg-white/5 p-3 space-y-3"
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
                    <div>
                      <p className="text-gray-400">Order No</p>
                      <p className="text-white mt-1 break-words">{review.orderNo}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Change Tags</p>
                      <p className="text-white mt-1 break-words">{review.reasonTags.join(", ")}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Incoming Bill Date</p>
                      <p className="text-white mt-1">{review.incomingBillDate ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Existing Bill Date</p>
                      <p className="text-white mt-1">{review.existingBillDate ?? "-"}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-gray-400">Changed Fields</p>
                      <p className="text-white mt-1 break-words">
                        {review.changedFieldNames.join(", ")}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {review.fieldDiffs.map((fieldDiff) => (
                      <div
                        key={`${review.orderNo}-${fieldDiff.fieldName}`}
                        className="rounded-md border border-white/10 px-3 py-2"
                      >
                        <p className="text-white text-sm break-words">{fieldDiff.fieldName}</p>
                        <p className="text-xs text-gray-400 mt-1 break-words">
                          Existing: {fieldDiff.existingValue}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 break-words">
                          Incoming: {fieldDiff.incomingValue}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400 border border-white/10 rounded-md p-3">
              This file was blocked because Titan found existing comparable orders with changed
              values. No old data was overwritten.
            </p>
          </div>
        )}
    </div>
  );
}
