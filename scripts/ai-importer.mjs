/**
 * AI-Powered Writeup Importer
 * ===========================
 * Menggunakan Gemini AI untuk:
 * 1. Parse README.md dari folder writeup secara rekursif
 * 2. Membersihkan AI slop / kalimat AI yang tidak perlu
 * 3. Mendeteksi dan embed solver script
 * 4. Generate structured WriteUp object ke writeups.ts
 *
 * Usage:
 *   node scripts/ai-importer.mjs
 *   node scripts/ai-importer.mjs --event GPNCTF2026
 *   node scripts/ai-importer.mjs --event RAM --reprocess
 *   node scripts/ai-importer.mjs --dry-run
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── CONFIG ────────────────────────────────────────────────────────────────

// Load .env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length && !key.startsWith('#')) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  }
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('[-] GEMINI_API_KEY not found in .env file!');
  process.exit(1);
}

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const WRITEUPS_BASE_DIR = 'C:\\Users\\user\\Nata\\Blog-Writeup\\Writeup';
const WRITEUPS_FILE_PATH = path.resolve(__dirname, '../src/app/data/writeups.ts');

// Event folder name → CTF display name mapping
const EVENT_NAMES = {
  'flagyard':    'FlagYard',
  'jerseyctf':   'JerseyCTF',
  'dalctf2026':  'DAL CTF 2026',
  'gpnctf2026':  'GPNCTF 2026',
  'ram':         'RAM',
  'thcon2026':   'THCON 2026',
  'them2026':    'THEM 2026',
  'texcaw':      'TexSAW CTF',
  'tjcsc':       'TJCSC',
};

// ─── CLI ARGS ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const REPROCESS = args.includes('--reprocess');
const EVENT_FILTER = (() => {
  const idx = args.indexOf('--event');
  return idx !== -1 ? args[idx + 1]?.toLowerCase() : null;
})();

// ─── GEMINI API ────────────────────────────────────────────────────────────

async function callGemini(prompt) {
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  });

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ─── AI PROMPT ─────────────────────────────────────────────────────────────

function buildPrompt(readmeContent, challengeName, category, eventName, solverCode) {
  return `
You are a CTF writeup parser. Your task is to parse a raw README.md from a CTF challenge and output a STRICT JSON object.

## Input Information
- Challenge name: ${challengeName}
- Category: ${category}
- CTF Event: ${eventName}
${solverCode ? `- Solver script is attached separately (embed into solution steps)` : ''}

## Raw README.md Content:
\`\`\`markdown
${readmeContent.slice(0, 12000)}
\`\`\`
${solverCode ? `\n## Solver Script Content:\n\`\`\`\n${solverCode.slice(0, 5000)}\n\`\`\`` : ''}

## Your Task:
Parse the above content into a structured JSON object with this EXACT schema:
{
  "title": "string — the challenge title (no 'Writeup' suffix, no event name prefix)",
  "difficulty": "Easy | Medium | Hard | Insane",
  "tags": ["array", "of", "relevant", "tags"],
  "description": "string — one concise sentence describing the challenge",
  "problemDescription": "string — detailed challenge description in MARKDOWN format",
  "tools": ["array", "of", "tools/techniques used"],
  "analysis": "string — initial analysis/enumeration in MARKDOWN format",
  "solution": [
    {
      "title": "string — step title",
      "content": "string — step description in MARKDOWN format (no code blocks here)",
      "code": "string — OPTIONAL: code snippet or command if this step has one"
    }
  ],
  "flag": "string — the flag value (e.g. FLAG{...})"
}

## STRICT RULES:
1. REMOVE any phrases like: "File solver sudah disimpan", "solver otomatis", "tersedia di folder ini", "saya sudah buat solver", or any text referencing local file paths like /home/... or C:\\Users\\...
2. REMOVE markdown links to local paths like [file](/home/user/...) — just use the filename in backticks instead
3. DO NOT make up content — if something is not in the README, leave the field empty ("")
4. For the solution array: each step should have a clear title and content. Put code in the "code" field only.
5. If a solver script is provided, add it as the LAST solution step with title "Solver Script" and the full code in "code", content: "Script solver lengkap:"
6. Flag must be the exact flag string (e.g. GPNCTF{...}, FLAG{...}, etc.)
7. Tags should be relevant technical concepts (e.g. ["XSS", "SQL Injection", "SSTI"])
8. Output ONLY the JSON object, no markdown, no explanation, no code fences.
`.trim();
}

// ─── FOLDER SCANNER ────────────────────────────────────────────────────────

function findSolverFile(dirPath, files) {
  const SOLVER_NAMES = ['solve.py', 'solver.py', 'exploit.py', 'solve.go',
                        'solve.sh', 'exploit.sh', 'solve.sage', 'exploit.sage',
                        'solve.js', 'solver.js', 'exploit.js', 'solve.rb'];
  const found = files.find(f => {
    const name = f.toLowerCase();
    return SOLVER_NAMES.includes(name) ||
      (name.startsWith('solve') && /\.(py|go|sh|sage|js|rb)$/.test(name)) ||
      (name.startsWith('exploit') && /\.(py|go|sh|sage|js|rb)$/.test(name));
  });
  if (!found) return null;
  return { name: found, content: fs.readFileSync(path.join(dirPath, found), 'utf-8').trim() };
}

function findReadmeInDir(dirPath) {
  try {
    const files = fs.readdirSync(dirPath);
    const readme = files.find(f => f.toLowerCase() === 'readme.md');
    if (readme) return { readmePath: path.join(dirPath, readme), files, dirPath };
    return null;
  } catch { return null; }
}

function scanEventFolder(eventPath, eventFolder) {
  const results = [];
  const categories = fs.readdirSync(eventPath).filter(item =>
    fs.statSync(path.join(eventPath, item)).isDirectory()
  );

  for (const categoryFolder of categories) {
    const categoryPath = path.join(eventPath, categoryFolder);
    const challengeDirs = fs.readdirSync(categoryPath).filter(item =>
      fs.statSync(path.join(categoryPath, item)).isDirectory()
    );

    for (const challengeFolder of challengeDirs) {
      const challengePath = path.join(categoryPath, challengeFolder);

      // Try depth 3 first
      let found = findReadmeInDir(challengePath);
      if (found) {
        const solver = findSolverFile(found.dirPath, found.files);
        results.push({ ...found, eventFolder, categoryFolder, challengeFolder, solver });
        continue;
      }

      // Try depth 4 (nested, like GPNCTF)
      const subItems = fs.readdirSync(challengePath);
      for (const subItem of subItems) {
        const subPath = path.join(challengePath, subItem);
        try {
          if (!fs.statSync(subPath).isDirectory()) continue;
          found = findReadmeInDir(subPath);
          if (found) {
            const solver = findSolverFile(found.dirPath, found.files);
            results.push({ ...found, eventFolder, categoryFolder, challengeFolder, solver });
            break; // First subdir with README wins
          }
        } catch { /* skip */ }
      }
    }
  }
  return results;
}

