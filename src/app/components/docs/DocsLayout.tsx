import React, { useState, useEffect } from 'react';
import { DocsTopbar } from './DocsTopbar';
import { DocsSidebar } from './DocsSidebar';
import { DocsToc } from './DocsToc';

interface DocsLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  toc?: Array<{ id: string; label: string; depth?: number }>;
  tocVariant?: 'default' | 'plain';
  title?: string;
  onHomeClick?: () => void;
  onSearchClick?: () => void;
  fullWidth?: boolean;
  showProgressBar?: boolean;
}

export function DocsLayout({
  children,
  sidebar,
  toc,
  tocVariant = 'default',
  title,
  onHomeClick,
  onSearchClick,
  fullWidth = false,
  showProgressBar = true,
}: DocsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const target = e.currentTarget;
    const totalScroll = target.scrollHeight - target.clientHeight;
    if (totalScroll > 0) {
      const progress = (target.scrollTop / totalScroll) * 100;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    } else {
      setScrollProgress(0);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[var(--docs-bg)] text-[var(--docs-text)]">
      {/* Fixed Topbar */}
      <div className="relative z-30">
        <DocsTopbar
          title={title}
          onHomeClick={onHomeClick}
          onSearchClick={onSearchClick}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        {/* Thin scroll progress bar right under top bar */}
        {showProgressBar && (
          <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-transparent overflow-hidden pointer-events-none">
            <div
              className="h-full bg-[var(--home-accent,#BF3511)] transition-all duration-75 ease-out"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={`
            hidden w-64 flex-shrink-0 border-r-2 border-[var(--hp-ink,#141413)] bg-[#EFE9D8]
            overflow-y-auto relative z-20
            lg:block
            ${sidebarOpen ? 'fixed inset-y-16 left-0 z-40 w-72 block shadow-2xl' : ''}
          `}
        >
          <nav className="space-y-1 p-4" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
            {sidebar || <DocsSidebar onHomeClick={onHomeClick} />}
          </nav>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto bg-[var(--docs-bg)]"
        >
          {fullWidth ? (
            <div className="w-full">
              {children}
            </div>
          ) : (
            <div className={`mx-auto px-6 py-8 transition-all duration-300 ${
              toc && toc.length > 0 
                ? 'max-w-4xl xl:max-w-5xl' 
                : 'max-w-4xl'
            }`}>
              {children}
            </div>
          )}
        </main>

        {/* Right TOC Sidebar */}
        {toc && toc.length > 0 && (
          <aside className="hidden w-72 xl:w-80 flex-shrink-0 border-l border-[var(--docs-border-soft)] bg-[var(--docs-bg)] lg:block overflow-y-auto">
            <div className="p-6">
              <DocsToc items={toc} variant={tocVariant} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
