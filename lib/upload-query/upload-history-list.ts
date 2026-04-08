import { supabase } from "@/lib/supabase";

export type UploadHistoryRow = {
  id: number;
  kind: string;
  file_name: string;
  created_at: string;
  storage_path: string;
  ingest_status: string | null;
  detected_format: string | null;
  target_table: string | null;
  parsed_row_count: number | null;
  inserted_row_count: number | null;
  rejected_row_count: number | null;
  ingest_message: string | null;
};

export async function loadUploadHistoryList() {
  const { data, error } = await supabase
    .from("uploads_log")
    .select(
      "id, kind, file_name, created_at, storage_path, ingest_status, detected_format, target_table, parsed_row_count, inserted_row_count, rejected_row_count, ingest_message"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as UploadHistoryRow[];
}
