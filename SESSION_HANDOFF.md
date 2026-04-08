# READ THIS FIRST: Titan Session Handoff

## LATEST VERIFIED BATON ANCHOR COMMIT

- `4e0e25e` Extract reusable analytics detail query helpers

This is the latest verified commit that the current baton-pass state is anchored to.

This handoff file may itself be refreshed later in a docs-only commit without trying to self-reference that same new commit hash.

## What Was Completed In The Latest Session

- Added the first reusable profit summary helper under `lib/profit-query/profit-overview-summary.ts`.
- Extracted `/profit-overview` summary outputs to use that helper for total sales, total expenses, estimated gross profit, profit margin, and imported row counts.
- Kept the helper narrow and deterministic by using the page's existing live-facing sources only: `sales_order_imports` and `expense_imports`.
- Kept the helper separate from dashboard, sales analytics, expense analytics, and `lib/sales-truth-review/*`.

## CURRENT WORKING TREE EXPECTATION

- Expected state: clean working tree after the latest verified baton anchor commit and its documented follow-up continuity updates.

## CURRENT ACTIVE FOCUS

- Keep Titan in a read-only truth-review phase while extending the first small reusable live analytics/query layer across order-level, item-level, expense-side, and profit-side helpers.
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
