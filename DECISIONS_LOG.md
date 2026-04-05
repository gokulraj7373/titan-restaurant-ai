# Decisions Log

## Decision 1

Decision:
Use Next.js App Router for the frontend.

Why it was taken:
It keeps routing simple and works well for a small MVP with multiple dashboard pages.

Current status:
Active

## Decision 2

Decision:
Use Supabase for database and storage.

Why it was taken:
It provides a simple backend with tables, queries, and file storage in one place.

Current status:
Active

## Decision 3

Decision:
Store uploaded files in the `uploads` Supabase Storage bucket.

Why it was taken:
The app needs a simple place to keep uploaded sales and expense files and later generate signed file links.

Current status:
Active

## Decision 4

Decision:
Track uploads separately in the `uploads_log` table.

Why it was taken:
This makes upload history easy to display on the dashboard and the uploads page.

Current status:
Active

## Decision 5

Decision:
Use `sales_imports` and `expense_imports` as the main imported business-data tables.

Why it was taken:
This separates raw uploads from structured business data and makes analytics pages easier to build.

Current status:
Active

## Decision 6

Decision:
Start with SQL + rule-based business insight instead of AI API calls.

Why it was taken:
This keeps the MVP cheaper, easier to understand, and faster to ship.

Current status:
Active

## Decision 7

Decision:
Build separate pages for uploads, imports, analytics, and profit overview.

Why it was taken:
This keeps the product easy to navigate for a non-technical user and easier to maintain later.

Current status:
Active

## Decision 8

Decision:
Use demo sales import rows after upload during the MVP stage.

Why it was taken:
This helps the project show working analytics before real file parsing is fully implemented.

Current status:
Active for MVP

## Decision 9

Decision:
Use demo expense import rows after upload during the MVP stage.

Why it was taken:
This keeps the sales and expense flows consistent and makes expense analytics testable before real parsing is added.

Current status:
Active for MVP

## Decision 10

Decision:
Use simple owner-friendly summaries and wording across dashboard and analytics pages.

Why it was taken:
The product is meant for a non-coder owner, so the UI should stay practical and easy to understand.

Current status:
Active

## Decision 11

Decision:
Prefer bounded, file-limited Codex changes instead of broad repo-wide edits.

Why it was taken:
This reduces the chance of breaking working features and makes the project easier to recover after each change.

Current status:
Active

## Decision 12

Decision:
Use one smart sales upload entry point with format detection and routing.

Why it was taken:
This avoids creating separate messy sales upload flows for every spreadsheet type and gives the project one safer path for future growth.

Current status:
Active

## Decision 13

Decision:
Support only 2 known sales spreadsheet formats first.

Why it was taken:
Supporting one small set of known formats first is safer than trying to support every random spreadsheet or PDF immediately.

Current status:
Active

## Decision 14

Decision:
Route known sales formats into format-specific target tables.

Why it was taken:
Order-level and item-level sales files do not have the same structure, so routing them into the right tables helps prevent bad imports and spaghetti data handling.

Current status:
Active

## Decision 15

Decision:
Separate order-level and item-level analytics sources.

Why it was taken:
Order-level questions and item-level questions should not use the same source casually. This helps prevent double counting and keeps analytics easier to trust.

Current status:
Active

## Decision 16

Decision:
Use `sales_order_imports` for order-level metrics and `sales_item_imports` for item-level metrics.

Why it was taken:
This gives the project a clear source-of-truth rule for the sales query engine and reduces confusion when building future dashboards and analytics.

Current status:
Active

## Decision 17

Decision:
For Petpooja Order Listing imports, keep only one main order row per order in `sales_order_imports` and skip payment split child rows.

Why it was taken:
Payment split child rows are payment-detail continuations, not separate business orders. Importing them as extra order rows inflates sales totals and makes dashboard and profit numbers untrustworthy.

Current status:
Active

## Decision 18

Decision:
Use `sales_order_imports.effective_total` as the current order-level sales truth for Order Listing imports.

Why it was taken:
Some valid Petpooja Part Payment main rows have `grand_total = 0`, while `payment_description` carries the real total. Using `effective_total` preserves the real order-level value without adding payment split child rows on top.

Current status:
Active

## Decision 19

Decision:
Keep `sales_item_imports` for item-level analytics only, not as the final business sales source of truth.

Why it was taken:
Item rows are useful for item performance and revenue mix analysis, but business total sales should come from the order-level source to avoid confusion and accidental double counting.

Current status:
Active

## Decision 20

Decision:
Add a dedicated `Sales Reconciliation` page as a read-only diagnostic page for `sales_order_imports`.

Why it was taken:
Order-level totals need a simple trust-check view so the owner can inspect fallback-total rows and total differences without confusing that diagnostic work with the main business dashboard.

Current status:
Active

## Decision 21

Decision:
Classify smart sales uploads before insert, instead of inserting every known-format file automatically.

Why it was taken:
Titan now needs overlap awareness, but it still needs to stay conservative. A pre-insert classification layer allows safe append-only and safe gap-fill imports while blocking changed overlaps until a deliberate review flow exists.

