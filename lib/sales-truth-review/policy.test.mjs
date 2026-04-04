import assert from "node:assert/strict";
import test from "node:test";

import { buildSalesTruthReviewDerivedData } from "./engine.ts";
import {
  buildMemoMatchCandidates,
  detectTransactionFamily,
  getMemoResolutionReviewNotes,
  getMemoReviewLabelText,
  getSalesPolicyBucket,
  getSalesPolicyBucketText,
  getSuggestedInterpretationText,
  hasPartPayment,
} from "./policy.ts";

function createRow(overrides = {}) {
  return {
    id: 1,
    upload_log_id: 1,
    order_no: "101",
    bill_date: "2026-03-01",
    customer_name: null,
    customer_phone: null,
    order_type: null,
    sub_order_type: null,
    status: null,
    my_amount: null,
    total_discount: null,
    delivery_charge: null,
    container_charge: null,
    total_tax: null,
    round_off: null,
    grand_total: 0,
    effective_total: 0,
    payment_type: null,
    payment_description: null,
    items_text: null,
    parse_note: null,
    is_payment_split_row: false,
    ...overrides,
  };
}

test("numeric Part Payment row remains a sale candidate under current review policy", () => {
  const row = createRow({
    order_no: "101",
    effective_total: 1000,
    payment_type: "Part Payment",
    payment_description: "Cash 600 Card 400",
  });

  const family = detectTransactionFamily(row);

  assert.equal(hasPartPayment(row), true);
  assert.equal(family, "regular_order_main");
  assert.equal(getSalesPolicyBucket(row, family), "net_sale_candidate");
});

test("cancelled, complimentary, sales return, and memo rows stay in their current review buckets", () => {
  const cancelled = createRow({
    id: 2,
    order_no: "102",
    effective_total: 500,
    status: "Cancelled",
  });
  const complimentary = createRow({
    id: 3,
    order_no: "C12",
    effective_total: 200,
  });
  const salesReturn = createRow({
    id: 4,
    order_no: "SR77",
    effective_total: 300,
  });
  const memo = createRow({
    id: 5,
    order_no: "Memo",
    effective_total: 150,
  });

  assert.equal(getSalesPolicyBucket(cancelled, detectTransactionFamily(cancelled)), "excluded_cancelled");
  assert.equal(
    getSalesPolicyBucket(complimentary, detectTransactionFamily(complimentary)),
    "excluded_complimentary"
  );
  assert.equal(
    getSalesPolicyBucket(salesReturn, detectTransactionFamily(salesReturn)),
    "excluded_sales_return"
  );
  assert.equal(getSalesPolicyBucket(memo, detectTransactionFamily(memo)), "unresolved_memo");
});

test("amount plus later bill date alone only supports low memo hint confidence", () => {
  const memoRow = createRow({
    id: 10,
    order_no: "Memo",
    bill_date: "2026-03-10",
    effective_total: 150,
  });
  const numericCandidate = createRow({
    id: 11,
    order_no: "5001",
    bill_date: "2026-03-11",
    effective_total: 150,
  });

  const candidates = buildMemoMatchCandidates(memoRow, [numericCandidate]);

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].confidence, "low");
});

test("strong identity alignment can support higher memo hint confidence", () => {
  const memoRow = createRow({
    id: 12,
    order_no: "Memo",
    bill_date: "2026-03-10",
    effective_total: 420,
    customer_name: "Amit Sharma",
    customer_phone: "9999999999",
    items_text: "Paneer Tikka Masala",
  });
  const numericCandidate = createRow({
    id: 13,
    order_no: "5002",
    bill_date: "2026-03-11",
    effective_total: 420,
    customer_name: "Amit Sharma",
    customer_phone: "9999999999",
    items_text: "Paneer Tikka Masala",
  });

  const candidates = buildMemoMatchCandidates(memoRow, [numericCandidate]);

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].confidence, "high");
});

test("heuristic candidate presence does not equal an approved memo link", () => {
  const notes = getMemoResolutionReviewNotes().join(" ");

  assert.match(notes, /heuristic investigative hints only/i);
  assert.match(notes, /does not mean the memo became a finalized sale/i);
  assert.match(notes, /no memo-to-sale link is approved/i);
});

test("display label mappings stay conservative and read-only in wording", () => {
  assert.equal(getSuggestedInterpretationText("cancelled_candidate"), "cancelled signal review");
  assert.equal(getSalesPolicyBucketText("net_sale_candidate"), "net sale candidate (read-only)");
  assert.equal(getMemoReviewLabelText("cancelled_signal_review_only"), "cancelled signal, review only");
  assert.doesNotMatch(getSuggestedInterpretationText("cancelled_candidate"), /likely/i);
  assert.doesNotMatch(getSalesPolicyBucketText("net_sale_candidate"), /confirmed/i);
});

