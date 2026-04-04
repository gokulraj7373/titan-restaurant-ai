"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const BATCH_SIZE = 1000;

type SalesOrderDiagnosticRow = {
  id: number;
  order_no: string | null;
  bill_date: string | null;
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
};

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

function isFallbackTotalRow(row: SalesOrderDiagnosticRow) {
  return row.grand_total === null || Number(row.grand_total) === 0;
}

function hasLargeTotalDifference(row: SalesOrderDiagnosticRow) {
  const effectiveTotal = Number(row.effective_total ?? 0);
  const grandTotal = Number(row.grand_total ?? 0);

  return Math.abs(effectiveTotal - grandTotal) > 1;
}

function sortLatestRows(rows: SalesOrderDiagnosticRow[]) {
  return [...rows].sort((firstRow, secondRow) => {
    const firstTime = firstRow.bill_date ? new Date(firstRow.bill_date).getTime() : 0;
    const secondTime = secondRow.bill_date ? new Date(secondRow.bill_date).getTime() : 0;

    if (secondTime !== firstTime) {
      return secondTime - firstTime;
    }

    return secondRow.id - firstRow.id;
  });
}

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
        const { count, error: totalOrdersError } = await supabase
          .schema("public")
          .from("sales_order_imports")
          .select("*", { count: "exact", head: true });

        if (totalOrdersError) {
          throw totalOrdersError;
        }

        const allRows = await fetchAllRows<SalesOrderDiagnosticRow>((from, to) =>
          supabase
            .schema("public")
            .from("sales_order_imports")
            .select(
              "id, order_no, bill_date, my_amount, total_discount, delivery_charge, container_charge, total_tax, round_off, grand_total, effective_total, payment_type, payment_description"
            )
            .order("id", { ascending: true })
            .range(from, to)
        );

        const fallbackRowsData = sortLatestRows(allRows.filter(isFallbackTotalRow)).slice(0, 50);
        const differentRowsData = sortLatestRows(allRows.filter(hasLargeTotalDifference)).slice(0, 50);

        setTotalOrders(count ?? 0);
        setDistinctOrders(
          new Set(allRows.map((row) => String(row.order_no ?? "").trim()).filter(Boolean)).size
        );
        setTotalOrderLevelSales(
          allRows.reduce((sum, row) => sum + Number(row.effective_total ?? 0), 0)
        );
        setFallbackTotalRowsCount(allRows.filter(isFallbackTotalRow).length);
        setDifferentTotalRowsCount(allRows.filter(hasLargeTotalDifference).length);
        setFallbackRows(fallbackRowsData);
        setDifferentRows(differentRowsData);
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
