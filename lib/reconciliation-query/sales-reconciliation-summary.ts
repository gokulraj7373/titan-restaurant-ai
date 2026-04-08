import { supabase } from "@/lib/supabase";
import {
  hasLargeTotalDifference,
  isFallbackTotalRow,
  type SalesOrderDiagnosticRow,
} from "@/lib/reconciliation-query/sales-reconciliation-details";

export function buildSalesReconciliationSummary(allRows: SalesOrderDiagnosticRow[]) {
  return {
    distinctOrders: new Set(allRows.map((row) => String(row.order_no ?? "").trim()).filter(Boolean))
      .size,
    totalOrderLevelSales: allRows.reduce((sum, row) => sum + Number(row.effective_total ?? 0), 0),
    fallbackTotalRowsCount: allRows.filter(isFallbackTotalRow).length,
    differentTotalRowsCount: allRows.filter(hasLargeTotalDifference).length,
  };
}

export async function loadSalesReconciliationTotalOrders() {
  const { count, error } = await supabase
    .schema("public")
    .from("sales_order_imports")
    .select("*", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  return count ?? 0;
}
