# Current State

## Project Status

The project is currently a working MVP-style restaurant dashboard with uploads, imports, analytics pages, business summaries, and a profit overview.

The project now has smart sales ingestion live for 2 known Petpooja spreadsheet formats, and the current safety focus is bounded consistency and owner-clarity review across ingestion, tables, and analytics pages.

## Pages Available

- `/dashboard`
- `/upload/sales`
- `/upload/expenses`
- `/uploads`
- `/sales-imports`
- `/expense-imports`
- `/sales-analytics`
- `/sales-reconciliation`
- `/sales-truth-review`
- `/expense-analytics`
- `/profit-overview`
- `/login`

## Database Tables Available

- `app_status`
  Used for the Supabase connection status message on the dashboard.

- `uploads_log`
  Stores uploaded file history such as kind, file name, storage path, and created time.

- `sales_imports`
  Stores imported sales rows.

- `expense_imports`
  Stores imported expense rows.

## Real Sales Table Structure

The new real sales ingestion direction now targets:

- `sales_order_imports`
- `sales_item_imports`

These are now the real sales ingestion targets for the smart sales upload flow.

## Storage Usage

- Supabase Storage bucket: `uploads`
- Sales files are uploaded into paths like `sales/...`
- Expense files are uploaded into paths like `expenses/...`

## Current Live Features

- Sales file upload page
- Expense file upload page
- Smart sales upload detects 2 known Petpooja spreadsheet formats
- Smart sales upload routes accepted files into `sales_order_imports` or `sales_item_imports`
- Smart sales upload rejects unsupported sales spreadsheets safely
- Smart sales Order Listing ingestion keeps only one clean main row per order
- Smart sales Order Listing ingestion skips payment split child rows so order totals are not inflated
- Smart sales upload now classifies known-format uploads before insert
- Smart sales upload allows safe `append_only` and safe `gap_fill` inserts
- Smart sales upload blocks changed overlaps for manual review instead of auto-merging
- Smart sales upload now shows Order Listing classification diagnostics on the upload page for safer debugging
- Smart sales upload now shows changed-overlap review details for blocked Order Listing files, including changed fields and simple change tags
- Smart sales Order Listing rows are now classified into transaction families such as regular, advance-order, Memo, sales return, and complimentary
- Smart sales upload logs ingest status in `uploads_log`
- Expense upload creates demo expense import rows
- Upload log writing to `uploads_log`
- File storage in Supabase Storage
- Dashboard KPI cards using real `sales_order_imports` data
- Dashboard KPI logic based on the latest `bill_date` in `sales_order_imports`
- Dashboard business insight section using rule-based logic
- Dashboard upload summary using real upload counts
- Dashboard imported sales summary
- Dashboard imported expense summary
- Dashboard recent upload activity using `uploads_log`
- Dashboard file link generation using signed Supabase Storage URLs
- Upload history page with filters
- Sales imports page
- Expense imports page
- Sales analytics page with summary cards
- Sales analytics top selling items section
- Sales reconciliation page for order-level diagnostics and trust-checking
- Sales truth review page for transaction-type review before finalizing business sales rules
- Expense analytics page with summary cards
- Expense analytics top expense categories section
- Profit overview page

## Important Current Behavior

- Sales upload now supports:
  - Petpooja Order Listing Excel
  - Petpooja Item Wise Report With Bill No. With Time Excel
- For Petpooja Order Listing:
  - only the real main order row is inserted into `sales_order_imports`
  - payment split child rows are skipped
  - order-level sales truth currently comes from `sales_order_imports.effective_total`
  - `grand_total` alone cannot be trusted for every valid main row
  - some valid Part Payment main rows have `grand_total = 0`, and `payment_description` carries the real total
  - Memo, `SR`, and `C` rows are preserved as meaningful transaction rows
  - Memo, `SR`, and `C` rows are excluded from normal numeric order-key overlap comparison
  - normal business sales truth must later be computed from the correct subset of transaction families, not every recorded transaction row blindly
- Sales upload classification now checks overlap before insert:
  - `exact_duplicate` -> blocked
  - `append_only` -> inserted
  - `gap_fill` -> inserted only when clearly safe
  - `overlap_unchanged` -> blocked
  - `overlap_with_changes` -> blocked for manual review
  - `manual_review_needed` -> blocked
