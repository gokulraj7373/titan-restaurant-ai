"use client";

import { useEffect, useState } from "react";
import { loadExpenseDetails } from "@/lib/expense-query/expense-details";
import { loadExpenseSummary } from "@/lib/expense-query/expense-summary";

type ExpenseImportRow = {
  id: number;
  expense_date: string;
  category: string;
  description: string;
  amount: number;
};

export default function ExpenseAnalyticsPage() {
  const [rows, setRows] = useState<ExpenseImportRow[]>([]);
  const [topCategories, setTopCategories] = useState<
    { category: string; totalRows: number; totalAmount: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [importedExpenseRows, setImportedExpenseRows] = useState(0);
  const [totalExpenseAmount, setTotalExpenseAmount] = useState(0);
  const [uniqueCategories, setUniqueCategories] = useState(0);
  const [latestExpenseDateRaw, setLatestExpenseDateRaw] = useState<string | null>(null);

  useEffect(() => {
    const loadExpenseImports = async () => {
      try {
        const [expenseSummaryResult, expenseDetailsResult] = await Promise.all([
          loadExpenseSummary(),
          loadExpenseDetails(),
        ]);

        setRows(expenseDetailsResult.latestRows);
        setTopCategories(expenseDetailsResult.topCategories);
        setImportedExpenseRows(expenseSummaryResult.importedExpenseRowsCount);
        setTotalExpenseAmount(expenseSummaryResult.totalExpenseAmount);
        setUniqueCategories(expenseSummaryResult.uniqueCategories);
        setLatestExpenseDateRaw(expenseSummaryResult.latestExpenseDate);
        setLoadError(false);
        setLoading(false);
      } catch {
        setLoadError(true);
        setRows([]);
        setTopCategories([]);
        setImportedExpenseRows(0);
        setTotalExpenseAmount(0);
        setUniqueCategories(0);
        setLatestExpenseDateRaw(null);
        setLoading(false);
      }
    };

    loadExpenseImports();
  }, []);

  const formatExpenseDate = (value: string) => {
    return new Date(value).toLocaleDateString(undefined, {
      dateStyle: "medium",
    });
  };

  const latestExpenseDate =
    loadError || !latestExpenseDateRaw ? "-" : formatExpenseDate(latestExpenseDateRaw);
  const latestRows = rows;

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Expense Analytics</h1>
        <p className="text-gray-300 mb-8">Basic summary from imported expense rows</p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Imported Expense Rows</p>
            <h2 className="text-2xl font-bold">{importedExpenseRows}</h2>
          </div>

          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Total Expense Amount</p>
            <h2 className="text-2xl font-bold">Rs {totalExpenseAmount.toLocaleString()}</h2>
          </div>

          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Unique Categories</p>
            <h2 className="text-2xl font-bold">{uniqueCategories}</h2>
          </div>

          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Latest Expense Date</p>
            <h2 className="text-2xl font-bold">{latestExpenseDate}</h2>
          </div>
        </div>

        <div className="rounded-2xl border border-white/20 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Top Expense Categories</h2>

          {loadError || topCategories.length === 0 ? (
            <p className="text-sm text-gray-300">No category summary available</p>
          ) : (
            <div className="space-y-3">
              {topCategories.map((category) => (
                <div
                  key={category.category}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div>
                      <p className="text-xs text-gray-400">Category</p>
                      <p className="mt-1 text-sm text-white">{category.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total Rows</p>
                      <p className="mt-1 text-sm text-white">{category.totalRows}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total Amount</p>
                      <p className="mt-1 text-sm text-white">
                        Rs {category.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/20 p-6">
          <h2 className="text-xl font-semibold mb-4">Latest Imported Expense Rows</h2>

          {loadError ? (
            <p className="text-sm text-gray-300">Could not load expense analytics</p>
          ) : loading ? (
            <p className="text-sm text-gray-300">Loading expense analytics...</p>
          ) : latestRows.length === 0 ? (
            <p className="text-sm text-gray-300">No expense imports found</p>
          ) : (
            <div className="space-y-3">
              {latestRows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
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
