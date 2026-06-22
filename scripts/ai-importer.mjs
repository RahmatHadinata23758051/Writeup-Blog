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
import readline from 'readline';

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

let GEMINI_MODEL = 'gemini-2.0-flash';

const WRITEUPS_BASE_DIR = 'C:\\Users\\user\\Nata\\Blog-Writeup\\Writeup';
const WRITEUPS_FILE_PATH = path.resolve(__dirname, '../src/app/data/writeups.ts'); // shim — kept for backward compat
const EVENTS_DIR = path.resolve(__dirname, '../src/app/data/writeups/events');
const INDEX_FILE_PATH = path.resolve(__dirname, '../src/app/data/writeups/index.ts');

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

// ─── CLI ARGS & INTERACTIVE MENU ───────────────────────────────────────────

const args = process.argv.slice(2);
const HAS_CLI_ARGS = args.length > 0;

let DRY_RUN = args.includes('--dry-run');
let REPROCESS = args.includes('--reprocess');
let EVENT_FILTER = (() => {
  const idx = args.indexOf('--event');
  return idx !== -1 ? args[idx + 1]?.toLowerCase() : null;
})();
let CUSTOM_PATH = null;
let PARSER_MODE = args.includes('--gemini') ? 'gemini' : 'local';

// readline utility
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => rl.question(query, (ans) => {
    rl.close();
    resolve(ans.trim());
  }));
}

// ─── GEMINI API ────────────────────────────────────────────────────────────

