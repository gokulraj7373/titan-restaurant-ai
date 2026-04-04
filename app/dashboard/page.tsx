"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SalesTruthStatusNotice } from "@/app/_components/sales-truth-status-notice";
import { supabase } from "@/lib/supabase";

const BATCH_SIZE = 1000;

type UploadLog = {
  id: number;
  kind: string;
  file_name: string;
  created_at: string;
  storage_path: string;
};

type SalesOrderMetricRow = {
  id: number;
  bill_date: string | null;
  order_no: string | null;
  effective_total: number | null;
};

type ExpenseAmountRow = {
  id: number;
  amount: number | null;
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

export default function DashboardPage() {
  const [statusMessage, setStatusMessage] = useState("Loading connection status...");
  const [todaySales, setTodaySales] = useState(0);
  const [orders, setOrders] = useState(0);
  const [averageOrderValue, setAverageOrderValue] = useState(0);
  const [businessInsights, setBusinessInsights] = useState<string[]>([]);
  const [businessInsightError, setBusinessInsightError] = useState(false);
  const [recentUploads, setRecentUploads] = useState<UploadLog[] | null>(null);
  const [recentUploadsError, setRecentUploadsError] = useState(false);
  const [salesUploadsCount, setSalesUploadsCount] = useState(0);
  const [expensesUploadsCount, setExpensesUploadsCount] = useState(0);
  const [importedSalesRowsCount, setImportedSalesRowsCount] = useState(0);
  const [importedSalesAmount, setImportedSalesAmount] = useState(0);
  const [importedExpenseRowsCount, setImportedExpenseRowsCount] = useState(0);
  const [importedExpenseAmount, setImportedExpenseAmount] = useState(0);
  const [fileUrls, setFileUrls] = useState<Record<number, string>>({});
  const [fileUrlErrors, setFileUrlErrors] = useState<Record<number, string>>({});
  const [loadingFileUrls, setLoadingFileUrls] = useState<Record<number, boolean>>({});

  const formatUploadDate = (value: string) => {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatCurrency = (value: number) => {
    return `Rs ${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleGetFileUrl = async (uploadId: number, storagePath: string) => {
    setLoadingFileUrls((current) => ({
      ...current,
      [uploadId]: true,
    }));

    setFileUrlErrors((current) => {
      const next = { ...current };
      delete next[uploadId];
      return next;
    });

    const { data, error } = await supabase.storage
      .from("uploads")
      .createSignedUrl(storagePath, 60 * 60);

    if (error || !data?.signedUrl) {
      setFileUrls((current) => {
        const next = { ...current };
        delete next[uploadId];
        return next;
      });
      setFileUrlErrors((current) => ({
        ...current,
        [uploadId]: "Could not generate file link",
      }));
      setLoadingFileUrls((current) => ({
        ...current,
        [uploadId]: false,
      }));
      return;
    }

    setFileUrls((current) => ({
      ...current,
      [uploadId]: data.signedUrl,
    }));
    setLoadingFileUrls((current) => ({
      ...current,
      [uploadId]: false,
    }));
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Keep this simple: if copying fails, we do not show extra UI.
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      const [
        { data: statusData, error: statusError },
        { data: uploadsData, error: uploadsError },
        { count: salesCount, error: salesCountError },
        { count: expensesCount, error: expensesCountError },
        { count: salesOrderImportsCount, error: salesOrderImportsCountError },
        { count: expenseImportsCount, error: expenseImportsCountError },
        { data: latestSalesDateRow, error: latestSalesDateError },
      ] = await Promise.all([
          supabase
            .from("app_status")
            .select("message")
            .order("id", { ascending: false })
            .limit(1)
            .single(),
          supabase
            .from("uploads_log")
            .select("id, kind, file_name, created_at, storage_path")
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("uploads_log")
            .select("*", { count: "exact", head: true })
            .eq("kind", "sales"),
          supabase
            .from("uploads_log")
            .select("*", { count: "exact", head: true })
            .eq("kind", "expenses"),
          supabase
            .schema("public")
            .from("sales_order_imports")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("expense_imports")
            .select("*", { count: "exact", head: true }),
          supabase
            .schema("public")
            .from("sales_order_imports")
            .select("bill_date")
            .order("bill_date", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

      if (statusError) {
        setStatusMessage("Could not load Supabase status.");
      } else {
        setStatusMessage(statusData.message);
      }

      if (uploadsError) {
        setRecentUploadsError(true);
        setRecentUploads([]);
      } else {
        setRecentUploads(uploadsData ?? []);
      }

      setSalesUploadsCount(salesCountError ? 0 : salesCount ?? 0);
      setExpensesUploadsCount(expensesCountError ? 0 : expensesCount ?? 0);
      setImportedSalesRowsCount(salesOrderImportsCountError ? 0 : salesOrderImportsCount ?? 0);
      setImportedExpenseRowsCount(expenseImportsCountError ? 0 : expenseImportsCount ?? 0);

      try {
        const salesOrderRows = await fetchAllRows<SalesOrderMetricRow>((from, to) =>
          supabase
            .schema("public")
            .from("sales_order_imports")
            .select("id, bill_date, order_no, effective_total")
            .order("id", { ascending: true })
            .range(from, to)
        );

        const totalImportedSalesAmount = salesOrderRows.reduce((sum, row) => {
          return sum + Number(row.effective_total ?? 0);
        }, 0);

        const latestBillDate = latestSalesDateError ? null : latestSalesDateRow?.bill_date ?? null;
        const latestRows = latestBillDate
          ? await fetchAllRows<SalesOrderMetricRow>((from, to) =>
              supabase
                .schema("public")
                .from("sales_order_imports")
                .select("id, bill_date, order_no, effective_total")
                .eq("bill_date", latestBillDate)
                .order("id", { ascending: true })
                .range(from, to)
            )
          : [];

        const latestDaySales = latestRows.reduce((sum, row) => {
          return sum + Number(row.effective_total ?? 0);
        }, 0);
        const latestDayOrders = new Set(
          latestRows.map((row) => String(row.order_no ?? "").trim()).filter(Boolean)
        ).size;
        const latestDayAverageOrderValue =
          latestDayOrders > 0 ? latestDaySales / latestDayOrders : 0;

        setTodaySales(latestDaySales);
        setOrders(latestDayOrders);
        setAverageOrderValue(latestDayAverageOrderValue);
        setImportedSalesAmount(totalImportedSalesAmount);

        const expenseRows = await fetchAllRows<ExpenseAmountRow>((from, to) =>
          supabase
            .from("expense_imports")
            .select("id, amount")
            .order("id", { ascending: true })
            .range(from, to)
        );
        const totalExpenseAmount = expenseRows.reduce((sum, row) => {
          return sum + Number(row.amount ?? 0);
        }, 0);

        setImportedExpenseAmount(totalExpenseAmount);

        const salesRowCount = salesOrderImportsCountError ? 0 : salesOrderImportsCount ?? 0;
        const expenseRowCount = expenseImportsCountError ? 0 : expenseImportsCount ?? 0;
        const insights: string[] = [];

        if (totalExpenseAmount > totalImportedSalesAmount) {
          insights.push(
            `Expenses are higher than sales by ${formatCurrency(
              totalExpenseAmount - totalImportedSalesAmount
            )}.`
          );
        } else {
          insights.push(
            `Sales are ahead of expenses by ${formatCurrency(
              totalImportedSalesAmount - totalExpenseAmount
            )}.`
          );
        }

        insights.push(
          `The latest sales day shows ${latestDayOrders} orders with an average order value of ${formatCurrency(
            latestDayAverageOrderValue
          )}.`
        );
        insights.push(
          `Imported order-level sales from Order Listing imports are ${formatCurrency(
            totalImportedSalesAmount
          )} and imported expenses are ${formatCurrency(totalExpenseAmount)}.`
        );

        if (salesRowCount < 10 || expenseRowCount < 10) {
          insights.push(
            "The imported dataset is still small, so trends may change as more files are added."
          );
        } else {
          insights.push("There is enough imported data to start spotting basic sales and expense patterns.");
        }

        setBusinessInsightError(false);
        setBusinessInsights(insights);
      } catch {
        setTodaySales(0);
        setOrders(0);
        setAverageOrderValue(0);
        setImportedSalesAmount(0);
        setImportedExpenseAmount(0);
        setBusinessInsightError(true);
        setBusinessInsights([]);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-300 mb-8">
          This is the demo dashboard for Titan Restaurant AI.
        </p>

        <SalesTruthStatusNotice />

        <div className="flex flex-wrap gap-4 mb-8">
          <Link
            href="/upload/sales"
            className="rounded-lg bg-white text-black px-6 py-3 font-semibold hover:bg-gray-200"
          >
            Upload Sales File
          </Link>

          <Link
            href="/upload/expenses"
            className="rounded-lg border border-white px-6 py-3 font-semibold hover:bg-white hover:text-black"
          >
            Upload Expenses File
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Today Sales</p>
            <h2 className="text-2xl font-bold">{formatCurrency(todaySales)}</h2>
          </div>

          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Orders</p>
            <h2 className="text-2xl font-bold">{orders}</h2>
          </div>

          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Average Order Value</p>
            <h2 className="text-2xl font-bold">{formatCurrency(averageOrderValue)}</h2>
          </div>
        </div>

        <div className="rounded-2xl border border-white/20 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Business Insight</h2>
          <div className="space-y-3 text-sm text-gray-300">
            {businessInsightError ? (
              <p>Not enough data for insight yet</p>
            ) : (
              businessInsights.map((insight) => <p key={insight}>{insight}</p>)
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/20 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Supabase Connection Status</h2>
          <p className="text-sm text-gray-300">{statusMessage}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Sales Uploads</p>
            <h2 className="text-2xl font-bold">{salesUploadsCount}</h2>
          </div>

          <div className="rounded-2xl border border-white/20 p-6">
            <p className="text-sm text-gray-400 mb-2">Expenses Uploads</p>
            <h2 className="text-2xl font-bold">{expensesUploadsCount}</h2>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Imported Sales Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/20 p-6">
              <p className="text-sm text-gray-400 mb-2">Imported Sales Rows</p>
              <h2 className="text-2xl font-bold">{importedSalesRowsCount}</h2>
            </div>

            <div className="rounded-2xl border border-white/20 p-6">
              <p className="text-sm text-gray-400 mb-2">Imported Order Sales</p>
              <h2 className="text-2xl font-bold">{formatCurrency(importedSalesAmount)}</h2>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Imported Expense Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/20 p-6">
              <p className="text-sm text-gray-400 mb-2">Imported Expense Rows</p>
              <h2 className="text-2xl font-bold">{importedExpenseRowsCount}</h2>
            </div>

            <div className="rounded-2xl border border-white/20 p-6">
              <p className="text-sm text-gray-400 mb-2">Imported Expense Amount</p>
              <h2 className="text-2xl font-bold">{formatCurrency(importedExpenseAmount)}</h2>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/20 p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3 text-sm text-gray-300">
            {recentUploadsError ? (
              <p>Could not load recent uploads</p>
            ) : recentUploads === null ? (
              <p>Loading recent uploads...</p>
            ) : recentUploads.length === 0 ? (
              <p>No uploads yet</p>
            ) : (
              recentUploads.map((upload) => (
                <div
                  key={upload.id}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <span className="inline-block rounded-full bg-white/10 px-2 py-1 text-xs font-medium uppercase tracking-wide text-gray-200">
                        {upload.kind}
                      </span>
                      <p className="mt-2 font-medium text-white break-words">{upload.file_name}</p>
                      <p className="mt-1 text-xs text-gray-400 break-all">{upload.storage_path}</p>
                    </div>
                    <div className="md:text-right">
                      <p className="text-xs text-gray-400">
                        {formatUploadDate(upload.created_at)}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleGetFileUrl(upload.id, upload.storage_path)}
                        disabled={loadingFileUrls[upload.id]}
                        className="mt-2 rounded-md border border-white/20 px-2 py-1 text-xs text-gray-200 hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loadingFileUrls[upload.id] ? "Loading..." : "Get File URL"}
                      </button>
                    </div>
                  </div>

                  {fileUrls[upload.id] ? (
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                      <p className="text-gray-400">Link ready</p>
                      <a
                        href={fileUrls[upload.id]}
                        target="_blank"
                        rel="noreferrer"
                        className="text-white underline underline-offset-2"
                      >
                        Open File
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(fileUrls[upload.id])}
                        className="rounded-md border border-white/20 px-2 py-1 text-gray-200 hover:bg-white hover:text-black"
                      >
                        Copy Link
                      </button>
                    </div>
                  ) : null}

                  {fileUrlErrors[upload.id] ? (
                    <p className="mt-3 text-xs text-gray-400">{fileUrlErrors[upload.id]}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
