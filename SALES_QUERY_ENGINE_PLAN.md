# Sales Query Engine Plan

## 1. Purpose

The project now has real imported sales data in:

- `sales_order_imports`
- `sales_item_imports`

The next goal is to build correct analytics from these raw tables.

This is important because the app should show business numbers that are:
- accurate
- easy to explain
- safe from double counting
- easy to grow later

## 2. Source-Of-Truth Rules

These rules should guide all future sales analytics:

- order-level metrics should come from `sales_order_imports`
- item-level metrics should come from `sales_item_imports`
- do not sum both tables for the same total sales metric
- avoid double counting

Simple rule:
- if the metric is about orders, use the order table
- if the metric is about items, use the item table
- `sales_item_imports` should not be treated as the final business sales truth

## 3. Relationship Between The Two Tables

The logical linking keys are:

- `order_no`
- `invoice_no`

These fields may be joinable in some cases.

But joins must be used carefully because:
- formats may not always line up perfectly
- one order may have multiple item rows
- not every question needs both tables

Important rule:
- not every metric requires a join

In many cases, the safest query is a direct query from one source table only.

## 4. Metrics Plan

### A. Order-Level Metrics

These should come from `sales_order_imports`.

Examples:
- total sales
- total orders
- average order value
- sales by day
- payment type split
- order type split

### B. Item-Level Metrics

These should come from `sales_item_imports`.

Examples:
- top selling items by revenue
- top selling items by quantity
- category performance
- item count trends

### C. Combined Metrics (Later)

These should come later and be handled carefully.

Examples:
- order type vs item mix
- order-level context with item-level detail
- more advanced cross-analysis

## 5. Safe Calculation Rules

Use these rules when building analytics:

- use `effective_total` from `sales_order_imports` for order-level sales
- use `final_total` from `sales_item_imports` for item-level item revenue
- do not mix totals casually
- prefer simple direct queries first
- only join when the question truly requires both order and item context

Important note for Petpooja Order Listing:

- `grand_total` alone cannot be trusted for every valid main order row
- some valid Part Payment main rows have `grand_total = 0`
- in those cases, `payment_description` carries the real total
- because of that, the current order-level source of truth is `sales_order_imports.effective_total`

If a metric can be answered from one table safely, do not join both tables.

## 6. Dashboard Upgrade Plan

The current dashboard still contains older or demo-style logic in parts of the sales summary flow.

The next dashboard version should:
- use real imported sales tables
- map each KPI to the correct source table
- stop relying on older mixed sales logic where possible

Safe direction:
- order KPIs from `sales_order_imports`
- item summaries from `sales_item_imports`

## 7. API And Query Rollout Plan

### Phase 1: Order-Level Dashboard Metrics

Build real order-level dashboard metrics from `sales_order_imports`.

### Phase 2: Item-Level Analytics

Build item-level analytics from `sales_item_imports`.

### Phase 3: Combined Insights Carefully

Only after phases 1 and 2 are stable, add careful combined insights.

### Phase 4: Duplicate Handling And Stitched Datasets

Later, improve the query layer to work with duplicate handling and stitched dataset logic.

## 8. Risks To Avoid

Avoid these mistakes:

- double counting sales
- joining order and item tables carelessly
- using inconsistent sales sources
- showing misleading metrics to the owner
- building too many combined metrics too early

## 9. Immediate Next Implementation Step

After this document, the next coding step should be:

- create one real order-level analytics page or dashboard data source from `sales_order_imports`
- do not attempt all combined analytics at once

This keeps the next step small, safe, and easier to verify.
