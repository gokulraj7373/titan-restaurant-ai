"use client";

import { useEffect, useState } from "react";
import {
  loadSalesImportList,
  type SalesImportRow,
} from "@/lib/import-query/sales-import-list";

export default function SalesImportsPage() {
  const [rows, setRows] = useState<SalesImportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const loadSalesImports = async () => {
      try {
        const salesImports = await loadSalesImportList();
        setRows(salesImports);
        setLoadError(false);
        setLoading(false);
      } catch {
        setLoadError(true);
        setRows([]);
        setLoading(false);
      }
    };

    loadSalesImports();
  }, []);

  const formatBillDate = (value: string) => {
    return new Date(value).toLocaleDateString(undefined, {
      dateStyle: "medium",
    });
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Sales Imports</h1>
        <p className="text-gray-300 mb-8">View imported sales rows</p>

        <div className="rounded-2xl border border-white/20 p-6">
          {loadError ? (
            <p className="text-sm text-gray-300">Could not load sales imports</p>
          ) : loading ? (
            <p className="text-sm text-gray-300">Loading sales imports...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-300">No sales imports found</p>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div>
                      <p className="text-xs text-gray-400">Bill Date</p>
                      <p className="mt-1 text-sm text-white">{formatBillDate(row.bill_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Bill No</p>
                      <p className="mt-1 text-sm text-white">{row.bill_no}</p>
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
                      <p className="text-xs text-gray-400">Amount</p>
                      <p className="mt-1 text-sm text-white">{row.amount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Upload Log ID</p>
                      <p className="mt-1 text-sm text-white">{row.upload_log_id}</p>
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
