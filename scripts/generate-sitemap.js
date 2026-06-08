#!/usr/bin/env node

/**
 * Sitemap Generator Script
 * Generate dynamic sitemap.xml and robots.txt for SEO
 * 
 * Usage: 
 *   npx tsx scripts/generate-sitemap.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { writeups } from '../src/app/data/writeups.ts';
import { getEventSlug } from '../src/app/data/docsTree.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.SITE_URL || 'https://rblxlabs.vercel.app';

// Static pages configuration
const staticPages = [
  {
    loc: `${BASE_URL}/`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 1.0,
  },
];

/**
 * Generate event entries for sitemap
 */
function generateEventEntries() {
  const events = new Set();
  const entries = [];

  for (const writeup of writeups) {
    const eventName = writeup.ctfName || 'Uncategorized CTF';
    if (!events.has(eventName)) {
      events.add(eventName);
      const eventSlug = getEventSlug(eventName);
      entries.push({
        loc: `${BASE_URL}/#/event/${eventSlug}`,
        lastmod: formatDate(writeup.date),
        changefreq: 'weekly',
        priority: 0.9,
      });
    }
  }
  return entries;
}

/**
 * Generate writeup entries for sitemap
 */
function generateWriteupEntries() {
  return writeups.map((writeup) => ({
    loc: `${BASE_URL}/#/writeup/${writeup.id}`,
    lastmod: formatDate(writeup.date),
    changefreq: 'never',
    priority: 0.8,
  }));
}

/**
 * Format date string to YYYY-MM-DD
 */
function formatDate(dateString) {
  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Generate sitemap XML
 */
function generateSitemapXml(entries) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  entries.forEach((entry) => {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(entry.loc)}</loc>\n`;
    xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
    xml += `    <priority>${entry.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>';
  return xml;
}

/**
 * Escape XML special characters
 */
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

/**
 * Generate robots.txt content
 */
function generateRobotsTxtContent() {
  return `# Robots.txt - SEO Configuration
# Allow all crawlers by default

User-agent: *
Allow: /
Disallow: /admin/
Disallow: /private/
Disallow: /api/

# Specific rules for major search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /

# Disallow spam bots
User-agent: AhrefsBot
User-agent: SemrushBot
User-agent: DotBot
Disallow: /

# Crawl delay for polite crawling
User-agent: *
Crawl-delay: 1

# Sitemap location
Sitemap: ${BASE_URL}/sitemap.xml
`;
}

/**
 * Main function - generate both sitemap and robots.txt
 */
function main() {
  console.log('🗺️  Generating sitemap and robots.txt...\n');

  // Output to public folder (so it gets copied to build output by Vite)
  const publicDir = path.resolve(__dirname, '../public');

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Combine all sitemap entries
  const allEntries = [
    ...staticPages,
    ...generateEventEntries(),
    ...generateWriteupEntries(),
  ];

  // Remove duplicates and sort by priority (descending)
  const uniqueEntries = Array.from(
    new Map(allEntries.map((e) => [e.loc, e])).values()
  ).sort((a, b) => b.priority - a.priority || a.loc.localeCompare(b.loc));

  // Generate and write sitemap to public folder
  const sitemapXml = generateSitemapXml(uniqueEntries);
  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemapXml, 'utf-8');
  console.log(`✅ Sitemap generated at: ${sitemapPath}`);
  console.log(`   Total URLs: ${uniqueEntries.length}`);

  // Generate and write robots.txt to public folder
  const robotsTxt = generateRobotsTxtContent();
  const robotsPath = path.join(publicDir, 'robots.txt');
  fs.writeFileSync(robotsPath, robotsTxt, 'utf-8');
  console.log(`✅ Robots.txt generated at: ${robotsPath}`);

  // Also write to dist/ output folder if it exists (so they are available immediately without rebuilding)
  const distDir = path.resolve(__dirname, '../dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml, 'utf-8');
    fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsTxt, 'utf-8');
    console.log(`✅ Copy of files written directly to ${distDir}`);
  }

  // Print statistics
  const uniqueEventsCount = new Set(writeups.map((w) => w.ctfName || 'Uncategorized CTF')).size;
  console.log(`\n📊 Statistics:`);
  console.log(`   - Static pages: ${staticPages.length}`);
  console.log(`   - Event pages: ${uniqueEventsCount}`);
  console.log(`   - Writeup sections: ${writeups.length}`);
  console.log(`   - Total URLs in sitemap: ${uniqueEntries.length}`);
  console.log(`\n✨ All files generated successfully!`);
}

// Run the generator
main();
