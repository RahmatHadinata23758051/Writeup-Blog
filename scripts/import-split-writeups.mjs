import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const WRITEUPS_DIR = 'C:\\Users\\user\\Nata\\Blog-Writeup\\Writeup';
const EVENTS_DIR = path.resolve(__dirname, '../src/app/data/writeups/events');
const INDEX_FILE_PATH = path.resolve(__dirname, '../src/app/data/writeups/index.ts');

// Helper to format event name cleanly
function formatEventName(folder) {
  const known = {
    'dalctf2026': 'DalCTF 2026',
    'gpnctf2026': 'GPNCTF 2026',
    'thcon2026': 'THCON 2026',
    'them2026': 'THEM 2026',
    'jerseyctf': 'JerseyCTF',
    'htb': 'HackTheBox',
    'tcp1p': 'TCP1P',
    'ritsec': 'RITSEC',
    'byuctf': 'BYUCTF',
    'nohacknoctf': 'NoHackNoCTF',
    'r3ctf': 'R3CTF'
  };

  const key = folder.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (known[key]) {
    return known[key];
  }

  // E.g. dalctf2026 -> DalCTF 2026
  let name = folder.replace(/([a-zA-Z]+)(\d+)/g, '$1 $2');
  name = name.split(/[-_ ]+/).map(w => {
    if (w.toLowerCase() === 'ctf') return 'CTF';
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');

  return name;
}

// Category normalization mapping
function mapCategory(folder) {
  const norm = folder.toLowerCase().trim();
  if (norm.startsWith('web')) return 'Web';
  if (norm.startsWith('crypto')) return 'Crypto';
  if (norm.startsWith('pwn')) return 'Pwn';
  if (norm.startsWith('rev') || norm.startsWith('reverse')) return 'Reverse';
  if (norm.startsWith('forensic')) return 'Forensics';
  if (norm.startsWith('misc')) return 'Misc';
  if (norm.startsWith('osint')) return 'OSINT';
  if (norm.startsWith('hardware')) return 'Hardware';
  if (norm.startsWith('blockchain')) return 'Blockchain';
  
  // Capitalize first letter as fallback
  return folder.charAt(0).toUpperCase() + folder.slice(1);
}

// Regex to extract flag format
function extractFlag(text) {
  const flagRegex = /[a-zA-Z0-9_-]+{[a-zA-Z0-9_!@#$%^&*()\-+=?|~. ]+}/;
  const match = text.match(flagRegex);
  return match ? match[0] : null;
}

function parseReadme(mdContent, eventFolder, categoryFolder, challengeFolder) {
  const category = mapCategory(categoryFolder);
  const eventName = formatEventName(eventFolder);
  const cleanTitle = challengeFolder
    .replace(/([A-Z])/g, ' $1') // insert spaces before caps
    .replace(/[-_]+/g, ' ')      // replace hyphens/underscores with space
    .trim();
  
  const defaultTitle = cleanTitle.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const id = `${eventFolder.toLowerCase()}-${categoryFolder.toLowerCase()}-${challengeFolder.toLowerCase()}`
    .replace(/[^a-z0-9-]/g, '');

  const result = {
    id,
    title: defaultTitle,
    category,
    difficulty: "Medium", // default
    points: 0, // default
    date: new Date().toISOString().slice(0, 10), // default
    author: "Nattt", // default
    ctfName: eventName,
    tags: [],
    description: "",
    problemDescription: "",
    tools: [],
    analysis: "",
    solution: [],
    terminalOutputs: [],
    flag: "",
    lessonsLearned: ""
  };

  const lines = mdContent.split(/\r?\n/);
  
  let titleFromHeader = "";
  for (let idx = 0; idx < Math.min(lines.length, 10); idx++) {
    const line = lines[idx];
    if (line.startsWith('# ')) {
      titleFromHeader = line.slice(2).trim();
      break;
    }
  }
  if (!titleFromHeader && lines.length > 0) {
    const firstLine = lines[0].trim();
    if (firstLine && !firstLine.startsWith('#') && firstLine.length < 100) {
      titleFromHeader = firstLine;
    }
  }
  if (titleFromHeader) {
    result.title = titleFromHeader
      .replace(/\s*-\s*Writeup/gi, '')
      .replace(/\s*Writeup\s*CTF:\s*/gi, '')
      .replace(/\s*CTF\s*Writeup:\s*/gi, '')
      .replace(/\s*Writeup/gi, '')
      .replace(/\s*\(NoHackNoCtf\s*-\s*Web\)/gi, '')
      .replace(/\s*\(NoHackNoCtf\)/gi, '')
      .replace(/^(newbie-crypto)$/gi, 'Newbie Crypto')
      .replace(/^(whois)$/gi, 'Whois')
      .trim();
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
      result.lessonsLearned = body;
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

function toSlug(ctfName) {
  return ctfName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function toExportName(slug) {
  return slug.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase()) + 'Writeups';
}

function scanLocalWriteups() {
  if (!fs.existsSync(WRITEUPS_DIR)) {
    console.error(`[-] Raw writeup directory not found at: ${WRITEUPS_DIR}`);
    process.exit(1);
  }

  const newWriteups = [];
  const events = fs.readdirSync(WRITEUPS_DIR).filter(item => {
    return fs.statSync(path.join(WRITEUPS_DIR, item)).isDirectory() && item !== '.git';
  });

  for (let eventFolder of events) {
    const eventPath = path.join(WRITEUPS_DIR, eventFolder);
    const categories = fs.readdirSync(eventPath).filter(item => {
      return fs.statSync(path.join(eventPath, item)).isDirectory();
    });

    for (let categoryFolder of categories) {
      const categoryPath = path.join(eventPath, categoryFolder);
      const challenges = fs.readdirSync(categoryPath).filter(item => {
        return fs.statSync(path.join(categoryPath, item)).isDirectory();
      });

      for (let challengeFolder of challenges) {
        const challengePath = path.join(categoryPath, challengeFolder);
        
        const files = fs.readdirSync(challengePath);
        const readmeFile = files.find(f => f.toLowerCase() === 'readme.md');

        if (readmeFile) {
          const readmePath = path.join(challengePath, readmeFile);
          const mdContent = fs.readFileSync(readmePath, 'utf-8');
          try {
            const parsed = parseReadme(mdContent, eventFolder, categoryFolder, challengeFolder);
            
            const solverFile = files.find(f => {
              const name = f.toLowerCase();
              return (name.startsWith('solve') || name.startsWith('exploit') || name.includes('solver') || name.includes('exploit')) &&
                     (name.endsWith('.py') || name.endsWith('.go') || name.endsWith('.sh') || name.endsWith('.sage') || name.endsWith('.js') || name.endsWith('.rb'));
            });

            if (solverFile) {
              const solverPath = path.join(challengePath, solverFile);
              const solverContent = fs.readFileSync(solverPath, 'utf-8').trim();
              if (solverContent) {
                const hasSolverStep = parsed.solution.some(s => 
                  s.code && s.code.trim() === solverContent.trim()
                );
                if (!hasSolverStep) {
                  parsed.solution.push({
                    title: "Solver Script",
                    content: `The complete exploit/solver script (${solverFile}) is provided below:`,
                    code: solverContent
                  });
                }
              }
            }

            newWriteups.push(parsed);
          } catch (e) {
            console.warn(`[!] Failed to parse: ${readmePath} - ${e.message}`);
          }
        } else {
          const subDirs = files.filter(item => {
            try { return fs.statSync(path.join(challengePath, item)).isDirectory(); } catch { return false; }
          });

          for (let subDir of subDirs) {
            const subPath = path.join(challengePath, subDir);
            const subFiles = fs.readdirSync(subPath);
            const subReadme = subFiles.find(f => f.toLowerCase() === 'readme.md');

            if (subReadme) {
              const readmePath = path.join(subPath, subReadme);
              const mdContent = fs.readFileSync(readmePath, 'utf-8');
              try {
                const parsed = parseReadme(mdContent, eventFolder, categoryFolder, challengeFolder);

                const solverFile = subFiles.find(f => {
                  const name = f.toLowerCase();
                  return (name.startsWith('solve') || name.startsWith('exploit') || name.includes('solver') || name.includes('exploit')) &&
                         (name.endsWith('.py') || name.endsWith('.go') || name.endsWith('.sh') || name.endsWith('.sage') || name.endsWith('.js') || name.endsWith('.rb'));
                });

                if (solverFile) {
                  const solverPath = path.join(subPath, solverFile);
                  const solverContent = fs.readFileSync(solverPath, 'utf-8').trim();
                  if (solverContent) {
                    const hasSolverStep = parsed.solution.some(s =>
                      s.code && s.code.trim() === solverContent.trim()
                    );
                    if (!hasSolverStep) {
                      parsed.solution.push({
                        title: "Solver Script",
                        content: `The complete exploit/solver script (${solverFile}) is provided below:`,
                        code: solverContent
                      });
                    }
                  }
                }

                newWriteups.push(parsed);
                break;
              } catch (e) {
                console.warn(`[!] Failed to parse: ${readmePath} - ${e.message}`);
              }
            }
          }
        }
      }
    }
  }

  return newWriteups;
}

function main() {
  console.log(`============================================================`);
  console.log(`         Auto GitHub Writeup Importer (Split Event Mode)    `);
  console.log(`============================================================`);
  console.log(`[*] Scanning: ${WRITEUPS_DIR}`);

  const rawWriteups = scanLocalWriteups();
  console.log(`[+] Scanned ${rawWriteups.length} writeup folders from local repository.`);

  // Group by event name
  const byEvent = {};
  for (const w of rawWriteups) {
    const ctfName = w.ctfName;
    if (!byEvent[ctfName]) {
      byEvent[ctfName] = [];
    }
    byEvent[ctfName].push(w);
  }

  // Process each event separately
  for (const [ctfName, list] of Object.entries(byEvent)) {
    const slug = toSlug(ctfName);
    const exportName = toExportName(slug);
    const eventFilePath = path.join(EVENTS_DIR, `${slug}.ts`);

    let existingWriteups = [];
    if (fs.existsSync(eventFilePath)) {
      const content = fs.readFileSync(eventFilePath, 'utf-8');
      const arrayMatch = content.match(/export const \w+: WriteUp\[\] = (\[[\s\S]*\]);?\s*$/);
      if (arrayMatch) {
        try {
          existingWriteups = JSON.parse(arrayMatch[1]);
        } catch (e) {
          console.warn(`[!] Failed to parse existing JSON in ${eventFilePath}: ${e.message}`);
        }
      }
    }

    const existingIds = new Set(existingWriteups.map(w => w.id));
    const toAdd = list.filter(w => !existingIds.has(w.id));

    if (toAdd.length === 0) {
      console.log(`[+] Event "${ctfName}": No new writeups to import.`);
      continue;
    }

    const merged = [...existingWriteups, ...toAdd];
    const fileContent = [
      `import type { WriteUp } from '../types';`,
      ``,
      `// ${ctfName} — ${merged.length} writeup${merged.length > 1 ? 's' : ''}`,
      `export const ${exportName}: WriteUp[] = ${JSON.stringify(merged, null, 2)};`,
      ``,
    ].join('\n');

    fs.mkdirSync(path.dirname(eventFilePath), { recursive: true });
    fs.writeFileSync(eventFilePath, fileContent, 'utf-8');
    console.log(`[+] Event "${ctfName}": Imported ${toAdd.length} new writeup(s). Total: ${merged.length}`);
  }

  // Re-generate index.ts
  console.log(`[*] Re-generating writeups/index.ts...`);
  const eventFiles = fs.readdirSync(EVENTS_DIR).filter(f => f.endsWith('.ts'));
  const eventMeta = [];

  for (const file of eventFiles) {
    const slug = file.slice(0, -3);
    const exportName = toExportName(slug);
    const filePath = path.join(EVENTS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Find CTF name in comments
    const nameMatch = content.match(/\/\/ (.*?) — \d+ writeup/);
    const ctfName = nameMatch ? nameMatch[1] : slug;
    eventMeta.push({ slug, exportName, ctfName });
  }

  // Sort alphabetically by ctfName
  eventMeta.sort((a, b) => a.ctfName.localeCompare(b.ctfName));

  const imports = eventMeta
    .map(({ slug, exportName }) => `import { ${exportName} } from './events/${slug}';`)
    .join('\n');

  const spread = eventMeta
    .map(({ exportName }) => `  ...${exportName},`)
    .join('\n');

  const indexContent = [
    `// Auto-generated by scripts/import-split-writeups.mjs`,
    `// DO NOT edit manually — add new writeups to the event files in ./events/`,
    ``,
    imports,
    ``,
    `export type { WriteUp, Category, Difficulty, MathFormula, TerminalOutput } from './types';`,
    ``,
    `export const writeups: WriteUp[] = [`,
    spread,
    `];`,
    ``,
  ].join('\n');

  fs.writeFileSync(INDEX_FILE_PATH, indexContent, 'utf-8');
  console.log(`[+] Re-generated: ${INDEX_FILE_PATH}`);
}

main();
