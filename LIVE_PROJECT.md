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

That baton-pass file uses a latest verified baton-anchor model, so it can be refreshed in a later docs-only commit without trying to self-reference that same new commit hash.

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
- A live-facing page consistency audit has confirmed that `/dashboard`, `/profit-overview`, and `/sales-analytics` stay separate from the read-only sales truth review layer.
- No accidental dependency on `lib/sales-truth-review/*` was found in those audited live-facing pages.
- A small Upload History consistency audit has confirmed that sampled imported sales uploads match their logged inserted-row counts against `sales_order_imports` and `sales_item_imports`.
- That same audit also confirmed that expense uploads still use older lighter log semantics, so `/uploads` stays directionally safe but less precise for expenses than for sales.
- A small Expense Analytics consistency audit has confirmed that `/expense-analytics` reads from `expense_imports` only and stays separate from the read-only sales truth review layer.
- A broader read-only source-boundary audit has now confirmed that the audited live-facing pages, uploads/imports pages, reconciliation page, and `/upload/sales` stay on their intended helper layers and source tables overall.
- That same audit also confirmed that `/sales-truth-review` remains separate from the live-facing pages while intentionally using `sales_order_imports` as its primary review source and `uploads_log` for upload-attribution and latest-import review sections.
- A read-only Upload History precision review has now confirmed that `/uploads` and the dashboard upload-summary area remain directionally safe overall.
- That same review also confirmed that sales uploads persist richer ingestion detail in `uploads_log`, while expense uploads still use older lighter log semantics there.
- The current Upload History UI does not falsely claim exact expense inserted-row precision, so the real issue is logging-detail asymmetry rather than a product mismatch.
- A bounded wording-only `/uploads` clarification step has now made lighter expense rows read more clearly as stored upload history unless exact ingest counts are actually logged there.
- A bounded page-local Sales Reconciliation scanability step has now added a compact Inspection Snapshot and clearer row-family guidance without changing reconciliation math, helper logic, or policy behavior.
- A bounded validation step has now confirmed that duplicate, append-only, gap-fill, and changed-overlap classifications still behave as intended in the current sales upload flow.
- A bounded page-local Sales Truth Review scanability step has now added a compact Key Row Family Snapshot and clearer section-level cues for regular, memo, complimentary, sales return, cancelled, Part Payment, and fallback-total attention rows without changing review policy, totals, or promotion state.
- A bounded page-local Part Payment review step has now confirmed that the current review surface separates clearly extractable, unavailable-from-export, and ambiguous settlement-detail rows from existing exported text and derived review state only.
- A bounded page-local sales-policy bucket review step has now confirmed that the current proposed policy posture still matches repo truth and has added a compact candidate-versus-excluded-versus-unresolved snapshot using existing derived counts only.
- A bounded page-local reconciliation-closure review step has now confirmed that the current repo posture still shows month-wise and upload-wise closure as clean in the verified read-only review layer and has added a compact closure snapshot using existing derived checks only.
- A bounded page-local transaction-family inclusion review step has now confirmed that regular rows and numeric Part Payment rows remain later likely includable, cancelled / complimentary / sales return rows remain clearly excludable, memo remains unresolved, and fallback-total attention rows remain diagnostic-only in the verified read-only review layer.
- A bounded page-local later-promotion posture review step has now confirmed that the current page is clearer about what is already strong, what is still unresolved, and why live promotion still has not happened, while keeping the page fully read-only in business effect.
- A bounded page-local live-promotion evidence-checklist review step has now confirmed that the current page can show the smallest safe evidence checklist for any later explicit promotion discussion without changing policy, totals, memo stance, or promotion state.
- A bounded page-local later-protocol-readiness review step has now confirmed that the current page is organized enough to discuss drafting a later explicit promotion-decision protocol without changing policy, totals, memo stance, or promotion state.

## Current Architecture State

- `sales_order_imports` is the order-level review source.
- `sales_item_imports` is the item-level analytics source.
- `expense_imports` is the current expense source.
- Titan now also has a first reusable order-level live sales query helper:
  - `lib/sales-query/order-sales-summary.ts`
- Titan now also has a reusable dashboard order-level KPI helper:
  - `lib/sales-query/dashboard-order-kpis.ts`
