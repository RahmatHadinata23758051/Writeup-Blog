# CTF Writeup Authoring Guide

## Purpose

This website renders CTF writeups in a **krauq/GitBook-style** event page layout:

- **`ctfName`** becomes the left sidebar event entry.
- **`category`** becomes the `H2` section heading inside an event page.
- **`title`** becomes the `H3` challenge heading under its category.
- **`id`** becomes the stable anchor used for search results, TOC links, and direct URLs (`#/writeup/<id>`).

Each CTF event is displayed as **one long document page** with all challenges rendered inline, grouped by category. There are no separate pages per challenge.

---

## Source of Truth

All writeup data lives in a single file:

```
src/app/data/writeups.ts
```

The shared type definition is in:

```
src/app/data/writeupTypes.ts
```

A copyable template is available at:

```
src/app/data/writeupTemplate.ts
```

---

## How to Add a New CTF Event

You do **not** manually edit the sidebar or any config file.

To add a new CTF event, simply add at least one writeup with a new `ctfName` value:

```ts
ctfName: "DalCTF 2026"
```

The event will automatically appear in the left sidebar the next time the app renders.

---

## How to Add a New Challenge Writeup

1. Open `src/app/data/writeups.ts`
2. Copy the shape from `src/app/data/writeupTemplate.ts`
3. Paste it at the end of the `writeups` array
4. Fill in metadata (`id`, `title`, `ctfName`, `category`, etc.)
5. Fill in writeup sections (`description`, `analysis`, `solution`, etc.)
6. Run `npm run build` to verify TypeScript compiles
7. Check the dev server (`npm run dev`) to preview
8. Push to GitHub

---

## Required Fields

These fields **must** be present on every writeup:

| Field      | Description                                |
|------------|--------------------------------------------|
| `id`       | Unique stable identifier for anchors/links |
| `title`    | Challenge name as displayed in the page    |
| `ctfName`  | Event name used for sidebar grouping       |
| `category` | Category used for H2 section grouping      |

---

## Recommended Fields

These fields are optional but strongly recommended for a complete writeup:

| Field                | Description                              |
|----------------------|------------------------------------------|
| `difficulty`         | Easy, Medium, Hard, Insane, or Unknown   |
| `points`             | Challenge point value                    |
| `date`               | Date of the CTF event (YYYY-MM-DD)       |
| `author`             | Your name or team name                   |
| `tags`               | Searchable keyword tags                  |
| `description`        | Short TL;DR summary                      |
| `problemDescription` | Original challenge description           |
| `tools`              | List of tools used                       |
| `analysis`           | Thought process and initial observations |
| `solution`           | Step-by-step walkthrough                 |
| `terminalOutputs`    | Relevant terminal commands and outputs   |
| `flag`               | The captured flag                        |
| `lessonsLearned`     | Key takeaways and techniques learned     |

---

## ID Standard

Use the format:

```
eventslug-category-challengeslug
```

### Examples

```
gpnctf2026-misc-volatile-component
dalctf2026-misc-grafajitsu
ramctf-crypto-baby-rsa
htb-web-machine-name
```

### Rules

- **Lowercase only** — no uppercase characters
- **No spaces** — use hyphens as separators
- **Must be unique** across the entire writeups array
- **Do not change after publishing** — direct links and search depend on stable IDs

---

## Event Name Standard

Use consistent display names across all writeups for the same event.

### Good

```
GPNCTF 2026
DalCTF 2026
RAMCTF
VuwCTF 2025
```

### Bad (inconsistent variants)

```
GPNCTF2026      ← missing space
GPN CTF 2026    ← extra space in name
gpnctf 2026     ← wrong casing
```

Pick one canonical form and use it for all writeups under that event.

### CTFtime Event Matching & Local Cache

To match your local writeup events with CTFtime ranking metadata:
1. Keep the event names consistent.
2. When a CTF event ends, add the optional event result metadata under the `events` array inside `src/app/data/ctftimeProfile.ts`.
3. The matcher normalizes event names (lowercase, strips spaces, punctuation, and the letters `"ctf"`), so `"Lake CTF 2025"` and `"LakeCTF 2025"` match automatically. Still, keeping them identical avoids confusion.

