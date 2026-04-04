# Titan Restaurant AI: Live Project Brief

## Project Identity And Mission

Titan Restaurant AI is a restaurant intelligence MVP for a non-coder owner.

Current mission:
- ingest restaurant sales and expense files safely
- store imported rows in Supabase
- provide practical dashboard and analytics views
- build order-level sales truth from Petpooja exports in a controlled, review-first way

## Current Phase

Titan is currently in a read-only sales truth review phase.

The main active product surface is `/sales-truth-review`, which acts as the truth-checking control room before any future live sales truth promotion is considered.

For the latest baton-pass state, `SESSION_HANDOFF.md` is the controlling handoff file and should be read first.

## Confirmed Stable Truths

- `/sales-truth-review` is read-only in effect.
- Memo remains unresolved and excluded from live sales truth.
- Memo hints are investigative only and are not approved links.
- Numeric `Part Payment` rows are still treated as valid order-level sale candidates in the current review layer.
- Split payment breakup is not reliably available from the current export text.
- Complimentary rows are excluded.
- Sales return rows are excluded.
- Cancelled rows are excluded.
- The current proposed net sale candidate total remains `Rs 22,18,995.00`.
- Month-wise and upload-wise reconciliation behavior is currently clean in the verified read-only review layer.
- No dashboard, profit overview, analytics, upload, ingestion, normalization, or live policy promotion has happened from the sales truth review work.

## Current Architecture State

- `sales_order_imports` is the order-level review source.
- `sales_item_imports` is the item-level analytics source.
- `expense_imports` is the current expense source.
- Sales truth review logic is extracted into a reusable read-only layer:
  - `lib/sales-truth-review/types.ts`
  - `lib/sales-truth-review/policy.ts`
  - `lib/sales-truth-review/engine.ts`
- Invariant tests protect this extracted layer:
  - `lib/sales-truth-review/policy.test.mjs`
- `/sales-truth-review` consumes that extracted read-only policy engine.
- Live-facing sales pages now share one reusable read-only status notice component:
  - `app/_components/sales-truth-status-notice.tsx`

## Important Owner-Facing Functionality

### Read-Only Truth Review

`/sales-truth-review` now includes:
- Current Review Snapshot
- Promotion Readiness Snapshot
- Review Status Legend
- How To Use This Page
- section jump navigation
- review health chips
- needs-attention summary
- memo resolution review
- monthly policy reconciliation
- upload attribution vs policy attribution check
- deeper section guidance, summary chips, and scan aids

### Live-Facing Reminder

These pages now show a small read-only sales truth status reminder:
- `/dashboard`
- `/profit-overview`
- `/sales-analytics`

That reminder points back to `/sales-truth-review` and does not mean live promotion has happened.

## Non-Negotiable Safety Rules

- No policy promotion without explicit approval.
- No destructive git commands.
- No hidden cleanup.
- No broad refactors.
- Preserve current sales truth review behavior and totals unless explicitly approved otherwise.
- Memo must stay unresolved and excluded from live sales truth unless a future rule is explicitly approved.
- Memo hints must stay investigative only.
- Prefer small, bounded, recoverable milestones.
- Update docs whenever a milestone changes logic, architecture, recovery/handoff clarity, or meaningful owner-facing product surface.
- Keep continuity docs current after meaningful milestones.

## Latest Important Safe Commits

- `96326a7` Refresh latest Titan baton-pass state after continuity cleanup
- `f6afb45` Refresh Titan continuity files and archive old handoff
- `935d0bc` Tighten Titan continuity authority and startup anchoring
- `66e1eff` Strengthen Titan AI continuity startup and handoff rules
- `aa6b1ff` Add AI handoff and operating guide files for Titan
- `d2b1bbd` Extract shared sales truth status notice component
- `4750b41` Add sales truth status notice to live-facing pages
- `80ba687` Add promotion readiness snapshot to sales truth review
- `bbae195` Improve visual review priority in sales truth review
- `3bd6fe5` Add section summary chips to sales truth review
- `fae05c9` Improve scanability of memo and ambiguity review rows
- `d26d39c` Add attention cues to sales truth review navigation
- `f46a560` Add attention summary to sales truth review
- `3066b7e` Reorder sales truth review top layout for owner-first reading
- `00d730b` Add review health chips to sales truth review snapshot
- `ed09506` Add section jump navigation to sales truth review
- `8e75914` Improve read-only guidance in sales truth review sections

## Current Recommended Direction

The exact next safest step remains:
- run a small consistency audit across the live-facing sales pages to confirm each one is using the intended source table and clearly stays separate from the read-only sales truth review layer

This section should stay aligned with `SESSION_HANDOFF.md`.
