import { BlogPost } from '../blogTypes';

export const aiParadoxCtf: BlogPost = {
  id: 'ai-paradox-ctf',
  title: 'AI Paradox in CTF: Banned for Players, Used by Authors',
  date: '2026-06-09',
  excerpt: 'Banyak kompetisi CTF melarang peserta memakai AI dengan alasan fairness. Tapi di sisi lain, author memakai AI untuk membuat challenge. Batas adilnya di mana?',
  tags: ['CTF', 'AI', 'Opinion', 'Ethics'],
  author: 'Nattt',
  readTime: '6 min read',
  content: `> *"Kalau AI tidak boleh dipakai untuk solve, kenapa boleh dipakai untuk bikin soalnya?"*

---

## TL;DR

Banyak kompetisi CTF melarang peserta memakai AI dengan alasan fairness dan verifikasi skill. Tapi di sisi lain, tidak sedikit challenge yang deskripsinya, source code-nya, atau aset pendukungnya dibuat dengan bantuan AI. Ini bukan otomatis salah — tapi kalau aturannya cuma satu arah, ada pertanyaan yang perlu dijawab: **batas adilnya di mana?**

---

## Latar Belakang

CTF (Capture The Flag) adalah kompetisi keamanan siber di mana peserta memecahkan tantangan teknis — mulai dari reverse engineering, web exploitation, kriptografi, sampai forensik. Komunitas ini punya kultur yang kuat soal skill asli: solve pakai otot dan otak, bukan shortcut.

Masuk akal. CTF bukan cuma soal menang, tapi soal belajar.

Tapi sejak AI generatif meledak, muncul ketegangan baru. Beberapa kompetisi mulai memasukkan klausul seperti:

> *"Penggunaan AI tool seperti ChatGPT, Copilot, atau model sejenisnya dilarang selama kompetisi berlangsung."*

Dan sementara itu, di balik layar, beberapa author mulai pakai AI untuk mempercepat pembuatan challenge.

Dua hal yang berlapangan arah. Dari tool yang sama.

---

## Kenapa Player Dilarang Pakai AI?

Alasannya tidak sepenuhnya salah. Beberapa poin yang sering diangkat panitia:

**1. AI mempercepat solve secara tidak proporsional.**
Model seperti GPT-4 bisa menganalisis pola enkripsi, menyarankan exploit path, atau menjelaskan assembly dalam hitungan detik. Ini mengubah challenge yang dirancang untuk 5 jam menjadi 20 menit bukan karena skill player meningkat, tapi karena bottleneck-nya dihilangkan.

**2. Sulit membedakan skill player dari skill model.**
Kalau semua orang pakai AI, leaderboard bukan lagi cerminan kemampuan individual. Ia jadi cerminan siapa yang paling pandai *prompting* — yang merupakan skill berbeda.

**3. AI agent bisa terlalu otomatis.**
Beberapa tool seperti autonomous CTF agent sudah bisa menjalankan solve end-to-end tanpa intervensi manusia bermakna. Di sini batas antara "dibantu AI" dan "digantikan AI" sudah kabur sepenuhnya.

**4. Challenge bocor ke layanan eksternal.**
Beberapa kompetisi punya challenge dengan informasi sensitif atau yang sengaja diisolasi. Memasukkannya ke chatbot publik berarti data keluar dari lingkungan yang dikontrol.

Semua ini valid — terutama untuk kompetisi yang sifatnya edukatif, seleksi, atau individual ranking.

---

## Kenapa Author Pakai AI?

Di sisi lain, dari perspektif author, AI juga masuk akal dipakai:

**Tekanan deadline nyata.** Satu event CTF bisa butuh 20–50 challenge. Author sering bekerja sukarela, paruh waktu, dengan window produksi yang sempit.

**Pekerjaan repetitif.** Bikin dummy data, menulis lore, menyusun hint yang tidak terlalu spoiler, merapikan deskripsi challenge — ini semua bisa dipercepat AI tanpa mengubah inti tantangan teknis.

**Ideasi awal.** AI bagus untuk brainstorming: "kasih aku 5 variasi tema challenge forensik yang belum umum di CTF." Eksekusi teknisnya tetap di tangan author.

Ini wajar. Banyak profesi kreatif dan teknis menggunakan AI sebagai alat bantu produktivitas. Tidak ada yang salah dari itu secara prinsip.

---

## Di Mana Masalahnya Muncul?

Masalah bukan soal apakah author boleh pakai AI. Masalah muncul ketika **aturan untuk player sangat keras, tapi tidak ada transparansi soal seberapa jauh AI terlibat di sisi author.**

Bayangkan skenario ini:

- Player dilarang tanya AI soal teknik reverse engineering dasar.
- Tapi source code challenge di-generate sebagian oleh AI tanpa review mendalam.
- Player dilarang pakai AI untuk debugging script.
- Tapi lore challenge, hint, dan deskripsi ditulis sepenuhnya oleh model.
- Player dianggap curang kalau pakai Copilot untuk autocomplete.
- Tapi author pakai AI untuk generate aset stegano, log palsu, atau dummy binary.

Bukan berarti semua ini salah. Tapi ketika aturannya one-directional dan tidak dijelaskan, rasanya ada ketidakseimbangan.

Dan ada satu risiko tambahan yang sering tidak disebut: **challenge yang dibuat AI tanpa review yang baik bisa punya unintended solve path.** Kalau flag bisa didapat dengan cara yang tidak direncanakan author karena kode AI-nya tidak diaudit, ini merugikan player yang sudah berusaha solve dengan cara yang "benar".

---

## Apakah Ini Standar Ganda?

Jawaban jujurnya: **bisa iya, bisa tidak.** Tergantung konteks.

**Bukan standar ganda jika:**
- Panitia menjelaskan secara transparan seberapa jauh AI dipakai dalam pembuatan challenge.
- AI hanya dipakai untuk pekerjaan non-esensial (lore, formatting, boilerplate).
- Core vulnerability dan solution path dirancang dan diverifikasi manusia.
- Aturan AI untuk player realistis dan spesifik, bukan larangan absolut yang tidak bisa diawasi.

**Menjadi standar ganda jika:**
- AI dipakai secara signifikan di sisi author tanpa disebutkan.
- Player dilarang total tanpa penjelasan yang masuk akal.
- Challenge tidak diaudit post-generation, menghasilkan soal yang broken atau punya unintended path.
- Player dihukum untuk tool yang secara diam-diam juga dipakai oleh panitia.

---

## Larangan Total AI Hampir Mustahil Ditegakkan

Ini masalah praktis yang sering diabaikan.

AI sudah ada di mana-mana. Orang bisa pakai AI untuk:

- Menjelaskan error message yang tidak familiar
- Memahami konsep kriptografi yang belum pernah mereka pelajari
- Menulis regex
- Merapikan script Python yang berantakan
- Membaca dokumentasi library yang jarang dipakai

Tidak semua ini sama dengan "AI solve the challenge." Banyak yang masuk kategori *learning aid* yang tidak berbeda jauh dari membaca Stack Overflow atau dokumentasi resmi.

Larangan total yang tidak bisa diawasi secara teknis hanya menciptakan dua kelompok: yang taat tapi dirugikan, dan yang tidak taat tanpa konsekuensi.

---

## Aturan yang Lebih Sehat

Kalau kompetisi CTF ingin aturan AI yang realistis dan bisa ditegakkan, mungkin perlu lebih spesifik dari sekadar "AI dilarang."

**Boleh:**
- Menggunakan AI untuk memahami konsep umum yang tidak spesifik ke challenge.
- Debugging script sendiri yang tidak mengandung konten challenge.
- Menulis writeup setelah kompetisi selesai.
- Mencari penjelasan tools dan teknik umum yang tersedia publik.

**Dilarang:**
- Menjalankan autonomous agent untuk solve end-to-end tanpa kontrol manusia bermakna.
- Memasukkan konten challenge (source code, binary, deskripsi) langsung ke layanan AI eksternal jika rules melarang data keluar.
- Menggunakan model yang punya akses ke writeup leaked saat kompetisi berlangsung.
- Meminta AI langsung memberikan flag atau exploit path yang spesifik ke challenge.

Dengan aturan seperti ini, fokusnya bukan lagi "pakai AI atau tidak" — tapi "seberapa jauh AI menggantikan proses berpikir player."

---

## Untuk Author: Ada Tanggung Jawab di Sini Juga

Kalau kita bicara fairness, author juga perlu punya standar yang jelas:

**AI boleh** membantu ide, boilerplate, lore, dan narasi challenge.

**Core vulnerability harus dirancang atau minimal diverifikasi manusia.** Author harus bisa menjelaskan step-by-step kenapa solution path bekerja — bukan hanya "AI yang bikin."

**Challenge harus dites tanpa asumsi model.** Kalau author tidak bisa solve challenge-nya sendiri tanpa pakai AI lagi, ada masalah.

**Kode yang di-generate AI harus diaudit.** Output AI sering punya subtle bug, logic yang tidak konsisten, atau — dalam konteks CTF — unintended shortcut yang bisa membuat solve menjadi trivial dengan cara yang tidak direncanakan.

**Data yang di-generate AI harus dicek.** Flag tidak boleh muncul di tempat yang tidak seharusnya. Pola yang tidak disengaja tidak boleh jadi petunjuk tidak sengaja.

Challenge yang broken karena output AI tidak divalidasi adalah pengalaman buruk bagi semua orang — termasuk author itu sendiri.

---

## Hot Take

Kalau mau jujur:

**Larangan AI total di CTF terdengar tegas, tapi sering tidak realistis dan tidak konsisten.**

Yang lebih penting bukan "boleh pakai AI atau tidak" — tapi **"apakah AI menggantikan proses berpikir, atau hanya mempercepat hal-hal yang bukan inti tantangan?"**

Dan kalau challenge boleh dibuat dengan AI atas nama efisiensi produksi, maka peserta juga seharusnya boleh menggunakan AI dalam batas yang jelas atas nama *workflow modern* — asalkan AI tidak menjadi solver, hanya asisten.

Ini bukan pembelaan untuk cheating. Ini argumen untuk **aturan yang jujur dan bisa diterapkan secara konsisten di kedua sisi.**

---

## Kesimpulan

AI di CTF bukan isu hitam-putih. Masalah intinya adalah fairness, transparansi, dan kontrol — dari dua arah.

Kalau AI dilarang untuk peserta karena dianggap mengurangi nilai skill, maka penggunaan AI oleh author juga perlu dijelaskan dengan jujur. Bukan karena author salah menggunakannya, tapi karena transparansi adalah bagian dari kompetisi yang credible.

CTF seharusnya menguji kemampuan berpikir, eksplorasi, dan debugging. AI boleh menjadi alat bantu. Yang tidak boleh adalah aturan yang berlaku satu arah tanpa alasan yang bisa dipertanggungjawabkan.
`
};
