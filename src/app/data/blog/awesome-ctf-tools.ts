import { BlogPost } from '../blogTypes';

export const awesomeCtfTools: BlogPost = {
  id: 'awesome-ctf-tools-lengkap',
  title: 'Awesome CTF: Koleksi Tools Lengkap untuk Pemain CTF',
  date: '2026-06-09',
  excerpt: 'Kumpulan tools, platform, resource, dan tutorial terlengkap untuk pemain CTF dari tingkat pemula hingga mahir — disertai penjelasan singkat untuk setiap tool.',
  tags: ['General', 'Tools', 'CTF', 'Tutorial', 'Resources'],
  author: 'Nattt',
  readTime: '12 min read',
  content: `CTF (Capture The Flag) adalah kompetisi keamanan siber yang menantang kamu untuk memecahkan berbagai soal dari berbagai kategori: Web, Crypto, Reverse, Pwn, Forensics, dan masih banyak lagi. Salah satu hal pertama yang perlu kamu persiapkan adalah **senjata** yang tepat.

Di artikel ini, saya rangkum koleksi tools CTF terbaik dari repo [Awesome CTF](https://github.com/apsdehal/awesome-ctf) yang sudah sangat populer di komunitas keamanan siber, lengkap dengan penjelasan singkat untuk setiap tool agar kamu tidak bingung harus memulai dari mana.

---

## 🏗️ Create — Membuat Soal CTF

Kalau kamu pengen belajar dari sudut pandang *pembuat soal*, tools ini berguna banget:

* **Kali Linux CTF Blueprints** — Buku online yang mengajarkan cara membangun, menguji, dan mengkustomisasi soal CTF dari nol. Cocok buat yang ingin menghosting event sendiri.

### Platform Hosting CTF

Mau bikin CTF kompetisi sendiri? Beberapa platform siap pakai:

* **CTFd** — Platform paling populer untuk host CTF bergaya Jeopardy. Mudah di-deploy dan sangat customizable. Digunakan oleh NYU Tandon/ISISLab.
* **FBCTF** — Platform buatan Facebook. Menawarkan tampilan peta dunia yang keren untuk visualisasi tim peserta.
* **OpenCTF** — Bisa dibilang "CTF in a box". Setup paling minimal, cocok buat event internal kampus atau komunitas.
* **PicoCTF** — Framework yang digunakan untuk kompetisi PicoCTF, salah satu CTF tahunan terbesar untuk pelajar.
* **RootTheBox** — Platform dengan nama keren "A Game of Hackers". Lebih fokus ke gaya Attack-Defense.

---

## 🔓 Solve — Tools untuk Mengerjakan Soal CTF

Ini bagian yang paling kamu butuhkan sebagai peserta. Mari kita bagi per kategori:

---

### 🔐 Cryptography

Kategori crypto mengharuskan kamu memecahkan berbagai skema enkripsi, dari Caesar cipher sederhana hingga matematika RSA yang kompleks.

* **CyberChef** — "The Cyber Swiss Army Knife." Aplikasi web dari GCHQ yang bisa melakukan ratusan operasi kriptografi, encoding, dan analisis data lewat antarmuka drag-and-drop. *Wajib dibookmark!*
* **FeatherDuster** — Tool analisis kriptografi otomatis dan modular. Bisa mendeteksi jenis cipher yang digunakan secara otomatis.
* **Hash Extender** — Khusus untuk serangan *Hash Length Extension*, sebuah kelemahan pada fungsi hash seperti MD5 dan SHA-1.
* **padding-oracle-attacker** — Tool CLI untuk melancarkan serangan *Padding Oracle* pada enkripsi CBC mode.
* **RSACTFTool** — Koleksi serangan terhadap RSA: small exponent, common modulus, Wiener's attack, dll. Jika soalnya tentang RSA, tool ini adalah teman terbaikmu.
* **XORTool** — Menganalisis cipher XOR multi-byte. Bisa menebak panjang kunci dan mendekripsi pesan.
* **QuipQuip** — Tools online untuk memecahkan substitution cipher (seperti cryptogram) tanpa perlu mengetahui kuncinya.

---

### 💣 Pwn / Exploits (Binary Exploitation)

Kategori paling menantang. Tujuannya adalah mengeksploitasi kelemahan memori pada program biner untuk mendapatkan shell atau membaca file.

* **Pwntools** — Library Python #1 untuk menulis exploit. Menyediakan fungsi-fungsi siap pakai seperti \`p64()\`, \`recv()\`, \`sendline()\`, dan masih banyak lagi. *Tool wajib untuk semua pwner.*
* **GDB + GEF/Pwndbg** — Debugger untuk menganalisis program saat berjalan. GEF dan Pwndbg adalah plugin yang mempercantik tampilan GDB dengan informasi register, stack, dan heap yang lebih mudah dibaca.
* **Metasploit** — Framework penetration testing yang sangat lengkap. Di CTF, biasanya digunakan untuk payload generation atau exploit modul yang sudah jadi.
* **one_gadget** — Tool ajaib yang mencari satu gadget di dalam \`libc\` yang bisa langsung memanggil \`execve('/bin/sh', NULL, NULL)\`. Sangat berguna untuk bypass ASLR dan NX.
* **ROP Gadget** — Framework untuk membuat rantai *Return Oriented Programming* (ROP chain), teknik eksploitasi yang digunakan untuk bypass NX (No-Execute) protection.
* **libformatstr** — Menyederhanakan eksploitasi kelemahan *Format String* (printf vulnerability).

---

### 🔬 Forensics

Kategori forensik memintamu menganalisis berbagai jenis file: gambar disk, PCAP, file audio, memory dump, dan lainnya.

* **Volatility** — Tool #1 untuk analisis *memory dump*. Bisa mengekstrak proses, koneksi jaringan, password, dan artefak forensik dari file `.vmem` atau `.mem`.
* **Wireshark** — Menganalisis file capture jaringan (PCAP/PCAPNG). Bisa mem-filter paket berdasarkan protokol, mencari credentials, atau merekonstruksi stream HTTP/TCP.
* **Foremost** — Mengekstrak berbagai jenis file berdasarkan header magic bytes dari file gambar disk. Sangat berguna untuk *file carving*.
* **Binwalk** — Menganalisis dan mengekstrak file tersembunyi dari firmware atau file biner. Otomatis mendeteksi format file yang diembedkan.
* **Aircrack-Ng** — Memecahkan enkripsi jaringan WiFi WEP/WPA dari file capture. Sering muncul di soal forensics berbasis jaringan wireless.
* **Exiftool** — Membaca dan menulis metadata (EXIF) pada berbagai jenis file: gambar, PDF, video, dll. Kadang flag disembunyikan di sini!
* **Extundelete** — Memulihkan file yang terhapus dari partisi ext2/ext3/ext4 Linux. Berguna untuk soal "recover the deleted file".
* **Pngcheck** — Memverifikasi integritas file PNG dan menampilkan informasi chunk-level secara detail.

---

### 🔄 Reversing (Reverse Engineering)

Kamu diberikan file binary tanpa source code. Tugasmu adalah memahami cara kerjanya.

* **Ghidra** — Suite reverse engineering open-source dari NSA. Gratis dan powerful. Fitur decompiler-nya mengubah kode mesin jadi pseudocode C yang mudah dibaca.
* **IDA Pro** — Standar industri untuk reverse engineering. Versi freeware (IDA Free) tersedia untuk penggunaan personal.
* **Radare2** — Framework reversing berbasis command line yang sangat portabel. Memiliki kurva belajar yang cukup curam, tapi sangat powerful.
* **Binary Ninja** — Alternatif modern dari IDA Pro dengan antarmuka yang lebih bersih dan API Python yang bagus.
* **Angr** — Platform analisis biner berbasis Python yang mampu melakukan *symbolic execution*. Berguna untuk memecahkan soal yang membutuhkan input tertentu.
* **GDB + PEDA/Pwndbg** — Digunakan untuk debugging dan analisis dinamis. PEDA (Python Exploit Development Assistance) cocok untuk Python 2.7.
* **Frida** — Framework dynamic instrumentation yang memungkinkan kamu menyuntikkan kode JavaScript ke dalam proses yang berjalan. Sangat berguna untuk analisis aplikasi mobile (Android/iOS).
* **Jadx** — Decompiler Android (.apk) ke Java source code. Sangat berguna untuk soal mobile.
* **Z3** — Theorem prover dari Microsoft Research. Digunakan untuk memecahkan constraint/equation matematika yang kompleks secara otomatis — sangat ampuh untuk bypass validasi input.

---

### 🌐 Web

Kategori web berfokus pada kerentanan aplikasi web.

* **BurpSuite** — Proxy intersepsi HTTP terlengkap. Bisa memodifikasi request/response, melakukan fuzzing, dan banyak lagi. Versi Community tersedia gratis.
* **SQLMap** — Otomatisasi eksploitasi SQL Injection. Bisa mendeteksi dan mengeksploitasi berbagai jenis SQLi dengan satu perintah.
* **OWASP ZAP** — Alternatif open-source dari BurpSuite. Tersedia gratis dan cukup lengkap untuk penggunaan CTF.
* **XSSer** — Tool otomasi pengujian Cross-Site Scripting (XSS). Cocok untuk soal yang membutuhkan payload XSS.
* **W3af** — Framework audit dan eksploitasi aplikasi web yang modular.

---

### 🕵️ Steganography

Kategori stego menyembunyikan informasi di dalam file media seperti gambar, audio, atau video.

* **Steghide** — Menyembunyikan dan mengekstrak data dari file gambar (JPEG, BMP) dan audio (WAV, AU) dengan atau tanpa enkripsi password.
* **AperiSolve** — Platform online yang menjalankan berbagai analisis steganografi secara otomatis pada gambar yang kamu upload. Coba ini dulu sebelum yang lain!
* **Stegsolve** — Aplikasi Java yang menampilkan berbagai bit-plane dari gambar. Sangat berguna untuk LSB (Least Significant Bit) steganography.
* **Zsteg** — Mendeteksi data tersembunyi dalam file PNG dan BMP, termasuk LSB steganography.
* **StegCracker** — Brute-force tool untuk Steghide. Mencoba berbagai password menggunakan wordlist.
* **Exiftool** — Selain untuk forensics, juga digunakan untuk memeriksa metadata gambar yang mungkin menyimpan informasi.

---

### 🌐 Networking

* **Nmap** — Scanner port dan jaringan yang paling terkenal. Bisa mendeteksi OS, versi service, dan menjalankan script NSE untuk analisis lebih lanjut.
* **Wireshark** — Selain forensics, juga digunakan untuk menganalisis protokol jaringan secara detail.
* **Masscan** — Scanner port yang sangat cepat. Mampu memindai seluruh internet dalam waktu singkat.

---

### 🔑 Bruteforcers

* **Hashcat** — Tool cracking hash terkencang di dunia. Mendukung GPU acceleration dan ratusan jenis hash (MD5, SHA-256, bcrypt, dll).
* **John the Ripper** — Alternatif Hashcat yang lebih klasik. Terkenal karena kemampuan cracking berbagai format hash dari sistem Unix/Linux.
* **Hydra** — Login brute-force paralel yang mendukung banyak protokol: SSH, FTP, HTTP, RDP, dll.

---

## 📚 Resources — Tempat Belajar CTF

### 🎮 Wargames (Platform Latihan)

* **Hack The Box** — Platform paling populer saat ini. Menawarkan lab virtual dan challenges yang terus diperbarui.
* **PicoCTF** — Sangat ramah pemula. Soal-soalnya terstruktur dari mudah ke sulit.
* **Over The Wire** — Wargame berbasis terminal untuk belajar Linux, networking, dan exploitation dari dasar.
* **pwnable.kr / pwnable.tw** — Khusus untuk belajar binary exploitation (PWN) dengan soal-soal yang sangat bagus.
* **CryptoHack** — Platform terbaik untuk belajar kriptografi secara interaktif dan menyenangkan.
* **Root-Me** — Platform belajar yang sangat lengkap dengan ratusan tantangan di berbagai kategori.

### 🎓 Tutorial

* **CTF Field Guide** — Panduan lengkap oleh Trail of Bits. Wajib dibaca oleh semua pemain CTF.
* **IppSec (YouTube)** — Channel YouTube yang membahas walkthrough soal Hack The Box secara mendalam. Cara terbaik belajar dari yang sudah berpengalaman.
* **LiveOverflow (YouTube)** — Channel YouTube yang membahas binary exploitation, web, dan berbagai topik keamanan dengan penjelasan yang sangat jelas dan menarik.

### 🖥️ Operating Systems

Sebaiknya gunakan sistem operasi yang sudah dikonfigurasi untuk security:

* **Kali Linux** — Distro Linux paling populer untuk penetration testing. Datang dengan ratusan tools pre-installed.
* **Parrot Security OS** — Alternatif Kali yang lebih ringan dan juga sangat lengkap.
* **BlackArch Linux** — Berbasis Arch Linux dengan ribuan tools security tersedia di repositorinya.
* **REMnux** — Distro khusus untuk analisis malware dan reverse engineering.

---

## 🏁 Kesimpulan

Jangan merasa harus menguasai semua tools di atas sekaligus. Mulailah dari **satu kategori** yang paling menarik bagimu, pelajari tools utamanya secara mendalam, dan latih skill-mu di platform seperti PicoCTF atau Over The Wire.

Yang terpenting adalah **konsistensi dan rasa ingin tahu**. Setiap soal yang kamu pecahkan, walaupun setelah melihat hint atau writeup orang lain, tetap menambah pengetahuan dan intuisi kamu. Dokumentasikan proses belajarmu — dan siapa tahu writeup-mu suatu hari bisa membantu orang lain! 🚀

> **Pro tip:** Selalu cek [CTFTime.org](https://ctftime.org) untuk jadwal event CTF yang akan datang dan cari yang berlabel *beginner-friendly* untuk mulai berkompetisi secara langsung.
`
};
