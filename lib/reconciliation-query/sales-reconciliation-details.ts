import { supabase } from "@/lib/supabase";

const BATCH_SIZE = 1000;
const DIAGNOSTIC_ROWS_LIMIT = 50;

export type SalesOrderDiagnosticRow = {
  id: number;
  order_no: string | null;
  bill_date: string | null;
  my_amount: number | null;
  total_discount: number | null;
  delivery_charge: number | null;
  container_charge: number | null;
  total_tax: number | null;
  round_off: number | null;
  grand_total: number | null;
  effective_total: number | null;
  payment_type: string | null;
  payment_description: string | null;
};

async function fetchAllReconciliationRows() {
  const rows: SalesOrderDiagnosticRow[] = [];
  let from = 0;

  while (true) {
    const to = from + BATCH_SIZE - 1;
    const { data, error } = await supabase
      .schema("public")
      .from("sales_order_imports")
      .select(
        "id, order_no, bill_date, my_amount, total_discount, delivery_charge, container_charge, total_tax, round_off, grand_total, effective_total, payment_type, payment_description"
      )
      .order("id", { ascending: true })
      .range(from, to);

    if (error) {
      throw error;
    }

    const batchRows = (data ?? []) as SalesOrderDiagnosticRow[];
    rows.push(...batchRows);

    if (batchRows.length < BATCH_SIZE) {
      break;
    }

    from += BATCH_SIZE;
  }

  return rows;
}

export function isFallbackTotalRow(row: SalesOrderDiagnosticRow) {
  return row.grand_total === null || Number(row.grand_total) === 0;
}

export function hasLargeTotalDifference(row: SalesOrderDiagnosticRow) {
  const effectiveTotal = Number(row.effective_total ?? 0);
  const grandTotal = Number(row.grand_total ?? 0);

  return Math.abs(effectiveTotal - grandTotal) > 1;
}

function sortLatestRows(rows: SalesOrderDiagnosticRow[]) {
  return [...rows].sort((firstRow, secondRow) => {
    const firstTime = firstRow.bill_date ? new Date(firstRow.bill_date).getTime() : 0;
    const secondTime = secondRow.bill_date ? new Date(secondRow.bill_date).getTime() : 0;

    if (secondTime !== firstTime) {
      return secondTime - firstTime;
    }

    return secondRow.id - firstRow.id;
  });
}

export async function loadSalesReconciliationDetails() {
  const allRows = await fetchAllReconciliationRows();
  const fallbackRows = sortLatestRows(allRows.filter(isFallbackTotalRow)).slice(
    0,
    DIAGNOSTIC_ROWS_LIMIT
  );
  const differentRows = sortLatestRows(allRows.filter(hasLargeTotalDifference)).slice(
    0,
    DIAGNOSTIC_ROWS_LIMIT
  );

  return {
    allRows,
    fallbackRows,
    differentRows,
  };
}
