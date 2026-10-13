import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// 1. Check sitemap
const sitemap = fs.readFileSync(path.join(root, 'public/sitemap.xml'), 'utf-8');
assert(!sitemap.includes('/#/'), 'Sitemap must not contain hash fragments');
assert(sitemap.includes('https://nattts.vercel.app/blog/analisis-malware-eclipse-rat'), 'Sitemap must contain eclipse blog post');
assert(sitemap.includes('https://nattts.vercel.app/blog'), 'Sitemap must contain /blog');
assert(sitemap.includes('https://nattts.vercel.app/'), 'Sitemap must contain root');

// 2. Check robots.txt
const robots = fs.readFileSync(path.join(root, 'public/robots.txt'), 'utf-8');
assert(robots.includes('Sitemap: https://nattts.vercel.app/sitemap.xml'), 'Robots must point to nattts.vercel.app');

// 3. Check prerendered blog shell
const blogShell = fs.readFileSync(path.join(root, 'dist/blog/analisis-malware-eclipse-rat/index.html'), 'utf-8');
assert(blogShell.includes('Bedah Malware Eclipse RAT'), 'Blog shell must contain post title in HTML');
assert(blogShell.includes('https://nattts.vercel.app/blog/analisis-malware-eclipse-rat'), 'Blog shell must contain canonical URL');
assert(blogShell.includes('"@type":"TechArticle"'), 'Blog shell must contain TechArticle JSON-LD schema');

// 4. Check og-image exists
assert(fs.existsSync(path.join(root, 'public/og-image.png')), 'public/og-image.png must exist');

console.log('✅ All SEO assertions passed!');