test("summary calculations and reconciliation stay stable for a representative review dataset", () => {
  const rows = [
    createRow({
      id: 21,
      upload_log_id: 1,
      order_no: "101",
      bill_date: "2026-03-01",
      effective_total: 1000,
      payment_type: "Part Payment",
      payment_description: "Cash 600 Card 400",
    }),
    createRow({
      id: 22,
      upload_log_id: 1,
      order_no: "102",
      bill_date: "2026-03-01",
      effective_total: 500,
      status: "Cancelled",
    }),
    createRow({
      id: 23,
      upload_log_id: 1,
      order_no: "C12",
      bill_date: "2026-03-01",
      effective_total: 200,
    }),
    createRow({
      id: 24,
      upload_log_id: 2,
      order_no: "SR77",
      bill_date: "2026-03-02",
      effective_total: 300,
    }),
    createRow({
      id: 25,
      upload_log_id: 2,
      order_no: "Memo",
      bill_date: "2026-03-02",
      effective_total: 150,
    }),
    createRow({
      id: 26,
      upload_log_id: 2,
      order_no: "103",
      bill_date: "2026-03-03",
      effective_total: 150,
    }),
  ];
  const latestUploadLogs = [
    {
      id: 2,
      original_file_name: "march-part-2.xlsx",
      created_at: "2026-03-05T10:00:00Z",
      inserted_row_count: 3,
      rejected_row_count: 0,
    },
    {
      id: 1,
      original_file_name: "march-part-1.xlsx",
      created_at: "2026-03-04T10:00:00Z",
      inserted_row_count: 3,
      rejected_row_count: 0,
    },
  ];
  const uploadFileNameById = new Map([
    [1, "march-part-1.xlsx"],
    [2, "march-part-2.xlsx"],
  ]);

  const derived = buildSalesTruthReviewDerivedData({
    rows,
    latestUploadLogs,
    uploadFileNameById,
    formatCurrency: (value) => `Rs ${Number(value ?? 0).toFixed(2)}`,
  });

  assert.equal(derived.summaryCounts.netSaleCandidateRowsCount, 2);
  assert.equal(derived.summaryCounts.netSaleCandidateAmount, 1150);
  assert.equal(derived.summaryCounts.memoUnresolvedRowsCount, 1);
  assert.equal(derived.summaryCounts.memoUnresolvedAmount, 150);
  assert.equal(derived.memoReviewRows.length, 1);
  assert.equal(derived.memoReviewRows[0].matchCandidates.length, 1);
  assert.equal(derived.memoReviewRows[0].matchCandidates[0].confidence, "low");
  assert.equal(derived.monthlyPolicyReconciliationRows.length, 1);
  assert.equal(derived.monthlyPolicyReconciliationRows[0].reconciled, true);
  assert.equal(derived.latestImportBreakdownRows.length, 2);
  assert.deepEqual(
    derived.latestImportBreakdownRows.map((row) => row.reconciled),
    [true, true]
  );
});

test("policy output snapshot stays stable for the fixed representative review dataset", () => {
  const rows = [
    createRow({
      id: 31,
      upload_log_id: 1,
      order_no: "201",
      bill_date: "2026-03-01",
      effective_total: 1000,
      payment_type: "Part Payment",
      payment_description: "Cash 600 Card 400",
    }),
    createRow({
      id: 32,
      upload_log_id: 1,
      order_no: "202",
      bill_date: "2026-03-01",
      effective_total: 500,
      status: "Cancelled",
    }),
    createRow({
      id: 33,
      upload_log_id: 1,
      order_no: "C21",
      bill_date: "2026-03-01",
      effective_total: 200,
    }),
    createRow({
      id: 34,
      upload_log_id: 2,
      order_no: "SR88",
      bill_date: "2026-03-02",
      effective_total: 300,
    }),
    createRow({
      id: 35,
      upload_log_id: 2,
      order_no: "Memo",
      bill_date: "2026-03-02",
      effective_total: 150,
      customer_name: "Walk-in Memo",
    }),
    createRow({
      id: 36,
      upload_log_id: 2,
      order_no: "203",
      bill_date: "2026-03-03",
      effective_total: 150,
    }),
  ];
  const latestUploadLogs = [
    {
      id: 2,
      original_file_name: "snapshot-b.xlsx",
      created_at: "2026-03-05T10:00:00Z",
      inserted_row_count: 3,
      rejected_row_count: 0,
    },
    {
      id: 1,
      original_file_name: "snapshot-a.xlsx",
      created_at: "2026-03-04T10:00:00Z",
      inserted_row_count: 3,
      rejected_row_count: 0,
    },
  ];
  const uploadFileNameById = new Map([
    [1, "snapshot-a.xlsx"],
    [2, "snapshot-b.xlsx"],
  ]);

  const derived = buildSalesTruthReviewDerivedData({
    rows,
    latestUploadLogs,
    uploadFileNameById,
    formatCurrency: (value) => `Rs ${Number(value ?? 0).toFixed(2)}`,
  });

  const snapshot = {
    netSaleCandidateAmount: derived.summaryCounts.netSaleCandidateAmount,
    memoUnresolvedRowsCount: derived.summaryCounts.memoUnresolvedRowsCount,
    memoUnresolvedAmount: derived.summaryCounts.memoUnresolvedAmount,
    memoPolicyBuckets: derived.memoReviewRows.map((reviewRow) =>
      getSalesPolicyBucket(reviewRow.row, detectTransactionFamily(reviewRow.row))
    ),
    monthReconciled: derived.monthlyPolicyReconciliationRows.map((row) => row.reconciled),
    uploadReconciled: derived.latestImportBreakdownRows.map((row) => row.reconciled),
  };

  assert.deepEqual(snapshot, {
    netSaleCandidateAmount: 1150,
    memoUnresolvedRowsCount: 1,
    memoUnresolvedAmount: 150,
    memoPolicyBuckets: ["unresolved_memo"],
    monthReconciled: [true],
    uploadReconciled: [true, true],
  });
});
