import { BlogPost } from '../blogTypes';

export const rsaCtfGuide: BlogPost = {
  id: 'rsa-ctf-guide',
  title: 'RSA di CTF: Identifikasi, Analisis, dan Solve (dengan Template Code)',
  date: '2026-08-27',
  excerpt: 'RSA adalah crypto yang paling sering muncul di CTF. Guide ini cover dari pemahaman matematika dasar, cara identifikasi challenge, sampai template code yang bisa langsung dipake — dengan bagian yang perlu diubah setelah analisis di-highlight.',
  tags: ['Crypto', 'CTF', 'RSA', 'Tutorial'],
  author: 'Nattt',
  readTime: '12 min read',
  coverImage: undefined,
  content: `RSA adalah singkatan dari Rivest-Shamir-Adleman, sebuah algoritma kriptografi asymmetric yang ditemukan tahun 1977 dan masih dipakai sampai sekarang. Di CTF, RSA challenge adalah yang paling sering muncul di kategori crypto — dan seringkali jadi pintu masuk untuk memahami cryptography secara keseluruhan.

Artikel ini adalah guide lengkap untuk RSA di CTF. Mulai dari memahami matematika di baliknya, cara identifikasi challenge, workflow analysis, sampai template code yang bisa langsung dipake.

---

## 1. Matematika di Balik RSA

RSA itu dasarnya sederhana: ada fungsi matematika yang mudah dilakukan satu arah tapi sangat sulit dibalik tanpa kunci tertentu.

### Kunci Publik dan Kunci Privat

RSA bekerja dengan sepasang kunci:

\`\`\`
Kunci Publik: (n, e)
Kunci Privat: (n, d)
\`\`\`

Di mana:
- **n** = modulus, hasil kali dua bilangan prima besar (p × q)
- **e** = public exponent, biasanya 65537 (0x10001)
- **d** = private exponent, inverse modulo dari e terhadap phi(n)

### Langkah-langkah RSA

**1. Key Generation (Pembuatan Kunci)**
\`\`\`
p, q = dua bilangan prima besar (random)
n = p × q
phi(n) = (p - 1) × (q - 1)
e = 65537 (umumnya)
d = e⁻¹ mod phi(n)  // inverse modulo
\`\`\`

**2. Encryption (Enkripsi)**
\`\`\`
c = m^e mod n
\`\`\`
Pesan m (dalam bentuk integer) dipangkatkan dengan e, lalu dimodulo dengan n. Hasilnya adalah ciphertext c.

**3. Decryption (Dekripsi)**
\`\`\`
m = c^d mod n
\`\`\`
Ciphertext c dipangkatkan dengan d, lalu dimodulo dengan n. Hasilnya kembali jadi pesan asli m.

### Contoh Perhitungan (Disimpan untuk Pemahaman)

\`\`\`
Misal p = 61, q = 53

n = 61 × 53 = 3233
phi(n) = (61-1) × (53-1) = 60 × 52 = 3120

e = 17 (contoh sederhana)

d = e⁻¹ mod phi(n)
  = 17⁻¹ mod 3120
  = 2753

Public key: (3233, 17)
Private key: (3233, 2753)

Encryption:
m = 42
c = 42^17 mod 3233 = 2557

Decryption:
m = 2557^2753 mod 3233 = 42 ✓
\`\`\`

Di CTF, kamu biasanya dapat public key dan ciphertext. Tujuannya adalah mendapatkan plaintext tanpa private key — atau mendapatkan private key itu sendiri.

---

## 2. Cara Identifikasi RSA Challenge

Ini langkah pertama yang sering dilewatkan. Sebelum mulai solve, pastikan kamu tahu apa yang kamu hadapi.

### Step 1: Cek Format File

RSA challenge di CTF biasanya disajikan dalam format:

**PEM format (paling umum):**
\`\`\`
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...
-----END PUBLIC KEY-----
\`\`\`

**Traditional RSA key:**
\`\`\`
-----BEGIN RSA PUBLIC KEY-----
MIIBCgK...
-----END RSA PUBLIC KEY-----
\`\`\`

** openssl output:**
\`\`\`
Public Exponent: 65537 (0x10001)
Modulus=
    00:c0:6b:89:32:7f:4a:f9:8b:...
\`\`\`

### Step 2: Cek Number Patterns

Kalau lihat ciphertext atau nilai n, e, d, ini indikasinya:

| Pattern | Kemungkinan |
|---------|-------------|
| Hex panjang (512-4096 bit) | RSA modulus atau ciphertext |
| Desimal sangat besar (>200 digit) | RSA modulus |
| Bilangan base64 di antara marker PEM | Public/private key |
| File .key, .pem, .pub | Key files |

### Step 3: Cek Challenge Description

Baca deskripsi challenge dengan teliti:

- **"Decrypt this message"** → decrypt ciphertext biasa
- **"Given that p and q are too close"** → hint untuk Prime Collision
- **"Small private exponent"** → Wiener/Boneh-Durfee
- **"No padding"** → textbook RSA vulnerability
- **"Same modulus used twice"** → Common Modulus attack
- **"Oracle"** → Oracle attack (timing, LSB, etc)

### Step 4: Grab Informasi dengan Openssl

\`\`\`
# Ambil public key dari PEM
openssl rsa -pubin -in public.pem -text -noout

# Ambil modulus dan exponent
openssl rsa -pubin -in public.pem -text -noout -modulus

# Convert ke format yang bisa diproses Python
openssl rsa -pubin -in public.pem -RSAPublicKey_out -text
\`\`\`

---

## 3. Analysis Workflow

Setelah identifikasi, ini langkah sistematis untuk menentukan attack mana yang perlu dipakai.

### Step 1: Ukuran Kunci

\`\`\`
Key Size    | Keterangan
------------|------------------
< 512 bit   | Bisa difactor langsung dengan tool
512-768 bit | Faktorisasi doable dengan cado-nfs / yafu
768-1024   | Butuh effort, mungkin butuh hints
> 1024 bit | Kemungkinan ada vulnerability lain
\`\`\`

### Step 2: Cek Nilai e

| e | Attack |
|---|--------|
| 3 | Low exponent attack (small message) |
| 65537 (0x10001) | Normal, cari weakness lain |
| 1 | m = c mod n (trivial) |
| 2 | Bleichenbacher attack variant |

### Step 3: Check untuk Known Weakness

\`\`\`
Pertanyaan Checklist:
□ Apakah n bisa difactor dari factordb?
□ Apakah p dan q terlalu dekat? (|p-q| kecil)
□ Apakah d terlalu kecil? (Wiener attack possible)
□ Apakah dua ciphertext pakai n yang sama?
□ Apakah ada Oracle tersedia?
□ Apakah ada bagian plaintext yang known?
\`\`\`

### Step 4: Tool Recommendation

| Situation | Tool |
|-----------|------|
| n bisa difactor | RsaCtfTool, factordb |
| Wiener attack | RsaCtfTool, custom script |
| Common modulus | RsaCtfTool, custom script |
| LSB Oracle | Openssl + custom script |
| Known plaintext | RsaCtfTool |
| Small message | CyberChef, manual calc |

---

## 4. Template Code untuk Solve

Bagian ini yang kamu minta: template code yang siap dipake, dengan bagian "CHANGE THIS" yang perlu diubah setelah analisis.

### Template 1: Decrypt dengan Private Key

Dipakai kalau: kamu punya private key atau bisa mendapatkan d.

\`\`\`python
#!/usr/bin/env python3
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
import binascii

# ============================================
# CHANGE THIS: Load private key dari file
# ============================================
with open('private.pem', 'r') as f:
    key = RSA.import_key(f.read())

n = key.n
e = key.e
d = key.d

print(f"n = {n}")
print(f"e = {e}")
print(f"d = {d}")
print(f"Key size = {n.bit_length()} bits")

# ============================================
# CHANGE THIS: Ciphertext dalam format apa?
# Pilihan A: dari file hex
# ============================================
with open('ciphertext.hex', 'r') as f:
    ciphertext_hex = f.read().strip()
ciphertext = bytes.fromhex(ciphertext_hex)

# Pilihan B: dari file base64
# with open('ciphertext.b64', 'r') as f:
#     import base64
#     ciphertext = base64.b64decode(f.read())

# ============================================
# CHANGE THIS: Format decrypted output
# ============================================
cipher = PKCS1_v1_5.new(key)
sentinel = b'ERROR'
message = cipher.decrypt(ciphertext, sentinel)

if message != sentinel:
    print(f"Decrypted: {message}")
    # Coba decode sebagai ASCII
    try:
        print(f"ASCII: {message.decode('ascii')}")
    except:
        print(f"Hex: {message.hex()}")
else:
    print("Decryption failed!")
\`\`\`

### Template 2: Decrypt dari Public Key (n, e diketahui)

Dipakai kalau: ada public key, ciphertext, tapi tidak ada private key. Mencari d dengan memfaktor n.

\`\`\`python
#!/usr/bin/env python3
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
import gmpy2

# ============================================
# CHANGE THIS: Informasi dari public key
# ============================================
with open('public.pem', 'r') as f:
    key = RSA.import_key(f.read())

n = key.n
e = key.e

# Alternatif: Load dari text langsung
# n = 0xc0e2e850...
# e = 65537

print(f"n = {n}")
print(f"e = {e}")
print(f"Key size = {n.bit_length()} bits")

# ============================================
# CHANGE THIS: Pilih metode mendapatkan p, q
# ============================================

# METODE 1: factordb (untuk n kecil)
# import requests
# def factor_with_factordb(n):
#     url = f"https://factordb.com/index.php?query={n}"
#     # Manual check atau pakai script untuk parse
#     pass

# METODE 2: gmpy2 is_prime + trial division (untuk n sangat kecil)
# def simple_factor(n):
#     p = 2
#     while p * p <= n:
#         if n % p == 0:
#             return p, n // p
#         p += 1
#     return None

# METODE 3: yafu (external, lebih cepat)
# Run: yafu "factor(n)"

# METODE 4: Pollard's Rho (medium size)
def pollards_rho(n):
    if n % 2 == 0:
        return 2
    x = 2
    y = 2
    d = 1
    f = lambda x: (x**2 + 1) % n
    while d == 1:
        x = f(x)
        y = f(f(y))
        d = gmpy2.gcd(abs(x - y), n)
    if d != n:
        return d, n // d
    return None

# ============================================
# Faktorisasi n untuk dapat p dan q
# CHANGE THIS: Pilih metode yang sesuai
# ============================================
print("Mencoba faktorisasi n...")

# Coba pollards_rho dulu
result = pollards_rho(n)
if result:
    p, q = result
    print(f"Berhasil! p = {p}, q = {q}")
else:
    print("Pollard's Rho gagal, coba metode lain...")
    # CHANGE THIS: Run yafu atau manual di factordb

# ============================================
# Hitung d dari p, q
# ============================================
phi_n = (p - 1) * (q - 1)
d = gmpy2.invert(e, phi_n)
print(f"d = {d}")

# ============================================
# Decrypt ciphertext
# CHANGE THIS: Sesuaikan format ciphertext
# ============================================
with open('ciphertext.hex', 'r') as f:
    ciphertext = bytes.fromhex(f.read().strip())

# Manual decrypt
c = int.from_bytes(ciphertext, 'big')
m = pow(c, d, n)
message = m.to_bytes((m.bit_length() + 7) // 8, 'big').lstrip(b'\\x00')

print(f"Decrypted: {message}")
try:
    print(f"ASCII: {message.decode('ascii')}")
except:
    pass
\`\`\`

### Template 3: Wiener's Attack (n, e, c dalam desimal/heksadesimal)

Dipakai kalau: challenge-nya dari netcat (NC) atau pastebin, bukan file PEM. Contoh format:

\`\`\`
n = 10655451837177386648362767829273826137475116589812070148262926595565317780547891329678971102873105311544243822138861415296019006594088611059956713759675939
e = 65537
ct = 8592344971334636877159138247790977054260889864660976583686677325889991368465204217861400261340636639175582441953042363137355344035543439048636331157784179
\`\`\`

Atau format hex:

\`\`\`
n = 0xc0e2e850...
e = 0x10001
ct = 0x4a5b6c7d...
\`\`\`

\`\`\`python
#!/usr/bin/env python3
import gmpy2

# ============================================
# CHANGE THIS: Copy paste dari challenge NC/soal
# ============================================

# Format 1: Desimal (dari contoh kamu)
n = 10655451837177386648362767829273826137475116589812070148262926595565317780547891329678971102873105311544243822138861415296019006594088611059956713759675939
e = 65537
c = 8592344971334636877159138247790977054260889864660976583686677325889991368465204217861400261340636639175582441953042363137355344035543439048636331157784179

# Format 2: Heksadesimal (kalau challenge kasih hex)
# n = 0xc0e2e850f4...
# e = 0x10001
# c = 0x4a5b6c7d8e...

# ============================================
# CHANGE THIS: Jangan diubah
# ============================================
print(f"n = {n}")
print(f"e = {e}")
print(f"c = {c}")
print(f"Key size = {n.bit_length()} bits")

# ============================================
# Cek apakah n ada di factordb
# CHANGE THIS: Bisa dihapus kalau sudah tahu n bisa difactor
# ============================================
print("\\n[1] Cek factordb...")
print(f"    Buka: https://factordb.com/index.php?query={n}")
print("    Kalau kedua factor sudah ada, langsung copy paste di bawah")

# ============================================
# Manual faktorisasi
# CHANGE THIS: Paste hasil dari factordb atau hitung sendiri
# ============================================
print("\\n[2] Faktorisasi n...")

# METODE A: Langsung dari factordb (kalau sudah ketemu)
# p, q = 123456789012345678901234567890123, 987654321098765432109876543210987

# METODE B: Pollard's Rho (untuk n medium)
def pollards_rho(n):
    if n % 2 == 0:
        return 2, n // 2
    x = 2
    y = 2
    d = 1
    f = lambda x: (x**2 + 1) % n
    while d == 1:
        x = f(x)
        y = f(f(y))
        d = gmpy2.gcd(abs(x - y), n)
    if d != n:
        return d, n // d
    return None

result = pollards_rho(n)
if result:
    p, q = result
    print(f"    Pollard's Rho berhasil!")
    print(f"    p = {p}")
    print(f"    q = {q}")
else:
    print("    Pollard's Rho gagal, cek factordb manual")
    # CHANGE THIS: Paste hasil manual di sini
    # p = int(input("Masukkan p: "))
    # q = int(input("Masukkan q: "))
    p = None  # <-- ISI MANUAL

# ============================================
# Hitung d
# ============================================
if p:
    phi_n = (p - 1) * (q - 1)
    d = gmpy2.invert(e, phi_n)
    print(f"\\n[3] Private exponent:")
    print(f"    d = {d}")

    # ============================================
    # Decrypt
    # ============================================
    print("\\n[4] Decrypting...")
    m = pow(c, d, n)
    print(f"    m (integer) = {m}")

    # Convert ke bytes
    message_bytes = m.to_bytes((m.bit_length() + 7) // 8, 'big')

    print(f"    m (hex) = {message_bytes.hex()}")
    print(f"    m (ascii) = {message_bytes}")

    # ============================================
    # Extract flag
    # CHANGE THIS: Format flag sesuai challenge
    # ============================================
    try:
        text = message_bytes.decode('utf-8')
        print(f"\\n[5] Result: {text}")
        # Cari flag format
        if 'flag{' in text or 'CTF{' in text:
            import re
            match = re.search(r'(flag\{[^}]+\}|CTF\{[^}]+\})', text)
            if match:
                print(f"    FLAG: {match.group(1)}")
    except:
        print("    Tidak bisa decode UTF-8, coba hex decode")
        print(f"    Hex: {message_bytes.hex()}")
\`\`\`

**Step-by-step untuk soal kamu:**

\`\`\`
Given:
p = 10655451837177386648362767829273826137475116589812070148262926595565317780547891329678971102873105311544243822138861415296019006594088611059956713759675939
ct = 8592344971334636877159138247790977054260889864660976583686677325889991368465204217861400261340636639175582441953042363137355344035543439048636331157784179
\`\`\`

Wait — ini format yang beda. p-nya dikasih langsung, bukan n. Ini artinya:

\`\`\`
e = 65537 (default)
ct = ciphertext

Decrypt langsung: m = ct^d mod n

Tapi kita perlu q dulu...
\`\`\`

Kalau dari soal kamu yang dikasih **p langsung** (bukan n), berarti:

1. **Cek dulu** — apakah q juga dikasih? Atau apakah hanya p?
2. **Kalau hanya p** — kemungkinan q di-hidden somewhere, atau perlu dicari
3. **Langsung decrypt** kalau n dan d bisa dihitung

\`\`\`python
#!/usr/bin/env python3
import gmpy2

# ============================================
# CHANGE THIS: Dari soal NC kamu
# ============================================
# Kalau dikasih p langsung (bukan n):
p = 10655451837177386648362767829273826137475116589812070148262926595565317780547891329678971102873105311544243822138861415296019006594088611059956713759675939
e = 65537  # Default biasanya

# Kalau ada q juga:
# q = ...

# Ciphertext
ct = 8592344971334636877159138247790977054260889864660976583686677325889991368465204217861400261340636639175582441953042363137355344035543439048636331157784179

# ============================================
# CHANGE THIS: Sesuaikan dengan info yang dikasih
# ============================================

# Kalau ada n (p × q):
# n = p * q

# Kalau dikasih n langsung:
n = None  # <-- ISI n JIKA ADA

# Kalau dikasih q juga:
q = None  # <-- ISI q JIKA ADA

# ============================================
# Hitung dari p (kalau q ada / n ada)
# ============================================
if n is None and q:
    n = p * q

if n:
    phi_n = (p - 1) * (q - 1)
    d = gmpy2.invert(e, phi_n)
    print(f"n = {n}")
    print(f"d = {d}")
else:
    print("n belum diketahui - butuh informasi tambahan")

    # ============================================
    # Kalau hanya p dan ct, kemungkinan:
    # 1. q disembunyikan (cek deskripsi soal)
    # 2. p adalah private key exponent (?)
    # 3. Format berbeda - cek lagi soalnya
    # ============================================
    print("\\nHint: cek lagi apakah ada informasi lain di soal")
    print("    - n = p × q")
    print("    - Mungkin ada 'n = ...' di atas 'p = ...'?")
\`\`\`

**Tips untuk format NC:**

1. **Copy semua angka** dari output NC — kadang ada info tambahan
2. **Cek apakah p atau n** — kalau dikasih p langsung, biasanya ada q juga
3. **Default e = 65537** kecuali specified otherwise
4. **Kalau error** — kemungkinan ct dalam hex, convert dulu dengan prefix 0x

### Template 4: Wiener's Attack (d terlalu kecil)

Dipakai kalau: private exponent d terlalu kecil relatif terhadap n.

\`\`\`python
#!/usr/bin/env python3
import gmpy2
import continued_fraction

# ============================================
# CHANGE THIS: Masukkan n dan e dari public key
# ============================================
n = 0xa56d16ac40d3c1d0f0c39e98bbbe4a8ec4db9...
e = 65537

print(f"n = {n}")
print(f"e = {e}")

# ============================================
# Wiener's Attack Implementation
# CHANGE THIS: Biasanya tidak perlu diubah
# ============================================
def wiener_attack(n, e):
    """
    Wiener's attack on RSA with small d.
    Berlaku jika d < n^(1/4) / 3
    """
    fractions = continued_fraction.Fraction(e, n)
    
    convergents = fractions.convergents()
    
    for k, d in convergents:
        if k == 0:
            continue
        
        phi = (e * d - 1) // k
        
        if phi == 0:
            continue
        
        if (n - phi + 1) % 2 != 0:
            continue
        
        # Hitung p dan q dari phi
        # n = p*q
        # phi = (p-1)(q-1) = pq - p - q + 1 = n - p - q + 1
        # q^2 - (n - phi + 1)q + n = 0
        
        disc = (n - phi + 1)**2 - 4*n
        if disc < 0:
            continue
        
        sqrt_disc = gmpy2.isqrt(disc)
        if sqrt_disc * sqrt_disc != disc:
            continue
        
        p = ((n - phi + 1) + sqrt_disc) // 2
        q = n // p
        
        if p * q == n and p > 1 and q > 1:
            print(f"Berhasil! d = {d}")
            print(f"p = {p}")
            print(f"q = {q}")
            return d, p, q
    
    return None

# ============================================
# CHANGE THIS: Run attack
# ============================================
result = wiener_attack(n, e)
if result:
    d, p, q = result
    print(f"\\nFound private key!")
    print(f"d = {d}")
    
    # Sekarang decrypt ciphertext
    # ... (pakai template decrypt)
else:
    print("\\nWiener attack gagal, d mungkin tidak cukup kecil")
\`\`\`

### Template 5: Common Modulus Attack

Dipakai kalau: dua orang berbeda mengirim pesan ke orang yang sama dengan modulus n yang sama.

\`\`\`python
#!/usr/bin/env python3
import gmpy2

# ============================================
# CHANGE THIS: Informasi dari challenge
# ============================================

# Ciphertext 1
c1 = 0x1a2b3c4d...
e1 = 65537

# Ciphertext 2
c2 = 0x5e6f7a8b...
e2 = 65537

# Modulus (sama untuk keduanya)
n = 0xabcd1234...

# ============================================
# Common Modulus Attack
# CHANGE THIS: Biasanya tidak perlu diubah
# ============================================
def common_modulus_attack(c1, c2, e1, e2, n):
    """
    Kalau ada dua ciphertext dengan e berbeda tapi n sama.
    Bisa dekrip kalau gcd(e1, e2) = 1
    """
    gcd, s1, s2 = gmpy2.gcdext(e1, e2)
    
    if gcd != 1:
        print(f"gcd(e1, e2) = {gcd}, tidak sama dengan 1")
        return None
    
    # s1 * e1 + s2 * e2 = 1
    m = (pow(c1, s1, n) * pow(c2, s2, n)) % n
    
    return m

# ============================================
# CHANGE THIS: Run attack
# ============================================
m = common_modulus_attack(c1, c2, e1, e2, n)
if m:
    print(f"m = {m}")
    message = m.to_bytes((m.bit_length() + 7) // 8, 'big').lstrip(b'\\x00')
    print(f"Message: {message}")
    try:
        print(f"ASCII: {message.decode('ascii')}")
    except:
        pass
\`\`\`

### Template 6: Low Public Exponent Attack (e=3)

Dipakai kalau: e = 3 dan message terlalu kecil.

\`\`\`python
#!/usr/bin/env python3
import gmpy2

# ============================================
# CHANGE THIS: e harus = 3
# ============================================
e = 3
n = 0x...
c = 0x...

print(f"e = {e} (low exponent!)")
print(f"n = {n}")
print(f"c = {c}")

# ============================================
# Low Exponent Attack
# CHANGE THIS: Biasanya tidak perlu diubah
# ============================================
def low_exponent_attack(c, e, n):
    """
    Kalau message m sangat kecil sehingga m^e < n,
    maka c = m^e tanpa modulo.
    
    Bisa juga pakai Chinese Remainder Theorem
    kalau ada multiple ciphertexts.
    """
    # Hitung pangkat ke-e直接从 c
    m = gmpy2.iroot(c, e)
    
    if m[1]:  # exact e-th root
        return m[0]
    
    print("Root tidak exact, kemungkinan m^e > n")
    return None

# ============================================
# CHANGE THIS: Run attack
# ============================================
m = low_exponent_attack(c, e, n)
if m:
    message = m.to_bytes((m.bit_length() + 7) // 8, 'big').lstrip(b'\\x00')
    print(f"Message: {message}")
\`\`\`

### Template 7: Boneh-Durfee Attack (d ≈ n^0.292)

Dipakai kalau: Wiener's attack gagal, tapi d masih relatif kecil.

\`\`\`python
#!/usr/bin/env python3
"""
Boneh-Durfee Attack

Dipakai kalau:
- Wiener's attack gagal (d > n^0.25)
- Tapi d < n^0.292

Ini lebih advanced dan butuh implementasi yang lebih panjang.
Saya rekomendasikan pakai RsaCtfTool untuk attack ini.
"""

# ============================================
# CHANGE THIS: Run di terminal
# ============================================
# RsaCtfTool punya implementasi Boneh-Durfee yang bagus
# 
# python3 RsaCtfTool.py \
#     --publickey public.pem \
#     --private \
#     --attack boneh_durfee
#
# Atau dengan known vulnerability:
# python3 RsaCtfTool.py \
#     --publickey public.pem \
#     --ciphertext ciphertext.hex \
#     --attack boneh_durfee

print("Gunakan RsaCtfTool untuk Boneh-Durfee attack")
print("Attack ini cukup kompleks dan lebih baik menggunakan tool yang sudah ada")
\`\`\`

---

## 5. Checklist Sebelum Solve

Sebelum mulai coding, jalankan checklist ini:

\`\`\`
□ Apakah n ada di factordb?
  → factordb.com，输入 n untuk cek

□ Apakah key size < 512 bit?
  → Bisa difactor langsung dengan RsaCtfTool

□ Apakah e = 3?
  → Low exponent attack

□ Apakah description hint ke Wiener atau Boneh-Durfee?
  → Pakai template yang sesuai

□ Apakah ada dua ciphertext dengan n sama?
  → Common modulus attack

□ Apakah ada oracle/website/server?
  → Oracle attack

□ Apakah ada partial information?
  → Known plaintext/prefix attack
\`\`\`

---

## 6. Tool yang Saya Pakai

| Tool | Uso |
|------|-----|
| **RsaCtfTool** | All-in-one, hampir semua attack |
| **factordb** | Cek apakah n sudah difactor orang |
| **yafu** | Faktorisasi cepat untuk n medium |
| **openssl** | Extract key dari PEM, konversi format |
| **CyberChef** | Quick decrypt untuk hal sederhana |
| **sagemath** | Math yang lebih advanced |

**Install RsaCtfTool:**
\`\`\`
git clone https://github.com/RsaCtfTool/RsaCtfTool
cd RsaCtfTool
pip install -r requirements.txt
\`\`\`

**Usage dasar:**
\`\`\`
# Auto attack
python3 RsaCtfTool.py --publickey public.pem --uncipherfile ciphertext.enc

# Extract private key
python3 RsaCtfTool.py --publickey public.pem --private

# Specific attack
python3 RsaCtfTool.py --publickey public.pem --attack wiener
\`\`\`

---

## 7. Practice Challenge

Cari challenge RSA di:

- CTFtime.org — filter crypto category
- Root Me — RSA challenges
- CryptoHack.org — interactive crypto learning
- PicoCTF — untuk pemula

Mulai dari yang mudah, naik level pelan-pelan.

---

## 8. Common Pitfalls

**1. Salah decode ciphertext**
Ciphertext biasanya ada di format hex, base64, atau raw bytes. Pastikan decode dengan benar sebelum proses.

**2. Lupa strip padding**
PKCS#1 v1.5 punya padding yang harus di-strip. Pakai library Crypto dari pycryptodome yang sudah handle ini.

**3. Salah penanganan big endian vs little endian**
Python's \`int.from_bytes\` default big endian. Sesuaikan kalau ciphertext pakai format lain.

**4. Key terlalu besar untuk method tertentu**
Pollard's Rho gagal untuk n > 2^768 dengan waktu terbatas. Langsung ke yafu/cado-nfs.

**5. Assuming textbook RSA**
Banyak challenge kasih tahu "no padding" atau "textbook RSA" secara eksplisit. Tanpa hint itu, assume pakai padding standard.

---

## Summary

1. **Identifikasi dulu** — cek format file, ukuran key, nilai e, dan baca deskripsi
2. **Analysis sistematis** — pakai checklist untuk tentukan attack yang sesuai
3. **Pakai template** — pilih template yang cocok, ubah bagian "CHANGE THIS"
4. **Verify output** — flag biasanya dalam format \`flag{...}\` atau \`CTF{...}\`

SSH / SCP / FTP credentials di RSA challenge itu biasanya red herring. Fokus ke decrypt.

Good luck, dan happy hacking!`
};
