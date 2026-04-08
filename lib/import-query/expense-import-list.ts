import { supabase } from "@/lib/supabase";

export type ExpenseImportRow = {
  id: number;
  expense_date: string;
  category: string;
  description: string;
  amount: number;
  upload_log_id: number;
};

export async function loadExpenseImportList() {
  const { data, error } = await supabase
    .from("expense_imports")
    .select("id, expense_date, category, description, amount, upload_log_id")
    .order("expense_date", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ExpenseImportRow[];
}
