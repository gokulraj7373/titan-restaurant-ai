# Next Steps

## Immediate Next Steps

1. Design the smallest safe evidence checklist that must be satisfied before any future explicit live-promotion decision, while keeping the system fully read-only for now.
2. Use the new verification breakdowns to confirm where the current proposed net sales amount comes from by month, source family, and upload.
3. Use the Memo Resolution Review section only as a read-only investigative tool while memo remains unresolved and excluded from live sales truth.
4. Review memo candidate hints as non-binding heuristics only and do not treat them as approved memo-to-sale links.
5. Finalize a memo rule only after stronger evidence standards are agreed and documented.
6. Do not promote memo into dashboard, profit overview, sales analytics, upload logic, ingestion logic, or live business truth in this review stage.
7. Use the changed-overlap review on the sales upload page to understand why blocked Order Listing files differ before designing any merge logic.
8. Fix any stale or mixed source logic before building more advanced features if a later check finds any.
9. Only after consistency is proven, continue building the sales query engine.
10. Keep extending the reusable read-only sales truth review policy layer with tests before any future live policy promotion is considered.
11. Keep the Current Review Snapshot owner-friendly and read-only, and use it only to surface already-derived review outputs without changing policy behavior.
12. Keep the Sales Policy Bucket Snapshot owner-friendly and read-only, and use it only to explain current candidate-versus-excluded-versus-unresolved posture without implying approved live policy.
13. Keep the Reconciliation Closure Snapshot owner-friendly and read-only, and use it only to explain current month-versus-upload closure posture without implying approved live policy.
14. Keep the Transaction Family Inclusion Snapshot owner-friendly and read-only, and use it only to explain current later-includable-versus-excludable-versus-unresolved-versus-diagnostic family posture without implying approved live policy.
15. Keep the Later Promotion Decision Snapshot owner-friendly and read-only, and use it only to explain what already looks strong, what still remains unresolved, and why live promotion still has not happened.
16. Keep the Key Row Family Snapshot owner-friendly and read-only, and use it only to speed up inspection of already-derived row families without changing policy behavior.
17. Keep the Part Payment Settlement Snapshot owner-friendly and read-only, and use it only to explain current export limits without overstating settlement certainty.
18. Keep the Promotion Readiness Snapshot owner-friendly and read-only, and use it only to explain current review readiness without triggering any live policy action.
19. Keep the live-facing sales truth status reminder short, owner-friendly, and clearly read-only until a later explicit promotion decision is approved.
20. Keep the shared sales truth status notice component consistent across live-facing pages, and treat it only as read-only guidance until a later approved promotion decision exists.
21. Keep `LIVE_PROJECT.md`, `AGENT_OPERATING_RULES.md`, and `SESSION_HANDOFF.md` current after meaningful milestones so a new AI can take over safely without re-explaining the project.
22. Keep `SESSION_HANDOFF.md` updated first whenever the latest safe commit, active focus, or exact next safest step changes.
23. Keep the completed live-facing sales-page consistency audit recorded as a finished check so future agents do not repeat it as the next baton step.
24. Keep the completed Upload History consistency audit recorded as a finished check so future agents do not repeat it as the next baton step.
25. Keep the completed Upload History precision review recorded as a finished check so future agents do not repeat it as the next baton step.
26. Keep the completed Upload History wording clarification recorded as a finished owner-facing check so future agents do not repeat it as the next baton step.
27. Keep the completed Expense Analytics consistency audit recorded as a finished check so future agents do not repeat it as the next baton step.
28. Keep the completed page-by-page source-boundary audit recorded as a finished continuity check so future agents do not repeat it as the next baton step.
29. Keep the completed Sales Reconciliation inspection scanability step recorded as a finished owner-facing diagnostic improvement so future agents do not repeat it as the next baton step.
30. Keep the completed sales upload classification validation step recorded as a finished bounded check so future agents do not repeat it as the next baton step.
31. Keep the completed Sales Truth Review row-family inspection step recorded as a finished owner-facing scanability improvement so future agents do not repeat it as the next baton step.
32. Keep the completed Part Payment settlement-detail inspection step recorded as a finished owner-facing scanability improvement so future agents do not repeat it as the next baton step.
33. Keep the completed sales-policy bucket inspection step recorded as a finished owner-facing scanability improvement so future agents do not repeat it as the next baton step.
34. Keep the completed reconciliation-closure inspection step recorded as a finished owner-facing scanability improvement so future agents do not repeat it as the next baton step.
35. Keep the completed transaction-family inclusion inspection step recorded as a finished owner-facing scanability improvement so future agents do not repeat it as the next baton step.
36. Keep the completed promotion-readiness posture inspection step recorded as a finished owner-facing scanability improvement so future agents do not repeat it as the next baton step.
37. Keep the live order-level sales query helpers small, deterministic, and separate from item-level analytics and the read-only sales truth review layer.
38. Keep the first reusable expense-side summary helper small, deterministic, and separate from the sales-query helpers and the read-only sales truth review layer.
39. Keep the first reusable item-level sales summary helper small, deterministic, and separate from order-level helpers and the read-only sales truth review layer.
40. Keep reusable analytics-detail helpers small, deterministic, and pinned to their intended source tables without mixing sales, expense, or review-layer logic.
41. Keep reusable profit summary helpers small, deterministic, and pinned to the page's intended live-facing sources without mixing in review-layer logic.
42. Keep reusable upload-history helpers small, deterministic, and pinned to `uploads_log` only without mixing in sales, expense, profit, or review-layer logic.
43. Keep reusable imports-page helpers small, deterministic, and pinned to their intended import tables without mixing in upload, analytics, profit, or review-layer logic.
44. Keep reusable reconciliation-query helpers small, deterministic, and pinned to `sales_order_imports` only without mixing in truth-review policy or live-facing analytics logic.
45. Keep `/upload/sales` modularization steps conservative and presentational-first, without moving parsing, routing, overlap, insertion, or policy logic.
46. Keep `/upload/sales` render extractions narrowly scoped so the full diagnostics subsystem and the changed-overlap review remain presentational only.

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
10. Extend reconciliation-query helpers one safe diagnostic family at a time, instead of rewriting the read-only reconciliation page broadly.
11. If `/upload/sales` is modularized further, keep the next step read-only or presentational before touching any sensitive ingestion or overlap boundary.
12. If `/upload/sales` is modularized again after this diagnostics-subsystem extraction, keep the next slice display-only unless a new bounded milestone explicitly approves touching behavior.
13. Design the first manual-review workflow for `overlap_with_changes` uploads, using the new changed-overlap review details as the starting point.
14. Decide how corrected re-uploads should be approved later without silent replacement.
15. Define the correct subset of Order Listing transaction families for future business sales truth.
16. Decide the final treatment of cancelled, memo, complimentary, sales return, and Part Payment rows in business totals.
17. Design a separate reliable payment-settlement truth layer for cash, card, due, and other split methods.
18. Promote the read-only sales-policy layer into dashboard and profit logic only after the policy is approved.
19. Finalize whether memo rows should remain unresolved, be excluded, or be included under a later approved rule.
20. If memo review hints are revisited later, require an approved linking rule instead of relying on heuristic candidates alone.
21. Treat weak memo evidence as low-confidence investigation only, not believable linkage.
22. Promote the policy only after month-level and upload-level reconciliation remain clean.
23. Add safer validation for spreadsheet structure before import.
24. Add stronger success and failure messages for uploads and imports.
25. Keep project docs updated whenever a new page, table, or flow is added.
26. If future review rules are added, put them into the reusable read-only policy layer first and protect them with invariant tests before any UI or live-metric promotion.

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
