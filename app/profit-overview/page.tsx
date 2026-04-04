"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const BATCH_SIZE = 1000;

type SalesAmountRow = {
  id: number;
  effective_total: number;
};

type ExpenseAmountRow = {
  id: number;
  amount: number;
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

export default function ProfitOverviewPage() {
  const [totalSalesAmount, setTotalSalesAmount] = useState(0);
  const [totalExpenseAmount, setTotalExpenseAmount] = useState(0);
  const [importedSalesRowsCount, setImportedSalesRowsCount] = useState(0);
  const [importedExpenseRowsCount, setImportedExpenseRowsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const loadProfitData = async () => {
      try {
        const [
          { count: salesCount, error: salesCountError },
          { count: expenseCount, error: expenseCountError },
        ] = await Promise.all([
          supabase.schema("public").from("sales_order_imports").select("*", { count: "exact", head: true }),
          supabase.from("expense_imports").select("*", { count: "exact", head: true }),
        ]);

        if (salesCountError || expenseCountError) {
          throw salesCountError ?? expenseCountError;
        }

        const [salesRows, expenseRows] = await Promise.all([
          fetchAllRows<SalesAmountRow>((from, to) =>
            supabase
              .schema("public")
              .from("sales_order_imports")
              .select("id, effective_total")
              .order("id", { ascending: true })
              .range(from, to)
          ),
          fetchAllRows<ExpenseAmountRow>((from, to) =>
            supabase
              .from("expense_imports")
              .select("id, amount")
              .order("id", { ascending: true })
              .range(from, to)
          ),
        ]);

        setTotalSalesAmount(
          salesRows.reduce((sum, row) => sum + Number(row.effective_total ?? 0), 0)
        );
        setTotalExpenseAmount(
          expenseRows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
        );
        setImportedSalesRowsCount(salesCount ?? 0);
        setImportedExpenseRowsCount(expenseCount ?? 0);
        setLoadError(false);
      } catch {
        setLoadError(true);
        setTotalSalesAmount(0);
        setTotalExpenseAmount(0);
        setImportedSalesRowsCount(0);
        setImportedExpenseRowsCount(0);
      }
      setLoading(false);
    };

    loadProfitData();
  }, []);

  const formatCurrency = (value: number) => {
    return `Rs ${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}%`;
  };
  const estimatedGrossProfit = loadError ? 0 : totalSalesAmount - totalExpenseAmount;
  const profitMargin = loadError
    ? 0
    : totalSalesAmount > 0
      ? (estimatedGrossProfit / totalSalesAmount) * 100
      : 0;

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Profit Overview</h1>
        <p className="text-gray-300 mb-8">
          Basic business summary from imported order-level sales and expenses
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Total Order-Level Sales</p>
            <h2 className="text-2xl font-bold">{formatCurrency(totalSalesAmount)}</h2>
          </div>

          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Total Expense Amount</p>
            <h2 className="text-2xl font-bold">{formatCurrency(totalExpenseAmount)}</h2>
          </div>

          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Estimated Gross Profit</p>
            <h2 className="text-2xl font-bold">{formatCurrency(estimatedGrossProfit)}</h2>
          </div>

          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Profit Margin %</p>
            <h2 className="text-2xl font-bold">{formatPercentage(profitMargin)}</h2>
          </div>
        </div>

        <div className="rounded-2xl border border-white/20 p-6">
          <h2 className="text-xl font-semibold mb-4">Data Snapshot</h2>

          {loadError ? (
            <div className="space-y-2 text-sm text-gray-300">
              <p>Imported Sales Rows count: 0</p>
              <p>Imported Expense Rows count: 0</p>
            </div>
          ) : loading ? (
            <p className="text-sm text-gray-300">Loading profit overview...</p>
          ) : (
            <div className="space-y-2 text-sm text-gray-300">
              <p>Imported Sales Rows count: {importedSalesRowsCount}</p>
              <p>Imported Expense Rows count: {importedExpenseRowsCount}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
