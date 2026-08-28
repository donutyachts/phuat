#!/usr/bin/env node
// Regenerates data/test-cases.json from data/test-cases.csv.
// Run after editing the CSV: node scripts/build-data.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.join(__dirname, "..", "data", "test-cases.csv");
const jsonPath = path.join(__dirname, "..", "data", "test-cases.json");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const raw = readFileSync(csvPath, "utf8");
const rows = parseCsv(raw);
const header = rows[0];
const records = rows.slice(1).map((r) => {
  const rec = {};
  header.forEach((key, idx) => {
    rec[key] = r[idx] ?? "";
  });
  return rec;
});

writeFileSync(jsonPath, JSON.stringify(records, null, 2) + "\n");
console.log(`Wrote ${records.length} test cases to ${path.relative(process.cwd(), jsonPath)}`);
