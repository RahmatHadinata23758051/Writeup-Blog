import { BlogPost } from '../blogTypes';

export const awesomeCtfTools: BlogPost = {
  id: 'awesome-ctf-tools-lengkap',
  title: 'Awesome CTF: Koleksi Tools Lengkap untuk Pemain CTF',
  date: '2026-06-09',
  excerpt: 'Kumpulan tools, platform, resource, dan tutorial terlengkap untuk pemain CTF dari tingkat pemula hingga mahir.',
  tags: ['General', 'Tools', 'CTF', 'Tutorial', 'Resources'],
  author: 'Nattt',
  readTime: '15 min read',
  content: `CTF (Capture The Flag) itu butuh waktu lama buat ngumpulin tools yang tepat dan ngapalin semuanya. Repo [Awesome CTF](https://github.com/apsdehal/awesome-ctf) ada buat ngatasi masalah itu — semua tools, platform, dan resource dikumpulin di satu tempat.

Artikel ini versi blog-nya: lengkap, ada penjelasan singkat tiap tool, dan dibagi per kategori biar gampang dicari.

---

## Create

Tools dan platform buat bikin soal CTF sendiri.

**[Kali Linux CTF Blueprints](https://www.packtpub.com/eu/networking-and-servers/kali-linux-ctf-blueprints)** — Buku online tentang cara membangun, menguji, dan mengkustomisasi soal CTF dari nol.

### Forensics

- **[Dnscat2](https://github.com/iagox86/dnscat2)** — Komunikasi tersembunyi lewat protokol DNS. Berguna buat bikin soal exfiltration.
- **[KAPE](https://learn.duffandphelps.com/kape)** — Kroll Artifact Parser and Extractor. Program triage untuk forensik digital.
- **[Magnet AXIOM](https://www.magnetforensics.com/downloadaxiom)** — Tool DFIR berbasis artefak.
- **[Registry Dumper](http://www.kahusecurity.com/posts/registry_dumper_find_and_dump_hidden_registry_keys.html)** — Dump hidden registry keys di Windows.

### Platforms

- **[CTFd](https://github.com/isislab/CTFd)** — Platform paling populer untuk host CTF gaya Jeopardy. Buatan ISISLab, NYU Tandon.
- **[echoCTF.RED](https://github.com/echoCTF/echoCTF.RED)** — Develop, deploy, dan maintain infrastruktur CTF sendiri.
- **[FBCTF](https://github.com/facebook/fbctf)** — Platform dari Facebook dengan visualisasi peta dunia yang keren untuk tracking tim peserta.
- **[Haaukins](https://github.com/aau-network-security/haaukins)** — Platform virtualisasi yang highly accessible dan automated untuk edukasi keamanan.
- **[HackTheArch](https://github.com/mcpa-stlouis/hack-the-arch)** — CTF scoring platform.
- **[Mellivora](https://github.com/Nakiami/mellivora)** — CTF engine yang ditulis dalam PHP.
- **[MotherFucking-CTF](https://github.com/andreafioraldi/motherfucking-ctf)** — Platform super ringan tanpa JS sama sekali.
- **[NightShade](https://github.com/UnrealAkama/NightShade)** — Framework CTF yang simpel dan straightforward.
- **[OpenCTF](https://github.com/easyctf/openctf)** — CTF in a box. Setup minimal, cocok buat event internal.
- **[PicoCTF](https://github.com/picoCTF/picoCTF)** — Framework yang dipakai picoCTF, salah satu CTF terbesar untuk pelajar.
- **[PyChallFactory](https://github.com/pdautry/py_chall_factory)** — Framework kecil untuk create/manage/package soal CTF gaya Jeopardy.
- **[RootTheBox](https://github.com/moloch--/RootTheBox)** — A Game of Hackers. CTF Scoreboard dan Game Manager, fokus ke format Attack-Defense.
- **[Scorebot](https://github.com/legitbs/scorebot)** — Platform CTF buatan Legitbs (Defcon).
- **[SecGen](https://github.com/cliffe/SecGen)** — Security Scenario Generator. Bikin virtual machine yang vulnerable secara acak.

### Steganography

Untuk tools membuat soal stego, cek bagian Solve > Steganography di bawah.

### Web — JavaScript Obfuscators

- **[Metasploit JavaScript Obfuscator](https://github.com/rapid7/metasploit-framework/wiki/How-to-obfuscate-JavaScript-in-Metasploit)** — Obfuscate JavaScript lewat Metasploit Framework.
- **[Uglify](https://github.com/mishoo/UglifyJS)** — Minifier dan obfuscator JavaScript yang populer.

---

## Solve

### Attacks

- **[Bettercap](https://github.com/bettercap/bettercap)** — Framework untuk MITM (Man in the Middle) attacks.
- **[Yersinia](https://github.com/tomac/yersinia)** — Serang berbagai protokol di layer 2.

### Bruteforcers

- **[Hashcat](https://hashcat.net/hashcat/)** — Password cracker tercepat di dunia, support GPU acceleration dan ratusan jenis hash.
- **[Hydra](https://tools.kali.org/password-attacks/hydra)** — Login brute-force paralel yang support banyak protokol: SSH, FTP, HTTP, RDP, dll.
- **[John The Jumbo](https://github.com/magnumripper/JohnTheRipper)** — Versi community-enhanced dari John the Ripper.
- **[John The Ripper](http://www.openwall.com/john/)** — Password cracker klasik, sangat kuat untuk format hash Unix/Linux.
- **[Nozzlr](https://github.com/intrd/nozzlr)** — Bruteforce framework yang modular dan script-friendly.
- **[Ophcrack](http://ophcrack.sourceforge.net/)** — Windows password cracker berbasis rainbow tables.
- **[Patator](https://github.com/lanjelot/patator)** — Multi-purpose brute-forcer dengan desain modular.
- **[Turbo Intruder](https://portswigger.net/research/turbo-intruder-embracing-the-billion-request-attack)** — Burp Suite extension untuk mengirim HTTP request dalam jumlah sangat besar.

### Cryptography

- **[CyberChef](https://gchq.github.io/CyberChef)** — Web app dari GCHQ untuk analisis dan decode data. Ratusan operasi tersedia via drag-and-drop. Wajib dibookmark.
- **[FeatherDuster](https://github.com/nccgroup/featherduster)** — Tool kriptanalisis otomatis dan modular. Bisa mendeteksi jenis cipher secara otomatis.
- **[Hash Extender](https://github.com/iagox86/hash_extender)** — Tool untuk melakukan hash length extension attacks.
- **[padding-oracle-attacker](https://github.com/KishanBagaria/padding-oracle-attacker)** — CLI tool untuk eksekusi padding oracle attacks.
- **[PkCrack](https://www.unix-ag.uni-kl.de/~conrad/krypto/pkcrack.html)** — Crack enkripsi PkZip.
- **[QuipQuip](https://quipqiup.com/)** — Tool online untuk breaking substitution cipher dan vigenere cipher tanpa kunci.
- **[RSACTFTool](https://github.com/Ganapati/RsaCtfTool)** — Koleksi serangan terhadap RSA: small exponent, Wiener's attack, common modulus, dll.
- **[RSATool](https://github.com/ius/rsatool)** — Generate private key dengan pengetahuan p dan q.
- **[XORTool](https://github.com/hellman/xortool)** — Analisis multi-byte XOR cipher. Bisa tebak panjang kunci dan dekripsi pesan.

### Exploits

- **[DLLInjector](https://github.com/OpenSecurityResearch/dllinjector)** — Inject DLL ke dalam proses yang berjalan.
- **[libformatstr](https://github.com/hellman/libformatstr)** — Menyederhanakan eksploitasi format string vulnerability.
- **[Metasploit](http://www.metasploit.com/)** — Framework penetration testing lengkap. Di CTF biasanya dipakai untuk payload generation. Ada [cheatsheet](https://www.comparitech.com/net-admin/metasploit-cheat-sheet/)-nya juga.
- **[one_gadget](https://github.com/david942j/one_gadget)** — Cari satu gadget \`execve('/bin/sh', NULL, NULL)\` di dalam libc. Install: \`gem install one_gadget\`.
- **[Pwntools](https://github.com/Gallopsled/pwntools)** — CTF framework untuk menulis exploit. Library Python wajib untuk semua pwner.
- **[Qira](https://github.com/BinaryAnalysisPlatform/qira)** — QEMU Interactive Runtime Analyser.
- **[ROP Gadget](https://github.com/JonathanSalwan/ROPgadget)** — Framework untuk membuat ROP chain, teknik bypass proteksi NX.
- **[V0lt](https://github.com/P1kachu/v0lt)** — Security CTF Toolkit serba guna.

### Forensics

- **[Aircrack-Ng](http://www.aircrack-ng.org/)** — Crack enkripsi WiFi WEP dan WPA-PSK dari file capture. \`apt-get install aircrack-ng\`
- **[Audacity](http://sourceforge.net/projects/audacity/)** — Analisis file audio: mp3, m4a, wav, dll. \`apt-get install audacity\`
- **[Bkhive & Samdump2](http://sourceforge.net/projects/ophcrack/files/samdump2/)** — Dump file SYSTEM dan SAM dari Windows. \`apt-get install samdump2 bkhive\`
- **[CFF Explorer](http://www.ntcore.com/exsuite.php)** — PE Editor untuk analisis file executable Windows.
- **[Creddump](https://github.com/moyix/creddump)** — Dump Windows credentials.
- **[DVCS Ripper](https://github.com/kost/dvcs-ripper)** — Rip version control systems yang accessible lewat web.
- **[Exif Tool](http://www.sno.phy.queensu.ca/~phil/exiftool/)** — Baca, tulis, dan edit metadata file. Kadang flag cuma disimpen di sini.
- **[Extundelete](http://extundelete.sourceforge.net/)** — Recover file yang terhapus dari disk image Linux.
- **[Fibratus](https://github.com/rabbitstack/fibratus)** — Eksplorasi dan tracing Windows kernel.
- **[Foremost](http://foremost.sourceforge.net/)** — File carving berdasarkan magic bytes. \`apt-get install foremost\`
- **[Fsck.ext4](http://linux.die.net/man/8/fsck.ext3)** — Perbaiki filesystem yang corrupt.
- **[Malzilla](http://malzilla.sourceforge.net/)** — Tool hunting malware.
- **[NetworkMiner](http://www.netresec.com/?page=NetworkMiner)** — Network Forensic Analysis Tool.
- **[PDF Streams Inflater](http://malzilla.sourceforge.net/downloads.html)** — Temukan dan ekstrak file zlib yang terkompresi di dalam PDF.
- **[Pngcheck](http://www.libpng.org/pub/png/apps/pngcheck.html)** — Verifikasi integritas PNG dan tampilkan info chunk-level secara detail. \`apt-get install pngcheck\`
- **[ResourcesExtract](http://www.nirsoft.net/utils/resources_extract.html)** — Ekstrak berbagai filetype dari file exe.
- **[Shellbags](https://github.com/williballenthin/shellbags)** — Investigasi file NT_USER.dat.
- **[Snow](https://sbmlabs.com/notes/snow_whitespace_steganography_tool)** — Whitespace steganography tool.
- **[USBRip](https://github.com/snovvcrash/usbrip)** — Forensics tool CLI untuk tracking artefak USB device di GNU/Linux.
- **[Volatility](https://github.com/volatilityfoundation/volatility)** — Tool nomor satu untuk investigasi memory dump. Bisa ekstrak proses, koneksi jaringan, password, dan artefak lainnya.
- **[Wireshark](https://www.wireshark.org/)** — Analisis file PCAP/PCAPNG. Filter paket, cari credentials, rekonstruksi stream HTTP/TCP.

Registry Viewers:

- **[OfflineRegistryView](https://www.nirsoft.net/utils/offline_registry_view.html)** — Baca offline Registry files dari external drive dan tampilkan dalam format .reg.
- **[Registry Viewer](https://accessdata.com/product-download/registry-viewer-2-0-0)** — Tool untuk melihat Windows registry.

### Networking

- **[Masscan](https://github.com/robertdavidgraham/masscan)** — Port scanner yang sangat cepat. Bisa scan seluruh internet dalam waktu singkat.
- **[Monit](https://linoxide.com/monitoring-2/monit-linux/)** — Tool Linux untuk monitoring host di jaringan.
- **[Nipe](https://github.com/GouveaHeitor/nipe)** — Script untuk menjadikan Tor Network sebagai default gateway.
- **[Nmap](https://nmap.org/)** — Scanner port dan jaringan paling terkenal. Bisa deteksi OS, versi service, dan jalankan NSE scripts.
- **[Wireshark](https://www.wireshark.org/)** — Analisis protokol jaringan secara detail. \`apt-get install wireshark\`
- **[Zeek](https://www.zeek.org/)** — Network security monitor open-source.
- **[Zmap](https://zmap.io/)** — Network scanner open-source.

### Reversing

- **[Androguard](https://github.com/androguard/androguard)** — Reverse engineer aplikasi Android.
- **[Angr](https://github.com/angr/angr)** — Platform analisis biner berbasis Python. Support symbolic execution — biar tool yang nyari input yang benar, bukan kamu.
- **[Apk2Gold](https://github.com/lxdvs/apk2gold)** — Android decompiler.
- **[ApkTool](http://ibotpeaches.github.io/Apktool/)** — Android decompiler dan repacker.
- **[Barf](https://github.com/programa-stic/barf-project)** — Binary Analysis and Reverse engineering Framework.
- **[Binary Ninja](https://binary.ninja/)** — Alternatif modern IDA Pro dengan UI yang lebih bersih dan Python API yang enak dipakai.
- **[BinUtils](http://www.gnu.org/software/binutils/binutils.html)** — Koleksi binary tools dari GNU.
- **[BinWalk](https://github.com/devttys0/binwalk)** — Analisis, reverse engineer, dan ekstrak firmware images.
- **[Boomerang](https://github.com/BoomerangDecompiler/boomerang)** — Decompile binary x86/SPARC/PowerPC/ST-20 ke C.
- **[ctf_import](https://github.com/docileninja/ctf_import)** — Jalankan fungsi dasar dari stripped binaries lintas platform.
- **[cwe_checker](https://github.com/fkie-cad/cwe_checker)** — Deteksi pola vulnerable di file binary executable.
- **[demovfuscator](https://github.com/kirschju/demovfuscator)** — Deobfuscator untuk movfuscated binaries (work in progress).
- **[Frida](https://github.com/frida/)** — Dynamic instrumentation. Suntik kode JavaScript ke dalam proses yang berjalan. Sangat berguna untuk analisis aplikasi Android/iOS.
- **[GDB](https://www.gnu.org/software/gdb/)** — GNU project debugger.
- **[GEF](https://github.com/hugsy/gef)** — GDB plugin yang mempercantik tampilan dengan info register, stack, dan heap.
- **[Ghidra](https://ghidra-sre.org/)** — Suite reverse engineering open-source dari NSA. Fitur decompiler-nya mengubah kode mesin jadi pseudocode C. Gratis dan powerful.
- **[Hopper](http://www.hopperapp.com/)** — Disassembler untuk OSX dan Linux.
- **[IDA Pro](https://www.hex-rays.com/products/ida/)** — Standar industri untuk reverse engineering. Versi freeware tersedia untuk penggunaan personal.
- **[Jadx](https://github.com/skylot/jadx)** — Decompile file Android APK ke Java source code.
- **[Java Decompilers](http://www.javadecompilers.com/)** — Online decompiler untuk Java dan Android APK.
- **[Krakatau](https://github.com/Storyyeller/Krakatau)** — Java decompiler dan disassembler.
- **[Objection](https://github.com/sensepost/objection)** — Runtime Mobile Exploration.
- **[PEDA](https://github.com/longld/peda)** — GDB plugin untuk Python 2.7.
- **[Pin](https://software.intel.com/en-us/articles/pin-a-dynamic-binary-instrumentation-tool)** — Dynamic binary instrumentation tool dari Intel.
- **[PINCE](https://github.com/korcankaraokcu/PINCE)** — GDB front-end fokus ke game-hacking dan automation.
- **[PinCTF](https://github.com/ChrisTheCoolHut/PinCTF)** — Pakai Intel Pin untuk Side Channel Analysis.
- **[Plasma](https://github.com/joelpx/plasma)** — Disassembler interaktif untuk x86/ARM/MIPS dengan pseudocode berwarna.
- **[Pwndbg](https://github.com/pwndbg/pwndbg)** — GDB plugin dengan suite utilitas lengkap untuk debugging dan exploit development.
- **[radare2](https://github.com/radare/radare2)** — Framework reversing berbasis command line yang sangat portabel. Kurva belajarnya curam, tapi worth it.
- **[Triton](https://github.com/JonathanSalwan/Triton/)** — Dynamic Binary Analysis (DBA) framework.
- **[Uncompyle](https://github.com/gstarnberger/uncompyle)** — Decompile Python 2.7 binaries (.pyc).
- **[WinDbg](http://www.windbg.org/)** — Windows debugger dari Microsoft.
- **[Xocopy](http://reverse.lostrealm.com/tools/xocopy.html)** — Copy executable dengan permission execute tapi tanpa read.
- **[Z3](https://github.com/Z3Prover/z3)** — Theorem prover dari Microsoft Research. Pecahkan constraint matematika kompleks secara otomatis.

JavaScript Deobfuscators:

- **[Detox](http://relentless-coding.org/projects/jsdetox/install)** — Tool analisis malware JavaScript.
- **[Revelo](http://www.kahusecurity.com/posts/revelo_javascript_deobfuscator.html)** — Analisis kode JavaScript yang di-obfuscate.

SWF Analyzers:

- **[RABCDAsm](https://github.com/CyberShadow/RABCDAsm)** — Koleksi utilitas termasuk ActionScript 3 assembler/disassembler.
- **[Swftools](http://www.swftools.org/)** — Koleksi utilitas untuk bekerja dengan file SWF.
- **[Xxxswf](https://bitbucket.org/Alexander_Hanel/xxxswf)** — Python script untuk analisis Flash files.

### Services

- **[CSWSH](http://cow.cat/cswsh.html)** — Cross-Site WebSocket Hijacking Tester.
- **[Request Bin](https://requestbin.com/)** — Inspect HTTP requests yang masuk ke URL tertentu. Berguna untuk debug callback dan webhook.

### Steganography

- **[AperiSolve](https://aperisolve.fr/)** — Platform online yang jalankan berbagai analisis stego secara otomatis pada gambar yang diupload. Coba ini dulu sebelum yang lain.
- **[Convert](http://www.imagemagick.org/script/convert.php)** — Konversi gambar antar format dan terapkan berbagai filter.
- **[Exif](http://manpages.ubuntu.com/manpages/trusty/man1/exif.1.html)** — Tampilkan informasi EXIF di file JPEG.
- **[Exiftool](https://linux.die.net/man/1/exiftool)** — Baca dan tulis metadata di berbagai jenis file.
- **[Exiv2](http://www.exiv2.org/manpage.html)** — Tool manipulasi metadata gambar.
- **[Image Steganography](https://sourceforge.net/projects/image-steg/)** — Embed teks dan file di dalam gambar dengan enkripsi opsional. UI mudah dipakai.
- **[Image Steganography Online](https://incoherency.co.uk/image-steganography)** — Tool JavaScript client-side untuk menyembunyikan gambar di dalam lower bits gambar lain.
- **[ImageMagick](http://www.imagemagick.org/script/index.php)** — Tool manipulasi gambar yang sangat lengkap.
- **[Outguess](https://www.freebsd.org/cgi/man.cgi?query=outguess+&apropos=0&sektion=0&manpath=FreeBSD+Ports+5.1-RELEASE&format=html)** — Universal steganographic tool.
- **[Pngtools](https://packages.debian.org/sid/pngtools)** — Berbagai analisis terkait file PNG. \`apt-get install pngtools\`
- **[SmartDeblur](https://github.com/Y-Vladimir/SmartDeblur)** — Deblur dan perbaiki gambar yang defocused.
- **[Steganabara](https://www.openhub.net/p/steganabara)** — Tool analisis steganografi ditulis dalam Java.
- **[SteganographyOnline](https://stylesuxx.github.io/steganography/)** — Encoder dan decoder steganografi online.
- **[Stegbreak](https://linux.die.net/man/1/stegbreak)** — Brute-force dictionary attack pada gambar JPG.
- **[StegCracker](https://github.com/Paradoxis/StegCracker)** — Brute-force steganografi untuk uncover data tersembunyi di dalam file.
- **[stegextract](https://github.com/evyatarmeged/stegextract)** — Deteksi file dan teks tersembunyi di dalam gambar.
- **[Steghide](http://steghide.sourceforge.net/)** — Sembunyikan dan ekstrak data dari file gambar (JPEG, BMP) dan audio (WAV, AU).
- **[StegOnline](https://georgeom.net/StegOnline/upload)** — Berbagai operasi steganografi gambar online, termasuk menyembunyikan dan mengungkap file dari bit-level.
- **[Stegsolve](http://www.caesum.com/handbook/Stegsolve.jar)** — Tampilkan berbagai bit-plane dari gambar. Sangat berguna untuk LSB steganography.
- **[Zsteg](https://github.com/zed-0xff/zsteg/)** — Deteksi data tersembunyi di file PNG dan BMP, termasuk LSB steganography.

### Web

- **[BurpSuite](https://portswigger.net/burp)** — Proxy intersepsi HTTP terlengkap. Bisa modifikasi request/response, fuzzing, dan banyak lagi. Versi Community gratis.
- **[Commix](https://github.com/commixproject/commix)** — Tool otomatis untuk OS Command Injection dan eksploitasinya.
- **[Hackbar](https://addons.mozilla.org/en-US/firefox/addon/hackbartool/)** — Firefox addon untuk web exploitation yang lebih cepat.
- **[OWASP ZAP](https://www.owasp.org/index.php/Projects/OWASP_Zed_Attack_Proxy_Project)** — Intercepting proxy open-source. Alternatif gratis dari BurpSuite.
- **[Postman](https://chrome.google.com/webstore/detail/postman/fhbjgbiflinjbdggehcddcbncdddomop?hl=en)** — Chrome extension untuk debugging network requests dan API.
- **[Raccoon](https://github.com/evyatarmeged/Raccoon)** — Tool recon dan vulnerability scanning performa tinggi.
- **[SQLMap](https://github.com/sqlmapproject/sqlmap)** — Otomatisasi SQL injection dan database takeover. \`pip install sqlmap\`
- **[W3af](https://github.com/andresriancho/w3af)** — Web Application Attack and Audit Framework.
- **[XSSer](http://xsser.sourceforge.net/)** — Automated XSS testing tool.

---

## Resources

### Operating Systems

Distro Linux untuk penetration testing dan security lab:

- **[Android Tamer](https://androidtamer.com/)** — Berbasis Debian, fokus ke Android security.
- **[BackBox](https://backbox.org/)** — Berbasis Ubuntu.
- **[BlackArch Linux](https://blackarch.org/)** — Berbasis Arch Linux dengan ribuan tools security di repositorinya.
- **[Fedora Security Lab](https://labs.fedoraproject.org/security/)** — Berbasis Fedora.
- **[Kali Linux](https://www.kali.org/)** — Berbasis Debian. Distro paling populer untuk penetration testing, datang dengan ratusan tools pre-installed.
- **[Parrot Security OS](https://www.parrotsec.org/)** — Berbasis Debian. Alternatif Kali yang lebih ringan.
- **[Pentoo](http://www.pentoo.ch/)** — Berbasis Gentoo.
- **[URIX OS](http://urix.us/)** — Berbasis openSUSE.
- **[Wifislax](http://www.wifislax.com/)** — Berbasis Slackware, fokus ke WiFi security.

Untuk malware analysis dan reverse engineering:

- **[Flare VM](https://github.com/fireeye/flare-vm/)** — Berbasis Windows, buatan FireEye.
- **[REMnux](https://remnux.org/)** — Berbasis Debian, khusus untuk analisis malware.

### Starter Packs

- **[CTF Tools](https://github.com/zardus/ctf-tools)** — Koleksi setup scripts untuk install berbagai security research tools sekaligus.
- **[LazyKali](https://github.com/jlevitsk/lazykali)** — Menyederhanakan instalasi tools dan konfigurasi di Kali Linux.

### Tutorials

- **[CTF Field Guide](https://trailofbits.github.io/ctf/)** — Panduan lengkap oleh Trail of Bits. Wajib dibaca.
- **[CTF Resources](http://ctfs.github.io/resources/)** — Start guide yang dikelola oleh komunitas.
- **[How to Get Started in CTF](https://www.endgame.com/blog/how-get-started-ctf)** — Panduan singkat untuk pemula oleh Endgame.
- **[Intro. to CTF Course](https://www.hoppersroppers.org/courseCTF.html)** — Kursus gratis yang mengajarkan dasar forensics, crypto, dan web exploitation.
- **[IppSec](https://www.youtube.com/channel/UCa6eh7gCkpPo5XXUDfygQQA)** — Video tutorial dan walkthrough platform CTF populer, terutama Hack The Box.
- **[LiveOverFlow](https://www.youtube.com/channel/UClcE-kVhqyiHCcjYwcpfj9w)** — Video tutorial tentang binary exploitation dan berbagai topik keamanan lainnya.
- **[MIPT CTF](https://github.com/xairy/mipt-ctf)** — Kursus kecil untuk pemula CTF (dalam bahasa Rusia).

### Wargames

Platform latihan yang selalu online:

- **[Backdoor](https://backdoor.sdslabs.co/)** — Security platform oleh SDSLabs.
- **[Crackmes](https://crackmes.one/)** — Tantangan reverse engineering.
- **[CryptoHack](https://cryptohack.org/)** — Platform terbaik untuk belajar kriptografi secara interaktif.
- **[echoCTF.RED](https://echoctf.red/)** — CTF online dengan berbagai target untuk diserang.
- **[Exploit Exercises](https://exploit-exercises.lains.space/)** — Berbagai VM untuk belajar isu keamanan komputer.
- **[Exploit.Education](http://exploit.education/)** — Berbagai VM untuk belajar exploitation.
- **[Gracker](https://github.com/Samuirai/gracker)** — Binary challenges dengan learning curve bertahap, dilengkapi write-up tiap level.
- **[Hack The Box](https://www.hackthebox.eu/)** — Platform paling populer saat ini. CTF mingguan untuk semua jenis security enthusiast.
- **[Hack This Site](https://www.hackthissite.org/)** — Training ground untuk hacker.
- **[Hacker101](https://www.hacker101.com/)** — CTF dari HackerOne.
- **[Hacking-Lab](https://hacking-lab.com/)** — Platform ethical hacking, computer network, dan security challenge.
- **[Hone Your Ninja Skills](https://honeyourskills.ninja/)** — Web challenges mulai dari yang basic.
- **[IO](http://io.netgarage.org/)** — Wargame untuk binary challenges.
- **[Microcorruption](https://microcorruption.com/)** — Embedded security CTF yang unik.
- **[Over The Wire](http://overthewire.org/wargames/)** — Wargame berbasis terminal untuk belajar Linux, networking, dan exploitation dari dasar.
- **[PentesterLab](https://pentesterlab.com/)** — Berbagai VM dan online challenges (berbayar).
- **[PicoCTF](https://2019game.picoctf.com/)** — CTF sepanjang tahun. Soal dari kompetisi picoCTF tahunan. Sangat ramah pemula.
- **[PWN Challenge](http://pwn.eonew.cn/)** — Binary exploitation wargame.
- **[Pwnable.kr](http://pwnable.kr/)** — Pwn game.
- **[Pwnable.tw](https://pwnable.tw/)** — Binary wargame.
- **[Pwnable.xyz](https://pwnable.xyz/)** — Binary exploitation wargame.
- **[Reversing.kr](http://reversing.kr/)** — Reversing challenge.
- **[Ringzer0Team](https://ringzer0team.com/)** — Ringzer0 Team Online CTF.
- **[Root-Me](https://www.root-me.org/)** — Platform belajar hacking dan information security yang sangat lengkap.
- **[ROP Wargames](https://github.com/xelenonz/game)** — ROP wargames.
- **[SANS HHC](https://holidayhackchallenge.com/past-challenges/)** — Challenges bertema liburan yang dirilis setiap tahun oleh SANS.
- **[SmashTheStack](http://smashthestack.org/)** — Berbagai wargame oleh SmashTheStack Community.
- **[Viblo CTF](https://ctf.viblo.asia/)** — Berbagai CTF challenges di banyak kategori. Ada Practice mode dan Contest mode.
- **[VulnHub](https://www.vulnhub.com/)** — VM-based untuk latihan digital security secara praktikal.
- **[W3Challs](https://w3challs.com/)** — Platform penetration testing training dengan berbagai tantangan komputer.
- **[WebHacking](http://webhacking.kr/)** — Hacking challenges khusus web.

Self-hosted CTFs:

- **[Damn Vulnerable Web Application](http://www.dvwa.co.uk/)** — Aplikasi web PHP/MySQL yang sengaja dibuat rentan untuk latihan.
- **[Juice Shop CTF](https://github.com/bkimminich/juice-shop-ctf)** — Script dan tools untuk hosting CTF di atas [OWASP Juice Shop](https://www.owasp.org/index.php/OWASP_Juice_Shop_Project).

### Websites

- **[Awesome CTF Cheatsheet](https://github.com/uppusaikiran/awesome-ctf-cheatsheet#awesome-ctf-cheatsheet-)** — CTF cheatsheet lengkap.
- **[CTF Time](https://ctftime.org/)** — Informasi jadwal CTF yang berlangsung di seluruh dunia. Cek ini untuk cari event berikutnya.
- **[Reddit Security CTF](http://www.reddit.com/r/securityctf)** — Komunitas CTF di Reddit.

### Wikis

- **[Bamboofox](https://bamboofox.github.io/)** — Resource CTF dalam bahasa Mandarin.
- **[bi0s Wiki](https://teambi0s.gitlab.io/bi0s-wiki/)** — Wiki dari team bi0s.
- **[CTF Cheatsheet](https://uppusaikiran.github.io/hacking/Capture-the-Flag-CheatSheet/)** — Tips dan trik CTF.
- **[ISIS Lab](https://github.com/isislab/Project-Ideas/wiki)** — CTF Wiki oleh ISIS Lab.
- **[OpenToAll](https://github.com/OpenToAllCTF/Tips)** — CTF tips dari anggota tim OTA CTF.

### Writeups Collections

- **[0e85dc6eaf](https://github.com/0e85dc6eaf/CTF-Writeups)** — Write-ups CTF oleh 0e85dc6eaf.
- **[Captf](http://captf.com/)** — Dump soal dan materi CTF oleh psifertex.
- **[CTF write-ups (community)](https://github.com/ctfs/)** — Arsip CTF challenges dan write-ups yang dikelola komunitas.
- **[CTFTime Scrapper](https://github.com/abdilahrf/CTFWriteupScrapper)** — Scrape semua write-up dari CTF Time dan urutkan mana yang perlu dibaca duluan.
- **[HackThisSite](https://github.com/HackThisSite/CTF-Writeups)** — Write-ups CTF oleh tim HackThisSite.
- **[Mzfr](https://github.com/mzfr/ctf-writeups/)** — Write-ups kompetisi CTF oleh mzfr.
- **[pwntools writeups](https://github.com/Gallopsled/pwntools-write-ups)** — Koleksi write-ups CTF yang semuanya menggunakan pwntools.
- **[SababaSec](https://github.com/SababaSec/ctf-writeups)** — Koleksi write-ups CTF oleh tim SababaSec.
- **[Shell Storm](http://shell-storm.org/repo/CTF/)** — Arsip soal CTF oleh Jonathan Salwan.
- **[Smoke Leet Everyday](https://github.com/smokeleeteveryday/CTF_WRITEUPS)** — Write-ups CTF oleh tim SmokeLeetEveryday.

---

Jangan merasa harus nguasain semua tools di atas sekaligus. Pilih satu kategori yang paling menarik, pelajari tools utamanya secara mendalam, dan latih di platform seperti PicoCTF atau Over The Wire. Setiap soal yang dipecahkan — meski pakai hint atau baca writeup orang lain — tetap nambah pengetahuan dan intuisi.

Cek [CTFTime.org](https://ctftime.org) untuk jadwal event berikutnya dan cari yang berlabel *beginner-friendly* untuk mulai kompetisi langsung.
`
};