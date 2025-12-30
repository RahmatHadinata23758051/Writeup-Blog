# 📝 Write-Up Editor Guide

## Akses Editor Page

Klik tombol **"New Write-Up"** di navbar untuk membuka editor page. Di sana kamu bisa mengisi template form dengan detail write-up mu.

## Cara Menggunakan Editor

### 1. **Informasi Dasar**
- **ID**: Unik identifier (contoh: `web-sqli-1`, `3`)
- **Title**: Judul challenge
- **Category**: Web, Crypto, Pwn, Forensics, Reverse, OSINT, atau Misc
- **Difficulty**: Easy, Medium, atau Hard
- **Points**: Poin dari challenge
- **Author**: Nama mu
- **CTF Name**: Nama event CTF-nya
- **Date**: Tanggal challenge
- **Description**: Deskripsi singkat

### 2. **Problem & Analysis**
- **Problem Description**: Penjelasan detail soal
- **Analysis**: Analisis tentang vulnerability/problem

### 3. **Tools Used**
- Tambah tools yang kamu gunakan satu per satu
- Tekan Enter atau klik tombol "+" untuk menambah

### 4. **Solution Steps**
- Bisa punya multiple steps
- Setiap step punya:
  - **Title**: Nama step (contoh: "Initial Reconnaissance")
  - **Content**: Penjelasan step
  - **Code**: Optional - command atau code yang digunakan

### 5. **Flag & Lessons**
- **Flag**: Flag yang didapat
- **Lessons Learned**: Pembelajaran dari challenge ini

## Setelah Save

Setelah klik "Save & Generate JSON", buka **Browser Console** (F12):
1. Lihat JSON yang di-generate di console
2. Copy JSON tersebut
3. Buka file `src/app/data/writeups.ts`
4. Paste JSON ke dalam array `writeups[]`
5. Selamat! Write-up mu sudah tersimpan! 🎉

## Tips

- Jangan lupa isikan **ID** dengan unik (ga boleh sama dengan yang ada)
- **Category** harus sesuai dengan yang sudah didefinisikan
- **Points** ga harus diisi jika tidak ada
- **Code** di solution step opsional
- Bisa menambah lebih dari 1 solution step
