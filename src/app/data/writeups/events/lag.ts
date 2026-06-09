import type { WriteUp } from '../types';

// Lag — 1 writeup
export const lagWriteups: WriteUp[] = [
  {
    "id": "lag-crypto-2",
    "title": "2",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "Lag",
    "tags": [],
    "description": "A custom encryption named ProtoCipher67 was made out of Feistel Network practically unbreakable right?!",
    "problemDescription": "A custom encryption named ProtoCipher67 was made out of Feistel Network practically unbreakable right?!\n\nHere is a few amples of original messages before they were encrypted. You now have 5 pairs of Plaintext and their corresponding Ciphertext.\n\nYour mission is to analyze the provided source code for cipher.py, use the known pairs to recover the secret subkeys, and finally decrypt the captured flag.\n\nFiles Provided\n-) cipher.py: The implementation of the ProtoCipher67 algorithm.\n-) pairs.txt: A list of 5 known plaintext/ciphertext pairs.\n-) flag.txt: The encrypted flag file (hex-encoded blocks).\n\nInstructions:\n1) Understand how the 3-round Feistel Network in cipher.py processes data.\n\n2) Mathematically derive the three 16-bit subkeys using the pairs in pairs.txt.\n\n3) Decrypt the blocks in flag.txt to reveal the secret.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "def round_function(block, key):\r\n    res = (block ^ key)\r\n    return ((res << 3) | (res >> 13)) & 0xFFFF\r\n\r\ndef rev_round_function(out):\r\n    # Inverse dari ROL16 3-bit adalah ROR16 3-bit\r\n    return ((out >> 3) | (out << 13)) & 0xFFFF\r\n\r\ndef decrypt(ct_int, subkeys):\r\n    # Split CT back to R3 and L3\r\n    r3 = (ct_int >> 16) & 0xFFFF\r\n    l3 = ct_int & 0xFFFF\r\n    \r\n    # Reverse 3 Rounds\r\n    # Round 3: L3=R2, R3 = L2 ^ F(R2, k3) => L2 = R3 ^ F(R2, k3)\r\n    r2 = l3\r\n    l2 = r3 ^ round_function(r2, subkeys[2])\r\n    \r\n    # Round 2: L2=R1, R2 = L1 ^ F(R1, k2) => L1 = R2 ^ F(R1, k2)\r\n    r1 = l2\r\n    l1 = r2 ^ round_function(r1, subkeys[1])\r\n    \r\n    # Round 1: L1=R0, R1 = L0 ^ F(R0, k1) => L0 = R1 ^ F(R0, k1)\r\n    r0 = l1\r\n    l0 = r1 ^ round_function(r0, subkeys[0])\r\n    \r\n    return (l0 << 16) | r0\r\n\r\n# Data dari pairs.txt\r\npairs = [\r\n    (0xfe2a8ed3, 0xb4d1a3c8),\r\n    (0xc7c0dda5, 0x1b13e27b),\r\n    (0x31325c9d, 0x205e9af4),\r\n    (0xbfc385b3, 0x4f7e7fe0),\r\n    (0x7c5b66aa, 0x59104647)\r\n]\r\n\r\nprint(\"[*] Finding subkeys...\")\r\nfound_keys = None\r\n\r\nfor k3 in range(0x10000):\r\n    # Gunakan pasangan pertama untuk estimasi k1 dan k2\r\n    pt, ct = pairs[0]\r\n    l0, r0 = (pt >> 16), (pt & 0xFFFF)\r\n    r3, l3 = (ct >> 16), (ct & 0xFFFF)\r\n    \r\n    r2 = l3\r\n    r1 = r3 ^ round_function(r2, k3)\r\n    \r\n    # Dari R1 = L0 ^ F(R0, k1) => F(R0, k1) = R1 ^ L0\r\n    k1 = rev_round_function(r1 ^ l0) ^ r0\r\n    \r\n    # Dari R2 = R0 ^ F(R1, k2) => F(R1, k2) = R2 ^ R0\r\n    k2 = rev_round_function(r2 ^ r0) ^ r1\r\n    \r\n    # Validasi dengan pasangan kedua\r\n    pt2, ct2 = pairs[1]\r\n    if decrypt(ct2, [k1, k2, k3]) == pt2:\r\n        found_keys = [k1, k2, k3]\r\n        print(f\"[+] Subkeys found: {[hex(k) for k in found_keys]}\")\r\n        break\r\n\r\nif found_keys:\r\n    print(\"[*] Decrypting flag...\")\r\n    with open(\"flag.txt\", \"r\") as f:\r\n        encrypted_blocks = f.read().splitlines()\r\n    \r\n    flag = \"\"\r\n    for block in encrypted_blocks:\r\n        ct_val = int(block, 16)\r\n        pt_val = decrypt(ct_val, found_keys)\r\n        # Convert 32-bit int to 4 chars\r\n        flag += chr((pt_val >> 24) & 0xFF)\r\n        flag += chr((pt_val >> 16) & 0xFF)\r\n        flag += chr((pt_val >> 8) & 0xFF)\r\n        flag += chr(pt_val & 0xFF)\r\n    \r\n    print(f\"\\nResult: {flag}\")"
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": ""
  }
];
