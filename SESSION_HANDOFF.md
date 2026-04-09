# READ THIS FIRST: Titan Session Handoff

## LATEST VERIFIED BATON ANCHOR COMMIT

- `5228835` Extract full order listing diagnostics subsystem from sales upload page

This is the latest verified commit that the current baton-pass state is anchored to.

This handoff file may itself be refreshed later in a docs-only commit without trying to self-reference that same new commit hash.

## What Was Completed In The Latest Session

- Completed one bounded Part Payment inspection-and-clarity step for `/sales-truth-review`.
- Confirmed the page still stays read-only in effect, remains pinned to the current review layer, and keeps policy buckets, totals, memo stance, and promotion state unchanged.
- Confirmed the current Part Payment review surface still groups rows into clearly extractable, unavailable-from-export, and ambiguous settlement-detail buckets using exported `payment_description` text plus the current derived review flags.
- Added one compact Part Payment Settlement Snapshot so the owner can see what Titan can and cannot currently infer from Part Payment rows without changing policy, inclusion logic, or settlement-truth certainty.

## CURRENT WORKING TREE EXPECTATION

- Expected state: clean working tree after the latest verified baton anchor commit and its documented follow-up continuity updates.

## CURRENT ACTIVE FOCUS

- Keep Titan in a read-only truth-review phase while preserving the confirmed clean source boundaries, the clarified owner-safe Upload History wording, the improved Sales Reconciliation scan path, the validated sales upload classifications, the improved Sales Truth Review family scan path, the improved Part Payment review scan path, and the separation between live-facing pages and the read-only review layer.
- Improve owner clarity, safety, recovery, and consistency without promoting policy.
- Treat `/sales-truth-review` as the current truth-checking control room while keeping live-facing pages clearly separate from the read-only review layer.

## EXACT NEXT SAFEST STEP

- Review the proposed sales-policy buckets and confirm whether net sale candidates, excluded rows, and unresolved memo rows match business intent.

## WARNINGS AND PENDING CAUTIONS

- This file is the highest-priority latest-state baton-pass file.
- Do not promote sales truth into live pages yet.
- Memo remains unresolved and excluded from live sales truth.
- Memo hints remain investigative only.
- Preserve the current proposed net sale candidate total: `Rs 22,18,995.00`.
- Preserve current reconciliation behavior.
- Upload History remains directionally safe overall, but expense upload rows still carry lighter persisted log detail than sales upload rows.
- Sales Reconciliation remains a diagnostic trust-check page, not final business truth.
- Sales upload classifications validated cleanly in repo-local checks, but they remain conservative upload decisions, not business truth or merge-policy approval.
- Sales Truth Review now gives a faster family-level scan path, but it still remains read-only guidance and not final approved business truth.
- Part Payment review now gives a clearer extractable-versus-unavailable-versus-ambiguous scan path, but it still does not prove final payment-settlement truth from the current export alone.
- If a future milestone changes logic, architecture, handoff clarity, or meaningful owner-facing surface, update continuity docs immediately.