Current status:
Active

## Decision 22

Decision:
Do not auto-merge or auto-replace changed overlapping sales uploads yet.

Why it was taken:
Corrective re-uploads can be important, but silently merging or replacing overlapping rows would make recovery and trust much harder. This project should prefer clear blocking and manual review over risky automatic repair.

Current status:
Active

## Decision 23

Decision:
Do not block an Order Listing upload just because it contains unchanged already-imported rows together with new safe rows.

Why it was taken:
That mixed case is still safe when there are no changed overlapping orders. Titan should insert only the `new_order` rows and skip the unchanged overlap, instead of sending a safe file to manual review unnecessarily.

Current status:
Active

## Decision 24

Decision:
Expose compact Order Listing classification diagnostics on the sales upload page.

Why it was taken:
Safe overlap logic is easier to trust when the owner can see why Titan allowed or blocked a file. A readable diagnostic block is safer than relying on guesswork or raw JSON.

Current status:
Active

## Decision 25

Decision:
Treat Memo, `SR`, and `C` Order Listing rows as meaningful special transaction types, not as garbage and not as normal numeric order keys.

Why it was taken:
These rows are part of the exported sales transaction history, but they should not trigger fake duplicate-order blocking. Titan should preserve them for trust and later reporting, while keeping normal overlap comparison focused on proper numeric main-order keys.

Current status:
Active

## Decision 26

Decision:
Treat `overlap_with_changes` as a protective block and show changed-overlap review details before any future merge or update logic is added.

Why it was taken:
Changed overlapping orders are important, but Titan should not auto-merge or auto-update them yet. Showing the changed fields, change tags, and example orders makes the block easier to review without risking silent data changes.

Current status:
Active

## Decision 27

Decision:
Add a read-only `Sales Truth Review` page for checking how imported Order Listing rows may fit future business-sales rules.

Why it was taken:
The project now preserves multiple Order Listing transaction families, but final business totals should not be decided blindly. A separate review page lets the owner inspect transaction types and edge cases before changing dashboard or profit formulas.

Current status:
Active

## Decision 28

Decision:
Do not treat `payment_type = Part Payment` as automatic advance-order or advance-receipt logic in the read-only truth-review layer.

Why it was taken:
In this Petpooja export, Part Payment can also mean split settlement of a normal completed sale. Treating it as automatic advance logic is too risky and could push the project toward the wrong business rules. Titan should review these rows first as ambiguous settlement cases.

Current status:
Active

## Decision 29

Decision:
Treat numeric `Part Payment` Order Listing rows as valid sale candidates, while keeping payment-breakup truth separate until reliable settlement detail is available.

Why it was taken:
These rows still represent real order-level sales, but the current export does not always expose a trustworthy cash, card, due, or wallet split. Titan should not confuse sales truth with payment settlement truth or invent settlement detail that is not clearly present.

Current status:
Active

## Decision 30

Decision:
Use a read-only proposed sales-policy bucket layer before changing live business totals.

Why it was taken:
The project now has enough transaction review context to sketch a safe inclusion policy, but not enough certainty to push it straight into dashboard or profit formulas. A read-only policy layer helps review row counts and amounts before promoting those rules into live business reporting.

Current status:
Active

## Decision 31

Decision:
Verify proposed sales-policy totals with read-only breakdowns before promoting them into dashboard or profit logic.

Why it was taken:
The project needs a safe explanation of where the current proposed net sales amount comes from. Month, family, bucket, and upload-level verification reduces the risk of pushing the wrong policy into live business reporting.

Current status:
Active

## Decision 32

Decision:
Require both month-level and upload-level reconciliation checks for the read-only sales-policy layer.

Why it was taken:
If the policy buckets are going to guide later dashboard or profit logic, they first need to close mathematically at the month level and at the upload level. This helps catch bucket drift, memo-priority mistakes, or attribution gaps before anything becomes live business reporting.

Current status:
Active

## Decision 33

Decision:
Review memo rows separately with a read-only memo review before deciding whether they should affect live business truth.

Why it was taken:
Memo rows are the main remaining unresolved policy area. A dedicated memo review with conservative labels and heuristic later numeric candidates gives the owner a safer basis for deciding whether memo should stay separate, be excluded, or later connect under a future approved rule.

Current status:
Active

## Decision 34

Decision:
Keep Memo Resolution Review strictly read-only and present memo-to-later-order suggestions only as heuristic investigative hints.

Why it was taken:
Memo is still unresolved and excluded from live sales truth. Weak evidence such as amount plus later bill date is not strong enough to present as a believable memo-to-sale link, and the project should stay conservative until a real approved memo rule exists.

Current status:
Active

## Decision 35

Decision:
Do not promote memo review hints into dashboard, profit overview, sales analytics, upload logic, ingestion logic, or live business truth.

Why it was taken:
This task was only a wording and confidence tightening step for read-only review. Keeping memo outside live policy avoids accidental policy promotion and protects the current proposed net sale candidate total until memo is finalized properly.