- Titan now also has a first reusable item-level sales summary helper:
  - `lib/sales-query/item-sales-summary.ts`
- Titan now also has a reusable item-level sales analytics detail helper:
  - `lib/sales-query/item-sales-details.ts`
- Titan now also has a first reusable expense-side summary helper:
  - `lib/expense-query/expense-summary.ts`
- Titan now also has a reusable expense analytics detail helper:
  - `lib/expense-query/expense-details.ts`
- Titan now also has a reusable profit summary helper:
  - `lib/profit-query/profit-overview-summary.ts`
- Titan now also has reusable upload-history helpers:
  - `lib/upload-query/upload-activity-summary.ts`
  - `lib/upload-query/upload-history-list.ts`
- Titan now also has reusable imports-page helpers:
  - `lib/import-query/sales-import-list.ts`
  - `lib/import-query/expense-import-list.ts`
- Titan now also has reusable sales-reconciliation helpers:
  - `lib/reconciliation-query/sales-reconciliation-summary.ts`
  - `lib/reconciliation-query/sales-reconciliation-details.ts`
- Titan now also has a reusable sales-upload diagnostics panel:
  - `app/upload/sales/order-listing-diagnostics-panel.tsx`
- Titan now also has a reusable changed-overlap review panel:
  - `app/upload/sales/changed-overlap-review-panel.tsx`
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
- Later Promotion Decision Snapshot
- Live Promotion Evidence Checklist
- Later Promotion Protocol Readiness
- Transaction Family Inclusion Snapshot
- Sales Policy Bucket Snapshot
- Reconciliation Closure Snapshot
- Key Row Family Snapshot
- Part Payment Settlement Snapshot
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
- clearer family-level scan cues for regular, memo, complimentary, sales return, cancelled, Part Payment, and fallback-total attention rows
- clearer later-promotion guidance about what already looks strong, what still remains unresolved, and why live promotion still has not happened
- clearer live-promotion evidence guidance about what already looks strong, what still remains unresolved, what still blocks live promotion, and what would still need later explicit approval
- clearer later-protocol guidance about whether the current evidence is organized enough to support drafting a later explicit promotion-decision protocol while still remaining read-only
- clearer transaction-family inclusion guidance about which Order Listing families currently look later includable, clearly excludable, unresolved, or diagnostic-only
- clearer sales-policy guidance about what Titan currently treats as candidate, excluded, and unresolved in review
- clearer reconciliation-closure guidance about whether policy buckets are currently closing cleanly by month and by upload
- clearer Part Payment guidance about what the current export text can and cannot safely prove about settlement breakup

This page remains read-only in effect.
It primarily reviews `sales_order_imports` and also uses `uploads_log` for upload-attribution and latest-import review sections.

### Live-Facing Reminder

These pages now show a small read-only sales truth status reminder:
- `/dashboard`
- `/profit-overview`
- `/sales-analytics`

That reminder points back to `/sales-truth-review` and does not mean live promotion has happened.

### First Live Sales Query Layer

- The dashboard now uses one reusable order-level sales query helper for `Imported Order Sales`.
- That helper reads from `sales_order_imports` only.
- The dashboard now also uses one reusable order-level KPI helper for `Today Sales`, `Orders`, and `Average Order Value`.
- That KPI helper also reads from `sales_order_imports` only.
- This is a maintainability step only and does not promote the read-only sales truth review layer into live truth.

### First Item-Level Sales Query Layer

- Sales Analytics now uses one reusable item-level sales summary helper for `Imported Rows`, `Item Revenue Total`, `Total Quantity`, and `Unique Bills`.
- That helper reads from `sales_item_imports` only.
- This is a maintainability step only and does not affect the read-only sales truth review layer or live promotion state.
- Sales Analytics now also uses one reusable detail helper for `Top Selling Items` and `Latest Imported Rows`.
- That detail helper also reads from `sales_item_imports` only.

### First Expense Query Layer

- The dashboard now uses one reusable expense-side summary helper for `Imported Expense Amount`.
- Expense Analytics now uses that same helper for `Imported Expense Rows`, `Total Expense Amount`, `Unique Categories`, and `Latest Expense Date`.
- That helper reads from `expense_imports` only.
- This is a maintainability step only and does not affect sales truth review policy or live promotion state.
- Expense Analytics now also uses one reusable detail helper for `Top Expense Categories` and `Latest Imported Expense Rows`.
- That detail helper also reads from `expense_imports` only.

