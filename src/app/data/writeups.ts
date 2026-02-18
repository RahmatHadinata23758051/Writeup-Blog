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
    "content": "Complete working exploit combining smooth prime generation, Pohlig-Hellman discrete log, and LLL lattice reduction:",
    "code": "from pwn import *\nfrom sage.all import *\nfrom Crypto.Util.number import *\n\nHOST = 'challenge.server.com'\nPORT = 1337\n\nio = remote(HOST, PORT)\n\nio.recvuntil(b'P = ')\nP = Integer(io.recvline().strip())\n\nio.recvuntil(b'G = ')\nG = Integer(io.recvline().strip())\n\nio.recvuntil(b'A = ')\nA = Integer(io.recvline().strip())\n\nio.recvuntil(b'B = ')\nB = Integer(io.recvline().strip())\n\nr_values = []\nfor _ in range(5):\n    io.recvuntil(b'c1 = ')\n    c1 = Integer(io.recvline().strip())\n    r = discrete_log(c1, G, ord=P-1)\n    r_values.append(r)\n\nM = P - 1\nn = len(r_values)\n\nB_mat = Matrix(ZZ, n+1, n+1)\nfor i in range(n):\n    B_mat[i, i] = M\n    B_mat[n, i] = r_values[i]\n\nB_mat[n, n] = 1\n\nB_lll = B_mat.LLL()\nseed_candidate = abs(B_lll[0][n])\n\ndef lcg_next(s):\n    return (A * s + B) % M\n\ns = seed_candidate\nfor _ in range(3):\n    s = lcg_next(s)\n\nio.sendlineafter(b'Seed? ', str(seed_candidate).encode())\nio.interactive()"
  },
  {
    "title": "Verify & Submit Seed",
    "content": "Recover candidates from LLL. Check both s and s+M for modular ambiguity. Verify locally by generating subsequent LCG states, then submit to server."
  }
]
,
  "flag": "INTECHFEST{964114fd72f319375a5c7fb3081a02b7}",
  "lessonsLearned": "Never allow clients to choose cryptographic parameters (especially primes). Always use safe primes (p = 2q+1). LCG is cryptographically broken - linear structure enables lattice attacks. Truncation alone doesn't guarantee security; underlying generator must be strong. Pohlig-Hellman breaks DLP if p-1 has only small factors."

}];