"use client";

import { useEffect, useState } from "react";
import { SalesTruthStatusNotice } from "@/app/_components/sales-truth-status-notice";
import { loadProfitOverviewSummary } from "@/lib/profit-query/profit-overview-summary";

export default function ProfitOverviewPage() {
  const [totalSalesAmount, setTotalSalesAmount] = useState(0);
  const [totalExpenseAmount, setTotalExpenseAmount] = useState(0);
  const [estimatedGrossProfit, setEstimatedGrossProfit] = useState(0);
  const [profitMargin, setProfitMargin] = useState(0);
  const [importedSalesRowsCount, setImportedSalesRowsCount] = useState(0);
  const [importedExpenseRowsCount, setImportedExpenseRowsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const loadProfitData = async () => {
      try {
        const summary = await loadProfitOverviewSummary();

        setTotalSalesAmount(summary.totalSalesAmount);
        setTotalExpenseAmount(summary.totalExpenseAmount);
        setEstimatedGrossProfit(summary.estimatedGrossProfit);
        setProfitMargin(summary.profitMargin);
        setImportedSalesRowsCount(summary.importedSalesRowsCount);
        setImportedExpenseRowsCount(summary.importedExpenseRowsCount);
        setLoadError(false);
      } catch {
        setLoadError(true);
        setTotalSalesAmount(0);
        setTotalExpenseAmount(0);
        setEstimatedGrossProfit(0);
        setProfitMargin(0);
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

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Profit Overview</h1>
        <p className="text-gray-300 mb-8">
          Basic business summary from imported order-level sales and expenses
        </p>

        <SalesTruthStatusNotice />

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
