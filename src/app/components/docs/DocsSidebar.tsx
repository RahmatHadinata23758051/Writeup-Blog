import React, { useState, useEffect } from 'react';
import type { DocsEventNode } from '../../data/docsTree';

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
  FaBug
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
                ? 'bg-[var(--docs-text)] text-[var(--docs-bg)]'
                : 'text-[var(--docs-text-muted)] hover:text-[var(--docs-text)] hover:bg-[var(--docs-surface-hover)]'
              }`}
          >
            <FaHome className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
            <span className="font-sans uppercase tracking-wider text-[13px] font-bold">Home</span>
          </button>

          {/* Blog button */}
          <button
            type="button"
            onClick={onBlogClick}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-left transition-colors cursor-pointer group ${isBlogActive
                ? 'bg-[var(--docs-text)] text-[var(--docs-bg)] font-bold'
                : 'text-[var(--docs-text-muted)] hover:text-[var(--docs-text)] hover:bg-[var(--docs-surface-hover)]'
              }`}
          >
            <SiBloglovin className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
            <span className="font-sans uppercase tracking-wider text-[13px] font-bold">Blog</span>
          </button>

          {/* Playground / Game button */}
          <button
            type="button"
            onClick={onPlaygroundClick}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-left transition-colors cursor-pointer group ${isPlaygroundActive
                ? 'bg-[var(--docs-text)] text-[var(--docs-bg)] font-bold'
                : 'text-[var(--docs-text-muted)] hover:text-[var(--docs-text)] hover:bg-[var(--docs-surface-hover)]'
              }`}
          >
            <PiGameControllerFill className="h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110" />
            <span className="font-sans uppercase tracking-wider text-[13px] font-bold">Game</span>
          </button>

          <div className="py-2">
            <div className="px-3 pb-2 text-[12px] font-bold tracking-widest text-[var(--docs-text-soft)] uppercase font-sans border-b border-[var(--docs-border-soft)] mb-2">
              CTF EVENT WRITEUPS
            </div>
            <div className="space-y-1">
              {tree?.map((event) => {
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
                      w-full flex items-center gap-2.5 px-3 py-2 rounded text-left transition-all cursor-pointer group
                      ${isActive
                        ? 'bg-[var(--docs-text)] text-[var(--docs-bg)] font-bold'
                        : 'text-[var(--docs-text-muted)] hover:text-[var(--docs-text)] hover:bg-[var(--docs-surface-hover)]'
                      }
                    `}
                  >
                    {getEventIcon(event.name)}
                    <span className="truncate font-sans font-medium text-[13.5px]">{event.name}</span>
                    <span className={`text-[12px] ml-auto font-mono ${isActive ? 'text-[var(--docs-bg)]/80' : 'text-[var(--docs-text-soft)]'}`}>
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
      <nav className="space-y-1 flex-1">
        {/* Home button */}
        <button
          onClick={onHomeClick}
          className={`w-full rounded px-3 py-2 text-left text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 group ${(!activeEventSlug && !isBlogActive && !isPlaygroundActive)
            ? 'bg-[var(--docs-surface)] text-[var(--docs-text)] font-semibold'
            : 'text-[var(--docs-text-muted)] hover:bg-[var(--docs-surface-hover)] hover:text-[var(--docs-text)]'
          }`}
        >
          <FaHome className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
          <span>Home</span>
        </button>

        {/* Blog button */}
        <button
          onClick={onBlogClick}
          className={`w-full rounded px-3 py-2 text-left text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 group ${isBlogActive
            ? 'bg-[var(--docs-surface)] text-[var(--docs-text)] font-semibold'
            : 'text-[var(--docs-text-muted)] hover:bg-[var(--docs-surface-hover)] hover:text-[var(--docs-text)]'
          }`}
        >
          <SiBloglovin className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
          <span>Blog</span>
        </button>

        {/* Playground / Game button */}
        <button
          onClick={onPlaygroundClick}
          className={`w-full rounded px-3 py-2 text-left text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 group ${isPlaygroundActive
            ? 'bg-[var(--docs-surface)] text-[var(--docs-text)] font-semibold'
            : 'text-[var(--docs-text-muted)] hover:bg-[var(--docs-surface-hover)] hover:text-[var(--docs-text)]'
          }`}
        >
          <PiGameControllerFill className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
          <span>Game</span>
        </button>

        {/* Events */}
        {tree?.map((event) => {
          return (
            <div key={event.slug} className="space-y-1">
              <div className="flex items-center gap-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleEvent(event.slug);
                  }}
                  aria-expanded={expandedEvents.has(event.slug)}
                  className="rounded p-2 text-[var(--docs-text-soft)] hover:bg-[var(--docs-surface-hover)] hover:text-[var(--docs-text)] transition-colors cursor-pointer"
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
                    flex-1 rounded px-3 py-2 text-left text-sm font-semibold
                    transition-colors flex items-center justify-between cursor-pointer group
                    ${activeEventSlug === event.slug
                      ? 'bg-[var(--docs-surface)] text-[var(--docs-text)]'
                      : 'text-[var(--docs-text-muted)] hover:bg-[var(--docs-surface-hover)] hover:text-[var(--docs-text)]'
                    }
                  `}
                >
                  <span className="flex items-center gap-1.5">
                    {getEventIcon(event.name)}
                    <span>{event.name}</span>
                  </span>
                  <span className="text-xs text-[var(--docs-text-soft)]">({event.totalWriteups})</span>
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
      </nav>
      {renderSidebarFooter()}
    </div>
  );
}
