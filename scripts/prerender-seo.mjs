#!/usr/bin/env node

/**
 * Prerender SEO Shells
 * Generates static index.html shells in dist/ for all public routes with exact
 * titles, descriptions, canonical links, Open Graph, Twitter cards, and JSON-LD schema.
 * 
 * Ensures social scrapers (Discord, WhatsApp, Twitter, Telegram) and search engine
 * crawlers (Google, Bing) get rich, route-specific metadata without needing SSR or client JS.
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
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function injectMeta(templateHtml, meta) {
  const title = meta.title.includes('Nattt') ? meta.title : `${meta.title} - Nattt`;
  const canonicalUrl = meta.url;
  const image = meta.image || DEFAULT_OG_IMAGE;
  const type = meta.type || 'website';
  const description = meta.description;

  let html = templateHtml;

  // Replace Title
  html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(/<meta name="title" content=".*?" \/>/i, `<meta name="title" content="${escapeHtml(title)}" />`);

  // Replace Description
  html = html.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="${escapeHtml(description)}" />`);

  // Replace Canonical
  html = html.replace(/<link rel="canonical" href=".*?" \/>/i, `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`);

  // Replace Open Graph
  html = html.replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  html = html.replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`);
  html = html.replace(/<meta property="og:type" content=".*?" \/>/i, `<meta property="og:type" content="${escapeHtml(type)}" />`);
  html = html.replace(/<meta property="og:image" content=".*?" \/>/i, `<meta property="og:image" content="${escapeHtml(image)}" />`);

  // Replace Twitter
  html = html.replace(/<meta name="twitter:title" content=".*?" \/>/i, `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  html = html.replace(/<meta name="twitter:description" content=".*?" \/>/i, `<meta name="twitter:description" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta name="twitter:url" content=".*?" \/>/i, `<meta name="twitter:url" content="${escapeHtml(canonicalUrl)}" />`);
  html = html.replace(/<meta name="twitter:image" content=".*?" \/>/i, `<meta name="twitter:image" content="${escapeHtml(image)}" />`);

  // Inject JSON-LD Schema before </head>
  if (meta.schema) {
    const jsonLdScript = `\n    <script id="json-ld-schema" type="application/ld+json">${JSON.stringify(meta.schema)}</script>\n  </head>`;
    html = html.replace('</head>', jsonLdScript);
  }

  return html;
}

function writeShell(distDir, routePath, htmlContent) {
  const targetDir = path.join(distDir, routePath);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'index.html'), htmlContent, 'utf-8');
}

function main() {
  const distDir = path.resolve(__dirname, '../dist');
  const templatePath = path.join(distDir, 'index.html');

  if (!fs.existsSync(templatePath)) {
    console.error('❌ dist/index.html not found. Run vite build first.');
    process.exit(1);
  }

  console.log('⚡ Prerendering static SEO HTML shells in dist/ for crawlers...');
  const baseHtml = fs.readFileSync(templatePath, 'utf-8');

  let generatedCount = 0;

  // 1. Static Pages
  const staticRoutes = [
    {
      route: 'blog',
      meta: {
        title: 'Blog & Riset Keamanan Siber - Nattt',
        description: 'Artikel teknis, analisis malware, tutorial reverse engineering dan binary exploitation oleh Nattt.',
        url: `${BASE_URL}/blog`,
        type: 'website',
      },
    },
    {
      route: 'playground',
      meta: {
        title: 'Breach Protocol Minigame - Nattt',
        description: 'Interactive Cyber Breach Protocol puzzle minigame by Nattt.',
        url: `${BASE_URL}/playground`,
        type: 'website',
      },
    },
  ];

  for (const item of staticRoutes) {
    const html = injectMeta(baseHtml, item.meta);
    writeShell(distDir, item.route, html);
    generatedCount++;
  }

  // 2. Blog Posts
  for (const post of blogPosts) {
    const meta = {
      title: `${post.title} | Nattt Blog`,
      description: post.excerpt,
      url: `${BASE_URL}/blog/${post.id}`,
      type: 'article',
      image: post.coverImage || DEFAULT_OG_IMAGE,
      schema: {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: post.title,
        description: post.excerpt,
        image: post.coverImage || DEFAULT_OG_IMAGE,
        author: {
          '@type': 'Person',
          name: post.author,
        },
        publisher: {
          '@type': 'Organization',
          name: 'Nattt',
          url: BASE_URL,
          logo: {
            '@type': 'ImageObject',
            url: `${BASE_URL}/logo.png`,
          },
        },
        datePublished: post.date,
        dateModified: post.date,
        mainEntityOfPage: `${BASE_URL}/blog/${post.id}`,
        keywords: post.tags?.join(', ') || 'Cybersecurity',
        inLanguage: 'id',
      },
    };

    const html = injectMeta(baseHtml, meta);
    writeShell(distDir, `blog/${post.id}`, html);
    generatedCount++;
  }

  // 3. Events
  const events = new Set();
  for (const writeup of writeups) {
    const eventName = writeup.ctfName || 'Uncategorized CTF';
    if (!events.has(eventName)) {
      events.add(eventName);
      const eventSlug = getEventSlug(eventName);
      const meta = {
        title: `${eventName} CTF Writeups - Nattt`,
        description: `Koleksi solusi dan pembahasan challenge CTF untuk ${eventName}.`,
        url: `${BASE_URL}/event/${eventSlug}`,
        type: 'website',
        schema: {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `${eventName} CTF Writeups`,
          description: `Koleksi writeup untuk ${eventName}`,
          url: `${BASE_URL}/event/${eventSlug}`,
        },
      };

      const html = injectMeta(baseHtml, meta);
      writeShell(distDir, `event/${eventSlug}`, html);
      generatedCount++;
    }
  }

  // 4. Individual Writeup Pages
  for (const writeup of writeups) {
    const meta = {
      title: `${writeup.title} - ${writeup.ctfName} (${writeup.category}) | Nattt`,
      description: writeup.description || `Solusi CTF challenge ${writeup.title} kategori ${writeup.category} dari ${writeup.ctfName}. Ditulis oleh ${writeup.author}.`,
      url: `${BASE_URL}/writeup/${writeup.id}`,
      type: 'article',
      schema: {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: `${writeup.title} - ${writeup.ctfName} (${writeup.category})`,
        description: writeup.description || `Solusi challenge ${writeup.title}`,
        image: DEFAULT_OG_IMAGE,
        author: {
          '@type': 'Person',
          name: writeup.author,
        },
        publisher: {
          '@type': 'Organization',
          name: 'Nattt',
          url: BASE_URL,
        },
        datePublished: writeup.date,
        mainEntityOfPage: `${BASE_URL}/writeup/${writeup.id}`,
        keywords: `${writeup.category}, ${writeup.ctfName}, CTF writeup`,
        inLanguage: 'id',
      },
    };

    const html = injectMeta(baseHtml, meta);
    writeShell(distDir, `writeup/${writeup.id}`, html);
    generatedCount++;
  }

  console.log(`✅ Prerendered ${generatedCount} static HTML shells for all routes in dist/!`);
}

main();
