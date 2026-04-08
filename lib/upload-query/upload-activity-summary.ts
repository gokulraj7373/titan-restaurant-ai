import { supabase } from "@/lib/supabase";

export type UploadActivityRow = {
  id: number;
  kind: string;
  file_name: string;
  created_at: string;
  storage_path: string;
};

const RECENT_UPLOADS_LIMIT = 10;

export async function loadUploadActivitySummary() {
  const [
    { data: recentUploads, error: recentUploadsError },
    { count: salesUploadsCount, error: salesUploadsCountError },
    { count: expensesUploadsCount, error: expensesUploadsCountError },
  ] = await Promise.all([
    supabase
      .from("uploads_log")
      .select("id, kind, file_name, created_at, storage_path")
      .order("created_at", { ascending: false })
      .limit(RECENT_UPLOADS_LIMIT),
    supabase
      .from("uploads_log")
      .select("*", { count: "exact", head: true })
      .eq("kind", "sales"),
    supabase
      .from("uploads_log")
      .select("*", { count: "exact", head: true })
      .eq("kind", "expenses"),
  ]);

  if (recentUploadsError || salesUploadsCountError || expensesUploadsCountError) {
    throw recentUploadsError ?? salesUploadsCountError ?? expensesUploadsCountError;
  }

  return {
    recentUploads: (recentUploads ?? []) as UploadActivityRow[],
    salesUploadsCount: salesUploadsCount ?? 0,
    expensesUploadsCount: expensesUploadsCount ?? 0,
  };
}
