"use client";

import { useEffect, useState } from "react";
import { loadUploadHistoryList, type UploadHistoryRow } from "@/lib/upload-query/upload-history-list";

type FilterType = "all" | "sales" | "expenses";

export default function UploadsPage() {
  const [uploads, setUploads] = useState<UploadHistoryRow[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const loadUploads = async () => {
      try {
        const uploadHistory = await loadUploadHistoryList();
        setUploads(uploadHistory);
        setLoadError(false);
        setLoading(false);
      } catch {
        setLoadError(true);
        setUploads([]);
        setLoading(false);
      }
    };

    loadUploads();
  }, []);

  const formatUploadDate = (value: string) => {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const filteredUploads = uploads.filter((upload) => {
    if (selectedFilter === "all") {
      return true;
    }

    return upload.kind.toLowerCase() === selectedFilter;
  });

  const getFilterButtonClass = (filter: FilterType) => {
    const isActive = selectedFilter === filter;

    return isActive
      ? "rounded-lg bg-white px-4 py-2 text-sm font-medium text-black"
      : "rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white hover:text-black";
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Upload History</h1>
        <p className="text-gray-300 mb-8">View all uploaded files</p>

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            type="button"
            onClick={() => setSelectedFilter("all")}
            className={getFilterButtonClass("all")}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter("sales")}
            className={getFilterButtonClass("sales")}
          >
            Sales
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter("expenses")}
            className={getFilterButtonClass("expenses")}
          >
            Expenses
          </button>
        </div>

        <div className="rounded-2xl border border-white/20 p-6">
          <div className="space-y-3 text-sm text-gray-300">
            {loadError ? (
              <p>Could not load uploads</p>
            ) : loading ? (
              <p>Loading uploads...</p>
            ) : filteredUploads.length === 0 ? (
              <p>No uploads found</p>
            ) : (
              filteredUploads.map((upload) => (
                <div
                  key={upload.id}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <span className="inline-block rounded-full bg-white/10 px-2 py-1 text-xs font-medium uppercase tracking-wide text-gray-200">
                        {upload.kind}
                      </span>
                      <p className="mt-2 font-medium text-white break-words">{upload.file_name}</p>
                      {upload.storage_path ? (
                        <p className="mt-1 text-xs text-gray-400 break-all">{upload.storage_path}</p>
                      ) : null}

                      {(upload.ingest_status ||
                        upload.detected_format ||
                        upload.target_table ||
                        upload.parsed_row_count !== null ||
                        upload.inserted_row_count !== null ||
                        upload.rejected_row_count !== null) ? (
                        <div className="mt-3 space-y-1 text-xs text-gray-300">
                          {upload.ingest_status ? <p>Status: {upload.ingest_status}</p> : null}
                          {upload.detected_format ? <p>Format: {upload.detected_format}</p> : null}
                          {upload.target_table ? <p>Target: {upload.target_table}</p> : null}
                          {upload.parsed_row_count !== null ||
                          upload.inserted_row_count !== null ||
                          upload.rejected_row_count !== null ? (
                            <p>
                              Parsed: {upload.parsed_row_count ?? 0} | Inserted:{" "}
                              {upload.inserted_row_count ?? 0} | Rejected:{" "}
                              {upload.rejected_row_count ?? 0}
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      {upload.ingest_message ? (
                        <p className="mt-2 text-xs text-gray-400 break-words">
                          {upload.ingest_message}
                        </p>
                      ) : null}
                    </div>
                    <p className="text-xs text-gray-400 md:text-right">
                      {formatUploadDate(upload.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
