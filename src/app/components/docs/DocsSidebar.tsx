import React, { useState, useMemo } from 'react';
import type { DocsEventNode, EventSortOrder } from '../../data/docsTree';
import { sortDocsEvents } from '../../data/docsTree';

// React Icons
import { PiGameControllerFill } from 'react-icons/pi';
import { SiBloglovin } from 'react-icons/si';
import { 
  FaTheRedYeti, 
  FaThemeisle, 
  FaFlag, 
  FaSkull, 
  FaTerminal, 
  FaShieldAlt, 
  FaLock, 
  FaKey, 
  FaMicrochip, 
  FaHome,
  FaCompass,
  FaWrench,
  FaFileCode,
  FaServer,
  FaBug,
  FaSortAmountDown,
  FaSortAmountUpAlt,
  FaSortAlphaDown
} from 'react-icons/fa';
import { GiBirdTwitter, GiNinjaHead, GiAbstract053, GiProcessor } from 'react-icons/gi';

interface DocsSidebarProps {
  tree?: DocsEventNode[];
  activeEventSlug?: string;
  activeWriteupId?: string;
  children?: React.ReactNode;
  onHomeClick?: () => void;
  onEventClick?: (eventSlug: string) => void;
  onWriteupClick?: (writeupId: string) => void;
  isBlogActive?: boolean;
  onBlogClick?: () => void;
  isPlaygroundActive?: boolean;
  onPlaygroundClick?: () => void;
  mode?: 'tree' | 'events-only';
}

const eventIcons = [
  FaTheRedYeti,
  FaThemeisle,
  GiBirdTwitter,
  FaFlag,
  FaSkull,
  FaTerminal,
  FaShieldAlt,
  FaLock,
  FaKey,
  FaMicrochip,
  FaCompass,
  FaWrench,
  FaFileCode,
  FaServer,
  FaBug,
  GiNinjaHead,
  GiAbstract053,
  GiProcessor
];

