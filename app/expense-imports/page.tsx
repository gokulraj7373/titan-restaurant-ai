"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ExpenseImportRow = {
  id: number;
  expense_date: string;
  category: string;
  description: string;
  amount: number;
  upload_log_id: number;
};

export default function ExpenseImportsPage() {
  const [rows, setRows] = useState<ExpenseImportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const loadExpenseImports = async () => {
      const { data, error } = await supabase
        .from("expense_imports")
        .select("id, expense_date, category, description, amount, upload_log_id")
        .order("expense_date", { ascending: false })
        .order("id", { ascending: false });

      if (error) {
        setLoadError(true);
        setRows([]);
        setLoading(false);
        return;
      }

      setRows(data ?? []);
      setLoading(false);
    };

    loadExpenseImports();
  }, []);

  const formatExpenseDate = (value: string) => {
    return new Date(value).toLocaleDateString(undefined, {
      dateStyle: "medium",
    });
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Expense Imports</h1>
        <p className="text-gray-300 mb-8">View imported expense rows</p>

        <div className="rounded-2xl border border-white/20 p-6">
          {loadError ? (
            <p className="text-sm text-gray-300">Could not load expense imports</p>
          ) : loading ? (
            <p className="text-sm text-gray-300">Loading expense imports...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-300">No expense imports found</p>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                    <div>
                      <p className="text-xs text-gray-400">Expense Date</p>
                      <p className="mt-1 text-sm text-white">
                        {formatExpenseDate(row.expense_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Category</p>
                      <p className="mt-1 text-sm text-white">{row.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Description</p>
                      <p className="mt-1 text-sm text-white break-words">{row.description}</p>
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
