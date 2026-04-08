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

  const renderRowsSection = (
    title: string,
    description: string,
    rows: SalesOrderDiagnosticRow[],
    emptyMessage: string
  ) => {
    return (
      <div className="rounded-2xl border border-white/20 p-6">
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-sm text-gray-400 mb-4">{description}</p>

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

        <div className="space-y-6">
          {renderRowsSection(
            "Orders Relying On Fallback Total",
            "Latest 50 order rows where Grand Total is empty or zero, so Titan relies on the stored effective total.",
            fallbackRows,
            "No fallback-total rows found"
          )}

          {renderRowsSection(
            "Orders Where Effective Total And Grand Total Differ",
            "Latest 50 order rows where the stored effective total differs from Grand Total by more than 1.",
            differentRows,
            "No rows with a large total difference were found"
          )}
        </div>
      </div>
    </main>
  );
}
