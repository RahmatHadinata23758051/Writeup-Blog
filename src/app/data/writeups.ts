export type Category = 'Web' | 'Crypto' | 'Pwn' | 'Forensics' | 'Reverse' | 'OSINT' | 'Misc';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

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
}];