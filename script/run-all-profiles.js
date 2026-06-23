import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');
const distPath = path.join(repoRoot, 'dist', 'index.js');

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

if (!fs.existsSync(distPath)) {
  console.error('dist/index.js not found. Run "npm run package" first.');
  process.exit(1);
}

const csvPath = path.join(repoRoot, 'profiles.csv');
if (!fs.existsSync(csvPath)) {
  console.error('profiles.csv not found.');
  process.exit(1);
}

const profiles = parseCSV(fs.readFileSync(csvPath, 'utf8'));
if (profiles.length === 0) {
  console.error('No profiles found in profiles.csv.');
  process.exit(1);
}

let failed = 0;

for (const profile of profiles) {
  console.log(`\n=== Updating profile: ${profile.name} ===\n`);

  const env = {
    ...process.env,
    INPUT_USERNAME: profile.username,
    INPUT_PASSWORD: profile.password,
    INPUT_PROFILE_ID: profile.profile_id,
    INPUT_RESUME_PATH: profile.resume_path,
    INPUT_PROFILE_SUMMARY: profile.profile_summary ?? '',
    INPUT_RESUME_HEADLINE: profile.resume_headline ?? ''
  };

  const result = spawnSync(process.execPath, [distPath], {
    cwd: repoRoot,
    env,
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    failed += 1;
    console.error(`Profile update failed for ${profile.name}`);
  }
}

if (failed > 0) {
  console.error(`\nCompleted with ${failed} failed profile(s) out of ${profiles.length}.`);
  process.exit(1);
}

console.log(`\nAll ${profiles.length} profile(s) updated successfully.`);