export function getEventIcon(eventName: string) {
  const name = eventName.toLowerCase();
  if (name.includes('project sekai')) {
    return (
      <svg
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110"
      >
        {/* Pole */}
        <line x1="4" y1="2" x2="4" y2="18" stroke="#00c2d7" strokeWidth="1.5" strokeLinecap="round" />
        {/* Wavy Flag */}
        <path
          d="M4,3 C7,3 8,4.5 11,4.5 C14,4.5 15,3 18,3 L18,10.5 C15,10.5 14,12 11,12 C8,12 7,10.5 4,10.5 Z"
          fill="#00c2d7"
        />
        {/* Music Note */}
        <path
          d="M10,8.5a1.1,1.1,0,1,1,-1.1,-1.1H10V5.5h2.2v0.9H11V8.5a1.1,1.1,0,0,1,-1,0Z"
          fill="#0f3d61"
        />
      </svg>
    );
  }
  if (name.includes('r3ctf')) {
    return (
      <img
        src="/r3ctf_logo.png"
        alt="R3CTF Logo"
        className="h-4.5 w-4.5 shrink-0 rounded-full transition-transform group-hover:scale-110 object-contain bg-white p-0.5"
      />
    );
  }

  // Deterministic hash-based selection of icons
  let hash = 0;
  for (let i = 0; i < eventName.length; i++) {
    hash = eventName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % eventIcons.length;
  const IconComponent = eventIcons[index];
  return <IconComponent className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />;
}


export function DocsSidebar({
  tree,
  activeEventSlug,
  activeWriteupId,
  children,
  onHomeClick,
  onEventClick,
  onWriteupClick,
  isBlogActive,
  onBlogClick,
  isPlaygroundActive,
  onPlaygroundClick,
  mode = 'tree',
}: DocsSidebarProps) {
  // Sort order: default 'newest' (newest writeups / events at the top)
  const [sortOrder, setSortOrder] = useState<EventSortOrder>('newest');

  const sortedTree = useMemo(() => {
    if (!tree) return [];
    return sortDocsEvents(tree, sortOrder);
  }, [tree, sortOrder]);

  const cycleSortOrder = () => {
    setSortOrder((current) => {
      if (current === 'newest') return 'oldest';
      if (current === 'oldest') return 'az';
      return 'newest';
    });
  };

  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(
    new Set(activeEventSlug ? [activeEventSlug] : tree?.slice(0, 2).map((e) => e.slug))
  );

  const toggleEvent = (eventSlug: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventSlug)) {
      newExpanded.delete(eventSlug);
    } else {
      newExpanded.add(eventSlug);
    }
    setExpandedEvents(newExpanded);
  };

  const renderSidebarFooter = () => null;

  if (mode === 'events-only') {
    return (
      <div className="flex flex-col h-full min-h-[calc(100vh-10rem)]">
        <nav className="space-y-1.5 flex-1">
          {/* Home button */}
          <button
            type="button"
            onClick={onHomeClick}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-left transition-colors cursor-pointer group ${(!activeEventSlug && !isBlogActive && !isPlaygroundActive)
                ? 'bg-[#141413] text-[#F6F0E0]'
                : 'text-[#5C574C] hover:text-[#141413] hover:bg-[#E6DFCB]'
              }`}
          >
            <FaHome className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
            <span className="font-mono uppercase tracking-[0.12em] text-[12px] font-bold">Home</span>
          </button>

          {/* Blog button */}
          <button
            type="button"
            onClick={onBlogClick}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-left transition-colors cursor-pointer group ${isBlogActive
                ? 'bg-[#141413] text-[#F6F0E0]'
                : 'text-[#5C574C] hover:text-[#141413] hover:bg-[#E6DFCB]'
              }`}
          >
            <SiBloglovin className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
            <span className="font-mono uppercase tracking-[0.12em] text-[12px] font-bold">Blog</span>
          </button>

          {/* Playground / Game button */}
          <button
            type="button"
            onClick={onPlaygroundClick}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-left transition-colors cursor-pointer group ${isPlaygroundActive
                ? 'bg-[#141413] text-[#F6F0E0]'
                : 'text-[#5C574C] hover:text-[#141413] hover:bg-[#E6DFCB]'
              }`}
          >
            <PiGameControllerFill className="h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110" />
            <span className="font-mono uppercase tracking-[0.12em] text-[12px] font-bold">Game</span>
          </button>

          <div className="py-2">
            <div className="flex items-center justify-between px-3 pb-2 border-b-2 border-[#141413] mb-2">
              <span className="text-[11px] font-bold tracking-[0.12em] text-[#141413] uppercase font-mono">
                CTF EVENTS ({sortedTree.length})
              </span>
              
              {/* Ascending / Descending toggle button with React Icon */}
              <button
                type="button"
                onClick={cycleSortOrder}
                title={`Urutan: ${sortOrder === 'newest' ? 'Terbaru di atas (Descending)' : sortOrder === 'oldest' ? 'Terlama di atas (Ascending)' : 'Alfabetis (A-Z)'}. Klik untuk ganti.`}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono transition-all border border-[#141413]/20 bg-white/40 hover:bg-[#E6DFCB] text-[#141413] cursor-pointer group"
              >
                {sortOrder === 'newest' && (
                  <>
                    <FaSortAmountDown className="h-3 w-3 text-[#BF3511] transition-transform group-hover:scale-110" />
                    <span className="text-[10px] font-mono font-semibold text-[#BF3511]">Newest</span>
                  </>
                )}
                {sortOrder === 'oldest' && (
                  <>
                    <FaSortAmountUpAlt className="h-3 w-3 text-[#141413] transition-transform group-hover:scale-110" />
                    <span className="text-[10px] font-mono font-semibold text-[#141413]">Oldest</span>
                  </>
                )}
                {sortOrder === 'az' && (
                  <>
                    <FaSortAlphaDown className="h-3 w-3 text-[#141413] transition-transform group-hover:scale-110" />
                    <span className="text-[10px] font-mono font-semibold text-[#141413]">A-Z</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-1">
              {sortedTree.map((event) => {
                const isActive = activeEventSlug === event.slug;
                return (
                  <button
                    key={event.slug}
                    type="button"
                    onClick={() => {
                      onEventClick?.(event.slug);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all cursor-pointer group outline-none rounded-sm
                      ${isActive
                        ? 'bg-[#141413] text-[#F6F0E0] border-l-4 border-l-[#BF3511] font-semibold'
                        : 'text-[#1B1A17] hover:bg-[#141413] hover:text-[#F6F0E0] focus:bg-[#141413] focus:text-[#F6F0E0] border-l-4 border-l-transparent'
                      }
                    `}
                  >
                    <span className="shrink-0">{getEventIcon(event.name)}</span>
                    <span className="truncate font-serif text-[16px]">{event.name}</span>
                    <span className={`text-[12px] ml-auto font-mono shrink-0 ${isActive ? 'text-[#F6F0E0]/80' : 'text-[#5C574C] group-hover:text-[#F6F0E0]/80 group-focus:text-[#F6F0E0]/80'}`}>
                      {event.totalWriteups}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
        {renderSidebarFooter()}
      </div>
    );
  }

  // Fallback tree rendering
  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-10rem)]">
      <nav className="space-y-1.5 flex-1">
        {/* Home button */}
        <button
          onClick={onHomeClick}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-left transition-colors cursor-pointer group ${(!activeEventSlug && !isBlogActive && !isPlaygroundActive)
            ? 'bg-[#141413] text-[#F6F0E0]'
            : 'text-[#5C574C] hover:text-[#141413] hover:bg-[#E6DFCB]'
          }`}
        >
          <FaHome className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
          <span className="font-mono uppercase tracking-[0.12em] text-[12px] font-bold">Home</span>
        </button>

        {/* Blog button */}
        <button
          onClick={onBlogClick}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-left transition-colors cursor-pointer group ${isBlogActive
            ? 'bg-[#141413] text-[#F6F0E0]'
            : 'text-[#5C574C] hover:text-[#141413] hover:bg-[#E6DFCB]'
          }`}
        >
          <SiBloglovin className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
          <span className="font-mono uppercase tracking-[0.12em] text-[12px] font-bold">Blog</span>
        </button>

        {/* Playground / Game button */}
        <button
          onClick={onPlaygroundClick}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-left transition-colors cursor-pointer group ${isPlaygroundActive
            ? 'bg-[#141413] text-[#F6F0E0]'
            : 'text-[#5C574C] hover:text-[#141413] hover:bg-[#E6DFCB]'
          }`}
        >
          <PiGameControllerFill className="h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110" />
          <span className="font-mono uppercase tracking-[0.12em] text-[12px] font-bold">Game</span>
        </button>

        <div className="py-2">
          <div className="flex items-center justify-between px-3 pb-2 border-b-2 border-[#141413] mb-2">
            <span className="text-[11px] font-bold tracking-[0.12em] text-[#141413] uppercase font-mono">
              CTF EVENTS ({sortedTree.length})
            </span>
            <button
              type="button"
              onClick={cycleSortOrder}
              title={`Urutan: ${sortOrder === 'newest' ? 'Terbaru di atas (Descending)' : sortOrder === 'oldest' ? 'Terlama di atas (Ascending)' : 'Alfabetis (A-Z)'}. Klik untuk ganti.`}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono transition-all border border-[#141413]/20 bg-white/40 hover:bg-[#E6DFCB] text-[#141413] cursor-pointer group"
            >
              {sortOrder === 'newest' && (
                <>
                  <FaSortAmountDown className="h-3 w-3 text-[#BF3511] transition-transform group-hover:scale-110" />
                  <span className="text-[10px] font-mono font-semibold text-[#BF3511]">Newest</span>
                </>
              )}
              {sortOrder === 'oldest' && (
                <>
                  <FaSortAmountUpAlt className="h-3 w-3 text-[#141413] transition-transform group-hover:scale-110" />
                  <span className="text-[10px] font-mono font-semibold text-[#141413]">Oldest</span>
                </>
              )}
              {sortOrder === 'az' && (
                <>
                  <FaSortAlphaDown className="h-3 w-3 text-[#141413] transition-transform group-hover:scale-110" />
                  <span className="text-[10px] font-mono font-semibold text-[#141413]">A-Z</span>
                </>
              )}
            </button>
          </div>

          {/* Events */}
          {sortedTree.map((event) => {
            const isActive = activeEventSlug === event.slug;
            return (
              <div key={event.slug} className="space-y-1">
                <div className="flex items-center gap-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleEvent(event.slug);
                    }}
                    aria-expanded={expandedEvents.has(event.slug)}
                    className="rounded p-2 text-[#5C574C] hover:bg-[#E6DFCB] hover:text-[#141413] transition-colors cursor-pointer"
                    title="Expand/collapse"
                  >
                    <span className={`inline-block text-xs transition-transform duration-200 ${expandedEvents.has(event.slug) ? 'rotate-90' : ''}`}>
                      ▶
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      if (!expandedEvents.has(event.slug)) {
                        setExpandedEvents(new Set([...expandedEvents, event.slug]));
                      }
                      onEventClick?.(event.slug);
                    }}
                    className={`
                      flex-1 px-3 py-2 text-left transition-all flex items-center justify-between cursor-pointer group outline-none rounded-sm
                      ${isActive
                        ? 'bg-[#141413] text-[#F6F0E0] border-l-4 border-l-[#BF3511] font-semibold'
                        : 'text-[#1B1A17] hover:bg-[#141413] hover:text-[#F6F0E0] focus:bg-[#141413] focus:text-[#F6F0E0] border-l-4 border-l-transparent'
                      }
                    `}
                  >
                    <span className="flex items-center gap-2">
                      <span className="shrink-0">{getEventIcon(event.name)}</span>
                      <span className="truncate font-serif text-[16px]">{event.name}</span>
                    </span>
                    <span className={`text-[12px] font-mono shrink-0 ${isActive ? 'text-[#F6F0E0]/80' : 'text-[#5C574C] group-hover:text-[#F6F0E0]/80 group-focus:text-[#F6F0E0]/80'}`}>
                      {event.totalWriteups}
                    </span>
                  </button>
                </div>

                {expandedEvents.has(event.slug) && (
                <div className="ml-2 space-y-1 border-l border-[var(--docs-border-soft)] pl-2">
                  {event.categories.map((category) => (
                    <div key={`${event.slug}-${category.slug}`} className="space-y-1">
                      <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--docs-text-soft)]">
                        {category.name}
                      </div>

                      <div className="space-y-0">
                        {category.writeups.map((writeup) => (
                          <button
                            key={writeup.id}
                            onClick={() => onWriteupClick?.(writeup.id)}
                            title={writeup.title}
                            className={`
                              block w-full rounded px-3 py-1.5 text-left text-xs
                              transition-colors truncate cursor-pointer
                              ${activeWriteupId === writeup.id
                                ? 'bg-[var(--docs-accent-soft)] text-[var(--docs-accent)] font-medium'
                                : 'text-[var(--docs-text-muted)] hover:bg-[var(--docs-surface-hover)] hover:text-[var(--docs-text)]'
                              }
                            `}
                          >
                            {writeup.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
          </div>
      </nav>
      {renderSidebarFooter()}
    </div>
  );
}
