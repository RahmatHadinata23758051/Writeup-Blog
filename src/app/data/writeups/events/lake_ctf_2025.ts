import type { WriteUp } from '../types';

// Lake CTF 2025 — 1 writeup
export const lakeCtf2025Writeups: WriteUp[] = [
  {
    "id": "8",
    "title": "Wordler Solver 1",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2025-02-24",
    "author": "CTF Team",
    "ctfName": "Lake CTF 2025",
    "description": "Multi-word Wordle variant with ANSI color-coded feedback. Develop an automated solver using dictionary-based word refinement and ANSI escape code parsing to solve within 6 guesses across multiple game sessions.",
    "problemDescription": "A server-based game combining Wordle mechanics with multiple words separated by underscores. Game structure (word lengths) changes per connection. Each guess receives color-coded feedback via ANSI escape codes (green=correct position, yellow=wrong position, grey=not in word). Maximum 6 guesses per session. Solver must parse variable-length word structures, extract color feedback, refine guesses iteratively, and retrieve the flag from successful solutions.",
    "tools": [
      "Python 3",
      "Regex",
      "Socket Programming",
      "ANSI Escape Code Parsing",
      "Dictionary-based Wordlist"
    ],
    "analysis": "The challenge presents several key technical requirements:\n\n1. **Variable Structure**: Each connection provides a different word-length pattern (e.g., [8, 8, 11] for three words)\n2. **ANSI Color Encoding**: Feedback uses escape sequences - \\x1b[92m for green, \\x1b[93m for yellow, \\x1b[90m for grey\n3. **Limited Attempts**: Only 6 guesses per session, but multiple sessions allowed until flag is obtained\n4. **Dictionary Dependency**: Required custom wordlist containing words of all necessary lengths (or use common word dictionary)\n5. **Stateless Guessing**: Each new connection resets the puzzle with different structure and target words",
    "solution": [
      {
        "title": "Parse Server Structure",
        "content": "Extract the puzzle structure from server banner. The structure uses block symbols (■) separated by underscores, where each block represents letter count. Parse this to determine how many words are needed and their respective lengths."
      },
      {
        "title": "Load Dictionary",
        "content": "Prepare a wordlist indexed by word length. For solving efficiency, group all words by their length in a dictionary/hashmap. This allows rapid lookup of valid words matching specific patterns."
      },
      {
        "title": "Initial Guess Selection",
        "content": "For first guess, select the first word from the wordlist for each required length. This provides baseline feedback without optimization. Common strategy: use high-frequency letters in consonant-vowel patterns."
      },
      {
        "title": "ANSI Escape Code Parsing",
        "content": "Parse server response to extract color codes for each letter. Use regex to identify ANSI sequences and map them to color states (Green, Yellow, Grey). Build a color mask per word block.",
        "code": "import re\n\ndef parse_colors(line, block_sizes):\n    color_map = []\n    tmp = ''\n    idx = 0\n    \n    # Pattern matches: \\x1b[9Xm(LETTER)\\x1b[0m where X is 2,3, or 0\n    pattern = r\"\\x1b\\[9([023])m([A-Z])\\x1b\\[0m\"\n    \n    for match in re.finditer(pattern, line):\n        code = match.group(1)\n        if code == '2':    # Green\n            tmp += 'G'\n        elif code == '3':  # Yellow\n            tmp += 'Y'\n        else:              # Grey\n            tmp += '-'\n        \n        if len(tmp) == block_sizes[idx]:\n            color_map.append(tmp)\n            tmp = ''\n            idx += 1\n    \n    return color_map"
      },
      {
        "title": "Iterative Word Refinement",
        "content": "For each color mask feedback, find the next candidate word that:\n- Matches all GREEN positions from previous guess\n- Has not been tried before (avoid repetition)\n- Exists in dictionary for that word length\n\nEach iteration tightens constraints until all letters turn green.",
        "code": "def refine_guess(previous_word, color_mask, used_words):\n    word_length = len(color_mask)\n    \n    for candidate in DICTIONARY[word_length]:\n        if candidate in used_words:\n            continue\n        \n        # Check if candidate matches all green positions\n        valid = True\n        for position, color in enumerate(color_mask):\n            if color == 'G':\n                if previous_word[position] != candidate[position]:\n                    valid = False\n                    break\n        \n        if valid:\n            used_words.add(candidate)\n            return candidate\n    \n    raise RuntimeError(f\"No valid word found for pattern {color_mask}\")"
      },
      {
        "title": "Main Solving Loop",
        "content": "Repeat for multiple game sessions until flag is received:\n1. Parse structure from server\n2. Generate initial guess using first words from each length group\n3. Send guess, receive colored response\n4. Parse colors and refine each word block\n5. Repeat up to 6 times per session\n6. Exit when flag (EPFL{...}) appears in server response",
        "code": "for session in range(300):  # Allow many sessions\n    sock = socket.create_connection((\"chall.polygl0ts.ch\", 6052))\n    \n    # Get structure\n    banner = sock.recv(1024).decode('utf-8')\n    structure = parse_structure(banner)\n    lengths = get_word_lengths(structure)\n    \n    # Initialize guess\n    guess = [DICTIONARY[length][0] for length in lengths]\n    used = set(guess)\n    \n    # Six attempts\n    for attempt in range(6):\n        guess_str = '_'.join(guess)\n        sock.sendall((guess_str + '\\n').encode())\n        \n        response = recv_until(sock, [b'Your guess:', b'EPFL{'])\n        \n        if b'EPFL{' in response:\n            print(\"[+] FLAG FOUND!\")\n            print(response.decode('utf-8'))\n            exit(0)\n        \n        # Parse feedback and refine\n        colors = parse_colors(response, lengths)\n        guess = [refine_guess(g, c, used) for g, c in zip(guess, colors)]\n    \n    sock.close()\n\nprint(\"[+] Puzzle solved after multiple sessions\")"
      }
    ],
    "flag": "EPFL{5CR1P71NG_15_CH34T1NG}",
    "lessonsLearned": "**Input Parsing** - Wordle-variant challenges require robust parsing of variable input formats. Always extract structure before processing to make solving systematic and reliable.\n\n**Terminal Output** - ANSI color codes are common in terminal-based CTF challenges. Regex and character-by-character parsing are essential tools for terminal output analysis.\n\n**Dictionary Optimization** - Dictionary-based solving is effective for word games. Preprocessing by length dramatically improves lookup speed and reduces computation.\n\n**Automation** - Multi-session challenges can be solved by automating the entire workflow within a loop. Stateless puzzles benefit from repeating the attack across many sessions.\n\n**Heuristics** - Limited attempts benefit from greedy/heuristic approaches. Perfect optimization isn't always necessary; smart initial guesses improve convergence.\n\n**Buffer Management** - Terminal output parsing requires careful handling of escape sequences, line breaks, and timing. Use robust buffer management (recv_until patterns) rather than fixed-size reads.\n\n**Strategy** - Consider word frequency and letter distribution for initial guess selection. Starting with common words improves convergence in brute-force word finding approaches."
  }
];
