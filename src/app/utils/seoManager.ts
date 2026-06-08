/**
 * SEO Meta Tags Management Utility
 * Manages dynamic meta tag updates for different pages and writeups
 */

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
}

export const updateMetaTags = (meta: SEOMeta) => {
  // Update basic meta tags
  document.title = meta.title;
  updateMetaTag('name', 'description', meta.description);
  
  if (meta.keywords) {
    updateMetaTag('name', 'keywords', meta.keywords);
  }
  
  // Update Open Graph tags
  updateMetaTag('property', 'og:title', meta.title);
  updateMetaTag('property', 'og:description', meta.description);
  updateMetaTag('property', 'og:type', meta.type || 'website');
  
  if (meta.image) {
    updateMetaTag('property', 'og:image', meta.image);
  }
  
  if (meta.url) {
    updateMetaTag('property', 'og:url', meta.url);
    updateMetaTag('rel', 'canonical', meta.url);
  }
  
  // Update Twitter tags
  updateMetaTag('property', 'twitter:title', meta.title);
  updateMetaTag('property', 'twitter:description', meta.description);
  
  if (meta.image) {
    updateMetaTag('property', 'twitter:image', meta.image);
  }
  
  // Update article-specific tags
  if (meta.type === 'article' || meta.type === 'writeup') {
    if (meta.author) {
      updateMetaTag('name', 'author', meta.author);
    }
    if (meta.publishedDate) {
      updateMetaTag('property', 'article:published_time', meta.publishedDate);
    }
    if (meta.modifiedDate) {
      updateMetaTag('property', 'article:modified_time', meta.modifiedDate);
    }
  }
};

const updateMetaTag = (
  attrType: 'name' | 'property' | 'rel',
  attrValue: string,
  content: string
) => {
  let element = document.querySelector(`[${attrType}="${attrValue}"]`);
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrType, attrValue);
    document.head.appendChild(element);
  }
  
  if (attrType === 'rel') {
    // Handle canonical link tags
    const linkElement = document.querySelector(`link[rel="${attrValue}"]`);
    if (linkElement) {
      linkElement.setAttribute('href', content);
    } else {
      const newLink = document.createElement('link');
      newLink.setAttribute('rel', attrValue);
      newLink.setAttribute('href', content);
      document.head.appendChild(newLink);
    }
  } else {
    element.setAttribute('content', content);
  }
};

// Page-specific SEO configurations
// Domain configuration
const DOMAIN = 'https://rblxlabs.vercel.app';

export const pageConfigs = {
  home: {
    title: 'Nattt - CTF Writeups',
    description: 'Dokumentasi lengkap CTF write-ups. Jelajahi solusi challenge web, crypto, pwn, reverse engineering dengan analisis mendalam.',
    keywords: 'CTF, capture the flag, writeup, cybersecurity, hacking, web security, cryptography, pwn, reverse engineering',
    type: 'website' as const,
  },
  
  writeups: {
    title: 'Semua Write-Ups CTF - Nattt',
    description: 'Koleksi lengkap write-up Capture The Flag dengan solusi, analisis, dan pembelajaran.',
    keywords: 'CTF writeup, solusi challenge, capture the flag solutions, cybersecurity writeups',
    type: 'website' as const,
  },
  
  about: {
    title: 'Tentang - Nattt',
    description: 'Misi mendokumentasikan solusi CTF, dan kontribusi kami ke komunitas cybersecurity.',
    keywords: 'Nattt, tim CTF, cybersecurity team',
    type: 'website' as const,
  },
};

// Generate writeup-specific SEO metadata
export const generateWriteupMeta = (writeup: {
  title: string;
  category: string;
  difficulty: string;
  description: string;
  date: string;
  author: string;
  ctfName: string;
  id: string;
}): SEOMeta => {
  return {
    title: `${writeup.title} (${writeup.category}/${writeup.difficulty}) - Nattt`,
    description: writeup.description || `Solusi CTF challenge ${writeup.title} dari ${writeup.ctfName}. Kategori: ${writeup.category}, Tingkat Kesulitan: ${writeup.difficulty}. Ditulis oleh ${writeup.author}.`,
    keywords: `${writeup.title}, ${writeup.category}, ${writeup.ctfName}, CTF writeup, ${writeup.difficulty} difficulty, cybersecurity`,
    author: writeup.author,
    type: 'article' as const,
    publishedDate: new Date(writeup.date).toISOString(),
    url: `${DOMAIN}/writeup/${writeup.id}`,
  };
};

// JSON-LD Schema markup for structured data
export const generateWriteupSchema = (writeup: any) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headLine: writeup.title,
    description: writeup.description,
    image: 'https://ctfwriteups.example.com/og-image.jpg',
    author: {
      '@type': 'Person',
      name: writeup.author,
    },
    datePublished: writeup.date,
    dateModified: writeup.date,
    publisher: {
      '@type': 'Organization',
      name: 'Nattt',
      logo: {
        '@type': 'ImageObject',
        url: 'https://ctfwriteups.example.com/logo.png',
      },
    },
    keywords: writeup.category,
    inLanguage: 'id',
  };
};

// Generate Organization Schema
export const generateOrganizationSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Nattt',
    description: 'Dokumentasi resmi CTF write-ups dari Nattt',
    url: DOMAIN,
    logo: `${DOMAIN}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'General',
      email: 'contact@rblx-labs.segfault.com',
    },
  };
};