---

## Category Standard

Use one of these recommended categories:

- Web
- Crypto
- Forensics
- Misc
- Reverse
- Pwn
- OSINT
- Hardware
- Blockchain

Categories create `H2` section headings inside event pages. Keep casing consistent — `Misc` and `misc` will create two separate sections.

---

## Writing Rules

- **`description`** should be a short TL;DR (1–2 sentences).
- **`problemDescription`** should preserve the original challenge text when possible.
- **`analysis`** should explain the thought process clearly.
- **`solution`** should be step-by-step with code and commands where relevant.
- **`terminalOutputs`** should only include relevant outputs, not full logs.
- **`flag`** can be visible for publicly solved challenges.
- **Never commit** private tokens, session cookies, API keys, or live credentials.
- **Avoid** dumping massive logs or unrelated output.
- **Keep commands reproducible** — include exact tool versions if behavior differs across versions.

---

## Example Writeup Object

```ts
{
  id: "dalctf2026-web-broken-auth",
  title: "Broken Auth",
  ctfName: "DalCTF 2026",
  category: "Web",
  difficulty: "Easy",
  points: 100,
  date: "2026-06-08",
  author: "rhnataiet23-art",
  tags: ["jwt", "authentication"],

  description: "JWT none algorithm bypass to access admin panel.",

  problemDescription: "A web application uses JWT for authentication. Find a way to access the admin dashboard.",

  tools: ["python", "jwt_tool", "burp-suite"],

  analysis: "The server accepts JWTs with the 'none' algorithm, meaning tokens can be forged without the secret key.",

  solution: [
    {
      title: "Step 1 - Inspect the JWT",
      content: "Decode the JWT from the cookie and observe the algorithm field.",
      code: "echo 'eyJ...' | base64 -d"
    },
    {
      title: "Step 2 - Forge admin token",
      content: "Change the algorithm to 'none' and the role to 'admin'.",
      code: "python3 -c \"import jwt; print(jwt.encode({'role':'admin'}, '', algorithm='none'))\""
    }
  ],

  terminalOutputs: [
    {
      command: "curl -H 'Cookie: token=...' https://target/admin",
      output: "Welcome admin! Flag: DalCTF{jwt_n0ne_bypass}"
    }
  ],

  flag: "DalCTF{jwt_n0ne_bypass}",

  lessonsLearned: "Always validate the JWT algorithm server-side. Never accept 'none' algorithm in production."
}
```

---

## Faster Authoring with Generator

Instead of manually copying the template, use the built-in generator to scaffold a new writeup:

```bash
npm run new:writeup -- --event "DalCTF 2026" --category "Misc" --title "GrafaJitsu" --difficulty "Medium" --points 500 --date "2026-06-07"
```

This prints a ready-to-paste TypeScript object with an auto-generated ID.

### Arguments

| Argument       | Required | Default     | Example            |
|----------------|----------|-------------|--------------------|
| `--event`      | Yes      | —           | `"DalCTF 2026"`    |
| `--title`      | Yes      | —           | `"GrafaJitsu"`     |
| `--category`   | No       | `Misc`      | `"Web"`            |
| `--difficulty`  | No       | `Medium`    | `"Hard"`           |
| `--points`     | No       | `0`         | `500`              |
| `--date`       | No       | today       | `"2026-06-07"`     |

### Workflow

1. Run the generator command above
2. Copy the printed object
3. Paste it into `src/app/data/writeups.ts` (at the end of the array)
4. Fill in the `TODO` fields with real content
5. Run `npm run validate:writeups` to check for issues
6. Run `npm run build` to verify TypeScript compiles
7. Preview with `npm run dev`
8. Push to GitHub

---

## Validating Writeups

Run the validation script to check for common authoring mistakes:

```bash
npm run validate:writeups
```

This checks for:

- Duplicate IDs
- IDs with spaces or uppercase characters
- Inconsistent `ctfName` variants (e.g. `"GPNCTF2026"` vs `"GPNCTF 2026"`)
- Inconsistent category casing (e.g. `"misc"` vs `"Misc"`)
- Remaining `TODO` markers in published data

Fix any reported issues before pushing.
