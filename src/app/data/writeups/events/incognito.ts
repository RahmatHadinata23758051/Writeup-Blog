import type { WriteUp } from '../types';

// Incognito — 1 writeup
export const incognitoWriteups: WriteUp[] = [
  {
    "id": "incognito-foren-deados",
    "title": "Dead OS - Full Forensic Write-up",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "Incognito",
    "tags": [],
    "description": "Writeup for challenge Dead OS - Full Forensic Write-up",
    "problemDescription": "",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge",
        "content": "- Category: Forensics\n- Name: `Dead OS`\n- Flag format: `IIITL{...}`"
      },
      {
        "title": "Investigation Strategy",
        "content": "The challenge description says the OS does not boot, but data is intact.  \nThat strongly suggests hidden data in boot-related structures (MBR/bootloader) plus a key chain somewhere in user artifacts.\n\nThe successful chain was:\n1. Find suspicious user artifacts.\n2. Recover encrypted key material.\n3. Crack/decrypt the key material.\n4. Use recovered key against hidden payload in the boot sector.\n\n---"
      },
      {
        "title": "Command",
        "content": "",
        "code": "ls -la"
      },
      {
        "title": "Output",
        "content": "Only one artifact exists: a very large VHD.",
        "code": "total 20971536\ndrwxr-xr-x 2 nata nata        4096 Apr 14 09:43 .\ndrwxr-xr-x 5 nata nata        4096 Apr 14 09:43 ..\n-rw-r--r-- 1 nata nata 21474836992 Apr 14 01:08 Dead_OS.vhd"
      },
      {
        "title": "Command",
        "content": "",
        "code": "file Dead_OS.vhd"
      },
      {
        "title": "Output",
        "content": "Important clue appears immediately: boot message area includes suspicious Base64-like text.",
        "code": "Dead_OS.vhd: DOS/MBR boot sector MS-MBR Windows 7 english at offset 0x163 \"iumuhAh5x1NWNh6Twkk9xDn0ZwlKn3yJ7C4FVZ1z/PY=ing system\" at offset 0x17b \"ZwlKn3yJ7C4FVZ1z/PY=ing system\" at offset 0x19a \"Missing operating system\", disk signature 0xed2553d4"
      },
      {
        "title": "Command",
        "content": "",
        "code": "mmls Dead_OS.vhd"
      },
      {
        "title": "Output",
        "content": "Main user data is in NTFS partition at offset `104448`.\n\n---",
        "code": "DOS Partition Table\nOffset Sector: 0\nUnits are in 512-byte sectors\n\n      Slot      Start        End          Length       Description\n000:  Meta      0000000000   0000000000   0000000001   Primary Table (#0)\n001:  -------   0000000000   0000002047   0000002048   Unallocated\n002:  000:000   0000002048   0000104447   0000102400   NTFS / exFAT (0x07)\n003:  000:001   0000104448   0040868324   0040763877   NTFS / exFAT (0x07)\n004:  -------   0040868325   0040869887   0000001563   Unallocated\n005:  000:002   0040869888   0041938943   0001069056   Unknown Type (0x27)\n006:  -------   0041938944   0041943039   0000004096   Unallocated"
      },
      {
        "title": "Command",
        "content": "",
        "code": "fls -o 104448 -pr Dead_OS.vhd | rg -i \"hidden|vault|key|flag|secret|lock|message\" | head -n 30"
      },
      {
        "title": "Output (relevant lines)",
        "content": "This is the strongest lead: `HiddenApp/key.zip`.\n\n---",
        "code": "r/r 109998-128-1:  Users/You/AppData/Roaming/HiddenApp/key.zip\nr/r 110020-128-4:  Users/You/AppData/Roaming/Microsoft/Windows/Recent/HiddenApp.lnk\nr/r 108874-128-1:  Users/You/AppData/Roaming/Microsoft/Windows/Recent/key.lnk"
      },
      {
        "title": "Command",
        "content": "",
        "code": "icat -o 104448 Dead_OS.vhd 109998-128-1 > key.zip\n7z l -slt key.zip"
      },
      {
        "title": "Output",
        "content": "So `key.txt` exists but ZIP is encrypted.\n\n---",
        "code": "Path = key.zip\nType = zip\nPhysical Size = 192\n\nPath = key.txt\nSize = 32\nPacked Size = 44\nEncrypted = +\nMethod = ZipCrypto Store"
      },
      {
        "title": "Command",
        "content": "",
        "code": "zip2john key.zip > keyzip.hash\ncat keyzip.hash"
      },
      {
        "title": "Output",
        "content": "",
        "code": "key.zip/key.txt:$pkzip$1*1*2*0*2c*20*ed847557*0*25*0*2c*ed84*598f0c974148d25b81769330b44d6bfb92f07f68b896bf4c0b47a493ab0b674cd8448e35354944887d229481*$/pkzip$:key.txt:key.zip::key.zip"
      },
      {
        "title": "Command",
        "content": "",
        "code": "fcrackzip -u -D -p /usr/share/wordlists/rockyou.txt key.zip"
      },
      {
        "title": "Output",
        "content": "Recovered ZIP password: `Passw0rd123`.\n\n---",
        "code": "PASSWORD FOUND!!!!: pw == Passw0rd123"
      },
      {
        "title": "Command",
        "content": "",
        "code": "unzip -P 'Passw0rd123' -o key.zip -d key_zip_out\ncat key_zip_out/key.txt"
      },
      {
        "title": "Output",
        "content": "That value is exactly 32 bytes, suitable for AES-256 key.\n\n---",
        "code": "ThisIsA32ByteKeyForAES256!!12345"
      },
      {
        "title": "Command",
        "content": "",
        "code": "xxd -g 1 -s 0x150 -l 160 Dead_OS.vhd"
      },
      {
        "title": "Output",
        "content": "ASCII part in that range:\n\n\nThis is a 44-char Base64 blob, which decodes to 32 bytes.\n\n---",
        "code": "00000160: 24 02 c3 69 75 6d 75 68 41 68 35 78 31 4e 57 4e\n00000170: 68 36 54 77 6b 6b 39 78 44 6e 30 5a 77 6c 4b 6e\n00000180: 33 79 4a 37 43 34 46 56 5a 31 7a 2f 50 59 3d 69\n00000190: 6e 67 20 73 79 73 74 65 6d 00 4d 69 73 73 69 6e"
      },
      {
        "title": "Command",
        "content": "",
        "code": "echo -n 'iumuhAh5x1NWNh6Twkk9xDn0ZwlKn3yJ7C4FVZ1z/PY=' | base64 -d > mbr_blob.bin\nKEYHEX=$(echo -n 'ThisIsA32ByteKeyForAES256!!12345' | xxd -p -c 256)\nopenssl enc -d -aes-256-ecb -K \"$KEYHEX\" -nopad -in mbr_blob.bin | xxd\nopenssl enc -d -aes-256-ecb -K \"$KEYHEX\" -nopad -in mbr_blob.bin"
      },
      {
        "title": "Output",
        "content": "Plaintext (trim control byte `0x01` at end):\n\n\n---",
        "code": "00000000: 4949 4954 4c7b 3533 7231 3075 356c 7921  IIITL{53r10u5ly!\n00000010: 215f 555f 5233 7631 7633 645f 3174 7d01  !_U_R3v1v3d_1t}."
      },
      {
        "title": "Output",
        "content": "Optional mode (read key from ZIP directly):",
        "code": "IIITL{53r10u5ly!!_U_R3v1v3d_1t}"
      },
      {
        "title": "Output",
        "content": "",
        "code": "IIITL{53r10u5ly!!_U_R3v1v3d_1t}"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport argparse\r\nimport base64\r\nimport re\r\nimport sys\r\nimport zipfile\r\nfrom pathlib import Path\r\n\r\n\r\nDEFAULT_KEY = b\"ThisIsA32ByteKeyForAES256!!12345\"\r\nDEFAULT_B64_OFFSET = 0x163\r\nDEFAULT_B64_LEN = 44\r\n\r\n\r\ndef aes256_ecb_decrypt(ciphertext: bytes, key: bytes) -> bytes:\r\n    try:\r\n        from Crypto.Cipher import AES  # type: ignore\r\n\r\n        return AES.new(key, AES.MODE_ECB).decrypt(ciphertext)\r\n    except Exception:\r\n        import subprocess\r\n\r\n        p = subprocess.run(\r\n            [\"openssl\", \"enc\", \"-d\", \"-aes-256-ecb\", \"-K\", key.hex(), \"-nopad\"],\r\n            input=ciphertext,\r\n            stdout=subprocess.PIPE,\r\n            stderr=subprocess.PIPE,\r\n            check=False,\r\n        )\r\n        if p.returncode != 0:\r\n            raise RuntimeError(p.stderr.decode(errors=\"ignore\").strip())\r\n        return p.stdout\r\n\r\n\r\ndef read_hidden_b64_from_mbr(vhd_path: Path) -> str:\r\n    with vhd_path.open(\"rb\") as f:\r\n        mbr = f.read(512)\r\n\r\n    if len(mbr) < 512:\r\n        raise RuntimeError(\"Failed to read 512-byte MBR sector.\")\r\n\r\n    candidate = mbr[DEFAULT_B64_OFFSET : DEFAULT_B64_OFFSET + DEFAULT_B64_LEN].decode(\r\n        \"ascii\", errors=\"ignore\"\r\n    )\r\n    if re.fullmatch(r\"[A-Za-z0-9+/=]{20,}\", candidate):\r\n        return candidate\r\n\r\n    m = re.search(rb\"([A-Za-z0-9+/]{20,}={0,2})\", mbr)\r\n    if not m:\r\n        raise RuntimeError(\"No base64-like blob found in MBR.\")\r\n    return m.group(1).decode()\r\n\r\n\r\ndef read_key_from_zip(key_zip: Path, password: str) -> bytes:\r\n    with zipfile.ZipFile(key_zip, \"r\") as zf:\r\n        names = zf.namelist()\r\n        if not names:\r\n            raise RuntimeError(\"key.zip has no entries.\")\r\n        raw = zf.read(names[0], pwd=password.encode())\r\n    return raw.strip()\r\n\r\n\r\ndef main() -> int:\r\n    ap = argparse.ArgumentParser(description=\"Dead OS solver\")\r\n    ap.add_argument(\"--vhd\", default=\"Dead_OS.vhd\", help=\"Path to Dead_OS.vhd\")\r\n    ap.add_argument(\r\n        \"--key-zip\",\r\n        default=\"key.zip\",\r\n        help=\"Path to key.zip (optional, used with --zip-password)\",\r\n    )\r\n    ap.add_argument(\r\n        \"--zip-password\",\r\n        default=None,\r\n        help=\"Password for key.zip (example: Passw0rd123)\",\r\n    )\r\n    args = ap.parse_args()\r\n\r\n    vhd_path = Path(args.vhd)\r\n    if not vhd_path.exists():\r\n        print(f\"[!] Missing VHD: {vhd_path}\", file=sys.stderr)\r\n        return 1\r\n\r\n    key = DEFAULT_KEY\r\n    if args.zip_password is not None:\r\n        key_zip = Path(args.key_zip)\r\n        if not key_zip.exists():\r\n            print(f\"[!] Missing key zip: {key_zip}\", file=sys.stderr)\r\n            return 1\r\n        key = read_key_from_zip(key_zip, args.zip_password)[:32]\r\n\r\n    if len(key) != 32:\r\n        print(f\"[!] Key length must be 32, got {len(key)}\", file=sys.stderr)\r\n        return 1\r\n\r\n    b64_blob = read_hidden_b64_from_mbr(vhd_path)\r\n    ciphertext = base64.b64decode(b64_blob)\r\n    plaintext = aes256_ecb_decrypt(ciphertext, key)\r\n    decoded = plaintext.decode(\"utf-8\", errors=\"ignore\")\r\n    flag = \"\".join(ch for ch in decoded if ch.isprintable())\r\n\r\n    print(flag)\r\n    if not flag.startswith(\"IIITL{\"):\r\n        print(\"[!] Decryption done, but result does not look like a flag.\", file=sys.stderr)\r\n        return 2\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "IIITL{53r10u5ly!!_U_R3v1v3d_1t}",
    "lessonsLearned": ""
  }
];