async function callGemini(prompt, retries = 4, initialDelay = 3000) {
  const SUPPORTED_MODELS = [
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-flash-latest'
  ];

  for (let attempt = 0; attempt <= retries; attempt++) {
    for (const model of SUPPORTED_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const body = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      });

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            if (model !== GEMINI_MODEL) {
              console.log(`  [i] Beralih ke model aktif: ${model}`);
              GEMINI_MODEL = model;
            }
            return text;
          }
        }

        const status = response.status;
        const errText = await response.text().catch(() => '');
        console.warn(`  [!] Model ${model} gagal (Status ${status}).`);
      } catch (err) {
        console.warn(`  [!] Error jaringan/fetch untuk ${model}: ${err.message}`);
      }
    }

    if (attempt < retries) {
      const waitTime = initialDelay * Math.pow(2, attempt);
      console.warn(`  [!] Semua model gagal pada percobaan ke-${attempt + 1}. Menunggu ${waitTime / 1000} detik sebelum mencoba kembali...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw new Error("Semua model Gemini gagal dipanggil setelah beberapa kali percobaan.");
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
  if (norm.startsWith('forens') || norm.startsWith('foren')) return 'Forensics';
  if (norm.startsWith('misc')) return 'Misc';
  if (norm.startsWith('osint')) return 'OSINT';
  if (norm.startsWith('stegano') || norm.startsWith('steg')) return 'Stegano';
  if (norm.startsWith('hardware')) return 'Hardware';
  if (norm.startsWith('blockchain')) return 'Blockchain';
}

// ─── CTF NAME NORMALIZATION ────────────────────────────────────────────────

function getCtfDisplayName(folderName) {
  const lower = folderName.toLowerCase();
  if (EVENT_NAMES[lower]) return EVENT_NAMES[lower];

  // Automatic normalization
  let name = folderName;
  // Separate letters and digits at the end: e.g., "dalctf2026" -> "dalctf 2026"
  name = name.replace(/([a-zA-Z]+)(\d{4})$/, '$1 $2');
  // Separate "ctf" (case insensitive): e.g., "byuctf" -> "byu ctf"
  name = name.replace(/([a-zA-Z]+)(ctf)/i, '$1 $2');
  name = name.replace(/(ctf)([a-zA-Z]+)/i, '$1 $2');

  // Capitalize words
  return name
    .split(/[\s_-]+/)
    .map(word => {
      if (word.toLowerCase() === 'ctf') return 'CTF';
      // If it's a short word (acronym), keep it capitalized (e.g. "byu" -> "BYU")
      if (word.length <= 4 && !/[0-9]/.test(word)) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

// ─── PARSE AI RESPONSE & HEAL ──────────────────────────────────────────────

async function parseAndHealAIResponse(text, id, eventFolder, categoryFolder, retryCount = 1, mdContent, challengeFolder, category, ctfName, solverCode) {
  let json = text.trim();
  // Strip markdown code fences if present
  json = json.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    // Try to extract JSON structure with regex
    const jsonMatch = json.match(/\{[\s\S]+\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (e2) {
        if (retryCount > 0) {
          console.warn(`  [!] Response Gemini bukan JSON valid (${e2.message}). Mencoba memperbaiki dengan AI...`);
          const healingPrompt = `
Sintaks JSON yang kamu berikan sebelumnya tidak valid dan gagal di-parse oleh JSON.parse() dengan error: "${e2.message}".

Ini adalah response kamu sebelumnya:
\`\`\`
${text}
\`\`\`

Tolong perbaiki sintaks JSON tersebut agar benar-benar valid. Pastikan semua double-quotes tertutup dengan benar, karakter newline di dalam string sudah di-escape (menggunakan \\n), dan karakter ilegal lainnya di-escape. Kembalikan HANYA objek JSON yang valid tanpa markdown codeblock wrapper atau penjelasan apapun.
`;
          try {
            const fixedText = await callGemini(healingPrompt);
            return await parseAndHealAIResponse(fixedText, id, eventFolder, categoryFolder, retryCount - 1, mdContent, challengeFolder, category, ctfName, solverCode);
          } catch (healingError) {
            console.error(`  [!] Gagal memperbaiki JSON: ${healingError.message}`);
          }
        }
        throw new Error(`JSON parse failed: ${e2.message}`);
      }
    } else {
      if (retryCount > 0) {
        console.warn(`  [!] Tidak menemukan format JSON di response. Meminta ulang ke AI...`);
        const reprompt = buildPrompt(mdContent, challengeFolder, category, ctfName, solverCode) + "\n\nPASTIKAN kembalikan HANYA format JSON valid tanpa penjelasan teks lain!";
        const fixedText = await callGemini(reprompt);
        return await parseAndHealAIResponse(fixedText, id, eventFolder, categoryFolder, retryCount - 1, mdContent, challengeFolder, category, ctfName, solverCode);
      }
      throw new Error("No JSON found in response.");
    }
  }

  // --- Auto Correction & Sanitization of Fields ---

  // 1. Sanitize ID
  const cleanId = id
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');

  // 2. Validate difficulty
  let difficulty = parsed.difficulty || 'Medium';
  difficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
  if (!['Easy', 'Medium', 'Hard', 'Insane', 'Unknown'].includes(difficulty)) {
    difficulty = 'Medium';
  }

  // 3. Remove AI Slop from description, analysis, solution
  const removeAISlop = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/^(In this challenge|Dalam tantangan ini|Dalam challenge ini|Pada challenge ini|For this challenge),?\s*/i, '')
      .replace(/^(Firstly|Pertama-tama|Pertama),?\s*/i, '')
      .replace(/^(It is important to note that|Penting untuk dicatat bahwa),?\s*/i, '')
      .replace(/^(This is an? interesting challenge because|Tantangan ini menarik karena),?\s*/i, '')
      .trim();
  };

  let description = removeAISlop(parsed.description || '');
  if (description.length > 180) {
    const sentences = description.split(/[.!?]\s+/);
    if (sentences[0] && sentences[0].length > 15) {
      description = sentences[0] + '.';
    } else {
      description = description.slice(0, 177) + '...';
    }
  }

  const cleanAnalysis = removeAISlop(parsed.analysis || '');

  // 4. Sanitize solution steps
  const solution = (Array.isArray(parsed.solution) ? parsed.solution : []).map(step => {
    const cleanedStep = {
      title: step.title || 'Step',
      content: removeAISlop(step.content || '')
    };
    if (step.command) cleanedStep.command = step.command;
    if (step.output) cleanedStep.output = step.output;
    if (step.code) cleanedStep.code = step.code;
    return cleanedStep;
  });

  // 5. Ensure category matches standard map
  const mappedCategory = mapCategory(categoryFolder);

  // 6. Pull tags
  const tags = (Array.isArray(parsed.tags) ? parsed.tags : [])
    .map(t => t.toLowerCase().trim().replace(/[^a-z0-9-]/g, ''))
    .filter(t => t.length > 0);

  // 7. Ensure flag is present
  let flag = (parsed.flag || '').trim();
  if (!flag) {
    // Fallback regex scan in the readme markdown
    const flagRegex = /[a-zA-Z0-9_-]+{[a-zA-Z0-9_!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?]+}/;
    const match = mdContent.match(flagRegex);
    if (match) {
      flag = match[0];
      console.log(`  [i] Flag kosong di JSON, otomatis diekstrak dari README: ${flag}`);
    }
  }

  // 8. Sanitize lessonsLearned (ensure array of strings)
  let lessonsLearned = [];
  if (Array.isArray(parsed.lessonsLearned)) {
    lessonsLearned = parsed.lessonsLearned.map(l => removeAISlop(l));
  } else if (typeof parsed.lessonsLearned === 'string' && parsed.lessonsLearned) {
    lessonsLearned = [removeAISlop(parsed.lessonsLearned)];
  }

  return {
    id: cleanId,
    title: parsed.title || challengeFolder,
    ctfName,
    category: mappedCategory,
    difficulty,
    points: parsed.points ? Number(parsed.points) : 0,
    date: parsed.date || new Date().toISOString().slice(0, 10),
    author: parsed.author || 'Nattt',
    tags,
    description,
    problemDescription: parsed.problemDescription || '',
    tools: Array.isArray(parsed.tools) ? parsed.tools : [],
    analysis: cleanAnalysis,
    solution,
    terminalOutputs: Array.isArray(parsed.terminalOutputs) ? parsed.terminalOutputs : [],
    flag,
    lessonsLearned
  };
}

