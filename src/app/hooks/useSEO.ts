import { useEffect } from 'react';
import {
  updateMetaTags,
  SEOMeta,
  pageConfigs,
  getCanonicalUrl,
  DOMAIN,
} from '../utils/seoManager';

export const useSEO = (customMeta?: SEOMeta, page?: string) => {
  useEffect(() => {
    if (customMeta) {
      updateMetaTags(customMeta);
    } else if (page && page in pageConfigs) {
      const config = pageConfigs[page as keyof typeof pageConfigs];
      updateMetaTags({
        ...config,
        url: getCanonicalUrl(page === 'home' ? '/' : `/${page}`),
      });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [customMeta, page]);
};

export { DOMAIN };
