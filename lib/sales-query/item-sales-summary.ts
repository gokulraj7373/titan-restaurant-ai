import { supabase } from "@/lib/supabase";

const BATCH_SIZE = 1000;

type ItemSalesSummaryRow = {
  id: number;
  invoice_no: string;
  qty: number | null;
  final_total: number | null;
};

async function fetchAllItemSalesSummaryRows() {
  const rows: ItemSalesSummaryRow[] = [];
  let from = 0;

  while (true) {
    const to = from + BATCH_SIZE - 1;
    const { data, error } = await supabase
      .schema("public")
      .from("sales_item_imports")
      .select("id, invoice_no, qty, final_total")
      .order("id", { ascending: true })
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

export async function loadItemSalesSummary() {
  const rows = await fetchAllItemSalesSummaryRows();

  return {
    importedRows: rows.length,
    totalSalesAmount: rows.reduce((sum, row) => sum + Number(row.final_total ?? 0), 0),
    totalQuantity: rows.reduce((sum, row) => sum + Number(row.qty ?? 0), 0),
    uniqueBills: new Set(rows.map((row) => row.invoice_no)).size,
  };
}
