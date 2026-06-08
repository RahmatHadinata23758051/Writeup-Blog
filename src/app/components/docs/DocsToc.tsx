import React, { useState, useEffect } from 'react';

interface TocItem {
  id: string;
  label: string;
  depth?: number;
}

interface DocsTocProps {
  items?: TocItem[];
}

const formatCategoryLabel = (label: string) => {
  const lower = label.toLowerCase().trim();
  if (lower === 'pwn') return 'binary_exploitation';
  if (lower === 'crypto') return 'cryptography';
  if (lower === 'reverse') return 'reverse_engineering';
  if (lower === 'web') return 'web_exploitation';
  return lower.replace(/\s+/g, '_');
};

export function DocsToc({ items }: DocsTocProps) {
  const [activeId, setActiveId] = useState<string>('');

  const defaultItems = [
    { id: 'overview', label: 'Overview', depth: 0 },
    { id: 'featured-writeups', label: 'Featured Writeups', depth: 0 },
    { id: 'events', label: 'All Events', depth: 0 },
  ];

  const displayItems = items && items.length > 0 ? items : defaultItems;

  const serializedItems = items ? items.map(i => `${i.id}-${i.label}-${i.depth}`).join('|') : '';

  useEffect(() => {
    if (!items || items.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '-80px 0px -60% 0px', // Focus window near the top of the viewport
      threshold: 0,
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      const visible = entries.find(entry => entry.isIntersecting);
      if (visible) {
        setActiveId(visible.target.id);
      }
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) {
        observer.observe(el);
      }
    });

    const handleScroll = () => {
      const mainEl = document.querySelector('main');
      if (!mainEl) return;
      const scrollPos = mainEl.scrollTop + 140; // Offset threshold
      
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
      if (mainEl) {
        mainEl.removeEventListener('scroll', handleScroll);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (currentGroup) {
        groups.push(currentGroup);
      }
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
  if (currentGroup) {
    groups.push(currentGroup);
  }

  return (
    <div className="rounded-lg border border-[var(--docs-border-soft)] bg-[var(--docs-bg-soft)]/20 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4 w-full">
      {/* Header */}
      <div className="text-[12px] font-bold tracking-widest text-[var(--docs-text-soft)] uppercase flex items-center gap-2 border-b border-[var(--docs-border-soft)] pb-3 font-sans">
        <span className="w-1.5 h-3.5 bg-[var(--docs-accent)] rounded-sm shrink-0"></span>
        <span>ON THIS PAGE</span>
      </div>

      <nav className="space-y-4">
        {groups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-2 mt-4 first:mt-0">
            {group.category && (
              <button
                type="button"
                onClick={() => {
                  document.getElementById(group.category!.id)?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                  });
                }}
                className={`block w-full text-left font-mono text-[14px] font-bold tracking-tight lowercase transition-colors duration-150 hover:text-[var(--docs-text)] ${
                  activeId === group.category.id || group.challenges.some(c => activeId === c.id) 
                    ? 'text-[var(--docs-text)]' 
                    : 'text-[var(--docs-text-soft)]'
                }`}
                title={group.category.label}
              >
                {formatCategoryLabel(group.category.label)}
              </button>
            )}
            {group.challenges.length > 0 && (
              <ul className="pl-3.5 border-l-2 border-[var(--docs-border-soft)] space-y-2 ml-1 relative">
                {group.challenges.map((challenge) => {
                  const isActive = activeId === challenge.id;
                  return (
                    <li key={challenge.id} className="relative">
                      {isActive && (
                        <span className="absolute -left-[17px] top-1/2 -translate-y-1/2 w-1.5 h-4 bg-[var(--docs-accent)] rounded-sm z-10" />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          document.getElementById(challenge.id)?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                          });
                        }}
                        className={`
                          block w-full text-left text-[14px] py-1 px-2.5 rounded transition-all duration-150 truncate font-sans
                          ${
                            isActive
                              ? 'text-[var(--docs-accent)] bg-[var(--docs-accent-soft)]/50 font-semibold'
                              : 'text-[var(--docs-text-muted)] hover:text-[var(--docs-text)] hover:bg-[var(--docs-bg-soft)]/20'
                          }
                        `}
                        title={challenge.label}
                      >
                        {challenge.label}
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
