/**
 * SEO Meta Tags & Schema Management Utility
 */

export const DOMAIN = 'https://nattts.vercel.app';
export const DEFAULT_OG_IMAGE = `${DOMAIN}/og-image.png`;

export interface SEOMeta {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  author?: string;
  type?: 'website' | 'article' | 'writeup';
  publishedDate?: string;
  modifiedDate?: string;
  schema?: Record<string, unknown>;
}

export const getCanonicalUrl = (path: string = '/'): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${DOMAIN}${cleanPath === '/' ? '/' : cleanPath}`;
};

export const updateMetaTags = (meta: SEOMeta) => {
  const pageTitle = meta.title.includes('Nattt') ? meta.title : `${meta.title} - Nattt`;
  const canonicalUrl = meta.url || getCanonicalUrl(window.location.pathname);
  const imageUrl = meta.image || DEFAULT_OG_IMAGE;

  // Basic tags
  document.title = pageTitle;
  setMetaTag('name', 'description', meta.description);
  setMetaTag('name', 'title', pageTitle);

  if (meta.keywords) {
    setMetaTag('name', 'keywords', meta.keywords);
  }
  if (meta.author) {
    setMetaTag('name', 'author', meta.author);
  }

  // Canonical tag
  setLinkTag('canonical', canonicalUrl);

  // Open Graph
  setMetaTag('property', 'og:title', pageTitle);
  setMetaTag('property', 'og:description', meta.description);
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('property', 'og:type', meta.type === 'article' || meta.type === 'writeup' ? 'article' : 'website');
  setMetaTag('property', 'og:image', imageUrl);
  setMetaTag('property', 'og:site_name', 'Nattt');
  setMetaTag('property', 'og:locale', 'id_ID');

  // Twitter (standard uses name="twitter:*")
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', pageTitle);
  setMetaTag('name', 'twitter:description', meta.description);
  setMetaTag('name', 'twitter:image', imageUrl);

  // Article specifics
  if (meta.type === 'article' || meta.type === 'writeup') {
    if (meta.publishedDate) {
      setMetaTag('property', 'article:published_time', meta.publishedDate);
    }
    if (meta.modifiedDate) {
      setMetaTag('property', 'article:modified_time', meta.modifiedDate);
    }
    if (meta.author) {
      setMetaTag('property', 'article:author', meta.author);
    }
  }

  // Inject or clean JSON-LD
  updateJsonLd(meta.schema);
};

function setMetaTag(attrType: 'name' | 'property', attrValue: string, content: string) {
  let element = document.querySelector(`meta[${attrType}="${attrValue}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrType, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setLinkTag(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

function updateJsonLd(schema?: Record<string, unknown>) {
  let script = document.getElementById('json-ld-schema') as HTMLScriptElement | null;
  if (!schema) {
    if (script) script.remove();
    return;
  }
  if (!script) {
    script = document.createElement('script');
    script.id = 'json-ld-schema';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schema);
}

export const pageConfigs = {
  home: {
    title: 'Nattt - CTF Writeups & Cybersecurity Research',
    description: 'Dokumentasi lengkap CTF write-ups dan riset cybersecurity dari Nattt. Solusi tantangan Web, Crypto, Pwn, Reverse Engineering, dan Malware Analysis dengan analisis teknis mendalam.',
    keywords: 'CTF writeups, capture the flag, cybersecurity, malware analysis, reverse engineering, binary exploitation, web security, cryptography',
    url: getCanonicalUrl('/'),
    type: 'website' as const,
  },
  blogList: {
    title: 'Blog & Research - Nattt',
    description: 'Artikel teknis, tutorial binary exploitation, analisis malware real-world, dan riset keamanan siber oleh Nattt.',
    keywords: 'cybersecurity blog, malware analysis, reverse engineering tutorial, pwn guide, ctf tutorial',
    url: getCanonicalUrl('/blog'),
    type: 'website' as const,
  },
  playground: {
    title: 'Breach Protocol Minigame - Nattt',
    description: 'Interactive Cyber Breach Protocol puzzle minigame.',
    keywords: 'breach protocol, cyber minigame, hacking simulator',
    url: getCanonicalUrl('/playground'),
    type: 'website' as const,
  },
};

export const generateBlogSchema = (post: {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  tags?: string[];
  coverImage?: string;
}) => ({
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
    url: DOMAIN,
    logo: {
      '@type': 'ImageObject',
      url: `${DOMAIN}/logo.png`,
    },
  },
  datePublished: post.date,
  dateModified: post.date,
  mainEntityOfPage: getCanonicalUrl(`/blog/${post.id}`),
  keywords: post.tags?.join(', ') || 'Cybersecurity',
  inLanguage: 'id',
});

export const generateWriteupSchema = (writeup: {
  id: string;
  title: string;
  category: string;
  ctfName: string;
  description?: string;
  date: string;
  author: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: `${writeup.title} - ${writeup.ctfName} (${writeup.category})`,
  description: writeup.description || `Solusi lengkap dan analisis CTF challenge ${writeup.title} kategori ${writeup.category} dari ${writeup.ctfName}.`,
  image: DEFAULT_OG_IMAGE,
  author: {
    '@type': 'Person',
    name: writeup.author,
  },
  publisher: {
    '@type': 'Organization',
    name: 'Nattt',
    url: DOMAIN,
    logo: {
      '@type': 'ImageObject',
      url: `${DOMAIN}/logo.png`,
    },
  },
  datePublished: writeup.date,
  dateModified: writeup.date,
  mainEntityOfPage: getCanonicalUrl(`/writeup/${writeup.id}`),
  keywords: `${writeup.category}, ${writeup.ctfName}, CTF writeup, cybersecurity`,
  inLanguage: 'id',
});

export const generateEventSchema = (event: {
  name: string;
  slug: string;
  totalWriteups: number;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: `${event.name} CTF Writeups`,
  description: `Koleksi ${event.totalWriteups} solusi challenge untuk event ${event.name}.`,
  url: getCanonicalUrl(`/event/${event.slug}`),
  publisher: {
    '@type': 'Organization',
    name: 'Nattt',
    url: DOMAIN,
  },
});

export const generateOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Nattt',
  description: 'Dokumentasi CTF Writeups & Riset Keamanan Siber',
  url: DOMAIN,
  logo: `${DOMAIN}/logo.png`,
});
