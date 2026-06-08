import React, { useState } from 'react';
import { DocsTopbar } from './DocsTopbar';
import { DocsSidebar } from './DocsSidebar';
import { DocsToc } from './DocsToc';

interface DocsLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  toc?: Array<{ id: string; label: string; depth?: number }>;
  title?: string;
  onHomeClick?: () => void;
  onSearchClick?: () => void;
}

export function DocsLayout({
  children,
  sidebar,
  toc,
  title,
  onHomeClick,
  onSearchClick,
}: DocsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-[var(--docs-bg)] text-[var(--docs-text)]">
      {/* Fixed Topbar */}
      <DocsTopbar
        title={title}
        onHomeClick={onHomeClick}
        onSearchClick={onSearchClick}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={`
            hidden w-64 flex-shrink-0 border-r border-[var(--docs-border-soft)] bg-[var(--docs-bg-soft)]
            overflow-y-auto
            lg:block
            ${sidebarOpen ? 'fixed inset-y-16 left-0 z-40 w-72 block' : ''}
          `}
        >
          <nav className="space-y-1 p-6" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
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
        <main className="flex-1 overflow-y-auto bg-[var(--docs-bg)]">
          <div className={`mx-auto px-6 py-8 transition-all duration-300 ${
            toc && toc.length > 0 
              ? 'max-w-4xl xl:max-w-5xl' 
              : 'max-w-4xl'
          }`}>
            {children}
          </div>
        </main>

        {/* Right TOC Sidebar */}
        {toc && toc.length > 0 && (
          <aside className="hidden w-72 xl:w-80 flex-shrink-0 border-l border-[var(--docs-border-soft)] bg-[var(--docs-bg)] lg:block overflow-y-auto">
            <div className="p-6">
              <DocsToc items={toc} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
