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
  const [currentWriteup, setCurrentWriteup] = useState<{ id: string; title: string; sections: SectionItem[] } | null>(null);
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
        setCurrentWriteup(bestMatch);
      } else if (bestRatio < 0.1) {
        setCurrentWriteup(null);
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
    if (!currentWriteup) {
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

    currentWriteup.sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [currentWriteup]);

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

  // Group items by category
  interface GroupedToc {
    category?: TocItem;
    challenges: TocItem[];
  }

  const groups: GroupedToc[] = [];
  let currentGroup: GroupedToc | null = null;

  displayItems.forEach((item) => {
    const isCategory = item.depth === 1 || item.id.startsWith('category-');
    const isChallenge = item.depth === 2 || item.id.startsWith('writeup-');

    if (isCategory) {
      if (currentGroup) groups.push(currentGroup);
      currentGroup = { category: item, challenges: [] };
    } else if (isChallenge && currentGroup) {
      currentGroup.challenges.push(item);
    } else {
      if (currentGroup) {
        groups.push(currentGroup);
        currentGroup = null;
      }
      groups.push({ challenges: [item] });
    }
  });
  if (currentGroup) groups.push(currentGroup);

  return (
    <div className="w-full space-y-4">
      {/* ===== HEADER ===== */}
      <div className="flex items-center gap-2 border-b-2 border-[#141413] pb-2">
        <span className="w-1.5 h-5 bg-[#BF3511] rounded-sm shrink-0 animate-pulse" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#BF3511]">// TARGET DIRECTORY</span>
      </div>

      {/* ===== CURRENT TARGET PANEL ===== */}
      {currentWriteup && (
        <div className="relative bg-[#FFFDF5] border-2 border-[#141413] shadow-[3px_3px_0_0_#141413] overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-[#141413] border-b-2 border-[#BF3511]">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#BF3511] text-[#FFFDF5] font-mono text-[9px] font-bold uppercase tracking-wider border-2 border-[#BF3511] shadow-[1px_1px_0_0_#BF3511]">
                ACTIVE TARGET
              </span>
              <span className="font-['Anton'] text-[11px] text-[#FFFDF5] uppercase tracking-wider">
                {currentWriteup.title}
              </span>
            </div>
          </div>

          {/* Sections list */}
          <nav className="p-3 space-y-1 max-h-[300px] overflow-y-auto">
            {currentWriteup.sections.map((section) => {
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
                    {currentWriteup.sections.indexOf(section) + 1}
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
      <nav className="space-y-3">
        {groups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-2 mt-4 first:mt-0">
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
                  w-full text-left px-3 py-2 rounded transition-all duration-150
                  ${variant === 'plain'
                    ? 'font-sans text-[12px] leading-snug font-semibold tracking-normal whitespace-normal break-words [overflow-wrap:anywhere]'
                    : 'font-mono text-[13px] font-bold tracking-tight lowercase'
                  }
                  ${
                    activeId === group.category?.id || group.challenges.some(c => activeId === c.id)
                      ? 'bg-[#BF3511] text-[#FFFDF5] shadow-[2px_2px_0_0_#BF3511]'
                      : 'bg-[#FFFDF5] text-[#5C574C] hover:bg-[#141413]/5 hover:text-[#BF3511] border border-[#141413]/20'
                  }
                `}
                title={group.category?.label}
              >
                {variant === 'plain' ? group.category!.label : formatCategoryLabel(group.category!.label).toUpperCase()}
                {group.challenges.length > 0 && (
                  <span className="ml-auto px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#BF3511] bg-[#FFFDF5] border border-[#BF3511]/30">
                    {group.challenges.length} TARGETS
                  </span>
                )}
              </button>
            )}
            {group.challenges.length > 0 && (
              <ul className="pl-3 border-l-2 border-[#141413]/20 space-y-1 ml-1 relative">
                {group.challenges.map((challenge) => {
                  const isActive = activeId === challenge.id;
                  const isCurrentTarget = currentWriteup?.id === challenge.id;
                  return (
                    <li key={challenge.id} className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          document.getElementById(challenge.id)?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                          });
                        }}
                        className={`
                          w-full text-left px-3 py-2 rounded transition-all duration-150 font-sans
                          ${variant === 'plain'
                            ? 'text-[12px] leading-snug whitespace-normal break-words [overflow-wrap:anywhere]'
                            : 'text-[13px] truncate'
                          }
                          ${
                            isActive
                              ? 'bg-[#BF3511] text-[#FFFDF5] shadow-[2px_2px_0_0_#BF3511] font-bold'
                              : isCurrentTarget
                                ? 'bg-[#BF3511]/10 text-[#BF3511] border border-[#BF3511]/30 font-medium'
                                : 'text-[#5C574C] hover:bg-[#141413]/5 hover:text-[#141413]'
                          }
                        `}
                        title={challenge.label}
                      >
                        <span className="flex items-center gap-2">
                          {isActive && <span className="text-[#FFFDF5]">►</span>}
                          {!isActive && <span className="w-4 text-transparent">►</span>}
                          <span>{challenge.label}</span>
                        </span>
                        {isCurrentTarget && (
                          <span className="ml-auto px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-[#FFFDF5] bg-[#BF3511] border border-[#BF3511] rounded">
                            LIVE
                          </span>
                        )}
                      </button>
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