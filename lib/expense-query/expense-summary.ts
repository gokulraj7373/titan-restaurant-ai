import { supabase } from "@/lib/supabase";

const BATCH_SIZE = 1000;

type ExpenseSummaryRow = {
  id: number;
  expense_date: string;
  category: string;
  amount: number | null;
};

async function fetchAllExpenseSummaryRows() {
  const rows: ExpenseSummaryRow[] = [];
  let from = 0;

  while (true) {
    const to = from + BATCH_SIZE - 1;
    const { data, error } = await supabase
      .from("expense_imports")
      .select("id, expense_date, category, amount")
      .order("expense_date", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to);

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

export async function loadExpenseSummary() {
  const rows = await fetchAllExpenseSummaryRows();

  return {
    importedExpenseRowsCount: rows.length,
    totalExpenseAmount: rows.reduce((sum, row) => {
      return sum + Number(row.amount ?? 0);
    }, 0),
    uniqueCategories: new Set(rows.map((row) => row.category)).size,
    latestExpenseDate: rows.length > 0 ? rows[0].expense_date : null,
  };
}