- `overlap_with_changes` is a protective review block
- changed-overlap review now helps the owner see what changed before any future merge or corrective refresh rule is added
- For Order Listing, a mixed file with unchanged existing orders plus new safe orders is now allowed and inserts only the new rows.
- Expense upload currently creates demo expense import rows after upload.
- Sales analytics uses `sales_item_imports` as the item-level source table.
- `sales_item_imports` is for item-level analytics, not the final business sales truth.
- Sales reconciliation uses `sales_order_imports` as a read-only diagnostic source.
- Sales reconciliation is a trust-check page, not a business dashboard page.
- Sales truth review uses `sales_order_imports` as its primary read-only transaction-review source.
- Sales truth review also uses `uploads_log` for upload-attribution and latest-import review sections.
- Sales truth review is for classification and business-rule review, not final business totals.
- Numeric `Part Payment` rows are currently still treated as valid order-level sale candidates.
- The current Order Listing export does not yet reliably provide full payment breakup for every `Part Payment` row.
- Sales truth review now separates sale truth from payment-breakup truth and shows whether payment split detail looks extractable, unavailable, or ambiguous.
- Sales truth review now also shows a proposed sales-policy layer:
  - numeric rows, including numeric Part Payment rows, are net sale candidates
  - cancelled rows are excluded
  - complimentary rows are excluded
  - sales return rows are excluded
  - memo rows remain unresolved
- This proposed sales-policy layer is still read-only review logic, not yet the live dashboard or profit formula.
- Sales truth review now also includes a compact Sales Policy Bucket Snapshot near the top of the page.
- That snapshot uses already-derived bucket counts and amounts to explain what Titan currently treats as candidate, excluded, and unresolved without changing policy, totals, or promotion state.
- Sales truth review now also includes a compact Reconciliation Closure Snapshot near the top of the page.
- That snapshot uses the existing month-wise and upload-wise reconciliation outputs to explain whether the current policy buckets are closing cleanly without changing policy, totals, attribution logic, or promotion state.
- Sales truth review now also includes a compact Transaction Family Inclusion Snapshot near the top of the page.
- That snapshot uses the existing family counts and section posture to explain which Order Listing families currently look later includable, clearly excludable, unresolved, or diagnostic-only without changing policy, totals, or promotion state.
- Sales truth review now also includes verification breakdowns by month, source family, sales-policy bucket, and latest imported sales-order files.
- Sales truth review now also includes monthly policy reconciliation and upload-attribution vs policy-attribution checks.
- Memo rows now stay in `unresolved_memo` during read-only policy review even if they also look cancelled.
- Sales truth review now also includes a dedicated Memo Resolution Review section as a read-only review tool.
- Sales truth review now also includes a small read-only Current Review Snapshot near the top of the page.
- That snapshot shows already-derived review outputs in plain owner-friendly language without changing policy or totals.
- Sales truth review now also includes a compact Key Row Family Snapshot near the top of the page.
- That snapshot uses already-derived review outputs to make regular, memo, complimentary, sales return, cancelled, Part Payment, and fallback-total attention rows faster to inspect without changing policy, totals, or promotion state.
- Sales truth review now also includes a compact Part Payment Settlement Snapshot near the relevant review section.
- That snapshot uses the current derived Part Payment counts plus exported `payment_description` evidence rules to explain which rows are clearly extractable, unavailable from the current export, or still ambiguous.
- Sales truth review now also includes a small read-only Promotion Readiness Snapshot near the top of the page.
- That readiness snapshot uses already-derived review state to explain whether the page is still review-only or closer to future promotion readiness, without promoting anything into live truth.
- `/sales-truth-review` remains the current read-only truth-checking control room for sales truth review.
- Dashboard, Profit Overview, and Sales Analytics now also show a small owner-facing sales truth status reminder that points back to `/sales-truth-review`.
- That reminder is read-only guidance only and does not mean live truth promotion has happened.
- That live-facing sales truth status reminder is now shared through one reusable component for safer consistency and easier future updates.
- A live-facing page consistency audit has now confirmed that Dashboard and Profit Overview stay on their intended live-facing order-level sources, while Sales Analytics stays on its intended item-level source.
- That audit also confirmed that the shared sales truth status notice remains read-only guidance only and that the live-facing pages do not accidentally depend on `lib/sales-truth-review/*`.
- Titan now also has a documentation-based AI continuity layer:
  - `LIVE_PROJECT.md`
  - `AGENT_OPERATING_RULES.md`
  - `SESSION_HANDOFF.md`
