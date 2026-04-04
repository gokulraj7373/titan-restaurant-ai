# Sales Ingestion Master

## 1. Purpose

The sales upload flow should become one smart entry point.

That means:
- the user uploads one sales file
- the system checks the file structure
- the system detects which known sales format it matches
- the system sends the rows into the correct sales table

Right now, the project still uses demo sales rows after upload.

The next goal is to move from demo sales imports to one real spreadsheet import flow that is safer and easier to grow over time.

## 2. Current Known Sales Formats

The first smart ingestor should support only these known formats:

- Petpooja Order Listing Excel
- Petpooja Item Wise Report With Bill No. With Time Excel

## 3. Current Target Tables

The planned real sales target tables are:

- `sales_order_imports`
- `sales_item_imports`

Why two tables:
- one file type fits order-level data better
- one file type fits item-level data better
- this keeps the imported data cleaner and easier to work with later

## 4. Detection Logic v1

Detection logic version 1 should stay simple:

- support spreadsheet files first
- inspect the header structure
- detect whether the file matches one of the known formats
- if the format is unknown, reject it safely with a clear message
- never insert unknown data into the wrong table

This is safer than trying to guess too much too early.

## 5. Safe Ingestion Phases

### Phase 1: Detect Known Format And Route Correctly

- accept supported spreadsheet files
- inspect the structure
- detect whether it is one of the two known sales formats
- route:
  - Order Listing -> `sales_order_imports`
  - Item Wise Report -> `sales_item_imports`

### Phase 2: Reject Unsupported Or Random Files Safely

- if the file does not match a known format, reject it clearly
- show a simple error instead of importing bad data

### Phase 3: Add Safe Overlap Classification Before Insert

- classify the upload before insert
- allow only clearly safe insert cases
- block changed overlaps for manual review

Current classification outcomes:
- `exact_duplicate`
- `append_only`
- `gap_fill`
- `overlap_unchanged`
- `overlap_with_changes`
- `manual_review_needed`
- `rejected_unknown_format`

Titan now also exposes owner-visible Order Listing classification diagnostics on the upload page, so overlap decisions can be checked safely before any future merge engine is built.
For `overlap_with_changes`, Titan now also shows a compact changed-overlap review with changed orders, changed fields, and simple change tags before any future merge or update rule is considered.

For Petpooja Order Listing, Titan now treats these as special transaction families:
- regular main orders
- advance-order style main orders
- payment split child rows
- Memo
- sales return rows starting with `SR`
- complimentary rows starting with `C`

Important rule:
- Memo, `SR`, and `C` rows are preserved as meaningful transaction rows
- they are not treated as garbage
- they are also not treated as normal numeric business keys for overlap comparison
- a separate Sales Truth Review page now helps inspect these stored transaction families before final business-sales rules are finalized
- numeric `Part Payment` rows are still treated as valid sale candidates
- but the current export does not yet reliably expose full payment breakup for every such row
- payment-method analytics should later use only reliable extracted settlement detail or a dedicated settlement source
- Titan now separates sales truth from payment settlement truth in the read-only review layer
- Titan also now has a proposed read-only sales-policy layer:
  - numeric rows, including numeric Part Payment rows, are net sale candidates
  - cancelled rows are excluded
  - complimentary rows are excluded
  - sales return rows are excluded
  - memo rows remain unresolved
- this policy review is not yet the live dashboard truth
- current bucket priority in read-only policy review is:
  - unresolved_memo
  - excluded_complimentary
  - excluded_sales_return
  - excluded_cancelled
  - net_sale_candidate
  - unresolved_other
- Titan now also exposes verification breakdowns so the current proposed policy totals can be checked by month, source family, bucket, and upload before any live metric changes are made
- Titan now also shows monthly policy reconciliation and upload-attribution vs policy-attribution checks so the current policy can be verified mathematically before promotion
- Titan now also shows a dedicated Memo Resolution Review as a read-only review tool before any memo rule is approved
- memo rows remain unresolved in that review tool
- memo rows remain excluded from live sales truth
- memo-to-later-order suggestions in that section are heuristic investigative hints only
- those hints are non-binding and are not approved memo-to-sale links
- weak evidence must stay conservative and amount plus later bill date alone should usually remain low confidence
- no live policy promotion was done from this memo review step
- this memo review step did not change dashboard, profit overview, sales analytics, upload logic, or ingestion logic
- Titan now also has a reusable read-only sales truth review policy layer under `lib/sales-truth-review`
- this policy layer was extracted for maintainability, safety, and invariant testing only
- this policy layer is not a live promotion into dashboard, profit overview, analytics, upload logic, ingestion logic, or normalization logic
- memo policy did not change during this extraction
- the current proposed net sale candidate total did not change during this extraction

### Phase 4: Add Stitch, Merge, Or Update Behavior

- handle overlap more carefully
- support controlled update behavior later

### Phase 5: Add Broader Format Support

- support more known spreadsheet layouts
- only after the first two formats are stable

## 6. Duplicate Strategy

Duplicate detection should be practical and safe.

Future duplicate signals may include:
- file hash
- file name
- file size
- detected format
- overlapping date range
- row-level business key comparison

Important rule:
- duplicate handling must be safe, not destructive

That means:
- do not silently delete old data
- do not silently overwrite old data
- flag possible duplicates clearly
- make duplicate decisions deliberately

## 7. Merge, Stitch, And Update Strategy

Later, the ingestion system may need to handle different kinds of re-upload behavior:

- full duplicate
  The same file or same data is uploaded again.

- overlapping range
  A new file overlaps with dates that were already imported.

- missing-range supplement
  A file fills in rows that were missing before.

- corrected re-upload
  A better or corrected version of an earlier file is uploaded.

These cases should be handled carefully and logged clearly.

They should never be guessed silently.

Current conservative rule:
- `append_only` can insert
- clearly safe `gap_fill` can insert only missing rows
- mixed files with unchanged existing rows plus new safe rows can still insert only the new rows
- `exact_duplicate` does not insert
- `overlap_unchanged` does not insert
- `overlap_with_changes` does not auto-merge
- `overlap_with_changes` is a protective block, not a data-loss error
- changed-overlap review is now visible on the upload page for safer manual review
- `manual_review_needed` does not insert

Comparison safety rule:
- only proper numeric main-order keys participate in normal duplicate and overlap comparison
- Memo, `SR`, and `C` rows do not trigger fake duplicate-order blocking
- payment split child rows do not behave like standalone business orders

## 8. Safety Rules

The smart ingestor should always follow these rules:

- never force unknown files into a known table
- never silently overwrite old imported data
- always preserve `uploads_log` traceability
- keep parsers small and format-specific first
- prefer safe rejection over risky guessing
- do not auto-merge changed overlapping rows yet
- do not auto-replace existing rows yet
- do not auto-update historical rows during changed-overlap review

## 9. Immediate Next Implementation Step

The current bridge step is now live:

- known sales formats are detected and routed
- uploads are classified before insert
- safe append-only and safe gap-fill uploads can insert
- changed overlaps still require manual review

The next coding step should be:

- build the future controlled merge engine
- decide how corrected overlapping uploads should be reviewed and approved
- keep the first merge behavior explicit and logged

This keeps the ingestion system small, safe, and recoverable while Titan learns more about overlap patterns.
