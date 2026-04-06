# READ THIS FIRST: Titan Session Handoff

## LATEST VERIFIED BATON ANCHOR COMMIT

- `5ae65c5` Extract first item-level sales summary query helper

This is the latest verified commit that the current baton-pass state is anchored to.

This handoff file may itself be refreshed later in a docs-only commit without trying to self-reference that same new commit hash.

## What Was Completed In The Latest Session

- Added reusable analytics-detail helpers for Sales Analytics and Expense Analytics.
- Extracted Sales Analytics `Top Selling Items` and `Latest Imported Rows` to a helper under `lib/sales-query/`.
- Extracted Expense Analytics `Top Expense Categories` and `Latest Imported Expense Rows` to a helper under `lib/expense-query/`.
- Kept the sales detail helper on `sales_item_imports` only and the expense detail helper on `expense_imports` only.
- Kept the detail helpers separate from order-level helpers and from `lib/sales-truth-review/*`.

## CURRENT WORKING TREE EXPECTATION

- Expected state: clean working tree after the latest verified baton anchor commit and its documented follow-up continuity updates.

## CURRENT ACTIVE FOCUS

- Keep Titan in a read-only truth-review phase while extending the first small reusable live analytics/query layer across order-level, expense-side, and item-level helpers.
- Improve owner clarity, safety, recovery, and consistency without promoting policy.
- Treat `/sales-truth-review` as the current truth-checking control room while keeping live-facing pages clearly separate from the read-only review layer.

## EXACT NEXT SAFEST STEP

- Verify that each page uses the correct source table before adding more ingestion complexity.

## WARNINGS AND PENDING CAUTIONS

- This file is the highest-priority latest-state baton-pass file.
- Do not promote sales truth into live pages yet.
- Memo remains unresolved and excluded from live sales truth.
- Memo hints remain investigative only.
- Preserve the current proposed net sale candidate total: `Rs 22,18,995.00`.
- Preserve current reconciliation behavior.
- If a future milestone changes logic, architecture, handoff clarity, or meaningful owner-facing surface, update continuity docs immediately.