- `SESSION_HANDOFF.md` is now the highest-priority baton-pass file for the latest project state.
- `SESSION_HANDOFF.md` now uses a latest verified baton-anchor model so continuity docs can be refreshed cleanly without forcing a self-staling latest-commit line.
- This continuity layer is for safe AI takeover, handoff, and recovery only. It does not change project logic, policy, totals, or product behavior.
- Memo Resolution Review keeps memo rows unresolved and excluded from live sales truth.
- Memo-to-later-order suggestions in Memo Resolution Review are heuristic investigative hints only.
- These memo candidate hints are non-binding and are not approved memo-to-sale links.
- No approved memo-to-sale linking rule exists yet.
- Weak evidence is now shown more conservatively so amount plus later bill date alone does not overstate confidence.
- Sales truth review logic now also has a reusable read-only policy layer under `lib/sales-truth-review`.
- This extraction was done for maintainability, safety, and testability, not for live policy promotion.
- `/sales-truth-review` now uses that reusable read-only policy layer as its review engine while staying a read-only page in effect.
- Titan now also has a first small reusable live order-level sales query helper under `lib/sales-query/order-sales-summary.ts`.
- The dashboard's `Imported Order Sales` output now uses that helper while staying on `sales_order_imports` only.
- This new helper stays separate from item-level analytics and from the read-only sales truth review layer.
- Titan now also has a reusable dashboard order-level KPI helper under `lib/sales-query/dashboard-order-kpis.ts`.
- The dashboard's `Today Sales`, `Orders`, and `Average Order Value` outputs now use that helper while staying on `sales_order_imports` only.
- This KPI helper also stays separate from item-level analytics and from the read-only sales truth review layer.
- Titan now also has a first reusable expense-side summary helper under `lib/expense-query/expense-summary.ts`.
- The dashboard's `Imported Expense Amount` output now uses that helper while staying on `expense_imports` only.
- Expense Analytics now uses that helper for `Imported Expense Rows`, `Total Expense Amount`, `Unique Categories`, and `Latest Expense Date`.
- This expense helper stays separate from the sales-query helpers and from the read-only sales truth review layer.
- Titan now also has a first reusable item-level sales summary helper under `lib/sales-query/item-sales-summary.ts`.
- Sales Analytics now uses that helper for `Imported Rows`, `Item Revenue Total`, `Total Quantity`, and `Unique Bills`.
- This item-level helper stays on `sales_item_imports` only and stays separate from order-level helpers and from the read-only sales truth review layer.
- Titan now also has a reusable item-level sales detail helper under `lib/sales-query/item-sales-details.ts`.
- Sales Analytics now uses that helper for `Top Selling Items` and `Latest Imported Rows` while staying on `sales_item_imports` only.
- Titan now also has a reusable expense detail helper under `lib/expense-query/expense-details.ts`.
- Expense Analytics now uses that helper for `Top Expense Categories` and `Latest Imported Expense Rows` while staying on `expense_imports` only.
- Titan now also has a reusable profit summary helper under `lib/profit-query/profit-overview-summary.ts`.
- Profit Overview now uses that helper for total sales, total expenses, estimated gross profit, profit margin, and imported row counts.
- This profit helper stays on the page's existing live-facing sources only: `sales_order_imports` and `expense_imports`.
- Titan now also has reusable upload-history helpers under `lib/upload-query/`.
- The dashboard now uses that helper layer for recent upload activity, sales upload count, and expense upload count.
- The uploads page now uses that helper layer for uploads-log listing and filter-ready history results.
- These upload helpers stay on `uploads_log` only and stay separate from the sales, expense, profit, and read-only truth-review layers.
- A completed Upload History precision review has now confirmed that these `uploads_log` surfaces are directionally safe overall without falsely claiming exact expense inserted-row precision.
- That same review also confirmed that sales uploads persist richer ingestion detail in `uploads_log`, while expense uploads still use older lighter log semantics there.
- The `/uploads` page now also uses calmer owner-facing wording so lighter expense rows read more clearly as stored upload history unless exact ingest counts were actually logged.
- Titan now also has reusable imports-page helpers under `lib/import-query/`.
- The `/sales-imports` page now uses that helper layer for its current sales-import list / loading / error flow while staying on `sales_imports` only.
- The `/expense-imports` page now uses that helper layer for its current expense-import list / loading / error flow while staying on `expense_imports` only.
- These imports-page helpers stay separate from upload, analytics, profit, and read-only truth-review logic.
- Titan now also has reusable reconciliation-query helpers under `lib/reconciliation-query/`.
- The `/sales-reconciliation` page now uses that helper layer for its current read-only summary diagnostics and diagnostic row sections while staying on `sales_order_imports` only.
- These reconciliation helpers stay separate from `/sales-truth-review`, memo policy, and live promotion logic.
- The `/sales-reconciliation` page now also includes one compact Inspection Snapshot and clearer section scan cues so fallback-total rows and large-total-difference rows are easier to inspect without changing helper outputs, row membership, or totals.
- Titan now also has a pure render-support diagnostics panel under `app/upload/sales/order-listing-diagnostics-panel.tsx`.
- The `/upload/sales` page now uses that component as the bounded presentational container for the full `Order Listing Classification Diagnostics` UI subsystem.
- That diagnostics container now composes the already-extracted changed-overlap review panel.
- The Order Listing diagnostics panel now also gives a calmer owner-facing explanation of what the current classification means and whether Titan will insert rows or hold the file for review.
- All parsing, routing, overlap, insertion, and uploads-log behavior remain in `app/upload/sales/page.tsx`.
- Titan now also has a pure render-support changed-overlap review panel under `app/upload/sales/changed-overlap-review-panel.tsx`.
- The `/upload/sales` page now uses that component only for the `Changed Overlap Review` display block.
- Invariant tests now protect the extracted review policy behavior from silent drift.
- No live policy promotion was done from the memo review tool.
- This memo-review tightening did not change dashboard, profit overview, sales analytics, upload logic, ingestion logic, or the proposed net sale candidate total.
- This policy-layer extraction also did not change dashboard, profit overview, sales analytics, upload logic, ingestion logic, normalization logic, memo policy, or the proposed net sale candidate total.
- The Current Review Snapshot step also did not change memo handling, reconciliation behavior, dashboard, profit overview, analytics, upload logic, ingestion logic, normalization logic, or live truth policy.
- The Promotion Readiness Snapshot step also did not change memo handling, reconciliation behavior, dashboard, profit overview, analytics, upload logic, ingestion logic, normalization logic, or live truth policy.
- This current step is a verification of policy totals and bucket assignment, not a final truth decision.
- Profit overview uses `sales_order_imports` for order-level sales and `expense_imports` for expenses.
- Business insight on the dashboard is rule-based, not AI-generated.
- The project strategy is still SQL + rule-based intelligence first.
- The next sales direction is to build a safe sales query engine on top of `sales_order_imports` and `sales_item_imports`.
- A small Upload History consistency audit has now confirmed that sampled imported sales uploads match their logged inserted-row counts against `sales_order_imports` and `sales_item_imports`.
- That same audit also confirmed that expense uploads still use older lighter log semantics in `uploads_log`, so Upload History remains directionally safe but less precise for expenses than for sales.
- A small Expense Analytics consistency audit has now confirmed that `/expense-analytics` reads directly from `expense_imports` and does not accidentally depend on the read-only sales truth review layer.
- A broader read-only source-boundary audit has now confirmed that the audited pages stay on their intended helper layers and source tables overall, with no source-boundary mismatch requiring product changes.
- A read-only Upload History precision review has now confirmed that the current UI does not falsely claim exact expense inserted-row precision, so the real issue is logging-detail asymmetry rather than a product mismatch.
- A bounded repo-local validation step has now confirmed that duplicate, append-only, gap-fill, and changed-overlap classifications still behave as intended for the current sales upload flow.
- The next safety step is to review whether the current proposed policy posture is now clear enough for a later explicit promotion decision, while still remaining read-only.

## Clean Snapshot

Right now, the project already has:
- a working frontend
- a connected Supabase backend
- live smart sales ingestion for 2 known formats
- dashboard metrics
- uploads and import tracking
- analytics pages
- a profit summary page
- rule-based business insight
- a documented plan for smart sales ingestion routing
- a documented plan for the sales query engine
- a documented consistency-check process
- project recovery and continuation can now be managed through documentation