// ─── ID GENERATION ─────────────────────────────────────────────────────────

function makeId(eventFolder, categoryFolder, challengeFolder) {
  return `${eventFolder}-${categoryFolder}-${challengeFolder}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

function mapCategory(categoryFolder) {
  const norm = categoryFolder.toLowerCase();
  if (norm.startsWith('web')) return 'Web';
  if (norm.startsWith('crypto')) return 'Crypto';
  if (norm.startsWith('pwn')) return 'Pwn';
  if (norm.startsWith('rev')) return 'Reverse';
  if (norm.startsWith('forens')) return 'Forensics';
  if (norm.startsWith('misc')) return 'Misc';
  if (norm.startsWith('osint')) return 'OSINT';
  if (norm.startsWith('stegano') || norm.startsWith('steg')) return 'Stegano';
  if (norm.startsWith('hardware')) return 'Hardware';
  if (norm.startsWith('blockchain')) return 'Blockchain';
  return categoryFolder.charAt(0).toUpperCase() + categoryFolder.slice(1);
}

// ─── PARSE AI RESPONSE ─────────────────────────────────────────────────────

function parseAIResponse(text, id, eventFolder, categoryFolder) {
  // Strip markdown code fences if present
  let json = text.trim();
  json = json.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    // Try to extract JSON from middle of text
    const jsonMatch = json.match(/\{[\s\S]+\}/);
    if (jsonMatch) {
      try { parsed = JSON.parse(jsonMatch[0]); }
      catch { throw new Error(`JSON parse failed: ${e.message}\nResponse: ${json.slice(0, 200)}`); }
    } else {
      throw new Error(`No JSON found in response: ${json.slice(0, 200)}`);
    }
  }

  const ctfName = EVENT_NAMES[eventFolder.toLowerCase()] || eventFolder;

  return {
    id,
    title: parsed.title || '',
    category: mapCategory(categoryFolder),
    difficulty: parsed.difficulty || 'Medium',
    points: 0,
    date: new Date().toISOString().slice(0, 10),
    author: 'rhnataiet23-art',
    ctfName,
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    description: parsed.description || '',
    problemDescription: parsed.problemDescription || '',
    tools: Array.isArray(parsed.tools) ? parsed.tools : [],
    analysis: parsed.analysis || '',
    solution: Array.isArray(parsed.solution) ? parsed.solution : [],
    terminalOutputs: [],
    flag: parsed.flag || '',
    lessonsLearned: '',
  };
}

// ─── MAIN ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║         AI Writeup Importer (Gemini-powered)         ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`  Model: ${GEMINI_MODEL}`);
  console.log(`  Mode:  ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'} | ${REPROCESS ? 'Reprocess all' : 'Skip existing'}`);
  if (EVENT_FILTER) console.log(`  Event: ${EVENT_FILTER}`);
  console.log('');

  // Load existing IDs
  const existingContent = fs.readFileSync(WRITEUPS_FILE_PATH, 'utf-8');
  const existingIds = new Set();
  if (!REPROCESS) {
    const idRegex = /"id":\s*"([^"]+)"/g;
    let m;
    while ((m = idRegex.exec(existingContent)) !== null) existingIds.add(m[1]);
    console.log(`[i] Existing writeups: ${existingIds.size}`);
  }

  // Scan all event folders
  const eventFolders = fs.readdirSync(WRITEUPS_BASE_DIR).filter(item => {
    if (!fs.statSync(path.join(WRITEUPS_BASE_DIR, item)).isDirectory()) return false;
    if (EVENT_FILTER && item.toLowerCase() !== EVENT_FILTER) return false;
    return true;
  });

  console.log(`[i] Scanning events: ${eventFolders.join(', ')}`);
  console.log('');

  const allEntries = [];
  for (const eventFolder of eventFolders) {
    const eventPath = path.join(WRITEUPS_BASE_DIR, eventFolder);
    const entries = scanEventFolder(eventPath, eventFolder);
    allEntries.push(...entries);
  }

  // Filter out already imported
  const toProcess = REPROCESS
    ? allEntries
    : allEntries.filter(e => {
        const id = makeId(e.eventFolder, e.categoryFolder, e.challengeFolder);
        return !existingIds.has(id);
      });

  console.log(`[i] Found ${allEntries.length} writeups total, ${toProcess.length} to process`);
  console.log('');

  if (toProcess.length === 0) {
    console.log('[+] Nothing new to import!');
    return;
  }

  // Process each with AI
  const imported = [];
  for (let i = 0; i < toProcess.length; i++) {
    const entry = toProcess[i];
    const id = makeId(entry.eventFolder, entry.categoryFolder, entry.challengeFolder);
    const category = mapCategory(entry.categoryFolder);
    const ctfName = EVENT_NAMES[entry.eventFolder.toLowerCase()] || entry.eventFolder;

    console.log(`[${i + 1}/${toProcess.length}] Processing: ${id}`);

    const mdContent = fs.readFileSync(entry.readmePath, 'utf-8');
    const solverCode = entry.solver?.content || null;

    try {
      const prompt = buildPrompt(mdContent, entry.challengeFolder, category, ctfName, solverCode);
      const aiResponse = await callGemini(prompt);
      const writeup = parseAIResponse(aiResponse, id, entry.eventFolder, entry.categoryFolder);

      // If solver was found but AI didn't add it, add it manually
      if (solverCode) {
        const hasSolverStep = writeup.solution.some(s =>
          s.code && s.code.trim().slice(0, 50) === solverCode.trim().slice(0, 50)
        );
        if (!hasSolverStep) {
          writeup.solution.push({
            title: 'Solver Script',
            content: `Script solver lengkap (${entry.solver.name}):`,
            code: solverCode,
          });
        }
      }

      imported.push(writeup);
      console.log(`  ✓ "${writeup.title}" | flag: ${writeup.flag || '(not found)'}`);

      // Small delay to avoid rate limiting
      if (i < toProcess.length - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    } catch (e) {
      console.error(`  ✗ FAILED: ${e.message}`);
    }
  }

  console.log('');
  console.log(`[+] Processed: ${imported.length}/${toProcess.length}`);

  if (imported.length === 0 || DRY_RUN) {
    if (DRY_RUN) console.log('[i] Dry run — no changes written.');
    return;
  }

  // Write to writeups.ts
  if (REPROCESS) {
    // Full rewrite: parse existing, replace matching entries
    console.log('[i] Reprocess mode — updating existing entries...');
    let updatedContent = existingContent;
    for (const w of imported) {
      // Find and replace existing entry by id
      const idMarker = `"id": "${w.id}"`;
      const idx = updatedContent.indexOf(idMarker);
      if (idx === -1) continue;

      // Find the opening { before this id
      let start = idx;
      while (start > 0 && updatedContent[start] !== '{') start--;

      // Find the closing } for this object
      let depth = 0;
      let end = start;
      while (end < updatedContent.length) {
        if (updatedContent[end] === '{') depth++;
        else if (updatedContent[end] === '}') {
          depth--;
          if (depth === 0) { end++; break; }
        }
        end++;
      }

      const newEntry = JSON.stringify(w, null, 4);
      updatedContent = updatedContent.slice(0, start) + newEntry + updatedContent.slice(end);
      console.log(`  ↻ Updated: ${w.id}`);
    }
    if (!DRY_RUN) fs.writeFileSync(WRITEUPS_FILE_PATH, updatedContent, 'utf-8');
  } else {
    // Append new entries
    const lastBracket = existingContent.lastIndexOf('];');
    if (lastBracket === -1) {
      console.error('[-] Could not find ]; in writeups.ts');
      process.exit(1);
    }

    const entries = imported.map(w => JSON.stringify(w, null, 4)).join(',\n');
    const updatedContent =
      existingContent.slice(0, lastBracket) +
      ',\n' + entries + '\n' +
      existingContent.slice(lastBracket);

    fs.writeFileSync(WRITEUPS_FILE_PATH, updatedContent, 'utf-8');
    console.log(`[+] Appended ${imported.length} new writeup(s) to writeups.ts`);
  }

  // Summary
  console.log('');
  console.log('╔══════════════════════════════╗');
  console.log('║          Summary             ║');
  console.log('╚══════════════════════════════╝');
  imported.forEach(w => {
    console.log(`  • ${w.ctfName.padEnd(15)} [${w.category.padEnd(10)}] ${w.title}`);
  });
  console.log('');
  console.log('[✓] Done! Refresh your dev server to see changes.');
}

main().catch(e => {
  console.error('[-] Fatal error:', e);
  process.exit(1);
});