function extractFlag(text) {
  const flagRegex = /[a-zA-Z0-9_-]+{[a-zA-Z0-9_!@#$%^&*()\-+=?|~. ]+}/;
  const match = text.match(flagRegex);
  return match ? match[0] : null;
}

function parseReadmeLocal(mdContent, id, eventFolder, categoryFolder, challengeFolder, category, ctfName, solverCode) {
  const cleanTitle = challengeFolder
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]+/g, ' ')
    .trim();
  
  let defaultTitle = cleanTitle.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const result = {
    id,
    title: defaultTitle,
    ctfName: ctfName || getCtfDisplayName(eventFolder),
    category: category || mapCategory(categoryFolder),
    difficulty: "Medium",
    points: 0,
    date: new Date().toISOString().slice(0, 10),
    author: "Nattt",
    tags: [],
    description: "",
    problemDescription: "",
    tools: [],
    analysis: "",
    solution: [],
    terminalOutputs: [],
    flag: "",
    lessonsLearned: []
  };

  const lines = mdContent.split(/\r?\n/);
  
  let titleFromHeader = "";
  for (let line of lines) {
    if (line.startsWith('# ')) {
      titleFromHeader = line.slice(2).trim();
      break;
    }
  }
  if (titleFromHeader) {
    result.title = titleFromHeader.replace(/\s*-\s*Writeup/gi, '').replace(/\s*Writeup/gi, '').trim();
  }

  const sections = [];
  let currentSection = { heading: "", contentLines: [] };
  
  for (let line of lines) {
    if (line.startsWith('# ')) {
      continue;
    } else if (line.startsWith('## ') || line.startsWith('### ')) {
      if (currentSection.contentLines.length > 0 || currentSection.heading) {
        sections.push(currentSection);
      }
      currentSection = { heading: line.replace(/^##+\s+/, '').trim(), contentLines: [] };
    } else {
      currentSection.contentLines.push(line);
    }
  }
  if (currentSection.contentLines.length > 0 || currentSection.heading) {
    sections.push(currentSection);
  }

  let introLines = [];
  if (sections.length > 0 && sections[0].heading === "") {
    introLines = sections.shift().contentLines;
  }
  
  const cleanIntro = introLines.join('\n').trim();
  result.description = cleanIntro.split('\n\n')[0] || `Writeup for challenge ${result.title}`;
  if (result.description.length > 180) {
    const sentences = result.description.split(/[.!?]\s+/);
    if (sentences[0] && sentences[0].length > 15) {
      result.description = sentences[0] + '.';
    } else {
      result.description = result.description.slice(0, 177) + '...';
    }
  }
  result.problemDescription = cleanIntro;

  for (let sec of sections) {
    const heading = sec.heading.toLowerCase();
    const body = sec.contentLines.join('\n').trim();
    if (!body) continue;

    if (heading.includes('tool')) {
      const toolMatches = body.match(/[-*+]\s+`?([^`\r\n]+)`?/g);
      if (toolMatches) {
        result.tools = toolMatches.map(m => m.replace(/^[-*+]\s+`?|`?$/g, '').trim());
      } else {
        result.tools = body.split(/[\r\n,]+/).map(t => t.replace(/^[-*+\s]*|[*`\s]*$/g, '').trim()).filter(Boolean);
      }
    } else if (heading.includes('analis') || heading.includes('analysis') || heading.includes('enumer')) {
      result.analysis = body;
    } else if (heading.includes('lesson') || heading.includes('pelajaran') || heading.includes('takeaway')) {
      const items = body.split(/[\r\n]+/).map(l => l.replace(/^[-*+\s]*|[*`\s]*$/g, '').trim()).filter(Boolean);
      result.lessonsLearned = items;
    } else if (heading.includes('flag')) {
      result.flag = extractFlag(body) || body.replace(/^[-*+:\s]*|[*`#\s]*$/g, '').trim();
    } else if (heading.includes('ringkasan') || heading.includes('summary')) {
      result.problemDescription = body;
    } else {
      const codeBlocks = [];
      const codeRegex = /```(?:[a-zA-Z0-9]*)\r?\n([\s\S]*?)```/g;
      let match;
      let stepContent = body;
      while ((match = codeRegex.exec(body)) !== null) {
        codeBlocks.push(match[1].trim());
      }
      
      stepContent = stepContent.replace(/```(?:[a-zA-Z0-9]*)\r?\n([\s\S]*?)```/g, '').trim();

      const step = {
        title: sec.heading,
        content: stepContent
      };
      if (codeBlocks.length > 0) {
        step.code = codeBlocks[0];
      }
      result.solution.push(step);
    }
  }

  if (!result.flag) {
    result.flag = extractFlag(mdContent) || "";
  }

  return result;
}

// ─── MAIN ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║                CTF Writeup Importer                  ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`  Mode Parser: ${PARSER_MODE.toUpperCase()}`);
  if (PARSER_MODE === 'gemini') {
    console.log(`  Model AI:    ${GEMINI_MODEL}`);
  }
  console.log('');

  // Load existing IDs and dynamic EVENT_NAMES mappings from per-event files
  const existingIds = new Set();

  // Read all event files in the events directory
  const eventFiles = fs.existsSync(EVENTS_DIR)
    ? fs.readdirSync(EVENTS_DIR).filter(f => f.endsWith('.ts'))
    : [];

  for (const eventFile of eventFiles) {
    const filePath = path.join(EVENTS_DIR, eventFile);
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Parse existing writeups to dynamically map ID prefix -> ctfName
    const writeupBlocks = fileContent.split(/},\s*\n*\s*{/);
    for (const block of writeupBlocks) {
      const idMatch = block.match(/"id":\s*"([^"]+)"/);
      const ctfNameMatch = block.match(/"ctfName":\s*"([^"]+)"/);
      if (idMatch && ctfNameMatch) {
        const id = idMatch[1];
        const ctfName = ctfNameMatch[1];
        const eventFolder = id.split('-')[0].toLowerCase();
        if (eventFolder && !EVENT_NAMES[eventFolder]) {
          EVENT_NAMES[eventFolder] = ctfName;
        }
        existingIds.add(id);
      }
    }
  }

  // Interactive menu if no args passed
  if (!HAS_CLI_ARGS) {
    console.log('Pilih Mode Parser:');
    console.log('  [1] Local Parser (Regex / Offline - Instan & Tanpa Limit) [Rekomendasi]');
    console.log('  [2] Gemini AI Parser (Membutuhkan API Key)');
    console.log('');
    const parserAns = await askQuestion('Pilih mode parser (1/2, default 1): ');
    PARSER_MODE = parserAns === '2' ? 'gemini' : 'local';
    console.log(`[+] Mode Parser terpilih: ${PARSER_MODE.toUpperCase()}`);
    console.log('');
    const folders = fs.readdirSync(WRITEUPS_BASE_DIR).filter(item => {
      if (item.startsWith('.')) return false;
      if (['node_modules', 'dist'].includes(item)) return false;
      return fs.statSync(path.join(WRITEUPS_BASE_DIR, item)).isDirectory();
    });

    console.log('Daftar event folder yang ditemukan:');
    folders.forEach((f, i) => {
      const displayName = getCtfDisplayName(f);
      console.log(`  [${String(i + 1).padStart(2, ' ')}] ${f.padEnd(20)} -> ${displayName}`);
    });
    console.log('  [ A] Scan All Folders');
    console.log('  [ C] Custom Folder/Path');
    console.log('');

    while (true) {
      const ans = await askQuestion('Pilih opsi (nomor/A/C): ');
      const upper = ans.toUpperCase();
      if (upper === 'A') {
        console.log('[+] Mode: Scan Semua Folder');
        break;
      }
      if (upper === 'C') {
        CUSTOM_PATH = await askQuestion('Masukkan nama folder kustom atau path absolut: ');
        console.log(`[+] Mode: Scan kustom di "${CUSTOM_PATH}"`);
        break;
      }
      const idx = parseInt(ans, 10);
      if (!isNaN(idx) && idx >= 1 && idx <= folders.length) {
        EVENT_FILTER = folders[idx - 1].toLowerCase();
        console.log(`[+] Mode: Scan event folder "${folders[idx - 1]}"`);
        break;
      }
      console.log('[-] Pilihan tidak valid, coba lagi.');
    }

    const reprocessAns = await askQuestion('Apakah ingin memproses ulang writeup yang sudah ada? (y/N): ');
    REPROCESS = reprocessAns.toLowerCase() === 'y';

    const dryRunAns = await askQuestion('Jalankan dalam mode Dry Run (tidak menyimpan perubahan)? (y/N): ');
    DRY_RUN = dryRunAns.toLowerCase() === 'y';
    console.log('');
  }

  console.log(`  Mode:  ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'} | ${REPROCESS ? 'Reprocess all' : 'Skip existing'}`);
  console.log('');
  if (!REPROCESS) {
    console.log(`[i] Existing writeups: ${existingIds.size}`);
  }

  // Determine base scan dir and folders
  let scanFolders = [];
  let baseScanDir = WRITEUPS_BASE_DIR;

  if (CUSTOM_PATH) {
    const isAbsolute = path.isAbsolute(CUSTOM_PATH);
    const fullPath = isAbsolute ? CUSTOM_PATH : path.join(WRITEUPS_BASE_DIR, CUSTOM_PATH);
    if (!fs.existsSync(fullPath)) {
      console.error(`[-] Path tidak ditemukan: ${fullPath}`);
      process.exit(1);
    }
    baseScanDir = path.dirname(fullPath);
    scanFolders = [path.basename(fullPath)];
  } else {
    scanFolders = fs.readdirSync(WRITEUPS_BASE_DIR).filter(item => {
      if (item.startsWith('.')) return false;
      if (['node_modules', 'dist'].includes(item)) return false;
      if (!fs.statSync(path.join(WRITEUPS_BASE_DIR, item)).isDirectory()) return false;
      if (EVENT_FILTER && item.toLowerCase() !== EVENT_FILTER) return false;
      return true;
    });
  }

  console.log(`[i] Scanning events: ${scanFolders.join(', ')}`);
  console.log('');

  const allEntries = [];
  for (const eventFolder of scanFolders) {
    const eventPath = path.join(baseScanDir, eventFolder);
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

    // Ask user dynamically for event name if folder is unknown and in interactive mode
    const lowerEvent = entry.eventFolder.toLowerCase();
    let ctfName = EVENT_NAMES[lowerEvent];
    if (!ctfName) {
      const autoName = getCtfDisplayName(entry.eventFolder);
      if (!HAS_CLI_ARGS) {
        console.log(`[?] Event folder "${entry.eventFolder}" belum terdaftar di EVENT_NAMES.`);
        const customName = await askQuestion(`    Saran nama display: "${autoName}"\n    Tekan Enter untuk menyetujui, atau ketik nama display baru: `);
        ctfName = customName || autoName;
        EVENT_NAMES[lowerEvent] = ctfName;
        console.log(`[+] Mapping baru disimpan untuk sesi ini: "${entry.eventFolder}" -> "${ctfName}"`);
        console.log('');
      } else {
        ctfName = autoName;
      }
    }

    console.log(`[${i + 1}/${toProcess.length}] Processing: ${id}`);

    const mdContent = fs.readFileSync(entry.readmePath, 'utf-8');
    const solverCode = entry.solver?.content || null;

    try {
      let writeup;
      if (PARSER_MODE === 'local') {
        writeup = parseReadmeLocal(mdContent, id, entry.eventFolder, entry.categoryFolder, entry.challengeFolder, category, ctfName, solverCode);
      } else {
        const prompt = buildPrompt(mdContent, entry.challengeFolder, category, ctfName, solverCode);
        const aiResponse = await callGemini(prompt);
        writeup = await parseAndHealAIResponse(aiResponse, id, entry.eventFolder, entry.categoryFolder, 1, mdContent, entry.challengeFolder, category, ctfName, solverCode);
      }

      // If solver was found but parser didn't add it, add it manually
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

      // Small delay to avoid rate limiting only in Gemini mode
      if (PARSER_MODE === 'gemini' && i < toProcess.length - 1) {
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

  // ─── Write helpers ───────────────────────────────────────────────────────

  /**
   * String-aware brace scanner.
   * Finds the index AFTER the closing } of the JSON object starting at `start`.
   * Ignores { and } that appear inside string literals (handles \" escapes).
   */
  function findObjectEnd(content, start) {
    let i = start;
    let depth = 0;
    let inString = false;

    while (i < content.length) {
      const ch = content[i];
      if (inString) {
        if (ch === '\\') { i += 2; continue; }   // skip escaped char
        if (ch === '"') inString = false;
      } else {
        if (ch === '"') { inString = true; }
        else if (ch === '{') { depth++; }
        else if (ch === '}') {
          depth--;
          if (depth === 0) return i + 1;
        }
      }
      i++;
    }
    return -1; // not found
  }

  /**
   * Validates a written event file by extracting the array literal and JSON-parsing it.
   * Logs a warning (but does NOT crash) if validation fails.
   */
  function validateEventFile(filePath, context = '') {
    try {
      const src = fs.readFileSync(filePath, 'utf-8');
      const arrayMatch = src.match(/=\s*(\[[\s\S]*\]);?\s*$/);
      if (!arrayMatch) { throw new Error('Could not find array literal'); }
      JSON.parse(arrayMatch[1]);
    } catch (e) {
      console.error(`  ⚠ VALIDATION FAILED ${context ? `(${context})` : ''}: ${path.basename(filePath)}`);
      console.error(`    ${e.message}`);
      console.error(`    File may be corrupt — check it manually before reloading the dev server.`);
    }
  }

  // Helper: convert ctfName → slug → filename (mirrors split-writeups.mjs logic)
  function ctfNameToSlug(ctfName) {
    return ctfName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }
  function slugToExportName(slug) {
    return slug.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase()) + 'Writeups';
  }

  /**
   * Fuzzy match: before creating a new file, check if any existing event file
   * is "close enough" to the candidate slug.
   *
   * Strategy — strip all non-alphanumeric from both sides, then check:
   *   1. Exact match:           "flagyard"    == "flagyard"      → match
   *   2. Existing is prefix:    "flagyardctf" starts "flagyard"  → match (use existing)
   *   3. Candidate is prefix:   "flagyard"    starts "flagyard2026" → match (use existing)
   *
   * Returns the existing file's slug if a match is found, otherwise null.
   */
  function findMatchingEventFile(candidateSlug) {
    const existingFiles = fs.existsSync(EVENTS_DIR)
      ? fs.readdirSync(EVENTS_DIR).filter(f => f.endsWith('.ts')).map(f => f.replace('.ts', ''))
      : [];

    // Raw = only alphanumeric, no separators
    const rawCandidate = candidateSlug.replace(/_/g, '');

    for (const existingSlug of existingFiles) {
      const rawExisting = existingSlug.replace(/_/g, '');

      if (
        rawCandidate === rawExisting ||                      // exact
        rawCandidate.startsWith(rawExisting) ||             // existing is a prefix (e.g. "flagyard" in "flagyardctf")
        rawExisting.startsWith(rawCandidate)                // candidate is a prefix (e.g. "flagyard" vs "flagyard2026")
      ) {
        if (existingSlug !== candidateSlug) {
          console.log(`  [~] Fuzzy match: "${candidateSlug}" → existing file "${existingSlug}.ts"`);
        }
        return existingSlug;
      }
    }
    return null; // no match → create new file
  }

  // Group imported writeups by ctfName
  const byEvent = {};
  for (const w of imported) {
    const name = w.ctfName || 'Unknown';
    if (!byEvent[name]) byEvent[name] = [];
    byEvent[name].push(w);
  }


  /**
   * Read an event .ts file and return:
   *   - prefix: everything before the array literal  (e.g. "import type...\n\nexport const ... = ")
   *   - items:  the parsed WriteUp array
   * Throws if the file cannot be parsed.
   */
  function readEventFile(filePath) {
    const src = fs.readFileSync(filePath, 'utf-8');
    // Match everything up to and including the "= " before the array
    const prefixMatch = src.match(/^([\s\S]*?=\s*)(\[[\s\S]*\]);?\s*$/);
    if (!prefixMatch) throw new Error(`Cannot locate array literal in ${path.basename(filePath)}`);
    const prefix = prefixMatch[1];
    const items = JSON.parse(prefixMatch[2]);
    return { prefix, items };
  }

  /** Serialize and write an event file back to disk. */
  function writeEventFile(filePath, prefix, items) {
    const content = prefix + JSON.stringify(items, null, 2) + ';\n';
    fs.writeFileSync(filePath, content, 'utf-8');
  }


  for (const [ctfName, wList] of Object.entries(byEvent)) {
    const rawSlug = ctfNameToSlug(ctfName);
    const slug = findMatchingEventFile(rawSlug) ?? rawSlug;
    const exportName = slugToExportName(slug);
    const eventFilePath = path.join(EVENTS_DIR, `${slug}.ts`);

    if (fs.existsSync(eventFilePath)) {
      // ── Read, parse, modify in-memory, rewrite ───────────────────────────
      let prefix, items;
      try {
        ({ prefix, items } = readEventFile(eventFilePath));
      } catch (e) {
        console.error(`  ✗ Could not parse ${slug}.ts: ${e.message}`);
        console.error(`    Skipping writes for ${ctfName} — fix the file manually first.`);
        continue;
      }

      for (const w of wList) {
        const existingIdx = items.findIndex(x => x.id === w.id);
        if (existingIdx !== -1) {
          if (REPROCESS) {
            items[existingIdx] = w;
            console.log(`  ↻ Updated: ${w.id}`);
          } else {
            console.log(`  [skip] Already exists: ${w.id}`);
          }
        } else {
          items.push(w);
          console.log(`  + Appended: ${w.id}`);
        }
      }

      if (!DRY_RUN) writeEventFile(eventFilePath, prefix, items);
      console.log(`[+] Saved ${wList.length} writeup(s) to writeups/events/${slug}.ts`);
    } else {
      // Create new event file
      const content = [
        `import type { WriteUp } from '../types';`,
        ``,
        `// ${ctfName} — ${wList.length} writeup${wList.length > 1 ? 's' : ''}`,
        `export const ${exportName}: WriteUp[] = ${JSON.stringify(wList, null, 2)};`,
        ``,
      ].join('\n');
      if (!DRY_RUN) {
        fs.mkdirSync(EVENTS_DIR, { recursive: true });
        fs.writeFileSync(eventFilePath, content, 'utf-8');
        // Update index.ts to include the new event
        if (fs.existsSync(INDEX_FILE_PATH)) {
          let indexContent = fs.readFileSync(INDEX_FILE_PATH, 'utf-8');
          const importLine = `import { ${exportName} } from './events/${slug}';`;
          const spreadLine = `  ...${exportName},`;
          if (!indexContent.includes(importLine)) {
            // Add import after last existing import
            indexContent = indexContent.replace(
              /(import \{[^}]+\} from '\..*';\n)(?!import)/,
              `$1${importLine}\n`
            );
            // Add spread inside the array
            indexContent = indexContent.replace(
              /export const writeups[^=]*= \[([\s\S]*?)\];/,
              (_, inner) => `export const writeups: WriteUp[] = [${inner}${spreadLine}\n];`
            );
            fs.writeFileSync(INDEX_FILE_PATH, indexContent, 'utf-8');
            console.log(`[+] Updated writeups/index.ts to include ${slug}`);
          }
        }
      }
      console.log(`[+] Created new event file: writeups/events/${slug}.ts (${wList.length} writeup(s))`);
    }
  }

  // Summary
  console.log('');
  console.log('╔══════════════════════════════╗');
  console.log('║          Summary             ║');
  console.log('╚══════════════════════════════╝');
  imported.forEach(w => {
    const ctf = w.ctfName || 'Unknown';
    const cat = w.category || 'Unknown';
    console.log(`  • ${ctf.padEnd(15)} [${cat.padEnd(10)}] ${w.title}`);
  });
  console.log('');
  console.log('[✓] Done! Refresh your dev server to see changes.');
}

main().catch(e => {
  console.error('[-] Fatal error:', e);
  process.exit(1);
});
