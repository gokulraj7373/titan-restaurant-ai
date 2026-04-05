import { supabase } from "@/lib/supabase";

const BATCH_SIZE = 1000;

type SalesOrderMetricRow = {
  id: number;
  bill_date: string | null;
  order_no: string | null;
  effective_total: number | null;
};

async function fetchSalesOrderMetricRowsForBillDate(billDate: string) {
  const rows: SalesOrderMetricRow[] = [];
  let from = 0;

  while (true) {
    const to = from + BATCH_SIZE - 1;
    const { data, error } = await supabase
      .schema("public")
      .from("sales_order_imports")
      .select("id, bill_date, order_no, effective_total")
      .eq("bill_date", billDate)
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

export async function loadDashboardOrderKpis() {
  const { data: latestSalesDateRow, error: latestSalesDateError } = await supabase
    .schema("public")
    .from("sales_order_imports")
    .select("bill_date")
    .order("bill_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestSalesDateError) {
    throw latestSalesDateError;
  }

  const latestBillDate = latestSalesDateRow?.bill_date ?? null;

  if (!latestBillDate) {
    return {
      todaySales: 0,
      orders: 0,
      averageOrderValue: 0,
    };
  }

  const latestRows = await fetchSalesOrderMetricRowsForBillDate(latestBillDate);

  const todaySales = latestRows.reduce((sum, row) => {
    return sum + Number(row.effective_total ?? 0);
  }, 0);

  const orders = new Set(
    latestRows.map((row) => String(row.order_no ?? "").trim()).filter(Boolean)
  ).size;

  const averageOrderValue = orders > 0 ? todaySales / orders : 0;

  return {
    todaySales,
    orders,
    averageOrderValue,
  };
}
