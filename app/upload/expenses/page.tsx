"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function UploadExpensesPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("No file selected");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select an expenses file before uploading.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    const filePath = `expenses/${Date.now()}-${selectedFile.name}`;

    const { error: storageError } = await supabase.storage
      .from("uploads")
      .upload(filePath, selectedFile);

    if (storageError) {
      setMessage("Could not upload the expenses file to Supabase Storage.");
      setIsSaving(false);
      return;
    }

    const { data: uploadLogRow, error: logError } = await supabase
      .from("uploads_log")
      .insert([
        {
          kind: "expenses",
          file_name: selectedFile.name,
          storage_path: filePath,
        },
      ])
      .select("id")
      .single();

    if (logError || !uploadLogRow) {
      setMessage("File uploaded, but could not save the expenses log to Supabase.");
      setIsSaving(false);
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    const demoExpenseRows = [
      {
        upload_log_id: uploadLogRow.id,
        expense_date: today,
        category: "Raw Materials",
        description: "Milk purchase",
        amount: 120,
      },
      {
        upload_log_id: uploadLogRow.id,
        expense_date: today,
        category: "Raw Materials",
        description: "Paneer purchase",
        amount: 320,
      },
      {
        upload_log_id: uploadLogRow.id,
        expense_date: today,
        category: "Packaging",
        description: "Takeaway boxes",
        amount: 90,
      },
      {
        upload_log_id: uploadLogRow.id,
        expense_date: today,
        category: "Utilities",
        description: "Gas refill",
        amount: 1100,
      },
      {
        upload_log_id: uploadLogRow.id,
        expense_date: today,
        category: "Cleaning",
        description: "Cleaning supplies",
        amount: 250,
      },
    ];

    const { error: importError } = await supabase
      .from("expense_imports")
      .insert(demoExpenseRows);

    if (importError) {
      setMessage("File uploaded and log saved, but could not create the 5 sample expense rows.");
      setIsSaving(false);
      return;
    }

    setMessage(`Expenses file "${selectedFile.name}" was uploaded and 5 sample expense rows were added.`);
    setIsSaving(false);
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Upload Expenses</h1>
        <p className="text-gray-300 mb-8">
          Upload your restaurant expenses file here.
        </p>

        <div className="rounded-2xl border border-white/20 p-8 space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Select expenses file
            </label>
            <input
              type="file"
              className="block w-full rounded-lg border border-white/20 bg-transparent px-4 py-3"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setSelectedFile(file);
                setFileName(file ? file.name : "No file selected");
                setMessage("");
              }}
            />
          </div>

          <p className="text-sm text-gray-300">
            Selected file: <span className="font-semibold">{fileName}</span>
          </p>

          <button
            onClick={handleUpload}
            disabled={isSaving}
            className="rounded-lg bg-white text-black px-6 py-3 font-semibold hover:bg-gray-200 disabled:opacity-60"
          >
            {isSaving ? "Uploading..." : "Upload File"}
          </button>

          {message && (
            <p className="text-sm text-gray-300 border border-white/10 rounded-lg p-3">
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}