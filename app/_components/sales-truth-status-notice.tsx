import Link from "next/link";

export function SalesTruthStatusNotice() {
  return (
    <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-4 mb-6">
      <p className="text-sm text-gray-200">
        Sales truth is still under review. For the current read-only truth-checking state, use{" "}
        <Link href="/sales-truth-review" className="text-amber-200 underline underline-offset-4">
          Sales Truth Review
        </Link>
        . No live sales truth promotion has happened yet.
      </p>
    </div>
  );
}
