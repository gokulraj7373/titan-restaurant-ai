# READ THIS FIRST: Titan Session Handoff

## LATEST VERIFIED BATON ANCHOR COMMIT

- `40ba964` Extract reusable upload activity and history query helpers

This is the latest verified commit that the current baton-pass state is anchored to.

This handoff file may itself be refreshed later in a docs-only commit without trying to self-reference that same new commit hash.

## What Was Completed In The Latest Session

- Added reusable imports-page helpers under `lib/import-query/`.
- Extracted the `/sales-imports` page list / loading / error flow to a helper pinned to `sales_imports`.
- Extracted the `/expense-imports` page list / loading / error flow to a helper pinned to `expense_imports`.
- Kept sales and expense import helpers separate from upload, analytics, profit, and `lib/sales-truth-review/*`.

## CURRENT WORKING TREE EXPECTATION

- Expected state: clean working tree after the latest verified baton anchor commit and its documented follow-up continuity updates.

## CURRENT ACTIVE FOCUS

- Keep Titan in a read-only truth-review phase while extending the first small reusable live analytics/query layer across order-level, item-level, expense-side, profit-side, upload-history, and imports-page helpers.
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
