# Next Steps

## Immediate Next Steps

1. Run a consistency audit across Upload History, Dashboard, Sales Analytics, Expense Analytics, and Profit Overview.
2. Verify that each page uses the correct source table before adding more ingestion complexity.
3. Fix any stale or mixed source logic before building more advanced features.
4. Confirm that Upload History counts roughly match inserted rows in the target tables.
5. Use `DATA_CONSISTENCY_CHECKS.md` and `QA_CHECKLIST.md` as the verification guide.
6. Use the new Sales Reconciliation page to inspect fallback-total and total-difference order rows.
7. Test the new sales upload classifications with duplicate, append-only, gap-fill, and changed-overlap files.
8. Use the changed-overlap review on the sales upload page to understand why blocked Order Listing files differ before designing any merge logic.
9. Use the Sales Truth Review page to inspect regular, memo, complimentary, sales return, cancelled, Part Payment, and fallback-total rows.
10. Review which Part Payment rows have clearly extractable settlement detail and which do not.
11. Review the proposed sales-policy buckets and confirm whether net sale candidates, excluded rows, and unresolved memo rows match business intent.
12. Use the new verification breakdowns to confirm where the current proposed net sales amount comes from by month, source family, and upload.
13. Use the monthly and upload reconciliation checks to confirm every policy bucket closes cleanly before promoting anything into dashboard or profit views.
14. Use the Memo Resolution Review section only as a read-only investigative tool while memo remains unresolved and excluded from live sales truth.
15. Review memo candidate hints as non-binding heuristics only and do not treat them as approved memo-to-sale links.
16. Finalize a memo rule only after stronger evidence standards are agreed and documented.
17. Do not promote memo into dashboard, profit overview, sales analytics, upload logic, ingestion logic, or live business truth in this review stage.
18. Confirm which Order Listing transaction families should be included later in true business sales totals, while keeping payment settlement logic separate from sales truth.
19. Only after consistency is proven, continue building the sales query engine.
20. Keep extending the reusable read-only sales truth review policy layer with tests before any future live policy promotion is considered.
21. Keep the Current Review Snapshot owner-friendly and read-only, and use it only to surface already-derived review outputs without changing policy behavior.
22. Keep the Promotion Readiness Snapshot owner-friendly and read-only, and use it only to explain current review readiness without triggering any live policy action.

## Short-Term Next Steps

1. Build the first real sales query engine layer from `sales_order_imports`.
2. Create one safe order-level analytics output first, instead of trying to rebuild all sales analytics at once.
3. Keep item-level analytics separate and based on `sales_item_imports`.
4. Design the first manual-review workflow for `overlap_with_changes` uploads, using the new changed-overlap review details as the starting point.
5. Decide how corrected re-uploads should be approved later without silent replacement.
6. Define the correct subset of Order Listing transaction families for future business sales truth.
7. Decide the final treatment of cancelled, memo, complimentary, sales return, and Part Payment rows in business totals.
8. Design a separate reliable payment-settlement truth layer for cash, card, due, and other split methods.
9. Promote the read-only sales-policy layer into dashboard and profit logic only after the policy is approved.
10. Finalize whether memo rows should remain unresolved, be excluded, or be included under a later approved rule.
11. If memo review hints are revisited later, require an approved linking rule instead of relying on heuristic candidates alone.
12. Treat weak memo evidence as low-confidence investigation only, not believable linkage.
13. Promote the policy only after month-level and upload-level reconciliation remain clean.
14. Add safer validation for spreadsheet structure before import.
15. Add stronger success and failure messages for uploads and imports.
16. Keep project docs updated whenever a new page, table, or flow is added.
17. If future review rules are added, put them into the reusable read-only policy layer first and protect them with invariant tests before any UI or live-metric promotion.

## Later Roadmap

1. Add trend charts for sales and expenses.
2. Add item-level performance tracking over time.
3. Add expense category trend analysis.
4. Add daily and monthly profit reporting.
5. Add combined order + item insights carefully.
6. Add smarter rule-based recommendations.
7. Add stitch, merge, and corrected re-upload handling for sales files.
8. Expand support to more known sales and expense file formats.
9. Later, introduce AI-powered insights only after the lower-cost SQL and rule-based foundation is stable.
