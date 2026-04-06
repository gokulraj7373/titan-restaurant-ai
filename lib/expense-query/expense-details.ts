import { supabase } from "@/lib/supabase";

const LATEST_ROWS_LIMIT = 10;
const TOP_CATEGORIES_LIMIT = 5;

type ExpenseDetailRow = {
  id: number;
  expense_date: string;
  category: string;
  description: string;
  amount: number | null;
};

type TopExpenseCategory = {
  category: string;
  totalRows: number;
  totalAmount: number;
};

async function fetchAllExpenseDetailRows() {
  const { data, error } = await supabase
    .from("expense_imports")
    .select("id, expense_date, category, description, amount")
    .order("expense_date", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

function buildTopExpenseCategories(rows: ExpenseDetailRow[]): TopExpenseCategory[] {
  return Object.values(
    rows.reduce<Record<string, TopExpenseCategory>>((groupedCategories, row) => {
      const existingCategory = groupedCategories[row.category];

      if (existingCategory) {
        existingCategory.totalRows += 1;
        existingCategory.totalAmount += Number(row.amount ?? 0);
      } else {
        groupedCategories[row.category] = {
          category: row.category,
          totalRows: 1,
          totalAmount: Number(row.amount ?? 0),
        };
      }

      return groupedCategories;
    }, {})
  )
    .sort((firstCategory, secondCategory) => secondCategory.totalAmount - firstCategory.totalAmount)
    .slice(0, TOP_CATEGORIES_LIMIT);
}

export async function loadExpenseDetails() {
  const rows = await fetchAllExpenseDetailRows();

  return {
    latestRows: rows.slice(0, LATEST_ROWS_LIMIT),
    topCategories: buildTopExpenseCategories(rows),
  };
}
