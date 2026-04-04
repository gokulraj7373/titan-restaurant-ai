# QA Checklist

This is a simple manual checklist for checking the app after a change.

Use it like an operating checklist.

## App Startup

- Run `npm run dev`
- Open `http://localhost:3000`
- Confirm the app loads without a blank screen
- Confirm the top navigation is visible

## Dashboard Checks

- Open `/dashboard`
- Confirm the page loads
- Confirm the 3 KPI cards show values
- Confirm the `Business Insight` section shows readable lines
- Confirm `Supabase Connection Status` shows a message
- Confirm `Upload Summary` appears
- Confirm `Imported Sales Summary` appears
- Confirm `Imported Expense Summary` appears
- Confirm `Recent Activity` appears

## Upload Sales Check

- Open `/upload/sales`
- Select a file
- Click upload
- Confirm the success message appears
- Confirm the message says sample sales rows were added

## Upload Expenses Check

- Open `/upload/expenses`
- Select a file
- Click upload
- Confirm the success message appears
- Confirm the message says sample expense rows were added

## Uploads Page Check

- Open `/uploads`
- Confirm uploaded rows appear
- Confirm filters work for `All`, `Sales`, and `Expenses`
- If needed, click `Get File URL`
- Confirm `Link ready` appears
- Confirm `Open File` opens a file

## Sales Imports Check

- Open `/sales-imports`
- Confirm imported sales rows appear
- Confirm bill date, bill number, item name, qty, amount, and upload log ID are visible

## Expense Imports Check

- Open `/expense-imports`
- Confirm imported expense rows appear
- Confirm expense date, category, description, amount, and upload log ID are visible

## Sales Analytics Check

- Open `/sales-analytics`
- Confirm the summary cards appear
- Confirm `Top Selling Items` appears
- Confirm `Latest Imported Rows` appears
- Confirm the page looks consistent with the rest of the app

## Expense Analytics Check

- Open `/expense-analytics`
- Confirm the summary cards appear
- Confirm `Top Expense Categories` appears
- Confirm `Latest Imported Expense Rows` appears
- Confirm the page looks consistent with the rest of the app

## Profit Overview Check

- Open `/profit-overview`
- Confirm all 4 summary cards appear
- Confirm `Data Snapshot` appears
- Confirm the page loads without visible errors

## Consistency Verification Check

- Open `/uploads` first
- Confirm the latest upload shows a sensible status and row counts
- Check that the upload target table matches the file type
- Compare Upload History row counts with the expected target table inserts
- Open `/dashboard` and confirm sales summaries match the order-level source
- Open `/sales-analytics` and confirm item totals match the item-level source
- Open `/expense-analytics` and confirm expense totals match `expense_imports`
- Open `/profit-overview` and confirm:
  - sales side matches `sales_order_imports`
  - expense side matches `expense_imports`
- If numbers do not line up, stop and fix consistency before adding new features

## Docs And Agent Safety Check

- Confirm the project docs still match the app
- Confirm `AGENTS.md` still reflects the safe working rules
- Before the next change, decide exactly which files should be allowed to change
- Prefer one small feature per change
