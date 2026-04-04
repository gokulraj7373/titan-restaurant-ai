# Sales Import Format Plan

## 1. Purpose

Right now, the project uses demo sales rows after a sales file is uploaded.

That helps the app show working dashboard and analytics pages, but it is only a temporary MVP step.

The next goal is to replace the demo sales import with one real spreadsheet import flow.

This means:
- upload one real sales spreadsheet
- read the spreadsheet columns
- map the spreadsheet data into `sales_imports`
- keep the rest of the app working on real imported sales rows

## 2. Safe Strategy

The safest way to do this is:
- support only one known sales file format first

Why this is safer:
- every business file can look different
- Excel files from different systems often use different headers and layouts
- some files contain totals rows, blank rows, or merged cells
- some files may not be structured well for automatic import

Trying to support every Excel or PDF format immediately would create more risk and confusion.

Supporting one known format first is better because:
- it is easier to test
- it is easier to debug
- it is easier to explain
- it reduces the chance of importing bad data
- it gives us a stable base before adding more formats later

## 3. Required Sample File Details

Before writing the real parser, we need to inspect one real sales spreadsheet carefully.

Use this checklist:

- file type: is it `.xlsx` or `.csv`?
- sheet names: what are the sheet names inside the file?
- header row names: what exact column names are used?
- bill date column: which column contains bill date?
- bill number column: which column contains bill number?
- item name column: which column contains item name?
- quantity column: which column contains quantity?
- amount column: which column contains amount?
- blank rows: are there empty rows in the file?
- totals rows: are there summary or totals rows that should not be imported?
- merged cells: does the file use merged cells?
- multiple item rows per bill: can one bill number appear on multiple item rows?

## 4. Target Mapping

This is the simple mapping we need to confirm for the first real sales format.

| Source Column | Target `sales_imports` Field |
| --- | --- |
| sales file bill date column | `bill_date` |
| sales file bill number column | `bill_no` |
| sales file item name column | `item_name` |
| sales file quantity column | `qty` |
| sales file amount column | `amount` |

Before coding, we must replace the words "sales file ... column" with the real header names from the chosen spreadsheet.

## 5. Import Safety Rules

The first real import flow should follow these rules:

- do not overwrite old data
- insert only new rows for each upload
- skip clearly invalid rows
- keep the `upload_log_id` link for every imported row
- start with spreadsheet import only
- do not add PDF parsing yet

This keeps the import process safer and easier to verify.

## 6. First Parser Scope

The first parser should stay very small.

Scope:
- one spreadsheet format only
- sales only
- no expenses yet
- no PDF support yet
- no AI mapping yet
- no auto-detection yet

This is intentional.

A very small first parser is easier to test and less likely to damage data quality.

## 7. What The Next Coding Step Will Be

After this planning document, the next coding step will be:

1. inspect one real sales spreadsheet
2. confirm the real columns
3. add spreadsheet parsing on the sales upload page
4. insert real rows into `sales_imports`

That should be done only after the sample file structure is clearly understood.

