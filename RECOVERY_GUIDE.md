# Recovery Guide

## If You Are Confused, Do This First

1. Open `CURRENT_STATE.md`
2. Open `NEXT_STEPS.md`
3. Open `QA_CHECKLIST.md`
4. Start the app with `npm run dev`
5. Check the main pages one by one
6. Only then make the next change

## How To Start The App

1. Open the project folder
2. Install dependencies if needed:

```bash
npm install
```

3. Start the app:

```bash
npm run dev
```

4. Open:

```text
http://localhost:3000
```

## Which Pages To Check

Check these pages in order:

1. `/dashboard`
2. `/upload/sales`
3. `/upload/expenses`
4. `/uploads`
5. `/sales-imports`
6. `/expense-imports`
7. `/sales-analytics`
8. `/expense-analytics`
9. `/profit-overview`

## Which Database Tables Matter

These are the important Supabase tables:

- `app_status`
- `uploads_log`
- `sales_imports`
- `expense_imports`

## Which Docs To Read First

Read these in this order:

1. `README.md`
2. `CURRENT_STATE.md`
3. `NEXT_STEPS.md`
4. `QA_CHECKLIST.md`
5. `DECISIONS_LOG.md`
6. `PROJECT_MASTER.md`

## What To Do Before Asking Codex To Change Code

Before asking for a code change:
- decide the exact goal
- list the exact files that should be allowed to change
- check the current feature manually in the browser
- read the related project docs first
- ask for one small feature at a time

This helps keep the project stable and easier to recover.

## How To Continue Safely With Codex

- Tell Codex exactly which files are allowed to change.
- Ask for one clear goal at a time.
- Ask Codex to explain the change in plain English after editing.
- Prefer small safe steps instead of big refactors.
- Keep updating these docs when the project changes.

## How To Verify A Feature Safely

Use this simple pattern:

1. Open the page related to the feature.
2. Trigger the feature once.
3. Check the visible result in the browser.
4. Check the related page that depends on that data.
5. If needed, confirm the related Supabase table changed as expected.
6. Only after that, move to the next feature.

## Safe Recovery Checklist

- Make sure the app runs locally
- Make sure Supabase connection still works
- Check upload pages
- Check imports pages
- Check analytics pages
- Check the profit page
- Run through `QA_CHECKLIST.md`
- Review the latest docs before doing new work

## When You Return Later

If you come back after a break:
- read `CURRENT_STATE.md`
- review `NEXT_STEPS.md`
- test the main pages
- continue with the smallest next task first
