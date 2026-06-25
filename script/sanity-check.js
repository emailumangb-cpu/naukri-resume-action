import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, '../profiles.csv');
const RESUMES_DIR = path.join(__dirname, '../resumes');

const HEADLINE_MAX = 250;
const SUMMARY_MAX = 900;

function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue;
    const record = {};
    headers.forEach((header, index) => {
      record[header.trim()] = values[index] ? values[index].trim() : '';
    });
    records.push(record);
  }
  return records;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function listFiles(dir) {
  try {
    return fs.readdirSync(dir).map((f) => f.toLowerCase());
  } catch {
    return [];
  }
}

function checkResumeExists(profileName, filename) {
  const fullPath = path.join(RESUMES_DIR, filename);
  const exists = fs.existsSync(fullPath);

  if (!exists) {
    console.log(
      `  ❌ RESUME NOT FOUND: "${filename}" for profile "${profileName}" — file does not exist in ./resumes/`
    );
    const files = listFiles(RESUMES_DIR);
    if (files.length > 0) {
      console.log(`     💡 Files present: ${files.join(', ')}`);
    } else {
      console.log(`     💡 The ./resumes/ directory is empty`);
    }
    return false;
  }
  return true;
}

function checkHeadlineLength(profileName, headline) {
  const len = headline.length;
  if (len > HEADLINE_MAX) {
    console.log(
      `  ❌ HEADLINE TOO LONG: ${len} chars (max ${HEADLINE_MAX}) for profile "${profileName}"`
    );
    return false;
  }
  return true;
}

function checkSummaryLength(profileName, summary) {
  const len = summary.length;
  if (len > SUMMARY_MAX) {
    console.log(
      `  ❌ SUMMARY TOO LONG: ${len} chars (max ${SUMMARY_MAX}) for profile "${profileName}"`
    );
    return false;
  }
  return true;
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------
console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  SANITY CHECK: profiles.csv validation');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

if (!fs.existsSync(CSV_PATH)) {
  console.error('  ❌ FAIL: profiles.csv not found at', CSV_PATH);
  process.exit(1);
}

const raw = fs.readFileSync(CSV_PATH, 'utf8');
const profiles = parseCSV(raw);
const requiredFields = ['name', 'username', 'password', 'profile_id', 'resume_path'];

console.log(`  Profiles found in CSV: ${profiles.length}`);
console.log('');

let allPassed = true;
let totalChecks = 0;
let passedChecks = 0;

profiles.forEach((p, idx) => {
  const name = p.name || `#${idx + 1}`;
  console.log(`  ── Profile ${idx + 1}: ${name} ──`);

  // Check required fields
  for (const field of requiredFields) {
    if (!p[field] || p[field].length === 0) {
      console.log(`  ❌ MISSING FIELD: "${field}" is empty`);
      allPassed = false;
    }
  }

  // Resume existence check
  if (p.resume_path) {
    totalChecks++;
    if (checkResumeExists(name, p.resume_path)) {
      passedChecks++;
    } else {
      allPassed = false;
    }
  }

  // Resume headline length check
  if (p.resume_headline) {
    totalChecks++;
    if (checkHeadlineLength(name, p.resume_headline)) {
      passedChecks++;
    } else {
      allPassed = false;
    }
  } else {
    console.log(`  ⚠️  WARNING: resume_headline is empty for "${name}"`);
  }

  // Profile summary length check
  if (p.profile_summary) {
    totalChecks++;
    if (checkSummaryLength(name, p.profile_summary)) {
      passedChecks++;
    } else {
      allPassed = false;
    }
  } else {
    console.log(`  ⚠️  WARNING: profile_summary is empty for "${name}"`);
  }

  console.log('');
});

console.log('═══════════════════════════════════════════════════════════');
console.log(`  RESULTS: ${passedChecks}/${totalChecks} checks passed`);
console.log('═══════════════════════════════════════════════════════════');

if (allPassed) {
  console.log('  ✅ All sanity checks passed!');
  console.log('');
  process.exit(0);
} else {
  console.log('  ❌ Some sanity checks failed. Review errors above.');
  console.log('');
  process.exit(1);
}