Current status:
Active

## Decision 36

Decision:
Extract the `/sales-truth-review` logic into a reusable read-only sales truth review policy layer with invariant tests.

Why it was taken:
The sales truth review page had accumulated too much embedded review logic. Moving that logic into pure reusable modules makes the behavior easier to inspect, test, and extend safely without silently changing live business truth or the current proposed review totals.

Current status:
Active

## Decision 37

Decision:
Keep the extracted sales truth review policy layer read-only and separate from dashboard, profit overview, analytics, upload, ingestion, and normalization flows.

Why it was taken:
This extraction was only a maintainability and safety step. Titan still has no approved live promotion for this policy layer, memo policy did not change, and the current proposed net sale candidate total must stay unchanged until a later explicit business decision is approved.

Current status:
Active

## Decision 38

Decision:
Add a small read-only `Current Review Snapshot` near the top of `/sales-truth-review` using already-derived review outputs.

Why it was taken:
The owner needs a simpler summary of the current review position without reading every section on the page. Showing those values in plain language improves handoff and recovery safety without changing policy, totals, memo handling, or any live business page.

Current status:
Active

## Decision 39

Decision:
Add a small read-only `Promotion Readiness Snapshot` near the top of `/sales-truth-review` using already-derived review state only.

Why it was taken:
The owner needs a plain-language signal for whether the current review state is still clearly not ready for live promotion, without turning that signal into an action or policy change. A read-only readiness snapshot improves product clarity while keeping memo unresolved, excluded, and non-promoted.

Current status:
Active

## Decision 40

Decision:
Add a small read-only sales truth status reminder to the live-facing sales pages while `/sales-truth-review` remains the current truth-checking control room.

Why it was taken:
The owner needs a clear reminder that dashboard, profit overview, and sales analytics are still live-facing pages while sales truth remains under review. A short notice reduces confusion without changing any totals, logic, or promotion state.

Current status:
Active

## Decision 41

Decision:
Extract the live-facing sales truth status reminder into one shared reusable component.

Why it was taken:
The reminder now appears on multiple live-facing pages, so a shared component keeps the wording and layout consistent while making future wording updates safer. This is a maintainability improvement only and does not change any logic, totals, or promotion state.

Current status:
Active

## Decision 42

Decision:
Add a dedicated documentation-based continuity layer for Titan using `LIVE_PROJECT.md`, `AGENT_OPERATING_RULES.md`, and `SESSION_HANDOFF.md`.

Why it was taken:
Titan now has enough active review logic, owner-facing guidance, and safety process that a new AI should be able to recover quickly from repo docs alone. A dedicated continuity layer reduces onboarding friction and helps preserve the same disciplined operating style across sudden AI switches.

Current status:
Active

## Decision 43

Decision:
Make `SESSION_HANDOFF.md` the highest-priority latest-state baton-pass file for future Titan AI takeovers.

Why it was taken:
The continuity layer needs one unambiguous baton-pass source so a new AI does not drift when restating the latest safe commit, active focus, or next safest step. This improves takeover reliability without changing any project logic or product behavior.

Current status:
Active

## Decision 44

Decision:
Keep the live-facing sales pages separate from the read-only sales truth review layer, and treat the sales truth status notice on those pages as guidance only.

Why it was taken:
The completed live-facing consistency audit confirmed that `/dashboard`, `/profit-overview`, and `/sales-analytics` should continue using their intended live-facing sources without pulling in `lib/sales-truth-review/*`. This separation reduces accidental policy promotion and keeps the review layer clearly read-only.

Current status:
Active

## Decision 45

Decision:
Use a latest verified baton-anchor commit model in `SESSION_HANDOFF.md` instead of trying to self-reference the same docs-only commit that refreshes the handoff file.

Why it was taken:
The continuity layer needs a truthful baton-pass model that can be committed cleanly. Using an explicit verified anchor commit avoids a self-staling handoff file while still giving future AIs a reliable latest-state commit anchor.

Current status:
Active

## Decision 46

Decision:
Treat Upload History row counts as directionally trustworthy for sales uploads, while keeping expense upload history wording conservative until expense logging carries the same inserted-row detail.

Why it was taken:
The completed Upload History consistency audit confirmed that sampled imported sales uploads match their logged inserted-row counts against `sales_order_imports` and `sales_item_imports`. The same audit also showed that expense uploads still use older lighter log semantics, so the page should remain owner-safe without implying stronger precision than the current expense logging supports.

Current status:
Active

## Decision 47

Decision:
Keep `/expense-analytics` directly tied to `expense_imports` and separate from the read-only sales truth review layer.

Why it was taken:
The completed Expense Analytics consistency audit confirmed that `app/expense-analytics/page.tsx` reads from `expense_imports` only and does not import or depend on `lib/sales-truth-review/*`. This keeps expense-side analytics cleanly separated from sales truth review and avoids accidental policy blur.

Current status:
Active
