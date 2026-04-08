import { supabase } from "@/lib/supabase";

const BATCH_SIZE = 1000;

type SalesAmountRow = {
  id: number;
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

export async function loadProfitOverviewSummary() {
  const [
    { count: salesCount, error: salesCountError },
    { count: expenseCount, error: expenseCountError },
    salesRows,
    expenseRows,
  ] = await Promise.all([
    supabase.schema("public").from("sales_order_imports").select("*", { count: "exact", head: true }),
    supabase.from("expense_imports").select("*", { count: "exact", head: true }),
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

  if (salesCountError || expenseCountError) {
    throw salesCountError ?? expenseCountError;
  }

  const totalSalesAmount = salesRows.reduce((sum, row) => sum + Number(row.effective_total ?? 0), 0);
  const totalExpenseAmount = expenseRows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  const estimatedGrossProfit = totalSalesAmount - totalExpenseAmount;
  const profitMargin = totalSalesAmount > 0 ? (estimatedGrossProfit / totalSalesAmount) * 100 : 0;

  return {
    totalSalesAmount,
    totalExpenseAmount,
    estimatedGrossProfit,
    profitMargin,
    importedSalesRowsCount: salesCount ?? 0,
    importedExpenseRowsCount: expenseCount ?? 0,
  };
}
