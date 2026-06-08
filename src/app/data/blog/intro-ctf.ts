import { BlogPost } from '../blogTypes';

export const introCtf: BlogPost = {
  id: 'pengenalan-ctf-keamanan-siber',
  title: 'Mengenal Capture The Flag (CTF) di Dunia Keamanan Siber',
  date: '2026-06-07',
  excerpt: 'Apa itu kompetisi CTF, jenis-jenisnya, kategori tantangan yang sering muncul, dan mengapa kamu wajib mencobanya.',
  tags: ['General', 'CTF', 'Tips'],
  author: 'Nattt',
  readTime: '4 min read',
  content: `Bagi kamu yang berkecimpung atau baru mulai tertarik di bidang **Cybersecurity (Keamanan Siber)**, istilah **Capture The Flag (CTF)** pasti sudah tidak asing lagi. CTF adalah sebuah kompetisi hacking legal di mana para peserta bersaing untuk memecahkan berbagai tantangan keamanan siber demi menemukan sebaris teks khusus yang disebut **Flag**.

Flag biasanya memiliki format tertentu seperti \`GPNCTF{...}\` atau \`FLAG{...}\` dan menjadi bukti bahwa kamu berhasil mengeksploitasi celah keamanan yang ada.

### Format Kompetisi CTF
Secara umum, kompetisi CTF dibagi menjadi dua format utama:

1. **Jeopardy-style**
   Format paling populer. Peserta disuguhkan daftar soal/tantangan yang dibagi ke dalam beberapa kategori. Setiap soal memiliki bobot poin tertentu sesuai tingkat kesulitan. Poin akan bertambah setiap kali soal berhasil diselesaikan.
   
2. **Attack-Defense**
   Format yang lebih realistis dan menantang. Setiap tim diberikan sebuah server berisi beberapa layanan (services) rentan yang harus dipertahankan. Tugas tim adalah:
   * **Defend**: Menambal celah keamanan (patching) pada server sendiri agar tidak diretas tim lain.
   * **Attack**: Mengeksploitasi server milik tim lawan untuk mengambil flag mereka.

---

### Kategori Tantangan dalam CTF
Tantangan di CTF Jeopardy biasanya mencakup beberapa area spesialisasi berikut:

* **Web Exploitation**: Mencari kerentanan pada aplikasi web (seperti SQL Injection, XSS, SSRF, File Upload bypass, LFI/RFI).
* **Reverse Engineering**: Menganalisis file binary terkompilasi (ELF, EXE, APK) untuk memahami alur program dan mencari flag tersembunyi.
* **Cryptography**: Memecahkan algoritma enkripsi yang salah diimplementasikan, membedah cipher klasik, atau mengeksploitasi kelemahan matematika pada enkripsi modern (seperti RSA atau ECC).
* **Forensics**: Menganalisis file log, memory dump, network capture (PCAP), atau menyembunyikan informasi dalam gambar/suara (Steganography).
* **Binary Exploitation (Pwn)**: Mengeksploitasi celah memori pada program biner (seperti Buffer Overflow atau Format String vulnerability) untuk mengambil alih kendali server.
* **Miscellaneous (Misc)**: Tantangan umum di luar kategori utama, seperti OSINT (Open Source Intelligence), scripting otomatis, atau teka-teki logika.

---

### Mengapa Kamu Wajib Ikut CTF?
Selain seru dan kompetitif, ikut CTF memberikan banyak manfaat:
1. **Belajar secara Praktis (Hands-on)**: Teori saja tidak cukup. Di CTF, kamu dituntut menerapkan pengetahuanmu langsung untuk memecahkan masalah nyata.
2. **Meningkatkan Skill Problem Solving**: Kamu akan belajar berpikir di luar kotak (*think outside the box*) untuk mencari celah yang tidak terpikirkan oleh developer biasa.
3. **Membangun Koneksi & Portofolio**: Kompetisi CTF adalah tempat berkumpulnya komunitas cybersecurity. Menulis write-up dari solusi yang kamu temukan juga menjadi bukti nyata skill dan portofolio kamu.

Jika kamu bingung harus mulai dari mana, buatlah akun di [ctftime.org](https://ctftime.org), cari event terdekat yang ramah pemula, dan mulailah mencoba! 🏁
`
};
