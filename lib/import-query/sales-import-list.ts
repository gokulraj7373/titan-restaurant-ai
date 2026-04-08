import { supabase } from "@/lib/supabase";

export type SalesImportRow = {
  id: number;
  bill_date: string;
  bill_no: string;
  item_name: string;
  qty: number;
  amount: number;
  upload_log_id: number;
};

export async function loadSalesImportList() {
  const { data, error } = await supabase
    .from("sales_imports")
    .select("id, bill_date, bill_no, item_name, qty, amount, upload_log_id")
    .order("bill_date", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as SalesImportRow[];
}
