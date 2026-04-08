# Next Steps

## Immediate Next Steps

1. Verify that each page uses the correct source table before adding more ingestion complexity.
2. Fix any stale or mixed source logic before building more advanced features.
3. Review whether Upload History should later expose clearer expense-ingestion detail without overstating precision.
4. Use the new Sales Reconciliation page to inspect fallback-total and total-difference order rows.
5. Test the new sales upload classifications with duplicate, append-only, gap-fill, and changed-overlap files.
6. Use the changed-overlap review on the sales upload page to understand why blocked Order Listing files differ before designing any merge logic.
7. Use the Sales Truth Review page to inspect regular, memo, complimentary, sales return, cancelled, Part Payment, and fallback-total rows.
8. Review which Part Payment rows have clearly extractable settlement detail and which do not.
9. Review the proposed sales-policy buckets and confirm whether net sale candidates, excluded rows, and unresolved memo rows match business intent.
10. Use the new verification breakdowns to confirm where the current proposed net sales amount comes from by month, source family, and upload.
11. Use the monthly and upload reconciliation checks to confirm every policy bucket closes cleanly before promoting anything into dashboard or profit views.
12. Use the Memo Resolution Review section only as a read-only investigative tool while memo remains unresolved and excluded from live sales truth.
13. Review memo candidate hints as non-binding heuristics only and do not treat them as approved memo-to-sale links.
14. Finalize a memo rule only after stronger evidence standards are agreed and documented.
15. Do not promote memo into dashboard, profit overview, sales analytics, upload logic, ingestion logic, or live business truth in this review stage.
16. Confirm which Order Listing transaction families should be included later in true business sales totals, while keeping payment settlement logic separate from sales truth.
17. Only after consistency is proven, continue building the sales query engine.
18. Keep extending the reusable read-only sales truth review policy layer with tests before any future live policy promotion is considered.
19. Keep the Current Review Snapshot owner-friendly and read-only, and use it only to surface already-derived review outputs without changing policy behavior.
20. Keep the Promotion Readiness Snapshot owner-friendly and read-only, and use it only to explain current review readiness without triggering any live policy action.
21. Keep the live-facing sales truth status reminder short, owner-friendly, and clearly read-only until a later explicit promotion decision is approved.
22. Keep the shared sales truth status notice component consistent across live-facing pages, and treat it only as read-only guidance until a later approved promotion decision exists.
23. Keep `LIVE_PROJECT.md`, `AGENT_OPERATING_RULES.md`, and `SESSION_HANDOFF.md` current after meaningful milestones so a new AI can take over safely without re-explaining the project.
24. Keep `SESSION_HANDOFF.md` updated first whenever the latest safe commit, active focus, or exact next safest step changes.
25. Keep the completed live-facing sales-page consistency audit recorded as a finished check so future agents do not repeat it as the next baton step.
26. Keep the completed Upload History consistency audit recorded as a finished check so future agents do not repeat it as the next baton step.
27. Keep the completed Expense Analytics consistency audit recorded as a finished check so future agents do not repeat it as the next baton step.
28. Keep the live order-level sales query helpers small, deterministic, and separate from item-level analytics and the read-only sales truth review layer.
29. Keep the first reusable expense-side summary helper small, deterministic, and separate from the sales-query helpers and the read-only sales truth review layer.
30. Keep the first reusable item-level sales summary helper small, deterministic, and separate from order-level helpers and the read-only sales truth review layer.
31. Keep reusable analytics-detail helpers small, deterministic, and pinned to their intended source tables without mixing sales, expense, or review-layer logic.
32. Keep reusable profit summary helpers small, deterministic, and pinned to the page's intended live-facing sources without mixing in review-layer logic.
33. Keep reusable upload-history helpers small, deterministic, and pinned to `uploads_log` only without mixing in sales, expense, profit, or review-layer logic.
34. Keep reusable imports-page helpers small, deterministic, and pinned to their intended import tables without mixing in upload, analytics, profit, or review-layer logic.

## Short-Term Next Steps

1. Keep extending the first real sales query engine layer from `sales_order_imports`.
2. Move one safe order-level analytics output family at a time, instead of trying to rebuild all sales analytics at once.
3. Start the first reusable expense query layer from `expense_imports`.
4. Keep item-level analytics separate and based on `sales_item_imports`.
5. Extend item-level analytics one safe summary or output family at a time, instead of rewriting the full page at once.
6. Extend reusable analytics detail helpers one safe section family at a time, instead of rewriting whole analytics pages.
7. Extend profit-side reusable helpers one safe summary or output family at a time, instead of rewriting the full profit page.
8. Extend upload-history helpers one safe query family at a time, instead of rewriting dashboard or uploads pages broadly.
9. Extend imports-page helpers one safe query family at a time, instead of rewriting import pages or ingestion flows broadly.
10. Design the first manual-review workflow for `overlap_with_changes` uploads, using the new changed-overlap review details as the starting point.
11. Decide how corrected re-uploads should be approved later without silent replacement.
12. Define the correct subset of Order Listing transaction families for future business sales truth.
13. Decide the final treatment of cancelled, memo, complimentary, sales return, and Part Payment rows in business totals.
14. Design a separate reliable payment-settlement truth layer for cash, card, due, and other split methods.
15. Promote the read-only sales-policy layer into dashboard and profit logic only after the policy is approved.
16. Finalize whether memo rows should remain unresolved, be excluded, or be included under a later approved rule.
17. If memo review hints are revisited later, require an approved linking rule instead of relying on heuristic candidates alone.
18. Treat weak memo evidence as low-confidence investigation only, not believable linkage.
19. Promote the policy only after month-level and upload-level reconciliation remain clean.
20. Add safer validation for spreadsheet structure before import.
21. Add stronger success and failure messages for uploads and imports.
22. Keep project docs updated whenever a new page, table, or flow is added.
23. If future review rules are added, put them into the reusable read-only policy layer first and protect them with invariant tests before any UI or live-metric promotion.

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
