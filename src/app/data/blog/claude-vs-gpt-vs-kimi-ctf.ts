import { BlogPost } from '../blogTypes';

export const claudeVsGptVsKimiCtf: BlogPost = {
  id: 'claude-vs-gpt-vs-kimi-ctf',
  title: 'Auto-Solve Satu Kompetisi CTF Pakai AI? Ini Hitungan Biayanya (Claude vs GPT vs Kimi K3)',
  date: '2026-08-26',
  excerpt: 'Kimi K3 baru saja rilis dengan harga yang mirip Claude dan GPT. Pertanyaannya: kalau disuruh menyelesaikan satu kompetisi CTF penuh secara otonom, berapa dolar yang terbakar, dan apakah hasilnya sepadan?',
  tags: ['AI', 'LLM', 'CTF', 'API', 'Benchmark'],
  author: 'Nattt',
  readTime: '8 min read',
  coverImage: undefined,
  content: `Kimi K3 dari Moonshot AI baru saja diluncurkan. Harganya langsung masuk kelas flagship: USD 3 per juta token input, USD 15 per juta token output. Persis di kisaran Claude Sonnet 5 dan GPT-5.4.

Ini bikin satu pertanyaan muncul terus di kepala saya: kalau saya pasang agent yang disuruh menyelesaikan satu kompetisi CTF lengkap, satu prompt untuk satu challenge, model mana yang menyelesaikan paling banyak dengan biaya paling masuk akal?

Artikel ini adalah hasil riset harganya, datanya, dan simulasi biayanya. Semua angka harga saya ambil langsung dari halaman resmi Anthropic, OpenAI, dan Moonshot per 26 Agustus 2026, lalu saya cross-check lewat OpenRouter. Jadi bukan harga dari ingatan yang bisa basi.

---

## Skenario yang Saya Simulasikan

Ambil contoh kompetisi CTF tipikal ukuran menengah: 30 challenge, terdiri dari 12 easy, 12 medium, dan 6 hard. Agent jalan dalam mode otonom, artinya dia sendiri yang membaca soal, menjalankan command di terminal, mengunduh file, probing server, dan iterasi sampai flag dapat atau token habis.

Untuk satu challenge, jumlah token yang dikonsumsi jauh lebih besar daripada sekadar tanya-jawab biasa. Setiap iterasi tool call membawa ulang seluruh context. Dari pengalaman menjalankan agent untuk CTF, perkiraan konservatifnya begini:

\`\`\`
Challenge easy   : ~150 ribu token input,  ~20 ribu token output
Challenge medium : ~400 ribu token input,  ~50 ribu token output
Challenge hard   : ~900 ribu token input, ~120 ribu token output
\`\`\`

Angka ini berasumsi tanpa caching dulu, biar perbandingan antar model apple-to-apple. Nanti kita bahas kenapa caching mengubah keseluruhan permainan.

---

## Daftar Harga Resmi (Agustus 2026)

Semua dalam USD per juta token (MTok), harga standar non-batch:

| Model | Input | Cache hit | Output | Context |
|-------|-------|-----------|--------|--------|
| Claude Opus 5 | 5.00 | 0.50 | 25.00 | 1M |
| Claude Sonnet 5 | 2.00 | 0.20 | 10.00 | 1M |
| GPT-5.4 | 2.50 | - | 15.00 | ~1M |
| GPT-5.4-mini | 0.75 | - | 4.50 | 400K |
| Kimi K3 | 3.00 | 0.30 | 15.00 | 1M |
| Kimi K2.7 Code | 0.67 | - | 3.40 | 256K |

Beberapa catatan penting dari halaman resmi mereka:

Satu, harga Sonnet 5 di USD 2/USD 10 yang tadinya diumumkan sebagai harga intro sampai 31 Agustus 2026 ternyata dipermanenkan. Anthropic membatalkan rencana kenaikan ke USD 3/USD 15 per 1 September. Kabar baik buat yang sudah build di atas Sonnet.

Dua, Kimi K3 punya diskon cache hit 90 persen, dari USD 3 turun ke USD 0.30. Anthropic memberi diskon serupa (Opus 5 turun ke USD 0.50 saat cache hit). Ini bukan angka kosmetik, nanti kita lihat dampaknya.

Tiga, GPT-5.4-mini dan Kimi K2.7 Code adalah kelas hemat, dan harganya bersaing ketat di bawah USD 1 per juta token input.

---

## Lalu Kemampuannya? Ini Kata Data

Harga murah tidak berguna kalau agent-nya mentok di challenge medium. Sayangnya, perbandingan kemampuan CTF jauh lebih sulit didokumentasikan daripada harga. Ini yang bisa diverifikasi:

### Cybench: Anthropic mendominasi

Cybench adalah benchmark CTF open-source dari NYU yang menjadi rujukan standar, bahkan dipakai AI Safety Institute Inggris dan Amerika di joint pre-deployment test mereka. Leaderboard resminya (evaluasi end-to-end, subset 35-40 challenge profesional):

| Model | End-to-end solved |
|-------|-------------------|
| Claude Mythos Preview | 100% |
| Claude Opus 4.7 | 96% |
| Claude Opus 4.6 | 93% |
| Claude Opus 4.5 | 82% |
| Claude Sonnet 4.5 | 60% |
| Grok 4 | 43% |
| Claude Opus 4.1 | 42% |

Perhatikan yang absen dari daftar: tidak ada GPT-5.x maupun Kimi dengan evaluasi resmi di leaderboard tersebut. Angka tertinggi non-Anthropic yang tercatat resmi masih Grok 4 di 43 persen.

### GPT-5.4: angka dari system card sendiri

OpenAI tidak ikut leaderboard Cybench untuk seri 5.x, tapi system card GPT-5.4 Thinking yang mereka publish berisi evaluasi CTF internal. Ringkasannya: pada atomic challenge suite dari Irregular, mode reasoning-nya menyelesaikan 88 persen challenge network attack simulation, 73 persen vulnerability research, tapi cuma 48 persen challenge evasion. Pada skenario cyber range yang lebih panjang dan kompleks, success rate-nya jatuh ke 11 persen.

Sebagai pembanding, baseline manusia PhD level percentile 80 di benchmark yang sama cuma 36.4 persen. Jadi angka 88 persen di challenge atomik itu tetap impresif, meski metodologinya tidak identik dengan Cybench sehingga tidak bisa dibandingkan lurus.

Ada juga GPT-5.4-Cyber, varian khusus pertahanan yang dilaporkan mencetak 76 persen di benchmark CTF profesional. Tapi model ini di-gate lewat program Trusted Access for Cyber dan tidak dijual bebas, jadi untuk kebutuhan personal ia relevannya sebagai penanda arah, bukan pilihan beli.

### Kimi K3: terlalu baru untuk dinilai

Di sinilah posisi jujurnya: belum ada skor benchmark cybersecurity publik untuk Kimi K3 sampai artikel ini ditulis. Modelnya baru diluncurkan. Generasi sebelumnya, Kimi K2, membangun reputasi lewat coding dan agentic task, dan harga K2.7 Code memang paling agresif di kelasnya. Tapi reputasi CTF? Belum ada buktinya.

---

## Simulasi Biaya: Satu Kompetisi Penuh

Sekarang bagian yang ditunggu. Dengan asumsi token di atas, berikut total biaya API untuk menembus 30 challenge (12 easy, 12 medium, 6 hard), tanpa caching:

| Model | Biaya total |
|-------|-------------|
| Kimi K2.7 Code | USD 13.34 |
| GPT-5.4-mini | USD 16.02 |
| Kimi K3 (cache 80%) | USD 33.48 |
| Claude Sonnet 5 | USD 39.60 |
| GPT-5.4 | USD 53.40 |
| Kimi K3 (tanpa cache) | USD 59.40 |
| Claude Opus 5 | USD 99.00 |

![Perbandingan biaya API per kompetisi CTF](/images/benchmarks/cost-comparison.svg)

Baris Kimi K3 dengan cache 80% itu skenario realistis untuk agentic loop: mayoritas token input di tiap iterasi adalah context yang berulang, sehingga layak diasumsikan kena cache hit USD 0.30. Begitu caching aktif, biaya input efektifnya anjlok dan totalnya turun dari USD 59 ke USD 33.

Ada pelajaran tersembunyi di tabel ini. Selisih Opus 5 versus Sonnet 5 adalah 2.5 kali lipat, padahal keduanya satu keluarga. Dan model kelas hemat bisa menyelesaikan satu kompetisi penuh di bawah USD 17, kurang dari harga satu langganan ChatGPT Plus bulanan.

---

## Faktor yang Lebih Menentukan Daripada Harga List

Sebelum kamu buru-buru pilih yang termurah, tiga hal ini yang sering membuat hitungan di atas kertas meleset di lapangan:

|**Success rate mempengaruhi biaya secara eksponensial.** Kalau model A menyelesaikan 80 persen challenge dan model B cuma 40 persen, biaya riil per challenge yang terselesaikan di model B adalah dua kali lipat nominalnya, karena kamu bayar percobaan gagal. Di sinilah gap 96 persen versus 43 persen di Cybench jadi masalah finansial, bukan cuma angka pameran.

|**Retry dan output panjang adalah pembunuh senyap.** Satu challenge hard yang bikin agent muter-muter bisa melipatgandakan estimasi token saya di atas. Model dengan kecenderungan verbose atau hallucinate tool call bakal menggerus budget diam-diam.

|**Batch API tidak bisa dipakai saat lomba.** Diskon 50 persen Claude batch maupun OpenAI batch menggoda, tapi challenge CTF butuh interaksi realtime dengan server yang hanya hidup selama event. Jadi angka di tabel memang yang harus kamu bayar.

---

## Jadi Pilih Mana?

Depends on budget and ekspektasi, tapi begini rekomendasi saya:

|**Budget minimal, mau belajar dan eksperimen:** Kimi K2.7 Code atau GPT-5.4-mini. Dengan USD 13 sampai 16 per kompetisi, kamu bisa menjalankan pipeline penuh tanpa deg-dutan. Realistis untuk kategori web easy sampai medium dan misc.

|**Balanced, mau solve rate layak:** Claude Sonnet 5 di USD 39.60. Ini sweet spot saya. Harganya separuh Opus, context window 1M, dan jejak evaluasi publik Anthropic untuk keluarga Sonnet relatif transparan.

|**Serius mau menang:** Claude Opus 5, USD 99 per kompetisi. Mahal, tapi data Cybench menunjukkan keluarga Opus adalah satu-satunya yang konsisten menembus di atas 90 persen pada challenge profesional. Untuk kompetisi yang hadiahnya atau reputasinya bernilai lebih dari USD 100, ini hitungan yang gampang dibenarkan.

|**Spekulatif tapi menarik:** Kimi K3 dengan caching aktif, USD 33.48. Secara struktur harga, ini penawaran paling cerdas: cache hit diskon 90 persen dengan context 1M itu dirancang persis untuk workload agentic. Yang kurang cuma satu, bukti kemampuan CTF-nya belum ada. Kalau kamu mencoba dan dapat hasil, share dong. Saya genuinely penasaran.

---

## Sumber & Referensi

Berikut adalah seluruh sumber data yang digunakan dalam artikel ini, untuk verifikasi dan bacaan lebih lanjut:

**Harga API:**

- [Anthropic — Claude Pricing](https://docs.anthropic.com/en/docs/about-claude/models) — Harga resmi Claude Opus 5, Sonnet 5 (permanen sejak September 2026)
- [OpenAI — API Pricing](https://openai.com/api/pricing/) — Harga GPT-5.4 dan GPT-5.4-mini
- [Moonshot AI — Kimi API](https://platform.moonshot.cn/docs/api/kimi) — Harga Kimi K3 dan K2.7 Code dengan struktur cache hit

**Benchmark CTF:**

- [Cybench — NYU CTF Benchmark](https://cybench.cloud/) — Leaderboard end-to-end, model Claude Mythos Preview 100%, Opus 4.7 96% (data per Agustus 2026)
- [OpenAI — GPT-5.4 System Card](https://openai.com/index/gpt-5-4-thinking/) — Skor CTF internal: 88% network attack, 73% vulnerability research, 48% evasion

**Tools & Framework:**

- [OpenRouter — Model Prices](https://openrouter.ai/models) — Cross-check harga semua provider
- [AI Safety Institute — Pre-deployment Testing](https://www.airc.gov.sg) — Referensi joint test dengan Cybench

---

## Catatan Metodologi

Biar adil, beberapa disclaimer: estimasi token berasal dari pengalaman pribadi menjalankan agent CTF dan akan bervariasi tergantung harness, model prompt, dan kompleksitas challenge. Benchmark membandingkan model pada setup berbeda, jadi angka antar benchmark tidak bisa dicampur. Dan harga API berubah cepat, angka di sini valid per 26 Agustus 2026.

Kalau kamu pernah jalankan agent untuk kompetisi penuh, drop di komentar: model apa, berapa token yang terbakar, dan chall apa yang bikin agent-nya menyerah.`
};
