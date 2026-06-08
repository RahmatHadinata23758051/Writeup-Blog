import React from 'react';

interface DocsTopbarProps {
  title?: string;
  onHomeClick?: () => void;
  onMenuClick?: () => void;
  onSearchClick?: () => void;
}

export function DocsTopbar({
  title = 'CTF Writeups',
  onHomeClick,
  onMenuClick,
  onSearchClick,
}: DocsTopbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--docs-border-soft)] bg-[var(--docs-bg)] backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        {/* Left: Brand & Menu Toggle */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="rounded-md p-2 hover:bg-[var(--docs-surface)] lg:hidden"
            aria-label="Toggle sidebar"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <button
            onClick={onHomeClick}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img
              src="/logo.png"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const sibling = e.currentTarget.nextElementSibling;
                if (sibling && sibling.classList.contains('emoji-fallback')) {
                  (sibling as HTMLElement).style.display = 'inline-block';
                }
              }}
              className="w-9 h-9 object-contain transition-transform duration-200 group-hover:scale-110"
              alt="Nattt Logo"
            />
            <span className="emoji-fallback text-3xl transition-transform duration-200 group-hover:scale-110" style={{ display: 'none' }}>
              🐤
            </span>
            <span className="text-2xl font-black font-display text-[var(--docs-text)] tracking-tight hover:line-through transition-all">
              Nattt
            </span>
          </button>
        </div>

        {/* Center: Search */}
        <div className="hidden flex-1 max-w-xs sm:flex">
          <button
            onClick={onSearchClick}
            className="w-full flex items-center gap-2 bg-[var(--docs-bg-soft)] border border-[var(--docs-border-soft)] hover:border-[var(--docs-text-soft)] rounded px-3 py-1.5 text-xs text-[var(--docs-text-muted)] text-left transition-all active:scale-[0.98] cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-[var(--docs-text-soft)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="font-sans font-light">Search archive...</span>
            <kbd className="ml-auto bg-[var(--docs-bg)] border border-[var(--docs-border-soft)] rounded text-[10px] px-1.5 py-0.5 text-[var(--docs-text-soft)] font-mono shadow-sm select-none">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right: Extras */}
        <div className="flex items-center gap-3">
          <a
            href="https://medium.com/@rsafei731"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md p-2 text-[var(--docs-text-soft)] hover:bg-[var(--docs-surface)] hover:text-[var(--docs-text)] transition-colors flex items-center justify-center"
            aria-label="Medium"
          >
            <svg
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              fillRule="evenodd"
              clipRule="evenodd"
            >
              <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm-2.426 14.741h-3.574v-.202l1.261-1.529c.134-.139.195-.335.162-.526v-5.304c.015-.147-.041-.293-.151-.392l-1.121-1.35v-.201h3.479l2.689 5.897 2.364-5.897h3.317v.201l-.958.919c-.083.063-.124.166-.106.269v6.748c-.018.103.023.206.106.269l.936.919v.201h-4.706v-.201l.969-.941c.095-.095.095-.123.095-.269v-5.455l-2.695 6.844h-.364l-3.137-6.844v4.587c-.026.193.038.387.174.526l1.26 1.529v.202z"/>
            </svg>
          </a>
          <a
            href="https://github.com/RahmatHadinata23758051"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md p-2 text-[var(--docs-text-soft)] hover:bg-[var(--docs-surface)] hover:text-[var(--docs-text)] transition-colors"
            aria-label="GitHub"
          >
            <svg
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}
