import type { OrderListingDiagnostics } from "@/app/upload/sales/order-listing-diagnostics-panel";

type Props = {
  changedOverlapSummary: OrderListingDiagnostics["changedOverlapSummary"];
  changedOverlapReviews: OrderListingDiagnostics["changedOverlapReviews"];
};

export function ChangedOverlapReviewPanel({
  changedOverlapSummary,
  changedOverlapReviews,
}: Props) {
  return (
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
          <p className="text-white mt-1">{changedOverlapSummary.changedStatusRows}</p>
        </div>
        <div>
          <p className="text-gray-400">Changed Payment Rows</p>
          <p className="text-white mt-1">{changedOverlapSummary.changedPaymentRows}</p>
        </div>
        <div>
          <p className="text-gray-400">Changed Amount Rows</p>
          <p className="text-white mt-1">{changedOverlapSummary.changedAmountRows}</p>
        </div>
        <div>
          <p className="text-gray-400">Changed Cancellation Rows</p>
          <p className="text-white mt-1">{changedOverlapSummary.changedCancellationRows}</p>
        </div>
        <div>
          <p className="text-gray-400">Changed Customer Or Meta Rows</p>
          <p className="text-white mt-1">{changedOverlapSummary.changedCustomerMetaRows}</p>
        </div>
      </div>

      <div className="space-y-3">
        {changedOverlapReviews.map((review, index) => (
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
                <p className="text-white mt-1 break-words">{review.changedFieldNames.join(", ")}</p>
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
        This file was blocked because Titan found existing comparable orders with changed values. No
        old data was overwritten.
      </p>
    </div>
  );
}
