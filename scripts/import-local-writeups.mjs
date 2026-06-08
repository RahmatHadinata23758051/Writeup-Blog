import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const WRITEUPS_DIR = 'C:\\Users\\user\\Nata\\Blog-Writeup\\Writeup';
const WRITEUPS_FILE_PATH = path.resolve(__dirname, '../src/app/data/writeups.ts');

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
    'byuctf': 'BYUCTF'
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
  // Matches dalctf{...}, gpnctf{...}, flag{...}, etc.
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
  
  // Capitalize title words
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
    author: "rhnataiet23-art", // default
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
  
  // Try to parse H1 header for title
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

  // Parse markdown headers
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

  // Extracted intro/first paragraphs
  let introLines = [];
  if (sections.length > 0 && sections[0].heading === "") {
    introLines = sections.shift().contentLines;
  }
  
  const cleanIntro = introLines.join('\n').trim();
  result.description = cleanIntro.split('\n\n')[0] || `Writeup for challenge ${result.title}`;
  result.problemDescription = cleanIntro;

  // Process sub-sections
  for (let sec of sections) {
    const heading = sec.heading.toLowerCase();
    const body = sec.contentLines.join('\n').trim();
    if (!body) continue;

    if (heading.includes('tool')) {
      // Parse list items
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
      // General methodology step
      // Extract code blocks
      const codeBlocks = [];
      const codeRegex = /```(?:[a-zA-Z0-9]*)\r?\n([\s\S]*?)```/g;
      let match;
      let stepContent = body;
      while ((match = codeRegex.exec(body)) !== null) {
        codeBlocks.push(match[1].trim());
      }
      
      // Strip code blocks from stepContent for clean display text
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

  // Global search for flag if not found in heading
  if (!result.flag) {
    result.flag = extractFlag(mdContent) || "";
  }

  return result;
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
        
        // Find Readme.md (case insensitive)
        const files = fs.readdirSync(challengePath);
        const readmeFile = files.find(f => f.toLowerCase() === 'readme.md');

        if (readmeFile) {
          const readmePath = path.join(challengePath, readmeFile);
          const mdContent = fs.readFileSync(readmePath, 'utf-8');
          try {
            const parsed = parseReadme(mdContent, eventFolder, categoryFolder, challengeFolder);
            
            // Find any solver file (solve.py, solver.py, exploit.py, solve.sage, etc.)
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
          // No README at level 3 — look one level deeper (nested structure like GPNCTF)
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
                // Use challengeFolder as the challenge name (not subDir) for consistent IDs
                const parsed = parseReadme(mdContent, eventFolder, categoryFolder, challengeFolder);

                // Find solver file in subDir
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
                break; // Only take the first subfolder with a README
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
  console.log(`         Auto GitHub Writeup Importer Utility               `);
  console.log(`============================================================`);
  console.log(`[*] Scanning: ${WRITEUPS_DIR}`);

  const rawWriteups = scanLocalWriteups();
  console.log(`[+] Scanned ${rawWriteups.length} writeup folders from local repository.`);

  if (!fs.existsSync(WRITEUPS_FILE_PATH)) {
    console.error(`[-] Target writeups file not found at: ${WRITEUPS_FILE_PATH}`);
    process.exit(1);
  }

  // Load existing file to check for duplicate IDs
  const existingContent = fs.readFileSync(WRITEUPS_FILE_PATH, 'utf-8');
  
  // Extract existing IDs using regex
  const existingIds = new Set();
  const idRegex = /^\s*["']?id["']?\s*:\s*["']([^"']+)["']/gm;
  let match;
  while ((match = idRegex.exec(existingContent)) !== null) {
    existingIds.add(match[1]);
  }

  // Filter out duplicates
  const toImport = rawWriteups.filter(w => !existingIds.has(w.id));
  const duplicatesCount = rawWriteups.length - toImport.length;

  console.log(`[i] Existing database records: ${existingIds.size}`);
  console.log(`[i] Already imported / Duplicates skipped: ${duplicatesCount}`);

  if (toImport.length === 0) {
    console.log(`[+] No new writeups to import. Database is up to date!`);
    return;
  }

  console.log(`[*] Importing ${toImport.length} new writeup(s)...`);

  // Find target index to insert (right before the last '];')
  const lastArrayBracketIndex = existingContent.lastIndexOf('];');
  if (lastArrayBracketIndex === -1) {
    console.error(`[-] Could not locate closing array bracket '];' in: ${WRITEUPS_FILE_PATH}`);
    process.exit(1);
  }

  // Format new objects
  let importString = '';
  for (let i = 0; i < toImport.length; i++) {
    const w = toImport[i];
    // Pretty-print JSON object, convert double quote keys to unquoted for clean style if desired, or keep as is
    const formatted = JSON.stringify(w, null, 2);
    // Add leading comma if needed (if file didn't end with a comma before '];')
    const needsComma = i > 0 || !existingContent.trim().slice(0, lastArrayBracketIndex).endsWith(',');
    importString += `${needsComma ? ',' : ''}\n${formatted}`;
  }

  const updatedContent = 
    existingContent.slice(0, lastArrayBracketIndex) + 
    importString + 
    '\n' + 
    existingContent.slice(lastArrayBracketIndex);

  fs.writeFileSync(WRITEUPS_FILE_PATH, updatedContent, 'utf-8');
  console.log(`[+] Successfully imported ${toImport.length} writeups into: src/app/data/writeups.ts`);
  console.log(`[+] Verification check running...`);
}

main();
