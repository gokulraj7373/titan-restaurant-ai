# ARCHIVAL / HISTORICAL HANDOFF ONLY: Titan Restaurant AI Project Handoff
Date: 2026-04-03

This file is historical context only.

Do not use this file as the current baton-pass source.

For the latest active state, use `SESSION_HANDOFF.md` first.

## Project goal
Build a highly reliable restaurant/cafe intelligence system for Titan where sales truth is derived carefully from Petpooja exports, without double counting, silent overwrites, or incorrect policy assumptions.

## Current major focus
Finalize trustworthy order-level sales truth from Petpooja Order Listing exports before promoting anything into live dashboard/profit overview logic.

## Current status summary
- Order Listing duplicate child payment rows were identified and prevented from being inserted as real business order rows.
- Item Wise imports remain item-level analytics only, not final business sales truth.
- Current trusted order-level source for imported order sales is `sales_order_imports.effective_total`, with caution.
- `grand_total` alone cannot always be trusted for Petpooja rows.
- Numeric Part Payment rows are currently treated as valid sale candidates, but split-payment method breakup is NOT available from the current export text.
- Memo rows are still unresolved and are NOT approved yet for live sales truth.
- Complimentary rows are excluded from live sales truth policy.
- Sales return rows are excluded from live sales truth policy.
- Cancelled rows are excluded from live sales truth policy.
- Current sales-truth-review is read-only and is the main decision page.
- Current dashboard/profit overview/sales analytics are NOT yet promoted to this final reviewed policy.

## Important confirmed findings
- Current export does NOT provide usable split-payment breakup details for Part Payment rows.
- Part Payment rows should NOT be assumed to mean advance-order revenue.
- Memo rows can appear cancelled and must remain unresolved until explicitly decided.
- Policy reconciliation is mathematically clean month-wise and upload-wise.
- Current proposed `net_sale_candidate` amount is Rs 22,18,995.00 and reconciles internally.
- This number is NOT yet approved as final live dashboard truth until memo policy is finalized.

## Current read-only policy
- include numeric valid sale rows
- include numeric Part Payment rows as valid sales
- exclude cancelled rows
- exclude complimentary rows
- exclude sales return rows
- keep memo unresolved
- do not assume split-payment method breakup unless clearly visible in export text

## Main pages currently relevant
- `/upload/sales`
- `/sales-reconciliation`
- `/sales-truth-review`
- `/dashboard`
- `/profit-overview`
- `/sales-analytics`
- `/uploads`

## Main unresolved decision
How Memo rows should behave:
- exclude always?
- exclude unless linked to later numeric final bill?
- treat as advance/custom order workflow?
- treat cancelled memo as dead-end non-sale?

## Safety rules
- no destructive cleanup without explicit approval
- no auto-merge for changed overlaps
- no silent overwrite of old order rows
- no promotion of reviewed policy into live dashboard/profit overview until memo rule is finalized
- keep all truth-review work read-only unless explicitly approved

## Known technical caution
Older unrelated TypeScript/Supabase paging typing issues still exist in some pages:
- dashboard
- profit-overview
- sales-analytics
- sales-reconciliation

These should be fixed carefully after the sales-truth policy is finalized, unless blocking current work.

## Latest active task at the time
A Codex prompt was running to build a read-only “Memo Resolution Review” on `/sales-truth-review`, including likely memo classification and possible later numeric-order matching.

## What the next assistant had to do at the time
1. Read this file first.
2. Do not assume memo policy is finalized.
3. Treat current reconciliation as correct but provisional.
4. Continue only with safe read-only memo review unless user explicitly changed priority.
