import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import xlsx from "xlsx";

const filePathArg = process.argv[2];

if (!filePathArg) {
  console.error("Usage:");
  console.error('npm run inspect:sales -- "C:\\path\\to\\file.xlsx"');
  process.exit(1);
}

const resolvedPath = path.resolve(filePathArg);
const extension = path.extname(resolvedPath).toLowerCase();

if (extension !== ".xlsx") {
  console.error("This tool currently supports only .xlsx files.");
  console.error('Example: npm run inspect:sales -- "C:\\path\\to\\file.xlsx"');
  process.exit(1);
}

if (!fs.existsSync(resolvedPath)) {
  console.error(`Could not find file: ${resolvedPath}`);
  process.exit(1);
}

let workbook;

try {
  workbook = xlsx.read(fs.readFileSync(resolvedPath), { type: "buffer", cellDates: true });
} catch (error) {
  console.error(`Could not read workbook: ${resolvedPath}`);
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

function toDisplayValue(value) {
  if (value === undefined) {
    return "";
  }

  if (value === null) {
    return "null";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

function isEmptyCell(value) {
  return toDisplayValue(value).trim() === "";
}

function formatRow(row) {
  const displayRow = row.map((cell) => toDisplayValue(cell));
  return JSON.stringify(displayRow);
}

function getRows(sheet) {
  return xlsx.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: true,
  });
}

function getEstimatedColumnCount(rows) {
  return rows.reduce((max, row) => Math.max(max, row.length), 0);
}

function isNonEmptyRow(row) {
  return row.some((cell) => !isEmptyCell(cell));
}

function getFirstNonEmptyRowIndex(rows) {
  const index = rows.findIndex((row) => isNonEmptyRow(row));
  return index === -1 ? null : index + 1;
}

function scoreHeaderRow(row) {
  const nonEmptyCells = row.filter((cell) => !isEmptyCell(cell));

  if (nonEmptyCells.length === 0) {
    return -1;
  }

  let score = 0;

  for (const cell of nonEmptyCells) {
    const value = toDisplayValue(cell).trim();

    if (/[A-Za-z]/.test(value)) {
      score += 2;
    }

    if (!/^\d+(\.\d+)?$/.test(value)) {
      score += 1;
    }

    if (value.length <= 40) {
      score += 1;
    }
  }

  if (nonEmptyCells.length >= 3) {
    score += 2;
  }

  return score;
}

function detectLikelyHeaderRow(rows) {
  let bestIndex = null;
  let bestScore = -1;

  for (let i = 0; i < Math.min(rows.length, 15); i += 1) {
    const score = scoreHeaderRow(rows[i]);

    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex === null ? null : bestIndex + 1;
}

function getHeaderValues(rows, headerRowIndex) {
  if (!headerRowIndex) {
    return [];
  }

  return rows[headerRowIndex - 1] ?? [];
}

function getColumnLetter(index) {
  let value = index + 1;
  let letter = "";

  while (value > 0) {
    const remainder = (value - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    value = Math.floor((value - 1) / 26);
  }

  return letter;
}

function findBlankRowsNearTop(rows) {
  const blankRows = [];

  for (let i = 0; i < Math.min(rows.length, 15); i += 1) {
    if (!isNonEmptyRow(rows[i])) {
      blankRows.push(i + 1);
    }
  }

  return blankRows;
}

function findDuplicateHeaders(headerValues) {
  const counts = {};

  for (const header of headerValues) {
    const key = toDisplayValue(header).trim();

    if (!key) {
      continue;
    }

    counts[key] = (counts[key] ?? 0) + 1;
  }

  return Object.entries(counts)
    .filter(([, count]) => count > 1)
    .map(([header]) => header);
}

function findTotalsLikeRows(rows) {
  const matches = [];
  const pattern = /\b(total|subtotal|grand total|summary)\b/i;

  rows.forEach((row, index) => {
    const joined = row.map((cell) => toDisplayValue(cell)).join(" | ");

    if (pattern.test(joined)) {
      matches.push(index + 1);
    }
  });

  return matches;
}

function findIrregularRowLengths(rows) {
  const nonEmptyRows = rows.filter((row) => isNonEmptyRow(row));

  if (nonEmptyRows.length === 0) {
    return [];
  }

  const lengthCounts = {};

  for (const row of nonEmptyRows) {
    lengthCounts[row.length] = (lengthCounts[row.length] ?? 0) + 1;
  }

  const expectedLength = Number(
    Object.entries(lengthCounts).sort((firstEntry, secondEntry) => secondEntry[1] - firstEntry[1])[0][0]
  );

  return rows
    .map((row, index) => ({
      rowNumber: index + 1,
      length: row.length,
      isIrregular: isNonEmptyRow(row) && row.length !== expectedLength,
    }))
    .filter((row) => row.isIrregular)
    .slice(0, 15);
}

function printSection(title) {
  console.log("");
  console.log(`=== ${title} ===`);
}

printSection("File Summary");
console.log(`Workbook file path: ${resolvedPath}`);
console.log(`File extension: ${extension}`);
console.log(`Number of sheets: ${workbook.SheetNames.length}`);
console.log(`Sheet names: ${workbook.SheetNames.join(", ")}`);

for (const sheetName of workbook.SheetNames) {
  const sheet = workbook.Sheets[sheetName];
  const rows = getRows(sheet);
  const estimatedRowCount = rows.length;
  const estimatedColumnCount = getEstimatedColumnCount(rows);
  const firstNonEmptyRowIndex = getFirstNonEmptyRowIndex(rows);
  const likelyHeaderRow = detectLikelyHeaderRow(rows);
  const headerValues = getHeaderValues(rows, likelyHeaderRow);
  const merges = sheet["!merges"] ?? [];
  const blankRowsNearTop = findBlankRowsNearTop(rows);
  const duplicateHeaders = findDuplicateHeaders(headerValues);
  const totalsLikeRows = findTotalsLikeRows(rows);
  const irregularRows = findIrregularRowLengths(rows);

  printSection(`Sheet: ${sheetName}`);
  console.log(`Sheet name: ${sheetName}`);
  console.log(`Estimated row count: ${estimatedRowCount}`);
  console.log(`Estimated column count: ${estimatedColumnCount}`);
  console.log(`First non-empty row index: ${firstNonEmptyRowIndex ?? "-"}`);
  console.log(`Likely header row: ${likelyHeaderRow ?? "-"}`);
  console.log(`Header values: ${headerValues.length > 0 ? formatRow(headerValues) : "[]"}`);

  printSection(`First 5 Rows - ${sheetName}`);
  for (let i = 0; i < Math.min(5, rows.length); i += 1) {
    console.log(`Row ${i + 1}: ${formatRow(rows[i])}`);
  }

  printSection(`First 30 Rows After Header - ${sheetName}`);
  if (!likelyHeaderRow) {
    console.log("No likely header row detected.");
  } else {
    const startIndex = likelyHeaderRow;
    const endIndex = Math.min(rows.length, startIndex + 30);

    for (let i = startIndex; i < endIndex; i += 1) {
      console.log(`Row ${i + 1}: ${formatRow(rows[i])}`);
    }
  }

  printSection(`Column Map - ${sheetName}`);
  if (headerValues.length === 0) {
    console.log("No header values available.");
  } else {
    for (let i = 0; i < headerValues.length; i += 1) {
      console.log(`${getColumnLetter(i)}: ${toDisplayValue(headerValues[i])}`);
    }
  }

  printSection(`Data Quality Hints - ${sheetName}`);
  console.log(
    `Blank rows near the top: ${blankRowsNearTop.length > 0 ? blankRowsNearTop.join(", ") : "No obvious blank rows near the top"}`
  );
  console.log(`Merged cells exist: ${merges.length > 0 ? `Yes (${merges.length})` : "No"}`);
  console.log(
    `Duplicate header names exist: ${duplicateHeaders.length > 0 ? duplicateHeaders.join(", ") : "No"}`
  );
  console.log(
    `Totals or subtotal looking rows: ${totalsLikeRows.length > 0 ? totalsLikeRows.join(", ") : "None detected"}`
  );

  if (irregularRows.length > 0) {
    console.log("Rows with fewer or more columns than others:");
    for (const row of irregularRows) {
      console.log(`- Row ${row.rowNumber} has ${row.length} columns`);
    }
  } else {
    console.log("Rows with fewer or more columns than others: None obvious");
  }
}
