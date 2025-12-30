
  # 🚩 CTF Write-Ups Blog

  This is a code bundle for CTF Write-Ups Blog. Web blog interaktif untuk berbagi write-up CTF dengan dokumentasi lengkap, analisis mendalam, dan penjelasan solusi dari berbagai kategori challenges.

  ## ✨ Fitur Utama

  - **Dashboard Admin Terproteksi** - Password-protected dashboard untuk membuat dan mengelola write-ups
  - **Multiple Categories** - Web, Crypto, Pwn, Forensics, Reverse Engineering, OSINT, Misc
  - **Difficulty Levels** - Easy, Medium, Hard dengan visual indicators
  - **Rich Content** - Support untuk detailed analysis, solution steps dengan code highlighting
  - **Copy Code Feature** - Tombol copy untuk semua code blocks di setiap write-up
  - **Dark Mode** - UI modern dengan dark theme yang elegan
  - **Responsive Design** - Optimized untuk desktop dan mobile devices
  - **Dynamic Statistics** - Automatic calculation dari total write-ups, points, dan categories

  ## 🏆 Kategori CTF

  - **Web** - Web exploitation, injection, authentication bypasses
  - **Crypto** - Cryptography, encoding/decoding challenges
  - **Pwn** - Binary exploitation, buffer overflows
  - **Forensics** - Digital forensics, file analysis
  - **Reverse** - Reverse engineering, binary analysis
  - **OSINT** - Open source intelligence gathering
  - **Misc** - Miscellaneous challenges

  ## 🚀 Quick Start

  ### Installation
  ```bash
  npm install
  ```

  ### Development
  ```bash
  npm run dev
  ```
  Aplikasi akan berjalan di `http://localhost:5173`

  ### Production Build
  ```bash
  npm run build
  ```

  ## 📝 Cara Membuat Write-Up

  1. **Akses Dashboard** - Klik tombol Dashboard di navbar (atau buka localhost:5173/dashboard)
  2. **Login** - Masukkan password (dari `VITE_DASHBOARD_PASSWORD` di .env.local)
  3. **Generate JSON** - Isi form dengan detail write-up dan klik "Generate JSON"
  4. **Copy & Paste** - Copy JSON yang dihasilkan
  5. **Update Data** - Buka file `src/app/data/writeups.ts` dan paste JSON ke array writeups
  6. **Refresh** - Refresh browser, write-up baru akan muncul secara otomatis

  ### Contoh Format Write-Up
  ```json
  {
    "id": "1",
    "title": "The Mosaic",
    "category": "Misc",
    "difficulty": "Medium",
    "points": 500,
    "date": "2025-12-30",
    "author": "username",
    "ctfName": "CTF Event Name",
    "description": "Brief description",
    "problemDescription": "Detailed problem statement",
    "tools": ["tool1", "tool2"],
    "analysis": "Analysis content",
    "solution": [
      {
        "title": "Step 1",
        "content": "Description",
        "code": "optional code block"
      }
    ],
    "flag": "flag{...}",
    "lessonsLearned": "Key takeaways"
  }
  ```

  ## 🔧 Teknologi Stack

  - **Framework** - React 18 + TypeScript
  - **Build Tool** - Vite
  - **Styling** - Tailwind CSS
  - **UI Components** - shadcn/ui
  - **Icons** - React Icons (Bootstrap Icons)
  - **State Management** - React Hooks

  ## 📁 Project Structure

  ```
  src/
  ├── app/
  │   ├── components/
  │   │   ├── pages/          # Page components
  │   │   ├── ui/             # shadcn/ui components
  │   │   └── figma/          # Custom components
  │   ├── data/
  │   │   └── writeups.ts     # Write-up database
  │   └── App.tsx             # Main app component
  ├── styles/                 # CSS files
  └── main.tsx                # Entry point
  ```

  ## 🔐 Environment Variables

  Buat file `.env.local` di root directory:

  ```env
  VITE_DASHBOARD_PASSWORD=your_secret_password
  ```

  ## 📊 Statistics

  Dashboard secara otomatis menghitung:
  - Total jumlah write-ups
  - Total points dari semua challenges
  - Jumlah categories yang ada

  Statistik update secara real-time ketika write-up baru ditambahkan.

  ## 🎨 Customization

  ### Mengubah Password Dashboard
  Edit `.env.local` dan ubah nilai `VITE_DASHBOARD_PASSWORD`

  ### Mengubah Tema
  Edit file `src/styles/theme.css` untuk customize warna dan styling

  ### Menambah Category
  Update tipe `Category` di `src/app/data/writeups.ts`

  ## 📄 Lisensi

  MIT License - Silakan gunakan dan modifikasi sesuai kebutuhan

  ## 🤝 Kontribusi

  Contributions welcome! Silakan submit issues dan pull requests.
  
