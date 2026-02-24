/**
 * Sitemap Generator Script (Node.js CommonJS)
 * Generate dynamic sitemap.xml from writeups data
 * 
 * Usage: 
 *   node generate-sitemap.js
 * 
 * Note: This is a Node.js script, not a TypeScript client-side file
 * If using ts-node, ensure @types/node is installed: npm i --save-dev @types/node
 */

const fs = require('fs') as any;
const path = require('path') as any;

// Define __dirname for CommonJS compatibility (with fallback)
let __dirname = '';
try {
  __dirname = path.dirname((require as any).main?.filename || '.');
} catch {
  __dirname = process.cwd?.() || '.';
}

// Load writeups data - simplified for static generation
// In production, you can import the actual writeups array from src/app/data/writeups.ts
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

interface WriteUp {
  id: string;
  title: string;
  date: string;
  category: string;
}

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: number;
}

const BASE_URL = 'https://ctfwriteups.example.com'; // Update this with your actual domain

// Define static pages
const staticPages: SitemapEntry[] = [
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

// Generate writeup pages
function generateWriteupEntries(): SitemapEntry[] {
  return writeups.map((writeup: WriteUp) => ({
    loc: `${BASE_URL}/writeup/${writeup.id}`,
    lastmod: formatDate(writeup.date),
    changefreq: 'never' as const,
    priority: 0.8,
  }));
}

// Generate category pages
function generateCategoryEntries(): SitemapEntry[] {
  const categories = new Set(writeups.map((w: WriteUp) => w.category.toLowerCase()));
  return Array.from(categories).map((category) => ({
    loc: `${BASE_URL}/category/${category}`,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'monthly' as const,
    priority: 0.7,
  }));
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

function generateSitemapXml(entries: SitemapEntry[]): string {
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

function escapeXml(str: string): string {
  const xmlChars: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  };

  return str.replace(/[&<>"']/g, (char) => xmlChars[char]);
}

function generateSitemapIndex(): string {
  // For sites with many URLs, split into multiple sitemaps
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += `  <sitemap>\n`;
  xml += `    <loc>${BASE_URL}/sitemap.xml</loc>\n`;
  xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
  xml += `  </sitemap>\n`;
  xml += '</sitemapindex>';
  return xml;
}

function main() {
  console.log('🗺️  Generating sitemap...');

  // Combine all entries
  const allEntries = [
    ...staticPages,
    ...generateWriteupEntries(),
    ...generateCategoryEntries(),
  ];

  // Remove duplicates and sort by priority (descending) then by URL
  const uniqueEntries = Array.from(
    new Map(allEntries.map((e) => [e.loc, e])).values()
  ).sort((a, b) => b.priority - a.priority || a.loc.localeCompare(b.loc));

  // Generate XML
  const sitemapXml = generateSitemapXml(uniqueEntries);

  // Write to file
  const outputPath = path.join(__dirname, 'public', 'sitemap.xml');
  fs.writeFileSync(outputPath, sitemapXml, 'utf-8');

  console.log(`✅ Sitemap generated successfully!`);
  console.log(`📝 Total URLs: ${uniqueEntries.length}`);
  console.log(`📄 Output: ${outputPath}`);
  console.log(`\n📊 URL Breakdown:`);
  console.log(`  - Static pages: ${staticPages.length}`);
  console.log(`  - Writeup pages: ${writeups.length}`);
  console.log(`  - Category pages: ${new Set(writeups.map((w) => w.category)).size}`);

  // Generate robots.txt with sitemap reference
  generateRobotsTxt(outputPath);
}

function generateRobotsTxt(sitemapPath: string) {
  const sitemapUrl = `${BASE_URL}/sitemap.xml`;
  const robotsTxt = `# Robots.txt - SEO Configuration
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
Sitemap: ${sitemapUrl}
`;

  const robotsPath = path.join(__dirname, 'public', 'robots.txt');
  fs.writeFileSync(robotsPath, robotsTxt, 'utf-8');
  console.log(`✅ robots.txt updated at ${robotsPath}`);
}

// Run generator
main();
