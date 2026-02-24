/**
 * useSEO Hook - Manages SEO meta tags for current page
 * Usage: useSEO() or useSEO(customMeta)
 */

import { useEffect } from 'react';
import {
  updateMetaTags,
  SEOMeta,
  pageConfigs,
  generateWriteupMeta,
  generateWriteupSchema,
  generateOrganizationSchema,
} from '../utils/seoManager';

export const useSEO = (customMeta?: SEOMeta, page?: string) => {
  useEffect(() => {
    if (customMeta) {
      updateMetaTags(customMeta);
    } else if (page && page in pageConfigs) {
      const config = pageConfigs[page as keyof typeof pageConfigs];
      updateMetaTags({
        ...config,
        url: `https://rblxlabs.vercel.app${page === 'home' ? '/' : `/${page}`}`,
      });
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [customMeta, page]);
};

/**
 * useWriteupSEO - Specialized hook for writeup pages
 * Handles both meta tags and JSON-LD schema markup
 */
export const useWriteupSEO = (writeup: any) => {
  useEffect(() => {
    if (!writeup) return;
    
    // Update meta tags
    const meta = generateWriteupMeta(writeup);
    updateMetaTags(meta);
    
    // Add JSON-LD schema
    const schema = generateWriteupSchema(writeup);
    addJsonLdSchema(schema);
    
    // Clean up schema on unmount
    return () => {
      removeJsonLdSchema();
    };
  }, [writeup?.id]);
};

/**
 * useHomepageSEO - Sets SEO for homepage
 * Includes both page meta tags and organization schema
 */
export const useHomepageSEO = () => {
  useEffect(() => {
    const homepage = pageConfigs.home;
    updateMetaTags({
      ...homepage,
      url: 'https://rblxlabs.vercel.app/',
    });
    
    // Add organization schema
    const schema = generateOrganizationSchema();
    addJsonLdSchema(schema);
    
    return () => {
      removeJsonLdSchema();
    };
  }, []);
};

// Helper functions for JSON-LD schema management
export const addJsonLdSchema = (schema: any) => {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  script.id = 'json-ld-schema';
  document.head.appendChild(script);
};

export const removeJsonLdSchema = () => {
  const schemaScript = document.getElementById('json-ld-schema');
  if (schemaScript) {
    schemaScript.remove();
  }
};
