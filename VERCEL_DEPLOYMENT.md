# 🚀 Vercel Deployment Configuration

**Domain**: https://rblxlabs.vercel.app/  
**Last Updated**: 25 Februari 2026

---

## ✅ Sudah Dikonfigurasi untuk Vercel

### 1. **Vercel.json Optimization**
- ✅ Build command: `npm run build`
- ✅ Output directory: `dist` (Vite default)
- ✅ Production environment variables
- ✅ Security headers dioptimalkan
- ✅ Cache strategy untuk static assets
- ✅ Redirects untuk SEO friendly URLs

### 2. **Production Domain Update**
Semua URL sudah di-update ke domain production:

```
Old: https://ctfwriteups.example.com
New: https://rblxlabs.vercel.app
```

Updated files:
- ✅ `index.html` - Meta tags, OG tags, canonical URLs
- ✅ `public/robots.txt` - Sitemap reference
- ✅ `scripts/generate-sitemap.js` - Base URL
- ✅ `src/app/utils/seoManager.ts` - Domain constant
- ✅ `src/app/hooks/useSEO.ts` - Page URLs

### 3. **Environment Variables di Vercel**

Tidak ada environment variables yang diperlukan untuk konfigurasi standar. Jika ingin override domain:

```bash
SITE_URL=https://rblxlabs.vercel.app npm run build
```

---

## 📋 Pre-Deployment Checklist

### Before Pushing to Vercel:

- [ ] Run: `npm run build` locally untuk verify build success
- [ ] Test: `npm run dev` untuk check development build
- [ ] Verify: Tidak ada error atau warning
- [ ] Check: Semua meta tags correctly di-render di browser

### Vercel Project Setup:

- [ ] Connect repository ke Vercel project
- [ ] Set Framework: **Vite**
- [ ] Build Output: `dist/`
- [ ] Node version: Latest LTS atau sesuaikan dengan package.json
- [ ] Environment: Production

### Post-Deployment:

- [ ] **Submit Sitemap ke Google Search Console**
  ```
  https://search.google.com/search-console
  → Add property: https://rblxlabs.vercel.app
  → Submit sitemap: https://rblxlabs.vercel.app/sitemap.xml
  ```

- [ ] **Submit ke Bing Webmaster Tools**
  ```
  https://www.bing.com/webmaster
  → Add site: rblxlabs.vercel.app
  → Submit sitemap
  ```

- [ ] **Generate Sitemap** (if not auto-generated)
  ```bash
  npm install -g ts-node
  node scripts/generate-sitemap.js
  ```

- [ ] **Verify Deployment**
  - Check: https://rblxlabs.vercel.app/robots.txt
  - Check: https://rblxlabs.vercel.app/sitemap.xml
  - Check source code: Meta tags present

---

## 🔍 Verification Commands

Setelah deployment, jalankan commands berikut untuk verifikasi:

```bash
# Check meta tags di homepage
curl -s https://rblxlabs.vercel.app/ | grep -o '<meta[^>]*>' | head -10

# Check robots.txt accessible
curl -s https://rblxlabs.vercel.app/robots.txt

# Check sitemap.xml accessible
curl -s https://rblxlabs.vercel.app/sitemap.xml | head -20

# Check security headers
curl -I https://rblxlabs.vercel.app/
```

---

## 📊 Performance Monitoring

### Lighthouse (Built-in Vercel):
- Performance score: Target **90+**
- SEO score: Target **100**
- Best Practices: Target **90+**
- Accessibility: Target **90+**

### Google Search Console:
- Monitor: Query performance
- Track: CTR and position changes
- Fix: Any crawl errors

### Analytics:
- Google Analytics: Organic traffic
- Core Web Vitals: Performance metrics

---

## 🔄 Sitemap Auto-Update

Jika ingin auto-update sitemap saat ada writeups baru:

**Option 1: Manual**
```bash
npm run generate-sitemap
git add public/sitemap.xml
git commit -m "Update sitemap"
git push
```

**Option 2: CI/CD (dengan GitHub Actions)**
Buat file `.github/workflows/sitemap.yml`:

```yaml
name: Update Sitemap
on:
  push:
    paths:
      - 'src/app/data/writeups.ts'

jobs:
  update-sitemap:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: node scripts/generate-sitemap.js
      - run: |
          git add public/sitemap.xml
          git commit -m "Auto-update sitemap" || true
          git push
```

---

## 🎯 SEO Checklist untuk Production

- [x] Domain updated di semua files
- [x] Meta tags correctly configured
- [x] robots.txt deployed
- [x] sitemap.xml ready
- [x] Security headers enabled
- [x] Cache strategy optimized
- [x] Vercel.json configured
- [ ] Submit sitemap ke Google Search Console
- [ ] Submit sitemap ke Bing Webmaster
- [ ] Setup Google Analytics 4
- [ ] Check Lighthouse scores
- [ ] Monitor organic traffic

---

## 📞 Support & Resources

**Vercel Documentation:**
- [Vercel CLI Docs](https://vercel.com/docs)
- [Environment Variables](https://vercel.com/docs/concepts/environment-variables)
- [Performance Monitoring](https://vercel.com/docs/observability)

**SEO Resources:**
- [Google Search Central](https://developers.google.com/search)
- [Sitemap Validator](https://www.xml-sitemaps.com/)
- [Rich Results Test](https://search.google.com/test/rich-results)

---

**Status**: ✅ **Ready for Deployment**  
**Domain**: https://rblxlabs.vercel.app  
**Last Verified**: 25 Februari 2026
