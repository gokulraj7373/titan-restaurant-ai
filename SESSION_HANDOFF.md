# READ THIS FIRST: Titan Session Handoff

## LATEST VERIFIED BATON ANCHOR COMMIT

- `64ac04f` Extract reusable imports page query helpers

This is the latest verified commit that the current baton-pass state is anchored to.

This handoff file may itself be refreshed later in a docs-only commit without trying to self-reference that same new commit hash.

## What Was Completed In The Latest Session

- Added reusable sales-reconciliation helpers under `lib/reconciliation-query/`.
- Extracted the `/sales-reconciliation` summary diagnostics to a helper pinned to `sales_order_imports`.
- Extracted the two read-only diagnostic row sections to a helper pinned to `sales_order_imports`.
- Kept the reconciliation helpers separate from `/sales-truth-review`, live-facing pages, and `lib/sales-truth-review/*`.

## CURRENT WORKING TREE EXPECTATION

- Expected state: clean working tree after the latest verified baton anchor commit and its documented follow-up continuity updates.

## CURRENT ACTIVE FOCUS

- Keep Titan in a read-only truth-review phase while extending the first small reusable live analytics/query layer across order-level, item-level, expense-side, profit-side, upload-history, imports-page, and reconciliation-query helpers.
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
