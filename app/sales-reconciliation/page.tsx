"use client";

import { useEffect, useState } from "react";
import {
  loadSalesReconciliationDetails,
  type SalesOrderDiagnosticRow,
} from "@/lib/reconciliation-query/sales-reconciliation-details";
import {
  buildSalesReconciliationSummary,
  loadSalesReconciliationTotalOrders,
} from "@/lib/reconciliation-query/sales-reconciliation-summary";

export default function SalesReconciliationPage() {
  const [totalOrders, setTotalOrders] = useState(0);
  const [distinctOrders, setDistinctOrders] = useState(0);
  const [totalOrderLevelSales, setTotalOrderLevelSales] = useState(0);
  const [fallbackTotalRowsCount, setFallbackTotalRowsCount] = useState(0);
  const [differentTotalRowsCount, setDifferentTotalRowsCount] = useState(0);
  const [fallbackRows, setFallbackRows] = useState<SalesOrderDiagnosticRow[]>([]);
  const [differentRows, setDifferentRows] = useState<SalesOrderDiagnosticRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const loadDiagnostics = async () => {
      try {
        const [totalOrdersCount, reconciliationDetails] = await Promise.all([
          loadSalesReconciliationTotalOrders(),
          loadSalesReconciliationDetails(),
        ]);
        const reconciliationSummary = buildSalesReconciliationSummary(reconciliationDetails.allRows);

        setTotalOrders(totalOrdersCount);
        setDistinctOrders(reconciliationSummary.distinctOrders);
        setTotalOrderLevelSales(reconciliationSummary.totalOrderLevelSales);
        setFallbackTotalRowsCount(reconciliationSummary.fallbackTotalRowsCount);
        setDifferentTotalRowsCount(reconciliationSummary.differentTotalRowsCount);
        setFallbackRows(reconciliationDetails.fallbackRows);
        setDifferentRows(reconciliationDetails.differentRows);
        setLoadError(false);
      } catch {
        setLoadError(true);
        setTotalOrders(0);
        setDistinctOrders(0);
        setTotalOrderLevelSales(0);
        setFallbackTotalRowsCount(0);
        setDifferentTotalRowsCount(0);
        setFallbackRows([]);
        setDifferentRows([]);
      }

      setLoading(false);
    };

    loadDiagnostics();
  }, []);

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) {
      return "-";
    }

    return `Rs ${Number(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatBillDate = (value: string | null) => {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleDateString(undefined, {
      dateStyle: "medium",
    });
  };

  const renderSectionChips = (totalCount: number, visibleRowsCount: number) => {
    if (loadError) {
      return (
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
          Rows unavailable
        </span>
      );
    }

    if (loading) {
      return (
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
          Loading rows
        </span>
      );
    }

    if (totalCount === 0) {
      return (
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
          No flagged rows
        </span>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-100">
          {totalCount} flagged rows
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
          Showing latest {visibleRowsCount}
        </span>
      </div>
    );
  };

  const renderRowsSection = (
    title: string,
    description: string,
    summaryText: string,
    totalCount: number,
    rows: SalesOrderDiagnosticRow[],
    emptyMessage: string
  ) => {
    return (
      <div className="rounded-2xl border border-white/20 p-6">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">{title}</h2>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
          {renderSectionChips(totalCount, rows.length)}
        </div>

        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-sm text-gray-200">{summaryText}</p>
        </div>

        {loadError ? (
          <p className="text-sm text-gray-300">Could not load reconciliation rows</p>
        ) : loading ? (
          <p className="text-sm text-gray-300">Loading reconciliation rows...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-300">{emptyMessage}</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4 xl:grid-cols-6">
                  <div>
                    <p className="text-xs text-gray-400">Order No</p>
                    <p className="mt-1 text-sm text-white break-words">{row.order_no || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Bill Date</p>
                    <p className="mt-1 text-sm text-white">{formatBillDate(row.bill_date)}</p>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Sales Reconciliation</h1>
        <p className="text-gray-300 mb-8">
          Diagnostic view for checking order-level sales consistency in imported Order Listing rows.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-6">
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Total Orders</p>
            <h2 className="text-2xl font-bold">{totalOrders}</h2>
          </div>

          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Distinct Orders</p>
            <h2 className="text-2xl font-bold">{distinctOrders}</h2>
          </div>

          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Total Order-Level Sales</p>
            <h2 className="text-2xl font-bold">{formatCurrency(totalOrderLevelSales)}</h2>
          </div>

          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Rows with Grand Total 0 or Empty</p>
            <h2 className="text-2xl font-bold">{fallbackTotalRowsCount}</h2>
          </div>

          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Rows with Total Difference &gt; 1</p>
            <h2 className="text-2xl font-bold">{differentTotalRowsCount}</h2>
          </div>
        </div>

        {loadError && (
          <div className="rounded-2xl border border-white/20 p-6 mb-6">
            <p className="text-sm text-gray-300">
              Could not load sales reconciliation data right now.
            </p>
          </div>
        )}

        {!loadError && loading && (
          <div className="rounded-2xl border border-white/20 p-6 mb-6">
            <p className="text-sm text-gray-300">Loading sales reconciliation data...</p>
          </div>
        )}

        <div className="rounded-2xl border border-white/20 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Inspection Snapshot</h2>
          <p className="text-sm text-gray-400 mb-4">
            Use these two row families as a quick trust-check before reading the individual order
            cards below.
          </p>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-base font-semibold">Fallback Total Review</h3>
                  <p className="text-sm text-gray-400">
                    Grand Total is empty or zero, so Titan falls back to Effective Total.
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-gray-300">
                  {loading || loadError
                    ? "Inspection pending"
                    : fallbackTotalRowsCount === 0
                      ? "No rows right now"
                      : "Needs inspection"}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-200">
                <p>
                  <span className="text-gray-400">Flagged rows:</span> {fallbackTotalRowsCount}
                </p>
                <p>
                  <span className="text-gray-400">Rows shown below:</span>{" "}
                  {loadError ? "-" : loading ? "Loading..." : fallbackRows.length}
                </p>
                <p className="text-gray-300">
                  Check whether the stored Effective Total still looks believable when Grand Total
                  is blank or zero.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-base font-semibold">Large Total Difference Review</h3>
                  <p className="text-sm text-gray-400">
                    Effective Total differs from Grand Total by more than 1.
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-gray-300">
                  {loading || loadError
                    ? "Inspection pending"
                    : differentTotalRowsCount === 0
                      ? "No rows right now"
                      : "Needs inspection"}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-200">
                <p>
                  <span className="text-gray-400">Flagged rows:</span> {differentTotalRowsCount}
                </p>
                <p>
                  <span className="text-gray-400">Rows shown below:</span>{" "}
                  {loadError ? "-" : loading ? "Loading..." : differentRows.length}
                </p>
                <p className="text-gray-300">
                  Compare Grand Total and Effective Total first, then use payment fields as extra
                  context.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {renderRowsSection(
            "Orders Relying On Fallback Total",
            "Latest 50 order rows where Grand Total is empty or zero, so Titan relies on the stored effective total.",
            "Inspect these rows when you want to see where order-level trust depends on the fallback value instead of a populated Grand Total.",
            fallbackTotalRowsCount,
            fallbackRows,
            "No fallback-total rows found"
          )}

          {renderRowsSection(
            "Orders Where Effective Total And Grand Total Differ",
            "Latest 50 order rows where the stored effective total differs from Grand Total by more than 1.",
            "Inspect these rows when you want to understand why the two totals diverge before treating the order row as cleanly reconciled.",
            differentTotalRowsCount,
            differentRows,
            "No rows with a large total difference were found"
          )}
        </div>
      </div>
    </main>
  );
}
