# READ THIS FIRST: Titan Session Handoff

## LATEST VERIFIED BATON ANCHOR COMMIT

- `eae96a2` Record Expense Analytics audit and refresh baton step

This is the latest verified commit that the current baton-pass state is anchored to.

This handoff file may itself be refreshed later in a docs-only commit without trying to self-reference that same new commit hash.

## What Was Completed In The Latest Session

- Added the first small reusable order-level sales query helper under `lib/sales-query/`.
- Extracted the dashboard's existing `Imported Order Sales` output to use that helper.
- Kept the helper narrow and deterministic by using `sales_order_imports` only.
- Kept item-level analytics separate and avoided any dependency on `lib/sales-truth-review/*`.
- Preserved the existing `Imported Order Sales` result while leaving the rest of the dashboard sales logic unchanged in this milestone.

## CURRENT WORKING TREE EXPECTATION

- Expected state: clean working tree after the latest verified baton anchor commit and its documented follow-up continuity updates.

## CURRENT ACTIVE FOCUS

- Keep Titan in a read-only truth-review phase while beginning the first small reusable live sales-query layer.
- Improve owner clarity, safety, recovery, and consistency without promoting policy.
- Treat `/sales-truth-review` as the current truth-checking control room while keeping live-facing pages clearly separate from the read-only review layer.

## EXACT NEXT SAFEST STEP

- Extend the new order-level sales query layer to one more safe existing dashboard output without touching item-level analytics or the read-only truth-review layer.

## WARNINGS AND PENDING CAUTIONS

- This file is the highest-priority latest-state baton-pass file.
- Do not promote sales truth into live pages yet.
- Memo remains unresolved and excluded from live sales truth.
- Memo hints remain investigative only.
- Preserve the current proposed net sale candidate total: `Rs 22,18,995.00`.
- Preserve current reconciliation behavior.
- If a future milestone changes logic, architecture, handoff clarity, or meaningful owner-facing surface, update continuity docs immediately.
