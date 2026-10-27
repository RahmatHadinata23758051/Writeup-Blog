import React, { useState, useEffect, useRef } from 'react';

interface TocItem {
  id: string;
  label: string;
  depth?: number;
}

interface SectionItem {
  id: string;
  label: string;
}

interface DocsTocProps {
  items?: TocItem[];
  /**
   * 'default' — CTF event tree (category labels are slugified, e.g. Web -> web_exploitation).
   * 'plain'   — blog/article headings, rendered verbatim with normal casing.
   */
  variant?: 'default' | 'plain';
}

const formatCategoryLabel = (label: string) => {
  const lower = label.toLowerCase().trim();
  if (lower === 'pwn') return 'binary_exploitation';
  if (lower === 'crypto') return 'cryptography';
  if (lower === 'reverse') return 'reverse_engineering';
  if (lower === 'web') return 'web_exploitation';
  return lower.replace(/\s+/g, '_');
};

export function DocsToc({ items, variant = 'default' }: DocsTocProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [viewportWriteup, setViewportWriteup] = useState<{ id: string; title: string; sections: SectionItem[] } | null>(null);
  const [activeSection, setActiveSection] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sectionObserverRef = useRef<IntersectionObserver | null>(null);

  const defaultItems = [
    { id: 'overview', label: 'Overview', depth: 0 },
    { id: 'featured-writeups', label: 'Featured Writeups', depth: 0 },
    { id: 'events', label: 'All Events', depth: 0 },
  ];

  const displayItems = items && items.length > 0 ? items : defaultItems;

  const serializedItems = items ? items.map(i => `${i.id}-${i.label}-${i.depth}`).join('|') : '';

  // Detect writeup sections from DOM
  useEffect(() => {
    if (!items || items.length === 0) return;

    const updateCurrentWriteup = () => {
      const mainEl = document.querySelector('main');
      if (!mainEl) return;

      const writeupElements = mainEl.querySelectorAll('[data-writeup-id]');
      let bestMatch: { id: string; title: string; sections: SectionItem[] } | null = null;
      let bestRatio = 0;

      writeupElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(viewportHeight, rect.bottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const ratio = visibleHeight / rect.height;

        if (ratio > bestRatio && ratio > 0.3) { // At least 30% visible
          bestRatio = ratio;
          try {
            const sections = JSON.parse(el.getAttribute('data-sections') || '[]');
            bestMatch = {
              id: el.getAttribute('data-writeup-id') || '',
              title: el.getAttribute('data-writeup-title') || '',
              sections,
            };
          } catch {
            // Ignore parse errors
          }
        }
      });

      if (bestMatch) {
        setViewportWriteup(bestMatch);
      } else if (bestRatio < 0.1) {
        setViewportWriteup(null);
      }
    };

    const handleScroll = () => {
      updateCurrentWriteup();
    };

    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }

    return () => {
      if (mainEl) {
        mainEl.removeEventListener('scroll', handleScroll);
      }
    };
  }, [items]);

  // Track active section within current writeup
  useEffect(() => {
    if (!viewportWriteup) {
      sectionObserverRef.current?.disconnect();
      return;
    }

    const observerOptions = {
      root: null,
      rootMargin: '-100px 0px -70% 0px',
      threshold: 0,
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      const visible = entries.find(entry => entry.isIntersecting);
      if (visible) {
        setActiveSection(visible.target.id);
      }
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    sectionObserverRef.current = observer;

    viewportWriteup.sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [viewportWriteup]);

  // Original scroll tracking for main TOC items
  useEffect(() => {
    if (!items || items.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '-80px 0px -60% 0px',
      threshold: 0,
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      const visible = entries.find(entry => entry.isIntersecting);
      if (visible) {
        setActiveId(visible.target.id);
      }
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    observerRef.current = observer;

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    const handleScroll = () => {
      const mainEl = document.querySelector('main');
      if (!mainEl) return;
      const scrollPos = mainEl.scrollTop + 140;
      
      let currentActiveId = '';
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          const mainRect = mainEl.getBoundingClientRect();
          const top = rect.top - mainRect.top + mainEl.scrollTop;
          if (scrollPos >= top) {
            currentActiveId = item.id;
          }
        }
      }
      if (currentActiveId) {
        setActiveId(currentActiveId);
      }
    };

    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }

    return () => {
      observer.disconnect();
      if (mainEl) mainEl.removeEventListener('scroll', handleScroll);
    };
  }, [serializedItems]);

  // Group items into 3-level hierarchy: Category -> Writeup -> Sections
  interface SectionItemToc {
    id: string;
    label: string;
    depth: number;
  }

  interface WriteupItem {
    writeup: TocItem;
    sections: SectionItemToc[];
  }

  interface CategoryGroup {
    category?: TocItem;
    writeups: WriteupItem[];
  }

  const categoryGroups: CategoryGroup[] = [];
  let currentCategory: CategoryGroup | null = null;
  let currentWriteup: WriteupItem | null = null;

  displayItems.forEach((item) => {
    const isCategory = item.depth === 1 || (!item.depth && item.id.startsWith('category-'));
    const isWriteup = item.depth === 2 || (item.depth !== 3 && item.id.startsWith('writeup-'));
    const isSection = item.depth === 3 || item.id.startsWith('section-');

    if (isCategory) {
      // Save previous category
      if (currentCategory) categoryGroups.push(currentCategory);
      // Start new category
      currentCategory = { category: item, writeups: [] };
      currentWriteup = null;
    } else if (isWriteup && currentCategory) {
      // Save previous writeup
      if (currentWriteup) currentCategory.writeups.push(currentWriteup);
      // Start new writeup
      currentWriteup = { writeup: item, sections: [] };
    } else if (isSection && currentWriteup && currentCategory) {
      // Add section to current writeup
      currentWriteup.sections.push({ ...item, depth: 3 });
    } else {
      // Fallback: items without category
      if (currentCategory) {
        if (currentWriteup) currentCategory.writeups.push(currentWriteup);
        categoryGroups.push(currentCategory);
        currentCategory = null;
        currentWriteup = null;
      }
      // Create standalone group
      if (isWriteup) {
        categoryGroups.push({
          writeups: [{ writeup: item, sections: [] }],
        });
      } else if (isCategory) {
        categoryGroups.push({ category: item, writeups: [] });
      }
    }
  });
  // Push last
  if (currentWriteup && currentCategory) currentCategory.writeups.push(currentWriteup);
  if (currentCategory) categoryGroups.push(currentCategory);

  return (
    <div className="w-full space-y-4">
      {/* ===== HEADER ===== */}
      <div className="flex items-center gap-2 border-b-2 border-[#141413] pb-2">
        <span className="w-1.5 h-5 bg-[#BF3511] rounded-sm shrink-0 animate-pulse" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#BF3511]">// TARGET DIRECTORY</span>
      </div>

      {/* ===== CURRENT TARGET PANEL ===== */}
      {viewportWriteup && (
        <div className="relative bg-[#FFFDF5] border-2 border-[#141413] shadow-[3px_3px_0_0_#141413] overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-[#141413] border-b-2 border-[#BF3511]">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#BF3511] text-[#FFFDF5] font-mono text-[9px] font-bold uppercase tracking-wider border-2 border-[#BF3511] shadow-[1px_1px_0_0_#BF3511]">
                ACTIVE TARGET
              </span>
              <span className="font-['Anton'] text-[11px] text-[#FFFDF5] uppercase tracking-wider">
                {viewportWriteup.title}
              </span>
            </div>
          </div>

          {/* Sections list */}
          <nav className="p-3 space-y-1 max-h-[300px] overflow-y-auto">
            {viewportWriteup.sections.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    document.getElementById(section.id)?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                  }}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 text-left rounded transition-all duration-150
                    ${isActive
                      ? 'bg-[#BF3511] text-[#FFFDF5] shadow-[2px_2px_0_0_#BF3511]'
                      : 'text-[#141413] hover:bg-[#141413]/5 hover:text-[#BF3511]'
                    }
                  `}
                  title={section.label}
                >
                  <span className={`w-5 h-5 flex items-center justify-center font-mono text-[10px] font-bold border border-[#141413]/30 ${isActive ? 'bg-[#FFFDF5] text-[#BF3511]' : 'bg-[#EFE9D8] text-[#5C574C]'}`}>
                    {viewportWriteup.sections.indexOf(section) + 1}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-wider truncate">{section.label}</span>
                  {isActive && <span className="ml-auto font-mono text-[9px] text-[#FFFDF5]/80">►</span>}
                </button>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="border-t-2 border-[#141413] mx-3" />
        </div>
      )}

      {/* ===== MAIN NAVIGATION TREE ===== */}
      <nav className="space-y-4">
        {categoryGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-2">
            {/* Category Header */}
            {group.category && (
              <button
                type="button"
                onClick={() => {
                  document.getElementById(group.category!.id)?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }}
                className={`
                  w-full text-left px-3 py-2 rounded transition-all duration-150 flex items-center justify-between
                  ${variant === 'plain'
                    ? 'font-sans text-[12px] leading-snug font-semibold tracking-normal whitespace-normal break-words [overflow-wrap:anywhere]'
                    : 'font-mono text-[12px] font-bold tracking-tight lowercase'
                  }
                  ${
                    activeId === group.category?.id || group.writeups.some(w => activeId === w.writeup.id || w.sections.some(s => activeId === s.id))
                      ? 'bg-[#BF3511] text-[#FFFDF5] shadow-[2px_2px_0_0_#BF3511]'
                      : 'bg-[#FFFDF5] text-[#5C574C] hover:bg-[#141413]/5 hover:text-[#BF3511] border border-[#141413]/20'
                  }
                `}
                title={group.category?.label}
              >
                <span>{variant === 'plain' ? group.category!.label : formatCategoryLabel(group.category!.label).toUpperCase()}</span>
                {group.writeups.length > 0 && (
                  <span className="px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#BF3511] bg-[#FFFDF5] border border-[#BF3511]/30">
                    {group.writeups.length}
                  </span>
                )}
              </button>
            )}

            {/* Writeups List */}
            {group.writeups.length > 0 && (
              <ul className="pl-2 border-l-2 border-[#141413]/20 space-y-2 ml-1">
                {group.writeups.map(({ writeup, sections }) => {
                  const isWriteupActive = activeId === writeup.id;
                  const isSectionActive = sections.some(s => activeId === s.id);
                  const isCurrentTarget = viewportWriteup?.id === writeup.id;

                  return (
                    <li key={writeup.id} className="space-y-1">
                      {/* Writeup Title Button */}
                      <button
                        type="button"
                        onClick={() => {
                          document.getElementById(writeup.id)?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                          });
                        }}
                        className={`
                          w-full text-left px-2.5 py-1.5 rounded transition-all duration-150 font-sans flex items-center justify-between
                          ${variant === 'plain'
                            ? 'text-[12px] leading-snug whitespace-normal break-words [overflow-wrap:anywhere]'
                            : 'text-[12px] font-semibold'
                          }
                          ${
                            isWriteupActive || isSectionActive
                              ? 'bg-[#BF3511] text-[#FFFDF5] shadow-[2px_2px_0_0_#BF3511] font-bold'
                              : isCurrentTarget
                                ? 'bg-[#BF3511]/10 text-[#BF3511] border border-[#BF3511]/30 font-medium'
                                : 'text-[#141413] hover:bg-[#141413]/5 hover:text-[#BF3511]'
                          }
                        `}
                        title={writeup.label}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <span className={`text-[10px] ${isWriteupActive || isSectionActive ? 'text-[#FFFDF5]' : 'text-[#BF3511]'}`}>
                            ▼
                          </span>
                          <span className="truncate">{writeup.label}</span>
                        </span>
                        {isCurrentTarget && (
                          <span className="shrink-0 px-1.5 py-0.2 font-mono text-[8px] uppercase tracking-wider text-[#FFFDF5] bg-[#BF3511] border border-[#BF3511] rounded">
                            LIVE
                          </span>
                        )}
                      </button>

                      {/* Nested Sub-Sections — Selalu tampil kayak daftar isi buku */}
                      {sections.length > 0 && (
                        <ul className="pl-3 border-l-2 border-[#141413]/15 space-y-0.5 ml-2 pt-0.5 pb-1">
                          {sections.map((section, sIdx) => {
                            const isCurrentSection = activeId === section.id || activeSection === section.id;
                            return (
                              <li key={section.id}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    document.getElementById(section.id)?.scrollIntoView({
                                      behavior: 'smooth',
                                      block: 'start',
                                    });
                                  }}
                                  className={`
                                    w-full text-left px-2 py-1 rounded transition-all duration-150 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5
                                    ${
                                      isCurrentSection
                                        ? 'bg-[#BF3511] text-[#FFFDF5] shadow-[1px_1px_0_0_#BF3511] font-bold'
                                        : 'text-[#5C574C] hover:bg-[#141413]/5 hover:text-[#141413]'
                                    }
                                  `}
                                  title={section.label}
                                >
                                  <span className={`w-3.5 h-3.5 flex items-center justify-center text-[8px] font-bold border ${isCurrentSection ? 'border-[#FFFDF5] text-[#FFFDF5]' : 'border-[#141413]/30 text-[#5C574C]'}`}>
                                    {sIdx + 1}
                                  </span>
                                  <span className="truncate">{section.label}</span>
                                  {isCurrentSection && <span className="ml-auto text-[9px] text-[#FFFDF5]">►</span>}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}