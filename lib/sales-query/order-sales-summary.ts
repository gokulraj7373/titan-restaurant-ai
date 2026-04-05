import { supabase } from "@/lib/supabase";

const BATCH_SIZE = 1000;

type SalesOrderAmountRow = {
  id: number;
  effective_total: number | null;
};

async function fetchAllSalesOrderAmountRows() {
  const rows: SalesOrderAmountRow[] = [];
  let from = 0;

  while (true) {
    const to = from + BATCH_SIZE - 1;
    const { data, error } = await supabase
      .schema("public")
      .from("sales_order_imports")
      .select("id, effective_total")
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

export async function loadImportedOrderSalesAmount() {
  const salesOrderRows = await fetchAllSalesOrderAmountRows();

  return salesOrderRows.reduce((sum, row) => {
    return sum + Number(row.effective_total ?? 0);
  }, 0);
}
