import { supabase } from "@/lib/supabase";

const BATCH_SIZE = 1000;
const LATEST_ROWS_LIMIT = 10;
const TOP_ITEMS_LIMIT = 5;

type ItemSalesDetailRow = {
  id: number;
  item_date: string;
  invoice_no: string;
  item_name: string;
  qty: number | null;
  final_total: number | null;
};

type TopSellingItem = {
  item_name: string;
  totalQty: number;
  totalAmount: number;
};

async function fetchAllItemSalesDetailRows() {
  const rows: ItemSalesDetailRow[] = [];
  let from = 0;

  while (true) {
    const to = from + BATCH_SIZE - 1;
    const { data, error } = await supabase
      .schema("public")
      .from("sales_item_imports")
      .select("id, item_date, invoice_no, item_name, qty, final_total")
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

async function fetchLatestItemSalesRows() {
  const { data, error } = await supabase
    .schema("public")
    .from("sales_item_imports")
    .select("id, item_date, invoice_no, item_name, qty, final_total")
    .order("item_date", { ascending: false })
    .order("id", { ascending: false })
    .limit(LATEST_ROWS_LIMIT);

  if (error) {
    throw error;
  }

  return data ?? [];
}

function buildTopSellingItems(rows: ItemSalesDetailRow[]): TopSellingItem[] {
  return Object.values(
    rows.reduce<Record<string, TopSellingItem>>((groupedItems, row) => {
      const existingItem = groupedItems[row.item_name];

      if (existingItem) {
        existingItem.totalQty += Number(row.qty ?? 0);
        existingItem.totalAmount += Number(row.final_total ?? 0);
      } else {
        groupedItems[row.item_name] = {
          item_name: row.item_name,
          totalQty: Number(row.qty ?? 0),
          totalAmount: Number(row.final_total ?? 0),
        };
      }

      return groupedItems;
    }, {})
  )
    .sort((firstItem, secondItem) => secondItem.totalAmount - firstItem.totalAmount)
    .slice(0, TOP_ITEMS_LIMIT);
}

export async function loadItemSalesDetails() {
  const [latestRows, allRows] = await Promise.all([
    fetchLatestItemSalesRows(),
    fetchAllItemSalesDetailRows(),
  ]);

  return {
    latestRows,
    topItems: buildTopSellingItems(allRows),
  };
}
