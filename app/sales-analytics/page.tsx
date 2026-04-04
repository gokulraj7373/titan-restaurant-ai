"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const BATCH_SIZE = 1000;

type SalesItemImportRow = {
  id: number;
  item_date: string;
  invoice_no: string;
  item_name: string;
  qty: number;
  final_total: number;
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

export default function SalesAnalyticsPage() {
  const [rows, setRows] = useState<SalesItemImportRow[]>([]);
  const [importedRows, setImportedRows] = useState(0);
  const [totalSalesAmount, setTotalSalesAmount] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [uniqueBills, setUniqueBills] = useState(0);
  const [topItems, setTopItems] = useState<
    { item_name: string; totalQty: number; totalAmount: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const loadSalesImports = async () => {
      try {
        const [
          { data: latestRowsData, error: latestRowsError },
          { count: importedRowsCount, error: importedRowsCountError },
        ] = await Promise.all([
          supabase
            .schema("public")
            .from("sales_item_imports")
            .select("id, item_date, invoice_no, item_name, qty, final_total")
            .order("item_date", { ascending: false })
            .order("id", { ascending: false })
            .limit(10),
          supabase.schema("public").from("sales_item_imports").select("*", { count: "exact", head: true }),
        ]);

        if (latestRowsError || importedRowsCountError) {
          throw latestRowsError ?? importedRowsCountError;
        }

        const allRows = await fetchAllRows<SalesItemImportRow>((from, to) =>
          supabase
            .schema("public")
            .from("sales_item_imports")
            .select("id, item_date, invoice_no, item_name, qty, final_total")
            .order("id", { ascending: true })
            .range(from, to)
        );

        setRows(latestRowsData ?? []);
        setImportedRows(importedRowsCount ?? 0);
        setTotalSalesAmount(
          allRows.reduce((sum, row) => sum + Number(row.final_total ?? 0), 0)
        );
        setTotalQuantity(allRows.reduce((sum, row) => sum + Number(row.qty ?? 0), 0));
        setUniqueBills(new Set(allRows.map((row) => row.invoice_no)).size);
        setTopItems(
          Object.values(
            allRows.reduce<
              Record<string, { item_name: string; totalQty: number; totalAmount: number }>
            >((groupedItems, row) => {
              const existingItem = groupedItems[row.item_name];

              if (existingItem) {
                existingItem.totalQty += Number(row.qty ?? 0);
                existingItem.totalAmount += Number(row.final_total ?? 0);
              } else {
                groupedItems[row.item_name] = {
                  item_name: row.item_name,
                  totalQty: Number(row.qty ?? 0),
                  totalAmount: Number(row.final_total ?? 0),
                };
              }

              return groupedItems;
            }, {})
          )
            .sort((firstItem, secondItem) => secondItem.totalAmount - firstItem.totalAmount)
            .slice(0, 5)
        );
        setLoadError(false);
      } catch {
        setLoadError(true);
        setRows([]);
        setImportedRows(0);
        setTotalSalesAmount(0);
        setTotalQuantity(0);
        setUniqueBills(0);
        setTopItems([]);
      }
      setLoading(false);
    };

    loadSalesImports();
  }, []);

  const formatItemDate = (value: string) => {
    return new Date(value).toLocaleDateString(undefined, {
      dateStyle: "medium",
    });
  };

  const formatCurrency = (value: number) => {
    return `Rs ${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Sales Analytics</h1>
        <p className="text-gray-300 mb-8">Basic summary from imported sales rows</p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Imported Rows</p>
            <h2 className="text-2xl font-bold">{importedRows}</h2>
          </div>

          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Item Revenue Total</p>
            <h2 className="text-2xl font-bold">{formatCurrency(totalSalesAmount)}</h2>
          </div>

          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Total Quantity</p>
            <h2 className="text-2xl font-bold">{totalQuantity.toLocaleString()}</h2>
          </div>

          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Unique Bills</p>
            <h2 className="text-2xl font-bold">{uniqueBills}</h2>
          </div>
        </div>

        <div className="rounded-2xl border border-white/20 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Top Selling Items</h2>

          {loadError || topItems.length === 0 ? (
            <p className="text-sm text-gray-300">No item summary available</p>
          ) : (
            <div className="space-y-3">
              {topItems.map((item) => (
                <div
                  key={item.item_name}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div>
                      <p className="text-xs text-gray-400">Item Name</p>
                      <p className="mt-1 text-sm text-white break-words">{item.item_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total Qty</p>
                      <p className="mt-1 text-sm text-white">{item.totalQty}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total Amount</p>
                      <p className="mt-1 text-sm text-white">{formatCurrency(item.totalAmount)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/20 p-6">
          <h2 className="text-xl font-semibold mb-4">Latest Imported Rows</h2>

          {loadError ? (
            <p className="text-sm text-gray-300">Could not load sales analytics</p>
          ) : loading ? (
            <p className="text-sm text-gray-300">Loading sales analytics...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-300">No sales imports found</p>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                    <div>
                      <p className="text-xs text-gray-400">Item Date</p>
                      <p className="mt-1 text-sm text-white">{formatItemDate(row.item_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Invoice No</p>
                      <p className="mt-1 text-sm text-white">{row.invoice_no}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Item Name</p>
                      <p className="mt-1 text-sm text-white break-words">{row.item_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Qty</p>
                      <p className="mt-1 text-sm text-white">{row.qty}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Final Total</p>
                      <p className="mt-1 text-sm text-white">{formatCurrency(Number(row.final_total ?? 0))}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
