#!/usr/bin/env node

/**
 * CTF Writeup Generator
 *
 * Generates a copy-paste-ready Writeup object for src/app/data/writeups.ts.
 *
 * Usage:
 *   node scripts/new-writeup.mjs \
 *     --event "DalCTF 2026" \
 *     --category "Misc" \
 *     --title "GrafaJitsu" \
 *     --difficulty "Medium" \
 *     --points 500 \
 *     --date "2026-06-07"
 */

const args = process.argv.slice(2);

function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

function slugify(input) {
  if (!input) return 'untitled';
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'untitled';
}

function eventSlugify(input) {
  if (!input) return 'untitled';
  // For CTF event names like "DalCTF 2026", produce "dalctf2026"
  // Remove spaces between word and year-like number
  return input
    .toLowerCase()
    .trim()
    .replace(/([a-z]+)\s+(\d{4})/g, '$1$2')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'untitled';
}

// --- Parse arguments ---
const event = getArg('event');
const category = getArg('category') || 'Misc';
const title = getArg('title');
const difficulty = getArg('difficulty') || 'Medium';
const points = getArg('points') ? Number(getArg('points')) : 0;
const date = getArg('date') || new Date().toISOString().slice(0, 10);

if (!event || !title) {
  console.error('Usage: node scripts/new-writeup.mjs --event "EventName" --title "ChallengeName" [--category Category] [--difficulty Difficulty] [--points N] [--date YYYY-MM-DD]');
  console.error('');
  console.error('Required:');
  console.error('  --event     CTF event name (e.g. "DalCTF 2026")');
  console.error('  --title     Challenge name (e.g. "GrafaJitsu")');
  console.error('');
  console.error('Optional:');
  console.error('  --category  Challenge category (default: Misc)');
  console.error('  --difficulty  Easy | Medium | Hard (default: Medium)');
  console.error('  --points    Point value (default: 0)');
  console.error('  --date      Date YYYY-MM-DD (default: today)');
  process.exit(1);
}

// --- Generate ID ---
const eventPart = eventSlugify(event);
const categoryPart = slugify(category);
const titlePart = slugify(title);
const id = `${eventPart}-${categoryPart}-${titlePart}`;

// --- Output ---
const output = `{
  id: "${id}",
  title: "${title}",
  ctfName: "${event}",
  category: "${category}",
  difficulty: "${difficulty}",
  points: ${points},
  date: "${date}",
  author: "rhnataiet23-art",
  tags: [],

  description: "TODO: short TL;DR of the solve.",

  problemDescription: \`TODO: paste original challenge description here.\`,

  tools: [],

  analysis: \`TODO: explain initial analysis here.\`,

  solution: [
    {
      title: "Step 1 - Recon",
      content: "TODO: describe the first step."
    }
  ],

  terminalOutputs: [],

  flag: "TODO{flag}",

  lessonsLearned: []
},`;

console.log('');
console.log('// ===== Generated writeup — paste into src/app/data/writeups.ts =====');
console.log(output);
console.log('');
