import type { WriteUp } from '../types';

// INTECHFEST — 1 writeup
export const intechfestWriteups: WriteUp[] = [
  {
    "id": "2",
    "title": "Shaw",
    "category": "Crypto",
    "difficulty": "Hard",
    "points": 0,
    "date": "2025-12-28",
    "author": "CTF Team",
    "ctfName": "INTECHFEST",
    "description": "ElGamal encryption over LCG with Pohlig-Hellman and LLL lattice attack",
    "problemDescription": "Server runs ElGamal encryption using a Linear Congruential Generator (LCG) for random number generation. The server accepts a custom 512-bit prime modulus and uses a truncated LCG (256-bit output XORed with unknown constant) to generate ephemeral keys. Goal: Recover the initial seed and secret constant.",
    "tools": [
      "SageMath",
      "pwntools",
      "Python",
      "Pohlig-Hellman",
      "LLL Reduction"
    ],
    "analysis": "The challenge contains three critical vulnerabilities:\n\n1. Custom Prime Selection: Server accepts any prime from client, enabling smooth prime exploitation for Pohlig-Hellman DLP.\n\n2. Linear Structure: LCG has fully linear structure despite truncation, making it vulnerable to lattice attacks (LLL). The relationship S_i = A^i * S_0 + sum(A^j * B) can be expressed as system of linear equations.\n\n3. Modular Ambiguity: Seed is 512-bit but modulo is also 512-bit, creating multiple valid candidates (s, s+M) that must be verified.",
    "mathAnalysis": [
      {
        "title": "ElGamal Encryption Schema",
        "formula": "c_1 = G^r \\pmod{P}, \\quad c_2 = Y^r \\cdot m \\pmod{P}",
        "description": "Where c₁ is the ephemeral key and c₂ is the encrypted message",
        "variant": "highlight"
      },
      {
        "title": "LCG State Evolution",
        "formula": "S_i \\equiv A^i S_0 + \\sum_{j=0}^{i-1} A^j B \\pmod{M}",
        "description": "The state at iteration i can be expressed as a linear combination of initial seed and parameters",
        "variant": "default"
      },
      {
        "title": "Output Truncation",
        "formula": "r_i = (S_{i+1} \\gg 256) \\oplus c",
        "description": "Top 256 bits are removed (right shift), result XORed with unknown constant c",
        "variant": "default"
      },
      {
        "title": "Pohlig-Hellman Algorithm",
        "formula": "\\text{If } P-1 = \\prod p_i^{e_i} \\text{, then } \\log_G c_1 \\equiv \\sum r_i P_i^{-1} (P-1)/p_i^{e_i} \\pmod{P}",
        "description": "Recover exponent by solving DLP on each prime power factor separately",
        "variant": "default"
      }
    ],
    "solution": [
      {
        "title": "Generate Ultra-Smooth Prime",
        "content": "Create a 512-bit prime where P-1 = 2 × 3 × 5 × 7 × ... (product of small primes). This reduces DLP complexity from exp(sqrt(n)) to polynomial time."
      },
      {
        "title": "Extract LCG Parameters",
        "content": "Query server for LCG multiplier A, increment B, and generator G. These remain constant throughout."
      },
      {
        "title": "Recover r via Pohlig-Hellman",
        "content": "For each encryption, get c1 and solve discrete_log(c1, G) mod P using Pohlig-Hellman. This recovers the ephemeral exponent r used in that round."
      },
      {
        "title": "LLL Lattice Reduction",
        "content": "Build lattice from known/unknown parts of multiple r values. Each r_i = known_part XOR c_i. The linearity of LCG creates exploitable linear relationships. LLL finds short vectors containing unknown bits."
      },
      {
        "title": "Full Exploit Script",
        "content": "Final working exploit using ultra-smooth prime setup, Pohlig-Hellman discrete log, and LLL lattice reduction to recover the LCG seed.",
        "code": "from pwn import *\n\n# --- Konfigurasi ---\nHOST = 'gzcli.1pc.tf'\nPORT = 48785\n\ndef get_ultra_smooth_prime(bits):\n    \"\"\"Mencari prime p dimana p-1 hancur jadi faktor prima kecil (Pohlig-Hellman Speedrun)\"\"\"\n    base = 2\n    for p in primes(3, 300):\n        while (base * p).bit_length() < bits - 10:\n            base *= p\n    k = 1\n    while True:\n        p = base * k + 1\n        if p.bit_length() == bits and is_prime(p):\n            return int(p)\n        k += 1\n\ndef manual_solve_linear_congruence(a, b, m):\n    \"\"\"XGCD Solver untuk menghindari MemoryError\"\"\"\n    d, u, v = xgcd(a, m)\n    if b % d != 0: return []\n    x0 = (u * (b // d)) % (m // d)\n    solutions = []\n    step = m // d\n    for k in range(min(d, 1000)):\n        solutions.append(int(x0 + k * step))\n    return solutions\n\ndef solve():\n    io = remote(HOST, PORT)\n\n    # 1. Setup Modulus\n    P = get_ultra_smooth_prime(512)\n    M = P - 1\n    io.sendlineafter(b\"$ \", f\"setp {P}\".encode())\n    \n    # 2. Ambil Params\n    io.sendlineafter(b\"$ \", b\"params\")\n    io.recvuntil(b\"lcg.a        = 0x\")\n    A = int(io.recvline().strip(), 16)\n    io.recvuntil(b\"lcg.b        = 0x\")\n    B = int(io.recvline().strip(), 16)\n    io.sendlineafter(b\"$ \", b\"admin\")\n    io.recvuntil(b\"G=\")\n    G = int(io.recvline().strip())\n\n    # 3. Koleksi Sampel DLP\n    rs = []\n    num_samples = 7 \n    for i in range(num_samples):\n        io.sendlineafter(b\"$ \", b\"enc 1\")\n        io.recvuntil(b\"c1 = 0x\")\n        c1 = int(io.recvline().strip(), 16)\n        ri = discrete_log(Mod(c1, P), Mod(G, P))\n        rs.append(int(ri))\n\n    # 4. LLL Attack\n    known_parts = [(val >> 128) << 384 for val in rs]\n    dim = num_samples\n    lattice = Matrix(ZZ, dim + 1, dim + 1)\n    shift = 2**384\n    \n    pow_A = [1]\n    const_B = [0]\n    for i in range(1, dim):\n        pow_A.append((pow_A[-1] * A) % M)\n        const_B.append((const_B[-1] * A + B) % M)\n\n    for i in range(1, dim):\n        lattice[i, i] = M\n        lattice[0, i] = pow_A[i]\n        target = (pow_A[i] * known_parts[0] + const_B[i] - known_parts[i]) % M\n        lattice[dim, i] = target\n\n    lattice[0, 0] = 1\n    lattice[dim, dim] = shift\n    reduced = lattice.LLL()\n\n    found_s1 = None\n    for row in reduced:\n        e0_cand = int(row[0])\n        for cand in [e0_cand, -e0_cand]:\n            s1_p = (known_parts[0] + cand) % M\n            s2_p = (A * s1_p + B) % M\n            if (s2_p >> 384) == (rs[1] >> 128):\n                found_s1 = s1_p\n                break\n        if found_s1: break\n\n    # 5. Local Verification & Range Check\n    target_val = (found_s1 - B) % M\n    possible_s0 = manual_solve_linear_congruence(A, target_val, M)\n    \n    for s_base in possible_s0:\n        for s_cand in [s_base, s_base + M]:\n            if s_cand < 1 or s_cand >= 2**512: continue\n            s1_calc = (A * s_cand + B) % M\n            c_calc = (s1_calc >> 256) ^^ rs[0]\n            s2_calc = (A * s1_calc + B) % M\n            if ((s2_calc >> 256) ^^ c_calc) == rs[1]:\n                io.sendlineafter(b\"$ \", f\"guess {s_cand} {c_calc}\".encode())\n                print(io.recvall(timeout=2).decode())\n                return\n\nif __name__ == \"__main__\":\n    solve()"
      },
      {
        "title": "Verify & Submit Seed",
        "content": "Recover candidates from LLL. Check both s and s+M for modular ambiguity. Verify locally by generating subsequent LCG states, then submit to server."
      }
    ],
    "flag": "INTECHFEST{964114fd72f319375a5c7fb3081a02b7}",
    "lessonsLearned": "**Parameter Selection** - Never allow clients to choose cryptographic parameters (especially primes). Always use safe primes (p = 2q+1) from trusted sources.\n\n**LCG Weakness** - LCG (Linear Congruential Generator) is cryptographically broken. Linear structure enables lattice attacks (LLL) that recover the entire state.\n\n**Truncation** - Truncation alone doesn't guarantee security. The underlying generator must be cryptographically strong (use CTR-mode or ChaCha20 instead).\n\n**Pohlig-Hellman** - Pohlig-Hellman algorithm breaks discrete logarithm if p-1 has only small prime factors. Always use groups where p-1 has at least one large prime factor.\n\n**Key Recovery** - GCD-based techniques can recover keys when the same parameters are used across multiple ciphertexts. Avoid parameter reuse."
  }
];
