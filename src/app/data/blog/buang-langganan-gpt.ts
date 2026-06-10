import { BlogPost } from '../blogTypes';

export const buangLanggananGpt: BlogPost = {
  id: 'buang-langganan-gpt',
  title: 'Saya Buang $20/Bulan Langganan GPT Setelah Lihat Benchmark Ini',
  date: '2026-06-10',
  excerpt: 'Bukan clickbait. Ini yang benchmark open-weight vs closed-source coding model nggak pernah ceritain ke kamu.',
  tags: ['AI', 'LLM', 'Benchmark', 'Open-Source', 'Coding'],
  author: 'Nattt',
  readTime: '6 min read',
  content: `Tahun 2025, kalau kamu developer dan nggak langganan GPT-4o atau Claude Opus, rasanya ketinggalan zaman.

Tahun 2026, saya nggak begitu yakin lagi.

Bukan karena GPT atau Claude jelek. Justru sebaliknya — model-model itu makin bagus. Masalahnya: **model gratis yang bisa kamu host sendiri sekarang main di liga yang sama.** Dan kalau kamu belum lihat datanya, kamu mungkin masih bayar sesuatu yang nggak perlu kamu bayar.

Mari kita breakdown.

---

## Benchmark yang Harus Kamu Perhatikan: SWE-Bench

Sebelum masuk ke angkanya, penting untuk tahu kenapa SWE-Bench berbeda dari benchmark AI lainnya.

Kebanyakan benchmark itu seperti ujian pilihan ganda — model dikasih soal terisolasi, jawab, selesai. **SWE-Bench beda.** Model dikasih *real GitHub issues* dari Python repositories populer, dan harus menulis patch yang benar-benar fix bug-nya — dinilai dengan menjalankan unit test yang sudah ada.

Ini bukan "selesaikan fungsi ini." Ini "buka codebase yang belum pernah kamu lihat, temukan root cause-nya di antara puluhan file, tulis fix-nya, dan pastikan nggak break yang lain."

Itulah kenapa ini benchmark yang paling relevan buat developer di 2026.

---

## Angkanya: Ini yang Bikin Saya Terkejut

**SWE-Bench Verified (April 2026):**

| Model | Skor | Status | Biaya |
|-------|------|--------|-------|
| Claude Opus 4.5 | 80.9% | Closed (berbayar) | ~$20/bulan |
| GPT-5.4 | ~74–80% | Closed (berbayar) | ~$20/bulan |
| MiniMax M2.5 | 80.2% | Open-weight | Gratis / self-host |
| GLM-5 (Z.ai) | 77.8% | Open-source | Gratis / self-host |
| Qwen 3.6 Plus | Setara top-tier | Open-weight | Gratis / self-host |

![SWE-Bench Verified Leaderboard](/images/benchmarks/chart1.png)

Biarkan angka itu meresap sebentar.

**MiniMax M2.5 yang gratis, bisa kamu deploy sendiri, hanya 0.7% di bawah Claude Opus 4.5 di coding benchmark terpenting tahun ini.** GLM-5 dari Z.ai cuma 3 poin di belakang.

Dan kalau kamu mau level lebih dalam lagi — SWE-Bench *Pro*, versi yang lebih ketat karena pakai codebase private yang belum pernah dilihat model sebelumnya — GLM-5.1 (versi terbaru) justru **mengalahkan** Claude Opus 4.6, GPT-5.4, dan Gemini 3.1 Pro sekaligus dengan skor 58.4.

---

## "Tapi Benchmark Bisa Menipu, Kan?"

Betul. Dan ini bagian yang menarik.

Ada masalah serius dengan SWE-Bench Verified: task-task-nya kemungkinan besar sudah masuk ke training data model-model besar. Artinya beberapa skor tinggi itu sebagian adalah "mengingat jawaban," bukan benar-benar memecahkan masalah.

Makanya para engineer di OpenAI sendiri sekarang merekomendasikan SWE-Bench Pro sebagai standar yang lebih jujur — karena pakai codebase private yang belum kontaminasi.

Dan hasilnya? Lebih mengejutkan lagi. Model-model closed-source yang biasanya kita percaya ternyata drop jauh lebih parah ke skor 20-an persen ketika dihadapkan dengan kode yang benar-benar baru. Model open-source yang dirancang untuk generalisasi justru lebih tahan terhadap drop ini.

![Verified vs Pro Drop](/images/benchmarks/chart2.png)

---

## Implikasinya Buat Kamu Sebagai Developer

Ini bukan soal "GPT jelek" atau "open-source selalu menang." Ini soal keputusan engineering yang lebih tepat.

![Cost vs Performance Scatter](/images/benchmarks/chart3.png)

**Kalau kamu indie developer atau startup kecil:**
Qwen 3.6 Plus punya context window 1 juta token, tool use yang reliable, dan performa agentic yang sebanding dengan model-model mahal. Gratis. Self-hostable. Tidak ada vendor lock-in.

**Kalau kamu tim yang sudah pakai Cursor atau Claude Code:**
Tetap masuk akal — integrasinya, DX-nya, dan ekosistemnya masih unggul. Tapi mulai pertimbangkan untuk routing: task sederhana ke open-source, task kompleks ke model frontier.

**Kalau kamu building AI agent untuk production:**
Ini yang paling penting. Riset terbaru menunjukkan bahwa skor benchmark berkorelasi buruk dengan keberhasilan agent tasks — karena agent reliability bergantung pada faktor yang benchmark tidak ukur: konsistensi output format, self-correction rate, dan perilaku saat context window penuh.

Test di use case spesifik kamu. Benchmark cuma starting point.

---

## Yang Berubah di 2026

Dulu, gap antara open-source dan closed-source itu nyata dan signifikan. Kamu bayar $20/bulan karena memang dapat sesuatu yang jauh lebih baik.

Sekarang gapnya hampir tutup — setidaknya untuk coding tasks. Dan tren ini tidak akan berbalik arah.

Bukan berarti subscription ke Claude atau GPT nggak worth it. Mungkin tetap worth it buat kamu — tergantung workflow, tooling, dan seberapa sering kamu pakai fitur-fitur lain di luar pure coding.

Tapi keputusan itu sekarang harus *disengaja*. Bukan default.

---

## Apa yang Harus Kamu Lakukan Sekarang

1. **Coba Qwen 3.6 Plus atau GLM-5** untuk coding tasks yang biasa kamu kerjakan. Ollama dan LM Studio memudahkan setup lokal.
2. **Baca SWE-Bench Pro**, bukan hanya SWE-Bench Verified — ini benchmark yang lebih jujur.
3. **Test di codebase kamu sendiri.** 10 bug nyata dari project kamu lebih bermakna dari 500 GitHub issues yang mungkin sudah ada di training data model.
4. **Pertimbangkan arsitektur hybrid** — router yang mengarahkan task ke model yang tepat berdasarkan kompleksitas and biaya.

---

Era di mana "pakai ChatGPT atau Claude" adalah jawaban default untuk developer sudah mulai berakhir. Bukan karena model itu buruk — tapi karena barnya sudah naik ke mana-mana.

Dan itu sebenarnya kabar bagus.

---

Punya pengalaman pakai model open-source untuk production coding? Drop di komentar — gue genuinely penasaran use case mana yang masih terasa ada gapnya.
`
};
