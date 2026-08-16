import type { WriteUp } from "../types";

export const hacktheboxWriteups: WriteUp[] = [
  {
    "id": "17",
    "title": "MadMath",
    "category": "Crypto",
    "difficulty": "Hard",
    "points": 0,
    "date": "2026-03-20",
    "author": "CTF Team",
    "ctfName": "HackTheBox",
    "description": "Advanced cryptography challenge combining RSA key recovery, Elliptic Curve parameter reconstruction, and Oracle-assisted Pohlig-Hellman attack with optimized BSGS.",
    "problemDescription": "MadMath adalah tantangan kriptografi tingkat lanjut yang mensimulasikan protokol enkripsi khusus. Tantangan ini menguji pemahaman terhadap tiga lapis kerentanan: kelemahan pada RSA Key Generation, pemulihan parameter Elliptic Curve secara aljabar, dan eksploitasi Discrete Logarithm Problem (DLP) pada grup perkalian menggunakan kombinasi Oracle-assisted Pohlig-Hellman dan Baby-step Giant-step (BSGS).",
    "tools": [
      "SageMath",
      "pwntools",
      "Python",
      "Pohlig-Hellman Attack",
      "BSGS Algorithm",
      "ECM Factorization",
      "Chinese Remainder Theorem",
      "Elliptic Curve Cryptography"
    ],
    "analysis": "Sistem enkripsi pada MadMath memiliki celah di setiap tahapan pembuatannya. Berikut adalah bongkar pasang matematis dari skenario serangan ini:\n\nTahap 1: RSA Modulus Recovery via ECM\nServer memberikan nilai eksponen privat d dan ciphertext c, tetapi menyembunyikan modulus n. Berdasarkan standar RSA, hubungan antara e dan d didefinisikan sebagai: e·d ≡ 1 (mod φ(n)). Artinya, terdapat sebuah bilangan bulat k sedemikian rupa sehingga e·d - 1 = k·φ(n). Karena e = 65537 bernilai kecil, kita bisa mengiterasi nilai k dari 1 hingga e untuk mencari nilai pasti dari φ(n).\n\nDari source code, kita mengetahui konstruksi φ(n): φ(n) = (p-1)(q-1) = (a²·g)·(b²·g) = a²·b²·g². Bentuk a²·b²·g² memastikan bahwa φ(n) adalah sebuah bilangan kuadrat sempurna. Dengan menarik akar kuadratnya, kita mendapatkan sebuah nilai S: S = √φ(n) = a·b·g.\n\nKelemahan fatal terletak pada fungsi FactorWalker yang membatasi ukuran prima pembentuk a, b, dan g maksimal hanya 70-bit. Nilai S dapat dengan mudah difaktorkan menjadi prima-prima penyusunnya menggunakan algoritma Lenstra Elliptic Curve Factorization (ECM). Setelah faktor didapat, kita mendistribusikannya kembali untuk memulihkan nilai p dan q, menghitung n = p·q, lalu mendekripsi passphrase serta AES Key.\n\nTahap 2: Elliptic Curve Parameter Recovery\nDengan AES Key di tangan, kita bisa mendekripsi output heksadesimal dari Oracle untuk mendapatkan titik koordinat P = (x, y). Namun, parameter kurva tersebut disembunyikan. Sebuah kurva eliptik pada medan berhingga didefinisikan oleh persamaan Weierstrass: y² ≡ x³ + ax + b (mod p).\n\nDengan melakukan query ke Oracle menggunakan eksponen 2, 3, dan 4, kita memperoleh tiga titik valid: P₂(x₂, y₂), P₃(x₃, y₃), dan P₄(x₄, y₄). Dengan mengurangkan persamaan-persamaan tersebut, kita dapat mengeliminasi parameter a dan b, menyisakan persamaan di mana selisihnya adalah kelipatan dari modulus p.\n\nNilai modulus kurva p didapatkan dengan menghitung Greatest Common Divisor (GCD) dari kombinasi titik-titik tersebut. Selanjutnya, parameter a dan b dapat dicari secara aljabar murni.\n\nTahap 3: The Multiplicative Group DLP\nSkenario ini memiliki sebuah jebakan (rabbit hole). Kurva yang digunakan memiliki orde grup N di mana N adalah bilangan prima 256-bit yang kokoh, sehingga serangan ECDLP murni tidak mungkin dilakukan.\n\nNamun, perhatikan bagaimana Oracle menghitung titik enkripsinya: P_enc = (FLAG^exp mod g_order)·G. Celah sesungguhnya bukanlah memecahkan logaritma diskrit pada titik kurva eliptik, melainkan DLP pada grup perkalian modulo g_order. Kita ingin mencari skalar s sedemikian rupa sehingga s·G = P_enc.\n\nKarena skalar operasi ini dieksekusi modulo g_order, masalah logaritma diskrit berada pada ruang grup Z_g_order¹. Jika kita memfaktorkan g_order - 1, nilainya ternyata sangat smooth dengan faktor primanya kecil-kecil (terbesar ≈ 4 × 10⁸). Kondisi ini sangat rentan terhadap serangan Pohlig-Hellman.\n\nUntuk mempercepat komputasi pada faktor prima terbesar, pencarian linear O(q) harus ditingkatkan menggunakan optimasi Baby-step Giant-step (BSGS), yang memangkas kompleksitas waktu menjadi O(√q). Operasi yang tadinya membutuhkan ≈ 400.000.000 iterasi berkurang drastis menjadi hanya ≈ 20.000 iterasi. Terakhir, sisa-sisa perhitungan disatukan menggunakan Chinese Remainder Theorem (CRT) untuk mengekstrak FLAG secara utuh.",
    "mathAnalysis": [
      {
        "title": "RSA Key Relationship",
        "formula": "e \\cdot d - 1 = k \\cdot \\phi(n), \\quad \\text{where } e = 65537",
        "description": "Finding φ(n) by iterating k from 1 to e",
        "variant": "highlight"
      },
      {
        "title": "Perfect Square Structure",
        "formula": "\\phi(n) = a^2 \\cdot b^2 \\cdot g^2 \\implies S = \\sqrt{\\phi(n)} = a \\cdot b \\cdot g",
        "description": "The construct ensures φ(n) is a perfect square",
        "variant": "default"
      },
      {
        "title": "Elliptic Curve Equation",
        "formula": "y^2 \\equiv x^3 + ax + b \\pmod{p}",
        "description": "Weierstrass form for arbitrary point recovery",
        "variant": "default"
      },
      {
        "title": "Parameter Elimination",
        "formula": "N_1 \\cdot D_2 - N_2 \\cdot D_1 \\equiv 0 \\pmod{p}",
        "description": "GCD of point differences yields the modulus p",
        "variant": "default"
      },
      {
        "title": "Pohlig-Hellman Complexity",
        "formula": "\\text{If } g\\_order - 1 = \\prod p_i^{e_i}, \\text{ then } O(\\sqrt{p_{max}}) \\text{ via BSGS}",
        "description": "Reduce linear search to square-root time with Baby-step Giant-step",
        "variant": "highlight"
      }
    ],
    "solution": [
      {
        "title": "Stage 1: Recover φ(n) and Factor S",
        "content": "Connect to server and retrieve d and c. Iterate k from 1 to e=65537 to find φ(n) = (e·d - 1) / k. Take square root to get S, then use ECM factorization to recover prime factors a, b, g. Reconstruct p = a²·g + 1 and q = b²·g + 1, compute n = p·q, then decrypt passphrase and AES key."
      },
      {
        "title": "Stage 2: Recover Elliptic Curve Parameters",
        "content": "Query Oracle with exponents 2, 3, 4 to get three points on the curve. Decrypt using AES-ECB with recovered key. Extract coordinates and use algebraic elimination (GCD technique) to find curve modulus p. Then solve for parameters a and b using the Weierstrass equation."
      },
      {
        "title": "Stage 3: Setup Pohlig-Hellman Attack",
        "content": "Compute the order of the elliptic curve. Find a primitive root of the multiplicative group. Factor g_order - 1 to identify all prime power factors. The largest factor is approximately 4×10⁸, requiring optimization."
      },
      {
        "title": "Stage 4: Apply BSGS Optimization",
        "content": "For each prime power factor q^e, use lifting-the-exponent technique combined with Baby-step Giant-step algorithm. Instead of O(q) linear search, achieve O(√q) complexity. Build hashtable of baby steps, then perform giant steps to locate matches.",
        "code": "m = isqrt(q) + 1\nbaby_steps = {}\n# Baby step phase\ncurr_P = P_base\nfor v in range(m):\n    baby_steps[curr_P] = v\n    curr_P = B_scalar * curr_P\n\n# Giant step phase\nB_inv_m = pow(B_inv, m, g_order)\ncurr_Q = P_target\nfor u in range(m):\n    if curr_Q in baby_steps:\n        v = baby_steps[curr_Q]\n        j = u * m + v\n        return j\n    curr_Q = B_inv_m * curr_Q"
      },
      {
        "title": "Stage 5: Combine Results with CRT",
        "content": "After solving DLP for each prime power factor, use Chinese Remainder Theorem to combine the congruences x ≡ x_i (mod q_i^e_i) into a single solution x modulo the full g_order.",
        "code": "x_congruences = [x_mod_q1, x_mod_q2, ...]\nmoduli = [q1^e1, q2^e2, ...]\nx = crt(x_congruences, moduli)"
      },
      {
        "title": "Complete Exploit Script",
        "content": "Full working solver combining all stages with optimizations:",
        "code": "from pwn import *\nfrom Crypto.Util.number import *\nfrom Crypto.Cipher import AES\nfrom Crypto.Util.Padding import unpad\nimport hashlib\nfrom collections import Counter\n\ncontext.log_level = 'error'\n\ndef solve():\n    print(\"[*] Menghubungkan ke server...\")\n    io = remote(\"154.57.164.74\", 32526)\n\n    # 1. Parsing d dan c\n    io.recvuntil(b\"d = \")\n    d = int(io.recvline().strip())\n    io.recvuntil(b\"c = \")\n    c = int(io.recvline().strip())\n    print(\"[+] Berhasil mendapatkan parameter d dan c dari server.\")\n\n    # 2. Mencari phi(n)\n    print(\"[*] Tahap 1: Mencari phi(n)...\")\n    e = 65537\n    ed_minus_1 = e * d - 1\n    phi = None\n    for k in range(1, e + 1):\n        if ed_minus_1 % k == 0:\n            p_cand = ed_minus_1 // k\n            if isqrt(p_cand)**2 == p_cand:\n                phi = p_cand\n                break\n\n    # 3. Faktorisasi S menggunakan ECM\n    S = isqrt(phi)\n    print(\"[*] Memfaktorkan S dengan ECM...\")\n    factors = ecm.factor(S)\n    print(f\"[+] Faktor ditemukan: {factors}\")\n\n    # 4. Pencarian a, b, g\n    def solve_abg(factors_list):\n        counts = Counter(factors_list)\n        unique_factors = list(counts.keys())\n\n        def search(idx, a, b, g):\n            if idx == len(unique_factors):\n                p_test = a**2 * g + 1\n                q_test = b**2 * g + 1\n                if is_prime(p_test) and is_prime(q_test):\n                    return a, b, g\n                return None\n            p_factor = unique_factors[idx]\n            max_count = counts[p_factor]\n            for i in range(max_count + 1):\n                for j in range(max_count + 1 - i):\n                    if i > 0 and j > 0: continue\n                    k = max_count - i - j\n                    res = search(idx + 1, a * (p_factor**i), b * (p_factor**j), g * (p_factor**k))\n                    if res: return res\n            return None\n        return search(0, 1, 1, 1)\n\n    res = solve_abg(factors)\n    a, b, g_val = res\n    p = a**2 * g_val + 1\n    q = b**2 * g_val + 1\n    n = p * q\n\n    # 5. Ekstrak Passphrase & AES Key\n    m = pow(c, int(d), int(n))\n    PASSPHRASE = long_to_bytes(int(m)).decode()\n    print(f\"[+] PASSPHRASE: {PASSPHRASE}\")\n    KEY = hashlib.sha256(PASSPHRASE.encode()).digest()\n\n    # 6. Tahap 2: Oracle Elliptic Curve\n    print(\"\\n[*] Tahap 2: Berinteraksi dengan Oracle...\")\n    def get_point(exp):\n        io.sendlineafter(b\"Give me an exponent: \", str(exp).encode())\n        enc_hex = io.recvline().strip().decode()\n        cipher = AES.new(KEY, AES.MODE_ECB)\n        dec = unpad(cipher.decrypt(bytes.fromhex(enc_hex)), 16).decode()\n        dec = dec.strip(\"()\")\n        x_str, y_str = dec.split(\",\")\n        return int(x_str), int(y_str)\n\n    X2, Y2 = get_point(2)\n    X3, Y3 = get_point(3)\n    X4, Y4 = get_point(4)\n\n    Gx, Gy = 40733212845287381659537354559134076551920727536123123802035255333770142251507, 5939195932044123182011708420242714254691399994280021264443261849355562421816\n\n    # 7. Memulihkan Parameter Kurva\n    N1 = Gy**2 - Y2**2 - (Gx**3 - X2**3)\n    D1 = Gx - X2\n    N2 = Y2**2 - Y3**2 - (X2**3 - X3**3)\n    D2 = X2 - X3\n    K1 = N1 * D2 - N2 * D1\n\n    N3 = Y3**2 - Y4**2 - (X3**3 - X4**3)\n    D3 = X3 - X4\n    K2 = N2 * D3 - N3 * D2\n\n    curve_p = gcd(K1, K2)\n    print(f\"[+] curve_p ditemukan: {curve_p}\")\n\n    curve_a = ((Gy**2 - Y2**2 - (Gx**3 - X2**3)) * inverse_mod(Gx - X2, curve_p)) % curve_p\n    curve_b = (Gy**2 - Gx**3 - curve_a * Gx) % curve_p\n\n    E = EllipticCurve(GF(curve_p), [curve_a, curve_b])\n    G = E(Gx, Gy)\n    g_order = E.order()\n\n    # 8. Pohlig-Hellman with BSGS\n    print(\"\\n[*] Tahap 3: Menjalankan Pohlig-Hellman (BSGS Optimized)...\")\n    print(\"[*] Memfaktorkan (g_order - 1)...\")\n    factors_g = factor(g_order - 1)\n    print(f\"[+] g_order - 1 = {factors_g}\")\n\n    # Primitive root\n    g_prim = None\n    for cand in primes(2, 100):\n        is_primitive = True\n        for q, _ in factors_g:\n            if pow(cand, (g_order - 1) // q, g_order) == 1:\n                is_primitive = False\n                break\n        if is_primitive:\n            g_prim = cand\n            break\n\n    x_congruences = []\n    moduli = []\n\n    for q, e in factors_g:\n        print(f\"[*] Solving for {q}^{e}...\")\n        q_power = q**e\n        known_x = 0\n\n        for i in range(e):\n            exp_query = (g_order - 1) // (q**(i + 1))\n            io.sendlineafter(b\"Give me an exponent: \", str(exp_query).encode())\n            enc_hex = io.recvline().strip().decode()\n            cipher = AES.new(KEY, AES.MODE_ECB)\n            dec = unpad(cipher.decrypt(bytes.fromhex(enc_hex)), 16).decode()\n            dec = dec.strip(\"()\")\n            x_str, y_str = dec.split(\",\")\n            P_target = E(int(x_str), int(y_str))\n\n            step = (g_order - 1) // q\n            A_scalar = pow(int(g_prim), int(known_x * exp_query), int(g_order))\n            B_scalar = pow(int(g_prim), int(step), int(g_order))\n\n            P_base = int(A_scalar) * G\n            m = int(isqrt(q)) + 1\n            baby_steps = {}\n\n            curr_P = P_base\n            for v in range(m):\n                baby_steps[curr_P] = v\n                curr_P = int(B_scalar) * curr_P\n\n            B_inv = inverse_mod(int(B_scalar), int(g_order))\n            B_inv_m = pow(int(B_inv), m, int(g_order))\n            curr_Q = P_target\n\n            for u in range(m):\n                if curr_Q in baby_steps:\n                    v = baby_steps[curr_Q]\n                    j = u * m + v\n                    known_x += j * (q**i)\n                    break\n                curr_Q = int(B_inv_m) * curr_Q\n\n        x_congruences.append(known_x)\n        moduli.append(q_power)\n        print(f\"    [+] x ≡ {known_x} (mod {q_power})\")\n\n    # 9. CRT\n    print(\"\\n[*] Menjahit hasil dengan CRT...\")\n    x = crt(x_congruences, moduli)\n    FLAG_int = pow(int(g_prim), int(x), int(g_order))\n\n    print(\"\\n[🎉] FLAG:\")\n    print(long_to_bytes(int(FLAG_int)).decode())\n\n    io.close()\n\nif __name__ == \"__main__\":\n    solve()"
      }
    ],
    "terminalOutputs": [
      {
        "command": "sage solve.sage",
        "output": "[*] Menghubungkan ke server...\n[+] Berhasil mendapatkan parameter d dan c dari server.\n[*] Tahap 1: Mencari phi(n)...\n[*] Memfaktorkan S dengan ECM (tunggu beberapa detik)...\n[+] Faktor ditemukan: [2, 3, 86928912623171, 213787377563519821, 217782665365747543, 655446963345076210631, 662765709558331559309, 861237803832676067153, 949714727183321757223, 1331640498435948271387]\n[+] PASSPHRASE: Korea <3 Discrete Logarithm Problems\n\n[*] Tahap 2: Berinteraksi dengan Oracle Elliptic Curve...\n[+] curve_p ditemukan: 60848817910369111880334871105011015293762638801805685625660812011580778435781\n\n[*] Tahap 3: Menjalankan Oracle-assisted Pohlig-Hellman (Optimized BSGS)...\n[*] Memfaktorkan (g_order - 1)... (harap tunggu sebentar)\n[+] g_order - 1 = 2^2 * 7^4 * 29 * 47 * 4909 * 6991^2 * 21821 * 101411^2 * 766079 * 1325227 * 3686341 * 138827527 * 407639629^2\n[*] Mencari primitive root...\n[+] Primitive root g = 2\n\n[*] Memulai pencarian logaritma diskrit via BSGS (Sangat Cepat!)...\n[*] Menyelesaikan untuk sub-grup dengan faktor 2^2 ...\n    [+] Didapat x = 1 mod 4\n[*] Menyelesaikan untuk sub-grup dengan faktor 7^4 ...\n    [+] Didapat x = 1312 mod 2401\n[*] Menyelesaikan untuk sub-grup dengan faktor 29^1 ...\n    [+] Didapat x = 9 mod 29\n[*] Menyelesaikan untuk sub-grup dengan faktor 47^1 ...\n    [+] Didapat x = 21 mod 47\n[*] Menyelesaikan untuk sub-grup dengan faktor 4909^1 ...\n    [+] Didapat x = 3093 mod 4909\n[*] Menyelesaikan untuk sub-grup dengan faktor 6991^2 ...\n    [+] Didapat x = 44439674 mod 48874081\n[*] Menyelesaikan untuk sub-grup dengan faktor 21821^1 ...\n    [+] Didapat x = 605 mod 21821\n[*] Menyelesaikan untuk sub-grup dengan faktor 101411^2 ...\n    [+] Didapat x = 249977060 mod 10284190921\n[*] Menyelesaikan untuk sub-grup dengan faktor 766079^1 ...\n    [+] Didapat x = 751636 mod 766079\n[*] Menyelesaikan untuk sub-grup dengan faktor 1325227^1 ...\n    [+] Didapat x = 934634 mod 1325227\n[*] Menyelesaikan untuk sub-grup dengan faktor 3686341^1 ...\n    [+] Didapat x = 1363781 mod 3686341\n[*] Menyelesaikan untuk su-grup dengan faktor 138827527^1 ...\n    [+] Didapat x = 78893824 mod 138827527\n[*] Menyelesaikan untuk sub-grup dengan faktor 407639629^2 ...\n    [+] Didapat x = 14046441229636986 mod 166170067131257641\n\n[*] Menjahit potongan hasil dengan Chinese Remainder Theorem (CRT)...\n[+] Logaritma dari FLAG ditemukan: x = 23167429319002833280458444367972413240595227877404475285248913846196893299221\nFLAG BERHASIL DIDAPATKAN:\nHTB{m4th_m4st3r_0r_pur3_g3niu5?}"
      }
    ],
    "flag": "HTB{m4th_m4st3r_0r_pur3_g3niu5?}",
    "lessonsLearned": "**RSA Parameter Generation** - Custom RSA implementations must never use weak key generation. Ensuring p and q have specific algebraic structures (like a²g+1) creates exploitable patterns. Always use FIPS-approved key generation.\n\n**Small Prime Factors Enable Factorization** - ECM (Elliptic Curve Method) efficiently factors numbers with small prime factors. The 70-bit limit on factors makes complete factorization feasible. Always use cryptographically strong prime generation (no artificial constraints).\n\n**Curve Parameter Confidentiality** - Elliptic curve parameters (a, b, p) should not be recoverable from point samples. The algebraic elimination technique demonstrates how three carefully chosen points can leak the entire curve structure.\n\n**Smooth Orders Are Security Disasters** - A smooth g_order (where g_order - 1 has only small prime factors) is vulnerable to Pohlig-Hellman decomposition. Always verify that the group order has at least one prime factor with significant size (>2^100).\n\n**Oracle Queries Leak Information** - Providing oracle access to encryption under multiple exponents is dangerous. Each query potentially extracts cryptographic material. Minimize oracle interactions and randomize responses.\n\n**BSGS is Essential for Medium Primes** - When the group structure is decomposed to medium-sized prime powers (~10⁸), naive linear search becomes infeasible. Baby-step Giant-step reduces O(q) to O(√q), making what seemed impossible become practical.\n\n**Chinese Remainder Theorem Unifies Solutions** - CRT elegantly combines partial solutions from each prime power factor into the final answer. Understanding modular arithmetic at this level is critical for advanced cryptanalysis.\n\n**Layered Vulnerabilities Compound** - MadMath is hard not because any single vulnerability is extreme, but because three moderate vulnerabilities chain together. Security depends on every layer being strong."
  }
];
