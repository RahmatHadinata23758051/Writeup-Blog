#!/usr/bin/env node

/**
 * Sitemap Generator Script
 * Generate dynamic sitemap.xml and robots.txt for SEO
 * 
 * Usage: 
 *   node generate-sitemap.js
 *   npx node generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');

// Writeups data - fetched from source
const writeups = [
  { id: '1', title: 'The Mosaic', date: '2025-12-30', category: 'Misc' },
  { id: '2', title: 'Shaw', date: '2025-12-28', category: 'Crypto' },
  { id: '3', title: 'Blazingly Fast Memory Unsafe', date: '2025-02-24', category: 'Pwn' },
  { id: '4', title: '(In)Secure Vault - 2', date: '2025-02-24', category: 'Reverse' },
  { id: '5', title: 'Metared Cine Festival Level 2', date: '2025-02-24', category: 'Pwn' },
  { id: '6', title: '1.5x-engineer 1', date: '2025-02-24', category: 'Forensics' },
  { id: '7', title: 'Sloppy Admin 1', date: '2025-02-24', category: 'Crypto' },
  { id: '8', title: 'Wordler Solver 1', date: '2025-02-24', category: 'Misc' },
  { id: '9', title: 'Pooking', date: '2025-02-24', category: 'Web' },
  { id: '10', title: 'Meme Upload Service', date: '2025-02-24', category: 'Web' },
  { id: '11', title: 'Subscriber', date: '2025-02-24', category: 'Web' },
  { id: '12', title: 'Zippy', date: '2026-02-24', category: 'Forensics' },
  { id: '13', title: 'GOT me', date: '2026-02-25', category: 'Pwn' },
];

const BASE_URL = process.env.SITE_URL || 'https://rblxlabs.vercel.app';

// Static pages configuration
const staticPages = [
  {
    loc: `${BASE_URL}/`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 1.0,
  },
  {
    loc: `${BASE_URL}/about`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.8,
  },
  {
    loc: `${BASE_URL}/writeups`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.9,
  },
];

/**
 * Generate writeup entries for sitemap
 */
function generateWriteupEntries() {
  return writeups.map((writeup) => ({
    loc: `${BASE_URL}/writeup/${writeup.id}`,
    lastmod: formatDate(writeup.date),
    changefreq: 'never',
    priority: 0.8,
  }));
}

/**
 * Generate category entries for sitemap
 */
function generateCategoryEntries() {
  const categories = new Set(writeups.map((w) => w.category.toLowerCase()));
  return Array.from(categories).map((category) => ({
    loc: `${BASE_URL}/category/${category}`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.7,
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

  const __dirname = path.resolve(__dirname || '.');
  const publicDir = path.join(__dirname, 'public');

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Combine all sitemap entries
  const allEntries = [
    ...staticPages,
    ...generateWriteupEntries(),
    ...generateCategoryEntries(),
  ];

  // Remove duplicates and sort by priority (descending)
  const uniqueEntries = Array.from(
    new Map(allEntries.map((e) => [e.loc, e])).values()
  ).sort((a, b) => b.priority - a.priority || a.loc.localeCompare(b.loc));

  // Generate and write sitemap
  const sitemapXml = generateSitemapXml(uniqueEntries);
  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemapXml, 'utf-8');
  console.log(`✅ Sitemap generated at: ${sitemapPath}`);
  console.log(`   Total URLs: ${uniqueEntries.length}`);

  // Generate and write robots.txt
  const robotsTxt = generateRobotsTxtContent();
  const robotsPath = path.join(publicDir, 'robots.txt');
  fs.writeFileSync(robotsPath, robotsTxt, 'utf-8');
  console.log(`✅ Robots.txt generated at: ${robotsPath}`);

  // Print statistics
  console.log(`\n📊 Statistics:`);
  console.log(`   - Static pages: ${staticPages.length}`);
  console.log(`   - Writeup pages: ${writeups.length}`);
  console.log(`   - Category pages: ${new Set(writeups.map((w) => w.category)).size}`);
  console.log(`   - Total URLs in sitemap: ${uniqueEntries.length}`);
  console.log(`\n✨ All files generated successfully!`);
}

// Run the generator
main();