### First Profit Query Layer

- Profit Overview now uses one reusable summary helper for `Total Order-Level Sales`, `Total Expense Amount`, `Estimated Gross Profit`, `Profit Margin %`, and imported row counts.
- That helper reads only from the page's existing live-facing sources: `sales_order_imports` and `expense_imports`.
- This is a maintainability step only and does not affect the read-only sales truth review layer or live promotion state.

### First Upload Query Layer

- The dashboard now uses one reusable upload-activity helper for recent upload activity, sales upload count, and expense upload count.
- The uploads page now uses one reusable upload-history helper for uploads-log listing and filter-ready results.
- These helpers read from `uploads_log` only.
- This is a maintainability step only and does not affect the read-only sales truth review layer or live promotion state.
- Upload History is still directionally safe overall.
- Sales-side upload logging currently carries stronger persisted ingestion detail than expense-side upload logging.
- Expense upload rows in Upload History should still be read as raw upload history unless exact expense-ingestion counts are explicitly present in `uploads_log`.
- Upload History now also explains that parsed, inserted, and rejected counts appear only when that detail was logged for a specific upload.

### First Imports Query Layer

- The `/sales-imports` page now uses one reusable helper for its current list / loading / error flow.
- That helper reads from `sales_imports` only.
- The `/expense-imports` page now uses one reusable helper for its current list / loading / error flow.
- That helper reads from `expense_imports` only.
- These helpers are a maintainability step only and do not affect the read-only sales truth review layer or live promotion state.

### First Reconciliation Query Layer

- The `/sales-reconciliation` page now uses reusable helpers for its current read-only summary diagnostics and its two current diagnostic row sections.
- These helpers read from `sales_order_imports` only.
- These helpers are a maintainability step only and do not affect truth-review policy, memo handling, or live promotion state.
- The page now also includes one compact Inspection Snapshot plus section-level scan cues so fallback-total rows and large-total-difference rows are faster to inspect.
- That scanability step uses already-loaded diagnostic data only and does not change helper outputs, row membership, or totals.

### First Safe Upload-Sales Render Extraction

- The `/upload/sales` page now uses one bounded presentational container for the full `Order Listing Classification Diagnostics` UI subsystem.
- That diagnostics container now composes the already-extracted `Changed Overlap Review` panel.
- This extraction is presentational only.
- Parsing, routing, overlap decisions, insertion behavior, and uploads-log behavior remain in `app/upload/sales/page.tsx`.
- This step does not affect truth-review policy, memo handling, or live promotion state.
- The `/upload/sales` page now also uses one pure render-support component for the `Changed Overlap Review` display block.
- That extraction is also presentational only.
- The Order Listing diagnostics panel now also explains what the current classification means and what Titan will do next, using already-derived upload state only.
- This clarity step does not change classification behavior, upload logging semantics, overlap rules, or database behavior.

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

- `5228835` Extract full order listing diagnostics subsystem from sales upload page
- `40178b5` Extract changed overlap review panel from sales upload page
- `c8c2364` Extract order listing diagnostics panel from sales upload page
- `4b93de1` Extract reusable sales reconciliation query helpers
- `64ac04f` Extract reusable imports page query helpers
- `40ba964` Extract reusable upload activity and history query helpers
- `0a0e877` Extract first profit summary query helper
- `4e0e25e` Extract reusable analytics detail query helpers
- `5ae65c5` Extract first item-level sales summary query helper
- `33d3957` Extract first expense summary query helper
- `1d1eda6` Extract dashboard order KPI query helper
- `6e173ea` Extract first order-level sales query helper for dashboard
- `eae96a2` Record Expense Analytics audit and refresh baton step
- `907a233` Record Upload History audit and refresh baton step
- `6e7e6d6` Finalize Titan continuity docs and baton-pass anchor model
- `ed49b38` Refresh Titan baton-pass docs and harden doc update rules
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
- design the smallest read-only draft structure for a future explicit promotion-decision protocol, without approving or implementing promotion

This section should stay aligned with `SESSION_HANDOFF.md`.
