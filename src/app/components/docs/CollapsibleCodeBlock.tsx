'use client';

import React, { useState, useRef, useCallback } from 'react';
import { BsChevronDown, BsChevronUp, BsCheck2, BsClipboard } from 'react-icons/bs';

export interface CollapsibleCodeBlockProps {
  code: string;
  command?: string;
  language?: string;
  title?: string;
  lineThreshold?: number;
  collapsedLines?: number;
}

const DEFAULT_LINE_THRESHOLD = 16;
const DEFAULT_COLLAPSED_LINES = 12;

export function CollapsibleCodeBlock({
  code = '',
  command,
  language = '',
  title,
  lineThreshold = DEFAULT_LINE_THRESHOLD,
  collapsedLines = DEFAULT_COLLAPSED_LINES,
}: CollapsibleCodeBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize code and calculate total lines
  const rawCode = (code || '').trimEnd();
  const codeLines = rawCode ? rawCode.split('\n') : [];
  const commandLinesCount = command ? 1 : 0;
  const totalLines = codeLines.length + commandLinesCount;
  const isLong = totalLines > lineThreshold;

  // Text to copy to clipboard
  const fullTextToCopy = command
    ? (rawCode ? `$ ${command}\n${rawCode}` : command)
    : rawCode;

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(fullTextToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently fail if clipboard is unavailable
    }
  }, [fullTextToCopy]);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => {
      const next = !prev;
      if (!next && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.top < 0) {
          containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
      return next;
    });
  }, []);

  // Compute visible lines for collapsed state
  const remainingLines = totalLines - collapsedLines;
  const visibleCodeLines = !isLong || isExpanded
    ? codeLines
    : codeLines.slice(0, Math.max(1, collapsedLines - commandLinesCount));

  // Language display cleanup
  const cleanLang = (language || (command ? 'bash' : '')).trim().toLowerCase();

  return (
    <div
      ref={containerRef}
      className="relative rounded-lg bg-[var(--docs-code-bg)] border border-[var(--docs-code-border)] my-4 shadow-sm group overflow-hidden transition-all duration-200"
    >
      {/* Top Bar: Language/title on left, line count & actions on right */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/5 bg-black/20 text-[11px] select-none">
        <div className="flex items-center gap-2">
          {cleanLang ? (
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--docs-accent)] bg-[var(--docs-accent-soft)] border border-[var(--docs-accent-border)] px-1.5 py-0.5 rounded">
              {cleanLang}
            </span>
          ) : (
            <span className="font-mono text-[10px] text-white/40 tracking-wider uppercase">
              Code
            </span>
          )}
          {title && (
            <span className="font-sans font-medium text-white/70 truncate max-w-xs">
              {title}
            </span>
          )}
          <span className="text-[10px] font-mono text-white/40">
            {totalLines} {totalLines === 1 ? 'line' : 'lines'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Collapse / Expand button in top bar if long code */}
          {isLong && (
            <button
              type="button"
              onClick={handleToggle}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={isExpanded ? 'Collapse code snippet' : 'Expand full code snippet'}
            >
              {isExpanded ? (
                <>
                  <BsChevronUp className="w-3 h-3" />
                  <span>Collapse</span>
                </>
              ) : (
                <>
                  <BsChevronDown className="w-3 h-3" />
                  <span>Show all</span>
                </>
              )}
            </button>
          )}

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded bg-[var(--docs-surface)] px-2.5 py-0.5 text-[9.5px] font-sans font-bold uppercase tracking-wider text-[var(--docs-text-muted)] hover:bg-[var(--docs-surface-hover)] hover:text-[var(--docs-text)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--docs-accent)] cursor-pointer"
            title="Copy to clipboard"
          >
            {copied ? (
              <>
                <BsCheck2 className="w-3 h-3 text-[var(--docs-success)]" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <BsClipboard className="w-2.5 h-2.5 opacity-60" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Area */}
      <div className="relative">
        <pre className="overflow-x-auto text-[11.5px] font-mono text-[var(--docs-code-text)] leading-relaxed whitespace-pre font-light p-3.5 pr-6 m-0">
          {command && (
            <code className="text-[var(--docs-accent)] font-semibold block">
              $ {command}
            </code>
          )}
          {rawCode && <code>{visibleCodeLines.join('\n')}</code>}
        </pre>

        {/* Bottom Fade Gradient when collapsed */}
        {isLong && !isExpanded && (
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--docs-code-bg)] via-[var(--docs-code-bg)]/80 to-transparent pointer-events-none" />
        )}
      </div>

      {/* Bottom Action Bar when code is collapsed */}
      {isLong && !isExpanded && (
        <div className="relative z-10 px-3.5 py-2.5 bg-[var(--docs-code-bg)] border-t border-white/5 flex items-center justify-center">
          <button
            type="button"
            onClick={handleToggle}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[11px] font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <BsChevronDown className="w-3 h-3 text-[var(--docs-accent)]" />
            <span>Show more ({remainingLines} more lines)</span>
          </button>
        </div>
      )}

      {/* Bottom Collapse Bar when code is expanded (for long code) */}
      {isLong && isExpanded && (
        <div className="relative px-3.5 py-2 bg-black/20 border-t border-white/5 flex items-center justify-between text-[11px] text-white/50">
          <span className="font-mono text-[10px]">
            Showing all {totalLines} lines
          </span>
          <button
            type="button"
            onClick={handleToggle}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <BsChevronUp className="w-3 h-3 text-[var(--docs-accent)]" />
            <span>Show less</span>
          </button>
        </div>
      )}
    </div>
  );
}