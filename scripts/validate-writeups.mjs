#!/usr/bin/env node

/**
 * Writeup Validation Script
 *
 * Reads all per-event files from src/app/data/writeups/events/ and checks
 * for common authoring issues without needing a TypeScript runtime.
 *
 * Usage:
 *   node scripts/validate-writeups.mjs
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const eventsDir = resolve(__dirname, '../src/app/data/writeups/events');

if (!existsSync(eventsDir)) {
  console.error(`Events directory not found: ${eventsDir}`);
  process.exit(1);
}

// Concatenate all event files into one content blob for regex scanning
const eventFiles = readdirSync(eventsDir).filter(f => f.endsWith('.ts'));
let content = '';
for (const file of eventFiles) {
  content += readFileSync(join(eventsDir, file), 'utf-8') + '\n';
}

console.log(`Scanning ${eventFiles.length} event file(s) from writeups/events/...`);

const warnings = [];
let errorCount = 0;

// --- Extract all id values ---
const idRegex = /^\s*["']?id["']?\s*:\s*["']([^"']+)["']/gm;
const ids = [];
let match;
while ((match = idRegex.exec(content)) !== null) {
  ids.push({ value: match[1], index: match.index });
}

// Check duplicate IDs
const idCounts = new Map();
for (const { value } of ids) {
  idCounts.set(value, (idCounts.get(value) || 0) + 1);
}
for (const [id, count] of idCounts) {
  if (count > 1) {
    warnings.push(`ERROR: Duplicate id "${id}" found ${count} times.`);
    errorCount++;
  }
}

// Check individual IDs
for (const { value } of ids) {
  if (/\s/.test(value)) {
    warnings.push(`ERROR: id "${value}" contains spaces. Use hyphens instead.`);
    errorCount++;
  }
  if (value !== value.toLowerCase()) {
    warnings.push(`WARN:  id "${value}" contains uppercase characters. Use lowercase only.`);
  }
  if (value.length < 3) {
    warnings.push(`WARN:  id "${value}" seems too short. Use format: eventslug-category-challengeslug`);
  }
}

// --- Extract ctfName values and check consistency ---
const ctfNameRegex = /^\s*["']?ctfName["']?\s*:\s*["']([^"']+)["']/gm;
const ctfNames = [];
while ((match = ctfNameRegex.exec(content)) !== null) {
  ctfNames.push(match[1]);
}

const ctfNormMap = new Map();
for (const name of ctfNames) {
  const normalized = name.toLowerCase().replace(/[\s_-]+/g, '');
  if (!ctfNormMap.has(normalized)) {
    ctfNormMap.set(normalized, new Set());
  }
  ctfNormMap.get(normalized).add(name);
}
for (const [, variants] of ctfNormMap) {
  if (variants.size > 1) {
    const names = Array.from(variants).join(', ');
    warnings.push(`WARN:  Likely inconsistent ctfName variants: ${names}`);
  }
}

// --- Extract category values and check casing ---
const categoryRegex = /^\s*["']?category["']?\s*:\s*["']([^"']+)["']/gm;
const categories = [];
while ((match = categoryRegex.exec(content)) !== null) {
  categories.push(match[1]);
}

const catNormMap = new Map();
for (const cat of categories) {
  const normalized = cat.toLowerCase();
  if (!catNormMap.has(normalized)) {
    catNormMap.set(normalized, new Set());
  }
  catNormMap.get(normalized).add(cat);
}
for (const [, variants] of catNormMap) {
  if (variants.size > 1) {
    const names = Array.from(variants).join(', ');
    warnings.push(`WARN:  Inconsistent category casing: ${names}`);
  }
}

// --- Check for TODO markers left in published data ---
const todoMatches = content.match(/TODO[:{]/g);
if (todoMatches && todoMatches.length > 0) {
  warnings.push(`INFO:  Found ${todoMatches.length} TODO marker(s) in writeups.ts — fill them in before publishing.`);
}

// --- Report ---
console.log('');
console.log(`Writeup Validation — ${ids.length} writeup(s) found`);
console.log('─'.repeat(50));

if (warnings.length === 0) {
  console.log('✓ All checks passed. No issues found.');
} else {
  for (const w of warnings) {
    console.log(`  ${w}`);
  }
  console.log('');
  console.log(`${warnings.length} issue(s) found (${errorCount} error(s)).`);
}

console.log('');

if (errorCount > 0) {
  process.exit(1);
}
