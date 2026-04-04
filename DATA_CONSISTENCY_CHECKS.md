# Data Consistency Checks

## 1. Purpose

The project now has real ingestion and real analytics sources.

That is good progress, but the next safety step is to verify consistency across pages.

This matters because the owner should be able to trust that:
- each page is using the correct source table
- the same business number is not being counted twice
- page totals match the imported data

## 2. Source-Of-Truth Map

Use this map as the main reference:

- Dashboard sales KPIs -> `sales_order_imports`
- Sales Analytics -> `sales_item_imports`
- Expense Analytics -> `expense_imports`
- Profit Overview sales side -> `sales_order_imports`
- Profit Overview expense side -> `expense_imports`
- Upload History -> `uploads_log`

## 3. What Must Match

These are the practical checks that should stay aligned:

- Upload History inserted row count should roughly match target table inserts for that upload
- Dashboard imported sales summary should match `sales_order_imports` totals
- Sales Analytics imported rows should match `sales_item_imports` totals
- Profit Overview sales row count should match `sales_order_imports` row count
- Profit Overview sales amount should match the sum of `effective_total` in `sales_order_imports`
- Expense pages should match `expense_imports`

Simple example:
- if Upload History says a sales file inserted 120 rows into `sales_item_imports`
- then the item-level sales page should reflect that data after the import is complete

## 4. Known Mismatch Risks

Watch for these risks:

- stale old demo logic still remaining on a page
- wrong source table used on one page
- order-level and item-level metrics being confused
- row count mismatch from older test or demo data
- totals being compared between pages that use different source logic

## 5. Recommended Verification Workflow

Use this order:

1. check Upload History first
2. check the target table row counts
3. check the analytics pages
4. fix inconsistencies before adding more features

This is the safest flow because:
- Upload History shows what the ingestor says it did
- the tables show what was actually inserted
- the pages show whether the UI is reading the correct source

