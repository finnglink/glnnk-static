#!/usr/bin/env node
// parse-csv.js
// Run once (or whenever you update the Google Sheets export):
//   node parse-csv.js
// Reads the CSV and writes one YAML file per category into ./products/

const fs   = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const CSV_FILE   = path.join(__dirname, 'glnnk_ref_links___gear_page_-_Sheet1.csv');
const OUTPUT_DIR = path.join(__dirname, 'products');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ── tiny CSV parser (handles quoted fields) ──────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = splitLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = splitLine(line);
    return Object.fromEntries(headers.map((h, i) => [h.trim(), (values[i] ?? '').trim()]));
  });
}

function splitLine(line) {
  const fields = [];
  let cur = '', inQuote = false;
  for (const ch of line) {
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === ',' && !inQuote) { fields.push(cur); cur = ''; continue; }
    cur += ch;
  }
  fields.push(cur);
  return fields;
}

function slug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function val(v) {
  return (!v || v.toLowerCase() === 'na' || v === '') ? null : v;
}

// ── parse ────────────────────────────────────────────────────────────────────
const rows = parseCSV(fs.readFileSync(CSV_FILE, 'utf8'));

// Group by category, preserving order
const categoryMap = new Map();
for (const row of rows) {
  const key = row['Category'];
  if (!categoryMap.has(key)) {
    categoryMap.set(key, { order: parseInt(row['Order']), category: key, products: [] });
  }
  const isGlobal = !!val(row['global link']);
  const product = {
    name: row['Name'],
    desc: row['Desc'] || null,
    ref:  row['Ref'].toUpperCase() === 'TRUE',
  };
  if (isGlobal) {
    product.global_link  = val(row['global link']);
    product.global_store = guessStore(val(row['global link']));
  } else {
    product.links = {};
    const de = val(row['DE']), us = val(row['US']), uk = val(row['UK']);
    if (de) product.links.DE = de;
    if (us) product.links.US = us;
    if (uk) product.links.UK = uk;
  }
  categoryMap.get(key).products.push(product);
}

function guessStore(url) {
  if (!url) return 'store';
  if (url.includes('ableton.com'))       return 'ableton.com';
  if (url.includes('epidemicsound.com')) return 'epidemicsound.com';
  if (url.includes('teenage.engineering'))return 'teenage.engineering';
  if (url.includes('amazon'))            return 'Amazon';
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'store'; }
}

// ── write one YAML per category ──────────────────────────────────────────────
let written = 0;
for (const [, cat] of categoryMap) {
  const filename = `${String(cat.order).padStart(2, '0')}-${slug(cat.category)}.yaml`;
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, yaml.dump(cat, { lineWidth: 120, quotingType: '"' }), 'utf8');
  console.log(`✓ ${filename}  (${cat.products.length} products)`);
  written++;
}
console.log(`\nDone — ${written} category files written to ./products/`);
