#!/usr/bin/env node

/**
 * Sitemap & Robots.txt Generator Script
 * Generates clean, standard-compliant sitemap.xml and robots.txt for search engine crawlers.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { writeups } from '../src/app/data/writeups.ts';
import { blogPosts } from '../src/app/data/blog/index.ts';
import { getEventSlug } from '../src/app/data/docsTree.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = (process.env.SITE_URL || 'https://nattts.vercel.app').replace(/\/$/, '');

// Static pages
const staticPages = [
  {
    loc: `${BASE_URL}/`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'daily',
    priority: 1.0,
  },
  {
    loc: `${BASE_URL}/blog`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'daily',
    priority: 0.9,
  },
  {
    loc: `${BASE_URL}/playground`,
    lastmod: '2026-06-01',
    changefreq: 'monthly',
    priority: 0.5,
  },
];

function generateBlogEntries() {
  return blogPosts.map((post) => ({
    loc: `${BASE_URL}/blog/${post.id}`,
    lastmod: formatDate(post.date),
    changefreq: 'monthly',
    priority: 0.9,
  }));
}

function generateEventEntries() {
  const events = new Set();
  const entries = [];

  for (const writeup of writeups) {
    const eventName = writeup.ctfName || 'Uncategorized CTF';
    if (!events.has(eventName)) {
      events.add(eventName);
      const eventSlug = getEventSlug(eventName);
      entries.push({
        loc: `${BASE_URL}/event/${eventSlug}`,
        lastmod: formatDate(writeup.date),
        changefreq: 'weekly',
        priority: 0.8,
      });
    }
  }
  return entries;
}

function generateWriteupEntries() {
  return writeups.map((writeup) => ({
    loc: `${BASE_URL}/writeup/${writeup.id}`,
    lastmod: formatDate(writeup.date),
    changefreq: 'never',
    priority: 0.7,
  }));
}

function formatDate(dateString) {
  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

function generateSitemapXml(entries) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  entries.forEach((entry) => {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(entry.loc)}</loc>\n`;
    xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
    xml += `    <priority>${entry.priority.toFixed(1)}</priority>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>';
  return xml;
}

function escapeXml(str) {
  const xmlChars = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  };
  return str.replace(/[&<>"']/g, (char) => xmlChars[char]);
}

function generateRobotsTxtContent() {
  return `# Robots.txt for Nattt CTF Writeups & Blog
User-agent: *
Allow: /

# Sitemap
Sitemap: ${BASE_URL}/sitemap.xml
`;
}

function main() {
  console.log('🗺️  Generating sitemap.xml and robots.txt for', BASE_URL);

  const publicDir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const allEntries = [
    ...staticPages,
    ...generateBlogEntries(),
    ...generateEventEntries(),
    ...generateWriteupEntries(),
  ];

  const uniqueEntries = Array.from(
    new Map(allEntries.map((e) => [e.loc, e])).values()
  ).sort((a, b) => b.priority - a.priority || a.loc.localeCompare(b.loc));

  const sitemapXml = generateSitemapXml(uniqueEntries);
  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemapXml, 'utf-8');

  const robotsTxt = generateRobotsTxtContent();
  const robotsPath = path.join(publicDir, 'robots.txt');
  fs.writeFileSync(robotsPath, robotsTxt, 'utf-8');

  const distDir = path.resolve(__dirname, '../dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml, 'utf-8');
    fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsTxt, 'utf-8');
  }

  console.log(`✅ Sitemap created: ${uniqueEntries.length} total URLs`);
  console.log(`   - Static & Blog pages: ${staticPages.length + blogPosts.length}`);
  console.log(`   - CTF Events: ${new Set(writeups.map((w) => w.ctfName)).size}`);
  console.log(`   - Writeup entries: ${writeups.length}`);
}

main();
