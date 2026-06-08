import React, { useState, useEffect, useRef } from 'react';
import type { DocsEventNode } from '../../data/docsTree';
import type { WriteUp } from '../../data/writeups';

interface SearchItem {
  id: string;
  title: string;
  ctfName: string;
  category: string;
  difficulty?: string;
  description?: string;
  tools?: string[];
  original: WriteUp;
}

interface DocsSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tree: DocsEventNode[];
  onWriteupSelect: (writeupId: string) => void;
}

// Flatten tree into searchable items
function flattenTree(tree: DocsEventNode[]): SearchItem[] {
  const items: SearchItem[] = [];

  for (const event of tree) {
    for (const category of event.categories) {
      for (const writeup of category.writeups) {
        items.push({
          id: writeup.id,
          title: writeup.title,
          ctfName: writeup.ctfName,
          category: writeup.category,
          difficulty: writeup.difficulty,
          description: writeup.original.description,
          tools: writeup.original.tools,
          original: writeup.original,
        });
      }
    }
  }

  return items;
}

// Simple search with basic ranking
function searchItems(query: string, items: SearchItem[]): SearchItem[] {
  if (!query.trim()) {
    // Return first 8 items if no query
    return items.slice(0, 8);
  }

  const lowerQuery = query.toLowerCase();

  // Score each item
  const scored = items.map((item) => {
    let score = 0;

    // Title match (highest priority)
    if (item.title.toLowerCase().includes(lowerQuery)) {
      score += 100;
      // Bonus if title starts with query
      if (item.title.toLowerCase().startsWith(lowerQuery)) {
        score += 50;
      }
    }

    // Event match (second priority)
    if (item.ctfName.toLowerCase().includes(lowerQuery)) {
      score += 50;
    }

    // Category match
    if (item.category.toLowerCase().includes(lowerQuery)) {
      score += 20;
    }

    // Difficulty match
    if (item.difficulty?.toLowerCase().includes(lowerQuery)) {
      score += 15;
    }

    // Description match
    if (item.description?.toLowerCase().includes(lowerQuery)) {
      score += 10;
    }

    // Tools match
    if (item.tools?.some((t) => t.toLowerCase().includes(lowerQuery))) {
      score += 15;
    }

    return { item, score };
  });

  // Filter and sort by score
  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)
    .slice(0, 10);
}

export function DocsSearch({
  open,
  onOpenChange,
  tree,
  onWriteupSelect,
}: DocsSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const allItems = flattenTree(tree);
  const results = searchItems(query, allItems);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      // Use setTimeout to ensure focus after render
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onOpenChange(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      const selected = results[selectedIndex];
      onWriteupSelect(selected.id);
      onOpenChange(false);
      setQuery('');
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) {
      onOpenChange(false);
    }
  };

  const handleResultClick = (item: SearchItem) => {
    onWriteupSelect(item.id);
    onOpenChange(false);
    setQuery('');
  };

  if (!open) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-24"
      role="dialog"
      aria-modal="true"
    >
      {/* Modal */}
      <div className="w-full max-w-2xl mx-4 sm:mx-auto rounded-lg border border-[var(--docs-border-soft)] bg-[var(--docs-bg-soft)] shadow-lg">
        {/* Search Input */}
        <div className="border-b border-[var(--docs-border-soft)] p-4">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search writeups by title, event, category, tools..."
            className="w-full bg-transparent px-2 text-[var(--docs-text)] placeholder-[var(--docs-text-soft)] outline-none"
          />
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <ul className="divide-y divide-[var(--docs-border-soft)]">
              {results.map((item, idx) => (
                <li
                  key={item.id}
                  onClick={() => handleResultClick(item)}
                  className={`cursor-pointer px-4 py-3 transition-colors ${
                    idx === selectedIndex
                      ? 'bg-[var(--docs-surface)] text-[var(--docs-text)]'
                      : 'hover:bg-[var(--docs-surface)] text-[var(--docs-text-muted)]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-[var(--docs-text)]">{item.title}</h3>
                      {item.difficulty && (
                        <span
                          className={`ml-2 flex-shrink-0 rounded px-2 py-0.5 text-xs ${
                            item.difficulty === 'Easy'
                              ? 'bg-[var(--docs-success)]/10 text-[var(--docs-success)]'
                              : item.difficulty === 'Medium'
                                ? 'bg-[var(--docs-accent)]/10 text-[var(--docs-accent)]'
                                : 'bg-[var(--docs-danger)]/10 text-[var(--docs-danger)]'
                          }`}
                        >
                          {item.difficulty}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-[var(--docs-text-soft)]">
                      {item.ctfName && <span>{item.ctfName}</span>}
                      {item.category && <span>•</span>}
                      {item.category && <span>{item.category}</span>}
                    </div>
                    {item.description && (
                      <p className="line-clamp-1 text-xs text-[var(--docs-text-soft)]">
                        {item.description}
                      </p>
                    )}
                    {item.tools && item.tools.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.tools.slice(0, 3).map((tool) => (
                          <span
                            key={tool}
                            className="rounded bg-[var(--docs-surface)] px-1.5 py-0.5 text-xs text-[var(--docs-text-muted)]"
                          >
                            {tool}
                          </span>
                        ))}
                        {item.tools.length > 3 && (
                          <span className="text-xs text-[var(--docs-text-soft)]">+{item.tools.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center text-[var(--docs-text-soft)]">
              No writeups found. Try a different search.
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="border-t border-[var(--docs-border-soft)] bg-[var(--docs-bg)] px-4 py-3 text-xs text-[var(--docs-text-soft)]">
          <div className="flex justify-between">
            <span>Enter to open • ↑↓ to navigate</span>
            <span>Esc to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
