import type { Writeup } from './writeupTypes';

/**
 * Slugify a string for URL-friendly identifiers
 */
export function slugify(input: string): string {
  if (!input) return 'untitled';

  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-alphanumeric except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse repeated hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    || 'untitled';
}

/**
 * Get URL slug for a writeup based on title
 */
export function getWriteupSlug(writeup: Writeup): string {
  return slugify(writeup.title);
}

/**
 * Get URL slug for an event/CTF
 */
export function getEventSlug(ctfName: string): string {
  return slugify(ctfName);
}

/**
 * Strongly typed tree nodes
 *
 * - ctfName controls which event group a writeup belongs to (sidebar item).
 * - category controls the H2 heading section inside the event page.
 * - id is the stable anchor used for search, TOC, and direct links (#/writeup/<id>).
 */
export type WriteUpNode = {
  id: string;
  title: string;
  slug: string;
  category: string;
  ctfName: string;
  difficulty?: string;
  points?: number | string;
  date?: string;
  original: Writeup;
};

export type DocsCategoryNode = {
  name: string;
  slug: string;
  writeups: WriteUpNode[];
};

export type DocsEventNode = {
  name: string;
  slug: string;
  categories: DocsCategoryNode[];
  totalWriteups: number;
  latestDate?: string;
};

export type EventSortOrder = 'newest' | 'oldest' | 'az' | 'za';

export function sortDocsEvents(events: DocsEventNode[], order: EventSortOrder = 'newest'): DocsEventNode[] {
  const copy = [...events];
  return copy.sort((a, b) => {
    if (order === 'newest') {
      const da = a.latestDate || '';
      const db = b.latestDate || '';
      if (da !== db) return db.localeCompare(da);
      return a.name.localeCompare(b.name);
    }
    if (order === 'oldest') {
      const da = a.latestDate || '9999-99-99';
      const db = b.latestDate || '9999-99-99';
      if (da !== db) return da.localeCompare(db);
      return a.name.localeCompare(b.name);
    }
    if (order === 'az') {
      return a.name.localeCompare(b.name);
    }
    if (order === 'za') {
      return b.name.localeCompare(a.name);
    }
    return 0;
  });
}

/**
 * Build a documentation tree from writeups data.
 * Groups writeups by ctfName (event) -> category -> individual writeup.
 */
export function buildDocsTree(writeupList: Writeup[]): DocsEventNode[] {
  // Group by event slug to prevent duplicate keys in React lists
  const eventMap = new Map<string, { name: string; writeups: Writeup[] }>();

  for (const writeup of writeupList) {
    const eventName = writeup.ctfName || 'Uncategorized CTF';
    const slug = getEventSlug(eventName);
    
    if (!eventMap.has(slug)) {
      eventMap.set(slug, { name: eventName, writeups: [] });
    } else {
      // Pick name variant with better capitalization (more uppercase characters)
      const currentName = eventMap.get(slug)!.name;
      const currentUpperCount = currentName.replace(/[^A-Z]/g, '').length;
      const newUpperCount = eventName.replace(/[^A-Z]/g, '').length;
      if (newUpperCount > currentUpperCount) {
        eventMap.get(slug)!.name = eventName;
      }
    }
    eventMap.get(slug)!.writeups.push(writeup);
  }

  // Build tree structure
  const events: DocsEventNode[] = [];

  for (const [eventSlug, eventData] of eventMap) {
    const eventName = eventData.name;
    const eventWriteups = eventData.writeups;

    // Group writeups by category
    const categoryMap = new Map<string, Writeup[]>();

    for (const writeup of eventWriteups) {
      const categoryName = writeup.category || 'Misc';
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, []);
      }
      categoryMap.get(categoryName)!.push(writeup);
    }

    // Preferred category display order — unlisted categories sort alphabetically after these
    const CATEGORY_ORDER: string[] = [
      'Web', 'Crypto', 'Forensics', 'Reverse', 'Reverse Engineering',
      'Binary Exploitation', 'Pwn', 'AI', 'Malware Analysis', 'Malware', 'Mobile', 'Hardware', 'Blockchain', 'Kubernetes', 'Steganography', 'OSINT', 'Misc',
    ];

    function categoryRank(name: string): number {
      const idx = CATEGORY_ORDER.findIndex(
        (c) => c.toLowerCase() === name.toLowerCase()
      );
      return idx === -1 ? CATEGORY_ORDER.length : idx;
    }

    // Build category nodes, sorted by preferred order
    const categories: DocsCategoryNode[] = Array.from(categoryMap)
      .sort(([a], [b]) => {
        const ra = categoryRank(a);
        const rb = categoryRank(b);
        if (ra !== rb) return ra - rb;
        return a.localeCompare(b);
      })
      .map(([categoryName, categoryWriteups]) => ({
        name: categoryName,
        slug: slugify(categoryName),
        writeups: categoryWriteups
          .sort((a, b) => a.title.localeCompare(b.title))
          .map((writeup) => ({
            id: writeup.id,
            title: writeup.title,
            slug: getWriteupSlug(writeup),
            category: writeup.category,
            ctfName: writeup.ctfName,
            difficulty: writeup.difficulty,
            points: writeup.points,
            date: writeup.date,
            original: writeup,
          })),
      }));

    // Determine newest date for event sorting
    const latestDate = eventWriteups.reduce((best, wu) => {
      if (wu.date && wu.date > best) return wu.date;
      return best;
    }, '');

    events.push({
      name: eventName,
      slug: eventSlug,
      categories,
      totalWriteups: eventWriteups.length,
      latestDate: latestDate || undefined,
    });
  }

  // Default: sort events newest first
  return sortDocsEvents(events, 'newest');
}
